import { NEON_COLORS } from '../../utils/constants';

export interface SamuraiState {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  stance: 'ready' | 'strike' | 'recover' | 'hit' | 'defend';
  strikeFrame: number;
  strikeType: 'horizontal' | 'vertical' | 'thrust';
  isBlocking: boolean;
  honor: number;
  maxHonor: number;
  score: number;
  facing: 'left' | 'right';
  hitFrame: number;
  isAirborne: boolean;
}

export interface SlashEffect {
  x: number;
  y: number;
  type: 'horizontal' | 'vertical' | 'thrust';
  frame: number;
  player: 1 | 2;
}

export interface GameState {
  phase: 'menu' | 'ready' | 'fighting' | 'gameover';
  player1: SamuraiState;
  player2: SamuraiState;
  effects: SlashEffect[];
  winner: 1 | 2 | null;
  timeLeft: number;
  round: number;
  message: string;
  messageTimer: number;
  honorBonus: number;
}

export class SamuraiSlashEngine {
  private state: GameState;
  private canvasWidth = 600;
  private canvasHeight = 500;
  private groundY = 400;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      phase: 'menu',
      player1: this.createSamurai(150, 1),
      player2: this.createSamurai(450, 2),
      effects: [],
      winner: null,
      timeLeft: 60,
      round: 1,
      message: '',
      messageTimer: 0,
      honorBonus: 0
    };
  }

  private createSamurai(x: number, player: 1 | 2): SamuraiState {
    return {
      x,
      y: this.groundY,
      health: 100,
      maxHealth: 100,
      stance: 'ready',
      strikeFrame: 0,
      strikeType: 'horizontal',
      isBlocking: false,
      honor: 50,
      maxHonor: 100,
      score: 0,
      facing: player === 1 ? 'right' : 'left',
      hitFrame: 0,
      isAirborne: false
    };
  }

  getState(): GameState {
    return this.state;
  }

  startDuel(): void {
    this.state.phase = 'ready';
    this.state.message = '准备...';
    this.state.messageTimer = 90;
    this.state.round = 1;
    this.state.honorBonus = 0;

    setTimeout(() => {
      this.state.phase = 'fighting';
      this.state.timeLeft = 60;
      this.state.message = '斩!';
      this.state.messageTimer = 45;
    }, 1500);
  }

  reset(): void {
    this.state = this.createInitialState();
  }

  private resetDuel(): void {
    this.state.player1 = this.createSamurai(150, 1);
    this.state.player2 = this.createSamurai(450, 2);
    this.state.effects = [];
    this.state.timeLeft = 60;
    this.state.honorBonus = 0;
  }

  private updateSamurai(samurai: SamuraiState, input: { left: boolean; right: boolean; strike1: boolean; strike2: boolean; strike3: boolean; block: boolean }, opponent: SamuraiState): void {
    if (samurai.health <= 0) return;

    // Update hit state
    if (samurai.hitFrame > 0) {
      samurai.hitFrame--;
      if (samurai.hitFrame === 0) {
        samurai.stance = 'ready';
      }
      return;
    }

    // Update strike state
    if (samurai.stance === 'strike') {
      samurai.strikeFrame++;
      const strikeDuration = 25;
      if (samurai.strikeFrame >= strikeDuration) {
        samurai.stance = 'recover';
        samurai.strikeFrame = 0;
      }
      return;
    }

    if (samurai.stance === 'recover') {
      samurai.strikeFrame++;
      const recoverDuration = 15;
      if (samurai.strikeFrame >= recoverDuration) {
        samurai.stance = 'ready';
        samurai.strikeFrame = 0;
      }
      return;
    }

    // Movement
    if (samurai.stance === 'ready') {
      const speed = 3;
      if (input.left) samurai.x -= speed;
      if (input.right) samurai.x += speed;
    }

    // Face opponent
    samurai.facing = samurai.x < opponent.x ? 'right' : 'left';

    // Blocking
    samurai.isBlocking = input.block && samurai.stance === 'ready';

    // Strike inputs
    if (samurai.stance === 'ready' && !samurai.isBlocking) {
      if (input.strike1) {
        this.performStrike(samurai, 'horizontal');
      } else if (input.strike2) {
        this.performStrike(samurai, 'vertical');
      } else if (input.strike3) {
        this.performStrike(samurai, 'thrust');
      }
    }

    // Boundary check
    samurai.x = Math.max(80, Math.min(this.canvasWidth - 80, samurai.x));
  }

  private performStrike(samurai: SamuraiState, type: 'horizontal' | 'vertical' | 'thrust'): void {
    samurai.stance = 'strike';
    samurai.strikeType = type;
    samurai.strikeFrame = 0;

    // Create slash effect
    this.state.effects.push({
      x: samurai.x,
      y: samurai.y - 50,
      type,
      frame: 0,
      player: samurai === this.state.player1 ? 1 : 2
    });
  }

  private checkStrikeHit(striker: SamuraiState, defender: SamuraiState): boolean {
    if (striker.stance !== 'strike') return false;
    if (striker.strikeFrame !== 8) return false; // Hit at frame 8

    const range = striker.strikeType === 'thrust' ? 90 : 75;
    const dx = Math.abs(striker.x - defender.x);

    return dx < range;
  }

  private applyStrikeDamage(striker: SamuraiState, defender: SamuraiState): void {
    let damage = 0;
    let honorGain = 0;

    switch (striker.strikeType) {
      case 'horizontal': damage = 15; honorGain = 5; break;
      case 'vertical': damage = 20; honorGain = 8; break;
      case 'thrust': damage = 25; honorGain = 10; break;
    }

    if (defender.isBlocking) {
      damage = Math.floor(damage * 0.2);
      defender.honor = Math.min(defender.maxHonor, defender.honor + 5);
      striker.honor = Math.max(0, striker.honor - 5);
    } else {
      defender.honor = Math.max(0, defender.honor - honorGain);
      striker.honor = Math.min(striker.maxHonor, striker.honor + honorGain);
    }

    defender.health = Math.max(0, defender.health - damage);
    defender.stance = 'hit';
    defender.hitFrame = 20;

    // Knockback
    const knockback = defender.isBlocking ? 8 : 20;
    defender.x += striker.facing === 'right' ? knockback : -knockback;

    striker.score += 100;
    this.state.honorBonus += honorGain;
    this.state.message = this.getStrikeMessage(striker.strikeType);
    this.state.messageTimer = 30;
  }

  private getStrikeMessage(type: 'horizontal' | 'vertical' | 'thrust'): string {
    const messages = {
      horizontal: '横斩!',
      vertical: '竖劈!',
      thrust: '突刺!'
    };
    return messages[type];
  }

  private getAIInput(samurai: SamuraiState, opponent: SamuraiState): { left: boolean; right: boolean; strike1: boolean; strike2: boolean; strike3: boolean; block: boolean } {
    const dx = opponent.x - samurai.x;
    const distance = Math.abs(dx);

    const input: { left: boolean; right: boolean; strike1: boolean; strike2: boolean; strike3: boolean; block: boolean } = {
      left: false,
      right: false,
      strike1: false,
      strike2: false,
      strike3: false,
      block: false
    };

    if (samurai.stance !== 'ready') return input;

    // Position for optimal attack
    const optimalRange = 80;
    if (distance > optimalRange + 20) {
      input.right = dx > 0;
      input.left = dx < 0;
    } else if (distance < optimalRange - 20) {
      input.left = dx > 0;
      input.right = dx < 0;
    }

    // Attack patterns
    if (distance < optimalRange && Math.random() < 0.08) {
      const rand = Math.random();
      if (rand < 0.4) input.strike1 = true;
      else if (rand < 0.7) input.strike2 = true;
      else input.strike3 = true;
    }

    // Block occasionally
    input.block = Math.random() < 0.12 && distance < 70;

    return input;
  }

  tick(deltaTime: number, playerInput: { left: boolean; right: boolean; strike1: boolean; strike2: boolean; strike3: boolean; block: boolean }): void {
    if (this.state.phase === 'menu') return;

    if (this.state.messageTimer > 0) {
      this.state.messageTimer--;
    }

    if (this.state.phase === 'ready') {
      return;
    }

    if (this.state.phase === 'fighting') {
      this.state.timeLeft -= deltaTime / 60;

      // Get AI input
      const aiInput = this.getAIInput(this.state.player2, this.state.player1);

      // Update samurai
      this.updateSamurai(this.state.player1, playerInput, this.state.player2);
      this.updateSamurai(this.state.player2, aiInput, this.state.player1);

      // Check strikes
      if (this.checkStrikeHit(this.state.player1, this.state.player2)) {
        this.applyStrikeDamage(this.state.player1, this.state.player2);
      }
      if (this.checkStrikeHit(this.state.player2, this.state.player1)) {
        this.applyStrikeDamage(this.state.player2, this.state.player1);
      }

      // Update slash effects
      this.state.effects = this.state.effects.filter(e => {
        e.frame++;
        return e.frame < 20;
      });

      // Check for duel end
      if (this.state.player1.health <= 0 || this.state.player2.health <= 0) {
        this.endDuel();
      } else if (this.state.timeLeft <= 0) {
        this.endDuel();
      }
    }
  }

  private endDuel(): void {
    this.state.phase = 'gameover';

    // Determine winner based on health and honor
    let winner: 1 | 2;
    let winReason = '';

    if (this.state.player1.health <= 0 || this.state.player2.health <= 0) {
      winner = this.state.player1.health > 0 ? 1 : 2;
      winReason = '击杀!';
    } else {
      // Compare health and honor
      const p1Score = this.state.player1.health + this.state.player1.honor;
      const p2Score = this.state.player2.health + this.state.player2.honor;
      winner = p1Score > p2Score ? 1 : 2;
      winReason = this.state.player1.health > this.state.player2.health ? '体力胜!' : '名誉胜!';
    }

    this.state.winner = winner;
    this.state.message = `玩家${winner}胜利! ${winReason}`;
    this.state.messageTimer = 180;
  }

  nextRound(): void {
    if (this.state.phase === 'gameover' && this.state.round < 3) {
      this.state.round++;
      this.resetDuel();
      this.state.phase = 'ready';
      this.state.message = `第${this.state.round}回合准备...`;
      this.state.messageTimer = 90;

      setTimeout(() => {
        this.state.phase = 'fighting';
        this.state.timeLeft = 60;
        this.state.message = '斩!';
        this.state.messageTimer = 45;
      }, 1500);
    }
  }
}

export const samuraiSlashEngine = new SamuraiSlashEngine();
