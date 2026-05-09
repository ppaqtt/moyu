import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ZombieSurvivalEngine, {
  GameState,
  Zombie,
  Weapon,
  Item,
  NEON_COLORS
} from './engine';

interface Props {
  onExit?: () => void;
}

const ZombieSurvivalGame: React.FC<Props> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ZombieSurvivalEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [message, setMessage] = useState<string>('');
  const [showInventory, setShowInventory] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const tileSize = 25;

  // 初始化游戏引擎
  useEffect(() => {
    const engine = new ZombieSurvivalEngine();
    engineRef.current = engine;

    engine.onStateChange((state) => {
      setGameState(state);
    });

    engine.onGameOver((score) => {
      setMessage(`游戏结束！得分: ${score}`);
    });

    engine.onVictory((score) => {
      setMessage(`胜利！得分: ${score}`);
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

        switch (tile.type) {
          case 'grass':
            ctx.fillStyle = NEON_COLORS.grass;
            break;
          case 'road':
            ctx.fillStyle = NEON_COLORS.road;
            break;
          case 'building':
            ctx.fillStyle = NEON_COLORS.building;
            break;
          case 'water':
            ctx.fillStyle = '#1a3a5c';
            break;
          case 'forest':
            ctx.fillStyle = '#1a4a1a';
            break;
          default:
            ctx.fillStyle = NEON_COLORS.grass;
        }
        ctx.fillRect(px, py, tileSize, tileSize);

        // 绘制建筑图标
        if (tile.building && !tile.building.looted) {
          ctx.font = `${tileSize * 0.7}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const icons: Record<string, string> = {
            house: '🏠',
            shop: '🏪',
            hospital: '🏥',
            police: '🚔',
            warehouse: '🏭'
          };
          ctx.fillText(icons[tile.building.type] || '🏢', px + tileSize / 2, py + tileSize / 2);
        }

        // 绘制格子边框
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, tileSize, tileSize);
      }
    }

    // 绘制安全区
    ctx.strokeStyle = `${NEON_COLORS.success}40`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      gameState.safeZone.x * tileSize + tileSize / 2,
      gameState.safeZone.y * tileSize + tileSize / 2,
      gameState.safeZone.radius * tileSize,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    // 绘制僵尸
    gameState.zombies.forEach(zombie => {
      const zx = zombie.x * tileSize;
      const zy = zombie.y * tileSize;

      // 僵尸身体
      const colors: Record<string, string> = {
        walker: NEON_COLORS.zombie,
        runner: '#ff8800',
        tank: '#880000',
        spitter: '#00ff00'
      };
      ctx.fillStyle = colors[zombie.type] || NEON_COLORS.zombie;
      ctx.fillRect(zx + 2, zy + 2, tileSize - 4, tileSize - 4);

      // 僵尸图标
      ctx.font = `${tileSize * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icons: Record<string, string> = {
        walker: '🧟',
        runner: '🏃',
        tank: '💪',
        spitter: '🤢'
      };
      ctx.fillText(icons[zombie.type] || '🧟', zx + tileSize / 2, zy + tileSize / 2);

      // 血条
      const healthPercent = zombie.health / (zombie.type === 'tank' ? 100 : zombie.type === 'walker' ? 30 : 25);
      ctx.fillStyle = '#333';
      ctx.fillRect(zx, zy - 4, tileSize, 3);
      ctx.fillStyle = healthPercent > 0.5 ? NEON_COLORS.success : NEON_COLORS.danger;
      ctx.fillRect(zx, zy - 4, tileSize * healthPercent, 3);
    });

    // 绘制玩家
    const px = gameState.position.x * tileSize;
    const py = gameState.position.y * tileSize;

    // 玩家光晕
    ctx.fillStyle = `${NEON_COLORS.primary}30`;
    ctx.beginPath();
    ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 玩家身体
    ctx.fillStyle = NEON_COLORS.primary;
    ctx.fillRect(px + 3, py + 3, tileSize - 6, tileSize - 6);

    // 玩家图标
    ctx.font = `${tileSize * 0.7}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧑', px + tileSize / 2, py + tileSize / 2);

    // 武器范围指示
    if (gameState.equippedWeapon) {
      ctx.strokeStyle = `${NEON_COLORS.accent}40`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(
        px + tileSize / 2,
        py + tileSize / 2,
        gameState.equippedWeapon.range * tileSize,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
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
        case ' ':
        case 'Enter':
          // 近战攻击
          engineRef.current.attack(0, 0);
          break;
        case 'e':
        case 'E':
          // 搜索建筑
          const loot = engineRef.current.searchBuilding();
          if (loot.length > 0) {
            setMessage(`搜刮到: ${loot.map(l => l.name).join(', ')}`);
          } else {
            setMessage('这里没有可搜刮的物品');
          }
          break;
        case 'i':
        case 'I':
          setShowInventory(prev => !prev);
          break;
        case 'r':
        case 'R':
          if (engineRef.current.reload()) {
            setMessage('装弹完成');
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
          const weaponIndex = parseInt(e.key) - 1;
          const weapons = gameState?.weapons || [];
          if (weapons[weaponIndex]) {
            engineRef.current.switchWeapon(weapons[weaponIndex].id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // 鼠标控制
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current || gameState?.gameOver || gameState?.victory) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / tileSize);
    const y = Math.floor((e.clientY - rect.top) / tileSize);

    // 射击或移动
    const dx = x - gameState.position.x;
    const dy = y - gameState.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (gameState.equippedWeapon?.ammo !== undefined && dist <= gameState.equippedWeapon.range) {
      engineRef.current.shoot(x, y);
    }
  }, [gameState]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePos({
      x: Math.floor((e.clientX - rect.left) / tileSize),
      y: Math.floor((e.clientY - rect.top) / tileSize)
    });
  }, []);

  // 自动清除消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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
    setShowInventory(false);
  }, []);

  if (!gameState) {
    return <div className="flex items-center justify-center h-screen text-white">加载中...</div>;
  }

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
            border: `1px solid ${NEON_COLORS.danger}40`
          }}
        >
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold" style={{ color: NEON_COLORS.danger }}>
              末日生存
            </h1>
            <div className="flex gap-4">
              <span style={{ color: NEON_COLORS.textMuted }}>第 {gameState.day} 天</span>
              <span style={{ color: NEON_COLORS.textMuted }}>{Math.floor(gameState.time)}:00</span>
              <span style={{ color: NEON_COLORS.zombie }}>波次: {gameState.wave}</span>
              <span style={{ color: NEON_COLORS.accent }}>击杀: {gameState.kills}</span>
              <span style={{ color: NEON_COLORS.success }}>得分: {gameState.score}</span>
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
              border: `1px solid ${NEON_COLORS.danger}30`
            }}
          >
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              className="rounded-xl mx-auto cursor-crosshair"
              style={{
                boxShadow: `0 0 30px ${NEON_COLORS.danger}20`,
                maxWidth: '100%'
              }}
            />

            {/* 控制按钮 */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => engineRef.current?.attack(0, 0)}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.danger}30`,
                  border: `1px solid ${NEON_COLORS.danger}`,
                  color: NEON_COLORS.danger
                }}
              >
                攻击 (空格)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const loot = engineRef.current?.searchBuilding();
                  if (loot && loot.length > 0) {
                    setMessage(`搜刮到: ${loot.map(l => l.name).join(', ')}`);
                  } else {
                    setMessage('这里没有可搜刮的物品');
                  }
                }}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.accent}30`,
                  border: `1px solid ${NEON_COLORS.accent}`,
                  color: NEON_COLORS.accent
                }}
              >
                搜刮 (E)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => engineRef.current?.reload()}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.primary}30`,
                  border: `1px solid ${NEON_COLORS.primary}`,
                  color: NEON_COLORS.primary
                }}
              >
                装弹 (R)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowInventory(true)}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.secondary}30`,
                  border: `1px solid ${NEON_COLORS.secondary}`,
                  color: NEON_COLORS.secondary
                }}
              >
                背包 (I)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onExit}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.warning}30`,
                  border: `1px solid ${NEON_COLORS.warning}`,
                  color: NEON_COLORS.warning
                }}
              >
                退出
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
                border: `1px solid ${NEON_COLORS.danger}30`
              }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.danger }}>
                生存状态
              </h3>
              <div className="space-y-3">
                <StatBar label="生命值" value={gameState.stats.health} color={NEON_COLORS.danger} icon="❤️" />
                <StatBar label="体力值" value={gameState.stats.stamina} color={NEON_COLORS.success} icon="⚡" />
                <StatBar label="饥饿值" value={gameState.stats.hunger} color={NEON_COLORS.warning} icon="🍖" />
                <StatBar label="感染值" value={gameState.stats.infection} color={NEON_COLORS.zombie} icon="☣️" />
              </div>
            </motion.div>

            {/* 武器装备 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.danger}30`
              }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
                武器装备
              </h3>
              <div className="space-y-2">
                {gameState.weapons.map((weapon, index) => (
                  <motion.div
                    key={weapon.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => engineRef.current?.switchWeapon(weapon.id)}
                    className="p-2 rounded-xl flex items-center gap-3 cursor-pointer"
                    style={{
                      background: gameState.equippedWeapon?.id === weapon.id
                        ? `${NEON_COLORS.primary}30`
                        : `${NEON_COLORS.surface}80`,
                      border: `1px solid ${gameState.equippedWeapon?.id === weapon.id ? NEON_COLORS.primary : 'transparent'}`
                    }}
                  >
                    <span className="text-2xl">{weapon.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: NEON_COLORS.text }}>
                        {index + 1}. {weapon.name}
                      </div>
                      <div className="text-xs" style={{ color: NEON_COLORS.textMuted }}>
                        伤害: {weapon.damage} | 射程: {weapon.range}
                      </div>
                    </div>
                    {weapon.ammo !== undefined && (
                      <div className="text-sm font-mono" style={{ color: NEON_COLORS.accent }}>
                        {weapon.ammo}/{weapon.maxAmmo}
                      </div>
                    )}
                    <div
                      className="w-16 h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: `${NEON_COLORS.warning}30` }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: weapon.durability > 30 ? NEON_COLORS.success : NEON_COLORS.danger,
                          width: `${(weapon.durability / (weapon.maxAmmo ? 100 : 50)) * 100}%`
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 快捷物品栏 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.danger}30`
              }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.success }}>
                快捷物品
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {gameState.inventory.slice(0, 8).map((item, index) => (
                  <motion.button
                    key={`${item.id}-${index}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleUseItem(item.id)}
                    className="p-2 rounded-xl text-center relative"
                    style={{
                      background: `${NEON_COLORS.surface}80`,
                      border: `1px solid ${NEON_COLORS.success}40`
                    }}
                    title={item.name}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center"
                      style={{
                        background: NEON_COLORS.success,
                        color: NEON_COLORS.background
                      }}
                    >
                      {item.quantity}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* 操作说明 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.danger}30`
              }}
            >
              <h3 className="text-lg font-bold mb-2" style={{ color: NEON_COLORS.primary }}>
                操作说明
              </h3>
              <div className="text-sm space-y-1" style={{ color: NEON_COLORS.textMuted }}>
                <p>WASD/方向键 - 移动</p>
                <p>空格/Enter - 近战攻击</p>
                <p>鼠标点击 - 射击</p>
                <p>E - 搜刮建筑</p>
                <p>R - 装弹</p>
                <p>I - 打开背包</p>
                <p>1-6 - 切换武器</p>
              </div>
            </motion.div>
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
                border: `1px solid ${NEON_COLORS.danger}`,
                color: NEON_COLORS.danger
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
                  border: `1px solid ${NEON_COLORS.danger}`
                }}
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-4" style={{ color: NEON_COLORS.danger }}>
                  背包
                </h2>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {gameState.inventory.map((item, index) => (
                    <motion.button
                      key={`${item.id}-${index}`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        handleUseItem(item.id);
                        if (item.effect) setShowInventory(false);
                      }}
                      className="p-3 rounded-xl text-center relative"
                      style={{
                        background: `${NEON_COLORS.surface}80`,
                        border: `1px solid ${NEON_COLORS.success}40`
                      }}
                    >
                      <span className="text-3xl">{item.icon}</span>
                      <div className="text-xs mt-1" style={{ color: NEON_COLORS.textMuted }}>
                        {item.name}
                      </div>
                      <span
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full text-xs flex items-center justify-center"
                        style={{
                          background: NEON_COLORS.success,
                          color: NEON_COLORS.background
                        }}
                      >
                        {item.quantity}
                      </span>
                    </motion.button>
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
                  {gameState.victory ? '🎉 胜利!' : '💀 游戏结束'}
                </h2>
                <p className="text-2xl mb-2" style={{ color: NEON_COLORS.text }}>
                  最终得分: {gameState.score}
                </p>
                <p className="text-lg mb-2" style={{ color: NEON_COLORS.textMuted }}>
                  存活天数: {gameState.day}
                </p>
                <p className="text-lg mb-6" style={{ color: NEON_COLORS.textMuted }}>
                  击杀僵尸: {gameState.kills}
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

export default ZombieSurvivalGame;
