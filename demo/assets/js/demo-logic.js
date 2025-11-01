import { NeoChessBoard, ChessJsRules, START_FEN, THEMES } from '@magicolala/neo-chess-board';
import { Chess } from 'chess.js';

const state = {
  board: /** @type {NeoChessBoard | null} */ (null),
  initialFen: START_FEN,
  orientation: 'white',
  moveCursor: 0,
  timeline: [START_FEN],
  moveMetadata: [],
  historySan: [],
  evaluations: [],
  evaluationMode: 'centipawn',
  engineProfile: 'maia-1900',
  toggles: {
    arrows: true,
    highlights: true,
    premoves: true,
    animations: true,
    coordinates: true,
    sounds: true,
    legalMoves: true,
    autoFlip: false,
  },
  navigating: false,
  hasAnnotationsVisible: true,
};

const ui = {
  moveList: document.querySelector('#move-list'),
  currentMoveLabel: document.querySelector('#current-move-label'),
  navButtons: document.querySelectorAll('[data-nav]'),
  flipButton: document.querySelector('#flip-board'),
  boardCanvas: document.querySelector('#board-canvas'),
  animationSpeed: document.querySelector('#animation-speed'),
  animationValue: document.querySelector('#animation-speed-value'),
  engineSelect: document.querySelector('#engine-select'),
  engineStatus: document.querySelector('#engine-status'),
  evaluationMode: document.querySelector('#evaluation-mode'),
  evaluationScore: document.querySelector('#evaluation-score'),
  evaluationCaption: document.querySelector('#evaluation-caption'),
  evaluationPointer: document.querySelector('#evaluation-move-pointer'),
  evaluationWhite: document.querySelector('#evaluation-white'),
  evaluationBlack: document.querySelector('#evaluation-black'),
  moveMap: document.querySelector('#move-map'),
  blunderMeter: document.querySelector('#blunder-meter'),
  statTurn: document.querySelector('#stat-turn'),
  statLegal: document.querySelector('#stat-legal'),
  statHalfmove: document.querySelector('#stat-halfmove'),
  statFifty: document.querySelector('#stat-fifty'),
  statFullmove: document.querySelector('#stat-fullmove'),
  statusText: document.querySelector('#status-text'),
  statusTags: document.querySelector('#status-tags'),
  fenOutput: document.querySelector('#fen-output'),
  pgnInput: document.querySelector('#pgn-input'),
  loadPgn: document.querySelector('#load-pgn'),
  copyPgn: document.querySelector('#copy-pgn'),
  exportPgn: document.querySelector('#export-pgn'),
  resetBoard: document.querySelector('#reset-board'),
  copyFen: document.querySelector('#copy-fen'),
  loadSample: document.querySelector('#load-sample'),
  boardOptions: document.querySelectorAll('#board-options .toggle'),
  themeSelect: document.querySelector('#theme-select'),
  analysisStatus: document.querySelector('#analysis-status'),
  syncStatus: document.querySelector('#sync-status'),
  toastRoot: document.querySelector('#toast-root'),
  themeModeToggle: document.querySelector('#theme-mode-toggle'),
  addArrow: document.querySelector('#add-arrow'),
  clearArrows: document.querySelector('#clear-arrows'),
  toggleAnnotations: document.querySelector('#toggle-annotations'),
  year: document.querySelector('#year'),
};

