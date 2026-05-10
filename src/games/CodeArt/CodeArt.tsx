import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameRecord } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, NEON_COLORS } from '../../utils/constants';
import { CodeArtEngine, DEFAULT_PATTERNS, ArtPattern } from './engine';

interface CodeArtProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onExit: () => void;
}

const CANVAS_SIZE = 400;

export default function CodeArt({ onScoreUpdate, onGameOver, onExit }: CodeArtProps) {
  const [engine] = useState(() => new CodeArtEngine());
  const [state, setState] = useState(() => engine.getState());
  const [code, setCode] = useState(() => engine.getState().code);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPatterns, setShowPatterns] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { record, updateScore } = useGameRecord(STORAGE_KEYS.GAME_IDS.CODE_ART || 'codeart_highscore');

  const updateState = useCallback(() => {
    setState(engine.getState());
  }, [engine]);

  useEffect(() => {
    updateState();
    generateArt();
  }, [updateState]);

  const generateArt = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    engine.generate(ctx);
    updateState();
  }, [engine, updateState]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    engine.setCode(newCode);

    const validationErrors = engine.validateCode();
    setErrors(validationErrors);
  };

  const handleRun = () => {
    if (errors.length === 0) {
      generateArt();
      updateScore(10);
      onScoreUpdate(10);
    }
  };

  const handlePatternSelect = (pattern: ArtPattern) => {
    setCode(pattern.code);
    engine.loadPattern(pattern);
    setShowPatterns(false);
    generateArt();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `codeart_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    updateScore(20);
    onScoreUpdate(20);
  };

  const handleReset = () => {
    engine.reset();
    setCode(engine.getState().code);
    setErrors([]);
    generateArt();
  };

  const patterns = engine.getPatterns();

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

        <h1 className="text-2xl font-bold" style={{ color: NEON_COLORS.neonPink }}>代码艺术</h1>

        <div className="text-center">
          <div className="text-sm opacity-70" style={{ color: NEON_COLORS.gold }}>作品数</div>
          <div className="text-xl font-bold" style={{ color: NEON_COLORS.neonCyan }}>{record.gamesPlayed || 0}</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 w-full max-w-[900px]">
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: NEON_COLORS.neonCyan }}>
                代码编辑器
              </span>
              {errors.length > 0 && (
                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${NEON_COLORS.danger}40`, color: NEON_COLORS.danger }}>
                  有错误
                </span>
              )}
            </div>

            <motion.button
              onClick={() => setShowPatterns(!showPatterns)}
              className="px-3 py-1 rounded-lg text-sm"
              style={{
                backgroundColor: `${NEON_COLORS.neonPurple}40`,
                color: NEON_COLORS.neonPurple
              }}
              whileTap={{ scale: 0.95 }}
            >
              📐 预设图案 ({patterns.length})
            </motion.button>
          </div>

          {showPatterns && (
            <div className="p-3 rounded-xl max-h-[200px] overflow-y-auto"
              style={{
                backgroundColor: `${NEON_COLORS.surface}80`,
                border: `1px solid ${NEON_COLORS.neonPurple}40`
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                {patterns.map((pattern, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handlePatternSelect(pattern)}
                    className="p-2 rounded-lg text-left"
                    style={{
                      backgroundColor: `${NEON_COLORS.darkPurple}60`
                    }}
                    whileHover={{ scale: 1.02, backgroundColor: `${NEON_COLORS.neonPurple}40` }}
                  >
                    <div className="text-sm font-bold" style={{ color: NEON_COLORS.neonCyan }}>
                      {pattern.name}
                    </div>
                    <div className="text-xs" style={{ color: NEON_COLORS.textDim }}>
                      {pattern.description}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <textarea
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="flex-1 min-h-[250px] p-4 rounded-xl font-mono text-sm resize-none outline-none"
            style={{
              backgroundColor: '#1a1a2e',
              color: '#e0e0e0',
              border: `1px solid ${errors.length > 0 ? NEON_COLORS.danger : NEON_COLORS.neonBlue}40`,
              fontFamily: 'Monaco, Consolas, monospace',
              fontSize: '13px',
              lineHeight: '1.5'
            }}
            spellCheck={false}
          />

          {errors.length > 0 && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${NEON_COLORS.danger}20`, border: `1px solid ${NEON_COLORS.danger}40` }}>
              <div className="text-xs font-bold mb-1" style={{ color: NEON_COLORS.danger }}>错误:</div>
              {errors.map((error, index) => (
                <div key={index} className="text-xs font-mono" style={{ color: NEON_COLORS.danger }}>
                  {error}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs" style={{ color: NEON_COLORS.textDim }}>
            <span>可用变量:</span>
            <span className="px-2 py-1 rounded" style={{ backgroundColor: `${NEON_COLORS.darkPurple}60` }}>ctx</span>
            <span className="px-2 py-1 rounded" style={{ backgroundColor: `${NEON_COLORS.darkPurple}60` }}>width</span>
            <span className="px-2 py-1 rounded" style={{ backgroundColor: `${NEON_COLORS.darkPurple}60` }}>height</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
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
            />
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleRun}
              className="px-4 py-2 rounded-lg font-bold flex items-center gap-2"
              style={{
                backgroundColor: errors.length > 0 ? `${NEON_COLORS.danger}40` : NEON_COLORS.neonGreen,
                color: errors.length > 0 ? NEON_COLORS.danger : NEON_COLORS.white,
                boxShadow: errors.length > 0 ? 'none' : `0 0 15px ${NEON_COLORS.neonGreen}`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ▶️ 运行
            </motion.button>
            <motion.button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg font-bold"
              style={{
                backgroundColor: `${NEON_COLORS.warning}40`,
                color: NEON_COLORS.warning
              }}
              whileTap={{ scale: 0.95 }}
            >
              🔄 重置
            </motion.button>
            <motion.button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg font-bold"
              style={{
                backgroundColor: `${NEON_COLORS.neonBlue}40`,
                color: NEON_COLORS.neonBlue
              }}
              whileTap={{ scale: 0.95 }}
            >
              💾 保存
            </motion.button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl backdrop-blur-sm max-w-[600px]"
        style={{
          backgroundColor: `${NEON_COLORS.surface}60`,
          border: `1px solid ${NEON_COLORS.neonPurple}30`
        }}
      >
        <span className="text-sm" style={{ color: NEON_COLORS.textDim }}>快速插入:</span>
        {[
          { label: '圆', snippet: 'ctx.beginPath();\nctx.arc(x, y, r, 0, Math.PI * 2);\nctx.fill();' },
          { label: '矩形', snippet: 'ctx.fillRect(x, y, w, h);' },
          { label: '渐变', snippet: 'const grad = ctx.createLinearGradient(0, 0, width, 0);\ngrad.addColorStop(0, "#ff0000");\ngrad.addColorStop(1, "#0000ff");\nctx.fillStyle = grad;' },
          { label: '循环', snippet: 'for (let i = 0; i < 10; i++) {\n  // 你的代码\n}' }
        ].map((item, index) => (
          <motion.button
            key={index}
            onClick={() => {
              const newCode = code + '\n' + item.snippet;
              handleCodeChange(newCode);
            }}
            className="px-2 py-1 rounded text-xs"
            style={{
              backgroundColor: `${NEON_COLORS.neonPurple}30`,
              color: NEON_COLORS.neonPurple
            }}
            whileTap={{ scale: 0.95 }}
          >
            {item.label}
          </motion.button>
        ))}
      </div>

      <div className="text-center text-sm" style={{ color: NEON_COLORS.textDim }}>
        使用JavaScript代码创作艺术，支持多种预设图案和自定义代码
      </div>
    </div>
  );
}
