import { SNAKE_DUO_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, INITIAL_SPEED, FOOD_SCORE, TIME_BONUS } = SNAKE_DUO_CONSTANTS;

export type Direction = 'up' | 'down' | 'left' | 'right';
export type Player = 1 | 2;
export type GameStatus = 'idle' | 'playing' | 'gameover';

export interface Position {
  x: number;
  y: number;
}

export interface Snake {
  segments: Position[];
  direction: Direction;
  nextDirection: Direction;
  alive: boolean;
  color: string;
  glowColor: string;
}

export interface Food {
  position: Position;
  color: string;
}

export interface PlayerScore {
  score: number;
  foodEaten: number;
  length: number;
}

export interface SnakeDuoState {
  player1: Snake;
  player2: Snake;
  food: Food;
  gameStatus: GameStatus;
  scores: { player1: PlayerScore; player2: PlayerScore };
  winner: Player | null;
  elapsedTime: number;
}

export class SnakeDuoEngine {
  private player1: Snake;
  private player2: Snake;
  private food: Food;
  private gameStatus: GameStatus;
  private scores: { player1: PlayerScore; player2: PlayerScore };
  private winner: Player | null;
  private elapsedTime: number;
  private lastTimeUpdate: number;
  private speed: number;

  constructor() {
    this.init();
  }

  init(): void {
    const cellWidth = CANVAS_WIDTH / GRID_SIZE;
    const cellHeight = CANVAS_HEIGHT / GRID_SIZE;

    this.player1 = {
      segments: [
        { x: Math.floor(GRID_SIZE / 4), y: Math.floor(GRID_SIZE / 2) },
        { x: Math.floor(GRID_SIZE / 4) - 1, y: Math.floor(GRID_SIZE / 2) },
        { x: Math.floor(GRID_SIZE / 4) - 2, y: Math.floor(GRID_SIZE / 2) }
      ],
      direction: 'right',
      nextDirection: 'right',
      alive: true,
      color: '#00d2ff',
      glowColor: 'rgba(0, 210, 255, 0.5)'
    };

    this.player2 = {
      segments: [
        { x: Math.floor(GRID_SIZE * 3 / 4), y: Math.floor(GRID_SIZE / 2) },
        { x: Math.floor(GRID_SIZE * 3 / 4) + 1, y: Math.floor(GRID_SIZE / 2) },
        { x: Math.floor(GRID_SIZE * 3 / 4) + 2, y: Math.floor(GRID_SIZE / 2) }
      ],
      direction: 'left',
      nextDirection: 'left',
      alive: true,
      color: '#ff6b9d',
      glowColor: 'rgba(255, 107, 157, 0.5)'
    };

    this.food = { position: { x: 0, y: 0 }, color: '#ffd700' };
    this.gameStatus = 'idle';
    this.scores = {
      player1: { score: 0, foodEaten: 0, length: 3 },
      player2: { score: 0, foodEaten: 0, length: 3 }
    };
    this.winner = null;
    this.elapsedTime = 0;
    this.lastTimeUpdate = 0;
    this.speed = INITIAL_SPEED;

    this.generateFood();
  }

  getState(): SnakeDuoState {
    return {
      player1: { ...this.player1, segments: [...this.player1.segments] },
      player2: { ...this.player2, segments: [...this.player2.segments] },
      food: { ...this.food, position: { ...this.food.position } },
      gameStatus: this.gameStatus,
      scores: { ...this.scores },
      winner: this.winner,
      elapsedTime: this.elapsedTime
    };
  }

  start(): void {
    if (this.gameStatus === 'idle' || this.gameStatus === 'gameover') {
      this.init();
      this.gameStatus = 'playing';
      this.lastTimeUpdate = Date.now();
    }
  }

  pause(): void {
    if (this.gameStatus === 'playing') {
      this.gameStatus = 'idle';
    }
  }

