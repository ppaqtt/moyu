import { useState, useEffect, useCallback, useRef } from 'react';

const GAME_CONFIG = {
  TICK_RATE: 100,
  OFFLINE_MAX_HOURS: 24,
  SAVE_KEY: 'idle_miner_save',
};

export interface Ore {
  id: string;
  name: string;
  description: string;
  rarity: number;
  baseValue: number;
  icon: string;
  color: string;
  depth: number;
}

export interface Miner {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  miningPower: number;
  icon: string;
  color: string;
}

export interface DrillUpgrade {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  effect: { type: string; value: number };
  icon: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  requirementType: 'gold' | 'ore' | 'miner' | 'depth';
  unlocked: boolean;
  reward: number;
}

export interface GameState {
  gold: number;
  totalGold: number;
  currentDepth: number;
  maxDepth: number;
  ores: Ore[];
  miners: Miner[];
  drillUpgrades: DrillUpgrade[];
  achievements: Achievement[];
  totalMined: number;
  lastSaveTime: number;
  startTime: number;
}

const INITIAL_ORES: Ore[] = [
  { id: 'coal', name: '煤矿', description: '最常见的矿石', rarity: 0.5, baseValue: 1, icon: 'ite', color: '#333', depth: 0 },
  { id: 'iron', name: '铁矿', description: '基础金属', rarity: 0.4, baseValue: 3, icon: 'ite', color: '#A19D94', depth: 10 },
  { id: 'copper', name: '铜矿', description: '导电材料', rarity: 0.35, baseValue: 5, icon: 'ite', color: '#B87333', depth: 25 },
  { id: 'silver', name: '银矿', description: '珍贵金属', rarity: 0.25, baseValue: 12, icon: 'C', color: '#C0C0C0', depth: 50 },
  { id: 'gold', name: '金矿', description: '贵重矿物', rarity: 0.15, baseValue: 30, icon: '★', color: '#FFD700', depth: 100 },
  { id: 'diamond', name: '钻石', description: '最珍贵的宝石', rarity: 0.08, baseValue: 100, icon: '◆', color: '#B9F2FF', depth: 200 },
  { id: 'ruby', name: '红宝石', description: '稀有宝石', rarity: 0.05, baseValue: 250, icon: '◆', color: '#E31B5F', depth: 350 },
  { id: 'emerald', name: '祖母绿', description: '翠绿宝石', rarity: 0.03, baseValue: 500, icon: '◆', color: '#50C878', depth: 500 },
  { id: 'amethyst', name: '紫水晶', description: '神秘矿石', rarity: 0.02, baseValue: 1000, icon: '◆', color: '#9966CC', depth: 750 },
  { id: 'mythril', name: '秘银', description: '传说金属', rarity: 0.01, baseValue: 5000, icon: '✦', color: '#7DF9FF', depth: 1000 },
];

const INITIAL_MINERS: Miner[] = [
  { id: 'pickaxe', name: '矿镐', description: '基础挖掘工具', level: 1, maxLevel: 50, baseCost: 15, costMultiplier: 1.3, miningPower: 1, icon: '⛏️', color: '#8B4513' },
  { id: 'drill', name: '钻机', description: '电动采矿设备', level: 0, maxLevel: 40, baseCost: 100, costMultiplier: 1.4, miningPower: 5, icon: '🔩', color: '#708090' },
  { id: 'excavator', name: '挖掘机', description: '大型采矿机械', level: 0, maxLevel: 30, baseCost: 500, costMultiplier: 1.5, miningPower: 20, icon: '🚜', color: '#FF8C00' },
  { id: 'dynamite', name: '炸药', description: '爆破采矿', level: 0, maxLevel: 25, baseCost: 2000, costMultiplier: 1.6, miningPower: 80, icon: 'D', color: '#FF4500' },
  { id: 'laser', name: '激光切割', description: '高科技采矿', level: 0, maxLevel: 20, baseCost: 10000, costMultiplier: 1.7, miningPower: 300, icon: '⚡', color: '#00FFFF' },
  { id: 'nanobot', name: '纳米机器人', description: '纳米级采矿', level: 0, maxLevel: 15, baseCost: 50000, costMultiplier: 1.8, miningPower: 1500, icon: '🤖', color: '#9932CC' },
];

