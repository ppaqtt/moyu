import { COOP_FRUIT_CATCH_CONSTANTS } from '../../utils/constants';

export interface Fruit {
  x: number;
  y: number;
  type: number;
  radius: number;
  vy: number;
  vx: number;
  active: boolean;
  caught: boolean;
}

export interface Basket {
  x: number;
  y: number;
  width: number;
  height: number;
  playerId: number;
}

export interface CoopFruitCatchState {
  fruits: Fruit[];
  basket1: Basket;
  basket2: Basket;
  score: { player1: number; player2: number; cooperative: number };
  gameStatus: 'idle' | 'playing' | 'gameover';
  timeLeft: number;
  combo: { player1: number; player2: number };
  missedFruits: number;
}

export const FRUIT_TYPES = [
  { emoji: '🍎', points: 10, color: '#ff6b6b' },
  { emoji: '🍊', points: 15, color: '#ffa502' },
  { emoji: '🍋', points: 20, color: '#ffd32a' },
  { emoji: '🍇', points: 25, color: '#9b59b6' },
  { emoji: '🍓', points: 30, color: '#ff4757' },
  { emoji: '🍑', points: 35, color: '#ff7f50' },
  { emoji: '🍒', points: 40, color: '#e74c3c' },
  { emoji: '🍍', points: 50, color: '#f39c12' }
];

export class CoopFruitCatchEngine {
  private fruits: Fruit[] = [];
  private basket1: Basket;
  private basket2: Basket;
  private score: { player1: number; player2: number; cooperative: number } = { player1: 0, player2: 0, cooperative: 0 };
  private gameStatus: 'idle' | 'playing' | 'gameover' = 'idle';
  private timeLeft: number = 60;
  private combo: { player1: number; player2: number } = { player1: 0, player2: 0 };
  private missedFruits: number = 0;
  private canvasWidth: number;
  private canvasHeight: number;
  private lastSpawnTime: number = 0;
  private spawnInterval: number = 800;

  constructor() {
    this.canvasWidth = COOP_FRUIT_CATCH_CONSTANTS.CANVAS_WIDTH;
    this.canvasHeight = COOP_FRUIT_CATCH_CONSTANTS.CANVAS_HEIGHT;
    this.init();
  }

  private init(): void {
    this.fruits = [];
    this.basket1 = {
      x: 80,
      y: this.canvasHeight - 80,
      width: COOP_FRUIT_CATCH_CONSTANTS.BASKET_WIDTH,
      height: COOP_FRUIT_CATCH_CONSTANTS.BASKET_HEIGHT,
      playerId: 1
    };
    this.basket2 = {
      x: this.canvasWidth - 80,
      y: this.canvasHeight - 80,
      width: COOP_FRUIT_CATCH_CONSTANTS.BASKET_WIDTH,
      height: COOP_FRUIT_CATCH_CONSTANTS.BASKET_HEIGHT,
      playerId: 2
    };
    this.score = { player1: 0, player2: 0, cooperative: 0 };
    this.gameStatus = 'idle';
    this.timeLeft = 60;
    this.combo = { player1: 0, player2: 0 };
    this.missedFruits = 0;
    this.lastSpawnTime = 0;
  }

  private spawnFruit(): void {
    const type = Math.floor(Math.random() * FRUIT_TYPES.length);
    const side = Math.random() > 0.5 ? 'left' : 'right';
    
    const fruit: Fruit = {
      x: side === 'left' ? Math.random() * (this.canvasWidth / 2 - 50) + 50 : 
         Math.random() * (this.canvasWidth / 2 - 50) + this.canvasWidth / 2,
      y: -20,
      type,
      radius: COOP_FRUIT_CATCH_CONSTANTS.FRUIT_RADIUS,
      vy: 2 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 2,
      active: true,
      caught: false
    };
    
    this.fruits.push(fruit);
  }

  public start(): void {
    if (this.gameStatus === 'idle' || this.gameStatus === 'gameover') {
      this.init();
      this.gameStatus = 'playing';
    }
  }

