import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { UserMenu } from '@/components/shell/user-menu'

vi.mock('@/features/auth/actions', () => ({ signOut: vi.fn() }))

const USER = { id: 'u1', name: 'Admin Local', email: 'admin@fieldops.local', role: 'ADMIN' } as const

describe('UserMenu', () => {
  it('mostra quem esta logado, o perfil e o ambiente', () => {
    render(<UserMenu user={USER} environmentLabel="Produção" />)
    fireEvent.click(screen.getByRole('button', { name: 'Menu da conta' }))

    const menu = screen.getByRole('dialog', { name: 'Menu da conta' })
    expect(menu).toHaveTextContent('Admin Local')
    expect(menu).toHaveTextContent('admin@fieldops.local')
    expect(menu).toHaveTextContent('Administrador · Ambiente: Produção')
  })

  it('oferece configuracoes e sair', () => {
    render(<UserMenu user={USER} environmentLabel="Produção" />)
    fireEvent.click(screen.getByRole('button', { name: 'Menu da conta' }))

    expect(screen.getByRole('link', { name: 'Configurações' })).toHaveAttribute('href', '/settings')
    expect(screen.getByRole('button', { name: 'Sair' })).toHaveAttribute('type', 'submit')
  })
})
