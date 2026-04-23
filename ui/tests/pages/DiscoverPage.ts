import { type Page, type Locator, expect } from '@playwright/test';

export class DiscoverPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly analyseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder('Search Pinterest for references');
    this.searchButton = page.getByText('🔍 Search');
    this.analyseButton = page.getByText('Analyse Selected →');
  }

  /** Wait for the 3x2 image grid to populate with real images */
  async waitForImages(timeout = 20_000) {
    // Wait for loading dots to disappear
    await this.page.waitForFunction(
      () => {
        const imgs = Array.from(document.querySelectorAll('img[referrerpolicy="no-referrer"]'));
        return imgs.length >= 6;
      },
      { timeout }
    );
  }

  /** Click the Nth image (0-based index) */
  async selectImage(index = 0) {
    const images = this.page.locator('img[referrerpolicy="no-referrer"]');
    await images.nth(index).click();
  }

  /** Verify gold checkmark badge appears on the selected image container */
  async verifySelectionBadge() {
    // The check div has text content ✓ and gold background
    await expect(this.page.locator('text=✓').first()).toBeVisible({ timeout: 5_000 });
  }

  async searchFor(query: string) {
    await this.searchInput.clear();
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  async analyseSelected() {
    await this.analyseButton.click();
  }

  /** Return URLs of all currently visible images */
  async getImageUrls(): Promise<string[]> {
    return this.page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLImageElement>('img[referrerpolicy="no-referrer"]'))
        .map(img => img.src)
    );
  }
}
