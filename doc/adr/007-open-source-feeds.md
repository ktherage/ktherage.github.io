# ADR-007: Open Source section feeds (rss/atom/json)

## Status

Accepted.

## Context

The `/open-source/` section exposes merged PRs fetched from GitHub at build time
(see ADR-006). The section page is type `page` (no sub-pages), so
`pagetypeformats.page: [html, md]` gives it no feeds. We want RSS/Atom/JSON feeds
for the section itself, without touching the blog/homepage feeds (chacun chez soi).

## Decision

- Frontmatter override `output: [html, md, rss, atom, json]` on
  `pages/open-source.md` + `pages/open-source.fr.md` (per-page `output` wins over
  `pagetypeformats`, cf. `Step\Pages\Render::getOutputFormats()`). `md` is kept to
  preserve the existing `/open-source/feed.md` URL.
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
- `merged_at` enrichment: when `GITHUB_TOKEN` is set, the fetcher resolves each PR's
  full ISO8601 timestamp via one extra `GET /repos/{owner}/{repo}/pulls/{number}`
  call (isolated in `GitHubPullRequestEnricher`, silent fallback to date-only).
  Enrichment code lives in its own class to stay under the Mago cyclomatic-complexity
  threshold (verified: `mago lint` clean).
- EN+FR feeds carry identical items (titles sourced from GitHub, English) — assumed.
- Validation: `lint-html` runs `xmllint --noout` on all `_site/**/*.xml` and
  `jq empty` on all `_site/**/*.json`; E2E parses the Atom/JSON feeds and asserts a
  known PR entry.

## Consequences

- Section feeds parity with blog/homepage conventions; homepage/blog feeds untouched.
- `xmllint` (`libxml2-utils`) and `jq` are now required for `make lint` (both
  preinstalled on GitHub-hosted runners).
- Subscribe buttons (Atom/RSS/JSON, canonical URLs) on the section page for discovery.
