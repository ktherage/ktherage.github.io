# 006. Open Source contributions section

## Status

Accepted

## Context

The site needs an "Open Source" section showcasing merged pull requests authored by ktherage on third-party public repositories. The data must refresh automatically (weekly + on demand) without manual curation, work identically in local builds and CI, and never break the build when the GitHub API is unreachable.

## Decision

### Cecil custom Generator (build-hooked)

A custom generator `Cecil\Generator\OssContributions` (`extensions/Cecil/Generator/OssContributions.php`, registered at `pages.generators: 100`) injects a `contributions` variable into the `open-source` pages (EN + FR) during the "Generating pages" step. No workflow pre-step, no Makefile wrapper: **any** `cecil build` refreshes the data when stale.

This was chosen over a standalone pre-build script because Cecil offers no pre/post-build hook system — generators (verified against Cecil 9.4.2 source: `Builder::STEPS`, `Step\Pages\Generate`, `GeneratorManager`) are the only sanctioned way to run custom logic inside the build. A standalone script would have required duplicating the invocation in every build entrypoint (Makefile, deploy.yml, e2e.yml).

### HTTP + YAML via Symfony components

Fetching uses `symfony/http-client`, serialization uses `symfony/yaml` (project `vendor/`, loaded by the generator with a guarded `require`). Data source: `GET /search/issues?q=author:ktherage+type:pr+is:merged`, own repositories excluded, project icons via `https://github.com/<owner>.png` (avatar redirect, zero extra API calls). `merged_at` is present directly in search results — no per-PR fetch.

### Single cache file with TTL

`data/oss-contributions.yaml` is the only file touched: written on successful fetch, read when fresh (TTL 7 days), kept stale as fallback on API failure, `OSS_REFRESH=1` forces a refresh. Auth via `GITHUB_TOKEN` env var (passed to the build steps in CI); anonymous access works with lower rate limits.

### Templates mirror the blog listing

`layouts/open-source.html.twig` + `layouts/partials/oss-card.html.twig` reuse the blog card structure (`post-card.html.twig`): project avatar (Font Awesome fallback), repo badge, PR title, merge date, and links pointing to the PR (`target="_blank" rel="noopener"`). Per project Twig conventions: attribute interpolation of external data uses `|e('html_attr')` (double quotes are not escaped by default here and break the HTML minifier).

## Consequences

- Local builds, `serve` rebuilds, and CI all share the same refresh path; `composer install` is required before build (CI steps added).
- Weekly freshness comes from the `schedule` trigger on `deploy.yml`, not from Cecil (no cron/scheduler exists in Cecil 9.4.2 — verified via docs and `cecil.phar list`).
- PHP code style enforced with Mago (`mago lint` + `mago format` clean); Mago itself kept current via `mago self-update`.
