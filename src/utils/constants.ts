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
  SKETCHOUT: 'sketchup',
  FLAPPY_BIRD: 'flappybird',
  PACMAN: 'pacman',
  STICKMAN_HOOK: 'stickmanhook',
  HEXGL: 'hexgl',
  TEMPLE_RUN: 'templerun',
  ONEVONE: 'onevone',
  CROSSCODE: 'crosscode',
  // 经典益智类
  ZUMA: 'zuma',
  LINKLINK: 'linklink',
  SOKOBAN: 'sokoban',
  FINDDIFF: 'finddiff',
  ONESTROKE: 'onestroke',
  // 休闲竞技类
  PINBALL: 'pinball',
  BOWLING: 'bowling',
  BILLIARDS: 'billiards',
  RINGTOSS: 'ringtoss',
  ENHANCED_BREAKOUT: 'enhancedbreakout',
  // 跑酷躲避类
  SKIING: 'skiing',
  DANCING_LINE: 'dancingline',
  SUBWAY2: 'subway2',
  CLIFF_RUNNER: 'cliffrunner',
  SPEED_ESCAPE: 'speedescape',
  // 双人合作类
  COOP_RUN: 'cooprun',
  TETRIS_BATTLE: 'tetrisbattle',
  SNAKE_DUO: 'snakeduo',
  BUNNY_HUNTER: 'bunnyhunter',
  PINBALL_DUO: 'pinballduo'
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

export const SNAKE_DUO_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  GRID_SIZE: 20,
  INITIAL_SPEED: 120,
  SPEED_INCREMENT: 5,
  FOOD_SCORE: 10,
  TIME_BONUS: 1
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

// 祖玛游戏常量
export const ZUMA_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  BALL_RADIUS: 15,
  CURVE_RADIUS: 250,
  PATH_SPEED: 2,
  SHOOT_SPEED: 8,
  COLORS: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe']
};

// 连连看游戏常量
export const LINKLINK_CONSTANTS = {
  GRID_COLS: 10,
  GRID_ROWS: 8,
  TILE_WIDTH: 50,
  TILE_HEIGHT: 50,
  ICON_TYPES: 20
};

// 推箱子游戏常量
export const SOKOBAN_CONSTANTS = {
  GRID_SIZE: 10,
  CELL_SIZE: 50,
  LEVELS: 5
};

// 找不同游戏常量
export const FINDDIFF_CONSTANTS = {
  GRID_COLS: 4,
  GRID_ROWS: 3,
  DIFF_COUNT: 5,
  TIME_LIMIT: 120
};

// 一笔画游戏常量
export const ONESTROKE_CONSTANTS = {
  NODE_COUNT: 9,
  GRID_SIZE: 450,
  CELL_SIZE: 50
};

// 弹珠台游戏常量
export const PINBALL_CONSTANTS = {
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 700,
  BALL_RADIUS: 8,
  FLIPPER_LENGTH: 60,
  FLIPPER_WIDTH: 12,
  GRAVITY: 0.15,
  BUMPER_RADIUS: 20
};

// 保龄球游戏常量
export const BOWLING_CONSTANTS = {
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 400,
  LANE_WIDTH: 200,
  BALL_RADIUS: 12,
  PIN_RADIUS: 8,
  TOTAL_FRAMES: 10
};

// 台球游戏常量
export const BILLIARDS_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 450,
  BALL_RADIUS: 10,
  POCKET_RADIUS: 18,
  FRICTION: 0.985,
  MIN_SPEED: 0.1
};

// 套圈圈游戏常量
export const RINGTOSS_CONSTANTS = {
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 500,
  RING_RADIUS: 25,
  POLE_RADIUS: 8,
  TOTAL_RINGS: 10,
  THROW_POWER: 15
};

// 滑雪大冒险游戏常量
export const SKIING_CONSTANTS = {
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 700,
  PLAYER_SIZE: 30,
  OBSTACLE_SIZE: 25,
  INITIAL_SPEED: 5,
  SPEED_INCREMENT: 0.2
};

// 跳舞的线游戏常量
export const DANCING_LINE_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 500,
  LINE_WIDTH: 8,
  NODE_RADIUS: 15,
  SEGMENT_LENGTH: 40
};

