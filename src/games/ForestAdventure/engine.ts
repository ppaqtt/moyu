// 森林冒险游戏引擎
// Forest Adventure Game Engine

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
  forest: '#228b22',
  tree: '#006400',
  path: '#8b7355',
  water: '#00aaff',
  treasure: '#ffd700',
  monster: '#ff4444'
};

export interface PlayerStats {
  health: number;
  energy: number;
  experience: number;
  level: number;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'potion' | 'treasure' | 'key';
  quantity: number;
  icon: string;
  effect?: { type: string; value: number };
  equipped?: boolean;
}

export interface Monster {
  id: string;
  x: number;
  y: number;
  name: string;
  health: number;
  maxHealth: number;
  damage: number;
  experience: number;
  icon: string;
  type: 'wolf' | 'bear' | 'snake' | 'spider' | 'boss';
  defeated: boolean;
}

export interface Puzzle {
  id: string;
  x: number;
  y: number;
  type: 'lever' | 'button' | 'chest' | 'door';
  solved: boolean;
  requiredItem?: string;
  reward?: Item;
}

export interface MapTile {
  x: number;
  y: number;
  type: 'forest' | 'path' | 'water' | 'cave' | 'clearing' | 'bridge';
  walkable: boolean;
  explored: boolean;
  item?: Item;
  monster?: Monster;
  puzzle?: Puzzle;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  reward: { type: string; value: number };
}

export interface GameState {
  stats: PlayerStats;
  position: { x: number; y: number };
  inventory: Item[];
  equippedWeapon?: Item;
  equippedArmor?: Item;
  map: MapTile[][];
  monsters: Monster[];
  puzzles: Puzzle[];
  quests: Quest[];
  score: number;
  depth: number; // 探索深度
  gameOver: boolean;
  victory: boolean;
  secretFound: boolean[];
}

export interface GameConfig {
  mapWidth: number;
  mapHeight: number;
  maxDepth: number;
}

const DEFAULT_CONFIG: GameConfig = {
  mapWidth: 25,
  mapHeight: 25,
  maxDepth: 5
};

const ITEMS: Record<string, Item> = {
  sword: { id: 'sword', name: '铁剑', type: 'weapon', quantity: 1, icon: '⚔️', effect: { type: 'damage', value: 20 } },
  axe: { id: 'axe', name: '战斧', type: 'weapon', quantity: 1, icon: '🪓', effect: { type: 'damage', value: 30 } },
  bow: { id: 'bow', name: '弓箭', type: 'weapon', quantity: 1, icon: '🏹', effect: { type: 'damage', value: 15 } },
  leather_armor: { id: 'leather_armor', name: '皮甲', type: 'armor', quantity: 1, icon: '🛡️', effect: { type: 'defense', value: 10 } },
  chain_armor: { id: 'chain_armor', name: '链甲', type: 'armor', quantity: 1, icon: '🛡️', effect: { type: 'defense', value: 20 } },
  health_potion: { id: 'health_potion', name: '生命药水', type: 'potion', quantity: 1, icon: '🧪', effect: { type: 'heal', value: 50 } },
  energy_potion: { id: 'energy_potion', name: '能量药水', type: 'potion', quantity: 1, icon: '⚗️', effect: { type: 'energy', value: 50 } },
  gold_coin: { id: 'gold_coin', name: '金币', type: 'treasure', quantity: 1, icon: '🪙' },
  gem: { id: 'gem', name: '宝石', type: 'treasure', quantity: 1, icon: '💎' },
  ancient_key: { id: 'ancient_key', name: '远古钥匙', type: 'key', quantity: 1, icon: '🗝️' },
  treasure_chest: { id: 'treasure_chest', name: '宝箱', type: 'treasure', quantity: 1, icon: '📦' }
};

