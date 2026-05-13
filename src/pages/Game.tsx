import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParticleBg from '../components/ParticleBg';
import { GAMES_LIST, NEON_COLORS } from '../utils/constants';

const gameImports: Record<string, () => Promise<any>> = {
'2048': () => import('../games/Game2048/Game2048'),
  '2048battle': () => import('../games/2048battle/2048battle'),
  'aamissile': () => import('../games/AAMissile/AAMissile'),
  'abandonedhospital': () => import('../games/Abandonedhospital/Abandonedhospital'),
  'agar': () => import('../games/Agar/Agar'),
  'ai2048': () => import('../games/Ai2048/Ai2048'),
  'aiart': () => import('../games/Aiart/Aiart'),
  'aichallenge': () => import('../games/Aichallenge/Aichallenge'),
  'aicoop': () => import('../games/Aicoop/Aicoop'),
  'aimahjong': () => import('../games/Aimahjong/Aimahjong'),
  'aipoker': () => import('../games/Aipoker/Aipoker'),
  'aiquiz': () => import('../games/Aiquiz/Aiquiz'),
  'airockpaperscissors': () => import('../games/Airockpaperscissors/Airockpaperscissors'),
  'aistrategy': () => import('../games/Aistrategy/Aistrategy'),
  'aitournament': () => import('../games/Aitournament/Aitournament'),
  'algorithm': () => import('../games/Algorithm/Algorithm'),
  'alieninvasion': () => import('../games/AlienInvasion/AlienInvasion'),
  'ambiguousfigure': () => import('../games/Ambiguousfigure/Ambiguousfigure'),
  'anagram': () => import('../games/Anagram/Anagram'),
  'angrybirds': () => import('../games/AngryBirds/AngryBirds'),
  'animalchess': () => import('../games/AnimalChess/AnimalChess'),
  'animalkingdom': () => import('../games/Animalkingdom/Animalkingdom'),
  'animalmatch': () => import('../games/AnimalMatch/AnimalMatch'),
  'apacheattack': () => import('../games/ApacheAttack/ApacheAttack'),
  'archery3d': () => import('../games/Archery3d/Archery3d'),
  'architect': () => import('../games/Architect/Architect'),
  'arcticsurvival': () => import('../games/Arcticsurvival/Arcticsurvival'),
  'artgallery': () => import('../games/ArtGallery/ArtGallery'),
  'asteroids': () => import('../games/Asteroids/Asteroids'),
  'baccarat': () => import('../games/Baccarat/Baccarat'),
  'backgammon': () => import('../games/Backgammon/Backgammon'),
  'badminton': () => import('../games/Badminton/Badminton'),
  'bakerytycoon': () => import('../games/Bakerytycoon/Bakerytycoon'),
  'ballio': () => import('../games/BallIO/BallIO'),
  'banktycoon': () => import('../games/Banktycoon/Banktycoon'),
  'basketballshoot': () => import('../games/BasketballShoot/BasketballShootGame'),
  'beachparkour': () => import('../games/Beachparkour/Beachparkour'),
  'beatbattle': () => import('../games/BeatBattle/BeatBattle'),
  'beatbox': () => import('../games/Beatbox/Beatbox'),
  'beateditor': () => import('../games/Beateditor/Beateditor'),
  'beatracer': () => import('../games/BeatRacer/BeatRacer'),
  'beatrun': () => import('../games/BeatRun/BeatRun'),
  'beatsaber': () => import('../games/Beatsaber/Beatsaber'),
  'beekeeper': () => import('../games/Beekeeper/Beekeeper'),
  'bejeweled': () => import('../games/Bejeweled/Bejeweled'),
  'bikestunt': () => import('../games/Bikestunt/Bikestunt'),
  'billiards': () => import('../games/Billiards/Billiards'),
  'birdcare': () => import('../games/Birdcare/Birdcare'),
  'birdwatcher': () => import('../games/Birdwatcher/Birdwatcher'),
  'blackjack': () => import('../games/Blackjack/Blackjack'),
  'blockbuilder': () => import('../games/BlockBuilder/BlockBuilder'),
  'bloonstd': () => import('../games/Bloonstd/Bloonstd'),
  'boardgamebattle': () => import('../games/Boardgamebattle/Boardgamebattle'),
  'boatdriver': () => import('../games/Boatdriver/Boatdriver'),
  'bomberman': () => import('../games/Bomberman/Bomberman'),
  'bounce': () => import('../games/Bounce/Bounce'),
  'bowling': () => import('../games/Bowling/Bowling'),
  'bowling3d': () => import('../games/Bowling3d/Bowling3d'),
  'bowlingmaster': () => import('../games/BowlingMaster/BowlingMaster'),
  'bowlingmaster2': () => import('../games/BowlingMaster2/BowlingMaster2'),
  'boxing': () => import('../games/Boxing/Boxing'),
  'boxingchamp': () => import('../games/Boxingchamp/Boxingchamp'),
  'braintest': () => import('../games/BrainTest/BrainTest'),
  'brawlstars': () => import('../games/BrawlStars/BrawlStars'),
  'breakout': () => import('../games/Breakout/Breakout'),
  'bridge': () => import('../games/Bridge/Bridge'),
  'bubblepop': () => import('../games/BubblePop/BubblePop'),
  'bubbleshooter': () => import('../games/BubbleShooter/BubbleShooter'),
  'budgeting': () => import('../games/Budgeting/Budgeting'),
  'bulletheaven': () => import('../games/BulletHeaven/BulletHeaven'),
  'bunnyhunter': () => import('../games/BunnyHunter/BunnyHunter'),
  'burgermaker': () => import('../games/Burgermaker/Burgermaker'),
  'busdriver': () => import('../games/Busdriver/Busdriver'),
  'butterflyvalley': () => import('../games/Butterflyvalley/Butterflyvalley'),
  'cakemaker': () => import('../games/Cakemaker/Cakemaker'),
  'calculator': () => import('../games/Calculator/Calculator'),
  'candle': () => import('../games/Candle/Candle'),
  'candyblast': () => import('../games/Candyblast/Candyblast'),
  'candycrush': () => import('../games/CandyCrush/CandyCrush'),
  'carnival3d': () => import('../games/Carnival3d/Carnival3d'),
  'castlemaze': () => import('../games/Castlemaze/Castlemaze'),
  'catapultdefense': () => import('../games/CatapultDefense/CatapultDefense'),
  'catcare': () => import('../games/Catcare/Catcare'),
  'catstory': () => import('../games/Catstory/Catstory'),
  'charades': () => import('../games/Charades/Charades'),
  'checkers': () => import('../games/Checkers/Checkers'),
  'chefmaster': () => import('../games/Chefmaster/Chefmaster'),
  'chess': () => import('../games/Chess/Chess'),
  'chessai': () => import('../games/Chessai/Chessai'),
  'chinesechessai': () => import('../games/Chinesechessai/Chinesechessai'),
  'chordprogression': () => import('../games/Chordprogression/Chordprogression'),
  'christmasgift': () => import('../games/Christmasgift/Christmasgift'),
  'circuitconnect': () => import('../games/Circuitconnect/Circuitconnect'),
  'citybuilder': () => import('../games/Citybuilder/Citybuilder'),
  'cityparkour': () => import('../games/CityParkour/CityParkour'),
  'clickermoney': () => import('../games/ClickerMoney/ClickerMoney'),
  'cliffrunner': () => import('../games/CliffRunner/CliffRunner'),
  'codeart': () => import('../games/CodeArt/CodeArt'),
  'coffeelatte': () => import('../games/Coffeelatte/Coffeelatte'),
  'coffeeshop': () => import('../games/Coffeeshop/Coffeeshop'),
  'colorblind': () => import('../games/Colorblind/Colorblind'),
  'colordetect': () => import('../games/ColorDetect/ColorDetect'),
  'coloringbook': () => import('../games/ColoringBook/ColoringBook'),
  'colormatch': () => import('../games/ColorMatch/ColorMatch'),
  'colorreaction': () => import('../games/Colorreaction/Colorreaction'),
  'companymanager': () => import('../games/Companymanager/Companymanager'),
  'concentration': () => import('../games/Concentration/Concentration'),
  'cookiebakery': () => import('../games/CookieBakery/CookieBakery'),
  'cookiematch': () => import('../games/CookieMatch/CookieMatch'),
  'cookingmaster': () => import('../games/CookingMaster/CookingMaster'),
  'coopadventure': () => import('../games/Coopadventure/Coopadventure'),
  'coopbounce': () => import('../games/CoopBounce/CoopBounce'),
  'coopbreakout': () => import('../games/CoopBreakout/CoopBreakout'),
  'coopfruitcatch': () => import('../games/CoopFruitCatch/CoopFruitCatch'),
  'coopmaze': () => import('../games/CoopMaze/CoopMaze'),
  'cooprun': () => import('../games/CoopRun/CoopRun'),
  'coopshooting': () => import('../games/Coopshooting/Coopshooting'),
  'coopskiing': () => import('../games/Coopskiing/Coopskiing'),
  'coopsokoban': () => import('../games/CoopSokoban/CoopSokoban'),
  'cooptetris': () => import('../games/Cooptetris/Cooptetris'),
  'crashlab': () => import('../games/CrashLab/CrashLab'),
  'crosscode': () => import('../games/CrossCode/CrossCode'),
  'crossword': () => import('../games/Crossword/Crossword'),
  'cutrope': () => import('../games/CutRope/CutRope'),
  'cyberpunk': () => import('../games/Cyberpunk/Cyberpunk'),
  'dancebattle': () => import('../games/Dancebattle/Dancebattle'),
  'dancingline': () => import('../games/DancingLine/DancingLine'),
  'database': () => import('../games/Database/Database'),
  'deliveryman': () => import('../games/Deliveryman/Deliveryman'),
  'desertruins': () => import('../games/Desertruins/Desertruins'),
  'desertsurvival': () => import('../games/Desertsurvival/Desertsurvival'),
  'desertwar': () => import('../games/DesertWar/DesertWar'),
  'detectiveriddle': () => import('../games/Detectiveriddle/Detectiveriddle'),
  'detectivestory': () => import('../games/Detectivestory/Detectivestory'),
  'detectivetext': () => import('../games/DetectiveText/DetectiveText'),
  'diep': () => import('../games/Diep/Diep'),
  'dinoevolution': () => import('../games/DinoEvolution/DinoEvolution'),
  'djbattle': () => import('../games/DJBattle/DJBattle'),
  'djmixer': () => import('../games/DJMixer/DJMixer'),
  'doctor': () => import('../games/Doctor/Doctor'),
  'dogcare': () => import('../games/Dogcare/Dogcare'),
  'dogfight': () => import('../games/Dogfight/Dogfight'),
  'dogstory': () => import('../games/Dogstory/Dogstory'),
  'dogtrainer': () => import('../games/Dogtrainer/Dogtrainer'),
  'doodlejump': () => import('../games/DoodleJump/DoodleJump'),
  'dotsandboxes': () => import('../games/Dotsandboxes/Dotsandboxes'),
  'doudizhu': () => import('../games/DouDiZhu/DouDiZhu'),
  'dragonadventure': () => import('../games/Dragonadventure/Dragonadventure'),
  'dragonboat': () => import('../games/Dragonboat/Dragonboat'),
  'dragoncare': () => import('../games/Dragoncare/Dragoncare'),
  'drawguess': () => import('../games/DrawGuess/DrawGuess'),
  'drawguess2': () => import('../games/DrawGuess2/DrawGuess2'),
  'drawguesspro': () => import('../games/Drawguesspro/Drawguesspro'),
  'drawingboard': () => import('../games/Drawingboard/Drawingboard'),
  'driftio': () => import('../games/DriftIO/DriftIO'),
  'drivingschool': () => import('../games/Drivingschool/Drivingschool'),
  'drummachine': () => import('../games/Drummachine/Drummachine'),
  'drunkdice': () => import('../games/Drunkdice/Drunkdice'),
  'duckhunt': () => import('../games/Duckhunt/Duckhunt'),
  'dungeonescape': () => import('../games/Dungeonescape/Dungeonescape'),
  'dungeonidle': () => import('../games/DungeonIdle/DungeonIdle'),
  'egyptianroom': () => import('../games/Egyptianroom/Egyptianroom'),
  'eightballpool': () => import('../games/EightBallPool/EightBallPool'),
  'electronicmusic': () => import('../games/Electronicmusic/Electronicmusic'),
  'elementaltd': () => import('../games/Elementaltd/Elementaltd'),
  'embroidery': () => import('../games/Embroidery/Embroidery'),
  'emojimaker': () => import('../games/EmojiMaker/EmojiMaker'),
  'enhancedbreakout': () => import('../games/EnhancedBreakout/EnhancedBreakout'),
  'equations': () => import('../games/Equations/Equations'),
  'factorytycoon': () => import('../games/FactoryTycoon/FactoryTycoon'),
  'familysimulator': () => import('../games/Familysimulator/Familysimulator'),
  'fantasy': () => import('../games/Fantasy/Fantasy'),
  'farmbuild': () => import('../games/Farmbuild/Farmbuild'),
  'finddiff': () => import('../games/FindDiff/FindDiff'),
  'finddifferencepro': () => import('../games/Finddifferencepro/Finddifferencepro'),
  'firefighter': () => import('../games/Firefighter/Firefighter'),
  'fireice': () => import('../games/FireIce/FireIce'),
  'fishtank': () => import('../games/FishTank/FishTank'),
  'flaktower': () => import('../games/FlakTower/FlakTower'),
  'flappybird': () => import('../games/FlappyBird/FlappyBird'),
  'flashclick': () => import('../games/Flashclick/Flashclick'),
  'flying3d': () => import('../games/Flying3d/Flying3d'),
  'foodfight': () => import('../games/Foodfight/Foodfight'),
  'forestadventure': () => import('../games/ForestAdventure/ForestAdventureGame'),
  'fractions': () => import('../games/Fractions/Fractions'),
  'friendquiz': () => import('../games/Friendquiz/Friendquiz'),
  'frogger': () => import('../games/Frogger/Frogger'),
  'fruitmatch': () => import('../games/Fruitmatch/Fruitmatch'),
  'fruitninja': () => import('../games/FruitNinja/FruitNinja'),
  'funnychallenge': () => import('../games/Funnychallenge/Funnychallenge'),
  'funnychallenges': () => import('../games/Funnychallenges/Funnychallenges'),
  'fusion2048': () => import('../games/Fusion2048/Fusion2048'),
  'galaga': () => import('../games/Galaga/Galaga'),
  'gamedev': () => import('../games/Gamedev/Gamedev'),
  'gardengarden': () => import('../games/GardenGarden/GardenGarden'),
  'gemblast': () => import('../games/GemBlast/GemBlast'),
  'geneedit': () => import('../games/Geneedit/Geneedit'),
  'geographypuzzle': () => import('../games/Geographypuzzle/Geographypuzzle'),
  'geometry': () => import('../games/Geometry/Geometry'),
  'geometrywars': () => import('../games/GeometryWars/GeometryWars'),
  'germanwhistle': () => import('../games/GermanWhistle/GermanWhistle'),
  'gifmaker': () => import('../games/GifMaker/GifMaker'),
  'gobang': () => import('../games/Gobang/Gobang'),
  'gobangai': () => import('../games/Gobangai/Gobangai'),
  'goldminer': () => import('../games/GoldMiner/GoldMiner'),
  'golf': () => import('../games/Golf/Golf'),
  'gomoku': () => import('../games/Gomoku/Gomoku'),
  'grammar': () => import('../games/Grammar/Grammar'),
  'guitarsim': () => import('../games/Guitarsim/Guitarsim'),
  'halloween': () => import('../games/Halloween/Halloween'),
  'hangman': () => import('../games/Hangman/Hangman'),
  'happyfarm': () => import('../games/HappyFarm/HappyFarm'),
  'hearts': () => import('../games/Hearts/Hearts'),
  'helicombat': () => import('../games/HeliCombat/HeliCombat'),
  'helicopter': () => import('../games/Helicopter/Helicopter'),
  'helicopterescape': () => import('../games/HelicopterEscape/HelicopterEscapeGame'),
  'hexgl': () => import('../games/HexGL/HexGL'),
  'hiddenpicture': () => import('../games/Hiddenpicture/Hiddenpicture'),
  'historytime': () => import('../games/Historytime/Historytime'),
  'holidayjigsaw': () => import('../games/Holidayjigsaw/Holidayjigsaw'),
  'hopchess': () => import('../games/HopChess/HopChess'),
  'horror': () => import('../games/Horror/Horror'),
  'horseracing': () => import('../games/Horseracing/Horseracing'),
  'hospitalmanage': () => import('../games/HospitalManage/HospitalManage'),
  'hospitalsimulator': () => import('../games/Hospitalsimulator/Hospitalsimulator'),
  'hotelempire': () => import('../games/HotelEmpire/HotelEmpire'),
  'housebuilder': () => import('../games/Housebuilder/Housebuilder'),
  'huarongdao': () => import('../games/HuarongDao/HuarongDao'),
  'humanaiteam': () => import('../games/Humanaiteam/Humanaiteam'),
  'iceagedefense': () => import('../games/IceAgeDefense/IceAgeDefense'),
  'iceblast': () => import('../games/Iceblast/Iceblast'),
  'icecreammaker': () => import('../games/Icecreammaker/Icecreammaker'),
  'icehockey': () => import('../games/IceHockey/IceHockey'),
  'icerun': () => import('../games/IceRun/IceRun'),
  'idiomchain': () => import('../games/IdiomChain/IdiomChain'),
  'idiomchainpro': () => import('../games/Idiomchainpro/Idiomchainpro'),
  'idlebreeding': () => import('../games/Idlebreeding/Idlebreeding'),
  'idlefarm': () => import('../games/IdleFarm/IdleFarm'),
  'idlefishing': () => import('../games/Idlefishing/Idlefishing'),
  'idleforest': () => import('../games/Idleforest/Idleforest'),
  'idleminer': () => import('../games/IdleMiner/IdleMiner'),
  'idlemining2': () => import('../games/Idlemining2/Idlemining2'),
  'idleracing': () => import('../games/IdleRacing/IdleRacing'),
  'idlespacestation': () => import('../games/Idlespacestation/Idlespacestation'),
  'illusionart': () => import('../games/Illusionart/Illusionart'),
  'impossibleobjects': () => import('../games/Impossibleobjects/Impossibleobjects'),
  'industrialtycoon': () => import('../games/Industrialtycoon/Industrialtycoon'),
  'intchess': () => import('../games/InternationalChess/InternationalChess'),
  'interactivemovie': () => import('../games/Interactivemovie/Interactivemovie'),
  'islandsurvival': () => import('../games/IslandSurvival/IslandSurvivalGame'),
  'jetupgrade': () => import('../games/JetUpgrade/JetUpgrade'),
  'jewelmatch': () => import('../games/Jewelmatch/Jewelmatch'),
  'jewelry': () => import('../games/Jewelry/Jewelry'),
  'juicebar': () => import('../games/Juicebar/Juicebar'),
  'junglesurvival': () => import('../games/Junglesurvival/Junglesurvival'),
  'karatechamp': () => import('../games/KarateChamp/KarateChamp'),
  'kingdomrush': () => import('../games/Kingdomrush/Kingdomrush'),
  'klotski': () => import('../games/Klotski/Klotski'),
  'knitting': () => import('../games/Knitting/Knitting'),
  'knowledgequiz': () => import('../games/Knowledgequiz/Knowledgequiz'),
  'kungfumaster': () => import('../games/Kungfumaster/Kungfumaster'),
  'laborday': () => import('../games/Laborday/Laborday'),
  'lantern': () => import('../games/Lantern/Lantern'),
  'laserdefense': () => import('../games/LaserDefense/LaserDefense'),
  'lavarun': () => import('../games/LavaRun/LavaRun'),
  'leather': () => import('../games/Leather/Leather'),
  'leftrightchoice': () => import('../games/Leftrightchoice/Leftrightchoice'),
  'libraryescape': () => import('../games/Libraryescape/Libraryescape'),
  'lightsout': () => import('../games/Lightsout/Lightsout'),
  'limbo': () => import('../games/Limbo/Limbo'),
  'linklink': () => import('../games/LinkLink/LinkLink'),
  'listening': () => import('../games/Listening/Listening'),
  'logicmath': () => import('../games/Logicmath/Logicmath'),
  'logicprogram': () => import('../games/Logicprogram/Logicprogram'),
  'logisticsprogram': () => import('../games/Logisticsprogram/Logisticsprogram'),
  'lovestory': () => import('../games/LoveStory/LoveStory'),
  'ludo': () => import('../games/Ludo/Ludo'),
  'ludo2': () => import('../games/Ludo2/Ludo2'),
  'magicacademy': () => import('../games/Magicacademy/Magicacademy'),
  'magicschool': () => import('../games/Magicschool/Magicschool'),
  'magictower': () => import('../games/MagicTower/MagicTower'),
  'mahjong': () => import('../games/Mahjong/Mahjong'),
  'marblematch': () => import('../games/Marblematch/Marblematch'),
  'marblemaze': () => import('../games/MarbleMaze/MarbleMaze'),
  'mathmaze': () => import('../games/Mathmaze/Mathmaze'),
  'mathquiz': () => import('../games/Mathquiz/Mathquiz'),
  'maze3d': () => import('../games/Maze3d/Maze3d'),
  'mazechase': () => import('../games/Mazechase/Mazechase'),
  'mazepuzzle': () => import('../games/Mazepuzzle/Mazepuzzle'),
  'meditation': () => import('../games/Meditation/Meditation'),
  'melodysynth': () => import('../games/Melodysynth/Melodysynth'),
  'memecreator': () => import('../games/MemeCreator/MemeCreator'),
  'memorymatch': () => import('../games/MemoryMatch/MemoryMatch'),
  'memorytraining': () => import('../games/Memorytraining/Memorytraining'),
  'microbelab': () => import('../games/Microbelab/Microbelab'),
  'midautumn': () => import('../games/Midautumn/Midautumn'),
  'militarychess': () => import('../games/MilitaryChess/MilitaryChess'),
  'minesweeper': () => import('../games/Minesweeper/Minesweeper'),
  'mirrorroom': () => import('../games/Mirrorroom/Mirrorroom'),
  'missilecommand': () => import('../games/MissileCommand/MissileCommand'),
  'monopoly': () => import('../games/Monopoly/Monopoly'),
  'monopoly2': () => import('../games/Monopoly2/Monopoly2'),
  'mope': () => import('../games/Mope/Mope'),
  'morningroutine': () => import('../games/Morningroutine/Morningroutine'),
  'mortalcombat': () => import('../games/Mortalcombat/Mortalcombat'),
  'motionaftereffect': () => import('../games/Motionaftereffect/Motionaftereffect'),
  'mountainclimber': () => import('../games/MountainClimber/MountainClimberGame'),
  'multiplayerarchery': () => import('../games/Multiplayerarchery/Multiplayerarchery'),
  'multiplayerracing': () => import('../games/Multiplayerracing/Multiplayerracing'),
  'multiplayershooting': () => import('../games/Multiplayershooting/Multiplayershooting'),
  'multiplayersoccer': () => import('../games/Multiplayersoccer/Multiplayersoccer'),
  'musicalchairs': () => import('../games/Musicalchairs/Musicalchairs'),
  'musicfighter': () => import('../games/MusicFighter/MusicFighter'),
  'musichero': () => import('../games/MusicHero/MusicHero'),
  'musicrelax': () => import('../games/Musicrelax/Musicrelax'),
  'musicstudio': () => import('../games/Musicstudio/Musicstudio'),
  'mystery': () => import('../games/Mystery/Mystery'),
  'nanotech': () => import('../games/Nanotech/Nanotech'),
  'nationalday': () => import('../games/Nationalday/Nationalday'),
  'negotiation': () => import('../games/Negotiation/Negotiation'),
  'neonparkour': () => import('../games/Neonparkour/Neonparkour'),
  'neverhaveiever': () => import('../games/Neverhaveiever/Neverhaveiever'),
  'nineball': () => import('../games/NineBall/NineBall'),
  'ninjaparkour': () => import('../games/Ninjaparkour/Ninjaparkour'),
  'noodlechef': () => import('../games/Noodlechef/Noodlechef'),
  'numberkeys': () => import('../games/Numberkeys/Numberkeys'),
  'numbermatch': () => import('../games/Numbermatch/Numbermatch'),
  'numberpuzzle': () => import('../games/NumberPuzzle/NumberPuzzle'),
  'numberslide': () => import('../games/NumberSlide/NumberSlide'),
  'oceanexplorer': () => import('../games/Oceanexplorer/Oceanexplorer'),
  'oceanworld': () => import('../games/Oceanworld/Oceanworld'),
  'oiltycoon': () => import('../games/OilTycoon/OilTycoon'),
  'onestroke': () => import('../games/OneStroke/OneStroke'),
  'onevone': () => import('../games/OneVOne/OneVOne'),
  'opticalillusion': () => import('../games/Opticalillusion/Opticalillusion'),
  'origami': () => import('../games/Origami/Origami'),
  'othello': () => import('../games/Othello/Othello'),
  'pacman': () => import('../games/Pacman/Pacman'),
  'parkour3d': () => import('../games/Parkour3d/Parkour3d'),
  'partychat': () => import('../games/Partychat/Partychat'),
  'partygames': () => import('../games/Partygames/Partygames'),
  'partygames2': () => import('../games/Partygames2/Partygames2'),
  'penaltykick': () => import('../games/PenaltyKick/PenaltyKickGame'),
  'periodictable': () => import('../games/Periodictable/Periodictable'),
  'physicslab': () => import('../games/Physicslab/Physicslab'),
  'pianosim': () => import('../games/Pianosim/Pianosim'),
  'pianotiles': () => import('../games/PianoTiles/PianoTiles'),
  'pilot': () => import('../games/Pilot/Pilot'),
  'pinball': () => import('../games/Pinball/Pinball'),
  'pinball3d': () => import('../games/Pinball3d/Pinball3d'),
  'pinballduo': () => import('../games/PinballDuo/PinballDuo'),
  'pinballmaster': () => import('../games/PinballMaster/PinballMaster'),
  'pinballphysics': () => import('../games/PinballPhysics/PinballPhysics'),
  'pingpong': () => import('../games/PingPong/PingPong'),
  'pipeconnect': () => import('../games/PipeConnect/PipeConnect'),
  'pixeladventure': () => import('../games/Pixeladventure/Pixeladventure'),
  'pixelart': () => import('../games/Pixelart/Pixelart'),
  'pixelbattle': () => import('../games/Pixelbattle/Pixelbattle'),
  'pixelcanvas': () => import('../games/PixelCanvas/PixelCanvas'),
  'pixelcity': () => import('../games/Pixelcity/Pixelcity'),
  'pixelfighter': () => import('../games/PixelFighter/PixelFighter'),
  'pixelmusic': () => import('../games/Pixelmusic/Pixelmusic'),
  'pixelplatformer': () => import('../games/Pixelplatformer/Pixelplatformer'),
  'pixelrpg': () => import('../games/Pixelrpg/Pixelrpg'),
  'pixelrpg2': () => import('../games/Pixelrpg2/Pixelrpg2'),
  'pixelshooter': () => import('../games/Pixelshooter/Pixelshooter'),
  'pixelsurvival': () => import('../games/Pixelsurvival/Pixelsurvival'),
  'pizzamaker': () => import('../games/Pizzamaker/Pizzamaker'),
  'plantcare': () => import('../games/Plantcare/Plantcare'),
  'plantgrowth': () => import('../games/Plantgrowth/Plantgrowth'),
  'plantswar': () => import('../games/Plantswar/Plantswar'),
  'pokemon': () => import('../games/PokeMon/PokeMon'),
  'policeduty': () => import('../games/Policeduty/Policeduty'),
  'pong': () => import('../games/Pong/Pong'),
  'pool3d': () => import('../games/Pool3d/Pool3d'),
  'pottery': () => import('../games/Pottery/Pottery'),
  'prisonbreak': () => import('../games/Prisonbreak/Prisonbreak'),
  'pvz': () => import('../games/PlantVsZombie/PlantVsZombie'),
  'python': () => import('../games/Python/Python'),
  'quantum': () => import('../games/Quantum/Quantum'),
  'quickmemory': () => import('../games/QuickMemory/QuickMemory'),
  'quickreflex': () => import('../games/QuickReflex/QuickReflex'),
  'quizrelay': () => import('../games/QuizRelay/QuizRelay'),
  'racing3d': () => import('../games/Racing3d/Racing3d'),
  'racingcar': () => import('../games/Racingcar/Racingcar'),
  'raftsurvival': () => import('../games/Raftsurvival/Raftsurvival'),
  'raidenenhanced': () => import('../games/RaidenEnhanced/RaidenEnhanced'),
  'randommaze': () => import('../games/Randommaze/Randommaze'),
  'reading': () => import('../games/Reading/Reading'),
  'readingtest': () => import('../games/Readingtest/Readingtest'),
  'restaurant': () => import('../games/Restaurant/Restaurant'),
  'restauranttycoon': () => import('../games/RestaurantTycoon/RestaurantTycoon'),
  'reversi': () => import('../games/Reversi/Reversi'),
  'rhythmmaster': () => import('../games/RhythmMaster/RhythmMaster'),
  'rhythmtap': () => import('../games/RhythmTap/RhythmTap'),
  'riddleguess': () => import('../games/RiddleGuess/RiddleGuess'),
  'ringtoss': () => import('../games/RingToss/RingToss'),
  'robotarena': () => import('../games/Robotarena/Robotarena'),
  'robotlab': () => import('../games/Robotlab/Robotlab'),
  'robotprogram': () => import('../games/Robotprogram/Robotprogram'),
  'rocketlaunch': () => import('../games/Rocketlaunch/Rocketlaunch'),
  'rollercoaster': () => import('../games/Rollercoaster/Rollercoaster'),
  'romance': () => import('../games/Romance/Romance'),
  'roomescape1': () => import('../games/Roomescape1/Roomescape1'),
  'rpgadventure': () => import('../games/Rpgadventure/Rpgadventure'),
  'sakuraparkour': () => import('../games/Sakuraparkour/Sakuraparkour'),
  'samuraislash': () => import('../games/SamuraiSlash/SamuraiSlash'),
  'sandart': () => import('../games/SandArt/SandArt'),
  'sandwichmaker': () => import('../games/Sandwichmaker/Sandwichmaker'),
  'schoolprincipal': () => import('../games/Schoolprincipal/Schoolprincipal'),
  'sciencelab': () => import('../games/Sciencelab/Sciencelab'),
  'sciencequiz': () => import('../games/Sciencequiz/Sciencequiz'),
  'scifi': () => import('../games/Scifi/Scifi'),
  'scifiadventure': () => import('../games/Scifiadventure/Scifiadventure'),
  'scratch': () => import('../games/Scratch/Scratch'),
  'sequencer': () => import('../games/Sequencer/Sequencer'),
  'shopmaster': () => import('../games/ShopMaster/ShopMaster'),
  'simpledraw': () => import('../games/SimpleDraw/SimpleDraw'),
  'skateboarding': () => import('../games/Skateboarding/Skateboarding'),
  'sketchout': () => import('../games/Sketchout/Sketchout'),
  'skiing': () => import('../games/Skiing/Skiing'),
  'slidingpuzzle': () => import('../games/Slidingpuzzle/Slidingpuzzle'),
  'slither': () => import('../games/Slither/Slither'),
  'snake': () => import('../games/Snake/Snake'),
  'snakebattle': () => import('../games/Snakebattle/Snakebattle'),
  'snakeduo': () => import('../games/SnakeDuo/SnakeDuo'),
  'snakeio': () => import('../games/SnakeIO/SnakeIO'),
  'snakeremake': () => import('../games/Snakeremake/Snakeremake'),
  'snooker': () => import('../games/Snooker/Snooker'),
  'snowparkour': () => import('../games/Snowparkour/Snowparkour'),
  'soapmaking': () => import('../games/Soapmaking/Soapmaking'),
  'sokoban': () => import('../games/Sokoban/Sokoban'),
  'solitaire': () => import('../games/Solitaire/Solitaire'),
  'soupchef': () => import('../games/Soupchef/Soupchef'),
  'spacebuild': () => import('../games/Spacebuild/Spacebuild'),
  'spacebullet': () => import('../games/SpaceBullet/SpaceBullet'),
  'spacecarrier': () => import('../games/SpaceCarrier/SpaceCarrier'),
  'spaceescape': () => import('../games/SpaceEscape/SpaceEscape'),
  'spaceexplore': () => import('../games/Spaceexplore/Spaceexplore'),
  'spaceexplorer': () => import('../games/Spaceexplorer/Spaceexplorer'),
  'spaceidle': () => import('../games/SpaceIdle/SpaceIdle'),
  'spaceinvaders': () => import('../games/Spaceinvaders/Spaceinvaders'),
  'spacepirate': () => import('../games/SpacePirate/SpacePirate'),
  'spaceshipescape': () => import('../games/Spaceshipescape/Spaceshipescape'),
  'spaceshooter': () => import('../games/SpaceShooter/SpaceShooter'),
  'spacestation': () => import('../games/Spacestation/Spacestation'),
  'spacetrader': () => import('../games/SpaceTrader/SpaceTrader'),
  'spades': () => import('../games/Spades/Spades'),
  'speaking': () => import('../games/Speaking/Speaking'),
  'speedescape': () => import('../games/SpeedEscape/SpeedEscape'),
  'speedmath': () => import('../games/Speedmath/Speedmath'),
  'springfestival': () => import('../games/Springfestival/Springfestival'),
  'spygame': () => import('../games/SpyGame/SpyGame'),
  'squadron': () => import('../games/Squadron/Squadron'),
  'starfighter': () => import('../games/StarFighter/StarFighter'),
  'starve': () => import('../games/Starve/Starve'),
  'stereogram': () => import('../games/Stereogram/Stereogram'),
  'stickmanhook': () => import('../games/StickmanHook/StickmanHook'),
  'storychoice': () => import('../games/StoryChoice/StoryChoice'),
  'storychoicenew': () => import('../games/Storychoicenew/Storychoicenew'),
  'streetfighter': () => import('../games/Streetfighter/Streetfighter'),
  'subway': () => import('../games/Subway/Subway'),
  'subway2': () => import('../games/Subway2/Subway2'),
  'sudoku': () => import('../games/Sudoku/Sudoku'),
  'sudokuvariants': () => import('../games/Sudokuvariants/Sudokuvariants'),
  'sumowrestle': () => import('../games/Sumowrestle/Sumowrestle'),
  'surfing': () => import('../games/Surfing/Surfing'),
  'surfing3d': () => import('../games/Surfing3d/Surfing3d'),
  'sushimaker': () => import('../games/Sushimaker/Sushimaker'),
  'swordio': () => import('../games/SwordIO/SwordIO'),
  'tangram': () => import('../games/Tangram/Tangram'),
  'tankbattle': () => import('../games/TankBattle/TankBattle'),
  'taxidriver': () => import('../games/Taxidriver/Taxidriver'),
  'teacher': () => import('../games/Teacher/Teacher'),
  'tekken': () => import('../games/Tekken/Tekken'),
  'templeescape': () => import('../games/Templeescape/Templeescape'),
  'templerun': () => import('../games/TempleRun/TempleRun'),
  'territoryio': () => import('../games/TerritoryIO/TerritoryIO'),
  'tetris': () => import('../games/Tetris/Tetris'),
  'tetris3d': () => import('../games/Tetris3d/Tetris3d'),
  'tetris99': () => import('../games/Tetris99/Tetris99'),
  'tetrisbattle': () => import('../games/TetrisBattle/TetrisBattle'),
  'texaspoker': () => import('../games/TexasPoker/TexasPoker'),
  'textdungeon': () => import('../games/TextDungeon/TextDungeon'),
  'threekingdoms': () => import('../games/ThreeKingdoms/ThreeKingdoms'),
  'thunder': () => import('../games/Thunder/Thunder'),
  'tictactoebattle': () => import('../games/Tictactoebattle/Tictactoebattle'),
  'tictactoemaster': () => import('../games/Tictactoemaster/Tictactoemaster'),
  'timemachine': () => import('../games/Timemachine/Timemachine'),
  'timestable': () => import('../games/Timestable/Timestable'),
  'timezone': () => import('../games/Timezone/Timezone'),
  'tower3d': () => import('../games/Tower3d/Tower3d'),
  'towerdefense': () => import('../games/TowerDefense/TowerDefense'),
  'tracelight': () => import('../games/TraceLight/TraceLight'),
  'trainconductor': () => import('../games/Trainconductor/Trainconductor'),
  'traindriver': () => import('../games/Traindriver/Traindriver'),
  'translatechallenge': () => import('../games/Translatechallenge/Translatechallenge'),
  'triviaquiz': () => import('../games/Triviaquiz/Triviaquiz'),
  'truckdriver': () => import('../games/Truckdriver/Truckdriver'),
  'truthdare': () => import('../games/TruthDare/TruthDare'),
  'twotruths': () => import('../games/Twotruths/Twotruths'),
  'typingadvance': () => import('../games/Typingadvance/Typingadvance'),
  'typingmaster': () => import('../games/TypingMaster/TypingMaster'),
  'typingmasterpro': () => import('../games/Typingmasterpro/Typingmasterpro'),
  'unblockme': () => import('../games/Unblockme/Unblockme'),
  'undersealab': () => import('../games/Undersealab/Undersealab'),
  'underwater': () => import('../games/Underwater/Underwater'),
  'unocard': () => import('../games/UnoCard/UnoCard'),
  'valentine': () => import('../games/Valentine/Valentine'),
  'vampirestory': () => import('../games/Vampirestory/Vampirestory'),
  'vet': () => import('../games/Vet/Vet'),
  'virtualpet': () => import('../games/VirtualPet/VirtualPet'),
  'visiontrack': () => import('../games/Visiontrack/Visiontrack'),
  'vocabulary': () => import('../games/Vocabulary/Vocabulary'),
  'vocoder': () => import('../games/Vocoder/Vocoder'),
  'vrgame': () => import('../games/Vrgame/Vrgame'),
  'waterphysics': () => import('../games/WaterPhysics/WaterPhysics'),
  'waterrun': () => import('../games/WaterRun/WaterRun'),
  'webdev': () => import('../games/Webdev/Webdev'),
  'werewolf': () => import('../games/Werewolf/Werewolf'),
  'whackamole': () => import('../games/WhackAMole/WhackAMole'),
  'wildsafari': () => import('../games/Wildsafari/Wildsafari'),
  'woodworking': () => import('../games/Woodworking/Woodworking'),
  'wordart': () => import('../games/Wordart/Wordart'),
  'wordcross': () => import('../games/Wordcross/Wordcross'),
  'wordmemory': () => import('../games/Wordmemory/Wordmemory'),
  'wordpuzzle': () => import('../games/Wordpuzzle/Wordpuzzle'),
  'wordscramble': () => import('../games/Wordscramble/Wordscramble'),
  'wordsearch': () => import('../games/WordSearch/WordSearch'),
  'wordspell': () => import('../games/WordSpell/WordSpell'),
  'wouldyourather': () => import('../games/Wouldyourather/Wouldyourather'),
  'wrestlemania': () => import('../games/WrestleMania/WrestleMania'),
  'writing': () => import('../games/Writing/Writing'),
  'ww2airwar': () => import('../games/WW2Airwar/WW2Airwar'),
  'ww2fighter': () => import('../games/WW2Fighter/WW2Fighter'),
  'zombiedefense': () => import('../games/Zombiedefense/Zombiedefense'),
  'zombieshooter': () => import('../games/ZombieShooter/ZombieShooter'),
  'zombiesurvival': () => import('../games/ZombieSurvival/ZombieSurvivalGame'),
  'zooescape': () => import('../games/Zooescape/Zooescape'),
  'zootycoon': () => import('../games/Zootycoon/Zootycoon'),
  'zuma': () => import('../games/Zuma/Zuma'),
};

function GamePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [GameComponent, setGameComponent] = useState<React.ComponentType<any> | null>(null);
  
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
          if (Component) {
            setGameComponent(() => Component);
          } else {
            setGameComponent(null);
          }
        } catch (error) {
          console.warn(`Failed to load game ${id}, using placeholder:`, error);
          setGameComponent(null);
        }
      } else {
        setGameComponent(null);
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
