# Architecture: Globe Explorer

## Overview
A single-page React application with an embedded Three.js 3D globe scene. The 3D logic lives entirely in `three-kvy-core` classes (features/modules). React handles UI panels, data fetching, and state. Communication between React and 3D uses eventemitter3 events.

## WebGPU / Mobile Compatibility Strategy

WebGPURenderer имеет **встроенный автоматический fallback на WebGL2**. Если `navigator.gpu` недоступен или `requestAdapter()` не возвращает адаптер, рендерер прозрачно переключается на `WebGLBackend`. В консоли появится: `"WebGPURenderer: WebGPU is not available, running under WebGL2 backend."`. Для нашего кода ничего не меняется — один и тот же API.

**Инициализация:**
1. `createGlobeContext` создаёт `new WebGPURenderer({ antialias: true })`
2. Вызывает `await renderer.init()` — в этот момент происходит проверка WebGPU и возможный fallback
3. Только после успешного init создаётся CoreContext и вызывается `ctx.run()`
4. GlobeCanvas показывает loading-состояние, пока init не завершился

**Touch-устройства:**
- `camera-controls` использует Pointer Events — работает одинаково для mouse и touch без дополнительной настройки
- Конфигурация touch-жестов: one finger = rotate, two fingers = dolly (pinch zoom), truck отключён (не нужен для глобуса)
- `RaycastModule` использует pointer events (pointerdown/pointermove) — единый код для mouse и touch
- Layout: на мобильных CountryInfo панель перекрывает снизу, а не сбоку

**Проверка:**
- Chrome/Edge desktop: WebGPU native
- Safari desktop/iOS: fallback на WebGL2 (WebGPU за флагом)
- Chrome Android: WebGPU с версии 121+, иначе WebGL2 fallback
- Firefox: WebGL2 fallback
- Тестируем: `renderer.backend.isWebGPUBackend` для логирования фактического бэкенда

**Ограничение:** TSL-код компилируется в WGSL (WebGPU) или GLSL ES 3.0 (WebGL2) автоматически. Единственное, что НЕ переносимо — `wgslFn()` (raw WGSL). Мы его не используем, только TSL nodes.

## File Structure
```
globe-explorer/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
├── package.json
├── public/
│   └── textures/              # Globe textures (if needed)
├── src/
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Root layout: globe + UI panels
│   ├── index.css              # Tailwind CSS v4 entry (@import "tailwindcss")
│   │
│   ├── three/                 # All Three.js logic via three-kvy-core
│   │   ├── createGlobeContext.ts  # Factory: CoreContext + WebGPURenderer + camera + scene + modules
│   │   ├── modules/
│   │   │   ├── CameraModule.ts        # CoreContextModule — camera-controls wrapper
│   │   │   ├── TweenModule.ts         # CoreContextModule — tween.js Group, updated per frame
│   │   │   ├── RaycastModule.ts       # CoreContextModule — pointer raycasting for hover/click
│   │   │   └── CountryStateModule.ts  # CoreContextModule — selected/hovered country state + events
│   │   ├── features/
│   │   │   ├── GlobeFeature.ts        # Object3DFeature — sphere mesh with ocean TSL shader
│   │   │   ├── CountriesFeature.ts    # Object3DFeature — loads GeoJSON, creates country meshes
│   │   │   ├── CountryMeshFeature.ts  # Object3DFeature — per-country: hover/select visual state
│   │   │   └── AtmosphereFeature.ts   # Object3DFeature — (Bonus) atmosphere glow effect
│   │   ├── shaders/
│   │   │   ├── oceanShader.ts         # TSL: ocean surface shader
│   │   │   ├── countryShader.ts       # TSL: country mesh shader (base + hover + select states)
│   │   │   └── atmosphereShader.ts    # TSL: (Bonus) atmosphere glow
│   │   └── utils/
│   │       ├── geoProjection.ts       # lon/lat → Vec3 on sphere, GeoJSON → BufferGeometry
│   │       ├── triangulate.ts         # Earcut wrapper for polygon triangulation
│   │       └── isoCodeMap.ts          # ISO numeric → alpha-3 mapping for world-atlas ↔ restcountries
│   │
│   ├── components/
│   │   ├── GlobeCanvas.tsx        # Mounts CoreContext to a <div>, manages lifecycle
│   │   ├── CountryInfo.tsx        # Selected country details panel
│   │   ├── CountryList.tsx        # Level 1: searchable country list
│   │   ├── CountryTable.tsx       # Level 2: @tanstack/react-table + virtual scroll
│   │   ├── SearchInput.tsx        # Search input using base-ui
│   │   ├── ThemeToggle.tsx        # Bonus: light/dark theme toggle
│   │   └── ui/                    # Shared UI primitives (base-ui wrappers)
│   │       └── cn.ts              # clsx + tailwind-merge utility
│   │
│   ├── hooks/
│   │   ├── useCountries.ts        # react-query: fetch from restcountries.com
│   │   ├── useGlobeContext.ts     # React context + hook for accessing CoreContext
│   │   └── useCountryState.ts    # Subscribe to CountryStateModule events from React
│   │
│   ├── types/
│   │   └── country.ts            # TypeScript interfaces: Country, GeoFeature, etc.
│   │
│   └── lib/
│       └── constants.ts          # Globe radius, API URLs, etc.
```

