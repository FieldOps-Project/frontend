# FieldOps — Painel administrativo

Interface administrativa web do projeto FieldOps. Next.js 16 com App Router, React 19 e
TypeScript, com estrutura por feature e acesso à API a partir do servidor.

Este repositório contém a fundação técnica do painel (EP-01 / PBI-003): rotas de esqueleto,
camadas, guarda de rota, verificação de tipos, lint e testes. O shell administrativo
(issue #2), a camada de acesso a dados (issue #3) e os componentes compartilhados
(issue #4) entram em cards próprios. Autenticação real é EP-02.

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
│   │   ├── search/  settings/  support/
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

## Dashboard

O `/dashboard` segue o documento 14.5 e a issue #28: total de inspeções por estado,
revisões pendentes, inspeções atrasadas (com a variação desde ontem), não conformidades
recentes e os atalhos **Revisar Pendências** e **Criar Inspeção**.

- **Cada número é um link** para `/inspections` com o filtro correspondente
  (`?status=`, `?review=1`, `?overdue=1`). Atraso e "aguardando revisão" usam as mesmas
  regras da listagem (`lib/domain/inspection-list.ts`), e um teste garante que os números
  batem.
- **Contrato esperado da API** (`lib/domain/dashboard.ts`): `GET /dashboard/summary`
  devolve `inspectionsByStatus`, `awaitingReview`, `overdue` e `overdueYesterday`
  (backend#36); as recentes vêm de `GET /non-conformities?size=3&sort=reportedAt,desc`
  (backend#23).
- **Dados de demonstração** só com `NEXT_PUBLIC_APP_ENV=development`
  (`features/dashboard/dashboard-fixture.ts`), derivados das mesmas inspeções de demonstração
  da listagem. O único ponto de troca para a API é `features/dashboard/dashboard-data.ts`.
- Em outros ambientes, enquanto a API não publica esses endpoints, só o bloco afetado avisa
  que está indisponível; o restante da tela continua funcionando.

O cabeçalho do painel tem a busca em todas as áreas (`/search`), notificações, ajuda
(`/support`), o ambiente, o perfil e o menu da conta (configurações e sair).

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
