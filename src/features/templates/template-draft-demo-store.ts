import 'server-only'

import { DemoTemplateError, demoTemplateId, touchDemoTemplate } from '@/features/templates/template-demo-store'
import type {
  ItemInput,
  ResponseType,
  SectionInput,
  TemplateItem,
  TemplateSection,
  TemplateVersionSummary,
} from '@/lib/domain/template-builder'

/**
 * Rascunhos e versoes dos modelos de demonstracao, com a mesma memoria da
 * listagem: o que o construtor salvar fica guardado ate o servidor de
 * desenvolvimento reiniciar. Modelo criado na demonstracao comeca sem secoes.
 *
 * "Inspeção de Máquinas Pesadas" reproduz o modelo do desenho do construtor no
 * Stitch, para a tela poder ser comparada com ele.
 */
const DEMO_PUBLISHER = 'a0000000-0000-4000-8000-000000000090'

function sectionId(template: number, section: number): string {
  return `e1000000-0000-4000-8000-${String(template).padStart(4, '0')}${String(section).padStart(8, '0')}`
}

function itemId(template: number, section: number, item: number): string {
  return `e2000000-0000-4000-8000-${String(template).padStart(3, '0')}${String(section).padStart(3, '0')}${String(item).padStart(6, '0')}`
}

type ItemSeed = {
  readonly title: string
  readonly type: ResponseType
  readonly description?: string
  readonly required?: boolean
  readonly observation?: boolean
  readonly evidence?: boolean
  readonly options?: readonly string[]
}

type SectionSeed = { readonly title: string; readonly items: readonly ItemSeed[] }

const DRAFT_SEEDS: Readonly<Record<number, readonly SectionSeed[]>> = {
  1: [
    {
      title: 'Filtros e gabinete',
      items: [
        { title: 'Painéis externos fixos e sem avarias', type: 'CONFORMITY', required: true, observation: true },
        { title: 'Integridade do alojamento do filtro', type: 'CONFORMITY', required: true, observation: true, evidence: true },
      ],
    },
    {
      title: 'Motor e ventilação',
      items: [
        { title: 'Corrente do motor (A)', type: 'NUMBER', required: true },
        { title: 'Vibração dentro da tolerância?', type: 'BOOLEAN', required: true, evidence: true },
      ],
    },
  ],
  2: [
    {
      title: 'Condição do extintor',
      items: [
        { title: 'Lacre intacto', type: 'CONFORMITY', required: true, evidence: true },
        { title: 'Validade da carga', type: 'DATE', required: true },
        { title: 'Sinalização visível?', type: 'BOOLEAN', required: true },
      ],
    },
  ],
  3: [
    {
      title: 'Rotas de fuga',
      items: [
        { title: 'Saídas de emergência desobstruídas', type: 'CONFORMITY', required: true, observation: true },
        { title: 'Iluminação de emergência funcionando?', type: 'BOOLEAN', required: true },
      ],
    },
  ],
  4: [
    {
      title: 'Identificação do Equipamento',
      items: [
        { title: 'Número de Série (Horímetro)', type: 'NUMBER', required: true },
        { title: 'Condição dos Pneus/Esteiras', type: 'CONFORMITY', required: true, observation: true, evidence: true },
      ],
    },
    {
      title: 'Sistema Hidráulico',
      items: [
        { title: 'Nível do óleo hidráulico dentro da faixa', type: 'CONFORMITY', required: true, observation: true },
        { title: 'Vazamento visível nas mangueiras?', type: 'BOOLEAN', required: true, evidence: true },
        { title: 'Estado geral das mangueiras', type: 'SINGLE_CHOICE', required: true, options: ['Bom', 'Regular', 'Ruim'] },
      ],
    },
    {
      title: 'Segurança e Cabine',
      items: [
        { title: 'Cinto de segurança funcional', type: 'CONFORMITY', required: true },
        { title: 'Data da última manutenção', type: 'DATE' },
        { title: 'Observações do operador', type: 'TEXT_LONG', description: 'Anote ruídos, folgas ou alertas do painel.' },
      ],
    },
  ],
  5: [
    {
      title: 'Proteções da prensa',
      items: [
        { title: 'Proteções fixas instaladas', type: 'CONFORMITY', required: true, observation: true },
        { title: 'Botão de parada de emergência acessível?', type: 'BOOLEAN', required: true },
      ],
    },
  ],
  6: [
    {
      title: 'Quadro geral',
      items: [{ title: 'Identificação dos circuitos', type: 'CONFORMITY', required: true }],
    },
  ],
}

