import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MusicHeroEngine, Note } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { useGameLoop } from '../../hooks/useGameLoop';

const engine = new MusicHeroEngine();

interface FeedbackEffect {
  text: string;
  color: string;
  time: number;
}

export default function MusicHero() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [stats, setStats] = useState({ perfect: 0, great: 0, good: 0, miss: 0 });
  const [notes, setNotes] = useState<Note[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEffect | null>(null);
  const [songProgress, setSongProgress] = useState(0);
  const feedbackTimerRef = useRef<number | null>(null);
  const canvasSize = engine.getCanvasSize();
  const hitLineY = engine.getHitLineY();
  const laneWidth = engine.getLaneWidth();
  const laneColors = engine.getLaneColors();
  const numLanes = 4;

  const handleGameLoop = useCallback((deltaTime: number) => {
    engine.tick(deltaTime);
    const state = engine.getState();
    setScore(state.score);
    setCombo(state.combo);
    setMaxCombo(state.maxCombo);
    setAccuracy(engine.getAccuracy());
    setSongProgress(engine.getSongProgress());
    setStats({
      perfect: state.perfectCount,
      great: state.greatCount,
      good: state.goodCount,
      miss: state.missCount,
    });
    setNotes([...state.notes]);

    if (state.isGameOver && gameState === 'playing') {
      setGameState('gameover');
    }
    if (state.isPaused !== (gameState === 'paused')) {
      setGameState(state.isPaused ? 'paused' : 'playing');
    }
  }, [gameState]);

  useGameLoop(handleGameLoop, gameState === 'playing');

  const startGame = useCallback(() => {
    engine.start();
    setGameState('playing');
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setAccuracy(0);
    setStats({ perfect: 0, great: 0, good: 0, miss: 0 });
    setNotes([]);
    setSongProgress(0);
    setFeedback(null);
  }, []);

  const handleTap = useCallback((lane: number) => {
    if (gameState !== 'playing') return;
    const result = engine.handleTap(lane);
    const colorMap: Record<string, string> = {
      perfect: NEON_COLORS.perfect,
      great: NEON_COLORS.great,
      good: NEON_COLORS.good,
      miss: NEON_COLORS.miss,
    };
    const textMap: Record<string, string> = {
      perfect: 'PERFECT!',
      great: 'GREAT!',
      good: 'GOOD!',
      miss: 'MISS!',
    };
    setFeedback({ text: textMap[result.result], color: colorMap[result.result], time: Date.now() });
    
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
    }, 400);
  }, [gameState]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState === 'menu' || gameState === 'gameover') return;
    
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      engine.togglePause();
      return;
    }
    
    if (gameState !== 'playing') return;
    
    const keyMap: Record<string, number> = {
      '1': 0, '2': 1, '3': 2, '4': 3,
      'a': 0, 's': 1, 'd': 2, 'f': 3,
      'j': 0, 'k': 1, 'l': 2, ';': 3,
      'A': 0, 'S': 1, 'D': 2, 'F': 3,
    };
    const lane = keyMap[e.key];
    if (lane !== undefined) {
      handleTap(lane);
    }
  }, [gameState, handleTap]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  const laneKeys = ['1', '2', '3', '4'];

  const renderMenu = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: NEON_COLORS.text,
    }}>
      <h1 style={{
        fontSize: '48px',
        color: NEON_COLORS.danger,
        textShadow: `0 0 20px ${NEON_COLORS.danger}, 0 0 40px ${NEON_COLORS.danger}`,
        marginBottom: '10px',
        fontFamily: 'Rockwell, sans-serif',
      }}>
        MUSIC HERO
      </h1>
      <h2 style={{
        fontSize: '24px',
        color: NEON_COLORS.primary,
        textShadow: `0 0 10px ${NEON_COLORS.primary}`,
        marginBottom: '50px',
      }}>
        音乐英雄
      </h2>
      
      {/* Guitar visual */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '50px',
      }}>
        {laneColors.map((color, i) => (
          <div key={i} style={{
            width: '80px',
            height: '150px',
            background: `${color}33`,
            border: `3px solid ${color}`,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 30px ${color}66`,
            position: 'relative',
          }}>
            <div style={{
              width: '4px',
              height: '80%',
              background: color,
              borderRadius: '2px',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '10px',
              fontSize: '20px',
              fontWeight: 'bold',
              color,
            }}>
              {laneKeys[i]}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={startGame}
        style={{
          padding: '15px 50px',
          fontSize: '24px',
          background: `linear-gradient(135deg, ${NEON_COLORS.danger}, ${NEON_COLORS.secondary})`,
          border: 'none',
          borderRadius: '10px',
          color: NEON_COLORS.text,
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: `0 0 30px ${NEON_COLORS.danger}`,
          fontFamily: 'Rockwell, sans-serif',
        }}
      >
        开始演奏
      </button>
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: '20px',
          padding: '10px 30px',
          fontSize: '16px',
          background: 'transparent',
          border: `2px solid ${NEON_COLORS.textDim}`,
          borderRadius: '5px',
          color: NEON_COLORS.textDim,
          cursor: 'pointer',
        }}
      >
        返回主页
      </button>
      <div style={{ marginTop: '40px', color: NEON_COLORS.textDim, textAlign: 'center' }}>
        <p>按键: 1-4 或 A-S-D-F</p>
        <p>按 ESC 暂停</p>
      </div>
    </div>
  );

  const renderGame = () => (
    <div style={{ position: 'relative', width: canvasSize.width, height: canvasSize.height }}>
      {/* Background */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: `linear-gradient(180deg, #0d0d1a 0%, #1a0d1a 50%, #0d0d1a 100%)`,
        borderRadius: '10px',
        overflow: 'hidden',
      }}>
        {/* Stage lights effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: `linear-gradient(180deg, ${NEON_COLORS.danger}11 0%, transparent 100%)`,
          pointerEvents: 'none',
        }} />

        {/* Lane backgrounds */}
        {[...Array(numLanes)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i * laneWidth,
              top: 0,
              width: laneWidth,
              height: '100%',
              background: `${laneColors[i]}08`,
            }}
          />
        ))}

        {/* Lane dividers */}
        {[...Array(numLanes - 1)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i + 1) * laneWidth - 1}px`,
              top: 0,
              width: '2px',
              height: '100%',
              background: `${NEON_COLORS.textDim}33`,
            }}
          />
        ))}

        {/* Hit zone glow */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: hitLineY - 30,
          width: '100%',
          height: '80px',
          background: `linear-gradient(180deg, transparent, ${NEON_COLORS.primary}22, transparent)`,
          pointerEvents: 'none',
        }} />

        {/* Hit line */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: hitLineY,
          width: '100%',
          height: '6px',
          background: `linear-gradient(90deg, ${laneColors[0]}, ${laneColors[1]}, ${laneColors[2]}, ${laneColors[3]})`,
          boxShadow: `0 0 30px ${NEON_COLORS.primary}`,
        }} />

        {/* Hit zones */}
        {[...Array(numLanes)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i * laneWidth + 15,
              top: hitLineY - 25,
              width: laneWidth - 30,
              height: '50px',
              background: `${laneColors[i]}33`,
              borderRadius: '8px',
              border: `2px solid ${laneColors[i]}`,
              boxShadow: `0 0 20px ${laneColors[i]}44`,
            }}
          />
        ))}

        {/* Notes */}
        {notes.filter(n => !n.hit).map(note => (
          <div
            key={note.id}
            onClick={() => handleTap(note.lane)}
            style={{
              position: 'absolute',
              left: note.lane * laneWidth + 15,
              top: note.y,
              width: laneWidth - 30,
              height: '40px',
              background: note.isGlowNote
                ? `linear-gradient(135deg, ${laneColors[note.lane]}, #ffffff)`
                : `linear-gradient(135deg, ${laneColors[note.lane]}, ${laneColors[note.lane]}aa)`,
              borderRadius: '6px',
              boxShadow: note.isGlowNote
                ? `0 0 30px ${laneColors[note.lane]}, 0 0 60px ${laneColors[note.lane]}`
                : `0 0 15px ${laneColors[note.lane]}`,
              cursor: 'pointer',
            }}
          />
        ))}

        {/* Hit effects */}
        {notes.filter(n => n.hit && n.hitTime && Date.now() - n.hitTime < 300).map(note => (
          <div
            key={`hit-${note.id}`}
            style={{
              position: 'absolute',
              left: note.lane * laneWidth,
              top: hitLineY - 50,
              width: laneWidth,
              height: '100px',
              background: `radial-gradient(ellipse at center, ${
                note.timing === 'perfect' ? NEON_COLORS.perfect :
                note.timing === 'great' ? NEON_COLORS.great :
                note.timing === 'good' ? NEON_COLORS.good : NEON_COLORS.miss
              }66 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>

      {/* HUD */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        color: NEON_COLORS.text,
        fontSize: '18px',
        fontWeight: 'bold',
        textShadow: `0 0 10px ${NEON_COLORS.background}`,
      }}>
        <div>分数: {score}</div>
        <div>连击: {combo}</div>
        <div>准确: {accuracy}%</div>
      </div>

      {/* Song progress */}
      <div style={{
        position: 'absolute',
        top: '40px',
        left: '10px',
        right: '10px',
        height: '6px',
        background: `${NEON_COLORS.surface}`,
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${songProgress}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${NEON_COLORS.danger}, ${NEON_COLORS.secondary})`,
          transition: 'width 0.1s',
        }} />
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '36px',
          fontWeight: 'bold',
          color: feedback.color,
          textShadow: `0 0 30px ${feedback.color}`,
          animation: 'pulse 0.3s ease-out',
          fontFamily: 'Rockwell, sans-serif',
        }}>
          {feedback.text}
        </div>
      )}

      {/* Key indicators */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '0 20px',
      }}>
        {laneColors.map((color, i) => (
          <div
            key={i}
            onClick={() => handleTap(i)}
            style={{
              width: '50px',
              height: '50px',
              background: `${color}44`,
              border: `3px solid ${color}`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: `0 0 15px ${color}66`,
            }}
          >
            {laneKeys[i]}
          </div>
        ))}
      </div>
    </div>
  );

  const renderPaused = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: NEON_COLORS.text,
    }}>
      <h1 style={{
        fontSize: '48px',
        color: NEON_COLORS.accent,
        textShadow: `0 0 20px ${NEON_COLORS.accent}`,
        marginBottom: '30px',
      }}>
        暂停
      </h1>
      <button
        onClick={() => engine.togglePause()}
        style={{
          padding: '15px 50px',
          fontSize: '24px',
          background: `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.accent})`,
          border: 'none',
          borderRadius: '10px',
          color: NEON_COLORS.background,
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: `0 0 30px ${NEON_COLORS.primary}`,
          marginBottom: '15px',
        }}
      >
        继续游戏
      </button>
      <button
        onClick={startGame}
        style={{
          padding: '10px 30px',
          fontSize: '16px',
          background: 'transparent',
          border: `2px solid ${NEON_COLORS.textDim}`,
          borderRadius: '5px',
          color: NEON_COLORS.textDim,
          cursor: 'pointer',
          marginBottom: '15px',
        }}
      >
        重新开始
      </button>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '10px 30px',
          fontSize: '16px',
          background: 'transparent',
          border: `2px solid ${NEON_COLORS.textDim}`,
          borderRadius: '5px',
          color: NEON_COLORS.textDim,
          cursor: 'pointer',
        }}
      >
        返回主页
      </button>
    </div>
  );

  const renderGameOver = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: NEON_COLORS.text,
    }}>
      <h1 style={{
        fontSize: '42px',
        color: NEON_COLORS.success,
        textShadow: `0 0 20px ${NEON_COLORS.success}`,
        marginBottom: '30px',
        fontFamily: 'Rockwell, sans-serif',
      }}>
        演奏完成!
      </h1>
      <div style={{
        background: `${NEON_COLORS.surface}dd`,
        borderRadius: '15px',
        padding: '30px 50px',
        marginBottom: '30px',
        boxShadow: `0 0 30px ${NEON_COLORS.danger}44`,
        border: `2px solid ${NEON_COLORS.secondary}44`,
      }}>
        <div style={{ fontSize: '28px', marginBottom: '20px', color: NEON_COLORS.accent }}>
          最终得分: {score}
        </div>
        <div style={{ fontSize: '20px', marginBottom: '10px' }}>
          最大连击: <span style={{ color: NEON_COLORS.primary }}>{maxCombo}</span>
        </div>
        <div style={{ fontSize: '20px', marginBottom: '10px' }}>
          准确率: <span style={{ color: NEON_COLORS.success }}>{accuracy}%</span>
        </div>
        <div style={{
          display: 'flex',
          gap: '20px',
          marginTop: '20px',
          fontSize: '16px',
        }}>
          <span style={{ color: NEON_COLORS.perfect }}>完美: {stats.perfect}</span>
          <span style={{ color: NEON_COLORS.great }}>很好: {stats.great}</span>
          <span style={{ color: NEON_COLORS.good }}>好: {stats.good}</span>
          <span style={{ color: NEON_COLORS.miss }}>失误: {stats.miss}</span>
        </div>
        
        {/* Rating */}
        <div style={{
          marginTop: '20px',
          fontSize: '24px',
          color: accuracy >= 90 ? NEON_COLORS.perfect : accuracy >= 70 ? NEON_COLORS.great : NEON_COLORS.warning,
          fontFamily: 'Rockwell, sans-serif',
        }}>
          {accuracy >= 90 ? 'SSS' : accuracy >= 80 ? 'SS' : accuracy >= 70 ? 'S' : accuracy >= 60 ? 'A' : 'B'}
        </div>
      </div>
      <button
        onClick={startGame}
        style={{
          padding: '15px 50px',
          fontSize: '24px',
          background: `linear-gradient(135deg, ${NEON_COLORS.danger}, ${NEON_COLORS.secondary})`,
          border: 'none',
          borderRadius: '10px',
          color: NEON_COLORS.text,
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: `0 0 30px ${NEON_COLORS.danger}`,
          marginBottom: '15px',
          fontFamily: 'Rockwell, sans-serif',
        }}
      >
        再来一局
      </button>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '10px 30px',
          fontSize: '16px',
          background: 'transparent',
          border: `2px solid ${NEON_COLORS.textDim}`,
          borderRadius: '5px',
          color: NEON_COLORS.textDim,
          cursor: 'pointer',
        }}
      >
        返回主页
      </button>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #1a0d1a 100%)`,
      fontFamily: 'Arial, sans-serif',
    }}>
      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
        }
      `}</style>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'paused' && renderPaused()}
      {gameState === 'gameover' && renderGameOver()}
    </div>
  );
}
