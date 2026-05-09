// QuickMemory exports
export { QuickMemoryEngine } from './QuickMemory/engine';
export { default as QuickMemory } from './QuickMemory/QuickMemory';

// QuickReflex exports
export { QuickReflexEngine } from './QuickReflex/engine';
export { default as QuickReflex } from './QuickReflex/QuickReflex';

// ColorDetect exports
export { ColorDetectEngine } from './ColorDetect/engine';
export { default as ColorDetect } from './ColorDetect/ColorDetect';

// RhythmTap exports
export { RhythmTapEngine } from './RhythmTap/engine';
export { default as RhythmTap } from './RhythmTap/RhythmTap';

// TraceLight exports
export { TraceLightEngine } from './TraceLight/engine';
export { default as TraceLight } from './TraceLight/TraceLight';

// CandyCrush exports
export { CandyCrushEngine } from './CandyCrush/engine';
export { default as CandyCrush } from './CandyCrush/CandyCrush';

// GemBlast exports
export { GemBlastEngine } from './GemBlast/engine';
export { default as GemBlast } from './GemBlast/GemBlast';

// BubblePop exports
export { BubblePopEngine } from './BubblePop/engine';
export { default as BubblePop } from './BubblePop/BubblePop';

// CookieMatch exports
export { CookieMatchEngine } from './CookieMatch/engine';
export { default as CookieMatch } from './CookieMatch/CookieMatch';

// AnimalMatch exports
export { AnimalMatchEngine } from './AnimalMatch/engine';
export { default as AnimalMatch } from './AnimalMatch/AnimalMatch';

// PixelFighter exports
export { PixelFighterEngine } from './PixelFighter/engine';
export { default as PixelFighter } from './PixelFighter/PixelFighter';

// BrawlStars exports
export { BrawlStarsEngine } from './BrawlStars/engine';
export { default as BrawlStars } from './BrawlStars/BrawlStars';

// KarateChamp exports
export { KarateChampEngine } from './KarateChamp/engine';
export { default as KarateChamp } from './KarateChamp/KarateChamp';

// SamuraiSlash exports
export { SamuraiSlashEngine } from './SamuraiSlash/engine';
export { default as SamuraiSlash } from './SamuraiSlash/SamuraiSlash';

// WrestleMania exports
export { WrestleManiaEngine } from './WrestleMania/engine';
export { default as WrestleMania } from './WrestleMania/WrestleMania';

// Match3 Games list
export const MATCH3_GAMES = [
  {
    id: 'candycrush',
    name: 'CandyCrush',
    nameCn: '糖果传奇',
    component: 'CandyCrush',
    engine: 'CandyCrushEngine',
    path: './CandyCrush'
  },
  {
    id: 'gemblase',
    name: 'GemBlast',
    nameCn: '宝石爆破',
    component: 'GemBlast',
    engine: 'GemBlastEngine',
    path: './GemBlast'
  },
  {
    id: 'bubblepop',
    name: 'BubblePop',
    nameCn: '泡泡爆破',
    component: 'BubblePop',
    engine: 'BubblePopEngine',
    path: './BubblePop'
  },
  {
    id: 'cookiemeatch',
    name: 'CookieMatch',
    nameCn: '饼干消消乐',
    component: 'CookieMatch',
    engine: 'CookieMatchEngine',
    path: './CookieMatch'
  },
  {
    id: 'animalmeatch',
    name: 'AnimalMatch',
    nameCn: '动物消消乐',
    component: 'AnimalMatch',
    engine: 'AnimalMatchEngine',
    path: './AnimalMatch'
  }
] as const;

// CoopSokoban exports
export { CoopSokobanEngine } from './CoopSokoban/engine';
export { default as CoopSokoban } from './CoopSokoban/CoopSokoban';

// CoopMaze exports
export { CoopMazeEngine } from './CoopMaze/engine';
export { default as CoopMaze } from './CoopMaze/CoopMaze';

// CoopBreakout exports
export { CoopBreakoutEngine } from './CoopBreakout/engine';
export { default as CoopBreakout } from './CoopBreakout/CoopBreakout';

// CoopFruitCatch exports
export { CoopFruitCatchEngine } from './CoopFruitCatch/engine';
export { default as CoopFruitCatch } from './CoopFruitCatch/CoopFruitCatch';

