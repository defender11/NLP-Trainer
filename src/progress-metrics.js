import { createDefaultState } from './state-defaults.js';

function toDayKey(value) {
  const d = value instanceof Date ? new Date(value) : new Date(value || Date.now());
  return d.toDateString();
}

function toIso(value) {
  const d = value instanceof Date ? value : new Date(value || Date.now());
  return d.toISOString();
}

export function sanitizeProgressState(value) {
  const base = createDefaultState();
  if (!value || typeof value !== 'object') {
    return base;
  }

  return {
    streak: Number.isFinite(value.streak) ? Math.max(0, value.streak) : base.streak,
    bestStreak: Number.isFinite(value.bestStreak) ? Math.max(0, value.bestStreak) : base.bestStreak,
    total: Number.isFinite(value.total) ? Math.max(0, value.total) : base.total,
    lastDate: typeof value.lastDate === 'string' || value.lastDate === null ? value.lastDate : base.lastDate,
    anchorInstalled: Boolean(value.anchorInstalled),
    anchorStrength: typeof value.anchorStrength === 'string' ? value.anchorStrength : base.anchorStrength,
    lastTask: typeof value.lastTask === 'string' ? value.lastTask : base.lastTask,
    history: Array.isArray(value.history) ? value.history.slice(0, 100) : base.history,
    modeCount:
      value.modeCount && typeof value.modeCount === 'object'
        ? {
            install: Number.isFinite(value.modeCount.install) ? Math.max(0, value.modeCount.install) : 0,
            full: Number.isFinite(value.modeCount.full) ? Math.max(0, value.modeCount.full) : 0,
            quick: Number.isFinite(value.modeCount.quick) ? Math.max(0, value.modeCount.quick) : 0
          }
        : base.modeCount
  };
}

export function applySessionCompletion(progressState, { mode, task, anchorStrength, now = Date.now() }) {
  const next = sanitizeProgressState(progressState);
  const todayKey = toDayKey(now);

  if (next.lastDate !== todayKey) {
    if (next.lastDate) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      next.streak = next.lastDate === toDayKey(yesterday) ? next.streak + 1 : 1;
    } else {
      next.streak = 1;
    }

    next.lastDate = todayKey;
  }

  next.bestStreak = Math.max(next.bestStreak, next.streak);
  next.total += 1;

  if (mode && Object.prototype.hasOwnProperty.call(next.modeCount, mode)) {
    next.modeCount[mode] += 1;
  }

  next.lastTask = typeof task === 'string' ? task : next.lastTask;

  next.history.unshift({
    date: toIso(now),
    mode: mode || 'unknown',
    task: typeof task === 'string' && task.trim() ? task.trim() : null,
    anchorStrength: anchorStrength || null
  });

  if (next.history.length > 100) {
    next.history = next.history.slice(0, 100);
  }

  return next;
}
