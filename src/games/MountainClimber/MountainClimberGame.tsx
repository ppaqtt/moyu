import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MountainClimberEngine, {
  GameState,
  Equipment,
  Obstacle,
  RoutePoint,
  NEON_COLORS
} from './engine';

interface Props {
  onExit?: () => void;
}

const MountainClimberGame: React.FC<Props> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MountainClimberEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [message, setMessage] = useState<string>('');
  const [showEquipment, setShowEquipment] = useState(false);

  // 初始化游戏引擎
  useEffect(() => {
    const engine = new MountainClimberEngine();
    engineRef.current = engine;

    engine.onStateChange((state) => {
      setGameState(state);
    });

    engine.onGameOver((score) => {
      setMessage(`攀登失败！得分: ${score}`);
    });

    engine.onVictory((score) => {
      setMessage(`成功登顶！得分: ${score}`);
    });

    engine.onCheckpoint((altitude) => {
      setMessage(`到达检查点！海拔 ${Math.floor(altitude)}m`);
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

    canvas.width = 400;
    canvas.height = 600;

    // 清空画布 - 天空渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a3a5c');
    gradient.addColorStop(0.5, '#4a6a8c');
    gradient.addColorStop(1, '#8aaabc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制山峰轮廓
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    
    // 根据海拔绘制不同的山体
    const progress = gameState.altitude / 8848;
    const mountainHeight = canvas.height * (0.3 + progress * 0.5);
    
    ctx.lineTo(100, canvas.height - mountainHeight * 0.5);
    ctx.lineTo(200, canvas.height - mountainHeight);
    ctx.lineTo(300, canvas.height - mountainHeight * 0.6);
    ctx.lineTo(400, canvas.height);
    ctx.closePath();

    // 山体颜色根据海拔变化
    if (gameState.altitude > 5000) {
      ctx.fillStyle = '#ffffff'; // 雪线以上
    } else if (gameState.altitude > 3000) {
      ctx.fillStyle = '#cccccc'; // 高海拔岩石
    } else {
      ctx.fillStyle = '#8b7355'; // 低海拔岩石
    }
    ctx.fill();

    // 绘制攀登路线
    ctx.strokeStyle = NEON_COLORS.primary;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(200, canvas.height);
    
    // 绘制已攀登的路线
    const climbProgress = progress;
    const currentY = canvas.height - mountainHeight * climbProgress;
    ctx.lineTo(200, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制检查点
    gameState.route.forEach((point, index) => {
      if (point.type === 'checkpoint' || point.type === 'summit') {
        const pointProgress = point.elevation / 8848;
        const pointY = canvas.height - mountainHeight * pointProgress;
        const pointX = 200 + Math.sin(index) * 30;

        ctx.fillStyle = point.visited ? NEON_COLORS.success : NEON_COLORS.warning;
        ctx.beginPath();
        ctx.arc(pointX, pointY, 8, 0, Math.PI * 2);
        ctx.fill();

        // 检查点标签
        ctx.fillStyle = NEON_COLORS.text;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          point.type === 'summit' ? '顶峰' : `${Math.floor(point.elevation)}m`,
          pointX,
          pointY - 15
        );
      }
    });

    // 绘制玩家位置
    const playerY = canvas.height - mountainHeight * progress;
    ctx.fillStyle = NEON_COLORS.primary;
    ctx.beginPath();
    ctx.arc(200, playerY, 12, 0, Math.PI * 2);
    ctx.fill();

    // 玩家图标
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧗', 200, playerY);

    // 绘制玩家光晕
    ctx.strokeStyle = `${NEON_COLORS.primary}60`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(200, playerY, 20, 0, Math.PI * 2);
    ctx.stroke();

    // 绘制障碍物
    gameState.obstacles.forEach((obstacle, index) => {
      if (obstacle.passed) return;
      
      const obstacleIcons: Record<string, string> = {
        rock: '🪨',
        ice: '🧊',
        gap: '🕳️',
        avalanche: '❄️',
        storm: '🌨️'
      };

      const obstacleY = canvas.height - mountainHeight * (0.2 + index * 0.04);
      const obstacleX = 150 + (index % 3) * 50;

      ctx.font = '20px Arial';
      ctx.fillText(obstacleIcons[obstacle.type] || '⚠️', obstacleX, obstacleY);
    });

    // 绘制天气效果
    if (gameState.weather !== 'clear') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
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
          const upResult = engineRef.current.climb('up');
          if (upResult.message) setMessage(upResult.message);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          const downResult = engineRef.current.climb('down');
          if (downResult.message) setMessage(downResult.message);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          const leftResult = engineRef.current.climb('left');
          if (leftResult.message) setMessage(leftResult.message);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          const rightResult = engineRef.current.climb('right');
          if (rightResult.message) setMessage(rightResult.message);
          break;
        case 'r':
        case 'R':
          const restResult = engineRef.current.rest();
          if (restResult.message) setMessage(restResult.message);
          break;
        case 'e':
        case 'E':
          setShowEquipment(prev => !prev);
          break;
        case ' ': // 空格键快速向上
          const spaceResult = engineRef.current.climb('up');
          if (spaceResult.message) setMessage(spaceResult.message);
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
      setMessage('装备已切换');
    }
  }, []);

  const handleReset = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.reset();
    setMessage('');
    setShowEquipment(false);
  }, []);

  if (!gameState) {
    return <div className="flex items-center justify-center h-screen text-white">加载中...</div>;
  }

  const progress = engineRef.current?.getProgress() || 0;

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
            border: `1px solid ${NEON_COLORS.rock}40`
          }}
        >
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold" style={{ color: NEON_COLORS.snow }}>
              登山者
            </h1>
            <div className="flex gap-4">
              <span style={{ color: NEON_COLORS.textMuted }}>海拔: {Math.floor(gameState.altitude)}m</span>
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
              border: `1px solid ${NEON_COLORS.rock}30`
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

            {/* 进度条 */}
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm" style={{ color: NEON_COLORS.textMuted }}>攀登进度</span>
                <span className="text-sm font-mono" style={{ color: NEON_COLORS.primary }}>{progress.toFixed(1)}%</span>
              </div>
              <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: `${NEON_COLORS.primary}30` }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full"
                  style={{ 
                    background: `linear-gradient(90deg, ${NEON_COLORS.primary}, ${NEON_COLORS.success})`
                  }}
                />
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const result = engineRef.current?.climb('up');
                  if (result?.message) setMessage(result.message);
                }}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.success}30`,
                  border: `1px solid ${NEON_COLORS.success}`,
                  color: NEON_COLORS.success
                }}
              >
                向上 ↑
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const result = engineRef.current?.climb('left');
                  if (result?.message) setMessage(result.message);
                }}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.primary}30`,
                  border: `1px solid ${NEON_COLORS.primary}`,
                  color: NEON_COLORS.primary
                }}
              >
                向左 ←
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const result = engineRef.current?.climb('right');
                  if (result?.message) setMessage(result.message);
                }}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.primary}30`,
                  border: `1px solid ${NEON_COLORS.primary}`,
                  color: NEON_COLORS.primary
                }}
              >
                向右 →
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const result = engineRef.current?.rest();
                  if (result?.message) setMessage(result.message);
                }}
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
                onClick={() => setShowEquipment(true)}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.accent}30`,
                  border: `1px solid ${NEON_COLORS.accent}`,
                  color: NEON_COLORS.accent
                }}
              >
                装备 (E)
              </motion.button>
            </div>
          </motion.div>

          {/* 侧边栏 */}
          <div className="space-y-4">
            {/* 登山状态 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.rock}30`
              }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.snow }}>
                登山状态
              </h3>
              <div className="space-y-3">
                <StatBar label="体力" value={gameState.stats.stamina} color={NEON_COLORS.success} icon="💪" />
                <StatBar label="抓握力" value={gameState.stats.grip} color={NEON_COLORS.warning} icon="🤚" />
                <StatBar label="体温" value={gameState.stats.warmth} color={NEON_COLORS.danger} icon="🌡️" />
                <StatBar label="氧气" value={gameState.stats.oxygen} color={NEON_COLORS.primary} icon="🫁" />
              </div>
            </motion.div>

            {/* 天气状况 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.rock}30`
              }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.primary }}>
                天气状况
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {gameState.weather === 'clear' ? '☀️' :
                   gameState.weather === 'windy' ? '💨' :
                   gameState.weather === 'snowy' ? '❄️' : '⛈️'}
                </span>
                <div>
                  <div className="font-medium" style={{ color: NEON_COLORS.text }}>
                    {gameState.weather === 'clear' ? '晴朗' :
                     gameState.weather === 'windy' ? '大风' :
                     gameState.weather === 'snowy' ? '降雪' : '暴风雪'}
                  </div>
                  <div className="text-xs" style={{ color: NEON_COLORS.textMuted }}>
                    {gameState.weather === 'clear' ? '适合攀登' :
                     gameState.weather === 'windy' ? '注意抓握' :
                     gameState.weather === 'snowy' ? '注意保暖' : '极度危险'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 已装备 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.rock}30`
              }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.accent }}>
                已装备
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {gameState.equippedItems.length === 0 ? (
                  <p className="col-span-3 text-center text-sm" style={{ color: NEON_COLORS.textMuted }}>
                    未装备任何物品
                  </p>
                ) : (
                  gameState.equippedItems.map(item => (
                    <div key={item.id} className="p-2 rounded-xl text-center" style={{ background: `${NEON_COLORS.surface}80` }}>
                      <span className="text-2xl">{item.icon}</span>
                      <div className="text-xs mt-1" style={{ color: NEON_COLORS.textMuted }}>{item.name}</div>
                      <div className="w-full h-1 rounded-full mt-1" style={{ backgroundColor: `${NEON_COLORS.success}30` }}>
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            backgroundColor: item.durability > 30 ? NEON_COLORS.success : NEON_COLORS.danger,
                            width: `${(item.durability / item.maxDurability) * 100}%`
                          }} 
                        />
                      </div>
                    </div>
                  ))
                )}
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
                border: `1px solid ${NEON_COLORS.rock}30`
              }}
            >
              <h3 className="text-lg font-bold mb-2" style={{ color: NEON_COLORS.primary }}>
                操作说明
              </h3>
              <div className="text-sm space-y-1" style={{ color: NEON_COLORS.textMuted }}>
                <p>↑ / W - 向上攀登</p>
                <p>← → / A D - 左右移动</p>
                <p>R - 休息恢复</p>
                <p>E - 装备管理</p>
                <p>空格 - 快速攀登</p>
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

        {/* 装备界面 */}
        <AnimatePresence>
          {showEquipment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
              onClick={() => setShowEquipment(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="p-6 rounded-2xl max-w-2xl w-full"
                style={{
                  background: `linear-gradient(135deg, ${NEON_COLORS.surface}, ${NEON_COLORS.background})`,
                  border: `1px solid ${NEON_COLORS.accent}`
                }}
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-4" style={{ color: NEON_COLORS.accent }}>
                  装备管理
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {gameState.equipment.map(item => {
                    const isEquipped = gameState.equippedItems.some(e => e.id === item.id);
                    return (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 rounded-xl"
                        style={{
                          background: isEquipped ? `${NEON_COLORS.success}20` : `${NEON_COLORS.surface}80`,
                          border: `1px solid ${isEquipped ? NEON_COLORS.success : NEON_COLORS.accent}40`
                        }}
                      >
                        <div className="text-center">
                          <span className="text-4xl">{item.icon}</span>
                          <div className="font-medium mt-2" style={{ color: NEON_COLORS.text }}>{item.name}</div>
                          <div className="text-xs" style={{ color: NEON_COLORS.textMuted }}>
                            {item.effect.type === 'safety' ? '安全+' : 
                             item.effect.type === 'climb' ? '攀爬+' : 
                             item.effect.type === 'grip' ? '抓握+' : 
                             item.effect.type === 'warmth' ? '保暖+' : 
                             item.effect.type === 'vision' ? '视野+' : '氧气+'} 
                            {item.effect.value}
                          </div>
                          <div className="w-full h-2 rounded-full mt-2" style={{ backgroundColor: `${NEON_COLORS.success}30` }}>
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                backgroundColor: item.durability > 30 ? NEON_COLORS.success : NEON_COLORS.danger,
                                width: `${(item.durability / item.maxDurability) * 100}%`
                              }} 
                            />
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEquipItem(item.id)}
                            className="mt-3 px-4 py-2 rounded-lg text-sm font-medium"
                            style={{
                              background: isEquipped ? `${NEON_COLORS.danger}30` : `${NEON_COLORS.success}30`,
                              border: `1px solid ${isEquipped ? NEON_COLORS.danger : NEON_COLORS.success}`,
                              color: isEquipped ? NEON_COLORS.danger : NEON_COLORS.success
                            }}
                          >
                            {isEquipped ? '卸下' : '装备'}
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEquipment(false)}
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
                  {gameState.victory ? '🏔️ 登顶成功!' : '❄️ 攀登失败'}
                </h2>
                <p className="text-2xl mb-2" style={{ color: NEON_COLORS.text }}>
                  最终得分: {gameState.score}
                </p>
                <p className="text-lg mb-2" style={{ color: NEON_COLORS.textMuted }}>
                  最高海拔: {Math.floor(gameState.altitude)}m
                </p>
                <p className="text-lg mb-6" style={{ color: NEON_COLORS.textMuted }}>
                  攀登距离: {Math.floor(gameState.distance)}m
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
    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${color}30` }}>
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

export default MountainClimberGame;
