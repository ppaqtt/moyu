// BasketballShoot Game Engine
// 投篮高手游戏引擎

export const NEON_COLORS = {
  primary: '#ff6b35',
  secondary: '#f7931e',
  accent: '#00d4ff',
  success: '#00ff88',
  danger: '#ff3366',
  warning: '#ffaa00',
  background: '#1a0a2e',
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
  isHeld: boolean;
  trail: Vector2[];
}

export interface Hoop {
  position: Vector2;
  rimWidth: number;
  rimHeight: number;
  backboardWidth: number;
  backboardHeight: number;
  netLength: number;
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
  hoop: Hoop;
  particles: Particle[];
  score: number;
  attempts: number;
  maxAttempts: number;
  isShooting: boolean;
  shotMade: boolean | null;
  gameOver: boolean;
  power: number;
  aimAngle: number;
  wind: number;
  streak: number;
  bestStreak: number;
}

export type GameAction =
  | { type: 'AIM'; angle: number }
  | { type: 'CHARGE_POWER' }
  | { type: 'SHOOT' }
  | { type: 'RESET' }
  | { type: 'UPDATE'; deltaTime: number }
  | { type: 'SET_BALL_POSITION'; position: Vector2 }
  | { type: 'GRAB_BALL' }
  | { type: 'RELEASE_BALL' };

const BALL_RADIUS = 15;
const RIM_WIDTH = 80;
const RIM_HEIGHT = 5;
const BACKBOARD_WIDTH = 10;
const BACKBOARD_HEIGHT = 100;
const NET_LENGTH = 60;
const GRAVITY = 600;
const AIR_RESISTANCE = 0.998;
const BOUNCE_DAMPING = 0.7;

export function createInitialState(canvasWidth: number, canvasHeight: number): GameState {
  const hoopX = canvasWidth - 150;
  const hoopY = canvasHeight / 2 - 50;

  return {
    ball: {
      position: { x: 100, y: canvasHeight - 150 },
      velocity: { x: 0, y: 0 },
      radius: BALL_RADIUS,
      rotation: 0,
      rotationSpeed: 0,
      isHeld: true,
      trail: [],
    },
    hoop: {
      position: { x: hoopX, y: hoopY },
      rimWidth: RIM_WIDTH,
      rimHeight: RIM_HEIGHT,
      backboardWidth: BACKBOARD_WIDTH,
      backboardHeight: BACKBOARD_HEIGHT,
      netLength: NET_LENGTH,
    },
    particles: [],
    score: 0,
    attempts: 0,
    maxAttempts: 10,
    isShooting: false,
    shotMade: null,
    gameOver: false,
    power: 0,
    aimAngle: -Math.PI / 4,
    wind: (Math.random() - 0.5) * 100,
    streak: 0,
    bestStreak: 0,
  };
}

function createParticles(position: Vector2, color: string, count: number = 15): Particle[] {
  return Array.from({ length: count }, () => ({
    position: { ...position },
    velocity: {
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300 - 100,
    },
    life: 1,
    maxLife: 0.8 + Math.random() * 0.7,
    color,
    size: 3 + Math.random() * 5,
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
        x: p.velocity.x * 0.97,
        y: p.velocity.y * 0.97 + 80 * deltaTime,
      },
      life: p.life - deltaTime / p.maxLife,
    }))
    .filter((p) => p.life > 0);
}

function checkBallRimCollision(ball: Ball, hoop: Hoop): { hit: boolean; point: Vector2 | null } {
  // Check collision with rim (left edge)
  const rimLeft = hoop.position.x - hoop.rimWidth / 2;
  const rimY = hoop.position.y;

  const dx = ball.position.x - rimLeft;
  const dy = ball.position.y - rimY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < ball.radius + hoop.rimHeight / 2) {
    return { hit: true, point: { x: rimLeft, y: rimY } };
  }

  // Check collision with rim (right edge)
  const rimRight = hoop.position.x + hoop.rimWidth / 2;
  const dx2 = ball.position.x - rimRight;
  const dist2 = Math.sqrt(dx2 * dx2 + dy * dy);

  if (dist2 < ball.radius + hoop.rimHeight / 2) {
    return { hit: true, point: { x: rimRight, y: rimY } };
  }

  return { hit: false, point: null };
}

