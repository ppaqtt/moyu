import { NEON_COLORS } from '../../utils/constants';

// Types
export interface Plant {
  id: string;
  type: PlantType;
  gridX: number;
  gridY: number;
  growthStage: number; // 0-4
  growthProgress: number; // 0-100
  waterLevel: number; // 0-100
  health: number; // 0-100
  plantedAt: number;
}

export interface PlantType {
  id: string;
  name: string;
  emoji: string;
  color: string;
  seedPrice: number;
  sellPrice: number;
  harvestCount: number;
  growthTime: number; // seconds
  waterNeed: number; // water consumed per tick
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Seed {
  id: string;
  type: PlantType;
  quantity: number;
}

export interface GardenGardenState {
  coins: number;
  seeds: Seed[];
  plants: Plant[];
  gridSize: number;
  waterLevel: number;
  maxWater: number;
  gameStarted: boolean;
  lastUpdate: number;
  highScore: number;
  totalHarvested: number;
  unlockedTypes: string[];
}

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description: string;
}

// Constants
export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 500;

export const PLANT_TYPES: PlantType[] = [
  { id: 'sunflower', name: '向日葵', emoji: '🌻', color: '#ffd700', seedPrice: 10, sellPrice: 25, harvestCount: 1, growthTime: 20, waterNeed: 2, rarity: 'common' },
  { id: 'tulip', name: '郁金香', emoji: '🌷', color: '#ff69b4', seedPrice: 15, sellPrice: 40, harvestCount: 1, growthTime: 30, waterNeed: 3, rarity: 'common' },
  { id: 'rose', name: '玫瑰', emoji: '🌹', color: '#ff0000', seedPrice: 30, sellPrice: 80, harvestCount: 1, growthTime: 45, waterNeed: 3, rarity: 'rare' },
  { id: 'lavender', name: '薰衣草', emoji: '💜', color: '#9370db', seedPrice: 50, sellPrice: 120, harvestCount: 1, growthTime: 60, waterNeed: 2, rarity: 'rare' },
  { id: 'lotus', name: '莲花', emoji: '🪷', color: '#ffb6c1', seedPrice: 100, sellPrice: 250, harvestCount: 2, growthTime: 90, waterNeed: 4, rarity: 'epic' },
  { id: 'orchid', name: '兰花', emoji: '🪻', color: '#da70d6', seedPrice: 200, sellPrice: 500, harvestCount: 2, growthTime: 120, waterNeed: 3, rarity: 'epic' },
  { id: 'bonsai', name: '盆景树', emoji: '🌳', color: '#228b22', seedPrice: 500, sellPrice: 1500, harvestCount: 3, growthTime: 180, waterNeed: 2, rarity: 'legendary' },
  { id: 'crystal_flower', name: '水晶花', emoji: '💎', color: '#00ffff', seedPrice: 1000, sellPrice: 3000, harvestCount: 5, growthTime: 240, waterNeed: 5, rarity: 'legendary' },
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'water_tank', name: '扩大水箱', emoji: '🛢️', price: 100, description: '增加水箱容量 +50' },
  { id: 'fertilizer', name: '化肥', emoji: '🧪', price: 30, description: '加速所有植物生长 +50% (一次)' },
  { id: 'pesticide', name: '杀虫剂', emoji: '🔫', price: 50, description: '治愈所有枯萎的植物' },
  { id: 'golden_water', name: '金色泉水', emoji: '✨', price: 200, description: '本次收获 x2 金币' },
];

const GRID_COLS = 5;
const GRID_ROWS = 5;
const TICK_INTERVAL = 1000;
const WATER_REFILL_COST = 10;
const WATER_REFILL_AMOUNT = 30;
const GROWTH_BONUS_FERTILIZER = 1.5;

export class GardenGardenEngine {
  private coins: number;
  private seeds: Seed[];
  private plants: Plant[];
  private gridSize: number;
  private waterLevel: number;
  private maxWater: number;
  private gameStarted: boolean;
  private lastUpdate: number;
  private highScore: number;
  private totalHarvested: number;
  private unlockedTypes: string[];
  private fertilizerActive: boolean;
  private goldenWaterActive: boolean;

  constructor() {
    this.reset();
  }

  getState(): GardenGardenState {
    return {
      coins: this.coins,
      seeds: this.seeds.map(s => ({ ...s, type: { ...s.type } })),
      plants: this.plants.map(p => ({ ...p, type: { ...p.type } })),
      gridSize: this.gridSize,
      waterLevel: this.waterLevel,
      maxWater: this.maxWater,
      gameStarted: this.gameStarted,
      lastUpdate: this.lastUpdate,
      highScore: this.highScore,
      totalHarvested: this.totalHarvested,
      unlockedTypes: [...this.unlockedTypes],
    };
  }

