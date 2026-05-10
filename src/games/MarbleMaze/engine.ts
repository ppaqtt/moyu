// MarbleMaze Engine - 弹珠迷宫物理引擎

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export interface Hole {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
}

export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
}

export interface MarbleMazeState {
  ball: Ball;
  holes: Hole[];
  walls: Wall[];
  score: number;
  level: number;
  time: number;
  phase: 'playing' | 'win' | 'lose';
  tiltX: number;
  tiltY: number;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.5;
const FRICTION = 0.98;
const MAX_VELOCITY = 15;
const BALL_RADIUS = 12;

interface LevelData {
  ballStart: { x: number; y: number };
  holes: { x: number; y: number; radius: number }[];
  walls: { x1: number; y1: number; x2: number; y2: number; thickness: number }[];
  targetHole: { x: number; y: number };
}

const LEVELS: LevelData[] = [
  {
    ballStart: { x: 200, y: 100 },
    holes: [
      { x: 200, y: 500, radius: 25 }
    ],
    walls: [
      { x1: 50, y1: 200, x2: 350, y2: 200, thickness: 8 },
      { x1: 100, y1: 350, x2: 300, y2: 350, thickness: 8 },
      { x1: 50, y1: 200, x2: 50, y2: 350, thickness: 8 },
      { x1: 350, y1: 200, x2: 350, y2: 350, thickness: 8 },
    ],
    targetHole: { x: 200, y: 500 }
  },
  {
    ballStart: { x: 100, y: 80 },
    holes: [
      { x: 300, y: 520, radius: 25 }
    ],
    walls: [
      { x1: 0, y1: 150, x2: 300, y2: 150, thickness: 8 },
      { x1: 100, y1: 280, x2: 400, y2: 280, thickness: 8 },
      { x1: 50, y1: 400, x2: 350, y2: 400, thickness: 8 },
      { x1: 200, y1: 150, x2: 200, y2: 280, thickness: 8 },
    ],
    targetHole: { x: 300, y: 520 }
  },
  {
    ballStart: { x: 200, y: 60 },
    holes: [
      { x: 200, y: 540, radius: 25 }
    ],
    walls: [
      { x1: 80, y1: 150, x2: 320, y2: 150, thickness: 8 },
      { x1: 80, y1: 150, x2: 80, y2: 280, thickness: 8 },
      { x1: 320, y1: 150, x2: 320, y2: 280, thickness: 8 },
      { x1: 120, y1: 280, x2: 280, y2: 280, thickness: 8 },
      { x1: 120, y1: 280, x2: 120, y2: 400, thickness: 8 },
      { x1: 280, y1: 280, x2: 280, y2: 400, thickness: 8 },
      { x1: 160, y1: 400, x2: 240, y2: 400, thickness: 8 },
    ],
    targetHole: { x: 200, y: 540 }
  },
  {
    ballStart: { x: 60, y: 80 },
    holes: [
      { x: 340, y: 520, radius: 25 }
    ],
    walls: [
      { x1: 0, y1: 180, x2: 400, y2: 180, thickness: 8 },
      { x1: 200, y1: 180, x2: 200, y2: 320, thickness: 8 },
      { x1: 0, y1: 320, x2: 400, y2: 320, thickness: 8 },
      { x1: 100, y1: 320, x2: 100, y2: 450, thickness: 8 },
      { x1: 300, y1: 320, x2: 300, y2: 450, thickness: 8 },
    ],
    targetHole: { x: 340, y: 520 }
  },
  {
    ballStart: { x: 200, y: 50 },
    holes: [
      { x: 200, y: 550, radius: 25 }
    ],
    walls: [
      { x1: 100, y1: 120, x2: 300, y2: 120, thickness: 8 },
      { x1: 50, y1: 200, x2: 50, y2: 350, thickness: 8 },
      { x1: 350, y1: 200, x2: 350, y2: 350, thickness: 8 },
      { x1: 150, y1: 280, x2: 250, y2: 280, thickness: 8 },
      { x1: 100, y1: 420, x2: 300, y2: 420, thickness: 8 },
      { x1: 200, y1: 350, x2: 200, y2: 420, thickness: 8 },
    ],
    targetHole: { x: 200, y: 550 }
  }
];

export class MarbleMazeEngine {
  private ball: Ball;
  private holes: Hole[];
  private walls: Wall[];
  private score: number;
  private level: number;
  private time: number;
  private phase: 'playing' | 'win' | 'lose';
  private tiltX: number;
  private tiltY: number;
  private levelData: LevelData;

  constructor() {
    this.score = 0;
    this.level = 1;
    this.time = 0;
    this.phase = 'playing';
    this.tiltX = 0;
    this.tiltY = 0;
    this.levelData = LEVELS[0];
    
    this.ball = this.createBall();
    this.holes = this.createHoles();
    this.walls = this.createWalls();
    
    this.loadLevel(1);
  }