  public pause(): void {
    if (this.gameStatus === 'playing') {
      this.gameStatus = 'idle';
    }
  }

  public reset(): void {
    this.init();
  }

  public moveBasket1Left(): void {
    this.basket1.x = Math.max(this.basket1.width / 2 + 20, this.basket1.x - 20);
  }

  public moveBasket1Right(): void {
    this.basket1.x = Math.min(this.canvasWidth / 2 - this.basket1.width / 2, this.basket1.x + 20);
  }

  public moveBasket2Left(): void {
    this.basket2.x = Math.max(this.canvasWidth / 2 + this.basket2.width / 2, this.basket2.x - 20);
  }

  public moveBasket2Right(): void {
    this.basket2.x = Math.min(this.canvasWidth - this.basket2.width / 2 - 20, this.basket2.x + 20);
  }

  private updateFruits(): void {
    const now = Date.now();
    if (now - this.lastSpawnTime > this.spawnInterval) {
      this.spawnFruit();
      this.lastSpawnTime = now;
      this.spawnInterval = Math.max(400, this.spawnInterval - 5);
    }

    for (const fruit of this.fruits) {
      if (!fruit.active || fruit.caught) continue;

      fruit.x += fruit.vx;
      fruit.y += fruit.vy;

      if (fruit.x - fruit.radius < 0 || fruit.x + fruit.radius > this.canvasWidth) {
        fruit.vx = -fruit.vx;
      }

      if (fruit.y > this.canvasHeight) {
        fruit.active = false;
        this.missedFruits++;
        this.combo.player1 = 0;
        this.combo.player2 = 0;
      }
    }

    this.fruits = this.fruits.filter(f => f.active);
  }

  private checkCatch(basket: Basket, playerId: 1 | 2): void {
    for (const fruit of this.fruits) {
      if (!fruit.active || fruit.caught) continue;

      const basketTop = basket.y - basket.height / 2;
      const basketLeft = basket.x - basket.width / 2;
      const basketRight = basket.x + basket.width / 2;

      if (
        fruit.y + fruit.radius > basketTop &&
        fruit.y - fruit.radius < basket.y + basket.height / 2 &&
        fruit.x > basketLeft &&
        fruit.x < basketRight
      ) {
        fruit.caught = true;
        fruit.active = false;

        const fruitData = FRUIT_TYPES[fruit.type];
        const combo = playerId === 1 ? this.combo.player1 : this.combo.player2;
        const comboBonus = Math.min(combo, 10) * 5;
        const points = fruitData.points + comboBonus;

        if (playerId === 1) {
          this.score.player1 += points;
          this.combo.player1++;
        } else {
          this.score.player2 += points;
          this.combo.player2++;
        }
        this.score.cooperative += points;
      }
    }
  }

  public tick(): void {
    if (this.gameStatus !== 'playing') return;

    this.updateFruits();
    this.checkCatch(this.basket1, 1);
    this.checkCatch(this.basket2, 2);

    if (this.missedFruits >= 10) {
      this.gameStatus = 'gameover';
    }
  }

  public updateTimer(): void {
    if (this.gameStatus !== 'playing') return;
  }

  public setTimeLeft(time: number): void {
    this.timeLeft = time;
    if (this.timeLeft <= 0) {
      this.gameStatus = 'gameover';
    }
  }

  public getState(): CoopFruitCatchState {
    return {
      fruits: this.fruits.map(f => ({ ...f })),
      basket1: { ...this.basket1 },
      basket2: { ...this.basket2 },
      score: { ...this.score },
      gameStatus: this.gameStatus,
      timeLeft: this.timeLeft,
      combo: { ...this.combo },
      missedFruits: this.missedFruits
    };
  }

  public getScore(): { player1: number; player2: number; cooperative: number } {
    return this.score;
  }

  public getFruitTypes() {
    return FRUIT_TYPES;
  }

  public getGameStatus(): string {
    return this.gameStatus;
  }
}
