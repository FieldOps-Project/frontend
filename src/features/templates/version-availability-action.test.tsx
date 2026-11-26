import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { ConfirmProvider } from '@/components/ui/confirm-dialog'
import { ToastProvider } from '@/components/ui/toast'
import { VersionAvailabilityAction } from '@/features/templates/version-availability-action'

const changeVersionAvailability = vi.fn()
const refresh = vi.fn()

vi.mock('@/features/templates/actions', () => ({
  changeVersionAvailability: (id: string, active: boolean) => changeVersionAvailability(id, active),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
})

afterEach(() => {
  changeVersionAvailability.mockReset()
  refresh.mockReset()
})

function wrap(children: ReactNode) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  )
}

async function confirmDialog(name: string) {
  const dialog = await screen.findByRole('dialog')
  fireEvent.click(within(dialog).getByRole('button', { name }))
}

describe('VersionAvailabilityAction', () => {
  it('retira uma versao disponivel depois de confirmar e atualiza a tela', async () => {
    changeVersionAvailability.mockResolvedValue({ ok: true, message: 'Versão retirada dos novos agendamentos.' })
    render(wrap(<VersionAvailabilityAction versionId="v1" versionNumber={2} active />))

    fireEvent.click(screen.getByRole('button', { name: 'Retirar' }))
    await confirmDialog('Retirar')

    await waitFor(() => expect(changeVersionAvailability).toHaveBeenCalledWith('v1', false))
    await waitFor(() => expect(refresh).toHaveBeenCalled())
    expect(await screen.findByText('Versão retirada dos novos agendamentos.')).toBeInTheDocument()
  })

  it('libera uma versao indisponivel', async () => {
    changeVersionAvailability.mockResolvedValue({ ok: true, message: 'Versão liberada para novos agendamentos.' })
    render(wrap(<VersionAvailabilityAction versionId="v1" versionNumber={2} active={false} />))

    fireEvent.click(screen.getByRole('button', { name: 'Liberar' }))
    await confirmDialog('Liberar')

    await waitFor(() => expect(changeVersionAvailability).toHaveBeenCalledWith('v1', true))
    expect(await screen.findByText('Versão liberada para novos agendamentos.')).toBeInTheDocument()
  })

  it('nao chama a API quando a confirmacao e cancelada', async () => {
    render(wrap(<VersionAvailabilityAction versionId="v1" versionNumber={2} active />))

    fireEvent.click(screen.getByRole('button', { name: 'Retirar' }))
    await confirmDialog('Cancelar')

    expect(changeVersionAvailability).not.toHaveBeenCalled()
  })
})
