// 荒岛求生游戏引擎
// Island Survival Game Engine

export const NEON_COLORS = {
  primary: '#00f5ff',
  secondary: '#ff00ff',
  accent: '#ffff00',
  danger: '#ff3366',
  success: '#00ff88',
  warning: '#ffaa00',
  background: '#0a0a1a',
  surface: '#1a1a2e',
  text: '#ffffff',
  textMuted: '#8888aa',
  water: '#00aaff',
  sand: '#ffdd88',
  wood: '#8b4513',
  leaf: '#00cc44',
  rock: '#888888'
};

export interface SurvivalStats {
  hunger: number;      // 饥饿值 0-100
  thirst: number;      // 口渴值 0-100
  health: number;      // 生命值 0-100
  energy: number;      // 体力值 0-100
  sanity: number;      // 理智值 0-100
}

export interface Resource {
  id: string;
  name: string;
  type: 'food' | 'water' | 'material' | 'tool';
  quantity: number;
  icon: string;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: { resourceId: string; quantity: number }[];
  result: { resourceId: string; quantity: number };
  unlocked: boolean;
}

export interface Structure {
  id: string;
  x: number;
  y: number;
  type: 'shelter' | 'fire' | 'water_collector' | 'garden';
  level: number;
  durability: number;
}

export interface IslandTile {
  x: number;
  y: number;
  type: 'water' | 'sand' | 'grass' | 'forest' | 'rock' | 'mountain';
  resources: Resource[];
  explored: boolean;
  structure?: Structure;
}

export interface GameState {
  stats: SurvivalStats;
  inventory: Resource[];
  position: { x: number; y: number };
  map: IslandTile[][];
  day: number;
  time: number; // 0-24小时
  score: number;
  structures: Structure[];
  discoveredRecipes: string[];
  gameOver: boolean;
  victory: boolean;
}

export interface GameConfig {
  mapSize: number;
  dayLength: number; // 秒
  hungerDecay: number;
  thirstDecay: number;
  energyDecay: number;
  sanityDecay: number;
}

const DEFAULT_CONFIG: GameConfig = {
  mapSize: 20,
  dayLength: 300, // 5分钟一天
  hungerDecay: 0.5,
  thirstDecay: 0.8,
  energyDecay: 0.3,
  sanityDecay: 0.2
};

const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'spear',
    name: '石矛',
    description: '用于捕鱼和防御',
    ingredients: [{ resourceId: 'wood', quantity: 2 }, { resourceId: 'stone', quantity: 1 }],
    result: { resourceId: 'spear', quantity: 1 },
    unlocked: true
  },
  {
    id: 'fishing_rod',
    name: '钓鱼竿',
    description: '提高捕鱼效率',
    ingredients: [{ resourceId: 'wood', quantity: 3 }, { resourceId: 'vine', quantity: 2 }],
    result: { resourceId: 'fishing_rod', quantity: 1 },
    unlocked: true
  },
  {
    id: 'axe',
    name: '石斧',
    description: '砍伐树木更高效',
    ingredients: [{ resourceId: 'wood', quantity: 2 }, { resourceId: 'stone', quantity: 2 }],
    result: { resourceId: 'axe', quantity: 1 },
    unlocked: true
  },
  {
    id: 'shelter',
    name: '简易庇护所',
    description: '提供休息场所，恢复理智',
    ingredients: [{ resourceId: 'wood', quantity: 10 }, { resourceId: 'leaf', quantity: 15 }],
    result: { resourceId: 'shelter_kit', quantity: 1 },
    unlocked: true
  },
  {
    id: 'water_filter',
    name: '简易滤水器',
    description: '将海水转化为淡水',
    ingredients: [{ resourceId: 'wood', quantity: 5 }, { resourceId: 'stone', quantity: 3 }, { resourceId: 'leaf', quantity: 10 }],
    result: { resourceId: 'water_filter', quantity: 1 },
    unlocked: false
  },
  {
    id: 'raft',
    name: '木筏',
    description: '逃离荒岛的工具',
    ingredients: [{ resourceId: 'wood', quantity: 50 }, { resourceId: 'vine', quantity: 20 }, { resourceId: 'cloth', quantity: 5 }],
    result: { resourceId: 'raft', quantity: 1 },
    unlocked: false
  }
];

