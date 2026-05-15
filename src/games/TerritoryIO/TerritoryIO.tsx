import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { TerritoryIOEngine, TerritoryGameState } from './engine';

interface TerritoryIOProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

export default function TerritoryIO({ onScoreUpdate, onGameOver, onExit }: TerritoryIOProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine] = useState(() => new TerritoryIOEngine());
  const [gameState, setGameState] = useState<TerritoryGameState>(() => engine.getState());
  const [isRunning, setIsRunning] = useState(true);
  const { record, updateScore } = useGameRecord('territoryio_highscore');

  const handleGameLoop = useCallback((deltaTime: number) => {
    engine.tick();
    const state = engine.getState();
    setGameState(state);
    onScoreUpdate(state.player.territory);

    if (state.gameOver && isRunning) {
      setIsRunning(false);
      updateScore(state.player.territory);
      onGameOver(state.player.territory);
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

    const { player, aiPlayers, grid } = gameState;
    const { width: gridWidth, height: gridHeight, cellSize } = engine.getGridSize();

    for (let x = 0; x < gridWidth; x++) {
      for (let y = 0; y < gridHeight; y++) {
        const cell = grid[x][y];
        const px = x * cellSize;
        const py = y * cellSize;

        if (cell.owner === null) {
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(px, py, cellSize, cellSize);
        } else if (cell.owner === -1) {
          ctx.fillStyle = player.color + '40';
          ctx.fillRect(px, py, cellSize, cellSize);
        } else {
          const ai = aiPlayers.find(a => a.id === cell.owner);
          if (ai) {
            ctx.fillStyle = ai.color + '40';
            ctx.fillRect(px, py, cellSize, cellSize);
          }
        }

        if (cell.isTrail) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(px, py, cellSize, cellSize);
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, cellSize, cellSize);
      }
    }

    aiPlayers.forEach(ai => {
      if (ai.isDead) return;

      ctx.beginPath();
      ctx.arc(ai.x, ai.y, cellSize * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = ai.color;
      ctx.fill();
      ctx.shadowColor = ai.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(ai.name, ai.x, ai.y - cellSize * 0.4);
    });

    ctx.beginPath();
    ctx.arc(player.x, player.y, cellSize * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, player.x, player.y - cellSize * 0.4);

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
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>领地</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{gameState.player.territory}</div>
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
            <div className="text-3xl mb-2" style={{ color: NEON_COLORS.gold }}>最终领地: {gameState.player.territory}</div>
            <div className="text-xl mb-8" style={{ color: NEON_COLORS.neonCyan }}>最终排名: #{gameState.rank}</div>
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
        <div>方向键 / WASD 移动</div>
        <div>出领地画线圈地</div>
        <div>返回领地闭合圈</div>
        <div>踩断别人尾巴消灭对手</div>
      </div>
    </div>
  );
}
