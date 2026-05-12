// IceHockey - Ice Hockey Game Engine

export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isAI: boolean;
  team: 'red' | 'blue';
  hasPuck: boolean;
  reactionTime: number;
}

export interface Puck {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isHeld: boolean;
  holder: Player | null;
}

export interface Goal {
  x: number;
  y: number;
  width: number;
  height: number;
  team: 'red' | 'blue';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface IceHockeyState {
  player1: Player;
  player2: Player;
  puck: Puck;
  player1Score: number;
  player2Score: number;
  phase: 'ready' | 'playing' | 'goal' | 'gameover';
  message: string;
  particles: Particle[];
  gameTime: number;
  period: number;
  maxPeriods: number;
  goalFlashTimer: number;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const RINK_PADDING = 30;
const PLAYER_RADIUS = 22;
const PUCK_RADIUS = 10;
const GOAL_WIDTH = 10;
const GOAL_HEIGHT = 100;
const MAX_PUCK_SPEED = 18;
const PLAYER_MAX_SPEED = 6;
const FRICTION = 0.985;
const PUCK_FRICTION = 0.992;

export class IceHockeyEngine {
  private player1: Player;
  private player2: Player;
  private puck: Puck;
  private player1Score: number;
  private player2Score: number;
  private phase: 'ready' | 'playing' | 'goal' | 'gameover';
  private message: string;
  private particles: Particle[];
  private gameTime: number;
  private period: number;
  private maxPeriods: number;
  private goalFlashTimer: number;
  private lastGoalScorer: 'player1' | 'player2' | null;
  private goalPauseTimer: number;

  constructor() {
    this.player1 = this.createPlayer(CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2, false, 'red');
    this.player2 = this.createPlayer(CANVAS_WIDTH * 3 / 4, CANVAS_HEIGHT / 2, true, 'blue');
    this.puck = this.createPuck();
    this.player1Score = 0;
    this.player2Score = 0;
    this.phase = 'ready';
    this.message = '点击开始';
    this.particles = [];
    this.gameTime = 0;
    this.period = 1;
    this.maxPeriods = 3;
    this.goalFlashTimer = 0;
    this.lastGoalScorer = null;
    this.goalPauseTimer = 0;
  }

  private createPlayer(x: number, y: number, isAI: boolean, team: 'red' | 'blue'): Player {
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      radius: PLAYER_RADIUS,
      isAI,
      team,
      hasPuck: false,
      reactionTime: 0.3 + Math.random() * 0.3,
    };
  }

  private createPuck(): Puck {
    return {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: 0,
      vy: 0,
      radius: PUCK_RADIUS,
      isHeld: false,
      holder: null,
    };
  }

  getState(): IceHockeyState {
    return {
      player1: { ...this.player1 },
      player2: { ...this.player2 },
      puck: { ...this.puck },
      player1Score: this.player1Score,
      player2Score: this.player2Score,
      phase: this.phase,
      message: this.message,
      particles: this.particles.map(p => ({ ...p })),
      gameTime: this.gameTime,
      period: this.period,
      maxPeriods: this.maxPeriods,
      goalFlashTimer: this.goalFlashTimer,
    };
  }

  setPlayer1Velocity(vx: number, vy: number): void {
    if (this.phase !== 'playing') return;
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > PLAYER_MAX_SPEED) {
      vx = (vx / speed) * PLAYER_MAX_SPEED;
      vy = (vy / speed) * PLAYER_MAX_SPEED;
    }
    this.player1.vx = vx;
    this.player1.vy = vy;
  }

  player1Shoot(): void {
    if (this.phase !== 'playing') return;
    if (this.player1.hasPuck && this.puck.isHeld) {
      this.puck.isHeld = false;
      this.puck.holder = null;
      this.player1.hasPuck = false;

      const dx = this.player2.x - this.puck.x;
      const dy = this.player2.y - this.puck.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      this.puck.vx = (dx / dist) * 15;
      this.puck.vy = (dy / dist) * 15;
      this.puck.isHeld = false;

      this.createParticles(this.puck.x, this.puck.y, '#ffffff', 8);
    }
  }

