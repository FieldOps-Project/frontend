import { describe, expect, it } from 'vitest'

import { safeRedirect } from '@/lib/redirect'

describe('safeRedirect', () => {
  it('aceita caminho interno, com busca', () => {
    expect(safeRedirect('/clients?page=2')).toBe('/clients?page=2')
  })

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', 'clients', ''])(
    'recusa destino fora da aplicacao: %s',
    (target) => {
      expect(safeRedirect(target)).toBe('/dashboard')
    },
  )

  it.each(['/\t/evil.example', '/\n/evil.example', '/\r\n/evil.example', '/clients\u0000', '/\u007fx'])(
    'recusa caractere de controle, que o navegador descarta da URL: %j',
    (target) => {
      expect(safeRedirect(target)).toBe('/dashboard')
    },
  )

  it('nao devolve ao proprio login nem a rotas de API', () => {
    expect(safeRedirect('/login?redirect=/x')).toBe('/dashboard')
    expect(safeRedirect('/api/auth/refresh')).toBe('/dashboard')
  })

  it('usa o padrao quando o valor nao e texto', () => {
    expect(safeRedirect(null)).toBe('/dashboard')
  })
})
