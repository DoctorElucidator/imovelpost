# Configuracao local — ImóvelPost

## Pre-requisitos

- Node.js 20+ (`node -v`)
- pnpm 10+ (`npm install -g pnpm`)
- Docker (para subir o PostgreSQL localmente)

## 1. Clonar e instalar

```bash
git clone <url-do-repositorio>
cd imovelpost
pnpm install
```

## 2. Banco de dados

Suba o PostgreSQL com Docker:

```bash
docker compose up -d
```

Isso cria um banco `imovelpost` em `localhost:5432`.

## 3. Variaveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` e preencha:

| Variavel        | Descricao                                          |
|-----------------|----------------------------------------------------|
| `DATABASE_URL`  | Connection string do PostgreSQL                    |
| `OPENAI_API_KEY`| Chave da OpenAI para geracao de posts com IA       |
| `PORT`          | Porta do servidor (padrao: `8080`)                 |

## 4. Aplicar schema do banco

```bash
pnpm --filter @workspace/db run push
```

## 5. Rodar o servidor de API

```bash
PORT=8080 DATABASE_URL=postgresql://postgres:postgres@localhost:5432/imovelpost OPENAI_API_KEY=sk-... \
  pnpm --filter @workspace/api-server run dev
```

Ou com `.env` carregado automaticamente por uma ferramenta como `dotenv-cli`:

```bash
npx dotenv -e .env -- pnpm --filter @workspace/api-server run dev
```

O servidor ficara disponivel em `http://localhost:8080`.

## 6. Rodar o frontend (opcional)

O frontend consome a API via proxy. Em desenvolvimento local:

```bash
pnpm --filter @workspace/imovelpost run dev
```

## Deploy

- **Replit**: configure as variaveis de ambiente no painel de Secrets e use os workflows existentes.
- **VPS / servidor proprio**: build do servidor com `pnpm --filter @workspace/api-server run build` e execute `node ./dist/index.mjs` com as variaveis de ambiente setadas.
- **Variavel obrigatoria em producao**: `DATABASE_URL`, `OPENAI_API_KEY`. `PORT` tem padrao `8080`.
