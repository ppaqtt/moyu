import React from 'react';
import { motion } from 'framer-motion';
import type { GameMeta, GameStatus } from './types';

interface GameFrameProps {
  meta: GameMeta;
  score: number;
  best?: number;
  status: GameStatus;
  hint?: string;
  stats?: { label: string; value: React.ReactNode }[];
  resultText?: string;
  onRestart: () => void;
  onExit?: () => void;
  children: React.ReactNode;
}

export default function GameFrame({
  meta,
  score,
  best = 0,
  status,
  hint,
  stats,
  resultText,
  onRestart,
  onExit,
  children,
}: GameFrameProps) {
  const finished = status === 'won' || status === 'lost';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `radial-gradient(circle at 20% 0%, ${meta.primary}22 0%, transparent 40%), radial-gradient(circle at 80% 100%, ${meta.secondary}22 0%, transparent 40%), #080b16`,
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 12px 30px',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 900,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <button
          onClick={onExit}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: `1px solid ${meta.primary}66`,
            background: 'rgba(255,255,255,0.04)',
            color: '#cbd5e1',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          ← 返回
        </button>
        <div style={{ fontSize: 22, fontWeight: 800, color: meta.primary, textShadow: `0 0 18px ${meta.primary}55` }}>
          {meta.icon} {meta.name}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 18, fontSize: 14 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>得分</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: meta.secondary }}>{score}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>最高</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f8d34e' }}>{best}</div>
          </div>
        </div>
      </div>

      {stats && stats.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12, justifyContent: 'center' }}>
          {stats.map(item => (
            <div
              key={item.label}
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 13,
                color: '#cbd5e1',
              }}
            >
              {item.label}: <b style={{ color: '#fff' }}>{item.value}</b>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: 'relative', flex: 1, width: '100%', maxWidth: 900, display: 'flex', justifyContent: 'center' }}>
        {children}
        {finished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(4, 8, 20, 0.82)',
              borderRadius: 16,
              zIndex: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              style={{
                textAlign: 'center',
                padding: '26px 34px',
                borderRadius: 18,
                background: '#101728',
                border: `1px solid ${status === 'won' ? '#22c55e' : '#ef4444'}88`,
                boxShadow: `0 0 40px ${status === 'won' ? '#22c55e' : '#ef4444'}33`,
              }}
            >
              <div style={{ fontSize: 34, marginBottom: 8 }}>{status === 'won' ? '🎉' : '💀'}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: status === 'won' ? '#22c55e' : '#ef4444', marginBottom: 6 }}>
                {status === 'won' ? '通关！' : '游戏结束'}
              </div>
              <div style={{ color: '#cbd5e1', marginBottom: 4 }}>{resultText}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f8d34e', marginBottom: 16 }}>得分：{score}</div>
              <button
                onClick={onRestart}
                style={{
                  padding: '10px 26px',
                  borderRadius: 10,
                  border: 'none',
                  background: `linear-gradient(135deg, ${meta.primary}, ${meta.secondary})`,
                  color: '#06101f',
                  fontWeight: 800,
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                再玩一次
              </button>
            </motion.div>
          </motion.div>
        )}
      </div>

      {hint && (
        <div style={{ marginTop: 14, color: '#94a3b8', fontSize: 13, textAlign: 'center', lineHeight: 1.7 }}>
          {hint}
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        <button
          onClick={onRestart}
          style={{
            padding: '8px 20px',
            borderRadius: 10,
            border: `1px solid ${meta.secondary}66`,
            background: 'rgba(255,255,255,0.04)',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          重新开始
        </button>
      </div>
    </div>
  );
}

export function StartPanel({ meta, onStart, title, children }: { meta: GameMeta; onStart: () => void; title?: string; children?: React.ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 520,
        margin: '0 auto',
        padding: '34px 24px',
        borderRadius: 18,
        background: 'rgba(16, 23, 40, 0.85)',
        border: `1px solid ${meta.primary}44`,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 50, marginBottom: 8 }}>{meta.icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: meta.primary, marginBottom: 10 }}>{title || meta.name}</div>
      <div style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.8, marginBottom: 22 }}>{children}</div>
      <button
        onClick={onStart}
        style={{
          padding: '12px 40px',
          borderRadius: 12,
          border: 'none',
          background: `linear-gradient(135deg, ${meta.primary}, ${meta.secondary})`,
          color: '#06101f',
          fontWeight: 800,
          fontSize: 17,
          cursor: 'pointer',
          boxShadow: `0 0 24px ${meta.primary}55`,
        }}
      >
        开始游戏
      </button>
    </div>
  );
}
