import { GEOMETRY_WARS_CONSTANTS } from '../../utils/geometryWarsConstants';

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SIZE,
  BULLET_SIZE,
  ENEMY_SIZE,
  PLAYER_SPEED,
  PLAYER_BULLET_SPEED,
  ENEMY_SPEED,
} = GEOMETRY_WARS_CONSTANTS;

export type EnemyType = 'cube' | 'diamond' | 'spinner' | 'worm' | 'seeker';

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  trail: { x: number; y: number }[];
}

export interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  health: number;
  type: EnemyType;
  angle: number;
  rotationSpeed: number;
  spawnTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface GridNode {
  x: number;
  y: number;
  active: boolean;
  intensity: number;
}

export interface Player {
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  invincibleTime: number;
  multiplier: number;
  score: number;
}

export interface GeometryWarsState {
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  particles: Particle[];
  grid: GridNode[][];
  score: number;
  wave: number;
  isGameOver: boolean;
  isPlaying: boolean;
  gameTime: number;
}

const ENEMY_COLORS: Record<EnemyType, string> = {
  cube: '#00ffff',
  diamond: '#ff00ff',
  spinner: '#ffff00',
  worm: '#00ff00',
  seeker: '#ff4444'
};

const PLAYER_COLOR = '#00ffff';
const BULLET_COLOR = '#ffffff';

export class GeometryWarsEngine {
  private player: Player;
  private bullets: Bullet[];
  private enemies: Enemy[];
  private particles: Particle[];
  private grid: GridNode[][];
  private score: number;
  private wave: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private gameTime: number;
  private keys: Set<string>;
  private mouseX: number;
  private mouseY: number;
  private lastShot: number;
  private shootInterval: number;
  private lastEnemySpawn: number;
  private enemySpawnInterval: number;
  private frameCount: number;
  private multiplierTimer: number;

  constructor() {
    this.player = this.createPlayer();
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.grid = this.createGrid();
    this.score = 0;
    this.wave = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.gameTime = 0;
    this.keys = new Set();
    this.mouseX = CANVAS_WIDTH / 2;
    this.mouseY = CANVAS_HEIGHT / 2;
    this.lastShot = 0;
    this.shootInterval = 100;
    this.lastEnemySpawn = 0;
    this.enemySpawnInterval = 1000;
    this.frameCount = 0;
    this.multiplierTimer = 0;
  }

  private createPlayer(): Player {
    return {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      size: PLAYER_SIZE,
      speed: PLAYER_SPEED,
      angle: 0,
      invincibleTime: 60,
      multiplier: 1,
      score: 0
    };
  }

  private createGrid(): GridNode[][] {
    const grid: GridNode[][] = [];
    const cellSize = 40;
    const cols = Math.ceil(CANVAS_WIDTH / cellSize) + 1;
    const rows = Math.ceil(CANVAS_HEIGHT / cellSize) + 1;

    for (let y = 0; y < rows; y++) {
      grid[y] = [];
      for (let x = 0; x < cols; x++) {
        grid[y][x] = {
          x: x * cellSize,
          y: y * cellSize,
          active: false,
          intensity: 0
        };
      }
    }
    return grid;
  }

  getState(): GeometryWarsState {
    return {
      player: { ...this.player },
      bullets: this.bullets.map(b => ({
        ...b,
        trail: [...b.trail]
      })),
      enemies: this.enemies.map(e => ({ ...e })),
      particles: this.particles.map(p => ({ ...p })),
      grid: this.grid.map(row => row.map(node => ({ ...node }))),
      score: this.score,
      wave: this.wave,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying,
      gameTime: this.gameTime
    };
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  start(): void {
    this.isPlaying = true;
    this.gameTime = 0;
    this.wave = 1;
  }

  reset(): void {
    this.player = this.createPlayer();
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.grid = this.createGrid();
    this.score = 0;
    this.wave = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.gameTime = 0;
    this.lastShot = 0;
    this.enemySpawnInterval = 1000;
    this.lastEnemySpawn = 0;
    this.frameCount = 0;
    this.multiplierTimer = 0;
  }

  setKeyPressed(key: string, pressed: boolean): void {
    if (pressed) {
      this.keys.add(key.toLowerCase());
    } else {
      this.keys.delete(key.toLowerCase());
    }
  }

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  private spawnEnemy(): void {
    const types: EnemyType[] = ['cube', 'diamond', 'spinner', 'worm', 'seeker'];
    const weights = [0.3, 0.2, 0.15, 0.2, 0.15];
    const rand = Math.random();
    let cumulative = 0;
    let type: EnemyType = 'cube';

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        type = types[i];
        break;
      }
    }

