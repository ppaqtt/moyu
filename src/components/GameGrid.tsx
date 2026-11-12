import type { GameMeta } from '../utils/constants';
import GameCard from './GameCard';

interface GameGridProps {
  games: GameMeta[];
  favorites: string[];
  onOpen: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
  emptyTitle?: string;
  emptyHint?: string;
}

export default function GameGrid({
  games,
  favorites,
  onOpen,
  onToggleFavorite,
  emptyTitle = '没有找到匹配的游戏',
  emptyHint = '换个关键词，或切换分类再试试',
}: GameGridProps) {
  if (games.length === 0) {
    return (
      <div
        className="w-full max-w-xl mx-auto rounded-3xl p-10 text-center backdrop-blur-xl"
        style={{ background: 'rgba(26, 26, 46, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
      >
        <div className="text-5xl mb-4">🫧</div>
        <div className="text-lg font-bold mb-2" style={{ color: 'rgba(255,255,255,0.85)' }}>{emptyTitle}</div>
        <div className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{emptyHint}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 w-full">
      {games.map((game, index) => (
        <GameCard
          key={game.id}
          game={game}
          index={index}
          isFavorite={favorites.includes(game.id)}
          onOpen={onOpen}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
