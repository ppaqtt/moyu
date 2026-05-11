import { CHESS_AI_CONSTANTS } from '../../utils/constants';

const { GRID_COLS, GRID_ROWS, CELL_SIZE } = CHESS_AI_CONSTANTS;

export type Player = 'white' | 'black';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  type: PieceType;
  player: Player;
  position: Position;
  hasMoved?: boolean;
}

export interface GameState {
  board: (Piece | null)[][];
  currentPlayer: Player;
  isGameOver: boolean;
  winner: Player | null;
  selectedPiece: Piece | null;
  difficulty: Difficulty;
  check: boolean;
  checkmate: boolean;
}

type Move = {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  score?: number;
  isEnPassant?: boolean;
  isCastle?: boolean;
};

export class ChessAIEngine {
  private board: (Piece | null)[][];
  private currentPlayer: Player;
  private isGameOver: boolean;
  private winner: Player | null;
  private selectedPiece: Piece | null;
  private difficulty: Difficulty;
  private check: boolean;
  private checkmate: boolean;
  private enPassantTarget: Position | null;

  constructor(difficulty: Difficulty = 'medium') {
    this.board = this.createEmptyBoard();
    this.currentPlayer = 'white';
    this.isGameOver = false;
    this.winner = null;
    this.selectedPiece = null;
    this.difficulty = difficulty;
    this.check = false;
    this.checkmate = false;
    this.enPassantTarget = null;
    this.initializePieces();
  }

