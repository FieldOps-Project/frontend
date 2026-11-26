import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { BeginReview, ReviewDecision } from '@/features/inspections/review-decision'

const beginReview = vi.fn()
const approveInspection = vi.fn()
const rejectInspection = vi.fn()
const notify = vi.fn()
const refresh = vi.fn()

vi.mock('@/features/inspections/review-actions', () => ({
  beginReview: (id: string) => beginReview(id),
  approveInspection: (id: string, comments: string) => approveInspection(id, comments),
  rejectInspection: (id: string, reason: string, items: string[]) => rejectInspection(id, reason, items),
}))
vi.mock('@/components/ui/toast', () => ({ useToast: () => notify }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

const ID = '3d8dc050-54f4-4d3b-9e5d-5fdb29ae3ed5'
const ITEMS = [
  { id: 'i1', code: 'G-1', title: 'Placa' },
  { id: 'i2', code: 'G-2', title: 'Limpeza' },
]

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false
  }
})

beforeEach(() => {
  beginReview.mockReset()
  approveInspection.mockReset()
  rejectInspection.mockReset()
  notify.mockReset()
  refresh.mockReset()
})

describe('BeginReview', () => {
  it('inicia a revisao, avisa e recarrega a tela', async () => {
    beginReview.mockResolvedValue({ ok: true, message: 'Revisão iniciada.' })
    render(<BeginReview inspectionId={ID} />)

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar revisão' }))

    await waitFor(() => expect(refresh).toHaveBeenCalled())
    expect(beginReview).toHaveBeenCalledWith(ID)
    expect(notify).toHaveBeenCalledWith('Revisão iniciada.', 'success')
  })

  it('mostra o erro e nao recarrega quando a API recusa', async () => {
    beginReview.mockResolvedValue({ ok: false, message: 'Esta ação não é possível no estado atual da inspeção.' })
    render(<BeginReview inspectionId={ID} />)

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar revisão' }))

    await waitFor(() => expect(notify).toHaveBeenCalledWith('Esta ação não é possível no estado atual da inspeção.', 'error'))
    expect(refresh).not.toHaveBeenCalled()
  })
})

describe('ReviewDecision', () => {
  it('oferece aprovar e reprovar', () => {
    render(<ReviewDecision inspectionId={ID} correctableItems={ITEMS} suggestedItemIds={[]} />)

    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reprovar' })).toBeInTheDocument()
  })

  it('exige motivo para reprovar e envia os itens marcados', async () => {
    rejectInspection.mockResolvedValue({ ok: true, message: 'Inspeção reprovada.' })
    render(<ReviewDecision inspectionId={ID} correctableItems={ITEMS} suggestedItemIds={['i2']} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reprovar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reprovação' }))
    expect(screen.getByText('Informe o motivo da reprovação.')).toBeInTheDocument()
    expect(rejectInspection).not.toHaveBeenCalled()

    fireEvent.change(screen.getByRole('textbox', { name: /Motivo da reprovação/ }), { target: { value: 'Limpeza insuficiente' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reprovação' }))

    await waitFor(() => expect(rejectInspection).toHaveBeenCalledWith(ID, 'Limpeza insuficiente', ['i2']))
    expect(refresh).toHaveBeenCalled()
  })

  it('limita motivo e comentario ao tamanho aceito pela API', () => {
    render(<ReviewDecision inspectionId={ID} correctableItems={ITEMS} suggestedItemIds={[]} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reprovar' }))
    expect(screen.getByRole('textbox', { name: /Motivo da reprovação/ })).toHaveAttribute('maxlength', '2000')
  })

  it('aprova com comentario opcional', async () => {
    approveInspection.mockResolvedValue({ ok: true, message: 'Inspeção aprovada.' })
    render(<ReviewDecision inspectionId={ID} correctableItems={ITEMS} suggestedItemIds={[]} />)

    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }))
    fireEvent.change(screen.getByRole('textbox', { name: /Comentário/ }), { target: { value: 'Tudo certo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar aprovação' }))

    await waitFor(() => expect(approveInspection).toHaveBeenCalledWith(ID, 'Tudo certo'))
  })
})
