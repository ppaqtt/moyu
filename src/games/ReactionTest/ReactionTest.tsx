import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ReactionTestProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
  onExit?: () => void;
}

type Phase = 'idle' | 'waiting' | 'ready' | 'roundResult' | 'done';

const TOTAL_ROUNDS = 5;

export default function ReactionTest({ onScoreUpdate, onGameOver, onExit }: ReactionTestProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(1);
  const [times, setTimes] = useState<number[]>([]);
  const [message, setMessage] = useState('点击开始测试');
  const startTimeRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const restartTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    if (restartTimerRef.current !== null) window.clearTimeout(restartTimerRef.current);
    timeoutRef.current = null;
    restartTimerRef.current = null;
  }, []);

  const finish = useCallback((results: number[]) => {
    const average = Math.round(results.reduce((sum, value) => sum + value, 0) / results.length);
    const score = Math.max(0, Math.round(1000 - average));
    setPhase('done');
    setMessage(`平均反应 ${average} ms`);
    onScoreUpdate?.(score);
    onGameOver?.(score);
  }, [onScoreUpdate, onGameOver]);

  const startRound = useCallback((currentRound: number, collected: number[]) => {
    clearTimers();
    setPhase('waiting');
    setMessage('等待绿光，别提前点…');
    const delay = 1200 + Math.random() * 2200;
    timeoutRef.current = window.setTimeout(() => {
      startTimeRef.current = performance.now();
      setPhase('ready');
      setMessage('点击！');
    }, delay);
    setRound(currentRound);
    setTimes(collected);
  }, [clearTimers]);

  const handlePanelClick = () => {
    if (phase === 'idle') {
      setTimes([]);
      startRound(1, []);
      return;
    }

    if (phase === 'waiting') {
      clearTimers();
      setPhase('roundResult');
      setMessage('太快了！本轮重来');
      restartTimerRef.current = window.setTimeout(() => startRound(round, times), 900);
      return;
    }

    if (phase === 'ready') {
      const reaction = Math.round(performance.now() - startTimeRef.current);
      const collected = [...times, reaction];
      setTimes(collected);
      setPhase('roundResult');
      setMessage(`${reaction} ms`);

      if (round >= TOTAL_ROUNDS) {
        restartTimerRef.current = window.setTimeout(() => finish(collected), 900);
      } else {
        restartTimerRef.current = window.setTimeout(() => startRound(round + 1, collected), 900);
      }
    }
  };

  const handleRestart = () => {
    clearTimers();
    setTimes([]);
    setRound(1);
    setPhase('idle');
    setMessage('点击开始测试');
  };

  useEffect(() => () => clearTimers(), [clearTimers]);

  const average = times.length
    ? Math.round(times.reduce((sum, value) => sum + value, 0) / times.length)
    : 0;

  const panelBackground = phase === 'ready'
    ? 'linear-gradient(135deg, #16a34a, #22c55e)'
    : phase === 'waiting'
      ? 'linear-gradient(135deg, #b45309, #f59e0b)'
      : phase === 'roundResult'
        ? 'linear-gradient(135deg, #1e3a8a, #06b6d4)'
        : 'linear-gradient(135deg, #1a1a2e, #0f0f1a)';

  return (
    <div
      className="min-h-screen flex flex-col items-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 55%, #16213e 100%)' }}
    >
      <div className="w-full max-w-2xl flex items-center justify-between py-4">
        <motion.button
          onClick={onExit}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{ background: 'rgba(26,26,46,0.8)', color: '#00d2ff', border: '1px solid rgba(0,210,255,0.3)' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回主页
        </motion.button>
        <div className="flex gap-3 text-center">
          <div className="px-4 py-2 rounded-lg" style={{ background: 'rgba(26,26,46,0.8)', border: '1px solid rgba(245,158,11,0.4)' }}>
            <div className="text-xs opacity-70" style={{ color: '#f59e0b' }}>回合</div>
            <div className="text-lg font-bold" style={{ color: '#f59e0b' }}>{Math.min(round, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}</div>
          </div>
          <div className="px-4 py-2 rounded-lg" style={{ background: 'rgba(26,26,46,0.8)', border: '1px solid rgba(34,197,94,0.4)' }}>
            <div className="text-xs opacity-70" style={{ color: '#22c55e' }}>平均</div>
            <div className="text-lg font-bold" style={{ color: '#22c55e' }}>{average ? `${average} ms` : '--'}</div>
          </div>
        </div>
      </div>

      <motion.button
        onClick={handlePanelClick}
        className="w-full max-w-2xl h-[420px] rounded-3xl flex flex-col items-center justify-center select-none"
        style={{ background: panelBackground, border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 0 40px rgba(0,0,0,0.35)' }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="text-6xl mb-6">
          {phase === 'ready' ? '🟢' : phase === 'waiting' ? '⏳' : phase === 'done' ? '🏁' : '⚡'}
        </div>
        <div className="text-3xl font-bold text-white mb-3">{message}</div>
        <div className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {phase === 'idle' && '连续 5 轮，绿灯亮起后尽快点击'}
          {phase === 'waiting' && '不要提前点击，否则本轮重来'}
          {phase === 'ready' && '现在点！'}
          {phase === 'roundResult' && '准备下一轮…'}
          {phase === 'done' && `得分 ${Math.max(0, Math.round(1000 - average))}`}
        </div>
      </motion.button>

      <div className="w-full max-w-2xl mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {times.map((time, index) => (
            <span
              key={`${time}-${index}`}
              className="px-3 py-1.5 rounded-lg text-sm font-bold"
              style={{ background: 'rgba(26,26,46,0.9)', color: time < 250 ? '#22c55e' : time < 350 ? '#facc15' : '#f97316' }}
            >
              {time} ms
            </span>
          ))}
        </div>
        <motion.button
          onClick={handleRestart}
          className="px-6 py-2.5 rounded-xl font-bold"
          style={{ background: 'rgba(26,26,46,0.9)', color: '#00d2ff', border: '1px solid rgba(0,210,255,0.4)' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          重新开始
        </motion.button>
      </div>
    </div>
  );
}
