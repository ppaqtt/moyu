// 华容道游戏引擎
export interface Position {
  x: number;
  y: number;
}

export interface Piece {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'cao' | 'zhang' | 'small';
}

export interface GameState {
  pieces: Piece[];
  moves: number;
  isComplete: boolean;
  startTime: number;
}

export class HuarongDaoEngine {
  private pieces: Piece[] = [];
  private moves: number = 0;
  private isComplete: boolean = false;
  private readonly gridWidth: number = 4;
  private readonly gridHeight: number = 5;
  private readonly cellSize: number;

  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
    this.reset();
  }

  // 经典华容道布局 - 曹操在中间
  private getInitialLayout(): Piece[] {
    return [
      // 第一行 - 四个小兵
      { id: 1, x: 0, y: 0, width: 1, height: 1, type: 'small' },
      { id: 2, x: 1, y: 0, width: 1, height: 1, type: 'small' },
      { id: 3, x: 2, y: 0, width: 1, height: 1, type: 'small' },
      { id: 4, x: 3, y: 0, width: 1, height: 1, type: 'small' },
      // 第二行 - 空格和两个小兵
      { id: 5, x: 1, y: 1, width: 1, height: 1, type: 'small' },
      { id: 6, x: 2, y: 1, width: 1, height: 1, type: 'small' },
      // 第三行 - 曹操(横)
      { id: 7, x: 1, y: 2, width: 2, height: 1, type: 'cao' },
      // 第四行 - 关羽和张飞(竖)
      { id: 8, x: 0, y: 2, width: 1, height: 2, type: 'zhang' },
      { id: 9, x: 3, y: 2, width: 1, height: 2, type: 'zhang' },
      // 第五行 - 空格和两个小兵
      { id: 10, x: 1, y: 4, width: 1, height: 1, type: 'small' },
    ];
  }

  public reset(): void {
    this.pieces = this.getInitialLayout().map(p => ({ ...p }));
    this.moves = 0;
    this.isComplete = false;
    this.shuffle();
  }

  private shuffle(): void {
    // 华容道需要特殊打乱确保有解
    // 使用一系列有效移动来打乱
    const shuffleMoves = 100;
    for (let i = 0; i < shuffleMoves; i++) {
      const validMoves = this.getValidMoves();
      if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        this.movePiece(randomMove.pieceId, randomMove.dx, randomMove.dy, true);
      }
    }
  }

  public getState(): GameState {
    return {
      pieces: this.pieces.map(p => ({ ...p })),
      moves: this.moves,
      isComplete: this.isComplete,
      startTime: Date.now()
    };
  }

  public tick(): void {
    // 无需周期性更新
  }

  public movePiece(pieceId: number, dx: number, dy: number, silent: boolean = false): boolean {
    if (this.isComplete) return false;

    const piece = this.pieces.find(p => p.id === pieceId);
    if (!piece) return false;

    const newX = piece.x + dx;
    const newY = piece.y + dy;

    // 检查是否在边界内
    if (newX < 0 || newY < 0 || newX + piece.width > this.gridWidth || newY + piece.height > this.gridHeight) {
      return false;
    }

    // 检查是否与其他块重叠
    for (const other of this.pieces) {
      if (other.id === pieceId) continue;
      if (this.checkOverlap(newX, newY, piece.width, piece.height, other)) {
        return false;
      }
    }

    // 执行移动
    piece.x = newX;
    piece.y = newY;

    if (!silent) {
      this.moves++;
    }

    // 检查是否完成 - 曹操到达底部出口(3,4)位置
    if (piece.type === 'cao' && piece.x === 1 && piece.y === 3) {
      this.isComplete = true;
    }

    return true;
  }

  private checkOverlap(x: number, y: number, width: number, height: number, other: Piece): boolean {
    return !(
      x >= other.x + other.width ||
      x + width <= other.x ||
      y >= other.y + other.height ||
      y + height <= other.y
    );
  }

  public getValidMoves(): { pieceId: number; dx: number; dy: number }[] {
    const moves: { pieceId: number; dx: number; dy: number }[] = [];
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];

    for (const piece of this.pieces) {
      for (const dir of directions) {
        const testX = piece.x + dir.dx;
        const testY = piece.y + dir.dy;

        if (testX >= 0 && testY >= 0 && 
            testX + piece.width <= this.gridWidth && 
            testY + piece.height <= this.gridHeight) {
          
          let canMove = true;
          for (const other of this.pieces) {
            if (other.id === piece.id) continue;
            if (this.checkOverlap(testX, testY, piece.width, piece.height, other)) {
              canMove = false;
              break;
            }
          }
          
          if (canMove) {
            moves.push({ pieceId: piece.id, dx: dir.dx, dy: dir.dy });
          }
        }
      }
    }

    return moves;
  }

  public getMoves(): number {
    return this.moves;
  }

  public isGameComplete(): boolean {
    return this.isComplete;
  }

  public getPieces(): Piece[] {
    return this.pieces.map(p => ({ ...p }));
  }

  public getGridWidth(): number {
    return this.gridWidth;
  }

  public getGridHeight(): number {
    return this.gridHeight;
  }

  public getCellSize(): number {
    return this.cellSize;
  }

  public getHint(): { pieceId: number; dx: number; dy: number } | null {
    // 简单的提示：找到可以移动到曹操右侧的块
    const cao = this.pieces.find(p => p.type === 'cao');
    if (!cao) return null;

    // 目标位置是曹操下面
    const targetX = 1;
    const targetY = 3;

    // 找到阻碍的块
    for (const piece of this.pieces) {
      if (piece.type === 'cao') continue;
      if (piece.x === targetX && piece.y === targetY) {
        // 这个块挡住了出口，提示移动它
        const validMoves = this.getValidMovesForPiece(piece.id);
        if (validMoves.length > 0) {
          return validMoves[0];
        }
      }
    }

    return null;
  }

  private getValidMovesForPiece(pieceId: number): { pieceId: number; dx: number; dy: number }[] {
    const piece = this.pieces.find(p => p.id === pieceId);
    if (!piece) return [];

    const moves: { pieceId: number; dx: number; dy: number }[] = [];
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];

    for (const dir of directions) {
      const testX = piece.x + dir.dx;
      const testY = piece.y + dir.dy;

      if (testX >= 0 && testY >= 0 && 
          testX + piece.width <= this.gridWidth && 
          testY + piece.height <= this.gridHeight) {
        
        let canMove = true;
        for (const other of this.pieces) {
          if (other.id === piece.id) continue;
          if (this.checkOverlap(testX, testY, piece.width, piece.height, other)) {
            canMove = false;
            break;
          }
        }
        
        if (canMove) {
          moves.push({ pieceId: piece.id, dx: dir.dx, dy: dir.dy });
        }
      }
    }

    return moves;
  }
}
