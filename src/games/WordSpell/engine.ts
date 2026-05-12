// 单词拼写游戏引擎

export interface Word {
  id: string;
  word: string;
  meaning: string;
  phonetic?: string;
  example?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface GameState {
  currentWord: Word | null;
  userInput: string;
  revealedLetters: number[];
  attempts: number;
  maxAttempts: number;
  score: number;
  streak: number;
  correctCount: number;
  wrongCount: number;
  hintsUsed: number;
  isComplete: boolean;
  feedback: 'correct' | 'wrong' | 'pending';
}

// 单词题库
const WORD_DATABASE: Word[] = [
  // Easy - 基础词汇
  { id: '1', word: 'HELLO', meaning: '你好，问候', phonetic: '/həˈloʊ/', example: 'Hello, how are you?', difficulty: 'easy', category: '日常' },
  { id: '2', word: 'WORLD', meaning: '世界', phonetic: '/wɜːrld/', example: 'The world is beautiful.', difficulty: 'easy', category: '自然' },
  { id: '3', word: 'THANK', meaning: '感谢', phonetic: '/θæŋk/', example: 'Thank you very much.', difficulty: 'easy', category: '日常' },
  { id: '4', word: 'WATER', meaning: '水', phonetic: '/ˈwɔːtər/', example: 'I need some water.', difficulty: 'easy', category: '自然' },
  { id: '5', word: 'HAPPY', meaning: '快乐的', phonetic: '/ˈhæpi/', example: 'I am very happy today.', difficulty: 'easy', category: '情感' },
  { id: '6', word: 'MUSIC', meaning: '音乐', phonetic: '/ˈmjuːzɪk/', example: 'I love listening to music.', difficulty: 'easy', category: '艺术' },
  { id: '7', word: 'PHONE', meaning: '电话', phonetic: '/foʊn/', example: 'My phone is ringing.', difficulty: 'easy', category: '科技' },
  { id: '8', word: 'DREAM', meaning: '梦想', phonetic: '/driːm/', example: 'Follow your dreams.', difficulty: 'easy', category: '抽象' },
  { id: '9', word: 'LIGHT', meaning: '光', phonetic: '/laɪt/', example: 'Turn on the light.', difficulty: 'easy', category: '自然' },
  { id: '10', word: 'HEART', meaning: '心脏', phonetic: '/hɑːrt/', example: 'My heart is beating fast.', difficulty: 'easy', category: '身体' },
  { id: '11', word: 'MOUSE', meaning: '老鼠/鼠标', phonetic: '/maʊs/', example: 'I use a wireless mouse.', difficulty: 'easy', category: '动物' },
  { id: '12', word: 'PAPER', meaning: '纸', phonetic: '/ˈpeɪpər/', example: 'Write it on paper.', difficulty: 'easy', category: '物品' },
  { id: '13', word: 'PLANT', meaning: '植物', phonetic: '/plænt/', example: 'Water the plant.', difficulty: 'easy', category: '自然' },
  { id: '14', word: 'SMILE', meaning: '微笑', phonetic: '/smaɪl/', example: 'She has a beautiful smile.', difficulty: 'easy', category: '情感' },
  { id: '15', word: 'TABLE', meaning: '桌子', phonetic: '/ˈteɪbl/', example: 'Put it on the table.', difficulty: 'easy', category: '物品' },
  
  // Medium - 中等词汇
  { id: '16', word: 'COMPUTER', meaning: '计算机', phonetic: '/kəmˈpjuːtər/', example: 'I work on my computer.', difficulty: 'medium', category: '科技' },
  { id: '17', word: 'BEAUTIFUL', meaning: '美丽的', phonetic: '/ˈbjuːtɪfl/', example: 'What a beautiful day!', difficulty: 'medium', category: '描述' },
  { id: '18', word: 'INTEREST', meaning: '兴趣', phonetic: '/ˈɪntrəst/', example: 'I have an interest in art.', difficulty: 'medium', category: '抽象' },
  { id: '19', word: 'LANGUAGE', meaning: '语言', phonetic: '/ˈlæŋɡwɪdʒ/', example: 'English is a global language.', difficulty: 'medium', category: '学习' },
  { id: '20', word: 'FRIENDLY', meaning: '友好的', phonetic: '/ˈfrendli/', example: 'She is very friendly.', difficulty: 'medium', category: '性格' },
  { id: '21', word: 'JOURNEY', meaning: '旅程', phonetic: '/ˈdʒɜːrni/', example: 'Life is a journey.', difficulty: 'medium', category: '旅行' },
  { id: '22', word: 'SILENCE', meaning: '寂静', phonetic: '/ˈsaɪləns/', example: 'Enjoy the silence.', difficulty: 'medium', category: '抽象' },
  { id: '23', word: 'FOREVER', meaning: '永远', phonetic: '/fɔːrˈevər/', example: 'I will love you forever.', difficulty: 'medium', category: '时间' },
  { id: '24', word: 'MORNING', meaning: '早晨', phonetic: '/ˈmɔːrnɪŋ/', example: 'Good morning!', difficulty: 'medium', category: '时间' },
  { id: '25', word: 'PICTURE', meaning: '图片', phonetic: '/ˈpɪktʃər/', example: 'Take a picture.', difficulty: 'medium', category: '艺术' },
  { id: '26', word: 'STUDENT', meaning: '学生', phonetic: '/ˈstuːdnt/', example: 'I am a student.', difficulty: 'medium', category: '人物' },
  { id: '27', word: 'THOUGHT', meaning: '想法', phonetic: '/θɔːt/', example: 'That is a good thought.', difficulty: 'medium', category: '抽象' },
  { id: '28', word: 'WEATHER', meaning: '天气', phonetic: '/ˈweðər/', example: 'How is the weather?', difficulty: 'medium', category: '自然' },
  { id: '29', word: 'WRITING', meaning: '写作', phonetic: '/ˈraɪtɪŋ/', example: 'I enjoy writing.', difficulty: 'medium', category: '学习' },
  { id: '30', word: 'COUNTRY', meaning: '国家', phonetic: '/ˈkʌntri/', example: 'Which country are you from?', difficulty: 'medium', category: '地理' },
  
  // Hard - 困难词汇
  { id: '31', word: 'ADVENTURE', meaning: '冒险', phonetic: '/ədˈventʃər/', example: 'Life is either a daring adventure or nothing.', difficulty: 'hard', category: '抽象' },
  { id: '32', word: 'BEAUTIFULLY', meaning: '美丽地', phonetic: '/ˈbjuːtɪfəli/', example: 'She sings beautifully.', difficulty: 'hard', category: '描述' },
  { id: '33', word: 'CHALLENGE', meaning: '挑战', phonetic: '/ˈtʃælɪndʒ/', example: 'I love a good challenge.', difficulty: 'hard', category: '抽象' },
  { id: '34', word: 'DETERMINED', meaning: '坚定的', phonetic: '/dɪˈtɜːrmɪnd/', example: 'She is determined to succeed.', difficulty: 'hard', category: '性格' },
  { id: '35', word: 'EXPERIENCE', meaning: '经验', phonetic: '/ɪkˈspɪriəns/', example: 'Experience is the best teacher.', difficulty: 'hard', category: '抽象' },
  { id: '36', word: 'KNOWLEDGE', meaning: '知识', phonetic: '/ˈnɑːlɪdʒ/', example: 'Knowledge is power.', difficulty: 'hard', category: '学习' },
  { id: '37', word: 'LITERATURE', meaning: '文学', phonetic: '/ˈlɪtrətʃər/', example: 'I study English literature.', difficulty: 'hard', category: '学习' },
  { id: '38', word: 'MYSTERIOUS', meaning: '神秘的', phonetic: '/mɪˈstɪriəs/', example: 'He has a mysterious smile.', difficulty: 'hard', category: '描述' },
  { id: '39', word: 'OPPORTUNITY', meaning: '机会', phonetic: '/ˌɑːpərˈtuːnəti/', example: 'Seize the opportunity.', difficulty: 'hard', category: '抽象' },
  { id: '40', word: 'PERSEVERANCE', meaning: '毅力', phonetic: '/ˌpɜːrsəˈvɪrəns/', example: 'Success requires perseverance.', difficulty: 'hard', category: '性格' },
  { id: '41', word: 'REMARKABLE', meaning: '非凡的', phonetic: '/rɪˈmɑːrkəbl/', example: 'That is a remarkable achievement.', difficulty: 'hard', category: '描述' },
  { id: '42', word: 'TECHNOLOGY', meaning: '技术', phonetic: '/tekˈnɑːlədʒi/', example: 'Technology changes fast.', difficulty: 'hard', category: '科技' },
  { id: '43', word: 'UNDERSTAND', meaning: '理解', phonetic: '/ˌʌndərˈstænd/', example: 'Do you understand?', difficulty: 'hard', category: '学习' },
  { id: '44', word: 'WONDERFUL', meaning: '精彩的', phonetic: '/ˈwʌndərfl/', example: 'What a wonderful world!', difficulty: 'hard', category: '描述' },
  { id: '45', word: 'EXTRAORDINARY', meaning: '非凡的', phonetic: '/ɪkˈstrɔːrdəneri/', example: 'She has extraordinary talent.', difficulty: 'hard', category: '描述' },
];

export class WordSpellEngine {
  private currentWord: Word | null = null;
  private userInput: string = '';
  private revealedLetters: number[] = [];
  private attempts: number = 0;
  private maxAttempts: number = 3;
  private score: number = 0;
  private streak: number = 0;
  private correctCount: number = 0;
  private wrongCount: number = 0;
  private hintsUsed: number = 0;
  private isComplete: boolean = false;
  private feedback: 'correct' | 'wrong' | 'pending' = 'pending';
  private difficulty: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed';
  private usedWordIds: Set<string> = new Set();
  private targetWordCount: number = 10;
  private currentWordIndex: number = 0;

