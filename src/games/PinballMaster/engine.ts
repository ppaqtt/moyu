const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 700;
const GRAVITY = 0.3;
const FRICTION = 0.992;
const FLIPPER_POWER = 20;
const FLIPPER_SPEED = 0.35;
const BUMPER_BOUNCE = 1.8;
const BALL_RADIUS = 10;

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
  type: 'round' | 'pop' | 'slingshot' | 'kickback';
  points: number;
  hitTimer: number;
  flashTimer: number;
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
  hitTimer: number;
}

export interface Ramp {
  id: number;
  type: 'left' | 'right' | 'center';
  points: number;
  isActivated: boolean;
  progress: number;
}

export interface Hole {
  id: number;
  x: number;
  y: number;
  radius: number;
  points: number;
}

export interface Spinner {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  velocity: number;
  isSpinning: boolean;
  spinTimer: number;
}

export interface PinballMasterState {
  balls: Ball[];
  bumpers: Bumper[];
  flippers: Flipper[];
  targets: Target[];
  ramps: Ramp[];
  holes: Hole[];
  spinners: Spinner[];
  score: number;
  ballCount: number;
  extraBalls: number;
  combo: number;
  lastHitTime: number;
  tilt: number;
  isTilted: boolean;
  multiballActive: boolean;
  multiballHits: number;
  bonusMultiplier: number;
  isGameOver: boolean;
  message: string;
  totalBallsLost: number;
  maxBalls: number;
}

const BALL_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181'];

export class PinballMasterEngine {
  private balls: Ball[] = [];
  private bumpers: Bumper[] = [];
  private flippers: Flipper[] = [];
  private targets: Target[] = [];
  private ramps: Ramp[] = [];
  private holes: Hole[] = [];
  private spinners: Spinner[] = [];
  private score: number;
  private ballCount: number;
  private extraBalls: number;
  private combo: number;
  private lastHitTime: number;
  private tilt: number;
  private isTilted: boolean;
  private multiballActive: boolean;
  private multiballHits: number;
  private bonusMultiplier: number;
  private isGameOver: boolean;
  private message: string;
  private totalBallsLost: number;
  private maxBalls: number;
  private drainTimer: number;
  private ballIdCounter: number;
  private spinResult: number;

  constructor() {
    this.score = 0;
    this.ballCount = 3;
    this.extraBalls = 0;
    this.combo = 0;
    this.lastHitTime = 0;
    this.tilt = 0;
    this.isTilted = false;
    this.multiballActive = false;
    this.multiballHits = 0;
    this.bonusMultiplier = 1;
    this.isGameOver = false;
    this.message = '';
    this.totalBallsLost = 0;
    this.maxBalls = 3;
    this.drainTimer = 0;
    this.ballIdCounter = 0;
    this.spinResult = 0;

    this.initBumpers();
    this.initFlippers();
    this.initTargets();
    this.initRamps();
    this.initHoles();
    this.initSpinners();
    this.addBall();
  }

  private initBumpers(): void {
    this.bumpers = [
      { id: 0, x: 80, y: 140, radius: 28, type: 'pop', points: 150, hitTimer: 0, flashTimer: 0 },
      { id: 1, x: 200, y: 100, radius: 32, type: 'pop', points: 200, hitTimer: 0, flashTimer: 0 },
      { id: 2, x: 320, y: 140, radius: 28, type: 'pop', points: 150, hitTimer: 0, flashTimer: 0 },
      { id: 3, x: 120, y: 220, radius: 25, type: 'round', points: 100, hitTimer: 0, flashTimer: 0 },
      { id: 4, x: 200, y: 200, radius: 30, type: 'pop', points: 175, hitTimer: 0, flashTimer: 0 },
      { id: 5, x: 280, y: 220, radius: 25, type: 'round', points: 100, hitTimer: 0, flashTimer: 0 },
      { id: 6, x: 60, y: 320, radius: 18, type: 'slingshot', points: 75, hitTimer: 0, flashTimer: 0 },
      { id: 7, x: 340, y: 320, radius: 18, type: 'slingshot', points: 75, hitTimer: 0, flashTimer: 0 },
      { id: 8, x: 100, y: 280, radius: 22, type: 'round', points: 125, hitTimer: 0, flashTimer: 0 },
      { id: 9, x: 300, y: 280, radius: 22, type: 'round', points: 125, hitTimer: 0, flashTimer: 0 },
    ];
  }

