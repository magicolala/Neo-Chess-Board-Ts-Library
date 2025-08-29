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

export class PgnAnnotationParser {
  // Mapping des couleurs selon les standards lichess/chesscafe
  private static readonly COLOR_MAP = {
    'R': { hex: '#ef4444', type: 'red' as HighlightType },      // Rouge
    'G': { hex: '#22c55e', type: 'green' as HighlightType },    // Vert
    'Y': { hex: '#eab308', type: 'yellow' as HighlightType },   // Jaune
    'B': { hex: '#3b82f6', type: 'blue' as HighlightType },     // Bleu
    'O': { hex: '#f97316', type: 'orange' as HighlightType },   // Orange (extension)
    'P': { hex: '#a855f7', type: 'purple' as HighlightType }    // Violet (extension)
  };

  /**
   * Parse les annotations dans un commentaire PGN
   * @param comment Le commentaire PGN potentiellement avec des annotations
   * @returns Les annotations parsées (flèches et cercles)
   */
  public static parseComment(comment: string): ParsedAnnotations {
    const result: ParsedAnnotations = {
      arrows: [],
      circles: []
    };

    // Parser les flèches [%cal ...]
    const arrowMatches = comment.match(/\[%cal\s+([^\]]+)\]/g);
    if (arrowMatches) {
      for (const match of arrowMatches) {
        const arrowList = match.replace(/\[%cal\s+/, '').replace(/\]/, '');
        const arrows = this.parseArrows(arrowList);
        result.arrows.push(...arrows);
      }
    }

