export interface StoryNode {
  id: string;
  title: string;
  content: string;
  choices: StoryChoice[];
  background?: string;
}

export interface StoryChoice {
  id: string;
  text: string;
  nextNodeId: string;
  requiredStats?: Partial<PlayerStats>;
  effect?: Partial<PlayerStats>;
}

export interface PlayerStats {
  hp: number;
  mp: number;
  str: number;
  wis: number;
  cha: number;
  luck: number;
}

export interface GameState {
  currentNodeId: string;
  stats: PlayerStats;
  history: string[];
  choicesMade: number;
  ending: string | null;
  isGameOver: boolean;
}

export const STORY_DATA: Record<string, StoryNode> = {
  start: {
    id: 'start',
    title: '命运的十字路口',
    content: `在一个暴风雨的夜晚，你独自走在回家的路上。天空电闪雷鸣，雨水模糊了视线。

突然，一道闪电劈中了路边的老树，你看到树干中似乎有什么东西在发光。

就在你犹豫要不要靠近查看时，远处传来了急促的脚步声和呼救声。`,
    choices: [
      { id: 'investigate', text: '走近查看树中的发光物体', nextNodeId: 'magic_tree' },
      { id: 'rescue', text: '循着呼救声去查看', nextNodeId: 'rescue_person' },
      { id: 'ignore', text: '假装没看见，继续赶路回家', nextNodeId: 'walk_home' }
    ]
  },
  magic_tree: {
    id: 'magic_tree',
    title: '魔法古树',
    content: `你小心翼翼地走近那棵被闪电劈中的老树。近看才发现，那道闪光来自树干中镶嵌的一块蓝色宝石。

就在你伸手触碰宝石的瞬间，一道温暖的光芒将你包裹。你感觉体内有什么东西被唤醒了。

同时，你的耳边响起了一个苍老的声音："年轻的旅人，你被选中了..."`,
    choices: [
      { id: 'accept', text: '接受这份力量', nextNodeId: 'accept_power', effect: { mp: 20, wis: 5 } },
      { id: 'refuse', text: '拒绝这份力量', nextNodeId: 'refuse_power' },
      { id: 'ask', text: '询问声音的来源', nextNodeId: 'ask_source' }
    ]
  },
  accept_power: {
    id: 'accept_power',
    title: '魔法的觉醒',
    content: `光芒涌入你的身体，你感到前所未有的力量在体内流淌。

当你睁开眼睛时，你发现自己身处一个陌生的空间——这里像是一个漂浮在星空中的古老图书馆。

一个身披长袍的老者出现在你面前，他微笑着说："欢迎来到魔法学院，你是我们等待已久的继承者。"`,
    choices: [
      { id: 'academy', text: '跟随老者前往魔法学院', nextNodeId: 'magic_academy' },
      { id: 'question', text: '先问清楚状况', nextNodeId: 'ask_academy' }
    ]
  },
  refuse_power: {
    id: 'refuse_power',
    title: '平凡之路',
    content: `你后退一步，拒绝了神秘的力量。

宝石的光芒渐渐暗淡，那个声音叹了口气："可惜了，年轻人..."

当你回过神来，发现自己已经错过了呼救声传来的方向。雨越下越大，你决定继续赶路回家。`,
    choices: [
      { id: 'home', text: '回家休息', nextNodeId: 'ending_ordinary' }
    ]
  },
  ask_source: {
    id: 'ask_source',
    title: '古树的秘密',
    content: `"我是这棵古树的守护精灵，已经在这里等待了千年。"苍老的声音回答。

"每一个时代，都会有一位被选中的人来继承古老的力量。而今晚的闪电，正是命运的召唤。"

精灵的声音渐渐微弱："时间不多了，年轻人，做出你的选择吧。"`,
    choices: [
      { id: 'accept2', text: '接受这份传承', nextNodeId: 'accept_power', effect: { mp: 30, wis: 10 } },
      { id: 'leave', text: '转身离开', nextNodeId: 'ending_ordinary' }
    ]
  },
  rescue_person: {
    id: 'rescue_person',
    title: '雨夜救援',
    content: `你循着呼救声跑去，在一个小巷里发现了一个倒在雨水中的老人。

老人浑身湿透，看起来伤势不轻。你赶紧上前扶起他。

"谢谢你，年轻人..."老人虚弱地说，"我叫艾伦，是个旅行商人。这些强盗..."`,
    choices: [
      { id: 'help', text: '带老人去附近的医院', nextNodeId: 'hospital', effect: { cha: 5, luck: 10 } },
      { id: 'fight', text: '询问强盗的去向，准备追击', nextNodeId: 'pursue_bandits' }
    ]
  },
  hospital: {
    id: 'hospital',
    title: '意外的回报',
    content: `你冒着大雨将老人送到了医院。医生说幸好送得及时，老人的伤势已经稳定。

第二天，老人的家人找到了你。他们是一户商人世家，对你感激不尽。

"这是我们的一点心意，请收下。"老人递给你一个精致的盒子，"这里面是我的传家宝，希望能帮到你。"`,
    choices: [
      { id: 'accept_gift', text: '接受礼物', nextNodeId: 'ending_wealthy' },
      { id: 'polite', text: '婉拒，说助人是应该的', nextNodeId: 'ending_hero' }
    ]
  },
  pursue_bandits: {
    id: 'pursue_bandits',
    title: '追击强盗',
    content: `根据老人指的方向，你追上了那几个强盗。

他们看起来很惊讶——没想到会有人追来。

"小子，识相的就滚开！"为首的强盗威胁道。

你环顾四周，注意到路边有一根铁棍...`,
    choices: [
      { id: 'fight_bandits', text: '捡起铁棍与强盗搏斗', nextNodeId: 'fight_result', effect: { str: 5 } },
      { id: 'sneak', text: '悄悄跟踪，寻找机会报警', nextNodeId: 'sneak_follow' }
    ]
  },
  fight_result: {
    id: 'fight_result',
    title: '英勇的战斗',
    content: `你抓起铁棍冲向强盗，经过一番激烈的搏斗，你成功将他们一一击倒。

其他路人也加入了制服强盗的行列。最终，警察赶到将强盗全部逮捕。

你成了那晚的英雄，登上了新闻。当地居民纷纷称赞你的勇气。`,
    choices: [
      { id: 'fame', text: '接受采访，成为名人', nextNodeId: 'ending_famous' },
      { id: 'humble', text: '低调离开，不求回报', nextNodeId: 'ending_hero' }
    ]
  },
  sneak_follow: {
    id: 'sneak_follow',
    title: '智取强盗',
    content: `你悄悄跟踪强盗们来到他们的巢穴，记下了地址后立刻报警。

警方根据你的情报成功捣毁了一个长期作案的强盗团伙，并缴获了大量赃物。

你虽然没有亲自战斗，但你的智慧为社会除了一害。`,
    choices: [
      { id: 'continue', text: '继续你的旅程', nextNodeId: 'ending_hero' }
    ]
  },
  walk_home: {
    id: 'walk_home',
    title: '错过的命运',
    content: `你决定不理会这些"闲事"，继续向家的方向走去。

回到温暖的家，你为自己泡了一杯热茶，庆幸自己没惹上麻烦。

但不知为何，当晚你做了一个奇怪的梦——梦中有光，有声音，还有一个模糊的影子在呼唤你的名字...`,
    choices: [
      { id: 'forget', text: '把它当作普通的梦', nextNodeId: 'ending_ordinary' }
    ]
  },
  magic_academy: {
    id: 'magic_academy',
    title: '魔法学院',
    content: `你跟随老者来到了传说中的魔法学院。这里有高耸入云的塔楼，漂浮的图书馆，还有会说话的雕像。

"从今天起，你就是这里的学生了。"老者说，"不过在那之前，你需要通过入学测试。"

测试的内容是——在一小时内找到学院藏起来的五颗魔法宝石。`,
    choices: [
      { id: 'search_careful', text: '仔细搜索每一个角落', nextNodeId: 'academy_search' },
      { id: 'ask_hint', text: '向老者请教线索', nextNodeId: 'academy_hint', effect: { wis: 5 } }
    ]
  },
  ask_academy: {
    id: 'ask_academy',
    title: '魔法学院的真相',
    content: `老者耐心地解释了一切：

"这个世界分为凡界和魔法界。很久以前，有一股黑暗力量威胁着两界的安全。"

"当年的英雄们将黑暗封印，但封印需要传承者来维持。这就是为什么会有魔法学院。"

"而你，就是被命运选中的继承者。"`,
    choices: [
      { id: 'ready', text: '我准备好了，请带我去学院', nextNodeId: 'magic_academy' },
      { id: 'doubt', text: '这一切来得太突然，我需要时间考虑', nextNodeId: 'ending_doubt' }
    ]
  },
  academy_search: {
    id: 'academy_search',
    title: '寻宝之旅',
    content: `你开始仔细搜索学院的每一个角落。在古老图书馆的一本书中，你发现了一张藏宝图。

按照地图的指引，你找到了四颗宝石。但最后一颗似乎在一个危险的地方——学院的地下禁区。

禁区门口写着警告：未经许可进入者，后果自负。`,
    choices: [
      { id: 'enter', text: '冒险进入禁区', nextNodeId: 'forbidden_zone' },
      { id: 'report', text: '向学院报告情况', nextNodeId: 'academy_report' }
    ]
  },
  academy_hint: {
    id: 'academy_hint',
    title: '智慧的指引',
    content: `老者给了你一个提示："真正的宝藏不在于你找到什么，而在于你在这个过程中学到了什么。"

你恍然大悟，开始用心灵去感受学院的气息。很快，五颗宝石的位置都浮现在你的脑海中。

测试结束后，老者满意地点点头："你不仅有力量，更有智慧。这是更难得的品质。"`,
    choices: [
      { id: 'continue_academy', text: '继续你的学院生活', nextNodeId: 'academy_success' }
    ]
  },
  forbidden_zone: {
    id: 'forbidden_zone',
    title: '禁区探险',
    content: `你鼓起勇气进入了禁区。里面一片漆黑，只有微弱的光源在远处闪烁。

走着走着，你发现那光源来自一只沉睡的巨龙！

巨龙睁开眼睛，但没有攻击你。它开口说："又一个挑战者。我给你一个机会——回答我的问题，否则..."`,
    choices: [
      { id: 'answer', text: '认真回答巨龙的问题', nextNodeId: 'dragon_riddle' },
      { id: 'run', text: '转身逃跑', nextNodeId: 'escape_dragon' }
    ]
  },
  dragon_riddle: {
    id: 'dragon_riddle',
    title: '巨龙的谜题',
    content: `巨龙提出了一个谜题："我比王冠更珍贵，比时间更永恒。没有我，世界将一片黑暗。请告诉我，我是什么？"

你思考片刻后回答："是知识。因为知识可以超越王冠的荣耀，穿越时间的流逝。没有知识，一切都将是黑暗。"`,
    choices: [
      { id: 'correct', text: '揭晓答案', nextNodeId: 'ending_wizard' }
    ]
  },
  escape_dragon: {
    id: 'escape_dragon',
    title: '仓皇逃脱',
    content: `你转身就跑，但巨龙并没有追来。

当你气喘吁吁地逃出来时，发现自己错过了测试时间。

老者叹息道："勇气固然重要，但智慧同样不可或缺。"

你失去了入学机会，但获得了宝贵的教训。`,
    choices: [
      { id: 'try_again', text: '申请重试', nextNodeId: 'ending_retry' }
    ]
  },
  academy_report: {
    id: 'academy_report',
    title: '诚实的选择',
    content: `你向学院报告了第五颗宝石在禁区的情况。

院长亲自表扬了你："在魔法世界，诚实是最重要的品质之一。宝石固然重要，但品格的考验更加关键。"

你不仅通过了测试，还被授予了"诚实勋章"。`,
    choices: [
      { id: 'continue_academy2', text: '继续你的学院生活', nextNodeId: 'academy_success' }
    ]
  },
  academy_success: {
    id: 'academy_success',
    title: '新的开始',
    content: `你在魔法学院开始了新的生活。每天学习魔法知识，与同学们一起冒险。

很快，你就成为了学院里最优秀的学生之一。

你的旅程才刚刚开始，未来还有更多的挑战和冒险在等待着你...`,
    choices: [
      { id: 'ending', text: '迎接新的命运', nextNodeId: 'ending_wizard' }
    ]
  },
  ending_ordinary: {
    id: 'ending_ordinary',
    title: '【普通结局】平凡的生活',
    content: `你选择了平凡的生活，继续过着普通人的日子。

那个雨夜的奇遇被你渐渐淡忘。或许那只是一场梦，或许你错过了一次改变命运的机会。

但谁说平凡不是一种幸福呢？

——游戏结束——`,
    choices: [],
    background: 'ending'
  },
  ending_wealthy: {
    id: 'ending_wealthy',
    title: '【财富结局】意外的收获',
    content: `你接受了老人的礼物。盒子里是一块珍贵的宝石，价值连城。

通过变卖宝石，你获得了创业的资金。从此，你成为了一个成功的商人。

虽然你没有成为英雄或魔法师，但你过上了富足的生活。也许这就是属于你的幸福。

——游戏结束——`,
    choices: [],
    background: 'ending'
  },
  ending_hero: {
    id: 'ending_hero',
    title: '【英雄结局】无名的正义',
    content: `你选择不求回报，但你的善行传遍了整个城市。

人们称你为"雨夜英雄"。虽然你不知道他们的名字，但你感受到了助人的快乐。

更重要的是，你的正义感感染了身边的人，这个城市变得越来越美好。

这，就是你想要的英雄人生。

——游戏结束——`,
    choices: [],
    background: 'ending'
  },
  ending_famous: {
    id: 'ending_famous',
    title: '【名人结局】聚光灯下',
    content: `你接受了采访，一夜成名。电视、报纸、社交媒体，到处都是关于你的报道。

"雨夜英雄"成了你的标签，各种商业代言和采访邀约纷至沓来。

但夜深人静时，你也会想起那个雨夜，想起如果你选择了另一条路，现在会是什么样子...

——游戏结束——`,
    choices: [],
    background: 'ending'
  },
  ending_doubt: {
    id: 'ending_doubt',
    title: '【犹豫结局】错失良机',
    content: `你说需要时间考虑。老者点点头："每个人都有自己的选择。"

当你终于下定决心要接受这份力量时，却发现宝石的光芒已经消失了。

古树恢复了平静，仿佛什么都没有发生过。

也许，这就是命运的安排。你错过了唯一的机会。

——游戏结束——`,
    choices: [],
    background: 'ending'
  },
  ending_retry: {
    id: 'ending_retry',
    title: '【重新开始结局】再次启程',
    content: `虽然没有通过入学测试，但学院愿意给你一个重新来过的机会。

你深吸一口气，重新站在了测试的起点。

这一次，你会做出不同的选择吗？

——重新开始——`,
    choices: [],
    background: 'ending'
  },
  ending_wizard: {
    id: 'ending_wizard',
    title: '【魔法师结局】命运的继承者',
    content: `你通过了所有的考验，正式成为了魔法学院的学员。

在毕业典礼上，你被授予了魔法师的称号。你站在高塔之上，俯瞰着整个魔法世界。

你的命运齿轮从此转动，未来的道路虽然充满未知，但你已经准备好了。

欢迎来到魔法的世界，年轻的大法师！

——游戏结束——`,
    choices: [],
    background: 'ending'
  }
};

