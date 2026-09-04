import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
