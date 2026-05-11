export interface PuzzlePiece {
  id: number;
  correctX: number;
  correctY: number;
  currentX: number;
  currentY: number;
  holidayType: string;
  emoji: string;
  color: string;
}

export interface GameState {
  pieces: PuzzlePiece[];
  gridSize: number;
  moves: number;
  startTime: number;
  isComplete: boolean;
  currentHoliday: string;
}

export interface HolidayJigsawEngine {
  initialize(gridSize: number, holidayType: string): void;
  movePiece(pieceId: number, newX: number, newY: number): boolean;
  checkCompletion(): boolean;
  getState(): GameState;
  shuffle(): void;
  getGridSize(): number;
  getMoves(): number;
  isComplete(): boolean;
  getHolidays(): { type: string; name: string; emojis: string[]; colors: string[] }[];
}

const HOLIDAYS = [
  {
    type: 'spring',
    name: '春节',
    emojis: ['🧧', '🎆', '🏮', '🐲', '🎊', '🥟', '🎋', '🎉', '🧨'],
    colors: ['#ff0000', '#ff6600', '#ffcc00', '#ff3366', '#ff6699']
  },
  {
    type: 'christmas',
    name: '圣诞节',
    emojis: ['🎄', '🎁', '🎅', '❄️', '⛄', '🔔', '🎶', '⭐', '🍪'],
    colors: ['#006600', '#cc0000', '#ffffff', '#ff6600', '#ffff00']
  },
  {
    type: 'midautumn',
    name: '中秋节',
    emojis: ['🥮', '🌕', '🐰', '🏮', '🌸', '🍵', '🎑', '✨', '🌙'],
    colors: ['#ffcc00', '#fffacd', '#ff9966', '#996633', '#cc9966']
  },
  {
    type: 'newyear',
    name: '新年',
    emojis: ['🎊', '🎉', '🥳', '🍾', '🎆', '✨', '🎈', '🎁', '🎇'],
    colors: ['#ff0066', '#ff6600', '#00ccff', '#9900ff', '#ffcc00']
  }
];

export class HolidayJigsawEngineClass implements HolidayJigsawEngine {
  private pieces: PuzzlePiece[] = [];
  private gridSize: number = 3;
  private moves: number = 0;
  private startTime: number = 0;
  private gameCompleted: boolean = false;
  private currentHoliday: string = 'spring';

  public initialize(gridSize: number, holidayType: string): void {
    this.gridSize = gridSize;
    this.currentHoliday = holidayType;
    this.pieces = [];
    this.moves = 0;
    this.startTime = Date.now();
    this.gameCompleted = false;

    const holiday = HOLIDAYS.find(h => h.type === holidayType) || HOLIDAYS[0];

    let id = 0;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const emojiIndex = id % holiday.emojis.length;
        const colorIndex = id % holiday.colors.length;
        this.pieces.push({
          id: id++,
          correctX: x,
          correctY: y,
          currentX: x,
          currentY: y,
          holidayType: holidayType,
          emoji: holiday.emojis[emojiIndex],
          color: holiday.colors[colorIndex]
        });
      }
    }
    this.shuffle();
  }

  public shuffle(): void {
    const positions: { x: number; y: number }[] = [];
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        positions.push({ x, y });
      }
    }

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    let idx = 0;
    for (const piece of this.pieces) {
      piece.currentX = positions[idx].x;
      piece.currentY = positions[idx].y;
      idx++;
    }
    
    this.moves = 0;
    this.startTime = Date.now();
    this.gameCompleted = false;
  }

  public movePiece(pieceId: number, newX: number, newY: number): boolean {
    const piece = this.pieces.find(p => p.id === pieceId);
    if (!piece) return false;

    const targetPiece = this.pieces.find(p => 
      p.currentX === newX && p.currentY === newY
    );
    
    if (!targetPiece) return false;

    const tempX = piece.currentX;
    const tempY = piece.currentY;
    piece.currentX = newX;
    piece.currentY = newY;
    targetPiece.currentX = tempX;
    targetPiece.currentY = tempY;

    this.moves++;
    
    if (this.checkCompletion()) {
      this.gameCompleted = true;
    }

    return true;
  }

  public checkCompletion(): boolean {
    return this.pieces.every(p => 
      p.currentX === p.correctX && p.currentY === p.correctY
    );
  }

  public getState(): GameState {
    return {
      pieces: this.pieces.map(p => ({ ...p })),
      gridSize: this.gridSize,
      moves: this.moves,
      startTime: this.startTime,
      isComplete: this.gameCompleted,
      currentHoliday: this.currentHoliday
    };
  }

  public getGridSize(): number {
    return this.gridSize;
  }

  public getMoves(): number {
    return this.moves;
  }

  public isComplete(): boolean {
    return this.gameCompleted;
  }

  public getHolidays() {
    return HOLIDAYS;
  }
}

export const HolidayJigsawEngine = HolidayJigsawEngineClass;
