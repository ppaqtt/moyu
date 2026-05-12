export type Role = 'werewolf' | 'villager' | 'seer' | 'witch' | 'hunter' | 'guard' | 'elder';

export interface Player {
  id: number;
  name: string;
  role: Role;
  isAlive: boolean;
  hasVoted: boolean;
  voteCount: number;
  hasActedTonight: boolean;
  isProtected: boolean;
  hasPoison: boolean;
  hasAntidote: boolean;
  hasUsedSkill: boolean;
}

export type Phase = 'night' | 'day' | 'voting' | 'discussion' | 'gameOver';
export type NightAction = 'werewolf' | 'seer' | 'witch' | 'guard' | 'none';

export interface WerewolfState {
  players: Player[];
  phase: Phase;
  currentNightAction: NightAction;
  currentPlayerIndex: number;
  dayNumber: number;
  message: string;
  lastNightEvents: string[];
  survivors: number[];
  werewolves: number[];
  seerTarget: number | null;
  seerResult: string;
  witchTargets: { target: number; isPoison: boolean } | null;
  guardTarget: number | null;
  hunterTarget: number | null;
  hunterShot: boolean;
  votes: { voterId: number; targetId: number }[];
  winner: 'villagers' | 'werewolves' | null;
  discussionTimer: number;
  revealVotes: boolean;
}

const PLAYER_NAMES = ['你', '小红', '小明', '小华', '小李', '小张', '小王', '小赵'];
const INITIAL_ROLES: Role[] = ['werewolf', 'villager', 'seer', 'witch', 'guard', 'hunter', 'villager', 'villager'];

export class WerewolfEngine {
  private players: Player[] = [];
  private phase: Phase = 'day';
  private currentNightAction: NightAction = 'none';
  private currentPlayerIndex: number = 0;
  private dayNumber: number = 1;
  private message: string = '等待游戏开始...';
  private lastNightEvents: string[] = [];
  private werewolves: number[] = [];
  private seerTarget: number | null = null;
  private seerResult: string = '';
  private witchTargets: { target: number; isPoison: boolean } | null = null;
  private guardTarget: number | null = null;
  private hunterTarget: number | null = null;
  private hunterShot: boolean = false;
  private votes: { voterId: number; targetId: number }[] = [];
  private winner: 'villagers' | 'werewolves' | null = null;
  private discussionTimer: number = 30;
  private revealVotes: boolean = false;
  private nightOrder: NightAction[] = ['guard', 'werewolf', 'seer', 'witch'];
  private nightActionIndex: number = 0;
  private aiTimeout: number = 0;

  constructor() {
    this.initGame();
  }

