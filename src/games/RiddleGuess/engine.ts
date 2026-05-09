// 猜谜语游戏引擎

export interface Riddle {
  id: string;
  question: string;
  answer: string;
  hint: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GameState {
  currentRiddle: Riddle | null;
  userAnswer: string;
  attempts: number;
  maxAttempts: number;
  score: number;
  streak: number;
  solvedCount: number;
  skippedCount: number;
  hintsUsed: number;
  isComplete: boolean;
  feedback: 'correct' | 'wrong' | 'pending';
}

// 谜语题库
const RIDDLE_DATABASE: Riddle[] = [
  // 动物类 - 简单
  { id: '1', question: '身穿花衣爱打扮，一对翅膀光闪闪，不会唱歌爱跳舞，花丛里面玩得欢。', answer: '蝴蝶', hint: '昆虫，会飞，翅膀很漂亮', category: '动物', difficulty: 'easy' },
  { id: '2', question: '头戴红帽子，身穿白袍子，走路摆架子，说话伸脖子。', answer: '鹅', hint: '家禽，白色，脖子很长', category: '动物', difficulty: 'easy' },
  { id: '3', question: '耳朵长，尾巴短，红眼睛，白毛衫，三瓣嘴儿胆子小，蹦蹦跳跳人喜欢。', answer: '兔子', hint: '小动物，爱吃萝卜，跳得很快', category: '动物', difficulty: 'easy' },
  { id: '4', question: '会飞不是鸟，两翅没羽毛，白天休息晚活动，捕捉蚊虫本领高。', answer: '蝙蝠', hint: '哺乳动物，倒挂着睡觉，夜间活动', category: '动物', difficulty: 'easy' },
  { id: '5', question: '八只脚，抬面鼓，两把剪刀鼓前舞，生来横行又霸道，嘴里常把泡沫吐。', answer: '螃蟹', hint: '海鲜，横着走，有钳子', category: '动物', difficulty: 'easy' },
  { id: '6', question: '凸眼睛，阔嘴巴，尾巴要比身体大，碧绿水草衬着它，好像一朵大红花。', answer: '金鱼', hint: '观赏鱼，红色，尾巴很大', category: '动物', difficulty: 'easy' },
  { id: '7', question: '胡子不多两边翘，开口总是喵喵叫，黑夜巡逻眼似灯，粮仓厨房它放哨。', answer: '猫', hint: '宠物，抓老鼠，叫声是喵喵', category: '动物', difficulty: 'easy' },
  { id: '8', question: '像熊比熊小，像猫比猫大，竹笋是食粮，密林中安家。', answer: '熊猫', hint: '国宝，黑白相间，吃竹子', category: '动物', difficulty: 'easy' },
  { id: '9', question: '小小诸葛亮，独坐中军帐，摆下八卦阵，专捉飞来将。', answer: '蜘蛛', hint: '昆虫，会织网，八条腿', category: '动物', difficulty: 'easy' },
  { id: '10', question: '说它是马猜错了，穿的衣服净道道，把它放进动物园，大人小孩都爱瞧。', answer: '斑马', hint: '非洲动物，身上有黑白条纹', category: '动物', difficulty: 'easy' },
  
  // 物品类 - 简单
  { id: '11', question: '有面没有口，有脚没有手，虽有四只脚，自己不会走。', answer: '桌子', hint: '家具，有四条腿，放东西用', category: '物品', difficulty: 'easy' },
  { id: '12', question: '白嫩小宝宝，洗澡吹泡泡，洗洗身体小，再洗不见了。', answer: '香皂', hint: '洗漱用品，用来洗手洗澡', category: '物品', difficulty: 'easy' },
  { id: '13', question: '独木造高楼，没瓦没砖头，人在水下走，水在人上流。', answer: '雨伞', hint: '雨具，撑开的，挡雨用', category: '物品', difficulty: 'easy' },
  { id: '14', question: '一个黑孩，从不开口，要是开口，掉出舌头。', answer: '瓜子', hint: '零食，黑色的，要嗑开吃', category: '物品', difficulty: 'easy' },
  { id: '15', question: '人脱衣服，它穿衣服，人脱帽子，它戴帽子。', answer: '衣架', hint: '用来挂衣服的架子', category: '物品', difficulty: 'easy' },
  { id: '16', question: '屋子方方，有门没窗，屋外热烘，屋里冰霜。', answer: '冰箱', hint: '家电，保鲜食物，里面很冷', category: '物品', difficulty: 'easy' },
  { id: '17', question: '两只小口袋，天天随身带，要是少一只，就把人笑坏。', answer: '袜子', hint: '穿在脚上的，成双成对', category: '物品', difficulty: 'easy' },
  { id: '18', question: '弟兄七八个，围着柱子坐，只要一分开，衣服就扯破。', answer: '大蒜', hint: '调味品，一瓣一瓣的，白色', category: '物品', difficulty: 'easy' },
  { id: '19', question: '身穿绿衣裳，肚里水汪汪，生的子儿多，个个黑脸膛。', answer: '西瓜', hint: '水果，夏天吃，红色果肉', category: '物品', difficulty: 'easy' },
  { id: '20', question: '不怕细菌小，有它能看到，化验需要它，科研不可少。', answer: '显微镜', hint: '科学仪器，能看到微小的东西', category: '物品', difficulty: 'easy' },
  
  // 自然类 - 中等
  { id: '21', question: '像云不是云，像烟不是烟，风吹轻轻飘，日出慢慢散。', answer: '雾', hint: '天气现象，早晨常见，白色的', category: '自然', difficulty: 'medium' },
  { id: '22', question: '天上有面鼓，藏在云深处，响时先发光，声音震山谷。', answer: '雷', hint: '天气现象，下雨时伴随，声音很大', category: '自然', difficulty: 'medium' },
  { id: '23', question: '多彩绳子颜色鲜，雨后弯弯挂蓝天，要问绳子有多长，这山搭到那山前。', answer: '彩虹', hint: '雨后出现，七种颜色，弯弯的', category: '自然', difficulty: 'medium' },
  { id: '24', question: '看不见摸不着，云朵见它跑，小树见它摇，海水见它跳。', answer: '风', hint: '自然现象，没有形状，能吹动东西', category: '自然', difficulty: 'medium' },
  { id: '25', question: '一面镜子亮晶晶，走遍天下照古今，不遇乌云来遮盖，常把万物照得清。', answer: '月亮', hint: '天体，晚上出现，会圆会缺', category: '自然', difficulty: 'medium' },
  { id: '26', question: '白天一起玩，夜间一块眠，到老不分散，人间好姻缘。', answer: '鸳鸯', hint: '水鸟，成双成对，象征爱情', category: '自然', difficulty: 'medium' },
  { id: '27', question: '青皮包白肉，像个大枕头，莫听名字冷，热天菜场有。', answer: '冬瓜', hint: '蔬菜，很大，绿色的皮', category: '自然', difficulty: 'medium' },
  { id: '28', question: '红公鸡，绿尾巴，身体钻到地底下，又甜又脆营养大。', answer: '胡萝卜', hint: '蔬菜，红色，长在地下', category: '自然', difficulty: 'medium' },
  { id: '29', question: '紫色树，开紫花，开过紫花结紫瓜，紫瓜里面装芝麻。', answer: '茄子', hint: '蔬菜，紫色，形状像瓜', category: '自然', difficulty: 'medium' },
  { id: '30', question: '千条线，万条线，掉到水里看不见。', answer: '雨', hint: '天气现象，从天上落下来，水做的', category: '自然', difficulty: 'medium' },
  
  // 抽象类 - 困难
  { id: '31', question: '有面无口，有脚无手，虽有四足，自己不会走。', answer: '桌子', hint: '家具，用来放东西', category: '物品', difficulty: 'medium' },
  { id: '32', question: '看看没有，摸摸倒有，像冰不化，像水不流。', answer: '玻璃', hint: '透明的材料，窗户上常用', category: '物品', difficulty: 'medium' },
  { id: '33', question: '生在山崖，落在人家，凉水浇背，千刀万剐。', answer: '磨刀石', hint: '用来磨刀的石头', category: '物品', difficulty: 'hard' },
  { id: '34', question: '一物三口，有腿无手，谁要没它，难见亲友。', answer: '裤子', hint: '衣服，穿在下半身，有两条腿', category: '物品', difficulty: 'hard' },
  { id: '35', question: '有头无颈，有眼无眉，无脚能走，有翅难飞。', answer: '鱼', hint: '水生动物，有尾巴，会游泳', category: '动物', difficulty: 'hard' },
  { id: '36', question: '吃进的是草，挤出的是宝，养分给人民，功劳真不小。', answer: '奶牛', hint: '动物，产奶，吃草', category: '动物', difficulty: 'hard' },
  { id: '37', question: '身体多轻柔，逍遥漫天游，风来它就躲，雨来它带头。', answer: '云', hint: '天上的，白色的，会飘动', category: '自然', difficulty: 'medium' },
  { id: '38', question: '像糖不是糖，有圆也有方，帮你改错字，劳累不怕脏。', answer: '橡皮', hint: '文具，用来擦铅笔字', category: '物品', difficulty: 'easy' },
  { id: '39', question: '小小一间房，只有一扇窗，唱歌又跳舞，天天变花样。', answer: '电视机', hint: '家电，有屏幕，能看节目', category: '物品', difficulty: 'easy' },
  { id: '40', question: '没脚它会走，干活不用手，住在泥房里，听话不摇头。', answer: '机器人', hint: '机器，会自动工作，像人一样', category: '物品', difficulty: 'hard' },
  { id: '41', question: '有嘴不能说，有肚不吃馍，虽说无胃病，黄水吐得多。', answer: '茶壶', hint: '茶具，用来泡茶，有壶嘴', category: '物品', difficulty: 'medium' },
  { id: '42', question: '圆圆身子似皮球，浑身长得绿油油，剖开肚皮红水流，清爽可口赛美酒。', answer: '西瓜', hint: '水果，圆的，红色果肉', category: '自然', difficulty: 'easy' },
  { id: '43', question: '不是桃树却结桃，桃子里面长白毛，到了秋天桃熟了，只见白毛不见桃。', answer: '棉花', hint: '植物，白色的，可以做衣服', category: '自然', difficulty: 'hard' },
  { id: '44', question: '有叶不开花，开花不见叶，花开百花前，飘香傲风雪。', answer: '梅花', hint: '花，冬天开，很香', category: '自然', difficulty: 'hard' },
  { id: '45', question: '小时穿黑衣，大时穿绿袍，水里过日子，岸上来睡觉。', answer: '青蛙', hint: '两栖动物，绿色，会跳会游泳', category: '动物', difficulty: 'medium' },
  { id: '46', question: '名字叫小花，喜欢摇尾巴，夜晚睡门口，小偷最怕他。', answer: '狗', hint: '宠物，忠诚，会看门', category: '动物', difficulty: 'easy' },
  { id: '47', question: '一物像人又像狗，爬杆上树是能手，擅长模仿人动作，家里没有山中有。', answer: '猴子', hint: '动物，像人，会爬树，机灵', category: '动物', difficulty: 'easy' },
  { id: '48', question: '会飞不是鸟，两翅没羽毛，白天休息晚活动，捕捉蚊虫本领高。', answer: '蝙蝠', hint: '会飞的哺乳动物，夜间活动', category: '动物', difficulty: 'medium' },
  { id: '49', question: '头戴珊瑚帽，身穿印花袄，脚穿一双靴子，走路蹦蹦跳跳。', answer: '公鸡', hint: '家禽，早上打鸣，红色鸡冠', category: '动物', difficulty: 'medium' },
  { id: '50', question: '身小力不小，团结又勤劳，有时搬粮食，有时挖地道。', answer: '蚂蚁', hint: '昆虫，很小，成群结队', category: '动物', difficulty: 'easy' },
];

export class RiddleGuessEngine {
  private currentRiddle: Riddle | null = null;
  private userAnswer: string = '';
  private attempts: number = 0;
  private maxAttempts: number = 3;
  private score: number = 0;
  private streak: number = 0;
  private solvedCount: number = 0;
  private skippedCount: number = 0;
  private hintsUsed: number = 0;
  private isComplete: boolean = false;
  private feedback: 'correct' | 'wrong' | 'pending' = 'pending';
  private difficulty: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed';
  private usedRiddleIds: Set<string> = new Set();
  private targetRiddleCount: number = 10;
  private currentRiddleIndex: number = 0;
  private showAnswer: boolean = false;

