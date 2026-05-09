import { useState, useEffect, useCallback, useRef } from 'react';

// 游戏配置
const GAME_CONFIG = {
  TICK_RATE: 100,
  OFFLINE_MAX_HOURS: 24,
  SAVE_KEY: 'factory_tycoon_save',
};

// 资源类型
export interface Resource {
  id: string;
  name: string;
  amount: number;
  maxAmount: number;
  icon: string;
  color: string;
}

// 生产线类型
export interface ProductionLine {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  inputResources: { resourceId: string; amount: number }[];
  outputResource: { resourceId: string; amount: number };
  productionTime: number; // 秒
  currentProgress: number;
  isProducing: boolean;
  icon: string;
  baseCost: number;
  costMultiplier: number;
}

// 工人类型
export interface Worker {
  id: string;
  name: string;
  type: 'gatherer' | 'transporter' | 'engineer';
  count: number;
  efficiency: number;
  cost: number;
  costMultiplier: number;
  icon: string;
  description: string;
}

// 研究/科技
export interface Research {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
  effect: string;
  icon: string;
}

// 成就
export interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  requirementType: 'resource' | 'production' | 'worker' | 'research';
  targetId?: string;
  unlocked: boolean;
  reward: number;
}

// 游戏状态
export interface GameState {
  money: number;
  totalMoney: number;
  resources: Resource[];
  productionLines: ProductionLine[];
  workers: Worker[];
  researches: Research[];
  achievements: Achievement[];
  lastSaveTime: number;
  startTime: number;
  totalProductions: number;
}

// 初始资源
const INITIAL_RESOURCES: Resource[] = [
  { id: 'raw_material', name: '原材料', amount: 0, maxAmount: 1000, icon: '🪨', color: '#8B4513' },
  { id: 'processed', name: '加工材料', amount: 0, maxAmount: 500, icon: '⚙️', color: '#708090' },
  { id: 'component', name: '零部件', amount: 0, maxAmount: 300, icon: '🔩', color: '#4682B4' },
  { id: 'product', name: '成品', amount: 0, maxAmount: 200, icon: '📦', color: '#32CD32' },
  { id: 'advanced', name: '高级产品', amount: 0, maxAmount: 100, icon: '💎', color: '#FFD700' },
];

// 初始生产线
const INITIAL_PRODUCTION_LINES: ProductionLine[] = [
  {
    id: 'mining',
    name: '采矿线',
    description: '自动采集原材料',
    level: 1,
    maxLevel: 50,
    inputResources: [],
    outputResource: { resourceId: 'raw_material', amount: 5 },
    productionTime: 2,
    currentProgress: 0,
    isProducing: false,
    icon: '⛏️',
    baseCost: 0,
    costMultiplier: 1.2,
  },
  {
    id: 'processing',
    name: '加工线',
    description: '将原材料加工成加工材料',
    level: 0,
    maxLevel: 40,
    inputResources: [{ resourceId: 'raw_material', amount: 10 }],
    outputResource: { resourceId: 'processed', amount: 3 },
    productionTime: 3,
    currentProgress: 0,
    isProducing: false,
    icon: '🔧',
    baseCost: 100,
    costMultiplier: 1.25,
  },
  {
    id: 'component',
    name: '零件线',
    description: '制造零部件',
    level: 0,
    maxLevel: 30,
    inputResources: [{ resourceId: 'processed', amount: 5 }],
    outputResource: { resourceId: 'component', amount: 2 },
    productionTime: 4,
    currentProgress: 0,
    isProducing: false,
    icon: '🔨',
    baseCost: 500,
    costMultiplier: 1.3,
  },
  {
    id: 'assembly',
    name: '组装线',
    description: '组装成品',
    level: 0,
    maxLevel: 25,
    inputResources: [
      { resourceId: 'component', amount: 3 },
      { resourceId: 'processed', amount: 5 },
    ],
    outputResource: { resourceId: 'product', amount: 1 },
    productionTime: 5,
    currentProgress: 0,
    isProducing: false,
    icon: '🏭',
    baseCost: 2000,
    costMultiplier: 1.35,
  },
  {
    id: 'advanced',
    name: '高级生产线',
    description: '制造高级产品',
    level: 0,
    maxLevel: 20,
    inputResources: [
      { resourceId: 'product', amount: 2 },
      { resourceId: 'component', amount: 5 },
    ],
    outputResource: { resourceId: 'advanced', amount: 1 },
    productionTime: 8,
    currentProgress: 0,
    isProducing: false,
    icon: '✨',
    baseCost: 10000,
    costMultiplier: 1.4,
  },
];

