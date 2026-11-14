import { GAMES_LIST } from './constants';
import type { Game } from './constants';

export interface GameMeta {
  description: string;
  tags: string[];
  duration: number;
  players: 1 | 2;
  keyboard: boolean;
  silent: boolean;
}

export type EnrichedGame = Game & GameMeta;

interface CategoryMeta {
  intro: string;
  tags: string[];
  duration: number;
  players: 1 | 2;
  keyboard: boolean;
  silent: boolean;
}

const DEFAULT_META: CategoryMeta = {
  intro: '随时开一局，轻松摸鱼',
  tags: ['休闲'],
  duration: 5,
  players: 1,
  keyboard: false,
  silent: true,
};

/**
 * 分类级默认元数据。单个游戏在 GAMES_LIST 中写了同名字段时，优先使用游戏自身的值。
 */
const CATEGORY_META: Record<string, CategoryMeta> = {
  puzzle: { intro: '烧脑益智，越玩越上头', tags: ['益智', '动脑'], duration: 6, players: 1, keyboard: true, silent: true },
  arcade: { intro: '经典街机手感，随时开一局', tags: ['街机', '快节奏'], duration: 5, players: 1, keyboard: true, silent: true },
  'co-op': { intro: '同屏协作或对战，拉上同事一起', tags: ['双人', '同屏', '聚会'], duration: 5, players: 2, keyboard: true, silent: true },
  shooting: { intro: '弹幕与走位，肾上腺素拉满', tags: ['射击', '快节奏'], duration: 6, players: 1, keyboard: true, silent: true },
  strategy: { intro: '经营布局，慢慢滚雪球', tags: ['经营', '耐玩'], duration: 12, players: 1, keyboard: false, silent: true },
  reaction: { intro: '考验手速与眼力，一局就上瘾', tags: ['反应', '限时'], duration: 3, players: 1, keyboard: false, silent: true },
  board: { intro: '经典棋牌对弈，随时来一盘', tags: ['棋牌', '回合制'], duration: 10, players: 2, keyboard: false, silent: true },
  tower: { intro: '布防升级，挡住一波波进攻', tags: ['塔防', '策略'], duration: 10, players: 1, keyboard: false, silent: true },
  rhythm: { intro: '踩准节拍，跟着音乐敲起来', tags: ['音乐', '节奏'], duration: 4, players: 1, keyboard: true, silent: false },
  match3: { intro: '三消连锁，停不下来的爽感', tags: ['消除', '轻松'], duration: 5, players: 1, keyboard: false, silent: true },
  fighting: { intro: '拳拳到肉的对战快感', tags: ['格斗', '双人'], duration: 4, players: 2, keyboard: true, silent: true },
  puzzle2: { intro: '滑块与机关，动脑解谜', tags: ['解谜', '动脑'], duration: 6, players: 1, keyboard: true, silent: true },
  '养成': { intro: '养成你的小世界，看它慢慢长大', tags: ['养成', '放置'], duration: 10, players: 1, keyboard: false, silent: true },
  physics: { intro: '真实物理反馈，随手玩出花样', tags: ['物理', '休闲'], duration: 5, players: 1, keyboard: false, silent: true },
  card: { intro: '牌桌博弈，考验算牌与心理', tags: ['卡牌', '双人'], duration: 8, players: 2, keyboard: false, silent: true },
  word: { intro: '文字游戏，边玩边涨知识', tags: ['文字', '动脑'], duration: 5, players: 1, keyboard: true, silent: true },
  sports: { intro: '轻量运动竞技，随时来一场', tags: ['运动', '双人'], duration: 5, players: 2, keyboard: true, silent: true },
  io: { intro: '多人同场竞技，越玩越大', tags: ['竞技', '快节奏'], duration: 5, players: 1, keyboard: false, silent: true },
  idle: { intro: '放置挂机，后台也能滚收益', tags: ['放置', '挂机'], duration: 10, players: 1, keyboard: false, silent: true },
  creative: { intro: '自由创作，摸鱼也能出作品', tags: ['创作', '放松'], duration: 10, players: 1, keyboard: false, silent: true },
  survival: { intro: '资源与生存，撑得越久越强', tags: ['生存', '挑战'], duration: 8, players: 1, keyboard: true, silent: true },
  parkour: { intro: '跑酷闯关，手速与节奏并重', tags: ['跑酷', '快节奏'], duration: 4, players: 1, keyboard: true, silent: true },
  adventure: { intro: '剧情与探索，一步步推进', tags: ['剧情', '探索'], duration: 10, players: 1, keyboard: false, silent: true },
  social: { intro: '社交互动，适合和同事一起玩', tags: ['社交', '聚会'], duration: 8, players: 2, keyboard: false, silent: true },
  ai: { intro: '与 AI 过招，挑战你的判断', tags: ['AI', '对战'], duration: 5, players: 1, keyboard: false, silent: true },
  music: { intro: '音乐创作与模拟，随手玩出旋律', tags: ['音乐', '创作'], duration: 10, players: 1, keyboard: false, silent: false },
  maze: { intro: '迷宫探索，找路开锁', tags: ['迷宫', '探索'], duration: 5, players: 1, keyboard: true, silent: true },
  visual: { intro: '视觉错觉与观察力挑战', tags: ['视觉', '观察'], duration: 3, players: 1, keyboard: false, silent: true },
  coding: { intro: '编程思维小练习', tags: ['编程', '学习'], duration: 10, players: 1, keyboard: true, silent: true },
  retro: { intro: '复古像素，找回街机年代', tags: ['怀旧', '像素'], duration: 5, players: 1, keyboard: true, silent: true },
  math: { intro: '数学挑战，锻炼心算', tags: ['数学', '动脑'], duration: 5, players: 1, keyboard: true, silent: true },
  language: { intro: '语言学习，边玩边记', tags: ['语言', '学习'], duration: 5, players: 1, keyboard: false, silent: false },
  holiday: { intro: '节日主题，应景小游戏', tags: ['节日', '休闲'], duration: 5, players: 1, keyboard: false, silent: true },
  simulation: { intro: '模拟经营，体验另一种职业', tags: ['模拟', '经营'], duration: 12, players: 1, keyboard: false, silent: true },
  multiplayer: { intro: '多人对战，人多更好玩', tags: ['多人', '对战'], duration: 5, players: 2, keyboard: true, silent: true },
  escape: { intro: '密室解谜，找线索逃出去', tags: ['密室', '解谜'], duration: 10, players: 1, keyboard: true, silent: true },
  story: { intro: '互动剧情，由你选择走向', tags: ['剧情', '选择'], duration: 12, players: 1, keyboard: false, silent: true },
  '3d': { intro: '3D 视觉与空间挑战', tags: ['3D', '视觉'], duration: 5, players: 1, keyboard: false, silent: true },
  party: { intro: '派对游戏，适合多人起哄', tags: ['派对', '多人'], duration: 8, players: 2, keyboard: true, silent: true },
  pixel: { intro: '像素风格，复古又轻快', tags: ['像素', '复古'], duration: 5, players: 1, keyboard: true, silent: true },
  aibattle: { intro: 'AI 协作或对抗，策略拉满', tags: ['AI', '策略'], duration: 8, players: 1, keyboard: false, silent: true },
  tech: { intro: '科技主题，探索未来玩法', tags: ['科技', '探索'], duration: 8, players: 1, keyboard: false, silent: true },
  life: { intro: '生活实用小工具与放松', tags: ['实用', '放松'], duration: 8, players: 1, keyboard: false, silent: true },
  education: { intro: '科普教育，寓教于乐', tags: ['教育', '学习'], duration: 5, players: 1, keyboard: false, silent: true },
  career: { intro: '职业体验，换种身份摸鱼', tags: ['职业', '模拟'], duration: 10, players: 1, keyboard: false, silent: true },
  animal: { intro: '动物题材，治愈又轻松', tags: ['动物', '治愈'], duration: 8, players: 1, keyboard: false, silent: true },
  cooking: { intro: '料理制作，按步骤出餐', tags: ['料理', '休闲'], duration: 5, players: 1, keyboard: false, silent: true },
  driving: { intro: '驾驶载具，注意别翻车', tags: ['驾驶', '快节奏'], duration: 5, players: 1, keyboard: true, silent: true },
  craft: { intro: '手工制作，慢慢打磨作品', tags: ['手工', '放松'], duration: 10, players: 1, keyboard: false, silent: true },
};

