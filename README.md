# Adega System

**Sistema completo de gestão de vendas para adegas — PDV, estoque, relatórios e muito mais.**

![Java](https://img.shields.io/badge/Java-21-007396?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.5-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)

---

## Sobre o sistema

O **Adega System** é um sistema completo de gestão de vendas desenvolvido para adegas e distribuidoras de bebidas. O backend é construído em Java com Spring Boot, oferecendo uma API REST robusta com autenticação JWT, controle de acesso por perfil e migrações de banco de dados gerenciadas pelo Flyway. O frontend é uma SPA em React com TypeScript, com interface responsiva para uso tanto em desktop quanto em dispositivos móveis.

O sistema foi projetado para atender negócios com uma ou múltiplas unidades físicas, com suporte a dois perfis de acesso: **Dono**, que tem visão consolidada de todas as adegas e acesso a relatórios e configurações, e **Funcionário**, que opera o PDV e o estoque da sua unidade.

---

## Funcionalidades

### 🛒 PDV (Ponto de Venda)
- Venda presencial com seleção de produtos por categoria
- Suporte a variações de produto (unidade, caixa, fardo)
- Desconto por item com rastreamento por funcionário
- Pagamento misto (Dinheiro, Pix, Débito, Crédito, Vale Alimentação/Refeição)

### 📦 Estoque
- Controle de estoque por variação de produto
- Alertas de estoque crítico e abaixo do mínimo
- Registro de entradas com custo de aquisição
- Ajuste manual com histórico completo de movimentações

### 📊 Relatórios e Dashboard
- Dashboard diário com faturamento, ticket médio e descontos
- Relatório CMV (Custo de Mercadoria Vendida) com margem por produto
- Histórico de vendas com filtros por período, status e canal
- Exportação em PDF e CSV para todos os relatórios

### 💰 Fechamento de Caixa
- Fechamento diário com conferência do caixa físico
- Resumo por forma de pagamento
- Histórico de fechamentos com detecção de diferenças

### ⚙️ Administração
- Controle de acesso por perfil (Dono e Funcionário)
- Gestão de usuários, categorias e adegas
- Suporte a múltiplas unidades com visão consolidada
- Notificações de estoque crítico em tempo real

---

## Tecnologias

### Backend
- Java 21 + Spring Boot 3.2.5
- Spring Security + JWT (autenticação stateless)
- Spring Data JPA + Hibernate
- PostgreSQL + Flyway (migrations automáticas)
- MapStruct + Lombok
- Springdoc OpenAPI (Swagger UI)

### Frontend
- React 18 + TypeScript + Vite
- TanStack Query (data fetching e cache)
- React Router v6
- Tailwind CSS
- Recharts (gráficos)
- jsPDF + jspdf-autotable (exportação PDF)
- Sonner (notificações toast)

---

## Pré-requisitos

Apenas o **Docker Desktop** instalado na máquina.

- Download: https://www.docker.com/products/docker-desktop

---

## Como rodar

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/adega-system.git
cd adega-system
```

### 2. Suba os containers

```bash
docker-compose up --build
```

### 3. Acesse o sistema

| Serviço | URL |
|---|---|
| Sistema | http://localhost |
| Swagger API | http://localhost/swagger-ui/index.html |

> **Nota:** Na primeira execução, o processo pode levar entre 5 e 10 minutos para baixar as imagens e compilar o projeto.

---

## Usuários padrão

Criados automaticamente na primeira inicialização. Senha padrão para todos: `123456`.

| Perfil | Email | Senha | Acesso |
|---|---|---|---|
| Dono | roberto@adega.com | 123456 | Acesso completo a todas as adegas |
| Dono | marcos@adega.com | 123456 | Acesso completo a todas as adegas |
| Funcionário | carlos@adega.com | 123456 | Adega Central |
| Funcionário | ana@adega.com | 123456 | Adega Central |
| Funcionário | pedro@adega.com | 123456 | Adega Norte |

---

## Comandos úteis

```bash
# Subir o sistema
docker-compose up

# Subir em background
docker-compose up -d

# Parar o sistema
docker-compose down

# Parar e apagar os dados do banco
docker-compose down -v

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend

# Reconstruir após mudanças no código
docker-compose up --build
```

---

## Estrutura do projeto

```
adega-system/
├── adega-backend/          # API REST (Java + Spring Boot)
│   ├── src/
│   │   ├── main/java/com/adega/
│   │   │   ├── controller/     # Endpoints REST
│   │   │   ├── service/        # Regras de negócio
│   │   │   ├── repository/     # Acesso ao banco
│   │   │   ├── model/          # Entidades JPA
│   │   │   ├── dto/            # Request e Response DTOs
│   │   │   ├── security/       # JWT + Spring Security
│   │   │   └── config/         # Configurações e Seeder
│   │   └── resources/
│   │       └── db/migration/   # Migrations Flyway
│   └── Dockerfile
├── adega-frontend/         # Interface web (React + TypeScript)
│   ├── src/
│   │   ├── pages/          # Telas da aplicação
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── services/       # Chamadas à API
│   │   ├── hooks/          # React hooks customizados
│   │   ├── types/          # Interfaces TypeScript
│   │   └── utils/          # Utilitários (exportação PDF/CSV)
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Perfis de acesso

| Funcionalidade | Dono | Funcionário |
|---|:---:|:---:|
| PDV (registrar vendas) | ✅ | ✅ |
| Aplicar desconto | ✅ | ✅ |
| Cancelar venda | ✅ | ❌ |
| Ver dashboard | ✅ | ❌ |
| Ver CMV | ✅ | ❌ |
| Gerenciar produtos | ✅ | ❌ |
| Ver custo dos produtos | ✅ | ❌ |
| Gerenciar estoque | ✅ | ✅ |
| Ajuste manual de estoque | ✅ | ❌ |
| Fechar caixa | ✅ | ✅ |
| Gerenciar usuários | ✅ | ❌ |
| Configurações (categorias/adegas) | ✅ | ❌ |

---

## Licença

Este projeto é proprietário. Todos os direitos reservados.
