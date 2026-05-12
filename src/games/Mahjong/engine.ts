export type Suit = 'wan' | 'tong' | 'tiao' | 'wind' | 'dragon';
export type Wind = 'east' | 'south' | 'west' | 'north';
export type Dragon = 'red' | 'green' | 'white';

export interface Tile {
  suit: Suit;
  value: number;
  id: string;
}

export type GamePhase = 'setup' | 'draw' | 'discard' | 'claim' | 'ended';
export type ClaimType = 'chow' | 'pong' | 'kong' | 'win' | null;

export interface Player {
  id: number;
  name: string;
  hand: Tile[];
  exposed: Tile[][];
  isAI: boolean;
  wind: Wind;
  score: number;
}

export interface MahjongState {
  players: Player[];
  currentPlayer: number;
  phase: GamePhase;
  wall: Tile[];
  discardPile: Tile[];
  lastDiscard: Tile | null;
  prevailingWind: Wind;
  round: number;
  winner: number | null;
  claimable: ClaimType[];
}

const SUIT_VALUES: Record<string, number> = {
  'wan': 1, 'tong': 2, 'tiao': 3,
  'wind_east': 4, 'wind_south': 5, 'wind_west': 6, 'wind_north': 7,
  'dragon_red': 8, 'dragon_green': 9, 'dragon_white': 10
};

export class MahjongEngine {
  private players: Player[];
  private currentPlayer: number;
  private phase: GamePhase;
  private wall: Tile[];
  private discardPile: Tile[];
  private lastDiscard: Tile | null;
  private prevailingWind: Wind;
  private round: number;
  private winner: number | null;

  constructor() {
    this.players = [];
    this.currentPlayer = 0;
    this.phase = 'setup';
    this.wall = [];
    this.discardPile = [];
    this.lastDiscard = null;
    this.prevailingWind = 'east';
    this.round = 1;
    this.winner = null;
    this.init();
  }

  private init(): void {
    this.wall = this.createWall();
    this.shuffleWall();
    this.players = this.createPlayers();
    this.dealTiles();
    this.currentPlayer = 0;
    this.phase = 'draw';
    this.discardPile = [];
    this.lastDiscard = null;
    this.winner = null;
  }

  private createWall(): Tile[] {
    const tiles: Tile[] = [];

    for (let i = 1; i <= 9; i++) {
      for (let j = 0; j < 4; j++) {
        tiles.push({ suit: 'wan', value: i, id: `wan_${i}_${j}` });
        tiles.push({ suit: 'tong', value: i, id: `tong_${i}_${j}` });
        tiles.push({ suit: 'tiao', value: i, id: `tiao_${i}_${j}` });
      }
    }

    const winds: Wind[] = ['east', 'south', 'west', 'north'];
    for (const wind of winds) {
      for (let j = 0; j < 4; j++) {
        tiles.push({ suit: 'wind', value: winds.indexOf(wind) + 1, id: `wind_${wind}_${j}` });
      }
    }

    const dragons: Dragon[] = ['red', 'green', 'white'];
    for (const dragon of dragons) {
      for (let j = 0; j < 4; j++) {
        tiles.push({ suit: 'dragon', value: dragons.indexOf(dragon) + 1, id: `dragon_${dragon}_${j}` });
      }
    }

    return tiles;
  }

