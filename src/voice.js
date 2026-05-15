import { createEvent } from './events.js';

export function createVoiceEngine({ emit, defaultTimeoutMs = 12000 }) {
  const hasSpeechApi = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const synth = hasSpeechApi ? window.speechSynthesis : null;

  let silentMode = !hasSpeechApi;
  let activeTimerId = null;

  function clearActiveTimer() {
    if (activeTimerId) {
      clearTimeout(activeTimerId);
      activeTimerId = null;
    }
  }

  function setSilentMode(value, reason = 'manual') {
    silentMode = Boolean(value);
    emit(createEvent('VOICE_MODE_CHANGED', { silentMode, reason }, 'voice'));
  }

  function stop() {
    clearActiveTimer();

    if (synth) {
      synth.cancel();
    }
  }

  function speak(text, options = {}) {
    if (silentMode || !synth || typeof SpeechSynthesisUtterance === 'undefined') {
      emit(createEvent('VOICE_UNAVAILABLE', { silentMode }, 'voice'));
      return Promise.resolve({ ok: true, mode: 'silent' });
    }

    return new Promise((resolve) => {
      const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
      const utterance = new SpeechSynthesisUtterance(text);
      let settled = false;

      function settle(payload) {
        if (settled) {
          return;
        }

        settled = true;
        clearActiveTimer();
        resolve(payload);
      }

      utterance.onend = () => {
        emit(createEvent('VOICE_DONE', {}, 'voice'));
        settle({ ok: true, mode: 'voice' });
      };

      utterance.onerror = (event) => {
        emit(createEvent('VOICE_ERROR', { error: event.error || 'unknown' }, 'voice'));
        setSilentMode(true, 'voice_error');
        settle({ ok: false, mode: 'silent', reason: 'error' });
      };

      activeTimerId = setTimeout(() => {
        emit(createEvent('VOICE_TIMEOUT', { timeoutMs }, 'voice'));
        setSilentMode(true, 'voice_timeout');

        if (synth.speaking) {
          synth.cancel();
        }

        settle({ ok: false, mode: 'silent', reason: 'timeout' });
      }, timeoutMs);

      try {
        if (synth.speaking) {
          synth.cancel();
        }

        synth.speak(utterance);
      } catch (error) {
        emit(
          createEvent(
            'VOICE_ERROR',
            { error: error instanceof Error ? error.message : String(error) },
            'voice'
          )
        );
        setSilentMode(true, 'voice_exception');
        settle({ ok: false, mode: 'silent', reason: 'exception' });
      }
    });
  }

  return {
    speak,
    stop,
    setSilentMode,
    getStatus() {
      return {
        silentMode,
        hasSpeechApi
      };
    }
  };
}
