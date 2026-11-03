import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import type { EngineProps, GameStatus } from '../types';

const W = 800;
const H = 500;
const COLORS = ['#ffffff', '#22d3ee', '#a855f7', '#f472b6', '#facc15', '#22c55e', '#fb923c', '#ef4444'];

export default function DrawingGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(6);
  const [eraser, setEraser] = useState(false);
  const [strokes, setStrokes] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const history = useRef<ImageData[]>([]);

  const paintBackground = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    if (status !== 'playing') return;
    paintBackground();
  }, [status, paintBackground]);

  const start = useCallback(() => {
    history.current = [];
    setStrokes(0);
    setEraser(false);
    setStatus('playing');
    report(0);
    window.setTimeout(paintBackground, 0);
  }, [paintBackground, report]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (status !== 'playing') return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    history.current.push(ctx.getImageData(0, 0, W, H));
    if (history.current.length > 20) history.current.shift();
    drawing.current = true;
    last.current = point(e);
    canvas.setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || status !== 'playing') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !last.current) return;
    const p = point(e);
    ctx.strokeStyle = eraser ? '#0b1020' : color;
    ctx.lineWidth = eraser ? size * 2.5 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const next = strokes + 1;
    setStrokes(next);
    report(next * 10);
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const snapshot = history.current.pop();
    if (ctx && snapshot) ctx.putImageData(snapshot, 0, 0);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      history.current.push(ctx.getImageData(0, 0, W, H));
      paintBackground();
    }
  };

  const complete = () => {
    setStatus('won');
    finish(strokes * 10);
  };

  return (
    <GameFrame
      meta={meta}
      score={strokes * 10}
      best={best}
      status={status}
      stats={[{ label: '笔画', value: strokes }, { label: '颜色', value: <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: eraser ? '#94a3b8' : color }} /> }]}
      resultText={`完成了 ${strokes} 笔创作`}
      hint="按住鼠标或手指在画布上绘制；可以切换颜色、笔刷大小、橡皮和撤销"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          自由创作模式。<br />选择颜色和画笔，在画布上画下你的作品。
        </StartPanel>
      ) : (
        <div style={{ width: '100%', maxWidth: 820, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setEraser(false); }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: c,
                  border: color === c && !eraser ? '3px solid #fff' : '2px solid rgba(255,255,255,0.25)',
                  cursor: 'pointer',
                }}
              />
            ))}
            <input type="range" min={2} max={30} value={size} onChange={e => setSize(Number(e.target.value))} />
            <button onClick={() => setEraser(v => !v)} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: eraser ? `${meta.primary}44` : 'transparent', color: '#e2e8f0', cursor: 'pointer' }}>橡皮</button>
            <button onClick={undo} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#e2e8f0', cursor: 'pointer' }}>撤销</button>
            <button onClick={clear} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#e2e8f0', cursor: 'pointer' }}>清空</button>
            <button onClick={complete} style={{ padding: '5px 14px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${meta.primary}, ${meta.secondary})`, color: '#06101f', fontWeight: 800, cursor: 'pointer', marginLeft: 'auto' }}>完成创作</button>
          </div>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onPointerLeave={up}
            style={{ width: '100%', aspectRatio: `${W} / ${H}`, borderRadius: 12, border: `1px solid ${meta.primary}44`, touchAction: 'none', cursor: 'crosshair', display: 'block' }}
          />
        </div>
      )}
    </GameFrame>
  );
}
