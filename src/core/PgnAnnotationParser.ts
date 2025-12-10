/**
 * Parser for PGN annotations with arrows and circles
 * Supports %cal (arrows) and %csl (circles) extensions popular on lichess.org and chesscafe.com
 */

import type { Square, Arrow, SquareHighlight } from './types';
import { PgnParseError, type PgnParseErrorCode } from './errors';

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

type ParsedAnnotationValue = { kind: 'numeric'; value: number } | { kind: 'text'; value: string };

const parseAnnotationValue = (value: string): ParsedAnnotationValue => {
  const trimmed = value.trim();
  if (NUMERIC_VALUE_REGEX.test(trimmed)) {
    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed)) {
      return { kind: 'numeric', value: parsed };
    }
  }
  return { kind: 'text', value: trimmed };
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
    return new AnnotationParser(comment).parse();
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

class AnnotationParser {
  private arrows: Arrow[] = [];
  private highlights: Array<SquareHighlight & { color: string }> = [];
  private evaluation?: number | string;
  private issues: PgnParseError[] = [];
  private processingComment: string;

  constructor(private readonly rawComment: string) {
    this.processingComment = this.stripBraces(rawComment);
  }

  parse(): ParsedAnnotations {
    this.parseArrows();
    this.parseCircles();
    this.parseEvaluation();

    const textComment = this.processingComment.replaceAll(/\s+/g, ' ').trim();
    return {
      arrows: this.arrows,
      highlights: this.highlights,
      textComment: textComment || '',
      evaluation: this.evaluation,
      issues: this.issues.length > 0 ? this.issues : undefined,
    };
  }

  private stripBraces(value: string): string {
    return value.startsWith('{') && value.endsWith('}') ? value.slice(1, -1) : value;
  }

  private parseArrows(): void {
    const matches = [...this.processingComment.matchAll(CAL_REGEX)];
    for (const match of matches) {
      this.processArrowMatch(match);
      this.removeMatch(match[0]);
    }
  }

  private processArrowMatch(match: RegExpMatchArray): void {
    const specs = match[1].split(',');
    for (const spec of specs) {
      this.processArrowSpec(spec.trim());
    }
  }

  private processArrowSpec(trimmed: string): void {
    if (trimmed.length < 5) {
      this.recordIssue(
        'PGN_PARSE_INVALID_ARROW_SPEC',
        `Invalid arrow annotation segment "${trimmed}".`,
        { spec: trimmed },
      );
      return;
    }

    const colorCode = trimmed[0];
    const fromSquare = trimmed.slice(1, 3) as Square;
    const toSquare = trimmed.slice(3, 5) as Square;

    const fromValid = PgnAnnotationParser.isValidSquare(fromSquare);
    const toValid = PgnAnnotationParser.isValidSquare(toSquare);

    if (fromValid && toValid) {
      this.arrows.push({
        from: fromSquare,
        to: toSquare,
        color: PgnAnnotationParser.colorToHex(colorCode),
      });
      return;
    }

    const invalidSquares = [
      { valid: fromValid, square: fromSquare },
      { valid: toValid, square: toSquare },
    ]
      .filter(({ valid }) => !valid)
      .map(({ square }) => square);

    this.recordIssue(
      'PGN_PARSE_INVALID_ARROW_SQUARE',
      `Arrow annotation references invalid square(s) in segment "${trimmed}".`,
      { spec: trimmed, invalidSquares },
    );
  }

  private parseCircles(): void {
    const matches = [...this.processingComment.matchAll(CSL_REGEX)];
    for (const match of matches) {
      this.processCircleMatch(match);
      this.removeMatch(match[0]);
    }
  }

  private processCircleMatch(match: RegExpMatchArray): void {
    const specs = match[1].split(',');
    for (const spec of specs) {
      this.processCircleSpec(spec.trim());
    }
  }

  private processCircleSpec(trimmed: string): void {
    if (trimmed.length < 3) {
      this.recordIssue(
        'PGN_PARSE_INVALID_CIRCLE_SPEC',
        `Invalid circle annotation segment "${trimmed}".`,
        { spec: trimmed },
      );
      return;
    }

    const colorCode = trimmed[0];
    const square = trimmed.slice(1, 3) as Square;

    if (PgnAnnotationParser.isValidSquare(square)) {
      this.highlights.push({
        square,
        type: 'circle',
        color: PgnAnnotationParser.colorToHex(colorCode),
      });
      return;
    }

    this.recordIssue(
      'PGN_PARSE_INVALID_CIRCLE_SQUARE',
      `Circle annotation references invalid square in segment "${trimmed}".`,
      { spec: trimmed, square },
    );
  }

  private parseEvaluation(): void {
    this.processingComment = this.processingComment.replaceAll(EVAL_REGEX, (_match, value: string) => {
      const parsedEvaluation = parseAnnotationValue(value);
      this.evaluation = parsedEvaluation.value;
      return ' ';
    });
  }

  private removeMatch(match: string): void {
    this.processingComment = this.processingComment.replace(match, ' ');
  }

  private recordIssue(
    code: PgnParseErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ): void {
    this.issues.push(
      new PgnParseError(message, code, {
        details: {
          rawComment: this.rawComment,
          ...details,
        },
      }),
    );
  }
}
