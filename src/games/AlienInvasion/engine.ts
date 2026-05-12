import { ALIEN_INVASION_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, BULLET_WIDTH, BULLET_HEIGHT, ALIEN_WIDTH, ALIEN_HEIGHT } = ALIEN_INVASION_CONSTANTS;

export type AlienType = 'scout' | 'fighter' | 'motherShip';

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isEnemy: boolean;
}

export interface Alien {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: AlienType;
  shootTimer: number;
  angle: number;
  special: boolean;
}

export interface PowerUp {
  x: number;
  y: number;
  type: 'laser' | 'shield' | 'nuke';
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
  radius: number;
}

export interface AlienInvasionState {
  player: { x: number; y: number; laser: boolean; shield: boolean; };
  playerBullets: Bullet[];
  alienBullets: Bullet[];
  aliens: Alien[];
  powerUps: PowerUp[];
  explosions: Explosion[];
  score: number;
  lives: number;
  wave: number;
  isGameOver: boolean;
  isPlaying: boolean;
}

export class AlienInvasionEngine {
  private player: { x: number; y: number; vx: number; vy: number; laser: boolean; shield: boolean; };
  private playerBullets: Bullet[];
  private alienBullets: Bullet[];
  private aliens: Alien[];
  private powerUps: PowerUp[];
  private explosions: Explosion[];
  private score: number;
  private lives: number;
  private wave: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private lastAlienSpawn: number;
  private keys: Set<string>;
  private lastShot: number;
  private lastPowerUp: number;

