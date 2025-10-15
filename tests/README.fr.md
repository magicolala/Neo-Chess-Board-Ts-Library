# Tests pour Neo Chess Board

Ce dossier contient l'ensemble des tests unitaires, d'intégration et d'interface pour la bibliothèque Neo Chess Board.

## Structure des tests

```
tests/
├── README.md                # Présentation et organisation générale
├── RESULTS.md               # Summary of the latest execution (English)
├── RESULTS.fr.md            # Résultats détaillés de la dernière exécution
├── setup.ts                 # Configuration Jest et mocks globaux
├── assets.d.ts              # Déclarations de modules statiques pour les tests
├── jest-dom.d.ts            # Extension des matchers jest-dom
├── __mocks__/               # Mocks spécifiques (Canvas, ResizeObserver...)
├── core/                    # Tests dédiés au cœur de la librairie
│   ├── ChessJsRules.test.ts           # Adaptateur Chess.js
│   ├── DrawingManager.test.ts         # Rendu overlay, coordonnées, flèches
│   ├── EventBus.test.ts               # Bus d'événements pub/sub
│   ├── FlatSprites.test.ts            # Rasterisation des sprites de pièces
│   ├── LightRules.test.ts             # Moteur d'échecs léger maison
│   ├── NeoChessBoard.test.ts          # API principale, auto-flip, interactions
│   ├── PGN.test.ts                    # Enregistrement et export PGN
│   ├── PgnAnnotationParser.test.ts    # Parsing des annotations avancées
│   ├── PgnNotation.test.ts            # Lecture/écriture de la notation PGN
│   ├── PgnNotationAnnotations.test.ts # Symboles NAG et commentaires
│   ├── premoves.test.ts               # Gestion des pré-mouvements
│   ├── themes.test.ts                 # Validation des thèmes intégrés
│   └── utils.test.ts                  # Fonctions utilitaires d'échecs
├── integration/
│   └── PgnChessJsIntegration.test.ts  # Round-trip Chess.js ↔ PGN
├── react/
│   └── NeoChessBoard.test.tsx         # Composant React (hooks, props, autoFlip)
├── demo/
│   └── App.test.tsx                   # Application de démonstration complète
└── exports.test.ts                    # Vérification des exports publics
```

## Scripts disponibles

- `npm test` - Lance l'ensemble de la suite en mode CI.
- `npm run test:watch` - Relance automatiquement les tests affectés.
- `npm run test:coverage` - Génère un rapport de couverture (HTML + terminal).
- `npm run test:ci` - Profil optimisé pour l'intégration continue.

## Couverture de test

### Modules Core

- **NeoChessBoard** : chargement FEN, auto-flip, orientation fixe des coordonnées, gestion sonore.
- **DrawingManager** : rendu des annotations (flèches, highlights, pré-mouvements) et coordonnées toujours en bas/gauche.
- **LightRules & ChessJsRules** : validation des coups légaux, règles spéciales (roque, promotion, en passant).
- **PGN** : enregistrement, annotation avancée (NAG), round-trip complet import/export.
- **Premoves** : stockage, validation et exécution différée des coups programmés.
- **Themes & FlatSprites** : cohérence des palettes, rasterisation responsive des sprites.
- **Utils** : parsing FEN/PGN, helpers mathématiques et conversions de cases.

### Tests d'intégration

- **PgnChessJsIntegration** : synchronisation complète entre Chess.js, enregistreur PGN et moteur de règles.

### Composants React & Demo

- **React `<NeoChessBoard />`** : props contrôlées/non contrôlées, orientation auto, callbacks d'événements.
- **Demo App** : scénarios utilisateur réels (sélecteurs de thèmes, options auto-flip, coordonnées).

### Exports

- **exports.test.ts** : garantit que l'API publique reste stable et documentée.

## Mocks et setup

Le fichier `setup.ts` configure :

- les mocks Canvas (`getContext`, `drawImage`, `measureText`...),
- `ResizeObserver`, `IntersectionObserver` et `OffscreenCanvas`,
- `URL.createObjectURL` / `URL.revokeObjectURL`,
- les extensions Jest DOM pour les tests React,
- la configuration globale (devicePixelRatio, timers).

## Notes importantes

- La suite repose sur Jest + TypeScript avec `ts-jest`.
- React Testing Library est utilisée pour les tests UI.
- Les tests sont déterministes et peuvent être lancés en CI sans dépendances natives.
- `RESULTS.md` est mis à jour après chaque campagne de tests (version anglaise) pour suivre la progression de la couverture, et `RESULTS.fr.md` détaille les mêmes informations en français.
