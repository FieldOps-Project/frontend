import { describe, expect, it } from 'vitest'

import { hasNewTemplateErrors, validateNewTemplate } from '@/features/templates/new-template-validation'

describe('novo modelo', () => {
  it('aceita titulo e categoria preenchidos, com descricao opcional', () => {
    const errors = validateNewTemplate({ title: 'Vistoria de extintores', category: 'Combate a incêndio' })
    expect(hasNewTemplateErrors(errors)).toBe(false)
  })

  it('exige titulo e categoria, ignorando espacos', () => {
    expect(validateNewTemplate({ title: '   ', category: '' })).toEqual({
      title: 'O título do modelo é obrigatório.',
      category: 'A categoria do modelo é obrigatória.',
    })
  })

  it('aplica os limites de tamanho da API', () => {
    const errors = validateNewTemplate({
      title: 'a'.repeat(256),
      description: 'b'.repeat(1001),
      category: 'c'.repeat(101),
    })

    expect(errors.title).toBe('Use no máximo 255 caracteres.')
    expect(errors.description).toBe('Use no máximo 1000 caracteres.')
    expect(errors.category).toBe('Use no máximo 100 caracteres.')
  })

  it('aceita exatamente o limite', () => {
    expect(validateNewTemplate({ title: 'a'.repeat(255), category: 'c'.repeat(100) })).toEqual({})
  })
})
