import { NEON_COLORS } from '../../utils/constants';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Ball {
  position: Vector2;
  velocity: Vector2;
  radius: number;
}

export interface Paddle {
  y: number;
  height: number;
  width: number;
  speed: number;
}

export interface GameState {
  ball: Ball;
  playerPaddle: Paddle;
  cpuPaddle: Paddle;
  playerScore: number;
  cpuScore: number;
  gameOver: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export type GameAction =
  | { type: 'UPDATE' }
  | { type: 'MOVE_PLAYER'; direction: 'up' | 'down' }
  | { type: 'RESET' }
  | { type: 'SET_DIFFICULTY'; difficulty: 'easy' | 'medium' | 'hard' };

export const CANVAS_WIDTH = 700;
export const CANVAS_HEIGHT = 400;
export const BALL_RADIUS = 10;
export const PADDLE_WIDTH = 15;
export const PADDLE_HEIGHT = 100;
export const BALL_SPEED = 7;
export const PADDLE_SPEED = 8;

export function createInitialState(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): GameState {
  return {
    ball: {
      position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      velocity: { x: BALL_SPEED, y: BALL_SPEED * (Math.random() - 0.5) },
      radius: BALL_RADIUS,
    },
    playerPaddle: {
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      height: PADDLE_HEIGHT,
      width: PADDLE_WIDTH,
      speed: PADDLE_SPEED,
    },
    cpuPaddle: {
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      height: PADDLE_HEIGHT,
      width: PADDLE_WIDTH,
      speed: PADDLE_SPEED,
    },
    playerScore: 0,
    cpuScore: 0,
    gameOver: false,
    difficulty,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'UPDATE':
      return state;
    case 'MOVE_PLAYER':
      return state;
    case 'RESET':
      return createInitialState(state.difficulty);
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.difficulty };
    default:
      return state;
  }
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState
): void {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH / 2, 0);
  ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = NEON_COLORS.neonCyan;
  ctx.fillRect(0, state.playerPaddle.y, state.playerPaddle.width, state.playerPaddle.height);

  ctx.fillStyle = NEON_COLORS.neonPink;
  ctx.fillRect(
    CANVAS_WIDTH - state.cpuPaddle.width,
    state.cpuPaddle.y,
    state.cpuPaddle.width,
    state.cpuPaddle.height
  );

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(state.ball.position.x, state.ball.position.y, state.ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(state.playerScore.toString(), CANVAS_WIDTH / 4, 60);
  ctx.fillText(state.cpuScore.toString(), (CANVAS_WIDTH * 3) / 4, 60);
  ctx.textAlign = 'left';
}
