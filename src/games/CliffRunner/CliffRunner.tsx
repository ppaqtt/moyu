import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CliffRunnerEngine } from './engine';
import { CLIFF_RUNNER_CONSTANTS, STORAGE_KEYS } from '../../utils/constants';
import { useLocalStorage } from '../../hooks/useLocalStorage';

type GameStatus = 'idle' | 'playing' | 'gameover';

const { CANVAS_WIDTH, CANVAS_HEIGHT } = CLIFF_RUNNER_CONSTANTS;

const CliffRunner: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CliffRunnerEngine | null>(null);

  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [bestScore, setBestScore] = useLocalStorage<number>(STORAGE_KEYS.CLIFF_RUNNER, 0);

  const navigate = useNavigate();

  const handleGameOver = useCallback((finalScore: number) => {
    setGameStatus('gameover');
    if (finalScore > bestScore) {
      setBestScore(finalScore);
    }
  }, [bestScore, setBestScore]);

  const handleJump = useCallback(() => {
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9v');
    audio.volume = 0.1;
    audio.play().catch(() => {});
  }, []);

  const handleSlide = useCallback(() => {
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9v');
    audio.volume = 0.05;
    audio.play().catch(() => {});
  }, []);

  const handleHit = useCallback(() => {
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9v');
    audio.volume = 0.2;
    audio.play().catch(() => {});
  }, []);

  const handleCollect = useCallback(() => {
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9v');
    audio.volume = 0.15;
    audio.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new CliffRunnerEngine(canvasRef.current);
    engineRef.current = engine;

    engine.setCallbacks({
      onJump: handleJump,
      onSlide: handleSlide,
      onHit: () => {
        handleHit();
        setLives(engine.getLives());
      },
      onCollect: () => {
        handleCollect();
        setScore(engine.getScore());
      },
      onGameOver: handleGameOver,
      onScoreUpdate: (newScore) => {
        setScore(newScore);
        setLives(engine.getLives());
      }
    });

    return () => {
      engine.stop();
    };
  }, [handleGameOver, handleJump, handleSlide, handleHit, handleCollect]);

  const startGame = useCallback(() => {
    if (!engineRef.current) return;

    engineRef.current.reset();
    setScore(0);
    setLives(3);
    setGameStatus('playing');
    engineRef.current.start();
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameStatus !== 'playing') return;

    switch (e.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        e.preventDefault();
        engineRef.current?.jump();
        break;
      case 'ArrowDown':
      case 'KeyS':
        e.preventDefault();
        engineRef.current?.slide();
        break;
    }
  }, [gameStatus]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      engineRef.current?.releaseSlide();
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
          maxWidth: '800px',
          width: '100%'
        }}
      >
        <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #FFD700, #FF6B6B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              textShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
            }}
          >
            悬崖跑酷
          </h1>
          <p style={{ color: '#888', marginTop: '8px', fontSize: '16px' }}>
            在悬崖边奔跑跳跃，躲避障碍收集道具！
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
              gap: '30px'
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
                <span style={{ color: '#FFD700', fontSize: '24px', fontWeight: 'bold' }}>{score}</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {[...Array(3)].map((_, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '28px',
                    opacity: i < lives ? 1 : 0.3,
                    transition: 'opacity 0.3s'
                  }}
                >
                  ❤️
                </span>
              ))}
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
                background: '#87CEEB'
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
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(5px)'
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
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
                        fontSize: '32px',
                        marginBottom: '20px',
                        fontWeight: 'bold'
                      }}
                    >
                      🏔️ 悬崖跑酷
                    </h2>
                    <div
                      style={{
                        color: '#ccc',
                        fontSize: '16px',
                        lineHeight: '2',
                        marginBottom: '25px'
                      }}
                    >
                      <p>🎮 <strong>空格/↑/W</strong> - 跳跃</p>
                      <p>⬇️ <strong>S/↓</strong> - 下滑</p>
                      <p style={{ marginTop: '15px', color: '#FFD700' }}>
                        ⚡ 能量饮料 - 加速
                      </p>
                      <p style={{ color: '#00FFFF' }}>
                        🛡 护盾 - 免疫一次伤害
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startGame}
                      style={{
                        background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                        border: 'none',
                        padding: '15px 50px',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#fff',
                        borderRadius: '30px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
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
                    background: 'rgba(0, 0, 0, 0.8)',
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
                        color: '#FF6B6B',
                        fontSize: '36px',
                        marginBottom: '15px',
                        fontWeight: 'bold'
                      }}
                    >
                      💀 游戏结束
                    </h2>
                    <div
                      style={{
                        marginBottom: '20px'
                      }}
                    >
                      <p style={{ color: '#fff', fontSize: '24px', marginBottom: '10px' }}>
                        本次得分: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{score}</span>
                      </p>
                      {score >= bestScore && score > 0 && (
                        <motion.p
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={{
                            color: '#00FFFF',
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
                    <div
                      style={{
                        display: 'flex',
                        gap: '15px',
                        justifyContent: 'center'
                      }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startGame}
                        style={{
                          background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                          border: 'none',
                          padding: '12px 35px',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#fff',
                          borderRadius: '25px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)'
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
            gap: '20px',
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
              padding: '15px 25px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🎮</div>
            <div style={{ color: '#888', fontSize: '14px' }}>空格/↑/W</div>
            <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>跳跃</div>
          </div>

          <div
            className="glass-card"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '15px 25px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>⬇️</div>
            <div style={{ color: '#888', fontSize: '14px' }}>S/↓</div>
            <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>下滑</div>
          </div>

          <div
            className="glass-card"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '15px 25px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🛡</div>
            <div style={{ color: '#00FFFF', fontSize: '14px' }}>护盾</div>
            <div style={{ color: '#888', fontSize: '12px' }}>免疫一次</div>
          </div>

          <div
            className="glass-card"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '15px 25px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>⚡</div>
            <div style={{ color: '#FFD700', fontSize: '14px' }}>能量饮料</div>
            <div style={{ color: '#888', fontSize: '12px' }}>加速效果</div>
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

export default CliffRunner;
