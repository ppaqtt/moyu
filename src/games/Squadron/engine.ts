export interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  isEnemy: boolean;
  ownerIndex: number;
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: 'scout' | 'fighter' | 'bomber';
  speed: number;
  shootTimer: number;
}

export interface SquadronMember {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  health: number;
  maxHealth: number;
  alive: boolean;
  respawnTimer: number;
  invincibleTime: number;
}

export interface Explosion {
  x: number;
  y: number;
  frame: number;
  maxFrames: number;
  size: number;
}

export interface PowerUp {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'repair' | 'ammo' | 'shield' | 'bomb';
}

export interface SquadronState {
  squadron: SquadronMember[];
  playerBullets: Bullet[];
  enemyBullets: Bullet[];
  enemies: Enemy[];
  explosions: Explosion[];
  powerUps: PowerUp[];
  score: number;
  level: number;
  isGameOver: boolean;
  isPlaying: boolean;
  formation: number;
  ammo: number;
  maxAmmo: number;
}

export class SquadronEngine {
  private CANVAS_WIDTH = 600;
  private CANVAS_HEIGHT = 800;
  private MEMBER_SIZE = 35;
  private FORMATION_COUNT = 5;
  private BULLET_WIDTH = 4;
  private BULLET_HEIGHT = 12;
  private ENEMY_SIZE = 35;

  private squadron: SquadronMember[];
  private playerBullets: Bullet[];
  private enemyBullets: Bullet[];
  private enemies: Enemy[];
  private explosions: Explosion[];
  private powerUps: PowerUp[];
  private score: number;
  private level: number;
  private isGameOver: boolean;
  private isPlaying: boolean;
  private formation: number;
  private ammo: number;
  private maxAmmo: number;
  private lastShot: number;
  private spawnTimer: number;
  private keys: Set<string>;
  private leaderX: number;
  private leaderY: number;
  private invincibleTime: number;

  constructor() {
    this.squadron = this.createSquadron();
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.explosions = [];
    this.powerUps = [];
    this.score = 0;
    this.level = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.formation = 0;
    this.ammo = 100;
    this.maxAmmo = 100;
    this.lastShot = 0;
    this.spawnTimer = 0;
    this.keys = new Set();
    this.leaderX = this.CANVAS_WIDTH / 2;
    this.leaderY = this.CANVAS_HEIGHT - 100;
    this.invincibleTime = 0;
  }

  private getFormationOffsets(formIndex: number): { offsetX: number; offsetY: number }[] {
    const formations = [
      [{ offsetX: 0, offsetY: 0 }, { offsetX: -50, offsetY: 30 }, { offsetX: 50, offsetY: 30 }, { offsetX: -100, offsetY: 60 }, { offsetX: 100, offsetY: 60 }],
      [{ offsetX: 0, offsetY: 0 }, { offsetX: -30, offsetY: 40 }, { offsetX: 30, offsetY: 40 }, { offsetX: -60, offsetY: 80 }, { offsetX: 60, offsetY: 80 }],
      [{ offsetX: 0, offsetY: 0 }, { offsetX: -40, offsetY: 20 }, { offsetX: 40, offsetY: 20 }, { offsetX: -80, offsetY: 40 }, { offsetX: 80, offsetY: 40 }],
      [{ offsetX: 0, offsetY: 0 }, { offsetX: 0, offsetY: 50 }, { offsetX: -50, offsetY: 50 }, { offsetX: 50, offsetY: 50 }, { offsetX: -25, offsetY: 100 }],
      [{ offsetX: 0, offsetY: 0 }, { offsetX: -60, offsetY: 0 }, { offsetX: 60, offsetY: 0 }, { offsetX: -30, offsetY: 50 }, { offsetX: 30, offsetY: 50 }]
    ];
    return formations[formIndex % formations.length];
  }

  private createSquadron(): SquadronMember[] {
    const offsets = this.getFormationOffsets(0);
    return offsets.map((offset, i) => ({
      x: this.CANVAS_WIDTH / 2 + offset.offsetX,
      y: this.CANVAS_HEIGHT - 100 + offset.offsetY,
      offsetX: offset.offsetX,
      offsetY: offset.offsetY,
      health: 100,
      maxHealth: 100,
      alive: i === 0,
      respawnTimer: i === 0 ? 0 : 300,
      invincibleTime: i === 0 ? 180 : 0
    }));
  }

  getState(): SquadronState {
    return {
      squadron: this.squadron.map(m => ({ ...m })),
      playerBullets: this.playerBullets.map(b => ({ ...b })),
      enemyBullets: this.enemyBullets.map(b => ({ ...b })),
      enemies: this.enemies.map(e => ({ ...e })),
      explosions: this.explosions.map(e => ({ ...e })),
      powerUps: this.powerUps.map(p => ({ ...p })),
      score: this.score,
      level: this.level,
      isGameOver: this.isGameOver,
      isPlaying: this.isPlaying,
      formation: this.formation,
      ammo: this.ammo,
      maxAmmo: this.maxAmmo
    };
  }

