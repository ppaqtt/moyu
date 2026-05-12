export interface PixelCanvasState {
  grid: string[][];
  width: number;
  height: number;
  selectedColor: string;
  selectedTool: 'pencil' | 'eraser' | 'fill' | 'picker';
  history: string[][][];
  historyIndex: number;
}

export const PIXEL_COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#ff8800', '#ff0088', '#8800ff', '#00ff88', '#ff4444', '#44ff44', '#4444ff', '#ffd700',
  '#ff6b9d', '#a855f7', '#22c55e', '#3b82f6', '#f97316', '#14b8a6', '#ec4899', '#8b5cf6',
  '#06b6d4', '#1a1a1a', '#333333', '#666666', '#999999', '#cccccc', '#eeeeee',
  '#ffcccc', '#ffe6cc', '#ffffcc', '#ccffcc', '#ccffff', '#ccccff', '#ffccff'
];

export const CANVAS_PRESETS = [
  { name: '8x8', width: 8, height: 8 },
  { name: '16x16', width: 16, height: 16 },
  { name: '32x32', width: 32, height: 32 },
  { name: '64x64', width: 64, height: 64 }
];

export class PixelCanvasEngine {
  private grid: string[][] = [];
  private width: number = 32;
  private height: number = 32;
  private selectedColor: string = '#000000';
  private selectedTool: 'pencil' | 'eraser' | 'fill' | 'picker' = 'pencil';
  private history: string[][][] = [];
  private historyIndex: number = -1;
  private maxHistory: number = 50;

  constructor() {
    this.init();
  }

  init(): void {
    this.width = 32;
    this.height = 32;
    this.grid = this.createEmptyGrid();
    this.selectedColor = '#000000';
    this.selectedTool = 'pencil';
    this.history = [];
    this.historyIndex = -1;
    this.saveState();
  }

  private createEmptyGrid(): string[][] {
    return Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => '#ffffff')
    );
  }

  private saveState(): void {
    const gridCopy = this.grid.map(row => [...row]);

    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push(gridCopy);

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  getState(): PixelCanvasState {
    return {
      grid: this.grid.map(row => [...row]),
      width: this.width,
      height: this.height,
      selectedColor: this.selectedColor,
      selectedTool: this.selectedTool,
      history: [...this.history],
      historyIndex: this.historyIndex
    };
  }

  setColor(color: string): void {
    this.selectedColor = color;
  }

  setTool(tool: 'pencil' | 'eraser' | 'fill' | 'picker'): void {
    this.selectedTool = tool;
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.grid = this.createEmptyGrid();
    this.history = [];
    this.historyIndex = -1;
    this.saveState();
  }

  getPixel(x: number, y: number): string {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.grid[y][x];
    }
    return '';
  }

  setPixel(x: number, y: number, color?: string): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.grid[y][x] = color || this.selectedColor;
    }
  }

  drawPixel(x: number, y: number): string | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;

    switch (this.selectedTool) {
      case 'pencil':
        this.setPixel(x, y);
        break;
      case 'eraser':
        this.setPixel(x, y, '#ffffff');
        break;
      case 'fill':
        this.floodFill(x, y, this.grid[y][x], this.selectedColor);
        break;
      case 'picker':
        return this.grid[y][x];
    }
    return null;
  }

  private floodFill(x: number, y: number, targetColor: string, replacementColor: string): void {
    if (targetColor === replacementColor) return;
    if (this.grid[y][x] !== targetColor) return;

    const stack: [number, number][] = [[x, y]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const key = `${cx},${cy}`;

      if (visited.has(key)) continue;
      if (cx < 0 || cx >= this.width || cy < 0 || cy >= this.height) continue;
      if (this.grid[cy][cx] !== targetColor) continue;

      visited.add(key);
      this.grid[cy][cx] = replacementColor;

      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
  }

  commitStroke(): void {
    this.saveState();
  }

  undo(): boolean {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.grid = this.history[this.historyIndex].map(row => [...row]);
      return true;
    }
    return false;
  }

  redo(): boolean {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.grid = this.history[this.historyIndex].map(row => [...row]);
      return true;
    }
    return false;
  }

  clear(): void {
    this.grid = this.createEmptyGrid();
    this.saveState();
  }

  loadGrid(grid: string[][]): void {
    this.height = grid.length;
    this.width = grid[0]?.length || 0;
    this.grid = grid.map(row => [...row]);
    this.history = [];
    this.historyIndex = -1;
    this.saveState();
  }

  exportPNG(cellSize: number = 10): string {
    const canvas = document.createElement('canvas');
    canvas.width = this.width * cellSize;
    canvas.height = this.height * cellSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        ctx.fillStyle = this.grid[y][x];
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= this.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, this.height * cellSize);
      ctx.stroke();
    }
    for (let y = 0; y <= this.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(this.width * cellSize, y * cellSize);
      ctx.stroke();
    }

    return canvas.toDataURL('image/png');
  }

  exportSVG(): string {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.width} ${this.height}">`;
    svg += `<rect width="${this.width}" height="${this.height}" fill="#ffffff"/>`;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] !== '#ffffff') {
          svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${this.grid[y][x]}"/>`;
        }
      }
    }

    svg += '</svg>';
    return svg;
  }

  reset(): void {
    this.init();
  }
}
