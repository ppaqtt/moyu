import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GemBlastEngine, GemPiece, Particle } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const GEM_COLORS = [
  { main: '#e31c5f', light: '#ff6b9d', name: 'ruby' },
  { main: '#0070f3', light: '#4da6ff', name: 'sapphire' },
  { main: '#00c853', light: '#69f0ae', name: 'emerald' },
  { main: '#ffd600', light: '#ffea70', name: 'topaz' },
  { main: '#9c27b0', light: '#ce93d8', name: 'amethyst' },
];

const GemBlast: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GemBlastEngine | null>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'gamewon'>('menu');
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(25);
  const [level, setLevel] = useState(1);
  const [targetScore, setTargetScore] = useState(1000);

  const initGame = useCallback(() => {
    engineRef.current = new GemBlastEngine();
    engineRef.current.init();
    const state = engineRef.current.getState();
    setScore(state.score);
    setMoves(state.moves);
    setLevel(state.level);
    setTargetScore(state.targetScore);
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
        if (state.gameWon && gameState === 'playing') {
          setGameState('gamewon');
        } else if (state.gameOver && gameState === 'playing') {
          setGameState('gameover');
        }

        // Clear canvas
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, 480, 480);

        // Draw grid background with gem pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
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
              drawGem(ctx, piece, piece.row === state.selectedPiece?.row && piece.col === state.selectedPiece?.col);
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

  const drawGem = (ctx: CanvasRenderingContext2D, piece: GemPiece, isSelected: boolean) => {
    const x = piece.x + 30;
    const y = piece.y + 30;
    const baseSize = 24 * piece.scale;
    const gemColor = GEM_COLORS[piece.type] || GEM_COLORS[0];
    const pulseScale = 1 + Math.sin(piece.pulsePhase) * 0.05;

    ctx.save();
    ctx.globalAlpha = piece.alpha;
    ctx.translate(x, y);
    ctx.rotate(piece.rotation);
    ctx.scale(pulseScale, pulseScale);

    // Selection glow
    if (isSelected) {
      ctx.shadowColor = gemColor.main;
      ctx.shadowBlur = 25;
    }

    // Draw gem body (diamond shape)
    const size = baseSize;
    
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.7, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.7, 0);
    ctx.closePath();

    // Gradient fill
    const gradient = ctx.createLinearGradient(-size, -size, size, size);
    gradient.addColorStop(0, gemColor.light);
    gradient.addColorStop(0.5, gemColor.main);
    gradient.addColorStop(1, darkenColor(gemColor.main, 30));
    ctx.fillStyle = gradient;
    ctx.fill();

    // Inner facet
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.6);
    ctx.lineTo(size * 0.4, 0);
    ctx.lineTo(0, size * 0.6);
    ctx.lineTo(-size * 0.4, 0);
    ctx.closePath();
    ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
    ctx.fill();

    // Shine
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, -size * 0.5);
    ctx.lineTo(-size * 0.1, -size * 0.3);
    ctx.lineTo(-size * 0.3, -size * 0.1);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();

    ctx.restore();

    // Special piece indicator (outside rotation)
    if (piece.isSpecial) {
      ctx.save();
      ctx.translate(x, y);
      
      // Outer ring
      ctx.strokeStyle = gemColor.light;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, size + 8, 0, Math.PI * 2);
      ctx.stroke();

      // Special symbol
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (piece.specialType === 'row') {
        ctx.fillText('─', 0, 0);
      } else if (piece.specialType === 'col') {
        ctx.fillText('│', 0, 0);
      } else if (piece.specialType === 'bomb') {
        ctx.fillText('✱', 0, 0);
      } else if (piece.specialType === 'rainbow') {
        ctx.fillText('◈', 0, 0);
      }
      
      ctx.restore();
    }
  };

  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.save();
    ctx.globalAlpha = particle.life / particle.maxLife;

    if (particle.type === 'ring') {
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (particle.type === 'star') {
      drawStar(ctx, particle.x, particle.y, 5, particle.size, particle.size / 2, particle.color);
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
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
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

  const progressPercent = Math.min((score / targetScore) * 100, 100);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: `linear-gradient(135deg, #0a0a12 0%, #1a1a2e 100%)`,
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
          textShadow: `0 0 20px ${NEON_COLORS.gold}`
        }}>
          宝石爆破
        </h1>
        <div style={{ width: '80px' }} />
      </div>

      {/* Game Area */}
      <div style={{
        background: 'rgba(10, 10, 18, 0.9)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: `0 10px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(228, 30, 95, 0.15)`
      }}>
        {/* HUD */}
        {gameState === 'playing' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '15px',
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '10px'
          }}>
            {/* Progress bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ color: NEON_COLORS.gold, fontSize: '12px', whiteSpace: 'nowrap' }}>目标</span>
              <div style={{
                flex: 1,
                height: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${NEON_COLORS.gold}, #ffea70)`,
                  borderRadius: '6px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <span style={{ color: NEON_COLORS.white, fontSize: '12px', whiteSpace: 'nowrap' }}>{score} / {targetScore}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-around'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#a29bfe', fontSize: '12px' }}>分数</div>
                <div style={{ color: NEON_COLORS.white, fontSize: '20px', fontWeight: 'bold' }}>{score}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#4da6ff', fontSize: '12px' }}>关卡</div>
                <div style={{ color: NEON_COLORS.white, fontSize: '20px', fontWeight: 'bold' }}>{level}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#ff6b9d', fontSize: '12px' }}>步数</div>
                <div style={{ color: NEON_COLORS.white, fontSize: '20px', fontWeight: 'bold' }}>{moves}</div>
              </div>
            </div>
          </div>
        )}

        {/* Canvas Container */}
        <div style={{
          position: 'relative',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: `inset 0 0 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(228, 30, 95, 0.2)`
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
              background: `linear-gradient(135deg, rgba(10, 10, 18, 0.97) 0%, rgba(26, 26, 46, 0.97) 100%)`,
              borderRadius: '10px'
            }}>
              <div style={{
                fontSize: '64px',
                marginBottom: '20px',
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                💎💎💎
              </div>
              <h2 style={{
                color: NEON_COLORS.white,
                fontSize: '36px',
                marginBottom: '10px',
                textShadow: `0 0 20px ${NEON_COLORS.gold}`
              }}>
                宝石爆破
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '16px',
                marginBottom: '30px',
                textAlign: 'center',
                padding: '0 40px'
              }}>
                匹配宝石达到目标分数<br/>
                收集彩虹宝石获得额外能量！
              </p>
              <button
                onClick={initGame}
                style={{
                  background: `linear-gradient(135deg, ${GEM_COLORS[0].main} 0%, ${GEM_COLORS[4].main} 100%)`,
                  border: 'none',
                  borderRadius: '30px',
                  padding: '15px 50px',
                  color: NEON_COLORS.white,
                  fontSize: '20px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: `0 5px 25px rgba(228, 30, 95, 0.5)`,
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 8px 35px rgba(228, 30, 95, 0.7)`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = `0 5px 25px rgba(228, 30, 95, 0.5)`;
                }}
              >
                开始游戏
              </button>
            </div>
          )}

          {/* Game Won Overlay */}
          {gameState === 'gamewon' && (
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
              background: `linear-gradient(135deg, rgba(10, 10, 18, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%)`,
              borderRadius: '10px'
            }}>
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>🏆</div>
              <h2 style={{
                color: NEON_COLORS.gold,
                fontSize: '36px',
                marginBottom: '10px',
                textShadow: `0 0 30px ${NEON_COLORS.gold}`
              }}>
                恭喜通关
              </h2>
              <p style={{
                color: NEON_COLORS.white,
                fontSize: '18px',
                marginBottom: '10px'
              }}>
                第 {level} 关完成
              </p>
              <p style={{
                color: '#69f0ae',
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '30px'
              }}>
                分数: {score}
              </p>
              <button
                onClick={initGame}
                style={{
                  background: `linear-gradient(135deg, ${NEON_COLORS.neonGreen} 0%, ${NEON_COLORS.neonCyan} 100%)`,
                  border: 'none',
                  borderRadius: '30px',
                  padding: '15px 40px',
                  color: '#0a0a12',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: `0 5px 20px rgba(57, 255, 20, 0.4)`,
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                下一关
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
              background: `linear-gradient(135deg, rgba(10, 10, 18, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%)`,
              borderRadius: '10px'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>💔</div>
              <h2 style={{
                color: '#ff6b9d',
                fontSize: '36px',
                marginBottom: '10px',
                textShadow: `0 0 20px #ff6b9d`
              }}>
                游戏结束
              </h2>
              <p style={{
                color: NEON_COLORS.white,
                fontSize: '18px',
                marginBottom: '10px'
              }}>
                未能达到目标分数
              </p>
              <p style={{
                color: NEON_COLORS.gold,
                fontSize: '36px',
                fontWeight: 'bold',
                marginBottom: '30px'
              }}>
                {score} / {targetScore}
              </p>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  onClick={initGame}
                  style={{
                    background: `linear-gradient(135deg, ${GEM_COLORS[0].main} 0%, ${GEM_COLORS[4].main} 100%)`,
                    border: 'none',
                    borderRadius: '30px',
                    padding: '15px 40px',
                    color: NEON_COLORS.white,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: `0 5px 20px rgba(228, 30, 95, 0.4)`,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  再试一次
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
              💡 匹配4个宝石可获得特殊宝石<br/>
              消除特殊宝石可触发强大效果
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default GemBlast;
