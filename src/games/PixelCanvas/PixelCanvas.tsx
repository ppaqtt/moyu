import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { PixelCanvasEngine, PIXEL_COLORS, CANVAS_PRESETS } from './engine';

interface PixelCanvasProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

export default function PixelCanvas({ onScoreUpdate, onGameOver, onExit }: PixelCanvasProps) {
  const [engine] = useState(() => new PixelCanvasEngine());
  const [state, setState] = useState(() => engine.getState());
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedTool, setSelectedTool] = useState<'pencil' | 'eraser' | 'fill' | 'picker'>('pencil');
  const [canvasSize, setCanvasSize] = useState({ width: 32, height: 32 });
  const [cellSize, setCellSize] = useState(12);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.GAME_IDS.PIXEL_CANVAS || 'pixelcanvas_highscore');

  const updateState = useCallback(() => {
    setState(engine.getState());
  }, [engine]);

  useEffect(() => {
    updateState();
  }, [updateState]);

  const handleCellClick = (x: number, y: number) => {
    engine.setColor(selectedColor);
    engine.setTool(selectedTool);

    if (selectedTool === 'picker') {
      const pickedColor = engine.drawPixel(x, y);
      if (pickedColor) {
        setSelectedColor(pickedColor);
        engine.setTool('pencil');
        setSelectedTool('pencil');
      }
    } else {
      engine.drawPixel(x, y);
      updateState();
    }
  };

  const handleMouseDown = (x: number, y: number) => {
    setIsDrawing(true);
    handleCellClick(x, y);
  };

  const handleMouseMove = (x: number, y: number) => {
    if (!isDrawing || selectedTool === 'fill' || selectedTool === 'picker') return;
    handleCellClick(x, y);
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      engine.commitStroke();
    }
  };

  const handleUndo = () => {
    engine.undo();
    updateState();
  };

  const handleRedo = () => {
    engine.redo();
    updateState();
  };

  const handleClear = () => {
    engine.clear();
    updateState();
  };

  const handleSavePNG = () => {
    const dataUrl = engine.exportPNG(10);
    const link = document.createElement('a');
    link.download = `pixelart_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    const filledPixels = state.grid.flat().filter(c => c !== '#ffffff').length;
    const score = filledPixels;
    onScoreUpdate(score);
    updateScore(score);
  };

  const handleSaveSVG = () => {
    const svg = engine.exportSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `pixelart_${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePresetSelect = (preset: typeof CANVAS_PRESETS[0]) => {
    engine.setSize(preset.width, preset.height);
    setCanvasSize({ width: preset.width, height: preset.height });
    setCellSize(Math.min(12, Math.floor(300 / preset.width)));
    updateState();
    setShowPresets(false);
  };

  const tools = [
    { id: 'pencil', icon: '✏️', name: '画笔' },
    { id: 'eraser', icon: '🧹', name: '橡皮' },
    { id: 'fill', icon: '🪣', name: '填充' },
    { id: 'picker', icon: '💉', name: '取色' }
  ] as const;

  const filledCount = state.grid.flat().filter(c => c !== '#ffffff').length;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[700px] px-4">
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

        <h1 className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>像素画板</h1>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>像素数</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{filledCount}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl backdrop-blur-sm"
        style={{
          backgroundColor: `${NEON_COLORS.surface}80`,
          border: `1px solid ${NEON_COLORS.neonBlue}30`
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>工具:</span>
          {tools.map(tool => (
            <motion.button
              key={tool.id}
              onClick={() => { setSelectedTool(tool.id); engine.setTool(tool.id); }}
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

        <div className="relative">
          <motion.button
            onClick={() => setShowPresets(!showPresets)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: `${NEON_COLORS.neonPurple}40`,
              color: NEON_COLORS.neonPurple,
              border: `1px solid ${NEON_COLORS.neonPurple}`
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📐 {canvasSize.width}x{canvasSize.height}
          </motion.button>
          {showPresets && (
            <div className="absolute top-full mt-2 left-0 p-2 rounded-lg z-10"
              style={{
                backgroundColor: NEON_COLORS.darkPurple,
                border: `1px solid ${NEON_COLORS.neonBlue}40`,
                boxShadow: `0 4px 20px ${NEON_COLORS.neonPink}30`
              }}
            >
              {CANVAS_PRESETS.map(preset => (
                <motion.button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className="block w-full px-3 py-2 rounded text-sm"
                  style={{
                    backgroundColor: canvasSize.width === preset.width ? `${NEON_COLORS.neonCyan}40` : 'transparent',
                    color: NEON_COLORS.text
                  }}
                  whileHover={{ backgroundColor: `${NEON_COLORS.neonPurple}40` }}
                >
                  {preset.name}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={handleUndo}
            className="px-3 py-2 rounded-lg"
            style={{ backgroundColor: `${NEON_COLORS.warning}40`, color: NEON_COLORS.warning }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ↩️
          </motion.button>
          <motion.button
            onClick={handleRedo}
            className="px-3 py-2 rounded-lg"
            style={{ backgroundColor: `${NEON_COLORS.warning}40`, color: NEON_COLORS.warning }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ↪️
          </motion.button>
          <motion.button
            onClick={handleClear}
            className="px-3 py-2 rounded-lg"
            style={{ backgroundColor: `${NEON_COLORS.danger}40`, color: NEON_COLORS.danger }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🗑️
          </motion.button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 p-3 rounded-xl backdrop-blur-sm max-w-[600px]"
        style={{
          backgroundColor: `${NEON_COLORS.surface}80`,
          border: `1px solid ${NEON_COLORS.neonPink}30`
        }}
      >
        <span className="text-sm mr-2" style={{ color: NEON_COLORS.textDim }}>颜色:</span>
        {PIXEL_COLORS.map(color => (
          <motion.button
            key={color}
            onClick={() => { setSelectedColor(color); engine.setColor(color); }}
            className="w-6 h-6 rounded border-2"
            style={{
              backgroundColor: color,
              borderColor: selectedColor === color ? NEON_COLORS.white : 'transparent',
              boxShadow: selectedColor === color ? `0 0 6px ${color}` : 'none'
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => { setSelectedColor(e.target.value); engine.setColor(e.target.value); }}
          className="w-8 h-6 rounded cursor-pointer"
          style={{ border: `1px solid ${NEON_COLORS.neonBlue}40` }}
        />
      </div>

      <div
        ref={canvasRef}
        className="relative rounded-2xl overflow-auto"
        style={{
          backgroundColor: '#ffffff',
          boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
          border: `3px solid ${NEON_COLORS.neonPink}50`,
          maxWidth: '100%',
          maxHeight: '400px'
        }}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="grid gap-0"
          style={{
            gridTemplateColumns: `repeat(${canvasSize.width}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${canvasSize.height}, ${cellSize}px)`
          }}
          onMouseUp={handleMouseUp}
        >
          {state.grid.map((row, y) =>
            row.map((color, x) => (
              <div
                key={`${x}-${y}`}
                className="cursor-pointer transition-colors"
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: color,
                  border: '1px solid #eeeeee'
                }}
                onMouseDown={() => handleMouseDown(x, y)}
                onMouseEnter={() => handleMouseMove(x, y)}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          onClick={handleSavePNG}
          className="px-4 py-2 rounded-lg font-bold flex items-center gap-2"
          style={{
            backgroundColor: NEON_COLORS.neonGreen,
            color: NEON_COLORS.white,
            boxShadow: `0 0 15px ${NEON_COLORS.neonGreen}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          💾 保存PNG
        </motion.button>
        <motion.button
          onClick={handleSaveSVG}
          className="px-4 py-2 rounded-lg font-bold flex items-center gap-2"
          style={{
            backgroundColor: `${NEON_COLORS.neonPurple}40`,
            color: NEON_COLORS.neonPurple,
            border: `2px solid ${NEON_COLORS.neonPurple}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📐 保存SVG
        </motion.button>
      </div>

      <div className="text-center text-sm" style={{ color: NEON_COLORS.textDim }}>
        点击画笔在像素网格上创作，支持填充、取色、撤销和导出
      </div>
    </div>
  );
}
