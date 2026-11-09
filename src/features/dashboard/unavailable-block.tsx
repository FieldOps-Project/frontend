import { MdOutlineCloudOff } from 'react-icons/md'

/**
 * Bloco cujo endpoint a API ainda nao publica (indicadores: backend #36; nao
 * conformidades: backend #23). So aquele bloco avisa; o resto do painel segue
 * funcionando.
 */
export function UnavailableBlock({ title, description }: { title: string; description: string }) {
  return (
    <section
      role="status"
      className="flex items-start gap-4 rounded-lg border border-dashed border-neutral-300 bg-neutral-0 px-5 py-5 sm:px-6"
    >
      <MdOutlineCloudOff aria-hidden className="mt-0.5 size-6 shrink-0 text-neutral-400" />
      <span className="flex flex-col gap-1">
        <span className="text-[15px] font-semibold text-neutral-900">{title}</span>
        <span className="text-sm text-neutral-600">{description}</span>
      </span>
    </section>
  )
}
