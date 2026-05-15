export function createEvent(type, payload = {}, source = 'app') {
  return {
    type,
    payload,
    meta: {
      source,
      ts: Date.now()
    }
  };
}
