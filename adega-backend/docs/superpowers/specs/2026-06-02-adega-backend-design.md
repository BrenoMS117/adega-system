# Adega Backend — Design Spec

**Date:** 2026-06-02  
**Status:** Approved  
**Stack:** Spring Boot 3.2.5, Java 21, PostgreSQL, Flyway, JWT (jjwt 0.12.5), MapStruct, Lombok, Springdoc OpenAPI

---

## 1. Objetivo

API REST stateless para sistema de controle de vendas de adega. Suporta múltiplas adegas (multi-tenant leve), dois perfis de usuário (DONO e FUNCIONARIO), controle de estoque, fechamento de caixa e dashboard gerencial.

---

## 2. Arquitetura

### Padrão: Layered Clássico (Opção A aprovada)

```
HTTP Request
    │
    ▼
JwtAuthFilter (verifica JWT, popula SecurityContext)
    │
    ▼
Controller (@RestController)
    │  — valida DTOs com @Valid
    │  — extrai usuário autenticado via SecurityContext
    ▼
Service (@Service, @Transactional)
    │  — regras de negócio
    │  — orquestra repositories quando necessário
    ▼
Repository (JpaRepository)
    │
    ▼
PostgreSQL (schema criado e gerenciado via Flyway)
```

- Controllers recebem `*Request` DTOs e retornam `*Response` DTOs
- MapStruct faz conversão Model ↔ DTO — sem lógica nos mappers
- `GlobalExceptionHandler` (@ControllerAdvice) centraliza tratamento de erros
- Todas as operações de escrita rodam em `@Transactional` no service

---

## 3. Modelo de Dados

### Entidades e campos

| Entidade | PK | Campos principais |
|---|---|---|
| `Adega` | UUID | nome, endereco, cnpj |
| `Usuario` | UUID | adega (nullable), nome, email, senhaHash, perfil, ativo |
| `Categoria` | UUID | nome (unique) |
| `Produto` | UUID | categoria, nome, descricao, ativo |
| `VariacaoProduto` | UUID | produto, descricao, precoVenda, custoAquisicao, estoqueAtual, estoqueMinimo |
| `Venda` | UUID | adega, usuario, dataHora, status, canal, totalBruto, totalDesconto, totalLiquido, nfeChave |
| `ItemVenda` | UUID | venda, variacao, quantidade, precoUnitario, descontoValor, subtotal |
| `Pagamento` | UUID | venda, forma, valor |
| `MovimentoEstoque` | UUID | variacao, usuario, venda (nullable), tipo, quantidade, dataHora, observacao |
| `FechamentoCaixa` | UUID | adega, usuario, data, totais por forma, diferenca, observacao |

### Decisões de mapeamento JPA

- PKs: `UUID` gerado pelo banco (`gen_random_uuid()`) — nunca pela aplicação
- Enums: `@Enumerated(EnumType.STRING)` em todos — imune a reordenação
- Fetch: `FetchType.LAZY` em todas as coleções — sem EAGER para evitar N+1
- Cascade: `Venda` faz cascade apenas para `itens` e `pagamentos`; `MovimentoEstoque` é criado pelo service explicitamente
- Lock pessimista em `VariacaoProduto` durante venda para evitar race condition em estoque

### Enums

| Enum | Valores |
|---|---|
| `PerfilUsuario` | DONO, FUNCIONARIO |
| `StatusVenda` | ABERTA, CONCLUIDA, CANCELADA |
| `CanalVenda` | PRESENCIAL, IFOOD |
| `FormaPagamento` | DINHEIRO, PIX, DEBITO, CREDITO, VALE |
| `TipoMovimento` | COMPRA, VENDA, AJUSTE, PERDA |

---

## 4. Segurança

### JWT

- Claims: `sub=email`, `role=DONO|FUNCIONARIO`, `adegaId=<uuid>|null`, `usuarioId=<uuid>`
- Expiração: 8 horas (28.800.000ms)
- Token inválido ou expirado → 401
- `JwtAuthFilter` popula `SecurityContext` com `UsernamePasswordAuthenticationToken`

