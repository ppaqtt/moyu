import { NEON_COLORS } from '../../utils/constants';

// Types
export interface PetState {
  name: string;
  hunger: number;      // 0-100, 100 = full
  happiness: number;    // 0-100
  cleanliness: number; // 0-100
  energy: number;      // 0-100
  age: number;          // in game ticks
  level: number;
  experience: number;
}

export interface VirtualPetState {
  pet: PetState;
  coins: number;
  inventory: InventoryItem[];
  upgrades: Upgrade[];
  gameStarted: boolean;
  gameOver: boolean;
  lastUpdate: number;
  highScore: number;
  totalClicks: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  emoji: string;
  type: 'food' | 'toy' | 'cleaning';
  effect: number;
  quantity: number;
  price: number;
}

export interface Upgrade {
  id: string;
  name: string;
  emoji: string;
  level: number;
  maxLevel: number;
  effect: number;
  price: number;
  description: string;
}

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  hungerRestore: number;
  happinessBoost: number;
  price: number;
}

export interface ToyItem {
  id: string;
  name: string;
  emoji: string;
  happinessBoost: number;
  energyCost: number;
  price: number;
}

// Constants
export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 600;

export const FOODS: FoodItem[] = [
  { id: 'apple', name: '苹果', emoji: '🍎', hungerRestore: 15, happinessBoost: 5, price: 5 },
  { id: 'pizza', name: '披萨', emoji: '🍕', hungerRestore: 30, happinessBoost: 10, price: 15 },
  { id: 'cake', name: '蛋糕', emoji: '🎂', hungerRestore: 25, happinessBoost: 20, price: 25 },
  { id: 'sushi', name: '寿司', emoji: '🍣', hungerRestore: 40, happinessBoost: 15, price: 40 },
];

export const TOYS: ToyItem[] = [
  { id: 'ball', name: '皮球', emoji: '⚽', happinessBoost: 15, energyCost: 10, price: 20 },
  { id: 'teddy', name: '泰迪熊', emoji: '🧸', happinessBoost: 25, energyCost: 5, price: 50 },
  { id: 'kite', name: '风筝', emoji: '🪁', happinessBoost: 30, energyCost: 15, price: 80 },
];

export const CLEANING_ITEMS: InventoryItem[] = [
  { id: 'soap', name: '香皂', emoji: '🧼', type: 'cleaning', effect: 20, quantity: 0, price: 10 },
  { id: 'shampoo', name: '洗发水', emoji: '🧴', type: 'cleaning', effect: 35, quantity: 0, price: 25 },
  { id: 'bathtub', name: '浴缸', emoji: '🛁', type: 'cleaning', effect: 50, quantity: 0, price: 60 },
];

export const UPGRADES: Upgrade[] = [
  { id: 'bed', name: '舒适床铺', emoji: '🛏️', level: 0, maxLevel: 5, effect: 2, price: 100, description: '提升能量恢复速度' },
  { id: 'food_bowl', name: '自动喂食器', emoji: '🍽️', level: 0, maxLevel: 5, effect: 3, price: 150, description: '减缓饥饿下降' },
  { id: 'toys_chest', name: '玩具箱', emoji: '🎁', level: 0, maxLevel: 5, effect: 5, price: 200, description: '增加玩具效果' },
  { id: 'bathroom', name: '豪华浴室', emoji: '🚿', level: 0, maxLevel: 5, effect: 5, price: 250, description: '提升清洁效果' },
];

const TICK_INTERVAL = 1000; // 1 second
const HUNGER_DECAY = 2;
const HAPPINESS_DECAY = 1;
const CLEANLINESS_DECAY = 1.5;
const ENERGY_DECAY = 0.5;
const MAX_STAT = 100;
const MIN_STAT = 0;
const CRITICAL_THRESHOLD = 20;
const GAME_OVER_THRESHOLD = 0;

