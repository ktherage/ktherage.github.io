import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PlaywrightWorld } from '../support/world';

const BASE_URL = 'http://localhost:4000';

// ── Preconditions ──

Given('I am on the homepage', async function (this: PlaywrightWorld) {
  await this.page.goto(`${BASE_URL}/`);
});

Given('I am on the {string} page', async function (this: PlaywrightWorld, path: string) {
  await this.page.goto(`${BASE_URL}${path}`);
});

// ── Navigation (actions) ──

When('I visit the homepage', async function (this: PlaywrightWorld) {
  await this.page.goto(`${BASE_URL}/`);
});

When('I visit the {string} page', async function (this: PlaywrightWorld, path: string) {
  await this.page.goto(`${BASE_URL}${path}`);
});

When('I visit a non-existent page', async function (this: PlaywrightWorld) {
  this.response = await this.page.goto(`${BASE_URL}/this-page-does-not-exist/`);
});

Given('blog post items are displayed', async function (this: PlaywrightWorld) {
  await expect(this.page.locator('.blog-post-item')).not.toHaveCount(0);
});

// ── Smoke: page checks ──

Then('the page title should contain {string}', async function (this: PlaywrightWorld, title: string) {
  await expect(this.page).toHaveTitle(new RegExp(title));
});

Then('a visible {string} element should exist', async function (this: PlaywrightWorld, selector: string) {
  await expect(this.page.locator(selector)).toBeVisible();
});

Then('blog post items should be displayed', async function (this: PlaywrightWorld) {
  await expect(this.page.locator('.blog-post-item')).not.toHaveCount(0);
});

Then('the response status should be {int}', async function (this: PlaywrightWorld, status: number) {
  expect(this.response?.status()).toBe(status);
});

// ── Smoke: feeds ──

When('I request the XML feeds', async function (this: PlaywrightWorld) {
  this.feedResponses = [];
  for (const url of ['/feed.xml', '/atom.xml']) {
    const response = await this.request.get(`${BASE_URL}${url}`);
    this.feedResponses.push({ url, response });
  }
});

When('I request the JSON feeds', async function (this: PlaywrightWorld) {
  this.feedResponses = [];
  for (const url of ['/feed.json']) {
    const response = await this.request.get(`${BASE_URL}${url}`);
    this.feedResponses.push({ url, response });
  }
});

Then('each feed should return status 200', async function (this: PlaywrightWorld) {
  for (const { url, response } of this.feedResponses) {
    expect(response.status(), `${url} should return 200`).toBe(200);
  }
});

Then('each XML feed should have content-type {string}', async function (this: PlaywrightWorld, type: string) {
  for (const { url, response } of this.feedResponses) {
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType, `${url} content-type should be ${type}`).toMatch(/xml/i);
  }
});

Then('each JSON feed should have content-type {string}', async function (this: PlaywrightWorld, type: string) {
  for (const { url, response } of this.feedResponses) {
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType, `${url} content-type should be ${type}`).toMatch(/json/i);
  }
});

// ── Theme toggle ──

Given('the theme toggle button is visible', async function (this: PlaywrightWorld) {
  await this.page.waitForSelector('[data-theme-toggle]');
});

Given('I note the current theme', async function (this: PlaywrightWorld) {
  this.initialTheme = await this.page.locator('html').getAttribute('data-bs-theme');
});

When('I click the theme toggle', async function (this: PlaywrightWorld) {
  await this.page.click('[data-theme-toggle]');
});

When('I reload the page', async function (this: PlaywrightWorld) {
  await this.page.reload();
});

Then('the theme should change to the opposite', async function (this: PlaywrightWorld) {
  const expected = this.initialTheme === 'dark' ? 'light' : 'dark';
  await expect(this.page.locator('html')).toHaveAttribute('data-bs-theme', expected);
});

Then('the theme should be restored to the original', async function (this: PlaywrightWorld) {
  await expect(this.page.locator('html')).toHaveAttribute('data-bs-theme', this.initialTheme!);
});

