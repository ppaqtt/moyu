import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { FlashClickEngine } from './engine';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 600;
const PERFECT_THRESHOLD = 300;
const GREAT_THRESHOLD = 500;
const GOOD_THRESHOLD = 800;

export default function FlashClick() {
  const navigate = useNavigate();
  const [engine] = useState(() => new FlashClickEngine());
  const [state, setState] = useState(() => engine.getState());
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [highScore, setHighScore] = useLocalStorage('flashclick_highscore', 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number>();
  const [pulsePhase, setPulsePhase] = useState(0);

  const getScoreLabel = (time: number): { label: string; color: string } => {
    if (time <= PERFECT_THRESHOLD) return { label: '完美!', color: '#00FFFF' };
    if (time <= GREAT_THRESHOLD) return { label: '很棒!', color: '#00FF00' };
    if (time <= GOOD_THRESHOLD) return { label: '不错!', color: '#FFFF00' };
    return { label: '加油!', color: '#FF8800' };
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

    if (gameStatus === 'idle') {
      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#A855F7';
      ctx.shadowColor = '#A855F7';
      ctx.shadowBlur = 20;
      ctx.fillText('✨ 闪烁点击 ✨', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

      ctx.font = '24px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.fillText('点击开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

      ctx.font = '18px Arial';
      ctx.fillStyle = '#888888';
      ctx.shadowBlur = 0;
      ctx.fillText('快速点击出现的目标!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      return;
    }

    if (state.phase === 'ready') {
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FF8800';
      ctx.shadowColor = '#FF8800';
      ctx.shadowBlur = 20;
      ctx.fillText('准备...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    if (state.phase === 'playing' && state.target) {
      const { x, y, radius } = state.target;
      
      const elapsed = Date.now() - state.targetAppearTime;
      const pulse = Math.sin(elapsed / 100) * 0.2 + 0.8;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
      gradient.addColorStop(0, `rgba(168, 85, 247, ${pulse})`);
      gradient.addColorStop(0.5, `rgba(168, 85, 247, ${pulse * 0.3})`);
      gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#A855F7';
      ctx.shadowColor = '#A855F7';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', x, y);
    }

    if (state.phase === 'result' && state.reactionTime > 0) {
      const { label, color } = state.lastResult === 'hit' 
        ? getScoreLabel(state.reactionTime) 
        : { label: '未命中!', color: '#FF4444' };

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 30;
      ctx.font = 'bold 72px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

      if (state.lastResult === 'hit') {
        ctx.font = 'bold 36px Arial';
        ctx.fillText(`${state.reactionTime}ms`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      }

      ctx.shadowBlur = 0;
    }

    if (gameStatus === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#A855F7';
      ctx.shadowColor = '#A855F7';
      ctx.shadowBlur = 20;
      ctx.fillText('🎉 测试完成!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 120);

      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.fillText(`最终得分: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

      if (state.bestTime < Infinity) {
        ctx.font = '24px Arial';
        ctx.fillStyle = '#00FF00';
        ctx.shadowColor = '#00FF00';
        ctx.fillText(`最快反应: ${state.bestTime}ms`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        ctx.fillStyle = '#A855F7';
        ctx.shadowColor = '#A855F7';
        ctx.fillText(`平均反应: ${state.averageTime}ms`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      }

      ctx.fillStyle = '#FF6B9D';
      ctx.shadowColor = '#FF6B9D';
      ctx.fillText(`未命中: ${state.misses}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    }

    ctx.shadowBlur = 0;
  }, [state, gameStatus]);

  useEffect(() => {
    if (gameStatus !== 'playing') {
      render();
      return;
    }

    const animate = () => {
      render();
      setPulsePhase(prev => prev + 0.05);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);

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

    return () => {
      clearInterval(interval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (resultTimerRef.current) {
        clearTimeout(resultTimerRef.current);
      }
    };
  }, [gameStatus, engine, render, state.score, highScore, setHighScore]);

  useEffect(() => {
    if (gameStatus === 'playing' && state.phase === 'result') {
      resultTimerRef.current = setTimeout(() => {
        engine.startRound();
        setState({ ...engine.getState() });
      }, 1000);
    }
  }, [state.phase, gameStatus, engine]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameStatus === 'idle') {
      setGameStatus('playing');
      engine.startRound();
      setState({ ...engine.getState() });
      return;
    }

    if (gameStatus !== 'playing' || state.phase !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    engine.handleClick(x, y);
    setState({ ...engine.getState() });
  }, [gameStatus, engine, state.phase]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setState({ ...engine.getState() });
    setGameStatus('playing');
    engine.startRound();
    setState({ ...engine.getState() });
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
            <div className="text-xs opacity-70" style={{ color: '#00D2FF' }}>回合</div>
            <div className="text-xl font-bold" style={{ color: '#00D2FF' }}>
              {state.round}/{state.totalRounds}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)',
          border: '2px solid rgba(168, 85, 247, 0.3)'
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
                ✨
              </motion.div>

              <motion.h2
                className="text-4xl font-bold mb-2"
                style={{ color: '#A855F7' }}
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

              {state.bestTime < Infinity && (
                <>
                  <motion.div
                    className="text-lg mb-2"
                    style={{ color: '#00FF00' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    最快反应: {state.bestTime}ms
                  </motion.div>

                  <motion.div
                    className="text-lg mb-2"
                    style={{ color: '#A855F7' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    平均反应: {state.averageTime}ms
                  </motion.div>

                  <motion.div
                    className="text-lg mb-4"
                    style={{ color: '#FF6B9D' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                  >
                    未命中: {state.misses}
                  </motion.div>
                </>
              )}

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
                    backgroundColor: '#A855F7',
                    color: '#FFFFFF',
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
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
          {gameStatus === 'playing' && state.phase === 'ready' && '准备...'}
          {gameStatus === 'playing' && state.phase === 'playing' && '快速点击目标!'}
          {gameStatus === 'playing' && state.phase === 'result' && '准备下一轮...'}
          {gameStatus === 'gameover' && '按"再来一局"重新开始'}
        </div>
      </motion.div>

      {gameStatus === 'playing' && state.bestTime < Infinity && (
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
              最快: <span className="font-bold text-lg">{state.bestTime}ms</span>
            </div>
            <div className="text-sm" style={{ color: '#A855F7' }}>
              平均: <span className="font-bold text-lg">{state.averageTime}ms</span>
            </div>
            <div className="text-sm" style={{ color: '#FF6B9D' }}>
              未命中: <span className="font-bold text-lg">{state.misses}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