// 地铁跑酷2游戏常量
export const SUBWAY2_CONSTANTS = {
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 800,
  LANE_COUNT: 3,
  PLAYER_WIDTH: 40,
  PLAYER_HEIGHT: 60,
  INITIAL_SPEED: 6,
  SPEED_INCREMENT: 0.3
};

// 悬崖跑酷游戏常量
export const CLIFF_RUNNER_CONSTANTS = {
  CANVAS_WIDTH: 700,
  CANVAS_HEIGHT: 500,
  PLAYER_SIZE: 35,
  GROUND_HEIGHT: 50,
  GRAVITY: 0.8,
  JUMP_FORCE: -15
};

// 极速逃亡游戏常量
export const SPEED_ESCAPE_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  PLAYER_SIZE: 30,
  CAR_WIDTH: 40,
  CAR_HEIGHT: 70,
  INITIAL_SPEED: 5,
  LANE_COUNT: 4
};

// 双人合作跑酷游戏常量
export const COOP_RUN_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  PLAYER_WIDTH: 40,
  PLAYER_HEIGHT: 60,
  LANE_COUNT: 3,
  GROUND_HEIGHT: 80,
  GRAVITY: 0.6,
  JUMP_FORCE: -14,
  INITIAL_SPEED: 5,
  SPEED_INCREMENT: 0.001,
  MAX_SPEED: 12,
  OBSTACLE_SPAWN_INTERVAL: 60,
  COLLECTIBLE_SPAWN_INTERVAL: 120,
  REVIVE_RANGE: 80,
  REVIVE_TIME: 30,
  DOUBLE_SCORE_RANGE: 100
};

// 兔子猎人游戏常量
export const BUNNY_HUNTER_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  BUNNY_SIZE: 50,
  BULLET_SPEED: 12,
  BUNNY_SPAWN_INTERVAL: 1500,
  GAME_DURATION: 60,
  SCORE_HIT: 10,
  SCORE_MISS: -5,
  COOP_BONUS: 2,
  TIME_BONUS_MULTIPLIER: 1
};

// 打砖块增强版游戏常量
export const ENHANCED_BREAKOUT_CONSTANTS = {
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 700,
  PADDLE_WIDTH: 100,
  PADDLE_HEIGHT: 15,
  BALL_RADIUS: 8,
  BALL_SPEED: 5,
  BRICK_ROWS: 8,
  BRICK_COLS: 10,
  BRICK_HEIGHT: 25,
  BRICK_GAP: 3,
  POWERUP_CHANCE: 0.15
};

// 双人弹珠台游戏常量
export const PINBALL_DUO_CONSTANTS = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 700,
  BALL_RADIUS: 12,
  PADDLE_WIDTH: 100,
  PADDLE_HEIGHT: 18,
  GRAVITY: 0.25,
  FRICTION: 0.995,
  BUMPER_RADIUS: 25,
  OBSTACLE_WIDTH: 120,
  OBSTACLE_HEIGHT: 20,
  SCORE_BUMPER_HIT: 50,
  SCORE_PADDLE_HIT: 10,
  SCORE_COMBO_MULTIPLIER: 1.5,
  COMBO_DECAY_TIME: 2000,
  TIME_SCORE_INTERVAL: 1000,
  TIME_SCORE_AMOUNT: 5,
  PADDLE_SPEED: 0.15,
  BALL_MAX_SPEED: 18
};

