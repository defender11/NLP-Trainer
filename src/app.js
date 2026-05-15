import { createEvent } from './events.js';
import { createTrainer } from './trainer.js';
import { createVoiceEngine } from './voice.js';
import { createUi } from './ui.js';
import { setupKeyboard } from './keyboard.js';
import { loadState, saveState } from './storage.js';
import { createStepView } from './step-descriptor.js';
import { defaultFlowKey, flowRegistry, getFlowMetaList } from './flow-registry.js';
import { createStepTimerEngine } from './timers.js';
import { applySessionCompletion, sanitizeProgressState } from './progress-metrics.js';

function formatTimerStatus(payload) {
  if (!payload) {
    return '';
  }

  if (payload.kind === 'breath') {
    const cycle = Number.isFinite(payload.cycle) ? payload.cycle + 1 : 1;
    return `${payload.phase || 'Дыхание'} · цикл ${cycle}/${payload.cycles || 1} · ${payload.remainingSec ?? 0}с`;
  }

  const phasePart = payload.phase ? `${payload.phase} · ` : '';
  return `${phasePart}${payload.remainingSec ?? 0}с`;
}

function createViewModel({ trainerSnapshot, appState }) {
  const stepView = createStepView(trainerSnapshot.step);
  const isRunning = trainerSnapshot.status === 'running';

  let statusText = 'Готово к запуску';
  if (isRunning) {
    statusText = `${trainerSnapshot.flowTitle}: шаг ${trainerSnapshot.currentStepIndex + 1} из ${trainerSnapshot.totalSteps}`;
  } else if (trainerSnapshot.status === 'completed') {
    statusText = `${trainerSnapshot.flowTitle}: сессия завершена`;
  } else if (trainerSnapshot.status === 'error') {
    statusText = 'Ошибка сценария. Перезапустите сессию';
  }

  const modeOptions = getFlowMetaList().map((flowMeta) => ({
    key: flowMeta.key,
    title: flowMeta.title,
    description: flowMeta.description,
    selected: flowMeta.key === trainerSnapshot.flowKey,
    disabled: isRunning
  }));

  return {
    statusText,
    stepTitle: stepView.title,
    stepDescription: stepView.description,
    stepExtraHint: stepView.extraHint,
    timerStatusText: appState.timerState.text,
    nextDisabled: trainerSnapshot.status !== 'running' || appState.isTransitionLocked,
    nextButtonText: stepView.nextLabel,
    startDisabled: trainerSnapshot.status === 'running',
    showSkipTimerButton: appState.timerState.running,
    voiceEnabled: appState.voiceEnabled,
    voiceButtonText: appState.voiceEnabled ? 'Voice: On' : 'Voice: Off',
    modeOptions,
    showTaskInput: stepView.requiresInput && isRunning,
    taskInputPlaceholder: stepView.inputPlaceholder,
    taskInputValue: appState.taskDraft,
    validationText: appState.validationText
  };
}

