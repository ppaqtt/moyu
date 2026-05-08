import { SNAKE_CONSTANTS } from '../../utils/constants';

const { GRID_SIZE, CANVAS_SIZE } = SNAKE_CONSTANTS;

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface GameSnakeState {
  snake: Position[];
  food: Position;
  direction: Direction;
  score: number;
  isGameOver: boolean;
  speed: number;
}

export class GameSnakeEngine {
  private snake: Position[];
  private food: Position;
  private direction: Direction;
  private nextDirection: Direction;
  private score: number;
  private isGameOver: boolean;
  private speed: number;
  private foodEaten: number;

  constructor() {
    this.snake = [];
    this.food = { x: 0, y: 0 };
    this.direction = 'right';
    this.nextDirection = 'right';
    this.score = 0;
    this.isGameOver = false;
    this.speed = SNAKE_CONSTANTS.INITIAL_SPEED;
    this.foodEaten = 0;
    this.init();
  }

  init(): void {
    const startX = Math.floor(GRID_SIZE / 2);
    const startY = Math.floor(GRID_SIZE / 2);

    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY }
    ];

    this.direction = 'right';
    this.nextDirection = 'right';
    this.score = 0;
    this.isGameOver = false;
    this.speed = SNAKE_CONSTANTS.INITIAL_SPEED;
    this.foodEaten = 0;
    this.generateFood();
  }

  getState(): GameSnakeState {
    return {
      snake: [...this.snake],
      food: { ...this.food },
      direction: this.direction,
      score: this.score,
      isGameOver: this.isGameOver,
      speed: this.speed
    };
  }

  setDirection(dir: Direction): void {
    const opposites: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    };

    if (opposites[dir] !== this.direction) {
      this.nextDirection = dir;
    }
  }

  generateFood(): void {
    const occupied = new Set(this.snake.map(p => `${p.x},${p.y}`));
    const available: Position[] = [];

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
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
    if (this.isGameOver) return false;

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

    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
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
      this.score += 10;
      this.foodEaten++;

      if (this.foodEaten % 5 === 0) {
        this.speed = Math.max(50, this.speed - SNAKE_CONSTANTS.SPEED_INCREMENT);
      }

      this.generateFood();
      return true;
    }

    this.snake.pop();
    return false;
  }

  checkCollision(): boolean {
    return this.isGameOver;
  }

  reset(): void {
    this.init();
  }
}
