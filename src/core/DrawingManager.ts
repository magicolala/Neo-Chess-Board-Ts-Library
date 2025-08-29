import type { Square, Arrow, SquareHighlight, HighlightType, DrawingState, Premove } from './types';

export class DrawingManager {
  private state: DrawingState = {
    arrows: [],
    highlights: [],
    premove: undefined
  };

  private canvas: HTMLCanvasElement;
  private squareSize: number = 60;
  private boardSize: number = 480;
  private orientation: 'white' | 'black' = 'white';

  // Couleurs par défaut pour les highlights
  private readonly HIGHLIGHT_COLORS = {
    green: 'rgba(34, 197, 94, 0.6)',
    red: 'rgba(239, 68, 68, 0.6)', 
    blue: 'rgba(59, 130, 246, 0.6)',
    yellow: 'rgba(245, 158, 11, 0.6)',
    orange: 'rgba(249, 115, 22, 0.6)',
    purple: 'rgba(168, 85, 247, 0.6)'
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.updateDimensions();
  }

  public updateDimensions(): void {
    // Utiliser la vraie taille du canvas en pixels, pas la taille DOM
    this.boardSize = Math.min(this.canvas.width, this.canvas.height);
    this.squareSize = this.boardSize / 8;
  }

  public setOrientation(orientation: 'white' | 'black'): void {
    this.orientation = orientation;
  }

  // Gestion des flèches
  public addArrow(from: Square, to: Square, color: string = '#ffeb3b', width: number = 4): void {
    const existingIndex = this.state.arrows.findIndex(arrow => 
      arrow.from === from && arrow.to === to
    );

    const newArrow: Arrow = { from, to, color, width, opacity: 0.8 };

    if (existingIndex >= 0) {
      this.state.arrows[existingIndex] = newArrow;
    } else {
      this.state.arrows.push(newArrow);
    }
  }

  public removeArrow(from: Square, to: Square): void {
    this.state.arrows = this.state.arrows.filter(arrow => 
      !(arrow.from === from && arrow.to === to)
    );
  }

  public clearArrows(): void {
    this.state.arrows = [];
  }

  public getArrows(): Arrow[] {
    return [...this.state.arrows];
  }

  // Gestion des highlights
  public addHighlight(square: Square, type: HighlightType = 'green', opacity: number = 0.6): void {
    const existingIndex = this.state.highlights.findIndex(h => h.square === square);
    
    const newHighlight: SquareHighlight = { square, type, opacity };

    if (existingIndex >= 0) {
      this.state.highlights[existingIndex] = newHighlight;
    } else {
      this.state.highlights.push(newHighlight);
    }
  }

  public removeHighlight(square: Square): void {
    this.state.highlights = this.state.highlights.filter(h => h.square !== square);
  }

  public clearHighlights(): void {
    this.state.highlights = [];
  }

  public getHighlights(): SquareHighlight[] {
    return [...this.state.highlights];
  }

  // Gestion des premoves
  public setPremove(from: Square, to: Square, promotion?: "q" | "r" | "b" | "n"): void {
    this.state.premove = { from, to, promotion };
  }

  public clearPremove(): void {
    this.state.premove = undefined;
  }

  public getPremove(): Premove | undefined {
    return this.state.premove;
  }

  // Utilities pour les coordonnées
  public squareToCoords(square: Square): [number, number] {
    const file = square.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
    const rank = parseInt(square[1]) - 1;   // '1' = 0, '2' = 1, etc.
    
    if (this.orientation === 'white') {
      return [file * this.squareSize, (7 - rank) * this.squareSize];
    } else {
      return [(7 - file) * this.squareSize, rank * this.squareSize];
    }
  }

  public coordsToSquare(x: number, y: number): Square {
    const file = Math.floor(x / this.squareSize);
    const rank = Math.floor(y / this.squareSize);
    
    let actualFile: number;
    let actualRank: number;
    
    if (this.orientation === 'white') {
      actualFile = file;
      actualRank = 7 - rank;
    } else {
      actualFile = 7 - file;
      actualRank = rank;
    }
    
    const fileChar = String.fromCharCode(97 + actualFile); // 0 = 'a', 1 = 'b', etc.
    const rankChar = (actualRank + 1).toString();
    
    return `${fileChar}${rankChar}` as Square;
  }

