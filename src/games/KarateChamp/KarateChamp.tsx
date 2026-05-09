import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';
import { KarateChampEngine, GameState, FighterState } from './engine';

const engine = new KarateChampEngine();

const KarateChamp: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(engine.getState());
  const inputRef = useRef({
    left: false,
    right: false,
    punch: false,
    kick: false,
    special: false,
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
      punch: keys.has('j'),
      kick: keys.has('k'),
      special: keys.has('l'),
      block: keys.has('s') || keys.has('arrowdown')
    };
  }, []);

  const drawFighter = useCallback((ctx: CanvasRenderingContext2D, fighter: FighterState, isPlayer: boolean) => {
    const x = fighter.x;
    const y = fighter.y;
    const color = isPlayer ? NEON_COLORS.primary : NEON_COLORS.danger;

    ctx.save();

    if (fighter.isHit) {
      ctx.globalAlpha = 0.5 + Math.sin(fighter.hitFrame * 0.5) * 0.5;
    }

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    // Draw based on stance
    if (fighter.stance === 'block') {
      // Blocking pose - arms crossed
      ctx.fillRect(x - 15, y - 55, 30, 45);
      ctx.fillRect(x - 25, y - 45, 50, 15);
      ctx.fillRect(x - 18, y - 10, 14, 20);
      ctx.fillRect(x + 4, y - 10, 14, 20);
      ctx.beginPath();
      ctx.arc(x, y - 65, 14, 0, Math.PI * 2);
      ctx.fill();

      // Block effect
      ctx.strokeStyle = NEON_COLORS.success;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - 30, 30, 0, Math.PI * 2);
      ctx.stroke();
    } else if (fighter.stance === 'attack') {
      // Attack pose
      ctx.fillRect(x - 12, y - 55, 24, 45);
      ctx.fillRect(x - 18, y - 10, 14, 20);
      ctx.fillRect(x + 4, y - 10, 14, 20);
      ctx.beginPath();
      ctx.arc(x, y - 65, 14, 0, Math.PI * 2);
      ctx.fill();

      // Attack limb
      ctx.fillStyle = NEON_COLORS.warning;
      const extend = fighter.facing === 'right' ? 25 : -25;
      if (fighter.attackType === 'kick') {
        ctx.fillRect(x + extend - 5, y - 35, 45, 12);
      } else if (fighter.attackType === 'sweep') {
        ctx.fillRect(x + extend - 5, y - 15, 50, 10);
      } else if (fighter.attackType === 'special') {
        // Special move effect
        ctx.fillStyle = NEON_COLORS.accent;
        ctx.shadowColor = NEON_COLORS.accent;
        ctx.beginPath();
        ctx.arc(x + extend + 30, y - 40, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + extend - 5, y - 45, 60, 15);
      } else {
        ctx.fillRect(x + extend - 5, y - 50, 40, 10);
      }
    } else {
      // Standing pose
      ctx.fillRect(x - 12, y - 55, 24, 45);
      ctx.fillRect(x - 18, y - 10, 14, 20);
      ctx.fillRect(x + 4, y - 10, 14, 20);
      ctx.beginPath();
      ctx.arc(x, y - 65, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // Energy bar under character
    ctx.shadowBlur = 0;
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(x - 20, y + 15, 40, 6);
    ctx.fillStyle = NEON_COLORS.accent;
    ctx.fillRect(x - 20, y + 15, 40 * (fighter.energy / fighter.maxEnergy), 6);

    ctx.restore();
  }, []);

  const drawHUD = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    // Health bars
    const barWidth = 180;
    const barHeight = 18;

    // Player health
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(30, 25, barWidth, barHeight);
    ctx.fillStyle = NEON_COLORS.primary;
    ctx.shadowColor = NEON_COLORS.primary;
    ctx.shadowBlur = 10;
    ctx.fillRect(30, 25, barWidth * (state.player.health / state.player.maxHealth), barHeight);
    ctx.shadowBlur = 0;

    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = 'bold 12px Arial';
    ctx.fillText('YOU', 30, 55);

    // Energy bar
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(30, 60, barWidth, 8);
    ctx.fillStyle = NEON_COLORS.accent;
    ctx.fillRect(30, 60, barWidth * (state.player.energy / state.player.maxEnergy), 8);

    // Opponent health
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(290, 25, barWidth, barHeight);
    ctx.fillStyle = NEON_COLORS.danger;
    ctx.shadowColor = NEON_COLORS.danger;
    ctx.shadowBlur = 10;
    ctx.fillRect(290 + barWidth * (1 - state.opponent.health / state.opponent.maxHealth), 25,
                 barWidth * (state.opponent.health / state.opponent.maxHealth), barHeight);
    ctx.shadowBlur = 0;

    ctx.fillStyle = NEON_COLORS.text;
    ctx.textAlign = 'right';
    ctx.fillText('CPU', 470, 55);
    ctx.textAlign = 'left';

    // Round and timer
    ctx.textAlign = 'center';
    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`ROUND ${state.round}`, 250, 35);

    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = state.timeLeft < 15 ? NEON_COLORS.danger : NEON_COLORS.text;
    ctx.fillText(Math.ceil(state.timeLeft).toString(), 250, 70);

    // Win indicators
    ctx.font = '12px Arial';
    ctx.fillStyle = NEON_COLORS.success;
    ctx.fillText(`W:${state.playerWins}`, 220, 45);
    ctx.fillStyle = NEON_COLORS.danger;
    ctx.fillText(`W:${state.opponentWins}`, 280, 45);

    // Score
    ctx.fillStyle = NEON_COLORS.accent;
    ctx.fillText(`${state.player.score}`, 100, 80);

    // Message
    if (state.messageTimer > 0) {
      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = NEON_COLORS.warning;
      ctx.shadowColor = NEON_COLORS.warning;
      ctx.shadowBlur = 25;
      ctx.fillText(state.message, 250, 200);
      ctx.shadowBlur = 0;
    }

    ctx.textAlign = 'left';
  }, []);

  const drawMenu = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = NEON_COLORS.background;
    ctx.fillRect(0, 0, 500, 500);

    // Title
    ctx.fillStyle = NEON_COLORS.warning;
    ctx.shadowColor = NEON_COLORS.warning;
    ctx.shadowBlur = 30;
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('KARATE CHAMP', 250, 80);
    ctx.shadowBlur = 0;

    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = '18px Arial';
    ctx.fillText('空手道冠军', 250, 110);

    // Dojo background
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(50, 150, 400, 250);
    ctx.strokeStyle = NEON_COLORS.danger;
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 150, 400, 250);

    // Fighters
    ctx.fillStyle = NEON_COLORS.primary;
    ctx.fillRect(120, 300, 30, 60);
    ctx.beginPath();
    ctx.arc(135, 285, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = NEON_COLORS.danger;
    ctx.fillRect(350, 300, 30, 60);
    ctx.beginPath();
    ctx.arc(365, 285, 15, 0, Math.PI * 2);
    ctx.fill();

    // VS
    ctx.fillStyle = NEON_COLORS.accent;
    ctx.font = 'bold 28px Arial';
    ctx.fillText('VS', 250, 320);

    // Instructions
    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = '14px Arial';
    ctx.fillText('按 ENTER 开始比赛', 250, 430);
    ctx.fillText('A/D - 移动 | J - 拳 | K - 踢', 250, 460);
    ctx.fillText('L - 特殊技 | S - 防御', 250, 480);

    ctx.textAlign = 'left';
  }, []);

  const drawGameOver = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, 500, 500);

    const isChampion = state.playerWins >= 2;
    ctx.fillStyle = isChampion ? NEON_COLORS.accent : NEON_COLORS.danger;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 30;
    ctx.font = 'bold 44px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(isChampion ? '冠军!' : '失败...', 250, 200);
    ctx.shadowBlur = 0;

    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = '18px Arial';
    ctx.fillText(`回合: ${state.playerWins} - ${state.opponentWins}`, 250, 260);
    ctx.fillText(`最终得分: ${state.player.score}`, 250, 290);

    ctx.fillStyle = NEON_COLORS.accent;
    ctx.font = '14px Arial';
    ctx.fillText('按 ENTER 返回', 250, 360);
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
    } else if (state.phase === 'fighting' || state.phase === 'roundEnd') {
      engine.tick(deltaTime, inputRef.current);
      const currentState = engine.getState();

      // Dojo background
      ctx.fillStyle = NEON_COLORS.background;
      ctx.fillRect(0, 0, 500, 500);

      // Dojo floor
      ctx.fillStyle = NEON_COLORS.surface;
      ctx.fillRect(0, 420, 500, 80);
      ctx.strokeStyle = NEON_COLORS.warning;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 420);
      ctx.lineTo(500, 420);
      ctx.stroke();

      // Draw fighters
      drawFighter(ctx, currentState.player, true);
      drawFighter(ctx, currentState.opponent, false);

      // HUD
      drawHUD(ctx, currentState);
    } else if (state.phase === 'gameover') {
      drawGameOver(ctx, engine.getState());
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
          engine.startFight();
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
        className="border-2 border-yellow-500 rounded-lg"
        style={{ boxShadow: `0 0 20px ${NEON_COLORS.warning}40` }}
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

export default KarateChamp;
