
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function main() {
  const gamesDir = join(__dirname, 'src', 'games');
  const entries = await readdir(gamesDir, { withFileTypes: true });
  
  // 获取所有游戏目录
  const gameDirs = entries
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .map(entry => entry.name)
    .sort();

  console.log(`找到 ${gameDirs.length} 个游戏目录`);

  // 生成导入语句
  const imports: string[] = [];
  const componentMap: { [key: string]: string } = {};

  for (const dir of gameDirs) {
    const componentName = dir;
    imports.push(`import ${componentName} from '../games/${dir}/${componentName}';`);
    componentMap[dir.toLowerCase()] = componentName;
  }

  // 生成 GAME_COMPONENTS 对象
  const gameEntries = Object.entries(componentMap)
    .map(([id, name]) => `    '${id}': ${name},`)
    .join('\n');

  // 读取原始的 Game.tsx 作为基础
  let baseFile = await readFile(join(__dirname, 'src', 'pages', 'Game.tsx'), 'utf-8');
  
  // 只保留必要的内容
  let output = `import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParticleBg from '../components/ParticleBg';
${imports.join('\n')}
import PlaceholderGame from '../games/PlaceholderGame';
import { GAMES_LIST, NEON_COLORS } from '../utils/constants';

function UniversalGame({ gameId }: { gameId: string }) {
  const navigate = useNavigate();
  
  const game = GAMES_LIST.find(g => g.id === gameId);
  
  const handleExit = () => {
    navigate('/');
  };

  const GAME_COMPONENTS: Record<string, React.ComponentType<any>> = {
${gameEntries}
  };

  const GameComponent = GAME_COMPONENTS[gameId];

  if (!game) {
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
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>游戏未找到</h1>
          <p className="text-lg opacity-70 mb-6">找不到游戏: {gameId}</p>
          <motion.button 
            onClick={handleExit} 
            className="px-6 py-3 rounded-xl font-bold"
            style={{ 
              background: \`linear-gradient(135deg, \${NEON_COLORS.neonCyan}, \${NEON_COLORS.neonPurple})\`, 
              color: '#ffffff', 
              boxShadow: \`0 0 20px \${NEON_COLORS.neonCyan}50\` 
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

  if (GameComponent) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ParticleBg />
        <div className="relative z-10">
          <GameComponent onExit={handleExit} />
        </div>
      </div>
    );
  }

  return (
    <PlaceholderGame
      gameId={game.id}
      gameName={game.name}
      category={game.category}
      onScoreUpdate={(score) => localStorage.setItem(\`game_score_\${gameId}\`, score.toString())}
      onGameOver={(finalScore) => {
        const currentHighScore = parseInt(localStorage.getItem(\`game_highscore_\${gameId}\`) || '0');
        if (finalScore > currentHighScore) {
          localStorage.setItem(\`game_highscore_\${gameId}\`, finalScore.toString());
        }
      }}
      onExit={handleExit}
    />
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
          <h1 className="text-3xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>未找到游戏</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <ParticleBg />
      <div className="relative z-10">
        <UniversalGame gameId={id} />
      </div>
    </div>
  );
}`;

  // 写回文件
  await writeFile(join(__dirname, 'src', 'pages', 'Game.tsx'), output, 'utf-8');
  
  console.log('✅ 已更新 src/pages/Game.tsx！');
  console.log(`✅ 已包含 ${gameDirs.length} 个真实游戏`);
}

main().catch(console.error);
