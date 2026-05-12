import { NEON_COLORS } from '../../utils/constants';

// Types
export interface Monster {
  id: string;
  type: MonsterType;
  level: number;
  hp: number;
  maxHp: number;
  exp: number;
  expToLevel: number;
  attack: number;
  defense: number;
  isOwned: boolean;
}

export interface MonsterType {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: 'fire' | 'water' | 'grass' | 'electric' | 'normal';
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  catchRate: number; // 0-100
  expReward: number;
}

export interface WildMonster {
  monster: MonsterType;
  level: number;
  x: number;
  y: number;
  appearing: boolean;
  appearedAt: number;
}

export interface BattleResult {
  won: boolean;
  expGained: number;
  captured: boolean;
  rewards: number;
}

export interface PokeMonState {
  coins: number;
  monsters: Monster[];
  wildMonster: WildMonster | null;
  totalCaught: number;
  totalBattles: number;
  totalWins: number;
  gameStarted: boolean;
  lastUpdate: number;
  highScore: number;
  inBattle: boolean;
  battleLog: string[];
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
export const CANVAS_HEIGHT = 600;

export const MONSTER_TYPES: MonsterType[] = [
  { id: 'charmander', name: '小火龙', emoji: '🔴', color: '#ff4500', type: 'fire', baseHp: 50, baseAttack: 15, baseDefense: 10, rarity: 'common', catchRate: 60, expReward: 30 },
  { id: 'squirtle', name: '杰尼龟', emoji: '🔵', color: '#1e90ff', type: 'water', baseHp: 55, baseAttack: 12, baseDefense: 15, rarity: 'common', catchRate: 60, expReward: 30 },
  { id: 'bulbasaur', name: '妙蛙种子', emoji: '🟢', color: '#32cd32', type: 'grass', baseHp: 52, baseAttack: 13, baseDefense: 12, rarity: 'common', catchRate: 60, expReward: 30 },
  { id: 'pikachu', name: '皮卡丘', emoji: '🐭', color: '#ffff00', type: 'electric', baseHp: 45, baseAttack: 18, baseDefense: 8, rarity: 'rare', catchRate: 40, expReward: 50 },
  { id: 'eevee', name: '伊布', emoji: '🟤', color: '#8b4513', type: 'normal', baseHp: 60, baseAttack: 14, baseDefense: 14, rarity: 'rare', catchRate: 40, expReward: 45 },
  { id: 'dragonite', name: '快龙', emoji: '🐉', color: '#ff8c00', type: 'normal', baseHp: 80, baseAttack: 25, baseDefense: 20, rarity: 'epic', catchRate: 20, expReward: 100 },
  { id: 'mewtwo', name: '超梦', emoji: '👽', color: '#9400d3', type: 'normal', baseHp: 90, baseAttack: 30, baseDefense: 22, rarity: 'legendary', catchRate: 5, expReward: 200 },
  { id: 'lugia', name: '洛奇亚', emoji: '🦅', color: '#4169e1', type: 'water', baseHp: 95, baseAttack: 28, baseDefense: 25, rarity: 'legendary', catchRate: 3, expReward: 250 },
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'pokeball', name: '精灵球', emoji: '⚫', price: 20, description: '捕捉野生宝可梦' },
  { id: 'greatball', name: '超级球', emoji: '🔴', price: 50, description: '更高捕捉率' },
  { id: 'ultraball', name: '高级球', emoji: '💜', price: 100, description: '极高捕捉率' },
  { id: 'potion', name: '伤药', emoji: '💊', price: 30, description: '恢复一只宝可梦50HP' },
  { id: 'superpotion', name: '超级伤药', emoji: '💉', price: 80, description: '恢复一只宝可梦150HP' },
  { id: 'healall', name: '全复药', emoji: '🏥', price: 200, description: '恢复所有宝可梦HP' },
];

const TICK_INTERVAL = 100;
const WILD_MONSTER_SPAWN_INTERVAL = 8000;
const WILD_MONSTER_DURATION = 15000;
const MAX_PARTY_SIZE = 6;

export class PokeMonEngine {
  private coins: number;
  private monsters: Monster[];
  private wildMonster: WildMonster | null;
  private totalCaught: number;
  private totalBattles: number;
  private totalWins: number;
  private gameStarted: boolean;
  private lastUpdate: number;
  private highScore: number;
  private inBattle: boolean;
  private battleLog: string[];
  private lastWildSpawn: number;

  constructor() {
    this.reset();
  }

  getState(): PokeMonState {
    return {
      coins: this.coins,
      monsters: this.monsters.map(m => ({ ...m })),
      wildMonster: this.wildMonster ? { ...this.wildMonster, monster: { ...this.wildMonster.monster } } : null,
      totalCaught: this.totalCaught,
      totalBattles: this.totalBattles,
      totalWins: this.totalWins,
      gameStarted: this.gameStarted,
      lastUpdate: this.lastUpdate,
      highScore: this.highScore,
      inBattle: this.inBattle,
      battleLog: [...this.battleLog],
    };
  }

