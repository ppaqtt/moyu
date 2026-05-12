import { NEON_COLORS } from '../../utils/constants';

// Types
export interface Fish {
  id: string;
  type: FishType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  emoji: string;
  price: number;
  sellPrice: number;
  mood: number;
  age: number;
}

export interface FishType {
  id: string;
  name: string;
  emoji: string;
  color: string;
  basePrice: number;
  sellPrice: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  growthTime: number;
  minCoins: number;
  maxCoins: number;
}

export interface Decoration {
  id: string;
  name: string;
  emoji: string;
  price: number;
  effect: 'beautify' | 'happiness' | 'coins';
  value: number;
  x: number;
  y: number;
}

export interface FishTankState {
  coins: number;
  fishes: Fish[];
  decorations: Decoration[];
  tankSize: number;
  fishTypes: FishType[];
  gameStarted: boolean;
  lastUpdate: number;
  highScore: number;
  totalEarned: number;
}

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description: string;
}

// Constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const FISH_TYPES: FishType[] = [
  { id: 'goldfish', name: '金鱼', emoji: '🐟', color: '#ffd700', basePrice: 20, sellPrice: 10, rarity: 'common', growthTime: 30, minCoins: 5, maxCoins: 15 },
  { id: 'angel', name: '天使鱼', emoji: '🐠', color: '#87ceeb', basePrice: 50, sellPrice: 25, rarity: 'common', growthTime: 60, minCoins: 10, maxCoins: 30 },
  { id: 'clownfish', name: '小丑鱼', emoji: '🐡', color: '#ff6347', basePrice: 80, sellPrice: 40, rarity: 'rare', growthTime: 90, minCoins: 20, maxCoins: 50 },
  { id: 'turtle', name: '海龟', emoji: '🐢', color: '#2ecc71', basePrice: 150, sellPrice: 75, rarity: 'rare', growthTime: 120, minCoins: 30, maxCoins: 80 },
  { id: 'jellyfish', name: '水母', emoji: '🪼', color: '#e056fd', basePrice: 300, sellPrice: 150, rarity: 'epic', growthTime: 180, minCoins: 50, maxCoins: 150 },
  { id: 'dolphin', name: '海豚', emoji: '🐬', color: '#74b9ff', basePrice: 500, sellPrice: 250, rarity: 'epic', growthTime: 240, minCoins: 100, maxCoins: 300 },
  { id: 'whale', name: '鲸鱼', emoji: '🐋', color: '#535c68', basePrice: 1000, sellPrice: 500, rarity: 'legendary', growthTime: 300, minCoins: 200, maxCoins: 600 },
  { id: 'dragon', name: '龙鱼', emoji: '🐉', color: '#ff4757', basePrice: 2000, sellPrice: 1000, rarity: 'legendary', growthTime: 400, minCoins: 400, maxCoins: 1200 },
];

export const DECORATIONS: Decoration[] = [
  { id: 'seaweed', name: '海草', emoji: '🌿', price: 30, effect: 'beautify', value: 1, x: 0, y: 0 },
  { id: 'coral', name: '珊瑚', emoji: '🪸', price: 50, effect: 'beautify', value: 2, x: 0, y: 0 },
  { id: 'shell', name: '贝壳', emoji: '🐚', price: 40, effect: 'coins', value: 5, x: 0, y: 0 },
  { id: 'treasure', name: '宝箱', emoji: '📦', price: 200, effect: 'coins', value: 20, x: 0, y: 0 },
  { id: 'castle', name: '城堡', emoji: '🏰', price: 500, effect: 'happiness', value: 10, x: 0, y: 0 },
  { id: 'lighthouse', name: '灯塔', emoji: '🗼', price: 300, effect: 'beautify', value: 3, x: 0, y: 0 },
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'tank_upgrade', name: '扩大鱼缸', emoji: '🔧', price: 200, description: '增加鱼缸容量 +2' },
  { id: 'cleaning', name: '换水清洁', emoji: '💧', price: 50, description: '增加所有鱼的开心值 +20' },
  { id: 'premium_food', name: '高级鱼食', emoji: '🍪', price: 100, description: '所有鱼产出金币 x1.5 (一次)' },
  { id: 'lucky_charm', name: '幸运符', emoji: '🍀', price: 150, description: '下一次购买可能触发折扣' },
];

