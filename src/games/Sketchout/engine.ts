export interface Position {
  x: number;
  y: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: 'player' | 'enemy';
  damage: number;
  radius: number;
  active: boolean;
}

export interface Tank {
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  isPlayer: boolean;
  lastShot: number;
}

export interface GameSketchoutState {
  player: Tank;
  enemy: Tank;
  projectiles: Projectile[];
  score: number;
  isGameOver: boolean;
  winner: 'player' | 'enemy' | null;
  wind: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const GRAVITY = 0.15;
const TANK_SIZE = 40;
const PROJECTILE_SPEED = 12;
const SHOT_COOLDOWN = 1000;

export class GameSketchoutEngine {
  private player: Tank;
  private enemy: Tank;
  private projectiles: Projectile[];
  private score: number;
  private isGameOver: boolean;
  private winner: 'player' | 'enemy' | null;
  private wind: number;
  private lastUpdate: number;

  constructor() {
    this.player = {
      x: 80,
      y: CANVAS_HEIGHT - 100,
      angle: 45,
      health: 100,
      maxHealth: 100,
      isPlayer: true,
      lastShot: 0
    };
    this.enemy = {
      x: CANVAS_WIDTH - 80,
      y: CANVAS_HEIGHT - 100,
      angle: 135,
      health: 100,
      maxHealth: 100,
      isPlayer: false,
      lastShot: 0
    };
    this.projectiles = [];
    this.score = 0;
    this.isGameOver = false;
    this.winner = null;
    this.wind = (Math.random() - 0.5) * 0.1;
    this.lastUpdate = Date.now();
  }

  init(): void {
    this.player = {
      x: 80,
      y: CANVAS_HEIGHT - 100,
      angle: 45,
      health: 100,
      maxHealth: 100,
      isPlayer: true,
      lastShot: 0
    };
    this.enemy = {
      x: CANVAS_WIDTH - 80,
      y: CANVAS_HEIGHT - 100,
      angle: 135,
      health: 100,
      maxHealth: 100,
      isPlayer: false,
      lastShot: 0
    };
    this.projectiles = [];
    this.score = 0;
    this.isGameOver = false;
    this.winner = null;
    this.wind = (Math.random() - 0.5) * 0.1;
  }

  getState(): GameSketchoutState {
    return {
      player: { ...this.player },
      enemy: { ...this.enemy },
      projectiles: this.projectiles.map(p => ({ ...p })),
      score: this.score,
      isGameOver: this.isGameOver,
      winner: this.winner,
      wind: this.wind
    };
  }

  aimLeft(): void {
    this.player.angle = Math.max(0, this.player.angle - 2);
  }

  aimRight(): void {
    this.player.angle = Math.min(180, this.player.angle + 2);
  }

  playerShoot(): void {
    const now = Date.now();
    if (now - this.player.lastShot < SHOT_COOLDOWN) return;
    if (this.isGameOver) return;

    this.player.lastShot = now;
    const rad = (this.player.angle * Math.PI) / 180;

    this.projectiles.push({
      x: this.player.x + Math.cos(rad) * TANK_SIZE,
      y: this.player.y - Math.sin(rad) * TANK_SIZE,
      vx: Math.cos(rad) * PROJECTILE_SPEED,
      vy: -Math.sin(rad) * PROJECTILE_SPEED,
      owner: 'player',
      damage: 25,
      radius: 8,
      active: true
    });
  }

  tick(): void {
    if (this.isGameOver) return;

    for (const proj of this.projectiles) {
      if (!proj.active) continue;

      proj.vy += GRAVITY;
      proj.vx += this.wind;
      proj.x += proj.vx;
      proj.y += proj.vy;

      if (proj.x < 0 || proj.x > CANVAS_WIDTH || proj.y > CANVAS_HEIGHT) {
        proj.active = false;
        continue;
      }

      const target = proj.owner === 'player' ? this.enemy : this.player;
      const dx = proj.x - target.x;
      const dy = proj.y - (target.y - TANK_SIZE / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < TANK_SIZE) {
        target.health -= proj.damage;
        proj.active = false;

        if (target.health <= 0) {
          this.isGameOver = true;
          this.winner = proj.owner;
          if (proj.owner === 'player') {
            this.score += 100;
          }
        }
      }
    }

    this.projectiles = this.projectiles.filter(p => p.active);

    if (!this.isGameOver && Math.random() < 0.02) {
      this.enemyShoot();
    }
  }

  private enemyShoot(): void {
    const now = Date.now();
    if (now - this.enemy.lastShot < SHOT_COOLDOWN * 1.5) return;

    const dx = this.player.x - this.enemy.x;
    const dy = (this.player.y - TANK_SIZE / 2) - (this.enemy.y - TANK_SIZE / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    const baseAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    const spread = (Math.random() - 0.5) * 20;
    const adjustedAngle = baseAngle + spread;

    this.enemy.angle = adjustedAngle;
    this.enemy.lastShot = now;

    const rad = (this.enemy.angle * Math.PI) / 180;

    this.projectiles.push({
      x: this.enemy.x + Math.cos(rad) * TANK_SIZE,
      y: this.enemy.y - Math.sin(rad) * TANK_SIZE,
      vx: Math.cos(rad) * PROJECTILE_SPEED * 0.8,
      vy: -Math.sin(rad) * PROJECTILE_SPEED * 0.8,
      owner: 'enemy',
      damage: 20,
      radius: 8,
      active: true
    });
  }

  reset(): void {
    this.init();
  }

  nextRound(): void {
    this.player.health = this.player.maxHealth;
    this.enemy.health = this.enemy.maxHealth;
    this.projectiles = [];
    this.isGameOver = false;
    this.winner = null;
    this.wind = (Math.random() - 0.5) * 0.2;
  }
}
