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

O `/inspections/{id}` segue a issue #18 e o documento 14.9. Clicar na referência da inspeção na
listagem abre o detalhe; o link **Revisar** continua indo direto para a revisão. A API não tem
código de apresentação: a referência `INS-XXXXXXXX` vem do início do identificador
(`inspectionReference`).

- **Montagem**: `loadInspectionDetail` lê `GET /inspections/{id}` e compõe a tela em paralelo com
  cliente, local, equipamento, técnico, supervisor, versão do modelo e `GET /inspections/{id}/history`.
  Nome de pessoa que a API nega ou não acha vira "—", sem derrubar a página.
- **Histórico sem JSON**: `previousValue` e `newValue` chegam como `chave=valor;chave=valor` (ou
  JSON, no relatório exportado). `lib/domain/audit-values.ts` lê os dois formatos; dele saem as
  mudanças de estado, o motivo do cancelamento e os horários de início e conclusão
  (`lib/domain/inspection-history.ts`).
- **Planejamento**, **Execução** (horários do dispositivo e do servidor lado a lado, RN-074, e a
  quantidade de itens do checklist) e **Linha do tempo**, com o link "Ver na auditoria".
- **Ações conforme o estado** (documento 7.6): **Cancelar** em atribuída, em execução e
  reprovada, com motivo obrigatório de até 1000 caracteres (RN-029); aprovada nunca oferece
  cancelar (RN-030). **Revisar** só em enviada e em revisão. **Editar planejamento**
  (`/inspections/{id}/edit`, `PUT /inspections/{id}`) só em rascunho e atribuída: título, técnico,
  supervisor, data, prioridade e instruções; modelo, cliente, local e equipamento ficam bloqueados.
- **Baixar relatório (PDF)**: `/api/inspections/{id}/report` repassa `GET /inspections/{id}/report.pdf`
  com o token da sessão. Cada download grava um evento de auditoria na API, então nada chama o
  endpoint ao abrir a página.
- **Agendamento** (`/inspections/new`, `POST /inspections`): exige título (até 255) e aceita
  instruções de até 2000 caracteres. O equipamento é obrigatório, como na API, exceto quando a
  categoria do modelo é local, ambiente, site, location ou environment
  (`requiresEquipment` em `lib/domain/inspection-scheduling.ts`). Os modelos do seletor vêm de
  `GET /inspection-templates?status=ACTIVE` e das versões com `activeForNewInspections`.

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

## Acessibilidade, responsividade e estados de interface

A issue #26 pede uma auditoria tela a tela dos nove estados do documento 14.15, acessibilidade
básica e responsividade em 1366×768 e 1920×1080 (RNF-007), sem rolagem horizontal da página.

