import { NEON_COLORS } from '../../utils/constants';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BASE_SPEED = 4;
const BOOST_SPEED = 8;
const SNAKE_RADIUS = 8;
const FOOD_RADIUS = 5;
const INITIAL_LENGTH = 10;
const AI_COUNT = 15;

export interface Position {
  x: number;
  y: number;
}

export interface SnakeSegment extends Position {
  radius: number;
}

export interface Food extends Position {
  color: string;
  value: number;
  radius: number;
}

export interface AISnake {
  id: number;
  segments: SnakeSegment[];
  color: string;
  name: string;
  angle: number;
  speed: number;
  isDead: boolean;
  targetAngle: number;
  changeDirTimer: number;
}

export interface PlayerSnake {
  segments: SnakeSegment[];
  color: string;
  name: string;
  angle: number;
  speed: number;
  isDead: boolean;
  boost: boolean;
  score: number;
}

export interface SnakeGameState {
  player: PlayerSnake;
  aiSnakes: AISnake[];
  foods: Food[];
  particles: Particle[];
  camera: Position;
  gameOver: boolean;
  rank: number;
}

export interface Particle extends Position {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const AI_NAMES = ['小蛇', '贪吃蛇', '闪电', '毒蛇', '青龙', '赤蛇', '白蛇', '黑蛇', '金蛇', '银蛇', '火蛇', '冰蛇', '雷蛇', '风蛇', '土蛇'];

export class SnakeIOEngine {
  private player: PlayerSnake;
  private aiSnakes: AISnake[];
  private foods: Food[];
  private particles: Particle[];
  private camera: Position;
  private gameOver: boolean;
  private mousePos: Position;
  private foodSpawnTimer: number;
  private rank: number;

  constructor() {
    this.player = {
      segments: [],
      color: NEON_COLORS.neonCyan,
      name: '玩家',
      angle: 0,
      speed: BASE_SPEED,
      isDead: false,
      boost: false,
      score: 0
    };
    this.aiSnakes = [];
    this.foods = [];
    this.particles = [];
    this.camera = { x: 0, y: 0 };
    this.gameOver = false;
    this.mousePos = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    this.foodSpawnTimer = 0;
    this.rank = 1;
    this.init();
  }

  init(): void {
    const startX = CANVAS_WIDTH / 2;
    const startY = CANVAS_HEIGHT / 2;

    this.player.segments = [];
    for (let i = 0; i < INITIAL_LENGTH; i++) {
      this.player.segments.push({
        x: startX - i * SNAKE_RADIUS * 1.5,
        y: startY,
        radius: SNAKE_RADIUS
      });
    }
    this.player.angle = 0;
    this.player.speed = BASE_SPEED;
    this.player.isDead = false;
    this.player.boost = false;
    this.player.score = INITIAL_LENGTH * 10;

    this.aiSnakes = [];
    for (let i = 0; i < AI_COUNT; i++) {
      this.spawnAISnake(i);
    }

    this.foods = [];
    for (let i = 0; i < 100; i++) {
      this.spawnFood();
    }

    this.particles = [];
    this.camera = { x: startX - CANVAS_WIDTH / 2, y: startY - CANVAS_HEIGHT / 2 };
    this.gameOver = false;
    this.rank = 1;
  }

  spawnAISnake(id: number): void {
    const colors = [NEON_COLORS.neonPink, NEON_COLORS.neonPurple, NEON_COLORS.neonGreen, NEON_COLORS.gold, NEON_COLORS.danger];
    const startX = Math.random() * CANVAS_WIDTH * 2;
    const startY = Math.random() * CANVAS_HEIGHT * 2;
    const length = Math.floor(Math.random() * 20) + 10;

    const segments: SnakeSegment[] = [];
    for (let i = 0; i < length; i++) {
      segments.push({
        x: startX - i * SNAKE_RADIUS * 1.5,
        y: startY,
        radius: SNAKE_RADIUS
      });
    }

    this.aiSnakes.push({
      id,
      segments,
      color: colors[id % colors.length],
      name: AI_NAMES[id % AI_NAMES.length],
      angle: Math.random() * Math.PI * 2,
      speed: BASE_SPEED + Math.random() * 2,
      isDead: false,
      targetAngle: Math.random() * Math.PI * 2,
      changeDirTimer: 0
    });
  }

