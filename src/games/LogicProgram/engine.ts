export interface Position {
  x: number;
  y: number;
}

export type LogicGateType = 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR';

export interface LogicComponent {
  id: string;
  type: 'input' | 'output' | LogicGateType;
  position: Position;
  value: boolean;
}

export interface Connection {
  id: string;
  from: Position;
  to: Position;
}

export interface Level {
  id: number;
  name: string;
  gridSize: { width: number; height: number };
  components: LogicComponent[];
  targetOutput: boolean;
  lesson: string;
}

const LEVELS: Level[] = [
  {
    id: 1,
    name: '简单开关',
    gridSize: { width: 5, height: 5 },
    components: [
      { id: 'in1', type: 'input', position: { x: 0, y: 2 }, value: false },
      { id: 'out1', type: 'output', position: { x: 4, y: 2 }, value: false }
    ],
    targetOutput: true,
    lesson: '点击输入开关，连接到输出，让输出变为true！'
  },
  {
    id: 2,
    name: 'AND门',
    gridSize: { width: 6, height: 5 },
    components: [
      { id: 'in1', type: 'input', position: { x: 0, y: 1 }, value: false },
      { id: 'in2', type: 'input', position: { x: 0, y: 3 }, value: false },
      { id: 'and1', type: 'AND', position: { x: 2, y: 2 }, value: false },
      { id: 'out1', type: 'output', position: { x: 5, y: 2 }, value: false }
    ],
    targetOutput: true,
    lesson: 'AND门需要两个输入都为true才能输出true！'
  },
  {
    id: 3,
    name: 'OR门',
    gridSize: { width: 6, height: 5 },
    components: [
      { id: 'in1', type: 'input', position: { x: 0, y: 1 }, value: false },
      { id: 'in2', type: 'input', position: { x: 0, y: 3 }, value: false },
      { id: 'or1', type: 'OR', position: { x: 2, y: 2 }, value: false },
      { id: 'out1', type: 'output', position: { x: 5, y: 2 }, value: false }
    ],
    targetOutput: true,
    lesson: 'OR门只要一个输入为true就输出true！'
  },
  {
    id: 4,
    name: 'NOT门',
    gridSize: { width: 5, height: 5 },
    components: [
      { id: 'in1', type: 'input', position: { x: 0, y: 2 }, value: false },
      { id: 'not1', type: 'NOT', position: { x: 2, y: 2 }, value: false },
      { id: 'out1', type: 'output', position: { x: 4, y: 2 }, value: false }
    ],
    targetOutput: true,
    lesson: 'NOT门会反转输入值！'
  },
  {
    id: 5,
    name: '组合逻辑',
    gridSize: { width: 8, height: 6 },
    components: [
      { id: 'in1', type: 'input', position: { x: 0, y: 1 }, value: false },
      { id: 'in2', type: 'input', position: { x: 0, y: 3 }, value: false },
      { id: 'in3', type: 'input', position: { x: 0, y: 5 }, value: false },
      { id: 'and1', type: 'AND', position: { x: 3, y: 1 }, value: false },
      { id: 'or1', type: 'OR', position: { x: 3, y: 4 }, value: false },
      { id: 'xor1', type: 'XOR', position: { x: 5, y: 2.5 }, value: false },
      { id: 'out1', type: 'output', position: { x: 7, y: 2.5 }, value: false }
    ],
    targetOutput: true,
    lesson: '组合多个逻辑门，让最终输出为true！'
  }
];

export class LogicProgramEngine {
  private currentLevel: number = 0;
  private components: LogicComponent[] = [];
  private connections: Connection[] = [];
  private connectionStart: Position | null = null;
  private gridSize: { width: number; height: number } = { width: 5, height: 5 };

  constructor() {
    this.loadLevel(0);
  }

  public loadLevel(levelIndex: number) {
    if (levelIndex < 0 || levelIndex >= LEVELS.length) return;
    this.currentLevel = levelIndex;
    const level = LEVELS[levelIndex];
    this.components = level.components.map(c => ({ ...c }));
    this.connections = [];
    this.connectionStart = null;
    this.gridSize = { ...level.gridSize };
  }

