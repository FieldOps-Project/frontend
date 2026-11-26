import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createEquipment, findEquipmentByQr, updateEquipment } from '@/features/equipment/actions'
import { capture, mockApi, ok, recordRequests, server, signedInAs } from '@/test/api'
import { form, outcome, withSession } from '@/test/next'

vi.mock('server-only', () => ({}))
vi.mock('next/headers', async () => (await import('@/test/next')).nextHeaders)
vi.mock('next/navigation', async () => (await import('@/test/next')).nextNavigation)

mockApi()

const SITE_ID = 'd0000000-0000-4000-8000-000000000101'
const EQUIPMENT_ID = 'd0000000-0000-4000-8000-000000000301'

beforeEach(() => {
  withSession()
  server.use(signedInAs('ADMIN'))
})

describe('QR Code com caracteres que quebram a rota da API', () => {
  it.each(['EQP/1', 'EQP\\1', 'EQP?1', 'EQP#1', 'EQP%1', 'EQP 1'])('cadastro recusa %s sem chamar a API', async (qrCode) => {
    const received = recordRequests()

    const { result } = await outcome(() => createEquipment({ status: 'idle' }, form({ siteId: SITE_ID, name: 'Gerador', qrCode })))

    expect(result).toMatchObject({ status: 'error', fieldErrors: { qrCode: expect.stringContaining('QR Code') } })
    expect(received.some((request) => request.method === 'POST')).toBe(false)
  })

  it('edicao recusa o QR invalido sem chamar a API', async () => {
    const received = recordRequests()

    const { result } = await outcome(() =>
      updateEquipment(EQUIPMENT_ID, { status: 'idle' }, form({ name: 'Gerador', qrCode: 'A/B' })),
    )

    expect(result).toMatchObject({ status: 'error' })
    expect(received.some((request) => request.method === 'PUT')).toBe(false)
  })

  it('a consulta pelo QR recusa o valor antes de montar o caminho', async () => {
    const received = recordRequests()

    const { result } = await outcome(() => findEquipmentByQr({}, form({ qrCode: '../users' })))

    expect(result).toMatchObject({ error: expect.stringContaining('QR Code'), code: '../users' })
    expect(received.some((request) => request.path.startsWith('/equipment'))).toBe(false)
  })

  it('QR valido segue para a API', async () => {
    const created = capture('post', '/equipment', { id: EQUIPMENT_ID }, 201)
    server.use(created.handler)

    const { redirectedTo } = await outcome(() =>
      createEquipment({ status: 'idle' }, form({ siteId: SITE_ID, name: 'Gerador', qrCode: 'EQP-A1B2C3' })),
    )

    expect(redirectedTo).toBe(`/equipment/${EQUIPMENT_ID}?notice=created`)
    expect(created.bodies).toEqual([expect.objectContaining({ qrCode: 'EQP-A1B2C3' })])
  })

  it('a consulta de QR valido abre o equipamento', async () => {
    server.use(ok('get', '/equipment/by-qr/EQP-A1B2C3', { id: EQUIPMENT_ID }))

    expect((await outcome(() => findEquipmentByQr({}, form({ qrCode: 'EQP-A1B2C3' })))).redirectedTo).toBe(
      `/equipment/${EQUIPMENT_ID}`,
    )
  })
})
