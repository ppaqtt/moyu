import { LUDO_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE, PIECE_SIZE } = LUDO_CONSTANTS;

export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow';
export type GameStatus = 'idle' | 'playing' | 'selecting' | 'moving' | 'gameover';

export interface Position {
  x: number;
  y: number;
}

export interface Piece {
  id: number;
  playerId: number;
  x: number;
  y: number;
  isHome: boolean;
  isFlying: boolean;
  pathIndex: number;
  finishIndex: number;
}

export interface Player {
  id: number;
  color: PlayerColor;
  pieces: Piece[];
  finishedCount: number;
  isAI: boolean;
}

export interface LudoState {
  players: Player[];
  currentPlayer: number;
  diceValue: number;
  gameStatus: GameStatus;
  winner: number | null;
  message: string;
  canRollDice: boolean;
  movablePieces: number[];
  selectedPiece: number | null;
}

const PLAYER_COLORS: Record<PlayerColor, string> = {
  red: '#e74c3c',
  blue: '#3498db',
  green: '#27ae60',
  yellow: '#f1c40f'
};

const PLAYER_COLORS_LIGHT: Record<PlayerColor, string> = {
  red: '#ff7675',
  blue: '#74b9ff',
  green: '#55efc4',
  yellow: '#ffeaa7'
};

const BOARD_SIZE = 15;
const CENTER = Math.floor(BOARD_SIZE / 2);
const HOME_SIZE = 6;

export class LudoEngine {
  private board: (number | null)[][];
  private players: Player[];
  private currentPlayer: number;
  private diceValue: number;
  private gameStatus: GameStatus;
  private winner: number | null;
  private message: string;
  private canRollDice: boolean;
  private movablePieces: number[];
  private selectedPiece: number | null;
  private pathData: Position[];
  private aiTimer: number;

  constructor() {
    this.board = this.createBoard();
    this.pathData = this.createPath();
    this.players = this.createPlayers();
    this.currentPlayer = 0;
    this.diceValue = 0;
    this.gameStatus = 'idle';
    this.winner = null;
    this.message = '点击开始游戏';
    this.canRollDice = false;
    this.movablePieces = [];
    this.selectedPiece = null;
    this.aiTimer = 0;
  }

