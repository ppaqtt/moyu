import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RandomMazeEngine, MazeCell } from './engine';

const CELL_SIZE = 28;

export default function RandomMaze() {
  const [engine] = useState(() => new RandomMazeEngine());
  const [gameState, setGameState] = useState(() => engine.getState());
  const [showMenu, setShowMenu] = useState(true);

  const updateState = useCallback(() => {
    setGameState(engine.getState());
  }, [engine]);

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

  const getCellStyle = (cell: MazeCell) => {
    const isPlayer = cell.row === gameState.playerRow && cell.col === gameState.playerCol;
    
    if (isPlayer) {
      return {
        backgroundColor: '#00d2ff',
        boxShadow: '0 0 15px #00d2ff',
        border: '1px solid #00ffff'
      };
    }

    switch (cell.type) {
      case 'wall':
        return {
          backgroundColor: '#2d2d44',
          border: '1px solid #3d3d5c'
        };
      case 'path':
        return {
          backgroundColor: '#1a1a2e',
          border: '1px solid #2a2a44'
        };
      case 'start':
        return {
          backgroundColor: 'rgba(0, 255, 0, 0.2)',
          border: '1px solid #00ff00'
        };
      case 'end':
        return {
          backgroundColor: 'rgba(255, 215, 0, 0.3)',
          border: '1px solid #ffd700',
          boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
        };
      default:
        return {
          backgroundColor: '#1a1a2e',
          border: '1px solid #2a2a44'
        };
    }
  };

  if (showMenu) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-lg"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            🌀 随机迷宫
          </h1>
          <p className="text-gray-400 mb-8">RandomMaze</p>

          <div className="glass-card rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-cyan-400 mb-4">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-3">
              <li>• 使用方向键或 WASD 移动</li>
              <li>• 从绿色起点出发</li>
              <li>• 找到金色终点</li>
              <li>• 每次游戏都是全新的迷宫</li>
              <li>• 尝试用最少的步数完成！</li>
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{ 
              background: 'linear-gradient(135deg, #00d2ff, #0066ff)',
              boxShadow: '0 0 30px rgba(0, 210, 255, 0.5)'
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
        className="w-full max-w-md mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMenu(true)}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: '#2d2d44',
              color: '#00d2ff',
              border: '1px solid #00d2ff'
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

        <div className="glass-card px-4 py-3 rounded-xl text-center">
          <div className="text-sm text-gray-400">步数</div>
          <div className="text-2xl font-bold text-cyan-400">{gameState.moves}</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl p-4 mb-6"
        style={{
          backgroundColor: '#1a1a2e',
          boxShadow: '0 0 30px rgba(0, 210, 255, 0.3)'
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
                className="flex items-center justify-center"
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  ...getCellStyle(cell)
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: (rowIndex + colIndex) * 0.01 }}
              >
                {cell.row === gameState.playerRow && cell.col === gameState.playerCol && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-lg"
                  >
                    🧙
                  </motion.div>
                )}
                {cell.type === 'end' && !(cell.row === gameState.playerRow && cell.col === gameState.playerCol) && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-lg"
                  >
                    🏆
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-2 w-40">
        <div></div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleMove('up')}
          className="p-3 rounded-lg font-bold text-xl"
          style={{
            backgroundColor: '#00d2ff',
            color: '#0f0f1a',
            boxShadow: '0 0 10px rgba(0, 210, 255, 0.5)'
          }}
        >
          ↑
        </motion.button>
        <div></div>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleMove('left')}
          className="p-3 rounded-lg font-bold text-xl"
          style={{
            backgroundColor: '#00d2ff',
            color: '#0f0f1a',
            boxShadow: '0 0 10px rgba(0, 210, 255, 0.5)'
          }}
        >
          ←
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleMove('down')}
          className="p-3 rounded-lg font-bold text-xl"
          style={{
            backgroundColor: '#00d2ff',
            color: '#0f0f1a',
            boxShadow: '0 0 10px rgba(0, 210, 255, 0.5)'
          }}
        >
          ↓
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleMove('right')}
          className="p-3 rounded-lg font-bold text-xl"
          style={{
            backgroundColor: '#00d2ff',
            color: '#0f0f1a',
            boxShadow: '0 0 10px rgba(0, 210, 255, 0.5)'
          }}
        >
          →
        </motion.button>
      </div>

      {gameState.isComplete && (
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
              用了 {gameState.moves} 步完成！
            </div>
            <div className="text-lg text-gray-400 mb-6">
              准备好挑战更大的迷宫了吗？
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
                  color: '#00d2ff',
                  border: '2px solid #00d2ff'
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
