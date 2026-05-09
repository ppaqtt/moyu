import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { GardenGardenEngine, GardenGardenState, Plant, PlantType, Seed, SHOP_ITEMS, PLANT_TYPES } from './engine';

type GameStatus = 'idle' | 'playing' | 'shop';
type TabType = 'seeds' | 'unlock' | 'items';

const BG_GRADIENT = 'linear-gradient(180deg, #1a3a1a 0%, #2d5a2d 50%, #1a2f1a 100%)';

export default function GardenGarden() {
  const navigate = useNavigate();
  const [engine] = useState(() => new GardenGardenEngine());
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [state, setState] = useState<GardenGardenState>(engine.getState());
  const [highScore, setHighScore] = useLocalStorage('gardengarden_highscore', 0);
  const [activeTab, setActiveTab] = useState<TabType>('seeds');
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 1500);
  }, []);

  const handleTick = useCallback(() => {
    engine.tick();
    setState(engine.getState());
  }, [engine]);

  useGameLoop({ callback: handleTick, delay: 100, enabled: gameStatus === 'playing' || gameStatus === 'shop' });

  const startGame = useCallback(() => {
    engine.reset();
    engine.start();
    setState(engine.getState());
    setGameStatus('playing');
  }, [engine]);

  const handleCellClick = useCallback((gridX: number, gridY: number) => {
    if (gameStatus !== 'playing') return;

    const plant = engine.getPlantAtCell(gridX, gridY);

    if (plant) {
      if (plant.growthStage >= 4) {
        // Ready to harvest
        const success = engine.harvestPlant(plant.id);
        if (success) {
          showNotification(`收获 ${plant.type.name}!`);
        }
        setSelectedPlant(null);
      } else {
        // Water the plant
        const success = engine.waterPlant(plant.id);
        if (success) {
          showNotification(`浇水 +20 💧`);
        }
        setSelectedPlant(plant);
      }
    } else if (selectedSeed) {
      // Plant seed
      const success = engine.plantSeed(gridX, gridY, selectedSeed.id);
      if (success) {
        showNotification(`种植 ${selectedSeed.type.name}!`);
        setSelectedSeed(null);
      }
    }
  }, [gameStatus, selectedSeed, showNotification]);

  const handleBuySeeds = useCallback((typeId: string, quantity: number) => {
    const success = engine.buySeeds(typeId, quantity);
    if (success) {
      setState(engine.getState());
      showNotification(`购买 ${quantity}颗种子!`);
    } else {
      showNotification('金币不足!');
    }
  }, [showNotification]);

  const handleUnlock = useCallback((typeId: string) => {
    const success = engine.unlockPlantType(typeId);
    if (success) {
      setState(engine.getState());
      showNotification(`解锁 ${PLANT_TYPES.find(p => p.id === typeId)?.name}!`);
    } else {
      showNotification('金币不足!');
    }
  }, [showNotification]);

  const handleShopItem = useCallback((itemId: string) => {
    const success = engine.buyShopItem(itemId);
    if (success) {
      setState(engine.getState());
      showNotification('购买成功!');
    } else {
      showNotification('金币不足!');
    }
  }, [showNotification]);

  const handleRefillWater = useCallback(() => {
    const success = engine.refillWater();
    if (success) {
      setState(engine.getState());
      showNotification('加水 +30 💧');
    } else {
      showNotification('金币不足或水箱已满!');
    }
  }, [showNotification]);

  const handleWaterAll = useCallback(() => {
    const success = engine.waterAll();
    if (success) {
      setState(engine.getState());
      showNotification('浇水全部植物!');
    } else {
      showNotification('水箱已空!');
    }
  }, [showNotification]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9ca3af';
      case 'rare': return NEON_COLORS.primary;
      case 'epic': return NEON_COLORS.secondary;
      case 'legendary': return NEON_COLORS.accent;
      default: return NEON_COLORS.text;
    }
  };

  const getGrowthBarColor = (progress: number) => {
    if (progress > 75) return NEON_COLORS.success;
    if (progress > 50) return NEON_COLORS.primary;
    if (progress > 25) return NEON_COLORS.warning;
    return NEON_COLORS.danger;
  };

  const TabButton = ({ tab, icon, label }: { tab: TabType; icon: string; label: string }) => (
    <motion.button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
        activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
      }`}
      style={{
        backgroundColor: activeTab === tab ? NEON_COLORS.success + '40' : 'transparent',
      }}
      whileHover={{ scale: 1.05 }}
    >
      <span className="text-lg mr-1">{icon}</span>
      {label}
    </motion.button>
  );

  const renderGrid = () => {
    const cellSize = engine.getGridCellSize();
    const offset = engine.getGridOffset();
    const grid: React.ReactNode[] = [];

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const plant = engine.getPlantAtCell(x, y);
        const isSelected = selectedPlant?.gridX === x && selectedPlant?.gridY === y;

        grid.push(
          <motion.div
            key={`${x}-${y}`}
            onClick={() => handleCellClick(x, y)}
            className="rounded-lg flex flex-col items-center justify-center cursor-pointer relative"
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: isSelected ? NEON_COLORS.success + '40' : '#3d5a3d',
              border: `2px solid ${isSelected ? NEON_COLORS.success : '#4a6b4a'}`,
              boxShadow: selectedSeed && !plant ? `0 0 10px ${NEON_COLORS.accent}40` : 'none',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {plant ? (
              <>
                <span className="text-3xl">{engine.getPlantEmoji(plant)}</span>
                {plant.growthStage < 4 && (
                  <div className="absolute bottom-1 w-3/4 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: getGrowthBarColor(plant.growthProgress) }}
                      animate={{ width: `${plant.growthProgress}%` }}
                    />
                  </div>
                )}
                {plant.waterLevel < 30 && (
                  <span className="absolute top-0.5 right-0.5 text-xs">💧</span>
                )}
              </>
            ) : (
              selectedSeed && <span className="text-gray-500 text-xl">+</span>
            )}
          </motion.div>
        );
      }
    }

    return (
      <div
        className="grid gap-1 p-3 rounded-xl"
        style={{
          gridTemplateColumns: `repeat(5, ${cellSize}px)`,
          backgroundColor: '#2d4a2d',
        }}
      >
        {grid}
      </div>
    );
  };

  const renderSeeds = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-center" style={{ color: NEON_COLORS.text }}>购买种子</h3>
      <div className="grid grid-cols-2 gap-2">
        {state.unlockedTypes.map((typeId) => {
          const type = PLANT_TYPES.find(p => p.id === typeId);
          if (!type) return null;
          return (
            <motion.button
              key={type.id}
              onClick={() => handleBuySeeds(type.id, 1)}
              className="p-3 rounded-xl flex flex-col items-center gap-1"
              style={{
                backgroundColor: NEON_COLORS.surface,
                border: `1px solid ${getRarityColor(type.rarity)}40`,
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="text-2xl">{type.emoji}</span>
              <span className="text-xs font-bold" style={{ color: NEON_COLORS.text }}>{type.name}</span>
              <span className="text-xs" style={{ color: NEON_COLORS.warning }}>💰 {type.seedPrice}</span>
            </motion.button>
          );
        })}
      </div>

      {state.seeds.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold text-center mb-2" style={{ color: NEON_COLORS.text }}>我的种子</h3>
          <div className="grid grid-cols-3 gap-2">
            {state.seeds.map((seed) => (
              <motion.button
                key={seed.id}
                onClick={() => setSelectedSeed(selectedSeed?.id === seed.id ? null : seed)}
                className="p-2 rounded-lg flex flex-col items-center gap-1"
                style={{
                  backgroundColor: selectedSeed?.id === seed.id ? NEON_COLORS.accent + '40' : NEON_COLORS.surface,
                  border: `1px solid ${selectedSeed?.id === seed.id ? NEON_COLORS.accent : 'transparent'}`,
                }}
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-xl">{seed.type.emoji}</span>
                <span className="text-xs" style={{ color: NEON_COLORS.text }}>x{seed.quantity}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderUnlock = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-center" style={{ color: NEON_COLORS.text }}>解锁新种子</h3>
      {PLANT_TYPES.filter(p => !state.unlockedTypes.includes(p.id)).map((type) => {
        const unlockCost = type.seedPrice * 5;
        return (
          <motion.button
            key={type.id}
            onClick={() => handleUnlock(type.id)}
            className="w-full p-3 rounded-xl flex items-center gap-3"
            style={{
              backgroundColor: NEON_COLORS.surface,
              border: `1px solid ${getRarityColor(type.rarity)}40`,
            }}
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-3xl">{type.emoji}</span>
            <div className="flex-1 text-left">
              <span className="font-bold text-sm" style={{ color: getRarityColor(type.rarity) }}>{type.name}</span>
              <p className="text-xs text-gray-400">
                稀有度: {type.rarity} | 售价: 💰{type.sellPrice}
              </p>
            </div>
            <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: NEON_COLORS.warning + '30', color: NEON_COLORS.warning }}>
              💰 {unlockCost}
            </span>
          </motion.button>
        );
      })}
      {PLANT_TYPES.filter(p => !state.unlockedTypes.includes(p.id)).length === 0 && (
        <p className="text-center text-gray-400 text-sm">已解锁所有种子!</p>
      )}
    </div>
  );

  const renderItems = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-center" style={{ color: NEON_COLORS.text }}>商店道具</h3>
      {SHOP_ITEMS.map((item) => (
        <motion.button
          key={item.id}
          onClick={() => handleShopItem(item.id)}
          className="w-full p-3 rounded-xl flex items-center gap-3"
          style={{
            backgroundColor: NEON_COLORS.surface,
            border: `1px solid ${NEON_COLORS.primary}40`,
          }}
          whileHover={{ scale: 1.02 }}
        >
          <span className="text-2xl">{item.emoji}</span>
          <div className="flex-1 text-left">
            <span className="font-bold text-sm" style={{ color: NEON_COLORS.text }}>{item.name}</span>
            <p className="text-xs text-gray-400">{item.description}</p>
          </div>
          <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: NEON_COLORS.warning + '30', color: NEON_COLORS.warning }}>
            💰 {item.price}
          </span>
        </motion.button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4 min-h-screen p-4" style={{ background: BG_GRADIENT }}>
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between px-4 py-2 rounded-xl" style={{ backgroundColor: NEON_COLORS.surface }}>
        <motion.button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{ color: NEON_COLORS.success }}
          whileHover={{ scale: 1.05 }}
        >
          ← 返回
        </motion.button>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.text }}>收获</div>
            <div className="font-bold" style={{ color: NEON_COLORS.success }}>{state.totalHarvested}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.text }}>金币</div>
            <div className="font-bold" style={{ color: NEON_COLORS.warning }}>💰 {state.coins}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.text }}>最高</div>
            <div className="font-bold" style={{ color: NEON_COLORS.accent }}>{state.highScore}</div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          backgroundColor: NEON_COLORS.surface,
          boxShadow: `0 0 30px ${NEON_COLORS.success}20`,
          border: `2px solid ${NEON_COLORS.success}30`,
        }}
      >
        {/* Water Bar */}
        <div className="p-3 border-b" style={{ borderColor: NEON_COLORS.text + '20' }}>
          <div className="flex items-center gap-3">
            <span className="text-lg">💧</span>
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: NEON_COLORS.primary }}
                  animate={{ width: `${(state.waterLevel / state.maxWater) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-xs" style={{ color: NEON_COLORS.text }}>
              {Math.floor(state.waterLevel)}/{state.maxWater}
            </span>
            <motion.button
              onClick={handleRefillWater}
              className="px-2 py-1 rounded text-xs"
              style={{ backgroundColor: NEON_COLORS.primary + '30', color: NEON_COLORS.primary }}
              whileHover={{ scale: 1.05 }}
            >
              +30 💰10
            </motion.button>
          </div>
        </div>

        {/* Grid or Idle Screen */}
        {gameStatus === 'idle' ? (
          <motion.div
            className="flex flex-col items-center justify-center p-8"
            style={{ height: 400 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="text-7xl mb-6"
              animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🌻
            </motion.div>
            <h1 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.success }}>花园种花</h1>
            <p className="text-gray-400 text-center mb-6">
              经营你的花园!<br />
              购买种子，种植浇水<br />
              收获花朵赚取金币
            </p>
            <motion.button
              onClick={startGame}
              className="px-8 py-3 rounded-xl font-bold text-lg"
              style={{
                backgroundColor: NEON_COLORS.success,
                color: NEON_COLORS.background,
                boxShadow: `0 0 20px ${NEON_COLORS.success}50`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              开始游戏
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Garden Grid */}
            <div className="p-3">
              {renderGrid()}
            </div>

            {/* Selected Seed Indicator */}
            {selectedSeed && (
              <div className="px-3 pb-2">
                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: NEON_COLORS.accent + '20' }}>
                  <span>已选择:</span>
                  <span className="text-xl">{selectedSeed.type.emoji}</span>
                  <span style={{ color: NEON_COLORS.text }}>{selectedSeed.type.name}</span>
                  <motion.button
                    onClick={() => setSelectedSeed(null)}
                    className="ml-auto px-2 py-1 rounded text-xs"
                    style={{ backgroundColor: NEON_COLORS.danger + '30', color: NEON_COLORS.danger }}
                    whileHover={{ scale: 1.05 }}
                  >
                    取消
                  </motion.button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="px-3 pb-3 flex gap-2">
              <motion.button
                onClick={handleWaterAll}
                className="flex-1 py-2 rounded-lg text-sm font-bold"
                style={{ backgroundColor: NEON_COLORS.primary + '30', color: NEON_COLORS.primary }}
                whileHover={{ scale: 1.02 }}
              >
                💧 浇灌全部
              </motion.button>
              <motion.button
                onClick={() => setGameStatus('shop')}
                className="flex-1 py-2 rounded-lg text-sm font-bold"
                style={{ backgroundColor: NEON_COLORS.warning + '30', color: NEON_COLORS.warning }}
                whileHover={{ scale: 1.02 }}
              >
                🛒 商店
              </motion.button>
            </div>

            {/* Plant Info */}
            {selectedPlant && selectedPlant.growthStage < 4 && (
              <div className="px-3 pb-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: NEON_COLORS.surface }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{selectedPlant.type.emoji}</span>
                    <div>
                      <span className="font-bold" style={{ color: getRarityColor(selectedPlant.type.rarity) }}>
                        {selectedPlant.type.name}
                      </span>
                      <p className="text-xs text-gray-400">
                        阶段: {selectedPlant.growthStage + 1}/4 | 健康: {Math.floor(selectedPlant.health)}%
                      </p>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: NEON_COLORS.success }}
                      animate={{ width: `${selectedPlant.growthProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {Math.floor(selectedPlant.growthProgress)}% 成熟 | 💧 {Math.floor(selectedPlant.waterLevel)}%
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Shop Panel */}
        {gameStatus === 'shop' && (
          <motion.div
            className="absolute inset-0 flex flex-col"
            style={{ backgroundColor: 'rgba(26, 58, 26, 0.98)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Shop Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: NEON_COLORS.success + '30' }}>
              <motion.button
                onClick={() => setGameStatus('playing')}
                className="px-4 py-2 rounded-lg font-bold text-sm"
                style={{ color: NEON_COLORS.success }}
                whileHover={{ scale: 1.05 }}
              >
                ← 返回
              </motion.button>
              <h2 className="text-xl font-bold" style={{ color: NEON_COLORS.success }}>商店</h2>
              <div className="font-bold" style={{ color: NEON_COLORS.warning }}>💰 {state.coins}</div>
            </div>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: NEON_COLORS.text + '20' }}>
              <TabButton tab="seeds" icon="🌱" label="种子" />
              <TabButton tab="unlock" icon="🔓" label="解锁" />
              <TabButton tab="items" icon="⚗️" label="道具" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'seeds' && renderSeeds()}
              {activeTab === 'unlock' && renderUnlock()}
              {activeTab === 'items' && renderItems()}
            </div>
          </motion.div>
        )}

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-6 py-3 rounded-xl"
              style={{ backgroundColor: NEON_COLORS.surface, border: `1px solid ${NEON_COLORS.success}` }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <span className="font-bold" style={{ color: NEON_COLORS.success }}>{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      {gameStatus === 'playing' && (
        <div className="text-center text-xs opacity-60" style={{ color: NEON_COLORS.text }}>
          <p>点击空格子种植选中的种子</p>
          <p>点击成熟花朵收获，金币会随机返还种子</p>
        </div>
      )}
    </div>
  );
}
