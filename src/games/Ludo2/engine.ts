export const LUDO2_CONSTANTS = {
  CANVAS_WIDTH: 700,
  CANVAS_HEIGHT: 700,
  CELL_SIZE: 28,
  PIECE_SIZE: 22,
};

export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
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
  hasShield: boolean;
  hasSpeed: boolean;
}

export interface Player {
  id: number;
  color: PlayerColor;
  pieces: Piece[];
  finishedCount: number;
  isAI: boolean;
  name: string;
}

export interface SpecialTile {
  type: 'shield' | 'speed' | 'teleport' | 'bomb' | 'star' | 'magic';
  position: number;
  used: boolean;
}

export interface Ludo2State {
  players: Player[];
  currentPlayer: number;
  diceValue: number;
  gameStatus: GameStatus;
  winner: number | null;
  message: string;
  canRollDice: boolean;
  movablePieces: number[];
  selectedPiece: number | null;
  specialTiles: SpecialTile[];
  roundCount: number;
}

export const PLAYER_COLORS: Record<PlayerColor, string> = {
  red: '#e74c3c',
  blue: '#3498db',
  green: '#27ae60',
  yellow: '#f1c40f',
  purple: '#9b59b6',
  orange: '#e67e22'
};

export const PLAYER_COLORS_LIGHT: Record<PlayerColor, string> = {
  red: '#ff7675',
  blue: '#74b9ff',
  green: '#55efc4',
  yellow: '#ffeaa7',
  purple: '#a29bfe',
  orange: '#fab1a0'
};

const BOARD_SIZE = 17;
const CENTER = Math.floor(BOARD_SIZE / 2);

export class Ludo2Engine {
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
  private specialTiles: SpecialTile[];
  private aiTimer: number;
  private roundCount: number;
  private numPlayers: number;

