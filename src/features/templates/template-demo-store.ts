import 'server-only'

import type { InspectionTemplate, NewTemplateInput, TemplateFilters, TemplateStatus } from '@/lib/domain/inspection-template'

/**
 * Modelos de demonstracao, servidos so em `NEXT_PUBLIC_APP_ENV=development`
 * enquanto a API local nao tem os endpoints de modelos.
 *
 * Diferente das outras demonstracoes, esta guarda o que a pessoa faz: o modelo
 * criado aparece na lista e abre no construtor, como aconteceria com a API. O
 * estado vive na memoria do servidor do Next (em `globalThis`, para sobreviver
 * ao recarregamento de modulos do `next dev`) e volta ao inicial quando o
 * servidor reinicia.
 *
 * A busca e o filtro de categoria seguem a regra da API: busca no titulo e na
 * descricao sem diferenciar maiusculas, categoria igual ignorando maiusculas.
 */
const DEMO_AUTHOR = 'a0000000-0000-4000-8000-000000000090'

/** Identificador do modelo de demonstracao numero `n` (1 a 6). */
export function demoTemplateId(n: number): string {
  return `e0000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

type Seed = Pick<InspectionTemplate, 'title' | 'description' | 'category' | 'status' | 'currentVersion'> & {
  readonly n: number
  readonly updatedAt: string
}

const SEEDS: readonly Seed[] = [
  { n: 1, title: 'Inspeção preventiva HVAC', description: 'Climatizadores, filtros, motores e drenos de condensado.', category: 'Climatização', status: 'ACTIVE', currentVersion: 3, updatedAt: '2026-10-28T13:10:00Z' },
  { n: 2, title: 'Vistoria de extintores', description: 'Lacre, carga, validade e sinalização dos extintores.', category: 'Combate a incêndio', status: 'ACTIVE', currentVersion: 2, updatedAt: '2026-10-20T17:45:00Z' },
  { n: 3, title: 'Inspeção geral do local', description: 'Rotas de fuga, iluminação de emergência e limpeza.', category: 'Segurança predial', status: 'ACTIVE', currentVersion: 1, updatedAt: '2026-10-02T11:00:00Z' },
  { n: 4, title: 'Inspeção de Máquinas Pesadas', description: 'Inspeção pré-operacional padrão para retroescavadeiras e tratores de esteira.', category: 'Equipamentos', status: 'ACTIVE', currentVersion: 2, updatedAt: '2026-11-06T19:30:00Z' },
  { n: 5, title: 'Checklist NR-12 para prensas', description: 'Proteções fixas, dispositivos de parada e sinalização.', category: 'Equipamentos', status: 'DRAFT', currentVersion: null, updatedAt: '2026-11-08T14:05:00Z' },
  { n: 6, title: 'Vistoria de quadros elétricos', description: null, category: 'Instalações elétricas', status: 'INACTIVE', currentVersion: 1, updatedAt: '2026-09-15T12:20:00Z' },
]

function seed(): Map<string, InspectionTemplate> {
  return new Map(
    SEEDS.map(({ n, updatedAt, ...fields }) => [
      demoTemplateId(n),
      { id: demoTemplateId(n), ...fields, createdBy: DEMO_AUTHOR, createdAt: '2026-09-01T12:00:00Z', updatedAt, version: 0 },
    ]),
  )
}

const globalStore = globalThis as typeof globalThis & { __fieldopsDemoTemplates?: Map<string, InspectionTemplate> }

function store(): Map<string, InspectionTemplate> {
  globalStore.__fieldopsDemoTemplates ??= seed()
  return globalStore.__fieldopsDemoTemplates
}

/** Volta ao estado inicial. Usado pelos testes. */
export function resetDemoTemplates(): void {
  globalStore.__fieldopsDemoTemplates = seed()
}

export function listDemoTemplates(filters: TemplateFilters = {}): readonly InspectionTemplate[] {
  const search = filters.search?.toLowerCase()
  const category = filters.category?.toLowerCase()

  return [...store().values()]
    .filter((template) => {
      if (search && !`${template.title} ${template.description ?? ''}`.toLowerCase().includes(search)) return false
      if (filters.status && template.status !== filters.status) return false
      if (category && template.category.toLowerCase() !== category) return false
      return true
    })
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function findDemoTemplate(templateId: string): InspectionTemplate | undefined {
  return store().get(templateId)
}

/** Categorias ja usadas, para sugerir no cadastro e filtrar a lista. */
export function demoTemplateCategories(): readonly string[] {
  return [...new Set([...store().values()].map((template) => template.category))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

/** Como `POST /inspection-templates`: o modelo nasce rascunho, sem versao publicada. */
export function createDemoTemplate(input: NewTemplateInput, author: string, now: Date = new Date()): InspectionTemplate {
  const created: InspectionTemplate = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    category: input.category,
    status: 'DRAFT',
    currentVersion: null,
    createdBy: author,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    version: 0,
  }
  store().set(created.id, created)
  return created
}

/** Como `PUT /inspection-templates/{id}`: titulo, descricao e categoria. */
export function updateDemoTemplate(templateId: string, input: NewTemplateInput, now: Date = new Date()): InspectionTemplate {
  const current = store().get(templateId)
  if (!current) throw new DemoTemplateError('Modelo não encontrado.')
  const changed: InspectionTemplate = { ...current, ...input, updatedAt: now.toISOString(), version: current.version + 1 }
  store().set(templateId, changed)
  return changed
}

/** Registra uma alteracao no rascunho: o modelo sobe para o topo da lista. */
export function touchDemoTemplate(templateId: string, now: Date = new Date()): void {
  const current = store().get(templateId)
  if (current) store().set(templateId, { ...current, updatedAt: now.toISOString(), version: current.version + 1 })
}

export class DemoTemplateError extends Error {}

/**
 * Como `PATCH /inspection-templates/{id}/status`: so modelo ja publicado muda
 * de situacao, e so entre publicado e inativo.
 */
export function changeDemoTemplateStatus(
  templateId: string,
  status: Extract<TemplateStatus, 'ACTIVE' | 'INACTIVE'>,
  now: Date = new Date(),
): InspectionTemplate {
  const current = store().get(templateId)
  if (!current) throw new DemoTemplateError('Modelo não encontrado.')
  if (current.currentVersion === null) {
    throw new DemoTemplateError('Publique o modelo antes de mudar a situação dele.')
  }

  const changed: InspectionTemplate = { ...current, status, updatedAt: now.toISOString(), version: current.version + 1 }
  store().set(templateId, changed)
  return changed
}
