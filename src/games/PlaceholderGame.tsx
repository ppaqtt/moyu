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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
  type?: string;
  text?: string;
  active?: boolean;
}

interface GameContext {
  type: 'shooter' | 'arcade' | 'puzzle' | 'match3' | 'memory' | 'snake' | 'flappy' | 'runner' | 'pong' | 'breakout' | 'platformer' | 'rhythm';
  color: string;
  icon: string;
  description: string;
  controls: string;
}

// 根据游戏ID和类别确定游戏类型
function getGameContext(gameId: string, category: string): GameContext {
  const contexts: Record<string, GameContext> = {
    '2048': { type: 'puzzle', color: '#e67e22', icon: '🔢', description: '数字合并游戏！', controls: '方向键' },
    'tetris': { type: 'puzzle', color: '#3498db', icon: '🧱', description: '经典俄罗斯方块！', controls: '方向键' },
    'snake': { type: 'snake', color: '#2ecc71', icon: '🐍', description: '贪吃蛇大作战！', controls: '方向键' },
    'flappybird': { type: 'flappy', color: '#e74c3c', icon: '🐦', description: 'Flappy Bird！', controls: '点击屏幕' },
    'subway': { type: 'runner', color: '#9b59b6', icon: '🏃', description: '无尽跑酷！', controls: '方向键' },
    'pong': { type: 'pong', color: '#34495e', icon: '🏓', description: '经典乒乓球！', controls: '方向键' },
    'breakout': { type: 'breakout', color: '#1abc9c', icon: '🧱', description: '打砖块！', controls: '方向键' },
    'pacman': { type: 'arcade', color: '#f1c40f', icon: '👻', description: '吃豆人！', controls: '方向键' },
    'candycrush': { type: 'match3', color: '#ff69b4', icon: '🍬', description: '糖果消消乐！', controls: '点击' },
    'spaceshooter': { type: 'shooter', color: '#00bcd4', icon: '🚀', description: '太空射击！', controls: '方向键/空格' },
  };
  
  // 基于类别返回默认类型
  if (!contexts[gameId]) {
    const categoryMap: Record<string, GameContext> = {
      'shooting': { type: 'shooter', color: NEON_COLORS.danger, icon: '🚀', description: '太空射击游戏！', controls: '方向键移动，空格射击' },
      'arcade': { type: 'arcade', color: NEON_COLORS.neonGreen, icon: '🕹️', description: '经典街机游戏！', controls: '方向键/点击' },
      'puzzle': { type: 'puzzle', color: NEON_COLORS.neonCyan, icon: '🧩', description: '益智游戏！', controls: '方向键/点击' },
      'strategy': { type: 'puzzle', color: '#f1c40f', icon: '🎮', description: '策略游戏！', controls: '点击' },
      'co-op': { type: 'pong', color: NEON_COLORS.neonPurple, icon: '🎯', description: '双人游戏！', controls: '方向键' },
      'board': { type: 'memory', color: '#8e44ad', icon: '♟️', description: '记忆翻牌！', controls: '点击' },
      'card': { type: 'memory', color: '#e91e63', icon: '🃏', description: '卡牌游戏！', controls: '点击' },
      'match3': { type: 'match3', color: '#ff69b4', icon: '💎', description: '消消乐游戏！', controls: '点击' },
      'rhythm': { type: 'rhythm', color: NEON_COLORS.neonPink, icon: '🎵', description: '节奏游戏！', controls: '点击/按键' },
    };
    
    return categoryMap[category] || { 
      type: 'arcade', 
      color: NEON_COLORS.neonPink, 
      icon: '🎮', 
      description: '探索这个游戏！', 
      controls: '点击或键盘' 
    };
  }
  
  return contexts[gameId];
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
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem(`game_highscore_${gameId}`);
    return saved ? parseInt(saved) : 0;
  });
  
  const gameState = useRef({
    player: { x: 0, y: 0, width: 30, height: 30 },
    objects: [] as GameObject[],
    particles: [] as Particle[],
    keys: new Set<string>(),
    mouseX: 0,
    mouseY: 0,
    startTime: 0,
    difficulty: 1,
    score: 0,
    gameOver: false
  });

  const gameContext = getGameContext(gameId, category);

  const drawGame = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const state = gameState.current;
    const elapsed = Date.now() - state.startTime;
    
    // 清空画布
    ctx.fillStyle = 'rgba(20, 20, 30, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    switch (gameContext.type) {
      case 'shooter':
        drawShooter(ctx, canvas, state, elapsed);
        break;
      case 'arcade':
        drawArcade(ctx, canvas, state, elapsed);
        break;
      case 'puzzle':
        drawPuzzle(ctx, canvas, state, elapsed);
        break;
      case 'snake':
        drawSnake(ctx, canvas, state, elapsed);
        break;
      case 'flappy':
        drawFlappy(ctx, canvas, state, elapsed);
        break;
      case 'runner':
        drawRunner(ctx, canvas, state, elapsed);
        break;
      case 'pong':
        drawPong(ctx, canvas, state, elapsed);
        break;
      case 'breakout':
        drawBreakout(ctx, canvas, state, elapsed);
        break;
      case 'match3':
        drawMatch3(ctx, canvas, state, elapsed);
        break;
      case 'memory':
        drawMemory(ctx, canvas, state, elapsed);
        break;
      case 'rhythm':
        drawRhythm(ctx, canvas, state, elapsed);
        break;
      default:
        drawArcade(ctx, canvas, state, elapsed);
    }

    // 更新分数
    if (state.score !== score) {
      setScore(state.score);
      onScoreUpdate?.(state.score);
    }

    if (state.gameOver && gameStatus === 'playing') {
      setGameStatus('gameover');
      if (state.score > highScore) {
        setHighScore(state.score);
        localStorage.setItem(`game_highscore_${gameId}`, state.score.toString());
      }
      onGameOver?.(state.score);
    }
  }, [gameContext, score, highScore, gameId, onScoreUpdate, onGameOver, gameStatus]);

  // 射击游戏逻辑
  function drawShooter(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: any, elapsed: number) {
    if (state.player.x === 0) {
      state.player.x = canvas.width / 2 - 15;
      state.player.y = canvas.height - 80;
    }

    // 移动玩家
    if (state.keys.has('ArrowLeft') || state.keys.has('a')) state.player.x -= 6;
    if (state.keys.has('ArrowRight') || state.keys.has('d')) state.player.x += 6;
    state.player.x = Math.max(0, Math.min(canvas.width - state.player.width, state.player.x));

    // 射击
    if ((state.keys.has(' ') || state.keys.has('ArrowUp')) && Math.random() < 0.2) {
      state.objects.push({
        x: state.player.x + 10,
        y: state.player.y - 20,
        width: 10,
        height: 20,
        speed: 12,
        color: NEON_COLORS.neonCyan,
        type: 'bullet',
        active: true
      });
    }

    // 生成敌人
    if (Math.random() < 0.02) {
      state.objects.push({
        x: Math.random() * (canvas.width - 40),
        y: -30,
        width: 30,
        height: 30,
        speed: 3 + state.difficulty,
        color: NEON_COLORS.danger,
        type: 'enemy',
        active: true
      });
    }

    // 更新和绘制
    ctx.fillStyle = gameContext.color;
    ctx.shadowColor = gameContext.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(state.player.x + 15, state.player.y);
    ctx.lineTo(state.player.x + 30, state.player.y + 30);
    ctx.lineTo(state.player.x, state.player.y + 30);
    ctx.closePath();
    ctx.fill();

    state.objects = state.objects.filter((obj: GameObject) => {
      if (!obj.active) return false;
      
      if (obj.type === 'bullet') {
        obj.y -= obj.speed;
        if (obj.y < -30) return false;
        
        ctx.fillStyle = obj.color;
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      } else if (obj.type === 'enemy') {
        obj.y += obj.speed;
        if (obj.y > canvas.height + 30) {
          state.score = Math.max(0, state.score - 5);
          return false;
        }
        
        ctx.fillStyle = obj.color;
        ctx.beginPath();
        ctx.arc(obj.x + 15, obj.y + 15, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // 检测碰撞
        for (let bullet of state.objects.filter((o: GameObject) => o.type === 'bullet' && o.active)) {
          const dx = (obj.x + 15) - (bullet.x + 5);
          const dy = (obj.y + 15) - (bullet.y + 10);
          if (Math.sqrt(dx*dx + dy*dy) < 25) {
            obj.active = false;
            bullet.active = false;
            state.score += 10;
            state.difficulty += 0.01;
            
            // 添加爆炸粒子
            for (let i = 0; i < 5; i++) {
              state.particles.push({
                x: obj.x + 15,
                y: obj.y + 15,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: NEON_COLORS.neonOrange,
                size: 5 + Math.random() * 5,
                life: 30
              });
            }
          }
        }
        
        // 检测玩家碰撞
        const dx = (state.player.x + 15) - (obj.x + 15);
        const dy = (state.player.y + 15) - (obj.y + 15);
        if (Math.sqrt(dx*dx + dy*dy) < 30) {
          state.gameOver = true;
        }
      }
      
      return obj.active;
    });

    drawParticles(ctx, state);
  }

  // 街机游戏逻辑
  function drawArcade(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: any, elapsed: number) {
    if (state.player.x === 0) {
      state.player.x = canvas.width / 2 - 15;
      state.player.y = canvas.height / 2;
    }

    // 移动玩家
    if (state.keys.has('ArrowLeft') || state.keys.has('a')) state.player.x -= 5;
    if (state.keys.has('ArrowRight') || state.keys.has('d')) state.player.x += 5;
    if (state.keys.has('ArrowUp') || state.keys.has('w')) state.player.y -= 5;
    if (state.keys.has('ArrowDown') || state.keys.has('s')) state.player.y += 5;
    
    state.player.x = Math.max(0, Math.min(canvas.width - state.player.width, state.player.x));
    state.player.y = Math.max(0, Math.min(canvas.height - state.player.height, state.player.y));

    // 生成收集物
    if (Math.random() < 0.02) {
      const isGood = Math.random() > 0.3;
      state.objects.push({
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: 30,
        height: 30,
        speed: 2 + Math.random() * 2,
        color: isGood ? gameContext.color : NEON_COLORS.danger,
        type: isGood ? 'collect' : 'danger',
        active: true
      });
    }

    // 绘制背景效果
    for (let i = 0; i < 5; i++) {
      const y = ((elapsed * 0.05 + i * 100) % (canvas.height + 50)) - 50;
      ctx.strokeStyle = gameContext.color + '20';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(canvas.width / 2, y + 20 * Math.sin(elapsed * 0.003 + i), canvas.width, y);
      ctx.stroke();
    }

    // 绘制玩家
    ctx.fillStyle = gameContext.color;
    ctx.shadowColor = gameContext.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(state.player.x + 15, state.player.y + 15, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 更新和绘制对象
    state.objects = state.objects.filter((obj: GameObject) => {
      if (!obj.active) return false;
      
      obj.y += obj.speed;
      if (obj.y > canvas.height + 30) return false;

      // 绘制对象
      ctx.fillStyle = obj.color;
      ctx.shadowColor = obj.color;
      ctx.shadowBlur = 10;
      
      if (obj.type === 'collect') {
        ctx.beginPath();
        ctx.arc(obj.x + 15, obj.y + 15, 12, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(obj.x + 3, obj.y + 3, 24, 24);
      }
      ctx.shadowBlur = 0;

      // 碰撞检测
      const dx = (state.player.x + 15) - (obj.x + 15);
      const dy = (state.player.y + 15) - (obj.y + 15);
      if (Math.sqrt(dx*dx + dy*dy) < 27) {
        obj.active = false;
        if (obj.type === 'collect') {
          state.score += 5;
          for (let i = 0; i < 5; i++) {
            state.particles.push({
              x: obj.x + 15,
              y: obj.y + 15,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              color: obj.color,
              size: 4,
              life: 20
            });
          }
        } else {
          state.score = Math.max(0, state.score - 10);
          if (state.score <= -50) state.gameOver = true;
        }
      }
      
      return obj.active;
    });

    // 随时间加分
    if (Math.floor(elapsed / 500) !== Math.floor((elapsed - 16) / 500)) {
      state.score += 1;
    }

    drawParticles(ctx, state);
  }

  // 益智游戏逻辑
  function drawPuzzle(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: any, elapsed: number) {
    const gridSize = 50;
    const cols = Math.floor(canvas.width / gridSize);
    const rows = Math.floor(canvas.height / gridSize);
    
    if (state.objects.length === 0) {
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          if (Math.random() > 0.2) {
            state.objects.push({
              x: i * gridSize,
              y: j * gridSize,
              width: gridSize - 2,
              height: gridSize - 2,
              speed: 0,
              color: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'][Math.floor(Math.random() * 5)],
              active: true
            });
          }
        }
      }
    }

    // 绘制网格
    state.objects.forEach((obj: GameObject, i: number) => {
      ctx.fillStyle = obj.color;
      ctx.shadowColor = obj.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      ctx.shadowBlur = 0;
    });

    // 简单的点击检测逻辑
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('点击方块消除!', canvas.width / 2, 30);

    // 随时间加分
    if (Math.floor(elapsed / 1000) !== Math.floor((elapsed - 16) / 1000)) {
      state.score += 1;
    }
  }

  // 贪吃蛇逻辑
  function drawSnake(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: any, elapsed: number) {
    const gridSize = 20;
    
    if (state.snake === undefined) {
      state.snake = [{ x: 10, y: 10 }];
      state.food = { x: 15, y: 15 };
      state.direction = { x: 1, y: 0 };
      state.lastMove = 0;
    }

    // 控制
    if (state.keys.has('ArrowUp') && state.direction.y !== 1) state.direction = { x: 0, y: -1 };
    if (state.keys.has('ArrowDown') && state.direction.y !== -1) state.direction = { x: 0, y: 1 };
    if (state.keys.has('ArrowLeft') && state.direction.x !== 1) state.direction = { x: -1, y: 0 };
    if (state.keys.has('ArrowRight') && state.direction.x !== -1) state.direction = { x: 1, y: 0 };

    // 移动
    if (elapsed - state.lastMove > 150) {
      const head = { x: state.snake[0].x + state.direction.x, y: state.snake[0].y + state.direction.y };
      
      // 墙壁碰撞
      if (head.x < 0 || head.x >= canvas.width / gridSize || 
          head.y < 0 || head.y >= canvas.height / gridSize) {
        state.gameOver = true;
        return;
      }

      // 自身碰撞
      for (let segment of state.snake) {
        if (head.x === segment.x && head.y === segment.y) {
          state.gameOver = true;
          return;
        }
      }

      state.snake.unshift(head);
      
      // 吃食物
      if (head.x === state.food.x && head.y === state.food.y) {
        state.score += 10;
        state.food = { 
          x: Math.floor(Math.random() * (canvas.width / gridSize)), 
          y: Math.floor(Math.random() * (canvas.height / gridSize)) 
        };
      } else {
        state.snake.pop();
      }

      state.lastMove = elapsed;
    }

    // 绘制
    state.snake.forEach((segment: any, i: number) => {
      const alpha = 1 - (i / state.snake.length) * 0.4;
      ctx.fillStyle = gameContext.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.shadowColor = gameContext.color;
      ctx.shadowBlur = i === 0 ? 15 : 5;
      ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });
    ctx.shadowBlur = 0;

    ctx.fillStyle = NEON_COLORS.danger;
    ctx.shadowColor = NEON_COLORS.danger;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(state.food.x * gridSize + gridSize / 2, state.food.y * gridSize + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flappy Bird逻辑
  function drawFlappy(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: any, elapsed: number) {
    if (state.bird === undefined) {
      state.bird = { y: canvas.height / 2, vy: 0 };
      state.pipes = [];
      state.lastPipe = 0;
      state.lastJump = 0;
    }

    // 跳跃
    if ((state.keys.has(' ') || state.keys.has('ArrowUp')) && elapsed - state.lastJump > 200) {
      state.bird.vy = -10;
      state.lastJump = elapsed;
    }

    // 物理
    state.bird.vy += 0.5;
    state.bird.y += state.bird.vy;

    // 生成管道
    if (elapsed - state.lastPipe > 1500) {
      const gapY = Math.random() * (canvas.height - 200) + 100;
      state.pipes.push({ x: canvas.width, gapY: gapY, counted: false });
      state.lastPipe = elapsed;
    }

    // 更新管道
    state.pipes = state.pipes.filter((pipe: any) => {
      pipe.x -= 3;
      return pipe.x > -80;
    });

    // 碰撞检测
    for (let pipe of state.pipes) {
      const birdX = 80;
      const birdY = state.bird.y;
      
      if (birdX + 20 > pipe.x && birdX < pipe.x + 60) {
        if (birdY < pipe.gapY - 60 || birdY + 20 > pipe.gapY + 60) {
          state.gameOver = true;
        }
      }
      
      if (!pipe.counted && birdX > pipe.x + 60) {
        pipe.counted = true;
        state.score += 1;
      }
    }

    if (state.bird.y > canvas.height || state.bird.y < -20) {
      state.gameOver = true;
    }

    // 绘制
    ctx.fillStyle = gameContext.color;
    ctx.shadowColor = gameContext.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(90, state.bird.y + 10, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    state.pipes.forEach((pipe: any) => {
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(pipe.x, 0, 60, pipe.gapY - 60);
      ctx.fillRect(pipe.x, pipe.gapY + 60, 60, canvas.height);
    });
  }

  // 跑酷游戏逻辑
  function drawRunner(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: any, elapsed: number) {
    if (state.runner === undefined) {
      state.runner = { x: 100, y: canvas.height - 100, vy: 0, onGround: true };
      state.obstacles = [];
      state.ground = canvas.height - 60;
      state.lastObstacle = 0;
    }

    // 跳跃
    if ((state.keys.has(' ') || state.keys.has('ArrowUp')) && state.runner.onGround) {
      state.runner.vy = -15;
      state.runner.onGround = false;
    }

    // 物理
    state.runner.vy += 0.8;
    state.runner.y += state.runner.vy;
    
    if (state.runner.y >= state.ground) {
      state.runner.y = state.ground;
      state.runner.vy = 0;
      state.runner.onGround = true;
    }

    // 生成障碍
    if (elapsed - state.lastObstacle > 2000 - Math.min(1500, state.score * 10)) {
      state.obstacles.push({ x: canvas.width, type: Math.random() > 0.5 ? 'spike' : 'box' });
      state.lastObstacle = elapsed;
    }

    // 更新障碍
    state.obstacles = state.obstacles.filter((obs: any) => {
      obs.x -= 6 + state.score * 0.01;
      
      // 碰撞检测
      if (obs.x < 140 && obs.x > 60) {
        const obsY = state.ground - (obs.type === 'spike' ? 30 : 40);
        const obsH = obs.type === 'spike' ? 30 : 40;
        if (state.runner.y + 30 > obsY) {
          state.gameOver = true;
        }
      }
      
      return obs.x > -60;
    });

    // 分数
    state.score = Math.floor(elapsed / 100);

    // 绘制
    ctx.fillStyle = '#444';
    ctx.fillRect(0, state.ground + 30, canvas.width, 30);
    
    ctx.fillStyle = gameContext.color;
    ctx.shadowColor = gameContext.color;
    ctx.shadowBlur = 10;
    ctx.fillRect(100, state.runner.y, 30, 30);
    
    state.obstacles.forEach((obs: any) => {
      ctx.fillStyle = NEON_COLORS.danger;
      if (obs.type === 'spike') {
        ctx.beginPath();
        ctx.moveTo(obs.x, state.ground + 30);
        ctx.lineTo(obs.x + 20, state.ground);
        ctx.lineTo(obs.x + 40, state.ground + 30);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(obs.x, state.ground - 10, 40, 40);
      }
    });
    ctx.shadowBlur = 0;
  }

  // Pong逻辑
  function drawPong(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: any, elapsed: number) {
    if (state.paddle === undefined) {
      state.paddle = { y: canvas.height / 2 - 50 };
      state.aiPaddle = { y: canvas.height / 2 - 50 };
      state.ball = { x: canvas.width / 2, y: canvas.height / 2, vx: 5, vy: 3 };
    }

    // 控制
    if (state.keys.has('ArrowUp') || state.keys.has('w')) state.paddle.y -= 8;
    if (state.keys.has('ArrowDown') || state.keys.has('s')) state.paddle.y += 8;
    state.paddle.y = Math.max(0, Math.min(canvas.height - 100, state.paddle.y));

    // AI
    state.aiPaddle.y += (state.ball.y - state.aiPaddle.y - 50) * 0.1;
    state.aiPaddle.y = Math.max(0, Math.min(canvas.height - 100, state.aiPaddle.y));

    // 球物理
    state.ball.x += state.ball.vx;
    state.ball.y += state.ball.vy;

    if (state.ball.y <= 0 || state.ball.y >= canvas.height) state.ball.vy *= -1;
    
    // 碰撞
    if (state.ball.x <= 20 && state.ball.y > state.paddle.y && state.ball.y < state.paddle.y + 100) {
      state.ball.vx *= -1.1;
    }
    if (state.ball.x >= canvas.width - 30 && state.ball.y > state.aiPaddle.y && state.ball.y < state.aiPaddle.y + 100) {
      state.ball.vx *= -1.1;
    }

    if (state.ball.x <= -20) {
      state.ball = { x: canvas.width / 2, y: canvas.height / 2, vx: 5, vy: 3 };
    }
    if (state.ball.x >= canvas.width + 20) {
      state.ball = { x: canvas.width / 2, y: canvas.height / 2, vx: -5, vy: -3 };
      state.score += 1;
    }

    // 绘制
    ctx.fillStyle = 'white';
    ctx.fillRect(10, state.paddle.y, 10, 100);
    ctx.fillRect(canvas.width - 20, state.aiPaddle.y, 10, 100);
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 打砖块逻辑
  function drawBreakout(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: any, elapsed: number) {
    if (state.paddle === undefined) {
      state.paddle = { x: canvas.width / 2 - 50 };
      state.ball = { x: canvas.width / 2, y: canvas.height - 100, vx: 4, vy: -4 };
      state.bricks = [];
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 4; j++) {
          state.bricks.push({ 
            x: 50 + i * 100, y: 50 + j * 40, 
            active: true, 
            color: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f'][j] 
          });
        }
      }
    }

    if (state.keys.has('ArrowLeft')) state.paddle.x -= 8;
    if (state.keys.has('ArrowRight')) state.paddle.x += 8;
    state.paddle.x = Math.max(0, Math.min(canvas.width - 100, state.paddle.x));

    state.ball.x += state.ball.vx;
    state.ball.y += state.ball.vy;

    if (state.ball.x <= 10 || state.ball.x >= canvas.width - 10) state.ball.vx *= -1;
    if (state.ball.y <= 10) state.ball.vy *= -1;

    if (state.ball.y >= canvas.height - 30 && 
        state.ball.x > state.paddle.x && state.ball.x < state.paddle.x + 100) {
      state.ball.vy *= -1;
    }

    state.bricks.forEach((brick: any) => {
      if (brick.active && 
          state.ball.x > brick.x && state.ball.x < brick.x + 90 &&
          state.ball.y > brick.y && state.ball.y < brick.y + 35) {
        brick.active = false;
        state.ball.vy *= -1;
        state.score += 10;
      }
    });

    if (state.ball.y > canvas.height) state.gameOver = true;

    ctx.fillStyle = 'white';
    ctx.fillRect(state.paddle.x, canvas.height - 20, 100, 10);
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
    ctx.fill();

    state.bricks.forEach((brick: any) => {
      if (brick.active) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, 85, 30);
      }
    });
  }

  // 消消乐逻辑
  function drawMatch3(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: any, elapsed: number) {
    const gridSize = 60;
    const colors = [NEON_COLORS.neonPink, NEON_COLORS.neonCyan, NEON_COLORS.neonGreen, NEON_COLORS.neonOrange, NEON_COLORS.neonPurple];
    
    if (state.grid === undefined) {
      state.grid = [];
      for (let i = 0; i < 8; i++) {
        state.grid[i] = [];
        for (let j = 0; j < 8; j++) {
          state.grid[i][j] = Math.floor(Math.random() * colors.length);
        }
      }
    }

    const offsetX = (canvas.width - 8 * gridSize) / 2;
    const offsetY = 50;

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        ctx.fillStyle = colors[state.grid[i][j]];
        ctx.shadowColor = colors[state.grid[i][j]];
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(offsetX + i * gridSize + gridSize / 2, offsetY + j * gridSize + gridSize / 2, 22, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;

    if (Math.floor(elapsed / 2000) !== Math.floor((elapsed - 16) / 2000)) {
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (Math.random() < 0.2) {
            state.grid[i][j] = Math.floor(Math.random() * colors.length);
            state.score += 1;
          }
        }
      }
    }

    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('匹配3个相同颜色!', canvas.width / 2, 30);
  }

  // 记忆游戏逻辑
  function drawMemory(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: any, elapsed: number) {
    if (state.cards === undefined) {
      const values = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒'];
      state.cards = [...values, ...values].sort(() => Math.random() - 0.5).map((v, i) => ({
        value: v, flipped: false, matched: false, x: (i % 4) * 100 + 50, y: Math.floor(i / 4) * 100 + 50
      }));
    }

    state.cards.forEach((card: any) => {
      if (card.matched) {
        ctx.globalAlpha = 0.3;
      }
      
      ctx.fillStyle = card.flipped || card.matched ? gameContext.color : '#444';
      ctx.fillRect(card.x, card.y, 80, 80);
      
      if (card.flipped || card.matched) {
        ctx.fillStyle = 'white';
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.value, card.x + 40, card.y + 40);
      }
      
      ctx.globalAlpha = 1;
    });

    if (Math.floor(elapsed / 3000) !== Math.floor((elapsed - 16) / 3000)) {
      state.score += 5;
    }
  }

  // 节奏游戏逻辑
  function drawRhythm(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: any, elapsed: number) {
    if (state.notes === undefined) {
      state.notes = [];
      state.lastNote = 0;
    }

    if (elapsed - state.lastNote > 800) {
      state.notes.push({ time: elapsed, lane: Math.floor(Math.random() * 4) });
      state.lastNote = elapsed;
    }

    const hitY = canvas.height - 100;
    const laneW = canvas.width / 4;

    ctx.strokeStyle = '#444';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(i * laneW, 0);
      ctx.lineTo(i * laneW, canvas.height);
      ctx.stroke();
    }

    ctx.fillStyle = '#444';
    ctx.fillRect(0, hitY - 5, canvas.width, 10);

    state.notes.forEach((note: any, i: number) => {
      const y = hitY - (elapsed - note.time) * 0.3;
      
      if (y > -50) {
        ctx.fillStyle = gameContext.color;
        ctx.shadowColor = gameContext.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(note.lane * laneW + 20, y, laneW - 40, 40);
        ctx.shadowBlur = 0;

        if ((state.keys.has(' ') || state.keys.has('ArrowUp')) && Math.abs(y - hitY) < 40) {
          state.score += 10;
          state.notes.splice(i, 1);
          
          for (let j = 0; j < 5; j++) {
            state.particles.push({
              x: note.lane * laneW + laneW / 2,
              y: hitY,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              color: gameContext.color,
              size: 5,
              life: 20
            });
          }
        }
      }
    });

    drawParticles(ctx, state);
  }

  // 粒子绘制
  function drawParticles(ctx: CanvasRenderingContext2D, state: any) {
    state.particles = state.particles.filter((p: Particle) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      
      if (p.life > 0) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      }
      return false;
    });
  }

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    gameState.current.startTime = Date.now();
    gameState.current.score = 0;
    gameState.current.gameOver = false;
    gameState.current.difficulty = 1;
    gameState.current.objects = [];
    gameState.current.particles = [];
    gameState.current.snake = undefined;
    gameState.current.bird = undefined;
    gameState.current.runner = undefined;
    gameState.current.paddle = undefined;
    gameState.current.grid = undefined;
    gameState.current.cards = undefined;
    gameState.current.notes = undefined;
    gameState.current.player = { x: 0, y: 0, width: 30, height: 30 };

    const handleKeyDown = (e: KeyboardEvent) => {
      gameState.current.keys.add(e.key.toLowerCase());
      gameState.current.keys.add(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.current.keys.delete(e.key.toLowerCase());
      gameState.current.keys.delete(e.key);
    };
    const handleClick = () => {
      gameState.current.keys.add(' ');
      setTimeout(() => gameState.current.keys.delete(' '), 50);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    canvas.addEventListener('click', handleClick);

    let animationId: number;
    const loop = () => {
      drawGame(ctx, canvas);
      animationId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameStatus, drawGame]);

  const startGame = () => setGameStatus('playing');
  const pauseGame = () => setGameStatus('paused');
  const resumeGame = () => setGameStatus('playing');
  const endGame = () => setGameStatus('gameover');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <motion.div
        className="w-full max-w-4xl rounded-3xl overflow-hidden backdrop-blur-xl"
        style={{
          background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.95), rgba(15, 15, 26, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${gameContext.color}30`
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
                  background: `linear-gradient(135deg, ${gameContext.color}30, ${NEON_COLORS.neonCyan}30)`,
                  border: `2px solid ${gameContext.color}50`
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {gameContext.icon}
              </motion.div>
              <div>
                <h1 className="text-3xl font-black mb-1" style={{
                  background: `linear-gradient(135deg, ${gameContext.color}, ${NEON_COLORS.neonCyan})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {gameName}
                </h1>
                <p className="text-sm opacity-60">{gameContext.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm opacity-60">当前分数</div>
                <motion.div
                  className="text-3xl font-black"
                  style={{ color: gameContext.color }}
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
                    background: `linear-gradient(135deg, ${gameContext.color}30, ${NEON_COLORS.neonCyan}30)`,
                    border: `3px solid ${gameContext.color}50`,
                    boxShadow: `0 0 40px ${gameContext.color}40`
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
                  {gameContext.icon}
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">准备开始</h2>
                <p className="opacity-60 mb-2">{gameContext.description}</p>
                <p className="text-sm opacity-40">操作: {gameContext.controls}</p>
              </div>

              <div className="flex flex-col gap-4 max-w-md mx-auto">
                <motion.button
                  onClick={startGame}
                  className="px-8 py-4 rounded-2xl font-bold text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${gameContext.color}, ${NEON_COLORS.neonCyan})`,
                    color: '#ffffff',
                    boxShadow: `0 0 30px ${gameContext.color}50`
                  }}
                  whileHover={{ scale: 1.05, boxShadow: `0 0 50px ${gameContext.color}70` }}
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
            </motion.div>
          )}

          {gameStatus === 'playing' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="w-full rounded-2xl cursor-pointer"
                style={{
                  border: `2px solid ${gameContext.color}50`,
                  boxShadow: `0 0 30px ${gameContext.color}30`
                }}
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
                <div className="text-5xl font-black" style={{ color: gameContext.color }}>
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
                background: `linear-gradient(135deg, ${gameContext.color}, ${NEON_COLORS.neonCyan})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                游戏结束！
              </h2>

              <div className="mb-8">
                <div className="text-lg opacity-60 mb-2">最终得分</div>
                <motion.div
                  className="text-5xl font-black"
                  style={{ color: gameContext.color }}
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
                  onClick={() => setGameStatus('playing')}
                  className="px-8 py-4 rounded-2xl font-bold text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${gameContext.color}, ${NEON_COLORS.neonCyan})`,
                    color: '#ffffff',
                    boxShadow: `0 0 30px ${gameContext.color}50`
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
