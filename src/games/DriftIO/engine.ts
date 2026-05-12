import { NEON_COLORS } from '../../utils/constants';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 20;
const MAX_SPEED = 8;
const ACCELERATION = 0.3;
const FRICTION = 0.98;
const TURN_SPEED = 0.08;
const DRIFT_FACTOR = 0.95;
const AI_COUNT = 12;
const LAP_COUNT = 3;

export interface Position {
  x: number;
  y: number;
}

export interface Car {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  color: string;
  name: string;
  lap: number;
  checkpoint: number;
  rank: number;
  isDead: boolean;
  trail: Position[];
}

export interface Checkpoint {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
}

export interface Particle extends Position {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface DriftGameState {
  player: Car;
  aiCars: Car[];
  particles: Particle[];
  camera: Position;
  gameOver: boolean;
  playerRank: number;
  raceFinished: boolean;
  raceTime: number;
}

const AI_NAMES = ['闪电', '疾风', '雷霆', '烈焰', '暴风', '极速', '幻影', '流星', '飓风', '狂飙', '电光', '烈焰'];

const CHECKPOINTS: Checkpoint[] = [
  { x: 400, y: 500, width: 100, height: 20, angle: 0 },
  { x: 700, y: 400, width: 20, height: 100, angle: 0 },
  { x: 600, y: 150, width: 100, height: 20, angle: 0 },
  { x: 300, y: 100, width: 20, height: 100, angle: 0 },
  { x: 100, y: 200, width: 100, height: 20, angle: 0 },
  { x: 150, y: 400, width: 20, height: 100, angle: 0 },
];

export class DriftIOEngine {
  private player: Car;
  private aiCars: Car[];
  private particles: Particle[];
  private camera: Position;
  private gameOver: boolean;
  private keys: { [key: string]: boolean };
  private playerRank: number;
  private raceFinished: boolean;
  private raceTime: number;
  private raceStartTime: number;

  constructor() {
    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      speed: 0,
      color: NEON_COLORS.neonCyan,
      name: '玩家',
      lap: 0,
      checkpoint: 0,
      rank: 1,
      isDead: false,
      trail: []
    };
    this.aiCars = [];
    this.particles = [];
    this.camera = { x: 0, y: 0 };
    this.gameOver = false;
    this.keys = {};
    this.playerRank = 1;
    this.raceFinished = false;
    this.raceTime = 0;
    this.raceStartTime = 0;
    this.init();
  }

  init(): void {
    this.player.x = 400;
    this.player.y = 520;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.angle = -Math.PI / 2;
    this.player.speed = 0;
    this.player.lap = 0;
    this.player.checkpoint = 0;
    this.player.rank = 1;
    this.player.isDead = false;
    this.player.trail = [];

    this.aiCars = [];
    const colors = [NEON_COLORS.neonPink, NEON_COLORS.neonPurple, NEON_COLORS.neonGreen, NEON_COLORS.gold, NEON_COLORS.danger, NEON_COLORS.warning, '#ff6b9d', '#4ecdc4', '#95e1d3', '#f38181', '#aa96da', '#fcbad3'];

    for (let i = 0; i < AI_COUNT; i++) {
      const angle = (i / AI_COUNT) * Math.PI * 2;
      this.aiCars.push({
        x: 400 + Math.cos(angle) * 50,
        y: 520 + Math.sin(angle) * 30,
        vx: 0,
        vy: 0,
        angle: -Math.PI / 2,
        speed: 0,
        color: colors[i % colors.length],
        name: AI_NAMES[i % AI_NAMES.length],
        lap: 0,
        checkpoint: 0,
        rank: i + 2,
        isDead: false,
        trail: []
      });
    }

    this.particles = [];
    this.camera = { x: 0, y: 0 };
    this.gameOver = false;
    this.playerRank = 1;
    this.raceFinished = false;
    this.raceTime = 0;
    this.raceStartTime = Date.now();
  }

