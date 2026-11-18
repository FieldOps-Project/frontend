import 'server-only'

import { demoEvidences } from '@/features/evidence/evidence-fixture'
import { isDemoInspectionId } from '@/features/inspections/detail-fixture'
import { loadOptional } from '@/lib/dal'
import type { Evidence } from '@/lib/domain/evidence'

/**
 * Evidencias da inspecao, para a galeria do detalhe (issue #19). Unico ponto de
 * troca para a API (`GET /inspections/{id}/evidence`); se ela nao responder,
 * devolve `null` e so a galeria aparece como indisponivel.
 */
export async function loadInspectionEvidences(inspectionId: string): Promise<readonly Evidence[] | null> {
  if (process.env.NEXT_PUBLIC_APP_ENV === 'development' && isDemoInspectionId(inspectionId)) {
    return demoEvidences().filter((evidence) => evidence.inspectionId === inspectionId)
  }
  return loadOptional<readonly Evidence[]>(`/inspections/${inspectionId}/evidence`)
}
