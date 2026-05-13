import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { NEON_COLORS } from '../utils/constants';

interface PlaceholderGameProps {
  gameId: string;
  gameName: string;
  category: string;
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  onExit?: () => void;
}

export default function PlaceholderGame({ 
  gameId, 
  gameName, 
  category, 
  onScoreUpdate, 
  onGameOver, 
  onExit 
}: PlaceholderGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem(`game_highscore_${gameId}`);
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    if (gameStatus === 'playing') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationId: number;
      let scoreValue = 0;
      let startTime = Date.now();

      const gameLoop = () => {
        const elapsed = Date.now() - startTime;
        
        ctx.fillStyle = 'rgba(15, 15, 26, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, NEON_COLORS.neonPink);
        gradient.addColorStop(0.5, NEON_COLORS.neonCyan);
        gradient.addColorStop(1, NEON_COLORS.neonPurple);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        for (let i = 0; i < 5; i++) {
          const x = (elapsed * 0.1 + i * 200) % (canvas.width + 200) - 100;
          const y = Math.sin(elapsed * 0.003 + i) * 50 + canvas.height / 2;
          ctx.moveTo(x - 50, y);
          ctx.lineTo(x + 50, y);
        }
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 20px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${gameName}`, canvas.width / 2, canvas.height / 2 - 30);
        ctx.fillText(`分数: ${scoreValue}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText(`时间: ${Math.floor(elapsed / 1000)}秒`, canvas.width / 2, canvas.height / 2 + 40);

        ctx.fillStyle = NEON_COLORS.neonCyan;
        ctx.font = '16px "Noto Sans SC", sans-serif';
        ctx.fillText('点击屏幕增加分数', canvas.width / 2, canvas.height / 2 + 80);

        scoreValue = Math.floor(elapsed / 100);
        setScore(scoreValue);

        animationId = requestAnimationFrame(gameLoop);
      };

      gameLoop();

      return () => {
        cancelAnimationFrame(animationId);
      };
    }
  }, [gameStatus, gameName]);

  const handleCanvasClick = () => {
    if (gameStatus === 'playing') {
      setScore(prev => prev + 10);
      onScoreUpdate?.(score + 10);
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setGameStatus('playing');
    setScore(0);
  };

  const pauseGame = () => {
    setGameStatus('paused');
  };

  const resumeGame = () => {
    setGameStatus('playing');
  };

  const endGame = () => {
    setGameStatus('gameover');
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem(`game_highscore_${gameId}`, score.toString());
    }
    onGameOver?.(score);
  };

  const getCategoryIcon = () => {
    const icons: Record<string, string> = {
      'puzzle': '🧩',
      'arcade': '🕹️',
      'co-op': '👥',
      'shooting': '🚀',
      'strategy': '💰',
      'tower': '🏰',
      'idle': '💤',
      'board': '♟️',
      'card': '🃏',
      'fighting': '👊',
      'io': '🌐',
      'rhythm': '🎵',
      'music': '🎹',
      'reaction': '🎯',
      'math': '➕',
      'creative': '🎨',
      'match3': '💎',
      'physics': '⚙️',
      '养成': '🐾',
      'sports': '🏃',
      'survival': '🏆',
      'parkour': '🏃',
      'word': '🔤',
      'adventure': '📖',
      'ai': '🤖',
      'coding': '💻',
      'maze': '🗺️',
      'visual': '👁️',
      'retro': '🕹️',
      'language': '🌍',
      'holiday': '🎉',
      'simulation': '🏭',
      'multiplayer': '🎮',
      'escape': '🚪',
      'story': '📖',
      'party': '🎪',
      'pixel': '👾',
      'aibattle': '🤖',
      'tech': '🔬',
      'life': '📋',
      'social': '👥',
      'education': '🧪',
      'career': '👨‍🍳',
      'animal': '🐕',
      'cooking': '🍔',
      'driving': '🚗',
      'craft': '🎨',
      'puzzle2': '🧩',
    };
    return icons[category] || '🎮';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <motion.div
        className="w-full max-w-4xl rounded-3xl overflow-hidden backdrop-blur-xl"
        style={{
          background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.95), rgba(15, 15, 26, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${NEON_COLORS.neonPurple}30`
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                style={{
                  background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}30, ${NEON_COLORS.neonCyan}30)`,
                  border: `2px solid ${NEON_COLORS.neonPurple}50`
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {getCategoryIcon()}
              </motion.div>
              <div>
                <h1 className="text-3xl font-black mb-1" style={{
                  background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonCyan})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {gameName}
                </h1>
                <p className="text-sm opacity-60">{category}类游戏</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm opacity-60">当前分数</div>
                <motion.div 
                  className="text-3xl font-black"
                  style={{ color: NEON_COLORS.neonCyan }}
                  key={score}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                >
                  {score}
                </motion.div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-60">最高分</div>
                <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>
                  {highScore}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {gameStatus === 'menu' && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-8">
                <motion.div
                  className="w-32 h-32 mx-auto rounded-3xl flex items-center justify-center text-8xl mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}30, ${NEON_COLORS.neonCyan}30)`,
                    border: `3px solid ${NEON_COLORS.neonPurple}50`,
                    boxShadow: `0 0 40px ${NEON_COLORS.neonPurple}40`
                  }}
                  animate={{ 
                    rotateY: [0, 180, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotateY: { duration: 3, repeat: Infinity },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                >
                  {getCategoryIcon()}
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">准备开始</h2>
                <p className="opacity-60 mb-6">点击下方按钮开始游戏</p>
              </div>

              <div className="flex flex-col gap-4 max-w-md mx-auto">
                <motion.button
                  onClick={startGame}
                  className="px-8 py-4 rounded-2xl font-bold text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonCyan})`,
                    color: '#ffffff',
                    boxShadow: `0 0 30px ${NEON_COLORS.neonPink}50`
                  }}
                  whileHover={{ scale: 1.05, boxShadow: `0 0 50px ${NEON_COLORS.neonPink}70` }}
                  whileTap={{ scale: 0.95 }}
                >
                  开始游戏
                </motion.button>

                <motion.button
                  onClick={onExit}
                  className="px-8 py-4 rounded-2xl font-bold text-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }}
                  whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.2)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  返回首页
                </motion.button>
              </div>

              <div className="mt-8 p-4 rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <h3 className="font-bold mb-2">游戏说明</h3>
                <p className="text-sm opacity-70">
                  这是一个 {category} 类游戏示例。点击屏幕会增加分数。
                  你的目标是获得尽可能高的分数！
                </p>
              </div>
            </motion.div>
          )}

          {gameStatus === 'playing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="w-full rounded-2xl cursor-pointer"
                style={{
                  border: `2px solid ${NEON_COLORS.neonPurple}50`,
                  boxShadow: `0 0 30px ${NEON_COLORS.neonPurple}30`
                }}
                onClick={handleCanvasClick}
              />
              
              <div className="flex justify-center gap-4 mt-6">
                <motion.button
                  onClick={pauseGame}
                  className="px-6 py-3 rounded-xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonYellow}, ${NEON_COLORS.neonOrange})`,
                    color: '#ffffff'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ⏸️ 暂停
                </motion.button>
                
                <motion.button
                  onClick={endGame}
                  className="px-6 py-3 rounded-xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonRed}, ${NEON_COLORS.neonPink})`,
                    color: '#ffffff'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🏁 结束游戏
                </motion.button>
              </div>
            </motion.div>
          )}

          {gameStatus === 'paused' && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-6xl mb-4">⏸️</div>
              <h2 className="text-3xl font-bold mb-6">游戏暂停</h2>
              <div className="mb-6">
                <div className="text-lg opacity-60">当前分数</div>
                <div className="text-5xl font-black" style={{ color: NEON_COLORS.neonCyan }}>
                  {score}
                </div>
              </div>
              
              <div className="flex flex-col gap-4 max-w-md mx-auto">
                <motion.button
                  onClick={resumeGame}
                  className="px-8 py-4 rounded-2xl font-bold text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonGreen}, ${NEON_COLORS.neonCyan})`,
                    color: '#ffffff'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ▶️ 继续游戏
                </motion.button>
                
                <motion.button
                  onClick={endGame}
                  className="px-8 py-4 rounded-2xl font-bold"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🏁 结束游戏
                </motion.button>
              </div>
            </motion.div>
          )}

          {gameStatus === 'gameover' && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                className="text-8xl mb-6"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10 }}
              >
                🎉
              </motion.div>
              
              <h2 className="text-4xl font-black mb-4" style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonCyan})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                游戏结束！
              </h2>
              
              <div className="mb-8">
                <div className="text-lg opacity-60 mb-2">最终得分</div>
                <motion.div
                  className="text-6xl font-black"
                  style={{ color: NEON_COLORS.neonCyan }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  {score}
                </motion.div>
                {score >= highScore && score > 0 && (
                  <motion.div
                    className="text-2xl font-bold mt-2"
                    style={{ color: NEON_COLORS.neonPink }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    🏆 新纪录！
                  </motion.div>
                )}
                <div className="text-sm opacity-60 mt-2">
                  最高分: {highScore}
                </div>
              </div>
              
              <div className="flex flex-col gap-4 max-w-md mx-auto">
                <motion.button
                  onClick={startGame}
                  className="px-8 py-4 rounded-2xl font-bold text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonCyan})`,
                    color: '#ffffff',
                    boxShadow: `0 0 30px ${NEON_COLORS.neonPink}50`
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔄 再玩一次
                </motion.button>
                
                <motion.button
                  onClick={onExit}
                  className="px-8 py-4 rounded-2xl font-bold"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🏠 返回首页
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
