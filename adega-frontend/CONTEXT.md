# Adega System — Project Context

Complete reference for the adega (beverage shop) sales control system. Read this before continuing development.

---

## 1. Project Overview

A full-stack management system for one or more beverage shops (adegas). Covers the full operational loop:

- **Operators (FUNCIONARIO)** use the PDV to register sales and check stock.
- **Owners (DONO)** manage products, users, stock entries, monitor the dashboard, and close the daily cash register.

The system supports multiple adegas under a single installation. DONO users see all adegas and switch between them via a selector in the sidebar. FUNCIONARIO users are bound to one adega and cannot see data from others.

---

## 2. Tech Stack

### Backend — `adega-backend/`

| Concern | Library / Version |
|---|---|
| Runtime | Java 21 |
| Framework | Spring Boot 3.2.5 |
| Security | Spring Security 6 + JJWT 0.12.5 |
| Persistence | Spring Data JPA + Hibernate 6 |
| Database | PostgreSQL (any recent version) |
| Migrations | Flyway 10.12.0 |
| Mapping | MapStruct 1.5.5 |
| Boilerplate | Lombok 1.18.32 |
| API Docs | SpringDoc OpenAPI 2.5.0 (Swagger UI) |
| Build | Maven (pom.xml) |

Key implementation details:
- JWT tokens expire in **8 hours** (28 800 000 ms). Claims include `usuarioId` and `adegaId` (null for DONO).
- `JwtAuthFilter` injects `adegaId` and `usuarioId` as request attributes — controllers read them via `HttpServletRequest`.
- `@EnableMethodSecurity` is active; `UsuarioController` uses `@PreAuthorize("hasRole('DONO')")` at class level.
- `EstoqueController` strips `custoAquisicao` from the response for FUNCIONARIO roles.
- `VendaService.create()` acquires **pessimistic write locks** on all `VariacaoProduto` rows before decrementing stock, preventing race conditions.
- `ProdutoService.computeSituacao()` is a shared static method used by both the estoque and produto mappers: `CRITICO` (stock == 0), `BAIXO` (stock ≤ minimum), `OK` otherwise.
- `FechamentoCaixaService.getCaixaAberto()` returns a response with `id = null` when no closing record exists yet for today. The frontend checks `!!caixaAberto.id` to determine closed state.
- `DataSeeder` runs on startup once (skips if any users exist). It seeds 2 adegas, 5 users, 5 categories, and 5 products.

### Frontend — `adega-frontend/`

| Concern | Library / Version |
|---|---|
| Runtime | React 19.2.6 |
| Build | Vite 8.0.12 |
| Language | TypeScript 6.0.2 |
| Styling | Tailwind CSS 4.3.0 (`@tailwindcss/vite` plugin) |
| Data fetching | TanStack React Query 5.101.0 |
| Routing | React Router 7.16.0 |
| Forms | react-hook-form 7.77.0 + Zod 4.4.3 |
| Charts | Recharts 3.8.1 |
| Notifications | Sonner 2.0.7 |
| Icons | Lucide React 1.17.0 |
| HTTP | Axios 1.16.1 (proxied to `http://localhost:8080` via Vite) |

Key implementation details:
- Tailwind v4 syntax: `@import "tailwindcss"` in `index.css`. **No `tailwind.config.js`**.
- Auth stored in `localStorage` under key `adega_user` (JSON: `{ token, nome, perfil, adegaId, usuarioId }`).
- Selected adega stored in `localStorage` under key `selected_adega`.
- Cross-component adega change signalled via `window.dispatchEvent(new CustomEvent('adegaChanged', { detail: id }))`. Dashboard, Estoque, and Caixa pages listen for this event.
- `zodResolver(schema) as any` used for forms where `z.preprocess()` or `.default()` makes Zod's input type diverge from the output type (Zod v4 behaviour).
- All currency values formatted with `v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`.

---

## 3. Pages Built

### Login (`/login`)
- Email + password form using react-hook-form + Zod.
- Calls `POST /api/auth/login`, stores the response in localStorage.
- Redirects to `/pdv` on success.

