# 008. Vendor CSS/JS bypass the asset pipeline

## Status

Accepted

## Context

Third-party libraries live in `static/vendor/<name>-<version>/`
(`bootstrap-5.3.8`, `fontawesome-7.3.1`, `highlightjs-11.12.0`,
`mermaid-11.17.2`) and are already minified upstream. Templates referenced them
with `asset('vendor/…')`.

Cecil treats `static/` both as a verbatim copy directory **and** as an asset root:
`asset('vendor/x.css')` emitted a hashed copy
(`/vendor/x.<hash>.css`) next to the plain one that `static/` already publishes.
`_site/vendor/` ended up with 15 files for 10 sources (~500 KB of duplicates):
the HTML referenced the hashed copy while the plain copy was still published.

Font Awesome rules out the obvious dedup fix: `all.min.css` resolves its webfonts
through relative `webfonts/*.woff2` URLs, and only the verbatim copy publishes
that directory — the fonts are not referenced by any template, so nothing
fingerprints them.

## Stack at decision time

- PHP 8.5 (CI), Node 22
- Cecil 9.11.0 (pinned in `deploy.yml`), Twig 3.30.0 bundled in `cecil.phar`
- Symfony `http-client` 8.1.7, `symfony/yaml` 8.1.6 (`composer.lock`)
- Bootstrap 5.3.8, Font Awesome 7.3.1, Highlight.js 11.12.0, Mermaid 11.17.2 (`static/vendor/`)
- Cucumber `^13.2.1`, Playwright `1.62.1`
- No Cecil theme (`theme: null`)

## Decision

- Reference vendor files with `url('vendor/…')`, never `asset('vendor/…')`
  (7 references across `layouts/_default/page.html.twig` and
  `layouts/blog/page.html.twig`: Bootstrap CSS + bundle, Font Awesome CSS,
  Highlight.js CSS + JS, Mermaid).
- Keep `asset()` for `assets/` files (site CSS, JS, images) where the pipeline's
  content hash is wanted.
- Cache-busting comes from the version in the directory name; upgrading a library
  means adding a new directory, not rewriting a file in place.
- Load order is unchanged: vendor CSS before site CSS so custom rules override
  (`layouts/_default/page.html.twig`); the Font Awesome tree is published
  untouched so the relative webfont URLs keep resolving.
- Rejected: excluding `static/vendor` from the verbatim copy to keep the hashed
  output — nothing fingerprints the webfonts, so the icons would 404.
- Rejected: importing vendor CSS into the pipeline — the files are already
  minified, and Font Awesome's relative font URLs would need rewriting.

## Consequences

- One copy per vendor file: `_site/vendor/` drops from 15 files to 10, matching
  the 10 sources; the hashed duplicates are gone.
- No content hash on vendor URLs. Rewriting a file inside an existing version
  directory would not bust browser caches; this is accepted because a real
  upgrade changes the directory name.
- `url()` renders absolute URLs from `baseurl` (`https://ktherage.github.io/vendor/…`);
  `cecil.dev.yml` overrides `baseurl` with `http://localhost`, so `serve` loads
  the local copies.
- Verified: Font Awesome glyphs still resolve (computed
  `font-family: "Font Awesome 7 Free"`), Bootstrap's global and Highlight.js load,
  and `make test-e2e` stays green.
