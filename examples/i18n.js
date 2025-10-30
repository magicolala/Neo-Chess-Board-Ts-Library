const STORAGE_PREFIX = 'neo-chess-example-language:';

const dictionaries = {
  vanilla: {
    en: {
      'meta.title': 'Neo Chess Board - Vanilla JS Example',
      'meta.description':
        'Interactive vanilla JavaScript demo showcasing Neo Chess Board with themes, FEN loading, and PGN export.',
      'heading.title': '🏆 Neo Chess Board',
      'language.label': 'Language',
      'language.toggle.fr': 'Switch to Français',
      'language.toggle.en': 'Switch to English',
      'label.theme': 'Theme:',
      'label.orientation': 'Orientation:',
      'theme.light': 'Light',
      'theme.dark': 'Dark',
      'theme.wood': 'Wood',
      'theme.glass': 'Glass',
      'theme.neon': 'Neon',
      'theme.retro': 'Retro',
      'orientation.white': 'White',
      'orientation.black': 'Black',
      'button.newGame': '🆕 New Game',
      'button.flip': '🔄 Flip Board',
      'button.export': '📋 Export PGN',
      'label.fen': 'FEN Position:',
      'button.loadPosition': 'Load Position',
      'placeholder.fen': 'Enter FEN string...',
      'status.label': 'Status:',
      'status.current': 'Current Player:',
      'history.label': 'Move History:',
      'history.empty': 'No moves yet',
      'status.playing': 'Playing',
      'status.turn.white': 'White',
      'status.turn.black': 'Black',
      'status.movePrefix.white': '{moveNumber}.',
      'status.movePrefix.black': '{moveNumber}...',
      'status.check': '{color} king is in check!',
      'status.checkmate': 'Checkmate! {winner} wins!',
      'status.stalemate': 'Stalemate - Draw!',
      'status.stalemateLabel': 'Stalemate',
      'status.checkmateLabel': 'Checkmate',
      'status.checkLabel': 'Check',
      'status.playingLabel': 'Playing',
      'status.turnPrefix': 'To move:',
      'alert.invalidFen': 'Invalid FEN string: {message}',
      'log.init': 'Neo Chess Board initialized!',
      'log.tryMoves': 'Try making some moves, changing themes, or loading positions.',
    },
    fr: {
      'meta.title': 'Neo Chess Board - Exemple Vanilla JS',
      'meta.description':
        'Démo JavaScript autonome de Neo Chess Board avec gestion des thèmes, chargement FEN et export PGN.',
      'heading.title': '🏆 Neo Chess Board',
      'language.label': 'Langue',
      'language.toggle.fr': 'Basculer en français',
      'language.toggle.en': 'Switch to English',
      'label.theme': 'Thème :',
      'label.orientation': 'Orientation :',
      'theme.light': 'Clair',
      'theme.dark': 'Sombre',
      'theme.wood': 'Bois',
      'theme.glass': 'Verre',
      'theme.neon': 'Néon',
      'theme.retro': 'Rétro',
      'orientation.white': 'Blancs',
      'orientation.black': 'Noirs',
      'button.newGame': '🆕 Nouvelle partie',
      'button.flip': '🔄 Inverser l’échiquier',
      'button.export': '📋 Exporter le PGN',
      'label.fen': 'Position FEN :',
      'button.loadPosition': 'Charger la position',
      'placeholder.fen': 'Saisissez une chaîne FEN...',
      'status.label': 'Statut :',
      'status.current': 'Joueur actif :',
      'history.label': 'Historique des coups :',
      'history.empty': 'Aucun coup pour le moment',
      'status.playing': 'En cours',
      'status.turn.white': 'Blancs',
      'status.turn.black': 'Noirs',
      'status.movePrefix.white': '{moveNumber}.',
      'status.movePrefix.black': '{moveNumber}...',
      'status.check': 'Le roi {color} est en échec !',
      'status.checkmate': 'Échec et mat ! {winner} gagne !',
      'status.stalemate': 'Pat - Partie nulle !',
      'status.stalemateLabel': 'Pat',
      'status.checkmateLabel': 'Échec et mat',
      'status.checkLabel': 'Échec',
      'status.playingLabel': 'En cours',
      'status.turnPrefix': 'Au trait :',
      'alert.invalidFen': 'FEN invalide : {message}',
      'log.init': 'Neo Chess Board initialisé !',
      'log.tryMoves':
        'Essayez de jouer quelques coups, de changer le thème ou de charger des positions.',
    },
  },
  chessJs: {
    en: {
      'meta.title': 'Neo Chess Board - Chess.js Integration Demo',
      'meta.description':
        'Live Chess.js integration demo highlighting full rules validation, checkmate detection, and PGN tooling.',
      'language.toggle.fr': 'Switch to Français',
      'language.toggle.en': 'Switch to English',
      'heading.title': '♞ Chess.js Integration Demo',
      'heading.subtitle': 'Robust move validation with chess.js.',
      'comparison.title': '🆚 Engine comparison',
      'comparison.content':
        '<p><strong>Before:</strong> LightRules (basic validation)</p><p><strong>Now:</strong> Chess.js (complete validation)</p><p>✅ Checkmate detection</p><p>✅ Stalemate detection</p><p>✅ Special rules (castling, en passant)</p><p>✅ Move history tracking</p><p>✅ Full PGN import/export</p>',
      'status.moveNumberLabel': 'Move #',
      'status.turnPrefix': 'Side to move:',
      'status.turn.white': 'White',
      'status.turn.black': 'Black',
      'status.panelHeading': 'Game status:',
      'status.label': 'Status:',
      'status.checkLabel': 'Check:',
      'status.movesLabel': 'Legal moves:',
      'status.halfMovesLabel': 'Half-moves:',
      'status.fiftyLabel': '50-move rule:',
      'status.check.yes': 'Yes',
      'status.check.no': 'No',
      'status.state.inProgress': '⚡ In progress',
      'status.state.checkmate': '🏆 Checkmate',
      'status.state.stalemate': '⚖️ Stalemate',
      'status.state.gameOver': '🏁 Game over',
      'status.fifty.limitReached': '50-move rule threshold reached',
      'status.fifty.remaining': '{count} half-moves remaining',
      'features.title': '🎯 Chess.js capabilities',
      'features.list':
        '<li><strong>Full validation</strong> for legal moves</li><li><strong>Automatic detection</strong> for check, checkmate, and stalemate</li><li><strong>Advanced rule</strong> support for castling and en passant</li><li><strong>Move history</strong> kept in sync</li><li><strong>FEN positions</strong> verified on load</li><li><strong>50-move counter</strong> updated live</li>',
      'actions.heading': 'Quick actions:',
      'actions.reset': '🔄 New game',
      'actions.undo': '↶ Undo',
      'actions.scholar': "🎓 Scholar's mate",
      'actions.stalemate': '⚖️ Stalemate scenario',
      'actions.endgame': '♔ Endgame practice',
      'actions.castling': '🏰 Castle test',
      'actions.famous': '🌟 Immortal Game',
      'export.heading': 'PGN export:',
      'export.view': '📄 View PGN',
      'export.download': '💾 Download PGN',
      'export.load': '📂 Load PGN',
      'export.copy': '📋 Copy PGN',
      'history.heading': 'Move history:',
      'history.initial': 'Initial position',
      'history.movePrefix.white': '{moveNumber}.',
      'history.movePrefix.black': '{moveNumber}...',
      'modal.title.default': 'PGN viewer',
      'modal.button.close': 'Close',
      'modal.button.load': 'Load',
      'modal.button.copy': 'Copy',
      'modal.title.exportCurrent': 'Export PGN - Current game',
      'modal.title.loadPrompt': 'Load PGN - Paste your PGN here',
      'modal.title.famous': 'PGN - Immortal Game (Anderssen vs Kieseritzky, 1851)',
      'alerts.loadingError': 'Unable to load Neo Chess Board. Check the console for details.',
      'alerts.checkmate': '🎉 Checkmate! {winner} wins!',
      'alerts.stalemate': '⚖️ Stalemate. Draw.',
      'alerts.gameOver': '🏁 Game over. Draw.',
      'alerts.illegalMove': 'Illegal move: {from}-{to}\nReason: {reason}',
      'alerts.emptyPgn': 'Please enter a PGN string.',
      'alerts.loadSuccess': 'PGN loaded successfully!',
      'alerts.loadError': 'Error: invalid PGN. Check the format.',
      'alerts.copySuccess': 'PGN copied to clipboard!',
      'alerts.copyError': 'Copy failed. Select the text and copy manually.',
      'common.white': 'White',
      'common.black': 'Black',
    },
    fr: {
      'meta.title': 'Neo Chess Board - Démo intégration Chess.js',
      'meta.description':
        "Démo en direct de l'intégration Chess.js avec validation complète des règles, détection des mats et outils PGN.",
      'language.toggle.fr': 'Basculer en français',
      'language.toggle.en': 'Switch to English',
      'heading.title': '♞ Démo d’intégration Chess.js',
      'heading.subtitle': 'Validation robuste des coups avec chess.js.',
      'comparison.title': '🆚 Comparaison des moteurs',
      'comparison.content':
        '<p><strong>Avant :</strong> LightRules (validation basique)</p><p><strong>Maintenant :</strong> Chess.js (validation complète)</p><p>✅ Détection de mat</p><p>✅ Détection de pat</p><p>✅ Règles spéciales (roque, en passant)</p><p>✅ Historique des coups</p><p>✅ Import/export PGN complet</p>',
      'status.moveNumberLabel': 'Coup n°',
      'status.turnPrefix': 'Au trait :',
      'status.turn.white': 'Blancs',
      'status.turn.black': 'Noirs',
      'status.panelHeading': 'État de la partie :',
      'status.label': 'Statut :',
      'status.checkLabel': 'Échec :',
      'status.movesLabel': 'Coups légaux :',
      'status.halfMovesLabel': 'Demi-coups :',
      'status.fiftyLabel': 'Règle des 50 coups :',
      'status.check.yes': 'Oui',
      'status.check.no': 'Non',
      'status.state.inProgress': '⚡ En cours',
      'status.state.checkmate': '🏆 Échec et mat',
      'status.state.stalemate': '⚖️ Pat',
      'status.state.gameOver': '🏁 Partie terminée',
      'status.fifty.limitReached': 'Limite des 50 coups atteinte',
      'status.fifty.remaining': '{count} demi-coups restants',
      'features.title': '🎯 Capacités Chess.js',
      'features.list':
        '<li><strong>Validation complète</strong> des coups légaux</li><li><strong>Détection automatique</strong> de l’échec, du mat et du pat</li><li><strong>Gestion avancée</strong> du roque et de la prise en passant</li><li><strong>Historique des coups</strong> synchronisé</li><li><strong>Positions FEN</strong> vérifiées au chargement</li><li><strong>Compteur des 50 coups</strong> mis à jour en direct</li>',
      'actions.heading': 'Actions rapides :',
      'actions.reset': '🔄 Nouvelle partie',
      'actions.undo': '↶ Annuler',
      'actions.scholar': '🎓 Mat du berger',
      'actions.stalemate': '⚖️ Situation de pat',
      'actions.endgame': '♔ Finale à étudier',
      'actions.castling': '🏰 Test de roque',
      'actions.famous': '🌟 Partie immortelle',
      'export.heading': 'Export PGN :',
      'export.view': '📄 Voir le PGN',
      'export.download': '💾 Télécharger le PGN',
      'export.load': '📂 Charger un PGN',
      'export.copy': '📋 Copier le PGN',
      'history.heading': 'Historique des coups :',
      'history.initial': 'Position initiale',
      'history.movePrefix.white': '{moveNumber}.',
      'history.movePrefix.black': '{moveNumber}...',
      'modal.title.default': 'Lecteur PGN',
      'modal.button.close': 'Fermer',
      'modal.button.load': 'Charger',
      'modal.button.copy': 'Copier',
      'modal.title.exportCurrent': 'Export PGN - Partie en cours',
      'modal.title.loadPrompt': 'Charger un PGN - Collez votre PGN ici',
      'modal.title.famous': 'PGN - Partie immortelle (Anderssen vs Kieseritzky, 1851)',
      'alerts.loadingError':
        'Impossible de charger Neo Chess Board. Consultez la console pour plus de détails.',
      'alerts.checkmate': '🎉 Échec et mat ! {winner} gagne !',
      'alerts.stalemate': '⚖️ Pat. Partie nulle.',
      'alerts.gameOver': '🏁 Partie terminée. Match nul.',
      'alerts.illegalMove': 'Coup illégal : {from}-{to}\nRaison : {reason}',
      'alerts.emptyPgn': 'Veuillez saisir un PGN.',
      'alerts.loadSuccess': 'PGN chargé avec succès !',
      'alerts.loadError': 'Erreur : PGN invalide. Vérifiez le format.',
      'alerts.copySuccess': 'PGN copié dans le presse-papiers !',
      'alerts.copyError': 'La copie a échoué. Sélectionnez le texte et copiez-le manuellement.',
      'common.white': 'Blancs',
      'common.black': 'Noirs',
    },
  },
  pgnEval: {
    en: {
      'meta.title': 'Neo Chess Board – PGN Import & Evaluation Bar',
      'meta.description':
        'Demonstration of PGN import with evaluation bar, auto-orientation, and annotated move tracking powered by Neo Chess Board.',
      'language.toggle.fr': 'Switch to Français',
      'language.toggle.en': 'Switch to English',
      'heading.title': 'PGN import & evaluation bar',
      'heading.subtitle':
        'Paste a PGN annotated with <code>[%eval ...]</code> tags to feed the evaluation bar. Evaluations follow the displayed perspective and stay in sync with the board orientation.',
      'board.ariaLabel': 'Interactive chessboard',
      'pgn.title': '📋 PGN import',
      'pgn.placeholder': 'Paste a PGN containing [%eval 0.45] or [%eval #3]…',
      'pgn.load': 'Load PGN',
      'pgn.sample': 'Load sample game',
      'pgn.reset': 'Reset board',
      'pgn.copy': 'Copy notation',
      'pgn.help':
        'Tip: <code>[%eval +0.85]</code> is attributed to the side that just played. Add <code>[%eval #5]</code> to announce a mating sequence.',
      'sidebar.ariaLabel': 'Evaluation bar and options',
      'evaluation.title': '📈 Evaluation bar',
      'evaluation.ariaLabel': 'Engine evaluation',
      'evaluation.summary.primary.none': 'No evaluation imported',
      'evaluation.summary.primary.mateWhite': 'Mate announced for White',
      'evaluation.summary.primary.mateBlack': 'Mate announced for Black',
      'evaluation.summary.primary.custom': 'Custom evaluation',
      'evaluation.summary.primary.balanced': 'Balanced position',
      'evaluation.summary.primary.advantageWhite': 'White advantage',
      'evaluation.summary.primary.advantageBlack': 'Black advantage',
      'evaluation.summary.secondary.instructions': 'Add <code>[%eval ...]</code> to get started.',
      'evaluation.summary.secondary.afterMove': 'After {descriptor}',
      'evaluation.summary.secondary.initial': 'Initial evaluation',
      'evaluation.ply.start': 'the starting position',
      'evaluation.ply.move': 'Move {moveNumber} ({color})',
      'orientation.status': 'Current orientation: {side} at the bottom',
      'orientation.auto': 'Automatically sync with the side to move',
      'orientation.flip': 'Flip view',
      'info.title': 'How does it work?',
      'info.items':
        '<li>The PGN powers both the rules engine and the board to display arrows and comments.</li><li>Each move with <code>[%eval]</code> is mapped to its ply to feed the evaluation bar.</li><li>When you navigate or play new moves, the evaluation refreshes automatically.</li>',
      'status.error.emptyPgn': 'Please paste a PGN before loading it.',
      'status.error.unableToLoad': 'Unable to load the provided PGN.',
      'status.success.loaded': 'PGN loaded successfully. Evaluations are synchronised ✅',
      'status.error.generic': 'An error occurred while loading the PGN.',
      'status.info.reset': 'Board reset.',
      'status.info.sampleLoaded': 'Sample PGN loaded into the editor.',
      'status.error.sampleUnavailable':
        'Unable to load the local sample (serve the folder over HTTP).',
      'status.success.copied': 'PGN copied to the clipboard.',
      'status.error.copyFailed': 'Unable to copy the PGN (browser permissions?).',
      'status.info.orientationManual': 'Orientation updated manually.',
      'status.info.autoEnabled': 'Automatic sync enabled.',
      'status.info.movePlayed': 'Move played. PGN updated.',
      'status.error.illegalMove': 'Illegal move: {reason}',
      'common.white': 'White',
      'common.black': 'Black',
    },
    fr: {
      'meta.title': 'Neo Chess Board – Import PGN & barre d’évaluation',
      'meta.description':
        'Démonstration de l’import PGN avec barre d’évaluation, auto-orientation et suivi annoté grâce à Neo Chess Board.',
      'language.toggle.fr': 'Basculer en français',
      'language.toggle.en': 'Switch to English',
      'heading.title': 'Import PGN & barre d’évaluation',
      'heading.subtitle':
        'Collez un PGN annoté avec des balises <code>[%eval ...]</code> pour alimenter la barre. Les évaluations suivent la perspective affichée et restent synchronisées avec l’orientation de l’échiquier.',
      'board.ariaLabel': 'Échiquier interactif',
      'pgn.title': '📋 Import PGN',
      'pgn.placeholder': 'Collez un PGN contenant [%eval 0.45] ou [%eval #3]…',
      'pgn.load': 'Charger le PGN',
      'pgn.sample': 'Charger la partie d’exemple',
      'pgn.reset': 'Réinitialiser l’échiquier',
      'pgn.copy': 'Copier la notation',
      'pgn.help':
        'Astuce : <code>[%eval +0,85]</code> est attribué au joueur qui vient de jouer. Ajoutez <code>[%eval #5]</code> pour annoncer un mat.',
      'sidebar.ariaLabel': 'Barre d’évaluation et options',
      'evaluation.title': '📈 Barre d’évaluation',
      'evaluation.ariaLabel': 'Évaluation du moteur',
      'evaluation.summary.primary.none': 'Aucune évaluation importée',
      'evaluation.summary.primary.mateWhite': 'Mat annoncé pour les Blancs',
      'evaluation.summary.primary.mateBlack': 'Mat annoncé pour les Noirs',
      'evaluation.summary.primary.custom': 'Évaluation personnalisée',
      'evaluation.summary.primary.balanced': 'Position équilibrée',
      'evaluation.summary.primary.advantageWhite': 'Avantage Blancs',
      'evaluation.summary.primary.advantageBlack': 'Avantage Noirs',
      'evaluation.summary.secondary.instructions':
        'Ajoutez des balises <code>[%eval ...]</code> pour démarrer.',
      'evaluation.summary.secondary.afterMove': 'Après {descriptor}',
      'evaluation.summary.secondary.initial': 'Évaluation initiale',
      'evaluation.ply.start': 'la position initiale',
      'evaluation.ply.move': 'Coup {moveNumber} ({color})',
      'orientation.status': 'Orientation actuelle : {side} en bas',
      'orientation.auto': 'Synchroniser automatiquement avec le trait',
      'orientation.flip': 'Inverser la vue',
      'info.title': 'Comment ça marche ?',
      'info.items':
        '<li>Le PGN alimente le moteur de règles et le plateau pour afficher flèches et commentaires.</li><li>Chaque coup avec <code>[%eval]</code> est associé à son demi-coup pour nourrir la barre.</li><li>En naviguant ou en jouant de nouveaux coups, l’évaluation se met à jour automatiquement.</li>',
      'status.error.emptyPgn': 'Veuillez coller un PGN avant de le charger.',
      'status.error.unableToLoad': 'Impossible de charger le PGN fourni.',
      'status.success.loaded': 'PGN chargé avec succès. Les évaluations sont synchronisées ✅',
      'status.error.generic': 'Une erreur est survenue pendant le chargement du PGN.',
      'status.info.reset': 'Échiquier remis à zéro.',
      'status.info.sampleLoaded': 'PGN d’exemple chargé dans l’éditeur.',
      'status.error.sampleUnavailable':
        'Impossible de charger l’exemple local (servez le dossier via HTTP).',
      'status.success.copied': 'PGN copié dans le presse-papiers.',
      'status.error.copyFailed': 'Impossible de copier le PGN (permissions du navigateur ?).',
      'status.info.orientationManual': 'Orientation mise à jour manuellement.',
      'status.info.autoEnabled': 'Synchronisation automatique activée.',
      'status.info.movePlayed': 'Coup joué. PGN mis à jour.',
      'status.error.illegalMove': 'Coup illégal : {reason}',
      'common.white': 'Blancs',
      'common.black': 'Noirs',
    },
  },
  advanced: {
    en: {
      'meta.title': 'Neo Chess Board - Advanced Features',
      'meta.description':
        'Explore Neo Chess Board advanced features: arrows, highlights, premoves, state export, and keyboard shortcuts.',
      'language.toggle.fr': 'Switch to Français',
      'language.toggle.en': 'Switch to English',
      'heading.title': '🎯 Advanced features demo',
      'board.ariaLabel': 'Interactive board',
      'controls.title': '✨ New features',
      'controls.arrows.title': '🏹 Arrows',
      'controls.arrows.addSample': 'Add arrow e2→e4',
      'controls.arrows.addRed': 'Add red arrow d1→d8',
      'controls.arrows.clear': 'Clear arrows',
      'controls.highlights.title': '🎨 Highlights',
      'controls.highlights.addGreen': 'Highlight e5 (green)',
      'controls.highlights.addRed': 'Highlight d4 (red)',
      'controls.highlights.addBlue': 'Highlight f6 (blue)',
      'controls.highlights.clear': 'Clear highlights',
      'controls.premoves.title': '⚡ Premoves',
      'controls.premoves.setExample': 'Set premove g1→f3',
      'controls.premoves.clear': 'Clear premove',
      'controls.premoves.show': 'Show premove status',
      'controls.game.title': '🎮 Game control',
      'controls.game.reset': 'Reset board',
      'controls.game.test': 'Test position',
      'controls.game.clearDrawings': 'Clear all drawings',
      'controls.state.title': '💾 State management',
      'controls.state.export': 'Export state',
      'controls.state.import': 'Import state',
      'instructions.title': '📖 Instructions',
      'instructions.items':
        "<li><strong>Right-click + drag</strong> to draw arrows between squares.</li><li><strong>Right-click</strong> a square to cycle highlight colors.</li><li>Use premoves while it's not your turn to queue the next move.</li><li>Press <strong>Escape</strong> to cancel the current drawing action.</li>",
      'status.ready': 'Ready to test advanced features!',
      'status.move': 'Move: {from}→{to}',
      'status.illegal': 'Illegal move: {from}→{to} ({reason})',
      'status.arrowSample': 'Added arrow from e2 to e4',
      'status.arrowRed': 'Added red arrow from d1 to d8',
      'status.highlight': 'Highlighted {square} in {type}',
      'status.premoveSet': 'Set premove: g1→f3',
      'status.premoveCurrent': 'Current premove: {from}→{to}',
      'status.premoveNone': 'No premove set',
      'status.exported': 'Drawings exported to localStorage',
      'status.imported': 'Drawings imported from localStorage',
      'status.noSaved': 'No saved drawings found',
    },
    fr: {
      'meta.title': 'Neo Chess Board - Fonctionnalités avancées',
      'meta.description':
        'Explorez les fonctionnalités avancées de Neo Chess Board : flèches, surbrillances, pré-mouvements, export d’état et raccourcis clavier.',
      'language.toggle.fr': 'Basculer en français',
      'language.toggle.en': 'Switch to English',
      'heading.title': '🎯 Démo des fonctionnalités avancées',
      'board.ariaLabel': 'Échiquier interactif',
      'controls.title': '✨ Nouvelles fonctionnalités',
      'controls.arrows.title': '🏹 Flèches',
      'controls.arrows.addSample': 'Ajouter une flèche e2→e4',
      'controls.arrows.addRed': 'Ajouter une flèche rouge d1→d8',
      'controls.arrows.clear': 'Effacer les flèches',
      'controls.highlights.title': '🎨 Surbrillances',
      'controls.highlights.addGreen': 'Mettre e5 en surbrillance (vert)',
      'controls.highlights.addRed': 'Mettre d4 en surbrillance (rouge)',
      'controls.highlights.addBlue': 'Mettre f6 en surbrillance (bleu)',
      'controls.highlights.clear': 'Effacer les surbrillances',
      'controls.premoves.title': '⚡ Pré-mouvements',
      'controls.premoves.setExample': 'Définir le pré-mouvement g1→f3',
      'controls.premoves.clear': 'Effacer le pré-mouvement',
      'controls.premoves.show': 'Afficher le statut du pré-mouvement',
      'controls.game.title': '🎮 Contrôle de partie',
      'controls.game.reset': 'Réinitialiser l’échiquier',
      'controls.game.test': 'Position de test',
      'controls.game.clearDrawings': 'Effacer tous les tracés',
      'controls.state.title': '💾 Gestion de l’état',
      'controls.state.export': 'Exporter l’état',
      'controls.state.import': 'Importer l’état',
      'instructions.title': '📖 Instructions',
      'instructions.items':
        '<li><strong>Clic droit + glisser</strong> pour tracer des flèches entre les cases.</li><li><strong>Clic droit</strong> sur une case pour faire défiler les couleurs de surbrillance.</li><li>Utilisez les pré-mouvements lorsqu’aucun coup n’est possible pour préparer le suivant.</li><li>Appuyez sur <strong>Échap</strong> pour annuler l’action en cours.</li>',
      'status.ready': 'Prêt à tester les fonctionnalités avancées !',
      'status.move': 'Coup : {from}→{to}',
      'status.illegal': 'Coup illégal : {from}→{to} ({reason})',
      'status.arrowSample': 'Flèche ajoutée de e2 vers e4',
      'status.arrowRed': 'Flèche rouge ajoutée de d1 vers d8',
      'status.highlight': 'Case {square} surlignée ({type})',
      'status.premoveSet': 'Pré-mouvement défini : g1→f3',
      'status.premoveCurrent': 'Pré-mouvement actif : {from}→{to}',
      'status.premoveNone': 'Aucun pré-mouvement défini',
      'status.exported': 'Tracés exportés dans le localStorage',
      'status.imported': 'Tracés importés depuis le localStorage',
      'status.noSaved': 'Aucun tracé sauvegardé trouvé',
    },
  },
};

