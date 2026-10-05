type Listener = (p: number) => void;
const listeners = new Set<Listener>();
let current = 0;

export const energyProgress = {
  get: (): number => current,
  set(p: number): void {
    if (p === current) return;
    current = p;
    listeners.forEach((fn) => fn(p));
  },
  /** immediately calls fn with the current value, returns unsubscribe */
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    fn(current);
    return () => {
      listeners.delete(fn);
    };
  },
};

if (import.meta.env.DEV) {
  (window as unknown as { __energy: typeof energyProgress }).__energy = energyProgress;
}
