// 打字练习游戏引擎

export interface TextSample {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface KeyStat {
  key: string;
  totalPresses: number;
  correctPresses: number;
  errors: number;
}

export interface GameState {
  currentText: string;
  userInput: string;
  currentIndex: number;
  startTime: number | null;
  endTime: number | null;
  totalChars: number;
  correctChars: number;
  errorCount: number;
  isComplete: boolean;
  wpm: number;
  accuracy: number;
  timeRemaining: number;
  mode: 'time' | 'practice';
}

export const TEXT_SAMPLES: TextSample[] = [
  // 简单 - 常用短句
  { id: '1', text: 'Hello World! This is a typing test.', difficulty: 'easy', category: '英语' },
  { id: '2', text: 'The quick brown fox jumps over the lazy dog.', difficulty: 'easy', category: '英语' },
  { id: '3', text: 'Practice makes perfect. Keep trying!', difficulty: 'easy', category: '英语' },
  { id: '4', text: 'Welcome to the typing practice game!', difficulty: 'easy', category: '英语' },
  { id: '5', text: 'Learning to type fast is a useful skill.', difficulty: 'easy', category: '英语' },
  { id: '6', text: '你好，欢迎来到打字练习游戏。', difficulty: 'easy', category: '中文' },
  { id: '7', text: '每天练习十分钟，打字速度会越来越快。', difficulty: 'easy', category: '中文' },
  { id: '8', text: '加油！你一定可以打得又快又准。', difficulty: 'easy', category: '中文' },
  
  // 中等 - 中等长度句子
  { id: '9', text: 'Programming is the art of telling a computer what to do through a set of instructions.', difficulty: 'medium', category: '技术' },
  { id: '10', text: 'JavaScript is a versatile language that can be used for web development, server scripts, and more.', difficulty: 'medium', category: '技术' },
  { id: '11', text: 'React is one of the most popular JavaScript libraries for building user interfaces.', difficulty: 'medium', category: '技术' },
  { id: '12', text: 'TypeScript adds static typing to JavaScript, making code more reliable and easier to maintain.', difficulty: 'medium', category: '技术' },
  { id: '13', text: 'The best way to predict the future is to create it with your own hands and determination.', difficulty: 'medium', category: '英语' },
  { id: '14', text: 'In the middle of difficulty lies opportunity. Success is not final, failure is not fatal.', difficulty: 'medium', category: '英语' },
  { id: '15', text: '互联网改变了人们的生活方式，让信息传播变得前所未有的快捷和便利。', difficulty: 'medium', category: '中文' },
  { id: '16', text: '人工智能技术的发展正在深刻影响着各行各业的未来走向。', difficulty: 'medium', category: '中文' },
  
  // 困难 - 长段落
  { id: '17', text: 'Software engineering is both an engineering discipline and a computer science discipline. It involves the application of scientific and mathematical principles to practical ends, particularly the specification, design, development, testing, deployment, and maintenance of software systems.', difficulty: 'hard', category: '技术' },
  { id: '18', text: 'Machine learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed. It uses algorithms to identify patterns and make decisions with minimal human intervention, powering everything from recommendation systems to autonomous vehicles.', difficulty: 'hard', category: '技术' },
  { id: '19', text: 'Cloud computing has revolutionized the way businesses operate by providing scalable, on-demand access to computing resources over the internet. Companies can now deploy applications faster, reduce infrastructure costs, and scale their operations based on actual usage needs.', difficulty: 'hard', category: '技术' },
  { id: '20', text: 'The human brain is an extraordinarily complex organ composed of approximately 86 billion neurons, each connected to thousands of others through synapses. This intricate network enables us to think, feel, remember, and perceive the world around us in remarkable ways.', difficulty: 'hard', category: '英语' },
  { id: '21', text: '科技创新是推动社会进步的第一动力。从火的发明到电的利用，从蒸汽机到互联网，每一次重大的技术突破都深刻改变了人类的生产方式和生活方式，推动了人类文明的跨越式发展。', difficulty: 'hard', category: '中文' },
  { id: '22', text: '在当今数字化时代，数据已经成为像石油一样宝贵的战略资源。大数据分析、人工智能、机器学习等技术的发展都离不开海量数据的支撑，数据驱动的决策正在各行各业发挥着越来越重要的作用。', difficulty: 'hard', category: '中文' },
];

export class TypingMasterEngine {
  private currentText: string = '';
  private userInput: string = '';
  private currentIndex: number = 0;
  private startTime: number | null = null;
  private endTime: number | null = null;
  private correctChars: number = 0;
  private errorCount: number = 0;
  private isComplete: boolean = false;
  private timeLimit: number = 60; // seconds
  private timeRemaining: number = 60;
  private timerInterval: number | null = null;
  private mode: 'time' | 'practice' = 'time';
  private difficulty: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed';
  private keyStats: Map<string, KeyStat> = new Map();
  private usedSampleIds: Set<string> = new Set();
  private totalTexts: number = 3;
  private currentTextIndex: number = 0;