/** Versoes publicadas por modelo de demonstracao: numero e data. */
const VERSION_SEEDS: Readonly<Record<number, readonly (readonly [number, string])[]>> = {
  1: [
    [3, '2026-10-28T13:10:00Z'],
    [2, '2026-08-14T12:00:00Z'],
    [1, '2026-05-02T12:00:00Z'],
  ],
  2: [
    [2, '2026-10-20T17:45:00Z'],
    [1, '2026-06-10T12:00:00Z'],
  ],
  3: [[1, '2026-10-02T11:00:00Z']],
  4: [
    [2, '2026-10-12T14:00:00Z'],
    [1, '2026-01-01T12:00:00Z'],
  ],
  6: [[1, '2026-07-01T12:00:00Z']],
}

const TITLES: Readonly<Record<number, string>> = {
  1: 'Inspeção preventiva HVAC',
  2: 'Vistoria de extintores',
  3: 'Inspeção geral do local',
  4: 'Inspeção de Máquinas Pesadas',
  6: 'Vistoria de quadros elétricos',
}

function seedSections(template: number): TemplateSection[] {
  return (DRAFT_SEEDS[template] ?? []).map((section, sectionIndex) => {
    const id = sectionId(template, sectionIndex + 1)
    return {
      id,
      title: section.title,
      description: null,
      displayOrder: sectionIndex + 1,
      items: section.items.map(
        (item, itemIndex): TemplateItem => ({
          id: itemId(template, sectionIndex + 1, itemIndex + 1),
          sectionId: id,
          code: null,
          title: item.title,
          description: item.description ?? null,
          responseType: item.type,
          required: item.required ?? false,
          observationRequiredOnFailure: item.observation ?? false,
          evidenceRequiredOnFailure: item.evidence ?? false,
          options: item.options ?? [],
          displayOrder: itemIndex + 1,
        }),
      ),
    }
  })
}

type DraftState = {
  readonly drafts: Map<string, TemplateSection[]>
  readonly versions: Map<string, TemplateVersionSummary[]>
}

function seed(): DraftState {
  const drafts = new Map<string, TemplateSection[]>()
  const versions = new Map<string, TemplateVersionSummary[]>()

  for (const n of [1, 2, 3, 4, 5, 6]) {
    const templateId = demoTemplateId(n)
    drafts.set(templateId, seedSections(n))
    versions.set(
      templateId,
      (VERSION_SEEDS[n] ?? []).map(([versionNumber, publishedAt]) => ({
        id: `e3000000-0000-4000-8000-${String(n).padStart(6, '0')}${String(versionNumber).padStart(6, '0')}`,
        templateId,
        versionNumber,
        title: TITLES[n] ?? '',
        publishedBy: DEMO_PUBLISHER,
        publishedAt,
        activeForNewInspections: true,
      })),
    )
  }

  return { drafts, versions }
}

const globalStore = globalThis as typeof globalThis & { __fieldopsDemoTemplateDrafts?: DraftState }

export function draftState(): DraftState {
  globalStore.__fieldopsDemoTemplateDrafts ??= seed()
  return globalStore.__fieldopsDemoTemplateDrafts
}

/** Volta ao estado inicial. Usado pelos testes. */
export function resetDemoDrafts(): void {
  globalStore.__fieldopsDemoTemplateDrafts = seed()
}

/** Secoes do rascunho, em ordem, com os itens em ordem. */
export function demoDraftSections(templateId: string): readonly TemplateSection[] {
  return (draftState().drafts.get(templateId) ?? [])
    .toSorted((a, b) => a.displayOrder - b.displayOrder)
    .map((section) => ({ ...section, items: section.items.toSorted((a, b) => a.displayOrder - b.displayOrder) }))
}

/** Versoes publicadas, mais nova primeiro (como `GET /inspection-templates/{id}/versions`). */
export function demoTemplateVersions(templateId: string): readonly TemplateVersionSummary[] {
  return (draftState().versions.get(templateId) ?? []).toSorted((a, b) => b.versionNumber - a.versionNumber)
}

/*
 * Operacoes do rascunho, com as regras de ordem da API (RN-017): posicao
 * informada insere e empurra os seguintes, sem posicao vai para o fim, excluir
 * renumera de 1 a n e reordenar exige a lista completa.
 */

function sectionsOf(templateId: string): TemplateSection[] {
  return [...(draftState().drafts.get(templateId) ?? [])].sort((a, b) => a.displayOrder - b.displayOrder)
}

function save(templateId: string, sections: readonly TemplateSection[]): void {
  draftState().drafts.set(
    templateId,
    sections.map((section, index) => ({
      ...section,
      displayOrder: index + 1,
      items: section.items.map((item, itemIndex) => ({ ...item, sectionId: section.id, displayOrder: itemIndex + 1 })),
    })),
  )
  touchDemoTemplate(templateId)
}

