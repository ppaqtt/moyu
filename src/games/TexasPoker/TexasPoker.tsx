import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { TexasPokerEngine, Card, GamePhase, PlayerAction, HandRank } from './engine';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const CARD_WIDTH = 60;
const CARD_HEIGHT = 84;

export default function TexasPoker() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TexasPokerEngine | null>(null);

  const [bestScore, setBestScore] = useLocalStorage<number>('texaspoker_highscore', 0);
  const [gameStatus, setGameStatus] = useState<GamePhase>('preflop');
  const [currentPlayer, setCurrentPlayer] = useState<number>(0);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [pot, setPot] = useState<number>(0);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [playerChips, setPlayerChips] = useState<number>(1000);
  const [playerBet, setPlayerBet] = useState<number>(0);
  const [playerStatus, setPlayerStatus] = useState<string>('active');
  const [validActions, setValidActions] = useState<PlayerAction[]>([]);
  const [winners, setWinners] = useState<number[]>([]);
  const [gameResult, setGameResult] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [raiseAmount, setRaiseAmount] = useState<number>(40);

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
    setCommunityCards(state.communityCards);
    setPot(state.pot);
    setCurrentBet(state.currentBet);
    setWinners(state.winners);

    const hand = engine.getPlayerHand(0);
    setPlayerHand(hand);
    setPlayerChips(state.players[0].chips);
    setPlayerBet(state.players[0].bet);
    setPlayerStatus(state.players[0].status);

    const actions = engine.getValidActions(0);
    setValidActions(actions);

    if (state.phase === 'ended') {
      if (state.winners.includes(0)) {
        setGameResult('你赢了！');
        if (playerChips > bestScore) {
          setBestScore(playerChips);
        }
      } else if (state.winners.length > 0) {
        setGameResult(`AI ${state.winners[0]} 获胜！`);
      } else {
        setGameResult('游戏结束');
      }
    } else {
      const phaseNames: Record<GamePhase, string> = {
        'preflop': '翻牌前',
        'flop': '翻牌圈',
        'turn': '转牌圈',
        'river': '河牌圈',
        'showdown': '摊牌',
        'ended': '结束'
      };
      setMessage(`${phaseNames[state.phase]} - ${state.currentPlayer === 0 ? '你的回合' : `AI ${state.currentPlayer} 思考中...`}`);
    }
  }, [bestScore, playerChips, setBestScore]);

  useEffect(() => {
    engineRef.current = new TexasPokerEngine();
    updateGameState();
    renderGame();

    const interval = setInterval(() => {
      updateGameState();
      renderGame();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleAction = (action: PlayerAction, amount: number = 0) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (engine.performAction(0, action, amount)) {
      updateGameState();
      renderGame();
    }
  };

  const startGame = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      setRaiseAmount(40);
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
        background: 'linear-gradient(135deg, #0a1a0a 0%, #1a3a1a 50%, #0a2a0a 100%)'
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
            德州扑克
          </h1>

          <div className="text-center">
            <div className="text-xs opacity-60" style={{ color: NEON_COLORS.gold }}>最高记录</div>
            <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>
              {bestScore}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-4 text-sm" style={{ color: NEON_COLORS.gold }}>
          <span>底池: {pot}</span>
          <span>当前下注: {currentBet}</span>
          <span>你的筹码: {playerChips}</span>
          {playerBet > 0 && <span>你已下注: {playerBet}</span>}
        </div>

        <div
          className="mx-auto mb-4 rounded-2xl overflow-hidden"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            boxShadow: `0 0 30px ${NEON_COLORS.neonGreen}30, inset 0 0 50px rgba(0,0,0,0.5)`,
            border: `2px solid ${NEON_COLORS.neonGreen}40`
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

        {communityCards.length > 0 && (
          <div className="mb-4">
            <div className="text-center mb-2 text-sm" style={{ color: NEON_COLORS.gold }}>
              公共牌
            </div>
            <div className="flex justify-center gap-2">
              {communityCards.map((card, index) => (
                <div
                  key={index}
                  style={{
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                    background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                    borderRadius: '6px',
                    border: '2px solid #ccc',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{ color: getCardColor(card.suit), fontWeight: 'bold', fontSize: '16px' }}>
                    {card.rank}
                  </div>
                  <div style={{ color: getCardColor(card.suit), fontSize: '20px' }}>
                    {getSuitSymbol(card.suit)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {playerHand.length > 0 && (
          <div className="mb-4">
            <div className="text-center mb-2 text-sm" style={{ color: NEON_COLORS.gold }}>
              你的手牌
            </div>
            <div className="flex justify-center gap-2">
              {playerHand.map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ rotateY: 180 }}
                  animate={{ rotateY: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.5 }}
                  style={{
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                    background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                    borderRadius: '6px',
                    border: `2px solid ${NEON_COLORS.neonPink}`,
                    boxShadow: `0 0 15px ${NEON_COLORS.neonPink}50`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{ color: getCardColor(card.suit), fontWeight: 'bold', fontSize: '16px' }}>
                    {card.rank}
                  </div>
                  <div style={{ color: getCardColor(card.suit), fontSize: '20px' }}>
                    {getSuitSymbol(card.suit)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {currentPlayer === 0 && validActions.length > 0 && gameStatus !== 'ended' && (
          <div className="space-y-4">
            <div className="flex justify-center gap-3 flex-wrap">
              {validActions.includes('fold') && (
                <motion.button
                  onClick={() => handleAction('fold')}
                  className="px-5 py-2 rounded-xl font-bold"
                  style={{
                    backgroundColor: '#666',
                    color: '#fff',
                    boxShadow: '0 0 15px rgba(100,100,100,0.5)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  弃牌
                </motion.button>
              )}
              {validActions.includes('check') && (
                <motion.button
                  onClick={() => handleAction('check')}
                  className="px-5 py-2 rounded-xl font-bold"
                  style={{
                    backgroundColor: NEON_COLORS.neonBlue,
                    color: '#fff',
                    boxShadow: `0 0 15px ${NEON_COLORS.neonBlue}50`
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  过牌
                </motion.button>
              )}
              {validActions.includes('call') && (
                <motion.button
                  onClick={() => handleAction('call')}
                  className="px-5 py-2 rounded-xl font-bold"
                  style={{
                    backgroundColor: NEON_COLORS.neonGreen,
                    color: '#fff',
                    boxShadow: `0 0 15px ${NEON_COLORS.neonGreen}50`
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  跟注
                </motion.button>
              )}
              {validActions.includes('raise') && (
                <motion.button
                  onClick={() => handleAction('raise', raiseAmount)}
                  className="px-5 py-2 rounded-xl font-bold"
                  style={{
                    backgroundColor: NEON_COLORS.neonPink,
                    color: '#fff',
                    boxShadow: `0 0 15px ${NEON_COLORS.neonPink}50`
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  加注 {raiseAmount}
                </motion.button>
              )}
              {validActions.includes('allin') && (
                <motion.button
                  onClick={() => handleAction('allin')}
                  className="px-5 py-2 rounded-xl font-bold"
                  style={{
                    backgroundColor: NEON_COLORS.gold,
                    color: '#000',
                    boxShadow: `0 0 15px ${NEON_COLORS.gold}50`
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  全下
                </motion.button>
              )}
            </div>

            {validActions.includes('raise') && (
              <div className="flex justify-center items-center gap-4">
                <span style={{ color: NEON_COLORS.gold }}>加注金额:</span>
                <input
                  type="range"
                  min={40}
                  max={playerChips}
                  step={20}
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
                  className="w-48"
                />
                <span style={{ color: NEON_COLORS.gold, minWidth: '60px' }}>{raiseAmount}</span>
              </div>
            )}
          </div>
        )}

        <AnimatePresence>
          {gameStatus === 'ended' && winners.length > 0 && (
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
                  background: 'linear-gradient(135deg, #1a3a1a 0%, #0a2a0a 100%)',
                  border: `2px solid ${NEON_COLORS.gold}`,
                  boxShadow: `0 0 50px ${NEON_COLORS.gold}50`
                }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
              >
                <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.gold }}>
                  {gameResult}
                </div>
                <div className="text-xl mb-2" style={{ color: NEON_COLORS.neonGreen }}>
                  剩余筹码: {playerChips}
                </div>
                <div className="text-lg mb-6" style={{ color: NEON_COLORS.neonBlue }}>
                  底池: {pot}
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
