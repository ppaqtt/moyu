export interface Position {
  x: number;
  y: number;
}

export type ComponentType = 'battery' | 'bulb' | 'wire' | 'switch' | 'resistor';

export interface Component {
  id: string;
  type: ComponentType;
  position: Position;
  rotation: number;
  powered: boolean;
  active: boolean;
}

export interface Wire {
  id: string;
  from: Position;
  to: Position;
}

export interface Level {
  id: number;
  name: string;
  gridSize: { width: number; height: number };
  components: Component[];
  lesson: string;
}

const LEVELS: Level[] = [
  {
    id: 1,
    name: '简单电路',
    gridSize: { width: 5, height: 5 },
    components: [
      { id: 'b1', type: 'battery', position: { x: 0, y: 2 }, rotation: 0, powered: true, active: true },
      { id: 'bulb1', type: 'bulb', position: { x: 4, y: 2 }, rotation: 0, powered: false, active: false }
    ],
    lesson: '用导线连接电池和灯泡，让灯泡亮起来！'
  },
  {
    id: 2,
    name: '开关控制',
    gridSize: { width: 6, height: 5 },
    components: [
      { id: 'b1', type: 'battery', position: { x: 0, y: 2 }, rotation: 0, powered: true, active: true },
      { id: 's1', type: 'switch', position: { x: 2, y: 2 }, rotation: 0, powered: false, active: false },
      { id: 'bulb1', type: 'bulb', position: { x: 5, y: 2 }, rotation: 0, powered: false, active: false }
    ],
    lesson: '连接电路后，点击开关可以控制灯泡！'
  },
  {
    id: 3,
    name: '并联电路',
    gridSize: { width: 7, height: 6 },
    components: [
      { id: 'b1', type: 'battery', position: { x: 0, y: 3 }, rotation: 0, powered: true, active: true },
      { id: 'bulb1', type: 'bulb', position: { x: 6, y: 1 }, rotation: 0, powered: false, active: false },
      { id: 'bulb2', type: 'bulb', position: { x: 6, y: 5 }, rotation: 0, powered: false, active: false }
    ],
    lesson: '创建并联电路，让两个灯泡都能亮起来！'
  },
  {
    id: 4,
    name: '电阻挑战',
    gridSize: { width: 7, height: 5 },
    components: [
      { id: 'b1', type: 'battery', position: { x: 0, y: 2 }, rotation: 0, powered: true, active: true },
      { id: 'r1', type: 'resistor', position: { x: 3, y: 2 }, rotation: 0, powered: false, active: false },
      { id: 'bulb1', type: 'bulb', position: { x: 6, y: 2 }, rotation: 0, powered: false, active: false }
    ],
    lesson: '电阻可以保护电路，连接它吧！'
  },
  {
    id: 5,
    name: '复杂电路',
    gridSize: { width: 8, height: 7 },
    components: [
      { id: 'b1', type: 'battery', position: { x: 0, y: 3 }, rotation: 0, powered: true, active: true },
      { id: 's1', type: 'switch', position: { x: 3, y: 1 }, rotation: 0, powered: false, active: false },
      { id: 's2', type: 'switch', position: { x: 3, y: 5 }, rotation: 0, powered: false, active: false },
      { id: 'bulb1', type: 'bulb', position: { x: 7, y: 1 }, rotation: 0, powered: false, active: false },
      { id: 'bulb2', type: 'bulb', position: { x: 7, y: 5 }, rotation: 0, powered: false, active: false }
    ],
    lesson: '两个开关控制两个灯泡，试试不同的组合！'
  }
];

export class CircuitConnectEngine {
  private currentLevel: number = 0;
  private components: Component[] = [];
  private wires: Wire[] = [];
  private wireStart: Position | null = null;
  private gridSize: { width: number; height: number } = { width: 5, height: 5 };

  constructor() {
    this.loadLevel(0);
  }

