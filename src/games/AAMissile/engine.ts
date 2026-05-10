export interface Missile {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  speed: number;
  dx: number;
  dy: number;
  type: 'friendly' | 'enemy';
  status: 'flying' | 'exploded' | 'hit';
}

export interface Target {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: 'plane' | 'helicopter' | 'drone' | 'missile';
  speed: number;
  angle: number;
  destroyed: boolean;
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
  size: number;
}

export interface AAMissileState {
  playerMissiles: Missile[];
  enemyMissiles: Missile[];
  enemyTargets: Target[];
  explosions: Explosion[];
  score: number;
  level: number;
  lives: number;
  isGameOver: boolean;
  isPlaying: boolean;
  wave: number;
  enemiesDestroyed: number;
  missilesFired: number;
  accuracy: number;
}

export class AAMissileEngine {
  private CANVAS_WIDTH = 600;
  private CANVAS_HEIGHT = 800;
  private MISSILE_SPEED = 12;
  private ENEMY_MISSILE_SPEED = 6;
  private TARGET_SIZE = 40;

  private playerMissiles: Missile[];
  private enemyMissiles: Missile[];
  private enemyTargets: Target[];
  private explosions: Explosion[];
  private score: number;
  private level: number;
  private lives: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private wave: number;
  private enemiesDestroyed: number;
  private missilesFired: number;
  private waveTimer: number;
  private spawnTimer: number;
  private mouseX: number;
  private mouseY: number;
  private radarRange: number;
  private interceptRate: number;

  constructor() {
    this.playerMissiles = [];
    this.enemyMissiles = [];
    this.enemyTargets = [];
    this.explosions = [];
    this.score = 0;
    this.level = 1;
    this.lives = 10;
    this.isGameOver = false;
    this.isPlaying = false;
    this.wave = 1;
    this.enemiesDestroyed = 0;
    this.missilesFired = 0;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.mouseX = this.CANVAS_WIDTH / 2;
    this.mouseY = this.CANVAS_HEIGHT / 2;
    this.radarRange = 200;
    this.interceptRate = 0.3;
  }

  getState(): AAMissileState {
    return {
      playerMissiles: this.playerMissiles.map(m => ({ ...m })),
      enemyMissiles: this.enemyMissiles.map(m => ({ ...m })),
      enemyTargets: this.enemyTargets.map(t => ({ ...t })),
      explosions: this.explosions.map(e => ({ ...e })),
      score: this.score,
      level: this.level,
      lives: this.lives,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying,
      wave: this.wave,
      enemiesDestroyed: this.enemiesDestroyed,
      missilesFired: this.missilesFired,
      accuracy: this.missilesFired > 0 ? (this.enemiesDestroyed / this.missilesFired) * 100 : 0
    };
  }

  getCanvasSize() {
    return { width: this.CANVAS_WIDTH, height: this.CANVAS_HEIGHT };
  }

  start(): void {
    this.isPlaying = true;
  }

  reset(): void {
    this.playerMissiles = [];
    this.enemyMissiles = [];
    this.enemyTargets = [];
    this.explosions = [];
    this.score = 0;
    this.level = 1;
    this.lives = 10;
    this.isGameOver = false;
    this.isPlaying = false;
    this.wave = 1;
    this.enemiesDestroyed = 0;
    this.missilesFired = 0;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.interceptRate = 0.3;
  }

  setMousePosition(x: number, y: number): void {
    this.mouseX = x;
    this.mouseY = y;
  }

  fireMissile(): void {
    if (!this.isPlaying || this.isGameOver) return;
    this.missilesFired++;

    const launcherX = this.CANVAS_WIDTH / 2;
    const launcherY = this.CANVAS_HEIGHT - 50;

    let targetX = this.mouseX;
    let targetY = this.mouseY;

    if (this.enemyTargets.length > 0) {
      let nearestDist = Infinity;
      for (const target of this.enemyTargets) {
        if (target.destroyed) continue;
        const dist = Math.hypot(target.x - launcherX, target.y - launcherY);
        if (dist < nearestDist && dist < this.radarRange + this.level * 20) {
          nearestDist = dist;
          targetX = target.x + target.width / 2;
          targetY = target.y + target.height / 2;
        }
      }
    }

    const angle = Math.atan2(targetY - launcherY, targetX - launcherX);

    this.playerMissiles.push({
      x: launcherX,
      y: launcherY,
      startX: launcherX,
      startY: launcherY,
      targetX,
      targetY,
      speed: this.MISSILE_SPEED + this.level * 0.5,
      dx: Math.cos(angle),
      dy: Math.sin(angle),
      type: 'friendly',
      status: 'flying'
    });
  }

