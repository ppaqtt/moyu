import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { NEON_COLORS } from '../../utils/constants';

export interface ArcadeGameProps {
  gameId?: string;
  gameName?: string;
  category?: string;
  icon?: string;
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  onExit?: () => void;
}

type Mode =
  | 'catch'
  | 'shooter'
  | 'runner'
  | 'breakout'
  | 'match3'
  | 'memory'
  | 'maze'
  | 'quiz'
  | 'math'
  | 'idle'
  | 'board'
  | 'rhythm'
  | 'agar'
  | 'card';

interface Theme {
  primary: string;
  secondary: string;
  icon: string;
  label: string;
  hint: string;
}

const CATEGORY_THEME: Record<string, { primary: string; secondary: string; icon: string; label: string }> = {
  '3d': { primary: '#38bdf8', secondary: '#818cf8', icon: '🎡', label: '3D 视觉' },
  aibattle: { primary: '#22d3ee', secondary: '#a855f7', icon: '🤖', label: 'AI 对战' },
  ai: { primary: '#22d3ee', secondary: '#a855f7', icon: '🤖', label: 'AI 对抗' },
  cooking: { primary: '#fb923c', secondary: '#f43f5e', icon: '🍳', label: '美食料理' },
  career: { primary: '#fbbf24', secondary: '#f97316', icon: '👨‍🍳', label: '职业体验' },
  life: { primary: '#34d399', secondary: '#22d3ee', icon: '📋', label: '生活实用' },
  simulation: { primary: '#84cc16', secondary: '#22c55e', icon: '🏭', label: '模拟经营' },
  tech: { primary: '#6366f1', secondary: '#22d3ee', icon: '🔬', label: '科技未来' },
  animal: { primary: '#f472b6', secondary: '#fb7185', icon: '🐕', label: '动物题材' },
  visual: { primary: '#ec4899', secondary: '#a855f7', icon: '👁️', label: '视觉训练' },
  pixel: { primary: '#22c55e', secondary: '#06b6d4', icon: '👾', label: '像素风格' },
  holiday: { primary: '#ef4444', secondary: '#f59e0b', icon: '🎉', label: '节日主题' },
  party: { primary: '#f59e0b', secondary: '#ec4899', icon: '🎪', label: '派对游戏' },
  driving: { primary: '#22c55e', secondary: '#06b6d4', icon: '🚗', label: '交通驾驶' },
  education: { primary: '#3b82f6', secondary: '#22d3ee', icon: '🧪', label: '教育科普' },
  craft: { primary: '#ec4899', secondary: '#f59e0b', icon: '🎨', label: '手工制作' },
  story: { primary: '#f59e0b', secondary: '#ec4899', icon: '📖', label: '互动剧情' },
  multiplayer: { primary: '#a855f7', secondary: '#06b6d4', icon: '🎮', label: '多人对战' },
  coding: { primary: '#22c55e', secondary: '#06b6d4', icon: '💻', label: '编程学习' },
  escape: { primary: '#f97316', secondary: '#a855f7', icon: '🚪', label: '密室逃脱' },
  retro: { primary: '#f59e0b', secondary: '#ef4444', icon: '🕹️', label: '怀旧经典' },
  fighting: { primary: '#f97316', secondary: '#ef4444', icon: '👊', label: '格斗对战' },
  social: { primary: '#ec4899', secondary: '#a855f7', icon: '👥', label: '社交休闲' },
  adventure: { primary: '#f59e0b', secondary: '#22c55e', icon: '🏆', label: '冒险探索' },
  io: { primary: '#84cc16', secondary: '#06b6d4', icon: '🌐', label: 'IO 竞技' },
  idle: { primary: '#10b981', secondary: '#22d3ee', icon: '💤', label: '放置挂机' },
  parkour: { primary: '#06b6d4', secondary: '#22c55e', icon: '🏃', label: '跑酷闯关' },
  tower: { primary: '#8b5cf6', secondary: '#ec4899', icon: '🏰', label: '塔防游戏' },
  survival: { primary: '#f97316', secondary: '#ef4444', icon: '🏆', label: '生存冒险' },
  养成: { primary: '#f472b6', secondary: '#f59e0b', icon: '🐾', label: '养成游戏' },
  reaction: { primary: '#f59e0b', secondary: '#ef4444', icon: '🎯', label: '反应训练' },
  'co-op': { primary: '#ec4899', secondary: '#06b6d4', icon: '👥', label: '双人合作' },
  creative: { primary: '#ec4899', secondary: '#a855f7', icon: '🎨', label: '创意工具' },
  sports: { primary: '#3b82f6', secondary: '#22d3ee', icon: '🏃', label: '运动竞技' },
};

const MODE_BY_CATEGORY: Record<string, Mode> = {
  '3d': 'runner',
  aibattle: 'board',
  ai: 'board',
  board: 'board',
  cooking: 'idle',
  career: 'idle',
  life: 'idle',
  simulation: 'idle',
  '养成': 'idle',
  idle: 'idle',
  animal: 'idle',
  holiday: 'idle',
  craft: 'idle',
  tech: 'quiz',
  education: 'quiz',
  coding: 'quiz',
  story: 'quiz',
  social: 'quiz',
  party: 'quiz',
  word: 'quiz',
  language: 'quiz',
  visual: 'memory',
  card: 'card',
  puzzle2: 'memory',
  pixel: 'shooter',
  shooting: 'shooter',
  tower: 'shooter',
  fighting: 'shooter',
  retro: 'shooter',
  'co-op': 'shooter',
  multiplayer: 'shooter',
  physics: 'breakout',
  driving: 'runner',
  parkour: 'runner',
  survival: 'runner',
  adventure: 'runner',
  'io': 'agar',
  match3: 'match3',
  creative: 'match3',
  maze: 'maze',
  escape: 'maze',
  rhythm: 'rhythm',
  music: 'rhythm',
  math: 'math',
  sports: 'catch',
  reaction: 'catch',
  arcade: 'catch',
};

const MODE_BY_ID: Record<string, Mode> = {
  '2048': 'math',
  '2048battle': 'math',
  ai2048: 'math',
  fusion2048: 'math',
  tetris: 'breakout',
  breakout: 'breakout',
  enhancedbreakout: 'breakout',
  pong: 'breakout',
  pingpong: 'breakout',
  snake: 'catch',
  minesweeper: 'maze',
  sudoku: 'math',
  bejeweled: 'match3',
  candycrush: 'match3',
  gemblast: 'match3',
  candyblast: 'match3',
  fruitmatch: 'match3',
  iceblast: 'match3',
  jewelmatch: 'match3',
  marblematch: 'match3',
  cookiecrush: 'match3',
  animalmatch: 'match3',
  memorymatch: 'memory',
  concentration: 'memory',
  hangman: 'quiz',
  anagram: 'quiz',
  wordscramble: 'quiz',
  crossword: 'quiz',
  wordsearch: 'quiz',
  triviaquiz: 'quiz',
  knowledgequiz: 'quiz',
  mathquiz: 'quiz',
  aiquiz: 'quiz',
  sciencequiz: 'quiz',
  gobang: 'board',
  gobangai: 'board',
  gomoku: 'board',
  chess: 'board',
  chessai: 'board',
  checkers: 'board',
  reversi: 'board',
  othello: 'board',
  tictactoemaster: 'board',
  tictactoebattle: 'board',
  rhythmaster: 'rhythm',
  rhythmmaster: 'rhythm',
  rhythmtap: 'rhythm',
  pianotiles: 'rhythm',
  beatsaber: 'rhythm',
  beatrun: 'rhythm',
};

const MODE_HINT: Record<Mode, string> = {
  catch: '方向键 / WASD 移动，接住奖励，躲避危险',
  shooter: '方向键 / WASD 移动，自动开火，击落全部敌人',
  runner: '空格 / 方向键上跳跃，躲避障碍',
  breakout: '左右方向键移动挡板，击碎所有砖块',
  match3: '点击两个相邻方块交换，三个同色即可消除',
  memory: '点击卡片翻开，找出所有配对',
  maze: '方向键 / WASD 或屏幕按钮移动，到达绿色终点',
  quiz: '从四个选项中选择正确答案',
  math: '从四个选项中选择正确答案，限时答题',
  idle: '点击主按钮赚钱，购买升级提高收益',
  board: '点击棋盘落子，先连成五子者获胜',
  rhythm: 'D / F / J / K 或点击轨道击打音符',
  agar: '移动鼠标或 WASD 控制球体，吃掉更小的球',
  card: '点击要牌或停牌，让点数尽量接近 21 点',
};

