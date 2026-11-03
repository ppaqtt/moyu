import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import { useGameLoop } from '../../../hooks/useGameLoop';
import { useKeyboard } from '../../../hooks/useKeyboard';
import type { EngineProps, GameStatus } from '../types';

const W = 520;
const H = 640;
const PLAYER_R = 16;
const SURVIVE_SECONDS = 45;

interface Obstacle { x: number; y: number; r: number; vy: number; vx: number }

export default function DodgeGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(3);
  const [survived, setSurvived] = useState(0);

  const px = useRef(W / 2);
  const py = useRef(H - 70);
  const obstacles = useRef<Obstacle[]>([]);
  const frame = useRef(0);
  const hpRef = useRef(3);
  const scoreRef = useRef(0);
  const invincible = useRef(0);
  const targetX = useRef(W / 2);

  const start = useCallback(() => {
    px.current = W / 2;
    py.current = H - 70;
    targetX.current = W / 2;
    obstacles.current = [];
    frame.current = 0;
    hpRef.current = 3;
    scoreRef.current = 0;
    invincible.current = 0;
    setHp(3);
    setScore(0);
    setSurvived(0);
    setStatus('playing');
    report(0);
  }, [report]);

  useKeyboard({
    onArrowLeft: () => { targetX.current = Math.max(PLAYER_R, targetX.current - 42); },
    onArrowRight: () => { targetX.current = Math.min(W - PLAYER_R, targetX.current + 42); },
    onA: () => { targetX.current = Math.max(PLAYER_R, targetX.current - 42); },
    onD: () => { targetX.current = Math.min(W - PLAYER_R, targetX.current + 42); },
    enabled: status === 'playing',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const move = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
      targetX.current = ((clientX - rect.left) / rect.width) * W;
    };
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('touchmove', move, { passive: true });
    return () => {
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('touchmove', move);
    };
  }, []);

  useGameLoop({
    delay: 16,
    enabled: status === 'playing',
    callback: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      frame.current++;
      px.current += (targetX.current - px.current) * 0.25;
      px.current = Math.max(PLAYER_R, Math.min(W - PLAYER_R, px.current));
      if (invincible.current > 0) invincible.current--;

      const seconds = frame.current / 60;
      if (frame.current % 6 === 0) {
        setSurvived(Math.floor(seconds));
      }

      if (frame.current % Math.max(16, 42 - Math.floor(seconds)) === 0) {
        const speed = 2.4 + seconds * 0.045;
        obstacles.current.push({
          x: 24 + Math.random() * (W - 48),
          y: -24,
          r: 12 + Math.random() * 12,
          vy: speed,
          vx: (Math.random() - 0.5) * 1.6,
        });
      }

      let dodgedThisFrame = 0;
      for (const o of obstacles.current) {
        o.y += o.vy;
        o.x += o.vx;
        if (o.x < o.r || o.x > W - o.r) o.vx *= -1;
        const dist = Math.hypot(o.x - px.current, o.y - py.current);
        if (dist < o.r + PLAYER_R && invincible.current <= 0) {
          hpRef.current -= 1;
          invincible.current = 90;
          setHp(hpRef.current);
          if (hpRef.current <= 0) {
            setStatus('lost');
            finish(scoreRef.current);
            return;
          }
        }
        if (o.y > H + 30) dodgedThisFrame++;
      }
      if (dodgedThisFrame > 0) {
        scoreRef.current += dodgedThisFrame * 5;
        setScore(scoreRef.current);
        report(scoreRef.current);
      }

      if (seconds >= SURVIVE_SECONDS) {
        const finalScore = scoreRef.current + hpRef.current * 150 + 500;
        scoreRef.current = finalScore;
        setScore(finalScore);
        setStatus('won');
        finish(finalScore);
        return;
      }

      obstacles.current = obstacles.current.filter(o => o.y < H + 40);

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#050914');
      bg.addColorStop(1, '#1b0f2b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let i = 0; i < 40; i++) {
        const y = (i * 37 + frame.current * 1.5) % H;
        ctx.fillRect((i * 83) % W, y, 2, 2);
      }

      for (const o of obstacles.current) {
        const grad = ctx.createRadialGradient(o.x, o.y, 2, o.x, o.y, o.r);
        grad.addColorStop(0, '#fca5a5');
        grad.addColorStop(1, '#dc2626');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (invincible.current <= 0 || Math.floor(frame.current / 5) % 2 === 0) {
        const grad = ctx.createRadialGradient(px.current, py.current, 2, px.current, py.current, PLAYER_R);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, meta.primary);
        ctx.fillStyle = grad;
        ctx.shadowColor = meta.primary;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(px.current, py.current, PLAYER_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.max(0, SURVIVE_SECONDS - Math.floor(seconds))}s`, W / 2, 34);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('坚持住！', W / 2, 56);
    },
  });

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '生命', value: '❤️'.repeat(Math.max(0, hp)) }, { label: '坚持', value: `${survived}s / ${SURVIVE_SECONDS}s` }]}
      resultText={`坚持了 ${survived} 秒`}
      hint="移动鼠标 / 手指或按 ← → / A D 躲避红色障碍；坚持 45 秒即通关"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          在弹幕中生存下来。<br />坚持 {SURVIVE_SECONDS} 秒，被击中 3 次游戏结束。
        </StartPanel>
      ) : (
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ width: '100%', maxWidth: 520, aspectRatio: `${W} / ${H}`, borderRadius: 14, border: `1px solid ${meta.primary}44`, touchAction: 'none' }}
        />
      )}
    </GameFrame>
  );
}