  constructor(difficulty: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed', wordCount: number = 10) {
    this.difficulty = difficulty;
    this.targetWordCount = wordCount;
    this.reset();
  }

  public reset(): void {
    this.score = 0;
    this.streak = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.hintsUsed = 0;
    this.isComplete = false;
    this.usedWordIds = new Set();
    this.currentWordIndex = 0;
    this.nextWord();
  }

  private getAvailableWords(): Word[] {
    return WORD_DATABASE.filter(w => {
      if (this.usedWordIds.has(w.id)) return false;
      if (this.difficulty === 'mixed') return true;
      return w.difficulty === this.difficulty;
    });
  }

  public nextWord(): boolean {
    if (this.currentWordIndex >= this.targetWordCount) {
      this.isComplete = true;
      return false;
    }

    const available = this.getAvailableWords();
    if (available.length === 0) {
      this.isComplete = true;
      return false;
    }

    this.currentWord = available[Math.floor(Math.random() * available.length)];
    this.usedWordIds.add(this.currentWord.id);
    this.userInput = '';
    this.revealedLetters = [];
    this.attempts = 0;
    this.feedback = 'pending';
    this.currentWordIndex++;
    
    return true;
  }

  public inputLetter(letter: string): void {
    if (this.feedback === 'correct' || !this.currentWord) return;
    
    const upperLetter = letter.toUpperCase();
    if (upperLetter.length === 1 && upperLetter.match(/[A-Z]/)) {
      if (this.userInput.length < this.currentWord.word.length) {
        this.userInput += upperLetter;
      }
    }
  }

