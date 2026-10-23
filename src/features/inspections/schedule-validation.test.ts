import { describe, expect, it } from 'vitest'

import {
  firstInvalidField,
  hasScheduleErrors,
  isPastDate,
  todayInSaoPaulo,
  validateSchedule,
} from '@/features/inspections/schedule-validation'

const VALID = {
  templateVersionId: 'tpl',
  clientId: 'client',
  siteId: 'site',
  equipmentId: 'equipment',
  technicianId: 'tech',
  scheduledDate: '2026-11-03',
  priority: 'MEDIUM',
}

describe('validateSchedule', () => {
  it('aceita um agendamento completo', () => {
    expect(hasScheduleErrors(validateSchedule(VALID, { requiresEquipment: true }))).toBe(false)
  })

  it('exige modelo, cliente, local, tecnico e data prevista (RN-024 e RN-025)', () => {
    expect(validateSchedule({}, { requiresEquipment: false })).toEqual({
      templateVersionId: 'Selecione um modelo publicado.',
      clientId: 'A seleção do cliente é obrigatória.',
      siteId: 'A seleção do local é obrigatória.',
      technicianId: 'A atribuição do técnico é obrigatória.',
      scheduledDate: 'A data prevista é obrigatória.',
    })
  })

  it('exige equipamento so quando o modelo inspeciona um equipamento (RN-026)', () => {
    const withoutEquipment = { ...VALID, equipmentId: '' }

    expect(validateSchedule(withoutEquipment, { requiresEquipment: true }).equipmentId).toBeDefined()
    expect(validateSchedule(withoutEquipment, { requiresEquipment: false }).equipmentId).toBeUndefined()
  })

  it('recusa prioridade fora do modelo de dados e data invalida', () => {
    const errors = validateSchedule({ ...VALID, priority: 'NORMAL', scheduledDate: '2026-13-45' }, { requiresEquipment: true })

    expect(errors.priority).toBe('Prioridade inválida.')
    expect(errors.scheduledDate).toBe('Informe uma data válida.')
  })

  it('aponta o primeiro campo invalido na ordem da tela', () => {
    expect(firstInvalidField({ technicianId: 'x', clientId: 'y' })).toBe('clientId')
    expect(firstInvalidField({})).toBeNull()
  })
})

describe('data prevista', () => {
  it('avisa quando a data ja passou, sem tratar hoje como passado', () => {
    expect(isPastDate('2026-10-22', '2026-10-23')).toBe(true)
    expect(isPastDate('2026-10-23', '2026-10-23')).toBe(false)
    expect(isPastDate(undefined, '2026-10-23')).toBe(false)
  })

  it('calcula hoje no fuso de Sao Paulo, nao em UTC', () => {
    expect(todayInSaoPaulo(new Date('2026-10-24T01:30:00Z'))).toBe('2026-10-23')
  })
})