function checkBallBackboardCollision(ball: Ball, hoop: Hoop): boolean {
  const backboardX = hoop.position.x + hoop.rimWidth / 2;
  const backboardTop = hoop.position.y - hoop.backboardHeight / 2;
  const backboardBottom = hoop.position.y + hoop.backboardHeight / 2;

  return (
    ball.position.x + ball.radius > backboardX - hoop.backboardWidth &&
    ball.position.x - ball.radius < backboardX &&
    ball.position.y > backboardTop &&
    ball.position.y < backboardBottom
  );
}

function checkBallThroughHoop(ball: Ball, hoop: Hoop, prevY: number): boolean {
  const rimLeft = hoop.position.x - hoop.rimWidth / 2 + ball.radius;
  const rimRight = hoop.position.x + hoop.rimWidth / 2 - ball.radius;
  const rimY = hoop.position.y;

  // Ball must pass through the rim from top to bottom
  return (
    prevY < rimY &&
    ball.position.y >= rimY &&
    ball.position.x > rimLeft &&
    ball.position.x < rimRight &&
    ball.velocity.y > 0
  );
}

export function basketballReducer(state: GameState, action: GameAction, canvasWidth: number, canvasHeight: number): GameState {
  switch (action.type) {
    case 'AIM': {
      if (state.isShooting || state.gameOver || !state.ball.isHeld) return state;
      return {
        ...state,
        aimAngle: Math.max(-Math.PI * 0.9, Math.min(-Math.PI * 0.1, action.angle)),
      };
    }

    case 'CHARGE_POWER': {
      if (state.isShooting || state.gameOver || !state.ball.isHeld) return state;
      return {
        ...state,
        power: Math.min(1, state.power + 0.015),
      };
    }

    case 'SHOOT': {
      if (state.isShooting || state.gameOver || !state.ball.isHeld || state.power < 0.1) return state;

      const powerMultiplier = 300 + state.power * 500;
      const velocity = {
        x: Math.cos(state.aimAngle) * powerMultiplier,
        y: Math.sin(state.aimAngle) * powerMultiplier,
      };

      return {
        ...state,
        ball: {
          ...state.ball,
          velocity,
          rotationSpeed: velocity.x * 0.02,
          isHeld: false,
          trail: [],
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

      // Update ball
      const newBall = { ...state.ball };

      if (!state.ball.isHeld) {
        const prevY = newBall.position.y;

        // Apply physics
        newBall.velocity.y += GRAVITY * deltaTime;
        newBall.velocity.x += state.wind * deltaTime * 0.1;
        newBall.velocity.x *= AIR_RESISTANCE;
        newBall.velocity.y *= AIR_RESISTANCE;

        newBall.position.x += newBall.velocity.x * deltaTime;
        newBall.position.y += newBall.velocity.y * deltaTime;
        newBall.rotation += newBall.rotationSpeed * deltaTime;

        // Update trail
        newBall.trail.push({ ...newBall.position });
        if (newBall.trail.length > 15) {
          newBall.trail.shift();
        }

        // Check rim collision
        const rimCollision = checkBallRimCollision(newBall, state.hoop);
        if (rimCollision.hit && rimCollision.point) {
          const dx = newBall.position.x - rimCollision.point.x;
          const dy = newBall.position.y - rimCollision.point.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Bounce off rim
          const normalX = dx / dist;
          const normalY = dy / dist;

          const dotProduct = newBall.velocity.x * normalX + newBall.velocity.y * normalY;

          newBall.velocity.x = (newBall.velocity.x - 2 * dotProduct * normalX) * BOUNCE_DAMPING;
          newBall.velocity.y = (newBall.velocity.y - 2 * dotProduct * normalY) * BOUNCE_DAMPING;

          // Push ball out of collision
          const overlap = newBall.radius + state.hoop.rimHeight / 2 - dist;
          newBall.position.x += normalX * overlap;
          newBall.position.y += normalY * overlap;

          newState.particles.push(...createParticles(rimCollision.point, NEON_COLORS.warning, 8));
        }

        // Check backboard collision
        if (checkBallBackboardCollision(newBall, state.hoop)) {
          newBall.velocity.x *= -BOUNCE_DAMPING;
          newBall.position.x = state.hoop.position.x + state.hoop.rimWidth / 2 - newBall.radius - state.hoop.backboardWidth;
          newState.particles.push(...createParticles(newBall.position, NEON_COLORS.warning, 5));
        }

        // Check if ball went through hoop
        if (checkBallThroughHoop(newBall, state.hoop, prevY)) {
          if (state.shotMade === null) {
            newState.shotMade = true;
            newState.score += 1;
            newState.streak += 1;
            newState.bestStreak = Math.max(newState.bestStreak, newState.streak);
            newState.particles.push(...createParticles(newBall.position, NEON_COLORS.success, 25));
          }
        }

        // Floor collision
        if (newBall.position.y + newBall.radius > canvasHeight - 30) {
          newBall.position.y = canvasHeight - 30 - newBall.radius;
          newBall.velocity.y *= -BOUNCE_DAMPING;
          newBall.velocity.x *= 0.95;

          if (Math.abs(newBall.velocity.y) < 50) {
            newBall.velocity.y = 0;
          }
        }

        // Wall collisions
        if (newBall.position.x - newBall.radius < 0) {
          newBall.position.x = newBall.radius;
          newBall.velocity.x *= -BOUNCE_DAMPING;
        }
        if (newBall.position.x + newBall.radius > canvasWidth) {
          newBall.position.x = canvasWidth - newBall.radius;
          newBall.velocity.x *= -BOUNCE_DAMPING;
        }

        // Check if shot ended
        const isStopped = Math.abs(newBall.velocity.x) < 10 && Math.abs(newBall.velocity.y) < 10 && newBall.position.y > canvasHeight - 100;
        const isOutOfBounds = newBall.position.x < 0 || newBall.position.x > canvasWidth || newBall.position.y > canvasHeight;

        if ((isStopped || isOutOfBounds) && !newState.gameOver) {
          if (state.shotMade === null) {
            newState.shotMade = false;
            newState.streak = 0;
          }

          if (newState.attempts >= newState.maxAttempts) {
            newState.gameOver = true;
          }
        }

        newState.ball = newBall;
      }

      return newState;
    }

    case 'SET_BALL_POSITION': {
      if (!state.ball.isHeld || state.isShooting) return state;
      return {
        ...state,
        ball: {
          ...state.ball,
          position: action.position,
        },
      };
    }

    case 'GRAB_BALL': {
      if (state.isShooting) return state;
      return {
        ...state,
        ball: {
          ...state.ball,
          isHeld: true,
          velocity: { x: 0, y: 0 },
          trail: [],
        },
        power: 0,
      };
    }

    case 'RELEASE_BALL': {
      return {
        ...state,
        ball: {
          ...state.ball,
          isHeld: false,
        },
      };
    }

    case 'RESET': {
      const fresh = createInitialState(canvasWidth, canvasHeight);
      const wasGameOver = state.gameOver;
      return {
        ...fresh,
        score: wasGameOver ? 0 : state.score,
        attempts: wasGameOver ? 0 : state.attempts,
        maxAttempts: state.maxAttempts,
        bestStreak: wasGameOver ? 0 : state.bestStreak,
        gameOver: false,
        shotMade: null,
        wind: (Math.random() - 0.5) * 100,
      };
    }

    default:
      return state;
  }
}

export function getHighScore(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem('basketball_highScore') || '0', 10);
}

export function saveHighScore(score: number): void {
  if (typeof window === 'undefined') return;
  const current = getHighScore();
  if (score > current) {
    localStorage.setItem('basketball_highScore', score.toString());
  }
}
