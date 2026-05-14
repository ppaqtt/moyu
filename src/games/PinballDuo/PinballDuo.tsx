import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../utils/constants';
import { PinballDuoEngine, PinballDuoState, PINBALL_DUO_CONSTANTS } from './engine';

const { CANVAS_WIDTH, CANVAS_HEIGHT } = PINBALL_DUO_CONSTANTS;

type GameStatus = 'idle' | 'playing' | 'gameover';

interface HighScores {
  bestScore: number;
}

const COLORS = {
  PADDLE1: '#00d2ff',
  PADDLE2: '#ff6b9d',
  BALL: '#ffd700',
  GOLD: '#ffd700',
  WHITE: '#ffffff',
  GLASS_BG: 'rgba(26, 26, 46, 0.8)',
  BORDER: 'rgba(108, 92, 231, 0.3)',
  BG_START: '#0f0f1a',
  BG_MID: '#1a1a2e',
  BG_END: '#16213e'
};

export default function PinballDuo() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PinballDuoEngine | null>(null);
  const keysRef = useRef<{ p1Up: boolean; p1Down: boolean; p2Up: boolean; p2Down: boolean }>({
    p1Up: false,
    p1Down: false,
    p2Up: false,
    p2Down: false
  });

  const [gameState, setGameState] = useState<GameStatus>('idle');
  const [state, setState] = useState<PinballDuoState | null>(null);
  const [highScores, setHighScores] = useLocalStorage<HighScores>(STORAGE_KEYS.PINBALL_DUO || 'pinball_duo', {
    bestScore: 0
  });

  useEffect(() => {
    engineRef.current = new PinballDuoEngine();
    setState(engineRef.current.getState());
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!engineRef.current) return;

    switch (e.key.toLowerCase()) {
      case 'q':
        if (!keysRef.current.p1Down) {
          keysRef.current.p1Down = true;
          engineRef.current.setPaddle1Up(false);
        }
        e.preventDefault();
        break;
      case 'e':
        if (!keysRef.current.p1Up) {
          keysRef.current.p1Up = true;
          engineRef.current.setPaddle1Up(true);
        }
        e.preventDefault();
        break;
      case 'o':
        if (!keysRef.current.p2Down) {
          keysRef.current.p2Down = true;
          engineRef.current.setPaddle2Up(false);
        }
        e.preventDefault();
        break;
      case 'p':
        if (!keysRef.current.p2Up) {
          keysRef.current.p2Up = true;
          engineRef.current.setPaddle2Up(true);
        }
        e.preventDefault();
        break;
      case ' ':
        if (gameState === 'idle') {
          engineRef.current.start();
          setGameState('playing');
        }
        e.preventDefault();
        break;
      case 'escape':
        if (gameState === 'playing') {
          engineRef.current.pause();
          setGameState('idle');
        }
        e.preventDefault();
        break;
    }
  }, [gameState]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!engineRef.current) return;

    switch (e.key.toLowerCase()) {
      case 'q':
        keysRef.current.p1Down = false;
        break;
      case 'e':
        keysRef.current.p1Up = false;
        break;
      case 'o':
        keysRef.current.p2Down = false;
        break;
      case 'p':
        keysRef.current.p2Up = false;
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleTick = useCallback(() => {
    if (!engineRef.current) return;

    engineRef.current.tick();
    const newState = engineRef.current.getState();
    setState(newState);

    if (newState.ballLost && gameState === 'playing') {
      setHighScores(prev => ({
        bestScore: Math.max(prev.bestScore, engineRef.current?.getCombinedScore() || 0)
      }));
    }
  }, [gameState, setHighScores]);

  useGameLoop({
    callback: handleTick,
    delay: 16,
    enabled: gameState === 'playing'
  });

  useEffect(() => {
    if (!canvasRef.current || !state) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = COLORS.BG_START;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, COLORS.BG_START);
    bgGrad.addColorStop(0.5, COLORS.BG_MID);
    bgGrad.addColorStop(1, COLORS.BG_END);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(108, 92, 231, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    ctx.strokeStyle = COLORS.BORDER;
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);

    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = 'rgba(108, 92, 231, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const bumper of state.bumpers) {
      const isHit = bumper.hitTimer > 0;
      const glowSize = bumper.radius + (isHit ? 15 : 8);

      const glowGrad = ctx.createRadialGradient(
        bumper.x, bumper.y, bumper.radius * 0.3,
        bumper.x, bumper.y, glowSize
      );
      glowGrad.addColorStop(0, isHit ? COLORS.WHITE : bumper.color);
      glowGrad.addColorStop(0.5, (isHit ? COLORS.BALL : bumper.color) + '80');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(bumper.x, bumper.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isHit ? COLORS.WHITE : bumper.color;
      ctx.beginPath();
      ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bumper.x, bumper.y, bumper.radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const obs of state.obstacles) {
      const isHit = obs.hitTimer > 0;

      ctx.shadowColor = obs.color;
      ctx.shadowBlur = isHit ? 20 : 10;

      ctx.fillStyle = isHit ? COLORS.WHITE : obs.color;
      ctx.beginPath();
      ctx.roundRect(
        obs.x - obs.width / 2,
        obs.y - obs.height / 2,
        obs.width,
        obs.height,
        5
      );
      ctx.fill();

      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const drawPaddle = (paddle: typeof state.paddle1, color: string) => {
      ctx.save();
      ctx.translate(paddle.x, paddle.y);
      ctx.rotate(paddle.angle);

      ctx.shadowColor = color;
      ctx.shadowBlur = paddle.isUp ? 25 : 15;

      const grad = ctx.createLinearGradient(-paddle.width / 2, 0, paddle.width / 2, 0);
      grad.addColorStop(0, color + 'aa');
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, color + 'aa');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(-paddle.width / 2, -paddle.height / 2, paddle.width, paddle.height, 8);
      ctx.fill();

      ctx.fillStyle = COLORS.WHITE;
      ctx.beginPath();
      ctx.arc(0, 0, paddle.height / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.restore();
    };

    drawPaddle(state.paddle1, COLORS.PADDLE1);
    drawPaddle(state.paddle2, COLORS.PADDLE2);

    if (state.ball.active) {
      const ballGlow = ctx.createRadialGradient(
        state.ball.x, state.ball.y, 0,
        state.ball.x, state.ball.y, state.ball.radius * 4
      );
      ballGlow.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      ballGlow.addColorStop(0.3, COLORS.BALL + '60');
      ballGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = ballGlow;
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, state.ball.radius * 4, 0, Math.PI * 2);
      ctx.fill();

      const ballGrad = ctx.createRadialGradient(
        state.ball.x - state.ball.radius * 0.3,
        state.ball.y - state.ball.radius * 0.3,
        state.ball.radius * 0.1,
        state.ball.x,
        state.ball.y,
        state.ball.radius
      );
      ballGrad.addColorStop(0, COLORS.WHITE);
      ballGrad.addColorStop(0.7, '#e0e0e0');
      ballGrad.addColorStop(1, '#a0a0a0');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(
        state.ball.x - state.ball.radius * 0.25,
        state.ball.y - state.ball.radius * 0.25,
        state.ball.radius * 0.3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

  }, [state]);

  const handleStart = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.start();
    setGameState('playing');
  }, []);

  const handleRestart = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.reset();
    setState(engineRef.current.getState());
    keysRef.current = { p1Up: false, p1Down: false, p2Up: false, p2Down: false };
    setGameState('idle');
  }, []);

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const combinedScore = state ? state.scores.player1.score + state.scores.player2.score : 0;
  const maxCombo = state ? Math.max(state.scores.player1.combo, state.scores.player2.combo) : 0;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{
        background: `linear-gradient(135deg, ${COLORS.BG_START} 0%, ${COLORS.BG_MID} 50%, ${COLORS.BG_END} 100%)`
      }}
    >
      <motion.div
        className="glass-card rounded-3xl p-8 max-w-4xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: COLORS.GLASS_BG,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${COLORS.BORDER}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <motion.button
            onClick={handleExit}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300"
            style={{
              backgroundColor: COLORS.GLASS_BG,
              color: COLORS.PADDLE1,
              border: `1px solid ${COLORS.PADDLE1}50`
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${COLORS.PADDLE1}50` }}
            whileTap={{ scale: 0.95 }}
          >
            返回
          </motion.button>

          <motion.h1
            className="text-3xl font-bold"
            style={{
              background: `linear-gradient(135deg, ${COLORS.PADDLE1}, ${COLORS.PADDLE2})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            双人弹珠台
          </motion.h1>

          <div className="text-center">
            <div className="text-xs opacity-60" style={{ color: COLORS.GOLD }}>最高分</div>
            <div className="text-lg font-bold" style={{ color: COLORS.GOLD }}>{highScores.bestScore}</div>
          </div>
        </div>

        <div className="flex justify-between gap-4 mb-4">
          <div
            className="flex-1 p-4 rounded-xl text-center"
            style={{
              background: `${COLORS.PADDLE1}15`,
              border: `1px solid ${COLORS.PADDLE1}50`
            }}
          >
            <div className="text-sm opacity-70 mb-1" style={{ color: COLORS.GOLD }}>P1 分数</div>
            <motion.div
              className="text-2xl font-bold"
              style={{ color: COLORS.PADDLE1 }}
              key={state?.scores.player1.score}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {state?.scores.player1.score || 0}
            </motion.div>
            <div className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              挡板命中: {state?.scores.player1.paddleHits || 0}
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              障碍命中: {state?.scores.player1.bumperHits || 0}
            </div>
          </div>

          <div
            className="flex-1 p-4 rounded-xl text-center"
            style={{
              background: `${COLORS.BALL}15`,
              border: `1px solid ${COLORS.BALL}50`
            }}
          >
            <div className="text-sm opacity-70 mb-1" style={{ color: COLORS.GOLD }}>合作连击</div>
            <motion.div
              className="text-2xl font-bold"
              style={{ color: COLORS.BALL }}
              key={maxCombo}
              animate={maxCombo > 1 ? { scale: [1, 1.2, 1] } : {}}
            >
              {maxCombo}x
            </motion.div>
            <div className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              总分: {combinedScore}
            </div>
          </div>

          <div
            className="flex-1 p-4 rounded-xl text-center"
            style={{
              background: `${COLORS.PADDLE2}15`,
              border: `1px solid ${COLORS.PADDLE2}50`
            }}
          >
            <div className="text-sm opacity-70 mb-1" style={{ color: COLORS.GOLD }}>P2 分数</div>
            <motion.div
              className="text-2xl font-bold"
              style={{ color: COLORS.PADDLE2 }}
              key={state?.scores.player2.score}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {state?.scores.player2.score || 0}
            </motion.div>
            <div className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              挡板命中: {state?.scores.player2.paddleHits || 0}
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              障碍命中: {state?.scores.player2.bumperHits || 0}
            </div>
          </div>
        </div>

        <div className="relative flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-2xl"
            style={{
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.5), inset 0 0 50px rgba(0, 0, 0, 0.3)',
              border: `2px solid ${COLORS.BORDER}`
            }}
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
                  className="text-4xl font-bold mb-4"
                  style={{ color: COLORS.BALL }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  双人弹珠台
                </motion.div>
                <div className="text-lg mb-8 text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <div>合作配合，让弹珠弹得更高！</div>
                  <div className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    撞击障碍物和挡板得分，连续命中有连击加成！
                  </div>
                </div>
                <motion.button
                  onClick={handleStart}
                  className="px-8 py-4 rounded-xl font-bold text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.PADDLE1}, ${COLORS.PADDLE2})`,
                    color: COLORS.WHITE,
                    boxShadow: `0 0 30px ${COLORS.PADDLE1}80`
                  }}
                  whileHover={{ scale: 1.05, boxShadow: `0 0 40px ${COLORS.PADDLE1}` }}
                  whileTap={{ scale: 0.95 }}
                >
                  开始游戏 (空格)
                </motion.button>
                <div className="mt-6 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  按 ESC 暂停 | 空格 开始
                </div>
              </motion.div>
            )}

            {gameState === 'gameover' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
                style={{ backgroundColor: 'rgba(15, 15, 26, 0.95)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-3xl font-bold mb-4"
                  style={{ color: COLORS.BALL }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                >
                  游戏结束！
                </motion.div>

                <div className="flex gap-8 mb-6">
                  <div className="text-center">
                    <div className="text-sm opacity-70" style={{ color: COLORS.PADDLE1 }}>P1 最终得分</div>
                    <div className="text-2xl font-bold" style={{ color: COLORS.PADDLE1 }}>
                      {state?.scores.player1.score || 0}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm opacity-70" style={{ color: COLORS.GOLD }}>合作总分</div>
                    <div className="text-2xl font-bold" style={{ color: COLORS.GOLD }}>
                      {combinedScore}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm opacity-70" style={{ color: COLORS.PADDLE2 }}>P2 最终得分</div>
                    <div className="text-2xl font-bold" style={{ color: COLORS.PADDLE2 }}>
                      {state?.scores.player2.score || 0}
                    </div>
                  </div>
                </div>

                {combinedScore >= highScores.bestScore && combinedScore > 0 && (
                  <motion.div
                    className="text-lg mb-4"
                    style={{ color: '#39ff14' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    新纪录！
                  </motion.div>
                )}

                <div className="flex gap-4">
                  <motion.button
                    onClick={handleRestart}
                    className="px-6 py-3 rounded-xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.PADDLE1}, ${COLORS.PADDLE2})`,
                      color: COLORS.WHITE,
                      boxShadow: `0 0 20px ${COLORS.PADDLE1}80`
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    再来一局
                  </motion.button>
                  <motion.button
                    onClick={handleExit}
                    className="px-6 py-3 rounded-xl font-bold"
                    style={{
                      backgroundColor: COLORS.GLASS_BG,
                      color: COLORS.PADDLE1,
                      border: `1px solid ${COLORS.PADDLE1}50`
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    返回首页
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-between mt-6 text-sm">
          <div className="text-center">
            <div className="font-bold mb-1" style={{ color: COLORS.PADDLE1 }}>玩家 1</div>
            <div className="flex gap-2 justify-center">
              <kbd
                className="px-3 py-1 rounded text-xs font-mono"
                style={{
                  background: `${COLORS.PADDLE1}30`,
                  color: COLORS.WHITE,
                  border: `1px solid ${COLORS.PADDLE1}50`
                }}
              >
                Q
              </kbd>
              <kbd
                className="px-3 py-1 rounded text-xs font-mono"
                style={{
                  background: `${COLORS.PADDLE1}30`,
                  color: COLORS.WHITE,
                  border: `1px solid ${COLORS.PADDLE1}50`
                }}
              >
                E
              </kbd>
            </div>
            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Q下拍 / E上拍
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs mb-1" style={{ color: COLORS.GOLD }}>合作连击</div>
            <div className="text-lg font-bold" style={{ color: COLORS.GOLD }}>
              {maxCombo > 0 ? `${maxCombo}x` : '-'}
            </div>
          </div>

          <div className="text-center">
            <div className="font-bold mb-1" style={{ color: COLORS.PADDLE2 }}>玩家 2</div>
            <div className="flex gap-2 justify-center">
              <kbd
                className="px-3 py-1 rounded text-xs font-mono"
                style={{
                  background: `${COLORS.PADDLE2}30`,
                  color: COLORS.WHITE,
                  border: `1px solid ${COLORS.PADDLE2}50`
                }}
              >
                O
              </kbd>
              <kbd
                className="px-3 py-1 rounded text-xs font-mono"
                style={{
                  background: `${COLORS.PADDLE2}30`,
                  color: COLORS.WHITE,
                  border: `1px solid ${COLORS.PADDLE2}50`
                }}
              >
                P
              </kbd>
            </div>
            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              O下拍 / P上拍
            </div>
          </div>
        </div>

        <div
          className="mt-4 p-3 rounded-lg text-center text-xs"
          style={{
            background: 'rgba(108, 92, 231, 0.1)',
            border: '1px solid rgba(108, 92, 231, 0.2)',
            color: 'rgba(255,255,255,0.6)'
          }}
        >
          <div>撞击障碍物 +50分 | 挡板弹射 +10分 | 存活时间奖励</div>
          <div className="mt-1">连续命中增加连击加成（最高1.5倍）</div>
        </div>
      </motion.div>
    </div>
  );
}
