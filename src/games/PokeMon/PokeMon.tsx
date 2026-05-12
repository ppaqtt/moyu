import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { PokeMonEngine, PokeMonState, Monster, WildMonster, MONSTER_TYPES, SHOP_ITEMS } from './engine';

type GameStatus = 'idle' | 'playing' | 'shop' | 'battle';
type TabType = 'team' | 'shop';

const BG_GRADIENT = 'linear-gradient(180deg, #1a1a3a 0%, #2a2a5a 50%, #1a1a2a 100%)';

export default function PokeMon() {
  const navigate = useNavigate();
  const [engine] = useState(() => new PokeMonEngine());
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [state, setState] = useState<PokeMonState>(engine.getState());
  const [highScore, setHighScore] = useLocalStorage('pokemon_highscore', 0);
  const [activeTab, setActiveTab] = useState<TabType>('team');
  const [notification, setNotification] = useState<string | null>(null);
  const [showWildInfo, setShowWildInfo] = useState(false);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 1500);
  }, []);

  const handleTick = useCallback(() => {
    engine.tick();
    setState(engine.getState());
  }, [engine]);

  useGameLoop({ callback: handleTick, delay: 100, enabled: gameStatus === 'playing' || gameStatus === 'battle' });

  const startGame = useCallback(() => {
    engine.reset();
    engine.start();
    setState(engine.getState());
    setGameStatus('playing');
  }, [engine]);

  const handleCatch = useCallback((ballType: string) => {
    const result = engine.tryCatch(ballType);
    if (result.success) {
      showNotification(result.message);
    } else {
      showNotification(result.message);
    }
    setState(engine.getState());
  }, [engine, showNotification]);

  const handleAttack = useCallback(() => {
    const result = engine.attackWild();
    if (result) {
      if (result.won) {
        showNotification(`胜利! +${result.expGained}经验 +${result.rewards}金币`);
      } else {
        showNotification('我方宝可梦倒下了!');
      }
      setGameStatus('playing');
    }
    setState(engine.getState());
  }, [engine, showNotification]);

  const handleRun = useCallback(() => {
    engine.runAway();
    setGameStatus('playing');
    setState(engine.getState());
  }, [engine]);

  const handleShopItem = useCallback((itemId: string) => {
    let success = false;
    switch (itemId) {
      case 'potion':
        success = engine.usePotion(0);
        break;
      case 'superpotion':
        success = engine.useSuperPotion(0);
        break;
      case 'healall':
        success = engine.healAll();
        break;
      default:
        // Items like pokeballs handled elsewhere
        success = true;
    }

    if (success) {
      showNotification('使用成功!');
    } else {
      showNotification('金币不足!');
    }
    setState(engine.getState());
  }, [engine, showNotification]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return NEON_COLORS.text;
      case 'rare': return NEON_COLORS.primary;
      case 'epic': return NEON_COLORS.secondary;
      case 'legendary': return NEON_COLORS.accent;
      default: return NEON_COLORS.text;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fire': return '#ff4500';
      case 'water': return '#1e90ff';
      case 'grass': return '#32cd32';
      case 'electric': return '#ffff00';
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
        backgroundColor: activeTab === tab ? NEON_COLORS.secondary + '40' : 'transparent',
      }}
      whileHover={{ scale: 1.05 }}
    >
      <span className="text-lg mr-1">{icon}</span>
      {label}
    </motion.button>
  );

  const renderMonsterCard = (monster: Monster, showActions: boolean = true) => (
    <motion.div
      key={monster.id}
      className="p-4 rounded-xl"
      style={{
        backgroundColor: NEON_COLORS.surface,
        border: `2px solid ${getTypeColor(monster.type)}60`,
      }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl">{monster.type.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold" style={{ color: getTypeColor(monster.type) }}>
              {monster.type.name}
            </span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: getRarityColor(monster.type.rarity) + '30', color: getRarityColor(monster.type.rarity) }}>
              {monster.type.rarity}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Lv.{monster.level}</span>
            <span>ATK: {monster.attack}</span>
            <span>DEF: {monster.defense}</span>
          </div>
        </div>
      </div>

      {/* HP Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: NEON_COLORS.danger }}>HP</span>
          <span style={{ color: NEON_COLORS.text }}>{monster.hp}/{monster.maxHp}</span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: monster.hp > monster.maxHp * 0.5 ? NEON_COLORS.success : monster.hp > monster.maxHp * 0.25 ? NEON_COLORS.warning : NEON_COLORS.danger }}
            animate={{ width: `${(monster.hp / monster.maxHp) * 100}%` }}
          />
        </div>
      </div>

      {/* EXP Bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: NEON_COLORS.primary }}>EXP</span>
          <span style={{ color: NEON_COLORS.text }}>{monster.exp}/{monster.expToLevel}</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: NEON_COLORS.primary }}
            animate={{ width: `${(monster.exp / monster.expToLevel) * 100}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      {showActions && monster.hp < monster.maxHp && (
        <div className="flex gap-2 mt-3">
          <motion.button
            onClick={() => handleShopItem('potion')}
            className="flex-1 py-1 rounded text-xs"
            style={{ backgroundColor: NEON_COLORS.danger + '30', color: NEON_COLORS.danger }}
            whileHover={{ scale: 1.05 }}
          >
            💊 30
          </motion.button>
          <motion.button
            onClick={() => handleShopItem('superpotion')}
            className="flex-1 py-1 rounded text-xs"
            style={{ backgroundColor: NEON_COLORS.secondary + '30', color: NEON_COLORS.secondary }}
            whileHover={{ scale: 1.05 }}
          >
            💉 80
          </motion.button>
        </div>
      )}
    </motion.div>
  );

  const renderWildMonster = () => {
    const wild = state.wildMonster;
    if (!wild) return null;

    const maxHp = MONSTER_TYPES.find(m => m.id === wild.monster.id)!.baseHp * 5;
    const wildHp = maxHp; // Simplified

    return (
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="w-full max-w-md p-6 rounded-2xl"
          style={{ backgroundColor: NEON_COLORS.surface }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          <div className="text-center mb-4">
            <span className="text-6xl block mb-2">{wild.monster.emoji}</span>
            <h2 className="text-2xl font-bold" style={{ color: getTypeColor(wild.monster.type) }}>
              野生 {wild.monster.name}
            </h2>
            <p className="text-sm text-gray-400">Lv.{wild.level}</p>
          </div>

          {/* Battle Log */}
          <div className="mb-4 p-3 rounded-lg h-24 overflow-y-auto" style={{ backgroundColor: '#0a0a1a' }}>
            {state.battleLog.slice(-5).map((log, i) => (
              <p key={i} className="text-sm text-gray-300">{log}</p>
            ))}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <motion.button
              onClick={handleAttack}
              className="py-3 rounded-xl font-bold"
              style={{ backgroundColor: NEON_COLORS.danger, color: NEON_COLORS.text }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ⚔️ 攻击
            </motion.button>
            <motion.button
              onClick={handleRun}
              className="py-3 rounded-xl font-bold"
              style={{ backgroundColor: NEON_COLORS.textDim + '30', color: NEON_COLORS.text }}
              whileHover={{ scale: 1.05 }}
            >
              🏃 逃跑
            </motion.button>
          </div>

          <div className="flex gap-2">
            <motion.button
              onClick={() => handleCatch('pokeball')}
              className="flex-1 py-2 rounded-lg text-sm"
              style={{ backgroundColor: '#333', color: NEON_COLORS.text }}
              whileHover={{ scale: 1.05 }}
            >
              ⚫ 精灵球 20💰
            </motion.button>
            <motion.button
              onClick={() => handleCatch('greatball')}
              className="flex-1 py-2 rounded-lg text-sm"
              style={{ backgroundColor: NEON_COLORS.danger + '30', color: NEON_COLORS.danger }}
              whileHover={{ scale: 1.05 }}
            >
              🔴 超级球 50💰
            </motion.button>
            <motion.button
              onClick={() => handleCatch('ultraball')}
              className="flex-1 py-2 rounded-lg text-sm"
              style={{ backgroundColor: NEON_COLORS.secondary + '30', color: NEON_COLORS.secondary }}
              whileHover={{ scale: 1.05 }}
            >
              💜 高级球 100💰
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 min-h-screen p-4" style={{ background: BG_GRADIENT }}>
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between px-4 py-2 rounded-xl" style={{ backgroundColor: NEON_COLORS.surface }}>
        <motion.button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{ color: NEON_COLORS.secondary }}
          whileHover={{ scale: 1.05 }}
        >
          ← 返回
        </motion.button>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-xs opacity-70" style={{ color: NEON_COLORS.text }}>捕捉</div>
            <div className="font-bold" style={{ color: NEON_COLORS.success }}>{state.totalCaught}</div>
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
        className="w-full max-w-md rounded-2xl overflow-hidden relative"
        style={{
          backgroundColor: NEON_COLORS.surface,
          boxShadow: `0 0 30px ${NEON_COLORS.secondary}20`,
          border: `2px solid ${NEON_COLORS.secondary}30`,
        }}
      >
        {gameStatus === 'idle' ? (
          <motion.div
            className="flex flex-col items-center justify-center p-8"
            style={{ height: 500 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="text-7xl mb-6"
              animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎮
            </motion.div>
            <h1 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.secondary }}>口袋妖怪</h1>
            <p className="text-gray-400 text-center mb-6">
              捕捉野生宝可梦!<br />
              培养你的宝可梦队伍<br />
              挑战更强的敌人
            </p>
            <motion.button
              onClick={startGame}
              className="px-8 py-3 rounded-xl font-bold text-lg"
              style={{
                backgroundColor: NEON_COLORS.secondary,
                color: NEON_COLORS.background,
                boxShadow: `0 0 20px ${NEON_COLORS.secondary}50`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              开始冒险
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Wild Monster Info Banner */}
            {state.wildMonster && gameStatus !== 'battle' && (
              <motion.div
                className="p-3 border-b"
                style={{ backgroundColor: NEON_COLORS.danger + '20', borderColor: NEON_COLORS.danger + '40' }}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl animate-bounce">{state.wildMonster.monster.emoji}</span>
                    <div>
                      <span className="font-bold text-sm" style={{ color: NEON_COLORS.danger }}>
                        野生 {state.wildMonster.monster.name} Lv.{state.wildMonster.level}
                      </span>
                      <p className="text-xs text-gray-400">点击开始战斗!</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setGameStatus('battle')}
                    className="px-4 py-2 rounded-lg font-bold text-sm"
                    style={{ backgroundColor: NEON_COLORS.danger, color: NEON_COLORS.text }}
                    whileHover={{ scale: 1.05 }}
                  >
                    ⚔️ 遭遇!
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: NEON_COLORS.text + '20' }}>
              <TabButton tab="team" icon="👥" label="队伍" />
              <TabButton tab="shop" icon="🏪" label="商店" />
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {activeTab === 'team' && (
                <div className="p-4 space-y-3">
                  {state.monsters.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">还没有宝可梦</p>
                    </div>
                  ) : (
                    state.monsters.map(monster => renderMonsterCard(monster))
                  )}
                </div>
              )}

              {activeTab === 'shop' && (
                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-center mb-3" style={{ color: NEON_COLORS.text }}>道具商店</h3>

                  {/* Healing Items */}
                  <div className="space-y-2">
                    {SHOP_ITEMS.filter(item => item.id.includes('potion') || item.id === 'healall').map(item => (
                      <motion.button
                        key={item.id}
                        onClick={() => handleShopItem(item.id)}
                        className="w-full p-3 rounded-xl flex items-center gap-3"
                        style={{
                          backgroundColor: NEON_COLORS.surface,
                          border: `1px solid ${NEON_COLORS.success}40`,
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

                  {/* Balls */}
                  <div className="pt-3 border-t" style={{ borderColor: NEON_COLORS.text + '20' }}>
                    <h4 className="text-sm mb-2" style={{ color: NEON_COLORS.textDim }}>精灵球</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {SHOP_ITEMS.filter(item => item.id.includes('ball')).map(item => (
                        <motion.button
                          key={item.id}
                          className="p-3 rounded-xl flex flex-col items-center gap-1"
                          style={{
                            backgroundColor: NEON_COLORS.surface,
                            border: `1px solid ${NEON_COLORS.primary}40`,
                          }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="text-2xl">{item.emoji}</span>
                          <span className="text-xs" style={{ color: NEON_COLORS.text }}>{item.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: NEON_COLORS.warning + '30', color: NEON_COLORS.warning }}>
                            💰{item.price}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Wild Monster Encounter Modal */}
        <AnimatePresence>
          {state.wildMonster && gameStatus === 'battle' && renderWildMonster()}
        </AnimatePresence>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-6 py-3 rounded-xl"
              style={{ backgroundColor: NEON_COLORS.surface, border: `1px solid ${NEON_COLORS.secondary}` }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <span className="font-bold" style={{ color: NEON_COLORS.secondary }}>{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      {gameStatus === 'playing' && (
        <div className="text-center text-xs opacity-60" style={{ color: NEON_COLORS.text }}>
          <p>等待野生宝可梦出现</p>
          <p>击败或捕捉它们来获得经验和金币</p>
        </div>
      )}
    </div>
  );
}
