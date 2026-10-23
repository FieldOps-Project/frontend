import 'server-only'

import type { PublishedTemplateVersion } from '@/lib/domain/inspection-scheduling'

/**
 * Versoes de modelo publicadas e ativas para novas inspecoes (RN-024).
 *
 * A API ainda nao publica os modelos (backend #13 e #14). Em desenvolvimento a
 * tela usa estas versoes de demonstracao, para que o agendamento possa ser
 * visto e testado ponta a ponta; fora dele o seletor fica vazio ate o endpoint
 * existir. A troca pela API acontece so em `loadPublishedTemplateVersions`.
 */
export const DEMO_TEMPLATE_VERSIONS: readonly PublishedTemplateVersion[] = [
  {
    versionId: '5d3a0c1e-7b2f-4f6a-9c11-000000000301',
    templateTitle: 'Inspeção preventiva HVAC',
    category: 'Climatização',
    versionNumber: 3,
    requiresEquipment: true,
  },
  {
    versionId: '5d3a0c1e-7b2f-4f6a-9c11-000000000201',
    templateTitle: 'Vistoria de extintores',
    category: 'Combate a incêndio',
    versionNumber: 2,
    requiresEquipment: true,
  },
  {
    versionId: '5d3a0c1e-7b2f-4f6a-9c11-000000000101',
    templateTitle: 'Inspeção geral do local',
    category: 'Segurança predial',
    versionNumber: 1,
    requiresEquipment: false,
  },
]

function usesDemoTemplates(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === 'development'
}

export async function loadPublishedTemplateVersions(): Promise<readonly PublishedTemplateVersion[]> {
  return usesDemoTemplates() ? DEMO_TEMPLATE_VERSIONS : []
}

export function isDemoTemplateVersion(versionId: string): boolean {
  return usesDemoTemplates() && DEMO_TEMPLATE_VERSIONS.some((version) => version.versionId === versionId)
}
