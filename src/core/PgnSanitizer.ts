export function sanitizePgnString(pgn: string): string {
  if (!pgn.trim()) {
    return pgn.trim();
  }

  const normalizedLineEndings = pgn.replaceAll('\r\n', '\n');
  const movesSectionIndex = normalizedLineEndings.indexOf('\n\n');

  if (movesSectionIndex === -1) {
    return normalizeWhitespace(
      mergeSequentialComments(stripVariations(normalizedLineEndings)),
    ).trim();
  }

  const headers = normalizedLineEndings.slice(0, movesSectionIndex + 2);
  const moves = normalizedLineEndings.slice(movesSectionIndex + 2);

  const sanitizedMoves = normalizeWhitespace(
    mergeSequentialComments(stripVariations(moves)),
  ).trim();

  return `${headers}${sanitizedMoves}`.trim();
}

function stripVariations(moves: string): string {
  let result = '';
  let depth = 0;
  let inComment = false;

  for (const char of moves) {
    // Handle comment end
    if (inComment) {
      result += char;
      if (char === '}') inComment = false;
      continue;
    }

    // Handle variation start
    if (char === '(') {
      depth++;
      continue;
    }

    // Handle variation end
    if (char === ')') {
      if (depth > 0) depth--;
      continue;
    }

    // Skip if inside variation
    if (depth > 0) continue;

    // Handle comment start
    if (char === '{') {
      inComment = true;
      result += char;
      continue;
    }

    // Keep default character
    result += char;
  }

  return result;
}

function normalizeWhitespace(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line, index, lines) => line.length > 0 || (index > 0 && lines[index - 1]?.length > 0))
    .join('\n')
    .replaceAll(/[\t ]{2,}/g, ' ')
    .replaceAll(/\s+\n/g, '\n')
    .replaceAll(/\n\s+/g, '\n');
}

function mergeSequentialComments(text: string): string {
  return text.replaceAll(/\}\s*\{/g, ' ');
}