const SAMPLE_ANNOTATED_PGN = `[
  Event "NeoChessBoard Showcase"]
[Site "NeoChessBoard"]
[Date "2024.11.04"]
[Round "-"]
[White "Neo Assistant"]
[Black "Neo Visitor"]
[Result "1-0"]

1. e4 [%eval 0.20] e5 [%eval 0.12] 2. Nf3 [%eval 0.35] Nc6 [%eval 0.10] 3. Bb5 [%eval 0.62]
 a6 [%eval 0.15] 4. Ba4 [%eval 0.75] Nf6 [%eval 0.32] 5. O-O [%eval 0.95] Be7 [%eval 0.44]
6. Re1 [%eval 1.10] b5 [%eval 0.65] 7. Bb3 [%eval 1.25] d6 [%eval 0.80] 8. c3 [%eval 1.45]
O-O [%eval 0.90] 9. h3 [%eval 1.55] Nb8 [%eval 0.75] 10. d4 [%eval 1.80] Nbd7 [%eval 1.05]
11. a4 [%eval 2.10] Bb7 [%eval 1.30] 12. Nbd2 [%eval 2.50] Re8 [%eval 1.60]
13. Bc2 [%eval 2.85] Bf8 [%eval 1.75] 14. Bd3 [%eval 3.40] c5 [%eval 1.20]
15. d5 [%eval 4.10] c4 [%eval 0.80] 16. Bc2 [%eval 4.50] Nc5 [%eval 1.10]
17. b4 [%eval 5.20] cxb3 [%eval 3.20] 18. Nxb3 [%eval 6.10] Nxa4 [%eval 3.10]
19. Qd2 [%eval 6.80] Rc8 [%eval 3.55] 20. Na5 [%eval 7.50] Ba8 [%eval 3.25]
21. Re3 [%eval 8.20] Qxa5 [%eval 5.10] 22. Rxa5 [%eval 99.00] 1-0`;

function init() {
  if (ui.year) {
    ui.year.textContent = String(new Date().getFullYear());
  }

  setupBoard();
  populateThemeOptions();
  bindControls();
  refreshUI({ redrawMoveMap: true });
  highlightActiveMove();
  updateFenDisplay(state.timeline[0]);
}

function setupBoard() {
  if (!ui.boardCanvas) {
    console.error('Board canvas element not found.');
    return;
  }

  const canvasBounds = ui.boardCanvas.getBoundingClientRect();
  const desiredSize = Math.round(Math.min(canvasBounds.width || 520, 560));

  state.board = new NeoChessBoard(ui.boardCanvas, {
    size: desiredSize,
    theme: 'midnight',
    rulesAdapter: new ChessJsRules(),
    interactive: true,
    showCoordinates: true,
    showHighlights: true,
    showArrows: true,
    highlightLegal: true,
    allowPremoves: true,
    animation: { duration: 300 },
    allowDrawingArrows: true,
    soundEnabled: true,
    autoFlip: false,
  });

  state.board.on('move', handleBoardMove);
  state.board.on('update', ({ fen }) => {
    if (!state.navigating) {
      updateFenDisplay(fen);
      updateStatsForIndex(state.moveCursor);
    }
  });

  window.addEventListener(
    'resize',
    debounce(() => resizeBoard(), 120),
  );
}

function handleBoardMove() {
  syncTimelineFromBoard();
  state.moveCursor = state.timeline.length - 1;
  refreshUI({ redrawMoveMap: true });
  highlightActiveMove();
  showToast('Move recorded', 'success');
}

function resizeBoard() {
  if (!state.board || !ui.boardCanvas) return;
  const bounds = ui.boardCanvas.getBoundingClientRect();
  const newSize = Math.round(Math.min(bounds.width || 520, 560));
  state.board.setBoardStyle({ width: `${newSize}px`, height: `${newSize}px` });
  state.board.resize();
}

function populateThemeOptions() {
  if (!ui.themeSelect) return;
  const themes = Object.keys(THEMES);
  ui.themeSelect.innerHTML = '';

  themes.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name.replaceAll(/\b\w/g, (char) => char.toUpperCase());
    ui.themeSelect.append(option);
  });

  ui.themeSelect.value = 'midnight';
}

