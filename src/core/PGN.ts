import type { Move, RulesAdapter } from './types';

/**
 * PGNRecorder
 * - If adapter exposes getPGN (chess.js), we proxy it.
 * - Else we build a light PGN from LAN (algebraic squares), with minimal SAN (no disamb/check/mate).
 * - Adds helpers to export as a downloadable .pgn file.
 */
export class PGNRecorder {
  private moves: Move[] = [];
  private headers: Record<string, string> = {
    Event: 'Casual Game',
    Site: 'Local',
    Date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    Round: '1',
    White: 'White',
    Black: 'Black',
    Result: '*',
  };
  constructor(private adapter?: RulesAdapter) {}
  reset() {
    this.moves = [];
  }
  push(move: Move) {
    this.moves.push(move);
  }
  setHeaders(h: Partial<Record<keyof typeof this.headers, string>>) {
    Object.assign(this.headers, h);
    if (this.adapter?.header) this.adapter.header(this.headers as any);
  }
  setResult(res: '1-0' | '0-1' | '1/2-1/2' | '*') {
    this.headers.Result = res;
  }
  getPGN() {
    if (this.adapter?.getPGN) {
      return this.adapter.getPGN();
    }
    // Fallback PGN (basic): "1. e2e4 e7e5 2. g1f3 ..."
    const head = Object.entries(this.headers)
      .map(([k, v]) => `[${k} "${v}"]`)
      .join('\n');
    let body = '';
    for (let i = 0; i < this.moves.length; i += 2) {
      const n = i / 2 + 1;
      const w = this.fmt(this.moves[i]);
      const b = this.moves[i + 1] ? this.fmt(this.moves[i + 1]) : '';
      body += `${n}. ${w}${b ? ' ' + b : ''} `;
    }
    return head + '\n\n' + body.trim() + (this.headers.Result ? ' ' + this.headers.Result : '');
  }
  toBlob() {
    const pgn = this.getPGN();
    return new Blob([pgn], { type: 'application/x-chess-pgn' });
  }
  suggestFilename() {
    const safe = (s: string) => s.replace(/[^a-z0-9_\-]+/gi, '_');
    const d = (this.headers.Date || new Date().toISOString().slice(0, 10)).replace(/\./g, '-');
    return `${safe(this.headers.White || 'White')}_vs_${safe(this.headers.Black || 'Black')}_${d}.pgn`;
  }
  download(filename = this.suggestFilename()) {
    // Works in browsers; in SSR just return silently
    if (typeof document === 'undefined') {
      return;
    }
    const url = URL.createObjectURL(this.toBlob());
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }
  private fmt(m: Move) {
    // minimal SAN-ish when promotion happens, otherwise LAN
    const promo = m.promotion ? `=${m.promotion.toUpperCase()}` : '';
    return `${m.from}${m.captured ? 'x' : ''}${m.to}${promo}`;
  }
}
