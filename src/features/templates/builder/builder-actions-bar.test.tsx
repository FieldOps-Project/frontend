import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { ConfirmProvider } from '@/components/ui/confirm-dialog'
import { ToastProvider } from '@/components/ui/toast'
import { BuilderActionsBar } from '@/features/templates/builder/builder-actions-bar'
import type { InspectionTemplateDetail } from '@/lib/domain/template-builder'

const publishTemplate = vi.fn()
const refresh = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
vi.mock('@/features/templates/builder-actions', () => ({
  publishTemplate: (...args: unknown[]) => publishTemplate(...args),
}))

beforeAll(() => {
  // jsdom nao implementa o <dialog> modal nem a rolagem suave.
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  publishTemplate.mockReset()
  refresh.mockReset()
})

const READY: InspectionTemplateDetail = {
  id: 't1',
  title: 'Inspeção de Máquinas Pesadas',
  description: null,
  category: 'Equipamentos',
  status: 'ACTIVE',
  currentVersion: 2,
  createdBy: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  version: 0,
  draftVersionId: null,
  sections: [
    {
      id: 's1',
      title: 'Identificação',
      description: null,
      displayOrder: 1,
      items: [{ id: 'i1', sectionId: 's1', code: null, title: 'Horímetro', description: null, responseType: 'NUMBER', required: true, observationRequiredOnFailure: false, evidenceRequiredOnFailure: false, options: [], displayOrder: 1 }],
    },
  ],
}

const BLOCKED: InspectionTemplateDetail = {
  ...READY,
  sections: [...READY.sections, { id: 's2', title: 'Sistema elétrico', description: null, displayOrder: 2, items: [] }],
}

function wrap(children: ReactNode) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  )
}

describe('BuilderActionsBar', () => {
  it('leva a previa do rascunho', () => {
    render(wrap(<BuilderActionsBar template={READY} />))
    expect(screen.getByRole('link', { name: 'Pré-visualizar' })).toHaveAttribute('href', '/inspection-templates/t1/preview')
  })

  it('valida e confirma quando nao ha pendencias', () => {
    render(wrap(<BuilderActionsBar template={READY} />))
    fireEvent.click(screen.getByRole('button', { name: 'Validar pendências' }))
    expect(screen.getByRole('dialog', { name: 'Pronto para publicar' })).toBeInTheDocument()
  })

  it('lista as pendencias e leva ao ponto ao clicar', () => {
    render(wrap(<BuilderActionsBar template={BLOCKED} />))
    fireEvent.click(screen.getByRole('button', { name: 'Validar pendências' }))

    const issue = screen.getByRole('button', { name: /A seção 2 “Sistema elétrico” não tem itens/ })
    fireEvent.click(issue)

    expect(screen.queryByRole('dialog', { name: 'Pendências para publicar' })).not.toBeInTheDocument()
  })

  it('nao publica com pendencias', () => {
    render(wrap(<BuilderActionsBar template={BLOCKED} />))
    fireEvent.click(screen.getByRole('button', { name: 'Publicar versão' }))

    expect(screen.getByRole('dialog', { name: 'Pendências para publicar' })).toHaveTextContent('Ainda não dá para publicar.')
    expect(publishTemplate).not.toHaveBeenCalled()
  })

  it('confirma, publica e atualiza a tela', async () => {
    publishTemplate.mockResolvedValueOnce({ ok: true, message: 'Versão 3 publicada.', versionNumber: 3 })
    render(wrap(<BuilderActionsBar template={READY} />))

    fireEvent.click(screen.getByRole('button', { name: 'Publicar versão' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Publicar versão 3' }))

    await waitFor(() => expect(publishTemplate).toHaveBeenCalledWith('t1'))
    await waitFor(() => expect(refresh).toHaveBeenCalled())
    expect(await screen.findByText('Versão 3 publicada.')).toBeInTheDocument()
  })
})
