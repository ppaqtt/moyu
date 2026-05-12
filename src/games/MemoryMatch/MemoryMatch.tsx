import { useState, useEffect, useCallback } from 'react';
import { MemoryMatchEngine, Card } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type GamePhase = 'menu' | 'playing' | 'win' | 'lose';

const DIFFICULTIES = [
  { pairs: 6, moves: 20, label: '简单', cols: 4 },
  { pairs: 8, moves: 25, label: '中等', cols: 4 },
  { pairs: 10, moves: 30, label: '困难', cols: 5 },
  { pairs: 12, moves: 35, label: '专家', cols: 6 },
  { pairs: 15, moves: 45, label: '大师', cols: 6 }
];

export default function MemoryMatch() {
  const canvasSize = 480;
  const [selectedDifficulty, setSelectedDifficulty] = useState(1);
  const [engine, setEngine] = useState(() => new MemoryMatchEngine(
    DIFFICULTIES[1].pairs,
    DIFFICULTIES[1].moves
  ));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [cards, setCards] = useState<Card[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [totalPairs, setTotalPairs] = useState(8);
  const [remainingMoves, setRemainingMoves] = useState(25);
  const [hintCard, setHintCard] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);

  const loadState = useCallback(() => {
    const state = engine.getState();
    setCards(state.cards);
    setMoves(state.moves);
    setMatchedPairs(state.matchedPairs);
    setTotalPairs(state.totalPairs);
    setRemainingMoves(state.maxMoves - state.moves);
  }, [engine]);

  const startGame = (difficultyIndex: number) => {
    const diff = DIFFICULTIES[difficultyIndex];
    const newEngine = new MemoryMatchEngine(diff.pairs, diff.moves);
    setEngine(newEngine);
    const state = newEngine.getState();
    setCards(state.cards);
    setMoves(0);
    setMatchedPairs(0);
    setTotalPairs(state.totalPairs);
    setRemainingMoves(diff.moves);
    setPhase('playing');
    setShowHint(false);
    setHintCard(null);
  };

  const handleCardClick = (cardId: number) => {
    if (phase !== 'playing') return;

    const result = engine.flipCard(cardId);
    if (result.success) {
      loadState();
      
      if (engine.isGameComplete()) {
        setPhase('win');
      } else if (engine.isGameOver()) {
        setPhase('lose');
      }
    }
  };

  const handleHint = () => {
    const hint = engine.getHint();
    if (hint !== null) {
      setHintCard(hint);
      setShowHint(true);
      setTimeout(() => {
        setShowHint(false);
        setHintCard(null);
      }, 1500);
    }
  };

  const getGridLayout = () => {
    const totalCards = totalPairs * 2;
    const diff = DIFFICULTIES[selectedDifficulty];
    const cols = diff.cols;
    const rows = Math.ceil(totalCards / cols);
    return { rows, cols };
  };

  const { rows, cols } = getGridLayout();
  const cardWidth = (canvasSize - (cols + 1) * 8) / cols;
  const cardHeight = (canvasSize - (rows + 1) * 8) / rows;

  const getCardStyle = (card: Card, index: number) => {
    const diff = DIFFICULTIES[selectedDifficulty];
    const cols = diff.cols;
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    const isHinted = hintCard === card.id;
    
    return {
      left: 8 + col * (cardWidth + 8),
      top: 8 + row * (cardHeight + 8),
      width: cardWidth,
      height: cardHeight
    };
  };

  // Menu Screen
  if (phase === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            记忆翻牌
          </h1>
          <p className="text-gray-400 mb-8">Memory Match Game</p>

          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 点击卡片将其翻开</li>
              <li>2. 找出相同的图案进行配对</li>
              <li>3. 在限定步数内完成所有配对</li>
              <li>4. 配对成功即可消除!</li>
            </ul>
            <p className="mt-4 text-yellow-400">找出所有配对即可通关!</p>
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-4">选择难度</h3>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {DIFFICULTIES.map((diff, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDifficulty(index)}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${
                  selectedDifficulty === index 
                    ? 'text-white' 
                    : 'text-gray-400 bg-gray-800 hover:bg-gray-700'
                }`}
                style={{
                  background: selectedDifficulty === index 
                    ? `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`
                    : undefined,
                  boxShadow: selectedDifficulty === index 
                    ? `0 0 20px ${NEON_COLORS.primary}50` 
                    : undefined
                }}
              >
                <div className="text-lg">{diff.label}</div>
                <div className="text-xs opacity-75">{diff.pairs}对 · {diff.moves}步</div>
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => startGame(selectedDifficulty)}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{ 
              background: `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
              boxShadow: `0 0 30px ${NEON_COLORS.primary}50`
            }}
          >
            开始游戏
          </motion.button>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(108, 92, 231, 0.3);
          }
        `}</style>
      </div>
    );
  }

  // Win Screen
  if (phase === 'win') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            恭喜通关!
          </h1>
          <p className="text-2xl text-gray-300 mb-2">你完成了所有配对!</p>
          
          <div className="glass-card rounded-2xl p-6 max-w-sm mx-auto mb-8">
            <div className="flex justify-between mb-4">
              <div>
                <div className="text-sm text-gray-400">配对数</div>
                <div className="text-3xl font-bold text-green-400">{matchedPairs}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">用时步数</div>
                <div className="text-3xl font-bold text-cyan-400">{moves}</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startGame(selectedDifficulty)}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white"
              style={{ 
                background: `linear-gradient(135deg, ${NEON_COLORS.success}, #00aa00)`,
                boxShadow: `0 0 20px ${NEON_COLORS.success}50`
              }}
            >
              再玩一次
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPhase('menu')}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white"
              style={{ 
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}, #2a2a4e)`,
                border: `2px solid ${NEON_COLORS.primary}`
              }}
            >
              返回菜单
            </motion.button>
          </div>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(108, 92, 231, 0.3);
          }
        `}</style>
      </div>
    );
  }

  // Lose Screen
  if (phase === 'lose') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
           style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">😢</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
            游戏结束
          </h1>
          <p className="text-2xl text-gray-300 mb-2">步数用完了!</p>
          <p className="text-lg text-gray-400 mb-8">
            完成了 {matchedPairs}/{totalPairs} 对配对
          </p>
          
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startGame(selectedDifficulty)}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white"
              style={{ 
                background: `linear-gradient(135deg, ${NEON_COLORS.warning}, #cc6600)`,
                boxShadow: `0 0 20px ${NEON_COLORS.warning}50`
              }}
            >
              再试一次
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPhase('menu')}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white"
              style={{ 
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}, #2a2a4e)`,
                border: `2px solid ${NEON_COLORS.primary}`
              }}
            >
              返回菜单
            </motion.button>
          </div>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(108, 92, 231, 0.3);
          }
        `}</style>
      </div>
    );
  }

  // Game Screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}>
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-4"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          记忆翻牌
        </h1>
      </motion.div>

      {/* HUD */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-6 mb-4"
      >
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">剩余步数</div>
          <div className={`text-2xl font-bold ${remainingMoves <= 5 ? 'text-red-400' : 'text-cyan-400'}`}>
            {remainingMoves}
          </div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">已配对</div>
          <div className="text-2xl font-bold text-green-400">{matchedPairs}/{totalPairs}</div>
        </div>
        <button
          onClick={handleHint}
          className="glass-card px-6 py-3 rounded-xl hover:border-pink-500 transition-colors cursor-pointer"
          style={{ border: '1px solid rgba(255, 0, 255, 0.3)' }}
        >
          <div className="text-sm text-gray-400">提示</div>
          <div className="text-2xl font-bold text-pink-400">💡</div>
        </button>
      </motion.div>

      {/* Game Board */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: canvasSize,
            height: canvasSize,
            background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
            border: `3px solid ${NEON_COLORS.primary}40`
          }}
        >
          {/* Cards */}
          <AnimatePresence>
            {cards.map((card, index) => {
              const style = getCardStyle(card, index);
              const isFlipped = card.isFlipped || card.isMatched;
              const isHinted = hintCard === card.id;

              return (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ scale: 0, rotateY: 180 }}
                  animate={{ scale: 1, rotateY: isFlipped ? 180 : 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="absolute rounded-xl cursor-pointer"
                  style={{
                    ...style,
                    perspective: 1000,
                    zIndex: isFlipped ? 5 : 1
                  }}
                  onClick={() => handleCardClick(card.id)}
                >
                  {/* Card Back */}
                  <div
                    className="absolute inset-0 rounded-xl flex items-center justify-center"
                    style={{
                      background: isHinted
                        ? `linear-gradient(135deg, ${NEON_COLORS.secondary}, ${NEON_COLORS.primary})`
                        : 'linear-gradient(135deg, #4a4a6a, #3a3a5a)',
                      border: isHinted
                        ? `3px solid ${NEON_COLORS.secondary}`
                        : '2px solid rgba(108, 92, 231, 0.5)',
                      boxShadow: isHinted
                        ? `0 0 20px ${NEON_COLORS.secondary}`
                        : '0 4px 8px rgba(0, 0, 0, 0.3)',
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(0deg)'
                    }}
                  >
                    <span className="text-2xl opacity-50">?</span>
                  </div>
                  
                  {/* Card Front */}
                  <div
                    className="absolute inset-0 rounded-xl flex items-center justify-center"
                    style={{
                      background: card.isMatched
                        ? `linear-gradient(135deg, ${NEON_COLORS.success}40, ${NEON_COLORS.success}20)`
                        : 'linear-gradient(135deg, #2d2d44, #3d3d54)',
                      border: card.isMatched
                        ? `2px solid ${NEON_COLORS.success}`
                        : '2px solid rgba(108, 92, 231, 0.3)',
                      boxShadow: card.isMatched
                        ? `0 0 15px ${NEON_COLORS.success}50`
                        : '0 4px 8px rgba(0, 0, 0, 0.3)',
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <span className="text-4xl">{card.symbol}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 text-center text-gray-400 text-sm"
      >
        <p>点击卡片翻开，找出相同的图案配对</p>
        <p className="text-cyan-400 mt-1">剩余 {remainingMoves} 步</p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-4 mt-6"
      >
        <button
          onClick={() => startGame(selectedDifficulty)}
          className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-white font-bold hover:from-red-700 hover:to-orange-700 transition-all"
        >
          🔄 重新开始
        </button>
        <button
          onClick={() => setPhase('menu')}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors"
        >
          🏠 返回菜单
        </button>
      </motion.div>

      <style>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 92, 231, 0.3);
        }
      `}</style>
    </div>
  );
}
