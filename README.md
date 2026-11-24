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

## Modelos de inspeção

O `/inspection-templates` segue a issue #13 e o documento 14.8: busca, filtros por situação e
por categoria, e a situação de cada modelo com a versão vigente ("Publicado · versão 2").

- **Novo modelo** (`/inspection-templates/new`): título e categoria obrigatórios (RN-015), com
  as categorias já usadas como sugestão. Ao criar, abre o construtor.
- **Construtor** (`/inspection-templates/{id}/edit`, issue #14), no desenho do Stitch: painel com
  título, descrição, categoria e histórico de versões; seções numeradas com os itens. Cada item
  tem pergunta, tipo de resposta (os 7 do MVP), instrução, obrigatoriedade e, em conformidade e
  sim/não, exigência de observação e evidência na falha; escolha única edita as opções. Seções e
  itens são criados, editados, excluídos e reordenados (botões ou arrastando pela alça), e a
  reordenação envia a lista completa numa chamada só. O construtor sempre edita o rascunho.
- **Publicação** (issue #15), pelos botões do topo do construtor: **Pré-visualizar**
  (`/preview`, o checklist como o técnico vê, só leitura), **Validar pendências** (lista completa
  do que impede publicar, cada item levando ao ponto exato) e **Publicar versão** (confirmação de
  que a versão fica imutável e o número gerado). A conferência local repete as regras do backend;
  se a API recusar com `422 TEMPLATE_PUBLISH_INVALID`, valem as pendências dela. As versões
  publicadas ficam em `/versions` (número, autor, data e se aceitam novos agendamentos) e o
  conteúdo de cada uma em `/versions/{versionId}`.
- **Inativar e reativar** só para modelos já publicados, como a API exige. A confirmação avisa
  que as inspeções existentes não são afetadas (RN-022).
- **Contrato** em `lib/domain/inspection-template.ts` e `lib/domain/template-builder.ts`, igual
  às respostas da API (`/inspection-templates`, `/sections`, `/items`, `/versions`).
- **Demonstração com memória** em `NEXT_PUBLIC_APP_ENV=development`
  (`features/templates/template-demo-store.ts` e `template-draft-demo-store.ts`, com o modelo
  "Inspeção de Máquinas Pesadas" igual ao do Stitch): o que for criado ou alterado fica guardado até
  o servidor de desenvolvimento reiniciar. O único ponto de troca para a API é
  `features/templates/templates-data.ts`.

## Detalhe da inspeção

O `/inspections/{id}` segue a issue #18 e o documento 14.9. Clicar no código da inspeção na
listagem abre o detalhe; o link **Revisar** continua indo direto para a revisão.

- **Planejamento**: cliente, local, equipamento, técnico, supervisor, prioridade, prazo (com
  atraso), modelo e instruções.
- **Execução**: horários do dispositivo e do servidor lado a lado (RN-074), com "Aguardando
  sincronização" quando o servidor ainda não recebeu; localização registrada com precisão e
  horário; progresso dos itens.
- **Linha do tempo** (autor, ação, horário do servidor e, quando houver, do dispositivo), com
  mudanças de estado, fotografias e não conformidades (issue #24), a partir de
  `GET /inspections/{id}/history`, e o link "Ver na auditoria". Se a API não responder, só esse
  bloco aparece como indisponível.
- **Ações conforme o estado** (documento 7.6): **Cancelar** em atribuída, em execução e
  reprovada, com motivo obrigatório e botão desativado enquanto ele estiver vazio (RN-029);
  aprovada nunca oferece cancelar (RN-030). **Revisar** só em enviada e em revisão. **Editar
  planejamento** (`/inspections/{id}/edit`) só em rascunho e atribuída: técnico, supervisor, data,
  prioridade e instruções; modelo, cliente, local e equipamento ficam bloqueados.
- **Contrato** em `lib/domain/inspection-detail.ts`. O cancelamento usa o endpoint que já existe
  (`POST /inspections/{id}/cancel`, `{ reason }`); detalhe, histórico e `PUT /inspections/{id}`
  ainda não existem na API.
- **Demonstração com memória** em `NEXT_PUBLIC_APP_ENV=development`
  (`features/inspections/inspection-demo-store.ts`): as inspeções da listagem abrem com detalhe e
  histórico, e cancelar ou replanejar aparece também na listagem e no dashboard até o servidor
  reiniciar. O único ponto de troca para a API é `features/inspections/detail-data.ts`.

## Não conformidades

O `/non-conformities` segue a issue #20 e o documento 14.12. No MVP a não conformidade é
registrada e consultada, não tratada: só existe o estado "Aberta" e a tela não oferece mudança de
estado.

- **Listagem** com filtros por criticidade, cliente e período (na URL), paginação e ordem padrão
  da mais grave para a menos grave. A criticidade vai sempre escrita no selo (RN-054).
- **Detalhe** (`/non-conformities/{id}`): descrição, criticidade, a inspeção a que pertence
  (RN-052), horários de campo e do servidor, o **item de origem** com pergunta, resposta e
  observação do técnico (RN-053) e as evidências.
- **Bloco no detalhe da inspeção** com as não conformidades dela, cada uma levando ao detalhe; as
  não conformidades recentes do dashboard também abrem o detalhe.
- **Contrato** em `lib/domain/non-conformity.ts`. A API ainda não publica
  `GET /non-conformities` nem `/{id}` (backend #23); em `development` a tela usa a demonstração
  ligada às inspeções de exemplo. O único ponto de troca é
  `features/non-conformities/non-conformities-data.ts`.

## Fila de revisão

O `/inspections/review-queue` segue a issue #21: as inspeções enviadas e em revisão, da que espera
há mais tempo para a mais recente.

- **Tempo de espera** desde o envio confirmado pelo servidor, em linguagem natural ("enviada há 2
  dias"), com a data completa no título; mais de um dia fica em destaque.
- **Quem iniciou a revisão** aparece nas inspeções em revisão, para dois supervisores não
  revisarem a mesma em paralelo.
- **Navegação**: chega-se pelos atalhos do dashboard (Revisar Pendências e o cartão de revisões
  pendentes) e pelo botão "Fila de revisão" da listagem, que mostra quantas aguardam. O botão
  **Revisar** de cada linha abre a revisão com o link de volta para a fila; quem chega à revisão
  pelo detalhe volta para o detalhe.
- **Escopo** (RN-005): a API devolve ao supervisor as inspeções sob sua responsabilidade e ao
  administrador todas. Fila vazia mostra "Tudo revisado!".
- O único ponto de troca é `features/inspections/review-queue-data.ts`
  (`GET /inspections?review=1&sort=submittedAtServer,asc`); em `development` a fila usa as
  inspeções de demonstração.

## Auditoria

O `/audit` segue o desenho do Stitch "Auditoria de Sistema" e a issue #24: o registro de atividades
do sistema, do evento mais recente para o mais antigo, somente leitura (RN-088).

- **Filtros** de período (últimos 7 dias por padrão), usuário, entidade e tipo de ação, na URL e
  com paginação no servidor. O filtro de entidade não está no Stitch; entra porque a issue exige.
- **Tabela**: código do evento, data e hora com segundos (e o horário do dispositivo quando a ação
  veio do aplicativo), usuário ou "Sistema (Auto)", ação em linguagem de negócio, entidade com link
  e descrição. Abaixo de 1280px cada evento vira um cartão.
- **Exportar Relatório** baixa o CSV de todos os eventos filtrados (`/audit/export`), avisando no
  fim se o relatório foi limitado.
- **Linha do tempo** no detalhe da inspeção: mudanças de estado, fotografias e não conformidades,
  com o link "Ver na auditoria" filtrado pela inspeção.
- O único ponto de troca é `features/audit/audit-data.ts` (`GET /audit-events`); em `development`
  os eventos saem das inspeções, fotos e não conformidades de demonstração.

## Evidências

As fotografias seguem a issue #19 e não têm URL pública.

- **Imagem só com sessão válida**: o navegador pede `/api/evidence/{id}?variant=thumbnail|original`,
  um Route Handler que confere a sessão na API (401 sem ela, 403 fora do painel) e repassa o
  binário de `GET /evidence/{id}/file`. O escopo de cada inspeção é decidido pela API, e o 403 ou
  404 dela é repassado. A resposta usa cache privado, nunca compartilhado entre usuários.
- **Miniatura na lista, original só na ampliação**: as miniaturas carregam sob demanda; a
  ampliação mostra a imagem inteira, a descrição, o horário de captura no dispositivo e as
  coordenadas (com link para o mapa), e navega pelas setas.
- **Galeria no detalhe da inspeção**, agrupada pelo item do checklist (RN-045). A revisão e o
  detalhe da não conformidade usam as mesmas miniaturas junto do item.
- **Arquivo pendente** (metadados recebidos, upload não confirmado) aparece como "Aguardando
  upload", sem imagem quebrada. Nenhuma tela oferece excluir evidência (RN-049).
- **Contrato** em `lib/domain/evidence.ts`. A API ainda não publica as evidências (backend #22);
  em `development` as imagens são desenhadas em SVG pelo próprio Route Handler. O único ponto de
  troca da listagem é `features/evidence/evidence-data.ts`.

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

## Testes dos fluxos prioritários

A issue #25 pede os onze fluxos do documento 14.16 cobertos e rodando no CI, que reprova o
build quando algum teste falha (passo "Testes" de `.github/workflows`).

- **API simulada na rede** com o MSW (`src/test/api.ts`): o `fetch` de verdade é interceptado,
  então o cliente HTTP, a sessão, a DAL e a tradução de erros continuam sendo o código real.
  Chamada sem handler falha o teste. Só as peças do próprio Next (cookies, `redirect`,
  `notFound`) são simuladas, em `src/test/next.ts`.
- `npx vitest run src/test` roda só os fluxos; `npm test` roda a suíte inteira.

| # | Fluxo (documento 14.16) | Onde está o teste |
| - | ----------------------- | ----------------- |
| 1 | Proteção de rota sem sessão | `src/test/flows/access.test.ts` e `src/proxy.test.ts` |
| 2 | Permissões por perfil (menu e ação) | `src/test/flows/access.test.ts` (Server Action recusada) e `src/lib/navigation.test.ts` (menu) |
| 3 | Validação de formulário | `features/auth/login-form.test.tsx`, `features/inspections/schedule-form.test.tsx`, `features/templates/new-template-form.test.tsx` |
| 4 | Filtro encadeado cliente → local → equipamento, com limpeza | `features/inspections/schedule-form.test.tsx` ("limpa local e equipamento ao trocar o cliente") |
| 5 | Criação de modelo | `features/templates/actions.test.ts` |
| 6 | Bloqueio de publicação inválida | `features/templates/builder/builder-actions-bar.test.tsx` e `features/templates/publication-check.test.ts` |
| 7 | Criação de inspeção | `features/inspections/schedule-actions.test.ts` |
| 8 | Estados de tela | `src/test/flows/screen-states.test.tsx` |
| 9 | Aprovação | `src/test/flows/review.test.ts` |
| 10 | Motivo obrigatório na reprovação | `src/test/flows/review.test.ts` |
| 11 | Erros da API (401, 403, 409, 422) com `fieldErrors` no campo certo | `src/test/flows/api-errors.test.ts` |

## Contribuição

Veja o [Guia de Contribuição](https://github.com/FieldOps-Project/docs/blob/main/CONTRIBUTING.md)
para fluxo de trabalho, padrões de commit e nomenclatura de branches.

O plano completo de construção do painel — todas as telas, componentes, ações e a ordem de
implementação — está em [`docs/PLANO-FRONTEND.md`](docs/PLANO-FRONTEND.md).