  start(): void {
    this.gameStarted = true;
    this.lastUpdate = Date.now();
    // Give starter seeds
    if (this.seeds.length === 0) {
      this.addSeed(PLANT_TYPES[0], 3);
    }
  }

  addSeed(type: PlantType, quantity: number): void {
    const existing = this.seeds.find(s => s.type.id === type.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.seeds.push({ id: `seed_${type.id}_${Date.now()}`, type, quantity });
    }
  }

  buySeeds(typeId: string, quantity: number): boolean {
    if (!this.gameStarted) return false;

    const plantType = PLANT_TYPES.find(p => p.id === typeId);
    if (!plantType) return false;
    if (!this.unlockedTypes.includes(typeId)) return false;

    const totalPrice = plantType.seedPrice * quantity;
    if (this.coins < totalPrice) return false;

    this.coins -= totalPrice;
    this.addSeed(plantType, quantity);
    return true;
  }

  plantSeed(gridX: number, gridY: number, seedId: string): boolean {
    if (!this.gameStarted) return false;
    if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) return false;

    // Check if cell is occupied
    const occupied = this.plants.some(p => p.gridX === gridX && p.gridY === gridY);
    if (occupied) return false;

    // Find and remove seed
    const seedIndex = this.seeds.findIndex(s => s.id === seedId);
    if (seedIndex === -1) return false;

    const seed = this.seeds[seedIndex];
    if (seed.quantity <= 0) return false;

    seed.quantity--;
    if (seed.quantity <= 0) {
      this.seeds.splice(seedIndex, 1);
    }

    // Create plant
    const plant: Plant = {
      id: `plant_${Date.now()}_${Math.random()}`,
      type: seed.type,
      gridX,
      gridY,
      growthStage: 0,
      growthProgress: 0,
      waterLevel: 100,
      health: 100,
      plantedAt: Date.now(),
    };

