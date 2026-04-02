# Painel de Vagas

Uma plataforma interna para transformar arquivos XLSX de vagas em uma experiencia visual rapida, filtravel e pronta para decisao.


---

## ⚠️ IMPORTANTE: Fluxo de Development, Card e Branching

> **Padrão de Desenvolvimento - LEIA ATENTAMENTE**
>
> Toda nova implementação deve nascer primeiro de um **card/issue** e, somente depois, de uma **branch criada a partir da `master`**.
>
> O fluxo correto de trabalho deve seguir EXATAMENTE essa sequência:
>
> 1. **Abrir um Card/Issue de melhoria** - descreva a feature, bug ou ajuste a implementar
> 2. **Criar uma branch `feature/` a partir de `master`** - use o número do card na nomenclatura
> 3. **Desenvolver e testar localmente** - faça commits regulares na feature
> 4. **Abrir Pull Request** - a PR da feature deve apontar para `develop` (NÃO para `master`)
> 5. **Code Review e Merge em `develop`** - após aprovação, merge e validação
> 6. **Abrir PR de `develop` para `master`** - somente features testadas e aprovadas
> 7. **Merge em `master`** - release final da feature
>
> **Exemplo prático:**
>
> - Card: `#52 - Criar card de resumo no dashboard`
> - Branch criada a partir da `master`: `feature/52-card-resumo-dashboard`
>
> ```bash
> git checkout master
> git pull origin master
> git checkout -b feature/52-card-resumo-dashboard
> ```
>
> **Resumo das branches:**
> - `master`: Produção (releases finais e estáveis)
> - `develop`: Staging (features em validação)
> - `feature/*`: Branches de desenvolvimento vinculadas a um card/issue e sempre criadas a partir de `master`
>
> ⛔ **NÃO faça:**
> - Commits diretos em `master` ou `develop`
> - Criar feature sem card/issue associado
> - Criar branch de feature a partir de outra feature
> - Abrir Pull Request diretamente para `master` na primeira etapa

---

## Diretriz de Design (Obrigatoria)

> **ATENCAO MAXIMA:** o padrao visual oficial da aplicacao deve seguir este Figma:
> https://www.figma.com/design/gollJBtK8PGkffNN4zk9t9/Painel-Dev---releitura?node-id=0-1&p=f&t=zU8zrFzPsNPxZ3qU-0

Todas as novas telas, componentes, ajustes de layout, espacamento, tipografia, cores e estados de interacao devem manter o mesmo designer/padrao visual.

Nao sera considerado concluido nenhum ajuste de UI/UX que fuja do padrao definido nesse design.


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

## Aplicativo Desktop (Electron)

> **Para testadores:** o executavel `.exe` e o unico arquivo necessario para usar o app. Nao e preciso instalar Node.js, Docker ou qualquer dependencia adicional — somente ter o **Google Chrome** ou **Microsoft Edge** instalado na maquina.

O projeto pode ser executado como app desktop Windows, sem precisar subir Docker no computador do usuario final.

### Como o app funciona

- O Electron inicia o backend internamente na porta `3001`
- A UI React e carregada dentro da janela desktop
- O botao **Buscar vagas** dispara o scraper via API (`POST /api/scraper/run`)
- Os arquivos de saida (XLSX/PDF) sao salvos no diretorio de dados do usuario

### Para testadores — usando o instalador

1. Baixe o arquivo `Vagas Full Setup X.X.X.exe` disponibilizado pelo time
2. Execute o instalador e siga os passos (Next → Install → Finish)
3. Abra o atalho **Vagas Full** criado na area de trabalho
4. Clique em **Buscar vagas** para disparar o scraper
5. Aguarde a conclusao — os resultados sao exibidos automaticamente na tabela

> **Requisito:** Chrome ou Edge instalado. O scraper utiliza o browser do sistema via `puppeteer-core`.

### Estrutura principal

```text
electron/
├─ main.js
├─ preload.js
└─ loading.html
```

### Rodar em modo desktop (desenvolvimento)

1. Instale dependencias na raiz:

```bash
npm install
```

2. Gere o build do frontend:

```bash
npm run build:frontend
```

3. Inicie o app Electron:

```bash
npm run electron
```

Opcional (atalho para build + electron):

```bash
npm run electron:dev
```

### Gerar instalador .exe para distribuir

Execute na raiz do monorepo:

```bash
npm run dist
```

O instalador sera gerado em `dist-electron/Vagas Full Setup X.X.X.exe`.

### Observacao para Windows (build local)

Se o `electron-builder` falhar com erro de symlink (winCodeSign), habilite o **Modo de Desenvolvedor** no Windows ou rode o terminal como Administrador antes de executar `npm run dist`.

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
