import Form from 'next/form'
import Link from 'next/link'
import { MdSearch } from 'react-icons/md'

/**
 * Busca do cabecalho. E um formulario GET para `/search`: funciona sem
 * JavaScript e, com ele, o `next/form` navega sem recarregar a pagina.
 *
 * Em celular o campo nao cabe ao lado dos icones; fica so a lupa, que abre a
 * pagina de busca com o campo em largura total.
 */
export function HeaderSearch() {
  return (
    <>
      <Form action="/search" role="search" className="hidden w-full max-w-[25rem] sm:block">
        <label className="flex h-10 items-center gap-3 rounded-md bg-neutral-100 px-4 text-neutral-500 transition-shadow focus-within:bg-neutral-0 focus-within:ring-2 focus-within:ring-brand-200">
          <MdSearch aria-hidden className="size-5 shrink-0" />
          <span className="sr-only">Pesquisar em todo o painel</span>
          <input
            name="q"
            type="search"
            placeholder="Pesquisar em todo o painel..."
            className="min-w-0 flex-1 bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-500 focus-visible:outline-none"
          />
        </label>
      </Form>

      <Link
        href="/search"
        aria-label="Pesquisar em todo o painel"
        className="grid size-10 place-items-center rounded-md text-neutral-800 hover:bg-neutral-100 sm:hidden"
      >
        <MdSearch aria-hidden className="size-6" />
      </Link>
    </>
  )
}
