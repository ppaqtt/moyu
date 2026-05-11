export interface Position {
  x: number;
  y: number;
}

export interface Duck {
  id: number;
  position: Position;
  velocity: Position;
  alive: boolean;
  type: number;
}

export interface Bullet {
  id: number;
  position: Position;
}

export const DUCK_HUNT_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  DUCK_SIZE: 60,
  BULLET_SIZE: 8,
  SPAWN_INTERVAL: 2000,
  GAME_DURATION: 60000,
  MAX_DUCKS: 3,
  MAX_BULLETS: 3,
  RELOAD_TIME: 1000,
};

const DUCK_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d'];

export interface DuckHuntState {
  ducks: Duck[];
  bullets: Bullet[];
  score: number;
  round: number;
  timeLeft: number;
  ammo: number;
  isReloading: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  gameStarted: boolean;
}

export class DuckHuntEngine {
  private ducks: Duck[] = [];
  private bullets: Bullet[] = [];
  private score: number = 0;
  private round: number = 1;
  private timeLeft: number = DUCK_HUNT_CONSTANTS.GAME_DURATION;
  private ammo: number = DUCK_HUNT_CONSTANTS.MAX_BULLETS;
  private isReloading: boolean = false;
  private isGameOver: boolean = false;
  private isPaused: boolean = false;
  private gameStarted: boolean = false;
  private lastSpawnTime: number = 0;
  private duckIdCounter: number = 0;
  private bulletIdCounter: number = 0;

  constructor() {
    this.init();
  }

  init(): void {
    this.ducks = [];
    this.bullets = [];
    this.score = 0;
    this.round = 1;
    this.timeLeft = DUCK_HUNT_CONSTANTS.GAME_DURATION;
    this.ammo = DUCK_HUNT_CONSTANTS.MAX_BULLETS;
    this.isReloading = false;
    this.isGameOver = false;
    this.isPaused = false;
    this.gameStarted = false;
    this.lastSpawnTime = 0;
    this.duckIdCounter = 0;
    this.bulletIdCounter = 0;
  }

  getState(): DuckHuntState {
    return {
      ducks: this.ducks.map((d) => ({
        ...d,
        position: { ...d.position },
        velocity: { ...d.velocity },
      })),
      bullets: this.bullets.map((b) => ({
        ...b,
        position: { ...b.position },
      })),
      score: this.score,
      round: this.round,
      timeLeft: this.timeLeft,
      ammo: this.ammo,
      isReloading: this.isReloading,
      isGameOver: this.isGameOver,
      isPaused: this.isPaused,
      gameStarted: this.gameStarted,
    };
  }

  startGame(): void {
    this.gameStarted = true;
    this.lastSpawnTime = Date.now();
    this.spawnDuck();
    this.spawnDuck();
  }

  private spawnDuck(): void {
    if (this.ducks.length >= DUCK_HUNT_CONSTANTS.MAX_DUCKS) return;

    const side = Math.random() < 0.5 ? 'left' : 'right';
    const startX = side === 'left' ? -DUCK_HUNT_CONSTANTS.DUCK_SIZE : DUCK_HUNT_CONSTANTS.CANVAS_WIDTH;
    const startY = Math.random() * (DUCK_HUNT_CONSTANTS.CANVAS_HEIGHT * 0.6) + 50;

    const baseSpeed = 2 + this.round * 0.5;
    const velocityX = side === 'left' ? baseSpeed + Math.random() * 2 : -(baseSpeed + Math.random() * 2);
    const velocityY = (Math.random() - 0.5) * 3;

    this.ducks.push({
      id: this.duckIdCounter++,
      position: { x: startX, y: startY },
      velocity: { x: velocityX, y: velocityY },
      alive: true,
      type: Math.floor(Math.random() * 3),
    });
  }

  shoot(targetX: number, targetY: number): boolean {
    if (this.isGameOver || this.isPaused || this.isReloading || this.ammo <= 0) {
      return false;
    }

    this.ammo--;

    let hitDuck = false;
    for (let i = this.ducks.length - 1; i >= 0; i--) {
      const duck = this.ducks[i];
      if (!duck.alive) continue;

      const dx = targetX - (duck.position.x + DUCK_HUNT_CONSTANTS.DUCK_SIZE / 2);
      const dy = targetY - (duck.position.y + DUCK_HUNT_CONSTANTS.DUCK_SIZE / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < DUCK_HUNT_CONSTANTS.DUCK_SIZE / 2) {
        duck.alive = false;
        hitDuck = true;
        this.score += (10 + this.round * 5) * (duck.type + 1);
        break;
      }
    }

    if (this.ammo === 0) {
      this.isReloading = true;
      setTimeout(() => {
        this.ammo = DUCK_HUNT_CONSTANTS.MAX_BULLETS;
        this.isReloading = false;
      }, DUCK_HUNT_CONSTANTS.RELOAD_TIME);
    }

    return hitDuck;
  }

  tick(deltaTime: number): void {
    if (!this.gameStarted || this.isGameOver || this.isPaused) return;

    this.timeLeft -= deltaTime;

    if (this.timeLeft <= 0) {
      this.isGameOver = true;
      return;
    }

    const now = Date.now();
    if (now - this.lastSpawnTime > DUCK_HUNT_CONSTANTS.SPAWN_INTERVAL / this.round) {
      this.spawnDuck();
      this.lastSpawnTime = now;
    }

    for (let i = this.ducks.length - 1; i >= 0; i--) {
      const duck = this.ducks[i];
      
      if (!duck.alive) {
        duck.position.y += 8;
        if (duck.position.y > DUCK_HUNT_CONSTANTS.CANVAS_HEIGHT + DUCK_HUNT_CONSTANTS.DUCK_SIZE) {
          this.ducks.splice(i, 1);
        }
        continue;
      }

      duck.position.x += duck.velocity.x;
      duck.position.y += duck.velocity.y;

      if (duck.position.y < 0 || duck.position.y > DUCK_HUNT_CONSTANTS.CANVAS_HEIGHT * 0.7) {
        duck.velocity.y *= -1;
      }

      if (duck.position.x < -DUCK_HUNT_CONSTANTS.DUCK_SIZE * 2 || 
          duck.position.x > DUCK_HUNT_CONSTANTS.CANVAS_WIDTH + DUCK_HUNT_CONSTANTS.DUCK_SIZE * 2) {
        this.ducks.splice(i, 1);
      }
    }

    if (this.ducks.some((d) => d.alive) && Math.random() < 0.02) {
      const randomDuck = this.ducks.find((d) => d.alive);
      if (randomDuck) {
        randomDuck.velocity.y = (Math.random() - 0.5) * 4;
      }
    }
  }

  togglePause(): void {
    if (!this.isGameOver && this.gameStarted) {
      this.isPaused = !this.isPaused;
    }
  }

  reset(): void {
    this.init();
  }
}
