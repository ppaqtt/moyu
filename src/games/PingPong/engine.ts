// PingPong Game Engine
// 乒乓球游戏引擎

export interface Vector2 {
  x: number;
  y: number;
}

export interface Ball {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  speed: number;
  maxSpeed: number;
}

export interface Paddle {
  position: Vector2;
  width: number;
  height: number;
  speed: number;
  score: number;
}

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface GameState {
  ball: Ball;
  playerPaddle: Paddle;
  aiPaddle: Paddle;
  particles: Particle[];
  gameOver: boolean;
  winner: 'player' | 'ai' | null;
  round: number;
  maxRounds: number;
  isPaused: boolean;
  ballTrail: Vector2[];
}

export type GameAction =
  | { type: 'UPDATE'; deltaTime: number }
  | { type: 'MOVE_PLAYER'; direction: number }
  | { type: 'RESET_BALL' }
  | { type: 'RESET_GAME' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'ADD_PARTICLE'; position: Vector2; color: string };

export const NEON_COLORS = {
  primary: '#00ff88',      // 绿色 - 乒乓球主题
  secondary: '#00d4ff',    // 青色
  accent: '#ff6b35',       // 橙色
  danger: '#ff3366',       // 红色
  success: '#00ff88',      // 绿色
  warning: '#ffcc00',      // 黄色
  background: '#0a0a0a',   // 深色背景
  text: '#ffffff',
  textMuted: '#888888',
  glass: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
};

const PADDLE_SPEED = 400;
const BALL_BASE_SPEED = 300;
const BALL_MAX_SPEED = 600;
const AI_REACTION_SPEED = 0.15;
const AI_PREDICTION_ERROR = 30;
const WINNING_SCORE = 11;

export function createInitialState(canvasWidth: number, canvasHeight: number): GameState {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  return {
    ball: {
      position: { x: centerX, y: centerY },
      velocity: { x: BALL_BASE_SPEED * (Math.random() > 0.5 ? 1 : -1), y: (Math.random() - 0.5) * 200 },
      radius: 8,
      speed: BALL_BASE_SPEED,
      maxSpeed: BALL_MAX_SPEED,
    },
    playerPaddle: {
      position: { x: 30, y: centerY },
      width: 12,
      height: 80,
      speed: PADDLE_SPEED,
      score: 0,
    },
    aiPaddle: {
      position: { x: canvasWidth - 42, y: centerY },
      width: 12,
      height: 80,
      speed: PADDLE_SPEED * 0.85,
      score: 0,
    },
    particles: [],
    gameOver: false,
    winner: null,
    round: 1,
    maxRounds: 3,
    isPaused: false,
    ballTrail: [],
  };
}

function createParticle(position: Vector2, velocity: Vector2, color: string): Particle {
  return {
    position: { ...position },
    velocity: { ...velocity },
    life: 1.0,
    maxLife: 1.0,
    size: Math.random() * 4 + 2,
    color,
  };
}

function updateParticles(particles: Particle[], deltaTime: number): Particle[] {
  return particles
    .map((p) => ({
      ...p,
      position: {
        x: p.position.x + p.velocity.x * deltaTime,
        y: p.position.y + p.velocity.y * deltaTime,
      },
      life: p.life - deltaTime * 2,
    }))
    .filter((p) => p.life > 0);
}

function checkPaddleCollision(ball: Ball, paddle: Paddle): boolean {
  const paddleLeft = paddle.position.x - paddle.width / 2;
  const paddleRight = paddle.position.x + paddle.width / 2;
  const paddleTop = paddle.position.y - paddle.height / 2;
  const paddleBottom = paddle.position.y + paddle.height / 2;

  const ballLeft = ball.position.x - ball.radius;
  const ballRight = ball.position.x + ball.radius;
  const ballTop = ball.position.y - ball.radius;
  const ballBottom = ball.position.y + ball.radius;

  return (
    ballRight >= paddleLeft &&
    ballLeft <= paddleRight &&
    ballBottom >= paddleTop &&
    ballTop <= paddleBottom
  );
}

