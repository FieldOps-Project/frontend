import { describe, expect, it } from 'vitest'

import { hasLoginErrors, validateLogin } from '@/features/auth/login-validation'

describe('validateLogin', () => {
  it('aceita e-mail e senha validos, ignorando espacos em volta do e-mail', () => {
    const errors = validateLogin({ email: '  maria@fieldops.local ', password: 'Str0ngP@ssword' })

    expect(errors).toEqual({})
    expect(hasLoginErrors(errors)).toBe(false)
  })

  it('pede os dois campos quando estao vazios', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'Informe o e-mail.',
      password: 'Informe a senha.',
    })
  })

  it('recusa e-mail sem formato valido', () => {
    expect(validateLogin({ email: 'maria@fieldops', password: 'x' }).email).toBe('Informe um e-mail válido.')
    expect(validateLogin({ email: 'maria fieldops.local', password: 'x' }).email).toBe('Informe um e-mail válido.')
  })

  it('aplica os mesmos limites de tamanho da API', () => {
    const errors = validateLogin({ email: `${'a'.repeat(315)}@x.com`, password: 'p'.repeat(129) })

    expect(errors.email).toBe('O e-mail deve ter no máximo 320 caracteres.')
    expect(errors.password).toBe('A senha deve ter no máximo 128 caracteres.')
  })

  it('trata valor que nao e texto como campo vazio', () => {
    expect(validateLogin({ email: null, password: new File([], 'x') })).toEqual({
      email: 'Informe o e-mail.',
      password: 'Informe a senha.',
    })
  })
})
