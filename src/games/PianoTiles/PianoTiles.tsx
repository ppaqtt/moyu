import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PianoTilesEngine, Tile } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { useGameLoop } from '../../hooks/useGameLoop';

const engine = new PianoTilesEngine();

interface FeedbackEffect {
  text: string;
  color: string;
  time: number;
}

export default function PianoTiles() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [level, setLevel] = useState(1);
  const [stats, setStats] = useState({ perfect: 0, great: 0, good: 0, miss: 0 });
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEffect | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const canvasSize = engine.getCanvasSize();
  const hitLineY = engine.getHitLineY();
  const tileWidth = engine.getTileWidth();
  const numLanes = engine.getNumLanes();

  const handleGameLoop = useCallback((deltaTime: number) => {
    engine.tick(deltaTime);
    const state = engine.getState();
    setScore(state.score);
    setCombo(state.combo);
    setMaxCombo(state.maxCombo);
    setAccuracy(engine.getAccuracy());
    setLevel(engine.getLevel());
    setStats({
      perfect: state.perfectCount,
      great: state.greatCount,
      good: state.goodCount,
      miss: state.missCount,
    });
    setTiles([...state.tiles]);

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
    setLevel(1);
    setStats({ perfect: 0, great: 0, good: 0, miss: 0 });
    setTiles([]);
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
      wrong: NEON_COLORS.danger,
    };
    const textMap: Record<string, string> = {
      perfect: 'PERFECT!',
      great: 'GREAT!',
      good: 'GOOD!',
      miss: 'MISS!',
      wrong: 'WRONG!',
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
    const keyMap: Record<string, number> = {
      '1': 0, '2': 1, '3': 2, '4': 3,
      'a': 0, 's': 1, 'd': 2, 'f': 3,
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

  const laneColors = ['#ff4466', '#44ff66', '#6644ff', '#ffaa22'];

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
        color: NEON_COLORS.text,
        textShadow: `0 0 20px ${NEON_COLORS.text}, 0 0 40px ${NEON_COLORS.text}`,
        marginBottom: '10px',
      }}>
        Piano Tiles
      </h1>
      <h2 style={{
        fontSize: '24px',
        color: laneColors[0],
        textShadow: `0 0 10px ${laneColors[0]}`,
        marginBottom: '50px',
      }}>
        钢琴块
      </h2>
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '50px',
      }}>
        {laneColors.map((color, i) => (
          <div key={i} style={{
            width: '60px',
            height: '100px',
            background: color,
            borderRadius: '8px',
            boxShadow: `0 0 20px ${color}`,
          }} />
        ))}
      </div>
      <button
        onClick={startGame}
        style={{
          padding: '15px 50px',
          fontSize: '24px',
          background: `linear-gradient(135deg, ${laneColors[0]}, ${laneColors[1]})`,
          border: 'none',
          borderRadius: '10px',
          color: NEON_COLORS.text,
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: `0 0 30px ${laneColors[0]}`,
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
        <p>按键说明: 1-4 或 A-D</p>
        <p>点击黑色方块，避开白色区域</p>
      </div>
    </div>
  );

  const renderGame = () => (
    <div style={{ position: 'relative', width: canvasSize.width, height: canvasSize.height }}>
      {/* Background with lane colors */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: `linear-gradient(180deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)`,
        borderRadius: '10px',
        overflow: 'hidden',
      }}>
        {/* Lane backgrounds */}
        {[...Array(numLanes)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i * tileWidth,
              top: 0,
              width: tileWidth,
              height: '100%',
              background: laneColors[i] + '11',
            }}
          />
        ))}

        {/* Lane dividers */}
        {[...Array(numLanes - 1)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i + 1) * tileWidth - 1}px`,
              top: 0,
              width: '2px',
              height: '100%',
              background: `${NEON_COLORS.textDim}44`,
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
          background: `linear-gradient(90deg, ${laneColors[0]}, ${laneColors[1]}, ${laneColors[2]}, ${laneColors[3]})`,
          boxShadow: `0 0 20px ${NEON_COLORS.primary}`,
        }} />

        {/* Tiles */}
        {tiles.filter(t => !t.hit).map(tile => (
          <div
            key={tile.id}
            onClick={() => handleTap(tile.lane)}
            style={{
              position: 'absolute',
              left: tile.lane * tileWidth,
              top: tile.y,
              width: tileWidth,
              height: '80px',
              background: laneColors[tile.lane],
              boxShadow: `0 0 15px ${laneColors[tile.lane]}`,
              cursor: 'pointer',
              borderRadius: '0',
            }}
          />
        ))}

        {/* Hit effects */}
        {tiles.filter(t => t.hit && t.hitTime && Date.now() - t.hitTime < 300).map(tile => (
          <div
            key={`hit-${tile.id}`}
            style={{
              position: 'absolute',
              left: tile.lane * tileWidth,
              top: hitLineY - 50,
              width: tileWidth,
              height: '100px',
              background: `radial-gradient(ellipse at center, ${tile.timing === 'perfect' ? NEON_COLORS.perfect : tile.timing === 'great' ? NEON_COLORS.great : tile.timing === 'good' ? NEON_COLORS.good : NEON_COLORS.miss}66 0%, transparent 70%)`,
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
        fontSize: '16px',
        fontWeight: 'bold',
        textShadow: `0 0 10px ${NEON_COLORS.background}`,
      }}>
        <div>分数: {score}</div>
        <div>关卡: {level}</div>
        <div>连击: {combo}</div>
      </div>

      {/* Accuracy */}
      <div style={{
        position: 'absolute',
        top: '35px',
        left: '10px',
        color: NEON_COLORS.success,
        fontSize: '14px',
        textShadow: `0 0 10px ${NEON_COLORS.background}`,
      }}>
        准确: {accuracy}%
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '32px',
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
        {[...Array(numLanes)].map((_, i) => (
          <div
            key={i}
            onClick={() => handleTap(i)}
            style={{
              flex: 1,
              border: `2px solid ${laneColors[i]}44`,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '10px',
              color: laneColors[i] + '88',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            {['1', '2', '3', '4'][i]}
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
        boxShadow: `0 0 30px ${laneColors[0]}44`,
      }}>
        <div style={{ fontSize: '28px', marginBottom: '20px', color: laneColors[1] }}>
          最终得分: {score}
        </div>
        <div style={{ fontSize: '20px', marginBottom: '10px' }}>
          最高关卡: <span style={{ color: laneColors[2] }}>{level}</span>
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
          background: `linear-gradient(135deg, ${laneColors[0]}, ${laneColors[1]})`,
          border: 'none',
          borderRadius: '10px',
          color: NEON_COLORS.text,
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: `0 0 30px ${laneColors[0]}`,
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