  createParticles(x: number, y: number, color: string, count: number, speed: number = 3): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const velocity = speed + Math.random() * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 15 + Math.random() * 15,
        maxLife: 30,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }

  setKey(key: string, pressed: boolean): void {
    this.keys[key] = pressed;
  }

  private updatePlayer(): void {
    if (this.player.isDead || this.raceFinished) return;

    let accelerating = false;
    let turning = 0;

    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
      this.player.speed += ACCELERATION;
      accelerating = true;
    }
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
      this.player.speed -= ACCELERATION;
    }
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      turning = -1;
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      turning = 1;
    }

    this.player.speed = Math.max(-MAX_SPEED / 2, Math.min(MAX_SPEED, this.player.speed));
    this.player.speed *= FRICTION;

    if (Math.abs(this.player.speed) > 1) {
      this.player.angle += turning * TURN_SPEED * (this.player.speed / MAX_SPEED);
    }

    const driftX = this.player.vx * (1 - DRIFT_FACTOR);
    const driftY = this.player.vy * (1 - DRIFT_FACTOR);

    this.player.vx = Math.cos(this.player.angle) * this.player.speed + driftX;
    this.player.vy = Math.sin(this.player.angle) * this.player.speed + driftY;

    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    this.player.x = Math.max(PLAYER_SIZE, Math.min(CANVAS_WIDTH - PLAYER_SIZE, this.player.x));
    this.player.y = Math.max(PLAYER_SIZE, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, this.player.y));

    if (Math.abs(this.player.speed) > 3 && Math.random() < 0.3) {
      this.player.trail.push({ x: this.player.x, y: this.player.y });
      if (this.player.trail.length > 20) {
        this.player.trail.shift();
      }
    }

    if (accelerating && Math.random() < 0.5) {
      const exhaustX = this.player.x - Math.cos(this.player.angle) * PLAYER_SIZE;
      const exhaustY = this.player.y - Math.sin(this.player.angle) * PLAYER_SIZE;
      this.createParticles(exhaustX, exhaustY, '#ff6600', 2, 2);
    }

    this.checkCheckpoints(this.player);
  }

  private updateAI(): void {
    this.aiCars.forEach(ai => {
      if (ai.isDead || this.raceFinished) return;

      const targetCheckpoint = CHECKPOINTS[ai.checkpoint];
      const dx = targetCheckpoint.x - ai.x;
      const dy = targetCheckpoint.y - ai.y;
      const targetAngle = Math.atan2(dy, dx);

      let angleDiff = targetAngle - ai.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      ai.angle += Math.sign(angleDiff) * TURN_SPEED * 0.7;
      ai.speed += ACCELERATION * 0.8;
      ai.speed = Math.min(MAX_SPEED * (0.8 + Math.random() * 0.2), ai.speed);
      ai.speed *= FRICTION;

      ai.vx = Math.cos(ai.angle) * ai.speed;
      ai.vy = Math.sin(ai.angle) * ai.speed;

      ai.x += ai.vx;
      ai.y += ai.vy;

      if (Math.abs(ai.speed) > 3 && Math.random() < 0.3) {
        ai.trail.push({ x: ai.x, y: ai.y });
        if (ai.trail.length > 20) {
          ai.trail.shift();
        }
      }

      if (Math.random() < 0.3) {
        const exhaustX = ai.x - Math.cos(ai.angle) * PLAYER_SIZE;
        const exhaustY = ai.y - Math.sin(ai.angle) * PLAYER_SIZE;
        this.createParticles(exhaustX, exhaustY, ai.color, 1, 1);
      }

      this.checkCheckpoints(ai);
    });
  }

  private checkCheckpoints(car: Car): void {
    const checkpoint = CHECKPOINTS[car.checkpoint];
    const dx = car.x - checkpoint.x;
    const dy = car.y - checkpoint.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 50) {
      car.checkpoint++;
      if (car.checkpoint >= CHECKPOINTS.length) {
        car.checkpoint = 0;
        car.lap++;
        if (car.lap >= LAP_COUNT) {
          if (car === this.player) {
            this.raceFinished = true;
            this.raceTime = (Date.now() - this.raceStartTime) / 1000;
          }
        }
      }
    }
  }

  private calculateRank(): void {
    const cars = [
      { car: this.player, lap: this.player.lap, checkpoint: this.player.checkpoint },
      ...this.aiCars.map(ai => ({ car: ai, lap: ai.lap, checkpoint: ai.checkpoint }))
    ];

    cars.sort((a, b) => {
      if (a.lap !== b.lap) return b.lap - a.lap;
      return b.checkpoint - a.checkpoint;
    });

    cars.forEach((item, index) => {
      item.car.rank = index + 1;
    });

    this.playerRank = this.player.rank;
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

  tick(): void {
    if (this.gameOver) return;

    this.updatePlayer();
    this.updateAI();
    this.calculateRank();
    this.updateParticles();

    if (!this.raceFinished) {
      this.raceTime = (Date.now() - this.raceStartTime) / 1000;
    }
  }

  getState(): DriftGameState {
    return {
      player: { ...this.player, trail: [...this.player.trail] },
      aiCars: this.aiCars.map(ai => ({ ...ai, trail: [...ai.trail] })),
      particles: [...this.particles],
      camera: { ...this.camera },
      gameOver: this.gameOver,
      playerRank: this.playerRank,
      raceFinished: this.raceFinished,
      raceTime: this.raceTime
    };
  }

  reset(): void {
    this.init();
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getCheckpoints(): Checkpoint[] {
    return CHECKPOINTS;
  }

  getLapCount(): number {
    return LAP_COUNT;
  }
}