  private createParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        color,
        size: Math.random() * 4 + 2,
      });
    }
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= 0.03;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateAI(): void {
    if (this.player2.isAI && this.phase === 'playing') {
      const targetX = this.puck.x;
      const targetY = this.puck.y;

      const dx = targetX - this.player2.x;
      const dy = targetY - this.player2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        this.player2.vx = (dx / dist) * PLAYER_MAX_SPEED * 0.85;
        this.player2.vy = (dy / dist) * PLAYER_MAX_SPEED * 0.85;
      } else {
        this.player2.vx *= 0.8;
        this.player2.vy *= 0.8;
      }

      if (this.player2.hasPuck) {
        const goalX = GOAL_WIDTH + 10;
        const goalY = CANVAS_HEIGHT / 2;
        const gdx = goalX - this.player2.x;
        const gdy = goalY - this.player2.y;
        const gdist = Math.sqrt(gdx * gdx + gdy * gdy);

        if (gdist < 150 && Math.random() < 0.02) {
          this.player2Shoot();
        }
      }
    }
  }

  player2Shoot(): void {
    if (this.phase !== 'playing') return;
    if (this.player2.hasPuck && this.puck.isHeld) {
      this.puck.isHeld = false;
      this.puck.holder = null;
      this.player2.hasPuck = false;

      const dx = this.player1.x - this.puck.x;
      const dy = this.player1.y - this.puck.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      this.puck.vx = (dx / dist) * 15;
      this.puck.vy = (dy / dist) * 15;

      this.createParticles(this.puck.x, this.puck.y, '#ffffff', 8);
    }
  }

  private checkPlayerPuckCollision(player: Player): boolean {
    if (this.puck.isHeld) return false;

    const dx = player.x - this.puck.x;
    const dy = player.y - this.puck.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    return dist < player.radius + this.puck.radius;
  }

  private checkPlayerPlayerCollision(): void {
    const dx = this.player1.x - this.player2.x;
    const dy = this.player1.y - this.player2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = this.player1.radius + this.player2.radius;

    if (dist < minDist && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;

      this.player1.x += nx * overlap / 2;
      this.player1.y += ny * overlap / 2;
      this.player2.x -= nx * overlap / 2;
      this.player2.y -= ny * overlap / 2;
    }
  }

  private checkGoal(): boolean {
    const leftGoal = {
      x: RINK_PADDING,
      y: (CANVAS_HEIGHT - GOAL_HEIGHT) / 2,
      width: GOAL_WIDTH,
      height: GOAL_HEIGHT,
    };

    const rightGoal = {
      x: CANVAS_WIDTH - RINK_PADDING - GOAL_WIDTH,
      y: (CANVAS_HEIGHT - GOAL_HEIGHT) / 2,
      width: GOAL_WIDTH,
      height: GOAL_HEIGHT,
    };

    if (this.puck.x - this.puck.radius <= leftGoal.x + leftGoal.width &&
        this.puck.y >= leftGoal.y &&
        this.puck.y <= leftGoal.y + leftGoal.height) {
      return true;
    }

    if (this.puck.x + this.puck.radius >= rightGoal.x &&
        this.puck.y >= rightGoal.y &&
        this.puck.y <= rightGoal.y + rightGoal.height) {
      return true;
    }

    return false;
  }

  private handleGoal(scoringTeam: 'player1' | 'player2'): void {
    this.phase = 'goal';
    this.goalFlashTimer = 120;
    this.lastGoalScorer = scoringTeam;

    if (scoringTeam === 'player1') {
      this.player1Score++;
      this.message = '红队得分!';
      this.createParticles(CANVAS_WIDTH - RINK_PADDING, CANVAS_HEIGHT / 2, '#ff4444', 40);
    } else {
      this.player2Score++;
      this.message = '蓝队得分!';
      this.createParticles(RINK_PADDING, CANVAS_HEIGHT / 2, '#4444ff', 40);
    }

    this.goalPauseTimer = 90;
  }

  private resetAfterGoal(): void {
    this.player1 = this.createPlayer(CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2, false, 'red');
    this.player2 = this.createPlayer(CANVAS_WIDTH * 3 / 4, CANVAS_HEIGHT / 2, true, 'blue');
    this.puck = this.createPuck();
    this.phase = 'ready';
    this.message = '继续比赛';

    if (this.period >= this.maxPeriods && Math.abs(this.player1Score - this.player2Score) > 0) {
      this.phase = 'gameover';
      if (this.player1Score > this.player2Score) {
        this.message = '红队获胜!';
      } else if (this.player2Score > this.player1Score) {
        this.message = '蓝队获胜!';
      } else {
        this.message = '平局!';
      }
    }
  }

  private startNextPeriod(): void {
    this.period++;
    this.resetAfterGoal();
    this.message = `第 ${this.period} 节`;
  }

  tick(): void {
    if (this.phase === 'gameover') return;

    if (this.phase === 'goal') {
      this.goalFlashTimer--;
      this.updateParticles();
      this.goalPauseTimer--;

      if (this.goalPauseTimer <= 0) {
        if (this.period < this.maxPeriods) {
          this.startNextPeriod();
        } else if (this.player1Score !== this.player2Score) {
          this.phase = 'gameover';
          if (this.player1Score > this.player2Score) {
            this.message = '红队获胜!';
          } else {
            this.message = '蓝队获胜!';
          }
        } else {
          this.maxPeriods++;
          this.startNextPeriod();
        }
      }
      return;
    }

    if (this.phase === 'ready') return;

    this.gameTime++;

    this.player1.x += this.player1.vx;
    this.player1.y += this.player1.vy;
    this.player1.vx *= 0.9;
    this.player1.vy *= 0.9;

    this.updateAI();
    this.player2.x += this.player2.vx;
    this.player2.y += this.player2.vy;
    this.player2.vx *= 0.9;
    this.player2.vy *= 0.9;

    this.player1.x = Math.max(RINK_PADDING + this.player1.radius, Math.min(CANVAS_WIDTH - RINK_PADDING - this.player1.radius, this.player1.x));
    this.player1.y = Math.max(RINK_PADDING + this.player1.radius, Math.min(CANVAS_HEIGHT - RINK_PADDING - this.player1.radius, this.player1.y));

    this.player2.x = Math.max(RINK_PADDING + this.player2.radius, Math.min(CANVAS_WIDTH - RINK_PADDING - this.player2.radius, this.player2.x));
    this.player2.y = Math.max(RINK_PADDING + this.player2.radius, Math.min(CANVAS_HEIGHT - RINK_PADDING - this.player2.radius, this.player2.y));

    this.checkPlayerPlayerCollision();

    if (this.puck.isHeld && this.puck.holder) {
      this.puck.x = this.puck.holder.x;
      this.puck.y = this.puck.holder.y;
    } else {
      this.puck.x += this.puck.vx;
      this.puck.y += this.puck.vy;
      this.puck.vx *= PUCK_FRICTION;
      this.puck.vy *= PUCK_FRICTION;

      if (this.checkPlayerPuckCollision(this.player1)) {
        this.puck.isHeld = true;
        this.puck.holder = this.player1;
        this.player1.hasPuck = true;
        this.createParticles(this.puck.x, this.puck.y, '#ff6666', 5);
      } else if (this.checkPlayerPuckCollision(this.player2)) {
        this.puck.isHeld = true;
        this.puck.holder = this.player2;
        this.player2.hasPuck = true;
        this.createParticles(this.puck.x, this.puck.y, '#6666ff', 5);
      }
    }

    const minX = RINK_PADDING + this.puck.radius;
    const maxX = CANVAS_WIDTH - RINK_PADDING - this.puck.radius;
    const minY = RINK_PADDING + this.puck.radius;
    const maxY = CANVAS_HEIGHT - RINK_PADDING - this.puck.radius;

    const goalTop = (CANVAS_HEIGHT - GOAL_HEIGHT) / 2;
    const goalBottom = goalTop + GOAL_HEIGHT;

    if (this.puck.x < minX) {
      if (this.puck.y < goalTop || this.puck.y > goalBottom) {
        this.puck.x = minX;
        this.puck.vx *= -0.8;
      }
    }
    if (this.puck.x > maxX) {
      if (this.puck.y < goalTop || this.puck.y > goalBottom) {
        this.puck.x = maxX;
        this.puck.vx *= -0.8;
      }
    }
    if (this.puck.y < minY) {
      this.puck.y = minY;
      this.puck.vy *= -0.8;
    }
    if (this.puck.y > maxY) {
      this.puck.y = maxY;
      this.puck.vy *= -0.8;
    }

    const centerX = CANVAS_WIDTH / 2;
    const centerRadius = 45;
    const puckDist = Math.sqrt(Math.pow(this.puck.x - centerX, 2) + Math.pow(this.puck.y - CANVAS_HEIGHT / 2, 2));
    if (puckDist < centerRadius + this.puck.radius) {
      const angle = Math.atan2(this.puck.y - CANVAS_HEIGHT / 2, this.puck.x - centerX);
      this.puck.x = centerX + Math.cos(angle) * (centerRadius + this.puck.radius);
      this.puck.y = CANVAS_HEIGHT / 2 + Math.sin(angle) * (centerRadius + this.puck.radius);
      const normalX = Math.cos(angle);
      const normalY = Math.sin(angle);
      const dot = this.puck.vx * normalX + this.puck.vy * normalY;
      this.puck.vx = (this.puck.vx - 2 * dot * normalX) * 0.8;
      this.puck.vy = (this.puck.vy - 2 * dot * normalY) * 0.8;
    }

    if (this.checkGoal()) {
      if (this.puck.x < CANVAS_WIDTH / 2) {
        this.handleGoal('player1');
      } else {
        this.handleGoal('player2');
      }
    }

    this.updateParticles();
  }

  start(): void {
    if (this.phase === 'ready') {
      this.phase = 'playing';
      this.message = '';
    }
  }

  reset(): void {
    this.player1 = this.createPlayer(CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2, false, 'red');
    this.player2 = this.createPlayer(CANVAS_WIDTH * 3 / 4, CANVAS_HEIGHT / 2, true, 'blue');
    this.puck = this.createPuck();
    this.player1Score = 0;
    this.player2Score = 0;
    this.phase = 'ready';
    this.message = '点击开始';
    this.particles = [];
    this.gameTime = 0;
    this.period = 1;
    this.maxPeriods = 3;
    this.goalFlashTimer = 0;
    this.lastGoalScorer = null;
    this.goalPauseTimer = 0;
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
