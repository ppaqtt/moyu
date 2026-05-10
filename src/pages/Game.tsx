import React from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
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
import RingToss from '../games/RingToss/RingToss';
import EnhancedBreakout from '../games/EnhancedBreakout/EnhancedBreakout';
import Skiing from '../games/Skiing/Skiing';
import DancingLine from '../games/DancingLine/DancingLine';
import Subway2 from '../games/Subway2/Subway2';
import CliffRunner from '../games/CliffRunner/CliffRunner';
import SpeedEscape from '../games/SpeedEscape/SpeedEscape';
import CoopRun from '../games/CoopRun/CoopRun';
import TetrisBattle from '../games/TetrisBattle/TetrisBattle';
import SnakeDuo from '../games/SnakeDuo/SnakeDuo';
import BunnyHunter from '../games/BunnyHunter/BunnyHunter';
import PinballDuo from '../games/PinballDuo/PinballDuo';
import Thunder from '../games/Thunder/Thunder';
import SpaceShooter from '../games/SpaceShooter/SpaceShooter';
import TankBattle from '../games/TankBattle/TankBattle';
import BubbleShooter from '../games/BubbleShooter/BubbleShooter';
import ZombieShooter from '../games/ZombieShooter/ZombieShooter';
// 射击类扩展
import WW2Airwar from '../games/WW2Airwar/WW2Airwar';
import ApacheAttack from '../games/ApacheAttack/ApacheAttack';
import AlienInvasion from '../games/AlienInvasion/AlienInvasion';
import Dogfight from '../games/Dogfight/Dogfight';
import FlakTower from '../games/FlakTower/FlakTower';
import LaserDefense from '../games/LaserDefense/LaserDefense';
import SpaceCarrier from '../games/SpaceCarrier/SpaceCarrier';
import JetUpgrade from '../games/JetUpgrade/JetUpgrade';
import MissileCommand from '../games/MissileCommand/MissileCommand';
import SpacePirate from '../games/SpacePirate/SpacePirate';
import Monopoly from '../games/Monopoly/Monopoly';
import HappyFarm from '../games/HappyFarm/HappyFarm';
import CookingMaster from '../games/CookingMaster/CookingMaster';
import ShopMaster from '../games/ShopMaster/ShopMaster';
import FruitNinja from '../games/FruitNinja/FruitNinja';
import WhackAMole from '../games/WhackAMole/WhackAMole';
import ColorMatch from '../games/ColorMatch/ColorMatch';
import BrainTest from '../games/BrainTest/BrainTest';
import Chess from '../games/Chess/Chess';
import Gobang from '../games/Gobang/Gobang';
import Ludo from '../games/Ludo/Ludo';
// 塔防策略类
import TowerDefense from '../games/TowerDefense/TowerDefense';
import CatapultDefense from '../games/CatapultDefense/CatapultDefense';
import MagicTower from '../games/MagicTower/MagicTower';
import DesertWar from '../games/DesertWar/DesertWar';
import IceAgeDefense from '../games/IceAgeDefense/IceAgeDefense';
// 音乐节奏类
import RhythmMaster from '../games/RhythmMaster/RhythmMaster';
import DJMixer from '../games/DJMixer/DJMixer';
import PianoTiles from '../games/PianoTiles/PianoTiles';
import BeatRacer from '../games/BeatRacer/BeatRacer';
import MusicHero from '../games/MusicHero/MusicHero';
// 消除类扩展
import CandyCrush from '../games/CandyCrush/CandyCrush';
import GemBlast from '../games/GemBlast/GemBlast';
import BubblePop from '../games/BubblePop/BubblePop';
import CookieMatch from '../games/CookieMatch/CookieMatch';
import AnimalMatch from '../games/AnimalMatch/AnimalMatch';
// 格斗对战类
import PixelFighter from '../games/PixelFighter/PixelFighter';
import BrawlStars from '../games/BrawlStars/BrawlStars';
import KarateChamp from '../games/KarateChamp/KarateChamp';
import SamuraiSlash from '../games/SamuraiSlash/SamuraiSlash';
import WrestleMania from '../games/WrestleMania/WrestleMania';
// 益智解谜类
import HuarongDao from '../games/HuarongDao/HuarongDao';
import NumberSlide from '../games/NumberSlide/NumberSlide';
import PipeConnect from '../games/PipeConnect/PipeConnect';
import MemoryMatch from '../games/MemoryMatch/MemoryMatch';
import WordSearch from '../games/WordSearch/WordSearch';
// 养成收集类
import VirtualPet from '../games/VirtualPet/VirtualPet';
import FishTank from '../games/FishTank/FishTank';
import GardenGarden from '../games/GardenGarden/GardenGarden';
import CookieBakery from '../games/CookieBakery/CookieBakery';
import PokeMon from '../games/PokeMon/PokeMon';
// 物理益智类
import AngryBirds from '../games/AngryBirds/AngryBirds';
import DoodleJump from '../games/DoodleJump/DoodleJump';
import BowlingMaster from '../games/BowlingMaster/BowlingMaster';
import PinballPhysics from '../games/PinballPhysics/PinballPhysics';
import CutRope from '../games/CutRope/CutRope';
import DouDiZhu from '../games/DouDiZhu/DouDiZhu';
import Mahjong from '../games/Mahjong/Mahjong';
import TexasPoker from '../games/TexasPoker/TexasPoker';
import Blackjack from '../games/Blackjack/Blackjack';
import UnoCard from '../games/UnoCard/UnoCard';
// 文字/词汇类
import Crossword from '../games/Crossword/Crossword';
import IdiomChain from '../games/IdiomChain/IdiomChain';
import WordSpell from '../games/WordSpell/WordSpell';
import RiddleGuess from '../games/RiddleGuess/RiddleGuess';
import TypingMaster from '../games/TypingMaster/TypingMaster';
// 运动竞技类
import PenaltyKick from '../games/PenaltyKick/PenaltyKickGame';
import BasketballShoot from '../games/BasketballShoot/BasketballShootGame';
import PingPong from '../games/PingPong/PingPong';
import Badminton from '../games/Badminton/Badminton';
import Boxing from '../games/Boxing/Boxing';
// IO竞技类
import SnakeIO from '../games/SnakeIO/SnakeIO';
import BallIO from '../games/BallIO/BallIO';
import TerritoryIO from '../games/TerritoryIO/TerritoryIO';
import SwordIO from '../games/SwordIO/SwordIO';
import DriftIO from '../games/DriftIO/DriftIO';
// 点击放置类
import ClickerMoney from '../games/ClickerMoney/ClickerMoney';
import FactoryTycoon from '../games/FactoryTycoon/FactoryTycoon';
import DinoEvolution from '../games/DinoEvolution/DinoEvolution';
import SpaceIdle from '../games/SpaceIdle/SpaceIdle';
import DungeonIdle from '../games/DungeonIdle/DungeonIdle';
// 绘画创意类
import DrawGuess from '../games/DrawGuess/DrawGuess';
import ColoringBook from '../games/ColoringBook/ColoringBook';
import SimpleDraw from '../games/SimpleDraw/SimpleDraw';
import EmojiMaker from '../games/EmojiMaker/EmojiMaker';
import SandArt from '../games/SandArt/SandArt';
// 生存冒险类
import IslandSurvival from '../games/IslandSurvival/IslandSurvivalGame';
import ZombieSurvival from '../games/ZombieSurvival/ZombieSurvivalGame';
import ForestAdventure from '../games/ForestAdventure/ForestAdventureGame';
import MountainClimber from '../games/MountainClimber/MountainClimberGame';
import HelicopterEscape from '../games/HelicopterEscape/HelicopterEscapeGame';
// 双人合作类
import CoopSokoban from '../games/CoopSokoban/CoopSokoban';
import CoopMaze from '../games/CoopMaze/CoopMaze';
import CoopBreakout from '../games/CoopBreakout/CoopBreakout';
import CoopFruitCatch from '../games/CoopFruitCatch/CoopFruitCatch';
import CoopBounce from '../games/CoopBounce/CoopBounce';
// 策略经营类
import SpaceTrader from '../games/SpaceTrader/SpaceTrader';
import RestaurantTycoon from '../games/RestaurantTycoon/RestaurantTycoon';
import HotelEmpire from '../games/HotelEmpire/HotelEmpire';
import OilTycoon from '../games/OilTycoon/OilTycoon';
import HospitalManage from '../games/HospitalManage/HospitalManage';
// 反应类
import QuickMemory from '../games/QuickMemory/QuickMemory';
import QuickReflex from '../games/QuickReflex/QuickReflex';
import ColorDetect from '../games/ColorDetect/ColorDetect';
import RhythmTap from '../games/RhythmTap/RhythmTap';
import TraceLight from '../games/TraceLight/TraceLight';
// 棋类
import HopChess from '../games/HopChess/HopChess';
import InternationalChess from '../games/InternationalChess/InternationalChess';
import MilitaryChess from '../games/MilitaryChess/MilitaryChess';
import AnimalChess from '../games/AnimalChess/AnimalChess';
import NumberPuzzle from '../games/NumberPuzzle/NumberPuzzle';
// 跑酷闯关类
import CityParkour from '../games/CityParkour/CityParkour';
import LavaRun from '../games/LavaRun/LavaRun';
import IceRun from '../games/IceRun/IceRun';
import WaterRun from '../games/WaterRun/WaterRun';
import SpaceEscape from '../games/SpaceEscape/SpaceEscape';
// 音游扩展类
import BeatMaster from '../games/BeatMaster/BeatMaster';
import DrumSimulator from '../games/DrumSimulator/DrumSimulator';
import Karaoke from '../games/Karaoke/Karaoke';
import SynthPlay from '../games/SynthPlay/SynthPlay';
import MixMaster from '../games/MixMaster/MixMaster';
// 模拟经营类
import HouseDesign from '../games/HouseDesign/HouseDesign';
import CarRepair from '../games/CarRepair/CarRepair';
import SuperMarket from '../games/SuperMarket/SuperMarket';
import ArtGallery from '../games/ArtGallery/ArtGallery';
import GameCenter from '../games/GameCenter/GameCenter';
// 儿童益智类
import JigsawKids from '../games/JigsawKids/JigsawKids';
import MathKids from '../games/MathKids/MathKids';
import KidsColoring from '../games/KidsColoring/KidsColoring';
import StarMatch from '../games/StarMatch/StarMatch';
import PetLink from '../games/PetLink/PetLink';
// 解谜逃脱类
import CodeBreak from '../games/CodeBreak/CodeBreak';
import KeyUnlock from '../games/KeyUnlock/KeyUnlock';
import RoomEscape from '../games/RoomEscape/RoomEscape';
import SokobanPlus from '../games/SokobanPlus/SokobanPlus';
import PatternSlide from '../games/PatternSlide/PatternSlide';
// 飞行射击类
import WW2Fighter from '../games/WW2Fighter/WW2Fighter';
import HeliCombat from '../games/HeliCombat/HeliCombat';
import StarFighter from '../games/StarFighter/StarFighter';
import AAMissile from '../games/AAMissile/AAMissile';
import Squadron from '../games/Squadron/Squadron';
// 音乐休闲类
import GuessSong from '../games/GuessSong/GuessSong';
import MusicPlayer from '../games/MusicPlayer/MusicPlayer';
import BeatMetronome from '../games/BeatMetronome/BeatMetronome';
import ComposeBasic from '../games/ComposeBasic/ComposeBasic';
import WhiteNoise from '../games/WhiteNoise/WhiteNoise';
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
        return (
          <Game2048
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.TETRIS:
        return (
          <Tetris
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.SNAKE:
        return (
          <Snake
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.BOUNCE:
        return (
          <Bounce
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.FUSION_2048:
        return (
          <Fusion2048
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.MINESWEEPER:
        return (
          <Minesweeper
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.BEJEWEL:
        return (
          <Bejeweled
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.SUDOKU:
        return (
          <Sudoku
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.SUBWAY:
        return (
          <SubwaySurfers
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.FIRE_ICE:
        return (
          <FireIce
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.GOLD_MINER:
        return (
          <GoldMiner
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.PVZ:
        return (
          <PlantVsZombie
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.SKETCHOUT:
        return (
          <Sketchout
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.FLAPPY_BIRD:
        return (
          <FlappyBird
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.PACMAN:
        return (
          <Pacman
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.STICKMAN_HOOK:
        return (
          <StickmanHook
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.HEXGL:
        return (
          <HexGL
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.TEMPLE_RUN:
        return (
          <TempleRun
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.ONEVONE:
        return (
          <OneVOne
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.CROSSCODE:
        return (
          <CrossCode
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onExit={handleExit}
          />
        );
      case GAME_IDS.ZUMA:
        return <Zuma />;
      case GAME_IDS.LINKLINK:
        return <LinkLink />;
      case GAME_IDS.SOKOBAN:
        return <Sokoban />;
      case GAME_IDS.FINDDIFF:
        return <FindDiff />;
      case GAME_IDS.ONESTROKE:
        return <OneStroke />;
      case GAME_IDS.PINBALL:
        return <Pinball />;
      case GAME_IDS.BOWLING:
        return <Bowling />;
      case GAME_IDS.BILLIARDS:
        return <Billiards />;
      case GAME_IDS.RINGTOSS:
        return <RingToss />;
      case GAME_IDS.ENHANCED_BREAKOUT:
        return <EnhancedBreakout />;
      case GAME_IDS.SKIING:
        return <Skiing />;
      case GAME_IDS.DANCING_LINE:
        return <DancingLine />;
      case GAME_IDS.SUBWAY2:
        return <Subway2 />;
      case GAME_IDS.CLIFF_RUNNER:
        return <CliffRunner />;
      case GAME_IDS.SPEED_ESCAPE:
        return <SpeedEscape />;
      case GAME_IDS.COOP_RUN:
        return <CoopRun />;
      case GAME_IDS.TETRIS_BATTLE:
        return <TetrisBattle />;
      case GAME_IDS.SNAKE_DUO:
        return <SnakeDuo />;
      case GAME_IDS.BUNNY_HUNTER:
        return <BunnyHunter />;
      case GAME_IDS.PINBALL_DUO:
        return <PinballDuo />;
      case GAME_IDS.THUNDER:
        return <Thunder />;
      case GAME_IDS.SPACE_SHOOTER:
        return <SpaceShooter />;
      case GAME_IDS.TANK_BATTLE:
        return <TankBattle />;
      case GAME_IDS.BUBBLE_SHOOTER:
        return <BubbleShooter />;
      case GAME_IDS.ZOMBIE_SHOOTER:
        return <ZombieShooter />;
      // 射击类扩展
      case GAME_IDS.WW2_AIRWAR:
        return <WW2Airwar />;
      case GAME_IDS.APACHE_ATTACK:
        return <ApacheAttack />;
      case GAME_IDS.ALIEN_INVASION:
        return <AlienInvasion />;
      case GAME_IDS.DOGFIGHT:
        return <Dogfight />;
      case GAME_IDS.FLAK_TOWER:
        return <FlakTower />;
      case GAME_IDS.LASER_DEFENSE:
        return <LaserDefense />;
      case GAME_IDS.SPACE_CARRIER:
        return <SpaceCarrier />;
      case GAME_IDS.JET_UPGRADE:
        return <JetUpgrade />;
      case GAME_IDS.MISSILE_COMMAND:
        return <MissileCommand />;
      case GAME_IDS.SPACE_PIRATE:
        return <SpacePirate />;
      case GAME_IDS.MONOPOLY:
        return <Monopoly />;
      case GAME_IDS.HAPPY_FARM:
        return <HappyFarm />;
      case GAME_IDS.COOKING_MASTER:
        return <CookingMaster />;
      case GAME_IDS.SHOP_MASTER:
        return <ShopMaster />;
      case GAME_IDS.FRUIT_NINJA:
        return <FruitNinja />;
      case GAME_IDS.WHACK_A_MOLE:
        return <WhackAMole />;
      case GAME_IDS.COLOR_MATCH:
        return <ColorMatch />;
      case GAME_IDS.BRAIN_TEST:
        return <BrainTest />;
      case GAME_IDS.CHESS:
        return <Chess />;
      case GAME_IDS.GOBANG:
        return <Gobang />;
      case GAME_IDS.LUDO:
        return <Ludo />;
      // 跑酷闯关类
      case GAME_IDS.CITY_PARKOUR:
        return <CityParkour />;
      case GAME_IDS.LAVA_RUN:
        return <LavaRun />;
      case GAME_IDS.ICE_RUN:
        return <IceRun />;
      case GAME_IDS.WATER_RUN:
        return <WaterRun />;
      case GAME_IDS.SPACE_ESCAPE:
        return <SpaceEscape />;
      // 音游扩展类
      case GAME_IDS.BEAT_MASTER:
        return <BeatMaster />;
      case GAME_IDS.DRUM_SIMULATOR:
        return <DrumSimulator />;
      case GAME_IDS.KARAOKE:
        return <Karaoke />;
      case GAME_IDS.SYNTH_PLAY:
        return <SynthPlay />;
      case GAME_IDS.MIX_MASTER:
        return <MixMaster />;
      // 模拟经营类
      case GAME_IDS.HOUSE_DESIGN:
        return <HouseDesign />;
      case GAME_IDS.CAR_REPAIR:
        return <CarRepair />;
      case GAME_IDS.SUPER_MARKET:
        return <SuperMarket />;
      case GAME_IDS.ART_GALLERY:
        return <ArtGallery />;
      case GAME_IDS.GAME_CENTER:
        return <GameCenter />;
      // 儿童益智类
      case GAME_IDS.JIGSAW_KIDS:
        return <JigsawKids />;
      case GAME_IDS.MATH_KIDS:
        return <MathKids />;
      case GAME_IDS.KIDS_COLORING:
        return <KidsColoring />;
      case GAME_IDS.STAR_MATCH:
        return <StarMatch />;
      case GAME_IDS.PET_LINK:
        return <PetLink />;
      // 解谜逃脱类
      case GAME_IDS.CODE_BREAK:
        return <CodeBreak />;
      case GAME_IDS.KEY_UNLOCK:
        return <KeyUnlock />;
      case GAME_IDS.ROOM_ESCAPE:
        return <RoomEscape />;
      case GAME_IDS.SOKOBAN_PLUS:
        return <SokobanPlus />;
      case GAME_IDS.PATTERN_SLIDE:
        return <PatternSlide />;
      // 飞行射击类
      case GAME_IDS.WW2_FIGHTER:
        return <WW2Fighter />;
      case GAME_IDS.HELI_COMBAT:
        return <HeliCombat />;
      case GAME_IDS.STAR_FIGHTER:
        return <StarFighter />;
      case GAME_IDS.AA_MISSILE:
        return <AAMissile />;
      case GAME_IDS.SQUADRON:
        return <Squadron />;
      // 音乐休闲类
      case GAME_IDS.GUESS_SONG:
        return <GuessSong />;
      case GAME_IDS.MUSIC_PLAYER:
        return <MusicPlayer />;
      case GAME_IDS.BEAT_METRONOME:
        return <BeatMetronome />;
      case GAME_IDS.COMPOSE_BASIC:
        return <ComposeBasic />;
      case GAME_IDS.WHITE_NOISE:
        return <WhiteNoise />;
      // 塔防策略类
      case GAME_IDS.TOWER_DEFENSE:
        return <TowerDefense />;
      case GAME_IDS.CATAPULT_DEFENSE:
        return <CatapultDefense />;
      case GAME_IDS.MAGIC_TOWER:
        return <MagicTower />;
      case GAME_IDS.DESERT_WAR:
        return <DesertWar />;
      case GAME_IDS.ICE_AGE_DEFENSE:
        return <IceAgeDefense />;
      // 音乐节奏类
      case GAME_IDS.RHYTHM_MASTER:
        return <RhythmMaster />;
      case GAME_IDS.DJ_MIXER:
        return <DJMixer />;
      case GAME_IDS.PIANO_TILES:
        return <PianoTiles />;
      case GAME_IDS.BEAT_RACER:
        return <BeatRacer />;
      case GAME_IDS.MUSIC_HERO:
        return <MusicHero />;
      // 消除类扩展
      case GAME_IDS.CANDY_CRUSH:
        return <CandyCrush />;
      case GAME_IDS.GEM_BLAST:
        return <GemBlast />;
      case GAME_IDS.BUBBLE_POP:
        return <BubblePop />;
      case GAME_IDS.COOKIE_MATCH:
        return <CookieMatch />;
      case GAME_IDS.ANIMAL_MATCH:
        return <AnimalMatch />;
      // 格斗对战类
      case GAME_IDS.PIXEL_FIGHTER:
        return <PixelFighter />;
      case GAME_IDS.BRAWL_STARS:
        return <BrawlStars />;
      case GAME_IDS.KARATE_CHAMP:
        return <KarateChamp />;
      case GAME_IDS.SAMURAI_SLASH:
        return <SamuraiSlash />;
      case GAME_IDS.WRESTLE_MANIA:
        return <WrestleMania />;
      // 益智解谜类
      case GAME_IDS.HUARONG_DAO:
        return <HuarongDao />;
      case GAME_IDS.NUMBER_SLIDE:
        return <NumberSlide />;
      case GAME_IDS.PIPE_CONNECT:
        return <PipeConnect />;
      case GAME_IDS.MEMORY_MATCH:
        return <MemoryMatch />;
      case GAME_IDS.WORD_SEARCH:
        return <WordSearch />;
      // 养成收集类
      case GAME_IDS.VIRTUAL_PET:
        return <VirtualPet />;
      case GAME_IDS.FISH_TANK:
        return <FishTank />;
      case GAME_IDS.GARDEN_GARDEN:
        return <GardenGarden />;
      case GAME_IDS.COOKIE_BAKERY:
        return <CookieBakery />;
      case GAME_IDS.POKEMON:
        return <PokeMon />;
      // 物理益智类
      case GAME_IDS.ANGRY_BIRDS:
        return <AngryBirds />;
      case GAME_IDS.DOODLE_JUMP:
        return <DoodleJump />;
      case GAME_IDS.BOWLING_MASTER:
        return <BowlingMaster />;
      case GAME_IDS.PINBALL_PHYSICS:
        return <PinballPhysics />;
      case GAME_IDS.CUT_ROPE:
        return <CutRope />;
      case GAME_IDS.DOUDIZHU:
        return <DouDiZhu />;
      case GAME_IDS.MAHJONG:
        return <Mahjong />;
      case GAME_IDS.TEXAS_POKER:
        return <TexasPoker />;
      case GAME_IDS.BLACKJACK:
        return <Blackjack />;
      case GAME_IDS.UNO_CARD:
        return <UnoCard />;
      // 文字/词汇类
      case GAME_IDS.CROSSWORD:
        return <Crossword />;
      case GAME_IDS.IDIOM_CHAIN:
        return <IdiomChain />;
      case GAME_IDS.WORD_SPELL:
        return <WordSpell />;
      case GAME_IDS.RIDDLE_GUESS:
        return <RiddleGuess />;
      case GAME_IDS.TYPING_MASTER:
        return <TypingMaster />;
      // 运动竞技类
      case GAME_IDS.PENALTY_KICK:
        return <PenaltyKick />;
      case GAME_IDS.BASKETBALL_SHOOT:
        return <BasketballShoot />;
      case GAME_IDS.PING_PONG:
        return <PingPong />;
      case GAME_IDS.BADMINTON:
        return <Badminton />;
      case GAME_IDS.BOXING:
        return <Boxing />;
      // IO竞技类
      case GAME_IDS.SNAKE_IO:
        return <SnakeIO />;
      case GAME_IDS.BALL_IO:
        return <BallIO />;
      case GAME_IDS.TERRITORY_IO:
        return <TerritoryIO />;
      case GAME_IDS.SWORD_IO:
        return <SwordIO />;
      case GAME_IDS.DRIFT_IO:
        return <DriftIO />;
      // 点击放置类
      case GAME_IDS.CLICKER_MONEY:
        return <ClickerMoney />;
      case GAME_IDS.FACTORY_TYCOON:
        return <FactoryTycoon />;
      case GAME_IDS.DINO_EVOLUTION:
        return <DinoEvolution />;
      case GAME_IDS.SPACE_IDLE:
        return <SpaceIdle />;
      case GAME_IDS.DUNGEON_IDLE:
        return <DungeonIdle />;
      // 绘画创意类
      case GAME_IDS.DRAW_GUESS:
        return <DrawGuess />;
      case GAME_IDS.COLORING_BOOK:
        return <ColoringBook />;
      case GAME_IDS.SIMPLE_DRAW:
        return <SimpleDraw />;
      case GAME_IDS.EMOJI_MAKER:
        return <EmojiMaker />;
      case GAME_IDS.SAND_ART:
        return <SandArt />;
      // 生存冒险类
      case GAME_IDS.ISLAND_SURVIVAL:
        return <IslandSurvival />;
      case GAME_IDS.ZOMBIE_SURVIVAL:
        return <ZombieSurvival />;
      case GAME_IDS.FOREST_ADVENTURE:
        return <ForestAdventure />;
      case GAME_IDS.MOUNTAIN_CLIMBER:
        return <MountainClimber />;
      case GAME_IDS.HELICOPTER_ESCAPE:
        return <HelicopterEscape />;
      // 双人合作类
      case GAME_IDS.COOP_SOKOBAN:
        return <CoopSokoban />;
      case GAME_IDS.COOP_MAZE:
        return <CoopMaze />;
      case GAME_IDS.COOP_BREAKOUT:
        return <CoopBreakout />;
      case GAME_IDS.COOP_FRUIT_CATCH:
        return <CoopFruitCatch />;
      case GAME_IDS.COOP_BOUNCE:
        return <CoopBounce />;
      // 策略经营类
      case GAME_IDS.SPACE_TRADER:
        return <SpaceTrader />;
      case GAME_IDS.RESTAURANT_TYCOON:
        return <RestaurantTycoon />;
      case GAME_IDS.HOTEL_EMPIRE:
        return <HotelEmpire />;
      case GAME_IDS.OIL_TYCOON:
        return <OilTycoon />;
      case GAME_IDS.HOSPITAL_MANAGE:
        return <HospitalManage />;
      // 反应类
      case GAME_IDS.QUICK_MEMORY:
        return <QuickMemory />;
      case GAME_IDS.QUICK_REFLEX:
        return <QuickReflex />;
      case GAME_IDS.COLOR_DETECT:
        return <ColorDetect />;
      case GAME_IDS.RHYTHM_TAP:
        return <RhythmTap />;
      case GAME_IDS.TRACE_LIGHT:
        return <TraceLight />;
      // 棋类
      case GAME_IDS.HOP_CHESS:
        return <HopChess />;
      case GAME_IDS.INTERNATIONAL_CHESS:
        return <InternationalChess />;
      case GAME_IDS.MILITARY_CHESS:
        return <MilitaryChess />;
      case GAME_IDS.ANIMAL_CHESS:
        return <AnimalChess />;
      case GAME_IDS.NUMBER_PUZZLE:
        return <NumberPuzzle />;
      default:
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
              <div className="text-6xl mb-4">🎮</div>
              <h1 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
                游戏加载中...
              </h1>
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
        <div
          className="p-8 rounded-3xl text-center backdrop-blur-xl"
          style={{
            background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(15, 15, 26, 0.95))',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
            未找到游戏
          </h1>
        </div>
      </div>
    );
  }

  return <GameContainer gameId={id} />;
}
