import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ForestAdventureEngine, {
  GameState,
  Item,
  Monster,
  Quest,
  NEON_COLORS
} from './engine';

interface Props {
  onExit?: () => void;
}

const ForestAdventureGame: React.FC<Props> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ForestAdventureEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [message, setMessage] = useState<string>('');
  const [showInventory, setShowInventory] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const tileSize = 28;

  // 初始化游戏引擎
  useEffect(() => {
    const engine = new ForestAdventureEngine();
    engineRef.current = engine;

    engine.onStateChange((state) => {
      setGameState(state);
    });

    engine.onGameOver((score) => {
      setMessage(`游戏结束！得分: ${score}`);
    });

    engine.onVictory((score) => {
      setMessage(`恭喜通关！得分: ${score}`);
    });

    engine.onLevelUp((level) => {
      setMessage(`升级！等级 ${level}`);
    });

    engine.start();
    setGameState(engine.getState());

    return () => {};
  }, []);

  // 渲染游戏画面
  useEffect(() => {
    if (!canvasRef.current || !gameState) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mapWidth = gameState.map.length;
    const mapHeight = gameState.map[0].length;
    canvas.width = mapWidth * tileSize;
    canvas.height = mapHeight * tileSize;

    // 清空画布
    ctx.fillStyle = NEON_COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制地图
    for (let x = 0; x < mapWidth; x++) {
      for (let y = 0; y < mapHeight; y++) {
        const tile = gameState.map[x][y];
        const px = x * tileSize;
        const py = y * tileSize;

        if (!tile.explored) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(px, py, tileSize, tileSize);
          continue;
        }

        // 绘制地形
        switch (tile.type) {
          case 'forest':
            ctx.fillStyle = NEON_COLORS.forest;
            break;
          case 'path':
            ctx.fillStyle = NEON_COLORS.path;
            break;
          case 'water':
            ctx.fillStyle = NEON_COLORS.water;
            break;
          case 'cave':
            ctx.fillStyle = '#4a4a4a';
            break;
          case 'clearing':
            ctx.fillStyle = '#3a7a3a';
            break;
          case 'bridge':
            ctx.fillStyle = '#8b4513';
            break;
          default:
            ctx.fillStyle = NEON_COLORS.forest;
        }
        ctx.fillRect(px, py, tileSize, tileSize);

        // 绘制地形图标
        ctx.font = `${tileSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const terrainIcons: Record<string, string> = {
          forest: '🌲',
          path: '',
          water: '💧',
          cave: '🕳️',
          clearing: '🌿',
          bridge: '🌉'
        };
        if (terrainIcons[tile.type]) {
          ctx.fillText(terrainIcons[tile.type], px + tileSize / 2, py + tileSize / 2);
        }

        // 绘制物品
        if (tile.item) {
          ctx.font = `${tileSize * 0.7}px Arial`;
          ctx.fillText(tile.item.icon, px + tileSize / 2, py + tileSize / 2);
        }

        // 绘制怪物
        if (tile.monster && !tile.monster.defeated) {
          ctx.font = `${tileSize * 0.7}px Arial`;
          ctx.fillText(tile.monster.icon, px + tileSize / 2, py + tileSize / 2);
        }

        // 绘制谜题
        if (tile.puzzle && !tile.puzzle.solved) {
          const puzzleIcons: Record<string, string> = {
            lever: '🔧',
            button: '🔘',
            chest: '📦',
            door: '🚪'
          };
          ctx.font = `${tileSize * 0.6}px Arial`;
          ctx.fillText(puzzleIcons[tile.puzzle.type] || '❓', px + tileSize / 2, py + tileSize / 2);
        }

        // 绘制格子边框
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, tileSize, tileSize);
      }
    }

    // 绘制玩家
    const px = gameState.position.x * tileSize;
    const py = gameState.position.y * tileSize;

    // 玩家光晕
    ctx.fillStyle = `${NEON_COLORS.primary}30`;
    ctx.beginPath();
    ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 2, 0, Math.PI * 2);
    ctx.fill();

    // 玩家身体
    ctx.fillStyle = NEON_COLORS.primary;
    ctx.fillRect(px + 3, py + 3, tileSize - 6, tileSize - 6);

    // 玩家图标
    ctx.font = `${tileSize * 0.7}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧙', px + tileSize / 2, py + tileSize / 2);
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
          const item = engineRef.current.pickup();
          if (item) {
            setMessage(`拾取了 ${item.name} x${item.quantity}`);
          }
          break;
        case 'f':
        case 'F':
          const result = engineRef.current.fight();
          if (result) {
            const { monster, damageDealt, damageTaken } = result;
            setCombatLog(prev => [
              `对 ${monster.name} 造成 ${damageDealt} 伤害`,
              `受到 ${damageTaken} 伤害`,
              ...prev.slice(0, 4)
            ]);
            if (monster.defeated) {
              setMessage(`击败了 ${monster.name}！获得 ${monster.experience} 经验`);
            }
          }
          break;
        case 'e':
        case 'E':
          const puzzleResult = engineRef.current.solvePuzzle();
          if (puzzleResult.success) {
            setMessage(puzzleResult.reward 
              ? `解开了谜题！获得 ${puzzleResult.reward.name}` 
              : '解开了谜题！');
          } else {
            setMessage('无法解开这个谜题');
          }
          break;
        case 'i':
        case 'I':
          setShowInventory(prev => !prev);
          break;
        case 'q':
        case 'Q':
          setShowQuests(prev => !prev);
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

  const handleEquipItem = useCallback((itemId: string) => {
    if (!engineRef.current) return;
    const success = engineRef.current.equipItem(itemId);
    if (success) {
      setMessage('装备成功');
    }
  }, []);

  const handleUseItem = useCallback((itemId: string) => {
    if (!engineRef.current) return;
    const success = engineRef.current.useItem(itemId);
    if (success) {
      setMessage('使用了物品');
    }
  }, []);

  const handleReset = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.reset();
    setMessage('');
    setCombatLog([]);
    setShowInventory(false);
    setShowQuests(false);
  }, []);

  if (!gameState) {
    return <div className="flex items-center justify-center h-screen text-white">加载中...</div>;
  }

  const currentTile = gameState.map[gameState.position.x][gameState.position.y];
  const expNeeded = gameState.stats.level * 100;
  const expPercent = (gameState.stats.experience / expNeeded) * 100;

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
            border: `1px solid ${NEON_COLORS.forest}40`
          }}
        >
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold" style={{ color: NEON_COLORS.forest }}>
              森林冒险
            </h1>
            <div className="flex gap-4">
              <span style={{ color: NEON_COLORS.textMuted }}>深度: {gameState.depth}</span>
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
              border: `1px solid ${NEON_COLORS.forest}30`
            }}
          >
            <canvas
              ref={canvasRef}
              className="rounded-xl mx-auto"
              style={{
                boxShadow: `0 0 30px ${NEON_COLORS.forest}20`,
                maxWidth: '100%'
              }}
            />

            {/* 控制按钮 */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => engineRef.current?.pickup()}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.success}30`,
                  border: `1px solid ${NEON_COLORS.success}`,
                  color: NEON_COLORS.success
                }}
              >
                拾取 (G)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => engineRef.current?.fight()}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.danger}30`,
                  border: `1px solid ${NEON_COLORS.danger}`,
                  color: NEON_COLORS.danger
                }}
              >
                战斗 (F)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => engineRef.current?.solvePuzzle()}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.accent}30`,
                  border: `1px solid ${NEON_COLORS.accent}`,
                  color: NEON_COLORS.accent
                }}
              >
                互动 (E)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowInventory(true)}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.primary}30`,
                  border: `1px solid ${NEON_COLORS.primary}`,
                  color: NEON_COLORS.primary
                }}
              >
                背包 (I)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowQuests(true)}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.secondary}30`,
                  border: `1px solid ${NEON_COLORS.secondary}`,
                  color: NEON_COLORS.secondary
                }}
              >
                任务 (Q)
              </motion.button>
            </div>

            {/* 战斗日志 */}
            {combatLog.length > 0 && (
              <div className="mt-4 p-3 rounded-xl" style={{ background: `${NEON_COLORS.surface}80` }}>
                <h4 className="text-sm font-bold mb-2" style={{ color: NEON_COLORS.danger }}>战斗记录</h4>
                <div className="space-y-1">
                  {combatLog.map((log, index) => (
                    <p key={index} className="text-xs" style={{ color: NEON_COLORS.textMuted }}>{log}</p>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* 侧边栏 */}
          <div className="space-y-4">
            {/* 角色状态 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.forest}30`
              }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.forest }}>
                角色状态
              </h3>
              <div className="space-y-3">
                <StatBar label="生命值" value={gameState.stats.health} maxValue={100 + (gameState.stats.level - 1) * 20} color={NEON_COLORS.danger} icon="❤️" />
                <StatBar label="能量值" value={gameState.stats.energy} maxValue={100} color={NEON_COLORS.success} icon="⚡" />
                
                {/* 经验条 */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm" style={{ color: NEON_COLORS.textMuted }}>
                      ⭐ 等级 {gameState.stats.level}
                    </span>
                    <span className="text-sm font-mono" style={{ color: NEON_COLORS.accent }}>
                      {gameState.stats.experience}/{expNeeded}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${NEON_COLORS.accent}30` }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${expPercent}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: NEON_COLORS.accent }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 装备 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.forest}30`
              }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
                装备
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-xl" style={{ background: `${NEON_COLORS.surface}80` }}>
                  <span className="text-2xl">{gameState.equippedWeapon?.icon || '👊'}</span>
                  <div>
                    <div className="text-sm font-medium" style={{ color: NEON_COLORS.text }}>
                      武器: {gameState.equippedWeapon?.name || '空手'}
                    </div>
                    <div className="text-xs" style={{ color: NEON_COLORS.textMuted }}>
                      伤害: {gameState.equippedWeapon?.effect?.value || 10}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-xl" style={{ background: `${NEON_COLORS.surface}80` }}>
                  <span className="text-2xl">{gameState.equippedArmor?.icon || '👕'}</span>
                  <div>
                    <div className="text-sm font-medium" style={{ color: NEON_COLORS.text }}>
                      护甲: {gameState.equippedArmor?.name || '无'}
                    </div>
                    <div className="text-xs" style={{ color: NEON_COLORS.textMuted }}>
                      防御: {gameState.equippedArmor?.effect?.value || 0}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 当前位置信息 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.forest}30`
              }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.warning }}>
                当前位置
              </h3>
              <div className="space-y-2 text-sm" style={{ color: NEON_COLORS.textMuted }}>
                <p>地形: {currentTile?.type === 'forest' ? '森林' : currentTile?.type === 'path' ? '小路' : currentTile?.type === 'water' ? '水域' : currentTile?.type === 'cave' ? '洞穴' : currentTile?.type === 'clearing' ? '空地' : '桥梁'}</p>
                {currentTile?.item && <p style={{ color: NEON_COLORS.treasure }}>物品: {currentTile.item.icon} {currentTile.item.name}</p>}
                {currentTile?.monster && !currentTile.monster.defeated && <p style={{ color: NEON_COLORS.monster }}>怪物: {currentTile.monster.icon} {currentTile.monster.name} (HP: {currentTile.monster.health})</p>}
                {currentTile?.puzzle && !currentTile.puzzle.solved && <p style={{ color: NEON_COLORS.accent }}>谜题: {currentTile.puzzle.type === 'lever' ? '拉杆' : currentTile.puzzle.type === 'button' ? '按钮' : currentTile.puzzle.type === 'chest' ? '宝箱' : '门'}</p>}
              </div>
            </motion.div>

            {/* 任务进度 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.forest}30`
              }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.secondary }}>
                任务进度
              </h3>
              <div className="space-y-2">
                {gameState.quests.slice(0, 3).map(quest => (
                  <div key={quest.id} className="flex items-center gap-2">
                    <span style={{ color: quest.completed ? NEON_COLORS.success : NEON_COLORS.textMuted }}>
                      {quest.completed ? '✓' : '○'}
                    </span>
                    <span className="text-sm" style={{ color: quest.completed ? NEON_COLORS.success : NEON_COLORS.textMuted }}>
                      {quest.name}
                    </span>
                  </div>
                ))}
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
                border: `1px solid ${NEON_COLORS.forest}`,
                color: NEON_COLORS.forest
              }}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 背包界面 */}
        <AnimatePresence>
          {showInventory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
              onClick={() => setShowInventory(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="p-6 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                style={{
                  background: `linear-gradient(135deg, ${NEON_COLORS.surface}, ${NEON_COLORS.background})`,
                  border: `1px solid ${NEON_COLORS.forest}`
                }}
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-4" style={{ color: NEON_COLORS.forest }}>
                  背包
                </h2>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {gameState.inventory.map((item, index) => (
                    <motion.div
                      key={`${item.id}-${index}`}
                      className="p-3 rounded-xl text-center relative"
                      style={{
                        background: item.equipped ? `${NEON_COLORS.primary}30` : `${NEON_COLORS.surface}80`,
                        border: `1px solid ${item.equipped ? NEON_COLORS.primary : NEON_COLORS.forest}40`
                      }}
                    >
                      <span className="text-3xl">{item.icon}</span>
                      <div className="text-xs mt-1" style={{ color: NEON_COLORS.textMuted }}>
                        {item.name}
                      </div>
                      <span
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full text-xs flex items-center justify-center"
                        style={{
                          background: NEON_COLORS.forest,
                          color: NEON_COLORS.background
                        }}
                      >
                        {item.quantity}
                      </span>
                      {(item.type === 'weapon' || item.type === 'armor') && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEquipItem(item.id)}
                          className="mt-2 px-2 py-1 rounded text-xs"
                          style={{
                            background: item.equipped ? NEON_COLORS.success : NEON_COLORS.primary,
                            color: NEON_COLORS.background
                          }}
                        >
                          {item.equipped ? '已装备' : '装备'}
                        </motion.button>
                      )}
                      {item.type === 'potion' && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleUseItem(item.id)}
                          className="mt-2 px-2 py-1 rounded text-xs"
                          style={{
                            background: NEON_COLORS.success,
                            color: NEON_COLORS.background
                          }}
                        >
                          使用
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowInventory(false)}
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

        {/* 任务界面 */}
        <AnimatePresence>
          {showQuests && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
              onClick={() => setShowQuests(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="p-6 rounded-2xl max-w-xl w-full"
                style={{
                  background: `linear-gradient(135deg, ${NEON_COLORS.surface}, ${NEON_COLORS.background})`,
                  border: `1px solid ${NEON_COLORS.secondary}`
                }}
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-4" style={{ color: NEON_COLORS.secondary }}>
                  任务列表
                </h2>
                <div className="space-y-3">
                  {gameState.quests.map(quest => (
                    <div
                      key={quest.id}
                      className="p-3 rounded-xl"
                      style={{
                        background: quest.completed ? `${NEON_COLORS.success}20` : `${NEON_COLORS.surface}80`,
                        border: `1px solid ${quest.completed ? NEON_COLORS.success : NEON_COLORS.secondary}40`
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: quest.completed ? NEON_COLORS.success : NEON_COLORS.secondary }}>
                          {quest.completed ? '✓' : '○'}
                        </span>
                        <span className="font-medium" style={{ color: quest.completed ? NEON_COLORS.success : NEON_COLORS.text }}>
                          {quest.name}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: NEON_COLORS.textMuted }}>{quest.description}</p>
                      <p className="text-xs mt-1" style={{ color: NEON_COLORS.accent }}>
                        奖励: {quest.reward.type === 'experience' ? `${quest.reward.value} 经验` : `${quest.reward.value} 分`}
                      </p>
                    </div>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowQuests(false)}
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
                  {gameState.victory ? '🎉 通关成功!' : '💀 游戏结束'}
                </h2>
                <p className="text-2xl mb-2" style={{ color: NEON_COLORS.text }}>
                  最终得分: {gameState.score}
                </p>
                <p className="text-lg mb-2" style={{ color: NEON_COLORS.textMuted }}>
                  等级: {gameState.stats.level}
                </p>
                <p className="text-lg mb-6" style={{ color: NEON_COLORS.textMuted }}>
                  探索深度: {gameState.depth}
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
  maxValue: number;
  color: string;
  icon: string;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, maxValue, color, icon }) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-sm" style={{ color: NEON_COLORS.textMuted }}>
        {icon} {label}
      </span>
      <span className="text-sm font-mono" style={{ color }}>
        {Math.floor(value)}/{maxValue}
      </span>
    </div>
    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${color}30` }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / maxValue) * 100}%` }}
        transition={{ duration: 0.3 }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  </div>
);

export default ForestAdventureGame;
