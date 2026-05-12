// 登山者游戏引擎
// Mountain Climber Game Engine

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
  rock: '#8b7355',
  snow: '#ffffff',
  ice: '#00ffff',
  cliff: '#4a4a4a',
  rope: '#8b4513',
  sky: '#1a3a5c'
};

export interface ClimberStats {
  stamina: number;
  grip: number;      // 抓握力
  warmth: number;    // 体温
  oxygen: number;    // 氧气
}

export interface Equipment {
  id: string;
  name: string;
  type: 'rope' | 'pickaxe' | 'boots' | 'gloves' | 'goggles' | 'oxygen';
  durability: number;
  maxDurability: number;
  effect: { type: string; value: number };
  icon: string;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  type: 'rock' | 'ice' | 'gap' | 'avalanche' | 'storm';
  difficulty: number;
  passed: boolean;
}

export interface RoutePoint {
  x: number;
  y: number;
  elevation: number;
  type: 'normal' | 'rest' | 'checkpoint' | 'summit';
  visited: boolean;
}

export interface GameState {
  stats: ClimberStats;
  position: { x: number; y: number; elevation: number };
  equipment: Equipment[];
  equippedItems: Equipment[];
  route: RoutePoint[];
  obstacles: Obstacle[];
  score: number;
  altitude: number;
  distance: number;
  gameOver: boolean;
  victory: boolean;
  weather: 'clear' | 'windy' | 'snowy' | 'storm';
  weatherTimer: number;
}

export interface GameConfig {
  mountainHeight: number;
  baseDifficulty: number;
  weatherChangeInterval: number;
}

const DEFAULT_CONFIG: GameConfig = {
  mountainHeight: 8848, // 珠穆朗玛峰高度
  baseDifficulty: 1,
  weatherChangeInterval: 30 // 秒
};

const EQUIPMENT_LIST: Equipment[] = [
  { id: 'rope', name: '登山绳', type: 'rope', durability: 100, maxDurability: 100, effect: { type: 'safety', value: 50 }, icon: '🪢' },
  { id: 'pickaxe', name: '冰镐', type: 'pickaxe', durability: 100, maxDurability: 100, effect: { type: 'climb', value: 30 }, icon: '⛏️' },
  { id: 'boots', name: '登山靴', type: 'boots', durability: 100, maxDurability: 100, effect: { type: 'grip', value: 20 }, icon: '🥾' },
  { id: 'gloves', name: '保暖手套', type: 'gloves', durability: 100, maxDurability: 100, effect: { type: 'warmth', value: 15 }, icon: '🧤' },
  { id: 'goggles', name: '护目镜', type: 'goggles', durability: 100, maxDurability: 100, effect: { type: 'vision', value: 25 }, icon: '🥽' },
  { id: 'oxygen', name: '氧气瓶', type: 'oxygen', durability: 100, maxDurability: 100, effect: { type: 'oxygen', value: 50 }, icon: '🫁' }
];

