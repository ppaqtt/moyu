import { useState, useCallback } from 'react';
import { CircuitConnectEngine, Component, Wire, Position } from './engine';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CELL_SIZE = 60;

const COMPONENT_ICONS: Record<string, string> = {
  battery: '🔋',
  bulb: '💡',
  switch: '🔘',
  resistor: '⏸️'
};

export default function CircuitConnect() {
  const [engine] = useState(() => new CircuitConnectEngine());
  const [gameState, setGameState] = useState({
    level: engine.getLevel(),
    components: engine.getComponents(),
    wires: engine.getWires(),
    wireStart: engine.getWireStart(),
    gridSize: engine.getGridSize(),
    completed: engine.isCompleted()
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const updateState = useCallback(() => {
    setGameState({
      level: engine.getLevel(),
      components: engine.getComponents(),
      wires: engine.getWires(),
      wireStart: engine.getWireStart(),
      gridSize: engine.getGridSize(),
      completed: engine.isCompleted()
    });
  }, [engine]);

  const handleCellClick = (x: number, y: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      engine.removeWireAt(x, y);
    } else {
      engine.handleCellClick(x, y);
    }
    updateState();
    if (engine.isCompleted()) {
      setMessage('🎉 电路连接成功！');
    }
  };

  const handleClearWires = () => {
    engine.clearWires();
    updateState();
    setMessage('');
  };

  const handleReset = () => {
    engine.reset();
    updateState();
    setMessage('');
  };

  const handleLevelChange = (levelIndex: number) => {
    engine.loadLevel(levelIndex);
    updateState();
    setMessage('');
  };

  const handlePrevLevel = () => {
    const current = engine.getCurrentLevelIndex();
    if (current > 0) {
      handleLevelChange(current - 1);
    }
  };

  const handleNextLevel = () => {
    const current = engine.getCurrentLevelIndex();
    if (current < engine.getTotalLevels() - 1) {
      handleLevelChange(current + 1);
    }
  };

  const renderGrid = () => {
    const { gridSize } = gameState;
    const cells = [];

    for (let y = 0; y < gridSize.height; y++) {
      for (let x = 0; x < gridSize.width; x++) {
        const isStart = gameState.wireStart?.x === x && gameState.wireStart?.y === y;
        cells.push(
          <div
            key={`${x}-${y}`}
            className={`absolute border border-yellow-900/30 flex items-center justify-center transition-all cursor-pointer hover:bg-yellow-900/20 ${isStart ? 'bg-yellow-600/30 ring-2 ring-yellow-400' : 'bg-slate-800/30'}`}
            style={{
              left: x * CELL_SIZE,
              top: y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE
            }}
            onClick={(e) => handleCellClick(x, y, e)}
          />
        );
      }
    }

    return cells;
  };

  const renderWires = () => {
    const { wires } = gameState;
    return wires.map(wire => {
      const fromX = wire.from.x * CELL_SIZE + CELL_SIZE / 2;
      const fromY = wire.from.y * CELL_SIZE + CELL_SIZE / 2;
      const toX = wire.to.x * CELL_SIZE + CELL_SIZE / 2;
      const toY = wire.to.y * CELL_SIZE + CELL_SIZE / 2;

      const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
      const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));

      return (
        <div
          key={wire.id}
          className="absolute z-10 pointer-events-none"
          style={{
            left: fromX,
            top: fromY - 4,
            width: length,
            height: 8,
            backgroundColor: '#f59e0b',
            transformOrigin: '0 50%',
            transform: `rotate(${angle}deg)`,
            borderRadius: 4,
            boxShadow: '0 0 8px rgba(245, 158, 11, 0.5)'
          }}
        />
      );
    });
  };

  const renderComponents = () => {
    const { components } = gameState;
    return components.map(component => (
      <motion.div
        key={component.id}
        className="absolute z-20 flex items-center justify-center pointer-events-none"
        style={{
          left: component.position.x * CELL_SIZE,
          top: component.position.y * CELL_SIZE,
          width: CELL_SIZE,
          height: CELL_SIZE
        }}
        animate={component.powered ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <div
          className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-3xl ${
            component.type === 'battery' ? 'bg-gradient-to-br from-green-600 to-green-800' :
            component.type === 'bulb' ? (component.powered ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-slate-600 to-slate-800') :
            component.type === 'switch' ? (component.active ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-slate-600 to-slate-800') :
            'bg-gradient-to-br from-purple-600 to-purple-800'
          }`}
          style={{
            boxShadow: component.powered ? '0 0 20px rgba(251, 191, 36, 0.8)' : '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          {COMPONENT_ICONS[component.type]}
          {component.type === 'bulb' && component.powered && (
            <div className="absolute inset-0 rounded-xl bg-yellow-300 opacity-50 animate-pulse" />
          )}
        </div>
      </motion.div>
    ));
  };

  const { level, completed } = gameState;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900/20 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
            ⚡ 电路连接
          </h1>
          <p className="text-gray-400">连接电路，让灯泡亮起来！</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center items-center gap-4 mb-4"
        >
          <button
            onClick={handlePrevLevel}
            disabled={engine.getCurrentLevelIndex() === 0}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
          >
            ← 上一关
          </button>
          <div className="glass-card px-6 py-2 rounded-xl">
            <span className="text-yellow-400 font-bold">
              第 {engine.getCurrentLevelIndex() + 1} 关 / {engine.getTotalLevels()}
            </span>
            <span className="text-gray-400 ml-2">- {level.name}</span>
          </div>
          <button
            onClick={handleNextLevel}
            disabled={engine.getCurrentLevelIndex() === engine.getTotalLevels() - 1}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
          >
            下一关 →
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-4 mb-6 text-center"
        >
          <p className="text-yellow-300">📚 {level.lesson}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">🔌 电路区</h2>
              <div
                className="relative mx-auto rounded-xl overflow-hidden"
                style={{
                  width: gameState.gridSize.width * CELL_SIZE,
                  height: gameState.gridSize.height * CELL_SIZE,
                  background: 'linear-gradient(135deg, #1e293b, #334155)'
                }}
              >
                {renderGrid()}
                {renderWires()}
                {renderComponents()}
              </div>

              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={handleClearWires}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-medium transition-colors"
                >
                  🗑️ 清除导线
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
                >
                  🔄 重置
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
                >
                  🏠 返回
                </button>
              </div>

              {message && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-4 text-center font-bold text-lg text-green-400"
                >
                  {message}
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">📖 元件说明</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔋</span>
                  <span className="text-gray-300">电池 - 提供电力</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  <span className="text-gray-300">灯泡 - 需要点亮</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔘</span>
                  <span className="text-gray-300">开关 - 点击切换</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏸️</span>
                  <span className="text-gray-300">电阻 - 保护电路</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-3">💡 操作说明</h2>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• 点击两个相邻格子连接导线</li>
                <li>• 先点击起点，再点击终点</li>
                <li>• 按住Shift+点击可以清除导线</li>
                <li>• 点击开关可以切换状态</li>
                <li>• 连接电路让所有灯泡亮起来</li>
              </ul>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">📊 电路状态</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">导线数量</span>
                  <span className="text-white font-bold">{gameState.wires.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">灯泡数量</span>
                  <span className="text-white font-bold">{gameState.components.filter(c => c.type === 'bulb').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">点亮灯泡</span>
                  <span className="text-white font-bold">{gameState.components.filter(c => c.type === 'bulb' && c.powered).length}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
      `}</style>
    </div>
  );
}
