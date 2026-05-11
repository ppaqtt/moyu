import { useState, useCallback } from 'react';
import { LogicProgramEngine, LogicComponent, Connection, Position } from './engine';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CELL_SIZE = 70;

export default function LogicProgram() {
  const [engine] = useState(() => new LogicProgramEngine());
  const [gameState, setGameState] = useState({
    level: engine.getLevel(),
    components: engine.getComponents(),
    connections: engine.getConnections(),
    connectionStart: engine.getConnectionStart(),
    gridSize: engine.getGridSize(),
    completed: engine.isCompleted()
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const updateState = useCallback(() => {
    setGameState({
      level: engine.getLevel(),
      components: engine.getComponents(),
      connections: engine.getConnections(),
      connectionStart: engine.getConnectionStart(),
      gridSize: engine.getGridSize(),
      completed: engine.isCompleted()
    });
  }, [engine]);

  const handleCellClick = (x: number, y: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      engine.removeConnectionAt(x, y);
    } else {
      engine.handleComponentClick(x, y);
    }
    updateState();
    if (engine.isCompleted()) {
      setMessage('🎉 逻辑电路完成！');
    }
  };

  const handleClearConnections = () => {
    engine.clearConnections();
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
        const isStart = gameState.connectionStart?.x === x && gameState.connectionStart?.y === y;
        const isComponent = gameState.components.some(c => c.position.x === x && c.position.y === y);
        
        if (!isComponent) {
          cells.push(
            <div
              key={`${x}-${y}`}
              className={`absolute border border-purple-900/30 flex items-center justify-center transition-all cursor-pointer hover:bg-purple-900/20 ${isStart ? 'bg-purple-600/30 ring-2 ring-purple-400' : 'bg-slate-800/30'}`}
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
    }

    return cells;
  };

  const renderConnections = () => {
    const { connections, components } = gameState;
    return connections.map(conn => {
      const fromComp = components.find(c => c.position.x === conn.from.x && c.position.y === conn.from.y);
      const toComp = components.find(c => c.position.x === conn.to.x && c.position.y === conn.to.y);
      
      const fromX = conn.from.x * CELL_SIZE + CELL_SIZE / 2;
      const fromY = conn.from.y * CELL_SIZE + CELL_SIZE / 2;
      const toX = conn.to.x * CELL_SIZE + CELL_SIZE / 2;
      const toY = conn.to.y * CELL_SIZE + CELL_SIZE / 2;

      const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
      const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
      
      const isActive = fromComp?.value || false;

      return (
        <div
          key={conn.id}
          className="absolute z-10 pointer-events-none"
          style={{
            left: fromX,
            top: fromY - 4,
            width: length,
            height: 8,
            backgroundColor: isActive ? '#22c55e' : '#6b7280',
            transformOrigin: '0 50%',
            transform: `rotate(${angle}deg)`,
            borderRadius: 4,
            boxShadow: isActive ? '0 0 10px rgba(34, 197, 94, 0.6)' : 'none'
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
        className="absolute z-20 flex items-center justify-center cursor-pointer"
        style={{
          left: component.position.x * CELL_SIZE,
          top: component.position.y * CELL_SIZE,
          width: CELL_SIZE,
          height: CELL_SIZE
        }}
        animate={component.value ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
        onClick={(e) => handleCellClick(component.position.x, component.position.y, e)}
      >
        <div
          className={`relative w-14 h-14 rounded-lg flex flex-col items-center justify-center text-xs font-bold ${
            component.type === 'input' ? (component.value ? 'bg-gradient-to-br from-green-500 to-green-700' : 'bg-gradient-to-br from-slate-600 to-slate-800') :
            component.type === 'output' ? (component.value ? 'bg-gradient-to-br from-yellow-500 to-orange-600' : 'bg-gradient-to-br from-slate-600 to-slate-800') :
            component.value ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-slate-600 to-slate-800'
          }`}
          style={{
            boxShadow: component.value ? '0 0 20px rgba(168, 85, 247, 0.6)' : '0 4px 12px rgba(0,0,0,0.3)',
            border: gameState.connectionStart?.x === component.position.x && gameState.connectionStart?.y === component.position.y ? '2px solid #a855f7' : 'none'
          }}
        >
          <span className="text-lg">
            {component.type === 'input' ? 'I' :
             component.type === 'output' ? 'O' :
             component.type}
          </span>
          <span className="text-[10px] mt-1">
            {component.value ? 'T' : 'F'}
          </span>
        </div>
      </motion.div>
    ));
  };

  const { level, completed } = gameState;
  const output = gameState.components.find(c => c.type === 'output');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-2">
            🧠 逻辑编程
          </h1>
          <p className="text-gray-400">连接逻辑门，完成电路！</p>
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
            <span className="text-purple-400 font-bold">
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
          <p className="text-purple-300">📚 {level.lesson}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">🔮 逻辑电路</h2>
              <div
                className="relative mx-auto rounded-xl overflow-hidden"
                style={{
                  width: gameState.gridSize.width * CELL_SIZE,
                  height: gameState.gridSize.height * CELL_SIZE,
                  background: 'linear-gradient(135deg, #1e293b, #334155)'
                }}
              >
                {renderGrid()}
                {renderConnections()}
                {renderComponents()}
              </div>

              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={handleClearConnections}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-medium transition-colors"
                >
                  🗑️ 清除连接
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
              <h2 className="text-xl font-bold text-white mb-4">📖 逻辑门说明</h2>
              <div className="space-y-3 text-sm">
                <div className="p-2 bg-purple-900/30 rounded">
                  <div className="font-bold text-purple-300">AND (与门)</div>
                  <div className="text-gray-400">两个都为true才输出true</div>
                </div>
                <div className="p-2 bg-blue-900/30 rounded">
                  <div className="font-bold text-blue-300">OR (或门)</div>
                  <div className="text-gray-400">任一为true就输出true</div>
                </div>
                <div className="p-2 bg-pink-900/30 rounded">
                  <div className="font-bold text-pink-300">NOT (非门)</div>
                  <div className="text-gray-400">反转输入值</div>
                </div>
                <div className="p-2 bg-yellow-900/30 rounded">
                  <div className="font-bold text-yellow-300">XOR (异或)</div>
                  <div className="text-gray-400">恰有一个为true时输出true</div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-3">💡 操作说明</h2>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• 点击输入开关可切换true/false</li>
                <li>• 点击组件然后点击另一组件连接</li>
                <li>• 按住Shift+点击可以清除连接</li>
                <li>• 绿色连接线表示激活状态</li>
                <li>• 目标：让输出达到指定状态！</li>
              </ul>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">📊 电路状态</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">连接数量</span>
                  <span className="text-white font-bold">{gameState.connections.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">目标输出</span>
                  <span className="text-white font-bold">{level.targetOutput ? 'True' : 'False'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">当前输出</span>
                  <span className={`font-bold ${output?.value === level.targetOutput ? 'text-green-400' : 'text-red-400'}`}>
                    {output?.value ? 'True' : 'False'}
                  </span>
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
          border: 1px solid rgba(168, 85, 247, 0.3);
        }
      `}</style>
    </div>
  );
}
