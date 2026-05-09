import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimalMatchEngine, AnimalPiece, Particle } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const ANIMAL_DATA = [
  { emoji: '🐱', color: '#ff9f43', name: 'cat' },
  { emoji: '🐶', color: '#54a0ff', name: 'dog' },
  { emoji: '🐰', color: '#ff6b9d', name: 'bunny' },
  { emoji: '🐼', color: '#576574', name: 'panda' },
  { emoji: '🦊', color: '#ff6b6b', name: 'fox' },
  { emoji: '🐸', color: '#1dd1a1', name: 'frog' },
];

const AnimalMatch: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AnimalMatchEngine | null>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(30);
  const [level, setLevel] = useState(1);

  const initGame = useCallback(() => {
    engineRef.current = new AnimalMatchEngine();
    engineRef.current.init();
    const state = engineRef.current.getState();
    setScore(state.score);
    setMoves(state.moves);
    setLevel(state.level);
    setGameState('playing');
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cellSize = 60;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    engineRef.current.handleClick(row, col);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (engineRef.current) {
        engineRef.current.tick(deltaTime);
        const state = engineRef.current.getState();
        
        if (state.score !== score) setScore(state.score);
        if (state.moves !== moves) setMoves(state.moves);
        if (state.level !== level) setLevel(state.level);
        if (state.gameOver && gameState === 'playing') {
          setGameState('gameover');
        }

        // Clear canvas with sky gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, 480);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#98D8C8');
        gradient.addColorStop(1, '#7FDBFF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 480, 480);

        // Draw grass at bottom
        ctx.fillStyle = '#7CB342';
        ctx.fillRect(0, 440, 480, 40);
        
        // Grass detail
        ctx.fillStyle = '#8BC34A';
        for (let i = 0; i < 480; i += 8) {
          ctx.beginPath();
          ctx.moveTo(i, 440);
          ctx.lineTo(i + 4, 430);
          ctx.lineTo(i + 8, 440);
          ctx.fill();
        }

        // Draw cloud decorations
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        drawCloud(ctx, 50, 50, 30);
        drawCloud(ctx, 150, 80, 25);
        drawCloud(ctx, 350, 40, 35);
        drawCloud(ctx, 420, 90, 20);

        // Draw grid area with soft background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(0, 0, 480, 430);

        // Draw pieces
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const piece = state.grid[row][col];
            if (piece) {
              drawAnimal(ctx, piece, piece.row === state.selectedPiece?.row && piece.col === state.selectedPiece?.col);
            }
          }
        }

        // Draw particles
        for (const particle of state.particles) {
          drawParticle(ctx, particle);
        }

        // Draw score popup
        if (state.scorePopup) {
          ctx.save();
          ctx.globalAlpha = state.scorePopup.life / 800;
          ctx.fillStyle = '#ffd700';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 3;
          ctx.strokeText(`+${state.scorePopup.value}`, state.scorePopup.x, state.scorePopup.y);
          ctx.fillText(`+${state.scorePopup.value}`, state.scorePopup.x, state.scorePopup.y);
          ctx.restore();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, score, moves, level]);

  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
    ctx.arc(x + size * 1.5, y, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y + size * 0.3, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawAnimal = (ctx: CanvasRenderingContext2D, piece: AnimalPiece, isSelected: boolean) => {
    const x = piece.x + 30;
    const y = piece.y + 30;
    const bounceOffset = Math.sin(piece.bouncePhase) * 3;
    const baseSize = 22 * piece.scale;
    const animal = ANIMAL_DATA[piece.type];

    ctx.save();
    ctx.globalAlpha = piece.alpha;
    ctx.translate(x, y + bounceOffset);

    // Selection glow
    if (isSelected) {
      ctx.shadowColor = animal.color;
      ctx.shadowBlur = 20;
    }

    // Background circle
    const bgGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseSize + 5);
    bgGradient.addColorStop(0, lightenColor(animal.color, 30));
    bgGradient.addColorStop(1, animal.color);
    
    ctx.beginPath();
    ctx.arc(0, 0, baseSize + 5, 0, Math.PI * 2);
    ctx.fillStyle = bgGradient;
    ctx.fill();

    // Border
    ctx.strokeStyle = darkenColor(animal.color, 20);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw emoji
    ctx.font = `${baseSize * 1.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(animal.emoji, 0, 2);

    ctx.restore();

    // Special piece indicator
    if (piece.isSpecial) {
      ctx.save();
      ctx.translate(x, y + bounceOffset);
      
      // Sparkle ring
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, baseSize + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Special symbol background
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (piece.specialType === 'explosion') {
        ctx.fillText('💥', 0, 1);
      } else if (piece.specialType === 'lightning') {
        ctx.fillText('⚡', 0, 1);
      } else if (piece.specialType === 'star') {
        ctx.fillText('⭐', 0, 1);
      } else if (piece.specialType === 'magic') {
        ctx.fillText('🌟', 0, 1);
      }
      
      ctx.restore();
    }
  };

  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.save();
    ctx.globalAlpha = particle.life / particle.maxLife;

    if (particle.type === 'star') {
      drawStar(ctx, particle.x, particle.y, 5, particle.size, particle.size / 2, particle.color);
    } else if (particle.type === 'sparkle') {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (particle.life / particle.maxLife), 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  };

  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: string) => {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  const lightenColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `rgb(${R}, ${G}, ${B})`;
  };

  const darkenColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `rgb(${R}, ${G}, ${B})`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: `linear-gradient(135deg, #87CEEB 0%, #98D8C8 100%)`,
      fontFamily: "'Microsoft YaHei', 'PingFang SC', sans-serif",
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '480px',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255, 255, 255, 0.3)',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 20px',
            color: NEON_COLORS.primary,
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
        >
          ← 返回
        </button>
        <h1 style={{
          color: NEON_COLORS.primary,
          fontSize: '28px',
          margin: 0,
          textShadow: `0 2px 10px rgba(255, 255, 255, 0.5)`
        }}>
          动物消消乐
        </h1>
        <div style={{ width: '80px' }} />
      </div>

      {/* Game Area */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: `0 10px 40px rgba(0, 0, 0, 0.2), 0 0 60px rgba(135, 206, 235, 0.3)`
      }}>
        {/* HUD */}
        {gameState === 'playing' && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginBottom: '15px',
            padding: '12px',
            background: 'linear-gradient(135deg, rgba(135, 206, 235, 0.2) 0%, rgba(152, 216, 200, 0.2) 100%)',
            borderRadius: '10px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ff9f43', fontSize: '12px' }}>分数</div>
              <div style={{ color: NEON_COLORS.primary, fontSize: '22px', fontWeight: 'bold' }}>{score}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ff6b9d', fontSize: '12px' }}>关卡</div>
              <div style={{ color: NEON_COLORS.primary, fontSize: '22px', fontWeight: 'bold' }}>{level}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#54a0ff', fontSize: '12px' }}>剩余步数</div>
              <div style={{ color: NEON_COLORS.primary, fontSize: '22px', fontWeight: 'bold' }}>{moves}</div>
            </div>
          </div>
        )}

        {/* Canvas Container */}
        <div style={{
          position: 'relative',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: `inset 0 0 30px rgba(0, 0, 0, 0.1)`
        }}>
          <canvas
            ref={canvasRef}
            width={480}
            height={480}
            onClick={handleCanvasClick}
            style={{
              display: 'block',
              cursor: gameState === 'playing' ? 'pointer' : 'default'
            }}
          />

          {/* Menu Overlay */}
          {gameState === 'menu' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, rgba(135, 206, 235, 0.97) 0%, rgba(152, 216, 200, 0.97) 100%)`,
              borderRadius: '10px'
            }}>
              <div style={{
                fontSize: '64px',
                marginBottom: '20px',
                animation: 'hop 1s ease-in-out infinite'
              }}>
                🐱🐶🐰
              </div>
              <div style={{
                fontSize: '48px',
                marginBottom: '10px'
              }}>
                🦊🐼🐸
              </div>
              <h2 style={{
                color: NEON_COLORS.primary,
                fontSize: '36px',
                marginBottom: '10px',
                textShadow: `0 2px 10px rgba(255, 255, 255, 0.5)`
              }}>
                动物消消乐
              </h2>
              <p style={{
                color: 'rgba(15, 15, 26, 0.7)',
                fontSize: '16px',
                marginBottom: '30px',
                textAlign: 'center',
                padding: '0 40px'
              }}>
                可爱的小动物们等着你来配对！<br/>
                匹配3个或更多相同动物获得高分！
              </p>
              <button
                onClick={initGame}
                style={{
                  background: `linear-gradient(135deg, #ff9f43 0%, #ff6b9d 100%)`,
                  border: 'none',
                  borderRadius: '30px',
                  padding: '15px 50px',
                  color: NEON_COLORS.white,
                  fontSize: '20px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: `0 5px 25px rgba(255, 159, 67, 0.5)`,
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 8px 35px rgba(255, 159, 67, 0.7)`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = `0 5px 25px rgba(255, 159, 67, 0.5)`;
                }}
              >
                开始游戏
              </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameState === 'gameover' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, rgba(135, 206, 235, 0.95) 0%, rgba(152, 216, 200, 0.95) 100%)`,
              borderRadius: '10px'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
              <h2 style={{
                color: '#ff6b9d',
                fontSize: '36px',
                marginBottom: '10px',
                textShadow: `0 2px 10px rgba(255, 255, 255, 0.5)`
              }}>
                游戏结束
              </h2>
              <p style={{
                color: NEON_COLORS.primary,
                fontSize: '18px',
                marginBottom: '10px'
              }}>
                可爱的动物们很开心！
              </p>
              <p style={{
                color: '#ff9f43',
                fontSize: '48px',
                fontWeight: 'bold',
                marginBottom: '30px',
                textShadow: `0 2px 10px rgba(255, 255, 255, 0.5)`
              }}>
                {score}
              </p>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  onClick={initGame}
                  style={{
                    background: `linear-gradient(135deg, #1dd1a1 0%, #54a0ff 100%)`,
                    border: 'none',
                    borderRadius: '30px',
                    padding: '15px 40px',
                    color: NEON_COLORS.white,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: `0 5px 20px rgba(29, 209, 161, 0.4)`,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  再来一局
                </button>
                <button
                  onClick={() => navigate(-1)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.3)',
                    border: '2px solid rgba(15, 15, 26, 0.2)',
                    borderRadius: '30px',
                    padding: '15px 40px',
                    color: NEON_COLORS.primary,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                >
                  返回
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        {gameState === 'playing' && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            background: 'linear-gradient(135deg, rgba(135, 206, 235, 0.2) 0%, rgba(152, 216, 200, 0.2) 100%)',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <p style={{
              color: 'rgba(15, 15, 26, 0.7)',
              fontSize: '12px',
              margin: 0
            }}>
              💡 点击动物选中，再点击相邻动物交换<br/>
              匹配4个以上可获得特殊动物
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes hop {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default AnimalMatch;
