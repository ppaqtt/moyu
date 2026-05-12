import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { SwordIOEngine, SwordGameState } from './engine';

interface SwordIOProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

export default function SwordIO({ onScoreUpdate, onGameOver, onExit }: SwordIOProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine] = useState(() => new SwordIOEngine());
  const [gameState, setGameState] = useState<SwordGameState>(() => engine.getState());
  const [isRunning, setIsRunning] = useState(true);
  const { record, updateScore } = useGameRecord('swordio_highscore');

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

    const { player, aiPlayers, particles } = gameState;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

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

    aiPlayers.forEach(ai => {
      if (ai.isDead) return;

      const swordTipX = ai.x + Math.cos(ai.sword.angle) * ai.sword.length;
      const swordTipY = ai.y + Math.sin(ai.sword.angle) * ai.sword.length;

      ctx.beginPath();
      ctx.moveTo(ai.x, ai.y);
      ctx.lineTo(swordTipX, swordTipY);
      ctx.strokeStyle = ai.color;
      ctx.lineWidth = ai.sword.width;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ai.x, ai.y, ai.radius, 0, Math.PI * 2);
      ctx.fillStyle = ai.color;
      ctx.fill();
      ctx.shadowColor = ai.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      const healthBarWidth = 30;
      const healthBarHeight = 4;
      ctx.fillStyle = '#333';
      ctx.fillRect(ai.x - healthBarWidth / 2, ai.y - ai.radius - 10, healthBarWidth, healthBarHeight);
      ctx.fillStyle = ai.health > 50 ? '#0f0' : ai.health > 25 ? '#ff0' : '#f00';
      ctx.fillRect(ai.x - healthBarWidth / 2, ai.y - ai.radius - 10, healthBarWidth * (ai.health / ai.maxHealth), healthBarHeight);

      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(ai.name, ai.x, ai.y - ai.radius - 15);
    });

    if (!player.isDead) {
      const swordTipX = player.x + Math.cos(player.sword.angle) * player.sword.length;
      const swordTipY = player.y + Math.sin(player.sword.angle) * player.sword.length;

      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(swordTipX, swordTipY);
      ctx.strokeStyle = player.color;
      ctx.lineWidth = player.sword.width;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fillStyle = player.color;
      ctx.fill();
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      const healthBarWidth = 40;
      const healthBarHeight = 6;
      ctx.fillStyle = '#333';
      ctx.fillRect(player.x - healthBarWidth / 2, player.y - player.radius - 12, healthBarWidth, healthBarHeight);
      ctx.fillStyle = player.health > 50 ? '#0f0' : player.health > 25 ? '#ff0' : '#f00';
      ctx.fillRect(player.x - healthBarWidth / 2, player.y - player.radius - 12, healthBarWidth * (player.health / player.maxHealth), healthBarHeight);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, player.x, player.y - player.radius - 18);
    }

  }, [gameState, engine]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    engine.updateMousePos(e.clientX - rect.left, e.clientY - rect.top);
  }, [engine]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    engine.setKey(e.key, true);
  }, [engine]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    engine.setKey(e.key, false);
  }, [engine]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

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
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>击杀</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{gameState.player.kills}</div>
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
            <div className="text-xl mb-2" style={{ color: NEON_COLORS.neonCyan }}>击杀数: {gameState.player.kills}</div>
            <div className="text-lg mb-8" style={{ color: NEON_COLORS.neonPurple }}>最终排名: #{gameState.rank}</div>
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
        <div>WASD / 方向键移动</div>
        <div>鼠标控制刀剑方向</div>
        <div>刀剑击中敌人造成伤害</div>
      </div>
    </div>
  );
}