### PDV — Point of Sale (`/pdv`) — All roles
- Left column: product catalog with search and variation cards. Click to add to cart.
- Right column: cart with quantity controls, per-item discount input, and multiple payment method inputs.
- Payment forms pre-fill the remaining balance when a payment method is toggled on.
- Checkout calls `POST /api/vendas`. On success, cart clears and a success toast appears.
- `adegaId` is resolved as: `localStorage.getItem('selected_adega') ?? user.adegaId ?? ''`.
- Supports `PRESENCIAL` and `IFOOD` channels (canal selector).
- Payment methods: DINHEIRO, PIX, DEBITO, CREDITO, VALE.

### Dashboard (`/dashboard`) — DONO only
- Listens for `adegaChanged` events. Shows "select an adega" prompt when none is selected.
- 4 metric cards: Faturamento Líquido, Total Vendas, Ticket Médio, Total Descontos.
- Horizontal bar chart (Recharts): top 5 products by quantity sold.
- Payment breakdown: progress bars for each forma de pagamento.
- Hourly sales bar chart.
- Critical stock alert list (situacao = CRITICO).
- Employee discount table (descontos por funcionário).

### Estoque — Stock (`/estoque`) — All roles
- Listens for `adegaChanged`. All filtering is done client-side after a single fetch.
- Summary pills (Crítico / Baixo / Ok) double as filter toggles.
- Category filter derived from the fetched data (no separate category query).
- `custoAquisicao` column is hidden for FUNCIONARIO users.
- **EntradaDialog**: register a stock entry (variacaoId, quantidade, optional custoAquisicao, observacao).
- **HistoricoDialog**: per-variation movement history (COMPRA, VENDA, AJUSTE, PERDA) with sign indicators (+/−/±).

### Produtos — Products (`/produtos`) — DONO only
- Product list with variation badges (coloured pills) and status toggle.
- **ProdutoDialog**: create (with 1–N variations using `useFieldArray`) or edit (variation list hidden on edit).
- **VariacaoDialog**: add a new variation to an existing product.
- `z.preprocess()` used for optional numeric fields (`custoAquisicao`) to handle empty string → undefined coercion.

### Caixa — Cash Register (`/caixa`) — All roles
- Listens for `adegaChanged`. Queries `getCaixaAberto`, `getHistoricoCaixa`, and `getDashboard` for today.
- 4 metric cards: Total Vendas, Faturamento Bruto, Descontos, Faturamento Líquido.
- Payment summary table (prefers dashboard data to split DEBITO/CREDITO; falls back to caixa totals).
- Top 5 products list (from dashboard query, shared cache with DashboardPage).
- Conferência section: read-only "sistema" field vs editable "contagem" field with live difference indicator.
- **Confirm dialog** with full summary and amber warning if cash difference ≠ 0.
- Closing disabled if caixa is already closed (`!!caixaAberto.id`) or totalVendas == 0.
- Historico table with diferença badge (green "Ok" / red value).
- `fmtDate` adds `T12:00:00` to ISO date strings before parsing to avoid timezone-driven day shifts.

### Usuários — Users (`/usuarios`) — DONO only
- User table with avatar (initials, colour by perfil), perfil badge, adega name, status badge.
- **UsuarioDialog**: dual Zod schemas — `createSchema` (senha required, min 6) vs `editSchema` (senha optional).
- `useWatch` on `perfil` + `useEffect` clears `adegaId` automatically when switching to DONO.
- `adegaId` on edit is resolved by matching `adegaNome` against the loaded adegas list.
- Toggle status (Ativar / Desativar) via `PATCH /api/usuarios/{id}/status`.
- Search filters by nome and email.
- "Ambas" shown (italic, gray) when `adegaNome` is null (DONO users).

### Layout (`src/components/Layout.tsx`)
- Fixed sidebar (w-64, bg-gray-900) on desktop; hidden on mobile.
- Fixed topbar (h-16, bg-white, `left-64` offset on desktop).
- Mobile bottom navigation bar.
- Adega selector pills (top of sidebar) only visible to DONO. Clicking a pill sets `localStorage['selected_adega']` and dispatches `adegaChanged`.
- Adega list fetched from `GET /api/adegas` with `retry: false` (silently empty if unreachable).

---

## 4. Known Limitations