  constructor(difficulty: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed', riddleCount: number = 10) {
    this.difficulty = difficulty;
    this.targetRiddleCount = riddleCount;
    this.reset();
  }

  public reset(): void {
    this.score = 0;
    this.streak = 0;
    this.solvedCount = 0;
    this.skippedCount = 0;
    this.hintsUsed = 0;
    this.isComplete = false;
    this.usedRiddleIds = new Set();
    this.currentRiddleIndex = 0;
    this.showAnswer = false;
    this.nextRiddle();
  }

  private getAvailableRiddles(): Riddle[] {
    return RIDDLE_DATABASE.filter(r => {
      if (this.usedRiddleIds.has(r.id)) return false;
      if (this.difficulty === 'mixed') return true;
      return r.difficulty === this.difficulty;
    });
  }

  public nextRiddle(): boolean {
    if (this.currentRiddleIndex >= this.targetRiddleCount) {
      this.isComplete = true;
      return false;
    }

    const available = this.getAvailableRiddles();
    if (available.length === 0) {
      this.isComplete = true;
      return false;
    }

    this.currentRiddle = available[Math.floor(Math.random() * available.length)];
    this.usedRiddleIds.add(this.currentRiddle.id);
    this.userAnswer = '';
    this.attempts = 0;
    this.feedback = 'pending';
    this.showAnswer = false;
    this.currentRiddleIndex++;
    
    return true;
  }

