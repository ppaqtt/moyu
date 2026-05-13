import React, { useEffect, useRef, useState, useCallback } from 'react';
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

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed?: number;
  color?: string;
  active?: boolean;
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
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem(`game_highscore_${gameId}`);
    return saved ? parseInt(saved) : 0;
  });

  const gameStateRef = useRef<{
    player: GameObject;
    bullets: GameObject[];
    enemies: GameObject[];
    particles: GameObject[];
    keys: Set<string>;
    scoreValue: number;
    level: number;
    animationId: number | null;
  }>({
    player: { x: 400, y: 400, width: 40, height: 40 },
    bullets: [],
    enemies: [],
    particles: [],
    keys: new Set(),
    scoreValue: 0,
    level: 1,
    animationId: null,
  });

  const getCategoryInfo = useCallback(() => {
    const categoryData: Record<string, { icon: string; color: string; desc: string }> = {
      'shooting': { icon: '🚀', color: NEON_COLORS.danger, desc: '射击游戏：方向键移动，空格射击' },
      'arcade': { icon: '🕹️', color: NEON_COLORS.neonGreen, desc: '街机游戏：左右移动收集道具' },
      'puzzle': { icon: '🧩', color: NEON_COLORS.neonCyan, desc: '益智游戏：点击得分' },
      'co-op': { icon: '👥', color: NEON_COLORS.neonPink, desc: '合作游戏：点击得分' },
      'tower': { icon: '🏰', color: NEON_COLORS.neonPurple, desc: '塔防游戏：点击射击' },
      'idle': { icon: '💤', color: '#10b981', desc: '挂机游戏：自动得分' },
      'board': { icon: '♟️', color: NEON_COLORS.neonBlue, desc: '棋类游戏：点击得分' },
      'card': { icon: '🃏', color: NEON_COLORS.neonCyan, desc: '卡牌游戏：点击得分' },
      'fighting': { icon: '👊', color: '#f97316', desc: '格斗游戏：点击攻击' },
      'io': { icon: '🌐', color: '#84cc16', desc: 'IO游戏：移动收集' },
      'rhythm': { icon: '🎵', color: NEON_COLORS.neonPink, desc: '节奏游戏：点击打节拍' },
      'music': { icon: '🎹', color: '#6366f1', desc: '音乐游戏：点击创作' },
      'reaction': { icon: '🎯', color: '#f59e0b', desc: '反应游戏：快速点击' },
      'math': { icon: '➕', color: NEON_COLORS.neonCyan, desc: '数学游戏：计算得分' },
      'creative': { icon: '🎨', color: NEON_COLORS.neonPink, desc: '创意游戏：创作得分' },
      'match3': { icon: '💎', color: NEON_COLORS.neonPurple, desc: '消除游戏：点击消除' },
      'physics': { icon: '⚙️', color: NEON_COLORS.neonGreen, desc: '物理游戏：点击互动' },
      '养成': { icon: '🐾', color: '#f472b6', desc: '养成游戏：点击成长' },
      'sports': { icon: '🏃', color: NEON_COLORS.neonBlue, desc: '运动游戏：点击运动' },
      'survival': { icon: '🏆', color: '#f97316', desc: '生存游戏：点击生存' },
      'parkour': { icon: '🏃', color: NEON_COLORS.neonCyan, desc: '跑酷游戏：点击跳跃' },
      'word': { icon: '🔤', color: NEON_COLORS.neonPurple, desc: '文字游戏：点击作答' },
      'adventure': { icon: '📖', color: '#f59e0b', desc: '冒险游戏：点击探索' },
      'ai': { icon: '🤖', color: NEON_COLORS.neonCyan, desc: 'AI游戏：点击互动' },
      'coding': { icon: '💻', color: NEON_COLORS.neonGreen, desc: '编程游戏：点击编程' },
      'maze': { icon: '🗺️', color: '#f97316', desc: '迷宫游戏：移动探索' },
      'visual': { icon: '👁️', color: NEON_COLORS.neonPink, desc: '视觉游戏：点击发现' },
      'retro': { icon: '🕹️', color: '#f59e0b', desc: '复古游戏：经典玩法' },
      'language': { icon: '🌍', color: NEON_COLORS.neonBlue, desc: '语言游戏：点击学习' },
      'holiday': { icon: '🎉', color: NEON_COLORS.danger, desc: '节日游戏：点击庆祝' },
      'simulation': { icon: '🏭', color: '#84cc16', desc: '模拟游戏：点击经营' },
      'multiplayer': { icon: '🎮', color: NEON_COLORS.neonPurple, desc: '多人游戏：点击互动' },
      'escape': { icon: '🚪', color: '#f97316', desc: '逃脱游戏：点击逃脱' },
      'story': { icon: '📖', color: NEON_COLORS.neonPink, desc: '剧情游戏：点击继续' },
      'party': { icon: '🎪', color: '#f59e0b', desc: '派对游戏：点击娱乐' },
      'pixel': { icon: '👾', color: NEON_COLORS.neonGreen, desc: '像素游戏：点击游玩' },
      'aibattle': { icon: '🤖', color: NEON_COLORS.neonCyan, desc: 'AI对战：点击战斗' },
      'tech': { icon: '🔬', color: '#6366f1', desc: '科技游戏：点击探索' },
      'life': { icon: '📋', color: '#10b981', desc: '生活游戏：点击生活' },
      'social': { icon: '👥', color: NEON_COLORS.neonPink, desc: '社交游戏：点击互动' },
      'education': { icon: '🧪', color: NEON_COLORS.neonBlue, desc: '教育游戏：点击学习' },
      'career': { icon: '👨‍🍳', color: '#f97316', desc: '职业游戏：点击工作' },
      'animal': { icon: '🐕', color: '#f472b6', desc: '动物游戏：点击互动' },
      'cooking': { icon: '🍔', color: NEON_COLORS.danger, desc: '烹饪游戏：点击制作' },
      'driving': { icon: '🚗', color: NEON_COLORS.neonGreen, desc: '驾驶游戏：点击驾驶' },
      'craft': { icon: '🎨', color: NEON_COLORS.neonPink, desc: '手工游戏：点击制作' },
      'puzzle2': { icon: '🧩', color: NEON_COLORS.neonPurple, desc: '解谜游戏：点击解谜' },
      '3d': { icon: '🎲', color: NEON_COLORS.neonPurple, desc: '3D游戏：点击探索' },
    };
    return categoryData[category] || { icon: '🎮', color: NEON_COLORS.neonPink, desc: '点击开始游戏' };
  }, [category]);

  const { icon, color, desc } = getCategoryInfo();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    gameStateRef.current.keys.add(e.key.toLowerCase());
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    gameStateRef.current.keys.delete(e.key.toLowerCase());
  }, []);

  const drawSimpleGame = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = gameStateRef.current;
    const keys = state.keys;
    const time = Date.now() * 0.005;

    ctx.fillStyle = 'rgba(10, 10, 20, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = color + '30';
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      const x = (i * 80 + time * 30) % (canvas.width + 100) - 50;
      const y = Math.sin(time + i) * 50 + canvas.height / 2;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.stroke();
    }

    let dx = 0, dy = 0;
    if (keys.has('arrowleft') || keys.has('a')) dx -= 5;
    if (keys.has('arrowright') || keys.has('d')) dx += 5;
    if (keys.has('arrowup') || keys.has('w')) dy -= 5;
    if (keys.has('arrowdown') || keys.has('s')) dy += 5;

    state.player.x = Math.max(0, Math.min(canvas.width - state.player.width, state.player.x + dx));
    state.player.y = Math.max(0, Math.min(canvas.height - state.player.height, state.player.y + dy));

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (Math.random() < 0.03) {
      state.enemies.push({
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: 30,
        height: 30,
        speed: 1 + Math.random() * 3,
        active: true,
      });
    }

    state.enemies.forEach((enemy, index) => {
      if (!enemy.active) return;
      enemy.y += enemy.speed || 2;

      ctx.fillStyle = NEON_COLORS.danger;
      ctx.shadowColor = NEON_COLORS.danger;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(enemy.x + 15, enemy.y + 15, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (enemy.y > canvas.height) {
        enemy.active = false;
        state.scoreValue = Math.max(0, state.scoreValue - 5);
        setScore(state.scoreValue);
      }

      const dist = Math.sqrt(
        Math.pow((enemy.x + 15) - (state.player.x + 20), 2) +
        Math.pow((enemy.y + 15) - (state.player.y + 20), 2)
      );

      if (dist < 40) {
        enemy.active = false;
        state.scoreValue += 10;
        setScore(state.scoreValue);

        for (let i = 0; i < 8; i++) {
          state.particles.push({
            x: enemy.x + 15,
            y: enemy.y + 15,
            width: 6,
            height: 6,
            speed: (Math.random() - 0.5) * 10,
            color: NEON_COLORS.neonPink,
            active: true,
          });
        }
      }
    });

    state.enemies = state.enemies.filter(e => e.active);

    state.particles.forEach((particle, index) => {
      if (!particle.active) return;
      particle.x += particle.speed || 0;
      particle.y += (particle.speed || 0) * 0.5;
      particle.width *= 0.95;

      ctx.fillStyle = particle.color || NEON_COLORS.neonPink;
      ctx.globalAlpha = particle.width / 6;
      ctx.fillRect(particle.x, particle.y, particle.width, particle.height);
      ctx.globalAlpha = 1;

      if (particle.width < 0.5) particle.active = false;
    });
    state.particles = state.particles.filter(p => p.active);

    if (Math.random() < 0.01) {
      state.scoreValue += 1;
      setScore(state.scoreValue);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 16px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${gameName}`, canvas.width / 2, 30);
    ctx.fillText(`分数: ${state.scoreValue} | 等级: ${Math.floor(state.scoreValue / 50) + 1}`, canvas.width / 2, 55);
    ctx.textAlign = 'left';
    ctx.fillText('方向键/WASD移动', 20, canvas.height - 20);

  }, [color, gameName]);

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const gameLoop = () => {
      drawSimpleGame(ctx, canvas);
      gameStateRef.current.animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameStateRef.current.animationId) {
        cancelAnimationFrame(gameStateRef.current.animationId);
      }
    };
  }, [gameStatus, drawSimpleGame, handleKeyDown, handleKeyUp]);

  const handleCanvasClick = useCallback(() => {
    if (gameStatus === 'playing') {
      gameStateRef.current.scoreValue += 5;
      setScore(gameStateRef.current.scoreValue);
      onScoreUpdate?.(gameStateRef.current.scoreValue);
    }
  }, [gameStatus, onScoreUpdate]);

  const startGame = useCallback(() => {
    gameStateRef.current = {
      player: { x: 400, y: 400, width: 40, height: 40 },
      bullets: [],
      enemies: [],
      particles: [],
      keys: new Set(),
      scoreValue: 0,
      level: 1,
      animationId: null,
    };
    setScore(0);
    setGameStatus('playing');
  }, []);

  const pauseGame = useCallback(() => {
    setGameStatus('paused');
  }, []);

  const resumeGame = useCallback(() => {
    setGameStatus('playing');
  }, []);

  const endGame = useCallback(() => {
    setGameStatus('gameover');
    if (gameStateRef.current.scoreValue > highScore) {
      setHighScore(gameStateRef.current.scoreValue);
      localStorage.setItem(`game_highscore_${gameId}`, gameStateRef.current.scoreValue.toString());
    }
    onGameOver?.(gameStateRef.current.scoreValue);
  }, [highScore, gameId, onGameOver]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <motion.div
        className="w-full max-w-4xl rounded-3xl overflow-hidden backdrop-blur-xl"
        style={{
          background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.95), rgba(15, 15, 26, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${color}30`
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
                  background: `linear-gradient(135deg, ${color}30, ${NEON_COLORS.neonCyan}30)`,
                  border: `2px solid ${color}50`
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {icon}
              </motion.div>
              <div>
                <h1 className="text-3xl font-black mb-1" style={{
                  background: `linear-gradient(135deg, ${color}, ${NEON_COLORS.neonCyan})`,
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
                  style={{ color }}
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
                    background: `linear-gradient(135deg, ${color}30, ${NEON_COLORS.neonCyan}30)`,
                    border: `3px solid ${color}50`,
                    boxShadow: `0 0 40px ${color}40`
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
                  {icon}
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">准备开始</h2>
                <p className="opacity-60 mb-6">{desc}</p>
              </div>

              <div className="flex flex-col gap-4 max-w-md mx-auto">
                <motion.button
                  onClick={startGame}
                  className="px-8 py-4 rounded-2xl font-bold text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${color}, ${NEON_COLORS.neonCyan})`,
                    color: '#ffffff',
                    boxShadow: `0 0 30px ${color}50`
                  }}
                  whileHover={{ scale: 1.05, boxShadow: `0 0 50px ${color}70` }}
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
                  border: `2px solid ${color}50`,
                  boxShadow: `0 0 30px ${color}30`
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
                    background: `linear-gradient(135deg, ${NEON_COLORS.danger}, ${NEON_COLORS.neonPink})`,
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
                <div className="text-5xl font-black" style={{ color }}>
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
                background: `linear-gradient(135deg, ${color}, ${NEON_COLORS.neonCyan})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                游戏结束！
              </h2>

              <div className="mb-8">
                <div className="text-lg opacity-60 mb-2">最终得分</div>
                <motion.div
                  className="text-5xl font-black"
                  style={{ color }}
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
                    background: `linear-gradient(135deg, ${color}, ${NEON_COLORS.neonCyan})`,
                    color: '#ffffff',
                    boxShadow: `0 0 30px ${color}50`
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