  getCanvasSize() {
    return { width: this.CANVAS_WIDTH, height: this.CANVAS_HEIGHT };
  }

  start(): void {
    this.isPlaying = true;
  }

  reset(): void {
    this.squadron = this.createSquadron();
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.explosions = [];
    this.powerUps = [];
    this.score = 0;
    this.level = 1;
    this.isGameOver = false;
    this.isPlaying = false;
    this.formation = 0;
    this.ammo = 100;
    this.maxAmmo = 100;
    this.lastShot = 0;
    this.spawnTimer = 0;
    this.leaderX = this.CANVAS_WIDTH / 2;
    this.leaderY = this.CANVAS_HEIGHT - 100;
    this.invincibleTime = 0;
  }

  setKeyDown(key: string): void {
    this.keys.add(key);
  }

  setKeyUp(key: string): void {
    this.keys.delete(key);
  }

  shoot(): void {
    if (!this.isPlaying || this.isGameOver || this.ammo <= 0) return;
    const now = Date.now();
    if (now - this.lastShot < 100) return;
    this.lastShot = now;
    this.ammo = Math.max(0, this.ammo - 1);

    this.squadron.forEach((member, index) => {
      if (!member.alive) return;
      this.playerBullets.push({
        x: member.x,
        y: member.y,
        width: this.BULLET_WIDTH,
        height: this.BULLET_HEIGHT,
        speed: 12,
        isEnemy: false,
        ownerIndex: index
      });
    });
  }

  private spawnEnemy(): void {
    const types: ('scout' | 'fighter' | 'bomber')[] = ['scout', 'scout', 'fighter', 'fighter', 'bomber'];
    const type = types[Math.floor(Math.random() * types.length)];
    let width = this.ENEMY_SIZE;
    let height = this.ENEMY_SIZE;
    let health = 1;
    let speed = 2 + this.level * 0.2;
    let shootTimer = 0;

    if (type === 'bomber') {
      width = this.ENEMY_SIZE * 1.5;
      height = this.ENEMY_SIZE * 1.2;
      health = 4;
      speed = 1;
      shootTimer = 50;
    } else if (type === 'fighter') {
      health = 2;
      speed = 2.5;
      shootTimer = 70;
    }

    this.enemies.push({
      x: Math.random() * (this.CANVAS_WIDTH - width),
      y: -height,
      width,
      height,
      health,
      maxHealth: health,
      type,
      speed,
      shootTimer
    });
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: ('repair' | 'ammo' | 'shield' | 'bomb')[] = ['repair', 'ammo', 'shield', 'bomb'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerUps.push({
      x: x - 15,
      y: y - 15,
      width: 30,
      height: 30,
      type
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
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  tick(): void {
    if (!this.isPlaying || this.isGameOver) return;

    if (this.keys.has('ArrowLeft') || this.keys.has('a')) {
      this.leaderX -= 6;
    }
    if (this.keys.has('ArrowRight') || this.keys.has('d')) {
      this.leaderX += 6;
    }
    if (this.keys.has('ArrowUp') || this.keys.has('w')) {
      this.leaderY -= 4;
    }
    if (this.keys.has('ArrowDown') || this.keys.has('s')) {
      this.leaderY += 4;
    }

    this.leaderX = Math.max(this.MEMBER_SIZE, Math.min(this.CANVAS_WIDTH - this.MEMBER_SIZE, this.leaderX));
    this.leaderY = Math.max(this.CANVAS_HEIGHT / 2, Math.min(this.CANVAS_HEIGHT - 50, this.leaderY));

    if (this.keys.has('Tab')) {
      this.formation = (this.formation + 1) % 5;
      const offsets = this.getFormationOffsets(this.formation);
      this.squadron.forEach((member, i) => {
        member.offsetX = offsets[i].offsetX;
        member.offsetY = offsets[i].offsetY;
      });
      this.keys.delete('Tab');
    }

    if (this.keys.has(' ')) {
      this.shoot();
    }
    if (this.keys.has('Shift')) {
      this.useBomb();
    }

    const offsets = this.getFormationOffsets(this.formation);
    this.squadron.forEach((member, i) => {
      if (!member.alive) {
        member.respawnTimer--;
        if (member.respawnTimer <= 0) {
          member.alive = true;
          member.health = member.maxHealth;
          member.invincibleTime = 180;
        }
      } else {
        const targetX = this.leaderX + offsets[i].offsetX;
        const targetY = this.leaderY + offsets[i].offsetY;
        member.x += (targetX - member.x) * 0.15;
        member.y += (targetY - member.y) * 0.15;

        if (member.invincibleTime > 0) {
          member.invincibleTime--;
        }
      }
    });

    if (this.invincibleTime > 0) {
      this.invincibleTime--;
    }

    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      bullet.y -= bullet.speed;
      if (bullet.y < -bullet.height) {
        this.playerBullets.splice(i, 1);
      }
    }

    const spawnRate = Math.max(600, 1500 - this.level * 100);
    this.spawnTimer++;
    if (this.spawnTimer > spawnRate / 16) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.y += enemy.speed;

      enemy.shootTimer--;
      if (enemy.shootTimer <= 0) {
        const leader = this.squadron[0];
        if (leader.alive) {
          const angle = Math.atan2(leader.y - enemy.y, leader.x - enemy.x);
          this.enemyBullets.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height,
            width: 6,
            height: 10,
            speed: 4 + this.level * 0.3,
            isEnemy: true,
            ownerIndex: -1
          });
        }
        enemy.shootTimer = enemy.type === 'bomber' ? 40 : 80;
      }

      if (enemy.y > this.CANVAS_HEIGHT + enemy.height) {
        this.enemies.splice(i, 1);
        continue;
      }

      for (let j = this.playerBullets.length - 1; j >= 0; j--) {
        const bullet = this.playerBullets[j];
        if (this.checkCollision(bullet, enemy)) {
          this.playerBullets.splice(j, 1);
          enemy.health--;

          if (enemy.health <= 0) {
            const baseScore = enemy.type === 'bomber' ? 80 : enemy.type === 'fighter' ? 40 : 20;
            this.score += baseScore * this.level;
            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width);

            if (Math.random() < 0.25) {
              this.spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            }

            this.enemies.splice(i, 1);
          }
          break;
        }
      }
    }

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      bullet.y += bullet.speed;

