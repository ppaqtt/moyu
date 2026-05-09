import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { RestaurantTycoonEngine, DishType, Station, Order, DISHES } from './engine';

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;

const DISH_TYPES: DishType[] = ['burger', 'pizza', 'sushi', 'steak', 'dessert'];

const STATION_NAMES: Record<string, { name: string; emoji: string }> = {
  grill: { name: '烧烤台', emoji: '🔥' },
  oven: { name: '烤箱', emoji: '🍳' },
  prep: { name: '料理台', emoji: '🔪' },
  dessert: { name: '甜点台', emoji: '🧁' }
};

export default function RestaurantTycoon() {
  const navigate = useNavigate();
  const [engine] = useState(() => new RestaurantTycoonEngine());
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [money, setMoney] = useState(200);
  const [reputation, setReputation] = useState(50);
  const [customersServed, setCustomersServed] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [highScore, setHighScore] = useLocalStorage<number>('restauranttycoon_highscore', 0);
  const [selectedDish, setSelectedDish] = useState<DishType | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setMoney(state.money);
    setReputation(state.reputation);
    setCustomersServed(state.customersServed);
    setOrders([...state.orders]);
    setStations([...state.stations]);

    if (state.gameOver && gameStatus === 'playing') {
      setGameStatus('gameover');
      if (state.customersServed > highScore) {
        setHighScore(state.customersServed);
      }
    }
  }, [engine, gameStatus, highScore, setHighScore]);

  useGameLoop({ callback: handleTick, delay: 16, enabled: gameStatus === 'playing' });

  const startGame = useCallback(() => {
    engine.reset();
    setGameStatus('playing');
  }, [engine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameStatus !== 'playing') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.fillStyle = '#2d1f1f';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#4a3728';
      ctx.fillRect(0, 0, CANVAS_WIDTH, 150);

      ctx.fillStyle = '#f5f5dc';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🍽️ 餐厅大亨 🍽️', CANVAS_WIDTH / 2, 40);

      const stationNames = ['烧烤台', '烤箱', '料理台', '甜点台'];
      const stationEmojis = ['🔥', '🍳', '🔪', '🧁'];

      stations.forEach((station, i) => {
        const x = 50 + i * 150;
        const y = 50;

        ctx.fillStyle = station.dish ? '#3a5a3a' : '#5a4a3a';
        ctx.fillRect(x, y, 120, 80);

        ctx.strokeStyle = selectedDish ? '#ffd700' : '#8b7355';
        ctx.lineWidth = selectedDish ? 3 : 2;
        ctx.strokeRect(x, y, 120, 80);

        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(stationEmojis[i], x + 60, y + 30);

        ctx.fillStyle = '#ddd';
        ctx.font = '12px Arial';
        ctx.fillText(stationNames[i], x + 60, y + 50);

        if (station.dish) {
          const dish = DISHES[station.dish];
          const progress = Math.min(station.progress / station.requiredTime, 1);

          ctx.font = '20px Arial';
          ctx.fillText(dish.emoji, x + 60, y + 70);

          ctx.fillStyle = '#333';
          ctx.fillRect(x + 10, y + 75, 100, 8);
          const barColor = progress >= 1 ? '#4ade80' : progress >= 0.5 ? '#ffd700' : '#ff6b6b';
          ctx.fillStyle = barColor;
          ctx.fillRect(x + 10, y + 75, 100 * progress, 8);
        } else {
          ctx.fillStyle = '#666';
          ctx.font = '14px Arial';
          ctx.fillText('+', x + 60, y + 70);
        }
      });

      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 150, CANVAS_WIDTH, 350);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('📋 订单列表', 20, 180);

      if (orders.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.fillText('暂无订单...', 20, 210);
      } else {
        orders.forEach((order, i) => {
          const y = 195 + i * 60;
          const dish = DISHES[order.dish];
          const patienceRatio = order.patience / order.maxPatience;

          ctx.fillStyle = patienceRatio > 0.5 ? '#2a4a2a' : patienceRatio > 0.25 ? '#4a4a2a' : '#4a2a2a';
          ctx.fillRect(20, y, 400, 50);

          ctx.strokeStyle = patienceRatio > 0.5 ? '#4ade80' : patienceRatio > 0.25 ? '#ffd700' : '#ff6b6b';
          ctx.lineWidth = 2;
          ctx.strokeRect(20, y, 400, 50);

          ctx.font = '20px Arial';
          ctx.fillText(dish.emoji, 35, y + 30);

          ctx.fillStyle = '#fff';
          ctx.font = '14px Arial';
          ctx.fillText(`${order.customer} - ${dish.name}`, 65, y + 25);
          ctx.fillText(`${dish.price}💰`, 65, y + 42);

          ctx.fillStyle = '#666';
          ctx.font = '12px Arial';
          ctx.fillText(`${dish.price}💰`, 65, y + 42);

          ctx.fillStyle = patienceRatio > 0.5 ? '#4ade80' : patienceRatio > 0.25 ? '#ffd700' : '#ff6b6b';
          ctx.fillRect(20, y + 48, 400 * patienceRatio, 4);

          ctx.fillStyle = '#fff';
          ctx.font = '14px Arial';
          ctx.textAlign = 'right';
          ctx.fillText('上菜', 400, y + 30);
          ctx.textAlign = 'left';
        });
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`💰 ${money}`, 20, CANVAS_HEIGHT - 25);

      ctx.fillStyle = reputation > 50 ? '#4ade80' : reputation > 25 ? '#ffd700' : '#ff6b6b';
      ctx.fillText(`⭐ ${reputation}%`, 150, CANVAS_HEIGHT - 25);

      ctx.fillStyle = '#00d2ff';
      ctx.fillText(`👥 服务: ${customersServed}`, 280, CANVAS_HEIGHT - 25);

      ctx.fillStyle = '#fff';
      ctx.textAlign = 'right';
      ctx.fillText(`🏆 最高: ${highScore}`, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 25);
    };

    draw();
  }, [gameStatus, stations, orders, money, reputation, customersServed, highScore, selectedDish]);

  const handleStationClick = useCallback((stationIndex: number) => {
    if (gameStatus !== 'playing') return;

    const station = stations[stationIndex];
    if (station.dish) {
      const order = orders.find(o => o.dish === station.dish);
      if (order) {
        engine.serveOrder(order.id);
      }
    } else if (selectedDish) {
      const stationTypes = ['grill', 'oven', 'prep', 'dessert'];
      const dishToStation: Record<DishType, number> = {
        burger: 0,
        steak: 0,
        pizza: 1,
        sushi: 2,
        dessert: 3
      };
      
      if (dishToStation[selectedDish] === stationIndex) {
        engine.startCooking(stationIndex, selectedDish);
      }
    }
  }, [engine, gameStatus, stations, orders, selectedDish]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = 0; i < 4; i++) {
      const stationX = 50 + i * 150;
      const stationY = 50;
      if (x >= stationX && x <= stationX + 120 && y >= stationY && y <= stationY + 80) {
        handleStationClick(i);
        return;
      }
    }

    for (let i = 0; i < orders.length; i++) {
      const orderY = 195 + i * 60;
      if (x >= 20 && x <= 420 && y >= orderY && y <= orderY + 50) {
        const order = orders[i];
        const station = stations.find(s => s.dish === order.dish);
        if (station && station.progress >= station.requiredTime * 0.8) {
          engine.serveOrder(order.id);
        }
        return;
      }
    }
  }, [engine, gameStatus, stations, orders, handleStationClick]);

  const handleDishSelect = useCallback((dish: DishType) => {
    if (selectedDish === dish) {
      setSelectedDish(null);
    } else {
      setSelectedDish(dish);
    }
  }, [selectedDish]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setGameStatus('idle');
  }, [engine]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <motion.h1
        className="text-3xl font-bold"
        style={{ color: NEON_COLORS.neonPink }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        🍽️ 餐厅大亨 🍽️
      </motion.h1>

      <div className="flex items-center justify-between w-full max-w-[720px] px-4">
        <motion.button
          onClick={handleExit}
          className="px-4 py-2 rounded-lg font-bold text-sm glass-card"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← 返回
        </motion.button>

        <div className="text-center">
          <div className="text-xs opacity-70" style={{ color: NEON_COLORS.gold }}>金币</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}>{money} 💰</div>
        </div>

        <div className="text-center">
          <div className="text-xs opacity-70" style={{ color: NEON_COLORS.neonPink }}>声望</div>
          <div className="text-xl font-bold" style={{ color: reputation > 50 ? NEON_COLORS.neonGreen : reputation > 25 ? NEON_COLORS.gold : NEON_COLORS.danger }}>
            {reputation}%
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs opacity-70" style={{ color: NEON_COLORS.neonCyan }}>服务顾客</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{customersServed}</div>
        </div>

        <div className="text-center">
          <div className="text-xs opacity-70" style={{ color: NEON_COLORS.neonPurple }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPurple }}>{highScore}</div>
        </div>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          className="rounded-2xl cursor-pointer"
          style={{
            boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
            border: `2px solid ${NEON_COLORS.neonPink}40`
          }}
        />

        <AnimatePresence>
          {gameStatus === 'idle' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(45, 31, 31, 0.95)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-7xl mb-6"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🍽️
              </motion.div>
              <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
                餐厅大亨
              </div>
              <div className="text-gray-400 mb-8 text-center px-8">
                <p>为顾客烹饪美食</p>
                <p>保持高声望，成为顶级大厨！</p>
              </div>
              <motion.button
                onClick={startGame}
                className="px-12 py-4 rounded-xl text-xl font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonPink,
                  color: '#fff',
                  boxShadow: `0 0 30px ${NEON_COLORS.neonPink}50`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开店营业
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameStatus === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(45, 31, 31, 0.95)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                😵
              </motion.div>
              <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.danger }}>
                餐厅倒闭
              </div>
              <div className="text-2xl mb-2" style={{ color: NEON_COLORS.gold }}>
                服务顾客: {customersServed} 位
              </div>
              {customersServed >= highScore && customersServed > 0 && (
                <motion.div
                  className="text-xl mb-4"
                  style={{ color: NEON_COLORS.neonGreen }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                >
                  🎉 新纪录! 🎉
                </motion.div>
              )}
              <div className="text-lg mb-6" style={{ color: NEON_COLORS.neonPink }}>
                最高记录: {highScore} 位顾客
              </div>
              <motion.button
                onClick={handleRestart}
                className="px-12 py-4 rounded-xl text-xl font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonPink,
                  color: '#fff',
                  boxShadow: `0 0 30px ${NEON_COLORS.neonPink}50`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                重新开业
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {gameStatus === 'playing' && (
        <div className="w-full max-w-[720px] glass-card rounded-xl p-4">
          <div className="text-sm mb-3" style={{ color: NEON_COLORS.gold }}>
            选择菜品开始烹饪
          </div>
          <div className="grid grid-cols-5 gap-2">
            {DISH_TYPES.map(dish => {
              const dishInfo = DISHES[dish];
              return (
                <motion.button
                  key={dish}
                  onClick={() => handleDishSelect(dish)}
                  className="flex flex-col items-center p-3 rounded-xl"
                  style={{
                    backgroundColor: selectedDish === dish ? `${dishInfo.color}50` : `${dishInfo.color}20`,
                    border: selectedDish === dish ? `2px solid ${NEON_COLORS.gold}` : '2px solid transparent'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-3xl">{dishInfo.emoji}</span>
                  <span className="text-xs font-bold" style={{ color: dishInfo.color }}>{dishInfo.name}</span>
                  <span className="text-xs" style={{ color: NEON_COLORS.gold }}>{dishInfo.price}💰</span>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs opacity-70">
            <div className="flex items-center gap-1">
              <span>🔥</span><span>烧烤台: 汉堡/牛排</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🍳</span><span>烤箱: 披萨</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🔪</span><span>料理台: 寿司</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🧁</span><span>甜点台: 甜点</span>
            </div>
          </div>
        </div>
      )}

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>选择菜品后点击对应烹饪台开始制作</div>
        <div>菜品完成后点击订单上菜，注意顾客耐心值！</div>
      </div>
    </div>
  );
}
