import React, { useCallback, useMemo, useState } from 'react';
import GameFrame, { StartPanel } from '../GameFrame';
import { useGameSession } from '../useGameSession';
import type { EngineProps, GameStatus } from '../types';

interface Choice {
  text: string;
  next: string;
  courage?: number;
  wisdom?: number;
  health?: number;
}

interface Node {
  text: string;
  choices?: Choice[];
  ending?: 'good' | 'bad' | 'normal';
}

type StoryMap = Record<string, Node>;

function buildStory(meta: EngineProps['meta']): StoryMap {
  const key = `${meta.id} ${meta.name}`.toLowerCase();

  if (/detective|mystery|spy|prison|escape|侦探|悬疑|间谍|逃脱|密室/.test(key)) {
    return {
      start: {
        text: '深夜，你收到一封匿名信：市博物馆的镇馆之宝即将被盗。信里只有一张模糊的展馆地图和一句话——“相信你的直觉”。',
        choices: [
          { text: '立刻赶往博物馆', next: 'museum', courage: 1 },
          { text: '先查清寄信人的身份', next: 'archive', wisdom: 1 },
        ],
      },
      museum: {
        text: '你翻窗进入展馆，黑暗中传来细微的脚步声。展厅中央的展柜已经被打开，玻璃上留下一枚奇怪的指纹。',
        choices: [
          { text: '跟踪脚步声', next: 'chase', courage: 1 },
          { text: '保护现场并报警', next: 'police', wisdom: 1 },
        ],
      },
      archive: {
        text: '你在旧档案室找到十年前的失窃案卷宗，发现两起案件的作案手法完全一致——而当年的嫌疑人早已“死亡”。',
        choices: [
          { text: '把线索交给警方', next: 'police', wisdom: 1 },
          { text: '独自去会会这个“死人”', next: 'chase', courage: 1 },
        ],
      },
      chase: {
        text: '你追到天台，嫌疑人摘下面罩——竟是博物馆的副馆长。他冷笑着后退，身后是城市璀璨的灯火。',
        choices: [
          { text: '扑上去制服他', next: 'fight', courage: 1 },
          { text: '用证据劝他自首', next: 'confess', wisdom: 1 },
        ],
      },
      fight: {
        text: '你们在狭窄的天台上扭打，你被推倒擦伤了手臂，但最终死死扣住了他的手腕。警笛声由远及近。',
        choices: [{ text: '把他交给警方', next: 'endingGood', courage: 1 }],
      },
      confess: {
        text: '你摊开卷宗，一条条说出证据。副馆长的手开始发抖，最终长叹一声，放弃了抵抗。',
        choices: [{ text: '陪他走下天台', next: 'endingGood', wisdom: 1 }],
      },
      police: {
        text: '警方根据你保留的现场证据迅速锁定嫌疑人。第二天，失窃的文物完好无损地回到了展柜。',
        choices: [{ text: '接受表彰', next: 'endingGood', wisdom: 1 }],
      },
      endingGood: { text: '案件告破，你成了城市里小有名气的侦探。匿名信的作者始终没有出现，但你知道，正义已经得到伸张。', ending: 'good' },
    };
  }

  if (/cyber|scifi|space|tech|quantum|robot|赛博|科幻|太空|科技|机器人/.test(key)) {
    return {
      start: {
        text: '公元 2187 年，你是一名空间站维修工程师。警报突然响起：主反应堆将在 12 分钟后过载，而逃生舱只剩一个座位。',
        choices: [
          { text: '前往反应堆手动修复', next: 'reactor', courage: 1 },
          { text: '入侵系统寻找远程方案', next: 'hack', wisdom: 1 },
        ],
      },
      reactor: {
        text: '反应堆舱温度高达 80 度，冷却液正在泄漏。你必须在两根线路之间做出选择。',
        choices: [
          { text: '切断红色主线', next: 'red', courage: 1 },
          { text: '重新接通蓝色备用线', next: 'blue', wisdom: 1 },
        ],
      },
      hack: {
        text: '你接入主控 AI，它告诉你：过载是人为制造的，幕后黑手就在空间站里。',
        choices: [
          { text: '先解除过载，再追查真凶', next: 'blue', wisdom: 1 },
          { text: '立即封锁所有舱门', next: 'lockdown', courage: 1 },
        ],
      },
      red: {
        text: '红色主线被切断，反应堆功率骤降，但备用冷却系统没有启动——你赌错了。',
        choices: [
          { text: '冲回控制台手动启动', next: 'endingBad', health: -1 },
          { text: '用身体压住泄漏口争取时间', next: 'endingGood', courage: 2, health: -1 },
        ],
      },
      blue: {
        text: '蓝色备用线接通，反应堆功率稳定下来。你争取到了宝贵的 30 分钟。',
        choices: [
          { text: '组织全员撤离', next: 'endingGood', wisdom: 1 },
          { text: '追查幕后黑手', next: 'lockdown', courage: 1 },
        ],
      },
      lockdown: {
        text: '舱门逐一封锁，幕后黑手被困在指挥舱。通讯频道里传来他气急败坏的声音。',
        choices: [
          { text: '劝他一起修复空间站', next: 'endingGood', wisdom: 2 },
          { text: '强行破门', next: 'endingNormal', courage: 1, health: -1 },
        ],
      },
      endingGood: { text: '空间站转危为安。你的名字被写进了星际救援史，成为新一代工程师的榜样。', ending: 'good' },
      endingNormal: { text: '危机解除了，但你也付出了代价。空间站进入长期维修，而你开始重新思考科技与人性的边界。', ending: 'normal' },
      endingBad: { text: '反应堆还是过载了。逃生舱在爆炸前一刻弹射出去，你望着远处的火光，心中满是遗憾。', ending: 'bad' },
    };
  }

  if (/romance|love|valentine|story|恋爱|爱情|情人节|剧情/.test(key)) {
    return {
      start: {
        text: '毕业前的最后一个月，你收到一张没有署名的明信片，上面写着：“周五傍晚，老地方见。”',
        choices: [
          { text: '按时赴约', next: 'meet', courage: 1 },
          { text: '先问问朋友是谁写的', next: 'ask', wisdom: 1 },
        ],
      },
      meet: {
        text: '夕阳把操场染成金色。长椅上放着一束花，和一个熟悉的背影。',
        choices: [
          { text: '走上前叫住对方', next: 'talk', courage: 1 },
          { text: '悄悄把花拿走', next: 'leave', wisdom: 1 },
        ],
      },
      ask: {
        text: '朋友们笑而不语，只是把你推向操场的方向。你忽然明白了什么。',
        choices: [
          { text: '跑向操场', next: 'talk', courage: 1 },
          { text: '装作不知道', next: 'leave', health: -1 },
        ],
      },
      talk: {
        text: '对方转过身，手里攥着一封信，脸比夕阳还红。你们同时开口，又同时笑了起来。',
        choices: [
          { text: '认真听完对方的话', next: 'endingGood', wisdom: 1 },
          { text: '先说出自己的心意', next: 'endingGood', courage: 1 },
        ],
      },
      leave: {
        text: '你带着花离开了。多年以后，你仍会想起那个傍晚，以及那个没有说出口的名字。',
        choices: [{ text: '把回忆珍藏起来', next: 'endingNormal', wisdom: 1 }],
      },
      endingGood: { text: '你们并肩坐在操场上，看着夕阳落下去。故事从这一天正式开始。', ending: 'good' },
      endingNormal: { text: '青春里总有一些错过。但你知道，那段心动是真实存在过的。', ending: 'normal' },
    };
  }

  return {
    start: {
      text: '你在一片陌生的森林中醒来，身边只有一张旧地图和一枚指南针。地图上标注着三个地点：古井、断桥、废弃神庙。',
      choices: [
        { text: '前往古井寻找线索', next: 'well', wisdom: 1 },
        { text: '沿断桥继续深入', next: 'bridge', courage: 1 },
        { text: '直奔废弃神庙', next: 'temple', courage: 1 },
      ],
    },
    well: {
      text: '古井里传来回声，你发现井壁上刻着一行小字：“真正的宝藏不在终点，而在选择里。”',
      choices: [
        { text: '把这句话记在心里', next: 'temple', wisdom: 2 },
        { text: '下井寻找机关', next: 'temple', courage: 1, health: -1 },
      ],
    },
    bridge: {
      text: '断桥在风中摇晃，桥下是湍急的河流。你深吸一口气，踏上第一块木板。',
      choices: [
        { text: '快速冲过去', next: 'temple', courage: 2 },
        { text: '扶着绳索小心前进', next: 'temple', wisdom: 1 },
      ],
    },
    temple: {
      text: '神庙深处，石台上放着一个发光的宝箱。墙上刻着最后一行字：“打开它之前，请先回答自己：你真正想要什么？”',
      choices: [
        { text: '选择力量', next: 'endingPower', courage: 1 },
        { text: '选择智慧', next: 'endingWisdom', wisdom: 2 },
        { text: '选择回到家乡', next: 'endingHome', health: 1 },
      ],
    },
    endingPower: { text: '宝箱化作一柄利剑。你成了传说中的勇者，但也明白力量越大，责任越重。', ending: 'normal' },
    endingWisdom: { text: '宝箱化作一本古老的笔记。你带着它回到文明世界，成为受人尊敬的学者。', ending: 'good' },
    endingHome: { text: '宝箱消失了，只留下一阵温暖的风。你转身走出森林，发现回家的路一直都在。', ending: 'good' },
  };
}

