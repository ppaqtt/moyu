import { SKIING_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, OBSTACLE_SIZE, INITIAL_SPEED, SPEED_INCREMENT } = SKIING_CONSTANTS;

export type ObstacleType = 'tree' | 'rock' | 'flag_gate' | 'snow_mountain';
export type PowerUpType = 'speed_boost' | 'score_flag';

export interface Player {
  x: number;
  y: number;
  lane: number;
  isJumping: boolean;
  jumpVelocity: number;
}

export interface Obstacle {
  x: number;
  y: number;
  type: ObstacleType;
  lane: number;
}

export interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  lane: number;
}

export interface SkiingState {
  player: Player;
  obstacles: Obstacle[];
  powerUps: PowerUp[];
  score: number;
  distance: number;
  lives: number;
  speed: number;
  isGameOver: boolean;
  isPlaying: boolean;
}

export class SkiingEngine {
  private player: Player;
  private obstacles: Obstacle[];
  private powerUps: PowerUp[];
  private score: number;
  private distance: number;
  private lives: number;
  private speed: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private lastObstacleSpawn: number;
  private lastPowerUpSpawn: number;
  private obstacleSpawnInterval: number;
  private powerUpSpawnInterval: number;

  constructor() {
    this.player = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 150,
      lane: 1,
      isJumping: false,
      jumpVelocity: 0
    };
    this.obstacles = [];
    this.powerUps = [];
    this.score = 0;
    this.distance = 0;
    this.lives = 3;
    this.speed = INITIAL_SPEED;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastObstacleSpawn = 0;
    this.lastPowerUpSpawn = 0;
    this.obstacleSpawnInterval = 1200;
    this.powerUpSpawnInterval = 3000;
  }

  getState(): SkiingState {
    return {
      player: { ...this.player },
      obstacles: this.obstacles.map(o => ({ ...o })),
      powerUps: this.powerUps.map(p => ({ ...p })),
      score: this.score,
      distance: this.distance,
      lives: this.lives,
      speed: this.speed,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying
    };
  }

  start(): void {
    this.isPlaying = true;
  }

  moveLeft(): void {
    if (this.isGameOver || !this.isPlaying) return;
    if (this.player.lane > 0) {
      this.player.lane--;
      this.updatePlayerX();
    }
  }

  moveRight(): void {
    if (this.isGameOver || !this.isPlaying) return;
    if (this.player.lane < 2) {
      this.player.lane++;
      this.updatePlayerX();
    }
  }

  jump(): void {
    if (this.isGameOver || !this.isPlaying) return;
    if (!this.player.isJumping && this.player.y > CANVAS_HEIGHT / 2) {
      this.player.isJumping = true;
      this.player.jumpVelocity = -12;
    }
  }

  speedBoost(): void {
    if (this.isGameOver || !this.isPlaying) return;
    this.speed += 2;
  }

  private updatePlayerX(): void {
    const laneWidth = CANVAS_WIDTH / 3;
    this.player.x = laneWidth * this.player.lane + laneWidth / 2;
  }

  private spawnObstacle(): void {
    const types: ObstacleType[] = ['tree', 'rock', 'flag_gate', 'snow_mountain'];
    const weights = [0.35, 0.3, 0.2, 0.15];
    const random = Math.random();
    let cumulative = 0;
    let selectedType: ObstacleType = 'tree';
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) {
        selectedType = types[i];
        break;
      }
    }

    const lane = Math.floor(Math.random() * 3);
    const laneWidth = CANVAS_WIDTH / 3;
    
    this.obstacles.push({
      x: laneWidth * lane + laneWidth / 2 + (Math.random() - 0.5) * 20,
      y: -OBSTACLE_SIZE,
      type: selectedType,
      lane
    });
  }

  private spawnPowerUp(): void {
    const types: PowerUpType[] = ['speed_boost', 'score_flag'];
    const selectedType = types[Math.floor(Math.random() * types.length)];
    const lane = Math.floor(Math.random() * 3);
    const laneWidth = CANVAS_WIDTH / 3;
    
    this.powerUps.push({
      x: laneWidth * lane + laneWidth / 2,
      y: -30,
      type: selectedType,
      lane
    });
  }

  private checkCollision(obj: { x: number; y: number; lane: number }): boolean {
    const dx = Math.abs(this.player.x - obj.x);
    const dy = Math.abs(this.player.y - obj.y);
    const collisionThresholdX = PLAYER_SIZE / 2 + OBSTACLE_SIZE / 2 - 10;
    const collisionThresholdY = PLAYER_SIZE / 2 + OBSTACLE_SIZE / 2 - 5;
    
    return dx < collisionThresholdX && dy < collisionThresholdY;
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;

    const now = Date.now();

    if (now - this.lastObstacleSpawn > this.obstacleSpawnInterval) {
      this.spawnObstacle();
      this.lastObstacleSpawn = now;
    }

    if (now - this.lastPowerUpSpawn > this.powerUpSpawnInterval) {
      if (Math.random() < 0.4) {
        this.spawnPowerUp();
      }
      this.lastPowerUpSpawn = now;
    }

    if (this.player.isJumping) {
      this.player.jumpVelocity += 0.5;
      this.player.y += this.player.jumpVelocity;
      
      if (this.player.y >= CANVAS_HEIGHT - 150) {
        this.player.y = CANVAS_HEIGHT - 150;
        this.player.isJumping = false;
        this.player.jumpVelocity = 0;
      }
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.y += this.speed;

      if (this.player.lane === obstacle.lane && !this.player.isJumping) {
        if (this.checkCollision(obstacle)) {
          this.lives--;
          this.obstacles.splice(i, 1);
          this.speed = Math.max(INITIAL_SPEED, this.speed - 1);
          
          if (this.lives <= 0) {
            this.isGameOver = true;
          }
          continue;
        }
      } else if (this.player.isJumping && obstacle.type !== 'snow_mountain') {
        if (Math.abs(this.player.x - obstacle.x) < 20 && 
            Math.abs(this.player.y - obstacle.y) < 30) {
          this.lives--;
          this.obstacles.splice(i, 1);
          
          if (this.lives <= 0) {
            this.isGameOver = true;
          }
          continue;
        }
      }

      if (obstacle.y > CANVAS_HEIGHT + OBSTACLE_SIZE) {
        this.obstacles.splice(i, 1);
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.y += this.speed;

      if (this.player.lane === powerUp.lane && this.checkCollision(powerUp)) {
        if (powerUp.type === 'speed_boost') {
          this.speed += 3;
          this.score += 50;
        } else if (powerUp.type === 'score_flag') {
          this.score += 100;
        }
        this.powerUps.splice(i, 1);
        continue;
      }

      if (powerUp.y > CANVAS_HEIGHT + 30) {
        this.powerUps.splice(i, 1);
      }
    }

    this.distance += this.speed / 10;
    this.score += Math.floor(this.speed / 5);

    if (this.distance > 0 && this.distance % 100 < 1) {
      this.speed = Math.min(this.speed + SPEED_INCREMENT, INITIAL_SPEED * 3);
      this.obstacleSpawnInterval = Math.max(600, this.obstacleSpawnInterval - 10);
    }
  }

  reset(): void {
    this.player = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 150,
      lane: 1,
      isJumping: false,
      jumpVelocity: 0
    };
    this.obstacles = [];
    this.powerUps = [];
    this.score = 0;
    this.distance = 0;
    this.lives = 3;
    this.speed = INITIAL_SPEED;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastObstacleSpawn = 0;
    this.lastPowerUpSpawn = 0;
    this.obstacleSpawnInterval = 1200;
    this.powerUpSpawnInterval = 3000;
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getPlayerSize() {
    return PLAYER_SIZE;
  }

  getObstacleSize() {
    return OBSTACLE_SIZE;
  }
}
