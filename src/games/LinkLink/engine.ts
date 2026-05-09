// 连连看游戏引擎
import { LINKLINK_CONSTANTS } from '../../utils/constants';

interface Tile {
  type: number;
  x: number;
  y: number;
  matched: boolean;
}

interface GameState {
  board: Tile[][];
  selectedTile: { row: number; col: number } | null;
  score: number;
  moves: number;
  matches: number;
  gameOver: boolean;
  hintUsed: boolean;
}

type ConnectionLine = { x1: number; y1: number; x2: number; y2: number }[];

export class LinkLinkEngine {
  private board: Tile[][] = [];
  private selectedTile: { row: number; col: number } | null = null;
  private score: number = 0;
  private moves: number = 0;
  private matches: number = 0;
  private gameOver: boolean = false;
  private hintUsed: boolean = false;
  private connectionLine: ConnectionLine = [];

  constructor() {
    this.initBoard();
  }

  private initBoard(): void {
    const { GRID_COLS, GRID_ROWS, ICON_TYPES } = LINKLINK_CONSTANTS;
    this.board = [];

    // 创建配对图标数组
    const totalTiles = GRID_COLS * GRID_ROWS;
    const pairs = totalTiles / 2;
    const icons: number[] = [];

    for (let i = 0; i < pairs; i++) {
      const iconType = (i % ICON_TYPES) + 1;
      icons.push(iconType, iconType);
    }

    // 打乱数组
    for (let i = icons.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [icons[i], icons[j]] = [icons[j], icons[i]];
    }

    // 创建游戏板
    let iconIndex = 0;
    for (let row = 0; row < GRID_ROWS; row++) {
      this.board[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        this.board[row][col] = {
          type: icons[iconIndex++],
          x: col,
          y: row,
          matched: false
        };
      }
    }

    this.selectedTile = null;
    this.score = 0;
    this.moves = 0;
    this.matches = 0;
    this.gameOver = false;
    this.hintUsed = false;
    this.connectionLine = [];
  }

  public reset(): void {
    this.initBoard();
  }

  public selectTile(row: number, col: number): { success: boolean; message: string } {
    if (this.gameOver) {
      return { success: false, message: '游戏已结束' };
    }

    if (row < 0 || row >= LINKLINK_CONSTANTS.GRID_ROWS ||
        col < 0 || col >= LINKLINK_CONSTANTS.GRID_COLS) {
      return { success: false, message: '位置无效' };
    }

    const tile = this.board[row][col];
    if (tile.matched) {
      return { success: false, message: '该方块已消除' };
    }

    if (this.selectedTile === null) {
      // 第一次选择
      this.selectedTile = { row, col };
      this.connectionLine = [];
      return { success: true, message: '选择第一个方块' };
    } else {
      // 第二次选择
      const firstTile = this.board[this.selectedTile.row][this.selectedTile.col];

      if (this.selectedTile.row === row && this.selectedTile.col === col) {
        // 取消选择
        this.selectedTile = null;
        this.connectionLine = [];
        return { success: true, message: '取消选择' };
      }

      if (firstTile.type !== tile.type) {
        // 类型不匹配
        this.moves++;
        this.selectedTile = { row, col };
        this.connectionLine = [];
        return { success: true, message: '类型不匹配，重新选择' };
      }

      // 检查是否可连接
      const canConnect = this.checkConnection(this.selectedTile.row, this.selectedTile.col, row, col);

      if (canConnect) {
        // 匹配成功
        this.connectionLine = this.findPath(this.selectedTile.row, this.selectedTile.col, row, col);
        firstTile.matched = true;
        tile.matched = true;
        this.matches++;
        this.moves++;
        this.score += 100 * (this.connectionLine.length > 2 ? 2 : 1);
        this.selectedTile = null;

        // 检查游戏结束
        if (this.isGameOver()) {
          this.gameOver = true;
          this.score += 1000; // 通关奖励
        }

        return { success: true, message: '匹配成功！' };
      } else {
        // 无法连接
        this.moves++;
        this.selectedTile = { row, col };
        this.connectionLine = [];
        return { success: true, message: '无法连接，重新选择' };
      }
    }
  }

  private checkConnection(r1: number, c1: number, r2: number, c2: number): boolean {
    // 检查两点之间是否可以通过直线连接（最多两个拐角）
    return this.findPath(r1, c1, r2, c2) !== null;
  }

  private findPath(r1: number, c1: number, r2: number, c2: number): ConnectionLine | null {
    const { GRID_ROWS, GRID_COLS } = LINKLINK_CONSTANTS;

    // 广度优先搜索找最短路径
    const queue: { row: number; col: number; path: ConnectionLine; direction: number }[] = [];
    const visited = new Set<string>();

    // 四个方向：上、右、下、左
    const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];

