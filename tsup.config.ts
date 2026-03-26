import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'forms/index': 'src/forms/index.ts',
    'canvas/index': 'src/canvas/index.ts',
    'panels/index': 'src/panels/index.ts',
    'hooks/index': 'src/hooks/index.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: false,
  clean: true,
  external: [
    'react', 'react-dom', 'react/jsx-runtime',
    '@tanstack/react-query', '@tanstack/react-table',
    '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities',
    'lucide-react',
  ],
  jsx: 'automatic',
});
