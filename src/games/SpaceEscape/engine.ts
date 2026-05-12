export interface Obstacle {
  x: number;
  y: number;
  type: 'asteroid' | 'debris' | 'laser' | 'coin' | 'shield';
  width: number;
  height: number;
  vx?: number;
  vy?: number;
  rotation?: number;
}

export interface Player {
  x: number;
  y: number;
  lane: number;
  isJumping: boolean;
  isShielded: boolean;
  boostActive: boolean;
}

export interface SpaceEscapeState {
  player: Player;
  obstacles: Obstacle[];
  score: number;
  distance: number;
  coins: number;
  isGameOver: boolean;
  speed: number;
  isPaused: boolean;
  stars: { x: number; y: number; size: number; opacity: number; speed: number }[];
  explosionParticles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[];
}

const LANE_WIDTH = 80;
const LANES = 3;
const PLAYER_SIZE = 50;
const CANVAS_WIDTH = LANE_WIDTH * LANES;
const CANVAS_HEIGHT = 500;
const OBSTACLE_SPEED_INITIAL = 7;
const OBSTACLE_SPAWN_RATE = 30;
const JUMP_DURATION = 35;

export class SpaceEscapeEngine {
  private player: Player;
  private obstacles: Obstacle[];
  private score: number;
  private distance: number;
  private coins: number;
  private isGameOver: boolean;
  private speed: number;
  private isPaused: boolean;
  private frameCount: number;
  private stars: { x: number; y: number; size: number; opacity: number; speed: number }[];
  private explosionParticles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[];
  private shieldTimer: number;
  private jumpTimer: number;

  constructor() {
    this.player = {
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: 0,
      lane: 1,
      isJumping: false,
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
    this.stars = [];
    this.explosionParticles = [];
    this.shieldTimer = 0;
    this.jumpTimer = 0;
    this.init();
  }

  init(): void {
    this.player = {
      x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
      y: CANVAS_HEIGHT - 120,
      lane: 1,
      isJumping: false,
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
    this.stars = this.generateStars();
    this.explosionParticles = [];
    this.shieldTimer = 0;
    this.jumpTimer = 0;
  }

  private generateStars(): { x: number; y: number; size: number; opacity: number; speed: number }[] {
    const stars: { x: number; y: number; size: number; opacity: number; speed: number }[] = [];
    for (let i = 0; i < 50; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 2 + 1
      });
    }
    return stars;
  }

  getState(): SpaceEscapeState {
    return {
      player: { ...this.player },
      obstacles: this.obstacles.map(o => ({ ...o })),
      score: this.score,
      distance: this.distance,
      coins: this.coins,
      isGameOver: this.isGameOver,
      speed: this.speed,
      isPaused: this.isPaused,
      stars: [...this.stars],
      explosionParticles: [...this.explosionParticles]
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

  private updatePlayerPosition(): void {
    const targetX = this.player.lane * LANE_WIDTH + LANE_WIDTH / 2 - PLAYER_SIZE / 2;
    this.player.x += (targetX - this.player.x) * 0.15;

    if (this.player.isJumping) {
      const jumpProgress = 1 - (this.jumpTimer / JUMP_DURATION);
      const jumpHeight = Math.sin(jumpProgress * Math.PI) * 80;
      this.player.y = CANVAS_HEIGHT - 120 - jumpHeight;
      this.jumpTimer--;

      if (this.jumpTimer <= 0) {
        this.player.isJumping = false;
        this.player.y = CANVAS_HEIGHT - 120;
      }
    } else {
      this.player.y = CANVAS_HEIGHT - 120;
    }
  }

  private spawnObstacle(): void {
    const types: ('asteroid' | 'debris' | 'laser' | 'coin' | 'shield')[] =
      ['asteroid', 'debris', 'laser', 'coin', 'shield'];
    const weights = [0.25, 0.2, 0.15, 0.3, 0.1];
    const rand = Math.random();
    let type: 'asteroid' | 'debris' | 'laser' | 'coin' | 'shield' = 'coin';
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
      width: type === 'asteroid' ? 55 : type === 'laser' ? 60 : 45,
      height: type === 'laser' ? 10 : 45,
      rotation: 0
    };

    if (type === 'asteroid' || type === 'debris') {
      obstacle.vx = (Math.random() - 0.5) * 3;
      obstacle.vy = Math.random() * 2;
    }

    this.obstacles.push(obstacle);
  }

  private updateObstacles(): void {
    const currentSpeed = this.player.boostActive ? this.speed * 1.3 : this.speed;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += currentSpeed;

      if (obs.vx !== undefined) {
        obs.x += obs.vx;
        if (obs.x < 0 || obs.x > CANVAS_WIDTH - obs.width) {
          obs.vx *= -1;
        }
      }

      if (obs.rotation !== undefined) {
        obs.rotation += 2;
      }

      if (obs.y > CANVAS_HEIGHT + 50) {
        this.obstacles.splice(i, 1);
        continue;
      }

      if (this.checkCollision(obs)) {
        if (obs.type === 'coin') {
          this.coins++;
          this.score += 80;
          this.obstacles.splice(i, 1);
        } else if (obs.type === 'shield') {
          this.player.isShielded = true;
          this.player.boostActive = true;
          this.shieldTimer = 150;
          this.obstacles.splice(i, 1);
        } else if (!this.player.isShielded) {
          this.createExplosion(this.player.x + PLAYER_SIZE / 2, this.player.y + PLAYER_SIZE / 2);
          this.isGameOver = true;
        }
      }
    }
  }

  private createExplosion(x: number, y: number): void {
    const colors = [NEON_COLORS.neonPink, NEON_COLORS.neonCyan, NEON_COLORS.gold, '#ff6b35'];
    for (let i = 0; i < 20; i++) {
      this.explosionParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 30 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  private checkCollision(obs: Obstacle): boolean {
    const playerLeft = this.player.x + 8;
    const playerRight = this.player.x + PLAYER_SIZE - 8;
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

    this.speed = Math.min(OBSTACLE_SPEED_INITIAL + this.distance / 300, 15);

    if (this.shieldTimer > 0) {
      this.shieldTimer--;
      if (this.shieldTimer === 0) {
        this.player.isShielded = false;
        this.player.boostActive = false;
      }
    }

    this.updatePlayerPosition();

    if (this.frameCount % OBSTACLE_SPAWN_RATE === 0) {
      this.spawnObstacle();
    }

    this.updateObstacles();

    this.stars.forEach(star => {
      star.y += star.speed * (this.player.boostActive ? 2 : 1);
      if (star.y > CANVAS_HEIGHT) {
        star.y = -10;
        star.x = Math.random() * CANVAS_WIDTH;
      }
    });

    this.explosionParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.vx *= 0.95;
      p.vy *= 0.95;
    });
    this.explosionParticles = this.explosionParticles.filter(p => p.life > 0);
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
