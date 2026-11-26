import 'server-only'

import { cache } from 'react'

import { load } from '@/lib/dal'
import type { NonConformityRecord } from '@/lib/domain/non-conformity'
import { MAX_PAGE_SIZE, type Page } from '@/lib/domain/page'

export const loadInspectionNonConformityRecords = cache(
  async (inspectionId: string): Promise<readonly NonConformityRecord[]> => {
    const page = await load<Page<NonConformityRecord>>('/non-conformities', { inspectionId, size: MAX_PAGE_SIZE })
    return page.content
  },
)
