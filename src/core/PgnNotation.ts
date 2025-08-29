/**
 * PGN (Portable Game Notation) generator for chess games
 * Provides functionality to export games in standard PGN format
 * Supports visual annotations (%cal arrows and %csl circles)
 */
import { PgnAnnotationParser, type ParsedAnnotations } from './PgnAnnotationParser';
import type { Arrow, SquareHighlight } from './types';

export interface PgnMetadata {
    Event?: string;
    Site?: string;
    Date?: string;
    Round?: string;
    White?: string;
    Black?: string;
    Result?: string;
    WhiteElo?: string;
    BlackElo?: string;
    TimeControl?: string;
    ECO?: string;
    Opening?: string;
    Variation?: string;
    Annotator?: string;
    FEN?: string;
    SetUp?: string;
    [key: string]: string | undefined;
}

export interface PgnMoveAnnotations {
    arrows?: Arrow[];
    circles?: SquareHighlight[];
    textComment?: string;
}

export interface PgnMove {
    moveNumber: number;
    white?: string;
    black?: string;
    whiteComment?: string;
    blackComment?: string;
    whiteAnnotations?: PgnMoveAnnotations;
    blackAnnotations?: PgnMoveAnnotations;
}

export class PgnNotation {
    private metadata: PgnMetadata;
    private moves: PgnMove[];
    private result: string;

    constructor() {
        this.metadata = {
            Event: "Casual Game",
            Site: "Neo Chess Board",
            Date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
            Round: "1",
            White: "Player 1",
            Black: "Player 2",
            Result: "*"
        };
        this.moves = [];
        this.result = "*"; // Game in progress
    }

    /**
     * Set the game metadata (headers)
     */
    setMetadata(metadata: Partial<PgnMetadata>): void {
        this.metadata = { ...this.metadata, ...metadata };
        
        // Set default values if not provided
        if (!this.metadata.Event) this.metadata.Event = "Casual Game";
        if (!this.metadata.Site) this.metadata.Site = "Neo Chess Board";
        if (!this.metadata.Date) this.metadata.Date = new Date().toISOString().split('T')[0].replace(/-/g, '.');
        if (!this.metadata.Round) this.metadata.Round = "1";
        if (!this.metadata.White) this.metadata.White = "Player 1";
        if (!this.metadata.Black) this.metadata.Black = "Player 2";
        if (!this.metadata.Result) this.metadata.Result = this.result;
    }

    /**
     * Add a move to the game
     */
    addMove(moveNumber: number, whiteMove?: string, blackMove?: string, whiteComment?: string, blackComment?: string): void {
        const existingMoveIndex = this.moves.findIndex(move => move.moveNumber === moveNumber);
        
        if (existingMoveIndex >= 0) {
            // Update existing move
            if (whiteMove) this.moves[existingMoveIndex].white = whiteMove;
            if (blackMove) this.moves[existingMoveIndex].black = blackMove;
            if (whiteComment) this.moves[existingMoveIndex].whiteComment = whiteComment;
            if (blackComment) this.moves[existingMoveIndex].blackComment = blackComment;
        } else {
            // Add new move
            this.moves.push({
                moveNumber,
                white: whiteMove,
                black: blackMove,
                whiteComment,
                blackComment
            });
        }
    }

    /**
     * Set the game result
     */
    setResult(result: string): void {
        this.result = result;
        this.metadata.Result = result;
    }

