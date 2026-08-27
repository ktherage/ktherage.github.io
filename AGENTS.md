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

## Quirks
- `pages.sections.nested: true` is on; each year sub-section index MUST set `layout: blog/list`, or it falls back to the default list template (no tag cloud / breadcrumb).
- Breadcrumbs render only on article pages via `layouts/partials/breadcrumb.html.twig` (first child of `<article>`), built from `page.ancestors`; order is breadcrumb → tags → cover → title → date.
- JSON-LD `BreadcrumbList` is overridden in `layouts/partials/jsonld.js.twig` to include Home + all ancestors; the native Cecil template only emits the top section.
- `cecil.dev.yml` imports `cecil.yml`, so prod config (nested sections, languages) also applies in dev.

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
