import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CoopBreakoutEngine } from './engine';
import { COOP_BREAKOUT_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT } = COOP_BREAKOUT_CONSTANTS;

export default function CoopBreakout() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CoopBreakoutEngine | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const [gameState, setGameState] = useState<string>('idle');
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    engineRef.current = new CoopBreakoutEngine();
    setState(engineRef.current.getState());
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!engineRef.current) return;

    keysRef.current[e.key.toLowerCase()] = true;

    if (e.key === ' ' && (gameState === 'idle' || gameState === 'gameover')) {
      engineRef.current.start();
      setGameState('playing');
    }
  }, [gameState]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key.toLowerCase()] = false;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const gameLoop = setInterval(() => {
      if (!engineRef.current || gameState !== 'playing') return;

      if (keysRef.current['a']) engineRef.current.movePaddle1Left();
      if (keysRef.current['d']) engineRef.current.movePaddle1Right();
      if (keysRef.current['arrowleft']) engineRef.current.movePaddle2Left();
      if (keysRef.current['arrowright']) engineRef.current.movePaddle2Right();

      engineRef.current.tick();
      const newState = engineRef.current.getState();
      setState(newState);
      setGameState(newState.gameStatus);
    }, 16);

    return () => clearInterval(gameLoop);
  }, [gameState]);

  useEffect(() => {
    if (!canvasRef.current || !state) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#0f0f1a');
    bgGrad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(108, 92, 231, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();

    for (const brick of state.bricks) {
      if (!brick.active) continue;

      ctx.shadowColor = brick.color;
      ctx.shadowBlur = 10;

      const grad = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
      grad.addColorStop(0, brick.color);
      grad.addColorStop(1, brick.color + 'aa');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (brick.maxHits > 1) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(brick.hits.toString(), brick.x + brick.width / 2, brick.y + brick.height / 2 + 4);
      }
    }

    const drawPaddle = (paddle: any, color: string) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;

      const grad = ctx.createLinearGradient(
        paddle.x - paddle.width / 2, paddle.y,
        paddle.x + paddle.width / 2, paddle.y
      );
      grad.addColorStop(0, color + 'cc');
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, color + 'cc');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.roundRect(
        paddle.x - paddle.width / 2,
        paddle.y - paddle.height / 2,
        paddle.width,
        paddle.height,
        8
      );
      ctx.fill();

      ctx.shadowBlur = 0;
    };

    drawPaddle(state.paddle1, '#00d2ff');
    drawPaddle(state.paddle2, '#ff6b9d');

    if (state.ball.active) {
      const ballGlow = ctx.createRadialGradient(
        state.ball.x, state.ball.y, 0,
        state.ball.x, state.ball.y, state.ball.radius * 3
      );
      ballGlow.addColorStop(0, '#ffffff');
      ballGlow.addColorStop(0.3, '#ffd700aa');
      ballGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = ballGlow;
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, state.ball.radius * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(
        state.ball.x - state.ball.radius * 0.3,
        state.ball.y - state.ball.radius * 0.3,
        state.ball.radius * 0.3,
        0, Math.PI * 2
      );
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(108, 92, 231, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);

  }, [state]);

  const handleStart = () => {
    if (engineRef.current) {
      engineRef.current.start();
      setGameState('playing');
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      setState(engineRef.current.getState());
      setGameState('idle');
    }
  };

  const totalScore = state ? state.score.player1 + state.score.player2 : 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-4"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          双人打砖块
        </h1>
        <p className="text-gray-400">合作击破所有砖块!</p>
      </motion.div>

      <div className="flex gap-4 mb-4">
        <div className="glass-card px-4 py-2 rounded-xl text-center">
          <div className="text-xs text-gray-400">P1 分数</div>
          <div className="text-xl font-bold" style={{ color: '#00d2ff' }}>{state?.score.player1 || 0}</div>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl text-center">
          <div className="text-xs text-gray-400">合作总分</div>
          <div className="text-xl font-bold text-yellow-400">{totalScore}</div>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl text-center">
          <div className="text-xs text-gray-400">P2 分数</div>
          <div className="text-xl font-bold" style={{ color: '#ff6b9d' }}>{state?.score.player2 || 0}</div>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl text-center">
          <div className="text-xs text-gray-400">生命</div>
          <div className="text-xl font-bold text-red-400">{'❤️'.repeat(state?.lives || 0)}</div>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-2xl"
          style={{ boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)' }}
        />

        <AnimatePresence>
          {gameState === 'idle' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(15, 15, 26, 0.9)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-3xl font-bold mb-4 text-yellow-400"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                双人打砖块
              </motion.div>
              <p className="text-gray-300 mb-6 text-center">合作击破所有砖块!<br/>连续击打获得连击加分!</p>
              <motion.button
                onClick={handleStart}
                className="px-8 py-4 rounded-xl font-bold text-xl text-white"
                style={{ background: 'linear-gradient(135deg, #00d2ff, #ff6b9d)' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始游戏 (空格)
              </motion.button>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(15, 15, 26, 0.95)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-3xl font-bold mb-4 text-red-400">游戏结束</div>
              <div className="text-gray-300 mb-2">合作总分: {totalScore}</div>
              <div className="flex gap-4 mt-4">
                <motion.button
                  onClick={handleRestart}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-cyan-600 rounded-xl text-white font-bold"
                  whileHover={{ scale: 1.05 }}
                >
                  再来一局
                </motion.button>
                <motion.button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-gray-600 rounded-xl text-white font-bold"
                  whileHover={{ scale: 1.05 }}
                >
                  返回
                </motion.button>
              </div>
            </motion.div>
          )}

          {gameState === 'victory' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(15, 15, 26, 0.95)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-4xl mb-4">🎉</div>
              <div className="text-3xl font-bold mb-4 text-green-400">恭喜通关!</div>
              <div className="text-gray-300 mb-2">合作总分: {totalScore}</div>
              <div className="flex gap-4 mt-4">
                <motion.button
                  onClick={handleRestart}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-cyan-600 rounded-xl text-white font-bold"
                  whileHover={{ scale: 1.05 }}
                >
                  再来一局
                </motion.button>
                <motion.button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-gray-600 rounded-xl text-white font-bold"
                  whileHover={{ scale: 1.05 }}
                >
                  返回
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between mt-4 w-full max-w-2xl">
        <div className="glass-card px-4 py-2 rounded-xl text-center">
          <div className="text-cyan-400 font-bold mb-1">玩家1</div>
          <div className="text-gray-300 text-sm">
            <kbd className="px-2 py-1 bg-gray-700 rounded">A</kbd>
            <span className="mx-2">移动</span>
            <kbd className="px-2 py-1 bg-gray-700 rounded">D</kbd>
          </div>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl text-center">
          <div className="text-pink-400 font-bold mb-1">玩家2</div>
          <div className="text-gray-300 text-sm">
            <kbd className="px-2 py-1 bg-gray-700 rounded">←</kbd>
            <span className="mx-2">移动</span>
            <kbd className="px-2 py-1 bg-gray-700 rounded">→</kbd>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-gray-400 text-sm">
        <p>连续击打砖块获得连击加分!</p>
        <p>顶部砖块分值更高!</p>
      </div>

      <style>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 92, 231, 0.3);
        }
      `}</style>
    </div>
  );
}
