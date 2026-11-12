import { motion } from 'framer-motion';
import type { GameMeta } from '../utils/constants';
import { getCategoryName } from '../data/categories';

const ACCENTS = ['#ff6b9d', '#00d2ff', '#a855f7', '#22c55e', '#f97316', '#eab308'];

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

interface GameCardProps {
  game: GameMeta;
  index: number;
  isFavorite: boolean;
  onOpen: (gameId: string) => void;
  onToggleFavorite: (gameId: string) => void;
}

export default function GameCard({ game, index, isFavorite, onOpen, onToggleFavorite }: GameCardProps) {
  const accent = ACCENTS[index % ACCENTS.length];
  const categoryName = getCategoryName(game.category);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index, 11) * 0.03, duration: 0.28 }}
    >
      <motion.div
        className="cursor-pointer group relative h-full"
        whileHover={{ scale: 1.03, y: -5 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onOpen(game.id)}
      >
        <div
          className="relative rounded-3xl p-5 overflow-hidden backdrop-blur-xl h-full"
          style={{
            background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(15, 15, 26, 0.95))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 0%, ${accent}15, transparent 60%)` }}
          />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: `linear-gradient(135deg, ${accent}30, ${accent}10)`, border: `1px solid ${accent}50` }}
              >
                {game.icon}
              </div>
              <motion.button
                type="button"
                aria-label={isFavorite ? `取消收藏 ${game.name}` : `收藏 ${game.name}`}
                title={isFavorite ? '取消收藏' : '收藏'}
                className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                style={{
                  background: isFavorite ? 'rgba(255, 215, 0, 0.16)' : 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${isFavorite ? 'rgba(255, 215, 0, 0.55)' : 'rgba(255, 255, 255, 0.12)'}`,
                  color: isFavorite ? '#ffd700' : 'rgba(255, 255, 255, 0.55)',
                }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                onClick={event => {
                  event.stopPropagation();
                  onToggleFavorite(game.id);
                }}
              >
                {isFavorite ? '★' : '☆'}
              </motion.button>
            </div>

            <h3
              className="text-lg font-bold mb-1.5 truncate"
              style={{
                fontFamily: "'Noto Sans SC', sans-serif",
                background: 'linear-gradient(135deg, #ffffff, #a0a0a0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              title={game.name}
            >
              {game.name}
            </h3>

            <p className="text-sm mb-4 leading-relaxed line-clamp-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {game.description || `${categoryName}小游戏，点开即玩`}
            </p>

            <div className="flex flex-wrap gap-1.5">
              <span
                className="text-xs px-2.5 py-1 rounded-lg font-medium"
                style={{ backgroundColor: `${accent}1f`, color: accent, border: `1px solid ${accent}40` }}
              >
                {categoryName}
              </span>
              <span
                className="text-xs px-2.5 py-1 rounded-lg font-medium"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {DIFFICULTY_LABEL[game.difficulty] ?? game.difficulty}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
