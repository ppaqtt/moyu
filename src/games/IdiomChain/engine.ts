// 成语接龙游戏引擎

export interface Idiom {
  id: string;
  text: string;
  pinyin: string;
  meaning: string;
  firstChar: string;
  lastChar: string;
}

export interface ChainItem {
  idiom: Idiom;
  player: 'user' | 'computer';
  timestamp: number;
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
  timeRemaining: number;
}

// 成语题库
const IDIOM_DATABASE: Idiom[] = [
  { id: '1', text: '一心一意', pinyin: 'yī xīn yī yì', meaning: '专心致志，没有杂念', firstChar: '一', lastChar: '意' },
  { id: '2', text: '意气风发', pinyin: 'yì qì fēng fā', meaning: '精神振奋，气概豪迈', firstChar: '意', lastChar: '发' },
  { id: '3', text: '发愤图强', pinyin: 'fā fèn tú qiáng', meaning: '下定决心，努力追求进步', firstChar: '发', lastChar: '强' },
  { id: '4', text: '强词夺理', pinyin: 'qiǎng cí duó lǐ', meaning: '无理强辩，明明没理硬说有理', firstChar: '强', lastChar: '理' },
  { id: '5', text: '理直气壮', pinyin: 'lǐ zhí qì zhuàng', meaning: '理由充分，说话气势就壮', firstChar: '理', lastChar: '壮' },
  { id: '6', text: '壮志凌云', pinyin: 'zhuàng zhì líng yún', meaning: '形容理想宏伟远大', firstChar: '壮', lastChar: '云' },
  { id: '7', text: '云开见日', pinyin: 'yún kāi jiàn rì', meaning: '比喻黑暗已经过去，光明已经到来', firstChar: '云', lastChar: '日' },
  { id: '8', text: '日新月异', pinyin: 'rì xīn yuè yì', meaning: '指发展或进步迅速，不断出现新事物', firstChar: '日', lastChar: '异' },
  { id: '9', text: '异想天开', pinyin: 'yì xiǎng tiān kāi', meaning: '比喻荒唐离奇，想象着暂时无法实现的事', firstChar: '异', lastChar: '开' },
  { id: '10', text: '开门见山', pinyin: 'kāi mén jiàn shān', meaning: '比喻说话或写文章直截了当谈本题', firstChar: '开', lastChar: '山' },
  { id: '11', text: '山清水秀', pinyin: 'shān qīng shuǐ xiù', meaning: '形容风景优美', firstChar: '山', lastChar: '秀' },
  { id: '12', text: '秀外慧中', pinyin: 'xiù wài huì zhōng', meaning: '外表秀美，内心聪明', firstChar: '秀', lastChar: '中' },
  { id: '13', text: '中流砥柱', pinyin: 'zhōng liú dǐ zhù', meaning: '比喻坚强独立的人能在动荡艰难的环境中起支柱作用', firstChar: '中', lastChar: '柱' },
  { id: '14', text: '柱石之臣', pinyin: 'zhù shí zhī chén', meaning: '担当国家重任的大臣', firstChar: '柱', lastChar: '臣' },
  { id: '15', text: '臣心如水', pinyin: 'chén xīn rú shuǐ', meaning: '形容廉洁奉公，心清如水', firstChar: '臣', lastChar: '水' },
  { id: '16', text: '水到渠成', pinyin: 'shuǐ dào qú chéng', meaning: '比喻条件成熟，事情自然会成功', firstChar: '水', lastChar: '成' },
  { id: '17', text: '成千上万', pinyin: 'chéng qiān shàng wàn', meaning: '形容数量很多', firstChar: '成', lastChar: '万' },
  { id: '18', text: '万众一心', pinyin: 'wàn zhòng yī xīn', meaning: '千万人一条心，形容团结一致', firstChar: '万', lastChar: '心' },
  { id: '19', text: '心直口快', pinyin: 'xīn zhí kǒu kuài', meaning: '性情直爽，有话就说', firstChar: '心', lastChar: '快' },
  { id: '20', text: '快马加鞭', pinyin: 'kuài mǎ jiā biān', meaning: '跑得很快的马再加上一鞭子，使马跑得更快', firstChar: '快', lastChar: '鞭' },
  { id: '21', text: '鞭长莫及', pinyin: 'biān cháng mò jí', meaning: '比喻力量达不到', firstChar: '鞭', lastChar: '及' },
  { id: '22', text: '及时行乐', pinyin: 'jí shí xíng lè', meaning: '不失时机，寻欢作乐', firstChar: '及', lastChar: '乐' },
  { id: '23', text: '乐不思蜀', pinyin: 'lè bù sī shǔ', meaning: '比喻在新环境中得到乐趣，不再想回到原来环境中去', firstChar: '乐', lastChar: '蜀' },
  { id: '24', text: '蜀犬吠日', pinyin: 'shǔ quǎn fèi rì', meaning: '比喻少见多怪', firstChar: '蜀', lastChar: '日' },
  { id: '25', text: '日理万机', pinyin: 'rì lǐ wàn jī', meaning: '形容政务繁忙，工作辛苦', firstChar: '日', lastChar: '机' },
  { id: '26', text: '机不可失', pinyin: 'jī bù kě shī', meaning: '好的时机不可放过，失掉了不会再来', firstChar: '机', lastChar: '失' },
  { id: '27', text: '失之交臂', pinyin: 'shī zhī jiāo bì', meaning: '形容当面错过', firstChar: '失', lastChar: '臂' },
  { id: '28', text: '臂有四肘', pinyin: 'bì yǒu sì zhǒu', meaning: '比喻不凡的相貌', firstChar: '臂', lastChar: '肘' },
  { id: '29', text: '肘腋之患', pinyin: 'zhǒu yè zhī huàn', meaning: '形容产生于身旁的祸患', firstChar: '肘', lastChar: '患' },
  { id: '30', text: '患得患失', pinyin: 'huàn dé huàn shī', meaning: '担心得不到，得到了又担心失掉', firstChar: '患', lastChar: '失' },
  { id: '31', text: '失道寡助', pinyin: 'shī dào guǎ zhù', meaning: '做事违反正义的人，一定得不到别人的支持和帮助', firstChar: '失', lastChar: '助' },
  { id: '32', text: '助人为乐', pinyin: 'zhù rén wéi lè', meaning: '帮助别人就是快乐', firstChar: '助', lastChar: '乐' },
  { id: '33', text: '乐极生悲', pinyin: 'lè jí shēng bēi', meaning: '高兴到极点时，发生使人悲伤的事', firstChar: '乐', lastChar: '悲' },
  { id: '34', text: '悲欢离合', pinyin: 'bēi huān lí hé', meaning: '泛指生活中经历的各种境遇和由此产生的各种心情', firstChar: '悲', lastChar: '合' },
  { id: '35', text: '合情合理', pinyin: 'hé qíng hé lǐ', meaning: '符合情理', firstChar: '合', lastChar: '理' },
  { id: '36', text: '理直气壮', pinyin: 'lǐ zhí qì zhuàng', meaning: '理由充分，说话气势就壮', firstChar: '理', lastChar: '壮' },
  { id: '37', text: '壮志未酬', pinyin: 'zhuàng zhì wèi chóu', meaning: '志向没有实现', firstChar: '壮', lastChar: '酬' },
  { id: '38', text: '酬功给赏', pinyin: 'chóu gōng gěi shǎng', meaning: '奖赏有功劳者', firstChar: '酬', lastChar: '赏' },
  { id: '39', text: '赏心悦目', pinyin: 'shǎng xīn yuè mù', meaning: '看到美好的景色而心情愉快', firstChar: '赏', lastChar: '目' },
  { id: '40', text: '目不转睛', pinyin: 'mù bù zhuǎn jīng', meaning: '眼珠子一动不动地盯着看', firstChar: '目', lastChar: '睛' },
  { id: '41', text: '睛天霹雳', pinyin: 'qíng tiān pī lì', meaning: '比喻突然发生意外的令人震惊的事件', firstChar: '睛', lastChar: '雳' },
  { id: '42', text: '雳厉风行', pinyin: 'lì lì fēng xíng', meaning: '比喻执行政策法令严厉迅速', firstChar: '雳', lastChar: '行' },
  { id: '43', text: '行云流水', pinyin: 'xíng yún liú shuǐ', meaning: '形容文章自然不受约束，就像漂浮着的云和流动着的水一样', firstChar: '行', lastChar: '水' },
  { id: '44', text: '水落石出', pinyin: 'shuǐ luò shí chū', meaning: '比喻事情的真相完全显露出来', firstChar: '水', lastChar: '出' },
  { id: '45', text: '出口成章', pinyin: 'chū kǒu chéng zhāng', meaning: '形容文思敏捷，口才好', firstChar: '出', lastChar: '章' },
  { id: '46', text: '章台杨柳', pinyin: 'zhāng tái yáng liǔ', meaning: '比喻窈窕美丽的女子', firstChar: '章', lastChar: '柳' },
  { id: '47', text: '柳暗花明', pinyin: 'liǔ àn huā míng', meaning: '比喻在困难中遇到转机', firstChar: '柳', lastChar: '明' },
  { id: '48', text: '明察秋毫', pinyin: 'míng chá qiū háo', meaning: '形容眼力好到可以看清极其细小的事物', firstChar: '明', lastChar: '毫' },
  { id: '49', text: '毫不犹豫', pinyin: 'háo bù yóu yù', meaning: '形容人在处理事情上非常果断，没有片刻迟疑', firstChar: '毫', lastChar: '豫' },
  { id: '50', text: '豫章故郡', pinyin: 'yù zhāng gù jùn', meaning: '豫章是旧时郡名', firstChar: '豫', lastChar: '郡' },
  { id: '51', text: '郡县制度', pinyin: 'jùn xiàn zhì dù', meaning: '古代地方行政制度', firstChar: '郡', lastChar: '度' },
  { id: '52', text: '度日如年', pinyin: 'dù rì rú nián', meaning: '过一天像过一年那样长', firstChar: '度', lastChar: '年' },
  { id: '53', text: '年富力强', pinyin: 'nián fù lì qiáng', meaning: '形容年纪轻，精力旺盛', firstChar: '年', lastChar: '强' },
  { id: '54', text: '强弩之末', pinyin: 'qiáng nǔ zhī mò', meaning: '比喻强大的力量已经衰弱', firstChar: '强', lastChar: '末' },
  { id: '55', text: '末路穷途', pinyin: 'mò lù qióng tú', meaning: '比喻处境极端困难，到了末日', firstChar: '末', lastChar: '途' },
  { id: '56', text: '途穷日暮', pinyin: 'tú qióng rì mù', meaning: '比喻到了末日或衰亡的境地', firstChar: '途', lastChar: '暮' },
  { id: '57', text: '暮气沉沉', pinyin: 'mù qì chén chén', meaning: '形容精神萎靡不振，缺乏朝气', firstChar: '暮', lastChar: '沉' },
  { id: '58', text: '沉鱼落雁', pinyin: 'chén yú luò yàn', meaning: '形容女子容貌美丽', firstChar: '沉', lastChar: '雁' },
  { id: '59', text: '雁过拔毛', pinyin: 'yàn guò bá máo', meaning: '比喻人爱占便宜，见有好处就要乘机捞一把', firstChar: '雁', lastChar: '毛' },
  { id: '60', text: '毛遂自荐', pinyin: 'máo suì zì jiàn', meaning: '比喻自告奋勇，自己推荐自己担任某项工作', firstChar: '毛', lastChar: '荐' },
  { id: '61', text: '荐贤举能', pinyin: 'jiàn xián jǔ néng', meaning: '选拔推荐有才能有德行的人', firstChar: '荐', lastChar: '能' },
  { id: '62', text: '能工巧匠', pinyin: 'néng gōng qiǎo jiàng', meaning: '指工艺技术高明的人', firstChar: '能', lastChar: '匠' },
  { id: '63', text: '匠心独运', pinyin: 'jiàng xīn dú yùn', meaning: '独创性地运用精巧的心思', firstChar: '匠', lastChar: '运' },
  { id: '64', text: '运筹帷幄', pinyin: 'yùn chóu wéi wò', meaning: '指拟定作战策略', firstChar: '运', lastChar: '幄' },
  { id: '65', text: '幄中决策', pinyin: 'wò zhōng jué cè', meaning: '在帐幕中制定决策', firstChar: '幄', lastChar: '策' },
  { id: '66', text: '策马奔腾', pinyin: 'cè mǎ bēn téng', meaning: '骑着马奔跑跳跃', firstChar: '策', lastChar: '腾' },
  { id: '67', text: '腾云驾雾', pinyin: 'téng yún jià wù', meaning: '原是传说中指会法术的人乘云雾飞行', firstChar: '腾', lastChar: '雾' },
  { id: '68', text: '雾里看花', pinyin: 'wù lǐ kàn huā', meaning: '比喻看事情不真切', firstChar: '雾', lastChar: '花' },
  { id: '69', text: '花好月圆', pinyin: 'huā hǎo yuè yuán', meaning: '比喻美好圆满的生活', firstChar: '花', lastChar: '圆' },
  { id: '70', text: '圆木警枕', pinyin: 'yuán mù jǐng zhěn', meaning: '用圆木做枕头，睡着时容易惊醒', firstChar: '圆', lastChar: '枕' },
  { id: '71', text: '枕戈待旦', pinyin: 'zhěn gē dài dàn', meaning: '立志杀敌，枕着武器睡觉等天亮', firstChar: '枕', lastChar: '旦' },
  { id: '72', text: '旦夕之间', pinyin: 'dàn xī zhī jiān', meaning: '形容时间极短', firstChar: '旦', lastChar: '间' },
  { id: '73', text: '间不容发', pinyin: 'jiān bù róng fà', meaning: '比喻与灾祸相距极近或情势危急到极点', firstChar: '间', lastChar: '发' },
  { id: '74', text: '发号施令', pinyin: 'fā hào shī lìng', meaning: '发布命令', firstChar: '发', lastChar: '令' },
  { id: '75', text: '令行禁止', pinyin: 'lìng xíng jìn zhǐ', meaning: '下令行动就立即行动，下令停止就立即停止', firstChar: '令', lastChar: '止' },
  { id: '76', text: '止步不前', pinyin: 'zhǐ bù bù qián', meaning: '停止下来，不再前进', firstChar: '止', lastChar: '前' },
  { id: '77', text: '前程似锦', pinyin: 'qián chéng sì jǐn', meaning: '形容前途十分美好', firstChar: '前', lastChar: '锦' },
  { id: '78', text: '锦上添花', pinyin: 'jǐn shàng tiān huā', meaning: '比喻好上加好，美上添美', firstChar: '锦', lastChar: '花' },
  { id: '79', text: '花言巧语', pinyin: 'huā yán qiǎo yǔ', meaning: '原指铺张修饰、内容空泛的言语或文辞', firstChar: '花', lastChar: '语' },
  { id: '80', text: '语重心长', pinyin: 'yǔ zhòng xīn cháng', meaning: '话深刻有力，情意深长', firstChar: '语', lastChar: '长' },
  { id: '81', text: '长治久安', pinyin: 'cháng zhì jiǔ ān', meaning: '形容国家长期安定、巩固', firstChar: '长', lastChar: '安' },
  { id: '82', text: '安居乐业', pinyin: 'ān jū lè yè', meaning: '指安定愉快地生活和劳动', firstChar: '安', lastChar: '业' },
  { id: '83', text: '业精于勤', pinyin: 'yè jīng yú qín', meaning: '学业精深是由勤奋得来的', firstChar: '业', lastChar: '勤' },
  { id: '84', text: '勤能补拙', pinyin: 'qín néng bǔ zhuō', meaning: '勤奋能够弥补不足', firstChar: '勤', lastChar: '拙' },
  { id: '85', text: '拙口笨腮', pinyin: 'zhuō kǒu bèn sāi', meaning: '嘴笨，没有口才', firstChar: '拙', lastChar: '腮' },
  { id: '86', text: '腮帮子鼓', pinyin: 'sāi bāng zi gǔ', meaning: '形容鼓起腮帮的样子', firstChar: '腮', lastChar: '鼓' },
  { id: '87', text: '鼓舞人心', pinyin: 'gǔ wǔ rén xīn', meaning: '振奋人们的信心，增强人们的勇气', firstChar: '鼓', lastChar: '心' },
  { id: '88', text: '心花怒放', pinyin: 'xīn huā nù fàng', meaning: '心里高兴得像花儿盛开一样', firstChar: '心', lastChar: '放' },
  { id: '89', text: '放虎归山', pinyin: 'fàng hǔ guī shān', meaning: '把老虎放回山去，比喻把坏人放回老巢', firstChar: '放', lastChar: '山' },
  { id: '90', text: '山高水长', pinyin: 'shān gāo shuǐ cháng', meaning: '比喻人的风范或声誉像高山一样永远存在', firstChar: '山', lastChar: '长' },
  { id: '91', text: '长篇大论', pinyin: 'cháng piān dà lùn', meaning: '滔滔不绝的言论', firstChar: '长', lastChar: '论' },
  { id: '92', text: '论功行赏', pinyin: 'lùn gōng xíng shǎng', meaning: '按功劳的大小给于奖赏', firstChar: '论', lastChar: '赏' },
  { id: '93', text: '赏罚分明', pinyin: 'shǎng fá fēn míng', meaning: '该赏的赏，该罚的罚，形容处理事情清楚明白', firstChar: '赏', lastChar: '明' },
  { id: '94', text: '明知故犯', pinyin: 'míng zhī gù fàn', meaning: '明明知道不能做，却故意违犯', firstChar: '明', lastChar: '犯' },
  { id: '95', text: '犯上作乱', pinyin: 'fàn shàng zuò luàn', meaning: '触犯尊长或朝廷，悖逆或叛乱的行为', firstChar: '犯', lastChar: '乱' },
  { id: '96', text: '乱七八糟', pinyin: 'luàn qī bā zāo', meaning: '形容无秩序，无条理，乱得不成样子', firstChar: '乱', lastChar: '糟' },
  { id: '97', text: '糟糠之妻', pinyin: 'zāo kāng zhī qī', meaning: '指共患难的妻子', firstChar: '糟', lastChar: '妻' },
  { id: '98', text: '妻离子散', pinyin: 'qī lí zǐ sàn', meaning: '一家子被迫分离四散', firstChar: '妻', lastChar: '散' },
  { id: '99', text: '散兵游勇', pinyin: 'sǎn bīng yóu yǒng', meaning: '没有组织的集体队伍里独自行动的人', firstChar: '散', lastChar: '勇' },
  { id: '100', text: '勇往直前', pinyin: 'yǒng wǎng zhí qián', meaning: '勇敢地一直向前进', firstChar: '勇', lastChar: '前' },
];