  public setAnswer(answer: string): void {
    this.userAnswer = answer;
  }

  public submitAnswer(): { correct: boolean; message: string } {
    if (!this.currentRiddle || this.feedback === 'correct') {
      return { correct: false, message: '无法提交' };
    }

    const normalizedUserAnswer = this.userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = this.currentRiddle.answer.toLowerCase();

    // 支持多个可能的答案（用"/"分隔）
    const possibleAnswers = normalizedCorrectAnswer.split('/').map(a => a.trim());
    const isCorrect = possibleAnswers.some(ans => normalizedUserAnswer === ans);

    if (isCorrect) {
      this.feedback = 'correct';
      this.solvedCount++;
      this.streak++;
      
      // 计算得分
      const baseScore = this.currentRiddle.difficulty === 'easy' ? 10 : 
                       this.currentRiddle.difficulty === 'medium' ? 20 : 30;
      const streakBonus = Math.min(this.streak * 2, 10);
      const attemptBonus = (this.maxAttempts - this.attempts) * 5;
      this.score += baseScore + streakBonus + attemptBonus;
      
      return { 
        correct: true, 
        message: `猜对了! +${baseScore + streakBonus + attemptBonus}分 (连击x${this.streak})` 
      };
    } else {
      this.attempts++;
      
      if (this.attempts >= this.maxAttempts) {
        this.feedback = 'wrong';
        this.streak = 0;
        return { 
          correct: false, 
          message: `答案错误! 正确答案是: ${this.currentRiddle.answer}` 
        };
      }
      
      return { 
        correct: false, 
        message: `不对哦，再想想看! (还剩${this.maxAttempts - this.attempts}次机会)` 
      };
    }
  }

