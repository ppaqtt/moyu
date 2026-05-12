import { useState, useEffect, useCallback, useRef } from 'react';

// 游戏配置
const GAME_CONFIG = {
  TICK_RATE: 100,
  OFFLINE_MAX_HOURS: 24,
  SAVE_KEY: 'dungeon_idle_save',
};

// 英雄类型
export interface Hero {
  id: string;
  name: string;
  class: 'warrior' | 'mage' | 'archer' | 'healer';
  level: number;
  exp: number;
  maxExp: number;
  attack: number;
  defense: number;
  hp: number;
  maxHp: number;
  unlocked: boolean;
  unlockCost: number;
  icon: string;
  color: string;
  autoAttack: boolean;
}

// 装备类型
export interface Equipment {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory';
  level: number;
  attackBonus: number;
  defenseBonus: number;
  hpBonus: number;
  cost: number;
  costMultiplier: number;
  icon: string;
}

// 地牢层级
export interface DungeonFloor {
  id: number;
  name: string;
  monsterName: string;
  monsterIcon: string;
  monsterHp: number;
  monsterMaxHp: number;
  monsterAttack: number;
  goldReward: number;
  expReward: number;
  cleared: boolean;
  color: string;
}

// 技能类型
export interface Skill {
  id: string;
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  effect: string;
  multiplier: number;
  icon: string;
}

// 成就
export interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  requirementType: 'gold' | 'floor' | 'hero_level' | 'kill';
  unlocked: boolean;
  reward: number;
}

// 游戏状态
export interface GameState {
  gold: number;
  totalGold: number;
  totalKills: number;
  currentFloor: number;
  maxFloor: number;
  heroes: Hero[];
  equipments: Equipment[];
  floors: DungeonFloor[];
  skills: Skill[];
  achievements: Achievement[];
  lastSaveTime: number;
  startTime: number;
}

// 初始英雄
const INITIAL_HEROES: Hero[] = [
  {
    id: 'warrior',
    name: '战士',
    class: 'warrior',
    level: 1,
    exp: 0,
    maxExp: 100,
    attack: 10,
    defense: 5,
    hp: 100,
    maxHp: 100,
    unlocked: true,
    unlockCost: 0,
    icon: '⚔️',
    color: '#DC143C',
    autoAttack: true,
  },
  {
    id: 'mage',
    name: '法师',
    class: 'mage',
    level: 1,
    exp: 0,
    maxExp: 100,
    attack: 20,
    defense: 2,
    hp: 60,
    maxHp: 60,
    unlocked: false,
    unlockCost: 500,
    icon: '🔮',
    color: '#4169E1',
    autoAttack: false,
  },
  {
    id: 'archer',
    name: '弓箭手',
    class: 'archer',
    level: 1,
    exp: 0,
    maxExp: 100,
    attack: 15,
    defense: 3,
    hp: 70,
    maxHp: 70,
    unlocked: false,
    unlockCost: 1500,
    icon: '🏹',
    color: '#32CD32',
    autoAttack: false,
  },
  {
    id: 'healer',
    name: '牧师',
    class: 'healer',
    level: 1,
    exp: 0,
    maxExp: 100,
    attack: 5,
    defense: 4,
    hp: 80,
    maxHp: 80,
    unlocked: false,
    unlockCost: 3000,
    icon: '✨',
    color: '#FFD700',
    autoAttack: false,
  },
];

// 初始装备
const INITIAL_EQUIPMENTS: Equipment[] = [
  {
    id: 'sword',
    name: '铁剑',
    type: 'weapon',
    level: 0,
    attackBonus: 5,
    defenseBonus: 0,
    hpBonus: 0,
    cost: 100,
    costMultiplier: 1.3,
    icon: '🗡️',
  },
  {
    id: 'armor',
    name: '皮甲',
    type: 'armor',
    level: 0,
    attackBonus: 0,
    defenseBonus: 3,
    hpBonus: 20,
    cost: 150,
    costMultiplier: 1.35,
    icon: '🛡️',
  },
  {
    id: 'ring',
    name: '力量戒指',
    type: 'accessory',
    level: 0,
    attackBonus: 3,
    defenseBonus: 2,
    hpBonus: 10,
    cost: 300,
    costMultiplier: 1.4,
    icon: '💍',
  },
  {
    id: 'staff',
    name: '法杖',
    type: 'weapon',
    level: 0,
    attackBonus: 8,
    defenseBonus: 0,
    hpBonus: 0,
    cost: 250,
    costMultiplier: 1.3,
    icon: '🪄',
  },
  {
    id: 'bow',
    name: '长弓',
    type: 'weapon',
    level: 0,
    attackBonus: 7,
    defenseBonus: 0,
    hpBonus: 0,
    cost: 400,
    costMultiplier: 1.3,
    icon: '🏹',
  },
];

