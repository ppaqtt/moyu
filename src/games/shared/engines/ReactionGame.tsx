import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import type { EngineProps, GameStatus } from '../types';

const DURATION = 30;
const HOLES = 9;

export default function ReactionGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [mole, setMole] = useState(-1);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const timeouts = useRef<number[]>([]);

  const clearTimers = () => {
    timeouts.current.forEach(id => window.clearTimeout(id));
    timeouts.current = [];
  };

  const start = useCallback(() => {
    clearTimers();
    setMole(-1);
    setHits(0);
    setMisses(0);
    setCombo(0);
    setTimeLeft(DURATION);
    setScore(0);
    setStatus('playing');
    report(0);
  }, [report]);

  useEffect(() => {
    if (status !== 'playing') return;

    const countdown = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          window.clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    let cancelled = false;
    const popMole = () => {
      if (cancelled) return;
      setMole(Math.floor(Math.random() * HOLES));
      const hideId = window.setTimeout(() => {
        if (cancelled) return;
        setMole(-1);
        const nextId = window.setTimeout(popMole, 220);
        timeouts.current.push(nextId);
      }, 680);
      timeouts.current.push(hideId);
    };
    popMole();

    return () => {
      cancelled = true;
      window.clearInterval(countdown);
      clearTimers();
    };
  }, [status]);

  useEffect(() => {
    if (status !== 'playing' || timeLeft > 0) return;
    setMole(-1);
    setStatus('won');
    finish(score);
  }, [timeLeft, status, score, finish]);

  const hitMole = (index: number) => {
    if (status !== 'playing') return;
    if (index === mole) {
      const nextCombo = combo + 1;
      const gain = 10 + Math.min(nextCombo, 10) * 2;
      const nextScore = score + gain;
      setHits(h => h + 1);
      setCombo(nextCombo);
      setScore(nextScore);
      report(nextScore);
      setMole(-1);
    } else {
      setCombo(0);
      setMisses(m => m + 1);
    }
  };

  const accuracy = hits + misses === 0 ? 100 : Math.round((hits / (hits + misses)) * 100);

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[
        { label: '剩余时间', value: `${timeLeft}s` },
        { label: '命中', value: hits },
        { label: '连击', value: combo },
        { label: '准确率', value: `${accuracy}%` },
      ]}
      resultText={`命中 ${hits} 次，准确率 ${accuracy}%`}
      hint="点击冒出来的目标；连续命中会获得更高分数"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          在 {DURATION} 秒内尽可能多地击中目标。<br />连击越高，单次得分越高。
        </StartPanel>
      ) : (
        <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {Array.from({ length: HOLES }, (_, i) => {
              const active = i === mole;
              return (
                <button
                  key={i}
                  onClick={() => hitMole(i)}
                  style={{
                    aspectRatio: '1 / 1',
                    borderRadius: 16,
                    border: `1px solid ${active ? meta.secondary : 'rgba(255,255,255,0.08)'}`,
                    background: active
                      ? `radial-gradient(circle at 50% 45%, ${meta.secondary}, ${meta.primary}55)`
                      : 'rgba(255,255,255,0.03)',
                    fontSize: 'clamp(30px, 8vw, 56px)',
                    cursor: 'pointer',
                    boxShadow: active ? `0 0 30px ${meta.secondary}88` : 'inset 0 0 20px rgba(0,0,0,0.4)',
                    transition: 'all .1s',
                  }}
                >
                  {active ? '🎯' : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </GameFrame>
  );
}
