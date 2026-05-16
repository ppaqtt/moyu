export interface Position {
  x: number;
  y: number;
}

export interface PacMan {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  nextDirection: 'up' | 'down' | 'left' | 'right';
  mouthAngle: number;
  mouthOpen: boolean;
}

export interface Ghost {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  color: string;
  isVulnerable: boolean;
  isRecovering: boolean;
  startRecoveryTime: number;
}

export interface GamePacmanState {
  pacman: PacMan;
  ghosts: Ghost[];
  dots: Position[];
  powerDots: Position[];
  score: number;
  lives: number;
  level: number;
  isGameOver: boolean;
  isWin: boolean;
  isPaused: boolean;
}

const GRID_COLS = 21;
const GRID_ROWS = 21;
const CELL_SIZE = 24;
const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;
const PACMAN_SPEED = 2;

const MAZE = [
  "#####################",
  "#........#.........#",
  "#.####.#.#.#######.#",
  "#.#    #.#.#.....#.#",
  "#.# ####.#.#.###.#.#",
  "#.####.#.#.#.#.#.#.#",
  "#......#...#.#.#...#",
  "####.#####.#.#.#####",
  "   #.#     #.#.....",
  "   #.#.###.#.######",
  "   #...#   #.......",
  "   #.###.#####.####",
  "   #.....#   #.#...",
  "#####.###.#.#.#.###",
  "#.....#   #.#...#..",
  "#.###.#.###.#####.#",
  "#.#...#.....#....#.",
  "#.#.#########.##.#.",
  "#.#........#...#.#",
  "#.#########..###.#.",
  "###################"
];

export class GamePacmanEngine {
  private pacman: PacMan;
  private ghosts: Ghost[];
  private dots: Position[];
  private powerDots: Position[];
  private score: number;
  private lives: number;
  private level: number;
  private isGameOver: boolean;
  private isWin: boolean;
  private isPaused: boolean;
  private lastMoveTime: number;
  private mouthToggleTime: number;

  constructor() {
    this.pacman = {
      x: CELL_SIZE * 10 + CELL_SIZE / 2,
      y: CELL_SIZE * 18 + CELL_SIZE / 2,
      direction: 'left',
      nextDirection: 'left',
      mouthAngle: 0,
      mouthOpen: true
    };
    this.ghosts = this.initGhosts();
    this.dots = this.initDots();
    this.powerDots = this.initPowerDots();
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.isGameOver = false;
    this.isWin = false;
    this.isPaused = false;
    this.lastMoveTime = 0;
    this.mouthToggleTime = 0;
  }

