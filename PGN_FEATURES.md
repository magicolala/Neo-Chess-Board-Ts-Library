# Fonctionnalités PGN - Neo Chess Board

## 📝 Portable Game Notation (PGN) Support

Le Neo Chess Board inclut maintenant un support complet du format PGN (Portable Game Notation) conforme aux standards internationaux.

### ✨ Fonctionnalités

#### 📊 **Métadonnées PGN Complètes**
- **7 en-têtes obligatoires** : Event, Site, Date, Round, White, Black, Result
- **En-têtes optionnels** : WhiteElo, BlackElo, ECO, Opening, TimeControl, etc.
- **Format de date standard** : AAAA.MM.JJ (ex: 2025.08.29)
- **Jeu de caractères ISO/CEI 8859-1**

#### 🎯 **Notation Algébrique Abrégée**
- **Format standard** : e4, Nf3, Bb5, O-O, Qxe7+, Rf8#
- **Coups spéciaux** : Petit roque (O-O), Grand roque (O-O-O)
- **Échecs et mats** : + pour échec, # pour mat
- **Promotions** : e8=Q, a1=R, etc.

#### 📄 **Génération PGN**
```typescript
// Export PGN de la partie courante
const pgnString = chessRules.toPgn();

// Télécharger un fichier PGN
chessRules.downloadPgn('ma-partie.pgn');
```

#### 📥 **Import PGN**
```typescript
// Charger une partie depuis PGN
const success = chessRules.loadPgn(pgnString);
if (success) {
    board.setPosition(chessRules.getFEN());
}
```

### 📋 **Exemple de PGN Généré**

```pgn
[Event "Neo Chess Board Demo"]
[Site "Local Demo"]
[Date "2025.08.29"]
[Round "1"]
[White "Player White"]
[Black "Player Black"]
[Result "*"]
[WhiteElo "1500"]
[BlackElo "1500"]
[TimeControl "300+3"]
[ECO "?"]
[Opening "?"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3
O-O 9. h3 Nb8 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Bg5 *
```

### 🛠️ **Utilisation de l'API**

#### Configuration des Métadonnées
```typescript
chessRules.setPgnMetadata({
    Event: "Championnat du Monde",
    Site: "Paris FRA",
    White: "Carlsen, Magnus",
    Black: "Nepomniachtchi, Ian",
    WhiteElo: "2855",
    BlackElo: "2792",
    TimeControl: "40/7200+30",
    ECO: "C84",
    Opening: "Ruy Lopez: Closed Defence"
});
```

#### Méthodes Disponibles
```typescript
// Export/Import
const pgn = chessRules.toPgn();
chessRules.loadPgn(pgnString);
chessRules.downloadPgn(filename);

// Accès avancé
const pgnNotation = chessRules.getPgnNotation();
pgnNotation.addMove(1, "e4", "e5", "Excellent opening", "Solid response");
```

### 🎮 **Démo Interactive**

La démo `examples/chess-js-demo.html` inclut :
- **Export PGN** : Visualiser le PGN de la partie actuelle
- **Téléchargement** : Sauvegarder en fichier .pgn
- **Import** : Charger des parties depuis PGN
- **Copie** : Copier vers le presse-papiers
- **Parties célèbres** : Exemple avec la Partie Immortelle

### 📏 **Standards Respectés**

- ✅ **Conformité PGN** : Format officiel FIDE
- ✅ **Ligne maximale** : 80 caractères
- ✅ **Encodage** : ISO/CEI 8859-1
- ✅ **Résultats** : 1-0, 0-1, 1/2-1/2, *
- ✅ **Compatibilité** : Tous les logiciels d'échecs standards

### 📚 **Exemples d'Usage**

#### Partie Simple
```typescript
const board = new NeoChessBoard('#board', {
    rulesAdapter: new ChessJsRules()
});

// Configurer les métadonnées
board.rules.setPgnMetadata({
    Event: "Partie Amicale",
    White: "Alice",
    Black: "Bob"
});

// Après quelques coups...
const pgn = board.rules.toPgn();
console.log(pgn);
```

#### Analyse de Partie
```typescript
// Charger une partie célèbre
const immortalGame = `[Event "Immortal Game"]
[Site "London"]
[Date "1851.06.21"]
[White "Anderssen, Adolf"]
[Black "Kieseritzky, Lionel"]
[Result "1-0"]

1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5...`;

if (chessRules.loadPgn(immortalGame)) {
    board.setPosition(chessRules.getFEN());
    // Analyser la position finale
}
```

### 🚀 **Intégration dans vos Projets**

```bash
npm install neo-chess-board-ts-library
```

```typescript
import { NeoChessBoard, ChessJsRules } from 'neo-chess-board-ts-library';

const board = new NeoChessBoard('#board', {
    rulesAdapter: new ChessJsRules()
});

// Utilisez toutes les fonctionnalités PGN !
```

Le système PGN de Neo Chess Board offre une compatibilité totale avec tous les standards d'échecs modernes et permet une intégration facile dans vos applications d'analyse échiquéenne.
