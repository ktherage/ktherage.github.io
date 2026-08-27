# ktherage.github.io

**ALWAYS** stay within the current working directory. Never navigate outside project root.

## Commands
- Build: `php cecil.phar clear && php cecil.phar build` (or `make build`)
- Dev server (with watcher): `php cecil.phar serve --config=cecil.dev.yml` (or `make dev`)
- Clear cache: `php cecil.phar clear` (or `make clear`)
- Regenerate banner PNG from SVG: `make banner`
- Update Cecil: `php cecil.phar self-update`

## Structure
- `pages/blog/<year>/<slug>.md` - Blog posts (no date in filename); `<slug>.fr.md` is the French translation (same slug, same year folder).
- `pages/blog/<year>/index.md` (+ `index.fr.md`) - Year section landing page; requires `layout: blog/list` (nested sub-sections do NOT inherit the parent blog template automatically).
- `pages/about-me.md`, `pages/legal.md` - Static pages (with `.fr.md` translations).
- `layouts/` - Twig templates that override Cecil core (e.g. `layouts/partials/jsonld.js.twig`, `breadcrumb.html.twig`).
- `assets/img/` - Images; `static/` holds SVG sources (e.g. `bannier.svg`).

## Content
Frontmatter required: `title`, `date` (YYYY-MM-DD), `description`, `cover`, `published`, `tags`, `excerpt`
Optional: `updated` (set when edited), `slug`, `alias` (old URL(s) to redirect from), `repository`

## Conventions
- Blog URLs are `/blog/<year>/<slug>/` (nested sub-sections enabled via `pages.sections.nested: true`); slug uses hyphens, never underscores.
- Keep en/fr versions in sync (same slug, date, tags, year folder).
- Posts sorted by `date` descending; set `updated` when edited.
- When a post URL changes, add `alias: /old/url/` to preserve it: Cecil emits a soft meta-refresh redirect + canonical (GitHub Pages has no server-side 301).
- Verify after content changes: rebuild, then check `_site/blog/` (nested URLs, descending date order, RSS).

### Front-end
- **Structured data (JSON-LD)**: emitted by Cecil built-in via `layouts/partials/jsonld.js.twig` only (`metatags.data: true` in `cecil.yml`). Never add a second `<script type="application/ld+json">` block (the old `jsonld.html.twig` was removed). The `Person` node lives inside `jsonld.js.twig`; keep `@context` as `https://schema.org` (not `http://`).
- **Landmarks**: `_default/page.html.twig` already wraps content in a single `<main>`. Child templates (`blog/page`, `legal`, `blog/list`, …) MUST NOT add another `<main>` — use a `<div>` for wrapper classes.
- **Bootstrap**: do not fight the framework with `!important` to override components; theme via Bootstrap CSS variables under `[data-bs-theme]` (e.g. `--bs-link-color`, `--bs-btn-bg`). Avoid inline `style=`; prefer Bootstrap utilities or CSS classes in `assets/css/`.
- **Navigation controls** (theme toggle, feeds): render as `<button type="button">`, never `<a href="#">`.
- **Design intent (do not regress)**: buttons are intentionally transparent/outline (uniform black & white theme); bold is reserved for in-article links only (`.blog-content a`).
- **Assets**: vendor assets are self-hosted under `static/vendor/`; fonts should be WOFF2 served via `asset()` (not absolute `/fonts/...`).

## Quirks
- `pages.sections.nested: true` is on; each year sub-section index MUST set `layout: blog/list`, or it falls back to the default list template (no tag cloud / breadcrumb).
- Breadcrumbs render only on article pages via `layouts/partials/breadcrumb.html.twig` (first child of `<article>`), built from `page.ancestors`; order is breadcrumb → tags → cover → title → date.
- JSON-LD `BreadcrumbList` is overridden in `layouts/partials/jsonld.js.twig` to include Home + all ancestors; the native Cecil template only emits the top section.
- The tag-filter on `blog/list` (and `assets/js/blog/tag-filter.js`) uses `<button>` badges with `aria-pressed` + an `aria-live="polite"` region; keep it keyboard/screen-reader accessible when editing.
- `cecil.dev.yml` imports `cecil.yml`, so prod config (nested sections, languages) also applies in dev.

