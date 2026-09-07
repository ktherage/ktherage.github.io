# AGENT_MEMORY.md

Durable technical knowledge and key insights discovered while working on this repository.

> This file is a **memory / knowledge base**, not an instruction manual.
> Agent behavior belongs in `AGENTS.md`.
>
> Add an entry only when a discovery is non-obvious, durable, project-specific,
> verified, or likely to prevent future mistakes.

---

## Memory format

Use this structure for new insights:

### YYYY-MM-DD — Short title

**Insight:** What was discovered.

**Why it matters:** The failure mode, consequence, or useful implication.

**Evidence / verification:** How it was established, when relevant.

**Decision:** The resulting implementation choice or workaround.

---

## Key insights

### 2026-08-28 — Cecil silently ignores several configuration keys

**Insight:** In Cecil 9.0.1, `optimize.gzip`, the top-level `feeds:` block, and the top-level `locale:` key are not recognized configuration options and are silently ignored.

**Why it matters:** These settings can look valid while giving a false impression that they affect the generated site. Removing them produced no output difference.

**Evidence / verification:** Confirmed against the Cecil 9.0.1 source and a before/after build followed by `diff -rq _site`.

**Decision:** Do not reintroduce these keys. Feeds are configured through Cecil's `output.formats`, `output.pagetypeformats`, and `output.rss`. Locale is defined through `languages[].locale`.

---

### 2026-08-28 — Cecil baseurl behavior is intentionally non-standard here

**Insight:** `baseurl: "https://ktherage.github.io"` is used as a full URL rather than a path and currently works because `canonicalurl: true` is enabled.

**Why it matters:** Changing it to `/` may alter canonical URL generation even though the configuration looks more conventional.

**Evidence / verification:** Recorded as a verified project-specific behavior during the Cecil configuration audit.

**Decision:** Do not normalize this value without rebuilding and checking canonical output.

---

### 2026-08-28 — Fonts are intentionally served from `static/fonts/`

**Insight:** Font files live under `static/fonts/` and are copied verbatim to `/fonts/...`; they are not managed through Cecil's asset pipeline.

**Why it matters:** Replacing the current absolute `/fonts/*.woff2` preload paths with `asset()` would result in 404s.

**Evidence / verification:** Confirmed during the project configuration audit.

**Decision:** Keep the absolute font preload paths in `layouts/_default/page.html.twig`.

---

### 2026-08-28 — Cecil Page properties are protected in Twig

**Insight:** On a Cecil `Page` object, `item.url`, `item.id`, and `item.path` are protected and cannot be accessed directly from the relevant Twig templates.

**Why it matters:** Direct property access causes template errors.

**Evidence / verification:** Encountered and verified during LLM feed template work.

**Decision:** Use the `url(item)` Twig function when a page URL is required.

---

### 2026-08-28 — `site.pages` is not generally safe in Twig

**Insight:** Cecil page collections expose protected properties when iterating `site.pages` in normal templates. A page's `page.pages` collection is the safe collection to iterate in those contexts.

**Why it matters:** Using `site.pages` outside Cecil's special homepage/JSON-LD context can cause Twig errors.

**Evidence / verification:** Encountered and verified during template work.

**Decision:** Prefer `page.pages` in normal templates. The homepage JSON-LD template is a documented exception because Cecil grants it special access.

---

### 2026-08-28 — Twig `contains` is unavailable in this template environment

**Insight:** `contains` is not a supported Twig operator in the project's current Twig environment.

**Why it matters:** Conditions written using `contains` fail instead of behaving like collection/string containment checks.

**Decision:** Use `matches`, `starts with`, or `ends with` according to the actual condition required.

---

### 2026-08-28 — Inline `if` in Twig `for` loops is unsupported

**Insight:** The `{% for x in y if condition %}` syntax is not supported by the project's current Twig version/environment.

**Why it matters:** Filtering directly in the `for` declaration causes template failures.

**Decision:** Use a normal `for` loop followed by an explicit `{% if %}`.

---

### 2026-08-28 — Homepage `page.pages` contains leaf pages, not blog sections

**Insight:** On the homepage, `page.pages` contains leaf pages such as blog posts, `about-me`, and `legal`, rather than the blog year sections.

**Why it matters:** A homepage template cannot identify blog posts merely by iterating sections.

**Decision:** Identify blog posts through their generated URL, using a `/blog/` match that also works for the `/fr/blog/` path.

---

### 2026-08-28 — `.llms.twig` templates do not render included list templates as expected

**Insight:** Including `_default/list.llms.twig` from an `.llms.twig` template does not produce the expected rendered content.

**Why it matters:** Reusing the list template through `{% include %}` does not work for the LLM output path.

**Decision:** Keep the required content duplicated in `home.llms.twig` rather than relying on that include.

