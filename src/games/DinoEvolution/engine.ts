import { useState, useEffect, useCallback, useRef } from 'react';

// 游戏配置
const GAME_CONFIG = {
  TICK_RATE: 100,
  OFFLINE_MAX_HOURS: 24,
  SAVE_KEY: 'dino_evolution_save',
};

// 恐龙阶段
export interface DinoStage {
  id: string;
  name: string;
  description: string;
  icon: string;
  dnaPerSecond: number;
  maxCount: number;
  count: number;
  baseCost: number;
  costMultiplier: number;
  unlockCost: number;
  unlocked: boolean;
  color: string;
}

// 进化升级
export interface Evolution {
  id: string;
  name: string;
  description: string;
  cost: number;
  multiplier: number;
  owned: number;
  maxOwned: number;
  icon: string;
}

// 时代/纪元
export interface Era {
  id: string;
  name: string;
  description: string;
  requirement: number;
  unlocked: boolean;
  dnaMultiplier: number;
  icon: string;
}

// 成就
export interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  requirementType: 'dna' | 'dino' | 'evolution' | 'click';
  targetId?: string;
  unlocked: boolean;
  reward: number;
}

// 游戏状态
export interface GameState {
  dna: number;
  totalDna: number;
  totalClicks: number;
  clickValue: number;
  stages: DinoStage[];
  evolutions: Evolution[];
  eras: Era[];
  achievements: Achievement[];
  lastSaveTime: number;
  startTime: number;
}

// 初始恐龙阶段
const INITIAL_STAGES: DinoStage[] = [
  {
    id: 'egg',
    name: '恐龙蛋',
    description: '生命的起点',
    icon: '🥚',
    dnaPerSecond: 1,
    maxCount: 100,
    count: 0,
    baseCost: 10,
    costMultiplier: 1.15,
    unlockCost: 0,
    unlocked: true,
    color: '#FFE4B5',
  },
  {
    id: 'hatchling',
    name: '幼龙',
    description: '刚孵化的小恐龙',
    icon: '🐣',
    dnaPerSecond: 5,
    maxCount: 80,
    count: 0,
    baseCost: 100,
    costMultiplier: 1.18,
    unlockCost: 50,
    unlocked: false,
    color: '#98FB98',
  },
  {
    id: 'raptor',
    name: '迅猛龙',
    description: '敏捷的猎手',
    icon: '🦖',
    dnaPerSecond: 25,
    maxCount: 60,
    count: 0,
    baseCost: 500,
    costMultiplier: 1.2,
    unlockCost: 300,
    unlocked: false,
    color: '#32CD32',
  },
  {
    id: 'triceratops',
    name: '三角龙',
    description: '强壮的草食恐龙',
    icon: '🦕',
    dnaPerSecond: 100,
    maxCount: 50,
    count: 0,
    baseCost: 2500,
    costMultiplier: 1.22,
    unlockCost: 1500,
    unlocked: false,
    color: '#4169E1',
  },
  {
    id: 'trex',
    name: '霸王龙',
    description: '恐龙之王',
    icon: '🦖',
    dnaPerSecond: 500,
    maxCount: 30,
    count: 0,
    baseCost: 15000,
    costMultiplier: 1.25,
    unlockCost: 10000,
    unlocked: false,
    color: '#DC143C',
  },
  {
    id: 'dragon',
    name: '远古巨龙',
    description: '传说中的存在',
    icon: '🐉',
    dnaPerSecond: 2500,
    maxCount: 20,
    count: 0,
    baseCost: 100000,
    costMultiplier: 1.3,
    unlockCost: 75000,
    unlocked: false,
    color: '#FFD700',
  },
  {
    id: 'godzilla',
    name: '哥斯拉',
    description: '原子恐龙',
    icon: '🦎',
    dnaPerSecond: 15000,
    maxCount: 10,
    count: 0,
    baseCost: 1000000,
    costMultiplier: 1.35,
    unlockCost: 500000,
    unlocked: false,
    color: '#8B008B',
  },
];

