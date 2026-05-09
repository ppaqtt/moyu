import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { BallIOEngine, BallGameState } from './engine';

interface BallIOProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

export default function BallIO({ onScoreUpdate, onGameOver, onExit }: BallIOProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine] = useState(() => new BallIOEngine());
  const [gameState, setGameState] = useState<BallGameState>(() => engine.getState());
  const [isRunning, setIsRunning] = useState(true);
  const { record, updateScore } = useGameRecord('ballio_highscore');

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

    const { camera, player, aiBalls, foods, viruses } = gameState;
    const { width: mapWidth, height: mapHeight } = engine.getMapSize();

    const totalMass = player.cells.reduce((sum, cell) => sum + cell.mass, 0);
    const zoom = Math.max(0.3, 1 - (Math.sqrt(totalMass) / 1000));

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-camera.x - width / 2 / zoom + width / 2, -camera.y - height / 2 / zoom + height / 2);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1 / zoom;
    for (let x = 0; x <= mapWidth; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, mapHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= mapHeight; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(mapWidth, y);
      ctx.stroke();
    }

    ctx.strokeStyle = NEON_COLORS.neonCyan;
    ctx.lineWidth = 3 / zoom;
    ctx.strokeRect(0, 0, mapWidth, mapHeight);

    foods.forEach(food => {
      ctx.beginPath();
      ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
      ctx.fillStyle = food.color;
      ctx.fill();
      ctx.shadowColor = food.color;
      ctx.shadowBlur = 5;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    viruses.forEach(virus => {
      ctx.beginPath();
      ctx.arc(virus.x, virus.y, virus.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.fill();
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();

      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(virus.x + Math.cos(angle) * virus.radius * 0.5, virus.y + Math.sin(angle) * virus.radius * 0.5);
        ctx.lineTo(virus.x + Math.cos(angle) * virus.radius * 0.9, virus.y + Math.sin(angle) * virus.radius * 0.9);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
      }
    });

    aiBalls.forEach(ai => {
      ctx.beginPath();
      ctx.arc(ai.x, ai.y, ai.radius, 0, Math.PI * 2);
      ctx.fillStyle = ai.color;
      ctx.fill();
      ctx.shadowColor = ai.color;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.font = `${Math.max(10, ai.radius / 3)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ai.name, ai.x, ai.y);
    });

    player.cells.forEach(cell => {
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
      ctx.fillStyle = player.color;
      ctx.fill();
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(12, cell.radius / 2.5)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.name, cell.x, cell.y);
    });

    ctx.restore();
  }, [gameState, engine]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    engine.updateMousePos(e.clientX - rect.left, e.clientY - rect.top);
  }, [engine]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      engine.split();
    } else if (e.key === 'w' || e.key === 'W') {
      engine.eject();
    }
  }, [engine]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>球数</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{gameState.player.cells.length}</div>
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
            <div className="text-xl mb-2" style={{ color: NEON_COLORS.neonCyan }}>最终排名: #{gameState.rank}</div>
            <div className="text-lg mb-8" style={{ color: NEON_COLORS.neonPurple }}>球体数量: {gameState.player.cells.length}</div>
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
        <div>空格键分裂</div>
        <div>W键吐球</div>
        <div>大球吃小球</div>
      </div>
    </div>
  );
}
