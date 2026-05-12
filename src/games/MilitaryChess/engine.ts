export const MILITARY_CHESS_CONSTANTS = {
  CANVAS_WIDTH: 640,
  CANVAS_HEIGHT: 700,
  GRID_ROWS: 12,
  GRID_COLS: 11,
  CELL_WIDTH: 55,
  CELL_HEIGHT: 55,
  PIECE_SIZE: 44,
};

export const MILITARY_CHESS_ENGINE_CONSTANTS = MILITARY_CHESS_CONSTANTS;
export const MILITARY_CHESS_CONSTANTS_2 = MILITARY_CHESS_CONSTANTS;
export const MILITARY_CHESS_CONSTANTS_3 = MILITARY_CHESS_CONSTANTS;
export const MILITARY_CHESS_ENGINE_CONSTANTS_2 = MILITARY_CHESS_CONSTANTS;
export const MILITARY_CHESS_ENGINE_CONSTANTS_3 = MILITARY_CHESS_CONSTANTS;

export type RankType = 'general' | 'marshal' | 'majorGeneral' | 'brigadier' | 'colonel' | 'major' | 'captain' | 'lieutenant' | 'sergeant' | 'private' | 'landmine' | 'bomb';
export type Player = 'red' | 'blue';

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  rank: RankType;
  player: Player;
  row: number;
  col: number;
  isRevealed: boolean;
  id: string;
}

export interface MilitaryChessState {
  pieces: Piece[];
  currentPlayer: Player;
  selectedPiece: Piece | null;
  validMoves: Position[];
  isGameOver: boolean;
  winner: Player | null;
  moveHistory: { from: Position; to: Position; attacker?: RankType; defender?: RankType; result: 'move' | 'capture' | 'eliminated' }[];
  revealMode: boolean;
  gameMode: 'placement' | 'battle';
  placementComplete: Record<Player, boolean>;
  eliminatedPieces: Piece[];
}

const RANK_ORDER: RankType[] = [
  'private', 'lieutenant', 'sergeant', 'captain', 'major', 'colonel', 
  'brigadier', 'majorGeneral', 'marshal', 'general'
];

const RANK_VALUES: Record<RankType, number> = {
  general: 100,
  marshal: 90,
  majorGeneral: 80,
  brigadier: 70,
  colonel: 60,
  major: 50,
  captain: 40,
  lieutenant: 30,
  sergeant: 20,
  private: 10,
  landmine: 5,
  bomb: 1
};

export class MilitaryChessEngine {
  private pieces: Piece[];
  private currentPlayer: Player;
  private selectedPiece: Piece | null;
  private validMoves: Position[];
  private isGameOver: boolean;
  private winner: Player | null;
  private moveHistory: { from: Position; to: Position; attacker?: RankType; defender?: RankType; result: 'move' | 'capture' | 'eliminated' }[];
  private revealMode: boolean;
  private gameMode: 'placement' | 'battle';
  private placementComplete: Record<Player, boolean>;
  private eliminatedPieces: Piece[];
  private pieceIdCounter: number;

  constructor() {
    this.pieces = [];
    this.currentPlayer = 'red';
    this.selectedPiece = null;
    this.validMoves = [];
    this.isGameOver = false;
    this.winner = null;
    this.moveHistory = [];
    this.revealMode = false;
    this.gameMode = 'placement';
    this.placementComplete = { red: false, blue: false };
    this.eliminatedPieces = [];
    this.pieceIdCounter = 0;
    this.init();
  }

  private init(): void {
    this.pieces = [];
    this.currentPlayer = 'red';
    this.selectedPiece = null;
    this.validMoves = [];
    this.isGameOver = false;
    this.winner = null;
    this.moveHistory = [];
    this.revealMode = false;
    this.gameMode = 'placement';
    this.placementComplete = { red: false, blue: false };
    this.eliminatedPieces = [];
  }

