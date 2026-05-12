export const HOP_CHESS_CONSTANTS = {
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 620,
  BOARD_SIZE: 13,
  CELL_SIZE: 45,
  PIECE_SIZE: 36,
};

export const HOP_CHESS_ENGINE_CONSTANTS = HOP_CHESS_CONSTANTS;
export const HOP_CHESS_CONSTANTS_2 = HOP_CHESS_CONSTANTS;
export const HOP_CHESS_CONSTANTS_3 = HOP_CHESS_CONSTANTS;
export const HOP_CHESS_ENGINE_CONSTANTS_2 = HOP_CHESS_CONSTANTS;
export const HOP_CHESS_ENGINE_CONSTANTS_3 = HOP_CHESS_CONSTANTS;

export type Player = 'red' | 'blue';

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  id: number;
  player: Player;
  row: number;
  col: number;
  isHome: boolean;
}

export interface HopChessState {
  pieces: Piece[];
  currentPlayer: Player;
  selectedPiece: Piece | null;
  validMoves: Position[];
  isGameOver: boolean;
  winner: Player | null;
  diceValue: number;
  canRoll: boolean;
}

export class HopChessEngine {
  private pieces: Piece[];
  private currentPlayer: Player;
  private selectedPiece: Piece | null;
  private validMoves: Position[];
  private isGameOver: boolean;
  private winner: Player | null;
  private diceValue: number;
  private canRoll: boolean;
  private diceAnimating: boolean;

  constructor() {
    this.pieces = [];
    this.currentPlayer = 'red';
    this.selectedPiece = null;
    this.validMoves = [];
    this.isGameOver = false;
    this.winner = null;
    this.diceValue = 0;
    this.canRoll = true;
    this.diceAnimating = false;
    this.init();
  }

  private init(): void {
    this.pieces = this.createInitialPieces();
    this.currentPlayer = 'red';
    this.selectedPiece = null;
    this.validMoves = [];
    this.isGameOver = false;
    this.winner = null;
    this.diceValue = 0;
    this.canRoll = true;
    this.diceAnimating = false;
  }

  private createInitialPieces(): Piece[] {
    const pieces: Piece[] = [];
    let id = 0;

    pieces.push({ id: id++, player: 'red', row: 6, col: 6, isHome: false });

    for (let row = 0; row < 3; row++) {
      for (let col = 4; col < 9; col++) {
        pieces.push({ id: id++, player: 'red', row, col, isHome: true });
      }
    }

    pieces.push({ id: id++, player: 'blue', row: 6, col: 6, isHome: false });

    for (let row = 10; row < 13; row++) {
      for (let col = 4; col < 9; col++) {
        pieces.push({ id: id++, player: 'blue', row, col, isHome: true });
      }
    }

    return pieces;
  }

  getState(): HopChessState {
    return {
      pieces: this.pieces.map(p => ({ ...p })),
      currentPlayer: this.currentPlayer,
      selectedPiece: this.selectedPiece ? { ...this.selectedPiece } : null,
      validMoves: [...this.validMoves],
      isGameOver: this.isGameOver,
      winner: this.winner,
      diceValue: this.diceValue,
      canRoll: this.canRoll
    };
  }

  reset(): void {
    this.init();
  }

  rollDice(): number {
    if (!this.canRoll || this.diceAnimating) return 0;
    
    this.diceValue = Math.floor(Math.random() * 6) + 1;
    this.canRoll = false;
    this.diceAnimating = true;
    
    setTimeout(() => {
      this.diceAnimating = false;
      this.validMoves = this.getMovablePositions(this.diceValue);
    }, 500);

    return this.diceValue;
  }

