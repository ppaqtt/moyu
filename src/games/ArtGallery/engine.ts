export interface Artwork {
  id: number;
  title: string;
  artist: string;
  type: string;
  emoji: string;
  style: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  value: number;
  purchasePrice: number;
  displayed: boolean;
  liked: boolean;
  visitors: number;
  lastAppraisal: number;
}

export interface Customer {
  id: number;
  name: string;
  budget: number;
  preference: string;
  interestedArt: Artwork[];
  patience: number;
}

export interface ArtGalleryState {
  money: number;
  reputation: number;
  artworks: Artwork[];
  customers: Customer[];
  purchasedArtworks: Artwork[];
  displayedArtworks: Artwork[];
  totalVisitors: number;
  totalLikes: number;
  currentArtwork: Artwork | null;
  price: number;
  day: number;
}

export class ArtGalleryEngine {
  private state: ArtGalleryState;

  public artTypes = [
    { type: '油画', emoji: '🖼️', styles: ['印象派', '抽象派', '写实派'] },
    { type: '雕塑', emoji: '🗿', styles: ['古典', '现代', '抽象'] },
    { type: '摄影', emoji: '📷', styles: ['风景', '人物', '纪实'] },
    { type: '书法', emoji: '✍️', styles: ['楷书', '行书', '草书'] },
    { type: '水墨画', emoji: '🎨', styles: ['山水', '花鸟', '人物'] },
    { type: '插画', emoji: '🖌️', styles: ['动漫', '儿童', '商业'] },
  ];

  public artists = [
    '梵高', '莫奈', '毕加索', '张大千', '齐白石',
    '达芬奇', '米开朗基罗', '雷诺阿', '高更', '塞尚'
  ];

  public artTitles = [
    '星空', '日出', '蒙娜丽莎', '最后的晚餐', '呐喊',
    '睡莲', '向日葵', '星夜', '戴珍珠耳环的少女', '自由引导人民'
  ];

  public customerNames = [
    '收藏家王', '艺术爱好者李', '商人赵', '企业家钱', '投资人孙',
    '画家周', '评论家吴', '策展人郑', '教授陈', '记者刘'
  ];

