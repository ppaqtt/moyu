// BowlingMaster Physics Engine - 保龄球大师

export interface Vec2 {
  x: number;
  y: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  spin: number;
  isRolling: boolean;
 撞击count: number;
}

export interface Pin {
  id: number;
  x: number;
  y: number;
  radius: number;
  isStanding: boolean;
  vx: number;
  vy: number;
  rotation: number;
  fallenFrames: number;
}

export interface LaneMarking {
  x: number;
  y: number;
  type: 'dot' | 'arrow';
}

export interface BowlingMasterState {
  ball: Ball;
  pins: Pin[];
  score: number;
  frame: number;
  attempts: number;
  throwNumber: number;
  phase: 'aiming' | 'rolling' | 'settling' | 'scoring' | 'gameover';
  pinsDown: number;
  strikes: number;
  spares: number;
  power: number;
  angle: number;
  maxScore: number;
  currentScores: number[];
  totalPinsKnocked: number;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.15;
const FRICTION = 0.985;
const PIN_SPACING = 35;
const BALL_RADIUS = 18;
const PIN_RADIUS = 10;
const LANE_LENGTH = 500;

const PIN_POSITIONS = [
  { row: 0, offset: 0 },        // 1
  { row: 1, offset: -0.5 },     // 2
  { row: 1, offset: 0.5 },      // 3
  { row: 2, offset: -1 },      // 4
  { row: 2, offset: 0 },       // 5
  { row: 2, offset: 1 },      // 6
  { row: 3, offset: -1.5 },    // 7
  { row: 3, offset: -0.5 },    // 8
  { row: 3, offset: 0.5 },    // 9
  { row: 3, offset: 1.5 },    // 10
];

export class BowlingMasterEngine {
  private ball: Ball;
  private pins: Pin[];
  private score: number;
  private frame: number;
  private throwNumber: number;
  private phase: 'aiming' | 'rolling' | 'settling' | 'scoring' | 'gameover';
  private pinsDownThisThrow: number;
  private totalPinsKnocked: number;
  private currentScores: number[];
  private settleTimer: number;
  private laneY: number;

  constructor() {
    this.laneY = 450;
    this.ball = this.createBall();
    this.pins = this.createPins();
    this.score = 0;
    this.frame = 1;
    this.throwNumber = 1;
    this.phase = 'aiming';
    this.pinsDownThisThrow = 0;
    this.totalPinsKnocked = 0;
    this.currentScores = [];
    this.settleTimer = 0;
  }

  private createBall(): Ball {
    return {
      x: CANVAS_WIDTH / 2,
      y: this.laneY + 80,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      rotation: 0,
      spin: 0,
      isRolling: false,
      撞击count: 0
    };
  }

  private createPins(): Pin[] {
    const startX = CANVAS_WIDTH / 2;
    const startY = 100;
    
    return PIN_POSITIONS.map((pos, i) => ({
      id: i,
      x: startX + pos.offset * PIN_SPACING,
      y: startY + pos.row * PIN_SPACING * 0.866,
      radius: PIN_RADIUS,
      isStanding: true,
      vx: 0,
      vy: 0,
      rotation: 0,
      fallenFrames: 0
    }));
  }

  getState(): BowlingMasterState {
    return {
      ball: { ...this.ball },
      pins: this.pins.map(p => ({ ...p })),
      score: this.score,
      frame: this.frame,
      attempts: 10 - this.frame + 1,
      throwNumber: this.throwNumber,
      phase: this.phase,
      pinsDown: this.pinsDownThisThrow,
      strikes: Math.floor(this.totalPinsKnocked / 10),
      spares: 0,
      power: 15,
      angle: 0,
      maxScore: 300,
      currentScores: [...this.currentScores],
      totalPinsKnocked: this.totalPinsKnocked
    };
  }

  setPower(power: number): void {
    if (this.phase !== 'aiming') return;
    this.ball.vy = -power;
  }

  setAngle(angle: number): void {
    if (this.phase !== 'aiming') return;
    this.ball.vx = angle * 0.5;
  }

