// CrashLab Engine - 碰撞实验室物理引擎

export interface CrashBall {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  color: string;
  elasticity: number;
}

export interface CrashWall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  angle: number;
  movable: boolean;
  originalX1: number;
  originalY1: number;
  originalX2: number;
  originalY2: number;
}

export interface CrashObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'circle' | 'rect' | 'triangle';
  color: string;
  rotation: number;
  angularVel: number;
}

export interface CrashLabState {
  balls: CrashBall[];
  walls: CrashWall[];
  obstacles: CrashObstacle[];
  score: number;
  collisions: number;
  mode: 'sandbox' | 'experiment' | 'race';
  experimentPhase: 'setup' | 'running' | 'complete';
  experimentTime: number;
  experimentTarget: number;
  trailEnabled: boolean;
  gravityEnabled: boolean;
  gravityX: number;
  gravityY: number;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const FRICTION = 0.99;
const GRAVITY = 0.3;
const MAX_BALLS = 15;

const BALL_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
  '#a29bfe', '#fd79a8', '#fdcb6e', '#6c5ce7', '#00b894'
];

export class CrashLabEngine {
  private balls: CrashBall[] = [];
  private walls: CrashWall[] = [];
  private obstacles: CrashObstacle[] = [];
  private score: number = 0;
  private collisions: number = 0;
  private mode: 'sandbox' | 'experiment' | 'race' = 'sandbox';
  private experimentPhase: 'setup' | 'running' | 'complete' = 'setup';
  private experimentTime: number = 0;
  private experimentTarget: number = 10;
  private trailEnabled: boolean = true;
  private gravityEnabled: boolean = true;
  private gravityX: number = 0;
  private gravityY: number = GRAVITY;
  private trails: Map<number, { x: number; y: number; age: number }[]> = new Map();
  private ballIdCounter: number = 0;

  constructor() {
    this.initWalls();
    this.initObstacles();
  }

  private initWalls(): void {
    const hw = CANVAS_WIDTH / 2;
    const hh = CANVAS_HEIGHT / 2;
    
    this.walls = [
      { x1: 10, y1: 10, x2: CANVAS_WIDTH - 10, y2: 10, thickness: 4, angle: 0, movable: false, originalX1: 10, originalY1: 10, originalX2: CANVAS_WIDTH - 10, originalY2: 10 },
      { x1: 10, y1: CANVAS_HEIGHT - 10, x2: CANVAS_WIDTH - 10, y2: CANVAS_HEIGHT - 10, thickness: 4, angle: 0, movable: false, originalX1: 10, originalY1: CANVAS_HEIGHT - 10, originalX2: CANVAS_WIDTH - 10, originalY2: CANVAS_HEIGHT - 10 },
      { x1: 10, y1: 10, x2: 10, y2: CANVAS_HEIGHT - 10, thickness: 4, angle: 0, movable: false, originalX1: 10, originalY1: 10, originalX2: 10, originalY2: CANVAS_HEIGHT - 10 },
      { x1: CANVAS_WIDTH - 10, y1: 10, x2: CANVAS_WIDTH - 10, y2: CANVAS_HEIGHT - 10, thickness: 4, angle: 0, movable: false, originalX1: CANVAS_WIDTH - 10, originalY1: 10, originalX2: CANVAS_WIDTH - 10, originalY2: CANVAS_HEIGHT - 10 },
      { x1: 100, y1: 200, x2: 200, y2: 150, thickness: 6, angle: Math.atan2(-50, 100), movable: true, originalX1: 100, originalY1: 200, originalX2: 200, originalY2: 150 },
      { x1: 200, y1: 400, x2: 300, y2: 350, thickness: 6, angle: Math.atan2(-50, 100), movable: true, originalX1: 200, originalY1: 400, originalX2: 300, originalY2: 350 },
    ];
  }

  private initObstacles(): void {
    this.obstacles = [
      { x: 150, y: 300, width: 60, height: 60, type: 'circle', color: '#ff6b6b40', rotation: 0, angularVel: 0.02 },
      { x: 250, y: 400, width: 80, height: 80, type: 'rect', color: '#4ecdc440', rotation: 0, angularVel: -0.01 },
      { x: 200, y: 200, width: 50, height: 50, type: 'triangle', color: '#45b7d140', rotation: 0, angularVel: 0.015 },
    ];
  }