export const STORAGE_KEYS = {
  GAME_2048: 'mouyu_game_2048',
  TETRIS: 'mouyu_tetris',
  SNAKE: 'mouyu_snake',
  SNAKE_DUO: 'mouyu_snakeduo',
  BOUNCE: 'mouyu_bounce',
  FUSION_2048: 'mouyu_fusion',
  MINESWEEPER: 'mouyu_minesweeper',
  BEJEWEL: 'mouyu_bejeweled',
  SUDOKU: 'mouyu_sudoku',
  SUBWAY: 'mouyu_subway',
  FIRE_ICE: 'mouyu_fireice',
  GOLD_MINER: 'mouyu_goldminer',
  PVZ: 'mouyu_pvz',
  SKETCHOUT: 'mouyu_sketchup',
  FLAPPY_BIRD: 'mouyu_flappybird',
  PACMAN: 'mouyu_pacman',
  STICKMAN_HOOK: 'mouyu_stickmanhook',
  HEXGL: 'mouyu_hexgl',
  TEMPLE_RUN: 'mouyu_templerun',
  ONEVONE: 'mouyu_onevone',
  CROSSCODE: 'mouyu_crosscode',
  // 经典益智类
  ZUMA: 'mouyu_zuma',
  LINKLINK: 'mouyu_linklink',
  SOKOBAN: 'mouyu_sokoban',
  FINDDIFF: 'mouyu_finddiff',
  ONESTROKE: 'mouyu_onestroke',
  // 休闲竞技类
  PINBALL: 'mouyu_pinball',
  BOWLING: 'mouyu_bowling',
  BILLIARDS: 'mouyu_billiards',
  RINGTOSS: 'mouyu_ringtoss',
  ENHANCED_BREAKOUT: 'mouyu_enhancedbreakout',
  // 跑酷躲避类
  SKIING: 'mouyu_skiing',
  DANCING_LINE: 'mouyu_dancingline',
  SUBWAY2: 'mouyu_subway2',
  CLIFF_RUNNER: 'mouyu_cliffrunner',
  SPEED_ESCAPE: 'mouyu_speedescape',
  // 双人合作类
  COOP_RUN: 'mouyu_cooprun',
  TETRIS_BATTLE: 'mouyu_tetrisbattle',
  BUNNY_HUNTER: 'mouyu_bunnyhunter',
  PINBALL_DUO: 'mouyu_pinballduo'
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
  primary: '#0f0f1a',
  secondary: '#1a1a2e',
  accent: '#6c5ce7',
  neonPink: '#ff6b9d',
  neonBlue: '#00d2ff',
  neonCyan: '#00d2ff',
  neonPurple: '#a855f7',
  neonGreen: '#39ff14',
  gold: '#ffd700',
  white: '#ffffff',
  darkPurple: '#1a1a2e',
  cardBg: 'rgba(26, 26, 46, 0.8)',
  glassBg: 'rgba(255, 255, 255, 0.05)'
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
  },
  {
    id: GAME_IDS.FLAPPY_BIRD,
    name: 'Flappy Bird',
    description: '点击让小鸟飞翔，穿过管道得分！',
    icon: '🐦',
    controls: ['点击或空格 飞行']
  },
  {
    id: GAME_IDS.PACMAN,
    name: '吃豆人',
    description: '经典吃豆人，吃光豆子躲避幽灵！',
    icon: '🟡',
    controls: ['方向键或WASD移动']
  },
  {
    id: GAME_IDS.STICKMAN_HOOK,
    name: 'Stickman Hook',
    description: '抓住钩子摇摆前进，挑战最远距离！',
    icon: '🦸',
    controls: ['空格/W按住抓住', '松手释放']
  },
  {
    id: GAME_IDS.HEXGL,
    name: 'HexGL赛车',
    description: 'WebGL极速赛车，躲避障碍完成圈数！',
    icon: '🏎',
    controls: ['← → 移动', '↑ 加速', '↓ 减速']
  },
  {
    id: GAME_IDS.TEMPLE_RUN,
    name: '神庙逃亡',
    description: '在古老神庙中跑酷躲避障碍！',
    icon: '🏛',
    controls: ['← → 换道', '↑ 跳', '↓ 滑']
  },
  {
    id: GAME_IDS.ONEVONE,
    name: '1v1对战',
    description: '双人同屏射击对战，谁是最后的赢家！',
    icon: '🎯',
    controls: ['P1: WASD移动 F射击', 'P2: 方向键移动 空格射击']
  },
  {
    id: GAME_IDS.CROSSCODE,
    name: 'CrossCode',
    description: '复古像素风动作RPG，升级打怪！',
    icon: '⚔',
    controls: ['← → 移动', '空格 跳跃', 'J 攻击']
  },
  // 经典益智类
  {
    id: GAME_IDS.ZUMA,
    name: '祖玛',
    description: '画球射击，匹配消除三个以上同色球！',
    icon: '🔮',
    controls: ['鼠标瞄准', '点击发射']
  },
  {
    id: GAME_IDS.LINKLINK,
    name: '连连看',
    description: '找到相同的图案，用线连接消除！',
    icon: '🔗',
    controls: ['点击选中', '点击相邻连接']
  },
  {
    id: GAME_IDS.SOKOBAN,
    name: '推箱子',
    description: '推动箱子到目标位置，完成关卡！',
    icon: '📦',
    controls: ['方向键移动']
  },
  {
    id: GAME_IDS.FINDDIFF,
    name: '找不同',
    description: '找出两幅图中的不同之处！',
    icon: '🔍',
    controls: ['点击标记不同']
  },
  {
    id: GAME_IDS.ONESTROKE,
    name: '一笔画',
    description: '一笔画完所有线条，不重复不间断！',
    icon: '✏️',
    controls: ['点击节点', '依次连接不重复']
  },
  // 休闲竞技类
  {
    id: GAME_IDS.PINBALL,
    name: '弹珠台',
    description: '经典弹珠台，控制挡板弹射得分！',
    icon: '🎱',
    controls: ['← → 控制挡板', '空格 发射弹珠']
  },
  {
    id: GAME_IDS.BOWLING,
    name: '保龄球',
    description: '瞄准投球，全中Strike！',
    icon: '🎳',
    controls: ['鼠标调整方向', '点击蓄力投球']
  },
  {
    id: GAME_IDS.BILLIARDS,
    name: '台球',
    description: '经典8球台球，精准击球入袋！',
    icon: '🎱',
    controls: ['鼠标瞄准', '点击蓄力击球']
  },
  {
    id: GAME_IDS.RINGTOSS,
    name: '套圈圈',
    description: '瞄准目标套圈，挑战最高分！',
    icon: '⭕',
    controls: ['鼠标调整角度力度', '点击投掷']
  },
  {
    id: GAME_IDS.ENHANCED_BREAKOUT,
    name: '打砖块增强版',
    description: '带道具和技能的增强版打砖块！',
    icon: '🧱',
    controls: ['鼠标控制球拍', '空格发射球']
  },
  // 跑酷躲避类
  {
    id: GAME_IDS.SKIING,
    name: '滑雪大冒险',
    description: '极速下坡滑雪，躲避障碍物！',
    icon: '⛷',
    controls: ['← → 滑行', '↑ 跳', '↓ 加速']
  },
  {
    id: GAME_IDS.DANCING_LINE,
    name: '跳舞的线',
    description: '跟随音乐节奏，让线条穿过障碍！',
    icon: '💃',
    controls: ['← → 移动', '空格 跳转']
  },
  {
    id: GAME_IDS.SUBWAY2,
    name: '地铁跑酷2',
    description: '新版地铁跑酷，收集金币躲避火车！',
    icon: '🚇',
    controls: ['← → 换道', '↑ 跳', '↓ 滑']
  },
  {
    id: GAME_IDS.CLIFF_RUNNER,
    name: '悬崖跑酷',
    description: '悬崖边奔跑跳跃，惊险刺激！',
    icon: '🏔',
    controls: ['空格 跳跃', '↓ 下滑']
  },
  {
    id: GAME_IDS.SPEED_ESCAPE,
    name: '极速逃亡',
    description: '疯狂驾驶，躲避追车极限逃亡！',
    icon: '🚗',
    controls: ['← → 换道', '↑ 加速', '↓ 刹车']
  },
  {
    id: GAME_IDS.COOP_RUN,
    name: '双人跑酷',
    description: '双人合作跑酷，配合躲避障碍！',
    icon: '🤝',
    controls: ['P1: WASD', 'P2: 方向键', 'E 复活队友']
  },
  {
    id: GAME_IDS.TETRIS_BATTLE,
    name: '俄罗斯方块对战',
    description: '双人俄罗斯方块对战，消行给对方加惩罚！',
    icon: '🧱',
    controls: ['P1: A/D/W/S', 'P2: 方向键']
  },
  {
    id: GAME_IDS.SNAKE_DUO,
    name: '双人贪吃蛇',
    description: '双人贪吃蛇对战，最后存活获胜！',
    icon: '🐍',
    controls: ['P1: WASD', 'P2: 方向键']
  },
  {
    id: GAME_IDS.BUNNY_HUNTER,
    name: '兔子猎人',
    description: '双人合作射击从天而降的兔子！',
    icon: '🐰',
    controls: ['P1: A/D/W', 'P2: 方向键']
  },
  {
    id: GAME_IDS.PINBALL_DUO,
    name: '双人弹珠台',
    description: '双人合作弹珠台，配合让弹珠弹得更高！',
    icon: '🎱',
    controls: ['P1: Q/E 挡板', 'P2: O/P 挡板', '空格 开始']
  }
];
