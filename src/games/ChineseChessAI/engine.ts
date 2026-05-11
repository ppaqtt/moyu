import { CHINESE_CHESS_AI_CONSTANTS } from '../../utils/constants';

const { GRID_COLS, GRID_ROWS, CELL_SIZE } = CHINESE_CHESS_AI_CONSTANTS;

export type Player = 'red' | 'black';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type PieceType = 'general' | 'advisor' | 'elephant' | 'horse' | 'chariot' | 'cannon' | 'soldier';

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  type: PieceType;
  player: Player;
  position: Position;
}

export interface GameState {
  board: (Piece | null)[][];
  currentPlayer: Player;
  isGameOver: boolean;
  winner: Player | null;
  selectedPiece: Piece | null;
  difficulty: Difficulty;
}

type Move = {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  score?: number;
};

export class ChineseChessAIEngine {
  private board: (Piece | null)[][];
  private currentPlayer: Player;
  private isGameOver: boolean;
  private winner: Player | null;
  private selectedPiece: Piece | null;
  private difficulty: Difficulty;

  constructor(difficulty: Difficulty = 'medium') {
    this.board = this.createEmptyBoard();
    this.currentPlayer = 'red';
    this.isGameOver = false;
    this.winner = null;
    this.selectedPiece = null;
    this.difficulty = difficulty;
    this.initializePieces();
  }

