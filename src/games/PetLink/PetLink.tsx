import { useState, useCallback } from 'react';
import { PetLinkEngine, Pet } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'complete';

const DIFFICULTIES = [
  { grid: 4, label: '简单', pairs: 8 },
  { grid: 6, label: '中等', pairs: 18 },
  { grid: 8, label: '困难', pairs: 32 },
];

export default function PetLink() {
  const [engine, setEngine] = useState(() => new PetLinkEngine(6));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(1);
  const [score, setScore] = useState(0);
  const [matches, setMatches] = useState(0);
  const [totalPairs, setTotalPairs] = useState(18);
  const [gridSize, setGridSize] = useState(6);
  const [combo, setCombo] = useState(0);
  const [message, setMessage] = useState('');

  const loadState = useCallback(() => {
    const state = engine.getState();
    setPets(state.pets);
    setScore(state.score);
    setMatches(state.matches);
    setTotalPairs(state.totalPairs);
    setGridSize(state.gridSize);
    setCombo(state.combo);
  }, [engine]);

  const startGame = useCallback((difficultyIndex: number) => {
    const diff = DIFFICULTIES[difficultyIndex];
    const newEngine = new PetLinkEngine(diff.grid);
    setEngine(newEngine);
    const state = newEngine.getState();
    setPets(state.pets);
    setScore(0);
    setMatches(0);
    setTotalPairs(state.totalPairs);
    setGridSize(state.gridSize);
    setCombo(0);
    setMessage('');
    setPhase('playing');
  }, []);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (phase !== 'playing') return;

    const result = engine.selectPet(row, col);
    loadState();
    setMessage(result.message);

    if (result.matched && engine.isCompleteGame()) {
      setTimeout(() => setPhase('complete'), 500);
    }
  }, [phase, engine, loadState]);

  const cellSize = 60;
  const boardSize = gridSize * cellSize;

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
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            🐾 宠物连连看
          </h1>
          <p className="text-gray-400 mb-8">Pet Link</p>

          <div className="glass-card rounded-2xl p-6 max-w-md mx-auto mb-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 点击两个相同的宠物</li>
              <li>2. 配对成功即可消除</li>
              <li>3. 连续配对获得连击加分</li>
              <li>4. 消除所有宠物即可通关!</li>
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
                    ? `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`
                    : undefined,
                  boxShadow: selectedDifficulty === index 
                    ? `0 0 20px ${NEON_COLORS.primary}50` 
                    : undefined,
                }}
              >
                <div>{diff.label}</div>
                <div className="text-xs opacity-75">{diff.grid}x{gridSize}</div>
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
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            全部消除!
          </h1>
          <p className="text-2xl text-gray-300 mb-2">恭喜你完成了宠物连连看!</p>
          
          <div className="glass-card rounded-2xl p-6 max-w-sm mx-auto mb-8">
            <div className="flex justify-between mb-4">
              <div>
                <div className="text-sm text-gray-400">配对数</div>
                <div className="text-3xl font-bold text-green-400">{matches}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">总分</div>
                <div className="text-3xl font-bold text-yellow-400">{score}</div>
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          🐾 宠物连连看
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-4 mb-4"
      >
        <div className="glass-card px-4 py-2 rounded-xl">
          <div className="text-sm text-gray-400">分数</div>
          <div className="text-xl font-bold text-yellow-400">{score}</div>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl">
          <div className="text-sm text-gray-400">配对</div>
          <div className="text-xl font-bold text-green-400">{matches}/{totalPairs}</div>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl">
          <div className="text-sm text-gray-400">连击</div>
          <div className={`text-xl font-bold ${combo > 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {combo > 0 ? `${combo}x` : '-'}
          </div>
        </div>
      </motion.div>

      {message && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card px-4 py-2 rounded-xl mb-4"
        >
          <span className="text-cyan-400">{message}</span>
        </motion.div>
      )}

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
            border: `3px solid ${NEON_COLORS.primary}40`
          }}
        >
          <div className="grid gap-1 p-2" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
            {pets.map((pet) => {
              const isSelected = pet.isSelected;
              const isMatched = pet.isMatched;
              
              return (
                <motion.div
                  key={pet.id}
                  whileHover={{ scale: isMatched ? 1 : 1.05 }}
                  whileTap={{ scale: isMatched ? 1 : 0.95 }}
                  className={`w-14 h-14 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                    isMatched ? 'opacity-0' : ''
                  }`}
                  style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${NEON_COLORS.warning}40, ${NEON_COLORS.warning}20)`
                      : 'linear-gradient(135deg, rgba(108, 92, 231, 0.3), rgba(108, 92, 231, 0.1))',
                    border: isSelected
                      ? `2px solid ${NEON_COLORS.warning}`
                      : '1px solid rgba(108, 92, 231, 0.3)',
                    boxShadow: isSelected
                      ? `0 0 15px ${NEON_COLORS.warning}`
                      : '0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                  onClick={() => handleCellClick(pet.row, pet.col)}
                >
                  <span className="text-3xl">{pet.emoji}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
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
