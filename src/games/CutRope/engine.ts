// CutRope Physics Engine - 切割绳子

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rope {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  segments: RopeSegment[];
  isCut: boolean;
  cutIndex: number;
  restLength: number;
  stiffness: number;
  attached: boolean;
}

export interface RopeSegment {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
}

export interface Candy {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  attached: boolean;
  attachedRopeId: number | null;
  attachedSegmentIndex: number | null;
  collected: boolean;
}

export interface Star {
  id: number;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  collectedTime: number;
}

export interface Target {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'mouth' | 'basket';
  isActive: boolean;
}

export interface CutRopeState {
  ropes: Rope[];
  candy: Candy;
  stars: Star[];
  targets: Target[];
  score: number;
  level: number;
  phase: 'playing' | 'success' | 'failed';
  attempts: number;
  starsCollected: number;
  time: number;
  cutCount: number;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;
const GRAVITY = 0.4;
const FRICTION = 0.99;
const CONSTRAINT_ITERATIONS = 5;
const ROPE_SEGMENT_LENGTH = 15;
const CANDY_RADIUS = 15;

const LEVELS = [
  {
    ropes: [
      { startX: 100, startY: 50, endX: 200, endY: 150, attached: true },
      { startX: 200, startY: 150, endX: 250, endY: 280, attached: true },
    ],
    candyStart: { x: 200, y: 150 },
    stars: [
      { x: 150, y: 200, radius: 15 },
      { x: 280, y: 320, radius: 15 },
      { x: 200, y: 400, radius: 15 },
    ],
    targets: [
      { x: 320, y: 420, width: 60, height: 60, type: 'mouth' }
    ],
    obstacles: []
  },
  {
    ropes: [
      { startX: 80, startY: 50, endX: 150, endY: 180, attached: true },
      { startX: 150, startY: 180, endX: 250, endY: 180, attached: true },
      { startX: 300, startY: 80, endX: 300, endY: 250, attached: true },
    ],
    candyStart: { x: 150, y: 180 },
    stars: [
      { x: 200, y: 120, radius: 15 },
      { x: 100, y: 300, radius: 15 },
      { x: 350, y: 350, radius: 15 },
    ],
    targets: [
      { x: 50, y: 420, width: 60, height: 60, type: 'mouth' }
    ],
    obstacles: []
  },
  {
    ropes: [
      { startX: 200, startY: 50, endX: 200, endY: 150, attached: true },
      { startX: 100, startY: 100, endX: 200, endY: 150, attached: true },
      { startX: 300, startY: 100, endX: 200, endY: 150, attached: true },
    ],
    candyStart: { x: 200, y: 150 },
    stars: [
      { x: 200, y: 80, radius: 15 },
      { x: 100, y: 250, radius: 15 },
      { x: 300, y: 250, radius: 15 },
    ],
    targets: [
      { x: 170, y: 420, width: 60, height: 60, type: 'mouth' }
    ],
    obstacles: []
  },
  {
    ropes: [
      { startX: 80, startY: 50, endX: 80, endY: 200, attached: true },
      { startX: 320, startY: 50, endX: 320, endY: 200, attached: true },
      { startX: 80, startY: 200, endX: 320, endY: 200, attached: true },
      { startX: 200, startY: 200, endX: 200, endY: 300, attached: true },
    ],
    candyStart: { x: 200, y: 300 },
    stars: [
      { x: 150, y: 100, radius: 15 },
      { x: 250, y: 100, radius: 15 },
      { x: 200, y: 250, radius: 15 },
    ],
    targets: [
      { x: 170, y: 420, width: 60, height: 60, type: 'mouth' }
    ],
    obstacles: []
  },
  {
    ropes: [
      { startX: 200, startY: 50, endX: 200, endY: 150, attached: true },
      { startX: 200, startY: 150, endX: 120, endY: 280, attached: true },
      { startX: 200, startY: 150, endX: 280, endY: 280, attached: true },
    ],
    candyStart: { x: 200, y: 150 },
    stars: [
      { x: 80, y: 180, radius: 15 },
      { x: 320, y: 180, radius: 15 },
      { x: 200, y: 350, radius: 15 },
    ],
    targets: [
      { x: 170, y: 420, width: 60, height: 60, type: 'mouth' }
    ],
    obstacles: []
  }
];

export class CutRopeEngine {
  private ropes: Rope[] = [];
  private candy: Candy;
  private stars: Star[] = [];
  private targets: Target[] = [];
  private score: number;
  private level: number;
  private phase: 'playing' | 'success' | 'failed';
  private attempts: number;
  private starsCollected: number;
  private time: number;
  private cutCount: number;
  private levelData: typeof LEVELS[0];