  private createPlacement(): void {
    this.pieces = [];

    this.pieces.push({ rank: 'bomb', player: 'red', row: 0, col: 0, isRevealed: false, id: `red_bomb_0` });
    this.pieces.push({ rank: 'landmine', player: 'red', row: 0, col: 4, isRevealed: false, id: `red_landmine_0` });
    this.pieces.push({ rank: 'landmine', player: 'red', row: 0, col: 6, isRevealed: false, id: `red_landmine_1` });
    this.pieces.push({ rank: 'bomb', player: 'red', row: 0, col: 10, isRevealed: false, id: `red_bomb_1` });

    this.pieces.push({ rank: 'general', player: 'red', row: 0, col: 5, isRevealed: false, id: `red_general` });
    this.pieces.push({ rank: 'marshal', player: 'red', row: 1, col: 1, isRevealed: false, id: `red_marshal` });
    this.pieces.push({ rank: 'majorGeneral', player: 'red', row: 1, col: 3, isRevealed: false, id: `red_majorGeneral` });
    this.pieces.push({ rank: 'brigadier', player: 'red', row: 1, col: 5, isRevealed: false, id: `red_brigadier` });
    this.pieces.push({ rank: 'colonel', player: 'red', row: 1, col: 7, isRevealed: false, id: `red_colonel` });
    this.pieces.push({ rank: 'majorGeneral', player: 'red', row: 1, col: 9, isRevealed: false, id: `red_majorGeneral_1` });
    this.pieces.push({ rank: 'major', player: 'red', row: 2, col: 0, isRevealed: false, id: `red_major` });
    this.pieces.push({ rank: 'colonel', player: 'red', row: 2, col: 2, isRevealed: false, id: `red_colonel_1` });
    this.pieces.push({ rank: 'major', player: 'red', row: 2, col: 4, isRevealed: false, id: `red_major_1` });
    this.pieces.push({ rank: 'major', player: 'red', row: 2, col: 6, isRevealed: false, id: `red_major_2` });
    this.pieces.push({ rank: 'colonel', player: 'red', row: 2, col: 8, isRevealed: false, id: `red_colonel_2` });
    this.pieces.push({ rank: 'major', player: 'red', row: 2, col: 10, isRevealed: false, id: `red_major_3` });
    this.pieces.push({ rank: 'captain', player: 'red', row: 3, col: 1, isRevealed: false, id: `red_captain` });
    this.pieces.push({ rank: 'captain', player: 'red', row: 3, col: 3, isRevealed: false, id: `red_captain_1` });
    this.pieces.push({ rank: 'captain', player: 'red', row: 3, col: 5, isRevealed: false, id: `red_captain_2` });
    this.pieces.push({ rank: 'captain', player: 'red', row: 3, col: 7, isRevealed: false, id: `red_captain_3` });
    this.pieces.push({ rank: 'captain', player: 'red', row: 3, col: 9, isRevealed: false, id: `red_captain_4` });
    this.pieces.push({ rank: 'lieutenant', player: 'red', row: 4, col: 0, isRevealed: false, id: `red_lieutenant` });
    this.pieces.push({ rank: 'lieutenant', player: 'red', row: 4, col: 2, isRevealed: false, id: `red_lieutenant_1` });
    this.pieces.push({ rank: 'lieutenant', player: 'red', row: 4, col: 4, isRevealed: false, id: `red_lieutenant_2` });
    this.pieces.push({ rank: 'lieutenant', player: 'red', row: 4, col: 6, isRevealed: false, id: `red_lieutenant_3` });
    this.pieces.push({ rank: 'lieutenant', player: 'red', row: 4, col: 8, isRevealed: false, id: `red_lieutenant_4` });
    this.pieces.push({ rank: 'lieutenant', player: 'red', row: 4, col: 10, isRevealed: false, id: `red_lieutenant_5` });
    this.pieces.push({ rank: 'sergeant', player: 'red', row: 5, col: 1, isRevealed: false, id: `red_sergeant` });
    this.pieces.push({ rank: 'sergeant', player: 'red', row: 5, col: 3, isRevealed: false, id: `red_sergeant_1` });
    this.pieces.push({ rank: 'sergeant', player: 'red', row: 5, col: 5, isRevealed: false, id: `red_sergeant_2` });
    this.pieces.push({ rank: 'sergeant', player: 'red', row: 5, col: 7, isRevealed: false, id: `red_sergeant_3` });
    this.pieces.push({ rank: 'sergeant', player: 'red', row: 5, col: 9, isRevealed: false, id: `red_sergeant_4` });
    this.pieces.push({ rank: 'private', player: 'red', row: 6, col: 0, isRevealed: false, id: `red_private` });
    this.pieces.push({ rank: 'private', player: 'red', row: 6, col: 2, isRevealed: false, id: `red_private_1` });
    this.pieces.push({ rank: 'private', player: 'red', row: 6, col: 4, isRevealed: false, id: `red_private_2` });
    this.pieces.push({ rank: 'private', player: 'red', row: 6, col: 6, isRevealed: false, id: `red_private_3` });
    this.pieces.push({ rank: 'private', player: 'red', row: 6, col: 8, isRevealed: false, id: `red_private_4` });
    this.pieces.push({ rank: 'private', player: 'red', row: 6, col: 10, isRevealed: false, id: `red_private_5` });

    this.pieces.push({ rank: 'bomb', player: 'blue', row: 11, col: 0, isRevealed: false, id: `blue_bomb_0` });
    this.pieces.push({ rank: 'landmine', player: 'blue', row: 11, col: 4, isRevealed: false, id: `blue_landmine_0` });
    this.pieces.push({ rank: 'landmine', player: 'blue', row: 11, col: 6, isRevealed: false, id: `blue_landmine_1` });
    this.pieces.push({ rank: 'bomb', player: 'blue', row: 11, col: 10, isRevealed: false, id: `blue_bomb_1` });

    this.pieces.push({ rank: 'general', player: 'blue', row: 11, col: 5, isRevealed: false, id: `blue_general` });
    this.pieces.push({ rank: 'marshal', player: 'blue', row: 10, col: 1, isRevealed: false, id: `blue_marshal` });
    this.pieces.push({ rank: 'majorGeneral', player: 'blue', row: 10, col: 3, isRevealed: false, id: `blue_majorGeneral` });
    this.pieces.push({ rank: 'brigadier', player: 'blue', row: 10, col: 5, isRevealed: false, id: `blue_brigadier` });
    this.pieces.push({ rank: 'colonel', player: 'blue', row: 10, col: 7, isRevealed: false, id: `blue_colonel` });
    this.pieces.push({ rank: 'majorGeneral', player: 'blue', row: 10, col: 9, isRevealed: false, id: `blue_majorGeneral_1` });
    this.pieces.push({ rank: 'major', player: 'blue', row: 9, col: 0, isRevealed: false, id: `blue_major` });
    this.pieces.push({ rank: 'colonel', player: 'blue', row: 9, col: 2, isRevealed: false, id: `blue_colonel_1` });
    this.pieces.push({ rank: 'major', player: 'blue', row: 9, col: 4, isRevealed: false, id: `blue_major_1` });
    this.pieces.push({ rank: 'major', player: 'blue', row: 9, col: 6, isRevealed: false, id: `blue_major_2` });
    this.pieces.push({ rank: 'colonel', player: 'blue', row: 9, col: 8, isRevealed: false, id: `blue_colonel_2` });
    this.pieces.push({ rank: 'major', player: 'blue', row: 9, col: 10, isRevealed: false, id: `blue_major_3` });
    this.pieces.push({ rank: 'captain', player: 'blue', row: 8, col: 1, isRevealed: false, id: `blue_captain` });
    this.pieces.push({ rank: 'captain', player: 'blue', row: 8, col: 3, isRevealed: false, id: `blue_captain_1` });
    this.pieces.push({ rank: 'captain', player: 'blue', row: 8, col: 5, isRevealed: false, id: `blue_captain_2` });
    this.pieces.push({ rank: 'captain', player: 'blue', row: 8, col: 7, isRevealed: false, id: `blue_captain_3` });
    this.pieces.push({ rank: 'captain', player: 'blue', row: 8, col: 9, isRevealed: false, id: `blue_captain_4` });
    this.pieces.push({ rank: 'lieutenant', player: 'blue', row: 7, col: 0, isRevealed: false, id: `blue_lieutenant` });
    this.pieces.push({ rank: 'lieutenant', player: 'blue', row: 7, col: 2, isRevealed: false, id: `blue_lieutenant_1` });
    this.pieces.push({ rank: 'lieutenant', player: 'blue', row: 7, col: 4, isRevealed: false, id: `blue_lieutenant_2` });
    this.pieces.push({ rank: 'lieutenant', player: 'blue', row: 7, col: 6, isRevealed: false, id: `blue_lieutenant_3` });
    this.pieces.push({ rank: 'lieutenant', player: 'blue', row: 7, col: 8, isRevealed: false, id: `blue_lieutenant_4` });
    this.pieces.push({ rank: 'lieutenant', player: 'blue', row: 7, col: 10, isRevealed: false, id: `blue_lieutenant_5` });
    this.pieces.push({ rank: 'sergeant', player: 'blue', row: 6, col: 1, isRevealed: false, id: `blue_sergeant` });
    this.pieces.push({ rank: 'sergeant', player: 'blue', row: 6, col: 3, isRevealed: false, id: `blue_sergeant_1` });
    this.pieces.push({ rank: 'sergeant', player: 'blue', row: 6, col: 5, isRevealed: false, id: `blue_sergeant_2` });
    this.pieces.push({ rank: 'sergeant', player: 'blue', row: 6, col: 7, isRevealed: false, id: `blue_sergeant_3` });
    this.pieces.push({ rank: 'sergeant', player: 'blue', row: 6, col: 9, isRevealed: false, id: `blue_sergeant_4` });
    this.pieces.push({ rank: 'private', player: 'blue', row: 5, col: 0, isRevealed: false, id: `blue_private` });
    this.pieces.push({ rank: 'private', player: 'blue', row: 5, col: 2, isRevealed: false, id: `blue_private_1` });
    this.pieces.push({ rank: 'private', player: 'blue', row: 5, col: 4, isRevealed: false, id: `blue_private_2` });
    this.pieces.push({ rank: 'private', player: 'blue', row: 5, col: 6, isRevealed: false, id: `blue_private_3` });
    this.pieces.push({ rank: 'private', player: 'blue', row: 5, col: 8, isRevealed: false, id: `blue_private_4` });
    this.pieces.push({ rank: 'private', player: 'blue', row: 5, col: 10, isRevealed: false, id: `blue_private_5` });
  }

