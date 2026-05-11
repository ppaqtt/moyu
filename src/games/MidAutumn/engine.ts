export interface Mooncake {
  id: number;
  x: number;
  y: number;
  color: string;
  type: string;
  clicked: boolean;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  twinkle: number;
}

export interface GameState {
  score: number;
  timeLeft: number;
  mooncakes: Mooncake[];
  gameOver: boolean;
  level: number;
  combo: number;
}

export interface MidAutumnEngine {
  initialize(): void;
  spawnMooncake(): void;
  clickMooncake(id: number): boolean;
  update(deltaTime: number): void;
  getState(): GameState;
  reset(): void;
}

const MOONCAKE_TYPES = [
  { color: '#ffcc00', name: 'lotus', points: 10 },
  { color: '#ff9900', name: 'redbean', points: 15 },
  { color: '#ff6600', name: 'blacksesame', points: 20 },
  { color: '#cc9966', name: 'matcha', points: 25 },
  { color: '#ff3366', name: 'strawberry', points: 30 },
];

export class MidAutumnEngineClass implements MidAutumnEngine {
  private state: GameState;
  private canvasWidth: number = 800;
  private canvasHeight: number = 600;
  private mooncakeIdCounter: number = 0;
  private spawnTimer: number = 0;
  private stars: Star[] = [];

  constructor() {
    this.state = {
      score: 0,
      timeLeft: 60,
      mooncakes: [],
      gameOver: false,
      level: 1,
      combo: 0,
    };
    this.generateStars();
  }

  private generateStars() {
    this.stars = [];
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        size: Math.random() * 3 + 1,
        twinkle: Math.random(),
      });
    }
  }

  initialize(): void {
    this.state = {
      score: 0,
      timeLeft: 60,
      mooncakes: [],
      gameOver: false,
      level: 1,
      combo: 0,
    };
    this.mooncakeIdCounter = 0;
  }

  spawnMooncake(): void {
    const type = MOONCAKE_TYPES[Math.floor(Math.random() * MOONCAKE_TYPES.length)];
    const mooncake: Mooncake = {
      id: this.mooncakeIdCounter++,
      x: Math.random() * (this.canvasWidth - 80),
      y: Math.random() * (this.canvasHeight - 80),
      color: type.color,
      type: type.name,
      clicked: false,
    };
    
    this.state.mooncakes.push(mooncake);
    
    if (this.state.mooncakes.length > 15) {
      this.state.mooncakes.shift();
    }
  }

  update(deltaTime: number): void {
    if (this.state.gameOver) return;

    this.state.timeLeft -= deltaTime / 1000;
    
    if (this.state.timeLeft <= 0) {
      this.state.timeLeft = 0;
      this.state.gameOver = true;
      return;
    }

    this.spawnTimer += deltaTime;
    const spawnInterval = Math.max(500, 2000 - this.state.level * 200);
    
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnMooncake();
    }

    if (this.state.score >= this.state.level * 500) {
      this.state.level++;
    }
  }

  clickMooncake(id: number): boolean {
    const mooncake = this.state.mooncakes.find(m => m.id === id && !m.clicked);
    if (mooncake) {
      mooncake.clicked = true;
      const type = MOONCAKE_TYPES.find(t => t.name === mooncake.type);
      if (type) {
        this.state.score += type.points * (1 + this.state.combo * 0.1);
      }
      this.state.combo++;
      
      setTimeout(() => {
        const index = this.state.mooncakes.findIndex(m => m.id === id);
        if (index !== -1) {
          this.state.mooncakes.splice(index, 1);
        }
      }, 300);
      
      return true;
    }
    this.state.combo = 0;
    return false;
  }

  reset(): void {
    this.initialize();
  }

  getState(): GameState {
    return { ...this.state };
  }

  getStars(): Star[] {
    return this.stars;
  }
}

export const MidAutumnEngine = MidAutumnEngineClass;
