import { useState, useCallback } from 'react';
import { StarMatchEngine, Star } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'complete';

const DIFFICULTIES = [
  { pairs: 4, label: '简单' },
  { pairs: 6, label: '中等' },
  { pairs: 8, label: '困难' },
];

export default function StarMatch() {
  const [engine, setEngine] = useState(() => new StarMatchEngine(6));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [stars, setStars] = useState<Star[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(1);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [totalPairs, setTotalPairs] = useState(6);

  const loadState = useCallback(() => {
    const state = engine.getState();
    setStars(state.stars);
    setMoves(state.moves);
    setMatchedPairs(state.matchedPairs);
    setTotalPairs(state.totalPairs);
  }, [engine]);

  const startGame = useCallback((difficultyIndex: number) => {
    const diff = DIFFICULTIES[difficultyIndex];
    const newEngine = new StarMatchEngine(diff.pairs);
    setEngine(newEngine);
    const state = newEngine.getState();
    setStars(state.stars);
    setMoves(0);
    setMatchedPairs(0);
    setTotalPairs(state.totalPairs);
    setPhase('playing');
  }, []);

  const handleStarClick = useCallback((starId: number) => {
    if (phase !== 'playing') return;

    const result = engine.flipStar(starId);
    if (result.success) {
      loadState();
      
      if (engine.isComplete()) {
        setTimeout(() => setPhase('complete'), 500);
      }
    }
  }, [phase, engine, loadState]);

  const getGridLayout = () => {
    const total = totalPairs * 2;
    const cols = Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / cols);
    return { rows, cols };
  };

  const { cols } = getGridLayout();
  const boardSize = 450;
  const cellSize = boardSize / cols;
  const cardSize = cellSize - 12;

  const getStarStyle = (star: Star) => {
    const index = stars.findIndex(s => s.id === star.id);
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    return {
      left: 6 + col * cellSize,
      top: 6 + row * cellSize,
      width: cardSize,
      height: cardSize
    };
  };

  if (phase === 'menu') {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            ⭐ 星星配对
          </h1>
          <p className="text-gray-400 mb-8">Star Match</p>

          <div className="glass-card rounded-2xl p-6 max-w-md mx-auto mb-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 点击卡片翻开星星</li>
              <li>2. 找出相同的星星类型</li>
              <li>3. 配对成功即可消除</li>
              <li>4. 找出所有配对即可通关!</li>
            </ul>
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-4">选择难度</h3>
          <div className="flex gap-3 mb-8">
            {DIFFICULTIES.map((diff, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDifficulty(index)}
                className={`px-6 py-4 rounded-xl font-bold transition-all ${
                  selectedDifficulty === index ? 'text-white' : 'text-gray-400 bg-gray-800'
                }`}
                style={{
                  background: selectedDifficulty === index 
                    ? `linear-gradient(135deg, ${NEON_COLORS.warning}, ${NEON_COLORS.primary})`
                    : undefined,
                  boxShadow: selectedDifficulty === index 
                    ? `0 0 20px ${NEON_COLORS.warning}50` 
                    : undefined,
                }}
              >
                <div className="text-xl">{diff.label}</div>
                <div className="text-xs opacity-75">{diff.pairs}对</div>
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => startGame(selectedDifficulty)}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{ 
              background: `linear-gradient(135deg, ${NEON_COLORS.warning}, ${NEON_COLORS.primary})`,
              boxShadow: `0 0 30px ${NEON_COLORS.warning}50`
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

  if (phase === 'complete') {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">🌟</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            恭喜通关!
          </h1>
          <p className="text-2xl text-gray-300 mb-2">你找到了所有星星!</p>
          
          <div className="glass-card rounded-2xl p-6 max-w-sm mx-auto mb-8">
            <div className="flex justify-between mb-4">
              <div>
                <div className="text-sm text-gray-400">配对数</div>
                <div className="text-3xl font-bold text-yellow-400">{matchedPairs}</div>
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
                background: `linear-gradient(135deg, ${NEON_COLORS.warning}, ${NEON_COLORS.primary})`,
                boxShadow: `0 0 20px ${NEON_COLORS.warning}50`
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

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-4"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
          ⭐ 星星配对
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-6 mb-4"
      >
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">步数</div>
          <div className="text-2xl font-bold text-cyan-400">{moves}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">已配对</div>
          <div className="text-2xl font-bold text-yellow-400">{matchedPairs}/{totalPairs}</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: boardSize,
            height: boardSize,
            background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
            border: `3px solid ${NEON_COLORS.warning}40`
          }}
        >
          <AnimatePresence>
            {stars.map((star, index) => {
              const style = getStarStyle(star);
              const isFlipped = star.isFlipped || star.isMatched;
              const emoji = engine.getStarEmoji(star.type, star.value);

              return (
                <motion.div
                  key={star.id}
                  layout
                  initial={{ scale: 0, rotateY: 180 }}
                  animate={{ scale: 1, rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="absolute rounded-xl cursor-pointer"
                  style={{
                    ...style,
                    perspective: 1000,
                    zIndex: isFlipped ? 5 : 1
                  }}
                  onClick={() => handleStarClick(star.id)}
                >
                  <div
                    className="absolute inset-0 rounded-xl flex items-center justify-center"
                    style={{
                      background: star.isMatched
                        ? `linear-gradient(135deg, ${NEON_COLORS.success}40, ${NEON_COLORS.success}20)`
                        : 'linear-gradient(135deg, #2d2d44, #3d3d54)',
                      border: star.isMatched
                        ? `2px solid ${NEON_COLORS.success}`
                        : '2px solid rgba(108, 92, 231, 0.3)',
                      boxShadow: star.isMatched
                        ? `0 0 15px ${NEON_COLORS.success}50`
                        : '0 4px 8px rgba(0, 0, 0, 0.3)',
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(0deg)'
                    }}
                  >
                    <span className="text-xl opacity-30">✨</span>
                  </div>
                  
                  <div
                    className="absolute inset-0 rounded-xl flex items-center justify-center"
                    style={{
                      background: star.isMatched
                        ? `linear-gradient(135deg, ${NEON_COLORS.warning}30, ${NEON_COLORS.warning}10)`
                        : `linear-gradient(135deg, ${NEON_COLORS.warning}20, ${NEON_COLORS.primary}20)`,
                      border: star.isMatched
                        ? `2px solid ${NEON_COLORS.success}`
                        : `2px solid ${NEON_COLORS.warning}50`,
                      boxShadow: star.isMatched
                        ? `0 0 15px ${NEON_COLORS.success}50`
                        : `0 0 10px ${NEON_COLORS.warning}30`,
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <span className="text-3xl">{emoji}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 text-center text-gray-400 text-sm"
      >
        <p>点击卡片翻开，找出相同的星星</p>
      </motion.div>

      <div className="flex gap-4 mt-6">
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
      </div>

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
