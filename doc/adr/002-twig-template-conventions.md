# 002. Twig template conventions

## Status

Accepted

## Context

Cecil's Twig environment has several constraints that differ from standard Twig: protected properties on Page objects, restricted `site.pages` access, missing operators, and template inheritance quirks.

## Decision

### Page properties

On a Cecil `Page` object, `item.url`, `item.id`, and `item.path` are protected. Use the `url(item)` Twig function when a page URL is required.

### `site.pages` vs `page.pages`

`site.pages` is not generally safe in Twig — it exposes protected properties when iterating. Prefer `page.pages` in normal templates. The homepage JSON-LD template is a documented exception.

### Homepage page identification

On the homepage, `page.pages` contains leaf pages (blog posts, `about-me`, `legal`), not blog year sections. Identify blog posts through their generated URL using a `/blog/` match that works for both EN and FR paths.

### Missing Twig features

- `contains` operator is unavailable — use `matches`, `starts with`, or `ends with`
- `{% for x in y if condition %}` is unsupported — use a normal `for` loop with an explicit `{% if %}`

### LLM templates

Including `_default/list.llms.twig` from an `.llms.twig` template does not produce expected rendered content. Keep required content duplicated in `home.llms.twig` rather than relying on `{% include %}`.

### Font serving

Font files live under `static/fonts/` and are copied verbatim to `/fonts/...`. They are not managed through Cecil's asset pipeline. Keep absolute `/fonts/*.woff2` preload paths in `layouts/_default/page.html.twig` — do not replace with `asset()`.

### JSON-LD date formatting

Use `date('c')` for ISO 8601 dates in JSON-LD. The format `date('Y-m-d\TH:i:sP')` causes the `T` to be stripped in this Twig/PHP environment.

### Year blog section layout

With nested sections enabled, a year's `index.md` does not automatically inherit the parent blog list template. Every year section index must explicitly set `layout: blog/list`.

## Consequences

- Template inspection alone is insufficient — after changes, rebuild and inspect `_site` HTML
- `date('c')` is the canonical ISO 8601 formatter for this project
- Absolute font paths must not be refactored to use Cecil's asset pipeline
