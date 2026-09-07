import { World, setWorldConstructor } from '@cucumber/cucumber';
import { chromium, Browser, Page, APIRequestContext, Response } from '@playwright/test';

export class PlaywrightWorld extends World {
  browser!: Browser;
  page!: Page;
  request!: APIRequestContext;
  consoleErrors: string[] = [];
  response?: Response | null;
  feedResponses: { url: string; response: Response }[] = [];
  initialTheme?: string | null;

  async init() {
    this.browser = await chromium.launch({ headless: true });
    const context = await this.browser.newContext();
    this.page = await context.newPage();
    this.request = await context.request;
  }

  async close() {
    await this.page?.close();
    await this.browser?.close();
  }
}

setWorldConstructor(PlaywrightWorld);