### Autorização por perfil

- `@EnableMethodSecurity` habilitado no `SecurityConfig`
- Endpoints restritos protegidos com `@PreAuthorize("hasRole('DONO')")`
- DONO: `adega = null` → acessa todas as adegas; filtros por `adegaId` são opcionais
- FUNCIONARIO: `adega = <id>` → scoped à sua adega; `adegaId` ausente usa o do token

### CORS

- Origem: `http://localhost:5173`
- Métodos: `GET, POST, PUT, PATCH, DELETE`
- Headers: `Authorization, Content-Type`

### Rotas públicas

- `POST /api/auth/login` — única rota sem autenticação

### Matriz de acesso

| Endpoint | DONO | FUNCIONARIO |
|---|---|---|
| `POST /api/auth/login` | ✅ | ✅ |
| `GET /api/produtos` | ✅ | ✅ |
| `POST/PUT/PATCH /api/produtos/**` | ✅ | ❌ 403 |
| `GET /api/produtos/{id}/variacoes` | ✅ | ✅ |
| `POST /api/produtos/{id}/variacoes` | ✅ | ❌ 403 |
| `PUT /api/variacoes/{id}` | ✅ | ❌ 403 |
| `POST /api/vendas` | ✅ | ✅ |
| `GET /api/vendas` | ✅ | ✅ |
| `GET /api/vendas/{id}` | ✅ | ✅ |
| `PATCH /api/vendas/{id}/cancelar` | ✅ | ❌ 403 |
| `GET /api/estoque` | ✅ | ✅ |
| `POST /api/estoque/entrada` | ✅ | ✅ |
| `POST /api/estoque/ajuste` | ✅ | ❌ 403 |
| `GET /api/estoque/{id}/historico` | ✅ | ✅ |
| `POST /api/caixa/fechar` | ✅ | ✅ |
| `GET /api/caixa/historico` | ✅ | ✅ |
| `GET /api/caixa/aberto` | ✅ | ✅ |
| `GET /api/dashboard` | ✅ | ❌ 403 |
| `GET/POST/PUT/PATCH /api/usuarios/**` | ✅ | ❌ 403 |

---

## 5. Regras de Negócio

### VendaService.criarVenda()

1. Para cada `ItemVendaRequest`: buscar `VariacaoProduto` com lock pessimista
2. Validar `estoqueAtual >= quantidade` — falha → `BusinessException`
3. Calcular `subtotal = (precoVenda * quantidade) - descontoValor`
4. Calcular `totalBruto`, `totalDesconto`, `totalLiquido`
5. Validar `sum(pagamentos.valor) == totalLiquido` — falha → `BusinessException`
6. Persistir `Venda` com status `CONCLUIDA`
7. Para cada item: `estoqueAtual -= quantidade`, criar `MovimentoEstoque` tipo `VENDA`
8. Qualquer falha → rollback total (`@Transactional`)

### EstoqueService.registrarEntrada()

1. Buscar `VariacaoProduto` — não encontrada → `ResourceNotFoundException`
2. `estoqueAtual += quantidade`
3. Se `custoAquisicao` informado → atualizar campo
4. Criar `MovimentoEstoque` tipo `COMPRA`

### EstoqueService.ajustarEstoque()

1. Buscar `VariacaoProduto`
2. Definir `estoqueAtual = novaQuantidade` (ajuste absoluto)
3. Criar `MovimentoEstoque` tipo `AJUSTE`

### FechamentoCaixaService.fechar()

1. Verificar existência de `FechamentoCaixa` para `adegaId + data` → se existir: `BusinessException("Caixa já fechado para esta data")`
2. Buscar todas as vendas `CONCLUIDA` do dia para a adega
3. Agregar por forma de pagamento (`totalDinheiro`, `totalPix`, `totalCartao` = DEBITO+CREDITO, `totalBeneficio` = VALE)
4. Calcular `diferenca = dinheiroContado - dinheiroSistema`
5. Persistir `FechamentoCaixa`

### Situação do Estoque (calculada, não persistida)

