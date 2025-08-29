# Tests pour Neo Chess Board

Ce dossier contient tous les tests pour la bibliothèque Neo Chess Board.

## Structure des tests

```
tests/
├── setup.ts                 # Configuration Jest et mocks globaux
├── core/                    # Tests pour les modules core
│   ├── EventBus.test.ts    # Tests pour le système d'événements
│   ├── LightRules.test.ts  # Tests pour le moteur d'échecs léger
│   ├── PGN.test.ts         # Tests pour l'enregistrement PGN
│   ├── themes.test.ts      # Tests pour les thèmes visuels
│   ├── FlatSprites.test.ts # Tests pour la génération de sprites
│   ├── utils.test.ts       # Tests pour les fonctions utilitaires
│   └── NeoChessBoard.test.ts # Tests pour la classe principale
├── react/                   # Tests pour les composants React
│   └── NeoChessBoard.test.tsx # Tests pour le composant React
└── demo/                    # Tests pour l'application de démonstration
    └── App.test.tsx        # Tests pour le composant App principal
```

## Scripts disponibles

- `npm test` - Lance tous les tests
- `npm run test:watch` - Lance les tests en mode watch
- `npm run test:coverage` - Lance les tests avec rapport de couverture
- `npm run test:ci` - Lance les tests pour l'intégration continue

## Couverture de test

Les tests couvrent :

### Modules Core
- **EventBus** : Système d'événements pub/sub
- **LightRules** : Moteur d'échecs avec validation des mouvements
- **PGNRecorder** : Enregistrement et export des parties PGN
- **Themes** : Validation des thèmes visuels
- **FlatSprites** : Génération des sprites de pièces
- **Utils** : Fonctions utilitaires d'échecs

### Composants React
- **NeoChessBoard** : Composant React wrapper
- **App** : Application de démonstration complète

### Fonctionnalités testées
- ✅ Validation des mouvements d'échecs
- ✅ Gestion des événements
- ✅ Formats FEN et PGN
- ✅ Interface React
- ✅ Changement de thèmes
- ✅ Export de fichiers PGN
- ✅ Gestion des erreurs

## Mocks et setup

Le fichier `setup.ts` configure :
- Mocks pour l'API Canvas (getContext, drawImage, etc.)
- Mock pour ResizeObserver
- Mock pour OffscreenCanvas
- Mock pour les APIs de téléchargement (URL.createObjectURL)
- Configuration jsdom pour les tests React

## Notes importantes

- Les tests utilisent Jest avec TypeScript
- Les composants React sont testés avec React Testing Library
- Les mocks couvrent les APIs browser non disponibles en test
- La couverture de code est activée par défaut