  private createEmptyBoard(): (Piece | null)[][] {
    return Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));
  }

  private initializePieces(): void {
    // 黑方棋子
    const blackBackRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    for (let col = 0; col < 8; col++) {
      this.board[0][col] = { type: blackBackRow[col], player: 'black', position: { row: 0, col }, hasMoved: false };
      this.board[1][col] = { type: 'pawn', player: 'black', position: { row: 1, col }, hasMoved: false };
    }

    // 白方棋子
    const whiteBackRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    for (let col = 0; col < 8; col++) {
      this.board[7][col] = { type: whiteBackRow[col], player: 'white', position: { row: 7, col }, hasMoved: false };
      this.board[6][col] = { type: 'pawn', player: 'white', position: { row: 6, col }, hasMoved: false };
    }
  }

  getState(): GameState {
    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      isGameOver: this.isGameOver,
      winner: this.winner,
      selectedPiece: this.selectedPiece,
      difficulty: this.difficulty,
      check: this.check,
      checkmate: this.checkmate,
    };
  }

  reset(difficulty?: Difficulty): void {
    this.board = this.createEmptyBoard();
    this.currentPlayer = 'white';
    this.isGameOver = false;
    this.winner = null;
    this.selectedPiece = null;
    if (difficulty) {
      this.difficulty = difficulty;
    }
    this.check = false;
    this.checkmate = false;
    this.enPassantTarget = null;
    this.initializePieces();
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
  }

  isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS;
  }

  getValidMoves(piece: Piece, includeKingSafeCheck: boolean = true): Position[] {
    const moves: Position[] = [];
    const { row, col } = piece.position;

    switch (piece.type) {
      case 'pawn':
        moves.push(...this.getPawnMoves(piece));
        break;
      case 'rook':
        moves.push(...this.getRookMoves(piece));
        break;
      case 'knight':
        moves.push(...this.getKnightMoves(piece));
        break;
      case 'bishop':
        moves.push(...this.getBishopMoves(piece));
        break;
      case 'queen':
        moves.push(...this.getQueenMoves(piece));
        break;
      case 'king':
        moves.push(...this.getKingMoves(piece));
        break;
    }

    if (includeKingSafeCheck) {
      return moves.filter(move => this.isMoveSafe(piece, move));
    }

    return moves;
  }

  private getPawnMoves(piece: Piece): Position[] {
    const moves: Position[] = [];
    const { row, col } = piece.position;
    const direction = piece.player === 'white' ? -1 : 1;
    const startRow = piece.player === 'white' ? 6 : 1;

    // 向前一步
    const newRow = row + direction;
    if (this.isValidPosition(newRow, col) && !this.board[newRow][col]) {
      moves.push({ row: newRow, col });

      // 向前两步（从起始位置）
      if (row === startRow && !this.board[row + 2 * direction][col]) {
        moves.push({ row: row + 2 * direction, col });
      }
    }

    // 吃子（斜向）
    for (const dc of [-1, 1]) {
      const newCol = col + dc;
      if (this.isValidPosition(newRow, newCol)) {
        const target = this.board[newRow][newCol];
        if (target && target.player !== piece.player) {
          moves.push({ row: newRow, col: newCol });
        }

        // 吃过路兵
        if (this.enPassantTarget && this.enPassantTarget.row === newRow && this.enPassantTarget.col === newCol) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    return moves;
  }

  private getRookMoves(piece: Piece): Position[] {
    const moves: Position[] = [];
    const { row, col } = piece.position;
    const directions = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
    ];

    for (const { dr, dc } of directions) {
      let newRow = row + dr;
      let newCol = col + dc;

      while (this.isValidPosition(newRow, newCol)) {
        const target = this.board[newRow][newCol];
        if (!target) {
          moves.push({ row: newRow, col: newCol });
        } else {
          if (target.player !== piece.player) {
            moves.push({ row: newRow, col: newCol });
          }
          break;
        }
        newRow += dr;
        newCol += dc;
      }
    }

    return moves;
  }

  private getKnightMoves(piece: Piece): Position[] {
    const moves: Position[] = [];
    const { row, col } = piece.position;
    const directions = [
      { dr: -2, dc: -1 },
      { dr: -2, dc: 1 },
      { dr: -1, dc: -2 },
      { dr: -1, dc: 2 },
      { dr: 1, dc: -2 },
      { dr: 1, dc: 2 },
      { dr: 2, dc: -1 },
      { dr: 2, dc: 1 },
    ];

    for (const { dr, dc } of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (this.isValidPosition(newRow, newCol)) {
        const target = this.board[newRow][newCol];
        if (!target || target.player !== piece.player) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    return moves;
  }

  private getBishopMoves(piece: Piece): Position[] {
    const moves: Position[] = [];
    const { row, col } = piece.position;
    const directions = [
      { dr: -1, dc: -1 },
      { dr: -1, dc: 1 },
      { dr: 1, dc: -1 },
      { dr: 1, dc: 1 },
    ];

    for (const { dr, dc } of directions) {
      let newRow = row + dr;
      let newCol = col + dc;

      while (this.isValidPosition(newRow, newCol)) {
        const target = this.board[newRow][newCol];
        if (!target) {
          moves.push({ row: newRow, col: newCol });
        } else {
          if (target.player !== piece.player) {
            moves.push({ row: newRow, col: newCol });
          }
          break;
        }
        newRow += dr;
        newCol += dc;
      }
    }

    return moves;
  }

  private getQueenMoves(piece: Piece): Position[] {
    return [...this.getRookMoves(piece), ...this.getBishopMoves(piece)];
  }

  private getKingMoves(piece: Piece): Position[] {
    const moves: Position[] = [];
    const { row, col } = piece.position;
    const directions = [
      { dr: -1, dc: -1 },
      { dr: -1, dc: 0 },
      { dr: -1, dc: 1 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
      { dr: 1, dc: -1 },
      { dr: 1, dc: 0 },
      { dr: 1, dc: 1 },
    ];

    for (const { dr, dc } of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (this.isValidPosition(newRow, newCol)) {
        const target = this.board[newRow][newCol];
        if (!target || target.player !== piece.player) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    // 王车易位
    if (!piece.hasMoved && !this.isInCheck(piece.player)) {
      // 短易位
      const rookShort = this.board[row][7];
      if (rookShort && rookShort.type === 'rook' && !rookShort.hasMoved) {
        if (!this.board[row][5] && !this.board[row][6]) {
          if (!this.isPositionAttacked(row, 5, piece.player) && !this.isPositionAttacked(row, 6, piece.player)) {
            moves.push({ row, col: 6 });
          }
        }
      }

      // 长易位
      const rookLong = this.board[row][0];
      if (rookLong && rookLong.type === 'rook' && !rookLong.hasMoved) {
        if (!this.board[row][1] && !this.board[row][2] && !this.board[row][3]) {
          if (!this.isPositionAttacked(row, 2, piece.player) && !this.isPositionAttacked(row, 3, piece.player)) {
            moves.push({ row, col: 2 });
          }
        }
      }
    }

    return moves;
  }

  private isPositionAttacked(row: number, col: number, byPlayer: Player): boolean {
    const attacker: Player = byPlayer === 'white' ? 'black' : 'white';
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && piece.player === attacker) {
          const moves = this.getValidMoves(piece, false);
          if (moves.some(m => m.row === row && m.col === col)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private isInCheck(player: Player): boolean {
    // 找到国王的位置
    let kingPosition: Position | null = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && piece.type === 'king' && piece.player === player) {
          kingPosition = { row: r, col: c };
          break;
        }
      }
    }

    if (!kingPosition) return false;

    return this.isPositionAttacked(kingPosition.row, kingPosition.col, player);
  }

  private isMoveSafe(piece: Piece, to: Position): boolean {
    // 模拟移动
    const from = piece.position;
    const originalPiece = this.board[to.row][to.col];
    this.board[to.row][to.col] = { ...piece, position: to };
    this.board[from.row][from.col] = null;

    // 检查是否将军
    const safe = !this.isInCheck(piece.player);

    // 恢复
    this.board[from.row][from.col] = { ...piece, position: from };
    this.board[to.row][to.col] = originalPiece;

    return safe;
  }

  selectPiece(row: number, col: number): boolean {
    const piece = this.board[row][col];
    if (piece && piece.player === this.currentPlayer) {
      this.selectedPiece = piece;
      return true;
    }
    this.selectedPiece = null;
    return false;
  }

  makeMove(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const piece = this.board[fromRow][fromCol];
    if (!piece || piece.player !== this.currentPlayer) return false;

    const validMoves = this.getValidMoves(piece);
    const isValidMove = validMoves.some(m => m.row === toRow && m.col === toCol);
    if (!isValidMove) return false;

    // 检查王车易位
    if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
      // 短易位
      if (toCol > fromCol) {
        this.board[toRow][5] = this.board[toRow][7];
        this.board[toRow][5]!.position = { row: toRow, col: 5 };
        this.board[toRow][7] = null;
      } else {
        // 长易位
        this.board[toRow][3] = this.board[toRow][0];
        this.board[toRow][3]!.position = { row: toRow, col: 3 };
        this.board[toRow][0] = null;
      }
    }

    // 检查吃过路兵
    if (piece.type === 'pawn' && this.enPassantTarget && 
        toRow === this.enPassantTarget.row && toCol === this.enPassantTarget.col) {
      const captureRow = piece.player === 'white' ? toRow + 1 : toRow - 1;
      this.board[captureRow][toCol] = null;
    }

    // 设置过路兵目标
    if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
      this.enPassantTarget = { 
        row: (fromRow + toRow) / 2, 
        col: toCol 
      };
    } else {
      this.enPassantTarget = null;
    }

    // 执行移动
    const capturedPiece = this.board[toRow][toCol];
    this.board[toRow][toCol] = { ...piece, position: { row: toRow, col: toCol }, hasMoved: true };
    this.board[fromRow][fromCol] = null;
    this.selectedPiece = null;

    // 检查升变
    if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
      this.board[toRow][toCol]!.type = 'queen';
    }

    // 切换玩家
    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

    // 检查将军和将死
    this.check = this.isInCheck(this.currentPlayer);
    
    // 检查是否有合法移动
    let hasLegalMoves = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.player === this.currentPlayer) {
          const moves = this.getValidMoves(p);
          if (moves.length > 0) {
            hasLegalMoves = true;
            break;
          }
        }
      }
      if (hasLegalMoves) break;
    }

    if (!hasLegalMoves) {
      this.isGameOver = true;
      if (this.check) {
        this.checkmate = true;
        this.winner = this.currentPlayer === 'white' ? 'black' : 'white';
      }
    }

    return true;
  }

  async makeAIMove(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.isGameOver || this.currentPlayer !== 'black') {
          resolve(false);
          return;
        }

        const move = this.findBestMove();
        if (move) {
          this.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
          resolve(true);
        } else {
          resolve(false);
        }
      }, this.difficulty === 'hard' ? 1000 : this.difficulty === 'medium' ? 600 : 400);
    });
  }

  private findBestMove(): Move | null {
    const allMoves = this.getAllPossibleMoves('black');
    if (allMoves.length === 0) return null;

    // 简单评估函数
    for (const move of allMoves) {
      move.score = this.evaluateMove(move);
    }

    allMoves.sort((a, b) => (b.score || 0) - (a.score || 0));

    let selectedIndex = 0;
    switch (this.difficulty) {
      case 'easy':
        selectedIndex = Math.floor(Math.random() * Math.min(5, allMoves.length));
        break;
      case 'medium':
        selectedIndex = Math.random() < 0.3 ? Math.floor(Math.random() * Math.min(3, allMoves.length)) : 0;
        break;
      case 'hard':
        selectedIndex = 0;
        break;
    }

    return allMoves[selectedIndex];
  }

  private getAllPossibleMoves(player: Player): Move[] {
    const moves: Move[] = [];

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const piece = this.board[row][col];
        if (piece && piece.player === player) {
          const validMoves = this.getValidMoves(piece);
          for (const to of validMoves) {
            const captured = this.board[to.row][to.col];
            moves.push({
              from: { row, col },
              to,
              piece,
              captured,
            });
          }
        }
      }
    }

    return moves;
  }

  private evaluateMove(move: Move): number {
    let score = 0;

    // 棋子价值
    const pieceValues: Record<PieceType, number> = {
      pawn: 100,
      knight: 320,
      bishop: 330,
      rook: 500,
      queen: 900,
      king: 20000,
    };

    // 吃掉对方棋子的分数
    if (move.captured) {
      score += pieceValues[move.captured.type];
    }

    // 位置权重（中心位置更好）
    const centerBonus = Math.abs(move.to.col - 3.5) + Math.abs(move.to.row - 3.5);
    score += (3.5 - centerBonus) * 10;

    // 攻击位置加分
    if (move.piece.type === 'queen' || move.piece.type === 'rook' || move.piece.type === 'bishop') {
      score += 20;
    }

    // 检查是否将军
    // 模拟移动
    const from = move.piece.position;
    const originalPiece = this.board[move.to.row][move.to.col];
    this.board[move.to.row][move.to.col] = { ...move.piece, position: move.to };
    this.board[from.row][from.col] = null;

    if (this.isInCheck(move.piece.player === 'white' ? 'black' : 'white')) {
      score += 50;
    }

    // 恢复
    this.board[from.row][from.col] = { ...move.piece, position: from };
    this.board[move.to.row][move.to.col] = originalPiece;

    return score;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const width = GRID_COLS * CELL_SIZE;
    const height = GRID_ROWS * CELL_SIZE;

    // 画棋盘
    this.drawBoard(ctx);
    
    // 画棋子
    this.drawPieces(ctx);

    // 画选中效果
    if (this.selectedPiece) {
      this.drawSelection(ctx, this.selectedPiece.position);
      const validMoves = this.getValidMoves(this.selectedPiece);
      for (const move of validMoves) {
        this.drawMoveIndicator(ctx, move);
      }
    }
  }

  private drawBoard(ctx: CanvasRenderingContext2D): void {
    const lightColor = '#f0d9b5';
    const darkColor = '#b58863';

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        ctx.fillStyle = isLight ? lightColor : darkColor;
        ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  private drawPieces(ctx: CanvasRenderingContext2D): void {
    const pieceSymbols: Record<PieceType, string> = {
      king: '♔',
      queen: '♕',
      rook: '♖',
      bishop: '♗',
      knight: '♘',
      pawn: '♙',
    };

    const blackPieceSymbols: Record<PieceType, string> = {
      king: '♚',
      queen: '♛',
      rook: '♜',
      bishop: '♝',
      knight: '♞',
      pawn: '♟',
    };

    ctx.font = `${CELL_SIZE * 0.7}px Arial Unicode MS, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece) {
          const x = col * CELL_SIZE + CELL_SIZE / 2;
          const y = row * CELL_SIZE + CELL_SIZE / 2;

          ctx.fillStyle = piece.player === 'white' ? '#fff' : '#000';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;

          const symbol = piece.player === 'white' ? pieceSymbols[piece.type] : blackPieceSymbols[piece.type];
          
          // 添加阴影效果
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          ctx.fillText(symbol, x, y);
          
          // 重置阴影
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
      }
    }
  }

  private drawSelection(ctx: CanvasRenderingContext2D, pos: Position): void {
    ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
    ctx.fillRect(pos.col * CELL_SIZE, pos.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }

  private drawMoveIndicator(ctx: CanvasRenderingContext2D, pos: Position): void {
    const x = pos.col * CELL_SIZE + CELL_SIZE / 2;
    const y = pos.row * CELL_SIZE + CELL_SIZE / 2;
    const radius = CELL_SIZE * 0.15;

    // 检查目标位置是否有棋子
    const hasPiece = this.board[pos.row][pos.col] !== null;

    if (hasPiece) {
      // 画红色方框
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.lineWidth = 4;
      ctx.strokeRect(
        pos.col * CELL_SIZE + 4,
        pos.row * CELL_SIZE + 4,
        CELL_SIZE - 8,
        CELL_SIZE - 8
      );
    } else {
      // 画绿色圆点
      ctx.fillStyle = 'rgba(76, 175, 80, 0.7)';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
