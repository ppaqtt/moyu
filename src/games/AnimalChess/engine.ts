export const ANIMAL_CHESS_CONSTANTS = {
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 480,
  GRID_SIZE: 7,
  CELL_SIZE: 55,
  PIECE_SIZE: 44,
};

export const ANIMAL_CHESS_ENGINE_CONSTANTS = ANIMAL_CHESS_CONSTANTS;
export const ANIMAL_CHESS_CONSTANTS_2 = ANIMAL_CHESS_CONSTANTS;
export const ANIMAL_CHESS_CONSTANTS_3 = ANIMAL_CHESS_CONSTANTS;
export const ANIMAL_CHESS_ENGINE_CONSTANTS_2 = ANIMAL_CHESS_CONSTANTS;
export const ANIMAL_CHESS_ENGINE_CONSTANTS_3 = ANIMAL_CHESS_CONSTANTS;

export type AnimalType = 'mouse' | 'cat' | 'dog' | 'wolf' | 'leopard' | 'tiger' | 'lion' | 'elephant';
export type Player = 'red' | 'blue';

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  animal: AnimalType;
  player: Player;
  row: number;
  col: number;
  id: string;
}

export interface AnimalChessState {
  pieces: Piece[];
  currentPlayer: Player;
  selectedPiece: Piece | null;
  validMoves: Position[];
  isGameOver: boolean;
  winner: Player | null;
  lastMove: { from: Position; to: Position } | null;
  capturedPieces: Piece[];
}

const ANIMAL_ORDER: AnimalType[] = ['mouse', 'cat', 'dog', 'wolf', 'leopard', 'tiger', 'lion', 'elephant'];

const ANIMAL_VALUES: Record<AnimalType, number> = {
  elephant: 8,
  lion: 7,
  tiger: 6,
  leopard: 5,
  wolf: 4,
  dog: 3,
  cat: 2,
  mouse: 1
};

export class AnimalChessEngine {
  private pieces: Piece[];
  private currentPlayer: Player;
  private selectedPiece: Piece | null;
  private validMoves: Position[];
  private isGameOver: boolean;
  private winner: Player | null;
  private lastMove: { from: Position; to: Position } | null;
  private capturedPieces: Piece[];
  private pieceIdCounter: number;

  constructor() {
    this.pieces = [];
    this.currentPlayer = 'red';
    this.selectedPiece = null;
    this.validMoves = [];
    this.isGameOver = false;
    this.winner = null;
    this.lastMove = null;
    this.capturedPieces = [];
    this.pieceIdCounter = 0;
    this.init();
  }

  private init(): void {
    this.pieces = this.createInitialPieces();
    this.currentPlayer = 'red';
    this.selectedPiece = null;
    this.validMoves = [];
    this.isGameOver = false;
    this.winner = null;
    this.lastMove = null;
    this.capturedPieces = [];
  }

  private createInitialPieces(): Piece[] {
    const pieces: Piece[] = [];

    pieces.push({ animal: 'elephant', player: 'red', row: 0, col: 0, id: `red_elephant` });
    pieces.push({ animal: 'lion', player: 'red', row: 0, col: 6, id: `red_lion` });
    pieces.push({ animal: 'tiger', player: 'red', row: 3, col: 1, id: `red_tiger` });
    pieces.push({ animal: 'leopard', player: 'red', row: 3, col: 5, id: `red_leopard` });
    pieces.push({ animal: 'wolf', player: 'red', row: 1, col: 2, id: `red_wolf` });
    pieces.push({ animal: 'dog', player: 'red', row: 1, col: 4, id: `red_dog` });
    pieces.push({ animal: 'cat', player: 'red', row: 2, col: 1, id: `red_cat` });
    pieces.push({ animal: 'mouse', player: 'red', row: 2, col: 5, id: `red_mouse` });

    pieces.push({ animal: 'elephant', player: 'blue', row: 6, col: 6, id: `blue_elephant` });
    pieces.push({ animal: 'lion', player: 'blue', row: 6, col: 0, id: `blue_lion` });
    pieces.push({ animal: 'tiger', player: 'blue', row: 3, col: 5, id: `blue_tiger` });
    pieces.push({ animal: 'leopard', player: 'blue', row: 3, col: 1, id: `blue_leopard` });
    pieces.push({ animal: 'wolf', player: 'blue', row: 5, col: 4, id: `blue_wolf` });
    pieces.push({ animal: 'dog', player: 'blue', row: 5, col: 2, id: `blue_dog` });
    pieces.push({ animal: 'cat', player: 'blue', row: 4, col: 5, id: `blue_cat` });
    pieces.push({ animal: 'mouse', player: 'blue', row: 4, col: 1, id: `blue_mouse` });

    return pieces;
  }

