import { type Page, type Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly topicInput: Locator;
  readonly beginCreatingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.topicInput = page.getByPlaceholder('What occasion are you creating for?');
    this.beginCreatingButton = page.getByText('Begin Creating →');
  }

  async goto() {
    await this.page.goto('/');
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => {
      Object.keys(localStorage)
        .filter(k => k.startsWith('lawha_'))
        .forEach(k => localStorage.removeItem(k));
    });
  }

  async enterTopic(topic: string) {
    await this.topicInput.fill(topic);
  }

  async selectCategory(label: string) {
    await this.page.getByText(label, { exact: false }).first().click();
  }

  async beginCreating() {
    await this.beginCreatingButton.click();
  }

  async fillAndSubmit(topic: string, categoryLabel: string) {
    await this.enterTopic(topic);
    await this.selectCategory(categoryLabel);
    await this.beginCreating();
  }
}