  constructor() {
    this.score = 0;
    this.level = 1;
    this.phase = 'playing';
    this.attempts = 3;
    this.starsCollected = 0;
    this.time = 0;
    this.cutCount = 0;
    this.levelData = LEVELS[0];
    
    this.candy = {
      x: 0,
      y: 0,
      radius: CANDY_RADIUS,
      vx: 0,
      vy: 0,
      attached: true,
      attachedRopeId: null,
      attachedSegmentIndex: null,
      collected: false
    };
    
    this.loadLevel(1);
  }

  private loadLevel(levelNum: number): void {
    this.level = Math.min(levelNum, LEVELS.length);
    this.levelData = LEVELS[this.level - 1];
    
    // Reset state
    this.phase = 'playing';
    this.starsCollected = 0;
    this.time = 0;
    this.cutCount = 0;
    
    // Create candy
    this.candy = {
      x: this.levelData.candyStart.x,
      y: this.levelData.candyStart.y,
      radius: CANDY_RADIUS,
      vx: 0,
      vy: 0,
      attached: true,
      attachedRopeId: null,
      attachedSegmentIndex: null,
      collected: false
    };
    
    // Create ropes
    this.ropes = this.levelData.ropes.map((r, i) => this.createRope(i, r));
    
    // Find which rope the candy is attached to
    this.findCandyAttachment();
    
    // Create stars
    this.stars = this.levelData.stars.map((s, i) => ({
      ...s,
      id: i,
      collected: false,
      collectedTime: 0
    }));
    
    // Create targets
    this.targets = this.levelData.targets.map((t, i) => ({
      ...t,
      id: i,
      isActive: true
    }));
  }

  private createRope(id: number, data: { startX: number; startY: number; endX: number; endY: number; attached: boolean }): Rope {
    const segments: RopeSegment[] = [];
    const dx = data.endX - data.startX;
    const dy = data.endY - data.startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const numSegments = Math.max(3, Math.floor(length / ROPE_SEGMENT_LENGTH));
    
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      segments.push({
        x: data.startX + dx * t,
        y: data.startY + dy * t,
        prevX: data.startX + dx * t,
        prevY: data.startY + dy * t
      });
    }
    
    return {
      id,
      startX: data.startX,
      startY: data.startY,
      endX: data.endX,
      endY: data.endY,
      segments,
      isCut: false,
      cutIndex: -1,
      restLength: ROPE_SEGMENT_LENGTH,
      stiffness: 0.9,
      attached: data.attached
    };
  }

