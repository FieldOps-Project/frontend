import { demoEvidence, demoEvidenceSvg } from '@/features/evidence/evidence-fixture'
import { apiFetch, apiFetchFile } from '@/lib/api/client'
import { isApiError } from '@/lib/api/errors'
import { EVIDENCE_VARIANTS, type EvidenceVariant } from '@/lib/domain/evidence'
import { canUsePanel } from '@/lib/domain/user'
import { isId } from '@/lib/ids'
import { getAccessToken, type SessionUser } from '@/lib/session'

/**
 * A imagem e da pessoa logada: nada de cache compartilhado, e o navegador
 * pergunta de novo a cada uso. Com `max-age`, outra pessoa no mesmo computador
 * veria a foto pelo cache depois da troca de usuario, sem passar pela checagem.
 */
const PRIVATE_CACHE = 'private, no-cache'

/** So foto comum chega ao navegador: SVG pode carregar script. */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Mesmo aberta direto numa aba, a resposta nao executa nada: o navegador nao
 * adivinha o tipo e a CSP bloqueia script e qualquer carga externa.
 */
const SAFE_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
}

function status(code: number): Response {
  return new Response(null, { status: code, headers: { 'Cache-Control': 'no-store' } })
}

function variantOf(request: Request): EvidenceVariant {
  const value = new URL(request.url).searchParams.get('variant')
  return (EVIDENCE_VARIANTS as readonly string[]).includes(value ?? '') ? (value as EvidenceVariant) : 'thumbnail'
}

/**
 * Imagem da evidencia (issue #19). As fotos nao tem URL publica: este Route
 * Handler e ponto de entrada proprio, entao confere a sessao na API antes de
 * qualquer coisa e responde 401 sem ela e 403 fora do painel. O escopo -- se
 * esta pessoa pode ver esta inspecao -- e decidido pela API, que devolve 403 ou
 * 404 e esse codigo e repassado. Miniatura por padrao; `?variant=original` so
 * na ampliacao.
 *
 * Contrato pedido ao backend: `GET /evidence/{id}/file?variant=thumbnail|original`.
 */
export async function GET(request: Request, context: RouteContext<'/api/evidence/[evidenceId]'>): Promise<Response> {
  const token = await getAccessToken()
  if (!token) return status(401)

  let user: SessionUser
  try {
    user = await apiFetch<SessionUser>('/auth/me', { token })
  } catch (error) {
    if (isApiError(error) && error.status === 401) return status(401)
    throw error
  }
  if (!canUsePanel(user.role)) return status(403)

  const { evidenceId } = await context.params
  if (!isId(evidenceId)) return status(404)
  const variant = variantOf(request)

  if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
    const evidence = demoEvidence(evidenceId)
    if (evidence) {
      if (evidence.uploadedAt === null) return status(404)
      return new Response(demoEvidenceSvg(evidence, variant), {
        headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': PRIVATE_CACHE, ...SAFE_HEADERS },
      })
    }
  }

  try {
    const file = await apiFetchFile(`/evidence/${evidenceId}/file`, { token, query: { variant } })
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
