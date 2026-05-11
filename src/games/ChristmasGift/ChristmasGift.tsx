import React, { useState, useEffect, useRef } from 'react';
import { ChristmasGiftEngine } from './engine';
import { motion } from 'framer-motion';

const GIFT_EMOJIS: Record<string, string> = {
  gift: '🎁',
  tree: '🎄',
  star: '⭐',
  candy: '🍬',
  bell: '🔔',
};

export default function ChristmasGift() {
  const [engine] = useState(() => new ChristmasGiftEngine());
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
      const newState = engine.getState();
      setGameState(newState);
      
      drawGame();
      
      if (newState.gameOver) {
        setGamePhase('gameover');
      }
      
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

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a2e');
    gradient.addColorStop(1, '#1a365d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.arc(
        (i * 47) % canvas.width,
        (i * 31 + Date.now() / 50) % canvas.height,
        2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    gameState.gifts.forEach(gift => {
      ctx.save();
      ctx.translate(gift.x + gift.size / 2, gift.y + gift.size / 2);
      
      ctx.shadowColor = gift.color;
      ctx.shadowBlur = 10;
      
      ctx.font = `${gift.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(GIFT_EMOJIS[gift.type] || '🎁', 0, 0);
      
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
    
    for (const gift of gameState.gifts) {
      if (
        x >= gift.x &&
        x <= gift.x + gift.size &&
        y >= gift.y &&
        y <= gift.y + gift.size
      ) {
        engine.catchGift(gift.id);
        break;
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-900 via-blue-800 to-green-900">
      {gamePhase === 'menu' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <h1 className="text-6xl font-bold text-green-400 mb-4">🎄 圣诞礼物 🎄</h1>
          <p className="text-xl text-blue-200 mb-8">接住从天上掉下来的圣诞礼物！</p>
          
          <div className="glass-card rounded-2xl p-6 mb-8 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-yellow-300 mb-3">游戏说明</h3>
            <ul className="text-left text-blue-100 space-y-2">
              <li>• 点击下落的礼物接住它们</li>
              <li>• 不要让礼物掉落</li>
              <li>• 连续接住礼物获得连击加分</li>
              <li>• 掉落3个礼物游戏结束</li>
            </ul>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="px-12 py-4 text-2xl font-bold rounded-2xl bg-gradient-to-r from-green-500 to-red-500 text-white shadow-lg shadow-green-500/50"
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
              <div className="text-sm text-yellow-300">生命</div>
              <div className="text-2xl font-bold text-white">
                {'❤️'.repeat(gameState.lives)}{'🖤'.repeat(3 - gameState.lives)}
              </div>
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
            className="rounded-2xl overflow-hidden shadow-2xl border-4 border-green-500/50"
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
          <h1 className="text-5xl font-bold text-red-400 mb-4">游戏结束</h1>
          <p className="text-2xl text-blue-200 mb-2">最终得分: {gameState.score}</p>
          <p className="text-xl text-yellow-300 mb-6">到达关卡: {gameState.level}</p>
          
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="px-8 py-3 text-xl font-bold rounded-xl bg-gradient-to-r from-green-500 to-red-500 text-white shadow-lg shadow-green-500/50"
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