  public deleteLetter(): void {
    if (this.feedback === 'correct') return;
    this.userInput = this.userInput.slice(0, -1);
  }

  public submitAnswer(): { correct: boolean; message: string } {
    if (!this.currentWord || this.feedback === 'correct') {
      return { correct: false, message: '无法提交' };
    }

    if (this.userInput.length !== this.currentWord.word.length) {
      return { correct: false, message: '单词长度不正确' };
    }

    const isCorrect = this.userInput === this.currentWord.word;

    if (isCorrect) {
      this.feedback = 'correct';
      this.correctCount++;
      this.streak++;
      
      // 计算得分
      const baseScore = this.currentWord.difficulty === 'easy' ? 10 : 
                       this.currentWord.difficulty === 'medium' ? 20 : 30;
      const streakBonus = Math.min(this.streak * 2, 10);
      const attemptBonus = (this.maxAttempts - this.attempts) * 5;
      this.score += baseScore + streakBonus + attemptBonus;
      
      return { 
        correct: true, 
        message: `正确! +${baseScore + streakBonus + attemptBonus}分 (连击x${this.streak})` 
      };
    } else {
      this.attempts++;
      
      if (this.attempts >= this.maxAttempts) {
        this.feedback = 'wrong';
        this.wrongCount++;
        this.streak = 0;
        return { 
          correct: false, 
          message: `错误! 正确答案是: ${this.currentWord.word}` 
        };
      }
      
      return { 
        correct: false, 
        message: `错误! 还剩 ${this.maxAttempts - this.attempts} 次机会` 
      };
    }
  }