  private findCandyAttachment(): void {
    for (const rope of this.ropes) {
      const lastSeg = rope.segments[rope.segments.length - 1];
      const dx = this.candy.x - lastSeg.x;
      const dy = this.candy.y - lastSeg.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < CANDY_RADIUS * 2) {
        this.candy.attachedRopeId = rope.id;
        this.candy.attachedSegmentIndex = rope.segments.length - 1;
        return;
      }
    }
  }

  getState(): CutRopeState {
    return {
      ropes: this.ropes.map(r => ({
        ...r,
        segments: r.segments.map(s => ({ ...s }))
      })),
      candy: { ...this.candy },
      stars: this.stars.map(s => ({ ...s })),
      targets: this.targets.map(t => ({ ...t })),
      score: this.score,
      level: this.level,
      phase: this.phase,
      attempts: this.attempts,
      starsCollected: this.starsCollected,
      time: this.time,
      cutCount: this.cutCount
    };
  }

  cut(x1: number, y1: number, x2: number, y2: number): void {
    if (this.phase !== 'playing') return;
    
    for (const rope of this.ropes) {
      if (rope.isCut) continue;
      
      for (let i = 0; i < rope.segments.length - 1; i++) {
        const seg1 = rope.segments[i];
        const seg2 = rope.segments[i + 1];
        
        if (this.lineIntersects(x1, y1, x2, y2, seg1.x, seg1.y, seg2.x, seg2.y)) {
          rope.isCut = true;
          rope.cutIndex = i;
          this.cutCount++;
          
          // Check if candy was attached to this rope at or below cut
          if (this.candy.attachedRopeId === rope.id && 
              this.candy.attachedSegmentIndex !== null && 
              this.candy.attachedSegmentIndex >= i) {
            this.candy.attached = false;
            this.candy.attachedRopeId = null;
            this.candy.attachedSegmentIndex = null;
            
            // Transfer some momentum
            const seg = rope.segments[i];
            this.candy.vx = (seg.x - seg.prevX) * 2;
            this.candy.vy = (seg.y - seg.prevY) * 2;
          }
          return;
        }
      }
    }
  }

  private lineIntersects(x1: number, y1: number, x2: number, y2: number, 
                        x3: number, y3: number, x4: number, y4: number): boolean {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (Math.abs(denom) < 0.0001) return false;
    
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  private updateRopePhysics(rope: Rope): void {
    const segments = rope.segments;
    
    // Apply verlet integration
    for (const seg of segments) {
      const vx = (seg.x - seg.prevX) * FRICTION;
      const vy = (seg.y - seg.prevY) * FRICTION;
      
      seg.prevX = seg.x;
      seg.prevY = seg.y;
      
      seg.x += vx;
      seg.y += vy + GRAVITY;
    }
    
    // Constraint solving
    for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
      // Anchor first segment if attached
      if (rope.attached) {
        segments[0].x = rope.startX;
        segments[0].y = rope.startY;
      }
      
      // Distance constraints
      for (let i = 0; i < segments.length - 1; i++) {
        const seg1 = segments[i];
        const seg2 = segments[i + 1];
        
        const dx = seg2.x - seg1.x;
        const dy = seg2.y - seg1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const diff = (dist - rope.restLength) / dist;
        
        const offsetX = dx * diff * rope.stiffness * 0.5;
        const offsetY = dy * diff * rope.stiffness * 0.5;
        
        if (i > 0 || !rope.attached) {
          seg1.x += offsetX;
          seg1.y += offsetY;
        }
        if (i < segments.length - 2 || 
            (this.candy.attachedRopeId !== rope.id || this.candy.attachedSegmentIndex !== i + 1)) {
          seg2.x -= offsetX;
          seg2.y -= offsetY;
        }
      }
      
      // Boundary constraints
      for (const seg of segments) {
        if (seg.x < 0) seg.x = 0;
        if (seg.x > CANVAS_WIDTH) seg.x = CANVAS_WIDTH;
        if (seg.y < 0) {
          seg.y = 0;
          seg.prevY = seg.y + GRAVITY;
        }
        if (seg.y > CANVAS_HEIGHT) {
          seg.y = CANVAS_HEIGHT;
          seg.prevY = seg.y;
        }
      }
    }
    
    // Update candy position if attached
    if (this.candy.attached && this.candy.attachedRopeId === rope.id && this.candy.attachedSegmentIndex !== null) {
      const segIdx = Math.min(this.candy.attachedSegmentIndex, segments.length - 1);
      this.candy.x = segments[segIdx].x;
      this.candy.y = segments[segIdx].y;
    }
  }

  private checkStarCollection(): void {
    for (const star of this.stars) {
      if (star.collected) continue;
      
      const dx = this.candy.x - star.x;
      const dy = this.candy.y - star.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.candy.radius + star.radius) {
        star.collected = true;
        star.collectedTime = Date.now();
        this.starsCollected++;
        this.score += 100;
      }
    }
  }

  private checkTargetCollection(): void {
    for (const target of this.targets) {
      if (!target.isActive) continue;
      
      const targetCenterX = target.x + target.width / 2;
      const targetCenterY = target.y + target.height / 2;
      
      const dx = this.candy.x - targetCenterX;
      const dy = this.candy.y - targetCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.candy.radius + 25) {
        target.isActive = false;
        this.candy.collected = true;
        
        // Calculate score based on stars
        const starBonus = this.starsCollected * 100;
        const timeBonus = Math.max(0, 1000 - this.time * 2);
        this.score += 500 + starBonus + timeBonus;
        
        this.phase = 'success';
      }
    }
  }

  tick(): void {
    if (this.phase !== 'playing') return;
    
    this.time++;
    
    // Update rope physics
    for (const rope of this.ropes) {
      if (!rope.isCut) {
        this.updateRopePhysics(rope);
      }
    }
    
    // Update free candy
    if (!this.candy.attached) {
      this.candy.vy += GRAVITY;
      this.candy.vx *= FRICTION;
      this.candy.vy *= FRICTION;
      this.candy.x += this.candy.vx;
      this.candy.y += this.candy.vy;
      
      // Boundary collisions
      if (this.candy.x - this.candy.radius < 0) {
        this.candy.x = this.candy.radius;
        this.candy.vx *= -0.5;
      }
      if (this.candy.x + this.candy.radius > CANVAS_WIDTH) {
        this.candy.x = CANVAS_WIDTH - this.candy.radius;
        this.candy.vx *= -0.5;
      }
    }
    
    this.checkStarCollection();
    this.checkTargetCollection();
    
    // Check if candy fell off screen
    if (this.candy.y > CANVAS_HEIGHT + 50 && !this.candy.collected) {
      this.attempts--;
      if (this.attempts <= 0) {
        this.phase = 'failed';
      } else {
        this.resetLevel();
      }
    }
  }

  private resetLevel(): void {
    this.loadLevel(this.level);
    this.attempts++;
  }

  reset(): void {
    this.attempts = 3;
    this.loadLevel(this.level);
  }

  nextLevel(): void {
    if (this.level < LEVELS.length) {
      this.level++;
      this.attempts = 3;
      this.loadLevel(this.level);
    } else {
      this.phase = 'success';
    }
  }

  retry(): void {
    this.attempts = 3;
    this.loadLevel(this.level);
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