  private initFlippers(): void {
    this.flippers = [
      { x: 120, y: 560, length: 80, angle: 0.5, targetAngle: 0.5, isLeft: true },
      { x: 280, y: 560, length: 80, angle: Math.PI - 0.5, targetAngle: Math.PI - 0.5, isLeft: false },
    ];
  }

  private initTargets(): void {
    this.targets = [
      { id: 0, x: 50, y: 400, width: 30, height: 50, isHit: false, points: 500, hitTimer: 0 },
      { id: 1, x: 90, y: 400, width: 30, height: 50, isHit: false, points: 500, hitTimer: 0 },
      { id: 2, x: 130, y: 400, width: 30, height: 50, isHit: false, points: 500, hitTimer: 0 },
      { id: 3, x: 240, y: 400, width: 30, height: 50, isHit: false, points: 500, hitTimer: 0 },
      { id: 4, x: 280, y: 400, width: 30, height: 50, isHit: false, points: 500, hitTimer: 0 },
      { id: 5, x: 320, y: 400, width: 30, height: 50, isHit: false, points: 500, hitTimer: 0 },
    ];
  }

  private initRamps(): void {
    this.ramps = [
      { id: 0, type: 'left', points: 2500, isActivated: false, progress: 0 },
      { id: 1, type: 'right', points: 2500, isActivated: false, progress: 0 },
      { id: 2, type: 'center', points: 5000, isActivated: false, progress: 0 },
    ];
  }

  private initHoles(): void {
    this.holes = [
      { id: 0, x: 200, y: 60, radius: 25, points: 1000 },
    ];
  }

  private initSpinners(): void {
    this.spinners = [
      { id: 0, x: 170, y: 350, width: 40, height: 8, rotation: 0, velocity: 0, isSpinning: false, spinTimer: 0 },
      { id: 1, x: 190, y: 350, width: 40, height: 8, rotation: 0, velocity: 0, isSpinning: false, spinTimer: 0 },
    ];
  }

  addBall(): void {
    if (this.balls.length >= 5) return;

    const ball: Ball = {
      id: this.ballIdCounter++,
      x: CANVAS_WIDTH / 2,
      y: 500,
      vx: (Math.random() - 0.5) * 6,
      vy: -10,
      radius: BALL_RADIUS,
      color: BALL_COLORS[this.balls.length % BALL_COLORS.length],
      isActive: true
    };
    this.balls.push(ball);
  }

  getState(): PinballMasterState {
    return {
      balls: this.balls.map(b => ({ ...b })),
      bumpers: this.bumpers.map(b => ({ ...b })),
      flippers: this.flippers.map(f => ({ ...f })),
      targets: this.targets.map(t => ({ ...t })),
      ramps: this.ramps.map(r => ({ ...r })),
      holes: this.holes.map(h => ({ ...h })),
      spinners: this.spinners.map(s => ({ ...s })),
      score: this.score,
      ballCount: this.balls.length,
      extraBalls: this.extraBalls,
      combo: this.combo,
      lastHitTime: this.lastHitTime,
      tilt: this.tilt,
      isTilted: this.isTilted,
      multiballActive: this.multiballActive,
      multiballHits: this.multiballHits,
      bonusMultiplier: this.bonusMultiplier,
      isGameOver: this.isGameOver,
      message: this.message,
      totalBallsLost: this.totalBallsLost,
      maxBalls: this.maxBalls,
    };
  }

  pressLeftFlipper(): void {
    if (this.isTilted) return;
    this.flippers[0].targetAngle = -0.6;
    this.tilt += 0.3;
  }

  releaseLeftFlipper(): void {
    this.flippers[0].targetAngle = 0.5;
  }

  pressRightFlipper(): void {
    if (this.isTilted) return;
    this.flippers[1].targetAngle = Math.PI + 0.6;
    this.tilt += 0.3;
  }

  releaseRightFlipper(): void {
    this.flippers[1].targetAngle = Math.PI - 0.5;
  }

  nudge(): void {
    if (this.isTilted) return;
    this.tilt += 5;
    for (const ball of this.balls) {
      ball.vx += (Math.random() - 0.5) * 8;
      ball.vy -= Math.random() * 5;
      ball.vx = Math.max(-15, Math.min(15, ball.vx));
      ball.vy = Math.max(-15, Math.min(15, ball.vy));
    }
  }