    let size = ENEMY_SIZE;
    let health = 1;
    let speed = ENEMY_SPEED + this.wave * 0.2;

    switch (type) {
      case 'cube':
        size = ENEMY_SIZE;
        health = 1;
        break;
      case 'diamond':
        size = ENEMY_SIZE * 0.8;
        health = 1;
        speed *= 1.3;
        break;
      case 'spinner':
        size = ENEMY_SIZE * 1.2;
        health = 2;
        speed *= 0.8;
        break;
      case 'worm':
        size = ENEMY_SIZE * 0.6;
        health = 1;
        speed *= 1.5;
        break;
      case 'seeker':
        size = ENEMY_SIZE * 0.7;
        health = 2;
        speed *= 1.2;
        break;
    }

    const side = Math.floor(Math.random() * 4);
    let x: number, y: number;

    switch (side) {
      case 0: x = Math.random() * CANVAS_WIDTH; y = -size; break;
      case 1: x = CANVAS_WIDTH + size; y = Math.random() * CANVAS_HEIGHT; break;
      case 2: x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT + size; break;
      default: x = -size; y = Math.random() * CANVAS_HEIGHT; break;
    }

    const angle = Math.atan2(CANVAS_HEIGHT / 2 - y, CANVAS_WIDTH / 2 - x);
    const dist = Math.sqrt((CANVAS_WIDTH / 2 - x) ** 2 + (CANVAS_HEIGHT / 2 - y) ** 2);
    const spawnDelay = (dist / 500) * 60;

