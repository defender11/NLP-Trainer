import { createEvent } from './events.js';

const SIMPLE_BREATH_PHASE_SEC = 5;
const BREATH_PHASES = [
  { label: 'Вдох через нос', sec: 4 },
  { label: 'Задержка', sec: 7 },
  { label: 'Выдох через рот', sec: 8 }
];

function getTimerConfig(step) {
  if (!step || typeof step !== 'object') {
    return null;
  }

  if (step.pomodoro) {
    return {
      kind: 'pomodoro',
      durationSec: step.short ? 15 * 60 : 25 * 60,
      label: step.short ? 'Pomodoro 15 минут' : 'Pomodoro 25 минут'
    };
  }

  if (step.type === 'breath') {
    return {
      kind: 'breath',
      cycles: Math.max(1, Number(step.cycles) || 1),
      label: 'Дыхательный цикл 4-7-8'
    };
  }

  if (
    step.type === 'timer' ||
    step.type === 'anchor' ||
    step.type === 'exit-anchor' ||
    step.type === 'peak' ||
    step.type === 'simplebreath'
  ) {
    return {
      kind: step.type,
      durationSec: Math.max(1, Number(step.sec) || 1),
      label: `Таймер ${Math.max(1, Number(step.sec) || 1)} сек`
    };
  }

  return null;
}

export function createStepTimerEngine({ emit }) {
  let intervalId = null;
  let activeTimer = null;

  function clear() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    activeTimer = null;
  }

  function finish(kind) {
    clear();
    emit(createEvent('STEP_TIMER_DONE', { kind }, 'timers'));
  }

  function startCountdown(config) {
    const startedAt = Date.now();
    const totalSec = config.durationSec;

    activeTimer = {
      kind: config.kind,
      totalSec,
      label: config.label
    };

    emit(
      createEvent(
        'STEP_TIMER_STARTED',
        {
          kind: config.kind,
          totalSec,
          label: config.label
        },
        'timers'
      )
    );

    function tick() {
      const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
      const remainingSec = Math.max(0, totalSec - elapsedSec);
      const phase =
        config.kind === 'simplebreath'
          ? Math.floor(elapsedSec / SIMPLE_BREATH_PHASE_SEC) % 2 === 0
            ? 'Вдох носом'
            : 'Выдох ртом'
          : null;

      emit(
        createEvent(
          'STEP_TIMER_TICK',
          {
            kind: config.kind,
            remainingSec,
            totalSec,
            phase,
            label: config.label
          },
          'timers'
        )
      );

      if (remainingSec === 0) {
        finish(config.kind);
      }
    }

    intervalId = setInterval(tick, 250);
    tick();
  }

  function startBreath(config) {
    let cycle = 0;
    let phaseIndex = 0;
    let phaseRemainingSec = BREATH_PHASES[0].sec;

    activeTimer = {
      kind: config.kind,
      cycles: config.cycles,
      label: config.label
    };

    emit(
      createEvent(
        'STEP_TIMER_STARTED',
        {
          kind: config.kind,
          cycles: config.cycles,
          label: config.label
        },
        'timers'
      )
    );

    function tick() {
      const phase = BREATH_PHASES[phaseIndex];

      emit(
        createEvent(
          'STEP_TIMER_TICK',
          {
            kind: 'breath',
            cycle,
            cycles: config.cycles,
            phase: phase.label,
            remainingSec: phaseRemainingSec,
            totalSec: phase.sec,
            label: config.label
          },
          'timers'
        )
      );

      phaseRemainingSec -= 1;

      if (phaseRemainingSec >= 0) {
        return;
      }

      phaseIndex += 1;
      if (phaseIndex >= BREATH_PHASES.length) {
        phaseIndex = 0;
        cycle += 1;

        if (cycle >= config.cycles) {
          finish('breath');
          return;
        }
      }

      phaseRemainingSec = BREATH_PHASES[phaseIndex].sec;
    }

    intervalId = setInterval(tick, 1000);
    tick();
  }

  function startForStep(step) {
    clear();

    const config = getTimerConfig(step);
    if (!config) {
      return null;
    }

    if (config.kind === 'breath') {
      startBreath(config);
      return config;
    }

    startCountdown(config);
    return config;
  }

  function skip() {
    if (!activeTimer) {
      return;
    }

    const kind = activeTimer.kind;
    clear();
    emit(createEvent('STEP_TIMER_SKIPPED', { kind }, 'timers'));
  }

  return {
    startForStep,
    skip,
    stop: clear,
    isRunning() {
      return Boolean(activeTimer);
    }
  };
}
