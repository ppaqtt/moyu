import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';
import { WrestleManiaEngine, GameState, WrestlerState } from './engine';

const engine = new WrestleManiaEngine();

const WrestleMania: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(engine.getState());
  const inputRef = useRef({
    left: false,
    right: false,
    grab: false,
    throw_: false,
    pin: false
  });
  const keysRef = useRef<Set<string>>(new Set());
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase());
    if (['a', 'd', 'j', 'k', 'l', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key.toLowerCase());
  }, []);

  const updateInput = useCallback(() => {
    const keys = keysRef.current;
    inputRef.current = {
      left: keys.has('a') || keys.has('arrowleft'),
      right: keys.has('d') || keys.has('arrowright'),
      grab: keys.has('j'),
      throw_: keys.has('k'),
      pin: keys.has('l')
    };
  }, []);

  const drawWrestler = useCallback((ctx: CanvasRenderingContext2D, wrestler: WrestlerState, isPlayer1: boolean) => {
    const x = wrestler.x;
    const y = wrestler.y;
    const color = isPlayer1 ? NEON_COLORS.primary : NEON_COLORS.danger;

    ctx.save();

    // Dizzy effect
    if (wrestler.state === 'dizzy') {
      ctx.globalAlpha = 0.6 + Math.sin(wrestler.dizzyFrame * 0.2) * 0.4;
      // Stars around head
      ctx.fillStyle = NEON_COLORS.accent;
      for (let i = 0; i < 3; i++) {
        const angle = (wrestler.dizzyFrame * 0.1) + (i * Math.PI * 2 / 3);
        const starX = x + Math.cos(angle) * 30;
        const starY = y - 80 + Math.sin(angle) * 10;
        ctx.beginPath();
        ctx.arc(starX, starY, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    // Body
    ctx.fillRect(x - 20, y - 70, 40, 55);

    // Head
    ctx.beginPath();
    ctx.arc(x, y - 80, 16, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillRect(x - 18, y - 15, 14, 25);
    ctx.fillRect(x + 4, y - 15, 14, 25);

    // Arms based on state
    if (wrestler.state === 'grappling') {
      // Arms extended for grapple
      const extend = wrestler.facing === 'right' ? 25 : -25;
      ctx.fillRect(x + (wrestler.facing === 'right' ? 0 : -30), y - 60, 30, 12);
      ctx.fillRect(x + (wrestler.facing === 'right' ? 10 : -40), y - 50, 12, 30);
    } else if (wrestler.state === 'thrown') {
      // Flailing arms
      ctx.fillRect(x - 35, y - 60, 20, 10);
      ctx.fillRect(x + 15, y - 60, 20, 10);
    } else if (wrestler.state === 'pinning') {
      // Arms pinning opponent
      ctx.fillRect(x - 25, y - 40, 50, 10);
    } else {
      // Standing arms
      ctx.fillRect(x - 30, y - 60, 12, 30);
      ctx.fillRect(x + 18, y - 60, 12, 30);
    }

    // Stamina bar
    ctx.shadowBlur = 0;
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(x - 25, y + 15, 50, 6);
    ctx.fillStyle = NEON_COLORS.success;
    ctx.fillRect(x - 25, y + 15, 50 * (wrestler.stamina / wrestler.maxStamina), 6);

    ctx.restore();
  }, []);

  const drawRing = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    // Ring ropes
    ctx.strokeStyle = NEON_COLORS.warning;
    ctx.lineWidth = 4;

    // Top rope
    ctx.beginPath();
    ctx.moveTo(30, 300);
    ctx.lineTo(470, 300);
    ctx.stroke();

    // Middle rope
    ctx.strokeStyle = NEON_COLORS.danger;
    ctx.beginPath();
    ctx.moveTo(30, 340);
    ctx.lineTo(470, 340);
    ctx.stroke();

    // Bottom rope
    ctx.strokeStyle = NEON_COLORS.primary;
    ctx.beginPath();
    ctx.moveTo(30, 380);
    ctx.lineTo(470, 380);
    ctx.stroke();

    // Ring floor
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(30, 380, 440, 80);

    // Corner posts
    ctx.fillStyle = NEON_COLORS.danger;
    ctx.fillRect(25, 290, 15, 170);
    ctx.fillRect(460, 290, 15, 170);

    // Crowd
    const crowdY = 250;
    for (let i = 0; i < 20; i++) {
      const crowdX = 50 + i * 22;
      const wave = Math.sin(Date.now() * 0.005 + i * 0.5) * (state.crowdIntensity / 50);
      ctx.fillStyle = i % 2 === 0 ? NEON_COLORS.secondary : NEON_COLORS.primary;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(crowdX, crowdY + wave, 15, 30);
      ctx.globalAlpha = 1;
    }
  }, []);

  const drawHUD = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    const barWidth = 160;
    const barHeight = 16;

    // Player 1 health
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(30, 20, barWidth, barHeight);
    ctx.fillStyle = NEON_COLORS.primary;
    ctx.shadowColor = NEON_COLORS.primary;
    ctx.shadowBlur = 8;
    ctx.fillRect(30, 20, barWidth * (state.wrestlers[0].health / state.wrestlers[0].maxHealth), barHeight);
    ctx.shadowBlur = 0;

    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = 'bold 11px Arial';
    ctx.fillText('选手1', 30, 48);

    // Player 2 health
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(310, 20, barWidth, barHeight);
    ctx.fillStyle = NEON_COLORS.danger;
    ctx.shadowColor = NEON_COLORS.danger;
    ctx.shadowBlur = 8;
    ctx.fillRect(310 + barWidth * (1 - state.wrestlers[1].health / state.wrestlers[1].maxHealth), 20,
                 barWidth * (state.wrestlers[1].health / state.wrestlers[1].maxHealth), barHeight);
    ctx.shadowBlur = 0;

    ctx.fillStyle = NEON_COLORS.text;
    ctx.textAlign = 'right';
    ctx.fillText('选手2', 470, 48);
    ctx.textAlign = 'left';

    // Timer
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = state.roundTime < 30 ? NEON_COLORS.danger : NEON_COLORS.text;
    ctx.fillText(Math.ceil(state.roundTime).toString(), 250, 40);

    // Score
    ctx.font = '12px Arial';
    ctx.fillStyle = NEON_COLORS.accent;
    ctx.fillText(`${state.wrestlers[0].score}`, 90, 65);
    ctx.fillText(`${state.wrestlers[1].score}`, 410, 65);

    // Pin progress bar
    if (state.pinProgress > 0) {
      ctx.fillStyle = NEON_COLORS.surface;
      ctx.fillRect(150, 70, 200, 12);
      ctx.fillStyle = NEON_COLORS.warning;
      ctx.shadowColor = NEON_COLORS.warning;
      ctx.shadowBlur = 10;
      ctx.fillRect(150, 70, 200 * (state.pinProgress / 100), 12);
      ctx.shadowBlur = 0;

      ctx.fillStyle = NEON_COLORS.text;
      ctx.font = 'bold 10px Arial';
      ctx.fillText('压制中...', 250, 95);
    }

    // Message
    if (state.messageTimer > 0) {
      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = NEON_COLORS.warning;
      ctx.shadowColor = NEON_COLORS.warning;
      ctx.shadowBlur = 25;
      ctx.fillText(state.message, 250, 180);
      ctx.shadowBlur = 0;
    }

    ctx.textAlign = 'left';
  }, []);

  const drawMenu = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = NEON_COLORS.background;
    ctx.fillRect(0, 0, 500, 500);

    // Title
    ctx.fillStyle = NEON_COLORS.danger;
    ctx.shadowColor = NEON_COLORS.danger;
    ctx.shadowBlur = 30;
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WRESTLE MANIA', 250, 80);
    ctx.shadowBlur = 0;

    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = '20px Arial';
    ctx.fillText('摔跤狂热', 250, 115);

    // Ring preview
    ctx.strokeStyle = NEON_COLORS.warning;
    ctx.lineWidth = 3;
    ctx.strokeRect(100, 200, 300, 120);

    // Wrestlers
    ctx.fillStyle = NEON_COLORS.primary;
    ctx.fillRect(160, 280, 40, 50);
    ctx.beginPath();
    ctx.arc(180, 270, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = NEON_COLORS.danger;
    ctx.fillRect(300, 280, 40, 50);
    ctx.beginPath();
    ctx.arc(320, 270, 15, 0, Math.PI * 2);
    ctx.fill();

    // VS
    ctx.fillStyle = NEON_COLORS.accent;
    ctx.font = 'bold 28px Arial';
    ctx.fillText('VS', 250, 290);

    // Instructions
    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = '14px Arial';
    ctx.fillText('按 ENTER 开始比赛', 250, 380);
    ctx.fillText('A/D - 移动', 250, 420);
    ctx.fillText('J - 抓住 | K - 摔投', 250, 445);
    ctx.fillText('L - 压制 (对方晕眩时)', 250, 470);

    ctx.textAlign = 'left';
  }, []);

  const drawGameOver = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 500, 500);

    const winnerColor = state.winner === 1 ? NEON_COLORS.primary : NEON_COLORS.danger;
    ctx.fillStyle = winnerColor;
    ctx.shadowColor = winnerColor;
    ctx.shadowBlur = 30;
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(state.winner === 1 ? '选手1 获胜!' : '选手2 获胜!', 250, 200);
    ctx.shadowBlur = 0;

    // Championship belt
    ctx.fillStyle = NEON_COLORS.accent;
    ctx.shadowColor = NEON_COLORS.accent;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(250, 280, 80, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.beginPath();
    ctx.ellipse(250, 280, 60, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = '18px Arial';
    ctx.fillText(`得分: ${state.wrestlers[0].score} - ${state.wrestlers[1].score}`, 250, 350);

    ctx.fillStyle = NEON_COLORS.accent;
    ctx.font = '14px Arial';
    ctx.fillText('按 ENTER 返回', 250, 420);
    ctx.textAlign = 'left';
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = engine.getState();
    setGameState({ ...state });

    updateInput();

    if (state.phase === 'menu') {
      drawMenu(ctx);
    } else if (state.phase === 'fighting') {
      engine.tick(deltaTime, inputRef.current);
      const currentState = engine.getState();

      // Background
      ctx.fillStyle = NEON_COLORS.background;
      ctx.fillRect(0, 0, 500, 500);

      // Ring
      drawRing(ctx, currentState);

      // Wrestlers
      drawWrestler(ctx, currentState.wrestlers[0], true);
      drawWrestler(ctx, currentState.wrestlers[1], false);

      // HUD
      drawHUD(ctx, currentState);
    } else if (state.phase === 'gameover') {
      const currentState = engine.getState();
      ctx.fillStyle = NEON_COLORS.background;
      ctx.fillRect(0, 0, 500, 500);
      drawRing(ctx, currentState);
      drawWrestler(ctx, currentState.wrestlers[0], true);
      drawWrestler(ctx, currentState.wrestlers[1], false);
      drawGameOver(ctx, currentState);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [drawMenu, drawRing, drawWrestler, drawHUD, drawGameOver, updateInput]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [handleKeyDown, handleKeyUp, gameLoop]);

  useEffect(() => {
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const state = engine.getState();
        if (state.phase === 'menu') {
          engine.startMatch();
        } else if (state.phase === 'gameover') {
          engine.reset();
        }
      }
    };

    window.addEventListener('keydown', handleEnter);
    return () => window.removeEventListener('keydown', handleEnter);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className="border-2 border-red-500 rounded-lg"
        style={{ boxShadow: `0 0 20px ${NEON_COLORS.danger}40` }}
      />
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
      >
        返回主页
      </button>
    </div>
  );
};

export default WrestleMania;
