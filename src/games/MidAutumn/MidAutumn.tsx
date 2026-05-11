import React, { useState, useEffect, useRef } from 'react';
import { MidAutumnEngine } from './engine';
import { motion } from 'framer-motion';

const MOONCAKE_EMOJIS: Record<string, string> = {
  lotus: '🥮',
  redbean: '🥮',
  blacksesame: '🥮',
  matcha: '🍵',
  strawberry: '🍓',
};

export default function MidAutumn() {
  const [engine] = useState(() => new MidAutumnEngine());
  const [gameState, setGameState] = useState(engine.getState());
  const [gamePhase, setGamePhase] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastTimeRef = useRef<number>(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    engine.initialize();
  }, [engine]);

  useEffect(() => {
    if (gamePhase !== 'playing') return;

    const gameLoop = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }
      
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;
      
      engine.update(deltaTime);
      const newState = engine.getState();
      setGameState(newState);
      
      drawGame();
      
      if (newState.gameOver) {
        setGamePhase('gameover');
        lastTimeRef.current = 0;
        return;
      }
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      lastTimeRef.current = 0;
    };
  }, [gamePhase, engine]);

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2
    );
    gradient.addColorStop(0, '#1a1a3e');
    gradient.addColorStop(1, '#0a0a1e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const stars = engine.getStars();
    stars.forEach(star => {
      const twinkle = 0.5 + 0.5 * Math.sin(Date.now() / 500 + star.twinkle * Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#fffacd';
    ctx.shadowColor = '#fffacd';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 100, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    gameState.mooncakes.forEach(mooncake => {
      ctx.save();
      ctx.translate(mooncake.x + 40, mooncake.y + 40);
      
      ctx.shadowColor = mooncake.color;
      ctx.shadowBlur = mooncake.clicked ? 0 : 15;
      
      ctx.font = '60px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = mooncake.clicked ? 0.5 : 1;
      ctx.scale(mooncake.clicked ? 0.5 : 1, mooncake.clicked ? 0.5 : 1);
      ctx.fillText(MOONCAKE_EMOJIS[mooncake.type] || '🥮', 0, 0);
      
      ctx.restore();
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
    
    for (const mooncake of [...gameState.mooncakes].reverse()) {
      if (
        !mooncake.clicked &&
        x >= mooncake.x &&
        x <= mooncake.x + 80 &&
        y >= mooncake.y &&
        y <= mooncake.y + 80
      ) {
        engine.clickMooncake(mooncake.id);
        break;
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-purple-900 via-indigo-900 to-blue-900">
      {gamePhase === 'menu' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <h1 className="text-6xl font-bold text-yellow-400 mb-4">🥮 中秋月饼 🥮</h1>
          <p className="text-xl text-purple-200 mb-8">点击月饼收集它们，共度中秋！</p>
          
          <div className="glass-card rounded-2xl p-6 mb-8 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-yellow-300 mb-3">游戏说明</h3>
            <ul className="text-left text-purple-100 space-y-2">
              <li>• 点击出现的月饼收集它们</li>
              <li>• 不同月饼有不同分值</li>
              <li>• 连续点击获得连击加分</li>
              <li>• 在60秒内获得尽可能高的分数</li>
            </ul>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="px-12 py-4 text-2xl font-bold rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/50"
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
              <div className="text-2xl font-bold text-white">{Math.floor(gameState.score)}</div>
            </div>
            <div className="glass-card px-6 py-3 rounded-xl">
              <div className="text-sm text-yellow-300">时间</div>
              <div className="text-2xl font-bold text-white">{Math.ceil(gameState.timeLeft)}s</div>
            </div>
            <div className="glass-card px-6 py-3 rounded-xl">
              <div className="text-sm text-yellow-300">连击</div>
              <div className="text-2xl font-bold text-white">{gameState.combo}x</div>
            </div>
            <div className="glass-card px-6 py-3 rounded-xl">
              <div className="text-sm text-yellow-300">关卡</div>
              <div className="text-2xl font-bold text-white">{gameState.level}</div>
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
          <p className="text-2xl text-purple-200 mb-2">最终得分: {Math.floor(gameState.score)}</p>
          <p className="text-xl text-yellow-300 mb-6">到达关卡: {gameState.level}</p>
          
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="px-8 py-3 text-xl font-bold rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/50"
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