// CoopBounce exports
export { CoopBounceEngine } from './CoopBounce/engine';
export { default as CoopBounce } from './CoopBounce/CoopBounce';

// Co-op Games list
export const COOP_GAMES = [
  {
    id: 'coopsokoban',
    name: 'CoopSokoban',
    nameCn: '双人华容道',
    component: 'CoopSokoban',
    engine: 'CoopSokobanEngine',
    path: './CoopSokoban'
  },
  {
    id: 'coopmaze',
    name: 'CoopMaze',
    nameCn: '双人迷宫',
    component: 'CoopMaze',
    engine: 'CoopMazeEngine',
    path: './CoopMaze'
  },
  {
    id: 'coopbreakout',
    name: 'CoopBreakout',
    nameCn: '双人打砖块',
    component: 'CoopBreakout',
    engine: 'CoopBreakoutEngine',
    path: './CoopBreakout'
  },
  {
    id: 'coopfruitcatch',
    name: 'CoopFruitCatch',
    nameCn: '双人接水果',
    component: 'CoopFruitCatch',
    engine: 'CoopFruitCatchEngine',
    path: './CoopFruitCatch'
  },
  {
    id: 'coopbounce',
    name: 'CoopBounce',
    nameCn: '双人弹球',
    component: 'CoopBounce',
    engine: 'CoopBounceEngine',
    path: './CoopBounce'
  }
] as const;

// Reaction Games list
export const REACTION_GAMES = [
  {
    id: 'fruitninja',
    name: 'FruitNinja',
    nameCn: '水果忍者',
    component: 'FruitNinja',
    engine: 'FruitNinjaEngine',
    path: './FruitNinja'
  },
  {
    id: 'whackamole',
    name: 'WhackAMole',
    nameCn: '打地鼠',
    component: 'WhackAMole',
    engine: 'WhackAMoleEngine',
    path: './WhackAMole'
  },
  {
    id: 'colormatch',
    name: 'ColorMatch',
    nameCn: '颜色匹配',
    component: 'ColorMatch',
    engine: 'ColorMatchEngine',
    path: './ColorMatch'
  },
  {
    id: 'braintest',
    name: 'BrainTest',
    nameCn: '脑力测试',
    component: 'BrainTest',
    engine: 'BrainTestEngine',
    path: './BrainTest'
  },
  {
    id: 'quickmemory',
    name: 'QuickMemory',
    nameCn: '快速记忆',
    component: 'QuickMemory',
    engine: 'QuickMemoryEngine',
    path: './QuickMemory'
  },
  {
    id: 'quickreflex',
    name: 'QuickReflex',
    nameCn: '瞬间反应',
    component: 'QuickReflex',
    engine: 'QuickReflexEngine',
    path: './QuickReflex'
  },
  {
    id: 'colordetect',
    name: 'ColorDetect',
    nameCn: '颜色识别',
    component: 'ColorDetect',
    engine: 'ColorDetectEngine',
    path: './ColorDetect'
  },
  {
    id: 'rhythmtap',
    name: 'RhythmTap',
    nameCn: '节奏点击',
    component: 'RhythmTap',
    engine: 'RhythmTapEngine',
    path: './RhythmTap'
  },
  {
    id: 'tracelight',
    name: 'TraceLight',
    nameCn: '追踪光点',
    component: 'TraceLight',
    engine: 'TraceLightEngine',
    path: './TraceLight'
  }
] as const;

// VirtualPet exports
export { VirtualPetEngine } from './VirtualPet/engine';
export { default as VirtualPet } from './VirtualPet/VirtualPet';

// FishTank exports
export { FishTankEngine } from './FishTank/engine';
export { default as FishTank } from './FishTank/FishTank';

// GardenGarden exports
export { GardenGardenEngine } from './GardenGarden/engine';
export { default as GardenGarden } from './GardenGarden/GardenGarden';

// CookieBakery exports
export { CookieBakeryEngine } from './CookieBakery/engine';
export { default as CookieBakery } from './CookieBakery/CookieBakery';

// PokeMon exports
export { PokeMonEngine } from './PokeMon/engine';
export { default as PokeMon } from './PokeMon/PokeMon';

