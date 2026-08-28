# Plano de construção do painel administrativo

Inventário do que precisa ser construído no repositório `frontend`: 31 rotas, 26 componentes
compartilhados, as ações de cada tela e a ordem em que atacá-las.

Levantado a partir das 31 issues deste repositório e dos documentos 9 (regras de negócio),
10 (modelo de dados), 12 (API REST) e 14 (interface administrativa) versionados em
`docs/notion/`.

---

## 1. Decisões que já estão tomadas

### 1.1 A stack é Next.js 16

A issue #1 é explícita: **Next.js 16 com App Router, React 19, TypeScript estrito, Server
Components e Server Actions, validação com Zod**. A divergência em relação ao documento 11.5
do Notion, que sugeria Angular, é reconhecida no próprio card e precisa virar um ADR no
repositório `docs` — isso é critério de aceitação da #1, não item opcional.

A branch local `chore/EP-01-bootstrap-angular` está com o nome errado e deve ser descartada.
O nome correto pela convenção do `CONTRIBUTING.md` é `chore/EP-01-bootstrap-web`.

Três pontos específicos do Next.js 16 que mudam em relação ao que a maioria dos tutoriais
mostra:

- `middleware.ts` foi renomeado para **`proxy.ts`**, com export nomeado `proxy`. O runtime é
  Node.js e não é configurável.
- `params` e `searchParams` são **Promises** e precisam de `await`.
- `strict: true` e `noUncheckedIndexedAccess: true` são obrigatórios. O RNF-009 exige
  verificação de tipos; sem modo estrito, a verificação passa a ser decorativa.

```tsx
export default async function Page(props: PageProps<'/inspections/[id]'>) {
  const { id } = await props.params
  const filtros = await props.searchParams
}
```

### 1.2 O token JWT nunca chega ao navegador

O padrão de sessão está fechado nas issues #3, #6 e #7: o servidor do Next é quem conversa
com a API Spring. O JWT vive em cookie `httpOnly`, o cliente HTTP é marcado com
`import 'server-only'` e toda leitura passa por `lib/dal.ts`.

Isso decide a arquitetura inteira do painel: quase nada é Client Component, e nenhuma tela
chama a API diretamente do navegador.

Separação obrigatória das variáveis de ambiente:

| Variável              | Onde vive | Observação                                            |
| --------------------- | --------- | ----------------------------------------------------- |
| `API_BASE_URL`        | Servidor  | Nunca exposta ao navegador                            |
| `SESSION_SECRET`      | Servidor  | Nunca exposta ao navegador                            |
| `NEXT_PUBLIC_APP_ENV` | Navegador | Apenas para a indicação visual de ambiente            |

> O prefixo `NEXT_PUBLIC_` embute o valor no bundle do navegador. A URL interna da API e o
> segredo de sessão nunca podem ter esse prefixo.

### 1.3 O backend não entrega nada ainda — e isso está previsto

A API tem zero endpoints de domínio e nenhuma tabela: a migração `V1__baseline.sql` só cria a
extensão `uuid-ossp`. O documento 12.17 autoriza explicitamente a saída:

> Quando o backend ainda não estiver pronto, mobile e web poderão utilizar mocks baseados no
> mesmo contrato. A substituição do mock não deverá exigir alteração completa da interface.

Na prática: escrever os tipos a partir do documento 12 agora, interceptar no nível de rede
com MSW, e trocar por `openapi-typescript` quando a issue `backend#3` sair.

**Simular a API, não o próprio código.** Interceptar no nível de rede mantém o código real de
acesso a dados sob teste; substituir o módulo de API por um duplo faz o teste validar o
duplo, e transforma a troca posterior em reescrita.

---

## 2. Arquitetura: por onde um dado passa

```text
NAVEGADOR                SERVIDOR DO NEXT                          ORIGEM DO DADO
┌──────────────┐        ┌────────────────────────────────┐        ┌──────────────────┐
│ Client       │        │ proxy.ts                       │        │ MSW (hoje)       │
│ Components   │──────▶│   tem cookie? senão /login     │        │ contrato doc. 12 │
│              │ cookie │            │                   │        └──────────────────┘
│ filtros,     │        │            ▼                   │                 ▲
│ diálogos,    │        │ Server Components              │                 │
│ construtor   │        │   lê searchParams, renderiza   │                 │
└──────────────┘        │            │                   │                 │
       ▲                │            ▼                   │        ┌──────────────────┐
       │                │ ┌────────────────────────────┐ │        │ API Spring       │
       │                │ │ lib/dal.ts                 │ │───────▶│ (depois)         │
       │                │ │   verifySession()          │ │        │ mesma URL,       │
       │                │ │   checa perfil da operação │ │        │ mesmos tipos     │
       │                │ │ lib/api/client.ts          │ │        └──────────────────┘
       │                │ │   server-only + Bearer     │ │
       │                │ └────────────────────────────┘ │        a troca não toca
       └────────────────┤ Server Actions                 │        em nenhuma tela
        HTML renderizado└────────────────────────────────┘
        sem token, sem
        URL da API
```

O `proxy.ts` é só uma checagem barata de presença de cookie. A autorização real acontece na
DAL, que é reexecutada por Server Actions e Route Handlers porque cada um é um ponto de
entrada independente e invocável diretamente.

```ts
// lib/api/client.ts
import 'server-only'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken()          // do cookie httpOnly
  const res = await fetch(`${process.env.API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json',
               ...(token && { Authorization: `Bearer ${token}` }),
               ...init?.headers },
    cache: 'no-store',                          // dado administrativo é sempre fresco
  })
  if (!res.ok) throw await toApiError(res)      // lê o corpo padronizado da API
  return res.status === 204 ? (undefined as T) : res.json()
}
```

```ts
// lib/dal.ts
import 'server-only'
import { cache } from 'react'

