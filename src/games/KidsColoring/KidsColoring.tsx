import { useState, useRef, useCallback, useEffect } from 'react';
import { KidsColoringEngine, Stroke, Template } from './engine';
import { NEON_COLORS } from '../../utils/constants';
import { motion } from 'framer-motion';

type GamePhase = 'menu' | 'playing';

export default function KidsColoring() {
  const [engine] = useState(() => new KidsColoringEngine());
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [currentColor, setCurrentColor] = useState('#FF6B6B');
  const [brushSize, setBrushSize] = useState(8);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isErasing, setIsErasing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const boardWidth = 500;
  const boardHeight = 400;

  useEffect(() => {
    setColors(engine.getColors());
    setTemplates(engine.getTemplates());
  }, [engine]);

  const loadState = useCallback(() => {
    const state = engine.getState();
    setStrokes(state.strokes);
    setCurrentStroke(state.currentStroke);
    setCurrentColor(state.currentColor);
    setBrushSize(state.brushSize);
    setSelectedTemplate(state.getSelectedTemplate());
    setIsErasing(state.isErasing);
  }, [engine]);

  const startGame = useCallback((templateIndex: number = 0) => {
    engine.selectTemplate(templateIndex);
    engine.clear();
    loadState();
    setPhase('playing');
  }, [engine, loadState]);

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  const handleStart = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (phase !== 'playing') return;
    e.preventDefault();
    isDrawing.current = true;
    const coords = getCanvasCoords(e);
    engine.startStroke(coords.x, coords.y);
    setCurrentStroke(engine.getState().currentStroke);
  }, [engine, phase, getCanvasCoords]);

  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || phase !== 'playing') return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    engine.continueStroke(coords.x, coords.y);
    setCurrentStroke(engine.getState().currentStroke);
  }, [engine, phase, getCanvasCoords]);

  const handleEnd = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    engine.endStroke();
    setStroks([...engine.getState().strokes]);
    setCurrentStroke(null);
  }, [engine]);

  const setStroks = (newStrokes: Stroke[]) => {
    setStrokes(newStrokes);
  };

  const drawStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, boardWidth, boardHeight);

    if (selectedTemplate) {
      ctx.strokeStyle = '#ffffff40';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      selectedTemplate.regions.forEach(region => {
        ctx.beginPath();
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    const allStrokes = [...strokes];
    if (currentStroke) {
      allStrokes.push(currentStroke);
    }

    allStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [strokes, currentStroke, selectedTemplate]);

  useEffect(() => {
    drawStrokes();
  }, [drawStrokes]);

  if (phase === 'menu') {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            🎨 儿童涂色
          </h1>
          <p className="text-gray-400 mb-8">Kids Coloring</p>

          <div className="glass-card rounded-2xl p-6 max-w-md mx-auto mb-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-2">
              <li>1. 选择喜欢的图案</li>
              <li>2. 选择颜色开始涂色</li>
              <li>3. 拖动鼠标/手指画画</li>
              <li>4. 完成后保存你的作品!</li>
            </ul>
          </div>

          <h3 className="text-lg font-bold text-gray-300 mb-4">选择图案</h3>
          <div className="flex flex-wrap gap-4 mb-8 justify-center">
            {templates.map((template, index) => (
              <motion.button
                key={template.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startGame(index)}
                className="w-20 h-20 rounded-xl flex flex-col items-center justify-center transition-all"
                style={{
                  background: `linear-gradient(135deg, ${NEON_COLORS.primary}40, ${NEON_COLORS.secondary}40)`,
                  border: `2px solid ${NEON_COLORS.primary}50`,
                }}
              >
                <span className="text-3xl">{template.emoji}</span>
                <span className="text-xs text-gray-400 mt-1">{template.name}</span>
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => startGame(0)}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{ 
              background: `linear-gradient(135deg, ${NEON_COLORS.primary}, ${NEON_COLORS.secondary})`,
              boxShadow: `0 0 30px ${NEON_COLORS.primary}50`
            }}
          >
            开始涂色
          </motion.button>
        </motion.div>

        <style>{`
          .glass-card {
            background: rgba(26, 26, 46, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(108, 92, 231, 0.3);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: `linear-gradient(135deg, ${NEON_COLORS.background} 0%, ${NEON_COLORS.surface} 100%)` }}
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-4"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          🎨 儿童涂色 - {selectedTemplate?.emoji} {selectedTemplate?.name}
        </h1>
      </motion.div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2 justify-center mb-4 max-w-lg">
          {colors.map((color, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                engine.setColor(color);
                setCurrentColor(color);
                setIsErasing(false);
              }}
              className={`w-8 h-8 rounded-full transition-all ${
                currentColor === color && !isErasing ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''
              }`}
              style={{
                backgroundColor: color,
                border: color === '#FFFFFF' ? '2px solid #666' : 'none'
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-4 justify-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">画笔:</span>
            <input
              type="range"
              min="2"
              max="30"
              value={brushSize}
              onChange={(e) => {
                engine.setBrushSize(parseInt(e.target.value));
                setBrushSize(parseInt(e.target.value));
              }}
              className="w-24"
            />
            <span className="text-gray-400 text-sm w-8">{brushSize}</span>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              engine.setEraser(!isErasing);
              setIsErasing(!isErasing);
            }}
            className={`px-4 py-2 rounded-lg font-bold text-sm ${
              isErasing ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            🧹 橡皮擦
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => engine.undo()}
            className="px-4 py-2 rounded-lg font-bold text-sm bg-gray-700 text-gray-300"
          >
            ↩️ 撤销
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              engine.clear();
              setStrokes([]);
            }}
            className="px-4 py-2 rounded-lg font-bold text-sm bg-red-700 text-white"
          >
            🗑️ 清空
          </motion.button>
        </div>
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: `3px solid ${NEON_COLORS.primary}40`,
            boxShadow: `0 0 30px ${NEON_COLORS.primary}30`
          }}
        >
          <canvas
            ref={canvasRef}
            width={boardWidth}
            height={boardHeight}
            className="cursor-crosshair touch-none"
            style={{ 
              maxWidth: '100%',
              background: '#1a1a2e'
            }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 text-center text-gray-400 text-sm"
      >
        <p>用鼠标或手指在画布上画画</p>
      </motion.div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => {
            engine.clear();
            setStrokes([]);
          }}
          className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl text-white font-bold hover:from-red-700 hover:to-orange-700 transition-all"
        >
          🔄 重新开始
        </button>
        <button
          onClick={() => setPhase('menu')}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors"
        >
          🏠 返回菜单
        </button>
      </div>

      <style>{`
        .glass-card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 92, 231, 0.3);
        }
      `}</style>
    </div>
  );
}
