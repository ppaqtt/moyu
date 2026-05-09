import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BunnyHunterEngine } from './engine';
import { BUNNY_HUNTER_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { useLocalStorage } from '../../hooks/useLocalStorage';

type GameStatus = 'idle' | 'playing' | 'gameover';

const { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_DURATION } = BUNNY_HUNTER_CONSTANTS;

const BunnyHunter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BunnyHunterEngine | null>(null);

  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [coopHits, setCoopHits] = useState(0);
  const [coopBonusActive, setCoopBonusActive] = useState(false);
  const [bestScore, setBestScore] = useLocalStorage<number>(STORAGE_KEYS.BUNNY_HUNTER, 0);

  const navigate = useNavigate();

  const handleGameOver = useCallback((p1Score: number, p2Score: number, coop: number) => {
    setGameStatus('gameover');
    const totalScore = p1Score + p2Score + coop * 20;
    if (totalScore > bestScore) {
      setBestScore(totalScore);
    }
  }, [bestScore, setBestScore]);

  const handleCoopHit = useCallback(() => {
    setCoopBonusActive(true);
    setCoopHits(prev => prev + 1);
    setTimeout(() => setCoopBonusActive(false), 500);
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9v');
    audio.volume = 0.2;
    audio.play().catch(() => {});
  }, []);

  const handleShoot = useCallback(() => {
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9v');
    audio.volume = 0.15;
    audio.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BunnyHunterEngine(canvasRef.current);
    engineRef.current = engine;

    engine.setCallbacks({
      onGameOver: handleGameOver,
      onCoopHit: handleCoopHit,
      onShoot: handleShoot,
      onScoreUpdate: (p1, p2, time) => {
        setPlayer1Score(p1);
        setPlayer2Score(p2);
        setTimeLeft(time);
      }
    });

    return () => {
      engine.stop();
    };
  }, [handleGameOver, handleCoopHit, handleShoot]);

  const startGame = useCallback(() => {
    if (!engineRef.current) return;

    engineRef.current.reset();
    setPlayer1Score(0);
    setPlayer2Score(0);
    setCoopHits(0);
    setCoopBonusActive(false);
    setTimeLeft(GAME_DURATION);
    setGameStatus('playing');
    engineRef.current.start();
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameStatus !== 'playing') return;

    switch (e.code) {
      case 'KeyA':
        e.preventDefault();
        engineRef.current?.aimPlayer1('left');
        break;
      case 'KeyD':
        e.preventDefault();
        engineRef.current?.aimPlayer1('right');
        break;
      case 'KeyW':
        e.preventDefault();
        engineRef.current?.shootPlayer1();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        engineRef.current?.aimPlayer2('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        engineRef.current?.aimPlayer2('right');
        break;
      case 'ArrowUp':
        e.preventDefault();
        engineRef.current?.shootPlayer2();
        break;
    }
  }, [gameStatus]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const totalScore = player1Score + player2Score + coopHits * 20;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          maxWidth: '900px',
          width: '100%'
        }}
      >
        <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #ff6b9d, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              textShadow: '0 0 30px rgba(168, 85, 247, 0.3)'
            }}
          >
            🐰 兔子猎人
          </h1>
          <p style={{ color: '#888', marginTop: '8px', fontSize: '16px' }}>
            双人合作射击从天而降的兔子！
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="glass-card"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
              gap: '20px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div
                style={{
                  background: 'rgba(255, 107, 157, 0.2)',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '18px', color: '#ff6b9d' }}>P1</span>
                <span style={{ color: '#ff6b9d', fontSize: '24px', fontWeight: 'bold' }}>
                  {player1Score}
                </span>
              </div>

              <div
                style={{
                  background: 'rgba(255, 215, 0, 0.2)',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '20px' }}>🏆</span>
                <span
                  style={{
                    color: coopBonusActive ? '#39ff14' : '#FFD700',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    transition: 'color 0.3s'
                  }}
                >
                  {totalScore}
                </span>
                {coopBonusActive && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ fontSize: '12px', color: '#39ff14' }}
                  >
                    x2
                  </motion.span>
                )}
              </div>

              <div
                style={{
                  background: 'rgba(0, 210, 255, 0.2)',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '18px', color: '#00d2ff' }}>P2</span>
                <span style={{ color: '#00d2ff', fontSize: '24px', fontWeight: 'bold' }}>
                  {player2Score}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div
                style={{
                  background: timeLeft <= 10 ? 'rgba(255, 71, 87, 0.3)' : 'rgba(100, 100, 255, 0.2)',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.3s'
                }}
              >
                <span style={{ fontSize: '20px' }}>⏱️</span>
                <span
                  style={{
                    color: timeLeft <= 10 ? '#ff4757' : '#fff',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    transition: 'color 0.3s'
                  }}
                >
                  {timeLeft}s
                </span>
              </div>

              <div
                style={{
                  background: 'rgba(168, 85, 247, 0.2)',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '20px' }}>🤝</span>
                <span style={{ color: '#a855f7', fontSize: '20px', fontWeight: 'bold' }}>
                  {coopHits}
                </span>
              </div>

              <div
                style={{
                  background: 'rgba(100, 100, 255, 0.2)',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '20px' }}>⭐</span>
                <span style={{ color: '#00d2ff', fontSize: '20px', fontWeight: 'bold' }}>
                  {bestScore}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 0 0 2px rgba(255, 255, 255, 0.1)'
            }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              style={{
                display: 'block',
                background: '#0f0f1a'
              }}
            />

            <AnimatePresence>
              {gameStatus === 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(5px)'
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '30px 50px',
                      borderRadius: '20px',
                      textAlign: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <h2
                      style={{
                        color: '#fff',
                        fontSize: '32px',
                        marginBottom: '20px',
                        fontWeight: 'bold'
                      }}
                    >
                      🐰 兔子猎人
                    </h2>
                    <div
                      style={{
                        color: '#ccc',
                        fontSize: '15px',
                        lineHeight: '2',
                        marginBottom: '20px',
                        display: 'flex',
                        gap: '40px',
                        justifyContent: 'center'
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ color: '#ff6b9d', fontWeight: 'bold', marginBottom: '8px' }}>🎮 P1 (粉色)</p>
                        <p>A - 向左瞄准</p>
                        <p>D - 向右瞄准</p>
                        <p>W - 射击</p>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ color: '#00d2ff', fontWeight: 'bold', marginBottom: '8px' }}>🎮 P2 (蓝色)</p>
                        <p>← - 向左瞄准</p>
                        <p>→ - 向右瞄准</p>
                        <p>↑ - 射击</p>
                      </div>
                    </div>
                    <div
                      style={{
                        color: '#888',
                        fontSize: '13px',
                        marginBottom: '20px',
                        padding: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px'
                      }}
                    >
                      <p style={{ color: '#FFD700', marginBottom: '5px' }}>🐰 有些兔子需要特定玩家射击!</p>
                      <p style={{ color: '#39ff14' }}>🤝 同时射中两只兔子获得合作奖励!</p>
                      <p style={{ color: '#ff4757' }}>❌ 漏掉兔子会扣分!</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startGame}
                      style={{
                        background: 'linear-gradient(135deg, #ff6b9d, #a855f7)',
                        border: 'none',
                        padding: '15px 50px',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#fff',
                        borderRadius: '30px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)',
                        transition: 'all 0.3s'
                      }}
                    >
                      开始游戏
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}

              {gameStatus === 'gameover' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '30px 60px',
                      borderRadius: '20px',
                      textAlign: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <h2
                      style={{
                        color: '#fff',
                        fontSize: '36px',
                        marginBottom: '15px',
                        fontWeight: 'bold'
                      }}
                    >
                      🐰 游戏结束
                    </h2>
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ color: '#fff', fontSize: '20px', marginBottom: '10px' }}>
                        P1 得分: <span style={{ color: '#ff6b9d', fontWeight: 'bold' }}>{player1Score}</span>
                      </p>
                      <p style={{ color: '#fff', fontSize: '20px', marginBottom: '10px' }}>
                        P2 得分: <span style={{ color: '#00d2ff', fontWeight: 'bold' }}>{player2Score}</span>
                      </p>
                      <p style={{ color: '#fff', fontSize: '20px', marginBottom: '10px' }}>
                        合作击杀: <span style={{ color: '#a855f7', fontWeight: 'bold' }}>{coopHits}</span>
                      </p>
                      <p style={{ color: '#FFD700', fontSize: '24px', marginTop: '10px' }}>
                        总分: <span style={{ fontWeight: 'bold' }}>{totalScore}</span>
                      </p>
                      {totalScore >= bestScore && totalScore > 0 && (
                        <motion.p
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={{
                            color: '#39ff14',
                            fontSize: '20px',
                            fontWeight: 'bold'
                          }}
                        >
                          🎉 新纪录！
                        </motion.p>
                      )}
                      <p style={{ color: '#888', fontSize: '16px', marginTop: '5px' }}>
                        最高分: <span style={{ color: '#FFD700' }}>{bestScore}</span>
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startGame}
                        style={{
                          background: 'linear-gradient(135deg, #ff6b9d, #a855f7)',
                          border: 'none',
                          padding: '12px 35px',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#fff',
                          borderRadius: '25px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)'
                        }}
                      >
                        再玩一次
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/')}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          padding: '12px 35px',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#fff',
                          borderRadius: '25px',
                          cursor: 'pointer'
                        }}
                      >
                        返回主页
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          style={{
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          <div
            className="glass-card"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '15px 20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🐰</div>
            <div style={{ color: '#FFD700', fontSize: '14px' }}>普通兔子</div>
            <div style={{ color: '#888', fontSize: '12px' }}>任意玩家可射击</div>
          </div>

          <div
            className="glass-card"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '15px 20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🏷️</div>
            <div style={{ color: '#ff6b9d', fontSize: '14px' }}>P1专属</div>
            <div style={{ color: '#888', fontSize: '12px' }}>只有P1可射击</div>
          </div>

          <div
            className="glass-card"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '15px 20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🏷️</div>
            <div style={{ color: '#00d2ff', fontSize: '14px' }}>P2专属</div>
            <div style={{ color: '#888', fontSize: '12px' }}>只有P2可射击</div>
          </div>

          <div
            className="glass-card"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '15px 20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🤝</div>
            <div style={{ color: '#a855f7', fontSize: '14px' }}>合作奖励</div>
            <div style={{ color: '#888', fontSize: '12px' }}>同时射中获得双倍</div>
          </div>
        </motion.div>

        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '12px 30px',
            fontSize: '16px',
            color: '#fff',
            borderRadius: '25px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          ← 返回游戏列表
        </motion.button>
      </motion.div>
    </div>
  );
};

export default BunnyHunter;
