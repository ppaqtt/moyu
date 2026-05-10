import { useState, useEffect, useCallback, useRef } from 'react';

const GAME_CONFIG = {
  TICK_RATE: 100,
  OFFLINE_MAX_HOURS: 24,
  SAVE_KEY: 'idle_racing_save',
};

export interface Car {
  id: string;
  name: string;
  description: string;
  baseSpeed: number;
  baseCost: number;
  costMultiplier: number;
  icon: string;
  color: string;
  unlocked: boolean;
}

export interface Upgrade {
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

export interface Track {
  id: string;
  name: string;
  description: string;
  unlockCost: number;
  rewardMultiplier: number;
  unlocked: boolean;
  icon: string;
  color: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  requirementType: 'gold' | 'race' | 'speed' | 'track';
  unlocked: boolean;
  reward: number;
}

export interface GameState {
  gold: number;
  totalGold: number;
  tokens: number;
  cars: Car[];
  upgrades: Upgrade[];
  tracks: Track[];
  achievements: Achievement[];
  totalRaces: number;
  bestSpeed: number;
  lastSaveTime: number;
  startTime: number;
}

const INITIAL_CARS: Car[] = [
  { id: 'go_kart', name: '卡丁车', description: '入门级赛车', baseSpeed: 10, baseCost: 0, costMultiplier: 1, icon: '🛵', color: '#3498db', unlocked: true },
  { id: 'sedan', name: '轿车', description: '家用轿车', baseSpeed: 25, baseCost: 500, costMultiplier: 1.3, icon: '🚗', color: '#2ecc71', unlocked: false },
  { id: 'sports', name: '跑车', description: '运动车型', baseSpeed: 60, baseCost: 2000, costMultiplier: 1.4, icon: '🏎️', color: '#e74c3c', unlocked: false },
  { id: 'supercar', name: '超级跑车', description: '极速体验', baseSpeed: 150, baseCost: 10000, costMultiplier: 1.5, icon: '🚙', color: '#9b59b6', unlocked: false },
  { id: 'hypercar', name: 'hypercar', description: '世界最快', baseSpeed: 400, baseCost: 50000, costMultiplier: 1.6, icon: '🏁', color: '#f39c12', unlocked: false },
  { id: 'f1_car', name: 'F1赛车', description: '赛道王者', baseSpeed: 1000, baseCost: 200000, costMultiplier: 1.7, icon: '🏎️', color: '#1abc9c', unlocked: false },
];

const INITIAL_UPGRADES: Upgrade[] = [
  { id: 'engine', name: '引擎', description: '提升基础速度', level: 0, maxLevel: 50, baseCost: 50, costMultiplier: 1.3, effect: { type: 'speed', value: 5 }, icon: '⚙️' },
  { id: 'tires', name: '轮胎', description: '提升抓地力', level: 0, maxLevel: 40, baseCost: 80, costMultiplier: 1.35, effect: { type: 'grip', value: 0.05 }, icon: '●' },
  { id: 'nitro', name: '氮气加速', description: '瞬间加速', level: 0, maxLevel: 30, baseCost: 200, costMultiplier: 1.4, effect: { type: 'nitro', value: 0.1 }, icon: '🔥' },
  { id: 'aero', name: '空气动力学', description: '减少风阻', level: 0, maxLevel: 25, baseCost: 300, costMultiplier: 1.45, effect: { type: 'drag', value: 0.08 }, icon: '✈️' },
  { id: 'brakes', name: '刹车系统', description: '更好操控', level: 0, maxLevel: 35, baseCost: 150, costMultiplier: 1.35, effect: { type: 'control', value: 0.03 }, icon: '◉' },
  { id: 'fuel', name: '燃料优化', description: '减少冷却时间', level: 0, maxLevel: 30, baseCost: 400, costMultiplier: 1.4, effect: { type: 'cooldown', value: 0.05 }, icon: '⛽' },
];

const INITIAL_TRACKS: Track[] = [
  { id: 'street', name: '城市街道', description: '初级赛道', unlockCost: 0, rewardMultiplier: 1, unlocked: true, icon: '🏙️', color: '#3498db' },
  { id: 'mountain', name: '山地公路', description: '蜿蜒曲折', unlockCost: 500, rewardMultiplier: 1.5, unlocked: false, icon: '🏔️', color: '#27ae60' },
  { id: 'desert', name: '沙漠赛道', description: '高温挑战', unlockCost: 2000, rewardMultiplier: 2, unlocked: false, icon: '🏜️', color: '#f39c12' },
  { id: 'ice', name: '冰封赛道', description: '极寒之地', unlockCost: 8000, rewardMultiplier: 3, unlocked: false, icon: '❄️', color: '#00bcd4' },
  { id: 'night', name: '夜间赛道', description: '霓虹灯光', unlockCost: 30000, rewardMultiplier: 5, unlocked: false, icon: '🌃', color: '#9b59b6' },
  { id: 'space', name: '太空赛道', description: '星际竞速', unlockCost: 150000, rewardMultiplier: 10, unlocked: false, icon: '🌌', color: '#e91e63' },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'gold_500', name: '赛车新手', description: '拥有 500 金币', requirement: 500, requirementType: 'gold', unlocked: false, reward: 200 },
  { id: 'gold_5000', name: '赛车手', description: '拥有 5000 金币', requirement: 5000, requirementType: 'gold', unlocked: false, reward: 1000 },
  { id: 'gold_50000', name: '赛车大师', description: '拥有 50000 金币', requirement: 50000, requirementType: 'gold', unlocked: false, reward: 10000 },
  { id: 'race_50', name: '老手车手', description: '完成 50 场比赛', requirement: 50, requirementType: 'race', unlocked: false, reward: 300 },
  { id: 'race_200', name: '职业车手', description: '完成 200 场比赛', requirement: 200, requirementType: 'race', unlocked: false, reward: 2000 },
  { id: 'speed_100', name: '极速传说', description: '达到 100 速度', requirement: 100, requirementType: 'speed', unlocked: false, reward: 500 },
  { id: 'track_master', name: '全赛道王者', description: '解锁所有赛道', requirement: 6, requirementType: 'track', unlocked: false, reward: 10000 },
];

