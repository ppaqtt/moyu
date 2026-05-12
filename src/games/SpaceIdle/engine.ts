import { useState, useEffect, useCallback, useRef } from 'react';

// 游戏配置
const GAME_CONFIG = {
  TICK_RATE: 100,
  OFFLINE_MAX_HOURS: 24,
  SAVE_KEY: 'space_idle_save',
};

// 资源类型
export interface Resource {
  id: string;
  name: string;
  amount: number;
  maxAmount: number;
  icon: string;
  color: string;
  description: string;
}

// 建筑类型
export interface Building {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: { resourceId: string; amount: number }[];
  production: { resourceId: string; amount: number }[];
  icon: string;
  costMultiplier: number;
}

// 科技类型
export interface Technology {
  id: string;
  name: string;
  description: string;
  cost: { resourceId: string; amount: number }[];
  unlocked: boolean;
  effect: string;
  multiplier: number;
  icon: string;
}

// 星球类型
export interface Planet {
  id: string;
  name: string;
  description: string;
  distance: number; // 光年
  requirement: { resourceId: string; amount: number }[];
  colonized: boolean;
  resourceMultiplier: number;
  icon: string;
  color: string;
}

// 成就
export interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  requirementType: 'resource' | 'building' | 'planet' | 'click';
  targetId?: string;
  unlocked: boolean;
  reward: { resourceId: string; amount: number }[];
}

// 游戏状态
export interface GameState {
  resources: Resource[];
  buildings: Building[];
  technologies: Technology[];
  planets: Planet[];
  achievements: Achievement[];
  totalClicks: number;
  lastSaveTime: number;
  startTime: number;
  clickValue: number;
}

// 初始资源
const INITIAL_RESOURCES: Resource[] = [
  { id: 'energy', name: '能量', amount: 50, maxAmount: 1000, icon: '⚡', color: '#FFD700', description: '基础能源' },
  { id: 'minerals', name: '矿物', amount: 0, maxAmount: 500, icon: '🪨', color: '#A9A9A9', description: '建造材料' },
  { id: 'food', name: '食物', amount: 20, maxAmount: 300, icon: '🍖', color: '#32CD32', description: '维持人口' },
  { id: 'research', name: '研究点', amount: 0, maxAmount: 200, icon: '🔬', color: '#00BFFF', description: '科技研发' },
  { id: 'population', name: '人口', amount: 5, maxAmount: 100, icon: '👨‍🚀', color: '#FF69B4', description: '工作人员' },
  { id: 'credits', name: '星际币', amount: 100, maxAmount: 10000, icon: '💰', color: '#FFD700', description: '货币' },
];

// 初始建筑
const INITIAL_BUILDINGS: Building[] = [
  {
    id: 'solar_panel',
    name: '太阳能板',
    description: '产生能量',
    level: 1,
    maxLevel: 50,
    cost: [{ resourceId: 'minerals', amount: 10 }],
    production: [{ resourceId: 'energy', amount: 5 }],
    icon: '☀️',
    costMultiplier: 1.2,
  },
  {
    id: 'mine',
    name: '采矿站',
    description: '开采矿物',
    level: 0,
    maxLevel: 40,
    cost: [{ resourceId: 'energy', amount: 20 }, { resourceId: 'credits', amount: 50 }],
    production: [{ resourceId: 'minerals', amount: 3 }],
    icon: '⛏️',
    costMultiplier: 1.25,
  },
  {
    id: 'hydroponics',
    name: '水培农场',
    description: '生产食物',
    level: 0,
    maxLevel: 35,
    cost: [{ resourceId: 'energy', amount: 30 }, { resourceId: 'minerals', amount: 15 }],
    production: [{ resourceId: 'food', amount: 4 }],
    icon: '🌱',
    costMultiplier: 1.3,
  },
  {
    id: 'lab',
    name: '研究实验室',
    description: '产生研究点',
    level: 0,
    maxLevel: 30,
    cost: [{ resourceId: 'energy', amount: 50 }, { resourceId: 'minerals', amount: 30 }, { resourceId: 'credits', amount: 200 }],
    production: [{ resourceId: 'research', amount: 2 }],
    icon: '🔭',
    costMultiplier: 1.35,
  },
  {
    id: 'habitat',
    name: '居住舱',
    description: '增加人口上限',
    level: 0,
    maxLevel: 25,
    cost: [{ resourceId: 'minerals', amount: 50 }, { resourceId: 'food', amount: 20 }],
    production: [{ resourceId: 'population', amount: 5 }],
    icon: '🏠',
    costMultiplier: 1.4,
  },
  {
    id: 'trading_post',
    name: '贸易站',
    description: '产生星际币',
    level: 0,
    maxLevel: 30,
    cost: [{ resourceId: 'energy', amount: 100 }, { resourceId: 'minerals', amount: 50 }],
    production: [{ resourceId: 'credits', amount: 10 }],
    icon: '🏪',
    costMultiplier: 1.3,
  },
];

