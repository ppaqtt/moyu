import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGameLoop } from '../../hooks/useGameLoop';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { SpaceTraderEngine, Planet, CargoType, Cargo } from './engine';

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 500;

const CARGO_TYPES: CargoType[] = ['ore', 'fuel', 'food', 'tech', 'luxury'];

const CARGO_CONFIG: Record<CargoType, { name: string; emoji: string; color: string }> = {
  ore: { name: '矿石', emoji: '�ite', color: '#95a5a6' },
  fuel: { name: '燃料', emoji: '⛽', color: '#e74c3c' },
  food: { name: '食物', emoji: '🍖', color: '#27ae60' },
  tech: { name: '科技', emoji: '🔧', color: '#3498db' },
  luxury: { name: '奢侈品', emoji: '💎', color: '#9b59b6' }
};

export default function SpaceTrader() {
  const navigate = useNavigate();
  const [engine] = useState(() => new SpaceTraderEngine());
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [credits, setCredits] = useState(INITIAL_CREDITS);
  const [fuel, setFuel] = useState(100);
  const [maxFuel, setMaxFuel] = useState(100);
  const [cargo, setCargo] = useState<Cargo[]>([]);
  const [currentPlanet, setCurrentPlanet] = useState<Planet | undefined>(undefined);
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [day, setDay] = useState(1);
  const [highScore, setHighScore] = useLocalStorage<number>('spacetrader_highscore', 0);
  const [selectedCargo, setSelectedCargo] = useState<CargoType | null>(null);
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const INITIAL_CREDITS = 500;

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleTick = useCallback(() => {
    engine.tick();
    const state = engine.getState();
    setCredits(state.credits);
    setFuel(state.fuel);
    setMaxFuel(state.maxFuel);
    setCargo([...state.cargo]);
    setCurrentPlanet(engine.getCurrentPlanet());
    setPlanets([...state.planets]);
    setDay(state.day);

    if (state.gameOver && gameStatus === 'playing') {
      setGameStatus('gameover');
      const score = state.credits;
      if (score > highScore) {
        setHighScore(score);
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
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (let i = 0; i < 100; i++) {
        const x = (i * 73) % CANVAS_WIDTH;
        const y = (i * 37) % CANVAS_HEIGHT;
        const size = Math.random() * 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(100, 100, 150, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 60);
        ctx.lineTo(CANVAS_WIDTH, i * 60);
        ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 70, 0);
        ctx.lineTo(i * 70, CANVAS_HEIGHT);
        ctx.stroke();
      }

      planets.forEach(planet => {
        if (planet.id === currentPlanet?.id) {
          ctx.beginPath();
          ctx.arc(planet.x, planet.y, 45, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(planet.x, planet.y, 35, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
          planet.x - 10, planet.y - 10, 0,
          planet.x, planet.y, 35
        );
        gradient.addColorStop(0, planet.color);
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = planet.id === currentPlanet?.id ? '#ffd700' : '#4a4a6a';
        ctx.lineWidth = planet.id === currentPlanet?.id ? 3 : 1;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(planet.emoji, planet.x, planet.y + 6);
        ctx.fillText(planet.name, planet.x, planet.y + 55);
      });

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, 45);
      ctx.fillRect(0, CANVAS_HEIGHT - 35, CANVAS_WIDTH, 35);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`💰 ${credits}`, 20, 28);
      ctx.fillText(`⛽ ${fuel}/${maxFuel}`, 150, 28);
      ctx.fillText(`📅 第${day}天`, 280, 28);

      ctx.fillStyle = '#00d2ff';
      ctx.textAlign = 'right';
      ctx.fillText(`🏆 ${highScore}`, CANVAS_WIDTH - 20, 28);

      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('🪐 点击星球旅行', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
    };

    draw();
  }, [gameStatus, planets, currentPlanet, credits, fuel, maxFuel, day, highScore]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedPlanet = engine.getPlanetAtPosition(x, y);
    if (clickedPlanet && clickedPlanet.id !== currentPlanet?.id) {
      engine.travelTo(clickedPlanet.id);
    }
  }, [engine, gameStatus, currentPlanet]);

  const handleRefuel = useCallback(() => {
    engine.refuel(10);
  }, [engine]);

  const handleBuyCargo = useCallback((type: CargoType) => {
    engine.buyCargo(type, 1);
  }, [engine]);

  const handleSellCargo = useCallback((type: CargoType) => {
    engine.sellCargo(type, 1);
  }, [engine]);

  const handleRestart = useCallback(() => {
    engine.reset();
    setGameStatus('idle');
  }, [engine]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <motion.h1
        className="text-3xl font-bold"
        style={{ color: NEON_COLORS.neonCyan }}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        🚀 星际贸易 🚀
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
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.gold }}>{credits} 💰</div>
        </div>

        <div className="text-center">
          <div className="text-xs opacity-70" style={{ color: NEON_COLORS.neonCyan }}>燃料</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{fuel}/{maxFuel}</div>
        </div>

        <div className="text-center">
          <div className="text-xs opacity-70" style={{ color: NEON_COLORS.neonPurple }}>天数</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPurple }}>{day}</div>
        </div>

        <div className="text-center">
          <div className="text-xs opacity-70" style={{ color: NEON_COLORS.neonGreen }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>{highScore}</div>
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
              style={{ backgroundColor: 'rgba(10, 10, 26, 0.95)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-7xl mb-6"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🚀
              </motion.div>
              <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonCyan }}>
                星际贸易
              </div>
              <div className="text-gray-400 mb-8 text-center px-8">
                <p>在星系中旅行贸易</p>
                <p>低买高卖，成为银河首富！</p>
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
                开始贸易
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameStatus === 'gameover' && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(10, 10, 26, 0.95)' }}
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
                贸易失败
              </div>
              <div className="text-2xl mb-2" style={{ color: NEON_COLORS.gold }}>
                最终资产: {credits} 💰
              </div>
              {credits >= highScore && credits > INITIAL_CREDITS && (
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
                再试一次
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {gameStatus === 'playing' && currentPlanet && (
        <div className="w-full max-w-[720px] glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentPlanet.emoji}</span>
              <div>
                <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonCyan }}>
                  {currentPlanet.name}
                </div>
                <div className="text-xs opacity-60">当前星球</div>
              </div>
            </div>
            <motion.button
              onClick={handleRefuel}
              className="px-4 py-2 rounded-lg font-bold text-sm"
              style={{
                backgroundColor: fuel >= maxFuel ? '#333' : `${NEON_COLORS.neonCyan}30`,
                color: fuel >= maxFuel ? '#666' : NEON_COLORS.neonCyan
              }}
              whileHover={{ scale: fuel < maxFuel ? 1.05 : 1 }}
              whileTap={{ scale: fuel < maxFuel ? 0.95 : 1 }}
              disabled={fuel >= maxFuel}
            >
              ⛽ 加油 ({currentPlanet.prices.fuel}💰)
            </motion.button>
          </div>

          <div className="text-sm mb-3" style={{ color: NEON_COLORS.gold }}>
            货物价格
          </div>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {CARGO_TYPES.map(type => {
              const config = CARGO_CONFIG[type];
              const price = currentPlanet.prices[type];
              const profit = cargo.find(c => c.type === type);
              const profitAmount = profit ? price - profit.buyPrice : 0;

              return (
                <div key={type} className="flex flex-col items-center p-2 rounded-lg" style={{ backgroundColor: `${config.color}20` }}>
                  <span className="text-xl">{config.emoji}</span>
                  <span className="text-xs" style={{ color: config.color }}>{config.name}</span>
                  <span className="text-sm font-bold">{price}💰</span>
                  {profitAmount !== 0 && (
                    <span className="text-xs" style={{ color: profitAmount > 0 ? NEON_COLORS.neonGreen : NEON_COLORS.danger }}>
                      {profitAmount > 0 ? '+' : ''}{profitAmount}
                    </span>
                  )}
                  <div className="flex gap-1 mt-1">
                    <motion.button
                      onClick={() => handleBuyCargo(type)}
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{ backgroundColor: NEON_COLORS.neonGreen }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      +
                    </motion.button>
                    <motion.button
                      onClick={() => handleSellCargo(type)}
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{ backgroundColor: NEON_COLORS.neonPink }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      -
                    </motion.button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-sm mb-2" style={{ color: NEON_COLORS.neonPurple }}>
            货运清单
          </div>
          <div className="flex flex-wrap gap-2">
            {cargo.length === 0 ? (
              <div className="text-sm opacity-50">空货舱</div>
            ) : (
              cargo.map(item => {
                const config = CARGO_CONFIG[item.type];
                return (
                  <div key={item.type} className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: `${config.color}30` }}>
                    <span>{config.emoji}</span>
                    <span className="text-sm">x{item.quantity}</span>
                  </div>
                );
              })
            )}
            <div className="text-sm opacity-60 ml-auto">
              容量: {cargo.reduce((sum, c) => sum + c.quantity, 0)}/20
            </div>
          </div>
        </div>
      )}

      <div className="text-center opacity-60 text-sm" style={{ color: NEON_COLORS.gold }}>
        <div>点击星球进行旅行，在不同星球间贸易获利</div>
        <div>注意燃料消耗，燃料耗尽则游戏结束</div>
      </div>
    </div>
  );
}