export class IdiomChainEngine {
  private chain: ChainItem[] = [];
  private usedIds: Set<string> = new Set();
  private currentChar: string = '';
  private score: number = 0;
  private combo: number = 0;
  private isUserTurn: boolean = true;
  private gameOver: boolean = false;
  private winner: 'user' | 'computer' | null = null;
  private reason: string = '';
  private timeRemaining: number = 30;
  private timerInterval: number | null = null;
  private difficulty: 'easy' | 'medium' | 'hard' = 'medium';

  constructor(difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
    this.difficulty = difficulty;
    this.reset();
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
    this.timeRemaining = this.getTurnTime();

    // 随机选择一个起始成语
    const startIdiom = this.getRandomIdiom();
    if (startIdiom) {
      this.addToChain(startIdiom, 'computer');
    }
  }

  private getTurnTime(): number {
    switch (this.difficulty) {
      case 'easy': return 45;
      case 'medium': return 30;
      case 'hard': return 20;
      default: return 30;
    }
  }

  private getRandomIdiom(): Idiom | null {
    const available = IDIOM_DATABASE.filter(i => !this.usedIds.has(i.id));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  private addToChain(idiom: Idiom, player: 'user' | 'computer'): void {
    this.chain.push({
      idiom,
      player,
      timestamp: Date.now()
    });
    this.usedIds.add(idiom.id);
    this.currentChar = idiom.lastChar;
    
    if (player === 'user') {
      this.combo++;
      this.score += 10 * this.combo;
    }
  }

  public startTimer(callback?: () => void): void {
    this.stopTimer();
    this.timeRemaining = this.getTurnTime();
    
    this.timerInterval = window.setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.handleTimeout();
        if (callback) callback();
      }
    }, 1000);
  }

  public stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private handleTimeout(): void {
    if (this.isUserTurn) {
      this.gameOver = true;
      this.winner = 'computer';
      this.reason = '时间到！你没有及时接龙';
    } else {
      this.gameOver = true;
      this.winner = 'user';
      this.reason = '电脑无法接龙，你赢了！';
    }
  }

  public userInput(idiomText: string): { success: boolean; message: string } {
    if (!this.isUserTurn || this.gameOver) {
      return { success: false, message: '现在不是你的回合' };
    }

    // 查找成语
    const idiom = IDIOM_DATABASE.find(i => i.text === idiomText);
    
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
    this.timeRemaining = this.getTurnTime();
    
    return { success: true, message: '接龙成功！' };
  }

  public computerTurn(): Idiom | null {
    if (this.isUserTurn || this.gameOver) return null;

    // 根据难度设置电脑反应时间
    const delay = this.difficulty === 'easy' ? 2000 : this.difficulty === 'medium' ? 1500 : 1000;

    // 寻找可用成语
    const available = IDIOM_DATABASE.filter(i => 
      !this.usedIds.has(i.id) && i.firstChar === this.currentChar
    );

    if (available.length === 0) {
      this.gameOver = true;
      this.winner = 'user';
      this.reason = '电脑无法接龙，你赢了！';
      return null;
    }

    // 随机选择一个
    const selected = available[Math.floor(Math.random() * available.length)];
    this.addToChain(selected, 'computer');
    this.isUserTurn = true;
    this.timeRemaining = this.getTurnTime();
    
    return selected;
  }

  public getHint(): Idiom | null {
    const available = IDIOM_DATABASE.filter(i => 
      !this.usedIds.has(i.id) && i.firstChar === this.currentChar
    );
    
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  public getSuggestions(input: string): Idiom[] {
    if (!input) return [];
    
    return IDIOM_DATABASE.filter(i => 
      !this.usedIds.has(i.id) && 
      i.firstChar === this.currentChar &&
      i.text.includes(input)
    ).slice(0, 5);
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
      timeRemaining: this.timeRemaining
    };
  }

  public getChain(): ChainItem[] {
    return [...this.chain];
  }

  public getCurrentChar(): string {
    return this.currentChar;
  }

  public getScore(): number {
    return this.score;
  }

  public getCombo(): number {
    return this.combo;
  }

  public isUserTurnNow(): boolean {
    return this.isUserTurn;
  }

  public isGameOver(): boolean {
    return this.gameOver;
  }

  public getWinner(): 'user' | 'computer' | null {
    return this.winner;
  }

  public getReason(): string {
    return this.reason;
  }

  public getTimeRemaining(): number {
    return this.timeRemaining;
  }

  public getDifficulty(): string {
    return this.difficulty;
  }

  public setDifficulty(difficulty: 'easy' | 'medium' | 'hard'): void {
    this.difficulty = difficulty;
  }

  public getAllIdioms(): Idiom[] {
    return [...IDIOM_DATABASE];
  }
}
