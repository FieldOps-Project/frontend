import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type TextFieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'id' | 'className'> & {
  readonly id: string
  readonly label: string
  /** Icone decorativo a esquerda do valor. */
  readonly icon?: ReactNode
  /** Controle extra a direita, dentro da caixa -- o botao de ver a senha, por exemplo. */
  readonly trailing?: ReactNode
  readonly error?: string
}

/**
 * Campo de formulario do painel: rotulo visivel, caixa com icone e mensagem de
 * erro logo abaixo.
 *
 * O rotulo e um `<label>` de verdade, ligado pelo `id` -- placeholder nao
 * substitui rotulo, some quando a pessoa digita e leitor de tela nem sempre o
 * anuncia. O erro fica associado ao campo por `aria-describedby` e marca o
 * campo com `aria-invalid`, e aparece em texto, nunca so pela cor da borda.
 */
export function TextField({ id, label, icon, trailing, error, ...inputProps }: TextFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-neutral-900">
        {label}
      </label>

      <div
        className={`flex h-11 items-center gap-2.5 rounded-field border bg-neutral-0 px-3 transition-colors focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100 ${
          error ? 'border-danger' : 'border-neutral-300 hover:border-neutral-400'
        }`}
      >
        {icon && (
          <span aria-hidden className="flex shrink-0 text-neutral-500 [&>svg]:size-[18px]">
            {icon}
          </span>
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus-visible:outline-none"
          {...inputProps}
        />
        {trailing}
      </div>

      {error && (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
