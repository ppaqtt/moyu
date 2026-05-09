import { CLIFF_RUNNER_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, GROUND_HEIGHT, GRAVITY, JUMP_FORCE } = CLIFF_RUNNER_CONSTANTS;

export interface Platform {
  x: number;
  width: number;
  isBreaking: boolean;
  breakTimer: number;
  opacity: number;
}

export interface Obstacle {
  x: number;
  y: number;
  type: 'rock' | 'branch' | 'pit';
  width: number;
  height: number;
}

export interface PowerUp {
  x: number;
  y: number;
  type: 'speed' | 'shield';
  width: number;
  height: number;
  active: boolean;
}

export interface CliffRunnerEngine {
  player: {
    x: number;
    y: number;
    vy: number;
    width: number;
    height: number;
    isJumping: boolean;
    isSliding: boolean;
    hasShield: boolean;
    speedBoostTimer: number;
  };
  platforms: Platform[];
  obstacles: Obstacle[];
  powerUps: PowerUp[];
  speed: number;
  score: number;
  lives: number;
  distance: number;
  gameOver: boolean;
  gameStarted: boolean;
}

type GameEventCallback = () => void;
type GameOverCallback = (score: number) => void;
type ScoreUpdateCallback = (score: number) => void;

export class CliffRunnerEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private platformSpawnTimer: number = 0;
  private obstacleSpawnTimer: number = 0;
  private powerUpSpawnTimer: number = 0;
  private distanceTimer: number = 0;

  private onJump?: GameEventCallback;
  private onSlide?: GameEventCallback;
  private onHit?: GameEventCallback;
  private onCollect?: GameEventCallback;
  private onGameOver?: GameOverCallback;
  private onScoreUpdate?: ScoreUpdateCallback;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.init();
  }

  private init(): void {
    this.player = {
      x: 100,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE,
      vy: 0,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      isJumping: false,
      isSliding: false,
      hasShield: false,
      speedBoostTimer: 0
    };
    this.platforms = [];
    this.obstacles = [];
    this.powerUps = [];
    this.speed = 5;
    this.score = 0;
    this.lives = 3;
    this.distance = 0;
    this.gameOver = false;
    this.gameStarted = false;
    this.platformSpawnTimer = 0;
    this.obstacleSpawnTimer = 0;
    this.powerUpSpawnTimer = 0;
    this.distanceTimer = 0;

    this.generateInitialPlatforms();
  }

  private generateInitialPlatforms(): void {
    let x = 0;
    while (x < CANVAS_WIDTH + 400) {
      const width = 150 + Math.random() * 200;
      this.platforms.push({
        x,
        width,
        isBreaking: false,
        breakTimer: 0,
        opacity: 1
      });
      x += width + 30 + Math.random() * 50;
    }
  }

  setCallbacks(callbacks: {
    onJump?: GameEventCallback;
    onSlide?: GameEventCallback;
    onHit?: GameEventCallback;
    onCollect?: GameEventCallback;
    onGameOver?: GameOverCallback;
    onScoreUpdate?: ScoreUpdateCallback;
  }): void {
    this.onJump = callbacks.onJump;
    this.onSlide = callbacks.onSlide;
    this.onHit = callbacks.onHit;
    this.onCollect = callbacks.onCollect;
    this.onGameOver = callbacks.onGameOver;
    this.onScoreUpdate = callbacks.onScoreUpdate;
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
    this.init();
  }

  jump(): void {
    if (!this.gameStarted || this.gameOver) return;
    if (!this.player.isJumping) {
      this.player.vy = JUMP_FORCE;
      this.player.isJumping = true;
      this.player.isSliding = false;
      this.onJump?.();
    }
  }

  slide(): void {
    if (!this.gameStarted || this.gameOver) return;
    if (!this.player.isJumping) {
      this.player.isSliding = true;
      this.player.height = PLAYER_SIZE * 0.5;
      this.player.y = CANVAS_HEIGHT - GROUND_HEIGHT - this.player.height;
      this.onSlide?.();
    }
  }

  releaseSlide(): void {
    this.player.isSliding = false;
    this.player.height = PLAYER_SIZE;
    this.player.y = CANVAS_HEIGHT - GROUND_HEIGHT - this.player.height;
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

    const currentSpeed = this.player.speedBoostTimer > 0 ? this.speed * 1.5 : this.speed;
    const adjustedSpeed = currentSpeed * deltaTime;

    if (this.player.speedBoostTimer > 0) {
      this.player.speedBoostTimer -= deltaTime;
    }

    this.player.vy += GRAVITY * deltaTime;
    this.player.y += this.player.vy * deltaTime;

    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT - this.player.height;
    if (this.player.y >= groundY) {
      this.player.y = groundY;
      this.player.vy = 0;
      this.player.isJumping = false;
      if (this.player.isSliding) {
        this.player.height = PLAYER_SIZE;
        this.player.y = groundY;
      }
    }

    this.platforms.forEach(platform => {
      platform.x -= adjustedSpeed;
      if (platform.isBreaking) {
        platform.breakTimer += deltaTime;
        platform.opacity = Math.max(0, 1 - platform.breakTimer / 30);
      }
    });

    this.platforms = this.platforms.filter(p => p.x + p.width > -50 && p.opacity > 0);

    this.platformSpawnTimer += deltaTime;
    if (this.platformSpawnTimer > 40 + Math.random() * 30) {
      this.spawnPlatform();
      this.platformSpawnTimer = 0;
    }

    this.obstacles.forEach(obstacle => {
      obstacle.x -= adjustedSpeed;
    });
    this.obstacles = this.obstacles.filter(o => o.x + o.width > -50);

    this.obstacleSpawnTimer += deltaTime;
    if (this.obstacleSpawnTimer > 60 + Math.random() * 50) {
      this.spawnObstacle();
      this.obstacleSpawnTimer = 0;
    }

    this.powerUps.forEach(powerUp => {
      powerUp.x -= adjustedSpeed;
    });
    this.powerUps = this.powerUps.filter(p => p.x + p.width > -50 && p.active);

    this.powerUpSpawnTimer += deltaTime;
    if (this.powerUpSpawnTimer > 150 + Math.random() * 100) {
      this.spawnPowerUp();
      this.powerUpSpawnTimer = 0;
    }

    this.checkCollisions();

    this.distance += adjustedSpeed * 0.1;
    this.distanceTimer += deltaTime;
    if (this.distanceTimer > 10) {
      this.score = Math.floor(this.distance);
      this.distanceTimer = 0;
      this.onScoreUpdate?.(this.score);
    }

    if (this.speed < 12) {
      this.speed += 0.0005 * deltaTime;
    }

    this.platforms.forEach(platform => {
      if (!platform.isBreaking && platform.x < this.player.x + this.player.width &&
          platform.x + platform.width > this.player.x) {
        if (Math.random() < 0.002 * deltaTime) {
          platform.isBreaking = true;
        }
      }
    });
  }

  private spawnPlatform(): void {
    const width = 100 + Math.random() * 180;
    const lastPlatform = this.platforms[this.platforms.length - 1];
    const gap = 20 + Math.random() * 60;
    const x = lastPlatform ? lastPlatform.x + lastPlatform.width + gap : CANVAS_WIDTH;

    this.platforms.push({
      x,
      width,
      isBreaking: false,
      breakTimer: 0,
      opacity: 1
    });
  }

  private spawnObstacle(): void {
    const types: Obstacle['type'][] = ['rock', 'branch', 'pit'];
    const type = types[Math.floor(Math.random() * types.length)];

    let width = 30, height = 30;
    let y = CANVAS_HEIGHT - GROUND_HEIGHT - height;

    if (type === 'pit') {
      width = 60;
      height = 20;
      y = CANVAS_HEIGHT - GROUND_HEIGHT - height;
    } else if (type === 'branch') {
      height = 40;
      y = CANVAS_HEIGHT - GROUND_HEIGHT - 60;
    }

    this.obstacles.push({
      x: CANVAS_WIDTH + 50,
      y,
      type,
      width,
      height
    });
  }

  private spawnPowerUp(): void {
    const types: PowerUp['type'][] = ['speed', 'shield'];
    const type = types[Math.floor(Math.random() * types.length)];

    this.powerUps.push({
      x: CANVAS_WIDTH + 50,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - 80 - Math.random() * 40,
      type,
      width: 25,
      height: 25,
      active: true
    });
  }

  private checkCollisions(): void {
    const playerBox = {
      x: this.player.x + 5,
      y: this.player.y + 5,
      width: this.player.width - 10,
      height: this.player.height - 10
    };

    for (const obstacle of this.obstacles) {
      if (obstacle.type === 'pit') {
        const pitCenter = obstacle.x + obstacle.width / 2;
        const playerCenter = this.player.x + this.player.width / 2;
        if (Math.abs(pitCenter - playerCenter) < obstacle.width / 2 + this.player.width / 3) {
          if (!this.player.isJumping || this.player.y + this.player.height > CANVAS_HEIGHT - GROUND_HEIGHT - 20) {
            this.handlePlayerHit();
            obstacle.x = -100;
          }
        }
      } else {
        if (this.checkBoxCollision(playerBox, obstacle)) {
          this.handlePlayerHit();
          obstacle.x = -100;
        }
      }
    }

    for (const powerUp of this.powerUps) {
      if (powerUp.active && this.checkBoxCollision(playerBox, powerUp)) {
        powerUp.active = false;
        if (powerUp.type === 'speed') {
          this.player.speedBoostTimer = 180;
        } else if (powerUp.type === 'shield') {
          this.player.hasShield = true;
        }
        this.score += 50;
        this.onCollect?.();
      }
    }

    if (this.player.y > CANVAS_HEIGHT) {
      this.handlePlayerHit();
    }
  }

  private checkBoxCollision(a: { x: number; y: number; width: number; height: number },
                             b: { x: number; y: number; width: number; height: number }): boolean {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  private handlePlayerHit(): void {
    if (this.player.hasShield) {
      this.player.hasShield = false;
      return;
    }

    this.lives--;
    this.onHit?.();

    if (this.lives <= 0) {
      this.gameOver = true;
      this.onGameOver?.(this.score);
    }
  }

  private render(): void {
    this.ctx.fillStyle = 'linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#B0E0E6');
    gradient.addColorStop(1, '#98D8C8');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.fillStyle = '#228B22';
    this.ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, 10);

    for (let i = 0; i < 5; i++) {
      const treeX = (i * 180 + this.distance * 0.3) % (CANVAS_WIDTH + 100) - 50;
      this.drawTree(treeX, CANVAS_HEIGHT - GROUND_HEIGHT - 5);
    }

    this.platforms.forEach(platform => {
      if (platform.opacity > 0) {
        this.ctx.globalAlpha = platform.opacity;

        if (platform.isBreaking) {
          this.ctx.fillStyle = '#8B4513';
        } else {
          this.ctx.fillStyle = '#654321';
        }
        this.ctx.fillRect(platform.x, CANVAS_HEIGHT - GROUND_HEIGHT - 15, platform.width, 15);

        if (platform.isBreaking) {
          const crackCount = Math.floor(platform.breakTimer / 10) + 1;
          this.ctx.strokeStyle = '#3d2314';
          this.ctx.lineWidth = 2;
          for (let i = 0; i < crackCount; i++) {
            const cx = platform.x + (platform.width / (crackCount + 1)) * (i + 1);
            this.ctx.beginPath();
            this.ctx.moveTo(cx, CANVAS_HEIGHT - GROUND_HEIGHT - 15);
            this.ctx.lineTo(cx + 5, CANVAS_HEIGHT - GROUND_HEIGHT - 5);
            this.ctx.lineTo(cx - 3, CANVAS_HEIGHT - GROUND_HEIGHT);
            this.ctx.stroke();
          }
        }

        this.ctx.globalAlpha = 1;
      }
    });

    this.obstacles.forEach(obstacle => {
      if (obstacle.type === 'rock') {
        this.ctx.fillStyle = '#696969';
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
        this.ctx.lineTo(obstacle.x + obstacle.width * 0.2, obstacle.y + obstacle.height * 0.3);
        this.ctx.lineTo(obstacle.x + obstacle.width * 0.5, obstacle.y);
        this.ctx.lineTo(obstacle.x + obstacle.width * 0.8, obstacle.y + obstacle.height * 0.4);
        this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#808080';
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x + obstacle.width * 0.3, obstacle.y + obstacle.height);
        this.ctx.lineTo(obstacle.x + obstacle.width * 0.5, obstacle.y + obstacle.height * 0.6);
        this.ctx.lineTo(obstacle.x + obstacle.width * 0.7, obstacle.y + obstacle.height);
        this.ctx.closePath();
        this.ctx.fill();
      } else if (obstacle.type === 'branch') {
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
        this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y);
        this.ctx.stroke();

        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          this.ctx.beginPath();
          this.ctx.moveTo(obstacle.x + obstacle.width * 0.3 + i * 15, obstacle.y + obstacle.height * 0.7 - i * 5);
          this.ctx.lineTo(obstacle.x + obstacle.width * 0.5 + i * 15, obstacle.y + obstacle.height * 0.4 - i * 5);
          this.ctx.stroke();
        }
      } else if (obstacle.type === 'pit') {
        this.ctx.fillStyle = '#2F1810';
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        this.ctx.fillStyle = '#1a0f0a';
        for (let i = 0; i < 3; i++) {
          this.ctx.fillRect(obstacle.x + 10 + i * 18, obstacle.y + 5, 8, obstacle.height - 5);
        }
      }
    });

    this.powerUps.forEach(powerUp => {
      if (!powerUp.active) return;

      const pulse = Math.sin(Date.now() / 200) * 0.2 + 1;

      if (powerUp.type === 'speed') {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2,
          (powerUp.width / 2) * pulse,
          0,
          Math.PI * 2
        );
        this.ctx.fill();

        this.ctx.fillStyle = '#FF4500';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('⚡', powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
      } else if (powerUp.type === 'shield') {
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.beginPath();
        this.ctx.arc(
          powerUp.x + powerUp.width / 2,
          powerUp.y + powerUp.height / 2,
          (powerUp.width / 2) * pulse,
          0,
          Math.PI * 2
        );
        this.ctx.fill();

        this.ctx.fillStyle = '#000080';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🛡', powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
      }
    });

    this.drawPlayer();
  }

  private drawPlayer(): void {
    const { x, y, width, height, hasShield, speedBoostTimer, isSliding } = this.player;

    if (hasShield) {
      this.ctx.strokeStyle = '#00FFFF';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(x + width / 2, y + height / 2, width / 2 + 8, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    if (speedBoostTimer > 0) {
      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      this.ctx.beginPath();
      this.ctx.moveTo(x - 10, y + height);
      this.ctx.lineTo(x - 30, y + height + 15);
      this.ctx.lineTo(x - 10, y + height - 5);
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.ctx.fillStyle = '#FF6B6B';
    this.ctx.beginPath();
    this.ctx.arc(x + width / 2, y + 12, 12, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFE4C4';
    this.ctx.beginPath();
    this.ctx.arc(x + width / 2, y + 10, 8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#333';
    this.ctx.beginPath();
    this.ctx.arc(x + width / 2 - 3, y + 9, 2, 0, Math.PI * 2);
    this.ctx.arc(x + width / 2 + 3, y + 9, 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(x + width / 2, y + 13, 3, 0.1 * Math.PI, 0.9 * Math.PI);
    this.ctx.stroke();

    if (isSliding) {
      this.ctx.fillStyle = '#3498DB';
      this.ctx.fillRect(x + 5, y + height - 20, width - 10, 20);
    } else {
      this.ctx.fillStyle = '#3498DB';
      this.ctx.fillRect(x + 5, y + height - 25, width - 10, 25);
    }

    this.ctx.fillStyle = '#2980B9';
    this.ctx.fillRect(x + 8, y + height - 22, width - 16, 8);

    const legOffset = Math.sin(Date.now() / 100) * 5;
    this.ctx.fillStyle = '#2C3E50';
    this.ctx.fillRect(x + 8, y + height - 5, 8, 5 + legOffset);
    this.ctx.fillRect(x + width - 16, y + height - 5, 8, 5 - legOffset);

    this.ctx.fillStyle = '#E74C3C';
    this.ctx.fillRect(x + width - 15, y + 15, 15, 10);
    this.ctx.fillStyle = '#C0392B';
    this.ctx.fillRect(x + width - 12, y + 18, 10, 4);
  }

  private drawTree(x: number, groundY: number): void {
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(x + 15, groundY - 60, 10, 60);

    this.ctx.fillStyle = '#228B22';
    this.ctx.beginPath();
    this.ctx.moveTo(x, groundY - 50);
    this.ctx.lineTo(x + 20, groundY - 100);
    this.ctx.lineTo(x + 40, groundY - 50);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(x - 5, groundY - 30);
    this.ctx.lineTo(x + 20, groundY - 80);
    this.ctx.lineTo(x + 45, groundY - 30);
    this.ctx.closePath();
    this.ctx.fill();
  }

  getScore(): number {
    return this.score;
  }

  getLives(): number {
    return this.lives;
  }

  getSpeed(): number {
    return this.speed;
  }

  isGameOver(): boolean {
    return this.gameOver;
  }

  isGameStarted(): boolean {
    return this.gameStarted;
  }
}
