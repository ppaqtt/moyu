import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RhythmMasterEngine, Note } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { useGameLoop } from '../../hooks/useGameLoop';

const engine = new RhythmMasterEngine();

interface FeedbackEffect {
  text: string;
  color: string;
  time: number;
}

export default function RhythmMaster() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [stats, setStats] = useState({ perfect: 0, great: 0, good: 0, miss: 0 });
  const [notes, setNotes] = useState<Note[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEffect | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const canvasSize = engine.getCanvasSize();
  const hitLineY = engine.getHitLineY();
  const laneWidth = engine.getLaneWidth();

  const handleGameLoop = useCallback((deltaTime: number) => {
    engine.tick(deltaTime);
    const state = engine.getState();
    setScore(state.score);
    setCombo(state.combo);
    setMaxCombo(state.maxCombo);
    setAccuracy(engine.getAccuracy());
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
    setFeedback(null);
  }, []);

  const handleTap = useCallback((lane: number) => {
    if (gameState !== 'playing') return;
    const result = engine.handleTap(lane);
    if (result.result !== 'miss' || true) {
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
      }, 500);
    }
  }, [gameState]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing') return;
    const keyMap: Record<string, number> = {
      '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,
      'a': 0, 's': 1, 'd': 2, 'f': 3, 'g': 4,
      'A': 0, 'S': 1, 'D': 2, 'F': 3, 'G': 4,
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
        color: NEON_COLORS.primary,
        textShadow: `0 0 20px ${NEON_COLORS.primary}, 0 0 40px ${NEON_COLORS.primary}`,
        marginBottom: '10px',
      }}>
        RhythmMaster
      </h1>
      <h2 style={{
        fontSize: '24px',
        color: NEON_COLORS.secondary,
        textShadow: `0 0 10px ${NEON_COLORS.secondary}`,
        marginBottom: '50px',
      }}>
        节奏大师
      </h2>
      <button
        onClick={startGame}
        style={{
          padding: '15px 50px',
          fontSize: '24px',
          background: `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
          border: 'none',
          borderRadius: '10px',
          color: NEON_COLORS.background,
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: `0 0 30px ${NEON_COLORS.primary}`,
          transition: 'transform 0.2s',
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        开始游戏
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
        <p>按键说明: 1-5 或 A-G</p>
        <p>在音符到达底线时按下对应键</p>
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
        background: `linear-gradient(180deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)`,
        borderRadius: '10px',
        overflow: 'hidden',
      }}>
        {/* Lane dividers */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i + 1) * laneWidth}px`,
              top: 0,
              width: '2px',
              height: '100%',
              background: `${NEON_COLORS.primary}33`,
            }}
          />
        ))}

        {/* Hit line */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: hitLineY,
          width: '100%',
          height: '4px',
          background: `linear-gradient(90deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
          boxShadow: `0 0 20px ${NEON_COLORS.primary}`,
        }} />

        {/* Notes */}
        {notes.filter(n => !n.hit).map(note => (
          <div
            key={note.id}
            onClick={() => handleTap(note.lane)}
            style={{
              position: 'absolute',
              left: note.lane * laneWidth + 10,
              top: note.y,
              width: laneWidth - 20,
              height: '40px',
              background: `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
              borderRadius: '8px',
              boxShadow: `0 0 15px ${NEON_COLORS.primary}`,
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
              background: `radial-gradient(ellipse at center, ${note.timing === 'perfect' ? NEON_COLORS.perfect : note.timing === 'great' ? NEON_COLORS.great : note.timing === 'good' ? NEON_COLORS.good : NEON_COLORS.miss}66 0%, transparent 70%)`,
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
        textShadow: `0 0 10px ${NEON_COLORS.primary}`,
      }}>
        <div>分数: {score}</div>
        <div>连击: {combo} x{Math.min(1 + Math.floor(combo / 10) * 0.1, 2).toFixed(1)}</div>
        <div>准确: {accuracy}%</div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '36px',
          fontWeight: 'bold',
          color: feedback.color,
          textShadow: `0 0 30px ${feedback.color}`,
          animation: 'pulse 0.3s ease-out',
        }}>
          {feedback.text}
        </div>
      )}

      {/* Touch areas */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100px',
        display: 'flex',
      }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            onClick={() => handleTap(i)}
            style={{
              flex: 1,
              border: `2px solid ${NEON_COLORS.primary}44`,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '10px',
              color: NEON_COLORS.textDim,
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            {['1', '2', '3', '4', '5'][i]}
          </div>
        ))}
      </div>
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
        color: NEON_COLORS.danger,
        textShadow: `0 0 20px ${NEON_COLORS.danger}`,
        marginBottom: '30px',
      }}>
        游戏结束
      </h1>
      <div style={{
        background: `${NEON_COLORS.surface}dd`,
        borderRadius: '15px',
        padding: '30px 50px',
        marginBottom: '30px',
        boxShadow: `0 0 30px ${NEON_COLORS.primary}44`,
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
      </div>
      <button
        onClick={startGame}
        style={{
          padding: '15px 50px',
          fontSize: '24px',
          background: `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
          border: 'none',
          borderRadius: '10px',
          color: NEON_COLORS.background,
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: `0 0 30px ${NEON_COLORS.primary}`,
          marginBottom: '15px',
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
      background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #16162a 100%)`,
    }}>
      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
        }
      `}</style>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'gameover' && renderGameOver()}
    </div>
  );
}
