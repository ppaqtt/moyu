// DoodleJump Physics Engine - 涂鸦跳跃

export interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'normal' | 'moving' | 'fragile' | 'bouncy';
  vx?: number;
  minX?: number;
  maxX?: number;
  bounces?: number;
  isDestroyed?: boolean;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isJumping: boolean;
  direction: 'left' | 'right';
}

export interface PowerUp {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spring' | 'rocket' | 'propeller' | 'shield';
  isActive: boolean;
  duration?: number;
}

export interface DoodleJumpState {
  player: Player;
  platforms: Platform[];
  powerUps: PowerUp[];
  score: number;
  level: number;
  height: number;
  maxHeight: number;
  isGameOver: boolean;
  isPaused: boolean;
  isPoweredUp: boolean;
  powerUpType: string | null;
  cameraY: number;
}

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.5;
const JUMP_POWER = -14;
const MOVE_SPEED = 6;
const PLATFORM_WIDTH = 70;
const PLATFORM_HEIGHT = 15;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;
const SCROLL_THRESHOLD = 200;
const POWER_UP_TYPES = ['spring', 'rocket', 'propeller', 'shield'];

export class DoodleJumpEngine {
  private player: Player;
  private platforms: Platform[];
  private powerUps: PowerUp[];
  private score: number;
  private level: number;
  private height: number;
  private maxHeight: number;
  private isGameOver: boolean;
  private isPaused: boolean;
  private isPoweredUp: boolean;
  private powerUpType: string | null;
  private powerUpTimer: number;
  private cameraY: number;
  private lastPlatformY: number;
  private platformIdCounter: number;
  private powerUpIdCounter: number;

  constructor() {
    this.player = {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      vx: 0,
      vy: 0,
      isJumping: true,
      direction: 'right'
    };
    this.platforms = [];
    this.powerUps = [];
    this.score = 0;
    this.level = 1;
    this.height = 0;
    this.maxHeight = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.isPoweredUp = false;
    this.powerUpType = null;
    this.powerUpTimer = 0;
    this.cameraY = 0;
    this.lastPlatformY = CANVAS_HEIGHT - 100;
    this.platformIdCounter = 0;
    this.powerUpIdCounter = 0;
    
    this.initPlatforms();
  }

  private initPlatforms(): void {
    // Starting platform
    this.platforms.push({
      id: this.platformIdCounter++,
      x: CANVAS_WIDTH / 2 - PLATFORM_WIDTH / 2,
      y: CANVAS_HEIGHT - 50,
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'normal'
    });

    // Generate initial platforms
    for (let i = 0; i < 8; i++) {
      this.generatePlatform();
    }
  }

  private generatePlatform(): void {
    const gap = 60 + Math.random() * 40;
    const newY = this.lastPlatformY - gap;
    
    let type: Platform['type'] = 'normal';
    const rand = Math.random();
    
    if (rand < 0.1) type = 'bouncy';
    else if (rand < 0.2) type = 'moving';
    else if (rand < 0.25) type = 'fragile';
    
    const platform: Platform = {
      id: this.platformIdCounter++,
      x: Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH),
      y: newY,
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
      type
    };

