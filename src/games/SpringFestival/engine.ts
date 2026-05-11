export interface Firework {
  id: number;
  x: number;
  y: number;
  color: string;
  exploded: boolean;
  particles: Particle[];
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface GameState {
  score: number;
  level: number;
  lives: number;
  fireworks: Firework[];
  timeLeft: number;
  gameOver: boolean;
}

export interface SpringFestivalEngine {
  initialize(): void;
  launchFirework(x: number, y: number): void;
  update(): void;
  getState(): GameState;
  increaseScore(): void;
  nextLevel(): void;
  reset(): void;
}

const COLORS = ['#ff0000', '#ff6600', '#ffcc00', '#ffff00', '#cc00ff', '#ff00cc', '#00ff00', '#00ffff', '#0066ff'];

export class SpringFestivalEngineClass implements SpringFestivalEngine {
  private state: GameState;
  private canvasWidth: number = 800;
  private canvasHeight: number = 600;
  private fireworkIdCounter: number = 0;
  private particleIdCounter: number = 0;

  constructor() {
    this.state = {
      score: 0,
      level: 1,
      lives: 3,
      fireworks: [],
      timeLeft: 60,
      gameOver: false,
    };
  }

  initialize(): void {
    this.state = {
      score: 0,
      level: 1,
      lives: 3,
      fireworks: [],
      timeLeft: 60,
      gameOver: false,
    };
  }

  launchFirework(x: number, y: number): void {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const firework: Firework = {
      id: this.fireworkIdCounter++,
      x: x,
      y: this.canvasHeight - 50,
      color: color,
      exploded: false,
      particles: [],
      active: true,
    };
    
    this.state.fireworks.push(firework);
  }

  update(): void {
    if (this.state.gameOver) return;

    this.state.fireworks.forEach(fw => {
      if (!fw.exploded) {
        const targetY = 100 + Math.random() * 200;
        fw.y -= 5 + this.state.level;
        
        if (fw.y <= targetY) {
          fw.exploded = true;
          this.createParticles(fw);
          this.state.score += 10 * this.state.level;
        }
      } else {
        fw.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.1;
          p.life -= 0.02;
        });
        
        fw.particles = fw.particles.filter(p => p.life > 0);
        
        if (fw.particles.length === 0) {
          fw.active = false;
        }
      }
    });
    
    this.state.fireworks = this.state.fireworks.filter(fw => fw.active);
    
    if (this.state.score >= this.state.level * 500) {
      this.nextLevel();
    }
  }

  private createParticles(fw: Firework): void {
    const count = 20 + this.state.level * 5;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 3 + Math.random() * 4;
      fw.particles.push({
        x: fw.x,
        y: fw.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color: fw.color,
      });
    }
  }

  increaseScore(): void {
    this.state.score += 50;
  }

  nextLevel(): void {
    this.state.level++;
    this.state.timeLeft += 30;
  }

  reset(): void {
    this.initialize();
  }

  getState(): GameState {
    return { ...this.state };
  }
}

export const SpringFestivalEngine = SpringFestivalEngineClass;