  getState(): MilitaryChessState {
    return {
      pieces: this.pieces.map(p => ({ ...p })),
      currentPlayer: this.currentPlayer,
      selectedPiece: this.selectedPiece ? { ...this.selectedPiece } : null,
      validMoves: [...this.validMoves],
      isGameOver: this.isGameOver,
      winner: this.winner,
      moveHistory: [...this.moveHistory],
      revealMode: this.revealMode,
      gameMode: this.gameMode,
      placementComplete: { ...this.placementComplete },
      eliminatedPieces: this.eliminatedPieces.map(p => ({ ...p }))
    };
  }

  reset(): void {
    this.init();
    this.createPlacement();
  }

  startBattle(): void {
    this.gameMode = 'battle';
    this.currentPlayer = 'red';
  }

  getPieceAt(row: number, col: number): Piece | undefined {
    return this.pieces.find(p => p.row === row && p.col === col);
  }

  selectPiece(row: number, col: number): boolean {
    if (this.isGameOver) return false;

    const piece = this.getPieceAt(row, col);

    if (this.gameMode === 'placement') {
      if (piece && piece.player === this.currentPlayer) {
        this.selectedPiece = piece;
        this.validMoves = this.getPlacementMoves(piece);
        return true;
      }
      return false;
    }

    if (piece && piece.player === this.currentPlayer && this.gameMode === 'battle') {
      this.selectedPiece = piece;
      this.validMoves = this.getValidMoves(piece);
      return true;
    } else if (this.selectedPiece) {
      const targetPos = { row, col };
      if (this.isValidMove(this.selectedPiece, targetPos)) {
        this.movePiece(this.selectedPiece, targetPos);
        return true;
      }
    }

    return false;
  }