export class VirtualPetEngine {
  private pet: PetState;
  private coins: number;
  private inventory: InventoryItem[];
  private upgrades: Upgrade[];
  private gameStarted: boolean;
  private gameOver: boolean;
  private lastUpdate: number;
  private highScore: number;
  private totalClicks: number;
  private gameStartTime: number;

  constructor() {
    this.reset();
  }

  getState(): VirtualPetState {
    return {
      pet: { ...this.pet },
      coins: this.coins,
      inventory: this.inventory.map(item => ({ ...item })),
      upgrades: this.upgrades.map(u => ({ ...u })),
      gameStarted: this.gameStarted,
      gameOver: this.gameOver,
      lastUpdate: this.lastUpdate,
      highScore: this.highScore,
      totalClicks: this.totalClicks,
    };
  }

  start(): void {
    this.gameStarted = true;
    this.gameStartTime = Date.now();
    this.lastUpdate = Date.now();
  }

  feed(foodId: string): boolean {
    if (!this.gameStarted || this.gameOver) return false;

    const food = FOODS.find(f => f.id === foodId);
    if (!food) return false;

    // Check if we have coins to buy food
    if (this.coins < food.price) return false;

    this.coins -= food.price;
    this.pet.hunger = Math.min(MAX_STAT, this.pet.hunger + food.hungerRestore);
    this.pet.happiness = Math.min(MAX_STAT, this.pet.happiness + food.happinessBoost);
    this.addExperience(5);
    this.totalClicks++;

    return true;
  }

  play(toyId: string): boolean {
    if (!this.gameStarted || this.gameOver) return false;

    const toy = TOYS.find(t => t.id === toyId);
    if (!toy) return false;

    if (this.coins < toy.price) return false;
    if (this.pet.energy < toy.energyCost) return false;

    const toyChestLevel = this.upgrades.find(u => u.id === 'toys_chest')?.level || 0;
    const bonusEffect = toyChestLevel * 2;

    this.coins -= toy.price;
    this.pet.energy = Math.max(MIN_STAT, this.pet.energy - toy.energyCost);
    this.pet.happiness = Math.min(MAX_STAT, this.pet.happiness + toy.happinessBoost + bonusEffect);
    this.addExperience(10);
    this.totalClicks++;

    return true;
  }

  clean(itemId: string): boolean {
    if (!this.gameStarted || this.gameOver) return false;

    const cleaningItem = CLEANING_ITEMS.find(c => c.id === itemId);
    if (!cleaningItem) return false;

    if (this.coins < cleaningItem.price) return false;

    const bathroomLevel = this.upgrades.find(u => u.id === 'bathroom')?.level || 0;
    const bonusEffect = bathroomLevel * 3;

    this.coins -= cleaningItem.price;
    this.pet.cleanliness = Math.min(MAX_STAT, this.pet.cleanliness + cleaningItem.effect + bonusEffect);
    this.addExperience(3);
    this.totalClicks++;

    return true;
  }

  buyUpgrade(upgradeId: string): boolean {
    if (!this.gameStarted || this.gameOver) return false;

    const upgrade = this.upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return false;
    if (upgrade.level >= upgrade.maxLevel) return false;
    if (this.coins < upgrade.price) return false;

    this.coins -= upgrade.price;
    upgrade.level++;
    upgrade.price = Math.floor(upgrade.price * 1.5);
    upgrade.effect += upgrade.level;
    this.addExperience(20);
    this.totalClicks++;

    return true;
  }

  rest(): boolean {
    if (!this.gameStarted || this.gameOver) return false;
    if (this.pet.energy >= MAX_STAT) return false;

    const bedLevel = this.upgrades.find(u => u.id === 'bed')?.level || 0;
    const bonusEffect = bedLevel * 3;

    this.pet.energy = Math.min(MAX_STAT, this.pet.energy + 15 + bonusEffect);
    this.pet.happiness = Math.min(MAX_STAT, this.pet.happiness + 3);
    this.addExperience(2);
    this.totalClicks++;

    return true;
  }