function resolveMode(gameId = '', category = ''): Mode {
  return MODE_BY_ID[gameId.toLowerCase()] || MODE_BY_CATEGORY[category] || 'catch';
}

function getTheme(gameId: string, category: string, icon?: string): Theme {
  const meta = CATEGORY_THEME[category] || {
    primary: NEON_COLORS.neonCyan,
    secondary: NEON_COLORS.neonPurple,
    icon: '🎮',
    label: '休闲游戏',
  };
  return {
    ...meta,
    icon: icon || meta.icon,
    hint: MODE_HINT[resolveMode(gameId, category)],
  };
}

interface ModeProps {
  theme: Theme;
  gameName: string;
  onScore: (score: number) => void;
  onGameOver: (score: number) => void;
}

function useRaf(callback: (dt: number) => void, active: boolean) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(now - last, 60);
      last = now;
      cbRef.current(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

function useKeys(active: boolean) {
  const keys = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!active) return;
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      keys.current.add(k);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      keys.current.clear();
    };
  }, [active]);
  return keys;
}

/* ------------------------------ 接落物 ------------------------------ */
function CatchMode({ theme, onScore, onGameOver }: ModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useKeys(true);
  const stateRef = useRef({
    x: 240,
    items: [] as { x: number; y: number; speed: number; bad: boolean; emoji: string }[],
    lives: 3,
    score: 0,
    spawn: 0,
    time: 0,
    ended: false,
  });
  const W = 480;
  const H = 540;

  useRaf((dt) => {
    const s = stateRef.current;
    if (s.ended) return;
    const step = dt / 16.67;
    s.time += dt;
    if (keys.current.has('arrowleft') || keys.current.has('a')) s.x -= 6 * step;
    if (keys.current.has('arrowright') || keys.current.has('d')) s.x += 6 * step;
    s.x = Math.max(24, Math.min(W - 24, s.x));

    s.spawn -= dt;
    if (s.spawn <= 0) {
      s.spawn = Math.max(260, 700 - (s.score / 20) * 40);
      s.items.push({
        x: 20 + Math.random() * (W - 40),
        y: -20,
        speed: (1.6 + Math.random() * 1.4 + s.score / 300) * step,
        bad: Math.random() < 0.35,
        emoji: Math.random() < 0.35 ? '💎' : '⭐',
      });
    }

    for (let i = s.items.length - 1; i >= 0; i--) {
      const it = s.items[i];
      it.y += it.speed;
      if (it.y > H - 60 && Math.abs(it.x - s.x) < 42) {
        if (it.bad) {
          s.lives--;
          if (s.lives <= 0) {
            s.ended = true;
            onGameOver(s.score);
          }
        } else {
          s.score += it.emoji === '💎' ? 25 : 10;
          onScore(s.score);
        }
        s.items.splice(i, 1);
      } else if (it.y > H + 30) s.items.splice(i, 1);
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a0a1a');
    bg.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff10';
    for (let i = 0; i < W; i += 40) ctx.fillRect(i, 0, 1, H);

    ctx.font = '30px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    s.items.forEach((it) => {
      ctx.fillStyle = it.bad ? '#ff6b6b' : theme.primary;
      ctx.beginPath();
      ctx.arc(it.x, it.y, 18, 0, Math.PI * 2);
      ctx.globalAlpha = 0.25;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillText(it.emoji, it.x, it.y);
    });

    ctx.fillStyle = theme.primary;
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(s.x, H - 40, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, true);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        stateRef.current.x = ((e.clientX - rect.left) / rect.width) * W;
      }}
      style={{ border: `2px solid ${theme.primary}`, borderRadius: 16, maxWidth: '100%', touchAction: 'none' }}
    />
  );
}

/* ------------------------------ 射击 ------------------------------ */
function ShooterMode({ theme, onScore, onGameOver }: ModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useKeys(true);
  const stateRef = useRef({
    x: 240,
    bullets: [] as { x: number; y: number }[],
    enemies: [] as { x: number; y: number; alive: boolean }[],
    lives: 3,
    score: 0,
    fire: 0,
    dir: 1,
    drop: 0,
    wave: 1,
    ended: false,
  });
  const W = 480;
  const H = 560;

  const makeEnemies = (wave: number) => {
    const list = [] as { x: number; y: number; alive: boolean }[];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 7; c++) {
        list.push({ x: 50 + c * 56, y: 50 + r * 42, alive: true });
      }
    }
    return { list, wave };
  };

  useEffect(() => {
    stateRef.current.enemies = makeEnemies(1).list;
  }, []);

  useRaf((dt) => {
    const s = stateRef.current;
    if (s.ended) return;
    const step = dt / 16.67;
    if (keys.current.has('arrowleft') || keys.current.has('a')) s.x -= 6 * step;
    if (keys.current.has('arrowright') || keys.current.has('d')) s.x += 6 * step;
    s.x = Math.max(24, Math.min(W - 24, s.x));

    s.fire -= dt;
    if (s.fire <= 0) {
      s.fire = 320;
      s.bullets.push({ x: s.x, y: H - 60 });
    }

    const alive = s.enemies.filter((e) => e.alive);
    const speed = (0.35 + s.wave * 0.12) * step;
    s.drop += speed;
    if (s.drop > 26) {
      s.drop = 0;
      s.dir *= -1;
      alive.forEach((e) => (e.y += 14));
    }
    alive.forEach((e) => (e.x += 0.5 * s.dir * step));

    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const b = s.bullets[i];
      b.y -= 9 * step;
      if (b.y < -10) s.bullets.splice(i, 1);
    }

    s.bullets.forEach((b) => {
      s.enemies.forEach((e) => {
        if (e.alive && Math.abs(e.x - b.x) < 24 && Math.abs(e.y - b.y) < 22) {
          e.alive = false;
          b.y = -99;
          s.score += 10;
          onScore(s.score);
        }
      });
    });
    s.bullets = s.bullets.filter((b) => b.y > -10);

    const remaining = s.enemies.filter((e) => e.alive);
    if (remaining.length === 0) {
      s.wave++;
      s.score += 50;
      onScore(s.score);
      s.enemies = makeEnemies(s.wave).list;
      s.bullets = [];
    }
    if (remaining.some((e) => e.y > H - 90)) {
      s.ended = true;
      onGameOver(s.score);
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#06060f';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.05 + ((i * 7) % 10) / 100})`;
      ctx.fillRect((i * 83) % W, (i * 47 + s.drop * 3) % H, 2, 2);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '26px serif';
    ctx.fillText('👾', 0, 0);
    s.enemies.forEach((e) => {
      if (e.alive) {
        ctx.fillStyle = theme.primary;
        ctx.font = '26px serif';
        ctx.fillText('👾', e.x, e.y);
      }
    });
    ctx.fillStyle = theme.secondary;
    ctx.shadowColor = theme.secondary;
    ctx.shadowBlur = 12;
    s.bullets.forEach((b) => ctx.fillRect(b.x - 2, b.y, 4, 14));
    ctx.font = '30px serif';
    ctx.fillText('🚀', s.x, H - 40);
    ctx.shadowBlur = 0;
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#ffffff88';
    ctx.textAlign = 'left';
    ctx.fillText(`波次 ${s.wave}   生命 ${s.lives}`, 12, 20);
  }, true);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        stateRef.current.x = ((e.clientX - rect.left) / rect.width) * W;
      }}
      style={{ border: `2px solid ${theme.primary}`, borderRadius: 16, maxWidth: '100%', touchAction: 'none' }}
    />
  );
}

