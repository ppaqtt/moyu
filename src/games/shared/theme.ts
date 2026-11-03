import { GAMES_LIST } from '../../utils/constants';
import type { GameMeta, Genre } from './types';

const PALETTES: Record<string, [string, string]> = {
  puzzle: ['#22D3EE', '#6366F1'],
  puzzle2: ['#22D3EE', '#6366F1'],
  arcade: ['#22C55E', '#06B6D4'],
  'co-op': ['#F472B6', '#8B5CF6'],
  shooting: ['#EF4444', '#F59E0B'],
  strategy: ['#F59E0B', '#F97316'],
  tower: ['#8B5CF6', '#6366F1'],
  idle: ['#10B981', '#22C55E'],
  board: ['#3B82F6', '#8B5CF6'],
  card: ['#06B6D4', '#2563EB'],
  fighting: ['#F97316', '#EF4444'],
  io: ['#84CC16', '#22C55E'],
  rhythm: ['#EC4899', '#8B5CF6'],
  music: ['#6366F1', '#EC4899'],
  reaction: ['#F59E0B', '#F97316'],
  math: ['#06B6D4', '#3B82F6'],
  creative: ['#EC4899', '#F472B6'],
  match3: ['#A855F7', '#EC4899'],
  physics: ['#22C55E', '#0EA5E9'],
  '养成': ['#F472B6', '#FB923C'],
  sports: ['#3B82F6', '#22C55E'],
  survival: ['#F97316', '#EF4444'],
  parkour: ['#06B6D4', '#22D3EE'],
  word: ['#8B5CF6', '#6366F1'],
  adventure: ['#F59E0B', '#EAB308'],
  ai: ['#06B6D4', '#8B5CF6'],
  coding: ['#22C55E', '#10B981'],
  maze: ['#F97316', '#F59E0B'],
  visual: ['#EC4899', '#A855F7'],
  retro: ['#F59E0B', '#EF4444'],
  language: ['#3B82F6', '#06B6D4'],
  holiday: ['#EF4444', '#F59E0B'],
  simulation: ['#84CC16', '#22C55E'],
  multiplayer: ['#A855F7', '#6366F1'],
  escape: ['#F97316', '#DC2626'],
  story: ['#EC4899', '#8B5CF6'],
  party: ['#F59E0B', '#EC4899'],
  pixel: ['#22C55E', '#3B82F6'],
  aibattle: ['#06B6D4', '#6366F1'],
  tech: ['#6366F1', '#06B6D4'],
  life: ['#10B981', '#14B8A6'],
  social: ['#EC4899', '#F472B6'],
  education: ['#3B82F6', '#6366F1'],
  career: ['#F97316', '#F59E0B'],
  animal: ['#F472B6', '#FB923C'],
  cooking: ['#EF4444', '#F59E0B'],
  driving: ['#22C55E', '#3B82F6'],
  craft: ['#EC4899', '#A855F7'],
};

export function resolveMeta(props: Partial<GameMeta> & { gameId?: string; gameName?: string }): GameMeta {
  const id = props.gameId || props.id || 'unknown';
  const listed = GAMES_LIST.find(g => g.id === id) as
    | { id: string; name: string; category: string; icon: string; difficulty: string }
    | undefined;
  const category = props.category || listed?.category || 'arcade';
  const palette = PALETTES[category] || ['#22D3EE', '#8B5CF6'];
  return {
    id,
    name: props.gameName || props.name || listed?.name || id,
    icon: props.icon || listed?.icon || '🎮',
    category,
    difficulty: props.difficulty || listed?.difficulty || 'medium',
    primary: props.primary || palette[0],
    secondary: props.secondary || palette[1],
  };
}

const has = (text: string, words: string[]) => words.some(w => text.includes(w));

