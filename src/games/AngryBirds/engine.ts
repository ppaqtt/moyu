// AngryBirds Physics Engine - 愤怒的小鸟

export interface Vec2 {
  x: number;
  y: number;
}

export interface Bird {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isLaunched: boolean;
  isDestroyed: boolean;
}

export interface Block {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  health: number;
  maxHealth: number;
  type: 'wood' | 'stone' | 'glass';
  vx: number;
  vy: number;
  isDestroyed: boolean;
}

export interface Pig {
  id: number;
  x: number;
  y: number;
  radius: number;
  health: number;
  isDestroyed: boolean;
  vx: number;
  vy: number;
}

export interface Slingshot {
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  pullX: number;
  pullY: number;
  maxPull: number;
}

export interface AngryBirdsState {
  birds: Bird[];
  blocks: Block[];
  pigs: Pig[];
  slingshot: Slingshot;
  currentBirdIndex: number;
  score: number;
  stars: number;
  level: number;
  phase: 'aiming' | 'flying' | 'settling' | 'complete' | 'failed';
  attempts: number;
  maxAttempts: number;
  destroyedBlocks: number;
  destroyedPigs: number;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;
const GRAVITY = 0.4;
const GROUND_Y = 450;
const FRICTION = 0.8;
const RESTITUTION = 0.3;

const BIRD_COLORS = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff'];
const BLOCK_TYPES = {
  wood: { health: 2, color: '#8B4513', points: 50 },
  stone: { health: 4, color: '#808080', points: 100 },
  glass: { health: 1, color: '#87CEEB', points: 25 }
};

const LEVELS = [
  {
    blocks: [
      { x: 400, y: GROUND_Y - 30, width: 80, height: 20, type: 'wood' },
      { x: 400, y: GROUND_Y - 60, width: 20, height: 40, type: 'wood' },
      { x: 480, y: GROUND_Y - 30, width: 80, height: 20, type: 'wood' },
    ],
    pigs: [
      { x: 440, y: GROUND_Y - 50, radius: 15, health: 2 }
    ]
  },
  {
    blocks: [
      { x: 350, y: GROUND_Y - 20, width: 20, height: 60, type: 'stone' },
      { x: 450, y: GROUND_Y - 20, width: 20, height: 60, type: 'stone' },
      { x: 400, y: GROUND_Y - 80, width: 120, height: 20, type: 'wood' },
      { x: 400, y: GROUND_Y - 100, width: 20, height: 40, type: 'glass' },
      { x: 520, y: GROUND_Y - 30, width: 60, height: 60, type: 'glass' },
    ],
    pigs: [
      { x: 400, y: GROUND_Y - 120, radius: 12, health: 1 },
      { x: 520, y: GROUND_Y - 60, radius: 15, health: 2 }
    ]
  },
  {
    blocks: [
      { x: 300, y: GROUND_Y - 30, width: 20, height: 60, type: 'wood' },
      { x: 380, y: GROUND_Y - 30, width: 20, height: 60, type: 'wood' },
      { x: 460, y: GROUND_Y - 30, width: 20, height: 60, type: 'stone' },
      { x: 540, y: GROUND_Y - 30, width: 20, height: 60, type: 'stone' },
      { x: 300, y: GROUND_Y - 90, width: 100, height: 20, type: 'glass' },
      { x: 380, y: GROUND_Y - 90, width: 100, height: 20, type: 'wood' },
      { x: 460, y: GROUND_Y - 90, width: 100, height: 20, type: 'wood' },
      { x: 420, y: GROUND_Y - 130, width: 180, height: 20, type: 'stone' },
    ],
    pigs: [
      { x: 340, y: GROUND_Y - 110, radius: 12, health: 1 },
      { x: 420, y: GROUND_Y - 150, radius: 15, health: 3 },
      { x: 540, y: GROUND_Y - 50, radius: 12, health: 2 }
    ]
  }
];

export class AngryBirdsEngine {
  private birds: Bird[] = [];
  private blocks: Block[] = [];
  private pigs: Pig[] = [];
  private slingshot: Slingshot;
  private currentBirdIndex: number;
  private score: number;
  private level: number;
  private phase: 'aiming' | 'flying' | 'settling' | 'complete' | 'failed';
  private attempts: number;
  private destroyedBlocks: number;
  private destroyedPigs: number;
  private settleTimer: number;
  private isDragging: boolean;

