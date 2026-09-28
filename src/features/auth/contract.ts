import type { UserRole } from '@/lib/domain/user'

/**
 * Contrato de autenticacao da API, espelhando os DTOs do `AuthController` do
 * backend (`/api/v1/auth`).
 */
export type LoginRequest = {
  readonly email: string
  readonly password: string
}

/** Identidade publica devolvida pelo login e por `GET /auth/me`. */
export type AuthUser = {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: UserRole
}

export type LoginResponse = {
  readonly accessToken: string
  readonly refreshToken: string
  /** Validade do access token, em segundos. */
  readonly expiresIn: number
  readonly user: AuthUser
}

export type RefreshTokenRequest = {
  readonly refreshToken: string
}

/** Codigos de erro que a API usa na autenticacao (`AuthException`). */
export const AUTH_ERROR_CODES = {
  invalidCredentials: 'AUTH_INVALID_CREDENTIALS',
  inactiveUser: 'AUTH_USER_INACTIVE',
  invalidRefreshToken: 'AUTH_INVALID_REFRESH_TOKEN',
} as const