  public getLevel(): Level {
    return LEVELS[this.currentLevel];
  }

  public getCurrentLevelIndex(): number {
    return this.currentLevel;
  }

  public getTotalLevels(): number {
    return LEVELS.length;
  }

  public getComponents(): LogicComponent[] {
    return this.components;
  }

  public getConnections(): Connection[] {
    return this.connections;
  }

  public getConnectionStart(): Position | null {
    return this.connectionStart;
  }

  public getGridSize(): { width: number; height: number } {
    return this.gridSize;
  }

  public handleComponentClick(x: number, y: number): boolean {
    const component = this.components.find(c => c.position.x === x && c.position.y === y);
    
    if (component) {
      if (component.type === 'input') {
        component.value = !component.value;
        this.updateLogic();
        return true;
      } else if (!this.connectionStart) {
        this.connectionStart = { x, y };
        return true;
      } else {
        if (this.connectionStart.x !== x || this.connectionStart.y !== y) {
          this.addConnection(this.connectionStart, { x, y });
        }
        this.connectionStart = null;
        return true;
      }
    }

    if (!this.connectionStart) {
      this.connectionStart = { x, y };
      return true;
    }

    if (this.isAdjacent(this.connectionStart, { x, y })) {
      this.addConnection(this.connectionStart, { x, y });
    }
    this.connectionStart = null;
    return true;
  }

  private isAdjacent(p1: Position, p2: Position): boolean {
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);
    return (dx <= 1 && dy <= 1) && (dx + dy > 0);
  }

  private addConnection(from: Position, to: Position) {
    const exists = this.connections.some(c => 
      (c.from.x === from.x && c.from.y === from.y && c.to.x === to.x && c.to.y === to.y) ||
      (c.from.x === to.x && c.from.y === to.y && c.to.x === from.x && c.to.y === from.y)
    );
    
    if (!exists) {
      this.connections.push({
        id: `conn-${Date.now()}-${Math.random()}`,
        from: { ...from },
        to: { ...to }
      });
      this.updateLogic();
    }
  }

  public removeConnectionAt(x: number, y: number) {
    this.connections = this.connections.filter(c => 
      !((c.from.x === x && c.from.y === y) || (c.to.x === x && c.to.y === y))
    );
    this.updateLogic();
  }

  private updateLogic() {
    this.components.forEach(c => {
      if (c.type !== 'input') {
        c.value = false;
      }
    });

    let changed = true;
    let iterations = 0;
    const maxIterations = 10;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      for (const component of this.components) {
        if (component.type === 'input') continue;

        const inputs = this.getInputsFor(component.position);
        
        let newValue = false;
        
        switch (component.type) {
          case 'AND':
            newValue = inputs.length >= 2 && inputs.every(v => v);
            break;
          case 'OR':
            newValue = inputs.some(v => v);
            break;
          case 'NOT':
            newValue = inputs.length >= 1 && !inputs[0];
            break;
          case 'XOR':
            newValue = inputs.filter(v => v).length === 1;
            break;
          case 'NAND':
            newValue = !(inputs.length >= 2 && inputs.every(v => v));
            break;
          case 'NOR':
            newValue = !inputs.some(v => v);
            break;
          case 'output':
            newValue = inputs.length >= 1 && inputs[0];
            break;
        }

        if (newValue !== component.value) {
          component.value = newValue;
          changed = true;
        }
      }
    }
  }

  private getInputsFor(position: Position): boolean[] {
    const inputs: boolean[] = [];
    
    for (const conn of this.connections) {
      if (conn.to.x === position.x && conn.to.y === position.y) {
        const sourceComponent = this.components.find(c => c.position.x === conn.from.x && c.position.y === conn.from.y);
        if (sourceComponent) {
          inputs.push(sourceComponent.value);
        }
      }
    }
    
    return inputs;
  }

  public isCompleted(): boolean {
    const level = LEVELS[this.currentLevel];
    const output = this.components.find(c => c.type === 'output');
    return output?.value === level.targetOutput;
  }

  public clearConnections() {
    this.connections = [];
    this.connectionStart = null;
    this.updateLogic();
  }

  public reset() {
    this.loadLevel(this.currentLevel);
  }
}