export class IslandSurvivalEngine {
  private state: GameState;
  private config: GameConfig;
  private lastUpdate: number;
  private recipes: CraftingRecipe[];
  private callbacks: {
    onStateChange?: (state: GameState) => void;
    onGameOver?: (score: number) => void;
    onVictory?: (score: number) => void;
  } = {};

  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.recipes = JSON.parse(JSON.stringify(CRAFTING_RECIPES));
    this.state = this.initializeGame();
    this.lastUpdate = Date.now();
  }

  private initializeGame(): GameState {
    const map = this.generateMap();
    const centerX = Math.floor(this.config.mapSize / 2);
    const centerY = Math.floor(this.config.mapSize / 2);

    return {
      stats: {
        hunger: 80,
        thirst: 80,
        health: 100,
        energy: 100,
        sanity: 100
      },
      inventory: [
        { id: 'wood', name: '木材', type: 'material', quantity: 5, icon: '🪵' },
        { id: 'stone', name: '石头', type: 'material', quantity: 3, icon: '🪨' }
      ],
      position: { x: centerX, y: centerY },
      map,
      day: 1,
      time: 8,
      score: 0,
      structures: [],
      discoveredRecipes: ['spear', 'fishing_rod', 'axe', 'shelter'],
      gameOver: false,
      victory: false
    };
  }

  private generateMap(): IslandTile[][] {
    const map: IslandTile[][] = [];
    const size = this.config.mapSize;
    const center = size / 2;

    for (let x = 0; x < size; x++) {
      map[x] = [];
      for (let y = 0; y < size; y++) {
        const distanceFromCenter = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
        const maxRadius = size * 0.4;

        let type: IslandTile['type'] = 'water';
        let resources: Resource[] = [];

        if (distanceFromCenter < maxRadius) {
          const noise = Math.random();
          if (distanceFromCenter > maxRadius * 0.8) {
            type = 'sand';
            if (Math.random() > 0.7) {
              resources.push({ id: 'shell', name: '贝壳', type: 'material', quantity: 1, icon: '🐚' });
            }
          } else if (distanceFromCenter > maxRadius * 0.5) {
            type = noise > 0.3 ? 'grass' : 'forest';
            if (type === 'forest') {
              resources.push({ id: 'wood', name: '木材', type: 'material', quantity: Math.floor(Math.random() * 3) + 1, icon: '🪵' });
              resources.push({ id: 'leaf', name: '树叶', type: 'material', quantity: Math.floor(Math.random() * 5) + 1, icon: '🍃' });
              if (Math.random() > 0.6) {
                resources.push({ id: 'fruit', name: '野果', type: 'food', quantity: Math.floor(Math.random() * 2) + 1, icon: '🍎' });
              }
            }
          } else if (distanceFromCenter > maxRadius * 0.2) {
            type = noise > 0.4 ? 'forest' : 'rock';
            if (type === 'rock') {
              resources.push({ id: 'stone', name: '石头', type: 'material', quantity: Math.floor(Math.random() * 3) + 1, icon: '🪨' });
            }
          } else {
            type = 'mountain';
            resources.push({ id: 'stone', name: '石头', type: 'material', quantity: Math.floor(Math.random() * 4) + 2, icon: '🪨' });
          }
        }

        map[x][y] = {
          x,
          y,
          type,
          resources,
          explored: distanceFromCenter < maxRadius * 0.3
        };
      }
    }

    return map;
  }

  public start(): void {
    this.lastUpdate = Date.now();
    this.gameLoop();
  }

  private gameLoop(): void {
    if (this.state.gameOver || this.state.victory) return;

    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;

    this.update(deltaTime);

    requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number): void {
    // 更新生存指标
    this.state.stats.hunger = Math.max(0, this.state.stats.hunger - this.config.hungerDecay * deltaTime);
    this.state.stats.thirst = Math.max(0, this.state.stats.thirst - this.config.thirstDecay * deltaTime);
    this.state.stats.energy = Math.max(0, this.state.stats.energy - this.config.energyDecay * deltaTime);
    this.state.stats.sanity = Math.max(0, this.state.stats.sanity - this.config.sanityDecay * deltaTime);

    // 更新时间
    this.state.time += (deltaTime / this.config.dayLength) * 24;
    if (this.state.time >= 24) {
      this.state.time = 0;
      this.state.day++;
      this.state.score += 100;
    }

    // 检查生存状态
    if (this.state.stats.hunger <= 0 || this.state.stats.thirst <= 0) {
      this.state.stats.health -= 5 * deltaTime;
    }

    // 检查游戏结束
    if (this.state.stats.health <= 0) {
      this.state.gameOver = true;
      this.callbacks.onGameOver?.(this.state.score);
    }

    // 检查胜利条件
    const raft = this.state.inventory.find(r => r.id === 'raft');
    if (raft && raft.quantity > 0 && this.state.position.x < 2) {
      this.state.victory = true;
      this.state.score += 5000;
      this.callbacks.onVictory?.(this.state.score);
    }

    this.callbacks.onStateChange?.(this.state);
  }

  // 移动玩家
  public move(dx: number, dy: number): boolean {
    if (this.state.gameOver || this.state.victory) return false;

    const newX = this.state.position.x + dx;
    const newY = this.state.position.y + dy;

    if (newX < 0 || newX >= this.config.mapSize || newY < 0 || newY >= this.config.mapSize) {
      return false;
    }

    const tile = this.state.map[newX][newY];
    if (tile.type === 'water' || tile.type === 'mountain') {
      return false;
    }

    this.state.position.x = newX;
    this.state.position.y = newY;
    tile.explored = true;

    // 移动消耗体力
    this.state.stats.energy = Math.max(0, this.state.stats.energy - 2);

    this.callbacks.onStateChange?.(this.state);
    return true;
  }

  // 收集资源
  public gather(): Resource[] {
    if (this.state.gameOver || this.state.victory) return [];

    const tile = this.state.map[this.state.position.x][this.state.position.y];
    const gathered: Resource[] = [];

    if (tile.resources.length > 0 && this.state.stats.energy >= 5) {
      const resource = tile.resources[0];
      const amount = Math.min(resource.quantity, Math.floor(Math.random() * 3) + 1);

      if (amount > 0) {
        const gatheredResource = { ...resource, quantity: amount };
        gathered.push(gatheredResource);

        // 添加到背包
        const existing = this.state.inventory.find(r => r.id === resource.id);
        if (existing) {
          existing.quantity += amount;
        } else {
          this.state.inventory.push({ ...resource, quantity: amount });
        }

        resource.quantity -= amount;
        if (resource.quantity <= 0) {
          tile.resources.shift();
        }

        this.state.stats.energy -= 5;
        this.state.score += amount * 10;
      }
    }

    this.callbacks.onStateChange?.(this.state);
    return gathered;
  }

  // 使用物品
  public useItem(resourceId: string): boolean {
    const resource = this.state.inventory.find(r => r.id === resourceId);
    if (!resource || resource.quantity <= 0) return false;

    let consumed = false;

    switch (resource.type) {
      case 'food':
        this.state.stats.hunger = Math.min(100, this.state.stats.hunger + 30);
        this.state.stats.health = Math.min(100, this.state.stats.health + 5);
        consumed = true;
        break;
      case 'water':
        this.state.stats.thirst = Math.min(100, this.state.stats.thirst + 40);
        consumed = true;
        break;
    }

    if (consumed) {
      resource.quantity--;
      if (resource.quantity <= 0) {
        this.state.inventory = this.state.inventory.filter(r => r.id !== resourceId);
      }
      this.callbacks.onStateChange?.(this.state);
    }

    return consumed;
  }

  // 制作物品
  public craft(recipeId: string): boolean {
    const recipe = this.recipes.find(r => r.id === recipeId);
    if (!recipe || !recipe.unlocked) return false;

    // 检查材料
    for (const ingredient of recipe.ingredients) {
      const resource = this.state.inventory.find(r => r.id === ingredient.resourceId);
      if (!resource || resource.quantity < ingredient.quantity) {
        return false;
      }
    }

    // 消耗材料
    for (const ingredient of recipe.ingredients) {
      const resource = this.state.inventory.find(r => r.id === ingredient.resourceId)!;
      resource.quantity -= ingredient.quantity;
      if (resource.quantity <= 0) {
        this.state.inventory = this.state.inventory.filter(r => r.id !== ingredient.resourceId);
      }
    }

    // 添加产物
    const resultResource = this.state.inventory.find(r => r.id === recipe.result.resourceId);
    if (resultResource) {
      resultResource.quantity += recipe.result.quantity;
    } else {
      this.state.inventory.push({
        id: recipe.result.resourceId,
        name: recipe.name,
        type: recipe.result.resourceId === 'raft' ? 'tool' : 'tool',
        quantity: recipe.result.quantity,
        icon: this.getResourceIcon(recipe.result.resourceId)
      });
    }

    this.state.score += 50;
    this.callbacks.onStateChange?.(this.state);
    return true;
  }

  private getResourceIcon(resourceId: string): string {
    const icons: Record<string, string> = {
      spear: '🔱',
      fishing_rod: '🎣',
      axe: '🪓',
      shelter_kit: '⛺',
      water_filter: '💧',
      raft: '🛶',
      wood: '🪵',
      stone: '🪨',
      leaf: '🍃',
      vine: '🌿',
      fruit: '🍎',
      shell: '🐚',
      cloth: '🧵'
    };
    return icons[resourceId] || '📦';
  }

  // 休息恢复
  public rest(): void {
    if (this.state.stats.energy < 100) {
      this.state.stats.energy = Math.min(100, this.state.stats.energy + 30);
      this.state.stats.sanity = Math.min(100, this.state.stats.sanity + 20);
      this.state.time += 2;
      this.callbacks.onStateChange?.(this.state);
    }
  }

  // 捕鱼
  public fish(): Resource | null {
    const tile = this.state.map[this.state.position.x][this.state.position.y];
    if (tile.type !== 'sand' || this.state.stats.energy < 10) return null;

    const hasFishingRod = this.state.inventory.some(r => r.id === 'fishing_rod');
    const successRate = hasFishingRod ? 0.7 : 0.4;

    if (Math.random() < successRate) {
      const fish: Resource = {
        id: 'fish',
        name: '鱼',
        type: 'food',
        quantity: 1,
        icon: '🐟'
      };

      const existing = this.state.inventory.find(r => r.id === 'fish');
      if (existing) {
        existing.quantity++;
      } else {
        this.state.inventory.push(fish);
      }

      this.state.stats.energy -= 10;
      this.state.score += 20;
      this.callbacks.onStateChange?.(this.state);
      return fish;
    }

    this.state.stats.energy -= 5;
    this.callbacks.onStateChange?.(this.state);
    return null;
  }

  // 获取可制作配方
  public getAvailableRecipes(): CraftingRecipe[] {
    return this.recipes.filter(r => r.unlocked);
  }

  // 解锁配方
  public unlockRecipe(recipeId: string): void {
    const recipe = this.recipes.find(r => r.id === recipeId);
    if (recipe) {
      recipe.unlocked = true;
      if (!this.state.discoveredRecipes.includes(recipeId)) {
        this.state.discoveredRecipes.push(recipeId);
      }
    }
  }

  // 获取游戏状态
  public getState(): GameState {
    return { ...this.state };
  }

  // 设置回调
  public onStateChange(callback: (state: GameState) => void): void {
    this.callbacks.onStateChange = callback;
  }

  public onGameOver(callback: (score: number) => void): void {
    this.callbacks.onGameOver = callback;
  }

  public onVictory(callback: (score: number) => void): void {
    this.callbacks.onVictory = callback;
  }

  // 保存游戏
  public save(): string {
    return JSON.stringify({
      state: this.state,
      recipes: this.recipes
    });
  }

  // 加载游戏
  public load(data: string): void {
    const parsed = JSON.parse(data);
    this.state = parsed.state;
    this.recipes = parsed.recipes;
  }

  // 重置游戏
  public reset(): void {
    this.recipes = JSON.parse(JSON.stringify(CRAFTING_RECIPES));
    this.state = this.initializeGame();
    this.lastUpdate = Date.now();
  }
}

export default IslandSurvivalEngine;