---

### 2026-08-28 — JSON-LD date formatting must use ISO 8601 via `date('c')`

**Insight:** In the project's Twig/PHP environment, formatting JSON-LD dates with `date('Y-m-d\TH:i:sP')` causes the `T` to be stripped and produces an invalid timestamp.

**Why it matters:** Invalid `datePublished` / `dateModified` values can prevent Google from accepting relevant structured-data rich-result types.

**Evidence / verification:** Identified during the SEO/structured-data audit; the existing `Blog` JSON-LD block already uses `date('c')`.

**Decision:** Use `date('c')` for JSON-LD ISO 8601 dates.

---

### 2026-08-28 — Cecil social configuration must be a keyed map

**Insight:** The project's Cecil `social` configuration must be keyed by network (`twitter`, `mastodon`, `facebook`, etc.) rather than represented as a flat list.

**Why it matters:** Cecil's metatag generation expects paths such as `site.social.twitter.site`, `site.social.mastodon.creator`, and `site.social.facebook.id`. A flat list breaks those lookups.

**Decision:** Keep each social network as a named map entry and retain the presentation fields used by the homepage (`name`, `icon`, `url`).

---

### 2026-08-28 — The author email must not leak into NewsArticle JSON-LD

**Insight:** The author's email is intentionally obfuscated in prose and should not be exposed in `NewsArticle` structured data.

**Why it matters:** Structured data is machine-readable and can expose information that was intentionally kept out of the rendered content.

**Decision:** Do not add `author.email` or `telephone` to `NewsArticle` JSON-LD.

---

### 2026-08-28 — `meta keywords` has no SEO value

**Insight:** The legacy `meta name="keywords"` output is deprecated and provides no meaningful SEO benefit.

**Decision:** Remove/avoid emitting it rather than maintaining it for SEO purposes.

---

### 2026-08-28 — Translation catalog filenames are coupled to Cecil locales

**Insight:** Cecil loads translation catalogs according to the locale configured under `languages[].locale`.

**Why it matters:** If the configured locale and catalog filename diverge, translation keys can leak into the rendered site instead of being translated.

**Decision:** Keep locale/catalog pairs synchronized, currently `en_US` ↔ `messages.en_US.yaml` and `fr_FR` ↔ `messages.fr_FR.yaml`.

---

### 2026-08-28 — Year blog sections require an explicit blog list layout

**Insight:** With nested sections enabled, a year's `index.md` does not automatically inherit the parent blog list template.

**Why it matters:** Without `layout: blog/list`, the year section falls back to the default list template and loses blog-specific presentation such as the tag cloud and breadcrumb behavior.

**Decision:** Every year section index explicitly sets `layout: blog/list`.

---

### 2026-08-28 — URL changes require Cecil aliases on GitHub Pages

**Insight:** GitHub Pages does not provide server-side 301 redirects for this site. Cecil's `alias` generates the project's redirect mechanism.

**Why it matters:** Changing an article URL without an alias can break existing inbound links and indexed URLs.

**Decision:** When a published post URL changes, add `alias: /old/url/` and verify the generated redirect/canonical behavior.

---

### 2026-08-28 — Generated `_site` output is the final SEO truth

**Insight:** Template inspection alone is insufficient for SEO/structured-data verification because Cecil's build, cache, and output transformations can affect the final HTML.

**Why it matters:** A correct-looking Twig template can still produce unexpected minified HTML or stale output.

**Decision:** After SEO/template changes, rebuild and inspect the actual `_site` HTML, including structured data and critical meta/link attributes.

---

### 2026-08-28 — LLM output has four distinct published surfaces

**Insight:** The site exposes LLM-oriented content through root EN/FR `llms.txt`, a blog-section `llms.txt`, and per-page `feed.md` output.

**Why it matters:** These outputs have different scopes and should not be treated as interchangeable.

**Decision:** Keep the four generated surfaces validated together with the project's `validate-llmstxt` workflow.

---

### 2026-08-28 — Social announcements happen only after deployment verification

**Insight:** A new article should not be announced until the GitHub Pages deployment has succeeded and the live URL responds.

**Why it matters:** Publishing social links before deployment can create dead links or announce content that is not yet publicly reachable.

**Decision:** Deployment success and live URL verification are prerequisites for social publication. Announcements are bilingual and published once per article.

---

## Retired / obsolete insights

Move superseded knowledge here instead of silently deleting it when the historical reason is useful.

---

### 2026-09-02 — Bluesky browser automation: composer dialog elements are at the end of truncated snapshots

**Insight:** The Bluesky web composer uses a `contenteditable` paragraph element (not a standard `<textarea>` or `<input>`). The `type` tool works on it, but the snapshot output is always truncated and the dialog elements (`Poster` button, `Annuler`, paragraph) appear at the very end of the saved output file.

