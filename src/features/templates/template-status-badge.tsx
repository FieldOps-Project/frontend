import { StatusBadge } from '@/components/ui/status-badge'
import { TEMPLATE_STATUS_TONES, templateSituation, type InspectionTemplate } from '@/lib/domain/inspection-template'

/**
 * Situacao do modelo com a versao vigente: "Rascunho", "Publicado · versão 2",
 * "Inativo · versão 1". O texto e a informacao; a cor so apoia (issue #13).
 * Fica numa linha so: quebrado, "· versão 2" parece outro selo.
 */
export function TemplateStatusBadge({ template }: { template: Pick<InspectionTemplate, 'status' | 'currentVersion'> }) {
  return (
    <span className="whitespace-nowrap">
      <StatusBadge label={templateSituation(template)} tone={TEMPLATE_STATUS_TONES[template.status]} />
    </span>
  )
}
