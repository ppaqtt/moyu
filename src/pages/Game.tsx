import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParticleBg from '../components/ParticleBg';
import PlaceholderGame from '../games/PlaceholderGame';
import { GAMES_LIST, NEON_COLORS } from '../utils/constants';

// 游戏组件名称映射
const GAME_COMPONENT_MAP: Record<string, string> = {
  '2048': 'Game2048',
  'tetris': 'Tetris',
  'snake': 'Snake',
  'bounce': 'Bounce',
  'fusion2048': 'Fusion2048',
  'minesweeper': 'Minesweeper',
  'bejeweled': 'Bejeweled',
  'sudoku': 'Sudoku',
  'subway': 'SubwaySurfers',
  'fireice': 'FireIce',
  'goldminer': 'GoldMiner',
  'pvz': 'PlantVsZombie',
  'sketchout': 'Sketchout',
  'flappybird': 'FlappyBird',
  'pacman': 'Pacman',
  'stickmanhook': 'StickmanHook',
  'hexgl': 'HexGL',
  'templerun': 'TempleRun',
  'onevone': 'OneVOne',
  'crosscode': 'CrossCode',
  'zuma': 'Zuma',
  'linklink': 'LinkLink',
  'sokoban': 'Sokoban',
  'finddiff': 'FindDiff',
  'onestroke': 'OneStroke',
  'pinball': 'Pinball',
  'bowling': 'Bowling',
  'billiards': 'Billiards',
  'ringtoss': 'RingToss',
  'enhancedbreakout': 'EnhancedBreakout',
  'skiing': 'Skiing',
  'dancingline': 'DancingLine',
  'subway2': 'Subway2',
  'cliffrunner': 'CliffRunner',
  'speedescape': 'SpeedEscape',
  'cooprun': 'CoopRun',
  'tetrisbattle': 'TetrisBattle',
  'snakeduo': 'SnakeDuo',
  'bunnyhunter': 'BunnyHunter',
  'pinballduo': 'PinballDuo',
  'thunder': 'Thunder',
  'spaceshooter': 'SpaceShooter',
  'tankbattle': 'TankBattle',
  'bubbleshooter': 'BubbleShooter',
  'zombieshooter': 'ZombieShooter',
  'laserdefense': 'LaserDefense',
  'spacecarrier': 'SpaceCarrier',
  'jetupgrade': 'JetUpgrade',
  'missilecommand': 'MissileCommand',
  'spacepirate': 'SpacePirate',
  'ww2airwar': 'WW2Airwar',
  'apacheattack': 'ApacheAttack',
  'alieninvasion': 'AlienInvasion',
  'dogfight': 'Dogfight',
  'flaktower': 'FlakTower',
  'monopoly': 'Monopoly',
  'happyfarm': 'HappyFarm',
  'cookingmaster': 'CookingMaster',
  'shopmaster': 'ShopMaster',
  'spacetrader': 'SpaceTrader',
  'restauranttycoon': 'RestaurantTycoon',
  'hotelempire': 'HotelEmpire',
  'oiltycoon': 'OilTycoon',
  'hospitalmanage': 'HospitalManage',
  'fruitninja': 'FruitNinja',
  'whackamole': 'WhackAMole',
  'colormatch': 'ColorMatch',
  'braintest': 'BrainTest',
  'quickmemory': 'QuickMemory',
  'quickreflex': 'QuickReflex',
  'colordetect': 'ColorDetect',
  'rhythmtap': 'RhythmTap',
  'tracelight': 'TraceLight',
  'chess': 'Chess',
  'gobang': 'Gobang',
  'ludo': 'Ludo',
  'hopchess': 'HopChess',
  'intchess': 'InternationalChess',
  'militarychess': 'MilitaryChess',
  'animalchess': 'AnimalChess',
  'numberpuzzle': 'NumberPuzzle',
  'towerdefense': 'TowerDefense',
  'catapultdefense': 'CatapultDefense',
  'magictower': 'MagicTower',
  'desertwar': 'DesertWar',
  'iceagedefense': 'IceAgeDefense',
  'rhythmmaster': 'RhythmMaster',
  'djmixer': 'DJMixer',
  'pianotiles': 'PianoTiles',
  'beatracer': 'BeatRacer',
  'musichero': 'MusicHero',
  'candycrush': 'CandyCrush',
  'gemblast': 'GemBlast',
  'bubblepop': 'BubblePop',
  'cookiismatch': 'CookieMatch',
  'animalmatch': 'AnimalMatch',
  'pixelfighter': 'PixelFighter',
  'brawlstars': 'BrawlStars',
  'karatechamp': 'KarateChamp',
  'samuraislash': 'SamuraiSlash',
  'wrestlemania': 'WrestleMania',
  'huarongdao': 'HuarongDao',
  'numberslide': 'NumberSlide',
  'pipeconnect': 'PipeConnect',
  'memorymatch': 'MemoryMatch',
  'wordsearch': 'WordSearch',
  'virtualpet': 'VirtualPet',
  'fishtank': 'FishTank',
  'gardengarden': 'GardenGarden',
  'cookiebakery': 'CookieBakery',
  'pokemon': 'PokeMon',
  'angrybirds': 'AngryBirds',
  'doodlejump': 'DoodleJump',
  'bowlingmaster': 'BowlingMaster',
  'pinballphysics': 'PinballPhysics',
  'pinballmaster': 'PinballMaster',
  'eightballpool': 'EightBallPool',
  'nineball': 'NineBall',
  'snooker': 'Snooker',
  'cutrope': 'CutRope',
  'doudizhu': 'DouDiZhu',
  'mahjong': 'Mahjong',
  'texaspoker': 'TexasPoker',
  'blackjack': 'Blackjack',
  'unocard': 'UnoCard',
  'crossword': 'Crossword',
  'idiomchain': 'IdiomChain',
  'wordspell': 'WordSpell',
  'riddleguess': 'RiddleGuess',
  'typingmaster': 'TypingMaster',
  'penaltykick': 'PenaltyKick',
  'basketballshoot': 'BasketballShoot',
  'pingpong': 'PingPong',
  'badminton': 'Badminton',
  'boxing': 'Boxing',
  'snakeio': 'SnakeIO',
  'ballio': 'BallIO',
  'territoryio': 'TerritoryIO',
  'swordio': 'SwordIO',
  'driftio': 'DriftIO',
  'clickermoney': 'ClickerMoney',
  'factorytycoon': 'FactoryTycoon',
  'dinoevolution': 'DinoEvolution',
  'spaceidle': 'SpaceIdle',
  'dungeonidle': 'DungeonIdle',
  'drawguess': 'DrawGuess',
  'coloringbook': 'ColoringBook',
  'simpledraw': 'SimpleDraw',
  'emojimaker': 'EmojiMaker',
  'sandart': 'SandArt',
  'islandsurvival': 'IslandSurvival',
  'zombiesurvival': 'ZombieSurvival',
  'forestadventure': 'ForestAdventure',
  'mountainclimber': 'MountainClimber',
  'helicopterescape': 'HelicopterEscape',
  'coopsokoban': 'CoopSokoban',
  'coopmaze': 'CoopMaze',
  'coopbreakout': 'CoopBreakout',
  'coopfruitcatch': 'CoopFruitCatch',
  'coopbounce': 'CoopBounce',
  'cookiematch': 'CookieMatch',
};

