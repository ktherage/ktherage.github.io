# AGENTS.md

## Project

This is a bilingual (EN/FR) static site for Kévin THÉRAGE, built with **Cecil** (SSG, PHP), Twig, Bootstrap. Blog posts are in Markdown under `pages/`; the site deploys to GitHub Pages from `main`.

**Operational facts below are what an agent must not get wrong.** Deep technical gotchas (Twig/Cecil quirks, SEO/JSON-LD rules, verified config) live in `MEMORY.md` — read it before touching templates, SEO, or `cecil.yml`.

## Commands
- Build: `php cecil.phar clear && php cecil.phar build` (or `make build`) — `clear` is required on cache-sensitive changes
- Dev server (with watcher): `make dev` (`php cecil.phar serve --config=cecil.dev.yml`)
- Lint: `make lint-twig` (Twig, via `twig-cs-fixer.phar`) and `make lint` (also builds + checks HTML: exactly one `application/ld+json`, one `<main>`, no `<a href="#">`)
- Validate LLM feed: `make validate-llmstxt` (builds, then parses the 4 `llms.txt` with the official Answer.AI `llms_txt2ctx`; install: `pip install llms-txt`)
- CI runs the same Twig lint + HTML checks (`lint.yml`) and deploys on push to `main` (`deploy.yml`); both require PHP 8.5
- Regenerate banner PNG from SVG: `make banner`

## Structure
- `pages/blog/<year>/<slug>.md` — blog post (no date in filename); `<slug>.fr.md` is the French translation (same slug, same year folder)
- `pages/blog/<year>/index.md` (+ `index.fr.md`) — year landing page; MUST set `layout: blog/list` (nested sub-sections do not inherit the parent template)
- `pages/about-me.md`, `pages/legal.md` — static pages (with `.fr.md`)
- `layouts/` — Twig templates; `layouts/taxonomy/` — tag/tags templates; `translations/` — catalogs (`messages.en_US.yaml`, `messages.fr_FR.yaml`)
- `data/tag-icons.yaml` — icon map used by the `/tags/` index
- `extensions/Cecil/Renderer/PostProcessor/BootstrapAlerts.php` — custom post-processor (converts `.note` asides to Bootstrap alerts)
- `static/` — verbatim-copied assets (fonts, vendor, favicons); `assets/` — pipeline-managed (CSS, JS, images)
- `.github/workflows/` — `deploy.yml` (build+deploy), `lint.yml`

## Content (frontmatter)
Required: `title`, `date` (YYYY-MM-DD), `description`, `cover`, `published`, `tags`, `excerpt`
Optional: `updated` (>= `date`), `slug`, `alias` (old URL(s) to preserve), `repository` (renders a GitHub callout box), `comments` (default `true`; set `false` to disable Giscus)

`cover`: either a string (image path) or a map with `image`, `alt`, optional `caption`. `cover.alt` feeds `og:image:alt` — write a real description, not the title.

Conventions:
- URLs are `/blog/<year>/<slug>/`; slugs use hyphens, never underscores
- Keep EN/FR in sync (same slug, date, tags, year folder); posts sorted by `date` descending
- When a post URL changes, add `alias: /old/url/` (GitHub Pages has no server-side 301; Cecil emits a meta-refresh redirect)
- Verify after content changes: rebuild, check `_site/blog/` (nested URLs, descending date, RSS)

## Working with the user
- The user is a Symfony Lead Developer (roast-then-**go** workflow, see §2) running a bilingual EN/FR site — keep the two languages in sync and reply concisely (see §8).
- Non-standard config must be verified against authoritative sources (Context7 / docs), not assumed idiomatic Cecil (see §4).
- Never add a `Co-Authored-By` trailer, or any AI attribution, to commit messages unless explicitly requested (see §3).

---

## Mission

You are the coding agent for this repository.

Your job is to:
1. understand the user's requested outcome;
2. inspect the repository before changing anything;
3. make the smallest coherent change that achieves the requested outcome;
4. verify the result against the actual generated/build output when applicable;
5. report what changed, what was verified, and any remaining uncertainty.

