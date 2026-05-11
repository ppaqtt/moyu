// Idiom Chain Pro Game Engine - 成语接龙增强版游戏引擎

export interface Idiom {
  id: string;
  text: string;
  pinyin: string;
  meaning: string;
  firstChar: string;
  lastChar: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ChainItem {
  idiom: Idiom;
  player: 'user' | 'computer';
  timestamp: number;
  timeSpent: number;
}

export interface GameState {
  chain: ChainItem[];
  currentChar: string;
  score: number;
  combo: number;
  usedIds: Set<string>;
  isUserTurn: boolean;
  gameOver: boolean;
  winner: 'user' | 'computer' | null;
  reason: string;
  timeLeft: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Enhanced Idiom Database - 更丰富的成语库
export const IDIOM_DATABASE_PRO: Idiom[] = [
  { id: '1', text: '一心一意', pinyin: 'yī xīn yī yì', meaning: '专心致志，没有杂念', firstChar: '一', lastChar: '意', difficulty: 'easy' },
  { id: '2', text: '意气风发', pinyin: 'yì qì fēng fā', meaning: '精神振奋，气概豪迈', firstChar: '意', lastChar: '发', difficulty: 'easy' },
  { id: '3', text: '发愤图强', pinyin: 'fā fèn tú qiáng', meaning: '下定决心，努力追求进步', firstChar: '发', lastChar: '强', difficulty: 'easy' },
  { id: '4', text: '强词夺理', pinyin: 'qiǎng cí duó lǐ', meaning: '无理强辩，明明没理硬说有理', firstChar: '强', lastChar: '理', difficulty: 'medium' },
  { id: '5', text: '理直气壮', pinyin: 'lǐ zhí qì zhuàng', meaning: '理由充分，说话气势就壮', firstChar: '理', lastChar: '壮', difficulty: 'easy' },
  { id: '6', text: '壮志凌云', pinyin: 'zhuàng zhì líng yún', meaning: '形容理想宏伟远大', firstChar: '壮', lastChar: '云', difficulty: 'medium' },
  { id: '7', text: '云开见日', pinyin: 'yún kāi jiàn rì', meaning: '比喻黑暗已经过去，光明已经到来', firstChar: '云', lastChar: '日', difficulty: 'medium' },
  { id: '8', text: '日新月异', pinyin: 'rì xīn yuè yì', meaning: '指发展或进步迅速，不断出现新事物', firstChar: '日', lastChar: '异', difficulty: 'easy' },
  { id: '9', text: '异想天开', pinyin: 'yì xiǎng tiān kāi', meaning: '比喻荒唐离奇，想象着暂时无法实现的事', firstChar: '异', lastChar: '开', difficulty: 'medium' },
  { id: '10', text: '开门见山', pinyin: 'kāi mén jiàn shān', meaning: '比喻说话或写文章直截了当谈本题', firstChar: '开', lastChar: '山', difficulty: 'easy' },
  { id: '11', text: '山清水秀', pinyin: 'shān qīng shuǐ xiù', meaning: '形容风景优美', firstChar: '山', lastChar: '秀', difficulty: 'easy' },
  { id: '12', text: '秀外慧中', pinyin: 'xiù wài huì zhōng', meaning: '外表秀美，内心聪明', firstChar: '秀', lastChar: '中', difficulty: 'medium' },
  { id: '13', text: '中流砥柱', pinyin: 'zhōng liú dǐ zhù', meaning: '比喻坚强独立的人能在动荡艰难的环境中起支柱作用', firstChar: '中', lastChar: '柱', difficulty: 'hard' },
  { id: '14', text: '柱石之臣', pinyin: 'zhù shí zhī chén', meaning: '担当国家重任的大臣', firstChar: '柱', lastChar: '臣', difficulty: 'hard' },
  { id: '15', text: '臣心如水', pinyin: 'chén xīn rú shuǐ', meaning: '形容廉洁奉公，心清如水', firstChar: '臣', lastChar: '水', difficulty: 'hard' },
  { id: '16', text: '水到渠成', pinyin: 'shuǐ dào qú chéng', meaning: '比喻条件成熟，事情自然会成功', firstChar: '水', lastChar: '成', difficulty: 'easy' },
  { id: '17', text: '成千上万', pinyin: 'chéng qiān shàng wàn', meaning: '形容数量很多', firstChar: '成', lastChar: '万', difficulty: 'easy' },
  { id: '18', text: '万众一心', pinyin: 'wàn zhòng yī xīn', meaning: '千万人一条心，形容团结一致', firstChar: '万', lastChar: '心', difficulty: 'easy' },
  { id: '19', text: '心花怒放', pinyin: 'xīn huā nù fàng', meaning: '心里高兴得像花儿盛开一样', firstChar: '心', lastChar: '放', difficulty: 'easy' },
  { id: '20', text: '放任自流', pinyin: 'fàng rèn zì liú', meaning: '听凭自然发展，不加过问或引导', firstChar: '放', lastChar: '流', difficulty: 'medium' },
  { id: '21', text: '流芳百世', pinyin: 'liú fāng bǎi shì', meaning: '好的名声永远流传下去', firstChar: '流', lastChar: '世', difficulty: 'medium' },
  { id: '22', text: '世外桃源', pinyin: 'shì wài táo yuán', meaning: '原指与现实社会隔绝、生活安乐的理想境界', firstChar: '世', lastChar: '源', difficulty: 'medium' },
  { id: '23', text: '源远流长', pinyin: 'yuán yuǎn liú cháng', meaning: '河流的源头很远，水流很长', firstChar: '源', lastChar: '长', difficulty: 'medium' },
  { id: '24', text: '长治久安', pinyin: 'cháng zhì jiǔ ān', meaning: '形容国家长期安定、巩固', firstChar: '长', lastChar: '安', difficulty: 'medium' },
  { id: '25', text: '安居乐业', pinyin: 'ān jū lè yè', meaning: '指安定愉快地生活和劳动', firstChar: '安', lastChar: '业', difficulty: 'easy' },
  { id: '26', text: '业精于勤', pinyin: 'yè jīng yú qín', meaning: '学业精深是由勤奋得来的', firstChar: '业', lastChar: '勤', difficulty: 'medium' },
  { id: '27', text: '勤能补拙', pinyin: 'qín néng bǔ zhuō', meaning: '勤奋能够弥补不足', firstChar: '勤', lastChar: '拙', difficulty: 'medium' },
  { id: '28', text: '拙口笨腮', pinyin: 'zhuō kǒu bèn sāi', meaning: '嘴笨，没有口才', firstChar: '拙', lastChar: '腮', difficulty: 'hard' },
  { id: '29', text: '塞翁失马', pinyin: 'sài wēng shī mǎ', meaning: '比喻坏事在一定条件下可以变为好事', firstChar: '塞', lastChar: '马', difficulty: 'medium' },
  { id: '30', text: '马到成功', pinyin: 'mǎ dào chéng gōng', meaning: '形容工作刚开始就取得成功', firstChar: '马', lastChar: '功', difficulty: 'easy' },
  { id: '31', text: '功成名就', pinyin: 'gōng chéng míng jiù', meaning: '功绩取得了，名声也有了', firstChar: '功', lastChar: '就', difficulty: 'easy' },
  { id: '32', text: '就事论事', pinyin: 'jiù shì lùn shì', meaning: '按照事物本身的性质来评定是非得失', firstChar: '就', lastChar: '事', difficulty: 'medium' },
  { id: '33', text: '事半功倍', pinyin: 'shì bàn gōng bèi', meaning: '指做事得法，因而费力小，收效大', firstChar: '事', lastChar: '倍', difficulty: 'easy' },
  { id: '34', text: '倍道而行', pinyin: 'bèi dào ér xíng', meaning: '加快速度，一天走两天的行程', firstChar: '倍', lastChar: '行', difficulty: 'hard' },
  { id: '35', text: '行云流水', pinyin: 'xíng yún liú shuǐ', meaning: '形容文章自然不受约束', firstChar: '行', lastChar: '水', difficulty: 'medium' },
  { id: '36', text: '水滴石穿', pinyin: 'shuǐ dī shí chuān', meaning: '水不停地滴，石头也能被滴穿', firstChar: '水', lastChar: '穿', difficulty: 'easy' },
  { id: '37', text: '穿针引线', pinyin: 'chuān zhēn yǐn xiàn', meaning: '使线的一头通过针眼', firstChar: '穿', lastChar: '线', difficulty: 'medium' },
  { id: '38', text: '线抽傀儡', pinyin: 'xiàn chōu kuǐ lěi', meaning: '比喻任人操纵的人', firstChar: '线', lastChar: '儡', difficulty: 'hard' },
  { id: '39', text: '累教不改', pinyin: 'lěi jiào bù gǎi', meaning: '多次教育，仍不改正', firstChar: '累', lastChar: '改', difficulty: 'hard' },
  { id: '40', text: '改邪归正', pinyin: 'gǎi xié guī zhèng', meaning: '从邪路上回到正路上来，不再做坏事', firstChar: '改', lastChar: '正', difficulty: 'medium' },
  { id: '41', text: '正人君子', pinyin: 'zhèng rén jūn zǐ', meaning: '旧时指品行端正的人', firstChar: '正', lastChar: '子', difficulty: 'medium' },
  { id: '42', text: '子虚乌有', pinyin: 'zǐ xū wū yǒu', meaning: '指假设的、不存在的、不真实的事情', firstChar: '子', lastChar: '有', difficulty: 'hard' },
  { id: '43', text: '有备无患', pinyin: 'yǒu bèi wú huàn', meaning: '事先有准备，就可以避免祸患', firstChar: '有', lastChar: '患', difficulty: 'easy' },
  { id: '44', text: '患难之交', pinyin: 'huàn nàn zhī jiāo', meaning: '在一起经历过艰难困苦的朋友', firstChar: '患', lastChar: '交', difficulty: 'medium' },
  { id: '45', text: '交头接耳', pinyin: 'jiāo tóu jiē ěr', meaning: '彼此在耳朵边低声说话', firstChar: '交', lastChar: '耳', difficulty: 'medium' },
  { id: '46', text: '耳濡目染', pinyin: 'ěr rú mù rǎn', meaning: '耳朵经常听到，眼睛经常看到，不知不觉地受到影响', firstChar: '耳', lastChar: '染', difficulty: 'medium' },
  { id: '47', text: '染苍染黄', pinyin: 'rǎn cāng rǎn huáng', meaning: '比喻环境的变化会影响人的习性', firstChar: '染', lastChar: '黄', difficulty: 'hard' },
  { id: '48', text: '黄粱一梦', pinyin: 'huáng liáng yī mèng', meaning: '比喻虚幻不能实现的梦想', firstChar: '黄', lastChar: '梦', difficulty: 'medium' },
  { id: '49', text: '梦寐以求', pinyin: 'mèng mèi yǐ qiú', meaning: '做梦的时候都在追求', firstChar: '梦', lastChar: '求', difficulty: 'easy' },
  { id: '50', text: '求同存异', pinyin: 'qiú tóng cún yì', meaning: '找出共同点，保留不同意见', firstChar: '求', lastChar: '异', difficulty: 'medium' },
  { id: '51', text: '异曲同工', pinyin: 'yì qǔ tóng gōng', meaning: '不同的曲调演得同样好', firstChar: '异', lastChar: '工', difficulty: 'medium' },
  { id: '52', text: '工欲善其事，必先利其器', pinyin: 'gōng yù shàn qí shì，bì xiān lì qí qì', meaning: '要做好工作，先要使工具锋利', firstChar: '工', lastChar: '器', difficulty: 'hard' },
  { id: '53', text: '器宇轩昂', pinyin: 'qì yǔ xuān áng', meaning: '形容人精力充沛，风度不凡', firstChar: '器', lastChar: '昂', difficulty: 'hard' },
  { id: '54', text: '昂首挺胸', pinyin: 'áng shǒu tǐng xiōng', meaning: '抬起头，挺起胸膛', firstChar: '昂', lastChar: '胸', difficulty: 'medium' },
  { id: '55', text: '胸有成竹', pinyin: 'xiōng yǒu chéng zhú', meaning: '画竹前胸中已有竹子的形象', firstChar: '胸', lastChar: '竹', difficulty: 'easy' },
  { id: '56', text: '竹报平安', pinyin: 'zhú bào píng ān', meaning: '比喻平安家信', firstChar: '竹', lastChar: '安', difficulty: 'medium' },
  { id: '57', text: '安然无恙', pinyin: 'ān rán wú yàng', meaning: '原指人平安没有疾病', firstChar: '安', lastChar: '恙', difficulty: 'medium' },
  { id: '58', text: '病入膏肓', pinyin: 'bìng rù gāo huāng', meaning: '形容病情十分严重，无法医治', firstChar: '病', lastChar: '肓', difficulty: 'hard' },
  { id: '59', text: '盲人摸象', pinyin: 'máng rén mō xiàng', meaning: '比喻对事物只凭片面的了解或局部的经验，就乱加猜测', firstChar: '盲', lastChar: '象', difficulty: 'medium' },
  { id: '60', text: '象牙之塔', pinyin: 'xiàng yá zhī tǎ', meaning: '比喻脱离现实生活的文学家和艺术家的小天地', firstChar: '象', lastChar: '塔', difficulty: 'hard' },
  { id: '61', text: '塔尖上功德', pinyin: 'tǎ jiān shàng gōng dé', meaning: '比喻快要完成的工作', firstChar: '塔', lastChar: '德', difficulty: 'hard' },
  { id: '62', text: '德高望重', pinyin: 'dé gāo wàng zhòng', meaning: '品德高尚，声望很高', firstChar: '德', lastChar: '重', difficulty: 'medium' },
  { id: '63', text: '重蹈覆辙', pinyin: 'chóng dǎo fù zhé', meaning: '重新走上翻过车的老路', firstChar: '重', lastChar: '辙', difficulty: 'hard' },
  { id: '64', text: '辙乱旗靡', pinyin: 'zhé luàn qí mǐ', meaning: '车辙错乱，旗子倒下', firstChar: '辙', lastChar: '靡', difficulty: 'hard' },
  { id: '65', text: '靡不有初，鲜克有终', pinyin: 'mǐ bù yǒu chū，xiǎn kè yǒu zhōng', meaning: '事情都有个开头，但很少能到终了', firstChar: '靡', lastChar: '终', difficulty: 'hard' },
  { id: '66', text: '终南捷径', pinyin: 'zhōng nán jié jìng', meaning: '比喻求名利最近便的门路', firstChar: '终', lastChar: '径', difficulty: 'hard' },
  { id: '67', text: '径情直遂', pinyin: 'jìng qíng zhí suì', meaning: '随着意愿，顺利地得到成功', firstChar: '径', lastChar: '遂', difficulty: 'hard' },
  { id: '68', text: '遂心如意', pinyin: 'suì xīn rú yì', meaning: '形容心满意足，事情的发展完全符合心意', firstChar: '遂', lastChar: '意', difficulty: 'medium' },
  { id: '69', text: '意气用事', pinyin: 'yì qì yòng shì', meaning: '缺乏理智，只凭一时的想法和情绪办事', firstChar: '意', lastChar: '事', difficulty: 'medium' },
  { id: '70', text: '事在人为', pinyin: 'shì zài rén wéi', meaning: '指事情要靠人去做的', firstChar: '事', lastChar: '为', difficulty: 'easy' },
];

export class IdiomChainProEngine {
  private chain: ChainItem[] = [];
  private usedIds: Set<string> = new Set();
  private currentChar: string = '';
  private score: number = 0;
  private combo: number = 0;
  private isUserTurn: boolean = true;
  private gameOver: boolean = false;
  private winner: 'user' | 'computer' | null = null;
  private reason: string = '';
  private timeLeft: number = 30;
  private turnStartTime: number = 0;
  private difficulty: 'easy' | 'medium' | 'hard' = 'medium';

