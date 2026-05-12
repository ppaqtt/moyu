export interface Obstacle {
  x: number;
  y: number;
  type: 'ice' | 'snowball' | 'penguin' | 'fish' | 'iceCream';
  width: number;
  height: number;
  vx?: number;
  vy?: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lane: number;
  isSliding: boolean;
  isJumping: boolean;
  isShielded: boolean;
}

export interface IceRunState {
  player: Player;
  obstacles: Obstacle[];
  score: number;
  distance: number;
  fish: number;
  isGameOver: boolean;
  speed: number;
  isPaused: boolean;
  snowflakes: { x: number; y: number; size: number; opacity: number }[];
}

const LANE_WIDTH = 80;
const LANES = 3;
const PLAYER_SIZE = 55;
const CANVAS_WIDTH = LANE_WIDTH * LANES;
const CANVAS_HEIGHT = 500;
const GRAVITY = 0.4;
const JUMP_FORCE = -12;
const SLIDE_FORCE = 8;
const OBSTACLE_SPEED_INITIAL = 5;
const OBSTACLE_SPAWN_RATE = 45;
const GROUND_Y = CANVAS_HEIGHT - 60;

export class IceRunEngine {
  private player: Player;
  private obstacles: Obstacle[];
  private score: number;
  private distance: number;
  private fish: number;
  private isGameOver: boolean;
  private speed: number;
  private isPaused: boolean;
  private frameCount: number;
  private snowflakes: { x: number; y: number; size: number; opacity: number }[];
  private powerupTimer: number;
  private driftTime: number;

  constructor() {
    this.player = {
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: GROUND_Y - PLAYER_SIZE,
      vx: 0,
      vy: 0,
      lane: 1,
      isSliding: false,
      isJumping: false,
      isShielded: false
    };
    this.obstacles = [];
    this.score = 0;
    this.distance = 0;
    this.fish = 0;
    this.isGameOver = false;
    this.speed = OBSTACLE_SPEED_INITIAL;
    this.isPaused = false;
    this.frameCount = 0;
    this.snowflakes = [];
    this.powerupTimer = 0;
    this.driftTime = 0;
    this.init();
  }

  init(): void {
    this.player = {
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: GROUND_Y - PLAYER_SIZE,
      vx: 0,
      vy: 0,
      lane: 1,
      isSliding: false,
      isJumping: false,
      isShielded: false
    };
    this.obstacles = [];
    this.score = 0;
    this.distance = 0;
    this.fish = 0;
    this.isGameOver = false;
    this.speed = OBSTACLE_SPEED_INITIAL;
    this.isPaused = false;
    this.frameCount = 0;
    this.snowflakes = this.generateSnowflakes();
    this.powerupTimer = 0;
    this.driftTime = 0;
  }