const INITIAL_DRILL_UPGRADES: DrillUpgrade[] = [
  { id: 'efficiency', name: '采矿效率', description: '增加采矿速度', level: 0, maxLevel: 30, baseCost: 50, costMultiplier: 1.4, effect: { type: 'speed', value: 0.1 }, icon: '⚡' },
  { id: 'depth', name: '深度探测', description: '解锁更深矿层', level: 0, maxLevel: 25, baseCost: 200, costMultiplier: 1.5, effect: { type: 'depth', value: 5 }, icon: '⬇️' },
  { id: 'luck', name: '幸运加成', description: '提高稀有矿石概率', level: 0, maxLevel: 20, baseCost: 500, costMultiplier: 1.6, effect: { type: 'luck', value: 0.05 }, icon: '🍀' },
  { id: 'auto', name: '自动采矿', description: '被动金币收入', level: 0, maxLevel: 25, baseCost: 1000, costMultiplier: 1.5, effect: { type: 'passive', value: 2 }, icon: '🔄' },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'gold_100', name: '新手矿工', description: '拥有 100 金币', requirement: 100, requirementType: 'gold', unlocked: false, reward: 50 },
  { id: 'gold_1000', name: '资深矿工', description: '拥有 1000 金币', requirement: 1000, requirementType: 'gold', unlocked: false, reward: 500 },
  { id: 'gold_10000', name: '矿主', description: '拥有 10000 金币', requirement: 10000, requirementType: 'gold', unlocked: false, reward: 5000 },
  { id: 'mine_100', name: '采矿达人', description: '采矿 100 次', requirement: 100, requirementType: 'ore', unlocked: false, reward: 200 },
  { id: 'depth_50', name: '深入矿脉', description: '到达深度 50', requirement: 50, requirementType: 'depth', unlocked: false, reward: 300 },
  { id: 'depth_200', name: '深层探险', description: '到达深度 200', requirement: 200, requirementType: 'depth', unlocked: false, reward: 2000 },
  { id: 'miner_master', name: '采矿大师', description: '拥有 3 个满级矿工', requirement: 3, requirementType: 'miner', unlocked: false, reward: 5000 },
];

export function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return Math.floor(num).toString();
}

export function calculateMinerCost(miner: Miner): number {
  return Math.floor(miner.baseCost * Math.pow(miner.costMultiplier, miner.level));
}

export function calculateUpgradeCost(upgrade: DrillUpgrade): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
}