// 可能的游戏文件夹名称映射
const GAME_FOLDER_MAP: Record<string, string> = {
  '2048': 'Game2048',
  'gemblast': 'GemBlast',
  'cookiismatch': 'CookieMatch',
  'cookiematch': 'CookieMatch',
  'spaceidle': 'SpaceIdle',
  'dungeonidle': 'DungeonIdle',
  'happyfarm': 'HappyFarm',
  'cookingmaster': 'CookingMaster',
  'shopmaster': 'ShopMaster',
  'spacetrader': 'SpaceTrader',
  'restauranttycoon': 'RestaurantTycoon',
  'hotelempire': 'HotelEmpire',
  'oiltycoon': 'OilTycoon',
  'hospitalmanage': 'HospitalManage',
  'subway': 'SubwaySurfers',
  'templerun': 'TempleRun',
  'onevone': 'OneVOne',
  'colordetect': 'ColorDetect',
  'rhythmtap': 'RhythmTap',
  'tracelight': 'TraceLight',
  'quickmemory': 'QuickMemory',
  'quickreflex': 'QuickReflex',
  'braintest': 'BrainTest',
  'colormatch': 'ColorMatch',
  'memorymatch': 'MemoryMatch',
  'wordsearch': 'WordSearch',
  'puzzleescape': 'PuzzleEscape',
  'codebreak': 'CodeBreak',
  'keyunlock': 'KeyUnlock',
  'roomescape': 'RoomEscape',
  'sokobanplus': 'SokobanPlus',
  'patternslide': 'PatternSlide',
  'beatmaster': 'BeatMaster',
  'drumsimulator': 'DrumSimulator',
  'karaoke': 'Karaoke',
  'synthplay': 'SynthPlay',
  'mixmaster': 'MixMaster',
  'housedesign': 'HouseDesign',
  'carrepair': 'CarRepair',
  'supermarket': 'SuperMarket',
  'artgallery': 'ArtGallery',
  'gamecenter': 'GameCenter',
  'ww2fighter': 'WW2Fighter',
  'ww2airwar': 'WW2Airwar',
  'helicombat': 'HeliCombat',
  'starfighter': 'StarFighter',
  'aamissile': 'AAMissile',
  'squadron': 'Squadron',
  'apacheattack': 'ApacheAttack',
  'alieninvasion': 'AlienInvasion',
  'dogfight': 'Dogfight',
  'flaktower': 'FlakTower',
  'pixelcanvas': 'PixelCanvas',
  'gifmaker': 'GifMaker',
  'memecreator': 'MemeCreator',
  'codeart': 'CodeArt',
  'monopoly2': 'Monopoly2',
  'germanwhistle': 'GermanWhistle',
  'speedmath': 'SpeedMath',
  'sudokuvariants': 'SudokuVariants',
  'numbermatch': 'NumberMatch',
  'mathmaze': 'MathMaze',
  'idlefarm': 'IdleFarm',
  'idleminer': 'IdleMiner',
  'idleracing': 'IdleRacing',
  'storychoice': 'StoryChoice',
  'textdungeon': 'TextDungeon',
  'detectivetext': 'DetectiveText',
  'lovestory': 'LoveStory',
  'truthdare': 'TruthDare',
  'drawguess2': 'DrawGuess2',
  'spygame': 'SpyGame',
  'quizrelay': 'QuizRelay',
  'idiomchain': 'IdiomChain',
  'wordspell': 'WordSpell',
  'crossword': 'Crossword',
  'wordmemory': 'WordMemory',
  'idiomchainpro': 'IdiomChainPro',
  'translatechallenge': 'TranslateChallenge',
  'typingadvance': 'TypingAdvance',
  'tictactoemaster': 'TicTacToeMaster',
  'gobangai': 'GobangAI',
  'chinesechessai': 'ChineseChessAI',
  'chessai': 'ChessAI',
  'randommaze': 'RandomMaze',
  'maze3d': 'Maze3D',
  'mazepuzzle': 'MazePuzzle',
  'mazechaise': 'MazeChase',
  'mazechase': 'MazeChase',
  'finddifferencepro': 'FindDifferencePro',
  'hiddenpicture': 'HiddenPicture',
  'visiontrack': 'VisionTrack',
  'illusionart': 'IllusionArt',
  'penaltykick': 'PenaltyKick',
  'basketballshoot': 'BasketballShoot',
  'islandsurvival': 'IslandSurvival',
  'zombiesurvival': 'ZombieSurvival',
  'forestadventure': 'ForestAdventure',
  'mountainclimber': 'MountainClimber',
  'helicopterescape': 'HelicopterEscape',
  'fusion2048': 'Fusion2048',
  'enhancedbreakout': 'EnhancedBreakout',
  'dancingline': 'DancingLine',
  'cliffrunner': 'CliffRunner',
  'speedescape': 'SpeedEscape',
  'tetrisbattle': 'TetrisBattle',
  'snakeduo': 'SnakeDuo',
  'bunnyhunter': 'BunnyHunter',
  'pinballduo': 'PinballDuo',
  'laserdefense': 'LaserDefense',
  'spacecarrier': 'SpaceCarrier',
  'jetupgrade': 'JetUpgrade',
  'missilecommand': 'MissileCommand',
  'spacepirate': 'SpacePirate',
  'catapultdefense': 'CatapultDefense',
  'magictower': 'MagicTower',
  'desertwar': 'DesertWar',
  'iceagedefense': 'IceAgeDefense',
  'beatracer': 'BeatRacer',
  'musichero': 'MusicHero',
  'animalmatch': 'AnimalMatch',
  'pixelfighter': 'PixelFighter',
  'brawlstars': 'BrawlStars',
  'karatechamp': 'KarateChamp',
  'samuraislash': 'SamuraiSlash',
  'wrestlemania': 'WrestleMania',
  'huarongdao': 'HuarongDao',
  'numberslide': 'NumberSlide',
  'pipeconnect': 'PipeConnect',
  'virtualpet': 'VirtualPet',
  'fishtank': 'FishTank',
  'gardengarden': 'GardenGarden',
  'cookiebakery': 'CookieBakery',
  'pokemon': 'PokeMon',
  'angrybirds': 'AngryBirds',
  'doodlejump': 'DoodleJump',
  'bowlingmaster': 'BowlingMaster',
  'pinballphysics': 'PinballPhysics',
  'pinballmaster': 'PinballMaster',
  'eightballpool': 'EightBallPool',
  'nineball': 'NineBall',
  'snooker': 'Snooker',
  'cutrope': 'CutRope',
  'doudizhu': 'DouDiZhu',
  'mahjong': 'Mahjong',
  'texaspoker': 'TexasPoker',
  'blackjack': 'Blackjack',
  'unocard': 'UnoCard',
  'riddleguess': 'RiddleGuess',
  'pingpong': 'PingPong',
  'badminton': 'Badminton',
  'boxing': 'Boxing',
  'snakeio': 'SnakeIO',
  'ballio': 'BallIO',
  'territoryio': 'TerritoryIO',
  'swordio': 'SwordIO',
  'driftio': 'DriftIO',
  'clickermoney': 'ClickerMoney',
  'factorytycoon': 'FactoryTycoon',
  'dinoevolution': 'DinoEvolution',
  'drawguess': 'DrawGuess',
  'coloringbook': 'ColoringBook',
  'simpledraw': 'SimpleDraw',
  'emojimaker': 'EmojiMaker',
  'sandart': 'SandArt',
  'coopsokoban': 'CoopSokoban',
  'coopmaze': 'CoopMaze',
  'coopbreakout': 'CoopBreakout',
  'coopfruitcatch': 'CoopFruitCatch',
  'coopbounce': 'CoopBounce',
  'threekingdoms': 'ThreeKingdoms',
  'werewolf': 'Werewolf',
};

