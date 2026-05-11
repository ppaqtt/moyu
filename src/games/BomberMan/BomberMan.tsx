import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { BomberManEngine, BOMBERMAN_CONSTANTS, TileType, Bomb, Explosion } from './engine';

interface BomberManProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const RETRO_COLORS = {
  background: '#111111',
  floor: '#4a7c59',
  wall: '#8b4513',
  brick: '#cd853f',
  player: '#ffffff',
  bomb: '#000000',
  explosion: '#ff4500',
  powerup: '#ffd700',
};

export default function BomberMan({ onScoreUpdate, onGameOver, onExit }: BomberManProps) {
  const [engine] = useState(() => new BomberManEngine());
  const [state, setState] = useState(() => engine.getState());
  const lastUpdateRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>();
  const { record, updateScore } = useGameRecord('bomberman');

  useEffect(() => {
    if (state.isGameOver || state.isPaused) return;

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      engine.tick(deltaTime);
      const newState = engine.getState();
      setState(newState);
      onScoreUpdate(newState.score);

      if (newState.isGameOver) {
        updateScore(newState.score);
        onGameOver(newState.score);
      } else {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isGameOver, state.isPaused, engine, onScoreUpdate, onGameOver, updateScore]);

  const handleMoveUp = useCallback(() => engine.movePlayer(0, -1), [engine]);
  const handleMoveDown = useCallback(() => engine.movePlayer(0, 1), [engine]);
  const handleMoveLeft = useCallback(() => engine.movePlayer(-1, 0), [engine]);
  const handleMoveRight = useCallback(() => engine.movePlayer(1, 0), [engine]);
  const handlePlaceBomb = useCallback(() => engine.placeBomb(), [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setState(engine.getState());
    onScoreUpdate(0);
    lastUpdateRef.current = Date.now();
  }, [engine, onScoreUpdate]);

  const handleTogglePause = useCallback(() => {
    engine.togglePause();
    setState(engine.getState());
  }, [engine]);

  useKeyboard({
    onArrowUp: handleMoveUp,
    onArrowDown: handleMoveDown,
    onArrowLeft: handleMoveLeft,
    onArrowRight: handleMoveRight,
    onW: handleMoveUp,
    onS: handleMoveDown,
    onA: handleMoveLeft,
    onD: handleMoveRight,
    onSpace: handlePlaceBomb,
    onEscape: handleTogglePause,
    enabled: !state.isGameOver,
  });

  const renderGrid = () => {
    return (
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${BOMBERMAN_CONSTANTS.GRID_SIZE}, ${BOMBERMAN_CONSTANTS.CELL_SIZE}px)`,
        }}
      >
        {state.grid.map((row, y) =>
          row.map((tile, x) => (
            <div
              key={`${x}-${y}`}
              style={{
                width: BOMBERMAN_CONSTANTS.CELL_SIZE,
                height: BOMBERMAN_CONSTANTS.CELL_SIZE,
                backgroundColor: tile === TileType.WALL
                  ? RETRO_COLORS.wall
                  : tile === TileType.BRICK
                  ? RETRO_COLORS.brick
                  : tile === TileType.POWERUP
                  ? RETRO_COLORS.powerup
                  : RETRO_COLORS.floor,
                border: '1px solid rgba(0,0,0,0.3)',
                boxSizing: 'border-box',
              }}
            >
              {tile === TileType.WALL && (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: 'repeating-linear-gradient(45deg, #8b4513, #8b4513 5px, #a0522d 5px, #a0522d 10px)',
                  }}
                />
              )}
              {tile === TileType.POWERUP && (
                <div
                  className="flex items-center justify-center h-full"
                >
                  <div
                    style={{
                      width: '60%',
                      height: '60%',
                      backgroundColor: '#ffd700',
                      borderRadius: '50%',
                      boxShadow: '0 0 10px #ffd700',
                      animation: 'pulse 1s infinite',
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  const renderBombs = () => {
    return state.bombs.map((bomb) => (
      <motion.div
        key={bomb.id}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        style={{
          position: 'absolute',
          left: bomb.position.x * BOMBERMAN_CONSTANTS.CELL_SIZE + 8,
          top: bomb.position.y * BOMBERMAN_CONSTANTS.CELL_SIZE + 8,
          width: BOMBERMAN_CONSTANTS.CELL_SIZE - 16,
          height: BOMBERMAN_CONSTANTS.CELL_SIZE - 16,
          backgroundColor: RETRO_COLORS.bomb,
          borderRadius: '50%',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '20%',
            height: '30%',
            backgroundColor: '#654321',
            top: '-15%',
            left: '40%',
            borderRadius: '2px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '15%',
            height: '15%',
            backgroundColor: '#ff4500',
            top: '-20%',
            left: '42.5%',
            borderRadius: '50%',
            animation: 'spark 0.2s infinite alternate',
          }}
        />
      </motion.div>
    ));
  };

  const renderExplosions = () => {
    const allPositions = new Set<string>();
    state.explosions.forEach((explosion) => {
      explosion.positions.forEach((pos) => {
        allPositions.add(`${pos.x},${pos.y}`);
      });
    });

    return Array.from(allPositions).map((key, index) => {
      const [x, y] = key.split(',').map(Number);
      return (
        <motion.div
          key={`explosion-${index}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          style={{
            position: 'absolute',
            left: x * BOMBERMAN_CONSTANTS.CELL_SIZE,
            top: y * BOMBERMAN_CONSTANTS.CELL_SIZE,
            width: BOMBERMAN_CONSTANTS.CELL_SIZE,
            height: BOMBERMAN_CONSTANTS.CELL_SIZE,
            backgroundColor: RETRO_COLORS.explosion,
            zIndex: 15,
            animation: 'explosion-flash 0.1s infinite alternate',
          }}
        />
      );
    });
  };

  const renderPlayer = () => {
    return (
      <motion.div
        animate={{
          x: state.player.x * BOMBERMAN_CONSTANTS.CELL_SIZE,
          y: state.player.y * BOMBERMAN_CONSTANTS.CELL_SIZE,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute',
          width: BOMBERMAN_CONSTANTS.CELL_SIZE - 8,
          height: BOMBERMAN_CONSTANTS.CELL_SIZE - 8,
          margin: 4,
          zIndex: 20,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: RETRO_COLORS.player,
            borderRadius: '20%',
            border: '2px solid #333333',
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '60%',
              height: '40%',
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              top: '10%',
              left: '20%',
              border: '1px solid #333333',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '25%',
                height: '35%',
                backgroundColor: '#000000',
                borderRadius: '50%',
                top: '30%',
                left: '20%',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '25%',
                height: '35%',
                backgroundColor: '#000000',
                borderRadius: '50%',
                top: '30%',
                right: '20%',
              }}
            />
          </div>
        </div>
      </motion.div>
    );
  };

  const isWin = state.isGameOver && state.lives > 0;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{ backgroundColor: RETRO_COLORS.background, fontFamily: "'Press Start 2P', monospace" }}
    >
      <div className="mb-4 text-center">
        <h1
          className="text-2xl font-bold mb-2"
          style={{
            color: '#ffffff',
            textShadow: '0 0 10px #ff0000',
          }}
        >
          BOMBERMAN
        </h1>
      </div>

      <div className="mb-4 flex gap-8">
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: '#888888' }}>
            SCORE
          </div>
          <div className="text-xl font-bold" style={{ color: '#ffffff' }}>
            {state.score}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: '#888888' }}>
            BEST
          </div>
          <div className="text-lg font-bold" style={{ color: '#ffffff' }}>
            {record.bestScore}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: '#888888' }}>
            LIVES
          </div>
          <div className="text-lg font-bold" style={{ color: '#ff0000' }}>
            {state.lives}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: '#888888' }}>
            BOMBS
          </div>
          <div className="text-lg font-bold" style={{ color: '#ffd700' }}>
            {state.maxBombs}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: '#888888' }}>
            RANGE
          </div>
          <div className="text-lg font-bold" style={{ color: '#ff4500' }}>
            {state.bombRange}
          </div>
        </div>
      </div>

      <div
        className="relative"
        style={{
          backgroundColor: RETRO_COLORS.floor,
          border: '4px solid #333333',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        }}
      >
        {renderGrid()}
        {renderBombs()}
        {renderExplosions()}
        {renderPlayer()}

        {state.isPaused && !state.isGameOver && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100 }}
          >
            <div
              className="text-xl font-bold mb-4"
              style={{ color: '#ffffff' }}
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
            style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 100 }}
          >
            <div
              className="text-2xl font-bold mb-4"
              style={{
                color: isWin ? '#00ff00' : '#ff0000',
                textShadow: `0 0 10px ${isWin ? '#00ff00' : '#ff0000'}`,
              }}
            >
              {isWin ? 'YOU WIN!' : 'GAME OVER'}
            </div>
            <div
              className="text-lg mb-6"
              style={{ color: '#ffffff' }}
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

      <div className="mt-4 text-center">
        <div className="text-xs mb-1" style={{ color: '#666666' }}>
          CONTROLS
        </div>
        <div className="text-xs" style={{ color: '#888888' }}>
          Arrow Keys/WASD to move | SPACE to place bomb | ESC to pause
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes spark {
          0% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes explosion-flash {
          0% { background-color: #ff4500; }
          100% { background-color: #ffff00; }
        }
      `}</style>
    </div>
  );
}