- **No tests**: zero unit, integration, or E2E tests exist anywhere in the project.
- **No pagination**: all list endpoints return full datasets. Will become a problem at scale.
- **No venda detail/cancel UI**: `GET /api/vendas/{id}` and `PATCH /api/vendas/{id}/cancelar` exist on the backend but have no frontend screen.
- **No adega management UI**: adegas can only be created via `DataSeeder` or direct SQL. There is no create/edit/delete screen.
- **No category management UI**: `GET/POST /api/categorias` exist but there is no dedicated frontend page — categories are only visible as a filter.
- **No PDF/CSV export**: fechamento summaries cannot be exported.
- **No iFood integration**: `CanalVenda.IFOOD` exists as an enum but no real integration logic is implemented.
- **No real-time updates**: page data refreshes only on navigation or explicit query invalidation. No WebSocket or SSE.
- **Bundle size**: single 886 KB JS chunk. No dynamic imports or code splitting configured.
- **No Docker Compose**: developers must install and configure PostgreSQL manually.
- **No CI/CD**: no pipeline configuration.
- **No password reset**: users cannot change their own password after account creation.
- **DONO adegaId in JWT is null**: DONO users must always have an adega selected in localStorage; operations will fail silently with an empty adegaId if none is selected.

---

## 5. Pending Features for Next Phase

These are features that would logically follow but have not been started:

- **Relatórios**: monthly/period reports with export to PDF or Excel.
- **Gestão de Adegas**: CRUD screen to create and manage adegas (currently only via seeder/SQL).
- **Gestão de Categorias**: full CRUD screen for product categories.
- **Histórico de Vendas**: dedicated page to list, filter, and view/cancel past sales.
- **Ajuste de Estoque**: manual stock adjustment form (backend `AjusteEstoqueRequest` already exists).
- **Notificações de Estoque Crítico**: push or in-app alert when a variation hits zero.
- **Paginação**: server-side pagination on all list endpoints.
- **Suporte a Múltiplos Caixas por Dia**: currently one fechamento per adega per day.
- **Autenticação 2FA / Refresh Token**: current token is a single 8-hour bearer token.
- **Testes**: unit tests for services (JUnit/Mockito), integration tests (Testcontainers), E2E tests (Playwright or Cypress).
- **Docker Compose**: containerised dev environment (postgres + backend + frontend).

---

## 6. How to Run

### Prerequisites
- Java 21+
- Maven 3.9+ (or use `./mvnw`)
- Node.js 20+ and npm
- PostgreSQL running locally with a database named `adega`

### Backend

```bash
# Create the database (once)
psql -U postgres -c "CREATE DATABASE adega;"

# Run the application
cd adega-backend
mvn spring-boot:run
```

The backend starts on `http://localhost:8080`.

Flyway runs all migrations automatically on startup.
`DataSeeder` seeds initial data on first boot (skips if any users exist).

**Environment variables** (all have defaults):

| Variable | Default | Description |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/adega` | JDBC connection string |
| `DB_USERNAME` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `JWT_SECRET` | `minha-chave-secreta-super-longa-minimo-32-caracteres` | HMAC-SHA key (min 32 chars) |

**Swagger UI**: `http://localhost:8080/swagger-ui.html`

### Frontend

```bash
cd adega-frontend
npm install
npm run dev
```

App available at `http://localhost:5173`. All `/api/*` requests are proxied to `http://localhost:8080` by Vite.

### Seeded Credentials (password: `123456`)

| Email | Perfil | Adega |
|---|---|---|
| roberto@adega.com | DONO | — (all) |
| marcos@adega.com | DONO | — (all) |
| carlos@adega.com | FUNCIONARIO | Adega Central |
| ana@adega.com | FUNCIONARIO | Adega Central |
| pedro@adega.com | FUNCIONARIO | Adega Norte |

---

## 7. Key Files and Folder Structure

