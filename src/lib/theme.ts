export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'fieldops-theme'
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system'
/** Disparado depois que `applyTheme` grava no localStorage, para quem le a
 *  preferencia com `useSyncExternalStore` (ex.: `ThemeSwitcher`) perceber a
 *  troca feita por outra instancia na mesma aba -- o evento `storage` do
 *  navegador so dispara nas OUTRAS abas, nunca na que escreveu. */
export const THEME_CHANGE_EVENT = 'fieldops-theme-change'

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

/** Le a preferencia salva, ou o padrao se nao houver nenhuma ou o storage falhar (aba privada). */
export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(stored) ? stored : DEFAULT_THEME_PREFERENCE
  } catch {
    return DEFAULT_THEME_PREFERENCE
  }
}

/** Qual tema resolvido ('light'|'dark') para uma preferencia e o estado atual do sistema. */
export function resolveTheme(preference: ThemePreference, prefersDark: boolean): 'light' | 'dark' {
  return preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference
}

/**
 * Aplica a preferencia: grava no localStorage e poe `data-theme` no `<html>`.
 *
 * `data-theme-switching` desliga por um frame as `transition-colors` da tela
 * inteira -- sem isso, cada componente anima no seu proprio tempo e a troca
 * de tema acontece em ondas, como se a pagina fosse pintada a rolo.
 */
export function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  root.setAttribute('data-theme-switching', '')
  root.setAttribute('data-theme', resolveTheme(preference, prefersDark))

  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Aba privada ou storage bloqueado: a preferencia so vale para esta carga.
  }

  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.removeAttribute('data-theme-switching')
    })
  })
}

/**
 * Script inline injetado no `<head>`, executado antes da primeira pintura
 * (guia "Preventing flash before hydration" do Next.js). Nao pode importar
 * nada: roda fora do bundle React, direto no HTML.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
  var p=localStorage.getItem('${THEME_STORAGE_KEY}');
  if(p!=='light'&&p!=='dark')p='${DEFAULT_THEME_PREFERENCE}';
  var d=p==='dark'||(p==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme',d?'dark':'light');
}catch(e){}})()`
