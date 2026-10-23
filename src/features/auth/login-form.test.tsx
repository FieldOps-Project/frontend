import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { SignInState } from '@/features/auth/actions'
import { LoginForm } from '@/features/auth/login-form'

const signInMock = vi.fn<(previous: SignInState, formData: FormData) => Promise<SignInState>>()

vi.mock('@/features/auth/actions', () => ({
  signIn: (previous: SignInState, formData: FormData) => signInMock(previous, formData),
}))

afterEach(() => {
  signInMock.mockReset()
})

const emailInput = () => screen.getByLabelText(/^E-mail/)
const passwordInput = () => screen.getByLabelText(/^Senha/)

function fill(email: string, password: string) {
  fireEvent.change(emailInput(), { target: { value: email } })
  fireEvent.change(passwordInput(), { target: { value: password } })
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }))
}

describe('LoginForm', () => {
  it('associa cada campo ao seu rotulo, com o autocomplete certo', () => {
    render(<LoginForm redirectTo="/dashboard" />)

    expect(emailInput()).toHaveAttribute('autocomplete', 'username')
    expect(passwordInput()).toHaveAttribute('type', 'password')
    expect(passwordInput()).toHaveAttribute('autocomplete', 'current-password')
  })

  it('valida no navegador sem chamar o servidor e foca o primeiro campo invalido', () => {
    render(<LoginForm redirectTo="/dashboard" />)

    fill('nao-e-email', '')
    submit()

    expect(signInMock).not.toHaveBeenCalled()
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
    expect(emailInput()).toHaveAttribute('aria-invalid', 'true')
    expect(emailInput()).toHaveAccessibleDescription('Informe um e-mail válido.')
    expect(emailInput()).toHaveFocus()
  })

  it('apaga o erro do campo assim que a pessoa corrige', () => {
    render(<LoginForm redirectTo="/dashboard" />)

    fill('', 'senha')
    submit()
    expect(screen.getByText('Informe o e-mail.')).toBeInTheDocument()

    fireEvent.change(emailInput(), { target: { value: 'maria@fieldops.local' } })

    expect(screen.queryByText('Informe o e-mail.')).not.toBeInTheDocument()
  })

  it('anuncia a recusa da API, preserva o e-mail e envia o destino', async () => {
    signInMock.mockResolvedValueOnce({ error: 'E-mail ou senha incorretos.', email: 'maria@fieldops.local' })
    render(<LoginForm redirectTo="/inspections" />)

    fill('maria@fieldops.local', 'senha-errada')
    submit()

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
    await waitFor(() => expect(emailInput()).toHaveValue('maria@fieldops.local'))
    await waitFor(() => expect(passwordInput()).toHaveFocus())
    expect(signInMock.mock.calls[0]?.[1].get('redirect')).toBe('/inspections')
  })

  it('mostra o aviso de sessao expirada enquanto nao ha erro', () => {
    render(<LoginForm redirectTo="/dashboard" notice="Sua sessão expirou. Entre novamente para continuar." />)

    expect(screen.getByRole('status')).toHaveTextContent('Sua sessão expirou.')
  })
})
