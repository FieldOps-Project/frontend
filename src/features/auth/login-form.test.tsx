import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { LoginState } from '@/features/auth/login'
import { LoginForm } from '@/features/auth/login-form'

const signInMock = vi.fn<(previous: LoginState, formData: FormData) => Promise<LoginState>>()

vi.mock('@/features/auth/login', () => ({
  signIn: (previous: LoginState, formData: FormData) => signInMock(previous, formData),
}))

afterEach(() => {
  signInMock.mockReset()
})

function fill(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: password } })
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }))
}

describe('LoginForm', () => {
  it('associa cada campo ao seu rotulo', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText('E-mail')).toHaveAttribute('autocomplete', 'username')
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
  })

  it('valida no navegador sem chamar o servidor e foca o primeiro campo invalido', () => {
    render(<LoginForm />)

    fill('nao-e-email', '')
    submit()

    const email = screen.getByLabelText('E-mail')
    expect(signInMock).not.toHaveBeenCalled()
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAccessibleDescription('Informe um e-mail válido.')
    expect(email).toHaveFocus()
  })

  it('anuncia a recusa da API e preserva o e-mail digitado', async () => {
    signInMock.mockResolvedValueOnce({
      message: 'E-mail ou senha incorretos.',
      email: 'maria@fieldops.local',
    })
    render(<LoginForm redirectTo="/inspections" />)

    fill('maria@fieldops.local', 'senha-errada')
    submit()

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
    await waitFor(() => expect(screen.getByLabelText('E-mail')).toHaveValue('maria@fieldops.local'))

    const formData = signInMock.mock.calls[0]?.[1]
    expect(formData?.get('redirect')).toBe('/inspections')
  })

  it('alterna a visibilidade da senha sem enviar o formulario', () => {
    render(<LoginForm />)

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(signInMock).not.toHaveBeenCalled()
  })
})
