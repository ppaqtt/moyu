export type RoomType = 'standard' | 'deluxe' | 'suite' | 'royal';
export type RoomStatus = 'empty' | 'cleaning' | 'occupied';

export interface Room {
  id: number;
  type: RoomType;
  floor: number;
  status: RoomStatus;
  cleanliness: number;
  guestName: string | null;
  checkInTime: number;
  stayDuration: number;
}

export interface HotelState {
  money: number;
  stars: number;
  totalGuests: number;
  revenue: number;
  rooms: Room[];
  guests: Guest[];
  day: number;
  gameOver: boolean;
}

export interface Guest {
  id: number;
  name: string;
  preferredRoomType: RoomType;
  patience: number;
  maxPatience: number;
  willingness: number;
}

export const ROOM_CONFIG: Record<RoomType, { 
  name: string; 
  emoji: string; 
  price: number; 
  cleanTime: number; 
  capacity: number;
  unlockCost: number;
  color: string 
}> = {
  standard: {
    name: '标准间',
    emoji: '🛏️',
    price: 100,
    cleanTime: 3000,
    capacity: 2,
    unlockCost: 0,
    color: '#3498db'
  },
  deluxe: {
    name: '豪华间',
    emoji: '🛋️',
    price: 200,
    cleanTime: 4000,
    capacity: 2,
    unlockCost: 500,
    color: '#9b59b6'
  },
  suite: {
    name: '套房',
    emoji: '🏠',
    price: 400,
    cleanTime: 5000,
    capacity: 4,
    unlockCost: 1500,
    color: '#e74c3c'
  },
  royal: {
    name: '皇室套房',
    emoji: '👑',
    price: 800,
    cleanTime: 6000,
    capacity: 6,
    unlockCost: 5000,
    color: '#f39c12'
  }
};

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;
const INITIAL_MONEY = 1000;
const MAX_STARS = 5;
const ROOMS_PER_FLOOR = 4;

const GUEST_NAMES = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
  '小明', '小红', '小华', '小丽', 'James', 'Mary', 'John', 'Emma'
];

export class HotelEmpireEngine {
  private money: number;
  private stars: number;
  private totalGuests: number;
  private revenue: number;
  private rooms: Room[];
  private guests: Guest[];
  private day: number;
  private gameOver: boolean;
  private lastUpdate: number;
  private guestIdCounter: number;
  private guestSpawnTimer: number;
  private unlockedRooms: RoomType[];

  constructor() {
    this.money = INITIAL_MONEY;
    this.stars = 1;
    this.totalGuests = 0;
    this.revenue = 0;
    this.rooms = [];
    this.guests = [];
    this.day = 1;
    this.gameOver = false;
    this.lastUpdate = Date.now();
    this.guestIdCounter = 0;
    this.guestSpawnTimer = 0;
    this.unlockedRooms = ['standard'];
    this.init();
  }

  private init(): void {
    this.rooms = [];
    for (let floor = 0; floor < 2; floor++) {
      for (let i = 0; i < ROOMS_PER_FLOOR; i++) {
        const roomType: RoomType = i < 2 ? 'standard' : (i === 2 ? 'deluxe' : 'suite');
        this.rooms.push({
          id: floor * ROOMS_PER_FLOOR + i,
          type: roomType,
          floor,
          status: 'empty',
          cleanliness: 100,
          guestName: null,
          checkInTime: 0,
          stayDuration: 0
        });
      }
    }
  }

  getState(): HotelState {
    return {
      money: this.money,
      stars: this.stars,
      totalGuests: this.totalGuests,
      revenue: this.revenue,
      rooms: [...this.rooms],
      guests: [...this.guests],
      day: this.day,
      gameOver: this.gameOver
    };
  }

  getRoomConfig(type: RoomType) {
    return ROOM_CONFIG[type];
  }

  getUnlockedRooms(): RoomType[] {
    return [...this.unlockedRooms];
  }

  unlockRoom(type: RoomType): boolean {
    if (this.unlockedRooms.includes(type)) return false;
    
    const config = ROOM_CONFIG[type];
    if (this.money < config.unlockCost) return false;

    this.money -= config.unlockCost;
    this.unlockedRooms.push(type);
    
    const unlockedCount = this.unlockedRooms.length;
    this.stars = Math.min(MAX_STARS, unlockedCount);

    return true;
  }