```
Projeto_Adega/
├── adega-backend/
│   ├── pom.xml
│   └── src/main/java/com/adega/
│       ├── AdegaApplication.java           # Spring Boot entry point
│       ├── config/
│       │   ├── DataSeeder.java             # Seeds adegas, users, products on boot
│       │   ├── SecurityConfig.java         # CORS, JWT filter chain, BCrypt bean
│       │   └── OpenApiConfig.java
│       ├── controller/
│       │   ├── AdegaController.java        # GET /api/adegas
│       │   ├── AuthController.java         # POST /api/auth/login
│       │   ├── CategoriaController.java    # GET/POST /api/categorias
│       │   ├── DashboardController.java    # GET /api/dashboard
│       │   ├── EstoqueController.java      # GET /api/estoque, POST entrada, GET historico
│       │   ├── FechamentoCaixaController.java # GET aberto, POST fechar, GET historico
│       │   ├── ProdutoController.java      # Full CRUD + variacoes
│       │   ├── UsuarioController.java      # Full CRUD (DONO only)
│       │   └── VendaController.java        # POST venda, GET list/detail, PATCH cancelar
│       ├── dto/
│       │   ├── request/                    # LoginRequest, VendaRequest, etc.
│       │   └── response/                   # LoginResponse, ProdutoResponse, DashboardResponse, etc.
│       ├── exception/
│       │   ├── BusinessException.java
│       │   ├── ResourceNotFoundException.java
│       │   └── GlobalExceptionHandler.java
│       ├── mapper/                         # MapStruct mappers (Produto, Estoque, Venda, Usuario)
│       ├── model/
│       │   ├── enums/                      # PerfilUsuario, StatusVenda, CanalVenda, FormaPagamento, TipoMovimento
│       │   ├── Adega.java
│       │   ├── Usuario.java                # Implements UserDetails
│       │   ├── Produto.java / VariacaoProduto.java
│       │   ├── Venda.java / ItemVenda.java / Pagamento.java
│       │   ├── MovimentoEstoque.java
│       │   ├── FechamentoCaixa.java
│       │   └── Categoria.java
│       ├── repository/                     # JpaRepository per entity; VariacaoProdutoRepository has pessimistic lock query
│       ├── security/
│       │   ├── JwtService.java             # JJWT 0.12.x sign/parse
│       │   ├── JwtAuthFilter.java          # Sets adegaId/usuarioId request attributes
│       │   └── UserDetailsServiceImpl.java
│       └── service/                        # One service per domain: Auth, Produto, Estoque, Venda, FechamentoCaixa, Dashboard, Usuario, Categoria
│
└── adega-frontend/
    ├── package.json
    ├── vite.config.ts                      # @tailwindcss/vite plugin, /api proxy
    ├── index.html
    └── src/
        ├── main.tsx                        # QueryClientProvider + BrowserRouter + Toaster
        ├── App.tsx                         # Route definitions
        ├── index.css                       # @import "tailwindcss"  (Tailwind v4)
        ├── types/index.ts                  # All TypeScript interfaces (AuthUser, Produto, Venda, etc.)
        ├── services/api.ts                 # Axios instance + all API functions grouped by domain
        ├── hooks/useAuth.ts                # login(), logout(), getUser(), isAuthenticated(), isDono()
        ├── components/
        │   ├── Layout.tsx                  # Sidebar, topbar, adega selector, mobile nav
        │   ├── ProtectedRoute.tsx          # Redirects to /login if not authenticated
        │   └── RoleGuard.tsx               # Renders children only if user has requiredRole
        └── pages/
            ├── Login.tsx
            ├── pdv/PDVPage.tsx
            ├── dashboard/DashboardPage.tsx
            ├── estoque/EstoquePage.tsx
            ├── produtos/ProdutosPage.tsx
            ├── caixa/CaixaPage.tsx
            └── usuarios/UsuariosPage.tsx
```

### Database Tables

| Table | Description |
|---|---|
| `adegas` | Shops (nome, endereco, cnpj) |
| `categorias` | Product categories |
| `usuarios` | System users with role and optional adega FK |
| `produtos` | Products with category FK |
| `variacoes_produto` | Variations (preço, custo, estoque atual/mínimo, situacao) |
| `vendas` | Sales header (canal, status, totals, adega, usuario) |
| `itens_venda` | Line items per sale |
| `pagamentos` | Payment records per sale |
| `movimentos_estoque` | Stock movement ledger (COMPRA, VENDA, AJUSTE, PERDA) |
| `fechamentos_caixa` | Daily cash closing records per adega |

