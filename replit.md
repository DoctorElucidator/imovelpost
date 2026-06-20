# ImóvelPost

Uma plataforma web para corretores de imóveis brasileiros criarem e otimizarem posts de venda para redes sociais com auxílio de IA — com foco em imóveis do programa Minha Casa, Minha Vida.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/imovelpost run dev` — run the frontend (port 21322)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `OPENAI_API_KEY` — OpenAI key for AI post generation

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter + TanStack Query + shadcn/ui (Tailwind)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI (gpt-5-mini) for post generation and market analysis
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (properties, posts, campaigns, trends, analysis)
- `artifacts/api-server/src/routes/` — Express route handlers (properties, posts, generate, analysis, campaigns, dashboard)
- `artifacts/api-server/src/lib/openai.ts` — OpenAI integration: post generation + market analysis
- `artifacts/imovelpost/src/` — React frontend (pages, components, hooks)
- `artifacts/imovelpost/src/components/layout.tsx` — App shell with sidebar navigation

## Architecture decisions

- Contract-first OpenAPI: all types generated from `openapi.yaml` via Orval — never hand-write types
- AI generation is server-side only — OpenAI key never exposed to browser
- All AI text is in Portuguese (Brazil); UI labels and routes also in PT-BR
- `scheduledAt`/`publishedAt` stored as Drizzle `timestamp` but received as ISO strings from API — coerced in route handlers
- Market analysis runs on-demand via `POST /api/analysis/run` and persists results in `trend_patterns` table

## Product

- **Dashboard** — stats overview (imóveis, posts, campanhas) + atividade recente
- **Imóveis** — CRUD completo de imóveis com tipo, programa (MCMV faixas), cidade, preço
- **Gerar Post** — gerador de post IA: escolhe imóvel, plataforma (Facebook, Marketplace, Instagram, WhatsApp), tom, foco
- **Posts Salvos** — todos os posts com filtros por status; copiar para clipboard
- **Análise e Insights** — padrões de performance, descobertas de IA, botão para rodar nova análise
- **Campanhas** — agrupamento de posts por cidade/programa/plataforma

## User preferences

- Interface in Portuguese (Brazil)
- No emojis in UI or AI-generated content
- BRL currency format: R$ 250.000,00

## Gotchas

- After changing `lib/db/src/schema/`, run `pnpm run typecheck:libs` before checking artifact typecheck — stale lib declarations cause false TS errors
- `scheduledAt` in `CreatePostBody` is a string; convert with `new Date()` before Drizzle insert
- The `gpt-5-mini` model is used for post generation (cost-effective, high-volume)
- Run `pnpm --filter @workspace/db run push` after any schema change

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