  checkIn(guestId: number, roomId: number): boolean {
    const guest = this.guests.find(g => g.id === guestId);
    const room = this.rooms.find(r => r.id === roomId);

    if (!guest || !room) return false;
    if (room.status !== 'empty' || room.cleanliness < 50) return false;
    if (!this.unlockedRooms.includes(room.type)) return false;

    const config = ROOM_CONFIG[room.type];
    if (this.money < config.price * 0.2) return false;

    room.status = 'occupied';
    room.guestName = guest.name;
    room.checkInTime = Date.now();
    room.stayDuration = Math.floor(Math.random() * 3) + 1;

    this.money += config.price;
    this.revenue += config.price;
    this.guests = this.guests.filter(g => g.id !== guestId);

    return true;
  }

  checkOut(roomId: number): boolean {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room || room.status !== 'occupied') return false;

    room.status = 'cleaning';
    room.guestName = null;
    room.checkInTime = 0;

    return true;
  }

  cleanRoom(roomId: number): boolean {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room || room.status !== 'cleaning') return false;

    room.status = 'empty';
    room.cleanliness = 100;

    return true;
  }

  upgradeRoom(roomId: number): boolean {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room || room.status !== 'empty') return false;

    const roomTypes: RoomType[] = ['standard', 'deluxe', 'suite', 'royal'];
    const currentIndex = roomTypes.indexOf(room.type);
    if (currentIndex >= roomTypes.length - 1) return false;

    const nextType = roomTypes[currentIndex + 1];
    if (!this.unlockedRooms.includes(nextType)) return false;

    room.type = nextType;
    return true;
  }

  private spawnGuest(): void {
    const guestTypes: RoomType[] = ['standard', 'deluxe', 'suite', 'royal'];
    const availableTypes = guestTypes.filter(t => this.unlockedRooms.includes(t));
    
    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const randomName = GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)];

    const guest: Guest = {
      id: this.guestIdCounter++,
      name: randomName,
      preferredRoomType: randomType,
      patience: 10000,
      maxPatience: 10000,
      willingness: Math.random() * 30 + 70
    };

    this.guests.push(guest);
  }

  tick(): void {
    if (this.gameOver) return;

    const now = Date.now();
    const deltaTime = now - this.lastUpdate;
    this.lastUpdate = now;

    this.guestSpawnTimer += deltaTime;
    if (this.guestSpawnTimer >= 8000 && this.guests.length < 4) {
      this.spawnGuest();
      this.guestSpawnTimer = 0;
    }

    for (const room of this.rooms) {
      if (room.status === 'cleaning') {
        room.cleanliness = Math.max(0, room.cleanliness - deltaTime * 0.05);
        if (room.cleanliness <= 0) {
          room.status = 'empty';
          room.cleanliness = 100;
        }
      }

      if (room.status === 'occupied') {
        const elapsed = now - room.checkInTime;
        const stayTime = room.stayDuration * 5000;
        if (elapsed >= stayTime) {
          this.checkOut(room.id);
        }
      }
    }

    for (const guest of this.guests) {
      guest.patience -= deltaTime;
      if (guest.patience <= 0) {
        this.guests = this.guests.filter(g => g.id !== guest.id);
        this.stars = Math.max(1, this.stars - 1);
      }
    }

    if (this.money < -500) {
      this.gameOver = true;
    }

    if (this.day % 10 === 0 && this.totalGuests > 0) {
      const avgRating = this.revenue / this.totalGuests;
      if (avgRating > 300) {
        this.stars = Math.min(MAX_STARS, this.stars + 1);
      }
    }
  }

  nextDay(): void {
    this.day++;
  }

  reset(): void {
    this.money = INITIAL_MONEY;
    this.stars = 1;
    this.totalGuests = 0;
    this.revenue = 0;
    this.guests = [];
    this.day = 1;
    this.gameOver = false;
    this.lastUpdate = Date.now();
    this.guestSpawnTimer = 0;
    this.unlockedRooms = ['standard'];
    this.init();
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }
}
