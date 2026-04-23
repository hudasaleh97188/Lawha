import { test as base, type Page } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { DiscoverPage } from '../pages/DiscoverPage';
import { StylePage } from '../pages/StylePage';
import { SuggestPage } from '../pages/SuggestPage';
import { VariantsPage } from '../pages/VariantsPage';
import { attachNetworkRecorder, type NetworkCall } from '../utils/network';

interface LawhaFixtures {
  homePage: HomePage;
  discoverPage: DiscoverPage;
  stylePage: StylePage;
  suggestPage: SuggestPage;
  variantsPage: VariantsPage;
  networkCalls: { getCalls: () => NetworkCall[]; getCallsFor: (path: string) => NetworkCall[] };
  cleanSession: Page;
}

export const test = base.extend<LawhaFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  discoverPage: async ({ page }, use) => {
    await use(new DiscoverPage(page));
  },
  stylePage: async ({ page }, use) => {
    await use(new StylePage(page));
  },
  suggestPage: async ({ page }, use) => {
    await use(new SuggestPage(page));
  },
  variantsPage: async ({ page }, use) => {
    await use(new VariantsPage(page));
  },
  networkCalls: async ({ page }, use) => {
    const recorder = attachNetworkRecorder(page);
    await use(recorder);
  },
  cleanSession: async ({ page }, use) => {
    // Navigate to root first so localStorage is accessible
    await page.goto('/');
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter(k => k.startsWith('lawha_'))
        .forEach(k => localStorage.removeItem(k));
    });
    await use(page);
  },
});

export { expect } from '@playwright/test';
