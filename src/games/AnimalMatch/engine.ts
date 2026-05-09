import { NEON_COLORS } from '../../utils/constants';

export interface AnimalPiece {
  id: number;
  type: number;
  row: number;
  col: number;
  isSpecial: boolean;
  specialType: 'none' | 'explosion' | 'lightning' | 'star' | 'magic';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  scale: number;
  alpha: number;
  isClearing: boolean;
  rotation: number;
  bouncePhase: number;
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
  type: 'star' | 'sparkle' | 'pop';
}

export interface AnimalGameState {
  grid: (AnimalPiece | null)[][];
  score: number;
  level: number;
  moves: number;
  selectedPiece: AnimalPiece | null;
  isAnimating: boolean;
  isProcessing: boolean;
  gameOver: boolean;
  gameStarted: boolean;
  particles: Particle[];
  comboCount: number;
  chainCount: number;
  scorePopup: { x: number, y: number, value: number, life: number } | null;
}

export interface AnimalEngine {
  getState(): AnimalGameState;
  tick(deltaTime: number): void;
  reset(): void;
  handleClick(row: number, col: number): void;
  init(): void;
}

const GRID_SIZE = 8;
const CELL_SIZE = 60;
const CANVAS_SIZE = 480;
const ANIMAL_TYPES = 6;
const BASE_SCORE = 10;
const ANIMATION_SPEED = 0.17;

const ANIMAL_DATA = [
  { emoji: '🐱', color: '#ff9f43', name: 'cat' },
  { emoji: '🐶', color: '#54a0ff', name: 'dog' },
  { emoji: '🐰', color: '#ff6b9d', name: 'bunny' },
  { emoji: '🐼', color: '#576574', name: 'panda' },
  { emoji: '🦊', color: '#ff6b6b', name: 'fox' },
  { emoji: '🐸', color: '#1dd1a1', name: 'frog' },
];

