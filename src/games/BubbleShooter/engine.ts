import { BUBBLE_SHOOTER_CONSTANTS } from '../../utils/constants';

interface Bubble {
  x: number;
  y: number;
  color: string;
  row: number;
  col: number;
}

interface Shooter {
  x: number;
  y: number;
  angle: number;
  currentBubble: Bubble | null;
  nextBubble: Bubble | null;
}

interface FlyingBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

interface GameState {
  grid: (Bubble | null)[][];
  shooter: Shooter;
  flyingBubble: FlyingBubble | null;
  score: number;
  combo: number;
  gameOver: boolean;
}

export class BubbleShooterEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private lastTime: number = 0;
  private onScoreUpdate: (score: number) => void;
  private onGameOver: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    onScoreUpdate: (score: number) => void,
    onGameOver: () => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const { GRID_COLS, GRID_ROWS, BUBBLE_RADIUS, COLORS } = BUBBLE_SHOOTER_CONSTANTS;

    const grid: (Bubble | null)[][] = [];

    for (let row = 0; row < GRID_ROWS; row++) {
      grid[row] = [];
      const cols = row % 2 === 0 ? GRID_COLS : GRID_COLS - 1;
      for (let col = 0; col < cols; col++) {
        if (row < 5) {
          grid[row][col] = {
            x: this.getBubbleX(row, col),
            y: this.getBubbleY(row),
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            row,
            col
          };
        } else {
          grid[row][col] = null;
        }
      }
    }

    for (let row = 5; row < GRID_ROWS; row++) {
      grid[row] = [];
      const cols = row % 2 === 0 ? GRID_COLS : GRID_COLS - 1;
      for (let col = 0; col < cols; col++) {
        grid[row][col] = null;
      }
    }

    const shooterX = this.canvas.width / 2;
    const shooterY = this.canvas.height - 50;

    return {
      grid,
      shooter: {
        x: shooterX,
        y: shooterY,
        angle: -Math.PI / 2,
        currentBubble: this.createShooterBubble(shooterX, shooterY, COLORS),
        nextBubble: this.createShooterBubble(shooterX - 50, shooterY, COLORS)
      },
      flyingBubble: null,
      score: 0,
      combo: 0,
      gameOver: false
    };
  }

  private createShooterBubble(x: number, y: number, colors: string[]): Bubble {
    return {
      x,
      y,
      color: colors[Math.floor(Math.random() * colors.length)],
      row: -1,
      col: -1
    };
  }

  private getBubbleX(row: number, col: number): number {
    const { BUBBLE_RADIUS } = BUBBLE_SHOOTER_CONSTANTS;
    const offset = row % 2 === 0 ? BUBBLE_RADIUS : BUBBLE_RADIUS * 2;
    return offset + col * BUBBLE_RADIUS * 2;
  }

  private getBubbleY(row: number): number {
    const { BUBBLE_RADIUS } = BUBBLE_SHOOTER_CONSTANTS;
    return BUBBLE_RADIUS + row * BUBBLE_RADIUS * 1.73;
  }

  private getGridPosition(x: number, y: number): { row: number; col: number } {
    const { BUBBLE_RADIUS, GRID_COLS } = BUBBLE_SHOOTER_CONSTANTS;
    let row = Math.round((y - BUBBLE_RADIUS) / (BUBBLE_RADIUS * 1.73));
    row = Math.max(0, row);

    const offset = row % 2 === 0 ? BUBBLE_RADIUS : BUBBLE_RADIUS * 2;
    let col = Math.round((x - offset) / (BUBBLE_RADIUS * 2));
    const maxCols = row % 2 === 0 ? GRID_COLS : GRID_COLS - 1;
    col = Math.max(0, Math.min(col, maxCols - 1));

    return { row, col };
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
    const { shooter } = this.state;
    const minAngle = -Math.PI + 0.1;
    const maxAngle = -0.1;
    shooter.angle = Math.max(minAngle, Math.min(maxAngle, angle));
  }

  public shoot(): void {
    if (this.state.flyingBubble || this.state.gameOver) return;

    const { shooter } = this.state;
    if (!shooter.currentBubble) return;

    const speed = 12;
    this.state.flyingBubble = {
      x: shooter.x,
      y: shooter.y,
      vx: Math.cos(shooter.angle) * speed,
      vy: Math.sin(shooter.angle) * speed,
      color: shooter.currentBubble.color
    };

    shooter.currentBubble = shooter.nextBubble;
    shooter.currentBubble!.x = shooter.x;
    shooter.currentBubble!.y = shooter.y;

    const { COLORS } = BUBBLE_SHOOTER_CONSTANTS;
    shooter.nextBubble = this.createShooterBubble(shooter.x - 50, shooter.y, COLORS);
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

    if (this.state.flyingBubble) {
      const bubble = this.state.flyingBubble;
      bubble.x += bubble.vx;
      bubble.y += bubble.vy;

      if (bubble.x < BUBBLE_SHOOTER_CONSTANTS.BUBBLE_RADIUS) {
        bubble.x = BUBBLE_SHOOTER_CONSTANTS.BUBBLE_RADIUS;
        bubble.vx = -bubble.vx;
      }
      if (bubble.x > this.canvas.width - BUBBLE_SHOOTER_CONSTANTS.BUBBLE_RADIUS) {
        bubble.x = this.canvas.width - BUBBLE_SHOOTER_CONSTANTS.BUBBLE_RADIUS;
        bubble.vx = -bubble.vx;
      }

      if (bubble.y < BUBBLE_SHOOTER_CONSTANTS.BUBBLE_RADIUS) {
        this.snapBubble(bubble);
        return;
      }

      this.checkBubbleCollision();
    }
  }

  private checkBubbleCollision(): void {
    const { flyingBubble, grid } = this.state;
    if (!flyingBubble) return;

    const { BUBBLE_RADIUS } = BUBBLE_SHOOTER_CONSTANTS;

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const bubble = grid[row][col];
        if (bubble) {
          const dist = Math.hypot(flyingBubble.x - bubble.x, flyingBubble.y - bubble.y);
          if (dist < BUBBLE_RADIUS * 1.9) {
            this.snapBubble(flyingBubble);
            return;
          }
        }
      }
    }
  }

  private snapBubble(flyingBubble: FlyingBubble): void {
    const pos = this.getGridPosition(flyingBubble.x, flyingBubble.y);
    let { row, col } = pos;

    this.ensureGridRow(row);
    const maxCols = row % 2 === 0 ? BUBBLE_SHOOTER_CONSTANTS.GRID_COLS : BUBBLE_SHOOTER_CONSTANTS.GRID_COLS - 1;
    col = Math.min(col, maxCols - 1);
    col = Math.max(0, col);

    if (this.state.grid[row][col]) {
      const neighbors = this.getNeighbors(row, col);
      let bestDist = Infinity;
      let bestPos = { row, col };

      for (const n of neighbors) {
        if (n.row >= 0 && n.row < this.state.grid.length) {
          this.ensureGridRow(n.row);
          const nMaxCols = n.row % 2 === 0 ? BUBBLE_SHOOTER_CONSTANTS.GRID_COLS : BUBBLE_SHOOTER_CONSTANTS.GRID_COLS - 1;
          if (n.col >= 0 && n.col < nMaxCols && !this.state.grid[n.row][n.col]) {
            const dist = Math.hypot(flyingBubble.x - this.getBubbleX(n.row, n.col), flyingBubble.y - this.getBubbleY(n.row));
            if (dist < bestDist) {
              bestDist = dist;
              bestPos = n;
            }
          }
        }
      }
      row = bestPos.row;
      col = bestPos.col;
    }

    this.ensureGridRow(row);

    this.state.grid[row][col] = {
      x: this.getBubbleX(row, col),
      y: this.getBubbleY(row),
      color: flyingBubble.color,
      row,
      col
    };

    this.state.flyingBubble = null;

    this.checkMatchAndRemove(row, col);
    this.checkFloatingBubbles();
    this.checkGameOver();
  }

  private ensureGridRow(row: number): void {
    while (this.state.grid.length <= row) {
      const newRow = this.state.grid.length;
      const cols = newRow % 2 === 0 ? BUBBLE_SHOOTER_CONSTANTS.GRID_COLS : BUBBLE_SHOOTER_CONSTANTS.GRID_COLS - 1;
      this.state.grid.push(new Array(cols).fill(null));
    }
  }

  private getNeighbors(row: number, col: number): { row: number; col: number }[] {
    const isEvenRow = row % 2 === 0;
    if (isEvenRow) {
      return [
        { row: row - 1, col: col - 1 },
        { row: row - 1, col: col },
        { row, col: col - 1 },
        { row, col: col + 1 },
        { row: row + 1, col: col - 1 },
        { row: row + 1, col: col }
      ];
    } else {
      return [
        { row: row - 1, col: col },
        { row: row - 1, col: col + 1 },
        { row, col: col - 1 },
        { row, col: col + 1 },
        { row: row + 1, col: col },
        { row: row + 1, col: col + 1 }
      ];
    }
  }

  private checkMatchAndRemove(row: number, col: number): void {
    const bubble = this.state.grid[row][col];
    if (!bubble) return;

    const targetColor = bubble.color;
    const connected: { row: number; col: number }[] = [];
    const visited = new Set<string>();

    const stack: { row: number; col: number }[] = [{ row, col }];

    while (stack.length > 0) {
      const current = stack.pop()!;
      const key = `${current.row},${current.col}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const currentBubble = this.state.grid[current.row]?.[current.col];
      if (!currentBubble || currentBubble.color !== targetColor) continue;

      connected.push(current);

      const neighbors = this.getNeighbors(current.row, current.col);
      for (const n of neighbors) {
        const nKey = `${n.row},${n.col}`;
        if (!visited.has(nKey) && n.row >= 0 && n.row < this.state.grid.length) {
          const maxCols = n.row % 2 === 0 ? BUBBLE_SHOOTER_CONSTANTS.GRID_COLS : BUBBLE_SHOOTER_CONSTANTS.GRID_COLS - 1;
          if (n.col >= 0 && n.col < maxCols) {
            stack.push(n);
          }
        }
      }
    }

    if (connected.length >= 3) {
      for (const pos of connected) {
        this.state.grid[pos.row][pos.col] = null;
      }

      this.state.combo++;
      const points = connected.length * 10 * this.state.combo;
      this.state.score += points;
      this.onScoreUpdate(this.state.score);
    } else {
      this.state.combo = 0;
    }
  }

  private checkFloatingBubbles(): void {
    const attached = new Set<string>();
    const { GRID_COLS } = BUBBLE_SHOOTER_CONSTANTS;

    for (let col = 0; col < GRID_COLS; col++) {
      if (this.state.grid[0] && this.state.grid[0][col]) {
        this.markAttached(0, col, attached);
      }
    }

    const floating: { row: number; col: number }[] = [];

    for (let row = 0; row < this.state.grid.length; row++) {
      const cols = row % 2 === 0 ? GRID_COLS : GRID_COLS - 1;
      for (let col = 0; col < cols; col++) {
        if (this.state.grid[row] && this.state.grid[row][col] && !attached.has(`${row},${col}`)) {
          floating.push({ row, col });
        }
      }
    }

    if (floating.length > 0) {
      for (const pos of floating) {
        this.state.grid[pos.row][pos.col] = null;
      }

      this.state.score += floating.length * 15;
      this.state.combo++;
      this.onScoreUpdate(this.state.score);
    }
  }

  private markAttached(row: number, col: number, attached: Set<string>): void {
    if (row < 0 || row >= this.state.grid.length) return;

    const maxCols = row % 2 === 0 ? BUBBLE_SHOOTER_CONSTANTS.GRID_COLS : BUBBLE_SHOOTER_CONSTANTS.GRID_COLS - 1;
    if (col < 0 || col >= maxCols) return;

    const key = `${row},${col}`;
    if (attached.has(key)) return;
    if (!this.state.grid[row] || !this.state.grid[row][col]) return;

    attached.add(key);

    const neighbors = this.getNeighbors(row, col);
    for (const n of neighbors) {
      this.markAttached(n.row, n.col, attached);
    }
  }

  private checkGameOver(): void {
    const { GRID_ROWS, BUBBLE_RADIUS } = BUBBLE_SHOOTER_CONSTANTS;
    const groundY = this.canvas.height - 100;

    for (let row = GRID_ROWS - 3; row < this.state.grid.length; row++) {
      for (let col = 0; col < (this.state.grid[row]?.length || 0); col++) {
        const bubble = this.state.grid[row][col];
        if (bubble && bubble.y + BUBBLE_RADIUS > groundY) {
          this.state.gameOver = true;
          this.onGameOver();
          return;
        }
      }
    }
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawBackground();
    this.drawGrid();
    this.drawShooter();
    this.drawAimLine();

    if (this.state.flyingBubble) {
      this.drawBubble(this.state.flyingBubble.x, this.state.flyingBubble.y, this.state.flyingBubble.color);
    }

    this.drawUI();
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.strokeStyle = 'rgba(108, 92, 231, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }

    const groundY = this.canvas.height - 100;
    const groundGradient = ctx.createLinearGradient(0, groundY - 20, 0, this.canvas.height);
    groundGradient.addColorStop(0, 'rgba(108, 92, 231, 0)');
    groundGradient.addColorStop(1, 'rgba(108, 92, 231, 0.3)');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY - 20, this.canvas.width, this.canvas.height - groundY + 20);
  }

  private drawGrid(): void {
    for (let row = 0; row < this.state.grid.length; row++) {
      for (let col = 0; col < (this.state.grid[row]?.length || 0); col++) {
        const bubble = this.state.grid[row][col];
        if (bubble) {
          this.drawBubble(bubble.x, bubble.y, bubble.color);
        }
      }
    }
  }

  private drawBubble(x: number, y: number, color: string): void {
    const ctx = this.ctx;
    const { BUBBLE_RADIUS } = BUBBLE_SHOOTER_CONSTANTS;

    ctx.beginPath();
    ctx.arc(x, y, BUBBLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    const gradient = ctx.createRadialGradient(
      x - BUBBLE_RADIUS / 3, y - BUBBLE_RADIUS / 3, 0,
      x, y, BUBBLE_RADIUS
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, BUBBLE_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawShooter(): void {
    const ctx = this.ctx;
    const { shooter } = this.state;
    const { BUBBLE_RADIUS } = BUBBLE_SHOOTER_CONSTANTS;

    ctx.beginPath();
    ctx.arc(shooter.x, shooter.y, 40, 0, Math.PI * 2);
    const baseGradient = ctx.createRadialGradient(
      shooter.x, shooter.y, 0,
      shooter.x, shooter.y, 40
    );
    baseGradient.addColorStop(0, '#6c5ce7');
    baseGradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = baseGradient;
    ctx.fill();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.translate(shooter.x, shooter.y);
    ctx.rotate(shooter.angle);

    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(50, -10);
    ctx.lineTo(55, 0);
    ctx.lineTo(50, 10);
    ctx.lineTo(0, 12);
    ctx.closePath();
    ctx.fillStyle = '#4a4a6a';
    ctx.fill();
    ctx.strokeStyle = '#6c5ce7';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    if (shooter.currentBubble) {
      ctx.beginPath();
      ctx.arc(shooter.x, shooter.y, BUBBLE_RADIUS * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = shooter.currentBubble.color;
      ctx.fill();
    }

    if (shooter.nextBubble) {
      ctx.beginPath();
      ctx.arc(shooter.x - 50, shooter.y, BUBBLE_RADIUS * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = shooter.nextBubble.color;
      ctx.fill();

      ctx.font = '12px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('下一个', shooter.x - 50, shooter.y + BUBBLE_RADIUS + 15);
    }
  }

  private drawAimLine(): void {
    if (this.state.flyingBubble) return;

    const ctx = this.ctx;
    const { shooter } = this.state;
    const { BUBBLE_RADIUS } = BUBBLE_SHOOTER_CONSTANTS;

    const lineLength = 200;
    const endX = shooter.x + Math.cos(shooter.angle) * lineLength;
    const endY = shooter.y + Math.sin(shooter.angle) * lineLength;

    ctx.beginPath();
    ctx.setLineDash([10, 10]);
    ctx.moveTo(shooter.x, shooter.y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(endX, endY, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
  }

  private drawUI(): void {
    const ctx = this.ctx;

    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'left';
    ctx.fillText(`分数: ${this.state.score}`, 20, 35);

    if (this.state.combo > 1) {
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#ff6b9d';
      ctx.fillText(`连击 x${this.state.combo}`, 20, 65);
    }

    const groundY = this.canvas.height - 100;
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(`地面警戒线`, 20, groundY - 5);
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(this.canvas.width, groundY);
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  public getScore(): number {
    return this.state.score;
  }

  public isGameOver(): boolean {
    return this.state.gameOver;
  }

  public getShooterAngle(): number {
    return this.state.shooter.angle;
  }
}