  public useHint(): { type: 'letter' | 'meaning' | 'phonetic' | null; data?: string } {
    if (!this.currentWord || this.feedback === 'correct') {
      return { type: null };
    }

    this.hintsUsed++;
    this.score = Math.max(0, this.score - 5);

    // 随机选择提示类型
    const hintTypes: ('letter' | 'meaning' | 'phonetic')[] = ['letter', 'meaning', 'phonetic'];
    const hintType = hintTypes[Math.floor(Math.random() * hintTypes.length)];

    switch (hintType) {
      case 'letter':
        // 揭示一个未揭示的字母位置
        const unrevealed = [];
        for (let i = 0; i < this.currentWord.word.length; i++) {
          if (!this.revealedLetters.includes(i)) {
            unrevealed.push(i);
          }
        }
        if (unrevealed.length > 0) {
          const revealIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
          this.revealedLetters.push(revealIndex);
          return { type: 'letter', data: `第${revealIndex + 1}个字母是: ${this.currentWord.word[revealIndex]}` };
        }
        // 如果所有字母都已揭示，返回其他提示
        return { type: 'meaning', data: this.currentWord.meaning };
        
      case 'meaning':
        return { type: 'meaning', data: this.currentWord.meaning };
        
      case 'phonetic':
        return { type: 'phonetic', data: this.currentWord.phonetic || '暂无音标' };
        
      default:
        return { type: null };
    }
  }

  public revealAnswer(): string {
    if (!this.currentWord) return '';
    
    this.feedback = 'wrong';
    this.wrongCount++;
    this.streak = 0;
    this.score = Math.max(0, this.score - 10);
    
    return this.currentWord.word;
  }

  public skipWord(): boolean {
    if (!this.currentWord) return false;
    
    this.streak = 0;
    this.score = Math.max(0, this.score - 5);
    return this.nextWord();
  }

  public getState(): GameState {
    return {
      currentWord: this.currentWord,
      userInput: this.userInput,
      revealedLetters: [...this.revealedLetters],
      attempts: this.attempts,
      maxAttempts: this.maxAttempts,
      score: this.score,
      streak: this.streak,
      correctCount: this.correctCount,
      wrongCount: this.wrongCount,
      hintsUsed: this.hintsUsed,
      isComplete: this.isComplete,
      feedback: this.feedback
    };
  }

  public getCurrentWord(): Word | null {
    return this.currentWord;
  }

  public getUserInput(): string {
    return this.userInput;
  }

  public getRevealedLetters(): number[] {
    return [...this.revealedLetters];
  }

  public getScore(): number {
    return this.score;
  }

  public getStreak(): number {
    return this.streak;
  }

  public getProgress(): { current: number; total: number } {
    return { current: this.currentWordIndex, total: this.targetWordCount };
  }

  public isGameComplete(): boolean {
    return this.isComplete;
  }

  public getAccuracy(): number {
    const total = this.correctCount + this.wrongCount;
    if (total === 0) return 0;
    return Math.round((this.correctCount / total) * 100);
  }

  public getFeedback(): 'correct' | 'wrong' | 'pending' {
    return this.feedback;
  }

  public setDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'mixed'): void {
    this.difficulty = difficulty;
  }

  public getAllWords(): Word[] {
    return [...WORD_DATABASE];
  }

  public getWordsByCategory(category: string): Word[] {
    return WORD_DATABASE.filter(w => w.category === category);
  }

  public getCategories(): string[] {
    const categories = new Set(WORD_DATABASE.map(w => w.category));
    return Array.from(categories);
  }
}
