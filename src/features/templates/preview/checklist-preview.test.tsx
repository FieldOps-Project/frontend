import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ChecklistPreview } from '@/features/templates/preview/checklist-preview'
import type { TemplateItem, TemplateSection } from '@/lib/domain/template-builder'

function item(id: string, patch: Partial<TemplateItem>): TemplateItem {
  return {
    id,
    sectionId: 's',
    code: null,
    title: id,
    description: null,
    responseType: 'TEXT_SHORT',
    required: false,
    observationRequiredOnFailure: false,
    evidenceRequiredOnFailure: false,
    options: [],
    displayOrder: 1,
    ...patch,
  }
}

const SECTIONS: TemplateSection[] = [
  {
    id: 's2',
    title: 'Hidráulico',
    description: null,
    displayOrder: 2,
    items: [item('Estado das mangueiras', { responseType: 'SINGLE_CHOICE', options: ['Bom', 'Ruim'] })],
  },
  {
    id: 's1',
    title: 'Identificação',
    description: null,
    displayOrder: 1,
    items: [
      item('Pneus', { displayOrder: 2, responseType: 'CONFORMITY', required: true, evidenceRequiredOnFailure: true }),
      item('Horímetro', { displayOrder: 1, responseType: 'NUMBER', description: 'Leia no painel.' }),
    ],
  },
]

describe('ChecklistPreview', () => {
  it('mostra secoes e itens na ordem definida', () => {
    render(<ChecklistPreview sections={SECTIONS} />)

    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      '1. Identificação',
      '2. Hidráulico',
    ])
    const first = screen.getByRole('region', { name: '1. Identificação' })
    expect(within(first).getAllByRole('listitem')[0]).toHaveTextContent('1.1Horímetro')
  })

  it('mostra a forma da resposta de cada tipo, sem campos editaveis', () => {
    render(<ChecklistPreview sections={SECTIONS} />)

    expect(screen.getByText('Não conforme')).toBeInTheDocument()
    expect(screen.getByText('Número')).toBeInTheDocument()
    expect(screen.getByText('Ruim')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('indica obrigatorio, instrucao e exigencia de foto na falha', () => {
    render(<ChecklistPreview sections={SECTIONS} />)

    expect(screen.getByText('(obrigatório)', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Leia no painel.')).toBeInTheDocument()
    expect(screen.getByText('Foto obrigatória se “NC”', { exact: false })).toBeInTheDocument()
  })

  it('avisa quando nao ha secoes', () => {
    render(<ChecklistPreview sections={[]} />)
    expect(screen.getByText('Este checklist ainda não tem seções.')).toBeInTheDocument()
  })
})
