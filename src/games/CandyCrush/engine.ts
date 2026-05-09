import { NEON_COLORS } from '../../utils/constants';

export interface CandyPiece {
  id: number;
  type: number;
  row: number;
  col: number;
  isSpecial: boolean;
  specialType: 'none' | 'row' | 'col' | 'bomb';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  scale: number;
  alpha: number;
  isClearing: boolean;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface Match3GameState {
  grid: (CandyPiece | null)[][];
  score: number;
  level: number;
  moves: number;
  selectedPiece: CandyPiece | null;
  isAnimating: boolean;
  isProcessing: boolean;
  gameOver: boolean;
  gameStarted: boolean;
  particles: Particle[];
  comboCount: number;
  lastMatchTime: number;
}

export interface Match3Engine {
  getState(): Match3GameState;
  tick(deltaTime: number): void;
  reset(): void;
  handleClick(row: number, col: number): void;
  init(): void;
}

const GRID_SIZE = 8;
const CELL_SIZE = 60;
const CANVAS_SIZE = 480;
const CANDY_TYPES = 6;
const BASE_SCORE = 10;
const ANIMATION_SPEED = 0.15;

const CANDY_COLORS = [
  '#ff6b6b', // 红色糖果
  '#4ecdc4', // 青色糖果
  '#ffeaa7', // 黄色糖果
  '#a29bfe', // 紫色糖果
  '#fd79a8', // 粉色糖果
  '#00d2ff', // 蓝色糖果
];

export class CandyCrushEngine implements Match3Engine {
  private state: Match3GameState;
  private pieceIdCounter: number = 0;
  private particleIdCounter: number = 0;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): Match3GameState {
    return {
      grid: [],
      score: 0,
      level: 1,
      moves: 30,
      selectedPiece: null,
      isAnimating: false,
      isProcessing: false,
      gameOver: false,
      gameStarted: false,
      particles: [],
      comboCount: 0,
      lastMatchTime: 0
    };
  }

  init(): void {
    this.state = this.createInitialState();
    this.pieceIdCounter = 0;
    this.particleIdCounter = 0;
    this.initializeGrid();
    this.state.gameStarted = true;
    
    // Remove initial matches without scoring
    this.removeInitialMatches();
  }

