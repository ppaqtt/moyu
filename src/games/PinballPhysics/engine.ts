// PinballPhysics Engine - 弹球物理

export interface Vec2 {
  x: number;
  y: number;
}

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isActive: boolean;
}

export interface Bumper {
  id: number;
  x: number;
  y: number;
  radius: number;
  type: 'round' | 'triangle' | 'slingshot';
  points: number;
  hitTimer: number;
}

export interface Flipper {
  x: number;
  y: number;
  length: number;
  angle: number;
  targetAngle: number;
  isLeft: boolean;
}

export interface Target {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isHit: boolean;
  points: number;
}

export interface Ramp {
  id: number;
  points: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isActivated: boolean;
}

export interface PinballState {
  balls: Ball[];
  bumpers: Bumper[];
  flippers: Flipper[];
  targets: Target[];
  score: number;
  multiball: boolean;
  ballCount: number;
  extraBalls: number;
  combo: number;
  lastHitTime: number;
  tilt: number;
  isTilted: boolean;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.25;
const FRICTION = 0.995;
const FLIPPER_POWER = 18;
const FLIPPER_SPEED = 0.3;
const BUMPER_BOUNCE = 1.5;

const BALL_COLORS = ['#ff4444', '#44ff44', '#4444ff', '#ffff00', '#ff44ff'];

export class PinballEngine {
  private balls: Ball[] = [];
  private bumpers: Bumper[] = [];
  private flippers: Flipper[] = [];
  private targets: Target[] = [];
  private ramps: Ramp[] = [];
  private score: number;
  private multiball: boolean;
  private extraBalls: number;
  private combo: number;
  private lastHitTime: number;
  private tilt: number;
  private isTilted: boolean;
  private drainTimer: number;
  private ballIdCounter: number;

  constructor() {
    this.score = 0;
    this.multiball = false;
    this.extraBalls = 0;
    this.combo = 0;
    this.lastHitTime = 0;
    this.tilt = 0;
    this.isTilted = false;
    this.drainTimer = 0;
    this.ballIdCounter = 0;
    
    this.initBumpers();
    this.initFlippers();
    this.initTargets();
    this.initRamps();
    this.addBall();
  }

  private initBumpers(): void {
    // Round bumpers in upper playfield
    this.bumpers = [
      { id: 0, x: 100, y: 150, radius: 25, type: 'round', points: 100, hitTimer: 0 },
      { id: 1, x: 200, y: 120, radius: 30, type: 'round', points: 150, hitTimer: 0 },
      { id: 2, x: 300, y: 150, radius: 25, type: 'round', points: 100, hitTimer: 0 },
      { id: 3, x: 150, y: 220, radius: 25, type: 'round', points: 100, hitTimer: 0 },
      { id: 4, x: 250, y: 220, radius: 25, type: 'round', points: 100, hitTimer: 0 },
      // Slingshots
      { id: 5, x: 60, y: 300, radius: 20, type: 'slingshot', points: 50, hitTimer: 0 },
      { id: 6, x: 340, y: 300, radius: 20, type: 'slingshot', points: 50, hitTimer: 0 },
    ];
  }

  private initFlippers(): void {
    this.flippers = [
      { x: 130, y: 530, length: 70, angle: 0.4, targetAngle: 0.4, isLeft: true },
      { x: 270, y: 530, length: 70, angle: Math.PI - 0.4, targetAngle: Math.PI - 0.4, isLeft: false },
    ];
  }

  private initTargets(): void {
    // Drop targets
    this.targets = [
      { id: 0, x: 80, y: 380, width: 25, height: 40, isHit: false, points: 500 },
      { id: 1, x: 115, y: 380, width: 25, height: 40, isHit: false, points: 500 },
      { id: 2, x: 150, y: 380, width: 25, height: 40, isHit: false, points: 500 },
      { id: 3, x: 185, y: 380, width: 25, height: 40, isHit: false, points: 500 },
      { id: 4, x: 220, y: 380, width: 25, height: 40, isHit: false, points: 500 },
      { id: 5, x: 255, y: 380, width: 25, height: 40, isHit: false, points: 500 },
      { id: 6, x: 290, y: 380, width: 25, height: 40, isHit: false, points: 500 },
    ];
  }

