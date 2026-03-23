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
- **GlobeCanvas** component — mounts CoreContext, shows loading state during WebGPU init, provides GlobeContext to children
- **useCountries** hook — @tanstack/react-query fetch from restcountries.com (all required fields)
- **useCountryState** hook — subscribes to CountryStateModule events, exposes selectedCode/hoveredCode
- **useGlobeContext** hook — React context for accessing CoreContext and CountriesFeature
- **ISO matching** — Map<ccn3, cca3> built from restcountries data (primary), with case-insensitive name-based fallback for countries without ccn3. Applied when building country meshes. Unmatched logged.

## Not Yet Implemented

### Level 0 (Mandatory) — remaining
- CountryInfo panel — display selected country details (flag, name, capital, population, area, region, languages, currencies)
- Full mobile support verification (responsive layout, touch on iOS Safari)

### Level 1 (Recommended)
- Country list in UI with search by name
- Synchronized hover/select state between list and globe

### Level 2 (Advanced)
- Filtering and sorting via @tanstack/react-table
- Infinite scroll with virtualization via @tanstack/react-virtual

### Bonus
- Visual effects on hover, click, and selection
- Globe appearance customization via TSL shaders
- Light/dark theme toggle
