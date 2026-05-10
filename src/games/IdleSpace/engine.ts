import { useState, useEffect, useCallback, useRef } from 'react';

const GAME_CONFIG = {
  TICK_RATE: 100,
  OFFLINE_MAX_HOURS: 24,
  SAVE_KEY: 'idle_space_save',
};

export interface Star {
  id: string;
  name: string;
  type: string;
  energyOutput: number;
  cost: number;
  icon: string;
  color: string;
  description: string;
}

export interface Spaceship {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  speed: number;
  cargoCapacity: number;
  icon: string;
  color: string;
}

export interface Station {
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
  requirementType: 'energy' | 'star' | 'ship' | 'distance';
  unlocked: boolean;
  reward: number;
}

export interface GameState {
  energy: number;
  totalEnergy: number;
  stars: Star[];
  spaceships: Spaceship[];
  stations: Station[];
  achievements: Achievement[];
  totalExplored: number;
  maxDistance: number;
  lastSaveTime: number;
  startTime: number;
}

const INITIAL_STARS: Star[] = [
  { id: 'yellow', name: '黄矮星', type: 'yellow_dwarf', energyOutput: 1, cost: 50, icon: '🌟', color: '#FFD700', description: '稳定的能量来源' },
  { id: 'red_giant', name: '红巨星', type: 'red_giant', energyOutput: 5, cost: 300, icon: '🔴', color: '#FF4500', description: '巨大的能量输出' },
  { id: 'blue_giant', name: '蓝巨星', type: 'blue_giant', energyOutput: 15, cost: 1000, icon: '💎', color: '#00BFFF', description: '超高能量输出' },
  { id: 'white_dwarf', name: '白矮星', type: 'white_dwarf', energyOutput: 40, cost: 3000, icon: '⚪', color: '#F0F8FF', description: '致密能量核心' },
  { id: 'pulsar', name: '脉冲星', type: 'pulsar', energyOutput: 100, cost: 10000, icon: '✦', color: '#9370DB', description: '快速旋转的中子星' },
  { id: 'neutron', name: '中子星', type: 'neutron', energyOutput: 300, cost: 40000, icon: '⬡', color: '#7B68EE', description: '极端密度的能量源' },
  { id: 'black_hole', name: '黑洞', type: 'black_hole', energyOutput: 1000, cost: 200000, icon: '⬛', color: '#1a1a2e', description: '时空扭曲能量' },
  { id: 'quasar', name: '类星体', type: 'quasar', energyOutput: 5000, cost: 1000000, icon: '环', color: '#FF1493', description: '宇宙最亮天体' },
];

const INITIAL_SPACESHIPS: Spaceship[] = [
  { id: 'probe', name: '探测船', description: '基础探索单位', level: 1, maxLevel: 50, baseCost: 20, costMultiplier: 1.3, speed: 1, cargoCapacity: 5, icon: '🚀', color: '#00BFFF' },
  { id: 'fighter', name: '战斗机', description: '快速移动', level: 0, maxLevel: 40, baseCost: 100, costMultiplier: 1.4, speed: 3, cargoCapacity: 10, icon: '✈️', color: '#FF4500' },
  { id: 'freighter', name: '货船', description: '运输大量资源', level: 0, maxLevel: 35, baseCost: 500, costMultiplier: 1.5, speed: 0.5, cargoCapacity: 50, icon: '🚢', color: '#32CD32' },
  { id: 'cruiser', name: '巡洋舰', description: '均衡性能', level: 0, maxLevel: 30, baseCost: 2000, costMultiplier: 1.6, speed: 2, cargoCapacity: 30, icon: '🛳️', color: '#9370DB' },
  { id: 'battleship', name: '战列舰', description: '强力探索', level: 0, maxLevel: 25, baseCost: 10000, costMultiplier: 1.7, speed: 1.5, cargoCapacity: 100, icon: '⚓', color: '#FFD700' },
  { id: 'mother_ship', name: '母舰', description: '旗舰级单位', level: 0, maxLevel: 20, baseCost: 50000, costMultiplier: 1.8, speed: 1, cargoCapacity: 500, icon: '🏴', color: '#FF1493' },
];

