import { describe, expect, it } from 'vitest'

import { environmentLabel, isProductionEnvironment } from '@/lib/environment'

describe('ambiente', () => {
  it('traduz os ambientes conhecidos', () => {
    expect(environmentLabel('development')).toBe('Desenvolvimento')
    expect(environmentLabel('staging')).toBe('Homologação')
    expect(environmentLabel('production')).toBe('Produção')
  })

  it('trata a ausencia da variavel como producao e mostra valor desconhecido como veio', () => {
    expect(environmentLabel(undefined)).toBe('Produção')
    expect(environmentLabel('qa')).toBe('qa')
    expect(isProductionEnvironment(undefined)).toBe(true)
    expect(isProductionEnvironment('staging')).toBe(false)
  })
})
