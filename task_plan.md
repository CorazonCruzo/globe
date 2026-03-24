# Task Plan: Interactive 3D Globe Explorer

## Goal
Build a React + Three.js web application — interactive 3D globe for exploring countries of the world, with all levels (0, 1, 2) and bonus features completed.

## Phases

- [x] Phase 1: Project Setup
  - [x] 1.1 Initialize Vite 6 + React 19.2.4 + TypeScript project (Vite 8 incompatible with Node 20.17.0)
  - [x] 1.2 Install Three.js r183, three-kvy-core, camera-controls, tween.js, eventemitter3 (--legacy-peer-deps для совместимости)
  - [x] 1.3 Configure ESLint (@tanstack/eslint-config with projectService override) + Prettier (@shopify/prettier-config)
  - [x] 1.4 Configure Tailwind CSS v4 (@tailwindcss/vite plugin) + clsx + tailwind-merge
  - [x] 1.5 Install @base-ui/react, @tanstack/react-query
  - [x] 1.6 Install world-atlas, topojson-client, earcut + types
  - [x] 1.7 Verify: tsc ✓, eslint ✓, vite build ✓

- [x] Phase 2: 3D Core (Level 0 — mandatory)
  - [x] 2.1 Create CoreContext with WebGPURenderer (await renderer.init() для WebGPU/WebGL2 fallback), PerspectiveCamera, Scene. GlobeCanvas показывает loading пока init не завершён. Логировать фактический бэкенд.
  - [x] 2.2 Create GlobeFeature (Object3DFeature) — sphere (radius R) with ocean TSL shader
  - [x] 2.3 Integrate camera-controls as CameraModule (CoreContextModule). Touch: 1 finger = rotate, 2 fingers = dolly, truck off. flyTo(lat, lon) берёт координаты из CountryDataMap (единственный источник — restcountries latlng).
  - [x] 2.4 Create geo pipeline utilities: lon/lat → Vec3 проекция, earcut триангуляция (в локальной 2D-плоскости) с поддержкой holes, MultiPolygon → mergeGeometries, spherical subdivision после earcut
  - [x] 2.5 Create CountriesFeature — load world-atlas TopoJSON, создать per-country меши на R+0.01 (z-fighting offset + polygonOffset), userData.countryCode = cca3 (или null для unmatched)
  - [x] 2.6 Implement RaycastModule — pointer events (единый код mouse + touch) → raycasting → hover/click по country-мешам
  - [x] 2.7 Implement CountryStateModule + country selection. CountryDataMap (Map<cca3, {lat,lon}>) заполняется из restcountries. Оба пути (globe click и list click) используют один и тот же select(code) → CameraModule.flyTo с координатами из CountryDataMap.
  - [x] 2.8 Verify: tsc ✓, eslint ✓, prettier ✓, tests ✓, build ✓

- [x] Phase 3: UI & Data (Level 0 — mandatory)
  - [x] 3.1 Create React↔three-kvy-core bridge (GlobeCanvas component, event-based communication)
  - [x] 3.2 Fetch country data from restcountries.com via @tanstack/react-query (поля: name, cca3, ccn3, capital, population, area, region, subregion, languages, currencies, flags, latlng)
  - [x] 3.3 Match REST Countries → GeoJSON по ISO codes: строим Map<ccn3, cca3> из данных restcountries, применяем при создании мешей. Обработка edge cases: страны без ccn3 (fallback по name), меши без match (серые, не кликабельные), записи restcountries без геометрии (присутствуют в данных, будут видны в списке при реализации Phase 4). Логируем unmatched.
  - [x] 3.4 Create CountryInfo panel — flag, name (common+official), capital, region, subregion, population, area, languages, currencies. Desktop: right side, mobile: bottom sheet. Animated show/hide.
  - [x] 3.5 Mobile responsive: info panel снизу на mobile (max-md:), touch controls (CameraModule + RaycastModule), backdrop-blur panel
  - [x] 3.6 Verify: tsc ✓, eslint ✓, prettier ✓, tests ✓, build ✓

- [x] Phase 4: Country List & Synchronization (Level 1 — recommended)
  - [x] 4.1 Create CountryList component with search by name (sorted alphabetically, flag + name per item)
  - [x] 4.2 Synchronize hover state: list item hover ↔ globe country highlight (via CountryStateModule events)
  - [x] 4.3 Synchronize select state: list click → globe fly-to, globe click → list scroll-to (scrollIntoView)
  - [x] 4.4 Verify: tsc ✓, eslint ✓, prettier ✓, tests ✓, build ✓, browser check ✓