const INITIAL_STATIONS: Station[] = [
  { id: 'generator', name: '能量发生器', description: '增加能量产出', level: 0, maxLevel: 30, baseCost: 100, costMultiplier: 1.4, effect: { type: 'energy', value: 0.2 }, icon: '⚡' },
  { id: 'research_lab', name: '研究实验室', description: '解锁新科技', level: 0, maxLevel: 25, baseCost: 300, costMultiplier: 1.5, effect: { type: 'research', value: 1 }, icon: '🔬' },
  { id: 'shipyard', name: '船坞', description: '提升舰船速度', level: 0, maxLevel: 20, baseCost: 500, costMultiplier: 1.6, effect: { type: 'speed', value: 0.15 }, icon: '🔧' },
  { id: 'storage', name: '储存站', description: '增加能量上限', level: 0, maxLevel: 25, baseCost: 200, costMultiplier: 1.4, effect: { type: 'capacity', value: 500 }, icon: '📦' },
  { id: 'warp_gate', name: '曲速门', description: '远程探索加速', level: 0, maxLevel: 15, baseCost: 2000, costMultiplier: 1.7, effect: { type: 'warp', value: 0.5 }, icon: '🌀' },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'energy_100', name: '能量收集者', description: '拥有 100 能量', requirement: 100, requirementType: 'energy', unlocked: false, reward: 50 },
  { id: 'energy_1000', name: '能量大师', description: '拥有 1000 能量', requirement: 1000, requirementType: 'energy', unlocked: false, reward: 500 },
  { id: 'energy_10000', name: '能量霸主', description: '拥有 10000 能量', requirement: 10000, requirementType: 'energy', unlocked: false, reward: 5000 },
  { id: 'explore_10', name: '太空探险家', description: '探索 10 次', requirement: 10, requirementType: 'star', unlocked: false, reward: 100 },
  { id: 'explore_50', name: '星际旅行者', description: '探索 50 次', requirement: 50, requirementType: 'star', unlocked: false, reward: 1000 },
  { id: 'distance_100', name: '深空探索', description: '到达 100 光年', requirement: 100, requirementType: 'distance', unlocked: false, reward: 500 },
  { id: 'fleet_master', name: '舰队指挥官', description: '拥有 5 艘满级舰船', requirement: 5, requirementType: 'ship', unlocked: false, reward: 2000 },
];

export function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return Math.floor(num).toString();
}

export function calculateSpaceshipCost(ship: Spaceship): number {
  return Math.floor(ship.baseCost * Math.pow(ship.costMultiplier, ship.level));
}

export function calculateStationCost(station: Station): number {
  return Math.floor(station.baseCost * Math.pow(station.costMultiplier, station.level));
}