  // Rendu des flèches
  public drawArrows(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    for (const arrow of this.state.arrows) {
      this.drawArrow(ctx, arrow);
    }
    
    ctx.restore();
  }

  private drawArrow(ctx: CanvasRenderingContext2D, arrow: Arrow): void {
    const [fromX, fromY] = this.squareToCoords(arrow.from);
    const [toX, toY] = this.squareToCoords(arrow.to);
    
    // Centrer les coordonnées sur les cases
    const centerFromX = fromX + this.squareSize / 2;
    const centerFromY = fromY + this.squareSize / 2;
    const centerToX = toX + this.squareSize / 2;
    const centerToY = toY + this.squareSize / 2;
    
    // Calculer l'angle et la distance
    const dx = centerToX - centerFromX;
    const dy = centerToY - centerFromY;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Ajuster les points de début et fin pour ne pas chevaucher les pièces
    const offset = this.squareSize * 0.25;
    const startX = centerFromX + Math.cos(angle) * offset;
    const startY = centerFromY + Math.sin(angle) * offset;
    const endX = centerToX - Math.cos(angle) * offset;
    const endY = centerToY - Math.sin(angle) * offset;
    
    // Configuration du style
    ctx.globalAlpha = arrow.opacity || 0.8;
    ctx.strokeStyle = arrow.color;
    ctx.fillStyle = arrow.color;
    ctx.lineWidth = arrow.width || 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Dessiner la ligne
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Dessiner la pointe de la flèche
    const arrowHeadSize = (arrow.width || 4) * 3;
    const arrowAngle = Math.PI / 6; // 30 degrés
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowHeadSize * Math.cos(angle - arrowAngle),
      endY - arrowHeadSize * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      endX - arrowHeadSize * Math.cos(angle + arrowAngle),
      endY - arrowHeadSize * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();
  }

  // Rendu des highlights
  public drawHighlights(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    for (const highlight of this.state.highlights) {
      this.drawHighlight(ctx, highlight);
    }
    
    ctx.restore();
  }

  private drawHighlight(ctx: CanvasRenderingContext2D, highlight: SquareHighlight): void {
    const [x, y] = this.squareToCoords(highlight.square);
    const color = this.HIGHLIGHT_COLORS[highlight.type];
    
    ctx.globalAlpha = highlight.opacity || 0.6;
    ctx.fillStyle = color;
    
    // Dessiner un cercle au centre de la case
    const centerX = x + this.squareSize / 2;
    const centerY = y + this.squareSize / 2;
    const radius = this.squareSize * 0.15;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Ajouter un contour
    ctx.globalAlpha = (highlight.opacity || 0.6) * 1.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Rendu du premove
  public drawPremove(ctx: CanvasRenderingContext2D): void {
    if (!this.state.premove) return;
    
    ctx.save();
    
    const [fromX, fromY] = this.squareToCoords(this.state.premove.from);
    const [toX, toY] = this.squareToCoords(this.state.premove.to);
    
    // Style du premove (flèche en pointillés)
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 3;
    // Utiliser setLineDash seulement si disponible (test environnements)
    if (ctx.setLineDash) {
      ctx.setLineDash([8, 4]);
    }
    ctx.lineCap = 'round';
    
    const centerFromX = fromX + this.squareSize / 2;
    const centerFromY = fromY + this.squareSize / 2;
    const centerToX = toX + this.squareSize / 2;
    const centerToY = toY + this.squareSize / 2;
    
    // Dessiner la ligne en pointillés
    ctx.beginPath();
    ctx.moveTo(centerFromX, centerFromY);
    ctx.lineTo(centerToX, centerToY);
    ctx.stroke();
    
    // Dessiner les cases de départ et d'arrivée
    if (ctx.setLineDash) {
      ctx.setLineDash([]);
    }
    ctx.fillStyle = 'rgba(255, 152, 0, 0.3)';
    
    // Case de départ
    ctx.fillRect(fromX, fromY, this.squareSize, this.squareSize);
    
    // Case d'arrivée
    ctx.fillRect(toX, toY, this.squareSize, this.squareSize);
    
    ctx.restore();
  }

  // Méthodes pour obtenir l'état complet
  public getDrawingState(): DrawingState {
    return {
      arrows: [...this.state.arrows],
      highlights: [...this.state.highlights],
      premove: this.state.premove ? { ...this.state.premove } : undefined
    };
  }

  public setDrawingState(state: Partial<DrawingState>): void {
    if (state.arrows !== undefined) {
      this.state.arrows = [...state.arrows];
    }
    if (state.highlights !== undefined) {
      this.state.highlights = [...state.highlights];
    }
    if (state.premove !== undefined) {
      this.state.premove = state.premove ? { ...state.premove } : undefined;
    }
  }

  public clearAllDrawings(): void {
    this.state = {
      arrows: [],
      highlights: [],
      premove: undefined
    };
  }

  // Utilitaires pour les interactions
  public getSquareFromMousePosition(mouseX: number, mouseY: number): Square | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = (mouseX - rect.left) * (this.canvas.width / rect.width);
    const y = (mouseY - rect.top) * (this.canvas.height / rect.height);
    
    if (x < 0 || y < 0 || x >= this.canvas.width || y >= this.canvas.height) {
      return null;
    }
    
    return this.coordsToSquare(x, y);
  }