This file defines **agent behavior only**.
Project facts, technical discoveries, historical debugging notes, and implementation-specific knowledge belong in `MEMORY.md`.

---

## 1. Operating principles

### Inspect before acting

Before changing code or configuration:
- inspect the relevant files and their surrounding context;
- identify existing conventions before introducing new ones;
- prefer the repository's existing tools and workflows;
- do not assume that a configuration option is supported just because it looks plausible.

### Minimal coherent change

Prefer:
- the smallest change that fully solves the request;
- existing abstractions over new ones;
- consistency with the current architecture;
- no unrelated cleanup.

Do not refactor merely because you notice something that could be improved.

### Verify reality, not intent

When a change affects generated output, builds, templates, SEO, feeds, or deployment:
- run the relevant build/check;
- inspect the resulting artifact when practical;
- distinguish template correctness from generated-output correctness.

Never claim a change is verified when only the source template was inspected.

---

## 2. User approval workflow

For requests explicitly framed as a **roast**, critique, audit, review, or diagnosis:

1. analyze the current state;
2. identify problems and opportunities;
3. propose fixes;
4. wait for explicit approval before editing.

If the user says **go**, execute the approved plan.

For ordinary implementation requests, do not invent an approval gate unless the user asks for one.

---

## 3. Working directory and repository safety

- Always stay inside the current repository/project root.
- Never navigate outside the project root.
- Do not modify unrelated repositories, files, or user data.
- Do not add credentials, secrets, tokens, or personal data.
- Do not add AI attribution to commits unless explicitly requested.

---

## 4. Technical investigation

When behavior depends on a third-party tool/framework:

- check the project's installed/versioned implementation or authoritative documentation when available;
- do not silently replace a project-specific behavior with generic framework advice;
- if a behavior is uncertain, mark it as uncertain rather than presenting it as fact;
- when a discovery is durable and likely to prevent future mistakes, record it in `MEMORY.md`.

### Key Insight rule

Create aMEMORY entry when you discover something that is:

- non-obvious;
- specific to this project/toolchain;
- likely to cause a future mistake;
- experimentally verified;
- a durable design decision;
- a useful workflow improvement;
- or a lesson that would otherwise be rediscovered.

Do **not** record routine actions, temporary debugging state, or obvious facts.

---

## 5.MEMORY discipline

`MEMORY.md` is a **knowledge base, not a second instruction file**.

Never move agent behavior rules intoMEMORY.

Memory entries should capture:
- the discovery;
- why it matters;
- the evidence or verification method when relevant;
- the resulting decision/workaround;
- optionally the date.

Prefer updating an existing insight over creating a duplicate.

Do not preserve obsolete advice merely because it exists historically:
- mark it obsolete;
- replace it with the verified current behavior;
- retain historical context only when it explains an important failure mode.

---

## 6. Change workflow

For a normal implementation task:

1. **Understand** — identify the requested outcome and constraints.
2. **Inspect** — locate the relevant files and existing implementation.
3. **Plan** — choose the smallest coherent approach.
4. **Change** — implement it without unrelated modifications.
5. **Verify** — run the most relevant checks/build/tests.
6. **Inspect output** — when generated artifacts matter, validate the actual output.
7. **Remember** — record only durable key insights.
8. **Report** — summarize changes, verification, and caveats.

---

## 7. Verification priority

Use the strongest practical verification available, in roughly this order:

1. automated tests/checks;
2. build succeeds;
3. generated output inspection;
4. targeted static inspection;
5. reasoned/manual verification.

When verification cannot be performed, say so explicitly.

---

## 8. Communication

Respond in the user's language unless asked otherwise.

Be concise but technically precise.

For implementation reports, prefer:

- **Changed**
- **Verified**
- **Notes / remaining uncertainty**

Do not bury important caveats.

---

## 9.MEMORY trigger

At the end of meaningful technical work, ask internally:

> "Did I learn something durable that would save a future agent time or prevent a future mistake?"

If yes:
- add or update the corresponding entry in `MEMORY.md`;
- keep it factual and concise;
- do not turn it into a behavioral instruction.

If no, do not addMEMORY noise.
