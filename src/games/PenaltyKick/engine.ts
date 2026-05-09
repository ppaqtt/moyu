// PenaltyKick Game Engine
// 点球大战游戏引擎

export const NEON_COLORS = {
  primary: '#00f5ff',
  secondary: '#ff00ff',
  accent: '#ffff00',
  success: '#00ff88',
  danger: '#ff3366',
  warning: '#ffaa00',
  background: '#0a0a1a',
  glass: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
  text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.7)',
} as const;

export interface Vector2 {
  x: number;
  y: number;
}

export interface Ball {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  rotation: number;
  rotationSpeed: number;
}

export interface Goalkeeper {
  position: Vector2;
  width: number;
  height: number;
  velocity: number;
  direction: number;
  reactionDelay: number;
  reactionTimer: number;
}

export interface Goal {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GameState {
  ball: Ball;
  goalkeeper: Goalkeeper;
  goal: Goal;
  particles: Particle[];
  score: number;
  attempts: number;
  maxAttempts: number;
  isShooting: boolean;
  isGoal: boolean | null;
  gameOver: boolean;
  power: number;
  aimAngle: number;
  difficulty: number;
}

export type GameAction =
  | { type: 'AIM'; angle: number }
  | { type: 'CHARGE_POWER' }
  | { type: 'SHOOT' }
  | { type: 'RESET' }
  | { type: 'UPDATE'; deltaTime: number }
  | { type: 'SET_DIFFICULTY'; level: number };

const GOAL_WIDTH = 200;
const GOAL_HEIGHT = 100;
const BALL_RADIUS = 10;
const GOALKEEPER_WIDTH = 40;
const GOALKEEPER_HEIGHT = 60;
const GRAVITY = 500;
const AIR_RESISTANCE = 0.995;

export function createInitialState(canvasWidth: number, canvasHeight: number): GameState {
  const goalX = (canvasWidth - GOAL_WIDTH) / 2;
  const goalY = 80;

  return {
    ball: {
      position: { x: canvasWidth / 2, y: canvasHeight - 100 },
      velocity: { x: 0, y: 0 },
      radius: BALL_RADIUS,
      rotation: 0,
      rotationSpeed: 0,
    },
    goalkeeper: {
      position: { x: canvasWidth / 2, y: goalY + GOAL_HEIGHT - GOALKEEPER_HEIGHT },
      width: GOALKEEPER_WIDTH,
      height: GOALKEEPER_HEIGHT,
      velocity: 150,
      direction: 1,
      reactionDelay: 0.3,
      reactionTimer: 0,
    },
    goal: {
      x: goalX,
      y: goalY,
      width: GOAL_WIDTH,
      height: GOAL_HEIGHT,
    },
    particles: [],
    score: 0,
    attempts: 0,
    maxAttempts: 5,
    isShooting: false,
    isGoal: null,
    gameOver: false,
    power: 0,
    aimAngle: -Math.PI / 2,
    difficulty: 1,
  };
}

function createParticles(position: Vector2, color: string, count: number = 10): Particle[] {
  return Array.from({ length: count }, () => ({
    position: { ...position },
    velocity: {
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
    },
    life: 1,
    maxLife: 0.5 + Math.random() * 0.5,
    color,
    size: 2 + Math.random() * 4,
  }));
}

function updateParticles(particles: Particle[], deltaTime: number): Particle[] {
  return particles
    .map((p) => ({
      ...p,
      position: {
        x: p.position.x + p.velocity.x * deltaTime,
        y: p.position.y + p.velocity.y * deltaTime,
      },
      velocity: {
        x: p.velocity.x * 0.98,
        y: p.velocity.y * 0.98 + 50 * deltaTime,
      },
      life: p.life - deltaTime / p.maxLife,
    }))
    .filter((p) => p.life > 0);
}

function checkBallGoalCollision(ball: Ball, goal: Goal): boolean {
  return (
    ball.position.x > goal.x &&
    ball.position.x < goal.x + goal.width &&
    ball.position.y > goal.y &&
    ball.position.y < goal.y + goal.height
  );
}

function checkBallGoalkeeperCollision(ball: Ball, keeper: Goalkeeper): boolean {
  const dx = ball.position.x - Math.max(keeper.position.x - keeper.width / 2, Math.min(ball.position.x, keeper.position.x + keeper.width / 2));
  const dy = ball.position.y - Math.max(keeper.position.y, Math.min(ball.position.y, keeper.position.y + keeper.height));
  return Math.sqrt(dx * dx + dy * dy) < ball.radius;
}

function updateGoalkeeperAI(state: GameState, deltaTime: number): Goalkeeper {
  const { goalkeeper, ball, isShooting, difficulty } = state;
  let newKeeper = { ...goalkeeper };

  if (isShooting) {
    // AI reaction delay
    newKeeper.reactionTimer += deltaTime;
    if (newKeeper.reactionTimer >= newKeeper.reactionDelay / difficulty) {
      // Move towards ball x position
      const targetX = ball.position.x;
      const dx = targetX - newKeeper.position.x;
      const moveSpeed = newKeeper.velocity * difficulty * deltaTime;

      if (Math.abs(dx) > moveSpeed) {
        newKeeper.position.x += Math.sign(dx) * moveSpeed;
      }
    }
  } else {
    // Idle movement
    newKeeper.reactionTimer = 0;
    newKeeper.position.x += newKeeper.velocity * newKeeper.direction * deltaTime;

    const leftBound = state.goal.x + newKeeper.width / 2;
    const rightBound = state.goal.x + state.goal.width - newKeeper.width / 2;

    if (newKeeper.position.x <= leftBound || newKeeper.position.x >= rightBound) {
      newKeeper.direction *= -1;
      newKeeper.position.x = Math.max(leftBound, Math.min(rightBound, newKeeper.position.x));
    }
  }

  return newKeeper;
}

export function penaltyKickReducer(state: GameState, action: GameAction, canvasWidth: number, canvasHeight: number): GameState {
  switch (action.type) {
    case 'AIM': {
      if (state.isShooting || state.gameOver) return state;
      return {
        ...state,
        aimAngle: Math.max(-Math.PI * 0.8, Math.min(-Math.PI * 0.2, action.angle)),
      };
    }

    case 'CHARGE_POWER': {
      if (state.isShooting || state.gameOver) return state;
      return {
        ...state,
        power: Math.min(1, state.power + 0.02),
      };
    }

    case 'SHOOT': {
      if (state.isShooting || state.gameOver || state.power < 0.1) return state;

      const powerMultiplier = 400 + state.power * 400;
      const velocity = {
        x: Math.cos(state.aimAngle) * powerMultiplier,
        y: Math.sin(state.aimAngle) * powerMultiplier,
      };

      return {
        ...state,
        ball: {
          ...state.ball,
          velocity,
          rotationSpeed: velocity.x * 0.01,
        },
        isShooting: true,
        attempts: state.attempts + 1,
      };
    }

    case 'UPDATE': {
      const { deltaTime } = action;
      let newState = { ...state };

      // Update particles
      newState.particles = updateParticles(state.particles, deltaTime);

      if (!state.isShooting) {
        // Update goalkeeper idle movement
        newState.goalkeeper = updateGoalkeeperAI(state, deltaTime);
        return newState;
      }

      // Update ball physics
      const newBall = { ...state.ball };
      newBall.velocity.y += GRAVITY * deltaTime;
      newBall.velocity.x *= AIR_RESISTANCE;
      newBall.velocity.y *= AIR_RESISTANCE;
      newBall.position.x += newBall.velocity.x * deltaTime;
      newBall.position.y += newBall.velocity.y * deltaTime;
      newBall.rotation += newBall.rotationSpeed * deltaTime;

      newState.ball = newBall;

      // Update goalkeeper AI
      newState.goalkeeper = updateGoalkeeperAI(newState, deltaTime);

      // Check collisions
      if (checkBallGoalkeeperCollision(newBall, newState.goalkeeper)) {
        // Ball hit goalkeeper
        newBall.velocity.x *= -0.5;
        newBall.velocity.y *= -0.3;
        newState.particles.push(...createParticles(newBall.position, NEON_COLORS.danger, 15));
      }

      // Check goal
      if (checkBallGoalCollision(newBall, state.goal)) {
        if (state.isGoal === null) {
          newState.isGoal = true;
          newState.score += 1;
          newState.particles.push(...createParticles(newBall.position, NEON_COLORS.success, 20));
        }
      }

      // Check if ball is out of bounds or stopped
      const isOutOfBounds =
        newBall.position.x < 0 ||
        newBall.position.x > canvasWidth ||
        newBall.position.y > canvasHeight;
      const isStopped = Math.abs(newBall.velocity.x) < 10 && Math.abs(newBall.velocity.y) < 10 && newBall.position.y > canvasHeight - 50;

      if ((isOutOfBounds || isStopped) && !newState.gameOver) {
        if (state.isGoal === null) {
          newState.isGoal = false;
        }

        if (newState.attempts >= newState.maxAttempts) {
          newState.gameOver = true;
        }
      }

      return newState;
    }

    case 'RESET': {
      const fresh = createInitialState(canvasWidth, canvasHeight);
      return {
        ...fresh,
        score: state.gameOver ? 0 : state.score,
        attempts: state.gameOver ? 0 : state.attempts,
        maxAttempts: state.maxAttempts,
        difficulty: state.difficulty,
        gameOver: false,
        isGoal: null,
      };
    }

    case 'SET_DIFFICULTY': {
      return {
        ...state,
        difficulty: 0.5 + action.level * 0.5,
      };
    }

    default:
      return state;
  }
}

export function getHighScore(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem('penaltyKick_highScore') || '0', 10);
}

export function saveHighScore(score: number): void {
  if (typeof window === 'undefined') return;
  const current = getHighScore();
  if (score > current) {
    localStorage.setItem('penaltyKick_highScore', score.toString());
  }
}
