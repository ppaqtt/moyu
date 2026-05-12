import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { ThreeKingdomsEngine, ThreeKingdomsState, Card, Kingdom, Suit } from './engine';

const KINGDOM_COLORS: Record<Kingdom, string> = {
  wei: '#3498db',
  shu: '#e74c3c',
  wu: '#f1c40f',
  qun: '#9b59b6',
};

const KINGDOM_NAMES: Record<Kingdom, string> = {
  wei: '魏',
  shu: '蜀',
  wu: '吴',
  qun: '群',
};

const SUIT_SYMBOLS: Record<Suit, string> = {
  spade: '♠',
  heart: '♥',
  club: '♣',
  diamond: '♦',
};

export default function ThreeKingdoms() {
  const navigate = useNavigate();
  const [engine] = useState(() => new ThreeKingdomsEngine());
  const [gameState, setGameState] = useState<ThreeKingdomsState>(() => engine.getState());
  const [highScore, setHighScore] = useLocalStorage<number>('threekingdoms_highscore', 0);
  const [gameStarted, setGameStarted] = useState(false);
  const animationRef = useRef<number>();

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
  }, [engine, updateState]);

  const handleSelectCard = useCallback((cardId: string) => {
    if (gameState.phase !== 'play') return;
    engine.selectCard(cardId);
    updateState();
  }, [engine, updateState, gameState.phase]);

  const handleSelectTarget = useCallback((playerId: number) => {
    if (!gameState.selectedCard) return;
    engine.selectTarget(playerId);
    updateState();
  }, [engine, updateState]);

  const handleRespondJink = useCallback(() => {
    engine.respondJink();
    updateState();
  }, [engine, updateState]);

  const handleRespondDuel = useCallback(() => {
    engine.respondDuel();
    updateState();
  }, [engine, updateState]);

  const handleDiscardCard = useCallback((cardId: string) => {
    engine.discardCard(cardId);
    updateState();
  }, [engine, updateState]);

  const handleEndTurn = useCallback(() => {
    engine.endTurn();
    updateState();
  }, [engine, updateState]);

  const handleCancelAction = useCallback(() => {
    engine.cancelAction();
    updateState();
  }, [engine, updateState]);

  const renderCard = (card: Card, showFull: boolean = true) => {
    const suitColor = card.suit === 'heart' || card.suit === 'diamond' ? '#e74c3c' : '#2c3e50';
    
    return (
      <motion.div
        key={card.id}
        className="relative w-16 h-24 rounded-lg flex flex-col items-center justify-center cursor-pointer"
        style={{
          backgroundColor: '#fff',
          border: `2px solid ${suitColor}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleSelectCard(card.id)}
      >
        {showFull && (
          <>
            <div className="absolute top-1 left-1 text-xs font-bold" style={{ color: suitColor }}>
              {card.number}
            </div>
            <div className="text-2xl" style={{ color: suitColor }}>
              {SUIT_SYMBOLS[card.suit]}
            </div>
            <div className="text-xs font-bold mt-1" style={{ color: suitColor }}>
              {card.name}
            </div>
            <div className="absolute bottom-1 right-1 text-xs font-bold" style={{ color: suitColor }}>
              {card.number}
            </div>
          </>
        )}
      </motion.div>
    );
  };

  const renderSmallCard = (card: Card) => {
    const suitColor = card.suit === 'heart' || card.suit === 'diamond' ? '#e74c3c' : '#2c3e50';
    
    return (
      <div
        key={card.id}
        className="w-8 h-12 rounded flex items-center justify-center text-sm"
        style={{
          backgroundColor: '#fff',
          border: `1px solid ${suitColor}`,
          color: suitColor,
        }}
      >
        <span>{SUIT_SYMBOLS[card.suit]}{card.number}</span>
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center gap-4 py-4 px-2 overflow-auto"
      style={{
        background: 'linear-gradient(135deg, #1a0a0a 0%, #2d1515 50%, #1a1a2e 100%)',
      }}
    >
      <div className="flex items-center justify-between w-full max-w-[1000px] px-4">
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
            {gameState.phase === 'draw' && '摸牌阶段'}
            {gameState.phase === 'main' && '主要阶段'}
            {gameState.phase === 'play' && '出牌阶段'}
            {gameState.phase === 'discard' && '弃牌阶段'}
            {gameState.phase === 'response' && '响应阶段'}
            {gameState.phase === 'gameOver' && '游戏结束'}
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>牌堆</div>
          <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>
            {gameState.deck.length}张
          </div>
        </div>
      </div>

      <motion.div 
        className="text-center text-lg font-medium px-6 py-3 rounded-xl glass-card"
        style={{ color: NEON_COLORS.gold, minWidth: '300px' }}
        key={gameState.message}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {gameState.message}
      </motion.div>

      {!gameStarted ? (
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 className="text-3xl font-bold" style={{ color: NEON_COLORS.neonPink }}>
            ⚔️ 三国杀 ⚔️
          </h2>
          <p className="text-gray-400">经典卡牌对战游戏</p>
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
          <div className="flex gap-4 flex-wrap justify-center">
            {gameState.players.map((player, idx) => (
              <motion.div
                key={player.id}
                className="glass-card rounded-xl p-4"
                style={{ 
                  border: player.id === gameState.currentPlayer ? '3px solid #ffd700' : '1px solid rgba(255,255,255,0.1)',
                  opacity: player.isAlive ? 1 : 0.5,
                  width: '200px',
                }}
                animate={player.id === gameState.currentPlayer ? {
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                } : {}}
              >
                <div className="flex items-center justify-between mb-2">
                  <div 
                    className="font-bold"
                    style={{ 
                      color: player.general ? KINGDOM_COLORS[player.general.kingdom] : '#fff'
                    }}
                  >
                    {player.general?.name || `玩家${player.id + 1}`}
                  </div>
                  {player.general && (
                    <div className="text-xs">
                      {KINGDOM_NAMES[player.general.kingdom]}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-red-500">❤️</div>
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-red-500 rounded-full h-2 transition-all"
                      style={{ 
                        width: player.general ? 
                          `${(player.general.hp / player.general.maxHp) * 100}%` : '0%'
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold">
                    {player.general?.hp || 0}/{player.general?.maxHp || 0}
                  </span>
                </div>

                <div className="flex gap-1 flex-wrap">
                  {player.handCards.map((card, cardIdx) => (
                    <div key={`${player.id}-${card.id}`}>
                      {player.id === 0 ? (
                        renderCard(card)
                      ) : (
                        renderSmallCard(card)
                      )}
                    </div>
                  ))}
                </div>

                {!player.isAlive && (
                  <div className="text-center text-red-500 text-sm mt-2">
                    💀 已阵亡
                  </div>
                )}

                {player.isAlive && player.id === gameState.currentPlayer && gameState.phase === 'discard' && (
                  <div className="text-xs text-yellow-400 mt-2">
                    需要弃置 {player.handCards.length - (player.general?.maxHp || 4)} 张
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            {gameState.phase === 'play' && gameState.currentPlayer === 0 && gameState.selectedCard && (
              <>
                <motion.button
                  onClick={handleCancelAction}
                  className="px-4 py-2 rounded-lg font-bold glass-card"
                  style={{ background: 'rgba(100, 100, 100, 0.3)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  取消
                </motion.button>
              </>
            )}

            {gameState.phase === 'play' && gameState.currentPlayer === 0 && (
              <motion.button
                onClick={handleEndTurn}
                className="px-6 py-3 rounded-xl font-bold text-lg glass-card"
                style={{
                  background: 'rgba(57, 255, 20, 0.3)',
                  boxShadow: '0 0 20px rgba(57, 255, 20, 0.3)',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                结束回合
              </motion.button>
            )}

            {gameState.phase === 'discard' && gameState.currentPlayer === 0 && (
              <div className="text-sm opacity-70">
                点击要弃置的卡牌
              </div>
            )}

            {gameState.phase === 'response' && (
              <>
                {gameState.action === 'responseJink' && (
                  <>
                    <motion.button
                      onClick={handleRespondJink}
                      className="px-6 py-3 rounded-xl font-bold text-lg"
                      style={{
                        background: 'rgba(231, 76, 60, 0.3)',
                        color: '#e74c3c',
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      使用闪
                    </motion.button>
                  </>
                )}
                {gameState.action === 'duel' && (
                  <motion.button
                    onClick={handleRespondDuel}
                    className="px-6 py-3 rounded-xl font-bold text-lg"
                    style={{
                      background: 'rgba(231, 76, 60, 0.3)',
                      color: '#e74c3c',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    出杀响应
                  </motion.button>
                )}
              </>
            )}
          </div>

          {gameState.selectedCard && gameState.phase === 'play' && (
            <div className="glass-card rounded-xl p-4">
              <p className="text-sm mb-2" style={{ color: NEON_COLORS.gold }}>
                选择使用 {gameState.selectedCard.name} 的目标:
              </p>
              <div className="flex gap-2">
                {gameState.players.filter(p => p.isAlive && p.id !== 0).map(player => (
                  <motion.button
                    key={player.id}
                    onClick={() => handleSelectTarget(player.id)}
                    className="px-4 py-2 rounded-lg font-bold"
                    style={{ 
                      background: player.general ? 
                        `${KINGDOM_COLORS[player.general.kingdom]}40` : 'rgba(100,100,100,0.3)',
                      border: player.general ? 
                        `2px solid ${KINGDOM_COLORS[player.general.kingdom]}` : '2px solid gray',
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {player.general?.name || `玩家${player.id + 1}`}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
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
              <h2 className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.neonPink }}>
                {gameState.winner === 0 ? '🎉 恭喜获胜!' : '💀 游戏结束'}
              </h2>
              
              <div className="space-y-2 mb-6">
                {gameState.players.map(player => (
                  <div key={player.id} className="flex justify-between items-center">
                    <span style={{ 
                      color: player.general ? KINGDOM_COLORS[player.general.kingdom] : '#fff' 
                    }}>
                      {player.general?.name || `玩家${player.id + 1}`}
                    </span>
                    <span style={{ color: player.isAlive ? NEON_COLORS.neonGreen : '#e74c3c' }}>
                      {player.isAlive ? '存活' : '阵亡'}
                    </span>
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
      `}</style>
    </div>
  );
}
