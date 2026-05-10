export interface Player {
  id: number;
  name: string;
  isSpy: boolean;
  hasVoted: boolean;
  isEliminated: boolean;
  votes: number;
}

export interface SpyGameState {
  gamePhase: 'setup' | 'role分配' | '描述阶段' | '投票阶段' | '结果' | '游戏结束';
  players: Player[];
  normalWord: string;
  spyWord: string;
  currentPlayerIndex: number;
  currentDescription: string;
  descriptions: { playerId: number; text: string }[];
  timeLeft: number;
  round: number;
  maxRounds: number;
  playerCount: number;
  spyCount: number;
  currentVoteTarget: number | null;
  eliminatedPlayer: Player | null;
  gameResult: 'civilians' | 'spies' | null;
  discussionTime: number;
}

const WORD_PAIRS = [
  ['苹果', '梨'], ['手机', '电脑'], ['猫', '狗'], ['飞机', '火车'], ['太阳', '月亮'],
  ['咖啡', '茶'], ['足球', '篮球'], ['医生', '护士'], ['警察', '小偷'], ['老板', '员工'],
  ['老师', '学生'], ['医生', '病人'], ['爸爸', '妈妈'], ['哥哥', '弟弟'], ['姐姐', '妹妹'],
  ['爷爷', '奶奶'], ['叔叔', '阿姨'], ['面包', '蛋糕'], ['可乐', '雪碧'], ['米饭', '面条'],
  ['汽车', '摩托车'], ['自行车', '电动车'], ['飞机', '火箭'], ['轮船', '潜水艇'], ['雨伞', '雨衣'],
  ['帽子', '围巾'], ['手表', '手环'], ['眼镜', '墨镜'], ['耳机', '音响'], ['鼠标', '键盘'],
  ['沙发', '床'], ['桌子', '椅子'], ['台灯', '吊灯'], ['冰箱', '空调'], ['洗衣机', '烘干机'],
  ['手机壳', '手机膜'], ['牙刷', '牙膏'], ['毛巾', '浴巾'], ['洗发水', '护发素'], ['洗面奶', '面膜'],
  ['米饭', '馒头'], ['饺子', '包子'], ['火锅', '烧烤'], ['披萨', '汉堡'], ['炸鸡', '薯条'],
  ['可乐', '芬达'], ['牛奶', '酸奶'], ['咖啡', '奶茶'], ['红酒', '白酒'], ['啤酒', '黄酒'],
  ['老虎', '狮子'], ['熊猫', '猴子'], ['兔子', '仓鼠'], ['金鱼', '热带鱼'], ['猫头鹰', '啄木鸟'],
  ['玫瑰', '百合'], ['牡丹', '菊花'], ['梅花', '兰花'], ['荷花', '桃花'], ['樱花', '杏花'],
  ['苹果', '香蕉'], ['葡萄', '西瓜'], ['橙子', '柚子'], ['草莓', '蓝莓'], ['菠萝', '芒果'],
  ['大海', '河流'], ['高山', '平原'], ['森林', '草原'], ['沙漠', '绿洲'], ['火山', '雪山'],
  ['北京', '上海'], ['东京', '首尔'], ['巴黎', '伦敦'], ['纽约', '洛杉矶'], ['悉尼', '墨尔本'],
];

