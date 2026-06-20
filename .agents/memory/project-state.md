---
name: ImóvelPost — Project State & Next Steps
description: Current build state, architecture decisions, and planned features for future sessions
---

# Current Build State (as of 2026-06-20)

## What's fully working

- **Dashboard** — stats (properties, posts, campaigns) + recent activity feed
- **Imóveis** — full CRUD: create, list, detail, edit, delete; MCMV program support (Faixas 1/2/3)
- **Gerar Post** — AI post generator with:
  - Property selector
  - Photo upload via GCS presigned URL (up to 5 photos)
  - Photo import from real estate portal URLs (VivaReal, ZAP, OLX, Órulo, etc.) — server-side HTML scraping of JSON-LD + OG tags, no API key needed
  - Optional context fields: região/bairro, espaço/tamanho, valor/condições
  - Platform: Instagram, Facebook, FB Marketplace, WhatsApp
  - Tone: Profissional, Amigável, Urgente, Emocional
  - Focus: MCMV, Preço, Localização, Comodidades, Estilo de Vida
  - Edit generated content before saving; copy to clipboard; save as draft or approved
- **Posts Salvos** — list all posts, filter by status; navigate to detail
- **Análise e Insights** — market trend patterns + AI findings; run new analysis on demand
- **Campanhas** — group posts by city/program/platform

## Key files

| File | Purpose |
|---|---|
| `lib/api-spec/openapi.yaml` | Single source of truth for all types |
| `lib/db/src/schema/` | Drizzle table definitions |
| `artifacts/api-server/src/routes/import.ts` | Portal listing scraper endpoint |
| `artifacts/api-server/src/routes/generate.ts` | AI post generation endpoint |
| `artifacts/api-server/src/lib/openai.ts` | OpenAI integration (gpt-5-mini) |
| `artifacts/imovelpost/src/pages/generate.tsx` | Full generate page with import UI |
| `lib/object-storage-web/src/use-upload.ts` | useUpload hook for presigned URL flow |

## Architecture decisions already made

- Contract-first OpenAPI → Orval codegen → React Query hooks + Zod schemas
- All AI text in Portuguese (Brazil); no emojis anywhere
- Server-side scraping for portal import (Node.js fetch + JSON-LD regex parsing)
- Photos: either uploaded to GCS (presigned URL) OR imported as remote URLs — both passed as `imageUrls` to the AI
- AI model: gpt-5-mini (cost-effective for high volume)
- BRL format: `R$ 250.000,00` (Intl.NumberFormat pt-BR)

---

# Planned Features (to implement in future sessions)

## Priority 1 — Core workflow improvements

### 1. WhatsApp Share Button
- On each saved post detail page, add a "Compartilhar via WhatsApp" button
- Opens `https://wa.me/?text=<encoded post content + hashtags>`
- Simple: no backend needed, pure frontend link
- Also add a "Compartilhar" dropdown with WhatsApp + copy options on the posts list

### 2. Post Scheduling
- Add `scheduledAt` date/time picker on the save dialog (already in DB schema)
- Dashboard "agenda da semana" showing queued posts by day
- Simple status: `draft` → `scheduled` → `published`
- No actual publishing automation needed (just track the date, corretor publishes manually)

### 3. Property Detail → Quick Generate
- On the property detail page, add a prominent "Gerar Post" CTA button
- Navigates to `/generate?propertyId=<id>` (already supported via query param)
- Currently the flow exists but the button isn't prominent

## Priority 2 — AI quality improvements

### 4. Portal import → AI description extraction
- After importing a listing URL, also extract the text description from the portal page
- Feed that description into the AI prompt as additional context
- Currently only extracting structured data (price, area, etc.) and photos

### 5. Post templates / saved prompts
- Allow corretores to save their own "tom de voz" templates with pre-filled instructions
- Example: "Meu estilo padrão: sempre mencionar subsídio, usar nome do condomínio..."
- Store in a new `templates` table

### 6. Batch generation
- Select multiple properties → generate posts for all → review in bulk
- Useful for corretores with many listings on the same program/city

## Priority 3 — Analytics & reporting

### 7. Post performance tracking
- Currently posts have a `score` (AI-generated) but no actual performance data
- Add optional fields: visualizações, cliques, leads gerados (manual input by corretor)
- Show performance charts in Análise e Insights

### 8. Export to PDF/PNG
- Export a post as a "card" image suitable for WhatsApp status or Instagram story
- Use HTML canvas or a server-side library to render the post text over a property photo

## Nice-to-have

### 9. Multi-user / team support
- Currently single-user (no auth)
- Add Replit Auth for multiple corretores per agency
- Each corretor sees only their properties/posts

### 10. MCMV program calculator
- Based on property price + buyer income, estimate which MCMV faixa applies
- Show subsídio range, maximum financing, minimum income
- Useful context for generating posts focused on MCMV benefits

---

# Before Starting Next Session

1. Run `pnpm run typecheck` to confirm clean state
2. Run `pnpm --filter @workspace/db run push` if any schema changes planned
3. After any `lib/` change: `pnpm run typecheck:libs` before checking artifacts
4. After `openapi.yaml` change: `pnpm --filter @workspace/api-spec run codegen`

## Rollback point
- Last good checkpoint: `e463877c2e6d03bf6a37dae99d63456024400374`
  (commit: "Add ability to import property photos and details from online listings")
