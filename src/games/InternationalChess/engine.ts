export const INT_CHESS_CONSTANTS = {
  CANVAS_WIDTH: 560,
  CANVAS_HEIGHT: 560,
  BOARD_SIZE: 8,
  CELL_SIZE: 70,
  PIECE_SIZE: 56,
};

export const INT_CHESS_ENGINE_CONSTANTS = INT_CHESS_CONSTANTS;
export const INT_CHESS_CONSTANTS_2 = INT_CHESS_CONSTANTS;
export const INT_CHESS_CONSTANTS_3 = INT_CHESS_CONSTANTS;
export const INT_CHESS_ENGINE_CONSTANTS_2 = INT_CHESS_CONSTANTS;
export const INT_CHESS_ENGINE_CONSTANTS_3 = INT_CHESS_CONSTANTS;

export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type Player = 'white' | 'black';

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  type: PieceType;
  player: Player;
  row: number;
  col: number;
  hasMoved: boolean;
  id: string;
}

export interface IntChessState {
  pieces: Piece[];
  currentPlayer: Player;
  selectedPiece: Piece | null;
  validMoves: Position[];
  isGameOver: boolean;
  winner: Player | null;
  isCheck: boolean;
  lastMove: { from: Position; to: Position } | null;
  capturedPieces: { player: Player; type: PieceType }[];
  promotionPending: Position | null;
}

const PIECE_VALUES: Record<PieceType, number> = {
  king: 10000,
  queen: 900,
  rook: 500,
  bishop: 330,
  knight: 320,
  pawn: 100
};

export class IntChessEngine {
  private pieces: Piece[];
  private currentPlayer: Player;
  private selectedPiece: Piece | null;
  private validMoves: Position[];
  private isGameOver: boolean;
  private winner: Player | null;
  private isCheck: boolean;
  private lastMove: { from: Position; to: Position } | null;
  private capturedPieces: { player: Player; type: PieceType }[];
  private promotionPending: Position | null;
  private pieceIdCounter: number;

  constructor() {
    this.pieces = [];
    this.currentPlayer = 'white';
    this.selectedPiece = null;
    this.validMoves = [];
    this.isGameOver = false;
    this.winner = null;
    this.isCheck = false;
    this.lastMove = null;
    this.capturedPieces = [];
    this.promotionPending = null;
    this.pieceIdCounter = 0;
    this.init();
  }

  private init(): void {
    this.pieces = this.createInitialPieces();
    this.currentPlayer = 'white';
    this.selectedPiece = null;
    this.validMoves = [];
    this.isGameOver = false;
    this.winner = null;
    this.isCheck = false;
    this.lastMove = null;
    this.capturedPieces = [];
    this.promotionPending = null;
  }

  private createInitialPieces(): Piece[] {
    const pieces: Piece[] = [];

    for (let col = 0; col < 8; col++) {
      pieces.push({ type: 'pawn', player: 'black', row: 1, col, hasMoved: false, id: `black_pawn_${col}` });
      pieces.push({ type: 'pawn', player: 'white', row: 6, col, hasMoved: false, id: `white_pawn_${col}` });
    }

    const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    for (let col = 0; col < 8; col++) {
      pieces.push({ type: backRow[col], player: 'black', row: 0, col, hasMoved: false, id: `black_${backRow[col]}_${col}` });
      pieces.push({ type: backRow[col], player: 'white', row: 7, col, hasMoved: false, id: `white_${backRow[col]}_${col}` });
    }

    return pieces;
  }

  getState(): IntChessState {
    return {
      pieces: this.pieces.map(p => ({ ...p })),
      currentPlayer: this.currentPlayer,
      selectedPiece: this.selectedPiece ? { ...this.selectedPiece } : null,
      validMoves: [...this.validMoves],
      isGameOver: this.isGameOver,
      winner: this.winner,
      isCheck: this.isCheck,
      lastMove: this.lastMove ? { ...this.lastMove } : null,
      capturedPieces: [...this.capturedPieces],
      promotionPending: this.promotionPending ? { ...this.promotionPending } : null
    };
  }

