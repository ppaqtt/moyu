import { BUNNY_HUNTER_CONSTANTS } from '../../utils/constants';

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BUNNY_SIZE,
  BULLET_SPEED,
  BUNNY_SPAWN_INTERVAL,
  GAME_DURATION,
  SCORE_HIT,
  SCORE_MISS,
  COOP_BONUS
} = BUNNY_HUNTER_CONSTANTS;

export type BunnyOwner = 'any' | 'player1' | 'player2';

export interface Bunny {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  owner: BunnyOwner;
  wobble: number;
  wobbleSpeed: number;
}

export interface Bullet {
  x: number;
  y: number;
  radius: number;
  speed: number;
  angle: number;
  owner: 'player1' | 'player2';
}

export interface HitEffect {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: string;
}

export interface CoopBonusEffect {
  x: number;
  y: number;
  alpha: number;
  scale: number;
}

export interface HunterState {
  x: number;
  y: number;
  angle: number;
  targetAngle: number;
  owner: 'player1' | 'player2';
  color: string;
  shootCooldown: number;
}

type ScoreUpdateCallback = (p1Score: number, p2Score: number, timeLeft: number) => void;
type GameOverCallback = (p1Score: number, p2Score: number, coopHits: number) => void;
type CoopHitCallback = () => void;
type BunnyMissedCallback = () => void;
type ShootCallback = () => void;