  private addExperience(amount: number): void {
    this.pet.experience += amount;
    const expNeeded = this.pet.level * 100;

    if (this.pet.experience >= expNeeded) {
      this.pet.level++;
      this.pet.experience -= expNeeded;
      this.coins += this.pet.level * 50;
    }
  }

  private tick(): void {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / TICK_INTERVAL;

    if (deltaTime < 1) return;

    this.lastUpdate = now;
    this.pet.age++;

    // Get upgrade effects
    const foodBowlLevel = this.upgrades.find(u => u.id === 'food_bowl')?.level || 0;
    const hungerDecayMod = 1 - (foodBowlLevel * 0.1);

    // Decay stats
    this.pet.hunger = Math.max(MIN_STAT, this.pet.hunger - HUNGER_DECAY * hungerDecayMod * deltaTime);
    this.pet.happiness = Math.max(MIN_STAT, this.pet.happiness - HAPPINESS_DECAY * deltaTime);
    this.pet.cleanliness = Math.max(MIN_STAT, this.pet.cleanliness - CLEANLINESS_DECAY * deltaTime);
    this.pet.energy = Math.max(MIN_STAT, this.pet.energy - ENERGY_DECAY * deltaTime);

    // Passive coin generation based on happiness
    if (this.pet.happiness > 50) {
      this.coins += Math.floor((this.pet.happiness - 50) / 25);
    }

    // Check for game over
    if (this.pet.hunger <= GAME_OVER_THRESHOLD ||
        this.pet.happiness <= GAME_OVER_THRESHOLD ||
        this.pet.cleanliness <= GAME_OVER_THRESHOLD ||
        this.pet.energy <= GAME_OVER_THRESHOLD) {
      this.gameOver = true;
      if (this.pet.level > this.highScore) {
        this.highScore = this.pet.level;
      }
    }
  }

  getPetMood(): 'happy' | 'neutral' | 'sad' | 'critical' {
    const avgStat = (this.pet.hunger + this.pet.happiness + this.pet.cleanliness + this.pet.energy) / 4;

    if (avgStat > 70) return 'happy';
    if (avgStat > 40) return 'neutral';
    if (avgStat > CRITICAL_THRESHOLD) return 'sad';
    return 'critical';
  }

  getPetEmoji(): string {
    const mood = this.getPetMood();
    switch (mood) {
      case 'happy': return '🐱';
      case 'neutral': return '🐱';
      case 'sad': return '😿';
      case 'critical': return '😾';
      default: return '🐱';
    }
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getFoods() {
    return FOODS;
  }

  getToys() {
    return TOYS;
  }

  getCleaningItems() {
    return CLEANING_ITEMS;
  }

  reset(): void {
    this.pet = {
      name: '小猫咪',
      hunger: 80,
      happiness: 80,
      cleanliness: 80,
      energy: 80,
      age: 0,
      level: 1,
      experience: 0,
    };
    this.coins = 50;
    this.inventory = [];
    this.upgrades = UPGRADES.map(u => ({ ...u, level: 0, price: u.price }));
    this.gameStarted = false;
    this.gameOver = false;
    this.lastUpdate = Date.now();
    this.highScore = 1;
    this.totalClicks = 0;
    this.gameStartTime = 0;
  }

  // Save/Load
  save(): string {
    return JSON.stringify(this.getState());
  }

  load(json: string): boolean {
    try {
      const state = JSON.parse(json) as VirtualPetState;
      this.pet = state.pet;
      this.coins = state.coins;
      this.inventory = state.inventory;
      this.upgrades = state.upgrades;
      this.gameStarted = state.gameStarted;
      this.gameOver = state.gameOver;
      this.lastUpdate = Date.now();
      this.highScore = state.highScore;
      this.totalClicks = state.totalClicks;
      return true;
    } catch {
      return false;
    }
  }
}
