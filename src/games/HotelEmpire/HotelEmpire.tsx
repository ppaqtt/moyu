import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { HotelEmpireEngine, RoomType, Room, Guest, ROOM_CONFIG } from './engine';

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;

const ROOM_TYPES: RoomType[] = ['standard', 'deluxe', 'suite', 'royal'];

export default function HotelEmpire() {
  const navigate = useNavigate();
  const [engine] = useState(() => new HotelEmpireEngine());
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [money, setMoney] = useState(1000);
  const [stars, setStars] = useState(1);
  const [totalGuests, setTotalGuests] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [day, setDay] = useState(1);
  const [highScore, setHighScore] = useLocalStorage<number>('hotelempire_highscore', 0);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setMoney(state.money);
    setStars(state.stars);
    setTotalGuests(state.totalGuests);
    setRevenue(state.revenue);
    setRooms([...state.rooms]);
    setGuests([...state.guests]);
    setDay(state.day);

    if (state.gameOver && gameStatus === 'playing') {
      setGameStatus('gameover');
      if (state.revenue > highScore) {
        setHighScore(state.revenue);
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
      ctx.fillStyle = '#1a2a4a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#f5f5dc';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🏨 酒店帝国 🏨', CANVAS_WIDTH / 2, 35);

      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      for (let i = 0; i < 5; i++) {
        ctx.fillText('★', 280 + i * 20, 35);
      }
      ctx.fillStyle = '#ffd700';
      for (let i = 0; i < stars; i++) {
        ctx.fillText('★', 280 + i * 20, 35);
      }

      const floorNames = ['一楼', '二楼'];
      rooms.forEach((room, i) => {
        const floor = Math.floor(i / 4);
        const indexInFloor = i % 4;
        const x = 50 + indexInFloor * 155;
        const y = 60 + floor * 100;

        const config = ROOM_CONFIG[room.type];
        let bgColor = '#2a4a6a';
        let borderColor = '#4a6a8a';

        if (room.status === 'occupied') {
          bgColor = '#3a5a2a';
          borderColor = '#5a8a3a';
        } else if (room.status === 'cleaning') {
          bgColor = '#5a4a2a';
          borderColor = '#8a6a3a';
        } else if (room.cleanliness < 50) {
          bgColor = '#5a2a2a';
          borderColor = '#8a3a3a';
        }

        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, 140, 85);

        ctx.strokeStyle = selectedRoom?.id === room.id ? '#ffd700' : borderColor;
        ctx.lineWidth = selectedRoom?.id === room.id ? 3 : 2;
        ctx.strokeRect(x, y, 140, 85);

        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText(config.emoji, x + 70, y + 30);

        ctx.font = '12px Arial';
        ctx.fillText(config.name, x + 70, y + 48);

        if (room.status === 'occupied') {
          ctx.fillStyle = '#fff';
          ctx.fillText(room.guestName || '', x + 70, y + 65);
          ctx.fillStyle = '#aaa';
          ctx.fillText(`住${room.stayDuration}天`, x + 70, y + 78);
        } else if (room.status === 'cleaning') {
          ctx.fillStyle = '#ffa500';
          ctx.fillText('清洁中...', x + 70, y + 65);
          ctx.fillStyle = '#333';
          ctx.fillRect(x + 20, y + 75, 100, 8);
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(x + 20, y + 75, room.cleanliness, 8);
        } else {
          ctx.fillStyle = '#4ade80';
          ctx.fillText(`${room.cleanliness}%`, x + 70, y + 65);
          ctx.fillStyle = '#ffd700';
          ctx.fillText(`${config.price}💰`, x + 70, y + 78);
        }

        if (floor === 0 && indexInFloor === 0) {
          ctx.fillStyle = '#fff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(floorNames[floor], x, y - 5);
        }
      });

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 260, CANVAS_WIDTH, 240);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('👥 等待入住的客人', 20, 285);

      if (guests.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.fillText('暂无客人...', 20, 310);
      } else {
        guests.forEach((guest, i) => {
          const y = 295 + i * 50;
          const config = ROOM_CONFIG[guest.preferredRoomType];
          const patienceRatio = guest.patience / guest.maxPatience;

          ctx.fillStyle = patienceRatio > 0.5 ? '#2a4a2a' : patienceRatio > 0.25 ? '#4a4a2a' : '#4a2a2a';
          ctx.fillRect(20, y, 300, 42);

          ctx.strokeStyle = selectedGuest?.id === guest.id ? '#ffd700' : 
            (patienceRatio > 0.5 ? '#4ade80' : patienceRatio > 0.25 ? '#ffd700' : '#ff6b6b');
          ctx.lineWidth = selectedGuest?.id === guest.id ? 3 : 2;
          ctx.strokeRect(20, y, 300, 42);

          ctx.fillStyle = '#fff';
          ctx.font = '14px Arial';
          ctx.fillText(`${guest.name}`, 30, y + 18);

          ctx.fillStyle = '#aaa';
          ctx.font = '12px Arial';
          ctx.fillText(`想要: ${config.emoji} ${config.name}`, 30, y + 34);

          ctx.fillStyle = patienceRatio > 0.5 ? '#4ade80' : patienceRatio > 0.25 ? '#ffd700' : '#ff6b6b';
          ctx.fillRect(20, y + 38, 300 * patienceRatio, 4);
        });
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, CANVAS_HEIGHT - 45, CANVAS_WIDTH, 45);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`💰 ${money}`, 20, CANVAS_HEIGHT - 20);

      ctx.fillStyle = '#00d2ff';
      ctx.textAlign = 'center';
      ctx.fillText(`📅 第${day}天`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);

      ctx.fillStyle = '#4ade80';
      ctx.textAlign = 'right';
      ctx.fillText(`🏆 ${highScore}`, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);
    };

    draw();
  }, [gameStatus, rooms, guests, money, stars, day, highScore, selectedGuest, selectedRoom]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = 0; i < guests.length; i++) {
      const guestY = 295 + i * 50;
      if (x >= 20 && x <= 320 && y >= guestY && y <= guestY + 42) {
        setSelectedGuest(guests[i]);
        return;
      }
    }

    for (let i = 0; i < rooms.length; i++) {
      const floor = Math.floor(i / 4);
      const indexInFloor = i % 4;
      const roomX = 50 + indexInFloor * 155;
      const roomY = 60 + floor * 100;

      if (x >= roomX && x <= roomX + 140 && y >= roomY && y <= roomY + 85) {
        if (selectedGuest && rooms[i].status === 'empty') {
          engine.checkIn(selectedGuest.id, rooms[i].id);
          setSelectedGuest(null);
        } else if (rooms[i].status === 'occupied') {
          engine.checkOut(rooms[i].id);
        } else if (rooms[i].status === 'cleaning') {
          engine.cleanRoom(rooms[i].id);
        }
        return;
      }
    }
  }, [engine, gameStatus, rooms, guests, selectedGuest]);

  const handleNextDay = useCallback(() => {
    engine.nextDay();
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setGameStatus('idle');
  }, [engine]);

  const handleUnlock = useCallback((type: RoomType) => {
    engine.unlockRoom(type);
  }, [engine]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <motion.h1
        className="text-3xl font-bold"
        style={{ color: NEON_COLORS.neonCyan }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        🏨 酒店帝国 🏨
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
          <div className="text-xs opacity-70" style={{ color: NEON_COLORS.neonCyan }}>星级</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>
            {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs opacity-70" style={{ color: NEON_COLORS.neonGreen }}>收入</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>{revenue} 💰</div>
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
            boxShadow: `0 0 30px ${NEON_COLORS.neonCyan}30`,
            border: `2px solid ${NEON_COLORS.neonCyan}40`
          }}
        />

        <AnimatePresence>
          {gameStatus === 'idle' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(26, 42, 74, 0.95)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-7xl mb-6"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🏨
              </motion.div>
              <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonCyan }}>
                酒店帝国
              </div>
              <div className="text-gray-400 mb-8 text-center px-8">
                <p>经营你的豪华酒店</p>
                <p>接待客人，赚取财富，升级酒店！</p>
              </div>
              <motion.button
                onClick={startGame}
                className="px-12 py-4 rounded-xl text-xl font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonCyan,
                  color: '#fff',
                  boxShadow: `0 0 30px ${NEON_COLORS.neonCyan}50`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开业大吉
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameStatus === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(26, 42, 74, 0.95)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                💔
              </motion.div>
              <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.danger }}>
                酒店破产
              </div>
              <div className="text-2xl mb-2" style={{ color: NEON_COLORS.gold }}>
                总收入: {revenue} 💰
              </div>
              {revenue >= highScore && revenue > 0 && (
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
              <div className="text-lg mb-6" style={{ color: NEON_COLORS.neonCyan }}>
                最高记录: {highScore} 💰
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
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm" style={{ color: NEON_COLORS.gold }}>
              {selectedGuest ? `已选择: ${selectedGuest.name}` : '点击客人选择'}
            </div>
            <motion.button
              onClick={handleNextDay}
              className="px-4 py-2 rounded-lg font-bold text-sm"
              style={{ backgroundColor: `${NEON_COLORS.neonGreen}30`, color: NEON_COLORS.neonGreen }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📅 下一天
            </motion.button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {ROOM_TYPES.map(type => {
              const config = ROOM_CONFIG[type];
              const isUnlocked = rooms.some(r => r.type === type);
              
              return (
                <div
                  key={type}
                  className="flex flex-col items-center p-2 rounded-lg"
                  style={{ 
                    backgroundColor: isUnlocked ? `${config.color}20` : '#333',
                    opacity: isUnlocked ? 1 : 0.5
                  }}
                >
                  <span className="text-2xl">{config.emoji}</span>
                  <span className="text-xs font-bold">{config.name}</span>
                  <span className="text-xs" style={{ color: NEON_COLORS.gold }}>{config.price}💰</span>
                  {!isUnlocked && (
                    <span className="text-xs" style={{ color: NEON_COLORS.danger }}>
                      {config.unlockCost}💰解锁
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>点击客人选择，再点击空房间安排入住</div>
        <div>点击已入住房间退房，点击清洁中房间加速清洁</div>
      </div>
    </div>
  );
}
