import { CHESS_CONSTANTS } from '../../utils/constants';

const { CELL_SIZE, PIECE_SIZE } = CHESS_CONSTANTS;

export type PieceType = 'rook' | 'horse' | 'elephant' | 'advisor' | 'king' | 'cannon' | 'pawn';
export type Player = 'red' | 'black';

export interface Piece {
  type: PieceType;
  player: Player;
  x: number;
  y: number;
  id: string;
}

export interface Position {
  row: number;
  col: number;
}

export interface ChessState {
  pieces: Piece[];
  currentPlayer: Player;
  selectedPiece: Piece | null;
  validMoves: Position[];
  isGameOver: boolean;
  winner: Player | null;
  isCheck: boolean;
  lastMove: { from: Position; to: Position } | null;
}

const BOARD_ROWS = 10;
const BOARD_COLS = 9;

export class ChessEngine {
  private pieces: Piece[];
  private currentPlayer: Player;
  private selectedPiece: Piece | null;
  private validMoves: Position[];
  private isGameOver: boolean;
  private winner: Player | null;
  private isCheck: boolean;
  private lastMove: { from: Position; to: Position } | null;
  private pieceIdCounter: number;

  constructor() {
    this.pieces = [];
    this.currentPlayer = 'red';
    this.selectedPiece = null;
    this.validMoves = [];
    this.isGameOver = false;
    this.winner = null;
    this.isCheck = false;
    this.lastMove = null;
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
    this.isCheck = false;
    this.lastMove = null;
  }

  private createInitialPieces(): Piece[] {
    const pieces: Piece[] = [];

    pieces.push(this.createPiece('rook', 'black', 0, 0));
    pieces.push(this.createPiece('horse', 'black', 0, 1));
    pieces.push(this.createPiece('elephant', 'black', 0, 2));
    pieces.push(this.createPiece('advisor', 'black', 0, 3));
    pieces.push(this.createPiece('king', 'black', 0, 4));
    pieces.push(this.createPiece('advisor', 'black', 0, 5));
    pieces.push(this.createPiece('elephant', 'black', 0, 6));
    pieces.push(this.createPiece('horse', 'black', 0, 7));
    pieces.push(this.createPiece('rook', 'black', 0, 8));

    pieces.push(this.createPiece('cannon', 'black', 2, 1));
    pieces.push(this.createPiece('cannon', 'black', 2, 7));

    for (let col = 0; col < 9; col += 2) {
      pieces.push(this.createPiece('pawn', 'black', 3, col));
    }

    pieces.push(this.createPiece('rook', 'red', 9, 0));
    pieces.push(this.createPiece('horse', 'red', 9, 1));
    pieces.push(this.createPiece('elephant', 'red', 9, 2));
    pieces.push(this.createPiece('advisor', 'red', 9, 3));
    pieces.push(this.createPiece('king', 'red', 9, 4));
    pieces.push(this.createPiece('advisor', 'red', 9, 5));
    pieces.push(this.createPiece('elephant', 'red', 9, 6));
    pieces.push(this.createPiece('horse', 'red', 9, 7));
    pieces.push(this.createPiece('rook', 'red', 9, 8));

    pieces.push(this.createPiece('cannon', 'red', 7, 1));
    pieces.push(this.createPiece('cannon', 'red', 7, 7));

    for (let col = 0; col < 9; col += 2) {
      pieces.push(this.createPiece('pawn', 'red', 6, col));
    }

    return pieces;
  }

  private createPiece(type: PieceType, player: Player, x: number, y: number): Piece {
    return {
      type,
      player,
      x,
      y,
      id: `${player}_${type}_${this.pieceIdCounter++}`
    };
  }

  getState(): ChessState {
    return {
      pieces: [...this.pieces],
      currentPlayer: this.currentPlayer,
      selectedPiece: this.selectedPiece ? { ...this.selectedPiece } : null,
      validMoves: [...this.validMoves],
      isGameOver: this.isGameOver,
      winner: this.winner,
      isCheck: this.isCheck,
      lastMove: this.lastMove ? { ...this.lastMove } : null
    };
  }

  getPieceAt(row: number, col: number): Piece | undefined {
    return this.pieces.find(p => p.x === row && p.y === col);
  }

