import { FRUIT_NINJA_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT, FRUIT_SIZE, FRUIT_SPEED, SPAWN_INTERVAL } = FRUIT_NINJA_CONSTANTS;

interface Point {
  x: number;
  y: number;
}

interface Fruit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'apple' | 'orange' | 'watermelon' | 'banana' | 'grape' | 'bomb';
  radius: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  sliced: boolean;
  sliceAngle: number;
}

interface Blade {
  points: Point[];
  alpha: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  life: number;
}

type GameCallback = (state: {
  score: number;
  combo: number;
  maxCombo: number;
  isGameOver: boolean;
  fruits: Fruit[];
  blades: Blade[];
  particles: Particle[];
}) => void;

export class FruitNinjaEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private fruits: Fruit[] = [];
  private blades: Blade[] = [];
  private particles: Particle[] = [];
  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private comboTimer = 0;
  private isGameOver = false;
  private animationId: number | null = null;
  private lastTime = 0;
  private spawnTimer = 0;
  private isSlicing = false;
  private currentBlade: Point[] = [];
  private fruitColors: Record<string, string> = {
    apple: '#ff4757',
    orange: '#ffa502',
    watermelon: '#2ed573',
    banana: '#ffd32a',
    grape: '#9c88ff',
    bomb: '#2f3542'
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private handleMouseDown(e: MouseEvent): void {
    if (this.isGameOver) return;
    this.isSlicing = true;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.currentBlade = [{
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }];
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isSlicing || this.isGameOver) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const point = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
    this.currentBlade.push(point);
    if (this.currentBlade.length > 10) {
      this.currentBlade.shift();
    }
    this.checkSlice();
    this.addBladePoint(point);
  }

  private handleMouseUp(): void {
    this.isSlicing = false;
    this.currentBlade = [];
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (this.isGameOver) return;
    this.isSlicing = true;
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.currentBlade = [{
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    }];
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (!this.isSlicing || this.isGameOver) return;
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const point = {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    };
    this.currentBlade.push(point);
    if (this.currentBlade.length > 10) {
      this.currentBlade.shift();
    }
    this.checkSlice();
    this.addBladePoint(point);
  }

  private handleTouchEnd(): void {
    this.isSlicing = false;
    this.currentBlade = [];
  }

  private addBladePoint(point: Point): void {
    if (this.currentBlade.length < 2) return;
    const lastPoint = this.currentBlade[this.currentBlade.length - 2];
    const blade: Blade = {
      points: [lastPoint, point],
      alpha: 1
    };
    this.blades.push(blade);
  }

  private checkSlice(): void {
    if (this.currentBlade.length < 2) return;

    for (const fruit of this.fruits) {
      if (fruit.sliced) continue;

      for (let i = 1; i < this.currentBlade.length; i++) {
        const p1 = this.currentBlade[i - 1];
        const p2 = this.currentBlade[i];

        if (this.lineCircleIntersect(p1, p2, fruit, fruit.radius)) {
          this.sliceFruit(fruit, p1, p2);
          break;
        }
      }
    }
  }

  private lineCircleIntersect(p1: Point, p2: Point, circle: Point, radius: number): boolean {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const fx = p1.x - circle.x;
    const fy = p1.y - circle.y;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;

    let discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return false;

    discriminant = Math.sqrt(discriminant);
    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);

    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
  }

  private sliceFruit(fruit: Fruit, p1: Point, p2: Point): void {
    fruit.sliced = true;
    fruit.sliceAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    if (fruit.type === 'bomb') {
      this.isGameOver = true;
      this.createExplosion(fruit.x, fruit.y, '#ff4757');
      return;
    }

    this.combo++;
    this.comboTimer = 60;
    this.maxCombo = Math.max(this.maxCombo, this.combo);

    const baseScore = 10;
    const comboBonus = Math.floor(this.combo / 3);
    const totalScore = baseScore + comboBonus * 5;
    this.score += totalScore;

    this.createSliceEffect(fruit);
    this.createJuiceParticles(fruit);
  }

  private createSliceEffect(fruit: Fruit): void {
    const colors = [fruit.color, this.lightenColor(fruit.color)];

    for (let i = 0; i < 3; i++) {
      const angle = fruit.sliceAngle + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 5;
      this.particles.push({
        x: fruit.x,
        y: fruit.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: colors[i % 2],
        size: 8 + Math.random() * 8,
        life: 30 + Math.random() * 20
      });
    }
  }

  private createJuiceParticles(fruit: Fruit): void {
    const juiceColors = [fruit.color, this.lightenColor(fruit.color), '#ffffff'];

    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: fruit.x,
        y: fruit.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        alpha: 1,
        color: juiceColors[i % 3],
        size: 4 + Math.random() * 6,
        life: 40 + Math.random() * 30
      });
    }
  }

  private createExplosion(x: number, y: number, color: string): void {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 10;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: i % 2 === 0 ? color : '#ffa502',
        size: 6 + Math.random() * 10,
        life: 50 + Math.random() * 30
      });
    }
  }

  private lightenColor(color: string): string {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const lighten = 40;
    return `rgb(${Math.min(255, r + lighten)}, ${Math.min(255, g + lighten)}, ${Math.min(255, b + lighten)})`;
  }

  private spawnFruit(): void {
    const types: Fruit['type'][] = ['apple', 'orange', 'watermelon', 'banana', 'grape'];
    const bombChance = 0.1 + (this.score / 1000) * 0.05;
    const type = Math.random() < bombChance ? 'bomb' : types[Math.floor(Math.random() * types.length)];

    const radius = type === 'watermelon' ? FRUIT_SIZE / 2 + 10 :
                   type === 'grape' ? FRUIT_SIZE / 2 - 8 :
                   FRUIT_SIZE / 2;

    const x = radius + Math.random() * (CANVAS_WIDTH - radius * 2);
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    const speed = FRUIT_SPEED + Math.random() * 3;

    const fruit: Fruit = {
      x,
      y: CANVAS_HEIGHT + radius,
      vx: Math.cos(angle) * speed * 0.5,
      vy: Math.sin(angle) * speed,
      type,
      radius,
      color: this.fruitColors[type],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      sliced: false,
      sliceAngle: 0
    };

    this.fruits.push(fruit);
  }

  private update(deltaTime: number): void {
    if (this.isGameOver) return;

    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= SPAWN_INTERVAL) {
      this.spawnFruit();
      const spawnCount = 1 + Math.floor(this.score / 200);
      for (let i = 0; i < Math.min(spawnCount - 1, 2); i++) {
        if (Math.random() < 0.5) {
          this.spawnFruit();
        }
      }
      this.spawnTimer = 0;
    }

    if (this.comboTimer > 0) {
      this.comboTimer--;
    } else {
      this.combo = 0;
    }

    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const fruit = this.fruits[i];
      fruit.x += fruit.vx;
      fruit.y += fruit.vy;
      fruit.vy += 0.15;
      fruit.rotation += fruit.rotationSpeed;

      if (fruit.y > CANVAS_HEIGHT + fruit.radius * 2) {
        if (!fruit.sliced && fruit.type !== 'bomb') {
          this.combo = 0;
        }
        this.fruits.splice(i, 1);
      }
    }

    for (let i = this.blades.length - 1; i >= 0; i--) {
      this.blades[i].alpha -= 0.08;
      if (this.blades[i].alpha <= 0) {
        this.blades.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.alpha -= 1 / p.life;
      p.size *= 0.98;

      if (p.alpha <= 0 || p.size < 1) {
        this.particles.splice(i, 1);
      }
    }
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawBackground();

    for (const particle of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    for (const blade of this.blades) {
      this.drawBlade(blade);
    }

    for (const fruit of this.fruits) {
      this.drawFruit(fruit);
    }

    if (this.currentBlade.length > 1 && this.isSlicing) {
      this.drawCurrentBlade();
    }
  }

  private drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0f0f1a');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 50; i++) {
      const x = (i * 73) % CANVAS_WIDTH;
      const y = (i * 47) % CANVAS_HEIGHT;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 1, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawFruit(fruit: Fruit): void {
    this.ctx.save();
    this.ctx.translate(fruit.x, fruit.y);
    this.ctx.rotate(fruit.rotation);

    if (fruit.sliced) {
      this.ctx.globalAlpha = 0.7;
      this.ctx.save();
      this.ctx.rotate(fruit.sliceAngle - fruit.rotation);
      this.ctx.fillStyle = fruit.color;

      this.ctx.beginPath();
      this.ctx.arc(-fruit.radius * 0.3, 0, fruit.radius, Math.PI * 0.5, Math.PI * 1.5);
      this.ctx.fill();

      this.ctx.fillStyle = this.lightenColor(fruit.color);
      this.ctx.beginPath();
      this.ctx.arc(fruit.radius * 0.3, 0, fruit.radius, -Math.PI * 0.5, Math.PI * 0.5);
      this.ctx.fill();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, fruit.radius * 0.15, fruit.radius * 0.4, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    } else {
      const gradient = this.ctx.createRadialGradient(
        -fruit.radius * 0.3, -fruit.radius * 0.3, 0,
        0, 0, fruit.radius
      );
      gradient.addColorStop(0, this.lightenColor(fruit.color));
      gradient.addColorStop(1, fruit.color);

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, fruit.radius, 0, Math.PI * 2);
      this.ctx.fill();

      if (fruit.type !== 'bomb') {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(-fruit.radius * 0.3, -fruit.radius * 0.3, fruit.radius * 0.25, fruit.radius * 0.15, -0.5, 0, Math.PI * 2);
        this.ctx.fill();
      }

      if (fruit.type === 'bomb') {
        this.ctx.strokeStyle = '#ff4757';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, fruit.radius * 0.6, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.fillStyle = '#ff4757';
        this.ctx.font = `bold ${fruit.radius * 0.8}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('💣', 0, 0);
      }
    }

    this.ctx.restore();
  }

  private drawBlade(blade: Blade): void {
    if (blade.points.length < 2) return;

    this.ctx.save();
    this.ctx.globalAlpha = blade.alpha;

    const gradient = this.ctx.createLinearGradient(
      blade.points[0].x, blade.points[0].y,
      blade.points[1].x, blade.points[1].y
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 15;

    this.ctx.beginPath();
    this.ctx.moveTo(blade.points[0].x, blade.points[0].y);
    this.ctx.lineTo(blade.points[1].x, blade.points[1].y);
    this.ctx.stroke();

    this.ctx.restore();
  }

  private drawCurrentBlade(): void {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.shadowColor = '#00d2ff';
    this.ctx.shadowBlur = 20;

    this.ctx.beginPath();
    this.ctx.moveTo(this.currentBlade[0].x, this.currentBlade[0].y);
    for (let i = 1; i < this.currentBlade.length; i++) {
      this.ctx.lineTo(this.currentBlade[i].x, this.currentBlade[i].y);
    }
    this.ctx.stroke();

    this.ctx.restore();
  }

  private gameLoop(timestamp: number): void {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.draw();

    this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  public start(callback: GameCallback): void {
    this.reset();
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public reset(): void {
    this.fruits = [];
    this.blades = [];
    this.particles = [];
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.isGameOver = false;
    this.spawnTimer = 0;
    this.isSlicing = false;
    this.currentBlade = [];
  }

  public getScore(): number {
    return this.score;
  }

  public getCombo(): number {
    return this.combo;
  }

  public getMaxCombo(): number {
    return this.maxCombo;
  }

  public isOver(): boolean {
    return this.isGameOver;
  }
}
