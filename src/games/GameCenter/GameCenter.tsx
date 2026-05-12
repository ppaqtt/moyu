import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GameCenterEngine, ArcadeMachine } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const engine = new GameCenterEngine();

export default function GameCenter() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [money, setMoney] = useState(5000);
  const [reputation, setReputation] = useState(50);
  const [day, setDay] = useState(1);
  const [machines, setMachines] = useState<ArcadeMachine[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const startGame = useCallback(() => {
    engine.start();
    setGameState('playing');
    setMoney(5000);
    setReputation(50);
    setDay(1);
    setIsOpen(false);
    setTotalEarnings(0);
    setTotalCustomers(0);
    setSelectedMachine(null);
    loadState();
  }, []);

  const loadState = () => {
    const state = engine.getState();
    setMachines([...state.machines]);
    setCustomers([...state.customers]);
    setMoney(state.money);
    setReputation(state.reputation);
    setDay(state.day);
    setIsOpen(state.isOpen);
    setTotalEarnings(state.totalEarnings);
    setTotalCustomers(state.totalCustomers);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(loadState, 100);
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (!isOpen || gameState !== 'playing') return;

    const customerInterval = setInterval(() => {
      engine.spawnCustomer();
    }, 3000);

    const updateInterval = setInterval(() => {
      engine.updateCustomers(100);
    }, 100);

    return () => {
      clearInterval(customerInterval);
      clearInterval(updateInterval);
    };
  }, [isOpen, gameState]);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  };

  const handleOpen = () => {
    engine.openGameCenter();
    setIsOpen(true);
  };

  const handleClose = () => {
    engine.closeGameCenter();
    setIsOpen(false);
    loadState();
    showNotification(`第 ${day} 天结束!`);
  };

  const handleUpgrade = (machineId: number) => {
    if (engine.upgradeMachine(machineId)) {
      showNotification('机器升级成功!');
      loadState();
    } else {
      showNotification('资金不足!');
    }
  };

  const handleRepair = (machineId: number) => {
    if (engine.repairMachine(machineId)) {
      showNotification('机器维修完成!');
      loadState();
    } else {
      showNotification('无法维修!');
    }
  };

  const handlePlayMachine = (machineId: number, customerId: number) => {
    if (engine.playMachine(machineId, customerId)) {
      loadState();
    }
  };

  const handleBuyMachine = () => {
    if (engine.buyNewMachine()) {
      showNotification('新机器购买成功!');
      loadState();
    } else {
      showNotification('资金不足或已达上限!');
    }
  };

  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-8xl mb-6"
      >
        🕹️
      </motion.div>
      <h1 className="text-5xl font-bold mb-2" style={{
        color: NEON_COLORS.neonPink,
        textShadow: `0 0 30px ${NEON_COLORS.neonPink}, 0 0 60px ${NEON_COLORS.neonPink}`
      }}>
        GameCenter
      </h1>
      <h2 className="text-2xl mb-12" style={{ color: NEON_COLORS.neonCyan }}>
        游戏厅
      </h2>
      <motion.button
        onClick={startGame}
        className="px-12 py-4 rounded-xl text-xl font-bold mb-4"
        style={{
          background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonCyan})`,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}80`,
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
        <p className="text-sm">开门营业,招待顾客</p>
        <p className="text-sm">升级和维护游戏机</p>
      </div>
    </motion.div>
  );

  const renderGame = () => (
    <div className="flex flex-col items-center gap-4" style={{ width: 700 }}>
      <AnimatePresence>
        {notification && (
          <motion.div
            className="fixed top-20 z-50 px-6 py-3 rounded-xl font-bold"
            style={{
              background: NEON_COLORS.neonPink,
              color: '#fff',
              boxShadow: `0 0 30px ${NEON_COLORS.neonPink}`,
            }}
            initial={{ scale: 0, opacity: 0, y: -50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full glass-card rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs opacity-70">资金</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.gold }}>${money.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs opacity-70">声望</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>
                {reputation}%
              </div>
            </div>
            <div>
              <div className="text-xs opacity-70">第 {day} 天</div>
              <div className="text-2xl font-bold" style={{ color: isOpen ? NEON_COLORS.neonGreen : NEON_COLORS.text }}>
                {isOpen ? '营业中' : '休息'}
              </div>
            </div>
          </div>
          <motion.button
            onClick={isOpen ? handleClose : handleOpen}
            className="px-6 py-3 rounded-xl font-bold"
            style={{
              background: isOpen ? NEON_COLORS.danger : NEON_COLORS.neonGreen,
              border: `2px solid ${isOpen ? NEON_COLORS.danger : NEON_COLORS.neonGreen}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isOpen ? '🚪 打烊' : '🏃 开门营业'}
          </motion.button>
        </div>
        <div className="flex gap-4 mt-3 text-sm">
          <span>💰 总收入: ${totalEarnings.toLocaleString()}</span>
          <span>👥 顾客: {totalCustomers}</span>
        </div>
      </div>

      <div className="w-full glass-card rounded-xl p-4" style={{ background: '#1a1a2a' }}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-bold">🎮 游戏机 ({machines.length}/8)</div>
          <motion.button
            onClick={handleBuyMachine}
            disabled={machines.length >= 8 || money < 1000}
            className="px-4 py-2 rounded text-sm font-bold"
            style={{
              background: machines.length < 8 && money >= 1000 ? NEON_COLORS.neonCyan : NEON_COLORS.surface,
              color: machines.length < 8 && money >= 1000 ? '#000' : NEON_COLORS.textDim,
              opacity: machines.length >= 8 || money < 1000 ? 0.5 : 1,
            }}
            whileHover={machines.length < 8 && money >= 1000 ? { scale: 1.05 } : {}}
          >
            + 购买新机器 ${1000 + machines.length * 500}
          </motion.button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {machines.map(machine => (
            <motion.div
              key={machine.id}
              className="p-3 rounded-lg cursor-pointer"
              style={{
                background: selectedMachine === machine.id ? `${NEON_COLORS.neonPink}30` : NEON_COLORS.surface,
                border: `2px solid ${selectedMachine === machine.id ? NEON_COLORS.neonPink : 'transparent'}`,
              }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedMachine(selectedMachine === machine.id ? null : machine.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">{machine.emoji}</span>
                <div className="text-xs">
                  <span className="px-2 py-1 rounded" style={{ background: NEON_COLORS.primary, color: '#000' }}>
                    Lv.{machine.level}
                  </span>
                </div>
              </div>
              <div className="font-bold text-sm mb-1">{machine.name}</div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs opacity-60">状态</span>
                <span className="text-xs" style={{
                  color: machine.condition > 70 ? NEON_COLORS.neonGreen :
                         machine.condition > 30 ? NEON_COLORS.gold : NEON_COLORS.danger
                }}>
                  {machine.condition}%
                </span>
              </div>
              <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: NEON_COLORS.background }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    background: machine.condition > 70 ? NEON_COLORS.neonGreen :
                               machine.condition > 30 ? NEON_COLORS.gold : NEON_COLORS.danger,
                    width: `${machine.condition}%`
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs" style={{ color: NEON_COLORS.gold }}>${machine.earnings}/次</span>
                <span className="text-xs opacity-60">🔥 {machine.popularity}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {selectedMachine !== null && (
        <motion.div
          className="w-full glass-card rounded-xl p-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-bold">
              {machines[selectedMachine]?.emoji} {machines[selectedMachine]?.name} 设置
            </div>
          </div>
          <div className="flex gap-4">
            <motion.button
              onClick={() => handleUpgrade(selectedMachine!)}
              disabled={machines[selectedMachine]?.level >= machines[selectedMachine]?.maxLevel || money < machines[selectedMachine]?.upgradeCost}
              className="flex-1 py-3 rounded-lg font-bold"
              style={{
                background: machines[selectedMachine]?.level < machines[selectedMachine]?.maxLevel && money >= machines[selectedMachine]?.upgradeCost
                  ? NEON_COLORS.primary
                  : NEON_COLORS.surface,
                color: machines[selectedMachine]?.level < machines[selectedMachine]?.maxLevel && money >= machines[selectedMachine]?.upgradeCost
                  ? '#000'
                  : NEON_COLORS.textDim,
                opacity: machines[selectedMachine]?.level >= machines[selectedMachine]?.maxLevel ? 0.5 : 1,
              }}
              whileHover={machines[selectedMachine]?.level < machines[selectedMachine]?.maxLevel ? { scale: 1.02 } : {}}
            >
              ⬆️ 升级 ${machines[selectedMachine]?.upgradeCost}
              {machines[selectedMachine]?.level >= machines[selectedMachine]?.maxLevel && ' (满级)'}
            </motion.button>
            <motion.button
              onClick={() => handleRepair(selectedMachine!)}
              disabled={machines[selectedMachine]?.condition >= 100 || money < machines[selectedMachine]?.repairCost}
              className="flex-1 py-3 rounded-lg font-bold"
              style={{
                background: machines[selectedMachine]?.condition < 100 && money >= machines[selectedMachine]?.repairCost
                  ? NEON_COLORS.warning
                  : NEON_COLORS.surface,
                color: machines[selectedMachine]?.condition < 100 && money >= machines[selectedMachine]?.repairCost
                  ? '#000'
                  : NEON_COLORS.textDim,
                opacity: machines[selectedMachine]?.condition >= 100 ? 0.5 : 1,
              }}
              whileHover={machines[selectedMachine]?.condition < 100 ? { scale: 1.02 } : {}}
            >
              🔧 维修 ${machines[selectedMachine]?.repairCost}
              {machines[selectedMachine]?.condition >= 100 && ' (完好)'}
            </motion.button>
          </div>
        </motion.div>
      )}

      {isOpen && customers.length > 0 && (
        <div className="w-full glass-card rounded-xl p-4" style={{ background: '#1a2a1a' }}>
          <div className="text-sm font-bold mb-3">👾 顾客 ({customers.length})</div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <AnimatePresence>
              {customers.map(customer => (
                <motion.div
                  key={customer.id}
                  className="flex-shrink-0 p-3 rounded-lg"
                  style={{
                    background: NEON_COLORS.surface,
                    border: `1px solid ${NEON_COLORS.neonCyan}40`,
                    minWidth: 140,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm">{customer.name}</span>
                    <span className="text-xs" style={{ color: NEON_COLORS.gold }}>
                      💰 {customer.coins}
                    </span>
                  </div>
                  <div className="text-xs opacity-60 mb-2">
                    偏好: {customer.preferredMachine}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs opacity-60">满意度</span>
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: NEON_COLORS.background }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          background: customer.satisfaction > 70 ? NEON_COLORS.neonGreen :
                                     customer.satisfaction > 40 ? NEON_COLORS.gold : NEON_COLORS.danger,
                          width: `${customer.satisfaction}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs opacity-60">耐心</span>
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: NEON_COLORS.background }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          background: customer.patience > 30 ? NEON_COLORS.neonCyan :
                                     customer.patience > 15 ? NEON_COLORS.gold : NEON_COLORS.danger,
                          width: `${(customer.patience / 50) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {machines.map(machine => (
                      <motion.button
                        key={machine.id}
                        onClick={() => handlePlayMachine(machine.id, customer.id)}
                        disabled={customer.coins < 2 + machine.level}
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          background: customer.coins >= 2 + machine.level
                            ? NEON_COLORS.neonPink
                            : NEON_COLORS.surface,
                          color: customer.coins >= 2 + machine.level
                            ? '#fff'
                            : NEON_COLORS.textDim,
                          opacity: customer.coins >= 2 + machine.level ? 1 : 0.5,
                        }}
                        whileHover={customer.coins >= 2 + machine.level ? { scale: 1.1 } : {}}
                      >
                        {machine.emoji} ${2 + machine.level}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {isOpen && customers.length === 0 && (
        <div className="w-full glass-card rounded-xl p-6 text-center" style={{ background: '#1a1a2a' }}>
          <div className="text-4xl mb-4">👾</div>
          <p className="opacity-60">等待顾客上门...</p>
        </div>
      )}

      <div className="w-full glass-card rounded-xl p-4">
        <div className="text-center text-sm opacity-60">
          <p>提示: 保持机器状态良好可提高满意度</p>
          <p>升级机器可获得更多收入</p>
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
    <div className="flex flex-col items-center p-4 min-h-screen" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #1a0a2a 100%)` }}>
      <style>{`
        .glass-card {
          background: ${NEON_COLORS.surface}dd;
          backdrop-filter: blur(10px);
          border: 1px solid ${NEON_COLORS.neonPink}30;
        }
      `}</style>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
    </div>
  );
}
