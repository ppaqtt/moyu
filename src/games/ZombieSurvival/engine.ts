// 末日生存游戏引擎
// Zombie Survival Game Engine

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
  zombie: '#ff4444',
  blood: '#8b0000',
  grass: '#2d5016',
  road: '#444444',
  building: '#666666'
};

export interface PlayerStats {
  health: number;
  stamina: number;
  hunger: number;
  infection: number; // 感染值
}

export interface Weapon {
  id: string;
  name: string;
  damage: number;
  range: number;
  ammo?: number;
  maxAmmo?: number;
  durability: number;
  icon: string;
}

export interface Item {
  id: string;
  name: string;
  type: 'food' | 'medical' | 'ammo' | 'material';
  quantity: number;
  icon: string;
  effect?: { type: string; value: number };
}

export interface Zombie {
  id: string;
  x: number;
  y: number;
  health: number;
  speed: number;
  damage: number;
  type: 'walker' | 'runner' | 'tank' | 'spitter';
  lastMove: number;
}

export interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'house' | 'shop' | 'hospital' | 'police' | 'warehouse';
  looted: boolean;
  name: string;
}

export interface MapTile {
  x: number;
  y: number;
  type: 'grass' | 'road' | 'building' | 'water' | 'forest';
  walkable: boolean;
  building?: Building;
}

export interface GameState {
  stats: PlayerStats;
  position: { x: number; y: number };
  inventory: Item[];
  weapons: Weapon[];
  equippedWeapon: Weapon | null;
  map: MapTile[][];
  zombies: Zombie[];
  buildings: Building[];
  wave: number;
  kills: number;
  score: number;
  day: number;
  time: number; // 0-24
  gameOver: boolean;
  victory: boolean;
  safeZone: { x: number; y: number; radius: number };
}

export interface GameConfig {
  mapWidth: number;
  mapHeight: number;
  zombieSpawnRate: number;
  dayLength: number;
  maxWaves: number;
}

const DEFAULT_CONFIG: GameConfig = {
  mapWidth: 30,
  mapHeight: 30,
  zombieSpawnRate: 5000, // 毫秒
  dayLength: 300,
  maxWaves: 10
};

const WEAPONS: Weapon[] = [
  { id: 'fist', name: '拳头', damage: 10, range: 1, durability: 999, icon: '👊' },
  { id: 'knife', name: '匕首', damage: 25, range: 1, durability: 50, icon: '🔪' },
  { id: 'bat', name: '棒球棍', damage: 30, range: 1.5, durability: 30, icon: '🏏' },
  { id: 'pistol', name: '手枪', damage: 40, range: 8, ammo: 12, maxAmmo: 12, durability: 100, icon: '🔫' },
  { id: 'shotgun', name: '霰弹枪', damage: 80, range: 5, ammo: 6, maxAmmo: 6, durability: 50, icon: '🔫' },
  { id: 'rifle', name: '步枪', damage: 60, range: 15, ammo: 30, maxAmmo: 30, durability: 80, icon: '🔫' }
];

