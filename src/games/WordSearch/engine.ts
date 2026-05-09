// 文字搜索游戏引擎
export interface Position {
  row: number;
  col: number;
}

export interface Word {
  word: string;
  found: boolean;
  positions: Position[];
  direction: 'horizontal' | 'vertical' | 'diagonal' | 'diagonal_up';
}

export interface CellSelection {
  start: Position;
  end: Position;
}

export interface GameState {
  grid: string[][];
  words: Word[];
  foundWords: number;
  totalWords: number;
  timeRemaining: number;
  score: number;
  isComplete: boolean;
  isTimeUp: boolean;
  gridSize: number;
}

export class WordSearchEngine {
  private grid: string[][] = [];
  private words: Word[] = [];
  private gridSize: number = 10;
  private timeLimit: number = 120; // 秒
  private timeRemaining: number = 120;
  private score: number = 0;
  private foundWords: number = 0;
  private isComplete: boolean = false;
  private isTimeUp: boolean = false;
  private timerInterval: number | null = null;

  // 中文词语库
  private readonly wordBank = [
    // 4字词语
    '开心', '快乐', '阳光', '月亮', '星星', '天空', '白云', '彩虹', '清风', '细雨',
    '春天', '夏天', '秋天', '冬天', '花朵', '绿叶', '森林', '大海', '高山', '河流',
    // 5字词语
    '计算机', '互联网', '智能手机', '平板电脑', '游戏机', '电影院', '图书馆', '体育馆',
    '游泳池', '游乐园', '动物园', '植物园', '博物馆', '科技馆', '艺术馆', '音乐厅',
    // 6字词语
    '人工智能', '大数据', '云计算', '物联网', '虚拟现实', '增强现实', '区块链',
    '机器学习', '深度学习', '神经网络', '自动驾驶', '智能家居', '智慧城市',
    // 常见词汇
    '学习', '工作', '生活', '家庭', '朋友', '爱情', '旅行', '美食', '音乐', '电影',
    '读书', '运动', '健康', '快乐', '幸福', '梦想', '希望', '未来', '科技', '创新',
    '设计', '开发', '测试', '发布', '更新', '优化', '改进', '提高', '增强', '扩展',
    // 更多词语
    '足球', '篮球', '排球', '网球', '羽毛球', '乒乓球', '游泳', '跑步', '健身', '瑜伽',
    '苹果', '香蕉', '橙子', '葡萄', '西瓜', '草莓', '芒果', '菠萝', '樱桃', '柠檬',
    '电脑', '鼠标', '键盘', '屏幕', '耳机', '音箱', '相机', '手机', '平板', '手环',
    '北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆'
  ];

  constructor(gridSize: number = 10, timeLimit: number = 120) {
    this.gridSize = Math.min(Math.max(gridSize, 8), 15);
    this.timeLimit = Math.min(Math.max(timeLimit, 60), 300);
    this.timeRemaining = this.timeLimit;
    this.reset();
  }

  public reset(): void {
    this.words = [];
    this.foundWords = 0;
    this.score = 0;
    this.isComplete = false;
    this.isTimeUp = false;
    this.timeRemaining = this.timeLimit;

    // 创建空网格
    this.grid = Array.from({ length: this.gridSize }, () => 
      Array.from({ length: this.gridSize }, () => '')
    );

    // 放置词语
    this.placeWords();
    
    // 填充空白位置
    this.fillEmptyCells();
  }

  private placeWords(): void {
    const shuffledWords = this.shuffle([...this.wordBank]);
    const directions: { dx: number; dy: number; name: 'horizontal' | 'vertical' | 'diagonal' | 'diagonal_up' }[] = [
      { dx: 1, dy: 0, name: 'horizontal' },
      { dx: 0, dy: 1, name: 'vertical' },
      { dx: 1, dy: 1, name: 'diagonal' },
      { dx: 1, dy: -1, name: 'diagonal_up' }
    ];

    // 计算要放置的词语数量
    const wordCount = Math.min(Math.floor(this.gridSize * 1.5), 10);

    for (const word of shuffledWords) {
      if (this.words.length >= wordCount) break;
      
      // 随机选择方向
      const shuffledDirs = this.shuffle([...directions]);
      
      for (const dir of shuffledDirs) {
        const positions = this.tryPlaceWord(word, dir);
        if (positions) {
          this.words.push({
            word,
            found: false,
            positions,
            direction: dir.name
          });
          break;
        }
      }
    }
  }