export function resolveGenre(meta: GameMeta): Genre {
  const key = `${meta.id} ${meta.name}`.toLowerCase();
  const category = meta.category;

  // 先按游戏名中的强特征匹配
  if (has(key, ['2048'])) return 'g2048';
  if (has(key, ['flappy', 'flapbird', 'doodlejump', 'bird'])) return 'flappy';
  if (has(key, ['snake', 'slither', 'agar', 'diep', 'mope', 'ballio', 'swordio', 'territoryio', '蛇', '贪吃蛇'])) return 'snake';
  if (has(key, ['breakout', 'brick', 'pong', 'badminton', 'tennis', '乒乓球', '打砖块', '弹球'])) return 'breakout';
  if (has(key, ['towerdefense', 'tower3d', 'bloonstd', 'kingdomrush', 'catapultdefense', 'elementaltd', 'laserdefense', 'iceagedefense', 'flaktower', '塔防', '王国保卫战'])) return 'tower';
  if (has(key, ['chess', 'gomoku', 'gobang', 'checkers', 'tictactoe', 'reversi', 'othello', 'ludo', 'backgammon', 'mahjong', 'boardgame', 'militarychess', 'animalchess', 'hopchess', 'dotsandboxes', '五子棋', '象棋', '棋'])) return 'board';
  if (has(key, ['solitaire', 'blackjack', 'baccarat', 'poker', 'bridge', 'hearts', 'spades', 'uno', 'doudizhu', 'texas', '扑克', '牌', '纸牌'])) return 'card';
  if (has(key, ['maze', 'escape', 'room', 'dungeon', 'prison', 'mirror', 'egyptian', 'library', 'abandonedhospital', '迷宫', '密室', '逃脱'])) return 'maze';
  if (has(key, ['quiz', 'trivia', 'knowledge', 'braintest', 'iq', '问答', '知识', '答题'])) return 'quiz';
  if (has(key, ['match3', 'candy', 'jewel', 'gem', 'marble', 'fruitmatch', 'bejeweled', 'blast', 'crush', 'linklink', 'zuma', '消消', '消除', '连连看', '祖玛', '宝石'])) return 'match3';
  if (has(key, ['memory', 'concentration', 'pair', '记忆', '翻牌'])) return 'memory';
  if (has(key, ['hangman', 'anagram', 'scramble', 'spelling', 'vocabulary', 'crossword', 'wordcross', 'wordpuzzle', 'idiom', '填字', '单词', '成语', '词汇'])) return 'word';
  if (has(key, ['grammar', 'reading', 'writing', 'listening', 'speaking', 'translate', 'typing', '语言', '语法', '阅读', '听力', '翻译', '打字'])) return 'quiz';
  if (has(key, ['math', 'equation', 'fraction', 'geometry', 'logicmath', 'speedmath', 'timestable', 'calculator', 'numbermatch', '数学', '计算', '几何', '分数'])) return 'quiz';
  if (has(key, ['finddiff', 'hiddenpicture', 'illusion', 'stereogram', 'optical', 'motionaftereffect', 'ambiguous', 'colorblind', '找茬', '视觉错觉', '立体图'])) return 'memory';
  if (has(key, ['draw', 'paint', 'art', 'coloring', 'emoji', 'meme', 'gif', 'wordart', 'sandart', 'hatching', '绘画', '画', '涂色', '艺术', '手工', '折纸', '陶艺', '刺绣', '编织'])) return 'drawing';
  if (has(key, ['music', 'rhythm', 'beat', 'piano', 'drum', 'guitar', 'synth', 'dj', 'dance', 'vocoder', 'melody', 'chord', 'sequencer', '音乐', '节奏', '钢琴', '鼓', '吉他'])) return 'rhythm';
  if (has(key, ['tycoon', 'idle', 'clicker', 'farm', 'city', 'hotel', 'restaurant', 'shop', 'bank', 'company', 'factory', 'hospital', 'bakery', 'coffee', 'juice', 'soap', 'candle', 'pottery', 'knitting', 'leather', 'woodworking', 'origami', 'jewelry', 'cooking', 'sushi', 'burger', 'cake', 'pizza', 'noodle', 'icecream', 'sandwich', 'soup', 'chef', 'beekeeper', 'care', 'growth', 'vet', 'teacher', 'doctor', 'police', 'firefighter', 'pilot', 'train', 'bus', 'taxi', 'truck', 'boat', 'delivery', 'simulator', 'manager', 'builder', 'architect', 'house', 'zoo', 'safari', 'aquarium', 'ocean', 'fishtank', 'garden', '经营', '模拟', '大亨', '农场', '餐厅', '商店', '医院', '厨师'])) return 'tycoon';
  if (has(key, ['story', 'detective', 'mystery', 'romance', 'vampire', 'cyberpunk', 'scifi', 'fantasy', 'adventure', 'choice', 'interactive', 'negotiation', 'spy', 'werewolf', 'truthdare', 'neverhave', 'wouldyourather', 'partychat', 'rpg', '剧情', '侦探', '悬疑', '冒险', '角色扮演'])) return 'story';
  if (has(key, ['fight', 'combat', 'boxing', 'wrestle', 'karate', 'kungfu', 'sumo', 'tekken', 'streetfighter', 'mortal', 'brawl', 'onevone', '格斗', '拳', '对战'])) return 'fighter';
  if (has(key, ['racing', 'race', 'drift', 'kart', 'motor', 'bike', 'car', 'truck', 'bus', 'train', 'boat', 'flying', 'rollercoaster', '赛车', '跑车', '驾驶'])) return 'racing';
  if (has(key, ['fish', 'miner', 'goldminer', 'archery', 'ringtoss', 'basketball', 'soccer', 'golf', 'bowling', 'billiards', 'pool', 'snooker', 'darts', 'baseball', 'horse', 'skating', 'skiing', 'surfing', '钓鱼', '矿工', '射箭', '套圈', '篮球', '足球', '高尔夫', '保龄球', '台球', '滑雪'])) return 'timing';
  if (has(key, ['survival', 'arctic', 'desert', 'jungle', 'raft', 'starve', 'zombie', 'limbo', 'horror', 'safari', 'wild', '生存', '荒岛', '末日'])) return 'dodge';
  if (has(key, ['platformer', 'pixeladventure', 'pixelrpg', 'dragonadventure', 'forest', 'cave', 'rpg', '像素冒险'])) return 'platformer';
  if (has(key, ['reaction', 'reflex', 'whack', 'mole', 'quick', 'color', 'flash', 'aim', 'tap', 'fruitninja', 'rockpaperscissors', 'foodfight', '反应', '打地鼠', '水果忍者'])) return 'reaction';
  if (has(key, ['bomberman', 'frogger', 'vrgame', '炸弹人'])) return 'dodge';
  if (has(key, ['pinball', '弹珠'])) return 'breakout';
  if (has(key, ['tetris', '俄罗斯方块'])) return 'puzzle';
  if (has(key, ['helicopter', 'duckhunt', '直升机', '打鸭子'])) return 'shooter';
  if (has(key, ['meditation', '冥想'])) return 'timing';
  if (has(key, ['puzzle', 'slide', 'klotski', 'lights', 'connect', 'pipe', 'tangram', 'sudoku', 'sokoban', 'unblock', 'numberpuzzle', 'circuit', 'onestroke', 'jigsaw', '拼图', '华容道', '推箱子', '数独', '七巧板', '一笔画', '接水管'])) return 'puzzle';
  if (has(key, ['runner', 'parkour', 'run', 'subway', 'temple', 'cliff', 'speedescape', '跑酷', '奔跑', '地铁'])) return 'runner';
  if (has(key, ['shooter', 'shot', 'invasion', 'space', 'alien', 'galaga', 'war', 'aircraft', 'tank', 'helicopter', 'apache', 'dogfight', 'starfighter', 'thunder', 'raiden', 'squadron', 'missile', '射击', '战机', '坦克', '太空'])) return 'shooter';

  // 再按分类兜底
  switch (category) {
    case 'puzzle':
    case 'puzzle2':
      return 'puzzle';
    case 'match3':
      return 'match3';
    case 'word':
      return 'word';
    case 'language':
    case 'math':
    case 'education':
    case 'tech':
    case 'coding':
      return 'quiz';
    case 'ai':
    case 'aibattle':
    case 'board':
      return 'board';
    case 'card':
      return 'card';
    case 'reaction':
      return 'reaction';
    case 'rhythm':
    case 'music':
      return 'rhythm';
    case 'creative':
    case 'craft':
      return 'drawing';
    case 'maze':
    case 'escape':
      return 'maze';
    case 'shooting':
      return 'shooter';
    case 'tower':
      return 'tower';
    case 'strategy':
    case 'simulation':
    case 'idle':
    case '养成':
    case 'career':
    case 'animal':
    case 'cooking':
    case 'life':
      return 'tycoon';
    case 'survival':
      return 'dodge';
    case 'parkour':
      return 'runner';
    case 'adventure':
    case 'story':
    case 'social':
    case 'party':
      return 'story';
    case 'fighting':
      return 'fighter';
    case 'driving':
      return 'racing';
    case 'sports':
      return 'timing';
    case 'io':
      return 'snake';
    case 'visual':
      return 'memory';
    case 'pixel':
      return 'platformer';
    case 'physics':
      return 'breakout';
    case 'retro':
      return 'breakout';
    case 'arcade':
      return 'runner';
    case 'co-op':
    case 'multiplayer':
      return 'board';
    case 'holiday':
      return 'reaction';
    default:
      return 'quiz';
  }
}