  getState(): CrashLabState {
    return {
      balls: this.balls.map(b => ({ ...b })),
      walls: this.walls.map(w => ({ ...w })),
      obstacles: this.obstacles.map(o => ({ ...o })),
      score: this.score,
      collisions: this.collisions,
      mode: this.mode,
      experimentPhase: this.experimentPhase,
      experimentTime: this.experimentTime,
      experimentTarget: this.experimentTarget,
      trailEnabled: this.trailEnabled,
      gravityEnabled: this.gravityEnabled,
      gravityX: this.gravityX,
      gravityY: this.gravityY
    };
  }

  addBall(x: number, y: number, vx: number = 0, vy: number = 0): void {
    if (this.balls.length >= MAX_BALLS) return;
    
    const color = BALL_COLORS[this.balls.length % BALL_COLORS.length];
    const radius = 15 + Math.random() * 15;
    const mass = radius * radius * 0.01;
    
    const ball: CrashBall = {
      id: this.ballIdCounter++,
      x, y, vx, vy, radius, mass, color,
      elasticity: 0.8 + Math.random() * 0.2
    };
    
    this.balls.push(ball);
    this.trails.set(ball.id, []);
  }

  removeBall(id: number): void {
    this.balls = this.balls.filter(b => b.id !== id);
    this.trails.delete(id);
  }

  setGravity(x: number, y: number): void {
    this.gravityX = x;
    this.gravityY = y;
  }

  toggleGravity(): void {
    this.gravityEnabled = !this.gravityEnabled;
    if (this.gravityEnabled) {
      this.gravityX = 0;
      this.gravityY = GRAVITY;
    } else {
      this.gravityX = 0;
      this.gravityY = 0;
    }
  }

  toggleTrails(): void {
    this.trailEnabled = !this.trailEnabled;
  }

  clearBalls(): void {
    this.balls = [];
    this.trails.clear();
  }

  startExperiment(): void {
    this.mode = 'experiment';
    this.experimentPhase = 'running';
    this.experimentTime = 0;
    this.collisions = 0;
    this.experimentTarget = 10;
    this.balls = [];
    this.trails.clear();
  }

  tick(): void {
    if (this.mode === 'experiment' && this.experimentPhase === 'running') {
      this.experimentTime++;
      if (this.experimentTime % 60 === 0 && this.balls.length < 3) {
        this.addBall(
          50 + Math.random() * (CANVAS_WIDTH - 100),
          50,
          (Math.random() - 0.5) * 5,
          Math.random() * 3
        );
      }
    }

    for (const ball of this.balls) {
      if (this.gravityEnabled) {
        ball.vy += this.gravityY;
      }
      ball.vx += this.gravityX;
      
      ball.vx *= FRICTION;
      ball.vy *= FRICTION;
      
      ball.x += ball.vx;
      ball.y += ball.vy;
      
      if (this.trailEnabled) {
        const trail = this.trails.get(ball.id) || [];
        trail.push({ x: ball.x, y: ball.y, age: 0 });
        if (trail.length > 30) trail.shift();
        this.trails.set(ball.id, trail);
      }
    }

    for (const trail of this.trails.values()) {
      for (const point of trail) {
        point.age++;
      }
    }

    this.collideBallBall();
    this.collideBallWall();
    this.collideBallObstacle();
    this.updateObstacles();

    if (this.mode === 'experiment') {
      this.score = this.collisions * 10;
      if (this.collisions >= this.experimentTarget) {
        this.experimentPhase = 'complete';
      }
    }
  }