  private getMovablePositions(steps: number): Position[] {
    const positions: Position[] = [];
    const pieces = this.pieces.filter(p => p.player === this.currentPlayer && !p.isHome);

    if (pieces.length === 0) return positions;

    const isValidPosition = (row: number, col: number): boolean => {
      if (row < 0 || row >= 13 || col < 0 || col >= 13) return false;
      if ((row === 0 || row === 12) && (col < 4 || col > 8)) return false;
      if ((row === 1 || row === 11) && (col < 4 || col > 8)) return false;
      if ((row === 2 || row === 10) && (col < 4 || col > 8)) return false;
      if ((col === 0 || col === 12) && (row < 0 || row > 12)) return false;
      if ((col === 1 || col === 11) && (row < 0 || row > 12)) return false;
      if ((col === 2 || col === 10) && (row < 0 || row > 12)) return false;
      
      if (row === 6 && col === 6) return true;
      if (row >= 3 && row <= 9 && col >= 3 && col <= 9) return true;
      if ((row === 6 || col === 6) && row >= 0 && row < 13 && col >= 0 && col < 13) return true;
      
      return false;
    };

    const isOccupied = (row: number, col: number): Piece | undefined => {
      return this.pieces.find(p => p.row === row && p.col === col);
    };

    for (const piece of pieces) {
      const newRow = piece.row + steps;
      const newCol = piece.col;

      if (isValidPosition(newRow, newCol)) {
        const target = isOccupied(newRow, newCol);
        if (!target || target.player !== piece.player) {
          positions.push({ row: newRow, col: newCol });
        }
      }

      const newRow2 = piece.row;
      const newCol2 = piece.col + steps;

      if (isValidPosition(newRow2, newCol2)) {
        const target = isOccupied(newRow2, newCol2);
        if (!target || target.player !== piece.player) {
          positions.push({ row: newRow2, col: newCol2 });
        }
      }
    }

    return positions;
  }

  selectPiece(row: number, col: number): boolean {
    if (this.isGameOver) return false;
    if (this.diceValue === 0) return false;
    if (this.validMoves.length === 0) return false;

    const piece = this.pieces.find(p => p.row === row && p.col === col && p.player === this.currentPlayer);
    if (!piece) return false;

    this.selectedPiece = piece;
    return true;
  }

  movePiece(toRow: number, toCol: number): boolean {
    if (!this.selectedPiece) return false;
    if (!this.isValidMove(toRow, toCol)) return false;

    const targetPiece = this.pieces.find(p => p.row === toRow && p.col === toCol && p.player !== this.currentPlayer);
    if (targetPiece) {
      this.pieces = this.pieces.filter(p => p.id !== targetPiece.id);
    }

    this.selectedPiece.row = toRow;
    this.selectedPiece.col = toCol;

    if (targetPiece) {
      const homeBase = this.currentPlayer === 'red' ? 0 : 10;
      const homeCol = 4 + Math.floor(Math.random() * 5);
      targetPiece.row = homeBase;
      targetPiece.col = homeCol;
      targetPiece.isHome = true;
    }

    if (this.checkWin()) {
      this.isGameOver = true;
    } else {
      this.nextTurn();
    }

    return true;
  }

  private isValidMove(row: number, col: number): boolean {
    return this.validMoves.some(m => m.row === row && m.col === col);
  }

  private checkWin(): boolean {
    const pieces = this.pieces.filter(p => p.player === this.currentPlayer);
    const allHome = pieces.filter(p => p.isHome).length;
    
    if (allHome === 10) {
      this.winner = this.currentPlayer;
      return true;
    }
    return false;
  }

  private nextTurn(): void {
    this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';
    this.diceValue = 0;
    this.canRoll = true;
    this.selectedPiece = null;
    this.validMoves = [];
  }

  getPieceAt(row: number, col: number): Piece | undefined {
    return this.pieces.find(p => p.row === row && p.col === col);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.drawBoard(ctx);
    this.drawPieces(ctx);
    this.drawValidMoves(ctx);
  }

