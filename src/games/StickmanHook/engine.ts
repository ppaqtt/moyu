export interface Stickman {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  isGrappling: boolean;
  ropeEndX: number;
  ropeEndY: number;
  rotation: number;
}

export interface Hook {
  x: number;
  y: number;
  isActive: boolean;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface GameStickmanState {
  stickman: Stickman;
  hooks: Hook[];
  obstacles: Obstacle[];
  score: number;
  distance: number;
  isGameOver: boolean;
  isStarted: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const GRAVITY = 0.3;
const GRAPPLE_SPEED = 15;
const GRAPPLE_RANGE = 200;
const HOOK_COUNT = 8;

export class GameStickmanEngine {
  private stickman: Stickman;
  private hooks: Hook[];
  private obstacles: Obstacle[];
  private score: number;
  private distance: number;
  private isGameOver: boolean;
  private isStarted: boolean;
  private cameraX: number;
  private lastGrappleTime: number;

  constructor() {
    this.stickman = {
      x: 100,
      y: 250,
      velocityX: 2,
      velocityY: 0,
      isGrappling: false,
      ropeEndX: 0,
      ropeEndY: 0,
      rotation: 0
    };
    this.hooks = [];
    this.obstacles = [];
    this.score = 0;
    this.distance = 0;
    this.isGameOver = false;
    this.isStarted = false;
    this.cameraX = 0;
    this.lastGrappleTime = 0;
    this.generateHooks();
    this.generateObstacles();
  }

  private generateHooks(): void {
    this.hooks = [];
    for (let i = 0; i < HOOK_COUNT; i++) {
      let x: number;
      let y: number;
      if (i === 0) {
        x = 150 + Math.random() * 100;
        y = 100 + Math.random() * 100;
      } else {
        x = 300 + i * 150 + Math.random() * 50;
        y = 50 + Math.random() * 350;
      }
      this.hooks.push({
        x,
        y,
        isActive: true
      });
    }
  }

  private generateObstacles(): void {
    this.obstacles = [];
    for (let i = 0; i < 20; i++) {
      this.obstacles.push({
        x: 500 + i * 200 + Math.random() * 100,
        y: Math.random() < 0.5 ? 20 : 430,
        width: 60 + Math.random() * 40,
        height: 60,
        rotation: Math.random() < 0.5 ? 0 : 180
      });
    }
  }

  getState(): GameStickmanState {
    return {
      stickman: { ...this.stickman },
      hooks: this.hooks.map(h => ({ ...h })),
      obstacles: this.obstacles.map(o => ({ ...o })),
      score: this.score,
      distance: this.distance,
      isGameOver: this.isGameOver,
      isStarted: this.isStarted
    };
  }

  start(): void {
    this.isStarted = true;
  }

  grapple(): void {
    if (this.isGameOver || !this.isStarted) return;
    if (this.stickman.isGrappling) return;
    if (Date.now() - this.lastGrappleTime < 100) return;

    const nearestHook = this.findNearestHook();
    if (nearestHook && this.getDistance(nearestHook.x, nearestHook.y) < GRAPPLE_RANGE) {
      this.stickman.isGrappling = true;
      this.stickman.ropeEndX = nearestHook.x;
      this.stickman.ropeEndY = nearestHook.y;
      this.lastGrappleTime = Date.now();
    }
  }

  release(): void {
    this.stickman.isGrappling = false;
  }

  private findNearestHook(): Hook | null {
    let nearest: Hook | null = null;
    let minDist = Infinity;

    for (const hook of this.hooks) {
      if (hook.x < this.cameraX - 50) continue;
      const dist = this.getDistance(hook.x, hook.y);
      if (dist < minDist && hook.y < this.stickman.y) {
        minDist = dist;
        nearest = hook;
      }
    }
    return nearest;
  }

  private getDistance(x: number, y: number): number {
    return Math.sqrt((x - this.stickman.x) ** 2 + (y - this.stickman.y) ** 2);
  }

  tick(): void {
    if (!this.isStarted || this.isGameOver) return;

    if (this.stickman.isGrappling) {
      const dx = this.stickman.ropeEndX - this.stickman.x;
      const dy = this.stickman.ropeEndY - this.stickman.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        this.stickman.velocityX += (dx / dist) * 0.5;
        this.stickman.velocityY += (dy / dist) * 0.5;
      }

      this.stickman.velocityX *= 0.98;
      this.stickman.velocityY *= 0.98;

      if (dist < 20) {
        this.stickman.x = this.stickman.ropeEndX;
        this.stickman.y = this.stickman.ropeEndY;
        this.stickman.isGrappling = false;
      }
    } else {
      this.stickman.velocityY += GRAVITY;
    }

    this.stickman.x += this.stickman.velocityX;
    this.stickman.y += this.stickman.velocityY;

    this.stickman.rotation = Math.atan2(this.stickman.velocityY, this.stickman.velocityX) * (180 / Math.PI);

    this.cameraX = this.stickman.x - 150;
    this.distance = Math.floor(this.stickman.x / 10);
    this.score = this.distance;

    if (this.stickman.y > CANVAS_HEIGHT + 50 || this.stickman.y < -50) {
      this.isGameOver = true;
    }

    if (this.stickman.x < 50) {
      this.stickman.velocityX = Math.max(2, this.stickman.velocityX);
    }

    for (const obstacle of this.obstacles) {
      if (
        this.stickman.x + 15 > obstacle.x - obstacle.width / 2 &&
        this.stickman.x - 15 < obstacle.x + obstacle.width / 2 &&
        this.stickman.y + 15 > obstacle.y - obstacle.height / 2 &&
        this.stickman.y - 15 < obstacle.y + obstacle.height / 2
      ) {
        this.isGameOver = true;
      }
    }

    if (this.stickman.x > 500 + this.obstacles.length * 200) {
      this.generateObstacles();
    }
  }

  reset(): void {
    this.stickman = {
      x: 100,
      y: 250,
      velocityX: 2,
      velocityY: 0,
      isGrappling: false,
      ropeEndX: 0,
      ropeEndY: 0,
      rotation: 0
    };
    this.score = 0;
    this.distance = 0;
    this.isGameOver = false;
    this.isStarted = false;
    this.cameraX = 0;
    this.generateHooks();
    this.generateObstacles();
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getCameraX() {
    return this.cameraX;
  }
}
