export const GAME_IDS = {
  GAME_2048: '2048',
  TETRIS: 'tetris',
  SNAKE: 'snake',
  BOUNCE: 'bounce',
  FUSION_2048: 'fusion2048'
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
  FUSION_2048: 'mouyu_fusion'
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
  }
];
