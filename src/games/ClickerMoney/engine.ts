import { useState, useEffect, useCallback, useRef } from 'react';

// 游戏配置
const GAME_CONFIG = {
  TICK_RATE: 100, // 游戏刷新频率 (ms)
  OFFLINE_MAX_HOURS: 24, // 最大离线收益时间
  SAVE_KEY: 'clicker_money_save',
};

// 升级类型定义
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  owned: number;
  maxOwned?: number;
  clickValue?: number;
  autoValue?: number;
  icon: string;
}

// 成就定义
export interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  requirementType: 'money' | 'click' | 'upgrade';
  unlocked: boolean;
  reward: number;
}

// 游戏状态
export interface GameState {
  money: number;
  totalMoney: number;
  totalClicks: number;
  clickValue: number;
  autoIncome: number;
  upgrades: Upgrade[];
  achievements: Achievement[];
  lastSaveTime: number;
  startTime: number;
}

// 初始升级数据
const INITIAL_UPGRADES: Upgrade[] = [
  {
    id: 'cursor',
    name: '点击助手',
    description: '每次点击获得 +1 金钱',
    baseCost: 10,
    costMultiplier: 1.15,
    owned: 0,
    clickValue: 1,
    icon: '👆',
  },
  {
    id: 'worker',
    name: '打工仔',
    description: '每秒自动获得 +1 金钱',
    baseCost: 50,
    costMultiplier: 1.15,
    owned: 0,
    autoValue: 1,
    icon: '👷',
  },
  {
    id: 'manager',
    name: '经理',
    description: '每秒自动获得 +5 金钱',
    baseCost: 250,
    costMultiplier: 1.15,
    owned: 0,
    autoValue: 5,
    icon: '👔',
  },
  {
    id: 'company',
    name: '小公司',
    description: '每秒自动获得 +25 金钱',
    baseCost: 1000,
    costMultiplier: 1.15,
    owned: 0,
    autoValue: 25,
    icon: '🏢',
  },
  {
    id: 'factory',
    name: '工厂',
    description: '每秒自动获得 +100 金钱',
    baseCost: 5000,
    costMultiplier: 1.15,
    owned: 0,
    autoValue: 100,
    icon: '🏭',
  },
  {
    id: 'corporation',
    name: '企业帝国',
    description: '每秒自动获得 +500 金钱',
    baseCost: 25000,
    costMultiplier: 1.15,
    owned: 0,
    autoValue: 500,
    icon: '🌆',
  },
  {
    id: 'bank',
    name: '银行',
    description: '每秒自动获得 +2500 金钱',
    baseCost: 100000,
    costMultiplier: 1.15,
    owned: 0,
    autoValue: 2500,
    icon: '🏦',
  },
  {
    id: 'megacorp',
    name: '超级集团',
    description: '每秒自动获得 +10000 金钱',
    baseCost: 500000,
    costMultiplier: 1.15,
    owned: 0,
    autoValue: 10000,
    icon: '🗼',
  },
];

// 初始成就数据
const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_click', name: '初次点击', description: '点击 1 次', requirement: 1, requirementType: 'click', unlocked: false, reward: 10 },
  { id: 'click_100', name: '点击达人', description: '点击 100 次', requirement: 100, requirementType: 'click', unlocked: false, reward: 100 },
  { id: 'click_1000', name: '点击大师', description: '点击 1000 次', requirement: 1000, requirementType: 'click', unlocked: false, reward: 1000 },
  { id: 'money_100', name: '小有钱财', description: '拥有 100 金钱', requirement: 100, requirementType: 'money', unlocked: false, reward: 50 },
  { id: 'money_1000', name: '千元户', description: '拥有 1000 金钱', requirement: 1000, requirementType: 'money', unlocked: false, reward: 500 },
  { id: 'money_10000', name: '万元户', description: '拥有 10000 金钱', requirement: 10000, requirementType: 'money', unlocked: false, reward: 5000 },
  { id: 'money_100000', name: '百万富翁', description: '拥有 100000 金钱', requirement: 100000, requirementType: 'money', unlocked: false, reward: 50000 },
  { id: 'money_1000000', name: '千万富翁', description: '拥有 1000000 金钱', requirement: 1000000, requirementType: 'money', unlocked: false, reward: 500000 },
  { id: 'upgrade_1', name: '开始投资', description: '购买 1 个升级', requirement: 1, requirementType: 'upgrade', unlocked: false, reward: 25 },
  { id: 'upgrade_10', name: '投资达人', description: '购买 10 个升级', requirement: 10, requirementType: 'upgrade', unlocked: false, reward: 250 },
  { id: 'upgrade_50', name: '投资大师', description: '购买 50 个升级', requirement: 50, requirementType: 'upgrade', unlocked: false, reward: 2500 },
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
export function calculateUpgradeCost(upgrade: Upgrade): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
}

