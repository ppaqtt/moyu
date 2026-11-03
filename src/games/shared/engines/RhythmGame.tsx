import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import { useGameLoop } from '../../../hooks/useGameLoop';
import type { EngineProps, GameStatus } from '../types';

const W = 480;
const H = 640;
const LANES = 4;
const LANE_W = W / LANES;
const HIT_LINE = 530;
const TOTAL_NOTES = 60;
const KEY_MAP: Record<string, number> = {
  '1': 0, '2': 1, '3': 2, '4': 3,
  a: 0, s: 1, d: 2, f: 3,
  j: 0, k: 1, l: 2, ';': 3,
};
const LANE_COLORS = ['#22d3ee', '#a855f7', '#f472b6', '#facc15'];

interface Note { lane: number; y: number; id: number }

export default function RhythmGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [perfect, setPerfect] = useState(0);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState('');

  const notes = useRef<Note[]>([]);
  const nextId = useRef(0);
  const frame = useRef(0);
  const spawned = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const perfectRef = useRef(0);
  const missRef = useRef(0);

  const start = useCallback(() => {
    notes.current = [];
    nextId.current = 0;
    frame.current = 0;
    spawned.current = 0;
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    perfectRef.current = 0;
    missRef.current = 0;
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setPerfect(0);
    setMisses(0);
    setFeedback('');
    setStatus('playing');
    report(0);
  }, [report]);

  const finishRound = useCallback(() => {
    const finalScore = scoreRef.current + maxComboRef.current * 10 + perfectRef.current * 5;
    scoreRef.current = finalScore;
    setScore(finalScore);
    setStatus('won');
    finish(finalScore);
  }, [finish]);

  const hitLane = useCallback((lane: number) => {
    if (status !== 'playing') return;
    let bestNote: Note | null = null;
    let bestDist = Infinity;
    for (const note of notes.current) {
      if (note.lane !== lane) continue;
      const dist = Math.abs(note.y - HIT_LINE);
      if (dist < bestDist) {
        bestDist = dist;
        bestNote = note;
      }
    }
    if (!bestNote || bestDist > 78) {
      comboRef.current = 0;
      setCombo(0);
      setFeedback('MISS');
      return;
    }
    notes.current = notes.current.filter(n => n !== bestNote);
    const gain = bestDist < 22 ? 100 : bestDist < 45 ? 70 : 40;
    const grade = bestDist < 22 ? 'PERFECT' : bestDist < 45 ? 'GREAT' : 'GOOD';
    scoreRef.current += gain;
    comboRef.current += 1;
    if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;
    if (grade === 'PERFECT') perfectRef.current += 1;
    setScore(scoreRef.current);
    setCombo(comboRef.current);
    setMaxCombo(maxComboRef.current);
    setPerfect(perfectRef.current);
    setFeedback(grade);
    report(scoreRef.current);
  }, [status, report]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const lane = KEY_MAP[e.key.toLowerCase()];
      if (lane !== undefined) {
        e.preventDefault();
        hitLane(lane);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [hitLane]);

  useGameLoop({
    delay: 16,
    enabled: status === 'playing',
    callback: () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      frame.current++;
      const noteSpeed = 5.4 + (spawned.current / TOTAL_NOTES) * 2.2;

      if (spawned.current < TOTAL_NOTES && frame.current % 26 === 0) {
        const lane = Math.floor(Math.random() * LANES);
        notes.current.push({ lane, y: -30, id: nextId.current++ });
        spawned.current++;
      }

      for (const note of notes.current) note.y += noteSpeed;

      const remaining: Note[] = [];
      for (const note of notes.current) {
        if (note.y > H + 20) {
          missRef.current += 1;
          comboRef.current = 0;
          setMisses(missRef.current);
          setCombo(0);
        } else {
          remaining.push(note);
        }
      }
      notes.current = remaining;

      if (missRef.current >= 12) {
        setStatus('lost');
        finish(scoreRef.current);
        return;
      }
      if (spawned.current >= TOTAL_NOTES && notes.current.length === 0) {
        finishRound();
        return;
      }

      ctx.fillStyle = '#070b16';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < LANES; i++) {
        ctx.fillStyle = `${LANE_COLORS[i]}14`;
        ctx.fillRect(i * LANE_W, 0, LANE_W, H);
        if (i > 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fillRect(i * LANE_W - 1, 0, 2, H);
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(0, HIT_LINE, W, 4);
      ctx.fillStyle = `${meta.primary}55`;
      ctx.fillRect(0, HIT_LINE + 4, W, 30);

      for (const note of notes.current) {
        const x = note.lane * LANE_W + 10;
        const h = 26;
        const grad = ctx.createLinearGradient(x, note.y, x + LANE_W - 20, note.y + h);
        grad.addColorStop(0, LANE_COLORS[note.lane]);
        grad.addColorStop(1, '#ffffff');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, note.y, LANE_W - 20, h, 8);
        ctx.fill();
        ctx.shadowColor = LANE_COLORS[note.lane];
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(feedback, W / 2, 90);
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = meta.secondary;
      ctx.fillText(`COMBO x${comboRef.current}`, W / 2, 120);

      for (let i = 0; i < LANES; i++) {
        ctx.fillStyle = `${LANE_COLORS[i]}33`;
        ctx.fillRect(i * LANE_W + 6, H - 70, LANE_W - 12, 58);
        ctx.fillStyle = LANE_COLORS[i];
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(['1', '2', '3', '4'][i], i * LANE_W + LANE_W / 2, H - 34);
      }
    },
  });

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '连击', value: combo }, { label: '最高连击', value: maxCombo }, { label: '完美', value: perfect }, { label: '失误', value: `${misses}/12` }]}
      resultText={`最高连击 ${maxCombo}`}
      hint="音符到达判定线时按 1-4 / A S D F / J K L ;，或点击底部轨道；失误 12 次结束"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          四轨音游，共 {TOTAL_NOTES} 个音符。<br />在音符到达判定线时击中，连击越高分数越高。
        </StartPanel>
      ) : (
        <div style={{ width: '100%', maxWidth: 480 }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={{ width: '100%', aspectRatio: `${W} / ${H}`, borderRadius: 14, border: `1px solid ${meta.primary}44`, touchAction: 'none' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${LANES}, 1fr)`, gap: 6, marginTop: 8 }}>
            {[0, 1, 2, 3].map(lane => (
              <button
                key={lane}
                onClick={() => hitLane(lane)}
                style={{ padding: '12px 0', borderRadius: 10, border: `1px solid ${LANE_COLORS[lane]}66`, background: `${LANE_COLORS[lane]}18`, color: LANE_COLORS[lane], fontWeight: 800, cursor: 'pointer' }}
              >
                {lane + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </GameFrame>
  );
}
