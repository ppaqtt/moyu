
const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'src', 'games');
const excludeFiles = ['index.ts', 'index.ts.backup', 'PlaceholderGame.tsx'];

console.log('Scanning games directory...');

// 扫描游戏目录
const gameDirs = fs.readdirSync(gamesDir).filter(file => {
  const filePath = path.join(gamesDir, file);
  return fs.statSync(filePath).isDirectory() && !excludeFiles.includes(file);
});

console.log(`Found ${gameDirs.length} game directories`);

const gameMappings = [];

// 处理每个游戏目录
for (const dir of gameDirs) {
  const dirPath = path.join(gamesDir, dir);
  const tsxFiles = fs.readdirSync(dirPath).filter(f => f.endsWith('.tsx'));
  
  let componentFile = null;
  
  // 查找合适的组件文件
  if (tsxFiles.length > 0) {
    // 优先找与目录名相同的文件
    const directMatch = tsxFiles.find(f => f.replace('.tsx', '') === dir);
    if (directMatch) {
      componentFile = directMatch;
    } else {
      // 否则使用第一个文件
      componentFile = tsxFiles[0];
    }
  }
  
  if (componentFile) {
    const componentName = componentFile.replace('.tsx', '');
    const gameId = componentName.charAt(0).toLowerCase() + componentName.slice(1);
    
    gameMappings.push({
      gameId,
      componentName,
      componentPath: `${dir}/${componentName}`
    });
  }
}

console.log(`Processed ${gameMappings.length} valid games`);

// 生成 GAME_PATH_MAP
const pathMapContent = gameMappings.map(m => 
  `  '${m.gameId}': '${m.componentPath}'`
).join(',\n');

// 生成 switch-case 语句
const switchContent = gameMappings.map(m => 
  `    case '${m.componentPath}': return (await import('../games/${m.componentPath}')).default;`
).join('\n');

// 读取模板文件
const gameTsxPath = path.join(__dirname, 'src', 'pages', 'Game.tsx');
let templateContent = `import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParticleBg from '../components/ParticleBg';
import { GAMES_LIST, NEON_COLORS } from '../utils/constants';

const GAME_PATH_MAP: Record<string, string> = {
${pathMapContent}
};

const loadGameComponent = async (gamePath: string) => {
  switch (gamePath) {
${switchContent}
    default: return (await import('../games/PlaceholderGame')).default;
  }
};

function GamePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [GameComponent, setGameComponent] = useState<any>(null);
  
  const game = GAMES_LIST.find(g => g.id === id);
  
  const handleExit = () => {
    navigate('/');
  };

  useEffect(() => {
    if (!id) return;
    
    const loadGame = async () => {
      try {
        const gamePath = GAME_PATH_MAP[id];
        if (gamePath) {
          const component = await loadGameComponent(gamePath);
          setGameComponent(() => component);
        } else {
          const component = await import('../games/PlaceholderGame');
          setGameComponent(() => component.default);
        }
      } catch (error) {
        console.error('Failed to load game:', error);
        const component = await import('../games/PlaceholderGame');
        setGameComponent(() => component.default);
      } finally {
        setLoading(false);
      }
    };

    loadGame();
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
              background: \`linear-gradient(135deg, \${NEON_COLORS.neonCyan}, \${NEON_COLORS.neonPurple})\`, 
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBg />
      <div className="relative z-10">
        {GameComponent ? (
          <GameComponent
            gameId={game?.id}
            gameName={game?.name}
            category={game?.category}
            onExit={handleExit}
            onScoreUpdate={(score: number) => id && localStorage.setItem(\`game_score_\${id}\`, score.toString())}
            onGameOver={(finalScore: number) => {
              if (id) {
                const currentHighScore = parseInt(localStorage.getItem(\`game_highscore_\${id}\`) || '0');
                if (finalScore > currentHighScore) {
                  localStorage.setItem(\`game_highscore_\${id}\`, finalScore.toString());
                }
              }
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

export default GamePage;
`;

fs.writeFileSync(gameTsxPath, templateContent);
console.log('Successfully generated src/pages/Game.tsx!');

console.log('\nDone! You can now run npm run build to test.');