## SEO
- **JSON-LD dates**: in `layouts/partials/jsonld.js.twig`, format dates with Twig `date('c')` (valid ISO 8601). Do **NOT** use `date('Y-m-d\TH:i:sP')` — the `\T` is stripped by Twig/PHP, yielding an invalid `...UTC00:00:00+00:00` timestamp that makes Google drop `NewsArticle`/`VideoObject` rich results. The `Blog` block already uses `date('c')`.
- **`social` config must be a map**, not a list: `cecil.yml` `social:` should be keyed by network (`twitter:`, `mastodon:`, `facebook:`), each carrying `site`/`creator`/`id` as needed. Cecil's metatags read `site.social.twitter.site`, `site.social.mastodon.creator`, `site.social.facebook.id`. Keep `name`/`icon`/`url` on every entry — the homepage social section iterates `site.social` by those keys. A flat list breaks Twitter/Mastodon/Facebook metatags. No root-level `twitter:` key (non-standard).
- **No `author.email`/`telephone` in `NewsArticle` JSON-LD**: the address is intentionally obfuscated as `[at]` in prose; leaking it in structured data is invalid and scrape-bait.
- **Drop the deprecated `meta name="keywords"`** (emitted in `layouts/partials/metatags.html.twig`) — zero SEO value.
- **Locale ↔ translation catalog coupling**: the translation catalog `translations/messages.<locale>.yaml` MUST match the per-language `locale` set in the `languages` config (currently `en_US` → `messages.en_US.yaml`, `fr_FR` → `messages.fr_FR.yaml`). Changing one without the other breaks ALL translations (raw keys leak, e.g. `site_name`), because Cecil loads catalogs by locale. Prefer a valid BCP-47/OG locale (`en_US`, not `en_EN`) and rename the catalog file to match — do not leave them out of sync.
- After any SEO/template change, **rebuild and verify the actual `_site` HTML** (minified, unquoted attributes). Grep for `datePublished`, `twitter:site`, `fediverse:creator`, `rel=me`, etc. — don't trust the template alone (cache/Cecil can mask a change). Confirm non-standard config against Context7 before assuming it is idiomatic Cecil.

## Stack
- Cecil v9.x (9.0.1), Twig, Bootstrap 5.3.7, Font Awesome 6.7.2, Highlight.js 11.11.1
- PHP 8.5, Docker, Docker Compose

## Commits
- Never add a `Co-Authored-By` trailer (or any AI attribution) to commit messages.

## Social announcements
When a **new** article is created (both `pages/blog/<year>/<slug>.md` and `pages/blog/<year>/<slug>.fr.md`) **and** deployed:
- Wait for the GitHub Pages deploy to finish first: after pushing to `main`, check the `Deploy Cecil site to GitHub Pages` workflow succeeded (`gh run list --workflow=deploy.yml` / `gh run watch`), then verify the live URL responds.
- Then announce the article on X, Bluesky, LinkedIn and Mastodon — in French **and** English (one post per language per platform).
- Post content: a catchy one-liner hook about the article (not just its title) in a **professional tone** — clear, factual, no hype or clickbait, no emojis — then the link `https://ktherage.github.io/blog/<year>/<slug>/`, plus hashtags from the tags. Keep each platform's character limit.
- Use the browser MCP to publish (X: compose/post dialog; Bluesky/Mastodon/LinkedIn: their web composers).
- If the browser MCP is not connected, or a platform requires login or blocks with an auth challenge (2FA, verification code, captcha), stop, tell the user what is blocking and **wait** for explicit go-ahead — never attempt to handle credentials or codes alone.
- Announce only once per article; never announce drafts (`published: false`).

## Working with the user
- The user is Kévin THÉRAGE, a Symfony Lead Developer (Expert Symfony 7 Certified). He is comfortable with deep technical SEO / structured-data detail — no need to simplify explanations.
- Communicates in French and runs a bilingual EN/FR site; keep EN/FR content in sync and reply concisely.
- Workflow: he asks for a "roast" (critique + fix plan) first, then says "go" to execute. Do not edit code until he approves.
- He expects non-standard config to be verified against authoritative sources (Context7 / docs) rather than assumed idiomatic Cecil. When in doubt, check the docs.
- He values verifying changes against the actual rebuilt `_site` output, not just the templates (see SEO section).
- He likes durable, reusable notes persisted in this file for future sessions.
