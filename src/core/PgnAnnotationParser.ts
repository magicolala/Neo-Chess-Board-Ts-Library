/**
 * Parser for PGN annotations with arrows and circles
 * Supports %cal (arrows) and %csl (circles) extensions popular on lichess.org and chesscafe.com
 */

import type { Square, Arrow, SquareHighlight } from './types';

export interface ParsedAnnotations {
  arrows: Arrow[];
  circles: Array<SquareHighlight & { color: string }>;
  textComment: string;
}

// Regular expressions for parsing annotations
const CAL_REGEX = /%cal\s+([^%\s]+)/g;
const CSL_REGEX = /%csl\s+([^%\s]+)/g;
const VISUAL_ANNOTATION_REGEX = /%(?:cal|csl)\s+[^%\s]+/g;
const SQUARE_REGEX = /^[a-h][1-8]$/;

// Color mapping
const COLOR_MAP: Record<string, string> = {
  'R': '#ff0000', // Red
  'G': '#00ff00', // Green
  'Y': '#ffff00', // Yellow
  'B': '#0000ff', // Blue
};

export class PgnAnnotationParser {
  /**
   * Check if a comment contains visual annotations
   */
  public hasVisualAnnotations(comment: string): boolean {
    return VISUAL_ANNOTATION_REGEX.test(comment);
  }

  /**
   * Parse visual annotations from a PGN comment
   */
  public parseAnnotations(comment: string): ParsedAnnotations {
    const arrows: Arrow[] = [];
    const circles: Array<SquareHighlight & { color: string }> = [];
    let textComment = comment;

    // Parse arrows (%cal)
    const arrowMatches = comment.matchAll(CAL_REGEX);
    for (const match of arrowMatches) {
      const arrowSpecs = match[1].split(',');
      for (const spec of arrowSpecs) {
        const trimmed = spec.trim();
        if (trimmed.length >= 5) {
          const colorCode = trimmed[0];
          const fromSquare = trimmed.slice(1, 3) as Square;
          const toSquare = trimmed.slice(3, 5) as Square;
          
          if (PgnAnnotationParser.isValidSquare(fromSquare) && PgnAnnotationParser.isValidSquare(toSquare)) {
            arrows.push({
              from: fromSquare,
              to: toSquare,
              color: PgnAnnotationParser.colorToHex(colorCode)
            });
          }
        }
      }
      // Remove this annotation from text
      textComment = textComment.replace(match[0], ' ');
    }

    // Parse circles (%csl)
    const circleMatches = comment.matchAll(CSL_REGEX);
    for (const match of circleMatches) {
      const circleSpecs = match[1].split(',');
      for (const spec of circleSpecs) {
        const trimmed = spec.trim();
        if (trimmed.length >= 3) {
          const colorCode = trimmed[0];
          const square = trimmed.slice(1, 3) as Square;
          
          if (PgnAnnotationParser.isValidSquare(square)) {
            circles.push({
              square,
              type: 'circle' as any, // Cast to avoid type issues
              color: PgnAnnotationParser.colorToHex(colorCode)
            });
          }
        }
      }
      // Remove this annotation from text
      textComment = textComment.replace(match[0], ' ');
    }

    // Clean up the text comment
    textComment = textComment.replace(/\s+/g, ' ').trim();

    return {
      arrows,
      circles,
      textComment: textComment || ''
    };
  }

  /**
   * Remove visual annotations from a comment, keeping only text
   */
  public stripVisualAnnotations(comment: string): string {
    return comment
      .replace(VISUAL_ANNOTATION_REGEX, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Create annotation string from arrows and circles
   */
  public createAnnotationString(arrows: Arrow[], circles: SquareHighlight[]): string {
    const parts: string[] = [];

    if (arrows.length > 0) {
      const arrowSpecs = arrows.map(arrow => 
        `${PgnAnnotationParser.hexToColor(arrow.color)}${arrow.from}${arrow.to}`
      ).join(',');
      parts.push(`%cal ${arrowSpecs}`);
    }

    if (circles.length > 0) {
      const circleSpecs = circles.map(circle => 
        `${PgnAnnotationParser.hexToColor((circle as any).color)}${circle.square}`
      ).join(',');
      parts.push(`%csl ${circleSpecs}`);
    }

    return parts.join(' ');
  }

  /**
   * Convert color code to hex color
   */
  public colorToHex(colorCode: string): string {
    return PgnAnnotationParser.colorToHex(colorCode);
  }

  /**
   * Convert hex color to color code
   */
  public hexToColor(hex: string): string {
    return PgnAnnotationParser.hexToColor(hex);
  }

  /**
   * Check if a string is a valid chess square notation
   */
  public isValidSquare(square: string): square is Square {
    return PgnAnnotationParser.isValidSquare(square);
  }

  /**
   * Convert color code to hex color
   */
  static colorToHex(colorCode: string): string {
    return COLOR_MAP[colorCode] || COLOR_MAP['R']; // Default to red
  }

  /**
   * Convert hex color to color code
   */
  static hexToColor(hex: string): string {
    for (const [code, color] of Object.entries(COLOR_MAP)) {
      if (color === hex) {
        return code;
      }
    }
    return 'R'; // Default to red
  }

  /**
   * Check if a string is a valid chess square notation
   */
  static isValidSquare(square: string): square is Square {
    return SQUARE_REGEX.test(square);
  }
}
