export interface Obstacle {
  x: number;
  y: number;
  type: 'barrier' | 'car' | 'cone' | 'coin' | 'powerup';
  width: number;
  height: number;
}

export interface Player {
  x: number;
  y: number;
  lane: number;
  isJumping: boolean;
  isSliding: boolean;
  isShielded: boolean;
}

export interface CityParkourState {
  player: Player;
  obstacles: Obstacle[];
  score: number;
  distance: number;
  coins: number;
  isGameOver: boolean;
  speed: number;
  isPaused: boolean;
  buildings: { x: number; height: number; color: string }[];
}

const LANE_WIDTH = 80;
const LANES = 3;
const PLAYER_SIZE = 60;
const CANVAS_WIDTH = LANE_WIDTH * LANES;
const CANVAS_HEIGHT = 500;
const OBSTACLE_SPEED_INITIAL = 6;
const OBSTACLE_SPAWN_RATE = 50;

export class CityParkourEngine {
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
  private buildings: { x: number; height: number; color: string }[];
  private powerupTimer: number;

  constructor() {
    this.player = {
      x: 0,
      y: 0,
      lane: 1,
      isJumping: false,
      isSliding: false,
      isShielded: false
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
    this.buildings = [];
    this.powerupTimer = 0;
    this.init();
  }

  init(): void {
    this.player = {
      x: LANE_WIDTH + LANE_WIDTH / 2 - PLAYER_SIZE / 2,
      y: CANVAS_HEIGHT - PLAYER_SIZE - 50,
      lane: 1,
      isJumping: false,
      isSliding: false,
      isShielded: false
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
    this.buildings = this.generateBuildings();
    this.powerupTimer = 0;
  }

  private generateBuildings(): { x: number; height: number; color: string }[] {
    const colors = ['#2c3e50', '#34495e', '#1a252f', '#34495e', '#2c3e50'];
    const buildings: { x: number; height: number; color: string }[] = [];
    for (let i = 0; i < 10; i++) {
      buildings.push({
        x: i * 30,
        height: 100 + Math.random() * 150,
        color: colors[i % colors.length]
      });
    }
    return buildings;
  }

  getState(): CityParkourState {
    return {
      player: { ...this.player },
      obstacles: this.obstacles.map(o => ({ ...o })),
      score: this.score,
      distance: this.distance,
      coins: this.coins,
      isGameOver: this.isGameOver,
      speed: this.speed,
      isPaused: this.isPaused,
      buildings: [...this.buildings]
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
    const types: ('barrier' | 'car' | 'cone' | 'coin' | 'powerup')[] = ['barrier', 'car', 'cone', 'coin', 'powerup'];
    const weights = [0.25, 0.2, 0.2, 0.25, 0.1];
    const rand = Math.random();
    let type: 'barrier' | 'car' | 'cone' | 'coin' | 'powerup' = 'coin';
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
    let height = type === 'car' ? 80 : type === 'barrier' ? 60 : type === 'cone' ? 40 : 30;

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

      if (obs.y > CANVAS_HEIGHT) {
        this.obstacles.splice(i, 1);
        continue;
      }

      if (this.checkCollision(obs)) {
        if (obs.type === 'coin') {
          this.coins++;
          this.score += 50;
          this.obstacles.splice(i, 1);
        } else if (obs.type === 'powerup') {
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

    this.buildings.forEach(b => {
      b.x -= this.speed * 0.5;
      if (b.x < -30) {
        b.x = CANVAS_WIDTH + Math.random() * 50;
        b.height = 100 + Math.random() * 150;
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
