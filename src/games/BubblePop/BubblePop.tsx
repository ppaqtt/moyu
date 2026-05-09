import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BubblePopEngine, Bubble, ShooterBubble, Particle } from './engine';
import { NEON_COLORS } from '../../utils/constants';

const BUBBLE_COLORS = [
  '#ff6b6b', // 红色
  '#4ecdc4', // 青色
  '#ffeaa7', // 黄色
  '#a29bfe', // 紫色
  '#fd79a8', // 粉色
  '#00d2ff', // 蓝色
];

const BubblePop: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BubblePopEngine | null>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);

  const initGame = useCallback(() => {
    engineRef.current = new BubblePopEngine();
    engineRef.current.init();
    const state = engineRef.current.getState();
    setScore(state.score);
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

    engineRef.current.handleClick(x, y);
  }, [gameState]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    engineRef.current.handleMouseMove(x, y);
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
        if (state.level !== level) setLevel(state.level);
        if (state.gameOver && gameState === 'playing') {
          setGameState('gameover');
        }

        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 480, 640);

        // Draw ceiling line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 40);
        ctx.lineTo(480, 40);
        ctx.stroke();

        // Draw danger zone
        const gradient = ctx.createLinearGradient(0, 490, 0, 520);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 490, 480, 30);

        // Draw grid bubbles
        for (let row = 0; row < 12; row++) {
          for (let col = 0; col < 11; col++) {
            const bubble = state.grid[row]?.[col];
            if (bubble) {
              drawBubble(ctx, bubble);
            }
          }
        }

        // Draw falling bubbles
        for (const bubble of state.fallingBubbles) {
          ctx.save();
          ctx.globalAlpha = bubble.alpha;
          drawBubble(ctx, bubble);
          ctx.restore();
        }

        // Draw particles
        for (const particle of state.particles) {
          drawParticle(ctx, particle);
        }

        // Draw aim line
        if (!state.shooterBubble.isActive) {
          const aimAngle = engineRef.current?.getAimAngle() || -Math.PI / 2;
          const shooterX = state.shooterBubble.x;
          const shooterY = state.shooterBubble.y;
          
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(shooterX, shooterY);
          
          const lineLength = 100;
          ctx.lineTo(
            shooterX + Math.cos(aimAngle) * lineLength,
            shooterY + Math.sin(aimAngle) * lineLength
          );
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw shooter area
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 580, 480, 60);

        // Draw shooter bubbles
        drawShooterBubble(ctx, state.shooterBubble);
        
        // Draw next bubble preview
        if (!state.shooterBubble.isActive) {
          ctx.save();
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(400, 620, 15, 0, Math.PI * 2);
          ctx.fillStyle = BUBBLE_COLORS[state.nextBubbleType];
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('下一个', 400, 645);
          ctx.restore();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, score, level]);

  const drawBubble = (ctx: CanvasRenderingContext2D, bubble: Bubble) => {
    const x = bubble.x;
    const y = bubble.y;
    const radius = 22 * bubble.scale;
    const color = BUBBLE_COLORS[bubble.type] || NEON_COLORS.neonPink;
    const pulseScale = 1 + Math.sin(bubble.pulsePhase) * 0.03;

    ctx.save();
    ctx.globalAlpha = bubble.alpha;
    ctx.translate(x, y);
    ctx.scale(pulseScale, pulseScale);

    // Glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    // Main bubble
    const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
    gradient.addColorStop(0, lightenColor(color, 50));
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, darkenColor(color, 20));

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Shine highlight
    ctx.beginPath();
    ctx.ellipse(-radius * 0.3, -radius * 0.3, radius * 0.25, radius * 0.15, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();

    // Inner circle detail
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, 0.15)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  };

  const drawShooterBubble = (ctx: CanvasRenderingContext2D, bubble: ShooterBubble) => {
    const x = bubble.x;
    const y = bubble.y;
    const radius = 25;
    const color = BUBBLE_COLORS[bubble.type] || NEON_COLORS.neonPink;

    ctx.save();
    ctx.translate(x, y);

    // Glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    // Main bubble
    const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
    gradient.addColorStop(0, lightenColor(color, 50));
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, darkenColor(color, 20));

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Shine
    ctx.beginPath();
    ctx.ellipse(-radius * 0.3, -radius * 0.3, radius * 0.25, radius * 0.15, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();

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
      background: `linear-gradient(135deg, ${NEON_COLORS.primary} 0%, #16213e 100%)`,
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
          textShadow: `0 0 20px ${NEON_COLORS.neonCyan}`
        }}>
          泡泡爆破
        </h1>
        <div style={{ width: '80px' }} />
      </div>

      {/* Game Area */}
      <div style={{
        background: 'rgba(26, 26, 46, 0.9)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: `0 10px 40px rgba(0, 0, 0, 0.4), 0 0 60px rgba(0, 210, 255, 0.15)`
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
              <div style={{ color: NEON_COLORS.neonCyan, fontSize: '12px' }}>分数</div>
              <div style={{ color: NEON_COLORS.white, fontSize: '22px', fontWeight: 'bold' }}>{score}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: NEON_COLORS.neonPurple, fontSize: '12px' }}>关卡</div>
              <div style={{ color: NEON_COLORS.white, fontSize: '22px', fontWeight: 'bold' }}>{level}</div>
            </div>
          </div>
        )}

        {/* Canvas Container */}
        <div style={{
          position: 'relative',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: `inset 0 0 30px rgba(0, 0, 0, 0.5)`
        }}>
          <canvas
            ref={canvasRef}
            width={480}
            height={640}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            style={{
              display: 'block',
              cursor: gameState === 'playing' ? 'crosshair' : 'default'
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
              background: `linear-gradient(135deg, rgba(15, 15, 26, 0.97) 0%, rgba(26, 26, 46, 0.97) 100%)`,
              borderRadius: '10px'
            }}>
              <div style={{
                fontSize: '72px',
                marginBottom: '20px',
                animation: 'bounce 1.5s ease-in-out infinite'
              }}>
                🫧🫧🫧
              </div>
              <h2 style={{
                color: NEON_COLORS.white,
                fontSize: '36px',
                marginBottom: '10px',
                textShadow: `0 0 20px ${NEON_COLORS.neonCyan}`
              }}>
                泡泡爆破
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '16px',
                marginBottom: '30px',
                textAlign: 'center',
                padding: '0 40px'
              }}>
                瞄准并发射泡泡<br/>
                匹配3个或更多相同颜色的泡泡消除它们！
              </p>
              <button
                onClick={initGame}
                style={{
                  background: `linear-gradient(135deg, ${NEON_COLORS.neonCyan} 0%, ${NEON_COLORS.neonBlue} 100%)`,
                  border: 'none',
                  borderRadius: '30px',
                  padding: '15px 50px',
                  color: NEON_COLORS.primary,
                  fontSize: '20px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: `0 5px 25px rgba(0, 210, 255, 0.5)`,
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 8px 35px rgba(0, 210, 255, 0.7)`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = `0 5px 25px rgba(0, 210, 255, 0.5)`;
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
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>💥</div>
              <h2 style={{
                color: '#ff6b6b',
                fontSize: '36px',
                marginBottom: '10px',
                textShadow: `0 0 20px #ff6b6b`
              }}>
                游戏结束
              </h2>
              <p style={{
                color: NEON_COLORS.white,
                fontSize: '18px',
                marginBottom: '10px'
              }}>
                泡泡到达底部了！
              </p>
              <p style={{
                color: NEON_COLORS.neonCyan,
                fontSize: '36px',
                fontWeight: 'bold',
                marginBottom: '10px'
              }}>
                分数: {score}
              </p>
              <p style={{
                color: NEON_COLORS.neonPurple,
                fontSize: '18px',
                marginBottom: '30px'
              }}>
                关卡: {level}
              </p>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  onClick={initGame}
                  style={{
                    background: `linear-gradient(135deg, ${NEON_COLORS.neonGreen} 0%, ${NEON_COLORS.neonCyan} 100%)`,
                    border: 'none',
                    borderRadius: '30px',
                    padding: '15px 40px',
                    color: '#0f0f1a',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: `0 5px 20px rgba(57, 255, 20, 0.4)`,
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
              💡 点击画布发射泡泡<br/>
              匹配3个以上相同颜色泡泡消除得分
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
};

export default BubblePop;
