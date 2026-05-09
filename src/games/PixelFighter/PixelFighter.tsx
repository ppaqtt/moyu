import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';
import { PixelFighterEngine, GameState, FighterState, InputState } from './engine';

const engine = new PixelFighterEngine();

const PixelFighter: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(engine.getState());
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    up: false,
    down: false,
    punch: false,
    kick: false,
    special: false
  });
  const keysRef = useRef<Set<string>>(new Set());
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase());
    if (['w', 'a', 's', 'd', 'j', 'k', 'l', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
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
      up: keys.has('w') || keys.has('arrowup'),
      down: keys.has('s') || keys.has('arrowdown'),
      punch: keys.has('j'),
      kick: keys.has('k'),
      special: keys.has('l')
    };
  }, []);

  const drawFighter = useCallback((ctx: CanvasRenderingContext2D, fighter: FighterState, isPlayer1: boolean) => {
    const x = fighter.x;
    const y = fighter.y;
    const height = fighter.isDucking ? 40 : fighter.isJumping ? 90 : 80;
    const color = isPlayer1 ? NEON_COLORS.primary : NEON_COLORS.danger;

    ctx.save();

    // Flash red when hit
    if (fighter.isHit) {
      ctx.globalAlpha = 0.5 + Math.sin(fighter.hitFrame * 0.5) * 0.5;
    }

    // Body
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    if (fighter.isDucking) {
      // Ducking pose
      ctx.fillRect(x - 25, y - 30, 50, 30);
      ctx.fillRect(x - 30, y - 20, 60, 20);
      // Head
      ctx.beginPath();
      ctx.arc(x, y - 40, 15, 0, Math.PI * 2);
      ctx.fill();
    } else if (fighter.isJumping) {
      // Jumping pose
      ctx.fillRect(x - 20, y - 60, 40, 40);
      // Legs spread
      ctx.fillRect(x - 35, y - 20, 20, 25);
      ctx.fillRect(x + 15, y - 20, 20, 25);
      // Head
      ctx.beginPath();
      ctx.arc(x, y - 75, 15, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Standing pose
      ctx.fillRect(x - 20, y - 60, 40, 40);
      // Legs
      ctx.fillRect(x - 25, y - 20, 15, 25);
      ctx.fillRect(x + 10, y - 20, 15, 25);
      // Head
      ctx.beginPath();
      ctx.arc(x, y - 75, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Attack animation
    if (fighter.isAttacking) {
      ctx.fillStyle = NEON_COLORS.warning;
      ctx.shadowColor = NEON_COLORS.warning;
      const armExtend = fighter.facing === 'right' ? 30 : -30;
      const armY = fighter.attackType === 'kick' ? y - 30 : y - 50;

      if (fighter.attackType === 'kick') {
        ctx.fillRect(x + armExtend - 10, y - 40, 40, 15);
      } else {
        ctx.fillRect(x + armExtend - 10, y - 55, 40, 12);
      }

      // Attack effect
      ctx.globalAlpha = 1 - fighter.attackFrame / 20;
      ctx.beginPath();
      ctx.arc(x + armExtend + (fighter.facing === 'right' ? 20 : -20), armY, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Blocking indicator
    if (fighter.isBlocking) {
      ctx.strokeStyle = NEON_COLORS.success;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 40, 35, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }, []);

  const drawHUD = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    // Health bars
    const barWidth = 200;
    const barHeight = 20;

    // Player 1 health
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(20, 20, barWidth, barHeight);
    ctx.fillStyle = NEON_COLORS.primary;
    ctx.shadowColor = NEON_COLORS.primary;
    ctx.shadowBlur = 10;
    ctx.fillRect(20, 20, barWidth * (state.player1.health / state.player1.maxHealth), barHeight);
    ctx.shadowBlur = 0;

    // Player 1 name
    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = 'bold 14px Arial';
    ctx.fillText('PLAYER 1', 20, 55);

    // Player 2 health
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(380, 20, barWidth, barHeight);
    ctx.fillStyle = NEON_COLORS.danger;
    ctx.shadowColor = NEON_COLORS.danger;
    ctx.shadowBlur = 10;
    ctx.fillRect(380 + barWidth * (1 - state.player2.health / state.player2.maxHealth), 20,
                 barWidth * (state.player2.health / state.player2.maxHealth), barHeight);
    ctx.shadowBlur = 0;

    // Player 2 name
    ctx.fillStyle = NEON_COLORS.text;
    ctx.fillText('PLAYER 2', 380, 55);

    // Round indicator
    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`ROUND ${state.round}`, 300, 35);

    // Timer
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = state.timeLeft < 10 ? NEON_COLORS.danger : NEON_COLORS.text;
    ctx.fillText(Math.ceil(state.timeLeft).toString(), 300, 70);

    // Win indicators
    ctx.font = '12px Arial';
    ctx.fillText('W: ' + state.player1Wins, 20, 75);
    ctx.fillText('W: ' + state.player2Wins, 560, 75);

    // Score
    ctx.fillStyle = NEON_COLORS.accent;
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${state.score1}`, 70, 75);
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${state.score2}`, 530, 75);

    // Message
    if (state.messageTimer > 0) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 32px Arial';
      ctx.fillStyle = NEON_COLORS.warning;
      ctx.shadowColor = NEON_COLORS.warning;
      ctx.shadowBlur = 20;
      ctx.fillText(state.message, 300, 150);
      ctx.shadowBlur = 0;
    }

    ctx.textAlign = 'left';
  }, []);

  const drawMenu = useCallback((ctx: CanvasRenderingContext2D) => {
    // Background
    ctx.fillStyle = NEON_COLORS.background;
    ctx.fillRect(0, 0, 600, 400);

    // Title
    ctx.fillStyle = NEON_COLORS.primary;
    ctx.shadowColor = NEON_COLORS.primary;
    ctx.shadowBlur = 30;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PIXEL FIGHTER', 300, 100);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = NEON_COLORS.secondary;
    ctx.font = '20px Arial';
    ctx.fillText('像素格斗', 300, 130);

    // Fighter silhouettes
    ctx.fillStyle = NEON_COLORS.danger;
    ctx.fillRect(150, 200, 60, 100);
    ctx.beginPath();
    ctx.arc(180, 180, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = NEON_COLORS.primary;
    ctx.fillRect(390, 200, 60, 100);
    ctx.beginPath();
    ctx.arc(420, 180, 25, 0, Math.PI * 2);
    ctx.fill();

    // VS
    ctx.fillStyle = NEON_COLORS.warning;
    ctx.font = 'bold 36px Arial';
    ctx.fillText('VS', 300, 250);

    // Instructions
    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = '14px Arial';
    ctx.fillText('按 ENTER 开始游戏', 300, 320);
    ctx.fillText('WASD/方向键 - 移动 | J - 拳 | K - 踢 | L - 连击', 300, 350);
    ctx.fillText('S/下键 - 防御', 300, 370);

    ctx.textAlign = 'left';
  }, []);

  const drawGameOver = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    // Darken background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 600, 400);

    // Winner text
    ctx.fillStyle = state.winner === 1 ? NEON_COLORS.primary : NEON_COLORS.danger;
    ctx.shadowColor = state.winner === 1 ? NEON_COLORS.primary : NEON_COLORS.danger;
    ctx.shadowBlur = 30;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(state.winner === 1 ? 'PLAYER 1 胜利!' : 'PLAYER 2 胜利!', 300, 180);
    ctx.shadowBlur = 0;

    // Final score
    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = '20px Arial';
    ctx.fillText(`最终比分: ${state.score1} - ${state.score2}`, 300, 230);

    // Rounds won
    ctx.fillText(`回合: ${state.player1Wins} - ${state.player2Wins}`, 300, 260);

    // Restart instruction
    ctx.fillStyle = NEON_COLORS.accent;
    ctx.font = '16px Arial';
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
    } else if (state.phase === 'fighting') {
      engine.tick(deltaTime, inputRef.current);
      const currentState = engine.getState();

      // Draw background
      ctx.fillStyle = NEON_COLORS.background;
      ctx.fillRect(0, 0, 600, 400);

      // Draw arena floor
      ctx.fillStyle = NEON_COLORS.surface;
      ctx.fillRect(0, 350, 600, 50);
      ctx.strokeStyle = NEON_COLORS.primary;
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 350, 600, 50);

      // Draw fighters
      drawFighter(ctx, currentState.player1, true);
      drawFighter(ctx, currentState.player2, false);

      // Draw HUD
      drawHUD(ctx, currentState);
    } else if (state.phase === 'gameover') {
      // Still draw the last fighting frame
      const currentState = engine.getState();
      ctx.fillStyle = NEON_COLORS.background;
      ctx.fillRect(0, 0, 600, 400);
      drawFighter(ctx, currentState.player1, true);
      drawFighter(ctx, currentState.player2, false);
      drawGameOver(ctx, currentState);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [drawMenu, drawFighter, drawHUD, drawGameOver, updateInput]);

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
          engine.startGame();
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
        height={400}
        className="border-2 border-cyan-500 rounded-lg"
        style={{ boxShadow: `0 0 20px ${NEON_COLORS.primary}40` }}
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

export default PixelFighter;
