import React from 'react';
import { resolveGenre, resolveMeta } from './theme';
import type { EngineProps } from './types';
import QuizGame from './engines/QuizGame';
import Match3Game from './engines/Match3Game';
import MemoryGame from './engines/MemoryGame';
import WordGame from './engines/WordGame';
import MazeGame from './engines/MazeGame';
import RunnerGame from './engines/RunnerGame';
import ShooterGame from './engines/ShooterGame';
import TowerDefenseGame from './engines/TowerDefenseGame';
import BoardGame from './engines/BoardGame';
import CardGame from './engines/CardGame';
import TycoonGame from './engines/TycoonGame';
import RhythmGame from './engines/RhythmGame';
import DrawingGame from './engines/DrawingGame';
import PuzzleGame from './engines/PuzzleGame';
import ReactionGame from './engines/ReactionGame';
import SnakeGame from './engines/SnakeGame';
import Game2048 from './engines/Game2048';
import BreakoutGame from './engines/BreakoutGame';
import FlappyGame from './engines/FlappyGame';
import DodgeGame from './engines/DodgeGame';
import PlatformerGame from './engines/PlatformerGame';
import TimingGame from './engines/TimingGame';
import FighterGame from './engines/FighterGame';
import RacingGame from './engines/RacingGame';
import StoryGame from './engines/StoryGame';

interface GameRendererProps {
  gameId?: string;
  gameName?: string;
  category?: string;
  icon?: string;
  difficulty?: string;
  primary?: string;
  secondary?: string;
  onExit?: () => void;
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
}

const ENGINES: Record<string, React.ComponentType<EngineProps>> = {
  quiz: QuizGame,
  match3: Match3Game,
  memory: MemoryGame,
  word: WordGame,
  maze: MazeGame,
  runner: RunnerGame,
  shooter: ShooterGame,
  tower: TowerDefenseGame,
  board: BoardGame,
  card: CardGame,
  tycoon: TycoonGame,
  rhythm: RhythmGame,
  drawing: DrawingGame,
  puzzle: PuzzleGame,
  reaction: ReactionGame,
  snake: SnakeGame,
  g2048: Game2048,
  breakout: BreakoutGame,
  flappy: FlappyGame,
  dodge: DodgeGame,
  platformer: PlatformerGame,
  timing: TimingGame,
  fighter: FighterGame,
  racing: RacingGame,
  story: StoryGame,
};

export default function GameRenderer(props: GameRendererProps) {
  const meta = resolveMeta(props);
  const genre = resolveGenre(meta);
  const Engine = ENGINES[genre] || QuizGame;
  return (
    <Engine
      meta={meta}
      onExit={props.onExit}
      onScore={props.onScoreUpdate}
      onGameOver={props.onGameOver}
    />
  );
}
