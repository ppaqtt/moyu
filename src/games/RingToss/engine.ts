import { RINGTOSS_CONSTANTS } from '../../utils/constants';

const {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  RING_RADIUS,
  POLE_RADIUS,
  TOTAL_RINGS,
  THROW_POWER
} = RINGTOSS_CONSTANTS;

// ---- Types ----

export interface Pole {
  x: number;
  y: number;
  score: number;
  color: string;
  glowColor: string;
  hasRing: boolean;
  ringColor: string;
}

export interface Ring {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;       // currently in flight
  landed: boolean;       // has landed (either on pole or ground)
  scored: boolean;       // scored on a pole
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  landedTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface RingTossState {
  poles: Pole[];
  rings: Ring[];
  remainingRings: number;
  totalScore: number;
  isGameOver: boolean;
  isThrowing: boolean;
  aimAngle: number;
  aimPower: number;
  isCharging: boolean;
  message: string;
  messageTimer: number;
  particles: Particle[];
  throwX: number;
  throwY: number;
}

// ---- Score tiers ----

const SCORE_TIERS = [
  { score: 10, color: '#4ecdc4', glowColor: 'rgba(78, 205, 196, 0.6)', count: 3 },
  { score: 20, color: '#45b7d1', glowColor: 'rgba(69, 183, 209, 0.6)', count: 3 },
  { score: 30, color: '#f39c12', glowColor: 'rgba(243, 156, 18, 0.6)', count: 2 },
  { score: 50, color: '#ff6b9d', glowColor: 'rgba(255, 107, 157, 0.6)', count: 1 }
];

const RING_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#ffeaa7', '#fd79a8', '#a29bfe', '#00d2ff',
  '#6c5ce7', '#ff9ff3'
];

// ---- Helpers ----

function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ---- Engine ----

export class RingTossEngine {
  private poles: Pole[];
  private rings: Ring[];
  private remainingRings: number;
  private totalScore: number;
  private isGameOver: boolean;
  private isThrowing: boolean;
  private aimAngle: number;
  private aimPower: number;
  private isCharging: boolean;
  private message: string;
  private messageTimer: number;
  private particles: Particle[];
  private throwX: number;
  private throwY: number;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor() {
    this.canvasWidth = CANVAS_WIDTH;
    this.canvasHeight = CANVAS_HEIGHT;
    this.throwX = CANVAS_WIDTH / 2;
    this.throwY = CANVAS_HEIGHT - 60;

    this.poles = this.createPoles();
    this.rings = [];
    this.remainingRings = TOTAL_RINGS;
    this.totalScore = 0;
    this.isGameOver = false;
    this.isThrowing = false;
    this.aimAngle = -Math.PI / 2;
    this.aimPower = 0;
    this.isCharging = false;
    this.message = '';
    this.messageTimer = 0;
    this.particles = [];
  }

  // ---- Initialization ----

  private createPoles(): Pole[] {
    const poles: Pole[] = [];
    const margin = 60;
    const topAreaHeight = CANVAS_HEIGHT * 0.55;
    const minDist = 70;

    for (const tier of SCORE_TIERS) {
      for (let i = 0; i < tier.count; i++) {
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 100) {
          const x = randomRange(margin, CANVAS_WIDTH - margin);
          const y = randomRange(50, topAreaHeight);

          // Check distance from other poles
          let tooClose = false;
          for (const existingPole of poles) {
            if (dist(x, y, existingPole.x, existingPole.y) < minDist) {
              tooClose = true;
              break;
            }
          }

          if (!tooClose) {
            poles.push({
              x,
              y,
              score: tier.score,
              color: tier.color,
              glowColor: tier.glowColor,
              hasRing: false,
              ringColor: ''
            });
            placed = true;
          }
          attempts++;
        }

        // Fallback: place anyway
        if (!placed) {
          poles.push({
            x: randomRange(margin, CANVAS_WIDTH - margin),
            y: randomRange(50, topAreaHeight),
            score: tier.score,
            color: tier.color,
            glowColor: tier.glowColor,
            hasRing: false,
            ringColor: ''
          });
        }
      }
    }

