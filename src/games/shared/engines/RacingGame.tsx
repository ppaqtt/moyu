import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import { useGameLoop } from '../../../hooks/useGameLoop';
import { useKeyboard } from '../../../hooks/useKeyboard';
import type { EngineProps, GameStatus } from '../types';

const W = 480;
const H = 680;
const LANES = 3;
const ROAD_X = 60;
const ROAD_W = 360;
const LANE_W = ROAD_W / LANES;
const CAR_W = 46;
const CAR_H = 82;

interface Traffic { lane: number; y: number; color: string }

export default function RacingGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);

  const lane = useRef(1);
  const carX = useRef(ROAD_X + LANE_W * 1.5);
  const traffic = useRef<Traffic[]>([]);
  const frame = useRef(0);
  const distRef = useRef(0);
  const scoreRef = useRef(0);

  const start = useCallback(() => {
    lane.current = 1;
    carX.current = ROAD_X + LANE_W * 1.5;
    traffic.current = [];
    frame.current = 0;
    distRef.current = 0;
    scoreRef.current = 0;
    setScore(0);
    setDistance(0);
    setStatus('playing');
    report(0);
  }, [report]);

  const changeLane = useCallback((dir: -1 | 1) => {
    lane.current = Math.max(0, Math.min(LANES - 1, lane.current + dir));
  }, []);

  useKeyboard({
    onArrowLeft: () => changeLane(-1),
    onArrowRight: () => changeLane(1),
    onA: () => changeLane(-1),
    onD: () => changeLane(1),
    enabled: status === 'playing',
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    };
    window.addEventListener('keydown', handler, { passive: false });
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useGameLoop({
    delay: 16,
    enabled: status === 'playing',
    callback: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      frame.current++;
      const targetX = ROAD_X + LANE_W * lane.current + LANE_W / 2;
      carX.current += (targetX - carX.current) * 0.28;

      const currentSpeed = Math.min(16, 7 + distRef.current / 1600);
      setSpeed(Math.round(currentSpeed * 18));
      distRef.current += currentSpeed;
      if (frame.current % 4 === 0) {
        const nextScore = Math.floor(distRef.current / 10);
        scoreRef.current = nextScore;
        setScore(nextScore);
        setDistance(Math.floor(distRef.current / 30));
        report(nextScore);
      }

      const spawnGap = Math.max(34, 62 - Math.floor(distRef.current / 900) * 4);
      if (frame.current % spawnGap === 0) {
        const used = new Set(traffic.current.filter(t => t.y < 120).map(t => t.lane));
        const freeLanes = [0, 1, 2].filter(l => !used.has(l));
        const pick = freeLanes[Math.floor(Math.random() * freeLanes.length)];
        if (pick !== undefined) {
          traffic.current.push({ lane: pick, y: -CAR_H, color: ['#ef4444', '#f97316', '#a855f7', '#06b6d4'][Math.floor(Math.random() * 4)] });
        }
      }

      for (const car of traffic.current) car.y += currentSpeed * 0.72;
      traffic.current = traffic.current.filter(c => c.y < H + CAR_H);

      const playerY = H - 140;
      const playerLeft = carX.current - CAR_W / 2;
      const collision = traffic.current.some(car => {
        const carLeft = ROAD_X + LANE_W * car.lane + (LANE_W - CAR_W) / 2;
        return car.y + CAR_H > playerY + 8 && car.y < playerY + CAR_H - 8 && Math.abs(carLeft - playerLeft) < CAR_W - 6;
      });
      if (collision) {
        setStatus('lost');
        finish(scoreRef.current);
        return;
      }

      const grass = ctx.createLinearGradient(0, 0, 0, H);
      grass.addColorStop(0, '#08130b');
      grass.addColorStop(1, '#0f2a16');
      ctx.fillStyle = grass;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#172033';
      ctx.fillRect(ROAD_X, 0, ROAD_W, H);

      ctx.strokeStyle = 'rgba(250,204,21,0.8)';
      ctx.lineWidth = 3;
      const dashOffset = (frame.current * currentSpeed) % 80;
      for (let i = 0; i < 10; i++) {
        const y = i * 80 - dashOffset;
        for (let l = 1; l < LANES; l++) {
          ctx.beginPath();
          ctx.moveTo(ROAD_X + LANE_W * l, y);
          ctx.lineTo(ROAD_X + LANE_W * l, y + 40);
          ctx.stroke();
        }
      }
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(ROAD_X, 0);
      ctx.lineTo(ROAD_X, H);
      ctx.moveTo(ROAD_X + ROAD_W, 0);
      ctx.lineTo(ROAD_X + ROAD_W, H);
      ctx.stroke();

      for (const car of traffic.current) {
        const x = ROAD_X + LANE_W * car.lane + (LANE_W - CAR_W) / 2;
        ctx.fillStyle = car.color;
        ctx.beginPath();
        ctx.roundRect(x, car.y, CAR_W, CAR_H, 10);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(x + 7, car.y + 14, CAR_W - 14, 18);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x + 7, car.y + 48, CAR_W - 14, 12);
      }

      const pLeft = carX.current - CAR_W / 2;
      const grad = ctx.createLinearGradient(pLeft, playerY, pLeft + CAR_W, playerY + CAR_H);
      grad.addColorStop(0, meta.primary);
      grad.addColorStop(1, meta.secondary);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(pLeft, playerY, CAR_W, CAR_H, 10);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillRect(pLeft + 7, playerY + 12, CAR_W - 14, 18);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(pLeft + 7, playerY + 50, CAR_W - 14, 12);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(pLeft + 4, playerY - 4, 10, 6);
      ctx.fillRect(pLeft + CAR_W - 14, playerY - 4, 10, 6);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.floor(distRef.current / 30)} m`, 18, 38);
    },
  });

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '距离', value: `${distance} m` }, { label: '速度', value: `${speed} km/h` }]}
      resultText={`行驶了 ${distance} 米`}
      hint="← → / A D 切换车道，躲避前方车辆；速度会越来越快"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          三车道高速竞速。<br />切换车道躲避车辆，行驶越远得分越高。
        </StartPanel>
      ) : (
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ width: '100%', maxWidth: 480, aspectRatio: `${W} / ${H}`, borderRadius: 14, border: `1px solid ${meta.primary}44`, touchAction: 'none' }}
        />
      )}
    </GameFrame>
  );
}
