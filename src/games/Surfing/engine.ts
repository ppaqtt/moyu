// Surfing - Surfing Game Engine

export interface Vec2 {
  x: number;
  y: number;
}

export interface Surfer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  speed: number;
  isOnWave: boolean;
  wavePosition: number;
  isJumping: boolean;
  jumpHeight: number;
  score: number;
  combo: number;
}

export interface Wave {
  x: number;
  y: number;
  width: number;
  height: number;
  amplitude: number;
  frequency: number;
  speed: number;
  phase: number;
  type: 'normal' | 'big' | 'tube';
}

export interface Obstacle {
  x: number;
  y: number;
  type: 'rock' | 'seaweed' | 'seagull';
  radius: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface SurfingState {
  surfer: Surfer;
  waves: Wave[];
  obstacles: Obstacle[];
  particles: Particle[];
  score: number;
  combo: number;
  distance: number;
  speed: number;
  phase: 'playing' | 'wipeout' | 'gameover';
  message: string;
  currentTrick: string | null;
  tricks: { name: string; score: number; time: number }[];
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;
const GRAVITY = 0.3;
const WATER_LEVEL = 350;
const MAX_SPEED = 10;
const WAVE_SPEED = 3;

const TRICK_LIST: { name: string; score: number; minSpeed: number }[] = [
  { name: 'Cutback', score: 50, minSpeed: 3 },
  { name: 'Floater', score: 80, minSpeed: 4 },
  { name: 'Air', score: 150, minSpeed: 5 },
  { name: '360 Spin', score: 120, minSpeed: 4 },
  { name: 'Tube Ride', score: 200, minSpeed: 6 },
  { name: 'Floater', score: 80, minSpeed: 4 },
  { name: 'Snap', score: 100, minSpeed: 5 },
];

export class SurfingEngine {
  private surfer: Surfer;
  private waves: Wave[];
  private obstacles: Obstacle[];
  private particles: Particle[];
  private score: number;
  private combo: number;
  private distance: number;
  private speed: number;
  private phase: 'playing' | 'wipeout' | 'gameover';
  private message: string;
  private currentTrick: string | null;
  private tricks: { name: string; score: number; time: number }[];
  private wipeoutTimer: number;
  private waveSpawnTimer: number;
  private obstacleSpawnTimer: number;

  constructor() {
    this.surfer = this.createSurfer();
    this.waves = this.createWaves();
    this.obstacles = [];
    this.particles = [];
    this.score = 0;
    this.combo = 0;
    this.distance = 0;
    this.speed = WAVE_SPEED;
    this.phase = 'playing';
    this.message = '';
    this.currentTrick = null;
    this.tricks = [];
    this.wipeoutTimer = 0;
    this.waveSpawnTimer = 0;
    this.obstacleSpawnTimer = 0;
  }

  private createSurfer(): Surfer {
    return {
      x: CANVAS_WIDTH / 2,
      y: WATER_LEVEL - 20,
      vx: 0,
      vy: 0,
      rotation: 0,
      speed: WAVE_SPEED,
      isOnWave: true,
      wavePosition: 0,
      isJumping: false,
      jumpHeight: 0,
      score: 0,
      combo: 0,
    };
  }

  private createWaves(): Wave[] {
    return [
      {
        x: 0,
        y: WATER_LEVEL,
        width: CANVAS_WIDTH,
        height: 80,
        amplitude: 15,
        frequency: 0.02,
        speed: WAVE_SPEED,
        phase: 0,
        type: 'normal',
      },
      {
        x: 0,
        y: WATER_LEVEL + 30,
        width: CANVAS_WIDTH,
        height: 60,
        amplitude: 10,
        frequency: 0.03,
        speed: WAVE_SPEED * 1.2,
        phase: Math.PI / 3,
        type: 'normal',
      },
    ];
  }

  private createBigWave(): Wave {
    const types: ('normal' | 'big' | 'tube')[] = ['big', 'tube'];
    return {
      x: -200,
      y: WATER_LEVEL,
      width: 300,
      height: 100,
      amplitude: 30,
      frequency: 0.015,
      speed: WAVE_SPEED * 0.8,
      phase: 0,
      type: types[Math.floor(Math.random() * types.length)],
    };
  }

  getState(): SurfingState {
    return {
      surfer: { ...this.surfer },
      waves: this.waves.map(w => ({ ...w })),
      obstacles: this.obstacles.map(o => ({ ...o })),
      particles: this.particles.map(p => ({ ...p })),
      score: this.score,
      combo: this.combo,
      distance: this.distance,
      speed: this.speed,
      phase: this.phase,
      message: this.message,
      currentTrick: this.currentTrick,
      tricks: [...this.tricks],
    };
  }

  moveLeft(): void {
    if (this.phase !== 'playing') return;
    this.surfer.vx = Math.max(-MAX_SPEED, this.surfer.vx - 0.8);
  }

  moveRight(): void {
    if (this.phase !== 'playing') return;
    this.surfer.vx = Math.min(MAX_SPEED, this.surfer.vx + 0.8);
  }

  jump(): void {
    if (this.phase !== 'playing') return;
    if (!this.surfer.isJumping && this.surfer.speed >= 4) {
      this.surfer.isJumping = true;
      this.surfer.jumpHeight = 0;
      this.createParticles(this.surfer.x, this.surfer.y, '#87CEEB', 8);
    }
  }

  performTrick(trickIndex: number): void {
    if (this.phase !== 'playing') return;
    if (trickIndex < 0 || trickIndex >= TRICK_LIST.length) return;

    const trick = TRICK_LIST[trickIndex];
    if (this.surfer.speed < trick.minSpeed) {
      this.message = '太慢了!';
      setTimeout(() => { this.message = ''; }, 1000);
      return;
    }

    this.currentTrick = trick.name;

    if (trick.name === 'Air' || trick.name === '360 Spin') {
      this.surfer.isJumping = true;
      this.surfer.jumpHeight = 25;
    }

    setTimeout(() => {
      if (this.currentTrick === trick.name) {
        this.completeTrick(trick.name, trick.score);
      }
    }, 500);
  }

  private completeTrick(name: string, baseScore: number): void {
    this.combo++;
    const trickScore = baseScore * this.combo;
    this.score += trickScore;

    this.tricks.push({
      name,
      score: trickScore,
      time: Date.now(),
    });

    const colors = ['#ffd700', '#ff6b9d', '#00d2ff', '#39ff14'];
    this.createParticles(
      this.surfer.x,
      this.surfer.y - 30,
      colors[Math.floor(Math.random() * colors.length)],
      15
    );

    this.message = `${name}! +${trickScore}`;
    if (this.combo > 1) {
      this.message += ` (${this.combo}x!)`;
    }

    setTimeout(() => {
      this.message = '';
      this.currentTrick = null;
    }, 1500);
  }

  private createParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 1) * 4,
        life: 1,
        color,
        size: Math.random() * 4 + 2,
      });
    }
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= 0.02;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private getWaveY(x: number, wave: Wave): number {
    return wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
  }

  private checkWaveCollision(): void {
    for (const wave of this.waves) {
      const waveY = this.getWaveY(this.surfer.x, wave);

      if (this.surfer.y >= waveY - 15 && this.surfer.y <= waveY + wave.height / 2) {
        this.surfer.isOnWave = true;
        this.surfer.wavePosition = this.surfer.x - wave.x;

        if (!this.surfer.isJumping) {
          this.surfer.y = waveY - 10;
        }

        const slope = Math.cos(this.surfer.x * wave.frequency + wave.phase) * wave.frequency * wave.amplitude;
        this.surfer.speed = WAVE_SPEED + Math.abs(slope) * 2;

        if (wave.type === 'tube') {
          this.score += 2;
        }

        return;
      }
    }

    this.surfer.isOnWave = false;
  }

  private checkObstacleCollision(): boolean {
    for (const obs of this.obstacles) {
      const dx = this.surfer.x - obs.x;
      const dy = this.surfer.y - obs.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.surfer.jumpHeight > 15 ? obs.radius + 15 : obs.radius + 20) {
        return true;
      }
    }
    return false;
  }

  private spawnObstacle(): void {
    const types: ('rock' | 'seaweed' | 'seagull')[] = ['rock', 'seaweed', 'seagull'];
    const type = types[Math.floor(Math.random() * types.length)];

    const radius = type === 'rock' ? 20 : type === 'seaweed' ? 15 : 25;

    this.obstacles.push({
      x: Math.random() < 0.5 ? -30 : CANVAS_WIDTH + 30,
      y: WATER_LEVEL + Math.random() * 50,
      type,
      radius,
    });
  }

  tick(): void {
    if (this.phase === 'wipeout') {
      this.wipeoutTimer--;
      this.updateParticles();

      if (this.wipeoutTimer <= 0) {
        this.phase = 'gameover';
      }
      return;
    }

    if (this.phase === 'gameover') return;

    this.surfer.x += this.surfer.vx;
    this.surfer.y += this.surfer.vy;

    this.surfer.vx *= 0.95;

    if (this.surfer.x < 30) {
      this.surfer.x = 30;
      this.surfer.vx *= -0.5;
    }
    if (this.surfer.x > CANVAS_WIDTH - 30) {
      this.surfer.x = CANVAS_WIDTH - 30;
      this.surfer.vx *= -0.5;
    }

    if (this.surfer.y > WATER_LEVEL + 100) {
      this.wipeout();
      return;
    }

    this.checkWaveCollision();

    if (this.surfer.isJumping) {
      this.surfer.jumpHeight -= 1;

      if (this.surfer.jumpHeight <= 0) {
        this.surfer.isJumping = false;
        this.surfer.jumpHeight = 0;
        this.createParticles(this.surfer.x, this.surfer.y, '#87CEEB', 10);
      }
    }

    for (const wave of this.waves) {
      wave.phase += 0.05;
      wave.x += wave.speed;

      if (wave.x > CANVAS_WIDTH && wave.type !== 'big' && wave.type !== 'tube') {
        wave.x = -wave.width;
      }
    }

    this.waveSpawnTimer++;
    if (this.waveSpawnTimer > 300 && Math.random() < 0.01) {
      this.waves.push(this.createBigWave());
      this.waveSpawnTimer = 0;
    }

    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      if (wave.type === 'big' || wave.type === 'tube') {
        if (wave.x > CANVAS_WIDTH + 100) {
          this.waves.splice(i, 1);
        }
      }
    }

    this.obstacleSpawnTimer++;
    if (this.obstacleSpawnTimer > 200 && Math.random() < 0.02) {
      this.spawnObstacle();
      this.obstacleSpawnTimer = 0;
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      if (obs.type === 'seagull') {
        obs.x += 2;
        obs.y += Math.sin(Date.now() / 100) * 0.5;
      } else {
        obs.x += this.surfer.vx * 0.5;
      }

      if (obs.x < -50 || obs.x > CANVAS_WIDTH + 50) {
        this.obstacles.splice(i, 1);
      }
    }

    if (this.checkObstacleCollision()) {
      this.wipeout();
      return;
    }

    this.distance += this.speed / 10;
    this.score += Math.floor(this.speed);

    this.updateParticles();

    this.speed = Math.min(WAVE_SPEED * 2, this.speed + 0.001);
  }

  private wipeout(): void {
    this.phase = 'wipeout';
    this.wipeoutTimer = 90;
    this.combo = 0;
    this.message = '摔入海中!';
    this.currentTrick = null;

    this.createParticles(this.surfer.x, this.surfer.y, '#4169E1', 30);
  }

  reset(): void {
    this.surfer = this.createSurfer();
    this.waves = this.createWaves();
    this.obstacles = [];
    this.particles = [];
    this.score = 0;
    this.combo = 0;
    this.distance = 0;
    this.speed = WAVE_SPEED;
    this.phase = 'playing';
    this.message = '';
    this.currentTrick = null;
    this.tricks = [];
    this.wipeoutTimer = 0;
    this.waveSpawnTimer = 0;
    this.obstacleSpawnTimer = 0;
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getTrickList() {
    return TRICK_LIST;
  }
}
