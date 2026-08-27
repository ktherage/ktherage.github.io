# ktherage.github.io

**ALWAYS** stay within current working directory. Never navigate outside project root.

## Commands
- Build: `php cecil.phar clear && php cecil.phar build`
- Dev server: `php cecil.phar serve --config=cecil.dev.yml`
- Clear cache: `php cecil.phar clear`
- Update Cecil: `php cecil.phar self-update`

## Structure
- `pages/blog/slug.md` - Blog posts (no date in filename)
- `pages/blog/slug.fr.md` - French translation (same slug)
- `pages/legal.md` - Legal page
- `layouts/` - Twig templates
- `assets/img/` - Images

## Content
Frontmatter required: `title`, `date` (YYYY-MM-DD), `description`, `cover`, `published`, `tags`, `excerpt`
Optional: `updated`, `slug`

## Conventions
- Blog URLs are `:slug/` with **no date** (e.g. `/blog/slug/`); slug uses hyphens, never underscores.
- Keep the en/fr versions in sync (same slug, date, tags).
- Posts are sorted by `date` descending (`sort_by_date`); set `updated` when edited.
- Verify after content changes: rebuild, then check `_site/blog/` (URLs without date, desc date order, RSS).

## Commits
- Never add a `Co-Authored-By` trailer (or any AI attribution) to commit messages.

## Stack
- Cecil v8.x (8.117.1), Twig, Bootstrap 5.3.7, Font Awesome 6.7.2, Highlight.js 11.11.1
- PHP 8.5, Docker, Docker Compose

## Social announcements
When a **new** article is created (both `pages/blog/<slug>.md` and `pages/blog/<slug>.fr.md`) **and** deployed:
- Wait for the GitHub Pages deploy to finish first: after pushing to `main`, check the `Deploy Cecil site to GitHub Pages` workflow succeeded (`gh run list --workflow=deploy.yml` / `gh run watch`), then verify the live URL responds.
- Then announce the article on X, Bluesky, LinkedIn and Mastodon — in French **and** English (one post per language per platform).
- Post content: a catchy one-liner hook about the article (not just its title) in a **professional tone** — clear, factual, no hype or clickbait, no emojis — then the link `https://ktherage.github.io/blog/<slug>/`, plus hashtags from the tags. Keep each platform's character limit.
- Use the browser MCP to publish (X: compose/post dialog; Bluesky/Mastodon/LinkedIn: their web composers).
- If the browser MCP is not connected, or a platform requires login or blocks with an auth challenge (2FA, verification code, captcha), stop, tell the user what is blocking and **wait** for explicit go-ahead — never attempt to handle credentials or codes alone.
- Announce only once per article; never announce drafts (`published: false`).