  reset(): void {
    this.init();
  }

  getPieceAt(row: number, col: number): Piece | undefined {
    return this.pieces.find(p => p.row === row && p.col === col);
  }

  selectPiece(row: number, col: number): void {
    if (this.isGameOver || this.promotionPending) return;
    if (this.currentPlayer !== 'white') return;

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

  promotePawn(row: number, col: number, newType: PieceType): void {
    const piece = this.getPieceAt(row, col);
    if (!piece || piece.type !== 'pawn') return;
    if (row !== 0 && row !== 7) return;

    piece.type = newType;
    this.promotionPending = null;
  }

  private getValidMoves(piece: Piece): Position[] {
    const moves: Position[] = [];

    switch (piece.type) {
      case 'king':
        this.addKingMoves(piece, moves);
        break;
      case 'queen':
        this.addRookMoves(piece, moves);
        this.addBishopMoves(piece, moves);
        break;
      case 'rook':
        this.addRookMoves(piece, moves);
        break;
      case 'bishop':
        this.addBishopMoves(piece, moves);
        break;
      case 'knight':
        this.addKnightMoves(piece, moves);
        break;
      case 'pawn':
        this.addPawnMoves(piece, moves);
        break;
    }

    return moves.filter(pos => !this.wouldBeInCheck(piece, pos));
  }

  private addKingMoves(piece: Piece, moves: Position[]): void {
    const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    for (const [dr, dc] of directions) {
      const r = piece.row + dr;
      const c = piece.col + dc;
      if (!this.isInBoard(r, c)) continue;

      const target = this.getPieceAt(r, c);
      if (!target || target.player !== piece.player) {
        moves.push({ row: r, col: c });
      }
    }

    if (!piece.hasMoved && !this.isInCheckForPlayer(piece.player)) {
      const kingsideRook = this.getPieceAt(piece.row, 7);
      if (kingsideRook && kingsideRook.type === 'rook' && !kingsideRook.hasMoved) {
        const rookSideClear = !this.getPieceAt(piece.row, 5) && !this.getPieceAt(piece.row, 6);
        if (rookSideClear && !this.isSquareAttacked(piece.row, 5, piece.player) && !this.isSquareAttacked(piece.row, 6, piece.player)) {
          moves.push({ row: piece.row, col: 6 });
        }
      }

      const queensideRook = this.getPieceAt(piece.row, 0);
      if (queensideRook && queensideRook.type === 'rook' && !queensideRook.hasMoved) {
        const queenSideClear = !this.getPieceAt(piece.row, 1) && !this.getPieceAt(piece.row, 2) && !this.getPieceAt(piece.row, 3);
        if (queenSideClear && !this.isSquareAttacked(piece.row, 2, piece.player) && !this.isSquareAttacked(piece.row, 3, piece.player)) {
          moves.push({ row: piece.row, col: 2 });
        }
      }
    }
  }

  private addRookMoves(piece: Piece, moves: Position[]): void {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of directions) {
      let r = piece.row + dr;
      let c = piece.col + dc;

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

  private addBishopMoves(piece: Piece, moves: Position[]): void {
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    for (const [dr, dc] of directions) {
      let r = piece.row + dr;
      let c = piece.col + dc;

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

  private addKnightMoves(piece: Piece, moves: Position[]): void {
    const jumps = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

    for (const [dr, dc] of jumps) {
      const r = piece.row + dr;
      const c = piece.col + dc;
      if (!this.isInBoard(r, c)) continue;

      const target = this.getPieceAt(r, c);
      if (!target || target.player !== piece.player) {
        moves.push({ row: r, col: c });
      }
    }
  }

  private addPawnMoves(piece: Piece, moves: Position[]): void {
    const direction = piece.player === 'white' ? -1 : 1;
    const startRow = piece.player === 'white' ? 6 : 1;

    const forwardRow = piece.row + direction;
    if (this.isInBoard(forwardRow, piece.col) && !this.getPieceAt(forwardRow, piece.col)) {
      moves.push({ row: forwardRow, col: piece.col });

      if (piece.row === startRow) {
        const doubleForwardRow = piece.row + 2 * direction;
        if (!this.getPieceAt(doubleForwardRow, piece.col)) {
          moves.push({ row: doubleForwardRow, col: piece.col });
        }
      }
    }

    for (const dc of [-1, 1]) {
      const r = piece.row + direction;
      const c = piece.col + dc;
      if (!this.isInBoard(r, c)) continue;

      const target = this.getPieceAt(r, c);
      if (target && target.player !== piece.player) {
        moves.push({ row: r, col: c });
      }
    }
  }

  private isInBoard(row: number, col: number): boolean {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  private isValidMove(piece: Piece, target: Position): boolean {
    return this.validMoves.some(m => m.row === target.row && m.col === target.col);
  }

  private movePiece(piece: Piece, target: Position): void {
    const capturedPiece = this.getPieceAt(target.row, target.col);

    if (capturedPiece) {
      this.capturedPieces.push({ player: capturedPiece.player, type: capturedPiece.type });
      this.pieces = this.pieces.filter(p => p.id !== capturedPiece.id);

      if (capturedPiece.type === 'king') {
        this.isGameOver = true;
        this.winner = this.currentPlayer;
        this.selectedPiece = null;
        this.validMoves = [];
        return;
      }
    }

    const fromPos = { row: piece.row, col: piece.col };
    piece.row = target.row;
    piece.col = target.col;
    piece.hasMoved = true;
    this.lastMove = { from: fromPos, to: target };

    if (piece.type === 'pawn' && (piece.row === 0 || piece.row === 7)) {
      this.promotionPending = { row: piece.row, col: piece.col };
    }

    this.selectedPiece = null;
    this.validMoves = [];

    if (!this.isGameOver && !this.promotionPending) {
      this.finishTurn();
    }
  }

  private finishTurn(): void {
    this.isCheck = this.isInCheckForPlayer(this.currentPlayer);

    if (this.isInCheckmate(this.currentPlayer === 'white' ? 'black' : 'white')) {
      this.isGameOver = true;
      this.winner = this.currentPlayer;
      return;
    }

    if (this.isStalemate(this.currentPlayer === 'white' ? 'black' : 'white')) {
      this.isGameOver = true;
      this.winner = null;
      return;
    }

    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

    setTimeout(() => {
      this.aiMove();
    }, 500);
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
      if (this.isInCheckForPlayer('black')) {
        this.isGameOver = true;
        this.winner = 'white';
      }
      return;
    }

    let selectedMove: { piece: Piece; move: Position };

    const checkMoves = allMoves.filter(({ move }) => {
      const target = this.getPieceAt(move.row, move.col);
      return target && target.type === 'king' && target.player === 'white';
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
          return PIECE_VALUES[bTarget.type] - PIECE_VALUES[aTarget.type];
        });
        selectedMove = sortedCaptures[0];
      } else {
        const safeMoves = allMoves.filter(({ piece, move }) => {
          return !this.wouldBeInCheck(piece, move);
        });
        if (safeMoves.length > 0) {
          selectedMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
        } else {
          selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        }
      }
    }

    const fromPos = { row: selectedMove.piece.row, col: selectedMove.piece.col };
    const capturedPiece = this.getPieceAt(selectedMove.move.row, selectedMove.move.col);

    if (capturedPiece) {
      this.capturedPieces.push({ player: capturedPiece.player, type: capturedPiece.type });
      this.pieces = this.pieces.filter(p => p.id !== capturedPiece.id);
    }

    selectedMove.piece.row = selectedMove.move.row;
    selectedMove.piece.col = selectedMove.move.col;
    selectedMove.piece.hasMoved = true;
    this.lastMove = { from: fromPos, to: selectedMove.move };

    if (selectedMove.piece.type === 'pawn' && (selectedMove.piece.row === 0 || selectedMove.piece.row === 7)) {
      selectedMove.piece.type = 'queen';
    }

    this.finishTurn();
  }

  private getValidMovesForAI(piece: Piece): Position[] {
    const moves: Position[] = [];

    switch (piece.type) {
      case 'king':
        this.addKingMoves(piece, moves);
        break;
      case 'queen':
        this.addRookMoves(piece, moves);
        this.addBishopMoves(piece, moves);
        break;
      case 'rook':
        this.addRookMoves(piece, moves);
        break;
      case 'bishop':
        this.addBishopMoves(piece, moves);
        break;
      case 'knight':
        this.addKnightMoves(piece, moves);
        break;
      case 'pawn':
        this.addPawnMoves(piece, moves);
        break;
    }

    return moves.filter(pos => !this.wouldBeInCheck(piece, pos));
  }

  private findKing(player: Player): Piece | undefined {
    return this.pieces.find(p => p.type === 'king' && p.player === player);
  }

  private isInCheckForPlayer(player: Player): boolean {
    const king = this.findKing(player);
    if (!king) return false;

    return this.isSquareAttacked(king.row, king.col, player);
  }

  private isSquareAttacked(row: number, col: number, player: Player): boolean {
    const enemyPlayer = player === 'white' ? 'black' : 'white';
    const enemyPieces = this.pieces.filter(p => p.player === enemyPlayer);

    for (const piece of enemyPieces) {
      if (piece.type === 'pawn') {
        const direction = piece.player === 'black' ? 1 : -1;
        const attackRow = piece.row + direction;
        if (attackRow === row && (piece.col - 1 === col || piece.col + 1 === col)) {
          return true;
        }
      } else if (piece.type === 'knight') {
        const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        for (const [dr, dc] of knightMoves) {
          if (piece.row + dr === row && piece.col + dc === col) {
            return true;
          }
        }
      } else if (piece.type === 'king') {
        const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        for (const [dr, dc] of kingMoves) {
          if (piece.row + dr === row && piece.col + dc === col) {
            return true;
          }
        }
      } else {
        const moves = this.getValidMovesForAI(piece);
        if (moves.some(m => m.row === row && m.col === col)) {
          return true;
        }
      }
    }

    return false;
  }

  private wouldBeInCheck(piece: Piece, target: Position): boolean {
    const originalRow = piece.row;
    const originalCol = piece.col;
    const capturedPiece = this.getPieceAt(target.row, target.col);

    piece.row = target.row;
    piece.col = target.col;

    if (capturedPiece) {
      this.pieces = this.pieces.filter(p => p.id !== capturedPiece.id);
    }

    const inCheck = this.isInCheckForPlayer(piece.player);

    piece.row = originalRow;
    piece.col = originalCol;

    if (capturedPiece) {
      this.pieces.push(capturedPiece);
    }

    return inCheck;
  }

  private isCheckmate(player: Player): boolean {
    if (!this.isInCheckForPlayer(player)) return false;
    return this.hasNoLegalMoves(player);
  }

  private isStalemate(player: Player): boolean {
    if (this.isInCheckForPlayer(player)) return false;
    return this.hasNoLegalMoves(player);
  }

  private hasNoLegalMoves(player: Player): boolean {
    const playerPieces = this.pieces.filter(p => p.player === player);
    for (const piece of playerPieces) {
      const moves = this.getValidMovesForAI(piece);
      if (moves.length > 0) return false;
    }
    return true;
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.drawBoard(ctx);
    this.drawLastMove(ctx);
    this.drawValidMoves(ctx);
    this.drawPieces(ctx);
    this.drawCheck(ctx);
    this.drawPromotionUI(ctx);
  }

  private drawBoard(ctx: CanvasRenderingContext2D): void {
    const cellSize = 70;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        ctx.fillStyle = isLight ? '#f0d9b5' : '#b58863';
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }

    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    for (let col = 0; col < 8; col++) {
      ctx.fillText(String.fromCharCode(97 + col), col * cellSize + 4, 12);
      ctx.fillText(String.fromCharCode(97 + col), col * cellSize + 4, 8 * cellSize - 4);
    }
    for (let row = 0; row < 8; row++) {
      ctx.fillText((8 - row).toString(), 4, row * cellSize + 16);
      ctx.fillText((8 - row).toString(), 8 * cellSize - 12, row * cellSize + 16);
    }
  }

  private drawLastMove(ctx: CanvasRenderingContext2D): void {
    if (!this.lastMove) return;

    const cellSize = 70;
    ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';

    ctx.fillRect(this.lastMove.from.col * cellSize, this.lastMove.from.row * cellSize, cellSize, cellSize);
    ctx.fillRect(this.lastMove.to.col * cellSize, this.lastMove.to.row * cellSize, cellSize, cellSize);
  }

  private drawValidMoves(ctx: CanvasRenderingContext2D): void {
    const cellSize = 70;

    for (const move of this.validMoves) {
      const x = move.col * cellSize + cellSize / 2;
      const y = move.row * cellSize + cellSize / 2;

      const target = this.getPieceAt(move.row, move.col);
      if (target) {
        ctx.strokeStyle = '#00ff00';
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
    const cellSize = 70;

    for (const piece of this.pieces) {
      const x = piece.col * cellSize + cellSize / 2;
      const y = piece.row * cellSize + cellSize / 2;
      const radius = 28;

      if (this.selectedPiece && this.selectedPiece.id === piece.id) {
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 15;
      }

      ctx.font = `bold 48px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const symbol = this.getPieceSymbol(piece);
      ctx.fillStyle = piece.player === 'white' ? '#ffffff' : '#000000';
      ctx.fillText(symbol, x, y + 2);

      ctx.shadowBlur = 0;
    }
  }

  private getPieceSymbol(piece: Piece): string {
    const symbols: Record<PieceType, string> = {
      king: piece.player === 'white' ? '♔' : '♚',
      queen: piece.player === 'white' ? '♕' : '♛',
      rook: piece.player === 'white' ? '♖' : '♜',
      bishop: piece.player === 'white' ? '♗' : '♝',
      knight: piece.player === 'white' ? '♘' : '♞',
      pawn: piece.player === 'white' ? '♙' : '♟'
    };
    return symbols[piece.type];
  }

  private drawCheck(ctx: CanvasRenderingContext2D): void {
    if (!this.isCheck) return;

    const king = this.findKing(this.currentPlayer);
    if (!king) return;

    const cellSize = 70;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(king.col * cellSize, king.row * cellSize, cellSize, cellSize);
  }

  private drawPromotionUI(ctx: CanvasRenderingContext2D): void {
    if (!this.promotionPending) return;

    const cellSize = 70;
    const x = this.promotionPending.col * cellSize;
    const y = this.promotionPending.row * cellSize;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x, y, cellSize, cellSize * 4);

    const pieces: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];
    pieces.forEach((type, i) => {
      const py = y + i * cellSize + cellSize / 2;
      ctx.font = 'bold 40px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(this.getPieceSymbolByType(type), x + cellSize / 2, py);
    });
  }

  private getPieceSymbolByType(type: PieceType): string {
    const symbols: Record<PieceType, string> = {
      king: '♔',
      queen: '♕',
      rook: '♖',
      bishop: '♗',
      knight: '♘',
      pawn: '♙'
    };
    return symbols[type];
  }
}
