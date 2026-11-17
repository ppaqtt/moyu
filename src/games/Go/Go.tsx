import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';
import {
  GoEngine,
  chooseAIMove,
  starPoints,
  KOMI,
  type AIDifficulty,
  type BoardSize,
  type Player,
} from './engine';

const CANVAS = 640;
const PADDING = 42;
const LETTERS = 'ABCDEFGHJKLMNOPQRST';

type Phase = 'idle' | 'playing' | 'gameover';
type Mode = 'ai' | 'pvp';

const DIFFICULTY_LABEL: Record<AIDifficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

export default function Go() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GoEngine | null>(null);
  if (!engineRef.current) engineRef.current = new GoEngine(9);
  const aiTimerRef = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>('idle');
  const [mode, setMode] = useState<Mode>('ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [boardSize, setBoardSize] = useState<BoardSize>(9);
  const [tick, setTick] = useState(0);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = engine.size;
    const cell = (CANVAS - PADDING * 2) / (size - 1);

    ctx.clearRect(0, 0, CANVAS, CANVAS);
    const wood = ctx.createLinearGradient(0, 0, CANVAS, CANVAS);
    wood.addColorStop(0, '#e8c07a');
    wood.addColorStop(0.5, '#dfae63');
    wood.addColorStop(1, '#cd9550');
    ctx.fillStyle = wood;
    ctx.fillRect(0, 0, CANVAS, CANVAS);

    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#7a4a1c';
    for (let i = 0; i < 26; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 26 + (i % 3) * 4);
      ctx.bezierCurveTo(180, i * 26 + 12, 420, i * 26 - 10, CANVAS, i * 26 + 6);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(58, 38, 18, 0.85)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < size; i++) {
      const p = PADDING + i * cell;
      ctx.beginPath();
      ctx.moveTo(PADDING, p);
      ctx.lineTo(CANVAS - PADDING, p);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p, PADDING);
      ctx.lineTo(p, CANVAS - PADDING);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(50, 32, 14, 0.9)';
    for (const star of starPoints(size)) {
      ctx.beginPath();
      ctx.arc(PADDING + star.x * cell, PADDING + star.y * cell, size >= 13 ? 3.6 : 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(60, 40, 18, 0.75)';
    ctx.font = '600 13px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < size; i++) {
      ctx.fillText(LETTERS[i], PADDING + i * cell, CANVAS - PADDING + 22);
      ctx.fillText(String(size - i), PADDING - 24, PADDING + i * cell);
    }
    ctx.textAlign = 'right';
    ctx.fillText('路', PADDING - 24, CANVAS - PADDING + 22);

    const radius = cell * 0.465;
    const drawStone = (x: number, y: number, player: Player, alpha = 1) => {
      const cx = PADDING + x * cell;
      const cy = PADDING + y * cell;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.ellipse(cx + 2, cy + 4, radius * 0.95, radius * 0.85, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(40, 24, 8, 0.35)';
      ctx.fill();

      const grad = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.4,
        radius * 0.15,
        cx,
        cy,
        radius,
      );
      if (player === 1) {
        grad.addColorStop(0, '#6b7280');
        grad.addColorStop(0.35, '#27272f');
        grad.addColorStop(1, '#050508');
      } else {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.65, '#eeeae2');
        grad.addColorStop(1, '#b9b2a6');
      }
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = player === 1 ? 'rgba(0,0,0,0.6)' : 'rgba(120,110,95,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    const state = engine.getState();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const stone = state.board[y * size + x];
        if (stone === 1 || stone === 2) drawStone(x, y, stone);
      }
    }

    if (state.lastMove !== null) {
      const lx = state.lastMove % size;
      const ly = Math.floor(state.lastMove / size);
      const cx = PADDING + lx * cell;
      const cy = PADDING + ly * cell;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.32, 0, Math.PI * 2);
      ctx.strokeStyle = state.board[state.lastMove] === 1 ? '#ffd166' : '#d1495b';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (hover && phase === 'playing' && !aiThinking) {
      const stone = engine.at(hover.x, hover.y);
      if (stone === 0 && engine.isLegal(hover.x, hover.y)) {
        drawStone(hover.x, hover.y, state.turn, 0.45);
      }
    }
  }, [hover, phase, aiThinking]);

  useEffect(() => {
    draw();
  }, [draw, tick, boardSize, phase]);

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
    };
  }, []);

  const finish = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.reason) setMessage(engine.reason);
    setPhase('gameover');
    refresh();
  }, [refresh]);

  const scheduleAI = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.gameOver) return;
    if (engine.turn !== 2) return;
    setAiThinking(true);
    if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
    aiTimerRef.current = window.setTimeout(() => {
      const state = engine.getState();
      if (state.gameOver) {
        setAiThinking(false);
        return;
      }
      const move = chooseAIMove(state.size, state.board, 2, state.koPoint, difficulty);
      if (!move) {
        engine.pass();
      } else {
        const result = engine.play(move.x, move.y);
        if (!result.ok) engine.pass();
      }
      setAiThinking(false);
      refresh();
      if (engine.gameOver) finish();
    }, 420);
  }, [difficulty, finish, refresh]);

  const startGame = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
    engine.reset(boardSize);
    setHover(null);
    setAiThinking(false);
    setMessage('');
    setPhase('playing');
    refresh();
  }, [boardSize, refresh]);

  const toBoardPoint = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      const engine = engineRef.current;
      if (!canvas || !engine) return null;
      const rect = canvas.getBoundingClientRect();
      const scale = CANVAS / rect.width;
      const px = (clientX - rect.left) * scale;
      const py = (clientY - rect.top) * scale;
      const size = engine.size;
      const cell = (CANVAS - PADDING * 2) / (size - 1);
      const x = Math.round((px - PADDING) / cell);
      const y = Math.round((py - PADDING) / cell);
      if (x < 0 || y < 0 || x >= size || y >= size) return null;
      const dx = px - (PADDING + x * cell);
      const dy = py - (PADDING + y * cell);
      if (Math.sqrt(dx * dx + dy * dy) > cell * 0.55) return null;
      return { x, y };
    },
    [],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const engine = engineRef.current;
      if (!engine || phase !== 'playing' || aiThinking) return;
      if (mode === 'ai' && engine.turn === 2) return;
      const point = toBoardPoint(e.clientX, e.clientY);
      if (!point) return;
      const result = engine.play(point.x, point.y);
      if (!result.ok) {
        setMessage(result.reason || '无法落子');
        window.setTimeout(() => setMessage(''), 1800);
        return;
      }
      setMessage('');
      refresh();
      if (mode === 'ai') scheduleAI();
    },
    [phase, aiThinking, mode, toBoardPoint, refresh, scheduleAI],
  );

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (phase !== 'playing' || aiThinking) return;
      const engine = engineRef.current;
      if (!engine) return;
      if (mode === 'ai' && engine.turn === 2) {
        setHover(null);
        return;
      }
      setHover(toBoardPoint(e.clientX, e.clientY));
    },
    [phase, aiThinking, mode, toBoardPoint],
  );

  const handlePass = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || phase !== 'playing' || aiThinking) return;
    engine.pass();
    setMessage('已停一手');
    window.setTimeout(() => setMessage(''), 1200);
    refresh();
    if (engine.gameOver) {
      finish();
      return;
    }
    if (mode === 'ai' && engine.turn === 2) scheduleAI();
  }, [phase, aiThinking, mode, refresh, finish, scheduleAI]);

  const handleUndo = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || aiThinking) return;
    const steps = mode === 'ai' && engine.turn === 1 ? 2 : 1;
    if (!engine.undo(steps)) return;
    if (engine.gameOver) {
      setPhase('playing');
      setMessage('');
    }
    refresh();
  }, [aiThinking, mode, refresh]);

  const handleResign = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || phase !== 'playing') return;
    engine.resign();
    if (engine.reason) setMessage(engine.reason);
    setPhase('gameover');
    refresh();
  }, [phase, refresh]);

  const handleFinish = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || phase !== 'playing') return;
    if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
    setAiThinking(false);
    engine.finish();
    if (engine.reason) setMessage(engine.reason);
    setPhase('gameover');
    refresh();
  }, [phase, refresh]);

  const handleSizeChange = useCallback(
    (size: BoardSize) => {
      if (size === boardSize) return;
      setBoardSize(size);
      if (phase === 'playing') {
        const engine = engineRef.current;
        if (engine) {
          if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
          setAiThinking(false);
          engine.reset(size);
        }
        setMessage('');
        setHover(null);
        refresh();
      }
    },
    [boardSize, phase, refresh],
  );

  const engine = engineRef.current;
  const state = engine.getState();
  const score = phase === 'gameover' ? engine.score() : null;
  const resultText =
    state.winner === 0 ? '和棋' : state.winner === 1 ? '黑方获胜' : '白方获胜';

  const panelStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.92), rgba(15, 15, 26, 0.96))',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  };

  const buttonStyle = (active: boolean, color = NEON_COLORS.neonCyan): React.CSSProperties => ({
    padding: '8px 15px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    color: active ? '#0b0b14' : 'rgba(255,255,255,0.78)',
    background: active ? color : 'rgba(255,255,255,0.07)',
    border: `1px solid ${active ? color : 'rgba(255,255,255,0.12)'}`,
    boxShadow: active ? `0 0 18px ${color}55` : 'none',
    transition: 'all 0.2s',
  });

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      }}
    >
      <motion.div
        className="rounded-3xl p-5 sm:p-7 w-full"
        style={{ ...panelStyle, maxWidth: 720 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <motion.button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl font-bold text-sm"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: NEON_COLORS.neonCyan,
              border: '1px solid rgba(0, 214, 255, 0.3)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            返回
          </motion.button>
          <div className="text-center">
            <h1
              className="text-3xl font-black tracking-wide"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.gold}, ${NEON_COLORS.neonPink})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              围棋
            </h1>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              提子 · 禁入点 · 劫争
            </div>
          </div>
          <div className="text-right text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
            <div>{boardSize} 路</div>
            <div>贴目 {KOMI[boardSize]}</div>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-center gap-2 mb-4 p-2 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          {([9, 13, 19] as BoardSize[]).map(size => (
            <button
              key={size}
              onClick={() => handleSizeChange(size)}
              style={buttonStyle(boardSize === size)}
            >
              {size} 路
            </button>
          ))}
          <span style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.12)' }} />
          {(['easy', 'medium', 'hard'] as AIDifficulty[]).map(level => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              style={buttonStyle(difficulty === level, NEON_COLORS.neonPink)}
            >
              {DIFFICULTY_LABEL[level]}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 mb-3 px-1">
          <div className="flex items-center gap-2">
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background:
                  state.turn === 1
                    ? 'radial-gradient(circle at 35% 30%, #6b7280, #050508)'
                    : 'radial-gradient(circle at 35% 30%, #ffffff, #b9b2a6)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            />
            <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {phase === 'idle'
                ? '等待开局'
                : aiThinking
                  ? 'AI 思考中...'
                  : state.turn === 1
                    ? mode === 'ai'
                      ? '轮到你（黑）'
                      : '轮到黑方'
                    : mode === 'ai'
                      ? 'AI（白）'
                      : '轮到白方'}
            </span>
          </div>
          <div className="flex gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <span>手数 {state.moveNumber}</span>
            <span>黑提 {state.captures.black}</span>
            <span>白提 {state.captures.white}</span>
          </div>
        </div>

        <motion.div
          className="relative mx-auto rounded-2xl overflow-hidden"
          style={{
            maxWidth: CANVAS,
            border: '2px solid rgba(255, 209, 102, 0.32)',
            boxShadow: '0 0 40px rgba(255, 209, 102, 0.16), inset 0 0 40px rgba(0,0,0,0.35)',
          }}
          onMouseLeave={() => setHover(null)}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS}
            height={CANVAS}
            onClick={handleClick}
            onMouseMove={handleMove}
            style={{ display: 'block', width: '100%', height: 'auto', cursor: phase === 'playing' ? 'crosshair' : 'default' }}
          />

          {message && phase === 'playing' && (
            <div
              className="absolute left-1/2 top-3 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-bold"
              style={{
                background: 'rgba(15, 15, 26, 0.9)',
                color: NEON_COLORS.neonPink,
                border: '1px solid rgba(255, 107, 157, 0.4)',
              }}
            >
              {message}
            </div>
          )}

          <AnimatePresence>
            {phase === 'idle' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center p-6"
                style={{ background: 'rgba(10, 10, 20, 0.86)', backdropFilter: 'blur(4px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2
                  className="text-3xl font-black mb-2"
                  style={{ color: NEON_COLORS.gold }}
                >
                  围棋对弈
                </h2>
                <p className="text-sm mb-6 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  支持 9 / 13 / 19 路，人机或双人同屏
                </p>

                <div className="flex gap-2 mb-4">
                  {(['ai', 'pvp'] as Mode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      style={buttonStyle(mode === m, NEON_COLORS.neonPurple)}
                    >
                      {m === 'ai' ? '人机对弈' : '双人同屏'}
                    </button>
                  ))}
                </div>

                {mode === 'ai' && (
                  <div className="flex gap-2 mb-6">
                    {(['easy', 'medium', 'hard'] as AIDifficulty[]).map(level => (
                      <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        style={buttonStyle(difficulty === level, NEON_COLORS.neonPink)}
                      >
                        {DIFFICULTY_LABEL[level]}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mb-7">
                  {([9, 13, 19] as BoardSize[]).map(size => (
                    <button
                      key={size}
                      onClick={() => setBoardSize(size)}
                      style={buttonStyle(boardSize === size)}
                    >
                      {size} 路
                    </button>
                  ))}
                </div>

                <motion.button
                  onClick={startGame}
                  className="px-9 py-3 rounded-2xl font-black text-lg"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple})`,
                    color: '#fff',
                    boxShadow: `0 0 30px ${NEON_COLORS.neonPink}66`,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  开始对局
                </motion.button>
              </motion.div>
            )}

            {phase === 'gameover' && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center p-6"
                style={{ background: 'rgba(10, 10, 20, 0.92)', backdropFilter: 'blur(4px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-4xl font-black mb-2" style={{ color: NEON_COLORS.gold }}>
                  {resultText}
                </div>
                <div className="text-sm mb-3 text-center" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {state.reason || '对局结束'}
                </div>
                {score && (
                  <div
                    className="px-5 py-3 rounded-2xl mb-6 text-sm text-center"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.8)',
                    }}
                  >
                    <div>
                      黑 {score.black} · 白 {score.white}（含贴目 {score.komi}）
                    </div>
                    <div style={{ color: NEON_COLORS.neonCyan }}>
                      盘面差 {score.margin.toFixed(1)} 子
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <motion.button
                    onClick={startGame}
                    className="px-6 py-3 rounded-xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonPurple})`,
                      color: '#fff',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    再来一局
                  </motion.button>
                  <motion.button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 rounded-xl font-bold"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      color: NEON_COLORS.neonCyan,
                      border: '1px solid rgba(0, 214, 255, 0.3)',
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
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <motion.button
            onClick={handleUndo}
            disabled={phase !== 'playing' || aiThinking}
            className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            悔棋
          </motion.button>
          <motion.button
            onClick={handlePass}
            disabled={phase !== 'playing' || aiThinking}
            className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            停一手
          </motion.button>
          <motion.button
            onClick={handleFinish}
            disabled={phase !== 'playing'}
            className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: 'rgba(255, 209, 102, 0.12)', color: NEON_COLORS.gold, border: '1px solid rgba(255, 209, 102, 0.3)' }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            结束数子
          </motion.button>
          <motion.button
            onClick={handleResign}
            disabled={phase !== 'playing'}
            className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: 'rgba(255, 68, 102, 0.12)', color: '#ff8fa3', border: '1px solid rgba(255, 68, 102, 0.3)' }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            认输
          </motion.button>
          <motion.button
            onClick={startGame}
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            重新开始
          </motion.button>
        </div>

        <div
          className="mt-4 text-center text-xs leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.42)' }}
        >
          落子后自动提掉无气的对方棋子；不可落子于无气点，也不可立即回提形成劫争。
          <br />
          双方连续停一手即终局，按中国规则数子并计入贴目。
        </div>
      </motion.div>
    </div>
  );
}
