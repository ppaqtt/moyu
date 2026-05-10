export interface PuzzlePiece {
  id: number;
  correctX: number;
  correctY: number;
  currentX: number;
  currentY: number;
  imageIndex: number;
}

export interface GameState {
  pieces: PuzzlePiece[];
  gridSize: number;
  moves: number;
  startTime: number;
  isComplete: boolean;
  currentImage: number;
}

export interface JigsawKidsEngine {
  initialize(gridSize: number, imageIndex: number): void;
  movePiece(pieceId: number, newX: number, newY: number): boolean;
  checkCompletion(): boolean;
  getState(): GameState;
  shuffle(): void;
  getGridSize(): number;
  getMoves(): number;
  isComplete(): boolean;
  getImages(): string[];
}

export class JigsawKidsEngineClass implements JigsawKidsEngine {
  private pieces: PuzzlePiece[] = [];
  private gridSize: number = 3;
  private moves: number = 0;
  private startTime: number = 0;
  private isComplete: boolean = false;
  private currentImage: number = 0;
  
  private readonly images = [
    { name: '小猫咪', emoji: '🐱', colors: ['#FFB6C1', '#FFC0CB', '#FF69B4'] },
    { name: '彩虹', emoji: '🌈', colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'] },
    { name: '太阳', emoji: '☀️', colors: ['#FFD700', '#FFA500', '#FF8C00', '#FF7F50'] },
    { name: '花朵', emoji: '🌸', colors: ['#FF69B4', '#FF1493', '#FFB6C1', '#FFC0CB'] },
    { name: '星星', emoji: '⭐', colors: ['#FFD700', '#FFEC8B', '#FFFACD', '#FFF8DC'] },
  ];

  public initialize(gridSize: number, imageIndex: number): void {
    this.gridSize = gridSize;
    this.currentImage = imageIndex;
    this.pieces = [];
    this.moves = 0;
    this.startTime = Date.now();
    this.isComplete = false;

    let id = 0;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        this.pieces.push({
          id: id++,
          correctX: x,
          correctY: y,
          currentX: x,
          currentY: y,
          imageIndex: 0
        });
      }
    }
    this.shuffle();
  }

  public shuffle(): void {
    const positions: { x: number; y: number }[] = [];
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        positions.push({ x, y });
      }
    }

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    let idx = 0;
    for (const piece of this.pieces) {
      piece.currentX = positions[idx].x;
      piece.currentY = positions[idx].y;
      idx++;
    }
    
    this.moves = 0;
    this.startTime = Date.now();
    this.isComplete = false;
  }

  public movePiece(pieceId: number, newX: number, newY: number): boolean {
    const piece = this.pieces.find(p => p.id === pieceId);
    if (!piece) return false;

    const emptyPiece = this.pieces.find(p => 
      p.currentX === newX && p.currentY === newY
    );
    
    if (!emptyPiece) return false;

    const tempX = piece.currentX;
    const tempY = piece.currentY;
    piece.currentX = newX;
    piece.currentY = newY;
    emptyPiece.currentX = tempX;
    emptyPiece.currentY = tempY;

    this.moves++;
    
    if (this.checkCompletion()) {
      this.isComplete = true;
    }

    return true;
  }

  public checkCompletion(): boolean {
    return this.pieces.every(p => 
      p.currentX === p.correctX && p.currentY === p.correctY
    );
  }

  public getState(): GameState {
    return {
      pieces: this.pieces.map(p => ({ ...p })),
      gridSize: this.gridSize,
      moves: this.moves,
      startTime: this.startTime,
      isComplete: this.isComplete,
      currentImage: this.currentImage
    };
  }

  public getGridSize(): number {
    return this.gridSize;
  }

  public getMoves(): number {
    return this.moves;
  }

  public isComplete(): boolean {
    return this.completed;
  }

  public getImages(): string[] {
    return this.images.map(img => img.emoji);
  }

  public getImageData(index: number) {
    return this.images[index % this.images.length];
  }
}

export const JigsawKidsEngine = JigsawKidsEngineClass;