// 初始工人
const INITIAL_WORKERS: Worker[] = [
  {
    id: 'gatherer',
    name: '采集工',
    type: 'gatherer',
    count: 0,
    efficiency: 1.5,
    cost: 50,
    costMultiplier: 1.15,
    icon: '👷',
    description: '提高采矿线效率',
  },
  {
    id: 'transporter',
    name: '运输工',
    type: 'transporter',
    count: 0,
    efficiency: 1.2,
    cost: 100,
    costMultiplier: 1.2,
    icon: '🚚',
    description: '提高所有生产线速度',
  },
  {
    id: 'engineer',
    name: '工程师',
    type: 'engineer',
    count: 0,
    efficiency: 1.3,
    cost: 500,
    costMultiplier: 1.25,
    icon: '👨‍🔬',
    description: '提高产品质量和售价',
  },
];

// 初始研究
const INITIAL_RESEARCHES: Research[] = [
  { id: 'auto_mining', name: '自动采矿', description: '采矿线自动运行', cost: 0, unlocked: true, effect: 'auto_mining', icon: '⚡' },
  { id: 'efficiency_1', name: '效率提升 I', description: '所有生产线速度+10%', cost: 500, unlocked: false, effect: 'speed_10', icon: '⚡' },
  { id: 'storage_1', name: '仓储扩容 I', description: '资源上限+50%', cost: 1000, unlocked: false, effect: 'storage_50', icon: '📦' },
  { id: 'quality_1', name: '质量控制 I', description: '产品售价+20%', cost: 2000, unlocked: false, effect: 'price_20', icon: '✓' },
  { id: 'efficiency_2', name: '效率提升 II', description: '所有生产线速度+20%', cost: 5000, unlocked: false, effect: 'speed_20', icon: '⚡⚡' },
  { id: 'automation', name: '全自动化', description: '所有生产线自动运行', cost: 10000, unlocked: false, effect: 'full_auto', icon: '🤖' },
];

// 初始成就
const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_money', name: '第一桶金', description: '赚取100金钱', requirement: 100, requirementType: 'resource', targetId: 'money', unlocked: false, reward: 50 },
  { id: 'money_1000', name: '小有积蓄', description: '赚取1000金钱', requirement: 1000, requirementType: 'resource', targetId: 'money', unlocked: false, reward: 200 },
  { id: 'money_10000', name: '资本积累', description: '赚取10000金钱', requirement: 10000, requirementType: 'resource', targetId: 'money', unlocked: false, reward: 1000 },
  { id: 'raw_100', name: '资源大亨', description: '拥有100原材料', requirement: 100, requirementType: 'resource', targetId: 'raw_material', unlocked: false, reward: 100 },
  { id: 'product_10', name: '初级制造商', description: '拥有10个成品', requirement: 10, requirementType: 'resource', targetId: 'product', unlocked: false, reward: 500 },
  { id: 'production_100', name: '生产专家', description: '完成100次生产', requirement: 100, requirementType: 'production', unlocked: false, reward: 300 },
  { id: 'worker_10', name: '雇主', description: '雇佣10个工人', requirement: 10, requirementType: 'worker', unlocked: false, reward: 200 },
  { id: 'research_3', name: '研究员', description: '解锁3项科技', requirement: 3, requirementType: 'research', unlocked: false, reward: 500 },
];

// 资源售价
const RESOURCE_PRICES: Record<string, number> = {
  raw_material: 1,
  processed: 5,
  component: 15,
  product: 50,
  advanced: 200,
};

// 格式化数字
export function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return Math.floor(num).toString();
}

// 计算升级成本
export function calculateUpgradeCost(baseCost: number, currentLevel: number, multiplier: number): number {
  return Math.floor(baseCost * Math.pow(multiplier, currentLevel));
}

