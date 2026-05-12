// WaterPhysics Engine - 水流动物理模拟引擎

export interface WaterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  density: number;
  pressure: number;
}

export interface WaterSurface {
  points: number[];
  velocities: number[];
}

export interface WaterPhysicsState {
  particles: WaterParticle[];
  surface: WaterSurface;
  containerWidth: number;
  containerHeight: number;
  waveAmplitude: number;
  waveFrequency: number;
  time: number;
  flowRate: number;
  viscosity: number;
  mode: 'idle' | 'pouring' | 'draining';
  score: number;
  collected: number;
  target: number;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PARTICLE_COUNT = 200;
const GRAVITY = 0.3;
const SURFACE_POINTS = 50;
const VISCOSITY = 0.98;
const SPACING = 8;

export class WaterPhysicsEngine {
  private particles: WaterParticle[] = [];
  private surfacePoints: number[] = [];
  private surfaceVelocities: number[] = [];
  private containerWidth: number;
  private containerHeight: number;
  private waveAmplitude: number;
  private waveFrequency: number;
  private time: number;
  private flowRate: number;
  private viscosity: number;
  private mode: 'idle' | 'pouring' | 'draining';
  private score: number;
  private collected: number;
  private target: number;
  private pourX: number;
  private containerLeft: number;
  private containerRight: number;
  private containerBottom: number;
  private drainX: number;
  private drainOpen: boolean;

  constructor() {
    this.containerWidth = 300;
    this.containerHeight = 400;
    this.containerLeft = (CANVAS_WIDTH - this.containerWidth) / 2;
    this.containerRight = this.containerLeft + this.containerWidth;
    this.containerBottom = CANVAS_HEIGHT - 50;
    this.waveAmplitude = 5;
    this.waveFrequency = 0.1;
    this.time = 0;
    this.flowRate = 3;
    this.viscosity = VISCOSITY;
    this.mode = 'idle';
    this.score = 0;
    this.collected = 0;
    this.target = 100;
    this.pourX = CANVAS_WIDTH / 2;
    this.drainX = this.containerLeft + 50;
    this.drainOpen = false;
    
    this.initSurface();
    this.initParticles();
  }

  private initSurface(): void {
    this.surfacePoints = [];
    this.surfaceVelocities = [];
    for (let i = 0; i <= SURFACE_POINTS; i++) {
      this.surfacePoints.push(CANVAS_HEIGHT - this.containerHeight - 50);
      this.surfaceVelocities.push(0);
    }
  }

  private initParticles(): void {
    this.particles = [];
    const startY = CANVAS_HEIGHT - this.containerHeight - 50;
    const cols = Math.floor(this.containerWidth / SPACING);
    const rows = Math.floor(this.containerHeight / SPACING);
    
    for (let row = 0; row < rows && this.particles.length < PARTICLE_COUNT; row++) {
      for (let col = 0; col < cols && this.particles.length < PARTICLE_COUNT; col++) {
        this.particles.push({
          x: this.containerLeft + col * SPACING + Math.random() * 2,
          y: startY + row * SPACING + Math.random() * 2,
          vx: 0,
          vy: 0,
          density: 1,
          pressure: 0
        });
      }
    }
  }

  private createParticle(x: number, y: number): WaterParticle | null {
    if (this.particles.length >= PARTICLE_COUNT * 2) return null;
    
    return {
      x: x + (Math.random() - 0.5) * 10,
      y: y,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 2,
      density: 1,
      pressure: 0
    };
  }

  private updateSurface(): void {
    const waterLevel = CANVAS_HEIGHT - this.containerHeight - 50;
    const wavePhase = this.time * this.waveFrequency;
    
    for (let i = 0; i <= SURFACE_POINTS; i++) {
      const x = (i / SURFACE_POINTS) * this.containerWidth + this.containerLeft;
      const particleCount = this.particles.filter(p => 
        p.x >= this.containerLeft && 
        p.x <= this.containerRight &&
        p.y < waterLevel + 50
      ).length;
      
      const baseWave = Math.sin(wavePhase + i * 0.3) * this.waveAmplitude;
      const particleWave = (particleCount / 20) * Math.sin(wavePhase * 2 + i * 0.5);
      
      const leftNeighbor = i > 0 ? this.surfacePoints[i - 1] : this.surfacePoints[i];
      const rightNeighbor = i < SURFACE_POINTS ? this.surfacePoints[i + 1] : this.surfacePoints[i];
      
      const acceleration = (leftNeighbor + rightNeighbor - 2 * this.surfacePoints[i]) * 0.1;
      this.surfaceVelocities[i] += acceleration;
      this.surfaceVelocities[i] *= 0.95;
      this.surfacePoints[i] += this.surfaceVelocities[i];
      this.surfacePoints[i] = waterLevel + baseWave + particleWave * 0.5;
    }
  }

