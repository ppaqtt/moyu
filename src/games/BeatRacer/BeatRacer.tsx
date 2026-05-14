import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BeatRacerEngine, Obstacle, BeatMarker } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { useGameLoop } from '../../hooks/useGameLoop';

const engine = new BeatRacerEngine();

interface FeedbackEffect {
  text: string;
  color: string;
  time: number;
}

export default function BeatRacer() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [stats, setStats] = useState({ perfect: 0, great: 0, good: 0, miss: 0 });
  const [carX, setCarX] = useState(0);
  const [carY, setCarY] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [beatMarkers, setBeatMarkers] = useState<BeatMarker[]>([]);
  const [distance, setDistance] = useState(0);
  const [speedPercentage, setSpeedPercentage] = useState(100);
  const [feedback, setFeedback] = useState<FeedbackEffect | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const canvasSize = engine.getCanvasSize();
  const carSize = engine.getCarSize();
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
    setCarX(state.carX);
    setCarY(state.carY);
    setObstacles([...state.obstacles]);
    setBeatMarkers([...state.beatMarkers]);
    setDistance(state.distance);
    setSpeedPercentage(engine.getSpeedPercentage());

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
    setBeatMarkers([]);
    setObstacles([]);
    setDistance(0);
    setSpeedPercentage(100);
    setFeedback(null);
  }, []);

  const handleTap = useCallback(() => {
    if (gameState !== 'playing') return;
    const result = engine.handleTap();
    const colorMap: Record<string, string> = {
      perfect: NEON_COLORS.perfect,
      great: NEON_COLORS.great,
      good: NEON_COLORS.good,
      miss: NEON_COLORS.miss,
    };
    const textMap: Record<string, string> = {
      perfect: 'BOOST!',
      great: 'GO!',
      good: 'OK',
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
    if (gameState !== 'playing') return;
    if (e.key === ' ' || e.key === 'Enter') {
      handleTap();
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      engine.handleLaneChange('left');
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      engine.handleLaneChange('right');
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
        color: NEON_COLORS.accent,
        textShadow: `0 0 20px ${NEON_COLORS.accent}, 0 0 40px ${NEON_COLORS.accent}`,
        marginBottom: '10px',
      }}>
        Beat Racer
      </h1>
      <h2 style={{
        fontSize: '24px',
        color: NEON_COLORS.warning,
        textShadow: `0 0 10px ${NEON_COLORS.warning}`,
        marginBottom: '50px',
      }}>
        节拍赛车
      </h2>
      <button
        onClick={startGame}
        style={{
          padding: '15px 50px',
          fontSize: '24px',
          background: `linear-gradient(135deg, ${NEON_COLORS.accent}, ${NEON_COLORS.warning})`,
          border: 'none',
          borderRadius: '10px',
          color: NEON_COLORS.background,
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: `0 0 30px ${NEON_COLORS.accent}`,
        }}
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
        <p>空格/Enter - 节拍加速</p>
        <p>方向键/A,D - 切换车道</p>
      </div>
    </div>
  );

  const renderGame = () => (
    <div style={{ position: 'relative', width: canvasSize.width, height: canvasSize.height }}>
      {/* Background - Road */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: `linear-gradient(180deg, #1a1a2e 0%, #0a0a15 100%)`,
        borderRadius: '10px',
        overflow: 'hidden',
      }}>
        {/* Road */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          background: '#222',
        }}>
          {/* Lane dividers */}
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${(i + 1) * laneWidth}px`,
                top: 0,
                width: '4px',
                height: '100%',
                background: ` repeating-linear-gradient(
                  to bottom,
                  ${NEON_COLORS.warning} 0px,
                  ${NEON_COLORS.warning} 30px,
                  transparent 30px,
                  transparent 60px
                )`,
                opacity: 0.5,
              }}
            />
          ))}

          {/* Road edges */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '4px',
            height: '100%',
            background: NEON_COLORS.text,
          }} />
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '4px',
            height: '100%',
            background: NEON_COLORS.text,
          }} />
        </div>

        {/* Speed lines */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `repeating-linear-gradient(
            180deg,
            transparent 0px,
            transparent ${Math.max(10, 50 - speedPercentage / 5)}px,
            rgba(255,255,255,0.03) ${Math.max(10, 50 - speedPercentage / 5)}px,
            rgba(255,255,255,0.03) ${Math.max(10, 52 - speedPercentage / 5)}px
          )`,
          pointerEvents: 'none',
        }} />

        {/* Beat markers */}
        {beatMarkers.filter(m => !m.hit).map(marker => (
          <div
            key={marker.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: marker.y,
              width: '100px',
              height: '8px',
              marginLeft: '-50px',
              background: `linear-gradient(90deg, transparent, ${NEON_COLORS.accent}, transparent)`,
              boxShadow: `0 0 20px ${NEON_COLORS.accent}`,
              borderRadius: '4px',
            }}
          />
        ))}

        {/* Hit effects for beat markers */}
        {beatMarkers.filter(m => m.hit && m.hitTime && Date.now() - m.hitTime < 300).map(marker => (
          <div
            key={`hit-${marker.id}`}
            style={{
              position: 'absolute',
              left: '50%',
              top: marker.y - 50,
              width: '200px',
              height: '100px',
              marginLeft: '-100px',
              background: `radial-gradient(ellipse at center, ${
                marker.timing === 'perfect' ? NEON_COLORS.perfect :
                marker.timing === 'great' ? NEON_COLORS.great :
                marker.timing === 'good' ? NEON_COLORS.good : NEON_COLORS.miss
              }66 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Obstacles */}
        {obstacles.map(obstacle => (
          <div
            key={obstacle.id}
            style={{
              position: 'absolute',
              left: obstacle.x,
              top: obstacle.y,
              width: obstacle.width,
              height: obstacle.height,
              background: obstacle.type === 'rock' ? '#555' :
                         obstacle.type === 'car' ? '#aa3333' : '#884422',
              borderRadius: '8px',
              boxShadow: `0 0 15px ${NEON_COLORS.danger}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            {obstacle.type === 'rock' ? '🪨' : obstacle.type === 'car' ? '🚗' : '⚠️'}
          </div>
        ))}

        {/* Car */}
        <div
          style={{
            position: 'absolute',
            left: carX,
            top: carY,
            width: carSize.width,
            height: carSize.height,
            background: `linear-gradient(180deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
            borderRadius: '15px 15px 5px 5px',
            boxShadow: `0 0 30px ${NEON_COLORS.primary}, 0 5px 0 ${NEON_COLORS.surface}`,
          }}
        >
          {/* Windshield */}
          <div style={{
            position: 'absolute',
            top: '15px',
            left: '10px',
            right: '10px',
            height: '25px',
            background: `${NEON_COLORS.surface}aa`,
            borderRadius: '5px 5px 0 0',
          }} />
          {/* Headlights */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            width: '15px',
            height: '10px',
            background: NEON_COLORS.accent,
            borderRadius: '3px',
            boxShadow: `0 0 15px ${NEON_COLORS.accent}`,
          }} />
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            width: '15px',
            height: '10px',
            background: NEON_COLORS.accent,
            borderRadius: '3px',
            boxShadow: `0 0 15px ${NEON_COLORS.accent}`,
          }} />
        </div>
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
        fontSize: '16px',
        fontWeight: 'bold',
        textShadow: `0 0 10px ${NEON_COLORS.background}`,
      }}>
        <div>分数: {score}</div>
        <div>连击: {combo}</div>
        <div>距离: {Math.floor(distance)}m</div>
      </div>

      {/* Speed indicator */}
      <div style={{
        position: 'absolute',
        top: '40px',
        left: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: speedPercentage > 150 ? NEON_COLORS.success : speedPercentage > 100 ? NEON_COLORS.accent : NEON_COLORS.warning,
        fontSize: '14px',
        textShadow: `0 0 10px ${NEON_COLORS.background}`,
      }}>
        <span>速度:</span>
        <div style={{
          width: '80px',
          height: '8px',
          background: `${NEON_COLORS.surface}`,
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.min(100, speedPercentage)}%`,
            height: '100%',
            background: speedPercentage > 150 ? NEON_COLORS.success : speedPercentage > 100 ? NEON_COLORS.accent : NEON_COLORS.warning,
            transition: 'width 0.1s',
          }} />
        </div>
        <span>{speedPercentage}%</span>
      </div>

      {/* Accuracy */}
      <div style={{
        position: 'absolute',
        top: '65px',
        left: '10px',
        color: NEON_COLORS.success,
        fontSize: '14px',
        textShadow: `0 0 10px ${NEON_COLORS.background}`,
      }}>
        准确: {accuracy}%
      </div>

      {/* Miss counter */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        color: stats.miss > 15 ? NEON_COLORS.danger : NEON_COLORS.warning,
        fontSize: '14px',
        textShadow: `0 0 10px ${NEON_COLORS.background}`,
      }}>
        失误: {stats.miss}/20
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

      {/* Tap area hint */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: NEON_COLORS.textDim,
        fontSize: '12px',
      }}>
        按 空格键 加速
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
        boxShadow: `0 0 30px ${NEON_COLORS.accent}44`,
      }}>
        <div style={{ fontSize: '28px', marginBottom: '20px', color: NEON_COLORS.accent }}>
          最终得分: {score}
        </div>
        <div style={{ fontSize: '20px', marginBottom: '10px' }}>
          行驶距离: <span style={{ color: NEON_COLORS.primary }}>{Math.floor(distance)}m</span>
        </div>
        <div style={{ fontSize: '20px', marginBottom: '10px' }}>
          最大连击: <span style={{ color: NEON_COLORS.success }}>{maxCombo}</span>
        </div>
        <div style={{ fontSize: '20px', marginBottom: '10px' }}>
          准确率: <span style={{ color: NEON_COLORS.great }}>{accuracy}%</span>
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
          background: `linear-gradient(135deg, ${NEON_COLORS.accent}, ${NEON_COLORS.warning})`,
          border: 'none',
          borderRadius: '10px',
          color: NEON_COLORS.background,
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: `0 0 30px ${NEON_COLORS.accent}`,
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
