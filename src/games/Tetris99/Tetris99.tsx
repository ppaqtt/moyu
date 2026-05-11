import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { Tetris99Engine, TETRIS_99_CONSTANTS, Piece } from './engine';

interface Tetris99Props {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const RETRO_COLORS = {
  background: '#000000',
  grid: '#1a1a1a',
  border: '#333333',
  text: '#ffffff',
  highlight: '#ffcc00',
};

const PIECE_COLORS = [
  '#00ffff',
  '#ffff00',
  '#a000f0',
  '#f0a000',
  '#0000f0',
  '#00f000',
  '#f00000',
];

export default function Tetris99({ onScoreUpdate, onGameOver, onExit }: Tetris99Props) {
  const [engine] = useState(() => new Tetris99Engine());
  const [state, setState] = useState(() => engine.getState());
  const { record, updateScore } = useGameRecord('tetris99');

  const handleTick = useCallback(() => {
    if (!state.isPaused && !state.isGameOver) {
      engine.tick();
      const newState = engine.getState();
      setState(newState);
      onScoreUpdate(newState.score);

      if (newState.isGameOver) {
        updateScore(newState.score);
        onGameOver(newState.score);
      }
    }
  }, [engine, onScoreUpdate, onGameOver, updateScore, state.isPaused, state.isGameOver]);

  useGameLoop({
    callback: handleTick,
    delay: engine.getCurrentSpeed(),
    enabled: !state.isPaused && !state.isGameOver,
  });

  const handleMove = useCallback((direction: 'left' | 'right' | 'down') => {
    engine.move(direction);
    setState(engine.getState());
  }, [engine]);

  const handleRotate = useCallback(() => {
    engine.rotate();
    setState(engine.getState());
  }, [engine]);

  const handleHardDrop = useCallback(() => {
    engine.hardDrop();
    const newState = engine.getState();
    setState(newState);
    onScoreUpdate(newState.score);

    if (newState.isGameOver) {
      updateScore(newState.score);
      onGameOver(newState.score);
    }
  }, [engine, onScoreUpdate, onGameOver, updateScore]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setState(engine.getState());
    onScoreUpdate(0);
  }, [engine, onScoreUpdate]);

  const handleTogglePause = useCallback(() => {
    engine.togglePause();
    setState(engine.getState());
  }, [engine]);

  useKeyboard({
    onArrowLeft: () => handleMove('left'),
    onArrowRight: () => handleMove('right'),
    onArrowDown: () => handleMove('down'),
    onArrowUp: () => handleRotate(),
    onW: () => handleRotate(),
    onA: () => handleMove('left'),
    onS: () => handleMove('down'),
    onD: () => handleMove('right'),
    onSpace: () => handleHardDrop(),
    onEscape: () => handleTogglePause(),
    enabled: !state.isGameOver,
  });