  constructor(mode: 'time' | 'practice' = 'time', difficulty: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed', timeLimit: number = 60) {
    this.mode = mode;
    this.difficulty = difficulty;
    this.timeLimit = timeLimit;
    this.timeRemaining = timeLimit;
    this.reset();
  }

  public reset(): void {
    this.currentText = '';
    this.userInput = '';
    this.currentIndex = 0;
    this.startTime = null;
    this.endTime = null;
    this.correctChars = 0;
    this.errorCount = 0;
    this.isComplete = false;
    this.timeRemaining = this.timeLimit;
    this.keyStats = new Map();
    this.usedSampleIds = new Set();
    this.currentTextIndex = 0;
    
    // Select first text
    this.selectNextText();
  }

  private getAvailableTexts(): TextSample[] {
    return TEXT_SAMPLES.filter(t => {
      if (this.usedSampleIds.has(t.id)) return false;
      if (this.difficulty === 'mixed') return true;
      return t.difficulty === this.difficulty;
    });
  }

  private selectNextText(): void {
    const available = this.getAvailableTexts();
    if (available.length === 0) {
      // Reset if all texts used
      this.usedSampleIds.clear();
      const texts = TEXT_SAMPLES.filter(t => {
        if (this.difficulty === 'mixed') return true;
        return t.difficulty === this.difficulty;
      });
      if (texts.length > 0) {
        this.currentText = texts[Math.floor(Math.random() * texts.length)].text;
      }
    } else {
      const sample = available[Math.floor(Math.random() * available.length)];
      this.currentText = sample.text;
      this.usedSampleIds.add(sample.id);
    }
    this.currentTextIndex++;
  }

  public start(): void {
    if (!this.startTime) {
      this.startTime = Date.now();
    }
    
    if (this.mode === 'time' && !this.timerInterval) {
      this.timerInterval = window.setInterval(() => {
        this.timeRemaining--;
        if (this.timeRemaining <= 0) {
          this.end();
        }
      }, 1000);
    }
  }

  public end(): void {
    if (!this.endTime) {
      this.endTime = Date.now();
    }
    this.isComplete = true;
    this.stopTimer();
  }

  public stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public inputKey(key: string): void {
    if (this.isComplete) return;

    // Start timer on first input
    if (this.startTime === null) {
      this.startTime = Date.now();
    }

    if (key.length === 1) {
      this.processChar(key);
    }
  }

