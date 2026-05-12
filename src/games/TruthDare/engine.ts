export interface TruthDareState {
  gamePhase: 'setup' | 'playing' | 'result';
  currentChoice: 'truth' | 'dare' | null;
  currentQuestion: string;
  currentDare: string;
  timeLeft: number;
  score: number;
  round: number;
  maxRounds: number;
  playerName: string;
  completedChallenges: string[];
}

export const TRUTH_QUESTIONS = [
  '你上一次撒谎是什么时候？',
  '你最喜欢的偶像是谁？',
  '你有没有偷偷喜欢过朋友的对象？',
  '你最尴尬的穿着经历是什么？',
  '你做过的最疯狂的事情是什么？',
  '你有没有偷看过别人的隐私？',
  '你最不想让父母知道的事情是什么？',
  '你有没有在背后说过朋友的坏话？',
  '你最喜欢的电影是哪一部，为什么？',
  '如果可以隐形，你会做什么？',
  '你暗恋过老师吗？',
  '你最讨厌什么食物？',
  '你有没有在考试中作弊过？',
  '你对自己哪里最不满意？',
  '你有没有想过出轨？',
  '你手机里最大的秘密是什么？',
  '你最尴尬的相亲经历是什么？',
  '你有没有在公共场合出过丑？',
  '你收到的最奇葩的礼物是什么？',
  '你有没有同时喜欢过两个人？',
  '你最不想删除的照片是什么？',
  '你有没有偷偷借钱给前任？',
  '你做过最丢脸的事是什么？',
  '你有没有在梦里骂过人？',
  '你最怕什么动物？',
  '你有没有当众唱歌出过糗？',
  '你最尴尬的表白经历是什么？',
  '你有没有偷吃过别人的零食？',
  '你手机里有多少张自拍？',
  '你有没有说过别人的坏话然后被发现？',
  '你最不为人知的爱好是什么？',
  '你有没有迷过网络游戏？',
  '你最害怕失去什么？',
  '你有没有在课堂上做过搞笑的事？',
  '你收到的情书还在吗？',
  '你有没有偷偷花过家里的钱？',
  '你最想吐槽的明星是谁？',
  '你有没有在KTV唱哭过？',
  '你第一次心动是什么时候？',
  '你有没有删过重要的人的消息？',
];

export const DARE_CHALLENGES = [
  '模仿在场任意一人的说话方式',
  '用方言说"我爱你"',
  '给最近联系的人发"我想你了"',
  '做10个俯卧撑',
  '模仿一种动物的声音',
  '学鸭子走路绕房间一圈',
  '用屁股写自己的名字',
  '当场模仿最近火的短视频',
  '给父母打电话说"我想你们了"',
  '唱一首情歌的副歌部分',
  '做鬼脸拍照发朋友圈',
  '当场表白你最好的朋友',
  '学偶像剧台词大声告白',
  '扮演天气预报员播报天气',
  '用尽全身力气挤眉弄眼',
  '模仿你最喜欢的明星',
  '当场来段freestyle',
  '用左手写自己的名字',
  '模仿3个不同的卡通人物',
  '学大妈在广场上跳舞',
  '表演一个电影片段',
  '当场学猫叫狗叫',
  '用rap介绍在场的所有人',
  '模仿你最好的朋友说话',
  '表演一个魔术小把戏',
  '学周星驰经典台词',
  '用三种不同的语言说"你好"',
  '当场模仿动漫人物',
  '学婴儿爬行10秒钟',
  '表演一个你最害怕的动作',
  '用普通话搞笑播报新闻',
  '模仿5个同学的声音',
  '当场表演一个才艺',
  '学机器人说话和动作',
  '扮演一个你认为最无聊的人',
  '用唱歌的方式自我介绍',
  '模仿你父母的语气说话',
  '表演一段小品或相声',
  '学特朗普说中文',
  '用搞笑的方式自我介绍',
  '表演一个网络热门动作',
];

export class TruthDareEngine {
  private state: TruthDareState;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): TruthDareState {
    return {
      gamePhase: 'setup',
      currentChoice: null,
      currentQuestion: '',
      currentDare: '',
      timeLeft: 30,
      score: 0,
      round: 1,
      maxRounds: 10,
      playerName: '',
      completedChallenges: []
    };
  }

  getState(): TruthDareState {
    return { ...this.state };
  }

  setPlayerName(name: string): void {
    this.state.playerName = name;
  }

  setMaxRounds(rounds: number): void {
    this.state.maxRounds = rounds;
  }

  startGame(): void {
    this.state.gamePhase = 'playing';
    this.state.round = 1;
    this.state.score = 0;
    this.state.completedChallenges = [];
    this.pickNewChallenge();
  }

  private pickNewChallenge(): void {
    if (Math.random() > 0.5) {
      this.state.currentChoice = 'truth';
      this.state.currentQuestion = TRUTH_QUESTIONS[Math.floor(Math.random() * TRUTH_QUESTIONS.length)];
    } else {
      this.state.currentChoice = 'dare';
      this.state.currentDare = DARE_CHALLENGES[Math.floor(Math.random() * DARE_CHALLENGES.length)];
    }
  }

  chooseTruth(): void {
    this.state.currentChoice = 'truth';
  }

  chooseDare(): void {
    this.state.currentChoice = 'dare';
  }

  completeChallenge(): void {
    this.state.score += this.state.currentChoice === 'dare' ? 15 : 10;
    if (this.state.currentChoice === 'dare') {
      this.state.completedChallenges.push(this.state.currentDare);
    } else {
      this.state.completedChallenges.push(this.state.currentQuestion);
    }
    
    if (this.state.round >= this.state.maxRounds) {
      this.state.gamePhase = 'result';
    } else {
      this.state.round++;
      this.pickNewChallenge();
    }
  }

  skipChallenge(): void {
    if (this.state.round >= this.state.maxRounds) {
      this.state.gamePhase = 'result';
    } else {
      this.state.round++;
      this.pickNewChallenge();
    }
  }

  updateTime(): void {
    this.state.timeLeft = Math.max(0, this.state.timeLeft - 1);
  }

  setTimeLeft(time: number): void {
    this.state.timeLeft = time;
  }

  reset(): void {
    this.state = this.getInitialState();
  }

  destroy(): void {}
}
