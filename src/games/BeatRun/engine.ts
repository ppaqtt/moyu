import { GAME_CONFIG } from '../../utils/constants';

export interface Obstacle {
  id: number;
  type: 'jump' | 'slide' | 'double';
  lane: number;
  y: number;
  hit: boolean;
}

export interface PowerUp {
  id: number;
  type: 'shield' | 'magnet' | 'slowmo';
  x: number;
  y: number;
  collected: boolean;
}

export interface BeatRunState {
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  distance: number;
  speed: number;
  playerY: number;
  playerLane: number;
  isJumping: boolean;
  isSliding: boolean;
  obstacles: Obstacle[];
  powerUps: PowerUp[];
  beats: number[];
  currentBeat: number;
  hasShield: boolean;
  hasMagnet: boolean;
  isSlowMo: boolean;
  isGameOver: boolean;
  gameTime: number;
  lastSpawnTime: number;
  lastBeatTime: number;
  bpm: number;
}

export class BeatRunEngine {
  private state: BeatRunState;
  private noteIdCounter: number;
  private readonly canvasWidth: number;
  private readonly canvasHeight: number;
  private readonly groundY: number;
  private readonly laneWidth: number;
  private readonly lanes: number;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.canvasWidth = 500;
    this.canvasHeight = 600;
    this.groundY = 480;
    this.laneWidth = this.canvasWidth / 5;
    this.lanes = 5;
    this.noteIdCounter = 0;
    this.state = this.createInitialState();
  }

  private createInitialState(): BeatRunState {
    return {
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      greatCount: 0,
      goodCount: 0,
      missCount: 0,
      distance: 0,
      speed: 5,
      playerY: 0,
      playerLane: 2,
      isJumping: false,
      isSliding: false,
      obstacles: [],
      powerUps: [],
      beats: [],
      currentBeat: 0,
      hasShield: false,
      hasMagnet: false,
      isSlowMo: false,
      isGameOver: false,
      gameTime: 0,
      lastSpawnTime: 0,
      lastBeatTime: 0,
      bpm: 120,
    };
  }

  getState(): BeatRunState {
    return JSON.parse(JSON.stringify(this.state));
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }

  getGroundY(): number {
    return this.groundY;
  }

  getLaneWidth(): number {
    return this.laneWidth;
  }

  reset(): void {
    this.noteIdCounter = 0;
    this.state = this.createInitialState();
  }

  start(): void {
    this.reset();
    this.state.lastSpawnTime = 0;
    this.state.lastBeatTime = 0;
    try {
      this.audioContext = new AudioContext();
    } catch (e) {
      console.log('Audio not available');
    }
  }

  tick(deltaTime: number): void {
    if (this.state.isGameOver) return;

    const speedMultiplier = this.state.isSlowMo ? 0.5 : 1;
    const adjustedDelta = deltaTime * speedMultiplier;

    this.state.gameTime += adjustedDelta;
    this.state.distance += this.state.speed * adjustedDelta * 0.01;

    const beatInterval = 60000 / this.state.bpm;
    const currentBeatTime = this.state.gameTime % beatInterval;

    if (this.state.gameTime - this.state.lastBeatTime > beatInterval) {
      this.state.beats.push(this.state.gameTime);
      if (this.state.beats.length > 5) {
        this.state.beats.shift();
      }
      this.state.currentBeat++;
      this.state.lastBeatTime = this.state.gameTime;

      if (this.state.currentBeat % 2 === 0) {
        this.spawnObstacle();
      }

      if (this.state.currentBeat % 8 === 0) {
        this.spawnPowerUp();
      }
    }

    if (this.state.isJumping) {
      this.state.playerY -= adjustedDelta * 0.5;
      if (this.state.playerY <= 0) {
        this.state.playerY = 0;
        this.state.isJumping = false;
      }
    } else if (this.state.playerY < 0) {
      this.state.playerY += adjustedDelta * 0.8;
      if (this.state.playerY > 0) {
        this.state.playerY = 0;
      }
    }

    this.state.obstacles.forEach(obstacle => {
      obstacle.y -= this.state.speed * adjustedDelta * 0.3;
    });

    this.state.powerUps.forEach(powerUp => {
      powerUp.y -= this.state.speed * adjustedDelta * 0.3;
    });

    this.checkCollisions();

    this.state.obstacles = this.state.obstacles.filter(
      obstacle => obstacle.y > -100 && !obstacle.hit
    );

    this.state.powerUps = this.state.powerUps.filter(
      powerUp => powerUp.y > -100 && !powerUp.collected
    );

    if (this.state.gameTime > 120000) {
      this.state.isGameOver = true;
    }
  }

  private spawnObstacle(): void {
    const type = Math.random() > 0.7 ? 'jump' : Math.random() > 0.5 ? 'slide' : 'double';
    const lane = Math.floor(Math.random() * this.lanes);

    const obstacle: Obstacle = {
      id: this.noteIdCounter++,
      type,
      lane,
      y: this.canvasHeight + 50,
      hit: false,
    };

    this.state.obstacles.push(obstacle);
  }

  private spawnPowerUp(): void {
    const types: ('shield' | 'magnet' | 'slowmo')[] = ['shield', 'magnet', 'slowmo'];
    const type = types[Math.floor(Math.random() * types.length)];

    const powerUp: PowerUp = {
      id: this.noteIdCounter++,
      type,
      x: this.canvasWidth / 2,
      y: this.canvasHeight + 50,
      collected: false,
    };

    this.state.powerUps.push(powerUp);
  }

  private checkCollisions(): void {
    const playerX = this.state.playerLane * this.laneWidth + this.laneWidth / 2;
    const playerY = this.groundY + this.state.playerY;
    const playerSize = 40;

    this.state.obstacles.forEach(obstacle => {
      if (obstacle.hit) return;

      const obstacleX = obstacle.lane * this.laneWidth + this.laneWidth / 2;
      const obstacleY = obstacle.y;
      const obstacleSize = 50;

      const dx = Math.abs(playerX - obstacleX);
      const dy = Math.abs(playerY - obstacleY);

      if (dx < (playerSize + obstacleSize) / 2 && dy < (playerSize + obstacleSize) / 2) {
        if (this.state.hasShield) {
          this.state.hasShield = false;
          obstacle.hit = true;
          this.registerHit('perfect');
        } else if (obstacle.type === 'slide' && this.state.isJumping) {
          obstacle.hit = true;
        } else if (obstacle.type === 'jump' && this.state.isSliding) {
          obstacle.hit = true;
        } else {
          this.registerMiss();
        }
      }
    });

    this.state.powerUps.forEach(powerUp => {
      if (powerUp.collected) return;

      const dx = Math.abs(playerX - powerUp.x);
      const dy = Math.abs(playerY - powerUp.y);

      if (dx < (playerSize + 40) / 2 && dy < (playerSize + 40) / 2) {
        powerUp.collected = true;
        this.collectPowerUp(powerUp.type);
        this.registerHit('perfect');
      }
    });
  }

  private collectPowerUp(type: 'shield' | 'magnet' | 'slowmo'): void {
    switch (type) {
      case 'shield':
        this.state.hasShield = true;
        break;
      case 'magnet':
        this.state.hasMagnet = true;
        setTimeout(() => {
          this.state.hasMagnet = false;
        }, 5000);
        break;
      case 'slowmo':
        this.state.isSlowMo = true;
        setTimeout(() => {
          this.state.isSlowMo = false;
        }, 3000);
        break;
    }
    this.playSound('perfect');
  }

  private registerHit(timing: 'perfect' | 'great' | 'good'): void {
    const scoreMap: Record<string, number> = {
      perfect: 100,
      great: 75,
      good: 50,
    };

    this.state.combo++;
    if (this.state.combo > this.state.maxCombo) {
      this.state.maxCombo = this.state.combo;
    }

    const comboMultiplier = Math.min(1 + Math.floor(this.state.combo / 5) * 0.1, 2);
    this.state.score += Math.floor(scoreMap[timing] * comboMultiplier);

    if (timing === 'perfect') this.state.perfectCount++;
    else if (timing === 'great') this.state.greatCount++;
    else this.state.goodCount++;
  }

  private registerMiss(): void {
    this.state.missCount++;
    this.state.combo = 0;
    this.state.isGameOver = true;
    this.playSound('miss');
  }

  moveLeft(): void {
    if (this.state.playerLane > 0) {
      this.state.playerLane--;
    }
  }

  moveRight(): void {
    if (this.state.playerLane < this.lanes - 1) {
      this.state.playerLane++;
    }
  }

  jump(): { result: string; score: number } {
    if (!this.state.isJumping && !this.state.isSliding) {
      this.state.isJumping = true;
      this.playSound('perfect');
      return { result: 'jump', score: 0 };
    }
    return { result: 'none', score: 0 };
  }

  slide(): { result: string; score: number } {
    if (!this.state.isJumping && !this.state.isSliding) {
      this.state.isSliding = true;
      setTimeout(() => {
        this.state.isSliding = false;
      }, 500);
      this.playSound('great');
      return { result: 'slide', score: 0 };
    }
    return { result: 'none', score: 0 };
  }

  private playSound(type: string): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const frequencies: Record<string, number> = {
        perfect: 880,
        great: 660,
        good: 440,
        miss: 220,
        jump: 600,
        slide: 400,
      };

      oscillator.frequency.value = frequencies[type] || 440;
      oscillator.type = type === 'miss' ? 'sawtooth' : 'sine';

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio not available
    }
  }

  getAccuracy(): number {
    const total = this.state.perfectCount + this.state.greatCount +
                  this.state.goodCount + this.state.missCount;
    if (total === 0) return 0;
    const weighted = (this.state.perfectCount * 100 +
                     this.state.greatCount * 80 +
                     this.state.goodCount * 50) / total;
    return Math.round(weighted);
  }
}
