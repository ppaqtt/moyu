import { useState, useEffect, useCallback, useRef } from 'react';

const GAME_CONFIG = {
  TICK_RATE: 100,
  OFFLINE_MAX_HOURS: 24,
  SAVE_KEY: 'idle_farm_save',
};

export interface Crop {
  id: string;
  name: string;
  description: string;
  cost: number;
  baseProduction: number;
  baseTime: number;
  icon: string;
  color: string;
}

export interface FarmBuilding {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  effect: { type: string; value: number }[];
  icon: string;
}

export interface Animal {
  id: string;
  name: string;
  description: string;
  cost: number;
  production: number;
  productionInterval: number;
  unlocked: boolean;
  icon: string;
  color: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  requirementType: 'gold' | 'crop' | 'animal' | 'building';
  unlocked: boolean;
  reward: number;
}

export interface GameState {
  gold: number;
  totalGold: number;
  crops: Crop[];
  farmBuildings: FarmBuilding[];
  animals: Animal[];
  achievements: Achievement[];
  totalHarvests: number;
  lastSaveTime: number;
  startTime: number;
  clickValue: number;
}

const INITIAL_CROPS: Crop[] = [
  { id: 'wheat', name: '小麦', description: '基础作物', cost: 10, baseProduction: 1, baseTime: 5, icon: '🌾', color: '#F4D03F' },
  { id: 'carrot', name: '胡萝卜', description: '快速生长', cost: 25, baseProduction: 3, baseTime: 8, icon: '🥕', color: '#E67E22' },
  { id: 'tomato', name: '番茄', description: '高产量', cost: 50, baseProduction: 8, baseTime: 12, icon: '🍅', color: '#E74C3C' },
  { id: 'corn', name: '玉米', description: '稳定产出', cost: 100, baseProduction: 15, baseTime: 18, icon: '🌽', color: '#F39C12' },
  { id: 'potato', name: '土豆', description: '高收益', cost: 200, baseProduction: 30, baseTime: 25, icon: '🥔', color: '#8B4513' },
  { id: 'strawberry', name: '草莓', description: '珍贵作物', cost: 500, baseProduction: 80, baseTime: 35, icon: '🍓', color: '#FF6B6B' },
  { id: 'pumpkin', name: '南瓜', description: '节日特供', cost: 1000, baseProduction: 200, baseTime: 50, icon: '🎃', color: '#FF8C00' },
  { id: 'grape', name: '葡萄', description: '酿酒原料', cost: 2500, baseProduction: 500, baseTime: 70, icon: '🍇', color: '#9B59B6' },
];

const INITIAL_BUILDINGS: FarmBuilding[] = [
  { id: 'barn', name: '谷仓', description: '增加金币存储上限', level: 0, maxLevel: 30, baseCost: 100, costMultiplier: 1.4, effect: [{ type: 'capacity', value: 1000 }], icon: '🏠' },
  { id: 'tractor', name: '拖拉机', description: '加速所有作物生长', level: 0, maxLevel: 25, baseCost: 300, costMultiplier: 1.5, effect: [{ type: 'speed', value: 0.1 }], icon: '🚜' },
  { id: 'irrigation', name: '灌溉系统', description: '提高作物产量', level: 0, maxLevel: 20, baseCost: 500, costMultiplier: 1.6, effect: [{ type: 'production', value: 0.15 }], icon: '💧' },
  { id: 'greenhouse', name: '温室', description: '解锁高级作物', level: 0, maxLevel: 15, baseCost: 2000, costMultiplier: 1.8, effect: [{ type: 'unlock', value: 1 }], icon: '🌿' },
  { id: 'silo', name: '筒仓', description: '离线收益加成', level: 0, maxLevel: 20, baseCost: 1000, costMultiplier: 1.5, effect: [{ type: 'offline', value: 0.1 }], icon: '🏗️' },
  { id: 'windmill', name: '风车', description: '被动金币产出', level: 0, maxLevel: 20, baseCost: 3000, costMultiplier: 1.7, effect: [{ type: 'passive', value: 5 }], icon: '🌀' },
];

