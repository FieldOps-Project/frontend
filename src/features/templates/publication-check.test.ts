import { describe, expect, it } from 'vitest'

import { publicationIssues } from '@/features/templates/publication-check'
import type { TemplateItem, TemplateSection } from '@/lib/domain/template-builder'
import { issueAnchor, issuesFromApi } from '@/lib/domain/template-publication'

function item(id: string, patch: Partial<TemplateItem> = {}): TemplateItem {
  return {
    id,
    sectionId: 's',
    code: null,
    title: `Pergunta ${id}`,
    description: null,
    responseType: 'CONFORMITY',
    required: true,
    observationRequiredOnFailure: false,
    evidenceRequiredOnFailure: false,
    options: [],
    displayOrder: 1,
    ...patch,
  }
}

const SECTIONS: TemplateSection[] = [
  { id: 's1', title: 'Identificação', description: null, displayOrder: 1, items: [item('i1'), item('i2', { displayOrder: 2, responseType: 'SINGLE_CHOICE', options: ['Bom'] })] },
  { id: 's2', title: 'Sistema elétrico', description: null, displayOrder: 2, items: [] },
]

describe('conferencia local', () => {
  it('lista todas as pendencias com o alvo de cada uma', () => {
    expect(publicationIssues({ title: ' ', category: 'Equipamentos', sections: SECTIONS })).toEqual([
      { message: 'O modelo precisa de um título.', target: { kind: 'template' } },
      {
        message: 'Item 1.2 “Pergunta i2”: Informe ao menos 2 opções, sem deixar opção em branco.',
        target: { kind: 'item', id: 'i2' },
      },
      { message: 'A seção 2 “Sistema elétrico” não tem itens.', target: { kind: 'section', id: 's2' } },
    ])
  })

  it('exige ao menos uma secao', () => {
    expect(publicationIssues({ title: 'Ok', category: 'Ok', sections: [] })).toHaveLength(1)
  })

  it('nao aponta nada num modelo pronto', () => {
    expect(publicationIssues({ title: 'Ok', category: 'Ok', sections: [SECTIONS[0]!].map((s) => ({ ...s, items: [item('i1')] })) })).toEqual([])
  })
})

describe('pendencias da API', () => {
  it('traduz os caminhos contados a partir de zero', () => {
    const issues = issuesFromApi(
      [
        { field: 'sections[1].items', message: 'Section "Sistema elétrico" must have at least one item' },
        { field: 'sections[0].items[1].options', message: 'SINGLE_CHOICE items require at least two non-blank options' },
        { field: 'category', message: 'Template category is required' },
      ],
      { sections: SECTIONS },
    )

    expect(issues).toEqual([
      { message: 'A seção 2 “Sistema elétrico” não tem itens.', target: { kind: 'section', id: 's2' } },
      {
        message: 'Item 1.2 “Pergunta i2”: a escolha única precisa de ao menos 2 opções, sem repetir.',
        target: { kind: 'item', id: 'i2' },
      },
      { message: 'O modelo precisa de uma categoria.', target: { kind: 'template' } },
    ])
  })

  it('mantem a mensagem da API quando o caminho e desconhecido', () => {
    expect(issuesFromApi([{ field: 'sections[9]', message: 'x' }], { sections: SECTIONS })).toEqual([
      { message: 'x', target: { kind: 'template' } },
    ])
  })

  it('aponta a ancora de cada alvo', () => {
    expect(issueAnchor({ kind: 'item', id: 'i1' })).toBe('item-i1')
    expect(issueAnchor({ kind: 'section', id: 's1' })).toBe('section-s1')
    expect(issueAnchor({ kind: 'template' })).toBe('template-config')
  })
})
