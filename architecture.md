# Architecture: Globe Explorer

## Overview
A single-page React application with an embedded Three.js 3D globe scene. The 3D logic lives entirely in `three-kvy-core` classes (features/modules). React handles data fetching and state. Communication between React and 3D uses eventemitter3 events. UI panels (CountryInfo, CountryList, CountryTable) are fully implemented with bidirectional sync.

## WebGPU / Mobile Compatibility Strategy

WebGPURenderer имеет **встроенный автоматический fallback на WebGL2**. Если `navigator.gpu` недоступен или `requestAdapter()` не возвращает адаптер, рендерер прозрачно переключается на `WebGLBackend`. В консоли появится: `"WebGPURenderer: WebGPU is not available, running under WebGL2 backend."`. Для нашего кода ничего не меняется — один и тот же API.

**Инициализация:**
1. `createGlobeContext` создаёт `new WebGPURenderer({ antialias: true })`
2. Вызывает `await renderer.init()` — в этот момент происходит проверка WebGPU и возможный fallback
3. Только после успешного init создаётся CoreContext и вызывается `ctx.run()`
4. GlobeCanvas показывает loading-состояние, пока init не завершился. При ошибке — показывает error state.

**Touch-устройства:**
- `camera-controls` использует Pointer Events — работает одинаково для mouse и touch без дополнительной настройки
- Конфигурация touch-жестов: one finger = rotate, two fingers = dolly (pinch zoom), truck отключён (не нужен для глобуса)
- `RaycastModule` использует pointer events (pointerdown/pointermove) — единый код для mouse и touch

**Проверка:**
- Chrome/Edge desktop: WebGPU native
- Safari desktop/iOS: fallback на WebGL2 (WebGPU за флагом)
- Chrome Android: WebGPU с версии 121+, иначе WebGL2 fallback
- Firefox: WebGL2 fallback
- Тестируем: `renderer.backend.isWebGPUBackend` для логирования фактического бэкенда

**Ограничение:** TSL-код компилируется в WGSL (WebGPU) или GLSL ES 3.0 (WebGL2) автоматически. Единственное, что НЕ переносимо — `wgslFn()` (raw WGSL). Мы его не используем, только TSL nodes.

## File Structure (current state)
```
globe-explorer/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
├── package.json
├── src/
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Root layout: QueryClientProvider + lazy GlobeCanvas + Suspense
│   ├── index.css              # Tailwind CSS v4 entry (@import "tailwindcss"), 100dvh root
│   │
│   ├── three/                 # All Three.js logic via three-kvy-core
│   │   ├── createGlobeContext.ts  # Factory: CoreContext + WebGPURenderer + camera + scene + modules
│   │   ├── types.ts               # GlobeModules interface
│   │   ├── modules/
│   │   │   ├── CameraModule.ts        # CoreContextModule — camera-controls wrapper
│   │   │   ├── TweenModule.ts         # CoreContextModule — tween.js Group, updated per frame
│   │   │   ├── RaycastModule.ts       # CoreContextModule — pointer raycasting for hover/click
│   │   │   └── CountryStateModule.ts  # CoreContextModule — selected/hovered country state + events
│   │   ├── features/
│   │   │   ├── GlobeFeature.ts        # Object3DFeature — sphere mesh with ocean TSL shader
│   │   │   ├── CountriesFeature.ts    # Object3DFeature — loads TopoJSON, creates country meshes
│   │   │   ├── CountryMeshFeature.ts  # Object3DFeature — per-country: hover/select visual state
│   │   │   ├── AtmosphereFeature.ts   # Object3DFeature — Fresnel rim glow on slightly larger sphere
│   │   │   └── StarfieldFeature.ts    # Object3DFeature — 900 procedural stars, follows camera
│   │   ├── shaders/
│   │   │   ├── oceanShader.ts         # TSL: ocean surface shader (day/twilight/glint)
│   │   │   ├── countryShader.ts       # TSL: country mesh shader (base + hover + select states)
│   │   │   └── atmosphereShader.ts    # TSL: Fresnel-based rim glow for AtmosphereFeature
│   │   └── utils/
│   │       ├── geoProjection.ts       # lon/lat → Vec3 on sphere, ring processing
│   │       └── triangulate.ts         # Local-plane earcut + spherical subdivision
│   │
│   ├── components/
│   │   ├── GlobeCanvas.tsx        # Mounts CoreContext, lazy-loaded via React.lazy()
│   │   ├── CountryInfo.tsx        # Selected country details panel (flag, name, stats)
│   │   ├── CountryList.tsx        # Scrollable country list with search + bidirectional sync
│   │   ├── CountryTable.tsx       # @tanstack/react-table with sort/filter/virtualization
│   │   └── ViewCameraSync.tsx     # Syncs React view state with camera controls
│   │
│   ├── hooks/
│   │   ├── useCountries.ts        # react-query: fetch from restcountries.com (two batches)
│   │   ├── useGlobeContext.ts     # React context + hook for accessing CoreContext
│   │   ├── useCountryState.ts     # Subscribe to CountryStateModule events from React
│   │   └── useTheme.ts            # Theme state hook (light/dark)
│   │
│   ├── types/
│   │   └── country.ts            # TypeScript interfaces: Country, CountryDataEntry
│   │
│   ├── lib/
│   │   ├── constants.ts          # Globe radius, API URLs, camera params
│   │   ├── cn.ts                 # clsx + tailwind-merge utility
│   │   └── panelStyles.ts        # Shared panel styling utilities
│   │
│   └── test/
│       └── setup.ts              # Vitest setup (@testing-library/jest-dom)
```