  private getPlacementMoves(piece: Piece): Position[] {
    const moves: Position[] = [];
    const startRow = piece.player === 'red' ? 0 : 6;
    const endRow = piece.player === 'red' ? 5 : 11;

    for (let r = startRow; r <= endRow; r++) {
      for (let c = 0; c < 11; c++) {
        if (!this.getPieceAt(r, c)) {
          if (piece.rank === 'general' || piece.rank === 'marshal') {
            if (piece.player === 'red' && r === 0 && (c === 4 || c === 5 || c === 6)) {
              moves.push({ row: r, col: c });
            } else if (piece.player === 'blue' && r === 10 && (c === 4 || c === 5 || c === 6)) {
              moves.push({ row: r, col: c });
            }
          } else if (piece.rank === 'bomb' || piece.rank === 'landmine') {
            if (piece.player === 'red' && r === 0) {
              moves.push({ row: r, col: c });
            } else if (piece.player === 'blue' && r === 10) {
              moves.push({ row: r, col: c });
            }
          } else {
            moves.push({ row: r, col: c });
          }
        }
      }
    }

    return moves;
  }

  private getValidMoves(piece: Piece): Position[] {
    const moves: Position[] = [];

    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of directions) {
      let r = piece.row + dr;
      let c = piece.col + dc;

      while (r >= 0 && r < 12 && c >= 0 && c < 11) {
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

    return moves;
  }

  private isValidMove(piece: Piece, target: Position): boolean {
    return this.validMoves.some(m => m.row === target.row && m.col === target.col);
  }

  private movePiece(piece: Piece, target: Position): void {
    const fromPos = { row: piece.row, col: piece.col };
    const targetPiece = this.getPieceAt(target.row, target.col);

    let result: 'move' | 'capture' | 'eliminated' = 'move';

    if (targetPiece) {
      const battleResult = this.resolveBattle(piece, targetPiece);
      if (battleResult === 'attacker_wins') {
        this.eliminatedPieces.push(targetPiece);
        this.pieces = this.pieces.filter(p => p.id !== targetPiece.id);
        result = 'capture';
      } else if (battleResult === 'defender_wins') {
        this.eliminatedPieces.push(piece);
        this.pieces = this.pieces.filter(p => p.id !== piece.id);
        result = 'eliminated';
      } else if (battleResult === 'both_eliminated') {
        this.eliminatedPieces.push(piece);
        this.eliminatedPieces.push(targetPiece);
        this.pieces = this.pieces.filter(p => p.id !== piece.id && p.id !== targetPiece.id);
        result = 'eliminated';
      }

      this.moveHistory.push({
        from: fromPos,
        to: target,
        attacker: piece.rank,
        defender: targetPiece.rank,
        result
      });
    } else {
      this.moveHistory.push({ from: fromPos, to: target, result });
    }

    if (result !== 'eliminated') {
      piece.row = target.row;
      piece.col = target.col;
    }

    this.selectedPiece = null;
    this.validMoves = [];

    this.checkWinCondition();

    if (!this.isGameOver) {
      this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';

      if (this.gameMode === 'battle') {
        setTimeout(() => {
          this.aiMove();
        }, 500);
      }
    }
  }

  private resolveBattle(attacker: Piece, defender: Piece): 'attacker_wins' | 'defender_wins' | 'both_eliminated' | 'draw' {
    if (attacker.rank === defender.rank) {
      return 'both_eliminated';
    }

    if (attacker.rank === 'private' && defender.rank === 'general') {
      return 'attacker_wins';
    }

    if (attacker.rank === 'general' && defender.rank === 'private') {
      return 'defender_wins';
    }

    if (attacker.rank === 'bomb' || attacker.rank === 'landmine') {
      if (defender.rank === 'marshal') {
        return 'both_eliminated';
      }
      return 'defender_wins';
    }

    if (defender.rank === 'bomb' || defender.rank === 'landmine') {
      if (attacker.rank === 'marshal') {
        return 'attacker_wins';
      }
      return 'attacker_wins';
    }

    if (attacker.rank === 'marshal') {
      return 'attacker_wins';
    }

    if (defender.rank === 'marshal') {
      return 'defender_wins';
    }

    if (RANK_VALUES[attacker.rank] > RANK_VALUES[defender.rank]) {
      return 'attacker_wins';
    }

    return 'defender_wins';
  }

  private checkWinCondition(): void {
    const redGeneral = this.pieces.find(p => p.player === 'red' && p.rank === 'general');
    const blueGeneral = this.pieces.find(p => p.player === 'blue' && p.rank === 'general');

    if (!redGeneral) {
      this.isGameOver = true;
      this.winner = 'blue';
    } else if (!blueGeneral) {
      this.isGameOver = true;
      this.winner = 'red';
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
    this.drawRailways(ctx);
    this.drawHeadquarters(ctx);
    this.drawValidMoves(ctx);
    this.drawPieces(ctx);
  }

  private drawBoard(ctx: CanvasRenderingContext2D): void {
    const cellWidth = 55;
    const cellHeight = 55;

    ctx.fillStyle = '#d4a574';
    ctx.fillRect(0, 0, 605, 660);

    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 11; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(11 * cellWidth, i * cellHeight);
      ctx.stroke();
    }

    for (let i = 0; i <= 11; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, 6 * cellHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 6 * cellHeight);
      ctx.lineTo(i * cellWidth, 660);
      ctx.stroke();
    }
  }

