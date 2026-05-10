// Skateboarding - Skateboard Tricks Game Engine

export interface Vec2 {
  x: number;
  y: number;
}

export interface Skater {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  boardAngle: number;
  isAirborne: boolean;
  currentTrick: string | null;
  trickProgress: number;
  score: number;
}

export interface Ramp {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'quarter_pipe' | 'half_pipe' | 'rail' | 'box';
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

export interface TrickCombo {
  name: string;
  score: number;
  multiplier: number;
}

export interface SkateboardingState {
  skater: Skater;
  ramps: Ramp[];
  particles: Particle[];
  score: number;
  combo: number;
  currentTrick: string | null;
  speed: number;
  distance: number;
  phase: 'playing' | 'trick' | 'landed' | 'crashed' | 'gameover';
  message: string;
  tricks: TrickCombo[];
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const GRAVITY = 0.5;
const GROUND_Y = 320;
const MAX_SPEED = 12;
const FRICTION = 0.995;

const TRICK_LIST: { name: string; score: number; duration: number }[] = [
  { name: 'Kickflip', score: 100, duration: 30 },
  { name: 'Heelflip', score: 100, duration: 30 },
  { name: '360 Flip', score: 200, duration: 45 },
  { name: 'Pop Shove-it', score: 80, duration: 25 },
  { name: 'Frontside 180', score: 120, duration: 35 },
  { name: 'Backside 180', score: 120, duration: 35 },
  { name: 'Manual', score: 50, duration: 40 },
  { name: 'Nose Manual', score: 50, duration: 40 },
  { name: 'Grind', score: 150, duration: 50 },
  { name: 'Slide', score: 150, duration: 50 },
];

export class SkateboardingEngine {
  private skater: Skater;
  private ramps: Ramp[];
  private particles: Particle[];
  private score: number;
  private combo: number;
  private currentTrick: string | null;
  private trickTimer: number;
  private speed: number;
  private distance: number;
  private phase: 'playing' | 'trick' | 'landed' | 'crashed' | 'gameover';
  private message: string;
  private tricks: TrickCombo[];
  private trickHistory: { name: string; score: number; time: number }[];
  private groundY: number;

  constructor() {
    this.skater = this.createSkater();
    this.ramps = this.createRamps();
    this.particles = [];
    this.score = 0;
    this.combo = 0;
    this.currentTrick = null;
    this.trickTimer = 0;
    this.speed = 5;
    this.distance = 0;
    this.phase = 'playing';
    this.message = '';
    this.tricks = [];
    this.trickHistory = [];
    this.groundY = GROUND_Y;
  }

  private createSkater(): Skater {
    return {
      x: 100,
      y: GROUND_Y,
      vx: 5,
      vy: 0,
      rotation: 0,
      rotationSpeed: 0,
      boardAngle: 0,
      isAirborne: false,
      currentTrick: null,
      trickProgress: 0,
      score: 0,
    };
  }

  private createRamps(): Ramp[] {
    return [
      { x: 200, y: GROUND_Y, width: 80, height: 60, type: 'quarter_pipe' },
      { x: 400, y: GROUND_Y, width: 100, height: 80, type: 'half_pipe' },
      { x: 550, y: GROUND_Y, width: 120, height: 50, type: 'rail' },
    ];
  }

  getState(): SkateboardingState {
    return {
      skater: { ...this.skater },
      ramps: this.ramps.map(r => ({ ...r })),
      particles: this.particles.map(p => ({ ...p })),
      score: this.score,
      combo: this.combo,
      currentTrick: this.currentTrick,
      speed: this.speed,
      distance: this.distance,
      phase: this.phase,
      message: this.message,
      tricks: [...this.tricks],
    };
  }

  moveLeft(): void {
    if (this.phase !== 'playing') return;
    this.skater.vx = Math.max(-MAX_SPEED, this.skater.vx - 0.5);
  }

  moveRight(): void {
    if (this.phase !== 'playing') return;
    this.skater.vx = Math.min(MAX_SPEED, this.skater.vx + 0.5);
  }

  jump(): void {
    if (this.phase !== 'playing' && this.phase !== 'trick') return;
    if (!this.skater.isAirborne && this.skater.y >= this.groundY - 5) {
      this.skater.vy = -12;
      this.skater.isAirborne = true;
      this.createParticles(this.skater.x, this.skater.y, '#888888', 5);
    }
  }

  performTrick(trickIndex: number): void {
    if (this.phase !== 'playing' && this.phase !== 'trick') return;
    if (trickIndex < 0 || trickIndex >= TRICK_LIST.length) return;

    const trick = TRICK_LIST[trickIndex];
    this.currentTrick = trick.name;
    this.trickTimer = trick.duration;
    this.phase = 'trick';

    switch (trickIndex) {
      case 0:
      case 1:
        this.skater.rotationSpeed = 0.3;
        break;
      case 2:
        this.skater.rotationSpeed = 0.4;
        break;
      case 3:
        this.skater.boardAngle = Math.PI;
        break;
      case 4:
      case 5:
        this.skater.rotationSpeed = 0.2;
        break;
      default:
        this.skater.boardAngle = 0.1;
    }
  }