function insertAt<T>(list: readonly T[], value: T, displayOrder: number | undefined): T[] {
  const index = displayOrder === undefined ? list.length : Math.min(Math.max(displayOrder - 1, 0), list.length)
  return [...list.slice(0, index), value, ...list.slice(index)]
}

function sameMembers(ids: readonly string[], expected: readonly string[]): boolean {
  return ids.length === expected.length && new Set(ids).size === ids.length && expected.every((id) => ids.includes(id))
}

function findSection(sections: readonly TemplateSection[], id: string): TemplateSection {
  const section = sections.find((candidate) => candidate.id === id)
  if (!section) throw new DemoTemplateError('Seção não encontrada. Ela pode ter sido removida.')
  return section
}

export function createDemoSection(templateId: string, input: SectionInput, displayOrder?: number): TemplateSection {
  const created: TemplateSection = { id: crypto.randomUUID(), ...input, displayOrder: 0, items: [] }
  save(templateId, insertAt(sectionsOf(templateId), created, displayOrder))
  return findSection(demoDraftSections(templateId), created.id)
}

export function updateDemoSection(templateId: string, id: string, input: SectionInput): TemplateSection {
  const sections = sectionsOf(templateId)
  findSection(sections, id)
  save(templateId, sections.map((section) => (section.id === id ? { ...section, ...input } : section)))
  return findSection(demoDraftSections(templateId), id)
}

export function deleteDemoSection(templateId: string, id: string): void {
  const sections = sectionsOf(templateId)
  findSection(sections, id)
  save(templateId, sections.filter((section) => section.id !== id))
}

export function reorderDemoSections(templateId: string, ids: readonly string[]): readonly TemplateSection[] {
  const sections = sectionsOf(templateId)
  if (!sameMembers(ids, sections.map((section) => section.id))) {
    throw new DemoTemplateError('A nova ordem precisa conter todas as seções, sem repetir.')
  }
  save(templateId, ids.map((id) => findSection(sections, id)))
  return demoDraftSections(templateId)
}

function itemLocation(sections: readonly TemplateSection[], itemId: string): TemplateSection {
  const section = sections.find((candidate) => candidate.items.some((item) => item.id === itemId))
  if (!section) throw new DemoTemplateError('Item não encontrado. Ele pode ter sido removido.')
  return section
}

function findItem(templateId: string, itemId: string): TemplateItem {
  const section = itemLocation(demoDraftSections(templateId), itemId)
  return section.items.find((item) => item.id === itemId) as TemplateItem
}

export function createDemoItem(templateId: string, sectionId: string, input: ItemInput, displayOrder?: number): TemplateItem {
  const sections = sectionsOf(templateId)
  const section = findSection(sections, sectionId)
  const created: TemplateItem = { id: crypto.randomUUID(), sectionId, code: null, ...input, displayOrder: 0 }
  const items = insertAt([...section.items].sort((a, b) => a.displayOrder - b.displayOrder), created, displayOrder)
  save(templateId, sections.map((candidate) => (candidate.id === sectionId ? { ...candidate, items } : candidate)))
  return findItem(templateId, created.id)
}

export function updateDemoItem(templateId: string, itemId: string, input: ItemInput): TemplateItem {
  const sections = sectionsOf(templateId)
  const owner = itemLocation(sections, itemId)
  save(
    templateId,
    sections.map((section) =>
      section.id === owner.id
        ? { ...section, items: section.items.map((item) => (item.id === itemId ? { ...item, ...input } : item)) }
        : section,
    ),
  )
  return findItem(templateId, itemId)
}

export function deleteDemoItem(templateId: string, itemId: string): void {
  const sections = sectionsOf(templateId)
  const owner = itemLocation(sections, itemId)
  save(
    templateId,
    sections.map((section) =>
      section.id === owner.id
        ? { ...section, items: [...section.items].sort((a, b) => a.displayOrder - b.displayOrder).filter((item) => item.id !== itemId) }
        : section,
    ),
  )
}

export function reorderDemoItems(templateId: string, sectionId: string, ids: readonly string[]): TemplateSection {
  const sections = sectionsOf(templateId)
  const section = findSection(sections, sectionId)
  if (!sameMembers(ids, section.items.map((item) => item.id))) {
    throw new DemoTemplateError('A nova ordem precisa conter todos os itens da seção, sem repetir.')
  }
  const items = ids.map((id) => section.items.find((item) => item.id === id) as TemplateItem)
  save(templateId, sections.map((candidate) => (candidate.id === sectionId ? { ...candidate, items } : candidate)))
  return findSection(demoDraftSections(templateId), sectionId)
}