  private shuffleWall(): void {
    for (let i = this.wall.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.wall[i], this.wall[j]] = [this.wall[j], this.wall[i]];
    }
  }

  private createPlayers(): Player[] {
    const winds: Wind[] = ['east', 'south', 'west', 'north'];
    return [
      { id: 0, name: '玩家', hand: [], exposed: [], isAI: false, wind: winds[0], score: 0 },
      { id: 1, name: 'AI 东', hand: [], exposed: [], isAI: true, wind: winds[1], score: 0 },
      { id: 2, name: 'AI 西', hand: [], exposed: [], isAI: true, wind: winds[2], score: 0 },
      { id: 3, name: 'AI 北', hand: [], exposed: [], isAI: true, wind: winds[3], score: 0 }
    ];
  }

  private dealTiles(): void {
    for (let i = 0; i < 16; i++) {
      for (let p = 0; p < 4; p++) {
        const tile = this.wall.pop();
        if (tile) {
          this.players[p].hand.push(tile);
        }
      }
    }

    for (const player of this.players) {
      this.sortHand(player.hand);
    }
  }

  private sortHand(hand: Tile[]): void {
    hand.sort((a, b) => {
      const aValue = SUIT_VALUES[a.suit] * 10 + a.value;
      const bValue = SUIT_VALUES[b.suit] * 10 + b.value;
      return aValue - bValue;
    });
  }

  getState(): MahjongState {
    return {
      players: this.players.map(p => ({
        ...p,
        hand: p.isAI ? p.hand.map(() => ({ suit: 'wan', value: 0, id: 'hidden' })) : p.hand
      })),
      currentPlayer: this.currentPlayer,
      phase: this.phase,
      wall: [],
      discardPile: this.discardPile,
      lastDiscard: this.lastDiscard,
      prevailingWind: this.prevailingWind,
      round: this.round,
      winner: this.winner,
      claimable: this.getClaimableMoves(0)
    };
  }

  getPlayerHand(playerId: number): Tile[] {
    return this.players[playerId].hand;
  }

  drawTile(playerId: number): boolean {
    if (this.phase !== 'draw' || playerId !== this.currentPlayer) return false;
    if (this.wall.length === 0) {
      this.endGame(-1);
      return true;
    }

    const tile = this.wall.pop();
    if (tile) {
      this.players[playerId].hand.push(tile);
      this.sortHand(this.players[playerId].hand);

      if (this.checkWin(this.players[playerId].hand)) {
        this.endGame(playerId);
        return true;
      }

      this.phase = 'discard';
    }

    return true;
  }

  discardTile(playerId: number, tileId: string): boolean {
    if (this.phase !== 'discard' || playerId !== this.currentPlayer) return false;

    const tileIndex = this.players[playerId].hand.findIndex(t => t.id === tileId);
    if (tileIndex === -1) return false;

    const tile = this.players[playerId].hand.splice(tileIndex, 1)[0];
    this.discardPile.push(tile);
    this.lastDiscard = tile;

    this.phase = 'claim';

    setTimeout(() => this.processClaims(), 1000);

    return true;
  }

  private processClaims(): void {
    if (this.phase !== 'claim') return;

    let claimed = false;

    for (let i = 1; i < 4; i++) {
      const playerId = (this.currentPlayer + i) % 4;
      const player = this.players[playerId];

      if (!player.isAI) continue;

      if (this.checkWinWithTile(player.hand, this.lastDiscard!)) {
        this.endGame(playerId);
        return;
      }

      if (this.canPong(player.hand, this.lastDiscard!)) {
        this.claimPong(playerId);
        claimed = true;
        break;
      }
    }

    if (!claimed) {
      this.currentPlayer = (this.currentPlayer + 1) % 4;
      this.phase = 'draw';

      if (this.players[this.currentPlayer].isAI) {
        setTimeout(() => this.aiTurn(), 1500);
      }
    }
  }

  private aiTurn(): void {
    const player = this.players[this.currentPlayer];
    if (!player.isAI) return;

    if (this.phase === 'draw') {
      this.drawTile(this.currentPlayer);
      setTimeout(() => this.aiTurn(), 500);
    } else if (this.phase === 'discard') {
      const tileToDiscard = this.selectDiscardTile(player.hand);
      this.discardTile(this.currentPlayer, tileToDiscard.id);
    }
  }

  private selectDiscardTile(hand: Tile[]): Tile {
    const isolatedTiles = hand.filter(tile => {
      const sameSuit = hand.filter(t => t.suit === tile.suit);
      const sameValue = sameSuit.filter(t => Math.abs(t.value - tile.value) <= 1);
      return sameValue.length <= 1;
    });

    if (isolatedTiles.length > 0) {
      return isolatedTiles[0];
    }

    const honorTiles = hand.filter(t => t.suit === 'wind' || t.suit === 'dragon');
    if (honorTiles.length > 0) {
      return honorTiles[0];
    }

    return hand[hand.length - 1];
  }

  claimPong(playerId: number): boolean {
    if (this.phase !== 'claim' || !this.lastDiscard) return false;

    const player = this.players[playerId];
    const matchingTiles = player.hand.filter(t => 
      t.suit === this.lastDiscard!.suit && t.value === this.lastDiscard!.value
    );

    if (matchingTiles.length < 2) return false;

    const pongTiles = [this.lastDiscard, ...matchingTiles.slice(0, 2)];
    player.exposed.push(pongTiles);

    player.hand = player.hand.filter(t => !matchingTiles.slice(0, 2).includes(t));

    this.currentPlayer = playerId;
    this.phase = 'discard';

    return true;
  }

  private canPong(hand: Tile[], tile: Tile): boolean {
    const matching = hand.filter(t => t.suit === tile.suit && t.value === tile.value);
    return matching.length >= 2;
  }

  private checkWin(hand: Tile[]): boolean {
    if (hand.length !== 17) return false;
    return this.isValidHand(hand);
  }

  private checkWinWithTile(hand: Tile[], tile: Tile): boolean {
    const testHand = [...hand, tile];
    return this.isValidHand(testHand);
  }

  private isValidHand(tiles: Tile[]): boolean {
    if (tiles.length % 3 !== 2) return false;

    const groups = this.groupTiles(tiles);

    for (const [key, group] of Object.entries(groups)) {
      if (group.length >= 2) {
        const remaining = [...tiles];
        const pairIndices: number[] = [];
        
        for (let i = 0; i < remaining.length - 1 && pairIndices.length < 2; i++) {
          if (remaining[i].suit === group[0].suit && remaining[i].value === group[0].value) {
            pairIndices.push(i);
          }
        }
        
        if (pairIndices.length === 2) {
          pairIndices.sort((a, b) => b - a);
          pairIndices.forEach(idx => remaining.splice(idx, 1));
          
          if (this.canFormSets(remaining)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private groupTiles(tiles: Tile[]): Record<string, Tile[]> {
    const groups: Record<string, Tile[]> = {};
    for (const tile of tiles) {
      const key = `${tile.suit}_${tile.value}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(tile);
    }
    return groups;
  }

  private canFormSets(tiles: Tile[]): boolean {
    if (tiles.length === 0) return true;

    const sorted = [...tiles].sort((a, b) => {
      if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
      return a.value - b.value;
    });

    const first = sorted[0];
    const sameTiles = sorted.filter(t => t.suit === first.suit && t.value === first.value);

    if (sameTiles.length >= 3) {
      const remaining = sorted.filter(t => !sameTiles.slice(0, 3).includes(t));
      if (this.canFormSets(remaining)) return true;
    }

    if (first.suit !== 'wind' && first.suit !== 'dragon') {
      const second = sorted.find(t => t.suit === first.suit && t.value === first.value + 1);
      const third = sorted.find(t => t.suit === first.suit && t.value === first.value + 2);

      if (second && third) {
        const remaining = sorted.filter(t => t !== first && t !== second && t !== third);
        if (this.canFormSets(remaining)) return true;
      }
    }

    return false;
  }

  getClaimableMoves(playerId: number): ClaimType[] {
    if (this.phase !== 'claim' || !this.lastDiscard) return [];
    
    const player = this.players[playerId];
    const moves: ClaimType[] = [];

    if (this.checkWinWithTile(player.hand, this.lastDiscard)) {
      moves.push('win');
    }

    if (this.canPong(player.hand, this.lastDiscard)) {
      moves.push('pong');
    }

    return moves;
  }

  private endGame(winnerId: number): void {
    this.winner = winnerId;
    this.phase = 'ended';

    if (winnerId >= 0) {
      const baseScore = 100;
      this.players[winnerId].score += baseScore * 3;
      for (let i = 0; i < 4; i++) {
        if (i !== winnerId) {
          this.players[i].score -= baseScore;
        }
      }
    }
  }

  reset(): void {
    this.init();
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = '#0a3d0a';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 200);
    gradient.addColorStop(0, 'rgba(0, 100, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 50, 0, 0.1)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 200, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 180, 0, Math.PI * 2);
    ctx.stroke();

    if (this.lastDiscard) {
      this.renderTile(ctx, this.lastDiscard, centerX - 20, centerY - 30, 40);
      ctx.fillStyle = '#ffd700';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('打出', centerX, centerY + 30);
    }

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`剩余牌: ${this.wall.length}`, 20, 30);
    ctx.fillText(`圈风: ${this.getWindName(this.prevailingWind)}`, 20, 55);
    ctx.fillText(`第 ${this.round} 局`, 20, 80);

    this.renderDiscardPile(ctx, width - 150, 20);
  }

  private renderDiscardPile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#ffd700';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('弃牌区', x, y);

    const recentDiscards = this.discardPile.slice(-6);
    for (let i = 0; i < recentDiscards.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      this.renderTile(ctx, recentDiscards[i], x + col * 35, y + 15 + row * 50, 30);
    }
  }

  private renderTile(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number, size: number): void {
    const gradient = ctx.createLinearGradient(x, y, x, y + size * 1.4);
    gradient.addColorStop(0, '#f5f5f5');
    gradient.addColorStop(1, '#e0e0e0');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size * 1.4, 4);
    ctx.fill();

    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = this.getTileColor(tile);
    ctx.font = `bold ${size * 0.4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = this.getTileText(tile);
    ctx.fillText(text, x + size / 2, y + size * 0.5);

    if (tile.suit === 'wan' || tile.suit === 'tong' || tile.suit === 'tiao') {
      ctx.font = `${size * 0.25}px sans-serif`;
      ctx.fillText(tile.value.toString(), x + size / 2, y + size * 0.85);
    }
  }

  private getTileColor(tile: Tile): string {
    if (tile.suit === 'wan') return '#cc0000';
    if (tile.suit === 'tong') return '#0066cc';
    if (tile.suit === 'tiao') return '#00aa00';
    if (tile.suit === 'dragon') {
      if (tile.value === 1) return '#cc0000';
      if (tile.value === 2) return '#00aa00';
      return '#666666';
    }
    return '#333333';
  }

  private getTileText(tile: Tile): string {
    if (tile.suit === 'wan') return '万';
    if (tile.suit === 'tong') return '筒';
    if (tile.suit === 'tiao') return '条';
    if (tile.suit === 'wind') {
      const winds = ['东', '南', '西', '北'];
      return winds[tile.value - 1];
    }
    if (tile.suit === 'dragon') {
      const dragons = ['中', '发', '白'];
      return dragons[tile.value - 1];
    }
    return '';
  }

  private getWindName(wind: Wind): string {
    const names: Record<Wind, string> = {
      east: '东', south: '南', west: '西', north: '北'
    };
    return names[wind];
  }
}
