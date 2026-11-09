import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DemoTemplateError, demoTemplateId, listDemoTemplates, resetDemoTemplates } from '@/features/templates/template-demo-store'
import {
  createDemoItem,
  createDemoSection,
  deleteDemoItem,
  deleteDemoSection,
  demoDraftSections,
  demoTemplateVersions,
  reorderDemoItems,
  reorderDemoSections,
  resetDemoDrafts,
  updateDemoItem,
  updateDemoSection,
} from '@/features/templates/template-draft-demo-store'
import type { ItemInput } from '@/lib/domain/template-builder'

vi.mock('server-only', () => ({}))

const MACHINES = demoTemplateId(4)
const ITEM: ItemInput = {
  title: 'Buzina funcionando?',
  description: null,
  responseType: 'BOOLEAN',
  required: true,
  observationRequiredOnFailure: false,
  evidenceRequiredOnFailure: false,
  options: [],
}

function titles(): string[] {
  return demoDraftSections(MACHINES).map((section) => `${section.displayOrder}:${section.title}`)
}

beforeEach(() => {
  resetDemoTemplates()
  resetDemoDrafts()
})

describe('rascunho de demonstracao', () => {
  it('reproduz o modelo do desenho do construtor', () => {
    const [first] = demoDraftSections(MACHINES)
    expect(first?.title).toBe('Identificação do Equipamento')
    expect(first?.items.map((item) => [item.title, item.responseType])).toEqual([
      ['Número de Série (Horímetro)', 'NUMBER'],
      ['Condição dos Pneus/Esteiras', 'CONFORMITY'],
    ])
    expect(demoTemplateVersions(MACHINES).map((version) => version.versionNumber)).toEqual([2, 1])
  })

  it('modelo novo comeca sem secoes nem versoes', () => {
    expect(demoDraftSections('f0000000-0000-4000-8000-000000000000')).toEqual([])
    expect(demoTemplateVersions('f0000000-0000-4000-8000-000000000000')).toEqual([])
  })
})

describe('secoes', () => {
  it('insere na posicao informada e empurra as seguintes; sem posicao vai para o fim', () => {
    createDemoSection(MACHINES, { title: 'Freios', description: null }, 2)
    createDemoSection(MACHINES, { title: 'Encerramento', description: null })

    expect(titles()).toEqual([
      '1:Identificação do Equipamento',
      '2:Freios',
      '3:Sistema Hidráulico',
      '4:Segurança e Cabine',
      '5:Encerramento',
    ])
  })

  it('renomeia, exclui renumerando e reordena com a lista completa', () => {
    const [first, second, third] = demoDraftSections(MACHINES)
    updateDemoSection(MACHINES, first!.id, { title: 'Identificação', description: null })
    deleteDemoSection(MACHINES, second!.id)

    expect(titles()).toEqual(['1:Identificação', '2:Segurança e Cabine'])

    reorderDemoSections(MACHINES, [third!.id, first!.id])
    expect(titles()).toEqual(['1:Segurança e Cabine', '2:Identificação'])
  })

  it('recusa ordem incompleta ou repetida', () => {
    const [first, second] = demoDraftSections(MACHINES)
    expect(() => reorderDemoSections(MACHINES, [first!.id, second!.id])).toThrow(DemoTemplateError)
    expect(() => reorderDemoSections(MACHINES, [first!.id, first!.id, second!.id])).toThrow(DemoTemplateError)
  })

  it('a edicao do rascunho leva o modelo ao topo da lista', () => {
    createDemoSection(MACHINES, { title: 'Nova', description: null })
    expect(listDemoTemplates()[0]?.id).toBe(MACHINES)
  })
})

describe('itens', () => {
  it('cria, edita, exclui renumerando e reordena dentro da secao', () => {
    const [section] = demoDraftSections(MACHINES)
    const created = createDemoItem(MACHINES, section!.id, ITEM, 1)
    expect(created.displayOrder).toBe(1)

    updateDemoItem(MACHINES, created.id, { ...ITEM, title: 'Buzina audível?' })
    const [, serial, tires] = demoDraftSections(MACHINES)[0]!.items
    expect(demoDraftSections(MACHINES)[0]!.items[0]?.title).toBe('Buzina audível?')

    deleteDemoItem(MACHINES, created.id)
    expect(demoDraftSections(MACHINES)[0]!.items.map((item) => item.displayOrder)).toEqual([1, 2])

    reorderDemoItems(MACHINES, section!.id, [tires!.id, serial!.id])
    expect(demoDraftSections(MACHINES)[0]!.items.map((item) => item.title)).toEqual([
      'Condição dos Pneus/Esteiras',
      'Número de Série (Horímetro)',
    ])
  })

  it('avisa quando o item ou a secao nao existem mais', () => {
    expect(() => updateDemoItem(MACHINES, 'x', ITEM)).toThrow('Item não encontrado. Ele pode ter sido removido.')
    expect(() => createDemoItem(MACHINES, 'x', ITEM)).toThrow('Seção não encontrada. Ela pode ter sido removida.')
  })
})
