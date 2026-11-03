import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import { useGameLoop } from '../../../hooks/useGameLoop';
import type { EngineProps, GameStatus } from '../types';

const W = 720;
const H = 480;
const PATH: [number, number][] = [
  [0, 90], [170, 90], [170, 240], [360, 240], [360, 120], [540, 120], [540, 340], [720, 340],
];
const TOWER_COST = 60;
const TOWER_RANGE = 105;
const TOWER_DAMAGE = 10;
const WAVES = 5;

interface Enemy { x: number; y: number; seg: number; t: number; hp: number; maxHp: number; speed: number; reward: number }
interface Tower { x: number; y: number; cd: number }
interface Shot { x1: number; y1: number; x2: number; y2: number; life: number }

function segmentLengths(): number[] {
  return PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
}
const SEG_LEN = segmentLengths();
const TOTAL_LEN = SEG_LEN.reduce((a, b) => a + b, 0);

function distanceToPath(x: number, y: number): number {
  let min = Infinity;
  for (let i = 0; i < PATH.length - 1; i++) {
    const [x1, y1] = PATH[i];
    const [x2, y2] = PATH[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lenSq));
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    min = Math.min(min, Math.hypot(x - px, y - py));
  }
  return min;
}

export default function TowerDefenseGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [money, setMoney] = useState(180);
  const [lives, setLives] = useState(10);
  const [wave, setWave] = useState(1);

  const enemies = useRef<Enemy[]>([]);
  const towers = useRef<Tower[]>([]);
  const shots = useRef<Shot[]>([]);
  const frame = useRef(0);
  const moneyRef = useRef(180);
  const livesRef = useRef(10);
  const waveRef = useRef(1);
  const scoreRef = useRef(0);
  const spawned = useRef(0);
  const waveActive = useRef(false);
  const waveDelay = useRef(90);

  const start = useCallback(() => {
    enemies.current = [];
    towers.current = [];
    shots.current = [];
    frame.current = 0;
    moneyRef.current = 180;
    livesRef.current = 10;
    waveRef.current = 1;
    scoreRef.current = 0;
    spawned.current = 0;
    waveActive.current = false;
    waveDelay.current = 90;
    setMoney(180);
    setLives(10);
    setWave(1);
    setScore(0);
    setStatus('playing');
    report(0);
  }, [report]);

  const placeTower = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (status !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    if (x < 24 || x > W - 24 || y < 24 || y > H - 24) return;
    if (moneyRef.current < TOWER_COST) return;
    if (distanceToPath(x, y) < 34) return;
    if (towers.current.some(t => Math.hypot(t.x - x, t.y - y) < 36)) return;
    towers.current.push({ x, y, cd: 0 });
    moneyRef.current -= TOWER_COST;
    setMoney(moneyRef.current);
    report(scoreRef.current);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prevent = (ev: Event) => ev.preventDefault();
    canvas.addEventListener('touchmove', prevent, { passive: false });
    return () => canvas.removeEventListener('touchmove', prevent);
  }, []);

  useGameLoop({
    delay: 16,
    enabled: status === 'playing',
    callback: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      frame.current++;

      if (!waveActive.current) {
        waveDelay.current--;
        if (waveDelay.current <= 0) {
          waveActive.current = true;
          spawned.current = 0;
          const currentWave = waveRef.current;
          setWave(currentWave);
        }
      } else {
        const total = 6 + waveRef.current * 2;
        if (spawned.current < total && frame.current % 48 === 0) {
          spawned.current++;
          const hp = 26 + waveRef.current * 14;
          enemies.current.push({
            x: PATH[0][0],
            y: PATH[0][1],
            seg: 0,
            t: 0,
            hp,
            maxHp: hp,
            speed: 1.05 + waveRef.current * 0.11,
            reward: 10 + waveRef.current * 2,
          });
        }
        if (spawned.current >= total && enemies.current.length === 0) {
          waveActive.current = false;
          if (waveRef.current >= WAVES) {
            const finalScore = scoreRef.current + livesRef.current * 50 + 500;
            scoreRef.current = finalScore;
            setScore(finalScore);
            setStatus('won');
            finish(finalScore);
            return;
          }
          waveRef.current += 1;
          setWave(waveRef.current);
          waveDelay.current = 150;
        }
      }

      for (const enemy of enemies.current) {
        enemy.t += enemy.speed / SEG_LEN[enemy.seg];
        while (enemy.t >= 1 && enemy.seg < PATH.length - 2) {
          enemy.t -= 1;
          enemy.seg++;
        }
        if (enemy.seg >= PATH.length - 2 && enemy.t >= 1) {
          livesRef.current -= 1;
          setLives(livesRef.current);
          enemy.hp = -1;
          continue;
        }
        const [x1, y1] = PATH[enemy.seg];
        const [x2, y2] = PATH[enemy.seg + 1];
        enemy.x = x1 + (x2 - x1) * enemy.t;
        enemy.y = y1 + (y2 - y1) * enemy.t;
      }

      const leaked = enemies.current.filter(e => e.hp <= 0);
      if (leaked.length > 0) {
        enemies.current = enemies.current.filter(e => e.hp > 0);
        if (livesRef.current <= 0) {
          setStatus('lost');
          finish(scoreRef.current);
          return;
        }
      }

      for (const tower of towers.current) {
        tower.cd--;
        if (tower.cd > 0) continue;
        let target: Enemy | null = null;
        let bestDist = TOWER_RANGE;
        for (const enemy of enemies.current) {
          if (enemy.hp <= 0) continue;
          const dist = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
          if (dist < bestDist) {
            bestDist = dist;
            target = enemy;
          }
        }
        if (target) {
          target.hp -= TOWER_DAMAGE;
          tower.cd = 26;
          shots.current.push({ x1: tower.x, y1: tower.y, x2: target.x, y2: target.y, life: 6 });
          if (target.hp <= 0) {
            moneyRef.current += target.reward;
            scoreRef.current += target.reward * 2;
            setMoney(moneyRef.current);
            setScore(scoreRef.current);
            report(scoreRef.current);
          }
        }
      }
      enemies.current = enemies.current.filter(e => e.hp > 0);
      shots.current = shots.current.filter(s => --s.life > 0).map(s => ({ ...s }));

      const grass = ctx.createLinearGradient(0, 0, 0, H);
      grass.addColorStop(0, '#0a1a12');
      grass.addColorStop(1, '#122b1c');
      ctx.fillStyle = grass;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      ctx.strokeStyle = '#8b6f47';
      ctx.lineWidth = 46;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      PATH.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 12]);
      ctx.beginPath();
      PATH.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
      ctx.setLineDash([]);

      for (const tower of towers.current) {
        ctx.fillStyle = `${meta.primary}22`;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, TOWER_RANGE, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = meta.primary;
        ctx.beginPath();
        ctx.roundRect(tower.x - 15, tower.y - 15, 30, 30, 6);
        ctx.fill();
        ctx.fillStyle = '#0b1020';
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const shot of shots.current) {
        ctx.strokeStyle = 'rgba(34,211,238,0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(shot.x1, shot.y1);
        ctx.lineTo(shot.x2, shot.y2);
        ctx.stroke();
      }

      for (const enemy of enemies.current) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.arc(enemy.x - 4, enemy.y - 3, 2, 0, Math.PI * 2);
        ctx.arc(enemy.x + 4, enemy.y - 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111827';
        ctx.fillRect(enemy.x - 14, enemy.y - 20, 28, 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(enemy.x - 14, enemy.y - 20, 28 * Math.max(0, enemy.hp / enemy.maxHp), 4);
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`第 ${waveRef.current}/${WAVES} 波`, 16, 26);
      ctx.fillText(`金币 ${moneyRef.current}`, 16, 48);
      ctx.textAlign = 'right';
      ctx.fillText(`生命 ${livesRef.current}`, W - 16, 26);
      ctx.fillStyle = meta.secondary;
      ctx.fillText(`点击空地建塔（${TOWER_COST} 金币）`, W - 16, 48);
    },
  });

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '波次', value: `${wave}/${WAVES}` }, { label: '金币', value: money }, { label: '生命', value: lives }]}
      resultText={`守住 ${wave} 波进攻`}
      hint="点击空地建造防御塔（60 金币），塔会自动攻击路径上的敌人；别让敌人走到终点"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          塔防挑战，共 {WAVES} 波敌人。<br />用金币在路径旁建塔，阻止敌人抵达终点。
        </StartPanel>
      ) : (
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onClick={placeTower}
          style={{ width: '100%', maxWidth: 720, aspectRatio: `${W} / ${H}`, borderRadius: 14, border: `1px solid ${meta.primary}44`, cursor: 'crosshair', touchAction: 'none' }}
        />
      )}
    </GameFrame>
  );
}