  constructor(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.difficulty = difficulty;
    this.reset();
  }

  private getTurnTime(): number {
    switch (this.difficulty) {
      case 'easy': return 45;
      case 'medium': return 30;
      case 'hard': return 20;
      default: return 30;
    }
  }

  private getComputerDelay(): number {
    switch (this.difficulty) {
      case 'easy': return 2500;
      case 'medium': return 1500;
      case 'hard': return 800;
      default: return 1500;
    }
  }

  private getAvailableIdioms(): Idiom[] {
    return IDIOM_DATABASE_PRO.filter(idiom => 
      !this.usedIds.has(idiom.id) && 
      (this.difficulty === 'easy' ? true : 
       this.difficulty === 'medium' ? idiom.difficulty !== 'hard' : 
       true)
    );
  }

  public reset(): void {
    this.chain = [];
    this.usedIds = new Set();
    this.score = 0;
    this.combo = 0;
    this.isUserTurn = true;
    this.gameOver = false;
    this.winner = null;
    this.reason = '';
    this.timeLeft = this.getTurnTime();
    this.turnStartTime = Date.now();

    // 随机选择一个起始成语（不能是太难的）
    const startIdioms = this.getAvailableIdioms().filter(i => i.difficulty === 'easy' || i.difficulty === 'medium');
    if (startIdioms.length > 0) {
      const startIdiom = startIdioms[Math.floor(Math.random() * startIdioms.length)];
      this.addToChain(startIdiom, 'computer');
    }
  }

