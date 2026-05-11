
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SudokuVariantsEngine, SudokuCell, SudokuVariant } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const BOARD_SIZE = 9;
const CELL_SIZE = 48;

const REGION_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#96ceb4',
  '#ffeaa7',
  '#dfe6e9',
  '#fd79a8',
  '#a29bfe',
  '#74b9ff'
];

interface SudokuVariantsProps {
  onExit?: () =&gt; void;
}

export default function SudokuVariants({ onExit }: SudokuVariantsProps) {
  const [engine] = useState(() =&gt; new SudokuVariantsEngine('standard', 'easy'));
  const [gameState, setGameState] = useState(() =&gt; engine.getState());
  const [showMenu, setShowMenu] = useState(true);

  const updateState = useCallback(() =&gt; {
    setGameState(engine.getState());
  }, [engine]);

  const handleCellClick = useCallback((row: number, col: number) =&gt; {
    engine.selectCell(row, col);
    updateState();
  }, [engine, updateState]);

  const handleNumberClick = useCallback((num: number) =&gt; {
    engine.enterNumber(num);
    updateState();
  }, [engine, updateState]);

  const handleHint = useCallback(() =&gt; {
    engine.useHint();
    updateState();
  }, [engine, updateState]);

  const handleReset = useCallback(() =&gt; {
    engine.reset();
    updateState();
  }, [engine, updateState]);

  const handleVariantChange = useCallback((variant: SudokuVariant) =&gt; {
    engine.setVariant(variant);
    updateState();
  }, [engine, updateState]);

  const handleDifficultyChange = useCallback((difficulty: 'easy' | 'medium' | 'hard') =&gt; {
    engine.setDifficulty(difficulty);
    updateState();
  }, [engine, updateState]);

  const startGame = useCallback(() =&gt; {
    setShowMenu(false);
    engine.init();
    updateState();
  }, [engine, updateState]);

  const getRegionColor = (region: number, isSelected: boolean) =&gt; {
    if (isSelected) return `${NEON_COLORS.neonPink}60`;
    return `${REGION_COLORS[region]}15`;
  };

  const isOnDiagonal = (row: number, col: number) =&gt; {
    return row === col || row + col === BOARD_SIZE - 1;
  };

  const renderCell = (cell: SudokuCell, row: number, col: number) =&gt; {
    const isSelected = cell.isSelected;
    const isHighlighted = gameState.selectedCell &amp;&amp; (
      gameState.selectedCell.row === row ||
      gameState.selectedCell.col === col ||
      (gameState.variant === 'jigsaw' &amp;&amp; cell.region === gameState.board[gameState.selectedCell.row][gameState.selectedCell.col].region) ||
      (gameState.variant !== 'jigsaw' &amp;&amp; 
        Math.floor(gameState.selectedCell.row / 3) === Math.floor(row / 3) &amp;&amp;
        Math.floor(gameState.selectedCell.col / 3) === Math.floor(col / 3))
    );
    const sameValue = gameState.selectedCell &amp;&amp; 
      gameState.board[gameState.selectedCell.row][gameState.selectedCell.col].value === cell.value &amp;&amp; 
      cell.value !== 0;

    return (
      &lt;motion.div
        key={`${row}-${col}`}
        className="cursor-pointer select-none flex items-center justify-center font-bold transition-all"
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          backgroundColor: cell.isError 
            ? '#e74c3c40' 
            : isSelected 
              ? `${NEON_COLORS.neonPink}60` 
              : isHighlighted 
                ? `${NEON_COLORS.neonBlue}20` 
                : sameValue 
                  ? `${NEON_COLORS.neonPink}30` 
                  : gameState.variant === 'jigsaw' 
                    ? getRegionColor(cell.region, isSelected)
                    : '#2c3e50',
          color: cell.isGiven ? '#ecf0f1' : cell.isError ? '#e74c3c' : NEON_COLORS.neonBlue,
          fontSize: '1.3rem',
          border: isSelected 
            ? `2px solid ${NEON_COLORS.neonPink}` 
            : gameState.variant === 'diagonal' &amp;&amp; isOnDiagonal(row, col)
              ? `1px solid ${NEON_COLORS.gold}`
              : '1px solid #34495e',
          gridColumn: col + 1,
          gridRow: row + 1,
          borderRadius: '2px'
        }}
        whileHover={{ backgroundColor: `${NEON_COLORS.neonPink}30` }}
        onClick={() =&gt; handleCellClick(row, col)}
      &gt;
        {cell.value !== 0 ? cell.value : ''}
      &lt;/motion.div&gt;
    );
  };

  if (showMenu) {
    return (
      &lt;div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}&gt;
        &lt;motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-2xl"
        &gt;
          &lt;h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent"&gt;
            🧩 数独变种
          &lt;/h1&gt;
          &lt;p className="text-gray-400 mb-8"&gt;Sudoku Variants&lt;/p&gt;

          &lt;div className="glass-card rounded-2xl p-6 mb-6"&gt;
            &lt;h3 className="text-lg font-bold text-cyan-400 mb-4"&gt;选择数独类型&lt;/h3&gt;
            &lt;div className="grid grid-cols-3 gap-4 mb-6"&gt;
              {[
                { variant: 'standard' as SudokuVariant, label: '标准数独', desc: '经典玩法' },
                { variant: 'diagonal' as SudokuVariant, label: '对角线', desc: '两条对角线也需唯一' },
                { variant: 'jigsaw' as SudokuVariant, label: '锯齿数独', desc: '不规则宫格' }
              ].map(({ variant, label, desc }) =&gt; (
                &lt;motion.button
                  key={variant}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =&gt; handleVariantChange(variant)}
                  className={`px-4 py-4 rounded-xl font-bold transition-all ${
                    gameState.variant === variant ? 'text-white' : 'text-gray-400 bg-gray-800'
                  }`}
                  style={{
                    background: gameState.variant === variant 
                      ? `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`
                      : undefined,
                    boxShadow: gameState.variant === variant 
                      ? `0 0 20px ${NEON_COLORS.primary}50`
                      : undefined,
                  }}
                &gt;
                  &lt;div&gt;{label}&lt;/div&gt;
                  &lt;div className="text-xs opacity-75 mt-1"&gt;{desc}&lt;/div&gt;
                &lt;/motion.button&gt;
              ))}
            &lt;/div&gt;

            &lt;h3 className="text-lg font-bold text-pink-400 mb-4"&gt;选择难度&lt;/h3&gt;
            &lt;div className="flex gap-4 justify-center mb-6"&gt;
              {[
                { difficulty: 'easy' as const, label: '简单' },
                { difficulty: 'medium' as const, label: '中等' },
                { difficulty: 'hard' as const, label: '困难' }
              ].map(({ difficulty, label }) =&gt; (
                &lt;motion.button
                  key={difficulty}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =&gt; handleDifficultyChange(difficulty)}
                  className={`px-6 py-2 rounded-lg font-bold transition-all ${
                    gameState.difficulty === difficulty ? 'text-white' : 'text-gray-400 bg-gray-800'
                  }`}
                  style={{
                    background: gameState.difficulty === difficulty 
                      ? `linear-gradient(135deg, ${NEON_COLORS.neonPink}, #ff6b9d)`
                      : undefined,
                    boxShadow: gameState.difficulty === difficulty 
                      ? `0 0 15px ${NEON_COLORS.neonPink}50`
                      : undefined,
                  }}
                &gt;
                  {label}
                &lt;/motion.button&gt;
              ))}
            &lt;/div&gt;
          &lt;/div&gt;

          &lt;motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
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
    &lt;div className="flex flex-col items-center gap-4 min-h-screen py-8" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}&gt;
      &lt;div className="flex items-center justify-between w-full max-w-xl px-4"&gt;
        &lt;motion.button
          onClick={() =&gt; setShowMenu(true)}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: NEON_COLORS.darkPurple,
            color: NEON_COLORS.neonBlue,
            boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        &gt;
          返回菜单
        &lt;/motion.button&gt;

        &lt;div className="text-center"&gt;
          &lt;div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}&gt;
            {gameState.variant === 'standard' ? '标准数独' : 
             gameState.variant === 'diagonal' ? '对角线数独' : '锯齿数独'}
          &lt;/div&gt;
          &lt;div className="text-sm text-gray-400"&gt;
            {gameState.difficulty === 'easy' ? '简单' : 
             gameState.difficulty === 'medium' ? '中等' : '困难'}
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;div className="flex items-center gap-6"&gt;
        &lt;div className="flex items-center gap-2"&gt;
          &lt;span className="text-gray-400"&gt;错误:&lt;/span&gt;
          &lt;span className="font-bold" style={{ color: gameState.mistakes &gt;= 3 ? '#e74c3c' : NEON_COLORS.neonPink }}&gt;
            {gameState.mistakes}/3
          &lt;/span&gt;
        &lt;/div&gt;
        &lt;div className="flex items-center gap-2"&gt;
          &lt;span className="text-gray-400"&gt;提示:&lt;/span&gt;
          &lt;span className="font-bold" style={{ color: NEON_COLORS.neonBlue }}&gt;{gameState.hints}&lt;/span&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;div className="flex gap-4"&gt;
        &lt;motion.button
          onClick={handleHint}
          disabled={gameState.hints &lt;= 0}
          className="px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50"
          style={{
            backgroundColor: NEON_COLORS.neonBlue,
            color: NEON_COLORS.white,
            boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        &gt;
          提示
        &lt;/motion.button&gt;

        &lt;motion.button
          onClick={handleReset}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: NEON_COLORS.neonPink,
            color: NEON_COLORS.white,
            boxShadow: `0 0 10px ${NEON_COLORS.neonPink}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        &gt;
          重新开始
        &lt;/motion.button&gt;
      &lt;/div&gt;

      &lt;div
        className="rounded-2xl p-3"
        style={{
          backgroundColor: NEON_COLORS.darkPurple,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`
        }}
      &gt;
        &lt;div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
            border: `3px solid ${NEON_COLORS.neonPink}`,
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        &gt;
          {gameState.board.map((row, r) =&gt;
            row.map((cell, c) =&gt; renderCell(cell, r, c))
          )}
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;div className="flex flex-col items-center gap-3"&gt;
        &lt;div className="flex gap-2"&gt;
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num =&gt; (
            &lt;motion.button
              key={num}
              onClick={() =&gt; handleNumberClick(num)}
              className="w-12 h-12 rounded-lg font-bold text-xl"
              style={{
                backgroundColor: NEON_COLORS.darkPurple,
                color: NEON_COLORS.neonBlue,
                border: `2px solid ${NEON_COLORS.neonBlue}`
              }}
              whileHover={{ scale: 1.1, backgroundColor: `${NEON_COLORS.neonPink}40` }}
              whileTap={{ scale: 0.95 }}
            &gt;
              {num}
            &lt;/motion.button&gt;
          ))}
        &lt;/div&gt;
        &lt;motion.button
          onClick={() =&gt; handleNumberClick(0)}
          className="px-8 py-2 rounded-lg font-bold text-sm"
          style={{
            backgroundColor: NEON_COLORS.darkPurple,
            color: NEON_COLORS.neonPink,
            border: `2px solid ${NEON_COLORS.neonPink}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        &gt;
          清除
        &lt;/motion.button&gt;
      &lt;/div&gt;

      {gameState.isComplete &amp;&amp; (
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
              🎉 恭喜完成！
            &lt;/div&gt;
            &lt;div className="text-gray-400 mb-6"&gt;
              {gameState.mistakes &lt; 3 ? '完美！' : '继续加油！'}
            &lt;/div&gt;
            &lt;div className="flex gap-4 justify-center"&gt;
              &lt;motion.button
                onClick={handleReset}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonPink,
                  color: NEON_COLORS.white,
                  boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              &gt;
                再玩一次
              &lt;/motion.button&gt;
              &lt;motion.button
                onClick={() =&gt; setShowMenu(true)}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: 'transparent',
                  color: NEON_COLORS.neonBlue,
                  border: `2px solid ${NEON_COLORS.neonBlue}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              &gt;
                返回菜单
              &lt;/motion.button&gt;
            &lt;/div&gt;
          &lt;/motion.div&gt;
        &lt;/motion.div&gt;
      )}
    &lt;/div&gt;
  );
}
