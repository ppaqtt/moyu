import React, { useState, useEffect, useRef } from 'react';
import { SpringFestivalEngine } from './engine';
import { motion } from 'framer-motion';

export default function SpringFestival() {
  const [engine] = useState(() => new SpringFestivalEngine());
  const [gameState, setGameState] = useState(engine.getState());
  const [gamePhase, setGamePhase] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    engine.initialize();
  }, [engine]);

  useEffect(() => {
    if (gamePhase !== 'playing') return;

    const gameLoop = () => {
      engine.update();
      setGameState(engine.getState());
      
      drawGame();
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gamePhase, engine]);

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    gameState.fireworks.forEach(fw => {
      if (!fw.exploded) {
        ctx.beginPath();
        ctx.arc(fw.x, fw.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = fw.color;
        ctx.fill();
      } else {
        fw.particles.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
    });
  };

  const startGame = () => {
    engine.initialize();
    setGameState(engine.getState());
    setGamePhase('playing');
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gamePhase !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    engine.launchFirework(x, y);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-red-900 via-red-800 to-orange-900">
      {gamePhase === 'menu' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <h1 className="text-6xl font-bold text-yellow-400 mb-4">🧨 春节爆竹 🧨</h1>
          <p className="text-xl text-red-200 mb-8">点击屏幕燃放烟花，庆祝新年！</p>
          
          <div className="glass-card rounded-2xl p-6 mb-8 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-yellow-300 mb-3">游戏说明</h3>
            <ul className="text-left text-red-100 space-y-2">
              <li>• 点击屏幕任意位置发射烟花</li>
              <li>• 烟花爆炸获得分数</li>
              <li>• 达到指定分数进入下一关</li>
              <li>• 关卡越高，烟花速度越快！</li>
            </ul>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="px-12 py-4 text-2xl font-bold rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-orange-500/50"
          >
            开始游戏
          </motion.button>
        </motion.div>
      )}

      {gamePhase === 'playing' && (
        <div className="w-full max-w-4xl">
          <div className="flex justify-between items-center mb-4 px-4">
            <div className="glass-card px-6 py-3 rounded-xl">
              <div className="text-sm text-yellow-300">分数</div>
              <div className="text-2xl font-bold text-white">{gameState.score}</div>
            </div>
            <div className="glass-card px-6 py-3 rounded-xl">
              <div className="text-sm text-yellow-300">关卡</div>
              <div className="text-2xl font-bold text-white">{gameState.level}</div>
            </div>
            <div className="glass-card px-6 py-3 rounded-xl">
              <div className="text-sm text-yellow-300">烟花</div>
              <div className="text-2xl font-bold text-white">{gameState.fireworks.length}</div>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl overflow-hidden shadow-2xl border-4 border-yellow-500/50"
          >
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onClick={handleCanvasClick}
              className="w-full cursor-pointer"
              style={{ background: 'linear-gradient(to bottom, #1a1a2e, #16213e)' }}
            />
          </motion.div>
          
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => setGamePhase('menu')}
              className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-medium hover:from-gray-500 hover:to-gray-600 transition-all"
            >
              返回菜单
            </button>
          </div>
        </div>
      )}

      {gamePhase === 'gameover' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold text-yellow-400 mb-4">游戏结束</h1>
          <p className="text-2xl text-red-200 mb-6">最终得分: {gameState.score}</p>
          
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="px-8 py-3 text-xl font-bold rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-orange-500/50"
            >
              再来一局
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setGamePhase('menu')}
              className="px-8 py-3 text-xl font-bold rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white"
            >
              返回菜单
            </motion.button>
          </div>
        </motion.div>
      )}

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
