export function createSharedState(events, entries) {
  const map = new Map(entries || []);
  function get(key) {
    return map.get(key);
  }
  function set(key, value) {
    // State mutation emits generic and key-specific events.
    map.set(key, value);
    if (events && events.emit) {
      events.emit("state:changed", { key, value });
      events.emit("state:changed:" + String(key), { key, value });
    }
    return value;
  }
  function has(key) {
    return map.has(key);
  }
  function clear() {
    map.clear();
    if (events && events.emit) events.emit("state:cleared", {});
  }
  return { get, set, has, clear };
}
