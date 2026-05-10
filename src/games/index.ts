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

// BeatBattle exports
export { BeatBattleEngine } from './BeatBattle/engine';
export { default as BeatBattle } from './BeatBattle/BeatBattle';

// MusicFighter exports
export { MusicFighterEngine } from './MusicFighter/engine';
export { default as MusicFighter } from './MusicFighter/MusicFighter';

// DJBattle exports
export { DJBattleEngine } from './DJBattle/engine';
export { default as DJBattle } from './DJBattle/DJBattle';

// BeatRun exports
export { BeatRunEngine } from './BeatRun/engine';
export { default as BeatRun } from './BeatRun/BeatRun';

// Beat Battle Games list
export const BEAT_BATTLE_GAMES = [
  {
    id: 'beatbattle',
    name: 'BeatBattle',
    nameCn: '节拍对战',
    component: 'BeatBattle',
    engine: 'BeatBattleEngine',
    path: './BeatBattle'
  },
  {
    id: 'musicfighter',
    name: 'MusicFighter',
    nameCn: '音乐格斗',
    component: 'MusicFighter',
    engine: 'MusicFighterEngine',
    path: './MusicFighter'
  },
  {
    id: 'djbattle',
    name: 'DJBattle',
    nameCn: 'DJ Battle',
    component: 'DJBattle',
    engine: 'DJBattleEngine',
    path: './DJBattle'
  },
  {
    id: 'beatrun',
    name: 'BeatRun',
    nameCn: '节拍跑酷',
    component: 'BeatRun',
    engine: 'BeatRunEngine',
    path: './BeatRun'
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

// PinballMaster exports
export { PinballMasterEngine } from './PinballMaster/engine';
export { default as PinballMaster } from './PinballMaster/PinballMaster';

// EightBallPool exports
export { EightBallPoolEngine } from './EightBallPool/engine';
export { default as EightBallPool } from './EightBallPool/EightBallPool';

// NineBall exports
export { NineBallEngine } from './NineBall/engine';
export { default as NineBall } from './NineBall/NineBall';

// Snooker exports
export { SnookerEngine } from './Snooker/engine';
export { default as Snooker } from './Snooker/Snooker';

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

// Kids Games exports - 儿童益智类
export { JigsawKidsEngine } from './JigsawKids/engine';
export { default as JigsawKids } from './JigsawKids/JigsawKids';

export { MathKidsEngine } from './MathKids/engine';
export { default as MathKids } from './MathKids/MathKids';

export { KidsColoringEngine } from './KidsColoring/engine';
export { default as KidsColoring } from './KidsColoring/KidsColoring';

export { StarMatchEngine } from './StarMatch/engine';
export { default as StarMatch } from './StarMatch/StarMatch';

export { PetLinkEngine } from './PetLink/engine';
export { default as PetLink } from './PetLink/PetLink';

// Kids Games list
export const KIDS_GAMES = [
  {
    id: 'jigsawkids',
    name: 'JigsawKids',
    nameCn: '拼图乐园',
    component: 'JigsawKids',
    engine: 'JigsawKidsEngine',
    path: './JigsawKids'
  },
  {
    id: 'mathkids',
    name: 'MathKids',
    nameCn: '数学练习',
    component: 'MathKids',
    engine: 'MathKidsEngine',
    path: './MathKids'
  },
  {
    id: 'kidscoloring',
    name: 'KidsColoring',
    nameCn: '儿童涂色',
    component: 'KidsColoring',
    engine: 'KidsColoringEngine',
    path: './KidsColoring'
  },
  {
    id: 'starmatch',
    name: 'StarMatch',
    nameCn: '星星配对',
    component: 'StarMatch',
    engine: 'StarMatchEngine',
    path: './StarMatch'
  },
  {
    id: 'petlink',
    name: 'PetLink',
    nameCn: '宠物连连看',
    component: 'PetLink',
    engine: 'PetLinkEngine',
    path: './PetLink'
  }
] as const;

// Puzzle Escape Games exports - 解谜逃脱类
export { CodeBreakEngine } from './CodeBreak/engine';
export { default as CodeBreak } from './CodeBreak/CodeBreak';

export { KeyUnlockEngine } from './KeyUnlock/engine';
export { default as KeyUnlock } from './KeyUnlock/KeyUnlock';

export { RoomEscapeEngine } from './RoomEscape/engine';
export { default as RoomEscape } from './RoomEscape/RoomEscape';

export { SokobanPlusEngine } from './SokobanPlus/engine';
export { default as SokobanPlus } from './SokobanPlus/SokobanPlus';

export { PatternSlideEngine } from './PatternSlide/engine';
export { default as PatternSlide } from './PatternSlide/PatternSlide';

// Puzzle Escape Games list
export const PUZZLE_ESCAPE_GAMES = [
  {
    id: 'codebreak',
    name: 'CodeBreak',
    nameCn: '密码破译',
    component: 'CodeBreak',
    engine: 'CodeBreakEngine',
    path: './CodeBreak'
  },
  {
    id: 'keyunlock',
    name: 'KeyUnlock',
    nameCn: '钥匙解锁',
    component: 'KeyUnlock',
    engine: 'KeyUnlockEngine',
    path: './KeyUnlock'
  },
  {
    id: 'roomescape',
    name: 'RoomEscape',
    nameCn: '密室逃脱',
    component: 'RoomEscape',
    engine: 'RoomEscapeEngine',
    path: './RoomEscape'
  },
  {
    id: 'sokobanplus',
    name: 'SokobanPlus',
    nameCn: '推箱子进阶',
    component: 'SokobanPlus',
    engine: 'SokobanPlusEngine',
    path: './SokobanPlus'
  },
  {
    id: 'patternslide',
    name: 'PatternSlide',
    nameCn: '图案华容道',
    component: 'PatternSlide',
    engine: 'PatternSlideEngine',
    path: './PatternSlide'
  }
] as const;

// Rhythm Music Games exports - 音游扩展类
export { BeatMasterEngine } from './BeatMaster/engine';
export { default as BeatMaster } from './BeatMaster/BeatMaster';

export { DrumSimulatorEngine } from './DrumSimulator/engine';
export { default as DrumSimulator } from './DrumSimulator/DrumSimulator';

export { KaraokeEngine } from './Karaoke/engine';
export { default as Karaoke } from './Karaoke/Karaoke';

export { SynthPlayEngine } from './SynthPlay/engine';
export { default as SynthPlay } from './SynthPlay/SynthPlay';

export { MixMasterEngine } from './MixMaster/engine';
export { default as MixMaster } from './MixMaster/MixMaster';

// Rhythm Music Games list
export const RHYTHM_MUSIC_GAMES = [
  {
    id: 'beatmaster',
    name: 'BeatMaster',
    nameCn: '节拍大师',
    component: 'BeatMaster',
    engine: 'BeatMasterEngine',
    path: './BeatMaster'
  },
  {
    id: 'drumsimulator',
    name: 'DrumSimulator',
    nameCn: '架子鼓模拟',
    component: 'DrumSimulator',
    engine: 'DrumSimulatorEngine',
    path: './DrumSimulator'
  },
  {
    id: 'karaoke',
    name: 'Karaoke',
    nameCn: '卡拉OK练习',
    component: 'Karaoke',
    engine: 'KaraokeEngine',
    path: './Karaoke'
  },
  {
    id: 'synthplay',
    name: 'SynthPlay',
    nameCn: '电子琴模拟',
    component: 'SynthPlay',
    engine: 'SynthPlayEngine',
    path: './SynthPlay'
  },
  {
    id: 'mixmaster',
    name: 'MixMaster',
    nameCn: '混音大师',
    component: 'MixMaster',
    engine: 'MixMasterEngine',
    path: './MixMaster'
  }
] as const;

// Simulation Tycoon Games exports - 模拟经营类
export { HouseDesignEngine } from './HouseDesign/engine';
export { default as HouseDesign } from './HouseDesign/HouseDesign';

export { CarRepairEngine } from './CarRepair/engine';
export { default as CarRepair } from './CarRepair/CarRepair';

export { SuperMarketEngine } from './SuperMarket/engine';
export { default as SuperMarket } from './SuperMarket/SuperMarket';

export { ArtGalleryEngine } from './ArtGallery/engine';
export { default as ArtGallery } from './ArtGallery/ArtGallery';

export { GameCenterEngine } from './GameCenter/engine';
export { default as GameCenter } from './GameCenter/GameCenter';

// Simulation Tycoon Games list
export const SIMULATION_TYCOON_GAMES = [
  {
    id: 'housedesign',
    name: 'HouseDesign',
    nameCn: '房屋设计',
    component: 'HouseDesign',
    engine: 'HouseDesignEngine',
    path: './HouseDesign'
  },
  {
    id: 'carrepair',
    name: 'CarRepair',
    nameCn: '汽车维修',
    component: 'CarRepair',
    engine: 'CarRepairEngine',
    path: './CarRepair'
  },
  {
    id: 'supermarket',
    name: 'SuperMarket',
    nameCn: '超市大亨',
    component: 'SuperMarket',
    engine: 'SuperMarketEngine',
    path: './SuperMarket'
  },
  {
    id: 'artgallery',
    name: 'ArtGallery',
    nameCn: '画廊经营',
    component: 'ArtGallery',
    engine: 'ArtGalleryEngine',
    path: './ArtGallery'
  },
  {
    id: 'gamecenter',
    name: 'GameCenter',
    nameCn: '游戏厅',
    component: 'GameCenter',
    engine: 'GameCenterEngine',
    path: './GameCenter'
  }
] as const;

// Flight Shooter Games exports - 飞行射击类
export { WW2FighterEngine } from './WW2Fighter/engine';
export { default as WW2Fighter } from './WW2Fighter/WW2Fighter';

export { HeliCombatEngine } from './HeliCombat/engine';
export { default as HeliCombat } from './HeliCombat/HeliCombat';

export { StarFighterEngine } from './StarFighter/engine';
export { default as StarFighter } from './StarFighter/StarFighter';

export { AAMissileEngine } from './AAMissile/engine';
export { default as AAMissile } from './AAMissile/AAMissile';

export { SquadronEngine } from './Squadron/engine';
export { default as Squadron } from './Squadron/Squadron';

// Flight Shooter Games list
export const FLIGHT_SHOOTER_GAMES = [
  {
    id: 'ww2fighter',
    name: 'WW2Fighter',
    nameCn: '二战空战扩展',
    component: 'WW2Fighter',
    engine: 'WW2FighterEngine',
    path: './WW2Fighter'
  },
  {
    id: 'helicombat',
    name: 'HeliCombat',
    nameCn: '直升机战斗',
    component: 'HeliCombat',
    engine: 'HeliCombatEngine',
    path: './HeliCombat'
  },
  {
    id: 'starfighter',
    name: 'StarFighter',
    nameCn: '星际战机',
    component: 'StarFighter',
    engine: 'StarFighterEngine',
    path: './StarFighter'
  },
  {
    id: 'aamissile',
    name: 'AAMissile',
    nameCn: '防空导弹',
    component: 'AAMissile',
    engine: 'AAMissileEngine',
    path: './AAMissile'
  },
  {
    id: 'squadron',
    name: 'Squadron',
    nameCn: '战机编队',
    component: 'Squadron',
    engine: 'SquadronEngine',
    path: './Squadron'
  }
] as const;

// Creative Tools Games exports - 创意工具类
export { PixelCanvasEngine } from './PixelCanvas/engine';
export { default as PixelCanvas } from './PixelCanvas/PixelCanvas';

export { GifMakerEngine } from './GifMaker/engine';
export { default as GifMaker } from './GifMaker/GifMaker';

export { MemeMakerEngine } from './MemeCreator/engine';
export { default as MemeCreator } from './MemeCreator/MemeCreator';

export { CodeArtEngine } from './CodeArt/engine';
export { default as CodeArt } from './CodeArt/CodeArt';

// Creative Tools Games list
export const CREATIVE_TOOLS_GAMES = [
  {
    id: 'pixelcanvas',
    name: 'PixelCanvas',
    nameCn: '像素画板',
    component: 'PixelCanvas',
    engine: 'PixelCanvasEngine',
    path: './PixelCanvas'
  },
  {
    id: 'gifmaker',
    name: 'GifMaker',
    nameCn: 'GIF制作',
    component: 'GifMaker',
    engine: 'GifMakerEngine',
    path: './GifMaker'
  },
  {
    id: 'memecreator',
    name: 'MemeCreator',
    nameCn: '表情包DIY',
    component: 'MemeCreator',
    engine: 'MemeMakerEngine',
    path: './MemeCreator'
  },
  {
    id: 'codeart',
    name: 'CodeArt',
    nameCn: '代码艺术',
    component: 'CodeArt',
    engine: 'CodeArtEngine',
    path: './CodeArt'
  }
] as const;

// Monopoly2 exports
export { Monopoly2Engine } from './Monopoly2/engine';
export { default as Monopoly2 } from './Monopoly2/Monopoly2';

// Werewolf exports
export { WerewolfEngine } from './Werewolf/engine';
export { default as Werewolf } from './Werewolf/Werewolf';

// ThreeKingdoms exports
export { ThreeKingdomsEngine } from './ThreeKingdoms/engine';
export { default as ThreeKingdoms } from './ThreeKingdoms/ThreeKingdoms';

// GermanWhistle exports
export { GermanWhistleEngine } from './GermanWhistle/engine';
export { default as GermanWhistle } from './GermanWhistle/GermanWhistle';

// Board Games expanded list
export const BOARD_GAMES_EXPANDED = [
  {
    id: 'monopoly2',
    name: 'Monopoly2',
    nameCn: '大富翁2',
    component: 'Monopoly2',
    engine: 'Monopoly2Engine',
    path: './Monopoly2'
  },
  {
    id: 'werewolf',
    name: 'Werewolf',
    nameCn: '狼人杀',
    component: 'Werewolf',
    engine: 'WerewolfEngine',
    path: './Werewolf'
  },
  {
    id: 'threekingdoms',
    name: 'ThreeKingdoms',
    nameCn: '三国杀',
    component: 'ThreeKingdoms',
    engine: 'ThreeKingdomsEngine',
    path: './ThreeKingdoms'
  },
  {
    id: 'germanwhistle',
    name: 'GermanWhistle',
    nameCn: '德国心脏病',
    component: 'GermanWhistle',
    engine: 'GermanWhistleEngine',
    path: './GermanWhistle'
  }
] as const;

// Idle Games exports - 放置挂机类
export { useFarmEngine } from './IdleFarm/engine';
export { default as IdleFarm } from './IdleFarm/IdleFarm';

export { useMinerEngine } from './IdleMiner/engine';
export { default as IdleMiner } from './IdleMiner/IdleMiner';

export { useSpaceEngine } from './IdleSpace/engine';
export { default as IdleSpace } from './IdleSpace/IdleSpace';

export { useRacingEngine } from './IdleRacing/engine';
export { default as IdleRacing } from './IdleRacing/IdleRacing';

// Idle Games list
export const IDLE_GAMES = [
  {
    id: 'idlefarm',
    name: 'IdleFarm',
    nameCn: '放置农场',
    component: 'IdleFarm',
    engine: 'useFarmEngine',
    path: './IdleFarm'
  },
  {
    id: 'idleminer',
    name: 'IdleMiner',
    nameCn: '放置矿工',
    component: 'IdleMiner',
    engine: 'useMinerEngine',
    path: './IdleMiner'
  },
  {
    id: 'idlespace',
    name: 'IdleSpace',
    nameCn: '星际探索',
    component: 'IdleSpace',
    engine: 'useSpaceEngine',
    path: './IdleSpace'
  },
  {
    id: 'idleracing',
    name: 'IdleRacing',
    nameCn: '放置赛车',
    component: 'IdleRacing',
    engine: 'useRacingEngine',
    path: './IdleRacing'
  }
] as const;

// Text Adventure Games exports - 文字冒险类
export { StoryChoiceEngine } from './StoryChoice/engine';
export { default as StoryChoice } from './StoryChoice/StoryChoice';

export { TextDungeonEngine } from './TextDungeon/engine';
export { default as TextDungeon } from './TextDungeon/TextDungeon';

export { DetectiveTextEngine } from './DetectiveText/engine';
export { default as DetectiveText } from './DetectiveText/DetectiveText';

export { LoveStoryEngine } from './LoveStory/engine';
export { default as LoveStory } from './LoveStory/LoveStory';

// Text Adventure Games list
export const TEXT_ADVENTURE_GAMES = [
  {
    id: 'storychoice',
    name: 'StoryChoice',
    nameCn: '剧情选择',
    component: 'StoryChoice',
    engine: 'StoryChoiceEngine',
    path: './StoryChoice'
  },
  {
    id: 'textdungeon',
    name: 'TextDungeon',
    nameCn: '文字地牢',
    component: 'TextDungeon',
    engine: 'TextDungeonEngine',
    path: './TextDungeon'
  },
  {
    id: 'detectivetext',
    name: 'DetectiveText',
    nameCn: '悬疑推理',
    component: 'DetectiveText',
    engine: 'DetectiveTextEngine',
    path: './DetectiveText'
  },
  {
    id: 'lovestory',
    name: 'LoveStory',
    nameCn: '恋爱养成',
    component: 'LoveStory',
    engine: 'LoveStoryEngine',
    path: './LoveStory'
  }
] as const;

// TruthDare exports
export { TruthDareEngine } from './TruthDare/engine';
export { default as TruthDare } from './TruthDare/TruthDare';

// DrawGuess2 exports
export { DrawGuess2Engine } from './DrawGuess2/engine';
export { default as DrawGuess2 } from './DrawGuess2/DrawGuess2';

// SpyGame exports
export { SpyGameEngine } from './SpyGame/engine';
export { default as SpyGame } from './SpyGame/SpyGame';

// QuizRelay exports
export { QuizRelayEngine } from './QuizRelay/engine';
export { default as QuizRelay } from './QuizRelay/QuizRelay';

// Social Games list
export const SOCIAL_GAMES = [
  {
    id: 'truthdare',
    name: 'TruthDare',
    nameCn: '真心话大冒险',
    component: 'TruthDare',
    engine: 'TruthDareEngine',
    path: './TruthDare'
  },
  {
    id: 'drawguess2',
    name: 'DrawGuess2',
    nameCn: '你画我猜2',
    component: 'DrawGuess2',
    engine: 'DrawGuess2Engine',
    path: './DrawGuess2'
  },
  {
    id: 'spygame',
    name: 'SpyGame',
    nameCn: '谁是卧底',
    component: 'SpyGame',
    engine: 'SpyGameEngine',
    path: './SpyGame'
  },
  {
    id: 'quizrelay',
    name: 'QuizRelay',
    nameCn: '接力问答',
    component: 'QuizRelay',
    engine: 'QuizRelayEngine',
    path: './QuizRelay'
  }
] as const;
