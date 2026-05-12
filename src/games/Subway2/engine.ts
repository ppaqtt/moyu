export type ObstacleType = 'train' | 'fence' | 'luggage' | 'pillar' | 'coin' | 'key' | 'powerup';

export interface Obstacle {
  x: number;
  y: number;
  type: ObstacleType;
  width: number;
  height: number;
  lane: number;
  collected?: boolean;
}

export interface Player {
  x: number;
  y: number;
  lane: number;
  isJumping: boolean;
  isSliding: boolean;
  isCrouching: boolean;
  jumpProgress: number;
  slideProgress: number;
}

export interface Subway2GameState {
  player: Player;
  obstacles: Obstacle[];
  score: number;
  distance: number;
  coins: number;
  keys: number;
  lives: number;
  isGameOver: boolean;
  speed: number;
  isPaused: boolean;
  invincible: boolean;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;
const LANE_COUNT = 3;
const LANE_WIDTH = CANVAS_WIDTH / LANE_COUNT;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 60;
const INITIAL_SPEED = 6;
const SPEED_INCREMENT = 0.3;
const MAX_SPEED = 20;
const OBSTACLE_SPAWN_RATE = 45;
const MAX_OBSTACLES_PER_LANE = 3;

export const SUBWAY2_CONSTANTS = {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  LANE_COUNT,
  LANE_WIDTH,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  INITIAL_SPEED,
  SPEED_INCREMENT,
  MAX_SPEED,
  OBSTACLE_SPAWN_RATE
};

export class Subway2Engine {
  private player: Player;
  private obstacles: Obstacle[];
  private score: number;
  private distance: number;
  private coins: number;
  private keys: number;
  private lives: number;
  private isGameOver: boolean;
  private speed: number;
  private isPaused: boolean;
  private invincible: boolean;
  private frameCount: number;
  private groundOffset: number;
  private jumpStartTime: number;
  private slideStartTime: number;
  private invincibleEndTime: number;

  constructor() {
    this.player = {
      x: 0,
      y: 0,
      lane: 1,
      isJumping: false,
      isSliding: false,
      isCrouching: false,
      jumpProgress: 0,
      slideProgress: 0
    };
    this.obstacles = [];
    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.keys = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.speed = INITIAL_SPEED;
    this.isPaused = false;
    this.invincible = false;
    this.frameCount = 0;
    this.groundOffset = 0;
    this.jumpStartTime = 0;
    this.slideStartTime = 0;
    this.invincibleEndTime = 0;
    this.init();
  }

  init(): void {
    const groundY = CANVAS_HEIGHT - 100;
    this.player = {
      x: LANE_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: groundY - PLAYER_HEIGHT,
      lane: 1,
      isJumping: false,
      isSliding: false,
      isCrouching: false,
      jumpProgress: 0,
      slideProgress: 0
    };
    this.obstacles = [];
    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.keys = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.speed = INITIAL_SPEED;
    this.isPaused = false;
    this.invincible = false;
    this.frameCount = 0;
    this.groundOffset = 0;
    this.jumpStartTime = 0;
    this.slideStartTime = 0;
    this.invincibleEndTime = 0;
  }

