import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { EmojiMakerEngine, EMOJI_SHAPES, EMOJI_COLORS, EmojiLayer } from './engine';

interface EmojiMakerProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CANVAS_SIZE = 400;

export default function EmojiMaker({ onScoreUpdate, onGameOver, onExit }: EmojiMakerProps) {
  const [engine] = useState(() => new EmojiMakerEngine());
  const [state, setState] = useState(() => engine.getState());
  const [activeTab, setActiveTab] = useState<'face' | 'eyes' | 'eyebrows' | 'mouth' | 'accessories'>('face');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.GAME_IDS.EMOJI_MAKER || 'emojimaker_highscore');

  const updateState = useCallback(() => {
    setState(engine.getState());
  }, [engine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = state.backgroundColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const scale = CANVAS_SIZE / 100;

    for (const layer of state.layers) {
      if (!layer.visible) continue;

      ctx.save();
      ctx.translate(layer.x * scale, layer.y * scale);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.scale(layer.scale, layer.scale);

      const pathStr = getShapePath(layer);
      if (pathStr) {
        const path = new Path2D(pathStr);
        ctx.fillStyle = layer.color;
        ctx.fill(path);

        if (state.selectedLayerId === layer.id) {
          ctx.strokeStyle = NEON_COLORS.neonCyan;
          ctx.lineWidth = 2;
          ctx.stroke(path);
        }
      }

      ctx.restore();
    }
  }, [state.layers, state.backgroundColor, state.selectedLayerId]);

  const getShapePath = (layer: EmojiLayer): string => {
    const shapes = EMOJI_SHAPES[layer.type as keyof typeof EMOJI_SHAPES];
    if (!shapes) return '';

    const shape = shapes.find((s: any) => s.id === layer.shape);
    if (!shape) return '';

    if (layer.type === 'eyes') {
      return (shape as any).left || '';
    }
    return (shape as any).path || '';
  };

  const handleAddLayer = (shapeId: string) => {
    const colors = EMOJI_COLORS[activeTab] || EMOJI_COLORS.accessories;
    const color = colors[0];
    engine.addLayer(activeTab, shapeId, color);
    updateState();
  };

  const handleUpdateLayer = (layerId: string, updates: Partial<EmojiLayer>) => {
    engine.updateLayer(layerId, updates);
    updateState();
  };

  const handleRemoveLayer = (layerId: string) => {
    engine.removeLayer(layerId);
    updateState();
  };

  const handleMoveLayer = (dx: number, dy: number) => {
    if (state.selectedLayerId) {
      engine.moveLayer(state.selectedLayerId, dx, dy);
      updateState();
    }
  };

  const handleScaleLayer = (delta: number) => {
    if (state.selectedLayerId) {
      engine.scaleLayer(state.selectedLayerId, delta);
      updateState();
    }
  };

  const handleRotateLayer = (delta: number) => {
    if (state.selectedLayerId) {
      engine.rotateLayer(state.selectedLayerId, delta);
      updateState();
    }
  };

  const handleRandom = () => {
    engine.getRandomEmoji();
    updateState();
  };

  const handleSave = () => {
    const dataUrl = engine.saveEmoji();
    const link = document.createElement('a');
    link.download = `emoji_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    const score = state.layers.length * 10;
    onScoreUpdate(score);
    updateScore(score);
  };

  const handleReset = () => {
    engine.reset();
    updateState();
  };

  const selectedLayer = state.layers.find(l => l.id === state.selectedLayerId);
  const currentColors = selectedLayer ? (EMOJI_COLORS[selectedLayer.type as keyof typeof EMOJI_COLORS] || EMOJI_COLORS.accessories) : EMOJI_COLORS.face;

  const tabs = [
    { id: 'face', name: '脸型', icon: '😊' },
    { id: 'eyes', name: '眼睛', icon: '👁️' },
    { id: 'eyebrows', name: '眉毛', icon: '〰️' },
    { id: 'mouth', name: '嘴巴', icon: '👄' },
    { id: 'accessories', name: '装饰', icon: '✨' }
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[900px] px-4">
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

        <h1 className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>Emoji制作器</h1>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>创作数</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonBlue }}>{record.gamesPlayed || 0}</div>
        </div>
      </div>

      <div className="flex gap-6 w-full max-w-[900px]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
              border: `3px solid ${NEON_COLORS.neonPink}50`
            }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="cursor-pointer"
              style={{ backgroundColor: state.backgroundColor }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>背景:</span>
            {['#ffffff', '#f0f0f0', '#1a1a2e', '#ffcc00', '#ff9999', '#87ceeb'].map(color => (
              <motion.button
                key={color}
                onClick={() => { engine.setBackgroundColor(color); updateState(); }}
                className="w-8 h-8 rounded-lg border-2"
                style={{
                  backgroundColor: color,
                  borderColor: state.backgroundColor === color ? NEON_COLORS.neonCyan : 'transparent'
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex gap-2 p-2 rounded-xl backdrop-blur-sm"
            style={{
              backgroundColor: `${NEON_COLORS.surface}80`,
              border: `1px solid ${NEON_COLORS.neonBlue}30`
            }}
          >
            {tabs.map(tab => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex-1 py-2 px-3 rounded-lg font-bold text-sm flex items-center justify-center gap-1"
                style={{
                  backgroundColor: activeTab === tab.id ? NEON_COLORS.neonBlue : 'transparent',
                  color: activeTab === tab.id ? NEON_COLORS.white : NEON_COLORS.textDim,
                  border: `1px solid ${activeTab === tab.id ? NEON_COLORS.neonBlue : 'transparent'}`
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </motion.button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 p-3 rounded-xl backdrop-blur-sm max-h-[200px] overflow-y-auto"
            style={{
              backgroundColor: `${NEON_COLORS.surface}60`,
              border: `1px solid ${NEON_COLORS.neonPurple}30`
            }}
          >
            {(EMOJI_SHAPES[activeTab] as any[])?.map((shape: any) => (
              <motion.button
                key={shape.id}
                onClick={() => handleAddLayer(shape.id)}
                className="p-3 rounded-lg flex flex-col items-center gap-1"
                style={{
                  backgroundColor: `${NEON_COLORS.darkPurple}60`,
                  border: `1px solid ${NEON_COLORS.neonPurple}40`
                }}
                whileHover={{ scale: 1.05, backgroundColor: `${NEON_COLORS.neonPurple}40` }}
                whileTap={{ scale: 0.95 }}
              >
                <svg width="40" height="40" viewBox="0 0 100 100">
                  <path
                    d={shape.path || shape.left || ''}
                    fill="currentColor"
                    style={{ color: NEON_COLORS.neonCyan }}
                  />
                </svg>
                <span className="text-xs" style={{ color: NEON_COLORS.textDim }}>{shape.name}</span>
              </motion.button>
            ))}
          </div>

          {selectedLayer && (
            <div className="p-4 rounded-xl backdrop-blur-sm"
              style={{
                backgroundColor: `${NEON_COLORS.surface}80`,
                border: `1px solid ${NEON_COLORS.neonCyan}40`
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold" style={{ color: NEON_COLORS.neonCyan }}>
                  编辑: {selectedLayer.type}
                </span>
                <motion.button
                  onClick={() => handleRemoveLayer(selectedLayer.id)}
                  className="px-2 py-1 rounded text-sm"
                  style={{
                    backgroundColor: `${NEON_COLORS.danger}40`,
                    color: NEON_COLORS.danger
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  删除
                </motion.button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>颜色:</span>
                <div className="flex flex-wrap gap-1">
                  {currentColors.map(color => (
                    <motion.button
                      key={color}
                      onClick={() => handleUpdateLayer(selectedLayer.id, { color })}
                      className="w-6 h-6 rounded border-2"
                      style={{
                        backgroundColor: color,
                        borderColor: selectedLayer.color === color ? NEON_COLORS.white : 'transparent'
                      }}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.95 }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-center" style={{ color: NEON_COLORS.textDim }}>位置</span>
                  <div className="flex gap-1">
                    <motion.button
                      onClick={() => handleMoveLayer(-5, 0)}
                      className="flex-1 py-1 rounded text-lg"
                      style={{ backgroundColor: `${NEON_COLORS.darkPurple}60` }}
                      whileTap={{ scale: 0.95 }}
                    >←</motion.button>
                    <motion.button
                      onClick={() => handleMoveLayer(5, 0)}
                      className="flex-1 py-1 rounded text-lg"
                      style={{ backgroundColor: `${NEON_COLORS.darkPurple}60` }}
                      whileTap={{ scale: 0.95 }}
                    >→</motion.button>
                  </div>
                  <div className="flex gap-1">
                    <motion.button
                      onClick={() => handleMoveLayer(0, -5)}
                      className="flex-1 py-1 rounded text-lg"
                      style={{ backgroundColor: `${NEON_COLORS.darkPurple}60` }}
                      whileTap={{ scale: 0.95 }}
                    >↑</motion.button>
                    <motion.button
                      onClick={() => handleMoveLayer(0, 5)}
                      className="flex-1 py-1 rounded text-lg"
                      style={{ backgroundColor: `${NEON_COLORS.darkPurple}60` }}
                      whileTap={{ scale: 0.95 }}
                    >↓</motion.button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-center" style={{ color: NEON_COLORS.textDim }}>大小</span>
                  <motion.button
                    onClick={() => handleScaleLayer(0.1)}
                    className="py-1 rounded text-lg"
                    style={{ backgroundColor: `${NEON_COLORS.darkPurple}60` }}
                    whileTap={{ scale: 0.95 }}
                  >+</motion.button>
                  <motion.button
                    onClick={() => handleScaleLayer(-0.1)}
                    className="py-1 rounded text-lg"
                    style={{ backgroundColor: `${NEON_COLORS.darkPurple}60` }}
                    whileTap={{ scale: 0.95 }}
                  >-</motion.button>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-center" style={{ color: NEON_COLORS.textDim }}>旋转</span>
                  <motion.button
                    onClick={() => handleRotateLayer(-15)}
                    className="py-1 rounded text-lg"
                    style={{ backgroundColor: `${NEON_COLORS.darkPurple}60` }}
                    whileTap={{ scale: 0.95 }}
                  >↺</motion.button>
                  <motion.button
                    onClick={() => handleRotateLayer(15)}
                    className="py-1 rounded text-lg"
                    style={{ backgroundColor: `${NEON_COLORS.darkPurple}60` }}
                    whileTap={{ scale: 0.95 }}
                  >↻</motion.button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 p-2 rounded-xl backdrop-blur-sm"
            style={{
              backgroundColor: `${NEON_COLORS.surface}60`,
              border: `1px solid ${NEON_COLORS.neonGreen}30`
            }}
          >
            <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>图层:</span>
            <div className="flex-1 flex gap-1 overflow-x-auto">
              {state.layers.map((layer, index) => (
                <motion.button
                  key={layer.id}
                  onClick={() => { engine.selectLayer(layer.id); updateState(); }}
                  className="px-3 py-2 rounded-lg text-sm flex items-center gap-1 whitespace-nowrap"
                  style={{
                    backgroundColor: state.selectedLayerId === layer.id ? NEON_COLORS.neonCyan : `${NEON_COLORS.darkPurple}60`,
                    color: state.selectedLayerId === layer.id ? NEON_COLORS.white : NEON_COLORS.textDim,
                    opacity: layer.visible ? 1 : 0.5
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>{index + 1}. {layer.type}</span>
                  <span
                    onClick={(e) => { e.stopPropagation(); engine.toggleLayerVisibility(layer.id); updateState(); }}
                    className="ml-1"
                  >
                    {layer.visible ? '👁️' : '🚫'}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          onClick={handleRandom}
          className="px-6 py-3 rounded-xl font-bold flex items-center gap-2"
          style={{
            backgroundColor: `${NEON_COLORS.neonPurple}40`,
            color: NEON_COLORS.neonPurple,
            border: `2px solid ${NEON_COLORS.neonPurple}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🎲 随机生成
        </motion.button>
        <motion.button
          onClick={handleReset}
          className="px-6 py-3 rounded-xl font-bold flex items-center gap-2"
          style={{
            backgroundColor: `${NEON_COLORS.danger}40`,
            color: NEON_COLORS.danger,
            border: `2px solid ${NEON_COLORS.danger}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄 重置
        </motion.button>
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
          💾 保存Emoji
        </motion.button>
      </div>

      <div className="text-center text-sm" style={{ color: NEON_COLORS.textDim }}>
        选择组件创建你的专属Emoji，支持移动、缩放和旋转调整
      </div>
    </div>
  );
}
