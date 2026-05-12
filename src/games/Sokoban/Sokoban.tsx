import { useState, useEffect, useCallback } from 'react';
import { SokobanEngine } from './engine';
import { SOKOBAN_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export default function Sokoban() {
  const [engine] = useState(() => new SokobanEngine());
  const [gameState, setGameState] = useState({
    map: engine.getMap(),
    player: engine.getPlayer(),
    boxes: engine.getBoxes(),
    targets: engine.getTargets(),
    level: engine.getLevel(),
    moves: 0,
    pushes: 0,
    completed: false
  });
  const [message, setMessage] = useState('推动箱子到目标点！');
  const [score, setScore] = useLocalStorage(STORAGE_KEYS.SOKOBAN, { highScore: 0 });
  const navigate = useNavigate();

  const updateDisplay = useCallback(() => {
    setGameState({
      map: engine.getMap(),
      player: engine.getPlayer(),
      boxes: engine.getBoxes(),
      targets: engine.getTargets(),
      level: engine.getLevel(),
      moves: engine.getMoves(),
      pushes: engine.getPushes(),
      completed: engine.isCompleted()
    });
  }, [engine]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState.completed) return;

    let dx = 0, dy = 0;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        dy = -1;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        dy = 1;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        dx = -1;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        dx = 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    const result = engine.move(dx, dy);
    setMessage(result.message);
    updateDisplay();
  }, [engine, updateDisplay, gameState.completed]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleRestart = () => {
    engine.reset();
    updateDisplay();
    setMessage('重新开始当前关卡');
  };

  const handleNextLevel = () => {
    if (engine.nextLevel()) {
      updateDisplay();
      setMessage(`进入第${engine.getLevel()}关: ${engine.getLevelName()}`);
    } else {
      setMessage('恭喜通关所有关卡！');
    }
  };

  const handlePrevLevel = () => {
    if (engine.previousLevel()) {
      updateDisplay();
      setMessage(`返回第${engine.getLevel()}关: ${engine.getLevelName()}`);
    }
  };

  const handleLevelSelect = (level: number) => {
    engine.goToLevel(level);
    updateDisplay();
    setMessage(`选择第${level}关: ${engine.getLevelName()}`);
  };

  const { CELL_SIZE } = SOKOBAN_CONSTANTS;
  const boardWidth = gameState.map[0].length * CELL_SIZE;
  const boardHeight = gameState.map.length * CELL_SIZE;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
          推箱子 Sokoban
        </h1>
        <p className="text-gray-400">推动箱子到目标位置，完成关卡！</p>
      </motion.div>

      {/* Info Panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-6 mb-4"
      >
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">关卡</div>
          <div className="text-2xl font-bold text-purple-400">
            {gameState.level} / {engine.getTotalLevels()}
          </div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">移动</div>
          <div className="text-2xl font-bold text-cyan-400">{gameState.moves}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">推动</div>
          <div className="text-2xl font-bold text-orange-400">{gameState.pushes}</div>
        </div>
        <div className="glass-card px-6 py-3 rounded-xl">
          <div className="text-sm text-gray-400">关卡名</div>
          <div className="text-xl font-bold text-green-400">{engine.getLevelName()}</div>
        </div>
      </motion.div>

      {/* Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-4"
      >
        <div className={`glass-card px-6 py-2 rounded-xl text-center ${
          message.includes('恭喜') || message.includes('过关') ? 'text-green-400' :
          message.includes('撞墙') || message.includes('推不动') ? 'text-red-400' :
          'text-gray-300'
        }`}>
          {message}
        </div>
      </motion.div>

      {/* Game Board */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative"
      >
        <div className="glass-card rounded-2xl p-4">
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              width: boardWidth,
              height: boardHeight,
              background: 'linear-gradient(135deg, #1a1a2e, #2d2d44)'
            }}
          >
            {/* 绘制地图 */}
            {gameState.map.map((row, y) =>
              row.map((cell, x) => {
                // 检查是否在边界外
                const isOutside = cell === 0 && (
                  y === 0 || y === gameState.map.length - 1 ||
                  x === 0 || x === row.length - 1
                );

                if (cell === 1 || isOutside) {
                  return (
                    <div
                      key={`${x}-${y}`}
                      className="absolute"
                      style={{
                        left: x * CELL_SIZE,
                        top: y * CELL_SIZE,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        background: 'linear-gradient(135deg, #4a4a6a, #3a3a5a)',
                        border: '1px solid rgba(108, 92, 231, 0.2)'
                      }}
                    />
                  );
                }

                // 绘制地板
                return (
                  <div
                    key={`${x}-${y}`}
                    className="absolute"
                    style={{
                      left: x * CELL_SIZE,
                      top: y * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      background: 'rgba(45, 45, 68, 0.5)'
                    }}
                  />
                );
              })
            )}

            {/* 绘制目标点 */}
            {gameState.targets.map((target, i) => (
              <motion.div
                key={`target-${i}`}
                className="absolute flex items-center justify-center"
                style={{
                  left: target.x * CELL_SIZE,
                  top: target.y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE
                }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span className="text-3xl opacity-50">🎯</span>
              </motion.div>
            ))}

            {/* 绘制箱子 */}
            {gameState.boxes.map((box, i) => {
              const onTarget = engine.isBoxOnTarget(box);
              return (
                <motion.div
                  key={`box-${i}`}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: box.x * CELL_SIZE,
                    top: box.y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div
                    className={`rounded-lg flex items-center justify-center font-bold text-xl shadow-lg ${
                      onTarget
                        ? 'bg-gradient-to-br from-green-500 to-green-700 text-white'
                        : 'bg-gradient-to-br from-yellow-600 to-orange-600 text-white'
                    }`}
                    style={{
                      width: CELL_SIZE - 8,
                      height: CELL_SIZE - 8,
                      boxShadow: onTarget
                        ? '0 0 20px rgba(34, 197, 94, 0.5)'
                        : '0 4px 8px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    📦
                  </div>
                </motion.div>
              );
            })}

            {/* 绘制玩家 */}
            <motion.div
              className="absolute flex items-center justify-center"
              style={{
                left: gameState.player.x * CELL_SIZE,
                top: gameState.player.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5 }}
            >
              <div
                className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg"
                style={{
                  width: CELL_SIZE - 8,
                  height: CELL_SIZE - 8,
                  boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
                }}
              >
                😎
              </div>
            </motion.div>
          </div>

          {/* Level Complete Overlay */}
          {gameState.completed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="text-4xl mb-4">🎉</div>
                <div className="text-3xl font-bold text-green-400 mb-2">恭喜过关！</div>
                <div className="text-gray-300 mb-2">
                  移动 {gameState.moves} 步，推动 {gameState.pushes} 次
                </div>
                <div className="flex gap-3 justify-center mt-4">
                  {engine.getLevel() < engine.getTotalLevels() && (
                    <button
                      onClick={handleNextLevel}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-cyan-600 rounded-xl text-white font-bold hover:from-green-700 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                      下一关 →
                    </button>
                  )}
                  <button
                    onClick={handleRestart}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    重玩本关
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Level Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4"
        >
          <div className="glass-card px-4 py-3 rounded-xl">
            <div className="text-sm text-gray-400 mb-2 text-center">选择关卡</div>
            <div className="flex gap-2 justify-center">
              {Array.from({ length: engine.getTotalLevels() }, (_, i) => i + 1).map(level => (
                <button
                  key={level}
                  onClick={() => handleLevelSelect(level)}
                  className={`w-10 h-10 rounded-lg font-bold transition-all ${
                    gameState.level === level
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-between items-center mt-4 px-2"
        >
          <div className="flex gap-3">
            <button
              onClick={handlePrevLevel}
              disabled={gameState.level <= 1}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
            >
              ← 上一关
            </button>
            <button
              onClick={handleNextLevel}
              disabled={gameState.level >= engine.getTotalLevels()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
            >
              下一关 →
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRestart}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
            >
              🔄 重置
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
            >
              🏠 返回主页
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 max-w-2xl text-center"
      >
        <div className="glass-card px-6 py-4 rounded-xl">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">🎯 游戏技巧</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• 使用方向键或 WASD 移动角色</li>
            <li>• 推动箱子到 🎯 目标点即可过关</li>
            <li>• 注意不要把箱子推到角落里</li>
            <li>• 箱子变成绿色表示已在目标位置</li>
            <li>• 点击数字按钮可以切换关卡</li>
          </ul>
        </div>
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
