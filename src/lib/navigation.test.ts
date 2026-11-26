import { describe, expect, it } from 'vitest'

import { isActive, navigationFor, NAVIGATION } from '@/lib/navigation'

describe('mapa de navegacao', () => {
  it('cobre as areas do documento 14.3', () => {
    expect(NAVIGATION.map((item) => item.href)).toEqual([
      '/dashboard',
      '/users',
      '/clients',
      '/sites',
      '/equipment',
      '/inspection-templates',
      '/inspections',
      '/non-conformities',
      '/audit',
    ])
  })

  it('esconde a gestao de usuarios de quem nao e administrador', () => {
    const supervisor = navigationFor('SUPERVISOR').map((item) => item.href)

    expect(supervisor).not.toContain('/users')
    expect(supervisor).toContain('/clients')
  })

  it('mostra as nao conformidades so ao supervisor, unico perfil do painel que a API deixa consulta-las', () => {
    expect(navigationFor('SUPERVISOR').map((item) => item.href)).toContain('/non-conformities')
    expect(navigationFor('ADMIN').map((item) => item.href)).not.toContain('/non-conformities')
  })

  it('nao oferece area administrativa ao tecnico', () => {
    expect(navigationFor('TECHNICIAN')).toHaveLength(0)
  })

  it('mantem o item ativo nas rotas filhas', () => {
    expect(isActive('/clients/8a50e30d/sites', '/clients')).toBe(true)
    expect(isActive('/clients', '/clients')).toBe(true)
  })

  it('nao ativa item cujo endereco e apenas prefixo textual', () => {
    expect(isActive('/inspection-templates', '/inspections')).toBe(false)
  })
})
