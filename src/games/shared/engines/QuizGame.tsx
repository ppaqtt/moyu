import React, { useCallback, useMemo, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import type { EngineProps, GameStatus } from '../types';

interface Question {
  q: string;
  options: string[];
  answer: number;
  tip?: string;
}

const GENERAL: Question[] = [
  { q: '太阳系中体积最大的行星是？', options: ['地球', '木星', '火星', '金星'], answer: 1, tip: '木星是气态巨行星' },
  { q: '《红楼梦》的作者是？', options: ['施耐庵', '罗贯中', '曹雪芹', '吴承恩'], answer: 2 },
  { q: '水的化学式是？', options: ['CO2', 'H2O', 'O2', 'NaCl'], answer: 1 },
  { q: '光年是什么单位？', options: ['时间', '长度', '速度', '质量'], answer: 1 },
  { q: '一年中白昼最长的节气是？', options: ['春分', '夏至', '秋分', '冬至'], answer: 1 },
  { q: '奥运会每几年举办一次？', options: ['2年', '3年', '4年', '5年'], answer: 2 },
  { q: '人体最大的器官是？', options: ['肝脏', '心脏', '皮肤', '肺'], answer: 2 },
  { q: '“床前明月光”的作者是？', options: ['杜甫', '李白', '白居易', '王维'], answer: 1 },
  { q: '地球上最大的海洋是？', options: ['大西洋', '印度洋', '北冰洋', '太平洋'], answer: 3 },
  { q: '计算机中 1 字节等于多少位？', options: ['4', '8', '16', '32'], answer: 1 },
  { q: '中国历史上第一个统一的封建王朝是？', options: ['汉朝', '秦朝', '唐朝', '宋朝'], answer: 1 },
  { q: '声音在哪种介质中传播最快？', options: ['空气', '水', '钢铁', '真空'], answer: 2 },
  { q: '“Ctrl + C”通常表示？', options: ['粘贴', '复制', '剪切', '撤销'], answer: 1 },
  { q: '彩虹通常有几种颜色？', options: ['5', '6', '7', '8'], answer: 2 },
  { q: '世界上最高的山峰是？', options: ['乔戈里峰', '珠穆朗玛峰', '干城章嘉峰', '洛子峰'], answer: 1 },
  { q: '《西游记》中孙悟空的师父是？', options: ['唐僧', '菩提祖师', '观音', '如来'], answer: 1 },
  { q: '一个标准足球场上有多少名球员（双方合计）？', options: ['18', '20', '22', '24'], answer: 2 },
  { q: '“π”约等于？', options: ['2.14', '3.14', '4.14', '1.73'], answer: 1 },
  { q: '人体正常体温约为？', options: ['30°C', '33°C', '37°C', '42°C'], answer: 2 },
  { q: '下列哪个不是编程语言？', options: ['Python', 'Java', 'HTML', 'C++'], answer: 2 },
];

const SCIENCE: Question[] = [
  { q: '植物进行光合作用主要吸收哪种气体？', options: ['氧气', '二氧化碳', '氮气', '氢气'], answer: 1 },
  { q: '电子的电荷是？', options: ['正电荷', '负电荷', '不带电', '时正时负'], answer: 1 },
  { q: 'DNA 的双螺旋结构由谁提出？', options: ['达尔文', '孟德尔', '沃森和克里克', '巴斯德'], answer: 2 },
  { q: '力的单位是？', options: ['焦耳', '瓦特', '牛顿', '帕斯卡'], answer: 2 },
  { q: '下列哪种能源属于可再生能源？', options: ['煤炭', '石油', '太阳能', '天然气'], answer: 2 },
  { q: '人体细胞中染色体有多少对？', options: ['21 对', '22 对', '23 对', '24 对'], answer: 2 },
  { q: '声音的传播需要？', options: ['光', '介质', '真空', '磁场'], answer: 1 },
  { q: '铁生锈主要是与什么发生反应？', options: ['氮气', '氧气和水', '二氧化碳', '氢气'], answer: 1 },
  { q: '月球围绕地球转一圈约需要？', options: ['7 天', '15 天', '27 天', '365 天'], answer: 2 },
  { q: '电流的单位是？', options: ['伏特', '安培', '欧姆', '瓦特'], answer: 1 },
];

const LANGUAGE: Question[] = [
  { q: '“apple” 的中文意思是？', options: ['苹果', '香蕉', '橙子', '葡萄'], answer: 0 },
  { q: '“important” 的反义词是？', options: ['useful', 'unimportant', 'famous', 'difficult'], answer: 1 },
  { q: '“她每天步行去学校” 的英文是？', options: ['She walks to school every day.', 'She walk to school every day.', 'She is walk to school.', 'She walked school every day.'], answer: 0 },
  { q: '“book” 的复数形式是？', options: ['book', 'books', 'bookes', 'bookies'], answer: 1 },
  { q: '“beautiful” 的比较级是？', options: ['beautifuler', 'more beautiful', 'most beautiful', 'beautifuller'], answer: 1 },
  { q: '“I ___ a student.” 应填？', options: ['am', 'is', 'are', 'be'], answer: 0 },
  { q: '“谢谢” 的英文是？', options: ['Sorry', 'Thank you', 'Hello', 'Goodbye'], answer: 1 },
  { q: '“quickly” 是什么词性？', options: ['名词', '动词', '副词', '形容词'], answer: 2 },
  { q: '“go” 的过去式是？', options: ['goed', 'went', 'gone', 'going'], answer: 1 },
  { q: '“在……上面” 对应的英文介词是？', options: ['in', 'on', 'at', 'under'], answer: 1 },
];

function makeMathQuestions(): Question[] {
  const list: Question[] = [];
  for (let i = 0; i < 12; i++) {
    const a = 3 + Math.floor(Math.random() * 40);
    const b = 2 + Math.floor(Math.random() * 30);
    const type = i % 3;
    if (type === 0) {
      const answer = a + b;
      const options = shuffled([answer, answer + 1, answer - 1, answer + 7]);
      list.push({ q: `${a} + ${b} = ?`, options: options.map(String), answer: options.indexOf(answer) });
    } else if (type === 1) {
      const bigger = Math.max(a, b);
      const smaller = Math.min(a, b);
      const answer = bigger - smaller;
      const options = shuffled([answer, answer + 2, answer - 2, answer + 5]);
      list.push({ q: `${bigger} - ${smaller} = ?`, options: options.map(String), answer: options.indexOf(answer) });
    } else {
      const x = 2 + Math.floor(Math.random() * 9);
      const y = 2 + Math.floor(Math.random() * 9);
      const answer = x * y;
      const options = shuffled([answer, answer + x, answer - y, answer + 4]);
      list.push({ q: `${x} × ${y} = ?`, options: options.map(String), answer: options.indexOf(answer) });
    }
  }
  return list;
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickBank(meta: EngineProps['meta']): Question[] {
  const key = `${meta.id} ${meta.name}`.toLowerCase();
  if (/math|equation|fraction|geometry|logicmath|speedmath|timestable|calculator|数|算|几何/.test(key)) return makeMathQuestions();
  if (/science|physics|chem|bio|quantum|lab|科学|物理|化学|生物/.test(key)) return [...SCIENCE, ...GENERAL];
  if (/english|grammar|reading|listening|speaking|translate|vocabulary|word|language|语|阅读|听力|翻译|词汇|英语/.test(key)) return LANGUAGE;
  return GENERAL;
}

const TOTAL = 10;

export default function QuizGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const bank = useMemo(() => pickBank(meta), [meta.id]);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [order, setOrder] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  const start = useCallback(() => {
    const selected = shuffled(bank).slice(0, Math.min(TOTAL, bank.length));
    setOrder(selected);
    setIndex(0);
    setScore(0);
    setCorrect(0);
    setPicked(null);
    setLocked(false);
    setStatus('playing');
    report(0);
  }, [bank, report]);

  const choose = (option: number) => {
    if (status !== 'playing' || locked) return;
    const q = order[index];
    setPicked(option);
    setLocked(true);
    const isRight = option === q.answer;
    const nextScore = score + (isRight ? 100 : 0);
    const nextCorrect = correct + (isRight ? 1 : 0);
    setScore(nextScore);
    setCorrect(nextCorrect);
    report(nextScore);
    window.setTimeout(() => {
      if (index + 1 >= order.length) {
        const finalScore = nextScore + nextCorrect * 20;
        setScore(finalScore);
        setStatus('won');
        finish(finalScore);
      } else {
        setIndex(i => i + 1);
        setPicked(null);
        setLocked(false);
      }
    }, 750);
  };

  const q = order[index];

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '题目', value: `${Math.min(index + 1, order.length)}/${order.length || TOTAL}` }, { label: '答对', value: correct }]}
      resultText={`答对 ${correct} 题`}
      hint="点击选项作答，答对得 100 分；全部完成后按正确数追加奖励"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' || !q ? (
        <StartPanel meta={meta} onStart={start}>
          共 {TOTAL} 道题，答对越多分数越高。<br />题目涵盖知识、科学、语言与数学，每局随机抽取。
        </StartPanel>
      ) : (
        <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden', marginBottom: 18 }}>
            <div style={{ width: `${((index + (locked ? 1 : 0)) / order.length) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${meta.primary}, ${meta.secondary})`, transition: 'width .3s' }} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.6, marginBottom: 22 }}>{q.q}</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {q.options.map((opt, i) => {
              const isAnswer = i === q.answer;
              const isPicked = i === picked;
              const bg = locked
                ? isAnswer
                  ? 'rgba(34,197,94,0.25)'
                  : isPicked
                    ? 'rgba(239,68,68,0.25)'
                    : 'rgba(255,255,255,0.04)'
                : 'rgba(255,255,255,0.05)';
              const border = locked
                ? isAnswer
                  ? '#22c55e'
                  : isPicked
                    ? '#ef4444'
                    : 'rgba(255,255,255,0.08)'
                : 'rgba(255,255,255,0.12)';
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    borderRadius: 12,
                    border: `1px solid ${border}`,
                    background: bg,
                    color: '#e2e8f0',
                    fontSize: 16,
                    cursor: locked ? 'default' : 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  <b style={{ color: meta.primary, marginRight: 10 }}>{String.fromCharCode(65 + i)}</b>
                  {opt}
                </button>
              );
            })}
          </div>
          {locked && q.tip && <div style={{ marginTop: 14, color: '#94a3b8', fontSize: 13 }}>💡 {q.tip}</div>}
        </div>
      )}
    </GameFrame>
  );
}
