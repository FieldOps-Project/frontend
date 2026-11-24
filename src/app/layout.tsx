import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
import './globals.css'

import { ThemeSync } from '@/components/theme/theme-sync'
import { THEME_INIT_SCRIPT } from '@/lib/theme'

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

/** Cor da barra do navegador no celular, acompanhando o tema (claro/escuro). */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F5F7' },
    { media: '(prefers-color-scheme: dark)', color: '#161A1D' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  /*
   * `lang` descreve o idioma do conteudo para leitores de tela e para a
   * pronuncia correta. O painel e escrito em portugues do Brasil; deixar `en`
   * faz o leitor de tela ler "Usuarios" com fonetica inglesa.
   *
   * `data-theme="light"` e o valor literal que o React desenha; o script no
   * `<head>` o substitui antes da primeira pintura, sem piscada. O mesmo
   * script roda para o login, que esta neste layout raiz. `suppressHydrationWarning`
   * so vai aqui: e o unico atributo que o cliente pode mudar antes da hidratacao.
   */
  return (
    <html
      lang="pt-BR"
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeSync />
        {children}
      </body>
    </html>
  )
}