// 初始进化升级
const INITIAL_EVOLUTIONS: Evolution[] = [
  {
    id: 'metabolism',
    name: '新陈代谢',
    description: 'DNA产出 +50%',
    cost: 200,
    multiplier: 1.5,
    owned: 0,
    maxOwned: 10,
    icon: '⚡',
  },
  {
    id: 'genetics',
    name: '基因强化',
    description: '点击收益 +100%',
    cost: 500,
    multiplier: 2,
    owned: 0,
    maxOwned: 10,
    icon: '🧬',
  },
  {
    id: 'mutation',
    name: '基因突变',
    description: '所有恐龙效率 +75%',
    cost: 2000,
    multiplier: 1.75,
    owned: 0,
    maxOwned: 8,
    icon: '☢️',
  },
  {
    id: 'adaptation',
    name: '环境适应',
    description: '解锁上限 +20%',
    cost: 5000,
    multiplier: 1.2,
    owned: 0,
    maxOwned: 5,
    icon: '🌍',
  },
  {
    id: 'intelligence',
    name: '智慧进化',
    description: '离线收益 +100%',
    cost: 10000,
    multiplier: 2,
    owned: 0,
    maxOwned: 5,
    icon: '🧠',
  },
  {
    id: 'immortality',
    name: '不朽基因',
    description: 'DNA产出 +200%',
    cost: 50000,
    multiplier: 3,
    owned: 0,
    maxOwned: 3,
    icon: '👑',
  },
];

// 初始时代
const INITIAL_ERAS: Era[] = [
  {
    id: 'triassic',
    name: '三叠纪',
    description: '恐龙时代的黎明',
    requirement: 0,
    unlocked: true,
    dnaMultiplier: 1,
    icon: '🌅',
  },
  {
    id: 'jurassic',
    name: '侏罗纪',
    description: '恐龙的黄金时代',
    requirement: 1000,
    unlocked: false,
    dnaMultiplier: 1.5,
    icon: '🌴',
  },
  {
    id: 'cretaceous',
    name: '白垩纪',
    description: '恐龙的巅峰时期',
    requirement: 10000,
    unlocked: false,
    dnaMultiplier: 2,
    icon: '🌿',
  },
  {
    id: 'future',
    name: '未来纪元',
    description: '恐龙文明的复兴',
    requirement: 100000,
    unlocked: false,
    dnaMultiplier: 3,
    icon: '🚀',
  },
];

// 初始成就
const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_click', name: '初次点击', description: '点击 1 次', requirement: 1, requirementType: 'click', unlocked: false, reward: 10 },
  { id: 'click_100', name: '点击专家', description: '点击 100 次', requirement: 100, requirementType: 'click', unlocked: false, reward: 100 },
  { id: 'click_1000', name: '点击大师', description: '点击 1000 次', requirement: 1000, requirementType: 'click', unlocked: false, reward: 1000 },
  { id: 'dna_100', name: '基因收集者', description: '拥有 100 DNA', requirement: 100, requirementType: 'dna', unlocked: false, reward: 50 },
  { id: 'dna_1000', name: '基因专家', description: '拥有 1000 DNA', requirement: 1000, requirementType: 'dna', unlocked: false, reward: 500 },
  { id: 'dna_10000', name: '基因大师', description: '拥有 10000 DNA', requirement: 10000, requirementType: 'dna', unlocked: false, reward: 5000 },
  { id: 'egg_10', name: '孵化员', description: '拥有 10 个恐龙蛋', requirement: 10, requirementType: 'dino', targetId: 'egg', unlocked: false, reward: 100 },
  { id: 'trex_1', name: '驯龙高手', description: '拥有 1 只霸王龙', requirement: 1, requirementType: 'dino', targetId: 'trex', unlocked: false, reward: 1000 },
  { id: 'dragon_1', name: '龙之主宰', description: '拥有 1 只远古巨龙', requirement: 1, requirementType: 'dino', targetId: 'dragon', unlocked: false, reward: 5000 },
  { id: 'evolution_5', name: '进化论者', description: '购买 5 个进化', requirement: 5, requirementType: 'evolution', unlocked: false, reward: 500 },
];

// 格式化数字
export function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return Math.floor(num).toString();
}

// 计算升级成本
export function calculateStageCost(stage: DinoStage): number {
  return Math.floor(stage.baseCost * Math.pow(stage.costMultiplier, stage.count));
}

