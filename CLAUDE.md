# Globe Explorer

Interactive 3D globe for exploring countries of the world. Built with React 19.2+, Three.js r183 (WebGPURenderer), and three-kvy-core.

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

## Verification Commands

```bash
# Type check
npx tsc --noEmit

# Lint
npx eslint .

# Build
npm run build

# Dev server
npm run dev
```

**IMPORTANT:** Always run verification after code changes. Do not skip this step.

## Planning Files

When working on this project, check these files:
- `task_plan.md` — phases and current status
- `architecture.md` — detailed module design
- `features.md` — **ALWAYS CHECK** for implemented behavior and examples