const fallbackLanguage = 'en';

const applyReplacements = (template, replacements = {}) =>
  template.replaceAll(/\{(\w+)\}/g, (_, token) =>
    Object.prototype.hasOwnProperty.call(replacements, token)
      ? String(replacements[token])
      : `{${token}}`,
  );

export function setupI18n(pageKey) {
  const dictionary = dictionaries[pageKey];
  if (!dictionary) {
    throw new Error(`Missing translations for page "${pageKey}"`);
  }

  const storageKey = `${STORAGE_PREFIX}${pageKey}`;
  let currentLanguage = globalThis.localStorage?.getItem(storageKey) ?? fallbackLanguage;
  if (!dictionary[currentLanguage]) {
    currentLanguage = fallbackLanguage;
  }

  const translate = (key, replacements) => {
    const template = dictionary[currentLanguage][key] ?? dictionary[fallbackLanguage][key] ?? key;
    return applyReplacements(template, replacements);
  };

  const applyToDom = () => {
    document.documentElement.lang = currentLanguage;

    const metaTitle =
      dictionary[currentLanguage]['meta.title'] ?? dictionary[fallbackLanguage]['meta.title'];
    if (metaTitle) {
      document.title = metaTitle;
    }
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      const description =
        dictionary[currentLanguage]['meta.description'] ??
        dictionary[fallbackLanguage]['meta.description'];
      if (description) {
        metaDescription.setAttribute('content', description);
      }
    }

    for (const element of document.querySelectorAll('[data-i18n]')) {
      const key = element.dataset.i18n;
      if (key) {
        element.textContent = translate(key);
      }
    }

    for (const element of document.querySelectorAll('[data-i18n-html]')) {
      const key = element.dataset.i18nHtml;
      if (key) {
        element.innerHTML = translate(key);
      }
    }

    for (const element of document.querySelectorAll('[data-i18n-attr]')) {
      const mappings = element.dataset.i18nAttr?.split(',').map((part) => part.trim());
      if (!mappings) {
        continue;
      }
      for (const mapping of mappings) {
        const [attr, key] = mapping.split(':');
        if (attr && key) {
          element.setAttribute(attr.trim(), translate(key.trim()));
        }
      }
    }
  };

  const setLanguage = (language) => {
    if (!dictionary[language]) {
      return;
    }
    currentLanguage = language;
    try {
      globalThis.localStorage?.setItem(storageKey, language);
    } catch (error) {
      console.warn('Unable to persist language preference:', error);
    }
    applyToDom();
  };

  applyToDom();

  return {
    translate,
    setLanguage,
    getLanguage: () => currentLanguage,
    dictionary,
  };
}

export { dictionaries };