  launchBall(): void {
    if (this.balls.length === 0 && !this.isGameOver) {
      if (this.extraBalls > 0) {
        this.extraBalls--;
        this.addBall();
      } else {
        this.addBall();
      }
    }
  }

  private addScore(points: number): void {
    const comboBonus = Math.min(this.combo, 10);
    const finalPoints = points * this.bonusMultiplier * (1 + comboBonus * 0.1);
    this.score += Math.floor(finalPoints);
    this.combo++;
    this.lastHitTime = Date.now();
    this.multiballHits++;
  }

  private checkBumperCollision(ball: Ball): void {
    for (const bumper of this.bumpers) {
      if (bumper.hitTimer > 0) continue;

      const dx = ball.x - bumper.x;
      const dy = ball.y - bumper.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < ball.radius + bumper.radius) {
        const nx = dx / dist;
        const ny = dy / dist;
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

        let bounceMult = BUMPER_BOUNCE;
        if (bumper.type === 'pop') bounceMult = 2.2;
        if (bumper.type === 'slingshot') bounceMult = 1.5;

        ball.vx = nx * speed * bounceMult;
        ball.vy = ny * speed * bounceMult;

        ball.x = bumper.x + nx * (ball.radius + bumper.radius + 2);
        ball.y = bumper.y + ny * (ball.radius + bumper.radius + 2);

        bumper.hitTimer = bumper.type === 'pop' ? 8 : 12;
        bumper.flashTimer = 15;
        this.addScore(bumper.points);

        if (bumper.type === 'pop') {
          this.message = 'POP!';
          setTimeout(() => { this.message = ''; }, 200);
        }
      }
    }
  }

  private checkFlipperCollision(ball: Ball): void {
    for (const flipper of this.flippers) {
      const flipperEndX = flipper.x + Math.cos(flipper.angle) * flipper.length;
      const flipperEndY = flipper.y + Math.sin(flipper.angle) * flipper.length;

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

        if (dist < ball.radius + 10) {
          const isFlipperUp = flipper.isLeft ? flipper.angle < 0.1 : flipper.angle > Math.PI - 0.1;

          if (isFlipperUp) {
            const tipVx = -ny * FLIPPER_POWER;
            const tipVy = nx * FLIPPER_POWER;
            ball.vx = tipVx;
            ball.vy = tipVy - 8;
            this.addScore(25);
          } else {
            ball.vy = -Math.abs(ball.vy) * 0.6;
          }

          ball.y = closestY - ball.radius - 12;
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
        target.hitTimer = 30;
        this.addScore(target.points);

        if (this.targets.every(t => t.isHit)) {
          this.addScore(10000);
          this.resetTargets();
          this.bonusMultiplier = Math.min(this.bonusMultiplier + 1, 5);
          this.message = 'BONUS x' + this.bonusMultiplier + '!';
          setTimeout(() => { this.message = ''; }, 1500);
        }
      }
    }
  }

  private checkSpinnerCollision(ball: Ball): void {
    for (const spinner of this.spinners) {
      const spinnerLeft = spinner.x - spinner.width / 2;
      const spinnerRight = spinner.x + spinner.width / 2;
      const spinnerTop = spinner.y - spinner.height / 2;
      const spinnerBottom = spinner.y + spinner.height / 2;

      if (
        ball.x + ball.radius > spinnerLeft &&
        ball.x - ball.radius < spinnerRight &&
        ball.y + ball.radius > spinnerTop &&
        ball.y - ball.radius < spinnerBottom
      ) {
        if (!spinner.isSpinning) {
          spinner.isSpinning = true;
          spinner.velocity = ball.vx * 0.5;
          spinner.spinTimer = 60;
          this.addScore(100);
        }
      }
    }
  }

  private checkHoleCollision(ball: Ball): void {
    for (const hole of this.holes) {
      const dx = ball.x - hole.x;
      const dy = ball.y - hole.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < hole.radius - ball.radius * 0.5) {
        ball.isActive = false;
        this.addScore(hole.points);
        this.message = '+' + hole.points + '!';
        setTimeout(() => { this.message = ''; }, 500);

        if (this.multiballHits >= 5 && !this.multiballActive) {
          this.multiballActive = true;
          this.addBall();
          this.addBall();
          this.message = 'MULTIBALL!';
          setTimeout(() => { this.message = ''; }, 1000);
        }
      }
    }
  }

  private checkWallCollision(ball: Ball): void {
    if (ball.x - ball.radius < 20) {
      ball.x = 20 + ball.radius;
      ball.vx = Math.abs(ball.vx) * 0.8;
    }
    if (ball.x + ball.radius > CANVAS_WIDTH - 20) {
      ball.x = CANVAS_WIDTH - 20 - ball.radius;
      ball.vx = -Math.abs(ball.vx) * 0.8;
    }
    if (ball.y - ball.radius < 20) {
      ball.y = 20 + ball.radius;
      ball.vy = Math.abs(ball.vy) * 0.8;
    }

    const gutterY = 620;
    if (ball.y > gutterY) {
      if (ball.x < 80 || ball.x > 320) {
        ball.vx += ball.x < 200 ? -3 : 3;
        ball.vy = -Math.abs(ball.vy) * 0.5;
        this.addScore(50);
      }
    }
  }

  private checkDrain(ball: Ball): boolean {
    if (ball.y > CANVAS_HEIGHT + ball.radius) {
      ball.isActive = false;
      return true;
    }
    return false;
  }

  private resetTargets(): void {
    for (const target of this.targets) {
      target.isHit = false;
      target.hitTimer = 0;
    }
  }

  tick(): void {
    if (this.tilt > 0) {
      this.tilt -= 0.15;
    }
    if (this.tilt > 25) {
      this.isTilted = true;
    }

    if (Date.now() - this.lastHitTime > 3000) {
      this.combo = 0;
    }

    for (const bumper of this.bumpers) {
      if (bumper.hitTimer > 0) bumper.hitTimer--;
      if (bumper.flashTimer > 0) bumper.flashTimer--;
    }

    for (const target of this.targets) {
      if (target.hitTimer > 0) target.hitTimer--;
      if (target.hitTimer === 0 && target.isHit) {
        target.isHit = false;
      }
    }

    for (const spinner of this.spinners) {
      if (spinner.isSpinning) {
        spinner.rotation += spinner.velocity;
        spinner.velocity *= 0.98;
        spinner.spinTimer--;
        if (spinner.spinTimer <= 0) {
          spinner.isSpinning = false;
        }
      }
    }

    for (const flipper of this.flippers) {
      const diff = flipper.targetAngle - flipper.angle;
      flipper.angle += diff * FLIPPER_SPEED;
    }

    for (const ball of this.balls) {
      if (!ball.isActive) continue;

      ball.vy += GRAVITY;
      ball.vx *= FRICTION;
      ball.vy *= FRICTION;

      const maxSpeed = 20;
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (speed > maxSpeed) {
        ball.vx = (ball.vx / speed) * maxSpeed;
        ball.vy = (ball.vy / speed) * maxSpeed;
      }

      ball.x += ball.vx;
      ball.y += ball.vy;

      this.checkWallCollision(ball);
      this.checkBumperCollision(ball);
      this.checkFlipperCollision(ball);
      this.checkTargetCollision(ball);
      this.checkSpinnerCollision(ball);
      this.checkHoleCollision(ball);
      this.checkDrain(ball);
    }

    this.balls = this.balls.filter(b => b.isActive);

    if (this.balls.length === 0) {
      this.drainTimer++;
      this.totalBallsLost++;
      this.multiballHits = 0;
      this.multiballActive = false;

      if (this.drainTimer > 90) {
        if (this.extraBalls > 0) {
          this.extraBalls--;
          this.drainTimer = 0;
          this.addBall();
        } else if (this.totalBallsLost >= this.maxBalls) {
          this.isGameOver = true;
          this.drainTimer = 0;
        } else {
          this.drainTimer = 0;
          this.addBall();
        }
      }
    }
  }

  reset(): void {
    this.balls = [];
    this.score = 0;
    this.ballCount = 3;
    this.extraBalls = 0;
    this.combo = 0;
    this.tilt = 0;
    this.isTilted = false;
    this.multiballActive = false;
    this.multiballHits = 0;
    this.bonusMultiplier = 1;
    this.isGameOver = false;
    this.message = '';
    this.totalBallsLost = 0;
    this.drainTimer = 0;
    this.spinResult = 0;

    this.resetTargets();
    this.initSpinners();
    this.addBall();
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
