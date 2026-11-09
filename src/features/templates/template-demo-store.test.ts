import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  changeDemoTemplateStatus,
  createDemoTemplate,
  DemoTemplateError,
  demoTemplateCategories,
  findDemoTemplate,
  listDemoTemplates,
  resetDemoTemplates,
} from '@/features/templates/template-demo-store'

vi.mock('server-only', () => ({}))

beforeEach(() => {
  resetDemoTemplates()
})

describe('listagem de demonstracao', () => {
  it('busca no titulo e na descricao sem diferenciar maiusculas', () => {
    expect(listDemoTemplates({ search: 'EXTINTORES' }).map((t) => t.title)).toEqual(['Vistoria de extintores'])
    expect(listDemoTemplates({ search: 'retroescavadeiras' }).map((t) => t.title)).toEqual(['Inspeção de Máquinas Pesadas'])
  })

  it('filtra por situacao e por categoria exata', () => {
    expect(listDemoTemplates({ status: 'DRAFT' }).every((t) => t.status === 'DRAFT')).toBe(true)
    expect(listDemoTemplates({ category: 'equipamentos' })).toHaveLength(2)
    expect(listDemoTemplates({ category: 'Equip' })).toHaveLength(0)
  })

  it('ordena pelo mais recente e lista as categorias sem repetir', () => {
    const [first] = listDemoTemplates()
    expect(first?.title).toBe('Checklist NR-12 para prensas')
    expect(demoTemplateCategories()).toContain('Equipamentos')
    expect(new Set(demoTemplateCategories()).size).toBe(demoTemplateCategories().length)
  })
})

describe('criacao e situacao', () => {
  it('cria rascunho sem versao publicada e o guarda', () => {
    const created = createDemoTemplate({ title: 'Novo', description: null, category: 'Testes' }, 'user-1')

    expect(created).toMatchObject({ status: 'DRAFT', currentVersion: null, createdBy: 'user-1' })
    expect(findDemoTemplate(created.id)).toEqual(created)
    expect(listDemoTemplates({ category: 'Testes' })).toHaveLength(1)
  })

  it('inativa e reativa modelo publicado', () => {
    const [published] = listDemoTemplates({ status: 'ACTIVE' })
    expect(published).toBeDefined()

    expect(changeDemoTemplateStatus(published!.id, 'INACTIVE').status).toBe('INACTIVE')
    expect(changeDemoTemplateStatus(published!.id, 'ACTIVE').status).toBe('ACTIVE')
  })

  it('recusa mudar a situacao de rascunho nunca publicado', () => {
    const [draft] = listDemoTemplates({ status: 'DRAFT' })
    expect(() => changeDemoTemplateStatus(draft!.id, 'INACTIVE')).toThrow(DemoTemplateError)
  })
})