    return poles;
  }

  // ---- Public API ----

  getState(): RingTossState {
    return {
      poles: this.poles.map(p => ({ ...p })),
      rings: this.rings.map(r => ({ ...r })),
      remainingRings: this.remainingRings,
      totalScore: this.totalScore,
      isGameOver: this.isGameOver,
      isThrowing: this.isThrowing,
      aimAngle: this.aimAngle,
      aimPower: this.aimPower,
      isCharging: this.isCharging,
      message: this.message,
      messageTimer: this.messageTimer,
      particles: this.particles.map(p => ({ ...p })),
      throwX: this.throwX,
      throwY: this.throwY
    };
  }

  setAim(angle: number, power: number): void {
    if (this.isThrowing || this.isGameOver || this.remainingRings <= 0) return;
    // angle is from mouse position relative to throw origin
    this.aimAngle = Math.max(-Math.PI + 0.2, Math.min(-0.2, angle));
    this.aimPower = Math.max(3, Math.min(THROW_POWER, power));
  }

  startCharging(): void {
    if (this.isThrowing || this.isGameOver || this.remainingRings <= 0) return;
    this.isCharging = true;
    this.aimPower = 3;
  }

  throwRing(): void {
    if (this.isThrowing || this.isGameOver || this.remainingRings <= 0) return;
    this.isCharging = false;

    const power = this.aimPower;
    const colorIndex = TOTAL_RINGS - this.remainingRings;

    const ring: Ring = {
      x: this.throwX,
      y: this.throwY,
      vx: Math.cos(this.aimAngle) * power,
      vy: Math.sin(this.aimAngle) * power,
      radius: RING_RADIUS,
      active: true,
      landed: false,
      scored: false,
      color: RING_COLORS[colorIndex % RING_COLORS.length],
      rotation: 0,
      rotationSpeed: randomRange(-0.15, 0.15),
      opacity: 1,
      landedTimer: 0
    };

    this.rings.push(ring);
    this.remainingRings--;
    this.isThrowing = true;
  }

  reset(): void {
    this.poles = this.createPoles();
    this.rings = [];
    this.remainingRings = TOTAL_RINGS;
    this.totalScore = 0;
    this.isGameOver = false;
    this.isThrowing = false;
    this.aimAngle = -Math.PI / 2;
    this.aimPower = 0;
    this.isCharging = false;
    this.message = '';
    this.messageTimer = 0;
    this.particles = [];
  }

  // ---- Game Loop ----

  tick(): boolean {
    if (this.isGameOver) return false;

    // Update charge power
    if (this.isCharging) {
      this.aimPower = Math.min(this.aimPower + 0.2, THROW_POWER);
    }

    // Update message timer
    if (this.messageTimer > 0) {
      this.messageTimer--;
      if (this.messageTimer <= 0) {
        this.message = '';
      }
    }

    // Update particles
    this.updateParticles();

    // Update active rings
    let anyActive = false;
    for (const ring of this.rings) {
      if (!ring.active) continue;
      anyActive = true;
      this.updateRing(ring);
    }

    // Check if throwing is done
    if (this.isThrowing && !anyActive) {
      this.isThrowing = false;

      // Check game over
      if (this.remainingRings <= 0) {
        this.isGameOver = true;
      }
    }

    return true;
  }

  // ---- Physics ----

  private updateRing(ring: Ring): void {
    if (!ring.active) return;

    // Gravity
    ring.vy += 0.25;

    // Air resistance
    ring.vx *= 0.995;
    ring.vy *= 0.995;

    // Move
    ring.x += ring.vx;
    ring.y += ring.vy;

    // Rotation
    ring.rotation += ring.rotationSpeed;

    // Check pole collisions
    for (const pole of this.poles) {
      if (pole.hasRing) continue;

      const d = dist(ring.x, ring.y, pole.x, pole.y);
      const catchThreshold = RING_RADIUS * 0.8;

      // Ring must be moving downward and close enough
      if (d < catchThreshold && ring.vy > 0) {
        // Scored!
        ring.active = false;
        ring.landed = true;
        ring.scored = true;
        ring.x = pole.x;
        ring.y = pole.y;
        ring.vx = 0;
        ring.vy = 0;
        ring.rotationSpeed = 0;
        pole.hasRing = true;
        pole.ringColor = ring.color;

        this.totalScore += pole.score;
        this.message = `+${pole.score}`;
        this.messageTimer = 60;

        // Spawn particles
        this.spawnScoreParticles(pole.x, pole.y, pole.color);
        return;
      }
    }

    // Check ground collision
    if (ring.y > this.canvasHeight - 20) {
      ring.active = false;
      ring.landed = true;
      ring.y = this.canvasHeight - 20;
      ring.vx = 0;
      ring.vy = 0;
      ring.rotationSpeed = 0;
      return;
    }

    // Check wall collisions
    if (ring.x < ring.radius) {
      ring.x = ring.radius;
      ring.vx = -ring.vx * 0.5;
    }
    if (ring.x > this.canvasWidth - ring.radius) {
      ring.x = this.canvasWidth - ring.radius;
      ring.vx = -ring.vx * 0.5;
    }

    // Off screen top (shouldn't happen normally, but safety)
    if (ring.y < -100) {
      ring.active = false;
      ring.landed = true;
    }
  }

  // ---- Particles ----

  private spawnScoreParticles(x: number, y: number, color: string): void {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20 + randomRange(-0.2, 0.2);
      const speed = randomRange(1, 4);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 40 + Math.random() * 20,
        maxLife: 60,
        color,
        size: randomRange(2, 5)
      });
    }
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.vx *= 0.98;
      p.life--;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
}