  private drawRailways(ctx: CanvasRenderingContext2D): void {
    const cellWidth = 55;
    const cellHeight = 55;

    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(cellWidth, 2 * cellHeight);
    ctx.lineTo(cellWidth, 4 * cellHeight);
    ctx.moveTo(2 * cellWidth, 2 * cellHeight);
    ctx.lineTo(2 * cellWidth, 4 * cellHeight);
    ctx.moveTo(3 * cellWidth, 2 * cellHeight);
    ctx.lineTo(3 * cellWidth, 4 * cellHeight);
    ctx.moveTo(4 * cellWidth, 2 * cellHeight);
    ctx.lineTo(4 * cellWidth, 4 * cellHeight);
    ctx.moveTo(6 * cellWidth, 2 * cellHeight);
    ctx.lineTo(6 * cellWidth, 4 * cellHeight);
    ctx.moveTo(7 * cellWidth, 2 * cellHeight);
    ctx.lineTo(7 * cellWidth, 4 * cellHeight);
    ctx.moveTo(8 * cellWidth, 2 * cellHeight);
    ctx.lineTo(8 * cellWidth, 4 * cellHeight);
    ctx.moveTo(9 * cellWidth, 2 * cellHeight);
    ctx.lineTo(9 * cellWidth, 4 * cellHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(2 * cellWidth, 2 * cellHeight);
    ctx.lineTo(9 * cellWidth, 2 * cellHeight);
    ctx.moveTo(2 * cellWidth, 4 * cellHeight);
    ctx.lineTo(9 * cellWidth, 4 * cellHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(4 * cellWidth, 2 * cellHeight);
    ctx.lineTo(6 * cellWidth, 2 * cellHeight);
    ctx.moveTo(4 * cellWidth, 4 * cellHeight);
    ctx.lineTo(6 * cellWidth, 4 * cellHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(5 * cellWidth, 2 * cellHeight);
    ctx.lineTo(5 * cellWidth, 4 * cellHeight);
    ctx.stroke();
  }

  private drawHeadquarters(ctx: CanvasRenderingContext2D): void {
    const cellWidth = 55;
    const cellHeight = 55;

    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(1 * cellWidth, 0);
    ctx.lineTo(4 * cellWidth, 3 * cellHeight);
    ctx.lineTo(1 * cellWidth, 3 * cellHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(10 * cellWidth, 0);
    ctx.lineTo(7 * cellWidth, 3 * cellHeight);
    ctx.lineTo(10 * cellWidth, 3 * cellHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(1 * cellWidth, 6 * cellHeight);
    ctx.lineTo(4 * cellWidth, 3 * cellHeight);
    ctx.lineTo(1 * cellWidth, 3 * cellHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(10 * cellWidth, 6 * cellHeight);
    ctx.lineTo(7 * cellWidth, 3 * cellHeight);
    ctx.lineTo(10 * cellWidth, 3 * cellHeight);
    ctx.stroke();
  }

  private drawValidMoves(ctx: CanvasRenderingContext2D): void {
    const cellWidth = 55;
    const cellHeight = 55;

    for (const move of this.validMoves) {
      const x = move.col * cellWidth + cellWidth / 2;
      const y = move.row * cellHeight + cellHeight / 2;

      const target = this.getPieceAt(move.row, move.col);
      if (target) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, cellWidth / 2 - 4, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, cellWidth / 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawPieces(ctx: CanvasRenderingContext2D): void {
    const cellWidth = 55;
    const cellHeight = 55;

    for (const piece of this.pieces) {
      const x = piece.col * cellWidth + cellWidth / 2;
      const y = piece.row * cellHeight + cellHeight / 2;
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
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const symbol = this.getRankSymbol(piece.rank);
      ctx.fillText(symbol, x, y + 2);

      ctx.shadowBlur = 0;
    }
  }

  private getRankSymbol(rank: RankType): string {
    const symbols: Record<RankType, string> = {
      general: '司',
      marshal: '军',
      majorGeneral: '师',
      brigadier: '旅',
      colonel: '团',
      major: '营',
      captain: '连',
      lieutenant: '排',
      sergeant: '工',
      private: '兵',
      landmine: '雷',
      bomb: '弹'
    };
    return symbols[rank];
  }
}