    // 从起点开始
    for (let d = 0; d < 4; d++) {
      queue.push({
        row: r1,
        col: c1,
        path: [],
        direction: d
      });
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      const [dr, dc] = directions[current.direction];
      const newRow = current.row + dr;
      const newCol = current.col + dc;

      // 检查是否到达终点
      if (newRow === r2 && newCol === c2) {
        const startPos = this.getTileCenter(r1, c1);
        const endPos = this.getTileCenter(r2, c2);
        return [
          { x1: startPos.x, y1: startPos.y, x2: endPos.x, y2: endPos.y }
        ];
      }

      // 检查是否越界（允许在边界外移动）
      if (newRow < -1 || newRow > GRID_ROWS || newCol < -1 || newCol > GRID_COLS) {
        continue;
      }

      const key = `${newRow},${newCol},${current.direction}`;
      if (visited.has(key)) continue;
      visited.add(key);

      // 检查路径是否有效（中间节点必须是空的）
      if (newRow >= 0 && newRow < GRID_ROWS &&
          newCol >= 0 && newCol < GRID_COLS &&
          !this.board[newRow][newCol].matched &&
          !(newRow === r1 && newCol === c1)) {
        continue;
      }

      // 可以直线延伸
      queue.push({
        row: newRow,
        col: newCol,
        path: current.path,
        direction: current.direction
      });

      // 可以拐弯
      for (let d = 0; d < 4; d++) {
        if (d !== current.direction && d !== (current.direction + 2) % 4) {
          const newKey = `${newRow},${newCol},${d}`;
          if (!visited.has(newKey)) {
            queue.push({
              row: newRow,
              col: newCol,
              path: current.path,
              direction: d
            });
          }
        }
      }
    }

    return null;
  }

  private getTileCenter(row: number, col: number): { x: number; y: number } {
    const { TILE_WIDTH, TILE_HEIGHT } = LINKLINK_CONSTANTS;
    return {
      x: col * TILE_WIDTH + TILE_WIDTH / 2,
      y: row * TILE_HEIGHT + TILE_HEIGHT / 2
    };
  }

  private isGameOver(): boolean {
    for (let row = 0; row < LINKLINK_CONSTANTS.GRID_ROWS; row++) {
      for (let col = 0; col < LINKLINK_CONSTANTS.GRID_COLS; col++) {
        if (!this.board[row][col].matched) {
          return false;
        }
      }
    }
    return true;
  }

  public getHint(): { row1: number; col1: number; row2: number; col2: number } | null {
    const { GRID_ROWS, GRID_COLS } = LINKLINK_CONSTANTS;

    for (let row1 = 0; row1 < GRID_ROWS; row1++) {
      for (let col1 = 0; col1 < GRID_COLS; col1++) {
        if (this.board[row1][col1].matched) continue;

        for (let row2 = 0; row2 < GRID_ROWS; row2++) {
          for (let col2 = 0; col2 < GRID_COLS; col2++) {
            if (row1 === row2 && col1 === col2) continue;
            if (this.board[row2][col2].matched) continue;

            if (this.board[row1][col1].type === this.board[row2][col2].type) {
              if (this.checkConnection(row1, col1, row2, col2)) {
                this.hintUsed = true;
                return { row1, col1, row2, col2 };
              }
            }
          }
        }
      }
    }

    return null;
  }

  public shuffle(): void {
    const unmatchedTiles: Tile[] = [];
    const positions: { row: number; col: number }[] = [];

    // 收集所有未消除的方块
    for (let row = 0; row < LINKLINK_CONSTANTS.GRID_ROWS; row++) {
      for (let col = 0; col < LINKLINK_CONSTANTS.GRID_COLS; col++) {
        if (!this.board[row][col].matched) {
          unmatchedTiles.push(this.board[row][col]);
          positions.push({ row, col });
        }
      }
    }

    // 打乱方块
    for (let i = unmatchedTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unmatchedTiles[i], unmatchedTiles[j]] = [unmatchedTiles[j], unmatchedTiles[i]];
    }

    // 重新放置方块
    for (let i = 0; i < positions.length; i++) {
      const { row, col } = positions[i];
      this.board[row][col] = unmatchedTiles[i];
      this.board[row][col].x = col;
      this.board[row][col].y = row;
    }

    this.selectedTile = null;
    this.connectionLine = [];
    this.score = Math.max(0, this.score - 50); // 洗牌扣分
  }

  public getBoard(): Tile[][] {
    return this.board;
  }

  public getSelectedTile(): { row: number; col: number } | null {
    return this.selectedTile;
  }

  public getConnectionLine(): ConnectionLine {
    return this.connectionLine;
  }

  public getScore(): number {
    return this.score;
  }

  public getMoves(): number {
    return this.moves;
  }

  public getMatches(): number {
    return this.matches;
  }

  public isGameOverState(): boolean {
    return this.gameOver;
  }

  public getRemainingTiles(): number {
    let count = 0;
    for (let row = 0; row < LINKLINK_CONSTANTS.GRID_ROWS; row++) {
      for (let col = 0; col < LINKLINK_CONSTANTS.GRID_COLS; col++) {
        if (!this.board[row][col].matched) {
          count++;
        }
      }
    }
    return count;
  }
}