// 游戏引擎 Hook
export function useFactoryEngine() {
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
          
          // 计算离线收益
          let offlineMoney = 0;
          if (parsed.productionLines && parsed.resources) {
            parsed.productionLines.forEach((line: ProductionLine) => {
              if (line.level > 0) {
                const cycles = Math.floor(offlineTime / line.productionTime);
                const resourcePrice = RESOURCE_PRICES[line.outputResource.resourceId] || 0;
                offlineMoney += cycles * line.outputResource.amount * resourcePrice * 0.5;
              }
            });
          }
          
          return {
            ...parsed,
            money: (parsed.money || 0) + offlineMoney,
            totalMoney: (parsed.totalMoney || 0) + offlineMoney,
            lastSaveTime: now,
            resources: parsed.resources || INITIAL_RESOURCES,
            productionLines: parsed.productionLines || INITIAL_PRODUCTION_LINES,
            workers: parsed.workers || INITIAL_WORKERS,
            researches: parsed.researches || INITIAL_RESEARCHES,
            achievements: parsed.achievements || INITIAL_ACHIEVEMENTS,
          };
        } catch {
          // 解析失败
        }
      }
    }
    
    return {
      money: 0,
      totalMoney: 0,
      resources: JSON.parse(JSON.stringify(INITIAL_RESOURCES)),
      productionLines: JSON.parse(JSON.stringify(INITIAL_PRODUCTION_LINES)),
      workers: JSON.parse(JSON.stringify(INITIAL_WORKERS)),
      researches: JSON.parse(JSON.stringify(INITIAL_RESEARCHES)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      lastSaveTime: Date.now(),
      startTime: Date.now(),
      totalProductions: 0,
    };
  });

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // 获取速度加成
  const getSpeedMultiplier = useCallback(() => {
    let multiplier = 1;
    
    // 运输工加成
    const transporters = state.workers.find(w => w.id === 'transporter');
    if (transporters) {
      multiplier += transporters.count * (transporters.efficiency - 1) * 0.1;
    }
    
    // 研究加成
    if (state.researches.find(r => r.id === 'efficiency_1')?.unlocked) multiplier *= 1.1;
    if (state.researches.find(r => r.id === 'efficiency_2')?.unlocked) multiplier *= 1.2;
    
    return multiplier;
  }, [state.workers, state.researches]);

  // 获取价格加成
  const getPriceMultiplier = useCallback(() => {
    let multiplier = 1;
    
    // 工程师加成
    const engineers = state.workers.find(w => w.id === 'engineer');
    if (engineers) {
      multiplier += engineers.count * (engineers.efficiency - 1) * 0.05;
    }
    
    // 研究加成
    if (state.researches.find(r => r.id === 'quality_1')?.unlocked) multiplier *= 1.2;
    
    return multiplier;
  }, [state.workers, state.researches]);

  // 获取存储上限加成
  const getStorageMultiplier = useCallback(() => {
    return state.researches.find(r => r.id === 'storage_1')?.unlocked ? 1.5 : 1;
  }, [state.researches]);

  // 检查是否可以生产
  const canProduce = useCallback((line: ProductionLine): boolean => {
    if (line.level === 0) return false;
    
    // 检查输入资源
    for (const input of line.inputResources) {
      const resource = state.resources.find(r => r.id === input.resourceId);
      if (!resource || resource.amount < input.amount) return false;
    }
    
    // 检查输出空间
    const outputResource = state.resources.find(r => r.id === line.outputResource.resourceId);
    const storageMult = getStorageMultiplier();
    if (!outputResource || outputResource.amount >= outputResource.maxAmount * storageMult) return false;
    
    return true;
  }, [state.resources, getStorageMultiplier]);

  // 手动收集原材料
  const gatherResource = useCallback(() => {
    setState(prev => {
      const gatherers = prev.workers.find(w => w.id === 'gatherer');
      const amount = 5 * (gatherers ? Math.pow(gatherers.efficiency, gatherers.count) : 1);
      
      const newResources = prev.resources.map(r => {
        if (r.id === 'raw_material') {
          const storageMult = getStorageMultiplier();
          const maxAmount = r.maxAmount * storageMult;
          return { ...r, amount: Math.min(r.amount + amount, maxAmount) };
        }
        return r;
      });
      
      return { ...prev, resources: newResources };
    });
  }, [getStorageMultiplier]);

  // 升级生产线
  const upgradeLine = useCallback((lineId: string) => {
    setState(prev => {
      const line = prev.productionLines.find(l => l.id === lineId);
      if (!line || line.level >= line.maxLevel) return prev;
      
      const cost = calculateUpgradeCost(line.baseCost, line.level, line.costMultiplier);
      if (prev.money < cost) return prev;
      
      const newLines = prev.productionLines.map(l => {
        if (l.id === lineId) {
          return { ...l, level: l.level + 1 };
        }
        return l;
      });
      
      return {
        ...prev,
        money: prev.money - cost,
        productionLines: newLines,
      };
    });
  }, []);

  // 雇佣工人
  const hireWorker = useCallback((workerId: string) => {
    setState(prev => {
      const worker = prev.workers.find(w => w.id === workerId);
      if (!worker) return prev;
      
      const cost = calculateUpgradeCost(worker.cost, worker.count, worker.costMultiplier);
      if (prev.money < cost) return prev;
      
      const newWorkers = prev.workers.map(w => {
        if (w.id === workerId) {
          return { ...w, count: w.count + 1 };
        }
        return w;
      });
      
      return {
        ...prev,
        money: prev.money - cost,
        workers: newWorkers,
      };
    });
  }, []);

  // 解锁研究
  const unlockResearch = useCallback((researchId: string) => {
    setState(prev => {
      const research = prev.researches.find(r => r.id === researchId);
      if (!research || research.unlocked) return prev;
      if (prev.money < research.cost) return prev;
      
      const newResearches = prev.researches.map(r => {
        if (r.id === researchId) {
          return { ...r, unlocked: true };
        }
        return r;
      });
      
      return {
        ...prev,
        money: prev.money - research.cost,
        researches: newResearches,
      };
    });
  }, []);

  // 出售资源
  const sellResource = useCallback((resourceId: string, amount?: number) => {
    setState(prev => {
      const resource = prev.resources.find(r => r.id === resourceId);
      if (!resource || resource.amount <= 0) return prev;
      
      const sellAmount = amount || resource.amount;
      const actualSellAmount = Math.min(sellAmount, resource.amount);
      const priceMultiplier = getPriceMultiplier();
      const basePrice = RESOURCE_PRICES[resourceId] || 0;
      const moneyGained = actualSellAmount * basePrice * priceMultiplier;
      
      const newResources = prev.resources.map(r => {
        if (r.id === resourceId) {
          return { ...r, amount: r.amount - actualSellAmount };
        }
        return r;
      });
      
      return {
        ...prev,
        money: prev.money + moneyGained,
        totalMoney: prev.totalMoney + moneyGained,
        resources: newResources,
      };
    });
  }, [getPriceMultiplier]);

  // 检查成就
  const checkAchievements = useCallback((prev: GameState): Achievement[] => {
    return prev.achievements.map(a => {
      if (a.unlocked) return a;
      
      let shouldUnlock = false;
      
      if (a.requirementType === 'resource' && a.targetId) {
        if (a.targetId === 'money') {
          shouldUnlock = prev.totalMoney >= a.requirement;
        } else {
          const resource = prev.resources.find(r => r.id === a.targetId);
          shouldUnlock = (resource?.amount || 0) >= a.requirement;
        }
      } else if (a.requirementType === 'production') {
        shouldUnlock = prev.totalProductions >= a.requirement;
      } else if (a.requirementType === 'worker') {
        const totalWorkers = prev.workers.reduce((sum, w) => sum + w.count, 0);
        shouldUnlock = totalWorkers >= a.requirement;
      } else if (a.requirementType === 'research') {
        const unlockedCount = prev.researches.filter(r => r.unlocked).length;
        shouldUnlock = unlockedCount >= a.requirement;
      }
      
      if (shouldUnlock) {
        return { ...a, unlocked: true };
      }
      return a;
    });
  }, []);

  // 游戏循环
  useEffect(() => {
    gameLoopRef.current = setInterval(() => {
      setState(prev => {
        const speedMult = getSpeedMultiplier();
        const tickProgress = (GAME_CONFIG.TICK_RATE / 1000) * speedMult;
        
        let newResources = [...prev.resources];
        let newTotalProductions = prev.totalProductions;
        let newMoney = prev.money;
        
        // 更新生产线
        const newLines = prev.productionLines.map(line => {
          if (line.level === 0) return line;
          
          // 采矿线特殊处理（不需要输入）
          if (line.id === 'mining') {
            const newProgress = line.currentProgress + tickProgress;
            if (newProgress >= line.productionTime) {
              // 生产完成
              const outputResource = newResources.find(r => r.id === line.outputResource.resourceId);
              const storageMult = getStorageMultiplier();
              if (outputResource) {
                const maxAmount = outputResource.maxAmount * storageMult;
                const newAmount = Math.min(outputResource.amount + line.outputResource.amount * line.level, maxAmount);
                newResources = newResources.map(r => 
                  r.id === line.outputResource.resourceId ? { ...r, amount: newAmount } : r
                );
              }
              newTotalProductions++;
              return { ...line, currentProgress: 0 };
            }
            return { ...line, currentProgress: newProgress };
          }
          
          // 其他生产线
          if (!line.isProducing) {
            // 尝试开始生产
            const canStart = line.inputResources.every(input => {
              const resource = newResources.find(r => r.id === input.resourceId);
              return resource && resource.amount >= input.amount;
            });
            
            if (canStart) {
              // 消耗资源
              newResources = newResources.map(r => {
                const input = line.inputResources.find(i => i.resourceId === r.id);
                if (input) {
                  return { ...r, amount: r.amount - input.amount };
                }
                return r;
              });
              return { ...line, isProducing: true, currentProgress: 0 };
            }
          } else {
            // 继续生产
            const newProgress = line.currentProgress + tickProgress;
            if (newProgress >= line.productionTime) {
              // 生产完成
              const outputResource = newResources.find(r => r.id === line.outputResource.resourceId);
              const storageMult = getStorageMultiplier();
              if (outputResource) {
                const maxAmount = outputResource.maxAmount * storageMult;
                const newAmount = Math.min(outputResource.amount + line.outputResource.amount * line.level, maxAmount);
                newResources = newResources.map(r => 
                  r.id === line.outputResource.resourceId ? { ...r, amount: newAmount } : r
                );
              }
              newTotalProductions++;
              return { ...line, isProducing: false, currentProgress: 0 };
            }
            return { ...line, currentProgress: newProgress };
          }
          
          return line;
        });
        
        // 检查成就
        const tempState = { ...prev, resources: newResources, totalProductions: newTotalProductions };
        const newAchievements = checkAchievements(tempState);
        
        // 计算成就奖励
        const achievementReward = newAchievements.reduce((sum, a) => {
          if (a.unlocked && !prev.achievements.find(pa => pa.id === a.id)?.unlocked) {
            return sum + a.reward;
          }
          return sum;
        }, 0);
        
        return {
          ...prev,
          money: newMoney + achievementReward,
          totalMoney: prev.totalMoney + achievementReward,
          resources: newResources,
          productionLines: newLines,
          totalProductions: newTotalProductions,
          achievements: newAchievements,
        };
      });
    }, GAME_CONFIG.TICK_RATE);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [getSpeedMultiplier, getStorageMultiplier, checkAchievements]);

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
      money: 0,
      totalMoney: 0,
      resources: JSON.parse(JSON.stringify(INITIAL_RESOURCES)),
      productionLines: JSON.parse(JSON.stringify(INITIAL_PRODUCTION_LINES)),
      workers: JSON.parse(JSON.stringify(INITIAL_WORKERS)),
      researches: JSON.parse(JSON.stringify(INITIAL_RESEARCHES)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      lastSaveTime: Date.now(),
      startTime: Date.now(),
      totalProductions: 0,
    });
  }, []);

  return {
    state,
    gatherResource,
    upgradeLine,
    hireWorker,
    unlockResearch,
    sellResource,
    resetGame,
    formatNumber,
    calculateUpgradeCost,
    canProduce,
    getSpeedMultiplier,
    getPriceMultiplier,
    RESOURCE_PRICES,
  };
}
