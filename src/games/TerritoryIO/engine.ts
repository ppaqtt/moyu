import { NEON_COLORS } from '../../utils/constants';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 40;
const CELL_SIZE = 20;
const PLAYER_SPEED = 3;
const AI_COUNT = 8;
const CLAIM_INTERVAL = 5;

export interface Position {
  x: number;
  y: number;
}

export interface Cell {
  x: number;
  y: number;
  owner: number | null;
  isTrail: boolean;
}

export interface Player {
  x: number;
  y: number;
  color: string;
  name: string;
  territory: number;
  isDead: boolean;
  trail: Position[];
  direction: Position;
}

export interface AIPlayer {
  id: number;
  x: number;
  y: number;
  color: string;
  name: string;
  territory: number;
  isDead: boolean;
  trail: Position[];
  direction: Position;
  targetX: number;
  targetY: number;
  changeDirTimer: number;
}

export interface TerritoryGameState {
  player: Player;
  aiPlayers: AIPlayer[];
  grid: Cell[][];
  gameOver: boolean;
  rank: number;
}

const AI_NAMES = ['红队', '蓝队', '绿队', '黄队', '紫队', '橙队', '粉队', '青队'];

export class TerritoryIOEngine {
  private player: Player;
  private aiPlayers: AIPlayer[];
  private grid: Cell[][];
  private gameOver: boolean;
  private keys: { [key: string]: boolean };
  private rank: number;
  private claimTimer: number;

  constructor() {
    this.player = {
      x: 0,
      y: 0,
      color: NEON_COLORS.neonCyan,
      name: '玩家',
      territory: 0,
      isDead: false,
      trail: [],
      direction: { x: 1, y: 0 }
    };
    this.aiPlayers = [];
    this.grid = [];
    this.gameOver = false;
    this.keys = {};
    this.rank = 1;
    this.claimTimer = 0;
    this.init();
  }

