import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { ColoringBookEngine, COLOR_PALETTE, TEMPLATES, ColorRegion } from './engine';

interface ColoringBookProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

export default function ColoringBook({ onScoreUpdate, onGameOver, onExit }: ColoringBookProps) {
  const [engine] = useState(() => new ColoringBookEngine());
  const [state, setState] = useState(() => engine.getState());
  const [showComplete, setShowComplete] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.GAME_IDS.COLORING_BOOK || 'coloringbook_highscore');

  const updateState = useCallback(() => {
    setState(engine.getState());
  }, [engine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engine.loadTemplate(0, ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
    updateState();
  }, [engine, updateState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (const region of state.regions) {
      ctx.fillStyle = region.color;
      ctx.fill(region.path);
      
      if (!region.filled) {
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.stroke(region.path);
        
        const center = getRegionCenter(region);
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(region.number.toString(), center.x, center.y);
      }
    }
  }, [state.regions]);

  useEffect(() => {
    if (state.isComplete && state.totalRegions > 0) {
      setShowComplete(true);
      const score = Math.round(state.totalRegions * 10 * (1 + engine.getProgress() / 100));
      onScoreUpdate(score);
      updateScore(score);
    }
  }, [state.isComplete, state.totalRegions, onScoreUpdate, updateScore, engine]);

  const getRegionCenter = (region: ColorRegion): { x: number; y: number } => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };

    ctx.fillStyle = '#000000';
    ctx.fill(region.path);
    
    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    let sumX = 0, sumY = 0, count = 0;
    
    for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
      for (let x = 0; x < CANVAS_WIDTH; x += 4) {
        const idx = (y * CANVAS_WIDTH + x) * 4;
        if (imageData.data[idx] < 128) {
          sumX += x;
          sumY += y;
          count++;
        }
      }
    }
    
    return count > 0 ? { x: sumX / count, y: sumY / count } : { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (const region of state.regions) {
      if (!region.filled && region.number === state.selectedNumber) {
        ctx.fillStyle = '#000000';
        ctx.fill(region.path);
        const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
        
        if (pixel[0] < 128 || pixel[1] < 128 || pixel[2] < 128) {
          engine.fillRegionById(region.id);
          updateState();
          return;
        }
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        for (const r of state.regions) {
          ctx.fillStyle = r.color;
          ctx.fill(r.path);
        }
      }
    }
  };

  const handleTemplateChange = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    engine.loadTemplate(index, ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
    setShowComplete(false);
    updateState();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = engine.saveImage(canvas);
    const link = document.createElement('a');
    link.download = `coloring_${TEMPLATES[state.currentTemplate].name}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleReset = () => {
    engine.reset();
    setShowComplete(false);
    updateState();
  };

  const progress = engine.getProgress();

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
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>模板</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonPink }}>
              {TEMPLATES[state.currentTemplate]?.name || '无'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>进度</div>
            <div className="text-2xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{progress}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>完成</div>
            <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>
              {state.completedRegions}/{state.totalRegions}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>最高</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.bestScore}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>选择模板:</span>
        {TEMPLATES.map((template, index) => (
          <motion.button
            key={index}
            onClick={() => handleTemplateChange(index)}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: state.currentTemplate === index ? NEON_COLORS.neonPink : `${NEON_COLORS.darkPurple}60`,
              color: state.currentTemplate === index ? NEON_COLORS.white : NEON_COLORS.textDim,
              border: `1px solid ${state.currentTemplate === index ? NEON_COLORS.neonPink : 'transparent'}`
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {template.name}
          </motion.button>
        ))}
      </div>

      <div className="w-full max-w-[800px] h-3 rounded-full overflow-hidden" style={{ backgroundColor: `${NEON_COLORS.darkPurple}60` }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            backgroundColor: NEON_COLORS.neonGreen,
            boxShadow: `0 0 10px ${NEON_COLORS.neonGreen}`
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl backdrop-blur-sm"
        style={{
          backgroundColor: `${NEON_COLORS.surface}80`,
          border: `1px solid ${NEON_COLORS.neonBlue}30`
        }}
      >
        <span className="text-sm mr-2" style={{ color: NEON_COLORS.textDim }}>选择颜色:</span>
        {COLOR_PALETTE.map((palette) => (
          <motion.button
            key={palette.number}
            onClick={() => { engine.setColor(palette.color, palette.number); updateState(); }}
            className="flex flex-col items-center gap-1 p-2 rounded-lg"
            style={{
              backgroundColor: state.selectedNumber === palette.number ? `${palette.color}40` : 'transparent',
              border: `2px solid ${state.selectedNumber === palette.number ? palette.color : 'transparent'}`
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
              style={{
                backgroundColor: palette.color,
                color: '#ffffff',
                boxShadow: state.selectedNumber === palette.number ? `0 0 10px ${palette.color}` : 'none'
              }}
            >
              {palette.number}
            </div>
            <span className="text-xs" style={{ color: NEON_COLORS.textDim }}>{palette.name}</span>
          </motion.button>
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
          className="cursor-pointer"
          style={{ backgroundColor: '#ffffff' }}
          onClick={handleCanvasClick}
        />
        
        {showComplete && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="p-8 rounded-2xl backdrop-blur-xl flex flex-col items-center gap-4"
              style={{
                backgroundColor: `${NEON_COLORS.surface}95`,
                border: `2px solid ${NEON_COLORS.neonGreen}`,
                boxShadow: `0 0 40px ${NEON_COLORS.neonGreen}40`
              }}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <div className="text-5xl">🎨</div>
              <h2 className="text-3xl font-bold" style={{ color: NEON_COLORS.neonGreen }}>完成!</h2>
              <p style={{ color: NEON_COLORS.text }}>太棒了!你完成了这幅填色作品!</p>
              <div className="flex gap-4">
                <motion.button
                  onClick={handleSave}
                  className="px-6 py-3 rounded-xl font-bold"
                  style={{
                    backgroundColor: NEON_COLORS.neonBlue,
                    color: NEON_COLORS.white,
                    boxShadow: `0 0 20px ${NEON_COLORS.neonBlue}`
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  保存作品
                </motion.button>
                <motion.button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-xl font-bold"
                  style={{
                    backgroundColor: NEON_COLORS.neonPink,
                    color: NEON_COLORS.white,
                    boxShadow: `0 0 20px ${NEON_COLORS.neonPink}`
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  再画一次
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          onClick={() => { engine.undo(); updateState(); }}
          className="px-4 py-2 rounded-lg font-bold"
          style={{
            backgroundColor: `${NEON_COLORS.warning}40`,
            color: NEON_COLORS.warning,
            border: `1px solid ${NEON_COLORS.warning}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          撤销
        </motion.button>
        <motion.button
          onClick={handleReset}
          className="px-4 py-2 rounded-lg font-bold"
          style={{
            backgroundColor: `${NEON_COLORS.danger}40`,
            color: NEON_COLORS.danger,
            border: `1px solid ${NEON_COLORS.danger}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          重置
        </motion.button>
        <motion.button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg font-bold"
          style={{
            backgroundColor: `${NEON_COLORS.neonGreen}40`,
            color: NEON_COLORS.neonGreen,
            border: `1px solid ${NEON_COLORS.neonGreen}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          保存
        </motion.button>
      </div>

      <div className="text-center text-sm" style={{ color: NEON_COLORS.textDim }}>
        点击带有数字的区域进行填色，选择对应数字的颜色填充相应区域
      </div>
    </div>
  );
}