export const verifySession = cache(async () => {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
})
```

O `cache()` do React evita revalidar a sessão várias vezes na mesma renderização.

---

## 3. Mapa completo das rotas

```text
src/app/
├── (public)/
│   └── login/page.tsx                                   1  Login
├── (app)/                                               shell autenticado
│   ├── layout.tsx                                       menu + cabeçalho + breadcrumbs
│   ├── dashboard/page.tsx                               2  Painel de indicadores      P1
│   ├── users/
│   │   ├── page.tsx                                     3  Lista de usuários
│   │   ├── new/page.tsx                                 4  Novo usuário
│   │   └── [userId]/edit/page.tsx                       5  Editar usuário
│   ├── clients/
│   │   ├── page.tsx                                     6  Lista de clientes
│   │   ├── new/page.tsx                                 7  Novo cliente
│   │   ├── [clientId]/edit/page.tsx                     8  Editar cliente
│   │   └── [clientId]/sites/page.tsx                    9  Locais do cliente
│   ├── sites/
│   │   ├── page.tsx                                    10  Lista de locais
│   │   ├── new/page.tsx                                11  Novo local
│   │   ├── [siteId]/edit/page.tsx                      12  Editar local
│   │   └── [siteId]/equipment/page.tsx                 13  Equipamentos do local
│   ├── equipment/
│   │   ├── page.tsx                                    14  Lista de equipamentos
│   │   ├── new/page.tsx                                15  Novo equipamento
│   │   ├── [equipmentId]/page.tsx                      16  Detalhe + QR Code
│   │   ├── [equipmentId]/edit/page.tsx                 17  Editar equipamento
│   │   └── [equipmentId]/label/page.tsx                18  Etiqueta para impressão
│   ├── inspection-templates/
│   │   ├── page.tsx                                    19  Lista de modelos
│   │   ├── new/page.tsx                                20  Novo rascunho
│   │   ├── [templateId]/edit/page.tsx                  21  Construtor de checklist  ★
│   │   ├── [templateId]/preview/page.tsx               22  Prévia + publicação
│   │   └── [templateId]/versions/page.tsx              23  Histórico de versões
│   ├── inspections/
│   │   ├── page.tsx                                    24  Acompanhamento
│   │   ├── new/page.tsx                                25  Agendar inspeção         ★
│   │   ├── [inspectionId]/page.tsx                     26  Detalhe da inspeção
│   │   └── [inspectionId]/review/page.tsx              27  Revisão do checklist     ★
│   ├── non-conformities/
│   │   ├── page.tsx                                    28  Lista de não conformidades
│   │   └── [ncId]/page.tsx                             29  Detalhe da NC
│   ├── audit/page.tsx                                  30  Auditoria
│   └── forbidden/page.tsx                              31  Acesso negado (403)
├── api/
│   ├── evidence/[evidenceId]/route.ts                      entrega autorizada de imagem
│   ├── auth/refresh/route.ts                               renovação (grava cookie)
│   └── export/[resource]/route.ts                          download CSV             P1
└── proxy.ts                                                guarda de rota
```

★ As três telas caras. O construtor de checklist, o agendamento com filtro encadeado e a
revisão concentram a maior parte da complexidade do painel — e as três são testes
prioritários do documento 14.16.

Estrutura de pastas de apoio, conforme a issue #1:

```text
src/
├── features/<contexto>/     componentes, ações e schemas por feature
├── components/ui/           componentes compartilhados
├── lib/
│   ├── api/                 cliente HTTP do servidor + tipos gerados do OpenAPI
│   ├── dal.ts               camada de acesso a dados com verificação de sessão
│   └── session.ts           leitura e escrita do cookie de sessão
└── schemas/                 Zod: validação de formulário e de resposta
```

---

## 4. Fluxo de trabalho que precisa funcionar ponta a ponta

O documento 14.17 define dez condições para o painel ser considerado completo. Elas formam um
único caminho: sem cadastro não há modelo publicado, sem modelo publicado não há agendamento,
e sem agendamento não há o que revisar.

```text
  #10 #11 #12        #13 #14 #15         #16              fora do painel        #21 #22 #23
┌────────────┐     ┌────────────┐    ┌──────────────┐    ┌────────────┐     ┌──────────────┐
│ Cadastros  │────▶│  Modelo    │───▶│ Agendamento  │───▶│  Execução  │────▶│   Revisão    │
│ cliente ›  │ só  │ rascunho › │    │ gera o       │    │ app do     │     │ aprovar ou   │
│ local ›    │ativos│ publicado │    │ snapshot     │    │ técnico    │     │ reprovar     │
│ equipamento│     │            │    │              │    │            │     │              │
└────────────┘     └────────────┘    └──────────────┘    └────────────┘     └──────────────┘
                                                                ▲                   │
└──────── pré-requisito de dados ─────────────────┘             └───────────────────┘
  sem isso o agendamento não tem o que selecionar        reprovada volta ao técnico com
                                                        motivo e itens a corrigir