  constructor() {
    this.slingshot = {
      x: 80,
      y: GROUND_Y - 40,
      anchorX: 80,
      anchorY: GROUND_Y - 80,
      pullX: 80,
      pullY: GROUND_Y - 80,
      maxPull: 100
    };
    this.currentBirdIndex = 0;
    this.score = 0;
    this.level = 1;
    this.phase = 'aiming';
    this.attempts = 3;
    this.destroyedBlocks = 0;
    this.destroyedPigs = 0;
    this.settleTimer = 0;
    this.isDragging = false;
    this.loadLevel(1);
  }

  private loadLevel(levelNum: number) {
    const levelData = LEVELS[(levelNum - 1) % LEVELS.length];
    
    this.birds = [];
    for (let i = 0; i < 3; i++) {
      this.birds.push({
        id: i,
        x: this.slingshot.anchorX,
        y: this.slingshot.anchorY,
        vx: 0,
        vy: 0,
        radius: 15,
        color: BIRD_COLORS[i % BIRD_COLORS.length],
        isLaunched: false,
        isDestroyed: false
      });
    }

    this.blocks = levelData.blocks.map((b, i) => ({
      id: i,
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      rotation: 0,
      health: BLOCK_TYPES[b.type].health,
      maxHealth: BLOCK_TYPES[b.type].health,
      type: b.type,
      vx: 0,
      vy: 0,
      isDestroyed: false
    }));

    this.pigs = levelData.pigs.map((p, i) => ({
      id: i,
      x: p.x,
      y: p.y,
      radius: p.radius,
      health: p.health,
      isDestroyed: false,
      vx: 0,
      vy: 0
    }));

    this.currentBirdIndex = 0;
    this.destroyedBlocks = 0;
    this.destroyedPigs = 0;
    this.resetSlingshot();
  }

  private resetSlingshot() {
    const currentBird = this.birds[this.currentBirdIndex];
    if (currentBird && !currentBird.isLaunched) {
      this.slingshot.pullX = this.slingshot.anchorX;
      this.slingshot.pullY = this.slingshot.anchorY;
    }
  }

  getState(): AngryBirdsState {
    return {
      birds: this.birds.map(b => ({ ...b })),
      blocks: this.blocks.map(b => ({ ...b })),
      pigs: this.pigs.map(p => ({ ...p })),
      slingshot: { ...this.slingshot },
      currentBirdIndex: this.currentBirdIndex,
      score: this.score,
      stars: this.calculateStars(),
      level: this.level,
      phase: this.phase,
      attempts: this.attempts,
      maxAttempts: 3,
      destroyedBlocks: this.destroyedBlocks,
      destroyedPigs: this.destroyedPigs
    };
  }

  private calculateStars(): number {
    const totalBlocks = this.blocks.length;
    const remainingBlocks = this.blocks.filter(b => !b.isDestroyed).length;
    const progress = 1 - (remainingBlocks / totalBlocks);
    
    const pigsRemaining = this.pigs.filter(p => !p.isDestroyed).length;
    if (pigsRemaining === 0) {
      if (this.currentBirdIndex === 0 && this.attempts === 3) return 3;
      if (progress > 0.7) return 3;
      if (progress > 0.4) return 2;
      return 1;
    }
    return 0;
  }

  startDrag(x: number, y: number): void {
    if (this.phase !== 'aiming') return;
    const bird = this.birds[this.currentBirdIndex];
    if (!bird || bird.isLaunched) return;
    
    this.isDragging = true;
    const dx = x - this.slingshot.anchorX;
    const dy = y - this.slingshot.anchorY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > this.slingshot.maxPull) {
      const angle = Math.atan2(dy, dx);
      this.slingshot.pullX = this.slingshot.anchorX + Math.cos(angle) * this.slingshot.maxPull;
      this.slingshot.pullY = this.slingshot.anchorY + Math.sin(angle) * this.slingshot.maxPull;
    } else {
      this.slingshot.pullX = x;
      this.slingshot.pullY = y;
    }
  }