export class ZombieSurvivalEngine {
  private state: GameState;
  private config: GameConfig;
  private lastUpdate: number;
  private lastZombieSpawn: number;
  private callbacks: {
    onStateChange?: (state: GameState) => void;
    onGameOver?: (score: number) => void;
    onVictory?: (score: number) => void;
    onWaveComplete?: (wave: number) => void;
  } = {};

  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.initializeGame();
    this.lastUpdate = Date.now();
    this.lastZombieSpawn = Date.now();
  }

  private initializeGame(): GameState {
    const map = this.generateMap();
    const centerX = Math.floor(this.config.mapWidth / 2);
    const centerY = Math.floor(this.config.mapHeight / 2);

    return {
      stats: {
        health: 100,
        stamina: 100,
        hunger: 100,
        infection: 0
      },
      position: { x: centerX, y: centerY },
      inventory: [
        { id: 'bandage', name: '绷带', type: 'medical', quantity: 3, icon: '🩹', effect: { type: 'heal', value: 20 } },
        { id: 'food_can', name: '罐头', type: 'food', quantity: 2, icon: '🥫', effect: { type: 'hunger', value: 30 } }
      ],
      weapons: [{ ...WEAPONS[1] }], // 匕首
      equippedWeapon: { ...WEAPONS[1] },
      map,
      zombies: [],
      buildings: this.generateBuildings(),
      wave: 1,
      kills: 0,
      score: 0,
      day: 1,
      time: 12,
      gameOver: false,
      victory: false,
      safeZone: { x: centerX, y: centerY, radius: 5 }
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
        let type: MapTile['type'] = 'grass';
        let walkable = true;

        // 生成道路
        if (x % 5 === 0 || y % 5 === 0) {
          type = 'road';
        } else if (noise > 0.85) {
          type = 'forest';
        } else if (noise > 0.8) {
          type = 'water';
          walkable = false;
        }

        map[x][y] = { x, y, type, walkable };
      }
    }

    return map;
  }

  private generateBuildings(): Building[] {
    const buildings: Building[] = [];
    const types: Building['type'][] = ['house', 'shop', 'hospital', 'police', 'warehouse'];
    const names = {
      house: ['民居', '公寓', '别墅'],
      shop: ['便利店', '超市', '杂货店'],
      hospital: ['诊所', '医院', '药房'],
      police: ['警察局', '哨站'],
      warehouse: ['仓库', '储藏室']
    };

    for (let i = 0; i < 15; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const x = Math.floor(Math.random() * (this.config.mapWidth - 4)) + 2;
      const y = Math.floor(Math.random() * (this.config.mapHeight - 4)) + 2;
      const width = Math.floor(Math.random() * 2) + 2;
      const height = Math.floor(Math.random() * 2) + 2;

      const building: Building = {
        x, y, width, height, type,
        looted: false,
        name: names[type][Math.floor(Math.random() * names[type].length)]
      };

      buildings.push(building);

      // 标记建筑区域
      for (let bx = x; bx < x + width && bx < this.config.mapWidth; bx++) {
        for (let by = y; by < y + height && by < this.config.mapHeight; by++) {
          this.state.map[bx][by].type = 'building';
          this.state.map[bx][by].walkable = false;
          this.state.map[bx][by].building = building;
        }
      }
    }

    return buildings;
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
    this.state.stats.hunger = Math.max(0, this.state.stats.hunger - 0.5 * deltaTime);
    this.state.stats.stamina = Math.min(100, this.state.stats.stamina + 2 * deltaTime);

    if (this.state.stats.hunger <= 0) {
      this.state.stats.health -= 2 * deltaTime;
    }

    // 感染效果
    if (this.state.stats.infection > 0) {
      this.state.stats.infection = Math.min(100, this.state.stats.infection + 0.5 * deltaTime);
      if (this.state.stats.infection >= 100) {
        this.state.stats.health -= 5 * deltaTime;
      }
    }

    // 更新时间
    this.state.time += (deltaTime / this.config.dayLength) * 24;
    if (this.state.time >= 24) {
      this.state.time = 0;
      this.state.day++;
      this.state.wave = Math.min(this.config.maxWaves, Math.floor(this.state.day / 2) + 1);
    }

    // 生成僵尸
    const now = Date.now();
    const spawnInterval = Math.max(1000, this.config.zombieSpawnRate - this.state.wave * 500);
    if (now - this.lastZombieSpawn > spawnInterval) {
      this.spawnZombie();
      this.lastZombieSpawn = now;
    }

    // 更新僵尸
    this.updateZombies(deltaTime);

    // 检查游戏结束
    if (this.state.stats.health <= 0) {
      this.state.gameOver = true;
      this.callbacks.onGameOver?.(this.state.score);
    }

    // 检查胜利条件
    if (this.state.kills >= 100 && this.state.wave >= this.config.maxWaves) {
      this.state.victory = true;
      this.state.score += 10000;
      this.callbacks.onVictory?.(this.state.score);
    }

    this.callbacks.onStateChange?.(this.state);
  }

  private spawnZombie(): void {
    const types: Zombie['type'][] = ['walker', 'runner', 'tank', 'spitter'];
    const weights = [0.6, 0.25, 0.1, 0.05]; // 生成权重

    let type: Zombie['type'] = 'walker';
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (rand <= cumulative) {
        type = types[i];
        break;
      }
    }

    // 在地图边缘生成
    let x, y;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 : this.config.mapWidth - 1;
      y = Math.floor(Math.random() * this.config.mapHeight);
    } else {
      x = Math.floor(Math.random() * this.config.mapWidth);
      y = Math.random() < 0.5 ? 0 : this.config.mapHeight - 1;
    }

    const zombieStats = {
      walker: { health: 30, speed: 1.5, damage: 10 },
      runner: { health: 20, speed: 3, damage: 15 },
      tank: { health: 100, speed: 0.8, damage: 25 },
      spitter: { health: 25, speed: 1, damage: 20 }
    };

    const stats = zombieStats[type];
    const zombie: Zombie = {
      id: `zombie_${Date.now()}_${Math.random()}`,
      x, y,
      health: stats.health + this.state.wave * 5,
      speed: stats.speed,
      damage: stats.damage + this.state.wave * 2,
      type,
      lastMove: Date.now()
    };

    this.state.zombies.push(zombie);
  }

  private updateZombies(deltaTime: number): void {
    const now = Date.now();

    this.state.zombies = this.state.zombies.filter(zombie => {
      if (zombie.health <= 0) {
        this.state.kills++;
        this.state.score += zombie.type === 'tank' ? 50 : zombie.type === 'runner' ? 30 : 20;
        return false;
      }

      // 移动僵尸
      if (now - zombie.lastMove > 1000 / zombie.speed) {
        const dx = this.state.position.x - zombie.x;
        const dy = this.state.position.y - zombie.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0.5) {
          const moveX = dx / distance;
          const moveY = dy / distance;

          const newX = zombie.x + Math.sign(moveX);
          const newY = zombie.y + Math.sign(moveY);

          if (this.isValidPosition(newX, newY)) {
            zombie.x = newX;
            zombie.y = newY;
          }
        }

        zombie.lastMove = now;
      }

      // 攻击玩家
      const distToPlayer = Math.sqrt(
        (zombie.x - this.state.position.x) ** 2 +
        (zombie.y - this.state.position.y) ** 2
      );

      if (distToPlayer < 1.5) {
        this.state.stats.health -= zombie.damage * deltaTime;
        if (zombie.type === 'spitter' && Math.random() < 0.1) {
          this.state.stats.infection += 5;
        }
      }

      return true;
    });
  }

  private isValidPosition(x: number, y: number): boolean {
    if (x < 0 || x >= this.config.mapWidth || y < 0 || y >= this.config.mapHeight) {
      return false;
    }
    return this.state.map[x][y].walkable;
  }

  // 移动玩家
  public move(dx: number, dy: number): boolean {
    if (this.state.gameOver || this.state.victory) return false;
    if (this.state.stats.stamina < 5) return false;

    const newX = this.state.position.x + dx;
    const newY = this.state.position.y + dy;

    if (!this.isValidPosition(newX, newY)) return false;

    this.state.position.x = newX;
    this.state.position.y = newY;
    this.state.stats.stamina -= 2;

    this.callbacks.onStateChange?.(this.state);
    return true;
  }

  // 攻击
  public attack(directionX: number, directionY: number): Zombie[] {
    if (!this.state.equippedWeapon || this.state.stats.stamina < 10) return [];

    const weapon = this.state.equippedWeapon;
    const hitZombies: Zombie[] = [];

    // 检查范围内的僵尸
    this.state.zombies.forEach(zombie => {
      const dist = Math.sqrt(
        (zombie.x - this.state.position.x) ** 2 +
        (zombie.y - this.state.position.y) ** 2
      );

      if (dist <= weapon.range) {
        zombie.health -= weapon.damage;
        hitZombies.push(zombie);

        // 击退效果
        const knockbackX = (zombie.x - this.state.position.x) / dist * 2;
        const knockbackY = (zombie.y - this.state.position.y) / dist * 2;
        const newZombieX = Math.round(zombie.x + knockbackX);
        const newZombieY = Math.round(zombie.y + knockbackY);

        if (this.isValidPosition(newZombieX, newZombieY)) {
          zombie.x = newZombieX;
          zombie.y = newZombieY;
        }
      }
    });

    // 消耗武器耐久
    weapon.durability--;
    this.state.stats.stamina -= 10;

    if (weapon.durability <= 0) {
      this.state.weapons = this.state.weapons.filter(w => w.id !== weapon.id);
      this.state.equippedWeapon = this.state.weapons[0] || null;
    }

    this.callbacks.onStateChange?.(this.state);
    return hitZombies;
  }

  // 射击
  public shoot(targetX: number, targetY: number): boolean {
    if (!this.state.equippedWeapon || !this.state.equippedWeapon.ammo) return false;
    if (this.state.equippedWeapon.ammo <= 0) return false;

    const weapon = this.state.equippedWeapon;
    weapon.ammo--;

    // 计算射击方向
    const dx = targetX - this.state.position.x;
    const dy = targetY - this.state.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= weapon.range) {
      // 找到最近的僵尸
      let closestZombie: Zombie | null = null;
      let closestDist = Infinity;

      this.state.zombies.forEach(zombie => {
        const zDist = Math.sqrt(
          (zombie.x - this.state.position.x) ** 2 +
          (zombie.y - this.state.position.y) ** 2
        );
        if (zDist < closestDist && zDist <= weapon.range) {
          closestDist = zDist;
          closestZombie = zombie;
        }
      });

      if (closestZombie) {
        closestZombie.health -= weapon.damage;
        this.callbacks.onStateChange?.(this.state);
        return true;
      }
    }

    this.callbacks.onStateChange?.(this.state);
    return false;
  }

  // 装弹
  public reload(): boolean {
    if (!this.state.equippedWeapon || !this.state.equippedWeapon.maxAmmo) return false;

    const weapon = this.state.equippedWeapon;
    const ammoNeeded = weapon.maxAmmo - (weapon.ammo || 0);

    if (ammoNeeded <= 0) return false;

    // 检查背包中的弹药
    const ammoItem = this.state.inventory.find(i => i.id === `${weapon.id}_ammo`);
    if (!ammoItem || ammoItem.quantity <= 0) return false;

    const ammoToUse = Math.min(ammoNeeded, ammoItem.quantity);
    weapon.ammo = (weapon.ammo || 0) + ammoToUse;
    ammoItem.quantity -= ammoToUse;

    if (ammoItem.quantity <= 0) {
      this.state.inventory = this.state.inventory.filter(i => i.id !== ammoItem.id);
    }

    this.callbacks.onStateChange?.(this.state);
    return true;
  }

  // 切换武器
  public switchWeapon(weaponId: string): boolean {
    const weapon = this.state.weapons.find(w => w.id === weaponId);
    if (!weapon) return false;

    this.state.equippedWeapon = weapon;
    this.callbacks.onStateChange?.(this.state);
    return true;
  }

  // 搜索建筑
  public searchBuilding(): Item[] {
    const tile = this.state.map[this.state.position.x][this.state.position.y];
    if (!tile.building || tile.building.looted) return [];

    const loot: Item[] = [];
    const lootTable: Record<Building['type'], Item[]> = {
      house: [
        { id: 'food_can', name: '罐头', type: 'food', quantity: Math.floor(Math.random() * 2) + 1, icon: '🥫', effect: { type: 'hunger', value: 30 } },
        { id: 'bandage', name: '绷带', type: 'medical', quantity: 1, icon: '🩹', effect: { type: 'heal', value: 20 } }
      ],
      shop: [
        { id: 'food_can', name: '罐头', type: 'food', quantity: Math.floor(Math.random() * 3) + 2, icon: '🥫', effect: { type: 'hunger', value: 30 } },
        { id: 'water', name: '瓶装水', type: 'food', quantity: Math.floor(Math.random() * 2) + 1, icon: '💧', effect: { type: 'hunger', value: 10 } }
      ],
      hospital: [
        { id: 'medkit', name: '医疗包', type: 'medical', quantity: 1, icon: '💊', effect: { type: 'heal', value: 50 } },
        { id: 'bandage', name: '绷带', type: 'medical', quantity: Math.floor(Math.random() * 3) + 1, icon: '🩹', effect: { type: 'heal', value: 20 } },
        { id: 'antidote', name: '抗病毒剂', type: 'medical', quantity: 1, icon: '💉', effect: { type: 'cure', value: 100 } }
      ],
      police: [
        { id: 'pistol', name: '手枪', type: 'material', quantity: 1, icon: '🔫' },
        { id: 'pistol_ammo', name: '手枪弹药', type: 'ammo', quantity: Math.floor(Math.random() * 10) + 5, icon: '🔹' },
        { id: 'shotgun', name: '霰弹枪', type: 'material', quantity: Math.random() > 0.7 ? 1 : 0, icon: '🔫' }
      ],
      warehouse: [
        { id: 'wood', name: '木材', type: 'material', quantity: Math.floor(Math.random() * 10) + 5, icon: '🪵' },
        { id: 'metal', name: '金属', type: 'material', quantity: Math.floor(Math.random() * 5) + 2, icon: '🔩' }
      ]
    };

    const buildingLoot = lootTable[tile.building.type];
    const numItems = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numItems; i++) {
      const item = buildingLoot[Math.floor(Math.random() * buildingLoot.length)];
      if (item.quantity > 0) {
        const existing = loot.find(l => l.id === item.id);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          loot.push({ ...item });
        }

        // 添加到背包
        const invItem = this.state.inventory.find(inv => inv.id === item.id);
        if (invItem) {
          invItem.quantity += item.quantity;
        } else {
          this.state.inventory.push({ ...item });
        }
      }
    }

    // 有几率找到武器
    if (Math.random() > 0.7) {
      const weaponTypes = ['knife', 'bat', 'pistol'];
      const weaponId = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
      const weaponTemplate = WEAPONS.find(w => w.id === weaponId);
      if (weaponTemplate && !this.state.weapons.some(w => w.id === weaponId)) {
        this.state.weapons.push({ ...weaponTemplate });
      }
    }

    tile.building.looted = true;
    this.state.score += 50;
    this.callbacks.onStateChange?.(this.state);

    return loot;
  }

  // 使用物品
  public useItem(itemId: string): boolean {
    const item = this.state.inventory.find(i => i.id === itemId);
    if (!item || item.quantity <= 0 || !item.effect) return false;

    switch (item.effect.type) {
      case 'heal':
        this.state.stats.health = Math.min(100, this.state.stats.health + item.effect.value);
        break;
      case 'hunger':
        this.state.stats.hunger = Math.min(100, this.state.stats.hunger + item.effect.value);
        break;
      case 'cure':
        this.state.stats.infection = Math.max(0, this.state.stats.infection - item.effect.value);
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

  public onWaveComplete(callback: (wave: number) => void): void {
    this.callbacks.onWaveComplete = callback;
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
    this.lastZombieSpawn = Date.now();
  }
}

export default ZombieSurvivalEngine;
