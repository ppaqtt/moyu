import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface TypingSpeedProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
  onExit?: () => void;
}

const DURATION = 60;

const WORDS = [
  'game', 'work', 'break', 'coffee', 'office', 'meeting', 'email', 'screen', 'mouse', 'keyboard',
  'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'relax', 'focus', 'flow',
  'small', 'happy', 'music', 'light', 'space', 'ocean', 'cloud', 'forest', 'river', 'stone',
  'pixel', 'level', 'score', 'speed', 'start', 'pause', 'reset', 'bonus', 'combo', 'perfect',
  'worker', 'coffee', 'window', 'laptop', 'report', 'deadline', 'lunch', 'snack', 'chair', 'desk',
];

function makeText(wordCount = 90) {
  return Array.from({ length: wordCount }, () => WORDS[Math.floor(Math.random() * WORDS.length)]).join(' ');
}

export default function TypingSpeed({ onScoreUpdate, onGameOver, onExit }: TypingSpeedProps) {
  const [text, setText] = useState(() => makeText());
  const [typed, setTyped] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const inputRef = useRef<HTMLInputElement>(null);

  const correctChars = useMemo(
    () => typed.split('').filter((char, index) => char === text[index]).length,
    [typed, text]
  );
  const accuracy = typed.length ? Math.round((correctChars / typed.length) * 100) : 100;
  const elapsed = DURATION - timeLeft;
  const wpm = elapsed > 0 ? Math.round((correctChars / 5) / (elapsed / 60)) : 0;

  const finish = useCallback(() => {
    if (finished) return;
    setFinished(true);
    setStarted(false);
    onScoreUpdate?.(wpm);
    onGameOver?.(wpm);
  }, [finished, onScoreUpdate, onGameOver, wpm]);

  useEffect(() => {
    if (!started || finished) return;
    const timer = window.setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started, finished]);

  useEffect(() => {
    if (started && !finished && timeLeft === 0) finish();
  }, [started, finished, timeLeft, finish]);

  useEffect(() => {
    onScoreUpdate?.(wpm);
  }, [wpm, onScoreUpdate]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (finished) return;
    if (!started) setStarted(true);
    setTyped(event.target.value);
  };

  const handleRestart = () => {
    setText(makeText());
    setTyped('');
    setStarted(false);
    setFinished(false);
    setTimeLeft(DURATION);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const renderText = () => text.split('').map((char, index) => {
    let color = 'rgba(255, 255, 255, 0.35)';
    if (index < typed.length) {
      color = typed[index] === char ? '#22c55e' : '#ef4444';
    } else if (index === typed.length && started) {
      color = '#ffffff';
    }
    return (
      <span key={index} style={{ color, textDecoration: typed[index] && typed[index] !== char ? 'underline' : 'none' }}>
        {char}
      </span>
    );
  });

  return (
    <div
      className="min-h-screen flex flex-col items-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 55%, #16213e 100%)' }}
    >
      <div className="w-full max-w-4xl flex items-center justify-between py-4">
        <motion.button
          onClick={onExit}
          className="px-4 py-2 rounded-lg font-bold text-sm"
          style={{ background: 'rgba(26,26,46,0.8)', color: '#00d2ff', border: '1px solid rgba(0,210,255,0.3)' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回主页
        </motion.button>
        <div className="flex gap-3">
          {[
            { label: '剩余时间', value: `${timeLeft}s`, color: '#f59e0b' },
            { label: '速度', value: `${wpm} WPM`, color: '#00d2ff' },
            { label: '准确率', value: `${accuracy}%`, color: '#22c55e' },
          ].map(item => (
            <div
              key={item.label}
              className="px-4 py-2 rounded-lg text-center"
              style={{ background: 'rgba(26,26,46,0.8)', border: `1px solid ${item.color}55` }}
            >
              <div className="text-xs opacity-70" style={{ color: item.color }}>{item.label}</div>
              <div className="text-lg font-bold" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <motion.div
        className="w-full max-w-4xl rounded-2xl p-6 mt-4"
        style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(0,210,255,0.25)', boxShadow: '0 0 30px rgba(0,210,255,0.08)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className="text-xl leading-relaxed tracking-wide select-none"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', minHeight: 140 }}
        >
          {renderText()}
        </div>

        <input
          ref={inputRef}
          value={typed}
          onChange={handleChange}
          disabled={finished}
          placeholder={finished ? '本局结束，点击重新开始' : '从这里开始输入，计时会自动开始…'}
          className="w-full mt-6 px-4 py-3 rounded-xl outline-none text-lg"
          style={{
            background: 'rgba(26,26,46,0.9)',
            color: '#ffffff',
            border: '1px solid rgba(0,210,255,0.35)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        />
      </motion.div>

      <div className="flex items-center gap-4 mt-6">
        <motion.button
          onClick={handleRestart}
          className="px-8 py-3 rounded-xl font-bold"
          style={{ background: 'linear-gradient(135deg, #22c55e, #06b6d4)', color: '#0a0a1a' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {finished ? '再来一局' : '重新开始'}
        </motion.button>
        <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          已输入 {typed.length} / {text.length} 字符 · 正确 {correctChars}
        </div>
      </div>

      {finished && (
        <motion.div
          className="mt-6 px-8 py-5 rounded-2xl text-center"
          style={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(34,197,94,0.4)' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-2xl font-bold mb-2" style={{ color: '#22c55e' }}>本局成绩 {wpm} WPM</div>
          <div style={{ color: 'rgba(255,255,255,0.6)' }}>准确率 {accuracy}% · 正确字符 {correctChars}</div>
        </motion.div>
      )}
    </div>
  );
}
