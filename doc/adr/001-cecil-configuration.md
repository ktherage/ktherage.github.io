# 001. Cecil configuration conventions

## Status

Accepted

## Context

Cecil 9.0.1 has several configuration keys that are silently ignored, and its non-standard behaviors require project-specific conventions to avoid misconfigurations.

## Decision

### Ignored configuration keys

The following Cecil configuration keys are **not recognized** and are silently ignored:

- `optimize.gzip`
- Top-level `feeds:` block
- Top-level `locale:` key

Do not reintroduce these keys.

### Feeds

Feeds are configured through Cecil's `output.formats`, `output.pagetypeformats`, and `output.rss` — not through a top-level `feeds:` block.

### Locale

Locale is defined through `languages[].locale`, not a top-level `locale:` key.

### `baseurl`

`baseurl: "https://ktherage.github.io"` is used as a full URL (not a path) and works because `canonicalurl: true` is enabled. Do not normalize this value without rebuilding and checking canonical output.

### `social`

The `social` configuration must be a keyed map by network (`twitter`, `mastodon`, `facebook`, etc.) — not a flat list. Cecil's metatag generation expects paths like `site.social.twitter.site`, `site.social.mastodon.creator`, and `site.social.facebook.id`.

### Translation catalogs

Catalog filenames are coupled to Cecil locales under `languages[].locale`. If the configured locale and catalog filename diverge, translation keys leak into the rendered site. Keep locale/catalog pairs synchronized:

- `en_US` ↔ `messages.en_US.yaml`
- `fr_FR` ↔ `messages.fr_FR.yaml`

## Consequences

- Configuration must be verified against Cecil source and before/after builds, not assumed from documentation
- `diff -rq _site` is the canonical way to verify configuration changes
