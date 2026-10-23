/**
 * Classes dos botoes e links de acao. Ficam num lugar so para que "Novo
 * cliente" e "Novo usuario" tenham exatamente a mesma cara.
 */
export const BUTTON_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-field bg-brand-600 px-3 py-2 text-sm font-medium text-neutral-0 transition-colors hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70'

export const BUTTON_SECONDARY =
  'inline-flex items-center justify-center gap-2 rounded-field border border-neutral-200 bg-neutral-0 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-wait disabled:opacity-70'

export const BUTTON_DANGER =
  'inline-flex items-center justify-center gap-2 rounded-field border border-danger/30 bg-neutral-0 px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft disabled:cursor-wait disabled:opacity-70'

export const LINK = 'font-medium text-brand-700 hover:text-brand-800 hover:underline'

export const INPUT =
  'w-full rounded-field border border-neutral-200 bg-neutral-0 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-neutral-100 disabled:text-neutral-500 aria-[invalid=true]:border-danger'

/**
 * Caixa de campo com conteudo ao lado do valor (icone, botao de ver a senha).
 * A borda e o anel ficam na caixa inteira, que acende quando o input dentro
 * dela recebe foco; o input em si nao desenha contorno.
 */
export const INPUT_BOX =
  'flex w-full items-center gap-2.5 rounded-field border border-neutral-200 bg-neutral-0 px-3 text-sm transition-colors focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100 has-[:disabled]:bg-neutral-100 has-[[aria-invalid=true]]:border-danger'

export const INPUT_BARE =
  'min-w-0 flex-1 bg-transparent py-2 text-neutral-900 outline-none placeholder:text-neutral-400 focus-visible:outline-none disabled:text-neutral-500'

export const CARD = 'rounded-card border border-neutral-200 bg-neutral-0'
