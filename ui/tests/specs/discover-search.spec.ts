/**
 * Test 2 — Re-search on Discover
 *
 * Reset to Home, fill topic + category, go to Discover.
 * Once 6 images load, type a different query and Search.
 * Verify a fresh set of 6 images loads.
 */

import { test, expect } from '../fixtures';
import { PerfCollector } from '../utils/perf';
import { findCall } from '../utils/network';
import * as path from 'path';

const TOPIC = 'Eid Mubarak';
const CATEGORY = 'Islamic Occasions';
const SECOND_QUERY = 'Ramadan lantern';

test.describe('Re-search on Discover', () => {
  test('loads fresh images after re-searching on Discover screen', async ({
    page,
    homePage,
    discoverPage,
    networkCalls,
    cleanSession,
  }, testInfo) => {
    const perf = new PerfCollector(
      testInfo.outputPath('perf') || path.join(process.cwd(), 'test-results')
    );

    // ── HOME → DISCOVER ─────────────────────────────────────────
    await perf.measure('goto:/', () => homePage.goto());
    await homePage.enterTopic(TOPIC);
    await homePage.selectCategory(CATEGORY);
    await homePage.beginCreating();

    await page.screenshot({ path: testInfo.outputPath('discover-initial-load.png'), fullPage: false });

    // Wait for initial 6 images
    await perf.measure('discover:waitForInitialImages', () =>
      discoverPage.waitForImages(20_000)
    );

    const initialUrls = await discoverPage.getImageUrls();
    expect(initialUrls.length).toBeGreaterThanOrEqual(6);
    console.log(`Initial images loaded: ${initialUrls.length}`);

    const firstSearchCall = findCall(networkCalls.getCalls(), '/api/search');
    if (firstSearchCall) {
      console.log(`Initial /api/search → ${firstSearchCall.status} (${firstSearchCall.duration}ms)`);
      expect(firstSearchCall.status).toBe(200);
    }

    await page.screenshot({ path: testInfo.outputPath('discover-before-search.png'), fullPage: false });
    testInfo.attach('screenshot-discover-before-search', {
      path: testInfo.outputPath('discover-before-search.png'),
      contentType: 'image/png',
    });

    // ── RE-SEARCH ───────────────────────────────────────────────
    await perf.measure('discover:searchFor', () =>
      discoverPage.searchFor(SECOND_QUERY)
    );

    // Wait for fresh images
    await perf.measure('discover:waitForFreshImages', () =>
      discoverPage.waitForImages(20_000)
    );

    const freshUrls = await discoverPage.getImageUrls();
    expect(freshUrls.length).toBeGreaterThanOrEqual(6);
    console.log(`Fresh images after re-search: ${freshUrls.length}`);

    // Verify /api/search was called again
    const allSearchCalls = networkCalls.getCallsFor('/api/search');
    console.log(`Total /api/search calls: ${allSearchCalls.length}`);
    expect(allSearchCalls.length).toBeGreaterThanOrEqual(2);

    const secondSearchCall = allSearchCalls[allSearchCalls.length - 1];
    if (secondSearchCall) {
      console.log(`Re-search /api/search → ${secondSearchCall.status} (${secondSearchCall.duration}ms)`);
      expect(secondSearchCall.status).toBe(200);
    }

    await page.screenshot({ path: testInfo.outputPath('discover-after-search.png'), fullPage: false });
    testInfo.attach('screenshot-discover-after-search', {
      path: testInfo.outputPath('discover-after-search.png'),
      contentType: 'image/png',
    });

    // ── NETWORK SUMMARY ─────────────────────────────────────────
    const allCalls = networkCalls.getCalls();
    console.log('\n--- Network log ---');
    for (const call of allCalls) {
      const flag = call.ok ? '  OK' : ' ERR';
      console.log(`${flag} ${call.method} ${call.url} → ${call.status} (${call.duration}ms)`);
    }

    // ── PERF FLUSH ──────────────────────────────────────────────
    perf.flush();
    const warnings = perf.warnings();
    if (warnings.length > 0) {
      console.warn('\n--- Perf warnings ---');
      warnings.forEach(w => console.warn(w));
    }
  });
});
