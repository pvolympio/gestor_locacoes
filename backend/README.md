# 🎪 Sistema de Gestão de Locações — API Backend

> Sistema profissional de controle de acervo, locações e agenda para eventos.
> Desenvolvido com NestJS, Prisma ORM e PostgreSQL.

---

## 📋 Índice

- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração do Banco](#banco-de-dados)
- [Rodando o Projeto](#rodando-o-projeto)
- [Documentação da API](#documentação-da-api)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Endpoints](#endpoints)
- [Automações](#automações)

---

## 🛠 Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js 20+ |
| Framework | NestJS 10 |
| ORM | Prisma 5 |
| Banco de Dados | PostgreSQL 16 |
| Autenticação | JWT + Refresh Token |
| Validação | class-validator |
| Documentação | Swagger/OpenAPI |
| Agendamento | @nestjs/schedule (Cron) |
| Rate Limiting | @nestjs/throttler |

---

## ✅ Pré-requisitos

- **Node.js** v20 ou superior → [nodejs.org](https://nodejs.org)
- **npm** v9+ (já vem com o Node)
- **Docker** e **Docker Compose** → [docker.com](https://docker.com) *(para o banco)*
  - **OU** PostgreSQL instalado localmente

---

## 🚀 Instalação

### 1. Clone / baixe o projeto

```bash
cd locacao-system
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações. Os valores padrão funcionam se
você usar o Docker Compose sem alterações.

---

## 🗄 Banco de Dados

### Opção A — Docker (recomendado)

```bash
# Sobe apenas o PostgreSQL
docker-compose up -d postgres

# Para subir também o pgAdmin (interface visual):
docker-compose --profile tools up -d
# pgAdmin disponível em: http://localhost:5050
# Login: admin@admin.com / admin
```

### Opção B — PostgreSQL local

Crie o banco manualmente:
```sql
CREATE DATABASE locacao_system;
```
E ajuste `DATABASE_URL` no `.env`.

---

### Executar as migrations

```bash
# Cria as tabelas no banco
npm run prisma:migrate

# (Em produção, use:)
npm run prisma:migrate:prod
```

### Popular o banco com dados iniciais

```bash
npm run prisma:seed
```

Após o seed, você terá:
- ✅ Usuário admin: `admin@sistema.com` / `admin123`
- ✅ 36 itens do acervo (dados reais das planilhas)
- ✅ 5 categorias organizadas
- ✅ 1 cliente de exemplo

---

## ▶️ Rodando o Projeto

### Desenvolvimento (com hot reload)

```bash
npm run start:dev
```

### Produção

```bash
npm run build
npm run start:prod
```

O servidor sobe em: **http://localhost:3000**

---

## 📚 Documentação da API (Swagger)

Acesse em desenvolvimento:

```
http://localhost:3000/docs
```

Lá você encontra todos os endpoints documentados, com exemplos de request/response
e botão para testar diretamente no navegador.

**Para autenticar no Swagger:**
1. Execute o endpoint `POST /auth/login`
2. Copie o `accessToken` da resposta
3. Clique em **Authorize** (cadeado) no topo da página
4. Cole o token no campo e confirme

---

## 📁 Estrutura do Projeto

```
src/
├── main.ts                     # Entry point
├── app.module.ts               # Módulo raiz
├── config/
│   └── app.config.ts           # Variáveis de configuração tipadas
├── prisma/
│   ├── prisma.service.ts       # Cliente Prisma global
│   └── prisma.module.ts
├── common/
│   ├── decorators/
│   │   ├── public.decorator.ts      # @Public() — rota sem auth
│   │   ├── roles.decorator.ts       # @Roles(UserRole.ADMIN)
│   │   └── current-user.decorator.ts # @CurrentUser()
│   ├── dto/
│   │   └── pagination.dto.ts        # Paginação reutilizável
│   ├── filters/
│   │   └── http-exception.filter.ts # Tratamento global de erros
│   ├── guards/
│   │   ├── jwt-auth.guard.ts        # Proteção JWT
│   │   └── roles.guard.ts           # Controle por perfil
│   └── interceptors/
│       ├── response.interceptor.ts  # Padroniza respostas
│       └── logging.interceptor.ts   # Log de requisições
└── modules/
    ├── auth/         # Login, registro, refresh token
    ├── clientes/     # CRUD de clientes
    ├── acervo/       # Gestão do estoque de itens
    ├── locacoes/     # Controle de locações + automações
    ├── agenda/       # Calendário e eventos
    └── dashboard/    # Métricas e indicadores

prisma/
├── schema.prisma   # Modelagem completa do banco
└── seed.ts         # Dados iniciais (acervo real das planilhas)

docs/
└── locacoes-api.postman_collection.json  # Coleção para testes
```

---

## 🔌 Endpoints Principais

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/v1/auth/login` | Login — retorna accessToken + refreshToken |
| POST | `/api/v1/auth/logout` | Invalida o refresh token |
| POST | `/api/v1/auth/refresh` | Renova tokens |
| GET | `/api/v1/auth/perfil` | Dados do usuário logado |

### Clientes
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/clientes` | Lista com busca e paginação |
| POST | `/api/v1/clientes` | Cadastrar cliente |
| GET | `/api/v1/clientes/buscar?nome=X` | Autocomplete por nome |
| GET | `/api/v1/clientes/:id` | Detalhes + histórico de locações |
| PUT | `/api/v1/clientes/:id` | Atualizar |
| DELETE | `/api/v1/clientes/:id` | Soft delete |

### Acervo
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/acervo` | Lista com filtros (status, categoria, busca) |
| POST | `/api/v1/acervo` | Adicionar item |
| GET | `/api/v1/acervo/categorias` | Listar categorias |
| GET | `/api/v1/acervo/:id` | Detalhes + histórico de uso |
| GET | `/api/v1/acervo/:id/disponibilidade` | Verificar disponibilidade por período |
| PUT | `/api/v1/acervo/:id` | Atualizar |
| DELETE | `/api/v1/acervo/:id` | Desativar |

### Locações
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/locacoes` | Lista com filtros avançados |
| POST | `/api/v1/locacoes` | Criar (valida conflitos automaticamente) |
| GET | `/api/v1/locacoes/:id` | Detalhes completos |
| PUT | `/api/v1/locacoes/:id` | Atualizar |
| PATCH | `/api/v1/locacoes/:id/finalizar` | Finalizar / devolver itens |
| PATCH | `/api/v1/locacoes/:id/cancelar` | Cancelar |

### Agenda
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/agenda/mes?ano=2026&mes=4` | Todos eventos do mês (calendário) |
| GET | `/api/v1/agenda/devolucoes-hoje` | Devoluções previstas para hoje |
| POST | `/api/v1/agenda` | Criar evento manual |
| GET/PUT/DELETE | `/api/v1/agenda/:id` | CRUD de eventos |

### Dashboard
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/dashboard` | Métricas gerais (cards principais) |
| GET | `/api/v1/dashboard/atividades` | Feed de atividades recentes |
| GET | `/api/v1/dashboard/itens-populares` | Ranking de itens mais alugados |
| GET | `/api/v1/dashboard/atrasadas` | Locações em atraso |
| GET | `/api/v1/dashboard/disponibilidade` | Disponibilidade em período |
| GET | `/api/v1/dashboard/grafico-mensal` | Evolução mensal (para gráficos) |

---

## 🤖 Automações

O sistema executa as seguintes tarefas automaticamente:

| Frequência | Ação |
|-----------|------|
| A cada hora | Marca locações vencidas como `ATRASADA` |
| A cada hora | Ativa locações `CONFIRMADA` → `ATIVA` na data de retirada |
| Ao criar locação | Cria eventos de Retirada e Devolução na Agenda |
| Ao criar locação | Valida conflitos de disponibilidade em tempo real |
| Ao finalizar locação | Libera todos os itens de volta ao acervo |
| Ao cancelar locação | Libera todos os itens de volta ao acervo |

---

## 🔒 Segurança

- Senhas hasheadas com **bcrypt** (salt 10)
- **JWT** com expiração curta (15min) + refresh token (7d)
- Refresh token hasheado no banco
- **Rate limiting**: 100 req/min por IP
- Validação e sanitização de todos os campos de entrada
- Guard de roles por endpoint
- Prisma previne SQL Injection nativamente

---

## 🧪 Testando com Postman

1. Abra o Postman
2. Importe: `docs/locacoes-api.postman_collection.json`
3. Execute **Login** primeiro — o token é salvo automaticamente nas variáveis
4. Todos os outros requests usarão o token automaticamente

---

## 🚀 Próximos Passos

- **Frontend** React + Next.js (Fase 2)
- Notificações por WhatsApp/SMS para devoluções atrasadas
- Relatórios em PDF
- Upload de fotos dos itens do acervo
- App mobile (React Native)
- Webhook para integrações externas

---

*Desenvolvido com arquitetura profissional — pronto para escalar.*