Migrations live in `adega-backend/src/main/resources/db/migration/V1__create_tables.sql`.
## Complemento — Decisões de projeto tomadas antes do desenvolvimento

### Descoberta e levantamento
- Sistema interno operado por funcionários e donos — sem interface para clientes
- Duas adegas físicas, mesmos donos, catálogo de produtos compartilhado
- Vendas presenciais (PDV) e iFood (delivery gerenciado pelo próprio iFood, sem integração)
- Pagamentos: dinheiro, Pix, cartão débito/crédito, vale alimentação/refeição
- Desconto por volume (ex: 1 cerveja R$10, caixa R$85 — preço não proporcional)
- Funcionários podem aplicar desconto mas deve ficar registrado para auditoria dos donos
- Sem cadastro de clientes no MVP
- Fechamento de caixa diário
- NF-e obrigatório (deixado para Fase 2)
- Internet estável mas offline parcial desejado (deixado para Fase 2)
- Máx. 4 usuários simultâneos atualmente

### Decisões de modelagem (ERD)
- PRODUTO separado de VARIACAO_PRODUTO: produto existe uma vez, variações têm preço/estoque próprios
- adega_id em USUARIO, VENDA e FECHAMENTO_CAIXA — produtos/categorias são compartilhados
- DONO tem adega_id = null (acessa ambas); FUNCIONARIO tem adega_id obrigatório
- desconto_valor por ItemVenda + totalDesconto na Venda = rastreabilidade completa
- PAGAMENTO como tabela separada = suporte a pagamento misto (Pix + dinheiro, etc.)
- MOVIMENTO_ESTOQUE como ledger = toda entrada/saída rastreável com responsável

### Decisões arquiteturais
- Layered Classic (Controller → Service → Repository) — rejeitado Domain Services e Event-driven
- Fechamento idempotente por data: BusinessException se já existe FechamentoCaixa para adega+data
- Situação do estoque: CRITICO = estoqueAtual==0, BAIXO = 0 < estoqueAtual <= estoqueMinimo, OK = acima
- Pessimistic lock em VariacaoProduto durante criação de venda (evita estoque negativo em vendas simultâneas)
- VendaService valida TUDO antes de tocar qualquer dado (two-phase: validate then write)

### Problemas resolvidos durante o desenvolvimento
- pom.xml: flyway-database-postgresql precisou de versão explícita (10.12.0)
- Java 26 incompatível com maven-compiler-plugin: adicionado maven.compiler.source/target=21 no pom.xml
- AdegaApplication.java estava fora de src/main/java/com/adega/ — movido para local correto
- Claude Code token limit: prompt dividido em 4 partes (entidades, repositórios/DTOs, segurança/config, controllers/seed)
- CLAUDE_CODE_MAX_OUTPUT_TOKENS deve ser configurado ANTES de abrir o Claude Code no PowerShell

### Credenciais de desenvolvimento
- Todos os usuários: senha 123456
- PostgreSQL: usuário postgres, banco adega
- JWT secret padrão (development only): minha-chave-secreta-super-longa-minimo-32-caracteres
- Backend: http://localhost:8080
- Frontend: http://localhost:5173
- Swagger: http://localhost:8080/swagger-ui.html

### Fase 2 — Prioridades sugeridas
1. NF-e via serviço terceiro (NFe.io ou Enotas) — obrigatório para pessoa jurídica
2. Relatório CMV (dados já coletados desde o início via custoAquisicao)
3. Histórico de vendas com filtros e cancelamento via UI
4. Gestão de categorias e adegas via UI
5. Offline parcial no PDV (PGlite + fila de sincronização)
6. Paginação nos endpoints de lista
7. Docker Compose para ambiente de desenvolvimento
8. Testes (JUnit/Mockito no backend, Playwright no frontend)

## Fase 2 — Features Implementadas