export class ForestAdventureEngine {
  private state: GameState;
  private config: GameConfig;
  private lastUpdate: number;
  private callbacks: {
    onStateChange?: (state: GameState) => void;
    onGameOver?: (score: number) => void;
    onVictory?: (score: number) => void;
    onLevelUp?: (level: number) => void;
  } = {};

  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.initializeGame();
    this.lastUpdate = Date.now();
  }

  private initializeGame(): GameState {
    const map = this.generateMap();
    const startX = Math.floor(this.config.mapWidth / 2);
    const startY = Math.floor(this.config.mapHeight / 2);

    return {
      stats: {
        health: 100,
        energy: 100,
        experience: 0,
        level: 1
      },
      position: { x: startX, y: startY },
      inventory: [
        { ...ITEMS.sword },
        { ...ITEMS.health_potion, quantity: 3 }
      ],
      equippedWeapon: { ...ITEMS.sword },
      map,
      monsters: this.generateMonsters(),
      puzzles: this.generatePuzzles(),
      quests: this.generateQuests(),
      score: 0,
      depth: 1,
      gameOver: false,
      victory: false,
      secretFound: [false, false, false]
    };
  }

  private generateMap(): MapTile[][] {
    const map: MapTile[][] = [];
    const width = this.config.mapWidth;
    const height = this.config.mapHeight;

    for (let x = 0; x < width; x++) {
      map[x] = [];
      for (let y = 0; y < height; y++) {
        const noise = Math.random();
        let type: MapTile['type'] = 'forest';
        let walkable = true;

        // 生成路径
        if (x % 4 === 0 || y % 4 === 0) {
          type = 'path';
        } else if (noise > 0.9) {
          type = 'water';
          walkable = false;
        } else if (noise > 0.85) {
          type = 'cave';
        } else if (noise > 0.8) {
          type = 'clearing';
        }

        map[x][y] = {
          x, y, type, walkable,
          explored: Math.abs(x - width / 2) < 3 && Math.abs(y - height / 2) < 3
        };
      }
    }

    // 添加桥梁
    for (let i = 0; i < 5; i++) {
      const bx = Math.floor(Math.random() * width);
      const by = Math.floor(Math.random() * height);
      if (map[bx][by].type === 'water') {
        map[bx][by].type = 'bridge';
        map[bx][by].walkable = true;
      }
    }

    // 放置物品
    const itemTypes = ['health_potion', 'energy_potion', 'gold_coin', 'gem', 'treasure_chest'];
    for (let i = 0; i < 20; i++) {
      const ix = Math.floor(Math.random() * width);
      const iy = Math.floor(Math.random() * height);
      if (map[ix][iy].walkable && !map[ix][iy].item) {
        const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        map[ix][iy].item = { ...ITEMS[itemType], quantity: Math.floor(Math.random() * 3) + 1 };
      }
    }

    return map;
  }

  private generateMonsters(): Monster[] {
    const monsters: Monster[] = [];
    const monsterTypes: Monster['type'][] = ['wolf', 'bear', 'snake', 'spider'];
    const monsterStats: Record<string, { name: string; health: number; damage: number; exp: number; icon: string }> = {
      wolf: { name: '野狼', health: 30, damage: 10, exp: 20, icon: '🐺' },
      bear: { name: '棕熊', health: 60, damage: 20, exp: 40, icon: '🐻' },
      snake: { name: '毒蛇', health: 20, damage: 15, exp: 15, icon: '🐍' },
      spider: { name: '巨型蜘蛛', health: 25, damage: 12, exp: 18, icon: '🕷️' },
      boss: { name: '森林守护者', health: 200, damage: 35, exp: 200, icon: '🐉' }
    };

    // 生成普通怪物
    for (let i = 0; i < 15; i++) {
      const type = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
      const stats = monsterStats[type];
      let x, y;
      do {
        x = Math.floor(Math.random() * this.config.mapWidth);
        y = Math.floor(Math.random() * this.config.mapHeight);
      } while (!this.state?.map[x][y]?.walkable || (x === this.config.mapWidth / 2 && y === this.config.mapHeight / 2));

      const monster: Monster = {
        id: `monster_${i}`,
        x, y,
        name: stats.name,
        health: stats.health,
        maxHealth: stats.health,
        damage: stats.damage,
        experience: stats.exp,
        icon: stats.icon,
        type,
        defeated: false
      };

      monsters.push(monster);
      if (this.state?.map[x]) {
        this.state.map[x][y].monster = monster;
      }
    }

    // 生成Boss
    const bossStats = monsterStats.boss;
    const boss: Monster = {
      id: 'boss_1',
      x: this.config.mapWidth - 3,
      y: this.config.mapHeight - 3,
      name: bossStats.name,
      health: bossStats.health,
      maxHealth: bossStats.health,
      damage: bossStats.damage,
      experience: bossStats.exp,
      icon: bossStats.icon,
      type: 'boss',
      defeated: false
    };
    monsters.push(boss);
    if (this.state?.map[boss.x]) {
      this.state.map[boss.x][boss.y].monster = boss;
    }

    return monsters;
  }

  private generatePuzzles(): Puzzle[] {
    const puzzles: Puzzle[] = [];

    // 生成机关
    for (let i = 0; i < 5; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * this.config.mapWidth);
        y = Math.floor(Math.random() * this.config.mapHeight);
      } while (!this.state?.map[x][y]?.walkable);

      const types: Puzzle['type'][] = ['lever', 'button', 'chest'];
      const puzzle: Puzzle = {
        id: `puzzle_${i}`,
        x, y,
        type: types[Math.floor(Math.random() * types.length)],
        solved: false,
        reward: { ...ITEMS.gold_coin, quantity: Math.floor(Math.random() * 10) + 5 }
      };

      puzzles.push(puzzle);
      if (this.state?.map[x]) {
        this.state.map[x][y].puzzle = puzzle;
      }
    }

    // 生成需要钥匙的门
    const door: Puzzle = {
      id: 'boss_door',
      x: this.config.mapWidth - 4,
      y: this.config.mapHeight - 4,
      type: 'door',
      solved: false,
      requiredItem: 'ancient_key'
    };
    puzzles.push(door);
    if (this.state?.map[door.x]) {
      this.state.map[door.x][door.y].puzzle = door;
      this.state.map[door.x][door.y].walkable = false;
    }

    return puzzles;
  }

  private generateQuests(): Quest[] {
    return [
      {
        id: 'explore',
        name: '森林探险家',
        description: '探索50%的地图',
        completed: false,
        reward: { type: 'experience', value: 100 }
      },
      {
        id: 'hunter',
        name: '怪物猎人',
        description: '击败10只怪物',
        completed: false,
        reward: { type: 'experience', value: 150 }
      },
      {
        id: 'treasure',
        name: '寻宝者',
        description: '找到5个宝箱',
        completed: false,
        reward: { type: 'score', value: 500 }
      },
      {
        id: 'boss',
        name: '森林守护者',
        description: '击败森林守护者',
        completed: false,
        reward: { type: 'victory', value: 1000 }
      }
    ];
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
    // 恢复能量
    this.state.stats.energy = Math.min(100, this.state.stats.energy + 2 * deltaTime);

    // 检查任务完成
    this.checkQuests();

    // 检查游戏结束
    if (this.state.stats.health <= 0) {
      this.state.gameOver = true;
      this.callbacks.onGameOver?.(this.state.score);
    }

    // 检查胜利条件
    const boss = this.state.monsters.find(m => m.type === 'boss');
    if (boss?.defeated) {
      this.state.victory = true;
      this.state.score += 5000;
      this.callbacks.onVictory?.(this.state.score);
    }

    this.callbacks.onStateChange?.(this.state);
  }

  private checkQuests(): void {
    this.state.quests.forEach(quest => {
      if (quest.completed) return;

      switch (quest.id) {
        case 'explore':
          const exploredTiles = this.state.map.flat().filter(t => t.explored).length;
          const totalTiles = this.config.mapWidth * this.config.mapHeight;
          if (exploredTiles >= totalTiles * 0.5) {
            quest.completed = true;
            this.state.stats.experience += quest.reward.value;
          }
          break;
        case 'hunter':
          const defeatedMonsters = this.state.monsters.filter(m => m.defeated && m.type !== 'boss').length;
          if (defeatedMonsters >= 10) {
            quest.completed = true;
            this.state.stats.experience += quest.reward.value;
          }
          break;
        case 'treasure':
          const treasuresFound = this.state.inventory.filter(i => i.id === 'treasure_chest').length;
          if (treasuresFound >= 5) {
            quest.completed = true;
            this.state.score += quest.reward.value;
          }
          break;
        case 'boss':
          const boss = this.state.monsters.find(m => m.type === 'boss');
          if (boss?.defeated) {
            quest.completed = true;
            this.state.score += quest.reward.value;
          }
          break;
      }
    });

    // 检查升级
    const expNeeded = this.state.stats.level * 100;
    if (this.state.stats.experience >= expNeeded) {
      this.state.stats.level++;
      this.state.stats.experience -= expNeeded;
      this.state.stats.health = Math.min(100, this.state.stats.health + 20);
      this.state.stats.maxHealth = 100 + (this.state.stats.level - 1) * 20;
      this.callbacks.onLevelUp?.(this.state.stats.level);
    }
  }

  // 移动玩家
  public move(dx: number, dy: number): boolean {
    if (this.state.gameOver || this.state.victory) return false;
    if (this.state.stats.energy < 5) return false;

    const newX = this.state.position.x + dx;
    const newY = this.state.position.y + dy;

    if (newX < 0 || newX >= this.config.mapWidth || newY < 0 || newY >= this.config.mapHeight) {
      return false;
    }

    const tile = this.state.map[newX][newY];
    if (!tile.walkable) return false;

    this.state.position.x = newX;
    this.state.position.y = newY;
    tile.explored = true;
    this.state.stats.energy -= 5;

    // 更新探索深度
    const distFromStart = Math.sqrt(
      (newX - this.config.mapWidth / 2) ** 2 +
      (newY - this.config.mapHeight / 2) ** 2
    );
    this.state.depth = Math.max(this.state.depth, Math.floor(distFromStart / 5) + 1);

    this.callbacks.onStateChange?.(this.state);
    return true;
  }

  // 拾取物品
  public pickup(): Item | null {
    const tile = this.state.map[this.state.position.x][this.state.position.y];
    if (!tile.item) return null;

    const item = tile.item;
    const existing = this.state.inventory.find(i => i.id === item.id);

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.state.inventory.push({ ...item });
    }

    tile.item = undefined;
    this.state.score += item.type === 'treasure' ? 100 * item.quantity : 10;

    this.callbacks.onStateChange?.(this.state);
    return item;
  }

  // 与怪物战斗
  public fight(): { monster: Monster; damageDealt: number; damageTaken: number } | null {
    const tile = this.state.map[this.state.position.x][this.state.position.y];
    if (!tile.monster || tile.monster.defeated) return null;

    const monster = tile.monster;
    const weaponDamage = this.state.equippedWeapon?.effect?.value || 10;
    const armorDefense = this.state.equippedArmor?.effect?.value || 0;

    // 玩家攻击
    const damageDealt = Math.floor(weaponDamage * (1 + this.state.stats.level * 0.1));
    monster.health -= damageDealt;

    // 怪物反击
    const damageTaken = Math.max(0, Math.floor(monster.damage * (1 - armorDefense / 100)));
    this.state.stats.health -= damageTaken;

    // 消耗能量
    this.state.stats.energy -= 10;

    // 检查怪物死亡
    if (monster.health <= 0) {
      monster.defeated = true;
      this.state.stats.experience += monster.experience;
      this.state.score += monster.experience * 2;

      // Boss掉落
      if (monster.type === 'boss') {
        this.state.inventory.push({ ...ITEMS.gem, quantity: 5 });
        this.state.inventory.push({ ...ITEMS.gold_coin, quantity: 100 });
      }
    }

    this.callbacks.onStateChange?.(this.state);
    return { monster, damageDealt, damageTaken };
  }

  // 解决谜题
  public solvePuzzle(): { success: boolean; reward?: Item } {
    const tile = this.state.map[this.state.position.x][this.state.position.y];
    if (!tile.puzzle || tile.puzzle.solved) return { success: false };

    // 检查是否需要物品
    if (tile.puzzle.requiredItem) {
      const hasItem = this.state.inventory.some(i => i.id === tile.puzzle!.requiredItem && i.quantity > 0);
      if (!hasItem) return { success: false };

      // 消耗物品
      const item = this.state.inventory.find(i => i.id === tile.puzzle!.requiredItem)!;
      item.quantity--;
      if (item.quantity <= 0) {
        this.state.inventory = this.state.inventory.filter(i => i.id !== tile.puzzle!.requiredItem);
      }
    }

    tile.puzzle.solved = true;

    // 门被打开
    if (tile.puzzle.type === 'door') {
      tile.walkable = true;
    }

    // 给予奖励
    if (tile.puzzle.reward) {
      const existing = this.state.inventory.find(i => i.id === tile.puzzle!.reward!.id);
      if (existing) {
        existing.quantity += tile.puzzle.reward.quantity;
      } else {
        this.state.inventory.push({ ...tile.puzzle.reward });
      }
      this.callbacks.onStateChange?.(this.state);
      return { success: true, reward: tile.puzzle.reward };
    }

    this.callbacks.onStateChange?.(this.state);
    return { success: true };
  }

  // 装备物品
  public equipItem(itemId: string): boolean {
    const item = this.state.inventory.find(i => i.id === itemId);
    if (!item) return false;

    if (item.type === 'weapon') {
      // 卸下当前武器
      if (this.state.equippedWeapon) {
        const current = this.state.inventory.find(i => i.id === this.state.equippedWeapon!.id);
        if (current) current.equipped = false;
      }
      this.state.equippedWeapon = item;
      item.equipped = true;
    } else if (item.type === 'armor') {
      // 卸下当前护甲
      if (this.state.equippedArmor) {
        const current = this.state.inventory.find(i => i.id === this.state.equippedArmor!.id);
        if (current) current.equipped = false;
      }
      this.state.equippedArmor = item;
      item.equipped = true;
    } else {
      return false;
    }

    this.callbacks.onStateChange?.(this.state);
    return true;
  }

  // 使用物品
  public useItem(itemId: string): boolean {
    const item = this.state.inventory.find(i => i.id === itemId);
    if (!item || item.quantity <= 0 || !item.effect) return false;

    switch (item.effect.type) {
      case 'heal':
        this.state.stats.health = Math.min(100 + (this.state.stats.level - 1) * 20, this.state.stats.health + item.effect.value);
        break;
      case 'energy':
        this.state.stats.energy = Math.min(100, this.state.stats.energy + item.effect.value);
        break;
    }

    item.quantity--;
    if (item.quantity <= 0) {
      this.state.inventory = this.state.inventory.filter(i => i.id !== itemId);
    }

    this.callbacks.onStateChange?.(this.state);
    return true;
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

  public onLevelUp(callback: (level: number) => void): void {
    this.callbacks.onLevelUp = callback;
  }

  // 保存游戏
  public save(): string {
    return JSON.stringify(this.state);
  }

  // 加载游戏
  public load(data: string): void {
    this.state = JSON.parse(data);
  }

  // 重置游戏
  public reset(): void {
    this.state = this.initializeGame();
    this.lastUpdate = Date.now();
  }
}

export default ForestAdventureEngine;
