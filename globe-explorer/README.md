# Globe Explorer

Interactive 3D globe for exploring countries of the world. Built with React, Three.js, and three-kvy-core.

## Requirements

- Node.js >= 20.11.0
- npm >= 10.2.4

## Setup

```bash
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is required because `@vladkrutenyuk/three-kvy-core` declares peer dependencies on `three@^0.182.0` / `@types/three@^0.182.0`, while the project uses Three.js r183.

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Type-check and build for production
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
npm run test       # Run tests
npm run test:watch # Run tests in watch mode
npm run preview    # Preview production build
```

## Tech Stack

- Vite 6, TypeScript, React 19.2+
- Three.js r183 + WebGPURenderer, three-kvy-core
- Tailwind CSS v4, @base-ui/react
- @tanstack/react-query
- Vitest, Testing Library