  private initializeGrid(): void {
    this.state.grid = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      this.state.grid[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        this.state.grid[row][col] = this.createPiece(row, col);
      }
    }
  }

  private createPiece(row: number, col: number, type?: number): CandyPiece {
    const pieceType = type ?? Math.floor(Math.random() * CANDY_TYPES);
    return {
      id: this.pieceIdCounter++,
      type: pieceType,
      row,
      col,
      isSpecial: false,
      specialType: 'none',
      x: col * CELL_SIZE,
      y: row * CELL_SIZE,
      targetX: col * CELL_SIZE,
      targetY: row * CELL_SIZE,
      scale: 1,
      alpha: 1,
      isClearing: false
    };
  }

  private removeInitialMatches(): void {
    let hasMatches = true;
    let iterations = 0;
    const maxIterations = 100;

    while (hasMatches && iterations < maxIterations) {
      hasMatches = false;
      iterations++;

      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const piece = this.state.grid[row][col];
          if (!piece) continue;

          // Check horizontal
          if (col >= 2) {
            const left1 = this.state.grid[row][col - 1];
            const left2 = this.state.grid[row][col - 2];
            if (left1 && left2 && left1.type === piece.type && left2.type === piece.type) {
              piece.type = (piece.type + 1) % CANDY_TYPES;
              hasMatches = true;
            }
          }

          // Check vertical
          if (row >= 2) {
            const up1 = this.state.grid[row - 1][col];
            const up2 = this.state.grid[row - 2][col];
            if (up1 && up2 && up1.type === piece.type && up2.type === piece.type) {
              piece.type = (piece.type + 1) % CANDY_TYPES;
              hasMatches = true;
            }
          }
        }
      }
    }
  }

  getState(): Match3GameState {
    return this.state;
  }

  reset(): void {
    this.state = this.createInitialState();
    this.init();
  }

  tick(deltaTime: number): void {
    if (!this.state.gameStarted) return;

    // Update particles
    this.state.particles = this.state.particles.filter(p => {
      p.x += p.vx * deltaTime * 0.06;
      p.y += p.vy * deltaTime * 0.06;
      p.vy += 0.3 * deltaTime * 0.06;
      p.life -= deltaTime;
      return p.life > 0;
    });

    // Update piece animations
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const piece = this.state.grid[row][col];
        if (!piece) continue;

        // Animate position
        const dx = piece.targetX - piece.x;
        const dy = piece.targetY - piece.y;
        piece.x += dx * ANIMATION_SPEED * deltaTime * 0.06;
        piece.y += dy * ANIMATION_SPEED * deltaTime * 0.06;

        // Snap if close enough
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
          piece.x = piece.targetX;
          piece.y = piece.targetY;
        }

        // Animate scale
        if (piece.isClearing) {
          piece.scale -= 0.1 * deltaTime * 0.06;
          piece.alpha -= 0.1 * deltaTime * 0.06;
          if (piece.scale <= 0) {
            piece.scale = 0;
            piece.alpha = 0;
          }
        }
      }
    }

    // Check if animation is complete
    if (this.state.isProcessing) {
      this.checkAnimationComplete();
    }
  }

  private checkAnimationComplete(): void {
    let allSettled = true;
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const piece = this.state.grid[row][col];
        if (piece) {
          const dx = Math.abs(piece.targetX - piece.x);
          const dy = Math.abs(piece.targetY - piece.y);
          if (dx > 1 || dy > 1) {
            allSettled = false;
            break;
          }
        }
      }
      if (!allSettled) break;
    }

    if (allSettled && this.state.isProcessing) {
      this.processMatches();
    }
  }

  handleClick(row: number, col: number): void {
    if (this.state.isAnimating || this.state.isProcessing || this.state.gameOver) return;
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;

    const clickedPiece = this.state.grid[row][col];
    if (!clickedPiece) return;

    if (!this.state.selectedPiece) {
      this.state.selectedPiece = clickedPiece;
      clickedPiece.scale = 1.2;
    } else {
      const selected = this.state.selectedPiece;
      
      // Check if clicking on special piece to activate
      if (clickedPiece.isSpecial && clickedPiece !== selected) {
        this.activateSpecialPower(selected, clickedPiece);
        selected.scale = 1;
        this.state.selectedPiece = null;
        this.state.isProcessing = true;
        return;
      }

      // Check adjacency
      const rowDiff = Math.abs(selected.row - row);
      const colDiff = Math.abs(selected.col - col);

      if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        // Adjacent - try swap
        this.trySwap(selected, clickedPiece);
      } else {
        // Not adjacent - select new piece
        selected.scale = 1;
        this.state.selectedPiece = clickedPiece;
        clickedPiece.scale = 1.2;
      }
    }
  }

  private trySwap(piece1: CandyPiece, piece2: CandyPiece): void {
    this.state.isAnimating = true;
    piece1.scale = 1;
    this.state.selectedPiece = null;

    // Swap in grid
    this.swapPieces(piece1, piece2);

    // Check for matches
    const matches = this.findMatches();
    
    if (matches.length > 0) {
      this.state.moves--;
      this.state.comboCount = 0;
      this.processMatches();
    } else {
      // No match - swap back
      setTimeout(() => {
        this.swapPieces(piece1, piece2);
        this.state.isAnimating = false;
      }, 200);
    }
  }

  private swapPieces(piece1: CandyPiece, piece2: CandyPiece): void {
    const tempRow = piece1.row;
    const tempCol = piece1.col;
    
    piece1.row = piece2.row;
    piece1.col = piece2.col;
    piece2.row = tempRow;
    piece2.col = tempCol;

    this.state.grid[piece1.row][piece1.col] = piece1;
    this.state.grid[piece2.row][piece2.col] = piece2;

    piece1.targetX = piece1.col * CELL_SIZE;
    piece1.targetY = piece1.row * CELL_SIZE;
    piece2.targetX = piece2.col * CELL_SIZE;
    piece2.targetY = piece2.row * CELL_SIZE;
  }

  private findMatches(): { pieces: CandyPiece[], type: 'h' | 'v', length: number }[] {
    const matches: { pieces: CandyPiece[], type: 'h' | 'v', length: number }[] = [];
    const checked = new Set<number>();

    // Check horizontal matches
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        const piece = this.state.grid[row][col];
        if (!piece || piece.isClearing) continue;

        const match: CandyPiece[] = [piece];
        let nextCol = col + 1;
        
        while (nextCol < GRID_SIZE) {
          const nextPiece = this.state.grid[row][nextCol];
          if (!nextPiece || nextPiece.isClearing || nextPiece.type !== piece.type) break;
          match.push(nextPiece);
          nextCol++;
        }

        if (match.length >= 3) {
          const key = match.map(p => `${p.row},${p.col}`).join('|');
          if (!checked.has(key.hashCode?.() ?? 0)) {
            matches.push({ pieces: match, type: 'h', length: match.length });
            checked.add(key.hashCode?.() ?? 0);
          }
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 2; row++) {
        const piece = this.state.grid[row][col];
        if (!piece || piece.isClearing) continue;

        const match: CandyPiece[] = [piece];
        let nextRow = row + 1;
        
        while (nextRow < GRID_SIZE) {
          const nextPiece = this.state.grid[nextRow][col];
          if (!nextPiece || nextPiece.isClearing || nextPiece.type !== piece.type) break;
          match.push(nextPiece);
          nextRow++;
        }

        if (match.length >= 3) {
          const key = match.map(p => `${p.row},${p.col}`).join('|');
          if (!checked.has(key.hashCode?.() ?? 0)) {
            matches.push({ pieces: match, type: 'v', length: match.length });
          }
        }
      }
    }

    return matches;
  }

  private processMatches(): void {
    const matches = this.findMatches();
    
    if (matches.length === 0) {
      this.state.isProcessing = false;
      this.state.isAnimating = false;
      this.applyGravity();
      this.checkGameOver();
      return;
    }

    this.state.comboCount++;
    this.state.lastMatchTime = Date.now();

    // Clear matched pieces and apply effects
    const cleared = new Set<CandyPiece>();
    const specialsToCreate: { row: number, col: number, type: 'row' | 'col' | 'bomb', pieceType: number }[] = [];

    for (const match of matches) {
      // Check if we should create a special piece
      if (match.length >= 4) {
        const centerIndex = Math.floor(match.length / 2);
        const specialPiece = match.pieces[centerIndex];
        let specialType: 'row' | 'col' | 'bomb' = 'bomb';
        
        if (match.type === 'h' && match.length >= 4) specialType = 'row';
        else if (match.type === 'v' && match.length >= 4) specialType = 'col';
        
        specialsToCreate.push({
          row: specialPiece.row,
          col: specialPiece.col,
          type: specialType,
          pieceType: specialPiece.type
        });
      }

      // Check for existing special pieces in match
      for (const piece of match.pieces) {
        if (piece.isSpecial) {
          if (piece.specialType === 'row') {
            // Clear entire row
            for (let c = 0; c < GRID_SIZE; c++) {
              const p = this.state.grid[piece.row][c];
              if (p && !cleared.has(p)) {
                cleared.add(p);
                this.createParticles(p);
              }
            }
          } else if (piece.specialType === 'col') {
            // Clear entire column
            for (let r = 0; r < GRID_SIZE; r++) {
              const p = this.state.grid[r][piece.col];
              if (p && !cleared.has(p)) {
                cleared.add(p);
                this.createParticles(p);
              }
            }
          } else if (piece.specialType === 'bomb') {
            // Clear 3x3 area
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const r = piece.row + dr;
                const c = piece.col + dc;
                if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                  const p = this.state.grid[r][c];
                  if (p && !cleared.has(p)) {
                    cleared.add(p);
                    this.createParticles(p);
                  }
                }
              }
            }
          }
        }
        cleared.add(piece);
        this.createParticles(piece);
      }
    }

    // Calculate score
    const comboMultiplier = Math.min(this.state.comboCount, 5);
    const score = cleared.size * BASE_SCORE * comboMultiplier;
    this.state.score += score;

    // Mark pieces as clearing
    for (const piece of cleared) {
      piece.isClearing = true;
    }

    // Schedule piece removal and gravity
    setTimeout(() => {
      // Remove cleared pieces
      for (const piece of cleared) {
        const row = piece.row;
        const col = piece.col;
        if (this.state.grid[row][col] === piece) {
          this.state.grid[row][col] = null;
        }
      }

      // Create special pieces
      for (const special of specialsToCreate) {
        if (!this.state.grid[special.row][special.col]) {
          const newPiece = this.createPiece(special.row, special.col, special.pieceType);
          newPiece.isSpecial = true;
          newPiece.specialType = special.type;
          this.state.grid[special.row][special.col] = newPiece;
        }
      }

      this.applyGravity();
    }, 300);
  }

  private activateSpecialPower(selected: CandyPiece, target: CandyPiece): void {
    if (selected.isSpecial) {
      // Swap positions and activate
      const tempRow = selected.row;
      const tempCol = selected.col;
      selected.row = target.row;
      selected.col = target.col;
      target.row = tempRow;
      target.col = tempCol;
      
      this.state.grid[selected.row][selected.col] = selected;
      this.state.grid[target.row][target.col] = target;
      
      selected.targetX = selected.col * CELL_SIZE;
      selected.targetY = selected.row * CELL_SIZE;
      target.targetX = target.col * CELL_SIZE;
      target.targetY = target.row * CELL_SIZE;
      
      // Activate selected special
      const temp = selected;
      selected = target;
      target = temp;
    }

    // Activate target's special power
    if (target.isSpecial) {
      if (target.specialType === 'row') {
        for (let c = 0; c < GRID_SIZE; c++) {
          const p = this.state.grid[target.row][c];
          if (p) {
            p.isClearing = true;
            this.createParticles(p);
            this.state.score += BASE_SCORE;
          }
        }
      } else if (target.specialType === 'col') {
        for (let r = 0; r < GRID_SIZE; r++) {
          const p = this.state.grid[r][target.col];
          if (p) {
            p.isClearing = true;
            this.createParticles(p);
            this.state.score += BASE_SCORE;
          }
        }
      } else if (target.specialType === 'bomb') {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = target.row + dr;
            const c = target.col + dc;
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
              const p = this.state.grid[r][c];
              if (p) {
                p.isClearing = true;
                this.createParticles(p);
                this.state.score += BASE_SCORE;
              }
            }
          }
        }
      }
      this.state.moves--;
      this.state.isProcessing = true;
      this.state.comboCount = 0;
      
      setTimeout(() => {
        this.applyGravity();
      }, 300);
    }
  }

  private applyGravity(): void {
    let hasFalling = false;

    for (let col = 0; col < GRID_SIZE; col++) {
      // Find empty spaces and drop pieces
      let emptyRow = GRID_SIZE - 1;
      
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        const piece = this.state.grid[row][col];
        if (piece && !piece.isClearing) {
          if (row !== emptyRow) {
            // Move piece down
            this.state.grid[row][col] = null;
            piece.row = emptyRow;
            this.state.grid[emptyRow][col] = piece;
            piece.targetY = emptyRow * CELL_SIZE;
            hasFalling = true;
          }
          emptyRow--;
        } else if (piece && piece.isClearing) {
          this.state.grid[row][col] = null;
        }
      }

      // Fill empty spaces from top
      for (let row = emptyRow; row >= 0; row--) {
        const newPiece = this.createPiece(row, col);
        newPiece.y = (row - emptyRow - 1) * CELL_SIZE;
        newPiece.targetY = row * CELL_SIZE;
        this.state.grid[row][col] = newPiece;
        hasFalling = true;
      }
    }

    if (hasFalling) {
      setTimeout(() => {
        this.state.isProcessing = false;
        this.state.isAnimating = false;
        this.processMatches();
      }, 400);
    } else {
      this.state.isProcessing = false;
      this.state.isAnimating = false;
      this.checkGameOver();
    }
  }

  private createParticles(piece: CandyPiece): void {
    const color = CANDY_COLORS[piece.type] || NEON_COLORS.neonPink;
    const count = 8;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      
      this.state.particles.push({
        id: this.particleIdCounter++,
        x: piece.x + CELL_SIZE / 2,
        y: piece.y + CELL_SIZE / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color,
        life: 500,
        maxLife: 500,
        size: 4 + Math.random() * 4
      });
    }
  }

  private checkGameOver(): void {
    // Check if any valid moves exist
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const piece = this.state.grid[row][col];
        if (!piece) continue;

        // Check swap right
        if (col < GRID_SIZE - 1) {
          const right = this.state.grid[row][col + 1];
          if (right) {
            this.swapPiecesInGrid(piece, right);
            const matches = this.findMatches();
            this.swapPiecesInGrid(piece, right);
            if (matches.length > 0) return;
          }
        }

        // Check swap down
        if (row < GRID_SIZE - 1) {
          const down = this.state.grid[row + 1][col];
          if (down) {
            this.swapPiecesInGrid(piece, down);
            const matches = this.findMatches();
            this.swapPiecesInGrid(piece, down);
            if (matches.length > 0) return;
          }
        }
      }
    }

    // No valid moves or no moves left
    if (this.state.moves <= 0) {
      this.state.gameOver = true;
    }
  }

  private swapPiecesInGrid(piece1: CandyPiece, piece2: CandyPiece): void {
    const tempRow = piece1.row;
    const tempCol = piece1.col;
    piece1.row = piece2.row;
    piece1.col = piece2.col;
    piece2.row = tempRow;
    piece2.col = tempCol;
    this.state.grid[piece1.row][piece1.col] = piece1;
    this.state.grid[piece2.row][piece2.col] = piece2;
  }

  getCandyColors(): string[] {
    return CANDY_COLORS;
  }

  getGridSize(): number {
    return GRID_SIZE;
  }

  getCellSize(): number {
    return CELL_SIZE;
  }

  getCanvasSize(): number {
    return CANVAS_SIZE;
  }
}

// Polyfill for string hashCode
declare global {
  interface String {
    hashCode?: () => number;
  }
}

String.prototype.hashCode = function(): number {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};
