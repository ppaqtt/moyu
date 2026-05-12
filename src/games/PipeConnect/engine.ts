// 水管连接游戏引擎
export type PipeType = 
  | 'straight_h'  // 水平直管
  | 'straight_v'  // 垂直直管
  | 'corner_tl'   // 左上角弯管
  | 'corner_tr'   // 右上角弯管
  | 'corner_bl'   // 左下角弯管
  | 'corner_br'   // 右下角弯管
  | 'cross'       // 十字管
  | 'tee_l'       // T型管(左开)
  | 'tee_r'       // T型管(右开)
  | 'tee_t'       // T型管(上开)
  | 'tee_b'       // T型管(下开)
  | 'start'       // 起点
  | 'end';        // 终点

export interface Cell {
  pipeType: PipeType;
  rotation: number; // 0, 90, 180, 270
  isFixed: boolean;
  hasWater: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface GameState {
  grid: Cell[][];
  gridSize: number;
  startPos: Position;
  endPos: Position;
  moves: number;
  isComplete: boolean;
  isWaterFlowing: boolean;
}

export class PipeConnectEngine {
  private grid: Cell[][] = [];
  private gridSize: number = 5;
  private startPos: Position = { row: 0, col: 0 };
  private endPos: Position = { row: 4, col: 4 };
  private moves: number = 0;
  private isComplete: boolean = false;
  private isWaterFlowing: boolean = false;

  // 每个管道类型在各方向的连接状态
  private readonly connections: Record<PipeType, { top: boolean; right: boolean; bottom: boolean; left: boolean }> = {
    'straight_h': { top: false, right: true, bottom: false, left: true },
    'straight_v': { top: true, right: false, bottom: true, left: false },
    'corner_tl': { top: true, right: false, bottom: false, left: true },
    'corner_tr': { top: true, right: true, bottom: false, left: false },
    'corner_bl': { top: false, right: false, bottom: true, left: true },
    'corner_br': { top: false, right: true, bottom: true, left: false },
    'cross': { top: true, right: true, bottom: true, left: true },
    'tee_l': { top: true, right: false, bottom: true, left: true },
    'tee_r': { top: true, right: true, bottom: true, left: false },
    'tee_t': { top: true, right: true, bottom: false, left: true },
    'tee_b': { top: false, right: true, bottom: true, left: true },
    'start': { top: false, right: true, bottom: false, left: false },
    'end': { top: false, right: false, bottom: false, left: true }
  };

  constructor(gridSize: number = 5) {
    this.gridSize = gridSize;
    this.reset();
  }

  public reset(): void {
    this.grid = [];
    this.moves = 0;
    this.isComplete = false;
    this.isWaterFlowing = false;
    
    // 初始化网格
    for (let row = 0; row < this.gridSize; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.gridSize; col++) {
        this.grid[row][col] = {
          pipeType: this.getRandomPipeType(),
          rotation: Math.floor(Math.random() * 4) * 90,
          isFixed: false,
          hasWater: false
        };
      }
    }

    // 设置起点和终点
    this.startPos = { row: Math.floor(Math.random() * this.gridSize), col: 0 };
    this.endPos = { row: Math.floor(Math.random() * this.gridSize), col: this.gridSize - 1 };

    // 设置起点和终点管道
    this.grid[this.startPos.row][this.startPos.col] = {
      pipeType: 'start',
      rotation: 0,
      isFixed: true,
      hasWater: true
    };

    this.grid[this.endPos.row][this.endPos.col] = {
      pipeType: 'end',
      rotation: 0,
      isFixed: true,
      hasWater: false
    };

    // 生成一条路径并确保至少有一些可用的管道
    this.generatePath();
  }

