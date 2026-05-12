export interface Platform {
  x: number;
  y: number;
  width: number;
  type: 'normal' | 'crumbling' | 'bouncy';
}

export interface Obstacle {
  x: number;
  y: number;
  type: 'lava' | 'fire' | 'gem' | 'boost';
  width: number;
  height: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lane: number;
  isJumping: boolean;
  isOnGround: boolean;
  isShielded: boolean;
}

export interface LavaRunState {
  player: Player;
  platforms: Platform[];
  obstacles: Obstacle[];
  score: number;
  distance: number;
  gems: number;
  isGameOver: boolean;
  speed: number;
  isPaused: boolean;
  lavaLevel: number;
}

const LANE_WIDTH = 80;
const LANES = 3;
const PLAYER_SIZE = 50;
const CANVAS_WIDTH = LANE_WIDTH * LANES;
const CANVAS_HEIGHT = 500;
const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const OBSTACLE_SPEED_INITIAL = 5;
const OBSTACLE_SPAWN_RATE = 40;
const PLATFORM_WIDTH = 100;
const PLATFORM_HEIGHT = 20;
const GROUND_Y = CANVAS_HEIGHT - 80;

export class LavaRunEngine {
  private player: Player;
  private platforms: Platform[];
  private obstacles: Obstacle[];
  private score: number;
  private distance: number;
  private gems: number;
  private isGameOver: boolean;
  private speed: number;
  private isPaused: boolean;
  private frameCount: number;
  private lavaLevel: number;
  private powerupTimer: number;
  private lastPlatformY: number;

  constructor() {
    this.player = {
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: GROUND_Y - PLAYER_SIZE,
      vx: 0,
      vy: 0,
      lane: 1,
      isJumping: false,
      isOnGround: true,
      isShielded: false
    };
    this.platforms = [];
    this.obstacles = [];
    this.score = 0;
    this.distance = 0;
    this.gems = 0;
    this.isGameOver = false;
    this.speed = OBSTACLE_SPEED_INITIAL;
    this.isPaused = false;
    this.frameCount = 0;
    this.lavaLevel = CANVAS_HEIGHT + 50;
    this.powerupTimer = 0;
    this.lastPlatformY = GROUND_Y;
    this.init();
  }

  init(): void {
    this.player = {
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: GROUND_Y - PLAYER_SIZE,
      vx: 0,
      vy: 0,
      lane: 1,
      isJumping: false,
      isOnGround: true,
      isShielded: false
    };
    this.platforms = this.generateInitialPlatforms();
    this.obstacles = [];
    this.score = 0;
    this.distance = 0;
    this.gems = 0;
    this.isGameOver = false;
    this.speed = OBSTACLE_SPEED_INITIAL;
    this.isPaused = false;
    this.frameCount = 0;
    this.lavaLevel = CANVAS_HEIGHT + 50;
    this.powerupTimer = 0;
    this.lastPlatformY = GROUND_Y;
  }

  private generateInitialPlatforms(): Platform[] {
    const platforms: Platform[] = [];
    platforms.push({
      x: 0,
      y: GROUND_Y,
      width: CANVAS_WIDTH,
      type: 'normal'
    });

    for (let i = 0; i < 5; i++) {
      const lane = Math.floor(Math.random() * LANES);
      platforms.push({
        x: lane * LANE_WIDTH + 10,
        y: GROUND_Y - 80 - i * 70,
        width: PLATFORM_WIDTH,
        type: 'normal'
      });
      this.lastPlatformY = GROUND_Y - 80 - i * 70;
    }
    return platforms;
  }

