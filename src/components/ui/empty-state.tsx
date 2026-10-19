import type { ReactNode } from 'react'
import { IoFileTrayOutline } from 'react-icons/io5'

/** Lista vazia e resultado valido, nao erro: orienta o proximo passo. */
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <IoFileTrayOutline aria-hidden className="size-8 text-neutral-300" />
      <p className="text-sm font-medium text-neutral-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-neutral-500">{description}</p>}
      {action}
    </div>
  )
}