## Modules

### three/createGlobeContext.ts
- Purpose: Factory function that creates and configures the entire 3D scene
- Creates: WebGPURenderer, PerspectiveCamera, Scene, Clock
- Registers modules: CameraModule, TweenModule, RaycastModule, CountryStateModule
- Creates globe Object3D with GlobeFeature + CountriesFeature attached
- Returns: CoreContext instance

### three/modules/CameraModule.ts (CoreContextModule)
- Purpose: Wraps camera-controls for orbit navigation
- Configures: distance limits, polar angle limits, smooth transitions, touch support
- Exposes: `flyTo(lat, lon)` method for programmatic navigation
- Updates camera-controls in render loop via `useCtx`
- Touch config: one finger = rotate, two fingers = dolly, truck отключён

**Канонический источник координат для flyTo:**
- `flyTo(lat, lon)` принимает географические координаты (широта, долгота в градусах)
- Внутри конвертирует в azimuth/polar для camera-controls: `azimuth = -lon * DEG2RAD`, `polar = (90 - lat) * DEG2RAD`
- Вызывает `controls.normalizeRotations()` перед каждым `rotateTo` (требование camera-controls v3 для кратчайшего пути)
- Координаты берутся из **единственного источника**: поле `latlng` из данных restcountries.com, закешированных в react-query

**Откуда приходит lat/lon в каждом сценарии:**
1. **Клик по мешу на глобусе** → RaycastModule определяет countryCode из `mesh.userData.countryCode` → CountryStateModule.select(code) → CameraModule получает lat/lon из CountryDataMap (Map<code, {lat, lon}>, заполняется при загрузке данных restcountries)
2. **Клик по элементу списка/таблицы** → React вызывает CountryStateModule.select(code) → тот же путь: CameraModule берёт координаты из CountryDataMap
3. **CountryDataMap** — Map<string, {lat, lon}>, хранится в CountryStateModule, заполняется один раз при загрузке данных из restcountries.com. Это единственное место, где хранятся координаты для навигации.

### three/modules/TweenModule.ts (CoreContextModule)
- Purpose: Manages tween.js Group, calls `group.update()` each frame
- Used by features for any animations (hover glow, selection pulse, fly-to)

### three/modules/RaycastModule.ts (CoreContextModule)
- Purpose: Handles pointer events → raycasting against country meshes
- Emits: `hover(countryCode)`, `unhover()`, `click(countryCode)` events
- Handles both mouse and touch

### three/modules/CountryStateModule.ts (CoreContextModule)
- Purpose: Single source of truth for selected/hovered country
- State: `selectedCode: string | null`, `hoveredCode: string | null`
- Emits: `select`, `deselect`, `hover`, `unhover` events
- React subscribes to these events via useCountryState hook

### three/features/GlobeFeature.ts (Object3DFeature)
- Purpose: Creates the base sphere mesh (ocean)
- Material: MeshStandardNodeMaterial with TSL ocean shader
- Radius: defined in constants

### three/features/CountriesFeature.ts (Object3DFeature)
- Purpose: Loads world-atlas TopoJSON, converts to GeoJSON, creates country meshes
- Each country = separate Mesh with CountryMeshFeature attached
- Stores meshes in Map<countryCode, Mesh> for lookup

