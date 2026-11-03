import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import { useGameLoop } from '../../../hooks/useGameLoop';
import type { EngineProps, GameStatus } from '../types';

const W = 820;
const H = 400;
const GROUND = 330;
const PLAYER_W = 38;
const PLAYER_H = 48;
const GRAVITY = 0.9;
const JUMP = -15;

interface Obstacle { x: number; w: number; h: number; kind: 'block' | 'spike' | 'drone' }

export default function RunnerGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);

  const playerY = useRef(GROUND - PLAYER_H);
  const vy = useRef(0);
  const onGround = useRef(true);
  const jumps = useRef(0);
  const obstacles = useRef<Obstacle[]>([]);
  const frame = useRef(0);
  const speed = useRef(7);
  const scoreRef = useRef(0);
  const distRef = useRef(0);

  const start = useCallback(() => {
    playerY.current = GROUND - PLAYER_H;
    vy.current = 0;
    onGround.current = true;
    jumps.current = 0;
    obstacles.current = [];
    frame.current = 0;
    speed.current = 7;
    scoreRef.current = 0;
    distRef.current = 0;
    setScore(0);
    setDistance(0);
    setStatus('playing');
    report(0);
  }, [report]);

  const jump = useCallback(() => {
    if (status !== 'playing') return;
    if (onGround.current || jumps.current < 2) {
      vy.current = JUMP;
      onGround.current = false;
      jumps.current += 1;
    }
  }, [status]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [jump]);

  useGameLoop({
    delay: 16,
    enabled: status === 'playing',
    callback: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      frame.current++;
      vy.current += GRAVITY;
      playerY.current += vy.current;
      if (playerY.current >= GROUND - PLAYER_H) {
        playerY.current = GROUND - PLAYER_H;
        vy.current = 0;
        onGround.current = true;
        jumps.current = 0;
      }

      speed.current = Math.min(15, 7 + frame.current / 900);
      distRef.current += speed.current;
      if (frame.current % 3 === 0) {
        const nextScore = Math.floor(distRef.current / 10);
        scoreRef.current = nextScore;
        setScore(nextScore);
        setDistance(Math.floor(distRef.current / 30));
        report(nextScore);
      }

      if (frame.current % 62 === 0) {
        const kind: Obstacle['kind'] = Math.random() < 0.2 ? 'drone' : Math.random() < 0.55 ? 'block' : 'spike';
        obstacles.current.push({
          x: W + 40,
          w: kind === 'spike' ? 30 : 38,
          h: kind === 'spike' ? 34 : kind === 'drone' ? 30 : 46 + Math.random() * 22,
          kind,
        });
      }

      for (const obstacle of obstacles.current) obstacle.x -= speed.current;
      obstacles.current = obstacles.current.filter(o => o.x > -80);

      const px = 110;
      const py = playerY.current;
      const hit = obstacles.current.some(o => {
        const oy = o.kind === 'drone' ? GROUND - 120 : GROUND - o.h;
        return px + PLAYER_W - 6 > o.x && px + 6 < o.x + o.w && py + PLAYER_H - 4 > oy && py + 4 < oy + o.h;
      });
      if (hit) {
        setStatus('lost');
        finish(scoreRef.current);
        return;
      }

      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#081326');
      sky.addColorStop(0.7, '#102a43');
      sky.addColorStop(1, '#0d1b2a');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      const offset = (frame.current * 0.35) % 260;
      for (let i = 0; i < 6; i++) {
        const x = i * 260 - offset;
        ctx.beginPath();
        ctx.moveTo(x, GROUND);
        ctx.lineTo(x + 140, GROUND - 160);
        ctx.lineTo(x + 280, GROUND);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = '#123524';
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = meta.primary;
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < 30; i++) {
        const x = (i * 90 - (frame.current * speed.current) % 90 + W) % W;
        ctx.fillRect(x, GROUND + 20, 34, 4);
      }
      ctx.globalAlpha = 1;

      for (const o of obstacles.current) {
        if (o.kind === 'drone') {
          const y = GROUND - 120 + Math.sin((frame.current + o.x) / 18) * 12;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(o.x + o.w / 2, y + 15, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fca5a5';
          ctx.fillRect(o.x - 4, y + 12, o.w + 8, 5);
        } else {
          const y = GROUND - o.h;
          ctx.fillStyle = o.kind === 'spike' ? '#f97316' : '#22c55e';
          if (o.kind === 'spike') {
            ctx.beginPath();
            ctx.moveTo(o.x, GROUND);
            ctx.lineTo(o.x + o.w / 2, y);
            ctx.lineTo(o.x + o.w, GROUND);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillRect(o.x, y, o.w, o.h);
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(o.x + 6, y + 8, o.w - 12, 6);
          }
        }
      }

      const px2 = 110;
      const py2 = playerY.current;
      const bodyGrad = ctx.createLinearGradient(px2, py2, px2 + PLAYER_W, py2 + PLAYER_H);
      bodyGrad.addColorStop(0, meta.primary);
      bodyGrad.addColorStop(1, meta.secondary);
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.roundRect(px2, py2, PLAYER_W, PLAYER_H, 10);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(px2 + PLAYER_W - 12, py2 + 16, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(px2 + 8, py2 + PLAYER_H - 14, 22, 5);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.floor(distRef.current / 30)} m`, 22, 42);
    },
  });

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '距离', value: `${distance} m` }, { label: '速度', value: speed.current.toFixed(1) }]}
      resultText={`跑了 ${distance} 米`}
      hint="空格 / ↑ / W 或点击画面跳跃，空中可再跳一次；躲避障碍物跑得更远"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          无尽跑酷。<br />跳过障碍物，跑得越远分数越高，速度也会越来越快。
        </StartPanel>
      ) : (
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onClick={jump}
          onTouchStart={e => { e.preventDefault(); jump(); }}
          style={{ width: '100%', maxWidth: 820, aspectRatio: `${W} / ${H}`, borderRadius: 14, border: `1px solid ${meta.primary}44`, touchAction: 'none', cursor: 'pointer' }}
        />
      )}
    </GameFrame>
  );
}