// 生成地牢层级
function generateFloors(): DungeonFloor[] {
  const floors: DungeonFloor[] = [];
  const monsters = [
    { name: '史莱姆', icon: '🟢', color: '#32CD32' },
    { name: '哥布林', icon: '👺', color: '#228B22' },
    { name: '骷髅', icon: '💀', color: '#F5F5F5' },
    { name: '僵尸', icon: '🧟', color: '#556B2F' },
    { name: '兽人', icon: '👹', color: '#8B4513' },
    { name: '幽灵', icon: '👻', color: '#E6E6FA' },
    { name: '吸血鬼', icon: '🧛', color: '#8B0000' },
    { name: '恶魔', icon: '👿', color: '#DC143C' },
    { name: '巨龙', icon: '🐉', color: '#FF4500' },
    { name: '魔王', icon: '👹', color: '#4B0082' },
  ];
  
  for (let i = 1; i <= 100; i++) {
    const monsterIndex = Math.min(Math.floor((i - 1) / 10), monsters.length - 1);
    const monster = monsters[monsterIndex];
    const multiplier = Math.pow(1.2, i - 1);
    
    floors.push({
      id: i,
      name: `第 ${i} 层`,
      monsterName: monster.name,
      monsterIcon: monster.icon,
      monsterHp: Math.floor(50 * multiplier),
      monsterMaxHp: Math.floor(50 * multiplier),
      monsterAttack: Math.floor(5 * multiplier),
      goldReward: Math.floor(10 * multiplier),
      expReward: Math.floor(20 * multiplier),
      cleared: i === 1 ? false : true,
      color: monster.color,
    });
  }
  
  return floors;
}

// 初始技能
const INITIAL_SKILLS: Skill[] = [
  {
    id: 'attack_boost',
    name: '攻击强化',
    description: '所有英雄攻击力 +20%',
    cost: 500,
    level: 0,
    maxLevel: 20,
    effect: 'attack',
    multiplier: 1.2,
    icon: '⚔️',
  },
  {
    id: 'defense_boost',
    name: '防御强化',
    description: '所有英雄防御力 +20%',
    cost: 500,
    level: 0,
    maxLevel: 20,
    effect: 'defense',
    multiplier: 1.2,
    icon: '🛡️',
  },
  {
    id: 'hp_boost',
    name: '生命强化',
    description: '所有英雄生命值 +25%',
    cost: 600,
    level: 0,
    maxLevel: 20,
    effect: 'hp',
    multiplier: 1.25,
    icon: '❤️',
  },
  {
    id: 'gold_boost',
    name: '财富祝福',
    description: '金币获取 +50%',
    cost: 1000,
    level: 0,
    maxLevel: 10,
    effect: 'gold',
    multiplier: 1.5,
    icon: '💰',
  },
  {
    id: 'exp_boost',
    name: '经验加成',
    description: '经验获取 +50%',
    cost: 1000,
    level: 0,
    maxLevel: 10,
    effect: 'exp',
    multiplier: 1.5,
    icon: '⭐',
  },
];

// 初始成就
const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'gold_100', name: '小富翁', description: '获得 100 金币', requirement: 100, requirementType: 'gold', unlocked: false, reward: 50 },
  { id: 'gold_1000', name: '富翁', description: '获得 1000 金币', requirement: 1000, requirementType: 'gold', unlocked: false, reward: 500 },
  { id: 'gold_10000', name: '大财主', description: '获得 10000 金币', requirement: 10000, requirementType: 'gold', unlocked: false, reward: 5000 },
  { id: 'floor_5', name: '地下城探险者', description: '到达第 5 层', requirement: 5, requirementType: 'floor', unlocked: false, reward: 200 },
  { id: 'floor_20', name: '地下城勇士', description: '到达第 20 层', requirement: 20, requirementType: 'floor', unlocked: false, reward: 1000 },
  { id: 'floor_50', name: '地下城大师', description: '到达第 50 层', requirement: 50, requirementType: 'floor', unlocked: false, reward: 5000 },
  { id: 'kill_10', name: '新手猎人', description: '击败 10 个怪物', requirement: 10, requirementType: 'kill', unlocked: false, reward: 100 },
  { id: 'kill_100', name: '怪物猎人', description: '击败 100 个怪物', requirement: 100, requirementType: 'kill', unlocked: false, reward: 1000 },
  { id: 'hero_level_10', name: '英雄训练师', description: '英雄总等级达到 10', requirement: 10, requirementType: 'hero_level', unlocked: false, reward: 500 },
];

