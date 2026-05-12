export interface ArcadeMachine {
  id: number;
  name: string;
  emoji: string;
  level: number;
  maxLevel: number;
  earnings: number;
  popularity: number;
  condition: number;
  upgradeCost: number;
  repairCost: number;
}

export interface Customer {
  id: number;
  name: string;
  coins: number;
  preferredMachine: string | null;
  patience: number;
  satisfaction: number;
}

export interface GameCenterState {
  money: number;
  reputation: number;
  day: number;
  machines: ArcadeMachine[];
  customers: Customer[];
  totalEarnings: number;
  totalCustomers: number;
  isOpen: boolean;
}

export class GameCenterEngine {
  private state: GameCenterState;
  private customerNames = [
    '小明', '小红', '小强', '小丽', '阿杰',
    '阿美', '大力', '婷婷', '石头', '花花'
  ];

  public machineTypes = [
    { name: '街机', emoji: '🕹️', baseEarnings: 50, basePopularity: 80 },
    { name: '赛车游戏', emoji: '🏎️', baseEarnings: 60, basePopularity: 70 },
    { name: '跳舞机', emoji: '💃', baseEarnings: 55, basePopularity: 75 },
    { name: '抓娃娃机', emoji: '🧸', baseEarnings: 80, basePopularity: 90 },
    { name: '投篮机', emoji: '🏀', baseEarnings: 45, basePopularity: 65 },
    { name: '射击游戏', emoji: '🎯', baseEarnings: 50, basePopularity: 70 },
    { name: '赛车模拟', emoji: '🚗', baseEarnings: 55, basePopularity: 68 },
    { name: '音乐游戏', emoji: '🎵', baseEarnings: 65, basePopularity: 78 },
  ];

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): GameCenterState {
    const machines: ArcadeMachine[] = this.machineTypes.slice(0, 5).map((type, index) => ({
      id: index,
      ...type,
      level: 1,
      maxLevel: 5,
      earnings: type.baseEarnings,
      popularity: type.basePopularity,
      condition: 100,
      upgradeCost: 500 * (index + 1),
      repairCost: 100,
    }));

    return {
      money: 5000,
      reputation: 50,
      day: 1,
      machines,
      customers: [],
      totalEarnings: 0,
      totalCustomers: 0,
      isOpen: false,
    };
  }

  public start(): void {
    this.state = this.getInitialState();
  }

  public openGameCenter(): void {
    this.state.isOpen = true;
  }

  public closeGameCenter(): void {
    this.state.isOpen = false;
    this.state.customers = [];
    this.state.day++;
    this.updateMachines();
  }

  private updateMachines(): void {
    this.state.machines.forEach(machine => {
      if (machine.condition < 50) {
        machine.popularity = Math.max(10, machine.popularity - 10);
      }
      machine.condition = Math.min(100, machine.condition + 5);
    });
  }

  public spawnCustomer(): void {
    if (!this.state.isOpen || this.state.customers.length >= 8) return;

    const customer: Customer = {
      id: Date.now() + Math.random(),
      name: this.customerNames[Math.floor(Math.random() * this.customerNames.length)],
      coins: 10 + Math.floor(Math.random() * 30),
      preferredMachine: this.state.machines[Math.floor(Math.random() * this.state.machines.length)].name,
      patience: 30 + Math.random() * 20,
      satisfaction: 50 + Math.random() * 50,
    };

    this.state.customers.push(customer);
    this.state.totalCustomers++;
  }

  public updateCustomers(deltaTime: number): void {
    this.state.customers.forEach(customer => {
      customer.patience -= deltaTime / 100;

      const machine = this.state.machines.find(m => m.name === customer.preferredMachine);
      if (machine && machine.condition < 50) {
        customer.satisfaction -= deltaTime / 200;
      }
    });

    this.state.customers = this.state.customers.filter(customer => {
      if (customer.patience <= 0) {
        this.state.reputation = Math.max(0, this.state.reputation - 1);
        return false;
      }
      return true;
    });
  }

  public playMachine(machineId: number, customerId: number): boolean {
    const machine = this.state.machines.find(m => m.id === machineId);
    const customerIndex = this.state.customers.findIndex(c => c.id === customerId);

    if (!machine || customerIndex === -1) return false;

    const customer = this.state.customers[customerIndex];

    if (customer.coins <= 0) {
      return false;
    }

    const earnings = Math.floor(machine.earnings * (machine.level / 2) * (customer.satisfaction / 100));
    const coinCost = 2 + machine.level;

    if (customer.coins < coinCost) {
      return false;
    }

    customer.coins -= coinCost;
    machine.condition = Math.max(0, machine.condition - 2);
    machine.earnings += Math.floor(earnings * 0.1);

    const actualEarnings = Math.floor(earnings * 0.3);
    this.state.money += actualEarnings;
    this.state.totalEarnings += actualEarnings;

    customer.satisfaction = Math.min(100, customer.satisfaction + 5);

    if (customer.coins <= 0) {
      this.state.customers.splice(customerIndex, 1);
    }

    if (machine.condition < 20) {
      this.state.reputation = Math.max(0, this.state.reputation - 2);
    }

    return true;
  }

  public upgradeMachine(machineId: number): boolean {
    const machine = this.state.machines.find(m => m.id === machineId);

    if (!machine || machine.level >= machine.maxLevel) return false;
    if (this.state.money < machine.upgradeCost) return false;

    this.state.money -= machine.upgradeCost;
    machine.level++;
    machine.earnings = Math.floor(machine.earnings * 1.5);
    machine.popularity = Math.min(100, machine.popularity + 10);
    machine.upgradeCost = Math.floor(machine.upgradeCost * 2);
    machine.condition = Math.min(100, machine.condition + 20);

    return true;
  }

  public repairMachine(machineId: number): boolean {
    const machine = this.state.machines.find(m => m.id === machineId);

    if (!machine) return false;
    if (this.state.money < machine.repairCost) return false;
    if (machine.condition >= 100) return false;

    this.state.money -= machine.repairCost;
    machine.condition = 100;

    return true;
  }

  public buyNewMachine(): boolean {
    const ownedCount = this.state.machines.length;
    if (ownedCount >= this.machineTypes.length) return false;

    const newMachineType = this.machineTypes[ownedCount];
    const cost = 1000 + ownedCount * 500;

    if (this.state.money < cost) return false;

    this.state.money -= cost;

    const newMachine: ArcadeMachine = {
      id: ownedCount,
      name: newMachineType.name,
      emoji: newMachineType.emoji,
      level: 1,
      maxLevel: 5,
      earnings: newMachineType.baseEarnings,
      popularity: newMachineType.basePopularity,
      condition: 100,
      upgradeCost: 500 * (ownedCount + 1),
      repairCost: 100,
    };

    this.state.machines.push(newMachine);

    return true;
  }

  public getState(): GameCenterState {
    return { ...this.state };
  }

  public getMachines(): ArcadeMachine[] {
    return [...this.state.machines];
  }

  public getCustomers(): Customer[] {
    return [...this.state.customers];
  }
}