  public loadLevel(levelIndex: number) {
    if (levelIndex < 0 || levelIndex >= LEVELS.length) return;
    this.currentLevel = levelIndex;
    const level = LEVELS[levelIndex];
    this.components = level.components.map(c => ({ ...c }));
    this.wires = [];
    this.wireStart = null;
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

  public getComponents(): Component[] {
    return this.components;
  }

  public getWires(): Wire[] {
    return this.wires;
  }

  public getWireStart(): Position | null {
    return this.wireStart;
  }

  public getGridSize(): { width: number; height: number } {
    return this.gridSize;
  }

  public handleCellClick(x: number, y: number): boolean {
    const clickedComponent = this.components.find(c => c.position.x === x && c.position.y === y);
    
    if (clickedComponent) {
      if (clickedComponent.type === 'switch') {
        this.toggleSwitch(clickedComponent.id);
        return true;
      } else if (!this.wireStart) {
        this.wireStart = { x, y };
        return true;
      } else {
        if (this.wireStart.x !== x || this.wireStart.y !== y) {
          this.addWire(this.wireStart, { x, y });
        }
        this.wireStart = null;
        return true;
      }
    }

    if (!this.wireStart) {
      this.wireStart = { x, y };
      return true;
    }

    if (this.isAdjacent(this.wireStart, { x, y })) {
      this.addWire(this.wireStart, { x, y });
    }
    this.wireStart = null;
    return true;
  }

  private isAdjacent(p1: Position, p2: Position): boolean {
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  private addWire(from: Position, to: Position) {
    const exists = this.wires.some(w => 
      (w.from.x === from.x && w.from.y === from.y && w.to.x === to.x && w.to.y === to.y) ||
      (w.from.x === to.x && w.from.y === to.y && w.to.x === from.x && w.to.y === from.y)
    );
    
    if (!exists) {
      this.wires.push({
        id: `wire-${Date.now()}-${Math.random()}`,
        from: { ...from },
        to: { ...to }
      });
      this.updateCircuit();
    }
  }

  public removeWireAt(x: number, y: number) {
    this.wires = this.wires.filter(w => 
      !(w.from.x === x && w.from.y === y) && 
      !(w.to.x === x && w.to.y === y)
    );
    this.updateCircuit();
  }

  public toggleSwitch(componentId: string) {
    const component = this.components.find(c => c.id === componentId);
    if (component && component.type === 'switch') {
      component.active = !component.active;
      this.updateCircuit();
    }
  }

  private updateCircuit() {
    this.components.forEach(c => {
      if (c.type !== 'battery') {
        c.powered = false;
      }
    });

    const batteries = this.components.filter(c => c.type === 'battery' && c.active);
    if (batteries.length === 0) return;

    const visited = new Set<string>();
    const queue: Position[] = [];

    batteries.forEach(b => {
      queue.push({ ...b.position });
      visited.add(`${b.position.x},${b.position.y}`);
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.x},${current.y}`;

      const component = this.components.find(c => c.position.x === current.x && c.position.y === current.y);
      
      if (component && component.type !== 'battery') {
        if (component.type === 'switch' && !component.active) {
          continue;
        }
        component.powered = true;
      }

      const connectedWires = this.wires.filter(w => 
        (w.from.x === current.x && w.from.y === current.y) ||
        (w.to.x === current.x && w.to.y === current.y)
      );

      connectedWires.forEach(w => {
        const next = w.from.x === current.x && w.from.y === current.y ? w.to : w.from;
        const nextKey = `${next.x},${next.y}`;
        
        if (!visited.has(nextKey)) {
          visited.add(nextKey);
          queue.push(next);
        }
      });

      const adjacentComponents = this.components.filter(c => 
        this.isAdjacent(c.position, current) && c.id !== component?.id
      );

      adjacentComponents.forEach(adj => {
        const adjKey = `${adj.position.x},${adj.position.y}`;
        if (!visited.has(adjKey)) {
          visited.add(adjKey);
          queue.push(adj.position);
        }
      });
    }
  }

  public isCompleted(): boolean {
    const bulbs = this.components.filter(c => c.type === 'bulb');
    return bulbs.length > 0 && bulbs.every(b => b.powered);
  }

  public clearWires() {
    this.wires = [];
    this.wireStart = null;
    this.updateCircuit();
  }

  public reset() {
    this.loadLevel(this.currentLevel);
  }
}