  const renderBoard = () => {
    const displayBoard = state.board.map((row) => [...row]);

    if (state.currentPiece) {
      for (let row = 0; row < state.currentPiece.shape.length; row++) {
        for (let col = 0; col < state.currentPiece.shape[row].length; col++) {
          if (state.currentPiece.shape[row][col]) {
            const boardY = state.currentPosition.y + row;
            const boardX = state.currentPosition.x + col;
            if (
              boardY >= 0 &&
              boardY < TETRIS_99_CONSTANTS.BOARD_HEIGHT &&
              boardX >= 0 &&
              boardX < TETRIS_99_CONSTANTS.BOARD_WIDTH
            ) {
              displayBoard[boardY][boardX] = state.currentPiece.type + 1;
            }
          }
        }
      }
    }

    return displayBoard.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            style={{
              width: TETRIS_99_CONSTANTS.CELL_SIZE,
              height: TETRIS_99_CONSTANTS.CELL_SIZE,
              backgroundColor: cell ? PIECE_COLORS[cell - 1] : RETRO_COLORS.grid,
              border: cell
                ? `2px solid ${getBorderColor(cell - 1)}`
                : '1px solid #111111',
              boxShadow: cell
                ? `inset 0 0 10px rgba(255,255,255,0.3), 0 0 5px ${PIECE_COLORS[cell - 1]}80`
                : 'none',
            }}
          />
        ))}
      </div>
    ));
  };

  const getBorderColor = (type: number) => {
    const colors = [
      '#00aaaa',
      '#aaaa00',
      '#7000a0',
      '#a07000',
      '#0000a0',
      '#00a000',
      '#a00000',
    ];
    return colors[type] || '#333333';
  };

  const renderNextPiece = () => {
    const shape = state.nextPiece.shape;
    const maxRows = Math.max(shape.length, 2);
    const maxCols = Math.max(...shape.map((row) => row.length), 4);
    const cellSize = 20;

    return (
      <div
        className="flex flex-col items-center justify-center p-4"
        style={{
          backgroundColor: '#111111',
          border: `2px solid ${RETRO_COLORS.border}`,
        }}
      >
        {Array(maxRows)
          .fill(null)
          .map((_, rowIndex) => (
            <div key={rowIndex} className="flex">
              {Array(maxCols)
                .fill(null)
                .map((_, colIndex) => {
                  const hasBlock =
                    shape[rowIndex] && shape[rowIndex][colIndex];
                  return (
                    <div
                      key={colIndex}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: hasBlock
                          ? PIECE_COLORS[state.nextPiece.type]
                          : 'transparent',
                        border: hasBlock
                          ? `2px solid ${getBorderColor(state.nextPiece.type)}`
                          : 'none',
                      }}
                    />
                  );
                })}
            </div>
          ))}
      </div>
    );
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen gap-8"
      style={{ backgroundColor: '#111111', fontFamily: "'Press Start 2P', monospace" }}
    >
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1
            className="text-2xl font-bold mb-2"
            style={{
              color: RETRO_COLORS.highlight,
              textShadow: '0 0 10px #ffcc00',
            }}
          >
            TETRIS 99
          </h1>
        </div>

        <div className="text-center">
          <div
            className="text-xs mb-1"
            style={{ color: '#888888' }}
          >
            SCORE
          </div>
          <div
            className="text-xl font-bold"
            style={{ color: RETRO_COLORS.text }}
          >
            {state.score}
          </div>
        </div>

        <div className="text-center">
          <div
            className="text-xs mb-1"
            style={{ color: '#888888' }}
          >
            BEST
          </div>
          <div
            className="text-lg font-bold"
            style={{ color: RETRO_COLORS.text }}
          >
            {record.bestScore}
          </div>
        </div>

        <div className="text-center">
          <div
            className="text-xs mb-1"
            style={{ color: '#888888' }}
          >
            NEXT
          </div>
          {renderNextPiece()}
        </div>

        <div className="flex gap-4 justify-center">
          <div className="text-center">
            <div
              className="text-xs mb-1"
              style={{ color: '#888888' }}
            >
              LEVEL
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: RETRO_COLORS.text }}
            >
              {state.level}
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-xs mb-1"
              style={{ color: '#888888' }}
            >
              LINES
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: RETRO_COLORS.text }}
            >
              {state.lines}
            </div>
          </div>
        </div>
      </div>

      <div
        className="relative"
        style={{
          backgroundColor: RETRO_COLORS.background,
          border: `4px solid ${RETRO_COLORS.border}`,
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        }}
      >
        {renderBoard()}

        {state.isPaused && !state.isGameOver && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          >
            <div
              className="text-xl font-bold mb-4"
              style={{ color: RETRO_COLORS.text }}
            >
              PAUSED
            </div>
            <div
              className="text-xs"
              style={{ color: '#888888' }}
            >
              Press ESC to continue
            </div>
          </div>
        )}

        {state.isGameOver && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          >
            <div
              className="text-2xl font-bold mb-4"
              style={{
                color: '#ff0000',
                textShadow: '0 0 10px #ff0000',
              }}
            >
              GAME OVER
            </div>
            <div
              className="text-lg mb-6"
              style={{ color: RETRO_COLORS.text }}
            >
              FINAL SCORE: {state.score}
            </div>
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRestart}
                className="px-6 py-3 text-xs font-bold"
                style={{
                  backgroundColor: '#004400',
                  color: '#00ff00',
                  border: '2px solid #00ff00',
                }}
              >
                PLAY AGAIN
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onExit}
                className="px-6 py-3 text-xs font-bold"
                style={{
                  backgroundColor: '#333333',
                  color: '#888888',
                  border: '2px solid #555555',
                }}
              >
                EXIT
              </motion.button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div className="text-center">
          <div
            className="text-xs mb-2"
            style={{ color: '#666666' }}
          >
            CONTROLS
          </div>
          <div className="text-xs" style={{ color: '#888888' }}>
            <div className="mb-1">← → Move</div>
            <div className="mb-1">↑ Rotate</div>
            <div className="mb-1">↓ Soft Drop</div>
            <div className="mb-1">SPACE Hard Drop</div>
            <div>ESC Pause</div>
          </div>
        </div>
      </div>
    </div>
  );
}
