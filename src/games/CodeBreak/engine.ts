export interface CodeLevel {
  id: number;
  hint: string;
  answer: string;
  type: 'number' | 'letter' | 'mixed';
  difficulty: number;
  clue: string[];
}

export interface GameState {
  currentLevel: number;
  attempts: number;
  score: number;
  maxAttempts: number;
  hintUsed: boolean;
  isComplete: boolean;
  revealedClues: number;
}

export class CodeBreakEngine {
  private levels: CodeLevel[] = [];
  private currentLevel: number = 0;
  private attempts: number = 0;
  private score: number = 0;
  private maxAttempts: number = 5;
  private hintUsed: boolean = false;
  private isComplete: boolean = false;
  private revealedClues: number = 0;

  constructor() {
    this.generateLevels();
  }

  private generateLevels(): void {
    this.levels = [
      {
        id: 1,
        hint: '四位数密码，每个数字都是偶数',
        answer: '2468',
        type: 'number',
        difficulty: 1,
        clue: ['第一个数字是2', '数字按从小到大排列', '最后一位是8']
      },
      {
        id: 2,
        hint: '三位数密码，数字之和等于15',
        answer: '456',
        type: 'number',
        difficulty: 1,
        clue: ['第一个数字是4', '数字是连续的', '答案是456']
      },
      {
        id: 3,
        hint: '五位数密码，是9876的前一位',
        answer: '98765',
        type: 'number',
        difficulty: 2,
        clue: ['这串数字是连续的', '从9开始倒数', '答案是98765']
      },
      {
        id: 4,
        hint: '四个字母的密码，是英文"HELP"的邻居',
        answer: 'GOLF',
        type: 'letter',
        difficulty: 2,
        clue: ['每个字母在字母表上移一位', 'HELP变成了GOLF', '答案是GOLF']
      },
      {
        id: 5,
        hint: '密码是当前关卡数的立方',
        answer: '125',
        type: 'number',
        difficulty: 2,
        clue: ['当前是第5关', '立方意味着3次方', '5的立方是125']
      },
      {
        id: 6,
        hint: '六位数密码，是幸运数字7的倍数',
        answer: '777777',
        type: 'number',
        difficulty: 3,
        clue: ['全部由7组成', '六个7', '777777']
      },
      {
        id: 7,
        hint: '三个字母密码，是"YES"的反写',
        answer: 'SEY',
        type: 'letter',
        difficulty: 3,
        clue: ['YES反过来写', 'SYE...不对', '是SEY']
      },
      {
        id: 8,
        hint: '密码是斐波那契数列的第8项',
        answer: '21',
        type: 'number',
        difficulty: 3,
        clue: ['斐波那契:1,1,2,3,5,8,13,21', '第8项是21', '答案是21']
      },
      {
        id: 9,
        hint: '四位数密码，是2024的一半',
        answer: '1012',
        type: 'number',
        difficulty: 3,
        clue: ['2024 ÷ 2 = ?', '答案是1012', '1012']
      },
      {
        id: 10,
        hint: '终极密码：你是最棒的！',
        answer: 'BEST',
        type: 'mixed',
        difficulty: 4,
        clue: ['提示：你是最棒的(BEST)', 'B-E-S-T', 'BEST']
      }
    ];
  }

  public guess(answer: string): { correct: boolean; message: string; levelComplete: boolean } {
    const current = this.levels[this.currentLevel];
    const normalizedAnswer = answer.toUpperCase().trim();
    const normalizedCorrect = current.answer.toUpperCase().trim();

    if (normalizedAnswer === normalizedCorrect) {
      const baseScore = (6 - this.attempts) * 100;
      const hintPenalty = this.hintUsed ? -50 : 0;
      this.score += Math.max(baseScore + hintPenalty, 50);
      
      const levelComplete = this.currentLevel >= this.levels.length - 1;
      
      if (levelComplete) {
        this.isComplete = true;
        return { correct: true, message: '🎉 全部破解! 你是密码大师!', levelComplete: true };
      }

      this.currentLevel++;
      this.attempts = 0;
      this.hintUsed = false;
      this.revealedClues = 0;

      return { correct: true, message: `✅ 第${this.currentLevel}关解锁!`, levelComplete: false };
    }

    this.attempts++;

    if (this.attempts >= this.maxAttempts) {
      this.attempts = 0;
      this.hintUsed = false;
      this.revealedClues = 0;
      return { correct: false, message: `💡 提示: ${current.clue[this.revealedClues % current.clue.length]}`, levelComplete: false };
    }

    if (normalizedAnswer.length !== normalizedCorrect.length) {
      return { correct: false, message: `❌ 长度不对! 还剩${this.maxAttempts - this.attempts}次机会`, levelComplete: false };
    }

    let closeCount = 0;
    for (let i = 0; i < normalizedAnswer.length; i++) {
      if (normalizedAnswer[i] === normalizedCorrect[i]) {
        closeCount++;
      }
    }

    return { 
      correct: false, 
      message: `❌ 不对! ${closeCount}/${normalizedCorrect.length}正确, 还剩${this.maxAttempts - this.attempts}次`, 
      levelComplete: false 
    };
  }

  public useHint(): { success: boolean; clue: string } {
    const current = this.levels[this.currentLevel];
    
    if (this.revealedClues >= current.clue.length) {
      return { success: false, clue: '没有更多提示了!' };
    }

    this.hintUsed = true;
    const clue = current.clue[this.revealedClues];
    this.revealedClues++;
    
    return { success: true, clue };
  }

  public getState(): GameState {
    return {
      currentLevel: this.currentLevel,
      attempts: this.attempts,
      score: this.score,
      maxAttempts: this.maxAttempts,
      hintUsed: this.hintUsed,
      isComplete: this.isComplete,
      revealedClues: this.revealedClues
    };
  }

  public getCurrentLevel(): CodeLevel {
    return this.levels[this.currentLevel];
  }

  public getTotalLevels(): number {
    return this.levels.length;
  }

  public reset(): void {
    this.currentLevel = 0;
    this.attempts = 0;
    this.score = 0;
    this.hintUsed = false;
    this.isComplete = false;
    this.revealedClues = 0;
  }
}
