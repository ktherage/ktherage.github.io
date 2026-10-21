import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { PlaywrightWorld, localFileFor } from "../support/world";

const BASE_URL = "http://localhost:4000";

// ── Blog post navigation ──

When(
	"I visit the blog post {string}",
	async function (this: PlaywrightWorld, path: string) {
		// domcontentloaded: the load event also waits for third-party embeds and media.
		await this.page.goto(`${BASE_URL}${path}`, {
			waitUntil: "domcontentloaded",
		});
	},
);

When(
	"I start loading the blog post {string} without waiting for its assets",
	async function (this: PlaywrightWorld, path: string) {
		await this.page.goto(`${BASE_URL}${path}`, { waitUntil: "commit" });
	},
);

// ── Mermaid diagrams ──

Given(
	"the mermaid bundle is delayed by {int} milliseconds",
	async function (this: PlaywrightWorld, ms: number) {
		// Registered after the world route: matching page routes run in reverse registration order.
		await this.page.route("**/mermaid.min.js", async (route) => {
			await new Promise((resolve) => setTimeout(resolve, ms));
			const file = localFileFor(route.request().url());
			return file ? route.fulfill({ path: file }) : route.continue();
		});
	},
);

Then(
	"the article should show {int} rendered diagrams",
	async function (this: PlaywrightWorld, count: number) {
		await expect(this.page.locator(".blog-content .mermaid svg")).toHaveCount(
			count,
		);
	},
);

Then(
	"no diagram should be rendered yet",
	async function (this: PlaywrightWorld) {
		await expect(this.page.locator(".mermaid svg")).toHaveCount(0);
	},
);

Then(
	"no mermaid bundle should have been requested",
	async function (this: PlaywrightWorld) {
		const requested = await this.page.evaluate(
			() =>
				performance
					.getEntriesByType("resource")
					.filter((entry) => entry.name.includes("mermaid")).length,
		);
		expect(requested).toBe(0);
	},
);

// ── Table of contents ──

Given(
	"the viewport is {int} by {int}",
	async function (this: PlaywrightWorld, width: number, height: number) {
		await this.page.setViewportSize({ width, height });
	},
);

Then(
	"the table of contents should be visible",
	async function (this: PlaywrightWorld) {
		await expect(this.page.locator("#toc")).toBeVisible();
	},
);

Then(
	"the table of contents panel should be hidden",
	async function (this: PlaywrightWorld) {
		await expect(this.page.locator("#toc")).toBeHidden();
	},
);

Then(
	"the table of contents button should be visible",
	async function (this: PlaywrightWorld) {
		await expect(this.page.locator("#toc-toggle")).toBeVisible();
	},
);

When(
	"I click the table of contents button",
	async function (this: PlaywrightWorld) {
		await this.page.locator("#toc-toggle").click();
	},
);

Then(
	"it should link every heading of the article",
	async function (this: PlaywrightWorld) {
		const ids = await this.page.$$eval<HTMLHeadingElement, string[]>(
			".blog-content h2, .blog-content h3",
			(headings) => headings.map((heading) => heading.id),
		);
		const hrefs = await this.page.$$eval<HTMLAnchorElement, (string | null)[]>(
			"#toc-list a",
			(links) => links.map((link) => link.getAttribute("href")),
		);
		expect(ids.length).toBeGreaterThan(0);
		for (const id of ids) {
			expect(hrefs).toContain(`#${id}`);
		}
	},
);

Then(
	"the table of contents should be filled within {int} milliseconds",
	async function (this: PlaywrightWorld, ms: number) {
		await expect(this.page.locator("#toc-list > li").first()).toBeVisible({
			timeout: ms,
		});
	},
);

When(
	"I click the first entry of the table of contents",
	async function (this: PlaywrightWorld) {
		await this.page.locator("#toc-list a").first().click();
	},
);

Then(
	"the first heading of the article should be in the viewport",
	async function (this: PlaywrightWorld) {
		const id = await this.page
			.locator(".blog-content h2, .blog-content h3")
			.first()
			.getAttribute("id");
		await expect(this.page.locator(`#${id}`)).toBeInViewport();
	},
);

// ── Code blocks ──

Then(
	"overflowing code blocks should be keyboard focusable and named",
	async function (this: PlaywrightWorld) {
		const blocks = await this.page.$$eval<
			HTMLElement,
			{ tabindex: string | null; role: string | null; label: string | null }[]
		>(
			'.blog-content pre[tabindex="0"], .blog-content pre > [tabindex="0"]',
			(elements) =>
				elements.map((element) => ({
					tabindex: element.getAttribute("tabindex"),
					role: element.getAttribute("role"),
					label: element.getAttribute("aria-label"),
				})),
		);

		expect(blocks.length).toBeGreaterThan(0);
		for (const block of blocks) {
			expect(block.role).toBe("group");
			expect(block.label?.length).toBeGreaterThan(0);
		}
	},
);

// ── Vendor assets ──

Then(
	"every vendor asset of the page should resolve in the build",
	async function (this: PlaywrightWorld) {
		// url('vendor/…') prefixes the language (/fr/vendor/…) on translated pages, which
		// 404s: every reference must point to a file of the build.
		const urls = await this.page.$$eval<HTMLElement, string[]>(
			'link[href*="/vendor/"], script[src*="/vendor/"], script[data-bundle*="/vendor/"]',
			(elements) =>
				elements.map(
					(element) =>
						element.getAttribute("href") ??
						element.getAttribute("src") ??
						element.getAttribute("data-bundle") ??
						"",
				),
		);
		expect(urls.length).toBeGreaterThan(0);
		const missing = urls.filter(
			(url) => !localFileFor(new URL(url, BASE_URL).toString()),
		);
		expect(missing).toEqual([]);
	},
);