    // Parser les cercles [%csl ...]
    const circleMatches = comment.match(/\[%csl\s+([^\]]+)\]/g);
    if (circleMatches) {
      for (const match of circleMatches) {
        const circleList = match.replace(/\[%csl\s+/, '').replace(/\]/, '');
        const circles = this.parseCircles(circleList);
        result.circles.push(...circles);
      }
    }

    return result;
  }

  /**
   * Parse une liste de flèches au format "Gc2c3,Rc3d4"
   */
  private static parseArrows(arrowList: string): PgnArrowAnnotation[] {
    const arrows: PgnArrowAnnotation[] = [];
    
    // Séparer les flèches par virgule et nettoyer les espaces
    const arrowSpecs = arrowList.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const spec of arrowSpecs) {
      const arrow = this.parseArrowSpec(spec);
      if (arrow) {
        arrows.push(arrow);
      }
    }

    return arrows;
  }

  /**
   * Parse une spécification de flèche individuelle au format "Gc2c3"
   */
  private static parseArrowSpec(spec: string): PgnArrowAnnotation | null {
    // Format: couleur + case_from + case_to (ex: "Gc2c3")
    const match = spec.match(/^([RGYBOP])([a-h][1-8])([a-h][1-8])$/);
    
    if (!match) {
      console.warn(`Format de flèche invalide: ${spec}`);
      return null;
    }

    const [, colorCode, fromSquare, toSquare] = match;
    const colorInfo = this.COLOR_MAP[colorCode as keyof typeof this.COLOR_MAP];
    
    if (!colorInfo) {
      console.warn(`Couleur de flèche inconnue: ${colorCode}`);
      return null;
    }

    if (!this.isValidSquare(fromSquare) || !this.isValidSquare(toSquare)) {
      console.warn(`Case invalide dans la flèche: ${fromSquare} -> ${toSquare}`);
      return null;
    }

    return {
      color: colorInfo.hex,
      from: fromSquare as Square,
      to: toSquare as Square
    };
  }

  /**
   * Parse une liste de cercles au format "Ra3,Ga4"
   */
  private static parseCircles(circleList: string): PgnCircleAnnotation[] {
    const circles: PgnCircleAnnotation[] = [];
    
    // Séparer les cercles par virgule et nettoyer les espaces
    const circleSpecs = circleList.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const spec of circleSpecs) {
      const circle = this.parseCircleSpec(spec);
      if (circle) {
        circles.push(circle);
      }
    }

    return circles;
  }

  /**
   * Parse une spécification de cercle individuelle au format "Ra3"
   */
  private static parseCircleSpec(spec: string): PgnCircleAnnotation | null {
    // Format: couleur + case (ex: "Ra3")
    const match = spec.match(/^([RGYBOP])([a-h][1-8])$/);
    
    if (!match) {
      console.warn(`Format de cercle invalide: ${spec}`);
      return null;
    }

    const [, colorCode, square] = match;
    const colorInfo = this.COLOR_MAP[colorCode as keyof typeof this.COLOR_MAP];
    
    if (!colorInfo) {
      console.warn(`Couleur de cercle inconnue: ${colorCode}`);
      return null;
    }

    if (!this.isValidSquare(square)) {
      console.warn(`Case invalide dans le cercle: ${square}`);
      return null;
    }

    return {
      color: colorInfo.hex,
      square: square as Square
    };
  }

  /**
   * Valide qu'une chaîne représente une case d'échiquier valide
   */
  private static isValidSquare(square: string): boolean {
    return /^[a-h][1-8]$/.test(square);
  }

  /**
   * Convertit les annotations parsées en objets compatibles avec DrawingManager
   */
  public static toDrawingObjects(annotations: ParsedAnnotations): {
    arrows: Arrow[];
    highlights: SquareHighlight[];
  } {
    const arrows: Arrow[] = annotations.arrows.map(arrow => ({
      from: arrow.from,
      to: arrow.to,
      color: arrow.color,
      width: 4,
      opacity: 0.8
    }));

    const highlights: SquareHighlight[] = annotations.circles.map(circle => {
      // Trouver le type correspondant à la couleur
      const colorEntry = Object.entries(this.COLOR_MAP).find(([, info]) => info.hex === circle.color);
      const type = colorEntry ? colorEntry[1].type : 'green';
      
      return {
        square: circle.square,
        type,
        opacity: 0.6
      };
    });

    return { arrows, highlights };
  }

  /**
   * Génère des annotations PGN à partir d'objets de dessin
   */
  public static fromDrawingObjects(arrows: Arrow[], highlights: SquareHighlight[]): string {
    let annotation = '';

    // Générer les flèches
    if (arrows.length > 0) {
      const arrowSpecs = arrows.map(arrow => {
        const colorCode = this.findColorCode(arrow.color);
        return `${colorCode}${arrow.from}${arrow.to}`;
      }).filter(spec => spec[0] !== '?'); // Filtrer les couleurs inconnues
      
      if (arrowSpecs.length > 0) {
        annotation += `[%cal ${arrowSpecs.join(',')}]`;
      }
    }

    // Générer les cercles
    if (highlights.length > 0) {
      const circleSpecs = highlights.map(highlight => {
        const colorCode = this.findColorCodeFromType(highlight.type);
        return `${colorCode}${highlight.square}`;
      }).filter(spec => spec[0] !== '?'); // Filtrer les couleurs inconnues
      
      if (circleSpecs.length > 0) {
        if (annotation) annotation += ' ';
        annotation += `[%csl ${circleSpecs.join(',')}]`;
      }
    }

    return annotation;
  }

  /**
   * Trouve le code couleur correspondant à une couleur hex
   */
  private static findColorCode(hexColor: string): string {
    const entry = Object.entries(this.COLOR_MAP).find(([, info]) => 
      info.hex.toLowerCase() === hexColor.toLowerCase()
    );
    return entry ? entry[0] : '?';
  }

  /**
   * Trouve le code couleur correspondant à un type de highlight
   */
  private static findColorCodeFromType(type: HighlightType): string {
    const entry = Object.entries(this.COLOR_MAP).find(([, info]) => info.type === type);
    return entry ? entry[0] : 'G'; // Default to green
  }

  /**
   * Nettoie un commentaire PGN en supprimant les annotations visuelles
   * Utile pour afficher seulement le texte du commentaire
   */
  public static stripAnnotations(comment: string): string {
    return comment
      .replace(/\[%cal\s+[^\]]+\]/g, '')
      .replace(/\[%csl\s+[^\]]+\]/g, '')
      .trim();
  }

  /**
   * Vérifie si un commentaire contient des annotations visuelles
   */
  public static hasAnnotations(comment: string): boolean {
    return /\[%(cal|csl)\s+[^\]]+\]/.test(comment);
  }

  /**
   * Exemple d'usage pour créer des annotations
   */
  public static createArrowAnnotation(from: Square, to: Square, color: 'R' | 'G' | 'Y' | 'B' | 'O' | 'P' = 'G'): string {
    return `[%cal ${color}${from}${to}]`;
  }

  /**
   * Exemple d'usage pour créer des annotations de cercles
   */
  public static createCircleAnnotation(square: Square, color: 'R' | 'G' | 'Y' | 'B' | 'O' | 'P' = 'G'): string {
    return `[%csl ${color}${square}]`;
  }
}