### Histórico de Vendas (`/vendas`)
- **Backend**: `VendaRepository.findWithFilters()` — JPQL query com parâmetros anuláveis (`adegaId`, `status`, `canal`, `usuarioId`) e intervalo de datas (`dataInicio`/`dataFim`), ordenada por `dataHora DESC`.
- **Backend**: `VendaController.findAll()` atualizado para aceitar `dataInicio`, `dataFim`, `status` e `canal` como query params; datas com default = hoje (`atStartOfDay()` / `atTime(23,59,59)`), enums (`StatusVenda`/`CanalVenda`) bindados automaticamente. FUNCIONARIO tem o `adegaId` forçado pelo JWT (param ignorado); DONO pode filtrar por `adegaId`.
- **Frontend**: `VendasPage` (`src/pages/vendas/VendasPage.tsx`) com filter bar (intervalo de datas, status, canal + botão Buscar), summary pills (total de vendas, faturamento das CONCLUIDA, canceladas), tabela de vendas, detail dialog e cancel dialog. Escuta o evento `adegaChanged` (mesmo padrão de Dashboard/Estoque).
- **Rota**: `/vendas` — todos os perfis (apenas `ProtectedRoute`, sem `RoleGuard`).
- **Sidebar**: item "Vendas" com ícone `Receipt`, posicionado após o PDV.
- **Cancelamento**: apenas DONO; estorna o estoque via `VendaService.cancel()` (registra `MovimentoEstoque` tipo AJUSTE e devolve a quantidade ao `estoqueAtual`).

### Relatório CMV (`/cmv`)
- **Backend**: `CmvController` — `GET /api/cmv` (apenas DONO, `@PreAuthorize` no nível da classe) com params `adegaId`, `dataInicio`, `dataFim`; defaults = primeiro dia do mês atual até hoje.
- **Backend**: `CmvService` agrupa `ItemVenda` por `variacaoId` e calcula o custo unitário como **média ponderada** do `custoUnitario` capturado no momento da venda (`sum(custoUnitario × quantidade) / sum(quantidade)`); faz fallback para o `custoAquisicao` atual da variação em vendas legadas sem custo capturado. Retorna itens ordenados por `custoTotal DESC` mais totais gerais.
- **Backend**: migration `V2__add_custo_unitario_to_item_venda.sql` adicionou a coluna `custo_unitario` (NUMERIC(10,2), nullable) em `itens_venda`. `VendaService.create()` passou a fazer snapshot do custo no momento da venda (`custoUnitario = variacao.getCustoAquisicao()`), garantindo CMV historicamente preciso. `ItemVenda`, `ItemVendaResponse` e `VendaService.toResponse()` expõem o novo campo.
- **Frontend**: `CmvPage` (`src/pages/cmv/CmvPage.tsx`) com presets de período (hoje / esta semana / mês atual / mês anterior / personalizado), filtro de categoria, 5 cards de resumo, tabela detalhada com indicadores coloridos de CMV% e margem%, e seção de insights ("Destaques do período"). Escuta o evento `adegaChanged`.
- **Indicadores de cor**: CMV% verde (<40) / âmbar (40–60) / vermelho (>60); Margem% verde (>40) / âmbar (20–40) / vermelho (<20).
- **Rota**: `/cmv` — apenas DONO (`ProtectedRoute` + `RoleGuard requiredRole="DONO"`).
- **Sidebar**: item "CMV" com ícone `TrendingDown`, posicionado após o Dashboard.

### Configurações — Gestão de Categorias e Adegas (`/configuracoes`)
- **Backend**: `CategoriaController` atualizado com `PUT /{id}` e `DELETE /{id}` (ambos apenas DONO). O delete é bloqueado quando `totalProdutos > 0`, lançando `BusinessException("Categoria possui produtos vinculados e não pode ser removida")`; valida nome duplicado na criação/edição (excluindo a própria categoria no update).
- **Backend**: `CategoriaResponse` agora inclui a contagem `totalProdutos` (via `ProdutoRepository.countByCategoriaId`); `GET /api/categorias` passou a retornar `List<CategoriaResponse>`.
- **Backend**: `AdegaController` atualizado com `POST /` (201) e `PUT /{id}` (ambos apenas DONO).
- **Backend**: `AdegaService` criado com `findAll()` (inclui `totalUsuarios` via `UsuarioRepository.countByAdegaId`), `create()` e `update()`; `AdegaResponse` passou a expor `endereco`, `cnpj` e `totalUsuarios`.
- **Backend**: migration `V3__fix_adega_nullable_fields.sql` tornou `endereco` e `cnpj` anuláveis na tabela `adegas` e removeu a constraint `uq_adega_cnpj` (valores em branco/nulos conflitariam com a unicidade). A entidade `Adega` deixou de declarar `nullable=false`/`unique=true` nesses campos.
- **Frontend**: `ConfiguracoesPage` (`src/pages/configuracoes/ConfiguracoesPage.tsx`) com duas abas — **Categorias** (criar/editar/excluir com badge de contagem de produtos; botão Excluir desabilitado com tooltip quando há produtos vinculados; diálogo de confirmação de exclusão) e **Adegas** (criar/editar; sem exclusão). Toasts de erro exibem a `message` do backend. Formulários com react-hook-form + Zod.
- **Rota**: `/configuracoes` — apenas DONO (`ProtectedRoute` + `RoleGuard requiredRole="DONO"`).
- **Sidebar**: item "Configurações" com ícone `Settings`, posicionado após Usuários.