export class BunnyHunterEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private bunnySpawnTimer: number = 0;

  private onScoreUpdate?: ScoreUpdateCallback;
  private onGameOver?: GameOverCallback;
  private onCoopHit?: CoopHitCallback;
  private onBunnyMissed?: BunnyMissedCallback;
  private onShoot?: ShootCallback;

  private gameStarted: boolean = false;
  private gameOver: boolean = false;
  private timeLeft: number = GAME_DURATION;

  public bunnies: Bunny[];
  public bullets: Bullet[];
  public hitEffects: HitEffect[];
  public coopBonusEffects: CoopBonusEffect[];

  public hunter1: HunterState;
  public hunter2: HunterState;

  public player1Score: number = 0;
  public player2Score: number = 0;
  public coopHits: number = 0;
  public missedBunnies: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.bunnies = [];
    this.bullets = [];
    this.hitEffects = [];
    this.coopBonusEffects = [];
    this.hunter1 = this.createHunter(100, CANVAS_HEIGHT - 50, '#ff6b9d', 'player1');
    this.hunter2 = this.createHunter(CANVAS_WIDTH - 100, CANVAS_HEIGHT - 50, '#00d2ff', 'player2');
  }

  private createHunter(x: number, y: number, color: string, owner: 'player1' | 'player2'): HunterState {
    return {
      x,
      y,
      angle: owner === 'player1' ? -Math.PI / 4 : -Math.PI * 3 / 4,
      targetAngle: owner === 'player1' ? -Math.PI / 4 : -Math.PI * 3 / 4,
      color,
      shootCooldown: 0,
      owner
    };
  }

  setCallbacks(callbacks: {
    onScoreUpdate?: ScoreUpdateCallback;
    onGameOver?: GameOverCallback;
    onCoopHit?: CoopHitCallback;
    onBunnyMissed?: BunnyMissedCallback;
    onShoot?: ShootCallback;
  }): void {
    this.onScoreUpdate = callbacks.onScoreUpdate;
    this.onGameOver = callbacks.onGameOver;
    this.onCoopHit = callbacks.onCoopHit;
    this.onBunnyMissed = callbacks.onBunnyMissed;
    this.onShoot = callbacks.onShoot;
  }

  start(): void {
    if (this.animationId !== null) return;
    this.gameStarted = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  reset(): void {
    this.stop();
    this.bunnies = [];
    this.bullets = [];
    this.hitEffects = [];
    this.coopBonusEffects = [];
    this.player1Score = 0;
    this.player2Score = 0;
    this.coopHits = 0;
    this.missedBunnies = 0;
    this.timeLeft = GAME_DURATION;
    this.gameOver = false;
    this.gameStarted = false;
    this.bunnySpawnTimer = 0;
    this.hunter1 = this.createHunter(100, CANVAS_HEIGHT - 50, '#ff6b9d', 'player1');
    this.hunter2 = this.createHunter(CANVAS_WIDTH - 100, CANVAS_HEIGHT - 50, '#00d2ff', 'player2');
  }

  aimPlayer1(direction: 'left' | 'right'): void {
    if (!this.gameStarted || this.gameOver) return;
    if (direction === 'left') {
      this.hunter1.targetAngle = Math.max(-Math.PI * 0.85, this.hunter1.targetAngle - 0.08);
    } else {
      this.hunter1.targetAngle = Math.min(-Math.PI * 0.15, this.hunter1.targetAngle + 0.08);
    }
  }

  aimPlayer2(direction: 'left' | 'right'): void {
    if (!this.gameStarted || this.gameOver) return;
    if (direction === 'left') {
      this.hunter2.targetAngle = Math.max(-Math.PI * 0.85, this.hunter2.targetAngle - 0.08);
    } else {
      this.hunter2.targetAngle = Math.min(-Math.PI * 0.15, this.hunter2.targetAngle + 0.08);
    }
  }

  shootPlayer1(): void {
    if (!this.gameStarted || this.gameOver || this.hunter1.shootCooldown > 0) return;
    this.hunter1.shootCooldown = 15;
    const bullet: Bullet = {
      x: this.hunter1.x + Math.cos(this.hunter1.angle) * 40,
      y: this.hunter1.y + Math.sin(this.hunter1.angle) * 40,
      radius: 8,
      speed: BULLET_SPEED,
      angle: this.hunter1.angle,
      owner: 'player1'
    };
    this.bullets.push(bullet);
    this.onShoot?.();
  }

  shootPlayer2(): void {
    if (!this.gameStarted || this.gameOver || this.hunter2.shootCooldown > 0) return;
    this.hunter2.shootCooldown = 15;
    const bullet: Bullet = {
      x: this.hunter2.x + Math.cos(this.hunter2.angle) * 40,
      y: this.hunter2.y + Math.sin(this.hunter2.angle) * 40,
      radius: 8,
      speed: BULLET_SPEED,
      angle: this.hunter2.angle,
      owner: 'player2'
    };
    this.bullets.push(bullet);
    this.onShoot?.();
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 16.67, 3);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    if (!this.gameOver) {
      this.animationId = requestAnimationFrame(this.gameLoop);
    }
  };

  private update(deltaTime: number): void {
    if (this.gameOver) return;

    this.timeLeft -= deltaTime / 60;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.gameOver = true;
      this.onGameOver?.(this.player1Score, this.player2Score, this.coopHits);
      return;
    }

    this.updateHunters(deltaTime);
    this.updateBullets(deltaTime);
    this.updateBunnies(deltaTime);
    this.updateEffects(deltaTime);
    this.spawnBunnies(deltaTime);
    this.checkCollisions();

    this.onScoreUpdate?.(this.player1Score, this.player2Score, Math.ceil(this.timeLeft));
  }

  private updateHunters(deltaTime: number): void {
    this.hunter1.angle += (this.hunter1.targetAngle - this.hunter1.angle) * 0.15;
    this.hunter2.angle += (this.hunter2.targetAngle - this.hunter2.angle) * 0.15;

    if (this.hunter1.shootCooldown > 0) {
      this.hunter1.shootCooldown -= deltaTime;
    }
    if (this.hunter2.shootCooldown > 0) {
      this.hunter2.shootCooldown -= deltaTime;
    }
  }

  private updateBullets(deltaTime: number): void {
    this.bullets.forEach(bullet => {
      bullet.x += Math.cos(bullet.angle) * bullet.speed * deltaTime;
      bullet.y += Math.sin(bullet.angle) * bullet.speed * deltaTime;
    });

    this.bullets = this.bullets.filter(bullet => {
      return bullet.x > -50 && bullet.x < CANVAS_WIDTH + 50 &&
             bullet.y > -50 && bullet.y < CANVAS_HEIGHT + 50;
    });
  }

  private updateBunnies(deltaTime: number): void {
    this.bunnies.forEach(bunny => {
      bunny.y += bunny.speed * deltaTime;
      bunny.wobble += bunny.wobbleSpeed * deltaTime;
    });

    for (let i = this.bunnies.length - 1; i >= 0; i--) {
      if (this.bunnies[i].y > CANVAS_HEIGHT + BUNNY_SIZE) {
        this.bunnies.splice(i, 1);
        this.missedBunnies++;
        this.player1Score += SCORE_MISS;
        this.player2Score += SCORE_MISS;
        this.onBunnyMissed?.();
      }
    }
  }

  private updateEffects(deltaTime: number): void {
    this.hitEffects = this.hitEffects.filter(effect => {
      effect.radius += 3 * deltaTime;
      effect.alpha -= 0.05 * deltaTime;
      return effect.alpha > 0;
    });

    this.coopBonusEffects = this.coopBonusEffects.filter(effect => {
      effect.alpha -= 0.03 * deltaTime;
      effect.scale += 0.1 * deltaTime;
      return effect.alpha > 0;
    });
  }

  private spawnBunnies(deltaTime: number): void {
    this.bunnySpawnTimer += deltaTime;
    const spawnInterval = BUNNY_SPAWN_INTERVAL / (16.67 * (1 + this.missedBunnies * 0.05));

    if (this.bunnySpawnTimer > spawnInterval) {
      this.bunnySpawnTimer = 0;

      const owner: BunnyOwner = Math.random() < 0.3 ?
        (Math.random() < 0.5 ? 'player1' : 'player2') : 'any';

      const bunny: Bunny = {
        x: Math.random() * (CANVAS_WIDTH - BUNNY_SIZE * 2) + BUNNY_SIZE,
        y: -BUNNY_SIZE,
        width: BUNNY_SIZE,
        height: BUNNY_SIZE,
        speed: 1.5 + Math.random() * 2,
        owner,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.1 + Math.random() * 0.1
      };
      this.bunnies.push(bunny);

      if (Math.random() < 0.2) {
        const bunny2: Bunny = {
          x: Math.random() * (CANVAS_WIDTH - BUNNY_SIZE * 2) + BUNNY_SIZE,
          y: -BUNNY_SIZE - 80,
          width: BUNNY_SIZE,
          height: BUNNY_SIZE,
          speed: 1.5 + Math.random() * 2,
          owner: 'any',
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.1 + Math.random() * 0.1
        };
        this.bunnies.push(bunny2);
      }
    }
  }

  private checkCollisions(): void {
    const p1HitsThisFrame: Bunny[] = [];
    const p2HitsThisFrame: Bunny[] = [];

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      for (let j = this.bunnies.length - 1; j >= 0; j--) {
        const bunny = this.bunnies[j];

        if (this.checkBulletBunnyCollision(bullet, bunny)) {
          const canHit = bunny.owner === 'any' || bunny.owner === bullet.owner;

          if (canHit) {
            const hitEffect: HitEffect = {
              x: bunny.x + bunny.width / 2,
              y: bunny.y + bunny.height / 2,
              radius: 10,
              alpha: 1,
              color: bullet.owner === 'player1' ? '#ff6b9d' : '#00d2ff'
            };
            this.hitEffects.push(hitEffect);

            if (bullet.owner === 'player1') {
              if (!p1HitsThisFrame.includes(bunny)) {
                p1HitsThisFrame.push(bunny);
                this.player1Score += SCORE_HIT;
              }
            } else {
              if (!p2HitsThisFrame.includes(bunny)) {
                p2HitsThisFrame.push(bunny);
                this.player2Score += SCORE_HIT;
              }
            }

            this.bunnies.splice(j, 1);
            this.bullets.splice(i, 1);
            break;
          }
        }
      }
    }

    if (p1HitsThisFrame.length > 0 && p2HitsThisFrame.length > 0) {
      this.coopHits++;
      this.player1Score += SCORE_HIT * COOP_BONUS;
      this.player2Score += SCORE_HIT * COOP_BONUS;

      const coopEffect: CoopBonusEffect = {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        alpha: 1,
        scale: 0.5
      };
      this.coopBonusEffects.push(coopEffect);
      this.onCoopHit?.();
    }
  }

  private checkBulletBunnyCollision(bullet: Bullet, bunny: Bunny): boolean {
    const dx = bullet.x - (bunny.x + bunny.width / 2);
    const dy = bullet.y - (bunny.y + bunny.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < bullet.radius + bunny.width / 2;
  }

  private render(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f0f1a');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(CANVAS_WIDTH / 2, 0);
    this.ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    this.ctx.stroke();

    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);

    this.ctx.strokeStyle = 'rgba(108, 92, 231, 0.5)';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, CANVAS_HEIGHT - 50);
    this.ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 50);
    this.ctx.stroke();

    this.bunnies.forEach(bunny => this.drawBunny(bunny));
    this.bullets.forEach(bullet => this.drawBullet(bullet));
    this.hitEffects.forEach(effect => this.drawHitEffect(effect));
    this.coopBonusEffects.forEach(effect => this.drawCoopBonus(effect));

    this.drawHunter(this.hunter1);
    this.drawHunter(this.hunter2);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('P1: A/D瞄准 W射击', CANVAS_WIDTH / 4, 30);
    this.ctx.fillText('P2: ←/→瞄准 ↑射击', (CANVAS_WIDTH * 3) / 4, 30);
  }

  private drawBunny(bunny: Bunny): void {
    const wobbleX = Math.sin(bunny.wobble) * 3;
    const x = bunny.x + wobbleX;
    const y = bunny.y;

    let ownerColor = '#ffeb3b';
    if (bunny.owner === 'player1') {
      ownerColor = '#ff6b9d';
    } else if (bunny.owner === 'player2') {
      ownerColor = '#00d2ff';
    }

    this.ctx.fillStyle = ownerColor;
    this.ctx.beginPath();
    this.ctx.moveTo(x + bunny.width / 2, y);
    this.ctx.lineTo(x + bunny.width / 2 + 8, y + 12);
    this.ctx.lineTo(x + bunny.width / 2 - 8, y + 12);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(x + bunny.width / 2 + 8, y + 12);
    this.ctx.lineTo(x + bunny.width / 2 + 12, y + bunny.height * 0.3);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(x + bunny.width / 2 - 8, y + 12);
    this.ctx.lineTo(x + bunny.width / 2 - 12, y + bunny.height * 0.3);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(x + bunny.width / 2, y + bunny.height * 0.45, bunny.width * 0.35, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#333';
    this.ctx.beginPath();
    this.ctx.arc(x + bunny.width / 2 - 6, y + bunny.height * 0.4, 4, 0, Math.PI * 2);
    this.ctx.arc(x + bunny.width / 2 + 6, y + bunny.height * 0.4, 4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#ffb6c1';
    this.ctx.beginPath();
    this.ctx.arc(x + bunny.width / 2, y + bunny.height * 0.55, 5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.ellipse(x + bunny.width / 2 - 8, y + bunny.height * 0.38, 3, 5, 0, 0, Math.PI * 2);
    this.ctx.ellipse(x + bunny.width / 2 + 8, y + bunny.height * 0.38, 3, 5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    if (bunny.owner !== 'any') {
      this.ctx.fillStyle = ownerColor;
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(bunny.owner === 'player1' ? 'P1' : 'P2', x + bunny.width / 2, y - 5);
    }
  }

  private drawBullet(bullet: Bullet): void {
    const gradient = this.ctx.createRadialGradient(
      bullet.x, bullet.y, 0,
      bullet.x, bullet.y, bullet.radius
    );
    gradient.addColorStop(0, bullet.owner === 'player1' ? '#ff6b9d' : '#00d2ff');
    gradient.addColorStop(1, bullet.owner === 'player1' ? '#ff6b9d50' : '#00d2ff50');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(bullet.x - 2, bullet.y - 2, bullet.radius * 0.3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawHitEffect(effect: HitEffect): void {
    this.ctx.globalAlpha = effect.alpha;
    this.ctx.strokeStyle = effect.color;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
    this.ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const innerRadius = effect.radius * 0.5;
      const outerRadius = effect.radius * 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(effect.x + Math.cos(angle) * innerRadius, effect.y + Math.sin(angle) * innerRadius);
      this.ctx.lineTo(effect.x + Math.cos(angle) * outerRadius, effect.y + Math.sin(angle) * outerRadius);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  private drawCoopBonus(effect: CoopBonusEffect): void {
    this.ctx.globalAlpha = effect.alpha;
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `bold ${32 * effect.scale}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('COOP BONUS! x2', effect.x, effect.y);
    this.ctx.globalAlpha = 1;
  }

  private drawHunter(hunter: HunterState): void {
    this.ctx.fillStyle = hunter.color;
    this.ctx.beginPath();
    this.ctx.arc(hunter.x, hunter.y, 25, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#ffe4c4';
    this.ctx.beginPath();
    this.ctx.arc(hunter.x, hunter.y - 5, 15, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#333';
    this.ctx.beginPath();
    this.ctx.arc(hunter.x - 5, hunter.y - 8, 2, 0, Math.PI * 2);
    this.ctx.arc(hunter.x + 5, hunter.y - 8, 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#8b4513';
    this.ctx.lineWidth = 6;
    this.ctx.beginPath();
    this.ctx.moveTo(hunter.x, hunter.y);
    const gunLength = 40;
    this.ctx.lineTo(
      hunter.x + Math.cos(hunter.angle) * gunLength,
      hunter.y + Math.sin(hunter.angle) * gunLength
    );
    this.ctx.stroke();

    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 8;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(hunter.x, hunter.y);
    this.ctx.lineTo(
      hunter.x + Math.cos(hunter.angle) * gunLength,
      hunter.y + Math.sin(hunter.angle) * gunLength
    );
    this.ctx.stroke();

    if (hunter.shootCooldown > 10) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.beginPath();
      this.ctx.arc(
        hunter.x + Math.cos(hunter.angle) * (gunLength + 10),
        hunter.y + Math.sin(hunter.angle) * (gunLength + 10),
        5, 0, Math.PI * 2
      );
      this.ctx.fill();
    }

    this.ctx.fillStyle = hunter.color;
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      hunter.owner === 'player1' ? 'P1' : 'P2',
      hunter.x,
      hunter.y + 45
    );
  }

  getPlayer1Score(): number {
    return this.player1Score;
  }

  getPlayer2Score(): number {
    return this.player2Score;
  }

  getCoopHits(): number {
    return this.coopHits;
  }

  getTimeLeft(): number {
    return Math.ceil(this.timeLeft);
  }

  isGameOver(): boolean {
    return this.gameOver;
  }

  isGameStarted(): boolean {
    return this.gameStarted;
  }
}
