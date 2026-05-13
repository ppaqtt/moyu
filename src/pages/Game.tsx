import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ParticleBg from '../components/ParticleBg';
import Game2048 from '../games/Game2048/Game2048';
import Tetris from '../games/Tetris/Tetris';
import Snake from '../games/Snake/Snake';
import Bounce from '../games/Bounce/Bounce';
import Fusion2048 from '../games/Fusion2048/Fusion2048';
import Minesweeper from '../games/Minesweeper/Minesweeper';
import Bejeweled from '../games/Bejeweled/Bejeweled';
import Sudoku from '../games/Sudoku/Sudoku';
import SubwaySurfers from '../games/SubwaySurfers/SubwaySurfers';
import FireIce from '../games/FireIce/FireIce';
import GoldMiner from '../games/GoldMiner/GoldMiner';
import PlantVsZombie from '../games/PlantVsZombie/PlantVsZombie';
import Sketchout from '../games/Sketchout/Sketchout';
import FlappyBird from '../games/FlappyBird/FlappyBird';
import Pacman from '../games/Pacman/Pacman';
import StickmanHook from '../games/StickmanHook/StickmanHook';
import HexGL from '../games/HexGL/HexGL';
import TempleRun from '../games/TempleRun/TempleRun';
import OneVOne from '../games/OneVOne/OneVOne';
import CrossCode from '../games/CrossCode/CrossCode';
import Zuma from '../games/Zuma/Zuma';
import LinkLink from '../games/LinkLink/LinkLink';
import Sokoban from '../games/Sokoban/Sokoban';
import FindDiff from '../games/FindDiff/FindDiff';
import OneStroke from '../games/OneStroke/OneStroke';
import Pinball from '../games/Pinball/Pinball';
import Bowling from '../games/Bowling/Bowling';
import Billiards from '../games/Billiards/Billiards';
import BlockBuilder from '../games/BlockBuilder/BlockBuilder';
import RingToss from '../games/RingToss/RingToss';
import EnhancedBreakout from '../games/EnhancedBreakout/EnhancedBreakout';
import Skiing from '../games/Skiing/Skiing';
import DancingLine from '../games/DancingLine/DancingLine';
import Subway2 from '../games/Subway2/Subway2';
import CliffRunner from '../games/CliffRunner/CliffRunner';
import SpeedEscape from '../games/SpeedEscape/SpeedEscape';
import SpaceShooter from '../games/SpaceShooter/SpaceShooter';
import ZombieShooter from '../games/ZombieShooter/ZombieShooter';
import TowerDefense from '../games/TowerDefense/TowerDefense';
import AngryBirds from '../games/AngryBirds/AngryBirds';
import CutRope from '../games/CutRope/CutRope';
import DoodleJump from '../games/DoodleJump/DoodleJump';
import PianoTiles from '../games/PianoTiles/PianoTiles';
import RhythmMaster from '../games/RhythmMaster/RhythmMaster';
import RhythmTap from '../games/RhythmTap/RhythmTap';
import ColorMatch from '../games/ColorMatch/ColorMatch';
import MemoryMatch from '../games/MemoryMatch/MemoryMatch';
import QuickMemory from '../games/QuickMemory/QuickMemory';
import QuickReflex from '../games/QuickReflex/QuickReflex';
import ColorDetect from '../games/ColorDetect/ColorDetect';
import NumberSlide from '../games/NumberSlide/NumberSlide';
import HuarongDao from '../games/HuarongDao/HuarongDao';
import NumberPuzzle from '../games/NumberPuzzle/NumberPuzzle';
import WordSearch from '../games/WordSearch/WordSearch';
import WordSpell from '../games/WordSpell/WordSpell';
import Crossword from '../games/Crossword/Crossword';
import RiddleGuess from '../games/RiddleGuess/RiddleGuess';
import IdiomChain from '../games/IdiomChain/IdiomChain';
import TypingMaster from '../games/TypingMaster/TypingMaster';
import Blackjack from '../games/Blackjack/Blackjack';
import UnoCard from '../games/UnoCard/UnoCard';
import TexasPoker from '../games/TexasPoker/TexasPoker';
import Ludo from '../games/Ludo/Ludo';
import Monopoly from '../games/Monopoly/Monopoly';
import Mahjong from '../games/Mahjong/Mahjong';
import MilitaryChess from '../games/MilitaryChess/MilitaryChess';
import AnimalChess from '../games/AnimalChess/AnimalChess';
import HopChess from '../games/HopChess/HopChess';
import Chess from '../games/Chess/Chess';
import InternationalChess from '../games/InternationalChess/InternationalChess';
import Gobang from '../games/Gobang/Gobang';
import PingPong from '../games/PingPong/PingPong';
import Badminton from '../games/Badminton/Badminton';
import BasketballShoot from '../games/BasketballShoot/BasketballShootGame';
import PenaltyKick from '../games/PenaltyKick/PenaltyKickGame';
import Boxing from '../games/Boxing/Boxing';
import KarateChamp from '../games/KarateChamp/KarateChamp';
import WrestleMania from '../games/WrestleMania/WrestleMania';
import PixelFighter from '../games/PixelFighter/PixelFighter';
import SamuraiSlash from '../games/SamuraiSlash/SamuraiSlash';
import FishTank from '../games/FishTank/FishTank';
import VirtualPet from '../games/VirtualPet/VirtualPet';
import CookieBakery from '../games/CookieBakery/CookieBakery';
import GardenGarden from '../games/GardenGarden/GardenGarden';
import HappyFarm from '../games/HappyFarm/HappyFarm';
import RestaurantTycoon from '../games/RestaurantTycoon/RestaurantTycoon';
import HotelEmpire from '../games/HotelEmpire/HotelEmpire';
import FactoryTycoon from '../games/FactoryTycoon/FactoryTycoon';
import OilTycoon from '../games/OilTycoon/OilTycoon';
import CookingMaster from '../games/CookingMaster/CookingMaster';
import ShopMaster from '../games/ShopMaster/ShopMaster';
import WhackAMole from '../games/WhackAMole/WhackAMole';
import BallIO from '../games/BallIO/BallIO';
import SnakeIO from '../games/SnakeIO/SnakeIO';
import SwordIO from '../games/SwordIO/SwordIO';
import TerritoryIO from '../games/TerritoryIO/TerritoryIO';
import DriftIO from '../games/DriftIO/DriftIO';
import SpaceIdle from '../games/SpaceIdle/SpaceIdle';
import DungeonIdle from '../games/DungeonIdle/DungeonIdle';
import DinoEvolution from '../games/DinoEvolution/DinoEvolution';
import SpaceTrader from '../games/SpaceTrader/SpaceTrader';
import SpacePirate from '../games/SpacePirate/SpacePirate';
import SpaceCarrier from '../games/SpaceCarrier/SpaceCarrier';
import GemBlast from '../games/GemBlast/GemBlast';
import CookieMatch from '../games/CookieMatch/CookieMatch';
import CandyCrush from '../games/CandyCrush/CandyCrush';
import BubblePop from '../games/BubblePop/BubblePop';
import BubbleShooter from '../games/BubbleShooter/BubbleShooter';
import EmojiMaker from '../games/EmojiMaker/EmojiMaker';
import SimpleDraw from '../games/SimpleDraw/SimpleDraw';
import SandArt from '../games/SandArt/SandArt';
import ColoringBook from '../games/ColoringBook/ColoringBook';
import TraceLight from '../games/TraceLight/TraceLight';
import PipeConnect from '../games/PipeConnect/PipeConnect';
import WW2Fighter from '../games/WW2Fighter/WW2Fighter';
import HeliCombat from '../games/HeliCombat/HeliCombat';
import StarFighter from '../games/StarFighter/StarFighter';
import AAMissile from '../games/AAMissile/AAMissile';
import Squadron from '../games/Squadron/Squadron';
import WW2Airwar from '../games/WW2Airwar/WW2Airwar';
import DesertWar from '../games/DesertWar/DesertWar';
import Dogfight from '../games/Dogfight/Dogfight';
import ApacheAttack from '../games/ApacheAttack/ApacheAttack';
import MissileCommand from '../games/MissileCommand/MissileCommand';
import FlakTower from '../games/FlakTower/FlakTower';
import LaserDefense from '../games/LaserDefense/LaserDefense';
import CatapultDefense from '../games/CatapultDefense/CatapultDefense';
import IceAgeDefense from '../games/IceAgeDefense/IceAgeDefense';
import TowerDefense2 from '../games/TowerDefense/TowerDefense';
import AlienInvasion from '../games/AlienInvasion/AlienInvasion';
import JetUpgrade from '../games/JetUpgrade/JetUpgrade';
import Thunder from '../games/Thunder/Thunder';
import DrumSimulator from '../games/DrumSimulator/DrumSimulator';
import Karaoke from '../games/Karaoke/Karaoke';
import SynthPlay from '../games/SynthPlay/SynthPlay';
import MixMaster from '../games/MixMaster/MixMaster';
import MusicHero from '../games/MusicHero/MusicHero';
import DJMixer from '../games/DJMixer/DJMixer';
import BeatRacer from '../games/BeatRacer/BeatRacer';
import BeatMetronome from '../games/BeatMetronome/BeatMetronome';
import MusicPlayer from '../games/MusicPlayer/MusicPlayer';
import GuessSong from '../games/GuessSong/GuessSong';
import ComposeBasic from '../games/ComposeBasic/ComposeBasic';
import WhiteNoise from '../games/WhiteNoise/WhiteNoise';
import CityParkour from '../games/CityParkour/CityParkour';
import LavaRun from '../games/LavaRun/LavaRun';
import IceRun from '../games/IceRun/IceRun';
import WaterRun from '../games/WaterRun/WaterRun';
import SpaceEscape from '../games/SpaceEscape/SpaceEscape';
import HouseDesign from '../games/HouseDesign/HouseDesign';
import CarRepair from '../games/CarRepair/CarRepair';
import SuperMarket from '../games/SuperMarket/SuperMarket';
import ArtGallery from '../games/ArtGallery/ArtGallery';
import GameCenter from '../games/GameCenter/GameCenter';
import JigsawKids from '../games/JigsawKids/JigsawKids';
import MathKids from '../games/MathKids/MathKids';
import KidsColoring from '../games/KidsColoring/KidsColoring';
import StarMatch from '../games/StarMatch/StarMatch';
import PetLink from '../games/PetLink/PetLink';
import CodeBreak from '../games/CodeBreak/CodeBreak';
import KeyUnlock from '../games/KeyUnlock/KeyUnlock';
import RoomEscape from '../games/RoomEscape/RoomEscape';
import SokobanPlus from '../games/SokobanPlus/SokobanPlus';
import PatternSlide from '../games/PatternSlide/PatternSlide';
import IceHockey from '../games/IceHockey/IceHockey';
import Skateboarding from '../games/Skateboarding/Skateboarding';
import Surfing from '../games/Surfing/Surfing';
import BowlingMaster2 from '../games/BowlingMaster2/BowlingMaster2';
import BowlingMaster from '../games/BowlingMaster/BowlingMaster';
import PinballPhysics from '../games/PinballPhysics/PinballPhysics';
import MagicTower from '../games/MagicTower/MagicTower';
import BrainTest from '../games/BrainTest/BrainTest';
import DouDiZhu from '../games/DouDiZhu/DouDiZhu';
import BeatBattle from '../games/BeatBattle/BeatBattle';
import MusicFighter from '../games/MusicFighter/MusicFighter';
import DJBattle from '../games/DJBattle/DJBattle';
import BeatRun from '../games/BeatRun/BeatRun';
import HospitalManage from '../games/HospitalManage/HospitalManage';
import FruitNinja from '../games/FruitNinja/FruitNinja';
import ClickerMoney from '../games/ClickerMoney/ClickerMoney';
import DrawGuess from '../games/DrawGuess/DrawGuess';
import CoopRun from '../games/CoopRun/CoopRun';
import TetrisBattle from '../games/TetrisBattle/TetrisBattle';
import SnakeDuo from '../games/SnakeDuo/SnakeDuo';
import BunnyHunter from '../games/BunnyHunter/BunnyHunter';
import PinballDuo from '../games/PinballDuo/PinballDuo';
import CoopSokoban from '../games/CoopSokoban/CoopSokoban';
import CoopMaze from '../games/CoopMaze/CoopMaze';
import CoopBreakout from '../games/CoopBreakout/CoopBreakout';
import CoopFruitCatch from '../games/CoopFruitCatch/CoopFruitCatch';
import CoopBounce from '../games/CoopBounce/CoopBounce';
import TankBattle from '../games/TankBattle/TankBattle';
import AnimalMatch from '../games/AnimalMatch/AnimalMatch';
import BrawlStars from '../games/BrawlStars/BrawlStars';
import PokeMon from '../games/PokeMon/PokeMon';
import { GAME_IDS, NEON_COLORS } from '../utils/constants';

