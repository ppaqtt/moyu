import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HelicopterEscapeEngine, {
  GameState,
  Bullet,
  Enemy,
  PowerUp,
  NEON_COLORS
} from './engine';

interface Props {
  onExit?: () => void;
}

const HelicopterEscapeGame: React.FC<Props> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<HelicopterEscapeEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [message, setMessage] = useState<string>('');

  // 初始化游戏引擎
  useEffect(() => {
    const engine = new HelicopterEscapeEngine();
    engineRef.current = engine;

    engine.onStateChange((state) => {
      setGameState(state);
    });

    engine.onGameOver((score) => {
      setMessage(`任务失败！得分: ${score}`);
    });

    engine.onVictory((score) => {
      setMessage(`成功逃脱！得分: ${score}`);
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

    canvas.width = 800;
    canvas.height = 600;

    // 清空画布 - 天空渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a3a5c');
    gradient.addColorStop(0.5, '#2d4a6c');
    gradient.addColorStop(1, '#4a6a8c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制云朵背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 5; i++) {
      const cloudX = ((gameState.distance * 0.1) + i * 200) % (canvas.width + 200) - 100;
      const cloudY = 50 + i * 80;
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 40, 0, Math.PI * 2);
      ctx.arc(cloudX + 30, cloudY - 10, 35, 0, Math.PI * 2);
      ctx.arc(cloudX + 60, cloudY, 40, 0, Math.PI * 2);
      ctx.fill();
    }

    // 绘制地面
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // 绘制障碍物
    gameState.obstacles.forEach(obstacle => {
      const relativeX = obstacle.x - gameState.distance;
      if (relativeX > -200 && relativeX < canvas.width + 200) {
        if (obstacle.type === 'building') {
          // 建筑
          ctx.fillStyle = '#4a4a4a';
          ctx.fillRect(relativeX - obstacle.width / 2, obstacle.y - obstacle.height, obstacle.width, obstacle.height);
          // 窗户
          ctx.fillStyle = '#ffff00';
          for (let wx = 0; wx < obstacle.width - 10; wx += 15) {
            for (let wy = 0; wy < obstacle.height - 10; wy += 20) {
              ctx.fillRect(relativeX - obstacle.width / 2 + wx + 5, obstacle.y - obstacle.height + wy + 5, 8, 12);
            }
          }
        } else if (obstacle.type === 'mountain') {
          // 山脉
          ctx.fillStyle = '#5a5a5a';
          ctx.beginPath();
          ctx.moveTo(relativeX - obstacle.width / 2, canvas.height - 50);
          ctx.lineTo(relativeX, obstacle.y - obstacle.height);
          ctx.lineTo(relativeX + obstacle.width / 2, canvas.height - 50);
          ctx.closePath();
          ctx.fill();
          // 山顶积雪
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(relativeX - 30, obstacle.y - obstacle.height + 40);
          ctx.lineTo(relativeX, obstacle.y - obstacle.height);
          ctx.lineTo(relativeX + 30, obstacle.y - obstacle.height + 40);
          ctx.closePath();
          ctx.fill();
        }
      }
    });

    // 绘制道具
    gameState.powerUps.forEach(powerUp => {
      if (powerUp.collected) return;
      
      const icons: Record<string, string> = {
        health: '❤️',
        fuel: '⛽',
        ammo: '🎯',
        shield: '🛡️'
      };

      const colors: Record<string, string> = {
        health: NEON_COLORS.danger,
        fuel: NEON_COLORS.fuel,
        ammo: NEON_COLORS.accent,
        shield: NEON_COLORS.primary
      };

      // 道具光晕
      ctx.fillStyle = `${colors[powerUp.type]}40`;
      ctx.beginPath();
      ctx.arc(powerUp.x, powerUp.y, 25, 0, Math.PI * 2);
      ctx.fill();

      // 道具图标
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icons[powerUp.type], powerUp.x, powerUp.y);
    });

    // 绘制敌人
    gameState.enemies.forEach(enemy => {
      const enemyIcons: Record<string, string> = {
        drone: '🛸',
        jet: '✈️',
        missile: '🚀',
        tank: '🚁'
      };

      // 敌人光晕
      ctx.fillStyle = `${NEON_COLORS.enemy}30`;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, 30, 0, Math.PI * 2);
      ctx.fill();

      // 敌人图标
      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(enemyIcons[enemy.type], enemy.x, enemy.y);

      // 血条
      const healthPercent = enemy.health / (enemy.type === 'tank' ? 60 : enemy.type === 'jet' ? 40 : enemy.type === 'missile' ? 10 : 20);
      ctx.fillStyle = '#333';
      ctx.fillRect(enemy.x - 20, enemy.y - 30, 40, 4);
      ctx.fillStyle = healthPercent > 0.5 ? NEON_COLORS.success : NEON_COLORS.danger;
      ctx.fillRect(enemy.x - 20, enemy.y - 30, 40 * healthPercent, 4);
    });

    // 绘制子弹
    gameState.bullets.forEach(bullet => {
      ctx.fillStyle = bullet.owner === 'player' ? NEON_COLORS.bullet : NEON_COLORS.enemy;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // 子弹尾迹
      ctx.strokeStyle = bullet.owner === 'player' ? `${NEON_COLORS.bullet}60` : `${NEON_COLORS.enemy}60`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bullet.x, bullet.y);
      ctx.lineTo(bullet.x - bullet.vx * 0.02, bullet.y - bullet.vy * 0.02);
      ctx.stroke();
    });

    // 绘制玩家直升机
    const playerX = gameState.position.x;
    const playerY = gameState.position.y;

    // 护盾效果
    if (gameState.shieldActive) {
      ctx.strokeStyle = `${NEON_COLORS.primary}${Math.floor((gameState.shieldTime / 5) * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(playerX, playerY, 35, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = `${NEON_COLORS.primary}20`;
      ctx.beginPath();
      ctx.arc(playerX, playerY, 35, 0, Math.PI * 2);
      ctx.fill();
    }

    // 直升机主体
    ctx.fillStyle = NEON_COLORS.helicopter;
    ctx.fillRect(playerX - 20, playerY - 10, 40, 20);

    // 直升机旋翼
    const rotorAngle = (Date.now() / 50) % (Math.PI * 2);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(playerX - 30, playerY - 15);
    ctx.lineTo(playerX + 30, playerY - 15);
    ctx.stroke();

    // 直升机图标
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚁', playerX, playerY);

    // 直升机光晕
    ctx.strokeStyle = `${NEON_COLORS.helicopter}60`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(playerX, playerY, 25, 0, Math.PI * 2);
    ctx.stroke();

    // 绘制进度指示
    const progress = (gameState.distance / 10000) * 100;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, 10, 200, 20);
    ctx.fillStyle = NEON_COLORS.success;
    ctx.fillRect(10, 10, 200 * (progress / 100), 20);
    ctx.strokeStyle = NEON_COLORS.text;
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 200, 20);
    
    ctx.fillStyle = NEON_COLORS.text;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`距离: ${Math.floor(gameState.distance)}/10000m`, 110, 24);

  }, [gameState]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current || gameState?.gameOver || gameState?.victory) return;

      engineRef.current.setKey(e.key, true);

      switch (e.key) {
        case ' ':
        case 'Enter':
          engineRef.current.shoot();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      engineRef.current.setKey(e.key, false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // 自动清除消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleReset = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.reset();
    setMessage('');
  }, []);

  if (!gameState) {
    return <div className="flex items-center justify-center h-screen text-white">加载中...</div>;
  }

  const progress = (gameState.distance / 10000) * 100;

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
            border: `1px solid ${NEON_COLORS.helicopter}40`
          }}
        >
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold" style={{ color: NEON_COLORS.helicopter }}>
              直升机逃生
            </h1>
            <div className="flex gap-4">
              <span style={{ color: NEON_COLORS.textMuted }}>波次: {gameState.wave}</span>
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
              border: `1px solid ${NEON_COLORS.helicopter}30`
            }}
          >
            <canvas
              ref={canvasRef}
              className="rounded-xl mx-auto"
              style={{
                boxShadow: `0 0 30px ${NEON_COLORS.helicopter}20`,
                maxWidth: '100%'
              }}
            />

            {/* 进度条 */}
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm" style={{ color: NEON_COLORS.textMuted }}>飞行进度</span>
                <span className="text-sm font-mono" style={{ color: NEON_COLORS.success }}>{progress.toFixed(1)}%</span>
              </div>
              <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: `${NEON_COLORS.success}30` }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full"
                  style={{ 
                    background: `linear-gradient(90deg, ${NEON_COLORS.success}, ${NEON_COLORS.primary})`
                  }}
                />
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => engineRef.current?.shoot()}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.danger}30`,
                  border: `1px solid ${NEON_COLORS.danger}`,
                  color: NEON_COLORS.danger
                }}
              >
                射击 (空格)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onMouseDown={() => engineRef.current?.setKey('ArrowUp', true)}
                onMouseUp={() => engineRef.current?.setKey('ArrowUp', false)}
                onTouchStart={() => engineRef.current?.setKey('ArrowUp', true)}
                onTouchEnd={() => engineRef.current?.setKey('ArrowUp', false)}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.primary}30`,
                  border: `1px solid ${NEON_COLORS.primary}`,
                  color: NEON_COLORS.primary
                }}
              >
                上升 ↑
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onMouseDown={() => engineRef.current?.setKey('ArrowDown', true)}
                onMouseUp={() => engineRef.current?.setKey('ArrowDown', false)}
                onTouchStart={() => engineRef.current?.setKey('ArrowDown', true)}
                onTouchEnd={() => engineRef.current?.setKey('ArrowDown', false)}
                className="p-3 rounded-xl font-medium"
                style={{
                  background: `${NEON_COLORS.primary}30`,
                  border: `1px solid ${NEON_COLORS.primary}`,
                  color: NEON_COLORS.primary
                }}
              >
                下降 ↓
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
            {/* 直升机状态 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.helicopter}30`
              }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.helicopter }}>
                直升机状态
              </h3>
              <div className="space-y-3">
                <StatBar label="生命值" value={gameState.stats.health} color={NEON_COLORS.danger} icon="❤️" />
                <StatBar label="燃料" value={gameState.stats.fuel} color={NEON_COLORS.fuel} icon="⛽" />
                <StatBar label="速度" value={gameState.stats.speed / 2} color={NEON_COLORS.primary} icon="⚡" />
              </div>
            </motion.div>

            {/* 护盾状态 */}
            {gameState.shieldActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${NEON_COLORS.primary}30, ${NEON_COLORS.surface}30)`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${NEON_COLORS.primary}`
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🛡️</span>
                  <div>
                    <div className="font-medium" style={{ color: NEON_COLORS.primary }}>护盾激活</div>
                    <div className="text-sm" style={{ color: NEON_COLORS.textMuted }}>
                      剩余时间: {gameState.shieldTime.toFixed(1)}s
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 道具说明 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.helicopter}30`
              }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.accent }}>
                道具说明
              </h3>
              <div className="space-y-2 text-sm" style={{ color: NEON_COLORS.textMuted }}>
                <div className="flex items-center gap-2">
                  <span>❤️</span>
                  <span>生命 - 恢复生命值</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⛽</span>
                  <span>燃料 - 补充燃料</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🎯</span>
                  <span>弹药 - 增加分数</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🛡️</span>
                  <span>护盾 - 5秒无敌</span>
                </div>
              </div>
            </motion.div>

            {/* 敌人说明 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.surface}60, ${NEON_COLORS.surface}30)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${NEON_COLORS.helicopter}30`
              }}
            >
              <h3 className="text-lg font-bold mb-3" style={{ color: NEON_COLORS.enemy }}>
                敌人种类
              </h3>
              <div className="space-y-2 text-sm" style={{ color: NEON_COLORS.textMuted }}>
                <div className="flex items-center gap-2">
                  <span>🛸</span>
                  <span>无人机 - 基础敌人</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✈️</span>
                  <span>战斗机 - 高速敌人</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🚀</span>
                  <span>导弹 - 追踪敌人</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🚁</span>
                  <span>坦克 - 重装敌人</span>
                </div>
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
                border: `1px solid ${NEON_COLORS.helicopter}30`
              }}
            >
              <h3 className="text-lg font-bold mb-2" style={{ color: NEON_COLORS.primary }}>
                操作说明
              </h3>
              <div className="text-sm space-y-1" style={{ color: NEON_COLORS.textMuted }}>
                <p>WASD / 方向键 - 移动</p>
                <p>空格 / Enter - 射击</p>
                <p>躲避障碍物和敌人</p>
                <p>收集道具恢复状态</p>
                <p>飞行10000米即可逃脱</p>
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
                border: `1px solid ${NEON_COLORS.helicopter}`,
                color: NEON_COLORS.helicopter
              }}
            >
              {message}
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
                  {gameState.victory ? '🚁 逃脱成功!' : '💥 任务失败'}
                </h2>
                <p className="text-2xl mb-2" style={{ color: NEON_COLORS.text }}>
                  最终得分: {gameState.score}
                </p>
                <p className="text-lg mb-2" style={{ color: NEON_COLORS.textMuted }}>
                  飞行距离: {Math.floor(gameState.distance)}m
                </p>
                <p className="text-lg mb-6" style={{ color: NEON_COLORS.textMuted }}>
                  到达波次: {gameState.wave}
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

export default HelicopterEscapeGame;
