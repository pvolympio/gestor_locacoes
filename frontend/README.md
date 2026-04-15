# 🎨 Sistema de Locações — Frontend

> Interface profissional construída com Next.js 14, TailwindCSS e React Query.
> Design system dark com acento âmbar, responsivo para desktop e mobile.

---

## 🛠 Stack

| Tecnologia | Uso |
|------------|-----|
| Next.js 14 (App Router) | Framework React |
| TypeScript | Tipagem estática |
| TailwindCSS | Estilização utilitária |
| React Query (TanStack) | Cache e sync de dados |
| React Hook Form + Zod | Formulários e validação |
| Recharts | Gráficos do dashboard |
| Zustand | Estado global (auth) |
| Axios | Cliente HTTP |
| Framer Motion | Animações |
| React Hot Toast | Notificações |

---

## 🚀 Instalação e execução

### Pré-requisito
O backend deve estar rodando em `http://localhost:3000`.
Veja as instruções em `locacao-system/README.md`.

### 1. Instale as dependências
```bash
cd locacao-frontend
npm install
```

### 2. Configure o ambiente
O arquivo `.env.local` já está pré-configurado para apontar ao backend local:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```
Se o seu backend rodar em outra porta, ajuste este valor.

### 3. Rode em desenvolvimento
```bash
npm run dev
```

Acesse: **http://localhost:3001**

> O Next.js usa porta 3000 por padrão, mas como o backend já está lá,
> rode com a flag de porta alternativa:
> ```bash
> npm run dev -- -p 3001
> ```

### 4. Build para produção
```bash
npm run build
npm run start
```

---

## 📁 Estrutura do projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── layout.tsx          # Root layout (providers globais)
│   ├── page.tsx            # Redirect para /dashboard
│   ├── login/
│   │   └── page.tsx        # Tela de login
│   ├── dashboard/
│   │   ├── layout.tsx      # Injeta AppShell
│   │   └── page.tsx        # Métricas, gráfico, atividades
│   ├── acervo/
│   │   ├── layout.tsx
│   │   └── page.tsx        # Listagem + CRUD do acervo
│   ├── locacoes/
│   │   ├── layout.tsx
│   │   ├── page.tsx        # Listagem de locações
│   │   └── [id]/page.tsx   # Detalhe de uma locação
│   ├── clientes/
│   │   ├── layout.tsx
│   │   └── page.tsx        # Clientes em cards + CRUD
│   └── agenda/
│       ├── layout.tsx
│       └── page.tsx        # Calendário mensal interativo
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx    # Wrapper autenticado (Sidebar + Topbar)
│   │   ├── Sidebar.tsx     # Navegação lateral
│   │   ├── Topbar.tsx      # Barra superior com alertas
│   │   └── Providers.tsx   # QueryClient + Toaster
│   ├── ui/
│   │   └── index.tsx       # Design system: Button, Input, Modal, Badge, etc.
│   └── locacoes/
│       └── NovaLocacaoModal.tsx  # Formulário completo de locação
│
├── hooks/                  # React Query hooks por domínio
│   ├── useAuth.ts
│   ├── useAcervo.ts
│   ├── useLocacoes.ts
│   ├── useClientes.ts
│   ├── useAgenda.ts
│   └── useDashboard.ts
│
├── lib/
│   ├── api.ts              # Axios com interceptors de auth
│   ├── auth.ts             # login/logout com cookies
│   └── utils.ts            # formatadores, helpers
│
├── types/
│   └── index.ts            # Tipos TypeScript espelhando o backend
│
└── styles/
    └── globals.css         # Design system + variáveis CSS
```

---

## 🎨 Design System

O sistema usa um tema **dark profissional** com acento âmbar:

```css
--bg:           #0c0c0e   /* Fundo principal */
--bg-card:      #18181c   /* Cards */
--accent:       #f59e0b   /* Âmbar — cor principal de ação */
--text-primary: #f4f4f5   /* Texto principal */
--green:        #10b981   /* Disponível / Sucesso */
--red:          #ef4444   /* Atraso / Erro */
--blue:         #3b82f6   /* Confirmado / Info */
```

Classes de componente disponíveis globalmente (via Tailwind `@layer components`):
- `.card`, `.card-hover` — containers
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`
- `.input`, `.input-error`
- `.label`
- `.badge`, `.badge-green`, `.badge-amber`, `.badge-red`, `.badge-blue`, `.badge-gray`
- `.table`, `.table-wrapper`
- `.nav-link`
- `.skeleton`

---

## 🔐 Autenticação

O sistema usa JWT com refresh token automático:
- Tokens salvos em cookies (`access_token`, `refresh_token`)
- O interceptor Axios renova automaticamente o access token quando recebe 401
- Redirect automático para `/login` se não autenticado

---

## 📱 Responsividade

- **Desktop** (≥768px): Sidebar fixa, layout em grid
- **Mobile** (<768px): Sidebar oculta, layout empilhado

---

## 🔄 Fluxo de dados

Todos os dados são gerenciados via **React Query**:
- Cache automático com `staleTime: 30s`
- Invalidação automática após mutations (criar/editar/deletar)
- Loading states com skeletons
- Retry automático em falhas de rede

---

## 📦 Scripts disponíveis

```bash
npm run dev          # Desenvolvimento com hot reload
npm run dev -- -p 3001  # Desenvolvimento na porta 3001
npm run build        # Build de produção
npm run start        # Iniciar build de produção
npm run lint         # Verificar erros de lint
```
