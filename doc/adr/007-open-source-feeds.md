# 007. Open Source section feeds (RSS/Atom/JSON)

## Status

Accepted

## Context

The `/open-source/` section exposes merged PRs fetched from GitHub at build time
(see ADR-006). The section page is type `page` (no sub-pages), so
`pagetypeformats.page: [html, md]` gives it no feeds. We want RSS/Atom/JSON feeds
for the section itself, without changing the blog/homepage feeds.

## Stack at decision time

- PHP 8.5 (CI), Node 22
- Cecil 9.11.0 (pinned in `deploy.yml`), Twig bundled
- Symfony `http-client ^8.1`, `symfony/yaml ^8.1`
- Bootstrap 5.3.8, Font Awesome 7.3.1, Highlight.js 11.12.0, Mermaid 11.17.2 (`static/vendor/`)
- Cucumber `^13.2.1`, Playwright `1.62.1`

## Decision

- Frontmatter override `output: [html, md, rss, atom, json]` on
  `pages/open-source.md` + `pages/open-source.fr.md` (per-page `output` wins over
  `pagetypeformats`, cf. `Step\Pages\Render::getOutputFormats()`). `md` is kept for
  the existing `/open-source/feed.md` URL only: it is the generic page markdown
  (title + body), not a contribution listing, yet the page advertises it as an
  alternate.
- Three feed templates `layouts/_default/open-source.{atom,rss,json}.twig` (first
  lookup candidate for a `page`-type layout override, cf. `Renderer\Layout::lookup()`).
  They extend `extended/feed.twig` like the built-in `list.*` templates (inheriting
  `title`/`lang`/`updated`) but loop over the raw `page.contributions` array, with
  entries linking directly to the GitHub PR URL. File naming (`atom.xml`, `feed.xml`,
  `feed.json`) and `rel=alternate` discovery follow the existing `formats`/`alternates`
  conventions untouched.
- Rejected: virtual sub-pages per PR — `PagesCollection::showable()` excludes
  `isVirtual()` pages, so they would never reach any feed; non-virtual ghost pages
  would instead pollute the sitemap and the main `/atom.xml` feed.
- `merged_at`: read straight from the search response (`pull_request.merged_at`),
  which already carries the full ISO8601 timestamp. The former per-PR
  `GitHubPullRequestEnricher` (one `GET /repos/{owner}/{repo}/pulls/{number}` per
  contribution) was removed in 2026-10 as redundant.
- Cache: `data/oss-contributions.yaml` is committed so a failed fetch falls back
  to the last known data instead of an empty section; CI sets `OSS_REFRESH=1`
  because a fresh checkout resets the cache file mtime (which would otherwise look
  fresh forever), then commits the refreshed file back on `main` so the fallback
  does not drift. The commit-back needs a job-scoped `contents: write` permission
  and is skipped on pull requests.
- Validation: `lint-html` runs `xmllint --noout` on all `_site/**/*.xml` and
  `jq empty` on all `_site/**/*.json`; E2E parses the Atom/JSON feeds and asserts a
  known PR entry.

## Consequences

- Section feeds parity with blog/homepage conventions; homepage/blog feeds untouched.
- `xmllint` (`libxml2-utils`) and `jq` are now required for `make lint` (both
  preinstalled on GitHub-hosted runners).
- Subscribe buttons (Atom/RSS/JSON, canonical URLs) on the section page for discovery.
- EN and FR feeds carry the same items: contribution titles come from GitHub and
  stay in English in both languages, by design.
- `<updated>`/`lastBuildDate` are inherited from `extended/feed.twig` and reflect
  the build time, not the latest `merged_at` — feeds look refreshed on every deploy.