  private createBoard(): (number | null)[][] {
    const board: (number | null)[][] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      board[i] = [];
      for (let j = 0; j < BOARD_SIZE; j++) {
        board[i][j] = null;
      }
    }
    return board;
  }

  private createPath(): Position[] {
    const path: Position[] = [];
    const cellToPixel = (i: number) => i * CELL_SIZE + CELL_SIZE / 2;

    for (let i = 0; i < 6; i++) path.push({ x: cellToPixel(6), y: cellToPixel(i) });
    for (let i = 6; i < BOARD_SIZE; i++) path.push({ x: cellToPixel(6), y: cellToPixel(i) });

    for (let i = 6; i < BOARD_SIZE; i++) path.push({ x: cellToPixel(i), y: cellToPixel(6) });
    for (let i = 6; i >= 0; i--) path.push({ x: cellToPixel(i), y: cellToPixel(6) });

    for (let i = 6; i >= 0; i--) path.push({ x: cellToPixel(8), y: cellToPixel(i) });
    for (let i = 0; i < 6; i++) path.push({ x: cellToPixel(i), y: cellToPixel(8) });

    for (let i = 0; i < 6; i++) path.push({ x: cellToPixel(i), y: cellToPixel(6) });
    for (let i = 6; i < BOARD_SIZE; i++) path.push({ x: cellToPixel(i), y: cellToPixel(8) });

    for (let i = 8; i < BOARD_SIZE; i++) path.push({ x: cellToPixel(8), y: cellToPixel(i) });
    for (let i = BOARD_SIZE - 1; i >= 8; i--) path.push({ x: cellToPixel(6), y: cellToPixel(i) });

    for (let i = 6; i >= 0; i--) path.push({ x: cellToPixel(i), y: cellToPixel(8) });
    for (let i = 0; i < 6; i++) path.push({ x: cellToPixel(i), y: cellToPixel(6) });

    return path;
  }

  private createPlayers(): Player[] {
    const homeCenters: Record<number, Position> = {
      0: { x: CELL_SIZE * 2, y: CELL_SIZE * 2 },
      1: { x: CELL_SIZE * 12, y: CELL_SIZE * 2 },
      2: { x: CELL_SIZE * 12, y: CELL_SIZE * 12 },
      3: { x: CELL_SIZE * 2, y: CELL_SIZE * 12 }
    };
    const colors: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];

    return colors.map((color, idx) => ({
      id: idx,
      color,
      pieces: Array.from({ length: 4 }, (_, pieceIdx) => ({
        id: idx * 4 + pieceIdx,
        playerId: idx,
        x: homeCenters[idx].x + (pieceIdx % 2 === 0 ? -8 : 8),
        y: homeCenters[idx].y + (pieceIdx < 2 ? -8 : 8),
        isHome: true,
        isFlying: false,
        pathIndex: -1,
        finishIndex: -1
      })),
      finishedCount: 0,
      isAI: idx !== 0
    }));
  }

  getState(): LudoState {
    return {
      players: this.players.map(p => ({
        ...p,
        pieces: p.pieces.map(piece => ({ ...piece }))
      })),
      currentPlayer: this.currentPlayer,
      diceValue: this.diceValue,
      gameStatus: this.gameStatus,
      winner: this.winner,
      message: this.message,
      canRollDice: this.canRollDice,
      movablePieces: [...this.movablePieces],
      selectedPiece: this.selectedPiece
    };
  }

  startGame(): void {
    this.gameStatus = 'playing';
    this.currentPlayer = 0;
    this.winner = null;
    this.message = '玩家1 回合';
    this.canRollDice = true;
    this.diceValue = 0;
    this.movablePieces = [];
    this.selectedPiece = null;
  }

  rollDice(): number {
    if (!this.canRollDice || this.gameStatus !== 'playing') return 0;

    this.diceValue = Math.floor(Math.random() * 6) + 1;
    this.message = `掷出 ${this.diceValue} 点`;

    if (this.diceValue !== 6) {
      this.movablePieces = this.findMovablePieces();
      if (this.movablePieces.length === 0) {
        setTimeout(() => this.nextTurn(), 1000);
        return this.diceValue;
      }
      this.gameStatus = 'selecting';
      this.canRollDice = false;
    } else {
      this.movablePieces = this.findMovablePieces();
      if (this.movablePieces.length === 0) {
        this.message = '没有可移动的棋子，获得额外回合!';
        this.canRollDice = true;
        setTimeout(() => this.handleAIMove(), 500);
      } else {
        this.gameStatus = 'selecting';
        this.canRollDice = false;
      }
    }

    return this.diceValue;
  }

  private findMovablePieces(): number[] {
    const movable: number[] = [];
    const player = this.players[this.currentPlayer];

    for (const piece of player.pieces) {
      if (piece.isHome) {
        if (this.diceValue === 6) movable.push(piece.id);
      } else if (piece.finishIndex < 0) {
        movable.push(piece.id);
      }
    }

    return movable;
  }

  selectPiece(pieceId: number): boolean {
    if (this.gameStatus !== 'selecting') return false;
    if (!this.movablePieces.includes(pieceId)) return false;

    const piece = this.findPieceById(pieceId);
    if (!piece) return false;

    if (piece.isHome) {
      this.launchPiece(piece);
    } else {
      this.movePiece(piece);
    }

    this.selectedPiece = pieceId;
    this.gameStatus = 'moving';
    return true;
  }

  private launchPiece(piece: Piece): void {
    const player = this.players[this.currentPlayer];
    const startPositions = this.getStartPosition(this.currentPlayer);

    piece.isHome = false;
    piece.isFlying = true;
    piece.x = this.pathData[startPositions.pathStart].x;
    piece.y = this.pathData[startPositions.pathStart].y;
    piece.pathIndex = startPositions.pathStart;
    piece.finishIndex = -1;

    this.checkCapture(piece);
    this.message = `${player.color === 'red' ? '红' : player.color === 'blue' ? '蓝' : player.color === 'green' ? '绿' : '黄'}方 起飞!`;
  }

  private movePiece(piece: Piece): void {
    const player = this.players[this.currentPlayer];
    const steps = this.diceValue;

    const newPathIndex = piece.pathIndex + steps;

    if (newPathIndex >= this.pathData.length) {
      piece.finishIndex = newPathIndex - this.pathData.length;
      piece.pathIndex = -1;

      if (piece.finishIndex >= 4) {
        piece.isFlying = false;
        piece.finishIndex = -2;
        player.finishedCount++;

        if (player.finishedCount === 4) {
          this.winner = this.currentPlayer;
          this.gameStatus = 'gameover';
          this.message = `玩家${this.currentPlayer + 1} 获胜!`;
          return;
        }
        this.message = `${player.color === 'red' ? '红' : player.color === 'blue' ? '蓝' : player.color === 'green' ? '绿' : '黄'}方 完成一个棋子!`;
      } else {
        this.message = '棋子进入终点区域!';
      }
    } else {
      piece.pathIndex = newPathIndex;
      piece.x = this.pathData[newPathIndex].x;
      piece.y = this.pathData[newPathIndex].y;

      this.checkCapture(piece);
    }

    if (piece.finishIndex >= 0) {
      this.message = `${player.color === 'red' ? '红' : player.color === 'blue' ? '蓝' : player.color === 'green' ? '绿' : '黄'}方 棋子到达终点!`;
    }
  }

  private checkCapture(piece: Piece): void {
    const player = this.players[this.currentPlayer];
    const startPositions = this.getStartPosition(this.currentPlayer);

    if (piece.pathIndex >= 0) {
      for (const otherPlayer of this.players) {
        if (otherPlayer.id === this.currentPlayer) continue;

        const otherStart = this.getStartPosition(otherPlayer.id);
        const isSafeZone = this.isSafeZone(piece.pathIndex, startPositions.pathStart, otherStart.pathStart);

        if (!isSafeZone) {
          for (const otherPiece of otherPlayer.pieces) {
            if (!otherPiece.isHome && otherPiece.isFlying && otherPiece.pathIndex >= 0) {
              if (otherPiece.pathIndex === piece.pathIndex) {
                otherPiece.isHome = true;
                otherPiece.isFlying = false;
                const homeCenter = this.getHomeCenter(otherPlayer.id);
                otherPiece.x = homeCenter.x + (otherPiece.id % 4 % 2 === 0 ? -8 : 8);
                otherPiece.y = homeCenter.y + (otherPiece.id % 4 < 2 ? -8 : 8);
                otherPiece.pathIndex = -1;
                otherPiece.finishIndex = -1;

                this.message = `${player.color === 'red' ? '红' : player.color === 'blue' ? '蓝' : player.color === 'green' ? '绿' : '黄'}方 吃掉了${otherPlayer.color === 'red' ? '红' : otherPlayer.color === 'blue' ? '蓝' : otherPlayer.color === 'green' ? '绿' : '黄'}方的棋子!`;
              }
            }
          }
        }
      }
    }
  }

  private isSafeZone(currentIndex: number, ownStart: number, otherStart: number): boolean {
    const safeZones = [
      (ownStart - 1 + this.pathData.length) % this.pathData.length,
      ownStart,
      (ownStart + 1) % this.pathData.length,
      (otherStart - 1 + this.pathData.length) % this.pathData.length,
      otherStart,
      (otherStart + 1) % this.pathData.length
    ];
    return safeZones.includes(currentIndex);
  }

  private getStartPosition(playerId: number): { pathStart: number } {
    const starts = [0, 8, 36, 44];
    return { pathStart: starts[playerId] };
  }

  private getHomeCenter(playerId: number): Position {
    const centers: Position[] = [
      { x: CELL_SIZE * 2, y: CELL_SIZE * 2 },
      { x: CELL_SIZE * 12, y: CELL_SIZE * 2 },
      { x: CELL_SIZE * 12, y: CELL_SIZE * 12 },
      { x: CELL_SIZE * 2, y: CELL_SIZE * 12 }
    ];
    return centers[playerId];
  }

  private findPieceById(pieceId: number): Piece | null {
    for (const player of this.players) {
      for (const piece of player.pieces) {
        if (piece.id === pieceId) return piece;
      }
    }
    return null;
  }

  private nextTurn(): void {
    this.currentPlayer = (this.currentPlayer + 1) % 4;
    this.canRollDice = true;
    this.movablePieces = [];
    this.selectedPiece = null;
    this.gameStatus = 'playing';

    const player = this.players[this.currentPlayer];
    this.message = `玩家${this.currentPlayer + 1} 回合`;

    if (player.isAI) {
      setTimeout(() => this.handleAIMove(), 800);
    }
  }

  private handleAIMove(): void {
    if (this.gameStatus !== 'playing' && this.gameStatus !== 'selecting') return;
    if (this.aiTimer > 0) return;

    if (this.gameStatus === 'playing' && this.canRollDice) {
      this.rollDice();
      this.aiTimer = window.setTimeout(() => {
        this.aiTimer = 0;
        this.handleAIMove();
      }, 600);
    } else if (this.gameStatus === 'selecting' && this.movablePieces.length > 0) {
      const bestPiece = this.selectBestPiece();
      this.selectPiece(bestPiece);
      this.aiTimer = window.setTimeout(() => {
        this.aiTimer = 0;
        this.handleAIMove();
      }, 800);
    }
  }

  private selectBestPiece(): number {
    let bestPiece = this.movablePieces[0];
    let bestScore = -1;

    for (const pieceId of this.movablePieces) {
      const piece = this.findPieceById(pieceId)!;
      let score = 0;

      if (piece.finishIndex >= 0) {
        score = 100 + piece.finishIndex;
      } else if (piece.pathIndex >= 0) {
        score = piece.pathIndex;
      } else {
        score = 50;
      }

      if (score > bestScore) {
        bestScore = score;
        bestPiece = pieceId;
      }
    }

    return bestPiece;
  }

  finishMoving(): void {
    if (this.gameStatus !== 'moving') return;

    if (this.diceValue === 6) {
      this.gameStatus = 'playing';
      this.canRollDice = true;
      this.movablePieces = [];

      if (this.players[this.currentPlayer].isAI) {
        setTimeout(() => this.handleAIMove(), 600);
      }
    } else {
      setTimeout(() => this.nextTurn(), 500);
    }
  }

  reset(): void {
    this.board = this.createBoard();
    this.players = this.createPlayers();
    this.currentPlayer = 0;
    this.diceValue = 0;
    this.gameStatus = 'idle';
    this.winner = null;
    this.message = '点击开始游戏';
    this.canRollDice = false;
    this.movablePieces = [];
    this.selectedPiece = null;
    this.aiTimer = 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);
    this.drawBoard(ctx);
    this.drawSafeZones(ctx);
    this.drawPath(ctx);
    this.drawCenter(ctx);
    this.drawPieces(ctx);
    this.drawHomeBases(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#0f0f1a');
    bgGrad.addColorStop(0.5, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private drawBoard(ctx: CanvasRenderingContext2D): void {
    const colors = ['#e74c3c', '#3498db', '#27ae60', '#f1c40f'];
    const homeCorners = [
      { x: 0, y: 0 },
      { x: 9, y: 0 },
      { x: 9, y: 9 },
      { x: 0, y: 9 }
    ];

    for (let i = 0; i < 4; i++) {
      const corner = homeCorners[i];
      ctx.fillStyle = colors[i] + '40';
      ctx.fillRect(corner.x * CELL_SIZE, corner.y * CELL_SIZE, HOME_SIZE * CELL_SIZE, HOME_SIZE * CELL_SIZE);
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2;
      ctx.strokeRect(corner.x * CELL_SIZE, corner.y * CELL_SIZE, HOME_SIZE * CELL_SIZE, HOME_SIZE * CELL_SIZE);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, BOARD_SIZE * CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(BOARD_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }
  }

  private drawSafeZones(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    const startPositions = this.getStartPosition(0);
    const starts = [0, 8, 36, 44];

    for (let i = 0; i < 4; i++) {
      const pos = this.pathData[starts[i]];
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, CELL_SIZE * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawPath(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (const pos of this.pathData) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, CELL_SIZE * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawCenter(ctx: CanvasRenderingContext2D): void {
    const cx = CENTER * CELL_SIZE;
    const cy = CENTER * CELL_SIZE;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(cx, cy, CELL_SIZE * 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, CELL_SIZE * 2.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('终点', cx, cy);
  }

  private drawPieces(ctx: CanvasRenderingContext2D): void {
    for (const player of this.players) {
      for (const piece of player.pieces) {
        if (piece.finishIndex === -2) continue;

        const isMovable = this.movablePieces.includes(piece.id);
        this.drawPiece(ctx, piece, player.color, isMovable);
      }
    }
  }

  private drawPiece(ctx: CanvasRenderingContext2D, piece: Piece, color: PlayerColor, isMovable: boolean): void {
    const x = piece.x;
    const y = piece.y;
    const radius = PIECE_SIZE / 2;

    if (isMovable) {
      ctx.shadowColor = PLAYER_COLORS[color];
      ctx.shadowBlur = 15;
    }

    ctx.fillStyle = PLAYER_COLORS[color];
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PLAYER_COLORS_LIGHT[color];
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PLAYER_COLORS[color];
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  private drawHomeBases(ctx: CanvasRenderingContext2D): void {
    const homeCenters = [
      { x: CELL_SIZE * 2, y: CELL_SIZE * 2 },
      { x: CELL_SIZE * 12, y: CELL_SIZE * 2 },
      { x: CELL_SIZE * 12, y: CELL_SIZE * 12 },
      { x: CELL_SIZE * 2, y: CELL_SIZE * 12 }
    ];

    for (let i = 0; i < 4; i++) {
      const center = homeCenters[i];
      const color = PLAYER_COLORS[this.players[i].color];

      ctx.fillStyle = color + '30';
      ctx.beginPath();
      ctx.arc(center.x, center.y, CELL_SIZE * 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(center.x, center.y, CELL_SIZE * 1.2, 0, Math.PI * 2);
      ctx.stroke();

      for (let j = 0; j < 4; j++) {
        const px = center.x + (j % 2 === 0 ? -10 : 10);
        const py = center.y + (j < 2 ? -10 : 10);

        ctx.fillStyle = color + '80';
        ctx.beginPath();
        ctx.arc(px, py, PIECE_SIZE / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  getPieceAtPosition(x: number, y: number): number | null {
    for (const player of this.players) {
      for (const piece of player.pieces) {
        if (piece.finishIndex === -2) continue;
        const dx = piece.x - x;
        const dy = piece.y - y;
        if (dx * dx + dy * dy < PIECE_SIZE * PIECE_SIZE) {
          if (player.id === this.currentPlayer && this.movablePieces.includes(piece.id)) {
            return piece.id;
          }
        }
      }
    }
    return null;
  }

  getCurrentPlayer(): number {
    return this.currentPlayer;
  }

  getDiceValue(): number {
    return this.diceValue;
  }

  isAIsTurn(): boolean {
    return this.players[this.currentPlayer].isAI;
  }

  canSelectPiece(): boolean {
    return this.gameStatus === 'selecting';
  }
}

export { PLAYER_COLORS, PLAYER_COLORS_LIGHT };
