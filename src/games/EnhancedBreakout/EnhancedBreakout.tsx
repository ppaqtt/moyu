import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ENHANCED_BREAKOUT_CONSTANTS, STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { EnhancedBreakoutEngine, GameEngineState, PowerUpType } from './engine';

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_HEIGHT,
} = ENHANCED_BREAKOUT_CONSTANTS;

const POWERUP_LABELS: Record<PowerUpType, { name: string; color: string }> = {
  widen:    { name: '加宽球拍', color: '#6bcb77' },
  multi:    { name: '多球',     color: '#4d96ff' },
  fireball: { name: '火球穿透', color: '#ff2e63' },
  slow:     { name: '减速球',   color: '#ffd93d' },
};

export default function EnhancedBreakout() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<EnhancedBreakoutEngine>(new EnhancedBreakoutEngine());
  const animFrameRef = useRef<number>(0);
  const stateRef = useRef<GameEngineState>(engineRef.current.getState());

  const [gameState, setGameState] = useState<GameEngineState>(() => engineRef.current.getState());
  const [highScore, setHighScore] = useLocalStorage<number>(STORAGE_KEYS.ENHANCED_BREAKOUT, 0);

  const navigate = useNavigate();

  // ==================== 渲染 ====================

  const draw = useCallback((ctx: CanvasRenderingContext2D, state: GameEngineState) => {
    const { balls, paddle, bricks, powerups, activeEffects } = state;

    // 清空画布
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 背景网格
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // 绘制砖块
    for (const brick of bricks) {
      if (!brick.alive) continue;

      // 根据剩余血量调整透明度
      const alpha = 0.5 + 0.5 * (brick.hits / brick.maxHits);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = brick.color;
      ctx.shadowColor = brick.color;
      ctx.shadowBlur = 8;

      // 圆角矩形
      const r = 4;
      ctx.beginPath();
      ctx.moveTo(brick.x + r, brick.y);
      ctx.lineTo(brick.x + brick.width - r, brick.y);
      ctx.quadraticCurveTo(brick.x + brick.width, brick.y, brick.x + brick.width, brick.y + r);
      ctx.lineTo(brick.x + brick.width, brick.y + brick.height - r);
      ctx.quadraticCurveTo(brick.x + brick.width, brick.y + brick.height, brick.x + brick.width - r, brick.y + brick.height);
      ctx.lineTo(brick.x + r, brick.y + brick.height);
      ctx.quadraticCurveTo(brick.x, brick.y + brick.height, brick.x, brick.y + brick.height - r);
      ctx.lineTo(brick.x, brick.y + r);
      ctx.quadraticCurveTo(brick.x, brick.y, brick.x + r, brick.y);
      ctx.closePath();
      ctx.fill();

      // 多血量砖块显示数字
      if (brick.maxHits > 1) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          String(brick.hits),
          brick.x + brick.width / 2,
          brick.y + brick.height / 2
        );
      }

      ctx.restore();
    }

    // 绘制道具
    for (const p of powerups) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.width / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, p.x, p.y);
      ctx.restore();
    }

    // 绘制球拍
    ctx.save();
    const paddleGrad = ctx.createLinearGradient(
      paddle.x, paddle.y,
      paddle.x + paddle.width, paddle.y
    );
    paddleGrad.addColorStop(0, NEON_COLORS.neonPink);
    paddleGrad.addColorStop(1, NEON_COLORS.neonBlue);
    ctx.fillStyle = paddleGrad;
    ctx.shadowColor = NEON_COLORS.neonPink;
    ctx.shadowBlur = 15;

    const pr = 6;
    ctx.beginPath();
    ctx.moveTo(paddle.x + pr, paddle.y);
    ctx.lineTo(paddle.x + paddle.width - pr, paddle.y);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + pr);
    ctx.lineTo(paddle.x + paddle.width, paddle.y + PADDLE_HEIGHT - pr);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y + PADDLE_HEIGHT, paddle.x + paddle.width - pr, paddle.y + PADDLE_HEIGHT);
    ctx.lineTo(paddle.x + pr, paddle.y + PADDLE_HEIGHT);
    ctx.quadraticCurveTo(paddle.x, paddle.y + PADDLE_HEIGHT, paddle.x, paddle.y + PADDLE_HEIGHT - pr);
    ctx.lineTo(paddle.x, paddle.y + pr);
    ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + pr, paddle.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 绘制球
    for (const ball of balls) {
      ctx.save();
      if (ball.isFireball) {
        // 火球特效
        const fireGrad = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius * 2.5);
        fireGrad.addColorStop(0, '#fff');
        fireGrad.addColorStop(0.3, '#ff6b35');
        fireGrad.addColorStop(0.7, '#ff2e63');
        fireGrad.addColorStop(1, 'rgba(255,46,99,0)');
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#ff2e63';
        ctx.shadowBlur = 25;
      } else {
        ctx.fillStyle = NEON_COLORS.white;
        ctx.shadowColor = NEON_COLORS.neonBlue;
        ctx.shadowBlur = 15;
      }

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 绘制活跃效果指示条
    if (activeEffects.length > 0) {
      ctx.save();
      const barY = CANVAS_HEIGHT - 12;
      const barHeight = 4;
      const totalWidth = CANVAS_WIDTH;
      const segWidth = totalWidth / activeEffects.length;

      for (let i = 0; i < activeEffects.length; i++) {
        const effect = activeEffects[i];
        const config = POWERUP_LABELS[effect.type];
        const maxDuration = effect.type === 'widen' ? 600 : effect.type === 'fireball' ? 480 : 360;
        const ratio = Math.max(0, effect.remaining / maxDuration);

        ctx.fillStyle = config.color;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(i * segWidth + 2, barY, (segWidth - 4) * ratio, barHeight);
      }
      ctx.restore();
    }
  }, []);

  // ==================== 游戏循环 ====================

  const gameLoop = useCallback(() => {
    const engine = engineRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engine.tick();
    const state = engine.getState();
    stateRef.current = state;

    draw(ctx, state);

    // 更新 React 状态（低频）
    setGameState({
      balls: state.balls.map(b => ({ ...b })),
      paddle: { ...state.paddle },
      bricks: state.bricks.map(b => ({ ...b })),
      powerups: state.powerups.map(p => ({ ...p })),
      activeEffects: [...state.activeEffects],
      score: state.score,
      lives: state.lives,
      level: state.level,
      status: state.status,
    });

    // 更新最高分
    if (state.score > highScore) {
      setHighScore(state.score);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [draw, highScore, setHighScore]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameLoop]);

  // ==================== 事件处理 ====================

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    engineRef.current.setPaddlePosition(e.clientX, canvas.getBoundingClientRect());
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const touch = e.touches[0];
    engineRef.current.setPaddlePosition(touch.clientX, canvas.getBoundingClientRect());
  }, []);

  const handleStart = useCallback(() => {
    const engine = engineRef.current;
    if (engine.getState().status === 'idle') {
      engine.start();
    }
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current.reset();
  }, []);

  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // ==================== 辅助计算 ====================

  const activeEffectNames = gameState.activeEffects
    .filter(e => e.type !== 'multi') // multi 是即时效果
    .map(e => POWERUP_LABELS[e.type]);

  const livesDisplay = Array.from({ length: 3 }, (_, i) => i < gameState.lives);

  // ==================== 渲染 ====================

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      }}
    >
      {/* 顶部信息栏 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[620px] mb-4"
      >
        <div
          className="glass-card rounded-2xl p-4"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex items-center justify-between">
            {/* 返回按钮 */}
            <motion.button
              onClick={handleGoHome}
              className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300"
              style={{
                backgroundColor: NEON_COLORS.darkPurple,
                color: NEON_COLORS.neonBlue,
                boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`,
              }}
              whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}` }}
              whileTap={{ scale: 0.95 }}
            >
              返回
            </motion.button>

            {/* 分数区 */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-xs opacity-60" style={{ color: NEON_COLORS.gold }}>分数</div>
                <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>
                  {gameState.score}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs opacity-60" style={{ color: NEON_COLORS.gold }}>最高分</div>
                <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>
                  {highScore}
                </div>
              </div>
            </div>

            {/* 生命和关卡 */}
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {livesDisplay.map((alive, i) => (
                  <span key={i} className="text-lg" style={{ opacity: alive ? 1 : 0.25 }}>
                    {alive ? '❤️' : '🖤'}
                  </span>
                ))}
              </div>
              <div
                className="px-3 py-1 rounded-full text-sm font-bold"
                style={{
                  backgroundColor: 'rgba(108,92,231,0.3)',
                  color: NEON_COLORS.neonPurple,
                  border: `1px solid ${NEON_COLORS.neonPurple}50`,
                }}
              >
                Lv.{gameState.level}
              </div>
            </div>
          </div>

          {/* 活跃道具效果 */}
          <AnimatePresence>
            {activeEffectNames.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex gap-2 mt-3 overflow-hidden"
              >
                {activeEffectNames.map((effect, i) => (
                  <motion.span
                    key={`${effect.name}-${i}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: `${effect.color}30`,
                      color: effect.color,
                      border: `1px solid ${effect.color}60`,
                    }}
                  >
                    {effect.name}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 游戏画布 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: `0 0 40px ${NEON_COLORS.neonPink}20, inset 0 0 60px rgba(0,0,0,0.5)`,
          border: `2px solid ${NEON_COLORS.neonPink}30`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block cursor-none"
          style={{ backgroundColor: NEON_COLORS.darkPurple }}
          onClick={handleStart}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        />

        {/* 空闲状态覆盖层 */}
        {gameState.status === 'idle' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(15,15,26,0.85)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="text-5xl font-bold mb-2"
              style={{
                color: NEON_COLORS.neonPink,
                textShadow: `0 0 30px ${NEON_COLORS.neonPink}`,
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              打砖块增强版
            </motion.div>
            <div className="text-lg mb-8" style={{ color: NEON_COLORS.gold }}>
              Enhanced Breakout
            </div>

            {/* 道具说明 */}
            <div className="grid grid-cols-2 gap-3 mb-8 px-8">
              {Object.entries(POWERUP_LABELS).map(([key, info]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: `${info.color}15`,
                    border: `1px solid ${info.color}30`,
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: info.color,
                      color: '#fff',
                    }}
                  >
                    {info.name[0]}
                  </div>
                  <span className="text-sm" style={{ color: info.color }}>
                    {info.name}
                  </span>
                </div>
              ))}
            </div>

            <motion.button
              onClick={handleStart}
              className="px-8 py-3 rounded-xl font-bold text-lg"
              style={{
                backgroundColor: NEON_COLORS.neonPink,
                color: NEON_COLORS.white,
                boxShadow: `0 0 25px ${NEON_COLORS.neonPink}`,
              }}
              whileHover={{ scale: 1.08, boxShadow: `0 0 40px ${NEON_COLORS.neonPink}` }}
              whileTap={{ scale: 0.95 }}
            >
              点击开始
            </motion.button>

            <div className="mt-4 text-sm opacity-50" style={{ color: NEON_COLORS.gold }}>
              鼠标控制球拍 | 空格发射球
            </div>
          </motion.div>
        )}

        {/* 游戏结束覆盖层 */}
        {gameState.status === 'gameover' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ backgroundColor: 'rgba(15,15,26,0.92)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="text-4xl font-bold mb-4"
              style={{
                color: NEON_COLORS.neonPink,
                textShadow: `0 0 20px ${NEON_COLORS.neonPink}`,
              }}
              initial={{ y: -30 }}
              animate={{ y: 0 }}
            >
              游戏结束
            </motion.div>

            <div className="text-xl mb-2" style={{ color: NEON_COLORS.gold }}>
              最终得分: {gameState.score}
            </div>
            <div className="text-base mb-2" style={{ color: NEON_COLORS.neonBlue }}>
              到达关卡: {gameState.level}
            </div>
            {gameState.score >= highScore && gameState.score > 0 && (
              <motion.div
                className="text-lg font-bold mb-4"
                style={{ color: NEON_COLORS.neonGreen }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                新纪录!
              </motion.div>
            )}

            <div className="flex gap-4 mt-4">
              <motion.button
                onClick={handleRestart}
                className="px-6 py-3 rounded-xl font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonPink,
                  color: NEON_COLORS.white,
                  boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                再来一次
              </motion.button>
              <motion.button
                onClick={handleGoHome}
                className="px-6 py-3 rounded-xl font-bold"
                style={{
                  backgroundColor: NEON_COLORS.darkPurple,
                  color: NEON_COLORS.neonBlue,
                  border: `2px solid ${NEON_COLORS.neonBlue}`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                返回首页
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* 底部提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-center text-sm opacity-40"
        style={{ color: NEON_COLORS.gold }}
      >
        鼠标移动控制球拍 | 清除所有砖块进入下一关
      </motion.div>
    </div>
  );
}
