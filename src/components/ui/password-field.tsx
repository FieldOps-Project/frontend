'use client'

import { useState, type ComponentPropsWithoutRef } from 'react'
import { IoEyeOffOutline, IoEyeOutline, IoLockClosedOutline } from 'react-icons/io5'

import { TextField } from '@/components/ui/text-field'

type PasswordFieldProps = Omit<ComponentPropsWithoutRef<typeof TextField>, 'type' | 'icon' | 'trailing'>

/**
 * Campo de senha com o botao de mostrar e esconder o valor.
 *
 * Mostrar a senha reduz erro de digitacao, que e a causa mais comum de login
 * recusado. O botao e `type="button"` para nao enviar o formulario, anuncia o
 * estado por `aria-pressed` e tem rotulo proprio, porque um icone de olho sozinho
 * nao diz nada a um leitor de tela.
 */
export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      icon={<IoLockClosedOutline />}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-controls={props.id}
          className="-mr-1.5 grid size-8 shrink-0 place-items-center rounded-field text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          {visible ? (
            <IoEyeOffOutline aria-hidden className="size-[18px]" />
          ) : (
            <IoEyeOutline aria-hidden className="size-[18px]" />
          )}
        </button>
      }
    />
  )
}