  getState(): AnimalChessState {
    return {
      pieces: this.pieces.map(p => ({ ...p })),
      currentPlayer: this.currentPlayer,
      selectedPiece: this.selectedPiece ? { ...this.selectedPiece } : null,
      validMoves: [...this.validMoves],
      isGameOver: this.isGameOver,
      winner: this.winner,
      lastMove: this.lastMove ? { ...this.lastMove } : null,
      capturedPieces: this.capturedPieces.map(p => ({ ...p }))
    };
  }

  reset(): void {
    this.init();
  }

  getPieceAt(row: number, col: number): Piece | undefined {
    return this.pieces.find(p => p.row === row && p.col === col);
  }

  selectPiece(row: number, col: number): boolean {
    if (this.isGameOver) return false;

    const piece = this.getPieceAt(row, col);

    if (piece && piece.player === this.currentPlayer) {
      this.selectedPiece = piece;
      this.validMoves = this.getValidMoves(piece);
      return true;
    } else if (this.selectedPiece) {
      const targetPos = { row, col };
      if (this.isValidMove(this.selectedPiece, targetPos)) {
        this.movePiece(this.selectedPiece, targetPos);
        return true;
      } else {
        this.selectedPiece = null;
        this.validMoves = [];
        return false;
      }
    }

    return false;
  }

