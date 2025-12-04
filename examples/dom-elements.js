export const getElementById = (id) => document.querySelector(`#${id}`);

export const elements = {
  languageToggle: getElementById('language-toggle'),
  statusMessage: getElementById('pgnStatus'),
  boardContainer: getElementById('board'),
  pgnTextarea: getElementById('pgnInput'),
  loadButton: getElementById('loadPgn'),
  sampleButton: getElementById('loadSample'),
  resetButton: getElementById('resetBoard'),
  copyButton: getElementById('copyPgn'),
  flipButton: getElementById('flipBoard'),
  autoFlipToggle: getElementById('autoFlip'),
  evalBar: getElementById('evaluationBar'),
  evalFill: getElementById('evalFill'),
  evalScore: getElementById('evalScore'),
  evalTopLabel: getElementById('evalTopLabel'),
  evalBottomLabel: getElementById('evalBottomLabel'),
  evalSummaryPrimary: getElementById('evalSummaryPrimary'),
  evalSummarySecondary: getElementById('evalSummarySecondary'),
  orientationStatus: getElementById('orientationStatus'),
};
