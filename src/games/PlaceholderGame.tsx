import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { NEON_COLORS } from '../utils/constants';

interface PlaceholderGameProps {
  gameId: string;
  gameName: string;
  category: string;
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  onExit?: () => void;
}

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed?: number;
  color?: string;
  active?: boolean;
}

interface Bullet extends GameObject {
  dx: number;
  dy: number;
}

interface Enemy extends GameObject {
  hp: number;
  type: number;
}

interface Block extends GameObject {
  color: string;
}

interface FallingObject extends GameObject {
  rotation: number;
  rotationSpeed: number;
}

export default function PlaceholderGame({
  gameId,
  gameName,
  category,
  onScoreUpdate,
  onGameOver,
  onExit
}: PlaceholderGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem(`game_highscore_${gameId}`);
    return saved ? parseInt(saved) : 0;
  });

  const gameStateRef = useRef<{
    player: GameObject;
    bullets: Bullet[];
    enemies: Enemy[];
    blocks: Block[];
    fallingObjects: FallingObject[];
    keys: Set<string>;
    lastShot: number;
    lastEnemySpawn: number;
    scoreValue: number;
    startTime: number;
    level: number;
    tetrisBlocks: { x: number; y: number; color: string }[][];
    tetrisCurrent: { x: number; y: number; shape: number; color: string };
    snake: { x: number; y: number }[];
    food: { x: number; y: number };
    maze: number[][];
    playerPos: { x: number; y: number };
    particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[];
  }>({
    player: { x: 400, y: 450, width: 40, height: 40 },
    bullets: [],
    enemies: [],
    blocks: [],
    fallingObjects: [],
    keys: new Set(),
    lastShot: 0,
    lastEnemySpawn: 0,
    scoreValue: 0,
    startTime: 0,
    level: 1,
    tetrisBlocks: [],
    tetrisCurrent: { x: 4, y: 0, shape: 0, color: '#ff6b9d' },
    snake: [],
    food: { x: 10, y: 10 },
    maze: [],
    playerPos: { x: 1, y: 1 },
    particles: []
  });

  const getCategoryIcon = useCallback(() => {
    const icons: Record<string, string> = {
      'puzzle': '🧩',
      'arcade': '🕹️',
      'co-op': '👥',
      'shooting': '🚀',
      'strategy': '💰',
      'tower': '🏰',
      'idle': '💤',
      'board': '♟️',
      'card': '🃏',
      'fighting': '👊',
      'io': '🌐',
      'rhythm': '🎵',
      'music': '🎹',
      'reaction': '🎯',
      'math': '➕',
      'creative': '🎨',
      'match3': '💎',
      'physics': '⚙️',
      '养成': '🐾',
      'sports': '🏃',
      'survival': '🏆',
      'parkour': '🏃',
      'word': '🔤',
      'adventure': '📖',
      'ai': '🤖',
      'coding': '💻',
      'maze': '🗺️',
      'visual': '👁️',
      'retro': '🕹️',
      'language': '🌍',
      'holiday': '🎉',
      'simulation': '🏭',
      'multiplayer': '🎮',
      'escape': '🚪',
      'story': '📖',
      'party': '🎪',
      'pixel': '👾',
      'aibattle': '🤖',
      'tech': '🔬',
      'life': '📋',
      'social': '👥',
      'education': '🧪',
      'career': '👨‍🍳',
      'animal': '🐕',
      'cooking': '🍔',
      'driving': '🚗',
      'craft': '🎨',
      'puzzle2': '🧩',
      '3d': '🎲',
    };
    return icons[category] || '🎮';
  }, [category]);

  const getCategoryColor = useCallback(() => {
    const colors: Record<string, string> = {
      'puzzle': NEON_COLORS.neonCyan,
      'arcade': NEON_COLORS.neonGreen,
      'co-op': NEON_COLORS.neonPink,
      'shooting': NEON_COLORS.danger,
      'strategy': '#f59e0b',
      'tower': NEON_COLORS.neonPurple,
      'idle': '#10b981',
      'board': NEON_COLORS.neonBlue,
      'card': NEON_COLORS.neonCyan,
      'fighting': '#f97316',
      'io': '#84cc16',
      'rhythm': NEON_COLORS.neonPink,
      'music': '#6366f1',
      'reaction': '#f59e0b',
      'math': NEON_COLORS.neonCyan,
      'creative': NEON_COLORS.neonPink,
      'match3': NEON_COLORS.neonPurple,
      'physics': NEON_COLORS.neonGreen,
      '养成': '#f472b6',
      'sports': NEON_COLORS.neonBlue,
      'survival': '#f97316',
      'parkour': NEON_COLORS.neonCyan,
      'word': NEON_COLORS.neonPurple,
      'adventure': '#f59e0b',
      'ai': NEON_COLORS.neonCyan,
      'coding': NEON_COLORS.neonGreen,
      'maze': '#f97316',
      'visual': NEON_COLORS.neonPink,
      'retro': '#f59e0b',
      'language': NEON_COLORS.neonBlue,
      'holiday': NEON_COLORS.danger,
      'simulation': '#84cc16',
      'multiplayer': NEON_COLORS.neonPurple,
      'escape': '#f97316',
      'story': NEON_COLORS.neonPink,
      'party': '#f59e0b',
      'pixel': NEON_COLORS.neonGreen,
      'aibattle': NEON_COLORS.neonCyan,
      'tech': '#6366f1',
      'life': '#10b981',
      'social': NEON_COLORS.neonPink,
      'education': NEON_COLORS.neonBlue,
      'career': '#f97316',
      'animal': '#f472b6',
      'cooking': NEON_COLORS.danger,
      'driving': NEON_COLORS.neonGreen,
      'craft': NEON_COLORS.neonPink,
      'puzzle2': NEON_COLORS.neonPurple,
      '3d': NEON_COLORS.neonPurple,
    };
    return colors[category] || NEON_COLORS.neonPink;
  }, [category]);

  const drawShootingGame = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = gameStateRef.current;
    const elapsed = Date.now() - state.startTime;

    ctx.fillStyle = 'rgba(5, 5, 15, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 50; i++) {
      const x = (i * 137 + elapsed * 0.02) % canvas.width;
      const y = (i * 89 + elapsed * 0.03) % canvas.height;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (state.keys.has('ArrowLeft') || state.keys.has('a')) state.player.x -= 6;
    if (state.keys.has('ArrowRight') || state.keys.has('d')) state.player.x += 6;
    if (state.keys.has('ArrowUp') || state.keys.has('w')) state.player.y -= 6;
    if (state.keys.has('ArrowDown') || state.keys.has('s')) state.player.y += 6;

    state.player.x = Math.max(0, Math.min(canvas.width - state.player.width, state.player.x));
    state.player.y = Math.max(0, Math.min(canvas.height - state.player.height, state.player.y));

    const gradient = ctx.createLinearGradient(
      state.player.x, state.player.y,
      state.player.x + state.player.width, state.player.y + state.player.height
    );
    gradient.addColorStop(0, NEON_COLORS.neonCyan);
    gradient.addColorStop(1, NEON_COLORS.neonPurple);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(state.player.x + state.player.width / 2, state.player.y);
    ctx.lineTo(state.player.x + state.player.width, state.player.y + state.player.height);
    ctx.lineTo(state.player.x, state.player.y + state.player.height);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = NEON_COLORS.neonCyan;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    const now = Date.now();
    if ((state.keys.has(' ') || state.keys.has('ArrowUp')) && now - state.lastShot > 200) {
      state.bullets.push({
        x: state.player.x + state.player.width / 2 - 3,
        y: state.player.y - 10,
        width: 6,
        height: 15,
        dx: 0,
        dy: -10,
        active: true
      });
      state.lastShot = now;
    }

    state.bullets.forEach(bullet => {
      if (!bullet.active) return;
      bullet.y += bullet.dy;

      const bulletGradient = ctx.createLinearGradient(
        bullet.x, bullet.y, bullet.x, bullet.y + bullet.height
      );
      bulletGradient.addColorStop(0, NEON_COLORS.neonYellow);
      bulletGradient.addColorStop(1, NEON_COLORS.neonCyan);
      ctx.fillStyle = bulletGradient;
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

      ctx.shadowColor = NEON_COLORS.neonYellow;
      ctx.shadowBlur = 10;
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      ctx.shadowBlur = 0;

      if (bullet.y < 0) bullet.active = false;
    });
    state.bullets = state.bullets.filter(b => b.active);

    if (now - state.lastEnemySpawn > Math.max(500, 1500 - state.level * 100)) {
      state.enemies.push({
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: 30,
        height: 30,
        speed: 2 + state.level * 0.5,
        hp: 1,
        type: Math.floor(Math.random() * 3),
        active: true
      });
      state.lastEnemySpawn = now;
    }

    state.enemies.forEach(enemy => {
      if (!enemy.active) return;
      enemy.y += enemy.speed || 2;

      const enemyColors = [NEON_COLORS.danger, '#ff8800', NEON_COLORS.neonPink];
      ctx.fillStyle = enemyColors[enemy.type];
      ctx.beginPath();
      ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = enemyColors[enemy.type];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();

      if (enemy.y > canvas.height) enemy.active = false;

      state.bullets.forEach(bullet => {
        if (!bullet.active) return;
        if (
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          bullet.active = false;
          enemy.hp--;
          if (enemy.hp <= 0) {
            enemy.active = false;
            state.scoreValue += 10;
            setScore(state.scoreValue);
            for (let i = 0; i < 5; i++) {
              state.particles.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                color: enemyColors[enemy.type]
              });
            }
          }
        }
      });

      if (
        enemy.x < state.player.x + state.player.width &&
        enemy.x + enemy.width > state.player.x &&
        enemy.y < state.player.y + state.player.height &&
        enemy.y + enemy.height > state.player.y
      ) {
        state.scoreValue -= 50;
        setScore(state.scoreValue);
        enemy.active = false;
      }
    });

    state.enemies = state.enemies.filter(e => e.active);

    state.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 30;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      ctx.globalAlpha = 1;
    });
    state.particles = state.particles.filter(p => p.life > 0);

    state.level = Math.floor(state.scoreValue / 100) + 1;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 16px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`等级: ${state.level}`, 20, 30);
    ctx.fillText(`控制: 方向键/WASD移动 空格/↑射击`, 20, canvas.height - 20);

    if (state.scoreValue < -100) {
      endGame();
    }
  }, []);

  const drawArcadeGame = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = gameStateRef.current;
    const elapsed = Date.now() - state.startTime;

    ctx.fillStyle = 'rgba(5, 5, 15, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const colors = [NEON_COLORS.neonPink, NEON_COLORS.neonCyan, NEON_COLORS.neonGreen, '#f59e0b'];
    for (let i = 0; i < 10; i++) {
      const x = canvas.width / 2 + Math.cos(elapsed * 0.001 + i) * (100 + i * 20);
      const y = canvas.height / 2 + Math.sin(elapsed * 0.001 + i * 0.7) * (80 + i * 15);
      ctx.fillStyle = colors[i % colors.length] + '40';
      ctx.beginPath();
      ctx.arc(x, y, 10 + i * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (state.keys.has('ArrowLeft') || state.keys.has('a')) state.player.x -= 5;
    if (state.keys.has('ArrowRight') || state.keys.has('d')) state.player.x += 5;

    state.player.x = Math.max(20, Math.min(canvas.width - state.player.width - 20, state.player.x));

    ctx.fillStyle = NEON_COLORS.neonGreen;
    ctx.fillRect(state.player.x, canvas.height - 50, state.player.width, 20);

    ctx.fillStyle = NEON_COLORS.neonCyan;
    ctx.beginPath();
    ctx.moveTo(state.player.x + state.player.width / 2, canvas.height - 70);
    ctx.lineTo(state.player.x + state.player.width, canvas.height - 50);
    ctx.lineTo(state.player.x, canvas.height - 50);
    ctx.closePath();
    ctx.fill();

    state.fallingObjects.forEach(obj => {
      if (!obj.active) return;
      obj.y += obj.speed || 3;
      obj.rotation += obj.rotationSpeed;

      ctx.save();
      ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
      ctx.rotate(obj.rotation);
      ctx.fillStyle = obj.color || NEON_COLORS.neonPink;
      ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);
      ctx.restore();

      if (obj.y > canvas.height) {
        obj.active = false;
      }

      if (
        obj.y + obj.height > canvas.height - 50 &&
        obj.y < canvas.height - 30 &&
        obj.x + obj.width > state.player.x &&
        obj.x < state.player.x + state.player.width
      ) {
        if ((obj.color || NEON_COLORS.neonPink) === NEON_COLORS.neonGreen) {
          obj.active = false;
          state.scoreValue += 10;
          setScore(state.scoreValue);
        } else {
          state.scoreValue -= 20;
          setScore(state.scoreValue);
          obj.active = false;
        }
      }
    });

    state.fallingObjects = state.fallingObjects.filter(o => o.active);

    if (Date.now() - state.lastEnemySpawn > 500) {
      const isGood = Math.random() > 0.3;
      state.fallingObjects.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: -20,
        width: 30,
        height: 30,
        speed: 2 + Math.random() * 2,
        color: isGood ? NEON_COLORS.neonGreen : NEON_COLORS.danger,
        active: true,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
      state.lastEnemySpawn = Date.now();
    }

    if (state.scoreValue < -150) {
      endGame();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 14px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🎯 收集绿色道具，躲避红色障碍', 20, 30);
    ctx.fillText('← → 移动', 20, canvas.height - 20);
  }, []);

  const drawPuzzleGame = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = gameStateRef.current;
    const elapsed = Date.now() - state.startTime;

    ctx.fillStyle = 'rgba(5, 5, 15, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 5; j++) {
        const x = i * 100 + (j % 2) * 50 + 50;
        const y = j * 100 + 50;
        ctx.strokeStyle = NEON_COLORS.neonPurple + '30';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, 100, 100);
      }
    }

    const colors = [
      NEON_COLORS.neonPink,
      NEON_COLORS.neonCyan,
      NEON_COLORS.neonGreen,
      NEON_COLORS.neonYellow,
      NEON_COLORS.neonPurple,
      NEON_COLORS.neonOrange,
      '#ff00ff',
      '#00ffff'
    ];

    if (state.tetrisBlocks.length === 0) {
      for (let i = 0; i < 8; i++) {
        state.tetrisBlocks[i] = [];
        for (let j = 0; j < 5; j++) {
          state.tetrisBlocks[i][j] = { x: 0, y: 0, color: '' };
        }
      }
    }

    const tetrisShapes = [
      [[1, 1, 1, 1]],
      [[1, 1], [1, 1]],
      [[0, 1, 0], [1, 1, 1]],
      [[1, 0, 0], [1, 1, 1]],
      [[0, 0, 1], [1, 1, 1]],
      [[1, 1, 0], [0, 1, 1]],
      [[0, 1, 1], [1, 1, 0]]
    ];

    if (elapsed % 1000 < 20) {
      state.tetrisCurrent.shape = (state.tetrisCurrent.shape + 1) % tetrisShapes.length;
      state.tetrisCurrent.color = colors[Math.floor(Math.random() * colors.length)];
    }

    const currentShape = tetrisShapes[state.tetrisCurrent.shape];
    const baseX = canvas.width / 2 - 150;
    const baseY = 100;
    const blockSize = 40;

    currentShape.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell) {
          const x = baseX + (j + state.tetrisCurrent.x) * blockSize;
          const y = baseY + (i + state.tetrisCurrent.y) * blockSize;

          if (x > 0 && x < canvas.width && y > 0 && y < canvas.height) {
            ctx.fillStyle = state.tetrisCurrent.color;
            ctx.shadowColor = state.tetrisCurrent.color;
            ctx.shadowBlur = 10;
            ctx.fillRect(x, y, blockSize - 2, blockSize - 2);
            ctx.shadowBlur = 0;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, blockSize - 2, blockSize - 2);
          }
        }
      });
    });

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 5; j++) {
        if (state.tetrisBlocks[i] && state.tetrisBlocks[i][j] && state.tetrisBlocks[i][j].color) {
          const x = baseX + i * blockSize;
          const y = baseY + j * blockSize;
          ctx.fillStyle = state.tetrisBlocks[i][j].color;
          ctx.fillRect(x, y, blockSize - 2, blockSize - 2);
        }
      }
    }

    if (state.keys.has('ArrowLeft') || state.keys.has('a')) {
      state.tetrisCurrent.x = Math.max(0, state.tetrisCurrent.x - 1);
    }
    if (state.keys.has('ArrowRight') || state.keys.has('d')) {
      state.tetrisCurrent.x = Math.min(7, state.tetrisCurrent.x + 1);
    }
    if (state.keys.has('ArrowDown') || state.keys.has('s')) {
      state.scoreValue += 1;
      setScore(state.scoreValue);
    }
    if (state.keys.has(' ') && !state.keys.has('_spacePressed')) {
      state.keys.add('_spacePressed');
      currentShape.forEach((row, i) => {
        row.forEach((cell, j) => {
          if (cell) {
            const blockX = Math.floor((state.tetrisCurrent.x + j) / blockSize * 2);
            const blockY = Math.floor((state.tetrisCurrent.y + i) / blockSize * 2);
            if (blockX >= 0 && blockX < 8 && blockY >= 0 && blockY < 5) {
              if (!state.tetrisBlocks[blockX]) state.tetrisBlocks[blockX] = [];
              state.tetrisBlocks[blockX][blockY] = {
                x: blockX,
                y: blockY,
                color: state.tetrisCurrent.color
              };
              state.scoreValue += 5;
              setScore(state.scoreValue);
            }
          }
        });
      });
    }
    if (!state.keys.has(' ')) {
      state.keys.delete('_spacePressed');
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 14px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🧩 移动方块，填充网格得分', 20, 30);
    ctx.fillText('← → 移动 ↓ 加速 空格 放置', 20, canvas.height - 20);
  }, []);

  const drawSnakeGame = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = gameStateRef.current;
    const elapsed = Date.now() - state.startTime;
    const gridSize = 20;

    ctx.fillStyle = 'rgba(5, 5, 15, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < canvas.width / gridSize; i++) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(i * gridSize, 0);
      ctx.lineTo(i * gridSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * gridSize);
      ctx.lineTo(canvas.width, i * gridSize);
      ctx.stroke();
    }

    if (state.snake.length === 0) {
      state.snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
      ];
      state.food = { x: 15, y: 10 };
    }

    if (elapsed % 150 < 20) {
      const head = state.snake[0];
      let newHead = { ...head };

      if (state.keys.has('ArrowUp') || state.keys.has('w')) newHead.y--;
      else if (state.keys.has('ArrowDown') || state.keys.has('s')) newHead.y++;
      else if (state.keys.has('ArrowLeft') || state.keys.has('a')) newHead.x--;
      else if (state.keys.has('ArrowRight') || state.keys.has('d')) newHead.x++;

      newHead.x = (newHead.x + canvas.width / gridSize) % (canvas.width / gridSize);
      newHead.y = (newHead.y + canvas.height / gridSize) % (canvas.height / gridSize);

      state.snake.unshift(newHead);

      if (newHead.x === state.food.x && newHead.y === state.food.y) {
        state.scoreValue += 10;
        setScore(state.scoreValue);
        state.food = {
          x: Math.floor(Math.random() * (canvas.width / gridSize)),
          y: Math.floor(Math.random() * (canvas.height / gridSize))
        };
      } else {
        state.snake.pop();
      }

      for (let i = 1; i < state.snake.length; i++) {
        if (newHead.x === state.snake[i].x && newHead.y === state.snake[i].y) {
          state.scoreValue -= 50;
          setScore(state.scoreValue);
          state.snake = state.snake.slice(0, i);
          break;
        }
      }
    }

    state.snake.forEach((segment, index) => {
      const x = segment.x * gridSize;
      const y = segment.y * gridSize;

      if (index === 0) {
        ctx.fillStyle = NEON_COLORS.neonGreen;
        ctx.shadowColor = NEON_COLORS.neonGreen;
        ctx.shadowBlur = 10;
      } else {
        const alpha = 1 - (index / state.snake.length) * 0.5;
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, gridSize - 2, gridSize - 2, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    const foodX = state.food.x * gridSize;
    const foodY = state.food.y * gridSize;
    ctx.fillStyle = NEON_COLORS.neonPink;
    ctx.shadowColor = NEON_COLORS.neonPink;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(foodX + gridSize / 2, foodY + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (state.scoreValue < -150) {
      endGame();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 14px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🐍 使用方向键控制蛇移动', 20, 30);
    ctx.fillText(`长度: ${state.snake.length}`, 20, canvas.height - 20);
  }, []);

  const drawMatch3Game = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = gameStateRef.current;
    const elapsed = Date.now() - state.startTime;
    const gridSize = 50;

    ctx.fillStyle = 'rgba(5, 5, 15, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gemColors = [
      NEON_COLORS.neonPink,
      NEON_COLORS.neonCyan,
      NEON_COLORS.neonGreen,
      NEON_COLORS.neonYellow,
      NEON_COLORS.neonPurple,
      '#ff00ff'
    ];

    const gemEmojis = ['💎', '💠', '🌟', '⭐', '🔮', '💜'];

    if (state.blocks.length === 0) {
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          state.blocks.push({
            x: i * gridSize + 100,
            y: j * gridSize + 50,
            width: gridSize - 5,
            height: gridSize - 5,
            color: gemColors[Math.floor(Math.random() * gemColors.length)],
            active: true
          });
        }
      }
    }

    state.blocks.forEach((block, index) => {
      if (!block.active) return;

      const wobble = Math.sin(elapsed * 0.005 + index) * 3;
      const glow = Math.sin(elapsed * 0.003 + index * 0.5) * 5 + 10;

      ctx.shadowColor = block.color;
      ctx.shadowBlur = glow;

      ctx.fillStyle = block.color + '40';
      ctx.beginPath();
      ctx.arc(block.x + block.width / 2 + wobble, block.y + block.height / 2, block.width / 2 + 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = block.color;
      ctx.beginPath();
      ctx.arc(block.x + block.width / 2 + wobble, block.y + block.height / 2, block.width / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(
        block.x + block.width / 2 + wobble - 8,
        block.y + block.height / 2 - 8,
        6,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.shadowBlur = 0;

      const emojiIndex = gemColors.indexOf(block.color);
      if (emojiIndex >= 0) {
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gemEmojis[emojiIndex], block.x + block.width / 2 + wobble, block.y + block.height / 2);
      }
    });

    if (elapsed % 3000 < 20) {
      const activeBlocks = state.blocks.filter(b => b.active);
      if (activeBlocks.length > 3) {
        const removeCount = Math.min(3, activeBlocks.length);
        for (let i = 0; i < removeCount; i++) {
          const randomIndex = Math.floor(Math.random() * activeBlocks.length);
          activeBlocks[randomIndex].active = false;
          state.scoreValue += 15;
          setScore(state.scoreValue);

          for (let j = 0; j < 8; j++) {
            state.particles.push({
              x: activeBlocks[randomIndex].x + activeBlocks[randomIndex].width / 2,
              y: activeBlocks[randomIndex].y + activeBlocks[randomIndex].height / 2,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              life: 40,
              color: activeBlocks[randomIndex].color
            });
          }
        }
      }

      state.blocks = state.blocks.filter(b => b.active);

      const cols = 8;
      while (state.blocks.length < 64) {
        const x = state.blocks.length % cols;
        const y = Math.floor(state.blocks.length / cols);
        state.blocks.push({
          x: x * gridSize + 100,
          y: y * gridSize + 50,
          width: gridSize - 5,
          height: gridSize - 5,
          color: gemColors[Math.floor(Math.random() * gemColors.length)],
          active: true
        });
      }
    }

    state.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 40;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    state.particles = state.particles.filter(p => p.life > 0);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 14px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('💎 宝石会自动匹配消除', 20, 30);
    ctx.fillText('点击屏幕收集宝石得分', 20, canvas.height - 20);

    if (elapsed % 1000 < 20) {
      state.scoreValue += 1;
      setScore(state.scoreValue);
    }
  }, []);

  const drawReactionGame = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = gameStateRef.current;
    const elapsed = Date.now() - state.startTime;

    ctx.fillStyle = 'rgba(5, 5, 15, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = 200;
    const currentRadius = (Math.sin(elapsed * 0.005) + 1) * maxRadius / 2 + 50;

    const pulseGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, currentRadius
    );
    pulseGradient.addColorStop(0, NEON_COLORS.neonPink + '60');
    pulseGradient.addColorStop(0.5, NEON_COLORS.neonCyan + '40');
    pulseGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = pulseGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = NEON_COLORS.neonCyan;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const angle = (elapsed * 0.002 + i * Math.PI / 3) % (Math.PI * 2);
      const x = centerX + Math.cos(angle) * 120;
      const y = centerY + Math.sin(angle) * 120;

      ctx.fillStyle = [NEON_COLORS.neonPink, NEON_COLORS.neonCyan, NEON_COLORS.neonGreen, '#f59e0b', NEON_COLORS.neonPurple, NEON_COLORS.neonOrange][i];
      ctx.beginPath();
      ctx.arc(x, y, 10 + Math.sin(elapsed * 0.01 + i) * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const playerRadius = 15;
    const playerAngle = elapsed * 0.003;
    state.player.x = centerX + Math.cos(playerAngle) * 150;
    state.player.y = centerY + Math.sin(playerAngle) * 150;

    ctx.fillStyle = NEON_COLORS.neonGreen;
    ctx.shadowColor = NEON_COLORS.neonGreen;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, playerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const targetAngle = elapsed * 0.002;
    const targetX = centerX + Math.cos(targetAngle) * 150;
    const targetY = centerY + Math.sin(targetAngle) * 150;

    const dist = Math.sqrt(
      Math.pow(state.player.x - targetX, 2) +
      Math.pow(state.player.y - targetY, 2)
    );

    if (dist < 30 && Date.now() - state.lastShot > 500) {
      state.scoreValue += 10;
      setScore(state.scoreValue);
      state.lastShot = Date.now();

      for (let i = 0; i < 10; i++) {
        state.particles.push({
          x: targetX,
          y: targetY,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          life: 30,
          color: NEON_COLORS.neonGreen
        });
      }
    }

    state.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 30;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    state.particles = state.particles.filter(p => p.life > 0);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 16px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎯 在光环交汇时点击', centerX, 30);
    ctx.fillText('操作: 点击屏幕或空格键', centerX, canvas.height - 20);
  }, []);

  const drawDefaultGame = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = gameStateRef.current;
    const elapsed = Date.now() - state.startTime;

    ctx.fillStyle = 'rgba(15, 15, 26, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, getCategoryColor());
    gradient.addColorStop(0.5, NEON_COLORS.neonCyan);
    gradient.addColorStop(1, NEON_COLORS.neonPurple);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i < 5; i++) {
      const x = (elapsed * 0.1 + i * 200) % (canvas.width + 200) - 100;
      const y = Math.sin(elapsed * 0.003 + i) * 50 + canvas.height / 2;
      ctx.moveTo(x - 50, y);
      ctx.lineTo(x + 50, y);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 20px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${gameName}`, canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText(`分数: ${state.scoreValue}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText(`时间: ${Math.floor(elapsed / 1000)}秒`, canvas.width / 2, canvas.height / 2 + 40);

    ctx.fillStyle = getCategoryColor();
    ctx.font = '16px "Noto Sans SC", sans-serif';
    ctx.fillText('点击屏幕增加分数', canvas.width / 2, canvas.height / 2 + 80);

    if (elapsed % 100 < 20) {
      state.scoreValue = Math.floor(elapsed / 100);
      setScore(state.scoreValue);
    }
  }, [gameName, getCategoryColor]);

  const drawMazeGame = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = gameStateRef.current;
    const elapsed = Date.now() - state.startTime;
    const cellSize = 40;

    ctx.fillStyle = 'rgba(5, 5, 15, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state.maze.length === 0) {
      const cols = Math.floor(canvas.width / cellSize);
      const rows = Math.floor(canvas.height / cellSize);
      for (let i = 0; i < cols; i++) {
        state.maze[i] = [];
        for (let j = 0; j < rows; j++) {
          state.maze[i][j] = Math.random() > 0.7 ? 1 : 0;
        }
      }
      state.maze[1][1] = 0;
      state.playerPos = { x: 1, y: 1 };
    }

    for (let i = 0; i < state.maze.length; i++) {
      for (let j = 0; j < state.maze[i].length; j++) {
        const x = i * cellSize;
        const y = j * cellSize;

        if (state.maze[i][j] === 1) {
          ctx.fillStyle = NEON_COLORS.neonPurple + '60';
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.strokeStyle = NEON_COLORS.neonPurple;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, cellSize, cellSize);
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }

    const targetX = state.maze.length - 2;
    const targetY = state.maze[0].length - 2;
    state.maze[targetX] = state.maze[targetX] || [];
    state.maze[targetX][targetY] = 0;

    ctx.fillStyle = NEON_COLORS.neonGreen;
    ctx.shadowColor = NEON_COLORS.neonGreen;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(
      targetX * cellSize + cellSize / 2,
      targetY * cellSize + cellSize / 2,
      10 + Math.sin(elapsed * 0.005) * 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    if (elapsed % 200 < 20) {
      let dx = 0, dy = 0;
      if (state.keys.has('ArrowUp') || state.keys.has('w')) dy = -1;
      else if (state.keys.has('ArrowDown') || state.keys.has('s')) dy = 1;
      else if (state.keys.has('ArrowLeft') || state.keys.has('a')) dx = -1;
      else if (state.keys.has('ArrowRight') || state.keys.has('d')) dx = 1;

      const newX = state.playerPos.x + dx;
      const newY = state.playerPos.y + dy;

      if (
        newX >= 0 && newX < state.maze.length &&
        newY >= 0 && newY < state.maze[0].length &&
        state.maze[newX][newY] === 0
      ) {
        state.playerPos.x = newX;
        state.playerPos.y = newY;
        state.scoreValue += 5;
        setScore(state.scoreValue);
      }
    }

    ctx.fillStyle = NEON_COLORS.neonCyan;
    ctx.shadowColor = NEON_COLORS.neonCyan;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(
      state.playerPos.x * cellSize + cellSize / 2,
      state.playerPos.y * cellSize + cellSize / 2,
      12,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    if (state.playerPos.x === targetX && state.playerPos.y === targetY) {
      state.maze = [];
      state.scoreValue += 100;
      setScore(state.scoreValue);
      state.playerPos = { x: 1, y: 1 };
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 14px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🗺️ 找到绿色出口', 20, 30);
    ctx.fillText('方向键/WASD移动', 20, canvas.height - 20);
  }, []);

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    gameStateRef.current.startTime = Date.now();
    gameStateRef.current.lastShot = 0;
    gameStateRef.current.lastEnemySpawn = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keys.add(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const gameLoop = () => {
      switch (category) {
        case 'shooting':
        case 'fighting':
        case 'tower':
          drawShootingGame(ctx, canvas);
          break;
        case 'arcade':
        case 'parkour':
        case 'survival':
          drawArcadeGame(ctx, canvas);
          break;
        case 'puzzle':
        case 'puzzle2':
        case 'board':
          drawPuzzleGame(ctx, canvas);
          break;
        case 'io':
          drawSnakeGame(ctx, canvas);
          break;
        case 'match3':
          drawMatch3Game(ctx, canvas);
          break;
        case 'reaction':
          drawRhythmGame(ctx, canvas);
          break;
        case 'maze':
        case 'escape':
          drawMazeGame(ctx, canvas);
          break;
        default:
          drawDefaultGame(ctx, canvas);
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStatus, category, drawShootingGame, drawArcadeGame, drawPuzzleGame, drawSnakeGame, drawMatch3Game, drawRhythmGame, drawMazeGame, drawDefaultGame]);

  const handleCanvasClick = () => {
    if (gameStatus === 'playing') {
      if (category === 'reaction') {
        gameStateRef.current.scoreValue += 5;
        setScore(gameStateRef.current.scoreValue);
        onScoreUpdate?.(gameStateRef.current.scoreValue);
      } else if (category !== 'shooting' && category !== 'arcade' && category !== 'puzzle' &&
                 category !== 'io' && category !== 'match3' && category !== 'maze') {
        gameStateRef.current.scoreValue += 10;
        setScore(gameStateRef.current.scoreValue);
        onScoreUpdate?.(gameStateRef.current.scoreValue);
      }
    }
  };

  const drawRhythmGame = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = gameStateRef.current;
    const elapsed = Date.now() - state.startTime;

    ctx.fillStyle = 'rgba(5, 5, 15, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const beatColors = [NEON_COLORS.neonPink, NEON_COLORS.neonCyan, NEON_COLORS.neonGreen, NEON_COLORS.neonYellow];
    const beatPatterns = [0, 1, 2, 3, 4, 3, 2, 1];

    for (let lane = 0; lane < 4; lane++) {
      const x = canvas.width / 2 - 150 + lane * 80;

      ctx.strokeStyle = beatColors[lane] + '40';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 35, 0);
      ctx.lineTo(x + 35, canvas.height);
      ctx.stroke();
    }

    const laneX = canvas.width / 2 - 150 + 35;
    const hitY = canvas.height - 100;

    ctx.strokeStyle = NEON_COLORS.neonWhite;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(laneX, hitY - 20);
    ctx.lineTo(laneX, hitY + 20);
    ctx.stroke();

    const currentBeat = Math.floor(elapsed / 250) % beatPatterns.length;

    for (let i = 0; i < 5; i++) {
      const beatIndex = (currentBeat - i + beatPatterns.length) % beatPatterns.length;
      const lane = beatPatterns[beatIndex];
      const y = hitY - (i * 60);
      const x = canvas.width / 2 - 150 + lane * 80;

      const alpha = 1 - (i * 0.2);
      ctx.fillStyle = beatColors[lane] + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(x + 35, y, 20, 0, Math.PI * 2);
      ctx.fill();

      if (i === 0 && elapsed % 250 < 50) {
        if (Date.now() - state.lastShot > 300) {
          state.scoreValue += 10;
          setScore(state.scoreValue);
          state.lastShot = Date.now();

          for (let j = 0; j < 8; j++) {
            state.particles.push({
              x: x + 35,
              y: hitY,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 0.5) * 12,
              life: 25,
              color: beatColors[lane]
            });
          }
        }
      }
    }

    state.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 25;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    state.particles = state.particles.filter(p => p.life > 0);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 14px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎵 跟随节奏点击', canvas.width / 2, 30);
    ctx.fillText('在命中线处点击屏幕', canvas.width / 2, canvas.height - 20);
  }, []);

  const startGame = () => {
    gameStateRef.current = {
      player: { x: 400, y: 450, width: 40, height: 40 },
      bullets: [],
      enemies: [],
      blocks: [],
      fallingObjects: [],
      keys: new Set(),
      lastShot: 0,
      lastEnemySpawn: 0,
      scoreValue: 0,
      startTime: Date.now(),
      level: 1,
      tetrisBlocks: [],
      tetrisCurrent: { x: 4, y: 0, shape: 0, color: '#ff6b9d' },
      snake: [],
      food: { x: 10, y: 10 },
      maze: [],
      playerPos: { x: 1, y: 1 },
      particles: []
    };
    setScore(0);
    setGameStarted(true);
    setGameStatus('playing');
  };

  const pauseGame = () => {
    setGameStatus('paused');
  };

  const resumeGame = () => {
    gameStateRef.current.startTime = Date.now() - (Date.now() - gameStateRef.current.startTime);
    setGameStatus('playing');
  };

  const endGame = () => {
    setGameStatus('gameover');
    if (gameStateRef.current.scoreValue > highScore) {
      setHighScore(gameStateRef.current.scoreValue);
      localStorage.setItem(`game_highscore_${gameId}`, gameStateRef.current.scoreValue.toString());
    }
    onGameOver?.(gameStateRef.current.scoreValue);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <motion.div
        className="w-full max-w-4xl rounded-3xl overflow-hidden backdrop-blur-xl"
        style={{
          background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.95), rgba(15, 15, 26, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${getCategoryColor()}30`
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                style={{
                  background: `linear-gradient(135deg, ${getCategoryColor()}30, ${NEON_COLORS.neonCyan}30)`,
                  border: `2px solid ${getCategoryColor()}50`
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {getCategoryIcon()}
              </motion.div>
              <div>
                <h1 className="text-3xl font-black mb-1" style={{
                  background: `linear-gradient(135deg, ${getCategoryColor()}, ${NEON_COLORS.neonCyan})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {gameName}
                </h1>
                <p className="text-sm opacity-60">{category}类游戏</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm opacity-60">当前分数</div>
                <motion.div
                  className="text-3xl font-black"
                  style={{ color: getCategoryColor() }}
                  key={score}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                >
                  {score}
                </motion.div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-60">最高分</div>
                <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>
                  {highScore}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {gameStatus === 'menu' && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-8">
                <motion.div
                  className="w-32 h-32 mx-auto rounded-3xl flex items-center justify-center text-8xl mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${getCategoryColor()}30, ${NEON_COLORS.neonCyan}30)`,
                    border: `3px solid ${getCategoryColor()}50`,
                    boxShadow: `0 0 40px ${getCategoryColor()}40`
                  }}
                  animate={{
                    rotateY: [0, 180, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    rotateY: { duration: 3, repeat: Infinity },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                >
                  {getCategoryIcon()}
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">准备开始</h2>
                <p className="opacity-60 mb-6">每个类别的游戏都有独特的玩法</p>
              </div>

              <div className="flex flex-col gap-4 max-w-md mx-auto">
                <motion.button
                  onClick={startGame}
                  className="px-8 py-4 rounded-2xl font-bold text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${getCategoryColor()}, ${NEON_COLORS.neonCyan})`,
                    color: '#ffffff',
                    boxShadow: `0 0 30px ${getCategoryColor()}50`
                  }}
                  whileHover={{ scale: 1.05, boxShadow: `0 0 50px ${getCategoryColor()}70` }}
                  whileTap={{ scale: 0.95 }}
                >
                  开始游戏
                </motion.button>

                <motion.button
                  onClick={onExit}
                  className="px-8 py-4 rounded-2xl font-bold text-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }}
                  whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.2)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  返回首页
                </motion.button>
              </div>

              <div className="mt-8 p-4 rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <h3 className="font-bold mb-2">游戏说明</h3>
                <p className="text-sm opacity-70">
                  {category === 'shooting' && '🚀 射击类游戏：控制飞船躲避敌人，射击得分'}
                  {category === 'arcade' && '🕹️ 街机类游戏：收集道具，躲避障碍物'}
                  {category === 'puzzle' && '🧩 益智类游戏：移动方块，挑战思维'}
                  {category === 'reaction' && '🎯 反应类游戏：快速反应，抓住时机'}
                  {category === 'match3' && '💎 消除类游戏：匹配宝石，消除得分'}
                  {category === 'maze' && '🗺️ 迷宫类游戏：找到出口，逃脱迷宫'}
                  {category === 'io' && '🌐 IO类游戏：控制蛇移动，吃食物成长'}
                  {!['shooting', 'arcade', 'puzzle', 'reaction', 'match3', 'maze', 'io'].includes(category) &&
                    `这是一个 ${category} 类游戏。每个类别都有独特的玩法！`}
                </p>
              </div>
            </motion.div>
          )}

          {gameStatus === 'playing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="w-full rounded-2xl cursor-pointer"
                style={{
                  border: `2px solid ${getCategoryColor()}50`,
                  boxShadow: `0 0 30px ${getCategoryColor()}30`
                }}
                onClick={handleCanvasClick}
              />

              <div className="flex justify-center gap-4 mt-6">
                <motion.button
                  onClick={pauseGame}
                  className="px-6 py-3 rounded-xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonYellow}, ${NEON_COLORS.neonOrange})`,
                    color: '#ffffff'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ⏸️ 暂停
                </motion.button>

                <motion.button
                  onClick={endGame}
                  className="px-6 py-3 rounded-xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.danger}, ${NEON_COLORS.neonPink})`,
                    color: '#ffffff'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🏁 结束游戏
                </motion.button>
              </div>
            </motion.div>
          )}

          {gameStatus === 'paused' && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-6xl mb-4">⏸️</div>
              <h2 className="text-3xl font-bold mb-6">游戏暂停</h2>
              <div className="mb-6">
                <div className="text-lg opacity-60">当前分数</div>
                <div className="text-5xl font-black" style={{ color: getCategoryColor() }}>
                  {score}
                </div>
              </div>

              <div className="flex flex-col gap-4 max-w-md mx-auto">
                <motion.button
                  onClick={resumeGame}
                  className="px-8 py-4 rounded-2xl font-bold text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonGreen}, ${NEON_COLORS.neonCyan})`,
                    color: '#ffffff'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ▶️ 继续游戏
                </motion.button>

                <motion.button
                  onClick={endGame}
                  className="px-8 py-4 rounded-2xl font-bold"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🏁 结束游戏
                </motion.button>
              </div>
            </motion.div>
          )}

          {gameStatus === 'gameover' && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                className="text-8xl mb-6"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10 }}
              >
                🎉
              </motion.div>

              <h2 className="text-4xl font-black mb-4" style={{
                background: `linear-gradient(135deg, ${getCategoryColor()}, ${NEON_COLORS.neonCyan})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                游戏结束！
              </h2>

              <div className="mb-8">
                <div className="text-lg opacity-60 mb-2">最终得分</div>
                <motion.div
                  className="text-6xl font-black"
                  style={{ color: getCategoryColor() }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  {score}
                </motion.div>
                {score >= highScore && score > 0 && (
                  <motion.div
                    className="text-2xl font-bold mt-2"
                    style={{ color: NEON_COLORS.neonPink }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    🏆 新纪录！
                  </motion.div>
                )}
                <div className="text-sm opacity-60 mt-2">
                  最高分: {highScore}
                </div>
              </div>

              <div className="flex flex-col gap-4 max-w-md mx-auto">
                <motion.button
                  onClick={startGame}
                  className="px-8 py-4 rounded-2xl font-bold text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${getCategoryColor()}, ${NEON_COLORS.neonCyan})`,
                    color: '#ffffff',
                    boxShadow: `0 0 30px ${getCategoryColor()}50`
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔄 再玩一次
                </motion.button>

                <motion.button
                  onClick={onExit}
                  className="px-8 py-4 rounded-2xl font-bold"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🏠 返回首页
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
