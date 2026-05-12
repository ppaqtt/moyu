import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameState,
  GameAction,
  createInitialState,
  penaltyKickReducer,
  NEON_COLORS,
  getHighScore,
  saveHighScore,
} from './engine';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

export const PenaltyKickGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const stateRef = useRef<GameState>(createInitialState(CANVAS_WIDTH, CANVAS_HEIGHT));
  const [renderTick, setRenderTick] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    setHighScore(getHighScore());
  }, []);

  const dispatch = useCallback((action: GameAction) => {
    stateRef.current = penaltyKickReducer(stateRef.current, action, CANVAS_WIDTH, CANVAS_HEIGHT);
    setRenderTick((t) => t + 1);
  }, []);

  // Game loop
  useEffect(() => {
    let lastTime = performance.now();

    const gameLoop = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      dispatch({ type: 'UPDATE', deltaTime });

      if (isCharging) {
        dispatch({ type: 'CHARGE_POWER' });
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [dispatch, isCharging]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = stateRef.current;

    // Clear canvas
    ctx.fillStyle = NEON_COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw field
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a3a1a');
    gradient.addColorStop(1, '#0d2d0d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw field lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - 50);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 50);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw goal
    const { goal } = state;
    ctx.strokeStyle = NEON_COLORS.primary;
    ctx.lineWidth = 4;
    ctx.strokeRect(goal.x, goal.y, goal.width, goal.height);

    // Goal net pattern
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= goal.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(goal.x + i, goal.y);
      ctx.lineTo(goal.x + i, goal.y + goal.height);
      ctx.stroke();
    }
    for (let i = 0; i <= goal.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(goal.x, goal.y + i);
      ctx.lineTo(goal.x + goal.width, goal.y + i);
      ctx.stroke();
    }

    // Draw goalkeeper
    const { goalkeeper } = state;
    ctx.fillStyle = NEON_COLORS.danger;
    ctx.shadowColor = NEON_COLORS.danger;
    ctx.shadowBlur = 15;
    ctx.fillRect(
      goalkeeper.position.x - goalkeeper.width / 2,
      goalkeeper.position.y,
      goalkeeper.width,
      goalkeeper.height
    );
    ctx.shadowBlur = 0;

    // Goalkeeper glow
    ctx.strokeStyle = NEON_COLORS.danger;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      goalkeeper.position.x - goalkeeper.width / 2,
      goalkeeper.position.y,
      goalkeeper.width,
      goalkeeper.height
    );

    // Draw ball
    const { ball } = state;
    ctx.save();
    ctx.translate(ball.position.x, ball.position.y);
    ctx.rotate(ball.rotation);

    // Ball shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, ball.radius + 5, ball.radius * 0.8, ball.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball body
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = NEON_COLORS.accent;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball pattern
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, ball.radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * ball.radius * 0.6, Math.sin(angle) * ball.radius * 0.6);
      ctx.stroke();
    }

    ctx.restore();

    // Draw aim line
    if (!state.isShooting && !state.gameOver) {
      ctx.strokeStyle = NEON_COLORS.accent;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(ball.position.x, ball.position.y);
      ctx.lineTo(
        ball.position.x + Math.cos(state.aimAngle) * 100,
        ball.position.y + Math.sin(state.aimAngle) * 100
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw particles
    state.particles.forEach((p) => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw power bar
    if (!state.isShooting && !state.gameOver) {
      const barWidth = 150;
      const barHeight = 15;
      const barX = 20;
      const barY = CANVAS_HEIGHT - 40;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const powerGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
      powerGradient.addColorStop(0, NEON_COLORS.success);
      powerGradient.addColorStop(0.5, NEON_COLORS.warning);
      powerGradient.addColorStop(1, NEON_COLORS.danger);

      ctx.fillStyle = powerGradient;
      ctx.fillRect(barX, barY, barWidth * state.power, barHeight);

      ctx.strokeStyle = NEON_COLORS.primary;
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barWidth, barHeight);

      ctx.fillStyle = NEON_COLORS.text;
      ctx.font = '12px Arial';
      ctx.fillText('力量', barX, barY - 5);
    }
  }, [renderTick]);

  // Save high score when game ends
  useEffect(() => {
    if (stateRef.current.gameOver) {
      saveHighScore(stateRef.current.score);
      setHighScore(getHighScore());
    }
  }, [stateRef.current.gameOver]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current.isShooting || stateRef.current.gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const ballX = stateRef.current.ball.position.x;
    const ballY = stateRef.current.ball.position.y;

    const angle = Math.atan2(mouseY - ballY, mouseX - ballX);
    dispatch({ type: 'AIM', angle });
  }, [dispatch]);

  const handleMouseDown = useCallback(() => {
    if (stateRef.current.isShooting || stateRef.current.gameOver) return;
    setIsCharging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isCharging) {
      setIsCharging(false);
      dispatch({ type: 'SHOOT' });
    }
  }, [isCharging, dispatch]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  const state = stateRef.current;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        padding: '20px',
        background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, #1a1a2e 100%)`,
        borderRadius: '20px',
        boxShadow: `0 0 40px rgba(0, 245, 255, 0.2)`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: CANVAS_WIDTH,
          padding: '15px 25px',
          background: NEON_COLORS.glass,
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          border: `1px solid ${NEON_COLORS.glassBorder}`,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: NEON_COLORS.primary,
              fontSize: '24px',
              fontWeight: 'bold',
              textShadow: `0 0 10px ${NEON_COLORS.primary}`,
            }}
          >
            点球大战
          </h2>
          <p style={{ margin: '5px 0 0 0', color: NEON_COLORS.textMuted, fontSize: '14px' }}>
            按住蓄力，瞄准射门！
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: NEON_COLORS.text, fontSize: '18px' }}>
            得分: <span style={{ color: NEON_COLORS.success, fontWeight: 'bold' }}>{state.score}</span>
          </div>
          <div style={{ color: NEON_COLORS.textMuted, fontSize: '14px' }}>
            尝试: {state.attempts}/{state.maxAttempts}
          </div>
          <div style={{ color: NEON_COLORS.accent, fontSize: '12px' }}>
            最高分: {highScore}
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            borderRadius: '15px',
            border: `2px solid ${NEON_COLORS.glassBorder}`,
            cursor: state.isShooting || state.gameOver ? 'default' : 'crosshair',
          }}
        />

        {/* Goal/No Goal Overlay */}
        {state.isGoal !== null && !state.gameOver && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              padding: '20px 40px',
              background: state.isGoal ? 'rgba(0, 255, 136, 0.9)' : 'rgba(255, 51, 102, 0.9)',
              borderRadius: '15px',
              animation: 'popIn 0.3s ease-out',
            }}
          >
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}
            >
              {state.isGoal ? '进球！' : '被扑出！'}
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {state.gameOver && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '15px',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: NEON_COLORS.primary,
                textShadow: `0 0 20px ${NEON_COLORS.primary}`,
                marginBottom: '20px',
              }}
            >
              游戏结束
            </div>
            <div style={{ fontSize: '24px', color: NEON_COLORS.text, marginBottom: '10px' }}>
              最终得分: {state.score}/{state.maxAttempts}
            </div>
            {state.score === state.maxAttempts && (
              <div style={{ fontSize: '18px', color: NEON_COLORS.success, marginBottom: '20px' }}>
                完美！你是点球大师！
              </div>
            )}
            <button
              onClick={handleReset}
              style={{
                padding: '15px 40px',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#fff',
                background: `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                boxShadow: `0 0 20px ${NEON_COLORS.primary}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 0 30px ${NEON_COLORS.primary}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 0 20px ${NEON_COLORS.primary}`;
              }}
            >
              再来一局
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '15px',
          padding: '15px 25px',
          background: NEON_COLORS.glass,
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          border: `1px solid ${NEON_COLORS.glassBorder}`,
        }}
      >
        <button
          onClick={handleReset}
          disabled={state.isShooting}
          style={{
            padding: '10px 25px',
            fontSize: '16px',
            color: '#fff',
            background: state.isShooting ? 'rgba(255,255,255,0.1)' : NEON_COLORS.primary,
            border: 'none',
            borderRadius: '25px',
            cursor: state.isShooting ? 'not-allowed' : 'pointer',
            opacity: state.isShooting ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
        >
          重置
        </button>
        <div style={{ color: NEON_COLORS.textMuted, fontSize: '14px', display: 'flex', alignItems: 'center' }}>
          鼠标移动瞄准 | 按住蓄力 | 松开射门
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          0% { transform: translate(-50%, -50%) scale(0); }
          80% { transform: translate(-50%, -50%) scale(1.1); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default PenaltyKickGame;
