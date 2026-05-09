import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { OilTycoonEngine, OilFieldType, OilField, OilWell, FIELD_CONFIG } from './engine';

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;

const FIELD_TYPES: OilFieldType[] = ['small', 'medium', 'large', 'giant'];

const WELL_STATUS_COLORS = {
  empty: '#4a4a4a',
  drilling: '#ffa500',
  producing: '#4ade80',
  depleted: '#8a8a8a'
};

export default function OilTycoon() {
  const navigate = useNavigate();
  const [engine] = useState(() => new OilTycoonEngine());
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [money, setMoney] = useState(1000);
  const [oil, setOil] = useState(0);
  const [totalOilProduced, setTotalOilProduced] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [fields, setFields] = useState<OilField[]>([]);
  const [drillers, setDrillers] = useState(2);
  const [highScore, setHighScore] = useLocalStorage<number>('oiltycoon_highscore', 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setMoney(state.money);
    setOil(state.oil);
    setTotalOilProduced(state.totalOilProduced);
    setRevenue(state.revenue);
    setFields([...state.fields]);
    setDrillers(state.drillers);

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
      ctx.fillStyle = '#1a1a0a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (let i = 0; i < 50; i++) {
        const x = (i * 73) % CANVAS_WIDTH;
        const y = (i * 37) % CANVAS_HEIGHT;
        ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      fields.forEach(field => {
        const config = FIELD_CONFIG[field.type];

        ctx.fillStyle = field.color;
        ctx.fillRect(field.x, field.y, field.width, field.height);

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.strokeRect(field.x, field.y, field.width, field.height);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(config.name, field.x + field.width / 2, field.y - 8);

        field.wells.forEach(well => {
          const wellX = field.x + well.x;
          const wellY = field.y + well.y;

          ctx.beginPath();
          ctx.arc(wellX, wellY, 15, 0, Math.PI * 2);
          ctx.fillStyle = WELL_STATUS_COLORS[well.status];
          ctx.fill();
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 2;
          ctx.stroke();

          if (well.status === 'drilling') {
            ctx.strokeStyle = '#ffa500';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(wellX, wellY - 20);
            ctx.lineTo(wellX, wellY + 20);
            ctx.stroke();

            ctx.fillStyle = '#ffa500';
            ctx.font = '12px Arial';
            ctx.fillText(`${Math.floor(well.drillProgress * 100)}%`, wellX, wellY + 30);
          }

          if (well.status === 'producing') {
            ctx.fillStyle = '#333';
            ctx.fillRect(wellX - 5, wellY + 15, 10, 15);

            ctx.fillStyle = '#4ade80';
            ctx.font = '10px Arial';
            ctx.fillText('💧', wellX, wellY - 25);
          }

          if (well.status === 'depleted') {
            ctx.fillStyle = '#8a8a8a';
            ctx.font = '12px Arial';
            ctx.fillText('X', wellX, wellY + 5);
          }

          if (well.status === 'empty') {
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.fillText('+', wellX, wellY + 5);
          }
        });
      });

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, 40);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('🏭 油田大亨 🏭', 20, 28);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`💰 ${money}`, 20, CANVAS_HEIGHT - 25);

      ctx.fillStyle = '#4ade80';
      ctx.fillText(`🛢️ ${Math.floor(oil)}桶`, 150, CANVAS_HEIGHT - 25);

      ctx.fillStyle = '#ffa500';
      ctx.fillText(`🔧 钻机: ${drillers}`, 280, CANVAS_HEIGHT - 25);

      ctx.fillStyle = '#fff';
      ctx.textAlign = 'right';
      ctx.fillText(`🏆 ${highScore}`, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 25);
    };

    draw();
  }, [gameStatus, fields, money, oil, drillers, highScore]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const field of fields) {
      for (const well of field.wells) {
        const wellX = field.x + well.x;
        const wellY = field.y + well.y;
        const dx = x - wellX;
        const dy = y - wellY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 20) {
          if (well.status === 'empty') {
            engine.startDrilling(field.id, well.id);
          }
          return;
        }
      }
    }
  }, [engine, gameStatus, fields]);

  const handleSellOil = useCallback(() => {
    engine.sellOil();
  }, [engine]);

  const handleUpgradeDriller = useCallback(() => {
    engine.upgradeDriller();
  }, [engine]);

  const handleUnlockField = useCallback((type: OilFieldType) => {
    engine.unlockField(type);
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setGameStatus('idle');
  }, [engine]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <motion.h1
        className="text-3xl font-bold"
        style={{ color: NEON_COLORS.gold }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        🏭 油田大亨 🏭
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
          <div className="text-xs opacity-70" style={{ color: NEON_COLORS.neonGreen }}>石油</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>{Math.floor(oil)}桶</div>
        </div>

        <div className="text-center">
          <div className="text-xs opacity-70" style={{ color: NEON_COLORS.neonPink }}>钻机</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPink }}>{drillers}台</div>
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
            boxShadow: `0 0 30px ${NEON_COLORS.gold}30`,
            border: `2px solid ${NEON_COLORS.gold}40`
          }}
        />

        <AnimatePresence>
          {gameStatus === 'idle' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(26, 26, 10, 0.95)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-7xl mb-6"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🏭
              </motion.div>
              <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.gold }}>
                油田大亨
              </div>
              <div className="text-gray-400 mb-8 text-center px-8">
                <p>开采石油，成为石油大亨</p>
                <p>钻井、开采、销售，赚取巨额财富！</p>
              </div>
              <motion.button
                onClick={startGame}
                className="px-12 py-4 rounded-xl text-xl font-bold"
                style={{
                  backgroundColor: NEON_COLORS.gold,
                  color: '#1a1a0a',
                  boxShadow: `0 0 30px ${NEON_COLORS.gold}50`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                开始开采
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameStatus === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(26, 26, 10, 0.95)' }}
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
                公司破产
              </div>
              <div className="text-2xl mb-2" style={{ color: NEON_COLORS.gold }}>
                总收入: {revenue} 💰
              </div>
              <div className="text-lg mb-2" style={{ color: NEON_COLORS.neonGreen }}>
                共产石油: {Math.floor(totalOilProduced)} 桶
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
              <div className="text-lg mb-6" style={{ color: NEON_COLORS.gold }}>
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
                重新创业
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {gameStatus === 'playing' && (
        <div className="w-full max-w-[720px] glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              <motion.button
                onClick={handleSellOil}
                className="px-4 py-2 rounded-lg font-bold text-sm"
                style={{ 
                  backgroundColor: oil > 0 ? `${NEON_COLORS.neonGreen}30` : '#333',
                  color: oil > 0 ? NEON_COLORS.neonGreen : '#666'
                }}
                whileHover={{ scale: oil > 0 ? 1.05 : 1 }}
                whileTap={{ scale: oil > 0 ? 0.95 : 1 }}
                disabled={oil <= 0}
              >
                🛢️ 出售石油 ({Math.floor(oil)}桶)
              </motion.button>

              <motion.button
                onClick={handleUpgradeDriller}
                className="px-4 py-2 rounded-lg font-bold text-sm"
                style={{ 
                  backgroundColor: money >= 500 ? `${NEON_COLORS.neonPink}30` : '#333',
                  color: money >= 500 ? NEON_COLORS.neonPink : '#666'
                }}
                whileHover={{ scale: money >= 500 ? 1.05 : 1 }}
                whileTap={{ scale: money >= 500 ? 0.95 : 1 }}
                disabled={money < 500}
              >
                🔧 升级钻机 (500💰)
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {FIELD_TYPES.map(type => {
              const config = FIELD_CONFIG[type];
              const isUnlocked = fields.some(f => f.type === type);
              
              return (
                <div
                  key={type}
                  className="flex flex-col items-center p-2 rounded-lg"
                  style={{ 
                    backgroundColor: isUnlocked ? `${config.color}` : '#333',
                    opacity: isUnlocked ? 1 : 0.5
                  }}
                >
                  <span className="text-2xl">{config.emoji}</span>
                  <span className="text-xs font-bold" style={{ color: '#fff' }}>{config.name}</span>
                  <span className="text-xs" style={{ color: NEON_COLORS.gold }}>
                    {isUnlocked ? '已解锁' : `${config.unlockCost}💰`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-xs opacity-70 flex flex-wrap gap-3">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: WELL_STATUS_COLORS.empty }}></div>
              <span>空井(点击钻井)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: WELL_STATUS_COLORS.drilling }}></div>
              <span>钻井中</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: WELL_STATUS_COLORS.producing }}></div>
              <span>生产中</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: WELL_STATUS_COLORS.depleted }}></div>
              <span>枯竭</span>
            </div>
          </div>
        </div>
      )}

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>点击空井开始钻井</div>
        <div>积累石油后出售赚取金币，注意管理资金！</div>
      </div>
    </div>
  );
}