      if (bullet.y > this.CANVAS_HEIGHT) {
        this.enemyBullets.splice(i, 1);
        continue;
      }

      for (let j = 0; j < this.squadron.length; j++) {
        const member = this.squadron[j];
        if (!member.alive || member.invincibleTime > 0) continue;

        const bulletBox = { x: bullet.x - 3, y: bullet.y, width: 6, height: 10 };
        const memberBox = { x: member.x - this.MEMBER_SIZE / 2, y: member.y - this.MEMBER_SIZE / 2, width: this.MEMBER_SIZE, height: this.MEMBER_SIZE };

        if (this.checkCollision(bulletBox, memberBox)) {
          member.health -= 15;
          this.enemyBullets.splice(i, 1);

          if (member.health <= 0) {
            member.alive = false;
            member.respawnTimer = 300;
            this.createExplosion(member.x, member.y, this.MEMBER_SIZE);

            if (j === 0) {
              this.invincibleTime = 120;
            }
          }
          break;
        }
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      for (let j = 0; j < this.squadron.length; j++) {
        const member = this.squadron[j];
        if (!member.alive || member.invincibleTime > 0) continue;

        const enemyBox = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
        const memberBox = { x: member.x - this.MEMBER_SIZE / 2, y: member.y - this.MEMBER_SIZE / 2, width: this.MEMBER_SIZE, height: this.MEMBER_SIZE };

        if (this.checkCollision(enemyBox, memberBox)) {
          member.health -= 30;
          enemy.health = 0;
          this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width);

          if (member.health <= 0) {
            member.alive = false;
            member.respawnTimer = 300;
            this.createExplosion(member.x, member.y, this.MEMBER_SIZE);

            if (j === 0) {
              this.invincibleTime = 120;
            }
          }
          break;
        }
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.y += 2;

      if (powerUp.y > this.CANVAS_HEIGHT) {
        this.powerUps.splice(i, 1);
        continue;
      }

      for (const member of this.squadron) {
        if (!member.alive) continue;

        const powerUpBox = { x: powerUp.x, y: powerUp.y, width: powerUp.width, height: powerUp.height };
        const memberBox = { x: member.x - this.MEMBER_SIZE / 2, y: member.y - this.MEMBER_SIZE / 2, width: this.MEMBER_SIZE, height: this.MEMBER_SIZE };

        if (this.checkCollision(powerUpBox, memberBox)) {
          if (powerUp.type === 'repair') {
            this.squadron.forEach(m => {
              if (m.alive) {
                m.health = Math.min(m.maxHealth, m.health + 30);
              }
            });
          } else if (powerUp.type === 'ammo') {
            this.ammo = Math.min(this.maxAmmo, this.ammo + 50);
          } else if (powerUp.type === 'shield') {
            this.squadron.forEach(m => {
              if (m.alive) {
                m.invincibleTime = Math.max(m.invincibleTime, 300);
              }
            });
          } else if (powerUp.type === 'bomb') {
            this.enemies.forEach(e => {
              this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.width);
              this.score += 10;
            });
            this.enemies = [];
            this.enemyBullets = [];
          }
          this.powerUps.splice(i, 1);
          break;
        }
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].frame++;
      if (this.explosions[i].frame > this.explosions[i].maxFrames) {
        this.explosions.splice(i, 1);
      }
    }

    const aliveCount = this.squadron.filter(m => m.alive).length;
    if (aliveCount === 0) {
      this.isGameOver = true;
    }

    this.level = Math.floor(this.score / 500) + 1;
  }

  private useBomb(): void {
    const aliveCount = this.squadron.filter(m => m.alive).length;
    if (aliveCount < 3 || this.ammo < 30) return;

    this.ammo -= 30;
    this.enemies.forEach(e => {
      this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.width * 2);
      this.score += 10;
    });
    this.enemies = [];
    this.enemyBullets = [];
  }
}
