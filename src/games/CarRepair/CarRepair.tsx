import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CarRepairEngine, Car } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const engine = new CarRepairEngine();

export default function CarRepair() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [money, setMoney] = useState(500);
  const [reputation, setReputation] = useState(50);
  const [completedCars, setCompletedCars] = useState(0);
  const [currentCar, setCurrentCar] = useState<Car | null>(null);
  const [waitingCars, setWaitingCars] = useState<Car[]>([]);
  const [currentTool, setCurrentTool] = useState('wrench');
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairProgress, setRepairProgress] = useState(0);
  const [repairSpeed, setRepairSpeed] = useState(1);
  const repairIntervalRef = useRef<number | null>(null);

  const startGame = useCallback(() => {
    engine.start();
    setGameState('playing');
    setMoney(500);
    setReputation(50);
    setCompletedCars(0);
    setCurrentCar(null);
    setCurrentTool('wrench');
    setIsRepairing(false);
    setRepairProgress(0);
    setRepairSpeed(1);
    loadState();
  }, []);

  const loadState = () => {
    const state = engine.getState();
    setMoney(state.money);
    setReputation(state.reputation);
    setWaitingCars([...state.waitingCars]);
    setRepairSpeed(state.repairSpeed);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const state = engine.getState();
      setMoney(state.money);
      setReputation(state.reputation);
      setCompletedCars(state.completedCars);
      setCurrentCar(state.currentCar);
      setWaitingCars([...state.waitingCars]);
      setRepairSpeed(state.repairSpeed);

      if (state.currentCar) {
        setRepairProgress(state.currentCar.repairProgress);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameState]);

  const handleSelectNextCar = () => {
    engine.selectNextCar();
    setIsRepairing(false);
    setRepairProgress(0);
  };

  const handleStartRepair = () => {
    if (!currentCar) return;
    engine.startRepair();
    setIsRepairing(true);
  };

  const handleStopRepair = () => {
    engine.stopRepair();
    setIsRepairing(false);
  };

  useEffect(() => {
    if (!isRepairing || gameState !== 'playing') {
      if (repairIntervalRef.current) {
        clearInterval(repairIntervalRef.current);
        repairIntervalRef.current = null;
      }
      return;
    }

    repairIntervalRef.current = window.setInterval(() => {
      engine.repair();
      const state = engine.getState();
      if (state.currentCar) {
        setRepairProgress(state.currentCar.repairProgress);
      }
    }, 50);

    return () => {
      if (repairIntervalRef.current) {
        clearInterval(repairIntervalRef.current);
      }
    };
  }, [isRepairing, gameState]);

  const handleToolSelect = (toolId: string) => {
    setCurrentTool(toolId);
    engine.selectTool(toolId);
  };

  const handleUpgradeSpeed = () => {
    if (engine.upgradeSpeed()) {
      loadState();
    }
  };

  const handleDismissCar = () => {
    engine.dismissCar();
    setIsRepairing(false);
    setRepairProgress(0);
  };

  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <motion.div
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-8xl mb-6"
      >
        🔧
      </motion.div>
      <h1 className="text-5xl font-bold mb-2" style={{
        color: NEON_COLORS.neonGreen,
        textShadow: `0 0 30px ${NEON_COLORS.neonGreen}, 0 0 60px ${NEON_COLORS.neonGreen}`
      }}>
        CarRepair
      </h1>
      <h2 className="text-2xl mb-12" style={{ color: NEON_COLORS.neonCyan }}>
        汽车维修
      </h2>
      <motion.button
        onClick={startGame}
        className="px-12 py-4 rounded-xl text-xl font-bold mb-4"
        style={{
          background: `linear-gradient(135deg, ${NEON_COLORS.neonGreen}, ${NEON_COLORS.neonCyan})`,
          boxShadow: `0 0 30px ${NEON_COLORS.neonGreen}80`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        开始营业
      </motion.button>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2 rounded-lg text-base"
        style={{
          background: 'transparent',
          border: `2px solid ${NEON_COLORS.textDim}`,
          color: NEON_COLORS.textDim,
        }}
      >
        返回主页
      </button>
      <div className="mt-8 text-center opacity-60">
        <p className="mb-2">操作说明</p>
        <p className="text-sm">选择车辆并开始维修</p>
        <p className="text-sm">使用不同工具提高效率</p>
      </div>
    </motion.div>
  );

  const renderGame = () => (
    <div className="flex flex-col items-center gap-4" style={{ width: 700 }}>
      <div className="w-full glass-card rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs opacity-70">收入</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.gold }}>${money.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs opacity-70">声望</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>{reputation}%</div>
            </div>
            <div>
              <div className="text-xs opacity-70">完成</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{completedCars}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm opacity-70">维修速度</div>
            <span className="font-bold" style={{ color: NEON_COLORS.primary }}>{repairSpeed}x</span>
            <motion.button
              onClick={handleUpgradeSpeed}
              className="px-3 py-1 rounded text-sm font-bold"
              style={{
                background: money >= 200 ? NEON_COLORS.primary : NEON_COLORS.surface,
                border: `1px solid ${NEON_COLORS.primary}`,
                color: money >= 200 ? '#000' : NEON_COLORS.textDim,
                opacity: money >= 200 ? 1 : 0.5,
              }}
              whileHover={money >= 200 ? { scale: 1.05 } : {}}
              disabled={money < 200}
            >
              $200 升级
            </motion.button>
          </div>
        </div>
      </div>

      <div className="w-full glass-card rounded-xl p-4" style={{ background: '#1a2a1a' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>
            {currentCar ? `${currentCar.emoji} ${currentCar.model}` : '等待车辆...'}
          </div>
          {currentCar && (
            <div className="text-sm">
              <span className="opacity-70">客户:</span> {currentCar.customerName}
            </div>
          )}
        </div>

        {currentCar ? (
          <>
            <div className="mb-4">
              <div className="text-sm mb-2 opacity-70">问题: {currentCar.problems.join(', ')}</div>
              <div className="w-full h-4 rounded-full overflow-hidden" style={{ background: NEON_COLORS.surface }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${NEON_COLORS.neonGreen}, ${NEON_COLORS.primary})`
                  }}
                  animate={{ width: `${Math.min(100, repairProgress)}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div className="text-center mt-1 text-sm">
                维修进度: {Math.min(100, Math.round(repairProgress))}%
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm">
                <span className="opacity-70">报酬:</span>
                <span className="font-bold" style={{ color: NEON_COLORS.gold }}>
                  ${currentCar.reward}
                </span>
              </div>
              <div className="flex gap-2">
                {isRepairing ? (
                  <motion.button
                    onClick={handleStopRepair}
                    className="px-6 py-3 rounded-lg font-bold"
                    style={{
                      background: NEON_COLORS.danger,
                      border: `2px solid ${NEON_COLORS.danger}`,
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ⏹ 停止
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={handleStartRepair}
                    className="px-6 py-3 rounded-lg font-bold"
                    style={{
                      background: NEON_COLORS.neonGreen,
                      border: `2px solid ${NEON_COLORS.neonGreen}`,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    🔧 开始维修
                  </motion.button>
                )}
                <motion.button
                  onClick={handleDismissCar}
                  className="px-4 py-3 rounded-lg font-bold"
                  style={{
                    background: 'transparent',
                    border: `2px solid ${NEON_COLORS.danger}`,
                    color: NEON_COLORS.danger,
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  跳过
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🚗</div>
            <p className="opacity-70 mb-4">当前没有待修车辆</p>
            <motion.button
              onClick={handleSelectNextCar}
              className="px-6 py-3 rounded-lg font-bold"
              style={{
                background: waitingCars.length > 0 ? NEON_COLORS.neonCyan : NEON_COLORS.surface,
                border: `2px solid ${NEON_COLORS.neonCyan}`,
                color: waitingCars.length > 0 ? '#000' : NEON_COLORS.textDim,
              }}
              whileHover={waitingCars.length > 0 ? { scale: 1.05 } : {}}
              disabled={waitingCars.length === 0}
            >
              {waitingCars.length > 0 ? '🚗 选择下一辆车' : '等待中...'}
            </motion.button>
          </div>
        )}
      </div>

      <div className="w-full glass-card rounded-xl p-4">
        <div className="text-sm font-bold mb-3">工具选择</div>
        <div className="flex justify-center gap-4">
          {engine.tools.map(tool => (
            <motion.button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className="p-3 rounded-lg flex flex-col items-center"
              style={{
                background: currentTool === tool.id
                  ? `${NEON_COLORS.primary}40`
                  : NEON_COLORS.surface,
                border: `2px solid ${currentTool === tool.id ? NEON_COLORS.primary : 'transparent'}`,
                boxShadow: currentTool === tool.id ? `0 0 15px ${NEON_COLORS.primary}` : 'none',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-3xl mb-1">{tool.emoji}</span>
              <span className="text-xs font-bold">{tool.name}</span>
              <span className="text-xs opacity-60">功率: {tool.repairPower}</span>
              {tool.cost > 0 && (
                <span className="text-xs" style={{ color: NEON_COLORS.gold }}>${tool.cost}</span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="w-full glass-card rounded-xl p-4">
        <div className="text-sm font-bold mb-3">等待维修的车辆</div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {waitingCars.map((car, i) => (
            <motion.div
              key={car.id}
              className="flex-shrink-0 p-3 rounded-lg text-center"
              style={{
                background: NEON_COLORS.surface,
                border: `1px solid ${NEON_COLORS.neonCyan}40`,
                minWidth: 120,
              }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-3xl mb-1">{car.emoji}</div>
              <div className="text-sm font-bold">{car.model}</div>
              <div className="text-xs opacity-60">{car.customerName}</div>
              <div className="text-xs mt-1" style={{ color: NEON_COLORS.gold }}>${car.reward}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.button
        onClick={() => navigate('/')}
        className="px-6 py-2 rounded-lg mt-4"
        style={{
          background: 'transparent',
          border: `2px solid ${NEON_COLORS.textDim}`,
          color: NEON_COLORS.textDim,
        }}
        whileHover={{ scale: 1.05 }}
      >
        返回主页
      </motion.button>
    </div>
  );

  return (
    <div className="flex flex-col items-center p-4 min-h-screen" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #0a1a0a 100%)` }}>
      <style>{`
        .glass-card {
          background: ${NEON_COLORS.surface}dd;
          backdrop-filter: blur(10px);
          border: 1px solid ${NEON_COLORS.neonGreen}30;
        }
      `}</style>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
    </div>
  );
}
