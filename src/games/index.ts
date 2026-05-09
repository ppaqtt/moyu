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
