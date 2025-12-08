import type { EngineLine } from './types';

const INFO_REGEX = /info\s+(.*)/;
const DEPTH_REGEX = /depth\s+(\d+)/;
const SCORE_CP_REGEX = /score\s+cp\s+(-?\d+)/;
const SCORE_MATE_REGEX = /score\s+mate\s+(-?\d+)/;
const MULTIPV_REGEX = /multipv\s+(\d+)/;
const PV_REGEX = /\bpv\s+(.+)/;
const NPS_REGEX = /nps\s+(\d+)/;
const NODES_REGEX = /nodes\s+(\d+)/;
const TIME_REGEX = /time\s+(\d+)/;
const BESTMOVE_REGEX = /^bestmove\s+(\S+)(?:\s+ponder\s+(\S+))?/;

export function buildUciCommand(
  command: string,
  ...args: Array<string | number | boolean | undefined>
): string {
  const filtered = args
    .filter((arg) => arg !== undefined)
    .map((arg) => (typeof arg === 'boolean' ? String(arg) : arg));
  return [command, ...filtered].join(' ');
}

export function buildPositionCommand(fen: string, moves?: string[]): string {
  const base = `position fen ${fen}`;
  if (moves && moves.length > 0) {
    return `${base} moves ${moves.join(' ')}`;
  }
  return base;
}

export function buildGoCommand({
  depth,
  movetimeMs,
  multiPv,
}: {
  depth?: number;
  movetimeMs?: number;
  multiPv?: number;
}): string {
  const segments: string[] = ['go'];
  if (typeof depth === 'number') {
    segments.push('depth', depth.toString());
  }
  if (typeof movetimeMs === 'number') {
    segments.push('movetime', movetimeMs.toString());
  }
  if (typeof multiPv === 'number') {
    segments.push('multipv', multiPv.toString());
  }
  return segments.join(' ');
}

export function parseInfo(line: string): EngineLine | null {
  const infoMatch = INFO_REGEX.exec(line);
  if (!infoMatch) return null;

  const depthMatch = DEPTH_REGEX.exec(line);
  const multipvMatch = MULTIPV_REGEX.exec(line);
  const scoreCpMatch = SCORE_CP_REGEX.exec(line);
  const scoreMateMatch = SCORE_MATE_REGEX.exec(line);
  const pvMatch = PV_REGEX.exec(line);
  const npsMatch = NPS_REGEX.exec(line);
  const nodesMatch = NODES_REGEX.exec(line);
  const timeMatch = TIME_REGEX.exec(line);

  const depth = depthMatch ? Number(depthMatch[1]) : 0;
  const id = multipvMatch ? Number(multipvMatch[1]) : 1;
  const pv = pvMatch ? pvMatch[1].trim().split(/\s+/) : [];

  let score: EngineLine['score'] | null = null;
  if (scoreCpMatch) {
    score = { type: 'cp', value: Number(scoreCpMatch[1]) } as const;
  } else if (scoreMateMatch) {
    score = { type: 'mate', value: Number(scoreMateMatch[1]) } as const;
  }

  if (!score) return null;

  return {
    id,
    depth,
    score,
    pv,
    nodes: nodesMatch ? Number(nodesMatch[1]) : undefined,
    nps: npsMatch ? Number(npsMatch[1]) : undefined,
    time: timeMatch ? Number(timeMatch[1]) : undefined,
  };
}

export function parseBestMove(line: string): { move: string; ponder?: string } | null {
  const match = BESTMOVE_REGEX.exec(line);
  if (!match) return null;
  const [, move, ponder] = match;
  return { move, ponder: ponder || undefined };
}
