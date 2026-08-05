# @unicitylabs/sphere-ui

Shared UI library for the Sphere ecosystem. Provides a unified design system, components, and hooks used across all Sphere applications.

## Packages that use sphere-ui

| App | Description |
|-----|-------------|
| [sphere-dev-portal](https://github.com/unicity-sphere/sphere-dev-portal) | Developer Portal |
| [sphere-backoffice](https://github.com/unicity-sphere/sphere-backoffice) | Admin panel |
| [sphere-quest](https://github.com/unicity-sphere/sphere-quest) | Quest frontend (iframe) |

> **Planned migration: sphere wallet** — the sphere wallet currently does not consume sphere-ui; migration is a separate multi-PR project tracked outside this repo.

## Installation

```bash
npm install @unicitylabs/sphere-ui
```

For local development, link from the monorepo:

```bash
npm install file:../sphere-ui
```

## Usage

### Styles

Import the design system in your app's entry point:

```typescript
import '@unicitylabs/sphere-ui/styles';
```

This provides:
- Tailwind 4 theme tokens (colors, fonts, shadows, radii)
- Light/dark mode CSS variables
- Component classes (`sphere-card`, `btn-primary`, `badge-*`, `sphere-input`, etc.)

### Components

```typescript
import {
  Field,
  Section,
  FormModal,
  ConfirmDialog,
  DataTable,
  StatusBadge,
  SearchInput,
  EmptyState,
  CustomSelect,
  PageShell,
  AlertBanner,
  AddressDisplay,
  JsonPanel,
  JsonToggleButton,
  ChainInput,
  MemoConditionsEditor,
} from '@unicitylabs/sphere-ui';
```

### Hooks

```typescript
import {
  useCanvasState,
  useAchievementCanvasState,
  useTestMode,
  useChainMode,
  useAchievementTestMode,
  useAchievementChainMode,
} from '@unicitylabs/sphere-ui/hooks';
```

### Icons

```typescript
import {
  IconBack, IconUndo, IconEdit, IconTrash, IconPlus,
  IconSearch, IconCheck, IconX, IconChain, IconPlay,
  IconStar, IconDiamond, IconCircle,
  // ... and more
} from '@unicitylabs/sphere-ui';
```

### Types

```typescript
import type {
  QuestData,
  TrackData,
  AchievementData,
  QuestFormApi,
  TrackFormApi,
  AchievementFormApi,
  QueryKeys,
} from '@unicitylabs/sphere-ui';
```

## Design System

### Tailwind Theme Tokens

Defined in `src/styles/tokens.css` via `@theme {}` block:

| Token | Light | Dark |
|-------|-------|------|
| `--color-bg-primary` | `#f5f5f5` | `#060606` |
| `--color-bg-card` | `#ffffff` | `#111111` |
| `--color-text-primary` | `#171717` | `#fefefe` |
| `--color-text-muted` | `#a3a3a3` | `rgba(255,255,255,0.28)` |
| `--color-brand-orange` | `#FF6F00` | `#FF6F00` |
| `--font-display` | Anton | Anton |
| `--font-sans` | Geist | Geist |
| `--font-mono` | Geist Mono | Geist Mono |

### Component Classes

| Class | Description |
|-------|-------------|
| `sphere-card` | Card with border, radius, hover effect |
| `sphere-card-glow` | Card with orange glow shadow |
| `sphere-input` | Text input with focus ring |
| `sphere-textarea` | Multi-line text input |
| `sphere-select` | Select dropdown |
| `sphere-table` | Table with header/row styles |
| `btn-primary` | Orange primary button |
| `btn-secondary` | Outlined secondary button |
| `btn-danger` | Red danger button |
| `badge-green` | Green status badge |
| `badge-orange` | Orange status badge |
| `badge-gray` | Gray status badge |
| `badge-red` | Red status badge |
| `badge-blue` | Blue status badge |
| `badge-purple` | Purple status badge |
| `badge-yellow` | Yellow status badge |

Backward-compatible aliases `admin-card`, `admin-input`, etc. are also available.

## Media components

Components for project preview UIs — same look as sphere wallet's marketplace, so dev-portal and backoffice can show creators what their project will look like.

**Upload (v0.1.16+):**
- `<MediaUploader>` — drag-drop file upload + URL paste with progress, validation, error states. Pass an `uploadFn` prop that performs your presign → PUT → confirm flow against your backend.
- `<MediaGallery>` — sortable list of screenshots (max 10) via @dnd-kit; uses `<MediaUploader>` inline for adding items.

**Marketplace preview (v0.1.17+):**
- `<MarketplaceProjectCard>` — 1:1 visual copy of sphere wallet's regular marketplace card. Banner + accentColor gradient, logo overflow ring, category badge, Users/Target/ThumbsUp stats, optional install button overlay. Framer-motion hover lift.
- `<FeaturedProjectCard>` — 1:1 copy of sphere wallet's "featured" variant. Full-banner background, Star badge, bottom-overlay content.
- `<InstalledProjectIcon>` — 1:1 copy of sphere wallet's desktop dock icon. Accepts `showLabel` prop for dock vs grid layouts.
- `<ProjectPagePreview>` — stateless version of sphere wallet's full `/apps/:slug` page. Hero + stats + social + screenshots strip + quests + achievements + reviews placeholder. Accepts all data via props.

All preview components are decorative — they don't fetch data, don't wrap navigation, don't trigger install. Use them in dev-portal/backoffice forms to show the creator what users will see.

Helper exports: `MEDIA_LIMITS`, `isMimeAllowed`, `isSizeAllowed`, `humanSize`. Types: `MediaKind`, `MediaMime`, `MediaLimit`, `MediaUploadFn`, `MediaUploadResult`, `MediaItem`, `QuestPreviewSummary`, `AchievementPreviewSummary`.

## Development

```bash
npm install      # Install dependencies
npm run build    # Build with tsup (ESM + DTS)
npm run dev      # Watch mode
npm run typecheck # TypeScript check
```

### Build Output

```
dist/
  index.js        # Base components + types
  index.d.ts
  forms/index.js  # Quest/Track/Achievement form exports
  canvas/index.js # Canvas component exports
  panels/index.js # Panel component exports
  hooks/index.js  # Hook exports
```

## Architecture

```
src/
  styles/
    tokens.css       # Tailwind 4 @theme tokens + light/dark CSS vars
    components.css   # Reusable utility classes
    index.css        # Barrel CSS import
  components/        # 15 base UI components
  hooks/             # 6 canvas/chain/test mode hooks
  forms/             # Quest/Track/Achievement form barrel
  canvas/            # Canvas component barrel
  panels/            # Panel component barrel
  types.ts           # Shared TypeScript interfaces
  index.ts           # Main barrel export
```

## Peer Dependencies

Required — every entry point needs them:

- `react` ^19.0.0
- `react-dom` ^19.0.0

Optional (`peerDependenciesMeta.optional`) — only some entry points need them:

- `@tanstack/react-table` ^8.0.0 — root barrel only (`DataTable`)
- `@dnd-kit/core` ^6.0.0 — root barrel and `./hooks` only
- `@dnd-kit/sortable` ^8.0.0 || ^10.0.0 — root barrel and `./hooks` only
- `@dnd-kit/utilities` ^3.0.0 — root barrel only (`MediaGallery`)
- `recharts` ^3.0.0 — `./analytics` only
- `@tanstack/react-query` ^5.0.0 — no entry point imports it today; kept as a
  version hint for apps that pair it with these components

**Do not make these required again.** npm 7+ auto-installs non-optional peers,
so a non-optional entry here forces every consumer's lockfile to contain it,
even one that imports a narrow subpath like `./announcements` (react +
lucide-react + react-markdown + remark-gfm and nothing else). Consumers whose
lockfile was generated with `legacy-peer-deps=true` then fail `npm ci` in CI
with "Missing: <pkg> from lock file". Marking them optional lets each app
declare only what it actually uses; the root-barrel consumers (`sphere`,
`sphere-dev-portal`, `sphere-backoffice`) already list all of them as their own
direct dependencies, so nothing changes for them.

`lucide-react` is a regular dependency, not a peer.

## License

MIT
