import { useState, useCallback, useEffect } from 'react';
import { RoomEscapeEngine, Position, Item, Puzzle } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion } from 'framer-motion';

type GamePhase = 'menu' | 'playing' | 'escape';

export default function RoomEscape() {
  const [engine] = useState(() => new RoomEscapeEngine());
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const [inventory, setInventory] = useState<Item[]>([]);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [room, setRoom] = useState(1);
  const [moves, setMoves] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [message, setMessage] = useState('');

  const cellSize = 50;
  const gridSize = 7;

  const loadState = useCallback(() => {
    const state = engine.getState();
    setPlayerPos(state.playerPos);
    setInventory(state.inventory);
    setPuzzles(state.puzzles);
    setItems(state.items);
    setRoom(state.room);
    setMoves(state.moves);
    setMessages(state.messages);
  }, [engine]);

  useEffect(() => {
    if (phase === 'playing') {
      loadState();
    }
  }, [phase, loadState]);

  useEffect(() => {
    if (engine.isEscapedGame() && phase === 'playing') {
      setTimeout(() => setPhase('escape'), 1000);
    }
  }, [engine.isEscapedGame(), phase]);

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
      case ' ':
      case 'e':
      case 'E':
        const result = engine.interact();
        setMessage(result.message);
        loadState();
        return;
    }

    if (direction) {
      e.preventDefault();
      const result = engine.move(direction);
      setMessage(result.message);
      loadState();
    }
  }, [phase, engine, loadState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleUseItem = useCallback((itemId: string) => {
    const result = engine.useItem(itemId);
    setMessage(result.message);
    loadState();
  }, [engine, loadState]);

  const handleSolveCode = useCallback(() => {
    const result = engine.solveCode(codeInput);
    setMessage(result.message);
    setCodeInput('');
    setShowCodeInput(false);
    loadState();
  }, [engine, codeInput, loadState]);

  const handlePullLever = useCallback(() => {
    const result = engine.pullLever();
    setMessage(result.message);
    loadState();
  }, [engine, loadState]);

  const startGame = useCallback(() => {
    engine.reset();
    loadState();
    setMessage('');
    setPhase('playing');
  }, [engine, loadState]);

  const renderCell = (x: number, y: number) => {
    const layout = engine.getLayout();
    const isWall = layout.walls.some(w => w.x === x && w.y === y);
    const door = layout.doors.find(d => d.x === x && d.y === y);
    const item = items.find(i => i.x === x && i.y === y && !i.collected);
    const isPlayer = playerPos.x === x && playerPos.y === y;
    const puzzle = puzzles.find(p => !p.solved);

    return (
      <div
        key={`${x}-${y}`}
        className="absolute rounded"
        style={{
          left: x * cellSize,
          top: y * cellSize,
          width: cellSize,
          height: cellSize,
          background: isWall 
            ? 'linear-gradient(135deg, #4a4a6a, #3a3a5a)'
            : door
              ? puzzle
                ? 'linear-gradient(135deg, #8B4513, #654321)'
                : 'linear-gradient(135deg, #228B22, #006400)'
              : 'linear-gradient(135deg, #1a1a2e, #2d2d44)',
          border: isWall ? '1px solid #5a5a7a' : door ? '2px solid #654321' : 'none',
        }}
      >
        {door && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl">
              {puzzle ? '🔒' : '🚪'}
            </span>
          </div>
        )}
        {item && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl">
              {item.type === 'key' ? '🗝️' : item.type === 'code' ? '🔢' : item.type === 'lever' ? '🎚️' : '📜'}
            </span>
          </div>
        )}
        {isPlayer && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-2xl">🧑</span>
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
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-400 via-gray-500 to-purple-500 bg-clip-text text-transparent">
            🚪 密室逃脱
          </h1>
          <p className="text-gray-400 mb-8">Room Escape</p>

          <div className="glass-card rounded-2xl p-6 max-w-md mx-auto mb-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 用方向键/WASD移动</li>
              <li>2. 收集钥匙和线索</li>
              <li>3. 解开谜题打开门</li>
              <li>4. 逃出密室!</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="glass-card px-4 py-3 rounded-xl">
              <div className="text-2xl mb-1">🚪</div>
              <div className="text-xs text-gray-400">3个房间</div>
            </div>
            <div className="glass-card px-4 py-3 rounded-xl">
              <div className="text-2xl mb-1">🗝️</div>
              <div className="text-xs text-gray-400">收集物品</div>
            </div>
            <div className="glass-card px-4 py-3 rounded-xl">
              <div className="text-2xl mb-1">🔢</div>
              <div className="text-xs text-gray-400">解谜题</div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{ 
              background: `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
              boxShadow: `0 0 30px ${NEON_COLORS.primary}50`
            }}
          >
            开始逃脱
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

  if (phase === 'escape') {
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
            逃脱成功!
          </h1>
          <p className="text-2xl text-gray-300 mb-2">你成功逃出了密室!</p>
          
          <div className="glass-card rounded-2xl p-6 max-w-sm mx-auto mb-8">
            <div className="text-sm text-gray-400">用时移动</div>
            <div className="text-4xl font-bold text-cyan-400 mb-2">{moves} 步</div>
            <div className="text-gray-400">
              收集了 {inventory.length} 件物品
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-400 via-gray-500 to-purple-500 bg-clip-text text-transparent">
          🚪 密室逃脱 - 房间 {room}
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-4 mb-4"
      >
        <div className="glass-card px-4 py-2 rounded-xl">
          <div className="text-sm text-gray-400">移动</div>
          <div className="text-xl font-bold text-cyan-400">{moves}</div>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl">
          <div className="text-sm text-gray-400">房间</div>
          <div className="text-xl font-bold text-purple-400">{room}</div>
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
            width: gridSize * cellSize,
            height: gridSize * cellSize,
            border: `3px solid ${NEON_COLORS.primary}40`
          }}
        >
          {Array.from({ length: gridSize }).map((_, y) =>
            Array.from({ length: gridSize }).map((_, x) => renderCell(x, y))
          )}
        </div>
      </motion.div>

      {inventory.length > 0 && (
        <div className="mt-4 glass-card rounded-xl p-4 w-80">
          <h3 className="text-sm text-gray-400 mb-2">背包</h3>
          <div className="flex flex-wrap gap-2">
            {inventory.filter(i => !i.used).map(item => (
              <div key={item.id} className="flex items-center gap-2 bg-gray-800 rounded-lg px-2 py-1">
                <span>{item.type === 'key' ? '🗝️' : item.type === 'code' ? '🔢' : item.type === 'lever' ? '🎚️' : '📜'}</span>
                <span className="text-sm text-white">{item.name}</span>
                {item.type === 'key' && (
                  <button
                    onClick={() => handleUseItem(item.id)}
                    className="text-xs bg-green-600 px-2 py-0.5 rounded text-white"
                  >
                    使用
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {puzzles.some(p => p.type === 'code_lock' && !p.solved) && (
          <button
            onClick={() => setShowCodeInput(!showCodeInput)}
            className="px-4 py-2 bg-blue-600 rounded-xl text-white font-bold"
          >
            输入密码
          </button>
        )}
        {items.some(i => i.type === 'lever') && (
          <button
            onClick={handlePullLever}
            className="px-4 py-2 bg-orange-600 rounded-xl text-white font-bold"
          >
            拉控制杆
          </button>
        )}
      </div>

      {showCodeInput && (
        <div className="mt-4 glass-card rounded-xl p-4">
          <input
            type="text"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="输入4位密码..."
            className="px-4 py-2 bg-gray-800 text-white rounded-xl border border-purple-500 outline-none text-center w-40"
            maxLength={4}
          />
          <button
            onClick={handleSolveCode}
            className="ml-2 px-4 py-2 bg-green-600 rounded-xl text-white font-bold"
          >
            确认
          </button>
        </div>
      )}

      <div className="mt-4 text-gray-400 text-sm">
        <p>方向键/WASD移动 | 空格/E交互</p>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={startGame}
          className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-white font-bold"
        >
          🔄 重置
        </button>
        <button
          onClick={() => setPhase('menu')}
          className="px-6 py-2 bg-gray-700 rounded-xl text-white font-medium"
        >
          🏠 菜单
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
