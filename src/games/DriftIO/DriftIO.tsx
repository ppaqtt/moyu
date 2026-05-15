import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { DriftIOEngine, DriftGameState } from './engine';

interface DriftIOProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

export default function DriftIO({ onScoreUpdate, onGameOver, onExit }: DriftIOProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine] = useState(() => new DriftIOEngine());
  const [gameState, setGameState] = useState<DriftGameState>(() => engine.getState());
  const [isRunning, setIsRunning] = useState(true);
  const { record, updateScore } = useGameRecord('driftio_highscore');

  const handleGameLoop = useCallback((deltaTime: number) => {
    engine.tick();
    const state = engine.getState();
    setGameState(state);
    onScoreUpdate(state.playerRank);

    if (state.raceFinished && isRunning) {
      setIsRunning(false);
      const finalScore = Math.max(0, 1000 - Math.floor(state.raceTime * 10) + (13 - state.playerRank) * 100);
      updateScore(finalScore);
      onGameOver(finalScore);
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

    const { player, aiCars, particles } = gameState;
    const checkpoints = engine.getCheckpoints();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    checkpoints.forEach((cp, index) => {
      if (index === 0) {
        ctx.moveTo(cp.x, cp.y);
      } else {
        ctx.lineTo(cp.x, cp.y);
      }
    });
    ctx.closePath();
    ctx.stroke();

    checkpoints.forEach((cp, index) => {
      ctx.fillStyle = index === player.checkpoint ? NEON_COLORS.neonGreen : 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), cp.x, cp.y);
    });

    ctx.strokeStyle = NEON_COLORS.neonCyan;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, width, height);

    particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.fill();
    });

    aiCars.forEach(ai => {
      if (ai.isDead) return;

      ai.trail.forEach((pos, index) => {
        const alpha = index / ai.trail.length;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3 * alpha, 0, Math.PI * 2);
        ctx.fillStyle = ai.color + Math.floor(alpha * 128).toString(16).padStart(2, '0');
        ctx.fill();
      });

      ctx.save();
      ctx.translate(ai.x, ai.y);
      ctx.rotate(ai.angle);

      ctx.fillStyle = ai.color;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-10, 8);
      ctx.lineTo(-10, -8);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = ai.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${ai.name} #${ai.rank}`, ai.x, ai.y - 20);
    });

    if (!player.isDead) {
      player.trail.forEach((pos, index) => {
        const alpha = index / player.trail.length;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4 * alpha, 0, Math.PI * 2);
        ctx.fillStyle = player.color + Math.floor(alpha * 128).toString(16).padStart(2, '0');
        ctx.fill();
      });

      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);

      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-12, 10);
      ctx.lineTo(-12, -10);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = player.color;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('P', 0, 3);

      ctx.restore();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${player.name} #${player.rank}`, player.x, player.y - 25);
    }

  }, [gameState, engine]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    engine.setKey(e.key, true);
  }, [engine]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    engine.setKey(e.key, false);
  }, [engine]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setGameState(engine.getState());
    setIsRunning(true);
    onScoreUpdate(0);
  }, [engine, onScoreUpdate]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const { width, height } = engine.getCanvasSize();
  const finalScore = gameState.raceFinished
    ? Math.max(0, 1000 - Math.floor(gameState.raceTime * 10) + (13 - gameState.playerRank) * 100)
    : 0;

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
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>圈数</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>
              {gameState.player.lap + 1}/{engine.getLapCount()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>排名</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>#{gameState.playerRank}</div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>时间</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>
              {formatTime(gameState.raceTime)}
            </div>
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
          className="cursor-crosshair"
          style={{ display: 'block' }}
        />

        {gameState.raceFinished && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(10, 10, 26, 0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-5xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
              {gameState.playerRank === 1 ? '冠军!' : '比赛结束'}
            </div>
            <div className="text-3xl mb-2" style={{ color: NEON_COLORS.gold }}>最终排名: #{gameState.playerRank}</div>
            <div className="text-xl mb-2" style={{ color: NEON_COLORS.neonCyan }}>用时: {formatTime(gameState.raceTime)}</div>
            <div className="text-lg mb-8" style={{ color: NEON_COLORS.neonPurple }}>得分: {finalScore}</div>
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
        <div>WASD / 方向键控制</div>
        <div>上键加速</div>
        <div>左右键转向</div>
        <div>完成3圈比赛</div>
      </div>
    </div>
  );
}