  selectPiece(row: number, col: number): void {
    if (this.isGameOver) return;
    if (this.currentPlayer !== 'red') return;

    const piece = this.getPieceAt(row, col);

    if (piece && piece.player === this.currentPlayer) {
      this.selectedPiece = piece;
      this.validMoves = this.getValidMoves(piece);
    } else if (this.selectedPiece) {
      const targetPos = { row, col };
      if (this.isValidMove(this.selectedPiece, targetPos)) {
        this.movePiece(this.selectedPiece, targetPos);
      } else {
        this.selectedPiece = null;
        this.validMoves = [];
      }
    }
  }

  private getValidMoves(piece: Piece): Position[] {
    const moves: Position[] = [];

    switch (piece.type) {
      case 'rook':
        this.addRookMoves(piece, moves);
        break;
      case 'horse':
        this.addHorseMoves(piece, moves);
        break;
      case 'elephant':
        this.addElephantMoves(piece, moves);
        break;
      case 'advisor':
        this.addAdvisorMoves(piece, moves);
        break;
      case 'king':
        this.addKingMoves(piece, moves);
        break;
      case 'cannon':
        this.addCannonMoves(piece, moves);
        break;
      case 'pawn':
        this.addPawnMoves(piece, moves);
        break;
    }

    return moves.filter(pos => !this.wouldBeInCheck(piece, pos));
  }

