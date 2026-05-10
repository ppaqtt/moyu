export interface Car {
  id: number;
  model: string;
  emoji: string;
  problems: string[];
  damage: number;
  repairProgress: number;
  reward: number;
  customerName: string;
}

export interface RepairTool {
  id: string;
  name: string;
  emoji: string;
  repairPower: number;
  cost: number;
}

export interface CarRepairState {
  money: number;
  reputation: number;
  currentCar: Car | null;
  waitingCars: Car[];
  completedCars: number;
  totalEarnings: number;
  tools: RepairTool[];
  currentTool: string | null;
  isRepairing: boolean;
  repairSpeed: number;
  customersSatisfied: number;
}

export class CarRepairEngine {
  private state: CarRepairState;
  private carModels = [
    { model: '经济型轿车', emoji: '🚗', reward: 200 },
    { model: 'SUV越野车', emoji: '🚙', reward: 350 },
    { model: '豪华轿车', emoji: '🚘', reward: 500 },
    { model: '跑车', emoji: '🏎️', reward: 600 },
    { model: '面包车', emoji: '🚐', reward: 250 },
    { model: '卡车', emoji: '🚛', reward: 400 },
  ];

  private problemTypes = [
    { name: '换轮胎', emoji: '🛞', repairTime: 3 },
    { name: '补油漆', emoji: '🎨', repairTime: 2 },
    { name: '修引擎', emoji: '⚙️', repairTime: 5 },
    { name: '换刹车片', emoji: '🛑', repairTime: 3 },
    { name: '加机油', emoji: '🛢️', repairTime: 2 },
    { name: '修空调', emoji: '❄️', repairTime: 4 },
    { name: '换电池', emoji: '🔋', repairTime: 2 },
    { name: '调悬挂', emoji: '🔧', repairTime: 4 },
  ];

  private customerNames = [
    '张先生', '李女士', '王老板', '刘师傅', '陈司机',
    '赵女士', '孙经理', '周师傅', '吴小姐', '郑先生'
  ];

  public tools: RepairTool[] = [
    { id: 'wrench', name: '扳手', emoji: '🔧', repairPower: 1, cost: 0 },
    { id: 'spray', name: '喷漆器', emoji: '🎨', repairPower: 2, cost: 100 },
    { id: 'diagnostic', name: '诊断仪', emoji: '📱', repairPower: 3, cost: 200 },
    { id: 'lift', name: '升降机', emoji: '🏗️', repairPower: 5, cost: 500 },
  ];

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): CarRepairState {
    const waitingCars: Car[] = [];
    for (let i = 0; i < 3; i++) {
      waitingCars.push(this.generateCar());
    }

    return {
      money: 500,
      reputation: 50,
      currentCar: null,
      waitingCars,
      completedCars: 0,
      totalEarnings: 0,
      tools: this.tools.map(t => ({ ...t })),
      currentTool: 'wrench',
      isRepairing: false,
      repairSpeed: 1,
      customersSatisfied: 0,
    };
  }

  private generateCar(): Car {
    const modelInfo = this.carModels[Math.floor(Math.random() * this.carModels.length)];
    const problemCount = Math.floor(Math.random() * 3) + 1;
    const problems: string[] = [];

    for (let i = 0; i < problemCount; i++) {
      const problem = this.problemTypes[Math.floor(Math.random() * this.problemTypes.length)];
      if (!problems.includes(problem.name)) {
        problems.push(problem.name);
      }
    }

    return {
      id: Date.now() + Math.random(),
      model: modelInfo.model,
      emoji: modelInfo.emoji,
      problems,
      damage: problems.length * 25 + Math.floor(Math.random() * 20),
      repairProgress: 0,
      reward: modelInfo.reward + problems.length * 50,
      customerName: this.customerNames[Math.floor(Math.random() * this.customerNames.length)],
    };
  }

  public start(): void {
    this.state = this.getInitialState();
  }

  public selectNextCar(): void {
    if (this.state.currentCar) {
      return;
    }

    if (this.state.waitingCars.length > 0) {
      this.state.currentCar = this.state.waitingCars.shift()!;
      this.state.currentCar.repairProgress = 0;

      if (this.state.waitingCars.length < 3) {
        this.state.waitingCars.push(this.generateCar());
      }
    }
  }

  public startRepair(): void {
    if (!this.state.currentCar) return;
    this.state.isRepairing = true;
  }

  public stopRepair(): void {
    this.state.isRepairing = false;
  }

  public repair(): void {
    if (!this.state.currentCar || !this.state.isRepairing) return;

    const tool = this.state.tools.find(t => t.id === this.state.currentTool);
    const repairPower = tool ? tool.repairPower : 1;
    const reputationBonus = this.state.reputation / 100;

    this.state.currentCar.repairProgress += repairPower * this.state.repairSpeed * (0.5 + reputationBonus * 0.5);

    if (this.state.currentCar.repairProgress >= 100) {
      this.completeRepair();
    }
  }

  private completeRepair(): void {
    if (!this.state.currentCar) return;

    const car = this.state.currentCar;
    const reputationBonus = this.state.reputation / 200;
    const earnings = Math.floor(car.reward * (1 + reputationBonus));

    this.state.money += earnings;
    this.state.totalEarnings += earnings;
    this.state.completedCars++;
    this.state.customersSatisfied++;

    if (this.state.completedCars % 5 === 0) {
      this.state.reputation = Math.min(100, this.state.reputation + 5);
    }

    this.state.currentCar = null;
    this.state.isRepairing = false;

    if (this.state.waitingCars.length > 0) {
      this.state.waitingCars.push(this.generateCar());
    }
  }

  public selectTool(toolId: string): void {
    this.state.currentTool = toolId;
  }

  public upgradeSpeed(): boolean {
    if (this.state.money >= 200 && this.state.repairSpeed < 5) {
      this.state.money -= 200;
      this.state.repairSpeed += 0.5;
      return true;
    }
    return false;
  }

  public dismissCar(): void {
    if (!this.state.currentCar) return;

    this.state.currentCar = null;
    this.state.isRepairing = false;
    this.state.reputation = Math.max(0, this.state.reputation - 5);

    if (this.state.waitingCars.length > 0) {
      this.state.waitingCars.push(this.generateCar());
    }
  }

  public getState(): CarRepairState {
    return { ...this.state };
  }

  public getCurrentCar(): Car | null {
    return this.state.currentCar;
  }

  public getWaitingCars(): Car[] {
    return [...this.state.waitingCars];
  }
}
