import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import { useGameLoop } from '../../../hooks/useGameLoop';
import type { EngineProps, GameStatus } from '../types';

const W = 600;
const H = 720;
const PLAYER_W = 44;
const PLAYER_H = 34;
const KILL_TARGET = 40;

interface Bullet { x: number; y: number; vy: number }
interface Enemy { x: number; y: number; hp: number; phase: number; speed: number }

export default function ShooterGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [kills, setKills] = useState(0);

  const playerX = useRef(W / 2);
  const bullets = useRef<Bullet[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const keys = useRef<Set<string>>(new Set());
  const frame = useRef(0);
  const scoreRef = useRef(0);
  const killsRef = useRef(0);
  const livesRef = useRef(3);
  const cooldown = useRef(0);

  const start = useCallback(() => {
    playerX.current = W / 2;
    bullets.current = [];
    enemies.current = [];
    keys.current.clear();
    frame.current = 0;
    scoreRef.current = 0;
    killsRef.current = 0;
    livesRef.current = 3;
    cooldown.current = 0;
    setScore(0);
    setLives(3);
    setKills(0);
    setStatus('playing');
    report(0);
  }, [report]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
      keys.current.add(e.key);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key);
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    return () => {
      window.removeEventListener('keydown', down, true);
      window.removeEventListener('keyup', up, true);
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
      const k = keys.current;
      if (k.has('ArrowLeft') || k.has('a') || k.has('A')) playerX.current -= 6;
      if (k.has('ArrowRight') || k.has('d') || k.has('D')) playerX.current += 6;
      playerX.current = Math.max(PLAYER_W / 2, Math.min(W - PLAYER_W / 2, playerX.current));

      cooldown.current--;
      if ((k.has(' ') || k.has('ArrowUp') || k.has('w') || k.has('W') || frame.current % 9 === 0) && cooldown.current <= 0) {
        bullets.current.push({ x: playerX.current, y: H - 70, vy: -11 });
        cooldown.current = 8;
      }

      const spawnRate = Math.max(24, 52 - Math.floor(frame.current / 600) * 6);
      if (frame.current % spawnRate === 0) {
        enemies.current.push({
          x: 40 + Math.random() * (W - 80),
          y: -40,
          hp: frame.current > 1800 ? 2 : 1,
          phase: Math.random() * Math.PI * 2,
          speed: 1.6 + Math.random() * 0.8 + frame.current / 3000,
        });
      }

      for (const bullet of bullets.current) bullet.y += bullet.vy;
      bullets.current = bullets.current.filter(b => b.y > -20);

      for (const enemy of enemies.current) {
        enemy.y += enemy.speed;
        enemy.x += Math.sin((frame.current + enemy.phase * 40) / 55) * 1.2;
        enemy.x = Math.max(24, Math.min(W - 24, enemy.x));
      }

      for (let i = bullets.current.length - 1; i >= 0; i--) {
        const bullet = bullets.current[i];
        for (let j = enemies.current.length - 1; j >= 0; j--) {
          const enemy = enemies.current[j];
          if (Math.abs(bullet.x - enemy.x) < 22 && Math.abs(bullet.y - enemy.y) < 22) {
            bullets.current.splice(i, 1);
            enemy.hp -= 1;
            if (enemy.hp <= 0) {
              enemies.current.splice(j, 1);
              killsRef.current += 1;
              scoreRef.current += 20;
              setKills(killsRef.current);
              setScore(scoreRef.current);
              report(scoreRef.current);
            }
            break;
          }
        }
      }

      let damaged = false;
      for (let i = enemies.current.length - 1; i >= 0; i--) {
        const enemy = enemies.current[i];
        if (enemy.y > H - 60 && Math.abs(enemy.x - playerX.current) < 38) damaged = true;
        if (enemy.y > H + 30) enemies.current.splice(i, 1);
      }
      if (damaged) {
        livesRef.current -= 1;
        setLives(livesRef.current);
        enemies.current = [];
        if (livesRef.current <= 0) {
          setStatus('lost');
          finish(scoreRef.current);
          return;
        }
      }

      if (killsRef.current >= KILL_TARGET) {
        setStatus('won');
        finish(scoreRef.current + 500);
        return;
      }

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#050914');
      bg.addColorStop(1, '#0d2038');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      for (let i = 0; i < 60; i++) {
        const y = (i * 53 + frame.current * 2) % H;
        const x = (i * 97) % W;
        ctx.fillRect(x, y, 2, 2);
      }

      for (const bullet of bullets.current) {
        ctx.fillStyle = '#22d3ee';
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 10;
        ctx.fillRect(bullet.x - 2, bullet.y - 12, 4, 14);
      }
      ctx.shadowBlur = 0;

      for (const enemy of enemies.current) {
        ctx.fillStyle = enemy.hp > 1 ? '#f97316' : '#ef4444';
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y + 18);
        ctx.lineTo(enemy.x - 20, enemy.y - 14);
        ctx.lineTo(enemy.x, enemy.y - 4);
        ctx.lineTo(enemy.x + 20, enemy.y - 14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y + 2, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      const px = playerX.current;
      const py = H - 58;
      const grad = ctx.createLinearGradient(px - 24, py, px + 24, py + 34);
      grad.addColorStop(0, meta.primary);
      grad.addColorStop(1, meta.secondary);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(px, py - 6);
      ctx.lineTo(px + 24, py + 30);
      ctx.lineTo(px, py + 22);
      ctx.lineTo(px - 24, py + 30);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(px, py + 10, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`击落 ${killsRef.current}/${KILL_TARGET}`, 18, 30);
      ctx.textAlign = 'right';
      ctx.fillText('❤️'.repeat(Math.max(0, livesRef.current)), W - 18, 30);
    },
  });

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '击落', value: `${kills}/${KILL_TARGET}` }, { label: '生命', value: '❤️'.repeat(Math.max(0, lives)) }]}
      resultText={`击落 ${kills} 架敌机`}
      hint="← → / A D 移动，空格射击（也会自动射击）；击落 40 架敌机即通关，被撞会掉血"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          操控战机击落敌机。<br />击落 {KILL_TARGET} 架敌机即可通关，共有 3 条命。
        </StartPanel>
      ) : (
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ width: '100%', maxWidth: 600, aspectRatio: `${W} / ${H}`, borderRadius: 14, border: `1px solid ${meta.primary}44`, touchAction: 'none' }}
        />
      )}
    </GameFrame>
  );
}
