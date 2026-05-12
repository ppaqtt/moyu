import { useState, useEffect } from 'react';
import { LoveStoryEngine, GameState, Character, Gift, DateEvent, AFFECTION_LEVELS } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'title' | 'select' | 'shop' | 'date' | 'result';

export default function LoveStory() {
  const [engine] = useState(() => new LoveStoryEngine());
  const [gameState, setGameState] = useState<GameState>(engine.getState());
  const [phase, setPhase] = useState<GamePhase>('title');
  const [message, setMessage] = useState('');
  const [currentEvent, setCurrentEvent] = useState<DateEvent | null>(null);

  useEffect(() => {
    engine.setStateChangeCallback((state) => {
      setGameState(state);
      if (state.isGameOver) {
        setPhase('result');
      }
    });
  }, [engine]);

  const handleStart = () => {
    engine.restart();
    setPhase('select');
    setMessage('');
  };

  const handleSelectCharacter = (character: Character) => {
    engine.selectCharacter(character.id);
    setMessage(`你选择了 ${character.name}！`);
    setPhase('shop');
  };

  const handleBuyGift = (gift: Gift) => {
    const result = engine.buyGift(gift.id);
    if (result) {
      setMessage(`购买了 ${gift.name}！`);
    } else {
      setMessage('金币不足！');
    }
  };

  const handleGiveGift = (gift: Gift) => {
    const result = engine.giveGift(gift.id);
    setMessage(result.message);
  };

  const handleStartDate = () => {
    const event = engine.startDate();
    if (event) {
      setCurrentEvent(event);
      setPhase('date');
    } else {
      setMessage('体力不足，无法约会！');
    }
  };

  const handleDateChoice = (choiceId: string) => {
    if (!currentEvent) return;
    const result = engine.makeDateChoice(currentEvent.id, choiceId);
    setMessage(result.message);
    setTimeout(() => {
      setCurrentEvent(null);
      setPhase('shop');
    }, 2000);
  };

  const handleEndDay = () => {
    engine.endDay();
    if (gameState.day >= gameState.maxDays) {
      setPhase('result');
    }
  };

  const getHeartColor = (level: number): string => {
    if (level >= 4) return '#ff69b4';
    if (level >= 2) return '#ff9999';
    return '#ffcccc';
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'sweet': return '#ffb6c1';
      case 'cool': return '#6495ed';
      case 'mysterious': return '#9370db';
      case 'energetic': return '#ffd700';
      default: return '#ffffff';
    }
  };

  const getTypeName = (type: string): string => {
    switch (type) {
      case 'sweet': return '温柔型';
      case 'cool': return '高冷型';
      case 'mysterious': return '神秘型';
      case 'energetic': return '活泼型';
      default: return type;
    }
  };

  if (phase === 'title') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: 'linear-gradient(135deg, #2d1f3d 0%, #4a2c5a 50%, #1a1a2e 100%)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-lg"
        >
          <div className="text-7xl mb-6">💕</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-red-500 to-yellow-500 bg-clip-text text-transparent">
            恋爱养成
          </h1>
          <p className="text-gray-300 mb-8 text-lg">Love Story</p>

          <div className="glass-card rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-lg font-bold text-pink-400 mb-3">🎮 游戏说明</h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• 选择心仪的角色进行约会</li>
              <li>• 通过约会和送礼提升好感度</li>
              <li>• 游戏共14天，合理安排时间</li>
              <li>• 好感度达到恋人级别即可完美通关</li>
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{
              background: 'linear-gradient(135deg, #ff69b4, #ff1493)',
              boxShadow: '0 0 30px rgba(255, 105, 180, 0.5)'
            }}
          >
            开始恋爱
          </motion.button>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 105, 180, 0.3);
          }
        `}</style>
      </div>
    );
  }

  if (phase === 'select') {
    const characters = engine.getAvailableCharacters();

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: 'linear-gradient(135deg, #2d1f3d 0%, #4a2c5a 50%, #1a1a2e 100%)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-2xl w-full"
        >
          <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-pink-400 to-red-500 bg-clip-text text-transparent">
            选择你的心动对象
          </h1>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {characters.map(character => (
              <motion.div
                key={character.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleSelectCharacter(character)}
                className="glass-card rounded-xl p-4 cursor-pointer"
                style={{ borderColor: getTypeColor(character.type) + '50' }}
              >
                <div className="text-5xl mb-3 text-center">{character.avatar}</div>
                <h3 className="text-xl font-bold text-white text-center mb-1">{character.name}</h3>
                <div className="text-center mb-2">
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: getTypeColor(character.type) + '33', color: getTypeColor(character.type) }}
                  >
                    {getTypeName(character.type)}
                  </span>
                </div>
                <p className="text-gray-400 text-xs text-center">{character.description}</p>
                <div className="mt-2 text-center text-pink-400 text-sm">
                  初始好感: {character.initialAffection}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 105, 180, 0.3);
          }
        `}</style>
      </div>
    );
  }

  if (phase === 'result') {
    const ending = engine.getEndingMessage();
    const isGoodEnding = gameState.ending === 'best' || gameState.ending === 'good';

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{
             background: isGoodEnding
               ? 'linear-gradient(135deg, #3d1f2d 0%, #5a2c4a 50%, #2d1f3d 100%)'
               : 'linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 50%, #2d2d2d 100%)'
           }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-lg"
        >
          <div className="text-8xl mb-6">{ending.emoji}</div>
          <h1 className="text-3xl font-bold mb-4 text-white">
            {ending.title}
          </h1>
          <p className="text-gray-300 mb-6 leading-relaxed">
            {ending.message}
          </p>

          <div className="flex gap-4 justify-center mb-6">
            <div className="glass-card px-4 py-2 rounded-xl">
              <span className="text-gray-400 text-sm">天数</span>
              <span className="text-pink-400 font-bold ml-2">{gameState.day}</span>
            </div>
            <div className="glass-card px-4 py-2 rounded-xl">
              <span className="text-gray-400 text-sm">约会次数</span>
              <span className="text-blue-400 font-bold ml-2">{gameState.dateHistory.length}</span>
            </div>
            <div className="glass-card px-4 py-2 rounded-xl">
              <span className="text-gray-400 text-sm">好感度</span>
              <span className="text-red-400 font-bold ml-2">
                {engine.getCurrentCharacter()?.initialAffection || 0}
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="px-8 py-3 text-lg font-bold rounded-xl text-white"
            style={{
              background: 'linear-gradient(135deg, #ff69b4, #ff1493)',
              boxShadow: '0 0 20px rgba(255, 105, 180, 0.5)'
            }}
          >
            重新开始
          </motion.button>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 105, 180, 0.3);
          }
        `}</style>
      </div>
    );
  }

  if (phase === 'date' && currentEvent) {
    const character = engine.getCurrentCharacter();
    if (!character) return null;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: 'linear-gradient(135deg, #2d1f3d 0%, #4a2c5a 50%, #1a1a2e 100%)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">{character.avatar}</div>
            <h2 className="text-2xl font-bold text-white">{character.name}</h2>
          </div>

          <div className="glass-card rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-pink-400 mb-3">{currentEvent.title}</h3>
            <p className="text-gray-300 mb-4">{currentEvent.description}</p>

            <div className="space-y-3">
              {currentEvent.choices.map((choice, index) => (
                <motion.button
                  key={choice.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDateChoice(choice.id)}
                  className="w-full text-left p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl text-white transition-colors"
                >
                  <span className="text-pink-400 font-bold">{index + 1}.</span> {choice.text}
                </motion.button>
              ))}
            </div>
          </div>

          {message && (
            <div className="text-center text-pink-300 text-sm p-3 bg-pink-900/30 rounded-xl">
              {message}
            </div>
          )}
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 105, 180, 0.3);
          }
        `}</style>
      </div>
    );
  }

  const character = engine.getCurrentCharacter();
  const affectionLevel = engine.getAffectionLevel();
  const gifts = gameState.giftInventory;

  return (
    <div className="min-h-screen flex flex-col"
         style={{ background: 'linear-gradient(135deg, #2d1f3d 0%, #4a2c5a 50%, #1a1a2e 100%)' }}>
      <div className="container mx-auto px-4 py-4 max-w-2xl flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-red-500 bg-clip-text text-transparent">
              恋爱养成
            </h1>
            <p className="text-xs text-gray-400">第 {gameState.day} / {gameState.maxDays} 天</p>
          </div>
          <div className="flex gap-3 text-sm">
            <span className="text-yellow-400">💰 {gameState.money}</span>
            <span className="text-green-400">⚡ {gameState.energy}</span>
          </div>
        </div>

        {character && (
          <div className="glass-card rounded-xl p-4 mb-4">
            <div className="flex items-center gap-4 mb-3">
              <div className="text-4xl">{character.avatar}</div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">{character.name}</h2>
                <span
                  className="text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: getTypeColor(character.type) + '33', color: getTypeColor(character.type) }}
                >
                  {getTypeName(character.type)}
                </span>
              </div>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">好感度</span>
                <span style={{ color: getHeartColor(affectionLevel.level) }}>
                  {character.initialAffection} / {character.maxAffection}
                </span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(character.initialAffection / character.maxAffection) * 100}%` }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: getHeartColor(affectionLevel.level) }}
                />
              </div>
            </div>

            <div className="text-center">
              <span
                className="text-sm font-bold"
                style={{ color: getHeartColor(affectionLevel.level) }}
              >
                💕 {affectionLevel.name}
              </span>
              <span className="text-gray-500 text-xs ml-2">({affectionLevel.description})</span>
            </div>
          </div>
        )}

        <div className="glass-card rounded-xl p-4 mb-4 flex-1">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-pink-400">🎁 礼物商店</h3>
            <button
              onClick={() => setPhase('shop')}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              购买礼物
            </button>
          </div>

          {gifts.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {gifts.map(gift => (
                <div key={gift.id} className="bg-gray-800/50 rounded-lg p-2 flex items-center gap-2">
                  <span className="text-2xl">
                    {gift.type === 'flower' ? '🌹' :
                     gift.type === 'chocolate' ? '🍫' :
                     gift.type === 'jewelry' ? '💎' :
                     gift.type === 'book' ? '📚' : '🧸'}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm text-white">{gift.name}</div>
                    <div className="text-xs text-gray-400">+{gift.effect}好感</div>
                  </div>
                  <button
                    onClick={() => handleGiveGift(gift)}
                    className="px-2 py-1 bg-pink-600/50 hover:bg-pink-600/70 rounded text-xs text-white"
                  >
                    赠送
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">背包空空~去商店买点礼物吧</p>
          )}
        </div>

        {message && (
          <div className="text-center text-pink-300 text-sm p-3 bg-pink-900/30 rounded-xl mb-4">
            {message}
          </div>
        )}

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartDate}
            disabled={gameState.energy < 20}
            className={`flex-1 p-4 rounded-xl font-bold ${
              gameState.energy >= 20
                ? 'bg-pink-600 hover:bg-pink-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            💕 约会 (-20体力, -30金币)
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEndDay}
            className="flex-1 p-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
          >
            🌙 结束今天 (+100金币)
          </motion.button>
        </div>

        <button
          onClick={handleStart}
          className="mt-4 text-gray-500 text-sm hover:text-gray-400"
        >
          重新开始
        </button>
      </div>

      <AnimatePresence>
        {phase === 'shop' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setPhase('shop')}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-card rounded-xl p-6 max-w-md w-full max-h-96 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-pink-400">🎁 礼物商店</h3>
                <button
                  onClick={() => setPhase('shop')}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'flower', name: '玫瑰花束', price: 50, effect: 10, emoji: '🌹', desc: '浪漫的玫瑰' },
                  { id: 'chocolate', name: '手工巧克力', price: 40, effect: 8, emoji: '🍫', desc: '甜蜜的心意' },
                  { id: 'jewelry', name: '银色项链', price: 150, effect: 25, emoji: '💎', desc: '珍贵的礼物' },
                  { id: 'book', name: '诗集', price: 60, effect: 12, emoji: '📚', desc: '文艺的选择' },
                  { id: 'toy', name: '可爱玩偶', price: 45, effect: 9, emoji: '🧸', desc: '萌萌的礼物' },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
                  >
                    <span className="text-3xl">{item.emoji}</span>
                    <div className="flex-1">
                      <div className="text-white font-medium">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.desc} (+{item.effect}好感)</div>
                    </div>
                    <button
                      onClick={() => handleBuyGift({
                        id: item.id,
                        name: item.name,
                        type: item.id as any,
                        price: item.price,
                        effect: item.effect,
                        description: item.desc
                      })}
                      disabled={gameState.money < item.price}
                      className={`px-3 py-1 rounded text-sm ${
                        gameState.money >= item.price
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      💰 {item.price}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 105, 180, 0.2);
        }
      `}</style>
    </div>
  );
}
