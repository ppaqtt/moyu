import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { MemeMakerEngine, FONT_FAMILIES, TEXT_COLORS, STROKE_COLORS, CANVAS_PRESETS } from './engine';

interface MemeCreatorProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CANVAS_DISPLAY_SIZE = 400;

export default function MemeCreator({ onScoreUpdate, onGameOver, onExit }: MemeCreatorProps) {
  const [engine] = useState(() => new MemeMakerEngine());
  const [state, setState] = useState(() => engine.getState());
  const [selectedPreset, setSelectedPreset] = useState(CANVAS_PRESETS[0]);
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [fontSize, setFontSize] = useState(48);
  const [textColor, setTextColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontFamily, setFontFamily] = useState('Impact');
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [draggedText, setDraggedText] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showPresets, setShowPresets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.GAME_IDS.MEME_CREATOR || 'memecreator_highscore');

  const updateState = useCallback(() => {
    setState(engine.getState());
  }, [engine]);

  const scale = CANVAS_DISPLAY_SIZE / Math.max(selectedPreset.width, selectedPreset.height);

  useEffect(() => {
    updateState();
  }, [updateState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engine.draw(ctx, 1, selectedPreset.width, selectedPreset.height);
  }, [state, engine, selectedPreset]);

  const handleTopTextChange = (text: string) => {
    setTopText(text);
    engine.setTopText(text);
    engine.setTextStyle('top');
  };

  const handleBottomTextChange = (text: string) => {
    setBottomText(text);
    engine.setBottomText(text);
    engine.setTextStyle('bottom');
  };

  const handleAddTopText = () => {
    engine.setTextStyle('top');
    engine.setTopText(topText);
    engine.setFontSize(fontSize);
    engine.setTextColor(textColor);
    engine.setStrokeColor(strokeColor);
    engine.setStrokeWidth(strokeWidth);
    engine.setFontFamily(fontFamily);
    engine.addTextElement();
    updateState();
  };

  const handleAddBottomText = () => {
    engine.setTextStyle('bottom');
    engine.setBottomText(bottomText);
    engine.setFontSize(fontSize);
    engine.setTextColor(textColor);
    engine.setStrokeColor(strokeColor);
    engine.setStrokeWidth(strokeWidth);
    engine.setFontFamily(fontFamily);
    engine.addTextElement();
    updateState();
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    engine.setFontSize(size);
    if (selectedTextId) {
      engine.updateSelectedText({ fontSize: size });
      updateState();
    }
  };

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    engine.setTextColor(color);
    if (selectedTextId) {
      engine.updateSelectedText({ color });
      updateState();
    }
  };

  const handleStrokeColorChange = (color: string) => {
    setStrokeColor(color);
    engine.setStrokeColor(color);
    if (selectedTextId) {
      engine.updateSelectedText({ strokeColor: color });
      updateState();
    }
  };

  const handleStrokeWidthChange = (width: number) => {
    setStrokeWidth(width);
    engine.setStrokeWidth(width);
    if (selectedTextId) {
      engine.updateSelectedText({ strokeWidth: width });
      updateState();
    }
  };

  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
    engine.setFontFamily(family);
    if (selectedTextId) {
      engine.updateSelectedText({ fontFamily: family });
      updateState();
    }
  };

  const handlePresetSelect = (preset: typeof CANVAS_PRESETS[0]) => {
    engine.setCanvasSize(preset.width, preset.height);
    setSelectedPreset(preset);
    updateState();
    setShowPresets(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      engine.setBackgroundImage(dataUrl);
      updateState();
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = () => {
    engine.removeBackgroundImage();
    updateState();
  };

  const handleBackgroundColorChange = (color: string) => {
    engine.setBackgroundColor(color);
    updateState();
  };

  const handleClearAll = () => {
    engine.clearTexts();
    setTopText('');
    setBottomText('');
    setSelectedTextId(null);
    updateState();
  };

  const handleSelectText = (id: string) => {
    setSelectedTextId(id);
    engine.selectText(id);
    updateState();
  };

  const handleDeleteSelectedText = () => {
    if (selectedTextId) {
      engine.removeTextElement(selectedTextId);
      setSelectedTextId(null);
      updateState();
    }
  };

  const handleRotateSelected = (delta: number) => {
    if (selectedTextId) {
      engine.rotateText(selectedTextId, delta);
      updateState();
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    for (let i = state.textElements.length - 1; i >= 0; i--) {
      const element = state.textElements[i];
      const canvas2 = document.createElement('canvas');
      const ctx2 = canvas2.getContext('2d');
      if (ctx2) {
        ctx2.font = `${element.fontWeight} ${element.fontStyle} ${element.fontSize}px "${element.fontFamily}"`;
        const metrics = ctx2.measureText(element.text);
        const halfWidth = metrics.width / 2;
        const halfHeight = element.fontSize / 2;

        if (
          x >= element.x - halfWidth - 10 &&
          x <= element.x + halfWidth + 10 &&
          y >= element.y - halfHeight - 10 &&
          y <= element.y + halfHeight + 10
        ) {
          setSelectedTextId(element.id);
          engine.selectText(element.id);
          setDraggedText(element.id);
          setDragOffset({ x: x - element.x, y: y - element.y });
          updateState();
          return;
        }
      }
    }

    setSelectedTextId(null);
    engine.selectText(null);
    updateState();
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedText) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale - dragOffset.x;
    const y = (e.clientY - rect.top) / scale - dragOffset.y;

    engine.moveText(draggedText, x - (state.textElements.find(t => t.id === draggedText)?.x || 0), y - (state.textElements.find(t => t.id === draggedText)?.y || 0));
    updateState();
  };

  const handleCanvasMouseUp = () => {
    setDraggedText(null);
  };

  const handleSave = () => {
    const dataUrl = engine.saveMeme();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `meme_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      const score = state.textElements.length * 20 + (state.backgroundImage ? 50 : 0);
      onScoreUpdate(score);
      updateScore(score);
    }
  };

  const selectedText = state.textElements.find(t => t.id === selectedTextId);

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

        <h1 className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>表情包DIY</h1>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>作品数</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{record.gamesPlayed || 0}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl backdrop-blur-sm"
        style={{
          backgroundColor: `${NEON_COLORS.surface}80`,
          border: `1px solid ${NEON_COLORS.neonBlue}30`
        }}
      >
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
            📐 {selectedPreset.name}
          </motion.button>
          {showPresets && (
            <div className="absolute top-full mt-2 left-0 p-2 rounded-lg z-10"
              style={{
                backgroundColor: NEON_COLORS.darkPurple,
                border: `1px solid ${NEON_COLORS.neonBlue}40`
              }}
            >
              {CANVAS_PRESETS.map(preset => (
                <motion.button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className="block w-full px-3 py-2 rounded text-sm"
                  style={{
                    backgroundColor: selectedPreset.name === preset.name ? `${NEON_COLORS.neonCyan}40` : 'transparent',
                    color: NEON_COLORS.text
                  }}
                  whileHover={{ backgroundColor: `${NEON_COLORS.neonPurple}40` }}
                >
                  {preset.name} ({preset.width}x{preset.height})
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
        <motion.button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: `${NEON_COLORS.neonBlue}40`,
            color: NEON_COLORS.neonBlue
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🖼️ 上传图片
        </motion.button>

        {state.backgroundImage && (
          <motion.button
            onClick={handleRemoveBackground}
            className="px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: `${NEON_COLORS.danger}40`,
              color: NEON_COLORS.danger
            }}
            whileTap={{ scale: 0.95 }}
          >
            ❌ 移除背景
          </motion.button>
        )}

        <motion.button
          onClick={handleClearAll}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: `${NEON_COLORS.danger}40`,
            color: NEON_COLORS.danger
          }}
          whileTap={{ scale: 0.95 }}
        >
          🗑️ 清空文字
        </motion.button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 w-full max-w-[900px]">
        <div className="flex-1 flex flex-col items-center gap-4">
          <div className="flex gap-2 w-full">
            <input
              type="text"
              value={topText}
              onChange={(e) => handleTopTextChange(e.target.value)}
              placeholder="输入顶部文字..."
              className="flex-1 px-4 py-2 rounded-lg outline-none"
              style={{
                backgroundColor: `${NEON_COLORS.darkPurple}60`,
                color: NEON_COLORS.text,
                border: `1px solid ${NEON_COLORS.neonBlue}40`
              }}
            />
            <motion.button
              onClick={handleAddTopText}
              className="px-4 py-2 rounded-lg font-bold"
              style={{
                backgroundColor: `${NEON_COLORS.neonCyan}40`,
                color: NEON_COLORS.neonCyan
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ➕ 上
            </motion.button>
          </div>

          <div className="flex gap-2 w-full">
            <input
              type="text"
              value={bottomText}
              onChange={(e) => handleBottomTextChange(e.target.value)}
              placeholder="输入底部文字..."
              className="flex-1 px-4 py-2 rounded-lg outline-none"
              style={{
                backgroundColor: `${NEON_COLORS.darkPurple}60`,
                color: NEON_COLORS.text,
                border: `1px solid ${NEON_COLORS.neonBlue}40`
              }}
            />
            <motion.button
              onClick={handleAddBottomText}
              className="px-4 py-2 rounded-lg font-bold"
              style={{
                backgroundColor: `${NEON_COLORS.neonCyan}40`,
                color: NEON_COLORS.neonCyan
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ➕ 下
            </motion.button>
          </div>

          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              backgroundColor: state.backgroundColor,
              boxShadow: `0 0 30px ${NEON_COLORS.neonPink}30`,
              border: `3px solid ${NEON_COLORS.neonPink}50`
            }}
          >
            <canvas
              ref={canvasRef}
              width={selectedPreset.width}
              height={selectedPreset.height}
              style={{
                width: CANVAS_DISPLAY_SIZE,
                height: CANVAS_DISPLAY_SIZE,
                imageRendering: 'auto'
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 rounded-xl backdrop-blur-sm min-w-[280px]"
          style={{
            backgroundColor: `${NEON_COLORS.surface}80`,
            border: `1px solid ${NEON_COLORS.neonPurple}30`
          }}
        >
          <div className="text-sm font-bold" style={{ color: NEON_COLORS.neonCyan }}>
            文字样式
          </div>

          <div className="flex flex-wrap gap-1">
            <span className="text-xs mr-1" style={{ color: NEON_COLORS.textDim }}>颜色:</span>
            {TEXT_COLORS.map(color => (
              <motion.button
                key={color}
                onClick={() => handleTextColorChange(color)}
                className="w-6 h-6 rounded border-2"
                style={{
                  backgroundColor: color,
                  borderColor: textColor === color ? NEON_COLORS.white : 'transparent'
                }}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            <span className="text-xs mr-1" style={{ color: NEON_COLORS.textDim }}>描边:</span>
            {STROKE_COLORS.map(color => (
              <motion.button
                key={color}
                onClick={() => handleStrokeColorChange(color)}
                className="w-6 h-6 rounded border-2"
                style={{
                  backgroundColor: color,
                  borderColor: strokeColor === color ? NEON_COLORS.neonCyan : 'transparent'
                }}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: NEON_COLORS.textDim }}>描边粗细:</span>
            <input
              type="range"
              min="0"
              max="8"
              value={strokeWidth}
              onChange={(e) => handleStrokeWidthChange(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs w-4" style={{ color: NEON_COLORS.neonCyan }}>{strokeWidth}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: NEON_COLORS.textDim }}>字体大小:</span>
            <input
              type="range"
              min="12"
              max="96"
              value={fontSize}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs w-8" style={{ color: NEON_COLORS.neonCyan }}>{fontSize}</span>
          </div>

          <div className="flex flex-wrap gap-1">
            <span className="text-xs mr-1" style={{ color: NEON_COLORS.textDim }}>字体:</span>
            {FONT_FAMILIES.map(font => (
              <motion.button
                key={font}
                onClick={() => handleFontFamilyChange(font)}
                className="px-2 py-1 rounded text-xs"
                style={{
                  backgroundColor: fontFamily === font ? `${NEON_COLORS.neonBlue}40` : 'transparent',
                  color: fontFamily === font ? NEON_COLORS.neonCyan : NEON_COLORS.textDim,
                  fontFamily: font
                }}
                whileHover={{ scale: 1.05 }}
              >
                {font.split(' ')[0]}
              </motion.button>
            ))}
          </div>

          {selectedText && (
            <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: `${NEON_COLORS.darkPurple}40` }}>
              <div className="text-xs mb-2" style={{ color: NEON_COLORS.neonPink }}>
                已选中文字
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => handleRotateSelected(-15)}
                  className="px-3 py-1 rounded text-sm"
                  style={{ backgroundColor: `${NEON_COLORS.neonPurple}40`, color: NEON_COLORS.neonPurple }}
                  whileTap={{ scale: 0.95 }}
                >
                  ↺
                </motion.button>
                <motion.button
                  onClick={() => handleRotateSelected(15)}
                  className="px-3 py-1 rounded text-sm"
                  style={{ backgroundColor: `${NEON_COLORS.neonPurple}40`, color: NEON_COLORS.neonPurple }}
                  whileTap={{ scale: 0.95 }}
                >
                  ↻
                </motion.button>
                <motion.button
                  onClick={handleDeleteSelectedText}
                  className="px-3 py-1 rounded text-sm"
                  style={{ backgroundColor: `${NEON_COLORS.danger}40`, color: NEON_COLORS.danger }}
                  whileTap={{ scale: 0.95 }}
                >
                  🗑️
                </motion.button>
              </div>
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-1">
            <span className="text-xs mr-1" style={{ color: NEON_COLORS.textDim }}>背景:</span>
            {['#ffffff', '#000000', '#f0f0f0', '#ffcc00'].map(color => (
              <motion.button
                key={color}
                onClick={() => handleBackgroundColorChange(color)}
                className="w-6 h-6 rounded border-2"
                style={{
                  backgroundColor: color,
                  borderColor: state.backgroundColor === color ? NEON_COLORS.neonGreen : 'transparent'
                }}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>
        </div>
      </div>

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
        💾 保存表情包
      </motion.button>

      <div className="text-center text-sm" style={{ color: NEON_COLORS.textDim }}>
        输入文字并拖动调整位置，创建专属表情包
      </div>
    </div>
  );
}