  spawnFood(): void {
    const colors = [NEON_COLORS.neonPink, NEON_COLORS.neonCyan, NEON_COLORS.neonGreen, NEON_COLORS.gold, NEON_COLORS.neonPurple];
    this.foods.push({
      x: Math.random() * CANVAS_WIDTH * 3,
      y: Math.random() * CANVAS_HEIGHT * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      value: Math.floor(Math.random() * 5) + 1,
      radius: FOOD_RADIUS + Math.random() * 3
    });
  }

  createParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color,
        size: 3 + Math.random() * 4
      });
    }
  }

  updateMousePos(x: number, y: number): void {
    this.mousePos = { x, y };
  }

  setBoost(boost: boolean): void {
    this.player.boost = boost;
  }

  private updatePlayer(): void {
    if (this.player.isDead) return;

    const head = this.player.segments[0];
    const dx = this.mousePos.x - CANVAS_WIDTH / 2;
    const dy = this.mousePos.y - CANVAS_HEIGHT / 2;
    const targetAngle = Math.atan2(dy, dx);

    let angleDiff = targetAngle - this.player.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.player.angle += angleDiff * 0.1;

    const currentSpeed = this.player.boost ? BOOST_SPEED : BASE_SPEED;
    if (this.player.boost && this.player.segments.length > 5) {
      if (Math.random() < 0.1) {
        this.player.segments.pop();
        this.player.score = Math.max(0, this.player.score - 1);
      }
    }

    const newHead: SnakeSegment = {
      x: head.x + Math.cos(this.player.angle) * currentSpeed,
      y: head.y + Math.sin(this.player.angle) * currentSpeed,
      radius: SNAKE_RADIUS + Math.min(this.player.segments.length * 0.1, 5)
    };

    this.player.segments.unshift(newHead);

    const foodEaten: number[] = [];
    this.foods.forEach((food, index) => {
      const dist = Math.hypot(newHead.x - food.x, newHead.y - food.y);
      if (dist < newHead.radius + food.radius) {
        foodEaten.push(index);
        this.player.score += food.value * 10;
        this.createParticles(food.x, food.y, food.color, 5);
      }
    });

    foodEaten.reverse().forEach(index => {
      this.foods.splice(index, 1);
    });

    const targetLength = Math.floor(this.player.score / 10);
    while (this.player.segments.length > targetLength) {
      this.player.segments.pop();
    }

    const boundaryPadding = 100;
    if (newHead.x < -boundaryPadding || newHead.x > CANVAS_WIDTH * 3 + boundaryPadding ||
        newHead.y < -boundaryPadding || newHead.y > CANVAS_HEIGHT * 3 + boundaryPadding) {
      this.player.isDead = true;
      this.gameOver = true;
      this.createParticles(newHead.x, newHead.y, this.player.color, 20);
    }
  }

  private updateAI(): void {
    this.aiSnakes.forEach(ai => {
      if (ai.isDead) return;

      ai.changeDirTimer--;
      if (ai.changeDirTimer <= 0) {
        ai.targetAngle = Math.random() * Math.PI * 2;
        ai.changeDirTimer = 60 + Math.random() * 120;
      }

      let angleDiff = ai.targetAngle - ai.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      ai.angle += angleDiff * 0.05;

      const head = ai.segments[0];
      const newHead: SnakeSegment = {
        x: head.x + Math.cos(ai.angle) * ai.speed,
        y: head.y + Math.sin(ai.angle) * ai.speed,
        radius: SNAKE_RADIUS + Math.min(ai.segments.length * 0.1, 5)
      };

      ai.segments.unshift(newHead);

      const foodEaten: number[] = [];
      this.foods.forEach((food, index) => {
        const dist = Math.hypot(newHead.x - food.x, newHead.y - food.y);
        if (dist < newHead.radius + food.radius) {
          foodEaten.push(index);
          this.createParticles(food.x, food.y, food.color, 3);
        }
      });

      foodEaten.reverse().forEach(index => {
        this.foods.splice(index, 1);
      });

      while (ai.segments.length > 30 + Math.random() * 20) {
        ai.segments.pop();
      }

      const boundaryPadding = 100;
      if (newHead.x < -boundaryPadding || newHead.x > CANVAS_WIDTH * 3 + boundaryPadding ||
          newHead.y < -boundaryPadding || newHead.y > CANVAS_HEIGHT * 3 + boundaryPadding) {
        ai.isDead = true;
        this.createParticles(newHead.x, newHead.y, ai.color, 15);
        setTimeout(() => this.respawnAI(ai.id), 3000);
      }
    });
  }

  private respawnAI(id: number): void {
    const index = this.aiSnakes.findIndex(ai => ai.id === id);
    if (index !== -1) {
      this.aiSnakes.splice(index, 1);
      this.spawnAISnake(id);
    }
  }

  private checkCollisions(): void {
    if (this.player.isDead) return;

    const playerHead = this.player.segments[0];

    for (const ai of this.aiSnakes) {
      if (ai.isDead) continue;

      for (let i = 3; i < ai.segments.length; i++) {
        const dist = Math.hypot(playerHead.x - ai.segments[i].x, playerHead.y - ai.segments[i].y);
        if (dist < playerHead.radius + ai.segments[i].radius) {
          this.player.isDead = true;
          this.gameOver = true;
          this.createParticles(playerHead.x, playerHead.y, this.player.color, 20);
          return;
        }
      }

      const aiHead = ai.segments[0];
      for (let i = 3; i < this.player.segments.length; i++) {
        const dist = Math.hypot(aiHead.x - this.player.segments[i].x, aiHead.y - this.player.segments[i].y);
        if (dist < aiHead.radius + this.player.segments[i].radius) {
          ai.isDead = true;
          this.createParticles(aiHead.x, aiHead.y, ai.color, 15);
          this.player.score += ai.segments.length * 5;
          setTimeout(() => this.respawnAI(ai.id), 3000);
          break;
        }
      }
    }
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateCamera(): void {
    const head = this.player.segments[0];
    this.camera.x += (head.x - CANVAS_WIDTH / 2 - this.camera.x) * 0.1;
    this.camera.y += (head.y - CANVAS_HEIGHT / 2 - this.camera.y) * 0.1;
  }

  private updateFood(): void {
    this.foodSpawnTimer++;
    if (this.foodSpawnTimer > 10) {
      this.foodSpawnTimer = 0;
      if (this.foods.length < 150) {
        this.spawnFood();
      }
    }
  }

  private calculateRank(): void {
    const allSnakes = [
      { length: this.player.segments.length, isDead: this.player.isDead },
      ...this.aiSnakes.map(ai => ({ length: ai.segments.length, isDead: ai.isDead }))
    ];

    allSnakes.sort((a, b) => b.length - a.length);
    this.rank = allSnakes.findIndex(s => s.length === this.player.segments.length && !s.isDead) + 1;
    if (this.rank === 0) this.rank = allSnakes.length;
  }

  tick(): void {
    if (this.gameOver) return;

    this.updatePlayer();
    this.updateAI();
    this.checkCollisions();
    this.updateParticles();
    this.updateCamera();
    this.updateFood();
    this.calculateRank();
  }

  getState(): SnakeGameState {
    return {
      player: { ...this.player, segments: [...this.player.segments] },
      aiSnakes: this.aiSnakes.map(ai => ({ ...ai, segments: [...ai.segments] })),
      foods: [...this.foods],
      particles: [...this.particles],
      camera: { ...this.camera },
      gameOver: this.gameOver,
      rank: this.rank
    };
  }

  reset(): void {
    this.init();
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
