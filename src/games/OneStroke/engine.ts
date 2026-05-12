// 一笔画游戏引擎
import { ONESTROKE_CONSTANTS } from '../../utils/constants';

interface Node {
  id: number;
  x: number;
  y: number;
  connections: number[];
  visited: boolean;
}

interface Edge {
  from: number;
  to: number;
  drawn: boolean;
}

interface GameState {
  nodes: Node[];
  edges: Edge[];
  currentNode: number | null;
  visitedEdges: number[];
  moves: number;
  totalEdges: number;
  completed: boolean;
  level: number;
}

// 关卡设计：预定义节点和边的关系
const LEVELS = [
  {
    name: '入门',
    nodes: [
      { id: 0, x: 0.2, y: 0.3, connections: [1, 2] },
      { id: 1, x: 0.5, y: 0.2, connections: [0, 3, 4] },
      { id: 2, x: 0.8, y: 0.3, connections: [0, 3] },
      { id: 3, x: 0.35, y: 0.6, connections: [1, 2, 4] },
      { id: 4, x: 0.65, y: 0.7, connections: [1, 3, 5] },
      { id: 5, x: 0.5, y: 0.9, connections: [4] }
    ]
  },
  {
    name: '简单',
    nodes: [
      { id: 0, x: 0.5, y: 0.15, connections: [1, 2, 3] },
      { id: 1, x: 0.2, y: 0.4, connections: [0, 4] },
      { id: 2, x: 0.8, y: 0.4, connections: [0, 5] },
      { id: 3, x: 0.5, y: 0.5, connections: [0, 4, 5, 6] },
      { id: 4, x: 0.2, y: 0.75, connections: [1, 3, 7] },
      { id: 5, x: 0.8, y: 0.75, connections: [2, 3, 7] },
      { id: 6, x: 0.5, y: 0.9, connections: [3] },
      { id: 7, x: 0.5, y: 0.65, connections: [4, 5] }
    ]
  },
  {
    name: '中等',
    nodes: [
      { id: 0, x: 0.15, y: 0.2, connections: [1, 3] },
      { id: 1, x: 0.5, y: 0.1, connections: [0, 2, 4] },
      { id: 2, x: 0.85, y: 0.2, connections: [1, 5] },
      { id: 3, x: 0.15, y: 0.5, connections: [0, 4, 6] },
      { id: 4, x: 0.5, y: 0.4, connections: [1, 3, 5, 7] },
      { id: 5, x: 0.85, y: 0.5, connections: [2, 4, 8] },
      { id: 6, x: 0.25, y: 0.85, connections: [3, 7] },
      { id: 7, x: 0.5, y: 0.7, connections: [4, 6, 8] },
      { id: 8, x: 0.75, y: 0.85, connections: [5, 7] }
    ]
  },
  {
    name: '困难',
    nodes: [
      { id: 0, x: 0.5, y: 0.1, connections: [1, 4, 5] },
      { id: 1, x: 0.2, y: 0.25, connections: [0, 2, 6] },
      { id: 2, x: 0.8, y: 0.25, connections: [0, 3, 7] },
      { id: 3, x: 0.15, y: 0.5, connections: [1, 4, 8] },
      { id: 4, x: 0.5, y: 0.45, connections: [0, 3, 5, 8] },
      { id: 5, x: 0.85, y: 0.5, connections: [0, 2, 8] },
      { id: 6, x: 0.25, y: 0.8, connections: [1, 7, 9] },
      { id: 7, x: 0.75, y: 0.8, connections: [2, 6, 9] },
      { id: 8, x: 0.5, y: 0.7, connections: [3, 4, 5, 9] },
      { id: 9, x: 0.5, y: 0.95, connections: [6, 7, 8] }
    ]
  },
  {
    name: '专家',
    nodes: [
      { id: 0, x: 0.15, y: 0.15, connections: [1, 3, 5] },
      { id: 1, x: 0.5, y: 0.08, connections: [0, 2, 4] },
      { id: 2, x: 0.85, y: 0.15, connections: [1, 5, 7] },
      { id: 3, x: 0.08, y: 0.5, connections: [0, 4, 8] },
      { id: 4, x: 0.5, y: 0.42, connections: [1, 3, 5, 9] },
      { id: 5, x: 0.92, y: 0.5, connections: [0, 2, 4, 10] },
      { id: 6, x: 0.15, y: 0.85, connections: [7, 8, 11] },
      { id: 7, x: 0.5, y: 0.78, connections: [2, 6, 8, 12] },
      { id: 8, x: 0.25, y: 0.58, connections: [3, 4, 6, 9] },
      { id: 9, x: 0.75, y: 0.58, connections: [4, 5, 8, 10] },
      { id: 10, x: 0.85, y: 0.85, connections: [5, 7, 12] },
      { id: 11, x: 0.35, y: 0.95, connections: [6, 12] },
      { id: 12, x: 0.5, y: 0.92, connections: [7, 10, 11] }
    ]
  }
];

