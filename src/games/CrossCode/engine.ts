export interface Player {
  x: number;
  y: number;
  velocityY: number;
  health: number;
  maxHealth: number;
  exp: number;
  level: number;
  direction: 'left' | 'right';
  isAttacking: boolean;
  attackCooldown: number;
  invincible: boolean;
  invincibleEndTime: number;
}

export interface Enemy {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  type: string;
  isDead: boolean;
  velocityX: number;
  velocityY: number;
}

export interface Item {
  x: number;
  y: number;
  type: 'health' | 'exp';
  value: number;
  collected: boolean;
}

export interface GameCrossCodeState {
  player: Player;
  enemies: Enemy[];
  items: Item[];
  score: number;
  level: number;
  isGameOver: boolean;
  isLevelUp: boolean;
  isStarted: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PLAYER_SIZE = 40;
const ENEMY_SIZE = 35;
const GRAVITY = 0.5;
const MOVE_SPEED = 5;
const JUMP_FORCE = -12;
const ATTACK_RANGE = 60;
const ATTACK_DAMAGE = 25;
const ATTACK_COOLDOWN = 500;

export class GameCrossCodeEngine {
  private player: Player;
  private enemies: Enemy[];
  private items: Item[];
  private score: number;
  private isGameOver: boolean;
  private isLevelUp: boolean;
  private isStarted: boolean;
  private groundY: number;
  private lastEnemySpawn: number;
  private enemySpawnInterval: number;

  constructor() {
    this.player = {
      x: 100,
      y: 300,
      velocityY: 0,
      health: 100,
      maxHealth: 100,
      exp: 0,
      level: 1,
      direction: 'right',
      isAttacking: false,
      attackCooldown: 0,
      invincible: false,
      invincibleEndTime: 0
    };
    this.enemies = [];
    this.items = [];
    this.score = 0;
    this.isGameOver = false;
    this.isLevelUp = false;
    this.isStarted = false;
    this.groundY = CANVAS_HEIGHT - 80;
    this.lastEnemySpawn = 0;
    this.enemySpawnInterval = 2000;
    this.spawnEnemies(3);
  }

  private spawnEnemies(count: number): void {
    for (let i = 0; i < count; i++) {
      this.enemies.push({
        x: 400 + Math.random() * 300,
        y: this.groundY - ENEMY_SIZE,
        health: 50 + this.player.level * 10,
        maxHealth: 50 + this.player.level * 10,
        type: Math.random() > 0.5 ? 'slime' : 'bat',
        isDead: false,
        velocityX: 0,
        velocityY: 0
      });
    }
  }

  getState(): GameCrossCodeState {
    return {
      player: { ...this.player },
      enemies: this.enemies.filter(e => !e.isDead).map(e => ({ ...e })),
      items: this.items.filter(i => !i.collected).map(i => ({ ...i })),
      score: this.score,
      level: this.player.level,
      isGameOver: this.isGameOver,
      isLevelUp: this.isLevelUp,
      isStarted: this.isStarted
    };
  }

  start(): void {
    this.isStarted = true;
  }

  moveLeft(): void {
    if (!this.isStarted || this.isGameOver) return;
    this.player.x -= MOVE_SPEED;
    this.player.direction = 'left';
  }

  moveRight(): void {
    if (!this.isStarted || this.isGameOver) return;
    this.player.x += MOVE_SPEED;
    this.player.direction = 'right';
  }

  jump(): void {
    if (!this.isStarted || this.isGameOver) return;
    if (this.player.y >= this.groundY - PLAYER_SIZE) {
      this.player.velocityY = JUMP_FORCE;
    }
  }