  public useHint(): string | null {
    if (!this.currentRiddle || this.feedback === 'correct') {
      return null;
    }

    this.hintsUsed++;
    this.score = Math.max(0, this.score - 5);
    return this.currentRiddle.hint;
  }

  public revealAnswer(): string {
    if (!this.currentRiddle) return '';
    
    this.showAnswer = true;
    this.feedback = 'wrong';
    this.streak = 0;
    this.score = Math.max(0, this.score - 10);
    
    return this.currentRiddle.answer;
  }

  public skipRiddle(): boolean {
    if (!this.currentRiddle) return false;
    
    this.skippedCount++;
    this.streak = 0;
    return this.nextRiddle();
  }

  public getState(): GameState {
    return {
      currentRiddle: this.currentRiddle,
      userAnswer: this.userAnswer,
      attempts: this.attempts,
      maxAttempts: this.maxAttempts,
      score: this.score,
      streak: this.streak,
      solvedCount: this.solvedCount,
      skippedCount: this.skippedCount,
      hintsUsed: this.hintsUsed,
      isComplete: this.isComplete,
      feedback: this.feedback
    };
  }

  public getCurrentRiddle(): Riddle | null {
    return this.currentRiddle;
  }

  public getUserAnswer(): string {
    return this.userAnswer;
  }

  public getScore(): number {
    return this.score;
  }

  public getStreak(): number {
    return this.streak;
  }

  public getProgress(): { current: number; total: number } {
    return { current: this.currentRiddleIndex, total: this.targetRiddleCount };
  }

  public isGameComplete(): boolean {
    return this.isComplete;
  }

  public getAccuracy(): number {
    const total = this.solvedCount + this.skippedCount + (this.currentRiddleIndex - this.solvedCount - this.skippedCount);
    if (total === 0) return 0;
    return Math.round((this.solvedCount / total) * 100);
  }

  public getFeedback(): 'correct' | 'wrong' | 'pending' {
    return this.feedback;
  }

  public shouldShowAnswer(): boolean {
    return this.showAnswer;
  }

  public setDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'mixed'): void {
    this.difficulty = difficulty;
  }

  public getAllRiddles(): Riddle[] {
    return [...RIDDLE_DATABASE];
  }

  public getCategories(): string[] {
    const categories = new Set(RIDDLE_DATABASE.map(r => r.category));
    return Array.from(categories);
  }

  public getRiddlesByCategory(category: string): Riddle[] {
    return RIDDLE_DATABASE.filter(r => r.category === category);
  }
}
