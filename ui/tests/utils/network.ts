import { type Page } from '@playwright/test';

export interface NetworkCall {
  url: string;
  method: string;
  status: number;
  duration: number;
  ok: boolean;
}

/**
 * Attach a network listener that records API calls.
 * Returns a getter for the accumulated log.
 */
export function attachNetworkRecorder(page: Page) {
  const calls: NetworkCall[] = [];
  const startTimes = new Map<string, number>();

  page.on('request', req => {
    if (req.url().includes('/api/')) {
      startTimes.set(req.url(), Date.now());
    }
  });

  page.on('response', async res => {
    const url = res.url();
    if (!url.includes('/api/')) return;
    const start = startTimes.get(url) ?? Date.now();
    calls.push({
      url,
      method: res.request().method(),
      status: res.status(),
      duration: Date.now() - start,
      ok: res.ok(),
    });
  });

  return {
    getCalls: () => [...calls],
    getCallsFor: (path: string) => calls.filter(c => c.url.includes(path)),
    reset: () => { calls.length = 0; },
  };
}

/** Find a call matching the given path suffix, returns undefined if not found */
export function findCall(calls: NetworkCall[], path: string): NetworkCall | undefined {
  return calls.find(c => c.url.includes(path));
}
