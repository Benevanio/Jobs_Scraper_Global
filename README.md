# Painel de Vagas

Uma plataforma interna para transformar arquivos XLSX de vagas em uma experiencia visual rapida, filtravel e pronta para decisao.

O projeto esta organizado em monorepo e conecta duas frentes:

- frontend: dashboard em React + Vite + Tailwind
- backend: scraper + API em Express para leitura e exposicao dos dados

## O que ja entregamos

- Dashboard com visual profissional em tema claro e escuro
- Leitura automatica dos arquivos XLSX gerados no fluxo de scraping
- Busca global por titulo, empresa, local e link
- Filtros por palavra-chave
- Selecao de arquivo de origem para alternar datasets
- Tabela paginada com controle de itens por pagina
- Endpoint de saude e endpoints de listagem/consulta de vagas
- Suite de testes (unitarios + integracao) em frontend e backend
- Cobertura de testes com alvo minimo de 80%

## Demo

### Interface em tema escuro e claro



<img width="1870" height="847" alt="Image" src="https://github.com/user-attachments/assets/37de83d7-e841-4d9c-a48f-efc2c3bb27bc" />


<img width="1839" height="874" alt="Image" src="https://github.com/user-attachments/assets/6b2e1a50-4b0a-4904-aafa-95667ca8928c" />


<img width="1861" height="695" alt="Image" src="https://github.com/user-attachments/assets/fbf5b122-af42-4a52-b457-23243b0175a9" />

## Arquitetura do produto

```text
.
├─ frontend/
├─ backend/
├─ docker-compose.yml
└─ package.json
```

## Stack

- Frontend: React 19, TypeScript, Vite 8, Tailwind CSS
- Backend: Node.js 22+, Express 5, XLSX, Axios, Cheerio
- Qualidade: Vitest, Testing Library, coverage v8
- Orquestracao local: npm workspaces + Docker Compose

## Requisitos

- Node.js 22+
- npm
- Docker (opcional)

## Comecando rapido

Instale tudo na raiz do monorepo:

```bash
npm install
```

Como usamos workspaces, esse comando instala as dependencias da raiz e tambem de `frontend` e `backend`.

Suba a plataforma completa em desenvolvimento:

```bash
npm run dev
```

Subida separada por servico:

```bash
npm run dev:frontend
npm run dev:backend
```

## Scripts principais

### Raiz

- `npm run dev`: frontend + backend juntos
- `npm run dev:frontend`: sobe apenas frontend
- `npm run dev:backend`: sobe apenas backend
- `npm run scraper`: executa scraping no backend
- `npm run scraper:watch`: scraping com hot reload
- `npm run test`: executa testes do backend
- `npm run build`: build do frontend
- `npm run validate`: teste backend + lint/build frontend
- `npm run test:coverage`: coverage frontend + backend

### Backend

- `npm run start`: sobe API (`src/server.js`)
- `npm run dev`: sobe API (`src/server.js`)
- `npm run scraper`: executa scraping (`index.js`)
- `npm run scraper:watch`: scraping com nodemon
- `npm run api`: alias para subir API
- `npm run test`: testes com Vitest
- `npm run test:coverage`: cobertura com Vitest
- `npm run test:watch`: testes em modo watch
- `npm run validate`: valida backend

### Frontend

- `npm run dev`: Vite dev server
- `npm run build`: build de producao
- `npm run lint`: lint com ESLint
- `npm run preview`: preview do build
- `npm run test`: testes com Vitest
- `npm run test:coverage`: coverage com Vitest

## Testes e cobertura

Estrutura de testes:

- backend: `backend/tests/unit` e `backend/tests/integration`
- frontend: `frontend/tests/unit` e `frontend/tests/integration`

Meta minima de cobertura:

- lines >= 80%
- statements >= 80%
- functions >= 80%
- branches >= 80%

Comandos de cobertura:

```bash
npm run test:coverage
npm --workspace frontend run test:coverage
npm --workspace backend run test:coverage
```

Guia de boas praticas: [TESTING.md](TESTING.md)

## Variaveis de ambiente

Arquivos:

- `backend/.env.example` (base)
- `backend/.env` (local)

## Docker

Subir frontend + backend:

```bash
docker compose up --build
```

Subir em background:

```bash
docker compose up --build -d
```

Parar e remover containers/rede:

```bash
docker compose down
```

Rebuild apenas backend:

```bash
docker compose build backend
```

Rodar scraping pontual via container:

```bash
docker compose run --rm backend node index.js
```

Logs:

```bash
docker compose logs -f
docker compose logs -f backend
```

Servicos em desenvolvimento:

- frontend: http://localhost:5173
- backend: http://localhost:3001

A API le planilhas localizadas em `backend/output/`.

## Endpoints da API

- `GET /api/health`
- `GET /api/jobs/files`
- `GET /api/jobs`
- `GET /api/jobs?file=nome.xlsx`