  private spawnTarget(): void {
    const types: ('plane' | 'helicopter' | 'drone' | 'missile')[] = ['plane', 'plane', 'drone', 'helicopter', 'missile'];
    const type = types[Math.floor(Math.random() * types.length)];
    let width = this.TARGET_SIZE;
    let height = this.TARGET_SIZE * 0.6;
    let health = 1;
    let speed = 2 + this.level * 0.2;
    let shootChance = 0.005;

    if (type === 'plane') {
      width = this.TARGET_SIZE * 1.5;
      height = this.TARGET_SIZE * 0.4;
      health = 2;
      speed = 3 + this.level * 0.15;
      shootChance = 0.003;
    } else if (type === 'helicopter') {
      width = this.TARGET_SIZE;
      height = this.TARGET_SIZE * 0.8;
      health = 2;
      speed = 1.5;
      shootChance = 0.008;
    } else if (type === 'drone') {
      width = this.TARGET_SIZE * 0.6;
      height = this.TARGET_SIZE * 0.3;
      health = 1;
      speed = 4;
      shootChance = 0.01;
    } else if (type === 'missile') {
      width = this.TARGET_SIZE * 0.3;
      height = this.TARGET_SIZE * 0.8;
      health = 1;
      speed = 5 + this.level * 0.3;
      shootChance = 0;
    }

    const side = Math.random();
    let x: number, y: number, angle: number;

    if (side < 0.4) {
      x = Math.random() * (this.CANVAS_WIDTH - width);
      y = -height;
      angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    } else if (side < 0.7) {
      x = -width;
      y = Math.random() * (this.CANVAS_HEIGHT / 2);
      angle = (Math.random() - 0.5) * 0.8;
    } else {
      x = this.CANVAS_WIDTH;
      y = Math.random() * (this.CANVAS_HEIGHT / 2);
      angle = Math.PI + (Math.random() - 0.5) * 0.8;
    }

    this.enemyTargets.push({
      x,
      y,
      width,
      height,
      health,
      maxHealth: health,
      type,
      speed,
      angle,
      destroyed: false
    });
  }

  private createExplosion(x: number, y: number, size: number): void {
    this.explosions.push({
      x,
      y,
      frame: 0,
      maxFrames: 25,
      size
    });
  }

