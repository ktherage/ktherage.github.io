# 005. Social media publishing

## Status

Accepted

## Context

New articles must be announced on social media (Bluesky, LinkedIn, Mastodon) after deployment. LinkedIn and Bluesky have no MCP post-creation capability, requiring browser automation.

## Decision

### Deployment-first rule

A new article must not be announced until the GitHub Pages deployment has succeeded and the live URL responds. Publishing social links before deployment creates dead links.

### Bluesky browser automation

The Bluesky web composer uses a `contenteditable` paragraph element. The snapshot output is truncated and dialog refs change between snapshots.

**Workflow:**
1. After typing, grep the saved output file to find the current `Poster` ref
2. Click the `Poster` ref from grep results (never cache a previous ref)
3. Wait 2-3 seconds after typing for link previews to load
4. Verify success by checking that the dialog disappears

### LinkedIn browser automation

LinkedIn's "Commencer un post" button is intermittently non-interactable from the feed.

**Workflow:**
1. Navigate to profile page (`/in/kevin-therage/`)
2. Click "Accueil" to go to feed
3. Click "Commencer un post"
4. Type text into the editor (`submit: false`)
5. Wait 3 seconds for link preview
6. Click "Publier"
7. Verify "Le post a bien été publié" alert

**Known workarounds:**
- "Unable to get parent" on feed button: navigate to profile → Accueil to reset state
- Post dialog closes on navigation: reopen via profile → Accueil cycle
- Mastodon visibility resets to "Abonnés" after each publish: manually set to "Public"

## Consequences

- Social announcements are bilingual and published once per article
- Browser automation is the only viable path for Bluesky and LinkedIn posting
- Deployment verification is a hard prerequisite for social publishing
