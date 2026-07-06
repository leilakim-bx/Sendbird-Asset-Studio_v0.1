/**
 * Vitest setup for the `node` test environment.
 *
 * Node 26 exposes a `localStorage` global that is *defined but undefined*
 * unless the process is started with `--localstorage-file`. zustand's
 * `createJSONStorage(() => localStorage)` then wraps `undefined` and the first
 * persisted `setState` crashes on `.setItem`. (On older Node the bare
 * `localStorage` reference threw, which zustand caught and treated as
 * "no storage".)
 *
 * Give tests a real in-memory Storage so persist behaves like a browser.
 */

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

if (globalThis.localStorage == null || typeof globalThis.localStorage.setItem !== "function") {
  Object.defineProperty(globalThis, "localStorage", {
    value: new MemoryStorage(),
    writable: true,
    configurable: true,
  });
}
