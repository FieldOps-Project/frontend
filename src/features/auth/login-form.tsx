'use client'

import { useActionState, useState } from 'react'
import { IoEyeOffOutline, IoEyeOutline, IoLogInOutline } from 'react-icons/io5'

import { signIn, type SignInState } from '@/features/auth/actions'

const INITIAL: SignInState = {}

const INPUT =
  'w-full rounded-field border border-neutral-200 bg-neutral-0 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none'

export function LoginForm({ redirectTo, notice }: { redirectTo: string; notice?: string }) {
  const [state, action, pending] = useActionState(signIn, INITIAL)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="redirect" value={redirectTo} />

      {state.error ? (
        <p role="alert" className="rounded-field bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : (
        notice && (
          <p role="status" className="rounded-field bg-info-soft px-3 py-2 text-sm text-info">
            {notice}
          </p>
        )
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-neutral-700">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          placeholder="voce@empresa.com"
          className={INPUT}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-neutral-700">
          Senha
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className={`${INPUT} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 grid w-10 place-items-center text-neutral-400 hover:text-neutral-700"
          >
            {showPassword ? (
              <IoEyeOffOutline aria-hidden className="size-[18px]" />
            ) : (
              <IoEyeOutline aria-hidden className="size-[18px]" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-field bg-brand-600 px-3 py-2.5 text-sm font-medium text-neutral-0 transition-colors hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
      >
        <IoLogInOutline aria-hidden className="size-[18px]" />
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