const INITIAL_ANIMALS: Animal[] = [
  { id: 'chicken', name: '鸡', description: '产蛋', cost: 50, production: 2, productionInterval: 10, unlocked: false, icon: '🐔', color: '#F4D03F' },
  { id: 'cow', name: '牛', description: '产奶', cost: 200, production: 8, productionInterval: 20, unlocked: false, icon: '🐄', color: '#ECF0F1' },
  { id: 'pig', name: '猪', description: '产肉', cost: 500, production: 20, productionInterval: 30, unlocked: false, icon: '🐷', color: '#F5B7B1' },
  { id: 'sheep', name: '羊', description: '产羊毛', cost: 1000, production: 50, productionInterval: 45, unlocked: false, icon: '🐑', color: '#FDEBD0' },
  { id: 'horse', name: '马', description: '运输加速', cost: 3000, production: 150, productionInterval: 60, unlocked: false, icon: '🐴', color: '#8B4513' },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'gold_100', name: '小农夫', description: '拥有 100 金币', requirement: 100, requirementType: 'gold', unlocked: false, reward: 50 },
  { id: 'gold_1000', name: '农场主', description: '拥有 1000 金币', requirement: 1000, requirementType: 'gold', unlocked: false, reward: 500 },
  { id: 'gold_10000', name: '大庄园主', description: '拥有 10000 金币', requirement: 10000, requirementType: 'gold', unlocked: false, reward: 5000 },
  { id: 'harvest_10', name: '收割者', description: '收获 10 次', requirement: 10, requirementType: 'crop', unlocked: false, reward: 100 },
  { id: 'harvest_100', name: '丰收季节', description: '收获 100 次', requirement: 100, requirementType: 'crop', unlocked: false, reward: 1000 },
  { id: 'animal_farm', name: '养殖场', description: '拥有 3 种动物', requirement: 3, requirementType: 'animal', unlocked: false, reward: 500 },
  { id: 'farm_empire', name: '农场帝国', description: '建筑等级总和达到 20', requirement: 20, requirementType: 'building', unlocked: false, reward: 2000 },
];

export function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return Math.floor(num).toString();
}

export function calculateBuildingCost(building: FarmBuilding): number {
  return Math.floor(building.baseCost * Math.pow(building.costMultiplier, building.level));
}