// Simulation Games list
export const SIMULATION_GAMES = [
  {
    id: 'virtualpet',
    name: 'VirtualPet',
    nameCn: '虚拟宠物',
    component: 'VirtualPet',
    engine: 'VirtualPetEngine',
    path: './VirtualPet'
  },
  {
    id: 'fishtank',
    name: 'FishTank',
    nameCn: '养鱼大亨',
    component: 'FishTank',
    engine: 'FishTankEngine',
    path: './FishTank'
  },
  {
    id: 'gardengarden',
    name: 'GardenGarden',
    nameCn: '花园种花',
    component: 'GardenGarden',
    engine: 'GardenGardenEngine',
    path: './GardenGarden'
  },
  {
    id: 'cookiebakery',
    name: 'CookieBakery',
    nameCn: '饼干面包店',
    component: 'CookieBakery',
    engine: 'CookieBakeryEngine',
    path: './CookieBakery'
  },
  {
    id: 'pokemon',
    name: 'PokeMon',
    nameCn: '口袋妖怪',
    component: 'PokeMon',
    engine: 'PokeMonEngine',
    path: './PokeMon'
  }
] as const;

// Fighting Games list
export const FIGHTING_GAMES = [
  {
    id: 'pixelfighter',
    name: 'PixelFighter',
    nameCn: '像素格斗',
    component: 'PixelFighter',
    engine: 'PixelFighterEngine',
    path: './PixelFighter'
  },
  {
    id: 'brawlstars',
    name: 'BrawlStars',
    nameCn: '乱斗明星',
    component: 'BrawlStars',
    engine: 'BrawlStarsEngine',
    path: './BrawlStars'
  },
  {
    id: 'karatechamp',
    name: 'KarateChamp',
    nameCn: '空手道冠军',
    component: 'KarateChamp',
    engine: 'KarateChampEngine',
    path: './KarateChamp'
  },
  {
    id: 'samuraislash',
    name: 'SamuraiSlash',
    nameCn: '武士斩击',
    component: 'SamuraiSlash',
    engine: 'SamuraiSlashEngine',
    path: './SamuraiSlash'
  },
  {
    id: 'wrestlemania',
    name: 'WrestleMania',
    nameCn: '摔跤狂热',
    component: 'WrestleMania',
    engine: 'WrestleManiaEngine',
    path: './WrestleMania'
  }
] as const;

// HuarongDao exports
export { HuarongDaoEngine } from './HuarongDao/engine';
export { default as HuarongDao } from './HuarongDao/HuarongDao';

// NumberSlide exports
export { NumberSlideEngine } from './NumberSlide/engine';
export { default as NumberSlide } from './NumberSlide/NumberSlide';

// PipeConnect exports
export { PipeConnectEngine } from './PipeConnect/engine';
export { default as PipeConnect } from './PipeConnect/PipeConnect';

// MemoryMatch exports
export { MemoryMatchEngine } from './MemoryMatch/engine';
export { default as MemoryMatch } from './MemoryMatch/MemoryMatch';

// WordSearch exports
export { WordSearchEngine } from './WordSearch/engine';
export { default as WordSearch } from './WordSearch/WordSearch';

// Puzzle Games list
export const PUZZLE_GAMES = [
  {
    id: 'huarongdao',
    name: 'HuarongDao',
    nameCn: '华容道',
    component: 'HuarongDao',
    engine: 'HuarongDaoEngine',
    path: './HuarongDao'
  },
  {
    id: 'numberslide',
    name: 'NumberSlide',
    nameCn: '数字华容道',
    component: 'NumberSlide',
    engine: 'NumberSlideEngine',
    path: './NumberSlide'
  },
  {
    id: 'pipeconnect',
    name: 'PipeConnect',
    nameCn: '水管连接',
    component: 'PipeConnect',
    engine: 'PipeConnectEngine',
    path: './PipeConnect'
  },
  {
    id: 'memorymatch',
    name: 'MemoryMatch',
    nameCn: '记忆翻牌',
    component: 'MemoryMatch',
    engine: 'MemoryMatchEngine',
    path: './MemoryMatch'
  },
  {
    id: 'wordsearch',
    name: 'WordSearch',
    nameCn: '文字搜索',
    component: 'WordSearch',
    engine: 'WordSearchEngine',
    path: './WordSearch'
  }
] as const;

// AngryBirds exports
export { AngryBirdsEngine } from './AngryBirds/engine';
export { default as AngryBirds } from './AngryBirds/AngryBirds';

