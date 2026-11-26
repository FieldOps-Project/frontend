import { render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { countReviewQueue, loadReviewQueue } from '@/features/inspections/review-queue-data'
import { ReviewQueueTable } from '@/features/inspections/review-queue-table'
import { ApiError } from '@/lib/api/errors'
import { inspectionReference } from '@/lib/domain/inspection'
import type { InspectionListItem } from '@/lib/domain/inspection-list'
import type { ReviewQueueItem } from '@/lib/domain/review-queue'

vi.mock('server-only', () => ({}))

const load = vi.fn()

vi.mock('@/lib/dal', () => ({ load: (path: string, query: unknown) => load(path, query) }))
vi.mock('@/features/catalog/lookups', () => ({ loadActiveUsers: async () => [], loadClients: async () => [] }))

const NOW = new Date('2026-11-18T12:00:00Z')

const SUBMITTED: ReviewQueueItem = {
  id: 'c0000000-0000-4000-8000-000000000100',
  title: 'Vistoria de extintores',
  clientId: 'c1',
  clientName: 'Construtora Omega',
  siteId: 's1',
  siteName: 'Obra - Torre B',
  equipmentId: null,
  equipmentName: null,
  technicianId: 't1',
  technicianName: 'João Pedro',
  priority: 'MEDIUM',
  status: 'SUBMITTED',
  scheduledFor: '2026-11-15T12:00:00Z',
  answeredItems: 15,
  applicableItems: 15,
  updatedAt: '2026-11-16T10:00:00Z',
  overdue: false,
}

const UNDER_REVIEW: ReviewQueueItem = {
  ...SUBMITTED,
  id: '7c1e2f3a-0892-4d6b-9a10-2023d0000892',
  status: 'UNDER_REVIEW',
  updatedAt: '2026-11-18T09:00:00Z',
}

function pageOf(items: readonly InspectionListItem[], totalElements = items.length) {
  return { content: items, page: 0, size: 100, totalElements, totalPages: 1, first: true, last: true }
}

afterEach(() => {
  load.mockReset()
})

describe('ReviewQueueTable', () => {
  it('mostra a ultima atualizacao em linguagem natural com a data completa no titulo', () => {
    render(<ReviewQueueTable items={[SUBMITTED]} now={NOW} canReview />)
    const table = within(screen.getByRole('table'))

    const waiting = table.getByText('Atualizada há 2 dias')
    expect(waiting).toHaveAttribute('title', expect.stringContaining('Atualizada em'))
    expect(waiting).toHaveAttribute('dateTime', SUBMITTED.updatedAt)
  })

  it('indica revisao em andamento sem inventar quem a iniciou', () => {
    render(<ReviewQueueTable items={[UNDER_REVIEW]} now={NOW} canReview />)

    expect(within(screen.getByRole('table')).getByText('Revisão em andamento')).toBeInTheDocument()
  })

  it('abre a revisao com o caminho de volta para a fila', () => {
    render(<ReviewQueueTable items={[SUBMITTED]} now={NOW} canReview />)

    expect(within(screen.getByRole('table')).getByRole('link', { name: `Revisar ${inspectionReference(SUBMITTED.id)}` })).toHaveAttribute(
      'href',
      `/inspections/${SUBMITTED.id}/review?from=queue`,
    )
  })

  it('leva quem so acompanha ao detalhe, sem a tela de decisao', () => {
    render(<ReviewQueueTable items={[SUBMITTED]} now={NOW} canReview={false} />)

    expect(within(screen.getByRole('table')).getByRole('link', { name: `Abrir ${inspectionReference(SUBMITTED.id)}` })).toHaveAttribute(
      'href',
      `/inspections/${SUBMITTED.id}`,
    )
  })
})

describe('loadReviewQueue', () => {
  it('junta enviadas e em revisao, com a atualizada ha mais tempo primeiro', async () => {
    load.mockImplementation(async (_path: string, query: { status: string }) =>
      pageOf(query.status === 'SUBMITTED' ? [SUBMITTED] : [UNDER_REVIEW]),
    )

    const page = await loadReviewQueue(0)

    expect(load).toHaveBeenCalledWith('/inspections', { status: 'SUBMITTED', page: 0, size: 100 })
    expect(load).toHaveBeenCalledWith('/inspections', { status: 'UNDER_REVIEW', page: 0, size: 100 })
    expect(page.content.map((item) => item.id)).toEqual([SUBMITTED.id, UNDER_REVIEW.id])
    expect(page.totalElements).toBe(2)
  })

  it('pagina a fila ja unida', async () => {
    load.mockImplementation(async (_path: string, query: { status: string }) =>
      pageOf(query.status === 'SUBMITTED' ? [SUBMITTED] : [UNDER_REVIEW]),
    )

    const page = await loadReviewQueue(1, 1)

    expect(page.content.map((item) => item.id)).toEqual([UNDER_REVIEW.id])
    expect(page.last).toBe(true)
  })
})

describe('countReviewQueue', () => {
  it('soma os totais das duas consultas', async () => {
    load.mockImplementation(async (_path: string, query: { status: string }) =>
      pageOf([], query.status === 'SUBMITTED' ? 3 : 2),
    )

    expect(await countReviewQueue()).toBe(5)
    expect(load).toHaveBeenCalledWith('/inspections', { status: 'SUBMITTED', page: 0, size: 1 })
  })

  it('nao derruba a listagem quando a API falha', async () => {
    load.mockRejectedValue(new ApiError({ status: 500, code: 'INTERNAL', message: '' }))

    expect(await countReviewQueue()).toBeNull()
  })
})
