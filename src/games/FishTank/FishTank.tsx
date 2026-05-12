import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { FishTankEngine, FishTankState, Fish, FishType, Decoration, FISH_TYPES, DECORATIONS } from './engine';

type GameStatus = 'idle' | 'playing' | 'shop';
type TabType = 'fish' | 'decor' | 'util';

const BG_GRADIENT = 'linear-gradient(180deg, #0a1628 0%, #1a3a5c 50%, #0d2137 100%)';

export default function FishTank() {
  const navigate = useNavigate();
  const [engine] = useState(() => new FishTankEngine());
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [state, setState] = useState<FishTankState>(engine.getState());
  const [highScore, setHighScore] = useLocalStorage('fishtank_highscore', 0);
  const [activeTab, setActiveTab] = useState<TabType>('fish');
  const [selectedFish, setSelectedFish] = useState<Fish | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, forceUpdate] = useState({});

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 1500);
  }, []);

  const handleTick = useCallback(() => {
    engine.tick();
    setState(engine.getState());
    forceUpdate({});
  }, [engine]);

  useGameLoop({ callback: handleTick, delay: 50, enabled: gameStatus === 'playing' || gameStatus === 'shop' });

  const startGame = useCallback(() => {
    engine.reset();
    engine.start();
    setState(engine.getState());
    setGameStatus('playing');
  }, [engine]);

  const buyFish = useCallback((fishType: FishType) => {
    const success = engine.buyFish(fishType.id);
    if (success) {
      setState(engine.getState());
      showNotification(`购买 ${fishType.name} 成功!`);
    } else {
      showNotification('金币不足或鱼缸已满!');
    }
  }, [engine, showNotification]);

  const sellFish = useCallback((fish: Fish) => {
    const success = engine.sellFish(fish.id);
    if (success) {
      setState(engine.getState());
      setSelectedFish(null);
      showNotification(`卖出 ${fish.type.name} +${fish.sellPrice}💰`);
    }
  }, [engine, showNotification]);

  const buyDecoration = useCallback((decor: Decoration) => {
    const success = engine.buyDecoration(decor.id, 100, 100);
    if (success) {
      setState(engine.getState());
      showNotification(`购买 ${decor.name}!`);
    } else {
      showNotification('金币不足!');
    }
  }, [engine, showNotification]);

  const buyTankUpgrade = useCallback(() => {
    const success = engine.buyTankUpgrade();
    if (success) {
      setState(engine.getState());
      showNotification('鱼缸升级成功!');
    } else {
      showNotification('金币不足或已达最大容量!');
    }
  }, [engine, showNotification]);

  const buyCleaning = useCallback(() => {
    const success = engine.buyCleaning();
    if (success) {
      setState(engine.getState());
      showNotification('换水成功! 鱼儿更开心了~');
    } else {
      showNotification('金币不足!');
    }
  }, [engine, showNotification]);

  const buyPremiumFood = useCallback(() => {
    const success = engine.buyPremiumFood();
    if (success) {
      setState(engine.getState());
      showNotification('高级鱼食! 下次收益 x1.5');
    } else {
      showNotification('金币不足!');
    }
  }, [engine, showNotification]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameStatus === 'idle') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#0a2540';
      ctx.fillRect(0, 0, 600, 400);

      // Draw bubbles
      const time = Date.now() / 1000;
      for (let i = 0; i < 10; i++) {
        const x = (time * 20 + i * 60) % 600;
        const y = 400 - ((time * 30 + i * 40) % 400);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 - i * 0.02})`;
        ctx.beginPath();
        ctx.arc(x, y, 3 + i, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw sand
      ctx.fillStyle = '#c2b280';
      ctx.fillRect(0, 370, 600, 30);

      // Draw seaweed in sand
      for (let i = 0; i < 8; i++) {
        const x = 40 + i * 75;
        ctx.fillStyle = '#228b22';
        for (let j = 0; j < 3; j++) {
          const sway = Math.sin(time * 2 + i + j) * 5;
          ctx.beginPath();
          ctx.moveTo(x + j * 8, 370);
          ctx.quadraticCurveTo(x + j * 8 + sway, 340, x + j * 8 + sway * 0.5, 320);
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#228b22';
          ctx.stroke();
        }
      }

      // Draw decorations
      state.decorations.forEach(decor => {
        ctx.font = '28px Arial';
        ctx.fillText(decor.emoji, decor.x, decor.y + 28);
      });

      // Draw fishes
      state.fishes.forEach(fish => {
        ctx.save();
        ctx.translate(fish.x, fish.y);

        // Flip fish based on direction
        if (fish.vx < 0) {
          ctx.scale(-1, 1);
        }

        // Size based on growth
        ctx.scale(fish.size, fish.size);

        // Draw fish emoji
        ctx.font = `${24 + fish.size * 8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fish.emoji, 0, 0);

        // Draw mood indicator
        if (fish.mood < 50) {
          ctx.font = '12px Arial';
          ctx.fillText('💧', 0, -18);
        }

        ctx.restore();
      });
    };

    const interval = setInterval(render, 50);
    return () => clearInterval(interval);
  }, [gameStatus, state]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return NEON_COLORS.text;
      case 'rare': return NEON_COLORS.primary;
      case 'epic': return NEON_COLORS.secondary;
      case 'legendary': return NEON_COLORS.accent;
      default: return NEON_COLORS.text;
    }
  };

  const TabButton = ({ tab, icon, label }: { tab: TabType; icon: string; label: string }) => (
    <motion.button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
        activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
      }`}
      style={{
        backgroundColor: activeTab === tab ? NEON_COLORS.primary + '40' : 'transparent',
      }}
      whileHover={{ scale: 1.05 }}
    >
      <span className="text-lg mr-1">{icon}</span>
      {label}
    </motion.button>
  );

  return (
    <div className="flex flex-col items-center gap-4 min-h-screen p-4" style={{ background: BG_GRADIENT }}>
      {/* Header */}
      <div className="w-full max-w-xl flex items-center justify-between px-4 py-2 rounded-xl" style={{ backgroundColor: NEON_COLORS.surface }}>
        <motion.button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{ color: NEON_COLORS.primary }}
          whileHover={{ scale: 1.05 }}
        >
          ← 返回
        </motion.button>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.text }}>鱼缸</div>
            <div className="font-bold" style={{ color: NEON_COLORS.primary }}>
              {engine.getFishCount()}/{engine.getTankCapacity()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.text }}>金币</div>
            <div className="font-bold" style={{ color: NEON_COLORS.warning }}>💰 {state.coins}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.text }}>累计</div>
            <div className="font-bold" style={{ color: NEON_COLORS.success }}>{state.totalEarned}</div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          boxShadow: `0 0 30px ${NEON_COLORS.primary}30`,
          border: `2px solid ${NEON_COLORS.primary}30`,
        }}
      >
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="block"
        />

        {/* Idle Screen */}
        {gameStatus === 'idle' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(10, 22, 40, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="text-7xl mb-6"
              animate={{ y: [0, -15, 0], rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🐠
            </motion.div>
            <h1 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.primary }}>养鱼大亨</h1>
            <p className="text-gray-400 text-center mb-6 max-w-xs">
              经营你的水族馆!<br />
              购买各种珍稀鱼类<br />
              装饰鱼缸赚取金币
            </p>
            <motion.button
              onClick={startGame}
              className="px-8 py-3 rounded-xl font-bold text-lg"
              style={{
                backgroundColor: NEON_COLORS.primary,
                color: NEON_COLORS.background,
                boxShadow: `0 0 20px ${NEON_COLORS.primary}50`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              开始游戏
            </motion.button>
          </motion.div>
        )}

        {/* Shop Button */}
        {gameStatus === 'playing' && (
          <motion.button
            onClick={() => setGameStatus('shop')}
            className="absolute top-3 right-3 px-4 py-2 rounded-xl font-bold text-sm"
            style={{
              backgroundColor: NEON_COLORS.warning + '90',
              color: NEON_COLORS.background,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🛒 商店
          </motion.button>
        )}

        {/* Fish Info Tooltip */}
        {gameStatus === 'playing' && selectedFish && (
          <motion.div
            className="absolute p-4 rounded-xl"
            style={{
              backgroundColor: NEON_COLORS.surface,
              border: `1px solid ${NEON_COLORS.primary}`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="text-center">
              <span className="text-5xl block mb-2">{selectedFish.emoji}</span>
              <h3 className="font-bold" style={{ color: getRarityColor(selectedFish.type.rarity) }}>
                {selectedFish.type.name}
              </h3>
              <p className="text-xs" style={{ color: NEON_COLORS.text }}>稀有度: {selectedFish.type.rarity}</p>
              <p className="text-sm mt-2" style={{ color: NEON_COLORS.text }}>开心度: {Math.floor(selectedFish.mood)}%</p>
              <div className="flex gap-2 mt-4">
                <motion.button
                  onClick={() => sellFish(selectedFish)}
                  className="px-4 py-2 rounded-lg font-bold text-sm"
                  style={{ backgroundColor: NEON_COLORS.danger, color: NEON_COLORS.text }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  卖出 💰{selectedFish.sellPrice}
                </motion.button>
                <motion.button
                  onClick={() => setSelectedFish(null)}
                  className="px-4 py-2 rounded-lg font-bold text-sm"
                  style={{ backgroundColor: NEON_COLORS.surface, color: NEON_COLORS.text, border: `1px solid ${NEON_COLORS.text}` }}
                  whileHover={{ scale: 1.05 }}
                >
                  关闭
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Shop Panel */}
        {gameStatus === 'shop' && (
          <motion.div
            className="absolute inset-0 flex flex-col"
            style={{ backgroundColor: 'rgba(10, 22, 40, 0.98)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Shop Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: NEON_COLORS.primary + '30' }}>
              <motion.button
                onClick={() => setGameStatus('playing')}
                className="px-4 py-2 rounded-lg font-bold text-sm"
                style={{ color: NEON_COLORS.primary }}
                whileHover={{ scale: 1.05 }}
              >
                ← 返回
              </motion.button>
              <h2 className="text-xl font-bold" style={{ color: NEON_COLORS.primary }}>商店</h2>
              <div className="font-bold" style={{ color: NEON_COLORS.warning }}>💰 {state.coins}</div>
            </div>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: NEON_COLORS.text + '20' }}>
              <TabButton tab="fish" icon="🐟" label="买鱼" />
              <TabButton tab="decor" icon="🏠" label="装饰" />
              <TabButton tab="util" icon="⚙️" label="道具" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'fish' && (
                <div className="grid grid-cols-2 gap-3">
                  {FISH_TYPES.map((fish) => (
                    <motion.button
                      key={fish.id}
                      onClick={() => buyFish(fish)}
                      className="p-3 rounded-xl flex flex-col items-center gap-2"
                      style={{
                        backgroundColor: NEON_COLORS.surface,
                        border: `1px solid ${getRarityColor(fish.rarity)}40`,
                      }}
                      whileHover={{ scale: 1.03, borderColor: getRarityColor(fish.rarity) }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span className="text-3xl">{fish.emoji}</span>
                      <span className="font-bold text-sm" style={{ color: getRarityColor(fish.rarity) }}>{fish.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: getRarityColor(fish.rarity) + '30', color: getRarityColor(fish.rarity) }}>
                        {fish.rarity}
                      </span>
                      <span className="text-xs text-gray-400">
                        💰{fish.minCoins}-{fish.maxCoins}/次
                      </span>
                      <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: NEON_COLORS.warning + '30', color: NEON_COLORS.warning }}>
                        💰 {fish.basePrice}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}

              {activeTab === 'decor' && (
                <div className="space-y-3">
                  <div className="flex gap-2 mb-4">
                    <motion.button
                      onClick={buyTankUpgrade}
                      className="flex-1 p-3 rounded-xl flex flex-col items-center gap-2"
                      style={{
                        backgroundColor: NEON_COLORS.surface,
                        border: `1px solid ${NEON_COLORS.accent}40`,
                      }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <span className="text-2xl">🔧</span>
                      <span className="text-sm font-bold" style={{ color: NEON_COLORS.text }}>扩大鱼缸</span>
                      <span className="text-xs" style={{ color: NEON_COLORS.text }}>容量 +2 ({engine.getTankCapacity()}/{20})</span>
                      <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: NEON_COLORS.accent + '30', color: NEON_COLORS.accent }}>
                        💰 {engine.getUpgradePrice()}
                      </span>
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {DECORATIONS.map((decor) => (
                      <motion.button
                        key={decor.id}
                        onClick={() => buyDecoration(decor)}
                        className="p-3 rounded-xl flex flex-col items-center gap-1"
                        style={{
                          backgroundColor: NEON_COLORS.surface,
                          border: `1px solid ${NEON_COLORS.primary}40`,
                        }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <span className="text-3xl">{decor.emoji}</span>
                        <span className="font-bold text-sm" style={{ color: NEON_COLORS.text }}>{decor.name}</span>
                        <span className="text-xs text-gray-400">
                          {decor.effect === 'beautify' && '美化'}
                          {decor.effect === 'happiness' && '+开心'}
                          {decor.effect === 'coins' && `+${decor.value}金币`}
                        </span>
                        <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: NEON_COLORS.warning + '30', color: NEON_COLORS.warning }}>
                          💰 {decor.price}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'util' && (
                <div className="space-y-3">
                  <motion.button
                    onClick={buyCleaning}
                    className="w-full p-4 rounded-xl flex items-center gap-4"
                    style={{
                      backgroundColor: NEON_COLORS.surface,
                      border: `1px solid ${NEON_COLORS.primary}40`,
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <span className="text-3xl">💧</span>
                    <div className="flex-1 text-left">
                      <span className="font-bold" style={{ color: NEON_COLORS.text }}>换水清洁</span>
                      <p className="text-xs text-gray-400">所有鱼开心值 +20</p>
                    </div>
                    <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: NEON_COLORS.primary + '30', color: NEON_COLORS.primary }}>
                      💰 50
                    </span>
                  </motion.button>

                  <motion.button
                    onClick={buyPremiumFood}
                    className="w-full p-4 rounded-xl flex items-center gap-4"
                    style={{
                      backgroundColor: NEON_COLORS.surface,
                      border: `1px solid ${NEON_COLORS.secondary}40`,
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <span className="text-3xl">🍪</span>
                    <div className="flex-1 text-left">
                      <span className="font-bold" style={{ color: NEON_COLORS.text }}>高级鱼食</span>
                      <p className="text-xs text-gray-400">下次收益 x1.5 (一次性)</p>
                    </div>
                    <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: NEON_COLORS.secondary + '30', color: NEON_COLORS.secondary }}>
                      💰 100
                    </span>
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-6 py-3 rounded-xl"
              style={{ backgroundColor: NEON_COLORS.surface, border: `1px solid ${NEON_COLORS.accent}` }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <span className="font-bold" style={{ color: NEON_COLORS.accent }}>{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      {gameStatus === 'playing' && (
        <div className="text-center text-xs opacity-60" style={{ color: NEON_COLORS.text }}>
          <p>点击鱼儿查看详情或卖出</p>
          <p>金币每5秒自动产生，鱼儿开心时收益更高</p>
        </div>
      )}
    </div>
  );
}
