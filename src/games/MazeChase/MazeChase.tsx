import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MazeChaseEngine, MazeCell } from './engine';

const CELL_SIZE = 32;

export default function MazeChase() {
  const [engine] = useState(() => new MazeChaseEngine());
  const [gameState, setGameState] = useState(() => engine.getState());
  const [showMenu, setShowMenu] = useState(true);
  const animationFrameId = useRef<number>();

  const updateState = useCallback(() => {
    setGameState(engine.getState());
  }, [engine]);

  const gameLoop = useCallback(() => {
    if (!showMenu && !gameState.isComplete && !gameState.isGameOver) {
      engine.update();
      updateState();
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
  }, [engine, updateState, showMenu, gameState.isComplete, gameState.isGameOver]);

  useEffect(() => {
    if (!showMenu) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [showMenu, gameLoop]);

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    engine.move(direction);
    updateState();
  }, [engine, updateState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showMenu) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleMove('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleMove('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleMove('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleMove('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, showMenu]);

  const handleReset = useCallback(() => {
    engine.reset();
    updateState();
    setShowMenu(false);
  }, [engine, updateState]);

  const handleNextLevel = useCallback(() => {
    engine.nextLevel();
    updateState();
  }, [engine, updateState]);

  const getCellContent = (cell: MazeCell) => {
    const isPlayer = cell.row === gameState.playerRow && cell.col === gameState.playerCol;
    const isEnemy = gameState.enemies.some(e => e.row === cell.row && e.col === cell.col);

    if (isPlayer) {
      return gameState.isPoweredUp ? '⭐' : '🧙';
    }

    if (isEnemy) {
      return '👻';
    }

    switch (cell.type) {
      case 'coin':
        return '🪙';
      case 'powerup':
        return '⚡';
      case 'end':
        return '🏆';
      case 'start':
        return '🚩';
      default:
        return '';
    }
  };

  const getCellStyle = (cell: MazeCell) => {
    const isPlayer = cell.row === gameState.playerRow && cell.col === gameState.playerCol;
    const isEnemy = gameState.enemies.some(e => e.row === cell.row && e.col === cell.col);

    let bgColor = '#1a1a2e';
    let borderColor = '#2a2a44';
    let boxShadow = 'none';

    switch (cell.type) {
      case 'wall':
        bgColor = '#2d2d44';
        borderColor = '#3d3d5c';
        break;
      case 'end':
        bgColor = 'rgba(255, 215, 0, 0.2)';
        borderColor = 'rgba(255, 215, 0, 0.5)';
        boxShadow = '0 0 15px rgba(255, 215, 0, 0.4)';
        break;
    }

    if (isPlayer) {
      boxShadow = gameState.isPoweredUp
        ? '0 0 20px rgba(255, 215, 0, 0.7)'
        : '0 0 20px rgba(0, 210, 255, 0.5)';
    }

    if (isEnemy) {
      boxShadow = '0 0 15px rgba(255, 0, 0, 0.5)';
    }

    return {
      backgroundColor: bgColor,
      border: `1px solid ${borderColor}`,
      boxShadow
    };
  };

  if (showMenu) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-lg"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            🏃 迷宫追逐
          </h1>
          <p className="text-gray-400 mb-8">MazeChase</p>

          <div className="glass-card rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-pink-400 mb-4">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-3">
              <li>• 使用方向键或 WASD 移动</li>
              <li>• 收集金币 🪙 获得分数</li>
              <li>• 收集能量 ⚡ 可以吃掉敌人</li>
              <li>• 躲避敌人 👻，不要被抓住！</li>
              <li>• 到达终点 🏆 完成关卡</li>
              <li>• 你有 3 条生命，加油！</li>
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{
              background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
              boxShadow: '0 0 30px rgba(231, 76, 60, 0.5)'
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)' }}>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-2xl mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMenu(true)}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: '#2d2d44',
              color: '#e74c3c',
              border: '1px solid #e74c3c'
            }}
          >
            菜单
          </motion.button>

          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>关卡</div>
            <div className="text-2xl font-bold text-white">{gameState.level}</div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: '#2d2d44',
              color: '#ff6b9d',
              border: '1px solid #ff6b9d'
            }}
          >
            重置
          </motion.button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="glass-card px-4 py-3 rounded-xl text-center">
            <div className="text-sm text-gray-400">分数</div>
            <div className="text-xl font-bold text-yellow-400">{gameState.score}</div>
          </div>
          <div className="glass-card px-4 py-3 rounded-xl text-center">
            <div className="text-sm text-gray-400">生命</div>
            <div className="text-xl font-bold text-red-400">{'❤️'.repeat(gameState.lives)}</div>
          </div>
          <div className="glass-card px-4 py-3 rounded-xl text-center">
            <div className="text-sm text-gray-400">金币</div>
            <div className="text-xl font-bold text-cyan-400">{gameState.coinsCollected}/{gameState.totalCoins}</div>
          </div>
          <div className="glass-card px-4 py-3 rounded-xl text-center">
            <div className="text-sm text-gray-400">能量</div>
            <div className="text-xl font-bold" style={{ color: gameState.isPoweredUp ? '#ffd700' : '#666' }}>
              {gameState.isPoweredUp ? '⚡' : '---'}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl p-4 mb-4"
        style={{
          backgroundColor: '#1a1a2e',
          boxShadow: '0 0 30px rgba(231, 76, 60, 0.3)'
        }}
      >
        <div
          className="grid gap-0"
          style={{
            gridTemplateColumns: `repeat(${gameState.maze[0].length}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${gameState.maze.length}, ${CELL_SIZE}px)`
          }}
        >
          {gameState.maze.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <motion.div
                key={`${rowIndex}-${colIndex}`}
                className="flex items-center justify-center text-xl"
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  ...getCellStyle(cell)
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: (rowIndex + colIndex) * 0.01 }}
              >
                {getCellContent(cell)}
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-2 w-48">
        <div></div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleMove('up')}
          className="p-3 rounded-lg font-bold text-2xl"
          style={{
            backgroundColor: '#e74c3c',
            color: '#fff',
            boxShadow: '0 0 10px rgba(231, 76, 60, 0.5)'
          }}
        >
          ↑
        </motion.button>
        <div></div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleMove('left')}
          className="p-3 rounded-lg font-bold text-2xl"
          style={{
            backgroundColor: '#e74c3c',
            color: '#fff',
            boxShadow: '0 0 10px rgba(231, 76, 60, 0.5)'
          }}
        >
          ←
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleMove('down')}
          className="p-3 rounded-lg font-bold text-2xl"
          style={{
            backgroundColor: '#e74c3c',
            color: '#fff',
            boxShadow: '0 0 10px rgba(231, 76, 60, 0.5)'
          }}
        >
          ↓
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleMove('right')}
          className="p-3 rounded-lg font-bold text-2xl"
          style={{
            backgroundColor: '#e74c3c',
            color: '#fff',
            boxShadow: '0 0 10px rgba(231, 76, 60, 0.5)'
          }}
        >
          →
        </motion.button>
      </div>

      {gameState.isComplete && !gameState.isGameOver && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-center p-8 rounded-2xl"
            style={{ backgroundColor: '#1a1a2e' }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: '#00ff00' }}>
              🎉 恭喜通关！
            </div>
            <div className="text-2xl text-yellow-400 mb-2">
              得分: {gameState.score}
            </div>
            <div className="text-lg text-gray-400 mb-6">
              准备好挑战下一关了吗？
            </div>
            <div className="flex gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextLevel}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: '#00ff00',
                  color: '#0f0f1a',
                  boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)'
                }}
              >
                下一关
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMenu(true)}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: 'transparent',
                  color: '#e74c3c',
                  border: '2px solid #e74c3c'
                }}
              >
                返回菜单
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {gameState.isGameOver && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-center p-8 rounded-2xl"
            style={{ backgroundColor: '#1a1a2e' }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: '#e74c3c' }}>
              💀 游戏结束
            </div>
            <div className="text-2xl text-yellow-400 mb-2">
              最终得分: {gameState.score}
            </div>
            <div className="text-lg text-gray-400 mb-6">
              不要灰心，再试一次！
            </div>
            <div className="flex gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: '#e74c3c',
                  color: '#fff',
                  boxShadow: '0 0 20px rgba(231, 76, 60, 0.5)'
                }}
              >
                再玩一次
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMenu(true)}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: 'transparent',
                  color: '#e74c3c',
                  border: '2px solid #e74c3c'
                }}
              >
                返回菜单
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

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