  // Cycle des couleurs de highlight au clic droit
  public cycleHighlight(square: Square): void {
    const existingIndex = this.state.highlights.findIndex(h => h.square === square);
    
    if (existingIndex >= 0) {
      const currentType = this.state.highlights[existingIndex].type;
      const types: HighlightType[] = ['green', 'red', 'blue', 'yellow', 'orange', 'purple'];
      const currentTypeIndex = types.indexOf(currentType);
      const nextTypeIndex = (currentTypeIndex + 1) % types.length;
      
      if (nextTypeIndex === 0) {
        // Si on revient au vert après un cycle complet, supprimer le highlight
        this.removeHighlight(square);
      } else {
        this.state.highlights[existingIndex].type = types[nextTypeIndex];
      }
    } else {
      // Ajouter un nouveau highlight vert
      this.addHighlight(square, 'green');
    }
  }

  // Rendu complet de tous les éléments
  public draw(ctx: CanvasRenderingContext2D): void {
    // L'ordre est important pour la superposition correcte
    this.drawHighlights(ctx);
    this.drawPremove(ctx);
    this.drawArrows(ctx);
  }

  // Vérifier si un point est près d'une flèche (pour suppression)
  public getArrowAt(mouseX: number, mouseY: number, tolerance: number = 10): Arrow | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = mouseX - rect.left;
    const y = mouseY - rect.top;
    
    for (const arrow of this.state.arrows) {
      if (this.isPointNearArrow(x, y, arrow, tolerance)) {
        return arrow;
      }
    }
    