export class MountainClimberEngine {
  private state: GameState;
  private config: GameConfig;
  private lastUpdate: number;
  private callbacks: {
    onStateChange?: (state: GameState) => void;
    onGameOver?: (score: number) => void;
    onVictory?: (score: number) => void;
    onCheckpoint?: (altitude: number) => void;
  } = {};

  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.initializeGame();
    this.lastUpdate = Date.now();
  }

  private initializeGame(): GameState {
    return {
      stats: {
        stamina: 100,
        grip: 100,
        warmth: 100,
        oxygen: 100
      },
      position: { x: 0, y: 0, elevation: 0 },
      equipment: [
        { ...EQUIPMENT_LIST[0] },
        { ...EQUIPMENT_LIST[1] },
        { ...EQUIPMENT_LIST[2] }
      ],
      equippedItems: [],
      route: this.generateRoute(),
      obstacles: this.generateObstacles(),
      score: 0,
      altitude: 0,
      distance: 0,
      gameOver: false,
      victory: false,
      weather: 'clear',
      weatherTimer: 0
    };
  }

  private generateRoute(): RoutePoint[] {
    const route: RoutePoint[] = [];
    const segments = 50;

    for (let i = 0; i <= segments; i++) {
      const elevation = (i / segments) * this.config.mountainHeight;
      const type: RoutePoint['type'] = 
        i === 0 ? 'normal' :
        i === segments ? 'summit' :
        i % 10 === 0 ? 'checkpoint' :
        i % 5 === 0 ? 'rest' : 'normal';

      route.push({
        x: i * 2,
        y: Math.sin(i * 0.5) * 5 + i * 0.5,
        elevation,
        type,
        visited: i === 0
      });
    }

    return route;
  }

  private generateObstacles(): Obstacle[] {
    const obstacles: Obstacle[] = [];
    const types: Obstacle['type'][] = ['rock', 'ice', 'gap', 'avalanche', 'storm'];

    for (let i = 0; i < 20; i++) {
      const routeIndex = Math.floor(Math.random() * (this.state.route.length - 10)) + 5;
      const routePoint = this.state.route[routeIndex];

      obstacles.push({
        id: `obstacle_${i}`,
        x: routePoint.x + (Math.random() - 0.5) * 2,
        y: routePoint.y + (Math.random() - 0.5) * 2,
        type: types[Math.floor(Math.random() * types.length)],
        difficulty: Math.floor(Math.random() * 5) + 1,
        passed: false
      });
    }

    return obstacles;
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
    // 天气影响
    this.state.weatherTimer += deltaTime;
    if (this.state.weatherTimer >= this.config.weatherChangeInterval) {
      this.changeWeather();
      this.state.weatherTimer = 0;
    }

    // 天气效果
    switch (this.state.weather) {
      case 'windy':
        this.state.stats.grip = Math.max(0, this.state.stats.grip - 2 * deltaTime);
        break;
      case 'snowy':
        this.state.stats.warmth = Math.max(0, this.state.stats.warmth - 3 * deltaTime);
        this.state.stats.grip = Math.max(0, this.state.stats.grip - 1 * deltaTime);
        break;
      case 'storm':
        this.state.stats.warmth = Math.max(0, this.state.stats.warmth - 5 * deltaTime);
        this.state.stats.grip = Math.max(0, this.state.stats.grip - 3 * deltaTime);
        this.state.stats.oxygen = Math.max(0, this.state.stats.oxygen - 2 * deltaTime);
        break;
    }

    // 海拔影响
    if (this.state.altitude > 3000) {
      this.state.stats.oxygen = Math.max(0, this.state.stats.oxygen - 0.5 * deltaTime);
    }
    if (this.state.altitude > 5000) {
      this.state.stats.warmth = Math.max(0, this.state.stats.warmth - 1 * deltaTime);
    }

    // 装备效果
    this.state.equippedItems.forEach(item => {
      switch (item.effect.type) {
        case 'warmth':
          this.state.stats.warmth = Math.min(100, this.state.stats.warmth + item.effect.value * 0.01);
          break;
        case 'grip':
          this.state.stats.grip = Math.min(100, this.state.stats.grip + item.effect.value * 0.01);
          break;
        case 'oxygen':
          this.state.stats.oxygen = Math.min(100, this.state.stats.oxygen + item.effect.value * 0.01);
          break;
      }
      
      // 装备耐久消耗
      item.durability -= deltaTime * 0.5;
    });

    // 移除损坏装备
    this.state.equippedItems = this.state.equippedItems.filter(item => item.durability > 0);

    // 检查游戏结束条件
    if (this.state.stats.stamina <= 0 || this.state.stats.warmth <= 0 || this.state.stats.oxygen <= 0) {
      this.state.gameOver = true;
      this.callbacks.onGameOver?.(this.state.score);
    }

    // 检查胜利条件
    if (this.state.altitude >= this.config.mountainHeight) {
      this.state.victory = true;
      this.state.score += 10000;
      this.callbacks.onVictory?.(this.state.score);
    }

    this.callbacks.onStateChange?.(this.state);
  }

  private changeWeather(): void {
    const weathers: GameState['weather'][] = ['clear', 'windy', 'snowy', 'storm'];
    const weights = [0.5, 0.25, 0.2, 0.05];
    
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < weathers.length; i++) {
      cumulative += weights[i];
      if (rand <= cumulative) {
        this.state.weather = weathers[i];
        break;
      }
    }
  }

  // 攀爬
  public climb(direction: 'up' | 'down' | 'left' | 'right'): { success: boolean; message: string } {
    if (this.state.gameOver || this.state.victory) return { success: false, message: '游戏已结束' };
    if (this.state.stats.stamina < 10) return { success: false, message: '体力不足' };

    let elevationGain = 0;
    let distanceGain = 0;

    switch (direction) {
      case 'up':
        elevationGain = 50 + Math.random() * 50;
        distanceGain = 10;
        break;
      case 'down':
        elevationGain = -30;
        distanceGain = 5;
        break;
      case 'left':
      case 'right':
        distanceGain = 15;
        elevationGain = 10;
        break;
    }

    // 计算难度
    const difficulty = this.calculateDifficulty();
    const staminaCost = 10 * difficulty;

    if (this.state.stats.stamina < staminaCost) {
      return { success: false, message: '体力不足以攀爬' };
    }

    // 消耗体力
    this.state.stats.stamina -= staminaCost;
    this.state.stats.grip = Math.max(0, this.state.stats.grip - 2);

    // 更新位置
    this.state.altitude = Math.max(0, this.state.altitude + elevationGain);
    this.state.distance += distanceGain;

    // 更新坐标
    if (direction === 'up') this.state.position.y += 1;
    if (direction === 'down') this.state.position.y -= 1;
    if (direction === 'left') this.state.position.x -= 1;
    if (direction === 'right') this.state.position.x += 1;

    // 检查是否到达检查点
    const checkpoint = this.state.route.find(r => 
      r.type === 'checkpoint' && 
      Math.abs(r.elevation - this.state.altitude) < 100 &&
      !r.visited
    );
    if (checkpoint) {
      checkpoint.visited = true;
      this.state.score += 500;
      this.callbacks.onCheckpoint?.(this.state.altitude);
      return { success: true, message: `到达检查点！海拔 ${Math.floor(this.state.altitude)}m` };
    }

    // 检查障碍物
    const obstacle = this.checkObstacle();
    if (obstacle) {
      return this.handleObstacle(obstacle);
    }

    // 增加分数
    this.state.score += Math.floor(elevationGain);

    this.callbacks.onStateChange?.(this.state);
    return { success: true, message: `攀爬成功！海拔 ${Math.floor(this.state.altitude)}m` };
  }

  private calculateDifficulty(): number {
    let difficulty = 1 + (this.state.altitude / this.config.mountainHeight) * 2;

    // 天气影响
    switch (this.state.weather) {
      case 'windy': difficulty *= 1.2; break;
      case 'snowy': difficulty *= 1.5; break;
      case 'storm': difficulty *= 2; break;
    }

    // 装备加成
    const hasPickaxe = this.state.equippedItems.some(i => i.type === 'pickaxe');
    const hasBoots = this.state.equippedItems.some(i => i.type === 'boots');
    
    if (hasPickaxe) difficulty *= 0.8;
    if (hasBoots) difficulty *= 0.9;

    return difficulty;
  }

  private checkObstacle(): Obstacle | null {
    return this.state.obstacles.find(o => 
      !o.passed &&
      Math.abs(o.x - this.state.position.x) < 2 &&
      Math.abs(o.y - this.state.position.y) < 2
    ) || null;
  }

  private handleObstacle(obstacle: Obstacle): { success: boolean; message: string } {
    const hasRope = this.state.equippedItems.some(i => i.type === 'rope');
    const hasGoggles = this.state.equippedItems.some(i => i.type === 'goggles');

    switch (obstacle.type) {
      case 'rock':
        if (hasRope) {
          obstacle.passed = true;
          this.state.score += 100;
          return { success: true, message: '使用绳索越过岩石！' };
        }
        this.state.stats.stamina -= 20;
        return { success: false, message: '岩石阻挡！需要绳索' };

      case 'ice':
        const hasPickaxe = this.state.equippedItems.some(i => i.type === 'pickaxe');
        if (hasPickaxe) {
          obstacle.passed = true;
          this.state.score += 150;
          return { success: true, message: '使用冰镐攀爬冰壁！' };
        }
        this.state.stats.grip -= 30;
        return { success: false, message: '冰壁太滑！需要冰镐' };

      case 'gap':
        if (hasRope) {
          obstacle.passed = true;
          this.state.score += 200;
          return { success: true, message: '使用绳索越过裂缝！' };
        }
        this.state.stats.stamina -= 30;
        return { success: false, message: '裂缝太宽！需要绳索' };

      case 'avalanche':
        if (hasGoggles) {
          obstacle.passed = true;
          this.state.score += 300;
          return { success: true, message: '在雪崩中保持视野！' };
        }
        this.state.stats.warmth -= 40;
        this.state.stats.stamina -= 40;
        return { success: false, message: '遭遇雪崩！' };

      case 'storm':
        this.state.stats.warmth -= 20;
        this.state.stats.grip -= 20;
        return { success: false, message: '遭遇暴风雪！' };

      default:
        return { success: true, message: '通过障碍' };
    }
  }

  // 休息
  public rest(): { success: boolean; message: string } {
    if (this.state.gameOver || this.state.victory) return { success: false, message: '游戏已结束' };

    // 检查是否在休息点
    const isRestPoint = this.state.route.some(r => 
      r.type === 'rest' && 
      Math.abs(r.elevation - this.state.altitude) < 50
    );

    const recoveryRate = isRestPoint ? 2 : 1;

    this.state.stats.stamina = Math.min(100, this.state.stats.stamina + 30 * recoveryRate);
    this.state.stats.grip = Math.min(100, this.state.stats.grip + 20 * recoveryRate);
    this.state.stats.warmth = Math.min(100, this.state.stats.warmth + 10 * recoveryRate);

    if (this.state.altitude < 3000) {
      this.state.stats.oxygen = Math.min(100, this.state.stats.oxygen + 20 * recoveryRate);
    }

    this.callbacks.onStateChange?.(this.state);
    return { 
      success: true, 
      message: isRestPoint ? '在安全点休息，恢复大量体力！' : '休息片刻，恢复体力' 
    };
  }

  // 装备物品
  public equipItem(itemId: string): boolean {
    const item = this.state.equipment.find(e => e.id === itemId);
    if (!item || item.durability <= 0) return false;

    // 检查是否已装备
    const alreadyEquipped = this.state.equippedItems.some(e => e.id === itemId);
    if (alreadyEquipped) {
      this.state.equippedItems = this.state.equippedItems.filter(e => e.id !== itemId);
    } else {
      // 检查同类型装备
      const sameType = this.state.equippedItems.find(e => e.type === item.type);
      if (sameType) {
        this.state.equippedItems = this.state.equippedItems.filter(e => e.id !== sameType.id);
      }
      this.state.equippedItems.push(item);
    }

    this.callbacks.onStateChange?.(this.state);
    return true;
  }

  // 使用补给
  public useSupply(): { success: boolean; message: string } {
    if (this.state.stats.stamina >= 80) {
      return { success: false, message: '体力充足，不需要补给' };
    }

    this.state.stats.stamina = Math.min(100, this.state.stats.stamina + 50);
    this.state.score -= 50; // 使用补给扣分

    this.callbacks.onStateChange?.(this.state);
    return { success: true, message: '使用补给，恢复体力' };
  }

  // 获取当前进度百分比
  public getProgress(): number {
    return (this.state.altitude / this.config.mountainHeight) * 100;
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

  public onCheckpoint(callback: (altitude: number) => void): void {
    this.callbacks.onCheckpoint = callback;
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

export default MountainClimberEngine;