  private createBall(): Ball {
    return {
      x: 200,
      y: 100,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      color: '#ff6b6b'
    };
  }

  private createHoles(): Hole[] {
    return [];
  }

  private createWalls(): Wall[] {
    return [];
  }

  private loadLevel(levelNum: number): void {
    this.level = Math.min(levelNum, LEVELS.length);
    this.levelData = LEVELS[this.level - 1];
    this.phase = 'playing';
    this.time = 0;
    
    this.ball = {
      x: this.levelData.ballStart.x,
      y: this.levelData.ballStart.y,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      color: '#ff6b6b'
    };
    
    this.holes = this.levelData.holes.map((h, i) => ({
      x: h.x,
      y: h.y,
      radius: h.radius,
      collected: false
    }));
    
    this.walls = this.levelData.walls.map(w => ({
      ...w
    }));
  }

  getState(): MarbleMazeState {
    return {
      ball: { ...this.ball },
      holes: this.holes.map(h => ({ ...h })),
      walls: this.walls.map(w => ({ ...w })),
      score: this.score,
      level: this.level,
      time: this.time,
      phase: this.phase,
      tiltX: this.tiltX,
      tiltY: this.tiltY
    };
  }

  setTilt(x: number, y: number): void {
    this.tiltX = Math.max(-1, Math.min(1, x));
    this.tiltY = Math.max(-1, Math.min(1, y));
  }

  reset(): void {
    this.loadLevel(this.level);
  }

  nextLevel(): void {
    if (this.level < LEVELS.length) {
      this.level++;
      this.loadLevel(this.level);
    } else {
      this.phase = 'win';
    }
  }

  tick(): void {
    if (this.phase !== 'playing') return;
    
    this.time++;
    
    const accelX = this.tiltX * GRAVITY * 2;
    const accelY = this.tiltY * GRAVITY * 2;
    
    this.ball.vx += accelX;
    this.ball.vy += accelY;
    
    this.ball.vx *= FRICTION;
    this.ball.vy *= FRICTION;
    
    const speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
    if (speed > MAX_VELOCITY) {
      this.ball.vx = (this.ball.vx / speed) * MAX_VELOCITY;
      this.ball.vy = (this.ball.vy / speed) * MAX_VELOCITY;
    }
    
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;
    
    this.collideWalls();
    this.collideBoundaries();
    this.checkHoleCollision();
  }

  private collideWalls(): void {
    for (const wall of this.walls) {
      const result = this.pointToSegment(
        this.ball.x, this.ball.y,
        wall.x1, wall.y1, wall.x2, wall.y2
      );
      
      const effectiveRadius = this.ball.radius + wall.thickness / 2;
      
      if (result.dist < effectiveRadius) {
        const overlap = effectiveRadius - result.dist;
        this.ball.x += result.nx * overlap;
        this.ball.y += result.ny * overlap;
        
        const dot = this.ball.vx * result.nx + this.ball.vy * result.ny;
        this.ball.vx -= 2 * dot * result.nx * 0.7;
        this.ball.vy -= 2 * dot * result.ny * 0.7;
      }
    }
  }

  private pointToSegment(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): { dist: number; nx: number; ny: number } {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    
    if (lenSq === 0) {
      const d = Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
      return { dist: d, nx: d > 0 ? (px - x1) / d : 0, ny: d > 0 ? (py - y1) / d : -1 };
    }
    
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    const d = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
    
    let nx = d > 0 ? (px - cx) / d : 0;
    let ny = d > 0 ? (py - cy) / d : -1;
    
    return { dist: d, nx, ny };
  }

  private collideBoundaries(): void {
    if (this.ball.x - this.ball.radius < 0) {
      this.ball.x = this.ball.radius;
      this.ball.vx *= -0.7;
    }
    if (this.ball.x + this.ball.radius > CANVAS_WIDTH) {
      this.ball.x = CANVAS_WIDTH - this.ball.radius;
      this.ball.vx *= -0.7;
    }
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.y = this.ball.radius;
      this.ball.vy *= -0.7;
    }
    if (this.ball.y + this.ball.radius > CANVAS_HEIGHT) {
      this.ball.y = CANVAS_HEIGHT - this.ball.radius;
      this.ball.vy *= -0.7;
    }
  }

  private checkHoleCollision(): void {
    for (const hole of this.holes) {
      if (hole.collected) continue;
      
      const dx = this.ball.x - hole.x;
      const dy = this.ball.y - hole.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < hole.radius - this.ball.radius / 2) {
        hole.collected = true;
        
        const targetHole = this.levelData.targetHole;
        const isTarget = Math.abs(hole.x - targetHole.x) < 5 && Math.abs(hole.y - targetHole.y) < 5;
        
        if (isTarget) {
          const timeBonus = Math.max(0, 1000 - this.time);
          this.score += 1000 + timeBonus;
          this.phase = 'win';
        } else {
          this.score += 50;
        }
      }
    }
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
