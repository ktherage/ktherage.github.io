# ktherage.github.io

[![Deploy](https://github.com/ktherage/ktherage.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/ktherage/ktherage.github.io/actions/workflows/deploy.yml)
[![Lint](https://github.com/ktherage/ktherage.github.io/actions/workflows/lint.yml/badge.svg)](https://github.com/ktherage/ktherage.github.io/actions/workflows/lint.yml)
[![E2E](https://github.com/ktherage/ktherage.github.io/actions/workflows/e2e.yml/badge.svg)](https://github.com/ktherage/ktherage.github.io/actions/workflows/e2e.yml)
[![PHP 8.5+](https://img.shields.io/badge/php-8.5%2B-8892BF.svg)](https://www.php.net/)
[![Cecil](https://img.shields.io/badge/cecil-9.x-567DAB.svg)](https://cecil.app/)
[![License](https://img.shields.io/badge/license-Custom-blue.svg)](#license)

Personal website and technical blog of [Kévin THÉRAGE](https://ktherage.github.io) — Symfony Lead Developer, Expert Symfony 7 Certified.

Built with [Cecil](https://cecil.app/) (PHP static site generator), Twig, and Bootstrap. Bilingual EN/FR. Deploys to GitHub Pages from `main`.

## Prerequisites

- PHP 8.5+
- Node.js 22+
- [Cecil](https://cecil.app/) (`php cecil.phar`)
- Composer (for PHP linting tools)

## Quick start

```bash
# Build the site
make build

# Start dev server with watcher
make dev

# Open http://localhost:8080
```

## Project structure

```
├── cecil.yml               # Cecil configuration
├── pages/                  # Content (Markdown)
│   ├── index.md            # Homepage (EN)
│   ├── index.fr.md         # Homepage (FR)
│   ├── about-me.md         # About page
│   ├── legal.md            # Legal notices
│   └── blog/               # Blog posts by year
│       └── 2026/
│           ├── my-post.md
│           └── my-post.fr.md
├── layouts/                # Twig templates
├── assets/                 # Pipeline-managed (CSS, JS, images)
├── static/                 # Verbatim-copied (fonts, favicons)
├── translations/           # i18n catalogs (EN/FR)
├── data/                   # YAML data files
├── extensions/             # Custom Cecil extensions
├── tests/                  # E2E tests (Gherkin + Cucumber.js)
│   ├── features/           # .feature files
│   ├── steps/              # Step definitions
│   └── support/            # World class & hooks
├── doc/adr/                # Architecture Decision Records
└── .github/workflows/      # CI/CD
```

## Content conventions

- Posts live in `pages/blog/<year>/<slug>.md`
- French translations: same slug, same year folder — `<slug>.fr.md`
- URLs: `/blog/<year>/<slug>/` — slugs use hyphens, never underscores
- Required frontmatter: `title`, `date`, `description`, `cover`, `published`, `tags`, `excerpt`
- When a URL changes: add `alias: /old/url/` (Cecil generates meta-refresh redirects for GitHub Pages)

## Commands

| Command | Description |
|---------|-------------|
| `make build` | Clear cache + build site to `_site/` |
| `make dev` | Dev server with watcher on `localhost:8080` |
| `make lint` | Twig lint + HTML structural checks |
| `make test-e2e` | Run E2E tests (headless, Cucumber.js) |
| `make test-e2e-ui` | Open Playwright UI on `localhost:9333` |
| `make validate-llmstxt` | Validate LLM feed files |
| `make banner` | Regenerate banner PNG from SVG |

## E2E testing

Tests use [Cucumber.js](https://cucumber.io/) with [Playwright](https://playwright.dev/) as the browser engine, interpreting Gherkin `.feature` files.

```bash
# Run all tests
make test-e2e

# Run specific feature
npx cucumber-js tests/features/theme-toggle.feature

# Interactive UI mode
make test-e2e-ui
```

Feature files follow strict Gherkin conventions:
- **`Given`** = preconditions / state
- **`When`** = actions
- **`Then`** = assertions (must contain "should")
- **`And`** continues the previous step type

## CI/CD

Three GitHub Actions workflows:

- **`deploy.yml`** — Build + deploy to GitHub Pages on push to `main`
- **`lint.yml`** — Twig lint + HTML structural checks
- **`e2e.yml`** — E2E tests via Cucumber.js + Playwright

All workflows require PHP 8.5+ and Node.js 22+.

## Architecture decisions

ADRs are stored in [`doc/adr/`](doc/adr/) using the [log4brains](https://github.com/thomvaill/log4brains) format:

| ADR | Title |
|-----|-------|
| [001](doc/adr/001-cecil-configuration.md) | Cecil configuration conventions |
| [002](doc/adr/002-twig-template-conventions.md) | Twig template conventions |
| [003](doc/adr/003-e2e-test-architecture.md) | E2E test architecture |
| [004](doc/adr/004-deployment-and-seo.md) | Deployment and SEO |
| [005](doc/adr/005-social-media-publishing.md) | Social media publishing |

## License

Personal website — all rights reserved.
