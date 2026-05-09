import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { BlackjackEngine, Card } from './engine';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 450;
const CARD_WIDTH = 70;
const CARD_HEIGHT = 100;

export default function Blackjack() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BlackjackEngine | null>(null);

  const [bestScore, setBestScore] = useLocalStorage<number>('blackjack_highscore', 0);
  const [gamePhase, setGamePhase] = useState<string>('betting');
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [chips, setChips] = useState<number>(1000);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [playerValue, setPlayerValue] = useState<number>(0);
  const [dealerValue, setDealerValue] = useState<number>(0);
  const [message, setMessage] = useState<string>('请下注');
  const [winner, setWinner] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<string>('');

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
    setGamePhase(state.phase);
    setPlayerHand(engine.getPlayerHand(0));
    setDealerHand(state.dealerHand);
    setMessage(state.message);
    setWinner(state.winner);
    setPlayerValue(engine.getPlayerValue(0));

    if (state.players[0]) {
      setChips(state.players[0].chips);
      setCurrentBet(state.players[0].bet);
    }

    if (state.phase === 'dealer' || state.phase === 'ended') {
      setDealerValue(engine.getPlayerValue(1));
    }

    if (state.phase === 'ended') {
      if (state.winner === 0) {
        setGameResult('你赢了!');
        if (chips + currentBet * 2 > bestScore) {
          setBestScore(chips + currentBet * 2);
        }
      } else if (state.winner === 1) {
        setGameResult('庄家赢了');
      } else {
        setGameResult('平局');
      }
    }
  }, [bestScore, chips, currentBet, setBestScore]);

  useEffect(() => {
    engineRef.current = new BlackjackEngine();
    updateGameState();
    renderGame();

    const interval = setInterval(() => {
      updateGameState();
      renderGame();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleBet = (amount: number) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (engine.placeBet(0, amount)) {
      engine.dealCards();
      updateGameState();
      renderGame();
    }
  };

  const handleHit = () => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.hit(0);
    updateGameState();
    renderGame();
  };

  const handleStand = () => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.stand(0);
    updateGameState();
    renderGame();
  };

  const handleDoubleDown = () => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.doubleDown(0);
    updateGameState();
    renderGame();
  };

  const startGame = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      setChips(1000);
      setCurrentBet(0);
      setWinner(null);
      setGameResult('');
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
      diamond: '♦'
    };
    return symbols[suit] || suit;
  };

  const getCardColor = (suit: string) => {
    return (suit === 'heart' || suit === 'diamond') ? '#ff0000' : '#000000';
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 50%, #1a1a2e 100%)'
      }}
    >
      <motion.div
        className="glass-card rounded-3xl p-6 max-w-[700px] w-full"
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
            二十一点
          </h1>

          <div className="text-center">
            <div className="text-xs opacity-60" style={{ color: NEON_COLORS.gold }}>最高记录</div>
            <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>
              {bestScore}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-8 mb-4 text-sm" style={{ color: NEON_COLORS.gold }}>
          <span>筹码: {chips}</span>
          <span>下注: {currentBet}</span>
          <span>你: {playerValue}点</span>
          {(gamePhase === 'dealer' || gamePhase === 'ended') && (
            <span>庄家: {dealerValue}点</span>
          )}
        </div>

        <div
          className="mx-auto mb-4 rounded-2xl overflow-hidden"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            boxShadow: `0 0 30px ${NEON_COLORS.neonPurple}30, inset 0 0 50px rgba(0,0,0,0.5)`,
            border: `2px solid ${NEON_COLORS.neonPurple}40`
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

        {gamePhase === 'betting' && (
          <div className="flex justify-center gap-4 mb-4">
            {[10, 25, 50, 100].map(amount => (
              <motion.button
                key={amount}
                onClick={() => handleBet(amount)}
                disabled={chips < amount}
                className="px-4 py-2 rounded-xl font-bold"
                style={{
                  backgroundColor: chips >= amount ? NEON_COLORS.neonPink : '#444',
                  color: '#fff',
                  opacity: chips >= amount ? 1 : 0.5,
                  boxShadow: `0 0 15px ${NEON_COLORS.neonPink}50`
                }}
                whileHover={chips >= amount ? { scale: 1.05 } : {}}
                whileTap={chips >= amount ? { scale: 0.95 } : {}}
              >
                {amount}
              </motion.button>
            ))}
          </div>
        )}

        {gamePhase === 'playing' && (
          <div className="flex justify-center gap-4 mb-4">
            <motion.button
              onClick={handleHit}
              className="px-6 py-3 rounded-xl font-bold"
              style={{
                backgroundColor: NEON_COLORS.neonGreen,
                color: '#fff',
                boxShadow: `0 0 15px ${NEON_COLORS.neonGreen}50`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              要牌
            </motion.button>
            <motion.button
              onClick={handleStand}
              className="px-6 py-3 rounded-xl font-bold"
              style={{
                backgroundColor: NEON_COLORS.neonBlue,
                color: '#fff',
                boxShadow: `0 0 15px ${NEON_COLORS.neonBlue}50`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              停牌
            </motion.button>
            {playerHand.length === 2 && chips >= currentBet && (
              <motion.button
                onClick={handleDoubleDown}
                className="px-6 py-3 rounded-xl font-bold"
                style={{
                  backgroundColor: NEON_COLORS.gold,
                  color: '#000',
                  boxShadow: `0 0 15px ${NEON_COLORS.gold}50`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                双倍
              </motion.button>
            )}
          </div>
        )}

        {playerHand.length > 0 && (
          <div className="mb-4">
            <div className="text-center mb-2 text-sm" style={{ color: NEON_COLORS.gold }}>
              你的手牌 ({playerValue}点)
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              {playerHand.map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.1, type: 'spring' }}
                  style={{
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                    background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                    borderRadius: '8px',
                    border: `2px solid ${playerValue > 21 ? '#ff4444' : NEON_COLORS.neonPink}`,
                    boxShadow: playerValue > 21 ? '0 0 15px #ff4444' : `0 0 15px ${NEON_COLORS.neonPink}50`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{ color: getCardColor(card.suit), fontWeight: 'bold', fontSize: '18px' }}>
                    {card.rank}
                  </div>
                  <div style={{ color: getCardColor(card.suit), fontSize: '24px' }}>
                    {getSuitSymbol(card.suit)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {dealerHand.length > 0 && (
          <div className="mb-4">
            <div className="text-center mb-2 text-sm" style={{ color: NEON_COLORS.gold }}>
              庄家的手牌 {gamePhase === 'playing' ? '(只显示一张)' : `(${dealerValue}点)`}
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              {dealerHand.map((card, index) => {
                const isHidden = (gamePhase === 'playing' || gamePhase === 'betting') && index === 0;
                return (
                  <motion.div
                    key={index}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.1, type: 'spring' }}
                    style={{
                      width: CARD_WIDTH,
                      height: CARD_HEIGHT,
                      background: isHidden
                        ? `linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)`
                        : 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                      borderRadius: '8px',
                      border: `2px solid ${isHidden ? NEON_COLORS.gold : '#ccc'}`,
                      boxShadow: isHidden ? `0 0 10px ${NEON_COLORS.gold}40` : '0 2px 8px rgba(0,0,0,0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    {isHidden ? (
                      <>
                        <div style={{ fontSize: '10px', color: NEON_COLORS.gold }}>?</div>
                      </>
                    ) : (
                      <>
                        <div style={{ color: getCardColor(card.suit), fontWeight: 'bold', fontSize: '18px' }}>
                          {card.rank}
                        </div>
                        <div style={{ color: getCardColor(card.suit), fontSize: '24px' }}>
                          {getSuitSymbol(card.suit)}
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <AnimatePresence>
          {gamePhase === 'ended' && (
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
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
                  border: `2px solid ${winner === 0 ? NEON_COLORS.neonGreen : winner === 1 ? '#ff4444' : NEON_COLORS.gold}`,
                  boxShadow: `0 0 50px ${winner === 0 ? NEON_COLORS.neonGreen : winner === 1 ? '#ff4444' : NEON_COLORS.gold}50`
                }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
              >
                <div className="text-4xl font-bold mb-4" style={{
                  color: winner === 0 ? NEON_COLORS.neonGreen : winner === 1 ? '#ff4444' : NEON_COLORS.gold
                }}>
                  {gameResult}
                </div>
                <div className="text-xl mb-2" style={{ color: NEON_COLORS.gold }}>
                  你: {playerValue}点
                </div>
                <div className="text-lg mb-6" style={{ color: NEON_COLORS.neonBlue }}>
                  庄家: {dealerValue}点
                </div>
                <div className="text-lg mb-6" style={{ color: NEON_COLORS.gold }}>
                  最终筹码: {chips}
                </div>
                <div className="flex gap-4 justify-center">
                  <motion.button
                    onClick={startGame}
                    className="px-8 py-3 rounded-xl font-bold"
                    style={{
                      backgroundColor: NEON_COLORS.neonGreen,
                      color: '#fff',
                      boxShadow: `0 0 20px ${NEON_COLORS.neonGreen}`
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
