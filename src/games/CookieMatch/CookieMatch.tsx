import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CookieMatchEngine, CookiePiece, Particle } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const COOKIE_COLORS = [
  { main: '#d4a574', light: '#e8c9a0', name: 'chocolate_chip' },
  { main: '#f5deb3', light: '#fff8dc', name: 'sugar' },
  { main: '#cd853f', light: '#deb887', name: 'ginger' },
  { main: '#8b4513', light: '#a0522d', name: 'brownie' },
  { main: '#ff69b4', light: '#ffb6c1', name: 'strawberry' },
  { main: '#ffb347', light: '#ffd700', name: 'butter' },
];

const CookieMatch: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CookieMatchEngine | null>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(30);
  const [level, setLevel] = useState(1);

  const initGame = useCallback(() => {
    engineRef.current = new CookieMatchEngine();
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

        // Clear canvas with warm background
        ctx.fillStyle = '#2d1810';
        ctx.fillRect(0, 0, 480, 480);

        // Draw wooden table pattern
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
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
              drawCookie(ctx, piece, piece.row === state.selectedPiece?.row && piece.col === state.selectedPiece?.col);
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

  const drawCookie = (ctx: CanvasRenderingContext2D, piece: CookiePiece, isSelected: boolean) => {
    const x = piece.x + 30;
    const y = piece.y + 30;
    const floatOffset = Math.sin(piece.floatPhase) * 2;
    const baseSize = 24 * piece.scale;
    const cookieColor = COOKIE_COLORS[piece.type] || COOKIE_COLORS[0];

    ctx.save();
    ctx.globalAlpha = piece.alpha;
    ctx.translate(x, y + floatOffset);
    ctx.rotate(piece.rotation);

    // Selection glow
    if (isSelected) {
      ctx.shadowColor = cookieColor.main;
      ctx.shadowBlur = 20;
    }

    // Cookie base
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseSize);
    gradient.addColorStop(0, cookieColor.light);
    gradient.addColorStop(0.7, cookieColor.main);
    gradient.addColorStop(1, darkenColor(cookieColor.main, 20));

    ctx.beginPath();
    ctx.arc(0, 0, baseSize, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Cookie edge detail
    ctx.strokeStyle = darkenColor(cookieColor.main, 15);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Chocolate chips / decorations based on type
    ctx.fillStyle = darkenColor(cookieColor.main, 30);
    if (piece.type === 0) {
      // Chocolate chip cookie
      drawChocolateChips(ctx, baseSize);
    } else if (piece.type === 1) {
      // Sugar cookie with sprinkles
      drawSprinkles(ctx, baseSize);
    } else if (piece.type === 2) {
      // Ginger with ridges
      drawRidges(ctx, baseSize);
    } else if (piece.type === 3) {
      // Brownie with square pattern
      drawBrowniePattern(ctx, baseSize);
    } else if (piece.type === 4) {
      // Strawberry with heart
      drawStrawberry(ctx, baseSize);
    } else {
      // Butter cookie with holes
      drawButterCookie(ctx, baseSize);
    }

    ctx.restore();

    // Special piece indicator
    if (piece.isSpecial) {
      ctx.save();
      ctx.translate(x, y + floatOffset);
      
      // Sparkle ring
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, baseSize + 6, 0, Math.PI * 2);
      ctx.stroke();

      // Special symbol
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (piece.specialType === 'frosting') {
        ctx.fillText('✿', 0, 0);
      } else if (piece.specialType === 'chocolate') {
        ctx.fillText('◆', 0, 0);
      } else if (piece.specialType === 'strawberry') {
        ctx.fillText('♥', 0, 0);
      } else if (piece.specialType === 'rainbow') {
        ctx.fillText('★', 0, 0);
      }
      
      ctx.restore();
    }
  };

  const drawChocolateChips = (ctx: CanvasRenderingContext2D, size: number) => {
    const chips = [
      { x: -size * 0.3, y: -size * 0.2, s: 4 },
      { x: size * 0.2, y: -size * 0.4, s: 3 },
      { x: size * 0.4, y: size * 0.1, s: 4 },
      { x: -size * 0.1, y: size * 0.3, s: 3 },
      { x: -size * 0.4, y: size * 0.2, s: 3 },
    ];
    
    ctx.fillStyle = '#3d2314';
    for (const chip of chips) {
      ctx.beginPath();
      ctx.ellipse(chip.x, chip.y, chip.s, chip.s * 0.7, Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawSprinkles = (ctx: CanvasRenderingContext2D, size: number) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#ffeaa7', '#a29bfe', '#fd79a8'];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = size * 0.5;
      ctx.save();
      ctx.translate(Math.cos(angle) * r, Math.sin(angle) * r);
      ctx.rotate(angle + Math.PI / 4);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(-2, -6, 4, 12);
      ctx.restore();
    }
  };

  const drawRidges = (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.strokeStyle = darkenColor(COOKIE_COLORS[2].main, 20);
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.3 + i * 5, -Math.PI * 0.7, Math.PI * 0.7);
      ctx.stroke();
    }
  };

  const drawBrowniePattern = (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-size * 0.6, i * size * 0.3);
      ctx.lineTo(size * 0.6, i * size * 0.3);
      ctx.stroke();
    }
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * size * 0.3, -size * 0.6);
      ctx.lineTo(i * size * 0.3, size * 0.6);
      ctx.stroke();
    }
  };

  const drawStrawberry = (ctx: CanvasRenderingContext2D, size: number) => {
    // Strawberry shape
    ctx.fillStyle = '#ff69b4';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.3);
    ctx.quadraticCurveTo(size * 0.4, 0, 0, size * 0.4);
    ctx.quadraticCurveTo(-size * 0.4, 0, 0, -size * 0.3);
    ctx.fill();
    
    // Seeds
    ctx.fillStyle = '#ffeaa7';
    const seeds = [[-0.1, 0], [0.1, 0.1], [-0.05, 0.2]];
    for (const [sx, sy] of seeds) {
      ctx.beginPath();
      ctx.ellipse(sx * size, sy * size, 2, 1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawButterCookie = (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    const holes = [
      { x: -size * 0.3, y: -size * 0.2 },
      { x: size * 0.2, y: -size * 0.1 },
      { x: 0, y: size * 0.3 },
      { x: -size * 0.2, y: size * 0.1 },
    ];
    for (const hole of holes) {
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.save();
    ctx.globalAlpha = particle.life / particle.maxLife;

    if (particle.type === 'heart') {
      drawHeart(ctx, particle.x, particle.y, particle.size, particle.color);
    } else if (particle.type === 'sparkle') {
      ctx.fillStyle = particle.color;
      drawStar(ctx, particle.x, particle.y, 4, particle.size, particle.size / 2);
    } else {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (particle.life / particle.maxLife), 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  };

  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
    ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 0.75, x, y + size);
    ctx.bezierCurveTo(x, y + size * 0.75, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
    ctx.fill();
  };

  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
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
    ctx.fill();
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
      background: `linear-gradient(135deg, #1a0f0a 0%, #2d1810 100%)`,
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
          textShadow: `0 0 20px #ffb347`
        }}>
          饼干消消乐
        </h1>
        <div style={{ width: '80px' }} />
      </div>

      {/* Game Area */}
      <div style={{
        background: 'rgba(45, 24, 16, 0.9)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: `0 10px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(255, 179, 71, 0.15)`
      }}>
        {/* HUD */}
        {gameState === 'playing' && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginBottom: '15px',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '10px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffb347', fontSize: '12px' }}>分数</div>
              <div style={{ color: NEON_COLORS.white, fontSize: '22px', fontWeight: 'bold' }}>{score}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ff69b4', fontSize: '12px' }}>关卡</div>
              <div style={{ color: NEON_COLORS.white, fontSize: '22px', fontWeight: 'bold' }}>{level}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#d4a574', fontSize: '12px' }}>剩余步数</div>
              <div style={{ color: NEON_COLORS.white, fontSize: '22px', fontWeight: 'bold' }}>{moves}</div>
            </div>
          </div>
        )}

        {/* Canvas Container */}
        <div style={{
          position: 'relative',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: `inset 0 0 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(212, 165, 116, 0.2)`
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
              background: `linear-gradient(135deg, rgba(26, 15, 10, 0.97) 0%, rgba(45, 24, 16, 0.97) 100%)`,
              borderRadius: '10px'
            }}>
              <div style={{
                fontSize: '64px',
                marginBottom: '20px',
                animation: 'wiggle 2s ease-in-out infinite'
              }}>
                🍪🍪🍪
              </div>
              <h2 style={{
                color: NEON_COLORS.white,
                fontSize: '36px',
                marginBottom: '10px',
                textShadow: `0 0 20px #ffb347`
              }}>
                饼干消消乐
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '16px',
                marginBottom: '30px',
                textAlign: 'center',
                padding: '0 40px'
              }}>
                甜美可爱的饼干主题消消乐<br/>
                匹配美味饼干获得高分！
              </p>
              <button
                onClick={initGame}
                style={{
                  background: `linear-gradient(135deg, #ffb347 0%, #ff69b4 100%)`,
                  border: 'none',
                  borderRadius: '30px',
                  padding: '15px 50px',
                  color: NEON_COLORS.white,
                  fontSize: '20px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: `0 5px 25px rgba(255, 179, 71, 0.5)`,
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 8px 35px rgba(255, 179, 71, 0.7)`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = `0 5px 25px rgba(255, 179, 71, 0.5)`;
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
              background: `linear-gradient(135deg, rgba(26, 15, 10, 0.95) 0%, rgba(45, 24, 16, 0.95) 100%)`,
              borderRadius: '10px'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🍪</div>
              <h2 style={{
                color: '#ff69b4',
                fontSize: '36px',
                marginBottom: '10px',
                textShadow: `0 0 20px #ff69b4`
              }}>
                游戏结束
              </h2>
              <p style={{
                color: NEON_COLORS.white,
                fontSize: '18px',
                marginBottom: '10px'
              }}>
                步数用完了！
              </p>
              <p style={{
                color: '#ffb347',
                fontSize: '48px',
                fontWeight: 'bold',
                marginBottom: '30px',
                textShadow: `0 0 20px #ffb347`
              }}>
                {score}
              </p>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  onClick={initGame}
                  style={{
                    background: `linear-gradient(135deg, #ffb347 0%, #ff69b4 100%)`,
                    border: 'none',
                    borderRadius: '30px',
                    padding: '15px 40px',
                    color: NEON_COLORS.white,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: `0 5px 20px rgba(255, 179, 71, 0.4)`,
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
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
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
              💡 点击饼干选中，再点击相邻饼干交换<br/>
              匹配4个以上可获得特殊饼干
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
      `}</style>
    </div>
  );
};

export default CookieMatch;
