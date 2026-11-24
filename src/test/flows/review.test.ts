import { describe, expect, it, vi } from 'vitest'

import { approveInspection, rejectInspection } from '@/features/inspections/review-actions'
import { fail, mockApi, server, signedInAs } from '@/test/api'
import { outcome, withSession } from '@/test/next'

vi.mock('server-only', () => ({}))
vi.mock('next/headers', async () => (await import('@/test/next')).nextHeaders)
vi.mock('next/navigation', async () => (await import('@/test/next')).nextNavigation)
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

/**
 * Fluxos 9 e 10 do documento 14.16: aprovacao e motivo obrigatorio na
 * reprovacao, com a API simulada na rede (contrato do documento 12.14).
 */
mockApi()

const INSPECTION_ID = '3d8dc050-54f4-4d3b-9e5d-5fdb29ae3ed5'
const ITEM_ID = 'ab18a638-1c45-4a15-a444-b4235506e912'

/** Guarda o corpo de cada chamada de escrita que chegar a API. */
async function recordWrites(path: string) {
  const { http, HttpResponse } = await import('msw')
  const bodies: unknown[] = []
  server.use(
    http.post(`http://api.test/api/v1${path}`, async ({ request }) => {
      bodies.push(await request.json())
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return bodies
}

describe('9. aprovacao', () => {
  it('supervisor aprova com comentario opcional (RN-081)', async () => {
    withSession()
    server.use(signedInAs('SUPERVISOR'))
    const bodies = await recordWrites(`/inspections/${INSPECTION_ID}/approve`)

    expect((await outcome(() => approveInspection(INSPECTION_ID, '  Tudo certo.  '))).result).toEqual({
      ok: true,
      message: 'Inspeção aprovada.',
    })
    expect(bodies).toEqual([{ comments: 'Tudo certo.' }])
  })

  it('administrador nao aprova: so o supervisor decide (RN-079)', async () => {
    withSession()
    server.use(signedInAs('ADMIN'))
    const bodies = await recordWrites(`/inspections/${INSPECTION_ID}/approve`)

    expect(await outcome(() => approveInspection(INSPECTION_ID, null))).toEqual({ redirectedTo: '/forbidden' })
    expect(bodies).toEqual([])
  })

  it('aprovacao recusada pela API (409) vira mensagem de negocio', async () => {
    withSession()
    server.use(signedInAs('SUPERVISOR'), fail('post', `/inspections/${INSPECTION_ID}/approve`, 409, 'INSPECTION_INVALID_TRANSITION'))

    const { result } = await outcome(() => approveInspection(INSPECTION_ID, null))
    expect(result).toMatchObject({ ok: false })
    expect(result?.message).not.toMatch(/INSPECTION_INVALID_TRANSITION|Technical/)
  })
})

describe('10. motivo obrigatorio na reprovacao', () => {
  it('sem motivo, bloqueia e nao chama a API (RN-080)', async () => {
    withSession()
    server.use(signedInAs('SUPERVISOR'))
    const bodies = await recordWrites(`/inspections/${INSPECTION_ID}/reject`)

    expect((await outcome(() => rejectInspection(INSPECTION_ID, '   ', [ITEM_ID]))).result).toEqual({
      ok: false,
      message: 'Informe o motivo da reprovação.',
    })
    expect(bodies).toEqual([])
  })

  it('com motivo, envia motivo e itens a corrigir', async () => {
    withSession()
    server.use(signedInAs('SUPERVISOR'))
    const bodies = await recordWrites(`/inspections/${INSPECTION_ID}/reject`)

    expect((await outcome(() => rejectInspection(INSPECTION_ID, 'Foto ilegível.', [ITEM_ID]))).result?.ok).toBe(true)
    expect(bodies).toEqual([{ reason: 'Foto ilegível.', itemsToCorrect: [ITEM_ID] }])
  })
})
