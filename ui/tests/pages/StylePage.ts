import { type Page, type Locator, expect } from '@playwright/test';

export class StylePage {
  readonly page: Page;
  readonly continueButton: Locator;
  readonly changeTextarea: Locator;

  constructor(page: Page) {
    this.page = page;
    this.continueButton = page.getByText('Continue to Refine →');
    this.changeTextarea = page.locator('textarea');
  }

  async waitForAnalysisComplete(timeout = 30_000) {
    // Wait for either success badge or analysis-failed state
    await expect(
      this.page.locator('text=VisionStruct Analysis Complete').or(
        this.page.locator('text=Analysis failed')
      )
    ).toBeVisible({ timeout });
  }

  async analysisSucceeded(): Promise<boolean> {
    return this.page.locator('text=VisionStruct Analysis Complete').isVisible();
  }

  async selectStyle(label: string) {
    // Style cards are in horizontal scroll; click by label text
    await this.page.getByText(label, { exact: false }).first().click();
  }

  async enterChangePrompt(text: string) {
    await this.changeTextarea.fill(text);
  }

  async continueToRefine() {
    await this.continueButton.click();
  }
}
