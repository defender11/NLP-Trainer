const STORAGE_KEY = 'focus_trainer_state';
const SCHEMA_VERSION = 1;

function isValidStateShape(value) {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (value.schema_version !== SCHEMA_VERSION) {
    return false;
  }

  if (typeof value.saved_at !== 'string') {
    return false;
  }

  return !!value.data && typeof value.data === 'object';
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!isValidStateShape(parsed)) {
      return null;
    }

    return parsed.data;
  } catch (_error) {
    return null;
  }
}

export function saveState(data) {
  const payload = {
    schema_version: SCHEMA_VERSION,
    saved_at: new Date().toISOString(),
    data
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