  private initGhosts(): Ghost[] {
    const ghostColors = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];
    return ghostColors.map((color, i) => ({
      x: CELL_SIZE * (10 + i),
      y: CELL_SIZE * 9,
      direction: 'down' as const,
      color,
      isVulnerable: false,
      isRecovering: false,
      startRecoveryTime: 0
    }));
  }

  private initDots(): Position[] {
    const dots: Position[] = [];
    for (let row = 0; row < MAZE.length; row++) {
      for (let col = 0; col < MAZE[row].length; col++) {
        if (MAZE[row][col] === '.') {
          dots.push({ x: col * CELL_SIZE + CELL_SIZE / 2, y: row * CELL_SIZE + CELL_SIZE / 2 });
        }
      }
    }
    return dots;
  }

  private initPowerDots(): Position[] {
    return [
      { x: CELL_SIZE * 1 + CELL_SIZE / 2, y: CELL_SIZE * 1 + CELL_SIZE / 2 },
      { x: CELL_SIZE * 19 + CELL_SIZE / 2, y: CELL_SIZE * 1 + CELL_SIZE / 2 },
      { x: CELL_SIZE * 1 + CELL_SIZE / 2, y: CELL_SIZE * 19 + CELL_SIZE / 2 },
      { x: CELL_SIZE * 19 + CELL_SIZE / 2, y: CELL_SIZE * 19 + CELL_SIZE / 2 }
    ];
  }

  getState(): GamePacmanState {
    return {
      pacman: { ...this.pacman },
      ghosts: this.ghosts.map(g => ({ ...g })),
      dots: this.dots.map(d => ({ ...d })),
      powerDots: this.powerDots.map(p => ({ ...p })),
      score: this.score,
      lives: this.lives,
      level: this.level,
      isGameOver: this.isGameOver,
      isWin: this.isWin,
      isPaused: this.isPaused
    };
  }

  private isWall(x: number, y: number): boolean {
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    if (row < 0 || row >= MAZE.length || col < 0 || col >= MAZE[0].length) return true;
    return MAZE[row][col] === '#';
  }

  setDirection(dir: 'up' | 'down' | 'left' | 'right'): void {
    this.pacman.nextDirection = dir;
  }

  private canMove(x: number, y: number, dir: 'up' | 'down' | 'left' | 'right'): boolean {
    const nextX = x + (dir === 'right' ? PACMAN_SPEED : dir === 'left' ? -PACMAN_SPEED : 0);
    const nextY = y + (dir === 'down' ? PACMAN_SPEED : dir === 'up' ? -PACMAN_SPEED : 0);
    return !this.isWall(nextX, y) && !this.isWall(x, nextY);
  }

  private updatePacman(): void {
    if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.nextDirection)) {
      this.pacman.direction = this.pacman.nextDirection;
    }

    let nextX = this.pacman.x;
    let nextY = this.pacman.y;

    switch (this.pacman.direction) {
      case 'up': nextY -= PACMAN_SPEED; break;
      case 'down': nextY += PACMAN_SPEED; break;
      case 'left': nextX -= PACMAN_SPEED; break;
      case 'right': nextX += PACMAN_SPEED; break;
    }

    if (!this.isWall(nextX, this.pacman.y) && !this.isWall(this.pacman.x, nextY)) {
      this.pacman.x = nextX;
      this.pacman.y = nextY;
    }

    const now = Date.now();
    if (now - this.mouthToggleTime > 100) {
      this.pacman.mouthOpen = !this.pacman.mouthOpen;
      this.pacman.mouthAngle = this.pacman.mouthOpen ? 0 : 30;
      this.mouthToggleTime = now;
    }
  }

  private updateGhosts(): void {
    const now = Date.now();
    for (const ghost of this.ghosts) {
      if (ghost.isVulnerable && !ghost.isRecovering && now - ghost.startRecoveryTime > 7000) {
        ghost.isRecovering = true;
        ghost.startRecoveryTime = now;
      }
      if (ghost.isRecovering && now - ghost.startRecoveryTime > 3000) {
        ghost.isVulnerable = false;
        ghost.isRecovering = false;
      }

      const speed = ghost.isVulnerable ? 1 : PACMAN_SPEED;
      let nextX = ghost.x;
      let nextY = ghost.y;
      switch (ghost.direction) {
        case 'up': nextY -= speed; break;
        case 'down': nextY += speed; break;
        case 'left': nextX -= speed; break;
        case 'right': nextX += speed; break;
      }

      if (this.isWall(nextX, ghost.y)) {
        const dirs: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];
        ghost.direction = dirs[Math.floor(Math.random() * dirs.length)];
      } else if (this.isWall(ghost.x, nextY)) {
        const dirs: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];
        ghost.direction = dirs[Math.floor(Math.random() * dirs.length)];
      } else {
        ghost.x = nextX;
        ghost.y = nextY;
      }
    }
  }

  private checkCollisions(): void {
    const pacmanCenterX = this.pacman.x;
    const pacmanCenterY = this.pacman.y;

    for (let i = this.dots.length - 1; i >= 0; i--) {
      const dot = this.dots[i];
      const dist = Math.sqrt((pacmanCenterX - dot.x) ** 2 + (pacmanCenterY - dot.y) ** 2);
      if (dist < 15) {
        this.dots.splice(i, 1);
        this.score += 10;
      }
    }

    for (let i = this.powerDots.length - 1; i >= 0; i--) {
      const dot = this.powerDots[i];
      const dist = Math.sqrt((pacmanCenterX - dot.x) ** 2 + (pacmanCenterY - dot.y) ** 2);
      if (dist < 15) {
        this.powerDots.splice(i, 1);
        this.score += 50;
        for (const ghost of this.ghosts) {
          ghost.isVulnerable = true;
          ghost.isRecovering = false;
        }
      }
    }

    for (const ghost of this.ghosts) {
      const dist = Math.sqrt((pacmanCenterX - ghost.x) ** 2 + (pacmanCenterY - ghost.y) ** 2);
      if (dist < 18) {
        if (ghost.isVulnerable) {
          ghost.x = CELL_SIZE * 10;
          ghost.y = CELL_SIZE * 9;
          this.score += 200;
        } else {
          this.lives--;
          if (this.lives <= 0) {
            this.isGameOver = true;
          } else {
            this.resetPositions();
          }
          return;
        }
      }
    }

    if (this.dots.length === 0 && this.powerDots.length === 0) {
      this.isWin = true;
    }
  }

  private resetPositions(): void {
    this.pacman.x = CELL_SIZE * 10 + CELL_SIZE / 2;
    this.pacman.y = CELL_SIZE * 18 + CELL_SIZE / 2;
    this.pacman.direction = 'left';
    this.pacman.nextDirection = 'left';

    const ghostColors = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];
    this.ghosts.forEach((ghost, i) => {
      ghost.x = CELL_SIZE * (10 + i);
      ghost.y = CELL_SIZE * 9;
      ghost.isVulnerable = false;
      ghost.isRecovering = false;
    });
  }

  tick(): void {
    if (this.isGameOver || this.isWin || this.isPaused) return;

    this.updatePacman();
    this.updateGhosts();
    this.checkCollisions();
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  reset(): void {
    this.pacman = {
      x: CELL_SIZE * 10,
      y: CELL_SIZE * 15,
      direction: 'left',
      nextDirection: 'left',
      mouthAngle: 0,
      mouthOpen: true
    };
    this.ghosts = this.initGhosts();
    this.dots = this.initDots();
    this.powerDots = this.initPowerDots();
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.isGameOver = false;
    this.isWin = false;
    this.isPaused = false;
  }

  getCanvasSize() {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getMaze() {
    return MAZE;
  }
}
