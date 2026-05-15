export function toHistoryListItems(progressState, limit = 10) {
  const history = Array.isArray(progressState?.history) ? progressState.history : [];
  return history.slice(0, limit).map((entry) => {
    const d = new Date(entry.date || Date.now());
    const date = `${d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;

    const task =
      typeof entry.task === 'string' && entry.task
        ? entry.task.length > 30
          ? `${entry.task.slice(0, 30)}…`
          : entry.task
        : '—';

    return {
      date,
      task,
      mode: entry.mode || 'unknown'
    };
  });
}