    if (type === 'moving') {
      platform.vx = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random());
      platform.minX = 0;
      platform.maxX = CANVAS_WIDTH - PLATFORM_WIDTH;
    }

    this.platforms.push(platform);

    // Maybe add power-up
    if (Math.random() < 0.1) {
      const powerUpType = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
      this.powerUps.push({
        id: this.powerUpIdCounter++,
        x: platform.x + platform.width / 2 - 10,
        y: platform.y - 30,
        width: 20,
        height: 20,
        type: powerUpType as PowerUp['type'],
        isActive: true
      });
    }

    this.lastPlatformY = newY;
  }

  getState(): DoodleJumpState {
    return {
      player: { ...this.player },
      platforms: this.platforms.map(p => ({ ...p })),
      powerUps: this.powerUps.map(p => ({ ...p })),
      score: this.score,
      level: this.level,
      height: this.height,
      maxHeight: this.maxHeight,
      isGameOver: this.isGameOver,
      isPaused: this.isPaused,
      isPoweredUp: this.isPoweredUp,
      powerUpType: this.powerUpType,
      cameraY: this.cameraY
    };
  }

  moveLeft(): void {
    if (this.isGameOver || this.isPaused) return;
    this.player.vx = -MOVE_SPEED;
    this.player.direction = 'left';
  }

  moveRight(): void {
    if (this.isGameOver || this.isPaused) return;
    this.player.vx = MOVE_SPEED;
    this.player.direction = 'right';
  }

  stopHorizontal(): void {
    this.player.vx = 0;
  }

  jump(): void {
    if (this.isGameOver || this.isPaused) return;
    if (!this.player.isJumping) {
      this.player.vy = JUMP_POWER;
      this.player.isJumping = true;
    }
  }

  private activatePowerUp(type: PowerUp['type']): void {
    this.powerUpType = type;
    this.isPoweredUp = true;
    this.powerUpTimer = 0;

    switch (type) {
      case 'spring':
        this.player.vy = JUMP_POWER * 1.5;
        break;
      case 'rocket':
        this.player.vy = JUMP_POWER * 2.5;
        this.powerUpTimer = 120; // 2 seconds
        break;
      case 'propeller':
        this.player.vy = JUMP_POWER * 1.8;
        this.powerUpTimer = 180; // 3 seconds
        break;
      case 'shield':
        this.powerUpTimer = 300; // 5 seconds
        break;
    }
  }

  tick(): void {
    if (this.isGameOver || this.isPaused) return;

    // Apply gravity
    this.player.vy += GRAVITY;
    this.player.y += this.player.vy;
    this.player.x += this.player.vx;

    // Power-up effects
    if (this.isPoweredUp) {
      if (this.powerUpType === 'rocket' || this.powerUpType === 'propeller') {
        this.player.vy = Math.max(this.player.vy, -20);
        if (this.powerUpTimer > 0) {
          this.powerUpTimer--;
        } else {
          this.isPoweredUp = false;
          this.powerUpType = null;
        }
      } else if (this.powerUpType === 'shield') {
        if (this.powerUpTimer > 0) {
          this.powerUpTimer--;
        } else {
          this.isPoweredUp = false;
          this.powerUpType = null;
        }
      }
    }

    // Screen wrapping
    if (this.player.x < -this.player.width) {
      this.player.x = CANVAS_WIDTH;
    } else if (this.player.x > CANVAS_WIDTH) {
      this.player.x = -this.player.width;
    }

    // Platform collision (only when falling)
    if (this.player.vy > 0) {
      for (const platform of this.platforms) {
        if (platform.isDestroyed) continue;

        const playerBottom = this.player.y + this.player.height;
        const playerCenterX = this.player.x + this.player.width / 2;

        if (
          playerBottom >= platform.y &&
          playerBottom <= platform.y + platform.height + this.player.vy &&
          playerCenterX >= platform.x &&
          playerCenterX <= platform.x + platform.width
        ) {
          switch (platform.type) {
            case 'normal':
              this.player.y = platform.y - this.player.height;
              this.player.vy = JUMP_POWER;
              this.player.isJumping = true;
              break;
            case 'bouncy':
              this.player.y = platform.y - this.player.height;
              this.player.vy = JUMP_POWER * 1.5;
              this.player.isJumping = true;
              break;
            case 'fragile':
              platform.isDestroyed = true;
              this.player.y = platform.y - this.player.height;
              this.player.vy = JUMP_POWER;
              break;
            case 'moving':
              this.player.y = platform.y - this.player.height;
              this.player.vy = JUMP_POWER;
              break;
          }
        }
      }
    }

    // Update moving platforms
    for (const platform of this.platforms) {
      if (platform.type === 'moving' && platform.vx) {
        platform.x += platform.vx;
        if (platform.x <= platform.minX || platform.x >= platform.maxX) {
          platform.vx *= -1;
        }
      }
    }

    // Power-up collection
    for (const powerUp of this.powerUps) {
      if (!powerUp.isActive) continue;

      if (
        this.player.x < powerUp.x + powerUp.width &&
        this.player.x + this.player.width > powerUp.x &&
        this.player.y < powerUp.y + powerUp.height &&
        this.player.y + this.player.height > powerUp.y
      ) {
        powerUp.isActive = false;
        this.activatePowerUp(powerUp.type);
      }
    }

    // Camera follow
    const targetCameraY = this.player.y - SCROLL_THRESHOLD;
    if (targetCameraY < this.cameraY) {
      this.cameraY = targetCameraY;
    }

    // Update height and score
    const currentHeight = Math.max(0, Math.floor((CANVAS_HEIGHT - this.player.y + this.cameraY) / 10));
    if (currentHeight > this.maxHeight) {
      this.maxHeight = currentHeight;
      this.score = Math.max(this.score, this.maxHeight);
    }
    this.height = currentHeight;

    // Generate new platforms as we go up
    while (this.lastPlatformY > this.cameraY - 100) {
      this.generatePlatform();
    }

    // Remove platforms that are below the screen
    this.platforms = this.platforms.filter(p => p.y < CANVAS_HEIGHT - this.cameraY + 50);
    this.powerUps = this.powerUps.filter(p => p.y < CANVAS_HEIGHT - this.cameraY + 50);

    // Check game over (fell below screen)
    if (this.player.y > CANVAS_HEIGHT - this.cameraY + 100) {
      this.isGameOver = true;
    }

    // Level progression
    this.level = Math.floor(this.score / 500) + 1;
  }

  reset(): void {
    this.player = {
      x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      vx: 0,
      vy: 0,
      isJumping: true,
      direction: 'right'
    };
    this.platforms = [];
    this.powerUps = [];
    this.score = 0;
    this.level = 1;
    this.height = 0;
    this.maxHeight = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.isPoweredUp = false;
    this.powerUpType = null;
    this.powerUpTimer = 0;
    this.cameraY = 0;
    this.lastPlatformY = CANVAS_HEIGHT - 100;
    this.platformIdCounter = 0;
    this.powerUpIdCounter = 0;
    
    this.initPlatforms();
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
