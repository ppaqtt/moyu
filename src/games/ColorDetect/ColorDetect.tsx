import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../utils/constants';
import { ColorDetectEngine, ColorOption } from './engine';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 650;

export default function ColorDetect() {
  const navigate = useNavigate();
  const [engine] = useState(() => new ColorDetectEngine());
  const [state, setState] = useState(() => engine.getState());
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [highScore, setHighScore] = useLocalStorage(STORAGE_KEYS.COLOR_DETECT || 'colordetect_highscore', 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawWord = useCallback((ctx: CanvasRenderingContext2D) => {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = 200;

    ctx.fillStyle = state.currentColor;
    ctx.fillRect(centerX - 180, centerY - 80, 360, 160);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.strokeRect(centerX - 180, centerY - 80, 360, 160);

    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = state.currentTextColor;
    ctx.shadowColor = state.currentTextColor;
    ctx.shadowBlur = 20;
    ctx.fillText(state.currentWord, centerX, centerY);

    ctx.shadowBlur = 0;
  }, [state.currentWord, state.currentColor, state.currentTextColor]);

  const drawTimer = useCallback((ctx: CanvasRenderingContext2D) => {
    const maxTime = 3000;
    const progress = Math.max(0, state.timeLeft) / maxTime;
    const barWidth = 300;
    const barHeight = 12;
    const centerX = CANVAS_WIDTH / 2;
    const barY = 330;

    ctx.fillStyle = 'rgba(26, 26, 46, 0.8)';
    ctx.fillRect(centerX - barWidth / 2 - 5, barY - 5, barWidth + 10, barHeight + 10);

    const gradient = ctx.createLinearGradient(centerX - barWidth / 2, 0, centerX + barWidth / 2, 0);
    if (progress > 0.5) {
      gradient.addColorStop(0, '#00FF00');
      gradient.addColorStop(1, '#00FF00');
    } else if (progress > 0.25) {
      gradient.addColorStop(0, '#FFFF00');
      gradient.addColorStop(1, '#FFFF00');
    } else {
      gradient.addColorStop(0, '#FF4444');
      gradient.addColorStop(1, '#FF4444');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - barWidth / 2, barY, barWidth * progress, barHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - barWidth / 2, barY, barWidth, barHeight);
  }, [state.timeLeft]);

  const drawOptions = useCallback((ctx: CanvasRenderingContext2D) => {
    const buttonWidth = 200;
    const buttonHeight = 60;
    const gap = 20;
    const startX = (CANVAS_WIDTH - (buttonWidth * 2 + gap)) / 2;
    const startY = 400;

    state.options.forEach((option, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + col * (buttonWidth + gap);
      const y = startY + row * (buttonHeight + gap);

      const gradient = ctx.createLinearGradient(x, y, x, y + buttonHeight);
      gradient.addColorStop(0, option.color);
      gradient.addColorStop(1, shadeColor(option.color, -30));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, buttonWidth, buttonHeight, 12);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(option.name, x + buttonWidth / 2, y + buttonHeight / 2);
      ctx.shadowBlur = 0;
    });
  }, [state.options]);

  const drawResult = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!state.lastResult) return;

    const centerX = CANVAS_WIDTH / 2;
    const centerY = 350;

    let resultText = '';
    let resultColor = '';

    switch (state.lastResult) {
      case 'correct':
        resultText = '✓ 正确!';
        resultColor = '#00FF00';
        break;
      case 'wrong':
        resultText = '✗ 错误';
        resultColor = '#FF4444';
        break;
      case 'timeout':
        resultText = '⏰ 超时!';
        resultColor = '#FF8800';
        break;
    }

    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = resultColor;
    ctx.shadowColor = resultColor;
    ctx.shadowBlur = 20;
    ctx.fillText(resultText, centerX, centerY);
    ctx.shadowBlur = 0;
  }, [state.lastResult]);

  const shadeColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gameStatus === 'playing' && state.phase !== 'idle') {
      drawWord(ctx);
      drawTimer(ctx);
      drawOptions(ctx);
      drawResult(ctx);

      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#A855F7';
      ctx.fillText('文字是什么颜色?', CANVAS_WIDTH / 2, 60);
    }

    if (gameStatus === 'idle') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FF6B9D';
      ctx.shadowColor = '#FF6B9D';
      ctx.shadowBlur = 20;
      ctx.fillText('🎨 颜色识别 🎨', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

      ctx.font = '24px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.fillText('点击开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

      ctx.font = '18px Arial';
      ctx.fillStyle = '#888888';
      ctx.shadowBlur = 0;
      ctx.fillText('识别文字的实际颜色，不是文字的含义', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    }

    if (gameStatus === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FF6B9D';
      ctx.shadowColor = '#FF6B9D';
      ctx.shadowBlur = 20;
      ctx.fillText('🎉 测试完成! 🎉', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.fillText(`最终得分: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

      ctx.font = '24px Arial';
      ctx.fillStyle = '#00D2FF';
      ctx.shadowColor = '#00D2FF';
      ctx.fillText(`完成回合: ${state.round}/${state.totalRounds}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

      ctx.fillStyle = '#A855F7';
      ctx.shadowColor = '#A855F7';
      ctx.fillText(`最高连击: ${state.bestStreak}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 65);
    }

    ctx.shadowBlur = 0;
  }, [state, gameStatus, drawWord, drawTimer, drawOptions, drawResult]);

  useEffect(() => {
    if (gameStatus !== 'playing') {
      render();
      return;
    }

    const interval = setInterval(() => {
      engine.tick();
      setState({ ...engine.getState() });

      if (engine.checkGameOver()) {
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
    if (gameStatus === 'idle') {
      setGameStatus('playing');
      engine.reset();
      setState({ ...engine.getState() });
      return;
    }

    if (gameStatus !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const buttonWidth = 200;
    const buttonHeight = 60;
    const gap = 20;
    const startX = (CANVAS_WIDTH - (buttonWidth * 2 + gap)) / 2;
    const startY = 400;

    state.options.forEach((option, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const bx = startX + col * (buttonWidth + gap);
      const by = startY + row * (buttonHeight + gap);

      if (x >= bx && x <= bx + buttonWidth && y >= by && y <= by + buttonHeight) {
        engine.handleAnswer(option.id);
        setState({ ...engine.getState() });
      }
    });
  }, [gameStatus, engine, state.options]);

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
          <div
            className="px-4 py-2 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}
          >
            <div className="text-xs opacity-70" style={{ color: '#FFD700' }}>最高分</div>
            <div className="text-xl font-bold" style={{ color: '#FFD700' }}>{highScore}</div>
          </div>

          <div
            className="px-4 py-2 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 107, 157, 0.3)'
            }}
          >
            <div className="text-xs opacity-70" style={{ color: '#FF6B9D' }}>当前得分</div>
            <div className="text-xl font-bold" style={{ color: '#FF6B9D' }}>{state.score}</div>
          </div>

          <div
            className="px-4 py-2 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 210, 255, 0.3)'
            }}
          >
            <div className="text-xs opacity-70" style={{ color: '#00D2FF' }}>剩余时间</div>
            <div
              className="text-xl font-bold"
              style={{ color: state.totalTimeLeft <= 10 ? '#FF4444' : '#00D2FF' }}
            >
              {state.totalTimeLeft}s
            </div>
          </div>
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
                测试完成!
              </motion.h2>

              <motion.div
                className="text-3xl font-bold mb-4"
                style={{ color: '#FFD700' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                得分: {state.score}
              </motion.div>

              <motion.div
                className="text-lg mb-2"
                style={{ color: '#00D2FF' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                完成回合: {state.round}/{state.totalRounds}
              </motion.div>

              <motion.div
                className="text-lg mb-4"
                style={{ color: '#A855F7' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                最高连击: {state.bestStreak}
              </motion.div>

              {state.score >= highScore && state.score > 0 && (
                <motion.div
                  className="text-xl font-bold mb-4"
                  style={{ color: '#00FF88' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
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
          {gameStatus === 'playing' && state.phase === 'playing' && `回合 ${state.round}/${state.totalRounds} - 选择文字的实际颜色!`}
          {gameStatus === 'playing' && state.phase === 'result' && '正确! 准备下一题...'}
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
          <div className="flex items-center gap-6">
            <div className="text-sm" style={{ color: '#39FF14' }}>
              连击: <span className="font-bold text-lg">{state.streak}</span>
            </div>
            {state.streak >= 3 && (
              <motion.div
                className="px-3 py-1 rounded-full text-sm font-bold"
                style={{
                  backgroundColor: 'rgba(255, 107, 157, 0.3)',
                  color: '#FF6B9D',
                  border: '1px solid #FF6B9D'
                }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                🔥 COMBO!
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
