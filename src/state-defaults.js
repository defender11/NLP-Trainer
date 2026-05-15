// Extracted from read-only focus-trainer.html default state shape.

const defaultState = {
  streak: 0,
  bestStreak: 0,
  total: 0,
  lastDate: null,
  anchorInstalled: false,
  anchorStrength: 'unknown',
  lastTask: '',
  history: [],
  modeCount: { install: 0, full: 0, quick: 0 }
};

export function createDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}
