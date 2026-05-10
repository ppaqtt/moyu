import { useState, useCallback, useEffect } from 'react';
import { KeyUnlockEngine, Key, Door, Position } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'complete';

export default function KeyUnlock() {
  const [engine] = useState(() => new KeyUnlockEngine());
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const [keys, setKeys] = useState<Key[]>([]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [collectedKeys, setCollectedKeys] = useState({ bronze: 0, silver: 0, gold: 0 });
  const [gridSize, setGridSize] = useState({ width: 8, height: 8 });
  const [level, setLevel] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState('');

  const cellSize = 50;

  const loadState = useCallback(() => {
    const state = engine.getState();
    setPlayerPos(state.playerPos);
    setKeys(state.keys);
    setDoors(state.doors);
    setCollectedKeys(state.collectedKeys);
    setGridSize(engine.getGridSize());
    setLevel(state.level);
    setIsComplete(state.isComplete);
    setMoves(state.moves);
  }, [engine]);

  useEffect(() => {
    if (phase === 'playing') {
      loadState();
    }
  }, [phase, loadState]);

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

      if (engine.isLevelComplete()) {
        setTimeout(() => setPhase('complete'), 1000);
      }
    }
  }, [phase, engine, loadState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    const isWall = (x === 0 || x === gridSize.width - 1 || y === 0 || y === gridSize.height - 1);
    
    if (isWall) {
      return (
        <div
          key={`${x}-${y}`}
          className="absolute rounded"
          style={{
            left: x * cellSize,
            top: y * cellSize,
            width: cellSize,
            height: cellSize,
            background: 'linear-gradient(135deg, #4a4a6a, #3a3a5a)',
            border: '1px solid #5a5a7a'
          }}
        />
      );
    }

    const key = keys.find(k => k.x === x && k.y === y && !k.collected);
    const door = doors.find(d => d.x === x && d.y === y);
    const isPlayer = playerPos.x === x && playerPos.y === y;

    return (
      <div
        key={`${x}-${y}`}
        className="absolute rounded"
        style={{
          left: x * cellSize,
          top: y * cellSize,
          width: cellSize,
          height: cellSize,
          background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)'
        }}
      >
        {key && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">
              {key.type === 'bronze' ? '🗝️' : key.type === 'silver' ? '🔑' : '🔐'}
            </span>
          </div>
        )}
        {door && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">
              {door.unlocked ? '🚪' : door.type === 'bronze' ? '🟤' : door.type === 'silver' ? '⬜' : '🟡'}
            </span>
          </div>
        )}
        {isPlayer && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-3xl">🧙</span>
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
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
            🔑 钥匙解锁
          </h1>
          <p className="text-gray-400 mb-8">Key Unlock</p>

          <div className="glass-card rounded-2xl p-6 max-w-md mx-auto mb-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 用方向键/WASD移动角色</li>
              <li>2. 收集对应颜色的钥匙</li>
              <li>3. 用钥匙打开对应颜色的门</li>
              <li>4. 到达金色出口即可通关!</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl mb-2">🗝️</div>
              <div className="text-sm text-gray-400">铜钥匙</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔑</div>
              <div className="text-sm text-gray-400">银钥匙</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔐</div>
              <div className="text-sm text-gray-400">金钥匙</div>
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
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
            第 {level} 关完成!
          </h1>
          <p className="text-2xl text-gray-300 mb-2">你成功逃脱了!</p>
          
          <div className="glass-card rounded-2xl p-6 max-w-sm mx-auto mb-8">
            <div className="flex justify-between mb-4">
              <div>
                <div className="text-sm text-gray-400">移动次数</div>
                <div className="text-3xl font-bold text-cyan-400">{moves}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">关卡</div>
                <div className="text-3xl font-bold text-yellow-400">{level}</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextLevel}
              className="px-8 py-3 text-lg font-bold rounded-xl text-white"
              style={{ 
                background: `linear-gradient(135deg, ${NEON_COLORS.warning}, ${NEON_COLORS.primary})`,
                boxShadow: `0 0 20px ${NEON_COLORS.warning}50`
              }}
            >
              下一关
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
          🔑 钥匙解锁 - 第 {level} 关
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-4 mb-4"
      >
        <div className="glass-card px-4 py-2 rounded-xl">
          <div className="text-sm text-gray-400">关卡</div>
          <div className="text-xl font-bold text-yellow-400">{level}</div>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl">
          <div className="text-sm text-gray-400">移动</div>
          <div className="text-xl font-bold text-cyan-400">{moves}</div>
        </div>
        <div className="flex gap-2">
          <div className="glass-card px-3 py-2 rounded-xl text-center">
            <div className="text-sm text-gray-400">🗝️</div>
            <div className="text-lg font-bold text-amber-600">{collectedKeys.bronze}</div>
          </div>
          <div className="glass-card px-3 py-2 rounded-xl text-center">
            <div className="text-sm text-gray-400">🔑</div>
            <div className="text-lg font-bold text-gray-300">{collectedKeys.silver}</div>
          </div>
          <div className="glass-card px-3 py-2 rounded-xl text-center">
            <div className="text-sm text-gray-400">🔐</div>
            <div className="text-lg font-bold text-yellow-400">{collectedKeys.gold}</div>
          </div>
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
        <p>使用 方向键 或 WASD 移动</p>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={startGame}
          className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-white font-bold hover:from-red-700 hover:to-orange-700 transition-all"
        >
          🔄 重置关卡
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
