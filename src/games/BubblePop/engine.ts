import { NEON_COLORS } from '../../utils/constants';

export interface Bubble {
  id: number;
  type: number;
  row: number;
  col: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  scale: number;
  alpha: number;
  isPopping: boolean;
  pulsePhase: number;
}

export interface ShooterBubble {
  id: number;
  type: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  alpha: number;
  isActive: boolean;
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
  type: 'bubble' | 'star';
}

export interface BubblePopState {
  grid: (Bubble | null)[][];
  shooterBubble: ShooterBubble;
  nextBubbleType: number;
  score: number;
  level: number;
  rows: number;
  gameOver: boolean;
  gameStarted: boolean;
  particles: Particle[];
  fallingBubbles: Bubble[];
  lastBubbleTime: number;
  rowHeight: number;
  colWidth: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface BubblePopEngine {
  getState(): BubblePopState;
  tick(deltaTime: number): void;
  reset(): void;
  handleClick(x: number, y: number): void;
  handleMouseMove(x: number, y: number): void;
  init(): void;
}

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const BUBBLE_RADIUS = 22;
const GRID_COLS = 11;
const GRID_ROWS = 12;
const BUBBLE_TYPES = 6;
const SHOOT_SPEED = 15;
const BASE_SCORE = 10;
const FALL_SPEED = 3;
const ROW_DROP_INTERVAL = 15000;

const BUBBLE_COLORS = [
  '#ff6b6b', // 红色
  '#4ecdc4', // 青色
  '#ffeaa7', // 黄色
  '#a29bfe', // 紫色
  '#fd79a8', // 粉色
  '#00d2ff', // 蓝色
];

export class BubblePopEngine implements BubblePopEngine {
  private state: BubblePopState;
  private bubbleIdCounter: number = 0;
  private particleIdCounter: number = 0;
  private aimAngle: number = -Math.PI / 2;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): BubblePopState {
    return {
      grid: [],
      shooterBubble: this.createShooterBubble(),
      nextBubbleType: Math.floor(Math.random() * BUBBLE_TYPES),
      score: 0,
      level: 1,
      rows: 5,
      gameOver: false,
      gameStarted: false,
      particles: [],
      fallingBubbles: [],
      lastBubbleTime: Date.now(),
      rowHeight: BUBBLE_RADIUS * 1.73,
      colWidth: BUBBLE_RADIUS * 2,
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT
    };
  }

  init(): void {
    this.state = this.createInitialState();
    this.bubbleIdCounter = 0;
    this.particleIdCounter = 0;
    this.initializeGrid();
    this.state.shooterBubble = this.createShooterBubble();
    this.state.gameStarted = true;
    this.state.lastBubbleTime = Date.now();
  }

