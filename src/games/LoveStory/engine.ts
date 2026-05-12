export type CharacterType = 'cool' | 'sweet' | 'mysterious' | 'energetic';
export type DateLocation = 'cafe' | 'park' | 'cinema' | 'restaurant' | 'beach' | 'amusement';
export type GiftType = 'flower' | 'chocolate' | 'jewelry' | 'book' | 'toy';
export type EventType = 'romantic' | 'adventure' | 'daily' | 'crisis';

export interface Character {
  id: string;
  name: string;
  avatar: string;
  type: CharacterType;
  description: string;
  initialAffection: number;
  maxAffection: number;
  preferences: {
    likes: string[];
    dislikes: string[];
    favoriteGift: GiftType;
  };
  personality: string;
}

export interface AffectionLevel {
  level: number;
  name: string;
  threshold: number;
  description: string;
}

export interface DateEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  choices: DateChoice[];
}

export interface DateChoice {
  id: string;
  text: string;
  affectionChange: number;
  specialEffect?: string;
  characterReaction: string;
}

export interface Gift {
  id: string;
  name: string;
  type: GiftType;
  price: number;
  effect: number;
  description: string;
}

export interface GameState {
  playerName: string;
  day: number;
  maxDays: number;
  money: number;
  energy: number;
  maxEnergy: number;
  currentCharacter: Character | null;
  characters: Character[];
  giftInventory: Gift[];
  dateHistory: string[];
  achievements: string[];
  isGameOver: boolean;
  ending: string | null;
}

export const CHARACTERS: Character[] = [
  {
    id: 'lily',
    name: '李Lily',
    avatar: '🌸',
    type: 'sweet',
    description: '温柔可爱的咖啡店店员，总是带着甜甜的微笑。',
    initialAffection: 20,
    maxAffection: 100,
    preferences: {
      likes: ['甜食', '小动物', '音乐', '花'],
      dislikes: ['暴力', '粗鲁', '熬夜'],
      favoriteGift: 'flower'
    },
    personality: '温柔体贴，善解人意，喜欢简单纯粹的生活。'
  },
  {
    id: 'kuro',
    name: '暗 Kuro',
    avatar: '🌙',
    type: 'cool',
    description: '神秘冷漠的学长，总是独来独往，让人捉摸不透。',
    initialAffection: 10,
    maxAffection: 100,
    preferences: {
      likes: ['夜晚', '咖啡', '阅读', '安静'],
      dislikes: ['吵闹', '虚伪', '打扰'],
      favoriteGift: 'book'
    },
    personality: '表面冷漠，内心热情，只对真正懂他的人敞开心扉。'
  },
  {
    id: 'mei',
    name: '林 Mei',
    avatar: '⚡',
    type: 'energetic',
    description: '活力满满的校队王牌，爽朗的性格让人忍不住想靠近。',
    initialAffection: 15,
    maxAffection: 100,
    preferences: {
      likes: ['运动', '冒险', '游戏', '美食'],
      dislikes: ['无聊', '抱怨', '认输'],
      favoriteGift: 'toy'
    },
    personality: '阳光开朗，永不服输，对朋友超级仗义。'
  },
  {
    id: 'yuki',
    name: '雪 Yuki',
    avatar: '❄️',
    type: 'mysterious',
    description: '转学而来的神秘少女，似乎藏着不为人知的过去。',
    initialAffection: 5,
    maxAffection: 100,
    preferences: {
      likes: ['星空', '绘画', '独处', '手工'],
      dislikes: ['人群', '谎言', '压力'],
      favoriteGift: 'jewelry'
    },
    personality: '安静内敛，情感细腻，需要耐心才能走进她的内心。'
  }
];

export const GIFTS: Gift[] = [
  { id: 'flower', name: '玫瑰花束', type: 'flower', price: 50, effect: 10, description: '一束娇艳欲滴的红玫瑰' },
  { id: 'flower2', name: '向日葵', type: 'flower', price: 30, effect: 6, description: '阳光般灿烂的向日葵' },
  { id: 'chocolate', name: '手工巧克力', type: 'chocolate', price: 40, effect: 8, description: '亲手制作的心形巧克力' },
  { id: 'chocolate2', name: '高级礼盒', type: 'chocolate', price: 80, effect: 15, description: '精致的巧克力礼盒' },
  { id: 'jewelry', name: '银色项链', type: 'jewelry', price: 150, effect: 25, description: '简约优雅的银饰' },
  { id: 'book', name: '文学作品', type: 'book', price: 35, effect: 7, description: '一本经典的文学作品' },
  { id: 'book2', name: '诗集', type: 'book', price: 60, effect: 12, description: '浪漫的诗集合集' },
  { id: 'toy', name: '可爱玩偶', type: 'toy', price: 45, effect: 9, description: '毛茸茸的小熊玩偶' },
];

