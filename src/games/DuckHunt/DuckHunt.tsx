import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { DuckHuntEngine, DUCK_HUNT_CONSTANTS, Duck } from './engine';

interface DuckHuntProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const RETRO_COLORS = {
  sky: '#87CEEB',
  grass: '#228B22',
  text: '#000000',
  ammo: '#FFD700',
  crosshair: '#FF0000',
};

const DUCK_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d'];

export default function DuckHunt({ onScoreUpdate, onGameOver, onExit }: DuckHuntProps) {
  const [engine] = useState(() => new DuckHuntEngine());
  const [state, setState] = useState(() => engine.getState());
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>();
  const { record, updateScore } = useGameRecord('duckhunt');

  useEffect(() => {
    if (!state.gameStarted || state.isGameOver || state.isPaused) return;

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
  }, [state.gameStarted, state.isGameOver, state.isPaused, engine, onScoreUpdate, onGameOver, updateScore]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!state.gameStarted || state.isGameOver || state.isPaused) return;

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      engine.shoot(x, y);
      setState(engine.getState());
    }
  }, [state.gameStarted, state.isGameOver, state.isPaused, engine]);

  const handleStart = useCallback(() => {
    engine.startGame();
    setState(engine.getState());
    lastUpdateRef.current = Date.now();
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
    onEscape: () => handleTogglePause(),
    onSpace: () => handleTogglePause(),
    enabled: state.gameStarted && !state.isGameOver,
  });

  const renderDuck = (duck: Duck) => {
    const color = DUCK_COLORS[duck.type];
    return (
      <motion.div
        key={duck.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: 'absolute',
          left: duck.position.x,
          top: duck.position.y,
          width: DUCK_HUNT_CONSTANTS.DUCK_SIZE,
          height: DUCK_HUNT_CONSTANTS.DUCK_SIZE,
          transition: 'left 0.05s linear, top 0.05s linear',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '60%',
            backgroundColor: color,
            borderRadius: '50% 50% 40% 40%',
            position: 'relative',
            transform: duck.velocity.x < 0 ? 'scaleX(-1)' : 'scaleX(1)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '25%',
              height: '30%',
              backgroundColor: color,
              borderRadius: '50%',
              top: '10%',
              right: '-10%',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '40%',
                height: '40%',
                backgroundColor: 'white',
                borderRadius: '50%',
                top: '30%',
                right: '20%',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: '50%',
                  height: '50%',
                  backgroundColor: 'black',
                  borderRadius: '50%',
                  top: '25%',
                  right: '25%',
                }}
              />
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              width: '30%',
              height: '15%',
              backgroundColor: '#FFA500',
              top: '40%',
              right: '-20%',
              borderRadius: '0 50% 50% 0',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '40%',
              height: '30%',
              backgroundColor: duck.alive ? color : '#666666',
              top: '30%',
              left: '-15%',
              borderRadius: '50%',
              transform: 'rotate(-30deg)',
              animation: duck.alive ? 'flap 0.1s infinite alternate' : 'none',
            }}
          />
        </div>
      </motion.div>
    );
  };

  const renderCrosshair = () => (
    <div
      style={{
        position: 'absolute',
        left: cursorPos.x - 15,
        top: cursorPos.y - 15,
        width: 30,
        height: 30,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: 2,
          backgroundColor: RETRO_COLORS.crosshair,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 2,
          height: '100%',
          backgroundColor: RETRO_COLORS.crosshair,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 10,
          height: 10,
          border: `2px solid ${RETRO_COLORS.crosshair}`,
          borderRadius: '50%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );

  const renderAmmo = () => (
    <div className="flex gap-2">
      {Array(DUCK_HUNT_CONSTANTS.MAX_BULLETS)
        .fill(null)
        .map((_, i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 24,
              backgroundColor: i < state.ammo ? RETRO_COLORS.ammo : '#333333',
              borderRadius: '2px',
              border: '1px solid #000000',
            }}
          />
        ))}
    </div>
  );

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{ backgroundColor: '#111111', fontFamily: "'Press Start 2P', monospace" }}
    >
      <div className="mb-4 text-center">
        <h1
          className="text-2xl font-bold mb-2"
          style={{
            color: '#ffffff',
            textShadow: '0 0 10px #0000ff',
          }}
        >
          DUCK HUNT
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
            TIME
          </div>
          <div className="text-lg font-bold" style={{ color: '#ffffff' }}>
            {Math.ceil(state.timeLeft / 1000)}s
          </div>
        </div>
      </div>

      <div
        ref={canvasRef}
        className="relative overflow-hidden cursor-none"
        style={{
          width: DUCK_HUNT_CONSTANTS.CANVAS_WIDTH,
          height: DUCK_HUNT_CONSTANTS.CANVAS_HEIGHT,
          background: `linear-gradient(to bottom, ${RETRO_COLORS.sky} 0%, ${RETRO_COLORS.sky} 70%, ${RETRO_COLORS.grass} 70%, ${RETRO_COLORS.grass} 100%)`,
          border: '4px solid #333333',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        <div
          style={{
            position: 'absolute',
            bottom: '30%',
            left: '10%',
            width: 0,
            height: 0,
            borderLeft: '80px solid transparent',
            borderRight: '80px solid transparent',
            borderBottom: '120px solid #228B22',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '30%',
            right: '15%',
            width: 0,
            height: 0,
            borderLeft: '100px solid transparent',
            borderRight: '100px solid transparent',
            borderBottom: '150px solid #228B22',
          }}
        />

        {state.ducks.map((duck) => renderDuck(duck))}

        {state.gameStarted && !state.isGameOver && !state.isPaused && renderCrosshair()}

        {!state.gameStarted && !state.isGameOver && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          >
            <div
              className="text-2xl font-bold mb-6"
              style={{ color: '#ffffff' }}
            >
              DUCK HUNT
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="px-8 py-4 text-sm font-bold"
              style={{
                backgroundColor: '#ff6b6b',
                color: '#ffffff',
                border: '3px solid #ffffff',
                boxShadow: '0 0 15px #ff6b6b',
              }}
            >
              START GAME
            </motion.button>
            <div
              className="mt-6 text-xs"
              style={{ color: '#aaaaaa' }}
            >
              Click to shoot ducks!
            </div>
          </div>
        )}

        {state.isPaused && !state.isGameOver && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
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
              Press ESC or SPACE to continue
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

      <div className="mt-4 flex items-center gap-4">
        <div className="text-center">
          <div className="text-xs mb-1" style={{ color: '#666666' }}>
            AMMO
          </div>
          {renderAmmo()}
          {state.isReloading && (
            <div className="text-xs mt-1" style={{ color: '#ffa500' }}>
              RELOADING...
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="text-xs mb-1" style={{ color: '#666666' }}>
          CONTROLS
        </div>
        <div className="text-xs" style={{ color: '#888888' }}>
          Click to shoot | ESC/SPACE to pause
        </div>
      </div>

      <style jsx>{`
        @keyframes flap {
          0% { transform: rotate(-30deg); }
          100% { transform: rotate(30deg); }
        }
      `}</style>
    </div>
  );
}
