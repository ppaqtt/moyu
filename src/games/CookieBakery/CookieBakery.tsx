import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { CookieBakeryEngine, CookieBakeryState, Cookie, CookieType, Oven, COOKIE_TYPES, SHOP_ITEMS } from './engine';

type GameStatus = 'idle' | 'playing' | 'shop';
type TabType = 'bake' | 'recipes' | 'shop';

const BG_GRADIENT = 'linear-gradient(180deg, #3d2a1a 0%, #5c3d2e 50%, #2d1f15 100%)';

export default function CookieBakery() {
  const navigate = useNavigate();
  const [engine] = useState(() => new CookieBakeryEngine());
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [state, setState] = useState<CookieBakeryState>(engine.getState());
  const [highScore, setHighScore] = useLocalStorage('cookiebakery_highscore', 0);
  const [activeTab, setActiveTab] = useState<TabType>('bake');
  const [selectedRecipe, setSelectedRecipe] = useState<CookieType | null>(null);
  const [selectedOven, setSelectedOven] = useState<Oven | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 1500);
  }, []);

  const handleTick = useCallback(() => {
    engine.tick();
    setState(engine.getState());
  }, [engine]);

  useGameLoop({ callback: handleTick, delay: 100, enabled: gameStatus === 'playing' });

  const startGame = useCallback(() => {
    engine.reset();
    engine.start();
    setState(engine.getState());
    setGameStatus('playing');
  }, [engine]);

  const handleSelectRecipe = useCallback((recipe: CookieType) => {
    setSelectedRecipe(selectedRecipe?.id === recipe.id ? null : recipe);
  }, [selectedRecipe]);

  const handleSelectOven = useCallback((oven: Oven) => {
    setSelectedOven(oven);
    if (selectedRecipe) {
      const success = engine.startBaking(oven.id, selectedRecipe.id);
      if (success) {
        showNotification(`开始烤制 ${selectedRecipe.name}!`);
        setState(engine.getState());
      } else {
        showNotification('烤箱已满或未解锁配方!');
      }
    }
  }, [selectedRecipe, engine, showNotification]);

  const handleCollect = useCallback((ovenId: string) => {
    const cookie = engine.collectCookie(ovenId);
    if (cookie) {
      showNotification(`收获 ${cookie.type.name}! 品质: ${Math.floor(cookie.quality)}`);
      setState(engine.getState());
    }
  }, [engine, showNotification]);

  const handleSell = useCallback((cookie: Cookie) => {
    const success = engine.sellCookie(cookie.id);
    if (success) {
      showNotification(`卖出获得金币!`);
      setState(engine.getState());
    }
  }, [engine, showNotification]);

  const handleSellAll = useCallback(() => {
    const earnings = engine.sellAllCookies();
    if (earnings > 0) {
      showNotification(`全部卖出 +${earnings} 金币!`);
      setState(engine.getState());
    }
  }, [engine, showNotification]);

  const handleUnlock = useCallback((recipeId: string) => {
    const success = engine.unlockRecipe(recipeId);
    if (success) {
      showNotification('解锁新配方成功!');
      setState(engine.getState());
    } else {
      showNotification('金币不足!');
    }
  }, [engine, showNotification]);

  const handleShopItem = useCallback((itemId: string) => {
    const success = engine.buyShopItem(itemId);
    if (success) {
      showNotification('购买成功!');
      setState(engine.getState());
    } else {
      showNotification('金币不足!');
    }
  }, [engine, showNotification]);

  const handleOvenUpgrade = useCallback((ovenId: string) => {
    const success = engine.buyOvenUpgrade(ovenId);
    if (success) {
      showNotification('烤箱升级成功!');
      setState(engine.getState());
    } else {
      showNotification('金币不足!');
    }
  }, [engine, showNotification]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'basic': return NEON_COLORS.text;
      case 'special': return NEON_COLORS.warning;
      case 'premium': return NEON_COLORS.secondary;
      case 'legendary': return NEON_COLORS.accent;
      default: return NEON_COLORS.text;
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 90) return NEON_COLORS.accent;
    if (quality >= 75) return NEON_COLORS.success;
    if (quality >= 60) return NEON_COLORS.warning;
    return NEON_COLORS.danger;
  };

  const TabButton = ({ tab, icon, label }: { tab: TabType; icon: string; label: string }) => (
    <motion.button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
        activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
      }`}
      style={{
        backgroundColor: activeTab === tab ? NEON_COLORS.warning + '40' : 'transparent',
      }}
      whileHover={{ scale: 1.05 }}
    >
      <span className="text-lg mr-1">{icon}</span>
      {label}
    </motion.button>
  );

  const renderOven = (oven: Oven) => {
    const readyCookies = oven.cookies.filter(c => {
      const elapsed = Date.now() - c.bakedAt;
      return elapsed >= c.type.bakeTime * 1000 * oven.speedMultiplier;
    });

    return (
      <motion.div
        key={oven.id}
        className="p-4 rounded-xl"
        style={{
          backgroundColor: NEON_COLORS.surface,
          border: `2px solid ${selectedOven?.id === oven.id ? NEON_COLORS.warning : NEON_COLORS.warning + '40'}`,
        }}
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <span className="font-bold" style={{ color: NEON_COLORS.text }}>烤箱 Lv.{oven.level}</span>
              <span className="text-xs ml-2" style={{ color: NEON_COLORS.textDim }}>
                {oven.cookies.length}/{oven.maxCookies}
              </span>
            </div>
          </div>
          <motion.button
            onClick={() => handleOvenUpgrade(oven.id)}
            className="px-3 py-1 rounded text-xs"
            style={{ backgroundColor: NEON_COLORS.accent + '30', color: NEON_COLORS.accent }}
            whileHover={{ scale: 1.05 }}
          >
            ⬆️ {oven.upgradeCost}
          </motion.button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: oven.maxCookies }).map((_, i) => {
            const cookie = oven.cookies[i];
            const isReady = cookie && Date.now() - cookie.bakedAt >= cookie.type.bakeTime * 1000 * oven.speedMultiplier;

            return (
              <motion.div
                key={i}
                onClick={() => {
                  if (isReady) {
                    handleCollect(oven.id);
                  } else if (cookie) {
                    setSelectedOven(oven);
                  }
                }}
                className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer"
                style={{
                  backgroundColor: cookie
                    ? isReady
                      ? NEON_COLORS.success + '30'
                      : NEON_COLORS.warning + '20'
                    : '#1a0f0a',
                  border: `1px solid ${cookie ? (isReady ? NEON_COLORS.success : NEON_COLORS.warning + '60') : '#2a1a10'}`,
                }}
                whileHover={cookie ? { scale: 1.05 } : {}}
              >
                {cookie ? (
                  <>
                    <span className="text-2xl">{cookie.type.emoji}</span>
                    {!isReady && (
                      <div className="w-3/4 h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: NEON_COLORS.warning }}
                          animate={{
                            width: `${engine.getCookieProgress(cookie, oven.speedMultiplier)}%`,
                          }}
                        />
                      </div>
                    )}
                    {isReady && (
                      <span className="text-xs mt-1" style={{ color: NEON_COLORS.success }}>完成!</span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-600">空</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderBakingTab = () => (
    <div className="space-y-4 p-4">
      {/* Ovens */}
      {state.ovens.map(oven => renderOven(oven))}

      {/* Add Oven Button */}
      {state.ovens.length < 3 && (
        <motion.button
          onClick={() => {
            // Add oven logic
          }}
          className="w-full p-4 rounded-xl flex items-center justify-center gap-2"
          style={{
            backgroundColor: NEON_COLORS.surface,
            border: `2px dashed ${NEON_COLORS.warning + '60'}`,
          }}
          whileHover={{ scale: 1.02 }}
        >
          <span className="text-xl">+</span>
          <span style={{ color: NEON_COLORS.warning }}>购买新烤箱 (300💰)</span>
        </motion.button>
      )}

      {/* Ready Cookies */}
      {state.cookies.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold" style={{ color: NEON_COLORS.text }}>可出售的饼干</h3>
            <motion.button
              onClick={handleSellAll}
              className="px-3 py-1 rounded text-sm"
              style={{ backgroundColor: NEON_COLORS.success + '30', color: NEON_COLORS.success }}
              whileHover={{ scale: 1.05 }}
            >
              全部出售 💰
            </motion.button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {state.cookies.map(cookie => (
              <motion.div
                key={cookie.id}
                onClick={() => handleSell(cookie)}
                className="p-2 rounded-lg flex flex-col items-center cursor-pointer"
                style={{
                  backgroundColor: NEON_COLORS.surface,
                  border: `1px solid ${getQualityColor(cookie.quality)}40`,
                }}
                whileHover={{ scale: 1.1 }}
              >
                <span className="text-2xl">{cookie.type.emoji}</span>
                <span className="text-xs" style={{ color: getQualityColor(cookie.quality) }}>
                  {Math.floor(cookie.quality)}%
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Recipe */}
      {selectedRecipe && (
        <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: NEON_COLORS.warning + '20' }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedRecipe.emoji}</span>
            <div className="flex-1">
              <span className="font-bold" style={{ color: getRarityColor(selectedRecipe.rarity) }}>
                {selectedRecipe.name}
              </span>
              <p className="text-xs text-gray-400">
                价格: {selectedRecipe.basePrice}💰 | 时间: {selectedRecipe.bakeTime}s
              </p>
            </div>
            <motion.button
              onClick={() => setSelectedRecipe(null)}
              className="px-2 py-1 rounded text-xs"
              style={{ backgroundColor: NEON_COLORS.danger + '30', color: NEON_COLORS.danger }}
            >
              取消
            </motion.button>
          </div>
          <p className="text-xs text-center mt-2" style={{ color: NEON_COLORS.warning }}>
            点击烤箱空位开始烤制
          </p>
        </div>
      )}
    </div>
  );

  const renderRecipesTab = () => (
    <div className="p-4 space-y-3">
      <h3 className="font-bold text-center mb-3" style={{ color: NEON_COLORS.text }}>配方列表</h3>

      {/* Unlocked */}
      <div className="mb-4">
        <h4 className="text-sm mb-2" style={{ color: NEON_COLORS.success }}>已解锁</h4>
        <div className="grid grid-cols-2 gap-2">
          {state.unlockedRecipes.map(recipeId => {
            const recipe = COOKIE_TYPES.find(r => r.id === recipeId);
            if (!recipe) return null;
            return (
              <motion.button
                key={recipe.id}
                onClick={() => handleSelectRecipe(recipe)}
                className="p-3 rounded-xl flex flex-col items-center gap-1"
                style={{
                  backgroundColor: selectedRecipe?.id === recipe.id ? NEON_COLORS.warning + '40' : NEON_COLORS.surface,
                  border: `1px solid ${getRarityColor(recipe.rarity)}60`,
                }}
                whileHover={{ scale: 1.03 }}
              >
                <span className="text-3xl">{recipe.emoji}</span>
                <span className="text-xs font-bold" style={{ color: getRarityColor(recipe.rarity) }}>{recipe.name}</span>
                <span className="text-xs" style={{ color: NEON_COLORS.warning }}>💰{recipe.basePrice}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Locked */}
      <div>
        <h4 className="text-sm mb-2" style={{ color: NEON_COLORS.textDim }}>未解锁</h4>
        <div className="space-y-2">
          {state.unlockedRecipes.length < COOKIE_TYPES.length && COOKIE_TYPES.filter(r => !state.unlockedRecipes.includes(r.id)).map(recipe => {
            const unlockCost = recipe.basePrice * 10;
            return (
              <motion.button
                key={recipe.id}
                onClick={() => handleUnlock(recipe.id)}
                className="w-full p-3 rounded-xl flex items-center gap-3"
                style={{
                  backgroundColor: NEON_COLORS.surface,
                  border: `1px solid ${getRarityColor(recipe.rarity)}30`,
                }}
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-2xl opacity-50">{recipe.emoji}</span>
                <div className="flex-1 text-left">
                  <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>{recipe.name}</span>
                  <p className="text-xs" style={{ color: NEON_COLORS.textDim }}>
                    {recipe.rarity} | 价格: {recipe.basePrice}💰
                  </p>
                </div>
                <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: NEON_COLORS.warning + '30', color: NEON_COLORS.warning }}>
                  💰{unlockCost}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderShopTab = () => (
    <div className="p-4 space-y-3">
      <h3 className="font-bold text-center mb-3" style={{ color: NEON_COLORS.text }}>道具商店</h3>
      {SHOP_ITEMS.map(item => (
        <motion.button
          key={item.id}
          onClick={() => handleShopItem(item.id)}
          className="w-full p-4 rounded-xl flex items-center gap-3"
          style={{
            backgroundColor: NEON_COLORS.surface,
            border: `1px solid ${NEON_COLORS.primary}40`,
          }}
          whileHover={{ scale: 1.02 }}
        >
          <span className="text-3xl">{item.emoji}</span>
          <div className="flex-1 text-left">
            <span className="font-bold" style={{ color: NEON_COLORS.text }}>{item.name}</span>
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
          style={{ color: NEON_COLORS.warning }}
          whileHover={{ scale: 1.05 }}
        >
          ← 返回
        </motion.button>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.text }}>销量</div>
            <div className="font-bold" style={{ color: NEON_COLORS.success }}>{state.totalSold}</div>
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
        className="w-full max-w-lg rounded-2xl overflow-hidden relative"
        style={{
          backgroundColor: NEON_COLORS.surface,
          boxShadow: `0 0 30px ${NEON_COLORS.warning}20`,
          border: `2px solid ${NEON_COLORS.warning}30`,
        }}
      >
        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: NEON_COLORS.text + '20' }}>
          <TabButton tab="bake" icon="🔥" label="烤制" />
          <TabButton tab="recipes" icon="📖" label="配方" />
          <TabButton tab="shop" icon="🛒" label="商店" />
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
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
                🍪
              </motion.div>
              <h1 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.warning }}>饼干面包店</h1>
              <p className="text-gray-400 text-center mb-6">
                开一家饼干店!<br />
                选择配方，烤制饼干<br />
                卖饼干赚取金币，升级烤箱
              </p>
              <motion.button
                onClick={startGame}
                className="px-8 py-3 rounded-xl font-bold text-lg"
                style={{
                  backgroundColor: NEON_COLORS.warning,
                  color: NEON_COLORS.background,
                  boxShadow: `0 0 20px ${NEON_COLORS.warning}50`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始游戏
              </motion.button>
            </motion.div>
          ) : (
            <>
              {activeTab === 'bake' && renderBakingTab()}
              {activeTab === 'recipes' && renderRecipesTab()}
              {activeTab === 'shop' && renderShopTab()}
            </>
          )}
        </div>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-6 py-3 rounded-xl"
              style={{ backgroundColor: NEON_COLORS.surface, border: `1px solid ${NEON_COLORS.warning}` }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <span className="font-bold" style={{ color: NEON_COLORS.warning }}>{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      {gameStatus === 'playing' && (
        <div className="text-center text-xs opacity-60" style={{ color: NEON_COLORS.text }}>
          <p>选择配方后点击烤箱空位开始烤制</p>
          <p>等待完成后收获并出售饼干</p>
        </div>
      )}
    </div>
  );
}