  private collideBallBall(): void {
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        const a = this.balls[i];
        const b = this.balls[j];
        
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius;
        
        if (dist < minDist && dist > 0) {
          this.collisions++;
          
          const nx = dx / dist;
          const ny = dy / dist;
          
          const overlap = minDist - dist;
          const totalMass = a.mass + b.mass;
          a.x -= nx * overlap * (b.mass / totalMass);
          a.y -= ny * overlap * (b.mass / totalMass);
          b.x += nx * overlap * (a.mass / totalMass);
          b.y += ny * overlap * (a.mass / totalMass);
          
          const dvx = a.vx - b.vx;
          const dvy = a.vy - b.vy;
          const dvDotN = dvx * nx + dvy * ny;
          
          if (dvDotN > 0) continue;
          
          const elasticity = (a.elasticity + b.elasticity) / 2;
          const impulse = -(1 + elasticity) * dvDotN / totalMass;
          
          a.vx += impulse * b.mass * nx;
          a.vy += impulse * b.mass * ny;
          b.vx -= impulse * a.mass * nx;
          b.vy -= impulse * a.mass * ny;
        }
      }
    }
  }

  private collideBallWall(): void {
    for (const ball of this.balls) {
      for (const wall of this.walls) {
        const result = this.pointToSegment(
          ball.x, ball.y,
          wall.x1, wall.y1, wall.x2, wall.y2
        );
        
        const effectiveRadius = ball.radius + wall.thickness / 2;
        
        if (result.dist < effectiveRadius) {
          const overlap = effectiveRadius - result.dist;
          ball.x += result.nx * overlap;
          ball.y += result.ny * overlap;
          
          const dot = ball.vx * result.nx + ball.vy * result.ny;
          ball.vx -= 2 * dot * result.nx * ball.elasticity;
          ball.vy -= 2 * dot * result.ny * ball.elasticity;
          
          if (wall.movable) {
            const moveFactor = 0.3;
            wall.x1 += result.nx * overlap * moveFactor;
            wall.y1 += result.ny * overlap * moveFactor;
            wall.x2 += result.nx * overlap * moveFactor;
            wall.y2 += result.ny * overlap * moveFactor;
          }
        }
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

  private collideBallObstacle(): void {
    for (const ball of this.balls) {
      for (const obs of this.obstacles) {
        let collision = false;
        let nx = 0, ny = 0, overlap = 0;
        
        if (obs.type === 'circle') {
          const dx = ball.x - obs.x;
          const dy = ball.y - obs.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = ball.radius + obs.width / 2;
          
          if (dist < minDist) {
            collision = true;
            nx = dx / dist;
            ny = dy / dist;
            overlap = minDist - dist;
          }
        } else if (obs.type === 'rect') {
          const cos = Math.cos(obs.rotation);
          const sin = Math.sin(obs.rotation);
          const localX = (ball.x - obs.x) * cos + (ball.y - obs.y) * sin;
          const localY = -(ball.x - obs.x) * sin + (ball.y - obs.y) * cos;
          
          const closestX = Math.max(-obs.width / 2, Math.min(obs.width / 2, localX));
          const closestY = Math.max(-obs.height / 2, Math.min(obs.height / 2, localY));
          
          const distX = localX - closestX;
          const distY = localY - closestY;
          const dist = Math.sqrt(distX * distX + distY * distY);
          
          if (dist < ball.radius) {
            collision = true;
            const globalClosestX = obs.x + closestX * cos - closestY * sin;
            const globalClosestY = obs.y + closestX * sin + closestY * cos;
            nx = (ball.x - globalClosestX) / dist;
            ny = (ball.y - globalClosestY) / dist;
            overlap = ball.radius - dist;
          }
        }
        
        if (collision) {
          this.collisions++;
          ball.x += nx * overlap;
          ball.y += ny * overlap;
          
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx -= 2 * dot * nx * ball.elasticity;
          ball.vy -= 2 * dot * ny * ball.elasticity;
        }
      }
    }
  }

  private updateObstacles(): void {
    for (const obs of this.obstacles) {
      obs.rotation += obs.angularVel;
    }
  }

  getTrails(): Map<number, { x: number; y: number; age: number }[]> {
    return this.trails;
  }

  reset(): void {
    this.balls = [];
    this.trails.clear();
    this.score = 0;
    this.collisions = 0;
    this.mode = 'sandbox';
    this.experimentPhase = 'setup';
    this.experimentTime = 0;
    
    for (const wall of this.walls) {
      if (wall.movable) {
        wall.x1 = wall.originalX1;
        wall.y1 = wall.originalY1;
        wall.x2 = wall.originalX2;
        wall.y2 = wall.originalY2;
      }
    }
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