export default function StoryGame({ meta, onScore, onGameOver, onExit }: EngineProps) {
  const { best, report, finish } = useGameSession(meta, onScore, onGameOver);
  const story = useMemo(() => buildStory(meta), [meta.id]);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [nodeId, setNodeId] = useState('start');
  const [courage, setCourage] = useState(0);
  const [wisdom, setWisdom] = useState(0);
  const [health, setHealth] = useState(3);
  const [history, setHistory] = useState<string[]>([]);

  const node: Node = story[nodeId] || story.start;

  const start = useCallback(() => {
    setNodeId('start');
    setCourage(0);
    setWisdom(0);
    setHealth(3);
    setHistory([]);
    setStatus('playing');
    report(0);
  }, [report]);

  const choose = (choice: Choice) => {
    if (status !== 'playing') return;
    const nextCourage = courage + (choice.courage || 0);
    const nextWisdom = wisdom + (choice.wisdom || 0);
    const nextHealth = Math.max(0, health + (choice.health || 0));
    const score = nextCourage * 100 + nextWisdom * 120 + nextHealth * 60;
    setCourage(nextCourage);
    setWisdom(nextWisdom);
    setHealth(nextHealth);
    setHistory(prev => [...prev, choice.text]);
    report(score);

    const target = story[choice.next];
    setNodeId(choice.next);
    if (target?.ending) {
      const finalScore = score + (target.ending === 'good' ? 500 : target.ending === 'normal' ? 250 : 0);
      window.setTimeout(() => {
        setStatus(target.ending === 'bad' ? 'lost' : 'won');
        finish(finalScore);
      }, 250);
    }
  };

  return (
    <GameFrame
      meta={meta}
      score={courage * 100 + wisdom * 120 + health * 60}
      best={best}
      status={status}
      stats={[{ label: '勇气', value: courage }, { label: '智慧', value: wisdom }, { label: '生命', value: '❤️'.repeat(health) || '0' }]}
      resultText={node.ending === 'bad' ? '故事走向了遗憾的结局' : '故事完成'}
      hint="阅读剧情并做出选择，不同选择会改变属性与结局"
      onRestart={start}
      onExit={onExit}
    >
      {status === 'idle' ? (
        <StartPanel meta={meta} onStart={start}>
          一段属于你的互动剧情。<br />通过选择影响勇气、智慧与生命，走向不同结局。
        </StartPanel>
      ) : (
        <div style={{ width: '100%', maxWidth: 640, margin: '0 auto' }}>
          <div
            style={{
              padding: '20px 22px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${meta.primary}33`,
              fontSize: 17,
              lineHeight: 1.9,
              minHeight: 140,
              marginBottom: 16,
            }}
          >
            {node.text}
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {(node.choices || []).map((choice, i) => (
              <button
                key={i}
                onClick={() => choose(choice)}
                style={{
                  padding: '14px 16px',
                  textAlign: 'left',
                  borderRadius: 12,
                  border: `1px solid ${meta.primary}55`,
                  background: 'rgba(255,255,255,0.04)',
                  color: '#e2e8f0',
                  fontSize: 15,
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                <span style={{ color: meta.secondary, fontWeight: 800, marginRight: 8 }}>{i + 1}.</span>
                {choice.text}
              </button>
            ))}
            {node.ending && (
              <div style={{ textAlign: 'center', color: '#22c55e', fontWeight: 700, padding: 10 }}>
                达成结局：{node.ending === 'good' ? '圆满' : node.ending === 'normal' ? '平淡' : '遗憾'}
              </div>
            )}
          </div>
          {history.length > 0 && (
            <div style={{ marginTop: 16, color: '#64748b', fontSize: 12, lineHeight: 1.8 }}>
              你的选择：{history.join(' → ')}
            </div>
          )}
        </div>
      )}
    </GameFrame>
  );
}
