import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';
import { BrawlStarsEngine, GameState, Character } from './engine';

const engine = new BrawlStarsEngine();

const BrawlStars: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(engine.getState());
  const [characters, setCharacters] = useState<Character[]>(engine.getCharacters());
  const inputRef = useRef({ left: false, right: false, attack: false, special: false });
  const keysRef = useRef<Set<string>>(new Set());
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase());
    if (['w', 'a', 's', 'd', 'j', 'k', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
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
      attack: keys.has('j'),
      special: keys.has('k')
    };
  }, []);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, player: ReturnType<typeof engine.getState>['players'][0], isPlayer1: boolean) => {
    const x = player.x;
    const y = player.y;
    const size = 50;
    const color = player.character.color;

    ctx.save();

    if (player.isHit) {
      ctx.globalAlpha = 0.5 + Math.sin(player.hitFrame * 0.5) * 0.5;
    }

    // Body
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    // Draw character
    ctx.beginPath();
    ctx.arc(x, y - size + 15, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 15, y - size + 35, 30, 35);

    // Power-up effect
    if (player.hasPowerUp) {
      ctx.strokeStyle = player.powerUpType === 'health' ? NEON_COLORS.success :
                       player.powerUpType === 'speed' ? NEON_COLORS.primary :
                       player.powerUpType === 'damage' ? NEON_COLORS.danger : NEON_COLORS.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - size / 2, size + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Attack animation
    if (player.isAttacking) {
      ctx.fillStyle = NEON_COLORS.warning;
      const extend = player.facing === 'right' ? 30 : -30;
      if (player.attackType === 'special') {
        ctx.fillRect(x + extend - 5, y - size - 10, 50, 20);
        ctx.beginPath();
        ctx.arc(x + extend + 25, y - size, 15, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(x + extend - 5, y - size + 30, 40, 12);
      }
    }

    // Shield effect
    if (player.hasPowerUp && player.powerUpType === 'shield') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y - size / 2, size + 10, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, []);

  const drawPowerUp = useCallback((ctx: CanvasRenderingContext2D, powerUp: NonNullable<GameState['powerUps'][0]>) => {
    if (!powerUp.active) return;

    const pulse = Math.sin(Date.now() * 0.01) * 5;
    const color = powerUp.type === 'health' ? NEON_COLORS.success :
                  powerUp.type === 'speed' ? NEON_COLORS.primary :
                  powerUp.type === 'damage' ? NEON_COLORS.danger : NEON_COLORS.accent;

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15 + pulse;

    ctx.beginPath();
    ctx.arc(powerUp.x, powerUp.y, 15 + pulse / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(powerUp.type.charAt(0).toUpperCase(), powerUp.x, powerUp.y + 4);
    ctx.textAlign = 'left';
  }, []);

  const drawHUD = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    // Health bars
    const barWidth = 180;
    const barHeight = 16;

    // Player 1
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(20, 20, barWidth, barHeight);
    ctx.fillStyle = state.players[0].character.color;
    ctx.shadowColor = state.players[0].character.color;
    ctx.shadowBlur = 8;
    ctx.fillRect(20, 20, barWidth * (state.players[0].health / state.players[0].maxHealth), barHeight);
    ctx.shadowBlur = 0;

    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = 'bold 11px Arial';
    ctx.fillText('P1: ' + state.players[0].character.name, 20, 50);

    // Player 2
    ctx.fillStyle = NEON_COLORS.surface;
    ctx.fillRect(300, 20, barWidth, barHeight);
    ctx.fillStyle = state.players[1].character.color;
    ctx.shadowColor = state.players[1].character.color;
    ctx.shadowBlur = 8;
    ctx.fillRect(300 + barWidth * (1 - state.players[1].health / state.players[1].maxHealth), 20,
                 barWidth * (state.players[1].health / state.players[1].maxHealth), barHeight);
    ctx.shadowBlur = 0;

    ctx.fillStyle = NEON_COLORS.text;
    ctx.fillText('P2: ' + state.players[1].character.name, 300, 50);

    // Timer
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = state.timeLeft < 20 ? NEON_COLORS.danger : NEON_COLORS.text;
    ctx.fillText(Math.ceil(state.timeLeft).toString(), 250, 40);

    // Score
    ctx.font = '12px Arial';
    ctx.fillStyle = NEON_COLORS.accent;
    ctx.fillText(`Score: ${state.players[0].score}`, 20, 65);
    ctx.fillText(`Score: ${state.players[1].score}`, 300, 65);

    // Message
    if (state.messageTimer > 0) {
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = NEON_COLORS.warning;
      ctx.shadowColor = NEON_COLORS.warning;
      ctx.shadowBlur = 20;
      ctx.fillText(state.message, 250, 120);
      ctx.shadowBlur = 0;
    }

    ctx.textAlign = 'left';
  }, []);

  const drawMenu = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = NEON_COLORS.background;
    ctx.fillRect(0, 0, 500, 500);

    ctx.fillStyle = NEON_COLORS.secondary;
    ctx.shadowColor = NEON_COLORS.secondary;
    ctx.shadowBlur = 30;
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BRAWL STARS', 250, 80);
    ctx.shadowBlur = 0;

    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = '18px Arial';
    ctx.fillText('乱斗明星', 250, 110);

    ctx.fillStyle = NEON_COLORS.accent;
    ctx.font = '16px Arial';
    ctx.fillText('按 ENTER 选择角色', 250, 160);
    ctx.fillText('WASD/方向键 - 移动', 250, 200);
    ctx.fillText('J - 攻击 | K - 特殊技', 250, 225);
    ctx.fillText('收集能量道具增强能力', 250, 260);

    ctx.textAlign = 'left';
  }, []);

  const drawCharacterSelect = useCallback((ctx: CanvasRenderingContext2D, selected: number, chars: Character[]) => {
    ctx.fillStyle = NEON_COLORS.background;
    ctx.fillRect(0, 0, 500, 500);

    ctx.fillStyle = NEON_COLORS.primary;
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('选择角色', 250, 40);
    ctx.textAlign = 'left';

    // Draw character options
    chars.forEach((char, i) => {
      const x = 50 + (i % 5) * 90;
      const y = 100 + Math.floor(i / 5) * 120;

      ctx.fillStyle = selected === i ? NEON_COLORS.accent : NEON_COLORS.surface;
      ctx.fillRect(x - 5, y - 5, 80, 100);

      ctx.fillStyle = char.color;
      ctx.shadowColor = char.color;
      ctx.shadowBlur = selected === i ? 20 : 10;
      ctx.beginPath();
      ctx.arc(x + 35, y + 30, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + 15, y + 50, 40, 35);
      ctx.shadowBlur = 0;

      ctx.fillStyle = NEON_COLORS.text;
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(char.name, x + 35, y + 95);
      ctx.fillText(char.nameCn, x + 35, y + 105);
    });

    // Show selected character stats
    const selectedChar = chars[selected];
    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`生命: ${selectedChar.health} 速度: ${selectedChar.speed} 力量: ${selectedChar.power}`, 250, 380);
    ctx.fillText(`特殊: ${selectedChar.special}`, 250, 400);

    ctx.fillStyle = NEON_COLORS.accent;
    ctx.fillText('← → 选择 | ENTER 确认', 250, 450);
    ctx.textAlign = 'left';
  }, []);

  const drawGameOver = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 500, 500);

    const winnerColor = state.winner === 1 ? state.players[0].character.color : state.players[1].character.color;
    ctx.fillStyle = winnerColor;
    ctx.shadowColor = winnerColor;
    ctx.shadowBlur = 30;
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(state.winner === 1 ? 'PLAYER 1 胜利!' : 'PLAYER 2 胜利!', 250, 200);
    ctx.shadowBlur = 0;

    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = '18px Arial';
    ctx.fillText(`最终得分: ${state.players[0].score} - ${state.players[1].score}`, 250, 260);

    ctx.fillStyle = NEON_COLORS.accent;
    ctx.font = '14px Arial';
    ctx.fillText('按 ENTER 返回主菜单', 250, 350);
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
    } else if (state.phase === 'select') {
      drawCharacterSelect(ctx, state.selectedCharacter, characters);
    } else if (state.phase === 'fighting') {
      engine.tick(deltaTime, inputRef.current);
      const currentState = engine.getState();

      ctx.fillStyle = NEON_COLORS.background;
      ctx.fillRect(0, 0, 500, 500);

      // Arena
      ctx.fillStyle = NEON_COLORS.surface;
      ctx.fillRect(0, 430, 500, 70);
      ctx.strokeStyle = NEON_COLORS.primary;
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 430, 500, 70);

      // Power-ups
      currentState.powerUps.forEach(pu => drawPowerUp(ctx, pu));

      // Players
      drawPlayer(ctx, currentState.players[0], true);
      drawPlayer(ctx, currentState.players[1], false);

      // HUD
      drawHUD(ctx, currentState);
    } else if (state.phase === 'gameover') {
      const currentState = engine.getState();
      ctx.fillStyle = NEON_COLORS.background;
      ctx.fillRect(0, 0, 500, 500);
      drawPlayer(ctx, currentState.players[0], true);
      drawPlayer(ctx, currentState.players[1], false);
      drawGameOver(ctx, currentState);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [drawMenu, drawCharacterSelect, drawPlayer, drawPowerUp, drawHUD, drawGameOver, updateInput, characters]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
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
          engine.setPhase('select');
        } else if (state.phase === 'select') {
          engine.confirmCharacter();
        } else if (state.phase === 'gameover') {
          engine.reset();
        }
      }
    };

    const handleArrow = (e: KeyboardEvent) => {
      const state = engine.getState();
      if (state.phase === 'select') {
        if (e.key === 'ArrowLeft') {
          engine.selectCharacter((state.selectedCharacter - 1 + characters.length) % characters.length);
        } else if (e.key === 'ArrowRight') {
          engine.selectCharacter((state.selectedCharacter + 1) % characters.length);
        }
      }
    };

    window.addEventListener('keydown', handleEnter, true);
    window.addEventListener('keydown', handleArrow, true);
    return () => {
      window.removeEventListener('keydown', handleEnter, true);
      window.removeEventListener('keydown', handleArrow, true);
    };
  }, [characters.length]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className="border-2 border-purple-500 rounded-lg"
        style={{ boxShadow: `0 0 20px ${NEON_COLORS.secondary}40` }}
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

export default BrawlStars;