function bindControls() {
  ui.navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.nav;
      handleNavigation(action);
    });
  });

  if (ui.flipButton) {
    ui.flipButton.addEventListener('click', () => {
      if (!state.board) return;
      state.orientation = state.orientation === 'white' ? 'black' : 'white';
      state.board.setOrientation(state.orientation);
      showToast(`Board flipped to ${state.orientation}`, 'success');
    });
  }

  if (ui.animationSpeed && ui.animationValue) {
    ui.animationSpeed.addEventListener('input', () => {
      const value = Number(ui.animationSpeed.value);
      ui.animationValue.textContent = `${value} ms`;
      if (state.board) {
        state.board.setAnimationDuration(value);
        state.board.setShowAnimations(value > 0);
        state.toggles.animations = value > 0;
      }
    });
  }

  if (ui.engineSelect && ui.engineStatus) {
    ui.engineSelect.addEventListener('change', () => {
      state.engineProfile = ui.engineSelect.value;
      const label = ui.engineSelect.options[ui.engineSelect.selectedIndex]?.textContent ?? 'Custom';
      ui.engineStatus.textContent = `${label} preset`; // Display friendly text
      showToast(`Engine profile set to ${label}`, 'success');
    });
  }

  if (ui.evaluationMode) {
    ui.evaluationMode.addEventListener('change', () => {
      state.evaluationMode = ui.evaluationMode.value;
      refreshUI({ redrawMoveMap: true });
    });
  }

  ui.boardOptions.forEach((optionLabel) => {
    const option = optionLabel.dataset.option;
    const checkbox = optionLabel.querySelector('input[type="checkbox"]');
    if (!option || !checkbox) return;

    checkbox.checked = Boolean(state.toggles[option]);

    checkbox.addEventListener('change', () => {
      const value = checkbox.checked;
      state.toggles[option] = value;
      applyBoardOption(option, value);
      highlightActiveMove();
    });
  });

  if (ui.themeSelect) {
    ui.themeSelect.addEventListener('change', () => {
      const theme = ui.themeSelect.value;
      if (state.board) {
        state.board.setTheme(theme);
        showToast(`Theme changed to ${theme}`, 'success');
      }
    });
  }

  if (ui.loadPgn) {
    ui.loadPgn.addEventListener('click', () => {
      loadPgnFromTextarea();
    });
  }

  if (ui.copyPgn) {
    ui.copyPgn.addEventListener('click', async () => {
      if (!ui.pgnInput) return;
      const text = ui.pgnInput.value.trim();
      if (!text) {
        showToast('PGN field is empty', 'error');
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        showToast('PGN copied to clipboard', 'success');
      } catch (error) {
        console.error(error);
        showToast('Unable to copy PGN', 'error');
      }
    });
  }

  if (ui.exportPgn) {
    ui.exportPgn.addEventListener('click', () => {
      if (!state.board || !ui.pgnInput) return;
      const exported = state.board.exportPgnWithAnnotations();
      ui.pgnInput.value = exported;
      showToast('Exported PGN with annotations', 'success');
    });
  }

  if (ui.resetBoard) {
    ui.resetBoard.addEventListener('click', () => {
      resetBoardState();
    });
  }

  if (ui.copyFen) {
    ui.copyFen.addEventListener('click', async () => {
      if (!ui.fenOutput) return;
      try {
        await navigator.clipboard.writeText(ui.fenOutput.value);
        showToast('FEN copied to clipboard', 'success');
      } catch (error) {
        console.error(error);
        showToast('Unable to copy FEN', 'error');
      }
    });
  }

  if (ui.loadSample) {
    ui.loadSample.addEventListener('click', () => {
      if (!ui.pgnInput) return;
      ui.pgnInput.value = SAMPLE_ANNOTATED_PGN;
      loadPgnFromTextarea();
    });
  }

  if (ui.themeModeToggle) {
    ui.themeModeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      ui.themeModeToggle.innerHTML = `<span aria-hidden="true">${isDark ? '🌙' : '☀️'}</span>`;
      showToast(`Switched to ${isDark ? 'dark' : 'light'} mode`, 'success');
    });
  }

  if (ui.addArrow) {
    ui.addArrow.addEventListener('click', () => {
      if (!state.board) return;
      const moveMeta = state.moveMetadata[state.moveCursor - 1] ?? state.moveMetadata.at(-1);
      if (moveMeta) {
        const coordinate = state.board.sanToCoordinates(moveMeta.san);
        if (coordinate) {
          const from = coordinate.slice(0, 2);
          const to = coordinate.slice(2, 4);
          state.board.addArrow({
            from,
            to,
            color: moveMeta.color === 'white' ? '#8b5cf6' : '#3b82f6',
          });
          showToast('Arrow added for current move', 'success');
          return;
        }
      }
      state.board.addArrow({ from: 'e2', to: 'e4', color: '#8b5cf6' });
      showToast('Sample arrow added', 'success');
    });
  }

  if (ui.clearArrows) {
    ui.clearArrows.addEventListener('click', () => {
      if (!state.board) return;
      state.board.clearAllDrawings();
      showToast('All arrows and highlights cleared', 'success');
    });
  }

  if (ui.toggleAnnotations) {
    ui.toggleAnnotations.addEventListener('click', () => {
      if (!state.board) return;
      state.hasAnnotationsVisible = !state.hasAnnotationsVisible;
      if (state.hasAnnotationsVisible) {
        highlightActiveMove();
        showToast('Highlights restored', 'success');
      } else {
        state.board.clearHighlights();
        showToast('Highlights hidden', 'success');
      }
    });
  }
}

