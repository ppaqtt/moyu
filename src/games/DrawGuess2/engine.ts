export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: 'brush' | 'eraser' | 'spray';
  opacity: number;
}

export interface DrawGuess2State {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  isDrawing: boolean;
  currentWord: string;
  hint: string;
  category: string;
  timeLeft: number;
  score: number;
  round: number;
  maxRounds: number;
  gamePhase: 'waiting' | 'playing' | 'guessing' | 'result';
  guesses: string[];
  correctGuess: boolean;
  currentTool: 'brush' | 'eraser' | 'spray';
  currentColor: string;
  currentWidth: number;
  layers: Stroke[][];
  currentLayer: number;
  showHint: boolean;
  hintIndex: number;
}

export const WORD_CATEGORIES = {
  animals: {
    name: '动物',
    words: ['猫', '狗', '兔子', '老虎', '大象', '熊猫', '猴子', '狮子', '豹子', '狐狸', '狼', '熊', '熊猫', '长颈鹿', '斑马', '企鹅', '鲸鱼', '海豚', '鲨鱼', '章鱼']
  },
  fruits: {
    name: '水果',
    words: ['苹果', '香蕉', '橙子', '葡萄', '西瓜', '草莓', '蓝莓', '菠萝', '芒果', '桃子', '梨', '樱桃', '柚子', '火龙果', '猕猴桃']
  },
  food: {
    name: '美食',
    words: ['蛋糕', '冰淇淋', '披萨', '汉堡', '寿司', '面条', '饺子', '包子', '炸鸡', '薯条', '咖啡', '奶茶', '牛排', '烤鸭', '火锅']
  },
  vehicles: {
    name: '交通工具',
    words: ['汽车', '飞机', '轮船', '自行车', '火车', '摩托车', '公交车', '地铁', '出租车', '卡车', '救护车', '消防车', '直升机', '火箭', '潜水艇']
  },
  nature: {
    name: '自然',
    words: ['太阳', '月亮', '星星', '云朵', '彩虹', '山峰', '河流', '大海', '森林', '沙漠', '瀑布', '火山', '冰川', '彩虹', '龙卷风']
  },
  objects: {
    name: '物品',
    words: ['手机', '电脑', '电视', '相机', '手表', '雨伞', '帽子', '眼镜', '鞋子', '背包', '书本', '台灯', '椅子', '桌子', '床']
  },
  music: {
    name: '音乐',
    words: ['吉他', '钢琴', '小提琴', '鼓', '喇叭', '麦克风', '耳机', '音箱', '笛子', '口琴', '萨克斯', '架子鼓', '电子琴', '二胡', '琵琶']
  },
  sports: {
    name: '运动',
    words: ['足球', '篮球', '网球', '羽毛球', '乒乓球', '排球', '高尔夫', '滑雪', '冲浪', '潜水', '拳击', '摔跤', '射箭', '滑冰', '帆船']
  }
};

export const COLORS = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#ff0088',
  '#8800ff', '#00ff88', '#ff4444', '#44ff44', '#4444ff',
  '#ffd700', '#ff6b9d', '#a855f7', '#22c55e', '#3b82f6',
  '#8b4513', '#deb887', '#f5f5dc', '#696969', '#2f4f4f'
];

export const BRUSH_SIZES = [2, 4, 8, 12, 16, 24, 32];

export class DrawGuess2Engine {
  private strokes: Stroke[] = [];
  private currentStroke: Stroke | null = null;
  private isDrawing: boolean = false;
  private currentWord: string = '';
  private hint: string = '';
  private category: string = 'animals';
  private timeLeft: number = 90;
  private score: number = 0;
  private round: number = 1;
  private maxRounds: number = 5;
  private gamePhase: DrawGuess2State['gamePhase'] = 'waiting';
  private guesses: string[] = [];
  private correctGuess: boolean = false;
  private currentTool: DrawGuess2State['currentTool'] = 'brush';
  private currentColor: string = '#000000';
  private currentWidth: number = 4;
  private timerInterval: NodeJS.Timeout | null = null;
  private layers: Stroke[][] = [[]];
  private currentLayer: number = 0;
  private showHint: boolean = false;
  private hintIndex: number = 0;
  private history: Stroke[][] = [];

  constructor() {
    this.init();
  }

  init(): void {
    this.strokes = [];
    this.currentStroke = null;
    this.isDrawing = false;
    this.currentWord = '';
    this.hint = '';
    this.category = 'animals';
    this.timeLeft = 90;
    this.score = 0;
    this.round = 1;
    this.gamePhase = 'waiting';
    this.guesses = [];
    this.correctGuess = false;
    this.currentTool = 'brush';
    this.currentColor = '#000000';
    this.currentWidth = 4;
    this.layers = [[]];
    this.currentLayer = 0;
    this.showHint = false;
    this.hintIndex = 0;
    this.history = [];
    this.stopTimer();
  }