export function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return Math.floor(num).toString();
}

export function calculateUpgradeCost(upgrade: Upgrade): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
}

export function useRacingEngine() {
  const [state, setState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(GAME_CONFIG.SAVE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const now = Date.now();
          const offlineTime = Math.min((now - parsed.lastSaveTime) / 1000, GAME_CONFIG.OFFLINE_MAX_HOURS * 3600);
          const speed = calculateTotalSpeed(parsed.upgrades || [], parsed.cars || []);
          const racesPerHour = 60;
          const offlineRaces = Math.floor(offlineTime / 60 * racesPerHour);
          const offlineGold = offlineRaces * speed * 2 * 0.3;
          return {
            ...parsed,
            gold: (parsed.gold || 0) + offlineGold,
            totalGold: (parsed.totalGold || 0) + offlineGold,
            lastSaveTime: now,
            cars: parsed.cars || INITIAL_CARS,
            upgrades: parsed.upgrades || INITIAL_UPGRADES,
            tracks: parsed.tracks || INITIAL_TRACKS,
            achievements: parsed.achievements || INITIAL_ACHIEVEMENTS,
          };
        } catch {}
      }
    }
    return {
      gold: 100, totalGold: 100, tokens: 10,
      cars: JSON.parse(JSON.stringify(INITIAL_CARS)),
      upgrades: JSON.parse(JSON.stringify(INITIAL_UPGRADES)),
      tracks: JSON.parse(JSON.stringify(INITIAL_TRACKS)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      totalRaces: 0, bestSpeed: 10, lastSaveTime: Date.now(), startTime: Date.now(),
    };
  });

  const calculateTotalSpeed = (upgrades: Upgrade[], cars: Car[]): number => {
    const engine = upgrades.find(u => u.id === 'engine');
    const speedBonus = (engine?.level || 0) * (engine?.effect?.value || 0);
    const unlockedCars = cars.filter(c => c.unlocked);
    const bestCar = unlockedCars.reduce((best, car) => car.baseSpeed > best.baseSpeed ? car : best, unlockedCars[0] || { baseSpeed: 10 });
    return (bestCar?.baseSpeed || 10) + speedBonus;
  };

  const getSpeed = useCallback(() => {
    return calculateTotalSpeed(state.upgrades, state.cars);
  }, [state.upgrades, state.cars]);

  const startRace = useCallback(() => {
    setState(prev => {
      const speed = calculateTotalSpeed(prev.upgrades, prev.cars);
      const unlockedTracks = prev.tracks.filter(t => t.unlocked);
      const track = unlockedTracks[Math.floor(Math.random() * unlockedTracks.length)] || prev.tracks[0];
      const baseReward = speed * 10;
      const reward = Math.floor(baseReward * track.rewardMultiplier);
      const newGold = prev.gold + reward;
      const newTotalGold = prev.totalGold + reward;
      const newTotalRaces = prev.totalRaces + 1;
      const newBestSpeed = Math.max(prev.bestSpeed, speed);
      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        let shouldUnlock = false;
        if (a.requirementType === 'gold' && newTotalGold >= a.requirement) shouldUnlock = true;
        if (a.requirementType === 'race' && newTotalRaces >= a.requirement) shouldUnlock = true;
        if (a.requirementType === 'speed' && newBestSpeed >= a.requirement) shouldUnlock = true;
        if (shouldUnlock) return { ...a, unlocked: true };
        return a;
      });
      return { ...prev, gold: newGold, totalGold: newTotalGold, totalRaces: newTotalRaces, bestSpeed: newBestSpeed, achievements: newAchievements };
    });
  }, []);

  const unlockCar = useCallback((carId: string) => {
    setState(prev => {
      const car = prev.cars.find(c => c.id === carId);
      if (!car || car.unlocked || prev.gold < car.baseCost) return prev;
      const newCars = prev.cars.map(c => c.id === carId ? { ...c, unlocked: true } : c);
      return { ...prev, gold: prev.gold - car.baseCost, cars: newCars };
    });
  }, []);

  const upgradePart = useCallback((upgradeId: string) => {
    setState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === upgradeId);
      if (!upgrade || upgrade.level >= upgrade.maxLevel) return prev;
      const cost = calculateUpgradeCost(upgrade);
      if (prev.gold < cost) return prev;
      const newUpgrades = prev.upgrades.map(u => u.id === upgradeId ? { ...u, level: u.level + 1 } : u);
      return { ...prev, gold: prev.gold - cost, upgrades: newUpgrades };
    });
  }, []);

  const unlockTrack = useCallback((trackId: string) => {
    setState(prev => {
      const track = prev.tracks.find(t => t.id === trackId);
      if (!track || track.unlocked || prev.gold < track.unlockCost) return prev;
      const newTracks = prev.tracks.map(t => t.id === trackId ? { ...t, unlocked: true } : t);
      const unlockedCount = newTracks.filter(t => t.unlocked).length;
      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        if (a.requirementType === 'track' && unlockedCount >= a.requirement) return { ...a, unlocked: true };
        return a;
      });
      return { ...prev, gold: prev.gold - track.unlockCost, tracks: newTracks, achievements: newAchievements };
    });
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
      gold: 100, totalGold: 100, tokens: 10,
      cars: JSON.parse(JSON.stringify(INITIAL_CARS)),
      upgrades: JSON.parse(JSON.stringify(INITIAL_UPGRADES)),
      tracks: JSON.parse(JSON.stringify(INITIAL_TRACKS)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      totalRaces: 0, bestSpeed: 10, lastSaveTime: Date.now(), startTime: Date.now(),
    });
  }, []);

  return { state, startRace, unlockCar, upgradePart, unlockTrack, resetGame, formatNumber, calculateUpgradeCost, getSpeed };
}
