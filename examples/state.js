export const statusState = {
  key: null,
  replacements: undefined,
  type: 'info',
};

export const state = {
  evaluationsByPly: {},
  fenToPlyMap: {},
  currentPly: 0,
  currentEvaluation: undefined,
  orientation: 'white',
  autoFlip: true,
  statusState,
};