export const AFFECTION_LEVELS: AffectionLevel[] = [
  { level: 0, name: '陌生人', threshold: 0, description: '你们还不太熟悉' },
  { level: 1, name: '认识', threshold: 20, description: '有过几面之缘' },
  { level: 2, name: '好感', threshold: 40, description: '开始在意对方了' },
  { level: 3, name: '喜欢', threshold: 60, description: '常常想起对方' },
  { level: 4, name: '心动', threshold: 80, description: '确认了自己的心意' },
  { level: 5, name: '恋人', threshold: 95, description: '你们在一起了！' }
];

export const DATE_EVENTS: DateEvent[] = [
  {
    id: 'event_cafe1',
    type: 'romantic',
    title: '咖啡店约会',
    description: '你们来到了那家温馨的咖啡店，空气中弥漫着咖啡的香气...',
    choices: [
      { id: 'a1', text: '为她点一杯她喜欢的拿铁', affectionChange: 8, characterReaction: '你真的很细心，谢谢你~' },
      { id: 'a2', text: '聊聊彼此的兴趣爱好', affectionChange: 12, characterReaction: '原来我们有很多共同点呢！' },
      { id: 'a3', text: '问她最近有什么烦恼吗', affectionChange: 15, characterReaction: '你总是能注意到这些...' }
    ]
  },
  {
    id: 'event_park1',
    type: 'daily',
    title: '公园漫步',
    description: '夕阳下的公园小径，落叶铺满了整条路...',
    choices: [
      { id: 'b1', text: '轻轻牵起她的手', affectionChange: 10, specialEffect: 'firstHandHold', characterReaction: '...心跳加速了' },
      { id: 'b2', text: '讲个笑话逗她开心', affectionChange: 5, characterReaction: '哈哈哈，你真有趣！' },
      { id: 'b3', text: '分享你最近读的一本书', affectionChange: 7, characterReaction: '下次借我看看？' }
    ]
  },
  {
    id: 'event_cinema1',
    type: 'romantic',
    title: '电影院之夜',
    description: '电影院里灯光渐暗，屏幕上开始播放浪漫的电影...',
    choices: [
      { id: 'c1', text: '悄悄把手放在扶手上靠近她', affectionChange: 8, characterReaction: '感觉到你的温度了...' },
      { id: 'c2', text: '轻声为她解说剧情', affectionChange: 5, characterReaction: '你懂的好多呀~' },
      { id: 'c3', text: '买爆米花和她分享', affectionChange: 6, characterReaction: '一起吃最开心了！' }
    ]
  },
  {
    id: 'event_adventure1',
    type: 'adventure',
    title: '游乐园探险',
    description: '游乐园里充满了欢笑声和各种刺激的项目...',
    choices: [
      { id: 'd1', text: '陪她坐摩天轮', affectionChange: 15, characterReaction: '在高处看夜景一定很美...' },
      { id: 'd2', text: '挑战过山车', affectionChange: 10, characterReaction: '好刺激！我们再玩一次！' },
      { id: 'd3', text: '为她赢得一个玩偶奖品', affectionChange: 12, characterReaction: '你好厉害！想要那个粉色的~' }
    ]
  },
  {
    id: 'event_crisis1',
    type: 'crisis',
    title: '意外的帮助',
    description: '她似乎遇到了什么麻烦，眉头紧锁着...',
    choices: [
      { id: 'e1', text: '上前询问发生了什么', affectionChange: 15, characterReaction: '...谢谢你愿意听我说' },
      { id: 'e2', text: '默默陪在她身边', affectionChange: 12, characterReaction: '有你在身边，感觉安心多了' },
      { id: 'e3', text: '想办法逗她开心', affectionChange: 8, characterReaction: '噗...你真的很傻呢' }
    ]
  },
  {
    id: 'event_beach1',
    type: 'romantic',
    title: '海边日落',
    description: '海风吹拂着你们的发丝，夕阳将海面染成了金色...',
    choices: [
      { id: 'f1', text: '提议一起堆沙堡', affectionChange: 10, characterReaction: '好久没这样玩过了~' },
      { id: 'f2', text: '静静欣赏这美好的时刻', affectionChange: 8, characterReaction: '这画面，好想永远记住...' },
      { id: 'f3', text: '为她拍下美丽的照片', affectionChange: 12, characterReaction: '哇，拍得好好看！' }
    ]
  },
  {
    id: 'event_daily1',
    type: 'daily',
    title: '图书馆相遇',
    description: '在安静的图书馆里，你发现她正专注地阅读...',
    choices: [
      { id: 'g1', text: '安静地坐在她旁边看书', affectionChange: 7, characterReaction: '能一起看书真好~' },
      { id: 'g2', text: '递上一张小纸条', affectionChange: 10, characterReaction: '...好害羞，脸都红了' },
      { id: 'g3', text: '推荐一本你喜欢的书', affectionChange: 9, characterReaction: '我会认真读这本书的！' }
    ]
  }
];

