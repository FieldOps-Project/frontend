import type { FormState } from '@/lib/form-state'

const FORM_FIELD_BY_API_FIELD: Readonly<Record<string, string>> = {
  scheduledFor: 'scheduledDate',
}

export function withFormFieldNames(state: FormState): FormState {
  if (state.status !== 'error') return state

  return {
    ...state,
    fieldErrors: Object.fromEntries(
      Object.entries(state.fieldErrors).map(([field, message]) => [FORM_FIELD_BY_API_FIELD[field] ?? field, message]),
    ),
  }
}
