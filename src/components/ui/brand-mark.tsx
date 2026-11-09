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
 *
 * A variante `solid` inverte as cores -- braco branco sobre a primaria -- e e a
 * do menu do painel, onde a marca abre a coluna e precisa pesar mais que os
 * icones de navegacao logo abaixo.
 */
const VARIANTS = {
  soft: { box: 'rounded-card bg-neutral-200', icon: 'text-brand-600' },
  solid: { box: 'rounded-md bg-brand-700', icon: 'text-neutral-0' },
} as const

export function BrandMark({
  className = 'size-9',
  variant = 'soft',
}: {
  className?: string
  variant?: keyof typeof VARIANTS
}) {
  const colors = VARIANTS[variant]

  return (
    <span aria-hidden className={`grid shrink-0 place-items-center ${colors.box} ${className}`}>
      <MdPrecisionManufacturing className={`size-[62%] ${colors.icon}`} />
    </span>
  )
}
