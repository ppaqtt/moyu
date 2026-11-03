export interface GameMeta {
  id: string;
  name: string;
  icon: string;
  category: string;
  difficulty: string;
  primary: string;
  secondary: string;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'won' | 'lost';

export interface EngineProps {
  meta: GameMeta;
  onScore?: (score: number) => void;
  onGameOver?: (score: number) => void;
  onExit?: () => void;
}

export type Genre =
  | 'quiz'
  | 'match3'
  | 'memory'
  | 'word'
  | 'maze'
  | 'runner'
  | 'shooter'
  | 'tower'
  | 'board'
  | 'card'
  | 'tycoon'
  | 'rhythm'
  | 'drawing'
  | 'puzzle'
  | 'reaction'
  | 'snake'
  | 'g2048'
  | 'breakout'
  | 'flappy'
  | 'dodge'
  | 'platformer'
  | 'timing'
  | 'fighter'
  | 'racing'
  | 'story';