export function calculateEvolutionCost(evolution: Evolution): number {
  return Math.floor(evolution.cost * Math.pow(1.5, evolution.owned));
}

// 游戏引擎 Hook
export function useDinoEngine() {
  const [state, setState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(GAME_CONFIG.SAVE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const now = Date.now();
          const offlineTime = Math.min(
            (now - parsed.lastSaveTime) / 1000,
            GAME_CONFIG.OFFLINE_MAX_HOURS * 3600
          );
          
          // 计算离线DNA收益
          let offlineDna = 0;
          if (parsed.stages) {
            parsed.stages.forEach((stage: DinoStage) => {
              offlineDna += stage.count * stage.dnaPerSecond * offlineTime * 0.5;
            });
          }
          
          // 应用进化加成
          const evolutions = parsed.evolutions || INITIAL_EVOLUTIONS;
          let multiplier = 1;
          evolutions.forEach((e: Evolution) => {
            if (e.owned > 0) {
              multiplier *= Math.pow(e.multiplier, e.owned);
            }
          });
          offlineDna *= multiplier;
          
          return {
            ...parsed,
            dna: (parsed.dna || 0) + offlineDna,
            totalDna: (parsed.totalDna || 0) + offlineDna,
            lastSaveTime: now,
            stages: parsed.stages || INITIAL_STAGES,
            evolutions: parsed.evolutions || INITIAL_EVOLUTIONS,
            eras: parsed.eras || INITIAL_ERAS,
            achievements: parsed.achievements || INITIAL_ACHIEVEMENTS,
          };
        } catch {
          // 解析失败
        }
      }
    }
    
    return {
      dna: 0,
      totalDna: 0,
      totalClicks: 0,
      clickValue: 1,
      stages: JSON.parse(JSON.stringify(INITIAL_STAGES)),
      evolutions: JSON.parse(JSON.stringify(INITIAL_EVOLUTIONS)),
      eras: JSON.parse(JSON.stringify(INITIAL_ERAS)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      lastSaveTime: Date.now(),
      startTime: Date.now(),
    };
  });

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // 获取DNA产出倍率
  const getDnaMultiplier = useCallback(() => {
    let multiplier = 1;
    
    // 进化加成
    state.evolutions.forEach(e => {
      if (e.owned > 0) {
        multiplier *= Math.pow(e.multiplier, e.owned);
      }
    });
    
    // 时代加成
    state.eras.forEach(era => {
      if (era.unlocked) {
        multiplier *= era.dnaMultiplier;
      }
    });
    
    return multiplier;
  }, [state.evolutions, state.eras]);

  // 获取点击倍率
  const getClickMultiplier = useCallback(() => {
    let multiplier = 1;
    
    const genetics = state.evolutions.find(e => e.id === 'genetics');
    if (genetics && genetics.owned > 0) {
      multiplier *= Math.pow(genetics.multiplier, genetics.owned);
    }
    
    return multiplier;
  }, [state.evolutions]);

  // 获取当前DNA每秒产出
  const getDnaPerSecond = useCallback(() => {
    let baseDna = 0;
    state.stages.forEach(stage => {
      baseDna += stage.count * stage.dnaPerSecond;
    });
    return baseDna * getDnaMultiplier();
  }, [state.stages, getDnaMultiplier]);

  // 点击获取DNA
  const handleClick = useCallback(() => {
    setState(prev => {
      const clickMult = getClickMultiplier();
      const dnaGained = prev.clickValue * clickMult;
      const newTotalClicks = prev.totalClicks + 1;
      
      // 检查成就
      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        
        let shouldUnlock = false;
        if (a.requirementType === 'click' && newTotalClicks >= a.requirement) {
          shouldUnlock = true;
        } else if (a.requirementType === 'dna' && prev.dna + dnaGained >= a.requirement) {
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
        dna: prev.dna + dnaGained + achievementReward,
        totalDna: prev.totalDna + dnaGained + achievementReward,
        totalClicks: newTotalClicks,
        achievements: newAchievements,
      };
    });
  }, [getClickMultiplier]);

  // 购买恐龙
  const buyStage = useCallback((stageId: string) => {
    setState(prev => {
      const stage = prev.stages.find(s => s.id === stageId);
      if (!stage || !stage.unlocked || stage.count >= stage.maxCount) return prev;
      
      const cost = calculateStageCost(stage);
      if (prev.dna < cost) return prev;
      
      const newStages = prev.stages.map(s => {
        if (s.id === stageId) {
          return { ...s, count: s.count + 1 };
        }
        return s;
      });
      
      // 检查成就
      const tempState = { ...prev, stages: newStages };
      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        
        if (a.requirementType === 'dino' && a.targetId === stageId) {
          const newCount = newStages.find(s => s.id === stageId)?.count || 0;
          if (newCount >= a.requirement) {
            return { ...a, unlocked: true };
          }
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
        dna: prev.dna - cost + achievementReward,
        totalDna: prev.totalDna + achievementReward,
        stages: newStages,
        achievements: newAchievements,
      };
    });
  }, []);

  // 解锁恐龙阶段
  const unlockStage = useCallback((stageId: string) => {
    setState(prev => {
      const stage = prev.stages.find(s => s.id === stageId);
      if (!stage || stage.unlocked) return prev;
      if (prev.dna < stage.unlockCost) return prev;
      
      const newStages = prev.stages.map(s => {
        if (s.id === stageId) {
          return { ...s, unlocked: true };
        }
        return s;
      });
      
      return {
        ...prev,
        dna: prev.dna - stage.unlockCost,
        stages: newStages,
      };
    });
  }, []);

  // 购买进化
  const buyEvolution = useCallback((evolutionId: string) => {
    setState(prev => {
      const evolution = prev.evolutions.find(e => e.id === evolutionId);
      if (!evolution || evolution.owned >= evolution.maxOwned) return prev;
      
      const cost = calculateEvolutionCost(evolution);
      if (prev.dna < cost) return prev;
      
      const newEvolutions = prev.evolutions.map(e => {
        if (e.id === evolutionId) {
          return { ...e, owned: e.owned + 1 };
        }
        return e;
      });
      
      // 检查成就
      const totalEvolutions = newEvolutions.reduce((sum, e) => sum + e.owned, 0);
      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        if (a.requirementType === 'evolution' && totalEvolutions >= a.requirement) {
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
        dna: prev.dna - cost + achievementReward,
        totalDna: prev.totalDna + achievementReward,
        evolutions: newEvolutions,
        achievements: newAchievements,
      };
    });
  }, []);

  // 游戏循环
  useEffect(() => {
    gameLoopRef.current = setInterval(() => {
      setState(prev => {
        const dnaPerSecond = prev.stages.reduce((sum, stage) => {
          return sum + stage.count * stage.dnaPerSecond;
        }, 0);
        
        const multiplier = getDnaMultiplier();
        const dnaGained = dnaPerSecond * (GAME_CONFIG.TICK_RATE / 1000) * multiplier;
        
        // 检查时代解锁
        const newEras = prev.eras.map(era => {
          if (era.unlocked) return era;
          if (prev.totalDna + dnaGained >= era.requirement) {
            return { ...era, unlocked: true };
          }
          return era;
        });
        
        // 检查成就
        const newAchievements = prev.achievements.map(a => {
          if (a.unlocked) return a;
          if (a.requirementType === 'dna' && prev.dna + dnaGained >= a.requirement) {
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
          dna: prev.dna + dnaGained + achievementReward,
          totalDna: prev.totalDna + dnaGained + achievementReward,
          eras: newEras,
          achievements: newAchievements,
        };
      });
    }, GAME_CONFIG.TICK_RATE);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [getDnaMultiplier]);

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
      dna: 0,
      totalDna: 0,
      totalClicks: 0,
      clickValue: 1,
      stages: JSON.parse(JSON.stringify(INITIAL_STAGES)),
      evolutions: JSON.parse(JSON.stringify(INITIAL_EVOLUTIONS)),
      eras: JSON.parse(JSON.stringify(INITIAL_ERAS)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      lastSaveTime: Date.now(),
      startTime: Date.now(),
    });
  }, []);

  return {
    state,
    handleClick,
    buyStage,
    unlockStage,
    buyEvolution,
    resetGame,
    formatNumber,
    calculateStageCost,
    calculateEvolutionCost,
    getDnaPerSecond,
    getDnaMultiplier,
  };
}
