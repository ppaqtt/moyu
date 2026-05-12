import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { COLOR_MATCH_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { ColorMatchEngine, ColorTile, TargetColor, ScorePopup } from './engine';

const CANVAS_WIDTH = COLOR_MATCH_CONSTANTS.CANVAS_WIDTH;
const CANVAS_HEIGHT = COLOR_MATCH_CONSTANTS.CANVAS_HEIGHT;

export default function ColorMatch() {
  const navigate = useNavigate();
  const [engine] = useState(() => new ColorMatchEngine());
  const [state, setState] = useState(() => engine.getState());
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [highScore, setHighScore] = useLocalStorage(STORAGE_KEYS.COLOR_MATCH, 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleScoreUpdate = useCallback((newScore: number) => {
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
  }, []);

  const drawTile = useCallback((ctx: CanvasRenderingContext2D, tile: ColorTile, isHighlighted: boolean) => {
    const radius = 12;

    if (isHighlighted) {
      ctx.shadowColor = tile.color;
      ctx.shadowBlur = 20;
    }

    ctx.beginPath();
    ctx.roundRect(tile.x, tile.y, tile.width, tile.height, radius);

    const gradient = ctx.createLinearGradient(
      tile.x, tile.y,
      tile.x, tile.y + tile.height
    );
    gradient.addColorStop(0, tile.color);
    gradient.addColorStop(1, shadeColor(tile.color, -30));

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = isHighlighted ? '#FFFFFF' : shadeColor(tile.color, -50);
    ctx.lineWidth = isHighlighted ? 3 : 2;
    ctx.stroke();

    ctx.shadowBlur = 0;

    const innerPadding = 8;
    ctx.beginPath();
    ctx.roundRect(
      tile.x + innerPadding,
      tile.y + innerPadding,
      tile.width - innerPadding * 2,
      tile.height - innerPadding * 2,
      radius - 4
    );
    ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
    ctx.fill();
  }, []);

  const drawTargetColors = useCallback((ctx: CanvasRenderingContext2D, targets: TargetColor[]) => {
    const startX = CANVAS_WIDTH / 2 - (targets.length * 100) / 2;
    const y = 50;

    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('找到颜色:', CANVAS_WIDTH / 2, 30);

    targets.forEach((target, index) => {
      const x = startX + index * 100 + 50;

      ctx.beginPath();
      ctx.roundRect(x - 30, y - 20, 60, 60, 8);

      const gradient = ctx.createLinearGradient(x - 30, y - 20, x - 30, y + 40);
      gradient.addColorStop(0, target.color);
      gradient.addColorStop(1, shadeColor(target.color, -30));

      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(`x${target.count}`, x, y + 60);
      ctx.shadowBlur = 0;
    });
  }, []);

  const drawScorePopup = useCallback((ctx: CanvasRenderingContext2D, popup: ScorePopup) => {
    const elapsed = Date.now() - popup.time;
    const progress = elapsed / 1000;

    if (progress < 1) {
      const alpha = 1 - progress;
      const yOffset = progress * 50;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${popup.isCombo ? 28 : 24}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (popup.score > 0) {
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
      } else {
        ctx.fillStyle = '#FF4444';
        ctx.shadowColor = '#FF4444';
      }
      ctx.shadowBlur = 15;

      ctx.fillText(
        popup.score > 0 ? `+${popup.score}` : `${popup.score}`,
        popup.x,
        popup.y - yOffset
      );

      if (popup.isCombo && popup.score > 0) {
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#FF6B9D';
        ctx.shadowColor = '#FF6B9D';
        ctx.fillText('COMBO!', popup.x, popup.y - yOffset - 30);
      }

      ctx.restore();
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const bgGradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(0.5, '#16213e');
    bgGradient.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let i = 0; i < 50; i++) {
      const x = (i * 137) % CANVAS_WIDTH;
      const y = (i * 89) % CANVAS_HEIGHT;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
    }

    drawTargetColors(ctx, state.targetColors);

    state.tiles.forEach(tile => {
      const isTarget = state.targetColors.some(t => t.color === tile.color);
      drawTile(ctx, tile, isTarget);
    });

    state.scorePopups.forEach(popup => {
      drawScorePopup(ctx, popup);
    });

    if (gameStatus === 'idle') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FF6B9D';
      ctx.shadowColor = '#FF6B9D';
      ctx.shadowBlur = 20;
      ctx.fillText('🎨 颜色匹配 🎨', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

      ctx.font = '20px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.fillText('快速点击匹配目标颜色', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
      ctx.fillText('连击加成: 3次连击 = 1.5倍分数', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

      ctx.font = '24px Arial';
      ctx.fillStyle = '#00D2FF';
      ctx.shadowColor = '#00D2FF';
      ctx.fillText('点击开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    }

    if (gameStatus === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FF6B6B';
      ctx.shadowColor = '#FF6B6B';
      ctx.shadowBlur = 20;
      ctx.fillText('⏰ 时间到! ⏰', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.fillText(`最终得分: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

      if (state.score >= highScore && state.score > 0) {
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#00FF88';
        ctx.shadowColor = '#00FF88';
        ctx.fillText('🎉 新纪录! 🎉', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
      }

      ctx.font = '20px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 0;
      ctx.fillText(`匹配次数: ${state.matchCount}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 85);
    }
  }, [state, gameStatus, highScore, drawTile, drawTargetColors, drawScorePopup]);

  useEffect(() => {
    if (gameStatus !== 'playing') {
      render();
      return;
    }

    const interval = setInterval(() => {
      engine.tick();
      setState({ ...engine.getState() });

      if (engine.isGameOver()) {
        setGameStatus('gameover');
        if (state.score > highScore) {
          setHighScore(state.score);
        }
      }
    }, 16);

    const animationId = requestAnimationFrame(function animate() {
      render();
      if (gameStatus === 'playing') {
        requestAnimationFrame(animate);
      }
    });

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationId);
    };
  }, [gameStatus, engine, render, state.score, highScore, setHighScore]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (gameStatus === 'idle') {
      setGameStatus('playing');
      return;
    }

    if (gameStatus === 'playing') {
      engine.handleClick(x, y);
      setState({ ...engine.getState() });
    }
  }, [gameStatus, engine]);

  const handleStart = useCallback(() => {
    engine.reset();
    setState({ ...engine.getState() });
    setGameStatus('playing');
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setState({ ...engine.getState() });
    setGameStatus('playing');
  }, [engine]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div
      className="flex flex-col items-center gap-4 p-4 rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        minHeight: '100vh'
      }}
    >
      <div className="flex items-center justify-between w-full max-w-[600px] px-4 pt-4">
        <motion.button
          onClick={handleBack}
          className="px-4 py-2 rounded-lg font-bold text-sm transition-all"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.8)',
            color: '#00D2FF',
            boxShadow: '0 0 10px rgba(0, 210, 255, 0.3)',
            border: '1px solid rgba(0, 210, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回主页
        </motion.button>

        <div className="flex items-center gap-6">
          <motion.div
            className="px-4 py-2 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-xs opacity-70" style={{ color: '#FFD700' }}>最高分</div>
            <div className="text-xl font-bold" style={{ color: '#FFD700' }}>{highScore}</div>
          </motion.div>

          <motion.div
            className="px-4 py-2 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 107, 157, 0.3)'
            }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-xs opacity-70" style={{ color: '#FF6B9D' }}>当前得分</div>
            <div className="text-xl font-bold" style={{ color: '#FF6B9D' }}>{state.score}</div>
          </motion.div>

          <motion.div
            className="px-4 py-2 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 210, 255, 0.3)'
            }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-xs opacity-70" style={{ color: '#00D2FF' }}>剩余时间</div>
            <div
              className="text-xl font-bold"
              style={{ color: state.timeLeft <= 10 ? '#FF4444' : '#00D2FF' }}
            >
              {state.timeLeft}s
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 30px rgba(255, 107, 157, 0.3)',
          border: '2px solid rgba(255, 107, 157, 0.3)'
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          className="cursor-pointer"
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
        />

        <AnimatePresence>
          {gameStatus === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{
                backgroundColor: 'rgba(15, 15, 26, 0.9)',
                backdropFilter: 'blur(10px)'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-5xl mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                🎨
              </motion.div>

              <motion.h2
                className="text-4xl font-bold mb-2"
                style={{ color: '#FF6B9D' }}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                游戏结束!
              </motion.h2>

              <motion.div
                className="text-3xl font-bold mb-2"
                style={{ color: '#FFD700' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                得分: {state.score}
              </motion.div>

              <motion.div
                className="text-xl mb-4"
                style={{ color: '#FFFFFF', opacity: 0.8 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35, type: 'spring' }}
              >
                匹配次数: {state.matchCount}
              </motion.div>

              {state.score >= highScore && state.score > 0 && (
                <motion.div
                  className="text-xl font-bold mb-4"
                  style={{ color: '#00FF88' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  🎉 新纪录! 🎉
                </motion.div>
              )}

              <motion.div
                className="flex gap-4"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={handleRestart}
                  className="px-8 py-3 rounded-xl font-bold text-lg transition-all"
                  style={{
                    backgroundColor: '#FF6B9D',
                    color: '#FFFFFF',
                    boxShadow: '0 0 20px rgba(255, 107, 157, 0.5)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  再来一局
                </motion.button>

                <motion.button
                  onClick={handleBack}
                  className="px-8 py-3 rounded-xl font-bold text-lg transition-all"
                  style={{
                    backgroundColor: 'rgba(26, 26, 46, 0.8)',
                    color: '#00D2FF',
                    border: '2px solid #00D2FF',
                    backdropFilter: 'blur(10px)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  返回主页
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        className="mt-4 px-6 py-3 rounded-xl text-center"
        style={{
          backgroundColor: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(168, 85, 247, 0.3)'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-sm opacity-70" style={{ color: '#A855F7' }}>
          {gameStatus === 'idle' && '点击画布开始游戏'}
          {gameStatus === 'playing' && '点击匹配目标颜色的方块，连击3次获得1.5倍加成!'}
          {gameStatus === 'gameover' && '按"再来一局"重新开始'}
        </div>
      </motion.div>

      {gameStatus === 'playing' && (
        <motion.div
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(57, 255, 20, 0.3)'
          }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-4">
            <div className="text-sm" style={{ color: '#39FF14' }}>
              匹配次数: <span className="font-bold text-lg">{state.matchCount}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}
