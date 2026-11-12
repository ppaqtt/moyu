import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import ParticleBg from '../components/ParticleBg';
import { NEON_COLORS } from '../utils/constants';

type GameKind = 'ttt' | 'reaction';
type Mark = 'X' | 'O';
type Phase = 'lobby' | 'waiting' | 'joining' | 'playing';
type ReactionPhase = 'idle' | 'arming' | 'go' | 'result';

type Message =
  | { t: 'hello' }
  | { t: 'game'; game: GameKind }
  | { t: 'restart'; game: GameKind }
  | { t: 'move'; index: number; mark: Mark }
  | { t: 'reaction-start'; delay: number }
  | { t: 'reaction-click'; elapsed: number }
  | { t: 'reaction-result'; hostElapsed: number; guestElapsed: number; winner: 'host' | 'guest' | 'tie' };

const GAME_LABELS: Record<GameKind, { name: string; icon: string; desc: string }> = {
  ttt: { name: '井字棋', icon: '⭕', desc: '经典三连棋，房主执 X 先行' },
  reaction: { name: '反应对决', icon: '⚡', desc: '看到信号立刻点击，手慢无' },
};

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function getWinner(board: (Mark | null)[]): Mark | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function getWinLine(board: (Mark | null)[]): number[] | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return line;
  }
  return null;
}

function randomRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
}

