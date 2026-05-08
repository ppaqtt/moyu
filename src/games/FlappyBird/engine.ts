export interface Bird {
  x: number;
  y: number;
  velocity: number;
  rotation: number;
}

export interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

export interface GameFlappyState {
  bird: Bird;
  pipes: Pipe[];
  score: number;
  isGameOver: boolean;
  isStarted: boolean;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.5;
const FLAP_POWER = -8;
const PIPE_SPEED = 3;
const PIPE_GAP = 150;
const PIPE_WIDTH = 60;
const PIPE_SPAWN_INTERVAL = 1500;

export class GameFlappyEngine {
  private bird: Bird;
  private pipes: Pipe[];
  private score: number;
  private isGameOver: boolean;
  private isStarted: boolean;
  private lastPipeSpawn: number;
  private groundY: number;

  constructor() {
    this.bird = { x: 80, y: 300, velocity: 0, rotation: 0 };
    this.pipes = [];
    this.score = 0;
    this.isGameOver = false;
    this.isStarted = false;
    this.lastPipeSpawn = 0;
    this.groundY = CANVAS_HEIGHT - 80;
  }

  getState(): GameFlappyState {
    return {
      bird: { ...this.bird },
      pipes: this.pipes.map(p => ({ ...p })),
      score: this.score,
      isGameOver: this.isGameOver,
      isStarted: this.isStarted
    };
  }

  start(): void {
    this.isStarted = true;
  }

  flap(): void {
    if (this.isGameOver) return;
    if (!this.isStarted) this.start();
    this.bird.velocity = FLAP_POWER;
  }

  tick(): void {
    if (!this.isStarted || this.isGameOver) return;

    this.bird.velocity += GRAVITY;
    this.bird.y += this.bird.velocity;
    this.bird.rotation = Math.min(Math.max(this.bird.velocity * 3, -30), 90);

    const now = Date.now();
    if (now - this.lastPipeSpawn > PIPE_SPAWN_INTERVAL) {
      this.pipes.push({
        x: CANVAS_WIDTH,
        gapY: 100 + Math.random() * (CANVAS_HEIGHT - 300),
        passed: false
      });
      this.lastPipeSpawn = now;
    }

    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.x -= PIPE_SPEED;

      if (!pipe.passed && pipe.x + PIPE_WIDTH < this.bird.x) {
        pipe.passed = true;
        this.score++;
      }

      if (pipe.x < -PIPE_WIDTH) {
        this.pipes.splice(i, 1);
      }

      if (
        this.bird.x + 20 > pipe.x &&
        this.bird.x - 20 < pipe.x + PIPE_WIDTH &&
        (this.bird.y - 20 < pipe.gapY || this.bird.y + 20 > pipe.gapY + PIPE_GAP)
      ) {
        this.isGameOver = true;
      }
    }

    if (this.bird.y + 20 > this.groundY || this.bird.y - 20 < 0) {
      this.isGameOver = true;
    }
  }

  reset(): void {
    this.bird = { x: 80, y: 300, velocity: 0, rotation: 0 };
    this.pipes = [];
    this.score = 0;
    this.isGameOver = false;
    this.isStarted = false;
    this.lastPipeSpawn = 0;
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getGroundY() {
    return this.groundY;
  }

  getPipeWidth() {
    return PIPE_WIDTH;
  }
}
