import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { GermanWhistleEngine, GermanWhistleState, Card, Fruit } from './engine';

const FRUIT_SYMBOLS: Record<Fruit, string> = {
  apple: '🍎',
  banana: '🍌',
  cherry: '🍒',
  grape: '🍇',
  strawberry: '🍓',
  orange: '🍊',
  watermelon: '🍉',
  lemon: '🍋',
};

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];

export default function GermanWhistle() {
  const navigate = useNavigate();
  const [engine] = useState(() => new GermanWhistleEngine());
  const [gameState, setGameState] = useState<GermanWhistleState>(() => engine.getState());
  const [highScore, setHighScore] = useLocalStorage<number>('germanwhistle_highscore', 0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const animationRef = useRef<number>();
  const ringButtonRef = useRef<HTMLButtonElement>(null);

  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const updateState = useCallback(() => {
    setGameState(engine.getState());
  }, [engine]);

  useEffect(() => {
    const gameLoop = () => {
      updateState();
      animationRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoop();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateState]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted || gameState.phase !== 'playing') return;
      if (e.code === 'Space' && engine.canPlayerRing()) {
        handleRing();
      }
    };

    window.addEventListener('keydown', handleKeyPress, true);
    return () => window.removeEventListener('keydown', handleKeyPress, true);
  }, [gameStarted, gameState.phase]);

  useEffect(() => {
    if (gameState.phase === 'gameOver') {
      const wins = gameState.winner === 0 ? 1 : 0;
      if (wins > highScore) {
        setHighScore(wins);
      }
    }
  }, [gameState.phase, gameState.winner, highScore, setHighScore]);

  const handleStartGame = useCallback(() => {
    engine.startGame();
    updateState();
    setGameStarted(true);
  }, [engine, updateState]);

  const handleRestart = useCallback(() => {
    engine.reset();
    updateState();
    setGameStarted(false);
    setIsRinging(false);
  }, [engine, updateState]);

  const handleRing = useCallback(() => {
    if (!engine.canPlayerRing() || isRinging) return;
    
    setIsRinging(true);
    engine.ring(0);
    updateState();
    
    setTimeout(() => setIsRinging(false), 500);
  }, [engine, updateState, isRinging]);

  const getCardDisplay = (card: Card): string => {
    if (card.type === 'fruit' && card.fruit) {
      return FRUIT_SYMBOLS[card.fruit];
    } else if (card.type === 'whistle') {
      return '🔔';
    } else if (card.type === 'cherryBomb') {
      return '💣';
    } else if (card.type === 'flipAll') {
      return '📚';
    }
    return '❓';
  };

  const getCardColor = (card: Card): string => {
    if (card.type === 'fruit' && card.fruit) {
      const fruitColors: Record<Fruit, string> = {
        apple: '#e74c3c',
        banana: '#f1c40f',
        cherry: '#c0392b',
        grape: '#8e44ad',
        strawberry: '#e74c3c',
        orange: '#e67e22',
        watermelon: '#27ae60',
        lemon: '#f1c40f',
      };
      return fruitColors[card.fruit];
    } else if (card.type === 'whistle') {
      return '#e74c3c';
    } else if (card.type === 'cherryBomb') {
      return '#c0392b';
    } else if (card.type === 'flipAll') {
      return '#3498db';
    }
    return '#95a5a6';
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center gap-4 py-6 px-4"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      }}
    >
      <div className="flex items-center justify-between w-full max-w-[800px] px-4">
        <motion.button
          onClick={handleExit}
          className="px-4 py-2 rounded-lg font-bold text-sm glass-card"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>
            第{gameState.round}轮
          </div>
          <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonPink }}>
            {gameState.phase === 'playing' && '🎮 游戏中'}
            {gameState.phase === 'gameOver' && '🏁 结束'}
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>牌堆</div>
          <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>
            {gameState.tableCards.length + gameState.players.reduce((sum, p) => sum + p.handCards.length, 0)}张
          </div>
        </div>
      </div>

      <motion.div 
        className="text-center text-xl font-bold px-6 py-4 rounded-xl glass-card"
        style={{ 
          color: gameState.canRing ? '#e74c3c' : NEON_COLORS.gold,
          boxShadow: gameState.canRing ? '0 0 30px rgba(231, 76, 60, 0.5)' : 'none',
          animation: gameState.canRing ? 'pulse 0.5s infinite' : 'none',
        }}
        key={gameState.message}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {gameState.message}
      </motion.div>

      {!gameStarted ? (
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 className="text-4xl font-bold" style={{ color: NEON_COLORS.neonPink }}>
            🔔 德国心脏病 🔔
          </h2>
          <p className="text-gray-400 text-center max-w-md">
            当桌上有5个相同水果或看到🔔时，快速按铃！
            <br/>
            空格键或点击按钮按铃
          </p>
          <motion.button
            onClick={handleStartGame}
            className="px-8 py-4 rounded-xl font-bold text-xl glass-card"
            style={{
              background: 'rgba(231, 76, 60, 0.3)',
              boxShadow: '0 0 20px rgba(231, 76, 60, 0.3)',
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(231, 76, 60, 0.5)' }}
            whileTap={{ scale: 0.95 }}
          >
            开始游戏
          </motion.button>
        </motion.div>
      ) : (
        <>
          <div className="glass-card rounded-2xl p-6 max-w-[700px]">
            <h3 className="text-lg font-bold mb-4 text-center" style={{ color: NEON_COLORS.gold }}>
              🃏 桌面卡牌
            </h3>
            
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              {gameState.tableCards.length > 0 ? (
                gameState.tableCards.map((card, idx) => (
                  <motion.div
                    key={card.id || idx}
                    className="w-16 h-20 rounded-xl flex items-center justify-center text-3xl"
                    style={{
                      backgroundColor: getCardColor(card),
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    }}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {getCardDisplay(card)}
                  </motion.div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-8">
                  暂无卡牌
                </div>
              )}
            </div>

            <div className="flex justify-center gap-2 text-2xl">
              {(['apple', 'banana', 'cherry', 'grape', 'strawberry', 'orange', 'watermelon', 'lemon'] as Fruit[]).map(fruit => (
                <div 
                  key={fruit}
                  className="flex flex-col items-center"
                  style={{ opacity: gameState.fruitCounts[fruit] >= 5 ? 1 : 0.6 }}
                >
                  <span className="text-2xl">{FRUIT_SYMBOLS[fruit]}</span>
                  <span 
                    className="text-sm font-bold"
                    style={{ 
                      color: gameState.fruitCounts[fruit] >= 5 ? '#e74c3c' : NEON_COLORS.gold 
                    }}
                  >
                    x{gameState.fruitCounts[fruit]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <motion.button
            ref={ringButtonRef}
            onClick={handleRing}
            disabled={!engine.canPlayerRing()}
            className="w-32 h-32 rounded-full font-bold text-2xl flex items-center justify-center"
            style={{
              background: engine.canPlayerRing() 
                ? 'linear-gradient(145deg, #e74c3c, #c0392b)' 
                : 'linear-gradient(145deg, #4a4a4a, #3a3a3a)',
              boxShadow: engine.canPlayerRing() 
                ? '0 0 40px rgba(231, 76, 60, 0.6)' 
                : '0 4px 12px rgba(0,0,0,0.3)',
              cursor: engine.canPlayerRing() ? 'pointer' : 'not-allowed',
            }}
            animate={isRinging ? { scale: [1, 0.9, 1.1, 1] } : {}}
            whileHover={engine.canPlayerRing() ? { scale: 1.1 } : {}}
            whileTap={engine.canPlayerRing() ? { scale: 0.95 } : {}}
          >
            🔔
          </motion.button>

          <div className="text-sm opacity-70">
            {engine.canPlayerRing() ? '按铃！按空格或点击按钮' : '等待按铃时机...'}
          </div>

          <div className="flex gap-4 flex-wrap justify-center">
            {gameState.players.map((player, idx) => (
              <motion.div
                key={player.id}
                className="glass-card rounded-xl p-4 min-w-[150px]"
                style={{ 
                  border: `2px solid ${PLAYER_COLORS[idx]}`,
                  opacity: player.isAlive ? 1 : 0.4,
                }}
                animate={player.id === gameState.currentPlayer && gameState.phase === 'playing' ? {
                  boxShadow: `0 0 20px ${PLAYER_COLORS[idx]}50`,
                } : {}}
              >
                <div className="font-bold mb-2" style={{ color: PLAYER_COLORS[idx] }}>
                  {player.name}
                </div>
                
                <div className="text-sm mb-2">
                  手牌: <span className="font-bold text-xl">{player.handCards.length}</span>张
                </div>

                <div className="flex gap-1 flex-wrap">
                  {player.handCards.slice(0, 3).map((card, cardIdx) => (
                    <div
                      key={cardIdx}
                      className="w-8 h-10 rounded flex items-center justify-center text-sm"
                      style={{ backgroundColor: getCardColor(card) }}
                    >
                      {getCardDisplay(card)}
                    </div>
                  ))}
                  {player.handCards.length > 3 && (
                    <div className="text-xs opacity-70">
                      +{player.handCards.length - 3}
                    </div>
                  )}
                </div>

                {player.lastReactionTime > 0 && (
                  <div className="text-xs mt-2" style={{ color: NEON_COLORS.gold }}>
                    反应: {player.lastReactionTime}ms
                  </div>
                )}

                {!player.isAlive && (
                  <div className="text-red-500 text-sm mt-2">
                    💀 淘汰
                  </div>
                )}

                {player.id === gameState.currentPlayer && gameState.phase === 'playing' && player.isAlive && (
                  <div className="text-xs mt-2 animate-pulse" style={{ color: '#ffd700' }}>
                    正在翻牌
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
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
              <h2 className="text-4xl font-bold mb-4" style={{ 
                color: gameState.winner === 0 ? '#2ecc71' : NEON_COLORS.neonPink 
              }}>
                {gameState.winner === 0 ? '🎉 恭喜获胜!' : '💀 游戏结束'}
              </h2>
              
              <div className="space-y-3 mb-6">
                {gameState.players.map((player, idx) => (
                  <div 
                    key={player.id} 
                    className="flex justify-between items-center p-2 rounded-lg"
                    style={{ 
                      backgroundColor: player.isAlive ? `${PLAYER_COLORS[idx]}20` : 'rgba(100,100,100,0.2)',
                    }}
                  >
                    <span style={{ 
                      color: player.isAlive ? PLAYER_COLORS[idx] : '#666',
                      textDecoration: player.isAlive ? 'none' : 'line-through',
                    }}>
                      {player.name}
                    </span>
                    <span style={{ color: NEON_COLORS.gold }}>
                      {player.handCards.length}张
                    </span>
                    {player.lastReactionTime > 0 && (
                      <span className="text-xs" style={{ color: NEON_COLORS.neonBlue }}>
                        {player.lastReactionTime}ms
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <motion.button
                  onClick={handleRestart}
                  className="flex-1 py-3 rounded-xl font-bold"
                  style={{
                    background: 'rgba(231, 76, 60, 0.3)',
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

      <style>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
