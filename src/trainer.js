import { createEvent } from './events.js';

function normalizeFlow(flow) {
  if (!Array.isArray(flow)) {
    return [];
  }

  return flow.filter((step) => step && typeof step === 'object');
}

function pickFlow(registry, flowKey) {
  if (!registry || typeof registry !== 'object') {
    return null;
  }

  return registry[flowKey] || null;
}

function createSnapshot(state) {
  const step = state.activeFlow[state.currentStepIndex] || null;

  return {
    status: state.status,
    flowKey: state.activeFlowKey,
    flowTitle: state.activeFlowMeta?.title || '',
    currentStepIndex: state.currentStepIndex,
    totalSteps: state.activeFlow.length,
    step
  };
}

export function createTrainer({ flowRegistry, initialFlowKey, emit }) {
  const initialMeta = pickFlow(flowRegistry, initialFlowKey) || Object.values(flowRegistry || {})[0] || null;
  const initialFlow = normalizeFlow(initialMeta?.steps || []);

  const state = {
    activeFlowKey: initialMeta?.key || '',
    activeFlowMeta: initialMeta,
    activeFlow: initialFlow,
    status: 'idle',
    currentStepIndex: -1,
    transitionLocked: false
  };

  function publishState(eventType = 'TRAINER_STATE_CHANGED') {
    emit(createEvent(eventType, createSnapshot(state), 'trainer'));
  }

  function withTransitionLock(action) {
    if (state.transitionLocked) {
      emit(createEvent('TRAINER_TRANSITION_SKIPPED', { reason: 'transition_locked' }, 'trainer'));
      return;
    }

    state.transitionLocked = true;

    try {
      action();
    } catch (error) {
      state.status = 'error';
      emit(
        createEvent(
          'TRAINER_ERROR',
          {
            message: error instanceof Error ? error.message : String(error)
          },
          'trainer'
        )
      );
    } finally {
      state.transitionLocked = false;
      publishState();
    }
  }

  function dispatch(commandType, payload = {}) {
    withTransitionLock(() => {
      if (commandType === 'START') {
        if (state.status === 'running') {
          emit(createEvent('TRAINER_TRANSITION_SKIPPED', { reason: 'session_already_running' }, 'trainer'));
          return;
        }

        if (state.activeFlow.length === 0) {
          state.status = 'error';
          emit(createEvent('TRAINER_ERROR', { message: 'Flow is empty' }, 'trainer'));
          return;
        }

        state.status = 'running';
        state.currentStepIndex = 0;
        publishState('TRAINER_STEP_CHANGED');
        return;
      }

      if (commandType === 'NEXT') {
        if (state.status !== 'running') {
          emit(
            createEvent('TRAINER_TRANSITION_SKIPPED', { reason: 'next_while_not_running', status: state.status }, 'trainer')
          );
          return;
        }

        const nextIndex = state.currentStepIndex + 1;
        if (nextIndex >= state.activeFlow.length) {
          state.status = 'completed';
          publishState('TRAINER_COMPLETED');
          return;
        }

        state.currentStepIndex = nextIndex;
        publishState('TRAINER_STEP_CHANGED');
        return;
      }

      if (commandType === 'RESET') {
        state.status = 'idle';
        state.currentStepIndex = -1;
        return;
      }

      if (commandType === 'SELECT_FLOW') {
        if (state.status === 'running') {
          emit(createEvent('TRAINER_TRANSITION_SKIPPED', { reason: 'cannot_change_flow_while_running' }, 'trainer'));
          return;
        }

        const nextFlowKey = payload.flowKey;
        const nextMeta = pickFlow(flowRegistry, nextFlowKey);
        if (!nextMeta) {
          emit(createEvent('TRAINER_TRANSITION_SKIPPED', { reason: 'unknown_flow_key', flowKey: nextFlowKey }, 'trainer'));
          return;
        }

        state.activeFlowKey = nextMeta.key;
        state.activeFlowMeta = nextMeta;
        state.activeFlow = normalizeFlow(nextMeta.steps);
        state.currentStepIndex = -1;
        state.status = 'idle';
        publishState('TRAINER_FLOW_SELECTED');
        return;
      }

      emit(createEvent('TRAINER_TRANSITION_SKIPPED', { reason: 'unknown_command', commandType }, 'trainer'));
    });
  }

  return {
    dispatch,
    getSnapshot() {
      return createSnapshot(state);
    }
  };
}
