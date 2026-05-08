export interface Player {
  x: number;
  y: number;
  lane: number;
  isJumping: boolean;
  isSliding: boolean;
  jumpVelocity: number;
}

export interface Obstacle {
  x: number;
  y: number;
  type: 'low' | 'high' | 'coin';
  lane: number;
}

export interface GameTempleRunState {
  player: Player;
  obstacles: Obstacle[];
  coins: number;
  score: number;
  distance: number;
  isGameOver: boolean;
  isStarted: boolean;
}

const LANE_COUNT = 3;
const LANE_WIDTH = 80;
const CANVAS_WIDTH = LANE_COUNT * LANE_WIDTH;
const CANVAS_HEIGHT = 600;
const GAME_SPEED = 5;
const LANE_POSITIONS = [-LANE_WIDTH, 0, LANE_WIDTH];

export class GameTempleRunEngine {
  private player: Player;
  private obstacles: Obstacle[];
  private score: number;
  private coins: number;
  private distance: number;
  private isGameOver: boolean;
  private isStarted: boolean;
  private lastObstacleSpawn: number;
  private groundOffset: number;
  private templeElements: { x: number; type: string }[];

  constructor() {
    this.player = {
      x: 0,
      y: 400,
      lane: 1,
      isJumping: false,
      isSliding: false,
      jumpVelocity: 0
    };
    this.obstacles = [];
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.isGameOver = false;
    this.isStarted = false;
    this.lastObstacleSpawn = 0;
    this.groundOffset = 0;
    this.templeElements = [];
    this.generateTempleElements();
  }

  private generateTempleElements(): void {
    for (let i = 0; i < 30; i++) {
      this.templeElements.push({
        x: i * 100,
        type: Math.random() > 0.5 ? 'pillar' : 'arch'
      });
    }
  }

  getState(): GameTempleRunState {
    return {
      player: { ...this.player },
      obstacles: this.obstacles.map(o => ({ ...o })),
      coins: this.coins,
      score: this.score,
      distance: this.distance,
      isGameOver: this.isGameOver,
      isStarted: this.isStarted
    };
  }

  start(): void {
    this.isStarted = true;
  }

  moveLeft(): void {
    if (!this.isStarted || this.isGameOver) return;
    if (this.player.lane > 0) {
      this.player.lane--;
    }
  }

  moveRight(): void {
    if (!this.isStarted || this.isGameOver) return;
    if (this.player.lane < LANE_COUNT - 1) {
      this.player.lane++;
    }
  }

  jump(): void {
    if (!this.isStarted || this.isGameOver) return;
    if (!this.player.isJumping && !this.player.isSliding) {
      this.player.isJumping = true;
      this.player.jumpVelocity = -15;
    }
  }

  slide(): void {
    if (!this.isStarted || this.isGameOver) return;
    if (!this.player.isJumping) {
      this.player.isSliding = true;
      setTimeout(() => {
        this.player.isSliding = false;
      }, 500);
    }
  }

  tick(): void {
    if (!this.isStarted || this.isGameOver) return;

    this.player.x = LANE_POSITIONS[this.player.lane];

    if (this.player.isJumping) {
      this.player.y += this.player.jumpVelocity;
      this.player.jumpVelocity += 0.8;

      if (this.player.y >= 400) {
        this.player.y = 400;
        this.player.isJumping = false;
        this.player.jumpVelocity = 0;
      }
    }

    const now = Date.now();
    if (now - this.lastObstacleSpawn > 1500 - Math.min(this.distance / 100, 800)) {
      this.spawnObstacle();
      this.lastObstacleSpawn = now;
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += GAME_SPEED + Math.min(this.distance / 50, 10);

      if (obs.y > CANVAS_HEIGHT + 100) {
        this.obstacles.splice(i, 1);
        this.score += 10;
      }

      const playerLane = this.player.lane;
      const playerY = this.player.y;

      if (obs.lane === playerLane) {
        if (obs.type === 'low' && !this.player.isJumping) {
          if (obs.y > 350 && obs.y < 450) {
            this.isGameOver = true;
          }
        } else if (obs.type === 'high' && this.player.isJumping) {
          if (obs.y > 280 && obs.y < 380) {
            this.isGameOver = true;
          }
        }
      }

      if (obs.type === 'coin' && obs.lane === playerLane) {
        if (Math.abs(obs.y - playerY) < 60) {
          this.obstacles.splice(i, 1);
          this.coins++;
          this.score += 50;
        }
      }
    }

    this.distance += 0.1;
    this.score += 1;
    this.groundOffset += GAME_SPEED + Math.min(this.distance / 50, 10);
    if (this.groundOffset > 100) this.groundOffset = 0;

    for (const elem of this.templeElements) {
      elem.x -= GAME_SPEED + Math.min(this.distance / 50, 10);
      if (elem.x < -200) {
        elem.x += 3000;
      }
    }
  }

  private spawnObstacle(): void {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const type = Math.random() > 0.3 ? (Math.random() > 0.5 ? 'low' : 'high') : 'coin';
    this.obstacles.push({ x: LANE_POSITIONS[lane], y: -50, type, lane });
  }

  reset(): void {
    this.player = {
      x: 0,
      y: 400,
      lane: 1,
      isJumping: false,
      isSliding: false,
      jumpVelocity: 0
    };
    this.obstacles = [];
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.isGameOver = false;
    this.isStarted = false;
    this.lastObstacleSpawn = 0;
    this.groundOffset = 0;
    this.generateTempleElements();
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
