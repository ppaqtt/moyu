import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CoopRunEngine } from './engine';
import { COOP_RUN_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { useLocalStorage } from '../../hooks/useLocalStorage';

type GameStatus = 'idle' | 'playing' | 'gameover';

const { CANVAS_WIDTH, CANVAS_HEIGHT } = COOP_RUN_CONSTANTS;

const CoopRun: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CoopRunEngine | null>(null);

  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [player1Alive, setPlayer1Alive] = useState(true);
  const [player2Alive, setPlayer2Alive] = useState(true);
  const [bothAlive, setBothAlive] = useState(true);
  const [bestScore, setBestScore] = useLocalStorage<number>(STORAGE_KEYS.COOP_RUN, 0);
  const [doubleScoreActive, setDoubleScoreActive] = useState(false);

  const navigate = useNavigate();

  const handleGameOver = useCallback((finalScore: number, bothDied: boolean) => {
    setGameStatus('gameover');
    if (finalScore > bestScore) {
      setBestScore(finalScore);
    }
    if (bothDied) {
      setPlayer1Alive(false);
      setPlayer2Alive(false);
    }
  }, [bestScore, setBestScore]);

  const handleCollect = useCallback((isDouble: boolean) => {
    setDoubleScoreActive(isDouble);
    setTimeout(() => setDoubleScoreActive(false), 500);
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9v');
    audio.volume = 0.15;
    audio.play().catch(() => {});
  }, []);

  const handleRevive = useCallback(() => {
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9v');
    audio.volume = 0.2;
    audio.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new CoopRunEngine(canvasRef.current);
    engineRef.current = engine;

    engine.setCallbacks({
      onGameOver: handleGameOver,
      onCollect: handleCollect,
      onRevive: handleRevive,
      onScoreUpdate: (newScore, alive) => {
        setScore(newScore);
        setBothAlive(alive);
        setPlayer1Alive(engine.getPlayer1Alive());
        setPlayer2Alive(engine.getPlayer2Alive());
      }
    });

    return () => {
      engine.stop();
    };
  }, [handleGameOver, handleCollect, handleRevive]);

  const startGame = useCallback(() => {
    if (!engineRef.current) return;

    engineRef.current.reset();
    setScore(0);
    setPlayer1Alive(true);
    setPlayer2Alive(true);
    setBothAlive(true);
    setDoubleScoreActive(false);
    setGameStatus('playing');
    engineRef.current.start();
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameStatus !== 'playing') return;

    switch (e.code) {
      case 'KeyW':
        e.preventDefault();
        engineRef.current?.jumpPlayer1();
        break;
      case 'KeyA':
        e.preventDefault();
        engineRef.current?.movePlayer1('left');
        break;
      case 'KeyS':
        e.preventDefault();
        engineRef.current?.slidePlayer1();
        break;
      case 'KeyD':
        e.preventDefault();
        engineRef.current?.movePlayer1('right');
        break;
      case 'KeyE':
        e.preventDefault();
        engineRef.current?.revivePlayer1();
        engineRef.current?.revivePlayer2();
        break;
      case 'ArrowUp':
        e.preventDefault();
        engineRef.current?.jumpPlayer2();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        engineRef.current?.movePlayer2('left');
        break;
      case 'ArrowDown':
        e.preventDefault();
        engineRef.current?.slidePlayer2();
        break;
      case 'ArrowRight':
        e.preventDefault();
        engineRef.current?.movePlayer2('right');
        break;
    }
  }, [gameStatus]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyS':
        engineRef.current?.releaseSlidePlayer1();
        break;
      case 'ArrowDown':
        engineRef.current?.releaseSlidePlayer2();
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

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
            双人合作跑酷
          </h1>
          <p style={{ color: '#888', marginTop: '8px', fontSize: '16px' }}>
            双人合作，躲避障碍，收集宝石，复活队友！
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
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
                    color: doubleScoreActive ? '#39ff14' : '#FFD700',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    transition: 'color 0.3s'
                  }}
                >
                  {score}
                </span>
                {doubleScoreActive && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ fontSize: '12px', color: '#39ff14' }}
                  >
                    x2
                  </motion.span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '14px', color: '#ff6b9d' }}>P1</span>
                <span
                  style={{
                    fontSize: '20px',
                    opacity: player1Alive ? 1 : 0.3,
                    transition: 'opacity 0.3s'
                  }}
                >
                  {player1Alive ? '❤️' : '💀'}
                </span>
              </div>

              <div
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: bothAlive ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255, 71, 87, 0.2)',
                  transition: 'background 0.3s'
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: bothAlive ? '#39ff14' : '#ff4757'
                  }}
                >
                  {bothAlive ? '双重保护' : '小心!'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '14px', color: '#00d2ff' }}>P2</span>
                <span
                  style={{
                    fontSize: '20px',
                    opacity: player2Alive ? 1 : 0.3,
                    transition: 'opacity 0.3s'
                  }}
                >
                  {player2Alive ? '❤️' : '💀'}
                </span>
              </div>
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
              <span style={{ color: '#00d2ff', fontSize: '20px', fontWeight: 'bold' }}>{bestScore}</span>
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
                      👥 双人合作跑酷
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
                        <p>W - 跳跃</p>
                        <p>A/D - 左右移动</p>
                        <p>S - 下滑</p>
                        <p>E - 复活队友</p>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ color: '#00d2ff', fontWeight: 'bold', marginBottom: '8px' }}>🎮 P2 (蓝色)</p>
                        <p>↑ - 跳跃</p>
                        <p>←/→ - 左右移动</p>
                        <p>↓ - 下滑</p>
                        <p>E - 复活队友</p>
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
                      <p style={{ color: '#FFD700', marginBottom: '5px' }}>💰 双人同时收集得分翻倍!</p>
                      <p style={{ color: '#39ff14' }}>💚 靠近倒地的队友按 E 复活!</p>
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
                        color: '#ff4757',
                        fontSize: '36px',
                        marginBottom: '15px',
                        fontWeight: 'bold'
                      }}
                    >
                      💀 游戏结束
                    </h2>
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ color: '#fff', fontSize: '24px', marginBottom: '10px' }}>
                        最终得分: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{score}</span>
                      </p>
                      {score >= bestScore && score > 0 && (
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
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>💰</div>
            <div style={{ color: '#FFD700', fontSize: '14px' }}>双倍得分</div>
            <div style={{ color: '#888', fontSize: '12px' }}>双人同时收集</div>
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
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>💚</div>
            <div style={{ color: '#39ff14', fontSize: '14px' }}>复活队友</div>
            <div style={{ color: '#888', fontSize: '12px' }}>靠近按 E</div>
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
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>💎</div>
            <div style={{ color: '#a855f7', fontSize: '14px' }}>宝石</div>
            <div style={{ color: '#888', fontSize: '12px' }}>高分收集</div>
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
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>⚠️</div>
            <div style={{ color: '#ff4757', fontSize: '14px' }}>障碍物</div>
            <div style={{ color: '#888', fontSize: '12px' }}>需要配合躲避</div>
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

export default CoopRun;
