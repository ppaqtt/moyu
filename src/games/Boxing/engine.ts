import { NEON_COLORS } from '../../utils/constants';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Fighter {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  isAttacking: boolean;
  attackFrame: number;
}

export interface GameState {
  player: Fighter;
  cpu: Fighter;
  gameOver: boolean;
  winner: 'player' | 'cpu' | null;
  round: number;
  roundTime: number;
}

export type GameAction =
  | { type: 'UPDATE' }
  | { type: 'PLAYER_ATTACK' }
  | { type: 'RESET' };

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 500;
export const GROUND_Y = 400;
export const FIGHT_WIDTH = 100;
export const FIGHT_HEIGHT = 150;

export function createInitialState(): GameState {
  return {
    player: {
      x: 100,
      y: GROUND_Y - FIGHT_HEIGHT,
      width: FIGHT_WIDTH,
      height: FIGHT_HEIGHT,
      health: 100,
      maxHealth: 100,
      isAttacking: false,
      attackFrame: 0,
    },
    cpu: {
      x: CANVAS_WIDTH - 200,
      y: GROUND_Y - FIGHT_HEIGHT,
      width: FIGHT_WIDTH,
      height: FIGHT_HEIGHT,
      health: 100,
      maxHealth: 100,
      isAttacking: false,
      attackFrame: 0,
    },
    gameOver: false,
    winner: null,
    round: 1,
    roundTime: 99,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'UPDATE':
      return state;
    case 'PLAYER_ATTACK':
      return state;
    case 'RESET':
      return createInitialState();
    default:
      return state;
  }
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState
): void {
  ctx.fillStyle = '#2c1810';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#4a2c1a';
  ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
  ctx.stroke();

  const drawHealthBar = (x: number, y: number, health: number, maxHealth: number, color: string) => {
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, 200, 25);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, (health / maxHealth) * 200, 25);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 200, 25);
  };

  drawHealthBar(20, 20, state.player.health, state.player.maxHealth, NEON_COLORS.neonCyan);
  drawHealthBar(CANVAS_WIDTH - 220, 20, state.cpu.health, state.cpu.maxHealth, NEON_COLORS.neonPink);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('玩家', 20, 60);
  ctx.fillText('CPU', CANVAS_WIDTH - 220, 60);

  const drawFighter = (fighter: Fighter, facingRight: boolean) => {
    const baseColor = facingRight ? NEON_COLORS.neonCyan : NEON_COLORS.neonPink;

    ctx.fillStyle = baseColor;
    ctx.fillRect(fighter.x, fighter.y, fighter.width, fighter.height);

    ctx.fillStyle = '#fff';
    const headY = fighter.y - 30;
    ctx.beginPath();
    ctx.arc(fighter.x + fighter.width / 2, headY, 20, 0, Math.PI * 2);
    ctx.fill();

    if (fighter.isAttacking) {
      ctx.fillStyle = '#fff';
      const armX = facingRight ? fighter.x + fighter.width : fighter.x - 30;
      ctx.fillRect(armX, fighter.y + 40, 30, 15);
    }

    ctx.fillStyle = baseColor;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${Math.round(fighter.health)}/${fighter.maxHealth}`,
      fighter.x + fighter.width / 2,
      fighter.y - 40
    );
    ctx.textAlign = 'left';
  };

  drawFighter(state.player, true);
  drawFighter(state.cpu, false);
}
