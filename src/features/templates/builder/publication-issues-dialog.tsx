'use client'

import { useEffect, useRef } from 'react'
import { MdCheckCircleOutline, MdChevronRight, MdClose, MdOutlineErrorOutline } from 'react-icons/md'

import { issueAnchor, type PublicationIssue, type IssueTarget } from '@/lib/domain/template-publication'

/**
 * Leva ao ponto da pendencia no construtor e o destaca por alguns segundos
 * (issue #15: "cada pendencia leva ao ponto exato do construtor").
 */
export function jumpToIssue(target: IssueTarget): void {
  const anchor = document.getElementById(issueAnchor(target))
  const element = anchor?.closest('section, li, aside') ?? anchor
  if (!(element instanceof HTMLElement)) return

  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  element.dataset.highlight = 'true'
  window.setTimeout(() => {
    delete element.dataset.highlight
  }, 2400)
}

/**
 * Lista completa das pendencias que impedem publicar, com link para cada
 * ponto. Sem pendencias, confirma que o modelo pode ser publicado.
 */
export function PublicationIssuesDialog({
  issues,
  message,
  onClose,
}: {
  issues: readonly PublicationIssue[]
  /** Texto do topo, quando a lista veio de uma tentativa de publicar. */
  message?: string
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Foco no fechar so ao abrir: refazer a cada renderizacao roubaria o foco.
  useEffect(() => {
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div role="presentation" onClick={onClose} className="absolute inset-0 bg-neutral-900/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="publication-issues-title"
        className="relative flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-neutral-300 bg-neutral-0 shadow-xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-neutral-200 px-5 py-4">
          <h2 id="publication-issues-title" className="text-lg font-semibold text-neutral-950">
            {issues.length === 0 ? 'Pronto para publicar' : 'Pendências para publicar'}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-9 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100"
          >
            <MdClose aria-hidden className="size-5" />
          </button>
        </header>

        {issues.length === 0 ? (
          <p className="flex items-start gap-3 px-5 py-6 text-sm text-neutral-700">
            <MdCheckCircleOutline aria-hidden className="size-6 shrink-0 text-success" />
            Nenhuma pendência: o modelo pode ser publicado.
          </p>
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto px-5 py-4">
            <p className="text-sm text-neutral-700">
              {message ?? 'Corrija os pontos abaixo para publicar.'} {issues.length === 1 ? '1 pendência' : `${issues.length} pendências`}:
            </p>
            <ul className="flex flex-col gap-2">
              {issues.map((issue, index) => (
                <li key={`${issue.message}-${index}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      jumpToIssue(issue.target)
                    }}
                    className="flex w-full items-start gap-3 rounded-md border border-danger/20 bg-danger-soft/40 px-3 py-2.5 text-left text-sm text-neutral-900 hover:border-danger/40"
                  >
                    <MdOutlineErrorOutline aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
                    <span className="min-w-0 flex-1">{issue.message}</span>
                    <MdChevronRight aria-hidden className="mt-0.5 size-5 shrink-0 text-neutral-400" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