  private createEmptyBoard(): (Piece | null)[][] {
    return Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));
  }

  private initializePieces(): void {
    // 黑方棋子（上）
    this.board[0][0] = { type: 'chariot', player: 'black', position: { row: 0, col: 0 } };
    this.board[0][1] = { type: 'horse', player: 'black', position: { row: 0, col: 1 } };
    this.board[0][2] = { type: 'elephant', player: 'black', position: { row: 0, col: 2 } };
    this.board[0][3] = { type: 'advisor', player: 'black', position: { row: 0, col: 3 } };
    this.board[0][4] = { type: 'general', player: 'black', position: { row: 0, col: 4 } };
    this.board[0][5] = { type: 'advisor', player: 'black', position: { row: 0, col: 5 } };
    this.board[0][6] = { type: 'elephant', player: 'black', position: { row: 0, col: 6 } };
    this.board[0][7] = { type: 'horse', player: 'black', position: { row: 0, col: 7 } };
    this.board[0][8] = { type: 'chariot', player: 'black', position: { row: 0, col: 8 } };
    this.board[2][1] = { type: 'cannon', player: 'black', position: { row: 2, col: 1 } };
    this.board[2][7] = { type: 'cannon', player: 'black', position: { row: 2, col: 7 } };
    this.board[3][0] = { type: 'soldier', player: 'black', position: { row: 3, col: 0 } };
    this.board[3][2] = { type: 'soldier', player: 'black', position: { row: 3, col: 2 } };
    this.board[3][4] = { type: 'soldier', player: 'black', position: { row: 3, col: 4 } };
    this.board[3][6] = { type: 'soldier', player: 'black', position: { row: 3, col: 6 } };
    this.board[3][8] = { type: 'soldier', player: 'black', position: { row: 3, col: 8 } };

    // 红方棋子（下）
    this.board[9][0] = { type: 'chariot', player: 'red', position: { row: 9, col: 0 } };
    this.board[9][1] = { type: 'horse', player: 'red', position: { row: 9, col: 1 } };
    this.board[9][2] = { type: 'elephant', player: 'red', position: { row: 9, col: 2 } };
    this.board[9][3] = { type: 'advisor', player: 'red', position: { row: 9, col: 3 } };
    this.board[9][4] = { type: 'general', player: 'red', position: { row: 9, col: 4 } };
    this.board[9][5] = { type: 'advisor', player: 'red', position: { row: 9, col: 5 } };
    this.board[9][6] = { type: 'elephant', player: 'red', position: { row: 9, col: 6 } };
    this.board[9][7] = { type: 'horse', player: 'red', position: { row: 9, col: 7 } };
    this.board[9][8] = { type: 'chariot', player: 'red', position: { row: 9, col: 8 } };
    this.board[7][1] = { type: 'cannon', player: 'red', position: { row: 7, col: 1 } };
    this.board[7][7] = { type: 'cannon', player: 'red', position: { row: 7, col: 7 } };
    this.board[6][0] = { type: 'soldier', player: 'red', position: { row: 6, col: 0 } };
    this.board[6][2] = { type: 'soldier', player: 'red', position: { row: 6, col: 2 } };
    this.board[6][4] = { type: 'soldier', player: 'red', position: { row: 6, col: 4 } };
    this.board[6][6] = { type: 'soldier', player: 'red', position: { row: 6, col: 6 } };
    this.board[6][8] = { type: 'soldier', player: 'red', position: { row: 6, col: 8 } };
  }

  getState(): GameState {
    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      isGameOver: this.isGameOver,
      winner: this.winner,
      selectedPiece: this.selectedPiece,
      difficulty: this.difficulty,
    };
  }

  reset(difficulty?: Difficulty): void {
    this.board = this.createEmptyBoard();
    this.currentPlayer = 'red';
    this.isGameOver = false;
    this.winner = null;
    this.selectedPiece = null;
    if (difficulty) {
      this.difficulty = difficulty;
    }
    this.initializePieces();
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
  }

  isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS;
  }

  private isInPalace(row: number, col: number, player: Player): boolean {
    if (player === 'red') {
      return row >= 7 && row <= 9 && col >= 3 && col <= 5;
    } else {
      return row >= 0 && row <= 2 && col >= 3 && col <= 5;
    }
  }

  private isInOwnSide(row: number, player: Player): boolean {
    if (player === 'red') {
      return row >= 5;
    } else {
      return row <= 4;
    }
  }

  getValidMoves(piece: Piece): Position[] {
    const moves: Position[] = [];
    const { row, col } = piece.position;

    switch (piece.type) {
      case 'general':
        moves.push(...this.getGeneralMoves(piece));
        break;
      case 'advisor':
        moves.push(...this.getAdvisorMoves(piece));
        break;
      case 'elephant':
        moves.push(...this.getElephantMoves(piece));
        break;
      case 'horse':
        moves.push(...this.getHorseMoves(piece));
        break;
      case 'chariot':
        moves.push(...this.getChariotMoves(piece));
        break;
      case 'cannon':
        moves.push(...this.getCannonMoves(piece));
        break;
      case 'soldier':
        moves.push(...this.getSoldierMoves(piece));
        break;
    }

    return moves;
  }

  private getGeneralMoves(piece: Piece): Position[] {
    const moves: Position[] = [];
    const { row, col } = piece.position;
    const directions = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
    ];

    for (const { dr, dc } of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (this.isInPalace(newRow, newCol, piece.player)) {
        const target = this.board[newRow][newCol];
        if (!target || target.player !== piece.player) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    // 检查将帅对面
    const enemyPlayer = piece.player === 'red' ? 'black' : 'red';
    let checkRow = piece.player === 'red' ? row - 1 : row + 1;
    while (this.isValidPosition(checkRow, col)) {
      const target = this.board[checkRow][col];
      if (target) {
        if (target.type === 'general' && target.player === enemyPlayer) {
          moves.push({ row: checkRow, col: col });
        }
        break;
      }
      checkRow += piece.player === 'red' ? -1 : 1;
    }

    return moves;
  }

  private getAdvisorMoves(piece: Piece): Position[] {
    const moves: Position[] = [];
    const { row, col } = piece.position;
    const directions = [
      { dr: -1, dc: -1 },
      { dr: -1, dc: 1 },
      { dr: 1, dc: -1 },
      { dr: 1, dc: 1 },
    ];

    for (const { dr, dc } of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (this.isInPalace(newRow, newCol, piece.player)) {
        const target = this.board[newRow][newCol];
        if (!target || target.player !== piece.player) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    return moves;
  }

  private getElephantMoves(piece: Piece): Position[] {
    const moves: Position[] = [];
    const { row, col } = piece.position;
    const directions = [
      { dr: -2, dc: -2, blockDr: -1, blockDc: -1 },
      { dr: -2, dc: 2, blockDr: -1, blockDc: 1 },
      { dr: 2, dc: -2, blockDr: 1, blockDc: -1 },
      { dr: 2, dc: 2, blockDr: 1, blockDc: 1 },
    ];

    for (const { dr, dc, blockDr, blockDc } of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      const blockRow = row + blockDr;
      const blockCol = col + blockDc;

      if (
        this.isValidPosition(newRow, newCol) &&
        this.isInOwnSide(newRow, piece.player) &&
        !this.board[blockRow][blockCol]
      ) {
        const target = this.board[newRow][newCol];
        if (!target || target.player !== piece.player) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    return moves;
  }

  private getHorseMoves(piece: Piece): Position[] {
    const moves: Position[] = [];
    const { row, col } = piece.position;
    const directions = [
      { dr: -2, dc: -1, blockDr: -1, blockDc: 0 },
      { dr: -2, dc: 1, blockDr: -1, blockDc: 0 },
      { dr: 2, dc: -1, blockDr: 1, blockDc: 0 },
      { dr: 2, dc: 1, blockDr: 1, blockDc: 0 },
      { dr: -1, dc: -2, blockDr: 0, blockDc: -1 },
      { dr: 1, dc: -2, blockDr: 0, blockDc: -1 },
      { dr: -1, dc: 2, blockDr: 0, blockDc: 1 },
      { dr: 1, dc: 2, blockDr: 0, blockDc: 1 },
    ];

    for (const { dr, dc, blockDr, blockDc } of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      const blockRow = row + blockDr;
      const blockCol = col + blockDc;

      if (this.isValidPosition(newRow, newCol) && !this.board[blockRow][blockCol]) {
        const target = this.board[newRow][newCol];
        if (!target || target.player !== piece.player) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    return moves;
  }

  private getChariotMoves(piece: Piece): Position[] {
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

  private getCannonMoves(piece: Piece): Position[] {
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
      let jumped = false;

      while (this.isValidPosition(newRow, newCol)) {
        const target = this.board[newRow][newCol];
        if (!jumped) {
          if (!target) {
            moves.push({ row: newRow, col: newCol });
          } else {
            jumped = true;
          }
        } else {
          if (target) {
            if (target.player !== piece.player) {
              moves.push({ row: newRow, col: newCol });
            }
            break;
          }
        }
        newRow += dr;
        newCol += dc;
      }
    }

    return moves;
  }

  private getSoldierMoves(piece: Piece): Position[] {
    const moves: Position[] = [];
    const { row, col } = piece.position;
    const isRed = piece.player === 'red';
    const forward = isRed ? -1 : 1;

    // 前进
    const newRow = row + forward;
    if (this.isValidPosition(newRow, col)) {
      const target = this.board[newRow][col];
      if (!target || target.player !== piece.player) {
        moves.push({ row: newRow, col });
      }
    }

    // 过河后可以左右移动
    const hasCrossedRiver = isRed ? row <= 4 : row >= 5;
    if (hasCrossedRiver) {
      for (const dc of [-1, 1]) {
        const newCol = col + dc;
        if (this.isValidPosition(row, newCol)) {
          const target = this.board[row][newCol];
          if (!target || target.player !== piece.player) {
            moves.push({ row, col: newCol });
          }
        }
      }
    }

    return moves;
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

    // 检查是否吃掉对方将帅
    const target = this.board[toRow][toCol];
    if (target && target.type === 'general') {
      this.isGameOver = true;
      this.winner = this.currentPlayer;
    }

    // 执行移动
    this.board[toRow][toCol] = { ...piece, position: { row: toRow, col: toCol } };
    this.board[fromRow][fromCol] = null;
    this.selectedPiece = null;

    if (!this.isGameOver) {
      this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';
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
      }, this.difficulty === 'hard' ? 800 : this.difficulty === 'medium' ? 500 : 300);
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
      general: 10000,
      chariot: 1000,
      cannon: 450,
      horse: 400,
      elephant: 200,
      advisor: 200,
      soldier: 100,
    };

    // 吃掉对方棋子的分数
    if (move.captured) {
      score += pieceValues[move.captured.type];
    }

    // 位置权重（中心位置更好）
    const centerBonus = Math.abs(move.to.col - 4) * 10;
    score += (4 - centerBonus / 10) * 10;

    // 将军奖励
    if (move.piece.type === 'chariot' || move.piece.type === 'cannon' || move.piece.type === 'horse') {
      score += 50;
    }

    // 进攻奖励
    if (move.piece.player === 'black' && move.to.row < 5) {
      score += (5 - move.to.row) * 5;
    }

    return score;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const width = GRID_COLS * CELL_SIZE;
    const height = GRID_ROWS * CELL_SIZE;

    // 背景
    ctx.fillStyle = '#f5deb3';
    ctx.fillRect(0, 0, width, height);

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
    const offset = CELL_SIZE / 2;
    
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 2;

    // 横线
    for (let row = 0; row < GRID_ROWS; row++) {
      ctx.beginPath();
      ctx.moveTo(offset, offset + row * CELL_SIZE);
      ctx.lineTo(offset + (GRID_COLS - 1) * CELL_SIZE, offset + row * CELL_SIZE);
      ctx.stroke();
    }

    // 竖线
    for (let col = 0; col < GRID_COLS; col++) {
      // 上半部分
      ctx.beginPath();
      ctx.moveTo(offset + col * CELL_SIZE, offset);
      ctx.lineTo(offset + col * CELL_SIZE, offset + 4 * CELL_SIZE);
      ctx.stroke();
      
      // 下半部分
      ctx.beginPath();
      ctx.moveTo(offset + col * CELL_SIZE, offset + 5 * CELL_SIZE);
      ctx.lineTo(offset + col * CELL_SIZE, offset + 9 * CELL_SIZE);
      ctx.stroke();
      
      // 左右两边的竖线
      if (col === 0 || col === GRID_COLS - 1) {
        ctx.beginPath();
        ctx.moveTo(offset + col * CELL_SIZE, offset);
        ctx.lineTo(offset + col * CELL_SIZE, offset + 9 * CELL_SIZE);
        ctx.stroke();
      }
    }

    // 九宫格斜线
    ctx.beginPath();
    ctx.moveTo(offset + 3 * CELL_SIZE, offset);
    ctx.lineTo(offset + 5 * CELL_SIZE, offset + 2 * CELL_SIZE);
    ctx.moveTo(offset + 5 * CELL_SIZE, offset);
    ctx.lineTo(offset + 3 * CELL_SIZE, offset + 2 * CELL_SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(offset + 3 * CELL_SIZE, offset + 7 * CELL_SIZE);
    ctx.lineTo(offset + 5 * CELL_SIZE, offset + 9 * CELL_SIZE);
    ctx.moveTo(offset + 5 * CELL_SIZE, offset + 7 * CELL_SIZE);
    ctx.lineTo(offset + 3 * CELL_SIZE, offset + 9 * CELL_SIZE);
    ctx.stroke();

    // 楚河汉界
    ctx.font = 'bold 32px KaiTi, STKaiti, serif';
    ctx.fillStyle = '#8b4513';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('楚河', offset + 2 * CELL_SIZE, offset + 4.5 * CELL_SIZE);
    ctx.fillText('汉界', offset + 6 * CELL_SIZE, offset + 4.5 * CELL_SIZE);
  }

  private drawPieces(ctx: CanvasRenderingContext2D): void {
    const offset = CELL_SIZE / 2;
    const radius = CELL_SIZE * 0.4;

    const pieceNames: Record<PieceType, string> = {
      general: '将',
      advisor: '士',
      elephant: '象',
      horse: '马',
      chariot: '车',
      cannon: '炮',
      soldier: '兵',
    };

    const redPieceNames: Record<PieceType, string> = {
      general: '帅',
      advisor: '仕',
      elephant: '相',
      horse: '馬',
      chariot: '車',
      cannon: '砲',
      soldier: '卒',
    };

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const piece = this.board[row][col];
        if (piece) {
          const x = offset + col * CELL_SIZE;
          const y = offset + row * CELL_SIZE;

          // 棋子背景
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = piece.player === 'red' ? '#ffcdd2' : '#e3f2fd';
          ctx.fill();
          ctx.strokeStyle = piece.player === 'red' ? '#b71c1c' : '#1565c0';
          ctx.lineWidth = 3;
          ctx.stroke();

          // 内圈
          ctx.beginPath();
          ctx.arc(x, y, radius * 0.85, 0, Math.PI * 2);
          ctx.strokeStyle = piece.player === 'red' ? '#ef5350' : '#42a5f5';
          ctx.lineWidth = 2;
          ctx.stroke();

          // 棋子文字
          const name = piece.player === 'red' ? redPieceNames[piece.type] : pieceNames[piece.type];
          ctx.font = `bold ${radius * 1.2}px KaiTi, STKaiti, serif`;
          ctx.fillStyle = piece.player === 'red' ? '#b71c1c' : '#1565c0';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(name, x, y);
        }
      }
    }
  }

  private drawSelection(ctx: CanvasRenderingContext2D, pos: Position): void {
    const offset = CELL_SIZE / 2;
    const x = offset + pos.col * CELL_SIZE;
    const y = offset + pos.row * CELL_SIZE;
    const size = CELL_SIZE * 0.45;

    ctx.strokeStyle = '#ff5722';
    ctx.lineWidth = 3;

    // 四角标记
    const corners = [
      { x: x - size, y: y - size },
      { x: x + size, y: y - size },
      { x: x - size, y: y + size },
      { x: x + size, y: y + size },
    ];

    for (const corner of corners) {
      ctx.beginPath();
      ctx.moveTo(corner.x, corner.y);
      ctx.lineTo(corner.x + (corner.x < x ? 10 : -10), corner.y);
      ctx.moveTo(corner.x, corner.y);
      ctx.lineTo(corner.x, corner.y + (corner.y < y ? 10 : -10));
      ctx.stroke();
    }
  }

  private drawMoveIndicator(ctx: CanvasRenderingContext2D, pos: Position): void {
    const offset = CELL_SIZE / 2;
    const x = offset + pos.col * CELL_SIZE;
    const y = offset + pos.row * CELL_SIZE;
    const radius = CELL_SIZE * 0.15;

    ctx.fillStyle = 'rgba(76, 175, 80, 0.7)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
