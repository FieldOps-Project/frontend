import { describe, expect, it } from 'vitest'

import {
  isInspectionPriority,
  scheduledForFromDate,
  templateVersionLabel,
} from '@/lib/domain/inspection-scheduling'

describe('contrato de agendamento', () => {
  it('aceita so as prioridades do modelo de dados', () => {
    expect(isInspectionPriority('CRITICAL')).toBe(true)
    expect(isInspectionPriority('NORMAL')).toBe(false)
    expect(isInspectionPriority(null)).toBe(false)
  })

  it('monta o rotulo do modelo com versao e categoria', () => {
    expect(
      templateVersionLabel({
        versionId: 'v',
        templateTitle: 'Inspeção preventiva HVAC',
        category: 'Climatização',
        versionNumber: 3,
        requiresEquipment: true,
      }),
    ).toBe('Inspeção preventiva HVAC · v3 (Climatização)')
  })

  it('converte a data prevista no inicio do dia em Sao Paulo', () => {
    expect(scheduledForFromDate('2026-10-30')).toBe('2026-10-30T00:00:00-03:00')
  })
})