  private addToChain(idiom: Idiom, player: 'user' | 'computer'): void {
    const now = Date.now();
    const timeSpent = this.turnStartTime ? now - this.turnStartTime : 0;
    
    this.chain.push({
      idiom,
      player,
      timestamp: now,
      timeSpent
    });
    
    this.usedIds.add(idiom.id);
    this.currentChar = idiom.lastChar;
    this.turnStartTime = now;
    
    if (player === 'user') {
      this.combo++;
      // 根据难度和连击计算分数
      let baseScore = 10;
      if (idiom.difficulty === 'medium') baseScore = 20;
      if (idiom.difficulty === 'hard') baseScore = 35;
      
      // 时间奖励 - 越快分数越高
      const timeBonus = Math.max(0, Math.floor((this.getTurnTime() - timeSpent / 1000) * 0.5));
      
      this.score += (baseScore + timeBonus) * this.combo;
    }
  }

  public startTurn(): void {
    this.turnStartTime = Date.now();
    this.timeLeft = this.getTurnTime();
  }

  public userInput(idiomText: string): { success: boolean; message: string } {
    if (!this.isUserTurn || this.gameOver) {
      return { success: false, message: '现在不是你的回合' };
    }

    // 查找成语
    const idiom = IDIOM_DATABASE_PRO.find(i => i.text === idiomText);
    
    if (!idiom) {
      return { success: false, message: '未找到该成语，请检查输入' };
    }

    if (this.usedIds.has(idiom.id)) {
      return { success: false, message: '该成语已经被使用过了' };
    }

    if (idiom.firstChar !== this.currentChar) {
      return { success: false, message: `成语必须以"${this.currentChar}"字开头` };
    }

    this.addToChain(idiom, 'user');
    this.isUserTurn = false;
    this.timeLeft = this.getTurnTime();
    
    return { success: true, message: '接龙成功！' };
  }

