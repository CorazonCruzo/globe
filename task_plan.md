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
  - [x] 2.8 Verify: tsc ✓, eslint ✓, prettier ✓, tests (58/58) ✓, build ✓

- [ ] Phase 3: UI & Data (Level 0 — mandatory)
  - [x] 3.1 Create React↔three-kvy-core bridge (GlobeCanvas component, event-based communication)
  - [x] 3.2 Fetch country data from restcountries.com via @tanstack/react-query (поля: name, cca3, ccn3, capital, population, area, region, subregion, languages, currencies, flags, latlng)
  - [x] 3.3 Match REST Countries → GeoJSON по ISO codes: строим Map<ccn3, cca3> из данных restcountries, применяем при создании мешей. Обработка edge cases: страны без ccn3 (fallback по name), меши без match (серые, не кликабельные), записи restcountries без геометрии (присутствуют в данных, будут видны в списке при реализации Phase 4). Логируем unmatched.
  - [ ] 3.4 Create CountryInfo panel — display selected country details (flag, name, capital, population, area, region, languages, currencies)
  - [ ] 3.5 Ensure full mobile support: responsive layout (info panel снизу на mobile), touch controls (уже в CameraModule + RaycastModule), проверка WebGL2 fallback на Safari iOS
  - [ ] 3.6 End-to-end verification: data loads → globe renders → click country → info panel shows

- [ ] Phase 4: Country List & Synchronization (Level 1 — recommended)
  - [ ] 4.1 Create CountryList component with search by name
  - [ ] 4.2 Synchronize hover state: list item hover ↔ globe country highlight
  - [ ] 4.3 Synchronize select state: list click → globe fly-to, globe click → list scroll-to
  - [ ] 4.4 Verify bidirectional sync works

- [ ] Phase 5: Table, Filtering & Virtualization (Level 2 — advanced)
  - [ ] 5.1 Install @tanstack/react-table + @tanstack/react-virtual
  - [ ] 5.2 Create CountryTable with columns: flag, name, capital, population, area, region
  - [ ] 5.3 Add filtering by region, subregion, and text search
  - [ ] 5.4 Add sorting by all numeric/text columns
  - [ ] 5.5 Implement infinite scroll with virtualization (@tanstack/react-virtual)
  - [ ] 5.6 Synchronize table selection with globe (same as Level 1)

- [ ] Phase 6: Bonus — Creative 3D
  - [ ] 6.1 Visual effects: hover glow, click pulse, selection highlight animation
  - [ ] 6.2 Globe appearance customization via TSL shaders (atmosphere glow, ocean shader, country coloring)
  - [ ] 6.3 Light/dark theme toggle (affects both UI and 3D scene)

- [ ] Phase 7: Polish & Deploy
  - [ ] 7.1 Mobile testing and fixes
  - [ ] 7.2 Performance audit (bundle size, render performance)
  - [ ] 7.3 Deploy to GitHub Pages
  - [ ] 7.4 Final review against ТЗ checklist

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
- **ISO matching**: Мост numeric→cca3 строится из данных restcountries (поле ccn3), fallback по name (case-insensitive) для стран без ccn3. Unmatched меши — серые/не кликабельные. Unmatched записи restcountries — присутствуют в данных, будут видны в UI при реализации Phase 4. Логируем.
- **Триангуляция**: earcut в локальной 2D-плоскости (не lon/lat) + spherical subdivision после earcut. Антимеридиан и полюса обрабатываются автоматически без special-case split.
- **Z-fighting**: polygonOffset вместо depthTest:false. Стандартный depth test включён, FrontSide culling.
- **Z-fighting**: Country меши на R+0.01, океан на R. polygonOffset для дополнительной защиты.
- **Антимеридиан**: Обрабатывается автоматически через локальную 2D-проекцию при триангуляции (не нужен runtime split).

## Status
**Phase 2 complete** — 3D Core done. GlobeCanvas renders WebGPURenderer scene with ocean sphere, camera-controls orbit, country mesh generation from world-atlas TopoJSON (local-plane earcut + spherical subdivision), raycasting for hover/click, CountryStateModule for selection, TSL shaders, tween.js animations. React bridge (GlobeContext, useCountryState, useCountries) and data loading pipeline implemented. ISO matching: ccn3 + name fallback. 58 tests passing. Ready for Phase 3 (UI panels).

## Files
- `task_plan.md` — this file
- `architecture.md` — solution structure
- `features.md` — implemented behavior with examples