    /**
     * Import moves from a chess.js game
     */
    importFromChessJs(chess: any): void {
        try {
            // Try to get PGN directly from chess.js which should have proper SAN notation
            if (typeof chess.pgn === 'function') {
                const pgnString = chess.pgn();
                // Parse the PGN string to extract moves
                this.parsePgnMoves(pgnString);
            } else {
                // Fallback: try to get moves from detailed history
                const detailedHistory = chess.history({ verbose: true });
                this.moves = [];
                
                for (let i = 0; i < detailedHistory.length; i++) {
                    const move = detailedHistory[i];
                    const moveNumber = Math.floor(i / 2) + 1;
                    const isWhite = i % 2 === 0;
                    
                    if (isWhite) {
                        this.addMove(moveNumber, move.san);
                    } else {
                        const existingMove = this.moves.find(m => m.moveNumber === moveNumber);
                        if (existingMove) {
                            existingMove.black = move.san;
                        } else {
                            this.addMove(moveNumber, undefined, move.san);
                        }
                    }
                }
            }
        } catch (error) {
            // Final fallback: use simple history (might be in wrong format but at least something)
            console.warn('Failed to import proper PGN notation, using fallback:', error);
            const history = chess.history();
            this.moves = [];
            for (let i = 0; i < history.length; i += 2) {
                const moveNumber = Math.floor(i / 2) + 1;
                const whiteMove = history[i];
                const blackMove = history[i + 1];
                this.addMove(moveNumber, whiteMove, blackMove);
            }
        }
        
        // Set result based on game state
        if (chess.isCheckmate()) {
            this.setResult(chess.turn() === 'w' ? '0-1' : '1-0');
        } else if (chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
            this.setResult('1/2-1/2');
        } else {
            this.setResult('*');
        }
    }