```

Só a caixa "Execução" fica fora do painel. Todo o resto do ciclo é construído neste
repositório.

---

## 5. Catálogo de telas

### 5.1 Acesso e shell

#### `/login` — Login &nbsp;·&nbsp; issue #6 &nbsp;·&nbsp; Sprint 2

Única rota pública. Autentica contra a API e grava a sessão em cookie `httpOnly` pelo
servidor do Next.

**Campos e componentes**

- Campo de e-mail e campo de senha com alternar visibilidade
- Marca do produto e indicação de ambiente quando não for produção
- Alerta de erro acima do formulário

**Ações**

- **Entrar** — Server Action, desabilita durante o envio

**Regras críticas**

- Credencial inválida e e-mail inexistente têm a **mesma** mensagem (AC-AUTH)
- Usuário inativo recebe orientação própria para procurar a administração (RN-001)
- Redirecionamento pós-login aceita apenas destino de mesma origem, validado no servidor —
  aceitar URL arbitrária transforma o login em redirecionador aberto
- Validação Zod no cliente **e** na Server Action, porque a action é ponto de entrada público
- Logout chama `POST /auth/logout` para revogar o refresh token e só então apaga os cookies

**Estados**: ocioso, enviando, erro de credencial, erro de rede, conta inativa

```ts
cookieStore.set('fo_at', accessToken, {
  httpOnly: true, secure: true, sameSite: 'lax', path: '/',
  maxAge: expiresIn,
})
```

---

#### `(app)/layout.tsx` — Shell administrativo &nbsp;·&nbsp; issue #2 &nbsp;·&nbsp; Sprint 1

Envolve todas as rotas autenticadas. Construir antes das telas — retrofitar navegação em
telas prontas custa mais do que construí-la primeiro.

**Componentes**

- Menu lateral recolhível com os 9 itens do documento 14.3: Dashboard, Usuários, Clientes,
  Locais, Equipamentos, Modelos de inspeção, Inspeções, Não conformidades, Auditoria
- Cabeçalho: nome, perfil, menu do usuário, ação de sair
- Faixa de ambiente quando `NEXT_PUBLIC_APP_ENV` não for produção
- Breadcrumbs derivados dos segmentos da rota
- Região de mensagens globais (toasts)
- Diálogo de confirmação único, reutilizado por todas as ações críticas

**Regras críticas**

- Layout é Server Component; só o menu recolhível e o menu do usuário são Client Components
- Item não autorizado para o perfil não é renderizado — isso é comodidade, não segurança
- Navegação por teclado no menu, com foco visível
- Utilizável em 1366×768 sem rolagem horizontal

> A faixa de ambiente não é enfeite. Sem ela, é questão de tempo até alguém aprovar uma
> inspeção de demonstração achando que está em outro ambiente.

---

#### `/forbidden` — Acesso negado &nbsp;·&nbsp; issue #7 &nbsp;·&nbsp; Sprint 2

Destino de todo 403 vindo da API. Explica o que aconteceu em vez de mostrar tela branca ou
erro técnico.

**Conteúdo**: explicação em linguagem de negócio, perfil atual do usuário, atalho de volta
para o dashboard.

**Regra crítica**: 401 e 403 são situações diferentes. 401 é sessão ausente ou inválida e
leva à renovação ou ao login; 403 é falta de permissão e vem para cá. Tratar os dois igual
manda o usuário autorizado de volta ao login sem motivo.

---

### 5.2 Cadastros operacionais

#### `/users` — Usuários &nbsp;·&nbsp; issue #9 &nbsp;·&nbsp; Sprint 2

Primeiro CRUD completo do painel. Estabelece o padrão que clientes, locais e equipamentos vão
repetir — vale investir em fazê-lo bem.

**Lista**

- Colunas: nome, e-mail, perfil, situação, última atualização
- Filtros na URL: `role`, `status`, `search`, `page`, `size`
- Paginação no servidor

**Formulário**: nome, e-mail, perfil (`ADMIN` / `SUPERVISOR` / `TECHNICIAN`), situação,
telefone opcional.

**Ações**

- **Novo usuário**, **Editar**
- **Ativar / Inativar / Bloquear** — com confirmação
- **Redefinir acesso** — fluxo controlado, com confirmação

**Regras críticas**

- O 409 de e-mail duplicado precisa aparecer **no campo de e-mail**, não em alerta genérico
  no topo. Mapear `fieldErrors` da resposta para os campos do formulário
- Campo de perfil só é renderizado para `ADMIN`, e a Server Action rejeita a alteração
  independentemente disso
- A confirmação de inativar avisa que o usuário perde acesso e as sessões ativas dele são
  encerradas (RN-008)
- Senha nunca aparece em tela, em log ou em resposta
- Após a mutação, revalidar a rota para a lista refletir a mudança

---

#### `/clients` — Clientes &nbsp;·&nbsp; issue #10 &nbsp;·&nbsp; Sprint 2

Primeiro nível da hierarquia cliente → local → equipamento. Esta tela é um exercício de
consistência com a de usuários, não uma implementação nova: deve reusar os componentes
compartilhados sem duplicação.

**Lista**: nome, documento, e-mail, telefone, situação. Busca textual e filtro por situação.

**Campos** (documento 10.5.1): nome (obrigatório), razão social, documento, e-mail, telefone.

**Ações**: **Novo cliente**, **Editar**, **Inativar** (com confirmação), **Ver locais**
(atalho na linha da tabela).

**Regras críticas**

- Inativação é lógica: o cliente continua nas inspeções históricas, mas deixa de aparecer em
  novos agendamentos (RN-013). A confirmação precisa dizer isso
- Documento é validado no formato quando informado; a ausência não bloqueia o cadastro

---

#### `/sites` e `/clients/[clientId]/sites` — Locais &nbsp;·&nbsp; issue #11 &nbsp;·&nbsp; Sprint 2

A mesma tela servida duas vezes: a rota aninhada é a listagem com o filtro de cliente
pré-aplicado pela URL.

**Campos**: cliente (obrigatório), nome, descrição, endereço, cidade, estado, CEP, latitude e
longitude opcionais, contato local (nome e telefone).

**Ações**: **Novo local**, **Editar**, **Inativar**, **Ver equipamentos**.

**Regras críticas**

- Cliente é obrigatório e **imutável após a criação**. Na edição o campo aparece somente
  leitura, e a Server Action ignora tentativa de troca (RN-009)
- Coordenadas aqui se referem ao endereço cadastrado do local; não confundir com a
  localização capturada pelo técnico durante a inspeção
- Local inativo deixa de aparecer para novo agendamento

---

#### `/equipment`, `/equipment/[id]` e `/label` — Equipamentos e etiqueta QR &nbsp;·&nbsp; issue #12 &nbsp;·&nbsp; Sprint 2

O QR Code é a ponte entre o cadastro e o campo: sem uma etiqueta impressa colada no ativo, a
leitura no aplicativo simplesmente não acontece.

**Campos**: local (obrigatório), identificação, patrimônio, número de série, fabricante,
modelo, descrição, data de instalação, QR Code (gerado se não informado), situação.

**Ações**

- **Novo equipamento**, **Editar**
- **Gerar outro QR** quando houver conflito
- **Imprimir etiqueta** — abre `/label` com CSS de impressão
- **Inativar** / **Dar baixa** — com confirmação

**Regras críticas**

- O valor do QR é opaco: **não** codificar dados do equipamento dentro dele. Um QR que carrega
  nome do cliente e patrimônio vaza informação para qualquer pessoa que aponte a câmera, e a
  RN-063 já estabelece que a leitura não autoriza acesso
- QR duplicado (409) aparece no campo do QR, com opção de gerar outro valor
- Três situações distintas: `ACTIVE`, `INACTIVE` e `DECOMMISSIONED` — a tela explica a
  diferença entre inativo e baixado
- A etiqueta precisa ser testada **impressa** e lida pelo aplicativo: QR pequeno demais não lê
  em campo
- Equipamento inativo ou baixado não aparece para novo agendamento (RN-012)

**Componentes próprios**: renderizador de QR a partir do valor; layout de etiqueta com QR,
nome do equipamento e patrimônio.

---

### 5.3 Modelos de inspeção

#### `/inspection-templates` — Lista de modelos &nbsp;·&nbsp; issue #13 &nbsp;·&nbsp; Sprint 3

Porta de entrada do construtor. A listagem precisa deixar claro o que é rascunho, o que está
publicado e qual é a versão vigente — confundir isso leva o supervisor a agendar com a versão
errada.

**Lista**: título, categoria, situação, versão vigente, atualizado em. Busca e filtros por
situação e categoria.

**Ações**: **Novo modelo** (título, descrição, categoria; abre direto no construtor),
**Editar**, **Prévia**, **Versões**, **Inativar**.

**Regras críticas**

- Situação comunicada por rótulo textual junto do indicador visual, nunca só por cor
- Categoria é obrigatória já na criação do rascunho (RN-015)
- A confirmação de inativar informa que inspeções existentes não são afetadas (RN-022)

---

#### `/inspection-templates/[templateId]/edit` — Construtor de checklist ★ &nbsp;·&nbsp; issue #14 &nbsp;·&nbsp; Sprint 3

A tela mais complexa do painel (documento 14.8). Monta seções e itens, define tipo de
resposta, obrigatoriedade e regras de evidência.

**Estrutura da tela**

- Cabeçalho editável: título, descrição, categoria
- Lista de seções, cada uma expansível com seus itens
- Editor de item com campos que mudam conforme o tipo
- Indicador de salvamento por operação

**Ações**

- **Adicionar seção** / **Editar** / **Excluir**
- **Adicionar item** / **Editar** / **Excluir**
- **Mover para cima** / **Mover para baixo**, em seções e itens
- **Ir para prévia**

**Configuração por tipo de resposta**

| Tipo                        | Configuração adicional                         |
| --------------------------- | ---------------------------------------------- |
| `TEXT_SHORT` / `TEXT_LONG`  | tamanho máximo                                 |
| `NUMBER`                    | faixa mínima e máxima opcionais                |
| `BOOLEAN`                   | —                                              |
| `CONFORMITY`                | exigir observação e evidência na falha         |
| `SINGLE_CHOICE`             | lista de opções, mínimo duas                   |
| `DATE`                      | —                                              |

**Regras críticas**

- Arrastar e soltar é desejável mas **não obrigatório**. Entregar com botões de mover
  primeiro — o documento 14.8 autoriza explicitamente essa simplificação, e o item 16.7 lista
  "simplificar o construtor sem arrastar e soltar" como a quarta redução de escopo em caso de
  atraso
- A reordenação envia a lista completa na nova ordem, em **uma única chamada**. Enviar uma
  chamada por item produz estados intermediários inconsistentes se a rede falhar no meio
- Campo que não se aplica ao tipo não é exibido. Oferecer "exigir evidência na falha" para um
  item de data confunde e gera configuração inválida que só aparece na publicação
- Trocar o tipo com configuração já preenchida avisa que ela será perdida
- Modelo publicado abre em modo leitura, com a ação de criar nova versão (RN-019)
- Formulário longo: alterar um item não pode reprocessar a árvore inteira de itens

---

#### `/preview` e `/versions` — Prévia, publicação e versões &nbsp;·&nbsp; issue #15 &nbsp;·&nbsp; Sprint 3

A prévia é o único momento em que o supervisor vê o checklist como o técnico verá. Publicar
sem essa conferência costuma revelar problemas só em campo, quando corrigir exige nova versão
e novo agendamento.

**Prévia**: seções e itens na ordem definida, com o componente real de cada tipo de resposta,
em modo somente leitura. Quanto mais fiel à tela do aplicativo, mais útil ela é.

**Painel de pendências** antes de publicar — lista completa, com link para o ponto exato:

```text
- Seção "Sistema elétrico" não possui itens
- Item "Número do patrimônio" não possui tipo de resposta
- Item "Condição do lacre" é SINGLE_CHOICE com apenas uma opção
```

**Histórico de versões**: número, autor, data de publicação e se aceita novos agendamentos,
com consulta ao conteúdo de cada versão. Sem essa consulta é impossível entender por que uma
inspeção antiga tem perguntas diferentes.

**Ações**: **Publicar versão** (confirmação explica que ficará imutável), **Criar nova versão**
(abre rascunho pré-preenchido com o conteúdo vigente).

**Regras críticas**

- Validar no cliente antecipa o retorno, mas a decisão é do endpoint de publicação: quando a
  API devolver 422, exibir as pendências que ela retornou
- Publicação válida cria a versão e exibe o número gerado

---

### 5.4 Planejamento e acompanhamento

#### `/inspections/new` — Agendar inspeção ★ &nbsp;·&nbsp; issue #16 &nbsp;·&nbsp; Sprint 3

O filtro encadeado é um dos testes prioritários do documento 14.16. Ele evita que o supervisor
monte uma combinação inválida — e, mais importante, evita agendar inspeção no equipamento
errado, erro que só aparece com o técnico já em campo.

**Campos, em ordem**: modelo e versão publicada · cliente → local → equipamento (encadeados) ·
técnico responsável · supervisor · data prevista · prioridade · instruções.

**Comportamento do encadeamento**

```text
Cliente selecionado   -> carrega locais daquele cliente (somente ativos)
Local selecionado     -> carrega equipamentos daquele local (somente ativos)
Trocar o cliente      -> limpa local e equipamento
Trocar o local        -> limpa equipamento
```

> Limpar o campo dependente ao trocar o pai é obrigatório. Sem isso o formulário mantém um
> equipamento que não pertence mais ao local escolhido, o usuário não percebe, e a API rejeita
> com um erro que parece sem sentido.

**Ações**: **Agendar e atribuir** (redireciona ao detalhe deixando visível que o snapshot foi
gerado), **Cancelar**.

**Regras críticas**

- Somente registros ativos aparecem nos seletores — não listados, e não apenas desabilitados
  (RN-012, RN-013, RN-027)
- Somente versões publicadas com `active_for_new_inspections` aparecem no seletor de modelo
  (RN-024)
- Equipamento é obrigatório, exceto quando o modelo for de inspeção de local ou ambiente
  (RN-026)
- Data prevista obrigatória, com aviso ao escolher data passada, sem bloquear
- Prioridade entre `LOW`, `MEDIUM`, `HIGH` e `CRITICAL`
- Erro da API mapeado para o campo: local incompatível com o cliente marca o campo de local

---

#### `/inspections` — Acompanhamento &nbsp;·&nbsp; issue #17 &nbsp;·&nbsp; Sprint 4

Tela de trabalho diário do supervisor. É aqui que o estado precisa mudar sozinho depois que o
técnico sincroniza — o AC-ADMIN-MONITOR exige exatamente isso, sem manipulação direta do banco.

**Colunas** (documento 14.10): identificador ou título, cliente, local, equipamento, técnico,
prioridade, data prevista, estado, progresso, última atualização, indicação de atraso.

**Filtros**: texto, estado, técnico, cliente, prioridade, período. Mais os dois atalhos
rápidos mais usados — **Atrasadas** e **Aguardando revisão** — todos refletidos na URL para
poderem ser salvos como favorito.

**Ações**: **Nova inspeção**; **Abrir detalhe** e **Revisar** por linha.

**Regras críticas**

- Estado e atraso comunicados por texto, não apenas por cor
- Progresso com valor numérico visível: respondidos sobre aplicáveis (RN-040)
- Paginação no servidor; leituras com `cache: 'no-store'` para refletir a sincronização
- Tabela larga define prioridade de colunas em telas menores, em vez de gerar rolagem
  horizontal da página inteira

---

#### `/inspections/[inspectionId]` — Detalhe da inspeção &nbsp;·&nbsp; issues #18 e #24 &nbsp;·&nbsp; Sprint 4

Reúne planejamento, execução e histórico. É onde o cancelamento acontece e onde a linha do
tempo explica o fluxo offline.

**Seções da tela**

- Cabeçalho: cliente, local, equipamento, técnico, prioridade, prazo, estado
- Execução: horários de dispositivo **e** de servidor lado a lado
- Localização registrada, com precisão e horário
- Progresso e resultado
- Bloco de não conformidades
- Linha do tempo de estados, vinda de `GET /inspections/{id}/history`

**Ações condicionais ao estado**

- **Editar planejamento** — só antes do início da execução
- **Cancelar** — diálogo com motivo obrigatório; o botão fica indisponível enquanto o motivo
  estiver vazio
- **Revisar** — só em `SUBMITTED` ou `UNDER_REVIEW`

**Regras críticas**

- Mostrar apenas um dos dois horários esconde justamente a informação que explica o fluxo
  offline: a inspeção foi executada às 10h e recebida às 16h
- Inspeção aprovada não oferece a ação de cancelar (RN-030)
- Botão que aparece e depois falha com 409 é pior do que botão ausente
- Ações da linha do tempo em linguagem de negócio: "Inspeção enviada", nunca
  `INSPECTION_SUBMITTED`

Formato da linha do tempo, conforme o documento 10.12.1:

```text
08:00 — Inspeção criada            08:50 — Inspeção concluída no dispositivo
08:05 — Atribuída ao técnico       09:15 — Sincronização confirmada
08:12 — Técnico iniciou            09:40 — Supervisor iniciou a revisão
08:20 — Resposta registrada        09:50 — Supervisor solicitou correção
08:23 — Fotografia capturada       11:20 — Técnico enviou a correção
08:30 — Não conformidade criada    12:00 — Supervisor aprovou
```

---

### 5.5 Evidências e não conformidades

#### Galeria de evidências e `/api/evidence/[evidenceId]` &nbsp;·&nbsp; issue #19 &nbsp;·&nbsp; Sprint 5

A fotografia é a evidência principal do MVP e é o que o supervisor usa para decidir aprovar ou
reprovar. As imagens não têm URL pública: um Route Handler valida a sessão e repassa o binário
da API.

```text
GET /api/evidence/[id]  ->  verifica sessão -> busca na API Spring -> devolve o binário
```

**Componentes**: miniatura na listagem e resolução integral só na ampliação; visualizador com
descrição, horário de captura e coordenadas; indicador de "aguardando upload" para evidência
pendente.

**Regras críticas**

- Cada foto aparece junto da pergunta e da resposta correspondentes, nunca em galeria solta.
  Uma galeria separada obriga o supervisor a adivinhar a qual item a foto se refere
- Usuário de outro escopo não acessa a imagem pela URL direta
- Carregar dezenas de fotos em tamanho original trava a tela de revisão
- Evidência com metadados recebidos e arquivo pendente aparece com indicação própria, em vez
  de imagem quebrada
- Evidência de inspeção aprovada é somente leitura: nenhuma ação de exclusão é oferecida
  (RN-049)

---

#### `/non-conformities` e `/[ncId]` — Não conformidades &nbsp;·&nbsp; issue #20 &nbsp;·&nbsp; Sprint 5

No MVP a não conformidade é registrada e consultada, mas não tratada — o plano de ação é P2
(documento 14.12).

**Lista**: filtros por criticidade, cliente e período. Ordenação padrão por criticidade
decrescente, para que o mais grave apareça primeiro.

**Detalhe**: descrição, evidências e o contexto do achado — a pergunta, a resposta e a
observação que originaram a não conformidade.

**Regras críticas**

- Criticidade (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) comunicada por rótulo textual além do
  indicador visual
- `status` tem um único valor no MVP (`OPEN`) — não construir interface de mudança de estado
  que a API ainda não suporta
- Sem o encadeamento até o item, o supervisor precisa procurar o achado manualmente

---

### 5.6 Revisão e decisão

#### `/inspections?status=SUBMITTED` — Fila de revisão &nbsp;·&nbsp; issue #21 &nbsp;·&nbsp; Sprint 7

Entrada do fluxo de revisão. Sem uma fila dedicada, o supervisor precisa filtrar manualmente a
listagem geral toda vez, e inspeções enviadas ficam paradas sem que ninguém perceba.

**Conteúdo**: inspeções em `SUBMITTED` e `UNDER_REVIEW`, ordenadas por maior tempo de espera;
tempo desde o envio em linguagem natural ("há 2 dias"), com a data completa disponível no
`title` do elemento; quem iniciou a revisão, quando já iniciada.

**Regras críticas**

- Supervisor vê as inspeções sob sua responsabilidade; administrador enxerga todas (RN-005)
- Mostrar quem iniciou evita dois supervisores revisando a mesma inspeção em paralelo
- Fila vazia é um bom resultado: o estado vazio celebra em vez de parecer erro

---

#### `/inspections/[inspectionId]/review` — Revisão do checklist ★ &nbsp;·&nbsp; issues #22 e #23 &nbsp;·&nbsp; Sprint 7

Tela onde a decisão acontece. O documento 14.11 faz uma exigência explícita: a interface não
pode permitir que o supervisor edite silenciosamente a resposta original do técnico.

**Estrutura**

- Cabeçalho com inspeção, técnico e horários de dispositivo e servidor
- Índice lateral ou navegação por seções, para checklists longos
- Por item: pergunta, resposta, observação e evidências vinculadas
- Localização registrada no início e na conclusão
- Não conformidades relacionadas
- Histórico de revisões anteriores

**Ações**

- **Iniciar revisão** (`begin-review`) — muda o estado para `UNDER_REVIEW` e sinaliza aos
  demais supervisores
- **Aprovar** — confirmação, comentário opcional
- **Reprovar** — motivo obrigatório mais seleção dos itens que precisam de correção
- **Pular para o próximo não conforme**

**Regras críticas**

- Somente leitura, sempre. Nenhum campo de resposta é editável (RN-084) — o supervisor comenta
  e decide, não corrige. Um campo editável aqui destruiria a rastreabilidade
- Os textos vêm do snapshot, nunca do template atual (RN-021)
- Reprovar com motivo vazio ou só com espaços é recusado, e a Server Action valida de novo —
  botão desabilitado não é barreira
- Itens não conformes vêm pré-marcados na seleção de correção. Essa lista vira a instrução que
  o técnico recebe no aplicativo: quanto mais precisa, menos rodadas de correção
- Ausência de localização é apresentada como informação, não como erro: a permissão pode ter
  sido negada legitimamente (RN-059)
- Após a decisão, informar que o técnico receberá a atualização na próxima sincronização — a
  mudança não é instantânea no aparelho
- Duplo clique não envia a decisão duas vezes: a ação fica em processamento até a resposta

Exemplo de motivo útil, do documento 12.14:

```text
"A fotografia do item 4 não permite identificar o número de série."
```

---

#### `/audit` — Auditoria &nbsp;·&nbsp; issue #24 &nbsp;·&nbsp; Sprint 7

Permite reconstruir o que aconteceu com uma inspeção sem abrir o banco.

**Conteúdo**: filtros por período, autor, tipo de entidade e ação; colunas de horário, autor,
ação, entidade e identificador; paginação no servidor.

**Regras críticas**

- Ações exibidas em linguagem de negócio, não como enum técnico
- Somente leitura: nenhuma ação de edição ou exclusão de evento (RN-088)
- Acesso respeita o perfil

---

#### `/dashboard` — Painel de indicadores &nbsp;·&nbsp; issue #28 &nbsp;·&nbsp; P1, pós-MVP

O item 16.7 do roadmap coloca "remover dashboard avançado" como a **primeira** redução de
escopo em caso de atraso — por isso ele é P1. Um resumo simples pode entrar antes.

**Cartões** (documento 14.5): total de inspeções por estado; inspeções atrasadas; aguardando
revisão; não conformidades por criticidade; atalhos para criar inspeção e revisar pendências.

**Regras críticas**

- Cada número é um link para a listagem com o filtro correspondente já aplicado
- A definição de atraso é a **mesma** da listagem — divergência entre os dois números destrói
  a confiança na tela inteira
- Sem gráfico onde um número resolve: cartões de contagem são mais úteis que uma pizza de
  cinco fatias

---

## 6. Inventário de componentes compartilhados

Sete das telas acima são listagens paginadas e filtradas com a mesma anatomia. A issue #4
existe justamente para que não sejam sete implementações divergentes. Construir esta camada
antes das telas de negócio é o que decide se o painel fica coerente.

| Componente                        | Responsabilidade                                                          | Usado em                                       |
| --------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------- |
| `DataTable`                       | Colunas tipadas, ordenação, prioridade de coluna em tela estreita          | 7 listagens                                    |
| `Pagination`                      | Ligada aos parâmetros `page`, `size` e `sort` da API                       | todas as listagens                             |
| `FilterBar`                       | Estado dos filtros sincronizado com a URL, não com `useState`              | todas as listagens                             |
| `SearchInput`                     | Busca textual com debounce, escrevendo na URL                              | 6 telas                                        |
| `StatusBadge`                     | Selo de situação com rótulo textual — nunca só cor                         | usuários, cadastros, modelos, inspeções        |
| `SeverityBadge`                   | Criticidade `LOW` → `CRITICAL`, com texto                                  | não conformidades                              |
| `PriorityBadge`                   | Prioridade da inspeção                                                     | acompanhamento, detalhe                        |
| `ProgressIndicator`               | Proporção respondidos/aplicáveis com número visível                        | acompanhamento, detalhe, revisão               |
| `OverdueFlag`                     | Indicação de atraso, com texto                                             | acompanhamento, fila, dashboard                |
| `ConfirmDialog`                   | Diálogo único, com foco preso e fechamento por Escape                      | publicar, cancelar, inativar, aprovar, reprovar|
| `FormField`                       | Rótulo associado, erro por `aria-describedby`, texto de ajuda              | todos os formulários                           |
| `SubmitButton`                    | Desabilita e mostra progresso durante o envio, evitando duplo clique       | todos os formulários                           |
| `EntitySelect`                    | Seletor assíncrono que lista apenas registros ativos                       | agendamento, locais, equipamentos              |
| `ChainedSelects`                  | Cliente → Local → Equipamento, limpando os dependentes                     | agendamento                                    |
| `DateField` / `DateRangeField`    | Data prevista e filtros por período                                        | agendamento, acompanhamento, auditoria         |
| `LoadingState`                    | Esqueleto via `loading.tsx` e Suspense, não spinner de página inteira      | todas as telas de dados                        |
| `EmptyState`                      | Lista vazia com orientação do próximo passo — nunca mensagem de erro       | todas as listagens                             |
| `ErrorState`                      | Variantes: rede, autorização, erro interno                                 | todas as telas de dados                        |
| `Toast`                           | Confirmação de sucesso e avisos globais                                    | shell                                          |
| `Breadcrumbs`                     | Derivados do segmento de rota, com rótulo legível                          | shell                                          |
| `SideNav`                         | 9 itens, destaque da rota ativa, filtragem por perfil                      | shell                                          |
| `EnvironmentBanner`               | Faixa visível quando o ambiente não é produção                             | shell, login                                   |
| `Timeline`                        | Autor, ação e horários de dispositivo e servidor                           | detalhe da inspeção, auditoria                 |
| `QrCodeView` / `LabelSheet`       | Renderiza o QR e o layout de etiqueta com CSS de impressão                 | equipamentos                                   |
| `EvidenceThumb` / `EvidenceViewer`| Miniatura e ampliação com metadados, servidas por rota autorizada          | revisão, detalhe, NC                           |
| `ChecklistRenderer`               | Renderiza os 7 tipos de resposta em modo leitura                           | prévia do modelo, revisão                      |

---

## 7. Contrato de domínio

Extraídos do documento 10. Devem virar um único módulo de tipos no início do projeto, com os
rótulos em português centralizados — nenhuma tela traduz enum por conta própria.

```text
UserRole          ADMIN · SUPERVISOR · TECHNICIAN
UserStatus        ACTIVE · INACTIVE · BLOCKED
ClientStatus      ACTIVE · INACTIVE
SiteStatus        ACTIVE · INACTIVE
EquipmentStatus   ACTIVE · INACTIVE · DECOMMISSIONED
TemplateStatus    DRAFT · ACTIVE · INACTIVE
ResponseType      TEXT_SHORT · TEXT_LONG · NUMBER · BOOLEAN · CONFORMITY · SINGLE_CHOICE · DATE
InspectionStatus  DRAFT · ASSIGNED · IN_PROGRESS · SUBMITTED · UNDER_REVIEW · APPROVED · REJECTED · CANCELED
Priority          LOW · MEDIUM · HIGH · CRITICAL
Conformity        NOT_APPLICABLE · CONFORMING · NON_CONFORMING
Severity          LOW · MEDIUM · HIGH · CRITICAL
NcStatus          OPEN                    (valor único no MVP)
ReviewDecision    APPROVED · REJECTED
EvidenceType      PHOTO                   (valor único no MVP)
```

O envelope de erro da API é fixo e vale para todas as telas (documento 12.2):

```json
{
  "timestamp": "2026-08-01T14:30:00Z",
  "status": 422,
  "code": "INSPECTION_REQUIRED_ITEMS_MISSING",
  "message": "A inspeção possui itens obrigatórios sem resposta.",
  "path": "/api/v1/inspections/{id}/submit",
  "requestId": "req-123",
  "fieldErrors": [
    { "field": "responses", "message": "Existem 2 itens obrigatórios pendentes." }
  ]
}
```

É o `fieldErrors` que permite levar a mensagem ao campo certo em vez de um alerta genérico no
topo. Tratá-lo desde a primeira tela evita refazer todos os formulários depois.

---

## 8. Padrões obrigatórios em toda tela

### 8.1 Os nove estados do documento 14.15

Carregando · sucesso com dados · sucesso sem dados · erro de validação · erro de autorização ·
erro de rede · erro interno · ação em processamento · confirmação de sucesso.

Cada um tem componente próprio, com mensagem em linguagem de negócio. A issue #26 audita isso
tela a tela ao final, com uma planilha onde célula vazia é trabalho pendente — sai muito mais
barato tratar desde o começo.

**"Sucesso sem dados" não é erro.** Lista vazia mostra estado vazio com orientação do próximo
passo, e não uma mensagem de falha.

### 8.2 Acessibilidade mínima

```text
[ ] navegação completa por teclado, com foco sempre visível
[ ] rótulo associado a cada campo de formulário
[ ] erro associado ao campo por aria-describedby
[ ] contraste suficiente em texto e indicadores de estado
[ ] estado nunca comunicado apenas por cor
[ ] diálogo com foco preso e fechável por Escape
[ ] hierarquia de títulos coerente
```

### 8.3 Linguagem de negócio

O usuário lê "Este e-mail já está cadastrado", nunca `EMAIL_ALREADY_EXISTS` nem
"Request failed with status code 409". Vale para mensagens de erro, rótulos de estado e
eventos da linha do tempo.

### 8.4 Confirmação de ação crítica

Publicar modelo, cancelar inspeção, inativar registro, aprovar e reprovar passam pelo mesmo
`ConfirmDialog`, sempre explicando o efeito. E a validação se repete na Server Action: botão
escondido ou desabilitado nunca é a barreira.

### 8.5 Filtros na URL, paginação no servidor

```text
/inspections?status=SUBMITTED&technicianId=uuid&page=0&size=20&sort=scheduledFor,asc
```

A tela vira link compartilhável, sobrevive ao recarregamento e o Server Component lê os
filtros direto de `searchParams`, buscando só o necessário. Filtro em estado local obriga a
buscar tudo no cliente e quebra a paginação no servidor (RNF-003).

### 8.6 Resolução alvo

Notebook e desktop: 1366×768 e 1920×1080 (RNF-007). Nenhuma página rola horizontalmente;
tabelas largas rolam dentro do próprio container.

---

## 9. Ordem de ataque

As fases seguem as dependências declaradas nas próprias issues. **As três primeiras não
dependem de nenhum endpoint real e podem começar hoje.**

### Fase 1 — Bootstrap e fundação · issues #1 e #5

Projeto Next.js 16 com TypeScript estrito e `noUncheckedIndexedAccess`, estrutura de pastas
por feature, variáveis de ambiente separadas por exposição, ADR da escolha do Next no
repositório `docs`, CI com `npm ci` + lint + `tsc --noEmit` + testes + build.

`npm ci` e não `npm install`: instala exatamente o lockfile. E `tsc --noEmit` é passo separado,
porque o build do Next pode ser configurado para ignorar erro de tipo.

### Fase 2 — Contrato e mock antes das telas · parte da issue #3

Escrever os tipos e os enums a partir do documento 12, montar o handler MSW para os endpoints
do MVP e um conjunto de dados de exemplo coerente: um cliente com locais, equipamentos, um
modelo publicado e inspeções em vários estados. Esse dado de exemplo é o que sustenta o
desenvolvimento das próximas semanas.

### Fase 3 — Shell e componentes compartilhados · issues #2 e #4

Layout autenticado, menu, breadcrumbs, faixa de ambiente, `ConfirmDialog` e o kit de tabela,
filtros, paginação e os nove estados. Provar com duas telas reais que os componentes servem
sem duplicação, como pede o critério da #4.

### Fase 4 — Sessão e autorização · issues #6, #7 e #8

Login com cookie `httpOnly`, `proxy.ts`, DAL com `verifySession()`, renovação com repetição
única e página de acesso negado. Contra o mock primeiro; quando `backend#6` sair, só muda a
origem.

