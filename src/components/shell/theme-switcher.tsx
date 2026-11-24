'use client'

import { useId, useSyncExternalStore, type KeyboardEvent } from 'react'
import { MdOutlineBrightnessAuto, MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md'

import {
  applyTheme,
  DEFAULT_THEME_PREFERENCE,
  readThemePreference,
  THEME_CHANGE_EVENT,
  type ThemePreference,
} from '@/lib/theme'

const OPTIONS = [
  { value: 'light', label: 'Claro', icon: MdOutlineLightMode },
  { value: 'dark', label: 'Escuro', icon: MdOutlineDarkMode },
  { value: 'system', label: 'Sistema', icon: MdOutlineBrightnessAuto },
] as const satisfies ReadonlyArray<{ value: ThemePreference; label: string; icon: typeof MdOutlineLightMode }>

function subscribe(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange)
  }
}

function getServerSnapshot(): ThemePreference {
  return DEFAULT_THEME_PREFERENCE
}

/**
 * Alternador de Aparencia: claro, escuro ou sistema (padrao), no menu do
 * avatar e em Configuracoes.
 *
 * E um `radiogroup` (WAI-ARIA Radio Group Pattern), nao 3 botoes soltos: so
 * uma opcao fica marcada por vez, tabulacao para no item marcado (roving
 * tabindex) e as setas movem e aplicam a selecao.
 *
 * A preferencia vem de `useSyncExternalStore`, lendo o `localStorage`: no
 * servidor ela e sempre "sistema" (`getServerSnapshot`), igual ao primeiro
 * valor que o cliente tambem ve antes de hidratar, entao nao ha divergencia
 * de hidratacao. Depois de montado, o hook acompanha tanto o evento
 * `storage` (troca feita em outra aba) quanto `fieldops-theme-change`
 * (troca feita por outra instancia do alternador nesta mesma aba -- o menu do
 * avatar e Configuracoes, por exemplo). O tema da pagina em si nao depende
 * disto: quem evita a piscada e o script do `<head>` (`ThemeSync`); aqui e so
 * sobre qual botao aparece marcado.
 *
 * `compact` troca o rotulo por so o icone com `title`, para caber na faixa
 * estreita do menu do avatar.
 */
export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const preference = useSyncExternalStore(subscribe, readThemePreference, getServerSnapshot)
  const groupId = useId()

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()

    const direction = event.key === 'ArrowRight' ? 1 : -1
    const next = OPTIONS[(index + direction + OPTIONS.length) % OPTIONS.length]
    if (!next) return

    applyTheme(next.value)
    document.getElementById(`${groupId}-${next.value}`)?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Aparência"
      className={`inline-flex rounded-field border border-neutral-200 ${compact ? 'gap-0.5 p-0.5' : 'gap-1 p-1'}`}
    >
      {OPTIONS.map((option, index) => {
        const checked = preference === option.value
        const Icon = option.icon

        return (
          <button
            key={option.value}
            id={`${groupId}-${option.value}`}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            title={option.label}
            aria-label={compact ? option.label : undefined}
            onClick={() => applyTheme(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`inline-flex items-center gap-1.5 rounded-field px-2.5 py-1.5 text-sm font-medium transition-colors ${
              checked ? 'bg-brand-600 text-neutral-0' : 'text-neutral-600 hover:bg-surface-hover'
            }`}
          >
            <Icon aria-hidden className="size-4" />
            {!compact && option.label}
          </button>
        )
      })}
    </div>
  )
}
