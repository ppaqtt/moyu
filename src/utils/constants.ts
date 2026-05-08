export const GAME_IDS = {
  GAME_2048: '2048',
  TETRIS: 'tetris',
  SNAKE: 'snake',
  BOUNCE: 'bounce',
  FUSION_2048: 'fusion2048',
  MINESWEEPER: 'minesweeper',
  BEJEWEL: 'bejeweled',
  SUDOKU: 'sudoku',
  SUBWAY: 'subway',
  FIRE_ICE: 'fireice',
  GOLD_MINER: 'goldminer',
  PVZ: 'pvz',
  SKETCHOUT: 'sketchup'
} as const;

export type GameId = typeof GAME_IDS[keyof typeof GAME_IDS];

export const GAME_2048_CONSTANTS = {
  GRID_SIZE: 4,
  TILE_SIZE: 100,
  CANVAS_SIZE: 400,
  GAP: 12
};

export const TETRIS_CONSTANTS = {
  BOARD_WIDTH: 10,
  BOARD_HEIGHT: 20,
  CELL_SIZE: 30,
  INITIAL_SPEED: 1000,
  SPEED_INCREMENT: 0.9,
  LINES_PER_LEVEL: 10
};

export const SNAKE_CONSTANTS = {
  GRID_SIZE: 20,
  CANVAS_SIZE: 400,
  INITIAL_SPEED: 150,
  SPEED_INCREMENT: 10
};

export const BOUNCE_CONSTANTS = {
  CANVAS_WIDTH: 480,
  CANVAS_HEIGHT: 640,
  PADDLE_WIDTH: 100,
  PADDLE_HEIGHT: 15,
  BALL_RADIUS: 10,
  BALL_SPEED: 5,
  BRICK_ROWS: 5,
  BRICK_COLS: 8,
  BRICK_HEIGHT: 25,
  BRICK_GAP: 4
};

export const FUSION_CONSTANTS = {
  GRID_SIZE: 4,
  TILE_SIZE: 100,
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 500,
  GAP: 12,
  DROP_INTERVAL: 3000,
  SPECIAL_INTERVAL: 20000
};

export const STORAGE_KEYS = {
  GAME_2048: 'mouyu_game_2048',
  TETRIS: 'mouyu_tetris',
  SNAKE: 'mouyu_snake',
  BOUNCE: 'mouyu_bounce',
  FUSION_2048: 'mouyu_fusion',
  MINESWEEPER: 'mouyu_minesweeper',
  BEJEWEL: 'mouyu_bejeweled',
  SUDOKU: 'mouyu_sudoku',
  SUBWAY: 'mouyu_subway',
  FIRE_ICE: 'mouyu_fireice',
  GOLD_MINER: 'mouyu_goldminer',
  PVZ: 'mouyu_pvz',
  SKETCHOUT: 'mouyu_sketchup'
} as const;

export const TILE_COLORS: Record<number, string> = {
  2: '#eee4da',
  4: '#ede0c8',
  8: '#f2b179',
  16: '#f59563',
  32: '#f67c5f',
  64: '#f65e3b',
  128: '#edcf72',
  256: '#edcc61',
  512: '#edc850',
  1024: '#edc53f',
  2048: '#edc22e',
  4096: '#3c3a32',
  8192: '#3c3a32'
};

export const NEON_COLORS = {
  primary: '#1a1a2e',
  neonPink: '#ff2e63',
  neonBlue: '#08d9d6',
  gold: '#eaeaea',
  darkPurple: '#16213e',
  white: '#ffffff'
};

export interface GameInfo {
  id: GameId;
  name: string;
  description: string;
  icon: string;
  controls: string[];
}

export const GAMES_LIST: GameInfo[] = [
  {
    id: GAME_IDS.GAME_2048,
    name: '2048',
    description: '滑动合并数字，达到2048！',
    icon: '⬡',
    controls: ['方向键滑动', 'WASD键']
  },
  {
    id: GAME_IDS.TETRIS,
    name: '俄罗斯方块',
    description: '经典童年回忆，消行得分！',
    icon: '▣',
    controls: ['← → 移动', '↑ 旋转', '↓ 加速下落', '空格 立即下落']
  },
  {
    id: GAME_IDS.SNAKE,
    name: '贪吃蛇',
    description: '控制蛇吃掉食物，越长越好！',
    icon: '🐍',
    controls: ['方向键控制方向']
  },
  {
    id: GAME_IDS.BOUNCE,
    name: '弹跳球',
    description: '反弹球打碎砖块，闯过关卡！',
    icon: '●',
    controls: ['鼠标/触摸 控制球拍']
  },
  {
    id: GAME_IDS.FUSION_2048,
    name: '2048融合',
    description: '融合俄罗斯方块与2048的创新玩法！',
    icon: '✨',
    controls: ['← → 移动', '↑ 旋转', '↓ 加速下落']
  },
  {
    id: GAME_IDS.MINESWEEPER,
    name: '扫雷',
    description: '经典扫雷，点击揭示方块找出所有地雷！',
    icon: '💣',
    controls: ['左键点击揭示', '右键标记地雷']
  },
  {
    id: GAME_IDS.BEJEWEL,
    name: '宝石迷阵',
    description: '交换宝石匹配消除，挑战高分！',
    icon: '💎',
    controls: ['点击选中', '点击相邻交换']
  },
  {
    id: GAME_IDS.SUDOKU,
    name: '数独',
    description: '经典数字谜题，填入1-9完成挑战！',
    icon: '🔢',
    controls: ['点击选择格子', '点击数字填入']
  },
  {
    id: GAME_IDS.SUBWAY,
    name: '地铁跑酷',
    description: '无限跑酷，躲避障碍收集金币！',
    icon: '🏃',
    controls: ['← → 换道', '↑ 跳', '↓ 滑']
  },
  {
    id: GAME_IDS.FIRE_ICE,
    name: '森林冰火人',
    description: '双人合作闯关，两种角色配合通关！',
    icon: '🔥',
    controls: ['火人: WASD', '冰人: 方向键']
  },
  {
    id: GAME_IDS.GOLD_MINER,
    name: '黄金矿工',
    description: '操控爪子挖掘金矿，积累财富！',
    icon: '⛏',
    controls: ['鼠标控制方向', '点击释放爪子']
  },
  {
    id: GAME_IDS.PVZ,
    name: '植物大战僵尸',
    description: '布置植物防线，抵御僵尸入侵！',
    icon: '🌻',
    controls: ['鼠标点击选择植物', '点击草坪种植']
  },
  {
    id: GAME_IDS.SKETCHOUT,
    name: '弹射对战',
    description: '物理弹射对战，与对手一决高下！',
    icon: '💥',
    controls: ['← → 调整角度', '空格 蓄力发射']
  }
];
