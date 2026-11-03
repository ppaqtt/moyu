import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import type { EngineProps, GameStatus } from '../types';

interface Upgrade {
  name: string;
  desc: string;
  cost: number;
  income: number;
  click: number;
  owned: number;
}

const BASE_UPGRADES: Omit<Upgrade, 'owned'>[] = [
  { name: '基础设备', desc: '提高每秒收入', cost: 25, income: 1, click: 0 },
  { name: '熟练员工', desc: '提高点击收益', cost: 60, income: 0, click: 1 },
  { name: '自动化流水线', desc: '大幅提高每秒收入', cost: 150, income: 4, click: 0 },
  { name: '品牌宣传', desc: '点击收益 +3', cost: 320, income: 0, click: 3 },
  { name: '连锁扩张', desc: '每秒收入 +12', cost: 750, income: 12, click: 0 },
  { name: '商业帝国', desc: '每秒收入 +40', cost: 1800, income: 40, click: 0 },
];

const GOAL = 10000;

export default function TycoonGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [coins, setCoins] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(() => BASE_UPGRADES.map(u => ({ ...u, owned: 0 })));
  const [earned, setEarned] = useState(0);
  const [message, setMessage] = useState('');
  const coinsRef = useRef(0);
  coinsRef.current = coins;
  const incomeRef = useRef(0);
  const clickRef = useRef(1);

  const income = upgrades.reduce((sum, u) => sum + u.income * u.owned, 0);
  const clickPower = 1 + upgrades.reduce((sum, u) => sum + u.click * u.owned, 0);
  incomeRef.current = income;
  clickRef.current = clickPower;

  const start = useCallback(() => {
    setCoins(0);
    setEarned(0);
    setUpgrades(BASE_UPGRADES.map(u => ({ ...u, owned: 0 })));
    setMessage('');
    setStatus('playing');
    report(0);
  }, [report]);

  useEffect(() => {
    if (status !== 'playing') return;
    const timer = window.setInterval(() => {
      setCoins(prev => prev + incomeRef.current / 10);
    }, 100);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== 'playing') return;
    if (coins >= GOAL) {
      setStatus('won');
      finish(Math.floor(coins));
    }
  }, [coins, status, finish]);

  const work = () => {
    if (status !== 'playing') return;
    const gain = clickRef.current;
    setCoins(prev => prev + gain);
    setEarned(prev => prev + gain);
    report(Math.floor(coinsRef.current + gain));
  };

  const buy = (index: number) => {
    if (status !== 'playing') return;
    const upgrade = upgrades[index];
    if (coins < upgrade.cost) {
      setMessage('资金不足');
      window.setTimeout(() => setMessage(''), 900);
      return;
    }
    setCoins(prev => prev - upgrade.cost);
    setUpgrades(prev => prev.map((u, i) => (i === index ? { ...u, owned: u.owned + 1, cost: Math.ceil(u.cost * 1.35) } : u)));
    setMessage(`已购买：${upgrade.name}`);
    window.setTimeout(() => setMessage(''), 900);
  };

  return (
    <GameFrame
      meta={meta}
      score={Math.floor(coins)}
      best={best}
      status={status}
      stats={[
        { label: '金币', value: Math.floor(coins) },
        { label: '每秒收入', value: income.toFixed(1) },
        { label: '点击收益', value: clickPower },
        { label: '目标', value: GOAL },
      ]}
      resultText={`累计经营收益 ${Math.floor(coins)}`}
      hint="点击「开始营业」赚钱，购买升级提升点击收益和自动收入；赚到 10000 金币即可通关"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          从一间小店开始经营。<br />点击赚钱、购买升级、扩大规模，目标是赚到 {GOAL} 金币。
        </StartPanel>
      ) : (
        <div style={{ width: '100%', maxWidth: 760, margin: '0 auto', display: 'grid', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: '18px 12px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: `1px solid ${meta.primary}33` }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>当前金币</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: '#f8d34e' }}>{Math.floor(coins)}</div>
            <div style={{ color: '#22c55e', fontSize: 14 }}>+{income.toFixed(1)} / 秒</div>
            <button
              onClick={work}
              style={{
                marginTop: 16,
                padding: '14px 42px',
                borderRadius: 14,
                border: 'none',
                background: `linear-gradient(135deg, ${meta.primary}, ${meta.secondary})`,
                color: '#06101f',
                fontSize: 18,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: `0 0 26px ${meta.primary}66`,
              }}
            >
              开始营业 +{clickPower}
            </button>
            <div style={{ height: 22, marginTop: 8, color: meta.secondary, fontSize: 13 }}>{message}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {upgrades.map((upgrade, index) => {
              const affordable = coins >= upgrade.cost;
              return (
                <button
                  key={upgrade.name}
                  onClick={() => buy(index)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: `1px solid ${affordable ? `${meta.primary}88` : 'rgba(255,255,255,0.08)'}`,
                    background: affordable ? `${meta.primary}14` : 'rgba(255,255,255,0.03)',
                    color: '#e2e8f0',
                    cursor: affordable ? 'pointer' : 'not-allowed',
                    opacity: affordable ? 1 : 0.55,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 4 }}>
                    <span>{upgrade.name}</span>
                    <span style={{ color: '#f8d34e' }}>{upgrade.cost}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{upgrade.desc}（已购 {upgrade.owned}）</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </GameFrame>
  );
}