  start(): void {
    this.gameStarted = true;
    this.lastUpdate = Date.now();
    this.lastWildSpawn = Date.now();

    // Give starter monster
    if (this.monsters.length === 0) {
      this.addMonster(MONSTER_TYPES[0]);
    }
  }

  addMonster(type: MonsterType, level: number = 5): Monster {
    const monster: Monster = {
      id: `mon_${Date.now()}_${Math.random()}`,
      type,
      level,
      hp: this.calculateMaxHp(type, level),
      maxHp: this.calculateMaxHp(type, level),
      exp: 0,
      expToLevel: this.calculateExpToLevel(level),
      attack: this.calculateAttack(type, level),
      defense: this.calculateDefense(type, level),
      isOwned: true,
    };
    this.monsters.push(monster);
    return monster;
  }

  private calculateMaxHp(type: MonsterType, level: number): number {
    return Math.floor(type.baseHp + (level - 1) * 5);
  }

  private calculateAttack(type: MonsterType, level: number): number {
    return Math.floor(type.baseAttack + (level - 1) * 2);
  }

  private calculateDefense(type: MonsterType, level: number): number {
    return Math.floor(type.baseDefense + (level - 1) * 1.5);
  }

  private calculateExpToLevel(level: number): number {
    return Math.floor(50 * Math.pow(1.5, level - 1));
  }

  spawnWildMonster(): void {
    const now = Date.now();
    if (this.wildMonster || now - this.lastWildSpawn < WILD_MONSTER_SPAWN_INTERVAL) {
      return;
    }

    // Select random monster type (weighted by rarity)
    const roll = Math.random();
    let monsterType: MonsterType;
    if (roll < 0.5) {
      monsterType = MONSTER_TYPES[Math.floor(Math.random() * 3)]; // common
    } else if (roll < 0.8) {
      monsterType = MONSTER_TYPES[Math.floor(Math.random() * 2) + 3]; // rare
    } else if (roll < 0.95) {
      monsterType = MONSTER_TYPES[5]; // epic
    } else {
      monsterType = MONSTER_TYPES[Math.floor(Math.random() * 2) + 6]; // legendary
    }

    const level = Math.max(1, Math.floor(Math.random() * 10));

    this.wildMonster = {
      monster: monsterType,
      level,
      x: Math.random() * (CANVAS_WIDTH - 100) + 50,
      y: Math.random() * (CANVAS_HEIGHT - 200) + 100,
      appearing: true,
      appearedAt: now,
    };

    this.lastWildSpawn = now;
  }

  private getEffectiveCatchRate(monsterType: MonsterType, ballType: string): number {
    let rate = monsterType.catchRate;

    switch (ballType) {
      case 'pokeball': rate = monsterType.catchRate; break;
      case 'greatball': rate = Math.min(90, monsterType.catchRate + 25); break;
      case 'ultraball': rate = Math.min(95, monsterType.catchRate + 40); break;
    }

    // HP factor
    if (this.wildMonster) {
      const hpRatio = this.wildMonster.level * 5 / this.calculateMaxHp(monsterType, this.wildMonster.level);
      rate = Math.floor(rate * (2 - hpRatio));
    }

    return Math.min(95, Math.max(5, rate));
  }

  tryCatch(ballType: string): { success: boolean; message: string } {
    if (!this.wildMonster) {
      return { success: false, message: '没有野生宝可梦!' };
    }

    const ballPrice = ballType === 'pokeball' ? 20 : ballType === 'greatball' ? 50 : 100;
    if (this.coins < ballPrice) {
      return { success: false, message: '金币不足!' };
    }

    this.coins -= ballPrice;
    this.inBattle = true;

    const catchRate = this.getEffectiveCatchRate(this.wildMonster.monster, ballType);
    const roll = Math.random() * 100;

    if (roll < catchRate) {
      // Caught!
      const newMonster = this.addMonster(this.wildMonster.monster, this.wildMonster.level);
      this.totalCaught++;
      this.highScore = Math.max(this.highScore, this.totalCaught);
      this.battleLog.push(`捕获了 ${newMonster.type.name}!`);
      this.wildMonster = null;
      this.inBattle = false;
      return { success: true, message: `捕获成功!` };
    } else {
      this.battleLog.push(`${this.wildMonster.monster.name}挣脱了!`);
      return { success: false, message: '捕捉失败!' };
    }
  }