// 游戏引擎 Hook
export function useClickerEngine() {
  const [state, setState] = useState<GameState>(() => {
    // 尝试从本地存储加载
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(GAME_CONFIG.SAVE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // 计算离线收益
          const now = Date.now();
          const offlineTime = Math.min(
            (now - parsed.lastSaveTime) / 1000,
            GAME_CONFIG.OFFLINE_MAX_HOURS * 3600
          );
          const offlineIncome = parsed.autoIncome * offlineTime * 0.5; // 离线收益减半
          
          return {
            ...parsed,
            money: parsed.money + offlineIncome,
            totalMoney: parsed.totalMoney + offlineIncome,
            lastSaveTime: now,
            upgrades: parsed.upgrades || INITIAL_UPGRADES,
            achievements: parsed.achievements || INITIAL_ACHIEVEMENTS,
          };
        } catch {
          // 解析失败，使用初始状态
        }
      }
    }
    
    return {
      money: 0,
      totalMoney: 0,
      totalClicks: 0,
      clickValue: 1,
      autoIncome: 0,
      upgrades: JSON.parse(JSON.stringify(INITIAL_UPGRADES)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      lastSaveTime: Date.now(),
      startTime: Date.now(),
    };
  });

  const [offlineReward, setOfflineReward] = useState<number | null>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // 计算当前点击价值
  const calculateClickValue = useCallback((upgrades: Upgrade[]) => {
    let value = 1;
    upgrades.forEach(u => {
      if (u.clickValue) {
        value += u.clickValue * u.owned;
      }
    });
    return value;
  }, []);

  // 计算当前自动收入
  const calculateAutoIncome = useCallback((upgrades: Upgrade[]) => {
    let income = 0;
    upgrades.forEach(u => {
      if (u.autoValue) {
        income += u.autoValue * u.owned;
      }
    });
    return income;
  }, []);

  // 点击处理
  const handleClick = useCallback(() => {
    setState(prev => {
      const newMoney = prev.money + prev.clickValue;
      const newTotalClicks = prev.totalClicks + 1;
      
      // 检查成就
      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        
        let shouldUnlock = false;
        if (a.requirementType === 'click' && newTotalClicks >= a.requirement) {
          shouldUnlock = true;
        } else if (a.requirementType === 'money' && newMoney >= a.requirement) {
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
        money: newMoney + achievementReward,
        totalMoney: prev.totalMoney + prev.clickValue + achievementReward,
        totalClicks: newTotalClicks,
        achievements: newAchievements,
      };
    });
  }, []);

  // 购买升级
  const buyUpgrade = useCallback((upgradeId: string) => {
    setState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === upgradeId);
      if (!upgrade) return prev;
      
      const cost = calculateUpgradeCost(upgrade);
      if (prev.money < cost) return prev;
      
      const newUpgrades = prev.upgrades.map(u => {
        if (u.id === upgradeId) {
          return { ...u, owned: u.owned + 1 };
        }
        return u;
      });
      
      const newClickValue = calculateClickValue(newUpgrades);
      const newAutoIncome = calculateAutoIncome(newUpgrades);
      const totalUpgrades = newUpgrades.reduce((sum, u) => sum + u.owned, 0);
      
      // 检查升级相关成就
      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        if (a.requirementType === 'upgrade' && totalUpgrades >= a.requirement) {
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
        money: prev.money - cost + achievementReward,
        totalMoney: prev.totalMoney + achievementReward,
        upgrades: newUpgrades,
        clickValue: newClickValue,
        autoIncome: newAutoIncome,
        achievements: newAchievements,
      };
    });
  }, [calculateClickValue, calculateAutoIncome]);

  // 游戏循环
  useEffect(() => {
    gameLoopRef.current = setInterval(() => {
      setState(prev => {
        if (prev.autoIncome <= 0) return prev;
        
        const income = prev.autoIncome * (GAME_CONFIG.TICK_RATE / 1000);
        const newMoney = prev.money + income;
        
        // 检查金钱相关成就
        const newAchievements = prev.achievements.map(a => {
          if (a.unlocked) return a;
          if (a.requirementType === 'money' && newMoney >= a.requirement) {
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
          money: newMoney + achievementReward,
          totalMoney: prev.totalMoney + income + achievementReward,
          achievements: newAchievements,
        };
      });
    }, GAME_CONFIG.TICK_RATE);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, []);

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
      totalClicks: 0,
      clickValue: 1,
      autoIncome: 0,
      upgrades: JSON.parse(JSON.stringify(INITIAL_UPGRADES)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      lastSaveTime: Date.now(),
      startTime: Date.now(),
    });
  }, []);

  return {
    state,
    handleClick,
    buyUpgrade,
    resetGame,
    formatNumber,
    calculateUpgradeCost,
    offlineReward,
  };
}