    /**
     * Parse PGN move text to extract individual moves
     */
    private parsePgnMoves(pgnText: string): void {
        this.moves = [];
        
        // Remove comments and variations for now (simple implementation)
        let cleanPgn = pgnText.replace(/\{[^}]*\}/g, '').replace(/\([^)]*\)/g, '');
        
        // Extract and remove the result from the end if present
        const resultPattern = /\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/;
        const resultMatch = cleanPgn.match(resultPattern);
        if (resultMatch) {
            this.setResult(resultMatch[1]);
            cleanPgn = cleanPgn.replace(resultPattern, '');
        }
        
        // Split by move numbers and process
        const movePattern = /(\d+)\.\s*([^\s]+)(?:\s+([^\s]+))?/g;
        let match;
        
        while ((match = movePattern.exec(cleanPgn)) !== null) {
            const moveNumber = parseInt(match[1]);
            const whiteMove = match[2];
            const blackMove = match[3];
            
            // Additional check to make sure we don't include result markers as moves
            if (whiteMove && !['1-0', '0-1', '1/2-1/2', '*'].includes(whiteMove)) {
                // Filter out result markers from black move as well
                const filteredBlackMove = blackMove && !['1-0', '0-1', '1/2-1/2', '*'].includes(blackMove) ? blackMove : undefined;
                this.addMove(moveNumber, whiteMove, filteredBlackMove);
            }
        }
    }

    /**
     * Generate the complete PGN string
     */
    toPgn(): string {
        let pgn = '';
        
        // Add headers
        const requiredHeaders = ['Event', 'Site', 'Date', 'Round', 'White', 'Black', 'Result'];
        
        // Add required headers first
        for (const header of requiredHeaders) {
            if (this.metadata[header]) {
                pgn += `[${header} "${this.metadata[header]}"]\n`;
            }
        }
        
        // Add optional headers
        for (const [key, value] of Object.entries(this.metadata)) {
            if (!requiredHeaders.includes(key) && value) {
                pgn += `[${key} "${value}"]\n`;
            }
        }
        
        pgn += '\n'; // Empty line after headers
        
        // Add moves
        let lineLength = 0;
        const maxLineLength = 80;
        
        for (const move of this.moves) {
            let moveText = `${move.moveNumber}.`;
            
            if (move.white) {
                moveText += ` ${move.white}`;
                if (move.whiteComment) {
                    moveText += ` {${move.whiteComment}}`;
                }
            }
            
            if (move.black) {
                moveText += ` ${move.black}`;
                if (move.blackComment) {
                    moveText += ` {${move.blackComment}}`;
                }
            }
            
            // Check if we need a new line
            if (lineLength + moveText.length + 1 > maxLineLength) {
                pgn += '\n';
                lineLength = 0;
            }
            
            if (lineLength > 0) {
                pgn += ' ';
                lineLength++;
            }
            
            pgn += moveText;
            lineLength += moveText.length;
        }
        
        // Add result
        if (lineLength > 0) {
            pgn += ' ';
        }
        pgn += this.result;
        
        return pgn.trim();
    }

    /**
     * Clear all moves and reset
     */
    clear(): void {
        this.moves = [];
        this.result = "*";
        this.metadata.Result = "*";
    }

    /**
     * Get move count
     */
    getMoveCount(): number {
        return this.moves.length;
    }

    /**
     * Get current result
     */
    getResult(): string {
        return this.result;
    }

    /**
     * Create a PGN from a simple move list
     */
    static fromMoveList(moves: string[], metadata?: Partial<PgnMetadata>): string {
        const pgn = new PgnNotation();
        pgn.setMetadata(metadata || {});
        
        for (let i = 0; i < moves.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = moves[i];
            const blackMove = moves[i + 1];
            pgn.addMove(moveNumber, whiteMove, blackMove);
        }
        
        return pgn.toPgn();
    }

    /**
     * Download PGN as file (browser only)
     */
    downloadPgn(filename: string = 'game.pgn'): void {
        if (typeof window !== 'undefined' && window.document) {
            const blob = new Blob([this.toPgn()], { type: 'application/x-chess-pgn' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    /**
     * Add visual annotations to a move
     */
    addMoveAnnotations(moveNumber: number, isWhite: boolean, annotations: PgnMoveAnnotations): void {
        const existingMoveIndex = this.moves.findIndex(move => move.moveNumber === moveNumber);
        
        if (existingMoveIndex >= 0) {
            if (isWhite) {
                this.moves[existingMoveIndex].whiteAnnotations = annotations;
            } else {
                this.moves[existingMoveIndex].blackAnnotations = annotations;
            }
        } else {
            // Create new move if it doesn't exist
            const newMove: PgnMove = {
                moveNumber,
                ...(isWhite ? { whiteAnnotations: annotations } : { blackAnnotations: annotations })
            };
            this.moves.push(newMove);
        }
    }

    /**
     * Parse a PGN string with comments containing visual annotations
     */
    loadPgnWithAnnotations(pgnString: string): void {
        // Implementation simplifiée - dans une vraie implémentation,
        // il faudrait parser complètement le PGN avec toutes ses variations
        const lines = pgnString.split('\n');
        let inMoves = false;
        let movesText = '';
        
        for (const line of lines) {
            if (line.startsWith('[')) {
                // Header line
                const match = line.match(/\[([^\s]+)\s+"([^"]*)"]/);
                if (match) {
                    this.metadata[match[1]] = match[2];
                }
            } else if (line.trim() && !line.startsWith('[')) {
                inMoves = true;
                movesText += line + ' ';
            }
        }
        
        if (inMoves) {
            this.parseMovesWithAnnotations(movesText);
        }
    }

    /**
     * Parse moves string with embedded annotations
     */
    private parseMovesWithAnnotations(movesText: string): void {
        this.moves = [];
        
        // Pattern pour capturer les mouvements avec commentaires
        const movePattern = /(\d+)\.(\s*)([^\s{]+)(?:\s*\{([^}]*)\})?(?:\s+([^\s{]+)(?:\s*\{([^}]*)\})?)?/g;
        let match;
        
        while ((match = movePattern.exec(movesText)) !== null) {
            const moveNumber = parseInt(match[1]);
            const whiteMove = match[3];
            const whiteComment = match[4];
            const blackMove = match[5];
            const blackComment = match[6];
            
            // Créer le mouvement de base
            const pgnMove: PgnMove = {
                moveNumber,
                white: whiteMove,
                black: blackMove
            };
            
            // Parser les annotations dans les commentaires
            if (whiteComment) {
                const parsed = PgnAnnotationParser.parseComment(whiteComment);
                const { arrows, highlights } = PgnAnnotationParser.toDrawingObjects(parsed);
                
                pgnMove.whiteComment = PgnAnnotationParser.stripAnnotations(whiteComment);
                pgnMove.whiteAnnotations = {
                    arrows,
                    circles: highlights,
                    textComment: pgnMove.whiteComment
                };
            }
            
            if (blackComment) {
                const parsed = PgnAnnotationParser.parseComment(blackComment);
                const { arrows, highlights } = PgnAnnotationParser.toDrawingObjects(parsed);
                
                pgnMove.blackComment = PgnAnnotationParser.stripAnnotations(blackComment);
                pgnMove.blackAnnotations = {
                    arrows,
                    circles: highlights,
                    textComment: pgnMove.blackComment
                };
            }
            
            this.moves.push(pgnMove);
        }
    }

    /**
     * Generate PGN with visual annotations embedded in comments
     */
    toPgnWithAnnotations(): string {
        let pgn = '';
        
        // Add headers
        const requiredHeaders = ['Event', 'Site', 'Date', 'Round', 'White', 'Black', 'Result'];
        
        // Add required headers first
        for (const header of requiredHeaders) {
            if (this.metadata[header]) {
                pgn += `[${header} "${this.metadata[header]}"]\n`;
            }
        }
        
        // Add optional headers
        for (const [key, value] of Object.entries(this.metadata)) {
            if (!requiredHeaders.includes(key) && value) {
                pgn += `[${key} "${value}"]\n`;
            }
        }
        
        pgn += '\n'; // Empty line after headers
        
        // Add moves with annotations
        let lineLength = 0;
        const maxLineLength = 80;
        
        for (const move of this.moves) {
            let moveText = `${move.moveNumber}.`;
            
            if (move.white) {
                moveText += ` ${move.white}`;
                
                // Add white annotations
                let whiteComment = '';
                if (move.whiteAnnotations) {
                    const annotationText = PgnAnnotationParser.fromDrawingObjects(
                        move.whiteAnnotations.arrows || [],
                        move.whiteAnnotations.circles || []
                    );
                    whiteComment = annotationText;
                    if (move.whiteAnnotations.textComment) {
                        whiteComment = whiteComment ? 
                            `${annotationText} ${move.whiteAnnotations.textComment}` :
                            move.whiteAnnotations.textComment;
                    }
                } else if (move.whiteComment) {
                    whiteComment = move.whiteComment;
                }
                
                if (whiteComment) {
                    moveText += ` {${whiteComment}}`;
                }
            }
            
            if (move.black) {
                moveText += ` ${move.black}`;
                
                // Add black annotations
                let blackComment = '';
                if (move.blackAnnotations) {
                    const annotationText = PgnAnnotationParser.fromDrawingObjects(
                        move.blackAnnotations.arrows || [],
                        move.blackAnnotations.circles || []
                    );
                    blackComment = annotationText;
                    if (move.blackAnnotations.textComment) {
                        blackComment = blackComment ? 
                            `${annotationText} ${move.blackAnnotations.textComment}` :
                            move.blackAnnotations.textComment;
                    }
                } else if (move.blackComment) {
                    blackComment = move.blackComment;
                }
                
                if (blackComment) {
                    moveText += ` {${blackComment}}`;
                }
            }
            
            // Check if we need a new line
            if (lineLength + moveText.length + 1 > maxLineLength) {
                pgn += '\n';
                lineLength = 0;
            }
            
            if (lineLength > 0) {
                pgn += ' ';
                lineLength++;
            }
            
            pgn += moveText;
            lineLength += moveText.length;
        }
        
        // Add result
        if (lineLength > 0) {
            pgn += ' ';
        }
        pgn += this.result;
        
        return pgn.trim();
    }

    /**
     * Get annotations for a specific move
     */
    getMoveAnnotations(moveNumber: number, isWhite: boolean): PgnMoveAnnotations | undefined {
        const move = this.moves.find(m => m.moveNumber === moveNumber);
        if (!move) return undefined;
        
        return isWhite ? move.whiteAnnotations : move.blackAnnotations;
    }

    /**
     * Get all moves with their annotations
     */
    getMovesWithAnnotations(): PgnMove[] {
        return [...this.moves];
    }
}