export function useMinerEngine() {
  const [state, setState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(GAME_CONFIG.SAVE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const now = Date.now();
          const offlineTime = Math.min((now - parsed.lastSaveTime) / 1000, GAME_CONFIG.OFFLINE_MAX_HOURS * 3600);
          const totalPower = (parsed.miners || []).reduce((sum: number, m: Miner) => sum + m.level * m.miningPower, 0);
          const autoUpgrade = (parsed.drillUpgrades || []).find((u: DrillUpgrade) => u.id === 'auto');
          const autoRate = ((autoUpgrade?.level || 0) * (autoUpgrade?.effect?.value || 0));
          const offlineGold = Math.floor(totalPower * autoRate * offlineTime * 0.3);
          return {
            ...parsed,
            gold: (parsed.gold || 0) + offlineGold,
            totalGold: (parsed.totalGold || 0) + offlineGold,
            lastSaveTime: now,
            ores: parsed.ores || INITIAL_ORES,
            miners: parsed.miners || INITIAL_MINERS,
            drillUpgrades: parsed.drillUpgrades || INITIAL_DRILL_UPGRADES,
            achievements: parsed.achievements || INITIAL_ACHIEVEMENTS,
          };
        } catch {}
      }
    }
    return {
      gold: 20, totalGold: 20, currentDepth: 0, maxDepth: 0,
      ores: JSON.parse(JSON.stringify(INITIAL_ORES)),
      miners: JSON.parse(JSON.stringify(INITIAL_MINERS)),
      drillUpgrades: JSON.parse(JSON.stringify(INITIAL_DRILL_UPGRADES)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      totalMined: 0, lastSaveTime: Date.now(), startTime: Date.now(),
    };
  });

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const getMiningPower = useCallback(() => {
    const efficiency = state.drillUpgrades.find(u => u.id === 'efficiency');
    const speedBonus = 1 + (efficiency?.level || 0) * (efficiency?.effect?.value || 0);
    return state.miners.reduce((sum, m) => sum + m.level * m.miningPower, 0) * speedBonus;
  }, [state.miners, state.drillUpgrades]);

  const getLuckBonus = useCallback(() => {
    const luck = state.drillUpgrades.find(u => u.id === 'luck');
    return 1 + (luck?.level || 0) * (luck?.effect?.value || 0);
  }, [state.drillUpgrades]);

  const mine = useCallback(() => {
    setState(prev => {
      const power = getMiningPower();
      const luck = getLuckBonus();
      const currentOre = prev.ores.filter(o => o.depth <= prev.currentDepth).pop() || prev.ores[0];
      const depthBonus = 1 + prev.currentDepth * 0.02;
      const value = Math.floor(currentOre.baseValue * power * depthBonus);
      const newGold = prev.gold + value;
      const newTotalGold = prev.totalGold + value;
      const newTotalMined = prev.totalMined + 1;
      const newMaxDepth = Math.max(prev.maxDepth, prev.currentDepth);

      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        let shouldUnlock = false;
        if (a.requirementType === 'gold' && newTotalGold >= a.requirement) shouldUnlock = true;
        if (a.requirementType === 'ore' && newTotalMined >= a.requirement) shouldUnlock = true;
        if (a.requirementType === 'depth' && newMaxDepth >= a.requirement) shouldUnlock = true;
        if (shouldUnlock) return { ...a, unlocked: true };
        return a;
      });

      return { ...prev, gold: newGold, totalGold: newTotalGold, totalMined: newTotalMined, maxDepth: newMaxDepth, achievements: newAchievements };
    });
  }, [getMiningPower, getLuckBonus]);

  const upgradeMiner = useCallback((minerId: string) => {
    setState(prev => {
      const miner = prev.miners.find(m => m.id === minerId);
      if (!miner || miner.level >= miner.maxLevel) return prev;
      const cost = calculateMinerCost(miner);
      if (prev.gold < cost) return prev;
      const newMiners = prev.miners.map(m => m.id === minerId ? { ...m, level: m.level + 1 } : m);
      const maxLevelMiners = newMiners.filter(m => m.level >= m.maxLevel).length;
      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        if (a.requirementType === 'miner' && maxLevelMiners >= a.requirement) return { ...a, unlocked: true };
        return a;
      });
      return { ...prev, gold: prev.gold - cost, miners: newMiners, achievements: newAchievements };
    });
  }, []);

  const upgradeDrill = useCallback((upgradeId: string) => {
    setState(prev => {
      const upgrade = prev.drillUpgrades.find(u => u.id === upgradeId);
      if (!upgrade || upgrade.level >= upgrade.maxLevel) return prev;
      const cost = calculateUpgradeCost(upgrade);
      if (prev.gold < cost) return prev;
      const newUpgrades = prev.drillUpgrades.map(u => u.id === upgradeId ? { ...u, level: u.level + 1 } : u);
      return { ...prev, gold: prev.gold - cost, drillUpgrades: newUpgrades };
    });
  }, []);

  const digDeeper = useCallback((amount: number) => {
    setState(prev => {
      if (prev.gold < amount * 10) return prev;
      return { ...prev, gold: prev.gold - amount * 10, currentDepth: prev.currentDepth + amount };
    });
  }, []);

  useEffect(() => {
    let lastPassiveTime = Date.now();
    gameLoopRef.current = setInterval(() => {
      const now = Date.now();
      lastPassiveTime = now;
      const autoUpgrade = state.drillUpgrades.find(u => u.id === 'auto');
      const autoRate = (autoUpgrade?.level || 0) * (autoUpgrade?.effect?.value || 0);
      if (autoRate > 0) {
        const power = getMiningPower();
        const goldPerSecond = power * autoRate;
        setState(prev => ({ ...prev, gold: prev.gold + goldPerSecond * 0.1, totalGold: prev.totalGold + goldPerSecond * 0.1 }));
      }
    }, GAME_CONFIG.TICK_RATE);
    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [state.drillUpgrades, getMiningPower]);

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
      gold: 20, totalGold: 20, currentDepth: 0, maxDepth: 0,
      ores: JSON.parse(JSON.stringify(INITIAL_ORES)),
      miners: JSON.parse(JSON.stringify(INITIAL_MINERS)),
      drillUpgrades: JSON.parse(JSON.stringify(INITIAL_DRILL_UPGRADES)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      totalMined: 0, lastSaveTime: Date.now(), startTime: Date.now(),
    });
  }, []);

  return { state, mine, upgradeMiner, upgradeDrill, digDeeper, resetGame, formatNumber, calculateMinerCost, calculateUpgradeCost, getMiningPower, getLuckBonus };
}
