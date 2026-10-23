'use client'

import { useState } from 'react'
import { IoEyeOffOutline, IoEyeOutline, IoLockClosedOutline } from 'react-icons/io5'

import { TextField, type TextFieldProps } from '@/components/ui/form-fields'

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'icon' | 'trailing'>

/**
 * Campo de senha com botao para mostrar o que foi digitado.
 *
 * Quem digita em teclado de celular ou com pressa erra a senha sem perceber; ver
 * o valor evita a tentativa repetida. O botao e `type="button"` para nao
 * enviar o formulario, anuncia o estado por `aria-pressed` e aponta o campo que
 * controla por `aria-controls`.
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
          aria-controls={`field-${props.name}`}
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
