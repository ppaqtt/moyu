import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { SnakeRemakeEngine, Direction, Position, SNAKE_REMAKE_CONSTANTS } from './engine';

interface SnakeRemakeProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const RETRO_COLORS = {
  background: '#000000',
  grid: '#0a0a0a',
  snakeHead: '#00ff00',
  snakeBody: '#00cc00',
  food: '#ff0000',
  border: '#333333',
  text: '#00ff00',
};

export default function SnakeRemake({ onScoreUpdate, onGameOver, onExit }: SnakeRemakeProps) {
  const [engine] = useState(() => new SnakeRemakeEngine());
  const [state, setState] = useState(() => engine.getState());
  const { record, updateScore } = useGameRecord('snakeremake');

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

  const handleDirectionChange = useCallback((dir: Direction) => {
    engine.setDirection(dir);
    setState(engine.getState());
  }, [engine]);

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
    onArrowUp: () => handleDirectionChange('up'),
    onArrowDown: () => handleDirectionChange('down'),
    onArrowLeft: () => handleDirectionChange('left'),
    onArrowRight: () => handleDirectionChange('right'),
    onW: () => handleDirectionChange('up'),
    onS: () => handleDirectionChange('down'),
    onA: () => handleDirectionChange('left'),
    onD: () => handleDirectionChange('right'),
    onSpace: () => handleTogglePause(),
    onEscape: () => handleTogglePause(),
    enabled: !state.isGameOver,
  });

  const renderSnakeSegment = (pos: Position, index: number) => {
    const isHead = index === 0;
    return (
      <motion.div
        key={`${pos.x}-${pos.y}-${index}`}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          position: 'absolute',
          left: pos.x * SNAKE_REMAKE_CONSTANTS.CELL_SIZE + 1,
          top: pos.y * SNAKE_REMAKE_CONSTANTS.CELL_SIZE + 1,
          width: SNAKE_REMAKE_CONSTANTS.CELL_SIZE - 2,
          height: SNAKE_REMAKE_CONSTANTS.CELL_SIZE - 2,
          backgroundColor: isHead ? RETRO_COLORS.snakeHead : RETRO_COLORS.snakeBody,
          border: '2px solid #003300',
          boxShadow: isHead
            ? '0 0 10px #00ff00, inset 0 0 5px rgba(255,255,255,0.3)'
            : 'inset 0 0 3px rgba(255,255,255,0.2)',
        }}
      >
        {isHead && (
          <>
            <div
              style={{
                position: 'absolute',
                width: 6,
                height: 6,
                backgroundColor: '#000000',
                borderRadius: '50%',
                top: 4,
                left: 4,
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 6,
                height: 6,
                backgroundColor: '#000000',
                borderRadius: '50%',
                top: 4,
                right: 4,
              }}
            />
          </>
        )}
      </motion.div>
    );
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{ backgroundColor: '#111111', fontFamily: "'Press Start 2P', monospace" }}
    >
      <div className="mb-8 text-center">
        <h1
          className="text-3xl font-bold mb-4"
          style={{
            color: RETRO_COLORS.text,
            textShadow: '0 0 10px #00ff00',
            letterSpacing: '4px',
          }}
        >
          SNAKE REMAKE
        </h1>
        <div className="flex gap-8">
          <div className="text-center">
            <div
              className="text-sm mb-1"
              style={{ color: '#888888' }}
            >
              SCORE
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: RETRO_COLORS.text }}
            >
              {state.score}
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-sm mb-1"
              style={{ color: '#888888' }}
            >
              LEVEL
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: RETRO_COLORS.text }}
            >
              {state.level}
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-sm mb-1"
              style={{ color: '#888888' }}
            >
              BEST
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: RETRO_COLORS.text }}
            >
              {record.bestScore}
            </div>
          </div>
        </div>
      </div>

      <div
        className="relative"
        style={{
          width: SNAKE_REMAKE_CONSTANTS.CANVAS_SIZE,
          height: SNAKE_REMAKE_CONSTANTS.CANVAS_SIZE,
          backgroundColor: RETRO_COLORS.background,
          border: `4px solid ${RETRO_COLORS.border}`,
          boxShadow: '0 0 20px rgba(0,255,0,0.3), inset 0 0 50px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${RETRO_COLORS.grid} 1px, transparent 1px),
              linear-gradient(to bottom, ${RETRO_COLORS.grid} 1px, transparent 1px)
            `,
            backgroundSize: `${SNAKE_REMAKE_CONSTANTS.CELL_SIZE}px ${SNAKE_REMAKE_CONSTANTS.CELL_SIZE}px`,
          }}
        />

        {state.snake.map((pos, index) => renderSnakeSegment(pos, index))}

        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{
            position: 'absolute',
            left: state.food.x * SNAKE_REMAKE_CONSTANTS.CELL_SIZE + 2,
            top: state.food.y * SNAKE_REMAKE_CONSTANTS.CELL_SIZE + 2,
            width: SNAKE_REMAKE_CONSTANTS.CELL_SIZE - 4,
            height: SNAKE_REMAKE_CONSTANTS.CELL_SIZE - 4,
            backgroundColor: RETRO_COLORS.food,
            borderRadius: '50%',
            boxShadow: '0 0 10px #ff0000',
          }}
        />

        {state.isPaused && !state.isGameOver && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          >
            <div
              className="text-2xl font-bold mb-4"
              style={{ color: RETRO_COLORS.text }}
            >
              PAUSED
            </div>
            <div
              className="text-sm"
              style={{ color: '#888888' }}
            >
              Press SPACE to continue
            </div>
          </div>
        )}

        {state.isGameOver && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          >
            <div
              className="text-3xl font-bold mb-4"
              style={{
                color: '#ff0000',
                textShadow: '0 0 10px #ff0000',
              }}
            >
              GAME OVER
            </div>
            <div
              className="text-xl mb-6"
              style={{ color: RETRO_COLORS.text }}
            >
              FINAL SCORE: {state.score}
            </div>
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRestart}
                className="px-6 py-3 text-sm font-bold"
                style={{
                  backgroundColor: '#004400',
                  color: RETRO_COLORS.text,
                  border: '2px solid #00ff00',
                  boxShadow: '0 0 10px rgba(0,255,0,0.5)',
                }}
              >
                PLAY AGAIN
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onExit}
                className="px-6 py-3 text-sm font-bold"
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

      <div className="mt-8 text-center">
        <div
          className="text-sm mb-2"
          style={{ color: '#666666' }}
        >
          CONTROLS
        </div>
        <div
          className="text-xs"
          style={{ color: '#888888' }}
        >
          ARROW KEYS or WASD to move | SPACE to pause
        </div>
      </div>
    </div>
  );
}