export class StoryChoiceEngine {
  private state: GameState;
  private stats: PlayerStats;
  private onStateChange?: (state: GameState) => void;

  constructor() {
    this.stats = {
      hp: 100,
      mp: 100,
      str: 10,
      wis: 10,
      cha: 10,
      luck: 10
    };
    this.state = {
      currentNodeId: 'start',
      stats: { ...this.stats },
      history: ['start'],
      choicesMade: 0,
      ending: null,
      isGameOver: false
    };
  }

  public setStateChangeCallback(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  public getCurrentNode(): StoryNode | null {
    return STORY_DATA[this.state.currentNodeId] || null;
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public getStats(): PlayerStats {
    return { ...this.state.stats };
  }

  public makeChoice(choiceId: string): boolean {
    const currentNode = this.getCurrentNode();
    if (!currentNode) return false;

    const choice = currentNode.choices.find(c => c.id === choiceId);
    if (!choice) return false;

    if (choice.requiredStats) {
      for (const [key, value] of Object.entries(choice.requiredStats)) {
        const statValue = this.state.stats[key as keyof PlayerStats];
        if (statValue < (value || 0)) {
          return false;
        }
      }
    }

    if (choice.effect) {
      this.applyEffect(choice.effect);
    }

    this.state.currentNodeId = choice.nextNodeId;
    this.state.history.push(choice.nextNodeId);
    this.state.choicesMade++;

    const nextNode = STORY_DATA[choice.nextNodeId];
    if (nextNode && nextNode.choices.length === 0) {
      this.state.ending = nextNode.id;
      this.state.isGameOver = true;
    }

    if (this.onStateChange) {
      this.onStateChange(this.state);
    }

    return true;
  }

  private applyEffect(effect: Partial<PlayerStats>): void {
    for (const [key, value] of Object.entries(effect)) {
      const statKey = key as keyof PlayerStats;
      if (key === 'hp' || key === 'mp') {
        this.state.stats[statKey] = Math.min(100, Math.max(0, this.state.stats[statKey] + (value || 0)));
      } else {
        this.state.stats[statKey] = this.state.stats[statKey] + (value || 0);
      }
    }
  }

  public canMakeChoice(choiceId: string): boolean {
    const currentNode = this.getCurrentNode();
    if (!currentNode) return false;

    const choice = currentNode.choices.find(c => c.id === choiceId);
    if (!choice) return false;

    if (!choice.requiredStats) return true;

    for (const [key, value] of Object.entries(choice.requiredStats)) {
      const statValue = this.state.stats[key as keyof PlayerStats];
      if (statValue < (value || 0)) {
        return false;
      }
    }

    return true;
  }

  public getMissingStats(choiceId: string): string[] {
    const currentNode = this.getCurrentNode();
    if (!currentNode) return [];

    const choice = currentNode.choices.find(c => c.id === choiceId);
    if (!choice || !choice.requiredStats) return [];

    const missing: string[] = [];
    for (const [key, value] of Object.entries(choice.requiredStats)) {
      const statValue = this.state.stats[key as keyof PlayerStats];
      if (statValue < (value || 0)) {
        const statName = {
          hp: '生命值',
          mp: '魔法值',
          str: '力量',
          wis: '智慧',
          cha: '魅力',
          luck: '运气'
        }[key];
        missing.push(`${statName}需要${value}点，当前${statValue}点`);
      }
    }

    return missing;
  }

  public restart(): void {
    this.stats = {
      hp: 100,
      mp: 100,
      str: 10,
      wis: 10,
      cha: 10,
      luck: 10
    };
    this.state = {
      currentNodeId: 'start',
      stats: { ...this.stats },
      history: ['start'],
      choicesMade: 0,
      ending: null,
      isGameOver: false
    };

    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  public saveState(): string {
    return JSON.stringify({
      state: this.state,
      stats: this.stats
    });
  }

  public loadState(savedData: string): boolean {
    try {
      const data = JSON.parse(savedData);
      this.state = data.state;
      this.stats = data.stats;
      if (this.onStateChange) {
        this.onStateChange(this.state);
      }
      return true;
    } catch {
      return false;
    }
  }

  public getEndingTitle(): string | null {
    if (!this.state.ending) return null;
    const node = STORY_DATA[this.state.ending];
    return node?.title || null;
  }
}