  private addRookMoves(piece: Piece, moves: Position[]): void {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of directions) {
      let r = piece.x + dr;
      let c = piece.y + dc;

      while (this.isInBoard(r, c)) {
        const target = this.getPieceAt(r, c);
        if (!target) {
          moves.push({ row: r, col: c });
        } else {
          if (target.player !== piece.player) {
            moves.push({ row: r, col: c });
          }
          break;
        }
        r += dr;
        c += dc;
      }
    }
  }

  private addHorseMoves(piece: Piece, moves: Position[]): void {
    const jumps = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    for (const [dr, dc] of jumps) {
      const r = piece.x + dr;
      const c = piece.y + dc;

      if (!this.isInBoard(r, c)) continue;

      const blockRow = piece.x + dr / 2;
      const blockCol = piece.y + dc / 2;

      if (!this.isInBoard(blockRow, blockCol)) continue;
      if (this.getPieceAt(blockRow, blockCol)) continue;

      const target = this.getPieceAt(r, c);
      if (!target || target.player !== piece.player) {
        moves.push({ row: r, col: c });
      }
    }
  }

  private addElephantMoves(piece: Piece, moves: Position[]): void {
    const deltas = [[-2, -2], [-2, 2], [2, -2], [2, 2]];

    for (const [dr, dc] of deltas) {
      const r = piece.x + dr;
      const c = piece.y + dc;

      if (!this.isInBoard(r, c)) continue;

      const blockRow = piece.x + dr / 2;
      const blockCol = piece.y + dc / 2;

      if (!this.isInBoard(blockRow, blockCol)) continue;
      if (this.getPieceAt(blockRow, blockCol)) continue;

      const inOwnTerritory = piece.player === 'black'
        ? r >= 5
        : r <= 4;

      if (!inOwnTerritory) {
        const target = this.getPieceAt(r, c);
        if (!target || target.player !== piece.player) {
          moves.push({ row: r, col: c });
        }
      }
    }
  }

  private addAdvisorMoves(piece: Piece, moves: Position[]): void {
    const deltas = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    for (const [dr, dc] of deltas) {
      const r = piece.x + dr;
      const c = piece.y + dc;

      if (!this.isInBoard(r, c)) continue;

      const inPalace = piece.player === 'black'
        ? (r >= 0 && r <= 2 && c >= 3 && c <= 5)
        : (r >= 7 && r <= 9 && c >= 3 && c <= 5);

      if (!inPalace) continue;

      const target = this.getPieceAt(r, c);
      if (!target || target.player !== piece.player) {
        moves.push({ row: r, col: c });
      }
    }
  }

  private addKingMoves(piece: Piece, moves: Position[]): void {
    const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of deltas) {
      const r = piece.x + dr;
      const c = piece.y + dc;

      if (!this.isInBoard(r, c)) continue;

      const inPalace = piece.player === 'black'
        ? (r >= 0 && r <= 2 && c >= 3 && c <= 5)
        : (r >= 7 && r <= 9 && c >= 3 && c <= 5);

      if (!inPalace) continue;

      const target = this.getPieceAt(r, c);
      if (!target || target.player !== piece.player) {
        moves.push({ row: r, col: c });
      }
    }

    const enemyKing = this.findKing(piece.player === 'black' ? 'red' : 'black');
    if (enemyKing && enemyKing.y === piece.y) {
      let blocked = false;
      for (let r = Math.min(piece.x, enemyKing.x) + 1; r < Math.max(piece.x, enemyKing.x); r++) {
        if (this.getPieceAt(r, piece.y)) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        moves.push({ row: enemyKing.x, col: enemyKing.y });
      }
    }
  }

  private addCannonMoves(piece: Piece, moves: Position[]): void {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of directions) {
      let r = piece.x + dr;
      let c = piece.y + dc;
      let foundPlatform = false;

      while (this.isInBoard(r, c)) {
        const target = this.getPieceAt(r, c);

        if (!foundPlatform) {
          if (!target) {
            moves.push({ row: r, col: c });
          } else {
            foundPlatform = true;
          }
        } else {
          if (target) {
            if (target.player !== piece.player) {
              moves.push({ row: r, col: c });
            }
            break;
          }
        }

        r += dr;
        c += dc;
      }
    }
  }

  private addPawnMoves(piece: Piece, moves: Position[]): void {
    const forward = piece.player === 'red' ? -1 : 1;
    const crossedRiver = piece.player === 'red' ? piece.x <= 4 : piece.x >= 5;

    const r = piece.x + forward;
    if (this.isInBoard(r, piece.y)) {
      const target = this.getPieceAt(r, piece.y);
      if (!target || target.player !== piece.player) {
        moves.push({ row: r, col: piece.y });
      }
    }

    if (crossedRiver) {
      const deltas = [[0, -1], [0, 1]];
      for (const [dr, dc] of deltas) {
        const c = piece.y + dc;
        if (this.isInBoard(piece.x, c)) {
          const target = this.getPieceAt(piece.x, c);
          if (!target || target.player !== piece.player) {
            moves.push({ row: piece.x, col: c });
          }
        }
      }
    }
  }

  private isInBoard(row: number, col: number): boolean {
    return row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS;
  }

  private isValidMove(piece: Piece, target: Position): boolean {
    return this.validMoves.some(m => m.row === target.row && m.col === target.col);
  }

  private movePiece(piece: Piece, target: Position): void {
    const capturedPiece = this.getPieceAt(target.row, target.col);
    if (capturedPiece) {
      this.pieces = this.pieces.filter(p => p.id !== capturedPiece.id);

      if (capturedPiece.type === 'king') {
        this.isGameOver = true;
        this.winner = this.currentPlayer;
      }
    }

    const fromPos = { row: piece.x, col: piece.y };
    piece.x = target.row;
    piece.y = target.col;
    this.lastMove = { from: fromPos, to: target };

    this.selectedPiece = null;
    this.validMoves = [];

    if (!this.isGameOver) {
      this.isCheck = this.isInCheck(this.currentPlayer);
      this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';

      setTimeout(() => {
        this.aiMove();
      }, 500);
    }
  }

  private aiMove(): void {
    if (this.isGameOver || this.currentPlayer !== 'black') return;

    const allPieces = this.pieces.filter(p => p.player === 'black');
    const allMoves: { piece: Piece; move: Position }[] = [];

    for (const piece of allPieces) {
      const moves = this.getValidMovesForAI(piece);
      for (const move of moves) {
        allMoves.push({ piece, move });
      }
    }

    if (allMoves.length === 0) {
      this.isGameOver = true;
      this.winner = 'red';
      return;
    }

    let selectedMove: { piece: Piece; move: Position };

    const checkMoves = allMoves.filter(({ move }) => {
      const target = this.getPieceAt(move.row, move.col);
      return target && target.type === 'king' && target.player === 'red';
    });

    if (checkMoves.length > 0) {
      selectedMove = checkMoves[Math.floor(Math.random() * checkMoves.length)];
    } else {
      const captureMoves = allMoves.filter(({ move }) => {
        const target = this.getPieceAt(move.row, move.col);
        return target !== undefined;
      });

      if (captureMoves.length > 0) {
        const sortedCaptures = captureMoves.sort((a, b) => {
          const aTarget = this.getPieceAt(a.move.row, a.move.col)!;
          const bTarget = this.getPieceAt(b.move.row, b.move.col)!;
          return this.getPieceValue(bTarget) - this.getPieceValue(aTarget);
        });
        selectedMove = sortedCaptures[0];
      } else {
        selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
      }
    }

    const fromPos = { row: selectedMove.piece.x, col: selectedMove.piece.y };
    const capturedPiece = this.getPieceAt(selectedMove.move.row, selectedMove.move.col);

    if (capturedPiece) {
      this.pieces = this.pieces.filter(p => p.id !== capturedPiece.id);

      if (capturedPiece.type === 'king') {
        this.isGameOver = true;
        this.winner = 'black';
        return;
      }
    }

    selectedMove.piece.x = selectedMove.move.row;
    selectedMove.piece.y = selectedMove.move.col;
    this.lastMove = { from: fromPos, to: selectedMove.move };

    this.isCheck = this.isInCheck(this.currentPlayer);
    this.currentPlayer = 'red';
  }

  private getValidMovesForAI(piece: Piece): Position[] {
    const moves: Position[] = [];

    switch (piece.type) {
      case 'rook':
        this.addRookMoves(piece, moves);
        break;
      case 'horse':
        this.addHorseMoves(piece, moves);
        break;
      case 'elephant':
        this.addElephantMoves(piece, moves);
        break;
      case 'advisor':
        this.addAdvisorMoves(piece, moves);
        break;
      case 'king':
        this.addKingMoves(piece, moves);
        break;
      case 'cannon':
        this.addCannonMoves(piece, moves);
        break;
      case 'pawn':
        this.addPawnMoves(piece, moves);
        break;
    }

    return moves;
  }

  private getPieceValue(piece: Piece): number {
    const values: Record<PieceType, number> = {
      king: 1000,
      rook: 90,
      cannon: 45,
      horse: 40,
      advisor: 20,
      elephant: 20,
      pawn: 10
    };
    return values[piece.type];
  }

  private findKing(player: Player): Piece | undefined {
    return this.pieces.find(p => p.type === 'king' && p.player === player);
  }

  private isInCheck(player: Player): boolean {
    const king = this.findKing(player);
    if (!king) return false;

    const enemyPlayer = player === 'red' ? 'black' : 'red';
    const enemyPieces = this.pieces.filter(p => p.player === enemyPlayer);

    for (const enemy of enemyPieces) {
      const moves = this.getValidMovesForAI(enemy);
      if (moves.some(m => m.row === king.x && m.col === king.y)) {
        return true;
      }
    }

    return false;
  }

  private wouldBeInCheck(piece: Piece, target: Position): boolean {
    const originalX = piece.x;
    const originalY = piece.y;
    const capturedPiece = this.getPieceAt(target.row, target.col);

    piece.x = target.row;
    piece.y = target.col;

    if (capturedPiece) {
      this.pieces = this.pieces.filter(p => p.id !== capturedPiece.id);
    }

    const inCheck = this.isInCheck(piece.player);

    piece.x = originalX;
    piece.y = originalY;

    if (capturedPiece) {
      this.pieces.push(capturedPiece);
    }

    return inCheck;
  }

  reset(): void {
    this.init();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const width = 560;
    const height = 620;
    const offsetX = 30;
    const offsetY = 30;
    const cellSize = CELL_SIZE;

    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 2;

    for (let i = 0; i < BOARD_COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + i * cellSize, offsetY);
      ctx.lineTo(offsetX + i * cellSize, offsetY + 9 * cellSize);
      ctx.stroke();
    }

    for (let i = 0; i <= 9; i++) {
      if (i === 0 || i === 9) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + i * cellSize);
        ctx.lineTo(offsetX + 8 * cellSize, offsetY + i * cellSize);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + i * cellSize);
        ctx.lineTo(offsetX + 4 * cellSize, offsetY + i * cellSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(offsetX + 5 * cellSize, offsetY + i * cellSize);
        ctx.lineTo(offsetX + 8 * cellSize, offsetY + i * cellSize);
        ctx.stroke();
      }
    }

    const drawDiagonal = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    drawDiagonal(offsetX + 3 * cellSize, offsetY + 0 * cellSize, offsetX + 5 * cellSize, offsetY + 2 * cellSize);
    drawDiagonal(offsetX + 5 * cellSize, offsetY + 0 * cellSize, offsetX + 3 * cellSize, offsetY + 2 * cellSize);
    drawDiagonal(offsetX + 3 * cellSize, offsetY + 7 * cellSize, offsetX + 5 * cellSize, offsetY + 9 * cellSize);
    drawDiagonal(offsetX + 5 * cellSize, offsetY + 7 * cellSize, offsetX + 3 * cellSize, offsetY + 9 * cellSize);

    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillText('楚        河', offsetX + 1.5 * cellSize, offsetY + 4.5 * cellSize + 5);
    ctx.fillText('漢        界', offsetX + 5.5 * cellSize, offsetY + 4.5 * cellSize + 5);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    const palaceTop = 0;
    const palaceBottom = 2;
    for (let row of [palaceTop, palaceBottom]) {
      const startCol = 3;
      const endCol = 5;

      ctx.beginPath();
      ctx.moveTo(offsetX + startCol * cellSize, offsetY + row * cellSize);
      ctx.lineTo(offsetX + startCol * cellSize + cellSize / 6, offsetY + row * cellSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(offsetX + endCol * cellSize, offsetY + row * cellSize);
      ctx.lineTo(offsetX + endCol * cellSize - cellSize / 6, offsetY + row * cellSize);
      ctx.stroke();
    }

    const drawXMark = (col: number, row: number) => {
      const x = offsetX + col * cellSize;
      const y = offsetY + row * cellSize;
      const size = cellSize / 5;

      ctx.beginPath();
      ctx.moveTo(x - size, y - size);
      ctx.lineTo(x + size, y + size);
      ctx.moveTo(x + size, y - size);
      ctx.lineTo(x - size, y + size);
      ctx.stroke();
    };

    drawXMark(1, 2);
    drawXMark(7, 2);
    drawXMark(1, 7);
    drawXMark(7, 7);

    if (this.lastMove) {
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 3;

      const fromX = offsetX + this.lastMove.from.col * cellSize;
      const fromY = offsetY + this.lastMove.from.row * cellSize;
      const toX = offsetX + this.lastMove.to.col * cellSize;
      const toY = offsetY + this.lastMove.to.row * cellSize;

      ctx.strokeRect(fromX - PIECE_SIZE / 2 - 2, fromY - PIECE_SIZE / 2 - 2, PIECE_SIZE + 4, PIECE_SIZE + 4);
      ctx.strokeRect(toX - PIECE_SIZE / 2 - 2, toY - PIECE_SIZE / 2 - 2, PIECE_SIZE + 4, PIECE_SIZE + 4);
    }

    for (const move of this.validMoves) {
      const x = offsetX + move.col * cellSize;
      const y = offsetY + move.row * cellSize;

      ctx.fillStyle = 'rgba(100, 200, 100, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y, PIECE_SIZE / 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(50, 150, 50, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (const piece of this.pieces) {
      this.drawPiece(ctx, piece, offsetX, offsetY);
    }

    if (this.selectedPiece) {
      const x = offsetX + this.selectedPiece.y * cellSize;
      const y = offsetY + this.selectedPiece.x * cellSize;

      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - PIECE_SIZE / 2 - 2, y - PIECE_SIZE / 2 - 2, PIECE_SIZE + 4, PIECE_SIZE + 4);
    }
  }

  private drawPiece(ctx: CanvasRenderingContext2D, piece: Piece, offsetX: number, offsetY: number): void {
    const x = offsetX + piece.y * CELL_SIZE;
    const y = offsetY + piece.x * CELL_SIZE;
    const radius = PIECE_SIZE / 2;

    const gradient = ctx.createRadialGradient(
      x - radius / 3, y - radius / 3, 0,
      x, y, radius
    );

    if (piece.player === 'red') {
      gradient.addColorStop(0, '#ffcccc');
      gradient.addColorStop(1, '#cc0000');
    } else {
      gradient.addColorStop(0, '#dddddd');
      gradient.addColorStop(1, '#333333');
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = piece.player === 'red' ? '#8b0000' : '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = piece.player === 'red' ? '#cc0000' : '#000000';
    ctx.font = `bold ${PIECE_SIZE * 0.6}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const char = this.getPieceChar(piece.type);
    ctx.fillText(char, x, y + 2);
  }

  private getPieceChar(type: PieceType): string {
    const chars: Record<PieceType, string> = {
      rook: '車',
      horse: '馬',
      elephant: '象',
      advisor: '士',
      king: '將',
      cannon: '炮',
      pawn: '卒'
    };
    return chars[type];
  }
}
