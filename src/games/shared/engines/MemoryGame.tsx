import React, { useCallback, useEffect, useMemo, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import type { EngineProps, GameStatus } from '../types';

const PAIRS = 8;
const SETS: Record<string, string[]> = {
  animal: ['🐶', '🐱', '🐼', '🦊', '🐸', '🦁', '🐵', '🐧'],
  food: ['🍎', '🍕', '🍔', '🍣', '🍰', '🍇', '🍦', '🍜'],
  space: ['🚀', '🪐', '⭐', '🌙', '☄️', '👽', '🛸', '🌍'],
  nature: ['🌸', '🌊', '🌲', '🔥', '❄️', '🌈', '🍂', '⛰️'],
  music: ['🎵', '🎸', '🎹', '🥁', '🎺', '🎻', '🎤', '🎧'],
  random: ['🎁', '🎈', '🎲', '🏆', '💡', '🔑', '💎', '🎯'],
};

function pickSet(meta: EngineProps['meta']): string[] {
  const key = `${meta.id} ${meta.name}`.toLowerCase();
  if (/animal|pet|cat|dog|zoo|动物|宠物/.test(key)) return SETS.animal;
  if (/food|cook|chef|bakery|美食|料理/.test(key)) return SETS.food;
  if (/space|star|galaxy|太空|星/.test(key)) return SETS.space;
  if (/nature|forest|garden|自然|森林|花园/.test(key)) return SETS.nature;
  if (/music|piano|音乐|钢琴/.test(key)) return SETS.music;
  return SETS.random;
}

interface Card { symbol: string; key: number }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const symbols = useMemo(() => pickSet(meta).slice(0, PAIRS), [meta.id]);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);

  const start = useCallback(() => {
    const deck = shuffle([...symbols, ...symbols]).map((symbol, key) => ({ symbol, key }));
    setCards(deck);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setTime(0);
    setScore(0);
    setLocked(false);
    setStatus('playing');
    report(0);
  }, [symbols, report]);

  useEffect(() => {
    if (status !== 'playing') return;
    const timer = window.setInterval(() => setTime(t => t + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  const currentScore = useCallback((nextMoves: number, nextTime: number) => {
    return Math.max(100, 1500 - nextMoves * 30 - nextTime * 4);
  }, []);

  const flip = (index: number) => {
    if (status !== 'playing' || locked || flipped.includes(index) || matched.has(index)) return;
    const next = [...flipped, index];
    setFlipped(next);
    if (next.length < 2) return;

    const nextMoves = moves + 1;
    setMoves(nextMoves);
    const [a, b] = next;
    if (cards[a].symbol === cards[b].symbol) {
      const nextMatched = new Set(matched);
      nextMatched.add(a);
      nextMatched.add(b);
      setMatched(nextMatched);
      setFlipped([]);
      const nextScore = currentScore(nextMoves, time);
      setScore(nextScore);
      report(nextScore);
      if (nextMatched.size === cards.length) {
        const finalScore = currentScore(nextMoves, time) + 300;
        setScore(finalScore);
        setStatus('won');
        finish(finalScore);
      }
    } else {
      setLocked(true);
      window.setTimeout(() => {
        setFlipped([]);
        setLocked(false);
      }, 650);
      const nextScore = currentScore(nextMoves, time);
      setScore(nextScore);
      report(nextScore);
    }
  };

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '步数', value: moves }, { label: '用时', value: `${time}s` }, { label: '配对', value: `${matched.size / 2}/${PAIRS}` }]}
      resultText={`用 ${moves} 步完成配对`}
      hint="点击卡片翻开，两张相同图案即可配对；步数和用时越少分数越高"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          翻开卡片，记住图案位置。<br />找出全部 {PAIRS} 对相同图案即可通关。
        </StartPanel>
      ) : (
        <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {cards.map((card, index) => {
              const isOpen = flipped.includes(index) || matched.has(index);
              const isMatched = matched.has(index);
              return (
                <button
                  key={card.key}
                  onClick={() => flip(index)}
                  style={{
                    aspectRatio: '3 / 4',
                    borderRadius: 12,
                    border: `1px solid ${isMatched ? '#22c55e' : 'rgba(255,255,255,0.12)'}`,
                    background: isOpen
                      ? isMatched
                        ? 'rgba(34,197,94,0.18)'
                        : 'rgba(255,255,255,0.1)'
                      : `linear-gradient(145deg, ${meta.primary}66, ${meta.secondary}44)`,
                    fontSize: 'clamp(22px, 5vw, 38px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isMatched ? '0 0 16px rgba(34,197,94,0.4)' : 'none',
                    transition: 'all .2s',
                  }}
                >
                  {isOpen ? card.symbol : '❓'}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </GameFrame>
  );
}
