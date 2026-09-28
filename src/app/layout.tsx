import type { Metadata } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
import './globals.css'

/*
 * Inter e a familia do sistema de design, usada em titulos, corpo e rotulos.
 * O mono continua o Geist, que so aparece em identificadores e codigos.
 */
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'FieldOps — Painel administrativo',
  description:
    'Painel administrativo do FieldOps: cadastros, modelos de inspecao, acompanhamento e revisao.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  /*
   * `lang` descreve o idioma do conteudo para leitores de tela e para a
   * pronuncia correta. O painel e escrito em portugues do Brasil; deixar `en`
   * faz o leitor de tela ler "Usuarios" com fonetica inglesa.
   */
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
