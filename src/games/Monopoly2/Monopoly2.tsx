import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { Monopoly2Engine, Monopoly2State, Property } from './engine';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;

const PROPERTY_COLORS: Record<string, string> = {
  brown: '#8B4513',
  lightBlue: '#87CEEB',
  pink: '#FF69B4',
  orange: '#FFA500',
  red: '#DC143C',
  yellow: '#FFD700',
  green: '#228B22',
  blue: '#0000CD',
  purple: '#9932CC',
};

export default function Monopoly2() {
  const navigate = useNavigate();
  const [engine] = useState(() => new Monopoly2Engine());
  const [gameState, setGameState] = useState<Monopoly2State>(() => engine.getState());
  const [highScore, setHighScore] = useLocalStorage<number>('monopoly2_highscore', 0);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [bidAmount, setBidAmount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const updateState = useCallback(() => {
    setGameState(engine.getState());
  }, [engine]);

  useEffect(() => {
    const handleGameLoop = () => {
      updateState();
      animationFrameRef.current = requestAnimationFrame(handleGameLoop);
    };
    
    handleGameLoop();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      const boardSize = CANVAS_WIDTH - 80;
      const margin = 40;
      const cellSize = boardSize / 10;
      
      ctx.fillStyle = '#2d2d44';
      ctx.fillRect(margin, margin, boardSize, boardSize);
      
      ctx.strokeStyle = '#4a4a6a';
      ctx.lineWidth = 2;
      ctx.strokeRect(margin, margin, boardSize, boardSize);
      
      const state = engine.getState();
      
      for (let i = 0; i < 40; i++) {
        const space = state.spaces[i];
        let x: number, y: number, width: number, height: number;
        let isCorner = false;
        
        if (i < 10) {
          x = margin + (9 - i) * cellSize;
          y = margin + boardSize - cellSize;
          width = cellSize;
          height = cellSize;
          if (i === 0) isCorner = true;
        } else if (i < 20) {
          x = margin;
          y = margin + (19 - i) * cellSize;
          width = cellSize;
          height = cellSize;
          if (i === 10) isCorner = true;
        } else if (i < 30) {
          x = margin + (i - 20) * cellSize;
          y = margin;
          width = cellSize;
          height = cellSize;
          if (i === 20) isCorner = true;
        } else {
          x = margin + boardSize - cellSize;
          y = margin + (i - 30) * cellSize;
          width = cellSize;
          height = cellSize;
          if (i === 30) isCorner = true;
        }
        
        if (space.type === 'property' && space.property) {
          const prop = space.property;
          ctx.fillStyle = PROPERTY_COLORS[prop.color] || '#666';
          ctx.fillRect(x + 2, y + 2, width - 4, height * 0.3);
        } else if (space.type === 'landmark') {
          ctx.fillStyle = '#9932CC';
          ctx.fillRect(x + 2, y + 2, width - 4, height * 0.3);
        } else if (space.type === 'chance') {
          ctx.fillStyle = '#ff6b9d';
          ctx.fillRect(x + 2, y + 2, width - 4, height * 0.3);
        } else if (space.type === 'community') {
          ctx.fillStyle = '#00d2ff';
          ctx.fillRect(x + 2, y + 2, width - 4, height * 0.3);
        } else if (space.type === 'tax') {
          ctx.fillStyle = '#ff4444';
          ctx.fillRect(x + 2, y + 2, width - 4, height * 0.3);
        } else if (isCorner) {
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(x + 2, y + 2, width - 4, height * 0.3);
        }
        
        ctx.strokeStyle = '#3a3a5a';
        ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
        
        ctx.fillStyle = '#fff';
        ctx.font = '7px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const displayName = space.name.length > 6 ? space.name.substring(0, 5) + '..' : space.name;
        ctx.fillText(displayName, x + width / 2, y + height / 2 + 3);
        
        if (space.property && space.property.owner !== null) {
          const ownerColor = state.players[space.property.owner]?.color || '#fff';
          ctx.fillStyle = ownerColor;
          ctx.beginPath();
          ctx.arc(x + width - 8, y + height - 8, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        if (space.landmark && space.landmark.owner !== null) {
          const ownerColor = state.players[space.landmark.owner]?.color || '#fff';
          ctx.fillStyle = ownerColor;
          ctx.beginPath();
          ctx.arc(x + 8, y + height - 8, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      const players = state.players.filter(p => !p.isBankrupt);
      players.forEach((player) => {
        const pos = engine.getPlayerPosition(player.id);
        
        ctx.fillStyle = player.color;
        ctx.shadowColor = player.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.id === 0 ? 'P' : 'AI', pos.x, pos.y);
      });
      
      if (state.diceResult) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${state.diceResult.dice1} + ${state.diceResult.dice2}`,
          CANVAS_WIDTH - 60,
          30
        );
        
        if (state.diceResult.isDouble) {
          ctx.fillStyle = '#ffd700';
          ctx.font = 'bold 12px Arial';
          ctx.fillText('🎲 双数!', CANVAS_WIDTH - 60, 55);
        }
      }
    };
    
    render();
  }, [engine, gameState]);

  useEffect(() => {
    if (gameState.phase === 'gameOver') {
      const finalScore = gameState.players[0]?.money || 0;
      if (finalScore > highScore) {
        setHighScore(finalScore);
      }
    }
  }, [gameState.phase, gameState.players, highScore, setHighScore]);

  const handleRollDice = useCallback(() => {
    engine.rollDice();
    updateState();
  }, [engine, updateState]);

  const handleBuyProperty = useCallback(() => {
    engine.buyProperty();
    updateState();
    setShowPropertyModal(false);
  }, [engine, updateState]);

  const handleSkipBuy = useCallback(() => {
    engine.skipBuy();
    updateState();
    setShowPropertyModal(false);
  }, [engine, updateState]);

  const handleStartBuilding = useCallback(() => {
    setShowBuildModal(true);
  }, []);

  const handleBuildHouse = useCallback((propertyId: number) => {
    engine.selectProperty(propertyId);
    engine.buildHouse();
    updateState();
  }, [engine, updateState]);

  const handlePlaceBid = useCallback(() => {
    if (bidAmount > 0) {
      engine.placeBid(bidAmount);
      updateState();
    }
  }, [engine, updateState, bidAmount]);

  const handleCloseAuction = useCallback(() => {
    engine.closeAuction();
    updateState();
  }, [engine, updateState]);

  const handleRestart = useCallback(() => {
    engine.reset();
    updateState();
    setShowPropertyModal(false);
    setShowBuildModal(false);
  }, [engine, updateState]);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const currentSpace = currentPlayer ? gameState.spaces[currentPlayer.position] : null;
  const playerProperties = currentPlayer?.properties || [];
  const playerPropertyDetails = playerProperties
    .map(id => gameState.spaces.find(s => s.property?.id === id)?.property)
    .filter((p): p is Property => p !== undefined);

  const canBuild = gameState.canBuild && currentPlayer?.id === 0;
  const highestBid = gameState.auctionBids.length > 0 
    ? Math.max(...gameState.auctionBids.map(b => b.amount))
    : 0;

  return (
    <div 
      className="min-h-screen flex flex-col items-center gap-4 py-6 px-4"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      }}
    >
      <div className="flex items-center justify-between w-full max-w-[850px] px-4">
        <motion.button
          onClick={handleExit}
          className="px-4 py-2 rounded-lg font-bold text-sm glass-card"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>当前金币</div>
          <motion.div 
            className="text-2xl font-bold"
            style={{ color: NEON_COLORS.neonPink }}
            key={currentPlayer?.money}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            💰 {currentPlayer?.money.toLocaleString() || 0}
          </motion.div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高记录</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>
            💎 {highScore.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between w-full max-w-[850px] px-4">
        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>回合</div>
          <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonGreen }}>
            第{gameState.round}轮
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>当前回合</div>
          <div className="text-lg font-bold" style={{ color: currentPlayer?.color }}>
            {currentPlayer?.name || '未知'}
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>位置</div>
          <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>
            {currentSpace?.name || '起点'}
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>地产数量</div>
          <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonGreen }}>
            🏠 {playerProperties.length}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <motion.button
          onClick={handleRollDice}
          className="px-8 py-4 rounded-xl font-bold text-lg glass-card"
          style={{
            background: gameState.phase === 'idle' || gameState.phase === 'building' 
              ? 'rgba(255, 107, 157, 0.3)' 
              : 'rgba(100, 100, 100, 0.3)',
            boxShadow: '0 0 20px rgba(255, 107, 157, 0.3)',
          }}
          whileHover={gameState.phase === 'idle' || gameState.phase === 'building' ? { scale: 1.05, boxShadow: '0 0 30px rgba(255, 107, 157, 0.5)' } : {}}
          whileTap={gameState.phase === 'idle' || gameState.phase === 'building' ? { scale: 0.95 } : {}}
          disabled={gameState.phase !== 'idle' && gameState.phase !== 'building'}
        >
          🎲 掷骰子
        </motion.button>

        {canBuild && (
          <motion.button
            onClick={handleStartBuilding}
            className="px-6 py-4 rounded-xl font-bold text-lg glass-card"
            style={{
              background: 'rgba(0, 210, 255, 0.3)',
              boxShadow: '0 0 20px rgba(0, 210, 255, 0.3)',
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 210, 255, 0.5)' }}
            whileTap={{ scale: 0.95 }}
          >
            🏗️ 建造
          </motion.button>
        )}

        <motion.button
          onClick={handleRestart}
          className="px-6 py-4 rounded-xl font-bold text-lg glass-card"
          style={{
            background: 'rgba(255, 215, 0, 0.3)',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄 重新开始
        </motion.button>
      </div>

      <div className="glass-card rounded-2xl p-4" style={{ boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-xl"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      <motion.div 
        className="text-center text-lg font-medium px-6 py-3 rounded-xl glass-card"
        style={{ color: NEON_COLORS.gold }}
        key={gameState.message}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {gameState.message}
      </motion.div>

      <div className="flex gap-4 flex-wrap justify-center">
        {gameState.players.map((player) => (
          <motion.div
            key={player.id}
            className="glass-card rounded-xl p-4 text-center"
            style={{ 
              border: player.id === gameState.currentPlayerIndex 
                ? `2px solid ${player.color}` 
                : '2px solid transparent',
              boxShadow: player.id === gameState.currentPlayerIndex 
                ? `0 0 15px ${player.color}50` 
                : 'none',
            }}
            whileHover={{ scale: 1.05 }}
          >
            <div 
              className="text-xl font-bold mb-2"
              style={{ color: player.color }}
            >
              {player.name}
            </div>
            <div className="text-sm" style={{ color: NEON_COLORS.gold }}>
              💰 {player.money.toLocaleString()}
            </div>
            <div className="text-xs opacity-70">
              🏠 {player.properties.length} 地产 | 🏛️ {player.landmarks.length} 设施
            </div>
            {player.getOutOfJailFree > 0 && (
              <div className="text-xs mt-1" style={{ color: NEON_COLORS.neonGreen }}>
                🃏 出狱卡 x{player.getOutOfJailFree}
              </div>
            )}
            {player.isBankrupt && (
              <div className="text-xs mt-2" style={{ color: '#ff4444' }}>
                💀 破产
              </div>
            )}
            {player.isInJail && (
              <div className="text-xs mt-2" style={{ color: '#ff4444' }}>
                🔒 监狱中 ({player.jailTurns}/3)
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {gameState.phase === 'buying' && currentSpace?.property && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleSkipBuy}
            />
            <motion.div
              className="relative glass-card rounded-2xl p-8 max-w-md mx-4"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
            >
              <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: NEON_COLORS.neonPink }}>
                🏠 购买地产
              </h2>
              
              <div 
                className="w-full h-16 rounded-lg mb-4 flex items-center justify-center"
                style={{ backgroundColor: PROPERTY_COLORS[currentSpace.property.color] }}
              >
                <span className="text-xl font-bold text-white">
                  {currentSpace.property.name}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span style={{ color: NEON_COLORS.gold }}>价格:</span>
                  <span className="font-bold" style={{ color: NEON_COLORS.neonBlue }}>
                    💰 {currentSpace.property.price}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: NEON_COLORS.gold }}>租金:</span>
                  <span style={{ color: NEON_COLORS.neonGreen }}>
                    {currentSpace.property.rent[0]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: NEON_COLORS.gold }}>盖房费用:</span>
                  <span style={{ color: NEON_COLORS.neonGreen }}>
                    {currentSpace.property.housePrice}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <motion.button
                  onClick={handleBuyProperty}
                  className="flex-1 py-3 rounded-xl font-bold"
                  style={{
                    background: 'rgba(57, 255, 20, 0.3)',
                    color: NEON_COLORS.neonGreen,
                  }}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(57, 255, 20, 0.5)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  ✅ 购买
                </motion.button>
                <motion.button
                  onClick={handleSkipBuy}
                  className="flex-1 py-3 rounded-xl font-bold"
                  style={{
                    background: 'rgba(255, 68, 68, 0.3)',
                    color: '#ff4444',
                  }}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255, 68, 68, 0.5)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  ❌ 跳过
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {gameState.phase === 'auction' && gameState.auctionProperty && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              className="relative glass-card rounded-2xl p-8 max-w-md mx-4"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
            >
              <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: NEON_COLORS.neonPink }}>
                🔨 拍卖
              </h2>
              
              <div 
                className="w-full h-16 rounded-lg mb-4 flex items-center justify-center"
                style={{ backgroundColor: PROPERTY_COLORS[gameState.auctionProperty.color] }}
              >
                <span className="text-xl font-bold text-white">
                  {gameState.auctionProperty.name}
                </span>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span style={{ color: NEON_COLORS.gold }}>起拍价:</span>
                  <span className="font-bold" style={{ color: NEON_COLORS.neonBlue }}>
                    💰 {Math.floor(gameState.auctionProperty.price / 2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: NEON_COLORS.gold }}>当前最高:</span>
                  <span className="font-bold" style={{ color: NEON_COLORS.neonGreen }}>
                    💰 {highestBid}
                  </span>
                </div>
              </div>

              {gameState.auctionBids.length > 0 && (
                <div className="mb-6 space-y-1">
                  {gameState.auctionBids.map((bid) => (
                    <div key={bid.playerId} className="flex justify-between text-sm">
                      <span style={{ color: gameState.players[bid.playerId]?.color }}>
                        {gameState.players[bid.playerId]?.name}
                      </span>
                      <span>💰 {bid.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-6">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  placeholder="输入出价..."
                />
              </div>

              <div className="flex gap-4">
                <motion.button
                  onClick={handlePlaceBid}
                  className="flex-1 py-3 rounded-xl font-bold"
                  style={{
                    background: 'rgba(57, 255, 20, 0.3)',
                    color: NEON_COLORS.neonGreen,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={currentPlayer?.id !== 0}
                >
                  出价
                </motion.button>
                <motion.button
                  onClick={handleCloseAuction}
                  className="flex-1 py-3 rounded-xl font-bold"
                  style={{
                    background: 'rgba(255, 68, 68, 0.3)',
                    color: '#ff4444',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  结束拍卖
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {gameState.phase === 'gameOver' && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div
              className="relative glass-card rounded-2xl p-8 max-w-md mx-4 text-center"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
            >
              <h2 className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
                {gameState.players[0]?.isBankrupt ? '💀 游戏结束' : '🎉 恭喜获胜'}
              </h2>
              
              <div className="space-y-3 mb-6">
                {gameState.players.map((player) => (
                  <div key={player.id} className="flex justify-between items-center">
                    <span style={{ color: player.color }}>{player.name}</span>
                    <span style={{ color: NEON_COLORS.gold }}>
                      💰 {player.money.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {gameState.players[0]?.money > highScore && (
                <motion.div
                  className="text-2xl font-bold mb-4"
                  style={{ color: NEON_COLORS.gold }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                >
                  🏆 新纪录! 🏆
                </motion.div>
              )}

              <div className="flex gap-4">
                <motion.button
                  onClick={handleRestart}
                  className="flex-1 py-3 rounded-xl font-bold"
                  style={{
                    background: 'rgba(255, 107, 157, 0.3)',
                    color: NEON_COLORS.neonPink,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔄 再来一局
                </motion.button>
                <motion.button
                  onClick={handleExit}
                  className="flex-1 py-3 rounded-xl font-bold"
                  style={{
                    background: 'rgba(0, 210, 255, 0.3)',
                    color: NEON_COLORS.neonBlue,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🏠 返回首页
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBuildModal && canBuild && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowBuildModal(false)}
            />
            <motion.div
              className="relative glass-card rounded-2xl p-8 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
            >
              <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: NEON_COLORS.neonPink }}>
                🏗️ 建造/升级房产
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {playerPropertyDetails.map((prop) => {
                  const canUpgrade = prop.houses < 5 && currentPlayer!.money >= prop.housePrice;
                  
                  return (
                    <motion.div
                      key={prop.id}
                      className="p-4 rounded-xl"
                      style={{ backgroundColor: `${PROPERTY_COLORS[prop.color]}40` }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="font-bold mb-2">{prop.name}</div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>当前:</span>
                          <span>
                            {prop.houses === 0 && '空地'}
                            {prop.houses === 1 && '1栋房子'}
                            {prop.houses === 2 && '2栋房子'}
                            {prop.houses === 3 && '3栋房子'}
                            {prop.houses === 4 && '4栋房子'}
                            {prop.houses === 5 && '酒店'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>升级费用:</span>
                          <span style={{ color: NEON_COLORS.neonGreen }}>
                            💰 {prop.housePrice}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>租金:</span>
                          <span>{prop.rent[prop.houses]}</span>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => handleBuildHouse(prop.id)}
                        className="w-full mt-3 py-2 rounded-lg font-bold text-sm"
                        style={{
                          background: canUpgrade 
                            ? 'rgba(57, 255, 20, 0.3)' 
                            : 'rgba(100, 100, 100, 0.3)',
                          color: canUpgrade ? NEON_COLORS.neonGreen : '#888',
                          cursor: canUpgrade ? 'pointer' : 'not-allowed',
                        }}
                        whileHover={canUpgrade ? { scale: 1.05 } : {}}
                        whileTap={canUpgrade ? { scale: 0.95 } : {}}
                        disabled={!canUpgrade}
                      >
                        {prop.houses === 4 ? '🏨 建造酒店' : '🏠 建造房子'}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>

              <motion.button
                onClick={() => setShowBuildModal(false)}
                className="w-full py-3 rounded-xl font-bold"
                style={{
                  background: 'rgba(255, 68, 68, 0.3)',
                  color: '#ff4444',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                关闭
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
