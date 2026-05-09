export interface Point {
  x: number;
  y: number;
}

export interface SandParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  settled: boolean;
  life: number;
}

export interface SandArtState {
  particles: SandParticle[];
  isPouring: boolean;
  selectedColor: string;
  pourRate: number;
  particleSize: number;
  gravity: number;
  wind: number;
  totalParticles: number;
}

export const SAND_COLORS = [
  { name: '金色', color: '#FFD700', gradient: ['#FFD700', '#FFA500'] },
  { name: '红色', color: '#FF6B6B', gradient: ['#FF6B6B', '#EE5A5A'] },
  { name: '蓝色', color: '#4ECDC4', gradient: ['#4ECDC4', '#45B7AA'] },
  { name: '绿色', color: '#96CEB4', gradient: ['#96CEB4', '#7CB89E'] },
  { name: '紫色', color: '#DDA0DD', gradient: ['#DDA0DD', '#D48FD4'] },
  { name: '橙色', color: '#FFB347', gradient: ['#FFB347', '#FF9F40'] },
  { name: '粉色', color: '#FFB6C1', gradient: ['#FFB6C1', '#FF9EAA'] },
  { name: '青色', color: '#00CED1', gradient: ['#00CED1', '#00B8BA'] },
  { name: '棕色', color: '#D2691E', gradient: ['#D2691E', '#B85C1A'] },
  { name: '白色', color: '#F5F5F5', gradient: ['#F5F5F5', '#E8E8E8'] },
  { name: '黑色', color: '#2C2C2C', gradient: ['#2C2C2C', '#1A1A1A'] },
  { name: '彩虹', color: 'rainbow', gradient: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'] }
];

export const BACKGROUNDS = [
  { name: '黑色', color: '#0a0a1a' },
  { name: '深蓝', color: '#1a1a3e' },
  { name: '深紫', color: '#2d1b4e' },
  { name: '深绿', color: '#1a3a2f' },
  { name: '深红', color: '#3d1f1f' },
  { name: '木纹', color: 'wood' },
  { name: '星空', color: 'starry' }
];

export class SandArtEngine {
  private particles: SandParticle[] = [];
  private isPouring: boolean = false;
  private selectedColor: string = SAND_COLORS[0].color;
  private pourRate: number = 3;
  private particleSize: number = 3;
  private gravity: number = 0.5;
  private wind: number = 0;
  private backgroundColor: string = '#0a0a1a';
  private canvasWidth: number = 800;
  private canvasHeight: number = 500;
  private animationId: number | null = null;
  private pourPosition: Point | null = null;
  private colorIndex: number = 0;

  constructor() {
    this.init();
  }

  init(): void {
    this.particles = [];
    this.isPouring = false;
    this.selectedColor = SAND_COLORS[0].color;
    this.pourRate = 3;
    this.particleSize = 3;
    this.gravity = 0.5;
    this.wind = 0;
    this.backgroundColor = '#0a0a1a';
    this.pourPosition = null;
    this.colorIndex = 0;
  }

  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  getState(): SandArtState {
    return {
      particles: [...this.particles],
      isPouring: this.isPouring,
      selectedColor: this.selectedColor,
      pourRate: this.pourRate,
      particleSize: this.particleSize,
      gravity: this.gravity,
      wind: this.wind,
      totalParticles: this.particles.length
    };
  }

  startPouring(x: number, y: number): void {
    this.isPouring = true;
    this.pourPosition = { x, y };
  }

  updatePourPosition(x: number, y: number): void {
    if (this.isPouring) {
      this.pourPosition = { x, y };
    }
  }

  stopPouring(): void {
    this.isPouring = false;
    this.pourPosition = null;
  }

  pour(): void {
    if (!this.isPouring || !this.pourPosition) return;

    for (let i = 0; i < this.pourRate; i++) {
      const spread = 10;
      const x = this.pourPosition.x + (Math.random() - 0.5) * spread;
      const y = this.pourPosition.y + (Math.random() - 0.5) * spread;
      
      let color = this.selectedColor;
      if (color === 'rainbow') {
        const rainbowColors = SAND_COLORS.find(c => c.color === 'rainbow')?.gradient || ['#FF0000'];
        color = rainbowColors[this.colorIndex % rainbowColors.length];
        this.colorIndex++;
      }

      const particle: SandParticle = {
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5 + this.wind * 0.1,
        vy: Math.random() * 2,
        color,
        size: this.particleSize + Math.random() * 2,
        settled: false,
        life: 1
      };

      this.particles.push(particle);
    }
  }

  update(): void {
    this.pour();

    for (const particle of this.particles) {
      if (particle.settled) continue;

      particle.vy += this.gravity;
      particle.vx += (Math.random() - 0.5) * 0.1 + this.wind * 0.01;
      
      particle.x += particle.vx;
      particle.y += particle.vy;

      const friction = 0.98;
      particle.vx *= friction;
      particle.vy *= friction;

      if (particle.x < 0 || particle.x > this.canvasWidth) {
        particle.vx *= -0.5;
        particle.x = Math.max(0, Math.min(this.canvasWidth, particle.x));
      }

      if (particle.y >= this.canvasHeight - particle.size) {
        particle.y = this.canvasHeight - particle.size;
        particle.vy = 0;
        particle.vx *= 0.5;
        particle.settled = true;
      }

      for (const other of this.particles) {
        if (other === particle || !other.settled) continue;
        
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (particle.size + other.size) / 2;

        if (distance < minDistance && particle.y < other.y) {
          particle.y = other.y - minDistance;
          particle.vy = 0;
          particle.vx *= 0.3;
          
          if (Math.abs(particle.vx) < 0.1 && Math.abs(particle.vy) < 0.1) {
            particle.settled = true;
          }
          break;
        }
      }
    }

    const maxParticles = 5000;
    if (this.particles.length > maxParticles) {
      this.particles = this.particles.slice(-maxParticles);
    }
  }

  setColor(color: string): void {
    this.selectedColor = color;
  }

  setPourRate(rate: number): void {
    this.pourRate = Math.max(1, Math.min(10, rate));
  }

  setParticleSize(size: number): void {
    this.particleSize = Math.max(1, Math.min(8, size));
  }

  setGravity(gravity: number): void {
    this.gravity = Math.max(0.1, Math.min(2, gravity));
  }

  setWind(wind: number): void {
    this.wind = Math.max(-10, Math.min(10, wind));
  }

  setBackground(color: string): void {
    this.backgroundColor = color;
  }

  getBackgroundColor(): string {
    return this.backgroundColor;
  }

  clear(): void {
    this.particles = [];
  }

  reset(): void {
    this.init();
  }

  saveArt(): string {
    const canvas = document.createElement('canvas');
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    this.drawBackground(ctx);
    this.drawParticles(ctx);

    return canvas.toDataURL('image/png');
  }

  drawBackground(ctx: CanvasRenderingContext2D): void {
    if (this.backgroundColor === 'wood') {
      const gradient = ctx.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
      gradient.addColorStop(0, '#8B4513');
      gradient.addColorStop(0.5, '#A0522D');
      gradient.addColorStop(1, '#8B4513');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;
      for (let i = 0; i < this.canvasHeight; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(this.canvasWidth, i);
        ctx.stroke();
      }
    } else if (this.backgroundColor === 'starry') {
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
      
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * this.canvasWidth;
        const y = Math.random() * this.canvasHeight;
        const size = Math.random() * 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random()})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
  }

  drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(particle.x - particle.size / 4, particle.y - particle.size / 4, particle.size / 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);
    this.drawParticles(ctx);
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  getSettledCount(): number {
    return this.particles.filter(p => p.settled).length;
  }
}
