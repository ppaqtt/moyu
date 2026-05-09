export type CropType = 'wheat' | 'carrot' | 'tomato' | 'corn';

export type GrowthStage = 'empty' | 'seed' | 'sprout' | 'mature';

export interface Cell {
  x: number;
  y: number;
  crop: CropType | null;
  stage: GrowthStage;
  plantedAt: number;
  wateredAt: number;
  isWatered: boolean;
}

export interface HappyFarmState {
  grid: Cell[][];
  gold: number;
  seeds: Record<CropType, number>;
  harvestCount: number;
  isGameOver: boolean;
}

export interface CropConfig {
  name: string;
  seedPrice: number;
  sellPrice: number;
  growTime: number;
  color: string;
  icon: string;
}

const GRID_COLS = 8;
const GRID_ROWS = 7;
const CELL_SIZE = 60;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const CROP_CONFIG: Record<CropType, CropConfig> = {
  wheat: {
    name: '小麦',
    seedPrice: 10,
    sellPrice: 25,
    growTime: 5000,
    color: '#f4d03f',
    icon: '🌾'
  },
  carrot: {
    name: '胡萝卜',
    seedPrice: 15,
    sellPrice: 40,
    growTime: 7000,
    color: '#e67e22',
    icon: '🥕'
  },
  tomato: {
    name: '番茄',
    seedPrice: 20,
    sellPrice: 55,
    growTime: 9000,
    color: '#e74c3c',
    icon: '🍅'
  },
  corn: {
    name: '玉米',
    seedPrice: 25,
    sellPrice: 70,
    growTime: 12000,
    color: '#f39c12',
    icon: '🌽'
  }
};

export class HappyFarmEngine {
  private grid: Cell[][];
  private gold: number;
  private seeds: Record<CropType, number>;
  private harvestCount: number;
  private isGameOver: boolean;
  private selectedCrop: CropType;
  private lastUpdate: number;

  constructor() {
    this.grid = [];
    this.gold = 100;
    this.seeds = { wheat: 5, carrot: 3, tomato: 2, corn: 1 };
    this.harvestCount = 0;
    this.isGameOver = false;
    this.selectedCrop = 'wheat';
    this.lastUpdate = Date.now();
    this.init();
  }

  init(): void {
    this.grid = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        this.grid[row][col] = {
          x: col,
          y: row,
          crop: null,
          stage: 'empty',
          plantedAt: 0,
          wateredAt: 0,
          isWatered: false
        };
      }
    }
    this.gold = 100;
    this.seeds = { wheat: 5, carrot: 3, tomato: 2, corn: 1 };
    this.harvestCount = 0;
    this.isGameOver = false;
    this.selectedCrop = 'wheat';
    this.lastUpdate = Date.now();
  }

  getState(): HappyFarmState {
    return {
      grid: this.grid.map(row => row.map(cell => ({ ...cell }))),
      gold: this.gold,
      seeds: { ...this.seeds },
      harvestCount: this.harvestCount,
      isGameOver: this.isGameOver
    };
  }

  getSelectedCrop(): CropType {
    return this.selectedCrop;
  }

  selectCrop(type: CropType): void {
    this.selectedCrop = type;
  }

  canPlant(col: number, row: number): boolean {
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false;
    const cell = this.grid[row][col];
    if (cell.stage !== 'empty') return false;
    if (this.seeds[this.selectedCrop] <= 0) return false;
    return true;
  }

  plant(col: number, row: number): boolean {
    if (!this.canPlant(col, row)) return false;

    this.seeds[this.selectedCrop]--;
    const cell = this.grid[row][col];
    cell.crop = this.selectedCrop;
    cell.stage = 'seed';
    cell.plantedAt = Date.now();
    cell.isWatered = false;

    return true;
  }

  water(col: number, row: number): boolean {
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false;
    const cell = this.grid[row][col];

    if (cell.stage === 'empty' || cell.stage === 'mature') return false;
    if (cell.isWatered) return false;

    cell.isWatered = true;
    cell.wateredAt = Date.now();
    return true;
  }

  harvest(col: number, row: number): boolean {
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false;
    const cell = this.grid[row][col];

    if (cell.stage !== 'mature') return false;
    if (!cell.crop) return false;

    const cropConfig = CROP_CONFIG[cell.crop];
    this.gold += cropConfig.sellPrice;
    this.harvestCount++;

    cell.crop = null;
    cell.stage = 'empty';
    cell.plantedAt = 0;
    cell.wateredAt = 0;
    cell.isWatered = false;

    return true;
  }

  buySeeds(type: CropType, count: number): boolean {
    const cropConfig = CROP_CONFIG[type];
    const totalCost = cropConfig.seedPrice * count;

    if (this.gold < totalCost) return false;

    this.gold -= totalCost;
    this.seeds[type] += count;
    return true;
  }

  tick(): void {
    if (this.isGameOver) return;

    const now = Date.now();
    this.lastUpdate = now;

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const cell = this.grid[row][col];

        if (cell.stage === 'empty' || cell.stage === 'mature') continue;
        if (!cell.crop) continue;

        const cropConfig = CROP_CONFIG[cell.crop];
        const baseGrowTime = cropConfig.growTime;
        const growTime = cell.isWatered ? baseGrowTime * 0.5 : baseGrowTime;
        const timeSincePlanted = now - cell.plantedAt;

        if (timeSincePlanted >= growTime) {
          cell.stage = 'mature';
        } else if (timeSincePlanted >= growTime * 0.5) {
          cell.stage = 'sprout';
        }
      }
    }
  }

  getGridInfo(): { cols: number; rows: number; cellSize: number } {
    return { cols: GRID_COLS, rows: GRID_ROWS, cellSize: CELL_SIZE };
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  reset(): void {
    this.init();
  }
}
