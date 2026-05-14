import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NEON_COLORS } from '../../utils/constants';

interface Piece {
  id: number;
  points: { x: number; y: number }[];
  color: string;
  x: number;
  y: number;
  rotation: number;
  selected: boolean;
}

const BOARD_WIDTH = 400;
const BOARD_HEIGHT = 400;
const PIECE_PANEL_X = 420;

const TANGRAM_PIECES: Omit<Piece, 'x' | 'y' | 'rotation' | 'selected'>[] = [
  {
    id: 1,
    color: '#EF4444',
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 50, y: 50 },
    ],
  },
  {
    id: 2,
    color: '#3B82F6',
    points: [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 0, y: 50 },
    ],
  },
  {
    id: 3,
    color: '#22C55E',
    points: [
      { x: 0, y: 0 },
      { x: 70, y: 0 },
      { x: 70, y: 70 },
      { x: 0, y: 70 },
    ],
  },
  {
    id: 4,
    color: '#EAB308',
    points: [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 0, y: 50 },
    ],
  },
  {
    id: 5,
    color: '#8B5CF6',
    points: [
      { x: 0, y: 0 },
      { x: 50, y: 25 },
      { x: 25, y: 50 },
    ],
  },
  {
    id: 6,
    color: '#EC4899',
    points: [
      { x: 0, y: 0 },
      { x: 50, y: 25 },
      { x: 0, y: 50 },
    ],
  },
  {
    id: 7,
    color: '#06B6D4',
    points: [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 25 },
      { x: 25, y: 25 },
      { x: 25, y: 50 },
      { x: 0, y: 50 },
    ],
  },
];

const TARGET_SHAPE: { pieces: Omit<Piece, 'color'>[] } = {
  pieces: [
    {
      id: 1,
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 50 },
      ],
      x: 150,
      y: 0,
      rotation: 0,
    },
  ],
};

