import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ParticleBg from '../components/ParticleBg';
import { NEON_COLORS } from '../utils/constants';
import {
  GAMEPAD_BINDINGS,
  isGamepadEnabled,
  setGamepadEnabled,
  useGamepadStatus,
} from '../hooks/useGamepad';
import {
  collectAllSaves,
  exportAllSaves,
  importSaveArchive,
} from '../utils/saveManager';

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(15, 15, 26, 0.95))',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
};

export default function Settings() {
  const navigate = useNavigate();
  const pads = useGamepadStatus();
  const [gamepadEnabled, setGamepadEnabledState] = useState(isGamepadEnabled);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saveCount, setSaveCount] = useState(() => Object.keys(collectAllSaves()).length);
  const [saveSize, setSaveSize] = useState(() => {
    const data = collectAllSaves();
    return Object.entries(data).reduce((sum, [k, v]) => sum + k.length + v.length, 0);
  });

  const refreshStats = useCallback(() => {
    const data = collectAllSaves();
    const entries = Object.entries(data);
    setSaveCount(entries.length);
    setSaveSize(entries.reduce((sum, [k, v]) => sum + k.length + v.length, 0));
  }, []);

  const handleToggle = () => {
    const next = !gamepadEnabled;
    setGamepadEnabledState(next);
    setGamepadEnabled(next);
    setMessage(next ? '手柄映射已开启' : '手柄映射已关闭');
    window.setTimeout(() => setMessage(''), 1800);
  };

  const handleExport = () => {
    const count = exportAllSaves();
    setMessage(`已导出 ${count} 条存档数据`);
    window.setTimeout(() => setMessage(''), 2200);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await importSaveArchive(file);
      refreshStats();
      setMessage(`已导入 ${result.count} 条存档数据，返回游戏即可继续`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setBusy(false);
    }
  };

  const sizeLabel = useMemo(() => {
    if (saveSize < 1024) return `${saveSize} B`;
    return `${(saveSize / 1024).toFixed(1)} KB`;
  }, [saveSize]);

  return (
    <div className="min-h-screen p-6 relative overflow-hidden">
      <ParticleBg />
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <motion.button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: NEON_COLORS.neonCyan,
              border: '1px solid rgba(0, 214, 255, 0.3)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            返回首页
          </motion.button>
          <h1
            className="text-3xl md:text-4xl font-black"
            style={{
              background: `linear-gradient(135deg, ${NEON_COLORS.neonPink}, ${NEON_COLORS.neonCyan})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            设置
          </h1>
          <div className="w-24" />
        </div>

        {(message || error) && (
          <div
            className="mb-5 px-5 py-3 rounded-2xl text-sm font-medium"
            style={{
              background: error ? 'rgba(255, 68, 102, 0.12)' : 'rgba(34, 197, 94, 0.12)',
              color: error ? '#ff9db0' : '#86efac',
              border: `1px solid ${error ? 'rgba(255,68,102,0.35)' : 'rgba(34,197,94,0.35)'}`,
            }}
          >
            {error || message}
          </div>
        )}

        <motion.section
          className="rounded-3xl p-6 mb-6"
          style={cardStyle}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: NEON_COLORS.gold }}>
                🎮 手柄支持
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                统一映射方向键、A / B 与暂停键，键盘游戏可直接用手柄操作
              </p>
            </div>
            <button
              onClick={handleToggle}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{
                background: gamepadEnabled
                  ? `linear-gradient(135deg, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonPurple})`
                  : 'rgba(255,255,255,0.07)',
                color: gamepadEnabled ? '#0b0b14' : 'rgba(255,255,255,0.7)',
                border: `1px solid ${gamepadEnabled ? NEON_COLORS.neonCyan : 'rgba(255,255,255,0.14)'}`,
              }}
            >
              {gamepadEnabled ? '已开启' : '已关闭'}
            </button>
          </div>

          <div
            className="rounded-2xl p-4 mb-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: pads.length ? '#22c55e' : 'rgba(255,255,255,0.25)',
                  boxShadow: pads.length ? '0 0 10px #22c55e' : 'none',
                }}
              />
              <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {pads.length ? `已连接 ${pads.length} 个手柄` : '未检测到手柄'}
              </span>
            </div>
            {pads.length === 0 ? (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                连接手柄后按下任意键或摇杆，浏览器才会识别设备（需在页面内操作一次）。
              </p>
            ) : (
              <div className="space-y-2">
                {pads.map(pad => (
                  <div
                    key={pad.index}
                    className="text-xs rounded-xl px-3 py-2"
                    style={{ background: 'rgba(0,0,0,0.25)', color: 'rgba(255,255,255,0.65)' }}
                  >
                    <div className="font-bold" style={{ color: NEON_COLORS.neonCyan }}>
                      #{pad.index} · {pad.mapping === 'standard' ? '标准映射' : pad.mapping}
                    </div>
                    <div className="truncate" title={pad.id}>{pad.id}</div>
                    <div>{pad.buttons} 个按键 · {pad.axes} 个轴</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <th className="text-left font-medium py-2">动作</th>
                  <th className="text-left font-medium py-2">手柄输入</th>
                  <th className="text-left font-medium py-2">等效按键</th>
                </tr>
              </thead>
              <tbody>
                {GAMEPAD_BINDINGS.map(binding => (
                  <tr key={binding.action} style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <td className="py-2.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {binding.action}
                    </td>
                    <td className="py-2.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {binding.source}
                    </td>
                    <td className="py-2.5">
                      <code
                        className="px-2 py-1 rounded-md text-xs"
                        style={{ background: 'rgba(255,255,255,0.08)', color: NEON_COLORS.neonPink }}
                      >
                        {binding.key === ' ' ? 'Space' : binding.key.toUpperCase()}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        <motion.section
          className="rounded-3xl p-6"
          style={cardStyle}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <h2 className="text-xl font-bold mb-1" style={{ color: NEON_COLORS.gold }}>
            💾 存档与排行榜
          </h2>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            所有进度保存在浏览器 localStorage 中。导出 JSON 备份后，即使清除缓存也能恢复。
          </p>

          <div className="flex flex-wrap gap-3 mb-5 text-sm">
            <div
              className="px-4 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }}
            >
              共 <b style={{ color: NEON_COLORS.neonCyan }}>{saveCount}</b> 条数据
            </div>
            <div
              className="px-4 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }}
            >
              约 <b style={{ color: NEON_COLORS.neonCyan }}>{sizeLabel}</b>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <motion.button
              onClick={handleExport}
              className="px-5 py-3 rounded-xl font-bold text-sm"
              style={{
                background: `linear-gradient(135deg, ${NEON_COLORS.neonPurple}, ${NEON_COLORS.neonCyan})`,
                color: '#fff',
                boxShadow: `0 0 22px ${NEON_COLORS.neonPurple}44`,
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              导出全部存档
            </motion.button>
            <motion.button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="px-5 py-3 rounded-xl font-bold text-sm disabled:opacity-50"
              style={{
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(255,255,255,0.14)',
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              {busy ? '导入中...' : '导入存档文件'}
            </motion.button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="hidden"
            />
          </div>

          <p className="mt-4 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
            导入采用合并方式：文件中存在的键会覆盖本地同名存档，其余本地进度保持不变。
            单个游戏的存档可在游戏页面右下角的「存档」按钮中单独导出/导入。
          </p>
        </motion.section>
      </div>
    </div>
  );
}
