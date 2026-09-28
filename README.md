# FieldOps — Painel administrativo

Interface administrativa web do projeto FieldOps. Next.js 16 com App Router, React 19 e
TypeScript, com estrutura por feature e acesso à API a partir do servidor.

Este repositório contém a fundação técnica do painel (EP-01 / PBI-003): rotas de esqueleto,
camadas, guarda de rota, verificação de tipos, lint e testes. O shell administrativo
(issue #2), a camada de acesso a dados (issue #3) e os componentes compartilhados
(issue #4) entram em cards próprios. O login com a API está descrito em
[Autenticação](#autenticação).

## Pré-requisitos

| Ferramenta | Versão             | Observação                       |
| ---------- | ------------------ | -------------------------------- |
| Node.js    | 22 LTS ou superior | Verifique com `node -v`          |
| npm        | 10 ou superior     | Instalado junto com o Node       |

## Como rodar

```bash
npm install
cp .env.example .env.local    # ajuste API_BASE_URL e SESSION_SECRET
npm run dev
```

O painel sobe em `http://localhost:3000`. A raiz redireciona para `/dashboard`.

## Variáveis de ambiente

As variáveis ficam em `.env.local`, criado a partir de `.env.example`. O `.env.local` **não
é versionado**.

| Variável              | Obrigatória | Exposta ao navegador | Descrição                                   |
| --------------------- | ----------- | -------------------- | ------------------------------------------- |
| `API_BASE_URL`        | Sim         | Não                  | URL base da API REST, sem barra no final    |
| `SESSION_SECRET`      | Sim         | Não                  | Segredo do cookie de sessão                 |
| `NEXT_PUBLIC_APP_ENV` | Não         | Sim                  | `development`, `staging` ou `production`    |

> **Apenas o prefixo `NEXT_PUBLIC_` é embutido no bundle** enviado ao navegador. A URL da
> API e o segredo de sessão nunca podem ter esse prefixo: o painel conversa com a API a
> partir do servidor do Next, e o token de sessão fica em cookie `httpOnly`, fora do alcance
> do JavaScript da página. Guardar JWT em `localStorage` deixaria o token legível por
> qualquer script carregado.

A `API_BASE_URL` precisa ser alcançável **a partir do servidor do Next**, e não do navegador
do usuário. Se a API estiver em rede privada, o painel precisa estar na mesma rede.

## Estrutura

```text
src/
├── app/
│   ├── (public)/login/          rota pública
│   ├── (app)/                   grupo autenticado, envolvido pelo shell
│   │   ├── dashboard/  users/  clients/  sites/  equipment/
│   │   ├── inspection-templates/  inspections/
│   │   ├── non-conformities/  audit/  forbidden/
│   │   └── layout.tsx
│   └── page.tsx                 redireciona para /dashboard
├── components/ui/               componentes compartilhados
├── features/                    componentes, ações e schemas por feature
├── lib/api/                     cliente HTTP do servidor e tipos do OpenAPI
├── schemas/                     validação com Zod
└── proxy.ts                     guarda de rota
```

As rotas de esqueleto cobrem o mapa de navegação do documento 14.3 e existem desde o
bootstrap para que a navegação seja verificável antes das telas ficarem prontas.

## Autenticação

O login usa a autenticação JWT da API (`/api/v1/auth`) e nunca expõe token ao navegador:

```text
formulário -> Server Action signIn -> POST /auth/login (servidor do Next -> API)
           -> accessToken em fo_at, refreshToken em fo_rt (cookies httpOnly)
           -> redireciona para ?redirect= (só caminho interno) ou /dashboard
```

| Peça                               | Papel                                                         |
| ---------------------------------- | ------------------------------------------------------------- |
| `features/auth/login.ts`           | Server Action: revalida com Zod, autentica e grava a sessão   |
| `features/auth/login-form.tsx`     | Formulário, com validação imediata no navegador               |
| `features/auth/redirect-target.ts` | Aceita só destino interno, para o login não virar redirecionador aberto |
| `features/auth/error-messages.ts`  | Traduz o código de erro da API para linguagem de negócio      |
| `lib/session.ts`                   | Confirma a sessão em `GET /auth/me` a cada renderização do shell |
| `features/auth/actions.ts`         | Logout: revoga o refresh token em `POST /auth/logout` e apaga os cookies |

- Credencial inválida e e-mail inexistente mostram a mesma mensagem; conta inativa recebe
  orientação própria.
- O perfil **Técnico** é recusado no login e usa o aplicativo de campo. Decisão provisória,
  ainda a confirmar com o grupo.
- O cookie `fo_at` expira junto com o access token (15 minutos no backend). A renovação
  automática com `POST /auth/refresh` é a issue #8; até lá, a pessoa volta ao login quando o
  token vence.

### Usuário para testar localmente

As migrations do backend criam a tabela `users` vazia. Para o primeiro acesso, insira um
administrador direto no Postgres local; a coluna `password_hash` guarda um hash BCrypt, nunca
a senha em texto. O `pgcrypto` do próprio Postgres gera esse hash no formato `$2a$`, que o
`BCryptPasswordEncoder` do backend aceita:

```bash
docker exec -i fieldops-db psql -U fieldops -d fieldops <<'SQL'
CREATE EXTENSION IF NOT EXISTS pgcrypto;
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin Local',      'admin@fieldops.local',      crypt('Admin@123', gen_salt('bf', 10)), 'ADMIN'),
  ('Supervisor Local', 'supervisor@fieldops.local', crypt('Admin@123', gen_salt('bf', 10)), 'SUPERVISOR'),
  ('Técnico Local',    'tecnico@fieldops.local',    crypt('Admin@123', gen_salt('bf', 10)), 'TECHNICIAN')
ON CONFLICT DO NOTHING;
SQL
```

Isso altera só o banco da sua máquina, nunca o repositório do backend. O técnico serve para
conferir a recusa do perfil no painel.

## Proteção de rota

A proteção acontece em três camadas, e esconder botão não é nenhuma delas:

1. **`src/proxy.ts`** — em Next.js 16 este arquivo substitui o `middleware.ts` e exporta
   `proxy`. Faz apenas a checagem barata de presença do cookie de sessão, para evitar
   renderizar uma página que terminaria em redirecionamento.
2. **`lib/dal.ts`** — a barreira real. Verifica sessão e perfil por operação, e é
   reexecutada por Server Components, Server Actions e Route Handlers, porque cada um é um
   ponto de entrada independente e invocável diretamente. Entra na issue #3.
3. **API** — a decisão final é sempre do servidor (RN-003).

## Scripts

| Script                  | O que faz                                            |
| ----------------------- | ---------------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento com Turbopack            |
| `npm run dev:webpack`   | Servidor de desenvolvimento com Webpack              |
| `npm run build`         | Build de produção com Turbopack                      |
| `npm run build:webpack` | Build de produção com Webpack                        |
| `npm run lint`          | ESLint                                               |
| `npm run typecheck`     | `tsc --noEmit`, em modo estrito                      |
| `npm test`              | Suíte do Vitest                                      |
| `npm run test:watch`    | Vitest em modo interativo                            |
| `npm run verify`        | Lint, tipos, testes e build — o mesmo que o CI roda   |

O `typecheck` é um passo separado do build de propósito: o build do Next pode ser
configurado para ignorar erro de tipo, e nesse caso a verificação exigida pelo RNF-009
deixaria de acontecer.

## Contribuição

Veja o [Guia de Contribuição](https://github.com/FieldOps-Project/docs/blob/main/CONTRIBUTING.md)
para fluxo de trabalho, padrões de commit e nomenclatura de branches.

O plano completo de construção do painel — todas as telas, componentes, ações e a ordem de
implementação — está em [`docs/PLANO-FRONTEND.md`](docs/PLANO-FRONTEND.md).
