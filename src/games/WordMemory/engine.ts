// Word Memory Game Engine - 单词记忆游戏引擎

export interface Word {
  id: string;
  english: string;
  chinese: string;
  phonetic?: string;
  example?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GameState {
  score: number;
  combo: number;
  mistakes: number;
  currentWord: Word | null;
  options: string[];
  gameOver: boolean;
  level: number;
  isPlaying: boolean;
  timeLeft: number;
}

// Word database
export const WORD_DATABASE: Word[] = [
  { id: '1', english: 'apple', chinese: '苹果', phonetic: '/ˈæpl/', example: 'I eat an apple every day.', difficulty: 'easy' },
  { id: '2', english: 'book', chinese: '书', phonetic: '/bʊk/', example: 'I love reading books.', difficulty: 'easy' },
  { id: '3', english: 'computer', chinese: '电脑', phonetic: '/kəmˈpjuːtər/', example: 'I use a computer for work.', difficulty: 'easy' },
  { id: '4', english: 'happy', chinese: '开心的', phonetic: '/ˈhæpi/', example: 'I feel very happy today.', difficulty: 'easy' },
  { id: '5', english: 'water', chinese: '水', phonetic: '/ˈwɔːtər/', example: 'Drink more water.', difficulty: 'easy' },
  { id: '6', english: 'beautiful', chinese: '美丽的', phonetic: '/ˈbjuːtɪfl/', example: 'The flower is beautiful.', difficulty: 'medium' },
  { id: '7', english: 'important', chinese: '重要的', phonetic: '/ɪmˈpɔːrtnt/', example: 'Health is important.', difficulty: 'medium' },
  { id: '8', english: 'different', chinese: '不同的', phonetic: '/ˈdɪfrənt/', example: 'We are different.', difficulty: 'medium' },
  { id: '9', english: 'wonderful', chinese: '精彩的', phonetic: '/ˈwʌndərfl/', example: 'The movie is wonderful.', difficulty: 'medium' },
  { id: '10', english: 'interesting', chinese: '有趣的', phonetic: '/ˈɪntrəstɪŋ/', example: 'The book is interesting.', difficulty: 'medium' },
  { id: '11', english: 'accomplish', chinese: '完成', phonetic: '/əˈkɑːmplɪʃ/', example: 'I will accomplish this task.', difficulty: 'hard' },
  { id: '12', english: 'sophisticated', chinese: '复杂的', phonetic: '/səˈfɪstɪkeɪtɪd/', example: 'This is a sophisticated machine.', difficulty: 'hard' },
  { id: '13', english: 'philosophy', chinese: '哲学', phonetic: '/fɪˈlɑːsəfi/', example: 'He studies philosophy.', difficulty: 'hard' },
  { id: '14', english: 'perseverance', chinese: '毅力', phonetic: '/ˌpɜːrsəˈvɪrəns/', example: 'Success requires perseverance.', difficulty: 'hard' },
  { id: '15', english: 'extraordinary', chinese: '非凡的', phonetic: '/ɪkˈstrɔːrdəneri/', example: 'He is an extraordinary person.', difficulty: 'hard' },
  { id: '16', english: 'cat', chinese: '猫', phonetic: '/kæt/', example: 'The cat is cute.', difficulty: 'easy' },
  { id: '17', english: 'dog', chinese: '狗', phonetic: '/dɔːɡ/', example: 'The dog is loyal.', difficulty: 'easy' },
  { id: '18', english: 'sun', chinese: '太阳', phonetic: '/sʌn/', example: 'The sun is bright.', difficulty: 'easy' },
  { id: '19', english: 'moon', chinese: '月亮', phonetic: '/muːn/', example: 'The moon is round.', difficulty: 'easy' },
  { id: '20', english: 'star', chinese: '星星', phonetic: '/stɑːr/', example: 'The star is shining.', difficulty: 'easy' },
];

export class WordMemoryEngine {
  private score: number = 0;
  private combo: number = 0;
  private mistakes: number = 0;
  private currentWord: Word | null = null;
  private options: string[] = [];
  private gameOver: boolean = false;
  private level: number = 1;
  private isPlaying: boolean = false;
  private timeLeft: number = 30;
  private usedWords: Set<string> = new Set();
  private timerInterval: number | null = null;
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
    this.timeLeft = this.difficulty === 'easy' ? 60 : this.difficulty === 'medium' ? 45 : 30;
    this.usedWords.clear();
    this.nextWord();
  }

  private nextWord(): void {
    if (this.usedWords.size >= WORD_DATABASE.length) {
      this.usedWords.clear();
    }

    const availableWords = WORD_DATABASE.filter(w => 
      !this.usedWords.has(w.id) && 
      (this.difficulty === 'easy' ? true : 
       this.difficulty === 'medium' ? w.difficulty !== 'hard' : 
       w.difficulty === this.difficulty || w.difficulty === 'medium')
    );

    if (availableWords.length === 0) {
      this.currentWord = null;
      return;
    }

    this.currentWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    this.usedWords.add(this.currentWord.id);
    this.generateOptions();
  }

  private generateOptions(): void {
    if (!this.currentWord) return;

    const wrongOptions = WORD_DATABASE
      .filter(w => w.id !== this.currentWord!.id)
      .map(w => w.chinese)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    this.options = [...wrongOptions, this.currentWord.chinese]
      .sort(() => Math.random() - 0.5);
  }

  public answer(selectedOption: string): { correct: boolean; message: string } {
    if (!this.currentWord || this.gameOver) {
      return { correct: false, message: '游戏未开始或已结束' };
    }

    const isCorrect = selectedOption === this.currentWord.chinese;

    if (isCorrect) {
      this.combo++;
      const bonusPoints = 10 * this.combo;
      this.score += bonusPoints;
      
      if (this.score > 0 && this.score % 100 === 0) {
        this.level++;
      }
      
      this.nextWord();
      return { correct: true, message: `正确！+${bonusPoints}分` };
    } else {
      this.combo = 0;
      this.mistakes++;
      
      if (this.mistakes >= 3) {
        this.endGame();
        return { correct: false, message: '错误次数过多，游戏结束！' };
      }
      
      return { correct: false, message: `错误！正确答案是：${this.currentWord.chinese}` };
    }
  }

  public skipWord(): void {
    this.combo = 0;
    this.mistakes++;
    
    if (this.mistakes >= 3) {
      this.endGame();
    } else {
      this.nextWord();
    }
  }

  public endGame(): void {
    this.gameOver = true;
    this.isPlaying = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public getState(): GameState {
    return {
      score: this.score,
      combo: this.combo,
      mistakes: this.mistakes,
      currentWord: this.currentWord,
      options: this.options,
      gameOver: this.gameOver,
      level: this.level,
      isPlaying: this.isPlaying,
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