/* ------------------------------ 跑酷 ------------------------------ */
function RunnerMode({ theme, onScore, onGameOver }: ModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useKeys(true);
  const stateRef = useRef({
    y: 0,
    vy: 0,
    obstacles: [] as { x: number; w: number; h: number }[],
    spawn: 2600,
    score: 0,
    time: 0,
    ended: false,
  });
  const W = 640;
  const H = 320;
  const GROUND = H - 50;

  useRaf((dt) => {
    const s = stateRef.current;
    if (s.ended) return;
    const step = dt / 16.67;
    s.time += dt;
    if ((keys.current.has(' ') || keys.current.has('arrowup') || keys.current.has('w')) && s.y >= 0) {
      s.vy = -11;
      s.y = -1;
    }
    s.vy += 0.7 * step;
    s.y += s.vy * step;
    if (s.y > 0) {
      s.y = 0;
      s.vy = 0;
    }

    s.spawn -= dt;
    if (s.spawn <= 0) {
      s.spawn = Math.max(1000, 2100 - s.score / 20);
      const h = 26 + Math.random() * 30;
      s.obstacles.push({ x: W + 40, w: 26 + Math.random() * 22, h });
    }
    const speed = 5 + Math.min(5, s.score / 250);
    for (let i = s.obstacles.length - 1; i >= 0; i--) {
      const o = s.obstacles[i];
      o.x -= speed * step;
      if (o.x + o.w < -20) s.obstacles.splice(i, 1);
      if (o.x < 120 && o.x + o.w > 86 && s.y > -o.h + 8) {
        s.ended = true;
        onGameOver(s.score);
      }
    }
    s.score = Math.floor(s.time / 100);
    onScore(s.score);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0b1026');
    bg.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff08';
    for (let i = 0; i < W; i += 48) ctx.fillRect(i, 0, 1, H);
    ctx.fillStyle = theme.secondary + '60';
    ctx.fillRect(0, GROUND + 30, W, H - GROUND);
    ctx.fillStyle = theme.primary;
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = 14;
    ctx.fillRect(90, GROUND + s.y, 32, 34);
    ctx.shadowBlur = 0;
    s.obstacles.forEach((o) => {
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(o.x, GROUND + 34 - o.h, o.w, o.h);
    });
  }, true);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onPointerDown={() => {
        if (stateRef.current.y >= 0) {
          stateRef.current.vy = -11;
          stateRef.current.y = -1;
        }
      }}
      style={{ border: `2px solid ${theme.primary}`, borderRadius: 16, maxWidth: '100%', touchAction: 'none' }}
    />
  );
}

/* ------------------------------ 打砖块 ------------------------------ */
function BreakoutMode({ theme, onScore, onGameOver }: ModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useKeys(true);
  const W = 480;
  const H = 520;
  const stateRef = useRef({
    px: 190,
    ball: { x: 240, y: 380, vx: 4, vy: -4 },
    bricks: [] as { x: number; y: number; alive: boolean; color: string }[],
    lives: 3,
    score: 0,
    ended: false,
  });

  const buildBricks = () => {
    const list: { x: number; y: number; alive: boolean; color: string }[] = [];
    const colors = ['#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#a855f7'];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 8; c++) {
        list.push({ x: 24 + c * 55, y: 40 + r * 28, alive: true, color: colors[r] });
      }
    }
    return list;
  };
  useEffect(() => {
    stateRef.current.bricks = buildBricks();
  }, []);

  useRaf((dt) => {
    const s = stateRef.current;
    if (s.ended) return;
    const step = dt / 16.67;
    if (keys.current.has('arrowleft') || keys.current.has('a')) s.px -= 7 * step;
    if (keys.current.has('arrowright') || keys.current.has('d')) s.px += 7 * step;
    s.px = Math.max(0, Math.min(W - 100, s.px));

    s.ball.x += s.ball.vx * step;
    s.ball.y += s.ball.vy * step;
    if (s.ball.x < 8 || s.ball.x > W - 8) s.ball.vx *= -1;
    if (s.ball.y < 8) s.ball.vy *= -1;
    if (s.ball.y > H - 26 && s.ball.x > s.px && s.ball.x < s.px + 100) s.ball.vy = -Math.abs(s.ball.vy);
    if (s.ball.y > H) {
      s.lives--;
      if (s.lives <= 0) {
        s.ended = true;
        onGameOver(s.score);
      } else {
        s.ball = { x: 240, y: 380, vx: 4, vy: -4 };
      }
    }

    s.bricks.forEach((b) => {
      if (b.alive && s.ball.x > b.x && s.ball.x < b.x + 48 && s.ball.y > b.y && s.ball.y < b.y + 22) {
        b.alive = false;
        s.ball.vy *= -1;
        s.score += 10;
        onScore(s.score);
      }
    });

    if (s.bricks.every((b) => !b.alive)) {
      s.bricks = buildBricks();
      s.ball = { x: 240, y: 380, vx: 4, vy: -4 };
      s.score += 100;
      onScore(s.score);
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#07070f';
    ctx.fillRect(0, 0, W, H);
    s.bricks.forEach((b) => {
      if (!b.alive) return;
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(b.x, b.y, 48, 20);
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = theme.primary;
    ctx.fillRect(s.px, H - 20, 100, 10);
    ctx.beginPath();
    ctx.arc(s.ball.x, s.ball.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#ffffff88';
    ctx.fillText(`生命 ${s.lives}`, 12, 18);
  }, true);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        stateRef.current.px = Math.max(0, Math.min(W - 100, ((e.clientX - rect.left) / rect.width) * W - 50));
      }}
      style={{ border: `2px solid ${theme.primary}`, borderRadius: 16, maxWidth: '100%', touchAction: 'none' }}
    />
  );
}

/* ------------------------------ 三消 ------------------------------ */
const MATCH_COLORS = ['#ff6b9d', '#06b6d4', '#22c55e', '#fbbf24', '#a855f7'];

function randomGrid(rows: number, cols: number) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => Math.floor(Math.random() * MATCH_COLORS.length)));
}

function findMatches(g: number[][]) {
  const set = new Set<string>();
  for (let r = 0; r < g.length; r++) {
    for (let c = 0; c < g[0].length - 2; c++) {
      if (g[r][c] >= 0 && g[r][c] === g[r][c + 1] && g[r][c] === g[r][c + 2]) {
        set.add(`${r},${c}`);
        set.add(`${r},${c + 1}`);
        set.add(`${r},${c + 2}`);
      }
    }
  }
  for (let c = 0; c < g[0].length; c++) {
    for (let r = 0; r < g.length - 2; r++) {
      if (g[r][c] >= 0 && g[r][c] === g[r + 1][c] && g[r][c] === g[r + 2][c]) {
        set.add(`${r},${c}`);
        set.add(`${r + 1},${c}`);
        set.add(`${r + 2},${c}`);
      }
    }
  }
  return set;
}