// 初始科技
const INITIAL_TECHNOLOGIES: Technology[] = [
  {
    id: 'efficient_solar',
    name: '高效太阳能',
    description: '能量产出 +50%',
    cost: [{ resourceId: 'research', amount: 50 }],
    unlocked: false,
    effect: 'energy_production',
    multiplier: 1.5,
    icon: '🔆',
  },
  {
    id: 'deep_mining',
    name: '深层采矿',
    description: '矿物产出 +50%',
    cost: [{ resourceId: 'research', amount: 100 }],
    unlocked: false,
    effect: 'mineral_production',
    multiplier: 1.5,
    icon: '💎',
  },
  {
    id: 'advanced_hydroponics',
    name: '高级水培',
    description: '食物产出 +50%',
    cost: [{ resourceId: 'research', amount: 150 }],
    unlocked: false,
    effect: 'food_production',
    multiplier: 1.5,
    icon: '🥗',
  },
  {
    id: 'quantum_computing',
    name: '量子计算',
    description: '研究点产出 +100%',
    cost: [{ resourceId: 'research', amount: 300 }],
    unlocked: false,
    effect: 'research_production',
    multiplier: 2,
    icon: '💻',
  },
  {
    id: 'warp_drive',
    name: '曲速引擎',
    description: '解锁星际旅行',
    cost: [{ resourceId: 'research', amount: 1000 }, { resourceId: 'energy', amount: 500 }],
    unlocked: false,
    effect: 'unlock_travel',
    multiplier: 1,
    icon: '🚀',
  },
  {
    id: 'terraforming',
    name: '地球化改造',
    description: '星球资源产出 +100%',
    cost: [{ resourceId: 'research', amount: 2000 }],
    unlocked: false,
    effect: 'planet_multiplier',
    multiplier: 2,
    icon: '🌍',
  },
];

// 初始星球
const INITIAL_PLANETS: Planet[] = [
  {
    id: 'earth',
    name: '地球',
    description: '人类的家园',
    distance: 0,
    requirement: [],
    colonized: true,
    resourceMultiplier: 1,
    icon: '🌍',
    color: '#4169E1',
  },
  {
    id: 'mars',
    name: '火星',
    description: '红色星球',
    distance: 0.5,
    requirement: [{ resourceId: 'energy', amount: 500 }, { resourceId: 'minerals', amount: 200 }],
    colonized: false,
    resourceMultiplier: 1.5,
    icon: '🔴',
    color: '#DC143C',
  },
  {
    id: 'europa',
    name: '欧罗巴',
    description: '木星的冰卫星',
    distance: 4.2,
    requirement: [{ resourceId: 'research', amount: 500 }, { resourceId: 'credits', amount: 1000 }],
    colonized: false,
    resourceMultiplier: 2,
    icon: '❄️',
    color: '#00CED1',
  },
  {
    id: 'titan',
    name: '泰坦',
    description: '土星的卫星',
    distance: 8.5,
    requirement: [{ resourceId: 'research', amount: 1500 }, { resourceId: 'population', amount: 50 }],
    colonized: false,
    resourceMultiplier: 2.5,
    icon: '🌙',
    color: '#FFA500',
  },
  {
    id: 'proxima',
    name: '比邻星b',
    description: '最近的系外行星',
    distance: 4.2,
    requirement: [{ resourceId: 'research', amount: 3000 }, { resourceId: 'energy', amount: 2000 }],
    colonized: false,
    resourceMultiplier: 3,
    icon: '⭐',
    color: '#FF1493',
  },
  {
    id: 'kepler',
    name: '开普勒-452b',
    description: '超级地球',
    distance: 1400,
    requirement: [{ resourceId: 'research', amount: 10000 }, { resourceId: 'credits', amount: 50000 }],
    colonized: false,
    resourceMultiplier: 5,
    icon: '🪐',
    color: '#9370DB',
  },
];

