// Translate Challenge Game Engine - 翻译挑战游戏引擎

export interface Sentence {
  id: string;
  english: string;
  chinese: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GameState {
  score: number;
  combo: number;
  mistakes: number;
  currentSentence: Sentence | null;
  userAnswer: string;
  gameOver: boolean;
  level: number;
  isPlaying: boolean;
  showResult: boolean;
  isCorrect: boolean;
  timeLeft: number;
}

// Sentence database
export const SENTENCE_DATABASE: Sentence[] = [
  // Easy
  { id: 'e1', english: 'Hello, how are you?', chinese: '你好，你好吗？', difficulty: 'easy' },
  { id: 'e2', english: 'I love learning.', chinese: '我喜欢学习。', difficulty: 'easy' },
  { id: 'e3', english: 'The sky is blue.', chinese: '天空是蓝色的。', difficulty: 'easy' },
  { id: 'e4', english: 'She is my friend.', chinese: '她是我的朋友。', difficulty: 'easy' },
  { id: 'e5', english: 'Good morning!', chinese: '早上好！', difficulty: 'easy' },
  { id: 'e6', english: 'What is your name?', chinese: '你叫什么名字？', difficulty: 'easy' },
  { id: 'e7', english: 'Thank you very much.', chinese: '非常感谢你。', difficulty: 'easy' },
  { id: 'e8', english: 'Nice to meet you.', chinese: '很高兴认识你。', difficulty: 'easy' },
  { id: 'e9', english: 'How old are you?', chinese: '你多大了？', difficulty: 'easy' },
  { id: 'e10', english: 'I am hungry.', chinese: '我饿了。', difficulty: 'easy' },
  
  // Medium
  { id: 'm1', english: 'Practice makes perfect.', chinese: '熟能生巧。', difficulty: 'medium' },
  { id: 'm2', english: 'Time flies fast.', chinese: '时光飞逝。', difficulty: 'medium' },
  { id: 'm3', english: 'Knowledge is power.', chinese: '知识就是力量。', difficulty: 'medium' },
  { id: 'm4', english: 'Actions speak louder.', chinese: '行动胜于言辞。', difficulty: 'medium' },
  { id: 'm5', english: 'Every day is a new day.', chinese: '每一天都是新的一天。', difficulty: 'medium' },
  { id: 'm6', english: 'The early bird catches the worm.', chinese: '早起的鸟儿有虫吃。', difficulty: 'medium' },
  { id: 'm7', english: 'No pain, no gain.', chinese: '一分耕耘，一分收获。', difficulty: 'medium' },
  { id: 'm8', english: 'Where there is a will, there is a way.', chinese: '有志者事竟成。', difficulty: 'medium' },
  { id: 'm9', english: 'All roads lead to Rome.', chinese: '条条大路通罗马。', difficulty: 'medium' },
  { id: 'm10', english: 'Better late than never.', chinese: '迟做总比不做好。', difficulty: 'medium' },
  
  // Hard
  { id: 'h1', english: 'Success is the sum of small efforts repeated day in and day out.', chinese: '成功是日复一日重复努力的总和。', difficulty: 'hard' },
  { id: 'h2', english: 'The only way to do great work is to love what you do.', chinese: '做伟大工作的唯一方法是热爱你所做的事。', difficulty: 'hard' },
  { id: 'h3', english: 'Life is what happens when you are busy making other plans.', chinese: '生活就是当你忙于制定其他计划时发生的事。', difficulty: 'hard' },
  { id: 'h4', english: 'In the middle of difficulty lies opportunity.', chinese: '困难之中蕴含着机遇。', difficulty: 'hard' },
  { id: 'h5', english: 'The future belongs to those who believe in the beauty of their dreams.', chinese: '未来属于那些相信梦想之美的人。', difficulty: 'hard' },
];

export class TranslateChallengeEngine {
  private score: number = 0;
  private combo: number = 0;
  private mistakes: number = 0;
  private currentSentence: Sentence | null = null;
  private userAnswer: string = '';
  private gameOver: boolean = false;
  private level: number = 1;
  private isPlaying: boolean = false;
  private showResult: boolean = false;
  private isCorrect: boolean = false;
  private timeLeft: number = 60;
  private usedSentences: Set<string> = new Set();
  private difficulty: 'easy' | 'medium' | 'hard' = 'easy';