function Match3Mode({ theme, onScore, onGameOver }: ModeProps) {
  const ROWS = 8;
  const COLS = 8;
  const [grid, setGrid] = useState(() => randomGrid(ROWS, COLS));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [combo, setCombo] = useState(1);

  const overRef = useRef(onGameOver);
  overRef.current = onGameOver;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const endedRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      setTime((v) => {
        if (v <= 1) {
          clearInterval(t);
          if (!endedRef.current) {
            endedRef.current = true;
            overRef.current(scoreRef.current);
          }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const cascade = (g: number[][], base: number) => {
    let next = g.map((r) => [...r]);
    let gained = 0;
    let guard = 0;
    let matches = findMatches(next);
    while (matches.size > 0 && guard < 30) {
      gained += matches.size * 10 * base;
      matches.forEach((k) => {
        const [r, c] = k.split(',').map(Number);
        next[r][c] = -1;
      });
      for (let c = 0; c < COLS; c++) {
        let write = ROWS - 1;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (next[r][c] >= 0) {
            next[write][c] = next[r][c];
            if (write !== r) next[r][c] = -1;
            write--;
          }
        }
        for (let r = write; r >= 0; r--) next[r][c] = Math.floor(Math.random() * MATCH_COLORS.length);
      }
      matches = findMatches(next);
      guard++;
    }
    return { next, gained };
  };

  const clickCell = (r: number, c: number) => {
    if (time <= 0) return;
    if (!selected) {
      setSelected([r, c]);
      return;
    }
    const [sr, sc] = selected;
    if (Math.abs(sr - r) + Math.abs(sc - c) !== 1) {
      setSelected([r, c]);
      return;
    }
    const copy = grid.map((row) => [...row]);
    [copy[sr][sc], copy[r][c]] = [copy[r][c], copy[sr][sc]];
    const matches = findMatches(copy);
    if (matches.size > 0) {
      const { next, gained } = cascade(copy, combo);
      setGrid(next);
      const nextScore = score + gained;
      setScore(nextScore);
      setCombo((v) => Math.min(5, v + 1));
      onScore(nextScore);
    } else {
      setCombo(1);
    }
    setSelected(null);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
        <span>得分 <b style={{ color: theme.primary }}>{score}</b></span>
        <span>连击 <b style={{ color: theme.secondary }}>x{combo}</b></span>
        <span>时间 <b style={{ color: time <= 10 ? '#ff4444' : '#fff' }}>{time}s</b></span>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 42px)` }}>
        {grid.map((row, r) =>
          row.map((v, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => clickCell(r, c)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                border: selected && selected[0] === r && selected[1] === c ? '2px solid #fff' : '2px solid transparent',
                background: v >= 0 ? MATCH_COLORS[v] : 'transparent',
                boxShadow: v >= 0 ? `0 0 10px ${MATCH_COLORS[v]}55` : 'none',
                cursor: 'pointer',
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------ 记忆配对 ------------------------------ */
const MEMORY_ICONS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🍑', '🥝'];

function MemoryMode({ theme, onScore, onGameOver }: ModeProps) {
  const [cards, setCards] = useState(() => {
    const arr = MEMORY_ICONS.flatMap((v, i) => [{ id: i * 2, value: v }, { id: i * 2 + 1, value: v }]);
    return arr.map((v) => ({ ...v, flipped: false, done: false })).sort(() => Math.random() - 0.5);
  });
  const [flipped, setFlipped] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(90);
  const [locked, setLocked] = useState(false);

  const overRef = useRef(onGameOver);
  overRef.current = onGameOver;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const endedRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      setTime((v) => {
        if (v <= 1) {
          clearInterval(t);
          if (!endedRef.current) {
            endedRef.current = true;
            overRef.current(scoreRef.current);
          }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const click = (index: number) => {
    if (locked || time <= 0) return;
    const card = cards[index];
    if (card.flipped || card.done) return;
    const next = cards.map((c, i) => (i === index ? { ...c, flipped: true } : c));
    const nf = [...flipped, index];
    setCards(next);
    setFlipped(nf);
    if (nf.length === 2) {
      setLocked(true);
      const [a, b] = nf;
      if (next[a].value === next[b].value) {
        setTimeout(() => {
          setCards((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, done: true, flipped: false } : c)));
          const ns = score + 20;
          setScore(ns);
          onScore(ns);
          setFlipped([]);
          setLocked(false);
          if (next.every((c, i) => c.done || i === a || i === b)) {
            onGameOver(ns + time * 2);
          }
        }, 240);
      } else {
        setTimeout(() => {
          setCards((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c)));
          setFlipped([]);
          setLocked(false);
        }, 600);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
        <span>得分 <b style={{ color: theme.primary }}>{score}</b></span>
        <span>时间 <b style={{ color: time <= 10 ? '#ff4444' : '#fff' }}>{time}s</b></span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <button
            key={c.id}
            onClick={() => click(i)}
            style={{
              width: 72,
              height: 84,
              borderRadius: 12,
              fontSize: 30,
              background: c.done ? `${theme.secondary}33` : c.flipped ? theme.primary : 'rgba(255,255,255,0.08)',
              border: `2px solid ${c.done ? theme.secondary : 'rgba(255,255,255,0.15)'}`,
              cursor: 'pointer',
            }}
          >
            {c.flipped || c.done ? c.value : '❔'}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ 迷宫 ------------------------------ */
function MazeMode({ theme, onScore, onGameOver }: ModeProps) {
  const SIZE = 15;
  const CELL = 28;
  const W = SIZE * CELL;
  const generate = () => {
    const maze = Array.from({ length: SIZE }, () => Array(SIZE).fill(1));
    const carve = (r: number, c: number) => {
      maze[r][c] = 0;
      const dirs = [
        [0, 2],
        [0, -2],
        [2, 0],
        [-2, 0],
      ].sort(() => Math.random() - 0.5);
      dirs.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr > 0 && nr < SIZE && nc > 0 && nc < SIZE && maze[nr][nc] === 1) {
          maze[r + dr / 2][c + dc / 2] = 0;
          carve(nr, nc);
        }
      });
    };
    carve(1, 1);
    maze[SIZE - 2][SIZE - 2] = 0;
    return maze;
  };
  const [maze, setMaze] = useState(generate);
  const [pos, setPos] = useState<[number, number]>([1, 1]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(90);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (ended) return;
    const t = setInterval(() => setTime((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [ended]);

  useEffect(() => {
    if (time === 0 && !ended) {
      setEnded(true);
      onGameOver(0);
    }
  }, [time, ended, onGameOver]);

  const move = useCallback(
    (dr: number, dc: number) => {
      if (ended) return;
      const [r, c] = pos;
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || maze[nr][nc] === 1) return;
      setPos([nr, nc]);
      setMoves((m) => m + 1);
      if (nr === SIZE - 2 && nc === SIZE - 2) {
        setEnded(true);
        const s = Math.max(100, 1200 - moves * 5 - (90 - time) * 3);
        onScore(s);
        onGameOver(s);
      }
    },
    [ended, maze, pos, moves, time, onScore, onGameOver]
  );

  useEffect(() => {
    if (ended) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') {
        e.preventDefault();
        move(-1, 0);
      } else if (k === 'arrowdown' || k === 's') {
        e.preventDefault();
        move(1, 0);
      } else if (k === 'arrowleft' || k === 'a') {
        e.preventDefault();
        move(0, -1);
      } else if (k === 'arrowright' || k === 'd') {
        e.preventDefault();
        move(0, 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, ended]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
        <span>步数 <b style={{ color: theme.primary }}>{moves}</b></span>
        <span>时间 <b style={{ color: time <= 15 ? '#ff4444' : '#fff' }}>{time}s</b></span>
        <button onClick={() => { setMaze(generate()); setPos([1, 1]); setMoves(0); setTime(90); setEnded(false); }} style={{ color: theme.secondary }}>
          重开迷宫
        </button>
      </div>
      <canvas
        ref={(el) => {
          if (!el) return;
          const ctx = el.getContext('2d');
          if (!ctx) return;
          ctx.fillStyle = '#080812';
          ctx.fillRect(0, 0, W, W);
          for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
              if (maze[r][c] === 1) {
                ctx.fillStyle = '#22223a';
                ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
              }
            }
          }
          ctx.fillStyle = theme.secondary;
          ctx.fillRect((SIZE - 2) * CELL, (SIZE - 2) * CELL, CELL, CELL);
          ctx.fillStyle = theme.primary;
          ctx.beginPath();
          ctx.arc(pos[1] * CELL + CELL / 2, pos[0] * CELL + CELL / 2, CELL * 0.32, 0, Math.PI * 2);
          ctx.fill();
        }}
        width={W}
        height={W}
        style={{ border: `2px solid ${theme.primary}`, borderRadius: 12, maxWidth: '100%' }}
      />
      <div className="grid grid-cols-3 gap-2">
        <span />
        <button className="px-5 py-2 rounded bg-white/10" onClick={() => move(-1, 0)}>↑</button>
        <span />
        <button className="px-5 py-2 rounded bg-white/10" onClick={() => move(0, -1)}>←</button>
        <button className="px-5 py-2 rounded bg-white/10" onClick={() => move(1, 0)}>↓</button>
        <button className="px-5 py-2 rounded bg-white/10" onClick={() => move(0, 1)}>→</button>
      </div>
    </div>
  );
}

/* ------------------------------ 知识问答 ------------------------------ */
const QUIZ_BANK: { q: string; options: string[]; answer: number }[] = [
  { q: '太阳系中最大的行星是？', options: ['地球', '木星', '火星', '金星'], answer: 1 },
  { q: '水的化学式是？', options: ['CO₂', 'H₂O', 'O₂', 'NaCl'], answer: 1 },
  { q: '中国的首都是？', options: ['上海', '北京', '广州', '深圳'], answer: 1 },
  { q: '一年有多少个月？', options: ['10', '11', '12', '13'], answer: 2 },
  { q: '光的速度约为每秒？', options: ['3 万公里', '30 万公里', '300 万公里', '3000 公里'], answer: 1 },
  { q: '世界最高的山峰是？', options: ['乔戈里峰', '珠穆朗玛峰', '乞力马扎罗山', '勃朗峰'], answer: 1 },
  { q: '人体最大的器官是？', options: ['心脏', '肝脏', '皮肤', '大脑'], answer: 2 },
  { q: '下列哪个不是编程语言？', options: ['Python', 'Java', 'HTML', 'Ruby'], answer: 2 },
  { q: '彩虹通常有几种颜色？', options: ['5', '6', '7', '8'], answer: 2 },
  { q: '地球绕太阳一周约需？', options: ['30 天', '365 天', '24 小时', '12 个月'], answer: 1 },
  { q: '“三顾茅庐”说的是谁？', options: ['曹操', '刘备', '孙权', '诸葛亮'], answer: 1 },
  { q: '下列哪个是哺乳动物？', options: ['鲨鱼', '海豚', '企鹅', '鳄鱼'], answer: 1 },
  { q: '1 公里等于多少米？', options: ['100', '500', '1000', '10000'], answer: 2 },
  { q: '电灯泡的发明者通常被认为是？', options: ['特斯拉', '爱迪生', '牛顿', '法拉第'], answer: 1 },
  { q: '奥运会几年举办一次？', options: ['2 年', '3 年', '4 年', '5 年'], answer: 2 },
  { q: '“三国演义”的作者是？', options: ['施耐庵', '罗贯中', '吴承恩', '曹雪芹'], answer: 1 },
  { q: '计算机中 1 字节等于多少位？', options: ['4', '8', '16', '32'], answer: 1 },
  { q: '世界上最长的河流是？', options: ['长江', '尼罗河', '亚马逊河', '密西西比河'], answer: 1 },
  { q: '水在标准大气压下的沸点是？', options: ['80℃', '90℃', '100℃', '120℃'], answer: 2 },
  { q: '下列哪个是搜索引擎？', options: ['Photoshop', 'Google', 'Excel', '微信'], answer: 1 },
  { q: '“床前明月光”的下一句是？', options: ['疑是地上霜', '低头思故乡', '举头望明月', '日照香炉生紫烟'], answer: 0 },
  { q: '太阳从哪个方向升起？', options: ['东', '西', '南', '北'], answer: 0 },
  { q: '下列哪个不是水果？', options: ['番茄', '黄瓜', '土豆', '苹果'], answer: 2 },
  { q: '一周有多少天？', options: ['5', '6', '7', '8'], answer: 2 },
  { q: '“hello” 的中文意思是？', options: ['再见', '你好', '谢谢', '对不起'], answer: 1 },
  { q: '下列哪个是质数？', options: ['9', '15', '17', '21'], answer: 2 },
];

function QuizMode({ theme, onScore, onGameOver }: ModeProps) {
  const [questions] = useState(() => [...QUIZ_BANK].sort(() => Math.random() - 0.5).slice(0, 10));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [time, setTime] = useState(15);

  const current = questions[index];

  useEffect(() => {
    if (picked !== null) return;
    if (time <= 0) {
      nextQuestion(false);
      return;
    }
    const t = setTimeout(() => setTime((v) => v - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, picked]);

  const nextQuestion = (correct: boolean) => {
    const ns = correct ? score + 10 : score;
    setScore(ns);
    onScore(ns);
    if (index >= questions.length - 1) {
      onGameOver(ns);
      return;
    }
    setIndex((v) => v + 1);
    setPicked(null);
    setTime(15);
  };

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    setTimeout(() => nextQuestion(i === current.answer), 650);
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md">
      <div className="flex gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
        <span>第 {index + 1} / {questions.length} 题</span>
        <span>得分 <b style={{ color: theme.primary }}>{score}</b></span>
        <span>剩余 <b style={{ color: time <= 5 ? '#ff4444' : '#fff' }}>{time}s</b></span>
      </div>
      <div className="w-full text-center text-lg font-bold" style={{ color: '#fff' }}>{current.q}</div>
      <div className="grid grid-cols-1 gap-3 w-full">
        {current.options.map((opt, i) => {
          const isRight = picked !== null && i === current.answer;
          const isWrong = picked === i && i !== current.answer;
          return (
            <button
              key={opt}
              onClick={() => choose(i)}
              className="px-4 py-3 rounded-xl text-left"
              style={{
                background: isRight ? '#22c55e33' : isWrong ? '#ef444433' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isRight ? '#22c55e' : isWrong ? '#ef4444' : 'rgba(255,255,255,0.14)'}`,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ 数学速算 ------------------------------ */
function MathMode({ theme, onScore, onGameOver }: ModeProps) {
  const make = () => {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = 2 + Math.floor(Math.random() * 20);
    let b = 2 + Math.floor(Math.random() * 12);
    if (op === '-' && b > a) [a, b] = [b, a];
    const answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
    const options = new Set<number>([answer]);
    while (options.size < 4) options.add(answer + Math.floor(Math.random() * 11) - 5);
    return { text: `${a} ${op} ${b} = ?`, answer, options: [...options].sort(() => Math.random() - 0.5) };
  };
  const [q, setQ] = useState(make);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [feedback, setFeedback] = useState('');
  const [locked, setLocked] = useState(false);

  const overRef = useRef(onGameOver);
  overRef.current = onGameOver;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const endedRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      setTime((v) => {
        if (v <= 1) {
          clearInterval(t);
          if (!endedRef.current) {
            endedRef.current = true;
            overRef.current(scoreRef.current);
          }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const pick = (v: number) => {
    if (locked || time <= 0) return;
    setLocked(true);
    if (v === q.answer) {
      const ns = score + 10;
      setScore(ns);
      onScore(ns);
      setFeedback('正确 +10');
    } else {
      setFeedback(`答错了，答案是 ${q.answer}`);
    }
    setTimeout(() => {
      setQ(make());
      setFeedback('');
      setLocked(false);
    }, 500);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
        <span>得分 <b style={{ color: theme.primary }}>{score}</b></span>
        <span>时间 <b style={{ color: time <= 10 ? '#ff4444' : '#fff' }}>{time}s</b></span>
      </div>
      <div className="text-4xl font-bold" style={{ color: '#fff' }}>{q.text}</div>
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((v) => (
          <button key={v} onClick={() => pick(v)} className="px-8 py-3 rounded-xl text-xl" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: `1px solid ${theme.primary}55` }}>
            {v}
          </button>
        ))}
      </div>
      <div style={{ color: feedback.includes('正确') ? '#22c55e' : '#ff6b6b', minHeight: 24 }}>{feedback}</div>
    </div>
  );
}

/* ------------------------------ 经营放置 ------------------------------ */
function IdleMode({ theme, gameName, onScore, onGameOver }: ModeProps) {
  const [coins, setCoins] = useState(0);
  const [income, setIncome] = useState(1);
  const [tap, setTap] = useState(1);
  const [level, setLevel] = useState(1);
  const [ended, setEnded] = useState(false);
  const goal = 1000;

  useEffect(() => {
    const t = setInterval(() => {
      setCoins((v) => v + income);
    }, 1000);
    return () => clearInterval(t);
  }, [income]);

  useEffect(() => {
    onScore(Math.floor(coins));
    if (coins >= goal && !ended) {
      setEnded(true);
      onGameOver(coins);
    }
  }, [coins, ended, onScore, onGameOver, goal]);

  const work = () => {
    setCoins((v) => v + tap);
  };

  const upgrade = (type: 'income' | 'tap' | 'level') => {
    const cost = type === 'income' ? 30 + income * 20 : type === 'tap' ? 25 + tap * 15 : 100 + level * 80;
    if (coins < cost) return;
    setCoins((v) => v - cost);
    if (type === 'income') setIncome((v) => v + 2);
    if (type === 'tap') setTap((v) => v + 2);
    if (type === 'level') {
      setLevel((v) => v + 1);
      setIncome((v) => Math.round(v * 1.6));
      setTap((v) => Math.round(v * 1.4));
    }
  };

  const upCost = (type: 'income' | 'tap' | 'level') =>
    type === 'income' ? 30 + income * 20 : type === 'tap' ? 25 + tap * 15 : 100 + level * 80;

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md">
      <div className="flex gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
        <span>收益 <b style={{ color: theme.primary }}>{Math.floor(coins)}</b></span>
        <span>每秒 <b style={{ color: theme.secondary }}>+{income}</b></span>
        <span>等级 {level}</span>
      </div>
      <div className="w-full h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (coins / goal) * 100)}%`, background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})` }} />
      </div>
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={work}
        className="w-44 h-44 rounded-full text-6xl"
        style={{ background: `radial-gradient(circle at 35% 30%, ${theme.primary}, ${theme.secondary}88)`, boxShadow: `0 0 40px ${theme.primary}66` }}
      >
        {theme.icon}
      </motion.button>
      <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>点击{gameName}开始工作，每秒自动收益</div>
      <div className="grid grid-cols-3 gap-3 w-full">
        <button disabled={coins < upCost('tap')} onClick={() => upgrade('tap')} className="px-3 py-3 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', opacity: coins < upCost('tap') ? 0.45 : 1, cursor: coins < upCost('tap') ? 'not-allowed' : 'pointer' }}>
          点击 +2
          <br />💰 {upCost('tap')}
        </button>
        <button disabled={coins < upCost('income')} onClick={() => upgrade('income')} className="px-3 py-3 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', opacity: coins < upCost('income') ? 0.45 : 1, cursor: coins < upCost('income') ? 'not-allowed' : 'pointer' }}>
          每秒 +2
          <br />💰 {upCost('income')}
        </button>
        <button disabled={coins < upCost('level')} onClick={() => upgrade('level')} className="px-3 py-3 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', opacity: coins < upCost('level') ? 0.45 : 1, cursor: coins < upCost('level') ? 'not-allowed' : 'pointer' }}>
          全面升级
          <br />💰 {upCost('level')}
        </button>
      </div>
      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>目标：累计 {goal} 收益</div>
    </div>
  );
}

/* ------------------------------ 五子棋 ------------------------------ */
function BoardMode({ theme, onScore, onGameOver }: ModeProps) {
  const SIZE = 11;
  const [board, setBoard] = useState<number[][]>(() => Array.from({ length: SIZE }, () => Array(SIZE).fill(0)));
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [winner, setWinner] = useState<number>(0);
  const [last, setLast] = useState<{ r: number; c: number } | null>(null);

  const checkWin = (b: number[][], r: number, c: number, p: number) => {
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    return dirs.some(([dr, dc]) => {
      let count = 1;
      for (let i = 1; i < 5; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || b[nr][nc] !== p) break;
        count++;
      }
      for (let i = 1; i < 5; i++) {
        const nr = r - dr * i;
        const nc = c - dc * i;
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || b[nr][nc] !== p) break;
        count++;
      }
      return count >= 5;
    });
  };

  const evaluate = (b: number[][], r: number, c: number, p: number) => {
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    let score = 0;
    dirs.forEach(([dr, dc]) => {
      let count = 1;
      let open = 0;
      for (let i = 1; i < 5; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) break;
        if (b[nr][nc] === p) count++;
        else {
          if (b[nr][nc] === 0) open++;
          break;
        }
      }
      for (let i = 1; i < 5; i++) {
        const nr = r - dr * i;
        const nc = c - dc * i;
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) break;
        if (b[nr][nc] === p) count++;
        else {
          if (b[nr][nc] === 0) open++;
          break;
        }
      }
      if (count >= 5) score += 100000;
      else if (count === 4) score += open >= 1 ? 8000 : 1200;
      else if (count === 3) score += open === 2 ? 800 : 120;
      else if (count === 2) score += open === 2 ? 60 : 10;
    });
    return score + (10 - (Math.abs(r - 5) + Math.abs(c - 5)));
  };

  const aiMove = (b: number[][]) => {
    let best = { r: 5, c: 5, s: -Infinity };
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (b[r][c] !== 0) continue;
        const s = evaluate(b, r, c, 2) * 1.05 + evaluate(b, r, c, 1);
        if (s > best.s) best = { r, c, s };
      }
    }
    return { r: best.r, c: best.c };
  };

  const finish = (p: number, b: number[][]) => {
    setWinner(p);
    const score = p === 1 ? 100 : 0;
    onScore(score);
    setTimeout(() => onGameOver(score), 500);
    setBoard(b);
  };

  const click = (r: number, c: number) => {
    if (winner || turn !== 'player' || board[r][c] !== 0) return;
    const b = board.map((row) => [...row]);
    b[r][c] = 1;
    setLast({ r, c });
    setBoard(b);
    if (checkWin(b, r, c, 1)) {
      finish(1, b);
      return;
    }
    setTurn('ai');
    setTimeout(() => {
      const move = aiMove(b);
      const nb = b.map((row) => [...row]);
      nb[move.r][move.c] = 2;
      setLast(move);
      setBoard(nb);
      if (checkWin(nb, move.r, move.c, 2)) {
        finish(2, nb);
      } else {
        setTurn('player');
      }
    }, 220);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-5 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
        <span>你 ⚫</span>
        <span>AI ⚪</span>
        <span>{winner ? (winner === 1 ? '你赢了！' : 'AI 获胜') : turn === 'player' ? '你的回合' : 'AI 思考中…'}</span>
      </div>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${SIZE}, 30px)`, background: '#deb887', padding: 6, borderRadius: 10 }}>
        {board.map((row, r) =>
          row.map((v, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => click(r, c)}
              style={{
                width: 30,
                height: 30,
                border: '1px solid #b89b72',
                background: last && last.r === r && last.c === c ? '#fff3c4' : '#deb887',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: v === 1 ? '#111' : v === 2 ? '#fff' : 'transparent', border: v === 2 ? '1px solid #999' : 'none' }} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------ 节奏 ------------------------------ */
function RhythmMode({ theme, onScore, onGameOver }: ModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 400;
  const H = 560;
  const LANES = 4;
  const laneX = (i: number) => (W / LANES) * i + W / LANES / 2;
  const HIT_Y = H - 90;
  const stateRef = useRef({
    notes: [] as { lane: number; y: number; hit: boolean }[],
    keyHeld: [false, false, false, false],
    spawn: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    time: 0,
    ended: false,
  });
  const keys = useKeys(true);

  const laneOfKey = (k: string) => (k === 'd' ? 0 : k === 'f' ? 1 : k === 'j' ? 2 : k === 'k' ? 3 : -1);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const lane = laneOfKey(e.key.toLowerCase());
      if (lane >= 0) stateRef.current.keyHeld[lane] = true;
    };
    const onUp = (e: KeyboardEvent) => {
      const lane = laneOfKey(e.key.toLowerCase());
      if (lane >= 0) stateRef.current.keyHeld[lane] = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  useRaf((dt) => {
    const s = stateRef.current;
    if (s.ended) return;
    const step = dt / 16.67;
    s.time += dt;
    s.spawn -= dt;
    if (s.spawn <= 0) {
      s.spawn = 520;
      s.notes.push({ lane: Math.floor(Math.random() * LANES), y: -20, hit: false });
    }
    for (let i = s.notes.length - 1; i >= 0; i--) {
      const n = s.notes[i];
      n.y += 5 * step;
      const held = keys.current.has('d') || keys.current.has('f') || keys.current.has('j') || keys.current.has('k');
      const pressedLane = keys.current.has('d') ? 0 : keys.current.has('f') ? 1 : keys.current.has('j') ? 2 : keys.current.has('k') ? 3 : -1;
      if (!n.hit && pressedLane === n.lane && Math.abs(n.y - HIT_Y) < 46) {
        n.hit = true;
        s.combo++;
        s.maxCombo = Math.max(s.maxCombo, s.combo);
        s.score += 10 + Math.min(20, s.combo);
        onScore(s.score);
      }
      if (n.y > H + 20) {
        if (!n.hit) s.combo = 0;
        s.notes.splice(i, 1);
      }
    }

    if (s.time > 45000) {
      s.ended = true;
      onGameOver(s.score);
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#07070f';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i <= LANES; i++) {
      ctx.strokeStyle = '#ffffff12';
      ctx.beginPath();
      ctx.moveTo((W / LANES) * i, 0);
      ctx.lineTo((W / LANES) * i, H);
      ctx.stroke();
    }
    ctx.fillStyle = `${theme.secondary}22`;
    ctx.fillRect(0, HIT_Y - 30, W, 60);
    ctx.strokeStyle = theme.secondary;
    ctx.beginPath();
    ctx.moveTo(0, HIT_Y);
    ctx.lineTo(W, HIT_Y);
    ctx.stroke();
    s.notes.forEach((n) => {
      ctx.fillStyle = n.hit ? '#22c55e' : theme.primary;
      ctx.shadowColor = theme.primary;
      ctx.shadowBlur = 12;
      ctx.fillRect(laneX(n.lane) - 26, n.y - 14, 52, 22);
    });
    ctx.shadowBlur = 0;
    for (let i = 0; i < LANES; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(['D', 'F', 'J', 'K'][i], laneX(i), H - 40);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`得分 ${s.score}  连击 ${s.combo}`, 12, 22);
  }, true);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const lane = Math.max(0, Math.min(3, Math.floor(((e.clientX - rect.left) / rect.width) * LANES)));
        const s = stateRef.current;
        let best: { n: (typeof s.notes)[number]; d: number } | null = null;
        s.notes.forEach((n) => {
          if (n.lane !== lane || n.hit) return;
          const d = Math.abs(n.y - HIT_Y);
          if (d < 46 && (!best || d < best.d)) best = { n, d };
        });
        if (best) {
          best.n.hit = true;
          s.combo++;
          s.maxCombo = Math.max(s.maxCombo, s.combo);
          s.score += 10 + Math.min(20, s.combo);
          onScore(s.score);
        }
      }}
      style={{ border: `2px solid ${theme.primary}`, borderRadius: 16, maxWidth: '100%', touchAction: 'none' }}
    />
  );
}

/* ------------------------------ 吞噬 ------------------------------ */
function AgarMode({ theme, onScore, onGameOver }: ModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 560;
  const H = 560;
  const keys = useKeys(true);
  const stateRef = useRef({
    px: W / 2,
    py: H / 2,
    radius: 20,
    dots: [] as { x: number; y: number; r: number; color: string }[],
    ai: [] as { x: number; y: number; r: number; vx: number; vy: number; color: string }[],
    score: 0,
    time: 0,
    ended: false,
    spawn: 0,
  });
  const pointer = useRef({ x: W / 2, y: H / 2, active: false });
  const initializedRef = useRef(false);
  const invincibleRef = useRef(1500);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const s = stateRef.current;
    for (let i = 0; i < 60; i++) {
      s.dots.push({ x: Math.random() * W, y: Math.random() * H, r: 4 + Math.random() * 4, color: MATCH_COLORS[i % MATCH_COLORS.length] });
    }
    for (let i = 0; i < 6; i++) {
      let x = 0;
      let y = 0;
      do {
        x = Math.random() * W;
        y = Math.random() * H;
      } while (Math.hypot(x - W / 2, y - H / 2) < 180);
      s.ai.push({
        x,
        y,
        r: 14 + Math.random() * 22,
        vx: (Math.random() - 0.5) * 1.4,
        vy: (Math.random() - 0.5) * 1.4,
        color: MATCH_COLORS[(i + 2) % MATCH_COLORS.length],
      });
    }
  }, []);

  useRaf((dt) => {
    const s = stateRef.current;
    if (s.ended) return;
    const step = dt / 16.67;
    s.time += dt;
    if (invincibleRef.current > 0) invincibleRef.current -= dt;
    const speed = 2.8 + 60 / (s.radius + 60);
    let dx = 0;
    let dy = 0;
    if (keys.current.has('arrowleft') || keys.current.has('a')) dx -= 1;
    if (keys.current.has('arrowright') || keys.current.has('d')) dx += 1;
    if (keys.current.has('arrowup') || keys.current.has('w')) dy -= 1;
    if (keys.current.has('arrowdown') || keys.current.has('s')) dy += 1;
    if (dx === 0 && dy === 0 && pointer.current.active) {
      const mx = pointer.current.x - s.px;
      const my = pointer.current.y - s.py;
      const dist = Math.hypot(mx, my);
      if (dist > 2) {
        dx = mx / dist;
        dy = my / dist;
      }
    }
    const len = Math.hypot(dx, dy) || 1;
    s.px += (dx / len) * speed * step;
    s.py += (dy / len) * speed * step;
    s.px = Math.max(s.radius, Math.min(W - s.radius, s.px));
    s.py = Math.max(s.radius, Math.min(H - s.radius, s.py));

    s.dots = s.dots.filter((dot) => {
      const d = Math.hypot(dot.x - s.px, dot.y - s.py);
      if (d < s.radius + dot.r) {
        s.radius = Math.min(80, s.radius + 0.6);
        s.score += 2;
        onScore(s.score);
        return false;
      }
      return true;
    });
    while (s.dots.length < 60) {
      s.dots.push({ x: Math.random() * W, y: Math.random() * H, r: 4 + Math.random() * 4, color: MATCH_COLORS[s.dots.length % MATCH_COLORS.length] });
    }

    s.ai.forEach((a) => {
      a.x += a.vx * step;
      a.y += a.vy * step;
      if (a.x < a.r || a.x > W - a.r) a.vx *= -1;
      if (a.y < a.r || a.y > H - a.r) a.vy *= -1;
      const d = Math.hypot(a.x - s.px, a.y - s.py);
      if (d < a.r + s.radius) {
        if (s.radius > a.r * 1.05) {
          s.radius = Math.min(90, s.radius + a.r * 0.35);
          s.score += Math.floor(a.r);
          onScore(s.score);
          a.x = Math.random() * W;
          a.y = Math.random() * H;
          a.r = 12 + Math.random() * 18;
        } else if (a.r > s.radius * 1.05 && invincibleRef.current <= 0) {
          s.ended = true;
          onGameOver(s.score);
        }
      }
    });

    if (s.time > 60000) {
      s.ended = true;
      onGameOver(s.score);
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#06060f';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ffffff08';
    for (let i = 0; i < W; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(W, i);
      ctx.stroke();
    }
    s.dots.forEach((d) => {
      ctx.fillStyle = d.color;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    s.ai.forEach((a) => {
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00000088';
      ctx.font = `${Math.max(10, a.r)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('AI', a.x, a.y);
    });
    ctx.fillStyle = theme.primary;
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(s.px, s.py, s.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00000099';
    ctx.font = `${Math.max(12, s.radius * 0.8)}px sans-serif`;
    ctx.fillText('YOU', s.px, s.py);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.font = '14px sans-serif';
    ctx.fillText(`分数 ${s.score}  体型 ${Math.floor(s.radius)}`, 12, 22);
  }, true);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        pointer.current = {
          x: ((e.clientX - rect.left) / rect.width) * W,
          y: ((e.clientY - rect.top) / rect.height) * H,
          active: true,
        };
      }}
      style={{ border: `2px solid ${theme.primary}`, borderRadius: 16, maxWidth: '100%', touchAction: 'none' }}
    />
  );
}

