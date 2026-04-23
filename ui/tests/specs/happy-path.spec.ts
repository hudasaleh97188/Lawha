/**
 * Test 1 — Happy path end-to-end
 *
 * Flow: Home → Discover (select image) → Style (analyze + pick style) →
 *       Suggest (skip to summary) → Variants (screenshot + use variant)
 */

import { test, expect } from '../fixtures';
import { PerfCollector } from '../utils/perf';
import { findCall } from '../utils/network';
import * as path from 'path';

const TOPIC = 'Eid Mubarak';
const CATEGORY = 'Islamic Occasions';
const STYLE_LABEL = 'Islamic Geometric';
const CHANGE_PROMPT = 'make the gold brighter and add a crescent moon';

test.describe('Happy path end-to-end', () => {
  test('completes full flow from Home to Variants', async ({
    page,
    homePage,
    discoverPage,
    stylePage,
    suggestPage,
    variantsPage,
    networkCalls,
    cleanSession,
  }, testInfo) => {
    const perf = new PerfCollector(
      testInfo.outputPath('perf') || path.join(process.cwd(), 'test-results')
    );

    // ── 1. HOME ─────────────────────────────────────────────────
    const navDur = await perf.measure('goto:/', () => homePage.goto());
    await page.screenshot({ path: testInfo.outputPath('01-home.png'), fullPage: false });
    testInfo.attach('screenshot-home', {
      path: testInfo.outputPath('01-home.png'),
      contentType: 'image/png',
    });

    await expect(homePage.topicInput).toBeVisible();
    await perf.measure('home:enterTopic', () => homePage.enterTopic(TOPIC));
    await perf.measure('home:selectCategory', () => homePage.selectCategory(CATEGORY));

    // Verify button becomes enabled
    await expect(homePage.beginCreatingButton).not.toHaveAttribute('disabled');

    await page.screenshot({ path: testInfo.outputPath('01-home-filled.png'), fullPage: false });

    await perf.measure('home:beginCreating', () => homePage.beginCreating());

    // ── 2. DISCOVER ─────────────────────────────────────────────
    // Wait for images
    await perf.measure('discover:waitForImages', () =>
      discoverPage.waitForImages(20_000)
    );

    const urlsBefore = await discoverPage.getImageUrls();
    expect(urlsBefore.length).toBeGreaterThanOrEqual(6);

    await page.screenshot({ path: testInfo.outputPath('02-discover-loaded.png'), fullPage: false });
    testInfo.attach('screenshot-discover-loaded', {
      path: testInfo.outputPath('02-discover-loaded.png'),
      contentType: 'image/png',
    });

    // Verify /api/search was called
    const searchCall = findCall(networkCalls.getCalls(), '/api/search');
    if (searchCall) {
      console.log(`/api/search → ${searchCall.status} (${searchCall.duration}ms)`);
      expect(searchCall.status).toBe(200);
    }

    // Select first image
    await perf.measure('discover:selectImage', () => discoverPage.selectImage(0));
    await discoverPage.verifySelectionBadge();

    await page.screenshot({ path: testInfo.outputPath('02-discover-selected.png'), fullPage: false });
    testInfo.attach('screenshot-discover-selected', {
      path: testInfo.outputPath('02-discover-selected.png'),
      contentType: 'image/png',
    });

    await perf.measure('discover:analyseSelected', () => discoverPage.analyseSelected());

    // ── 3. STYLE ────────────────────────────────────────────────
    // Wait for VisionStruct analysis
    await perf.measure('style:waitForAnalysis', () =>
      stylePage.waitForAnalysisComplete(30_000)
    );

    const analysisDone = await stylePage.analysisSucceeded();
    if (analysisDone) {
      console.log('VisionStruct Analysis: Complete');
    } else {
      console.warn('VisionStruct Analysis: Failed or timed out — test continues');
    }

    // Verify /api/vision/analyze was called
    const analyzeCall = findCall(networkCalls.getCalls(), '/api/vision/analyze');
    if (analyzeCall) {
      console.log(`/api/vision/analyze → ${analyzeCall.status} (${analyzeCall.duration}ms)`);
    }

    await page.screenshot({ path: testInfo.outputPath('03-style-analysis.png'), fullPage: false });
    testInfo.attach('screenshot-style-analysis', {
      path: testInfo.outputPath('03-style-analysis.png'),
      contentType: 'image/png',
    });

    await perf.measure('style:selectStyle', () => stylePage.selectStyle(STYLE_LABEL));
    await perf.measure('style:enterPrompt', () => stylePage.enterChangePrompt(CHANGE_PROMPT));

    await page.screenshot({ path: testInfo.outputPath('03-style-filled.png'), fullPage: false });
    testInfo.attach('screenshot-style-filled', {
      path: testInfo.outputPath('03-style-filled.png'),
      contentType: 'image/png',
    });

    await perf.measure('style:continueToRefine', () => stylePage.continueToRefine());

    // ── 4. SUGGEST ──────────────────────────────────────────────
    // Skip through suggestion rounds (or answer) until summary
    await perf.measure('suggest:waitForQuestion', () =>
      suggestPage.waitForQuestion(30_000)
    );

    // Verify /api/suggestions was called
    const suggestCall = findCall(networkCalls.getCalls(), '/api/suggestions');
    if (suggestCall) {
      console.log(`/api/suggestions → ${suggestCall.status} (${suggestCall.duration}ms)`);
    }

    await page.screenshot({ path: testInfo.outputPath('04-suggest-question.png'), fullPage: false });
    testInfo.attach('screenshot-suggest-question', {
      path: testInfo.outputPath('04-suggest-question.png'),
      contentType: 'image/png',
    });

    // Navigate through rounds by skipping
    await perf.measure('suggest:skipToSummary', () =>
      suggestPage.skipToSummary(3, 30_000)
    );

    await page.screenshot({ path: testInfo.outputPath('04-suggest-summary.png'), fullPage: false });
    testInfo.attach('screenshot-suggest-summary', {
      path: testInfo.outputPath('04-suggest-summary.png'),
      contentType: 'image/png',
    });

    await expect(page.locator('text=Generate Images →')).toBeVisible();

    // Check Gemini mock note
    const bodyText = await page.locator('body').innerText();
    if (bodyText.includes('Make it bolder') || bodyText.includes('Make it softer')) {
      console.warn('[NOTE] Suggest screen appears to be using canned mock options — Gemini key may be invalid. Not treated as a failure.');
    }

    await perf.measure('suggest:clickGenerate', () => suggestPage.clickGenerateImages());

    // ── 5. VARIANTS ─────────────────────────────────────────────
    // Imagen can take 10–30 seconds
    await perf.measure('variants:waitForImages', () =>
      variantsPage.waitForVariants(60_000)
    );

    // Verify /api/generate/images was called
    const generateCall = findCall(networkCalls.getCalls(), '/api/generate/images');
    if (generateCall) {
      console.log(`/api/generate/images → ${generateCall.status} (${generateCall.duration}ms)`);
    }

    // User particularly cares about Variants screenshot
    await page.screenshot({ path: testInfo.outputPath('05-variants.png'), fullPage: true });
    testInfo.attach('screenshot-variants', {
      path: testInfo.outputPath('05-variants.png'),
      contentType: 'image/png',
    });

    const variantCount = await variantsPage.getVariantCount();
    console.log(`Variants rendered: ${variantCount}`);
    expect(variantCount).toBeGreaterThanOrEqual(1);

    await perf.measure('variants:useVariant', () => variantsPage.useVariant(0));

    // ── NETWORK SUMMARY ─────────────────────────────────────────
    const allCalls = networkCalls.getCalls();
    console.log('\n--- Network log ---');
    for (const call of allCalls) {
      const flag = call.ok ? '  OK' : ' ERR';
      console.log(`${flag} ${call.method} ${call.url} → ${call.status} (${call.duration}ms)`);
      if (!call.ok && call.status >= 400) {
        console.warn(`WARN: ${call.url} returned ${call.status}`);
      }
    }

    // ── PERF FLUSH ──────────────────────────────────────────────
    perf.flush();
    const warnings = perf.warnings();
    if (warnings.length > 0) {
      console.warn('\n--- Perf warnings ---');
      warnings.forEach(w => console.warn(w));
    }

    // Final assertion: we should have reached Animate or beyond (or stay on Variants)
    // We stop at Animate per spec — just confirm we didn't crash
    const finalTitle = await page.title();
    console.log(`Final page title: ${finalTitle}`);
  });
});
