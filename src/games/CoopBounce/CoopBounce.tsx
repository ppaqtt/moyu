import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CoopBounceEngine } from './engine';
import { COOP_BOUNCE_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT } = COOP_BOUNCE_CONSTANTS;

export default function CoopBounce() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CoopBounceEngine | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const [gameState, setGameState] = useState<string>('idle');
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    engineRef.current = new CoopBounceEngine();
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
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const gameLoop = setInterval(() => {
      if (!engineRef.current || gameState !== 'playing') return;

      let p1Direction = 0;
      let p2Direction = 0;

      if (keysRef.current['a']) p1Direction = -1;
      if (keysRef.current['d']) p1Direction = 1;
      if (keysRef.current['arrowleft']) p2Direction = -1;
      if (keysRef.current['arrowright']) p2Direction = 1;

      engineRef.current.setPlatform1Direction(p1Direction);
      engineRef.current.setPlatform2Direction(p2Direction);

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
    bgGrad.addColorStop(0.5, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(108, 92, 231, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT / 2);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const target of state.targets) {
      if (!target.active) continue;

      const color = target.points >= 60 ? '#ff6b6b' : target.points >= 40 ? '#feca57' : '#48dbfb';

      ctx.shadowColor = color;
      ctx.shadowBlur = 15;

      const grad = ctx.createLinearGradient(target.x, target.y, target.x, target.y + target.height);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + 'aa');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.roundRect(target.x, target.y, target.width, target.height, 6);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const drawPlatform = (platform: any, color: string, label: string) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;

      const grad = ctx.createLinearGradient(
        platform.x - platform.width / 2, platform.y,
        platform.x + platform.width / 2, platform.y
      );
      grad.addColorStop(0, color + 'cc');
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, color + 'cc');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.roundRect(
        platform.x - platform.width / 2,
        platform.y - platform.height / 2,
        platform.width,
        platform.height,
        10
      );
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, platform.x, platform.y);
    };

    drawPlatform(state.platform1, '#00d2ff', 'P1');
    drawPlatform(state.platform2, '#ff6b9d', 'P2');

    for (const ball of state.balls) {
      if (!ball.active) continue;

      const ballGlow = ctx.createRadialGradient(
        ball.x, ball.y, 0,
        ball.x, ball.y, ball.radius * 3
      );
      ballGlow.addColorStop(0, '#ffffff');
      ballGlow.addColorStop(0.3, '#ffd700aa');
      ballGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = ballGlow;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(
        ball.x - ball.radius * 0.3,
        ball.y - ball.radius * 0.3,
        ball.radius * 0.3,
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
  const targetsRemaining = state ? state.targets.filter(t => t.active).length : 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-4"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          双人弹球
        </h1>
        <p className="text-gray-400">合作击破所有目标!</p>
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
          <div className="text-xs text-gray-400">目标</div>
          <div className="text-xl font-bold text-green-400">{targetsRemaining}</div>
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
                双人弹球
              </motion.div>
              <p className="text-gray-300 mb-6 text-center">
                两个玩家各控制一个弹板<br/>
                合作击破所有目标即可获胜!
              </p>
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
              {targetsRemaining === 0 ? (
                <>
                  <div className="text-4xl mb-4">🎉</div>
                  <div className="text-3xl font-bold mb-4 text-green-400">恭喜通关!</div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold mb-4 text-red-400">游戏结束</div>
                </>
              )}
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
          <div className="text-cyan-400 font-bold mb-1">玩家1 (下方)</div>
          <div className="text-gray-300 text-sm">
            <kbd className="px-2 py-1 bg-gray-700 rounded">A</kbd>
            <span className="mx-2">移动</span>
            <kbd className="px-2 py-1 bg-gray-700 rounded">D</kbd>
          </div>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl text-center">
          <div className="text-pink-400 font-bold mb-1">玩家2 (上方)</div>
          <div className="text-gray-300 text-sm">
            <kbd className="px-2 py-1 bg-gray-700 rounded">←</kbd>
            <span className="mx-2">移动</span>
            <kbd className="px-2 py-1 bg-gray-700 rounded">→</kbd>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-gray-400 text-sm">
        <p>将球反弹击中目标得分!</p>
        <p>击中目标中间位置球会飞向对方!</p>
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
