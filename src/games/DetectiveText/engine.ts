export interface Suspect {
  id: string;
  name: string;
  role: string;
  alibi: string;
  isGuilty: boolean;
  evidence: string[];
  dialogue: string;
}

export interface Clue {
  id: string;
  name: string;
  description: string;
  found: boolean;
  importance: 'low' | 'medium' | 'high' | 'crucial';
}

export interface Case {
  id: string;
  title: string;
  description: string;
  setting: string;
  victim: string;
  suspects: Suspect[];
  clues: Clue[];
  solution: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GameState {
  currentCaseId: string;
  caseData: Case | null;
  foundClues: string[];
  interrogatedSuspects: string[];
  accusationMade: boolean;
  accusationResult: boolean;
  progress: number;
  hintsUsed: number;
  score: number;
  isSolved: boolean;
}

const CASES: Case[] = [
  {
    id: 'case1',
    title: '午夜庄园谋杀案',
    description: '在豪华的月光庄园中，著名的收藏家周先生被发现死在他的书房里。死因为中毒。庄园里有四位嫌疑人，每个人都有各自的动机和秘密。',
    setting: '月光庄园的书房',
    victim: '周先生 - 著名收藏家',
    difficulty: 'medium',
    suspects: [
      {
        id: 'suspect1',
        name: '林小姐',
        role: '周先生的情人',
        alibi: '案发时我在自己的房间听音乐，没有人能证明。',
        isGuilty: false,
        evidence: ['昂贵的红酒标签', '一封未寄出的情书'],
        dialogue: '周先生? 我们确实有些矛盾，但他答应要娶我的...'
      },
      {
        id: 'suspect2',
        name: '王经理',
        role: '周先生的商业伙伴',
        alibi: '案发时我在与客户通电话，通话记录可以作证。',
        isGuilty: false,
        evidence: ['一份伪造的合同', '一张机票改签单'],
        dialogue: '周先生欠我一大笔钱，我们确实有过争执，但这不代表我会杀人。'
      },
      {
        id: 'suspect3',
        name: '陈医生',
        role: '周先生的私人医生',
        alibi: '案发时我刚离开庄园，这是我最后一次来访的记录。',
        isGuilty: true,
        evidence: ['一张毒药处方', '带有周先生指纹的茶杯'],
        dialogue: '作为医生，我确实知道很多毒药的知识，但这不代表我会用它来害人。'
      },
      {
        id: 'suspect4',
        name: '张管家',
        role: '庄园管家',
        alibi: '案发时我在厨房准备晚餐，厨师可以作证。',
        isGuilty: false,
        evidence: ['一套清洁工具', '一本旧日记'],
        dialogue: '我为周家服务了三十年，我怎么可能害老爷呢？'
      }
    ],
    clues: [
      { id: 'clue1', name: '茶杯中的残留物', description: '茶杯中检测出微量毒药残留，这证实了周先生是被人下毒的。', found: false, importance: 'crucial' },
      { id: 'clue2', name: '周先生的日记', description: '日记中提到周先生发现有人在偷他的收藏品。', found: false, importance: 'high' },
      { id: 'clue3', name: '陈医生的处方', description: '处方上记录了一种罕见毒药的配方。', found: false, importance: 'crucial' },
      { id: 'clue4', name: '书房窗户的痕迹', description: '窗户有被撬开的痕迹，但窗户是从内部锁上的。', found: false, importance: 'medium' },
      { id: 'clue5', name: '红酒瓶的标签', description: '标签显示这是一瓶极其昂贵的红酒。', found: false, importance: 'low' },
      { id: 'clue6', name: '一张合照', description: '照片中是周先生和四个嫌疑人，似乎是在一个聚会上拍摄的。', found: false, importance: 'low' },
      { id: 'clue7', name: '陈医生的名片', description: '名片上印着"专治疑难杂症"，名片在茶杯旁边发现。', found: false, importance: 'high' },
    ],
    solution: '凶手是陈医生。他是周先生的私人医生，知道周先生的作息和习惯。他利用职务之便，在给周先生送药时将毒药下在茶杯中。动机是为了得到周先生收藏的一幅名画，周先生曾承诺送给他，但后来反悔。'
  },
  {
    id: 'case2',
    title: '孤岛别墅的秘密',
    description: '五个人被困在一座孤岛上，因为暴风雨切断了所有交通。一夜之间，其中一人神秘死亡。究竟是谁下的手？',
    setting: '孤岛别墅',
    victim: '孙教授 - 知名考古学家',
    difficulty: 'hard',
    suspects: [
      {
        id: 'suspect1',
        name: '赵小姐',
        role: '孙教授的学生',
        alibi: '我在房间里整理资料，有人为我作证。',
        isGuilty: false,
        evidence: ['一叠考古笔记', '一张与孙教授的合影'],
        dialogue: '教授是我的恩师，我怎么可能害他？'
      },
      {
        id: 'suspect2',
        name: '钱先生',
        role: '艺术品商人',
        alibi: '我在酒吧喝酒，很多人都看到了我。',
        isGuilty: false,
        evidence: ['一张巨额支票', '一封威胁信'],
        dialogue: '孙教授欠我一个解释，那幅画明明说好给我的！'
      },
      {
        id: 'suspect3',
        name: '孙小姐',
        role: '孙教授的女儿',
        alibi: '我在海边散步，大约晚上10点到11点之间。',
        isGuilty: true,
        evidence: ['一管迷药', '孙教授的遗嘱草稿'],
        dialogue: '父亲总是忙于工作，从来不关心我。我只是想要继承我应得的东西。'
      },
      {
        id: 'suspect4',
        name: '周律师',
        role: '孙教授的法律顾问',
        alibi: '我在书房处理文件，停电时我正在楼上。',
        isGuilty: false,
        evidence: ['一份修改过的遗嘱', '一把备用钥匙'],
        dialogue: '我只是一个律师，为客户服务是我的职责。'
      },
      {
        id: 'suspect5',
        name: '吴船长',
        role: '岛屿渡轮船长',
        alibi: '我在船上检查设备，没有下船。',
        isGuilty: false,
        evidence: ['一条绳索', '一个信号弹'],
        dialogue: '我只是一个船长，不管你们这些有钱人的事。'
      }
    ],
    clues: [
      { id: 'clue1', name: '死因报告', description: '孙教授死于窒息，脖子上有勒痕。', found: false, importance: 'crucial' },
      { id: 'clue2', name: '一管迷药', description: '在孙小姐的房间里发现了迷药。', found: false, importance: 'crucial' },
      { id: 'clue3', name: '遗嘱草稿', description: '孙教授正准备修改遗嘱，取消女儿的继承权。', found: false, importance: 'high' },
      { id: 'clue4', name: '停电记录', description: '停电发生在晚上9点到10点之间，持续了约一小时。', found: false, importance: 'high' },
      { id: 'clue5', name: '海滩上的脚印', description: '海边有清晰的脚印，但通向海滩后就消失了。', found: false, importance: 'medium' },
      { id: 'clue6', name: '一条绳索', description: '在别墅后院发现了一条长绳索，上面有拉扯的痕迹。', found: false, importance: 'high' },
      { id: 'clue7', name: '孙教授的日记', description: '日记显示孙教授最近发现女儿沉迷赌博，欠下了巨额债务。', found: false, importance: 'high' },
      { id: 'clue8', name: '备用钥匙', description: '周律师有一把别墅的备用钥匙，但这并不能证明什么。', found: false, importance: 'low' },
    ],
    solution: '凶手是孙小姐。她先用药迷晕了父亲，然后在停电期间用绳索勒死了他。动机是她发现父亲准备修改遗嘱取消她的继承权，而她欠下了大量赌债，急需用钱。'
  },
  {
    id: 'case3',
    title: '剧本杀：谁是凶手',
    description: '在一个剧本杀游戏之夜，六位玩家齐聚一堂。然而，游戏变成了真实的谋杀案。一场精心策划的谋杀发生在众目睽睽之下...',
    setting: '剧本杀俱乐部',
    victim: '死者代号"黑桃A" - 玩家',
    difficulty: 'easy',
    suspects: [
      {
        id: 'suspect1',
        name: '玩家甲',
        role: '商人',
        alibi: '我一直在大厅与其他人聊天。',
        isGuilty: false,
        evidence: ['一本商业杂志', '一张名片'],
        dialogue: '我只是想玩个游戏放松一下，没想到会发生这种事。'
      },
      {
        id: 'suspect2',
        name: '玩家乙',
        role: '侦探',
        alibi: '我在角落里研究剧本，我以为这是游戏的一部分。',
        isGuilty: false,
        evidence: ['一个放大镜', '一个笔记本'],
        dialogue: '作为侦探角色，我一直在调查...但好像太晚了。'
      },
      {
        id: 'suspect3',
        name: '玩家丙',
        role: '医生',
        alibi: '我在休息区喝咖啡。',
        isGuilty: true,
        evidence: ['一个药瓶', '一双手套'],
        dialogue: '...'
      },
      {
        id: 'suspect4',
        name: '玩家丁',
        role: '记者',
        alibi: '我在采访其他玩家。',
        isGuilty: false,
        evidence: ['一个录音笔', '一些照片'],
        dialogue: '我只是个记者，对这些勾心斗角不感兴趣。'
      },
      {
        id: 'suspect5',
        name: '玩家戊',
        role: '律师',
        alibi: '我在打电话。',
        isGuilty: false,
        evidence: ['一个公文包', '一些文件'],
        dialogue: '我相信真相总会大白。'
      }
    ],
    clues: [
      { id: 'clue1', name: '死因', description: '死者死于中毒，毒药似乎被混在饮料中。', found: false, importance: 'crucial' },
      { id: 'clue2', name: '一个药瓶', description: '在玩家丙的座位下发现了这个药瓶。', found: false, importance: 'crucial' },
      { id: 'clue3', name: '手套', description: '一双手套被丢弃在垃圾桶里。', found: false, importance: 'high' },
      { id: 'clue4', name: '饮料杯', description: '死者的饮料杯上有残留物。', found: false, importance: 'crucial' },
      { id: 'clue5', name: '监控录像', description: '录像显示有一个人曾接近死者的饮料，但画面模糊。', found: false, importance: 'high' },
    ],
    solution: '凶手是玩家丙（医生）。他是死者的商业伙伴，欠了死者一大笔钱。他利用医生身份获取毒药，在游戏中趁乱将毒药下在死者的饮料中。手套是用来避免留下指纹的。'
  }
];

export class DetectiveTextEngine {
  private state: GameState;
  private onStateChange?: (state: GameState) => void;

