import { World, setWorldConstructor } from '@cucumber/cucumber';
import { chromium, Browser, Page, APIRequestContext, Response } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SITE_DIR = path.resolve('_site');
const PROD_ORIGIN = 'https://ktherage.github.io';

/** Map a production URL to the matching file of the local build, or null. */
export function localFileFor(url: string): string | null {
  if (!url.startsWith(`${PROD_ORIGIN}/`)) {
    return null;
  }
  const file = path.join(SITE_DIR, decodeURIComponent(new URL(url).pathname));
  return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}

export class PlaywrightWorld extends World {
  browser!: Browser;
  page!: Page;
  request!: APIRequestContext;
  consoleErrors: string[] = [];
  response?: Response | null;
  feedResponses: { url: string; response: Response }[] = [];
  initialTheme?: string | null;

  async init() {
    this.browser = await chromium.launch({ headless: !process.env.PWDEBUG });
    const context = await this.browser.newContext();
    this.page = await context.newPage();
    this.request = await context.request;

    // Built pages reference the production origin; serve those assets from the local
    // build so the suite exercises this branch instead of whatever is deployed.
    await this.page.route(`${PROD_ORIGIN}/**`, (route) => {
      const file = localFileFor(route.request().url());
      return file ? route.fulfill({ path: file }) : route.continue();
    });
  }

  async close() {
    await this.page?.close();
    await this.browser?.close();
  }
}

setWorldConstructor(PlaywrightWorld);
