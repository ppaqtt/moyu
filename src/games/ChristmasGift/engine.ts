export interface Gift {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  speed: number;
  type: string;
}

export interface GameState {
  score: number;
  lives: number;
  gifts: Gift[];
  gameOver: boolean;
  level: number;
  combo: number;
}

export interface ChristmasGiftEngine {
  initialize(): void;
  spawnGift(): void;
  catchGift(id: number): boolean;
  update(): void;
  getState(): GameState;
  reset(): void;
}

const GIFT_TYPES = [
  { color: '#ff0000', size: 40, name: 'gift' },
  { color: '#00ff00', size: 35, name: 'tree' },
  { color: '#ffff00', size: 30, name: 'star' },
  { color: '#00ffff', size: 45, name: 'candy' },
  { color: '#ff00ff', size: 38, name: 'bell' },
];

export class ChristmasGiftEngineClass implements ChristmasGiftEngine {
  private state: GameState;
  private canvasWidth: number = 800;
  private canvasHeight: number = 600;
  private giftIdCounter: number = 0;
  private spawnTimer: number = 0;
  private spawnInterval: number = 1500;

  constructor() {
    this.state = {
      score: 0,
      lives: 3,
      gifts: [],
      gameOver: false,
      level: 1,
      combo: 0,
    };
  }

  initialize(): void {
    this.state = {
      score: 0,
      lives: 3,
      gifts: [],
      gameOver: false,
      level: 1,
      combo: 0,
    };
    this.spawnInterval = 1500;
  }

  spawnGift(): void {
    const type = GIFT_TYPES[Math.floor(Math.random() * GIFT_TYPES.length)];
    const gift: Gift = {
      id: this.giftIdCounter++,
      x: Math.random() * (this.canvasWidth - type.size),
      y: -type.size,
      color: type.color,
      size: type.size,
      speed: 2 + this.state.level * 0.5 + Math.random() * 2,
      type: type.name,
    };
    
    this.state.gifts.push(gift);
  }

  update(): void {
    if (this.state.gameOver) return;

    this.state.gifts.forEach(gift => {
      gift.y += gift.speed;
    });

    this.state.gifts = this.state.gifts.filter(gift => {
      if (gift.y > this.canvasHeight) {
        this.state.lives--;
        this.state.combo = 0;
        if (this.state.lives <= 0) {
          this.state.gameOver = true;
        }
        return false;
      }
      return true;
    });

    this.spawnTimer++;
    if (this.spawnTimer >= 60) {
      this.spawnTimer = 0;
      this.spawnGift();
    }

    if (this.state.score >= this.state.level * 1000) {
      this.state.level++;
      this.spawnInterval = Math.max(500, this.spawnInterval - 200);
    }
  }

  catchGift(id: number): boolean {
    const index = this.state.gifts.findIndex(g => g.id === id);
    if (index !== -1) {
      this.state.gifts.splice(index, 1);
      this.state.score += 100 + this.state.combo * 10;
      this.state.combo++;
      return true;
    }
    return false;
  }

  reset(): void {
    this.initialize();
  }

  getState(): GameState {
    return { ...this.state };
  }
}

export const ChristmasGiftEngine = ChristmasGiftEngineClass;
