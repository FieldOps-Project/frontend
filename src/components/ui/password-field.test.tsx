import { fireEvent, render, screen } from '@testing-library/react'
import { IoMailOutline } from 'react-icons/io5'
import { describe, expect, it } from 'vitest'

import { TextField } from '@/components/ui/form-fields'
import { PasswordField } from '@/components/ui/password-field'

describe('TextField', () => {
  it('keeps the plain input when there is no icon or trailing control', () => {
    render(<TextField name="name" label="Nome" />)

    const input = screen.getByLabelText('Nome')
    expect(input.parentElement?.tagName).toBe('DIV')
    expect(input.parentElement?.querySelector('[aria-hidden]')).toBeNull()
  })

  it('renders the icon inside the field box, hidden from assistive technology', () => {
    render(<TextField name="email" label="E-mail" icon={<IoMailOutline data-testid="icon" />} />)

    const input = screen.getByLabelText('E-mail')
    const icon = screen.getByTestId('icon')
    expect(input.parentElement).toBe(icon.parentElement?.parentElement)
    expect(icon.parentElement).toHaveAttribute('aria-hidden', 'true')
  })

  it('ties the error message to the input', () => {
    render(<TextField name="email" label="E-mail" icon={<IoMailOutline />} error="Informe um e-mail válido." />)

    const input = screen.getByLabelText('E-mail')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Informe um e-mail válido.')
  })
})

describe('PasswordField', () => {
  it('starts hidden and toggles the visibility without submitting the form', () => {
    let submitted = false
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submitted = true
        }}
      >
        <PasswordField name="password" label="Senha" />
      </form>,
    )

    const input = screen.getByLabelText('Senha')
    const toggle = screen.getByRole('button', { name: 'Mostrar senha' })
    expect(input).toHaveAttribute('type', 'password')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(toggle).toHaveAttribute('aria-controls', input.id)

    fireEvent.click(toggle)

    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute('aria-pressed', 'true')
    expect(submitted).toBe(false)
  })
})
