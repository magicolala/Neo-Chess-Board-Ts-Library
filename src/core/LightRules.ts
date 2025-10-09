import type { RulesAdapter, Move, Square, Color } from './types';
import { FILES, RANKS, START_FEN, isWhitePiece, parseFEN, sq } from './utils';
function boardToFEN(state: any) {
  const rows: string[] = [];
  for (let r = 7; r >= 0; r--) {
    let s = '';
    let e = 0;
    for (let f = 0; f < 8; f++) {
      const p = state.board[r][f];
      if (!p) e++;
      else {
        if (e) {
          s += e;
          e = 0;
        }
        s += p;
      }
    }
    if (e) s += e;
    rows.push(s);
  }
  return `${rows.join('/')} ${state.turn} ${state.castling || '-'} ${state.ep || '-'} ${state.halfmove || 0} ${
    state.fullmove || 1
  }`;
}

export class LightRules implements RulesAdapter {
  private state = parseFEN(START_FEN);
  reset() {
    this.state = parseFEN(START_FEN);
  }
  setFEN(f: string) {
    this.state = parseFEN(f);
  }
  getFEN() {
    return boardToFEN(this.state);
  }
  turn() {
    return this.state.turn;
  }
  pieceAt(square: Square) {
    const f = FILES.indexOf(square[0] as any);
    const r = RANKS.indexOf(square[1] as any);
    return this.state.board[r][f];
  }
  movesFrom(square: Square): Move[] {
    const p = this.pieceAt(square);
    if (!p) return [];
    const isW = isWhitePiece(p);
    const me: Color = isW ? 'w' : 'b';
    if (me !== this.state.turn) return [];
    const f0 = FILES.indexOf(square[0] as any);
    const r0 = RANKS.indexOf(square[1] as any);
    const occ = (F: number, R: number) => this.state.board[R][F];
    const enemy = (pp: string | null) => pp && isWhitePiece(pp) !== isW;
    const pushes: { f: number; r: number; ep?: boolean }[] = [];
    const ray = (df: number, dr: number) => {
      let F = f0 + df,
        R = r0 + dr;
      while (F >= 0 && F < 8 && R >= 0 && R < 8) {
        const t = occ(F, R);
        if (!t) pushes.push({ f: F, r: R });
        else {
          if (enemy(t)) pushes.push({ f: F, r: R });
          break;
        }
        F += df;
        R += dr;
      }
    };
    switch (p.toLowerCase()) {
      case 'p': {
        const dir = isW ? 1 : -1;
        const start = isW ? 1 : 6;
        if (!occ(f0, r0 + dir)) pushes.push({ f: f0, r: r0 + dir });
        if (r0 === start && !occ(f0, r0 + dir) && !occ(f0, r0 + 2 * dir))
          pushes.push({ f: f0, r: r0 + 2 * dir });
        for (const df of [-1, 1]) {
          const F = f0 + df,
            R = r0 + dir;
          if (F >= 0 && F < 8 && R >= 0 && R < 8) {
            const t = occ(F, R);
            if (t && enemy(t)) pushes.push({ f: F, r: R });
          }
        }
        if (this.state.ep && this.state.ep !== '-') {
          const ef = FILES.indexOf(this.state.ep[0] as any);
          const er = RANKS.indexOf(this.state.ep[1] as any);
          if (er === r0 + dir && Math.abs(ef - f0) === 1) pushes.push({ f: ef, r: er, ep: true });
        }
        break;
      }
      case 'n':
        for (const [df, dr] of [
          [1, 2],
          [2, 1],
          [-1, 2],
          [-2, 1],
          [1, -2],
          [2, -1],
          [-1, -2],
          [-2, -1],
        ] as const) {
          const F = f0 + df,
            R = r0 + dr;
          if (F < 0 || F > 7 || R < 0 || R > 7) continue;
          const t = occ(F, R);
          if (!t || enemy(t)) pushes.push({ f: F, r: R });
        }
        break;
      case 'b':
        ray(1, 1);
        ray(-1, 1);
        ray(1, -1);
        ray(-1, -1);
        break;
      case 'r':
        ray(1, 0);
        ray(-1, 0);
        ray(0, 1);
        ray(0, -1);
        break;
      case 'q':
        ray(1, 0);
        ray(-1, 0);
        ray(0, 1);
        ray(0, -1);
        ray(1, 1);
        ray(-1, 1);
        ray(1, -1);
        ray(-1, -1);
        break;
      case 'k':
        for (let df = -1; df <= 1; df++)
          for (let dr = -1; dr <= 1; dr++) {
            if (!df && !dr) continue;
            const F = f0 + df,
              R = r0 + dr;
            if (F < 0 || F > 7 || R < 0 || R > 7) continue;
            const t = occ(F, R);
            if (!t || enemy(t)) pushes.push({ f: F, r: R });
          }
        break;
    }
    const sq = (f: number, r: number) => (FILES[f] + RANKS[r]) as Square;
    return pushes.map(({ f, r, ep }) => ({
      from: (FILES[f0] + RANKS[r0]) as Square,
      to: sq(f, r),
      ...(ep ? { captured: 'p', ep: true } : {}),
    }));
  }
  move({ from, to, promotion }: { from: Square; to: Square; promotion?: Move['promotion'] }) {
    const s = JSON.parse(JSON.stringify(this.state));
    const f0 = FILES.indexOf(from[0] as any);
    const r0 = RANKS.indexOf(from[1] as any);
    const f1 = FILES.indexOf(to[0] as any);
    const r1 = RANKS.indexOf(to[1] as any);
    const p = s.board[r0][f0];
    if (!p) return { ok: false, reason: 'empty' };
    const isW = isWhitePiece(p);
    if ((isW && s.turn !== 'w') || (!isW && s.turn !== 'b')) return { ok: false, reason: 'turn' };
    const legal = this.movesFrom(from).find((m) => m.to === to);
    if (!legal) return { ok: false, reason: 'illegal' };
    if (legal.ep) {
      const dir = isW ? 1 : -1;
      s.board[r1 - dir][f1] = null;
    }
    s.board[r1][f1] = p;
    s.board[r0][f0] = null;
    if (p.toLowerCase() === 'p' && (r1 === 7 || r1 === 0)) {
      const promo = promotion || 'q';
      s.board[r1][f1] = isW ? promo.toUpperCase() : promo;
    }
    s.turn = s.turn === 'w' ? 'b' : 'w';
    this.state = s; // Update internal state
    return { ok: true, fen: boardToFEN(s), state: s };
  }
}