export class AnimalMatchEngine implements AnimalEngine {
  private state: AnimalGameState;
  private pieceIdCounter: number = 0;
  private particleIdCounter: number = 0;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): AnimalGameState {
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
      chainCount: 0,
      scorePopup: null
    };
  }

  init(): void {
    this.state = this.createInitialState();
    this.pieceIdCounter = 0;
    this.particleIdCounter = 0;
    this.initializeGrid();
    this.state.gameStarted = true;
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

  private createPiece(row: number, col: number, type?: number): AnimalPiece {
    const pieceType = type ?? Math.floor(Math.random() * ANIMAL_TYPES);
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
      isClearing: false,
      rotation: 0,
      bouncePhase: Math.random() * Math.PI * 2
    };
  }

  private removeInitialMatches(): void {
    let hasMatches = true;
    let iterations = 0;

    while (hasMatches && iterations < 100) {
      hasMatches = false;
      iterations++;

      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const piece = this.state.grid[row][col];
          if (!piece) continue;

          if (col >= 2) {
            const left1 = this.state.grid[row][col - 1];
            const left2 = this.state.grid[row][col - 2];
            if (left1 && left2 && left1.type === piece.type && left2.type === piece.type) {
              piece.type = (piece.type + 1) % ANIMAL_TYPES;
              hasMatches = true;
            }
          }

          if (row >= 2) {
            const up1 = this.state.grid[row - 1][col];
            const up2 = this.state.grid[row - 2][col];
            if (up1 && up2 && up1.type === piece.type && up2.type === piece.type) {
              piece.type = (piece.type + 1) % ANIMAL_TYPES;
              hasMatches = true;
            }
          }
        }
      }
    }
  }

  getState(): AnimalGameState {
    return this.state;
  }

  reset(): void {
    this.state = this.createInitialState();
    this.init();
  }

  tick(deltaTime: number): void {
    if (!this.state.gameStarted) return;

    this.state.particles = this.state.particles.filter(p => {
      p.x += p.vx * deltaTime * 0.05;
      p.y += p.vy * deltaTime * 0.05;
      p.vy += 0.1 * deltaTime * 0.05;
      p.life -= deltaTime;
      return p.life > 0;
    });

    // Update score popup
    if (this.state.scorePopup) {
      this.state.scorePopup.y -= 1;
      this.state.scorePopup.life -= deltaTime;
      if (this.state.scorePopup.life <= 0) {
        this.state.scorePopup = null;
      }
    }

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const piece = this.state.grid[row][col];
        if (!piece) continue;

        const dx = piece.targetX - piece.x;
        const dy = piece.targetY - piece.y;
        piece.x += dx * ANIMATION_SPEED * deltaTime * 0.05;
        piece.y += dy * ANIMATION_SPEED * deltaTime * 0.05;

        piece.bouncePhase += deltaTime * 0.006;
        if (piece.rotation !== 0) {
          piece.rotation += deltaTime * 0.005;
        }

        if (piece.isClearing) {
          piece.scale -= 0.12 * deltaTime * 0.05;
          piece.alpha -= 0.12 * deltaTime * 0.05;
          if (piece.scale <= 0) {
            piece.scale = 0;
            piece.alpha = 0;
          }
        }
      }
    }

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

      if (clickedPiece.isSpecial && clickedPiece !== selected) {
        this.activateSpecialPower(selected, clickedPiece);
        selected.scale = 1;
        this.state.selectedPiece = null;
        this.state.isProcessing = true;
        return;
      }

      const rowDiff = Math.abs(selected.row - row);
      const colDiff = Math.abs(selected.col - col);

      if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        this.trySwap(selected, clickedPiece);
      } else {
        selected.scale = 1;
        this.state.selectedPiece = clickedPiece;
        clickedPiece.scale = 1.2;
      }
    }
  }

  private trySwap(piece1: AnimalPiece, piece2: AnimalPiece): void {
    this.state.isAnimating = true;
    piece1.scale = 1;
    this.state.selectedPiece = null;

    this.swapPieces(piece1, piece2);

    const matches = this.findMatches();

    if (matches.length > 0) {
      this.state.moves--;
      this.state.comboCount = 0;
      this.state.chainCount = 0;
      this.processMatches();
    } else {
      setTimeout(() => {
        this.swapPieces(piece1, piece2);
        this.state.isAnimating = false;
      }, 200);
    }
  }

  private swapPieces(piece1: AnimalPiece, piece2: AnimalPiece): void {
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

  private findMatches(): { pieces: AnimalPiece[], type: 'h' | 'v', length: number }[] {
    const matches: { pieces: AnimalPiece[], type: 'h' | 'v', length: number }[] = [];
    const checked = new Set<string>();

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        const piece = this.state.grid[row][col];
        if (!piece || piece.isClearing) continue;

        const match: AnimalPiece[] = [piece];
        let nextCol = col + 1;

        while (nextCol < GRID_SIZE) {
          const nextPiece = this.state.grid[row][nextCol];
          if (!nextPiece || nextPiece.isClearing || nextPiece.type !== piece.type) break;
          match.push(nextPiece);
          nextCol++;
        }

        if (match.length >= 3) {
          const key = match.map(p => `${p.row},${p.col}`).join('|');
          if (!checked.has(key)) {
            matches.push({ pieces: match, type: 'h', length: match.length });
            checked.add(key);
          }
        }
      }
    }

    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 2; row++) {
        const piece = this.state.grid[row][col];
        if (!piece || piece.isClearing) continue;

        const match: AnimalPiece[] = [piece];
        let nextRow = row + 1;

        while (nextRow < GRID_SIZE) {
          const nextPiece = this.state.grid[nextRow][col];
          if (!nextPiece || nextPiece.isClearing || nextPiece.type !== piece.type) break;
          match.push(nextPiece);
          nextRow++;
        }

        if (match.length >= 3) {
          const key = match.map(p => `${p.row},${p.col}`).join('|');
          if (!checked.has(key)) {
            matches.push({ pieces: match, type: 'v', length: match.length });
            checked.add(key);
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
    this.state.chainCount++;

    const cleared = new Set<AnimalPiece>();
    const specialsToCreate: { row: number, col: number, type: 'explosion' | 'lightning' | 'star' | 'magic', pieceType: number }[] = [];

    for (const match of matches) {
      if (match.length >= 4) {
        const centerIndex = Math.floor(match.length / 2);
        const specialPiece = match.pieces[centerIndex];
        let specialType: 'explosion' | 'lightning' | 'star' | 'magic' = 'star';
        
        if (match.length === 4) specialType = 'explosion';
        else if (match.length === 5) specialType = 'lightning';
        else specialType = 'magic';

        specialsToCreate.push({
          row: specialPiece.row,
          col: specialPiece.col,
          type: specialType,
          pieceType: specialPiece.type
        });
      }

      for (const piece of match.pieces) {
        if (piece.isSpecial) {
          this.activateExistingSpecial(piece, cleared);
        }
        cleared.add(piece);
        this.createAnimalParticles(piece);
      }
    }

    const comboMultiplier = Math.min(this.state.comboCount, 5);
    const chainBonus = this.state.chainCount > 1 ? this.state.chainCount * 0.5 : 0;
    const score = Math.floor((cleared.size * BASE_SCORE + 50) * (comboMultiplier + chainBonus));
    
    // Show score popup at center of cleared pieces
    let centerX = 0, centerY = 0, count = 0;
    for (const piece of cleared) {
      centerX += piece.x + CELL_SIZE / 2;
      centerY += piece.y + CELL_SIZE / 2;
      count++;
    }
    if (count > 0) {
      this.state.scorePopup = {
        x: centerX / count,
        y: centerY / count,
        value: score,
        life: 800
      };
    }

    this.state.score += score;

    for (const piece of cleared) {
      piece.isClearing = true;
    }

    setTimeout(() => {
      for (const piece of cleared) {
        const row = piece.row;
        const col = piece.col;
        if (this.state.grid[row][col] === piece) {
          this.state.grid[row][col] = null;
        }
      }

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

  private activateExistingSpecial(piece: AnimalPiece, cleared: Set<AnimalPiece>): void {
    if (piece.specialType === 'explosion') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = piece.row + dr;
          const c = piece.col + dc;
          if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
            const p = this.state.grid[r][c];
            if (p && !cleared.has(p)) {
              cleared.add(p);
              this.createAnimalParticles(p);
            }
          }
        }
      }
    } else if (piece.specialType === 'lightning') {
      // Cross pattern
      for (let i = 0; i < GRID_SIZE; i++) {
        const p1 = this.state.grid[piece.row][i];
        const p2 = this.state.grid[i][piece.col];
        if (p1 && !cleared.has(p1)) { cleared.add(p1); this.createAnimalParticles(p1); }
        if (p2 && !cleared.has(p2)) { cleared.add(p2); this.createAnimalParticles(p2); }
      }
    } else if (piece.specialType === 'star') {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const p = this.state.grid[r][c];
          if (p && p.type === piece.type && !cleared.has(p)) {
            cleared.add(p);
            this.createAnimalParticles(p);
          }
        }
      }
    } else if (piece.specialType === 'magic') {
      // Clear all pieces
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const p = this.state.grid[r][c];
          if (p && !cleared.has(p)) {
            cleared.add(p);
            this.createAnimalParticles(p);
          }
        }
      }
    }
  }

  private activateSpecialPower(selected: AnimalPiece, target: AnimalPiece): void {
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

    const temp = selected;
    selected = target;
    target = temp;

    this.activateExistingSpecial(target, new Set());
    this.state.moves--;
    this.state.isProcessing = true;
    this.state.chainCount = 0;

    setTimeout(() => {
      this.applyGravity();
    }, 300);
  }

  private applyGravity(): void {
    let hasFalling = false;

    for (let col = 0; col < GRID_SIZE; col++) {
      let emptyRow = GRID_SIZE - 1;

      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        const piece = this.state.grid[row][col];
        if (piece && !piece.isClearing) {
          if (row !== emptyRow) {
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

  private createAnimalParticles(piece: AnimalPiece): void {
    const animalColor = ANIMAL_DATA[piece.type]?.color || NEON_COLORS.neonPink;

    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      
      this.state.particles.push({
        id: this.particleIdCounter++,
        x: piece.x + CELL_SIZE / 2,
        y: piece.y + CELL_SIZE / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: animalColor,
        life: 500,
        maxLife: 500,
        size: 3 + Math.random() * 3,
        type: 'star'
      });
    }

    // Add sparkles for special pieces
    if (piece.isSpecial) {
      for (let i = 0; i < 5; i++) {
        this.state.particles.push({
          id: this.particleIdCounter++,
          x: piece.x + CELL_SIZE / 2 + (Math.random() - 0.5) * 30,
          y: piece.y + CELL_SIZE / 2 + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 3,
          vy: -1 - Math.random() * 2,
          color: '#ffd700',
          life: 700,
          maxLife: 700,
          size: 4 + Math.random() * 3,
          type: 'sparkle'
        });
      }
    }
  }

  private checkGameOver(): void {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const piece = this.state.grid[row][col];
        if (!piece) continue;

        if (col < GRID_SIZE - 1) {
          const right = this.state.grid[row][col + 1];
          if (right) {
            this.swapPiecesInGrid(piece, right);
            const matches = this.findMatches();
            this.swapPiecesInGrid(piece, right);
            if (matches.length > 0) return;
          }
        }

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

    if (this.state.moves <= 0) {
      this.state.gameOver = true;
    }
  }

  private swapPiecesInGrid(piece1: AnimalPiece, piece2: AnimalPiece): void {
    const tempRow = piece1.row;
    const tempCol = piece1.col;
    piece1.row = piece2.row;
    piece1.col = piece2.col;
    piece2.row = tempRow;
    piece2.col = tempCol;
    this.state.grid[piece1.row][piece1.col] = piece1;
    this.state.grid[piece2.row][piece2.col] = piece2;
  }

  getAnimalData(): typeof ANIMAL_DATA {
    return ANIMAL_DATA;
  }

  getGridSize(): number {
    return GRID_SIZE;
  }

  getCellSize(): number {
    return CELL_SIZE;
  }
}