// 格式化数字
export function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return Math.floor(num).toString();
}

// 计算装备升级成本
export function calculateEquipmentCost(equipment: Equipment): number {
  return Math.floor(equipment.cost * Math.pow(equipment.costMultiplier, equipment.level));
}

// 计算技能升级成本
export function calculateSkillCost(skill: Skill): number {
  return Math.floor(skill.cost * Math.pow(1.5, skill.level));
}

// 游戏引擎 Hook
export function useDungeonEngine() {
  const [state, setState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(GAME_CONFIG.SAVE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const now = Date.now();
          
          // 计算离线收益
          const offlineTime = Math.min(
            (now - parsed.lastSaveTime) / 1000,
            GAME_CONFIG.OFFLINE_MAX_HOURS * 3600
          );
          
          let offlineGold = 0;
          const currentFloor = parsed.floors?.find((f: DungeonFloor) => f.id === parsed.currentFloor);
          if (currentFloor && parsed.heroes) {
            const unlockedHeroes = parsed.heroes.filter((h: Hero) => h.unlocked);
            const totalAttack = unlockedHeroes.reduce((sum: number, h: Hero) => sum + h.attack, 0);
            const damagePerSecond = totalAttack * 0.5; // 离线效率减半
            const kills = Math.floor((damagePerSecond * offlineTime) / currentFloor.monsterMaxHp);
            offlineGold = kills * currentFloor.goldReward * 0.5;
          }
          
          return {
            ...parsed,
            gold: (parsed.gold || 0) + offlineGold,
            totalGold: (parsed.totalGold || 0) + offlineGold,
            lastSaveTime: now,
            heroes: parsed.heroes || INITIAL_HEROES,
            equipments: parsed.equipments || INITIAL_EQUIPMENTS,
            floors: parsed.floors || generateFloors(),
            skills: parsed.skills || INITIAL_SKILLS,
            achievements: parsed.achievements || INITIAL_ACHIEVEMENTS,
          };
        } catch {
          // 解析失败
        }
      }
    }
    
    return {
      gold: 0,
      totalGold: 0,
      totalKills: 0,
      currentFloor: 1,
      maxFloor: 1,
      heroes: JSON.parse(JSON.stringify(INITIAL_HEROES)),
      equipments: JSON.parse(JSON.stringify(INITIAL_EQUIPMENTS)),
      floors: generateFloors(),
      skills: JSON.parse(JSON.stringify(INITIAL_SKILLS)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      lastSaveTime: Date.now(),
      startTime: Date.now(),
    };
  });

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // 获取总攻击力
  const getTotalAttack = useCallback(() => {
    let baseAttack = state.heroes
      .filter(h => h.unlocked)
      .reduce((sum, h) => sum + h.attack, 0);
    
    // 装备加成
    state.equipments.forEach(eq => {
      baseAttack += eq.attackBonus * eq.level;
    });
    
    // 技能加成
    const attackSkill = state.skills.find(s => s.id === 'attack_boost');
    if (attackSkill && attackSkill.level > 0) {
      baseAttack *= Math.pow(attackSkill.multiplier, attackSkill.level);
    }
    
    return Math.floor(baseAttack);
  }, [state.heroes, state.equipments, state.skills]);

  // 获取金币倍率
  const getGoldMultiplier = useCallback(() => {
    const goldSkill = state.skills.find(s => s.id === 'gold_boost');
    if (goldSkill && goldSkill.level > 0) {
      return Math.pow(goldSkill.multiplier, goldSkill.level);
    }
    return 1;
  }, [state.skills]);

  // 获取经验倍率
  const getExpMultiplier = useCallback(() => {
    const expSkill = state.skills.find(s => s.id === 'exp_boost');
    if (expSkill && expSkill.level > 0) {
      return Math.pow(expSkill.multiplier, expSkill.level);
    }
    return 1;
  }, [state.skills]);

  // 点击攻击
  const clickAttack = useCallback(() => {
    setState(prev => {
      const currentFloorData = prev.floors.find(f => f.id === prev.currentFloor);
      if (!currentFloorData) return prev;
      
      const damage = getTotalAttack();
      let newMonsterHp = currentFloorData.monsterHp - damage;
      let newGold = prev.gold;
      let newTotalGold = prev.totalGold;
      let newTotalKills = prev.totalKills;
      let newFloors = [...prev.floors];
      let newCurrentFloor = prev.currentFloor;
      let newMaxFloor = prev.maxFloor;
      let newHeroes = [...prev.heroes];
      
      if (newMonsterHp <= 0) {
        // 怪物死亡
        const goldMultiplier = getGoldMultiplier();
        const expMultiplier = getExpMultiplier();
        const goldReward = Math.floor(currentFloorData.goldReward * goldMultiplier);
        const expReward = Math.floor(currentFloorData.expReward * expMultiplier);
        
        newGold += goldReward;
        newTotalGold += goldReward;
        newTotalKills += 1;
        
        // 分配经验
        newHeroes = newHeroes.map(h => {
          if (!h.unlocked) return h;
          let newExp = h.exp + expReward;
          let newLevel = h.level;
          let newMaxExp = h.maxExp;
          let newAttack = h.attack;
          let newDefense = h.defense;
          let newMaxHp = h.maxHp;
          
          // 升级检查
          while (newExp >= newMaxExp) {
            newExp -= newMaxExp;
            newLevel += 1;
            newMaxExp = Math.floor(newMaxExp * 1.2);
            newAttack = Math.floor(newAttack * 1.1);
            newDefense = Math.floor(newDefense * 1.1);
            newMaxHp = Math.floor(newMaxHp * 1.15);
          }
          
          return {
            ...h,
            exp: newExp,
            maxExp: newMaxExp,
            level: newLevel,
            attack: newAttack,
            defense: newDefense,
            maxHp: newMaxHp,
            hp: newMaxHp, // 满血复活
          };
        });
        
        // 进入下一层或重置当前层
        const floorIndex = newFloors.findIndex(f => f.id === prev.currentFloor);
        newFloors[floorIndex] = { ...currentFloorData, monsterHp: currentFloorData.monsterMaxHp, cleared: true };
        
        if (prev.currentFloor < 100) {
          newCurrentFloor = prev.currentFloor + 1;
          newMaxFloor = Math.max(newMaxFloor, newCurrentFloor);
          const nextFloorIndex = newFloors.findIndex(f => f.id === newCurrentFloor);
          if (nextFloorIndex >= 0) {
            newFloors[nextFloorIndex] = { ...newFloors[nextFloorIndex], cleared: false };
          }
        } else {
          // 重置第100层
          newFloors[floorIndex] = { ...currentFloorData, monsterHp: currentFloorData.monsterMaxHp };
        }
      } else {
        // 更新怪物血量
        const floorIndex = newFloors.findIndex(f => f.id === prev.currentFloor);
        newFloors[floorIndex] = { ...currentFloorData, monsterHp: newMonsterHp };
      }
      
      // 检查成就
      const totalHeroLevel = newHeroes.reduce((sum, h) => sum + h.level, 0);
      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        
        let shouldUnlock = false;
        if (a.requirementType === 'gold' && newTotalGold >= a.requirement) {
          shouldUnlock = true;
        } else if (a.requirementType === 'floor' && newMaxFloor >= a.requirement) {
          shouldUnlock = true;
        } else if (a.requirementType === 'kill' && newTotalKills >= a.requirement) {
          shouldUnlock = true;
        } else if (a.requirementType === 'hero_level' && totalHeroLevel >= a.requirement) {
          shouldUnlock = true;
        }
        
        if (shouldUnlock) {
          return { ...a, unlocked: true };
        }
        return a;
      });
      
      // 计算成就奖励
      const achievementReward = newAchievements.reduce((sum, a) => {
        if (a.unlocked && !prev.achievements.find(pa => pa.id === a.id)?.unlocked) {
          return sum + a.reward;
        }
        return sum;
      }, 0);
      
      return {
        ...prev,
        gold: newGold + achievementReward,
        totalGold: newTotalGold + achievementReward,
        totalKills: newTotalKills,
        floors: newFloors,
        currentFloor: newCurrentFloor,
        maxFloor: newMaxFloor,
        heroes: newHeroes,
        achievements: newAchievements,
      };
    });
  }, [getTotalAttack, getGoldMultiplier, getExpMultiplier]);

  // 解锁英雄
  const unlockHero = useCallback((heroId: string) => {
    setState(prev => {
      const hero = prev.heroes.find(h => h.id === heroId);
      if (!hero || hero.unlocked) return prev;
      if (prev.gold < hero.unlockCost) return prev;
      
      const newHeroes = prev.heroes.map(h => {
        if (h.id === heroId) {
          return { ...h, unlocked: true };
        }
        return h;
      });
      
      return {
        ...prev,
        gold: prev.gold - hero.unlockCost,
        heroes: newHeroes,
      };
    });
  }, []);

  // 升级装备
  const upgradeEquipment = useCallback((equipmentId: string) => {
    setState(prev => {
      const equipment = prev.equipments.find(e => e.id === equipmentId);
      if (!equipment) return prev;
      
      const cost = calculateEquipmentCost(equipment);
      if (prev.gold < cost) return prev;
      
      const newEquipments = prev.equipments.map(e => {
        if (e.id === equipmentId) {
          return { ...e, level: e.level + 1 };
        }
        return e;
      });
      
      return {
        ...prev,
        gold: prev.gold - cost,
        equipments: newEquipments,
      };
    });
  }, []);

  // 升级技能
  const upgradeSkill = useCallback((skillId: string) => {
    setState(prev => {
      const skill = prev.skills.find(s => s.id === skillId);
      if (!skill || skill.level >= skill.maxLevel) return prev;
      
      const cost = calculateSkillCost(skill);
      if (prev.gold < cost) return prev;
      
      const newSkills = prev.skills.map(s => {
        if (s.id === skillId) {
          return { ...s, level: s.level + 1 };
        }
        return s;
      });
      
      return {
        ...prev,
        gold: prev.gold - cost,
        skills: newSkills,
      };
    });
  }, []);

  // 重置当前层
  const resetFloor = useCallback(() => {
    setState(prev => {
      const newFloors = prev.floors.map(f => {
        if (f.id === prev.currentFloor) {
          return { ...f, monsterHp: f.monsterMaxHp };
        }
        return f;
      });
      
      return {
        ...prev,
        floors: newFloors,
      };
    });
  }, []);

  // 自动攻击循环
  useEffect(() => {
    gameLoopRef.current = setInterval(() => {
      setState(prev => {
        const autoHeroes = prev.heroes.filter(h => h.unlocked && h.autoAttack);
        if (autoHeroes.length === 0) return prev;
        
        const currentFloorData = prev.floors.find(f => f.id === prev.currentFloor);
        if (!currentFloorData) return prev;
        
        const autoAttack = autoHeroes.reduce((sum, h) => sum + h.attack, 0) * 0.1; // 每秒10%攻击力
        
        let newMonsterHp = currentFloorData.monsterHp - autoAttack;
        let newGold = prev.gold;
        let newTotalGold = prev.totalGold;
        let newTotalKills = prev.totalKills;
        let newFloors = [...prev.floors];
        let newCurrentFloor = prev.currentFloor;
        let newMaxFloor = prev.maxFloor;
        let newHeroes = [...prev.heroes];
        
        if (newMonsterHp <= 0) {
          // 怪物死亡
          const goldMultiplier = getGoldMultiplier();
          const expMultiplier = getExpMultiplier();
          const goldReward = Math.floor(currentFloorData.goldReward * goldMultiplier);
          const expReward = Math.floor(currentFloorData.expReward * expMultiplier);
          
          newGold += goldReward;
          newTotalGold += goldReward;
          newTotalKills += 1;
          
          // 分配经验
          newHeroes = newHeroes.map(h => {
            if (!h.unlocked) return h;
            let newExp = h.exp + expReward;
            let newLevel = h.level;
            let newMaxExp = h.maxExp;
            let newAttack = h.attack;
            let newDefense = h.defense;
            let newMaxHp = h.maxHp;
            
            while (newExp >= newMaxExp) {
              newExp -= newMaxExp;
              newLevel += 1;
              newMaxExp = Math.floor(newMaxExp * 1.2);
              newAttack = Math.floor(newAttack * 1.1);
              newDefense = Math.floor(newDefense * 1.1);
              newMaxHp = Math.floor(newMaxHp * 1.15);
            }
            
            return {
              ...h,
              exp: newExp,
              maxExp: newMaxExp,
              level: newLevel,
              attack: newAttack,
              defense: newDefense,
              maxHp: newMaxHp,
              hp: newMaxHp,
            };
          });
          
          const floorIndex = newFloors.findIndex(f => f.id === prev.currentFloor);
          newFloors[floorIndex] = { ...currentFloorData, monsterHp: currentFloorData.monsterMaxHp, cleared: true };
          
          if (prev.currentFloor < 100) {
            newCurrentFloor = prev.currentFloor + 1;
            newMaxFloor = Math.max(newMaxFloor, newCurrentFloor);
            const nextFloorIndex = newFloors.findIndex(f => f.id === newCurrentFloor);
            if (nextFloorIndex >= 0) {
              newFloors[nextFloorIndex] = { ...newFloors[nextFloorIndex], cleared: false };
            }
          } else {
            const floorIndex = newFloors.findIndex(f => f.id === prev.currentFloor);
            newFloors[floorIndex] = { ...currentFloorData, monsterHp: currentFloorData.monsterMaxHp };
          }
        } else {
          const floorIndex = newFloors.findIndex(f => f.id === prev.currentFloor);
          newFloors[floorIndex] = { ...currentFloorData, monsterHp: newMonsterHp };
        }
        
        // 检查成就
        const totalHeroLevel = newHeroes.reduce((sum, h) => sum + h.level, 0);
        const newAchievements = prev.achievements.map(a => {
          if (a.unlocked) return a;
          
          let shouldUnlock = false;
          if (a.requirementType === 'gold' && newTotalGold >= a.requirement) {
            shouldUnlock = true;
          } else if (a.requirementType === 'floor' && newMaxFloor >= a.requirement) {
            shouldUnlock = true;
          } else if (a.requirementType === 'kill' && newTotalKills >= a.requirement) {
            shouldUnlock = true;
          } else if (a.requirementType === 'hero_level' && totalHeroLevel >= a.requirement) {
            shouldUnlock = true;
          }
          
          if (shouldUnlock) {
            return { ...a, unlocked: true };
          }
          return a;
        });
        
        const achievementReward = newAchievements.reduce((sum, a) => {
          if (a.unlocked && !prev.achievements.find(pa => pa.id === a.id)?.unlocked) {
            return sum + a.reward;
          }
          return sum;
        }, 0);
        
        return {
          ...prev,
          gold: newGold + achievementReward,
          totalGold: newTotalGold + achievementReward,
          totalKills: newTotalKills,
          floors: newFloors,
          currentFloor: newCurrentFloor,
          maxFloor: newMaxFloor,
          heroes: newHeroes,
          achievements: newAchievements,
        };
      });
    }, GAME_CONFIG.TICK_RATE);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [getGoldMultiplier, getExpMultiplier]);

  // 自动保存
  useEffect(() => {
    const saveInterval = setInterval(() => {
      setState(prev => {
        const saveData = { ...prev, lastSaveTime: Date.now() };
        localStorage.setItem(GAME_CONFIG.SAVE_KEY, JSON.stringify(saveData));
        return prev;
      });
    }, 5000);

    return () => clearInterval(saveInterval);
  }, []);

  // 页面卸载时保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      const saveData = { ...state, lastSaveTime: Date.now() };
      localStorage.setItem(GAME_CONFIG.SAVE_KEY, JSON.stringify(saveData));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state]);

  // 重置游戏
  const resetGame = useCallback(() => {
    localStorage.removeItem(GAME_CONFIG.SAVE_KEY);
    setState({
      gold: 0,
      totalGold: 0,
      totalKills: 0,
      currentFloor: 1,
      maxFloor: 1,
      heroes: JSON.parse(JSON.stringify(INITIAL_HEROES)),
      equipments: JSON.parse(JSON.stringify(INITIAL_EQUIPMENTS)),
      floors: generateFloors(),
      skills: JSON.parse(JSON.stringify(INITIAL_SKILLS)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      lastSaveTime: Date.now(),
      startTime: Date.now(),
    });
  }, []);

  return {
    state,
    clickAttack,
    unlockHero,
    upgradeEquipment,
    upgradeSkill,
    resetFloor,
    resetGame,
    formatNumber,
    calculateEquipmentCost,
    calculateSkillCost,
    getTotalAttack,
  };
}
