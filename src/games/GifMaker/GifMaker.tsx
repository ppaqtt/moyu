import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { GifMakerEngine, COLORS, DEFAULT_FPS } from './engine';

interface GifMakerProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CANVAS_DISPLAY_SIZE = 300;

export default function GifMaker({ onScoreUpdate, onGameOver, onExit }: GifMakerProps) {
  const [engine] = useState(() => new GifMakerEngine());
  const [state, setState] = useState(() => engine.getState());
  const [selectedTool, setSelectedTool] = useState<'pencil' | 'eraser' | 'fill'>('pencil');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [fps, setFps] = useState(DEFAULT_FPS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const playbackIntervalRef = useRef<number | null>(null);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.GAME_IDS.GIF_MAKER || 'gifmaker_highscore');

  const updateState = useCallback(() => {
    setState(engine.getState());
  }, [engine]);

  const canvasSize = engine.getCanvasSize();
  const scale = CANVAS_DISPLAY_SIZE / Math.max(canvasSize.width, canvasSize.height);

  useEffect(() => {
    updateState();
  }, [updateState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    engine.drawOnCanvas(ctx, 1, false);

    const frame = engine.getCurrentFrame();
    if (frame?.imageData) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasSize.width;
      tempCanvas.height = canvasSize.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(frame.imageData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0);
      }
    }
  }, [state, engine, canvasSize]);

  useEffect(() => {
    if (isPlaying && state.frames.length > 1) {
      let currentIdx = 0;
      const interval = 1000 / fps;

      playbackIntervalRef.current = window.setInterval(() => {
        currentIdx = (currentIdx + 1) % state.frames.length;
        setPlaybackIndex(currentIdx);

        const previewCanvas = previewRef.current;
        if (previewCanvas) {
          const previewCtx = previewCanvas.getContext('2d');
          if (previewCtx) {
            previewCtx.fillStyle = '#ffffff';
            previewCtx.fillRect(0, 0, canvasSize.width, canvasSize.height);

            const frameImageData = engine.getFrameImageData(currentIdx);
            if (frameImageData) {
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = canvasSize.width;
              tempCanvas.height = canvasSize.height;
              const tempCtx = tempCanvas.getContext('2d');
              if (tempCtx) {
                tempCtx.putImageData(frameImageData, 0, 0);
                previewCtx.drawImage(tempCanvas, 0, 0);
              }
            }
          }
        }
      }, interval);

      return () => {
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
        }
      };
    }
  }, [isPlaying, fps, state.frames.length, engine, canvasSize]);

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
      x: Math.floor((clientX - rect.left) / scale),
      y: Math.floor((clientY - rect.top) / scale)
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isPlaying) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);

    if (selectedTool === 'fill') {
      engine.fillAtPoint(point.x, point.y, ctx);
    } else {
      engine.startDrawing(point.x, point.y, ctx);
    }

    updateState();
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isPlaying) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engine.continueDrawing(point.x, point.y, ctx);
    updateState();
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      engine.endDrawing();
      updateState();
    }
  };

  const handleToolChange = (tool: 'pencil' | 'eraser' | 'fill') => {
    setSelectedTool(tool);
    engine.setTool(tool);
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    engine.setColor(color);
  };

  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size);
    engine.setBrushSize(size);
  };

  const handleFpsChange = (newFps: number) => {
    setFps(newFps);
    engine.setFps(newFps);
  };

  const handleAddFrame = () => {
    engine.addFrame();
    updateState();
  };

  const handleDuplicateFrame = () => {
    engine.duplicateFrame(state.currentFrameIndex);
    updateState();
  };

  const handleDeleteFrame = () => {
    engine.deleteFrame(state.currentFrameIndex);
    updateState();
  };

  const handleSelectFrame = (index: number) => {
    if (isPlaying) return;
    engine.setCurrentFrameIndex(index);
    updateState();
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      engine.setPlaying(false);
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    } else {
      setIsPlaying(true);
      engine.setPlaying(true);
      setPlaybackIndex(state.currentFrameIndex);
    }
  };

  const handleClearFrame = () => {
    engine.clearCurrentFrame();
    updateState();
  };

  const handleSave = async () => {
    const framesData = engine.exportAsFrames();
    if (framesData.length === 0) return;

    if (framesData.length === 1) {
      const link = document.createElement('a');
      link.download = `frame_${Date.now()}.png`;
      link.href = framesData[0].imageData;
      link.click();

      onScoreUpdate(10);
      updateScore(10);
    } else {
      const dataUrl = await engine.exportAsGif((progress) => {
        setExportProgress(progress);
      });

      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `animation_${Date.now()}.gif`;
        link.href = dataUrl;
        link.click();

        onScoreUpdate(framesData.length * 5);
        updateScore(framesData.length * 5);
      }
    }

    setExportProgress(0);
  };

  const tools = [
    { id: 'pencil', icon: '✏️', name: '画笔' },
    { id: 'eraser', icon: '🧹', name: '橡皮' },
    { id: 'fill', icon: '🪣', name: '填充' }
  ] as const;

  const brushSizes = [2, 4, 8, 12, 16];

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

        <h1 className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>GIF制作器</h1>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>帧数</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{state.frames.length}</div>
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
              onClick={() => handleToolChange(tool.id)}
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

        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>笔刷:</span>
          {brushSizes.map(size => (
            <motion.button
              key={size}
              onClick={() => handleBrushSizeChange(size)}
              className="rounded-full flex items-center justify-center"
              style={{
                width: size + 8,
                height: size + 8,
                backgroundColor: brushSize === size ? NEON_COLORS.neonCyan : `${NEON_COLORS.darkPurple}60`,
                border: `2px solid ${brushSize === size ? NEON_COLORS.neonCyan : `${NEON_COLORS.textDim}40`}`
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>FPS:</span>
          <input
            type="range"
            min="1"
            max="30"
            value={fps}
            onChange={(e) => handleFpsChange(parseInt(e.target.value))}
            className="w-20"
          />
          <span className="text-sm" style={{ color: NEON_COLORS.neonCyan }}>{fps}</span>
        </div>

        <motion.button
          onClick={() => setShowGrid(!showGrid)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: showGrid ? `${NEON_COLORS.neonPurple}40` : 'transparent',
            color: showGrid ? NEON_COLORS.neonPurple : NEON_COLORS.textDim,
            border: `1px solid ${showGrid ? NEON_COLORS.neonPurple : 'transparent'}`
          }}
          whileTap={{ scale: 0.95 }}
        >
          📐 网格
        </motion.button>
      </div>

      <div className="flex flex-wrap items-center gap-1 p-3 rounded-xl backdrop-blur-sm max-w-[600px]"
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
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-8 h-6 rounded cursor-pointer"
          style={{ border: `1px solid ${NEON_COLORS.neonBlue}40` }}
        />
      </div>

      <div className="flex gap-4 items-start">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleAddFrame}
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: `${NEON_COLORS.neonGreen}40`,
                color: NEON_COLORS.neonGreen
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ➕ 添加帧
            </motion.button>
            <motion.button
              onClick={handleDuplicateFrame}
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: `${NEON_COLORS.neonBlue}40`,
                color: NEON_COLORS.neonBlue
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📋 复制帧
            </motion.button>
            <motion.button
              onClick={handleDeleteFrame}
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: `${NEON_COLORS.danger}40`,
                color: NEON_COLORS.danger
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={state.frames.length <= 1}
            >
              🗑️ 删除
            </motion.button>
          </div>

          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
              border: `3px solid ${NEON_COLORS.neonPink}50`
            }}
          >
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="cursor-crosshair"
              style={{
                width: CANVAS_DISPLAY_SIZE,
                height: CANVAS_DISPLAY_SIZE,
                imageRendering: 'pixelated'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            />
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleTogglePlay}
              className="px-4 py-2 rounded-lg font-bold flex items-center gap-2"
              style={{
                backgroundColor: isPlaying ? NEON_COLORS.danger : NEON_COLORS.neonGreen,
                color: NEON_COLORS.white
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? '⏸️ 暂停' : '▶️ 播放'}
            </motion.button>
            <motion.button
              onClick={handleClearFrame}
              className="px-3 py-2 rounded-lg"
              style={{
                backgroundColor: `${NEON_COLORS.danger}40`,
                color: NEON_COLORS.danger
              }}
              whileTap={{ scale: 0.95 }}
            >
              🗑️ 清空帧
            </motion.button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>时间轴</span>
          <div
            className="flex flex-col gap-1 p-2 rounded-xl overflow-y-auto max-h-[400px]"
            style={{
              backgroundColor: `${NEON_COLORS.surface}60`,
              border: `1px solid ${NEON_COLORS.neonPurple}30`
            }}
          >
            {state.frames.map((_, index) => (
              <motion.div
                key={index}
                onClick={() => handleSelectFrame(index)}
                className="relative cursor-pointer rounded overflow-hidden"
                style={{
                  border: `2px solid ${
                    isPlaying && playbackIndex === index
                      ? NEON_COLORS.neonGreen
                      : state.currentFrameIndex === index
                      ? NEON_COLORS.neonCyan
                      : 'transparent'
                  }`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <canvas
                  ref={index === state.currentFrameIndex ? previewRef : undefined}
                  width={60}
                  height={60}
                  className="block"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 text-center text-xs py-0.5"
                  style={{
                    backgroundColor: `${NEON_COLORS.darkPurple}80`,
                    color: NEON_COLORS.white
                  }}
                >
                  {index + 1}
                </div>
                {isPlaying && playbackIndex === index && (
                  <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {exportProgress > 0 && (
        <div className="w-full max-w-[300px]">
          <div className="text-sm mb-1" style={{ color: NEON_COLORS.neonCyan }}>
            导出中... {exportProgress}%
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${NEON_COLORS.darkPurple}60` }}>
            <div
              className="h-full transition-all"
              style={{
                width: `${exportProgress}%`,
                backgroundColor: NEON_COLORS.neonGreen
              }}
            />
          </div>
        </div>
      )}

      <motion.button
        onClick={handleSave}
        className="px-6 py-3 rounded-xl font-bold flex items-center gap-2"
        style={{
          backgroundColor: NEON_COLORS.neonGreen,
          color: NEON_COLORS.white,
          boxShadow: `0 0 20px ${NEON_COLORS.neonGreen}`
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        💾 {state.frames.length > 1 ? '导出GIF' : '导出PNG'}
      </motion.button>

      <div className="text-center text-sm" style={{ color: NEON_COLORS.textDim }}>
        创建逐帧动画，支持多帧编辑、预览播放和GIF导出
      </div>
    </div>
  );
}
