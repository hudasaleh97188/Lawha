import { type Page, type TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export interface PerfEntry {
  label: string;
  duration: number;
  timestamp: number;
}

const SLOW_NAV_THRESHOLD = 3000;
const SLOW_ACTION_THRESHOLD = 1000;

export class PerfCollector {
  private entries: PerfEntry[] = [];
  private outputPath: string;

  constructor(outputDir: string) {
    this.outputPath = path.join(outputDir, 'perf.json');
    // Load existing entries if any
    if (fs.existsSync(this.outputPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(this.outputPath, 'utf8'));
        this.entries = existing;
      } catch {
        this.entries = [];
      }
    }
  }

  record(label: string, duration: number) {
    this.entries.push({ label, duration, timestamp: Date.now() });
  }

  async measureNav(page: Page, url: string, label?: string): Promise<number> {
    const t0 = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const dur = Date.now() - t0;
    this.record(label || `goto:${url}`, dur);
    return dur;
  }

  async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const t0 = Date.now();
    const result = await fn();
    this.record(label, Date.now() - t0);
    return result;
  }

  getSlowNavs(): PerfEntry[] {
    return this.entries
      .filter(e => e.label.startsWith('goto:') && e.duration > SLOW_NAV_THRESHOLD)
      .sort((a, b) => b.duration - a.duration);
  }

  getSlowActions(): PerfEntry[] {
    return this.entries
      .filter(e => !e.label.startsWith('goto:') && e.duration > SLOW_ACTION_THRESHOLD)
      .sort((a, b) => b.duration - a.duration);
  }

  getSlowest(n = 10): PerfEntry[] {
    return [...this.entries].sort((a, b) => b.duration - a.duration).slice(0, n);
  }

  flush() {
    const dir = path.dirname(this.outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.outputPath, JSON.stringify(this.entries, null, 2));
  }

  warnings(): string[] {
    const warns: string[] = [];
    for (const e of this.entries) {
      if (e.label.startsWith('goto:') && e.duration > SLOW_NAV_THRESHOLD) {
        warns.push(`Slow navigation "${e.label}": ${e.duration}ms (threshold ${SLOW_NAV_THRESHOLD}ms)`);
      } else if (!e.label.startsWith('goto:') && e.duration > SLOW_ACTION_THRESHOLD) {
        warns.push(`Slow action "${e.label}": ${e.duration}ms (threshold ${SLOW_ACTION_THRESHOLD}ms)`);
      }
    }
    return warns;
  }
}