  private generatePath(): void {
    // 从起点到终点生成一条路径
    const path: Position[] = [this.startPos];
    let current = { ...this.startPos };
    
    while (current.col < this.endPos.col || current.row !== this.endPos.row) {
      const neighbors = this.getValidNeighbors(current);
      const unvisited = neighbors.filter(n => !path.some(p => p.row === n.row && p.col === n.col));
      
      if (unvisited.length > 0) {
        const next = unvisited[Math.floor(Math.random() * unvisited.length)];
        path.push(next);
        current = next;
      } else {
        // 随机选择一个邻居
        const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
        path.push(randomNeighbor);
        current = randomNeighbor;
      }

      // 防止无限循环
      if (path.length > this.gridSize * this.gridSize) break;
    }

    // 在路径上放置合适的管道
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const next = path[i + 1];

      const pipeType = this.getPipeForConnections(prev, curr, next);
      const rotation = this.getRotationForPipe(pipeType, prev, curr, next);

      this.grid[curr.row][curr.col] = {
        pipeType,
        rotation,
        isFixed: false,
        hasWater: false
      };
    }
  }

  private getValidNeighbors(pos: Position): Position[] {
    const neighbors: Position[] = [];
    const directions = [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 }
    ];

    for (const dir of directions) {
      const newRow = pos.row + dir.row;
      const newCol = pos.col + dir.col;
      
      if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
        neighbors.push({ row: newRow, col: newCol });
      }
    }

    return neighbors;
  }

  private getPipeForConnections(prev: Position, curr: Position, next: Position): PipeType {
    const fromDir = this.getDirection(curr, prev);
    const toDir = this.getDirection(curr, next);

    // 两个方向相反，使用直管
    if ((fromDir === 'top' && toDir === 'bottom') || 
        (fromDir === 'bottom' && toDir === 'top')) {
      return 'straight_v';
    }
    if ((fromDir === 'left' && toDir === 'right') || 
        (fromDir === 'right' && toDir === 'left')) {
      return 'straight_h';
    }

    // 两个方向相邻，使用弯管
    if ((fromDir === 'top' && toDir === 'right') || (fromDir === 'right' && toDir === 'top')) {
      return 'corner_tr';
    }
    if ((fromDir === 'top' && toDir === 'left') || (fromDir === 'left' && toDir === 'top')) {
      return 'corner_tl';
    }
    if ((fromDir === 'bottom' && toDir === 'right') || (fromDir === 'right' && toDir === 'bottom')) {
      return 'corner_br';
    }
    if ((fromDir === 'bottom' && toDir === 'left') || (fromDir === 'left' && toDir === 'bottom')) {
      return 'corner_bl';
    }

    return 'corner_br';
  }

  private getDirection(from: Position, to: Position): string {
    if (to.row < from.row) return 'top';
    if (to.row > from.row) return 'bottom';
    if (to.col < from.col) return 'left';
    return 'right';
  }

  private getRotationForPipe(pipeType: PipeType, prev: Position, curr: Position, next: Position): number {
    const fromDir = this.getDirection(curr, prev);
    const baseRotation = this.getBaseRotation(pipeType, fromDir);
    const targetRotation = this.getTargetRotation(curr, next);
    
    return (targetRotation - baseRotation + 360) % 360;
  }

  private getBaseRotation(pipeType: PipeType, dir: string): number {
    if (pipeType === 'straight_h' || pipeType === 'straight_v') {
      return dir === 'top' || dir === 'bottom' ? 90 : 0;
    }
    // 弯管的基准旋转是左上角连接
    switch (dir) {
      case 'top': return 0;
      case 'right': return 90;
      case 'bottom': return 180;
      case 'left': return 270;
    }
    return 0;
  }

  private getTargetRotation(curr: Position, next: Position): number {
    const dir = this.getDirection(curr, next);
    switch (dir) {
      case 'top': return 0;
      case 'right': return 90;
      case 'bottom': return 180;
      case 'left': return 270;
    }
    return 0;
  }

  private getRandomPipeType(): PipeType {
    const types: PipeType[] = [
      'straight_h', 'straight_v',
      'corner_tl', 'corner_tr', 'corner_bl', 'corner_br',
      'tee_l', 'tee_r', 'tee_t', 'tee_b'
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  public rotatePipe(row: number, col: number): boolean {
    if (this.isComplete) return false;

    const cell = this.grid[row][col];
    if (cell.isFixed) return false;

    cell.rotation = (cell.rotation + 90) % 360;
    this.moves++;

    // 检查水流
    this.checkWaterFlow();
    
    return true;
  }

  public getState(): GameState {
    return {
      grid: this.grid.map(row => row.map(cell => ({ ...cell }))),
      gridSize: this.gridSize,
      startPos: { ...this.startPos },
      endPos: { ...this.endPos },
      moves: this.moves,
      isComplete: this.isComplete,
      isWaterFlowing: this.isWaterFlowing
    };
  }

  public tick(): void {
    // 无需周期性更新
  }

  private checkWaterFlow(): void {
    // 重置所有水状态
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        this.grid[row][col].hasWater = false;
      }
    }

    // 从起点开始流动
    const visited = new Set<string>();
    const queue: Position[] = [this.startPos];
    this.grid[this.startPos.row][this.startPos.col].hasWater = true;
    visited.add(`${this.startPos.row},${this.startPos.col}`);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentCell = this.grid[current.row][current.col];
      const connections = this.getRotatedConnections(currentCell);

      const directions = [
        { dir: 'top', row: -1, col: 0, opposite: 'bottom' },
        { dir: 'right', row: 0, col: 1, opposite: 'left' },
        { dir: 'bottom', row: 1, col: 0, opposite: 'top' },
        { dir: 'left', row: 0, col: -1, opposite: 'right' }
      ];

      for (const d of directions) {
        if (!connections[d.dir]) continue;

        const newRow = current.row + d.row;
        const newCol = current.col + d.col;
        const key = `${newRow},${newCol}`;

        if (newRow < 0 || newRow >= this.gridSize || newCol < 0 || newCol >= this.gridSize) continue;
        if (visited.has(key)) continue;

        const neighborCell = this.grid[newRow][newCol];
        const neighborConnections = this.getRotatedConnections(neighborCell);

        // 检查邻居是否连接到当前格
        if (neighborConnections[d.opposite]) {
          neighborCell.hasWater = true;
          visited.add(key);
          queue.push({ row: newRow, col: newCol });
        }
      }
    }

    // 检查是否到达终点
    if (this.grid[this.endPos.row][this.endPos.col].hasWater) {
      this.isComplete = true;
      this.isWaterFlowing = true;
    } else {
      this.isWaterFlowing = false;
    }
  }

  private getRotatedConnections(cell: Cell): { top: boolean; right: boolean; bottom: boolean; left: boolean } {
    const base = { ...this.connections[cell.pipeType] };
    const rotations = cell.rotation / 90;
    
    for (let i = 0; i < rotations; i++) {
      const temp = base.top;
      base.top = base.right;
      base.right = base.bottom;
      base.bottom = base.left;
      base.left = temp;
    }

    return base;
  }

  public getGrid(): Cell[][] {
    return this.grid.map(row => row.map(cell => ({ ...cell })));
  }

  public getStartPos(): Position {
    return { ...this.startPos };
  }

  public getEndPos(): Position {
    return { ...this.endPos };
  }

  public getMoves(): number {
    return this.moves;
  }

  public isGameComplete(): boolean {
    return this.isComplete;
  }

  public isWaterCell(row: number, col: number): boolean {
    return this.grid[row][col].hasWater;
  }

  public getHint(): Position | null {
    // 找到一条从起点到终点的路径上的任意一个未旋转正确的格子
    // 这里简化处理，返回第一个非固定且没有水的格子
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (!this.grid[row][col].isFixed && !this.grid[row][col].hasWater) {
          return { row, col };
        }
      }
    }
    return null;
  }

  public setGridSize(size: number): void {
    this.gridSize = Math.max(4, Math.min(8, size));
  }

  public getGridSize(): number {
    return this.gridSize;
  }
}
