import React, { useCallback, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import type { EngineProps, GameStatus } from '../types';

type Action = 'punch' | 'kick' | 'block' | 'heal';

const ACTION_NAMES: Record<Action, string> = {
  punch: '直拳',
  kick: '飞踢',
  block: '格挡',
  heal: '调整呼吸',
};

const AI_NAMES = ['铁拳阿豪', '影步小刀', '巨力山', '雷霆教练'];

export default function FighterGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [playerHP, setPlayerHP] = useState(100);
  const [aiHP, setAiHP] = useState(100);
  const [score, setScore] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState(1);
  const [aiName] = useState(() => AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)]);

  const start = useCallback(() => {
    setPlayerHP(100);
    setAiHP(100);
    setScore(0);
    setRound(1);
    setLog(['比赛开始！选择你的招式。']);
    setBusy(false);
    setStatus('playing');
    report(0);
  }, [report]);

  const act = (action: Action) => {
    if (status !== 'playing' || busy) return;
    setBusy(true);

    const aiAction: Action = (() => {
      const r = Math.random();
      if (aiHP < 30 && r < 0.35) return 'heal';
      if (r < 0.2) return 'block';
      if (r < 0.55) return 'punch';
      return 'kick';
    })();

    // 石头剪刀布式克制：踢克拳，拳克格挡，格挡克踢
    const beats = (a: Action, b: Action) =>
      (a === 'kick' && b === 'punch') || (a === 'punch' && b === 'block') || (a === 'block' && b === 'kick');

    let playerDamage = 0;
    let aiDamage = 0;
    let text = `你使用【${ACTION_NAMES[action]}】，${aiName}使用【${ACTION_NAMES[aiAction]}】。`;

    if (action === 'heal') {
      const heal = Math.min(12, 100 - playerHP);
      setPlayerHP(hp => Math.min(100, hp + heal));
      text += ` 你恢复了 ${heal} 点体力。`;
    }
    if (aiAction === 'heal') {
      const heal = Math.min(12, 100 - aiHP);
      setAiHP(hp => Math.min(100, hp + heal));
      text += ` ${aiName}恢复了 ${heal} 点体力。`;
    }

    const playerAttacks = action === 'punch' || action === 'kick';
    const aiAttacks = aiAction === 'punch' || aiAction === 'kick';

    if (playerAttacks) {
      let dmg = action === 'punch' ? 12 : 18;
      if (aiAction === 'block') dmg = Math.round(dmg * 0.2);
      if (beats(action, aiAction)) dmg = Math.round(dmg * 1.5);
      playerDamage = dmg;
    }
    if (aiAttacks) {
      let dmg = aiAction === 'punch' ? 11 : 16;
      if (action === 'block') dmg = Math.round(dmg * 0.2);
      if (beats(aiAction, action)) dmg = Math.round(dmg * 1.5);
      aiDamage = dmg;
    }

    if (playerDamage > 0) text += ` 你造成 ${playerDamage} 点伤害。`;
    if (aiDamage > 0) text += ` 你受到 ${aiDamage} 点伤害。`;

    const nextAiHP = Math.max(0, aiHP - playerDamage);
    const nextPlayerHP = Math.max(0, playerHP - aiDamage);
    const dmgDealt = 100 - nextAiHP;
    const nextScore = dmgDealt * 10 + nextPlayerHP;
    setAiHP(nextAiHP);
    setPlayerHP(nextPlayerHP);
    setRound(r => r + 1);
    setScore(nextScore);
    setLog(prev => [...prev.slice(-4), text]);
    report(nextScore);

    window.setTimeout(() => {
      setBusy(false);
      if (nextAiHP <= 0) {
        setStatus('won');
        setLog(prev => [...prev, `🎉 ${aiName}倒下了，你赢得了比赛！`]);
        finish(nextScore + 500);
      } else if (nextPlayerHP <= 0) {
        setStatus('lost');
        setLog(prev => [...prev, `💀 你被${aiName}击倒了。`]);
        finish(nextScore);
      }
    }, 420);
  };

  const bar = (value: number, color: string) => (
    <div style={{ height: 16, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${Math.max(0, value)}%`, height: '100%', background: color, transition: 'width .35s' }} />
    </div>
  );

  return (
    <GameFrame
      meta={meta}
      score={score}
      best={best}
      status={status}
      stats={[{ label: '回合', value: round }, { label: '对手', value: aiName }]}
      resultText={status === 'won' ? '你击败了对手' : '你被对手击败'}
      hint="选择招式与 AI 同时对决：踢克拳、拳克格挡、格挡克踢；血量归零则比赛结束"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          与 AI 进行一场回合制格斗。<br />观察对手出招，利用克制关系击败他。
        </StartPanel>
      ) : (
        <div style={{ width: '100%', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ fontSize: 46 }}>🥊</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>你</span><span>{playerHP}/100</span>
              </div>
              {bar(playerHP, '#22c55e')}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>VS</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{aiName}</span><span>{aiHP}/100</span>
              </div>
              {bar(aiHP, '#ef4444')}
            </div>
            <div style={{ fontSize: 46, transform: 'scaleX(-1)' }}>🥊</div>
          </div>

          <div style={{ minHeight: 92, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 14, lineHeight: 1.9, color: '#cbd5e1', marginBottom: 16 }}>
            {log.map((line, i) => <div key={i}>{line}</div>)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {(['punch', 'kick', 'block', 'heal'] as Action[]).map(action => (
              <button
                key={action}
                onClick={() => act(action)}
                disabled={busy}
                style={{
                  padding: '14px 8px',
                  borderRadius: 12,
                  border: `1px solid ${meta.primary}55`,
                  background: action === 'heal' ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
                  color: '#e2e8f0',
                  fontWeight: 700,
                  cursor: busy ? 'default' : 'pointer',
                  opacity: busy ? 0.5 : 1,
                }}
              >
                {action === 'punch' ? '👊 ' : action === 'kick' ? '🦵 ' : action === 'block' ? '🛡️ ' : '💨 '}
                {ACTION_NAMES[action]}
              </button>
            ))}
          </div>
        </div>
      )}
    </GameFrame>
  );
}