function LoadingGame() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <motion.div 
        className="text-6xl mb-4"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      >
        🎮
      </motion.div>
      <div className="text-xl" style={{ color: NEON_COLORS.neonCyan }}>加载游戏中...</div>
    </div>
  );
}

function UniversalGame({ gameId }: { gameId: string }) {
  const navigate = useNavigate();
  const [GameComponent, setGameComponent] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  
  const game = GAMES_LIST.find(g => g.id === gameId);
  
  const handleExit = () => {
    navigate('/');
  };

  useEffect(() => {
    const loadGame = async () => {
      setLoading(true);
      
      // 获取组件名称和文件夹名称
      const componentName = GAME_COMPONENT_MAP[gameId] || 
        gameId.charAt(0).toUpperCase() + gameId.slice(1);
      const folderName = GAME_FOLDER_MAP[gameId] || componentName;
      
      // 尝试多种可能的路径
      const possiblePaths = [
        `../games/${folderName}/${componentName}`,
        `../games/${componentName}/${componentName}`,
        `../games/${gameId}/${componentName}`,
        `../games/${gameId}`,
      ];
      
      for (const path of possiblePaths) {
        try {
          // 使用vite的动态导入
          const module = await import(/* @vite-ignore */ path);
          if (module.default) {
            setGameComponent(() => module.default);
            setLoading(false);
            return;
          }
        } catch (e) {
          // 继续尝试下一个路径
          continue;
        }
      }
      
      // 如果所有路径都失败，使用占位游戏
      setGameComponent(null);
      setLoading(false);
    };

    loadGame();
  }, [gameId]);

  if (!game) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center min-h-screen"
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
      >
        <div 
          className="p-8 rounded-3xl text-center backdrop-blur-xl"
          style={{ 
            background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(15, 15, 26, 0.95))', 
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>游戏未找到</h1>
          <p className="text-lg opacity-70 mb-6">找不到游戏: {gameId}</p>
          <motion.button 
            onClick={handleExit} 
            className="px-6 py-3 rounded-xl font-bold"
            style={{ 
              background: `linear-gradient(135deg, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonPurple})`, 
              color: '#ffffff', 
              boxShadow: `0 0 20px ${NEON_COLORS.neonCyan}50`
            }}
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            返回首页
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ParticleBg />
        <div className="relative z-10">
          <LoadingGame />
        </div>
      </div>
    );
  }

  if (GameComponent) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ParticleBg />
        <div className="relative z-10 flex items-center justify-center p-4">
          <GameComponent 
            onExit={handleExit}
            onScoreUpdate={(score: number) => localStorage.setItem(`game_score_${gameId}`, score.toString())}
            onGameOver={(finalScore: number) => {
              const currentHighScore = parseInt(localStorage.getItem(`game_highscore_${gameId}`) || '0');
              if (finalScore > currentHighScore) {
                localStorage.setItem(`game_highscore_${gameId}`, finalScore.toString());
              }
            }}
          />
        </div>
      </div>
    );
  }

  // 如果找不到真实游戏组件，使用占位游戏
  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBg />
      <div className="relative z-10 flex items-center justify-center p-4">
        <PlaceholderGame
          gameId={game.id}
          gameName={game.name}
          category={game.category}
          onScoreUpdate={(score) => localStorage.setItem(`game_score_${gameId}`, score.toString())}
          onGameOver={(finalScore) => {
            const currentHighScore = parseInt(localStorage.getItem(`game_highscore_${gameId}`) || '0');
            if (finalScore > currentHighScore) {
              localStorage.setItem(`game_highscore_${gameId}`, finalScore.toString());
            }
          }}
          onExit={handleExit}
        />
      </div>
    </div>
  );
}

export default function Game() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div 
          className="p-8 rounded-3xl text-center backdrop-blur-xl"
          style={{ 
            background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(15, 15, 26, 0.95))', 
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>未找到游戏</h1>
        </div>
      </div>
    );
  }

  return <UniversalGame gameId={id} />;
}