## Modules

### three/createGlobeContext.ts
- Purpose: Factory function that creates and configures the entire 3D scene
- Creates: WebGPURenderer (from `three/webgpu`), PerspectiveCamera, Scene, Clock
- Registers modules: CameraModule, TweenModule, RaycastModule, CountryStateModule
- Creates globe Object3D with StarfieldFeature + GlobeFeature + AtmosphereFeature + CountriesFeature attached
- Exports `setSceneTheme(ctx, theme)` — sets scene.background Color based on light/dark theme
- Returns: CoreContext instance + CountriesFeature ref

### three/modules/CameraModule.ts (CoreContextModule)
- Purpose: Wraps camera-controls for orbit navigation
- Configures: distance limits, polar angle limits, smooth transitions, touch support
- Exposes: `flyTo(lat, lon)` method for programmatic navigation
- Deferred init: creates controls on `mount` event (not in `useCtx`, since container may not exist yet)
- Touch config: one finger = rotate, two fingers = dolly, truck отключён

**Канонический источник координат для flyTo:**
- `flyTo(lat, lon)` принимает географические координаты (широта, долгота в градусах)
- Внутри конвертирует в azimuth/polar для camera-controls: `azimuth = lon * DEG2RAD`, `polar = (90 - lat) * DEG2RAD`
- Вызывает `controls.normalizeRotations()` перед каждым `rotateTo` (требование camera-controls v3 для кратчайшего пути)
- Координаты берутся из **единственного источника**: поле `latlng` из данных restcountries.com, закешированных в react-query

**Откуда приходит lat/lon в каждом сценарии:**
1. **Клик по мешу на глобусе** → RaycastModule определяет countryCode из `mesh.userData.countryCode` → CountryStateModule.select(code) → CameraModule получает lat/lon из CountryDataMap
2. **Клик по элементу списка/таблицы** → React вызывает CountryStateModule.select(code) → тот же путь
3. **CountryDataMap** — Map<string, {lat, lon}>, хранится в CountryStateModule, заполняется при загрузке данных из restcountries.com

### three/modules/TweenModule.ts (CoreContextModule)
- Purpose: Manages tween.js Group, calls `group.update()` each frame
- Used by features for any animations (hover glow, selection pulse)

### three/modules/RaycastModule.ts (CoreContextModule)
- Purpose: Handles pointer events → raycasting against country meshes
- Deferred init: attaches listeners on `mount` event
- Distinguishes click vs drag (5px threshold)

### three/modules/CountryStateModule.ts (CoreContextModule)
- Purpose: Single source of truth for selected/hovered country
- State: `selectedCode: string | null`, `hoveredCode: string | null`
- Emits: `select`, `deselect`, `hover`, `unhover` events
- Re-click same country = deselect (toggle behavior)
- On select: triggers CameraModule.flyTo via CountryDataMap coordinates

### three/features/GlobeFeature.ts (Object3DFeature)
- Purpose: Creates the base sphere mesh (ocean)
- Material: MeshStandardNodeMaterial with TSL ocean shader
- Radius: GLOBE_RADIUS (5)

### three/features/CountriesFeature.ts (Object3DFeature)
- Purpose: Loads world-atlas TopoJSON, converts to GeoJSON, creates country meshes
- Each country = separate Mesh with CountryMeshFeature attached
- Stores meshes in Map<countryCode, Mesh> for lookup
- ISO matching: ccn3 primary + case-insensitive name fallback

