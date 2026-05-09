import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';
import { SamuraiSlashEngine, GameState, SamuraiState, SlashEffect } from './engine';

const engine = new SamuraiSlashEngine();

const SamuraiSlash: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(engine.getState());
  const inputRef = useRef({
    left: false,
    right: false,
    strike1: false,
    strike2: false,
    strike3: false,
    block: false
  });
  const keysRef = useRef<Set<string>>(new Set());
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase());
    if (['a', 'd', 'j', 'k', 'l', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
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
      strike1: keys.has('j'),
      strike2: keys.has('k'),
      strike3: keys.has('l'),
      block: keys.has('s') || keys.has('arrowdown')
    };
  }, []);

  const drawSamurai = useCallback((ctx: CanvasRenderingContext2D, samurai: SamuraiState, isPlayer1: boolean) => {
    const x = samurai.x;
    const y = samurai.y;
    const color = isPlayer1 ? NEON_COLORS.primary : NEON_COLORS.danger;

    ctx.save();

    if (samurai.stance === 'hit') {
      ctx.globalAlpha = 0.5 + Math.sin(samurai.hitFrame * 0.3) * 0.3;
    }

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    // Body
    ctx.fillRect(x - 15, y - 80, 30, 55);

    // Head
    ctx.beginPath();
    ctx.arc(x, y - 90, 14, 0, Math.PI * 2);
    ctx.fill();

    // Legs ( hakama style)
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x - 20, y - 25, 15, 30);
    ctx.fillRect(x + 5, y - 25, 15, 30);

    // Draw sword based on stance
    if (samurai.stance === 'strike') {
      ctx.strokeStyle = NEON_COLORS.text;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      const extend = samurai.facing === 'right' ? 40 : -40;
      const angle = samurai.strikeType === 'horizontal' ? Math.PI / 6 :
                    samurai.strikeType === 'vertical' ? -Math.PI / 3 :
                    Math.PI / 8;

      ctx.save();
      ctx.translate(x + (samurai.facing === 'right' ? 15 : -15), y - 50);
      ctx.rotate(samurai.facing === 'right' ? angle : Math.PI - angle);

      // Sword
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(60, 0);
      ctx.stroke();

      // Handle
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(-15, -4, 15, 8);

      ctx.restore();

      // Strike effect
      ctx.strokeStyle = NEON_COLORS.warning;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1 - samurai.strikeFrame / 25;
      const arcX = x + (samurai.facing === 'right' ? 50 : -50);
      ctx.beginPath();
      ctx.arc(arcX, y - 50, 30, samurai.facing === 'right' ? -Math.PI / 2 : Math.PI / 2, samurai.facing === 'right' ? Math.PI / 2 : -Math.PI / 2);
      ctx.stroke();
    } else if (samurai.isBlocking) {
      // Defensive stance
      ctx.strokeStyle = NEON_COLORS.success;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 50, 35, 0, Math.PI * 2);
      ctx.stroke();

      // Sword raised
      ctx.strokeStyle = NEON_COLORS.text;
      ctx.lineWidth = 4;
      ctx.beginPath();
      const swordX = samurai.facing === 'right' ? x + 20 : x - 20;
      ctx.moveTo(x, y - 60);
      ctx.lineTo(swordX, y - 90);
      ctx.stroke();
    } else {
      // Ready stance - sword at side
      ctx.strokeStyle = NEON_COLORS.text;
      ctx.lineWidth = 4;
      const swordX = samurai.facing === 'right' ? x + 15 : x - 15;
      ctx.beginPath();
      ctx.moveTo(x, y - 50);
      ctx.lineTo(swordX, y - 20);
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  const drawSlashEffect = useCallback((ctx: CanvasRenderingContext2D, effect: SlashEffect) => {
    ctx.save();
    ctx.strokeStyle = effect.player === 1 ? NEON_COLORS.primary : NEON_COLORS.danger;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 1 - effect.frame / 20;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 20;

    const x = effect.x;
    const y = effect.y;
    const progress = effect.frame / 20;

    if (effect.type === 'horizontal') {
      ctx.beginPath();
      ctx.moveTo(x - 40 * progress, y);
      ctx.lineTo(x + 40 * progress, y);
      ctx.stroke();
    } else if (effect.type === 'vertical') {
      ctx.beginPath();
      ctx.moveTo(x, y - 50 * progress);
      ctx.lineTo(x, y + 30 * progress);
      ctx.stroke();
    } else {
      // Thrust
      ctx.beginPath();
      ctx.arc(x + 30 * progress * (effect.player === 1 ? 1 : -1), y, 15 * progress, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  const drawHUD = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    const barWidth = 200;
    const barHeight = 16;

    // Player 1 (left side)
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(30, 25, barWidth, barHeight);
    ctx.fillStyle = NEON_COLORS.primary;
    ctx.shadowColor = NEON_COLORS.primary;
    ctx.shadowBlur = 10;
    ctx.fillRect(30, 25, barWidth * (state.player1.health / state.player1.maxHealth), barHeight);
    ctx.shadowBlur = 0;

    // Honor bar
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(30, 48, barWidth, 8);
    ctx.fillStyle = NEON_COLORS.accent;
    ctx.fillRect(30, 48, barWidth * (state.player1.honor / state.player1.maxHonor), 8);

    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = 'bold 11px Arial';
    ctx.fillText('武士 1', 30, 70);

    // Player 2 (right side)
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(370, 25, barWidth, barHeight);
    ctx.fillStyle = NEON_COLORS.danger;
    ctx.shadowColor = NEON_COLORS.danger;
    ctx.shadowBlur = 10;
    ctx.fillRect(370 + barWidth * (1 - state.player2.health / state.player2.maxHealth), 25,
                 barWidth * (state.player2.health / state.player2.maxHealth), barHeight);
    ctx.shadowBlur = 0;

    // Honor bar
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(370, 48, barWidth, 8);
    ctx.fillStyle = NEON_COLORS.accent;
    ctx.fillRect(370 + barWidth * (1 - state.player2.honor / state.player2.maxHonor), 48,
                 barWidth * (state.player2.honor / state.player2.maxHonor), 8);

    ctx.fillStyle = NEON_COLORS.text;
    ctx.textAlign = 'right';
    ctx.fillText('武士 2', 570, 70);
    ctx.textAlign = 'left';

    // Round and timer
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = NEON_COLORS.text;
    ctx.fillText(`回合 ${state.round}`, 300, 30);

    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = state.timeLeft < 10 ? NEON_COLORS.danger : NEON_COLORS.warning;
    ctx.fillText(Math.ceil(state.timeLeft).toString(), 300, 60);

    // Score
    ctx.font = '12px Arial';
    ctx.fillStyle = NEON_COLORS.accent;
    ctx.fillText(`${state.player1.score} - ${state.player2.score}`, 300, 80);

    // Message
    if (state.messageTimer > 0) {
      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = NEON_COLORS.warning;
      ctx.shadowColor = NEON_COLORS.warning;
      ctx.shadowBlur = 25;
      ctx.fillText(state.message, 300, 180);
      ctx.shadowBlur = 0;
    }

    ctx.textAlign = 'left';
  }, []);

  const drawMenu = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = NEON_COLORS.background;
    ctx.fillRect(0, 0, 600, 500);

    // Title
    ctx.fillStyle = NEON_COLORS.danger;
    ctx.shadowColor = NEON_COLORS.danger;
    ctx.shadowBlur = 30;
    ctx.font = 'bold 44px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SAMURAI SLASH', 300, 80);
    ctx.shadowBlur = 0;

    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = '20px Arial';
    ctx.fillText('武士斩击', 300, 115);

    // Japanese style decorations
    ctx.strokeStyle = NEON_COLORS.danger;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 150);
    ctx.lineTo(500, 150);
    ctx.stroke();

    // Samurai silhouettes
    ctx.fillStyle = NEON_COLORS.primary;
    ctx.fillRect(180, 250, 30, 80);
    ctx.beginPath();
    ctx.arc(195, 235, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = NEON_COLORS.primary;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(210, 270);
    ctx.lineTo(250, 240);
    ctx.stroke();

    ctx.fillStyle = NEON_COLORS.danger;
    ctx.fillRect(390, 250, 30, 80);
    ctx.beginPath();
    ctx.arc(405, 235, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = NEON_COLORS.danger;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(350, 270);
    ctx.lineTo(310, 240);
    ctx.stroke();

    // Instructions
    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = '14px Arial';
    ctx.fillText('按 ENTER 开始决斗', 300, 380);
    ctx.fillText('A/D - 移动', 300, 420);
    ctx.fillText('J - 横斩 | K - 竖劈 | L - 突刺', 300, 445);
    ctx.fillText('S - 防御', 300, 470);

    ctx.textAlign = 'left';
  }, []);

  const drawGameOver = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 600, 500);

    const winnerColor = state.winner === 1 ? NEON_COLORS.primary : NEON_COLORS.danger;
    ctx.fillStyle = winnerColor;
    ctx.shadowColor = winnerColor;
    ctx.shadowBlur = 30;
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(state.winner === 1 ? '武士1 胜利!' : '武士2 胜利!', 300, 180);
    ctx.shadowBlur = 0;

    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = '16px Arial';
    ctx.fillText(`得分: ${state.player1.score} - ${state.player2.score}`, 300, 240);

    ctx.fillStyle = NEON_COLORS.accent;
    ctx.font = '14px Arial';
    ctx.fillText('按 ENTER 返回主菜单', 300, 320);
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
    } else if (state.phase === 'ready' || state.phase === 'fighting') {
      engine.tick(deltaTime, inputRef.current);
      const currentState = engine.getState();

      // Background
      ctx.fillStyle = NEON_COLORS.background;
      ctx.fillRect(0, 0, 600, 500);

      // Arena floor
      ctx.fillStyle = NEON_COLORS.surface;
      ctx.fillRect(0, 430, 600, 70);
      ctx.strokeStyle = NEON_COLORS.danger;
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 430, 600, 70);

      // Draw samurai
      drawSamurai(ctx, currentState.player1, true);
      drawSamurai(ctx, currentState.player2, false);

      // Draw slash effects
      currentState.effects.forEach(effect => drawSlashEffect(ctx, effect));

      // HUD
      drawHUD(ctx, currentState);
    } else if (state.phase === 'gameover') {
      const currentState = engine.getState();
      ctx.fillStyle = NEON_COLORS.background;
      ctx.fillRect(0, 0, 600, 500);
      drawSamurai(ctx, currentState.player1, true);
      drawSamurai(ctx, currentState.player2, false);
      drawHUD(ctx, currentState);
      drawGameOver(ctx, currentState);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [drawMenu, drawSamurai, drawSlashEffect, drawHUD, drawGameOver, updateInput]);

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
          engine.startDuel();
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
        width={600}
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

export default SamuraiSlash;
