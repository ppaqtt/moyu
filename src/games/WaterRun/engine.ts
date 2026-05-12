export interface Obstacle {
  x: number;
  y: number;
  type: 'rock' | 'log' | 'tornado' | 'coin' | 'powerup';
  width: number;
  height: number;
  vx?: number;
  vy?: number;
}

export interface Player {
  x: number;
  y: number;
  lane: number;
  isJumping: boolean;
  isDucking: boolean;
  isShielded: boolean;
  boostActive: boolean;
}

export interface WaterRunState {
  player: Player;
  obstacles: Obstacle[];
  score: number;
  distance: number;
  coins: number;
  isGameOver: boolean;
  speed: number;
  isPaused: boolean;
  waveOffset: number;
  bubbles: { x: number; y: number; size: number; opacity: number }[];
}

const LANE_WIDTH = 80;
const LANES = 3;
const PLAYER_SIZE = 55;
const CANVAS_WIDTH = LANE_WIDTH * LANES;
const CANVAS_HEIGHT = 500;
const OBSTACLE_SPEED_INITIAL = 6;
const OBSTACLE_SPAWN_RATE = 35;
const JUMP_DURATION = 30;

export class WaterRunEngine {
  private player: Player;
  private obstacles: Obstacle[];
  private score: number;
  private distance: number;
  private coins: number;
  private isGameOver: boolean;
  private speed: number;
  private isPaused: boolean;
  private frameCount: number;
  private waveOffset: number;
  private bubbles: { x: number; y: number; size: number; opacity: number }[];
  private powerupTimer: number;
  private jumpTimer: number;
  private duckTimer: number;

  constructor() {
    this.player = {
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: 0,
      lane: 1,
      isJumping: false,
      isDucking: false,
      isShielded: false,
      boostActive: false
    };
    this.obstacles = [];
    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.isGameOver = false;
    this.speed = OBSTACLE_SPEED_INITIAL;
    this.isPaused = false;
    this.frameCount = 0;
    this.waveOffset = 0;
    this.bubbles = [];
    this.powerupTimer = 0;
    this.jumpTimer = 0;
    this.duckTimer = 0;
    this.init();
  }

  init(): void {
    this.player = {
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: CANVAS_HEIGHT - 150,
      lane: 1,
      isJumping: false,
      isDucking: false,
      isShielded: false,
      boostActive: false
    };
    this.obstacles = [];
    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.isGameOver = false;
    this.speed = OBSTACLE_SPEED_INITIAL;
    this.isPaused = false;
    this.frameCount = 0;
    this.waveOffset = 0;
    this.bubbles = this.generateBubbles();
    this.powerupTimer = 0;
    this.jumpTimer = 0;
    this.duckTimer = 0;
  }

  private generateBubbles(): { x: number; y: number; size: number; opacity: number }[] {
    const bubbles: { x: number; y: number; size: number; opacity: number }[] = [];
    for (let i = 0; i < 20; i++) {
      bubbles.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 8 + 4,
        opacity: Math.random() * 0.4 + 0.2
      });
    }
    return bubbles;
  }

  getState(): WaterRunState {
    return {
      player: { ...this.player },
      obstacles: this.obstacles.map(o => ({ ...o })),
      score: this.score,
      distance: this.distance,
      coins: this.coins,
      isGameOver: this.isGameOver,
      speed: this.speed,
      isPaused: this.isPaused,
      waveOffset: this.waveOffset,
      bubbles: [...this.bubbles]
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
    if (!this.player.isJumping) {
      this.player.isJumping = true;
      this.jumpTimer = JUMP_DURATION;
    }
  }

  duck(): void {
    if (this.isGameOver || this.isPaused) return;
    if (!this.player.isDucking && !this.player.isJumping) {
      this.player.isDucking = true;
      this.duckTimer = 25;
    }
  }

  private updatePlayerPosition(): void {
    const targetX = this.player.lane * LANE_WIDTH + LANE_WIDTH / 2 - PLAYER_SIZE / 2;
    this.player.x += (targetX - this.player.x) * 0.15;

    if (this.player.isJumping) {
      const jumpProgress = 1 - (this.jumpTimer / JUMP_DURATION);
      const jumpHeight = Math.sin(jumpProgress * Math.PI) * 100;
      this.player.y = CANVAS_HEIGHT - 150 - jumpHeight;
      this.jumpTimer--;

      if (this.jumpTimer <= 0) {
        this.player.isJumping = false;
        this.player.y = CANVAS_HEIGHT - 150;
      }
    } else {
      this.player.y = CANVAS_HEIGHT - 150;
    }

    if (this.player.isDucking) {
      this.duckTimer--;
      if (this.duckTimer <= 0) {
        this.player.isDucking = false;
      }
    }
  }

  private spawnObstacle(): void {
    const types: ('rock' | 'log' | 'tornado' | 'coin' | 'powerup')[] =
      ['rock', 'log', 'tornado', 'coin', 'powerup'];
    const weights = [0.25, 0.2, 0.15, 0.3, 0.1];
    const rand = Math.random();
    let type: 'rock' | 'log' | 'tornado' | 'coin' | 'powerup' = 'coin';
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
      y: -60,
      type,
      width: 50,
      height: type === 'tornado' ? 80 : type === 'rock' ? 45 : 40
    };

    if (type === 'tornado') {
      obstacle.vx = (Math.random() - 0.5) * 3;
    }

    this.obstacles.push(obstacle);
  }

  private updateObstacles(): void {
    const currentSpeed = this.player.boostActive ? this.speed * 1.5 : this.speed;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += currentSpeed;

      if (obs.vx !== undefined) {
        obs.x += obs.vx;
        if (obs.x < 0 || obs.x > CANVAS_WIDTH - obs.width) {
          obs.vx *= -1;
        }
      }

      if (obs.y > CANVAS_HEIGHT + 50) {
        this.obstacles.splice(i, 1);
        continue;
      }

      if (this.checkCollision(obs)) {
        if (obs.type === 'coin') {
          this.coins++;
          this.score += 60;
          this.obstacles.splice(i, 1);
        } else if (obs.type === 'powerup') {
          this.player.boostActive = true;
          this.player.isShielded = true;
          this.powerupTimer = 120;
          this.obstacles.splice(i, 1);
        } else if (!this.player.isShielded) {
          this.isGameOver = true;
        }
      }
    }
  }

  private checkCollision(obs: Obstacle): boolean {
    const playerLeft = this.player.x + 10;
    const playerRight = this.player.x + PLAYER_SIZE - 10;
    const playerTop = this.player.isDucking ? this.player.y + 30 : this.player.y;
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

    this.speed = Math.min(OBSTACLE_SPEED_INITIAL + this.distance / 350, 12);

    if (this.powerupTimer > 0) {
      this.powerupTimer--;
      if (this.powerupTimer === 0) {
        this.player.isShielded = false;
        this.player.boostActive = false;
      }
    }

    this.updatePlayerPosition();

    if (this.frameCount % OBSTACLE_SPAWN_RATE === 0) {
      this.spawnObstacle();
    }

    this.updateObstacles();

    this.waveOffset = (this.waveOffset + this.speed * 0.5) % 100;

    this.bubbles.forEach(bubble => {
      bubble.y -= this.speed * 0.3;
      bubble.x += Math.sin(this.frameCount * 0.03 + bubble.y) * 0.8;
      if (bubble.y < -20) {
        bubble.y = CANVAS_HEIGHT + 10;
        bubble.x = Math.random() * CANVAS_WIDTH;
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
