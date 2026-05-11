export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export const SNAKE_REMAKE_CONSTANTS = {
  GRID_SIZE: 20,
  CELL_SIZE: 25,
  CANVAS_SIZE: 500,
  INITIAL_SPEED: 150,
  SPEED_INCREMENT: 10,
  MIN_SPEED: 50,
};

export interface SnakeRemakeState {
  snake: Position[];
  food: Position;
  direction: Direction;
  score: number;
  level: number;
  isGameOver: boolean;
  isPaused: boolean;
}

export class SnakeRemakeEngine {
  private snake: Position[] = [];
  private food: Position = { x: 0, y: 0 };
  private direction: Direction = 'right';
  private nextDirection: Direction = 'right';
  private score: number = 0;
  private level: number = 1;
  private isGameOver: boolean = false;
  private isPaused: boolean = false;
  private foodEaten: number = 0;

  constructor() {
    this.init();
  }

  init(): void {
    const startX = Math.floor(SNAKE_REMAKE_CONSTANTS.GRID_SIZE / 2);
    const startY = Math.floor(SNAKE_REMAKE_CONSTANTS.GRID_SIZE / 2);

    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];

    this.direction = 'right';
    this.nextDirection = 'right';
    this.score = 0;
    this.level = 1;
    this.isGameOver = false;
    this.isPaused = false;
    this.foodEaten = 0;
    this.generateFood();
  }

  getState(): SnakeRemakeState {
    return {
      snake: [...this.snake],
      food: { ...this.food },
      direction: this.direction,
      score: this.score,
      level: this.level,
      isGameOver: this.isGameOver,
      isPaused: this.isPaused,
    };
  }

  setDirection(dir: Direction): void {
    const opposites: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left',
    };

    if (opposites[dir] !== this.direction && !this.isPaused && !this.isGameOver) {
      this.nextDirection = dir;
    }
  }

  togglePause(): void {
    if (!this.isGameOver) {
      this.isPaused = !this.isPaused;
    }
  }

  generateFood(): void {
    const occupied = new Set(this.snake.map((p) => `${p.x},${p.y}`));
    const available: Position[] = [];

    for (let x = 0; x < SNAKE_REMAKE_CONSTANTS.GRID_SIZE; x++) {
      for (let y = 0; y < SNAKE_REMAKE_CONSTANTS.GRID_SIZE; y++) {
        if (!occupied.has(`${x},${y}`)) {
          available.push({ x, y });
        }
      }
    }

    if (available.length > 0) {
      this.food = available[Math.floor(Math.random() * available.length)];
    }
  }

  tick(): boolean {
    if (this.isGameOver || this.isPaused) return false;

    this.direction = this.nextDirection;

    const head = { ...this.snake[0] };

    switch (this.direction) {
      case 'up':
        head.y -= 1;
        break;
      case 'down':
        head.y += 1;
        break;
      case 'left':
        head.x -= 1;
        break;
      case 'right':
        head.x += 1;
        break;
    }

    if (
      head.x < 0 ||
      head.x >= SNAKE_REMAKE_CONSTANTS.GRID_SIZE ||
      head.y < 0 ||
      head.y >= SNAKE_REMAKE_CONSTANTS.GRID_SIZE
    ) {
      this.isGameOver = true;
      return false;
    }

    for (let i = 0; i < this.snake.length; i++) {
      if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
        this.isGameOver = true;
        return false;
      }
    }

    this.snake.unshift(head);

    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10 * this.level;
      this.foodEaten++;

      if (this.foodEaten % 5 === 0) {
        this.level++;
      }

      this.generateFood();
      return true;
    }

    this.snake.pop();
    return false;
  }

  getCurrentSpeed(): number {
    return Math.max(
      SNAKE_REMAKE_CONSTANTS.MIN_SPEED,
      SNAKE_REMAKE_CONSTANTS.INITIAL_SPEED -
        (this.level - 1) * SNAKE_REMAKE_CONSTANTS.SPEED_INCREMENT
    );
  }

  reset(): void {
    this.init();
  }
}
