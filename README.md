# Vagas Full Monorepo

Projeto reorganizado em monorepo com dois workspaces:

- `frontend`: dashboard React/Vite/Tailwind
- `backend`: scraper + API Express para leitura de vagas em XLSX

## Estrutura

```text
.
├─ frontend/
├─ backend/
├─ docker-compose.yml
└─ package.json
```

## Requisitos

- Node.js 22+
- npm
- Docker (opcional)

## Instalar dependencias

Na raiz do projeto:

```bash
npm install
```

Como o projeto usa `workspaces`, esse comando instala dependencias da raiz e dos pacotes `frontend` e `backend`.

## Rodar em desenvolvimento

Subir frontend e backend juntos:

```bash
npm run dev
```

Rodar separadamente:

```bash
npm run dev:frontend
npm run dev:backend
```

## Scripts principais

Na raiz:

- `npm run dev`: frontend + backend juntos
- `npm run dev:frontend`: sobe apenas frontend
- `npm run dev:backend`: sobe apenas backend (API)
- `npm run scraper`: executa scraping via backend workspace
- `npm run scraper:watch`: scraping com nodemon via backend workspace
- `npm run test`: testes do backend
- `npm run build`: build do frontend
- `npm run validate`: teste backend + lint/build frontend
- `npm run test:coverage`: coverage frontend + backend (threshold 80%)

No backend (`backend/package.json`):

- `npm run start`: sobe API (`src/server.js`)
- `npm run dev`: sobe API (`src/server.js`)
- `npm run scraper`: executa scraping (`index.js`)
- `npm run scraper:watch`: scraping com hot reload (`nodemon index.js`)
- `npm run api`: alias para subir API (`src/server.js`)
- `npm run test`: testes com Vitest
- `npm run test:watch`: testes em modo watch
- `npm run validate`: valida backend (`npm test`)

No frontend (`frontend/package.json`):

- `npm run dev`: Vite dev server
- `npm run build`: build de producao
- `npm run lint`: lint com ESLint
- `npm run preview`: preview do build
- `npm run test`: testes com Vitest
- `npm run test:coverage`: coverage com Vitest (threshold 80%)

## Testes e cobertura

Estrutura de testes:

- backend: `backend/tests/unit` e `backend/tests/integration`
- frontend: `frontend/tests/unit` e `frontend/tests/integration`

Cobertura minima exigida:

- lines >= 80%
- statements >= 80%
- functions >= 80%
- branches >= 80%

Comandos:

```bash
npm run test:coverage
npm --workspace frontend run test:coverage
npm --workspace backend run test:coverage
```

Guia de boas praticas de testes: [TESTING.md](https://github.com/Benevanio/Jobs_Scraper_Global/blob/master/TESTING.md).

## Variaveis de ambiente

Arquivo base:

- `backend/.env.example`

Arquivo local:

- `backend/.env`

## Docker

Subir frontend e backend:

```bash
docker compose up --build
```

Subir em background:

```bash
docker compose up --build -d
```

Parar e remover containers/rede do projeto:

```bash
docker compose down
```

Rebuild apenas backend:

```bash
docker compose build backend
```

Executar scraping via Docker (execucao pontual):

```bash
docker compose run --rm backend node index.js
```

Ver logs dos servicos:

```bash
docker compose logs -f
```

Ver logs apenas do backend:

```bash
docker compose logs -f backend
```

Servicos:

- `frontend`: http://localhost:5173
- `backend`: http://localhost:3001

A API le planilhas de `backend/output/`.

## Endpoints da API

- `GET /api/health`
- `GET /api/jobs/files`
- `GET /api/jobs`
- `GET /api/jobs?file=nome.xlsx`
