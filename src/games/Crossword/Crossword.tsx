import { useState, useEffect, useCallback, useRef } from 'react';
import { CrosswordEngine, Cell, Word } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'win';

const DIFFICULTIES = [
  { index: 0, label: '入门', subtitle: '8x8 · 编程基础', color: '#22c55e' },
  { index: 1, label: '简单', subtitle: '10x10 · Web技术', color: '#3b82f6' },
  { index: 2, label: '中等', subtitle: '12x12 · 开发工具', color: '#a855f7' },
  { index: 3, label: '困难', subtitle: '15x15 · 计算机科学', color: '#f59e0b' }
];

export default function Crossword() {
  const [selectedDifficulty, setSelectedDifficulty] = useState(1);
  const [engine, setEngine] = useState(() => new CrosswordEngine(1));
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<'across' | 'down'>('across');
  const [currentClue, setCurrentClue] = useState<Word | null>(null);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showCluePanel, setShowCluePanel] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const gridSize = engine.getGridSize();
  const cellSize = Math.min(40, 500 / gridSize);

  const loadState = useCallback(() => {
    const state = engine.getState();
    setGrid(state.grid);
    setWords(state.words);
    setSelectedCell(state.selectedCell);
    setSelectedDirection(state.selectedDirection);
    setScore(state.score);
    setHintsUsed(state.hintsUsed);
    setCurrentClue(engine.getCurrentClue());
  }, [engine]);

  const startGame = (difficultyIndex: number) => {
    const newEngine = new CrosswordEngine(difficultyIndex);
    setEngine(newEngine);
    setSelectedDifficulty(difficultyIndex);
    
    const state = newEngine.getState();
    setGrid(state.grid);
    setWords(state.words);
    setSelectedCell(state.selectedCell);
    setSelectedDirection(state.selectedDirection);
    setScore(0);
    setHintsUsed(0);
    setTimeElapsed(0);
    setPhase('playing');
    
    newEngine.startTimer();
  };

  // Timer update
  useEffect(() => {
    if (phase === 'playing') {
      const interval = setInterval(() => {
        setTimeElapsed(engine.getTimeElapsed());
        if (engine.isGameComplete()) {
          setPhase('win');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase, engine]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'playing') return;

      if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        e.preventDefault();
        engine.inputLetter(e.key);
        loadState();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        engine.deleteLetter();
        loadState();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        engine.moveSelection('up');
        loadState();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        engine.moveSelection('down');
        loadState();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        engine.moveSelection('left');
        loadState();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        engine.moveSelection('right');
        loadState();
      } else if (e.key === ' ') {
        e.preventDefault();
        engine.toggleDirection();
        loadState();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [phase, engine, loadState]);

  const handleCellClick = (row: number, col: number) => {
    engine.selectCell(row, col);
    loadState();
  };

  const handleHint = () => {
    if (engine.useHint()) {
      loadState();
    }
  };

  const handleRevealWord = (wordId: number) => {
    if (engine.revealWord(wordId)) {
      loadState();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCellInSelectedWord = (row: number, col: number): boolean => {
    if (!currentClue) return false;
    
    for (let i = 0; i < currentClue.length; i++) {
      const r = currentClue.row + (currentClue.direction === 'down' ? i : 0);
      const c = currentClue.col + (currentClue.direction === 'across' ? i : 0);
      if (r === row && c === col) return true;
    }
    return false;
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
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Crossword
          </h1>
          <p className="text-gray-400 mb-8 text-xl">英文填字谜 · 编程知识挑战</p>

          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto mb-8">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 根据提示填入正确的英文单词</li>
              <li>2. 点击格子选中，使用键盘输入</li>
              <li>3. 按空格键切换横向/纵向</li>
              <li>4. 使用方向键移动选择</li>
              <li>5. 完成所有单词即可通关!</li>
            </ul>
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-4">选择难度</h3>
          <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
            {DIFFICULTIES.map((d) => (
              <motion.button
                key={d.index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDifficulty(d.index)}
                className={`px-5 py-4 rounded-xl font-bold transition-all ${
                  selectedDifficulty === d.index 
                    ? 'text-white ring-2 ring-white' 
                    : 'text-gray-400 bg-gray-800 hover:bg-gray-700'
                }`}
                style={{
                  background: selectedDifficulty === d.index 
                    ? `linear-gradient(135deg, ${d.color}, ${d.color}88)`
                    : undefined,
                  boxShadow: selectedDifficulty === d.index 
                    ? `0 0 20px ${d.color}50` 
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
          <p className="text-2xl text-gray-300 mb-6">你完成了所有填字!</p>
          
          <div className="glass-card rounded-2xl p-6 max-w-sm mx-auto mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400">得分</div>
                <div className="text-3xl font-bold text-green-400">{score}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">用时</div>
                <div className="text-3xl font-bold text-cyan-400">{formatTime(timeElapsed)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">提示使用</div>
                <div className="text-3xl font-bold text-yellow-400">{hintsUsed}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">单词数</div>
                <div className="text-3xl font-bold text-purple-400">{words.length}</div>
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

  // Game Screen
  return (
    <div className="min-h-screen p-4"
         style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}>
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center mb-4"
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Crossword
        </h1>
        <div className="flex gap-3">
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">时间</span>
            <span className="text-cyan-400 font-bold ml-2">{formatTime(timeElapsed)}</span>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl">
            <span className="text-gray-400 text-sm">得分</span>
            <span className="text-green-400 font-bold ml-2">{score}</span>
          </div>
          <button
            onClick={handleHint}
            className="glass-card px-4 py-2 rounded-xl hover:bg-pink-500/20 transition-colors"
          >
            <span className="text-pink-400">💡 提示</span>
          </button>
        </div>
      </motion.div>

      {/* Current Clue */}
      {currentClue && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <span className="bg-cyan-500 text-white px-2 py-1 rounded text-sm font-bold">
              {currentClue.id} {currentClue.direction === 'across' ? '→' : '↓'}
            </span>
            <span className="text-white text-lg">{currentClue.clue}</span>
            <span className="text-gray-400 text-sm">({currentClue.length} letters)</span>
          </div>
        </motion.div>
      )}

      <div className="flex gap-6">
        {/* Grid */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex-shrink-0"
        >
          <div
            ref={gridRef}
            className="relative rounded-xl overflow-hidden"
            style={{
              width: gridSize * cellSize,
              height: gridSize * cellSize,
              background: '#000',
              border: `3px solid ${NEON_COLORS.primary}40`
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                const inSelectedWord = isCellInSelectedWord(rowIndex, colIndex);
                const hasInput = cell.userInput !== '';
                const isCorrect = hasInput && cell.userInput === cell.letter;
                const isRevealed = cell.isRevealed;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="absolute flex items-center justify-center cursor-pointer transition-all"
                    style={{
                      left: colIndex * cellSize,
                      top: rowIndex * cellSize,
                      width: cellSize,
                      height: cellSize,
                      background: cell.isBlack 
                        ? '#000' 
                        : isSelected 
                          ? `${NEON_COLORS.primary}60`
                          : inSelectedWord
                            ? `${NEON_COLORS.primary}20`
                            : isRevealed
                              ? `${NEON_COLORS.success}30`
                              : '#1a1a2e',
                      border: isSelected 
                        ? `2px solid ${NEON_COLORS.primary}`
                        : inSelectedWord
                          ? `1px solid ${NEON_COLORS.primary}60`
                          : '1px solid #333',
                      fontSize: cellSize * 0.5,
                      fontWeight: 'bold'
                    }}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {/* Cell number */}
                    {cell.number && (
                      <span 
                        className="absolute top-0.5 left-0.5 text-[8px] text-gray-400"
                        style={{ fontSize: cellSize * 0.2 }}
                      >
                        {cell.number}
                      </span>
                    )}
                    {/* Cell content */}
                    {hasInput && (
                      <span className={isRevealed ? 'text-green-400' : isCorrect ? 'text-white' : 'text-red-400'}>
                        {cell.userInput}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Controls hint */}
          <div className="mt-4 text-center text-gray-400 text-sm">
            <p>键盘输入字母 · 方向键移动 · 空格切换方向 · Backspace删除</p>
          </div>
        </motion.div>

        {/* Clue List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 glass-card rounded-xl p-4 overflow-y-auto"
          style={{ maxHeight: gridSize * cellSize + 50 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-cyan-400">提示列表</h3>
            <button
              onClick={() => setShowCluePanel(!showCluePanel)}
              className="text-gray-400 hover:text-white"
            >
              {showCluePanel ? '收起' : '展开'}
            </button>
          </div>

          {showCluePanel && (
            <>
              {/* Across */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-400 mb-2">横向 (Across)</h4>
                <div className="space-y-1">
                  {words.filter(w => w.direction === 'across').map(word => (
                    <div
                      key={word.id}
                      className={`p-2 rounded-lg cursor-pointer transition-all ${
                        currentClue?.id === word.id 
                          ? 'bg-cyan-500/30 border border-cyan-500' 
                          : word.isCompleted
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-800/50 hover:bg-gray-700/50'
                      }`}
                      onClick={() => {
                        engine.selectCell(word.row, word.col);
                        loadState();
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2">
                          <span className="font-bold text-cyan-400">{word.id}.</span>
                          <span className={word.isCompleted ? 'line-through opacity-50' : ''}>
                            {word.clue}
                          </span>
                        </div>
                        {!word.isCompleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevealWord(word.id);
                            }}
                            className="text-xs text-pink-400 hover:text-pink-300"
                          >
                            提示
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {word.length} letters
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Down */}
              <div>
                <h4 className="text-sm font-bold text-gray-400 mb-2">纵向 (Down)</h4>
                <div className="space-y-1">
                  {words.filter(w => w.direction === 'down').map(word => (
                    <div
                      key={word.id}
                      className={`p-2 rounded-lg cursor-pointer transition-all ${
                        currentClue?.id === word.id 
                          ? 'bg-cyan-500/30 border border-cyan-500' 
                          : word.isCompleted
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-800/50 hover:bg-gray-700/50'
                      }`}
                      onClick={() => {
                        engine.selectCell(word.row, word.col);
                        loadState();
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2">
                          <span className="font-bold text-cyan-400">{word.id}.</span>
                          <span className={word.isCompleted ? 'line-through opacity-50' : ''}>
                            {word.clue}
                          </span>
                        </div>
                        {!word.isCompleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevealWord(word.id);
                            }}
                            className="text-xs text-pink-400 hover:text-pink-300"
                          >
                            提示
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {word.length} letters
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Bottom Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-4 mt-6 justify-center"
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
