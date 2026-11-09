import type { IconType } from 'react-icons'
import { MdErrorOutline, MdOutlineInfo, MdOutlineWarningAmber } from 'react-icons/md'

import { SEVERITY_LABELS, type Severity } from '@/lib/domain/inspection-review'

const STYLES: Record<Severity, { readonly className: string; readonly icon: IconType }> = {
  CRITICAL: { className: 'border-danger bg-danger text-neutral-0', icon: MdErrorOutline },
  HIGH: { className: 'border-tertiary-700 bg-tertiary-700 text-neutral-0', icon: MdOutlineWarningAmber },
  MEDIUM: { className: 'border-neutral-300 bg-neutral-100 text-neutral-800', icon: MdOutlineInfo },
  LOW: { className: 'border-neutral-200 bg-neutral-0 text-neutral-600', icon: MdOutlineInfo },
}

/**
 * Criticidade da nao conformidade (RN-054). O rotulo escrito e a informacao;
 * cor e icone so reforcam, para quem nao distingue as cores.
 */
export function SeverityBadge({ severity }: { severity: Severity }) {
  const style = STYLES[severity]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium tracking-wide whitespace-nowrap uppercase ${style.className}`}
    >
      <style.icon aria-hidden className="size-4 shrink-0" />
      {SEVERITY_LABELS[severity]}
    </span>
  )
}