export class SpyGameEngine {
  private state: SpyGameState;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): SpyGameState {
    return {
      gamePhase: 'setup',
      players: [],
      normalWord: '',
      spyWord: '',
      currentPlayerIndex: 0,
      currentDescription: '',
      descriptions: [],
      timeLeft: 30,
      round: 1,
      maxRounds: 3,
      playerCount: 6,
      spyCount: 1,
      currentVoteTarget: null,
      eliminatedPlayer: null,
      gameResult: null,
      discussionTime: 60
    };
  }

  getState(): SpyGameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  setPlayerCount(count: number): void {
    this.state.playerCount = Math.max(4, Math.min(12, count));
    this.state.spyCount = Math.max(1, Math.floor(this.state.playerCount / 5));
  }

  setMaxRounds(rounds: number): void {
    this.state.maxRounds = rounds;
  }

  startGame(): void {
    this.state.round = 1;
    this.state.gamePhase = 'role分配';
    this.state.players = this.generatePlayers();
    this.assignRoles();
    this.state.gamePhase = '描述阶段';
    this.state.currentPlayerIndex = 0;
    this.state.descriptions = [];
    this.state.timeLeft = 30;
  }

  private generatePlayers(): Player[] {
    const players: Player[] = [];
    for (let i = 0; i < this.state.playerCount; i++) {
      players.push({
        id: i,
        name: `玩家${i + 1}`,
        isSpy: false,
        hasVoted: false,
        isEliminated: false,
        votes: 0
      });
    }
    return players;
  }

  private assignRoles(): void {
    const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    this.state.normalWord = pair[0];
    this.state.spyWord = pair[1];

    const spyIndices: number[] = [];
    while (spyIndices.length < this.state.spyCount) {
      const index = Math.floor(Math.random() * this.state.playerCount);
      if (!spyIndices.includes(index)) {
        spyIndices.push(index);
      }
    }

    this.state.players = this.state.players.map((player, index) => ({
      ...player,
      isSpy: spyIndices.includes(index)
    }));
  }

  submitDescription(description: string): void {
    this.state.descriptions.push({
      playerId: this.state.players[this.state.currentPlayerIndex].id,
      text: description
    });
    this.state.currentPlayerIndex++;

    if (this.state.currentPlayerIndex >= this.state.playerCount) {
      this.state.gamePhase = '投票阶段';
      this.state.currentPlayerIndex = 0;
      this.state.players = this.state.players.map(p => ({ ...p, hasVoted: false, votes: 0 }));
      this.state.timeLeft = this.state.discussionTime;
    } else {
      this.state.timeLeft = 30;
    }
  }

  voteFor(playerId: number): void {
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    if (currentPlayer.hasVoted) return;

    currentPlayer.hasVoted = true;
    currentPlayer.currentVoteTarget = playerId;

    const targetPlayer = this.state.players.find(p => p.id === playerId);
    if (targetPlayer) {
      targetPlayer.votes++;
    }

    this.state.currentPlayerIndex++;

    if (this.state.players.every(p => p.hasVoted)) {
      this.resolveVote();
    }
  }

  skipVote(): void {
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    currentPlayer.hasVoted = true;
    this.state.currentPlayerIndex++;

    if (this.state.players.every(p => p.hasVoted)) {
      this.resolveVote();
    }
  }

  private resolveVote(): void {
    let maxVotes = 0;
    let candidates: Player[] = [];

    for (const player of this.state.players) {
      if (player.votes > maxVotes) {
        maxVotes = player.votes;
        candidates = [player];
      } else if (player.votes === maxVotes && maxVotes > 0) {
        candidates.push(player);
      }
    }

    if (candidates.length === 1 && maxVotes > 0) {
      this.state.eliminatedPlayer = candidates[0];
      this.state.eliminatedPlayer.isEliminated = true;

      if (this.state.eliminatedPlayer.isSpy) {
        this.state.gameResult = 'civilians';
        this.state.gamePhase = '游戏结束';
        return;
      }

      const remainingSpies = this.state.players.filter(p => !p.isSpy && !p.isEliminated);
      const remainingPlayers = this.state.players.filter(p => !p.isEliminated);
      
      if (remainingSpies.length >= remainingPlayers.length / 2) {
        this.state.gameResult = 'spies';
        this.state.gamePhase = '游戏结束';
        return;
      }
    }

    if (this.state.round >= this.state.maxRounds) {
      this.state.gameResult = 'spies';
      this.state.gamePhase = '游戏结束';
      return;
    }

    this.state.round++;
    this.state.gamePhase = '描述阶段';
    this.state.currentPlayerIndex = 0;
    this.state.descriptions = [];
    this.state.players = this.state.players.map(p => ({ ...p, hasVoted: false, votes: 0 }));
    this.state.timeLeft = 30;
  }

  updateTime(): void {
    this.state.timeLeft = Math.max(0, this.state.timeLeft - 1);
  }

  getPlayerWord(playerId: number): string {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return '';
    return player.isSpy ? this.state.spyWord : this.state.normalWord;
  }

  isPlayerSpy(playerId: number): boolean {
    const player = this.state.players.find(p => p.id === playerId);
    return player?.isSpy || false;
  }

  reset(): void {
    this.state = this.getInitialState();
  }

  destroy(): void {}
}