  private initRamps(): void {
    this.ramps = [
      { id: 0, points: 1000, startX: 80, startY: 500, endX: 150, endY: 200, isActivated: false },
      { id: 1, points: 1000, startX: 320, startY: 500, endX: 250, endY: 200, isActivated: false },
    ];
  }

  addBall(): void {
    if (this.balls.length >= 3) return;
    
    const ball: Ball = {
      id: this.ballIdCounter++,
      x: CANVAS_WIDTH / 2,
      y: 450,
      vx: (Math.random() - 0.5) * 4,
      vy: -8,
      radius: 10,
      color: BALL_COLORS[this.balls.length % BALL_COLORS.length],
      isActive: true
    };
    this.balls.push(ball);
  }

  getState(): PinballState {
    return {
      balls: this.balls.map(b => ({ ...b })),
      bumpers: this.bumpers.map(b => ({ ...b })),
      flippers: this.flippers.map(f => ({ ...f })),
      targets: this.targets.map(t => ({ ...t })),
      score: this.score,
      multiball: this.multiball,
      ballCount: this.balls.length,
      extraBalls: this.extraBalls,
      combo: this.combo,
      lastHitTime: this.lastHitTime,
      tilt: this.tilt,
      isTilted: this.isTilted,
    };
  }

  pressLeftFlipper(): void {
    if (this.isTilted) return;
    this.flippers[0].targetAngle = -0.6;
    this.tilt += 0.5;
  }

  releaseLeftFlipper(): void {
    this.flippers[0].targetAngle = 0.4;
  }

  pressRightFlipper(): void {
    if (this.isTilted) return;
    this.flippers[1].targetAngle = Math.PI + 0.6;
    this.tilt += 0.5;
  }

  releaseRightFlipper(): void {
    this.flippers[1].targetAngle = Math.PI - 0.4;
  }

  nudge(): void {
    if (this.isTilted) return;
    this.tilt += 3;
    for (const ball of this.balls) {
      ball.vx += (Math.random() - 0.5) * 5;
      ball.vy -= Math.random() * 3;
    }
  }

  private checkBumperCollision(ball: Ball): void {
    for (const bumper of this.bumpers) {
      if (bumper.hitTimer > 0) continue;
      
      const dx = ball.x - bumper.x;
      const dy = ball.y - bumper.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < ball.radius + bumper.radius) {
        // Collision!
        const nx = dx / dist;
        const ny = dy / dist;
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        
        ball.vx = nx * speed * BUMPER_BOUNCE;
        ball.vy = ny * speed * BUMPER_BOUNCE;
        
        // Push ball out
        ball.x = bumper.x + nx * (ball.radius + bumper.radius + 1);
        ball.y = bumper.y + ny * (ball.radius + bumper.radius + 1);
        
        bumper.hitTimer = 10;
        this.addScore(bumper.points);
        this.combo++;
        this.lastHitTime = Date.now();
        
        // Slingshot special effect
        if (bumper.type === 'slingshot') {
          ball.vx *= 1.3;
        }
      }
    }
  }

  private checkFlipperCollision(ball: Ball): void {
    for (const flipper of this.flippers) {
      const flipperEndX = flipper.x + Math.cos(flipper.angle) * flipper.length;
      const flipperEndY = flipper.y + Math.sin(flipper.angle) * flipper.length;
      
      // Simple line-circle collision
      const dx = flipperEndX - flipper.x;
      const dy = flipperEndY - flipper.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = dx / len;
      const ny = dy / len;
      
      const bx = ball.x - flipper.x;
      const by = ball.y - flipper.y;
      const proj = bx * nx + by * ny;
      
      if (proj >= 0 && proj <= len) {
        const closestX = flipper.x + nx * proj;
        const closestY = flipper.y + ny * proj;
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const dist = Math.sqrt(distX * distX + distY * distY);
        
        if (dist < ball.radius + 8) {
          // Collision with flipper
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          const isMovingToward = (ball.vx * nx + ball.vy * ny) < 0;
          
          // Calculate flipper tip velocity
          const tipVx = -ny * FLIPPER_POWER * 0.5;
          const tipVy = nx * FLIPPER_POWER * 0.5;
          
          // Only activate if flipper is moving up
          const isFlipperUp = flipper.isLeft ? flipper.angle < 0.1 : flipper.angle > Math.PI - 0.1;
          
          if (isFlipperUp || isMovingToward) {
            ball.vx = tipVx * 1.2;
            ball.vy = tipVy * 1.2 - 5;
            
            this.addScore(10);
            this.combo++;
          } else {
            // Gentle bounce
            ball.vy = -Math.abs(ball.vy) * 0.5;
          }
          
          // Push ball out
          ball.y = closestY - ball.radius - 10;
        }
      }
    }
  }