    this.plants.push(plant);
    return true;
  }

  waterPlant(plantId: string, amount: number = 20): boolean {
    if (!this.gameStarted) return false;
    if (this.waterLevel < amount) return false;

    const plant = this.plants.find(p => p.id === plantId);
    if (!plant) return false;

    this.waterLevel -= amount;
    plant.waterLevel = Math.min(100, plant.waterLevel + amount);
    return true;
  }

  waterAll(): boolean {
    if (!this.gameStarted) return false;
    if (this.waterLevel <= 0) return false;

    this.plants.forEach(plant => {
      if (plant.waterLevel < 80) {
        const amount = Math.min(this.waterLevel / this.plants.length, 20);
        plant.waterLevel = Math.min(100, plant.waterLevel + amount);
        this.waterLevel -= amount;
      }
    });
    return true;
  }

  private tick(): void {
    const now = Date.now();
    const deltaSeconds = (now - this.lastUpdate) / 1000;

    if (deltaSeconds < 1) return;
    this.lastUpdate = now;

    const growthMultiplier = this.fertilizerActive ? GROWTH_BONUS_FERTILIZER : 1;

    this.plants.forEach(plant => {
      // Water consumption
      plant.waterLevel = Math.max(0, plant.waterLevel - plant.type.waterNeed * deltaSeconds * 0.1);

      // Health based on water
      if (plant.waterLevel < 20) {
        plant.health = Math.max(0, plant.health - 0.5 * deltaSeconds);
      } else if (plant.waterLevel > 50) {
        plant.health = Math.min(100, plant.health + 0.2 * deltaSeconds);
      }

      // Growth (only if healthy and has water)
      if (plant.health > 30 && plant.waterLevel > 20) {
        const growthPerSecond = 100 / (plant.type.growthTime * growthMultiplier);
        plant.growthProgress += growthPerSecond * deltaSeconds;

        if (plant.growthProgress >= 100) {
          plant.growthStage = Math.min(4, plant.growthStage + 1);
          plant.growthProgress = 0;
        }
      }
    });

    // Clear dead plants
    this.plants = this.plants.filter(p => p.health > 0);

    // Deactivate fertilizer after time
    if (this.fertilizerActive) {
      // Fertilizer lasts for 60 seconds
      // This is handled by resetting after use
    }
  }

  harvestPlant(plantId: string): boolean {
    if (!this.gameStarted) return false;

    const plantIndex = this.plants.findIndex(p => p.id === plantId);
    if (plantIndex === -1) return false;

    const plant = this.plants[plantIndex];
    if (plant.growthStage < 4) return false;

    const multiplier = this.goldenWaterActive ? 2 : 1;
    const earnings = plant.type.sellPrice * plant.type.harvestCount * multiplier;

    this.coins += earnings;
    this.totalHarvested++;
    this.highScore = Math.max(this.highScore, this.totalHarvested);

    // Remove plant
    this.plants.splice(plantIndex, 1);

    // Chance to get seeds back
    if (Math.random() < 0.3) {
      this.addSeed(plant.type, 1);
    }

    return true;
  }

  harvestAll(): boolean {
    if (!this.gameStarted) return false;

    const readyPlants = this.plants.filter(p => p.growthStage >= 4);
    if (readyPlants.length === 0) return false;

    readyPlants.forEach(p => this.harvestPlant(p.id));
    return true;
  }

  refillWater(): boolean {
    if (!this.gameStarted) return false;
    if (this.waterLevel >= this.maxWater) return false;
    if (this.coins < WATER_REFILL_COST) return false;

    this.coins -= WATER_REFILL_COST;
    this.waterLevel = Math.min(this.maxWater, this.waterLevel + WATER_REFILL_AMOUNT);
    return true;
  }

  buyShopItem(itemId: string): boolean {
    if (!this.gameStarted) return false;

    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return false;
    if (this.coins < item.price) return false;

    this.coins -= item.price;

    switch (itemId) {
      case 'water_tank':
        this.maxWater += 50;
        break;
      case 'fertilizer':
        this.fertilizerActive = true;
        break;
      case 'pesticide':
        this.plants.forEach(p => {
          if (p.health < 50) {
            p.health = 50;
          }
        });
        break;
      case 'golden_water':
        this.goldenWaterActive = true;
        break;
    }

    return true;
  }

  unlockPlantType(typeId: string): boolean {
    if (!this.gameStarted) return false;
    if (this.unlockedTypes.includes(typeId)) return false;

    const plantType = PLANT_TYPES.find(p => p.id === typeId);
    if (!plantType) return false;

    // Unlock cost is 5x seed price
    const unlockCost = plantType.seedPrice * 5;
    if (this.coins < unlockCost) return false;

    this.coins -= unlockCost;
    this.unlockedTypes.push(typeId);
    return true;
  }

  getPlantEmoji(plant: Plant): string {
    if (plant.health <= 0) return '💀';
    if (plant.health < 30) return plant.type.emoji + '😢';

    const stages = ['🌱', '🌿', '🌾', '🌺', plant.type.emoji];
    return stages[plant.growthStage] || stages[0];
  }

  getGridCellSize() {
    const padding = 40;
    const gap = 5;
    const cellSize = (CANVAS_WIDTH - padding * 2 - gap * (GRID_COLS - 1)) / GRID_COLS;
    return cellSize;
  }

  getGridOffset() {
    return 40;
  }

  getPlantAtCell(gridX: number, gridY: number): Plant | undefined {
    return this.plants.find(p => p.gridX === gridX && p.gridY === gridY);
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getPlantTypes() {
    return PLANT_TYPES;
  }

  getSeeds() {
    return this.seeds;
  }

  getShopItems() {
    return SHOP_ITEMS;
  }

  isFertilizerActive() {
    return this.fertilizerActive;
  }

  isGoldenWaterActive() {
    return this.goldenWaterActive;
  }

  reset(): void {
    this.coins = 100;
    this.seeds = [];
    this.plants = [];
    this.gridSize = GRID_COLS;
    this.waterLevel = 100;
    this.maxWater = 100;
    this.gameStarted = false;
    this.lastUpdate = Date.now();
    this.highScore = 0;
    this.totalHarvested = 0;
    this.unlockedTypes = ['sunflower', 'tulip']; // Start with common seeds
    this.fertilizerActive = false;
    this.goldenWaterActive = false;
  }

  save(): string {
    return JSON.stringify(this.getState());
  }

  load(json: string): boolean {
    try {
      const state = JSON.parse(json) as GardenGardenState;
      this.coins = state.coins;
      this.seeds = state.seeds;
      this.plants = state.plants;
      this.gridSize = state.gridSize;
      this.waterLevel = state.waterLevel;
      this.maxWater = state.maxWater;
      this.gameStarted = state.gameStarted;
      this.highScore = state.highScore;
      this.totalHarvested = state.totalHarvested;
      this.unlockedTypes = state.unlockedTypes;
      return true;
    } catch {
      return false;
    }
  }
}
