import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DJMixerEngine, Sample, BeatSlot } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { useGameLoop } from '../../hooks/useGameLoop';

const engine = new DJMixerEngine();

interface FeedbackEffect {
  text: string;
  color: string;
  time: number;
}

export default function DJMixer() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [stats, setStats] = useState({ perfect: 0, great: 0, good: 0, miss: 0 });
  const [samples, setSamples] = useState<Sample[]>([]);
  const [beatGrid, setBeatGrid] = useState<BeatSlot[]>([]);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackEffect | null>(null);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const canvasSize = engine.getCanvasSize();
  const gridSize = engine.getGridSize();

  const showFeedback = useCallback((result: string, color: string) => {
    const textMap: Record<string, string> = {
      perfect: 'PERFECT!',
      great: 'GREAT!',
      good: 'GOOD!',
      miss: 'MISS!',
    };
    setFeedback({ text: textMap[result] || result, color, time: Date.now() });
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
    }, 400);
  }, []);

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
    setSamples([...state.samples]);
    setBeatGrid([...state.beatGrid]);
    setCurrentBeat(state.currentBeat);

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
    setSelectedSample(null);
    setFeedback(null);
  }, []);

  const handleSampleClick = useCallback((sampleId: string) => {
    if (gameState !== 'playing') return;
    setSelectedSample(selectedSample === sampleId ? null : sampleId);
  }, [gameState, selectedSample]);

  const handleGridClick = useCallback((gridIndex: number) => {
    if (gameState !== 'playing') return;
    
    if (selectedSample) {
      const result = engine.placeSample(selectedSample, gridIndex);
      const colorMap: Record<string, string> = {
        perfect: NEON_COLORS.perfect,
        great: NEON_COLORS.great,
        good: NEON_COLORS.good,
        miss: NEON_COLORS.miss,
      };
      showFeedback(result.result, colorMap[result.result]);
      setSelectedSample(null);
    } else {
      // Hit the beat
      const col = gridIndex % gridSize.cols;
      const result = engine.hitBeat(col);
      const colorMap: Record<string, string> = {
        perfect: NEON_COLORS.perfect,
        great: NEON_COLORS.great,
        good: NEON_COLORS.good,
        miss: NEON_COLORS.miss,
      };
      showFeedback(result.result, colorMap[result.result]);
    }
  }, [gameState, selectedSample, gridSize.cols, showFeedback]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing') return;
    const keyMap: Record<string, number> = {
      '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7,
      'q': 8, 'w': 9, 'e': 10, 'r': 11, 't': 12, 'y': 13, 'u': 14, 'i': 15,
      'a': 16, 's': 17, 'd': 18, 'f': 19, 'g': 20, 'h': 21, 'j': 22, 'k': 23,
      'z': 24, 'x': 25, 'c': 26, 'v': 27, 'b': 28, 'n': 29, 'm': 30, ',': 31,
    };
    const index = keyMap[e.key.toLowerCase()];
    if (index !== undefined) {
      handleGridClick(index);
    }
  }, [gameState, handleGridClick]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  const cellWidth = 50;
  const cellHeight = 60;
  const gridOffsetX = 120;
  const gridOffsetY = 50;

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
        color: NEON_COLORS.secondary,
        textShadow: `0 0 20px ${NEON_COLORS.secondary}, 0 0 40px ${NEON_COLORS.secondary}`,
        marginBottom: '10px',
      }}>
        DJMixer
      </h1>
      <h2 style={{
        fontSize: '24px',
        color: NEON_COLORS.primary,
        textShadow: `0 0 10px ${NEON_COLORS.primary}`,
        marginBottom: '50px',
      }}>
        DJ混音大师
      </h2>
      <button
        onClick={startGame}
        style={{
          padding: '15px 50px',
          fontSize: '24px',
          background: `linear-gradient(135deg, ${NEON_COLORS.secondary}, ${NEON_COLORS.primary})`,
          border: 'none',
          borderRadius: '10px',
          color: NEON_COLORS.text,
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: `0 0 30px ${NEON_COLORS.secondary}`,
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
        <p>拖放音样到节拍网格</p>
        <p>按数字键1-8触发节拍</p>
      </div>
    </div>
  );

  const renderGame = () => (
    <div style={{ position: 'relative' }}>
      {/* HUD */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        color: NEON_COLORS.text,
        fontSize: '18px',
        fontWeight: 'bold',
        textShadow: `0 0 10px ${NEON_COLORS.primary}`,
      }}>
        <div>分数: {score}</div>
        <div>连击: {combo}</div>
        <div>准确: {accuracy}%</div>
      </div>

      {/* Sample palette */}
      <div style={{
        position: 'absolute',
        left: 10,
        top: gridOffsetY,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {samples.map((sample, i) => (
          <div
            key={sample.id}
            onClick={() => handleSampleClick(sample.id)}
            style={{
              width: '100px',
              height: cellHeight - 8,
              background: selectedSample === sample.id
                ? `linear-gradient(135deg, ${sample.color}, ${NEON_COLORS.surface})`
                : `${sample.color}88`,
              border: selectedSample === sample.id
                ? `3px solid ${NEON_COLORS.text}`
                : `2px solid ${sample.color}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: NEON_COLORS.text,
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: selectedSample === sample.id ? `0 0 20px ${sample.color}` : `0 0 10px ${sample.color}44`,
              transition: 'all 0.2s',
            }}
          >
            {sample.name}
          </div>
        ))}
      </div>

      {/* Beat grid */}
      <div style={{
        position: 'absolute',
        left: gridOffsetX,
        top: gridOffsetY,
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize.cols}, ${cellWidth}px)`,
        gridTemplateRows: `repeat(${gridSize.rows}, ${cellHeight}px)`,
        gap: '4px',
      }}>
        {beatGrid.map((slot, i) => {
          const col = i % gridSize.cols;
          const isCurrentBeat = col === currentBeat;
          return (
            <div
              key={slot.id}
              onClick={() => handleGridClick(i)}
              style={{
                background: isCurrentBeat
                  ? `${NEON_COLORS.primary}44`
                  : `${NEON_COLORS.surface}`,
                border: isCurrentBeat
                  ? `2px solid ${NEON_COLORS.primary}`
                  : `1px solid ${NEON_COLORS.surface}`,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.1s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {slot.sample && (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: `${slot.sample.color}aa`,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: NEON_COLORS.text,
                  fontWeight: 'bold',
                  boxShadow: `0 0 15px ${slot.sample.color}`,
                }}>
                  {slot.sample.name.slice(0, 3)}
                </div>
              )}
              {slot.hit && slot.hitTime && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(circle, ${NEON_COLORS.success}66 0%, transparent 70%)`,
                  animation: 'fadeOut 0.3s ease-out forwards',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Beat indicators */}
      <div style={{
        position: 'absolute',
        left: gridOffsetX,
        top: gridOffsetY + gridSize.rows * cellHeight + 10,
        display: 'flex',
        gap: '4px',
      }}>
        {[...Array(gridSize.cols)].map((_, i) => (
          <div
            key={i}
            style={{
              width: cellWidth,
              height: '20px',
              background: i === currentBeat ? NEON_COLORS.primary : `${NEON_COLORS.surface}`,
              borderRadius: '4px',
              boxShadow: i === currentBeat ? `0 0 15px ${NEON_COLORS.primary}` : 'none',
              transition: 'all 0.1s',
            }}
          />
        ))}
      </div>

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        left: gridOffsetX,
        top: gridOffsetY + gridSize.rows * cellHeight + 40,
        color: NEON_COLORS.textDim,
        fontSize: '12px',
      }}>
        按 1-8 键触发当前节拍的音样
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{
          position: 'absolute',
          top: '50%',
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

      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
        }
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
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
        color: NEON_COLORS.secondary,
        textShadow: `0 0 20px ${NEON_COLORS.secondary}`,
        marginBottom: '30px',
      }}>
        混音完成
      </h1>
      <div style={{
        background: `${NEON_COLORS.surface}dd`,
        borderRadius: '15px',
        padding: '30px 50px',
        marginBottom: '30px',
        boxShadow: `0 0 30px ${NEON_COLORS.secondary}44`,
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
          background: `linear-gradient(135deg, ${NEON_COLORS.secondary}, ${NEON_COLORS.primary})`,
          border: 'none',
          borderRadius: '10px',
          color: NEON_COLORS.text,
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: `0 0 30px ${NEON_COLORS.secondary}`,
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
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && (
        <div style={{
          width: canvasSize.width,
          height: canvasSize.height + 100,
          background: `${NEON_COLORS.surface}cc`,
          borderRadius: '15px',
          padding: '20px',
          position: 'relative',
        }}>
          {renderGame()}
        </div>
      )}
      {gameState === 'gameover' && renderGameOver()}
    </div>
  );
}