A renovação repete a operação original **no máximo uma vez** — sem esse limite, um 401
persistente vira laço infinito. E chamadas paralelas expirando juntas precisam compartilhar a
mesma promessa de renovação, porque refresh tokens rotativos são invalidados se usados em
paralelo.

### Fase 5 — Cadastros · issues #9 a #12

Usuários, clientes, locais e equipamentos com QR e etiqueta. Quatro telas com a mesma
anatomia — se a fase 3 foi bem feita, esta é rápida.

### Fase 6 — Modelos e agendamento · issues #13 a #16

Lista de modelos, construtor com botões de mover, prévia com painel de pendências, publicação
e o formulário de agendamento com filtro encadeado. É o trecho mais caro do painel.

### Fase 7 — Acompanhamento, evidências e revisão · issues #17 a #24

Listagem de inspeções, detalhe com linha do tempo, galeria autorizada de evidências, não
conformidades, fila de revisão e as ações de aprovar e reprovar.

### Fase 8 — Qualidade e publicação · issues #25, #26 e #27

Os onze testes prioritários do documento 14.16 com a API simulada em nível de rede, auditoria
de estados e acessibilidade tela a tela, build de produção e publicação com verificação
pós-deploy.

**Cobertura obrigatória de teste** (documento 14.16):

