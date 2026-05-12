import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { DouDiZhuEngine, Card, GamePhase, PlayerRole } from './engine';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const CARD_WIDTH = 60;
const CARD_HEIGHT = 80;

interface SelectedCard {
  card: Card;
  index: number;
}

export default function DouDiZhu() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DouDiZhuEngine | null>(null);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  const [bestScore, setBestScore] = useLocalStorage<number>('doudizhu_highscore', 0);
  const [gameStatus, setGameStatus] = useState<GamePhase>('bidding');
  const [currentPlayer, setCurrentPlayer] = useState<number>(0);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [scores, setScores] = useState<number[]>([0, 0, 0]);
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [playerRoles, setPlayerRoles] = useState<(PlayerRole | null)[]>([null, null, null]);
  const [winner, setWinner] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const renderGame = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engine.render(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  const updateGameState = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const state = engine.getState();
    setGameStatus(state.phase);
    setCurrentPlayer(state.currentPlayer);
    setScores(state.scores);
    setCurrentBid(state.currentBid);
    setPlayerRoles(state.players.map(p => p.role));
    setWinner(state.winner);

    const hand = engine.getPlayerHand(0);
    setPlayerHand(hand);

    if (state.phase === 'bidding') {
      setMessage(state.currentPlayer === 0 ? '请叫分 (0-3分)' : `AI ${state.currentPlayer} 正在叫分...`);
    } else if (state.phase === 'playing') {
      if (state.winner !== null) {
        setGameResult(state.winner === 0 ? '你赢了！' : `AI ${state.winner} 获胜！`);
        if (state.winner === 0 && scores[0] > bestScore) {
          setBestScore(scores[0]);
        }
      } else {
        setMessage(state.currentPlayer === 0 ? '请出牌' : `AI ${state.currentPlayer} 思考中...`);
      }
    }
  }, [bestScore, scores, setBestScore]);

  useEffect(() => {
    engineRef.current = new DouDiZhuEngine();
    updateGameState();
    renderGame();

    const interval = setInterval(() => {
      updateGameState();
      renderGame();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleBid = (score: number) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (engine.bid(0, score)) {
      updateGameState();
      renderGame();
    }
  };

  const handleCardClick = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  const handlePlayCards = () => {
    const engine = engineRef.current;
    if (!engine || selectedCards.size === 0) return;

    const cardIds = Array.from(selectedCards);
    if (engine.playCards(0, cardIds)) {
      setSelectedCards(new Set());
      updateGameState();
      renderGame();
    } else {
      setMessage('无效的出牌组合！');
      setTimeout(() => setMessage('请出牌'), 1500);
    }
  };

  const handlePass = () => {
    const engine = engineRef.current;
    if (!engine) return;

    if (engine.pass(0)) {
      updateGameState();
      renderGame();
    }
  };

  const handleHint = () => {
    const engine = engineRef.current;
    if (!engine) return;

    const hint = engine.getHint(0);
    if (hint) {
      setSelectedCards(new Set(hint.map(c => c.id)));
    } else {
      setMessage('没有可出的牌，选择过牌');
      setTimeout(() => setMessage('请出牌'), 1500);
    }
  };

  const startGame = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      setSelectedCards(new Set());
      updateGameState();
      renderGame();
    }
  };

  const handleExit = () => {
    navigate('/');
  };

  const getSuitSymbol = (suit: string) => {
    const symbols: Record<string, string> = {
      spade: '♠',
      heart: '♥',
      club: '♣',
      diamond: '♦',
      joker: '🃏'
    };
    return symbols[suit] || suit;
  };

  const getRankDisplay = (rank: string) => {
    if (rank === 'small') return '小王';
    if (rank === 'big') return '大王';
    return rank;
  };

  const getCardColor = (suit: string) => {
    return (suit === 'heart' || suit === 'diamond') ? '#ff0000' : '#000000';
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)'
      }}
    >
      <motion.div
        className="glass-card rounded-3xl p-6 max-w-[900px] w-full"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <motion.button
            onClick={handleExit}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.neonBlue,
              boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}` }}
            whileTap={{ scale: 0.95 }}
          >
            返回
          </motion.button>

          <h1 className="text-3xl font-bold" style={{ color: NEON_COLORS.gold }}>
            斗地主
          </h1>

          <div className="text-center">
            <div className="text-xs opacity-60" style={{ color: NEON_COLORS.gold }}>最高记录</div>
            <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>
              {bestScore}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-8 mb-4">
          {['玩家', 'AI 1', 'AI 2'].map((name, idx) => (
            <div
              key={idx}
              className="px-4 py-2 rounded-xl text-center"
              style={{
                backgroundColor: currentPlayer === idx ? 'rgba(255, 107, 157, 0.3)' : 'rgba(100, 100, 100, 0.2)',
                border: `2px solid ${currentPlayer === idx ? NEON_COLORS.neonPink : '#666'}`,
                color: currentPlayer === idx ? NEON_COLORS.neonPink : '#888'
              }}
            >
              <div className="font-bold">{name}</div>
              <div className="text-xs">
                {playerRoles[idx] === 'landlord' ? '地主' : playerRoles[idx] === 'farmer' ? '农民' : '待定'}
              </div>
              <div className="text-xs">得分: {scores[idx]}</div>
            </div>
          ))}
        </div>

        <div
          className="mx-auto mb-4 rounded-2xl overflow-hidden"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30, inset 0 0 50px rgba(0,0,0,0.5)`,
            border: `2px solid ${NEON_COLORS.neonPink}40`
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block"
          />
        </div>

        <div className="text-center mb-4">
          <div
            className="inline-block px-6 py-2 rounded-lg font-bold"
            style={{
              backgroundColor: NEON_COLORS.darkPurple,
              color: NEON_COLORS.gold,
              border: `1px solid ${NEON_COLORS.gold}40`
            }}
          >
            {message}
          </div>
        </div>

        {gameStatus === 'bidding' && currentPlayer === 0 && (
          <div className="flex justify-center gap-4 mb-4">
            {[0, 1, 2, 3].map(score => (
              <motion.button
                key={score}
                onClick={() => handleBid(score)}
                disabled={score !== 0 && score <= currentBid}
                className="px-6 py-3 rounded-xl font-bold"
                style={{
                  backgroundColor: score === 0 ? '#666' : NEON_COLORS.neonPink,
                  color: '#fff',
                  opacity: score !== 0 && score <= currentBid ? 0.5 : 1,
                  boxShadow: `0 0 15px ${NEON_COLORS.neonPink}50`
                }}
                whileHover={score === 0 || score > currentBid ? { scale: 1.05 } : {}}
                whileTap={score === 0 || score > currentBid ? { scale: 0.95 } : {}}
              >
                {score === 0 ? '不叫' : `${score}分`}
              </motion.button>
            ))}
          </div>
        )}

        {gameStatus === 'playing' && currentPlayer === 0 && (
          <div className="flex justify-center gap-4 mb-4">
            <motion.button
              onClick={handlePlayCards}
              disabled={selectedCards.size === 0}
              className="px-6 py-3 rounded-xl font-bold"
              style={{
                backgroundColor: NEON_COLORS.neonGreen,
                color: '#fff',
                opacity: selectedCards.size === 0 ? 0.5 : 1,
                boxShadow: `0 0 15px ${NEON_COLORS.neonGreen}50`
              }}
              whileHover={selectedCards.size > 0 ? { scale: 1.05 } : {}}
              whileTap={selectedCards.size > 0 ? { scale: 0.95 } : {}}
            >
              出牌
            </motion.button>
            <motion.button
              onClick={handlePass}
              className="px-6 py-3 rounded-xl font-bold"
              style={{
                backgroundColor: '#666',
                color: '#fff',
                boxShadow: '0 0 15px rgba(100,100,100,0.5)'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              过牌
            </motion.button>
            <motion.button
              onClick={handleHint}
              className="px-6 py-3 rounded-xl font-bold"
              style={{
                backgroundColor: NEON_COLORS.neonBlue,
                color: '#fff',
                boxShadow: `0 0 15px ${NEON_COLORS.neonBlue}50`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              提示
            </motion.button>
          </div>
        )}

        <div className="mb-4">
          <div className="text-center mb-2" style={{ color: NEON_COLORS.gold }}>
            你的手牌 ({playerHand.length}张)
          </div>
          <div className="flex justify-center flex-wrap gap-1">
            {playerHand.map((card, index) => {
              const isSelected = selectedCards.has(card.id);
              return (
                <motion.div
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className="cursor-pointer"
                  animate={{ y: isSelected ? -15 : 0 }}
                  whileHover={{ y: -5 }}
                  style={{
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                    background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                    borderRadius: '8px',
                    border: `2px solid ${isSelected ? NEON_COLORS.neonPink : '#ccc'}`,
                    boxShadow: isSelected ? `0 0 15px ${NEON_COLORS.neonPink}` : '0 2px 8px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: index > 0 ? -20 : 0,
                    zIndex: isSelected ? 10 : 1
                  }}
                >
                  <div style={{ color: getCardColor(card.suit), fontWeight: 'bold', fontSize: '14px' }}>
                    {getRankDisplay(card.rank)}
                  </div>
                  <div style={{ color: getCardColor(card.suit), fontSize: '18px' }}>
                    {getSuitSymbol(card.suit)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {gameStatus === 'ended' && winner !== null && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 100 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="rounded-3xl p-8 text-center"
                style={{
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  border: `2px solid ${NEON_COLORS.gold}`,
                  boxShadow: `0 0 50px ${NEON_COLORS.gold}50`
                }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
              >
                <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.gold }}>
                  {gameResult}
                </div>
                <div className="text-xl mb-6" style={{ color: NEON_COLORS.neonBlue }}>
                  最终得分: {scores[0]}
                </div>
                <div className="flex gap-4 justify-center">
                  <motion.button
                    onClick={startGame}
                    className="px-8 py-3 rounded-xl font-bold"
                    style={{
                      backgroundColor: NEON_COLORS.neonPink,
                      color: '#fff',
                      boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    再来一局
                  </motion.button>
                  <motion.button
                    onClick={handleExit}
                    className="px-8 py-3 rounded-xl font-bold"
                    style={{
                      backgroundColor: NEON_COLORS.darkPurple,
                      color: NEON_COLORS.neonBlue,
                      border: `2px solid ${NEON_COLORS.neonBlue}`
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    返回首页
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