function applyBoardOption(option, value) {
  if (!state.board) return;
  switch (option) {
    case 'arrows': {
      state.board.setShowArrows(value);
      break;
    }
    case 'highlights': {
      state.board.setShowHighlights(value);
      state.hasAnnotationsVisible = value;
      if (value) {
        highlightActiveMove();
      } else {
        state.board.clearHighlights();
      }
      break;
    }
    case 'premoves': {
      state.board.setAllowPremoves(value);
      break;
    }
    case 'animations': {
      state.board.setShowAnimations(value);
      break;
    }
    case 'coordinates': {
      state.board.setShowNotation(value);
      break;
    }
    case 'sounds': {
      state.board.setSoundEnabled(value);
      break;
    }
    case 'legalMoves': {
      state.board.setHighlightLegal(value);
      break;
    }
    case 'autoFlip': {
      state.board.setAutoFlip(value);
      break;
    }
    default: {
      break;
    }
  }
}

function handleNavigation(action) {
  if (!action) return;
  if (state.timeline.length <= 1) return;

  const maxIndex = state.timeline.length - 1;
  let target = state.moveCursor;

  switch (action) {
    case 'first': {
      target = 0;
      break;
    }
    case 'prev': {
      target = Math.max(0, state.moveCursor - 1);
      break;
    }
    case 'next': {
      target = Math.min(maxIndex, state.moveCursor + 1);
      break;
    }
    case 'last': {
      target = maxIndex;
      break;
    }
    default: {
      break;
    }
  }

  goToIndex(target);
}

function goToIndex(index) {
  if (!state.board) return;
  const clamped = Math.max(0, Math.min(index, state.timeline.length - 1));
  state.moveCursor = clamped;
  const fen = state.timeline[clamped];
  if (!fen) return;

  state.navigating = true;
  state.board.loadPosition(fen, true);
  updateFenDisplay(fen);
  updateStatsForIndex(clamped);
  refreshUI({ redrawMoveMap: true });
  highlightActiveMove();
  setTimeout(() => {
    state.navigating = false;
  }, 50);
}

function syncTimelineFromBoard() {
  if (!state.board) return;
  const history = state.board.getMoveHistory();
  state.historySan = [...history];

  const chess = createBaseChess();
  const fens = [chess.fen()];
  const metadata = [];

  history.forEach((san, index) => {
    try {
      chess.move(san, { sloppy: true });
    } catch (error) {
      console.warn('Failed to apply SAN move', san, error);
      return;
    }

    fens.push(chess.fen());
    metadata.push({
      san,
      moveNumber: Math.floor(index / 2) + 1,
      color: index % 2 === 0 ? 'white' : 'black',
      fen: chess.fen(),
    });
  });

  state.timeline = fens;
  state.moveMetadata = metadata;

  if (state.evaluations.length < metadata.length) {
    const deficit = metadata.length - state.evaluations.length;
    state.evaluations.push(...Array.from({ length: deficit }, () => null));
  } else if (state.evaluations.length > metadata.length) {
    state.evaluations.length = metadata.length;
  }
}

function createBaseChess() {
  const chess = new Chess();
  if (state.initialFen && state.initialFen !== START_FEN) {
    const loaded = chess.load(state.initialFen);
    if (!loaded) {
      console.warn('Invalid initial FEN provided, falling back to start position.');
      chess.load(START_FEN);
    }
  }
  return chess;
}