  public computerTurn(): Idiom | null {
    if (this.isUserTurn || this.gameOver) return null;

    // 寻找可用成语
    const available = this.getAvailableIdioms().filter(i => 
      i.firstChar === this.currentChar
    );

    if (available.length === 0) {
      this.gameOver = true;
      this.winner = 'user';
      this.reason = '电脑无法接龙，恭喜你赢了！';
      return null;
    }

    // 根据难度选择策略
    let selected: Idiom;
    if (this.difficulty === 'hard' && this.chain.length > 5) {
      // 困难模式后期选难接的
      const hardOptions = available.filter(i => i.difficulty === 'hard');
      selected = hardOptions.length > 0 
        ? hardOptions[Math.floor(Math.random() * hardOptions.length)]
        : available[Math.floor(Math.random() * available.length)];
    } else {
      selected = available[Math.floor(Math.random() * available.length)];
    }
    
    this.addToChain(selected, 'computer');
    this.isUserTurn = true;
    this.timeLeft = this.getTurnTime();
    
    return selected;
  }

  public getHint(): Idiom | null {
    const available = this.getAvailableIdioms().filter(i => 
      i.firstChar === this.currentChar
    );
    
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  public getSuggestions(input: string): Idiom[] {
    if (!input) return [];
    
    return this.getAvailableIdioms().filter(i => 
      i.firstChar === this.currentChar &&
      i.text.includes(input)
    ).slice(0, 6);
  }

  public getState(): GameState {
    return {
      chain: [...this.chain],
      currentChar: this.currentChar,
      score: this.score,
      combo: this.combo,
      usedIds: new Set(this.usedIds),
      isUserTurn: this.isUserTurn,
      gameOver: this.gameOver,
      winner: this.winner,
      reason: this.reason,
      timeLeft: this.timeLeft,
      difficulty: this.difficulty
    };
  }

  public setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = difficulty;
  }

  public getAllIdioms(): Idiom[] {
    return [...IDIOM_DATABASE_PRO];
  }

  public getComputerDelayTime(): number {
    return this.getComputerDelay();
  }
}