### Ajuste Manual de Estoque
- **Frontend**: `AjusteDialog` adicionado à `EstoquePage` (`src/pages/estoque/EstoquePage.tsx`) com preview de diferença ao vivo (verde `+ X unidades (entrada)` / vermelho `- X unidades (saída)` / cinza `Sem alteração`), box de aviso âmbar quando há redução de estoque ("Atenção: reduzir o estoque criará um movimento de saída no histórico.") e campo de observação (motivo do ajuste). Box de info read-only mostra o estoque atual e a situação. Formulário com react-hook-form + Zod; `novaQuantidade` pré-preenchida com o `estoqueAtual` da linha.
- **Botão "Ajuste"**: visível apenas para DONO (`isDono()`) em cada linha da tabela de estoque, com ícone `SlidersHorizontal`, posicionado após "Entrada" e "Histórico".
- **Backend**: chama `POST /api/estoque/ajuste` (já existente, apenas DONO) enviando `novaQuantidade` (valor absoluto contado, não delta) e `observacao` opcional. `EstoqueService.ajusteManual()` sobrescreve `estoqueAtual` com `novaQuantidade` e registra um `MovimentoEstoque` tipo `AJUSTE` cujo campo `quantidade` é o **valor absoluto novo** (não a diferença) — no histórico aparece como `± {novaQuantidade}`. A prévia de entrada/saída (delta) e o aviso de redução existem apenas na UI; o backend não calcula a diferença. Em caso de sucesso: toast "Estoque ajustado com sucesso" e invalidação da query `['estoque']`.

### Exportação de Relatórios (PDF e CSV)
- **Util**: `src/utils/exportUtils.ts` com 6 funções de exportação — `exportVendasCSV`/`exportVendasPDF`, `exportCmvCSV`/`exportCmvPDF`, `exportFechamentoCSV`/`exportFechamentoPDF` — além de helpers (`fmtCurrency`, `fmtDate`, `fmtDateTime`, `fmtPct`, `downloadBlob`, `toCSV`, `createPDF`).
- **PDF**: `jsPDF` (4.x) + `jspdf-autotable` (5.x), A4 paisagem, com título/subtítulo/timestamp ("Gerado em …") e tabela com cabeçalho azul (`blue-600`) e linha de totais em negrito no rodapé.
- **CSV**: delimitado por ponto e vírgula (`;`) com prefixo BOM UTF-8 (`﻿`) e quebras `\r\n`, para compatibilidade com o Excel brasileiro (acentos e colunas corretas).
- **Botões**: par CSV (verde, ícone `FileSpreadsheet`) + PDF (vermelho, ícone `FileText`) adicionados em `VendasPage` (header), `CmvPage` (header) e `CaixaPage` (seção "Histórico de Fechamentos"). Desabilitados quando não há dados.
- **CMV**: exporta os dados completos do período (`CmvData`), ignorando o filtro de categoria da UI, para manter as linhas consistentes com os totais gerais do rodapé (que são agregados do período).
- **Dependências**: `jspdf` e `jspdf-autotable` adicionadas; `@types/jspdf` foi instalado e depois removido (o jsPDF 4.x já traz os próprios tipos; o stub `@types/jspdf` mira a v1 e é redundante/conflitante).

