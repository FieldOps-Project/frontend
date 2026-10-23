import { describe, expect, it } from 'vitest'

import { inspectionsToCsv } from '@/features/inspections/export-csv'
import type { InspectionListItem } from '@/lib/domain/inspection-list'

const ITEM: InspectionListItem = {
  id: 'i1',
  code: 'INS-2023-089',
  title: 'Manutenção Preventiva',
  clientId: 'c1',
  clientName: 'Indústria Alpha; Filial "Sul"',
  siteName: 'Galpão 3',
  equipmentName: null,
  technicianId: null,
  technicianName: null,
  priority: 'HIGH',
  status: 'ASSIGNED',
  scheduledFor: '2026-10-21T12:00:00Z',
  answeredItems: 0,
  applicableItems: 36,
  updatedAt: '2026-10-21T10:00:00Z',
}

describe('inspectionsToCsv', () => {
  it('abre com BOM, usa ponto e virgula e traduz os valores', () => {
    const csv = inspectionsToCsv([ITEM], '2026-10-23')
    const [header, row] = csv.slice(1).split('\r\n')

    expect(csv.startsWith('﻿')).toBe(true)
    expect(header?.split(';')[0]).toBe('Código')
    expect(row).toContain('Alta;Atribuída;0;36;21/10/2026;2;')
    expect(row).toContain('Não atribuído')
  })

  it('escapa separador e aspas', () => {
    const csv = inspectionsToCsv([ITEM], '2026-10-23')

    expect(csv).toContain('"Indústria Alpha; Filial ""Sul"""')
  })

  it('neutraliza texto que a planilha executaria como formula', () => {
    const csv = inspectionsToCsv([{ ...ITEM, title: '=HYPERLINK("http://x")' }], '2026-10-23')

    expect(csv).toContain(`"'=HYPERLINK(""http://x"")"`)
  })
})