const TICK_INTERVAL = 100;
const FISH_SPEED = 0.5;
const COIN_GENERATION_INTERVAL = 5000;
const MAX_TANK_SIZE = 20;

export class FishTankEngine {
  private coins: number;
  private fishes: Fish[];
  private decorations: Decoration[];
  private tankSize: number;
  private fishTypes: FishType[];
  private gameStarted: boolean;
  private lastUpdate: number;
  private highScore: number;
  private totalEarned: number;
  private lastCoinGeneration: number;
  private coinMultiplier: number;

  constructor() {
    this.reset();
  }

  getState(): FishTankState {
    return {
      coins: this.coins,
      fishes: this.fishes.map(f => ({ ...f })),
      decorations: this.decorations.map(d => ({ ...d })),
      tankSize: this.tankSize,
      fishTypes: this.fishTypes,
      gameStarted: this.gameStarted,
      lastUpdate: this.lastUpdate,
      highScore: this.highScore,
      totalEarned: this.totalEarned,
    };
  }

  start(): void {
    this.gameStarted = true;
    this.lastUpdate = Date.now();
    this.lastCoinGeneration = Date.now();
  }

  buyFish(fishTypeId: string): boolean {
    if (!this.gameStarted) return false;

    const fishType = FISH_TYPES.find(f => f.id === fishTypeId);
    if (!fishType) return false;

    if (this.fishes.length >= this.tankSize) return false;
    if (this.coins < fishType.basePrice) return false;

    this.coins -= fishType.basePrice;

    const newFish: Fish = {
      id: `fish_${Date.now()}_${Math.random()}`,
      type: fishType,
      x: Math.random() * (CANVAS_WIDTH - 60) + 30,
      y: Math.random() * (CANVAS_HEIGHT - 80) + 40,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: 1,
      color: fishType.color,
      emoji: fishType.emoji,
      price: fishType.basePrice,
      sellPrice: fishType.sellPrice,
      mood: 100,
      age: 0,
    };

    this.fishes.push(newFish);
    return true;
  }

  sellFish(fishId: string): boolean {
    if (!this.gameStarted) return false;

    const fishIndex = this.fishes.findIndex(f => f.id === fishId);
    if (fishIndex === -1) return false;

    const fish = this.fishes[fishIndex];
    this.coins += fish.sellPrice;
    this.totalEarned += fish.sellPrice;
    this.fishes.splice(fishIndex, 1);
    return true;
  }

  buyDecoration(decorationId: string, x: number, y: number): boolean {
    if (!this.gameStarted) return false;

    const decorTemplate = DECORATIONS.find(d => d.id === decorationId);
    if (!decorTemplate) return false;

    if (this.coins < decorTemplate.price) return false;

    this.coins -= decorTemplate.price;

    const decoration: Decoration = {
      ...decorTemplate,
      id: `decor_${Date.now()}_${Math.random()}`,
      x: Math.max(0, Math.min(x, CANVAS_WIDTH - 40)),
      y: Math.max(0, Math.min(y, CANVAS_HEIGHT - 40)),
    };

    this.decorations.push(decoration);
    return true;
  }

  buyTankUpgrade(): boolean {
    if (!this.gameStarted) return false;
    if (this.tankSize >= MAX_TANK_SIZE) return false;

    const price = 200 + (this.tankSize - 5) * 50;
    if (this.coins < price) return false;

    this.coins -= price;
    this.tankSize += 2;
    return true;
  }

  buyCleaning(): boolean {
    if (!this.gameStarted) return false;
    if (this.coins < 50) return false;

    this.coins -= 50;
    this.fishes.forEach(f => {
      f.mood = Math.min(100, f.mood + 20);
    });
    return true;
  }