**Why it matters:** After typing text into the composer, the snapshot is too large to display inline, so the dialog refs are never visible in the tool response. You must `grep` the saved output file (e.g. `rg -n "dialog|Poster|Annuler|paragraph" <saved-file>`) to find the current ref for the "Poster" button before clicking it. The ref changes between snapshots (e.g. `s7e3814` → `s10e3814` → `s11e3814`) so never cache a previous ref.

**Evidence / verification:** Confirmed during social media publishing for the `symfony-session-vs-http-cache` article. Each time the composer was opened and text typed, the Poster button had a different ref.

**Decision:** When posting on Bluesky via browser automation:
1. After typing, run `rg -n "dialog|Poster|Annuler|paragraph" <saved-output-file>` to find the current `Poster` ref
2. Click the `Poster` ref from the grep results (not a cached one)
3. Wait 2-3 seconds after typing for link previews to load
4. Verify success by checking that the dialog disappears from the next snapshot
5. The `type` tool works on the contenteditable paragraph — use it with `submit: false`

---

### 2026-09-02 — LinkedIn posting via browser automation (browsermcp)

**Insight:** LinkedIn has no MCP post-creation capability, but browser automation works for posting. The feed "Commencer un post" button element is intermittent — sometimes it throws "Unable to get parent" errors. The workaround is: navigate to the profile page first, then click "Accueil" to return to the feed. This makes the "Commencer un post" button clickable again. The post composer dialog (textbox with "Donnez votre avis…") works reliably for `type` and the "Publier" button works for publishing. The link preview loads asynchronously ("Chargement de l'aperçu…") — wait ~3 seconds after typing before clicking publish.

**Why it matters:** LinkedIn can now be automated for post publishing, completing the social media publishing workflow for this project.

**Evidence / verification:** Confirmed during social media publishing for the `symfony-session-vs-http-cache` article. Both FR and EN posts were published successfully via browsermcp.

**Decision:** LinkedIn posting workflow:
1. Navigate to profile page (`/in/kevin-therage/`)
2. Click "Accueil" to go to feed
3. Click "Commencer un post" on the feed
4. Type text into the editor textbox (`submit: false`)
5. Wait 3 seconds for link preview to load
6. Click "Publier"
7. Verify "Le post a bien été publié" alert

**Known blockers and workarounds:**
- **"Unable to get parent" on feed "Commencer un post"**: The button is intermittently non-interactable from the feed. Fix: navigate to profile page first, then click "Accueil" to return to feed — this resets the feed state and makes the button clickable.
- **Post dialog closes after navigating away**: Any page navigation (e.g. fetching text from Mastodon) closes the dialog. Fix: reopen via profile → Accueil → "Commencer un post" cycle.
- **Async link preview**: "Chargement de l'aperçu…" must finish before publishing. Fix: wait 3 seconds after typing.
- **Mastodon visibility resets to "Abonnés"**: After each publish, visibility defaults to private. Fix: manually set to "Public" each time.

---

### 2026-09-04 — E2E tests run via npx with Cucumber.js (not Docker, not Playwright Test)

**Insight:** E2E tests use Cucumber.js (`npx cucumber-js`) as the test runner with Playwright as the browser engine. No Dockerfile needed. The `--ui` mode still uses Playwright Test (`npx playwright test --ui`) on port 9333 for interactive debugging.

**Why it matters:** The Gherkin feature files are the source of truth. Cucumber.js interprets them with strict semantic conventions that must be followed.

**Decision:** Use `make test-e2e` (headless, cucumber-js) and `make test-e2e-ui` (interactive, playwright --ui). CI uses `actions/setup-node` + `npx playwright install --with-deps chromium`.

---

### 2026-09-07 — Gherkin conventions: strict Given → When → Then flow

**Insight:** All `.feature` files follow strict one-directional Gherkin semantics:
- **`Given`** = preconditions/state (page already loaded, state captured)
- **`When`** = actions (navigation as the test action, clicks, form submissions)
- **`Then`** = assertions, and every `Then` step **must contain the word "should"**
- **`And`** continues the previous step type (Given, When, or Then)
- Never go backwards: `When → Given` is forbidden

**Why it matters:** These conventions ensure feature files are readable, consistent, and transposable across frameworks (Cucumber.js, Behat, SpecFlow). Breaking the flow (e.g. `Given` after `When`) causes confusion and violates BDD best practices.

**Evidence / verification:** Established during E2E test migration from Playwright Test to Cucumber.js. Verified across 41 scenarios / 239 steps.

**Decision:** All new feature files must follow these conventions. A Gherkin skill has been created at `~/.config/opencode/skills/gherkin/SKILL.md` encoding these rules for any future agent work.

