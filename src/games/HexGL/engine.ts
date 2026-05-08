export interface Car {
  x: number;
  y: number;
  speed: number;
  angle: number;
  velocityX: number;
  velocityY: number;
}

export interface ObstacleHex {
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export interface GameHexGLState {
  car: Car;
  obstacles: ObstacleHex[];
  score: number;
  speed: number;
  isGameOver: boolean;
  isStarted: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TRACK_WIDTH = 600;
const TRACK_CENTER_X = CANVAS_WIDTH / 2;

export class GameHexGLEngine {
  private car: Car;
  private obstacles: ObstacleHex[];
  private score: number;
  private isGameOver: boolean;
  private isStarted: boolean;
  private trackOffset: number;
  private speedMultiplier: number;

  constructor() {
    this.car = {
      x: TRACK_CENTER_X,
      y: CANVAS_HEIGHT - 150,
      speed: 0,
      angle: 0,
      velocityX: 0,
      velocityY: 0
    };
    this.obstacles = [];
    this.score = 0;
    this.isGameOver = false;
    this.isStarted = false;
    this.trackOffset = 0;
    this.speedMultiplier = 1;
    this.generateObstacles();
  }

  private generateObstacles(): void {
    for (let i = 0; i < 15; i++) {
      this.obstacles.push({
        x: TRACK_CENTER_X + (Math.random() - 0.5) * TRACK_WIDTH * 0.8,
        y: -100 - i * 150,
        size: 40 + Math.random() * 30,
        rotation: Math.random() * 360
      });
    }
  }

  getState(): GameHexGLState {
    return {
      car: { ...this.car },
      obstacles: this.obstacles.map(o => ({ ...o })),
      score: this.score,
      speed: this.car.speed,
      isGameOver: this.isGameOver,
      isStarted: this.isStarted
    };
  }

  start(): void {
    this.isStarted = true;
    this.car.speed = 3;
  }

  moveLeft(): void {
    if (!this.isStarted || this.isGameOver) return;
    this.car.velocityX -= 0.5;
  }

  moveRight(): void {
    if (!this.isStarted || this.isGameOver) return;
    this.car.velocityX += 0.5;
  }

  boost(): void {
    if (!this.isStarted || this.isGameOver) return;
    this.car.speed = Math.min(15, this.car.speed + 0.5);
  }

  brake(): void {
    if (!this.isStarted || this.isGameOver) return;
    this.car.speed = Math.max(3, this.car.speed - 0.5);
  }

  tick(): void {
    if (!this.isStarted || this.isGameOver) return;

    this.car.velocityX *= 0.95;
    this.car.velocityX = Math.max(-8, Math.min(8, this.car.velocityX));

    this.car.x += this.car.velocityX;
    this.car.y -= this.car.speed * 0.5;

    const leftEdge = TRACK_CENTER_X - TRACK_WIDTH / 2 + 30;
    const rightEdge = TRACK_CENTER_X + TRACK_WIDTH / 2 - 30;

    if (this.car.x < leftEdge) {
      this.car.x = leftEdge;
      this.car.velocityX = 0;
    }
    if (this.car.x > rightEdge) {
      this.car.x = rightEdge;
      this.car.velocityX = 0;
    }

    if (this.car.y < 50) {
      this.car.y = CANVAS_HEIGHT - 150;
      this.score++;
      this.speedMultiplier = Math.min(2, 1 + this.score * 0.1);
      this.car.speed = 3 + this.speedMultiplier * 2;

      this.obstacles = [];
      this.generateObstacles();
    }

    for (const obs of this.obstacles) {
      obs.y += this.car.speed * 0.5;
      obs.rotation += 2;

      const dx = this.car.x - obs.x;
      const dy = this.car.y - obs.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < obs.size * 0.6 + 15) {
        this.isGameOver = true;
      }
    }

    this.trackOffset += this.car.speed * 0.5;
    if (this.trackOffset > 100) this.trackOffset = 0;
  }

  reset(): void {
    this.car = {
      x: TRACK_CENTER_X,
      y: CANVAS_HEIGHT - 150,
      speed: 0,
      angle: 0,
      velocityX: 0,
      velocityY: 0
    };
    this.obstacles = [];
    this.score = 0;
    this.isGameOver = false;
    this.isStarted = false;
    this.trackOffset = 0;
    this.speedMultiplier = 1;
    this.generateObstacles();
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
