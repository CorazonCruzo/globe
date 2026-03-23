# Globe Explorer

Interactive 3D globe for exploring countries of the world. Built with React 19.2+, Three.js r183 (WebGPURenderer), and three-kvy-core.

## ТЗ (Technical Assessment)
Полное описание задания находится в `../frontend_assessment_2.pdf`. Все решения должны строго соответствовать требованиям этого документа.

## Technical Stack (from ТЗ)
- **Build**: Vite, TypeScript, React 19.2+
- **3D**: Three.js r183 + WebGPURenderer, three-kvy-core (all 3D logic), TSL shaders, tween.js, camera-controls
- **Data**: @tanstack/react-query, restcountries.com API
- **UI**: Tailwind CSS v4, clsx + tailwind-merge, @base-ui/react
- **Lint**: @tanstack/eslint-config (flat config), @shopify/prettier-config
- **Events**: eventemitter3

## Architecture Rules (from ТЗ)
- ALL Three.js logic must be inside three-kvy-core classes (features/modules)
- Minimize global stores; prefer state on class instances
- Avoid props drilling
- Minimize imperative code in React components
- Use base-ui components wherever possible

## Testing Rules

- Write tests for every new module, feature, utility, and component
- Tests must pass before considering a task complete
- Run the full test suite after each change to ensure no regressions
- Use Vitest as the test runner (compatible with Vite)
- For Three.js/3D logic: unit-test pure functions (geo projection, triangulation, ISO mapping), mock Three.js objects where needed
- For React components: use @testing-library/react
- For modules/features (three-kvy-core): test lifecycle, events, state transitions

## Verification Commands

```bash
# Type check
npx tsc --noEmit

# Lint
npx eslint .

# Format check
npx prettier --check .

# Tests
npm run test

# Build
npm run build
```

**IMPORTANT:** Always run ALL verification commands after code changes. All must pass (tsc, eslint, prettier, tests, build). Do not skip any step. Run `npx prettier --write .` to fix formatting issues.

## Browser Integration Testing (CDP)

After completing a feature, run a browser-based smoke test via Chrome DevTools Protocol. This catches runtime errors, rendering issues, and failed network requests that unit tests and tsc cannot detect.

**Prerequisites:** The user must have a browser running with `--remote-debugging-port=9223` and the app open at `http://127.0.0.1:4173`.

**Steps:**
1. Build and start preview: `npm run build && npm run preview -- --port 4173 &`
2. Connect to CDP at `http://127.0.0.1:9223/json/list`, find the page target
3. Open a WebSocket to the page's `webSocketDebuggerUrl`
4. Enable domains: `Runtime`, `Console`, `Network`, `Page`
5. Collect for ~5 seconds: console messages, exceptions, failed network requests
6. Run `Runtime.evaluate` checks:
   - `document.querySelector('canvas') !== null` — 3D canvas rendered
   - `document.querySelector('[data-testid]')` — key UI elements present
   - No error overlays visible
7. Optionally take a screenshot: `Page.captureScreenshot` → save as base64 PNG, read with Read tool to visually inspect
8. Report: list any console errors, failed requests, missing elements

**When to run:** After completing each Phase, or after fixing bugs that affect rendering/interaction. Not needed for docs-only or test-only changes.

## Planning Files

When working on this project, check these files:
- `task_plan.md` — phases and current status
- `architecture.md` — detailed module design
- `features.md` — **ALWAYS CHECK** for implemented behavior and examples
