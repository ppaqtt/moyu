import { useState, useCallback, useEffect } from 'react';
import { SokobanPlusEngine, Position, Box } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'complete';

export default function SokobanPlus() {
  const [engine] = useState(() => new SokobanPlusEngine());
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [walls, setWalls] = useState<Set<string>>(new Set());
  const [targets, setTargets] = useState<Position[]>([]);
  const [gridSize, setGridSize] = useState({ width: 8, height: 8 });
  const [level, setLevel] = useState(1);
  const [totalLevels, setTotalLevels] = useState(5);
  const [moves, setMoves] = useState(0);
  const [pushes, setPushes] = useState(0);
  const [levelName, setLevelName] = useState('');
  const [message, setMessage] = useState('');

  const cellSize = 50;

  const loadState = useCallback(() => {
    const state = engine.getState();
    setPlayerPos(state.playerPos);
    setBoxes(state.boxes);
    setWalls(engine.getWalls());
    setTargets(engine.getTargets());
    setGridSize({ width: state.gridWidth, height: state.gridHeight });
    setLevel(state.level);
    setMoves(state.moves);
    setPushes(state.pushes);
    setLevelName(engine.getLevelName());
    setTotalLevels(engine.getTotalLevels());
  }, [engine]);

  useEffect(() => {
    if (phase === 'playing') {
      loadState();
    }
  }, [phase, loadState]);

  useEffect(() => {
    if (engine.isLevelComplete() && phase === 'playing') {
      setTimeout(() => setPhase('complete'), 1000);
    }
  }, [engine.isLevelComplete(), phase]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (phase !== 'playing') return;

    let direction: 'up' | 'down' | 'left' | 'right' | null = null;
    
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        direction = 'up';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        direction = 'down';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        direction = 'left';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        direction = 'right';
        break;
    }

    if (direction) {
      e.preventDefault();
      const result = engine.move(direction);
      setMessage(result.message);
      loadState();
    }
  }, [phase, engine, loadState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  const startGame = useCallback(() => {
    engine.resetLevel();
    loadState();
    setMessage('');
    setPhase('playing');
  }, [engine, loadState]);

  const nextLevel = useCallback(() => {
    engine.nextLevel();
    loadState();
    setMessage('');
    setPhase('playing');
  }, [engine, loadState]);

  const renderCell = (x: number, y: number) => {
    const isWall = walls.has(`${x},${y}`);
    const isTarget = targets.some(t => t.x === x && y === y);
    const box = boxes.find(b => b.x === x && b.y === y);
    const isPlayer = playerPos.x === x && playerPos.y === y;

    return (
      <div
        key={`${x}-${y}`}
        className="absolute"
        style={{
          left: x * cellSize,
          top: y * cellSize,
          width: cellSize,
          height: cellSize,
          background: isWall 
            ? 'linear-gradient(135deg, #4a4a6a, #3a3a5a)'
            : 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
          border: isWall ? '1px solid #5a5a7a' : 'none',
        }}
      >
        {isTarget && !box && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-dashed" 
                 style={{ borderColor: NEON_COLORS.success, opacity: 0.6 }} />
          </div>
        )}
        {box && (
          <motion.div
            animate={box.isOnTarget ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: box.isOnTarget ? Infinity : 0, duration: 1 }}
            className="absolute inset-1 flex items-center justify-center rounded-lg"
            style={{
              background: box.isOnTarget
                ? `linear-gradient(135deg, ${NEON_COLORS.success}, ${NEON_COLORS.success}80)`
                : `linear-gradient(135deg, #CD853F, #8B4513)`,
              boxShadow: box.isOnTarget ? `0 0 15px ${NEON_COLORS.success}` : '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            <span className="text-2xl">{box.isOnTarget ? '✓' : '📦'}</span>
          </motion.div>
        )}
        {isPlayer && (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-3xl">🧑‍🔧</span>
          </motion.div>
        )}
      </div>
    );
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
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            📦 推箱子进阶
          </h1>
          <p className="text-gray-400 mb-8">Sokoban Plus</p>

          <div className="glass-card rounded-2xl p-6 max-w-md mx-auto mb-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 用方向键/WASD移动角色</li>
              <li>2. 推动箱子到目标位置</li>
              <li>3. 所有箱子到位即可通关</li>
              <li>4. 注意不要把箱子推到死角!</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="glass-card px-4 py-3 rounded-xl">
              <div className="text-2xl mb-1">🧑‍🔧</div>
              <div className="text-xs text-gray-400">推动者</div>
            </div>
            <div className="glass-card px-4 py-3 rounded-xl">
              <div className="text-2xl mb-1">📦</div>
              <div className="text-xs text-gray-400">箱子</div>
            </div>
            <div className="glass-card px-4 py-3 rounded-xl">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-xs text-gray-400">目标</div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
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
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            {level >= totalLevels ? '全部通关!' : `第 ${level} 关完成!`}
          </h1>
          <p className="text-2xl text-gray-300 mb-2">箱子全部到位!</p>
          
          <div className="glass-card rounded-2xl p-6 max-w-sm mx-auto mb-8">
            <div className="flex justify-between mb-4">
              <div>
                <div className="text-sm text-gray-400">移动</div>
                <div className="text-3xl font-bold text-cyan-400">{moves}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">推动</div>
                <div className="text-3xl font-bold text-orange-400">{pushes}</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            {level < totalLevels ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextLevel}
                className="px-8 py-3 text-lg font-bold rounded-xl text-white"
                style={{ 
                  background: `linear-gradient(135deg, ${NEON_COLORS.success}, #00aa00)`,
                  boxShadow: `0 0 20px ${NEON_COLORS.success}50`
                }}
              >
                下一关
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  engine.loadLevel(1);
                  loadState();
                  setPhase('playing');
                }}
                className="px-8 py-3 text-lg font-bold rounded-xl text-white"
                style={{ 
                  background: `linear-gradient(135deg, ${NEON_COLORS.success}, #00aa00)`,
                  boxShadow: `0 0 20px ${NEON_COLORS.success}50`
                }}
              >
                再玩一次
              </motion.button>
            )}
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
          📦 推箱子进阶 - {levelName}
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-4 mb-4"
      >
        <div className="glass-card px-4 py-2 rounded-xl">
          <div className="text-sm text-gray-400">关卡</div>
          <div className="text-xl font-bold text-purple-400">{level}/{totalLevels}</div>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl">
          <div className="text-sm text-gray-400">移动</div>
          <div className="text-xl font-bold text-cyan-400">{moves}</div>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl">
          <div className="text-sm text-gray-400">推动</div>
          <div className="text-xl font-bold text-orange-400">{pushes}</div>
        </div>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
            width: gridSize.width * cellSize,
            height: gridSize.height * cellSize,
            border: `3px solid ${NEON_COLORS.warning}40`
          }}
        >
          {Array.from({ length: gridSize.height }).map((_, y) =>
            Array.from({ length: gridSize.width }).map((_, x) => renderCell(x, y))
          )}
        </div>
      </motion.div>

      <div className="mt-4 text-gray-400 text-sm">
        <p>使用 方向键 或 WASD 移动 | R键 重置</p>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => {
            engine.resetLevel();
            loadState();
            setMessage('');
          }}
          className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-white font-bold"
        >
          🔄 重置关卡
        </button>
        <button
          onClick={() => setPhase('menu')}
          className="px-6 py-2 bg-gray-700 rounded-xl text-white font-medium"
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
