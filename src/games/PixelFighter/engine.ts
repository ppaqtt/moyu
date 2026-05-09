import { NEON_COLORS } from '../../utils/constants';

export interface FighterState {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  facing: 'left' | 'right';
  isAttacking: boolean;
  attackType: 'punch' | 'kick' | 'combo' | null;
  attackFrame: number;
  comboCount: number;
  isBlocking: boolean;
  velocityX: number;
  velocityY: number;
  isHit: boolean;
  hitFrame: number;
  isDucking: boolean;
  isJumping: boolean;
}

export interface GameState {
  phase: 'menu' | 'fighting' | 'gameover';
  player1: FighterState;
  player2: FighterState;
  winner: 1 | 2 | null;
  round: number;
  maxRounds: number;
  player1Wins: number;
  player2Wins: number;
  timeLeft: number;
  score1: number;
  score2: number;
  message: string;
  messageTimer: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  punch: boolean;
  kick: boolean;
  special: boolean;
}

export class PixelFighterEngine {
  private state: GameState;
  private canvasWidth = 600;
  private canvasHeight = 400;
  private gravity = 0.8;
  private groundY = 320;
  private fighterWidth = 60;
  private fighterHeight = 80;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      phase: 'menu',
      player1: this.createFighter(80),
      player2: this.createFighter(460),
      winner: null,
      round: 1,
      maxRounds: 3,
      player1Wins: 0,
      player2Wins: 0,
      timeLeft: 99,
      score1: 0,
      score2: 0,
      message: '',
      messageTimer: 0
    };
  }

  private createFighter(x: number): FighterState {
    return {
      x,
      y: this.groundY,
      health: 100,
      maxHealth: 100,
      facing: x < 300 ? 'right' : 'left',
      isAttacking: false,
      attackType: null,
      attackFrame: 0,
      comboCount: 0,
      isBlocking: false,
      velocityX: 0,
      velocityY: 0,
      isHit: false,
      hitFrame: 0,
      isDucking: false,
      isJumping: false
    };
  }

  getState(): GameState {
    return this.state;
  }

  startGame(): void {
    this.state.phase = 'fighting';
    this.state.timeLeft = 99;
    this.state.message = 'FIGHT!';
    this.state.messageTimer = 60;
    this.resetRound();
  }

  resetRound(): void {
    this.state.player1 = this.createFighter(80);
    this.state.player2 = this.createFighter(460);
    this.state.player1.health = 100;
    this.state.player2.health = 100;
  }

  reset(): void {
    this.state = this.createInitialState();
  }

  setPhase(phase: 'menu' | 'fighting' | 'gameover'): void {
    this.state.phase = phase;
  }

  private updateFighter(fighter: FighterState, input: InputState, opponent: FighterState, isAI: boolean): void {
    if (fighter.health <= 0) return;

    // Update hit state
    if (fighter.isHit) {
      fighter.hitFrame++;
      if (fighter.hitFrame > 15) {
        fighter.isHit = false;
        fighter.hitFrame = 0;
      }
    }

    // Update attack state
    if (fighter.isAttacking) {
      fighter.attackFrame++;
      if (fighter.attackFrame > 20) {
        fighter.isAttacking = false;
        fighter.attackType = null;
        fighter.attackFrame = 0;
      }
    }

    // Blocking
    fighter.isBlocking = input.down && !fighter.isAttacking;

    // Movement
    if (!fighter.isAttacking && !fighter.isHit) {
      const speed = fighter.isDucking ? 0 : 4;

      if (input.left) {
        fighter.x -= speed;
        fighter.velocityX = -speed;
      }
      if (input.right) {
        fighter.x += speed;
        fighter.velocityX = speed;
      }

      // Ducking
      fighter.isDucking = input.down && !fighter.isJumping;

      // Jumping
      if (input.up && !fighter.isJumping && !fighter.isDucking) {
        fighter.isJumping = true;
        fighter.velocityY = -15;
      }
    }

    // Apply gravity
    if (fighter.isJumping) {
      fighter.velocityY += this.gravity;
      fighter.y += fighter.velocityY;

      if (fighter.y >= this.groundY) {
        fighter.y = this.groundY;
        fighter.isJumping = false;
        fighter.velocityY = 0;
      }
    }

    // Face opponent
    fighter.facing = fighter.x < opponent.x ? 'right' : 'left';

    // Attack input
    if (input.punch && !fighter.isAttacking && !fighter.isHit) {
      this.performAttack(fighter, 'punch');
    }
    if (input.kick && !fighter.isAttacking && !fighter.isHit) {
      this.performAttack(fighter, 'kick');
    }
    if (input.special && !fighter.isAttacking && !fighter.isHit) {
      this.performAttack(fighter, 'combo');
    }

    // Boundary check
    fighter.x = Math.max(30, Math.min(this.canvasWidth - 30, fighter.x));
  }

  private performAttack(fighter: FighterState, type: 'punch' | 'kick' | 'combo'): void {
    fighter.isAttacking = true;
    fighter.attackType = type;
    fighter.attackFrame = 0;

    if (type === 'combo') {
      fighter.comboCount++;
    } else {
      fighter.comboCount = 0;
    }
  }

  private checkHit(attacker: FighterState, defender: FighterState): boolean {
    if (!attacker.isAttacking || attacker.attackFrame !== 5) return false;
    if (defender.isHit) return false;

    const attackRange = attacker.attackType === 'kick' ? 70 : 50;
    const hitX = attacker.facing === 'right' ? attacker.x + attackRange : attacker.x - attackRange;

    const dx = Math.abs(attacker.x - defender.x);
    const dy = Math.abs(attacker.y - defender.y);

    return dx < attackRange && dy < 60;
  }

  private applyDamage(attacker: FighterState, defender: FighterState, gameState: GameState): void {
    let damage = 0;
    let score = 0;

    switch (attacker.attackType) {
      case 'punch':
        damage = 8;
        score = 100;
        break;
      case 'kick':
        damage = 12;
        score = 150;
        break;
      case 'combo':
        damage = 15 + attacker.comboCount * 2;
        score = 200 + attacker.comboCount * 50;
        break;
    }

    if (defender.isBlocking) {
      damage = Math.floor(damage * 0.2);
    }

    defender.health = Math.max(0, defender.health - damage);
    defender.isHit = true;
    defender.hitFrame = 0;

    // Knockback
    const knockback = defender.isBlocking ? 5 : 15;
    defender.x += attacker.facing === 'right' ? knockback : -knockback;

    // Update score
    if (attacker === this.state.player1) {
      this.state.score1 += score;
    } else {
      this.state.score2 += score;
    }

    this.state.message = damage > 20 ? 'COMBO!' : damage > 10 ? 'GREAT!' : 'HIT!';
    this.state.messageTimer = 30;
  }

  private getAIMove(fighter: FighterState, opponent: FighterState): InputState {
    const input: InputState = {
      left: false,
      right: false,
      up: false,
      down: false,
      punch: false,
      kick: false,
      special: false
    };

    const dx = opponent.x - fighter.x;
    const distance = Math.abs(dx);

    // AI logic
    if (distance > 80) {
      // Move towards opponent
      if (dx > 0) input.right = true;
      else input.left = true;
    } else if (distance < 40) {
      // Too close, maybe back off or attack
      if (Math.random() < 0.3) {
        if (dx > 0) input.left = true;
        else input.right = true;
      }
    }

    // Attack when in range
    if (distance < 70 && Math.random() < 0.1) {
      const rand = Math.random();
      if (rand < 0.5) input.punch = true;
      else if (rand < 0.8) input.kick = true;
      else input.special = true;
    }

    // Random jump
    if (Math.random() < 0.02) {
      input.up = true;
    }

    // Random block
    input.down = Math.random() < 0.1 && distance < 60;

    return input;
  }

  tick(deltaTime: number, playerInput: InputState): void {
    if (this.state.phase !== 'fighting') return;

    // Update timer
    this.state.timeLeft -= deltaTime / 60;
    if (this.state.timeLeft <= 0) {
      this.state.timeLeft = 0;
      this.endRound();
      return;
    }

    // Update message timer
    if (this.state.messageTimer > 0) {
      this.state.messageTimer--;
    }

    // Get AI input
    const aiInput = this.getAIMove(this.state.player2, this.state.player1);

    // Update fighters
    this.updateFighter(this.state.player1, playerInput, this.state.player2, false);
    this.updateFighter(this.state.player2, aiInput, this.state.player1, true);

    // Check hits
    if (this.checkHit(this.state.player1, this.state.player2)) {
      this.applyDamage(this.state.player1, this.state.player2, this.state);
    }
    if (this.checkHit(this.state.player2, this.state.player1)) {
      this.applyDamage(this.state.player2, this.state.player1, this.state);
    }

    // Check for KO
    if (this.state.player1.health <= 0 || this.state.player2.health <= 0) {
      this.endRound();
    }
  }

  private endRound(): void {
    if (this.state.player1.health <= 0) {
      this.state.winner = 2;
      this.state.player2Wins++;
      this.state.message = 'PLAYER 2 WINS!';
    } else if (this.state.player2.health <= 0) {
      this.state.winner = 1;
      this.state.player1Wins++;
      this.state.message = 'PLAYER 1 WINS!';
    } else {
      // Time out - more health wins
      if (this.state.player1.health > this.state.player2.health) {
        this.state.winner = 1;
        this.state.player1Wins++;
        this.state.message = 'PLAYER 1 WINS!';
      } else {
        this.state.winner = 2;
        this.state.player2Wins++;
        this.state.message = 'PLAYER 2 WINS!';
      }
    }

    this.state.messageTimer = 120;

    // Check for match winner
    if (this.state.player1Wins >= 2 || this.state.player2Wins >= 2) {
      this.state.phase = 'gameover';
    } else {
      this.state.round++;
      setTimeout(() => {
        if (this.state.phase === 'fighting') {
          this.resetRound();
          this.state.winner = null;
          this.state.message = 'ROUND ' + this.state.round;
          this.state.messageTimer = 60;
        }
      }, 2000);
    }
  }
}

export const pixelFighterEngine = new PixelFighterEngine();