interface GameContainerProps {
  gameId: string;
}

function GameContainer({ gameId }: GameContainerProps) {
  const navigate = useNavigate();

  const handleExit = () => {
    navigate('/');
  };

  const handleScoreUpdate = (score: number) => {
  };

  const handleGameOver = (finalScore: number) => {
  };

  const renderGame = () => {
    switch (gameId) {
      case GAME_IDS.GAME_2048:
        return <Game2048 onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.TETRIS:
        return <Tetris onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SNAKE:
        return <Snake onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BOUNCE:
        return <Bounce onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.FUSION_2048:
        return <Fusion2048 onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.MINESWEEPER:
        return <Minesweeper onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BEJEWEL:
        return <Bejeweled onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SUDOKU:
        return <Sudoku onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SUBWAY:
        return <SubwaySurfers onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.FIRE_ICE:
        return <FireIce onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.GOLD_MINER:
        return <GoldMiner onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.PVZ:
        return <PlantVsZombie onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SKETCHOUT:
        return <Sketchout onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.FLAPPY_BIRD:
        return <FlappyBird onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.PACMAN:
        return <Pacman onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.STICKMAN_HOOK:
        return <StickmanHook onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.HEXGL:
        return <HexGL onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.TEMPLE_RUN:
        return <TempleRun onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.ONEVONE:
        return <OneVOne onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.CROSSCODE:
        return <CrossCode onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.ZUMA:
        return <Zuma onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.LINKLINK:
        return <LinkLink onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SOKOBAN:
        return <Sokoban onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.FINDDIFF:
        return <FindDiff onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.ONESTROKE:
        return <OneStroke onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.PINBALL:
        return <Pinball onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BOWLING:
        return <Bowling onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BILLIARDS:
        return <Billiards onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.RINGTOSS:
        return <RingToss onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.ENHANCED_BREAKOUT:
        return <EnhancedBreakout onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SKIING:
        return <Skiing onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.DANCING_LINE:
        return <DancingLine onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SUBWAY2:
        return <Subway2 onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.CLIFF_RUNNER:
        return <CliffRunner onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SPEED_ESCAPE:
        return <SpeedEscape onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SPACE_SHOOTER:
        return <SpaceShooter onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.ZOMBIE_SHOOTER:
        return <ZombieShooter onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.TOWER_DEFENSE:
        return <TowerDefense onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.ANGRY_BIRDS:
        return <AngryBirds onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.CUT_ROPE:
        return <CutRope onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.DOODLE_JUMP:
        return <DoodleJump onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.PIANO_TILES:
        return <PianoTiles onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.RHYTHM_MASTER:
        return <RhythmMaster onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.RHYTHM_TAP:
        return <RhythmTap onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.COLOR_MATCH:
        return <ColorMatch onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.MEMORY_MATCH:
        return <MemoryMatch onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.QUICK_MEMORY:
        return <QuickMemory onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.QUICK_REFLEX:
        return <QuickReflex onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.COLOR_DETECT:
        return <ColorDetect onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.NUMBER_SLIDE:
        return <NumberSlide onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.HUARONG_DAO:
        return <HuarongDao onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.NUMBER_PUZZLE:
        return <NumberPuzzle />;
      // 桌游合集类
      case GAME_IDS.LUDO2:
        return <Ludo2 />;
      case GAME_IDS.MONOPOLY2:
        return <Monopoly2 />;
      case GAME_IDS.WEREWOLF:
        return <Werewolf />;
      case GAME_IDS.THREE_KINGDOMS:
        return <ThreeKingdoms />;
      case GAME_IDS.GERMAN_WHISTLE:
        return <GermanWhistle />;
      // 弹珠台/台球增强类
      case GAME_IDS.PINBALL_MASTER:
        return <PinballMaster />;
      case GAME_IDS.EIGHT_BALL_POOL:
        return <EightBallPool />;
      case GAME_IDS.NINE_BALL:
        return <NineBall />;
      case GAME_IDS.SNOOKER:
        return <Snooker />;
      // 物理模拟类
      case GAME_IDS.MARBLE_MAZE:
        return <MarbleMaze />;
      case GAME_IDS.BLOCK_BUILDER:
        return <BlockBuilder />;
      case GAME_IDS.WATER_PHYSICS:
        return <WaterPhysics />;
      case GAME_IDS.CRASH_LAB:
        return <CrashLab />;
      // 创意工具类
      case GAME_IDS.PIXEL_CANVAS:
        return <PixelCanvas />;
      case GAME_IDS.GIF_MAKER:
        return <GifMaker />;
      case GAME_IDS.MEME_CREATOR:
        return <MemeCreator />;
      case GAME_IDS.CODE_ART:
        return <CodeArt />;
      // 文字冒险类
      case GAME_IDS.STORY_CHOICE:
        return <StoryChoice />;
      case GAME_IDS.TEXT_DUNGEON:
        return <TextDungeon />;
      case GAME_IDS.DETECTIVE_TEXT:
        return <DetectiveText />;
      case GAME_IDS.LOVE_STORY:
        return <LoveStory />;
      // 弹幕射击类
      case GAME_IDS.BULLET_HEAVEN:
        return <BulletHeaven />;
      case GAME_IDS.RAIDEN_ENHANCED:
        return <RaidenEnhanced />;
      case GAME_IDS.GEOMETRY_WARS:
        return <GeometryWars />;
      case GAME_IDS.SPACE_BULLET:
        return <SpaceBullet />;
      // 放置挂机类增强
      case GAME_IDS.IDLE_FARM:
        return <IdleFarm />;
      case GAME_IDS.IDLE_MINER:
        return <IdleMiner />;
      case GAME_IDS.IDLE_SPACE:
        return <IdleSpace />;
      case GAME_IDS.IDLE_RACING:
        return <IdleRacing />;
      // 休闲运动类
      case GAME_IDS.BOWLING_MASTER2:
        return <BowlingMaster2 />;
      case GAME_IDS.ICE_HOCKEY:
        return <IceHockey />;
      case GAME_IDS.SKATEBOARDING:
        return <Skateboarding />;
      case GAME_IDS.SURFING:
        return <Surfing />;
      // 社交休闲类
      case GAME_IDS.TRUTH_DARE:
        return <TruthDare />;
      case GAME_IDS.DRAW_GUESS2:
        return <DrawGuess2 />;
      case GAME_IDS.SPY_GAME:
        return <SpyGame />;
      case GAME_IDS.QUIZ_RELAY:
        return <QuizRelay />;
      case GAME_IDS.THUNDER:
        return <Thunder onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.MONOPOLY:
        return <Monopoly onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.CHESS:
        return <Chess onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.GOBANG:
        return <Gobang onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.MAHJONG:
        return <Mahjong onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.INTERNATIONAL_CHESS:
        return <InternationalChess onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.MILITARY_CHESS:
        return <MilitaryChess onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.ANIMAL_CHESS:
        return <AnimalChess onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.HOP_CHESS:
        return <HopChess onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BOWLING_MASTER:
        return <BowlingMaster onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.PINBALL_PHYSICS:
        return <PinballPhysics onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.MAGIC_TOWER:
        return <MagicTower onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.CATAPULT_DEFENSE:
        return <CatapultDefense onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.DESERT_WAR:
        return <DesertWar onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.ICE_AGE_DEFENSE:
        return <IceAgeDefense onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SPACE_CARRIER:
        return <SpaceCarrier onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SPACE_PIRATE:
        return <SpacePirate onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.MISSILE_COMMAND:
        return <MissileCommand onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.DOGFIGHT:
        return <Dogfight onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.APACHE_ATTACK:
        return <ApacheAttack onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.FLAK_TOWER:
        return <FlakTower onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.LASER_DEFENSE:
        return <LaserDefense onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.JET_UPGRADE:
        return <JetUpgrade onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.ALIEN_INVASION:
        return <AlienInvasion onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.WW2FIGHTER:
        return <WW2Fighter onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.HELICOMBAT:
        return <HeliCombat onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.STARFIGHTER:
        return <StarFighter onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.AAMISSILE:
        return <AAMissile onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SQUADRON:
        return <Squadron onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.DJ_MIXER:
        return <DJMixer onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BEAT_RACER:
        return <BeatRacer onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.MUSIC_HERO:
        return <MusicHero onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.CANDY_CRUSH:
        return <CandyCrush onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.GEM_BLAST:
        return <GemBlast onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BUBBLE_POP:
        return <BubblePop onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.COOKIE_MATCH:
        return <CookieMatch onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.ANIMAL_MATCH:
        return <AnimalMatch onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.PIXEL_FIGHTER:
        return <PixelFighter onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BRAWL_STARS:
        return <BrawlStars onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.KARATE_CHAMP:
        return <KarateChamp onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SAMURAI_SLASH:
        return <SamuraiSlash onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.WRESTLE_MANIA:
        return <WrestleMania onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.PIPE_CONNECT:
        return <PipeConnect onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.WORD_SEARCH:
        return <WordSearch onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.VIRTUAL_PET:
        return <VirtualPet onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.FISH_TANK:
        return <FishTank onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.GARDEN_GARDEN:
        return <GardenGarden onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.COOKIE_BAKERY:
        return <CookieBakery onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.POKEMON:
        return <PokeMon onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BOWLING_MASTER2:
        return <BowlingMaster2 onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.DOODLE_JUMP:
        return <DoodleJump onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.CUT_ROPE:
        return <CutRope onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.DOUDIZHU:
        return <DouDiZhu onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.TEXAS_POKER:
        return <TexasPoker onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BLACKJACK:
        return <Blackjack onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.UNO_CARD:
        return <UnoCard onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.CROSSWORD:
        return <Crossword onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.IDIOM_CHAIN:
        return <IdiomChain onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.WORD_SPELL:
        return <WordSpell onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.RIDDLE_GUESS:
        return <RiddleGuess onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.TYPING_MASTER:
        return <TypingMaster onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.PENALTY_KICK:
        return <PenaltyKick onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BASKETBALL_SHOOT:
        return <BasketballShoot onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.PING_PONG:
        return <PingPong onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BADMINTON:
        return <Badminton onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BOXING:
        return <Boxing onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SNAKE_IO:
        return <SnakeIO onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BALL_IO:
        return <BallIO onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.TERRITORY_IO:
        return <TerritoryIO onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SWORD_IO:
        return <SwordIO onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.DRIFT_IO:
        return <DriftIO onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.CLICKER_MONEY:
        return <ClickerMoney onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.FACTORY_TYCOON:
        return <FactoryTycoon onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.DINO_EVOLUTION:
        return <DinoEvolution onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SPACE_IDLE:
        return <SpaceIdle onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.DUNGEON_IDLE:
        return <DungeonIdle onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.DRAW_GUESS:
        return <DrawGuess onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.COLORING_BOOK:
        return <ColoringBook onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SIMPLE_DRAW:
        return <SimpleDraw onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.EMOJI_MAKER:
        return <EmojiMaker onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SAND_ART:
        return <SandArt onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.CITY_PARKOUR:
        return <CityParkour onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.LAVA_RUN:
        return <LavaRun onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.ICE_RUN:
        return <IceRun onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.WATER_RUN:
        return <WaterRun onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SPACE_ESCAPE:
        return <SpaceEscape onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BEAT_BATTLE:
        return <BeatBattle onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.MUSIC_FIGHTER:
        return <MusicFighter onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.DJ_BATTLE:
        return <DJBattle onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BEAT_RUN:
        return <BeatRun onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.MONOPOLY:
        return <Monopoly onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.HAPPY_FARM:
        return <HappyFarm onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.COOKING_MASTER:
        return <CookingMaster onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SHOP_MASTER:
        return <ShopMaster onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.SPACE_TRADER:
        return <SpaceTrader onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.RESTAURANT_TYCOON:
        return <RestaurantTycoon onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.HOTEL_EMPIRE:
        return <HotelEmpire onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.OIL_TYCOON:
        return <OilTycoon onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.HOSPITAL_MANAGE:
        return <HospitalManage onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.FRUIT_NINJA:
        return <FruitNinja onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.WHACK_A_MOLE:
        return <WhackAMole onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.COLOR_MATCH:
        return <ColorMatch onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BRAIN_TEST:
        return <BrainTest onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.QUICK_MEMORY:
        return <QuickMemory onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.QUICK_REFLEX:
        return <QuickReflex onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.COLOR_DETECT:
        return <ColorDetect onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.RHYTHM_TAP:
        return <RhythmTap onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.TRACE_LIGHT:
        return <TraceLight onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.HOP_CHESS:
        return <HopChess onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.INT_CHESS:
        return <InternationalChess onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.MILITARY_CHESS:
        return <MilitaryChess onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.ANIMAL_CHESS:
        return <AnimalChess onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
      case GAME_IDS.BUBBLE_SHOOTER:
        return <BubbleShooter onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onExit={handleExit} />;
                                                                              default:
        return (
          <motion.div className="flex flex-col items-center justify-center min-h-screen" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="p-8 rounded-3xl text-center backdrop-blur-xl" style={{ background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(15, 15, 26, 0.95))', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="text-6xl mb-4">🎮</div>
              <h1 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>游戏加载中...</h1>
              <motion.button onClick={handleExit} className="px-6 py-3 rounded-xl font-bold" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonPurple})`, color: '#ffffff', boxShadow: `0 0 20px ${NEON_COLORS.neonCyan}50` }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>返回首页</motion.button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <ParticleBg />
      <div className="relative z-10">
        {renderGame()}
      </div>
    </div>
  );
}

export default function Game() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="p-8 rounded-3xl text-center backdrop-blur-xl" style={{ background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(15, 15, 26, 0.95))', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>未找到游戏</h1>
        </div>
      </div>
    );
  }

  return <GameContainer gameId={id} />;
}