  attack(): void {
    if (!this.isStarted || this.isGameOver) return;
    if (Date.now() - this.player.attackCooldown < ATTACK_COOLDOWN) return;

    this.player.isAttacking = true;
    this.player.attackCooldown = Date.now();

    const attackX = this.player.x + (this.player.direction === 'right' ? 30 : -30);

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      const dx = enemy.x - attackX;
      const dy = enemy.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < ATTACK_RANGE) {
        enemy.health -= ATTACK_DAMAGE + this.player.level * 5;

        if (enemy.health <= 0) {
          enemy.isDead = true;
          this.score += 100;
          this.player.exp += 20;

          this.items.push({
            x: enemy.x,
            y: enemy.y - 20,
            type: Math.random() > 0.5 ? 'exp' : 'health',
            value: Math.random() > 0.5 ? 20 : 25,
            collected: false
          });

          if (this.player.exp >= this.player.level * 100) {
            this.player.level++;
            this.player.exp = 0;
            this.player.maxHealth += 20;
            this.player.health = this.player.maxHealth;
            this.isLevelUp = true;
          }
        }
      }
    }

    setTimeout(() => {
      this.player.isAttacking = false;
    }, 200);
  }

  tick(): void {
    if (!this.isStarted || this.isGameOver) return;

    if (this.player.velocityY !== undefined) {
      this.player.velocityY += GRAVITY;
      this.player.y += this.player.velocityY;

      if (this.player.y > this.groundY - PLAYER_SIZE) {
        this.player.y = this.groundY - PLAYER_SIZE;
        this.player.velocityY = 0;
      }
    }

    this.player.x = Math.max(PLAYER_SIZE / 2, Math.min(CANVAS_WIDTH - PLAYER_SIZE / 2, this.player.x));

    if (this.player.invincible && Date.now() > this.player.invincibleEndTime) {
      this.player.invincible = false;
    }

    const now = Date.now();
    if (now - this.lastEnemySpawn > this.enemySpawnInterval && this.enemies.filter(e => !e.isDead).length < 5) {
      this.spawnEnemies(1);
      this.lastEnemySpawn = now;
      this.enemySpawnInterval = Math.max(1000, this.enemySpawnInterval - 50);
    }

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      if (enemy.type === 'slime') {
        enemy.velocityX = (this.player.x > enemy.x ? 1 : -1) * (1 + this.player.level * 0.2);
        enemy.x += enemy.velocityX;
        enemy.y = this.groundY - ENEMY_SIZE + Math.sin(now / 200) * 5;
      } else {
        enemy.velocityX = Math.sin(now / 500 + enemy.x) * 2;
        enemy.x += enemy.velocityX;
        enemy.y = this.player.y - 50 + Math.sin(now / 300) * 30;
      }

      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < (PLAYER_SIZE + ENEMY_SIZE) / 2 && !this.player.invincible) {
        this.player.health -= 10;
        this.player.invincible = true;
        this.player.invincibleEndTime = now + 1000;

        if (this.player.health <= 0) {
          this.isGameOver = true;
        }
      }
    }

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (item.collected) continue;

      const dx = this.player.x - item.x;
      const dy = this.player.y - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < PLAYER_SIZE) {
        item.collected = true;
        if (item.type === 'health') {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + item.value);
        } else {
          this.player.exp += item.value;
          if (this.player.exp >= this.player.level * 100) {
            this.player.level++;
            this.player.exp = 0;
            this.player.maxHealth += 20;
            this.player.health = this.player.maxHealth;
            this.isLevelUp = true;
          }
        }
        this.score += 10;
      }
    }
  }

  dismissLevelUp(): void {
    this.isLevelUp = false;
  }

  reset(): void {
    this.player = {
      x: 100,
      y: 300,
      velocityY: 0,
      health: 100,
      maxHealth: 100,
      exp: 0,
      level: 1,
      direction: 'right',
      isAttacking: false,
      attackCooldown: 0,
      invincible: false,
      invincibleEndTime: 0
    };
    this.enemies = [];
    this.items = [];
    this.score = 0;
    this.isGameOver = false;
    this.isLevelUp = false;
    this.isStarted = false;
    this.lastEnemySpawn = 0;
    this.enemySpawnInterval = 2000;
    this.spawnEnemies(3);
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
