import { apiFetch, apiFetchFile } from '@/lib/api/client'
import { isApiError } from '@/lib/api/errors'
import { FIELD_FINDINGS_ROLES } from '@/lib/domain/non-conformity'
import { isId } from '@/lib/ids'
import { getAccessToken, type SessionUser } from '@/lib/session'

const PRIVATE_CACHE = 'private, no-cache'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const SAFE_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
}

function status(code: number): Response {
  return new Response(null, { status: code, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET(_request: Request, context: RouteContext<'/api/evidence/[evidenceId]'>): Promise<Response> {
  const token = await getAccessToken()
  if (!token) return status(401)

  let user: SessionUser
  try {
    user = await apiFetch<SessionUser>('/auth/me', { token })
  } catch (error) {
    if (isApiError(error) && error.status === 401) return status(401)
    throw error
  }
  if (!FIELD_FINDINGS_ROLES.includes(user.role)) return status(403)

  const { evidenceId } = await context.params
  if (!isId(evidenceId)) return status(404)

  try {
    const file = await apiFetchFile(`/evidence/${evidenceId}`, { token })
    const type = file.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase() ?? ''
    if (!ALLOWED_TYPES.includes(type)) {
      await file.body?.cancel()
      return status(502)
    }
    const etag = file.headers.get('ETag')
    return new Response(file.body, {
      headers: { 'Content-Type': type, 'Cache-Control': PRIVATE_CACHE, ...SAFE_HEADERS, ...(etag ? { ETag: etag } : {}) },
    })
  } catch (error) {
    if (isApiError(error) && [401, 403, 404].includes(error.status)) return status(error.status)
    if (isApiError(error)) return status(502)
    throw error
  }
}