export class OneStrokeEngine {
  private state: GameState;
  private levelData: typeof LEVELS[0];

  constructor() {
    this.levelData = LEVELS[0];
    this.state = this.createLevel(1);
  }

  private createLevel(level: number): GameState {
    const levelIndex = (level - 1) % LEVELS.length;
    this.levelData = LEVELS[levelIndex];

    const nodes: Node[] = this.levelData.nodes.map(n => ({
      ...n,
      visited: false
    }));

    const edges: Edge[] = [];
    const nodeMap = new Map<string, number>();

    nodes.forEach((node, idx) => {
      node.connections.forEach(connId => {
        const key = [Math.min(idx, connId), Math.max(idx, connId)].join('-');
        if (!nodeMap.has(key)) {
          nodeMap.set(key, edges.length);
          edges.push({ from: idx, to: connId, drawn: false });
        }
      });
    });

    const totalEdges = edges.length;

    return {
      nodes,
      edges,
      currentNode: null,
      visitedEdges: [],
      moves: 0,
      totalEdges,
      completed: false,
      level
    };
  }

  public reset(): void {
    this.state = this.createLevel(this.state.level);
  }

  public nextLevel(): boolean {
    if (this.state.level < LEVELS.length) {
      this.state = this.createLevel(this.state.level + 1);
      return true;
    }
    return false;
  }

  public previousLevel(): boolean {
    if (this.state.level > 1) {
      this.state = this.createLevel(this.state.level - 1);
      return true;
    }
    return false;
  }

  public goToLevel(level: number): boolean {
    if (level >= 1 && level <= LEVELS.length) {
      this.state = this.createLevel(level);
      return true;
    }
    return false;
  }

  public selectNode(nodeId: number): { success: boolean; message: string; completed?: boolean } {
    if (this.state.completed) {
      return { success: false, message: '关卡已完成' };
    }

    const node = this.state.nodes[nodeId];

    if (this.state.currentNode === null) {
      // 第一次选择
      node.visited = true;
      this.state.currentNode = nodeId;
      this.state.moves = 1;

      const remainingEdges = this.state.totalEdges - this.state.visitedEdges.length;
      if (remainingEdges === 0) {
        this.state.completed = true;
        return { success: true, message: '🎉 恭喜通关！', completed: true };
      }

      return { success: true, message: `从节点 ${nodeId} 开始` };
    }

    // 检查是否连接
    if (!node.connections.includes(this.state.currentNode)) {
      return { success: false, message: '这两个节点不相连' };
    }

    // 找到边
    const edgeIndex = this.state.edges.findIndex(
      e => (e.from === this.state.currentNode && e.to === nodeId) ||
           (e.from === nodeId && e.to === this.state.currentNode)
    );

    if (edgeIndex === -1) {
      return { success: false, message: '找不到边' };
    }

    if (this.state.edges[edgeIndex].drawn) {
      return { success: false, message: '这条边已经画过了' };
    }

    // 画边
    this.state.edges[edgeIndex].drawn = true;
    this.state.visitedEdges.push(edgeIndex);
    node.visited = true;
    this.state.currentNode = nodeId;
    this.state.moves++;

    // 检查是否完成
    if (this.state.visitedEdges.length === this.state.totalEdges) {
      this.state.completed = true;
      return { success: true, message: '🎉 恭喜通关！', completed: true };
    }

    return { success: true, message: `已连接 ${this.state.moves - 1} 条边，还剩 ${this.state.totalEdges - this.state.visitedEdges.length} 条` };
  }

  public undo(): { success: boolean; message: string } {
    if (this.state.currentNode === null || this.state.moves <= 1) {
      return { success: false, message: '无法撤销' };
    }

    // 找到最后画的边
    const lastEdgeIndex = this.state.visitedEdges.pop();
    if (lastEdgeIndex !== undefined) {
      this.state.edges[lastEdgeIndex].drawn = false;
    }

    // 找到上一个节点
    const lastEdge = this.state.edges[lastEdgeIndex !== undefined ? lastEdgeIndex : 0];
    const prevNodeId = lastEdge.from === this.state.currentNode ? lastEdge.to : lastEdge.from;

    this.state.nodes[this.state.currentNode!].visited = false;
    this.state.currentNode = prevNodeId;
    this.state.moves--;

    return { success: true, message: `撤销到节点 ${prevNodeId}` };
  }

  public getNodes(): Node[] {
    return this.state.nodes;
  }

  public getEdges(): Edge[] {
    return this.state.edges;
  }

  public getCurrentNode(): number | null {
    return this.state.currentNode;
  }

  public getMoves(): number {
    return this.state.moves;
  }

  public getTotalEdges(): number {
    return this.state.totalEdges;
  }

  public getVisitedEdges(): number {
    return this.state.visitedEdges.length;
  }

  public getLevel(): number {
    return this.state.level;
  }

  public getTotalLevels(): number {
    return LEVELS.length;
  }

  public getLevelName(): string {
    return this.levelData.name;
  }

  public isCompleted(): boolean {
    return this.state.completed;
  }
}