  private checkCollision(
    missile: Missile,
    target: Target
  ): boolean {
    const mx = missile.x;
    const my = missile.y;
    return (
      mx > target.x &&
      mx < target.x + target.width &&
      my > target.y &&
      my < target.y + target.height
    );
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;

    this.waveTimer++;

    const enemiesPerWave = 5 + this.level * 2;
    const spawnInterval = Math.max(30, 120 - this.level * 10);
    this.spawnTimer++;
    if (this.spawnTimer > spawnInterval && this.enemyTargets.filter(t => !t.destroyed).length < enemiesPerWave) {
      this.spawnTarget();
      this.spawnTimer = 0;
    }

    for (let i = this.playerMissiles.length - 1; i >= 0; i--) {
      const missile = this.playerMissiles[i];
      
      if (missile.status === 'flying') {
        missile.x += missile.dx * missile.speed;
        missile.y += missile.dy * missile.speed;

        if (missile.y < 0 || missile.y > this.CANVAS_HEIGHT ||
            missile.x < 0 || missile.x > this.CANVAS_WIDTH) {
          missile.status = 'exploded';
          this.createExplosion(missile.x, missile.y, 20);
        }

        for (const target of this.enemyTargets) {
          if (target.destroyed) continue;
          if (this.checkCollision(missile, target)) {
            missile.status = 'hit';
            target.health--;
            
            if (target.health <= 0) {
              target.destroyed = true;
              this.enemiesDestroyed++;
              const baseScore = target.type === 'missile' ? 50 : target.type === 'plane' ? 100 : target.type === 'helicopter' ? 75 : 30;
              this.score += baseScore * this.level;
              this.createExplosion(target.x + target.width / 2, target.y + target.height / 2, target.width * 1.5);
            }
            break;
          }
        }
      }

      if (missile.status !== 'flying') {
        if (missile.status === 'exploded') {
          this.createExplosion(missile.x, missile.y, 20);
        }
        this.playerMissiles.splice(i, 1);
      }
    }

    for (let i = this.enemyTargets.length - 1; i >= 0; i--) {
      const target = this.enemyTargets[i];
      
      if (target.destroyed) {
        if (target.type === 'missile' && Math.random() < 0.3 + this.level * 0.05) {
          const launcherX = this.CANVAS_WIDTH / 2;
          const launcherY = this.CANVAS_HEIGHT - 50;
          const angle = Math.atan2(launcherY - target.y, launcherX - target.x);
          
          this.enemyMissiles.push({
            x: target.x + target.width / 2,
            y: target.y + target.height / 2,
            startX: target.x + target.width / 2,
            startY: target.y + target.height / 2,
            targetX: launcherX,
            targetY: launcherY,
            speed: this.ENEMY_MISSILE_SPEED,
            dx: Math.cos(angle),
            dy: Math.sin(angle),
            type: 'enemy',
            status: 'flying'
          });
        }
        this.enemyTargets.splice(i, 1);
        continue;
      }

      target.x += Math.cos(target.angle) * target.speed;
      target.y += Math.sin(target.angle) * target.speed;

      if (target.type === 'helicopter') {
        target.y += Math.sin(Date.now() / 200) * 0.5;
      }

      if (target.y > this.CANVAS_HEIGHT + 50 || target.y < -100 ||
          target.x < -100 || target.x > this.CANVAS_WIDTH + 100) {
        if (target.type === 'missile' && target.y > this.CANVAS_HEIGHT - 100) {
          this.lives--;
          this.createExplosion(target.x + target.width / 2, Math.min(target.y, this.CANVAS_HEIGHT - 20), 40);
          if (this.lives <= 0) {
            this.isGameOver = true;
          }
        }
        this.enemyTargets.splice(i, 1);
      }
    }

    for (let i = this.enemyMissiles.length - 1; i >= 0; i--) {
      const missile = this.enemyMissiles[i];
      
      if (missile.status === 'flying') {
        missile.x += missile.dx * missile.speed;
        missile.y += missile.dy * missile.speed;

        const launcherX = this.CANVAS_WIDTH / 2;
        const launcherY = this.CANVAS_HEIGHT - 50;
        const distToLauncher = Math.hypot(missile.x - launcherX, missile.y - launcherY);

        if (distToLauncher < 30) {
          if (Math.random() < this.interceptRate) {
            missile.status = 'exploded';
            this.score += 25;
            this.createExplosion(missile.x, missile.y, 25);
          } else {
            this.lives--;
            missile.status = 'exploded';
            this.createExplosion(missile.x, missile.y, 40);
            if (this.lives <= 0) {
              this.isGameOver = true;
            }
          }
        }

        if (missile.y > this.CANVAS_HEIGHT + 20) {
          this.enemyMissiles.splice(i, 1);
          continue;
        }
      }

      if (missile.status !== 'flying') {
        this.enemyMissiles.splice(i, 1);
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].frame++;
      if (this.explosions[i].frame > this.explosions[i].maxFrames) {
        this.explosions.splice(i, 1);
      }
    }

    this.level = Math.floor(this.waveTimer / 600) + 1;
    this.interceptRate = Math.min(0.8, 0.3 + this.level * 0.05);
    
    if (this.waveTimer > 0 && this.waveTimer % 600 === 0) {
      this.wave++;
    }
  }
}
