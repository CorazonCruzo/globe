# Features: Globe Explorer

## Implemented

### 3D Core (Phase 2)
- **WebGPURenderer** with automatic WebGL2 fallback (`createGlobeContext.ts`). Backend logged to console.
- **Ocean sphere** via `GlobeFeature` — SphereGeometry(R=5, 64 segments) + MeshStandardNodeMaterial with TSL ocean shader (deep/shallow/pole color blend based on normalWorld.y)
- **Camera orbit** via `CameraModule` — camera-controls wrapper. Touch: 1 finger rotate, 2 fingers dolly. Truck disabled. `flyTo(lat, lon)` animates to country coordinates.
- **Geo pipeline** (`geoProjection.ts`, `triangulate.ts`):
  - `lonLatToVec3(lon, lat, radius)` — spherical projection (Y-up, lon=0 → +Z, lon>0 → +X)
  - `processRing` — strips closing duplicate, removes non-finite and duplicate vertices
  - `triangulatePolygon` — earcut in local 2D plane (not raw lon/lat) → spherical subdivision → winding normalization → spherical normals. Handles poles and antimeridian without special cases
- **Country meshes** via `CountriesFeature` — loads world-atlas 110m TopoJSON, builds per-country Mesh on radius R+0.01. Uses ISO numeric→cca3 map from restcountries (+ name fallback). Unmatched countries rendered grey, not clickable.
- **Raycasting** via `RaycastModule` — pointer events (mouse + touch unified), hover/click detection on country meshes
- **Country state** via `CountryStateModule` — selected/hovered country state, events (select/deselect/hover/unhover). CountryDataMap stores lat/lon from restcountries for flyTo.
- **Per-country visuals** via `CountryMeshFeature` — tween.js animated hover/select color transitions via TSL uniform nodes
- **Country shaders** (`countryShader.ts`) — MeshStandardNodeMaterial with polygonOffset for z-fighting, uniform-driven hover/select color blend (green → light green on hover, → gold on select)

### React Bridge (Phase 2/3)
- **GlobeCanvas** component — lazy-loaded via `React.lazy()`, mounts CoreContext, shows loading/error state during WebGPU init and API fetch, provides GlobeContext to children
- **useCountries** hook — @tanstack/react-query fetch from restcountries.com (all required fields)
- **useCountryState** hook — subscribes to CountryStateModule events, exposes selectedCode/hoveredCode
- **useGlobeContext** hook — React context for accessing CoreContext and CountriesFeature
- **ISO matching** — Map<ccn3, cca3> built from restcountries data (primary), with case-insensitive name-based fallback for countries without ccn3. Applied when building country meshes. Unmatched logged.

### CountryInfo Panel (Phase 3)
- **CountryInfo** component — shows selected country details: flag (SVG), name (common + official), capital, region, subregion, population (formatted: K/M/B), area (km²), languages, currencies
- Desktop: right side panel (w-80), mobile: bottom sheet (full width)
- Animated show/hide with `translate-y` + `opacity` transition
- Uses `useCountryState` for selection + `useCountries` for data lookup
- Glassmorphism style: `bg-slate-800/90 backdrop-blur-md border-white/10`

### CountryList (Phase 4)
- **CountryList** component — scrollable list of all countries, sorted alphabetically, flag + name per item
- **Search** — text input filters by country name (case-insensitive)
- **Bidirectional sync**: list item hover → globe highlight, list click → globe select + flyTo, globe click → list scroll-to + highlight
- Uses `useCountryState` for selection/hover, `useGlobeContext` for CountryStateModule access
- Responsive: desktop left sidebar (w-64), mobile bottom panel
- Memoized items (`memo` + `forwardRef`) for performance with 250 countries

### CountryTable (Phase 5)
- **CountryTable** component — @tanstack/react-table with columns: flag, name, capital, population, area, region
- **Filtering**: text search + region dropdown (All/Africa/Americas/Antarctic/Asia/Europe/Oceania)
- **Sorting**: clickable column headers, ascending/descending toggle (name, population, area, region)
- **Virtualization**: @tanstack/react-virtual with overscan 10, row height 36px
- **Sync**: same as CountryList — hover/select bidirectional with globe, search clears on external select
- **View toggle**: List/Table switch button at bottom center

### Bonus (Phase 6)
- **Atmosphere glow** — `AtmosphereFeature` active in `createGlobeContext`. Slightly larger BackSide sphere (R*1.004) with Fresnel-based TSL rim glow shader (`atmosphereShader.ts`). Additive blending, no depth write.
- **Starfield** — `StarfieldFeature` active in `createGlobeContext`. 900 procedural stars via seeded RNG, PointsMaterial with vertex colors, follows camera position so stars are always visible in background.
- **Hover/select animations** — tween.js color transitions in CountryMeshFeature (green → light green on hover, → gold on select)
- **Ocean TSL shader** — depth/latitude/sun-facing color blend (deep → shallow → pole colors, day/twilight tinting, specular glint)
- **Light/dark theme toggle** — ThemeButton inline in `App.tsx`. Theme changes `scene.background` via `setSceneTheme()` in 3D layer (does NOT change lighting). UI background transition works via CSS.

### Polish (Phase 7)
- **Mobile support**: `viewport-fit=cover` meta, `touch-action: none` on 3D canvas, `100dvh` instead of `100vh`, `env(safe-area-inset-top)` on mobile top controls (ViewToggle, ThemeButton), `env(safe-area-inset-bottom)` on mobile bottom panels (CountryInfo, CountryList, CountryTable). Larger touch targets on mobile (list items, tabs, theme button).
- **Error handling**: API fetch errors from restcountries surfaced in GlobeCanvas error state (no more infinite "Loading countries..." on API failure).
- **Lazy loading**: GlobeCanvas loaded via `React.lazy()` with `Suspense` fallback.
- **Performance**: Vendor chunk splitting via function-based `manualChunks` — separate chunks for three.js, react, base-ui, tanstack, and geo data for better caching.
- **base-ui integration**: `@base-ui/react/select` for region filter dropdown in CountryTable, `@base-ui/react/tabs` for List/Table view toggle.
- **Architecture compliance**: Zero Three.js imports in React layer — `setSceneTheme()` utility in 3D layer handles theme→Color mapping.
- **Cleanup**: Removed unused ThemeToggle.tsx component, updated HTML title to "Globe Explorer".

## Not Yet Implemented