**Геометрический пайплайн:**
1. Загрузка `countries-110m.json` из world-atlas (TopoJSON)
2. Конвертация в GeoJSON через `topojson-client: feature(topology, topology.objects.countries)`
3. Для каждого GeoJSON feature:
   - **MultiPolygon**: обрабатывается как массив отдельных Polygon, все объединяются через `mergeGeometries`
   - **Polygon с дырами (holes)**: внешнее кольцо = контур, остальные = дыры. Передаются в earcut
   - **Антимеридиан и полюса**: обрабатываются автоматически через локальную 2D-проекцию (не нужен специальный split)
4. **Локальная 2D-проекция для earcut**: вершины сначала проецируются на сферу (`lonLatToVec3`), затем в локальную 2D-плоскость вокруг сферического центра полигона. Earcut работает в этой плоскости — корректно для полярных стран и антимеридиана
5. Проекция координат на сферу: `x = R * cos(lat) * sin(lon)`, `y = R * sin(lat)`, `z = R * cos(lat) * cos(lon)` (Y-up, lon=0 → +Z, lon>0 → +X)
6. **Spherical subdivision после earcut**: крупные плоские треугольники "проваливаются" внутрь сферы. Mesh subdivide'ится на сфере (глубина 2, для очень больших стран 3) с общими midpoint'ами по рёбрам. Все точки нормализуются на COUNTRY_RADIUS
7. **Winding normalization**: после subdivision инвертированные треугольники переворачиваются для корректного FrontSide culling
8. **Z-fighting**: `polygonOffset: true` с `polygonOffsetFactor: -1` на country materials. Стандартный depth test/write включены. FrontSide culling скрывает обратную сторону
9. **Сферические нормали**: normal = normalize(position) для гладкого освещения

### three/features/CountryMeshFeature.ts (Object3DFeature)
- Purpose: Per-country visual behavior
- Reacts to CountryStateModule events: changes color on hover/select
- Uses TweenModule for smooth transitions

## Data Flow

```
restcountries.com API → react-query cache → React components
                                           ↕ (via useCountryState hook + events)
world-atlas TopoJSON → CountriesFeature → CountryMeshFeature[]
                                           ↕ (via CountryStateModule events)
User pointer events → RaycastModule → CountryStateModule → React + 3D Features
```

### React → 3D direction (currently working):
1. User clicks country in list/table
2. React calls `countryStateModule.select(code)`
3. CountryStateModule emits "select" event
4. CountryMeshFeature reacts: highlights mesh
5. CameraModule.flyTo(lat, lon)

### 3D → React direction (currently working):
1. User clicks country mesh on globe
2. RaycastModule detects hit, calls `countryStateModule.select(code)`
3. CountryStateModule emits "select" event
4. useCountryState hook updates React state
5. CountryInfo panel re-renders with selected country data

## Key Design Decisions
- **All 3D logic in three-kvy-core**: Zero Three.js code in React components (ТЗ requirement)
- **State on class instances**: CountryStateModule holds selection state (ТЗ: "prefer binding state to specific entities / class instances")
- **Minimal global stores**: Only a lightweight React context for CoreContext reference; no Redux/Zustand
- **Events via eventemitter3**: Already a dependency of three-kvy-core; used for 3D↔React bridge
- **No props drilling**: React context for CoreContext + event subscriptions
- **Minimal imperative React code**: useEffect only for mount/unmount; event subscription via custom hooks
- **Local-plane triangulation**: earcut в локальной 2D-плоскости вместо сырого lon/lat — единообразно обрабатывает антимеридиан и полюса
- **Spherical subdivision**: post-earcut subdivision на сфере предотвращает "провалы" крупных треугольников внутрь сферы
- **ISO code mapping**: world-atlas uses numeric ISO codes (feature.id), restcountries returns cca3 — мост через ccn3 + name fallback

## ISO Code Matching Strategy

**Проблема:** world-atlas использует ISO 3166-1 numeric (feature.id), restcountries — cca3. Нужен мост.

**Решение:**
1. При загрузке данных restcountries.com запрашиваем поля `ccn3` (numeric) и `cca3` (alpha-3) для каждой страны
2. Строим `Map<string, string>` — numeric → cca3 — из данных restcountries (поле `ccn3`)
3. Для стран без ccn3 — fallback по name (case-insensitive)
4. При создании country-мешей записываем `mesh.userData.countryCode = cca3` (или null если не нашли)

**Обработка несовпадений:**
- **Страна есть в world-atlas, но нет в restcountries** (например, Антарктида, спорные территории): меш с `userData.countryCode = null`, серый цвет, не кликабельна
- **Страна есть в restcountries, но нет в world-atlas** (микро-государства без полигонов в 110m): присутствует в данных, будет видна в списке/таблице (Phase 3+), нет highlight на глобусе
- **ccn3 отсутствует**: fallback по name, если не нашли — пропускаем
- Логируем все unmatched записи в консоль