**Геометрический пайплайн:**
1. Загрузка `countries-110m.json` из world-atlas (TopoJSON)
2. Конвертация в GeoJSON через `topojson-client: feature(topology, topology.objects.countries)`
3. Для каждого GeoJSON feature:
   - **MultiPolygon**: обрабатывается как массив отдельных Polygon. Каждый polygon = отдельная геометрия, все объединяются в один BufferGeometry через `mergeGeometries`
   - **Polygon с дырами (holes)**: внешнее кольцо (coordinates[0]) = контур, остальные кольца (coordinates[1..n]) = дыры. Передаются в earcut как holes для корректной триангуляции (пример: South Africa с Lesotho внутри)
   - **Антимеридиан (±180°)**: для полигонов, пересекающих антимеридиан (например, Россия, Фиджи), проверяем разницу долгот соседних вершин. Если > 180°, разрезаем полигон на две части по антимеридиану. **Ограничение:** при разрезке holes отбрасываются; в датасете 110m нет полигонов с одновременным пересечением антимеридиана и дырами
   - **Subdivision**: отключён перед earcut-триангуляцией — great-circle промежуточные точки создают самопересечения в 2D lon/lat плоскости. Для 110m данных плотность вершин достаточная
4. Проекция 2D координат на сферу: `x = -R * cos(lat) * sin(lon)`, `y = R * sin(lat)`, `z = R * cos(lat) * cos(lon)`
5. **Winding normalization**: после проекции на сферу нормали каждого треугольника проверяются на ориентацию (dot(cross(AB,AC), center)). Треугольники с инвертированным winding переворачиваются для корректного FrontSide culling
6. **Rendering approach**: country meshes рендерятся как overlay поверх океана: `depthTest: false`, `depthWrite: false`, `renderOrder: 1`, `FrontSide`. Обратная сторона глобуса скрывается FrontSide culling (не depth test). **Ограничение**: 3D-объекты с renderOrder < 1 будут отображаться ЗА странами, даже если ближе к камере
7. Нормали пересчитываются после проекции через `geometry.computeVertexNormals()`

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

### React → 3D direction:
1. User clicks country in list/table
2. React calls `countryStateModule.select(code)`
3. CountryStateModule emits "select" event
4. CountryMeshFeature reacts: highlights mesh
5. CameraModule.flyTo(lat, lon)

### 3D → React direction:
1. User clicks country mesh on globe
2. RaycastModule detects hit, calls `countryStateModule.select(code)`
3. CountryStateModule emits "select" event
4. useCountryState hook updates React state
5. CountryInfo panel re-renders with new country

## Key Design Decisions
- **All 3D logic in three-kvy-core**: Zero Three.js code in React components (ТЗ requirement)
- **State on class instances**: CountryStateModule holds selection state (ТЗ: "prefer binding state to specific entities / class instances")
- **Minimal global stores**: Only a lightweight React context for CoreContext reference; no Redux/Zustand
- **Events via eventemitter3**: Already a dependency of three-kvy-core; used for 3D↔React bridge
- **No props drilling**: React context for CoreContext + event subscriptions
- **Minimal imperative React code**: useEffect only for mount/unmount; event subscription via custom hooks
- **GeoJSON approach**: TopoJSON from world-atlas → triangulated meshes on sphere (our design choice)
- **ISO code mapping**: world-atlas uses numeric ISO codes (feature.id, e.g. "840"), restcountries returns cca3 (alpha-3, e.g. "USA") — we build a lookup map

## ISO Code Matching Strategy

**Проблема:** world-atlas использует ISO 3166-1 numeric (feature.id), restcountries — cca2/cca3. Нужен мост.

**Решение:**
1. При загрузке данных restcountries.com запрашиваем поля `ccn3` (numeric) и `cca3` (alpha-3) для каждой страны
2. Строим `Map<string, string>` — numeric → cca3 — из самих данных restcountries (поле `ccn3` → ключ, `cca3` → значение)
3. При создании country-мешей в CountriesFeature записываем `mesh.userData.countryCode = cca3` (или null если не нашли)

**Обработка несовпадений:**
- **Страна есть в world-atlas, но нет в restcountries** (например, Антарктида, спорные территории): меш создаётся с `userData.countryCode = null`, рендерится серым цветом, не кликабельна, не отображается в списке
- **Страна есть в restcountries, но нет в world-atlas** (например, микро-государства без полигонов в 110m): отображается в списке/таблице, но при клике из списка камера летит к координатам, подсветка меша не происходит
- **ccn3 отсутствует у записи restcountries** (некоторые территории не имеют numeric кода): пытаемся fallback-матчинг по name, если не нашли — пропускаем
- Логируем все unmatched записи в консоль при инициализации для отладки
