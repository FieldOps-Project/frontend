import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { applyTheme, readThemePreference, resolveTheme, THEME_STORAGE_KEY } from '@/lib/theme'

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  )
}

async function flushDoubleRaf() {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}

describe('resolveTheme', () => {
  it('claro continua claro, nao importa o sistema', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('light', false)).toBe('light')
  })

  it('escuro continua escuro, nao importa o sistema', () => {
    expect(resolveTheme('dark', true)).toBe('dark')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('sistema acompanha a preferencia do sistema operacional', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})

describe('readThemePreference', () => {
  beforeEach(() => localStorage.clear())

  it('usa "sistema" quando nao ha nada salvo', () => {
    expect(readThemePreference()).toBe('system')
  })

  it('usa "sistema" quando o valor salvo nao e uma preferencia valida', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'azul')
    expect(readThemePreference()).toBe('system')
  })

  it('le a preferencia salva', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    expect(readThemePreference()).toBe('dark')
  })
})

describe('applyTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => vi.unstubAllGlobals())

  it('poe data-theme no html e grava a preferencia', () => {
    mockMatchMedia(false)
    applyTheme('dark')

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('resolve "sistema" pelo estado atual do sistema operacional', () => {
    mockMatchMedia(true)
    applyTheme('system')

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
  })

  it('desliga as transicoes durante a troca e religa depois de dois frames', async () => {
    mockMatchMedia(false)
    applyTheme('light')

    expect(document.documentElement.hasAttribute('data-theme-switching')).toBe(true)
    await flushDoubleRaf()
    expect(document.documentElement.hasAttribute('data-theme-switching')).toBe(false)
  })
})
