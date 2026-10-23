'use client'

import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react'
import { IoAlertCircleOutline, IoArrowForward, IoInformationCircleOutline, IoMailOutline } from 'react-icons/io5'

import { SubmitButton } from '@/components/ui/form-actions'
import { TextField } from '@/components/ui/form-fields'
import { PasswordField } from '@/components/ui/password-field'
import { signIn, type SignInState } from '@/features/auth/actions'
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  hasLoginErrors,
  validateLogin,
  type LoginField,
  type LoginFieldErrors,
} from '@/features/auth/login-validation'

const INITIAL: SignInState = {}

const SUBMIT =
  'flex h-11 w-full items-center justify-center gap-2 rounded-field bg-brand-600 px-4 text-sm font-semibold text-neutral-0 transition-colors hover:bg-brand-700 active:bg-brand-800 disabled:cursor-wait disabled:bg-brand-400'

function firstInvalid(errors: LoginFieldErrors): LoginField | null {
  if (errors.email) return 'email'
  if (errors.password) return 'password'
  return null
}

/**
 * Formulario de acesso.
 *
 * A validacao roda aqui primeiro, para retorno imediato sem ida ao servidor, e
 * a Server Action valida de novo porque qualquer um pode invoca-la direto. Com
 * erro, o foco vai para o primeiro campo invalido -- quem usa teclado ou leitor
 * de tela nao precisa procurar o que corrigir. A mensagem geral, como credencial
 * recusada, e anunciada por `role="alert"` e devolve o foco a senha.
 *
 * O `redirect` segue escondido no formulario; quem decide se ele e aceitavel e
 * o servidor.
 */
export function LoginForm({ redirectTo, notice }: { redirectTo: string; notice?: string }) {
  const [state, action] = useActionState(signIn, INITIAL)
  const [clientErrors, setClientErrors] = useState<LoginFieldErrors | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const errors = clientErrors ?? state.fieldErrors ?? {}

  function focusField(field: LoginField) {
    formRef.current?.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus()
  }

  useEffect(() => {
    const invalid = firstInvalid(state.fieldErrors ?? {})
    if (invalid) {
      focusField(invalid)
    } else if (state.error) {
      focusField('password')
    }
  }, [state])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget)
    const found = validateLogin({ email: data.get('email'), password: data.get('password') })

    if (hasLoginErrors(found)) {
      event.preventDefault()
      setClientErrors(found)
      const invalid = firstInvalid(found)
      if (invalid) focusField(invalid)
      return
    }

    setClientErrors(null)
  }

  function clearError(field: LoginField) {
    if (clientErrors?.[field]) {
      setClientErrors({ ...clientErrors, [field]: undefined })
    }
  }

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="redirect" value={redirectTo} />

      {state.error && !clientErrors ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-field border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger"
        >
          <IoAlertCircleOutline aria-hidden className="mt-0.5 size-[18px] shrink-0" />
          <p>{state.error}</p>
        </div>
      ) : (
        notice && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-field border border-info/20 bg-info-soft px-3 py-2.5 text-sm text-info"
          >
            <IoInformationCircleOutline aria-hidden className="mt-0.5 size-[18px] shrink-0" />
            <p>{notice}</p>
          </div>
        )
      )}

      <TextField
        name="email"
        type="email"
        label="E-mail"
        icon={<IoMailOutline />}
        placeholder="nome@empresa.com.br"
        autoComplete="username"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={EMAIL_MAX_LENGTH}
        required
        defaultValue={state.email}
        error={errors.email}
        onChange={() => clearError('email')}
      />

      <PasswordField
        name="password"
        label="Senha"
        placeholder="Sua senha"
        autoComplete="current-password"
        maxLength={PASSWORD_MAX_LENGTH}
        required
        error={errors.password}
        onChange={() => clearError('password')}
      />

      <SubmitButton pendingLabel="Entrando…" className={SUBMIT}>
        Entrar
        <IoArrowForward aria-hidden className="size-4" />
      </SubmitButton>
    </form>
  )
}
