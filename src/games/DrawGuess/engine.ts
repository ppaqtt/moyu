export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: 'brush' | 'eraser';
}

export interface DrawGuessState {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  isDrawing: boolean;
  currentWord: string;
  timeLeft: number;
  score: number;
  round: number;
  maxRounds: number;
  gamePhase: 'waiting' | 'drawing' | 'guessing' | 'result';
  guesses: string[];
  correctGuess: boolean;
}

export const DRAWING_WORDS = [
  '苹果', '香蕉', '橙子', '葡萄', '西瓜',
  '猫', '狗', '兔子', '老虎', '大象',
  '汽车', '飞机', '轮船', '自行车', '火车',
  '太阳', '月亮', '星星', '云朵', '彩虹',
  '房子', '树', '花', '山', '河流',
  '手机', '电脑', '电视', '相机', '手表',
  '蛋糕', '冰淇淋', '披萨', '汉堡', '寿司',
  '吉他', '钢琴', '小提琴', '鼓', '喇叭',
  '雨伞', '帽子', '眼镜', '鞋子', '背包',
  '蝴蝶', '蜜蜂', '蚂蚁', '蜘蛛', '蜗牛'
];

export const COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#ff0088',
  '#8800ff', '#00ff88', '#ff4444', '#44ff44', '#4444ff',
  '#ffd700', '#ff6b9d', '#a855f7', '#22c55e', '#3b82f6'
];

export class DrawGuessEngine {
  private strokes: Stroke[] = [];
  private currentStroke: Stroke | null = null;
  private isDrawing: boolean = false;
  private currentWord: string = '';
  private timeLeft: number = 60;
  private score: number = 0;
  private round: number = 1;
  private maxRounds: number = 5;
  private gamePhase: DrawGuessState['gamePhase'] = 'waiting';
  private guesses: string[] = [];
  private correctGuess: boolean = false;
  private timerInterval: NodeJS.Timeout | null = null;
  private currentColor: string = '#000000';
  private currentWidth: number = 4;
  private currentTool: 'brush' | 'eraser' = 'brush';

  constructor() {
    this.init();
  }

  init(): void {
    this.strokes = [];
    this.currentStroke = null;
    this.isDrawing = false;
    this.currentWord = '';
    this.timeLeft = 60;
    this.score = 0;
    this.round = 1;
    this.gamePhase = 'waiting';
    this.guesses = [];
    this.correctGuess = false;
    this.currentColor = '#000000';
    this.currentWidth = 4;
    this.currentTool = 'brush';
    this.stopTimer();
  }

  getState(): DrawGuessState {
    return {
      strokes: [...this.strokes],
      currentStroke: this.currentStroke,
      isDrawing: this.isDrawing,
      currentWord: this.currentWord,
      timeLeft: this.timeLeft,
      score: this.score,
      round: this.round,
      maxRounds: this.maxRounds,
      gamePhase: this.gamePhase,
      guesses: [...this.guesses],
      correctGuess: this.correctGuess
    };
  }

  startGame(): void {
    this.round = 1;
    this.score = 0;
    this.startRound();
  }

  startRound(): void {
    this.strokes = [];
    this.currentStroke = null;
    this.guesses = [];
    this.correctGuess = false;
    this.timeLeft = 60;
    this.gamePhase = 'drawing';
    this.currentWord = DRAWING_WORDS[Math.floor(Math.random() * DRAWING_WORDS.length)];
    this.startTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.endRound();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  endRound(): void {
    this.stopTimer();
    this.gamePhase = 'result';
  }

  nextRound(): void {
    if (this.round < this.maxRounds) {
      this.round++;
      this.startRound();
    } else {
      this.gamePhase = 'waiting';
    }
  }

  startDrawing(x: number, y: number): void {
    if (this.gamePhase !== 'drawing') return;
    
    this.isDrawing = true;
    this.currentStroke = {
      points: [{ x, y }],
      color: this.currentTool === 'eraser' ? '#ffffff' : this.currentColor,
      width: this.currentWidth,
      tool: this.currentTool
    };
  }

  continueDrawing(x: number, y: number): void {
    if (!this.isDrawing || !this.currentStroke) return;
    
    this.currentStroke.points.push({ x, y });
  }

  endDrawing(): void {
    if (!this.isDrawing || !this.currentStroke) return;
    
    this.isDrawing = false;
    this.strokes.push(this.currentStroke);
    this.currentStroke = null;
  }

  setColor(color: string): void {
    this.currentColor = color;
    if (this.currentTool === 'eraser') {
      this.currentTool = 'brush';
    }
  }

  setWidth(width: number): void {
    this.currentWidth = width;
  }

  setTool(tool: 'brush' | 'eraser'): void {
    this.currentTool = tool;
  }

  undo(): void {
    if (this.strokes.length > 0) {
      this.strokes.pop();
    }
  }

  clear(): void {
    this.strokes = [];
    this.currentStroke = null;
  }

  makeGuess(guess: string): boolean {
    if (this.gamePhase !== 'drawing' && this.gamePhase !== 'guessing') return false;
    
    this.guesses.push(guess);
    
    if (guess.toLowerCase() === this.currentWord.toLowerCase()) {
      this.correctGuess = true;
      this.score += Math.max(10, this.timeLeft * 2);
      this.endRound();
      return true;
    }
    return false;
  }

  getHint(): string {
    if (!this.currentWord) return '';
    const hintLength = Math.ceil(this.currentWord.length / 2);
    return this.currentWord.substring(0, hintLength) + '...';
  }

  saveDrawing(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const stroke of this.strokes) {
      if (stroke.points.length < 2) continue;
      
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }

    return canvas.toDataURL('image/png');
  }

  reset(): void {
    this.init();
  }

  destroy(): void {
    this.stopTimer();
  }
}