  private initializeGrid(): void {
    this.state.grid = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      this.state.grid[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        if (this.isValidPosition(row, col)) {
          if (row < this.state.rows) {
            this.state.grid[row][col] = this.createBubble(row, col);
          } else {
            this.state.grid[row][col] = null;
          }
        } else {
          this.state.grid[row][col] = null;
        }
      }
    }
  }

  private isValidPosition(row: number, col: number): boolean {
    if (row % 2 === 0) {
      return col >= 0 && col < GRID_COLS;
    } else {
      return col >= 0 && col < GRID_COLS - 1;
    }
  }

  private createBubble(row: number, col: number, type?: number): Bubble {
    return {
      id: this.bubbleIdCounter++,
      type: type ?? Math.floor(Math.random() * BUBBLE_TYPES),
      row,
      col,
      x: this.getGridX(row, col),
      y: this.getGridY(row),
      targetX: this.getGridX(row, col),
      targetY: this.getGridY(row),
      scale: 1,
      alpha: 1,
      isPopping: false,
      pulsePhase: Math.random() * Math.PI * 2
    };
  }

  private createShooterBubble(): ShooterBubble {
    return {
      id: this.bubbleIdCounter++,
      type: Math.floor(Math.random() * BUBBLE_TYPES),
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 80,
      vx: 0,
      vy: 0,
      scale: 1,
      alpha: 1,
      isActive: false
    };
  }

  private getGridX(row: number, col: number): number {
    const offset = row % 2 === 1 ? BUBBLE_RADIUS : 0;
    return col * this.state.colWidth + BUBBLE_RADIUS + offset + (CANVAS_WIDTH - GRID_COLS * this.state.colWidth - BUBBLE_RADIUS) / 2;
  }

  private getGridY(row: number): number {
    return row * this.state.rowHeight + BUBBLE_RADIUS + 20;
  }

  getState(): BubblePopState {
    return this.state;
  }

  reset(): void {
    this.state = this.createInitialState();
    this.init();
  }

  tick(deltaTime: number): void {
    if (!this.state.gameStarted) return;

    const now = Date.now();

    // Drop new row periodically
    if (now - this.state.lastBubbleTime > ROW_DROP_INTERVAL) {
      this.dropNewRow();
      this.state.lastBubbleTime = now;
      this.state.level++;
    }

    // Update particles
    this.state.particles = this.state.particles.filter(p => {
      p.x += p.vx * deltaTime * 0.05;
      p.y += p.vy * deltaTime * 0.05;
      p.vy += 0.15 * deltaTime * 0.05;
      p.life -= deltaTime;
      return p.life > 0;
    });

    // Update shooter bubble
    if (this.state.shooterBubble.isActive) {
      this.state.shooterBubble.x += this.state.shooterBubble.vx * deltaTime * 0.05;
      this.state.shooterBubble.y += this.state.shooterBubble.vy * deltaTime * 0.05;

      // Wall collision
      if (this.state.shooterBubble.x < BUBBLE_RADIUS) {
        this.state.shooterBubble.x = BUBBLE_RADIUS;
        this.state.shooterBubble.vx *= -1;
      }
      if (this.state.shooterBubble.x > CANVAS_WIDTH - BUBBLE_RADIUS) {
        this.state.shooterBubble.x = CANVAS_WIDTH - BUBBLE_RADIUS;
        this.state.shooterBubble.vx *= -1;
      }

      // Top collision
      if (this.state.shooterBubble.y < BUBBLE_RADIUS + 20) {
        this.shootBubbleAttach();
        return;
      }

      // Grid collision
      const hit = this.checkBubbleCollision();
      if (hit) {
        this.shootBubbleAttach();
        return;
      }

      // Bottom line game over check
      if (this.state.shooterBubble.y > CANVAS_HEIGHT - 120) {
        this.state.gameOver = true;
      }
    }

    // Update falling bubbles
    this.state.fallingBubbles = this.state.fallingBubbles.filter(bubble => {
      bubble.y += FALL_SPEED * deltaTime * 0.05;
      bubble.alpha -= 0.02 * deltaTime * 0.05;
      return bubble.y < CANVAS_HEIGHT && bubble.alpha > 0;
    });

    // Update bubble animations
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const bubble = this.state.grid[row][col];
        if (bubble) {
          bubble.pulsePhase += deltaTime * 0.005;
          
          if (bubble.isPopping) {
            bubble.scale += 0.1 * deltaTime * 0.05;
            bubble.alpha -= 0.15 * deltaTime * 0.05;
            if (bubble.alpha <= 0) {
              this.state.grid[row][col] = null;
            }
          }
        }
      }
    }

    this.checkGameOver();
  }

  private checkBubbleCollision(): boolean {
    const sx = this.state.shooterBubble.x;
    const sy = this.state.shooterBubble.y;

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const bubble = this.state.grid[row][col];
        if (bubble && !bubble.isPopping) {
          const dx = sx - bubble.x;
          const dy = sy - bubble.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < BUBBLE_RADIUS * 2) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private shootBubbleAttach(): void {
    const sx = this.state.shooterBubble.x;
    const sy = this.state.shooterBubble.y;
    const type = this.state.shooterBubble.type;

    // Find nearest empty position
    let bestRow = 0;
    let bestCol = 0;
    let bestDist = Infinity;

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (this.isValidPosition(row, col) && !this.state.grid[row][col]) {
          const gx = this.getGridX(row, col);
          const gy = this.getGridY(row);
          const dx = sx - gx;
          const dy = sy - gy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < bestDist) {
            bestDist = dist;
            bestRow = row;
            bestCol = col;
          }
        }
      }
    }

    // Place bubble
    const newBubble = this.createBubble(bestRow, bestCol, type);
    this.state.grid[bestRow][bestCol] = newBubble;

    // Check for matches
    const matches = this.findMatches(bestRow, bestCol, type);
    if (matches.length >= 3) {
      this.popBubbles(matches);
    } else {
      this.nextShooterBubble();
    }
  }

  private findMatches(startRow: number, startCol: number, type: number): Bubble[] {
    const matches: Bubble[] = [];
    const visited = new Set<string>();
    const queue: { row: number, col: number }[] = [{ row: startRow, col: startCol }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.row},${current.col}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const bubble = this.state.grid[current.row]?.[current.col];
      if (!bubble || bubble.isPopping || bubble.type !== type) continue;

      matches.push(bubble);

      // Get neighbors
      const neighbors = this.getNeighbors(current.row, current.col);
      for (const neighbor of neighbors) {
        if (this.isValidPosition(neighbor.row, neighbor.col)) {
          queue.push(neighbor);
        }
      }
    }

    return matches;
  }

  private getNeighbors(row: number, col: number): { row: number, col: number }[] {
    const isOddRow = row % 2 === 1;
    
    if (isOddRow) {
      return [
        { row: row - 1, col: col },
        { row: row - 1, col: col + 1 },
        { row: row, col: col - 1 },
        { row: row, col: col + 1 },
        { row: row + 1, col: col },
        { row: row + 1, col: col + 1 }
      ];
    } else {
      return [
        { row: row - 1, col: col - 1 },
        { row: row - 1, col: col },
        { row: row, col: col - 1 },
        { row: row, col: col + 1 },
        { row: row + 1, col: col - 1 },
        { row: row + 1, col: col }
      ];
    }
  }

  private popBubbles(bubbles: Bubble[]): void {
    for (const bubble of bubbles) {
      bubble.isPopping = true;
      this.createBubbleParticles(bubble);
    }

    this.state.score += bubbles.length * BASE_SCORE;

    // Find floating bubbles
    setTimeout(() => {
      const floating = this.findFloatingBubbles();
      for (const bubble of floating) {
        this.state.fallingBubbles.push({ ...bubble, isPopping: false, alpha: 1, scale: 1 });
        this.state.grid[bubble.row][bubble.col] = null;
        this.state.score += BASE_SCORE * 2;
      }
      this.nextShooterBubble();
    }, 200);
  }

  private findFloatingBubbles(): Bubble[] {
    const attached = new Set<string>();
    const floating: Bubble[] = [];

    // BFS from top row
    const queue: { row: number, col: number }[] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      if (this.state.grid[0][col] && !this.state.grid[0][col]!.isPopping) {
        queue.push({ row: 0, col });
        attached.add(`0,${col}`);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      const bubble = this.state.grid[current.row][current.col];
      if (!bubble || bubble.isPopping) continue;

      const neighbors = this.getNeighbors(current.row, current.col);
      for (const neighbor of neighbors) {
        const key = `${neighbor.row},${neighbor.col}`;
        if (!this.isValidPosition(neighbor.row, neighbor.col)) continue;
        if (attached.has(key)) continue;

        const neighborBubble = this.state.grid[neighbor.row]?.[neighbor.col];
        if (neighborBubble && !neighborBubble.isPopping) {
          attached.add(key);
          queue.push(neighbor);
        }
      }
    }

    // Find bubbles not attached
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (this.isValidPosition(row, col)) {
          const bubble = this.state.grid[row][col];
          if (bubble && !bubble.isPopping && !attached.has(`${row},${col}`)) {
            floating.push(bubble);
          }
        }
      }
    }

    return floating;
  }

  private createBubbleParticles(bubble: Bubble): void {
    const color = BUBBLE_COLORS[bubble.type] || NEON_COLORS.neonPink;
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      
      this.state.particles.push({
        id: this.particleIdCounter++,
        x: bubble.x,
        y: bubble.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color,
        life: 500,
        maxLife: 500,
        size: 4 + Math.random() * 4,
        type: 'bubble'
      });
    }
  }

  private nextShooterBubble(): void {
    const nextType = this.state.nextBubbleType;
    this.state.shooterBubble = {
      id: this.bubbleIdCounter++,
      type: nextType,
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 80,
      vx: 0,
      vy: 0,
      scale: 1,
      alpha: 1,
      isActive: false
    };
    this.state.nextBubbleType = Math.floor(Math.random() * BUBBLE_TYPES);
  }

  private dropNewRow(): void {
    // Shift all rows down
    for (let row = GRID_ROWS - 1; row > 0; row--) {
      for (let col = 0; col < GRID_COLS; col++) {
        this.state.grid[row][col] = this.state.grid[row - 1][col];
        if (this.state.grid[row][col]) {
          this.state.grid[row][col]!.row = row;
          this.state.grid[row][col]!.targetY = this.getGridY(row);
        }
      }
    }

    // Add new row at top
    for (let col = 0; col < GRID_COLS; col++) {
      if (this.isValidPosition(0, col)) {
        this.state.grid[0][col] = this.createBubble(0, col);
      }
    }
  }

  handleClick(x: number, y: number): void {
    if (this.state.gameOver || !this.state.gameStarted) return;
    if (this.state.shooterBubble.isActive) return;

    const dx = x - this.state.shooterBubble.x;
    const dy = y - this.state.shooterBubble.y;
    const angle = Math.atan2(dy, dx);

    // Limit angle to prevent shooting downwards
    const limitedAngle = Math.max(Math.min(angle, -0.15), -Math.PI + 0.15);
    
    this.state.shooterBubble.vx = Math.cos(limitedAngle) * SHOOT_SPEED;
    this.state.shooterBubble.vy = Math.sin(limitedAngle) * SHOOT_SPEED;
    this.state.shooterBubble.isActive = true;
  }

  handleMouseMove(x: number, y: number): void {
    if (this.state.gameOver || !this.state.gameStarted) return;
    
    const dx = x - this.state.shooterBubble.x;
    const dy = y - this.state.shooterBubble.y;
    this.aimAngle = Math.atan2(dy, dx);
  }

  private checkGameOver(): void {
    // Check if any bubble in last two rows
    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = GRID_ROWS - 2; row < GRID_ROWS; row++) {
        if (this.isValidPosition(row, col) && this.state.grid[row][col] && !this.state.grid[row][col]!.isPopping) {
          if (this.state.grid[row][col]!.y > CANVAS_HEIGHT - 150) {
            this.state.gameOver = true;
            return;
          }
        }
      }
    }
  }

  getAimAngle(): number {
    return this.aimAngle;
  }

  getBubbleColors(): string[] {
    return BUBBLE_COLORS;
  }
}