  private rarityMultiplier = {
    common: 1,
    rare: 2.5,
    epic: 5,
    legendary: 10,
  };

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): ArtGalleryState {
    return {
      money: 10000,
      reputation: 30,
      artworks: [],
      customers: [],
      purchasedArtworks: [],
      displayedArtworks: [],
      totalVisitors: 0,
      totalLikes: 0,
      currentArtwork: null,
      price: 0,
      day: 1,
    };
  }

  public start(): void {
    this.state = this.getInitialState();
    this.generateMarketArt();
  }

  public generateMarketArt(): void {
    const artworks: Artwork[] = [];
    for (let i = 0; i < 6; i++) {
      artworks.push(this.generateArtwork());
    }
    this.state.artworks = artworks;
  }

  private generateArtwork(): Artwork {
    const typeInfo = this.artTypes[Math.floor(Math.random() * this.artTypes.length)];
    const style = typeInfo.styles[Math.floor(Math.random() * typeInfo.styles.length)];
    const rarity = this.getRandomRarity();
    const baseValue = 500 + Math.floor(Math.random() * 2000);

    return {
      id: Date.now() + Math.random(),
      title: this.artTitles[Math.floor(Math.random() * this.artTitles.length)] + '之' + Math.floor(Math.random() * 100),
      artist: this.artists[Math.floor(Math.random() * this.artists.length)],
      type: typeInfo.type,
      emoji: typeInfo.emoji,
      style,
      rarity,
      value: Math.floor(baseValue * this.rarityMultiplier[rarity]),
      purchasePrice: 0,
      displayed: false,
      liked: false,
      visitors: 0,
      lastAppraisal: 0,
    };
  }

  private getRandomRarity(): 'common' | 'rare' | 'epic' | 'legendary' {
    const rand = Math.random();
    if (rand > 0.95) return 'legendary';
    if (rand > 0.8) return 'epic';
    if (rand > 0.5) return 'rare';
    return 'common';
  }

  public buyArtwork(artworkId: number): boolean {
    const artwork = this.state.artworks.find(a => a.id === artworkId);
    if (!artwork || this.state.money < artwork.purchasePrice) return false;

    this.state.money -= artwork.purchasePrice;
    this.state.artworks = this.state.artworks.filter(a => a.id !== artworkId);
    artwork.displayed = false;
    this.state.purchasedArtworks.push(artwork);
    this.generateMarketArt();

    return true;
  }

  public displayArtwork(artworkId: number): boolean {
    const artwork = this.state.purchasedArtworks.find(a => a.id === artworkId);
    if (!artwork || this.state.displayedArtworks.length >= 5) return false;

    artwork.displayed = true;
    this.state.displayedArtworks.push(artwork);
    return true;
  }

  public removeFromDisplay(artworkId: number): void {
    const artwork = this.state.displayedArtworks.find(a => a.id === artworkId);
    if (artwork) {
      artwork.displayed = false;
      this.state.displayedArtworks = this.state.displayedArtworks.filter(a => a.id !== artworkId);
    }
  }

  public setArtworkPrice(price: number): void {
    this.state.price = Math.max(0, price);
  }

  public simulateDay(): void {
    this.state.day++;

    this.state.displayedArtworks.forEach(artwork => {
      const visitors = Math.floor(Math.random() * 50) + this.state.reputation;
      const likes = Math.floor(visitors * (0.1 + Math.random() * 0.3));

      artwork.visitors += visitors;
      if (likes > visitors * 0.2) {
        artwork.liked = true;
      }

      this.state.totalVisitors += visitors;
      this.state.totalLikes += likes;

      artwork.value = Math.floor(artwork.value * (1 + likes * 0.01));
    });

    const reputationGain = this.state.displayedArtworks.reduce((sum, a) => {
      return sum + (a.liked ? 2 : 0);
    }, 0);

    this.state.reputation = Math.min(100, this.state.reputation + reputationGain);

    if (this.state.reputation >= 80 && Math.random() > 0.7) {
      this.spawnCollector();
    }
  }

  private spawnCollector(): void {
    const collector: Customer = {
      id: Date.now(),
      name: this.customerNames[Math.floor(Math.random() * this.customerNames.length)] + ' (收藏家)',
      budget: 5000 + Math.random() * 10000,
      preference: this.artTypes[Math.floor(Math.random() * this.artTypes.length)].type,
      interestedArt: [],
      patience: 3,
    };

    this.state.purchasedArtworks.forEach(artwork => {
      if (artwork.value <= collector.budget && !artwork.displayed) {
        collector.interestedArt.push(artwork);
      }
    });

    if (collector.interestedArt.length > 0) {
      this.state.customers.push(collector);
    }
  }

  public sellToCollector(artworkId: number, customerId: number): boolean {
    const artwork = this.state.purchasedArtworks.find(a => a.id === artworkId);
    const customer = this.state.customers.find(c => c.id === customerId);

    if (!artwork || !customer) return false;
    if (!customer.interestedArt.find(a => a.id === artworkId)) return false;

    const salePrice = artwork.value * (1 + this.state.reputation / 100);

    if (this.state.money + salePrice <= 50000) {
      this.state.money += salePrice;
      this.state.purchasedArtworks = this.state.purchasedArtworks.filter(a => a.id !== artworkId);
      this.state.displayedArtworks = this.state.displayedArtworks.filter(a => a.id !== artworkId);
      this.state.customers = this.state.customers.filter(c => c.id !== customerId);
      return true;
    }

    return false;
  }

  public appraiseArtwork(artworkId: number): { newValue: number; rating: string } {
    const artwork = this.state.purchasedArtworks.find(a => a.id === artworkId);
    if (!artwork) return { newValue: 0, rating: '未知' };

    const appraisalfee = 100;
    if (this.state.money < appraisalfee) return { newValue: artwork.value, rating: '资金不足' };

    this.state.money -= appraisalfee;

    const appreciation = 1 + (this.state.reputation / 100) + Math.random() * 0.3;
    artwork.value = Math.floor(artwork.value * appreciation);
    artwork.lastAppraisal = Date.now();

    let rating = '普通';
    if (artwork.rarity === 'legendary') rating = '稀世珍品';
    else if (artwork.rarity === 'epic') rating = '佳作';
    else if (artwork.rarity === 'rare') rating = '精品';
    else if (artwork.value > 3000) rating = '佳作';

    return { newValue: artwork.value, rating };
  }

  public getState(): ArtGalleryState {
    return { ...this.state };
  }

  public getMarketArtworks(): Artwork[] {
    return [...this.state.artworks];
  }

  public getDisplayedArtworks(): Artwork[] {
    return [...this.state.displayedArtworks];
  }

  public getPurchasedArtworks(): Artwork[] {
    return [...this.state.purchasedArtworks];
  }
}

export const RARITY_COLORS = {
  common: '#888888',
  rare: '#3498db',
  epic: '#9b59b6',
  legendary: '#f39c12',
};
