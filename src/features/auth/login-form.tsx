'use client'

import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react'
import { IoAlertCircleOutline, IoArrowForward, IoMailOutline } from 'react-icons/io5'

import { PasswordField } from '@/components/ui/password-field'
import { SubmitButton } from '@/components/ui/submit-button'
import { TextField } from '@/components/ui/text-field'
import { signIn, type LoginState } from '@/features/auth/login'
import { loginSchema } from '@/schemas/login'

type FieldErrors = NonNullable<LoginState['fieldErrors']>

function validate(form: HTMLFormElement): FieldErrors | null {
  const data = new FormData(form)
  const parsed = loginSchema.safeParse({
    email: data.get('email') ?? '',
    password: data.get('password') ?? '',
  })
  if (parsed.success) return null

  const errors: FieldErrors = {}
  for (const issue of parsed.error.issues) {
    const field = issue.path[0]
    if ((field === 'email' || field === 'password') && !errors[field]) {
      errors[field] = issue.message
    }
  }
  return errors
}

/**
 * Formulario de acesso.
 *
 * A validacao roda aqui primeiro, para retorno imediato sem ida ao servidor, e
 * a Server Action valida de novo porque qualquer um pode invoca-la direto. Com
 * erro, o foco vai para o primeiro campo invalido -- quem usa teclado ou leitor
 * de tela nao precisa procurar o que corrigir. A mensagem geral, como credencial
 * recusada, e anunciada por `role="alert"`.
 *
 * O `redirect` segue escondido no formulario; quem decide se ele e aceitavel e
 * o servidor.
 */
export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState(signIn, {})
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const errors = clientErrors ?? state.fieldErrors ?? {}

  useEffect(() => {
    const invalid = state.fieldErrors?.email ? 'email' : state.fieldErrors?.password ? 'password' : null
    if (invalid) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${invalid}"]`)?.focus()
    } else if (state.message) {
      formRef.current?.querySelector<HTMLInputElement>('[name="password"]')?.focus()
    }
  }, [state])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const found = validate(event.currentTarget)
    setClientErrors(found)

    if (found) {
      event.preventDefault()
      const first = found.email ? 'email' : 'password'
      event.currentTarget.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus()
    }
  }

  function clearError(field: keyof FieldErrors) {
    if (clientErrors?.[field]) {
      setClientErrors({ ...clientErrors, [field]: undefined })
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
    >
      {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

      {state.message && !clientErrors && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-field border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger"
        >
          <IoAlertCircleOutline aria-hidden className="mt-0.5 size-[18px] shrink-0" />
          <p>{state.message}</p>
        </div>
      )}

      <TextField
        id="login-email"
        name="email"
        type="email"
        label="E-mail"
        icon={<IoMailOutline />}
        placeholder="nome@empresa.com.br"
        autoComplete="username"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={320}
        required
        defaultValue={state.email}
        error={errors.email}
        onChange={() => clearError('email')}
      />

      <PasswordField
        id="login-password"
        name="password"
        label="Senha"
        placeholder="Sua senha"
        autoComplete="current-password"
        maxLength={128}
        required
        error={errors.password}
        onChange={() => clearError('password')}
      />

      <SubmitButton pendingLabel="Entrando…">
        Entrar
        <IoArrowForward aria-hidden className="size-4" />
      </SubmitButton>
    </form>
  )
}
