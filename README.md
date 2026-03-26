# @unicitylabs/sphere-ui

Shared UI library for the Sphere ecosystem. Provides a unified design system, components, and hooks used across all Sphere applications.

## Packages that use sphere-ui

| App | Description |
|-----|-------------|
| [sphere](https://github.com/unicity-sphere/sphere) | Wallet & marketplace |
| [sphere-dev](https://github.com/unicity-sphere/sphere-dev) | Developer Portal |
| [sphere-backoffice](https://github.com/unicity-sphere/sphere-backoffice) | Admin panel |
| [sphere-quest](https://github.com/unicity-sphere/sphere-quest) | Quest frontend (iframe) |

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

- `react` ^19.0.0
- `react-dom` ^19.0.0
- `@tanstack/react-query` ^5.0.0
- `@tanstack/react-table` ^8.0.0
- `@dnd-kit/core` ^6.0.0
- `@dnd-kit/sortable` ^8.0.0
- `lucide-react` ^0.400.0

## License

MIT