// DoodleJump exports
export { DoodleJumpEngine } from './DoodleJump/engine';
export { default as DoodleJump } from './DoodleJump/DoodleJump';

// BowlingMaster exports
export { BowlingMasterEngine } from './BowlingMaster/engine';
export { default as BowlingMaster } from './BowlingMaster/BowlingMaster';

// PinballPhysics exports
export { PinballPhysicsEngine } from './PinballPhysics/engine';
export { default as PinballPhysics } from './PinballPhysics/PinballPhysics';

// CutRope exports
export { CutRopeEngine } from './CutRope/engine';
export { default as CutRope } from './CutRope/CutRope';

// Physics Games list
export const PHYSICS_GAMES = [
  {
    id: 'angrybirds',
    name: 'AngryBirds',
    nameCn: '愤怒的小鸟',
    component: 'AngryBirds',
    engine: 'AngryBirdsEngine',
    path: './AngryBirds'
  },
  {
    id: 'doodlejump',
    name: 'DoodleJump',
    nameCn: '涂鸦跳跃',
    component: 'DoodleJump',
    engine: 'DoodleJumpEngine',
    path: './DoodleJump'
  },
  {
    id: 'bowlingmaster',
    name: 'BowlingMaster',
    nameCn: '保龄球大师',
    component: 'BowlingMaster',
    engine: 'BowlingMasterEngine',
    path: './BowlingMaster'
  },
  {
    id: 'pinballphysics',
    name: 'PinballPhysics',
    nameCn: '弹球物理',
    component: 'PinballPhysics',
    engine: 'PinballPhysicsEngine',
    path: './PinballPhysics'
  },
  {
    id: 'cutrope',
    name: 'CutRope',
    nameCn: '切割绳子',
    component: 'CutRope',
    engine: 'CutRopeEngine',
    path: './CutRope'
  }
] as const;

// DouDiZhu exports
export { DouDiZhuEngine } from './DouDiZhu/engine';
export { default as DouDiZhu } from './DouDiZhu/DouDiZhu';

// Mahjong exports
export { MahjongEngine } from './Mahjong/engine';
export { default as Mahjong } from './Mahjong/Mahjong';

// TexasPoker exports
export { TexasPokerEngine } from './TexasPoker/engine';
export { default as TexasPoker } from './TexasPoker/TexasPoker';

// Blackjack exports
export { BlackjackEngine } from './Blackjack/engine';
export { default as Blackjack } from './Blackjack/Blackjack';

// UnoCard exports
export { UnoEngine } from './UnoCard/engine';
export { default as UnoCard } from './UnoCard/UnoCard';

// Card Games list
export const CARD_GAMES = [
  {
    id: 'doudizhu',
    name: 'DouDiZhu',
    nameCn: '斗地主',
    component: 'DouDiZhu',
    engine: 'DouDiZhuEngine',
    path: './DouDiZhu'
  },
  {
    id: 'mahjong',
    name: 'Mahjong',
    nameCn: '国粹麻将',
    component: 'Mahjong',
    engine: 'MahjongEngine',
    path: './Mahjong'
  },
  {
    id: 'texaspoker',
    name: 'TexasPoker',
    nameCn: '德州扑克',
    component: 'TexasPoker',
    engine: 'TexasPokerEngine',
    path: './TexasPoker'
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    nameCn: '二十一点',
    component: 'Blackjack',
    engine: 'BlackjackEngine',
    path: './Blackjack'
  },
  {
    id: 'unocard',
    name: 'UnoCard',
    nameCn: 'UNO卡牌',
    component: 'UnoCard',
    engine: 'UnoEngine',
    path: './UnoCard'
  }
] as const;

// SpaceTrader exports
export { SpaceTraderEngine } from './SpaceTrader/engine';
export { default as SpaceTrader } from './SpaceTrader/SpaceTrader';

// RestaurantTycoon exports
export { RestaurantTycoonEngine } from './RestaurantTycoon/engine';
export { default as RestaurantTycoon } from './RestaurantTycoon/RestaurantTycoon';

// HotelEmpire exports
export { HotelEmpireEngine } from './HotelEmpire/engine';
export { default as HotelEmpire } from './HotelEmpire/HotelEmpire';

