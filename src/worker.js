let timerId = null;

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

self.onmessage = (event) => {
  const message = event.data;
  if (!message || typeof message.type !== 'string') {
    return;
  }

  if (message.type === 'START_TIMER') {
    const durationSec = Math.max(0, Number(message.payload?.durationSec) || 0);
    const startedAt = Date.now();

    stopTimer();

    timerId = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
      const remainingSec = Math.max(0, durationSec - elapsedSec);

      self.postMessage({
        type: 'WORKER_TIMER_TICK',
        payload: { remainingSec },
        meta: { source: 'worker', ts: Date.now() }
      });

      if (remainingSec === 0) {
        stopTimer();
        self.postMessage({
          type: 'WORKER_TIMER_DONE',
          payload: {},
          meta: { source: 'worker', ts: Date.now() }
        });
      }
    }, 250);

    return;
  }

  if (message.type === 'STOP_TIMER') {
    stopTimer();
  }
};
