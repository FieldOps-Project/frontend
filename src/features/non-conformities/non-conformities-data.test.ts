import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEMO_REVIEW_ID } from '@/features/inspections/review-fixture'
import {
  loadInspectionNonConformities,
  loadNonConformity,
  loadNonConformityPage,
} from '@/features/non-conformities/non-conformities-data'
import { demoNonConformities } from '@/features/non-conformities/non-conformity-fixture'

vi.mock('server-only', () => ({}))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('not found')
  },
}))

const load = vi.fn()
const loadOptional = vi.fn()

vi.mock('@/lib/dal', () => ({
  load: (path: string, query: unknown) => load(path, query),
  loadOptional: (path: string, query: unknown) => loadOptional(path, query),
}))
vi.mock('@/features/catalog/lookups', () => ({ loadClients: async () => [] }))

const RANK = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
})

afterEach(() => {
  vi.unstubAllEnvs()
  load.mockReset()
  loadOptional.mockReset()
})

describe('demonstracao', () => {
  it('liga toda nao conformidade a uma inspecao executada (RN-052)', () => {
    const all = demoNonConformities()
    expect(all.length).toBeGreaterThan(5)
    for (const nc of all) {
      expect(nc.inspectionCode).toBeTruthy()
      expect(nc.status).toBe('OPEN')
    }
  })

  it('traz a pergunta, a resposta e a observacao de origem da inspecao em revisao', () => {
    const fromReview = demoNonConformities().filter((nc) => nc.inspectionId === DEMO_REVIEW_ID)
    expect(fromReview).toHaveLength(3)
    expect(fromReview[0]?.origin).toMatchObject({ itemCode: '1.2', answer: 'Não Conforme' })
    expect(fromReview[0]?.evidences.length).toBeGreaterThan(0)
  })
})

describe('loadNonConformityPage', () => {
  it('ordena da mais grave para a menos grave', async () => {
    const page = await loadNonConformityPage({}, 0)
    const ranks = page.content.map((nc) => RANK[nc.severity])
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
    expect(page.content[0]?.severity).toBe('CRITICAL')
  })

  it('filtra por criticidade, cliente e periodo', async () => {
    const all = demoNonConformities()
    const first = all[0]
    if (!first) throw new Error('sem dados')

    const bySeverity = await loadNonConformityPage({ severity: 'HIGH' }, 0)
    expect(bySeverity.content.every((nc) => nc.severity === 'HIGH')).toBe(true)

    const byClient = await loadNonConformityPage({ clientId: first.clientId }, 0)
    expect(byClient.content.every((nc) => nc.clientId === first.clientId)).toBe(true)

    const future = await loadNonConformityPage({ from: '2999-01-01' }, 0)
    expect(future.totalElements).toBe(0)
  })

  it('fora da demonstracao, manda os filtros e a ordem para a API', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    load.mockResolvedValue({ content: [] })

    await loadNonConformityPage({ severity: 'CRITICAL', from: '2026-11-01' }, 2)
    expect(load).toHaveBeenCalledWith('/non-conformities', expect.objectContaining({
      severity: 'CRITICAL',
      from: '2026-11-01',
      page: 2,
      sort: 'severity,desc',
    }))
  })
})

describe('leituras do detalhe', () => {
  it('abre o detalhe pelo identificador', async () => {
    const [first] = demoNonConformities()
    expect((await loadNonConformity(first?.id ?? '')).title).toBe(first?.title)
  })

  it('lista as da inspecao, a mais grave primeiro', async () => {
    const list = (await loadInspectionNonConformities(DEMO_REVIEW_ID)) ?? []
    expect(list.map((nc) => nc.severity)).toEqual(['CRITICAL', 'HIGH', 'MEDIUM'])
  })

  it('devolve nulo quando a API nao publica a listagem por inspecao', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    loadOptional.mockResolvedValue(null)
    expect(await loadInspectionNonConformities(DEMO_REVIEW_ID)).toBeNull()
  })
})