export function useFarmEngine() {
  const [state, setState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(GAME_CONFIG.SAVE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const now = Date.now();
          const offlineTime = Math.min((now - parsed.lastSaveTime) / 1000, GAME_CONFIG.OFFLINE_MAX_HOURS * 3600);

          const buildingLevels = parsed.farmBuildings?.reduce((sum: number, b: FarmBuilding) => sum + b.level, 0) || 0;
          const offlineBonus = 1 + (parsed.farmBuildings?.find((b: FarmBuilding) => b.id === 'silo')?.level || 0) * 0.1;
          const offlineGold = Math.floor(offlineTime * buildingLevels * 2 * offlineBonus * 0.3);

          return {
            ...parsed,
            gold: (parsed.gold || 0) + offlineGold,
            totalGold: (parsed.totalGold || 0) + offlineGold,
            lastSaveTime: now,
            crops: parsed.crops || INITIAL_CROPS,
            farmBuildings: parsed.farmBuildings || INITIAL_BUILDINGS,
            animals: parsed.animals || INITIAL_ANIMALS,
            achievements: parsed.achievements || INITIAL_ACHIEVEMENTS,
          };
        } catch {}
      }
    }
    return {
      gold: 50,
      totalGold: 50,
      crops: JSON.parse(JSON.stringify(INITIAL_CROPS)),
      farmBuildings: JSON.parse(JSON.stringify(INITIAL_BUILDINGS)),
      animals: JSON.parse(JSON.stringify(INITIAL_ANIMALS)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      totalHarvests: 0,
      lastSaveTime: Date.now(),
      startTime: Date.now(),
      clickValue: 1,
    };
  });

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const getSpeedMultiplier = useCallback(() => {
    const tractor = state.farmBuildings.find(b => b.id === 'tractor');
    return 1 + (tractor?.level || 0) * tractor?.effect.find(e => e.type === 'speed')?.value!;
  }, [state.farmBuildings]);

  const getProductionMultiplier = useCallback(() => {
    const irrigation = state.farmBuildings.find(b => b.id === 'irrigation');
    return 1 + (irrigation?.level || 0) * irrigation?.effect.find(e => e.type === 'production')?.value!;
  }, [state.farmBuildings]);

  const harvestCrop = useCallback((cropId: string) => {
    setState(prev => {
      const crop = prev.crops.find(c => c.id === cropId);
      if (!crop) return prev;

      const speedMult = getSpeedMultiplier();
      const prodMult = getProductionMultiplier();
      const production = Math.floor(crop.baseProduction * prodMult);

      const newGold = prev.gold + production;
      const newTotalGold = prev.totalGold + production;
      const newTotalHarvests = prev.totalHarvests + 1;

      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        let shouldUnlock = false;
        if (a.requirementType === 'gold' && newTotalGold >= a.requirement) shouldUnlock = true;
        if (a.requirementType === 'crop' && newTotalHarvests >= a.requirement) shouldUnlock = true;
        if (shouldUnlock) return { ...a, unlocked: true };
        return a;
      });

      return { ...prev, gold: newGold, totalGold: newTotalGold, totalHarvests: newTotalHarvests, achievements: newAchievements };
    });
  }, [getSpeedMultiplier, getProductionMultiplier]);

  const buyCrop = useCallback((cropId: string) => {
    setState(prev => {
      const crop = prev.crops.find(c => c.id === cropId);
      if (!crop || prev.gold < crop.cost) return prev;
      return { ...prev, gold: prev.gold - crop.cost };
    });
  }, []);

  const upgradeBuilding = useCallback((buildingId: string) => {
    setState(prev => {
      const building = prev.farmBuildings.find(b => b.id === buildingId);
      if (!building || building.level >= building.maxLevel) return prev;
      const cost = calculateBuildingCost(building);
      if (prev.gold < cost) return prev;

      const newBuildings = prev.farmBuildings.map(b => b.id === buildingId ? { ...b, level: b.level + 1 } : b);
      const totalLevels = newBuildings.reduce((sum, b) => sum + b.level, 0);

      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        if (a.requirementType === 'building' && totalLevels >= a.requirement) return { ...a, unlocked: true };
        return a;
      });

      return { ...prev, gold: prev.gold - cost, farmBuildings: newBuildings, achievements: newAchievements };
    });
  }, []);

  const unlockAnimal = useCallback((animalId: string) => {
    setState(prev => {
      const animal = prev.animals.find(a => a.id === animalId);
      if (!animal || animal.unlocked || prev.gold < animal.cost) return prev;
      const newAnimals = prev.animals.map(a => a.id === animalId ? { ...a, unlocked: true } : a);
      const unlockedCount = newAnimals.filter(a => a.unlocked).length;
      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        if (a.requirementType === 'animal' && unlockedCount >= a.requirement) return { ...a, unlocked: true };
        return a;
      });
      return { ...prev, gold: prev.gold - animal.cost, animals: newAnimals, achievements: newAchievements };
    });
  }, []);

  useEffect(() => {
    let lastPassiveTime = Date.now();
    gameLoopRef.current = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastPassiveTime) / 1000;
      lastPassiveTime = now;

      setState(prev => {
        const windmill = prev.farmBuildings.find(b => b.id === 'windmill');
        const passiveGold = (windmill?.level || 0) * windmill?.effect.find(e => e.type === 'passive')?.value! * delta;
        const barn = prev.farmBuildings.find(b => b.id === 'barn');
        const capacity = 1000 + (barn?.level || 0) * barn?.effect.find(e => e.type === 'capacity')?.value!;
        const newGold = Math.min(prev.gold + passiveGold, capacity);

        return { ...prev, gold: newGold };
      });
    }, GAME_CONFIG.TICK_RATE);

    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, []);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem(GAME_CONFIG.SAVE_KEY, JSON.stringify({ ...state, lastSaveTime: Date.now() }));
    }, 5000);
    return () => clearInterval(saveInterval);
  }, [state]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem(GAME_CONFIG.SAVE_KEY, JSON.stringify({ ...state, lastSaveTime: Date.now() }));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state]);

  const resetGame = useCallback(() => {
    localStorage.removeItem(GAME_CONFIG.SAVE_KEY);
    setState({
      gold: 50, totalGold: 50, crops: JSON.parse(JSON.stringify(INITIAL_CROPS)),
      farmBuildings: JSON.parse(JSON.stringify(INITIAL_BUILDINGS)),
      animals: JSON.parse(JSON.stringify(INITIAL_ANIMALS)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      totalHarvests: 0, lastSaveTime: Date.now(), startTime: Date.now(), clickValue: 1,
    });
  }, []);

  return { state, harvestCrop, buyCrop, upgradeBuilding, unlockAnimal, resetGame, formatNumber, calculateBuildingCost, getSpeedMultiplier, getProductionMultiplier };
}
