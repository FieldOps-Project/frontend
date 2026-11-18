import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { countReviewQueue, loadReviewQueue } from '@/features/inspections/review-queue-data'
import { ReviewQueueTable } from '@/features/inspections/review-queue-table'
import { ApiError } from '@/lib/api/errors'
import type { ReviewQueueItem } from '@/lib/domain/review-queue'

vi.mock('server-only', () => ({}))

const loadOptional = vi.fn()

vi.mock('@/lib/dal', () => ({
  loadOptional: (path: string, query: unknown) => loadOptional(path, query),
  load: vi.fn(),
}))
vi.mock('@/features/catalog/lookups', () => ({ loadActiveUsers: async () => [], loadClients: async () => [] }))

const NOW = new Date('2026-11-18T12:00:00Z')

const SUBMITTED: ReviewQueueItem = {
  id: 'c0000000-0000-4000-8000-000000000100',
  code: 'INS-2023-100',
  title: 'Vistoria de extintores',
  clientName: 'Construtora Omega',
  siteName: 'Obra - Torre B',
  equipmentName: null,
  technicianName: 'João Pedro',
  supervisorName: 'Mariana Costa',
  priority: 'MEDIUM',
  status: 'SUBMITTED',
  submittedAtServer: '2026-11-16T10:00:00Z',
  reviewStartedByName: null,
  reviewStartedAt: null,
}

const UNDER_REVIEW: ReviewQueueItem = {
  ...SUBMITTED,
  id: '7c1e2f3a-0892-4d6b-9a10-2023d0000892',
  code: 'INSP-2023-0892',
  status: 'UNDER_REVIEW',
  submittedAtServer: '2026-11-18T09:00:00Z',
  reviewStartedByName: 'Roberto Lima',
  reviewStartedAt: '2026-11-18T09:30:00Z',
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'development')
})

afterEach(() => {
  vi.unstubAllEnvs()
  loadOptional.mockReset()
})

describe('ReviewQueueTable', () => {
  it('mostra a espera em linguagem natural com a data completa no titulo', () => {
    render(<ReviewQueueTable items={[SUBMITTED]} now={NOW} />)
    const table = within(screen.getByRole('table'))

    const waiting = table.getByText('Enviada há 2 dias')
    expect(waiting).toHaveAttribute('title', expect.stringContaining('Enviada em'))
    expect(waiting).toHaveAttribute('dateTime', SUBMITTED.submittedAtServer)
  })

  it('mostra quem iniciou a revisao', () => {
    render(<ReviewQueueTable items={[UNDER_REVIEW]} now={NOW} />)
    expect(within(screen.getByRole('table')).getByText('Iniciada por Roberto Lima')).toBeInTheDocument()
  })

  it('abre a revisao com o caminho de volta para a fila', () => {
    render(<ReviewQueueTable items={[SUBMITTED]} now={NOW} />)
    expect(screen.getByRole('link', { name: 'Revisar INS-2023-100' })).toHaveAttribute(
      'href',
      `/inspections/${SUBMITTED.id}/review?from=queue`,
    )
  })
})

describe('loadReviewQueue', () => {
  it('na demonstracao, traz so enviadas e em revisao, a de maior espera primeiro', async () => {
    const page = await loadReviewQueue(0)
    const items = page?.content ?? []

    expect(items.length).toBeGreaterThanOrEqual(3)
    expect(items.every((item) => item.status === 'SUBMITTED' || item.status === 'UNDER_REVIEW')).toBe(true)
    const times = items.map((item) => item.submittedAtServer)
    expect(times).toEqual(times.toSorted())
    expect(items.find((item) => item.status === 'UNDER_REVIEW')?.reviewStartedByName).toEqual(expect.any(String))
  })

  it('a contagem do atalho nao derruba a listagem quando a API falha', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    loadOptional.mockRejectedValue(new ApiError({ status: 500, code: 'INTERNAL', message: '' }))

    expect(await countReviewQueue()).toBeNull()
  })

  it('fora da demonstracao, pede o recorte e a ordem a API, que aplica o escopo do perfil', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production')
    loadOptional.mockResolvedValue(null)

    expect(await loadReviewQueue(1)).toBeNull()
    expect(loadOptional).toHaveBeenCalledWith('/inspections', {
      review: '1',
      page: 1,
      size: 20,
      sort: 'submittedAtServer,asc',
    })
  })
})
