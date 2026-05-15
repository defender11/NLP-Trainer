const NEXT_KEYS = new Set([' ', 'Enter', 'ArrowRight', 'n', 'N', 'т', 'Т']);
const SKIP_KEYS = new Set(['s', 'S', 'ы', 'Ы']);

function isEditableTarget(target) {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return !!target.closest('input, textarea, select, [contenteditable="true"]');
}

function shouldIgnoreEvent(event) {
  if (event.defaultPrevented) {
    return true;
  }

  if (event.metaKey || event.ctrlKey || event.altKey) {
    return true;
  }

  return isEditableTarget(event.target);
}

export function setupKeyboard(onIntent) {
  function onKeyDown(event) {
    if (shouldIgnoreEvent(event)) {
      return;
    }

    if (NEXT_KEYS.has(event.key)) {
      event.preventDefault();
      onIntent({ type: 'INTENT_NEXT_STEP' });
      return;
    }

    if (SKIP_KEYS.has(event.key)) {
      event.preventDefault();
      onIntent({ type: 'INTENT_SKIP_TIMER' });
    }
  }

  window.addEventListener('keydown', onKeyDown);

  return () => {
    window.removeEventListener('keydown', onKeyDown);
  };
}