  buyPremiumFood(): boolean {
    if (!this.gameStarted) return false;
    if (this.coins < 100) return false;

    this.coins -= 100;
    this.coinMultiplier = 1.5;
    return true;
  }

  private tick(): void {
    const now = Date.now();
    this.lastUpdate = now;

    // Update fish positions
    this.fishes.forEach(fish => {
      // Random direction change
      if (Math.random() < 0.02) {
        fish.vx = (Math.random() - 0.5) * 2;
        fish.vy = (Math.random() - 0.5) * 2;
      }

      // Move fish
      fish.x += fish.vx * FISH_SPEED;
      fish.y += fish.vy * FISH_SPEED;

      // Boundary check
      if (fish.x < 20 || fish.x > CANVAS_WIDTH - 20) {
        fish.vx = -fish.vx;
        fish.x = Math.max(20, Math.min(CANVAS_WIDTH - 20, fish.x));
      }
      if (fish.y < 30 || fish.y > CANVAS_HEIGHT - 30) {
        fish.vy = -fish.vy;
        fish.y = Math.max(30, Math.min(CANVAS_HEIGHT - 30, fish.y));
      }

      // Age and grow
      fish.age++;
      if (fish.age % 100 === 0 && fish.size < 2) {
        fish.size += 0.1;
      }

      // Mood decay
      fish.mood = Math.max(0, fish.mood - 0.01);

      // Decorations boost mood
      this.decorations.forEach(d => {
        if (d.effect === 'happiness') {
          const dist = Math.sqrt((fish.x - d.x) ** 2 + (fish.y - d.y) ** 2);
          if (dist < 100) {
            fish.mood = Math.min(100, fish.mood + 0.05);
          }
        }
      });
    });

    // Generate coins
    if (now - this.lastCoinGeneration > COIN_GENERATION_INTERVAL) {
      this.lastCoinGeneration = now;
      const multiplier = this.coinMultiplier > 1 ? this.coinMultiplier : 1;
      this.coinMultiplier = 1;

      this.fishes.forEach(fish => {
        const moodBonus = fish.mood / 100;
        const baseEarnings = fish.type.minCoins + Math.random() * (fish.type.maxCoins - fish.type.minCoins);
        const earnings = Math.floor(baseEarnings * moodBonus * multiplier * fish.size);
        this.coins += earnings;
        this.totalEarned += earnings;
      });

      if (this.totalEarned > this.highScore) {
        this.highScore = this.totalEarned;
      }
    }
  }

  getFishCount(): number {
    return this.fishes.length;
  }

  getTankCapacity(): number {
    return this.tankSize;
  }

  getFishes(): Fish[] {
    return this.fishes;
  }

  getDecorations(): Decoration[] {
    return this.decorations;
  }

  getFishTypes(): FishType[] {
    return FISH_TYPES;
  }

  getDecorationTypes(): Decoration[] {
    return DECORATIONS;
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getUpgradePrice(): number {
    return 200 + (this.tankSize - 5) * 50;
  }

  reset(): void {
    this.coins = 100;
    this.fishes = [];
    this.decorations = [];
    this.tankSize = 5;
    this.fishTypes = [...FISH_TYPES];
    this.gameStarted = false;
    this.lastUpdate = Date.now();
    this.highScore = 0;
    this.totalEarned = 0;
    this.lastCoinGeneration = Date.now();
    this.coinMultiplier = 1;
  }

  save(): string {
    return JSON.stringify(this.getState());
  }

  load(json: string): boolean {
    try {
      const state = JSON.parse(json) as FishTankState;
      this.coins = state.coins;
      this.fishes = state.fishes;
      this.decorations = state.decorations;
      this.tankSize = state.tankSize;
      this.gameStarted = state.gameStarted;
      this.highScore = state.highScore;
      this.totalEarned = state.totalEarned;
      this.lastUpdate = Date.now();
      return true;
    } catch {
      return false;
    }
  }
}
