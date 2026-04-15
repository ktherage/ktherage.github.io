# ktherage.github.io

**ALWAYS** stay within current working directory. Never navigate outside project root.

## Commands
- Build: `php cecil.phar build`
- Dev server: `php cecil.phar serve --config=cecil.dev.yml`
- Clear cache: `php cecil.phar clear`

## Structure
- `pages/blog/YYYY-MM-DD_slug.md` - Blog posts
- `pages/legal.md` - Legal page
- `layouts/` - Twig templates
- `assets/img/` - Images

## Content
Frontmatter required: `title`, `description`, `cover`, `published`, `tags`, `excerpt`

## Stack
- Cecil v8.x, Twig, Bootstrap 5.3.7, Font Awesome 6.7.2, Highlight.js 11.11.1
- PHP 8.5, Docker, Docker Compose
