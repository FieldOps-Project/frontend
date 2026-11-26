import { describe, expect, it } from 'vitest'

import { csvCell, toCsv } from '@/features/inspections/export-csv'

describe('toCsv', () => {
  it('abre com BOM e separa colunas por ponto e virgula', () => {
    const csv = toCsv(['Título', 'Itens'], [['Manutenção', 36]])

    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv.slice(1).split('\r\n')).toEqual(['Título;Itens', 'Manutenção;36', ''])
  })
})

describe('csvCell', () => {
  it('escapa separador e aspas', () => {
    expect(csvCell('Indústria Alpha; Filial "Sul"')).toBe('"Indústria Alpha; Filial ""Sul"""')
  })

  it('deixa nulo em branco', () => {
    expect(csvCell(null)).toBe('')
  })

  it('neutraliza texto que a planilha executaria como formula', () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe(`"'=HYPERLINK(""http://x"")"`)
  })
})
