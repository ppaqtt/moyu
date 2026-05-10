export interface Team {
  id: number;
  name: string;
  score: number;
  currentStreak: number;
  color: string;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface QuizRelayState {
  gamePhase: 'setup' | 'ready' | 'question' | 'answer' | 'result' | 'gameOver';
  teams: Team[];
  currentTeamIndex: number;
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;
  timeLeft: number;
  selectedAnswer: number | null;
  isCorrect: boolean | null;
  roundResults: { teamId: number; correct: boolean; time: number }[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string | 'all';
  timePerQuestion: number;
  bonusPoints: number;
}

const QUESTION_DATABASE: Omit<Question, 'id'>[] = [
  { text: '中国的首都是哪里？', options: ['上海', '北京', '广州', '深圳'], correctIndex: 1, difficulty: 'easy', category: '地理' },
  { text: '世界上最高的山峰是？', options: ['乔戈里峰', '干城章嘉峰', '珠穆朗玛峰', '洛子峰'], correctIndex: 2, difficulty: 'medium', category: '地理' },
  { text: '水的化学式是什么？', options: ['CO2', 'H2O', 'O2', 'NaCl'], correctIndex: 1, difficulty: 'easy', category: '科学' },
  { text: '太阳系有几个行星？', options: ['7个', '8个', '9个', '10个'], correctIndex: 1, difficulty: 'easy', category: '科学' },
  { text: '谁发明了电灯泡？', options: ['特斯拉', '爱迪生', '牛顿', '法拉第'], correctIndex: 1, difficulty: 'easy', category: '历史' },
  { text: '2022年世界杯足球赛的冠军是？', options: ['法国', '巴西', '阿根廷', '德国'], correctIndex: 2, difficulty: 'medium', category: '体育' },
  { text: '《哈利波特》的作者是谁？', options: ['J.R.R.托尔金', 'J.K.罗琳', '乔治·马丁', '斯蒂芬·金'], correctIndex: 1, difficulty: 'easy', category: '文学' },
  { text: '人体最大的器官是？', options: ['心脏', '肝脏', '皮肤', '大脑'], correctIndex: 2, difficulty: 'medium', category: '科学' },
  { text: '比特币是由谁创建的？', options: ['中本聪', '马斯克', '比尔盖茨', '乔布斯'], correctIndex: 0, difficulty: 'medium', category: '科技' },
  { text: '世界上最长的河流是？', options: ['亚马逊河', '尼罗河', '长江', '密西西比河'], correctIndex: 1, difficulty: 'medium', category: '地理' },
  { text: 'Python编程语言的创始人是？', options: ['James Gosling', 'Guido van Rossum', 'Dennis Ritchie', 'Bjarne Stroustrup'], correctIndex: 1, difficulty: 'hard', category: '科技' },
  { text: '《蒙娜丽莎》这幅画保存在哪个博物馆？', options: ['卢浮宫', '大英博物馆', '大都会博物馆', '乌菲兹美术馆'], correctIndex: 0, difficulty: 'easy', category: '艺术' },
  { text: '地球的自转周期是多少小时？', options: ['12小时', '24小时', '36小时', '48小时'], correctIndex: 1, difficulty: 'easy', category: '科学' },
  { text: '手机操作系统Android是由哪家公司开发的？', options: ['Apple', 'Microsoft', 'Google', 'Samsung'], correctIndex: 2, difficulty: 'easy', category: '科技' },
  { text: '世界上最深的海沟是？', options: ['日本海沟', '马里亚纳海沟', '菲律宾海沟', '千岛海沟'], correctIndex: 1, difficulty: 'hard', category: '地理' },
  { text: '《三国演义》的作者是？', options: ['施耐庵', '罗贯中', '吴承恩', '曹雪芹'], correctIndex: 1, difficulty: 'easy', category: '文学' },
  { text: '光速大约是多少？', options: ['3×10^6 m/s', '3×10^7 m/s', '3×10^8 m/s', '3×10^9 m/s'], correctIndex: 2, difficulty: 'medium', category: '科学' },
  { text: '第一届奥运会在哪里举行？', options: ['罗马', '雅典', '巴黎', '伦敦'], correctIndex: 1, difficulty: 'medium', category: '体育' },
  { text: 'DNA的全称是什么？', options: ['脱氧核糖核酸', '核糖核酸', '氨基酸', '蛋白质'], correctIndex: 0, difficulty: 'medium', category: '科学' },
  { text: '《星空》的作者是？', options: ['达芬奇', '莫奈', '梵高', '毕加索'], correctIndex: 2, difficulty: 'easy', category: '艺术' },
  { text: '人体有多少块骨头？', options: ['186块', '206块', '226块', '256块'], correctIndex: 1, difficulty: 'medium', category: '科学' },
  { text: '互联网诞生于哪一年？', options: ['1969年', '1979年', '1989年', '1999年'], correctIndex: 0, difficulty: 'hard', category: '科技' },
  { text: '世界上最小的国家是？', options: ['摩纳哥', '梵蒂冈', '列支敦士登', '圣马力诺'], correctIndex: 1, difficulty: 'medium', category: '地理' },
  { text: '《哈姆雷特》的作者是？', options: ['莎士比亚', '狄更斯', '奥斯汀', '勃朗特'], correctIndex: 0, difficulty: 'easy', category: '文学' },
  { text: '地球到月球的平均距离约是多少公里？', options: ['38万公里', '380万公里', '3800万公里', '3.8万公里'], correctIndex: 0, difficulty: 'medium', category: '科学' },
  { text: '哪个国家被称为"樱花之国"？', options: ['中国', '日本', '韩国', '泰国'], correctIndex: 1, difficulty: 'easy', category: '地理' },
  { text: 'JavaScript最初是由哪家公司创建的？', options: ['Netscape', 'Microsoft', 'Google', 'IBM'], correctIndex: 0, difficulty: 'hard', category: '科技' },
  { text: '《蒙娜丽莎》微笑的寓意一直是艺术界的谜，这个说法正确吗？', options: ['正确', '错误，她只是在微笑', '错误，她在皱眉', '错误，她在说话'], correctIndex: 1, difficulty: 'hard', category: '艺术' },
  { text: '人类基因组计划完成了对多少对染色体的测序？', options: ['22对', '23对', '24对', '46对'], correctIndex: 1, difficulty: 'hard', category: '科学' },
  { text: '世界杯足球赛每多少年举办一次？', options: ['2年', '3年', '4年', '5年'], correctIndex: 2, difficulty: 'easy', category: '体育' },
  { text: '《道德经》的作者是谁？', options: ['孔子', '老子', '孟子', '庄子'], correctIndex: 1, difficulty: 'easy', category: '文学' },
  { text: '光合作用发生在植物的哪个部分？', options: ['根', '茎', '叶', '花'], correctIndex: 2, difficulty: 'easy', category: '科学' },
  { text: '泰坦尼克号沉没在哪一年？', options: ['1910年', '1912年', '1914年', '1916年'], correctIndex: 1, difficulty: 'medium', category: '历史' },
  { text: '世界上最古老的文明是？', options: ['中华文明', '印度文明', '两河文明', '埃及文明'], correctIndex: 2, difficulty: 'hard', category: '历史' },
  { text: 'Python语言的名字来源于什么？', options: ['电影', '电视剧', 'BBC喜剧', '小说'], correctIndex: 2, difficulty: 'hard', category: '科技' },
  { text: '人体心脏有多少个心房？', options: ['1个', '2个', '3个', '4个'], correctIndex: 1, difficulty: 'easy', category: '科学' },
  { text: '《最后的晚餐》保存在哪里？', options: ['卢浮宫', '米兰圣母感恩教堂', '梵蒂冈', '大英博物馆'], correctIndex: 1, difficulty: 'medium', category: '艺术' },
  { text: '第一颗原子弹在哪个城市爆炸？', options: ['广岛', '长崎', '东京', '大阪'], correctIndex: 0, difficulty: 'medium', category: '历史' },
  { text: '地球的磁场是由什么产生的？', options: ['地核', '地幔', '地壳', '海洋'], correctIndex: 0, difficulty: 'hard', category: '科学' },
];

export class QuizRelayEngine {
  private state: QuizRelayState;
  private questions: Question[];
  private timerInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.questions = this.generateQuestions();
    this.state = this.getInitialState();
  }

  private getInitialState(): QuizRelayState {
    return {
      gamePhase: 'setup',
      teams: [],
      currentTeamIndex: 0,
      currentQuestion: null,
      questionIndex: 0,
      totalQuestions: 20,
      timeLeft: 15,
      selectedAnswer: null,
      isCorrect: null,
      roundResults: [],
      difficulty: 'medium',
      category: 'all',
      timePerQuestion: 15,
      bonusPoints: 10
    };
  }

  private generateQuestions(): Question[] {
    return QUESTION_DATABASE.map((q, index) => ({
      ...q,
      id: index
    }));
  }

  getState(): QuizRelayState {
    return JSON.parse(JSON.stringify(this.state));
  }

  setTeamCount(count: number): void {
    const teamColors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3'];
    this.state.teams = [];
    for (let i = 0; i < count; i++) {
      this.state.teams.push({
        id: i,
        name: `队伍${i + 1}`,
        score: 0,
        currentStreak: 0,
        color: teamColors[i % teamColors.length]
      });
    }
  }

  setTeamName(teamId: number, name: string): void {
    const team = this.state.teams.find(t => t.id === teamId);
    if (team) {
      team.name = name;
    }
  }

  setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.state.difficulty = difficulty;
  }

  setTimePerQuestion(time: number): void {
    this.state.timePerQuestion = time;
    this.state.timeLeft = time;
  }

  setTotalQuestions(count: number): void {
    this.state.totalQuestions = count;
  }

  startGame(): void {
    this.state.questionIndex = 0;
    this.state.currentTeamIndex = 0;
    this.state.roundResults = [];
    this.state.teams.forEach(team => {
      team.score = 0;
      team.currentStreak = 0;
    });
    this.state.gamePhase = 'ready';
    this.nextQuestion();
  }

  private nextQuestion(): void {
    const filteredQuestions = this.questions.filter(q => {
      if (this.state.difficulty !== 'all' && q.difficulty !== this.state.difficulty) return false;
      if (this.state.category !== 'all' && q.category !== this.state.category) return false;
      return true;
    });

    if (filteredQuestions.length === 0 || this.state.questionIndex >= this.state.totalQuestions) {
      this.state.gamePhase = 'gameOver';
      return;
    }

    const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
    this.state.currentQuestion = filteredQuestions[randomIndex];
    this.state.questionIndex++;
    this.state.timeLeft = this.state.timePerQuestion;
    this.state.selectedAnswer = null;
    this.state.isCorrect = null;
    this.state.gamePhase = 'question';
    this.startTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.state.timeLeft--;
      if (this.state.timeLeft <= 0) {
        this.timeOut();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private timeOut(): void {
    this.stopTimer();
    this.state.isCorrect = false;
    const team = this.state.teams[this.state.currentTeamIndex];
    team.currentStreak = 0;
    this.state.roundResults.push({
      teamId: team.id,
      correct: false,
      time: 0
    });
    this.state.gamePhase = 'answer';
  }

  submitAnswer(answerIndex: number): void {
    if (this.state.selectedAnswer !== null) return;
    
    this.stopTimer();
    this.state.selectedAnswer = answerIndex;
    const team = this.state.teams[this.state.currentTeamIndex];
    const timeUsed = this.state.timePerQuestion - this.state.timeLeft;
    
    if (this.state.currentQuestion && answerIndex === this.state.currentQuestion.correctIndex) {
      this.state.isCorrect = true;
      team.currentStreak++;
      const basePoints = 10;
      const timeBonus = Math.floor(timeUsed * 0.5);
      const streakBonus = Math.min(team.currentStreak * 2, 20);
      const totalPoints = basePoints + timeBonus + streakBonus;
      team.score += totalPoints;
      
      this.state.roundResults.push({
        teamId: team.id,
        correct: true,
        time: timeUsed
      });
    } else {
      this.state.isCorrect = false;
      team.currentStreak = 0;
      this.state.roundResults.push({
        teamId: team.id,
        correct: false,
        time: timeUsed
      });
    }
    
    this.state.gamePhase = 'answer';
  }

  nextTurn(): void {
    this.state.currentTeamIndex = (this.state.currentTeamIndex + 1) % this.state.teams.length;
    this.nextQuestion();
  }

  continueGame(): void {
    this.nextTurn();
  }

  getCurrentTeam(): Team | undefined {
    return this.state.teams[this.state.currentTeamIndex];
  }

  getLeaderboard(): Team[] {
    return [...this.state.teams].sort((a, b) => b.score - a.score);
  }

  reset(): void {
    this.stopTimer();
    this.state = this.getInitialState();
  }

  destroy(): void {
    this.stopTimer();
  }
}
