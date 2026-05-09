import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { UnoEngine, UnoCard as UnoCardType, UnoColor, GamePhase } from './engine';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 450;
const CARD_WIDTH = 70;
const CARD_HEIGHT = 100;

export default function UnoCard() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<UnoEngine | null>(null);

  const [bestScore, setBestScore] = useLocalStorage<number>('uno_highscore', 0);
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [currentPlayer, setCurrentPlayer] = useState<number>(0);
  const [playerHand, setPlayerHand] = useState<UnoCardType[]>([]);
  const [topCard, setTopCard] = useState<UnoCardType | null>(null);
  const [currentColor, setCurrentColor] = useState<UnoColor | null>(null);
  const [direction, setDirection] = useState<string>('clockwise');
  const [deckCount, setDeckCount] = useState<number>(0);
  const [drawCount, setDrawCount] = useState<number>(0);
  const [mustPlayDrawn, setMustPlayDrawn] = useState<boolean>(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

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
    setCurrentPlayer(state.currentPlayer);
    setTopCard(state.topCard);
    setCurrentColor(state.currentColor);
    setDirection(state.direction);
    setDeckCount(state.deck.length);
    setDrawCount(state.drawCount);
    setMustPlayDrawn(state.mustPlayDrawn);
    setWinner(state.winner);

    const hand = engine.getPlayerHand(0);
    setPlayerHand(hand);

    if (state.phase === 'ended' && state.winner !== null) {
      if (state.winner === 0) {
        setGameResult('你赢了!');
        const score = engine.getPlayerHand(0).length;
        if (score > bestScore) {
          setBestScore(score);
        }
      } else {
        setGameResult(`AI ${state.winner} 获胜!`);
      }
    } else {
      const dirText = state.direction === 'clockwise' ? '顺时针' : '逆时针';
      setMessage(`${dirText} | ${state.currentPlayer === 0 ? '你的回合' : `AI ${state.currentPlayer} 思考中...`}`);
    }
  }, [bestScore, setBestScore]);

  useEffect(() => {
    engineRef.current = new UnoEngine();
    updateGameState();
    renderGame();

    const interval = setInterval(() => {
      updateGameState();
      renderGame();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handlePlayCard = (cardId: string) => {
    const engine = engineRef.current;
    if (!engine) return;

    const card = playerHand.find(c => c.id === cardId);
    if (!card) return;

    if (card.color === 'wild') {
      setSelectedCardId(cardId);
      setShowColorPicker(true);
      return;
    }

    if (engine.playCard(0, cardId)) {
      updateGameState();
      renderGame();
    }
  };

  const handleColorSelect = (color: UnoColor) => {
    const engine = engineRef.current;
    if (!engine || !selectedCardId) return;

    if (engine.playCard(0, selectedCardId, color)) {
      setShowColorPicker(false);
      setSelectedCardId(null);
      updateGameState();
      renderGame();
    }
  };

  const handleDrawCard = () => {
    const engine = engineRef.current;
    if (!engine) return;

    if (engine.drawCard(0)) {
      updateGameState();
      renderGame();
    }
  };

  const handlePlayDrawnCard = () => {
    const engine = engineRef.current;
    if (!engine) return;

    const lastCard = playerHand[playerHand.length - 1];
    if (lastCard && lastCard.color === 'wild') {
      setSelectedCardId(lastCard.id);
      setShowColorPicker(true);
      return;
    }

    if (engine.playDrawnCard(0)) {
      updateGameState();
      renderGame();
    }
  };

  const startGame = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      setShowColorPicker(false);
      setSelectedCardId(null);
      updateGameState();
      renderGame();
    }
  };

  const handleExit = () => {
    navigate('/');
  };

  const getColorHex = (color: UnoColor): string => {
    const colors: Record<UnoColor, string> = {
      red: '#ff4444',
      yellow: '#ffcc00',
      green: '#44ff44',
      blue: '#4444ff',
      wild: '#333333'
    };
    return colors[color];
  };

  const getColorName = (color: UnoColor): string => {
    const names: Record<UnoColor, string> = {
      red: '红',
      yellow: '黄',
      green: '绿',
      blue: '蓝',
      wild: '万能'
    };
    return names[color];
  };

  const getCardDisplay = (card: UnoCard): string => {
    if (card.type === 'number') return card.value.toString();
    if (card.type === 'skip') return '禁';
    if (card.type === 'reverse') return '转';
    if (card.type === 'draw2') return '+2';
    if (card.type === 'wild') return '万能';
    if (card.type === 'wild4') return '+4';
    return '';
  };

  const canPlayCard = (card: UnoCard): boolean => {
    const engine = engineRef.current;
    if (!engine) return false;
    return engine.canPlayCard(card, topCard, currentColor);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #2a2a4a 0%, #3a3a6a 50%, #2a2a4a 100%)'
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
            UNO
          </h1>

          <div className="text-center">
            <div className="text-xs opacity-60" style={{ color: NEON_COLORS.gold }}>最高记录</div>
            <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>
              {bestScore}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-6 mb-4 text-sm" style={{ color: NEON_COLORS.gold }}>
          <span>方向: {direction === 'clockwise' ? '顺时针' : '逆时针'}</span>
          <span>当前颜色: {currentColor ? getColorName(currentColor) : '-'}</span>
          <span>牌堆: {deckCount}张</span>
          {drawCount > 0 && <span style={{ color: '#ff4444' }}>+{drawCount}</span>}
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

        {topCard && (
          <div className="flex justify-center mb-4">
            <div
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                background: getColorHex(topCard.color),
                borderRadius: '10px',
                border: '2px solid #fff',
                boxShadow: '0 0 15px rgba(255,255,255,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: '50%',
                  height: '40%',
                  background: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{ color: getColorHex(topCard.color), fontWeight: 'bold', fontSize: '18px' }}>
                  {getCardDisplay(topCard)}
                </span>
              </div>
              <span style={{ position: 'absolute', top: '5px', left: '8px', color: '#fff', fontSize: '12px' }}>
                {getCardDisplay(topCard)}
              </span>
              <span style={{ position: 'absolute', bottom: '5px', right: '8px', color: '#fff', fontSize: '12px' }}>
                {getCardDisplay(topCard)}
              </span>
            </div>
          </div>
        )}

        {currentPlayer === 0 && gamePhase === 'playing' && (
          <div className="flex justify-center gap-4 mb-4">
            {!mustPlayDrawn ? (
              <motion.button
                onClick={handleDrawCard}
                className="px-6 py-3 rounded-xl font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonBlue,
                  color: '#fff',
                  boxShadow: `0 0 15px ${NEON_COLORS.neonBlue}50`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {drawCount > 0 ? `摸 ${drawCount} 张` : '摸牌'}
              </motion.button>
            ) : (
              <motion.button
                onClick={handlePlayDrawnCard}
                className="px-6 py-3 rounded-xl font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonGreen,
                  color: '#fff',
                  boxShadow: `0 0 15px ${NEON_COLORS.neonGreen}50`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                打出摸到的牌
              </motion.button>
            )}
          </div>
        )}

        {playerHand.length > 0 && (
          <div className="mb-4">
            <div className="text-center mb-2 text-sm" style={{ color: NEON_COLORS.gold }}>
              你的手牌 ({playerHand.length}张)
            </div>
            <div className="flex justify-center flex-wrap gap-2">
              {playerHand.map((card, index) => {
                const playable = canPlayCard(card);
                return (
                  <motion.div
                    key={card.id}
                    onClick={() => playable && handlePlayCard(card.id)}
                    className={playable ? 'cursor-pointer' : 'cursor-not-allowed'}
                    whileHover={playable ? { y: -10, scale: 1.05 } : {}}
                    whileTap={playable ? { scale: 0.95 } : {}}
                    style={{
                      width: CARD_WIDTH,
                      height: CARD_HEIGHT,
                      background: getColorHex(card.color),
                      borderRadius: '10px',
                      border: `3px solid ${playable ? '#fff' : '#666'}`,
                      boxShadow: playable ? `0 0 15px ${getColorHex(card.color)}` : 'none',
                      opacity: playable ? 1 : 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      marginLeft: index > 0 ? -15 : 0
                    }}
                  >
                    <div
                      style={{
                        width: '50%',
                        height: '40%',
                        background: '#fff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <span style={{ color: getColorHex(card.color), fontWeight: 'bold', fontSize: '16px' }}>
                        {getCardDisplay(card)}
                      </span>
                    </div>
                    <span style={{ position: 'absolute', top: '5px', left: '8px', color: '#fff', fontSize: '10px' }}>
                      {getCardDisplay(card)}
                    </span>
                    <span style={{ position: 'absolute', bottom: '5px', right: '8px', color: '#fff', fontSize: '10px' }}>
                      {getCardDisplay(card)}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <AnimatePresence>
          {showColorPicker && (
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
                  background: 'linear-gradient(135deg, #2a2a4a 0%, #3a3a6a 100%)',
                  border: `2px solid ${NEON_COLORS.gold}`,
                  boxShadow: `0 0 50px ${NEON_COLORS.gold}50`
                }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
              >
                <div className="text-2xl font-bold mb-6" style={{ color: NEON_COLORS.gold }}>
                  选择颜色
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(['red', 'yellow', 'green', 'blue'] as UnoColor[]).map(color => (
                    <motion.button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className="px-8 py-4 rounded-xl font-bold"
                      style={{
                        backgroundColor: getColorHex(color),
                        color: color === 'yellow' ? '#000' : '#fff',
                        boxShadow: `0 0 20px ${getColorHex(color)}`
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {getColorName(color)}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gamePhase === 'ended' && winner !== null && (
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
                  background: 'linear-gradient(135deg, #2a2a4a 0%, #3a3a6a 100%)',
                  border: `2px solid ${winner === 0 ? NEON_COLORS.neonGreen : '#ff4444'}`,
                  boxShadow: `0 0 50px ${winner === 0 ? NEON_COLORS.neonGreen : '#ff4444'}50`
                }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
              >
                <div className="text-4xl font-bold mb-4" style={{
                  color: winner === 0 ? NEON_COLORS.neonGreen : '#ff4444'
                }}>
                  {gameResult}
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