  private checkTargetCollision(ball: Ball): void {
    for (const target of this.targets) {
      if (target.isHit) continue;
      
      if (
        ball.x + ball.radius > target.x &&
        ball.x - ball.radius < target.x + target.width &&
        ball.y + ball.radius > target.y &&
        ball.y - ball.radius < target.y + target.height
      ) {
        target.isHit = true;
        this.addScore(target.points);
        ball.vy = -Math.abs(ball.vy) * 0.5;
        
        // Check if all targets hit
        if (this.targets.every(t => t.isHit)) {
          this.addScore(5000);
          this.resetTargets();
        }
      }
    }
  }

  private checkWallCollision(ball: Ball): void {
    // Left wall
    if (ball.x - ball.radius < 20) {
      ball.x = 20 + ball.radius;
      ball.vx = Math.abs(ball.vx) * 0.8;
    }
    // Right wall
    if (ball.x + ball.radius > CANVAS_WIDTH - 20) {
      ball.x = CANVAS_WIDTH - 20 - ball.radius;
      ball.vx = -Math.abs(ball.vx) * 0.8;
    }
    // Top
    if (ball.y - ball.radius < 20) {
      ball.y = 20 + ball.radius;
      ball.vy = Math.abs(ball.vy) * 0.8;
    }
  }

  private checkDrain(ball: Ball): boolean {
    // Drain zone at bottom
    if (ball.y > CANVAS_HEIGHT + ball.radius) {
      ball.isActive = false;
      return true;
    }
    return false;
  }

  private addScore(points: number): void {
    const multiplier = Math.min(this.combo, 10);
    this.score += points * multiplier;
  }

  private resetTargets(): void {
    for (const target of this.targets) {
      target.isHit = false;
    }
  }

  tick(): void {
    // Update tilt
    if (this.tilt > 0) {
      this.tilt -= 0.1;
    }
    if (this.tilt > 20) {
      this.isTilted = true;
    }

    // Reset combo if too long since last hit
    if (Date.now() - this.lastHitTime > 2000) {
      this.combo = 0;
    }

    // Update bumper timers
    for (const bumper of this.bumpers) {
      if (bumper.hitTimer > 0) {
        bumper.hitTimer--;
      }
    }

    // Update flippers
    for (const flipper of this.flippers) {
      const diff = flipper.targetAngle - flipper.angle;
      flipper.angle += diff * FLIPPER_SPEED;
    }

    // Update balls
    for (const ball of this.balls) {
      if (!ball.isActive) continue;

      // Apply gravity
      ball.vy += GRAVITY;
      
      // Apply friction
      ball.vx *= FRICTION;
      ball.vy *= FRICTION;
      
      // Update position
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Collisions
      this.checkWallCollision(ball);
      this.checkBumperCollision(ball);
      this.checkFlipperCollision(ball);
      this.checkTargetCollision(ball);
      this.checkDrain(ball);
    }

    // Remove inactive balls
    this.balls = this.balls.filter(b => b.isActive);

    // Check for ball drain
    if (this.balls.length === 0) {
      this.drainTimer++;
      if (this.drainTimer > 60) {
        if (this.extraBalls > 0) {
          this.extraBalls--;
          this.addBall();
        } else {
          // Game over
          this.drainTimer = 0;
        }
      }
    } else {
      this.drainTimer = 0;
    }

    // Check for multiball trigger
    if (this.score > 5000 && !this.multiball) {
      this.multiball = true;
      this.addBall();
    }
  }

  launchBall(): void {
    if (this.balls.length === 0) {
      this.addBall();
    }
  }

  reset(): void {
    this.balls = [];
    this.score = 0;
    this.multiball = false;
    this.extraBalls = 0;
    this.combo = 0;
    this.tilt = 0;
    this.isTilted = false;
    this.drainTimer = 0;
    
    this.resetTargets();
    this.addBall();
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