  constructor(numPlayers: number = 4) {
    this.numPlayers = numPlayers;
    this.board = this.createBoard();
    this.pathData = this.createPath();
    this.specialTiles = this.createSpecialTiles();
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
    this.roundCount = 0;
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
    const cellToPixel = (i: number) => i * LUDO2_CONSTANTS.CELL_SIZE + LUDO2_CONSTANTS.CELL_SIZE / 2;

    const pattern1 = [
      { x: 8, y: 6 }, { x: 8, y: 5 }, { x: 8, y: 4 }, { x: 8, y: 3 }, { x: 8, y: 2 }, { x: 8, y: 1 }, { x: 8, y: 0 },
      { x: 7, y: 0 }, { x: 6, y: 0 }, { x: 5, y: 0 }, { x: 4, y: 0 }, { x: 3, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 },
      { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 },
      { x: 0, y: 8 }, { x: 0, y: 9 }, { x: 0, y: 10 }, { x: 0, y: 11 }, { x: 0, y: 12 }, { x: 0, y: 13 }, { x: 0, y: 14 }, { x: 0, y: 15 }, { x: 0, y: 16 },
      { x: 1, y: 16 }, { x: 2, y: 16 }, { x: 3, y: 16 }, { x: 4, y: 16 }, { x: 5, y: 16 }, { x: 6, y: 16 }, { x: 7, y: 16 }, { x: 8, y: 16 },
      { x: 8, y: 15 }, { x: 8, y: 14 }, { x: 8, y: 13 }, { x: 8, y: 12 }, { x: 8, y: 11 }, { x: 8, y: 10 }, { x: 8, y: 9 }, { x: 8, y: 8 },
      { x: 9, y: 8 }, { x: 10, y: 8 }, { x: 11, y: 8 }, { x: 12, y: 8 }, { x: 13, y: 8 }, { x: 14, y: 8 }, { x: 15, y: 8 }, { x: 16, y: 8 },
      { x: 16, y: 7 }, { x: 16, y: 6 }, { x: 16, y: 5 }, { x: 16, y: 4 }, { x: 16, y: 3 }, { x: 16, y: 2 }, { x: 16, y: 1 }, { x: 16, y: 0 },
      { x: 15, y: 0 }, { x: 14, y: 0 }, { x: 13, y: 0 }, { x: 12, y: 0 }, { x: 11, y: 0 }, { x: 10, y: 0 }, { x: 9, y: 0 },
      { x: 9, y: 1 }, { x: 9, y: 2 }, { x: 9, y: 3 }, { x: 9, y: 4 }, { x: 9, y: 5 }, { x: 9, y: 6 },
      { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 }, { x: 12, y: 7 }, { x: 13, y: 7 }, { x: 14, y: 7 }, { x: 15, y: 7 },
      { x: 15, y: 6 }, { x: 15, y: 5 }, { x: 15, y: 4 }, { x: 15, y: 3 }, { x: 15, y: 2 }, { x: 15, y: 1 }, { x: 15, y: 0 },
      { x: 14, y: 0 }, { x: 13, y: 0 }, { x: 12, y: 0 }, { x: 11, y: 0 }, { x: 10, y: 0 },
      { x: 10, y: 1 }, { x: 10, y: 2 }, { x: 10, y: 3 }, { x: 10, y: 4 }, { x: 10, y: 5 }, { x: 10, y: 6 },
      { x: 10, y: 7 }, { x: 11, y: 7 }, { x: 12, y: 7 }, { x: 13, y: 7 }, { x: 14, y: 7 },
      { x: 14, y: 6 }, { x: 14, y: 5 }, { x: 14, y: 4 }, { x: 14, y: 3 }, { x: 14, y: 2 }, { x: 14, y: 1 },
      { x: 13, y: 1 }, { x: 12, y: 1 }, { x: 11, y: 1 }, { x: 10, y: 1 },
      { x: 10, y: 2 }, { x: 10, y: 3 }, { x: 10, y: 4 }, { x: 10, y: 5 },
      { x: 10, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 },
      { x: 13, y: 5 }, { x: 13, y: 4 }, { x: 13, y: 3 }, { x: 13, y: 2 }, { x: 13, y: 1 },
      { x: 12, y: 1 }, { x: 11, y: 1 },
      { x: 11, y: 2 }, { x: 11, y: 3 }, { x: 11, y: 4 }, { x: 11, y: 5 },
      { x: 11, y: 6 }, { x: 12, y: 6 },
      { x: 12, y: 5 }, { x: 12, y: 4 }, { x: 12, y: 3 }, { x: 12, y: 2 },
      { x: 11, y: 2 }, { x: 11, y: 3 }, { x: 11, y: 4 }, { x: 11, y: 5 },
    ];

    for (const pos of pattern1) {
      path.push({ x: cellToPixel(pos.x), y: cellToPixel(pos.y) });
    }

    return path.slice(0, 100);
  }

  private createSpecialTiles(): SpecialTile[] {
    return [
      { type: 'shield', position: 10, used: false },
      { type: 'speed', position: 20, used: false },
      { type: 'teleport', position: 30, used: false },
      { type: 'star', position: 40, used: false },
      { type: 'bomb', position: 50, used: false },
      { type: 'magic', position: 60, used: false },
    ];
  }

  private createPlayers(): Player[] {
    const colors: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];
    const names = ['红队', '蓝队', '绿队', '黄队'];
    const homeCenters: Record<number, Position> = {
      0: { x: LUDO2_CONSTANTS.CELL_SIZE * 2.5, y: LUDO2_CONSTANTS.CELL_SIZE * 2.5 },
      1: { x: LUDO2_CONSTANTS.CELL_SIZE * 14.5, y: LUDO2_CONSTANTS.CELL_SIZE * 2.5 },
      2: { x: LUDO2_CONSTANTS.CELL_SIZE * 14.5, y: LUDO2_CONSTANTS.CELL_SIZE * 14.5 },
      3: { x: LUDO2_CONSTANTS.CELL_SIZE * 2.5, y: LUDO2_CONSTANTS.CELL_SIZE * 14.5 }
    };