/* ------------------------------ 21 点 ------------------------------ */
interface PlayingCard {
  rank: string;
  suit: string;
  value: number;
}

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS: [string, number][] = [
  ['A', 11],
  ['2', 2],
  ['3', 3],
  ['4', 4],
  ['5', 5],
  ['6', 6],
  ['7', 7],
  ['8', 8],
  ['9', 9],
  ['10', 10],
  ['J', 10],
  ['Q', 10],
  ['K', 10],
];

function newDeck(): PlayingCard[] {
  const deck = RANKS.flatMap(([rank, value]) => SUITS.map((suit) => ({ rank, suit, value })));
  return deck.sort(() => Math.random() - 0.5);
}

function handValue(hand: PlayingCard[]) {
  let total = hand.reduce((sum, c) => sum + c.value, 0);
  let aces = hand.filter((c) => c.rank === 'A').length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function CardMode({ theme, onScore, onGameOver }: ModeProps) {
  const [deck, setDeck] = useState<PlayingCard[]>(newDeck);
  const [player, setPlayer] = useState<PlayingCard[]>([]);
  const [dealer, setDealer] = useState<PlayingCard[]>([]);
  const [chips, setChips] = useState(100);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'result'>('ready');
  const [message, setMessage] = useState('点击「发牌」开始一局');
  const [rounds, setRounds] = useState(0);

  const draw = (source = deck) => {
    const d = source.length > 0 ? [...source] : newDeck();
    const card = d.pop()!;
    return { card, deck: d };
  };

  const finish = (nextChips: number, text: string) => {
    setChips(nextChips);
    setMessage(text);
    setPhase('result');
    setRounds((r) => r + 1);
    onScore(nextChips);
    if (nextChips <= 0) setTimeout(() => onGameOver(0), 500);
    else if (nextChips >= 300) setTimeout(() => onGameOver(nextChips), 500);
  };

  const settle = (p: PlayingCard[], d: PlayingCard[]) => {
    const pv = handValue(p);
    const dv = handValue(d);
    if (pv > 21) finish(chips, '你爆牌了，本局失败');
    else if (dv > 21 || pv > dv) finish(chips + 20, '你赢了！+20');
    else if (pv === dv) finish(chips + 10, '平局，返还筹码');
    else finish(chips, '庄家赢了，本局失败');
  };

  const deal = () => {
    if (phase === 'playing') return;
    if (chips < 10) {
      onGameOver(0);
      return;
    }
    let d = newDeck();
    const p: PlayingCard[] = [];
    const dl: PlayingCard[] = [];
    let first = draw(d);
    p.push(first.card);
    d = first.deck;
    first = draw(d);
    dl.push(first.card);
    d = first.deck;
    first = draw(d);
    p.push(first.card);
    d = first.deck;
    first = draw(d);
    dl.push(first.card);
    d = first.deck;
    setDeck(d);
    setPlayer(p);
    setDealer(dl);
    setChips((v) => v - 10);
    setMessage('要牌还是停牌？');
    setPhase('playing');
  };

  const hit = () => {
    if (phase !== 'playing') return;
    const { card, deck: nd } = draw(deck);
    const next = [...player, card];
    setDeck(nd);
    setPlayer(next);
    if (handValue(next) > 21) settle(next, dealer);
  };

  const stand = () => {
    if (phase !== 'playing') return;
    let d = [...deck];
    const dl = [...dealer];
    while (handValue(dl) < 17) {
      const { card, deck: nd } = draw(d);
      dl.push(card);
      d = nd;
    }
    setDeck(d);
    setDealer(dl);
    settle(player, dl);
  };

  const renderHand = (hand: PlayingCard[], hidden = false) =>
    hand.map((c, i) => (
      <div
        key={`${c.rank}${c.suit}${i}`}
        className="w-16 h-24 rounded-lg flex flex-col items-center justify-center font-bold"
        style={{ background: hidden && i === 1 ? '#1a1a2e' : '#fff', color: hidden && i === 1 ? theme.secondary : c.suit === '♥' || c.suit === '♦' ? '#dc2626' : '#111' }}
      >
        {hidden && i === 1 ? '?' : (
          <>
            <span>{c.rank}</span>
            <span>{c.suit}</span>
          </>
        )}
      </div>
    ));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
        <span>筹码 <b style={{ color: theme.primary }}>{chips}</b></span>
        <span>本局 <b style={{ color: theme.secondary }}>{handValue(player)}</b> 点</span>
        <span>已玩 {rounds} 局</span>
      </div>
      <div className="text-center">
        <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>庄家</div>
        <div className="flex gap-2">{dealer.length ? renderHand(dealer, phase === 'playing') : <div className="text-white/30">等待发牌</div>}</div>
      </div>
      <div className="text-center">
        <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>你</div>
        <div className="flex gap-2">{player.length ? renderHand(player) : <div className="text-white/30">等待发牌</div>}</div>
      </div>
      <div style={{ color: theme.secondary, minHeight: 24 }}>{message}</div>
      <div className="flex gap-3">
        {phase !== 'playing' ? (
          <button onClick={deal} className="px-6 py-2 rounded-xl font-bold" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, color: '#fff' }}>
            发牌 (-10)
          </button>
        ) : (
          <>
            <button onClick={hit} className="px-6 py-2 rounded-xl font-bold" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>要牌</button>
            <button onClick={stand} className="px-6 py-2 rounded-xl font-bold" style={{ background: theme.primary, color: '#000' }}>停牌</button>
          </>
        )}
      </div>
      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>筹码达到 300 即通关，输光则结束</div>
    </div>
  );
}

