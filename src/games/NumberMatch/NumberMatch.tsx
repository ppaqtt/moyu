
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NumberMatchEngine, NumberCell } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const GRID_SIZE = 6;
const CELL_SIZE = 56;

const NUMBER_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#96ceb4',
  '#ffeaa7',
  '#fd79a8',
  '#a29bfe',
  '#74b9ff',
  '#ffd93d'
];

export default function NumberMatch() {
  const [engine] = useState(() =&gt; new NumberMatchEngine());
  const [gameState, setGameState] = useState(() =&gt; engine.getState());
  const [selectedSum, setSelectedSum] = useState(0);
  const [showMenu, setShowMenu] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const updateState = useCallback(() =&gt; {
    setGameState(engine.getState());
    setSelectedSum(engine.getSelectedSum());
  }, [engine]);

  const handleCellClick = useCallback((row: number, col: number) =&gt; {
    engine.selectCell(row, col);
    updateState();
  }, [engine, updateState]);

  const handleCheckMatch = useCallback(() =&gt; {
    const isMatch = engine.checkMatch();
    if (isMatch) {
      setShowSuccess(true);
      setTimeout(() =&gt; {
        setShowSuccess(false);
        updateState();
      }, 500);
    } else {
      updateState();
    }
  }, [engine, updateState]);

  const handleReset = useCallback(() =&gt; {
    engine.reset();
    updateState();
    setShowMenu(false);
  }, [engine, updateState]);

  const handleNextLevel = useCallback(() =&gt; {
    engine.nextLevel();
    updateState();
  }, [engine, updateState]);

  const renderCell = (cell: NumberCell) =&gt; {
    return (
      &lt;motion.div
        key={cell.id}
        className="cursor-pointer select-none flex items-center justify-center font-bold rounded-xl transition-all"
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          backgroundColor: cell.isMatched 
            ? '#27ae6040'
            : cell.isSelected 
              ? `${NEON_COLORS.neonPink}80` 
              : NEON_COLORS.darkPurple,
          color: NUMBER_COLORS[cell.value - 1],
          fontSize: '1.5rem',
          border: `2px solid ${cell.isSelected ? NEON_COLORS.neonPink : '#34495e'}`,
          boxShadow: cell.isSelected 
            ? `0 0 20px ${NEON_COLORS.neonPink}50` 
            : 'none',
          gridColumn: cell.col + 1,
          gridRow: cell.row + 1,
          zIndex: cell.isSelected ? 10 : 1
        }}
        initial={cell.isNew ? { scale: 0, y: -50 } : false}
        animate={cell.isNew ? { scale: 1, y: 0 } : {}}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() =&gt; handleCellClick(cell.row, cell.col)}
      &gt;
        {cell.value}
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
            🔢 数字消消乐
          &lt;/h1&gt;
          &lt;p className="text-gray-400 mb-8"&gt;Number Match&lt;/p&gt;

          &lt;div className="glass-card rounded-2xl p-6 mb-8"&gt;
            &lt;h3 className="text-lg font-bold text-cyan-400 mb-4"&gt;游戏规则&lt;/h3&gt;
            &lt;ul className="text-gray-300 text-left space-y-3"&gt;
              &lt;li&gt;• 选择相邻的数字，使它们的和等于目标数&lt;/li&gt;
              &lt;li&gt;• 点击数字选中，再次点击取消选中&lt;/li&gt;
              &lt;li&gt;• 选中后点击"消除"按钮来移除这些数字&lt;/li&gt;
              &lt;li&gt;• 匹配的数字越多，获得的分数越高！&lt;/li&gt;
              &lt;li&gt;• 随着关卡提升，目标数字也会增加&lt;/li&gt;
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

        &lt;div className="grid grid-cols-3 gap-4"&gt;
          &lt;div className="glass-card px-4 py-3 rounded-xl text-center"&gt;
            &lt;div className="text-sm text-gray-400"&gt;分数&lt;/div&gt;
            &lt;div className="text-xl font-bold text-yellow-400"&gt;{gameState.score}&lt;/div&gt;
          &lt;/div&gt;
          &lt;div className="glass-card px-4 py-3 rounded-xl text-center"&gt;
            &lt;div className="text-sm text-gray-400"&gt;步数&lt;/div&gt;
            &lt;div className="text-xl font-bold text-cyan-400"&gt;{gameState.moves}&lt;/div&gt;
          &lt;/div&gt;
          &lt;div className="glass-card px-4 py-3 rounded-xl text-center"&gt;
            &lt;div className="text-sm text-gray-400"&gt;目标&lt;/div&gt;
            &lt;div className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}&gt;{gameState.target}&lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/motion.div&gt;

      &lt;motion.div
        className="glass-card px-6 py-3 rounded-xl mb-6 text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      &gt;
        &lt;div className="text-sm text-gray-400"&gt;当前选中&lt;/div&gt;
        &lt;div className={`text-3xl font-bold ${selectedSum === gameState.target ? 'text-green-400' : selectedSum &gt; gameState.target ? 'text-red-400' : 'text-white'}`}&gt;
          {selectedSum}
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
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`
          }}
        &gt;
          {gameState.grid.map((row) =&gt;
            row.map((cell) =&gt; renderCell(cell))
          )}
        &lt;/div&gt;
      &lt;/motion.div&gt;

      &lt;div className="flex gap-4"&gt;
        &lt;motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCheckMatch}
          className="px-8 py-3 rounded-xl font-bold text-lg text-white"
          style={{
            background: `linear-gradient(135deg, ${NEON_COLORS.success}, #00aa00)`,
            boxShadow: `0 0 20px ${NEON_COLORS.success}50`
          }}
        &gt;
          消除
        &lt;/motion.button&gt;
      &lt;/div&gt;

      &lt;AnimatePresence&gt;
        {showSuccess &amp;&amp; (
          &lt;motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          &gt;
            &lt;div className="text-6xl font-bold text-green-400" style={{ textShadow: '0 0 30px #27ae60' }}&gt;
              ✓ 完美！
            &lt;/div&gt;
          &lt;/motion.div&gt;
        )}
      &lt;/AnimatePresence&gt;

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
            &lt;div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonBlue }}&gt;
              🎮 游戏结束！
            &lt;/div&gt;
            &lt;div className="text-2xl text-yellow-400 mb-2"&gt;
              最终分数: {gameState.score}
            &lt;/div&gt;
            &lt;div className="text-lg text-gray-400 mb-6"&gt;
              完成关卡: {gameState.level}
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
                  boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
                }}
              &gt;
                再玩一次
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
