import { createContext, useContext } from 'react';

export type Language = 'en' | 'fr';

export const translations = {
  en: {
    'app.loading': 'loading...',
    'app.initializing': 'Initializing the chessboard...',
    'app.themeChanging': 'Switching theme...',
    'app.themeCreatorTitle': 'Create a custom theme',
    'app.themeCreatorLinkText': '🎨 Theme Creator',
    'app.languageLabel': 'Language',
    'app.languageEnglish': 'English',
    'app.languageFrench': 'French',
    'app.themes.midnight': 'Midnight',
    'app.themes.classic': 'Classic',
    'common.white': 'White',
    'common.black': 'Black',
    'common.startOfGame': 'the start of the game',
    'board.resize.ariaLabel': 'Resize the chessboard',
    'board.resize.tooltip': 'Drag to resize (double-click to reset)',
    'board.orientation.autoDisabled': 'Disable auto-flip to change the orientation manually',
    'status.title': '📊 Game status',
    'status.turn.label': 'Side to move',
    'status.turn.moveNumber': 'Move #{moveNumber}',
    'status.legalMoves.label': 'Legal moves',
    'status.legalMoves.hint': 'Available options for {color}',
    'status.halfMoves.label': 'Half-moves',
    'status.halfMoves.hint': 'Since the last capture or pawn move',
    'status.fifty.label': 'Remaining before 50-move rule',
    'status.fifty.hint': 'Half-moves remaining before a claimable draw',
    'status.tags.checkmate': 'Checkmate',
    'status.tags.stalemate': 'Stalemate',
    'status.tags.check': 'Check in progress',
    'status.tags.gameOver': 'Game finished',
    'status.tags.inProgress': 'Game in progress',
    'status.tags.fiftyReached': '50-move rule threshold reached',
    'status.tags.fiftyWarning': '{halfMoves} half-moves before the limit',
    'status.tags.fiftyInfo': '{halfMoves} half-moves remaining',
    'evaluation.panelTitle': '📈 Evaluation bar',
    'evaluation.analysisTitle': 'Analysis tracking',
    'evaluation.lastScore': 'Last imported score: {score}',
    'evaluation.lastScoreWithMove': 'Last imported score: {score} (after {move})',
    'evaluation.waitingData': 'Waiting for data from an annotated PGN.',
    'evaluation.instructions.prefix': 'Paste a PGN containing',
    'evaluation.instructions.middle': 'comments then click',
    'evaluation.instructions.suffix': 'to sync the position, orientation, and evaluations.',
    'evaluation.list.perspective':
      'The bar automatically reflects the currently displayed perspective.',
    'evaluation.list.updates': 'Evaluations refresh after each import and after every move played.',
    'evaluation.examplesTitle': '🧪 Ready-to-use examples',
    'evaluation.examplesIntro':
      'Explore the hosted example pages to see NeoChessBoard in action in different contexts.',
    'evaluationBar.none': 'No evaluation imported',
    'evaluationBar.mateWhite': 'Announced mate for White',
    'evaluationBar.mateBlack': 'Announced mate for Black',
    'evaluationBar.custom': 'Custom evaluation',
    'evaluationBar.balanced': 'Balanced',
    'evaluationBar.advantageWhite': 'White advantage',
    'evaluationBar.advantageBlack': 'Black advantage',
    'evaluationBar.initial': 'Initial evaluation',
    'evaluationBar.afterMove': 'After {move}',
    'evaluationBar.importHint': 'Add [%eval ...] in your PGN comments to power the bar.',
    'evaluationBar.ply.start': 'the start of the game',
    'evaluationBar.ply.move': '{moveNumber}{suffix} ({color})',
    'options.title': '⚙️ Board options',
    'options.showArrows.title': 'Interactive arrows',
    'options.showArrows.enabled': 'Enabled',
    'options.showArrows.disabled': 'Hidden',
    'options.showHighlights.title': 'Highlights',
    'options.showHighlights.enabled': 'Visible',
    'options.showHighlights.disabled': 'Hidden',
    'options.allowPremoves.title': 'Premoves',
    'options.allowPremoves.enabled': 'Allowed',
    'options.allowPremoves.disabled': 'Blocked',
    'options.showSquareNames.title': 'Coordinates',
    'options.showSquareNames.enabled': 'Shown',
    'options.showSquareNames.disabled': 'Hidden',
    'options.soundEnabled.title': 'Sound effects',
    'options.soundEnabled.enabled': 'Active',
    'options.soundEnabled.disabled': 'Muted',
    'options.allowResize.title': 'Resizable corner',
    'options.allowResize.enabled': 'Enabled',
    'options.allowResize.disabled': 'Disabled',
    'options.highlightLegal.title': 'Legal moves',
    'options.highlightLegal.enabled': 'Displayed',
    'options.highlightLegal.disabled': 'Hidden',
    'options.autoFlip.title': 'Auto-flip',
    'options.autoFlip.enabled': 'Synced',
    'options.autoFlip.disabled': 'Manual',
    'options.orientation.title': 'Orientation',
    'options.orientation.auto': 'Controlled automatically',
    'options.orientation.view': '{color} view',
    'options.addArrow.title': 'Add an arrow',
    'options.addArrow.hint': 'Random placement',
    'options.addHighlight.title': 'Add a zone',
    'options.addHighlight.hint': 'Random highlight',
    'options.clearAll.title': 'Clear all',
    'options.clearAll.hint': 'Reset annotations',
    'pgn.title': '📋 PGN notation',
    'pgn.placeholder': 'Paste a PGN (with [%eval]) or play to generate notation...',
    'pgn.load': 'Load',
    'pgn.loading': 'Loading...',
    'pgn.copy': 'Copy',
    'pgn.copying': 'Copying...',
    'pgn.reset': 'Reset',
    'pgn.resetting': 'Resetting...',
    'pgn.export': 'Export',
    'pgn.exporting': 'Exporting...',
    'pgn.error.empty': 'Please paste a PGN before loading it.',
    'pgn.error.load': 'Unable to load the provided PGN.',
    'pgn.error.generic': 'An error occurred while loading the PGN.',
    'pgn.helper.prefix': 'Tip:',
    'pgn.helper.middle': 'Import a PGN containing',
    'pgn.helper.suffix': 'to feed the evaluation bar or explore the recorded moves.',
    'fen.title': '🎯 FEN position',
    'fen.placeholder': 'Enter a FEN position to set up the board...',
    'premoves.title': '⚡ Premove testing',
    'premoves.instructions': 'How to test premoves:',
    'premoves.step.examples': 'Use the sample positions below',
    'premoves.step.outOfTurn': 'Try moving a piece when it is not your turn',
    'premoves.step.stored': 'The move will be stored as a premove (dotted orange arrow)',
    'premoves.step.execute':
      'Play a regular move — the premove will execute automatically if it is legal',
    'premoves.sample.opening': 'Opening position',
    'premoves.sample.middleGame': 'Middlegame position',
    'premoves.sample.endgame': 'Simple endgame',
    'examples.title': '🧪 Ready-to-use examples',
    'examples.intro':
      'Explore the hosted example pages to see NeoChessBoard in action in different contexts.',
    'examples.live.vanilla.label': 'Vanilla JS Starter',
    'examples.live.vanilla.description':
      'Standalone interactive board with themes, move history, and PGN export.',
    'examples.live.chessJs.label': 'Chess.js integration',
    'examples.live.chessJs.description': 'Full sync with chess.js and live status updates.',
    'examples.live.pgnEval.label': 'PGN + Evaluation bar',
    'examples.live.pgnEval.description':
      'Import annotated games, auto orientation, and evaluation tracking.',
    'examples.live.advanced.label': 'Advanced features',
    'examples.live.advanced.description':
      'Puzzle modes, analysis tools, and keyboard interactions for power users.',
    'loaders.default': 'Loading...',
  },
  fr: {
    'app.loading': 'chargement...',
    'app.initializing': 'Initialisation de l\u2019\u00e9chiquier...',
    'app.themeChanging': 'Changement de th\u00e8me...',
    'app.themeCreatorTitle': 'Cr\u00e9er un th\u00e8me personnalis\u00e9',
    'app.themeCreatorLinkText': '🎨 Theme Creator',
    'app.languageLabel': 'Langue',
    'app.languageEnglish': 'Anglais',
    'app.languageFrench': 'Fran\u00e7ais',
    'app.themes.midnight': 'Midnight',
    'app.themes.classic': 'Classic',
    'common.white': 'Blancs',
    'common.black': 'Noirs',
    'common.startOfGame': 'le d\u00e9but de partie',
    'board.resize.ariaLabel': 'Redimensionner l\u2019\u00e9chiquier',
    'board.resize.tooltip': 'Glisser pour redimensionner (double-clic pour r\u00e9initialiser)',
    'board.orientation.autoDisabled':
      'D\u00e9sactivez l\u2019auto-flip pour changer manuellement l\u2019orientation',
    'status.title': '📊 Statut de la partie',
    'status.turn.label': 'Trait',
    'status.turn.moveNumber': 'Coup n\u00b0 {moveNumber}',
    'status.legalMoves.label': 'Coups l\u00e9gaux',
    'status.legalMoves.hint': 'Options disponibles pour {color}',
    'status.halfMoves.label': 'Demi-coups',
    'status.halfMoves.hint': 'Depuis la derni\u00e8re prise ou avanc\u00e9e de pion',
    'status.fifty.label': 'Reste avant 50 coups',
    'status.fifty.hint': 'Demi-coups restants avant une nulle r\u00e9clamable',
    'status.tags.checkmate': '\u00c9chec et mat',
    'status.tags.stalemate': 'Pat',
    'status.tags.check': '\u00c9chec en cours',
    'status.tags.gameOver': 'Partie termin\u00e9e',
    'status.tags.inProgress': 'Partie en cours',
    'status.tags.fiftyReached': 'Limite des 50 coups atteinte',
    'status.tags.fiftyWarning': '{halfMoves} demi-coups avant la limite',
    'status.tags.fiftyInfo': '{halfMoves} demi-coups restants',
    'evaluation.panelTitle': '📈 Barre d\u2019\u00e9valuation',
    'evaluation.analysisTitle': 'Suivi des analyses',
    'evaluation.lastScore': 'Dernier score import\u00e9 : {score}',
    'evaluation.lastScoreWithMove': 'Dernier score import\u00e9 : {score} (apr\u00e8s {move})',
    'evaluation.waitingData': 'En attente de donn\u00e9es provenant d\u2019un PGN annot\u00e9.',
    'evaluation.instructions.prefix': 'Collez un PGN contenant',
    'evaluation.instructions.middle': 'puis cliquez sur',
    'evaluation.instructions.suffix':
      'pour synchroniser la position, l\u2019orientation et les \u00e9valuations.',
    'evaluation.list.perspective':
      'La barre refl\u00e8te automatiquement la perspective actuellement affich\u00e9e.',
    'evaluation.list.updates':
      'Les \u00e9valuations sont mises \u00e0 jour \u00e0 chaque import et apr\u00e8s chaque coup jou\u00e9.',
    'evaluation.examplesTitle': '🧪 Exemples pr\u00eats \u00e0 l\u2019emploi',
    'evaluation.examplesIntro':
      'Explorez les pages d\u2019exemples h\u00e9berg\u00e9es pour voir NeoChessBoard en action dans diff\u00e9rents contextes.',
    'evaluationBar.none': 'Aucune \u00e9valuation import\u00e9e',
    'evaluationBar.mateWhite': 'Mat annonc\u00e9 pour les Blancs',
    'evaluationBar.mateBlack': 'Mat annonc\u00e9 pour les Noirs',
    'evaluationBar.custom': '\u00c9valuation personnalis\u00e9e',
    'evaluationBar.balanced': '\u00c9quilibre',
    'evaluationBar.advantageWhite': 'Avantage Blancs',
    'evaluationBar.advantageBlack': 'Avantage Noirs',
    'evaluationBar.initial': '\u00c9valuation initiale',
    'evaluationBar.afterMove': 'Apr\u00e8s {move}',
    'evaluationBar.importHint':
      'Ajoutez [%eval ...] dans vos commentaires PGN pour alimenter la barre.',
    'evaluationBar.ply.start': 'le d\u00e9but de partie',
    'evaluationBar.ply.move': '{moveNumber}{suffix} ({color})',
    'options.title': '⚙️ Options de l\u2019\u00e9chiquier',
    'options.showArrows.title': 'Fl\u00e8ches interactives',
    'options.showArrows.enabled': 'Activ\u00e9es',
    'options.showArrows.disabled': 'Masqu\u00e9es',
    'options.showHighlights.title': 'Surbrillances',
    'options.showHighlights.enabled': 'Visibles',
    'options.showHighlights.disabled': 'Masqu\u00e9es',
    'options.allowPremoves.title': 'Pr\u00e9-mouvements',
    'options.allowPremoves.enabled': 'Autoris\u00e9s',
    'options.allowPremoves.disabled': 'Bloqu\u00e9s',
    'options.showSquareNames.title': 'Coordonn\u00e9es',
    'options.showSquareNames.enabled': 'Affich\u00e9es',
    'options.showSquareNames.disabled': 'Masqu\u00e9es',
    'options.soundEnabled.title': 'Effets sonores',
    'options.soundEnabled.enabled': 'Actifs',
    'options.soundEnabled.disabled': 'Coup\u00e9s',
    'options.allowResize.title': 'Coin redimensionnable',
    'options.allowResize.enabled': 'Activ\u00e9',
    'options.allowResize.disabled': 'D\u00e9sactiv\u00e9',
    'options.highlightLegal.title': 'Coups l\u00e9gaux',
    'options.highlightLegal.enabled': 'Signal\u00e9s',
    'options.highlightLegal.disabled': 'Masqu\u00e9s',
    'options.autoFlip.title': 'Auto-flip',
    'options.autoFlip.enabled': 'Synchronis\u00e9',
    'options.autoFlip.disabled': 'Manuel',
    'options.orientation.title': 'Orientation',
    'options.orientation.auto': 'Contr\u00f4l\u00e9e automatiquement',
    'options.orientation.view': 'Vue {color}',
    'options.addArrow.title': 'Ajouter une fl\u00e8che',
    'options.addArrow.hint': 'Placement al\u00e9atoire',
    'options.addHighlight.title': 'Ajouter une zone',
    'options.addHighlight.hint': 'Surbrillance al\u00e9atoire',
    'options.clearAll.title': 'Tout effacer',
    'options.clearAll.hint': 'R\u00e9initialise annotations',
    'pgn.title': '📋 PGN Notation',
    'pgn.placeholder':
      'Collez un PGN (avec [%eval]) ou jouez pour g\u00e9n\u00e9rer la notation...',
    'pgn.load': 'Charger',
    'pgn.loading': 'Chargement...',
    'pgn.copy': 'Copier',
    'pgn.copying': 'Copie...',
    'pgn.reset': 'Reset',
    'pgn.resetting': 'Remise \u00e0 z\u00e9ro...',
    'pgn.export': 'Exporter',
    'pgn.exporting': 'Export...',
    'pgn.error.empty': 'Veuillez coller un PGN avant de le charger.',
    'pgn.error.load': 'Impossible de charger le PGN fourni.',
    'pgn.error.generic': 'Une erreur est survenue pendant le chargement du PGN.',
    'pgn.helper.prefix': 'Astuce :',
    'pgn.helper.middle': 'importez un PGN contenant',
    'pgn.helper.suffix':
      'pour alimenter la barre d\u2019\u00e9valuation ou explorez les coups enregistr\u00e9s.',
    'fen.title': '🎯 Position FEN',
    'fen.placeholder': 'Saisissez une position FEN pour d\u00e9finir l\u2019\u00e9chiquier...',
    'premoves.title': '⚡ Test des Premoves',
    'premoves.instructions': 'Comment tester les premoves :',
    'premoves.step.examples': 'Utilisez les positions d\u2019exemple ci-dessous',
    'premoves.step.outOfTurn':
      'Essayez de d\u00e9placer une pi\u00e8ce qui n\u2019est pas de votre tour',
    'premoves.step.stored':
      'Le coup sera stock\u00e9 comme \u00ab premove \u00bb (fl\u00e8che orange pointill\u00e9e)',
    'premoves.step.execute':
      'Jouez un coup normal - le premove s\u2019ex\u00e9cutera automatiquement s\u2019il est l\u00e9gal',
    'premoves.sample.opening': 'Position d\u2019ouverture',
    'premoves.sample.middleGame': 'Milieu de partie',
    'premoves.sample.endgame': 'Finale simple',
    'examples.title': '🧪 Exemples pr\u00eats \u00e0 l\u2019emploi',
    'examples.intro':
      'Explorez les pages d\u2019exemples h\u00e9berg\u00e9es pour voir NeoChessBoard en action dans diff\u00e9rents contextes.',
    'examples.live.vanilla.label': 'Vanilla JS Starter',
    'examples.live.vanilla.description':
      '\u00c9chiquier interactif autonome avec th\u00e8mes, historique et export PGN.',
    'examples.live.chessJs.label': 'Int\u00e9gration Chess.js',
    'examples.live.chessJs.description':
      'Synchronisation compl\u00e8te avec chess.js et mise \u00e0 jour temps r\u00e9el du statut.',
    'examples.live.pgnEval.label': 'PGN + Barre d\u2019\u00e9valuation',
    'examples.live.pgnEval.description':
      'Import de parties annot\u00e9es, orientation automatique et suivi des \u00e9valuations.',
    'examples.live.advanced.label': 'Fonctionnalit\u00e9s avanc\u00e9es',
    'examples.live.advanced.description':
      'Modes puzzle, outils d\u2019analyse et interactions clavier pour power-users.',
    'loaders.default': 'Chargement...',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
export type ReplacementValues = Record<string, string | number>;
export type TranslationDictionary = (typeof translations)[Language];

const fallbackLanguage: Language = 'en';

const applyReplacements = (template: string, replacements: ReplacementValues = {}): string =>
  template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = replacements[token];
    return typeof value === 'undefined' ? `{${token}}` : String(value);
  });

export interface TranslationContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  translate: (key: TranslationKey, replacements?: ReplacementValues) => string;
  dictionary: TranslationDictionary;
}

const defaultDictionary = translations[fallbackLanguage];

const defaultContext: TranslationContextValue = {
  language: fallbackLanguage,
  setLanguage: () => undefined,
  translate: (key: TranslationKey, replacements?: ReplacementValues) =>
    applyReplacements(defaultDictionary[key] ?? key, replacements),
  dictionary: defaultDictionary,
};

export const TranslationContext = createContext<TranslationContextValue>(defaultContext);

export const useTranslation = (): TranslationContextValue => useContext(TranslationContext);

export const createTranslationValue = (
  language: Language,
  setLanguage: (language: Language) => void,
): TranslationContextValue => {
  const activeDictionary = translations[language] ?? defaultDictionary;
  const translate = (key: TranslationKey, replacements?: ReplacementValues): string => {
    const template = activeDictionary[key] ?? defaultDictionary[key] ?? key;
    return applyReplacements(template, replacements);
  };

  return {
    language,
    setLanguage,
    translate,
    dictionary: activeDictionary,
  };
};
