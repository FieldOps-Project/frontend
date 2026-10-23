import { MdPrecisionManufacturing } from 'react-icons/md'

/**
 * Marca do FieldOps: o braco robotico da tela de acesso do aplicativo de campo,
 * na cor primaria sobre um quadrado neutro.
 *
 * Vem de um icone vetorial em vez de imagem porque o painel precisa dele em
 * varios tamanhos -- menu, gaveta, tela de acesso -- e porque assim a cor sai
 * dos tokens em vez de ficar congelada dentro de um arquivo.
 *
 * O raio vem do token `card`, o mesmo que o app aplica nos seus cartoes: um
 * quadrado de canto vivo ao lado de componentes arredondados denuncia peca
 * colada de outro lugar.
 */
export function BrandMark({ className = 'size-9' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-card bg-neutral-200 ${className}`}
    >
      <MdPrecisionManufacturing className="size-[62%] text-brand-600" />
    </span>
  )
}