### Docker Compose
- **`Projeto_Adega/docker-compose.yml`**: 3 serviços — `postgres` (16-alpine), `backend` (Spring Boot), `frontend` (Nginx).
- **`adega-backend/Dockerfile`**: multi-stage build (`maven:3.9.6-eclipse-temurin-21-alpine` → `eclipse-temurin:21-jre-alpine`).
- **`adega-frontend/Dockerfile`**: multi-stage build (`node:20-alpine` → `nginx:alpine`).
- **`adega-frontend/nginx.conf`**: serve React SPA + proxy `/api/*` para o container do backend.
- **`.env.example`**: variáveis `DB_PASSWORD` e `JWT_SECRET`.
- **`.gitignore`**: ignora `.env`, `target/`, `node_modules/`.
- **`README.md`**: comandos para subir, parar e resetar o sistema.
- Para subir tudo: `docker-compose up --build` (a partir da pasta `Projeto_Adega`).
- Sistema disponível em `http://localhost` após a inicialização.
- Swagger disponível em `http://localhost/swagger-ui/index.html`.

### Notificações de Estoque Crítico (sino na topbar)
- **Hook**: `src/hooks/useEstoqueAlertas.ts` — `useQuery` com key `['estoque-alertas']`, chama `GET /api/estoque` sem filtro de adega (retorna todas), filtra `situacao === 'CRITICO'` e `situacao === 'BAIXO'`, `refetchInterval` de 5 minutos, `enabled: isDono()`.
- **Componente**: `src/components/EstoqueAlertaBell.tsx` — botão de sino (`Bell`, 20 px) com badge absoluto vermelho (se há CRITICO) ou âmbar (só BAIXO); dropdown `w-72` com seção "Estoque zerado" (vermelho) e "Abaixo do mínimo" (âmbar), cada item exibe `produtoNome · variacaoDescricao` e subtítulo com `adegaNome` e quantidade; estado vazio "Estoque sob controle ✓" em verde; fecha ao clicar fora ou pressionar Escape; rodapé navega para `/estoque`.
- **Layout**: `src/components/Layout.tsx` — `<EstoqueAlertaBell />` inserido na topbar entre o seletor de adegas e o nome do usuário, renderizado apenas para DONO.
- **Tipo**: `adegaNome?: string` adicionado a `EstoqueItem` em `src/types/index.ts` para exibir a adega de origem nos alertas.

## Roadmap — Próximos passos

### Fase 3 — Deploy em produção
- Escolher servidor em nuvem: Railway ou Render (recomendado para começar, ~$20/mês)
- Configurar variáveis de ambiente seguras no servidor (DB_PASSWORD, JWT_SECRET)
- Configurar domínio personalizado (ex: sistema.minhaadega.com.br)
- Configurar HTTPS automático (Let's Encrypt via Nginx ou provedor de nuvem)
- Backup automático do banco de dados PostgreSQL

### Fase 3 — Modelo SaaS (futuro)
- Definir se cada cliente terá instância isolada ou sistema multi-tenant compartilhado
- Sistema de licenças para controle de acesso por cliente
- Período de trial configurável por cliente
- Painel administrativo para gerenciar clientes (ativar/desativar)

### Pendente — definir hardware
- Impressão térmica (ESC/POS): aguardando definição do modelo de impressora do cliente
- Paginação nos endpoints: implementar quando volume de dados crescer em produção

## Ambiente de desenvolvimento (Windows)

- Java 21: C:\Users\breno\.jdks\ms-21.0.11
- Maven: C:\apache-maven-3.9.16\bin\mvn.cmd
- PowerShell compile command:
  $env:JAVA_HOME = "C:\Users\breno\.jdks\ms-21.0.11"; $env:Path = "$env:JAVA_HOME\bin;" + $env:Path; & "C:\apache-maven-3.9.16\bin\mvn.cmd" -DskipTests compile

> Use o JDK 21 para builds. O `JAVA_HOME` padrão aponta para o JDK 26, que quebra o Lombok (erro `com.sun.tools.javac.code.TypeTag :: UNKNOWN`). Maven não está no PATH — use o caminho completo acima.