  constructor() {
    this.player = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 80,
      vx: 0,
      vy: 0,
      laser: false,
      shield: false
    };
    this.playerBullets = [];
    this.alienBullets = [];
    this.aliens = [];
    this.powerUps = [];
    this.explosions = [];
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastAlienSpawn = 0;
    this.keys = new Set();
    this.lastShot = 0;
    this.lastPowerUp = 0;
  }

  getState(): AlienInvasionState {
    return {
      player: { x: this.player.x, y: this.player.y, laser: this.player.laser, shield: this.player.shield },
      playerBullets: this.playerBullets.map(b => ({ ...b })),
      alienBullets: this.alienBullets.map(b => ({ ...b })),
      aliens: this.aliens.map(a => ({ ...a })),
      powerUps: this.powerUps.map(p => ({ ...p })),
      explosions: this.explosions.map(e => ({ ...e })),
      score: this.score,
      lives: this.lives,
      wave: this.wave,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying
    };
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  start(): void {
    this.isPlaying = true;
  }

  reset(): void {
    this.player = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 80, vx: 0, vy: 0, laser: false, shield: false };
    this.playerBullets = [];
    this.alienBullets = [];
    this.aliens = [];
    this.powerUps = [];
    this.explosions = [];
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.lastAlienSpawn = 0;
    this.lastPowerUp = 0;
    this.explosions = [];
  }

  setKey(key: string, pressed: boolean): void {
    if (pressed) {
      this.keys.add(key);
    } else {
      this.keys.delete(key);
    }
  }

  shoot(): void {
    if (!this.isPlaying || this.isGameOver) return;

    const now = Date.now();
    const interval = this.player.laser ? 50 : 200;
    if (now - this.lastShot < interval) return;
    this.lastShot = now;

    if (this.player.laser) {
      this.playerBullets.push({
        x: this.player.x - PLAYER_WIDTH / 2,
        y: this.player.y - PLAYER_HEIGHT / 2,
        vx: 0,
        vy: -20,
        isEnemy: false
      });
      this.playerBullets.push({
        x: this.player.x + PLAYER_WIDTH / 2,
        y: this.player.y - PLAYER_HEIGHT / 2,
        vx: 0,
        vy: -20,
        isEnemy: false
      });
    } else {
      this.playerBullets.push({
        x: this.player.x,
        y: this.player.y - PLAYER_HEIGHT / 2,
        vx: 0,
        vy: -15,
        isEnemy: false
      });
    }
  }

  useNuke(): void {
    if (!this.isPlaying || this.isGameOver) return;

    for (const alien of this.aliens) {
      this.createExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2, 40);
      this.score += alien.type === 'motherShip' ? 100 : alien.type === 'fighter' ? 30 : 10;
    }
    this.aliens = [];
    this.alienBullets = [];
  }

  private createExplosion(x: number, y: number, size: number): void {
    this.explosions.push({ x, y, frame: 0, maxFrames: 30, radius: size });
  }

  private spawnAlien(): void {
    const types: AlienType[] = ['scout', 'fighter', 'motherShip'];
    const weights = [0.5, 0.4, 0.1];

    let rand = Math.random();
    let typeIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      if (rand < weights[i]) {
        typeIndex = i;
        break;
      }
      rand -= weights[i];
    }

    const type = types[typeIndex];
    const width = type === 'motherShip' ? ALIEN_WIDTH + 40 : type === 'fighter' ? ALIEN_WIDTH + 10 : ALIEN_WIDTH;
    const height = type === 'motherShip' ? ALIEN_HEIGHT + 30 : type === 'fighter' ? ALIEN_HEIGHT + 5 : ALIEN_HEIGHT;

    const x = Math.random() * (CANVAS_WIDTH - width);
    const y = -height;

    let vx = 0;
    let vy = 2 + this.wave * 0.3;

    if (type === 'scout') {
      vx = (Math.random() - 0.5) * 4;
    } else if (type === 'fighter') {
      vx = (Math.random() - 0.5) * 2;
    }

    this.aliens.push({
      x, y, vx, vy, width, height,
      health: type === 'motherShip' ? 8 : type === 'fighter' ? 2 : 1,
      maxHealth: type === 'motherShip' ? 8 : type === 'fighter' ? 2 : 1,
      type, shootTimer: Math.random() * 60, angle: 0, special: type === 'motherShip'
    });
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: ('laser' | 'shield' | 'nuke')[] = ['laser', 'shield', 'nuke'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerUps.push({ x, y, type });
  }

  private checkCollision(a: { x: number; y: number }, b: { x: number; y: number; width?: number; height?: number }, radiusA: number): boolean {
    const dx = a.x - (b.x + (b.width || 0) / 2);
    const dy = a.y - (b.y + (b.height || 0) / 2);
    return Math.sqrt(dx * dx + dy * dy) < radiusA + (b.width || 0) / 2;
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;

    const speed = 6;

    if (this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('A')) {
      this.player.vx -= 0.8;
    }
    if (this.keys.has('ArrowRight') || this.keys.has('d') || this.keys.has('D')) {
      this.player.vx += 0.8;
    }
    if (this.keys.has('ArrowUp') || this.keys.has('w') || this.keys.has('W')) {
      this.player.vy -= 0.8;
    }
    if (this.keys.has('ArrowDown') || this.keys.has('s') || this.keys.has('S')) {
      this.player.vy += 0.8;
    }

    this.player.vx *= 0.92;
    this.player.vy *= 0.92;

    this.player.vx = Math.max(-speed, Math.min(speed, this.player.vx));
    this.player.vy = Math.max(-speed, Math.min(speed, this.player.vy));

    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    this.player.x = Math.max(PLAYER_WIDTH / 2, Math.min(CANVAS_WIDTH - PLAYER_WIDTH / 2, this.player.x));
    this.player.y = Math.max(PLAYER_HEIGHT / 2, Math.min(CANVAS_HEIGHT - PLAYER_HEIGHT / 2, this.player.y));

    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      if (bullet.y < -20 || bullet.x < -20 || bullet.x > CANVAS_WIDTH + 20) {
        this.playerBullets.splice(i, 1);
      }
    }

    for (let i = this.alienBullets.length - 1; i >= 0; i--) {
      const bullet = this.alienBullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      if (bullet.y > CANVAS_HEIGHT + 20 || bullet.x < -20 || bullet.x > CANVAS_WIDTH + 20) {
        this.alienBullets.splice(i, 1);
      }
    }

    const now = Date.now();
    if (now - this.lastAlienSpawn > Math.max(500, 1500 - this.wave * 100)) {
      this.spawnAlien();
      this.lastAlienSpawn = now;
    }

    for (let i = this.aliens.length - 1; i >= 0; i--) {
      const alien = this.aliens[i];
      alien.x += alien.vx;
      alien.y += alien.vy;

      if (alien.x < 0 || alien.x > CANVAS_WIDTH - alien.width) {
        alien.vx *= -1;
      }
      if (alien.y > CANVAS_HEIGHT + 50) {
        this.aliens.splice(i, 1);
        continue;
      }

      alien.shootTimer++;
      const shootInterval = alien.type === 'motherShip' ? 30 : alien.type === 'fighter' ? 60 : 120;
      if (alien.shootTimer > shootInterval && Math.random() < 0.05) {
        const dx = this.player.x - (alien.x + alien.width / 2);
        const dy = this.player.y - (alien.y + alien.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.alienBullets.push({
          x: alien.x + alien.width / 2,
          y: alien.y + alien.height,
          vx: (dx / dist) * 6,
          vy: (dy / dist) * 6,
          isEnemy: true
        });
        alien.shootTimer = 0;
      }

      for (let j = this.playerBullets.length - 1; j >= 0; j--) {
        const bullet = this.playerBullets[j];
        if (this.checkCollision(
          { x: bullet.x, y: bullet.y },
          { x: alien.x, y: alien.y, width: alien.width, height: alien.height },
          5
        )) {
          this.playerBullets.splice(j, 1);
          alien.health--;

          if (alien.health <= 0) {
            this.createExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2, 50);
            this.score += alien.type === 'motherShip' ? 100 : alien.type === 'fighter' ? 30 : 10;

            if (Math.random() < 0.15) {
              this.spawnPowerUp(alien.x + alien.width / 2, alien.y);
            }

            this.aliens.splice(i, 1);
          }
          break;
        }
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.y += 1.5;

      if (powerUp.y > CANVAS_HEIGHT) {
        this.powerUps.splice(i, 1);
        continue;
      }

      if (this.checkCollision(
        { x: powerUp.x, y: powerUp.y },
        { x: this.player.x - PLAYER_WIDTH / 2, y: this.player.y - PLAYER_HEIGHT / 2, width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
        15
      )) {
        if (powerUp.type === 'laser') {
          this.player.laser = true;
        } else if (powerUp.type === 'shield') {
          this.player.shield = true;
        } else if (powerUp.type === 'nuke') {
          this.useNuke();
        }
        this.powerUps.splice(i, 1);
      }
    }

    for (const bullet of this.alienBullets) {
      if (this.checkCollision(
        { x: bullet.x, y: bullet.y },
        { x: this.player.x - PLAYER_WIDTH / 2, y: this.player.y - PLAYER_HEIGHT / 2, width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
        5
      )) {
        if (this.player.shield) {
          this.player.shield = false;
        } else {
          this.lives--;
          this.createExplosion(this.player.x, this.player.y, 40);
          if (this.lives <= 0) {
            this.isGameOver = true;
          }
        }
        break;
      }
    }

    for (const alien of this.aliens) {
      if (this.checkCollision(
        { x: this.player.x, y: this.player.y },
        { x: alien.x, y: alien.y, width: alien.width, height: alien.height },
        PLAYER_WIDTH / 2
      )) {
        if (this.player.shield) {
          this.player.shield = false;
          this.aliens = this.aliens.filter(a => a !== alien);
          this.createExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2, 40);
        } else {
          this.lives--;
          this.createExplosion(alien.x + alien.width / 2, alien.y + alien.height / 2, 50);
          this.aliens = this.aliens.filter(a => a !== alien);
          if (this.lives <= 0) {
            this.isGameOver = true;
          }
        }
        break;
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].frame++;
      if (this.explosions[i].frame > this.explosions[i].maxFrames) {
        this.explosions.splice(i, 1);
      }
    }

    if (this.score > this.wave * 400) {
      this.wave++;
    }

    if (now - this.lastPowerUp > 10000 && this.player.laser) {
      this.player.laser = false;
      this.lastPowerUp = now;
    }
  }
}