  private updateParticles(): void {
    for (const particle of this.particles) {
      particle.vy += GRAVITY;
      
      particle.vx *= this.viscosity;
      particle.vy *= this.viscosity;
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      const inContainer = particle.x >= this.containerLeft && 
                         particle.x <= this.containerRight &&
                         particle.y >= CANVAS_HEIGHT - this.containerHeight - 50;
      
      if (inContainer) {
        const waterLevel = CANVAS_HEIGHT - this.containerHeight - 50;
        if (particle.y < waterLevel) {
          particle.y = waterLevel;
          particle.vy *= -0.3;
        }
        
        if (particle.x < this.containerLeft + 2) {
          particle.x = this.containerLeft + 2;
          particle.vx *= -0.5;
        }
        if (particle.x > this.containerRight - 2) {
          particle.x = this.containerRight - 2;
          particle.vx *= -0.5;
        }
        
        for (const other of this.particles) {
          if (other === particle) continue;
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < SPACING && dist > 0) {
            const overlap = SPACING - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            
            particle.x -= nx * overlap * 0.5;
            particle.y -= ny * overlap * 0.5;
            other.x += nx * overlap * 0.5;
            other.y += ny * overlap * 0.5;
            
            const relVx = particle.vx - other.vx;
            const relVy = particle.vy - other.vy;
            const dot = relVx * nx + relVy * ny;
            
            particle.vx -= dot * nx * 0.3;
            particle.vy -= dot * ny * 0.3;
            other.vx += dot * nx * 0.3;
            other.vy += dot * ny * 0.3;
          }
        }
      } else {
        if (particle.y > this.containerBottom) {
          particle.vy *= -0.3;
          particle.y = this.containerBottom;
        }
      }
      
      if (particle.x < 0 || particle.x > CANVAS_WIDTH) {
        particle.vx *= -0.5;
        particle.x = Math.max(0, Math.min(CANVAS_WIDTH, particle.x));
      }
    }
  }

  getState(): WaterPhysicsState {
    return {
      particles: this.particles.map(p => ({ ...p })),
      surface: {
        points: [...this.surfacePoints],
        velocities: [...this.surfaceVelocities]
      },
      containerWidth: this.containerWidth,
      containerHeight: this.containerHeight,
      waveAmplitude: this.waveAmplitude,
      waveFrequency: this.waveFrequency,
      time: this.time,
      flowRate: this.flowRate,
      viscosity: this.viscosity,
      mode: this.mode,
      score: this.score,
      collected: this.collected,
      target: this.target
    };
  }

  setPourPosition(x: number): void {
    this.pourX = Math.max(50, Math.min(CANVAS_WIDTH - 50, x));
  }

  startPouring(): void {
    this.mode = 'pouring';
  }

  stopPouring(): void {
    this.mode = 'idle';
  }

  toggleDrain(): void {
    this.drainOpen = !this.drainOpen;
  }

  tick(): void {
    this.time++;
    
    if (this.mode === 'pouring') {
      for (let i = 0; i < this.flowRate; i++) {
        const particle = this.createParticle(this.pourX, 30);
        if (particle) {
          this.particles.push(particle);
        }
      }
    }
    
    if (this.drainOpen) {
      const drainRadius = 25;
      this.particles = this.particles.filter(p => {
        const dx = p.x - this.drainX;
        const dy = p.y - this.containerBottom;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < drainRadius && p.y > this.containerBottom - 30) {
          this.collected++;
          this.score += 1;
          return false;
        }
        return true;
      });
    }
    
    this.updateParticles();
    this.updateSurface();
    
    if (this.collected >= this.target && this.mode === 'idle') {
      this.score += 500;
      this.collected = 0;
      this.target += 50;
    }
  }

  reset(): void {
    this.particles = [];
    this.initParticles();
    this.initSurface();
    this.time = 0;
    this.mode = 'idle';
    this.score = 0;
    this.collected = 0;
    this.target = 100;
    this.drainOpen = false;
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
