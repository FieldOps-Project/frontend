import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmProvider } from '@/components/ui/confirm-dialog'
import { ToastProvider } from '@/components/ui/toast'
import { SectionCard } from '@/features/templates/builder/section-card'
import type { TemplateSection } from '@/lib/domain/template-builder'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock('@/features/templates/builder-actions', () => ({
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  deleteSection: vi.fn(),
  reorderItems: vi.fn(),
  updateSection: vi.fn(),
}))

const SECTION: TemplateSection = {
  id: 's1',
  title: 'Identificação do Equipamento',
  description: null,
  displayOrder: 1,
  items: [
    { id: 'i1', sectionId: 's1', code: null, title: 'Número de Série (Horímetro)', description: null, responseType: 'NUMBER', required: true, observationRequiredOnFailure: false, evidenceRequiredOnFailure: false, options: [], displayOrder: 1 },
    { id: 'i2', sectionId: 's1', code: null, title: 'Condição dos Pneus/Esteiras', description: null, responseType: 'CONFORMITY', required: false, observationRequiredOnFailure: false, evidenceRequiredOnFailure: false, options: [], displayOrder: 2 },
  ],
}

function wrap(children: ReactNode) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  )
}

describe('SectionCard', () => {
  it('numera os itens e mostra tipo e obrigatoriedade', () => {
    render(wrap(<SectionCard templateId="t1" section={SECTION} editingItemId={null} onEditItem={vi.fn()} onEditorDone={vi.fn()} />))

    expect(screen.getByRole('heading', { name: 'Identificação do Equipamento' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar o item 1.1: Número de Série (Horímetro)' })).toHaveTextContent('Numérico')
    expect(screen.getAllByText('Obrigatório')).toHaveLength(1)
  })

  it('abre a edicao ao clicar no item e oferece adicionar item', () => {
    const onEditItem = vi.fn()
    render(wrap(<SectionCard templateId="t1" section={SECTION} editingItemId={null} onEditItem={onEditItem} onEditorDone={vi.fn()} />))

    fireEvent.click(screen.getByRole('button', { name: /Editar o item 1.2/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar item à seção 1' }))

    expect(onEditItem).toHaveBeenNthCalledWith(1, 'i2')
    expect(onEditItem).toHaveBeenNthCalledWith(2, 'new:s1')
  })

  it('mostra o editor do item novo numerado depois do ultimo', () => {
    render(wrap(<SectionCard templateId="t1" section={SECTION} editingItemId="new:s1" onEditItem={vi.fn()} onEditorDone={vi.fn()} />))
    expect(screen.getByRole('form', { name: 'Novo item' })).toHaveTextContent('1.3')
  })

  it('desabilita mover o primeiro para cima e o ultimo para baixo', () => {
    render(wrap(<SectionCard templateId="t1" section={SECTION} editingItemId={null} onEditItem={vi.fn()} onEditorDone={vi.fn()} />))

    expect(screen.getByRole('button', { name: 'Mover o item 1.1 para cima' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Mover o item 1.2 para baixo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Mover o item 1.1 para baixo' })).toBeEnabled()
  })
})
