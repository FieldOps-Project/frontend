import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeSwitcher } from '@/components/shell/theme-switcher'
import { THEME_STORAGE_KEY } from '@/lib/theme'

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  )
}

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    mockMatchMedia(false)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('comeca marcado em "Sistema", o padrao', () => {
    render(<ThemeSwitcher />)
    expect(screen.getByRole('radio', { name: 'Sistema' })).toHaveAttribute('aria-checked', 'true')
  })

  it('clicar em "Escuro" aplica o tema e grava a preferencia', () => {
    render(<ThemeSwitcher />)

    fireEvent.click(screen.getByRole('radio', { name: 'Escuro' }))

    expect(screen.getByRole('radio', { name: 'Escuro' })).toHaveAttribute('aria-checked', 'true')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('move a selecao com as setas do teclado', () => {
    render(<ThemeSwitcher />)

    const light = screen.getByRole('radio', { name: 'Claro' })
    light.focus()
    fireEvent.keyDown(light, { key: 'ArrowRight' })

    expect(screen.getByRole('radio', { name: 'Escuro' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Escuro' })).toHaveFocus()
  })

  it('so o item marcado fica no fluxo de tabulacao (roving tabindex)', () => {
    render(<ThemeSwitcher />)

    expect(screen.getByRole('radio', { name: 'Sistema' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: 'Claro' })).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('radio', { name: 'Escuro' })).toHaveAttribute('tabindex', '-1')
  })

  it('"compact" troca o rotulo visivel por aria-label no icone', () => {
    render(<ThemeSwitcher compact />)

    const option = screen.getByRole('radio', { name: 'Claro' })
    expect(option).not.toHaveTextContent('Claro')
    expect(option).toHaveAttribute('title', 'Claro')
  })
})
