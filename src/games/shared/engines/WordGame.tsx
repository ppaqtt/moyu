import React, { useCallback, useEffect, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import type { EngineProps, GameStatus } from '../types';

interface WordItem { word: string; hint: string }

const BANKS: Record<string, WordItem[]> = {
  animal: [
    { word: 'ELEPHANT', hint: '陆地上最大的哺乳动物' },
    { word: 'PENGUIN', hint: '不会飞但很会游泳的鸟' },
    { word: 'DOLPHIN', hint: '聪明的海洋哺乳动物' },
    { word: 'TIGER', hint: '森林之王，橙色条纹' },
    { word: 'RABBIT', hint: '长耳朵，爱吃胡萝卜' },
    { word: 'MONKEY', hint: '善于攀爬的灵长类' },
    { word: 'PANDA', hint: '中国的国宝' },
    { word: 'GIRAFFE', hint: '脖子最长的动物' },
  ],
  food: [
    { word: 'NOODLE', hint: '面条，常配汤吃' },
    { word: 'SUSHI', hint: '日本的米饭料理' },
    { word: 'BURGER', hint: '夹肉饼的圆面包' },
    { word: 'PIZZA', hint: '意大利的圆形烤饼' },
    { word: 'CAKE', hint: '生日必备甜品' },
    { word: 'COFFEE', hint: '提神的热饮' },
    { word: 'DUMPLING', hint: '中国传统的饺子' },
    { word: 'SANDWICH', hint: '两片面包夹馅料' },
  ],
  school: [
    { word: 'TEACHER', hint: '在学校教书的人' },
    { word: 'STUDENT', hint: '在学校学习的人' },
    { word: 'HOMEWORK', hint: '放学后的作业' },
    { word: 'CLASSROOM', hint: '上课的房间' },
    { word: 'LIBRARY', hint: '借书和阅读的地方' },
    { word: 'PENCIL', hint: '可以擦掉的书写工具' },
    { word: 'SCIENCE', hint: '研究自然规律的学科' },
    { word: 'ENGLISH', hint: '国际通用语言之一' },
  ],
  nature: [
    { word: 'MOUNTAIN', hint: '高高的山峰' },
    { word: 'RIVER', hint: '流动的淡水' },
    { word: 'FOREST', hint: '大片树木聚集的地方' },
    { word: 'OCEAN', hint: '广阔的咸水海域' },
    { word: 'FLOWER', hint: '会开花的植物' },
    { word: 'SUNSHINE', hint: '阳光' },
    { word: 'RAINBOW', hint: '雨后的七彩弧线' },
    { word: 'GARDEN', hint: '种花种菜的地方' },
  ],
  music: [
    { word: 'PIANO', hint: '黑白键的键盘乐器' },
    { word: 'GUITAR', hint: '六根弦的弹拨乐器' },
    { word: 'VIOLIN', hint: '小提琴' },
    { word: 'DRUM', hint: '打击乐器' },
    { word: 'MELODY', hint: '旋律' },
    { word: 'RHYTHM', hint: '节奏' },
    { word: 'CONCERT', hint: '音乐会' },
    { word: 'SINGER', hint: '唱歌的人' },
  ],
};

const GENERAL: WordItem[] = [
  { word: 'WINDOW', hint: '房子上透光的开口' },
  { word: 'BRIDGE', hint: '连接两岸的建筑' },
  { word: 'CASTLE', hint: '国王居住的堡垒' },
  { word: 'DIAMOND', hint: '坚硬闪亮的宝石' },
  { word: 'PUZZLE', hint: '需要动脑的谜题' },
  { word: 'ROCKET', hint: '飞向太空的交通工具' },
  { word: 'PLANET', hint: '围绕恒星运行的天体' },
  { word: 'CAMERA', hint: '用来拍照的设备' },
  { word: 'TRAVEL', hint: '去远方旅行' },
  { word: 'FRIEND', hint: '陪伴你的好朋友' },
  { word: 'SUMMER', hint: '一年中最热的季节' },
  { word: 'WINTER', hint: '会下雪的季节' },
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ROUND_WORDS = 5;

function bankFor(meta: EngineProps['meta']): WordItem[] {
  const key = `${meta.id} ${meta.name}`.toLowerCase();
  if (/animal|pet|cat|dog|zoo|动物|宠物|猫|狗/.test(key)) return BANKS.animal;
  if (/food|chef|cook|bakery|sushi|pizza|美食|料理|厨|餐厅/.test(key)) return BANKS.food;
  if (/school|teacher|student|study|学校|老师|学生|作业/.test(key)) return BANKS.school;
  if (/nature|forest|garden|ocean|plant|自然|森林|花园|海洋|植物/.test(key)) return BANKS.nature;
  if (/music|piano|guitar|音乐|钢琴|吉他/.test(key)) return BANKS.music;
  return [...GENERAL, ...BANKS.school, ...BANKS.nature];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function WordGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [queue, setQueue] = useState<WordItem[]>([]);
  const [index, setIndex] = useState(0);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [lives, setLives] = useState(6);
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [message, setMessage] = useState('');

  const current = queue[index];

  const start = useCallback(() => {
    setQueue(shuffle(bankFor(meta)).slice(0, ROUND_WORDS));
    setIndex(0);
    setGuessed(new Set());
    setLives(6);
    setScore(0);
    setSolved(0);
    setMessage('');
    setStatus('playing');
    report(0);
  }, [meta, report]);

  const nextWord = useCallback((nextSolved: number, nextScore: number) => {
    if (nextSolved >= ROUND_WORDS) {
      setStatus('won');
      finish(nextScore);
      return;
    }
    setIndex(i => i + 1);
    setGuessed(new Set());
    setMessage('');
  }, [finish]);

  const guess = useCallback((letter: string) => {
    if (status !== 'playing' || !current || guessed.has(letter)) return;
    const nextGuessed = new Set(guessed);
    nextGuessed.add(letter);
    setGuessed(nextGuessed);

    const isHit = current.word.includes(letter);
    if (!isHit) {
      const nextLives = lives - 1;
      setLives(nextLives);
      if (nextLives <= 0) {
        setStatus('lost');
        finish(score);
        return;
      }
    }

    const solvedNow = current.word.split('').every(ch => nextGuessed.has(ch));
    if (solvedNow) {
      const gain = 50 + lives * 10;
      const nextScore = score + gain;
      setScore(nextScore);
      setSolved(s => s + 1);
      report(nextScore);
      setMessage(`+${gain} 分！`);
      window.setTimeout(() => nextWord(solved + 1, nextScore), 650);
    }
  }, [status, current, guessed, lives, score, solved, finish, report, nextWord]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (status !== 'playing') return;
      const letter = e.key.toUpperCase();
      if (letter.length === 1 && letter >= 'A' && letter <= 'Z') guess(letter);
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [status, guess]);

  const display = current ? current.word.split('').map(ch => (guessed.has(ch) ? ch : '_')).join(' ') : '';

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '单词', value: `${Math.min(solved + (status === 'playing' ? 1 : 0), ROUND_WORDS)}/${ROUND_WORDS}` }, { label: '生命', value: '❤️'.repeat(Math.max(0, lives)) }]}
      resultText={`完成 ${solved} 个单词`}
      hint="按键盘字母猜词；每猜错一次失去一条生命，完成 5 个单词即通关"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' || !current ? (
        <StartPanel meta={meta} onStart={start}>
          看中文提示，猜出英文单词。<br />共 {ROUND_WORDS} 个单词，猜错 6 次游戏结束。
        </StartPanel>
      ) : (
        <div style={{ width: '100%', maxWidth: 620, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 15, color: '#94a3b8', marginBottom: 8 }}>提示</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 22, color: meta.secondary }}>{current.hint}</div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 8, fontFamily: 'monospace', marginBottom: 10, color: '#fff' }}>
            {display}
          </div>
          <div style={{ height: 24, color: '#22c55e', fontWeight: 700, marginBottom: 16 }}>{message}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, maxWidth: 500, margin: '0 auto' }}>
            {ALPHABET.map(letter => {
              const used = guessed.has(letter);
              const hit = used && current.word.includes(letter);
              return (
                <button
                  key={letter}
                  onClick={() => guess(letter)}
                  disabled={used}
                  style={{
                    padding: '10px 0',
                    borderRadius: 8,
                    border: `1px solid ${used ? (hit ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.15)'}`,
                    background: used ? (hit ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)') : 'rgba(255,255,255,0.05)',
                    color: '#e2e8f0',
                    fontWeight: 700,
                    cursor: used ? 'default' : 'pointer',
                  }}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </GameFrame>
  );
}
