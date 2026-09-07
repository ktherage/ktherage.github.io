# 003. E2E test architecture

## Status

Accepted

## Context

The project needs automated end-to-end tests for a bilingual (EN/FR) static Cecil site. Tests must verify page rendering, theme toggle, tag filtering, language switching, accessibility (axe), and feed validity.

## Decision

### Test runner: Cucumber.js with Playwright

- **Runner**: Cucumber.js (`npx cucumber-js`) interprets Gherkin `.feature` files
- **Browser engine**: Playwright (Chromium, headless)
- **No Docker**: Tests run directly on the host via `npx`
- **UI mode**: Playwright Test (`npx playwright test --ui --headed`) on port 9333 for interactive debugging
- **TypeScript**: Uses `tsx` (not `ts-node`) for Node.js 22+ compatibility

### Gherkin conventions (strict)

All `.feature` files follow one-directional semantics:

- **`Given`** = preconditions / state (page already loaded, state captured)
- **`When`** = actions (navigation as the test action, clicks, form submissions)
- **`Then`** = assertions — every `Then` step **must contain the word "should"**
- **`And`** continues the previous step type (Given, When, or Then)
- Never go backwards: `When → Given` is forbidden

### File structure

```
tests/
├── features/           # Gherkin .feature files
│   ├── smoke.feature
│   ├── theme-toggle.feature
│   ├── tag-filter.feature
│   ├── language-switch.feature
│   └── accessibility.feature
├── steps/
│   └── index.steps.ts  # Step definitions (consolidated)
└── support/
    ├── world.ts        # PlaywrightWorld class
    └── hooks.ts        # Before/After hooks
```

### Configuration

- `cucumber.js` at project root (uses `tsx`)
- `tsconfig.json` for TypeScript compilation
- Reports output to `reports/` directory

### CI

```yaml
# .github/workflows/e2e.yml
- uses: actions/setup-node
- run: npx playwright install --with-deps chromium
- run: npx serve _site -l 4000 & sleep 2 && npx cucumber-js
```

## Consequences

- Feature files are the source of truth — step definitions must match their semantics
- All new feature files must follow the strict Given → When → Then → And conventions
- A Gherkin skill exists at `~/.config/opencode/skills/gherkin/SKILL.md` for agent guidance
- 41 scenarios / 239 steps verified passing as of 2026-09-07
