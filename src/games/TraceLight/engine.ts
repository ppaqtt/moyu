export interface LightPoint {
  x: number;
  y: number;
  radius: number;
  targetX: number;
  targetY: number;
  speed: number;
  isActive: boolean;
  trail: { x: number; y: number; alpha: number }[];
}

export interface TraceLightState {
  points: LightPoint[];
  score: number;
  level: number;
  catchCount: number;
  missCount: number;
  totalCatches: number;
  isPlaying: boolean;
  gameOver: boolean;
  timeLeft: number;
  currentSpeed: number;
  lastCatchTime: number;
}

export interface TraceLightEngine {
  getState(): TraceLightState;
  handleClick(x: number, y: number): boolean;
  tick(): void;
  reset(): void;
  checkGameOver(): boolean;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 600;
const POINT_RADIUS = 30;
const TRAIL_LENGTH = 20;
const BASE_SPEED = 3;
const SPEED_INCREMENT = 0.3;
const CATCH_RADIUS = 50;
const GAME_DURATION = 60;
const POINTS_PER_LEVEL = 5;

export class TraceLightEngine implements TraceLightEngine {
  private points: LightPoint[] = [];
  private score: number = 0;
  private level: number = 1;
  private catchCount: number = 0;
  private missCount: number = 0;
  private totalCatches: number = 0;
  private isPlaying: boolean = false;
  private gameOver: boolean = false;
  private timeLeft: number = GAME_DURATION;
  private currentSpeed: number = BASE_SPEED;
  private lastCatchTime: number = 0;
  private lastUpdate: number = 0;
  private pointSpawnTime: number = 0;

  constructor() {
    this.init();
  }

  private init(): void {
    this.points = [];
    this.score = 0;
    this.level = 1;
    this.catchCount = 0;
    this.missCount = 0;
    this.totalCatches = 0;
    this.isPlaying = false;
    this.gameOver = false;
    this.timeLeft = GAME_DURATION;
    this.currentSpeed = BASE_SPEED;
    this.lastCatchTime = 0;
    this.lastUpdate = Date.now();
    this.pointSpawnTime = Date.now();
  }

  private spawnPoint(): void {
    const margin = 100;
    const x = margin + Math.random() * (CANVAS_WIDTH - margin * 2);
    const y = margin + Math.random() * (CANVAS_HEIGHT - margin * 2);

    const angle = Math.random() * Math.PI * 2;
    const speedMultiplier = 0.5 + Math.random() * 0.5;

    this.points.push({
      x,
      y,
      radius: POINT_RADIUS,
      targetX: x + Math.cos(angle) * 100,
      targetY: y + Math.sin(angle) * 100,
      speed: this.currentSpeed * speedMultiplier,
      isActive: true,
      trail: []
    });
  }

  private updatePointDirection(point: LightPoint): void {
    const now = Date.now();
    const distToTarget = Math.sqrt(
      Math.pow(point.targetX - point.x, 2) +
      Math.pow(point.targetY - point.y, 2)
    );

    if (distToTarget < 30) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 150;
      point.targetX = Math.max(50, Math.min(CANVAS_WIDTH - 50,
        point.x + Math.cos(angle) * distance));
      point.targetY = Math.max(50, Math.min(CANVAS_HEIGHT - 50,
        point.y + Math.sin(angle) * distance));
    }
  }

  getState(): TraceLightState {
    return {
      points: this.points.map(p => ({
        ...p,
        trail: [...p.trail]
      })),
      score: this.score,
      level: this.level,
      catchCount: this.catchCount,
      missCount: this.missCount,
      totalCatches: this.totalCatches,
      isPlaying: this.isPlaying,
      gameOver: this.gameOver,
      timeLeft: this.timeLeft,
      currentSpeed: this.currentSpeed,
      lastCatchTime: this.lastCatchTime
    };
  }

  handleClick(x: number, y: number): boolean {
    if (!this.isPlaying || this.gameOver) return false;

    for (const point of this.points) {
      if (!point.isActive) continue;

      const distance = Math.sqrt(
        Math.pow(point.x - x, 2) +
        Math.pow(point.y - y, 2)
      );

      if (distance < CATCH_RADIUS + point.radius) {
        point.isActive = false;
        this.catchCount++;
        this.totalCatches++;

        const reactionBonus = Math.max(0, 100 - (Date.now() - this.lastCatchTime));
        this.score += 100 + Math.floor(reactionBonus / 2);
        this.lastCatchTime = Date.now();

        if (this.catchCount >= POINTS_PER_LEVEL) {
          this.level++;
          this.catchCount = 0;
          this.currentSpeed = Math.min(BASE_SPEED + (this.level - 1) * SPEED_INCREMENT, 10);
        }

        return true;
      }
    }

    this.missCount++;
    return false;
  }

  tick(): void {
    if (this.gameOver) return;

    const now = Date.now();

    if (now - this.lastUpdate >= 1000) {
      this.timeLeft--;
      this.lastUpdate = now;

      if (this.timeLeft <= 0) {
        this.gameOver = true;
        return;
      }
    }

    if (this.isPlaying) {
      if (this.points.filter(p => p.isActive).length < this.level) {
        if (now - this.pointSpawnTime > Math.max(2000 - this.level * 100, 500)) {
          this.spawnPoint();
          this.pointSpawnTime = now;
        }
      }

      this.points.forEach(point => {
        if (!point.isActive) return;

        this.updatePointDirection(point);

        const dx = point.targetX - point.x;
        const dy = point.targetY - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1) {
          point.x += (dx / dist) * point.speed;
          point.y += (dy / dist) * point.speed;
        }

        point.trail.unshift({ x: point.x, y: point.y, alpha: 1 });
        if (point.trail.length > TRAIL_LENGTH) {
          point.trail.pop();
        }

        point.trail.forEach((t, i) => {
          t.alpha = 1 - (i / TRAIL_LENGTH);
        });
      });

      this.points = this.points.filter(point => {
        if (!point.isActive) {
          return point.trail.length > 0;
        }
        return true;
      });
    }
  }

  reset(): void {
    this.init();
    this.isPlaying = true;
  }

  checkGameOver(): boolean {
    return this.gameOver;
  }
}

export const createEngine = (): TraceLightEngine => {
  return new TraceLightEngine();
};