  private tryPlaceWord(word: string, dir: { dx: number; dy: number; name: any }): Position[] | null {
    const positions: Position[] = [];
    
    // 计算所有可能的位置
    let startRow: number, endRow: number, startCol: number, endCol: number;
    
    if (dir.dy === 0) {
      startRow = 0;
      endRow = this.gridSize - 1;
      startCol = 0;
      endCol = this.gridSize - word.length;
    } else if (dir.dx === 0) {
      startRow = 0;
      endRow = this.gridSize - word.length;
      startCol = 0;
      endCol = this.gridSize - 1;
    } else if (dir.dy === 1) {
      startRow = 0;
      endRow = this.gridSize - word.length;
      startCol = 0;
      endCol = this.gridSize - word.length;
    } else {
      startRow = word.length - 1;
      endRow = this.gridSize - 1;
      startCol = 0;
      endCol = this.gridSize - word.length;
    }

    // 尝试所有可能位置
    const attempts = 100;
    for (let i = 0; i < attempts; i++) {
      const startX = startCol + Math.floor(Math.random() * (endCol - startCol + 1));
      const startY = startRow + Math.floor(Math.random() * (endRow - startRow + 1));
      
      positions.length = 0;
      let canPlace = true;

      for (let j = 0; j < word.length; j++) {
        const x = startX + j * dir.dx;
        const y = startY + j * dir.dy;
        
        if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
          canPlace = false;
          break;
        }

        const existingChar = this.grid[y][x];
        if (existingChar !== '' && existingChar !== word[j]) {
          canPlace = false;
          break;
        }

        positions.push({ row: y, col: x });
      }

      if (canPlace) {
        // 放置词语
        for (let j = 0; j < word.length; j++) {
          this.grid[positions[j].row][positions[j].col] = word[j];
        }
        return positions;
      }
    }

    return null;
  }

  private fillEmptyCells(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (this.grid[row][col] === '') {
          this.grid[row][col] = chars[Math.floor(Math.random() * chars.length)];
        }
      }
    }
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  public selectCells(start: Position, end: Position): boolean {
    if (this.isComplete || this.isTimeUp) return false;

    const selectedPositions = this.getPositionsBetween(start, end);
    const selectedWord = selectedPositions.map(p => this.grid[p.row][p.col]).join('');

    // 检查是否匹配任何未找到的词语
    for (const word of this.words) {
      if (word.found) continue;
      
      const wordStr = word.word;
      
      // 正向匹配
      if (selectedWord === wordStr) {
        word.found = true;
        this.foundWords++;
        this.score += wordStr.length * 10;
        
        if (this.foundWords === this.words.length) {
          this.isComplete = true;
        }
        return true;
      }
      
      // 反向匹配
      const reversedWord = wordStr.split('').reverse().join('');
      if (selectedWord === reversedWord) {
        word.found = true;
        this.foundWords++;
        this.score += wordStr.length * 10;
        
        if (this.foundWords === this.words.length) {
          this.isComplete = true;
        }
        return true;
      }
    }

    return false;
  }

  private getPositionsBetween(start: Position, end: Position): Position[] {
    const positions: Position[] = [];
    
    const dRow = end.row - start.row;
    const dCol = end.col - start.col;
    
    // 必须是直线（水平、垂直、对角线）
    if (dRow !== 0 && dCol !== 0 && Math.abs(dRow) !== Math.abs(dCol)) {
      return [start];
    }
    
    const steps = Math.max(Math.abs(dRow), Math.abs(dCol));
    const stepRow = steps === 0 ? 0 : dRow / steps;
    const stepCol = steps === 0 ? 0 : dCol / steps;
    
    for (let i = 0; i <= steps; i++) {
      positions.push({
        row: start.row + i * stepRow,
        col: start.col + i * stepCol
      });
    }
    
    return positions;
  }

  public startTimer(callback?: () => void): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.timerInterval = window.setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.isTimeUp = true;
        this.stopTimer();
        if (callback) callback();
      }
    }, 1000);
  }

  public stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public getState(): GameState {
    return {
      grid: this.grid.map(row => [...row]),
      words: this.words.map(w => ({ ...w, positions: [...w.positions] })),
      foundWords: this.foundWords,
      totalWords: this.words.length,
      timeRemaining: this.timeRemaining,
      score: this.score,
      isComplete: this.isComplete,
      isTimeUp: this.isTimeUp,
      gridSize: this.gridSize
    };
  }

  public tick(): void {
    // 由外部计时器驱动
  }

  public getGrid(): string[][] {
    return this.grid.map(row => [...row]);
  }

  public getWords(): Word[] {
    return this.words.map(w => ({ ...w, positions: [...w.positions] }));
  }

  public getFoundWords(): number {
    return this.foundWords;
  }

  public getTotalWords(): number {
    return this.words.length;
  }

  public getTimeRemaining(): number {
    return this.timeRemaining;
  }

  public getScore(): number {
    return this.score;
  }

  public isGameComplete(): boolean {
    return this.isComplete;
  }

  public isGameOver(): boolean {
    return this.isTimeUp;
  }

  public getHint(): string | null {
    // 找一个未找到的词语
    const unfound = this.words.find(w => !w.found);
    return unfound ? unfound.word : null;
  }

  public setGridSize(size: number): void {
    this.gridSize = Math.min(Math.max(size, 8), 15);
  }

  public setTimeLimit(time: number): void {
    this.timeLimit = Math.min(Math.max(time, 60), 300);
  }
}
