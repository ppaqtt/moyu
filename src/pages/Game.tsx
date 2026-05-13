import React, { useEffect, useState, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParticleBg from '../components/ParticleBg';
import { GAMES_LIST, NEON_COLORS } from '../utils/constants';
import PlaceholderGame from '../games/PlaceholderGame';

// 主要游戏的显式导入（避免内存问题，只导入最受欢迎的）
import Game2048 from '../games/Game2048/Game2048';
import Snake from '../games/Snake/Snake';
import Tetris from '../games/Tetris/Tetris';
import FlappyBird from '../games/FlappyBird/FlappyBird';
import Minesweeper from '../games/Minesweeper/Minesweeper';
import Pacman from '../games/Pacman/Pacman';

// 游戏ID到组件的映射
const GAME_COMPONENTS: Record<string, React.ComponentType<any>> = {
  '2048': Game2048,
  'snake': Snake,
  'tetris': Tetris,
  'flappybird': FlappyBird,
  'minesweeper': Minesweeper,
  'pacman': Pacman,
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
    
    // 检查是否有预定义的游戏组件
    if (GAME_COMPONENTS[id]) {
      setGameComponent(() => GAME_COMPONENTS[id]);
    } else {
      // 对于其他游戏，我们将使用占位游戏，或者尝试动态导入（稍后实现）
      setGameComponent(() => PlaceholderGame);
    }
    
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

  const ComponentToRender = GameComponent || PlaceholderGame;

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
