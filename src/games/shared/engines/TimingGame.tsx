import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import { useGameLoop } from '../../../hooks/useGameLoop';
import type { EngineProps, GameStatus } from '../types';

const ROUNDS = 10;

export default function TimingGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [needle, setNeedle] = useState(0);
  const [target, setTarget] = useState({ start: 30, width: 26 });
  const [round, setRound] = useState(1);
  const [hits, setHits] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [locked, setLocked] = useState(false);

  const needleRef = useRef(0);
  const dir = useRef(1);
  const lockedRef = useRef(false);

  const start = useCallback(() => {
    needleRef.current = 0;
    dir.current = 1;
    lockedRef.current = false;
    setNeedle(0);
    setRound(1);
    setHits(0);
    setScore(0);
    setFeedback('');
    setLocked(false);
    setTarget({ start: 30, width: 26 });
    setStatus('playing');
    report(0);
  }, [report]);

  useGameLoop({
    delay: 16,
    enabled: status === 'playing' && !locked,
    callback: () => {
      const speed = 1.5 + round * 0.12;
      needleRef.current += dir.current * speed;
      if (needleRef.current >= 100) {
        needleRef.current = 100;
        dir.current = -1;
      }
      if (needleRef.current <= 0) {
        needleRef.current = 0;
        dir.current = 1;
      }
      setNeedle(needleRef.current);
    },
  });

  const stopNeedle = useCallback(() => {
    if (status !== 'playing' || lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    const value = needleRef.current;
    const center = target.start + target.width / 2;
    const dist = Math.abs(value - center);
    const half = target.width / 2;
    let gained = 0;
    let text = '未命中';
    if (dist <= half) {
      gained = Math.round(100 + (1 - dist / half) * 100);
      text = dist <= half * 0.35 ? '完美命中！' : '命中！';
      setHits(h => h + 1);
    }
    const nextScore = score + gained;
    setScore(nextScore);
    setFeedback(`${text} +${gained}`);
    report(nextScore);

    window.setTimeout(() => {
      if (round >= ROUNDS) {
        setStatus('won');
        finish(nextScore + hits * 50 + (gained > 0 ? 50 : 0));
        return;
      }
      setRound(r => {
        const nextRound = r + 1;
        const width = Math.max(9, 26 - (nextRound - 1) * 1.6);
        setTarget({ start: 12 + Math.random() * (76 - width), width });
        return nextRound;
      });
      needleRef.current = 0;
      dir.current = 1;
      setNeedle(0);
      setFeedback('');
      lockedRef.current = false;
      setLocked(false);
    }, 650);
  }, [status, target, score, round, hits, report, finish]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        stopNeedle();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [stopNeedle]);

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '回合', value: `${Math.min(round, ROUNDS)}/${ROUNDS}` }, { label: '命中', value: hits }]}
      resultText={`命中 ${hits} 次`}
      hint="按空格 / 回车或点击按钮，让指针停在绿色目标区域内；越接近中心分数越高"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          考验你的节奏感。<br />共 {ROUNDS} 回合，目标区会越来越窄。
        </StartPanel>
      ) : (
        <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ position: 'relative', height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', border: `1px solid ${meta.primary}33` }}>
            <div
              style={{
                position: 'absolute',
                left: `${target.start}%`,
                width: `${target.width}%`,
                top: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, rgba(34,197,94,0.35), rgba(34,197,94,0.85), rgba(34,197,94,0.35))',
                borderLeft: '2px solid #22c55e',
                borderRight: '2px solid #22c55e',
              }}
            />
            <div style={{ position: 'absolute', left: `${needle}%`, top: -4, bottom: -4, width: 4, background: '#fff', transform: 'translateX(-2px)', boxShadow: '0 0 12px #fff' }} />
          </div>
          <div style={{ height: 40, textAlign: 'center', marginTop: 16, color: feedback.includes('完美') ? '#facc15' : '#22c55e', fontWeight: 800, fontSize: 18 }}>{feedback}</div>
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={stopNeedle}
              disabled={locked}
              style={{
                padding: '14px 56px',
                borderRadius: 14,
                border: 'none',
                background: `linear-gradient(135deg, ${meta.primary}, ${meta.secondary})`,
                color: '#06101f',
                fontSize: 18,
                fontWeight: 800,
                cursor: locked ? 'default' : 'pointer',
                opacity: locked ? 0.5 : 1,
              }}
            >
              停！
            </button>
          </div>
        </div>
      )}
    </GameFrame>
  );
}
