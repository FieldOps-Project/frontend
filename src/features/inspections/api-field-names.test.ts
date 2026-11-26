import { describe, expect, it } from 'vitest'

import { withFormFieldNames } from '@/features/inspections/api-field-names'
import type { FormState } from '@/lib/form-state'

describe('withFormFieldNames', () => {
  it('leva o erro de scheduledFor para o campo de data do formulario', () => {
    const state: FormState = {
      status: 'error',
      message: 'Revise os campos destacados.',
      fieldErrors: { scheduledFor: 'Campo obrigatório.', title: 'Campo obrigatório.' },
      values: { title: '' },
    }

    expect(withFormFieldNames(state)).toEqual({
      ...state,
      fieldErrors: { scheduledDate: 'Campo obrigatório.', title: 'Campo obrigatório.' },
    })
  })

  it('devolve intacto o estado que nao e de erro', () => {
    expect(withFormFieldNames({ status: 'idle' })).toEqual({ status: 'idle' })
  })
})
