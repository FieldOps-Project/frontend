import { redirect } from 'next/navigation'

import type { Page } from '@/lib/domain/page'
import { withParams } from '@/lib/search-params'

export function lastPageHref(
  page: Page<unknown>,
  pathname: string,
  params: Record<string, string | undefined>,
): string | null {
  if (page.content.length > 0 || page.totalElements === 0) {
    return null
  }
  return withParams(pathname, { ...params, page: Math.max(page.totalPages - 1, 0) })
}

export function redirectPastLastPage(
  page: Page<unknown>,
  pathname: string,
  params: Record<string, string | undefined>,
): void {
  const href = lastPageHref(page, pathname, params)
  if (href) {
    redirect(href)
  }
}

export function rangeLabel(page: Page<unknown>): string {
  if (page.content.length === 0) {
    return `0 de ${page.totalElements}`
  }
  const from = page.page * page.size + 1
  return `${from}–${from + page.content.length - 1} de ${page.totalElements}`
}
