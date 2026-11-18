import Link from 'next/link'
import type { ReactNode } from 'react'
import { MdArrowBack, MdChevronRight, MdOutlineCameraAlt, MdOutlineChecklist, MdOutlineInfo, MdOutlineReportProblem } from 'react-icons/md'

import { SeverityBadge } from '@/features/dashboard/severity-badge'
import {
  NON_CONFORMITY_STATUS_LABELS,
  type NonConformityDetail,
  type NonConformityListItem,
} from '@/lib/domain/non-conformity'
import { formatDateTime, orDash } from '@/lib/format'

const CARD = 'rounded-card border border-neutral-200 bg-neutral-0'
const LABEL = 'text-xs font-medium tracking-wider text-neutral-700 uppercase'

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <dt className={LABEL}>{label}</dt>
      <dd className="text-base break-words text-neutral-900">{children}</dd>
    </div>
  )
}

function SectionTitle({ id, icon, children }: { id: string; icon: ReactNode; children: ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-3 text-lg font-semibold text-neutral-900">
      <span aria-hidden className="text-neutral-600 [&>svg]:size-6">
        {icon}
      </span>
      {children}
    </h2>
  )
}

/** Cabecalho: titulo, criticidade escrita (RN-054) e o unico estado do MVP. */
export function NonConformityHeader({ item }: { item: NonConformityDetail }) {
  return (
    <header className="flex flex-col gap-4 border-b border-neutral-200 pb-6">
      <Link href="/non-conformities" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
        <MdArrowBack aria-hidden className="size-4" />
        Não conformidades
      </Link>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SeverityBadge severity={item.severity} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-[13px] font-medium text-neutral-700">
            <span className="sr-only">Situação: </span>
            {NON_CONFORMITY_STATUS_LABELS[item.status]}
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">{item.title}</h1>
        <p className="max-w-3xl text-base text-neutral-700">{item.description}</p>
      </div>
    </header>
  )
}

/** Onde e quando o achado foi registrado: inspecao (RN-052), local e horarios de campo e do servidor. */
export function NonConformityContext({ item }: { item: NonConformityDetail }) {
  return (
    <section aria-labelledby="nc-context-title" className={`${CARD} flex flex-col gap-6 p-6`}>
      <SectionTitle id="nc-context-title" icon={<MdOutlineInfo />}>
        Registro
      </SectionTitle>
      <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Inspeção">
          <Link href={`/inspections/${item.inspectionId}`} className="font-medium text-brand-700 hover:underline">
            {item.inspectionCode}
          </Link>
        </Detail>
        <Detail label="Cliente">{item.clientName}</Detail>
        <Detail label="Local">{item.siteName}</Detail>
        <Detail label="Equipamento">{item.equipmentName ?? 'Inspeção geral do local'}</Detail>
        <Detail label="Registrada por">{item.createdByName}</Detail>
        <Detail label="Horário do dispositivo">{formatDateTime(item.createdAtDevice)}</Detail>
        <Detail label="Recebida pelo servidor">
          {item.serverReceivedAt ? formatDateTime(item.serverReceivedAt) : <span className="text-warning">Aguardando sincronização</span>}
        </Detail>
      </dl>
    </section>
  )
}

/**
 * Pergunta, resposta e observacao que originaram o achado (RN-053, issue #20):
 * sem esse encadeamento o supervisor teria de procurar o item no checklist.
 */
export function NonConformityOrigin({ item }: { item: NonConformityDetail }) {
  const origin = item.origin

  return (
    <section aria-labelledby="nc-origin-title" className={`${CARD} flex flex-col gap-5 p-6`}>
      <SectionTitle id="nc-origin-title" icon={<MdOutlineChecklist />}>
        Item de origem
      </SectionTitle>
      {origin ? (
        <dl className="flex flex-col gap-5">
          <Detail label="Pergunta">
            <span className="font-medium">{origin.itemCode}</span> {origin.question}
          </Detail>
          <Detail label="Resposta do técnico">
            <span className="inline-flex rounded-field border border-danger/30 bg-danger-soft px-3 py-1 font-medium text-danger">
              {orDash(origin.answer)}
            </span>
          </Detail>
          <Detail label="Observação">
            {origin.observation ?? <span className="text-neutral-600">O técnico não deixou observação.</span>}
          </Detail>
        </dl>
      ) : (
        <p className="text-sm text-neutral-600">
          Registrada sem item específico do checklist: o achado vale para a inspeção como um todo.
        </p>
      )}
    </section>
  )
}

/**
 * Evidencias da nao conformidade. As fotos aparecem como marcadores ate a
 * visualizacao de evidencias (issue #19) trazer a imagem.
 */
export function NonConformityEvidences({ item }: { item: NonConformityDetail }) {
  return (
    <section aria-labelledby="nc-evidence-title" className={`${CARD} flex flex-col gap-5 p-6`}>
      <SectionTitle id="nc-evidence-title" icon={<MdOutlineCameraAlt />}>
        Evidências
        <span className="text-sm font-normal text-neutral-600">({item.evidences.length})</span>
      </SectionTitle>
      {item.evidences.length === 0 ? (
        <p className="text-sm text-neutral-600">Nenhuma evidência anexada a esta não conformidade.</p>
      ) : (
        <ul aria-label="Fotografias da não conformidade" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {item.evidences.map((photo, index) => (
            <li key={photo.id} className="flex flex-col gap-2">
              <div className="grid aspect-[4/3] place-items-center rounded-field border border-neutral-200 bg-neutral-100 text-neutral-400">
                <MdOutlineCameraAlt aria-hidden className="size-8" />
              </div>
              <span className="text-sm text-neutral-800">{photo.description ?? `Foto ${index + 1}`}</span>
              <span className="text-xs text-neutral-600">Capturada em {formatDateTime(photo.capturedAtDevice)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Bloco do detalhe da inspecao (issue #20): achados da inspecao, do mais grave para o menos grave. */
export function InspectionNonConformities({ items }: { items: readonly NonConformityListItem[] | null }) {
  return (
    <section aria-labelledby="inspection-nc-title" className={`${CARD} flex flex-col gap-4 overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6">
        <SectionTitle id="inspection-nc-title" icon={<MdOutlineReportProblem />}>
          Não conformidades
        </SectionTitle>
        {items && items.length > 0 && (
          <span className="rounded-full border border-danger/30 bg-danger-soft px-3 py-1 text-sm text-danger">
            {items.length} {items.length === 1 ? 'registrada' : 'registradas'}
          </span>
        )}
      </div>
      {items === null ? (
        <p className="px-6 pb-6 text-sm text-neutral-600">
          Não conformidades indisponíveis no momento: a API ainda não publica esta consulta.
        </p>
      ) : items.length === 0 ? (
        <p className="px-6 pb-6 text-sm text-neutral-600">Nenhuma não conformidade registrada nesta inspeção.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 border-t border-neutral-200">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/non-conformities/${item.id}`}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-neutral-50"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-base text-neutral-900">
                    {item.itemCode && <span className="font-medium">{item.itemCode} </span>}
                    {item.title}
                  </span>
                  <span className="line-clamp-1 text-sm text-neutral-600">{item.description}</span>
                </span>
                <SeverityBadge severity={item.severity} />
                <MdChevronRight aria-hidden className="size-6 shrink-0 text-neutral-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
