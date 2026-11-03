import React, { useCallback, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import type { EngineProps, GameStatus } from '../types';

interface Card { rank: string; suit: string }

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠', '♥', '♦', '♣'];
const BET = 10;

function newDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function valueOf(cards: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === 'A') {
      total += 11;
      aces++;
    } else if (['J', 'Q', 'K'].includes(card.rank)) {
      total += 10;
    } else {
      total += Number(card.rank);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function CardView({ card, hidden }: { card: Card; hidden?: boolean }) {
  if (hidden) {
    return (
      <div style={{ width: 58, height: 82, borderRadius: 8, background: 'linear-gradient(135deg, #1e3a8a, #312e81)', border: '1px solid #60a5fa55', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93c5fd', fontSize: 26 }}>
        ?
      </div>
    );
  }
  const red = card.suit === '♥' || card.suit === '♦';
  return (
    <div
      style={{
        width: 58,
        height: 82,
        borderRadius: 8,
        background: '#f8fafc',
        color: red ? '#dc2626' : '#0f172a',
        border: '1px solid #cbd5e1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        boxShadow: '0 3px 10px rgba(0,0,0,0.35)',
      }}
    >
      <div style={{ fontSize: 20 }}>{card.rank}</div>
      <div style={{ fontSize: 22 }}>{card.suit}</div>
    </div>
  );
}

export default function CardGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [chips, setChips] = useState(100);
  const [deck, setDeck] = useState<Card[]>([]);
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [phase, setPhase] = useState<'idle' | 'player' | 'roundEnd'>('idle');
  const [message, setMessage] = useState('');
  const [bet, setBet] = useState(BET);

  const draw = (currentDeck: Card[]): { card: Card; deck: Card[] } => {
    const nextDeck = currentDeck.length > 0 ? currentDeck : newDeck();
    const card = nextDeck[0];
    return { card, deck: nextDeck.slice(1) };
  };

  const deal = useCallback(() => {
    if (chips < bet) {
      setStatus('lost');
      finish(chips);
      return;
    }
    let localDeck = newDeck();
    const p: Card[] = [];
    const d: Card[] = [];
    for (let i = 0; i < 2; i++) {
      let result = draw(localDeck);
      p.push(result.card);
      localDeck = result.deck;
      result = draw(localDeck);
      d.push(result.card);
      localDeck = result.deck;
    }
    setDeck(localDeck);
    setPlayer(p);
    setDealer(d);
    setChips(prev => prev - bet);
    report(chips - bet);
    setMessage('要牌还是停牌？');
    setPhase('player');
    setStatus('playing');

    if (valueOf(p) === 21) {
      settle(p, d, true);
    }
  }, [chips, bet, report, finish]);

  const settle = (p: Card[], d: Card[], natural = false) => {
    let finalDealer = [...d];
    let localDeck = deck;
    if (!natural) {
      while (valueOf(finalDealer) < 17) {
        const result = draw(localDeck);
        finalDealer.push(result.card);
        localDeck = result.deck;
      }
    }
    const pv = valueOf(p);
    const dv = valueOf(finalDealer);
    let payout = 0;
    let msg = '';
    if (pv > 21) {
      msg = '你爆牌了，本局失败';
    } else if (dv > 21) {
      payout = bet * 2;
      msg = '庄家爆牌，你赢了！';
    } else if (pv > dv) {
      payout = natural ? Math.floor(bet * 2.5) : bet * 2;
      msg = natural ? 'Blackjack！你赢了！' : '你的点数更大，赢了！';
    } else if (pv === dv) {
      payout = bet;
      msg = '平局，退还下注';
    } else {
      msg = '庄家点数更大，本局失败';
    }
    const nextChips = chips + payout;
    setChips(nextChips);
    setDealer(finalDealer);
    setDeck(localDeck);
    setMessage(msg);
    setPhase('roundEnd');
    report(nextChips);
    if (nextChips >= 300) {
      setStatus('won');
      finish(nextChips);
    } else if (nextChips < BET) {
      setStatus('lost');
      finish(nextChips);
    }
  };

  const hit = () => {
    if (phase !== 'player') return;
    const result = draw(deck);
    const nextPlayer = [...player, result.card];
    setDeck(result.deck);
    setPlayer(nextPlayer);
    const pv = valueOf(nextPlayer);
    if (pv > 21) {
      settle(nextPlayer, dealer);
    } else if (pv === 21) {
      settle(nextPlayer, dealer);
    } else {
      setMessage(`当前点数 ${pv}，继续要牌？`);
    }
  };

  const stand = () => {
    if (phase !== 'player') return;
    settle(player, dealer);
  };

  const nextRound = () => {
    setPlayer([]);
    setDealer([]);
    setMessage('');
    setPhase('idle');
    if (chips >= 300) {
      setStatus('won');
      finish(chips);
    } else if (chips < BET) {
      setStatus('lost');
      finish(chips);
    } else {
      setStatus('playing');
      deal();
    }
  };

  const start = useCallback(() => {
    setChips(100);
    setPlayer([]);
    setDealer([]);
    setDeck([]);
    setMessage('');
    setBet(BET);
    setPhase('idle');
    setStatus('playing');
    report(100);
    window.setTimeout(() => {
      let localDeck = newDeck();
      const p: Card[] = [];
      const d: Card[] = [];
      for (let i = 0; i < 2; i++) {
        let result = draw(localDeck);
        p.push(result.card);
        localDeck = result.deck;
        result = draw(localDeck);
        d.push(result.card);
        localDeck = result.deck;
      }
      setDeck(localDeck);
      setPlayer(p);
      setDealer(d);
      setChips(90);
      report(90);
      setMessage('要牌还是停牌？');
      setPhase('player');
    }, 0);
  }, [report]);

  return (
    <GameFrame
      meta={meta}
      score={chips}
      best={best}
      status={status}
      stats={[{ label: '筹码', value: chips }, { label: '下注', value: bet }, { label: '目标', value: '300' }]}
      resultText={message}
      hint="目标是赢到 300 筹码。A 可算 1 或 11，点数尽量接近 21 且不要超过"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          21 点（Blackjack）。初始 100 筹码，每局下注 {BET}。<br />赢到 300 筹码即可通关。
        </StartPanel>
      ) : (
        <div style={{ width: '100%', maxWidth: 620, margin: '0 auto' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#94a3b8', marginBottom: 8 }}>庄家 {phase === 'player' ? '' : `(${valueOf(dealer)})`}</div>
            <div style={{ display: 'flex', gap: 8, minHeight: 86 }}>
              {dealer.map((card, i) => (
                <CardView key={`d-${i}`} card={card} hidden={phase === 'player' && i === 1} />
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', marginBottom: 8 }}>你 ({valueOf(player)})</div>
            <div style={{ display: 'flex', gap: 8, minHeight: 86 }}>
              {player.map((card, i) => <CardView key={`p-${i}`} card={card} />)}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 24, minHeight: 28, color: meta.secondary, fontWeight: 700 }}>{message}</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 }}>
            {phase === 'player' && (
              <>
                <button onClick={hit} style={{ padding: '10px 26px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${meta.primary}, ${meta.secondary})`, color: '#06101f', fontWeight: 800, cursor: 'pointer' }}>要牌</button>
                <button onClick={stand} style={{ padding: '10px 26px', borderRadius: 10, border: `1px solid ${meta.primary}`, background: 'transparent', color: '#e2e8f0', fontWeight: 700, cursor: 'pointer' }}>停牌</button>
              </>
            )}
            {phase === 'roundEnd' && (
              <button onClick={nextRound} style={{ padding: '10px 26px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${meta.primary}, ${meta.secondary})`, color: '#06101f', fontWeight: 800, cursor: 'pointer' }}>下一局</button>
            )}
          </div>
        </div>
      )}
    </GameFrame>
  );
}