  private getValidMoves(piece: Piece): Position[] {
    const moves: Position[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    if (piece.animal === 'mouse' || piece.animal === 'tiger' || piece.animal === 'lion') {
      const riverRows = [2, 3, 4];
      for (const dir of directions) {
        const jumpRow = piece.row + dir[0] * 3;
        const jumpCol = piece.col + dir[1] * 2;

        if (this.isInBoard(jumpRow, jumpCol)) {
          const midRow = piece.row + dir[0];
          const midCol = piece.col + dir[1];

          if (riverRows.includes(midRow) && riverRows.includes(jumpRow)) {
            const midPiece = this.getPieceAt(midRow, midCol);
            if (!midPiece) {
              const targetPiece = this.getPieceAt(jumpRow, jumpCol);
              if (!targetPiece || targetPiece.player !== piece.player) {
                moves.push({ row: jumpRow, col: jumpCol });
              }
            }
          }
        }
      }
    }

    for (const dir of directions) {
      const newRow = piece.row + dir[0];
      const newCol = piece.col + dir[1];

      if (piece.animal === 'mouse') {
        if (newRow >= 2 && newRow <= 4) {
          continue;
        }
      }

      if (!this.isInBoard(newRow, newCol)) continue;

      const target = this.getPieceAt(newRow, newCol);
      if (!target) {
        moves.push({ row: newRow, col: newCol });
      } else if (target.player !== piece.player) {
        if (this.canCapture(piece, target)) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    return moves;
  }

  private isInBoard(row: number, col: number): boolean {
    return row >= 0 && row < 7 && col >= 0 && col < 7;
  }

  private canCapture(attacker: Piece, defender: Piece): boolean {
    if (attacker.animal === 'elephant' && defender.animal === 'mouse') {
      return true;
    }
    if (attacker.animal === 'mouse' && defender.animal === 'elephant') {
      return true;
    }

    return ANIMAL_VALUES[attacker.animal] >= ANIMAL_VALUES[defender.animal];
  }

  private isValidMove(piece: Piece, target: Position): boolean {
    return this.validMoves.some(m => m.row === target.row && m.col === target.col);
  }

  private movePiece(piece: Piece, target: Position): void {
    const targetPiece = this.getPieceAt(target.row, target.col);

    if (targetPiece) {
      this.capturedPieces.push(targetPiece);
      this.pieces = this.pieces.filter(p => p.id !== targetPiece.id);

      if (targetPiece.animal === 'lion' || targetPiece.animal === 'tiger') {
        const side = targetPiece.player === 'red' ? 'red' : 'blue';
        const remainingBig = this.pieces.filter(
          p => p.player === side && (p.animal === 'lion' || p.animal === 'tiger')
        ).length;

        if (remainingBig === 0) {
          this.isGameOver = true;
          this.winner = piece.player;
        }
      }
    }

    this.lastMove = {
      from: { row: piece.row, col: piece.col },
      to: { row: target.row, col: target.col }
    };

    piece.row = target.row;
    piece.col = target.col;

    this.selectedPiece = null;
    this.validMoves = [];

    this.checkWinCondition();

    if (!this.isGameOver) {
      this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';

      setTimeout(() => {
        this.aiMove();
      }, 500);
    }
  }

  private checkWinCondition(): void {
    const redAnimals = this.pieces.filter(p => p.player === 'red');
    const blueAnimals = this.pieces.filter(p => p.player === 'blue');

    if (redAnimals.length === 0) {
      this.isGameOver = true;
      this.winner = 'blue';
      return;
    }

    if (blueAnimals.length === 0) {
      this.isGameOver = true;
      this.winner = 'red';
      return;
    }

    const redLion = redAnimals.find(a => a.animal === 'lion' || a.animal === 'tiger');
    const blueLion = blueAnimals.find(a => a.animal === 'lion' || a.animal === 'tiger');

    if (!redLion && redAnimals.length > 0) {
      this.isGameOver = true;
      this.winner = 'blue';
      return;
    }

    if (!blueLion && blueAnimals.length > 0) {
      this.isGameOver = true;
      this.winner = 'red';
      return;
    }
  }

  private aiMove(): void {
    if (this.isGameOver || this.currentPlayer !== 'blue') return;

    const allPieces = this.pieces.filter(p => p.player === 'blue');
    const allMoves: { piece: Piece; move: Position }[] = [];

    for (const piece of allPieces) {
      const moves = this.getValidMoves(piece);
      for (const move of moves) {
        allMoves.push({ piece, move });
      }
    }

    if (allMoves.length === 0) {
      return;
    }

    let selectedMove: { piece: Piece; move: Position };

    const captureMoves = allMoves.filter(({ move }) => {
      return this.getPieceAt(move.row, move.col) !== undefined;
    });

    if (captureMoves.length > 0) {
      selectedMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
    } else {
      selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    }

    this.selectedPiece = selectedMove.piece;
    this.validMoves = this.getValidMoves(selectedMove.piece);
    this.movePiece(selectedMove.piece, selectedMove.move);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.drawBoard(ctx);
    this.drawRiver(ctx);
    this.drawLastMove(ctx);
    this.drawValidMoves(ctx);
    this.drawPieces(ctx);
  }

  private drawBoard(ctx: CanvasRenderingContext2D): void {
    const cellSize = 55;

    ctx.fillStyle = '#c4a76c';
    ctx.fillRect(0, 0, 385, 385);

    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;

    for (let i = 0; i <= 7; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(7 * cellSize, i * cellSize);
      ctx.stroke();
    }

    for (let i = 0; i <= 7; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, 7 * cellSize);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, cellSize, cellSize);
    ctx.fillRect(6 * cellSize, 0, cellSize, cellSize);
    ctx.fillRect(0, 6 * cellSize, cellSize, cellSize);
    ctx.fillRect(6 * cellSize, 6 * cellSize, cellSize, cellSize);
  }

  private drawRiver(ctx: CanvasRenderingContext2D): void {
    const cellSize = 55;

    ctx.fillStyle = '#4a90d9';
    ctx.fillRect(0, 2 * cellSize, 7 * cellSize, 3 * cellSize);

    ctx.strokeStyle = '#2d5a8a';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    for (let i = 0; i <= 7; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 2 * cellSize);
      ctx.lineTo(i * cellSize, 5 * cellSize);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('河', 3.5 * cellSize, 3.5 * cellSize);
  }

  private drawLastMove(ctx: CanvasRenderingContext2D): void {
    if (!this.lastMove) return;

    const cellSize = 55;
    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';

    ctx.fillRect(
      this.lastMove.from.col * cellSize,
      this.lastMove.from.row * cellSize,
      cellSize,
      cellSize
    );
    ctx.fillRect(
      this.lastMove.to.col * cellSize,
      this.lastMove.to.row * cellSize,
      cellSize,
      cellSize
    );
  }

  private drawValidMoves(ctx: CanvasRenderingContext2D): void {
    const cellSize = 55;

    for (const move of this.validMoves) {
      const x = move.col * cellSize + cellSize / 2;
      const y = move.row * cellSize + cellSize / 2;

      const target = this.getPieceAt(move.row, move.col);
      if (target) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, cellSize / 2 - 4, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, cellSize / 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawPieces(ctx: CanvasRenderingContext2D): void {
    const cellSize = 55;

    for (const piece of this.pieces) {
      const x = piece.col * cellSize + cellSize / 2;
      const y = piece.row * cellSize + cellSize / 2;
      const radius = 22;

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

      const symbol = this.getAnimalSymbol(piece.animal);
      ctx.fillText(symbol, x, y + 2);

      ctx.shadowBlur = 0;
    }
  }

  private getAnimalSymbol(animal: AnimalType): string {
    const symbols: Record<AnimalType, string> = {
      mouse: '鼠',
      cat: '猫',
      dog: '狗',
      wolf: '狼',
      leopard: '豹',
      tiger: '虎',
      lion: '狮',
      elephant: '象'
    };
    return symbols[animal];
  }
}