  getState(): LavaRunState {
    return {
      player: { ...this.player },
      platforms: this.platforms.map(p => ({ ...p })),
      obstacles: this.obstacles.map(o => ({ ...o })),
      score: this.score,
      distance: this.distance,
      gems: this.gems,
      isGameOver: this.isGameOver,
      speed: this.speed,
      isPaused: this.isPaused,
      lavaLevel: this.lavaLevel
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
    if (this.player.isOnGround || this.isOnPlatform()) {
      this.player.vy = JUMP_FORCE;
      this.player.isOnGround = false;
      this.player.isJumping = true;
    }
  }

  private isOnPlatform(): boolean {
    const playerBottom = this.player.y + PLAYER_SIZE;
    const playerLeft = this.player.x;
    const playerRight = this.player.x + PLAYER_SIZE;

    for (const platform of this.platforms) {
      if (playerBottom >= platform.y && playerBottom <= platform.y + 10 &&
          playerRight > platform.x && playerLeft < platform.x + platform.width) {
        return true;
      }
    }
    return false;
  }

  private updatePlayerPosition(): void {
    const targetX = this.player.lane * LANE_WIDTH + LANE_WIDTH / 2 - PLAYER_SIZE / 2;
    this.player.x += (targetX - this.player.x) * 0.15;

    this.player.vy += GRAVITY;
    this.player.y += this.player.vy;

    if (this.player.y >= GROUND_Y - PLAYER_SIZE && this.player.vy > 0) {
      this.player.y = GROUND_Y - PLAYER_SIZE;
      this.player.vy = 0;
      this.player.isOnGround = true;
      this.player.isJumping = false;
    }

    for (const platform of this.platforms) {
      if (platform.type === 'bouncy' &&
          this.player.y + PLAYER_SIZE >= platform.y &&
          this.player.y + PLAYER_SIZE <= platform.y + 15 &&
          this.player.vy > 0 &&
          this.player.x + PLAYER_SIZE > platform.x &&
          this.player.x < platform.x + platform.width) {
        this.player.y = platform.y - PLAYER_SIZE;
        this.player.vy = JUMP_FORCE * 1.5;
        this.player.isOnGround = false;
      } else if (platform.type !== 'bouncy' &&
                 this.player.y + PLAYER_SIZE >= platform.y &&
                 this.player.y + PLAYER_SIZE <= platform.y + 10 &&
                 this.player.vy > 0 &&
                 this.player.x + PLAYER_SIZE > platform.x &&
                 this.player.x < platform.x + platform.width) {
        this.player.y = platform.y - PLAYER_SIZE;
        this.player.vy = 0;
        this.player.isOnGround = true;
        this.player.isJumping = false;
      }
    }

    if (this.player.y > this.lavaLevel - 20 && !this.player.isShielded) {
      this.isGameOver = true;
    }
  }

  private spawnObstacle(): void {
    const types: ('lava' | 'fire' | 'gem' | 'boost')[] = ['lava', 'fire', 'gem', 'boost'];
    const weights = [0.35, 0.25, 0.3, 0.1];
    const rand = Math.random();
    let type: 'lava' | 'fire' | 'gem' | 'boost' = 'gem';
    let cumulative = 0;

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        type = types[i];
        break;
      }
    }

    const lane = Math.floor(Math.random() * LANES);

    if (type === 'boost') {
      const platformTypes: ('normal' | 'crumbling' | 'bouncy')[] = ['normal', 'crumbling', 'bouncy'];
      const platformType = platformTypes[Math.floor(Math.random() * platformTypes.length)];
      const gap = Math.random() * 100 + 50;
      this.lastPlatformY -= gap;
      this.platforms.push({
        x: lane * LANE_WIDTH + 10,
        y: this.lastPlatformY,
        width: PLATFORM_WIDTH,
        type: platformType
      });
    }

    this.obstacles.push({
      x: lane * LANE_WIDTH + 20,
      y: -50,
      type,
      width: 40,
      height: 40
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
        if (obs.type === 'gem') {
          this.gems++;
          this.score += 100;
          this.obstacles.splice(i, 1);
        } else if (obs.type === 'boost') {
          this.speed += 2;
          this.obstacles.splice(i, 1);
        } else if (!this.player.isShielded) {
          this.isGameOver = true;
        }
      }
    }
  }

  private checkCollision(obs: Obstacle): boolean {
    const playerLeft = this.player.x + 5;
    const playerRight = this.player.x + PLAYER_SIZE - 5;
    const playerTop = this.player.y;
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
    this.distance += this.speed / 15;
    this.score = Math.floor(this.distance);

    this.speed = Math.min(OBSTACLE_SPEED_INITIAL + this.distance / 300, 12);

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

    this.lavaLevel -= 0.3;

    this.platforms.forEach(p => {
      p.y += this.speed * 0.5;
      if (p.y > CANVAS_HEIGHT) {
        const idx = this.platforms.indexOf(p);
        if (idx > 0) {
          this.platforms.splice(idx, 1);
        }
      }
    });

    if (this.platforms.length < 3) {
      const lane = Math.floor(Math.random() * LANES);
      const gap = Math.random() * 80 + 40;
      this.platforms.push({
        x: lane * LANE_WIDTH + 10,
        y: -20,
        width: PLATFORM_WIDTH,
        type: 'normal'
      });
    }
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
