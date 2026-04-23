import { type Page, type Locator, expect } from '@playwright/test';

export class SuggestPage {
  readonly page: Page;
  readonly nextButton: Locator;
  readonly skipButton: Locator;
  readonly generateImagesButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nextButton = page.getByRole('button', { name: /^Next →/ });
    this.skipButton = page.getByRole('button', { name: /^Skip$/ });
    this.generateImagesButton = page.getByRole('button', { name: /^Generate Images →/ });
  }

  /** Wait until either the agent has presented a question (Next button) or finished (Generate Images button). */
  async waitForQuestion(timeout = 30_000) {
    await this.page.waitForFunction(
      () => {
        const btns = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim() || '');
        return btns.some(t => t.startsWith('Next')) || btns.some(t => t.startsWith('Generate Images'));
      },
      { timeout },
    );
  }

  async isFinalSummary(): Promise<boolean> {
    return this.generateImagesButton.isVisible();
  }

  /** Click the first answer option above the Next/Skip row. */
  async selectFirstOption() {
    const optionItems = this.page.locator('div[style*="14px 18px"][style*="border-radius: 12px"]');
    const count = await optionItems.count();
    if (count > 0) await optionItems.first().click();
  }

  async clickNext()           { await this.nextButton.click(); }
  async clickSkip()           { await this.skipButton.click(); }
  async clickGenerateImages() { await this.generateImagesButton.click(); }

  /** Skip through up to maxRounds rounds, then assert summary. */
  async skipToSummary(maxRounds = 3, timeout = 30_000) {
    for (let i = 0; i < maxRounds; i++) {
      await this.waitForQuestion(timeout);
      if (await this.isFinalSummary()) return;
      await this.clickSkip();
      await this.page.waitForTimeout(1200);
    }
    await expect(this.generateImagesButton).toBeVisible({ timeout });
  }

  /** Pick first option + Next, repeat, stop at summary. */
  async answerAndProceed(maxRounds = 3, timeout = 30_000) {
    for (let i = 0; i < maxRounds; i++) {
      await this.waitForQuestion(timeout);
      if (await this.isFinalSummary()) return;
      await this.selectFirstOption();
      await this.page.waitForTimeout(300);
      await this.clickNext();
      await this.page.waitForTimeout(1200);
    }
    await expect(this.generateImagesButton).toBeVisible({ timeout });
  }
}
