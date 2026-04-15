# 🚀 Guia de Deploy Híbrido Gratuito

Seu código já está preparado! Siga o passo a passo exato abaixo para colocar seu sistema no ar.

## Plataformas que utilizaremos (Todas com plano gratuito):
* **Banco de Dados:** [Neon.tech](https://neon.tech) (PostgreSQL Serverless)
* **Backend API:** [Render.com](https://render.com) (Node.js)
* **Frontend PWA:** [Vercel](https://vercel.com) (Next.js)

---

## 1️⃣ Banco de Dados (Neon.tech)

1. Acesse [neon.tech](https://neon.tech) e crie uma conta com seu GitHub.
2. Crie um novo projeto (ex: `locacao-system`). A região ideal é `US East` (para ficar perto do Render e Vercel).
3. Na Dashboard do seu projeto Neon, procure por **Connection String** e copie a URL do PostgreSQL.
    * Deve ser algo parecido com: `postgresql://user:senha@ep-nome-id.us-east-2.aws.neon.tech/neondb?sslmode=require`
    * **IMPORTANTE:** Certifique-se de que a string termina com `?sslmode=require`. O Neon exige SSL!

---

## 2️⃣ Backend (Render.com)

Já criei um arquivo `render.yaml` dentro da pasta `backend` que autoconfigura os comandos de build e start.

1. Acesse [render.com](https://render.com) e crie uma conta com seu GitHub.
2. Certifique-se de que o seu código atual (incluindo o arquivo `render.yaml`) está em um repositório no seu GitHub.
3. No painel do Render, clique em **New** -> **Blueprint**.
4. Conecte sua conta do GitHub e selecione o repositório do seu projeto.
5. O Render vai ler o arquivo `render.yaml` e saber exatamente o que fazer.
6. Durante a configuração final, o Render pedirá para preencher as Variáveis de Ambiente necessárias. Você **DEVE** adicionar as seguintes chaves de forma segura no painel deles (na aba *Environment* do seu web service `locacao-system-api`):

| Variável | O que colocar |
| :--- | :--- |
| `DATABASE_URL` | Cole a URL copiada do **Neon.tech** (aquela com o `?sslmode=require`) |
| `JWT_SECRET` | Crie uma senha muito forte, ex: `sdfsjkdj493209sdfsdfkd9000sdsdfj384` |
| `JWT_REFRESH_SECRET`| Outra senha forte diferente, ex: `weouewoiu4o3iufdsikfh48w3yr298y423`|
| `JWT_EXPIRES_IN` | `4h` |
| `JWT_REFRESH_EXPIRES_IN`| `7d` |
| `CORS_ORIGINS` | Deixe em branco por enquanto! Vamos preencher isso quando tivermos o link do frontend. |

7. Finalize e aguarde o Deploy completo (vai demorar uns minutos e aparecer *Deploy successful*).
8. Copie a URL do seu backend gerada pelo Render (ex: `https://locacao-system-api-xyz.onrender.com`).

---

## 3️⃣ Frontend (Vercel)

1. Acesse [vercel.com](https://vercel.com) e conecte com seu GitHub.
2. Clique em **Add New...** -> **Project**.
3. Escolha o repositório do seu projeto.
4. **MUITO IMPORTANTE:** Em "Framework Preset" deixe "Next.js". Em **Root Directory**, clique em Editar e selecione a pasta `frontend`.
5. Abra a seção **Environment Variables** e adicione a seguinte variável:

| Variável | O que colocar |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | A URL que você copiou do **Render** seguida de `/api/v1`. Exemplo: `https://locacao-system-api-xyz.onrender.com/api/v1` |

6. Clique em **Deploy** e espere finalizar.
7. Quando terminar, a Vercel vai te dar o link oficial do seu sistema (ex: `https://locacoes.vercel.app`). Copie ele.

---

## 4️⃣ Toque Final: Liberando o CORS (Segurança)

Agora que você tem o link oficial do frontend, precisamos dizer pro backend aceitá-lo.

1. Volte na Dashboard do **Render**.
2. Vá no seu serviço `locacao-system-api`, aba **Environment**.
3. Encontre (ou adicione) a variável `CORS_ORIGINS`.
4. Coloque o link exato gerado pela Vercel (sem usar / no final).
    * Exemplo de valor: `https://locacoes.vercel.app`
5. Salve. O Render fará um novo deploy automático rápido.

---

## 🎉 Pronto! Tudo Online.

Acesse o link gerado pela Vercel no seu celular ou computador.
Ao abrir no celular, vai notar o aviso do navegador para poder "Adicionar à Tela Inicial", instalando ele como App nativo (graças ao PWA criado no passo anterior)!
