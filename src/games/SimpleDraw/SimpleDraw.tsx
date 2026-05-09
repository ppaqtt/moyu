import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { SimpleDrawEngine, COLORS, BRUSH_SIZES, BACKGROUNDS, Stroke } from './engine';

interface SimpleDrawProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

export default function SimpleDraw({ onScoreUpdate, onGameOver, onExit }: SimpleDrawProps) {
  const [engine] = useState(() => new SimpleDrawEngine());
  const [state, setState] = useState(() => engine.getState());
  const [selectedTool, setSelectedTool] = useState<'brush' | 'eraser' | 'spray' | 'marker'>('brush');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedWidth, setSelectedWidth] = useState(4);
  const [selectedBg, setSelectedBg] = useState('#ffffff');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { record } = useGameRecord(STORAGE_KEYS.GAME_IDS.SIMPLE_DRAW || 'simpledraw_highscore');

  const updateState = useCallback(() => {
    setState(engine.getState());
  }, [engine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engine.drawBackground(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
    engine.drawOnContext(ctx);
  }, [state.strokes, state.currentStroke, state.backgroundColor, engine]);

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (point) {
      engine.startDrawing(point.x, point.y);
      updateState();
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (point) {
      engine.continueDrawing(point.x, point.y);
      updateState();
    }
  };

  const handleMouseUp = () => {
    engine.endDrawing();
    updateState();
  };

  const handleToolChange = (tool: 'brush' | 'eraser' | 'spray' | 'marker') => {
    setSelectedTool(tool);
    engine.setTool(tool);
    updateState();
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    engine.setColor(color);
    updateState();
  };

  const handleWidthChange = (width: number) => {
    setSelectedWidth(width);
    engine.setWidth(width);
    updateState();
  };

  const handleBgChange = (bg: string) => {
    setSelectedBg(bg);
    engine.setBackground(bg);
    updateState();
  };

  const handleUndo = () => {
    engine.undo();
    updateState();
  };

  const handleClear = () => {
    engine.clear();
    updateState();
  };

  const handleSave = () => {
    const dataUrl = engine.saveDrawing(CANVAS_WIDTH, CANVAS_HEIGHT);
    const link = document.createElement('a');
    link.download = `simpledraw_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const strokeCount = state.strokes.length;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[800px] px-4">
        <motion.button
          onClick={onExit}
          className="px-4 py-2 rounded-lg font-bold text-sm backdrop-blur-sm"
          style={{
            backgroundColor: `${NEON_COLORS.darkPurple}80`,
            color: NEON_COLORS.neonBlue,
            boxShadow: `0 0 10px ${NEON_COLORS.neonBlue}40`,
            border: `1px solid ${NEON_COLORS.neonBlue}40`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          返回
        </motion.button>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>笔画数</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{strokeCount}</div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>作品数</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.gamesPlayed || 0}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl backdrop-blur-sm"
        style={{
          backgroundColor: `${NEON_COLORS.surface}80`,
          border: `1px solid ${NEON_COLORS.neonBlue}30`
        }}
      >
        <div className="flex items-center gap-2 mr-4">
          <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>工具:</span>
          {[
            { id: 'brush', icon: '✏️', name: '画笔' },
            { id: 'eraser', icon: '🧹', name: '橡皮' },
            { id: 'spray', icon: '🎨', name: '喷枪' },
            { id: 'marker', icon: '🖍️', name: '马克' }
          ].map((tool) => (
            <motion.button
              key={tool.id}
              onClick={() => handleToolChange(tool.id as any)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg"
              style={{
                backgroundColor: selectedTool === tool.id ? `${NEON_COLORS.neonBlue}40` : 'transparent',
                border: `2px solid ${selectedTool === tool.id ? NEON_COLORS.neonBlue : 'transparent'}`
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={tool.name}
            >
              <span className="text-xl">{tool.icon}</span>
              <span className="text-xs" style={{ color: NEON_COLORS.textDim }}>{tool.name}</span>
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2 mr-4">
          <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>粗细:</span>
          {BRUSH_SIZES.map(size => (
            <motion.button
              key={size}
              onClick={() => handleWidthChange(size)}
              className="rounded-full flex items-center justify-center"
              style={{
                width: size + 8,
                height: size + 8,
                backgroundColor: selectedWidth === size ? NEON_COLORS.neonCyan : `${NEON_COLORS.darkPurple}60`,
                border: `2px solid ${selectedWidth === size ? NEON_COLORS.neonCyan : `${NEON_COLORS.textDim}40`}`
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>背景:</span>
          <select
            value={selectedBg}
            onChange={(e) => handleBgChange(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: `${NEON_COLORS.darkPurple}60`,
              color: NEON_COLORS.white,
              border: `1px solid ${NEON_COLORS.neonBlue}40`
            }}
          >
            {BACKGROUNDS.map(bg => (
              <option key={bg.color} value={bg.color}>{bg.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 p-3 rounded-xl backdrop-blur-sm"
        style={{
          backgroundColor: `${NEON_COLORS.surface}80`,
          border: `1px solid ${NEON_COLORS.neonPink}30`
        }}
      >
        <span className="text-sm mr-2" style={{ color: NEON_COLORS.textDim }}>颜色:</span>
        {COLORS.map(color => (
          <motion.button
            key={color}
            onClick={() => handleColorChange(color)}
            className="w-8 h-8 rounded-lg border-2"
            style={{
              backgroundColor: color,
              borderColor: selectedColor === color ? NEON_COLORS.white : 'transparent',
              boxShadow: selectedColor === color ? `0 0 8px ${color}` : 'none'
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
          />
        ))}
      </div>

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          border: `3px solid ${NEON_COLORS.neonPink}50`
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        />
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          onClick={handleUndo}
          className="px-4 py-2 rounded-lg font-bold flex items-center gap-2"
          style={{
            backgroundColor: `${NEON_COLORS.warning}40`,
            color: NEON_COLORS.warning,
            border: `1px solid ${NEON_COLORS.warning}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ↩️ 撤销
        </motion.button>
        <motion.button
          onClick={handleClear}
          className="px-4 py-2 rounded-lg font-bold flex items-center gap-2"
          style={{
            backgroundColor: `${NEON_COLORS.danger}40`,
            color: NEON_COLORS.danger,
            border: `1px solid ${NEON_COLORS.danger}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🗑️ 清空
        </motion.button>
        <motion.button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg font-bold flex items-center gap-2"
          style={{
            backgroundColor: `${NEON_COLORS.neonGreen}40`,
            color: NEON_COLORS.neonGreen,
            border: `1px solid ${NEON_COLORS.neonGreen}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          💾 保存
        </motion.button>
      </div>

      <div className="text-center text-sm" style={{ color: NEON_COLORS.textDim }}>
        自由绘画创作，支持画笔、橡皮擦、喷枪和马克笔工具
      </div>
    </div>
  );
}
