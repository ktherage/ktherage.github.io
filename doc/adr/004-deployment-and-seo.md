# 004. Deployment and SEO

## Status

Accepted

## Context

The site deploys to GitHub Pages from `main`. GitHub Pages does not provide server-side redirects, and SEO/structured-data must be verified against the actual generated output.

## Decision

### Redirects via Cecil aliases

When a published post URL changes, add `alias: /old/url/` in the frontmatter. Cecil generates the redirect mechanism that GitHub Pages serves. Verify the generated redirect/canonical behavior after changes.

### SEO verification against `_site`

Template inspection alone is insufficient for SEO/structured-data verification. Cecil's build, cache, and output transformations can affect the final HTML. After SEO/template changes:

1. Rebuild the site (`php cecil.phar clear && php cecil.phar build`)
2. Inspect the actual `_site` HTML
3. Verify structured data, critical meta/link attributes, and canonical URLs

### Structured data rules

- Use `date('c')` for ISO 8601 dates in JSON-LD
- Do not add `author.email` or `telephone` to `NewsArticle` JSON-LD
- `meta keywords` has no SEO value — do not emit it

### LLM output surfaces

The site exposes four LLM-oriented content surfaces:

1. Root `llms.txt` (EN)
2. Root `llms.txt` (FR)
3. Blog-section `llms.txt`
4. Per-page `feed.md` output

These have different scopes and must be validated together with the `validate-llmstxt` workflow.

## Consequences

- All URL changes require aliases — no server-side 301s available
- SEO changes require a full build + inspect cycle
- LLM feed validation is part of the CI pipeline
