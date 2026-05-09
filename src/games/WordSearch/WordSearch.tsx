import { useState, useEffect, useCallback, useRef } from 'react';
import { WordSearchEngine, Position, Word } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type GamePhase = 'menu' | 'playing' | 'win' | 'lose';

const DIFFICULTIES = [
  { gridSize: 8, time: 90, label: '简单', subtitle: '8x8 · 90秒' },
  { gridSize: 10, time: 120, label: '中等', subtitle: '10x10 · 120秒' },
  { gridSize: 12, time: 150, label: '困难', subtitle: '12x12 · 150秒' },
  { gridSize: 15, time: 180, label: '专家', subtitle: '15x15 · 180秒' }
];

export default function WordSearch() {
  const canvasSize = 500;
  const [selectedDifficulty, setSelectedDifficulty] = useState(1);
  const [engine, setEngine] = useState(() => new WordSearchEngine(10, 120));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [grid, setGrid] = useState<string[][]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [foundWords, setFoundWords] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [score, setScore] = useState(0);
  const [selectedCells, setSelectedCells] = useState<Position[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [hintWord, setHintWord] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const diff = DIFFICULTIES[selectedDifficulty];
  const cellSize = canvasSize / diff.gridSize;

  const loadState = useCallback(() => {
    const state = engine.getState();
    setGrid(state.grid);
    setWords(state.words);
    setFoundWords(state.foundWords);
    setTotalWords(state.totalWords);
    setTimeRemaining(state.timeRemaining);
    setScore(state.score);
  }, [engine]);

  const startGame = (difficultyIndex: number) => {
    const diff = DIFFICULTIES[difficultyIndex];
    const newEngine = new WordSearchEngine(diff.gridSize, diff.time);
    setEngine(newEngine);
    
    // 先加载初始状态
    const state = newEngine.getState();
    setGrid(state.grid);
    setWords(state.words);
    setFoundWords(0);
    setTotalWords(state.totalWords);
    setTimeRemaining(diff.time);
    setScore(0);
    setSelectedCells([]);
    setPhase('playing');
    setShowHint(false);
    setHintWord(null);

    // 启动计时器
    newEngine.startTimer(() => {
      if (!newEngine.isGameComplete()) {
        setPhase('lose');
      }
    });
  };

  const handleWin = useCallback(() => {
    engine.stopTimer();
    // 额外时间奖励
    const timeBonus = timeRemaining * 2;
    setScore(prev => prev + timeBonus);
    setPhase('win');
  }, [engine, timeRemaining]);

  // 监听游戏完成状态
  useEffect(() => {
    if (phase === 'playing' && engine.isGameComplete()) {
      handleWin();
    }
  }, [foundWords, phase, engine, handleWin]);

  // 更新计时器
  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            engine.stopTimer();
            setPhase('lose');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [phase, engine]);

  const handleCellMouseDown = (row: number, col: number) => {
    if (phase !== 'playing') return;
    setIsSelecting(true);
    setSelectedCells([{ row, col }]);
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isSelecting || phase !== 'playing') return;
    
    const start = selectedCells[0];
    if (!start) return;

    const dRow = row - start.row;
    const dCol = col - start.col;
    
    // 检查是否是直线
    if (dRow !== 0 && dCol !== 0 && Math.abs(dRow) !== Math.abs(dCol)) {
      return;
    }

    const steps = Math.max(Math.abs(dRow), Math.abs(dCol));
    const stepRow = steps === 0 ? 0 : dRow / steps;
    const stepCol = steps === 0 ? 0 : dCol / steps;

    const newCells: Position[] = [];
    for (let i = 0; i <= steps; i++) {
      newCells.push({
        row: start.row + i * stepRow,
        col: start.col + i * stepCol
      });
    }

    setSelectedCells(newCells);
  };

  const handleMouseUp = () => {
    if (!isSelecting || phase !== 'playing') return;
    setIsSelecting(false);

    if (selectedCells.length >= 2) {
      const start = selectedCells[0];
      const end = selectedCells[selectedCells.length - 1];
      
      if (engine.selectCells(start, end)) {
        loadState();
        
        // 检查是否完成
        if (engine.isGameComplete()) {
          handleWin();
        }
      }
    }

    setSelectedCells([]);
  };

  const handleTouchStart = (row: number, col: number) => {
    handleCellMouseDown(row, col);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!gridRef.current || !isSelecting) return;
    
    const touch = e.touches[0];
    const rect = gridRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    
    if (row >= 0 && row < diff.gridSize && col >= 0 && col < diff.gridSize) {
      handleCellMouseEnter(row, col);
    }
  };

  const handleHint = () => {
    const hint = engine.getHint();
    if (hint) {
      setHintWord(hint);
      setShowHint(true);
      setTimeout(() => {
        setShowHint(false);
        setHintWord(null);
      }, 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCellSelected = (row: number, col: number) => {
    return selectedCells.some(c => c.row === row && c.col === col);
  };

  const isCellInWord = (row: number, col: number) => {
    return words.some(w => 
      w.found && w.positions.some(p => p.row === row && p.col === col)
    );
  };

  const getCellInFoundWord = (row: number, col: number): Word | null => {
    return words.find(w => 
      w.found && w.positions.some(p => p.row === row && p.col === col)
    ) || null;
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
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            文字搜索
          </h1>
          <p className="text-gray-400 mb-8">Word Search Puzzle</p>

          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 在字母网格中找到隐藏的词语</li>
              <li>2. 按住鼠标拖动选择字母</li>
              <li>3. 词语可以是水平、垂直或对角线方向</li>
              <li>4. 在时间耗尽前找出所有词语!</li>
            </ul>
            <p className="mt-4 text-yellow-400">找出所有词语即可通关!</p>
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-4">选择难度</h3>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {DIFFICULTIES.map((d, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDifficulty(index)}
                className={`px-5 py-3 rounded-xl font-bold transition-all ${
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
                <div className="text-lg">{d.label}</div>
                <div className="text-xs opacity-75">{d.subtitle}</div>
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
          <p className="text-2xl text-gray-300 mb-2">你找到了所有词语!</p>
          
          <div className="glass-card rounded-2xl p-6 max-w-sm mx-auto mb-8">
            <div className="flex justify-between mb-4">
              <div>
                <div className="text-sm text-gray-400">得分</div>
                <div className="text-3xl font-bold text-green-400">{score}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">剩余时间</div>
                <div className="text-3xl font-bold text-cyan-400">{formatTime(timeRemaining)}</div>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              找到 {foundWords}/{totalWords} 个词语
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
          <div className="text-8xl mb-6">⏰</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
            时间到!
          </h1>
          <p className="text-2xl text-gray-300 mb-2">时间耗尽了!</p>
          <p className="text-lg text-gray-400 mb-8">
            找到了 {foundWords}/{totalWords} 个词语
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
          文字搜索
        </h1>
      </motion.div>

      {/* HUD */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-4 mb-4"
      >
        <div className="glass-card px-4 py-3 rounded-xl">
          <div className="text-sm text-gray-400">时间</div>
          <div className={`text-xl font-bold ${timeRemaining <= 30 ? 'text-red-400' : 'text-cyan-400'}`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
        <div className="glass-card px-4 py-3 rounded-xl">
          <div className="text-sm text-gray-400">进度</div>
          <div className="text-xl font-bold text-green-400">{foundWords}/{totalWords}</div>
        </div>
        <div className="glass-card px-4 py-3 rounded-xl">
          <div className="text-sm text-gray-400">得分</div>
          <div className="text-xl font-bold text-yellow-400">{score}</div>
        </div>
        <button
          onClick={handleHint}
          className="glass-card px-4 py-3 rounded-xl hover:border-pink-500 transition-colors cursor-pointer"
          style={{ border: '1px solid rgba(255, 0, 255, 0.3)' }}
        >
          <div className="text-sm text-gray-400">提示</div>
          <div className="text-xl font-bold text-pink-400">💡</div>
        </button>
      </motion.div>

      <div className="flex gap-6">
        {/* Game Grid */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div
            ref={gridRef}
            className="relative rounded-2xl overflow-hidden select-none"
            style={{
              width: canvasSize,
              height: canvasSize,
              background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
              border: `3px solid ${NEON_COLORS.primary}40`,
              touchAction: 'none'
            }}
            onMouseDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              handleCellMouseDown(Math.floor(y / cellSize), Math.floor(x / cellSize));
            }}
            onMouseEnter={(e) => {
              if (isSelecting) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                handleCellMouseEnter(Math.floor(y / cellSize), Math.floor(x / cellSize));
              }
            }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              const rect = e.currentTarget.getBoundingClientRect();
              const x = touch.clientX - rect.left;
              const y = touch.clientY - rect.top;
              handleTouchStart(Math.floor(y / cellSize), Math.floor(x / cellSize));
            }}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {/* Grid Cells */}
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const selected = isCellSelected(rowIndex, colIndex);
                const inWord = isCellInWord(rowIndex, colIndex);
                const foundWord = getCellInFoundWord(rowIndex, colIndex);

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="absolute flex items-center justify-center font-bold"
                    style={{
                      left: colIndex * cellSize,
                      top: rowIndex * cellSize,
                      width: cellSize,
                      height: cellSize,
                      background: selected 
                        ? `${NEON_COLORS.primary}60`
                        : inWord 
                          ? `${NEON_COLORS.success}40`
                          : 'transparent',
                      border: selected 
                        ? `2px solid ${NEON_COLORS.primary}`
                        : inWord
                          ? `2px solid ${NEON_COLORS.success}`
                          : '1px solid rgba(255,255,255,0.1)',
                      color: inWord ? NEON_COLORS.success : NEON_COLORS.text,
                      fontSize: cellSize * 0.5,
                      textShadow: inWord ? `0 0 10px ${NEON_COLORS.success}` : 'none'
                    }}
                  >
                    {cell}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Word List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl p-4"
          style={{ width: 150 }}
        >
          <h3 className="text-sm font-bold text-gray-400 mb-3 text-center">词语列表</h3>
          <div className="space-y-2">
            {words.map((word, index) => (
              <div
                key={index}
                className={`text-center py-1 px-2 rounded-lg transition-all ${
                  word.found 
                    ? 'bg-green-500/30 text-green-400 line-through' 
                    : showHint && hintWord === word.word
                      ? 'bg-pink-500/30 text-pink-400'
                      : 'bg-gray-700/50 text-gray-300'
                }`}
              >
                {word.word}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-center text-gray-400 text-sm"
      >
        <p>拖动选择字母找出词语</p>
        <p className="text-cyan-400 mt-1">词语可以是横、竖、斜方向</p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex gap-4 mt-6"
      >
        <button
          onClick={() => startGame(selectedDifficulty)}
          className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-white font-bold hover:from-red-700 hover:to-orange-700 transition-all"
        >
          🔄 重新开始
        </button>
        <button
          onClick={() => {
            engine.stopTimer();
            setPhase('menu');
          }}
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