  resume(): void {
    if (this.gameStatus === 'idle') {
      this.gameStatus = 'playing';
      this.lastTimeUpdate = Date.now();
    }
  }

  setDirection(player: Player, dir: Direction): void {
    const snake = player === 1 ? this.player1 : this.player2;
    const opposites: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    };

    if (opposites[dir] !== snake.direction) {
      snake.nextDirection = dir;
    }
  }

  generateFood(): void {
    const occupied = new Set<string>();
    
    this.player1.segments.forEach(seg => {
      if (seg) occupied.add(`${seg.x},${seg.y}`);
    });
    this.player2.segments.forEach(seg => {
      if (seg) occupied.add(`${seg.x},${seg.y}`);
    });

    const available: Position[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!occupied.has(`${x},${y}`)) {
          available.push({ x, y });
        }
      }
    }

    if (available.length > 0) {
      const pos = available[Math.floor(Math.random() * available.length)];
      const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#fd79a8', '#a29bfe'];
      this.food = {
        position: pos,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    }
  }

  private moveSnake(snake: Snake): Position {
    const head = { ...snake.segments[0] };

    snake.direction = snake.nextDirection;

    switch (snake.direction) {
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

    return head;
  }

  private checkWallCollision(head: Position): boolean {
    return head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE;
  }

  private checkSelfCollision(snake: Snake, head: Position): boolean {
    for (let i = 1; i < snake.segments.length; i++) {
      if (snake.segments[i].x === head.x && snake.segments[i].y === head.y) {
        return true;
      }
    }
    return false;
  }

  private checkOtherSnakeCollision(otherSnake: Snake, head: Position): boolean {
    for (const segment of otherSnake.segments) {
      if (segment.x === head.x && segment.y === head.y) {
        return true;
      }
    }
    return false;
  }

  tick(): void {
    if (this.gameStatus !== 'playing') return;
    if (!this.player1.alive && !this.player2.alive) return;

    this.elapsedTime += this.speed;

    if (this.player1.alive) {
      const head1 = this.moveSnake(this.player1);

      if (this.checkWallCollision(head1) || 
          this.checkSelfCollision(this.player1, head1) ||
          this.checkOtherSnakeCollision(this.player2, head1)) {
        this.player1.alive = false;
      } else {
        this.player1.segments.unshift(head1);

        if (head1.x === this.food.position.x && head1.y === this.food.position.y) {
          this.scores.player1.score += FOOD_SCORE;
          this.scores.player1.foodEaten++;
          this.scores.player1.length = this.player1.segments.length;
          this.generateFood();
        } else {
          this.player1.segments.pop();
        }
      }
    }

    if (this.player2.alive) {
      const head2 = this.moveSnake(this.player2);

      if (this.checkWallCollision(head2) ||
          this.checkSelfCollision(this.player2, head2) ||
          this.checkOtherSnakeCollision(this.player1, head2)) {
        this.player2.alive = false;
      } else {
        this.player2.segments.unshift(head2);

        if (head2.x === this.food.position.x && head2.y === this.food.position.y) {
          this.scores.player2.score += FOOD_SCORE;
          this.scores.player2.foodEaten++;
          this.scores.player2.length = this.player2.segments.length;
          this.generateFood();
        } else {
          this.player2.segments.pop();
        }
      }
    }

    if (!this.player1.alive || !this.player2.alive) {
      this.scores.player1.score += Math.floor(this.elapsedTime / 1000) * TIME_BONUS;
      this.scores.player2.score += Math.floor(this.elapsedTime / 1000) * TIME_BONUS;

      if (!this.player1.alive && !this.player2.alive) {
        this.winner = null;
      } else if (!this.player1.alive) {
        this.winner = 2;
      } else {
        this.winner = 1;
      }

      this.gameStatus = 'gameover';
    }
  }

  reset(): void {
    this.init();
  }

  getWinner(): Player | null {
    return this.winner;
  }

  getSpeed(): number {
    return this.speed;
  }
}
