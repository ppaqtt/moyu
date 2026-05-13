import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParticleBg from '../components/ParticleBg';
import { GAMES_LIST, NEON_COLORS } from '../utils/constants';
import PlaceholderGame from '../games/PlaceholderGame';

const gameImports: Record<string, () => Promise<any>> = {
  '2048': () => import('../games/Game2048/Game2048'),
  'snake': () => import('../games/Snake/Snake'),
  'tetris': () => import('../games/Tetris/Tetris'),
  'flappybird': () => import('../games/FlappyBird/FlappyBird'),
  'minesweeper': () => import('../games/Minesweeper/Minesweeper'),
  'pacman': () => import('../games/Pacman/Pacman'),
  'angrybirds': () => import('../games/AngryBirds/AngryBirds'),
  'alieninvasion': () => import('../games/AlienInvasion/AlienInvasion'),
  'animalchess': () => import('../games/AnimalChess/AnimalChess'),
  'animalmatch': () => import('../games/AnimalMatch/AnimalMatch'),
  'aamissile': () => import('../games/AAMissile/AAMissile'),
  'apacheattack': () => import('../games/ApacheAttack/ApacheAttack'),
  'artgallery': () => import('../games/ArtGallery/ArtGallery'),
  'badminton': () => import('../games/Badminton/Badminton'),
  'ballio': () => import('../games/BallIO/BallIO'),
  'basketballshoot': () => import('../games/BasketballShoot/BasketballShootGame'),
  'beatbattle': () => import('../games/BeatBattle/BeatBattle'),
  'beatmaster': () => import('../games/BeatMaster/BeatMaster'),
  'beatmetronome': () => import('../games/BeatMetronome/BeatMetronome'),
  'beatracer': () => import('../games/BeatRacer/BeatRacer'),
  'beatrun': () => import('../games/BeatRun/BeatRun'),
  'bejeweled': () => import('../games/Bejeweled/Bejeweled'),
  'billiards': () => import('../games/Billiards/Billiards'),
  'blackjack': () => import('../games/Blackjack/Blackjack'),
  'blockbuilder': () => import('../games/BlockBuilder/BlockBuilder'),
  'bounce': () => import('../games/Bounce/Bounce'),
  'bowling': () => import('../games/Bowling/Bowling'),
  'bowlingmaster': () => import('../games/BowlingMaster/BowlingMaster'),
  'bowlingmaster2': () => import('../games/BowlingMaster2/BowlingMaster2'),
  'boxing': () => import('../games/Boxing/Boxing'),
  'braintest': () => import('../games/BrainTest/BrainTest'),
  'brawlstars': () => import('../games/BrawlStars/BrawlStars'),
  'bubblepop': () => import('../games/BubblePop/BubblePop'),
  'bubbleshooter': () => import('../games/BubbleShooter/BubbleShooter'),
  'bulletheaven': () => import('../games/BulletHeaven/BulletHeaven'),
  'bunnyhunter': () => import('../games/BunnyHunter/BunnyHunter'),
  'candycrush': () => import('../games/CandyCrush/CandyCrush'),
  'carrepair': () => import('../games/CarRepair/CarRepair'),
  'catapultdefense': () => import('../games/CatapultDefense/CatapultDefense'),
  'chess': () => import('../games/Chess/Chess'),
  'cityparkour': () => import('../games/CityParkour/CityParkour'),
  'clickermoney': () => import('../games/ClickerMoney/ClickerMoney'),
  'cliffrunner': () => import('../games/CliffRunner/CliffRunner'),
  'codeart': () => import('../games/CodeArt/CodeArt'),
  'codebreak': () => import('../games/CodeBreak/CodeBreak'),
  'colordetect': () => import('../games/ColorDetect/ColorDetect'),
  'colormatch': () => import('../games/ColorMatch/ColorMatch'),
  'coloringbook': () => import('../games/ColoringBook/ColoringBook'),
  'composebasic': () => import('../games/ComposeBasic/ComposeBasic'),
  'cookiebakery': () => import('../games/CookieBakery/CookieBakery'),
  'cookiematc h': () => import('../games/CookieMatch/CookieMatch'),
  'cookingmaster': () => import('../games/CookingMaster/CookingMaster'),
  'co opbounce': () => import('../games/CoopBounce/CoopBounce'),
  'coopbreakout': () => import('../games/CoopBreakout/CoopBreakout'),
  'coopfruitcatch': () => import('../games/CoopFruitCatch/CoopFruitCatch'),
  'coopmaze': () => import('../games/CoopMaze/CoopMaze'),
  'cooprun': () => import('../games/CoopRun/CoopRun'),
  'coopsokoban': () => import('../games/CoopSokoban/CoopSokoban'),
  'crashlab': () => import('../games/CrashLab/CrashLab'),
  'crosscode': () => import('../games/CrossCode/CrossCode'),
  'crossword': () => import('../games/Crossword/Crossword'),
  'cutrope': () => import('../games/CutRope/CutRope'),
  'djbattle': () => import('../games/DJBattle/DJBattle'),
  'djmixer': () => import('../games/DJMixer/DJMixer'),
  'dancingline': () => import('../games/DancingLine/DancingLine'),
  'desertwar': () => import('../games/DesertWar/DesertWar'),
  'detectivetext': () => import('../games/DetectiveText/DetectiveText'),
  'dinoevolution': () => import('../games/DinoEvolution/DinoEvolution'),
  'dogfight': () => import('../games/Dogfight/Dogfight'),
  'doodlejump': () => import('../games/DoodleJump/DoodleJump'),
  'doudizhu': () => import('../games/DouDiZhu/DouDiZhu'),
  'drawguess': () => import('../games/DrawGuess/DrawGuess'),
  'drawguess2': () => import('../games/DrawGuess2/DrawGuess2'),
  'driftio': () => import('../games/DriftIO/DriftIO'),
  'drumsimulator': () => import('../games/DrumSimulator/DrumSimulator'),
  'dungeonidle': () => import('../games/DungeonIdle/DungeonIdle'),
  'eightballpool': () => import('../games/EightBallPool/EightBallPool'),
  'emojimaker': () => import('../games/EmojiMaker/EmojiMaker'),
  'enhancedbreakout': () => import('../games/EnhancedBreakout/EnhancedBreakout'),
  'factorytycoon': () => import('../games/FactoryTycoon/FactoryTycoon'),
  'finddiff': () => import('../games/FindDiff/FindDiff'),
  'fireice': () => import('../games/FireIce/FireIce'),
  'fishtank': () => import('../games/FishTank/FishTank'),
  'flaktower': () => import('../games/FlakTower/FlakTower'),
  'forestadventure': () => import('../games/ForestAdventure/ForestAdventureGame'),
  'fruitninja': () => import('../games/FruitNinja/FruitNinja'),
  'fusion2048': () => import('../games/Fusion2048/Fusion2048'),
  'gamecenter': () => import('../games/GameCenter/GameCenter'),
  'gardengarden': () => import('../games/GardenGarden/GardenGarden'),
  'gemblast': () => import('../games/GemBlast/GemBlast'),
  'geometrywars': () => import('../games/GeometryWars/GeometryWars'),
  'germanwhistle': () => import('../games/GermanWhistle/GermanWhistle'),
  'gifmaker': () => import('../games/GifMaker/GifMaker'),
  'gobang': () => import('../games/Gobang/Gobang'),
  'goldminer': () => import('../games/GoldMiner/GoldMiner'),
  'guesssong': () => import('../games/GuessSong/GuessSong'),
  'happyfarm': () => import('../games/HappyFarm/HappyFarm'),
  'helicombat': () => import('../games/HeliCombat/HeliCombat'),
  'helicopterescape': () => import('../games/HelicopterEscape/HelicopterEscapeGame'),
  'hexgl': () => import('../games/HexGL/HexGL'),
  'hopchess': () => import('../games/HopChess/HopChess'),
  'hospitalmanage': () => import('../games/HospitalManage/HospitalManage'),
  'hotelempire': () => import('../games/HotelEmpire/HotelEmpire'),
  'housedesign': () => import('../games/HouseDesign/HouseDesign'),
  'huarongdao': () => import('../games/HuarongDao/HuarongDao'),
  'iceagedefense': () => import('../games/IceAgeDefense/IceAgeDefense'),
  'icehockey': () => import('../games/IceHockey/IceHockey'),
  'icerun': () => import('../games/IceRun/IceRun'),
  'idiomchain': () => import('../games/IdiomChain/IdiomChain'),
  'idlefarm': () => import('../games/IdleFarm/IdleFarm'),
  'idleminer': () => import('../games/IdleMiner/IdleMiner'),
  'idleracing': () => import('../games/IdleRacing/IdleRacing'),
  'idlespace': () => import('../games/IdleSpace/IdleSpace'),
  'internationalchess': () => import('../games/InternationalChess/InternationalChess'),
  'islandsurvival': () => import('../games/IslandSurvival/IslandSurvivalGame'),
  'jetupgrade': () => import('../games/JetUpgrade/JetUpgrade'),
  'jigsawkids': () => import('../games/JigsawKids/JigsawKids'),
  'karaoke': () => import('../games/Karaoke/Karaoke'),
  'karatechamp': () => import('../games/KarateChamp/KarateChamp'),
  'keyunlock': () => import('../games/KeyUnlock/KeyUnlock'),
  'kidscoloring': () => import('../games/KidsColoring/KidsColoring'),
  'laserdefense': () => import('../games/LaserDefense/LaserDefense'),
  'lavarun': () => import('../games/LavaRun/LavaRun'),
  'linklink': () => import('../games/LinkLink/LinkLink'),
  'lovestory': () => import('../games/LoveStory/LoveStory'),
  'ludo': () => import('../games/Ludo/Ludo'),
  'ludo2': () => import('../games/Ludo2/Ludo2'),
  'magictower': () => import('../games/MagicTower/MagicTower'),
  'mahjong': () => import('../games/Mahjong/Mahjong'),
  'marblemaze': () => import('../games/MarbleMaze/MarbleMaze'),
  'mathkids': () => import('../games/MathKids/MathKids'),
  'memecreator': () => import('../games/MemeCreator/MemeCreator'),
  'memorymatch': () => import('../games/MemoryMatch/MemoryMatch'),
  'militarychess': () => import('../games/MilitaryChess/MilitaryChess'),
  'missilecommand': () => import('../games/MissileCommand/MissileCommand'),
  'mixmaster': () => import('../games/MixMaster/MixMaster'),
  'monopoly': () => import('../games/Monopoly/Monopoly'),
  'monopoly2': () => import('../games/Monopoly2/Monopoly2'),
  'mountainclimber': () => import('../games/MountainClimber/MountainClimberGame'),
  'musicfighter': () => import('../games/MusicFighter/MusicFighter'),
  'music hero': () => import('../games/MusicHero/MusicHero'),
  'musicplayer': () => import('../games/MusicPlayer/MusicPlayer'),
  'nineball': () => import('../games/NineBall/NineBall'),
  'numberpuzzle': () => import('../games/NumberPuzzle/NumberPuzzle'),
  'numberslide': () => import('../games/NumberSlide/NumberSlide'),
  'oiltycoon': () => import('../games/OilTycoon/OilTycoon'),
  'onestroke': () => import('../games/OneStroke/OneStroke'),
  'onevone': () => import('../games/OneVOne/OneVOne'),
  'patternslide': () => import('../games/PatternSlide/PatternSlide'),
  'penaltykick': () => import('../games/PenaltyKick/PenaltyKickGame'),
  'petlink': () => import('../games/PetLink/PetLink'),
  'pianotiles': () => import('../games/PianoTiles/PianoTiles'),
  'pinball': () => import('../games/Pinball/Pinball'),
  'pinballduo': () => import('../games/PinballDuo/PinballDuo'),
  'pinballmaster': () => import('../games/PinballMaster/PinballMaster'),
  'pinballphysics': () => import('../games/PinballPhysics/PinballPhysics'),
  'pingpong': () => import('../games/PingPong/PingPong'),
  'pipeconnect': () => import('../games/PipeConnect/PipeConnect'),
  'pixelcanvas': () => import('../games/PixelCanvas/PixelCanvas'),
  'pixelfighter': () => import('../games/PixelFighter/PixelFighter'),
  'plantvszombie': () => import('../games/PlantVsZombie/PlantVsZombie'),
  'pokemon': () => import('../games/PokeMon/PokeMon'),
  'quickmemory': () => import('../games/QuickMemory/QuickMemory'),
  'quickreflex': () => import('../games/QuickReflex/QuickReflex'),
  'quizrelay': () => import('../games/QuizRelay/QuizRelay'),
  'raidenenhanced': () => import('../games/RaidenEnhanced/RaidenEnhanced'),
  'restauranttycoon': () => import('../games/RestaurantTycoon/RestaurantTycoon'),
  'rhythmmaster': () => import('../games/RhythmMaster/RhythmMaster'),
  'rhythmtap': () => import('../games/RhythmTap/RhythmTap'),
  'riddleguess': () => import('../games/RiddleGuess/RiddleGuess'),
  'ringtoss': () => import('../games/RingToss/RingToss'),
  'roomescape': () => import('../games/RoomEscape/RoomEscape'),
  'samuraislash': () => import('../games/SamuraiSlash/SamuraiSlash'),
  'sandart': () => import('../games/SandArt/SandArt'),
  'shopmaster': () => import('../games/ShopMaster/ShopMaster'),
  'simpledraw': () => import('../games/SimpleDraw/SimpleDraw'),
  'skateboarding': () => import('../games/Skateboarding/Skateboarding'),
  'sketchout': () => import('../games/Sketchout/Sketchout'),
  'skiing': () => import('../games/Skiing/Skiing'),
  'snakeduo': () => import('../games/SnakeDuo/SnakeDuo'),
  'snakeio': () => import('../games/SnakeIO/SnakeIO'),
  'snooker': () => import('../games/Snooker/Snooker'),
  'sokoban': () => import('../games/Sokoban/Sokoban'),
  'sokobanplus': () => import('../games/SokobanPlus/SokobanPlus'),
  'spacebullet': () => import('../games/SpaceBullet/SpaceBullet'),
  'spacecarrier': () => import('../games/SpaceCarrier/SpaceCarrier'),
  'spaceescape': () => import('../games/SpaceEscape/SpaceEscape'),
  'spaceidle': () => import('../games/SpaceIdle/SpaceIdle'),
  'spacepirate': () => import('../games/SpacePirate/SpacePirate'),
  'spaceshooter': () => import('../games/SpaceShooter/SpaceShooter'),
  'spacetrader': () => import('../games/SpaceTrader/SpaceTrader'),
  'speedescape': () => import('../games/SpeedEscape/SpeedEscape'),
  'spygame': () => import('../games/SpyGame/SpyGame'),
  'squadron': () => import('../games/Squadron/Squadron'),
  'starfighter': () => import('../games/StarFighter/StarFighter'),
  'starmatch': () => import('../games/StarMatch/StarMatch'),
  'stickmanhook': () => import('../games/StickmanHook/StickmanHook'),
  'storychoice': () => import('../games/StoryChoice/StoryChoice'),
  'subway2': () => import('../games/Subway2/Subway2'),
  'subwaysurfers': () => import('../games/SubwaySurfers/SubwaySurfers'),
  'sudoku': () => import('../games/Sudoku/Sudoku'),
  'supermarket': () => import('../games/SuperMarket/SuperMarket'),
  'surfing': () => import('../games/Surfing/Surfing'),
  'swordio': () => import('../games/SwordIO/SwordIO'),
  'synthplay': () => import('../games/SynthPlay/SynthPlay'),
  'tankbattle': () => import('../games/TankBattle/TankBattle'),
  'templerun': () => import('../games/TempleRun/TempleRun'),
  'territoryio': () => import('../games/TerritoryIO/TerritoryIO'),
  'tetrisbattle': () => import('../games/TetrisBattle/TetrisBattle'),
  'texaspoker': () => import('../games/TexasPoker/TexasPoker'),
  'textdungeon': () => import('../games/TextDungeon/TextDungeon'),
  'threekingdoms': () => import('../games/ThreeKingdoms/ThreeKingdoms'),
  'thunder': () => import('../games/Thunder/Thunder'),
  'towerdefense': () => import('../games/TowerDefense/TowerDefense'),
  'tracelight': () => import('../games/TraceLight/TraceLight'),
  'truthdare': () => import('../games/TruthDare/TruthDare'),
  'typingmaster': () => import('../games/TypingMaster/TypingMaster'),
  'unocard': () => import('../games/UnoCard/UnoCard'),
  'virtualpet': () => import('../games/VirtualPet/VirtualPet'),
  'ww2airwar': () => import('../games/WW2Airwar/WW2Airwar'),
  'ww2fighter': () => import('../games/WW2Fighter/WW2Fighter'),
  'waterphysics': () => import('../games/WaterPhysics/WaterPhysics'),
  'waterrun': () => import('../games/WaterRun/WaterRun'),
  'werewolf': () => import('../games/Werewolf/Werewolf'),
  'whackamole': () => import('../games/WhackAMole/WhackAMole'),
  'whitenoise': () => import('../games/WhiteNoise/WhiteNoise'),
  'wordsearch': () => import('../games/WordSearch/WordSearch'),
  'wordspell': () => import('../games/WordSpell/WordSpell'),
  'wrestlemania': () => import('../games/WrestleMania/WrestleMania'),
  'zombieshooter': () => import('../games/ZombieShooter/ZombieShooter'),
  'zombiesurvival': () => import('../games/ZombieSurvival/ZombieSurvivalGame'),
  'zuma': () => import('../games/Zuma/Zuma'),
};

function GamePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [GameComponent, setGameComponent] = useState<React.ComponentType<any> | null>(null);
  const [LazyComponent, setLazyComponent] = useState<React.LazyExoticComponent<any> | null>(null);
  
  const game = GAMES_LIST.find(g => g.id === id);
  
  const handleExit = () => {
    navigate('/');
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    
    const loadGame = async () => {
      if (gameImports[id]) {
        try {
          const module = await gameImports[id]();
          const Component = module.default;
          setGameComponent(() => Component);
        } catch (error) {
          console.warn(`Failed to load game ${id}, using placeholder:`, error);
          setGameComponent(() => PlaceholderGame);
        }
      } else {
        setGameComponent(() => PlaceholderGame);
      }
    };

    loadGame();
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [id]);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ParticleBg />
        <div className="relative z-10 text-center p-8">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>未找到游戏</h1>
          <motion.button 
            onClick={handleExit} 
            className="px-6 py-3 rounded-xl font-bold"
            style={{ 
              background: `linear-gradient(135deg, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonPurple})`, 
              color: '#ffffff' 
            }}
            whileHover={{ scale: 1.05 }}
          >
            返回首页
          </motion.button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ParticleBg />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <motion.div 
              className="text-8xl mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              🎮
            </motion.div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!GameComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ParticleBg />
        <div className="relative z-10 text-center p-8">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>正在加载游戏...</h1>
        </div>
      </div>
    );
  }

  const ComponentToRender = GameComponent;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBg />
      <div className="relative z-10">
        <ComponentToRender
          gameId={game.id}
          gameName={game.name}
          category={game.category}
          onExit={handleExit}
          onScoreUpdate={(score: number) => {
            if (id) {
              localStorage.setItem(`game_score_${id}`, score.toString());
            }
          }}
          onGameOver={(finalScore: number) => {
            if (id) {
              const currentHighScore = parseInt(localStorage.getItem(`game_highscore_${id}`) || '0');
              if (finalScore > currentHighScore) {
                localStorage.setItem(`game_highscore_${id}`, finalScore.toString());
              }
            }
          }}
        />
      </div>
    </div>
  );
}

export default GamePage;
