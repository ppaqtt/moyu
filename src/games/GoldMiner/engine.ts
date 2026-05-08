export interface Position {
  x: number;
  y: number;
}

export interface Collectible {
  x: number;
  y: number;
  type: 'gold_small' | 'gold_large' | 'diamond' | 'rock';
  width: number;
  height: number;
  value: number;
  grabbed: boolean;
}

export interface Claw {
  x: number;
  y: number;
  angle: number;
  length: number;
  isExtending: boolean;
  isRetracting: boolean;
  grabbedItem: Collectible | null;
  speed: number;
}

export interface GameGoldMinerState {
  claw: Claw;
  collectibles: Collectible[];
  money: number;
  targetMoney: number;
  timeLeft: number;
  isGameOver: boolean;
  isWin: boolean;
  round: number;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;
const CLAW_START_X = CANVAS_WIDTH / 2;
const CLAW_START_Y = 30;
const MAX_LENGTH = 450;
const EXTEND_SPEED = 5;
const RETRACT_SPEED = 4;
const ROTATION_SPEED = 2;

const COLLECTIBLES_CONFIG = {
  gold_small: { minValue: 50, maxValue: 100, sizeRange: [20, 30] },
  gold_large: { minValue: 200, maxValue: 500, sizeRange: [40, 60] },
  diamond: { minValue: 600, maxValue: 800, sizeRange: [25, 35] },
  rock: { minValue: -50, maxValue: -20, sizeRange: [35, 55] }
};

export class GameGoldMinerEngine {
  private claw: Claw;
  private collectibles: Collectible[];
  private money: number;
  private targetMoney: number;
  private timeLeft: number;
  private isGameOver: boolean;
  private isWin: boolean;
  private round: number;
  private lastUpdate: number;

  constructor() {
    this.claw = {
      x: CLAW_START_X,
      y: CLAW_START_Y,
      angle: 90,
      length: 0,
      isExtending: false,
      isRetracting: false,
      grabbedItem: null,
      speed: EXTEND_SPEED
    };
    this.collectibles = [];
    this.money = 0;
    this.targetMoney = 500;
    this.timeLeft = 60;
    this.isGameOver = false;
    this.isWin = false;
    this.round = 1;
    this.lastUpdate = Date.now();
    this.init();
  }

  init(): void {
    this.claw = {
      x: CLAW_START_X,
      y: CLAW_START_Y,
      angle: 90,
      length: 0,
      isExtending: false,
      isRetracting: false,
      grabbedItem: null,
      speed: EXTEND_SPEED
    };
    this.collectibles = [];
    this.generateCollectibles();
  }

  private generateCollectibles(): void {
    this.collectibles = [];
    const types: ('gold_small' | 'gold_large' | 'diamond' | 'rock')[] = [
      'gold_small', 'gold_small', 'gold_small', 'gold_small', 'gold_small',
      'gold_large', 'gold_large', 'gold_large',
      'diamond', 'diamond',
      'rock', 'rock', 'rock'
    ];

    for (const type of types) {
      const config = COLLECTIBLES_CONFIG[type];
      const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);
      const value = Math.floor(config.minValue + Math.random() * (config.maxValue - config.minValue));

      let x, y, attempts = 0;
      do {
        x = 50 + Math.random() * (CANVAS_WIDTH - 100);
        y = 150 + Math.random() * (CANVAS_HEIGHT - 200);
        attempts++;
      } while (this.isOverlapping(x, y, size) && attempts < 50);

      this.collectibles.push({
        x,
        y,
        type,
        width: size,
        height: size,
        value,
        grabbed: false
      });
    }
  }