    return colors.slice(0, this.numPlayers).map((color, idx) => ({
      id: idx,
      color,
      name: names[idx],
      pieces: Array.from({ length: 4 }, (_, pieceIdx) => ({
        id: idx * 4 + pieceIdx,
        playerId: idx,
        x: homeCenters[idx].x + (pieceIdx % 2 === 0 ? -10 : 10),
        y: homeCenters[idx].y + (pieceIdx < 2 ? -10 : 10),
        isHome: true,
        isFlying: false,
        pathIndex: -1,
        finishIndex: -1,
        hasShield: false,
        hasSpeed: false
      })),
      finishedCount: 0,
      isAI: idx !== 0
    }));
  }

  getState(): Ludo2State {
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
      selectedPiece: this.selectedPiece,
      specialTiles: this.specialTiles.map(t => ({ ...t })),
      roundCount: this.roundCount
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
    this.roundCount = 0;
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
    this.applySpecialTile(piece);
    this.message = `${player.name} 起飞!`;
  }

  private movePiece(piece: Piece): void {
    const player = this.players[this.currentPlayer];
    let steps = this.diceValue;

    if (piece.hasSpeed) {
      steps += 2;
      piece.hasSpeed = false;
    }

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
          this.message = `${player.name} 获胜!`;
          return;
        }
        this.message = `${player.name} 完成一个棋子!`;
      } else {
        this.message = '棋子进入终点区域!';
      }
    } else {
      piece.pathIndex = newPathIndex;
      piece.x = this.pathData[newPathIndex].x;
      piece.y = this.pathData[newPathIndex].y;

      this.checkCapture(piece);
      this.applySpecialTile(piece);
    }

    if (piece.finishIndex >= 0) {
      this.message = `${player.name} 棋子到达终点!`;
    }
  }

  private applySpecialTile(piece: Piece): void {
    const specialTile = this.specialTiles.find(t => t.position === piece.pathIndex);
    if (!specialTile || specialTile.used) return;

    switch (specialTile.type) {
      case 'shield':
        piece.hasShield = true;
        specialTile.used = true;
        this.message += ' 获得护盾!';
        break;
      case 'speed':
        piece.hasSpeed = true;
        specialTile.used = true;
        this.message += ' 获得加速!';
        break;
      case 'bomb':
        if (!piece.hasShield) {
          piece.isHome = true;
          piece.isFlying = false;
          const homeCenter = this.getHomeCenter(piece.playerId);
          piece.x = homeCenter.x + (piece.id % 4 % 2 === 0 ? -10 : 10);
          piece.y = homeCenter.y + (piece.id % 4 < 2 ? -10 : 10);
          piece.pathIndex = -1;
          piece.finishIndex = -1;
          this.message += ' 踩到炸弹!棋子回营!';
        }
        break;
      case 'star':
        this.diceValue = 6;
        this.canRollDice = true;
        this.message += ' 获得额外投掷!';
        break;
    }
  }

  private checkCapture(piece: Piece): void {
    const player = this.players[this.currentPlayer];
    const startPositions = this.getStartPosition(this.currentPlayer);

    if (piece.pathIndex >= 0 && !piece.hasShield) {
      for (const otherPlayer of this.players) {
        if (otherPlayer.id === this.currentPlayer) continue;

        const otherStart = this.getStartPosition(otherPlayer.id);
        const isSafeZone = this.isSafeZone(piece.pathIndex, startPositions.pathStart, otherStart.pathStart);

        if (!isSafeZone) {
          for (const otherPiece of otherPlayer.pieces) {
            if (!otherPiece.isHome && otherPiece.isFlying && otherPiece.pathIndex >= 0 && !otherPiece.hasShield) {
              if (otherPiece.pathIndex === piece.pathIndex) {
                otherPiece.isHome = true;
                otherPiece.isFlying = false;
                const homeCenter = this.getHomeCenter(otherPlayer.id);
                otherPiece.x = homeCenter.x + (otherPiece.id % 4 % 2 === 0 ? -10 : 10);
                otherPiece.y = homeCenter.y + (otherPiece.id % 4 < 2 ? -10 : 10);
                otherPiece.pathIndex = -1;
                otherPiece.finishIndex = -1;

                this.message = `${player.name} 吃掉了${otherPlayer.name}的棋子!`;
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
    const starts = [0, 25, 50, 75];
    return { pathStart: starts[playerId] % this.pathData.length };
  }

  private getHomeCenter(playerId: number): Position {
    const centers: Position[] = [
      { x: LUDO2_CONSTANTS.CELL_SIZE * 2.5, y: LUDO2_CONSTANTS.CELL_SIZE * 2.5 },
      { x: LUDO2_CONSTANTS.CELL_SIZE * 14.5, y: LUDO2_CONSTANTS.CELL_SIZE * 2.5 },
      { x: LUDO2_CONSTANTS.CELL_SIZE * 14.5, y: LUDO2_CONSTANTS.CELL_SIZE * 14.5 },
      { x: LUDO2_CONSTANTS.CELL_SIZE * 2.5, y: LUDO2_CONSTANTS.CELL_SIZE * 14.5 }
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
    this.currentPlayer = (this.currentPlayer + 1) % this.numPlayers;
    this.canRollDice = true;
    this.movablePieces = [];
    this.selectedPiece = null;
    this.gameStatus = 'playing';
    this.roundCount++;

    const player = this.players[this.currentPlayer];
    this.message = `${player.name} 回合`;

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

      if (piece.hasSpeed) score += 20;
      if (piece.hasShield) score += 10;

      if (score > bestScore) {
        bestScore = score;
        bestPiece = pieceId;
      }
    }

    return bestPiece;
  }

  finishMoving(): void {
    if (this.gameStatus !== 'moving') return;

    if (this.diceValue === 6 && this.canRollDice) {
      this.gameStatus = 'playing';

      if (this.players[this.currentPlayer].isAI) {
        setTimeout(() => this.handleAIMove(), 600);
      }
    } else {
      setTimeout(() => this.nextTurn(), 500);
    }
  }

  reset(): void {
    this.board = this.createBoard();
    this.specialTiles = this.createSpecialTiles();
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
    this.roundCount = 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.drawBackground(ctx);
    this.drawBoard(ctx);
    this.drawSpecialTiles(ctx);
    this.drawPath(ctx);
    this.drawCenter(ctx);
    this.drawPieces(ctx);
    this.drawHomeBases(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const bgGrad = ctx.createLinearGradient(0, 0, LUDO2_CONSTANTS.CANVAS_WIDTH, LUDO2_CONSTANTS.CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#1a0a2e');
    bgGrad.addColorStop(0.5, '#16213e');
    bgGrad.addColorStop(1, '#0f0f23');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, LUDO2_CONSTANTS.CANVAS_WIDTH, LUDO2_CONSTANTS.CANVAS_HEIGHT);
  }

  private drawBoard(ctx: CanvasRenderingContext2D): void {
    const colors = ['#e74c3c', '#3498db', '#27ae60', '#f1c40f'];
    const homeCorners = [
      { x: 0, y: 0 },
      { x: 11, y: 0 },
      { x: 11, y: 11 },
      { x: 0, y: 11 }
    ];

    for (let i = 0; i < 4; i++) {
      const corner = homeCorners[i];
      ctx.fillStyle = colors[i] + '30';
      ctx.fillRect(corner.x * LUDO2_CONSTANTS.CELL_SIZE, corner.y * LUDO2_CONSTANTS.CELL_SIZE, 8 * LUDO2_CONSTANTS.CELL_SIZE, 8 * LUDO2_CONSTANTS.CELL_SIZE);
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2;
      ctx.strokeRect(corner.x * LUDO2_CONSTANTS.CELL_SIZE, corner.y * LUDO2_CONSTANTS.CELL_SIZE, 8 * LUDO2_CONSTANTS.CELL_SIZE, 8 * LUDO2_CONSTANTS.CELL_SIZE);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * LUDO2_CONSTANTS.CELL_SIZE, 0);
      ctx.lineTo(i * LUDO2_CONSTANTS.CELL_SIZE, BOARD_SIZE * LUDO2_CONSTANTS.CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * LUDO2_CONSTANTS.CELL_SIZE);
      ctx.lineTo(BOARD_SIZE * LUDO2_CONSTANTS.CELL_SIZE, i * LUDO2_CONSTANTS.CELL_SIZE);
      ctx.stroke();
    }
  }

  private drawSpecialTiles(ctx: CanvasRenderingContext2D): void {
    const tileColors: Record<string, string> = {
      shield: '#00ffff',
      speed: '#ffff00',
      teleport: '#ff00ff',
      star: '#ffd700',
      bomb: '#ff4444',
      magic: '#9b59b6'
    };

    for (const tile of this.specialTiles) {
      if (tile.position < this.pathData.length) {
        const pos = this.pathData[tile.position];
        ctx.fillStyle = tileColors[tile.type] + '60';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, LUDO2_CONSTANTS.CELL_SIZE * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = tileColors[tile.type];
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  private drawPath(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (const pos of this.pathData) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, LUDO2_CONSTANTS.CELL_SIZE * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawCenter(ctx: CanvasRenderingContext2D): void {
    const cx = CENTER * LUDO2_CONSTANTS.CELL_SIZE;
    const cy = CENTER * LUDO2_CONSTANTS.CELL_SIZE;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(cx, cy, LUDO2_CONSTANTS.CELL_SIZE * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, LUDO2_CONSTANTS.CELL_SIZE * 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('飞行棋2', cx, cy);
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
    const radius = LUDO2_CONSTANTS.PIECE_SIZE / 2;

    if (isMovable) {
      ctx.shadowColor = PLAYER_COLORS[color];
      ctx.shadowBlur = 15;
    }

    if (piece.hasShield) {
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = PLAYER_COLORS[color];
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PLAYER_COLORS_LIGHT[color];
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, radius * 0.4, 0, Math.PI * 2);
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
      { x: LUDO2_CONSTANTS.CELL_SIZE * 2.5, y: LUDO2_CONSTANTS.CELL_SIZE * 2.5 },
      { x: LUDO2_CONSTANTS.CELL_SIZE * 14.5, y: LUDO2_CONSTANTS.CELL_SIZE * 2.5 },
      { x: LUDO2_CONSTANTS.CELL_SIZE * 14.5, y: LUDO2_CONSTANTS.CELL_SIZE * 14.5 },
      { x: LUDO2_CONSTANTS.CELL_SIZE * 2.5, y: LUDO2_CONSTANTS.CELL_SIZE * 14.5 }
    ];

    for (let i = 0; i < this.numPlayers; i++) {
      const center = homeCenters[i];
      const color = PLAYER_COLORS[this.players[i].color];

      ctx.fillStyle = color + '20';
      ctx.beginPath();
      ctx.arc(center.x, center.y, LUDO2_CONSTANTS.CELL_SIZE * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(center.x, center.y, LUDO2_CONSTANTS.CELL_SIZE * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      for (let j = 0; j < 4; j++) {
        const px = center.x + (j % 2 === 0 ? -12 : 12);
        const py = center.y + (j < 2 ? -12 : 12);

        ctx.fillStyle = color + '80';
        ctx.beginPath();
        ctx.arc(px, py, LUDO2_CONSTANTS.PIECE_SIZE / 2 - 2, 0, Math.PI * 2);
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
        if (dx * dx + dy * dy < LUDO2_CONSTANTS.PIECE_SIZE * LUDO2_CONSTANTS.PIECE_SIZE) {
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

export { LUDO2_CONSTANTS as LUDO2_ENGINE_CONSTANTS };
