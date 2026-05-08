import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { GAME_IDS } from '../utils/constants';

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
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-3xl font-bold mb-4 text-white">游戏加载中...</h1>
            <button
              onClick={handleExit}
              className="px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              返回首页
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {renderGame()}
    </div>
  );
}

export default function Game() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4 text-white">未找到游戏</h1>
      </div>
    );
  }

  return <GameContainer gameId={id} />;
}
