import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../../utils/constants';
import { RhythmTapEngine, Note } from './engine';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 700;
const LANE_COUNT = 4;
const LANE_WIDTH = 80;
const NOTE_SIZE = 60;
const TARGET_Y = 550;
const HIT_LINE_Y = 550;

const LANE_COLORS = ['#FF6B9D', '#00D2FF', '#A855F7', '#22C55E'];

export default function RhythmTap() {
  const navigate = useNavigate();
  const [engine] = useState(() => new RhythmTapEngine());
  const [state, setState] = useState(() => engine.getState());
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [highScore, setHighScore] = useLocalStorage(STORAGE_KEYS.RHYTHM_TAP || 'rhythmtap_highscore', 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [laneEffects, setLaneEffects] = useState<{ lane: number; result: string; key: number }[]>([]);
  const effectKeyRef = useRef(0);

  const drawLane = useCallback((ctx: CanvasRenderingContext2D, lane: number, x: number) => {
    const laneColor = LANE_COLORS[lane];

    const gradient = ctx.createLinearGradient(x, 0, x + LANE_WIDTH, 0);
    gradient.addColorStop(0, 'rgba(26, 26, 46, 0.3)');
    gradient.addColorStop(0.5, `rgba(${parseInt(laneColor.slice(1, 3), 16)}, ${parseInt(laneColor.slice(3, 5), 16)}, ${parseInt(laneColor.slice(5, 7), 16)}, 0.1)`);
    gradient.addColorStop(1, 'rgba(26, 26, 46, 0.3)');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, LANE_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + LANE_WIDTH, 0);
    ctx.lineTo(x + LANE_WIDTH, CANVAS_HEIGHT);
    ctx.stroke();
  }, []);

  const drawHitLine = useCallback((ctx: CanvasRenderingContext2D) => {
    const centerX = CANVAS_WIDTH / 2;
    const gradient = ctx.createLinearGradient(0, HIT_LINE_Y - 30, 0, HIT_LINE_Y + 30);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - LANE_WIDTH * 2, HIT_LINE_Y - 30, LANE_WIDTH * 4, 60);

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(0, HIT_LINE_Y);
    ctx.lineTo(CANVAS_WIDTH, HIT_LINE_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, []);

  const drawNote = useCallback((ctx: CanvasRenderingContext2D, note: Note) => {
    const laneX = (CANVAS_WIDTH - LANE_COUNT * LANE_WIDTH) / 2 + note.lane * LANE_WIDTH + LANE_WIDTH / 2;
    const laneColor = LANE_COLORS[note.lane];

    if (note.isHit) {
      const elapsed = Date.now() - note.hitTime;
      const progress = elapsed / 300;
      const scale = 1 + progress * 0.5;
      const alpha = 1 - progress;

      ctx.save();
      ctx.globalAlpha = alpha;

      const gradient = ctx.createRadialGradient(
        laneX, note.y, 0,
        laneX, note.y, NOTE_SIZE * scale
      );
      gradient.addColorStop(0, laneColor);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(laneX, note.y, NOTE_SIZE * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return;
    }

    ctx.save();

    const gradient = ctx.createRadialGradient(
      laneX - NOTE_SIZE / 4, note.y - NOTE_SIZE / 4, 0,
      laneX, note.y, NOTE_SIZE
    );
    gradient.addColorStop(0, laneColor);
    gradient.addColorStop(1, shadeColor(laneColor, -40));

    ctx.fillStyle = gradient;
    ctx.shadowColor = laneColor;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(laneX, note.y, NOTE_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText('♪', laneX, note.y);

    ctx.restore();
  }, []);

  const drawLaneEffect = useCallback((ctx: CanvasRenderingContext2D, lane: number, result: string) => {
    const laneX = (CANVAS_WIDTH - LANE_COUNT * LANE_WIDTH) / 2 + lane * LANE_WIDTH + LANE_WIDTH / 2;
    const laneColor = LANE_COLORS[lane];

    let text = '';
    let color = '';

    switch (result) {
      case 'perfect':
        text = 'PERFECT!';
        color = '#00FFFF';
        break;
      case 'great':
        text = 'GREAT!';
        color = '#00FF00';
        break;
      case 'good':
        text = 'GOOD';
        color = '#FFFF00';
        break;
      case 'miss':
        text = 'MISS';
        color = '#FF4444';
        break;
    }

    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillText(text, laneX, HIT_LINE_Y - 60);
    ctx.shadowBlur = 0;
  }, []);

  const shadeColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const startX = (CANVAS_WIDTH - LANE_COUNT * LANE_WIDTH) / 2;
    for (let i = 0; i < LANE_COUNT; i++) {
      drawLane(ctx, i, startX + i * LANE_WIDTH);
    }

    drawHitLine(ctx);

    state.notes.forEach(note => {
      drawNote(ctx, note);
    });

    laneEffects.forEach(effect => {
      drawLaneEffect(ctx, effect.lane, effect.result);
    });

    const laneKeys = ['D', 'F', 'J', 'K'];
    for (let i = 0; i < LANE_COUNT; i++) {
      const laneX = startX + i * LANE_WIDTH + LANE_WIDTH / 2;
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = LANE_COLORS[i];
      ctx.shadowColor = LANE_COLORS[i];
      ctx.shadowBlur = 10;
      ctx.fillText(laneKeys[i], laneX, CANVAS_HEIGHT - 40);
    }
    ctx.shadowBlur = 0;

    if (gameStatus === 'idle') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#A855F7';
      ctx.shadowColor = '#A855F7';
      ctx.shadowBlur = 20;
      ctx.fillText('🎵 节奏点击 🎵', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

      ctx.font = '20px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.fillText('使用 D F J K 键跟随节奏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

      ctx.font = '18px Arial';
      ctx.fillStyle = '#888888';
      ctx.shadowBlur = 0;
      ctx.fillText('点击开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

      const keysY = CANVAS_HEIGHT / 2 + 100;
      const keyStartX = CANVAS_WIDTH / 2 - 150;
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = LANE_COLORS[i];
        ctx.shadowColor = LANE_COLORS[i];
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(keyStartX + i * 80, keysY, 60, 40, 8);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(laneKeys[i], keyStartX + i * 80 + 30, keysY + 20);
      }
      ctx.shadowBlur = 0;
    }

    if (gameStatus === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#A855F7';
      ctx.shadowColor = '#A855F7';
      ctx.shadowBlur = 20;
      ctx.fillText('🎉 游戏结束! 🎉', CANVAS_WIDTH / 2, 100);

      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.fillText(`得分: ${state.score}`, CANVAS_WIDTH / 2, 170);

      ctx.font = '18px Arial';
      ctx.fillStyle = '#00FFFF';
      ctx.shadowBlur = 10;
      ctx.fillText(`完美: ${state.perfectCount}`, CANVAS_WIDTH / 2, 220);
      ctx.fillStyle = '#00FF00';
      ctx.fillText(`很棒: ${state.greatCount}`, CANVAS_WIDTH / 2, 250);
      ctx.fillStyle = '#FFFF00';
      ctx.fillText(`不错: ${state.goodCount}`, CANVAS_WIDTH / 2, 280);
      ctx.fillStyle = '#FF4444';
      ctx.fillText(`失误: ${state.missCount}`, CANVAS_WIDTH / 2, 310);

      ctx.fillStyle = '#A855F7';
      ctx.shadowColor = '#A855F7';
      ctx.fillText(`最大连击: ${state.maxCombo}`, CANVAS_WIDTH / 2, 350);
      ctx.shadowBlur = 0;
    }
  }, [state, gameStatus, drawLane, drawHitLine, drawNote, drawLaneEffect, laneEffects]);

  useEffect(() => {
    if (gameStatus !== 'playing') {
      render();
      return;
    }

    const interval = setInterval(() => {
      engine.tick();
      setState({ ...engine.getState() });

      if (engine.checkGameOver()) {
        setGameStatus('gameover');
        if (state.score > highScore) {
          setHighScore(state.score);
        }
      }
    }, 16);

    const animationId = requestAnimationFrame(function animate() {
      render();
      if (gameStatus === 'playing') {
        requestAnimationFrame(animate);
      }
    });

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationId);
    };
  }, [gameStatus, engine, render, state.score, highScore, setHighScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      const keyMap: { [key: string]: number } = {
        'd': 0, 'D': 0,
        'f': 1, 'F': 1,
        'j': 2, 'J': 2,
        'k': 3, 'K': 3
      };

      const lane = keyMap[e.key];
      if (lane !== undefined) {
        const result = engine.handleHit(lane);
        setState({ ...engine.getState() });

        if (result !== 'miss') {
          setLaneEffects(prev => [...prev.slice(-5), { lane, result, key: effectKeyRef.current++ }]);
          setTimeout(() => {
            setLaneEffects(prev => prev.slice(1));
          }, 300);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, engine]);

  const handleCanvasClick = useCallback(() => {
    if (gameStatus === 'idle') {
      setGameStatus('playing');
      engine.reset();
      setState({ ...engine.getState() });
    }
  }, [gameStatus, engine]);

  const handleStart = useCallback(() => {
    engine.reset();
    setState({ ...engine.getState() });
    setGameStatus('playing');
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setState({ ...engine.getState() });
    setGameStatus('playing');
  }, [engine]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div
      className="flex flex-col items-center gap-4 p-4 rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        minHeight: '100vh'
      }}
    >
      <div className="flex items-center justify-between w-full max-w-[600px] px-4 pt-4">
        <motion.button
          onClick={handleBack}
          className="px-4 py-2 rounded-lg font-bold text-sm transition-all"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.8)',
            color: '#00D2FF',
            boxShadow: '0 0 10px rgba(0, 210, 255, 0.3)',
            border: '1px solid rgba(0, 210, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回主页
        </motion.button>

        <div className="flex items-center gap-6">
          <div
            className="px-4 py-2 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}
          >
            <div className="text-xs opacity-70" style={{ color: '#FFD700' }}>最高分</div>
            <div className="text-xl font-bold" style={{ color: '#FFD700' }}>{highScore}</div>
          </div>

          <div
            className="px-4 py-2 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 107, 157, 0.3)'
            }}
          >
            <div className="text-xs opacity-70" style={{ color: '#FF6B9D' }}>当前得分</div>
            <div className="text-xl font-bold" style={{ color: '#FF6B9D' }}>{state.score}</div>
          </div>

          <div
            className="px-4 py-2 rounded-lg text-center"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 210, 255, 0.3)'
            }}
          >
            <div className="text-xs opacity-70" style={{ color: '#00D2FF' }}>剩余时间</div>
            <div
              className="text-xl font-bold"
              style={{ color: state.gameOver ? '#FF4444' : '#00D2FF' }}
            >
              {state.gameOver ? '结束' : '60s'}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)',
          border: '2px solid rgba(168, 85, 247, 0.3)'
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          className="cursor-pointer"
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
        />

        <AnimatePresence>
          {gameStatus === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{
                backgroundColor: 'rgba(15, 15, 26, 0.9)',
                backdropFilter: 'blur(10px)'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-5xl mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                🎵
              </motion.div>

              <motion.h2
                className="text-4xl font-bold mb-2"
                style={{ color: '#A855F7' }}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                游戏结束!
              </motion.h2>

              <motion.div
                className="text-3xl font-bold mb-4"
                style={{ color: '#FFD700' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                得分: {state.score}
              </motion.div>

              <motion.div
                className="grid grid-cols-2 gap-4 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-center">
                  <div className="text-sm" style={{ color: '#00FFFF' }}>完美</div>
                  <div className="text-xl font-bold" style={{ color: '#00FFFF' }}>{state.perfectCount}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm" style={{ color: '#00FF00' }}>很棒</div>
                  <div className="text-xl font-bold" style={{ color: '#00FF00' }}>{state.greatCount}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm" style={{ color: '#FFFF00' }}>不错</div>
                  <div className="text-xl font-bold" style={{ color: '#FFFF00' }}>{state.goodCount}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm" style={{ color: '#FF4444' }}>失误</div>
                  <div className="text-xl font-bold" style={{ color: '#FF4444' }}>{state.missCount}</div>
                </div>
              </motion.div>

              <motion.div
                className="text-lg mb-4"
                style={{ color: '#A855F7' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                最大连击: {state.maxCombo}
              </motion.div>

              {state.score >= highScore && state.score > 0 && (
                <motion.div
                  className="text-xl font-bold mb-4"
                  style={{ color: '#00FF88' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  🎉 新纪录! 🎉
                </motion.div>
              )}

              <motion.div
                className="flex gap-4"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={handleRestart}
                  className="px-8 py-3 rounded-xl font-bold text-lg transition-all"
                  style={{
                    backgroundColor: '#A855F7',
                    color: '#FFFFFF',
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  再来一局
                </motion.button>

                <motion.button
                  onClick={handleBack}
                  className="px-8 py-3 rounded-xl font-bold text-lg transition-all"
                  style={{
                    backgroundColor: 'rgba(26, 26, 46, 0.8)',
                    color: '#00D2FF',
                    border: '2px solid #00D2FF',
                    backdropFilter: 'blur(10px)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  返回主页
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        className="mt-4 px-6 py-3 rounded-xl text-center"
        style={{
          backgroundColor: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(168, 85, 247, 0.3)'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-sm opacity-70" style={{ color: '#A855F7' }}>
          {gameStatus === 'idle' && '点击画布开始游戏'}
          {gameStatus === 'playing' && '使用 D F J K 键跟随节奏点击!'}
          {gameStatus === 'gameover' && '按"再来一局"重新开始'}
        </div>
      </motion.div>

      {gameStatus === 'playing' && state.combo >= 3 && (
        <motion.div
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl"
          style={{
            backgroundColor: 'rgba(26, 26, 46, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(57, 255, 20, 0.3)'
          }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-6">
            <div className="text-sm" style={{ color: '#39FF14' }}>
              连击: <span className="font-bold text-lg">{state.combo}</span>
            </div>
            <motion.div
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{
                backgroundColor: 'rgba(168, 85, 247, 0.3)',
                color: '#A855F7',
                border: '1px solid #A855F7'
              }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              🔥 COMBO!
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
