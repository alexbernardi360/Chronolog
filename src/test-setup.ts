// The unit-test builder's jsdom environment exposes no usable `localStorage`
// (Node's own experimental global shadows jsdom's and resolves to undefined),
// so the code under test would crash on any theme read. Install a per-worker
// in-memory Storage — unconditionally, because merely *reading*
// `globalThis.localStorage` to test for one trips Node's experimental warning.
const store = new Map<string, string>();

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    get length() {
      return store.size;
    },
    key: (index: number) => [...store.keys()][index] ?? null,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  } satisfies Storage,
});