```
estoqueAtual == 0                        → CRITICO
0 < estoqueAtual <= estoqueMinimo        → BAIXO
estoqueAtual > estoqueMinimo             → OK
estoqueMinimo == 0 && estoqueAtual > 0   → OK (sem mínimo definido)
```

---

## 6. Contrato da API

### Formato de erro padrão (todos os erros)

```json
{
  "timestamp": "2026-06-02T19:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Estoque insuficiente para Heineken Unidade",
  "path": "/api/vendas"
}
```

### Endpoints

#### Auth
| Método | Path | Corpo | Resposta |
|---|---|---|---|
| POST | `/api/auth/login` | `LoginRequest` | `LoginResponse` (jwt, perfil, adegaId, usuarioId) |

#### Produtos
| Método | Path | Acesso | Notas |
|---|---|---|---|
| GET | `/api/produtos` | Todos | Query: `?categoriaId=&ativo=` |
| POST | `/api/produtos` | DONO | Cria produto com variações |
| PUT | `/api/produtos/{id}` | DONO | Edita produto |
| PATCH | `/api/produtos/{id}/status` | DONO | Ativa/desativa |
| GET | `/api/produtos/{id}/variacoes` | Todos | Lista variações |
| POST | `/api/produtos/{id}/variacoes` | DONO | Adiciona variação |
| PUT | `/api/variacoes/{id}` | DONO | Edita variação |

#### Vendas
| Método | Path | Acesso | Notas |
|---|---|---|---|
| POST | `/api/vendas` | Todos | Fluxo transacional completo |
| GET | `/api/vendas` | Todos | Query: `?adegaId=&data=&usuarioId=` |
| GET | `/api/vendas/{id}` | Todos | Detalhe com itens e pagamentos |
| PATCH | `/api/vendas/{id}/cancelar` | DONO | Muda status para CANCELADA |

#### Estoque
| Método | Path | Acesso | Notas |
|---|---|---|---|
| GET | `/api/estoque` | Todos | Query: `?adegaId=`. Inclui situação |
| POST | `/api/estoque/entrada` | Todos | Tipo COMPRA |
| POST | `/api/estoque/ajuste` | DONO | Tipo AJUSTE, quantidade absoluta |
| GET | `/api/estoque/{variacaoId}/historico` | Todos | Lista `MovimentoEstoque` |

#### Fechamento de Caixa
| Método | Path | Acesso | Notas |
|---|---|---|---|
| POST | `/api/caixa/fechar` | Todos | Idempotente por adega+data |
| GET | `/api/caixa/historico` | Todos | Query: `?adegaId=&dataInicio=&dataFim=` |
| GET | `/api/caixa/aberto` | Todos | Retorna fechamento do dia ou 404 |

#### Dashboard
| Método | Path | Acesso | Notas |
|---|---|---|---|
| GET | `/api/dashboard` | DONO | Query: `?adegaId=&data=`. Inclui top 5 produtos, vendas por hora, estoque crítico/baixo |

#### Usuários
| Método | Path | Acesso | Notas |
|---|---|---|---|
| GET | `/api/usuarios` | DONO | Query: `?adegaId=` |
| POST | `/api/usuarios` | DONO | Cria FUNCIONARIO |
| PUT | `/api/usuarios/{id}` | DONO | Edita |
| PATCH | `/api/usuarios/{id}/status` | DONO | Ativa/desativa |

---

## 7. Banco de Dados (Flyway)

- Migration: `V1__create_tables.sql`
- PKs: `uuid DEFAULT gen_random_uuid()`
- Datas: `TIMESTAMPTZ`
- Valores monetários: `NUMERIC(10,2)`
- FK com nomes explícitos (`fk_<tabela>_<campo>`)
- Índices em: `adega_id`, `usuario_id`, `venda_id`, `data_hora`, `variacao_id`

---

## 8. Configuração

```properties
server.port=8080
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/adega}
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD:postgres}
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
jwt.secret=${JWT_SECRET:chave-secreta-minimo-32-caracteres-aqui}
jwt.expiration=28800000
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.api-docs.path=/api-docs
```
