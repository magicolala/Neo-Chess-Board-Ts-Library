# Demo QA & Release Checklist

This guide documents how to run the Neo Chess Board demo locally and the quality bars every release must meet before publishing updates to GitHub Pages.

## 1. Run the Demo Locally

1. Install dependencies at the repository root:
   ```bash
   npm install
   ```
2. Start the demo server with Vite using the dedicated demo config:
   ```bash
   npm run dev -- --config demo/vite.config.ts --root demo
   ```
3. Visit the relevant entry points:
   - Playground: http://localhost:5173/playground.html
   - Theme creator: http://localhost:5173/theme-creator.html
   - Main demo: http://localhost:5173/index.html

> **Tip:** Append `--host` to the dev command when you need to share the demo on your LAN (e.g., `npm run dev -- --config demo/vite.config.ts --root demo -- --host`).

### Production Preview

Build the static demo to mirror the GitHub Pages deploy:
```bash
npm run build:demo
npx serve dist/demo
```
The `serve` step is optional but recommended when validating the built assets.

## 2. Release Polish Commands

Run the following commands before any public release or documentation update that touches the demo:

| Area              | Command                                                    | Pass Criteria |
| ----------------- | ----------------------------------------------------------- | ------------- |
| Type safety & lint | `npm run lint`                                              | Command exits with code `0` and no errors |
| Unit tests        | `npm test`                                                  | All suites pass with no failures |
| Library build     | `npm run build`                                             | Build completes with no errors |
| Demo build        | `npm run build:demo`                                        | Output generated in `dist/demo` with no warnings marked as errors |

Document any deviations in the release notes if a temporary exception is unavoidable.

## 3. Lighthouse Audit

Run Lighthouse against each hosted HTML entry point (desktop preset is the baseline):
```bash
npx lighthouse http://localhost:5173/playground.html \
  --only-categories=performance,accessibility,best-practices,seo \
  --preset=desktop --quiet --output=json --output-path=./test-results/lighthouse-playground.json
```
Repeat for `index.html` and `theme-creator.html`.

**Pass requirements**
- Performance ≥ 90
- Accessibility ≥ 90
- Best Practices ≥ 90
- SEO ≥ 90
- No critical issues flagged in the JSON report

Save the JSON artifacts under `test-results/` so regressions can be tracked between releases.

## 4. axe-core Accessibility Scan

Use the axe-core CLI to ensure there are no WCAG regressions:
```bash
npx @axe-core/cli http://localhost:5173/playground.html --exit
npx @axe-core/cli http://localhost:5173/theme-creator.html --exit
npx @axe-core/cli http://localhost:5173/index.html --exit
```

**Pass requirements**
- CLI exits with code `0`
- No violations reported (warnings may be documented but must not be ignored without rationale)

## 5. Link Validation

Check for broken links within the built demo using Linkinator:
```bash
npx linkinator http://localhost:5173/index.html --timeout=30000 --retry --skip "mailto:,tel:"
```
Run the command for the other entry points if they expose additional navigation paths.

**Pass requirements**
- Exit code `0`
- No `BROKEN` status lines in the output

## 6. Sign-off Summary

Before tagging a release:
- [ ] Local demo verified in development mode
- [ ] `dist/demo` build manually spot-checked
- [ ] Lint/tests/build commands pass (section 2)
- [ ] Lighthouse scores meet thresholds (section 3)
- [ ] axe-core scans have zero violations (section 4)
- [ ] Link validation reports no broken links (section 5)

Capture the checklist status in the release PR description to make the QA artifacts easy to audit.