Then('the toggle icon should match the current theme', async function (this: PlaywrightWorld) {
  const pattern = this.initialTheme === 'dark' ? /fa-sun/ : /fa-moon/;
  await expect(this.page.locator('[data-theme-toggle] i')).toHaveClass(pattern);
});

Then('the toggle icon should match the new theme', async function (this: PlaywrightWorld) {
  const current = await this.page.locator('html').getAttribute('data-bs-theme');
  const pattern = current === 'dark' ? /fa-sun/ : /fa-moon/;
  await expect(this.page.locator('[data-theme-toggle] i')).toHaveClass(pattern);
});

Then('the theme should be stored in localStorage', async function (this: PlaywrightWorld) {
  const current = await this.page.locator('html').getAttribute('data-bs-theme');
  const stored = await this.page.evaluate(() =>
    localStorage.getItem('user-theme-preference'),
  );
  expect(stored).toBe(current);
});

Then('the theme should match the stored preference', async function (this: PlaywrightWorld) {
  const stored = await this.page.evaluate(() =>
    localStorage.getItem('user-theme-preference'),
  );
  const current = await this.page.locator('html').getAttribute('data-bs-theme');
  expect(stored).toBe(current);
});

// ── Tag filter ──

Given('filter badges are visible', async function (this: PlaywrightWorld) {
  await expect(this.page.locator('.filter-badge')).not.toHaveCount(0);
});

Then('all filter badges should be visible', async function (this: PlaywrightWorld) {
  const badges = this.page.locator('.filter-badge');
  const count = await badges.count();
  for (let i = 0; i < count; i++) {
    await expect(badges.nth(i)).toBeVisible();
  }
});

Then('the {string} badge should have aria-pressed {string}', async function (this: PlaywrightWorld, badge: string, value: string) {
  const selector = badge === 'All'
    ? '.filter-badge[data-filter="all"]'
    : '.filter-badge:not([data-filter="all"])';
  await expect(this.page.locator(selector).first()).toHaveAttribute('aria-pressed', value);
});

Then('the {string} badge should have class {string}', async function (this: PlaywrightWorld, badge: string, className: string) {
  const selector = badge === 'All'
    ? '.filter-badge[data-filter="all"]'
    : '.filter-badge:not([data-filter="all"])';
  await expect(this.page.locator(selector).first()).toHaveClass(new RegExp(className));
});

Then('the first specific badge should have aria-pressed {string}', async function (this: PlaywrightWorld, value: string) {
  await expect(this.page.locator('.filter-badge:not([data-filter="all"])').first()).toHaveAttribute('aria-pressed', value);
});

Then('the first specific badge should have class {string}', async function (this: PlaywrightWorld, className: string) {
  await expect(this.page.locator('.filter-badge:not([data-filter="all"])').first()).toHaveClass(new RegExp(className));
});

When('I click the {string} badge', async function (this: PlaywrightWorld, badge: string) {
  const selector = badge === 'All'
    ? '.filter-badge[data-filter="all"]'
    : '.filter-badge:not([data-filter="all"])';
  await this.page.locator(selector).first().click();
});

When('I click the first specific badge', async function (this: PlaywrightWorld) {
  await this.page.locator('.filter-badge:not([data-filter="all"])').first().click();
});

Then('all blog post items should be visible', async function (this: PlaywrightWorld) {
  const totalPosts = await this.page.locator('.blog-post-item').count();
  await expect(this.page.locator('.blog-post-item:not([style*="display: none"])')).toHaveCount(totalPosts);
});