  private generateSnowflakes(): { x: number; y: number; size: number; opacity: number }[] {
    const flakes: { x: number; y: number; size: number; opacity: number }[] = [];
    for (let i = 0; i < 30; i++) {
      flakes.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.5 + 0.3
      });
    }
    return flakes;
  }

  getState(): IceRunState {
    return {
      player: { ...this.player },
      obstacles: this.obstacles.map(o => ({ ...o })),
      score: this.score,
      distance: this.distance,
      fish: this.fish,
      isGameOver: this.isGameOver,
      speed: this.speed,
      isPaused: this.isPaused,
      snowflakes: [...this.snowflakes]
    };
  }

  moveLeft(): void {
    if (this.isGameOver || this.isPaused) return;
    if (this.player.lane > 0) {
      this.player.lane--;
    }
  }

  moveRight(): void {
    if (this.isGameOver || this.isPaused) return;
    if (this.player.lane < LANES - 1) {
      this.player.lane++;
    }
  }

  jump(): void {
    if (this.isGameOver || this.isPaused) return;
    if (!this.player.isJumping && !this.player.isSliding) {
      this.player.vy = JUMP_FORCE;
      this.player.isJumping = true;
    }
  }

  slide(): void {
    if (this.isGameOver || this.isPaused) return;
    if (!this.player.isSliding && !this.player.isJumping) {
      this.player.isSliding = true;
      this.player.vx = this.player.lane === 0 ? SLIDE_FORCE :
                        this.player.lane === 2 ? -SLIDE_FORCE : 0;
      setTimeout(() => {
        this.player.isSliding = false;
        this.player.vx = 0;
      }, 400);
    }
  }

  private updatePlayerPosition(): void {
    const targetX = this.player.lane * LANE_WIDTH + LANE_WIDTH / 2 - PLAYER_SIZE / 2;

    if (Math.abs(this.player.vx) > 0) {
      this.player.x += this.player.vx;
      this.player.vx *= 0.95;
    } else {
      this.player.x += (targetX - this.player.x) * 0.08;
    }

    this.player.vy += GRAVITY;
    this.player.y += this.player.vy;

    if (this.player.y >= GROUND_Y - PLAYER_SIZE) {
      this.player.y = GROUND_Y - PLAYER_SIZE;
      this.player.vy = 0;
      this.player.isJumping = false;
    }

    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x > CANVAS_WIDTH - PLAYER_SIZE) this.player.x = CANVAS_WIDTH - PLAYER_SIZE;
  }

  private spawnObstacle(): void {
    const types: ('ice' | 'snowball' | 'penguin' | 'fish' | 'iceCream')[] =
      ['ice', 'snowball', 'penguin', 'fish', 'iceCream'];
    const weights = [0.25, 0.2, 0.2, 0.25, 0.1];
    const rand = Math.random();
    let type: 'ice' | 'snowball' | 'penguin' | 'fish' | 'iceCream' = 'fish';
    let cumulative = 0;

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        type = types[i];
        break;
      }
    }

    const lane = Math.floor(Math.random() * LANES);
    let obstacle: Obstacle = {
      x: lane * LANE_WIDTH + 15,
      y: -50,
      type,
      width: 50,
      height: 40
    };

    if (type === 'snowball') {
      obstacle.vx = (Math.random() - 0.5) * 4;
      obstacle.vy = Math.random() * 2;
      obstacle.y = Math.random() * 200 + 50;
    }

    this.obstacles.push(obstacle);
  }

  private updateObstacles(): void {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += this.speed;

      if (obs.vx !== undefined) {
        obs.x += obs.vx;
        if (obs.x < 0 || obs.x > CANVAS_WIDTH - obs.width) {
          obs.vx *= -1;
        }
      }

      if (obs.y > CANVAS_HEIGHT) {
        this.obstacles.splice(i, 1);
        continue;
      }

      if (this.checkCollision(obs)) {
        if (obs.type === 'fish') {
          this.fish++;
          this.score += 75;
          this.obstacles.splice(i, 1);
        } else if (obs.type === 'iceCream') {
          this.player.isShielded = true;
          this.powerupTimer = 180;
          this.obstacles.splice(i, 1);
        } else if (!this.player.isShielded) {
          this.isGameOver = true;
        }
      }
    }
  }

  private checkCollision(obs: Obstacle): boolean {
    const playerLeft = this.player.x + 8;
    const playerRight = this.player.x + PLAYER_SIZE - 8;
    const playerTop = this.player.isSliding ? this.player.y + PLAYER_SIZE - 25 : this.player.y;
    const playerBottom = this.player.y + PLAYER_SIZE;

    const obsLeft = obs.x;
    const obsRight = obs.x + obs.width;
    const obsTop = obs.y;
    const obsBottom = obs.y + obs.height;

    return playerRight > obsLeft &&
           playerLeft < obsRight &&
           playerBottom > obsTop &&
           playerTop < obsBottom;
  }

  tick(): void {
    if (this.isGameOver || this.isPaused) return;

    this.frameCount++;
    this.distance += this.speed / 12;
    this.score = Math.floor(this.distance);

    this.speed = Math.min(OBSTACLE_SPEED_INITIAL + this.distance / 400, 10);

    if (this.powerupTimer > 0) {
      this.powerupTimer--;
      if (this.powerupTimer === 0) {
        this.player.isShielded = false;
      }
    }

    this.updatePlayerPosition();

    if (this.frameCount % OBSTACLE_SPAWN_RATE === 0) {
      this.spawnObstacle();
    }

    this.updateObstacles();

    this.snowflakes.forEach(flake => {
      flake.y += this.speed * 0.3;
      flake.x += Math.sin(this.frameCount * 0.05 + flake.x) * 0.5;
      if (flake.y > CANVAS_HEIGHT) {
        flake.y = -10;
        flake.x = Math.random() * CANVAS_WIDTH;
      }
    });
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  reset(): void {
    this.init();
  }
}
