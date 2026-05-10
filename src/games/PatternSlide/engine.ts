export interface Tile {
  id: number;
  value: number;
  imageIndex: number;
  row: number;
  col: number;
}

export interface GameState {
  tiles: Tile[];
  gridSize: number;
  emptyPos: { row: number; col: number };
  moves: number;
  isComplete: boolean;
  timeElapsed: number;
}

export class PatternSlideEngine {
  private tiles: Tile[] = [];
  private gridSize: number = 4;
  private emptyPos = { row: 3, col: 3 };
  private moves: number = 0;
  private isComplete: boolean = false;
  private startTime: number = 0;

  private readonly patterns = [
    { name: '彩虹', emoji: '🌈', colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'] },
    { name: '太阳', emoji: '☀️', colors: ['#FFD700', '#FFA500', '#FF8C00'] },
    { name: '花朵', emoji: '🌸', colors: ['#FF69B4', '#FF1493', '#FFB6C1'] },
    { name: '星星', emoji: '⭐', colors: ['#FFD700', '#FFEC8B', '#FFFACD'] },
    { name: '海洋', emoji: '🌊', colors: ['#00CED1', '#20B2AA', '#40E0D0'] },
  ];

  constructor(gridSize: number = 4) {
    this.initialize(gridSize);
  }

  public initialize(gridSize: number): void {
    this.gridSize = gridSize;
    this.moves = 0;
    this.isComplete = false;
    this.startTime = Date.now();
    this.tiles = [];

    const pattern = this.patterns[Math.floor(Math.random() * this.patterns.length)];
    const totalTiles = gridSize * gridSize;

    let id = 0;
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const value = row * gridSize + col + 1;
        if (value < totalTiles) {
          this.tiles.push({
            id: id++,
            value,
            imageIndex: (value - 1) % pattern.colors.length,
            row,
            col
          });
        }
      }
    }

    this.emptyPos = { row: gridSize - 1, col: gridSize - 1 };
    this.shuffle();
  }

  private shuffle(): void {
    for (let i = 0; i < 1000; i++) {
      const neighbors = this.getNeighbors(this.emptyPos.row, this.emptyPos.col);
      const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      this.swapTiles(neighbor.row, neighbor.col);
    }
  }

  private getNeighbors(row: number, col: number): { row: number; col: number }[] {
    const neighbors: { row: number; col: number }[] = [];
    if (row > 0) neighbors.push({ row: row - 1, col });
    if (row < this.gridSize - 1) neighbors.push({ row: row + 1, col });
    if (col > 0) neighbors.push({ row, col: col - 1 });
    if (col < this.gridSize - 1) neighbors.push({ row, col: col + 1 });
    return neighbors;
  }

  private swapTiles(row: number, col: number): void {
    const tile = this.tiles.find(t => t.row === row && t.col === col);
    if (!tile) return;

    const tempRow = tile.row;
    const tempCol = tile.col;
    tile.row = this.emptyPos.row;
    tile.col = this.emptyPos.col;
    this.emptyPos = { row: tempRow, col: tempCol };
  }

  public move(row: number, col: number): { success: boolean; message: string } {
    if (this.isComplete) {
      return { success: false, message: '游戏已完成!' };
    }

    const isNeighbor = 
      (Math.abs(row - this.emptyPos.row) === 1 && col === this.emptyPos.col) ||
      (Math.abs(col - this.emptyPos.col) === 1 && row === this.emptyPos.row);

    if (!isNeighbor) {
      return { success: false, message: '只能移动相邻的方块!' };
    }

    this.swapTiles(row, col);
    this.moves++;

    if (this.checkCompletion()) {
      this.isComplete = true;
      return { success: true, message: '🎉 拼图完成!' };
    }

    return { success: true, message: '移动了' };
  }

  private checkCompletion(): boolean {
    const sortedTiles = [...this.tiles].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });

    for (let i = 0; i < sortedTiles.length; i++) {
      const expectedRow = Math.floor(i / this.gridSize);
      const expectedCol = i % this.gridSize;
      if (sortedTiles[i].row !== expectedRow || sortedTiles[i].col !== expectedCol) {
        return false;
      }
    }

    return true;
  }

  public getState(): GameState {
    return {
      tiles: this.tiles.map(t => ({ ...t })),
      gridSize: this.gridSize,
      emptyPos: { ...this.emptyPos },
      moves: this.moves,
      isComplete: this.isComplete,
      timeElapsed: Math.floor((Date.now() - this.startTime) / 1000)
    };
  }

  public getGridSize(): number {
    return this.gridSize;
  }

  public getMoves(): number {
    return this.moves;
  }

  public getPatterns(): { name: string; emoji: string }[] {
    return this.patterns;
  }

  public isGameComplete(): boolean {
    return this.isComplete;
  }
}
