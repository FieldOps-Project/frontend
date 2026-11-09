import { describe, expect, it } from 'vitest'

import { hasErrors, validateItem, validateSection } from '@/features/templates/builder-validation'

describe('secao', () => {
  it('exige titulo e respeita os limites', () => {
    expect(validateSection({ title: '  ' })).toEqual({ title: 'Dê um título para a seção.' })
    expect(validateSection({ title: 'a'.repeat(256) }).title).toBe('Use no máximo 255 caracteres.')
    expect(validateSection({ title: 'Ok', description: 'b'.repeat(1001) }).description).toBe('Use no máximo 1000 caracteres.')
    expect(hasErrors(validateSection({ title: 'Freios' }))).toBe(false)
  })
})

describe('item', () => {
  it('exige pergunta e tipo valido', () => {
    expect(validateItem({ title: '', responseType: 'XPTO' })).toEqual({
      title: 'Escreva a pergunta do item.',
      responseType: 'Escolha o tipo de resposta.',
    })
  })

  it('aceita tipos sem opcoes sem pedir opcoes', () => {
    expect(validateItem({ title: 'Horímetro', responseType: 'NUMBER' })).toEqual({})
  })

  it('exige ao menos duas opcoes preenchidas na escolha unica', () => {
    const message = 'Informe ao menos 2 opções, sem deixar opção em branco.'
    expect(validateItem({ title: 'Estado', responseType: 'SINGLE_CHOICE', options: ['Bom'] }).options).toBe(message)
    expect(validateItem({ title: 'Estado', responseType: 'SINGLE_CHOICE', options: ['Bom', ' '] }).options).toBe(message)
  })

  it('recusa opcoes repetidas sem diferenciar maiusculas', () => {
    expect(validateItem({ title: 'Estado', responseType: 'SINGLE_CHOICE', options: ['Bom', ' bom '] }).options).toBe(
      'As opções não podem se repetir.',
    )
  })

  it('aplica os limites de quantidade e tamanho das opcoes', () => {
    const many = Array.from({ length: 51 }, (_, index) => `Opção ${index}`)
    expect(validateItem({ title: 'E', responseType: 'SINGLE_CHOICE', options: many }).options).toBe('Use no máximo 50 opções.')
    expect(validateItem({ title: 'E', responseType: 'SINGLE_CHOICE', options: ['a'.repeat(101), 'b'] }).options).toBe(
      'Cada opção pode ter no máximo 100 caracteres.',
    )
  })
})