```text
 1 proteção de rota sem sessão
 2 permissões por perfil (item de menu e ação)
 3 validação de formulário
 4 filtro encadeado cliente -> local -> equipamento
 5 criação de modelo
 6 bloqueio de publicação inválida
 7 criação de inspeção
 8 apresentação dos estados de tela
 9 aprovação
10 motivo obrigatório na reprovação
11 tratamento de erro da API (401, 403, 409, 422)
```

---

## 10. Escopo mínimo de entrega

O documento 14.17 considera a interface administrativa completa no MVP quando:

1. o administrador gerencia usuários;
2. o supervisor cadastra ou seleciona cliente, local e equipamento;
3. o supervisor cria e publica um modelo;
4. o supervisor agenda e atribui uma inspeção;
5. a inspeção aparece no acompanhamento;
6. o supervisor visualiza o resultado sincronizado;
7. as fotografias estão vinculadas aos itens;
8. as não conformidades são apresentadas;
9. o supervisor aprova ou reprova;
10. a decisão é refletida no aplicativo após a sincronização.

---

## Referências

- [09 — Regras de negócio](https://github.com/FieldOps-Project/docs/blob/main/notion/09-regras-de-negocio.md)
- [10 — Modelo de dados](https://github.com/FieldOps-Project/docs/blob/main/notion/10-modelo-de-dados.md)
- [11 — Arquitetura](https://github.com/FieldOps-Project/docs/blob/main/notion/11-arquitetura.md)
- [12 — API REST](https://github.com/FieldOps-Project/docs/blob/main/notion/12-api-rest.md)
- [14 — Interface administrativa web](https://github.com/FieldOps-Project/docs/blob/main/notion/14-interface-administrativa-web.md)
- [15 — Backlog do produto](https://github.com/FieldOps-Project/docs/blob/main/notion/15-backlog-do-produto.md)
- [18 — Definition of Done](https://github.com/FieldOps-Project/docs/blob/main/notion/18-definicao-de-pronto-definition-of-done.md)
