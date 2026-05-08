export interface Obstacle {
  x: number;
  y: number;
  type: 'low' | 'high' | 'coin';
  width: number;
  height: number;
}

export interface Player {
  x: number;
  y: number;
  lane: number;
  isJumping: boolean;
  isSliding: boolean;
}

export interface GameSubwayState {
  player: Player;
  obstacles: Obstacle[];
  score: number;
  distance: number;
  coins: number;
  isGameOver: boolean;
  speed: number;
  isPaused: boolean;
}

const LANE_WIDTH = 80;
const LANES = 3;
const PLAYER_SIZE = 60;
const CANVAS_WIDTH = LANE_WIDTH * LANES;
const CANVAS_HEIGHT = 500;
const OBSTACLE_SPEED_INITIAL = 5;
const OBSTACLE_SPAWN_RATE = 60;

export class GameSubwayEngine {
  private player: Player;
  private obstacles: Obstacle[];
  private score: number;
  private distance: number;
  private coins: number;
  private isGameOver: boolean;
  private speed: number;
  private isPaused: boolean;
  private frameCount: number;
  private groundOffset: number;

  constructor() {
    this.player = {
      x: 0,
      y: 0,
      lane: 1,
      isJumping: false,
      isSliding: false
    };
    this.obstacles = [];
    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.isGameOver = false;
    this.speed = OBSTACLE_SPEED_INITIAL;
    this.isPaused = false;
    this.frameCount = 0;
    this.groundOffset = 0;
    this.init();
  }

  init(): void {
    this.player = {
      x: LANE_WIDTH + LANE_WIDTH / 2 - PLAYER_SIZE / 2,
      y: CANVAS_HEIGHT - PLAYER_SIZE - 50,
      lane: 1,
      isJumping: false,
      isSliding: false
    };
    this.obstacles = [];
    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.isGameOver = false;
    this.speed = OBSTACLE_SPEED_INITIAL;
    this.isPaused = false;
    this.frameCount = 0;
    this.groundOffset = 0;
  }

  getState(): GameSubwayState {
    return {
      player: { ...this.player },
      obstacles: this.obstacles.map(o => ({ ...o })),
      score: this.score,
      distance: this.distance,
      coins: this.coins,
      isGameOver: this.isGameOver,
      speed: this.speed,
      isPaused: this.isPaused
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
      this.player.isJumping = true;
      setTimeout(() => {
        this.player.isJumping = false;
      }, 500);
    }
  }

  slide(): void {
    if (this.isGameOver || this.isPaused) return;
    if (!this.player.isJumping && !this.player.isSliding) {
      this.player.isSliding = true;
      setTimeout(() => {
        this.player.isSliding = false;
      }, 500);
    }
  }

  private updatePlayerPosition(): void {
    const targetX = this.player.lane * LANE_WIDTH + LANE_WIDTH / 2 - PLAYER_SIZE / 2;
    this.player.x += (targetX - this.player.x) * 0.2;

    if (this.player.isJumping) {
      const jumpHeight = Math.sin((this.frameCount % 30) / 30 * Math.PI) * 80;
      this.player.y = CANVAS_HEIGHT - PLAYER_SIZE - 50 - jumpHeight;
    } else {
      this.player.y = CANVAS_HEIGHT - PLAYER_SIZE - 50;
    }
  }

  private spawnObstacle(): void {
    const types: ('low' | 'high' | 'coin')[] = ['low', 'high', 'coin'];
    const weights = [0.4, 0.3, 0.3];
    const rand = Math.random();
    let type: 'low' | 'high' | 'coin' = 'coin';
    let cumulative = 0;

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        type = types[i];
        break;
      }
    }

    const lane = Math.floor(Math.random() * LANES);
    let width = LANE_WIDTH - 20;
    let height = type === 'low' ? 60 : type === 'high' ? 30 : 30;

    this.obstacles.push({
      x: lane * LANE_WIDTH + 10,
      y: -100,
      type,
      width,
      height
    });
  }

  private updateObstacles(): void {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += this.speed;

      if (obs.type === 'coin' && obs.y > CANVAS_HEIGHT) {
        this.obstacles.splice(i, 1);
        continue;
      }

      if (obs.type !== 'coin' && obs.y > CANVAS_HEIGHT - 20) {
        this.obstacles.splice(i, 1);
        continue;
      }

      if (this.checkCollision(obs)) {
        if (obs.type === 'coin') {
          this.coins++;
          this.score += 50;
          this.obstacles.splice(i, 1);
        } else {
          this.isGameOver = true;
        }
      }
    }
  }

  private checkCollision(obs: Obstacle): boolean {
    const playerLeft = this.player.x + 10;
    const playerRight = this.player.x + PLAYER_SIZE - 10;
    const playerTop = this.player.isSliding ? this.player.y + PLAYER_SIZE - 30 : this.player.y;
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
    this.distance += this.speed / 10;
    this.score = Math.floor(this.distance);

    this.speed = OBSTACLE_SPEED_INITIAL + this.distance / 500;
    this.groundOffset = (this.groundOffset + this.speed) % 50;

    this.updatePlayerPosition();

    if (this.frameCount % OBSTACLE_SPAWN_RATE === 0) {
      this.spawnObstacle();
    }

    this.updateObstacles();
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
