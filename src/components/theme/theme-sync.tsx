'use client'

import { useLayoutEffect } from 'react'

import { applyTheme, readThemePreference, THEME_STORAGE_KEY } from '@/lib/theme'

/**
 * Mantem o `data-theme` do `<html>` correto depois da primeira pintura, sem
 * nenhuma interface propria. Nao faz parte do menu nem de Configuracoes: fica
 * montado em todo o painel, inclusive no login.
 *
 * Tres motivos para existir:
 * 1. Em Strict Mode (dev), o React redesenha o `<html>` a partir do JSX no
 *    remount de teste, o que apaga o `data-theme` que o script do `<head>`
 *    tinha posto. Reaplicar em `useLayoutEffect` devolve o valor certo antes
 *    da pintura seguinte (recomendacao do guia do Next.js).
 * 2. Com a preferencia "sistema", o tema tem que seguir o sistema operacional
 *    ao vivo, sem recarregar a pagina.
 * 3. Trocar o tema numa aba tem que refletir nas outras (evento `storage`).
 */
export function ThemeSync() {
  useLayoutEffect(() => {
    applyTheme(readThemePreference())

    const media = window.matchMedia('(prefers-color-scheme: dark)')

    function onSystemPreferenceChange() {
      if (readThemePreference() === 'system') applyTheme('system')
    }

    function onStorage(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY) applyTheme(readThemePreference())
    }

    media.addEventListener('change', onSystemPreferenceChange)
    window.addEventListener('storage', onStorage)

    return () => {
      media.removeEventListener('change', onSystemPreferenceChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return null
}