function refreshUI({ redrawMoveMap = false } = {}) {
  renderMoveList();
  updateNavigationButtons();
  updateCurrentMoveLabel();
  updateEvaluationDisplay();
  updateStatsForIndex(state.moveCursor);
  if (redrawMoveMap) {
    renderMoveMap();
    updateBlunderMeter();
  }
}

function renderMoveList() {
  if (!ui.moveList) return;
  ui.moveList.innerHTML = '';

  if (state.moveMetadata.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-xs text-slate-400';
    empty.textContent = 'No moves yet — start playing or load a PGN to populate the history.';
    ui.moveList.append(empty);
    return;
  }

  for (let index = 0; index < state.moveMetadata.length; index += 2) {
    const row = document.createElement('div');
    row.className = 'move-row';

    const moveIndicator = document.createElement('span');
    moveIndicator.className = 'move-index';
    moveIndicator.textContent = `${state.moveMetadata[index].moveNumber}.`;
    row.append(moveIndicator);

    const whiteMeta = state.moveMetadata[index];
    row.append(createMoveButton(whiteMeta, index + 1));

    const blackMeta = state.moveMetadata[index + 1];
    if (blackMeta) {
      row.append(createMoveButton(blackMeta, index + 2));
    } else {
      const placeholder = document.createElement('span');
      placeholder.className = 'text-xs text-slate-500';
      placeholder.textContent = '…';
      row.append(placeholder);
    }

    ui.moveList.append(row);
  }
}

function createMoveButton(meta, targetIndex) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'move-button';
  button.dataset.color = meta.color;
  button.dataset.target = String(targetIndex);
  button.dataset.active = String(state.moveCursor === targetIndex);
  button.textContent = meta.san;
  button.addEventListener('click', () => goToIndex(targetIndex));
  return button;
}

function updateNavigationButtons() {
  ui.navButtons.forEach((button) => {
    const action = button.dataset.nav;
    if (!action) return;
    if (action === 'first' || action === 'prev') {
      button.disabled = state.moveCursor <= 0;
    }
    if (action === 'last' || action === 'next') {
      button.disabled = state.moveCursor >= state.timeline.length - 1;
    }
  });
}

function updateCurrentMoveLabel() {
  if (!ui.currentMoveLabel) return;
  if (state.moveCursor === 0) {
    ui.currentMoveLabel.textContent = 'Start Position';
    return;
  }
  const meta = state.moveMetadata[state.moveCursor - 1];
  if (!meta) {
    ui.currentMoveLabel.textContent = 'Start Position';
    return;
  }
  ui.currentMoveLabel.textContent = `Move ${meta.moveNumber}${meta.color === 'white' ? '…' : ' — '} ${meta.san}`;
}

function updateEvaluationDisplay() {
  if (!ui.evaluationScore || !ui.evaluationWhite || !ui.evaluationBlack || !ui.evaluationCaption)
    return;

  const evalEntry = state.evaluations[state.moveCursor - 1] ?? null;
  const ratio = computeEvaluationRatio(evalEntry);

  ui.evaluationWhite.style.flexBasis = `${Math.round(ratio * 100)}%`;
  ui.evaluationBlack.style.flexBasis = `${Math.round((1 - ratio) * 100)}%`;

  ui.evaluationScore.textContent = formatEvaluationScore(evalEntry);
  ui.evaluationCaption.textContent = buildEvaluationCaption(evalEntry);
  ui.evaluationPointer.textContent =
    state.moveCursor > 0 ? `After move ${state.moveCursor}` : 'Initial position';
}

function computeEvaluationRatio(entry) {
  if (!entry) return 0.5;
  if (typeof entry.mate === 'number') {
    return entry.mate > 0 ? 0.97 : 0.03;
  }
  const value = entry.value ?? 0;
  if (state.evaluationMode === 'winrate') {
    const logistic = 1 / (1 + 10 ** (-value * 0.7));
    return clamp(logistic, 0.02, 0.98);
  }
  const clamped = clamp(value, -8, 8);
  return clamp(0.5 + clamped / 16, 0.02, 0.98);
}

