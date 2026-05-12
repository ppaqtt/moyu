import { BRAIN_TEST_CONSTANTS } from '../../utils/constants';

const { CANVAS_WIDTH, CANVAS_HEIGHT, QUESTION_COUNT, TIME_LIMIT } = BRAIN_TEST_CONSTANTS;

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface BrainTestState {
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  timeRemaining: number;
  selectedAnswer: number | null;
  isAnswered: boolean;
  isCorrect: boolean | null;
  gameStatus: 'idle' | 'playing' | 'gameover';
  answeredQuestions: number[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "什么动物早上四条腿，中午两条腿，晚上三条腿？",
    options: ["猫", "人", "狗", "鸟"],
    correctAnswer: 1,
    explanation: "人在婴儿时期爬行（四条腿），长大后走路（两条腿），老年时拄拐杖（三条腿）"
  },
  {
    id: 2,
    question: "What has hands but can't clap? (什么东西有手却不能拍手？)",
    options: ["手表", "手套", "机器人", "玩偶"],
    correctAnswer: 0,
    explanation: "钟表有指针(手)，但不能拍手"
  },
  {
    id: 3,
    question: "小明的妈妈有三个孩子，老大叫大毛，老二叫二毛，老三叫什么？",
    options: ["三毛", "小明", "小毛", "老毛"],
    correctAnswer: 1,
    explanation: "因为小明的妈妈是小明的妈妈，所以第三个孩子是小明"
  },
  {
    id: 4,
    question: "什么车子的轮子最多？",
    options: ["火车", "汽车", "自行车", "卡车"],
    correctAnswer: 0,
    explanation: "火车的车厢有很多轮子，一般有几十甚至上百个轮子"
  },
  {
    id: 5,
    question: "What can you catch but not throw? (你能抓住但不能扔掉的是什么？)",
    options: ["球", "感冒", "鱼", "石头"],
    correctAnswer: 1,
    explanation: "感冒（cold）可以 catch（感染/抓住）但不能 throw（扔）"
  },
  {
    id: 6,
    question: "什么东西越洗越脏？",
    options: ["衣服", "水", "手", "碗"],
    correctAnswer: 1,
    explanation: "水越洗越脏，因为它会带走脏东西变得浑浊"
  },
  {
    id: 7,
    question: "什么动物最喜欢挤在一起？",
    options: ["鱼", "蜜蜂", "绵羊", "鸡"],
    correctAnswer: 1,
    explanation: "蜜蜂挤在一起形成蜂群(蜂巢)"
  },
  {
    id: 8,
    question: "What has a head and a tail but no body? (什么东西有头有尾却没有身体？)",
    options: ["蛇", "鱼", "硬币", "绳子"],
    correctAnswer: 2,
    explanation: "硬币有正面(head)和反面(tail)但没有身体"
  },
  {
    id: 9,
    question: "张老师手里有五支笔，掉了一支，还剩几支？",
    options: ["四支", "五支", "零支", "不确定"],
    correctAnswer: 3,
    explanation: "不知道，因为不知道是在手里掉了一支还是掉在地上了"
  },
  {
    id: 10,
    question: "一个苹果加一个苹果等于几个苹果？",
    options: ["一个", "两个", "不确定", "零个"],
    correctAnswer: 1,
    explanation: "一个苹果加一个苹果等于两个苹果"
  },
  {
    id: 11,
    question: "什么字有一百张口？",
    options: ["品", "回", "古", "史"],
    correctAnswer: 0,
    explanation: "'品'字由三个口组成，总共有一百张口（夸张说法表示很多）"
  },
  {
    id: 12,
    question: "小明考试得了0分，他不可能得到以下哪科的成绩？",
    options: ["语文", "数学", "英语", "体育"],
    correctAnswer: 3,
    explanation: "0分是可能的成绩，所以这道题本身就是脑筋急转弯"
  },
  {
    id: 13,
    question: "What is full of holes but still holds water? (什么东西全是洞却能装水？)",
    options: ["筛子", "海绵", "渔网", "水桶"],
    correctAnswer: 1,
    explanation: "海绵有很多小孔但能吸收和保持水分"
  },
  {
    id: 14,
    question: "哪种动物最没有方向感？",
    options: ["蝙蝠", "企鹅", "北极熊", "鸽子"],
    correctAnswer: 0,
    explanation: "因为蝙蝠是'瞎'(方向感差)的，其实蝙蝠靠超声波导航，但脑筋急转弯里它被认为是没方向感的"
  },
  {
    id: 15,
    question: "黑人和白人生下的婴儿，牙齿是什么颜色的？",
    options: ["白色", "黑色", "还没长牙齿", "灰色"],
    correctAnswer: 2,
    explanation: "婴儿刚出生时还没有长牙齿，所以牙齿是白色的这个问题不成立"
  }
];

