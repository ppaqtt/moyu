import { NEON_COLORS } from '../../utils/constants';

export interface Character {
  id: string;
  name: string;
  nameCn: string;
  color: string;
  health: number;
  speed: number;
  power: number;
  special: string;
}

export interface Player {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  character: Character;
  facing: 'left' | 'right';
  isAttacking: boolean;
  attackType: 'punch' | 'special' | 'throw';
  attackFrame: number;
  velocityX: number;
  velocityY: number;
  isHit: boolean;
  hitFrame: number;
  isStunned: boolean;
  stunFrame: number;
  score: number;
  hasPowerUp: boolean;
  powerUpType: 'health' | 'speed' | 'damage' | 'shield';
  powerUpTimer: number;
}

export interface PowerUp {
  x: number;
  y: number;
  type: 'health' | 'speed' | 'damage' | 'shield';
  active: boolean;
  spawnTime: number;
}

export interface GameState {
  phase: 'menu' | 'select' | 'fighting' | 'gameover';
  players: [Player, Player];
  powerUps: PowerUp[];
  winner: 1 | 2 | null;
  timeLeft: number;
  message: string;
  messageTimer: number;
  selectedCharacter: number;
}

const CHARACTERS: Character[] = [
  { id: 'tank', name: 'TANK', nameCn: '坦克', color: '#ff8800', health: 150, speed: 3, power: 1.2, special: '重拳' },
  { id: 'speed', name: 'SPEEDY', nameCn: '速度', color: '#00ffff', health: 80, speed: 6, power: 0.8, special: '快打' },
  { id: 'balanced', name: 'FIGHTER', nameCn: '战士', color: '#00ff00', health: 100, speed: 4, power: 1.0, special: '均衡' },
  { id: 'heavy', name: 'HEAVY', nameCn: '重击', color: '#ff0044', health: 120, speed: 2, power: 1.5, special: '毁灭' },
  { id: 'agile', name: 'NINJA', nameCn: '忍者', color: '#ff00ff', health: 90, speed: 5, power: 1.1, special: '一闪' }
];

