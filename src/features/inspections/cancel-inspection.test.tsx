import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { CancelInspection } from '@/features/inspections/cancel-inspection'

const cancelInspection = vi.fn()

vi.mock('@/features/inspections/detail-actions', () => ({
  cancelInspection: (id: string, reason: string) => cancelInspection(id, reason),
}))
vi.mock('@/components/ui/toast', () => ({ useToast: () => vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

const ID = '3d8dc050-54f4-4d3b-9e5d-5fdb29ae3ed5'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false
  }
})

describe('CancelInspection', () => {
  it('so libera a confirmacao com o motivo preenchido (RN-029)', async () => {
    cancelInspection.mockResolvedValue({ ok: true, message: 'Inspeção cancelada.' })
    render(<CancelInspection inspectionId={ID} reference="INS-3D8DC050" />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar inspeção' }))
    const confirm = screen.getByRole('button', { name: 'Confirmar cancelamento' })
    expect(confirm).toBeDisabled()

    const reason = screen.getByRole('textbox', { name: /Motivo do cancelamento/ })
    fireEvent.change(reason, { target: { value: '   ' } })
    expect(confirm).toBeDisabled()

    fireEvent.change(reason, { target: { value: 'Área interditada' } })
    expect(confirm).toBeEnabled()

    fireEvent.click(confirm)
    await waitFor(() => expect(cancelInspection).toHaveBeenCalledWith(ID, 'Área interditada'))
  })
})
