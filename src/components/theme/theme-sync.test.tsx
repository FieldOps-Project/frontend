import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeSync } from '@/components/theme/theme-sync'
import { THEME_STORAGE_KEY } from '@/lib/theme'

function mockMatchMedia(matches: boolean) {
  const listeners: Array<() => void> = []
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches,
    addEventListener: (_event: string, listener: () => void) => listeners.push(listener),
    removeEventListener: vi.fn(),
  }))
  return { fireChange: () => listeners.forEach((listener) => listener()) }
}

describe('ThemeSync', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => vi.unstubAllGlobals())

  it('reaplica o tema salvo ao montar', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    mockMatchMedia(false)

    render(<ThemeSync />)

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('com "sistema", acompanha a mudanca ao vivo do sistema operacional', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'system')
    const { fireChange } = mockMatchMedia(false)

    render(<ThemeSync />)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    mockMatchMedia(true)
    fireChange()

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('ignora a mudanca do sistema quando a preferencia e fixa', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    const { fireChange } = mockMatchMedia(false)

    render(<ThemeSync />)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    mockMatchMedia(true)
    fireChange()

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('sincroniza a troca feita em outra aba', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    mockMatchMedia(false)

    render(<ThemeSync />)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY }))

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