export class LoveStoryEngine {
  private state: GameState;
  private onStateChange?: (state: GameState) => void;

  constructor() {
    const characters = CHARACTERS.map(c => ({ ...c, initialAffection: c.initialAffection }));
    
    this.state = {
      playerName: '主角',
      day: 1,
      maxDays: 14,
      money: 500,
      energy: 100,
      maxEnergy: 100,
      currentCharacter: null,
      characters,
      giftInventory: [],
      dateHistory: [],
      achievements: [],
      isGameOver: false,
      ending: null
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

  public selectCharacter(characterId: string): boolean {
    const character = this.state.characters.find(c => c.id === characterId);
    if (!character) return false;

    this.state.currentCharacter = { ...character };
    this.notifyChange();
    return true;
  }

  public getCurrentCharacter(): Character | null {
    return this.state.currentCharacter;
  }

  public getAvailableCharacters(): Character[] {
    return this.state.characters;
  }

  public buyGift(giftId: string): boolean {
    const gift = GIFTS.find(g => g.id === giftId);
    if (!gift || this.state.money < gift.price) return false;

    this.state.money -= gift.price;
    this.state.giftInventory.push({ ...gift, id: `${giftId}-${Date.now()}` });
    this.notifyChange();
    return true;
  }

  public giveGift(giftId: string): { success: boolean; message: string; affectionGain: number } {
    if (!this.state.currentCharacter) {
      return { success: false, message: '请先选择约会的对象', affectionGain: 0 };
    }

    const giftIndex = this.state.giftInventory.findIndex(g => g.id === giftId);
    if (giftIndex === -1) {
      return { success: false, message: '背包中没有这个礼物', affectionGain: 0 };
    }

    const gift = this.state.giftInventory[giftIndex];
    const character = this.state.currentCharacter;

    let affectionGain = gift.effect;

    if (gift.type === character.preferences.favoriteGift) {
      affectionGain *= 1.5;
    }

    if (character.preferences.likes.some(like => gift.name.includes(like))) {
      affectionGain *= 1.2;
    }

    if (character.preferences.dislikes.some(dislike => gift.name.includes(dislike))) {
      affectionGain *= 0.5;
    }

    affectionGain = Math.round(affectionGain);

    this.state.currentCharacter.initialAffection = Math.min(
      character.maxAffection,
      this.state.currentCharacter.initialAffection + affectionGain
    );

    this.state.giftInventory.splice(giftIndex, 1);
    this.state.energy -= 10;

    this.checkAchievements();
    this.notifyChange();

    const reaction = this.getGiftReaction(gift, affectionGain);
    return { success: true, message: reaction, affectionGain };
  }

  private getGiftReaction(gift: Gift, affectionGain: number): string {
    if (affectionGain >= 20) {
      return `太喜欢了！谢谢你～ (好感+${affectionGain})`;
    } else if (affectionGain >= 10) {
      return `收到礼物好开心！ (好感+${affectionGain})`;
    } else {
      return `谢谢你，我会好好珍惜的 (好感+${affectionGain})`;
    }
  }

  public startDate(): DateEvent | null {
    if (!this.state.currentCharacter) return null;
    if (this.state.energy < 20) return null;

    const availableEvents = DATE_EVENTS.filter(event => {
      if (event.type === 'crisis') {
        return Math.random() < 0.2;
      }
      return true;
    });

    const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    return event;
  }

  public makeDateChoice(eventId: string, choiceId: string): { success: boolean; message: string; affectionChange: number } {
    if (!this.state.currentCharacter) {
      return { success: false, message: '请先选择约会的对象', affectionChange: 0 };
    }

    const event = DATE_EVENTS.find(e => e.id === eventId);
    if (!event) {
      return { success: false, message: '找不到约会事件', affectionChange: 0 };
    }

    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) {
      return { success: false, message: '找不到这个选项', affectionChange: 0 };
    }

    this.state.energy -= 15;
    this.state.money -= 30;
    this.state.dateHistory.push(eventId);

    let affectionChange = choice.affectionChange;

    if (this.state.currentCharacter.type === 'sweet' && event.type === 'romantic') {
      affectionChange = Math.round(affectionChange * 1.2);
    } else if (this.state.currentCharacter.type === 'cool' && event.type === 'daily') {
      affectionChange = Math.round(affectionChange * 1.3);
    } else if (this.state.currentCharacter.type === 'energetic' && event.type === 'adventure') {
      affectionChange = Math.round(affectionChange * 1.4);
    } else if (this.state.currentCharacter.type === 'mysterious' && event.type === 'daily') {
      affectionChange = Math.round(affectionChange * 1.2);
    }

    this.state.currentCharacter.initialAffection = Math.min(
      this.state.currentCharacter.maxAffection,
      this.state.currentCharacter.initialAffection + affectionChange
    );

    if (choice.specialEffect) {
      this.state.achievements.push(choice.specialEffect);
    }

    this.checkAchievements();
    this.notifyChange();

    return {
      success: true,
      message: choice.characterReaction,
      affectionChange
    };
  }

  public endDay(): void {
    this.state.day++;
    this.state.energy = this.state.maxEnergy;
    this.state.money += 100;

    this.checkEndGame();
    this.notifyChange();
  }

  private checkAchievements(): void {
    const character = this.state.currentCharacter;
    if (!character) return;

    const affectionLevel = this.getAffectionLevel();

    if (affectionLevel.level >= 1 && !this.state.achievements.includes('firstMeet')) {
      this.state.achievements.push('firstMeet');
    }
    if (affectionLevel.level >= 2 && !this.state.achievements.includes('becomingClose')) {
      this.state.achievements.push('becomingClose');
    }
    if (affectionLevel.level >= 3 && !this.state.achievements.includes('fallingInLove')) {
      this.state.achievements.push('fallingInLove');
    }
    if (this.state.dateHistory.length >= 5 && !this.state.achievements.includes('frequentDating')) {
      this.state.achievements.push('frequentDating');
    }
  }

  public getAffectionLevel(): AffectionLevel {
    if (!this.state.currentCharacter) {
      return AFFECTION_LEVELS[0];
    }

    const affection = this.state.currentCharacter.initialAffection;
    
    for (let i = AFFECTION_LEVELS.length - 1; i >= 0; i--) {
      if (affection >= AFFECTION_LEVELS[i].threshold) {
        return AFFECTION_LEVELS[i];
      }
    }

    return AFFECTION_LEVELS[0];
  }

  private checkEndGame(): void {
    if (!this.state.currentCharacter) return;

    const level = this.getAffectionLevel();

    if (level.level >= 5) {
      this.state.isGameOver = true;
      this.state.ending = 'best';
    } else if (this.state.day >= this.state.maxDays) {
      if (level.level >= 4) {
        this.state.isGameOver = true;
        this.state.ending = 'good';
      } else if (level.level >= 2) {
        this.state.isGameOver = true;
        this.state.ending = 'normal';
      } else {
        this.state.isGameOver = true;
        this.state.ending = 'bad';
      }
    }
  }

  public getEndingMessage(): { title: string; message: string; emoji: string } {
    switch (this.state.ending) {
      case 'best':
        return {
          title: '【完美结局】幸福的恋人',
          message: `经过这段时间的相处，${this.state.currentCharacter?.name}被你的真诚打动了。你们正式在一起了，开启了甜蜜的恋爱生活~`,
          emoji: '💕'
        };
      case 'good':
        return {
          title: '【好结局】心动时刻',
          message: `${this.state.currentCharacter?.name}对你有了好感，虽然还没有正式交往，但未来充满了可能...`,
          emoji: '💗'
        };
      case 'normal':
        return {
          title: '【普通结局】朋友之上',
          message: `你们成为了好朋友，但似乎还没有跨越那条线。也许下次会有更好的结果呢？`,
          emoji: '🤝'
        };
      case 'bad':
        return {
          title: '【失败结局】擦肩而过',
          message: `时间匆匆流逝，你和${this.state.currentCharacter?.name}最终还是错过了。也许是缘分未到吧...`,
          emoji: '💔'
        };
      default:
        return {
          title: '游戏进行中',
          message: '继续努力吧！',
          emoji: '🌟'
        };
    }
  }

  public restart(): void {
    const characters = CHARACTERS.map(c => ({ ...c, initialAffection: c.initialAffection }));

    this.state = {
      playerName: '主角',
      day: 1,
      maxDays: 14,
      money: 500,
      energy: 100,
      maxEnergy: 100,
      currentCharacter: null,
      characters,
      giftInventory: [],
      dateHistory: [],
      achievements: [],
      isGameOver: false,
      ending: null
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
}