  constructor() {
    const firstCase = CASES[0];
    this.state = {
      currentCaseId: firstCase.id,
      caseData: JSON.parse(JSON.stringify(firstCase)),
      foundClues: [],
      interrogatedSuspects: [],
      accusationMade: false,
      accusationResult: false,
      progress: 0,
      hintsUsed: 0,
      score: 100,
      isSolved: false,
    };
  }

  public setStateChangeCallback(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  private notifyChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public getCurrentCase(): Case | null {
    return this.state.caseData;
  }

  public getFoundClues(): Clue[] {
    if (!this.state.caseData) return [];
    return this.state.caseData.clues.filter(c => this.state.foundClues.includes(c.id));
  }

  public getAvailableClues(): Clue[] {
    if (!this.state.caseData) return [];
    return this.state.caseData.clues.filter(c => !this.state.foundClues.includes(c.id));
  }

  public getSuspects(): Suspect[] {
    return this.state.caseData?.suspects || [];
  }

  public investigate(): { found: boolean; clue: Clue | null; message: string } {
    if (this.state.isSolved) {
      return { found: false, clue: null, message: '案件已解决！' };
    }

    const availableClues = this.getAvailableClues();
    if (availableClues.length === 0) {
      return { found: false, clue: null, message: '所有线索都已找到！' };
    }

    const importanceWeights = {
      low: 0.3,
      medium: 0.35,
      high: 0.25,
      crucial: 0.1
    };

    const weights = availableClues.map(c => importanceWeights[c.importance]);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const random = Math.random() * totalWeight;

    let currentWeight = 0;
    let selectedClue: Clue | null = null;

    for (let i = 0; i < availableClues.length; i++) {
      currentWeight += weights[i];
      if (random <= currentWeight) {
        selectedClue = availableClues[i];
        break;
      }
    }

    if (!selectedClue) {
      selectedClue = availableClues[Math.floor(Math.random() * availableClues.length)];
    }

    this.state.foundClues.push(selectedClue.id);
    this.updateProgress();

    const pointsEarned = {
      low: 5,
      medium: 10,
      high: 15,
      crucial: 20
    };
    this.state.score += pointsEarned[selectedClue.importance];

    this.notifyChange();

    return {
      found: true,
      clue: selectedClue,
      message: `发现了重要线索：${selectedClue.name}！`
    };
  }

  public interrogate(suspectId: string): { success: boolean; dialogue: string; evidence: string[] } {
    if (this.state.isSolved) {
      return { success: false, dialogue: '案件已解决！', evidence: [] };
    }

    if (this.state.interrogatedSuspects.includes(suspectId)) {
      const suspect = this.state.caseData?.suspects.find(s => s.id === suspectId);
      return {
        success: true,
        dialogue: suspect?.dialogue || '...',
        evidence: suspect?.evidence || []
      };
    }

    this.state.interrogatedSuspects.push(suspectId);
    this.updateProgress();

    const suspect = this.state.caseData?.suspects.find(s => s.id === suspectId);
    if (!suspect) {
      return { success: false, dialogue: '找不到嫌疑人', evidence: [] };
    }

    this.notifyChange();

    return {
      success: true,
      dialogue: suspect.dialogue,
      evidence: suspect.evidence
    };
  }

  public accuse(suspectId: string): { correct: boolean; message: string; solution: string } {
    if (this.state.isSolved) {
      return { correct: false, message: '案件已解决！', solution: '' };
    }

    if (this.state.accusationMade) {
      return { correct: false, message: '你已经做出过指控！', solution: '' };
    }

    const suspect = this.state.caseData?.suspects.find(s => s.id === suspectId);
    if (!suspect) {
      return { correct: false, message: '找不到嫌疑人', solution: '' };
    }

    this.state.accusationMade = true;
    this.state.accusationResult = suspect.isGuilty;
    this.state.isSolved = true;

    const crucialCluesFound = this.state.foundClues.filter(id => {
      const clue = this.state.caseData?.clues.find(c => c.id === id);
      return clue?.importance === 'crucial';
    }).length;

    const penalty = this.state.hintsUsed * 10 + (3 - crucialCluesFound) * 20;
    this.state.score = Math.max(0, this.state.score - penalty);

    if (suspect.isGuilty) {
      this.state.score += 50;
    }

    this.notifyChange();

    if (suspect.isGuilty) {
      return {
        correct: true,
        message: `正确！${suspect.name} 就是凶手！`,
        solution: this.state.caseData?.solution || ''
      };
    } else {
      return {
        correct: false,
        message: `错误！${suspect.name} 不是凶手。真正的凶手另有其人...`,
        solution: ''
      };
    }
  }

  public useHint(): { available: boolean; hint: string } {
    if (this.state.isSolved) {
      return { available: false, hint: '' };
    }

    this.state.hintsUsed++;
    this.state.score = Math.max(0, this.state.score - 15);

    const foundClues = this.getFoundClues();
    const crucialFound = foundClues.filter(c => c.importance === 'crucial');
    const highFound = foundClues.filter(c => c.importance === 'high');

    if (crucialFound.length === 0) {
      return {
        available: true,
        hint: '提示：尝试调查现场，可能会有重要发现。关键线索往往藏在细节中。'
      };
    } else if (highFound.length < 2) {
      return {
        available: true,
        hint: '提示：嫌疑人的证词可能有隐藏的证据。试着询问每个人，看看能发现什么。'
      };
    } else {
      return {
        available: true,
        hint: '提示：综合你找到的所有线索，凶手一定有动机和机会。想一想谁最有作案的可能。'
      };
    }
  }

  private updateProgress(): void {
    if (!this.state.caseData) return;

    const totalElements = this.state.caseData.clues.length + this.state.caseData.suspects.length;
    const foundElements = this.state.foundClues.length + this.state.interrogatedSuspects.length;

    this.state.progress = Math.min(100, Math.round((foundElements / totalElements) * 100));
  }

  public nextCase(): boolean {
    const currentIndex = CASES.findIndex(c => c.id === this.state.currentCaseId);
    if (currentIndex >= CASES.length - 1) {
      return false;
    }

    const nextCase = CASES[currentIndex + 1];
    this.state = {
      currentCaseId: nextCase.id,
      caseData: JSON.parse(JSON.stringify(nextCase)),
      foundClues: [],
      interrogatedSuspects: [],
      accusationMade: false,
      accusationResult: false,
      progress: 0,
      hintsUsed: 0,
      score: 100,
      isSolved: false,
    };

    this.notifyChange();
    return true;
  }

  public restart(): void {
    const currentCase = CASES.find(c => c.id === this.state.currentCaseId);
    if (!currentCase) return;

    this.state = {
      currentCaseId: currentCase.id,
      caseData: JSON.parse(JSON.stringify(currentCase)),
      foundClues: [],
      interrogatedSuspects: [],
      accusationMade: false,
      accusationResult: false,
      progress: 0,
      hintsUsed: 0,
      score: 100,
      isSolved: false,
    };

    this.notifyChange();
  }

  public saveState(): string {
    return JSON.stringify(this.state);
  }

  public loadState(savedData: string): boolean {
    try {
      this.state = JSON.parse(savedData);
      this.notifyChange();
      return true;
    } catch {
      return false;
    }
  }

  public getEndingMessage(): { title: string; message: string; score: number } {
    if (!this.state.accusationMade) {
      return {
        title: '案件未解决',
        message: '你放弃了调查...',
        score: 0
      };
    }

    if (this.state.accusationResult) {
      return {
        title: '案件解决！',
        message: '你成功找出了凶手！',
        score: this.state.score
      };
    } else {
      return {
        title: '调查失败',
        message: '你指控错了嫌疑人...',
        score: Math.max(0, this.state.score - 30)
      };
    }
  }
}