export default function Multiplayer() {
  const navigate = useNavigate();
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  const [phase, setPhase] = useState<Phase>('lobby');
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [status, setStatus] = useState('创建房间或输入房号加入');
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  const [game, setGame] = useState<GameKind>('ttt');
  const gameRef = useRef<GameKind>('ttt');

  const [board, setBoard] = useState<(Mark | null)[]>(Array(9).fill(null));
  const boardRef = useRef<(Mark | null)[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<Mark>('X');
  const turnRef = useRef<Mark>('X');
  const [tttResult, setTttResult] = useState<{ winner: Mark | 'draw' | null; line: number[] | null }>({ winner: null, line: null });

  const [reactionPhase, setReactionPhase] = useState<ReactionPhase>('idle');
  const reactionPhaseRef = useRef<ReactionPhase>('idle');
  const goAtRef = useRef(0);
  const reactionTimerRef = useRef<number | null>(null);
  const pendingRef = useRef<{ host?: number; guest?: number }>({});
  const [hostElapsed, setHostElapsed] = useState<number | null>(null);
  const [guestElapsed, setGuestElapsed] = useState<number | null>(null);
  const [roundResult, setRoundResult] = useState<'host' | 'guest' | 'tie' | null>(null);
  const [score, setScore] = useState({ me: 0, opponent: 0 });

  const isHostRef = useRef(false);
  const handlerRef = useRef<(message: Message) => void>(() => undefined);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);

  useEffect(() => {
    reactionPhaseRef.current = reactionPhase;
  }, [reactionPhase]);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  const send = useCallback((message: Message) => {
    const conn = connRef.current;
    if (conn && conn.open) {
      conn.send(message);
    }
  }, []);

  const clearReactionTimer = () => {
    if (reactionTimerRef.current !== null) {
      window.clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }
  };

  const resetRoundState = useCallback(() => {
    setBoard(Array(9).fill(null));
    boardRef.current = Array(9).fill(null);
    setTurn('X');
    turnRef.current = 'X';
    setTttResult({ winner: null, line: null });
    clearReactionTimer();
    setReactionPhase('idle');
    reactionPhaseRef.current = 'idle';
    pendingRef.current = {};
    setHostElapsed(null);
    setGuestElapsed(null);
    setRoundResult(null);
  }, []);

  const switchGame = useCallback((nextGame: GameKind, broadcast: boolean) => {
    setGame(nextGame);
    gameRef.current = nextGame;
    resetRoundState();
    if (broadcast) send({ t: 'game', game: nextGame });
  }, [resetRoundState, send]);

  const applyMove = useCallback((index: number, mark: Mark) => {
    const current = boardRef.current;
    if (current[index] || getWinner(current)) return;
    if (turnRef.current !== mark) return;

    const next = [...current];
    next[index] = mark;
    boardRef.current = next;
    setBoard(next);

    const winner = getWinner(next);
    if (winner) {
      setTttResult({ winner, line: getWinLine(next) });
    } else if (next.every(Boolean)) {
      setTttResult({ winner: 'draw', line: null });
    }

    const nextTurn: Mark = mark === 'X' ? 'O' : 'X';
    turnRef.current = nextTurn;
    setTurn(nextTurn);
  }, []);

  const finishReactionRound = useCallback((hostValue: number, guestValue: number) => {
    const winner: 'host' | 'guest' | 'tie' =
      hostValue === guestValue ? 'tie' : hostValue < guestValue ? 'host' : 'guest';
    setHostElapsed(hostValue);
    setGuestElapsed(guestValue);
    setRoundResult(winner);
    setReactionPhase('result');
    reactionPhaseRef.current = 'result';
    setScore(prev => ({
      me: prev.me + (winner === (isHostRef.current ? 'host' : 'guest') ? 1 : 0),
      opponent: prev.opponent + (winner === (isHostRef.current ? 'guest' : 'host') ? 1 : 0),
    }));
    send({ t: 'reaction-result', hostElapsed: hostValue, guestElapsed: guestValue, winner });
  }, [send]);

  const scheduleGo = useCallback((delay: number) => {
    clearReactionTimer();
    setReactionPhase('arming');
    reactionPhaseRef.current = 'arming';
    setHostElapsed(null);
    setGuestElapsed(null);
    setRoundResult(null);
    reactionTimerRef.current = window.setTimeout(() => {
      setReactionPhase('go');
      reactionPhaseRef.current = 'go';
      goAtRef.current = performance.now();
    }, delay);
  }, []);

  const handleMessage = useCallback((message: Message) => {
    switch (message.t) {
      case 'hello':
        send({ t: 'game', game: gameRef.current });
        break;
      case 'game':
        setGame(message.game);
        gameRef.current = message.game;
        resetRoundState();
        break;
      case 'restart':
        resetRoundState();
        break;
      case 'move':
        applyMove(message.index, message.mark);
        break;
      case 'reaction-start':
        scheduleGo(message.delay);
        break;
      case 'reaction-click': {
        if (!isHostRef.current) break;
        pendingRef.current.guest = message.elapsed;
        if (pendingRef.current.host !== undefined) {
          finishReactionRound(pendingRef.current.host, pendingRef.current.guest);
        }
        break;
      }
      case 'reaction-result': {
        setHostElapsed(message.hostElapsed);
        setGuestElapsed(message.guestElapsed);
        setRoundResult(message.winner);
        setReactionPhase('result');
        reactionPhaseRef.current = 'result';
        const didWin = message.winner === (isHostRef.current ? 'host' : 'guest');
        setScore(prev => ({
          me: prev.me + (didWin ? 1 : 0),
          opponent: prev.opponent + (message.winner === 'tie' || didWin ? 0 : 1),
        }));
        break;
      }
      default:
        break;
    }
  }, [applyMove, finishReactionRound, resetRoundState, scheduleGo, send]);

  handlerRef.current = handleMessage;

  const bindConnection = useCallback((conn: DataConnection) => {
    connRef.current = conn;

    conn.on('open', () => {
      setConnected(true);
      setPhase('playing');
      setStatus('已连接，开始对战');
      if (!isHostRef.current) {
        conn.send({ t: 'hello' } satisfies Message);
      }
    });

    conn.on('data', data => {
      handlerRef.current(data as Message);
    });

    conn.on('close', () => {
      setConnected(false);
      setPhase('lobby');
      setStatus('对手已离开，可重新创建房间');
    });

    conn.on('error', () => {
      setError('连接出错，请检查房号或网络');
      setConnected(false);
    });
  }, []);

  const createRoom = () => {
    setError('');
    setStatus('正在创建房间…');
    setPhase('waiting');
    setIsHost(true);
    isHostRef.current = true;

    const code = randomRoomCode();
    setRoomCode(code);
    const peer = new Peer(`moyu-${code}`);
    peerRef.current = peer;

    peer.on('open', () => setStatus('房间已创建，等待对手输入房号加入'));
    peer.on('error', err => {
      setError(`创建房间失败：${err.type}`);
      setPhase('lobby');
      setStatus('创建失败，请重试');
      peer.destroy();
      peerRef.current = null;
    });
    peer.on('connection', conn => {
      if (connRef.current && connRef.current.open) {
        conn.close();
        return;
      }
      bindConnection(conn);
    });
  };

  const joinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('请输入 6 位房号');
      return;
    }
    setError('');
    setStatus('正在连接房主…');
    setPhase('joining');
    setIsHost(false);
    isHostRef.current = false;

    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', () => {
      const conn = peer.connect(`moyu-${code}`, { reliable: true });
      bindConnection(conn);
    });
    peer.on('error', err => {
      setError(err.type === 'peer-unavailable' ? '房号不存在或房主已离线' : `连接失败：${err.type}`);
      setPhase('lobby');
      setStatus('连接失败，请重试');
      peer.destroy();
      peerRef.current = null;
    });
  };

  const leaveRoom = () => {
    clearReactionTimer();
    connRef.current?.close();
    connRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
    setConnected(false);
    setPhase('lobby');
    setIsHost(false);
    isHostRef.current = false;
    setRoomCode('');
    setJoinCode('');
    setStatus('创建房间或输入房号加入');
    setGame('ttt');
    gameRef.current = 'ttt';
    resetRoundState();
    setScore({ me: 0, opponent: 0 });
  };

  useEffect(() => () => {
    clearReactionTimer();
    connRef.current?.close();
    peerRef.current?.destroy();
  }, []);

  const myMark: Mark = isHost ? 'X' : 'O';
  const myTurn = connected && !tttResult.winner && turn === myMark;

  const handleCellClick = (index: number) => {
    if (!connected || game !== 'ttt' || !myTurn || board[index]) return;
    applyMove(index, myMark);
    send({ t: 'move', index, mark: myMark });
  };

  const startReactionRound = () => {
    if (!isHost || !connected) return;
    const delay = 1200 + Math.floor(Math.random() * 2200);
    scheduleGo(delay);
    send({ t: 'reaction-start', delay });
  };

  const handleReactionClick = () => {
    if (!connected || reactionPhaseRef.current === 'result' || reactionPhaseRef.current === 'idle') return;

    const elapsed = reactionPhaseRef.current === 'arming'
      ? 99999
      : Math.round(performance.now() - goAtRef.current);

    if (isHostRef.current) {
      pendingRef.current.host = elapsed;
      if (pendingRef.current.guest !== undefined) {
        finishReactionRound(elapsed, pendingRef.current.guest);
      }
    } else {
      pendingRef.current.guest = elapsed;
    }
    send({ t: 'reaction-click', elapsed });
    setReactionPhase('result');
    reactionPhaseRef.current = 'result';
    if (isHostRef.current) {
      setHostElapsed(elapsed);
    } else {
      setGuestElapsed(elapsed);
    }
  };

  const reactionHint = (() => {
    if (reactionPhase === 'idle') return isHost ? '点击下方按钮开始本回合' : '等待房主开始回合';
    if (reactionPhase === 'arming') return '准备…看到「点击！」再出手';
    if (reactionPhase === 'go') return '点击！';
    if (roundResult) {
      if (roundResult === 'tie') return '平局！';
      const iWon = roundResult === (isHost ? 'host' : 'guest');
      return iWon ? '你更快！' : '慢了一步…';
    }
    return '本回合结束';
  })();

  const meWon = roundResult ? roundResult === (isHost ? 'host' : 'guest') : false;

  return (
    <div className="min-h-screen relative overflow-hidden p-6">
      <ParticleBg />

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <motion.button
            type="button"
            onClick={() => { leaveRoom(); navigate('/'); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}
            whileHover={{ scale: 1.04 }}
          >
            ← 返回首页
          </motion.button>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: connected ? '#22c55e' : '#64748b' }} />
            {connected ? '已连接' : 'P2P 联机'}
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🛰️</div>
          <h1
            className="text-4xl md:text-5xl font-black mb-2"
            style={{
              background: `linear-gradient(135deg, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonPurple})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            轻量联机
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            基于 PeerJS 的点对点房间，无需注册；把房号发给同事即可开战
          </p>
        </div>

        <AnimatePresence mode="wait">
          {phase === 'lobby' && (
            <motion.div
              key="lobby"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <div
                className="rounded-3xl p-6"
                style={{ background: 'rgba(26,26,46,0.78)', border: '1px solid rgba(6,182,212,0.3)', backdropFilter: 'blur(16px)' }}
              >
                <div className="text-2xl mb-2">🏠</div>
                <div className="text-xl font-black mb-1">创建房间</div>
                <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  生成 6 位房号，等对手加入。房主执先手并可选游戏。
                </p>
                <motion.button
                  type="button"
                  onClick={createRoom}
                  className="w-full py-3 rounded-2xl font-bold text-sm"
                  style={{ background: `linear-gradient(135deg, ${NEON_COLORS.neonCyan}, ${NEON_COLORS.neonPurple})`, color: '#fff' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  创建房间
                </motion.button>
              </div>

              <div
                className="rounded-3xl p-6"
                style={{ background: 'rgba(26,26,46,0.78)', border: '1px solid rgba(168,85,247,0.3)', backdropFilter: 'blur(16px)' }}
              >
                <div className="text-2xl mb-2">🚪</div>
                <div className="text-xl font-black mb-1">加入房间</div>
                <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  输入房主发来的 6 位房号。
                </p>
                <input
                  value={joinCode}
                  onChange={event => setJoinCode(event.target.value.toUpperCase().slice(0, 6))}
                  onKeyDown={event => { if (event.key === 'Enter') joinRoom(); }}
                  placeholder="例如 A3K9QZ"
                  className="w-full mb-3 px-4 py-3 rounded-2xl outline-none text-center text-lg font-black tracking-[0.3em]"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    color: '#fff',
                  }}
                />
                <motion.button
                  type="button"
                  onClick={joinRoom}
                  className="w-full py-3 rounded-2xl font-bold text-sm"
                  style={{ background: 'rgba(168,85,247,0.85)', color: '#fff' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  加入房间
                </motion.button>
              </div>
            </motion.div>
          )}

          {(phase === 'waiting' || phase === 'joining') && (
            <motion.div
              key="waiting"
              className="rounded-3xl p-8 text-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              style={{ background: 'rgba(26,26,46,0.82)', border: '1px solid rgba(6,182,212,0.3)', backdropFilter: 'blur(16px)' }}
            >
              <div className="text-4xl mb-4 animate-pulse">{phase === 'waiting' ? '📡' : '🔗'}</div>
              <div className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{status}</div>
              {roomCode && phase === 'waiting' && (
                <>
                  <div className="text-4xl font-black tracking-[0.3em] my-5" style={{ color: NEON_COLORS.neonCyan }}>
                    {roomCode}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(roomCode)}
                    className="px-4 py-2 rounded-xl text-xs mb-5"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                  >
                    复制房号
                  </button>
                </>
              )}
              <div>
                <button
                  type="button"
                  onClick={leaveRoom}
                  className="text-xs underline"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  取消
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div
              key="playing"
              className="space-y-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <div
                className="rounded-3xl p-5"
                style={{ background: 'rgba(26,26,46,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {(['ttt', 'reaction'] as GameKind[]).map(kind => (
                      <button
                        key={kind}
                        type="button"
                        disabled={!isHost}
                        onClick={() => switchGame(kind, true)}
                        className="px-3 py-2 rounded-xl text-xs font-bold disabled:cursor-default"
                        style={{
                          background: game === kind ? 'rgba(6,182,212,0.25)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${game === kind ? 'rgba(6,182,212,0.55)' : 'rgba(255,255,255,0.1)'}`,
                          color: game === kind ? '#fff' : 'rgba(255,255,255,0.55)',
                        }}
                      >
                        {GAME_LABELS[kind].icon} {GAME_LABELS[kind].name}
                      </button>
                    ))}
                    {!isHost && <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>游戏由房主选择</span>}
                  </div>
                  <div className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    我 <span style={{ color: NEON_COLORS.neonCyan }}>{score.me}</span>
                    <span className="mx-2 opacity-30">:</span>
                    <span style={{ color: NEON_COLORS.neonPink }}>{score.opponent}</span> 对手
                  </div>
                </div>
                <div className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {GAME_LABELS[game].desc} · 你执 {myMark}
                </div>
              </div>

              {game === 'ttt' && (
                <div
                  className="rounded-3xl p-6 flex flex-col items-center"
                  style={{ background: 'rgba(26,26,46,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}
                >
                  <div className="text-sm mb-4 h-5" style={{ color: tttResult.winner ? NEON_COLORS.neonCyan : 'rgba(255,255,255,0.6)' }}>
                    {tttResult.winner
                      ? tttResult.winner === 'draw'
                        ? '平局！'
                        : tttResult.winner === myMark
                          ? '你赢了！'
                          : '对手赢了'
                      : myTurn
                        ? '轮到你落子'
                        : '等待对手落子…'}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {board.map((cell, index) => {
                      const inWinLine = Boolean(tttResult.line?.includes(index));
                      return (
                        <motion.button
                          key={index}
                          type="button"
                          onClick={() => handleCellClick(index)}
                          className="w-20 h-20 md:w-24 md:h-24 rounded-2xl text-4xl font-black flex items-center justify-center"
                          style={{
                            background: inWinLine ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${inWinLine ? 'rgba(34,197,94,0.6)' : 'rgba(255,255,255,0.12)'}`,
                            color: cell === 'X' ? NEON_COLORS.neonCyan : NEON_COLORS.neonPink,
                            cursor: myTurn && !cell ? 'pointer' : 'default',
                          }}
                          whileHover={myTurn && !cell ? { scale: 1.05 } : undefined}
                          whileTap={myTurn && !cell ? { scale: 0.96 } : undefined}
                        >
                          {cell}
                        </motion.button>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button
                      type="button"
                      onClick={() => { resetRoundState(); send({ t: 'restart', game }); }}
                      className="px-4 py-2 rounded-xl text-xs font-bold"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                    >
                      重开一局
                    </button>
                  </div>
                </div>
              )}

              {game === 'reaction' && (
                <div
                  className="rounded-3xl p-8 flex flex-col items-center"
                  style={{ background: 'rgba(26,26,46,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}
                >
                  <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>反应对决</div>
                  <div
                    className="text-3xl font-black mb-5 text-center min-h-[2.5rem]"
                    style={{
                      color: reactionPhase === 'go' ? NEON_COLORS.neonPink : meWon ? '#4ade80' : 'rgba(255,255,255,0.85)',
                    }}
                  >
                    {reactionHint}
                  </div>

                  <motion.button
                    type="button"
                    onClick={handleReactionClick}
                    disabled={reactionPhase === 'idle' || reactionPhase === 'result'}
                    className="w-48 h-48 md:w-56 md:h-56 rounded-full text-xl font-black disabled:cursor-default"
                    style={{
                      background: reactionPhase === 'go'
                        ? 'radial-gradient(circle at 35% 30%, #ff6b9d, #a855f7)'
                        : reactionPhase === 'arming'
                          ? 'radial-gradient(circle at 35% 30%, #334155, #1e293b)'
                          : 'radial-gradient(circle at 35% 30%, rgba(51,65,85,0.5), rgba(15,23,42,0.8))',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.18)',
                      boxShadow: reactionPhase === 'go' ? '0 0 48px rgba(255,107,157,0.5)' : 'none',
                    }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {reactionPhase === 'go' ? '点击！' : reactionPhase === 'arming' ? '等待…' : '准备'}
                  </motion.button>

                  <div className="mt-5 text-xs h-5 text-center" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {hostElapsed !== null && guestElapsed !== null && (
                      <>
                        房主 {hostElapsed >= 99999 ? '抢跑' : `${hostElapsed}ms`} · 访客 {guestElapsed >= 99999 ? '抢跑' : `${guestElapsed}ms`}
                      </>
                    )}
                  </div>

                  <div className="mt-4">
                    {isHost ? (
                      <button
                        type="button"
                        onClick={startReactionRound}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold"
                        style={{ background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.5)', color: '#fff' }}
                      >
                        {reactionPhase === 'idle' ? '开始本回合' : '再来一回合'}
                      </button>
                    ) : (
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {reactionPhase === 'idle' ? '等待房主开始' : '等待房主开始下一回合'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={leaveRoom}
                  className="text-xs underline"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  离开房间
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div
            className="mt-4 text-center text-xs px-4 py-2 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5' }}
          >
            {error}
          </div>
        )}

        <div className="mt-8 text-center text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
          联机基于 PeerJS 公共信令 + WebRTC 点对点传输。<br />
          若公司网络限制 P2P，可能需要切换到手机热点或改用其他网络。
        </div>
      </div>
    </div>
  );
}
