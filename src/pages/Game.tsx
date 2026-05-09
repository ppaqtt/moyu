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