function initApp() {
  const appState = {
    voiceEnabled: true,
    isTransitionLocked: false,
    hasBufferedNextIntent: false,
    voiceGateId: 0,
    activeVoiceGateId: null,
    lockReasons: new Set(),
    timerState: {
      running: false,
      text: ''
    },
    taskDraft: '',
    validationText: '',
    progressState: sanitizeProgressState(null)
  };

  const persisted = loadState() || {};
  if (typeof persisted.voiceEnabled === 'boolean') {
    appState.voiceEnabled = persisted.voiceEnabled;
  }

  if (typeof persisted.taskDraft === 'string') {
    appState.taskDraft = persisted.taskDraft;
  }

  appState.progressState = sanitizeProgressState(persisted.progressState);

  const initialFlowKey = typeof persisted.flowKey === 'string' ? persisted.flowKey : defaultFlowKey;

  function emit(event) {
    handleEvent(event);
  }

  const trainer = createTrainer({
    flowRegistry,
    initialFlowKey,
    emit
  });

  const voice = createVoiceEngine({ emit });
  const stepTimers = createStepTimerEngine({ emit });
  const ui = createUi({ onIntent: handleIntent });
  setupKeyboard(handleIntent);

  voice.setSilentMode(!appState.voiceEnabled, 'restore_state');

  function persistAppState(trainerSnapshot = trainer.getSnapshot()) {
    saveState({
      voiceEnabled: appState.voiceEnabled,
      flowKey: trainerSnapshot.flowKey,
      taskDraft: appState.taskDraft,
      progressState: appState.progressState
    });
  }

  function refreshLocks() {
    appState.isTransitionLocked = appState.lockReasons.size > 0;
  }

  function setLock(reason, active) {
    if (active) {
      appState.lockReasons.add(reason);
    } else {
      appState.lockReasons.delete(reason);
    }

    refreshLocks();
    rerender();

    if (!appState.isTransitionLocked && appState.hasBufferedNextIntent) {
      appState.hasBufferedNextIntent = false;
      trainer.dispatch('NEXT');
    }
  }

  function resetTimerState() {
    appState.timerState.running = false;
    appState.timerState.text = '';
    stepTimers.stop();
    setLock('step_timer', false);
  }

  function announceStepIfNeeded(trainerSnapshot) {
    const step = trainerSnapshot.step;
    if (!step || !appState.voiceEnabled) {
      return;
    }

    const gateId = ++appState.voiceGateId;
    appState.activeVoiceGateId = gateId;
    setLock('voice', true);
    voice.speak(step.voice || step.title || '').finally(() => {
      if (appState.activeVoiceGateId !== gateId) {
        return;
      }

      appState.activeVoiceGateId = null;
      setLock('voice', false);
    });
  }

  function stopVoiceGate() {
    appState.activeVoiceGateId = null;
    appState.voiceGateId += 1;
    voice.stop();
    setLock('voice', false);
  }

  function startStepTimerIfNeeded(step) {
    const stepView = createStepView(step);
    if (!stepView.requiresTimer) {
      return;
    }

    const timerConfig = stepTimers.startForStep(step);
    if (!timerConfig) {
      return;
    }

    appState.timerState.running = true;
    appState.timerState.text = timerConfig.label;
    setLock('step_timer', true);
  }

  function validateCurrentStepBeforeNext() {
    const snapshot = trainer.getSnapshot();
    const stepView = createStepView(snapshot.step);

    if (!stepView.requiresInput) {
      appState.validationText = '';
      return true;
    }

    if (appState.taskDraft.trim()) {
      appState.validationText = '';
      return true;
    }

    appState.validationText = 'Нужно указать задачу перед переходом дальше.';
    return false;
  }

  function rerender() {
    ui.render(
      createViewModel({
        trainerSnapshot: trainer.getSnapshot(),
        appState
      })
    );
  }

  function handleIntent(intent) {
    if (!intent || typeof intent.type !== 'string') {
      return;
    }

    emit(createEvent(intent.type, intent.payload || {}, 'ui'));

    if (intent.type === 'INTENT_SELECT_FLOW') {
      trainer.dispatch('SELECT_FLOW', {
        flowKey: intent.payload?.flowKey
      });
      appState.validationText = '';
      persistAppState();
      rerender();
      return;
    }

    if (intent.type === 'INTENT_UPDATE_TASK_TEXT') {
      appState.taskDraft = typeof intent.payload?.text === 'string' ? intent.payload.text : '';
      if (appState.taskDraft.trim()) {
        appState.validationText = '';
      }
      persistAppState();
      rerender();
      return;
    }

    if (intent.type === 'INTENT_START_SESSION') {
      appState.validationText = '';
      trainer.dispatch('START');
      rerender();
      return;
    }

    if (intent.type === 'INTENT_SKIP_TIMER') {
      stepTimers.skip();
      return;
    }

    if (intent.type === 'INTENT_NEXT_STEP') {
      if (appState.isTransitionLocked) {
        appState.hasBufferedNextIntent = true;
        return;
      }

      if (!validateCurrentStepBeforeNext()) {
        rerender();
        return;
      }

      trainer.dispatch('NEXT');
      rerender();
      return;
    }

    if (intent.type === 'INTENT_TOGGLE_VOICE') {
      appState.voiceEnabled = !appState.voiceEnabled;
      stopVoiceGate();
      voice.setSilentMode(!appState.voiceEnabled, 'intent_toggle');
      persistAppState();
      rerender();
    }
  }

  function handleEvent(event) {
    if (!event || typeof event.type !== 'string') {
      return;
    }

    if (event.type === 'TRAINER_STEP_CHANGED') {
      appState.validationText = '';
      resetTimerState();
      rerender();
      startStepTimerIfNeeded(trainer.getSnapshot().step);
      announceStepIfNeeded(trainer.getSnapshot());
      persistAppState();
      return;
    }

    if (event.type === 'TRAINER_COMPLETED') {
      const snapshot = trainer.getSnapshot();
      appState.progressState = applySessionCompletion(appState.progressState, {
        mode: snapshot.flowKey,
        task: appState.taskDraft,
        anchorStrength: appState.progressState.anchorStrength
      });
      resetTimerState();
      rerender();
      persistAppState();
      return;
    }

    if (event.type === 'TRAINER_FLOW_SELECTED') {
      resetTimerState();
      rerender();
      persistAppState();
      return;
    }

    if (event.type === 'TRAINER_STATE_CHANGED') {
      rerender();
      persistAppState();
      return;
    }

    if (event.type === 'STEP_TIMER_STARTED') {
      appState.timerState.running = true;
      appState.timerState.text = event.payload?.label || 'Таймер запущен';
      setLock('step_timer', true);
      return;
    }

    if (event.type === 'STEP_TIMER_TICK') {
      appState.timerState.running = true;
      appState.timerState.text = formatTimerStatus(event.payload);
      rerender();
      return;
    }

    if (event.type === 'STEP_TIMER_DONE') {
      appState.timerState.running = false;
      appState.timerState.text = 'Таймер завершен';
      setLock('step_timer', false);
      return;
    }

    if (event.type === 'STEP_TIMER_SKIPPED') {
      appState.timerState.running = false;
      appState.timerState.text = 'Таймер пропущен';
      setLock('step_timer', false);
      return;
    }

    if (event.type === 'VOICE_UNAVAILABLE' || event.type === 'VOICE_ERROR' || event.type === 'VOICE_TIMEOUT') {
      appState.voiceEnabled = false;
      appState.activeVoiceGateId = null;
      appState.voiceGateId += 1;
      voice.setSilentMode(true, 'fallback');
      persistAppState();
      setLock('voice', false);
      return;
    }
  }

  rerender();
}

initApp();