    return null;
  }

  private isPointNearArrow(x: number, y: number, arrow: Arrow, tolerance: number): boolean {
    const [fromX, fromY] = this.squareToCoords(arrow.from);
    const [toX, toY] = this.squareToCoords(arrow.to);
    
    const centerFromX = fromX + this.squareSize / 2;
    const centerFromY = fromY + this.squareSize / 2;
    const centerToX = toX + this.squareSize / 2;
    const centerToY = toY + this.squareSize / 2;
    
    // Calculer la distance du point à la ligne
    const lineLength = Math.sqrt(
      Math.pow(centerToX - centerFromX, 2) + Math.pow(centerToY - centerFromY, 2)
    );
    
    if (lineLength === 0) return false;
    
    const distance = Math.abs(
      ((centerToY - centerFromY) * x - (centerToX - centerFromX) * y + 
       centerToX * centerFromY - centerToY * centerFromX) / lineLength
    );
    
    return distance <= tolerance;
  }

  // Export/Import pour la persistance
  public exportState(): string {
    return JSON.stringify(this.state);
  }

  public importState(stateJson: string): void {
    try {
      const imported = JSON.parse(stateJson);
      this.setDrawingState(imported);
    } catch (error) {
      console.warn('Failed to import drawing state:', error);
    }
  }

  // Méthodes d'interaction pour NeoChessBoard
  private currentAction: { 
    type: 'none' | 'drawing_arrow', 
    startSquare?: Square,
    shiftKey?: boolean,
    ctrlKey?: boolean,
    altKey?: boolean
  } = { type: 'none' };

  public handleMouseDown(x: number, y: number, shiftKey: boolean, ctrlKey: boolean): boolean {
    // Ne pas gérer le clic gauche ici, les flèches se font maintenant au clic droit
    return false;
  }

  public handleRightMouseDown(x: number, y: number, shiftKey: boolean = false, ctrlKey: boolean = false, altKey: boolean = false): boolean {
    const square = this.coordsToSquare(x, y);
    
    // Commencer à dessiner une flèche au clic droit avec les modificateurs
    this.currentAction = { type: 'drawing_arrow', startSquare: square, shiftKey, ctrlKey, altKey };
    return true;
  }

  public handleMouseMove(x: number, y: number): boolean {
    // Pour l'instant, ne rien faire pendant le mouvement
    return false;
  }

  public handleMouseUp(x: number, y: number): boolean {
    // Cette méthode n'est plus utilisée pour les flèches (clic droit)
    this.currentAction = { type: 'none' };
    return false;
  }

  public handleRightMouseUp(x: number, y: number): boolean {
    if (this.currentAction.type === 'drawing_arrow' && this.currentAction.startSquare) {
      const endSquare = this.coordsToSquare(x, y);
      if (endSquare !== this.currentAction.startSquare) {
        // Déterminer la couleur selon les modificateurs
        let color = '#ffeb3b'; // jaune par défaut
        if (this.currentAction.shiftKey) {
          color = '#22c55e'; // vert
        } else if (this.currentAction.ctrlKey) {
          color = '#ef4444'; // rouge
        } else if (this.currentAction.altKey) {
          color = '#f59e0b'; // orange/jaune
        }
        
        this.addArrow(this.currentAction.startSquare, endSquare, color);
        this.currentAction = { type: 'none' };
        return true;
      }
    }
    
    this.currentAction = { type: 'none' };
    return false;
  }

  public handleHighlightClick(square: Square, shiftKey: boolean = false, ctrlKey: boolean = false, altKey: boolean = false): void {
    if (shiftKey || ctrlKey || altKey) {
      // Avec modificateurs, appliquer directement la couleur correspondante
      let highlightType: HighlightType = 'green';
      if (shiftKey) {
        highlightType = 'green';
      } else if (ctrlKey) {
        highlightType = 'red';
      } else if (altKey) {
        highlightType = 'yellow';
      }
      
      // Si un highlight existe déjà avec la même couleur, le supprimer
      const existing = this.state.highlights.find(h => h.square === square && h.type === highlightType);
      if (existing) {
        this.removeHighlight(square);
      } else {
        this.addHighlight(square, highlightType);
      }
    } else {
      // Sans modificateurs, conserver le comportement de cycle existant
      this.cycleHighlight(square);
    }
  }

  public handleRightClick(square: Square): void {
    this.cycleHighlight(square);
  }

  public cancelCurrentAction(): void {
    this.currentAction = { type: 'none' };
  }

  // Méthodes de rendu individuelles pour NeoChessBoard
  public renderArrows(): void {
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      this.drawArrows(ctx);
    }
  }

  public renderHighlights(): void {
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      this.drawHighlights(ctx);
    }
  }

  public renderPremove(): void {
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      this.drawPremove(ctx);
    }
  }

  // Méthodes avec signatures adaptées pour NeoChessBoard
  public addArrowFromObject(arrow: Arrow): void {
    this.addArrow(arrow.from, arrow.to, arrow.color, arrow.width);
  }

  public addHighlightFromObject(highlight: SquareHighlight): void {
    this.addHighlight(highlight.square, highlight.type, highlight.opacity);
  }

  public setPremoveFromObject(premove: Premove): void {
    this.setPremove(premove.from, premove.to, premove.promotion);
  }

  // Alias pour compatibilité
  public clearAll(): void {
    this.clearAllDrawings();
  }
}