  getState(): DrawGuess2State {
    return {
      strokes: [...this.strokes],
      currentStroke: this.currentStroke,
      isDrawing: this.isDrawing,
      currentWord: this.currentWord,
      hint: this.hint,
      category: this.category,
      timeLeft: this.timeLeft,
      score: this.score,
      round: this.round,
      maxRounds: this.maxRounds,
      gamePhase: this.gamePhase,
      guesses: [...this.guesses],
      correctGuess: this.correctGuess,
      currentTool: this.currentTool,
      currentColor: this.currentColor,
      currentWidth: this.currentWidth,
      layers: [...this.layers],
      currentLayer: this.currentLayer,
      showHint: this.showHint,
      hintIndex: this.hintIndex
    };
  }

  setCategory(category: string): void {
    if (WORD_CATEGORIES[category as keyof typeof WORD_CATEGORIES]) {
      this.category = category;
    }
  }

  startGame(): void {
    this.round = 1;
    this.score = 0;
    this.startRound();
  }

  startRound(): void {
    this.saveToHistory();
    this.strokes = [];
    this.currentStroke = null;
    this.guesses = [];
    this.correctGuess = false;
    this.timeLeft = 90;
    this.showHint = false;
    this.hintIndex = 0;
    this.layers = [[]];
    this.currentLayer = 0;
    this.gamePhase = 'playing';
    
    const cat = WORD_CATEGORIES[this.category as keyof typeof WORD_CATEGORIES];
    this.currentWord = cat.words[Math.floor(Math.random() * cat.words.length)];
    this.hint = this.currentWord.substring(0, 1) + '...' + this.currentWord.substring(this.currentWord.length - 1);
    
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

  private saveToHistory(): void {
    this.history.push([...this.strokes]);
    if (this.history.length > 20) {
      this.history.shift();
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
    if (this.gamePhase !== 'playing') return;
    
    this.isDrawing = true;
    this.currentStroke = {
      points: [{ x, y }],
      color: this.currentTool === 'eraser' ? '#ffffff' : this.currentColor,
      width: this.currentTool === 'spray' ? this.currentWidth * 3 : this.currentWidth,
      tool: this.currentTool,
      opacity: this.currentTool === 'spray' ? 0.3 : 1
    };
  }

  continueDrawing(x: number, y: number): void {
    if (!this.isDrawing || !this.currentStroke) return;
    
    if (this.currentTool === 'spray') {
      const numPoints = 5;
      for (let i = 0; i < numPoints; i++) {
        const offsetX = (Math.random() - 0.5) * this.currentWidth * 3;
        const offsetY = (Math.random() - 0.5) * this.currentWidth * 3;
        this.currentStroke.points.push({ x: x + offsetX, y: y + offsetY });
      }
    } else {
      this.currentStroke.points.push({ x, y });
    }
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

  setTool(tool: 'brush' | 'eraser' | 'spray'): void {
    this.currentTool = tool;
  }

  undo(): void {
    if (this.strokes.length > 0) {
      this.saveToHistory();
      this.strokes.pop();
    }
  }

  redo(): void {
    if (this.history.length > 0) {
      this.strokes = this.history.pop() || [];
    }
  }

  clear(): void {
    this.saveToHistory();
    this.strokes = [];
    this.currentStroke = null;
  }

  addLayer(): void {
    if (this.layers.length < 5) {
      this.layers.push([]);
      this.currentLayer = this.layers.length - 1;
    }
  }

  switchLayer(index: number): void {
    if (index >= 0 && index < this.layers.length) {
      this.currentLayer = index;
    }
  }

  toggleHint(): void {
    this.showHint = !this.showHint;
    if (this.showHint && this.hintIndex < this.currentWord.length) {
      this.hintIndex = Math.min(this.hintIndex + 2, this.currentWord.length);
    }
  }

  getCurrentHint(): string {
    if (!this.currentWord) return '';
    const revealed = Math.min(this.hintIndex, this.currentWord.length);
    let hint = '';
    for (let i = 0; i < this.currentWord.length; i++) {
      if (i < revealed) {
        hint += this.currentWord[i];
      } else {
        hint += '○';
      }
    }
    return hint;
  }

  makeGuess(guess: string): boolean {
    if (this.gamePhase !== 'playing') return false;
    
    this.guesses.push(guess);
    
    if (guess.toLowerCase() === this.currentWord.toLowerCase()) {
      this.correctGuess = true;
      const timeBonus = Math.max(0, this.timeLeft);
      const baseScore = 50;
      this.score += baseScore + timeBonus;
      this.endRound();
      return true;
    }
    return false;
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
      ctx.globalAlpha = stroke.opacity;
      
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    return canvas.toDataURL('image/png');
  }

  reset(): void {
    this.init();
  }

  destroy(): void {
    this.stopTimer();
  }
}