  setSpin(spin: number): void {
    if (this.phase !== 'aiming') return;
    this.ball.spin = spin;
  }

  throw(power: number, angle: number, spin: number): void {
    if (this.phase !== 'aiming') return;
    
    this.ball.vy = -power;
    this.ball.vx = angle * 3;
    this.ball.spin = spin;
    this.ball.isRolling = true;
    this.phase = 'rolling';
  }

  private checkBallPinCollision(): void {
    for (const pin of this.pins) {
      if (!pin.isStanding) continue;
      
      const dx = this.ball.x - pin.x;
      const dy = this.ball.y - pin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.ball.radius + pin.radius) {
        // Collision!
        const speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
        const nx = dx / dist;
        const ny = dy / dist;
        
        // Transfer momentum to pin
        pin.vx = nx * speed * 0.8 + this.ball.spin * ny * 0.3;
        pin.vy = ny * speed * 0.8;
        pin.isStanding = false;
        
        // Slow down ball slightly
        this.ball.vx *= 0.9;
        this.ball.vy *= 0.95;
        
        this.ball.撞击count++;
      }
    }
  }

  private checkPinPinCollision(): void {
    for (let i = 0; i < this.pins.length; i++) {
      for (let j = i + 1; j < this.pins.length; j++) {
        const a = this.pins[i];
        const b = this.pins[j];
        
        if (a.isStanding && b.isStanding) continue;
        
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < a.radius + b.radius && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (a.radius + b.radius - dist) / 2;
          
          // Separate pins
          if (a.isStanding && !b.isStanding) {
            a.vx -= nx * overlap * 0.5;
            a.vy -= ny * overlap * 0.5;
          } else if (!a.isStanding && b.isStanding) {
            b.vx += nx * overlap * 0.5;
            b.vy += ny * overlap * 0.5;
          } else {
            a.vx -= nx * overlap * 0.3;
            a.vy -= ny * overlap * 0.3;
            b.vx += nx * overlap * 0.3;
            b.vy += ny * overlap * 0.3;
          }
        }
      }
    }
  }

  tick(): void {
    if (this.phase === 'aiming' || this.phase === 'gameover') return;

    // Update ball
    if (this.ball.isRolling) {
      this.ball.vy += GRAVITY;
      this.ball.vx += this.ball.spin * 0.02;
      this.ball.vx *= FRICTION;
      this.ball.vy *= FRICTION;
      
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;
      this.ball.rotation += this.ball.vx * 2;

      // Wall collisions
      if (this.ball.x - this.ball.radius < 50) {
        this.ball.x = 50 + this.ball.radius;
        this.ball.vx *= -0.5;
      }
      if (this.ball.x + this.ball.radius > CANVAS_WIDTH - 50) {
        this.ball.x = CANVAS_WIDTH - 50 - this.ball.radius;
        this.ball.vx *= -0.5;
      }

      // Check collisions
      this.checkBallPinCollision();
    }

    // Update pins
    for (const pin of this.pins) {
      if (pin.isStanding) continue;
      
      pin.vy += GRAVITY;
      pin.vx *= 0.98;
      pin.vy *= 0.98;
      
      pin.x += pin.vx;
      pin.y += pin.vy;
      pin.rotation += (pin.vx + pin.vy) * 2;

      // Ground collision
      if (pin.y + pin.radius > this.laneY) {
        pin.y = this.laneY - pin.radius;
        pin.vy *= -0.3;
        pin.vx *= 0.8;
      }

      // Boundary collision
      if (pin.x - pin.radius < 50) {
        pin.x = 50 + pin.radius;
        pin.vx *= -0.5;
      }
      if (pin.x + pin.radius > CANVAS_WIDTH - 50) {
        pin.x = CANVAS_WIDTH - 50 - pin.radius;
        pin.vx *= -0.5;
      }
    }

    this.checkPinPinCollision();

    // Check if ball has stopped or reached end
    const ballSpeed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
    let pinsMoving = false;
    
    for (const pin of this.pins) {
      if (!pin.isStanding) {
        const pinSpeed = Math.sqrt(pin.vx * pin.vx + pin.vy * pin.vy);
        if (pinSpeed > 0.1) {
          pinsMoving = true;
        }
        pin.fallenFrames++;
      }
    }

    if (this.phase === 'rolling') {
      if (this.ball.y < 50 || (!this.ball.isRolling && ballSpeed < 0.5) || this.ball.撞击count > 0) {
        this.phase = 'settling';
        this.settleTimer = 0;
      }
    }

    if (this.phase === 'settling') {
      this.settleTimer++;
      
      if (!pinsMoving && this.settleTimer > 60) {
        this.calculateScore();
        this.phase = 'scoring';
        this.settleTimer = 0;
      }
      
      if (this.settleTimer > 180) {
        this.calculateScore();
        this.phase = 'scoring';
      }
    }
  }

  private calculateScore(): void {
    const standingPins = this.pins.filter(p => p.isStanding).length;
    const knockedDown = 10 - standingPins;
    this.pinsDownThisThrow = knockedDown - this.totalPinsKnocked % 10;
    
    if (this.throwNumber === 1) {
      if (knockedDown === 10) {
        // Strike!
        this.currentScores.push(10);
      } else {
        // First throw, not a strike
        this.totalPinsKnocked = knockedDown;
        this.currentScores.push(knockedDown);
      }
    } else {
      // Second throw
      this.totalPinsKnocked = knockedDown;
      if (this.currentScores.length > 0 && this.currentScores[this.currentScores.length - 1] === 10) {
        // Was a strike, add this as bonus
        this.currentScores[this.currentScores.length - 1] += knockedDown;
      } else {
        this.currentScores[this.currentScores.length - 1] += knockedDown;
      }
    }

    this.score = this.calculateTotalScore();
  }

  private calculateTotalScore(): number {
    let total = 0;
    let bonusCount = 0;
    
    for (let i = 0; i < this.currentScores.length; i++) {
      total += this.currentScores[i] % 10;
    }
    
    return total;
  }

  nextThrow(): void {
    if (this.frame >= 10 && this.throwNumber >= 2 && this.totalPinsKnocked >= 10) {
      // 10th frame bonus throw
      this.throwNumber++;
      this.resetBallAndPins();
      return;
    }
    
    if (this.frame >= 10) {
      if (this.throwNumber === 1 && this.pinsDownThisThrow === 10) {
        // Strike in 10th frame
        this.throwNumber = 2;
        this.resetPins();
        return;
      } else if (this.throwNumber === 2) {
        if (this.currentScores[this.currentScores.length - 1] >= 10 || 
            (this.currentScores.length > 1 && this.currentScores[this.currentScores.length - 2] === 10)) {
          // Got a spare or previous was strike
          this.throwNumber = 3;
          this.resetPins();
          return;
        }
      }
      this.phase = 'gameover';
      return;
    }

    if (this.throwNumber === 1 && this.pinsDownThisThrow === 10) {
      // Strike!
      this.frame++;
      this.throwNumber = 1;
      this.resetPins();
    } else if (this.throwNumber === 1) {
      // Need second throw
      this.throwNumber = 2;
      this.resetBall();
    } else {
      // Frame complete
      this.frame++;
      this.throwNumber = 1;
      this.resetPins();
    }
  }

  private resetBall(): void {
    this.ball = this.createBall();
    this.ball.isRolling = false;
    this.pinsDownThisThrow = 0;
  }

  private resetPins(): void {
    this.pins = this.createPins();
    this.ball = this.createBall();
    this.ball.isRolling = false;
    this.pinsDownThisThrow = 0;
    this.totalPinsKnocked = 0;
  }

  reset(): void {
    this.ball = this.createBall();
    this.pins = this.createPins();
    this.score = 0;
    this.frame = 1;
    this.throwNumber = 1;
    this.phase = 'aiming';
    this.pinsDownThisThrow = 0;
    this.totalPinsKnocked = 0;
    this.currentScores = [];
    this.settleTimer = 0;
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getLaneY() {
    return this.laneY;
  }
}
