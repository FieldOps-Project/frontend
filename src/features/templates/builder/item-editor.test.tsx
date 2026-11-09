import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConfirmProvider } from '@/components/ui/confirm-dialog'
import { ToastProvider } from '@/components/ui/toast'
import { ItemEditor } from '@/features/templates/builder/item-editor'
import type { TemplateItem } from '@/lib/domain/template-builder'

const updateItem = vi.fn()
const createItem = vi.fn()

vi.mock('@/features/templates/builder-actions', () => ({
  updateItem: (...args: unknown[]) => updateItem(...args),
  createItem: (...args: unknown[]) => createItem(...args),
}))

const ITEM: TemplateItem = {
  id: 'i1',
  sectionId: 's1',
  code: null,
  title: 'Condição dos Pneus/Esteiras',
  description: null,
  responseType: 'CONFORMITY',
  required: true,
  observationRequiredOnFailure: true,
  evidenceRequiredOnFailure: true,
  options: [],
  displayOrder: 2,
}

function wrap(children: ReactNode) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  )
}

afterEach(() => {
  updateItem.mockReset()
  createItem.mockReset()
})

describe('ItemEditor', () => {
  it('mostra as respostas da conformidade e as regras de falha, como no desenho', () => {
    render(wrap(<ItemEditor templateId="t1" sectionId="s1" number="1.2" item={ITEM} onDone={vi.fn()} />))

    expect(screen.getByText('Conforme (C)')).toBeInTheDocument()
    expect(screen.getByText('Não Conforme (NC)')).toBeInTheDocument()
    expect(screen.getByText('Não Aplicável (NA)')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Obrigatório' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: /Exigir Observação \(se NC\)/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: /Exigir Evidência \(Foto\)/ })).toBeInTheDocument()
  })

  it('esconde as regras de falha em tipo que nao as aceita', () => {
    render(wrap(<ItemEditor templateId="t1" sectionId="s1" number="1.1" onDone={vi.fn()} />))

    fireEvent.change(screen.getByRole('combobox', { name: 'Tipo de resposta' }), { target: { value: 'NUMBER' } })

    expect(screen.getByText('O técnico informa um número.')).toBeInTheDocument()
    expect(screen.queryByRole('switch', { name: /Exigir Observação/ })).not.toBeInTheDocument()
  })

  it('pede as opcoes da escolha unica antes de salvar', () => {
    render(wrap(<ItemEditor templateId="t1" sectionId="s1" number="1.3" onDone={vi.fn()} />))

    fireEvent.change(screen.getByRole('textbox', { name: 'Pergunta do item' }), { target: { value: 'Estado das mangueiras' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Tipo de resposta' }), { target: { value: 'SINGLE_CHOICE' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Item' }))

    expect(screen.getByText('Informe ao menos 2 opções, sem deixar opção em branco.')).toBeInTheDocument()
    expect(createItem).not.toHaveBeenCalled()
  })

  it('salva o item editado e avisa quem abriu', async () => {
    updateItem.mockResolvedValueOnce({ ok: true, message: 'Item salvo.', data: ITEM })
    const onDone = vi.fn()
    render(wrap(<ItemEditor templateId="t1" sectionId="s1" number="1.2" item={ITEM} onDone={onDone} />))

    fireEvent.click(screen.getByRole('switch', { name: 'Obrigatório' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Item' }))

    await waitFor(() => expect(onDone).toHaveBeenCalledWith(true))
    expect(updateItem).toHaveBeenCalledWith('t1', 'i1', expect.objectContaining({ required: false, responseType: 'CONFORMITY' }))
  })

  it('fecha sem salvar ao cancelar', () => {
    const onDone = vi.fn()
    render(wrap(<ItemEditor templateId="t1" sectionId="s1" number="1.2" item={ITEM} onDone={onDone} />))

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onDone).toHaveBeenCalledWith(false)
  })
})