  getState(): Subway2GameState {
    return {
      player: { ...this.player },
      obstacles: this.obstacles.map(o => ({ ...o })),
      score: this.score,
      distance: this.distance,
      coins: this.coins,
      keys: this.keys,
      lives: this.lives,
      isGameOver: this.isGameOver,
      speed: this.speed,
      isPaused: this.isPaused,
      invincible: this.invincible
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
    if (this.player.lane < LANE_COUNT - 1) {
      this.player.lane++;
    }
  }

  jump(): void {
    if (this.isGameOver || this.isPaused) return;
    if (!this.player.isJumping && !this.player.isSliding) {
      this.player.isJumping = true;
      this.jumpStartTime = Date.now();
    }
  }

  slide(): void {
    if (this.isGameOver || this.isPaused) return;
    if (!this.player.isJumping && !this.player.isSliding) {
      this.player.isSliding = true;
      this.slideStartTime = Date.now();
    }
  }

  crouch(): void {
    if (this.isGameOver || this.isPaused) return;
    if (!this.player.isJumping && !this.player.isSliding) {
      this.player.isCrouching = true;
    }
  }

  releaseCrouch(): void {
    this.player.isCrouching = false;
  }

  private updatePlayerPosition(): void {
    const targetX = this.player.lane * LANE_WIDTH + LANE_WIDTH / 2 - PLAYER_WIDTH / 2;
    this.player.x += (targetX - this.player.x) * 0.25;

    const groundY = CANVAS_HEIGHT - 100;

    if (this.player.isJumping) {
      const jumpDuration = 500;
      const elapsed = Date.now() - this.jumpStartTime;
      this.player.jumpProgress = Math.min(elapsed / jumpDuration, 1);

      if (this.player.jumpProgress >= 1) {
        this.player.isJumping = false;
        this.player.jumpProgress = 0;
        this.player.y = groundY - PLAYER_HEIGHT;
      } else {
        const jumpHeight = Math.sin(this.player.jumpProgress * Math.PI) * 100;
        this.player.y = groundY - PLAYER_HEIGHT - jumpHeight;
      }
    } else {
      this.player.y = groundY - PLAYER_HEIGHT;
    }

    if (this.player.isSliding) {
      const slideDuration = 500;
      const elapsed = Date.now() - this.slideStartTime;
      this.player.slideProgress = Math.min(elapsed / slideDuration, 1);

      if (this.player.slideProgress >= 1) {
        this.player.isSliding = false;
        this.player.slideProgress = 0;
      }
    }

    if (this.invincible && Date.now() > this.invincibleEndTime) {
      this.invincible = false;
    }
  }

  private spawnObstacle(): void {
    const collectibleChance = 0.4;
    const isCollectible = Math.random() < collectibleChance;

    if (isCollectible) {
      const collectibleTypes: ObstacleType[] = ['coin', 'coin', 'coin', 'key', 'powerup'];
      const type = collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)];
      const lane = Math.floor(Math.random() * LANE_COUNT);

      const obstacle: Obstacle = {
        x: lane * LANE_WIDTH + LANE_WIDTH / 2 - 15,
        y: -50,
        type,
        width: 30,
        height: 30,
        lane,
        collected: false
      };
      this.obstacles.push(obstacle);
    } else {
      const obstacleTypes: ObstacleType[] = ['train', 'fence', 'luggage', 'pillar'];
      const numObstacles = Math.random() < 0.3 ? 2 : 1;
      const usedLanes = new Set<number>();

      for (let i = 0; i < numObstacles; i++) {
        let lane: number;
        do {
          lane = Math.floor(Math.random() * LANE_COUNT);
        } while (usedLanes.has(lane) && usedLanes.size < LANE_COUNT - 1);

        usedLanes.add(lane);
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

        let width = LANE_WIDTH - 40;
        let height: number;

        switch (type) {
          case 'train':
            width = LANE_WIDTH - 20;
            height = 120;
            break;
          case 'fence':
            width = LANE_WIDTH - 30;
            height = 60;
            break;
          case 'luggage':
            width = 40;
            height = 50;
            break;
          case 'pillar':
            width = 30;
            height = 150;
            break;
          default:
            height = 60;
        }

        const obstacle: Obstacle = {
          x: lane * LANE_WIDTH + LANE_WIDTH / 2 - width / 2,
          y: -height - 50,
          type,
          width,
          height,
          lane,
          collected: false
        };
        this.obstacles.push(obstacle);
      }
    }
  }

  private getLaneObstacleCount(lane: number): number {
    return this.obstacles.filter(o => o.lane === lane && o.y < 100).length;
  }

  private updateObstacles(): void {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += this.speed;

      if (obs.y > CANVAS_HEIGHT + 100) {
        this.obstacles.splice(i, 1);
        continue;
      }

      if (!obs.collected && this.checkCollision(obs)) {
        if (['coin', 'key', 'powerup'].includes(obs.type)) {
          obs.collected = true;
          if (obs.type === 'coin') {
            this.coins++;
            this.score += 50;
          } else if (obs.type === 'key') {
            this.keys++;
            this.score += 200;
          } else if (obs.type === 'powerup') {
            this.score += 100;
            this.activateInvincibility();
          }
          this.obstacles.splice(i, 1);
        } else if (!this.invincible) {
          this.lives--;
          this.score = Math.max(0, this.score - 100);

          if (this.lives <= 0) {
            this.isGameOver = true;
          } else {
            this.activateInvincibility();
          }
          this.obstacles.splice(i, 1);
        }
      }
    }
  }

  private activateInvincibility(): void {
    this.invincible = true;
    this.invincibleEndTime = Date.now() + 1500;
  }

  private checkCollision(obs: Obstacle): boolean {
    const isJumping = this.player.isJumping && this.player.jumpProgress > 0.2 && this.player.jumpProgress < 0.8;
    const isSliding = this.player.isSliding;

    let playerLeft = this.player.x + 5;
    let playerRight = this.player.x + PLAYER_WIDTH - 5;
    let playerTop = this.player.y + 5;
    let playerBottom = this.player.y + PLAYER_HEIGHT - 5;

    if (isSliding) {
      playerTop = this.player.y + PLAYER_HEIGHT - 30;
      playerBottom = this.player.y + PLAYER_HEIGHT;
    }

    if (obs.type === 'train' || obs.type === 'pillar') {
      if (isJumping) return false;
    }

    if (obs.type === 'fence' || obs.type === 'luggage') {
      if (isSliding) return false;
    }

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
    this.score = Math.floor(this.distance) + this.coins * 10 + this.keys * 50;

    this.speed = Math.min(INITIAL_SPEED + this.distance / 300 * SPEED_INCREMENT, MAX_SPEED);
    this.groundOffset = (this.groundOffset + this.speed) % 60;

    this.updatePlayerPosition();

    if (this.frameCount % Math.max(20, OBSTACLE_SPAWN_RATE - Math.floor(this.distance / 500)) === 0) {
      const lane = Math.floor(Math.random() * LANE_COUNT);
      if (this.getLaneObstacleCount(lane) < MAX_OBSTACLES_PER_LANE) {
        this.spawnObstacle();
      }
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
