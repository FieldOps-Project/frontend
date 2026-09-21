/**
 * Marca do FieldOps: o mesmo chevron que o icone do aplicativo de campo usa,
 * claro sobre o azul da marca.
 *
 * Desenhado como SVG em vez de imagem porque o painel precisa dele em varios
 * tamanhos -- menu, gaveta, tela de acesso -- e porque assim a cor sai dos
 * tokens em vez de ficar congelada dentro de um arquivo.
 *
 * O raio vem do token `card`, o mesmo que o app aplica nos seus cartoes: um
 * quadrado de canto vivo ao lado de componentes arredondados denuncia peca
 * colada de outro lugar.
 */
export function BrandMark({ className = 'size-9' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-card bg-gradient-to-br from-brand-500 to-brand-700 ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[62%]">
        <path
          d="M4.5 17.5 12 7.5l7.5 10"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-brand-100"
        />
      </svg>
    </span>
  )
}
