// 祖玛游戏引擎
import { ZUMA_CONSTANTS } from '../../utils/constants';

interface Ball {
  x: number;
  y: number;
  color: string;
  progress: number; // 在路径上的进度 0-1
}

interface Shooter {
  x: number;
  y: number;
  angle: number;
  currentBall: Ball | null;
  nextBall: Ball | null;
}

interface GameState {
  balls: Ball[];
  shooter: Shooter;
  shootingBall: Ball | null;
  score: number;
  combo: number;
  gameOver: boolean;
  level: number;
  pathPoints: { x: number; y: number }[];
}

export class ZumaEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private lastTime: number = 0;
  private onScoreUpdate: (score: number) => void;
  private onGameOver: () => void;
  private onLevelUp: (level: number) => void;

  constructor(
    canvas: HTMLCanvasElement,
    onScoreUpdate: (score: number) => void,
    onGameOver: () => void,
    onLevelUp: (level: number) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.onLevelUp = onLevelUp;
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2 + 50;
    const colors = ZUMA_CONSTANTS.COLORS;

    // 生成路径点 - 螺旋形状
    const pathPoints = this.generateSpiralPath(centerX, centerY);

    // 生成初始球链
    const balls: Ball[] = [];
    for (let i = 0; i < 30; i++) {
      balls.push({
        x: pathPoints[i % pathPoints.length].x,
        y: pathPoints[i % pathPoints.length].y,
        color: colors[Math.floor(Math.random() * colors.length)],
        progress: i / pathPoints.length
      });
    }

    // 生成射手
    const currentBall = {
      x: centerX,
      y: centerY,
      color: colors[Math.floor(Math.random() * colors.length)],
      progress: 0
    };

    const nextBall = {
      x: centerX - 30,
      y: centerY,
      color: colors[Math.floor(Math.random() * colors.length)],
      progress: 0
    };

    return {
      balls,
      shooter: {
        x: centerX,
        y: centerY,
        angle: -Math.PI / 2,
        currentBall,
        nextBall
      },
      shootingBall: null,
      score: 0,
      combo: 0,
      gameOver: false,
      level: 1,
      pathPoints
    };
  }

  private generateSpiralPath(cx: number, cy: number): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const { CURVE_RADIUS } = ZUMA_CONSTANTS;

    // 生成螺旋路径
    let angle = 0;
    const turns = 2.5;
    const totalPoints = 120;

    for (let i = 0; i < totalPoints; i++) {
      const progress = i / totalPoints;
      const radius = CURVE_RADIUS - progress * 150;
      const theta = angle + progress * Math.PI * 2 * turns;

      points.push({
        x: cx + Math.cos(theta) * radius,
        y: cy + Math.sin(theta) * radius
      });

      angle += 0.05;
    }

    return points;
  }

  private getPointOnPath(progress: number): { x: number; y: number } {
    const index = Math.floor(progress * this.state.pathPoints.length) % this.state.pathPoints.length;
    return this.state.pathPoints[index];
  }

  public start(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  public stop(): void {
    this.lastTime = 0;
  }

  public reset(): void {
    this.state = this.createInitialState();
  }

  public setAngle(angle: number): void {
    this.state.shooter.angle = angle;
  }

  public shoot(): void {
    if (this.state.shootingBall || this.state.gameOver) return;

    const { shooter } = this.state;
    if (!shooter.currentBall) return;

    this.state.shootingBall = {
      x: shooter.x,
      y: shooter.y,
      color: shooter.currentBall.color,
      progress: 0
    };

    // 更新下一个球
    const colors = ZUMA_CONSTANTS.COLORS;
    shooter.currentBall = shooter.nextBall;
    shooter.nextBall = {
      x: shooter.x - 30,
      y: shooter.y,
      color: colors[Math.floor(Math.random() * colors.length)],
      progress: 0
    };
  }

  private gameLoop = (): void => {
    if (this.lastTime === 0) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    if (this.state.gameOver) return;

    // 更新路径上的球
    const speed = ZUMA_CONSTANTS.PATH_SPEED * (deltaTime / 16);
    for (const ball of this.state.balls) {
      ball.progress += speed / 1000;
      if (ball.progress >= 1) ball.progress -= 1;

      const pos = this.getPointOnPath(ball.progress);
      ball.x = pos.x;
      ball.y = pos.y;
    }

    // 更新射出的球
    if (this.state.shootingBall) {
      const ball = this.state.shootingBall;
      const { SHOOT_SPEED } = ZUMA_CONSTANTS;
      ball.x += Math.cos(this.state.shooter.angle) * SHOOT_SPEED;
      ball.y += Math.sin(this.state.shooter.angle) * SHOOT_SPEED;

      // 检查是否出界
      if (ball.x < 0 || ball.x > this.canvas.width ||
          ball.y < 0 || ball.y > this.canvas.height) {
        this.state.shootingBall = null;
      } else {
        // 检查是否击中球链
        this.checkCollision();
      }
    }

    // 检查游戏结束 - 球到达中心
    const headBall = this.state.balls[0];
    const { shooter } = this.state;
    const dist = Math.hypot(headBall.x - shooter.x, headBall.y - shooter.y);
    if (dist < ZUMA_CONSTANTS.BALL_RADIUS * 2) {
      this.state.gameOver = true;
      this.onGameOver();
    }
  }

  private checkCollision(): void {
    if (!this.state.shootingBall) return;

    const ball = this.state.shootingBall;

    for (let i = 0; i < this.state.balls.length; i++) {
      const chainBall = this.state.balls[i];
      const dist = Math.hypot(ball.x - chainBall.x, ball.y - chainBall.y);

      if (dist < ZUMA_CONSTANTS.BALL_RADIUS * 2) {
        // 插入球
        this.insertBall(i, ball);
        return;
      }
    }
  }

  private insertBall(index: number, ball: Ball): void {
    this.state.balls.splice(index, 0, ball);
    this.state.shootingBall = null;

    // 检查是否消除
    this.checkMatch(index);
  }

  private checkMatch(index: number): void {
    const targetColor = this.state.balls[index].color;
    let start = index;
    let end = index;

    // 向左查找相同颜色
    while (start > 0 && this.state.balls[start - 1].color === targetColor) {
      start--;
    }

    // 向右查找相同颜色
    while (end < this.state.balls.length - 1 &&
           this.state.balls[end + 1].color === targetColor) {
      end++;
    }

    const matchCount = end - start + 1;

    if (matchCount >= 3) {
      // 消除球
      this.state.balls.splice(start, matchCount);

      // 计分
      this.state.combo++;
      const points = matchCount * 10 * this.state.combo;
      this.state.score += points;
      this.onScoreUpdate(this.state.score);

      // 检查升级
      if (this.state.balls.length < 10 && this.state.level < 5) {
        this.state.level++;
        this.onLevelUp(this.state.level);
      }

      // 继续检查
      if (start > 0) {
        this.checkMatch(Math.min(start, this.state.balls.length - 1));
      }
    } else {
      this.state.combo = 0;
    }
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制路径
    this.drawPath();

    // 绘制球链
    this.drawBalls();

    // 绘制射手
    this.drawShooter();

    // 绘制射出的球
    if (this.state.shootingBall) {
      this.drawBall(this.state.shootingBall);
    }

    // 绘制分数
    this.drawUI();
  }

  private drawPath(): void {
    const ctx = this.ctx;
    const { pathPoints } = this.state;

    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
      ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
    ctx.strokeStyle = 'rgba(108, 92, 231, 0.3)';
    ctx.lineWidth = ZUMA_CONSTANTS.BALL_RADIUS * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  private drawBalls(): void {
    for (const ball of this.state.balls) {
      this.drawBall(ball);
    }
  }

  private drawBall(ball: Ball): void {
    const ctx = this.ctx;
    const { BALL_RADIUS } = ZUMA_CONSTANTS;

    // 绘制球体
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();

    // 绘制高光
    const gradient = ctx.createRadialGradient(
      ball.x - BALL_RADIUS / 3, ball.y - BALL_RADIUS / 3, 0,
      ball.x, ball.y, BALL_RADIUS
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // 绘制边框
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawShooter(): void {
    const ctx = this.ctx;
    const { shooter } = this.state;
    const { BALL_RADIUS } = ZUMA_CONSTANTS;

    // 绘制发射器底座
    ctx.beginPath();
    ctx.arc(shooter.x, shooter.y, 35, 0, Math.PI * 2);
    const baseGradient = ctx.createRadialGradient(
      shooter.x, shooter.y, 0,
      shooter.x, shooter.y, 35
    );
    baseGradient.addColorStop(0, '#6c5ce7');
    baseGradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = baseGradient;
    ctx.fill();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 绘制炮管
    ctx.save();
    ctx.translate(shooter.x, shooter.y);
    ctx.rotate(shooter.angle);

    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(40, -8);
    ctx.lineTo(45, 0);
    ctx.lineTo(40, 8);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fillStyle = '#4a4a6a';
    ctx.fill();
    ctx.strokeStyle = '#6c5ce7';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // 绘制当前球
    if (shooter.currentBall) {
      ctx.beginPath();
      ctx.arc(shooter.x, shooter.y, BALL_RADIUS * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = shooter.currentBall.color;
      ctx.fill();
    }

    // 绘制下一个球预览
    if (shooter.nextBall) {
      ctx.beginPath();
      ctx.arc(shooter.x - 30, shooter.y, BALL_RADIUS * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = shooter.nextBall.color;
      ctx.fill();
      ctx.font = '10px Arial';
      ctx.fillStyle = '#fff';
      ctx.fillText('下一个', shooter.x - 50, shooter.y + 3);
    }
  }

  private drawUI(): void {
    const ctx = this.ctx;

    // 分数
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'left';
    ctx.fillText(`分数: ${this.state.score}`, 20, 40);

    // 连击
    if (this.state.combo > 0) {
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#ff6b9d';
      ctx.fillText(`连击 x${this.state.combo}`, 20, 70);
    }

    // 关卡
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#00d2ff';
    ctx.fillText(`关卡 ${this.state.level}`, 20, 100);

    // 剩余球数
    ctx.font = '16px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(`剩余: ${this.state.balls.length}`, 20, 130);
  }

  public getScore(): number {
    return this.state.score;
  }

  public getLevel(): number {
    return this.state.level;
  }

  public isGameOver(): boolean {
    return this.state.gameOver;
  }
}