export class BrawlStarsEngine {
  private state: GameState;
  private canvasWidth = 500;
  private canvasHeight = 500;
  private gravity = 0.6;
  private groundY = 420;
  private characterSize = 50;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      phase: 'menu',
      players: [this.createPlayer(100, CHARACTERS[0]), this.createPlayer(350, CHARACTERS[0])],
      powerUps: [],
      winner: null,
      timeLeft: 120,
      message: '',
      messageTimer: 0,
      selectedCharacter: 0
    };
  }

  private createPlayer(x: number, character: Character): Player {
    return {
      x,
      y: this.groundY,
      health: character.health,
      maxHealth: character.health,
      character,
      facing: 'right',
      isAttacking: false,
      attackType: 'punch',
      attackFrame: 0,
      velocityX: 0,
      velocityY: 0,
      isHit: false,
      hitFrame: 0,
      isStunned: false,
      stunFrame: 0,
      score: 0,
      hasPowerUp: false,
      powerUpType: 'health',
      powerUpTimer: 0
    };
  }

  private createPowerUp(): PowerUp {
    const types: PowerUp['type'][] = ['health', 'speed', 'damage', 'shield'];
    return {
      x: 50 + Math.random() * 400,
      y: 100 + Math.random() * 250,
      type: types[Math.floor(Math.random() * types.length)],
      active: true,
      spawnTime: Date.now()
    };
  }

  getState(): GameState {
    return this.state;
  }

  getCharacters(): Character[] {
    return CHARACTERS;
  }

  startGame(): void {
    this.state.phase = 'fighting';
    this.state.timeLeft = 120;
    this.state.message = 'BRAWL!';
    this.state.messageTimer = 60;
    this.state.powerUps = [];

    // Spawn initial power-ups
    for (let i = 0; i < 3; i++) {
      this.state.powerUps.push(this.createPowerUp());
    }
  }

  selectCharacter(index: number): void {
    this.state.selectedCharacter = index;
  }

  confirmCharacter(): void {
    const p1Char = CHARACTERS[this.state.selectedCharacter];
    const p2Char = CHARACTERS[(this.state.selectedCharacter + 1) % CHARACTERS.length];
    this.state.players[0] = this.createPlayer(80, p1Char);
    this.state.players[1] = this.createPlayer(370, p2Char);
    this.startGame();
  }

  reset(): void {
    this.state = this.createInitialState();
  }

  private updatePlayer(player: Player, input: { left: boolean; right: boolean; attack: boolean; special: boolean }, opponent: Player): void {
    if (player.health <= 0) return;

    // Update stun
    if (player.isStunned) {
      player.stunFrame++;
      if (player.stunFrame > 30) {
        player.isStunned = false;
        player.stunFrame = 0;
      }
      return;
    }

    // Update hit
    if (player.isHit) {
      player.hitFrame++;
      if (player.hitFrame > 20) {
        player.isHit = false;
        player.hitFrame = 0;
      }
    }

    // Update attack
    if (player.isAttacking) {
      player.attackFrame++;
      if (player.attackFrame > 25) {
        player.isAttacking = false;
        player.attackFrame = 0;
      }
    }

    // Update power-up
    if (player.hasPowerUp) {
      player.powerUpTimer--;
      if (player.powerUpTimer <= 0) {
        player.hasPowerUp = false;
      }
    }

    const speed = player.character.speed * (player.hasPowerUp && player.powerUpType === 'speed' ? 1.5 : 1);

    // Movement
    if (!player.isAttacking && !player.isHit) {
      if (input.left) {
        player.x -= speed;
        player.velocityX = -speed;
      }
      if (input.right) {
        player.x += speed;
        player.velocityX = speed;
      }
    }

    // Face opponent
    player.facing = player.x < opponent.x ? 'right' : 'left';

    // Jump (gravity based)
    if (player.y < this.groundY) {
      player.velocityY += this.gravity;
      player.y += player.velocityY;
      if (player.y >= this.groundY) {
        player.y = this.groundY;
        player.velocityY = 0;
      }
    }

    // Attack
    if (input.attack && !player.isAttacking) {
      player.isAttacking = true;
      player.attackType = 'punch';
      player.attackFrame = 0;
    }

    if (input.special && !player.isAttacking) {
      player.isAttacking = true;
      player.attackType = 'special';
      player.attackFrame = 0;
    }

    // Boundary
    player.x = Math.max(30, Math.min(this.canvasWidth - 30, player.x));
  }

  private checkHit(attacker: Player, defender: Player): boolean {
    if (!attacker.isAttacking || attacker.attackFrame !== 8) return false;
    if (defender.isHit || defender.isStunned) return false;

    const range = 60;
    const dx = Math.abs(attacker.x - defender.x);
    const dy = Math.abs(attacker.y - defender.y);

    return dx < range && dy < 50;
  }

  private applyDamage(attacker: Player, defender: Player): void {
    let damage = 10 * attacker.character.power;

    if (defender.hasPowerUp && defender.powerUpType === 'shield') {
      damage *= 0.3;
      defender.hasPowerUp = false;
    }

    if (attacker.hasPowerUp && attacker.powerUpType === 'damage') {
      damage *= 1.5;
    }

    defender.health = Math.max(0, defender.health - damage);
    defender.isHit = true;
    defender.hitFrame = 0;

    // Knockback
    const knockback = 20;
    defender.x += attacker.facing === 'right' ? knockback : -knockback;
    defender.velocityY = -5;

    attacker.score += 100;
    this.state.message = 'HIT!';
    this.state.messageTimer = 20;
  }

  private checkPowerUpCollection(player: Player): void {
    for (const powerUp of this.state.powerUps) {
      if (!powerUp.active) continue;

      const dx = Math.abs(player.x - powerUp.x);
      const dy = Math.abs(player.y - powerUp.y);

      if (dx < 40 && dy < 40) {
        powerUp.active = false;
        player.hasPowerUp = true;
        player.powerUpType = powerUp.type;
        player.powerUpTimer = 300; // 5 seconds

        switch (powerUp.type) {
          case 'health':
            player.health = Math.min(player.maxHealth, player.health + 30);
            break;
          case 'speed':
          case 'damage':
          case 'shield':
            break;
        }

        this.state.message = powerUp.type.toUpperCase() + '!';
        this.state.messageTimer = 30;
      }
    }
  }

  private getAIInput(player: Player, opponent: Player): { left: boolean; right: boolean; attack: boolean; special: boolean } {
    const dx = opponent.x - player.x;
    const distance = Math.abs(dx);

    return {
      left: dx > 0 ? false : distance > 60,
      right: dx > 0 ? distance > 60 : false,
      attack: distance < 70 && Math.random() < 0.08,
      special: distance < 80 && Math.random() < 0.03
    };
  }

  tick(deltaTime: number, playerInput: { left: boolean; right: boolean; attack: boolean; special: boolean }): void {
    if (this.state.phase !== 'fighting') return;

    this.state.timeLeft -= deltaTime / 60;
    if (this.state.messageTimer > 0) {
      this.state.messageTimer--;
    }

    if (this.state.timeLeft <= 0) {
      this.endMatch();
      return;
    }

    // AI controls player 2
    const aiInput = this.getAIInput(this.state.players[1], this.state.players[0]);

    // Update players
    this.updatePlayer(this.state.players[0], playerInput, this.state.players[1]);
    this.updatePlayer(this.state.players[1], aiInput, this.state.players[0]);

    // Check hits
    if (this.checkHit(this.state.players[0], this.state.players[1])) {
      this.applyDamage(this.state.players[0], this.state.players[1]);
    }
    if (this.checkHit(this.state.players[1], this.state.players[0])) {
      this.applyDamage(this.state.players[1], this.state.players[0]);
    }

    // Check power-up collection
    this.checkPowerUpCollection(this.state.players[0]);
    this.checkPowerUpCollection(this.state.players[1]);

    // Spawn new power-ups occasionally
    if (Math.random() < 0.005 && this.state.powerUps.filter(p => p.active).length < 3) {
      this.state.powerUps.push(this.createPowerUp());
    }

    // Clean up inactive power-ups
    this.state.powerUps = this.state.powerUps.filter(p => p.active || Date.now() - p.spawnTime < 10000);

    // Check for KO
    if (this.state.players[0].health <= 0 || this.state.players[1].health <= 0) {
      this.endMatch();
    }
  }

  private endMatch(): void {
    if (this.state.players[0].health > this.state.players[1].health) {
      this.state.winner = 1;
      this.state.players[0].score += 500;
    } else {
      this.state.winner = 2;
      this.state.players[1].score += 500;
    }
    this.state.phase = 'gameover';
    this.state.message = 'K.O.!';
    this.state.messageTimer = 120;
  }
}

export const brawlStarsEngine = new BrawlStarsEngine();
