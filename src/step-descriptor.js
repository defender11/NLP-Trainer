function getStepKind(step) {
  if (!step || typeof step !== 'object') {
    return 'unknown';
  }

  if (step.test) {
    return 'test';
  }

  if (step.pomodoro) {
    return 'pomodoro';
  }

  return step.type || 'content';
}

function createTypeHint(kind, step) {
  if (kind === 'input') {
    return 'Введи одну конкретную задачу и переходи дальше.';
  }

  if (kind === 'timer' || kind === 'anchor' || kind === 'exit-anchor' || kind === 'peak' || kind === 'simplebreath') {
    return `Таймерный шаг: ${step.sec || 0} сек.`;
  }

  if (kind === 'breath') {
    return `Циклов дыхания: ${step.cycles || 0}.`;
  }

  if (kind === 'pomodoro') {
    return step.short ? 'Pomodoro на 15 минут.' : 'Pomodoro на 25 минут.';
  }

  if (kind === 'test') {
    return 'Тест якоря после установки.';
  }

  return '';
}

export function createStepView(step) {
  if (!step) {
    return {
      kind: 'empty',
      title: 'Шаг не запущен',
      description: 'Нажмите Start или Space/Enter',
      extraHint: '',
      nextLabel: 'Next',
      requiresInput: false,
      inputPlaceholder: '',
      requiresTimer: false
    };
  }

  const kind = getStepKind(step);
  const requiresTimer =
    kind === 'timer' ||
    kind === 'anchor' ||
    kind === 'exit-anchor' ||
    kind === 'peak' ||
    kind === 'simplebreath' ||
    kind === 'breath' ||
    kind === 'pomodoro';

  return {
    kind,
    title: step.title || 'Служебный шаг',
    description: step.desc || step.voice || 'Следуй инструкции шага.',
    extraHint: createTypeHint(kind, step),
    nextLabel: step.btn ? `${step.btn} →` : 'Далее →',
    requiresInput: kind === 'input',
    inputPlaceholder:
      kind === 'input' ? 'Например: починить фильтр evlsprt в other.xml' : '',
    requiresTimer
  };
}