// 初始成就
const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_click', name: '初次点击', description: '点击 1 次', requirement: 1, requirementType: 'click', unlocked: false, reward: [{ resourceId: 'energy', amount: 50 }] },
  { id: 'click_100', name: '探索者', description: '点击 100 次', requirement: 100, requirementType: 'click', unlocked: false, reward: [{ resourceId: 'credits', amount: 500 }] },
  { id: 'energy_1000', name: '能源大亨', description: '拥有 1000 能量', requirement: 1000, requirementType: 'resource', targetId: 'energy', unlocked: false, reward: [{ resourceId: 'minerals', amount: 200 }] },
  { id: 'minerals_500', name: '矿工', description: '拥有 500 矿物', requirement: 500, requirementType: 'resource', targetId: 'minerals', unlocked: false, reward: [{ resourceId: 'credits', amount: 1000 }] },
  { id: 'building_10', name: '建筑师', description: '建造等级总和达到 10', requirement: 10, requirementType: 'building', unlocked: false, reward: [{ resourceId: 'research', amount: 100 }] },
  { id: 'mars_colony', name: '火星殖民者', description: '殖民火星', requirement: 1, requirementType: 'planet', targetId: 'mars', unlocked: false, reward: [{ resourceId: 'credits', amount: 5000 }] },
  { id: 'multi_planet', name: '星际文明', description: '殖民 3 个星球', requirement: 3, requirementType: 'planet', unlocked: false, reward: [{ resourceId: 'research', amount: 2000 }] },
];

// 格式化数字
export function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return Math.floor(num).toString();
}

// 计算建筑升级成本
export function calculateBuildingCost(building: Building): { resourceId: string; amount: number }[] {
  return building.cost.map(c => ({
    resourceId: c.resourceId,
    amount: Math.floor(c.amount * Math.pow(building.costMultiplier, building.level)),
  }));
}

// 检查是否可以支付
export function canAfford(resources: Resource[], costs: { resourceId: string; amount: number }[]): boolean {
  return costs.every(cost => {
    const resource = resources.find(r => r.id === cost.resourceId);
    return resource && resource.amount >= cost.amount;
  });
}