  init(): void {
    this.grid = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      this.grid[x] = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        this.grid[x][y] = { x, y, owner: null, isTrail: false };
      }
    }

    const playerStartX = 5;
    const playerStartY = 5;
    this.player.x = playerStartX * CELL_SIZE + CELL_SIZE / 2;
    this.player.y = playerStartY * CELL_SIZE + CELL_SIZE / 2;
    this.player.territory = 9;
    this.player.isDead = false;
    this.player.trail = [];
    this.player.direction = { x: 1, y: 0 };

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const gx = playerStartX + dx;
        const gy = playerStartY + dy;
        if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
          this.grid[gx][gy].owner = -1;
        }
      }
    }

    this.aiPlayers = [];
    const colors = [NEON_COLORS.neonPink, NEON_COLORS.neonPurple, NEON_COLORS.neonGreen, NEON_COLORS.gold, NEON_COLORS.danger, NEON_COLORS.warning, '#ff6b9d', '#4ecdc4'];

    for (let i = 0; i < AI_COUNT; i++) {
      const startX = Math.floor(Math.random() * (GRID_SIZE - 10)) + 5;
      const startY = Math.floor(Math.random() * (GRID_SIZE - 10)) + 5;

      const ai: AIPlayer = {
        id: i,
        x: startX * CELL_SIZE + CELL_SIZE / 2,
        y: startY * CELL_SIZE + CELL_SIZE / 2,
        color: colors[i % colors.length],
        name: AI_NAMES[i % AI_NAMES.length],
        territory: 9,
        isDead: false,
        trail: [],
        direction: { x: Math.random() > 0.5 ? 1 : -1, y: 0 },
        targetX: startX,
        targetY: startY,
        changeDirTimer: 0
      };

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const gx = startX + dx;
          const gy = startY + dy;
          if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
            this.grid[gx][gy].owner = i;
          }
        }
      }

      this.aiPlayers.push(ai);
    }

    this.gameOver = false;
    this.rank = AI_COUNT + 1;
    this.claimTimer = 0;
  }

  setKey(key: string, pressed: boolean): void {
    this.keys[key] = pressed;
  }

  private getGridPos(x: number, y: number): { x: number; y: number } {
    return {
      x: Math.floor(x / CELL_SIZE),
      y: Math.floor(y / CELL_SIZE)
    };
  }

  private isInTerritory(x: number, y: number, owner: number | null): boolean {
    const gridPos = this.getGridPos(x, y);
    if (gridPos.x < 0 || gridPos.x >= GRID_SIZE || gridPos.y < 0 || gridPos.y >= GRID_SIZE) {
      return false;
    }
    return this.grid[gridPos.x][gridPos.y].owner === owner;
  }

  private floodFill(startX: number, startY: number, newOwner: number | null): number {
    const visited = new Set<string>();
    const queue: { x: number; y: number }[] = [];
    const cells: { x: number; y: number }[] = [];

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (this.grid[x][y].owner === newOwner) {
          queue.push({ x, y });
          visited.add(`${x},${y}`);
          cells.push({ x, y });
        }
      }
    }

    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const [dx, dy] of directions) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const key = `${nx},${ny}`;

        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE &&
            !visited.has(key) && this.grid[nx][ny].owner === null) {
          visited.add(key);
          queue.push({ x: nx, y: ny });
          cells.push({ x: nx, y: ny });
        }
      }
    }

    cells.forEach(cell => {
      this.grid[cell.x][cell.y].owner = newOwner;
    });

    return cells.length;
  }

  private checkTrailEnclosure(trail: Position[], owner: number | null): void {
    if (trail.length < 3) return;

    const start = this.getGridPos(trail[0].x, trail[0].y);
    const end = this.getGridPos(trail[trail.length - 1].x, trail[trail.length - 1].y);

    if (this.grid[start.x][start.y].owner === owner && this.grid[end.x][end.y].owner === owner) {
      trail.forEach(pos => {
        const gridPos = this.getGridPos(pos.x, pos.y);
        if (gridPos.x >= 0 && gridPos.x < GRID_SIZE && gridPos.y >= 0 && gridPos.y < GRID_SIZE) {
          this.grid[gridPos.x][gridPos.y].owner = owner;
          this.grid[gridPos.x][gridPos.y].isTrail = false;
        }
      });

      this.floodFill(start.x, start.y, owner);
    }
  }

  private updatePlayer(): void {
    if (this.player.isDead) return;

    let dx = 0;
    let dy = 0;

    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) dy = -1;
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) dy = 1;
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) dx = -1;
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) dx = 1;

    if (dx !== 0 || dy !== 0) {
      this.player.direction = { x: dx, y: dy };
    }

    const newX = this.player.x + this.player.direction.x * PLAYER_SPEED;
    const newY = this.player.y + this.player.direction.y * PLAYER_SPEED;

    if (newX >= CELL_SIZE / 2 && newX < GRID_SIZE * CELL_SIZE - CELL_SIZE / 2 &&
        newY >= CELL_SIZE / 2 && newY < GRID_SIZE * CELL_SIZE - CELL_SIZE / 2) {
      this.player.x = newX;
      this.player.y = newY;
    }

    const gridPos = this.getGridPos(this.player.x, this.player.y);

    if (gridPos.x >= 0 && gridPos.x < GRID_SIZE && gridPos.y >= 0 && gridPos.y < GRID_SIZE) {
      const cell = this.grid[gridPos.x][gridPos.y];

      if (cell.owner !== -1) {
        if (this.player.trail.length > 0) {
          this.checkTrailEnclosure(this.player.trail, -1);
          this.player.trail = [];
        }
      } else {
        if (!cell.isTrail) {
          cell.isTrail = true;
          this.player.trail.push({ x: this.player.x, y: this.player.y });
        }
      }

      for (const ai of this.aiPlayers) {
        if (!ai.isDead && ai.trail.some(t => {
          const tpos = this.getGridPos(t.x, t.y);
          return tpos.x === gridPos.x && tpos.y === gridPos.y;
        })) {
          ai.isDead = true;
          ai.trail.forEach(t => {
            const tpos = this.getGridPos(t.x, t.y);
            if (tpos.x >= 0 && tpos.x < GRID_SIZE && tpos.y >= 0 && tpos.y < GRID_SIZE) {
              this.grid[tpos.x][tpos.y].isTrail = false;
            }
          });
          ai.trail = [];
          setTimeout(() => this.respawnAI(ai.id), 3000);
        }
      }
    }

    this.player.territory = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (this.grid[x][y].owner === -1) {
          this.player.territory++;
        }
      }
    }
  }

  private updateAI(): void {
    this.aiPlayers.forEach(ai => {
      if (ai.isDead) return;

      ai.changeDirTimer--;
      if (ai.changeDirTimer <= 0) {
        const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
        ai.direction = dirs[Math.floor(Math.random() * dirs.length)];
        ai.changeDirTimer = 30 + Math.random() * 60;
      }

      const newX = ai.x + ai.direction.x * PLAYER_SPEED;
      const newY = ai.y + ai.direction.y * PLAYER_SPEED;

      if (newX >= CELL_SIZE / 2 && newX < GRID_SIZE * CELL_SIZE - CELL_SIZE / 2 &&
          newY >= CELL_SIZE / 2 && newY < GRID_SIZE * CELL_SIZE - CELL_SIZE / 2) {
        ai.x = newX;
        ai.y = newY;
      } else {
        ai.direction.x *= -1;
        ai.direction.y *= -1;
      }

      const gridPos = this.getGridPos(ai.x, ai.y);

      if (gridPos.x >= 0 && gridPos.x < GRID_SIZE && gridPos.y >= 0 && gridPos.y < GRID_SIZE) {
        const cell = this.grid[gridPos.x][gridPos.y];

        if (cell.owner !== ai.id) {
          if (ai.trail.length > 0) {
            this.checkTrailEnclosure(ai.trail, ai.id);
            ai.trail = [];
          }
        } else {
          if (!cell.isTrail) {
            cell.isTrail = true;
            ai.trail.push({ x: ai.x, y: ai.y });
          }
        }

        if (cell.owner === -1) {
          this.player.isDead = true;
          this.gameOver = true;
        }
      }

      ai.territory = 0;
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          if (this.grid[x][y].owner === ai.id) {
            ai.territory++;
          }
        }
      }
    });
  }

  private respawnAI(id: number): void {
    const ai = this.aiPlayers.find(a => a.id === id);
    if (ai) {
      ai.isDead = false;
      const startX = Math.floor(Math.random() * (GRID_SIZE - 10)) + 5;
      const startY = Math.floor(Math.random() * (GRID_SIZE - 10)) + 5;
      ai.x = startX * CELL_SIZE + CELL_SIZE / 2;
      ai.y = startY * CELL_SIZE + CELL_SIZE / 2;
      ai.territory = 9;
      ai.trail = [];

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const gx = startX + dx;
          const gy = startY + dy;
          if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
            this.grid[gx][gy].owner = id;
          }
        }
      }
    }
  }

  private calculateRank(): void {
    const territories = [
      { id: -1, territory: this.player.territory },
      ...this.aiPlayers.map(ai => ({ id: ai.id, territory: ai.territory }))
    ];

    territories.sort((a, b) => b.territory - a.territory);
    this.rank = territories.findIndex(t => t.id === -1) + 1;
  }

  tick(): void {
    if (this.gameOver) return;

    this.updatePlayer();
    this.updateAI();
    this.calculateRank();
  }

  getState(): TerritoryGameState {
    return {
      player: { ...this.player, trail: [...this.player.trail] },
      aiPlayers: this.aiPlayers.map(ai => ({ ...ai, trail: [...ai.trail] })),
      grid: this.grid.map(col => col.map(cell => ({ ...cell }))),
      gameOver: this.gameOver,
      rank: this.rank
    };
  }

  reset(): void {
    this.init();
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  getGridSize(): { width: number; height: number; cellSize: number } {
    return { width: GRID_SIZE, height: GRID_SIZE, cellSize: CELL_SIZE };
  }
}
