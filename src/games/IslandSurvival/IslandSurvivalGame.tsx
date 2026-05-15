import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IslandSurvivalEngine, {
  GameState,
  Resource,
  CraftingRecipe,
  NEON_COLORS
} from './engine';

interface Props {
  onExit?: () => void;
}

const IslandSurvivalGame: React.FC<Props> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<IslandSurvivalEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showCrafting, setShowCrafting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [tileSize, setTileSize] = useState(30);

  // 初始化游戏引擎
  useEffect(() => {
    const engine = new IslandSurvivalEngine();
    engineRef.current = engine;

    engine.onStateChange((state) => {
      setGameState(state);
    });

    engine.onGameOver((score) => {
      setMessage(`游戏结束！得分: ${score}`);
    });

    engine.onVictory((score) => {
      setMessage(`恭喜逃脱！得分: ${score}`);
    });

    engine.start();
    setGameState(engine.getState());

    return () => {
      // 清理
    };
  }, []);

  // 渲染游戏画面
  useEffect(() => {
    if (!canvasRef.current || !gameState) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布大小
    const mapSize = gameState.map.length;
    const size = Math.min(600, window.innerWidth - 40);
    const newTileSize = Math.floor(size / mapSize);
    setTileSize(newTileSize);
    canvas.width = newTileSize * mapSize;
    canvas.height = newTileSize * mapSize;

    // 清空画布
    ctx.fillStyle = NEON_COLORS.water;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制地图
    for (let x = 0; x < mapSize; x++) {
      for (let y = 0; y < mapSize; y++) {
        const tile = gameState.map[x][y];
        const px = x * newTileSize;
        const py = y * newTileSize;

        if (!tile.explored && (x !== gameState.position.x || y !== gameState.position.y)) {
          // 未探索区域显示为迷雾
          ctx.fillStyle = '#000000';
          ctx.fillRect(px, py, newTileSize, newTileSize);
          continue;
        }

        // 绘制地形
        switch (tile.type) {
          case 'water':
            ctx.fillStyle = NEON_COLORS.water;
            break;
          case 'sand':
            ctx.fillStyle = NEON_COLORS.sand;
            break;
          case 'grass':
            ctx.fillStyle = '#228b22';
            break;
          case 'forest':
            ctx.fillStyle = NEON_COLORS.leaf;
            break;
          case 'rock':
            ctx.fillStyle = NEON_COLORS.rock;
            break;
          case 'mountain':
            ctx.fillStyle = '#666666';
            break;
          default:
            ctx.fillStyle = NEON_COLORS.water;
        }
        ctx.fillRect(px, py, newTileSize, newTileSize);

        // 绘制资源图标
        if (tile.resources.length > 0) {
          ctx.font = `${newTileSize * 0.6}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            tile.resources[0].icon,
            px + newTileSize / 2,
            py + newTileSize / 2
          );
        }

        // 绘制格子边框
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, newTileSize, newTileSize);
      }
    }

    // 绘制玩家
    const playerX = gameState.position.x * newTileSize;
    const playerY = gameState.position.y * newTileSize;
    ctx.fillStyle = NEON_COLORS.primary;
    ctx.beginPath();
    ctx.arc(
      playerX + newTileSize / 2,
      playerY + newTileSize / 2,
      newTileSize * 0.3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 绘制玩家光晕效果
    ctx.strokeStyle = NEON_COLORS.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      playerX + newTileSize / 2,
      playerY + newTileSize / 2,
      newTileSize * 0.4,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    // 绘制视野范围
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      playerX + newTileSize / 2,
      playerY + newTileSize / 2,
      newTileSize * 3,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }, [gameState]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current || gameState?.gameOver || gameState?.victory) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          engineRef.current.move(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          engineRef.current.move(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          engineRef.current.move(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          engineRef.current.move(1, 0);
          break;
        case 'g':
        case 'G':
          const gathered = engineRef.current.gather();
          if (gathered.length > 0) {
            setMessage(`收集到: ${gathered.map(g => g.name).join(', ')}`);
          }
          break;
        case 'f':
        case 'F':
          const fish = engineRef.current.fish();
          if (fish) {
            setMessage(`捕到一条鱼!`);
          } else {
            setMessage('没有捕到鱼...');
          }
          break;
        case 'r':
        case 'R':
          engineRef.current.rest();
          setMessage('休息了一会儿');
          break;
        case 'c':
        case 'C':
          setShowCrafting(true);
          break;
        case 'h':
        case 'H':
        case '?':
          setShowHelp(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [gameState]);

  // 自动清除消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleCraft = useCallback((recipeId: string) => {
    if (!engineRef.current) return;
    const success = engineRef.current.craft(recipeId);
    if (success) {
      setMessage('制作成功!');
    } else {
      setMessage('材料不足!');
    }
  }, []);

  const handleUseItem = useCallback((resourceId: string) => {
    if (!engineRef.current) return;
    const success = engineRef.current.useItem(resourceId);
    if (success) {
      setMessage('使用了物品');
    }
  }, []);

  const handleReset = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.reset();
    setMessage('');
    setShowCrafting(false);
  }, []);

  if (!gameState) {
    return <div className="flex items-center justify-center h-screen text-white">加载中...</div>;
  }

  const recipes = engineRef.current?.getAvailableRecipes() || [];

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: NEON_COLORS.background }}>
      <div className="max-w-7xl mx-auto">
        {/* 标题栏 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${NEON_COLORS.surface}80, ${NEON_COLORS.surface}40)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${NEON_COLORS.primary}40`
          }}
        >
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold" style={{ color: NEON_COLORS.primary }}>
              荒岛求生
            </h1>
            <div className="flex gap-4">
              <span style={{ color: NEON_COLORS.textMuted }}>第 {gameState.day} 天</span>
              <span style={{ color: NEON_COLORS.textMuted }}>{Math.floor(gameState.time)}:00</span>
              <span style={{ color: NEON_COLORS.accent }}>得分: {gameState.score}</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 游戏画布 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 p-4 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${NEON_COLORS.primary}30`
            }}
          >
            <canvas
              ref={canvasRef}
              className="rounded-xl mx-auto"
              style={{
                boxShadow: `0 0 30px ${NEON_COLORS.primary}20`,
                maxWidth: '100%'
              }}
            />

            {/* 控制按钮 */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => engineRef.current?.gather()}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.success}30`,
                  border: `1px solid ${NEON_COLORS.success}`,
                  color: NEON_COLORS.success
                }}
              >
                收集 (G)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => engineRef.current?.fish()}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.water}30`,
                  border: `1px solid ${NEON_COLORS.water}`,
                  color: NEON_COLORS.water
                }}
              >
                捕鱼 (F)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => engineRef.current?.rest()}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.secondary}30`,
                  border: `1px solid ${NEON_COLORS.secondary}`,
                  color: NEON_COLORS.secondary
                }}
              >
                休息 (R)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCrafting(true)}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.accent}30`,
                  border: `1px solid ${NEON_COLORS.accent}`,
                  color: NEON_COLORS.accent
                }}
              >
                制作 (C)
              </motion.button>
            </div>
          </motion.div>

          {/* 侧边栏 */}
          <div className="space-y-4">
            {/* 生存状态 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.primary}30`
              }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
                生存状态
              </h3>
              <div className="space-y-3">
                <StatBar label="生命值" value={gameState.stats.health} color={NEON_COLORS.danger} icon="❤️" />
                <StatBar label="饥饿值" value={gameState.stats.hunger} color={NEON_COLORS.warning} icon="🍖" />
                <StatBar label="口渴值" value={gameState.stats.thirst} color={NEON_COLORS.water} icon="💧" />
                <StatBar label="体力值" value={gameState.stats.energy} color={NEON_COLORS.success} icon="⚡" />
                <StatBar label="理智值" value={gameState.stats.sanity} color={NEON_COLORS.secondary} icon="🧠" />
              </div>
            </motion.div>

            {/* 背包 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.primary}30`
              }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
                背包
              </h3>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {gameState.inventory.length === 0 ? (
                  <p className="col-span-4 text-center py-4" style={{ color: NEON_COLORS.textMuted }}>
                    背包是空的
                  </p>
                ) : (
                  gameState.inventory.map((item, index) => (
                    <motion.button
                      key={`${item.id}-${index}`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleUseItem(item.id)}
                      className="p-2 rounded-xl text-center relative"
                      style={{
                        background: `${NEON_COLORS.surface}80`,
                        border: `1px solid ${NEON_COLORS.primary}40`
                      }}
                      title={item.name}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center"
                        style={{
                          background: NEON_COLORS.primary,
                          color: NEON_COLORS.background
                        }}
                      >
                        {item.quantity}
                      </span>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>

            {/* 操作说明 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.primary}30`
              }}
            >
              <h3 className="text-lg font-bold mb-2" style={{ color: NEON_COLORS.primary }}>
                操作说明
              </h3>
              <div className="text-sm space-y-1" style={{ color: NEON_COLORS.textMuted }}>
                <p>WASD/方向键 - 移动</p>
                <p>G - 收集资源</p>
                <p>F - 捕鱼 (需在沙滩)</p>
                <p>R - 休息恢复</p>
                <p>C - 打开制作界面</p>
                <p>点击背包物品使用</p>
              </div>
            </motion.div>

            {/* 退出按钮 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onExit}
              className="w-full p-3 rounded-xl font-medium"
              style={{
                background: `${NEON_COLORS.danger}30`,
                border: `1px solid ${NEON_COLORS.danger}`,
                color: NEON_COLORS.danger
              }}
            >
              退出游戏
            </motion.button>
          </div>
        </div>

        {/* 消息提示 */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-2xl"
              style={{
                background: `${NEON_COLORS.surface}90`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.primary}`,
                color: NEON_COLORS.primary
              }}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 制作界面 */}
        <AnimatePresence>
          {showCrafting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
              onClick={() => setShowCrafting(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="p-6 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                style={{
                  background: `linear-gradient(135deg, ${NEON_COLORS.surface}, ${NEON_COLORS.background})`,
                  border: `1px solid ${NEON_COLORS.primary}`
                }}
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-4" style={{ color: NEON_COLORS.primary }}>
                  制作物品
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recipes.map(recipe => (
                    <div
                      key={recipe.id}
                      className="p-4 rounded-xl"
                      style={{
                        background: `${NEON_COLORS.surface}60`,
                        border: `1px solid ${NEON_COLORS.primary}40`
                      }}
                    >
                      <h3 className="font-bold mb-1" style={{ color: NEON_COLORS.text }}>
                        {recipe.name}
                      </h3>
                      <p className="text-sm mb-2" style={{ color: NEON_COLORS.textMuted }}>
                        {recipe.description}
                      </p>
                      <div className="text-sm mb-3" style={{ color: NEON_COLORS.textMuted }}>
                        需要:
                        {recipe.ingredients.map(ing => {
                          const has = gameState.inventory.find(r => r.id === ing.resourceId);
                          const hasEnough = (has?.quantity || 0) >= ing.quantity;
                          return (
                            <span
                              key={ing.resourceId}
                              className="ml-2"
                              style={{ color: hasEnough ? NEON_COLORS.success : NEON_COLORS.danger }}
                            >
                              {ing.resourceId} x{ing.quantity}
                            </span>
                          );
                        })}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCraft(recipe.id)}
                        className="w-full p-2 rounded-lg font-medium"
                        style={{
                          background: `${NEON_COLORS.primary}30`,
                          border: `1px solid ${NEON_COLORS.primary}`,
                          color: NEON_COLORS.primary
                        }}
                      >
                        制作
                      </motion.button>
                    </div>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCrafting(false)}
                  className="w-full mt-4 p-3 rounded-xl font-medium"
                  style={{
                    background: `${NEON_COLORS.danger}30`,
                    border: `1px solid ${NEON_COLORS.danger}`,
                    color: NEON_COLORS.danger
                  }}
                >
                  关闭
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 游戏结束/胜利界面 */}
        <AnimatePresence>
          {(gameState.gameOver || gameState.victory) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="p-8 rounded-3xl text-center"
                style={{
                  background: `linear-gradient(135deg, ${NEON_COLORS.surface}, ${NEON_COLORS.background})`,
                  border: `2px solid ${gameState.victory ? NEON_COLORS.success : NEON_COLORS.danger}`
                }}
              >
                <h2
                  className="text-4xl font-bold mb-4"
                  style={{ color: gameState.victory ? NEON_COLORS.success : NEON_COLORS.danger }}
                >
                  {gameState.victory ? '🎉 逃脱成功!' : '💀 游戏结束'}
                </h2>
                <p className="text-2xl mb-2" style={{ color: NEON_COLORS.text }}>
                  最终得分: {gameState.score}
                </p>
                <p className="text-lg mb-6" style={{ color: NEON_COLORS.textMuted }}>
                  存活天数: {gameState.day}
                </p>
                <div className="flex gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReset}
                    className="px-6 py-3 rounded-xl font-medium"
                    style={{
                      background: `${NEON_COLORS.primary}30`,
                      border: `1px solid ${NEON_COLORS.primary}`,
                      color: NEON_COLORS.primary
                    }}
                  >
                    重新开始
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onExit}
                    className="px-6 py-3 rounded-xl font-medium"
                    style={{
                      background: `${NEON_COLORS.danger}30`,
                      border: `1px solid ${NEON_COLORS.danger}`,
                      color: NEON_COLORS.danger
                    }}
                  >
                    退出
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// 状态条组件
interface StatBarProps {
  label: string;
  value: number;
  color: string;
  icon: string;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, color, icon }) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-sm" style={{ color: NEON_COLORS.textMuted }}>
        {icon} {label}
      </span>
      <span className="text-sm font-mono" style={{ color }}>
        {Math.floor(value)}
      </span>
    </div>
    <div
      className="h-2 rounded-full overflow-hidden"
      style={{ backgroundColor: `${color}30` }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.3 }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  </div>
);

export default IslandSurvivalGame;
