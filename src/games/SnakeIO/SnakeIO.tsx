import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { SnakeIOEngine, SnakeGameState } from './engine';

interface SnakeIOProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

export default function SnakeIO({ onScoreUpdate, onGameOver, onExit }: SnakeIOProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine] = useState(() => new SnakeIOEngine());
  const [gameState, setGameState] = useState<SnakeGameState>(() => engine.getState());
  const [isRunning, setIsRunning] = useState(true);
  const { record, updateScore } = useGameRecord('snakeio_highscore');

  const handleGameLoop = useCallback((deltaTime: number) => {
    engine.tick();
    const state = engine.getState();
    setGameState(state);
    onScoreUpdate(state.player.score);

    if (state.gameOver && isRunning) {
      setIsRunning(false);
      updateScore(state.player.score);
      onGameOver(state.player.score);
    }
  }, [engine, onScoreUpdate, onGameOver, updateScore, isRunning]);

  useGameLoop(handleGameLoop, isRunning);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = engine.getCanvasSize();
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    const { camera, player, aiSnakes, foods, particles } = gameState;

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width * 3; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height * 3);
      ctx.stroke();
    }
    for (let y = 0; y <= height * 3; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width * 3, y);
      ctx.stroke();
    }

    ctx.strokeStyle = NEON_COLORS.neonCyan;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, width * 3, height * 3);

    foods.forEach(food => {
      ctx.beginPath();
      ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
      ctx.fillStyle = food.color;
      ctx.fill();
      ctx.shadowColor = food.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    aiSnakes.forEach(ai => {
      if (ai.isDead) return;

      ai.segments.forEach((segment, index) => {
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
        const alpha = 1 - (index / ai.segments.length) * 0.5;
        ctx.fillStyle = ai.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', '');
        ctx.fillStyle = index === 0 ? ai.color : ai.color + '80';
        ctx.fill();

        if (index === 0) {
          ctx.shadowColor = ai.color;
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#fff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(ai.name, segment.x, segment.y - segment.radius - 5);
        }
      });
    });

    player.segments.forEach((segment, index) => {
      ctx.beginPath();
      ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
      ctx.fillStyle = index === 0 ? player.color : player.color + '80';
      ctx.fill();

      if (index === 0) {
        ctx.shadowColor = player.color;
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, segment.x, segment.y - segment.radius - 8);
      }
    });

    particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', '');
      ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();
    });

    ctx.restore();
  }, [gameState, engine]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    engine.updateMousePos(e.clientX - rect.left, e.clientY - rect.top);
  }, [engine]);

  const handleMouseDown = useCallback(() => {
    engine.setBoost(true);
  }, [engine]);

  const handleMouseUp = useCallback(() => {
    engine.setBoost(false);
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setGameState(engine.getState());
    setIsRunning(true);
    onScoreUpdate(0);
  }, [engine, onScoreUpdate]);

  const { width, height } = engine.getCanvasSize();

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[800px] px-4">
        <motion.button
          onClick={onExit}
          className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.8)',
            color: NEON_COLORS.neonCyan,
            boxShadow: `0 0 10px ${NEON_COLORS.neonCyan}40`,
            border: `1px solid ${NEON_COLORS.neonCyan}40`
          }}
          whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${NEON_COLORS.neonCyan}` }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>分数</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{gameState.player.score}</div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>长度</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{gameState.player.segments.length}</div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>排名</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>#{gameState.rank}</div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高记录</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPurple }}>{record.bestScore}</div>
          </div>
        </div>
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: `0 0 40px ${NEON_COLORS.neonCyan}30, inset 0 0 60px rgba(0,0,0,0.5)`,
          border: `2px solid ${NEON_COLORS.neonCyan}40`
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-crosshair"
          style={{ display: 'block' }}
        />

        {gameState.gameOver && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(10, 10, 26, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>游戏结束</div>
            <div className="text-3xl mb-2" style={{ color: NEON_COLORS.gold }}>最终得分: {gameState.player.score}</div>
            <div className="text-xl mb-2" style={{ color: NEON_COLORS.neonCyan }}>最终排名: #{gameState.rank}</div>
            <div className="text-lg mb-8" style={{ color: NEON_COLORS.neonPurple }}>蛇身长度: {gameState.player.segments.length}</div>
            <div className="flex gap-4">
              <motion.button
                onClick={handleRestart}
                className="px-8 py-4 rounded-lg font-bold text-lg"
                style={{
                  backgroundColor: NEON_COLORS.neonCyan,
                  color: '#0a0a1a',
                  boxShadow: `0 0 30px ${NEON_COLORS.neonCyan}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再玩一次
              </motion.button>
              <motion.button
                onClick={onExit}
                className="px-8 py-4 rounded-lg font-bold text-lg"
                style={{
                  backgroundColor: 'rgba(26, 26, 46, 0.8)',
                  color: NEON_COLORS.neonPink,
                  border: `2px solid ${NEON_COLORS.neonPink}`,
                  boxShadow: `0 0 20px ${NEON_COLORS.neonPink}40`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                返回首页
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex gap-8 text-center opacity-70" style={{ color: NEON_COLORS.gold }}>
        <div>鼠标移动控制方向</div>
        <div>按住鼠标左键加速 (消耗长度)</div>
        <div>撞击其他蛇身死亡</div>
      </div>
    </div>
  );
}
