import { GAMES_LIST, type GameMeta } from '../utils/constants';

export interface Collection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  gameIds: string[];
}

export const COLLECTIONS: Collection[] = [
  {
    id: 'quick',
    title: '3 分钟一局',
    subtitle: '开会前的空档，也能完整打完一局',
    icon: '⏱️',
    color: '#06b6d4',
    gameIds: ['2048', 'snake', 'flappybird', 'doodlejump', '2048battle', 'zuma', 'breakout', 'bounce'],
  },
  {
    id: 'onekey',
    title: '单键操作',
    subtitle: '一只手就能玩，另一只手继续敲键盘',
    icon: '⌨️',
    color: '#f59e0b',
    gameIds: ['flappybird', 'doodlejump', 'dancingline', 'cutrope', 'onestroke', 'bounce', 'breakout', 'pinball'],
  },
  {
    id: 'duo',
    title: '双人同屏',
    subtitle: '同事路过？拉他坐下直接开一局',
    icon: '👥',
    color: '#ec4899',
    gameIds: ['cooprun', 'snakeduo', 'tetrisbattle', 'pinballduo', 'coopsokoban', 'coopmaze', 'coopbreakout', 'coopfruitcatch', 'coopbounce'],
  },
  {
    id: 'mouseonly',
    title: '纯鼠标',
    subtitle: '不用记快捷键，点就完事了',
    icon: '🖱️',
    color: '#22c55e',
    gameIds: ['bubblepop', 'angrybirds', 'billiards', 'bowling', 'linklink', 'petlink', 'starmatch', 'cutrope'],
  },
  {
    id: 'relax',
    title: '无脑解压',
    subtitle: '不需要思考，只要看着数字和颜色变多',
    icon: '🧘',
    color: '#a855f7',
    gameIds: ['clickermoney', 'candycrush', 'bejeweled', 'bubblepop', 'coloringbook', 'kidscoloring', 'whitenoise', 'idlespace'],
  },
  {
    id: 'board',
    title: '棋逢对手',
    subtitle: '和 AI 或身边人来一场正经对弈',
    icon: '♟️',
    color: '#3b82f6',
    gameIds: ['chess', 'chinesechessai', 'gobangai', 'reversi', 'checkers', 'backgammon', 'dotsandboxes', 'intchess'],
  },
  {
    id: 'music',
    title: '音乐疗愈',
    subtitle: '跟着节拍放空，顺便活动一下手指',
    icon: '🎵',
    color: '#6366f1',
    gameIds: ['pianotiles', 'beatmaster', 'guesssong', 'karaoke', 'synthplay', 'drumsimulator', 'mixmaster', 'musicplayer', 'beatmetronome', 'whitenoise'],
  },
  {
    id: 'brain',
    title: '脑力热身',
    subtitle: '三分钟唤醒大脑，再回去写代码',
    icon: '🧠',
    color: '#f97316',
    gameIds: ['sudoku', 'minesweeper', 'codebreak', 'mathkids', 'crossword', 'anagram', 'onestroke', 'patternslide'],
  },
];

const GAME_INDEX = new Map(GAMES_LIST.map(game => [game.id, game]));

export function getCollectionGames(collection: Collection): GameMeta[] {
  return collection.gameIds
    .map(id => GAME_INDEX.get(id))
    .filter((game): game is GameMeta => Boolean(game));
}
