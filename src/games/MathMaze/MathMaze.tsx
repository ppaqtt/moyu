
import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MathMazeEngine, MazeCell } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const MAZE_SIZE = 7;
const CELL_SIZE = 52;

export default function MathMaze() {
  const [engine] = useState(() =&gt; new MathMazeEngine());
  const [gameState, setGameState] = useState(() =&gt; engine.getState());
  const [showMenu, setShowMenu] = useState(true);

  const updateState = useCallback(() =&gt; {
    setGameState(engine.getState());
  }, [engine]);

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') =&gt; {
    engine.move(direction);
    updateState();
  }, [engine, updateState]);

  useEffect(() =&gt; {
    const handleKeyDown = (e: KeyboardEvent) =&gt; {
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
    return () =&gt; window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  const handleReset = useCallback(() =&gt; {
    engine.reset();
    updateState();
    setShowMenu(false);
  }, [engine, updateState]);

  const handleNextLevel = useCallback(() =&gt; {
    engine.nextLevel();
    updateState();
  }, [engine, updateState]);

  const getCellContent = (cell: MazeCell) =&gt; {
    switch (cell.type) {
      case 'start':
        return '🚀';
      case 'end':
        return '🏁';
      case 'number':
        return cell.value;
      case 'operator':
        return cell.operator;
      default:
        return '';
    }
  };

  const getCellColor = (cell: MazeCell) =&gt; {
    if (cell.isCurrent) return NEON_COLORS.neonPink;
    if (cell.isPath) return `${NEON_COLORS.neonBlue}40';
    if (cell.type === 'start') return NEON_COLORS.success;
    if (cell.type === 'end') return NEON_COLORS.gold;
    if (cell.type === 'number') return NEON_COLORS.neonBlue;
    if (cell.type === 'operator') return NEON_COLORS.secondary;
    return '#34495e';
  };

  const renderCell = (cell: MazeCell) =&gt; {
    return (
      &lt;motion.div
        key={cell.id}
        className="flex items-center justify-center font-bold rounded-lg transition-all"
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          backgroundColor: cell.isCurrent 
            ? `${NEON_COLORS.neonPink}30` 
            : cell.isPath 
              ? `${NEON_COLORS.neonBlue}20` 
              : NEON_COLORS.darkPurple,
          border: cell.isCurrent 
            ? `2px solid ${NEON_COLORS.neonPink}` 
            : cell.isPath 
              ? `1px solid ${NEON_COLORS.neonBlue}` 
              : '1px solid #34495e',
          color: getCellColor(cell),
          fontSize: cell.type === 'start' || cell.type === 'end' ? '1.5rem' : '1.2rem',
          boxShadow: cell.isCurrent ? `0 0 20px ${NEON_COLORS.neonPink}50` : 'none',
          gridColumn: cell.col + 1,
          gridRow: cell.row + 1,
          zIndex: cell.isCurrent ? 10 : 1
        }}
        initial={cell.isCurrent ? { scale: 1.1 } : {}}
        animate={cell.isCurrent ? { scale: 1.1 } : { scale: 1 }}
        whileHover={{ scale: 1.05 }}
      &gt;
        {getCellContent(cell)}
      &lt;/motion.div&gt;
    );
  };

  if (showMenu) {
    return (
      &lt;div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}&gt;
        &lt;motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-lg"
        &gt;
          &lt;h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent"&gt;
            🎯 数学迷宫
          &lt;/h1&gt;
          &lt;p className="text-gray-400 mb-8"&gt;Math Maze&lt;/p&gt;

          &lt;div className="glass-card rounded-2xl p-6 mb-8"&gt;
            &lt;h3 className="text-lg font-bold text-cyan-400 mb-4"&gt;游戏规则&lt;/h3&gt;
            &lt;ul className="text-gray-300 text-left space-y-3"&gt;
              &lt;li&gt;• 使用方向键或 WASD 移动&lt;/li&gt;
              &lt;li&gt;• 从起点 🚀 出发&lt;/li&gt;
              &lt;li&gt;• 收集数字和运算符进行计算&lt;/li&gt;
              &lt;li&gt;• 到达终点 🏁 时，结果必须等于目标值&lt;/li&gt;
              &lt;li&gt;• 步数越少，分数越高！&lt;/li&gt;
            &lt;/ul&gt;
          &lt;/div&gt;

          &lt;motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{ 
              background: `linear-gradient(135deg, ${NEON_COLORS.success}, #00aa00)`,
              boxShadow: `0 0 30px ${NEON_COLORS.success}50`
            }}
          &gt;
            开始游戏
          &lt;/motion.button&gt;
        &lt;/motion.div&gt;

        &lt;style&gt;{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(108, 92, 231, 0.3);
          }
        `}&lt;/style&gt;
      &lt;/div&gt;
    );
  }

  return (
    &lt;div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}&gt;
      &lt;motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md mb-6"
      &gt;
        &lt;div className="flex items-center justify-between mb-4"&gt;
          &lt;motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =&gt; setShowMenu(true)}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonBlue,
              border: `1px solid ${NEON_COLORS.neonBlue}`
            }}
          &gt;
            菜单
          &lt;/motion.button&gt;

          &lt;div className="text-center"&gt;
            &lt;div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}&gt;关卡&lt;/div&gt;
            &lt;div className="text-2xl font-bold text-white"&gt;{gameState.level}&lt;/div&gt;
          &lt;/div&gt;

          &lt;motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonPink,
              border: `1px solid ${NEON_COLORS.neonPink}`
            }}
          &gt;
            重置
          &lt;/motion.button&gt;
        &lt;/div&gt;

        &lt;div className="grid grid-cols-4 gap-4"&gt;
          &lt;div className="glass-card px-4 py-3 rounded-xl text-center"&gt;
            &lt;div className="text-sm text-gray-400"&gt;分数&lt;/div&gt;
            &lt;div className="text-xl font-bold text-yellow-400"&gt;{gameState.score}&lt;/div&gt;
          &lt;/div&gt;
          &lt;div className="glass-card px-4 py-3 rounded-xl text-center"&gt;
            &lt;div className="text-sm text-gray-400"&gt;步数&lt;/div&gt;
            &lt;div className="text-xl font-bold text-cyan-400"&gt;{gameState.moves}&lt;/div&gt;
          &lt;/div&gt;
          &lt;div className="glass-card px-4 py-3 rounded-xl text-center"&gt;
            &lt;div className="text-sm text-gray-400"&gt;当前值&lt;/div&gt;
            &lt;div className="text-xl font-bold text-pink-400"&gt;{gameState.currentValue}&lt;/div&gt;
          &lt;/div&gt;
          &lt;div className="glass-card px-4 py-3 rounded-xl text-center"&gt;
            &lt;div className="text-sm text-gray-400"&gt;目标值&lt;/div&gt;
            &lt;div className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}&gt;{gameState.targetValue}&lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/motion.div&gt;

      &lt;motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl p-4 mb-6"
        style={{
          backgroundColor: NEON_COLORS.darkPurple,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`
        }}
      &gt;
        &lt;div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${MAZE_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${MAZE_SIZE}, ${CELL_SIZE}px)`
          }}
        &gt;
          {gameState.maze.map((row) =&gt;
            row.map((cell) =&gt; renderCell(cell))
          }
        &lt;/div&gt;
      &lt;/motion.div&gt;

      &lt;div className="grid grid-cols-3 gap-2 w-48"&gt;
        &lt;div&gt;&lt;/div&gt;
        &lt;motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() =&gt; handleMove('up')}
          className="px-4 py-4 rounded-lg font-bold text-2xl"
          style={{
            backgroundColor: NEON_COLORS.neonBlue,
            color: NEON_COLORS.white,
            boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}50`
          }}
        &gt;
          ↑
        &lt;/motion.button&gt;
        &lt;div&gt;&lt;/div&gt;
        
        &lt;motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() =&gt; handleMove('left')}
          className="px-4 py-4 rounded-lg font-bold text-2xl"
          style={{
            backgroundColor: NEON_COLORS.neonBlue,
            color: NEON_COLORS.white,
            boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}50`
          }}
        &gt;
          ←
        &lt;/motion.button&gt;
        &lt;motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() =&gt; handleMove('down')}
          className="px-4 py-4 rounded-lg font-bold text-2xl"
          style={{
            backgroundColor: NEON_COLORS.neonBlue,
            color: NEON_COLORS.white,
            boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}50`
          }}
        &gt;
          ↓
        &lt;/motion.button&gt;
        &lt;motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() =&gt; handleMove('right')}
          className="px-4 py-4 rounded-lg font-bold text-2xl"
          style={{
            backgroundColor: NEON_COLORS.neonBlue,
            color: NEON_COLORS.white,
            boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}50`
          }}
        &gt;
          →
        &lt;/motion.button&gt;
      &lt;/div&gt;

      {gameState.isComplete &amp;&amp; !gameState.isGameOver &amp;&amp; (
        &lt;motion.div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        &gt;
          &lt;motion.div
            className="text-center p-8 rounded-2xl"
            style={{ backgroundColor: NEON_COLORS.darkPurple }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          &gt;
            &lt;div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.success }}&gt;
              🎉 完美通关！
            &lt;/div&gt;
            &lt;div className="text-2xl text-yellow-400 mb-2"&gt;
              得分: {gameState.score}
            &lt;/div&gt;
            &lt;div className="text-lg text-gray-400 mb-6"&gt;
              准备好下一关了吗？
            &lt;/div&gt;
            &lt;div className="flex gap-4 justify-center"&gt;
              &lt;motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextLevel}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: NEON_COLORS.success,
                  color: NEON_COLORS.white,
                  boxShadow: `0 0 20px ${NEON_COLORS.success}50`
                }}
              &gt;
                下一关
              &lt;/motion.button&gt;
              &lt;motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =&gt; setShowMenu(true)}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: 'transparent',
                  color: NEON_COLORS.neonBlue,
                  border: `2px solid ${NEON_COLORS.neonBlue}`
                }}
              &gt;
                返回菜单
              &lt;/motion.button&gt;
            &lt;/div&gt;
          &lt;/motion.div&gt;
        &lt;/motion.div&gt;
      )}

      {gameState.isGameOver &amp;&amp; (
        &lt;motion.div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        &gt;
          &lt;motion.div
            className="text-center p-8 rounded-2xl"
            style={{ backgroundColor: NEON_COLORS.darkPurple }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          &gt;
            &lt;div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}&gt;
              😢 挑战失败
            &lt;/div&gt;
            &lt;div className="text-xl text-gray-400 mb-6"&gt;
              当前值 {gameState.currentValue} 不等于目标值 {gameState.targetValue}
            &lt;/div&gt;
            &lt;div className="flex gap-4 justify-center"&gt;
              &lt;motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonPink,
                  color: NEON_COLORS.white,
                  boxShadow: `0 0 20px ${NEON_COLORS.neonPink}50`
                }}
              &gt;
                再试一次
              &lt;/motion.button&gt;
              &lt;motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =&gt; setShowMenu(true)}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: 'transparent',
                  color: NEON_COLORS.neonBlue,
                  border: `2px solid ${NEON_COLORS.neonBlue}`
                }}
              &gt;
                返回菜单
              &lt;/motion.button&gt;
            &lt;/div&gt;
          &lt;/motion.div&gt;
        &lt;/motion.div&gt;
      )}

      &lt;style&gt;{`
        .glass-card {
          background: rgba(26, 26, 46, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 92, 231, 0.3);
        }
      `}&lt;/style&gt;
    &lt;/div&gt;
  );
}