  private createParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 1) * 3,
        life: 1,
        color,
        size: Math.random() * 3 + 1,
      });
    }
  }

  private createTrickParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color,
        size: Math.random() * 5 + 2,
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

  private checkRampCollision(): { ramp: Ramp; type: 'launch' | 'grind' } | null {
    for (const ramp of this.ramps) {
      if (this.skater.x > ramp.x && this.skater.x < ramp.x + ramp.width) {
        if (ramp.type === 'quarter_pipe') {
          const progress = (this.skater.x - ramp.x) / ramp.width;
          const rampY = ramp.y - Math.sin(progress * Math.PI / 2) * ramp.height;
          if (this.skater.y >= rampY - 10) {
            return { ramp, type: 'launch' };
          }
        } else if (ramp.type === 'half_pipe') {
          const center = ramp.x + ramp.width / 2;
          const dist = Math.abs(this.skater.x - center);
          const maxDist = ramp.width / 2;
          if (dist < maxDist) {
            const progress = dist / maxDist;
            const rampY = ramp.y - Math.sin(progress * Math.PI) * ramp.height;
            if (this.skater.y >= rampY - 10) {
              return { ramp, type: 'launch' };
            }
          }
        } else if (ramp.type === 'rail') {
          const railTop = ramp.y - ramp.height;
          if (this.skater.y >= railTop - 15 && this.skater.y <= railTop + 5) {
            return { ramp, type: 'grind' };
          }
        }
      }
    }
    return null;
  }

  tick(): void {
    if (this.phase === 'gameover') return;

    this.skater.x += this.skater.vx;
    this.distance += this.skater.vx / 10;

    this.skater.vx *= FRICTION;
    this.skater.vx = Math.max(2, Math.min(MAX_SPEED, this.skater.vx));

    if (this.skater.x < 0) {
      this.skater.x = CANVAS_WIDTH;
    }
    if (this.skater.x > CANVAS_WIDTH) {
      this.skater.x = 0;
    }

    const rampHit = this.checkRampCollision();

    if (this.skater.isAirborne) {
      this.skater.vy += GRAVITY;
      this.skater.y += this.skater.vy;

      if (this.phase === 'trick' && this.trickTimer > 0) {
        this.skater.rotation += this.skater.rotationSpeed;
        this.trickTimer--;
      }

      if (this.skater.y >= this.groundY && this.skater.vy > 0) {
        if (Math.abs(this.skater.rotation) > 0.5 && Math.abs(this.skater.rotation) < Math.PI - 0.5) {
          this.crash();
          return;
        }

        this.skater.y = this.groundY;
        this.skater.vy = 0;
        this.skater.isAirborne = false;
        this.skater.rotation = 0;
        this.skater.boardAngle = 0;
        this.skater.rotationSpeed = 0;

        if (this.currentTrick) {
          this.completeTrick();
        }

        this.createParticles(this.skater.x, this.skater.y, '#888888', 3);
      }

      if (rampHit && rampHit.type === 'launch' && this.skater.vy > 0) {
        const ramp = rampHit.ramp;
        const center = ramp.x + ramp.width / 2;
        const dist = this.skater.x - center;
        const launchAngle = (dist / (ramp.width / 2)) * 0.5;

        this.skater.vy = -8 - Math.abs(this.skater.vx) * 0.5;
        this.skater.vx += Math.sin(launchAngle) * 2;
        this.skater.isAirborne = true;
      }
    } else {
      if (rampHit && rampHit.type === 'launch') {
        const ramp = rampHit.ramp;
        this.skater.vy = -8 - Math.abs(this.skater.vx) * 0.5;
        this.skater.isAirborne = true;
        this.createParticles(this.skater.x, this.skater.y, '#888888', 5);
      } else if (this.skater.y < this.groundY) {
        this.skater.y = this.groundY;
      }
    }

    this.updateParticles();

    if (this.phase === 'trick' && this.trickTimer <= 0) {
      this.phase = 'playing';
      this.currentTrick = null;
    }
  }

  private completeTrick(): void {
    const trick = TRICK_LIST.find(t => t.name === this.currentTrick);
    if (trick) {
      this.combo++;
      const trickScore = trick.score * this.combo;
      this.score += trickScore;

      this.tricks.push({
        name: this.currentTrick!,
        score: trickScore,
        multiplier: this.combo,
      });

      this.trickHistory.push({
        name: this.currentTrick!,
        score: trickScore,
        time: Date.now(),
      });

      this.createTrickParticles(this.skater.x, this.skater.y - 30, '#ffd700', 10);
      this.message = `${this.currentTrick}! +${trickScore}`;

      if (this.combo > 1) {
        this.message += ` (${this.combo}x Combo!)`;
      }

      setTimeout(() => {
        this.message = '';
      }, 1500);
    }

    this.phase = 'landed';
    setTimeout(() => {
      if (this.phase === 'landed') {
        this.phase = 'playing';
      }
    }, 500);

    this.currentTrick = null;
  }

  private crash(): void {
    this.phase = 'crashed';
    this.combo = 0;
    this.currentTrick = null;
    this.message = '摔倒了!';

    this.createTrickParticles(this.skater.x, this.skater.y, '#ff4444', 15);

    this.skater.y = this.groundY;
    this.skater.vy = 0;
    this.skater.rotation = 0;
    this.skater.isAirborne = false;
    this.skater.boardAngle = 0;

    setTimeout(() => {
      this.phase = 'playing';
      this.message = '';
    }, 1000);
  }

  addSpeedBoost(): void {
    if (this.phase !== 'playing') return;
    this.skater.vx = Math.min(MAX_SPEED, this.skater.vx + 3);
    this.createParticles(this.skater.x - 10, this.skater.y, '#00ffff', 5);
  }

  reset(): void {
    this.skater = this.createSkater();
    this.score = 0;
    this.combo = 0;
    this.currentTrick = null;
    this.trickTimer = 0;
    this.speed = 5;
    this.distance = 0;
    this.phase = 'playing';
    this.message = '';
    this.tricks = [];
    this.trickHistory = [];
    this.particles = [];
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getTrickList() {
    return TRICK_LIST;
  }
}
