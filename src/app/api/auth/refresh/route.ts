import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

import { isApiError } from '@/lib/api/errors'
import { safeRedirect } from '@/lib/redirect'
import { loginPath } from '@/lib/session-cookies'
import { markRefreshed, refreshTokens, type RefreshOutcome } from '@/lib/session'

async function renew(): Promise<RefreshOutcome | 'unavailable'> {
  try {
    return await refreshTokens()
  } catch (error) {
    if (isApiError(error)) {
      return 'unavailable'
    }
    throw error
  }
}

export async function GET(request: NextRequest): Promise<never> {
  const destination = safeRedirect(request.nextUrl.searchParams.get('redirect'))
  const outcome = await renew()

  if (outcome === 'unavailable') {
    redirect(`/login?unavailable=1&redirect=${encodeURIComponent(destination)}`)
  }

  if (outcome.kind === 'ended') {
    redirect(loginPath(outcome, destination))
  }

  await markRefreshed()
  redirect(destination)
}
