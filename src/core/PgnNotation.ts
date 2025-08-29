/**
 * PGN (Portable Game Notation) generator for chess games
 * Provides functionality to export games in standard PGN format
 */
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

export interface PgnMove {
    moveNumber: number;
    white?: string;
    black?: string;
    whiteComment?: string;
    blackComment?: string;
}

export class PgnNotation {
    private metadata: PgnMetadata;
    private moves: PgnMove[];
    private result: string;

    constructor() {
        this.metadata = {};
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
        if (!this.metadata.Date) this.metadata.Date = new Date().toISOString().split('T')[0];
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
        const history = chess.history({ verbose: true });
        const pgn = chess.pgn();
        
        // Parse the PGN to extract moves properly
        this.parsePgnMoves(pgn);
        
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
        const cleanPgn = pgnText.replace(/\{[^}]*\}/g, '').replace(/\([^)]*\)/g, '');
        
        // Split by move numbers and process
        const movePattern = /(\d+)\.\s*([^\s]+)(?:\s+([^\s]+))?/g;
        let match;
        
        while ((match = movePattern.exec(cleanPgn)) !== null) {
            const moveNumber = parseInt(match[1]);
            const whiteMove = match[2];
            const blackMove = match[3];
            
            if (whiteMove && !['1-0', '0-1', '1/2-1/2', '*'].includes(whiteMove)) {
                this.addMove(moveNumber, whiteMove, blackMove);
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
        if (this.result && this.result !== '*') {
            if (lineLength + this.result.length + 1 > maxLineLength) {
                pgn += '\n';
            } else if (lineLength > 0) {
                pgn += ' ';
            }
            pgn += this.result;
        }
        
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
}
