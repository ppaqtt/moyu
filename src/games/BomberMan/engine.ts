export interface Position {
  x: number;
  y: number;
}

export interface Bomb {
  id: number;
  position: Position;
  timer: number;
  range: number;
}

export interface Explosion {
  id: number;
  positions: Position[];
  timer: number;
}

export enum TileType {
  EMPTY = 0,
  WALL = 1,
  BRICK = 2,
  POWERUP = 3,
}

export const BOMBERMAN_CONSTANTS = {
  GRID_SIZE: 13,
  CELL_SIZE: 48,
  BOMB_TIMER: 3000,
  EXPLOSION_TIMER: 500,
  PLAYER_SPEED: 150,
};

export interface BomberManState {
  player: Position;
  bombs: Bomb[];
  explosions: Explosion[];
  grid: TileType[][];
  score: number;
  lives: number;
  bombRange: number;
  maxBombs: number;
  currentBombs: number;
  isGameOver: boolean;
  isPaused: boolean;
}

export class BomberManEngine {
  private player: Position = { x: 1, y: 1 };
  private bombs: Bomb[] = [];
  private explosions: Explosion[] = [];
  private grid: TileType[][] = [];
  private score: number = 0;
  private lives: number = 3;
  private bombRange: number = 2;
  private maxBombs: number = 1;
  private currentBombs: number = 0;
  private isGameOver: boolean = false;
  private isPaused: boolean = false;
  private bombIdCounter: number = 0;
  private explosionIdCounter: number = 0;

  constructor() {
    this.init();
  }

  init(): void {
    this.player = { x: 1, y: 1 };
    this.bombs = [];
    this.explosions = [];
    this.score = 0;
    this.lives = 3;
    this.bombRange = 2;
    this.maxBombs = 1;
    this.currentBombs = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.generateGrid();
  }

  private generateGrid(): void {
    this.grid = [];
    for (let y = 0; y < BOMBERMAN_CONSTANTS.GRID_SIZE; y++) {
      this.grid[y] = [];
      for (let x = 0; x < BOMBERMAN_CONSTANTS.GRID_SIZE; x++) {
        if (x === 0 || x === BOMBERMAN_CONSTANTS.GRID_SIZE - 1 ||
            y === 0 || y === BOMBERMAN_CONSTANTS.GRID_SIZE - 1 ||
            (x % 2 === 0 && y % 2 === 0)) {
          this.grid[y][x] = TileType.WALL;
        } else if ((x > 2 || y > 2) && Math.random() < 0.7) {
          this.grid[y][x] = TileType.BRICK;
        } else {
          this.grid[y][x] = TileType.EMPTY;
        }
      }
    }
  }

  getState(): BomberManState {
    return {
      player: { ...this.player },
      bombs: this.bombs.map((b) => ({ ...b, position: { ...b.position } })),
      explosions: this.explosions.map((e) => ({
        ...e,
        positions: e.positions.map((p) => ({ ...p })),
      })),
      grid: this.grid.map((row) => [...row]),
      score: this.score,
      lives: this.lives,
      bombRange: this.bombRange,
      maxBombs: this.maxBombs,
      currentBombs: this.currentBombs,
      isGameOver: this.isGameOver,
      isPaused: this.isPaused,
    };
  }

  movePlayer(dx: number, dy: number): void {
    if (this.isGameOver || this.isPaused) return;

    const newX = this.player.x + dx;
    const newY = this.player.y + dy;

    if (newX < 0 || newX >= BOMBERMAN_CONSTANTS.GRID_SIZE ||
        newY < 0 || newY >= BOMBERMAN_CONSTANTS.GRID_SIZE) {
      return;
    }

    const tile = this.grid[newY][newX];
    if (tile === TileType.WALL || tile === TileType.BRICK) {
      return;
    }

    const hasBomb = this.bombs.some((b) => b.position.x === newX && b.position.y === newY);
    if (hasBomb) {
      return;
    }

    if (tile === TileType.POWERUP) {
      const rand = Math.random();
      if (rand < 0.5) {
        this.bombRange = Math.min(this.bombRange + 1, 5);
      } else {
        this.maxBombs = Math.min(this.maxBombs + 1, 5);
      }
      this.grid[newY][newX] = TileType.EMPTY;
      this.score += 50;
    }

    this.player.x = newX;
    this.player.y = newY;
  }

  placeBomb(): void {
    if (this.isGameOver || this.isPaused) return;
    if (this.currentBombs >= this.maxBombs) return;

    const hasBomb = this.bombs.some(
      (b) => b.position.x === this.player.x && b.position.y === this.player.y
    );
    if (hasBomb) return;

    this.bombs.push({
      id: this.bombIdCounter++,
      position: { ...this.player },
      timer: BOMBERMAN_CONSTANTS.BOMB_TIMER,
      range: this.bombRange,
    });
    this.currentBombs++;
  }

  tick(deltaTime: number): void {
    if (this.isGameOver || this.isPaused) return;

    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const bomb = this.bombs[i];
      bomb.timer -= deltaTime;

      if (bomb.timer <= 0) {
        this.explodeBomb(bomb);
        this.bombs.splice(i, 1);
        this.currentBombs--;
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      explosion.timer -= deltaTime;

      if (explosion.timer <= 0) {
        this.explosions.splice(i, 1);
      }
    }

    this.checkPlayerExplosion();
    this.checkWinCondition();
  }

  private explodeBomb(bomb: Bomb): void {
    const explosionPositions: Position[] = [{ ...bomb.position }];

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    for (const dir of directions) {
      for (let i = 1; i <= bomb.range; i++) {
        const x = bomb.position.x + dir.dx * i;
        const y = bomb.position.y + dir.dy * i;

        if (x < 0 || x >= BOMBERMAN_CONSTANTS.GRID_SIZE ||
            y < 0 || y >= BOMBERMAN_CONSTANTS.GRID_SIZE) {
          break;
        }

        const tile = this.grid[y][x];

        if (tile === TileType.WALL) {
          break;
        }

        explosionPositions.push({ x, y });

        if (tile === TileType.BRICK) {
          if (Math.random() < 0.2) {
            this.grid[y][x] = TileType.POWERUP;
          } else {
            this.grid[y][x] = TileType.EMPTY;
          }
          this.score += 10;
          break;
        }
      }
    }

    this.explosions.push({
      id: this.explosionIdCounter++,
      positions: explosionPositions,
      timer: BOMBERMAN_CONSTANTS.EXPLOSION_TIMER,
    });
  }

  private checkPlayerExplosion(): void {
    for (const explosion of this.explosions) {
      for (const pos of explosion.positions) {
        if (pos.x === this.player.x && pos.y === this.player.y) {
          this.lives--;
          if (this.lives <= 0) {
            this.isGameOver = true;
          } else {
            this.player = { x: 1, y: 1 };
          }
          return;
        }
      }
    }
  }

  private checkWinCondition(): void {
    let hasBricks = false;
    for (let y = 0; y < BOMBERMAN_CONSTANTS.GRID_SIZE; y++) {
      for (let x = 0; x < BOMBERMAN_CONSTANTS.GRID_SIZE; x++) {
        if (this.grid[y][x] === TileType.BRICK) {
          hasBricks = true;
          break;
        }
      }
      if (hasBricks) break;
    }

    if (!hasBricks) {
      this.score += 1000;
      this.isGameOver = true;
    }
  }

  togglePause(): void {
    if (!this.isGameOver) {
      this.isPaused = !this.isPaused;
    }
  }

  reset(): void {
    this.init();
  }
}