  private drawBoard(ctx: CanvasRenderingContext2D): void {
    const width = 585;
    const height = 585;
    const cellSize = 45;

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#DEB887';
    ctx.fillRect(cellSize, cellSize, width - 2 * cellSize, height - 2 * cellSize);

    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 12; i++) {
      if (i === 0 || i === 12) {
        ctx.beginPath();
        ctx.moveTo(3 * cellSize, i * cellSize);
        ctx.lineTo(10 * cellSize, i * cellSize);
        ctx.stroke();
      } else if (i === 3) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(3 * cellSize, i * cellSize);
        ctx.lineTo(3 * cellSize, 9 * cellSize);
        ctx.lineTo(0, 9 * cellSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(12 * cellSize, i * cellSize);
        ctx.lineTo(9 * cellSize, i * cellSize);
        ctx.lineTo(9 * cellSize, 9 * cellSize);
        ctx.lineTo(12 * cellSize, 9 * cellSize);
        ctx.stroke();
      } else if (i === 9) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(3 * cellSize, i * cellSize);
        ctx.lineTo(3 * cellSize, 12 * cellSize);
        ctx.lineTo(0, 12 * cellSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(12 * cellSize, i * cellSize);
        ctx.lineTo(9 * cellSize, i * cellSize);
        ctx.lineTo(9 * cellSize, 12 * cellSize);
        ctx.lineTo(12 * cellSize, 12 * cellSize);
        ctx.stroke();
      } else if (i === 12) {
        ctx.beginPath();
        ctx.moveTo(3 * cellSize, i * cellSize);
        ctx.lineTo(10 * cellSize, i * cellSize);
        ctx.stroke();
      }
    }

    for (let i = 3; i <= 9; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 3 * cellSize);
      ctx.lineTo(i * cellSize, 10 * cellSize);
      ctx.stroke();
    }

    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(3 * cellSize, 0);
    ctx.lineTo(3 * cellSize, 3 * cellSize);
    ctx.lineTo(6 * cellSize, 3 * cellSize);
    ctx.lineTo(6 * cellSize, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(10 * cellSize, 0);
    ctx.lineTo(10 * cellSize, 3 * cellSize);
    ctx.lineTo(9 * cellSize, 3 * cellSize);
    ctx.lineTo(9 * cellSize, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(3 * cellSize, 12 * cellSize);
    ctx.lineTo(3 * cellSize, 9 * cellSize);
    ctx.lineTo(6 * cellSize, 9 * cellSize);
    ctx.lineTo(6 * cellSize, 12 * cellSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(10 * cellSize, 12 * cellSize);
    ctx.lineTo(10 * cellSize, 9 * cellSize);
    ctx.lineTo(9 * cellSize, 9 * cellSize);
    ctx.lineTo(9 * cellSize, 12 * cellSize);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.fillRect(3 * cellSize, 0, 3 * cellSize, 3 * cellSize);
    ctx.fillRect(7 * cellSize, 0, 3 * cellSize, 3 * cellSize);
    ctx.fillRect(3 * cellSize, 10 * cellSize, 3 * cellSize, 2 * cellSize);
    ctx.fillRect(7 * cellSize, 10 * cellSize, 3 * cellSize, 2 * cellSize);

    ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
    ctx.fillRect(3 * cellSize, 10 * cellSize, 3 * cellSize, 2 * cellSize);
    ctx.fillRect(7 * cellSize, 10 * cellSize, 3 * cellSize, 2 * cellSize);
    ctx.fillRect(3 * cellSize, 0, 3 * cellSize, 3 * cellSize);
    ctx.fillRect(7 * cellSize, 0, 3 * cellSize, 3 * cellSize);

    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('红方基地', 4.5 * cellSize, 1.5 * cellSize);
    ctx.fillText('蓝方基地', 4.5 * cellSize, 11 * cellSize);
  }

  private drawPieces(ctx: CanvasRenderingContext2D): void {
    const cellSize = 45;

    for (const piece of this.pieces) {
      const x = piece.col * cellSize + cellSize / 2;
      const y = piece.row * cellSize + cellSize / 2;
      const radius = 16;

      if (this.selectedPiece && this.selectedPiece.id === piece.id) {
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 15;
      }

      const gradient = ctx.createRadialGradient(x - 4, y - 4, 0, x, y, radius);
      if (piece.player === 'red') {
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(1, '#cc0000');
      } else {
        gradient.addColorStop(0, '#6b9fff');
        gradient.addColorStop(1, '#0044cc');
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = piece.player === 'red' ? '#8b0000' : '#002288';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(piece.id.toString(), x, y);

      ctx.shadowBlur = 0;
    }
  }

  private drawValidMoves(ctx: CanvasRenderingContext2D): void {
    const cellSize = 45;

    for (const move of this.validMoves) {
      const x = move.col * cellSize + cellSize / 2;
      const y = move.row * cellSize + cellSize / 2;

      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