// 游戏引擎 Hook
export function useSpaceEngine() {
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
          let offlineResources: Record<string, number> = {};
          if (parsed.buildings && parsed.resources) {
            parsed.buildings.forEach((building: Building) => {
              if (building.level > 0) {
                building.production.forEach(prod => {
                  const baseAmount = prod.amount * building.level * offlineTime * 0.5;
                  offlineResources[prod.resourceId] = (offlineResources[prod.resourceId] || 0) + baseAmount;
                });
              }
            });
          }
          
          // 应用星球加成
          const planets = parsed.planets || INITIAL_PLANETS;
          const colonizedPlanets = planets.filter((p: Planet) => p.colonized);
          const planetMultiplier = colonizedPlanets.reduce((sum: number, p: Planet) => sum + p.resourceMultiplier, 0) / colonizedPlanets.length || 1;
          
          Object.keys(offlineResources).forEach(key => {
            offlineResources[key] *= planetMultiplier;
          });
          
          // 合并离线收益
          const newResources = (parsed.resources || INITIAL_RESOURCES).map((r: Resource) => ({
            ...r,
            amount: Math.min(r.amount + (offlineResources[r.id] || 0), r.maxAmount),
          }));
          
          return {
            ...parsed,
            resources: newResources,
            lastSaveTime: now,
            buildings: parsed.buildings || INITIAL_BUILDINGS,
            technologies: parsed.technologies || INITIAL_TECHNOLOGIES,
            planets: parsed.planets || INITIAL_PLANETS,
            achievements: parsed.achievements || INITIAL_ACHIEVEMENTS,
          };
        } catch {
          // 解析失败
        }
      }
    }
    
    return {
      resources: JSON.parse(JSON.stringify(INITIAL_RESOURCES)),
      buildings: JSON.parse(JSON.stringify(INITIAL_BUILDINGS)),
      technologies: JSON.parse(JSON.stringify(INITIAL_TECHNOLOGIES)),
      planets: JSON.parse(JSON.stringify(INITIAL_PLANETS)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      totalClicks: 0,
      lastSaveTime: Date.now(),
      startTime: Date.now(),
      clickValue: 1,
    };
  });

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // 获取生产倍率
  const getProductionMultiplier = useCallback((resourceId: string) => {
    let multiplier = 1;
    
    // 科技加成
    state.technologies.forEach(tech => {
      if (tech.unlocked) {
        if (tech.effect === `${resourceId}_production`) {
          multiplier *= tech.multiplier;
        }
      }
    });
    
    // 星球加成
    const colonizedPlanets = state.planets.filter(p => p.colonized);
    const planetMultiplier = colonizedPlanets.reduce((sum, p) => sum + p.resourceMultiplier, 0) / colonizedPlanets.length || 1;
    multiplier *= planetMultiplier;
    
    return multiplier;
  }, [state.technologies, state.planets]);

  // 点击获取资源
  const handleClick = useCallback(() => {
    setState(prev => {
      const newTotalClicks = prev.totalClicks + 1;
      
      // 基础点击产出能量
      const energyIndex = prev.resources.findIndex(r => r.id === 'energy');
      const newResources = [...prev.resources];
      if (energyIndex >= 0) {
        newResources[energyIndex] = {
          ...newResources[energyIndex],
          amount: Math.min(
            newResources[energyIndex].amount + prev.clickValue,
            newResources[energyIndex].maxAmount
          ),
        };
      }
      
      // 检查成就
      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        
        let shouldUnlock = false;
        if (a.requirementType === 'click' && newTotalClicks >= a.requirement) {
          shouldUnlock = true;
        }
        
        if (shouldUnlock) {
          // 发放奖励
          a.reward.forEach(reward => {
            const resIndex = newResources.findIndex(r => r.id === reward.resourceId);
            if (resIndex >= 0) {
              newResources[resIndex] = {
                ...newResources[resIndex],
                amount: Math.min(
                  newResources[resIndex].amount + reward.amount,
                  newResources[resIndex].maxAmount
                ),
              };
            }
          });
          return { ...a, unlocked: true };
        }
        return a;
      });
      
      return {
        ...prev,
        resources: newResources,
        totalClicks: newTotalClicks,
        achievements: newAchievements,
      };
    });
  }, []);

  // 升级建筑
  const upgradeBuilding = useCallback((buildingId: string) => {
    setState(prev => {
      const building = prev.buildings.find(b => b.id === buildingId);
      if (!building || building.level >= building.maxLevel) return prev;
      
      const costs = calculateBuildingCost(building);
      if (!canAfford(prev.resources, costs)) return prev;
      
      // 扣除资源
      const newResources = prev.resources.map(r => {
        const cost = costs.find(c => c.resourceId === r.id);
        if (cost) {
          return { ...r, amount: r.amount - cost.amount };
        }
        return r;
      });
      
      const newBuildings = prev.buildings.map(b => {
        if (b.id === buildingId) {
          return { ...b, level: b.level + 1 };
        }
        return b;
      });
      
      // 检查成就
      const totalBuildingLevels = newBuildings.reduce((sum, b) => sum + b.level, 0);
      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        if (a.requirementType === 'building' && totalBuildingLevels >= a.requirement) {
          a.reward.forEach(reward => {
            const resIndex = newResources.findIndex(r => r.id === reward.resourceId);
            if (resIndex >= 0) {
              newResources[resIndex] = {
                ...newResources[resIndex],
                amount: Math.min(
                  newResources[resIndex].amount + reward.amount,
                  newResources[resIndex].maxAmount
                ),
              };
            }
          });
          return { ...a, unlocked: true };
        }
        return a;
      });
      
      return {
        ...prev,
        resources: newResources,
        buildings: newBuildings,
        achievements: newAchievements,
      };
    });
  }, []);

  // 研究科技
  const researchTechnology = useCallback((techId: string) => {
    setState(prev => {
      const tech = prev.technologies.find(t => t.id === techId);
      if (!tech || tech.unlocked) return prev;
      if (!canAfford(prev.resources, tech.cost)) return prev;
      
      // 扣除资源
      const newResources = prev.resources.map(r => {
        const cost = tech.cost.find(c => c.resourceId === r.id);
        if (cost) {
          return { ...r, amount: r.amount - cost.amount };
        }
        return r;
      });
      
      const newTechnologies = prev.technologies.map(t => {
        if (t.id === techId) {
          return { ...t, unlocked: true };
        }
        return t;
      });
      
      return {
        ...prev,
        resources: newResources,
        technologies: newTechnologies,
      };
    });
  }, []);

  // 殖民星球
  const colonizePlanet = useCallback((planetId: string) => {
    setState(prev => {
      const planet = prev.planets.find(p => p.id === planetId);
      if (!planet || planet.colonized) return prev;
      if (!canAfford(prev.resources, planet.requirement)) return prev;
      
      // 扣除资源
      const newResources = prev.resources.map(r => {
        const req = planet.requirement.find(req => req.resourceId === r.id);
        if (req) {
          return { ...r, amount: r.amount - req.amount };
        }
        return r;
      });
      
      const newPlanets = prev.planets.map(p => {
        if (p.id === planetId) {
          return { ...p, colonized: true };
        }
        return p;
      });
      
      // 检查成就
      const colonizedCount = newPlanets.filter(p => p.colonized).length;
      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        if (a.requirementType === 'planet' && a.targetId === planetId) {
          a.reward.forEach(reward => {
            const resIndex = newResources.findIndex(r => r.id === reward.resourceId);
            if (resIndex >= 0) {
              newResources[resIndex] = {
                ...newResources[resIndex],
                amount: Math.min(
                  newResources[resIndex].amount + reward.amount,
                  newResources[resIndex].maxAmount
                ),
              };
            }
          });
          return { ...a, unlocked: true };
        }
        if (a.requirementType === 'planet' && !a.targetId && colonizedCount >= a.requirement) {
          a.reward.forEach(reward => {
            const resIndex = newResources.findIndex(r => r.id === reward.resourceId);
            if (resIndex >= 0) {
              newResources[resIndex] = {
                ...newResources[resIndex],
                amount: Math.min(
                  newResources[resIndex].amount + reward.amount,
                  newResources[resIndex].maxAmount
                ),
              };
            }
          });
          return { ...a, unlocked: true };
        }
        return a;
      });
      
      return {
        ...prev,
        resources: newResources,
        planets: newPlanets,
        achievements: newAchievements,
      };
    });
  }, []);

  // 游戏循环
  useEffect(() => {
    gameLoopRef.current = setInterval(() => {
      setState(prev => {
        const newResources = [...prev.resources];
        
        // 建筑生产
        prev.buildings.forEach(building => {
          if (building.level > 0) {
            building.production.forEach(prod => {
              const multiplier = getProductionMultiplier(prod.resourceId);
              const amount = prod.amount * building.level * (GAME_CONFIG.TICK_RATE / 1000) * multiplier;
              
              const resIndex = newResources.findIndex(r => r.id === prod.resourceId);
              if (resIndex >= 0) {
                newResources[resIndex] = {
                  ...newResources[resIndex],
                  amount: Math.min(
                    newResources[resIndex].amount + amount,
                    newResources[resIndex].maxAmount
                  ),
                };
              }
            });
          }
        });
        
        // 检查资源成就
        const newAchievements = prev.achievements.map(a => {
          if (a.unlocked) return a;
          if (a.requirementType === 'resource' && a.targetId) {
            const resource = newResources.find(r => r.id === a.targetId);
            if (resource && resource.amount >= a.requirement) {
              a.reward.forEach(reward => {
                const resIndex = newResources.findIndex(r => r.id === reward.resourceId);
                if (resIndex >= 0) {
                  newResources[resIndex] = {
                    ...newResources[resIndex],
                    amount: Math.min(
                      newResources[resIndex].amount + reward.amount,
                      newResources[resIndex].maxAmount
                    ),
                  };
                }
              });
              return { ...a, unlocked: true };
            }
          }
          return a;
        });
        
        return {
          ...prev,
          resources: newResources,
          achievements: newAchievements,
        };
      });
    }, GAME_CONFIG.TICK_RATE);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [getProductionMultiplier]);

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
      resources: JSON.parse(JSON.stringify(INITIAL_RESOURCES)),
      buildings: JSON.parse(JSON.stringify(INITIAL_BUILDINGS)),
      technologies: JSON.parse(JSON.stringify(INITIAL_TECHNOLOGIES)),
      planets: JSON.parse(JSON.stringify(INITIAL_PLANETS)),
      achievements: JSON.parse(JSON.stringify(INITIAL_ACHIEVEMENTS)),
      totalClicks: 0,
      lastSaveTime: Date.now(),
      startTime: Date.now(),
      clickValue: 1,
    });
  }, []);

  return {
    state,
    handleClick,
    upgradeBuilding,
    researchTechnology,
    colonizePlanet,
    resetGame,
    formatNumber,
    calculateBuildingCost,
    canAfford,
    getProductionMultiplier,
  };
}