export function useSpaceEngine() {
  const [state, setState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(GAME_CONFIG.SAVE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const now = Date.now();
          const offlineTime = Math.min((now - parsed.lastSaveTime) / 1000, GAME_CONFIG.OFFLINE_MAX_HOURS * 3600);
          const energyRate = (parsed.stars || []).reduce((sum: number, s: Star) => sum + s.energyOutput, 0);
          const generator = (parsed.stations || []).find((st: Station) => st.id === 'generator');
          const rateMultiplier = 1 + (generator?.level || 0) * (generator?.effect?.value || 0);
          const offlineEnergy = Math.floor(energyRate * rateMultiplier * offlineTime * 0.5);
          return {
            ...parsed,
            energy: (parsed.energy || 0) + offlineEnergy,
            totalEnergy: (parsed.totalEnergy || 0) + offlineEnergy,
            lastSaveTime: now,
            stars: parsed.stars || INITIAL_STARS,
            spaceships: parsed.spaceships || INITIAL_SPACESHIPS,
            stations: parsed.stations || INITIAL_STATIONS,
            achievements: parsed.achievements || INITIAL_ACHIEVEMENTS,
          };
        } catch {}
      }
    }
    return {
      energy: 100, totalEnergy: 100, totalExplored: 0, maxDistance: 0,
      stars: JSON.parse(JSON.stringify(INITIAL_STARS)),
      spaceships: JSON.parse(JSON.stringify(INITIAL_SPACESHIPS)),
      stations: JSON.parse(JSON.stringify(INITIAL_STATIONS)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      lastSaveTime: Date.now(), startTime: Date.now(),
    };
  });

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const getEnergyRate = useCallback(() => {
    const generator = state.stations.find(s => s.id === 'generator');
    const rateMultiplier = 1 + (generator?.level || 0) * (generator?.effect?.value || 0);
    return state.stars.reduce((sum, s) => sum + s.energyOutput, 0) * rateMultiplier;
  }, [state.stars, state.stations]);

  const getSpeedMultiplier = useCallback(() => {
    const shipyard = state.stations.find(s => s.id === 'shipyard');
    return 1 + (shipyard?.level || 0) * (shipyard?.effect?.value || 0);
  }, [state.stations]);

  const getEnergyCapacity = useCallback(() => {
    const storage = state.stations.find(s => s.id === 'storage');
    return 1000 + (storage?.level || 0) * (storage?.effect?.value || 0);
  }, [state.stations]);

  const collectStar = useCallback((starId: string) => {
    setState(prev => {
      const star = prev.stars.find(s => s.id === starId);
      if (!star || prev.energy < star.cost) return prev;
      const totalExplored = prev.totalExplored + 1;
      const maxDistance = Math.max(prev.maxDistance, star.energyOutput * 10);
      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        let shouldUnlock = false;
        if (a.requirementType === 'star' && totalExplored >= a.requirement) shouldUnlock = true;
        if (a.requirementType === 'distance' && maxDistance >= a.requirement) shouldUnlock = true;
        if (shouldUnlock) return { ...a, unlocked: true };
        return a;
      });
      return { ...prev, energy: prev.energy - star.cost, totalExplored, maxDistance, achievements: newAchievements };
    });
  }, []);

  const upgradeSpaceship = useCallback((shipId: string) => {
    setState(prev => {
      const ship = prev.spaceships.find(s => s.id === shipId);
      if (!ship || ship.level >= ship.maxLevel) return prev;
      const cost = calculateSpaceshipCost(ship);
      if (prev.energy < cost) return prev;
      const newShips = prev.spaceships.map(s => s.id === shipId ? { ...s, level: s.level + 1 } : s);
      const maxLevelShips = newShips.filter(s => s.level >= s.maxLevel).length;
      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        if (a.requirementType === 'ship' && maxLevelShips >= a.requirement) return { ...a, unlocked: true };
        return a;
      });
      return { ...prev, energy: prev.energy - cost, spaceships: newShips, achievements: newAchievements };
    });
  }, []);

  const upgradeStation = useCallback((stationId: string) => {
    setState(prev => {
      const station = prev.stations.find(s => s.id === stationId);
      if (!station || station.level >= station.maxLevel) return prev;
      const cost = calculateStationCost(station);
      if (prev.energy < cost) return prev;
      const newStations = prev.stations.map(s => s.id === stationId ? { ...s, level: s.level + 1 } : s);
      return { ...prev, energy: prev.energy - cost, stations: newStations };
    });
  }, []);

  useEffect(() => {
    let lastUpdate = Date.now();
    gameLoopRef.current = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastUpdate) / 1000;
      lastUpdate = now;
      const rate = getEnergyRate();
      const capacity = getEnergyCapacity();
      setState(prev => ({
        ...prev,
        energy: Math.min(prev.energy + rate * delta, capacity),
        totalEnergy: prev.totalEnergy + rate * delta,
      }));
    }, GAME_CONFIG.TICK_RATE);
    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [getEnergyRate, getEnergyCapacity]);

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
      energy: 100, totalEnergy: 100, totalExplored: 0, maxDistance: 0,
      stars: JSON.parse(JSON.stringify(INITIAL_STARS)),
      spaceships: JSON.parse(JSON.stringify(INITIAL_SPACESHIPS)),
      stations: JSON.parse(JSON.stringify(INITIAL_STATIONS)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      lastSaveTime: Date.now(), startTime: Date.now(),
    });
  }, []);

  return { state, collectStar, upgradeSpaceship, upgradeStation, resetGame, formatNumber, calculateSpaceshipCost, calculateStationCost, getEnergyRate, getSpeedMultiplier, getEnergyCapacity };
}
