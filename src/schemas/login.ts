import { z } from 'zod'

/**
 * Validacao do formulario de acesso.
 *
 * Roda no navegador, para retorno imediato, e de novo na Server Action, que e
 * um ponto de entrada publico. Os limites sao os mesmos do `LoginRequest` da
 * API -- e-mail valido de ate 320 caracteres, senha de ate 128 -- para que o
 * formulario nunca aceite algo que o backend recusaria.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Informe o e-mail.')
    .max(320, 'O e-mail deve ter no máximo 320 caracteres.')
    .pipe(z.email('Informe um e-mail válido.')),
  password: z
    .string()
    .min(1, 'Informe a senha.')
    .max(128, 'A senha deve ter no máximo 128 caracteres.'),
})

export type LoginInput = z.infer<typeof loginSchema>