  private initGame(): void {
    this.players = [];
    this.werewolves = [];
    this.dayNumber = 1;
    this.phase = 'day';
    this.currentNightAction = 'none';
    this.message = '点击"开始游戏"进入第一夜';
    this.lastNightEvents = [];
    this.seerTarget = null;
    this.seerResult = '';
    this.witchTargets = null;
    this.guardTarget = null;
    this.hunterTarget = null;
    this.hunterShot = false;
    this.votes = [];
    this.winner = null;
    this.discussionTimer = 30;
    this.revealVotes = false;
    this.nightActionIndex = 0;

    const shuffledRoles = this.shuffleArray([...INITIAL_ROLES]);
    
    for (let i = 0; i < 8; i++) {
      const player: Player = {
        id: i,
        name: PLAYER_NAMES[i] || `玩家${i + 1}`,
        role: shuffledRoles[i],
        isAlive: true,
        hasVoted: false,
        voteCount: 0,
        hasActedTonight: false,
        isProtected: false,
        hasPoison: true,
        hasAntidote: true,
        hasUsedSkill: false,
      };
      this.players.push(player);
      
      if (player.role === 'werewolf') {
        this.werewolves.push(player.id);
      }
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getState(): WerewolfState {
    const alivePlayers = this.players.filter(p => p.isAlive);
    return {
      players: this.players.map(p => ({ ...p })),
      phase: this.phase,
      currentNightAction: this.currentNightAction,
      currentPlayerIndex: this.currentPlayerIndex,
      dayNumber: this.dayNumber,
      message: this.message,
      lastNightEvents: [...this.lastNightEvents],
      survivors: alivePlayers.map(p => p.id),
      werewolves: [...this.werewolves],
      seerTarget: this.seerTarget,
      seerResult: this.seerResult,
      witchTargets: this.witchTargets,
      guardTarget: this.guardTarget,
      hunterTarget: this.hunterTarget,
      hunterShot: this.hunterShot,
      votes: [...this.votes],
      winner: this.winner,
      discussionTimer: this.discussionTimer,
      revealVotes: this.revealVotes,
    };
  }

  startGame(): void {
    this.initGame();
    this.startNight();
  }

  private startNight(): void {
    this.phase = 'night';
    this.dayNumber++;
    this.lastNightEvents = [];
    this.message = `第${this.dayNumber}夜来临，请闭眼...`;
    this.nightActionIndex = 0;
    
    this.players.forEach(p => {
      p.hasActedTonight = false;
      p.isProtected = false;
    });
    
    this.seerTarget = null;
    this.seerResult = '';
    this.witchTargets = null;
    this.guardTarget = null;
    this.hunterShot = false;
    this.votes = [];
    this.revealVotes = false;

    setTimeout(() => this.processNightAction(), 2000);
  }

  private processNightAction(): void {
    if (this.phase !== 'night') return;
    
    const aliveWerewolves = this.werewolves.filter(id => this.players[id].isAlive);
    
    if (aliveWerewolves.length === 0) {
      this.endNight();
      return;
    }

    if (this.nightActionIndex < this.nightOrder.length) {
      const action = this.nightOrder[this.nightActionIndex];
      this.currentNightAction = action;
      
      switch (action) {
        case 'guard':
          const aliveGuard = this.players.find(p => p.role === 'guard' && p.isAlive);
          if (aliveGuard && !aliveGuard.hasActedTonight) {
            if (aliveGuard.id === 0) {
              this.message = '守卫请选择要保护的目标';
            } else {
              this.aiGuardAction(aliveGuard.id);
            }
          } else {
            this.nightActionIndex++;
            this.processNightAction();
          }
          break;
        case 'werewolf':
          if (aliveWerewolves.length > 0) {
            if (aliveWerewolves.includes(0)) {
              this.message = '狼人请选择要击杀的目标';
            } else {
              this.aiWerewolfAction();
            }
          } else {
            this.nightActionIndex++;
            this.processNightAction();
          }
          break;
        case 'seer':
          const aliveSeer = this.players.find(p => p.role === 'seer' && p.isAlive);
          if (aliveSeer && !aliveSeer.hasActedTonight) {
            if (aliveSeer.id === 0) {
              this.message = '预言家请选择要查验的目标';
            } else {
              this.aiSeerAction();
            }
          } else {
            this.nightActionIndex++;
            this.processNightAction();
          }
          break;
        case 'witch':
          const aliveWitch = this.players.find(p => p.role === 'witch' && p.isAlive);
          if (aliveWitch && !aliveWitch.hasActedTonight) {
            if (aliveWitch.id === 0) {
              this.message = '女巫请选择要使用的药水';
            } else {
              this.aiWitchAction();
            }
          } else {
            this.nightActionIndex++;
            this.processNightAction();
          }
          break;
        default:
          this.nightActionIndex++;
          this.processNightAction();
      }
    } else {
      this.endNight();
    }
  }

  private aiGuardAction(guardId: number): void {
    const alivePlayers = this.players.filter(p => p.isAlive && p.id !== guardId);
    if (alivePlayers.length === 0) {
      this.guardTarget = null;
      this.nightActionIndex++;
      this.processNightAction();
      return;
    }

    const protectedPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    this.guardTarget = protectedPlayer.id;
    this.players[protectedPlayer.id].isProtected = true;
    this.lastNightEvents.push(`守卫保护了 ${this.players[protectedPlayer.id].name}`);
    
    this.nightActionIndex++;
    setTimeout(() => this.processNightAction(), 1500);
  }

  private aiWerewolfAction(): void {
    const alivePlayers = this.players.filter(p => p.isAlive && !this.werewolves.includes(p.id));
    if (alivePlayers.length === 0) {
      this.nightActionIndex++;
      this.processNightAction();
      return;
    }

    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    this.lastNightEvents.push(`狼人袭击了 ${target.name}`);
    
    this.nightActionIndex++;
    setTimeout(() => this.processNightAction(), 1500);
  }

  private aiSeerAction(): void {
    const alivePlayers = this.players.filter(p => p.isAlive && p.id !== 1);
    if (alivePlayers.length === 0) {
      this.nightActionIndex++;
      this.processNightAction();
      return;
    }

    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    this.seerTarget = target.id;
    this.seerResult = this.werewolves.includes(target.id) ? '狼人' : '好人';
    this.lastNightEvents.push(`预言家查验了 ${target.name}: ${this.seerResult}`);
    
    this.nightActionIndex++;
    setTimeout(() => this.processNightAction(), 1500);
  }

  private aiWitchAction(): void {
    this.nightActionIndex++;
    setTimeout(() => this.processNightAction(), 500);
  }

  selectGuardTarget(targetId: number): void {
    if (this.currentNightAction !== 'guard') return;
    
    const guard = this.players.find(p => p.role === 'guard' && p.isAlive);
    if (!guard || guard.id !== 0) return;

    this.guardTarget = targetId;
    this.players[targetId].isProtected = true;
    this.lastNightEvents.push(`守卫保护了 ${this.players[targetId].name}`);
    
    const guardPlayer = this.players.find(p => p.id === guard.id);
    if (guardPlayer) guardPlayer.hasActedTonight = true;
    
    this.nightActionIndex++;
    setTimeout(() => this.processNightAction(), 1500);
  }

  selectWerewolfTarget(targetId: number): void {
    if (this.currentNightAction !== 'werewolf') return;
    if (!this.werewolves.includes(0)) return;
    
    this.lastNightEvents.push(`狼人袭击了 ${this.players[targetId].name}`);
    
    const werewolfPlayers = this.players.filter(p => p.role === 'werewolf');
    werewolfPlayers.forEach(p => {
      if (p.isAlive) p.hasActedTonight = true;
    });
    
    this.nightActionIndex++;
    setTimeout(() => this.processNightAction(), 1500);
  }

  selectSeerTarget(targetId: number): void {
    if (this.currentNightAction !== 'seer') return;
    
    const seer = this.players.find(p => p.role === 'seer' && p.isAlive);
    if (!seer || seer.id !== 0) return;

    this.seerTarget = targetId;
    const target = this.players[targetId];
    this.seerResult = this.werewolves.includes(targetId) ? '狼人' : '好人';
    this.lastNightEvents.push(`预言家查验了 ${target.name}: ${this.seerResult}`);
    
    seer.hasActedTonight = true;
    this.nightActionIndex++;
    setTimeout(() => this.processNightAction(), 1500);
  }

  witchUsePoison(targetId: number): void {
    if (this.currentNightAction !== 'witch') return;
    
    const witch = this.players.find(p => p.role === 'witch' && p.isAlive);
    if (!witch || witch.id !== 0 || !witch.hasPoison) return;

    this.witchTargets = { target: targetId, isPoison: true };
    witch.hasPoison = false;
    witch.hasActedTonight = true;
    this.lastNightEvents.push(`女巫使用毒药杀死了 ${this.players[targetId].name}`);
    
    this.nightActionIndex++;
    setTimeout(() => this.processNightAction(), 1500);
  }

  witchUseAntidote(targetId: number): void {
    if (this.currentNightAction !== 'witch') return;
    
    const witch = this.players.find(p => p.role === 'witch' && p.isAlive);
    if (!witch || witch.id !== 0 || !witch.hasAntidote) return;

    this.witchTargets = { target: targetId, isPoison: false };
    this.players[targetId].isProtected = true;
    witch.hasAntidote = false;
    witch.hasActedTonight = true;
    this.lastNightEvents.push(`女巫使用解药保护了 ${this.players[targetId].name}`);
    
    this.nightActionIndex++;
    setTimeout(() => this.processNightAction(), 1500);
  }

  witchSkipAction(): void {
    if (this.currentNightAction !== 'witch') return;
    
    const witch = this.players.find(p => p.role === 'witch' && p.isAlive);
    if (!witch || witch.id !== 0) return;

    witch.hasActedTonight = true;
    this.nightActionIndex++;
    setTimeout(() => this.processNightAction(), 1500);
  }

  private endNight(): void {
    this.phase = 'day';
    this.currentNightAction = 'none';
    
    let killedByWolf: Player[] = [];
    
    if (this.lastNightEvents.some(e => e.includes('狼人袭击'))) {
      const wolfEvent = this.lastNightEvents.find(e => e.includes('狼人袭击'));
      if (wolfEvent) {
        const targetName = wolfEvent.replace('狼人袭击了 ', '');
        const killed = this.players.find(p => p.name === targetName && p.isAlive);
        if (killed && !killed.isProtected) {
          killedByWolf.push(killed);
        }
      }
    }

    if (this.witchTargets) {
      const witchEvent = this.lastNightEvents.find(e => e.includes('女巫使用毒药'));
      if (witchEvent && !this.players[this.witchTargets.target].isProtected) {
        const target = this.players.find(p => p.id === this.witchTargets!.target);
        if (target && !killedByWolf.includes(target)) {
          killedByWolf.push(target);
        }
      }
    }

    killedByWolf.forEach(player => {
      player.isAlive = false;
      if (player.role === 'hunter' && !this.hunterShot) {
        this.hunterShot = true;
        this.lastNightEvents.push(`${player.name}（猎人）死亡，可以选择带走一人`);
      }
    });

    if (killedByWolf.length === 0) {
      this.lastNightEvents.push('今晚是平安夜！');
    }

    this.message = `第${this.dayNumber}天到来，昨晚死亡: ${killedByWolf.length > 0 ? killedByWolf.map(p => p.name).join(', ') : '无'}`;
    
    this.checkWinCondition();
    
    if (this.winner) {
      this.phase = 'gameOver';
    }
  }

  startDiscussion(): void {
    if (this.phase !== 'day') return;
    this.phase = 'discussion';
    this.message = '自由讨论时间开始！';
    this.discussionTimer = 30;
    
    this.aiTimeout = window.setInterval(() => {
      this.discussionTimer--;
      if (this.discussionTimer <= 0) {
        this.startVoting();
      }
    }, 1000);
  }

  private startVoting(): void {
    if (this.aiTimeout) {
      clearInterval(this.aiTimeout);
    }
    
    this.phase = 'voting';
    this.message = '投票时间开始！';
    this.votes = [];
    this.revealVotes = false;
    
    const alivePlayers = this.players.filter(p => p.isAlive);
    alivePlayers.forEach(p => p.hasVoted = false);
    
    if (this.players[0].isAlive) {
      this.message = '请选择要投票放逐的玩家';
    } else {
      this.processAIVoting();
    }
  }

  vote(targetId: number): void {
    if (this.phase !== 'voting') return;
    if (!this.players[0].isAlive) return;
    if (this.players[0].hasVoted) return;

    this.votes.push({ voterId: 0, targetId });
    this.players[0].hasVoted = true;
    
    this.message = `你投票放逐了 ${this.players[targetId].name}`;
    
    this.checkAllVoted();
  }

  private processAIVoting(): void {
    const alivePlayers = this.players.filter(p => p.isAlive);
    const aiPlayers = alivePlayers.filter(p => p.id !== 0);
    
    aiPlayers.forEach(ai => {
      if (!ai.hasVoted) {
        const targets = alivePlayers.filter(p => p.id !== ai.id);
        const target = targets[Math.floor(Math.random() * targets.length)];
        this.votes.push({ voterId: ai.id, targetId: target.id });
        ai.hasVoted = true;
      }
    });
    
    this.checkAllVoted();
  }

  private checkAllVoted(): void {
    const alivePlayers = this.players.filter(p => p.isAlive);
    const allVoted = alivePlayers.every(p => p.hasVoted);
    
    if (allVoted) {
      this.revealVotes = true;
      this.countVotes();
    } else {
      setTimeout(() => this.processAIVoting(), 1000);
    }
  }

  private countVotes(): void {
    const voteCounts: Record<number, number> = {};
    
    this.votes.forEach(vote => {
      voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
    });

    this.players.forEach(p => {
      p.voteCount = voteCounts[p.id] || 0;
    });

    const maxVotes = Math.max(...Object.values(voteCounts));
    const tied = Object.entries(voteCounts).filter(([_, count]) => count === maxVotes).length > 1;

    if (tied || maxVotes === 0) {
      this.message = '投票平局或无人投票，今天没有人被放逐';
      setTimeout(() => {
        this.dayNumber++;
        this.startNight();
      }, 3000);
    } else {
      const exiledId = Number(Object.entries(voteCounts).find(([_, count]) => count === maxVotes)?.[0]);
      const exiled = this.players[exiledId];
      
      this.message = `${exiled.name} 被投票出局！身份是: ${this.getRoleDisplay(exiled.role)}`;
      
      exiled.isAlive = false;
      
      if (exiled.role === 'hunter' && !this.hunterShot) {
        this.hunterShot = true;
        this.message += ' 猎人可以选择带走一人！';
        this.phase = 'day';
        
        if (exiledId !== 0) {
          setTimeout(() => this.aiHunterShot(), 2000);
        }
      } else {
        this.checkWinCondition();
        
        if (this.winner) {
          this.phase = 'gameOver';
        } else {
          setTimeout(() => {
            this.dayNumber++;
            this.startNight();
          }, 3000);
        }
      }
    }
  }

  private aiHunterShot(): void {
    const alivePlayers = this.players.filter(p => p.isAlive);
    if (alivePlayers.length > 0) {
      const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      this.hunterTarget = target.id;
      target.isAlive = false;
      this.lastNightEvents.push(`猎人带走了 ${target.name}`);
      this.message += ` 猎人带走了 ${target.name}`;
    }
    
    this.checkWinCondition();
    
    if (this.winner) {
      this.phase = 'gameOver';
    } else {
      setTimeout(() => {
        this.dayNumber++;
        this.startNight();
      }, 3000);
    }
  }

  hunterShoot(targetId: number): void {
    if (!this.hunterShot) return;
    if (!this.players[0].isAlive) return;
    
    this.hunterTarget = targetId;
    const target = this.players[targetId];
    target.isAlive = false;
    this.lastNightEvents.push(`猎人带走了 ${target.name}`);
    this.message = `猎人带走了 ${target.name}`;
    
    this.hunterShot = false;
    
    this.checkWinCondition();
    
    if (this.winner) {
      this.phase = 'gameOver';
    } else {
      setTimeout(() => {
        this.dayNumber++;
        this.startNight();
      }, 3000);
    }
  }

  skipHunterShot(): void {
    if (!this.hunterShot) return;
    if (!this.players[0].isAlive) return;
    
    this.hunterShot = false;
    this.message = '猎人选择不开枪';
    
    this.checkWinCondition();
    
    if (this.winner) {
      this.phase = 'gameOver';
    } else {
      setTimeout(() => {
        this.dayNumber++;
        this.startNight();
      }, 3000);
    }
  }

  private checkWinCondition(): void {
    const alivePlayers = this.players.filter(p => p.isAlive);
    const aliveWerewolves = alivePlayers.filter(p => this.werewolves.includes(p.id));
    const aliveVillagers = alivePlayers.filter(p => !this.werewolves.includes(p.id));

    if (aliveWerewolves.length === 0) {
      this.winner = 'villagers';
      this.message = '好人胜利！所有狼人已被放逐！';
    } else if (aliveWerewolves.length >= aliveVillagers.length) {
      this.winner = 'werewolves';
      this.message = '狼人胜利！狼人数量已超过好人！';
    }
  }

  private getRoleDisplay(role: Role): string {
    const roleNames: Record<Role, string> = {
      werewolf: '狼人',
      villager: '村民',
      seer: '预言家',
      witch: '女巫',
      hunter: '猎人',
      guard: '守卫',
      elder: '长老',
    };
    return roleNames[role];
  }

  skipNightAction(): void {
    if (this.nightActionIndex < this.nightOrder.length) {
      this.nightActionIndex++;
      this.processNightAction();
    }
  }

  reset(): void {
    if (this.aiTimeout) {
      clearInterval(this.aiTimeout);
    }
    this.initGame();
  }

  getCurrentActionPlayer(): Player | null {
    if (this.phase !== 'night' || this.currentNightAction === 'none') return null;
    
    switch (this.currentNightAction) {
      case 'werewolf':
        return this.players.find(p => this.werewolves.includes(p.id) && p.isAlive) || null;
      case 'seer':
        return this.players.find(p => p.role === 'seer' && p.isAlive) || null;
      case 'witch':
        return this.players.find(p => p.role === 'witch' && p.isAlive) || null;
      case 'guard':
        return this.players.find(p => p.role === 'guard' && p.isAlive) || null;
      default:
        return null;
    }
  }

  getAlivePlayers(): Player[] {
    return this.players.filter(p => p.isAlive);
  }

  getPlayerRole(playerId: number): Role | null {
    const player = this.players[playerId];
    return player ? player.role : null;
  }

  isPlayerWerewolf(playerId: number): boolean {
    return this.werewolves.includes(playerId);
  }

  canPlayerAct(playerId: number): boolean {
    const player = this.players[playerId];
    if (!player || !player.isAlive) return false;
    if (player.hasActedTonight) return false;
    
    return (
      (this.currentNightAction === 'werewolf' && this.werewolves.includes(playerId)) ||
      (this.currentNightAction === 'seer' && player.role === 'seer') ||
      (this.currentNightAction === 'witch' && player.role === 'witch') ||
      (this.currentNightAction === 'guard' && player.role === 'guard')
    );
  }
}
