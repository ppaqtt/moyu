import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Maze3DEngine } from './engine';

const SCREEN_WIDTH = 640;
const SCREEN_HEIGHT = 400;
const FOV = Math.PI / 3;

export default function Maze3D() {
  const [engine] = useState(() => new Maze3DEngine());
  const [gameState, setGameState] = useState(() => engine.getState());
  const [showMenu, setShowMenu] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const animationFrameId = useRef<number>();

  const updateState = useCallback(() => {
    setGameState(engine.getState());
  }, [engine]);

  const renderScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = engine.getState();
    const player = state.player;

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Draw ceiling
    const gradient = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT / 2);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2);

    // Draw floor
    const floorGradient = ctx.createLinearGradient(0, SCREEN_HEIGHT / 2, 0, SCREEN_HEIGHT);
    floorGradient.addColorStop(0, '#2a2a3e');
    floorGradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT / 2);

    // Cast rays
    for (let i = 0; i < SCREEN_WIDTH; i++) {
      const rayAngle = player.angle - FOV / 2 + (i / SCREEN_WIDTH) * FOV;
      const ray = engine.castRay(rayAngle);

      // Fish-eye correction
      const correctedDistance = ray.distance * Math.cos(rayAngle - player.angle);

      // Calculate wall height
      const wallHeight = Math.min(SCREEN_HEIGHT, SCREEN_HEIGHT / correctedDistance);

      // Calculate wall color based on distance and type
      let wallColor;
      if (ray.cellType === 'door') {
        const brightness = Math.max(50, 200 - correctedDistance * 20);
        wallColor = `rgb(${brightness}, ${brightness * 0.5}, 0)`;
      } else {
        const brightness = Math.max(50, 200 - correctedDistance * 20);
        const colorVariation = Math.floor(ray.textureX * 30);
        wallColor = `rgb(${brightness - colorVariation}, ${brightness + colorVariation}, ${brightness + 20})`;
      }

      // Draw wall slice
      const top = (SCREEN_HEIGHT - wallHeight) / 2;
      ctx.fillStyle = wallColor;
      ctx.fillRect(i, top, 1, wallHeight);

      // Add wall shading
      const shadeIntensity = correctedDistance / 10;
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.7, shadeIntensity)})`;
      ctx.fillRect(i, top, 1, wallHeight);
    }

    // Draw key indicators if near
    const playerMapX = Math.floor(player.x);
    const playerMapY = Math.floor(player.y);
    
    // Check nearby cells for keys
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const checkX = playerMapX + dx;
        const checkY = playerMapY + dy;
        
        if (checkX >= 0 && checkX < state.maze[0].length && checkY >= 0 && checkY < state.maze.length) {
          const cell = state.maze[checkY][checkX];
          
          if (cell.type === 'key') {
            const keyX = checkX + 0.5 - player.x;
            const keyY = checkY + 0.5 - player.y;
            const distance = Math.sqrt(keyX * keyX + keyY * keyY);
            
            const angleToKey = Math.atan2(keyY, keyX);
            let angleDiff = angleToKey - player.angle;
            
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            if (Math.abs(angleDiff) < FOV / 2 && distance < 5) {
              const screenX = SCREEN_WIDTH / 2 + (angleDiff / (FOV / 2)) * (SCREEN_WIDTH / 2);
              const keySize = Math.max(20, 80 - distance * 15);
              const keyY = SCREEN_HEIGHT / 2 - keySize / 2;
              
              // Draw glowing key
              ctx.save();
              ctx.shadowBlur = 20;
              ctx.shadowColor = '#ffd700';
              ctx.fillStyle = '#ffd700';
              ctx.font = `${keySize}px Arial`;
              ctx.fillText('🔑', screenX - keySize / 2, keyY + keySize);
              ctx.restore();
            }
          }
        }
      }
    }

    // Draw minimap
    const minimapSize = 120;
    const minimapCell = minimapSize / Math.max(state.maze.length, state.maze[0].length);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(SCREEN_WIDTH - minimapSize - 10, 10, minimapSize, minimapSize);
    
    // Draw minimap maze
    for (let y = 0; y < state.maze.length; y++) {
      for (let x = 0; x < state.maze[0].length; x++) {
        const cell = state.maze[y][x];
        if (cell.type === 'wall' || cell.type === 'door') {
          ctx.fillStyle = cell.type === 'door' ? '#8b4513' : '#4a4a6a';
        } else if (cell.type === 'key') {
          ctx.fillStyle = '#ffd700';
        } else if (cell.type === 'end') {
          ctx.fillStyle = '#00ff00';
        } else {
          ctx.fillStyle = '#1a1a2e';
        }
        ctx.fillRect(
          SCREEN_WIDTH - minimapSize - 10 + x * minimapCell,
          10 + y * minimapCell,
          minimapCell,
          minimapCell
        );
      }
    }
    
    // Draw player on minimap
    ctx.fillStyle = '#00d2ff';
    ctx.beginPath();
    ctx.arc(
      SCREEN_WIDTH - minimapSize - 10 + player.x * minimapCell,
      10 + player.y * minimapCell,
      3,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw player direction
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(
      SCREEN_WIDTH - minimapSize - 10 + player.x * minimapCell,
      10 + player.y * minimapCell
    );
    ctx.lineTo(
      SCREEN_WIDTH - minimapSize - 10 + (player.x + Math.cos(player.angle) * 0.5) * minimapCell,
      10 + (player.y + Math.sin(player.angle) * 0.5) * minimapCell
    );
    ctx.stroke();
  }, [engine]);

  const gameLoop = useCallback(() => {
    if (showMenu || gameState.isComplete) return;

    // Handle continuous movement
    if (keysPressed.current['ArrowUp'] || keysPressed.current['w'] || keysPressed.current['W']) {
      engine.move('forward');
    }
    if (keysPressed.current['ArrowDown'] || keysPressed.current['s'] || keysPressed.current['S']) {
      engine.move('backward');
    }
    if (keysPressed.current['ArrowLeft'] || keysPressed.current['a'] || keysPressed.current['A']) {
      engine.rotate('left');
    }
    if (keysPressed.current['ArrowRight'] || keysPressed.current['d'] || keysPressed.current['D']) {
      engine.rotate('right');
    }

    updateState();
    renderScene();
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [engine, updateState, renderScene, showMenu, gameState.isComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!showMenu) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [showMenu, gameLoop]);

  const handleReset = useCallback(() => {
    engine.reset();
    updateState();
    setShowMenu(false);
    renderScene();
  }, [engine, updateState, renderScene]);

  const handleNextLevel = useCallback(() => {
    engine.nextLevel();
    updateState();
    renderScene();
  }, [engine, updateState, renderScene]);

  if (showMenu) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-lg"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            🎮 3D 迷宫
          </h1>
          <p className="text-gray-400 mb-8">Maze3D</p>

          <div className="glass-card rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-cyan-400 mb-4">游戏规则</h3>
            <ul className="text-gray-300 text-left space-y-3">
              <li>• 使用 W/S 或 方向键前后移动</li>
              <li>• 使用 A/D 或 方向键左右旋转</li>
              <li>• 收集所有钥匙 🔑 打开门</li>
              <li>• 找到出口完成关卡</li>
              <li>• 右下角小地图可以辅助导航</li>
            </ul>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="px-12 py-4 text-xl font-bold rounded-2xl text-white"
            style={{ 
              background: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
              boxShadow: '0 0 30px rgba(155, 89, 182, 0.5)'
            }}
          >
            开始游戏
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)' }}>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-2xl mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMenu(true)}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: '#2d2d44',
              color: '#00d2ff',
              border: '1px solid #00d2ff'
            }}
          >
            菜单
          </motion.button>

          <div className="text-center">
            <div className="text-sm opacity-70" style={{ color: '#ffd700' }}>关卡</div>
            <div className="text-2xl font-bold text-white">{gameState.level}</div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              backgroundColor: '#2d2d44',
              color: '#ff6b9d',
              border: '1px solid #ff6b9d'
            }}
          >
            重置
          </motion.button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card px-4 py-3 rounded-xl text-center">
            <div className="text-sm text-gray-400">步数</div>
            <div className="text-xl font-bold text-cyan-400">{gameState.moves}</div>
          </div>
          <div className="glass-card px-4 py-3 rounded-xl text-center">
            <div className="text-sm text-gray-400">钥匙</div>
            <div className="text-xl font-bold text-yellow-400">
              {'🔑'.repeat(gameState.keysCollected)}
              {'⬜'.repeat(gameState.totalKeys - gameState.keysCollected)}
            </div>
          </div>
          <div className="glass-card px-4 py-3 rounded-xl text-center">
            <div className="text-sm text-gray-400">状态</div>
            <div className="text-xl font-bold" style={{ 
              color: gameState.keysCollected >= gameState.totalKeys ? '#00ff00' : '#ff6b6b' 
            }}>
              {gameState.keysCollected >= gameState.totalKeys ? '门已开!' : '寻找钥匙'}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl overflow-hidden mb-4"
        style={{
          boxShadow: '0 0 40px rgba(0, 210, 255, 0.3)'
        }}
      >
        <canvas
          ref={canvasRef}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          className="block"
        />
      </motion.div>

      {/* Mobile controls */}
      <div className="grid grid-cols-3 gap-2 w-48 mb-4">
        <div></div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onMouseDown={() => keysPressed.current['ArrowUp'] = true}
          onMouseUp={() => keysPressed.current['ArrowUp'] = false}
          onMouseLeave={() => keysPressed.current['ArrowUp'] = false}
          onTouchStart={() => keysPressed.current['ArrowUp'] = true}
          onTouchEnd={() => keysPressed.current['ArrowUp'] = false}
          className="p-3 rounded-lg font-bold text-xl"
          style={{
            backgroundColor: '#9b59b6',
            color: '#fff',
            boxShadow: '0 0 10px rgba(155, 89, 182, 0.5)'
          }}
        >
          ↑
        </motion.button>
        <div></div>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onMouseDown={() => keysPressed.current['ArrowLeft'] = true}
          onMouseUp={() => keysPressed.current['ArrowLeft'] = false}
          onMouseLeave={() => keysPressed.current['ArrowLeft'] = false}
          onTouchStart={() => keysPressed.current['ArrowLeft'] = true}
          onTouchEnd={() => keysPressed.current['ArrowLeft'] = false}
          className="p-3 rounded-lg font-bold text-xl"
          style={{
            backgroundColor: '#9b59b6',
            color: '#fff',
            boxShadow: '0 0 10px rgba(155, 89, 182, 0.5)'
          }}
        >
          ←
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onMouseDown={() => keysPressed.current['ArrowDown'] = true}
          onMouseUp={() => keysPressed.current['ArrowDown'] = false}
          onMouseLeave={() => keysPressed.current['ArrowDown'] = false}
          onTouchStart={() => keysPressed.current['ArrowDown'] = true}
          onTouchEnd={() => keysPressed.current['ArrowDown'] = false}
          className="p-3 rounded-lg font-bold text-xl"
          style={{
            backgroundColor: '#9b59b6',
            color: '#fff',
            boxShadow: '0 0 10px rgba(155, 89, 182, 0.5)'
          }}
        >
          ↓
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onMouseDown={() => keysPressed.current['ArrowRight'] = true}
          onMouseUp={() => keysPressed.current['ArrowRight'] = false}
          onMouseLeave={() => keysPressed.current['ArrowRight'] = false}
          onTouchStart={() => keysPressed.current['ArrowRight'] = true}
          onTouchEnd={() => keysPressed.current['ArrowRight'] = false}
          className="p-3 rounded-lg font-bold text-xl"
          style={{
            backgroundColor: '#9b59b6',
            color: '#fff',
            boxShadow: '0 0 10px rgba(155, 89, 182, 0.5)'
          }}
        >
          →
        </motion.button>
      </div>

      {gameState.isComplete && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(26, 26, 46, 0.95)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-center p-8 rounded-2xl"
            style={{ backgroundColor: '#1a1a2e' }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <div className="text-4xl font-bold mb-4" style={{ color: '#00ff00' }}>
              🎉 恭喜通关！
            </div>
            <div className="text-2xl text-yellow-400 mb-2">
              用了 {gameState.moves} 步完成！
            </div>
            <div className="text-lg text-gray-400 mb-6">
              准备好挑战更大的迷宫了吗？
            </div>
            <div className="flex gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextLevel}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: '#00ff00',
                  color: '#0f0f1a',
                  boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)'
                }}
              >
                下一关
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMenu(true)}
                className="px-6 py-3 rounded-lg font-bold"
                style={{
                  backgroundColor: 'transparent',
                  color: '#9b59b6',
                  border: '2px solid #9b59b6'
                }}
              >
                返回菜单
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

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
