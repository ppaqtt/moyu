import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CoopFruitCatchEngine, FRUIT_TYPES } from './engine';
import { COOP_FRUIT_CATCH_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT } = COOP_FRUIT_CATCH_CONSTANTS;

export default function CoopFruitCatch() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CoopFruitCatchEngine | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const [gameState, setGameState] = useState<string>('idle');
  const [state, setState] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    engineRef.current = new CoopFruitCatchEngine();
    setState(engineRef.current.getState());
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (gameState === 'playing') {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (engineRef.current) {
              engineRef.current.setTimeLeft(0);
              setGameState('gameover');
            }
            return 0;
          }
          if (engineRef.current) {
            engineRef.current.setTimeLeft(prev - 1);
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!engineRef.current) return;

    keysRef.current[e.key.toLowerCase()] = true;

    if (e.key === ' ' && (gameState === 'idle' || gameState === 'gameover')) {
      engineRef.current.start();
      setGameState('playing');
      setTimeLeft(60);
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

      if (keysRef.current['a']) engineRef.current.moveBasket1Left();
      if (keysRef.current['d']) engineRef.current.moveBasket1Right();
      if (keysRef.current['arrowleft']) engineRef.current.moveBasket2Left();
      if (keysRef.current['arrowright']) engineRef.current.moveBasket2Right();

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

    for (let i = 0; i < 50; i++) {
      const x = (i * 137) % CANVAS_WIDTH;
      const y = (i * 89) % CANVAS_HEIGHT;
      const size = (i % 3) + 1;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + (i % 5) * 0.05})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(108, 92, 231, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const fruit of state.fruits) {
      if (!fruit.active) continue;

      const fruitData = FRUIT_TYPES[fruit.type];

      const glowGrad = ctx.createRadialGradient(
        fruit.x, fruit.y, 0,
        fruit.x, fruit.y, fruit.radius * 2
      );
      glowGrad.addColorStop(0, fruitData.color + '80');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(fruit.x, fruit.y, fruit.radius * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = `${fruit.radius * 2}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fruitData.emoji, fruit.x, fruit.y);
    }

    const drawBasket = (basket: any, color: string) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;

      const grad = ctx.createLinearGradient(
        basket.x - basket.width / 2, basket.y,
        basket.x + basket.width / 2, basket.y
      );
      grad.addColorStop(0, color + 'cc');
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, color + 'cc');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(basket.x - basket.width / 2, basket.y - basket.height / 2);
      ctx.lineTo(basket.x - basket.width / 3, basket.y + basket.height / 2);
      ctx.lineTo(basket.x + basket.width / 3, basket.y + basket.height / 2);
      ctx.lineTo(basket.x + basket.width / 2, basket.y - basket.height / 2);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    drawBasket(state.basket1, '#00d2ff');
    drawBasket(state.basket2, '#ff6b9d');

    ctx.strokeStyle = 'rgba(108, 92, 231, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);

  }, [state]);

  const handleStart = () => {
    if (engineRef.current) {
      engineRef.current.start();
      setGameState('playing');
      setTimeLeft(60);
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      setState(engineRef.current.getState());
      setGameState('idle');
      setTimeLeft(60);
    }
  };

  const totalScore = state ? state.score.player1 + state.score.player2 : 0;
  const maxCombo = state ? Math.max(state.combo.player1, state.combo.player2) : 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-4"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          双人接水果
        </h1>
        <p className="text-gray-400">合作接住所有水果!</p>
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
          <div className="text-xs text-gray-400">连击</div>
          <div className="text-xl font-bold text-orange-400">{maxCombo}x</div>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="glass-card px-4 py-2 rounded-xl text-center">
          <div className="text-xs text-gray-400">时间</div>
          <div className={`text-xl font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-green-400'}`}>
            {timeLeft}s
          </div>
        </div>
        <div className="glass-card px-4 py-2 rounded-xl text-center">
          <div className="text-xs text-gray-400">漏掉</div>
          <div className="text-xl font-bold text-red-400">{state?.missedFruits || 0} / 10</div>
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
                双人接水果
              </motion.div>
              <p className="text-gray-300 mb-2 text-center">合作接住所有水果!<br/>连击获得额外加分!</p>
              <div className="text-gray-400 text-sm mb-4">
                {FRUIT_TYPES.map((f, i) => (
                  <span key={i} className="mr-2">{f.emoji}</span>
                ))}
              </div>
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
              <div className="text-gray-400 mb-4">漏掉了 {state?.missedFruits || 0} 个水果</div>
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
        <p>连续接住水果获得连击加分!</p>
        <p>漏掉10个水果游戏结束!</p>
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
