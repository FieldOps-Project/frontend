import { apiFetchFile } from '@/lib/api/client'
import { isApiError } from '@/lib/api/errors'
import { requireRole } from '@/lib/dal'
import { inspectionReference } from '@/lib/domain/inspection'
import { MANAGER_ROLES } from '@/lib/domain/user'
import { isId } from '@/lib/ids'
import { getAccessToken } from '@/lib/session'

const PDF = 'application/pdf'

function failure(status: number): Response {
  return new Response(null, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET(_request: Request, context: RouteContext<'/api/inspections/[inspectionId]/report'>): Promise<Response> {
  await requireRole(MANAGER_ROLES)

  const token = await getAccessToken()
  if (!token) return failure(401)

  const { inspectionId } = await context.params
  if (!isId(inspectionId)) return failure(404)

  try {
    const file = await apiFetchFile(`/inspections/${inspectionId}/report.pdf`, { token, accept: PDF })
    const type = file.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase()
    if (type !== PDF) {
      await file.body?.cancel()
      return failure(502)
    }
    return new Response(file.body, {
      headers: {
        'Content-Type': PDF,
        'Content-Disposition': `attachment; filename="relatorio-${inspectionReference(inspectionId)}.pdf"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    if (isApiError(error) && [401, 403, 404].includes(error.status)) return failure(error.status)
    if (isApiError(error)) return failure(502)
    throw error
  }
}
