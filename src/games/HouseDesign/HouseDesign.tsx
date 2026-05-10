import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HouseDesignEngine, Furniture } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const engine = new HouseDesignEngine();

export default function HouseDesign() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [money, setMoney] = useState(10000);
  const [reputation, setReputation] = useState(0);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [selectedFurnitureType, setSelectedFurnitureType] = useState<string | null>(null);
  const [roomItems, setRoomItems] = useState<Furniture[]>([]);
  const [roomBudget, setRoomBudget] = useState({ total: 3000, spent: 0 });
  const [roomNames, setRoomNames] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const canvasSize = engine.getCanvasSize();

  useEffect(() => {
    const names = engine.roomConfigs.map(r => r.name);
    setRoomNames(names);
  }, []);

  const startGame = useCallback(() => {
    engine.start();
    setGameState('playing');
    setMoney(10000);
    setReputation(0);
    setCurrentRoomIndex(0);
    setSelectedFurnitureType(null);
    updateRoomState(0);
  }, []);

  const updateRoomState = (roomIndex: number) => {
    const room = engine.state.rooms[roomIndex];
    setRoomItems([...room.items]);
    setRoomBudget({ total: room.budget, spent: room.spent });
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const state = engine.getState();
      setMoney(state.money);
      setReputation(state.reputation);
    }, 100);

    return () => clearInterval(interval);
  }, [gameState]);

  const handleRoomSelect = (index: number) => {
    setCurrentRoomIndex(index);
    engine.selectRoom(index);
    updateRoomState(index);
    setSelectedFurnitureType(null);
  };

  const handleFurnitureSelect = (type: string) => {
    setSelectedFurnitureType(type);
    engine.selectFurniture(type);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedFurnitureType) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const success = engine.placeFurniture(x - 30, y - 20);
    if (success) {
      updateRoomState(currentRoomIndex);
      setSelectedFurnitureType(null);
    }
  };

  const handleItemClick = (item: Furniture, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.detail === 2) {
      engine.rotateFurniture(item.id);
      updateRoomState(currentRoomIndex);
    }
  };

  const handleItemDelete = (item: Furniture) => {
    engine.removeFurniture(item.id);
    updateRoomState(currentRoomIndex);
  };

  const renderMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-8xl mb-6"
      >
        🏠
      </motion.div>
      <h1 className="text-5xl font-bold mb-2" style={{
        color: NEON_COLORS.neonPink,
        textShadow: `0 0 30px ${NEON_COLORS.neonPink}, 0 0 60px ${NEON_COLORS.neonPink}`
      }}>
        HouseDesign
      </h1>
      <h2 className="text-2xl mb-12" style={{ color: NEON_COLORS.gold }}>
        房屋设计
      </h2>
      <motion.button
        onClick={startGame}
        className="px-12 py-4 rounded-xl text-xl font-bold mb-4"
        style={{
          background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.gold})`,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}80`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        开始设计
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
        <p className="text-sm">选择家具并点击房间放置</p>
        <p className="text-sm">双击家具旋转,点击X删除</p>
      </div>
    </motion.div>
  );

  const renderGame = () => (
    <div className="flex flex-col items-center gap-4" style={{ width: 700 }}>
      <div className="w-full glass-card rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs opacity-70">预算</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.gold }}>{money.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs opacity-70">声望</div>
              <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>
                {reputation}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-70">
              {roomNames[currentRoomIndex]} 预算: {roomBudget.spent}/{roomBudget.total}
            </div>
            <div className="w-32 h-2 rounded-full overflow-hidden mt-1" style={{ background: NEON_COLORS.surface }}>
              <div
                className="h-full rounded-full"
                style={{
                  background: roomBudget.spent > roomBudget.total * 0.9 ? NEON_COLORS.danger : NEON_COLORS.neonPink,
                  width: `${Math.min(100, (roomBudget.spent / roomBudget.total) * 100)}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center gap-2">
        {roomNames.map((name, i) => (
          <button
            key={i}
            onClick={() => handleRoomSelect(i)}
            className="px-4 py-2 rounded-lg text-sm font-bold"
            style={{
              background: currentRoomIndex === i ? NEON_COLORS.neonPink : `${NEON_COLORS.neonPink}30`,
              border: `2px solid ${NEON_COLORS.neonPink}`,
              color: currentRoomIndex === i ? '#fff' : NEON_COLORS.neonPink,
              boxShadow: currentRoomIndex === i ? `0 0 15px ${NEON_COLORS.neonPink}` : 'none',
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <div
        className="rounded-xl relative overflow-hidden cursor-crosshair"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          background: engine.roomConfigs[currentRoomIndex].color,
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}40`,
          border: `2px solid ${NEON_COLORS.neonPink}40`,
        }}
        onClick={handleCanvasClick}
      >
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />

        {roomItems.map(item => (
          <motion.div
            key={item.id}
            className="absolute flex flex-col items-center justify-center rounded-lg cursor-move"
            style={{
              left: item.x,
              top: item.y,
              width: item.width,
              height: item.height,
              background: `${item.color}cc`,
              border: `2px solid ${item.color}`,
              transform: `rotate(${item.rotation}deg)`,
              boxShadow: `0 2px 8px rgba(0,0,0,0.2)`,
            }}
            drag
            dragMomentum={false}
            onClick={(e) => handleItemClick(item, e)}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.1, zIndex: 100 }}
            onDragEnd={(_, info) => {
              engine.moveFurniture(item.id, item.x + info.offset.x, item.y + info.offset.y);
              updateRoomState(currentRoomIndex);
            }}
          >
            <span className="text-2xl">{item.emoji}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleItemDelete(item);
              }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
            >
              ×
            </button>
          </motion.div>
        ))}

        {selectedFurnitureType && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-card rounded-lg px-4 py-2 text-sm">
            点击放置家具，或点击其他家具切换选择
          </div>
        )}
      </div>

      <div className="w-full glass-card rounded-xl p-4">
        <div className="text-sm font-bold mb-3">家具选择</div>
        <div className="grid grid-cols-4 gap-2">
          {engine.furnitureTypes.map(furniture => {
            const canAfford = money >= furniture.price && roomBudget.total - roomBudget.spent >= furniture.price;
            return (
              <motion.button
                key={furniture.type}
                onClick={() => handleFurnitureSelect(furniture.type)}
                className="p-2 rounded-lg flex flex-col items-center"
                style={{
                  background: selectedFurnitureType === furniture.type
                    ? `${furniture.color}50`
                    : canAfford
                      ? NEON_COLORS.surface
                      : '#333',
                  border: `2px solid ${selectedFurnitureType === furniture.type ? NEON_COLORS.gold : 'transparent'}`,
                  opacity: canAfford ? 1 : 0.5,
                }}
                whileHover={canAfford ? { scale: 1.05 } : {}}
                whileTap={canAfford ? { scale: 0.95 } : {}}
                disabled={!canAfford}
              >
                <span className="text-2xl mb-1">{furniture.emoji}</span>
                <span className="text-xs">{furniture.name}</span>
                <span className="text-xs" style={{ color: NEON_COLORS.gold }}>
                  {furniture.price}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="w-full text-center opacity-60 text-sm">
        <p>提示: 点击家具选择,拖拽移动,双击旋转,点击X删除</p>
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
    <div className="flex flex-col items-center p-4 min-h-screen" style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #1a0a1a 100%)` }}>
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
