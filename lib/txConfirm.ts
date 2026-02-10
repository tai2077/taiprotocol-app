export interface PollOptions {
  timeoutMs?: number;
  intervalMs?: number;
}

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_INTERVAL_MS = 3_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function pollUntil<T>(
  fetcher: () => Promise<T>,
  predicate: (value: T) => boolean,
  options: PollOptions = {}
): Promise<T | null> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const deadline = Date.now() + timeoutMs;

  let last: T | null = null;
  while (Date.now() < deadline) {
    try {
      const value = await fetcher();
      last = value;
      if (predicate(value)) return value;
    } catch {
      // ignore transient query errors and continue polling
    }
    await sleep(intervalMs);
  }
  return last;
}
