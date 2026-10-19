import type { ReactNode } from 'react'

/**
 * Tabela das listagens. A rolagem horizontal fica dentro do proprio container:
 * tabela larga nunca empurra a pagina inteira para o lado (RNF-007).
 */
export function Table({ caption, head, children }: { caption: string; head: readonly string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium tracking-wide text-neutral-500 uppercase">
            {head.map((label, index) => (
              <th
                key={label || index}
                scope="col"
                className={`px-4 py-3 font-medium ${index === head.length - 1 && label === '' ? 'w-1' : ''}`}
              >
                {label === '' ? <span className="sr-only">Ações</span> : label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">{children}</tbody>
      </table>
    </div>
  )
}

export function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle text-neutral-700 ${className}`}>{children}</td>
}
