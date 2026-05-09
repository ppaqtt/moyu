import { NEON_COLORS } from '../../utils/constants';

export interface WrestlerState {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  state: 'standing' | 'grappling' | 'thrown' | 'pinning' | 'dizzy';
  grappling: boolean;
  grapplingWith: number | null;
  throwFrame: number;
  isPinning: boolean;
  pinCount: number;
  pinTimer: number;
  dizzyFrame: number;
  velocityX: number;
  velocityY: number;
  score: number;
  facing: 'left' | 'right';
  stamina: number;
  maxStamina: number;
}

export interface GameState {
  phase: 'menu' | 'fighting' | 'gameover';
  wrestlers: [WrestlerState, WrestlerState];
  winner: 1 | 2 | null;
  message: string;
  messageTimer: number;
  pinProgress: number;
  roundTime: number;
  crowdIntensity: number;
}

export class WrestleManiaEngine {
  private state: GameState;
  private canvasWidth = 500;
  private canvasHeight = 500;
  private groundY = 420;
  private gravity = 0.5;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      phase: 'menu',
      wrestlers: [this.createWrestler(120, 0), this.createWrestler(350, 1)],
      winner: null,
      message: '',
      messageTimer: 0,
      pinProgress: 0,
      roundTime: 180,
      crowdIntensity: 0
    };
  }

  private createWrestler(x: number, index: number): WrestlerState {
    return {
      x,
      y: this.groundY,
      health: 100,
      maxHealth: 100,
      state: 'standing',
      grappling: false,
      grapplingWith: null,
      throwFrame: 0,
      isPinning: false,
      pinCount: 0,
      pinTimer: 0,
      dizzyFrame: 0,
      velocityX: 0,
      velocityY: 0,
      score: 0,
      facing: index === 0 ? 'right' : 'left',
      stamina: 100,
      maxStamina: 100
    };
  }

  getState(): GameState {
    return this.state;
  }

  startMatch(): void {
    this.state.phase = 'fighting';
    this.state.roundTime = 180;
    this.state.message = '摔跤!';
    this.state.messageTimer = 60;
  }

  reset(): void {
    this.state = this.createInitialState();
  }

  private resetMatch(): void {
    this.state.wrestlers = [this.createWrestler(120, 0), this.createWrestler(350, 1)];
    this.state.pinProgress = 0;
    this.state.message = '';
    this.state.messageTimer = 0;
  }

  private updateWrestler(wrestler: WrestlerState, input: { left: boolean; right: boolean; grab: boolean; throw_: boolean; pin: boolean }, opponent: WrestlerState, index: number): void {
    if (wrestler.health <= 0) return;

    // Regenerate stamina
    wrestler.stamina = Math.min(wrestler.maxStamina, wrestler.stamina + 0.15);

    // Handle dizzy state
    if (wrestler.state === 'dizzy') {
      wrestler.dizzyFrame--;
      if (wrestler.dizzyFrame <= 0) {
        wrestler.state = 'standing';
      }
      return;
    }

    // Handle thrown state
    if (wrestler.state === 'thrown') {
      wrestler.x += wrestler.velocityX;
      wrestler.y += wrestler.velocityY;
      wrestler.velocityY += this.gravity;

      if (wrestler.y >= this.groundY) {
        wrestler.y = this.groundY;
        wrestler.state = 'dizzy';
        wrestler.dizzyFrame = 60;
        wrestler.velocityY = 0;
      }
      return;
    }

    // Handle grappling
    if (wrestler.grappling && wrestler.grapplingWith !== null) {
      wrestler.state = 'grappling';

      // Move towards opponent
      const target = this.state.wrestlers[wrestler.grapplingWith];
      const dx = target.x - wrestler.x;
      if (Math.abs(dx) > 30) {
        wrestler.x += dx > 0 ? 2 : -2;
      }

      // Face opponent
      wrestler.facing = wrestler.x < target.x ? 'right' : 'left';

      // Throw input
      if (input.throw_ && wrestler.stamina >= 20) {
        this.performThrow(wrestler, target);
        wrestler.stamina -= 20;
      }

      // Release grab
      if (!input.grab || wrestler.stamina < 5) {
        wrestler.grappling = false;
        wrestler.grapplingWith = null;
        wrestler.state = 'standing';
      }

      return;
    }

    // Movement
    const speed = 4;
    if (input.left) {
      wrestler.x -= speed;
      wrestler.velocityX = -speed;
    }
    if (input.right) {
      wrestler.x += speed;
      wrestler.velocityX = speed;
    }

    // Face opponent
    wrestler.facing = wrestler.x < opponent.x ? 'right' : 'left';

    // Grappling initiation
    if (input.grab && wrestler.stamina >= 15) {
      const dx = Math.abs(wrestler.x - opponent.x);
      if (dx < 60 && opponent.state !== 'grappling' && opponent.state !== 'dizzy') {
        wrestler.grappling = true;
        wrestler.grapplingWith = index === 0 ? 1 : 0;
        wrestler.state = 'grappling';
        wrestler.stamina -= 15;
      }
    }

    // Pin attempt
    if (input.pin && opponent.state === 'dizzy' && wrestler.state === 'standing') {
      const dx = Math.abs(wrestler.x - opponent.x);
      if (dx < 40) {
        wrestler.isPinning = true;
        opponent.isPinning = true;
        wrestler.state = 'pinning';
        wrestler.pinTimer = 0;
        wrestler.pinCount++;
        this.state.message = `${wrestler.pinCount}...`;
        this.state.messageTimer = 30;
      }
    }

    // Boundary
    wrestler.x = Math.max(40, Math.min(this.canvasWidth - 40, wrestler.x));
  }

  private performThrow(thrower: WrestlerState, target: WrestlerState): void {
    thrower.grappling = false;
    thrower.grapplingWith = null;
    thrower.state = 'standing';

    target.grappling = false;
    target.grapplingWith = null;
    target.state = 'thrown';
    target.velocityX = thrower.facing === 'right' ? 12 : -12;
    target.velocityY = -10;

    thrower.score += 150;
    this.state.message = '过肩摔!';
    this.state.messageTimer = 40;

    // Small damage
    target.health = Math.max(0, target.health - 8);
  }

  private checkPin(): void {
    for (let i = 0; i < 2; i++) {
      const wrestler = this.state.wrestlers[i];
      const opponent = this.state.wrestlers[1 - i];

      if (wrestler.isPinning && opponent.state === 'dizzy') {
        wrestler.pinTimer++;
        this.state.pinProgress = (wrestler.pinTimer / 180) * 100; // 3 seconds to pin

        if (wrestler.pinTimer >= 180) {
          // Pin successful!
          this.endMatch(i + 1 as 1 | 2);
          return;
        }
      } else {
        wrestler.isPinning = false;
      }
    }
  }

  private endMatch(winner: 1 | 2): void {
    this.state.phase = 'gameover';
    this.state.winner = winner;
    this.state.message = winner === 1 ? '选手1 获胜!' : '选手2 获胜!';
    this.state.messageTimer = 300;
    this.state.crowdIntensity = 100;
  }

  private getAIInput(wrestler: WrestlerState, opponent: WrestlerState): { left: boolean; right: boolean; grab: boolean; throw_: boolean; pin: boolean } {
    const dx = opponent.x - wrestler.x;
    const distance = Math.abs(dx);

    const input: { left: boolean; right: boolean; grab: boolean; throw_: boolean; pin: boolean } = {
      left: false,
      right: false,
      grab: false,
      throw_: false,
      pin: false
    };

    if (wrestler.state === 'dizzy' || wrestler.state === 'thrown' || wrestler.state === 'pinning') {
      return input;
    }

    // Approach
    if (distance > 70) {
      input.right = dx > 0;
      input.left = dx < 0;
    } else if (distance < 40) {
      input.left = dx > 0;
      input.right = dx < 0;
    }

    // Grappling
    if (distance < 60 && opponent.state !== 'grappling' && Math.random() < 0.08) {
      input.grab = true;
    }

    // Throw when grappling
    if (wrestler.grappling && Math.random() < 0.1) {
      input.throw_ = true;
    }

    // Pin attempt
    if (opponent.state === 'dizzy' && distance < 50 && Math.random() < 0.15) {
      input.pin = true;
    }

    return input;
  }

  tick(deltaTime: number, playerInput: { left: boolean; right: boolean; grab: boolean; throw_: boolean; pin: boolean }): void {
    if (this.state.phase !== 'fighting') return;

    this.state.roundTime -= deltaTime / 60;

    if (this.state.messageTimer > 0) {
      this.state.messageTimer--;
    }

    if (this.state.roundTime <= 0) {
      // Time's up - winner by health
      const winner = this.state.wrestlers[0].health > this.state.wrestlers[1].health ? 1 : 2;
      this.endMatch(winner);
      return;
    }

    // AI controls wrestler 2
    const aiInput = this.getAIInput(this.state.wrestlers[1], this.state.wrestlers[0]);

    // Update wrestlers
    this.updateWrestler(this.state.wrestlers[0], playerInput, this.state.wrestlers[1], 0);
    this.updateWrestler(this.state.wrestlers[1], aiInput, this.state.wrestlers[0], 1);

    // Check for pin
    this.checkPin();

    // Update crowd intensity based on action
    if (this.state.messageTimer > 20) {
      this.state.crowdIntensity = Math.min(100, this.state.crowdIntensity + 2);
    } else {
      this.state.crowdIntensity = Math.max(20, this.state.crowdIntensity - 0.5);
    }
  }
}

export const wrestleManiaEngine = new WrestleManiaEngine();