export default function Tangram() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won'>('idle');
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [showTarget, setShowTarget] = useState(false);

  const initGame = useCallback(() => {
    const newPieces = TANGRAM_PIECES.map((p, i) => ({
      ...p,
      x: PIECE_PANEL_X + (i % 2) * 60,
      y: 50 + Math.floor(i / 2) * 80,
      rotation: 0,
      selected: false,
    }));
    setPieces(newPieces);
    setSelectedPiece(null);
    setGameState('playing');
    setScore(0);
    setMoves(0);
  }, []);

  const rotatePiece = useCallback((id: number, angle: number) => {
    setPieces((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, rotation: (p.rotation + angle) % 360 } : p
      )
    );
    setMoves((m) => m + 1);
  }, []);

  const movePiece = useCallback(
    (id: number, dx: number, dy: number) => {
      setPieces((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, x: p.x + dx, y: p.y + dy } : p
        )
      );
      setMoves((m) => m + 1);
    },
    []
  );

  const resetPiecePosition = useCallback((id: number) => {
    const piece = TANGRAM_PIECES.find((p) => p.id === id);
    if (piece) {
      const idx = TANGRAM_PIECES.findIndex((p) => p.id === id);
      setPieces((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                x: PIECE_PANEL_X + (idx % 2) * 60,
                y: 50 + Math.floor(idx / 2) * 80,
                rotation: 0,
              }
            : p
        )
      );
    }
  }, []);

  const isPointInPiece = (
    px: number,
    py: number,
    piece: Piece
  ): boolean => {
    const cos = Math.cos((piece.rotation * Math.PI) / 180);
    const sin = Math.sin((piece.rotation * Math.PI) / 180);

    const transformedPoints = piece.points.map((p) => ({
      x: piece.x + p.x * cos - p.y * sin,
      y: piece.y + p.x * sin + p.y * cos,
    }));

    let inside = false;
    for (let i = 0, j = transformedPoints.length - 1; i < transformedPoints.length; j = i++) {
      const xi = transformedPoints[i].x,
        yi = transformedPoints[i].y;
      const xj = transformedPoints[j].x,
        yj = transformedPoints[j].y;

      if (
        yi > py !== yj > py &&
        px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }
    return inside;
  };

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (gameState !== 'playing') return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let clickedPiece: Piece | null = null;
      for (let i = pieces.length - 1; i >= 0; i--) {
        if (isPointInPiece(x, y, pieces[i])) {
          clickedPiece = pieces[i];
          break;
        }
      }

      if (clickedPiece) {
        setSelectedPiece(clickedPiece.id);
        setPieces((prev) =>
          prev.map((p) => ({ ...p, selected: p.id === clickedPiece!.id }))
        );
      } else {
        setSelectedPiece(null);
        setPieces((prev) => prev.map((p) => ({ ...p, selected: false })));
      }
    },
    [gameState, pieces]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPiece === null) return;

      const step = 10;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          movePiece(selectedPiece, 0, -step);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          movePiece(selectedPiece, 0, step);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePiece(selectedPiece, -step, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePiece(selectedPiece, step, 0);
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          rotatePiece(selectedPiece, 45);
          break;
        case 'Escape':
          e.preventDefault();
          resetPiecePosition(selectedPiece);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedPiece, movePiece, rotatePiece, resetPiecePosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let x = 0; x <= BOARD_WIDTH; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, BOARD_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= BOARD_HEIGHT; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(BOARD_WIDTH, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    pieces.forEach((piece) => {
      ctx.save();

      if (piece.selected) {
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 15;
      }

      ctx.translate(piece.x, piece.y);
      ctx.rotate((piece.rotation * Math.PI) / 180);

      ctx.fillStyle = piece.color;
      ctx.beginPath();
      ctx.moveTo(piece.points[0].x, piece.points[0].y);
      for (let i = 1; i < piece.points.length; i++) {
        ctx.lineTo(piece.points[i].x, piece.points[i].y);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = piece.selected ? '#fff' : 'rgba(255,255,255,0.5)';
      ctx.lineWidth = piece.selected ? 3 : 1;
      ctx.stroke();

      ctx.restore();
    });
  }, [pieces]);

  const checkShape = useCallback(() => {
    let placedCount = 0;
    pieces.forEach((piece) => {
      if (piece.x < BOARD_WIDTH && piece.y < BOARD_HEIGHT && piece.x >= 0 && piece.y >= 0) {
        placedCount++;
      }
    });
    const completionRatio = placedCount / pieces.length;
    setScore(Math.floor(completionRatio * 100));

    if (completionRatio >= 0.8) {
      setGameState('won');
    }
  }, [pieces]);

  return (
    <div style={{ background: '#0a0a1a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20 }}>
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#EF4444', fontSize: 28, marginBottom: 10 }}>📐 七巧板拼图</motion.h1>
      <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
        <span style={{ color: '#fff' }}>完成度: {score}%</span>
        <span style={{ color: '#fff' }}>操作次数: {moves}</span>
      </div>
      <div style={{ color: '#888', fontSize: 14, marginBottom: 10 }}>
        点击选择七巧板碎片，拖拽或使用方向键/WASD移动，R键旋转，ESC键重置位置
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <canvas
          ref={canvasRef}
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          onClick={handleCanvasClick}
          style={{ border: '2px solid #333', borderRadius: 8, cursor: 'crosshair' }}
        />
        <div
          style={{
            width: 150,
            height: BOARD_HEIGHT,
            background: '#1a1a2e',
            borderRadius: 8,
            padding: 10,
            border: '2px solid #333',
          }}
        >
          <div style={{ color: '#888', fontSize: 14, marginBottom: 10 }}>碎片存放区</div>
          {TANGRAM_PIECES.map((p, i) => (
            <div
              key={p.id}
              style={{
                width: 60,
                height: 60,
                position: 'absolute',
                left: PIECE_PANEL_X + (i % 2) * 70,
                top: 50 + Math.floor(i / 2) * 80,
              }}
            />
          ))}
        </div>
      </div>
      {selectedPiece !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ marginTop: 15, color: '#fff', fontSize: 14, textAlign: 'center' }}
        >
          已选择碎片 #{selectedPiece}
          <br />
          <span style={{ color: '#888' }}>
            方向键/WASD移动 | R旋转45° | ESC重置
          </span>
        </motion.div>
      )}
      {gameState === 'won' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{ color: '#22c55e', fontSize: 24, marginTop: 15 }}
        >
          🎉 恭喜完成拼图! 操作次数: {moves}
        </motion.div>
      )}
      <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={checkShape}
          style={{
            padding: '10px 24px',
            background: '#3B82F6',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          检查完成度
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={initGame}
          style={{
            padding: '10px 24px',
            background: '#EF4444',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {gameState === 'idle' ? '开始游戏' : '重新开始'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          style={{
            padding: '10px 24px',
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          返回首页
        </motion.button>
      </div>
    </div>
  );
}
