export interface Pet {
  id: number;
  type: string;
  emoji: string;
  row: number;
  col: number;
  isSelected: boolean;
  isMatched: boolean;
}

export interface GameState {
  pets: Pet[];
  gridSize: number;
  score: number;
  matches: number;
  totalPairs: number;
  timeElapsed: number;
  isComplete: boolean;
  combo: number;
}

export class PetLinkEngine {
  private pets: Pet[] = [];
  private gridSize: number = 6;
  private score: number = 0;
  private matches: number = 0;
  private totalPairs: number = 0;
  private startTime: number = 0;
  private isComplete: boolean = false;
  private combo: number = 0;
  private selectedPet: Pet | null = null;

  private readonly petTypes = [
    { type: 'dog', emoji: '🐕' },
    { type: 'cat', emoji: '🐱' },
    { type: 'rabbit', emoji: '🐰' },
    { type: 'hamster', emoji: '🐹' },
    { type: 'bird', emoji: '🐦' },
    { type: 'fish', emoji: '🐟' },
    { type: 'turtle', emoji: '🐢' },
    { type: 'frog', emoji: '🐸' },
    { type: 'panda', emoji: '🐼' },
    { type: 'koala', emoji: '🐨' },
    { type: 'lion', emoji: '🦁' },
    { type: 'fox', emoji: '🦊' },
  ];

  constructor(gridSize: number = 6) {
    this.initialize(gridSize);
  }

  public initialize(gridSize: number): void {
    this.gridSize = Math.min(Math.max(gridSize, 4), 8);
    this.pets = [];
    this.score = 0;
    this.matches = 0;
    this.totalPairs = 0;
    this.isComplete = false;
    this.combo = 0;
    this.selectedPet = null;
    this.startTime = Date.now();

    const numPairs = Math.floor((this.gridSize * this.gridSize) / 2);
    this.totalPairs = numPairs;

    const selectedPets = this.shuffle([...this.petTypes]).slice(0, numPairs);
    
    let id = 0;
    for (const petType of selectedPets) {
      this.pets.push({
        id: id++,
        type: petType.type,
        emoji: petType.emoji,
        row: 0,
        col: 0,
        isSelected: false,
        isMatched: false
      });
      this.pets.push({
        id: id++,
        type: petType.type,
        emoji: petType.emoji,
        row: 0,
        col: 0,
        isSelected: false,
        isMatched: false
      });
    }

    this.shuffleArray(this.pets);
    this.assignPositions();
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private shuffle<T>(array: T[]): T[] {
    return this.shuffleArray([...array]);
  }

  private assignPositions(): void {
    let index = 0;
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (index < this.pets.length) {
          this.pets[index].row = row;
          this.pets[index].col = col;
          index++;
        }
      }
    }
  }

  public selectPet(row: number, col: number): { success: boolean; message: string; matched: boolean } {
    const pet = this.pets.find(p => p.row === row && p.col === col && !p.isMatched);
    
    if (!pet) {
      return { success: false, message: '位置无效', matched: false };
    }

    if (pet.isSelected) {
      pet.isSelected = false;
      this.selectedPet = null;
      return { success: true, message: '取消选择', matched: false };
    }

    if (!this.selectedPet) {
      pet.isSelected = true;
      this.selectedPet = pet;
      return { success: true, message: `选择了 ${pet.emoji}`, matched: false };
    }

    if (this.selectedPet.id === pet.id) {
      return { success: true, message: '不能选择同一张', matched: false };
    }

    if (this.selectedPet.type === pet.type) {
      this.selectedPet.isMatched = true;
      pet.isMatched = true;
      this.selectedPet.isSelected = false;
      
      this.matches++;
      this.combo++;
      const comboBonus = Math.min(this.combo, 5);
      this.score += 100 * comboBonus;

      this.selectedPet = null;

      if (this.matches >= this.totalPairs) {
        this.isComplete = true;
        return { success: true, message: '🎉 全部消除!', matched: true };
      }

      return { success: true, message: `配对成功! +${100 * comboBonus}分`, matched: true };
    } else {
      this.selectedPet.isSelected = false;
      pet.isSelected = true;
      this.selectedPet = pet;
      this.combo = 0;
      return { success: true, message: '类型不同...', matched: false };
    }
  }

  public getState(): GameState {
    return {
      pets: this.pets.map(p => ({ ...p })),
      gridSize: this.gridSize,
      score: this.score,
      matches: this.matches,
      totalPairs: this.totalPairs,
      timeElapsed: Math.floor((Date.now() - this.startTime) / 1000),
      isComplete: this.isComplete,
      combo: this.combo
    };
  }

  public getGridSize(): number {
    return this.gridSize;
  }

  public getScore(): number {
    return this.score;
  }

  public getMatches(): number {
    return this.matches;
  }

  public isCompleteGame(): boolean {
    return this.isComplete;
  }
}