  updateDrag(x: number, y: number): void {
    if (!this.isDragging || this.phase !== 'aiming') return;
    
    const dx = x - this.slingshot.anchorX;
    const dy = y - this.slingshot.anchorY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > this.slingshot.maxPull) {
      const angle = Math.atan2(dy, dx);
      this.slingshot.pullX = this.slingshot.anchorX + Math.cos(angle) * this.slingshot.maxPull;
      this.slingshot.pullY = this.slingshot.anchorY + Math.sin(angle) * this.slingshot.maxPull;
    } else {
      this.slingshot.pullX = x;
      this.slingshot.pullY = y;
    }
  }

  endDrag(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    
    const bird = this.birds[this.currentBirdIndex];
    if (!bird || bird.isLaunched) return;

    const dx = this.slingshot.anchorX - this.slingshot.pullX;
    const dy = this.slingshot.anchorY - this.slingshot.pullY;
    const power = Math.sqrt(dx * dx + dy * dy);
    
    if (power > 10) {
      bird.isLaunched = true;
      bird.x = this.slingshot.pullX;
      bird.y = this.slingshot.pullY;
      bird.vx = dx * 0.15;
      bird.vy = dy * 0.15;
      this.phase = 'flying';
      this.attempts--;
    } else {
      this.resetSlingshot();
    }
  }

  private checkCollisions(): void {
    const bird = this.birds[this.currentBirdIndex];
    if (!bird || !bird.isLaunched) return;

    // Bird vs blocks
    for (const block of this.blocks) {
      if (block.isDestroyed) continue;
      
      if (this.circleRectCollision(bird.x, bird.y, bird.radius, block)) {
        const speed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
        const damage = Math.floor(speed / 5);
        
        if (damage >= 1) {
          block.health -= damage;
          block.vx += bird.vx * 0.3;
          block.vy += bird.vy * 0.3;
          this.score += 10;
          
          if (block.health <= 0) {
            block.isDestroyed = true;
            this.destroyedBlocks++;
            this.score += BLOCK_TYPES[block.type].points;
          }
        }
        
        bird.vx *= -RESTITUTION;
        bird.vy *= RESTITUTION;
      }
    }

    // Bird vs pigs
    for (const pig of this.pigs) {
      if (pig.isDestroyed) continue;
      
      const dx = bird.x - pig.x;
      const dy = bird.y - pig.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < bird.radius + pig.radius) {
        const speed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
        const damage = Math.floor(speed / 4);
        
        if (damage >= 1) {
          pig.health -= damage;
          pig.vx += bird.vx * 0.5;
          pig.vy += bird.vy * 0.5;
          
          if (pig.health <= 0) {
            pig.isDestroyed = true;
            this.destroyedPigs++;
            this.score += 500;
          }
        }
        
        bird.vx *= -RESTITUTION;
        bird.vy *= -RESTITUTION;
      }
    }

    // Block vs block collisions
    for (let i = 0; i < this.blocks.length; i++) {
      for (let j = i + 1; j < this.blocks.length; j++) {
        const a = this.blocks[i];
        const b = this.blocks[j];
        if (a.isDestroyed || b.isDestroyed) continue;
        
        if (this.rectRectCollision(a, b)) {
          const relVx = a.vx - b.vx;
          const relVy = a.vy - b.vy;
          
          a.vx -= relVx * 0.5;
          a.vy -= relVy * 0.5;
          b.vx += relVx * 0.5;
          b.vy += relVy * 0.5;
        }
      }
    }

    // Falling blocks damage pigs
    for (const block of this.blocks) {
      if (block.isDestroyed || Math.abs(block.vy) < 2) continue;
      
      for (const pig of this.pigs) {
        if (pig.isDestroyed) continue;
        
        if (this.rectCircleCollision(block, pig)) {
          pig.health -= 1;
          if (pig.health <= 0) {
            pig.isDestroyed = true;
            this.destroyedPigs++;
            this.score += 500;
          }
        }
      }
    }
  }

  private circleRectCollision(cx: number, cy: number, r: number, rect: Block): boolean {
    const closestX = Math.max(rect.x - rect.width / 2, Math.min(cx, rect.x + rect.width / 2));
    const closestY = Math.max(rect.y - rect.height / 2, Math.min(cy, rect.y + rect.height / 2));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (r * r);
  }

  private rectRectCollision(a: Block, b: Block): boolean {
    return Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
           Math.abs(a.y - b.y) < (a.height + b.height) / 2;
  }

  private rectCircleCollision(rect: Block, circle: Pig): boolean {
    const closestX = Math.max(rect.x - rect.width / 2, Math.min(circle.x, rect.x + rect.width / 2));
    const closestY = Math.max(rect.y - rect.height / 2, Math.min(circle.y, rect.y + rect.height / 2));
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return (dx * dx + dy * dy) < (circle.radius * circle.radius);
  }

  tick(): void {
    if (this.phase === 'complete' || this.phase === 'failed') return;

    // Apply gravity and physics to launched bird
    const bird = this.birds[this.currentBirdIndex];
    if (bird && bird.isLaunched && !bird.isDestroyed) {
      bird.vy += GRAVITY;
      bird.x += bird.vx;
      bird.y += bird.vy;
      bird.vx *= FRICTION;

      // Ground collision
      if (bird.y + bird.radius > GROUND_Y) {
        bird.y = GROUND_Y - bird.radius;
        bird.vy *= -RESTITUTION;
        bird.vx *= FRICTION;
      }

      // Wall collisions
      if (bird.x - bird.radius < 0) {
        bird.x = bird.radius;
        bird.vx *= -RESTITUTION;
      }
      if (bird.x + bird.radius > CANVAS_WIDTH) {
        bird.x = CANVAS_WIDTH - bird.radius;
        bird.vx *= -RESTITUTION;
      }

      // Check if bird stopped or fell off
      const speed = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
      if (bird.y > GROUND_Y - bird.radius && speed < 0.5) {
        this.phase = 'settling';
        this.settleTimer = 0;
      }
    }

    // Apply physics to blocks
    for (const block of this.blocks) {
      if (block.isDestroyed) continue;
      
      block.vy += GRAVITY;
      block.x += block.vx;
      block.y += block.vy;
      block.vx *= FRICTION;
      block.vy *= FRICTION;

      // Ground
      if (block.y + block.height / 2 > GROUND_Y) {
        block.y = GROUND_Y - block.height / 2;
        block.vy *= -RESTITUTION;
        block.vx *= FRICTION;
      }
    }

    // Apply physics to pigs
    for (const pig of this.pigs) {
      if (pig.isDestroyed) continue;
      
      pig.vy += GRAVITY;
      pig.x += pig.vx;
      pig.y += pig.vy;
      pig.vx *= FRICTION;
      pig.vy *= FRICTION;

      if (pig.y + pig.radius > GROUND_Y) {
        pig.y = GROUND_Y - pig.radius;
        pig.vy *= -RESTITUTION;
        pig.vx *= FRICTION;
      }
    }

    // Check collisions
    this.checkCollisions();

    // Settling phase
    if (this.phase === 'settling') {
      this.settleTimer++;
      
      let allSettled = true;
      for (const block of this.blocks) {
        if (!block.isDestroyed && (Math.abs(block.vx) > 0.1 || Math.abs(block.vy) > 0.1)) {
          allSettled = false;
          break;
        }
      }
      
      if (allSettled || this.settleTimer > 120) {
        this.checkWinLose();
      }
    }
  }

  private checkWinLose(): void {
    const allPigsDestroyed = this.pigs.every(p => p.isDestroyed);
    
    if (allPigsDestroyed) {
      this.phase = 'complete';
    } else if (this.currentBirdIndex >= 2) {
      this.phase = 'failed';
    } else {
      this.currentBirdIndex++;
      this.phase = 'aiming';
      this.resetSlingshot();
    }
  }

  reset(): void {
    this.loadLevel(this.level);
    this.attempts = 3;
    this.phase = 'aiming';
  }

  nextLevel(): void {
    this.level++;
    this.loadLevel(this.level);
    this.attempts = 3;
    this.phase = 'aiming';
  }

  setLevel(level: number): void {
    this.level = level;
    this.loadLevel(level);
    this.attempts = 3;
    this.phase = 'aiming';
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getGroundY() {
    return GROUND_Y;
  }
}
