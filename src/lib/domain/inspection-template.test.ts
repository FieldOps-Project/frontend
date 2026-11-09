import { describe, expect, it } from 'vitest'

import { canChangeTemplateStatus, isTemplateStatus, templateSituation } from '@/lib/domain/inspection-template'

describe('situacao do modelo', () => {
  it('mostra a versao vigente de modelo publicado ou inativo', () => {
    expect(templateSituation({ status: 'ACTIVE', currentVersion: 2 })).toBe('Publicado · versão 2')
    expect(templateSituation({ status: 'INACTIVE', currentVersion: 3 })).toBe('Inativo · versão 3')
  })

  it('mostra so "Rascunho" enquanto nada foi publicado', () => {
    expect(templateSituation({ status: 'DRAFT', currentVersion: null })).toBe('Rascunho')
  })

  it('reconhece apenas as situacoes da API', () => {
    expect(isTemplateStatus('ACTIVE')).toBe(true)
    expect(isTemplateStatus('PUBLISHED')).toBe(false)
  })
})

describe('mudanca de situacao', () => {
  it('so e permitida depois da primeira publicacao', () => {
    expect(canChangeTemplateStatus({ currentVersion: null })).toBe(false)
    expect(canChangeTemplateStatus({ currentVersion: 1 })).toBe(true)
  })
})
