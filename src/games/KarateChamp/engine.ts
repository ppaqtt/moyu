import { NEON_COLORS } from '../../utils/constants';

export interface FighterState {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  facing: 'left' | 'right';
  stance: 'stand' | 'block' | 'attack';
  attackType: 'punch' | 'kick' | 'sweep' | 'special' | null;
  attackFrame: number;
  isHit: boolean;
  hitFrame: number;
  isBlocking: boolean;
  blockFrame: number;
  comboCount: number;
  score: number;
  strikeZone: number;
}

export interface GameState {
  phase: 'menu' | 'fighting' | 'roundEnd' | 'gameover';
  player: FighterState;
  opponent: FighterState;
  round: number;
  maxRounds: number;
  playerWins: number;
  opponentWins: number;
  timeLeft: number;
  message: string;
  messageTimer: number;
  winner: 'player' | 'opponent' | null;
  roundStartTimer: number;
}

export class KarateChampEngine {
  private state: GameState;
  private canvasWidth = 500;
  private canvasHeight = 500;
  private groundY = 400;
  private fighterWidth = 50;
  private fighterHeight = 70;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      phase: 'menu',
      player: this.createFighter(100),
      opponent: this.createFighter(350),
      round: 1,
      maxRounds: 3,
      playerWins: 0,
      opponentWins: 0,
      timeLeft: 90,
      message: '',
      messageTimer: 0,
      winner: null,
      roundStartTimer: 0
    };
  }

  private createFighter(x: number): FighterState {
    return {
      x,
      y: this.groundY,
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      facing: 'right',
      stance: 'stand',
      attackType: null,
      attackFrame: 0,
      isHit: false,
      hitFrame: 0,
      isBlocking: false,
      blockFrame: 0,
      comboCount: 0,
      score: 0,
      strikeZone: 50
    };
  }

  getState(): GameState {
    return this.state;
  }

  startFight(): void {
    this.state.phase = 'fighting';
    this.state.timeLeft = 90;
    this.state.message = 'FIGHT!';
    this.state.messageTimer = 60;
    this.state.roundStartTimer = 0;
  }

  reset(): void {
    this.state = this.createInitialState();
  }

  private resetRound(): void {
    this.state.player = this.createFighter(100);
    this.state.opponent = this.createFighter(350);
    this.state.player.health = this.state.player.maxHealth;
    this.state.opponent.health = this.state.opponent.maxHealth;
  }

  private updateFighter(fighter: FighterState, input: { left: boolean; right: boolean; punch: boolean; kick: boolean; special: boolean; block: boolean }, opponent: FighterState, isAI: boolean): void {
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
    if (fighter.attackType) {
      fighter.attackFrame++;
      const attackDuration = fighter.attackType === 'special' ? 35 : fighter.attackType === 'sweep' ? 30 : 20;
      if (fighter.attackFrame >= attackDuration) {
        fighter.attackType = null;
        fighter.attackFrame = 0;
        fighter.stance = 'stand';
      }
    }

    // Blocking
    fighter.isBlocking = input.block && !fighter.attackType;

    // Movement
    if (!fighter.attackType && !fighter.isHit) {
      const speed = 4;

      if (input.left) {
        fighter.x -= speed;
      }
      if (input.right) {
        fighter.x += speed;
      }

      // Update stance
      if (fighter.isBlocking) {
        fighter.stance = 'block';
      } else {
        fighter.stance = 'stand';
      }
    }

    // Regenerate energy slowly
    fighter.energy = Math.min(fighter.maxEnergy, fighter.energy + 0.1);

    // Face opponent
    fighter.facing = fighter.x < opponent.x ? 'right' : 'left';

    // Attack inputs
    if (!fighter.attackType && !fighter.isHit) {
      if (input.punch) {
        this.performAttack(fighter, 'punch');
      } else if (input.kick) {
        this.performAttack(fighter, 'kick');
      } else if (input.special && fighter.energy >= 30) {
        this.performAttack(fighter, 'special');
        fighter.energy -= 30;
      }
    }

    // Boundary check
    fighter.x = Math.max(40, Math.min(this.canvasWidth - 40, fighter.x));
  }

  private performAttack(fighter: FighterState, type: 'punch' | 'kick' | 'sweep' | 'special'): void {
    fighter.attackType = type;
    fighter.attackFrame = 0;
    fighter.stance = 'attack';
  }

  private checkHit(attacker: FighterState, defender: FighterState): { hit: boolean; damage: number } {
    if (!attacker.attackType) return { hit: false, damage: 0 };
    if (defender.isHit) return { hit: false, damage: 0 };

    const hitFrame = attacker.attackType === 'special' ? 12 : 6;
    if (attacker.attackFrame !== hitFrame) return { hit: false, damage: 0 };

    const range = attacker.attackType === 'sweep' ? 70 : attacker.attackType === 'kick' ? 65 : 50;
    const dx = Math.abs(attacker.x - defender.x);
    const verticalRange = attacker.attackType === 'sweep' ? 40 : 60;

    if (dx < range) {
      let damage = 0;
      switch (attacker.attackType) {
        case 'punch': damage = 8; break;
        case 'kick': damage = 12; break;
        case 'sweep': damage = 10; break;
        case 'special': damage = 25; break;
      }
      return { hit: true, damage };
    }

    return { hit: false, damage: 0 };
  }

  private applyDamage(attacker: FighterState, defender: FighterState, damage: number): void {
    if (defender.isBlocking) {
      damage = Math.floor(damage * 0.15);
      attacker.score += 10;
    } else {
      attacker.comboCount++;
      attacker.score += 50 + attacker.comboCount * 10;
    }

    defender.health = Math.max(0, defender.health - damage);
    defender.isHit = true;
    defender.hitFrame = 0;

    // Knockback
    const knockback = defender.isBlocking ? 5 : 12;
    defender.x += attacker.facing === 'right' ? knockback : -knockback;

    this.state.message = damage > 20 ? 'SUPER HIT!' : damage > 10 ? 'GREAT!' : 'HIT!';
    this.state.messageTimer = 25;
  }

  private getAIInput(fighter: FighterState, opponent: FighterState): { left: boolean; right: boolean; punch: boolean; kick: boolean; special: boolean; block: boolean } {
    const dx = opponent.x - fighter.x;
    const distance = Math.abs(dx);

    const input: { left: boolean; right: boolean; punch: boolean; kick: boolean; special: boolean; block: boolean } = {
      left: false,
      right: false,
      punch: false,
      kick: false,
      special: false,
      block: false
    };

    // Move towards opponent
    if (distance > 80) {
      input.right = dx > 0;
      input.left = dx < 0;
    } else if (distance < 40) {
      // Back off occasionally
      if (Math.random() < 0.2) {
        input.left = dx > 0;
        input.right = dx < 0;
      }
    }

    // Attack patterns
    if (distance < 70 && !fighter.attackType) {
      const rand = Math.random();
      if (rand < 0.4) input.punch = true;
      else if (rand < 0.7) input.kick = true;
      else if (rand < 0.85 && fighter.energy >= 30) input.special = true;
    }

    // Block occasionally
    input.block = Math.random() < 0.15 && distance < 60;

    return input;
  }

  tick(deltaTime: number, playerInput: { left: boolean; right: boolean; punch: boolean; kick: boolean; special: boolean; block: boolean }): void {
    if (this.state.phase === 'menu') return;

    if (this.state.phase === 'roundEnd' || this.state.phase === 'gameover') return;

    if (this.state.phase === 'fighting') {
      // Round start timer
      if (this.state.roundStartTimer < 60) {
        this.state.roundStartTimer++;
        return;
      }

      this.state.timeLeft -= deltaTime / 60;

      if (this.state.messageTimer > 0) {
        this.state.messageTimer--;
      }

      if (this.state.timeLeft <= 0) {
        this.endRound();
        return;
      }

      // Get AI input
      const aiInput = this.getAIInput(this.state.opponent, this.state.player);

      // Update fighters
      this.updateFighter(this.state.player, playerInput, this.state.opponent, false);
      this.updateFighter(this.state.opponent, aiInput, this.state.player, true);

      // Check hits
      const playerHit = this.checkHit(this.state.player, this.state.opponent);
      if (playerHit.hit) {
        this.applyDamage(this.state.player, this.state.opponent, playerHit.damage);
      }

      const opponentHit = this.checkHit(this.state.opponent, this.state.player);
      if (opponentHit.hit) {
        this.applyDamage(this.state.opponent, this.state.player, opponentHit.damage);
      }

      // Check for KO
      if (this.state.player.health <= 0 || this.state.opponent.health <= 0) {
        this.endRound();
      }
    }
  }

  private endRound(): void {
    this.state.phase = 'roundEnd';
    this.state.messageTimer = 120;

    if (this.state.player.health > this.state.opponent.health) {
      this.state.winner = 'player';
      this.state.playerWins++;
      this.state.message = 'YOU WIN!';
    } else if (this.state.opponent.health > this.state.player.health) {
      this.state.winner = 'opponent';
      this.state.opponentWins++;
      this.state.message = 'YOU LOSE!';
    } else {
      this.state.winner = 'player'; // Tie goes to player
      this.state.playerWins++;
      this.state.message = 'DRAW!';
    }

    // Check for match winner
    setTimeout(() => {
      if (this.state.playerWins >= 2) {
        this.state.phase = 'gameover';
        this.state.message = 'CHAMPION!';
      } else if (this.state.opponentWins >= 2) {
        this.state.phase = 'gameover';
        this.state.message = 'DEFEATED!';
      } else {
        this.state.round++;
        this.resetRound();
        this.state.phase = 'fighting';
        this.state.winner = null;
        this.state.message = `ROUND ${this.state.round}`;
        this.state.roundStartTimer = 0;
      }
    }, 2000);
  }

  setPhase(phase: 'menu' | 'fighting' | 'roundEnd' | 'gameover'): void {
    this.state.phase = phase;
  }
}

export const karateChampEngine = new KarateChampEngine();