- **Varredura automática**: as 40 telas, nas duas larguras, passadas pelo [axe-core](https://github.com/dequelabs/axe-core)
  (WCAG 2 A/AA) e medidas quanto à rolagem horizontal. Encontrados e corrigidos:
  - **contraste insuficiente** em 9 pontos — trilha de navegação, cabeçalho de tabela, descrição de
    página, selo de estado "neutro", card "Cancelada" do dashboard, rótulo do campo de QR code e o
    campo de exemplo da prévia do checklist. A maioria falhava por pouco (ratio 4.14–4.49 de 4.5
    exigido); os tokens de cor usados viraram `neutral-600`/`neutral-700` conforme o fundo;
  - **um décimo ponto que o axe não pega**: a busca do cabeçalho (ícone e campo, presente nas 40
    telas) também estava em `neutral-500` sobre `neutral-100` (ratio 3.83). O axe-core não confere
    de forma confiável o contraste do texto de `placeholder`, então a varredura passou batido; o
    `/code-review` achou lendo o componente. Mesma correção, para `neutral-700`;
  - **paginação simples** (`components/ui/pagination.tsx`) sem `aria-disabled` nos links
    "Anterior"/"Próxima" quando desativados — o axe não isenta contraste de um controle que não se
    anuncia como inativo; agora segue o mesmo padrão da paginação numérica;
  - **`<dl>` mal formado** no detalhe de equipamento (`div` dentro de `div` fora do padrão
    dt/dd) — corrigido com o mesmo prop `wide` já usado no detalhe da inspeção;
  - **construtor de modelos sem `<h1>`**: o título visível é a trilha da `BuilderToolbar`
    (desenho do Stitch); ganhou um `<h1 className="sr-only">` para a hierarquia de títulos ficar
    coerente sem mudar o visual.
  - Nenhuma tela teve rolagem horizontal da página; tabelas largas (auditoria, fila de revisão)
    continuam rolando dentro do próprio container, como o RNF-007 permite.
- **Teclado e diálogos**: conferido à mão que o diálogo de confirmação e o de cancelar inspeção
  prendem o foco, fecham com Esc e devolvem o foco a quem abriu.
- **Estado nunca só por cor**: todo selo de situação (`StatusBadge`, `SeverityBadge`) escreve o
  rótulo, cor e ícone só reforçam.

### Estados por tela (documento 14.15)

Levantado a partir do código (arquivo `loading.tsx` irmão, uso de `EmptyState`, `FormFooter`/
`SubmitButton`, `FlashNotice`/toast), não clicando tela por tela. "—" quer dizer que o estado não
se aplica a essa tela (uma tela só de leitura não tem "processando", por exemplo), não que falte
fazer. Autorização (403 → `/forbidden`), sessão expirada (401) e erro de rede/interno são tratados
uma vez para o painel inteiro, em `lib/dal.ts` e em `(app)/error.tsx`, por isso não têm coluna
própria aqui.

| Tela | Carregando | Com dados | Sem dados | Erro de validação | Processando | Confirmação |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard | ✓ | ✓ | — | — | — | — |
| Usuários — lista | — | ✓ | ✓ | — | — | ✓ |
| Usuários — novo | — | ✓ | — | ✓ | ✓ | — |
| Usuários — detalhe | ✓ (instantâneo) | — | — | — | — | — |
| Usuários — editar | — | ✓ | — | ✓ | ✓ | — |
| Clientes — lista | — | ✓ | ✓ | — | — | ✓ |
| Clientes — novo | — | ✓ | — | ✓ | ✓ | — |
| Clientes — detalhe | ✓ (instantâneo) | — | — | — | — | — |
| Clientes — editar | — | ✓ | — | ✓ | ✓ | — |
| Clientes — locais do cliente | — | ✓ | ✓ | — | — | — |
| Locais — lista | — | ✓ | ✓ | — | — | ✓ |
| Locais — novo | — | ✓ | ✓ | ✓ | ✓ | — |
| Locais — detalhe | ✓ (instantâneo) | — | — | — | — | — |
| Locais — editar | — | ✓ | — | ✓ | ✓ | — |
| Locais — equipamentos do local | — | ✓ | ✓ | — | — | — |
| Equipamentos — lista | — | ✓ | ✓ | — | — | ✓ |
| Equipamentos — novo | — | ✓ | ✓ | ✓ | ✓ | — |
| Equipamentos — detalhe | — | ✓ | — | — | — | ✓ |
| Equipamentos — editar | — | ✓ | — | ✓ | ✓ | — |
| Equipamentos — etiqueta | — | ✓ | — | — | — | — |
| Modelos — lista | ✓ | ✓ | ✓ | — | — | ✓ |
| Modelos — novo | — | ✓ | — | ✓ | ✓ | — |
| Modelos — detalhe (redireciona ao construtor) | ✓ (instantâneo) | — | — | — | — | — |
| Modelos — construtor | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| Modelos — prévia | ✓ | ✓ | — | — | — | — |
| Modelos — versões | — | ✓ | ✓ | — | — | — |
| Modelos — versão (detalhe) | ✓ | ✓ | — | — | — | — |
| Inspeções — lista | — | ✓ | ✓ | — | ✓ | ✓ |
| Inspeções — nova | — | ✓ | — | ✓ | ✓ | — |
| Inspeções — fila de revisão | ✓ | ✓ | ✓ | — | — | — |
| Inspeções — detalhe | ✓ | ✓ | — | — | ✓ | ✓ |
| Inspeções — editar planejamento | — | ✓ | — | ✓ | ✓ | — |
| Inspeções — revisão | — | ✓ | — | — | ✓ | ✓ |
| Não conformidades — lista | ✓ | ✓ | ✓ | — | ✓ | — |
| Não conformidades — detalhe | ✓ | ✓ | — | — | — | — |
| Auditoria | ✓ | ✓ | ✓ | — | ✓ | — |
| Busca | — | ✓ | — | — | — | — |
| Configurações | — | ✓ | — | — | — | — |
| Suporte | — | ✓ | — | — | — | — |
| Acesso negado | — | ✓ | — | — | — | — |

## Tema

Claro, escuro ou "sistema" (padrão), trocável no menu do avatar e em Configurações, sem flash
na carga e persistido entre sessões (card #29).

- **Regra: cor vem sempre de um token, nunca de classe `dark:` espalhada.** Os ~1.300 usos de
  `bg-neutral-0`, `text-neutral-900` etc. funcionam nos dois temas porque cada degrau da rampa
  é redefinido dentro de `[data-theme="dark"]` em `globals.css` — o degrau N do claro vira o
  degrau N do escuro (mesma lógica da Atlassian). Um componente só deveria usar `dark:` com uma
  razão concreta para não caber num token existente; na dúvida, criar um token novo em vez de
  espalhar a classe.
- **Tokens de exceção** — o que não pode seguir a rampa, porque o valor "espelhado" dá errado:

  | Token | Uso | Por quê não segue a rampa |
  | --- | --- | --- |
  | `surface-overlay` | Diálogos, popover, menus, toasts | Tem que ficar **mais claro** que o cartão no escuro — diálogo mais escuro que a página é o erro clássico de tema escuro |
  | `surface-hover` | `hover:` sobre superfície | A rampa espelhada inverteria o hover: escureceria em vez de clarear |
  | `blanket` / `blanket-strong` | Fundo atrás de modais e do visualizador de fotos | Unifica as 4 opacidades antigas (40/50/40/70) em 2 |
  | `input` / `input-border` / `input-disabled` | Campos de formulário | Precisam de superfície própria, senão somem dentro do cartão; desabilitado fica **mais escuro**, não mais claro |
  | `media` | Fundo atrás da foto no visualizador | A rampa deixaria a moldura quase branca |
  | `knob` | Bolinha dos interruptores | Precisa contrastar com o trilho nos dois temas |
  | `paper` / `ink` | Etiqueta impressa do equipamento | Papel e tinta não têm tema — é um objeto físico |
  | `shadow-raised` / `shadow-overlay` | Sombra de cartão/diálogo | O Tailwind 4 compila `shadow-*` com valor fixo; estes dois utilitários leem uma variável (`--elevation-*`) que o bloco escuro troca por sombra + contorno, porque sombra sozinha não aparece no escuro |

- **Mecanismo**: um script inline no `<head>` (`src/lib/theme.ts`, `THEME_INIT_SCRIPT`) aplica
  `data-theme` no `<html>` antes da primeira pintura — sem isso have flash do tema errado na
  recarga. `ThemeSync` (`src/components/theme/theme-sync.tsx`) reaplica em `useLayoutEffect`
  (Strict Mode redesenha o `<html>` no remount de dev), segue o sistema operacional ao vivo
  quando a preferência é "sistema" e sincroniza a troca feita em outra aba pelo evento
  `storage`. `ThemeSwitcher` (`src/components/shell/theme-switcher.tsx`) é o controle visível,
  um `radiogroup` acessível com `useSyncExternalStore` — sem isso o valor inicial do servidor
  (sempre "sistema") divergiria do valor real do cliente na hidratação.
- **Impressão e QR Code nunca escurecem**: o bloco escuro fica dentro de `@media screen`, e o
  QR Code/a etiqueta usam `paper`/`ink`, fixos nos dois temas — leitor de QR não lê código
  invertido, e a etiqueta representa papel.
- **Como testar**: `localStorage.setItem('fieldops-theme', 'dark')` e recarregar, ou pelo
  seletor em Configurações. Ao adicionar uma tela ou componente novo, abrir em claro e escuro
  antes do PR; campo, diálogo ou mídia nova provavelmente precisa de um dos tokens acima, não
  de `bg-neutral-0` direto.

## Contribuição

Veja o [Guia de Contribuição](https://github.com/FieldOps-Project/docs/blob/main/CONTRIBUTING.md)
para fluxo de trabalho, padrões de commit e nomenclatura de branches.

O plano completo de construção do painel — todas as telas, componentes, ações e a ordem de
implementação — está em [`docs/PLANO-FRONTEND.md`](docs/PLANO-FRONTEND.md).