function updateAI(aiPaddle: Paddle, ball: Ball, canvasHeight: number, deltaTime: number): Paddle {
  // AI prediction with some error
  let targetY = ball.position.y;
  
  // Add prediction error based on ball speed
  const predictionError = (Math.random() - 0.5) * AI_PREDICTION_ERROR * (ball.speed / BALL_BASE_SPEED);
  targetY += predictionError;

  // Limit target to paddle bounds
  const halfHeight = aiPaddle.height / 2;
  targetY = Math.max(halfHeight, Math.min(canvasHeight - halfHeight, targetY));

  // Smooth movement with reaction delay
  const diff = targetY - aiPaddle.position.y;
  const moveAmount = diff * AI_REACTION_SPEED;

  // Limit movement speed
  const maxMove = aiPaddle.speed * deltaTime;
  const clampedMove = Math.max(-maxMove, Math.min(maxMove, moveAmount));

  return {
    ...aiPaddle,
    position: {
      ...aiPaddle.position,
      y: Math.max(halfHeight, Math.min(canvasHeight - halfHeight, aiPaddle.position.y + clampedMove)),
    },
  };
}

export function pingpongReducer(
  state: GameState,
  action: GameAction,
  canvasWidth: number,
  canvasHeight: number
): GameState {
  switch (action.type) {
    case 'UPDATE': {
      if (state.isPaused || state.gameOver) return state;

      const deltaTime = action.deltaTime;
      let newState = { ...state };

      // Update ball position
      const newBall = { ...newState.ball };
      newBall.position.x += newBall.velocity.x * deltaTime;
      newBall.position.y += newBall.velocity.y * deltaTime;

      // Update ball trail
      let newTrail = [...newState.ballTrail, { ...newBall.position }];
      if (newTrail.length > 10) {
        newTrail = newTrail.slice(newTrail.length - 10);
      }

      // Ball collision with top/bottom walls
      if (newBall.position.y - newBall.radius <= 0) {
        newBall.position.y = newBall.radius;
        newBall.velocity.y = Math.abs(newBall.velocity.y);
        // Create particles
        for (let i = 0; i < 5; i++) {
          newState.particles.push(
            createParticle(
              { x: newBall.position.x, y: 0 },
              { x: (Math.random() - 0.5) * 200, y: Math.random() * 100 },
              NEON_COLORS.secondary
            )
          );
        }
      } else if (newBall.position.y + newBall.radius >= canvasHeight) {
        newBall.position.y = canvasHeight - newBall.radius;
        newBall.velocity.y = -Math.abs(newBall.velocity.y);
        for (let i = 0; i < 5; i++) {
          newState.particles.push(
            createParticle(
              { x: newBall.position.x, y: canvasHeight },
              { x: (Math.random() - 0.5) * 200, y: -Math.random() * 100 },
              NEON_COLORS.secondary
            )
          );
        }
      }

      // Ball collision with player paddle
      if (checkPaddleCollision(newBall, newState.playerPaddle) && newBall.velocity.x < 0) {
        const paddle = newState.playerPaddle;
        const relativeIntersectY = (paddle.position.y - newBall.position.y) / (paddle.height / 2);
        const bounceAngle = relativeIntersectY * (Math.PI / 3); // Max 60 degrees

        newBall.speed = Math.min(newBall.speed * 1.05, newBall.maxSpeed);
        newBall.velocity.x = Math.abs(newBall.speed * Math.cos(bounceAngle));
        newBall.velocity.y = -newBall.speed * Math.sin(bounceAngle);

        // Push ball out of paddle
        newBall.position.x = paddle.position.x + paddle.width / 2 + newBall.radius;

        // Create hit particles
        for (let i = 0; i < 8; i++) {
          newState.particles.push(
            createParticle(
              { x: newBall.position.x, y: newBall.position.y },
              { x: Math.random() * 100 + 50, y: (Math.random() - 0.5) * 200 },
              NEON_COLORS.primary
            )
          );
        }
      }

      // Ball collision with AI paddle
      if (checkPaddleCollision(newBall, newState.aiPaddle) && newBall.velocity.x > 0) {
        const paddle = newState.aiPaddle;
        const relativeIntersectY = (paddle.position.y - newBall.position.y) / (paddle.height / 2);
        const bounceAngle = relativeIntersectY * (Math.PI / 3);

        newBall.speed = Math.min(newBall.speed * 1.05, newBall.maxSpeed);
        newBall.velocity.x = -Math.abs(newBall.speed * Math.cos(bounceAngle));
        newBall.velocity.y = -newBall.speed * Math.sin(bounceAngle);

        // Push ball out of paddle
        newBall.position.x = paddle.position.x - paddle.width / 2 - newBall.radius;

        // Create hit particles
        for (let i = 0; i < 8; i++) {
          newState.particles.push(
            createParticle(
              { x: newBall.position.x, y: newBall.position.y },
              { x: -Math.random() * 100 - 50, y: (Math.random() - 0.5) * 200 },
              NEON_COLORS.accent
            )
          );
        }
      }

      // Check scoring
      let playerScore = newState.playerPaddle.score;
      let aiScore = newState.aiPaddle.score;
      let gameOver = false;
      let winner: 'player' | 'ai' | null = null;

      if (newBall.position.x < 0) {
        // AI scores
        aiScore++;
        if (aiScore >= WINNING_SCORE) {
          gameOver = true;
          winner = 'ai';
        }
        // Reset ball
        newBall.position = { x: canvasWidth / 2, y: canvasHeight / 2 };
        newBall.speed = BALL_BASE_SPEED;
        newBall.velocity = {
          x: -BALL_BASE_SPEED,
          y: (Math.random() - 0.5) * 200,
        };
        newTrail = [];
      } else if (newBall.position.x > canvasWidth) {
        // Player scores
        playerScore++;
        if (playerScore >= WINNING_SCORE) {
          gameOver = true;
          winner = 'player';
        }
        // Reset ball
        newBall.position = { x: canvasWidth / 2, y: canvasHeight / 2 };
        newBall.speed = BALL_BASE_SPEED;
        newBall.velocity = {
          x: BALL_BASE_SPEED,
          y: (Math.random() - 0.5) * 200,
        };
        newTrail = [];
      }

      // Update AI paddle
      const newAiPaddle = updateAI(newState.aiPaddle, newBall, canvasHeight, deltaTime);

      // Update particles
      const newParticles = updateParticles(newState.particles, deltaTime);

      return {
        ...newState,
        ball: newBall,
        ballTrail: newTrail,
        aiPaddle: { ...newAiPaddle, score: aiScore },
        playerPaddle: { ...newState.playerPaddle, score: playerScore },
        particles: newParticles,
        gameOver,
        winner,
      };
    }

    case 'MOVE_PLAYER': {
      const moveAmount = state.playerPaddle.speed * action.direction * 0.016; // Approximate for 60fps
      const halfHeight = state.playerPaddle.height / 2;
      const newY = Math.max(
        halfHeight,
        Math.min(canvasHeight - halfHeight, state.playerPaddle.position.y + moveAmount)
      );
      return {
        ...state,
        playerPaddle: {
          ...state.playerPaddle,
          position: { ...state.playerPaddle.position, y: newY },
        },
      };
    }

    case 'RESET_BALL': {
      return {
        ...state,
        ball: {
          ...state.ball,
          position: { x: canvasWidth / 2, y: canvasHeight / 2 },
          speed: BALL_BASE_SPEED,
          velocity: {
            x: BALL_BASE_SPEED * (Math.random() > 0.5 ? 1 : -1),
            y: (Math.random() - 0.5) * 200,
          },
        },
        ballTrail: [],
      };
    }

    case 'RESET_GAME': {
      return createInitialState(canvasWidth, canvasHeight);
    }

    case 'PAUSE': {
      return { ...state, isPaused: true };
    }

    case 'RESUME': {
      return { ...state, isPaused: false };
    }

    case 'ADD_PARTICLE': {
      return {
        ...state,
        particles: [
          ...state.particles,
          createParticle(
            action.position,
            { x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200 },
            action.color
          ),
        ],
      };
    }

    default:
      return state;
  }
}

// Local storage functions
export function getHighScore(): number {
  if (typeof window === 'undefined') return 0;
  const saved = localStorage.getItem('pingpong_highscore');
  return saved ? parseInt(saved, 10) : 0;
}

export function saveHighScore(score: number): void {
  if (typeof window === 'undefined') return;
  const current = getHighScore();
  if (score > current) {
    localStorage.setItem('pingpong_highscore', score.toString());
  }
}