- [x] Phase 5: Table, Filtering & Virtualization (Level 2 — advanced)
  - [x] 5.1 Install @tanstack/react-table + @tanstack/react-virtual
  - [x] 5.2 Create CountryTable with columns: flag, name, capital, population, area, region
  - [x] 5.3 Add filtering by region and text search
  - [x] 5.4 Add sorting by name, population, area, region columns
  - [x] 5.5 Implement virtualized scroll (@tanstack/react-virtual, overscan 10)
  - [x] 5.6 Synchronize table selection with globe (same as Level 1) + List/Table view toggle
  - [x] 5.7 Verify: tsc ✓, eslint ✓, prettier ✓, tests ✓, build ✓, browser check ✓

- [x] Phase 6: Bonus — Creative 3D
  - [x] 6.1 Visual effects: hover/select color animation via tween.js (already from Phase 2)
  - [x] 6.2 Globe appearance: AtmosphereFeature (Fresnel rim glow) + StarfieldFeature (900 procedural stars) active in createGlobeContext. Ocean TSL shader with polar/day/twilight color blend.
  - [x] 6.3 Light/dark theme toggle: ThemeButton inline in App.tsx. Theme changes scene.background via setSceneTheme() in 3D layer (does NOT change lighting). UI bg transition works via CSS.

- [x] Phase 7: Polish & Deploy
  - [x] 7.1 Mobile testing and fixes (dvh, touch-action:none, viewport-fit:cover, safe-area padding, larger touch targets)
  - [x] 7.2 Performance audit (vendor chunk splitting: three/react/base-ui/tanstack/geo)
  - [ ] 7.3 Deploy to GitHub Pages
  - [x] 7.4 Final review against ТЗ checklist (base-ui Select+Tabs integrated, Three.js removed from React layer, unused ThemeToggle deleted)

## Blocked / Open Questions
- [ ] Confirm @base-ui/react is the correct "base-ui" from ТЗ (assumption based on research)
- [ ] Confirm @shopify/prettier-config is the correct "web-configs" Prettier config (assumption based on research)

## Decisions Made
- **Country visualization**: GeoJSON-based polygon rendering on sphere (our choice — ТЗ leaves this open)
- **GeoJSON source**: world-atlas npm (TopoJSON from Natural Earth 110m)
- **State management**: Minimal — state bound to three-kvy-core class instances + lightweight React context for UI state
- **React↔3D bridge**: Manual via useEffect/useRef — three-kvy-core has no React integration
- **base-ui**: @base-ui/react v1.3.0 (assumption based on research)
- **web-configs**: @shopify/prettier-config (assumption based on research)
- **WebGPU fallback**: Полагаемся на встроенный автоматический fallback WebGPURenderer → WebGL2. TSL код портируемый. wgslFn() не используем.
- **Координаты для flyTo**: Единственный источник — restcountries.com поле `latlng`. Хранятся в CountryDataMap внутри CountryStateModule. Оба пути (globe click, list click) проходят через select(code) → CameraModule.flyTo с данными из этой Map.
- **ISO matching**: Мост numeric→cca3 строится из данных restcountries (поле ccn3), fallback по name (case-insensitive) для стран без ccn3. Unmatched меши — серые/не кликабельные. Unmatched записи restcountries — присутствуют в данных, видны в списке и таблице (нет highlight на глобусе). Логируем.
- **Триангуляция**: earcut в локальной 2D-плоскости (не lon/lat) + spherical subdivision после earcut. Антимеридиан и полюса обрабатываются автоматически без special-case split.
- **Z-fighting**: polygonOffset вместо depthTest:false. Стандартный depth test включён, FrontSide culling.
- **Z-fighting**: Country меши на R+0.01, океан на R. polygonOffset для дополнительной защиты.
- **Антимеридиан**: Обрабатывается автоматически через локальную 2D-проекцию при триангуляции (не нужен runtime split).

## Status
**Phase 7 complete** (except deploy) — All levels + Bonus + Polish done. Mobile support (dvh, touch-action, safe-area), vendor chunk splitting, base-ui integration (Select, Tabs), zero Three.js in React layer. 85 tests passing.

## Files
- `task_plan.md` — this file
- `architecture.md` — solution structure
- `features.md` — implemented behavior with examples
