import { type Page, type Locator, expect } from '@playwright/test';

export class VariantsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForVariants(timeout = 60_000) {
    // Wait for "Generating with Imagen" to disappear and images to appear
    await this.page.waitForFunction(
      () => {
        const isLoading = document.body.innerText.includes('Generating with Imagen');
        if (isLoading) return false;
        // Check that at least 1 variant card image is rendered
        const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
        const variantImgs = imgs.filter(img =>
          img.closest('[style*="border-radius: 16px"]') !== null && img.src.length > 0
        );
        return variantImgs.length >= 1;
      },
      { timeout }
    );
  }

  async hasError(): Promise<boolean> {
    return this.page.locator('text=Search failed').or(
      this.page.locator('[style*="rgba(220,80,80"]')
    ).isVisible();
  }

  async getVariantCount(): Promise<number> {
    // Count "Use This" buttons as a proxy for variant cards
    return this.page.getByText('⭐ Use This').count();
  }

  async useVariant(index = 0) {
    const useButtons = this.page.getByText('⭐ Use This');
    await useButtons.nth(index).click();
  }
}
