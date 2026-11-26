'use client'

import { MdOutlineFileDownload } from 'react-icons/md'

import { auditCsv } from '@/features/audit/audit-csv'
import type { AuditEvent } from '@/lib/domain/audit'

const EXPORT_BUTTON =
  'inline-flex h-12 items-center gap-2 rounded-field border border-neutral-300 bg-neutral-0 px-5 text-base font-semibold text-neutral-900 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50'

export function AuditExportButton({ events, filename }: { events: readonly AuditEvent[]; filename: string }) {
  function download() {
    const url = URL.createObjectURL(new Blob([auditCsv(events)], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button type="button" onClick={download} disabled={events.length === 0} className={EXPORT_BUTTON}>
      <MdOutlineFileDownload aria-hidden className="size-5" />
      Exportar CSV
    </button>
  )
}