export function getGameMeta(game: Game): GameMeta {
  const base = CATEGORY_META[game.category] ?? DEFAULT_META;
  return {
    description: game.description ?? `${game.name}：${base.intro}`,
    tags: game.tags ?? base.tags,
    duration: game.duration ?? base.duration,
    players: game.players ?? base.players,
    keyboard: game.keyboard ?? base.keyboard,
    silent: game.silent ?? base.silent,
  };
}

export function enrichGame(game: Game): EnrichedGame {
  return { ...game, ...getGameMeta(game) };
}

export function getEnrichedGames(): EnrichedGame[] {
  return GAMES_LIST.map(enrichGame);
}

export interface CollectionDef {
  id: string;
  title: string;
  icon: string;
  description: string;
  accent: string;
  match: (game: EnrichedGame) => boolean;
}

/**
 * 摸鱼场景合集：由元数据自动筛选，不需要单独维护游戏名单。
 */
export const COLLECTIONS: CollectionDef[] = [
  {
    id: 'duo',
    title: '双人同屏',
    icon: '👥',
    description: '一台电脑两个人，输赢都开心',
    accent: '#ec4899',
    match: game => game.players === 2,
  },
  {
    id: 'quick',
    title: '5 分钟一局',
    icon: '⏱️',
    description: '会议间隙也能来一局',
    accent: '#22c55e',
    match: game => game.duration <= 5,
  },
  {
    id: 'keyboard',
    title: '纯键盘',
    icon: '⌨️',
    description: '不用鼠标，装成在打字',
    accent: '#06b6d4',
    match: game => game.keyboard,
  },
  {
    id: 'silent',
    title: '静音可玩',
    icon: '🔇',
    description: '不开声音也不影响体验',
    accent: '#a855f7',
    match: game => game.silent,
  },
];
