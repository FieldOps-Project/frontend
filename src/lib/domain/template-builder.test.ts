import { describe, expect, it } from 'vitest'

import {
  draftVersionNumber,
  failureLabel,
  itemNumber,
  normalizeItemForType,
  RESPONSE_TYPES,
  settingsLostOnTypeChange,
  supportsFailureRules,
  supportsOptions,
  type ItemInput,
} from '@/lib/domain/template-builder'

const ITEM: ItemInput = {
  title: 'Condição dos pneus',
  description: null,
  responseType: 'CONFORMITY',
  required: true,
  observationRequiredOnFailure: true,
  evidenceRequiredOnFailure: true,
  options: [],
}

describe('configuracao por tipo', () => {
  it('oferece os sete tipos do MVP', () => {
    expect(RESPONSE_TYPES).toHaveLength(7)
  })

  it('so conformidade e sim/nao aceitam regras de falha', () => {
    expect(RESPONSE_TYPES.filter(supportsFailureRules)).toEqual(['BOOLEAN', 'CONFORMITY'])
    expect(failureLabel('CONFORMITY')).toBe('se NC')
    expect(failureLabel('BOOLEAN')).toBe('se Não')
    expect(failureLabel('DATE')).toBeNull()
  })

  it('so escolha unica aceita opcoes', () => {
    expect(RESPONSE_TYPES.filter(supportsOptions)).toEqual(['SINGLE_CHOICE'])
  })
})

describe('troca de tipo', () => {
  it('avisa que as regras de falha se perdem', () => {
    expect(settingsLostOnTypeChange(ITEM, 'DATE')).toEqual(['as exigências de observação e evidência na falha'])
    expect(settingsLostOnTypeChange(ITEM, 'BOOLEAN')).toEqual([])
  })

  it('avisa que as opcoes preenchidas se perdem', () => {
    const choice = { ...ITEM, responseType: 'SINGLE_CHOICE' as const, options: ['Bom', 'Ruim'] }
    expect(settingsLostOnTypeChange(choice, 'NUMBER')).toEqual(['as opções da escolha única'])
    expect(settingsLostOnTypeChange({ ...choice, options: ['', ' '] }, 'NUMBER')).toEqual([])
  })

  it('remove antes do envio o que o tipo nao aceita', () => {
    expect(normalizeItemForType({ ...ITEM, responseType: 'NUMBER', options: ['x'] })).toMatchObject({
      observationRequiredOnFailure: false,
      evidenceRequiredOnFailure: false,
      options: [],
    })
    expect(normalizeItemForType({ ...ITEM, responseType: 'SINGLE_CHOICE', options: [' Bom ', 'Ruim'] }).options).toEqual([
      'Bom',
      'Ruim',
    ])
  })
})

describe('numeracao', () => {
  it('numera o item pela secao e pela posicao', () => {
    expect(itemNumber(1, 2)).toBe('1.2')
  })

  it('o rascunho e a versao seguinte a vigente', () => {
    expect(draftVersionNumber({ currentVersion: null })).toBe(1)
    expect(draftVersionNumber({ currentVersion: 2 })).toBe(3)
  })
})