  private processChar(char: string): void {
    if (this.currentIndex >= this.currentText.length) {
      // Move to next text
      if (this.mode === 'practice' && this.currentTextIndex < this.totalTexts) {
        this.selectNextText();
        this.userInput = '';
        this.currentIndex = 0;
        this.correctChars = 0;
        return;
      } else if (this.mode === 'practice') {
        this.end();
        return;
      }
      return;
    }

    const expectedChar = this.currentText[this.currentIndex];
    const isCorrect = char === expectedChar;

    // Update key stats
    this.updateKeyStat(char, expectedChar);

    if (isCorrect) {
      this.correctChars++;
    } else {
      this.errorCount++;
    }

    this.userInput += char;
    this.currentIndex++;

    // Check if text complete
    if (this.currentIndex >= this.currentText.length) {
      if (this.mode === 'practice' && this.currentTextIndex < this.totalTexts) {
        // Continue to next text
        this.selectNextText();
        this.userInput = '';
        this.currentIndex = 0;
        this.correctChars = 0;
      } else if (this.mode === 'practice') {
        this.end();
      } else {
        // In time mode, just continue (no next text)
        this.selectNextText();
        this.userInput = '';
        this.currentIndex = 0;
        this.correctChars = 0;
      }
    }
  }

  private updateKeyStat(input: string, expected: string): void {
    const key = expected;
    let stat = this.keyStats.get(key);
    
    if (!stat) {
      stat = { key, totalPresses: 0, correctPresses: 0, errors: 0 };
      this.keyStats.set(key, stat);
    }
    
    stat.totalPresses++;
    if (input === expected) {
      stat.correctPresses++;
    } else {
      stat.errors++;
    }
  }

  public deleteChar(): void {
    if (this.currentIndex > 0 && !this.isComplete) {
      this.currentIndex--;
      this.userInput = this.userInput.slice(0, -1);
    }
  }

  public getWPM(): number {
    if (!this.startTime) return 0;
    
    const elapsed = this.endTime 
      ? (this.endTime - this.startTime) / 1000 
      : (Date.now() - this.startTime) / 1000;
    
    if (elapsed < 1) return 0;
    
    // Standard: 5 characters = 1 word
    const words = this.correctChars / 5;
    const minutes = elapsed / 60;
    
    return Math.round(words / minutes);
  }

  public getAccuracy(): number {
    const total = this.correctChars + this.errorCount;
    if (total === 0) return 100;
    return Math.round((this.correctChars / total) * 100);
  }

  public getProgress(): number {
    if (!this.currentText) return 0;
    return Math.round((this.currentIndex / this.currentText.length) * 100);
  }

  public getState(): GameState {
    return {
      currentText: this.currentText,
      userInput: this.userInput,
      currentIndex: this.currentIndex,
      startTime: this.startTime,
      endTime: this.endTime,
      totalChars: this.currentText.length,
      correctChars: this.correctChars,
      errorCount: this.errorCount,
      isComplete: this.isComplete,
      wpm: this.getWPM(),
      accuracy: this.getAccuracy(),
      timeRemaining: this.timeRemaining,
      mode: this.mode
    };
  }

  public getCurrentText(): string {
    return this.currentText;
  }

  public getUserInput(): string {
    return this.userInput;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public getCorrectChars(): number {
    return this.correctChars;
  }

  public getErrorCount(): number {
    return this.errorCount;
  }

  public getTimeRemaining(): number {
    return this.timeRemaining;
  }

  public getWPMFinal(): number {
    return this.getWPM();
  }

  public getAccuracyFinal(): number {
    return this.getAccuracy();
  }

  public isGameComplete(): boolean {
    return this.isComplete;
  }

  public getMode(): 'time' | 'practice' {
    return this.mode;
  }

  public getKeyStats(): KeyStat[] {
    return Array.from(this.keyStats.values()).sort((a, b) => b.errors - a.errors);
  }

  public getWeakKeys(): KeyStat[] {
    return this.getKeyStats().filter(s => s.errors > 0 && s.errors / s.totalPresses > 0.2).slice(0, 5);
  }

  public setMode(mode: 'time' | 'practice'): void {
    this.mode = mode;
  }

  public setDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'mixed'): void {
    this.difficulty = difficulty;
  }

  public setTimeLimit(seconds: number): void {
    this.timeLimit = Math.min(Math.max(seconds, 30), 300);
    this.timeRemaining = this.timeLimit;
  }
}
