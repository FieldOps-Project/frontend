import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NewTemplateForm } from '@/features/templates/new-template-form'

const createTemplate = vi.fn()

vi.mock('@/features/templates/actions', () => ({
  createTemplate: (...args: unknown[]) => createTemplate(...args),
}))

afterEach(() => {
  createTemplate.mockReset()
})

describe('NewTemplateForm', () => {
  it('marca titulo e categoria obrigatorios, foca o primeiro e nao envia', () => {
    render(<NewTemplateForm categories={[]} />)

    fireEvent.click(screen.getByRole('button', { name: 'Criar rascunho' }))

    expect(screen.getByText('O título do modelo é obrigatório.')).toBeInTheDocument()
    expect(screen.getByText('A categoria do modelo é obrigatória.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Título do modelo/ })).toHaveFocus()
    expect(createTemplate).not.toHaveBeenCalled()
  })

  it('limpa o erro do campo assim que ele e corrigido', () => {
    render(<NewTemplateForm categories={[]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Criar rascunho' }))

    fireEvent.change(screen.getByRole('textbox', { name: /Título do modelo/ }), { target: { value: 'Vistoria' } })

    expect(screen.queryByText('O título do modelo é obrigatório.')).not.toBeInTheDocument()
    expect(screen.getByText('A categoria do modelo é obrigatória.')).toBeInTheDocument()
  })

  it('sugere as categorias ja usadas', () => {
    const { container } = render(<NewTemplateForm categories={['Climatização', 'Equipamentos']} />)

    const options = container.querySelectorAll('datalist#template-categories option')
    expect([...options].map((option) => option.getAttribute('value'))).toEqual(['Climatização', 'Equipamentos'])
    expect(screen.getByRole('combobox', { name: /Categoria/ })).toHaveAttribute('list', 'template-categories')
  })

  it('volta para a lista ao cancelar', () => {
    render(<NewTemplateForm categories={[]} />)
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute('href', '/inspection-templates')
  })
})