function formatEvaluationScore(entry) {
  if (!entry) return '—';
  if (typeof entry.mate === 'number') {
    const prefix = entry.mate > 0 ? 'M' : 'M-';
    return `${prefix}${Math.abs(entry.mate)}`;
  }
  if (state.evaluationMode === 'winrate') {
    const logistic = 1 / (1 + 10 ** (-(entry.value ?? 0) * 0.7));
    return `${Math.round(logistic * 100)}%`;
  }
  const value = entry.value ?? 0;
  const formatted = value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  return formatted;
}

function buildEvaluationCaption(entry) {
  if (!entry) return 'Balanced position';
  if (typeof entry.mate === 'number') {
    return entry.mate > 0 ? 'White is mating' : 'Black is mating';
  }
  const value = entry.value ?? 0;
  if (Math.abs(value) < 0.3) return 'Slight imbalance';
  if (Math.abs(value) < 1.2) return value > 0 ? 'Edge for White' : 'Edge for Black';
  if (Math.abs(value) < 2.5) return value > 0 ? 'White advantage' : 'Black advantage';
  return value > 0 ? 'Winning for White' : 'Winning for Black';
}

function renderMoveMap() {
  if (!ui.moveMap) return;
  const canvas = ui.moveMap;
  const context = canvas.getContext('2d');
  if (!context) return;

  const width = canvas.clientWidth || 240;
  const height = canvas.clientHeight || 120;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  context.scale(dpr, dpr);

  context.clearRect(0, 0, width, height);

  context.fillStyle = 'rgba(15, 23, 42, 0.55)';
  context.fillRect(0, 0, width, height);

  context.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  context.beginPath();
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.stroke();

  if (state.evaluations.length === 0) {
    context.fillStyle = 'rgba(148, 163, 184, 0.45)';
    context.font = '12px "Inter"';
    context.fillText('Load a PGN with [%eval] to unlock insights', 12, height / 2 + 4);
    return;
  }

  const points = [0, ...state.evaluations.map((entry) => entry?.value ?? 0)];
  const maxAbs = Math.max(1, ...points.map((value) => Math.abs(value ?? 0)));
  const verticalScale = (height / 2 - 10) / maxAbs;

  context.lineWidth = 2.5;
  const gradient = context.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, 'rgba(139,92,246,0.7)');
  gradient.addColorStop(1, 'rgba(59,130,246,0.7)');
  context.strokeStyle = gradient;
  context.beginPath();

  points.forEach((value, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * width;
    const y = height / 2 - (value ?? 0) * verticalScale;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.stroke();

  context.fillStyle = '#f8fafc';
  points.forEach((value, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * width;
    const y = height / 2 - (value ?? 0) * verticalScale;
    context.beginPath();
    context.arc(x, y, 3, 0, Math.PI * 2);
    context.fill();
  });
}

function updateBlunderMeter() {
  if (!ui.blunderMeter) return;
  ui.blunderMeter.innerHTML = '';

  if (state.evaluations.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-xs text-slate-400';
    empty.textContent = 'No evaluation data available.';
    ui.blunderMeter.append(empty);
    return;
  }

  const thresholds = {
    inaccuracy: 0.7,
    mistake: 1.5,
    blunder: 3,
  };

  const counts = {
    white: { inaccuracy: 0, mistake: 0, blunder: 0 },
    black: { inaccuracy: 0, mistake: 0, blunder: 0 },
  };

  state.evaluations.forEach((entry, index) => {
    if (!entry || typeof entry.value !== 'number') return;
    if (index === 0) return;
    const prev = state.evaluations[index - 1];
    if (!prev || typeof prev.value !== 'number') return;

    const color = index % 2 === 0 ? 'black' : 'white';
    const delta = color === 'white' ? prev.value - entry.value : entry.value - prev.value;
    if (delta < thresholds.inaccuracy) return;
    if (delta >= thresholds.blunder) {
      counts[color].blunder += 1;
    } else if (delta >= thresholds.mistake) {
      counts[color].mistake += 1;
    } else {
      counts[color].inaccuracy += 1;
    }
  });

  ['white', 'black'].forEach((color) => {
    const total = Object.values(counts[color]).reduce((sum, value) => sum + value, 0);
    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-1';

    const label = document.createElement('div');
    label.className = 'flex items-center justify-between text-xs text-slate-300';
    label.innerHTML = `<span>${color === 'white' ? 'White' : 'Black'}</span><span>${total} issues</span>`;
    wrapper.append(label);

    const bar = document.createElement('div');
    bar.className = 'flex overflow-hidden rounded-full border border-white/10 bg-slate-800/60';

    const segments = [
      { key: 'inaccuracy', tone: 'bg-amber-400/80 text-amber-900', color: '#fbbf24' },
      { key: 'mistake', tone: 'bg-orange-500/80 text-orange-900', color: '#f97316' },
      { key: 'blunder', tone: 'bg-rose-500/80 text-rose-100', color: '#f43f5e' },
    ];

    segments.forEach((segment) => {
      const value = counts[color][segment.key];
      if (value === 0) return;
      const span = document.createElement('div');
      span.style.width = `${Math.max((value / Math.max(total, 1)) * 100, 6)}%`;
      span.style.background = segment.color;
      span.className =
        'px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-950';
      span.textContent = `${segment.key.slice(0, 1).toUpperCase()}${segment.key.slice(1, 3)}`;
      bar.append(span);
    });

    if (bar.children.length === 0) {
      const emptySegment = document.createElement('div');
      emptySegment.className = 'w-full px-2 py-1 text-center text-[10px] uppercase text-slate-400';
      emptySegment.textContent = 'Clean';
      bar.append(emptySegment);
    }

    wrapper.append(bar);
    ui.blunderMeter.append(wrapper);
  });
}

function updateStatsForIndex(index) {
  if (
    !ui.statTurn ||
    !ui.statLegal ||
    !ui.statHalfmove ||
    !ui.statFifty ||
    !ui.statFullmove ||
    !ui.statusText ||
    !ui.statusTags
  )
    return;

  const fen = state.timeline[index] ?? state.timeline[0];
  const chess = new Chess();
  let loadSuccessful = false;
  try {
    loadSuccessful = chess.load(fen);
  } catch (error) {
    console.error('Unable to load FEN for stats', error);
  }

  if (!loadSuccessful) return;

  const legalMoves = chess.moves({ verbose: true }).length;
  const parts = fen.split(' ');
  const halfmove = Number(parts[4] ?? 0);
  const fullmove = Number(parts[5] ?? 1);

  ui.statTurn.textContent = chess.turn() === 'w' ? 'White' : 'Black';
  ui.statLegal.textContent = String(legalMoves);
  ui.statHalfmove.textContent = String(halfmove);
  ui.statFifty.textContent = String(Math.max(0, 100 - halfmove));
  ui.statFullmove.textContent = String(fullmove);

  const statusMessages = [];
  if (chess.isCheckmate()) {
    statusMessages.push({ label: 'Checkmate', tone: 'critical' });
  } else if (chess.isStalemate()) {
    statusMessages.push({ label: 'Stalemate', tone: 'warning' });
  } else if (chess.isDraw()) {
    statusMessages.push({ label: 'Drawn', tone: 'muted' });
  } else {
    statusMessages.push({ label: 'In Progress', tone: 'success' });
    if (chess.inCheck?.()) {
      statusMessages.push({ label: 'Check', tone: 'info' });
    }
  }

  ui.statusText.textContent = statusMessages[0]?.label ?? 'In Progress';
  renderStatusTags(statusMessages);
}

function renderStatusTags(tags) {
  if (!ui.statusTags) return;
  ui.statusTags.innerHTML = '';
  tags.forEach((tag) => {
    const badge = document.createElement('span');
    badge.className = 'rounded-full px-3 py-1 text-xs font-semibold';
    switch (tag.tone) {
      case 'critical': {
        badge.style.background = 'rgba(239,68,68,0.2)';
        badge.style.color = '#fecaca';
        break;
      }
      case 'warning': {
        badge.style.background = 'rgba(251,191,36,0.2)';
        badge.style.color = '#fcd34d';
        break;
      }
      case 'info': {
        badge.style.background = 'rgba(59,130,246,0.2)';
        badge.style.color = '#bfdbfe';
        break;
      }
      default: {
        badge.style.background = 'rgba(34,197,94,0.18)';
        badge.style.color = '#bbf7d0';
        break;
      }
    }
    badge.textContent = tag.label;
    ui.statusTags.append(badge);
  });
}

function updateFenDisplay(fen) {
  if (ui.fenOutput) {
    ui.fenOutput.value = fen;
  }
}

function highlightActiveMove() {
  if (!state.board || !state.toggles.highlights || !state.hasAnnotationsVisible) return;
  state.board.clearHighlights();
  const meta = state.moveMetadata[state.moveCursor - 1];
  if (!meta) return;
  const coordinate = state.board.sanToCoordinates(meta.san);
  if (!coordinate) return;
  const from = coordinate.slice(0, 2);
  const to = coordinate.slice(2, 4);
  state.board.addHighlight({
    square: from,
    type: 'circle',
    color: meta.color === 'white' ? 'rgba(139,92,246,0.55)' : 'rgba(59,130,246,0.55)',
  });
  state.board.addHighlight({
    square: to,
    type: 'circle',
    color: meta.color === 'white' ? 'rgba(16,185,129,0.55)' : 'rgba(96,165,250,0.55)',
  });
}

function loadPgnFromTextarea() {
  if (!state.board || !ui.pgnInput) return;
  const raw = ui.pgnInput.value.trim();
  if (!raw) {
    showToast('Paste a PGN to load analysis', 'error');
    return;
  }

  const success = state.board.loadPgnWithAnnotations(raw);
  if (!success) {
    showToast('Unable to parse PGN input', 'error');
    return;
  }

  state.initialFen = extractFenFromPgn(raw) ?? START_FEN;
  state.evaluations = extractEvaluationsFromPgn(raw);
  syncTimelineFromBoard();
  state.moveCursor = state.timeline.length - 1;
  refreshUI({ redrawMoveMap: true });
  updateFenDisplay(state.timeline[state.moveCursor]);
  highlightActiveMove();
  ui.syncStatus && (ui.syncStatus.textContent = 'PGN synced');
  showToast('PGN loaded successfully', 'success');
}

function extractFenFromPgn(pgn) {
  const fenMatch = pgn.match(/\[FEN "([^"]+)"\]/i);
  return fenMatch ? fenMatch[1] : null;
}

function extractEvaluationsFromPgn(pgn) {
  const matches = [...pgn.matchAll(/\[%eval ([^\]]+)\]/gi)];
  return matches.map((match) => parseEvaluationToken(match[1])).filter(Boolean);
}

