import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameState,
  GameAction,
  createInitialState,
  basketballReducer,
  NEON_COLORS,
  getHighScore,
  saveHighScore,
} from './engine';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

const BasketballShootGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const stateRef = useRef<GameState>(createInitialState(CANVAS_WIDTH, CANVAS_HEIGHT));
  const [renderTick, setRenderTick] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setHighScore(getHighScore());
  }, []);

  const dispatch = useCallback((action: GameAction) => {
    stateRef.current = basketballReducer(stateRef.current, action, CANVAS_WIDTH, CANVAS_HEIGHT);
    setRenderTick((t) => t + 1);
  }, []);

  // Game loop
  useEffect(() => {
    let lastTime = performance.now();

    const gameLoop = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      dispatch({ type: 'UPDATE', deltaTime });

      if (isCharging) {
        dispatch({ type: 'CHARGE_POWER' });
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [dispatch, isCharging]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = stateRef.current;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw court
    ctx.fillStyle = '#d4a574';
    ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);

    // Draw hoop
    const hoopX = CANVAS_WIDTH - 100;
    const hoopY = CANVAS_HEIGHT - 300;

    // Backboard
    ctx.fillStyle = '#fff';
    ctx.fillRect(hoopX - 10, hoopY - 60, 10, 100);

    // Rim
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(hoopX, hoopY, 25, 0, Math.PI, false);
    ctx.stroke();

    // Net
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.moveTo(hoopX - 20 + i * 10, hoopY);
      ctx.lineTo(hoopX - 15 + i * 8, hoopY + 30);
    }
    ctx.stroke();

    // Draw ball
    if (state.ball) {
      const { x, y, radius } = state.ball;
      const gradient = ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius);
      gradient.addColorStop(0, '#ff8c42');
      gradient.addColorStop(1, '#d35400');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Ball lines
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw aim line when dragging
    if (isDragging && state.ball) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(state.ball.x, state.ball.y);
      ctx.lineTo(state.aimEndX, state.aimEndY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw particles
    state.particles.forEach((particle) => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Score: ${state.score}`, 20, 40);
    ctx.fillText(`Best: ${highScore}`, 20, 70);

    // Draw shots left
    ctx.fillText(`Shots: ${state.shotsLeft}`, 20, 100);

    // Draw power bar when charging
    if (isCharging) {
      const barWidth = 200;
      const barHeight = 20;
      const barX = CANVAS_WIDTH / 2 - barWidth / 2;
      const barY = CANVAS_HEIGHT - 50;

      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const powerPercent = state.power / 100;
      const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
      gradient.addColorStop(0, '#00ff00');
      gradient.addColorStop(0.5, '#ffff00');
      gradient.addColorStop(1, '#ff0000');

      ctx.fillStyle = gradient;
      ctx.fillRect(barX, barY, barWidth * powerPercent, barHeight);

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    // Game over screen
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

      ctx.font = '32px Arial';
      ctx.fillText(`Final Score: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

      if (state.score > highScore) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText('New High Score!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
      }

      ctx.textAlign = 'left';
    }
  }, [renderTick, isDragging, highScore]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current.gameOver) {
      dispatch({ type: 'RESET' });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (stateRef.current.ball) {
      const dx = x - stateRef.current.ball.x;
      const dy = y - stateRef.current.ball.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < stateRef.current.ball.radius * 2) {
        setIsDragging(true);
        setIsCharging(true);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    dispatch({ type: 'AIM', x, y });
  };

  const handleMouseUp = () => {
    if (isCharging) {
      dispatch({ type: 'SHOOT' });
      setIsCharging(false);
      setIsDragging(false);

      if (stateRef.current.score > highScore) {
        setHighScore(stateRef.current.score);
        saveHighScore(stateRef.current.score);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="mb-4 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Basketball Shoot</h1>
        <p className="text-gray-300">Drag and release to shoot! Click when game over to restart.</p>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-slate-600 rounded-lg cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      <div className="mt-4 flex gap-4">
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          New Game
        </button>
      </div>
    </div>
  );
};

export default BasketballShootGame;