// OilTycoon exports
export { OilTycoonEngine } from './OilTycoon/engine';
export { default as OilTycoon } from './OilTycoon/OilTycoon';

// HospitalManage exports
export { HospitalManageEngine } from './HospitalManage/engine';
export { default as HospitalManage } from './HospitalManage/HospitalManage';

// Strategy Games list
export const STRATEGY_GAMES = [
  {
    id: 'monopoly',
    name: 'Monopoly',
    nameCn: '大富翁',
    component: 'Monopoly',
    engine: 'MonopolyEngine',
    path: './Monopoly'
  },
  {
    id: 'happyfarm',
    name: 'HappyFarm',
    nameCn: '开心农场',
    component: 'HappyFarm',
    engine: 'HappyFarmEngine',
    path: './HappyFarm'
  },
  {
    id: 'cookingmaster',
    name: 'CookingMaster',
    nameCn: '烹饪大师',
    component: 'CookingMaster',
    engine: 'CookingMasterEngine',
    path: './CookingMaster'
  },
  {
    id: 'shopmaster',
    name: 'ShopMaster',
    nameCn: '商店大师',
    component: 'ShopMaster',
    engine: 'ShopMasterEngine',
    path: './ShopMaster'
  },
  {
    id: 'spacetrader',
    name: 'SpaceTrader',
    nameCn: '星际贸易',
    component: 'SpaceTrader',
    engine: 'SpaceTraderEngine',
    path: './SpaceTrader'
  },
  {
    id: 'restauranttycoon',
    name: 'RestaurantTycoon',
    nameCn: '餐厅大亨',
    component: 'RestaurantTycoon',
    engine: 'RestaurantTycoonEngine',
    path: './RestaurantTycoon'
  },
  {
    id: 'hotelempire',
    name: 'HotelEmpire',
    nameCn: '酒店帝国',
    component: 'HotelEmpire',
    engine: 'HotelEmpireEngine',
    path: './HotelEmpire'
  },
  {
    id: 'oiltycoon',
    name: 'OilTycoon',
    nameCn: '油田大亨',
    component: 'OilTycoon',
    engine: 'OilTycoonEngine',
    path: './OilTycoon'
  },
  {
    id: 'hospitalmanage',
    name: 'HospitalManage',
    nameCn: '医院经营',
    component: 'HospitalManage',
    engine: 'HospitalManageEngine',
    path: './HospitalManage'
  }
] as const;

// HopChess exports
export { HopChessEngine } from './HopChess/engine';
export { default as HopChess } from './HopChess/HopChess';

// InternationalChess exports
export { IntChessEngine } from './InternationalChess/engine';
export { default as InternationalChess } from './InternationalChess/InternationalChess';

// MilitaryChess exports
export { MilitaryChessEngine } from './MilitaryChess/engine';
export { default as MilitaryChess } from './MilitaryChess/MilitaryChess';

// AnimalChess exports
export { AnimalChessEngine } from './AnimalChess/engine';
export { default as AnimalChess } from './AnimalChess/AnimalChess';

// NumberPuzzle exports
export { NumberPuzzleEngine } from './NumberPuzzle/engine';
export { default as NumberPuzzle } from './NumberPuzzle/NumberPuzzle';

// Board Games list
export const BOARD_GAMES = [
  {
    id: 'hopchess',
    name: 'HopChess',
    nameCn: '跳棋',
    component: 'HopChess',
    engine: 'HopChessEngine',
    path: './HopChess'
  },
  {
    id: 'intchess',
    name: 'InternationalChess',
    nameCn: '国际象棋',
    component: 'InternationalChess',
    engine: 'IntChessEngine',
    path: './InternationalChess'
  },
  {
    id: 'militarychess',
    name: 'MilitaryChess',
    nameCn: '军棋',
    component: 'MilitaryChess',
    engine: 'MilitaryChessEngine',
    path: './MilitaryChess'
  },
  {
    id: 'animalchess',
    name: 'AnimalChess',
    nameCn: '斗兽棋',
    component: 'AnimalChess',
    engine: 'AnimalChessEngine',
    path: './AnimalChess'
  },
  {
    id: 'numberpuzzle',
    name: 'NumberPuzzle',
    nameCn: '数字推盘',
    component: 'NumberPuzzle',
    engine: 'NumberPuzzleEngine',
    path: './NumberPuzzle'
  }
] as const;