/* ------------------------------ 主组件 ------------------------------ */
export default function ArcadeGame({
  gameId = '',
  gameName = '小游戏',
  category = '',
  icon,
  onScoreUpdate,
  onGameOver,
  onExit,
}: ArcadeGameProps) {
  const theme = getTheme(gameId, category, icon);
  const mode = resolveMode(gameId, category);
  const [phase, setPhase] = useState<'menu' | 'playing' | 'over'>('menu');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    const saved = localStorage.getItem(`game_highscore_${gameId}`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const endedRef = useRef(false);
  const lastScoreRef = useRef(-1);

  const handleScore = useCallback(
    (value: number) => {
      if (value === lastScoreRef.current) return;
      lastScoreRef.current = value;
      setScore(value);
      onScoreUpdate?.(value);
    },
    [onScoreUpdate]
  );

  const handleGameOver = useCallback(
    (finalScore: number) => {
      if (endedRef.current) return;
      endedRef.current = true;
      setPhase('over');
      setBest((prev) => {
        const next = Math.max(prev, finalScore);
        localStorage.setItem(`game_highscore_${gameId}`, String(next));
        return next;
      });
      onGameOver?.(finalScore);
    },
    [gameId, onGameOver]
  );

  const start = () => {
    endedRef.current = false;
    lastScoreRef.current = -1;
    setScore(0);
    setPhase('playing');
    setRound((r) => r + 1);
  };

  const modeProps: ModeProps = {
    theme,
    gameName,
    onScore: handleScore,
    onGameOver: handleGameOver,
  };

  const renderMode = () => {
    switch (mode) {
      case 'shooter':
        return <ShooterMode key={round} {...modeProps} />;
      case 'runner':
        return <RunnerMode key={round} {...modeProps} />;
      case 'breakout':
        return <BreakoutMode key={round} {...modeProps} />;
      case 'match3':
        return <Match3Mode key={round} {...modeProps} />;
      case 'memory':
        return <MemoryMode key={round} {...modeProps} />;
      case 'maze':
        return <MazeMode key={round} {...modeProps} />;
      case 'quiz':
        return <QuizMode key={round} {...modeProps} />;
      case 'math':
        return <MathMode key={round} {...modeProps} />;
      case 'idle':
        return <IdleMode key={round} {...modeProps} />;
      case 'board':
        return <BoardMode key={round} {...modeProps} />;
      case 'rhythm':
        return <RhythmMode key={round} {...modeProps} />;
      case 'agar':
        return <AgarMode key={round} {...modeProps} />;
      case 'card':
        return <CardMode key={round} {...modeProps} />;
      default:
        return <CatchMode key={round} {...modeProps} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'transparent' }}>
      <div
        className="w-full max-w-3xl rounded-3xl p-5"
        style={{
          background: 'linear-gradient(160deg, rgba(20,20,35,0.95), rgba(10,10,20,0.98))',
          border: `1px solid ${theme.primary}55`,
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${theme.primary}22`,
        }}
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl" style={{ background: `${theme.primary}22`, border: `1px solid ${theme.primary}55` }}>
              {theme.icon}
            </div>
            <div>
              <h1 className="text-xl font-black" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {gameName}
              </h1>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {theme.label} · {MODE_LABEL[mode]}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>本局得分</div>
              <div className="text-2xl font-black" style={{ color: theme.primary }}>{score}</div>
            </div>
            <div className="text-right">
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>最高分</div>
              <div className="text-lg font-bold" style={{ color: theme.secondary }}>{best}</div>
            </div>
          </div>
        </div>

        {phase === 'menu' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-10">
            <div className="text-7xl mb-4">{theme.icon}</div>
            <h2 className="text-2xl font-bold text-white mb-2">{gameName}</h2>
            <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{theme.hint}</p>
            <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>按提示操作，挑战你的最高分</p>
            <div className="flex gap-3 justify-center">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={start} className="px-8 py-3 rounded-2xl font-bold text-white" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, boxShadow: `0 0 24px ${theme.primary}55` }}>
                开始游戏
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onExit} className="px-6 py-3 rounded-2xl font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.14)' }}>
                返回首页
              </motion.button>
            </div>
          </motion.div>
        )}

        {phase === 'playing' && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-full flex justify-center overflow-hidden">{renderMode()}</div>
            <div className="flex items-center gap-3">
              <button onClick={start} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
                重新开始
              </button>
              <button onClick={onExit} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
                返回首页
              </button>
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{theme.hint}</div>
          </div>
        )}

        {phase === 'over' && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
            <div className="text-6xl mb-3">🏁</div>
            <h2 className="text-2xl font-black text-white mb-2">游戏结束</h2>
            <div className="text-4xl font-black mb-1" style={{ color: theme.primary }}>{score}</div>
            <div className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {score >= best && score > 0 ? '🎉 新纪录！' : `最高分：${best}`}
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={start} className="px-7 py-3 rounded-2xl font-bold text-white" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
                再玩一次
              </button>
              <button onClick={onExit} className="px-6 py-3 rounded-2xl font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.14)' }}>
                返回首页
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

const MODE_LABEL: Record<Mode, string> = {
  catch: '接物挑战',
  shooter: '射击闯关',
  runner: '跑酷跳跃',
  breakout: '打砖块',
  match3: '三消',
  memory: '记忆配对',
  maze: '迷宫逃脱',
  quiz: '知识问答',
  math: '速算挑战',
  idle: '经营养成',
  board: '五子棋',
  rhythm: '节奏打击',
  agar: '吞噬竞技',
  card: '21 点',
};