  attackWild(): BattleResult | null {
    if (!this.wildMonster || this.monsters.length === 0) return null;

    this.inBattle = true;
    const playerMonster = this.monsters[0];
    const wildHp = this.calculateMaxHp(this.wildMonster.monster, this.wildMonster.level);
    const wildAttack = this.calculateAttack(this.wildMonster.monster, this.wildMonster.level);
    const wildDefense = this.calculateDefense(this.wildMonster.monster, this.wildMonster.level);

    // Calculate damage
    const playerDamage = Math.max(1, playerMonster.attack - wildDefense / 2 + Math.floor(Math.random() * 5));
    const wildDamage = Math.max(1, wildAttack - playerMonster.defense / 2 + Math.floor(Math.random() * 5));

    // Apply damage to wild monster
    const remainingWildHp = wildHp - playerDamage;
    this.battleLog.push(`${playerMonster.type.name}造成了 ${playerDamage} 点伤害!`);

    if (remainingWildHp <= 0) {
      // Won!
      const expReward = Math.floor(this.wildMonster.monster.expReward * (this.wildMonster.level / 5));
      playerMonster.exp += expReward;
      this.totalWins++;
      this.totalBattles++;

      // Level up check
      if (playerMonster.exp >= playerMonster.expToLevel) {
        playerMonster.level++;
        playerMonster.exp -= playerMonster.expToLevel;
        playerMonster.expToLevel = this.calculateExpToLevel(playerMonster.level);
        playerMonster.maxHp = this.calculateMaxHp(playerMonster.type, playerMonster.level);
        playerMonster.hp = playerMonster.maxHp;
        playerMonster.attack = this.calculateAttack(playerMonster.type, playerMonster.level);
        playerMonster.defense = this.calculateDefense(playerMonster.type, playerMonster.level);
        this.battleLog.push(`${playerMonster.type.name}升级了! 现在是 Lv.${playerMonster.level}`);
      }

      const result: BattleResult = {
        won: true,
        expGained: expReward,
        captured: false,
        rewards: this.wildMonster.level * 10,
      };

      this.coins += result.rewards;
      this.battleLog.push(`获得了 ${result.rewards} 金币!`);
      this.wildMonster = null;
      this.inBattle = false;
      return result;
    }

    // Wild monster counterattacks
    playerMonster.hp = Math.max(0, playerMonster.hp - wildDamage);
    this.battleLog.push(`${this.wildMonster.monster.name}造成了 ${wildDamage} 点伤害!`);

    if (playerMonster.hp <= 0) {
      // Player monster fainted
      this.battleLog.push(`${playerMonster.type.name}倒下了!`);
      this.totalBattles++;
      this.inBattle = false;
      return {
        won: false,
        expGained: 0,
        captured: false,
        rewards: 0,
      };
    }

    return null;
  }

  usePotion(monsterIndex: number): boolean {
    if (this.coins < 30) return false;
    if (monsterIndex < 0 || monsterIndex >= this.monsters.length) return false;

    this.coins -= 30;
    const monster = this.monsters[monsterIndex];
    monster.hp = Math.min(monster.maxHp, monster.hp + 50);
    return true;
  }

  useSuperPotion(monsterIndex: number): boolean {
    if (this.coins < 80) return false;
    if (monsterIndex < 0 || monsterIndex >= this.monsters.length) return false;

    this.coins -= 80;
    const monster = this.monsters[monsterIndex];
    monster.hp = Math.min(monster.maxHp, monster.hp + 150);
    return true;
  }

  healAll(): boolean {
    if (this.coins < 200) return false;

    this.coins -= 200;
    this.monsters.forEach(m => {
      m.hp = m.maxHp;
    });
    return true;
  }

  private tick(): void {
    const now = Date.now();
    this.lastUpdate = now;

    // Check wild monster timeout
    if (this.wildMonster && !this.inBattle) {
      const elapsed = now - this.wildMonster.appearedAt;
      if (elapsed > WILD_MONSTER_DURATION) {
        this.battleLog.push(`${this.wildMonster.monster.name}逃走了...`);
        this.wildMonster = null;
      }
    }

    // Spawn new wild monsters
    if (!this.wildMonster && !this.inBattle) {
      this.spawnWildMonster();
    }
  }

  runAway(): boolean {
    if (!this.wildMonster) return false;
    this.wildMonster = null;
    this.inBattle = false;
    this.battleLog.push('成功逃跑了!');
    return true;
  }

  getPartyMonsters(): Monster[] {
    return this.monsters.filter(m => m.isOwned);
  }

  getWildMonster(): WildMonster | null {
    return this.wildMonster;
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getShopItems() {
    return SHOP_ITEMS;
  }

  getMonsterTypes() {
    return MONSTER_TYPES;
  }

  reset(): void {
    this.coins = 100;
    this.monsters = [];
    this.wildMonster = null;
    this.totalCaught = 0;
    this.totalBattles = 0;
    this.totalWins = 0;
    this.gameStarted = false;
    this.lastUpdate = Date.now();
    this.highScore = 0;
    this.inBattle = false;
    this.battleLog = ['欢迎来到宝可梦世界!'];
    this.lastWildSpawn = 0;
  }

  save(): string {
    return JSON.stringify(this.getState());
  }

  load(json: string): boolean {
    try {
      const state = JSON.parse(json) as PokeMonState;
      this.coins = state.coins;
      this.monsters = state.monsters;
      this.wildMonster = state.wildMonster;
      this.totalCaught = state.totalCaught;
      this.totalBattles = state.totalBattles;
      this.totalWins = state.totalWins;
      this.gameStarted = state.gameStarted;
      this.highScore = state.highScore;
      this.inBattle = state.inBattle;
      this.battleLog = state.battleLog;
      return true;
    } catch {
      return false;
    }
  }
}