  private isOverlapping(x: number, y: number, size: number): boolean {
    for (const c of this.collectibles) {
      const dx = x - c.x;
      const dy = y - c.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < (size + c.width) / 2 + 10) {
        return true;
      }
    }
    return false;
  }

  getState(): GameGoldMinerState {
    return {
      claw: { ...this.claw },
      collectibles: this.collectibles.map(c => ({ ...c })),
      money: this.money,
      targetMoney: this.targetMoney,
      timeLeft: this.timeLeft,
      isGameOver: this.isGameOver,
      isWin: this.isWin,
      round: this.round
    };
  }

  rotateLeft(): void {
    if (!this.claw.isExtending && !this.claw.isRetracting) {
      this.claw.angle = Math.max(0, this.claw.angle - ROTATION_SPEED);
    }
  }

  rotateRight(): void {
    if (!this.claw.isExtending && !this.claw.isRetracting) {
      this.claw.angle = Math.min(180, this.claw.angle + ROTATION_SPEED);
    }
  }

  extend(): void {
    if (!this.claw.isExtending && !this.claw.isRetracting && this.claw.length === 0) {
      this.claw.isExtending = true;
    }
  }

  retract(): void {
    if (!this.claw.isRetracting && !this.claw.isExtending) {
      if (this.claw.length > 0 || this.claw.grabbedItem) {
        this.claw.isRetracting = true;
        this.claw.isExtending = false;
      }
    }
  }

  tick(): void {
    if (this.isGameOver || this.isWin) return;

    const now = Date.now();
    if (now - this.lastUpdate >= 1000) {
      this.timeLeft--;
      this.lastUpdate = now;

      if (this.timeLeft <= 0) {
        this.isGameOver = true;
        return;
      }
    }

    if (this.claw.isExtending) {
      this.claw.length += EXTEND_SPEED;

      const endX = this.getClawEndX();
      const endY = this.getClawEndY();

      for (const item of this.collectibles) {
        if (item.grabbed) continue;

        const dx = endX - item.x;
        const dy = endY - item.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < item.width / 2 + 15) {
          this.claw.grabbedItem = item;
          item.grabbed = true;
          this.claw.isExtending = false;
          this.claw.isRetracting = true;
          break;
        }
      }

      if (this.claw.length >= MAX_LENGTH) {
        this.claw.isExtending = false;
        this.claw.isRetracting = true;
      }
    }

    if (this.claw.isRetracting) {
      let speed = RETRACT_SPEED;

      if (this.claw.grabbedItem) {
        if (this.claw.grabbedItem.type === 'rock') {
          speed = RETRACT_SPEED * 0.5;
        } else if (this.claw.grabbedItem.type === 'gold_large') {
          speed = RETRACT_SPEED * 0.7;
        }
      }

      this.claw.length -= speed;

      if (this.claw.grabbedItem) {
        this.claw.grabbedItem.x = this.getClawEndX();
        this.claw.grabbedItem.y = this.getClawEndY();
      }

      if (this.claw.length <= 0) {
        this.claw.length = 0;

        if (this.claw.grabbedItem) {
          this.money += this.claw.grabbedItem.value;
          this.collectibles = this.collectibles.filter(c => c !== this.claw.grabbedItem);
          this.claw.grabbedItem = null;
        }

        this.claw.isRetracting = false;
        this.generateCollectibles();
      }
    }
  }

  private getClawEndX(): number {
    const rad = (this.claw.angle * Math.PI) / 180;
    return this.claw.x + Math.cos(rad) * this.claw.length;
  }

  private getClawEndY(): number {
    const rad = (this.claw.angle * Math.PI) / 180;
    return this.claw.y + Math.sin(rad) * this.claw.length;
  }

  checkWin(): void {
    if (this.money >= this.targetMoney && this.timeLeft > 0) {
      this.round++;
      this.targetMoney = Math.floor(this.targetMoney * 1.5);
      this.timeLeft = 60;
      this.init();
    }
  }

  reset(): void {
    this.money = 0;
    this.targetMoney = 500;
    this.timeLeft = 60;
    this.round = 1;
    this.isGameOver = false;
    this.isWin = false;
    this.init();
  }
}