    this.enemies.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      health,
      type,
      angle: Math.random() * Math.PI * 2,
      rotationSpeed: 0.05 + Math.random() * 0.05,
      spawnTimer: spawnDelay
    });
  }

  private createExplosion(x: number, y: number, color: string, count: number, speed: number = 5): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        size: 2 + Math.random() * 3,
        color,
        life: 30 + Math.random() * 20,
        maxLife: 50
      });
    }
  }

  private activateGrid(x: number, y: number, radius: number): void {
    const cellSize = 40;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    const cellRadius = Math.ceil(radius / cellSize);

    for (let dy = -cellRadius; dy <= cellRadius; dy++) {
      for (let dx = -cellRadius; dx <= cellRadius; dx++) {
        const r = row + dy;
        const c = col + dx;
        if (r >= 0 && r < this.grid.length && c >= 0 && c < this.grid[0].length) {
          const dist = Math.sqrt((dx * cellSize) ** 2 + (dy * cellSize) ** 2);
          if (dist <= radius) {
            this.grid[r][c].active = true;
            this.grid[r][c].intensity = Math.max(this.grid[r][c].intensity, 1 - dist / radius);
          }
        }
      }
    }
  }

  private fireBullet(): void {
    const now = Date.now();
    if (now - this.lastShot < this.shootInterval) return;
    this.lastShot = now;

    const angle = this.player.angle;
    const speed = PLAYER_BULLET_SPEED;

    this.bullets.push({
      x: this.player.x,
      y: this.player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: BULLET_SIZE,
      color: BULLET_COLOR,
      trail: []
    });
  }

  private checkCollision(
    a: { x: number; y: number; size: number },
    b: { x: number; y: number; size: number }
  ): boolean {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (a.size + b.size) / 2;
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;

    this.frameCount++;
    this.gameTime += 1 / 60;
    this.wave = Math.floor(this.gameTime / 20) + 1;

    if (this.multiplierTimer > 0) {
      this.multiplierTimer--;
      if (this.multiplierTimer <= 0) {
        this.player.multiplier = 1;
      }
    }

    const dx = this.mouseX - this.player.x;
    const dy = this.mouseY - this.player.y;
    this.player.angle = Math.atan2(dy, dx);

    const moveSpeed = this.player.speed;
    if (this.keys.has('w') || this.keys.has('arrowup')) {
      this.player.y -= moveSpeed;
    }
    if (this.keys.has('s') || this.keys.has('arrowdown')) {
      this.player.y += moveSpeed;
    }
    if (this.keys.has('a') || this.keys.has('arrowleft')) {
      this.player.x -= moveSpeed;
    }
    if (this.keys.has('d') || this.keys.has('arrowright')) {
      this.player.x += moveSpeed;
    }

    this.player.x = Math.max(this.player.size, Math.min(CANVAS_WIDTH - this.player.size, this.player.x));
    this.player.y = Math.max(this.player.size, Math.min(CANVAS_HEIGHT - this.player.size, this.player.y));

    this.fireBullet();

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.trail.unshift({ x: bullet.x, y: bullet.y });
      if (bullet.trail.length > 5) {
        bullet.trail.pop();
      }

      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      if (bullet.x < -bullet.size || bullet.x > CANVAS_WIDTH + bullet.size ||
          bullet.y < -bullet.size || bullet.y > CANVAS_HEIGHT + bullet.size) {
        this.bullets.splice(i, 1);
      }
    }

    const now = Date.now();
    this.enemySpawnInterval = Math.max(300, 1000 - this.wave * 70);
    if (now - this.lastEnemySpawn > this.enemySpawnInterval) {
      this.spawnEnemy();
      this.lastEnemySpawn = now;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (enemy.spawnTimer > 0) {
        enemy.spawnTimer--;
        continue;
      }

      enemy.angle += enemy.rotationSpeed;

      switch (enemy.type) {
        case 'cube':
          break;
        case 'diamond':
          enemy.angle += 0.02;
          break;
        case 'spinner':
          enemy.rotationSpeed = 0.1;
          enemy.angle += enemy.rotationSpeed;
          break;
        case 'worm':
          enemy.vx += (Math.random() - 0.5) * 0.2;
          enemy.vy += (Math.random() - 0.5) * 0.2;
          const wormSpeed = Math.sqrt(enemy.vx ** 2 + enemy.vy ** 2);
          if (wormSpeed > ENEMY_SPEED * 2) {
            enemy.vx = (enemy.vx / wormSpeed) * ENEMY_SPEED * 2;
            enemy.vy = (enemy.vy / wormSpeed) * ENEMY_SPEED * 2;
          }
          break;
        case 'seeker':
          const seekAngle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
          enemy.vx += Math.cos(seekAngle) * 0.1;
          enemy.vy += Math.sin(seekAngle) * 0.1;
          const seekSpeed = Math.sqrt(enemy.vx ** 2 + enemy.vy ** 2);
          if (seekSpeed > ENEMY_SPEED * 1.5) {
            enemy.vx = (enemy.vx / seekSpeed) * ENEMY_SPEED * 1.5;
            enemy.vy = (enemy.vy / seekSpeed) * ENEMY_SPEED * 1.5;
          }
          break;
      }

      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      if (enemy.x < -enemy.size * 2 || enemy.x > CANVAS_WIDTH + enemy.size * 2 ||
          enemy.y < -enemy.size * 2 || enemy.y > CANVAS_HEIGHT + enemy.size * 2) {
        this.enemies.splice(i, 1);
        continue;
      }

      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const bullet = this.bullets[j];
        if (this.checkCollision(
          { x: bullet.x, y: bullet.y, size: bullet.size },
          { x: enemy.x, y: enemy.y, size: enemy.size }
        )) {
          this.bullets.splice(j, 1);
          enemy.health--;

          this.createExplosion(bullet.x, bullet.y, ENEMY_COLORS[enemy.type], 5, 3);
          this.activateGrid(bullet.x, bullet.y, 30);

          if (enemy.health <= 0) {
            const baseScore = enemy.type === 'spinner' ? 30 : enemy.type === 'seeker' ? 25 :
                            enemy.type === 'worm' ? 20 : enemy.type === 'diamond' ? 15 : 10;
            this.score += baseScore * this.player.multiplier;
            this.multiplierTimer = 120;
            this.player.multiplier = Math.min(this.player.multiplier + 0.1, 5);

            this.createExplosion(enemy.x, enemy.y, ENEMY_COLORS[enemy.type], 15, 6);
            this.activateGrid(enemy.x, enemy.y, 60);

            this.enemies.splice(i, 1);
          }
          break;
        }
      }

      if (this.player.invincibleTime <= 0) {
        if (this.checkCollision(
          { x: this.player.x, y: this.player.y, size: this.player.size },
          { x: enemy.x, y: enemy.y, size: enemy.size }
        )) {
          this.createExplosion(this.player.x, this.player.y, PLAYER_COLOR, 20, 8);
          this.activateGrid(this.player.x, this.player.y, 100);
          this.isGameOver = true;
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life--;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[0].length; x++) {
        if (this.grid[y][x].active) {
          this.grid[y][x].intensity -= 0.02;
          if (this.grid[y][x].intensity <= 0) {
            this.grid[y][x].active = false;
            this.grid[y][x].intensity = 0;
          }
        }
      }
    }

    if (this.player.invincibleTime > 0) {
      this.player.invincibleTime--;
    }
  }
}
