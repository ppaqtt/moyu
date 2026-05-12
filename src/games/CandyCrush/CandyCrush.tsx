import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CandyCrushEngine, CandyPiece, Particle } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const CANDY_COLORS = [
  '#ff6b6b', // 红色糖果
  '#4ecdc4', // 青色糖果
  '#ffeaa7', // 黄色糖果
  '#a29bfe', // 紫色糖果
  '#fd79a8', // 粉色糖果
  '#00d2ff', // 蓝色糖果
];

const CandyCrush: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CandyCrushEngine | null>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(30);
  const [level, setLevel] = useState(1);

  const initGame = useCallback(() => {
    engineRef.current = new CandyCrushEngine();
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
        
        // Update state
        if (state.score !== score) setScore(state.score);
        if (state.moves !== moves) setMoves(state.moves);
        if (state.level !== level) setLevel(state.level);
        if (state.gameOver && gameState === 'playing') {
          setGameState('gameover');
        }

        // Clear canvas
        ctx.fillStyle = NEON_COLORS.primary;
        ctx.fillRect(0, 0, 480, 480);

        // Draw grid background
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 8; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 60, 0);
          ctx.lineTo(i * 60, 480);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i * 60);
          ctx.lineTo(480, i * 60);
          ctx.stroke();
        }

        // Draw pieces
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const piece = state.grid[row][col];
            if (piece) {
              drawCandy(ctx, piece, piece.row === state.selectedPiece?.row && piece.col === state.selectedPiece?.col);
            }
          }
        }

        // Draw particles
        for (const particle of state.particles) {
          drawParticle(ctx, particle);
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, score, moves, level]);

  const drawCandy = (ctx: CanvasRenderingContext2D, piece: CandyPiece, isSelected: boolean) => {
    const x = piece.x + 30;
    const y = piece.y + 30;
    const baseSize = 25 * piece.scale;
    const color = CANDY_COLORS[piece.type] || NEON_COLORS.neonPink;

    ctx.save();
    ctx.globalAlpha = piece.alpha;
    ctx.translate(x, y);

    // Selection glow
    if (isSelected) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
    }

    // Draw candy body (rounded square)
    const size = baseSize;
    const radius = size * 0.3;
    
    ctx.beginPath();
    ctx.moveTo(-size + radius, -size);
    ctx.lineTo(size - radius, -size);
    ctx.quadraticCurveTo(size, -size, size, -size + radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(-size + radius, size);
    ctx.quadraticCurveTo(-size, size, -size, size - radius);
    ctx.lineTo(-size, -size + radius);
    ctx.quadraticCurveTo(-size, -size, -size + radius, -size);
    ctx.closePath();

    // Gradient fill
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, lightenColor(color, 40));
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, darkenColor(color, 20));
    ctx.fillStyle = gradient;
    ctx.fill();

    // Shine effect
    ctx.beginPath();
    ctx.ellipse(-size * 0.3, -size * 0.3, size * 0.25, size * 0.15, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();

    // Special piece indicator
    if (piece.isSpecial) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, size + 5, 0, Math.PI * 2);
      ctx.stroke();

      // Special type symbol
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (piece.specialType === 'row') {
        ctx.fillText('═', 0, 0);
      } else if (piece.specialType === 'col') {
        ctx.fillText('║', 0, 0);
      } else if (piece.specialType === 'bomb') {
        ctx.fillText('★', 0, 0);
      }
    }

    ctx.restore();
  };

  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.save();
    ctx.globalAlpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * (particle.life / particle.maxLife), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
      background: `linear-gradient(135deg, ${NEON_COLORS.primary} 0%, ${NEON_COLORS.secondary} 100%)`,
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
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 20px',
            color: NEON_COLORS.white,
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          ← 返回
        </button>
        <h1 style={{
          color: NEON_COLORS.white,
          fontSize: '28px',
          margin: 0,
          textShadow: `0 0 20px ${NEON_COLORS.neonPink}`
        }}>
          糖果传奇
        </h1>
        <div style={{ width: '80px' }} />
      </div>

      {/* Game Area */}
      <div style={{
        background: NEON_COLORS.cardBg,
        borderRadius: '20px',
        padding: '20px',
        boxShadow: `0 10px 40px rgba(0, 0, 0, 0.3), 0 0 60px rgba(108, 92, 231, 0.2)`
      }}>
        {/* HUD */}
        {gameState === 'playing' && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginBottom: '15px',
            padding: '10px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: NEON_COLORS.neonCyan, fontSize: '14px' }}>分数</div>
              <div style={{ color: NEON_COLORS.white, fontSize: '24px', fontWeight: 'bold' }}>{score}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: NEON_COLORS.neonPurple, fontSize: '14px' }}>关卡</div>
              <div style={{ color: NEON_COLORS.white, fontSize: '24px', fontWeight: 'bold' }}>{level}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: NEON_COLORS.neonPink, fontSize: '14px' }}>剩余步数</div>
              <div style={{ color: NEON_COLORS.white, fontSize: '24px', fontWeight: 'bold' }}>{moves}</div>
            </div>
          </div>
        )}

        {/* Canvas Container */}
        <div style={{
          position: 'relative',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: `inset 0 0 20px rgba(0, 0, 0, 0.5)`
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
              background: `linear-gradient(135deg, rgba(15, 15, 26, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%)`,
              borderRadius: '10px'
            }}>
              <div style={{
                fontSize: '64px',
                marginBottom: '20px',
                animation: 'float 2s ease-in-out infinite'
              }}>
                🍬🍭🍩
              </div>
              <h2 style={{
                color: NEON_COLORS.white,
                fontSize: '36px',
                marginBottom: '10px',
                textShadow: `0 0 20px ${NEON_COLORS.neonPink}`
              }}>
                糖果传奇
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '16px',
                marginBottom: '30px',
                textAlign: 'center',
                padding: '0 40px'
              }}>
                滑动糖果，匹配三个或更多相同颜色<br/>
                触发连锁反应获得更高分数！
              </p>
              <button
                onClick={initGame}
                style={{
                  background: `linear-gradient(135deg, ${NEON_COLORS.neonPink} 0%, ${NEON_COLORS.neonPurple} 100%)`,
                  border: 'none',
                  borderRadius: '30px',
                  padding: '15px 50px',
                  color: NEON_COLORS.white,
                  fontSize: '20px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: `0 5px 20px rgba(255, 107, 157, 0.4)`,
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 8px 30px rgba(255, 107, 157, 0.6)`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = `0 5px 20px rgba(255, 107, 157, 0.4)`;
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
              background: `linear-gradient(135deg, rgba(15, 15, 26, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%)`,
              borderRadius: '10px'
            }}>
              <div style={{
                fontSize: '64px',
                marginBottom: '20px'
              }}>
                🎮
              </div>
              <h2 style={{
                color: NEON_COLORS.neonPink,
                fontSize: '36px',
                marginBottom: '10px',
                textShadow: `0 0 20px ${NEON_COLORS.neonPink}`
              }}>
                游戏结束
              </h2>
              <p style={{
                color: NEON_COLORS.white,
                fontSize: '24px',
                marginBottom: '10px'
              }}>
                最终分数
              </p>
              <p style={{
                color: NEON_COLORS.gold,
                fontSize: '48px',
                fontWeight: 'bold',
                marginBottom: '30px',
                textShadow: `0 0 20px ${NEON_COLORS.gold}`
              }}>
                {score}
              </p>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  onClick={initGame}
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonGreen} 0%, ${NEON_COLORS.neonCyan} 100%)`,
                    border: 'none',
                    borderRadius: '30px',
                    padding: '15px 40px',
                    color: NEON_COLORS.primary,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: `0 5px 20px rgba(57, 255, 20, 0.4)`,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  再来一局
                </button>
                <button
                  onClick={() => navigate(-1)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '30px',
                    padding: '15px 40px',
                    color: NEON_COLORS.white,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
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
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '12px',
              margin: 0
            }}>
              💡 点击糖果选中，再点击相邻糖果交换位置<br/>
              匹配4个以上可获得特殊糖果
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default CandyCrush;
