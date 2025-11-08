/**
 * Parser for PGN annotations with arrows and circles
 * Supports %cal (arrows) and %csl (circles) extensions popular on lichess.org and chesscafe.com
 */

import type { Square, Arrow, SquareHighlight } from './types';
import { PgnParseError } from './errors';

export interface ParsedAnnotations {
  arrows: Arrow[];
  highlights: Array<SquareHighlight & { color: string }>;
  textComment: string;
  evaluation?: number | string;
  issues?: PgnParseError[];
}

// Regular expressions for parsing annotations
const CAL_REGEX = /%cal\s+([^%\s]+)/g;
const CSL_REGEX = /%csl\s+([^%\s]+)/g;
const VISUAL_ANNOTATION_REGEX = /%(?:cal|csl)\s+[^%\s]+/;
const SQUARE_REGEX = /^[a-h][1-8]$/;
const EVAL_REGEX = /(?:\[\s*)?%eval\s+([^\]\s}]+)(?:\s*\])?/gi;

const NUMERIC_VALUE_REGEX = /^[-+]?((\d+(?:\.\d+)?)|(?:\.\d+))$/;

const parseAnnotationValue = (value: string): number | string => {
  const trimmed = value.trim();
  if (NUMERIC_VALUE_REGEX.test(trimmed)) {
    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return trimmed;
};

// Color mapping
const COLOR_MAP: Record<string, string> = {
  R: '#ff0000', // Red
  G: '#00ff00', // Green
  Y: '#ffff00', // Yellow
  B: '#0000ff', // Blue
};

export const PgnAnnotationParser = {
  /**
   * Check if a comment contains visual annotations
   */
  hasVisualAnnotations(comment: string): boolean {
    return VISUAL_ANNOTATION_REGEX.test(comment);
  },

  /**
   * Parse visual annotations from a PGN comment
   */
  parseComment(comment: string): ParsedAnnotations {
    // Strip outer curly braces if present
    let processingComment =
      comment.startsWith('{') && comment.endsWith('}') ? comment.slice(1, -1) : comment;

    const arrows: Arrow[] = [];
    const highlights: Array<SquareHighlight & { color: string }> = [];
    let evaluation: number | string | undefined;
    const issues: PgnParseError[] = [];

    // Parse arrows (%cal)
    const arrowMatches = [...processingComment.matchAll(CAL_REGEX)]; // Use spread to get all matches at once
    for (const match of arrowMatches) {
      const arrowSpecs = match[1].split(',');
      for (const spec of arrowSpecs) {
        const trimmed = spec.trim();
        if (trimmed.length < 5) {
          issues.push(
            new PgnParseError(
              `Invalid arrow annotation segment "${trimmed}".`,
              'PGN_PARSE_INVALID_ARROW_SPEC',
              { details: { spec: trimmed, rawComment: comment } },
            ),
          );
          continue;
        }

        const colorCode = trimmed[0];
        const fromSquare = trimmed.slice(1, 3) as Square;
        const toSquare = trimmed.slice(3, 5) as Square;

        const fromValid = PgnAnnotationParser.isValidSquare(fromSquare);
        const toValid = PgnAnnotationParser.isValidSquare(toSquare);

        if (fromValid && toValid) {
          arrows.push({
            from: fromSquare,
            to: toSquare,
            color: PgnAnnotationParser.colorToHex(colorCode),
          });
        } else {
          const invalidSquares = [
            { valid: fromValid, square: fromSquare },
            { valid: toValid, square: toSquare },
          ]
            .filter(({ valid }) => valid === false)
            .map(({ square }) => square);
          issues.push(
            new PgnParseError(
              `Arrow annotation references invalid square(s) in segment "${trimmed}".`,
              'PGN_PARSE_INVALID_ARROW_SQUARE',
              {
                details: {
                  spec: trimmed,
                  invalidSquares,
                  rawComment: comment,
                },
              },
            ),
          );
        }
      }
      // Remove this annotation from the processingComment
      processingComment = processingComment.replace(match[0], ' ');
    }

    // Parse circles (%csl)
    const circleMatches = [...processingComment.matchAll(CSL_REGEX)]; // Use spread to get all matches at once
    for (const match of circleMatches) {
      const circleSpecs = match[1].split(',');
      for (const spec of circleSpecs) {
        const trimmed = spec.trim();
        if (trimmed.length < 3) {
          issues.push(
            new PgnParseError(
              `Invalid circle annotation segment "${trimmed}".`,
              'PGN_PARSE_INVALID_CIRCLE_SPEC',
              { details: { spec: trimmed, rawComment: comment } },
            ),
          );
          continue;
        }

        const colorCode = trimmed[0];
        const square = trimmed.slice(1, 3) as Square;

        if (PgnAnnotationParser.isValidSquare(square)) {
          highlights.push({
            square,
            type: 'circle',
            color: PgnAnnotationParser.colorToHex(colorCode),
          });
        } else {
          issues.push(
            new PgnParseError(
              `Circle annotation references invalid square in segment "${trimmed}".`,
              'PGN_PARSE_INVALID_CIRCLE_SQUARE',
              { details: { spec: trimmed, square, rawComment: comment } },
            ),
          );
        }
      }
      // Remove this annotation from the processingComment
      processingComment = processingComment.replace(match[0], ' ');
    }

    // Parse evaluation (%eval)
    processingComment = processingComment.replaceAll(EVAL_REGEX, (_match, value: string) => {
      evaluation = parseAnnotationValue(value);
      return ' ';
    });

    // The remaining text in processingComment is the actual text comment
    let textComment = processingComment.replaceAll(/\s+/g, ' ').trim();

    return {
      arrows,
      highlights,
      textComment: textComment || '',
      evaluation,
      issues: issues.length > 0 ? issues : undefined,
    };
  },

  /**
   * Returns drawing objects from parsed annotations
   */
  toDrawingObjects(parsed: ParsedAnnotations): {
    arrows: Arrow[];
    highlights: SquareHighlight[];
  } {
    return {
      arrows: parsed.arrows,
      highlights: parsed.highlights,
    };
  },

  /**
   * Remove visual annotations from a comment, keeping only text
   */
  stripAnnotations(comment: string): string {
    return comment
      .replaceAll(new RegExp(VISUAL_ANNOTATION_REGEX.source, 'g'), '')
      .replaceAll(/\s+/g, ' ')
      .trim();
  },

  /**
   * Create annotation string from arrows and circles
   */
  fromDrawingObjects(arrows: Arrow[], highlights: SquareHighlight[]): string {
    const parts: string[] = [];

    if (arrows.length > 0) {
      const arrowSpecs = arrows
        .map((arrow) => `${PgnAnnotationParser.hexToColor(arrow.color)}${arrow.from}${arrow.to}`)
        .join(',');
      parts.push(`%cal ${arrowSpecs}`);
    }

    if (highlights.length > 0) {
      const circleSpecs = highlights
        .map(
          (circle) =>
            `${PgnAnnotationParser.hexToColor(circle.color ?? COLOR_MAP['R'])}${circle.square}`,
        )
        .join(',');
      parts.push(`%csl ${circleSpecs}`);
    }

    return parts.join(' ');
  },

  /**
   * Convert color code to hex color
   */
  colorToHex(colorCode: string): string {
    return COLOR_MAP[colorCode] || COLOR_MAP['R']; // Default to red
  },

  /**
   * Convert hex color to color code
   */
  hexToColor(hex: string): string {
    for (const [code, color] of Object.entries(COLOR_MAP)) {
      if (color === hex) {
        return code;
      }
    }
    return 'R'; // Default to red
  },

  /**
   * Check if a string is a valid chess square notation
   */
  isValidSquare(square: string): square is Square {
    return SQUARE_REGEX.test(square);
  },
};
