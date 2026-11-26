import 'server-only'

import { load } from '@/lib/dal'
import type { PublishedTemplateVersion } from '@/lib/domain/inspection-scheduling'
import { MAX_PAGE_SIZE, type Page } from '@/lib/domain/page'

type TemplateRecord = {
  readonly id: string
  readonly title: string
  readonly category: string
}

type TemplateVersionRecord = {
  readonly id: string
  readonly versionNumber: number
  readonly activeForNewInspections: boolean
}

async function schedulableVersionsOf(template: TemplateRecord): Promise<readonly PublishedTemplateVersion[]> {
  const versions = await load<readonly TemplateVersionRecord[]>(`/inspection-templates/${template.id}/versions`)

  return versions
    .filter((version) => version.activeForNewInspections)
    .map((version) => ({
      versionId: version.id,
      templateTitle: template.title,
      category: template.category,
      versionNumber: version.versionNumber,
    }))
}

export async function loadPublishedTemplateVersions(): Promise<readonly PublishedTemplateVersion[]> {
  const templates = await load<Page<TemplateRecord>>('/inspection-templates', { status: 'ACTIVE', size: MAX_PAGE_SIZE })
  const versions = await Promise.all(templates.content.map(schedulableVersionsOf))

  return versions.flat()
}
