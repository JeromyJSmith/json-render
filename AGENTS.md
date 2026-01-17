# AGENTS.md

## Commands
- `pnpm install` - Install dependencies
- `pnpm build` / `pnpm dev` - Build or run all packages/apps
- `pnpm lint` / `pnpm type-check` / `pnpm format` - Code quality checks
- `pnpm test` - Run all tests | `pnpm test <path>` - Run single test (e.g., `pnpm test packages/core/src/catalog.test.ts`)
- `pnpm --filter @json-render/core build` - Target specific package

## Architecture (Turborepo + pnpm)
- `packages/core/` → `@json-render/core` - Types, Zod schemas, catalog, visibility, actions, validation
- `packages/react/` → `@json-render/react` - Renderer, providers, hooks, streaming
- `apps/web/` → Docs/Playground (Next.js) | `examples/` → Example apps
- Tests co-located with source (`*.test.ts`, `*.test.tsx`)

## Code Style
- No emojis in code or UI
- Run `pnpm type-check` after changes
- Zod v4 for schemas, React 19 with "use client" directives
- Prettier for formatting (auto-runs on commit via lint-staged)

## Source Code Reference
Run `npx opensrc <package>` to fetch npm package source code. See `opensrc/sources.json` for available packages.
