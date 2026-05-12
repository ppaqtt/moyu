import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { NEON_COLORS } from '../../utils/constants';
import { MahjongEngine, Tile, GamePhase, ClaimType, Wind } from './engine';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const TILE_WIDTH = 40;
const TILE_HEIGHT = 56;

export default function Mahjong() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MahjongEngine | null>(null);

  const [bestScore, setBestScore] = useLocalStorage<number>('mahjong_highscore', 0);
  const [gameStatus, setGameStatus] = useState<GamePhase>('setup');
  const [currentPlayer, setCurrentPlayer] = useState<number>(0);
  const [playerHand, setPlayerHand] = useState<Tile[]>([]);
  const [playerExposed, setPlayerExposed] = useState<Tile[][]>([]);
  const [scores, setScores] = useState<number[]>([0, 0, 0, 0]);
  const [prevailingWind, setPrevailingWind] = useState<Wind>('east');
  const [round, setRound] = useState<number>(1);
  const [winner, setWinner] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [claimableMoves, setClaimableMoves] = useState<ClaimType[]>([]);
  const [wallCount, setWallCount] = useState<number>(0);

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
    setScores(state.players.map(p => p.score));
    setPrevailingWind(state.prevailingWind);
    setRound(state.round);
    setWinner(state.winner);
    setClaimableMoves(state.claimable);
    setWallCount(state.wall.length);

    const hand = engine.getPlayerHand(0);
    setPlayerHand(hand);
    setPlayerExposed(state.players[0].exposed);

    if (state.phase === 'draw') {
      setMessage(state.currentPlayer === 0 ? '请摸牌' : `AI ${state.currentPlayer} 摸牌中...`);
    } else if (state.phase === 'discard') {
      setMessage(state.currentPlayer === 0 ? '请选择要打的牌' : `AI ${state.currentPlayer} 思考中...`);
    } else if (state.phase === 'claim') {
      setMessage('等待其他玩家响应...');
    } else if (state.phase === 'ended') {
      if (state.winner === -1) {
        setGameResult('流局');
      } else {
        setGameResult(state.winner === 0 ? '你胡了！' : `AI ${state.winner} 胡了！`);
        if (state.winner === 0 && scores[0] > bestScore) {
          setBestScore(scores[0]);
        }
      }
    }
  }, [bestScore, scores, setBestScore]);

  useEffect(() => {
    engineRef.current = new MahjongEngine();
    updateGameState();
    renderGame();

    const interval = setInterval(() => {
      updateGameState();
      renderGame();
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleDraw = () => {
    const engine = engineRef.current;
    if (!engine) return;

    if (engine.drawTile(0)) {
      updateGameState();
      renderGame();
    }
  };

  const handleDiscard = (tileId: string) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (engine.discardTile(0, tileId)) {
      updateGameState();
      renderGame();
    }
  };

  const handleClaim = (claimType: ClaimType) => {
    const engine = engineRef.current;
    if (!engine || !claimType) return;

    if (claimType === 'win') {
      updateGameState();
      renderGame();
    } else if (claimType === 'pong') {
      if (engine.claimPong(0)) {
        updateGameState();
        renderGame();
      }
    }
  };

  const startGame = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      updateGameState();
      renderGame();
    }
  };

  const handleExit = () => {
    navigate('/');
  };

  const getTileColor = (tile: Tile): string => {
    if (tile.suit === 'wan') return '#cc0000';
    if (tile.suit === 'tong') return '#0066cc';
    if (tile.suit === 'tiao') return '#00aa00';
    if (tile.suit === 'dragon') {
      if (tile.value === 1) return '#cc0000';
      if (tile.value === 2) return '#00aa00';
      return '#666666';
    }
    return '#333333';
  };

  const getTileText = (tile: Tile): string => {
    if (tile.suit === 'wan') return '万';
    if (tile.suit === 'tong') return '筒';
    if (tile.suit === 'tiao') return '条';
    if (tile.suit === 'wind') {
      const winds: Record<number, string> = { 1: '东', 2: '南', 3: '西', 4: '北' };
      return winds[tile.value] || '';
    }
    if (tile.suit === 'dragon') {
      const dragons: Record<number, string> = { 1: '中', 2: '发', 3: '白' };
      return dragons[tile.value] || '';
    }
    return '';
  };

  const getWindName = (wind: Wind): string => {
    const names: Record<Wind, string> = {
      east: '东', south: '南', west: '西', north: '北'
    };
    return names[wind];
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0a1a0a 0%, #0a3d0a 50%, #0a2a0a 100%)'
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
            国粹麻将
          </h1>

          <div className="text-center">
            <div className="text-xs opacity-60" style={{ color: NEON_COLORS.gold }}>最高记录</div>
            <div className="text-lg font-bold" style={{ color: NEON_COLORS.neonBlue }}>
              {bestScore}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-4">
          {['玩家(东)', 'AI 东', 'AI 西', 'AI 北'].map((name, idx) => (
            <div
              key={idx}
              className="px-3 py-2 rounded-xl text-center"
              style={{
                backgroundColor: currentPlayer === idx ? 'rgba(255, 215, 0, 0.3)' : 'rgba(100, 100, 100, 0.2)',
                border: `2px solid ${currentPlayer === idx ? NEON_COLORS.gold : '#666'}`,
                color: currentPlayer === idx ? NEON_COLORS.gold : '#888'
              }}
            >
              <div className="font-bold text-sm">{name}</div>
              <div className="text-xs">得分: {scores[idx]}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4 mb-4 text-sm" style={{ color: NEON_COLORS.gold }}>
          <span>圈风: {getWindName(prevailingWind)}</span>
          <span>第 {round} 局</span>
          <span>剩余牌: {wallCount}</span>
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

        {gameStatus === 'draw' && currentPlayer === 0 && (
          <div className="flex justify-center mb-4">
            <motion.button
              onClick={handleDraw}
              className="px-8 py-3 rounded-xl font-bold"
              style={{
                backgroundColor: NEON_COLORS.neonGreen,
                color: '#fff',
                boxShadow: `0 0 20px ${NEON_COLORS.neonGreen}`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              摸牌
            </motion.button>
          </div>
        )}

        {gameStatus === 'claim' && claimableMoves.length > 0 && (
          <div className="flex justify-center gap-4 mb-4">
            {claimableMoves.includes('win') && (
              <motion.button
                onClick={() => handleClaim('win')}
                className="px-6 py-3 rounded-xl font-bold"
                style={{
                  backgroundColor: NEON_COLORS.gold,
                  color: '#000',
                  boxShadow: `0 0 20px ${NEON_COLORS.gold}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                胡！
              </motion.button>
            )}
            {claimableMoves.includes('pong') && (
              <motion.button
                onClick={() => handleClaim('pong')}
                className="px-6 py-3 rounded-xl font-bold"
                style={{
                  backgroundColor: NEON_COLORS.neonPink,
                  color: '#fff',
                  boxShadow: `0 0 15px ${NEON_COLORS.neonPink}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                碰
              </motion.button>
            )}
            <motion.button
              onClick={() => handleClaim(null)}
              className="px-6 py-3 rounded-xl font-bold"
              style={{
                backgroundColor: '#666',
                color: '#fff',
                boxShadow: '0 0 15px rgba(100,100,100,0.5)'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              过
            </motion.button>
          </div>
        )}

        {playerExposed.length > 0 && (
          <div className="mb-4">
            <div className="text-center mb-2 text-sm" style={{ color: NEON_COLORS.gold }}>
              副露
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              {playerExposed.map((group, groupIdx) => (
                <div key={groupIdx} className="flex gap-1">
                  {group.map((tile, tileIdx) => (
                    <div
                      key={tileIdx}
                      style={{
                        width: TILE_WIDTH,
                        height: TILE_HEIGHT,
                        background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div style={{ color: getTileColor(tile), fontWeight: 'bold', fontSize: '14px' }}>
                        {getTileText(tile)}
                      </div>
                      {(tile.suit === 'wan' || tile.suit === 'tong' || tile.suit === 'tiao') && (
                        <div style={{ color: getTileColor(tile), fontSize: '10px' }}>
                          {tile.value}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="text-center mb-2" style={{ color: NEON_COLORS.gold }}>
            你的手牌 ({playerHand.length}张)
          </div>
          <div className="flex justify-center flex-wrap gap-1">
            {playerHand.map((tile, index) => (
              <motion.div
                key={tile.id}
                onClick={() => gameStatus === 'discard' && currentPlayer === 0 && handleDiscard(tile.id)}
                className="cursor-pointer"
                whileHover={{ y: -5, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: TILE_WIDTH,
                  height: TILE_HEIGHT,
                  background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                  borderRadius: '6px',
                  border: `2px solid ${gameStatus === 'discard' && currentPlayer === 0 ? NEON_COLORS.neonGreen : '#ccc'}`,
                  boxShadow: gameStatus === 'discard' && currentPlayer === 0 ? `0 0 10px ${NEON_COLORS.neonGreen}` : '0 2px 8px rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: index > 0 ? -8 : 0
                }}
              >
                <div style={{ color: getTileColor(tile), fontWeight: 'bold', fontSize: '16px' }}>
                  {getTileText(tile)}
                </div>
                {(tile.suit === 'wan' || tile.suit === 'tong' || tile.suit === 'tiao') && (
                  <div style={{ color: getTileColor(tile), fontSize: '12px' }}>
                    {tile.value}
                  </div>
                )}
              </motion.div>
            ))}
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
                  background: 'linear-gradient(135deg, #0a3d0a 0%, #0a2a0a 100%)',
                  border: `2px solid ${NEON_COLORS.gold}`,
                  boxShadow: `0 0 50px ${NEON_COLORS.gold}50`
                }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
              >
                <div className="text-4xl font-bold mb-4" style={{ color: NEON_COLORS.gold }}>
                  {gameResult}
                </div>
                <div className="text-xl mb-6" style={{ color: NEON_COLORS.neonGreen }}>
                  最终得分: {scores[0]}
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