function parseEvaluationToken(token) {
  if (!token) return null;
  const trimmed = token.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('#')) {
    const mateValue = Number.parseInt(trimmed.slice(1), 10);
    if (Number.isNaN(mateValue)) return null;
    return { mate: mateValue, value: null };
  }

  const numeric = Number.parseFloat(trimmed.replace(',', '.'));
  if (Number.isNaN(numeric)) return null;
  return { mate: null, value: numeric };
}

function resetBoardState() {
  if (!state.board) return;
  state.board.reset(true);
  state.initialFen = START_FEN;
  state.timeline = [START_FEN];
  state.moveMetadata = [];
  state.evaluations = [];
  state.moveCursor = 0;
  refreshUI({ redrawMoveMap: true });
  updateFenDisplay(START_FEN);
  highlightActiveMove();
  showToast('Board reset to starting position', 'success');
}

function showToast(message, tone = 'success') {
  if (!ui.toastRoot) return;
  const toast = document.createElement('div');
  toast.className = `toast ${tone === 'error' ? 'toast-error' : 'toast-success'}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;
  ui.toastRoot.append(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(16px)';
    setTimeout(() => toast.remove(), 320);
  }, 2600);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function debounce(fn, wait = 100) {
  let timer = null;
  return (...args) => {
    globalThis.clearTimeout(timer);
    timer = globalThis.setTimeout(() => fn(...args), wait);
  };
}

document.addEventListener('DOMContentLoaded', init);