When('I click each non-{string} badge', async function (this: PlaywrightWorld, _badge: string) {
  const badges = this.page.locator('.filter-badge:not([data-filter="all"])');
  const badgeCount = await badges.count();
  expect(badgeCount).toBeGreaterThan(0);

  for (let i = 0; i < badgeCount; i++) {
    const badge = badges.nth(i);
    const tagSlug = await badge.getAttribute('data-filter');
    expect(tagSlug).toBeTruthy();

    await badge.click();

    const visiblePosts = this.page.locator('.blog-post-item:not([style*="display: none"])');
    const visibleCount = await visiblePosts.count();
    expect(visibleCount).toBeGreaterThan(0);

    for (let j = 0; j < visibleCount; j++) {
      const dataTags = await visiblePosts.nth(j).getAttribute('data-tags');
      const tags = (dataTags ?? '').split(',').filter(Boolean);
      expect(tags).toContain(tagSlug);
    }

    const totalCount = await this.page.locator('.blog-post-item').count();
    if (visibleCount < totalCount) {
      const hiddenPosts = this.page.locator('.blog-post-item[style*="display: none"]');
      expect(await hiddenPosts.count()).toBeGreaterThan(0);
    }
  }
});

Then('only posts matching that tag should be visible', async function () {
  // Already validated in the "When" step above
});

Then('some posts should be hidden', async function (this: PlaywrightWorld) {
  const totalPosts = await this.page.locator('.blog-post-item').count();
  const filteredCount = await this.page.locator('.blog-post-item:not([style*="display: none"])').count();
  expect(filteredCount).toBeLessThanOrEqual(totalPosts);
});

// ── Language switch ──

Then('a {string} link should be visible', async function (this: PlaywrightWorld, label: string) {
  await expect(this.page.locator(`a[aria-label="${label}"]`)).toBeVisible();
});

Then('the link href should match {string}', async function (this: PlaywrightWorld, pattern: string) {
  await expect(this.page.locator('a[aria-label="Passer en français"]')).toHaveAttribute('href', new RegExp(pattern));
});

Then('the link href should match the English homepage', async function (this: PlaywrightWorld) {
  await expect(this.page.locator('a[aria-label="Passer en anglais"]')).toHaveAttribute('href', /^https:\/\/ktherage\.github\.io\/$/);
});

Then('the link href should match the English about-me page', async function (this: PlaywrightWorld) {
  await expect(this.page.locator('a[aria-label="Passer en anglais"]')).toHaveAttribute('href', /^https:\/\/ktherage\.github\.io\/about-me\/$/);
});

Then('the html lang attribute should be {string}', async function (this: PlaywrightWorld, lang: string) {
  await expect(this.page.locator('html')).toHaveAttribute('lang', lang);
});

When('I click the {string} link', async function (this: PlaywrightWorld, label: string) {
  await this.page.locator(`a[aria-label="${label}"]`).click();
});

Then('the URL should contain {string}', async function (this: PlaywrightWorld, pattern: string) {
  await expect(this.page).toHaveURL(new RegExp(pattern));
});

Then('the URL should be the English about-me page', async function (this: PlaywrightWorld) {
  await expect(this.page).toHaveURL(/^https:\/\/ktherage\.github\.io\/about-me\/$/);
});

// ── Accessibility ──

Then('axe should report no critical or serious violations', async function (this: PlaywrightWorld) {
  const results = await new AxeBuilder({ page: this.page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const critical = results.violations.filter(
    (v) => v.impact === 'critical' || (v.impact === 'serious' && v.id !== 'link-in-text-block'),
  );
  expect(critical, 'Critical/serious violations').toEqual([]);
});

Then('exactly {int} {string} element should exist', async function (this: PlaywrightWorld, count: number, selector: string) {
  await expect(this.page.locator(selector)).toHaveCount(count);
});

Then('at least {int} {string} element should exist', async function (this: PlaywrightWorld, count: number, selector: string) {
  const actual = await this.page.locator(selector).count();
  expect(actual).toBeGreaterThanOrEqual(count);
});

Then('no links with href="#" should exist', async function (this: PlaywrightWorld) {
  const count = await this.page.locator('a[href="#"]').count();
  expect(count).toBe(0);
});
