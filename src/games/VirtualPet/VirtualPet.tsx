import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { VirtualPetEngine, VirtualPetState, FoodItem, ToyItem, Upgrade } from './engine';

type TabType = 'main' | 'food' | 'toy' | 'clean' | 'shop';
type GameStatus = 'idle' | 'playing' | 'gameover';

const BG_GRADIENT = 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';

export default function VirtualPet() {
  const navigate = useNavigate();
  const [engine] = useState(() => new VirtualPetEngine());
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [state, setState] = useState<VirtualPetState>(engine.getState());
  const [highScore, setHighScore] = useLocalStorage('virtualpet_highscore', 1);
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 1500);
  }, []);

  const handleTick = useCallback(() => {
    engine.tick();
    const newState = engine.getState();
    setState({ ...newState });

    if (newState.gameOver && gameStatus === 'playing') {
      setGameStatus('gameover');
      if (newState.pet.level > highScore) {
        setHighScore(newState.pet.level);
      }
    }
  }, [engine, gameStatus, highScore, setHighScore]);

  useGameLoop({ callback: handleTick, delay: 100, enabled: gameStatus === 'playing' });

  const startGame = useCallback(() => {
    engine.reset();
    engine.start();
    setState(engine.getState());
    setGameStatus('playing');
    setActiveTab('main');
  }, [engine]);

  const handleFeed = useCallback((food: FoodItem) => {
    const success = engine.feed(food.id);
    if (success) {
      setState(engine.getState());
      showNotification(`喂食 ${food.name} 成功!`);
    } else {
      showNotification('金币不足!');
    }
  }, [engine, showNotification]);

  const handlePlay = useCallback((toy: ToyItem) => {
    const success = engine.play(toy.id);
    if (success) {
      setState(engine.getState());
      showNotification(`玩耍 ${toy.name} 开心!`);
    } else {
      showNotification('金币或体力不足!');
    }
  }, [engine, showNotification]);

  const handleClean = useCallback((itemId: string) => {
    const success = engine.clean(itemId);
    if (success) {
      setState(engine.getState());
      showNotification('清洁完成!');
    } else {
      showNotification('金币不足!');
    }
  }, [engine, showNotification]);

  const handleUpgrade = useCallback((upgrade: Upgrade) => {
    const success = engine.buyUpgrade(upgrade.id);
    if (success) {
      setState(engine.getState());
      showNotification(`升级 ${upgrade.name} 成功!`);
    } else {
      showNotification('金币不足或已达满级!');
    }
  }, [engine, showNotification]);

  const handleRest = useCallback(() => {
    const success = engine.rest();
    if (success) {
      setState(engine.getState());
      showNotification('休息中...zzZ');
    } else {
      showNotification('体力已满!');
    }
  }, [engine, showNotification]);

  const getMoodColor = () => {
    const mood = engine.getPetMood();
    switch (mood) {
      case 'happy': return NEON_COLORS.success;
      case 'neutral': return NEON_COLORS.warning;
      case 'sad': return NEON_COLORS.accent;
      case 'critical': return NEON_COLORS.danger;
    }
  };

  const getStatColor = (value: number) => {
    if (value > 60) return NEON_COLORS.success;
    if (value > 30) return NEON_COLORS.warning;
    return NEON_COLORS.danger;
  };

  const StatBar = ({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) => (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xl w-8">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-300">{label}</span>
          <span style={{ color }}>{Math.floor(value)}%</span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );

  const TabButton = ({ tab, icon, label }: { tab: TabType; icon: string; label: string }) => (
    <motion.button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
        activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
      }`}
      style={{
        backgroundColor: activeTab === tab ? NEON_COLORS.primary + '40' : 'transparent',
        borderBottom: activeTab === tab ? `2px solid ${NEON_COLORS.primary}` : '2px solid transparent',
      }}
      whileHover={{ scale: 1.05 }}
    >
      <span className="text-lg mr-1">{icon}</span>
      {label}
    </motion.button>
  );

  const renderMainTab = () => (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Pet Display */}
      <motion.div
        className="relative w-40 h-40 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, ${NEON_COLORS.surface} 0%, ${NEON_COLORS.background} 100%)`,
          boxShadow: `0 0 30px ${getMoodColor()}40`,
        }}
        animate={{
          scale: engine.getPetMood() === 'happy' ? [1, 1.05, 1] : 1,
        }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <span className="text-7xl">{engine.getPetEmoji()}</span>
        <motion.div
          className="absolute -bottom-2 text-2xl"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          💭
        </motion.div>
      </motion.div>

      <div className="text-center">
        <h2 className="text-xl font-bold" style={{ color: NEON_COLORS.text }}>{state.pet.name}</h2>
        <p className="text-sm" style={{ color: getMoodColor() }}>
          {engine.getPetMood() === 'happy' && '非常开心~'}
          {engine.getPetMood() === 'neutral' && '一般般'}
          {engine.getPetMood() === 'sad' && '有点难过...'}
          {engine.getPetMood() === 'critical' && '快不行了!'}
        </p>
      </div>

      {/* Stats */}
      <div className="w-full max-w-xs">
        <StatBar label="饥饿" value={state.pet.hunger} icon="🍖" color={getStatColor(state.pet.hunger)} />
        <StatBar label="开心" value={state.pet.happiness} icon="😊" color={getStatColor(state.pet.happiness)} />
        <StatBar label="清洁" value={state.pet.cleanliness} icon="🧼" color={getStatColor(state.pet.cleanliness)} />
        <StatBar label="体力" value={state.pet.energy} icon="⚡" color={getStatColor(state.pet.energy)} />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mt-4">
        <motion.button
          onClick={handleRest}
          className="px-6 py-3 rounded-xl font-bold text-sm"
          style={{
            backgroundColor: NEON_COLORS.primary + '30',
            color: NEON_COLORS.primary,
            border: `1px solid ${NEON_COLORS.primary}`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          😴 休息
        </motion.button>
      </div>
    </div>
  );

  const renderFoodTab = () => (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4 text-center" style={{ color: NEON_COLORS.text }}>🍖 食物商店</h3>
      <div className="grid grid-cols-2 gap-3">
        {engine.getFoods().map((food) => (
          <motion.button
            key={food.id}
            onClick={() => handleFeed(food)}
            className="p-4 rounded-xl flex flex-col items-center gap-2"
            style={{
              backgroundColor: NEON_COLORS.surface,
              border: `1px solid ${NEON_COLORS.warning}40`,
            }}
            whileHover={{ scale: 1.05, borderColor: NEON_COLORS.warning }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-4xl">{food.emoji}</span>
            <span className="font-bold" style={{ color: NEON_COLORS.text }}>{food.name}</span>
            <span className="text-xs" style={{ color: NEON_COLORS.warning }}>
              +{food.hungerRestore}饱食 +{food.happinessBoost}开心
            </span>
            <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: NEON_COLORS.warning + '30', color: NEON_COLORS.warning }}>
              💰 {food.price}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderToyTab = () => (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4 text-center" style={{ color: NEON_COLORS.text }}>🎮 玩具商店</h3>
      <div className="grid grid-cols-2 gap-3">
        {engine.getToys().map((toy) => (
          <motion.button
            key={toy.id}
            onClick={() => handlePlay(toy)}
            className="p-4 rounded-xl flex flex-col items-center gap-2"
            style={{
              backgroundColor: NEON_COLORS.surface,
              border: `1px solid ${NEON_COLORS.secondary}40`,
            }}
            whileHover={{ scale: 1.05, borderColor: NEON_COLORS.secondary }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-4xl">{toy.emoji}</span>
            <span className="font-bold" style={{ color: NEON_COLORS.text }}>{toy.name}</span>
            <span className="text-xs" style={{ color: NEON_COLORS.secondary }}>
              +{toy.happinessBoost}开心 -{toy.energyCost}体力
            </span>
            <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: NEON_COLORS.secondary + '30', color: NEON_COLORS.secondary }}>
              💰 {toy.price}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderCleanTab = () => (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4 text-center" style={{ color: NEON_COLORS.text }}>🧼 清洁用品</h3>
      <div className="grid grid-cols-2 gap-3">
        {engine.getCleaningItems().map((item) => (
          <motion.button
            key={item.id}
            onClick={() => handleClean(item.id)}
            className="p-4 rounded-xl flex flex-col items-center gap-2"
            style={{
              backgroundColor: NEON_COLORS.surface,
              border: `1px solid ${NEON_COLORS.primary}40`,
            }}
            whileHover={{ scale: 1.05, borderColor: NEON_COLORS.primary }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-4xl">{item.emoji}</span>
            <span className="font-bold" style={{ color: NEON_COLORS.text }}>{item.name}</span>
            <span className="text-xs" style={{ color: NEON_COLORS.primary }}>
              +{item.effect}清洁
            </span>
            <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: NEON_COLORS.primary + '30', color: NEON_COLORS.primary }}>
              💰 {item.price}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderShopTab = () => (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4 text-center" style={{ color: NEON_COLORS.text }}>⬆️ 升级商店</h3>
      <div className="flex flex-col gap-3">
        {state.upgrades.map((upgrade) => (
          <motion.button
            key={upgrade.id}
            onClick={() => handleUpgrade(upgrade)}
            className="p-4 rounded-xl flex items-center gap-4"
            style={{
              backgroundColor: NEON_COLORS.surface,
              border: `1px solid ${NEON_COLORS.accent}40`,
              opacity: upgrade.level >= upgrade.maxLevel ? 0.5 : 1,
            }}
            whileHover={upgrade.level < upgrade.maxLevel ? { scale: 1.02, borderColor: NEON_COLORS.accent } : {}}
            whileTap={{ scale: 0.98 }}
            disabled={upgrade.level >= upgrade.maxLevel}
          >
            <span className="text-3xl">{upgrade.emoji}</span>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: NEON_COLORS.text }}>{upgrade.name}</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: NEON_COLORS.accent + '30', color: NEON_COLORS.accent }}>
                  Lv.{upgrade.level}/{upgrade.maxLevel}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{upgrade.description}</p>
            </div>
            <div className="text-right">
              <span className="text-sm px-2 py-1 rounded block" style={{ backgroundColor: NEON_COLORS.accent + '30', color: NEON_COLORS.accent }}>
                💰 {upgrade.price}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4 min-h-screen p-4" style={{ background: BG_GRADIENT }}>
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between px-4 py-2 rounded-xl" style={{ backgroundColor: NEON_COLORS.surface }}>
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
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.text }}>等级</div>
            <div className="font-bold" style={{ color: NEON_COLORS.accent }}>{state.pet.level}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.text }}>金币</div>
            <div className="font-bold" style={{ color: NEON_COLORS.warning }}>💰 {state.coins}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.text }}>最高</div>
            <div className="font-bold" style={{ color: NEON_COLORS.success }}>{highScore}</div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden relative"
        style={{
          backgroundColor: NEON_COLORS.surface,
          boxShadow: `0 0 30px ${NEON_COLORS.primary}20`,
          border: `2px solid ${NEON_COLORS.primary}30`,
        }}
      >
        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: NEON_COLORS.text + '20' }}>
          <TabButton tab="main" icon="🐱" label="主页" />
          <TabButton tab="food" icon="🍖" label="喂食" />
          <TabButton tab="toy" icon="🎮" label="玩耍" />
          <TabButton tab="clean" icon="🧼" label="清洁" />
          <TabButton tab="shop" icon="⬆️" label="升级" />
        </div>

        {/* Content */}
        <div className="h-96 overflow-y-auto">
          <AnimatePresence mode="wait">
            {gameStatus === 'idle' && (
              <motion.div
                key="idle"
                className="flex flex-col items-center justify-center h-96 p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-8xl mb-6"
                  animate={{ y: [0, -15, 0], rotate: [-5, 5, -5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🐱
                </motion.div>
                <h1 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.primary }}>虚拟宠物</h1>
                <p className="text-gray-400 text-center mb-6">
                  照顾你的虚拟宠物!<br />
                  喂食、玩耍、清洁让它开心<br />
                  保持各项指标健康，提升等级!
                </p>
                <motion.button
                  onClick={startGame}
                  className="px-8 py-3 rounded-xl font-bold text-lg"
                  style={{
                    backgroundColor: NEON_COLORS.primary,
                    color: NEON_COLORS.background,
                    boxShadow: `0 0 20px ${NEON_COLORS.primary}50`,
                  }}
                  whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${NEON_COLORS.primary}70` }}
                  whileTap={{ scale: 0.95 }}
                >
                  开始游戏
                </motion.button>
              </motion.div>
            )}

            {gameStatus === 'playing' && (
              <motion.div
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {activeTab === 'main' && renderMainTab()}
                {activeTab === 'food' && renderFoodTab()}
                {activeTab === 'toy' && renderToyTab()}
                {activeTab === 'clean' && renderCleanTab()}
                {activeTab === 'shop' && renderShopTab()}
              </motion.div>
            )}

            {gameStatus === 'gameover' && (
              <motion.div
                key="gameover"
                className="flex flex-col items-center justify-center h-96 p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-6xl mb-4"
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  😿
                </motion.div>
                <h1 className="text-3xl font-bold mb-2" style={{ color: NEON_COLORS.danger }}>宠物离世</h1>
                <p className="text-gray-400 text-center mb-4">
                  你的宠物因为照顾不周离开了...<br />
                  记得下次更好地照顾它!
                </p>
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500">最终等级</p>
                  <p className="text-4xl font-bold" style={{ color: NEON_COLORS.accent }}>{state.pet.level}</p>
                  {state.pet.level >= highScore && (
                    <motion.span
                      className="text-sm mt-2 inline-block px-3 py-1 rounded-full"
                      style={{ backgroundColor: NEON_COLORS.success + '30', color: NEON_COLORS.success }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      🎉 新纪录! 🎉
                    </motion.span>
                  )}
                </div>
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
                  重新开始
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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

      {/* Footer */}
      <div className="text-center text-xs opacity-50" style={{ color: NEON_COLORS.text }}>
        <p>保持宠物各项指标 &gt; 0 才能生存</p>
        <p>宠物开心时自动获得金币</p>
      </div>
    </div>
  );
}