export class BrainTestEngine {
  private state: BrainTestState;
  private timerInterval: number | null = null;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): BrainTestState {
    const shuffledQuestions = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, QUESTION_COUNT);
    return {
      questions: shuffledQuestions,
      currentQuestionIndex: 0,
      score: 0,
      timeRemaining: TIME_LIMIT,
      selectedAnswer: null,
      isAnswered: false,
      isCorrect: null,
      gameStatus: 'idle',
      answeredQuestions: []
    };
  }

  getState(): BrainTestState {
    return { ...this.state };
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  start(): void {
    this.state.gameStatus = 'playing';
    this.state.timeRemaining = TIME_LIMIT;
    this.state.currentQuestionIndex = 0;
    this.state.score = 0;
    this.state.answeredQuestions = [];
    this.shuffleQuestions();
  }

  private shuffleQuestions(): void {
    this.state.questions = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, QUESTION_COUNT);
  }

  startTimer(callback: (remaining: number) => void): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.timerInterval = window.setInterval(() => {
      this.state.timeRemaining--;
      callback(this.state.timeRemaining);
      
      if (this.state.timeRemaining <= 0) {
        this.endGame();
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  selectAnswer(answerIndex: number): boolean {
    if (this.state.isAnswered || this.state.gameStatus !== 'playing') {
      return false;
    }

    const currentQuestion = this.state.questions[this.state.currentQuestionIndex];
    this.state.selectedAnswer = answerIndex;
    this.state.isAnswered = true;
    this.state.isCorrect = answerIndex === currentQuestion.correctAnswer;

    if (this.state.isCorrect) {
      const timeBonus = Math.floor(this.state.timeRemaining / 10);
      this.state.score += 10 + timeBonus;
    }

    this.state.answeredQuestions.push(this.state.currentQuestionIndex);
    return this.state.isCorrect;
  }

  nextQuestion(): boolean {
    if (this.state.currentQuestionIndex >= this.state.questions.length - 1) {
      this.endGame();
      return false;
    }

    this.state.currentQuestionIndex++;
    this.state.selectedAnswer = null;
    this.state.isAnswered = false;
    this.state.isCorrect = null;
    return true;
  }

  private endGame(): void {
    this.stopTimer();
    this.state.gameStatus = 'gameover';
  }

  reset(): void {
    this.stopTimer();
    this.state = this.createInitialState();
  }

  getCurrentQuestion(): Question | null {
    if (this.state.gameStatus !== 'playing') return null;
    return this.state.questions[this.state.currentQuestionIndex];
  }

  getProgress(): { current: number; total: number } {
    return {
      current: this.state.currentQuestionIndex + 1,
      total: this.state.questions.length
    };
  }

  isLastQuestion(): boolean {
    return this.state.currentQuestionIndex >= this.state.questions.length - 1;
  }

  getTimeBonus(): number {
    return Math.floor(this.state.timeRemaining / 10);
  }
}