  constructor(difficulty: 'easy' | 'medium' | 'hard' = 'easy') {
    this.difficulty = difficulty;
  }

  public startGame(): void {
    this.score = 0;
    this.combo = 0;
    this.mistakes = 0;
    this.gameOver = false;
    this.level = 1;
    this.isPlaying = true;
    this.showResult = false;
    this.isCorrect = false;
    this.timeLeft = this.getTimeLimit();
    this.usedSentences.clear();
    this.nextSentence();
  }

  private getTimeLimit(): number {
    switch (this.difficulty) {
      case 'easy': return 60;
      case 'medium': return 45;
      case 'hard': return 30;
      default: return 60;
    }
  }

  private nextSentence(): void {
    if (this.usedSentences.size >= SENTENCE_DATABASE.length) {
      this.usedSentences.clear();
    }

    const available = SENTENCE_DATABASE.filter(s => 
      !this.usedSentences.has(s.id) && 
      (this.difficulty === 'easy' ? s.difficulty === 'easy' : 
       this.difficulty === 'medium' ? s.difficulty !== 'hard' : true)
    );

    if (available.length === 0) {
      this.currentSentence = null;
      return;
    }

    this.currentSentence = available[Math.floor(Math.random() * available.length)];
    this.usedSentences.add(this.currentSentence.id);
    this.showResult = false;
    this.isCorrect = false;
  }

  public submitAnswer(answer: string): { correct: boolean; message: string } {
    if (!this.currentSentence || this.gameOver) {
      return { correct: false, message: '游戏未开始或已结束' };
    }

    this.userAnswer = answer;
    const normalizedAnswer = answer.trim().toLowerCase().replace(/[.,!?，。！？]/g, '');
    const normalizedCorrect = this.currentSentence.chinese.trim().toLowerCase().replace(/[.,!?，。！？]/g, '');
    
    // 简单的相似度检查 (完全匹配或包含)
    const isCorrect = normalizedAnswer === normalizedCorrect || 
                      normalizedAnswer.includes(normalizedCorrect) ||
                      normalizedCorrect.includes(normalizedAnswer);

    this.showResult = true;
    this.isCorrect = isCorrect;

    if (isCorrect) {
      this.combo++;
      let points = 10;
      if (this.currentSentence.difficulty === 'medium') points = 20;
      if (this.currentSentence.difficulty === 'hard') points = 35;
      this.score += points * this.combo;
      
      if (this.score > 0 && this.score % 100 === 0) {
        this.level++;
      }

      setTimeout(() => {
        if (!this.gameOver) {
          this.nextSentence();
        }
      }, 2000);
      
      return { correct: true, message: '正确！' };
    } else {
      this.combo = 0;
      this.mistakes++;
      
      if (this.mistakes >= 3) {
        this.endGame();
        return { correct: false, message: '错误次数过多，游戏结束！' };
      }
      
      return { correct: false, message: '不正确！' };
    }
  }

  public skip(): void {
    this.combo = 0;
    this.mistakes++;
    
    if (this.mistakes >= 3) {
      this.endGame();
    } else {
      this.nextSentence();
    }
  }

  public endGame(): void {
    this.gameOver = true;
    this.isPlaying = false;
  }

  public getState(): GameState {
    return {
      score: this.score,
      combo: this.combo,
      mistakes: this.mistakes,
      currentSentence: this.currentSentence,
      userAnswer: this.userAnswer,
      gameOver: this.gameOver,
      level: this.level,
      isPlaying: this.isPlaying,
      showResult: this.showResult,
      isCorrect: this.isCorrect,
      timeLeft: this.timeLeft
    };
  }

  public setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = difficulty;
  }

  public getDifficulty(): 'easy' | 'medium' | 'hard' {
    return this.difficulty;
  }
}