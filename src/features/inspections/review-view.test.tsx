import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  ChecklistStructure,
  ReportCallout,
  ReviewHistory,
  ReviewSummary,
  StageHint,
} from '@/features/inspections/review-view'
import { buildSections, type InspectionReview, type ItemSnapshotRecord } from '@/lib/domain/inspection-review'

const INSPECTION_ID = 'd0000000-0000-4000-8000-000000000503'

function snapshot(id: string, code: string, overrides: Partial<ItemSnapshotRecord> = {}): ItemSnapshotRecord {
  return {
    id,
    sectionTitle: 'Condições gerais',
    sectionOrder: 1,
    itemCode: code,
    itemTitle: `Item ${code}`,
    itemDescription: null,
    responseType: 'CONFORMITY',
    required: true,
    itemOrder: Number(id),
    ...overrides,
  }
}

const REVIEW: InspectionReview = {
  inspection: { id: INSPECTION_ID, status: 'UNDER_REVIEW' } as InspectionReview['inspection'],
  sections: buildSections([
    snapshot('1', 'GER-001'),
    snapshot('2', 'GER-002', { responseType: 'NUMBER', required: false, itemDescription: 'Leitura em horas' }),
  ]),
  nonConformities: [{ id: 'n1', title: 'Etiqueta', description: 'd', severity: 'MEDIUM', itemCode: 'GER-002' }],
  evidences: [],
  reviews: [],
}

describe('ReportCallout', () => {
  it('leva ao PDF e avisa que as respostas estao la', () => {
    render(<ReportCallout inspectionId={INSPECTION_ID} />)

    const link = screen.getByRole('link', { name: /Baixar relatório \(PDF\) para ver as respostas/ })
    expect(link).toHaveAttribute('href', `/api/inspections/${INSPECTION_ID}/report`)
  })
})

describe('ChecklistStructure', () => {
  it('mostra secao, codigo, tipo e obrigatoriedade sem prometer respostas', () => {
    render(<ChecklistStructure review={REVIEW} />)

    expect(screen.getByRole('heading', { name: '1. Condições gerais' })).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(within(items[0] as HTMLElement).getByText('Conformidade')).toBeInTheDocument()
    expect(within(items[0] as HTMLElement).getByText('Obrigatório')).toBeInTheDocument()
    expect(within(items[1] as HTMLElement).getByText('Numérico')).toBeInTheDocument()
    expect(within(items[1] as HTMLElement).getByText('Opcional')).toBeInTheDocument()
    expect(within(items[1] as HTMLElement).getByText('Leitura em horas')).toBeInTheDocument()
    expect(screen.queryByText(/Observação do técnico|Sem resposta|somente leitura/)).not.toBeInTheDocument()
  })

  it('destaca so o item com nao conformidade', () => {
    render(<ChecklistStructure review={REVIEW} />)

    const items = screen.getAllByRole('listitem')
    expect(within(items[0] as HTMLElement).queryByText('Com não conformidade')).not.toBeInTheDocument()
    expect(within(items[1] as HTMLElement).getByText('Com não conformidade')).toBeInTheDocument()
  })
})

describe('ReviewSummary', () => {
  it('conta itens, obrigatorios, nao conformidades e fotografias', () => {
    render(<ReviewSummary review={REVIEW} />)

    const stat = (label: string) => screen.getByText(label).parentElement as HTMLElement
    expect(within(stat('Itens do checklist')).getByText('2')).toBeInTheDocument()
    expect(within(stat('Obrigatórios')).getByText('1')).toBeInTheDocument()
    expect(within(stat('Não conformidades')).getByText('1')).toBeInTheDocument()
    expect(within(stat('Fotografias')).getByText('0')).toBeInTheDocument()
  })

  it('mostra travessao quando o perfil nao enxerga nao conformidades e fotos', () => {
    render(<ReviewSummary review={{ ...REVIEW, nonConformities: null, evidences: null }} />)

    expect(within(screen.getByText('Não conformidades').parentElement as HTMLElement).getByText('—')).toBeInTheDocument()
    expect(within(screen.getByText('Fotografias').parentElement as HTMLElement).getByText('—')).toBeInTheDocument()
  })
})

describe('ReviewHistory', () => {
  it('explica que o historico e restrito ao supervisor', () => {
    render(<ReviewHistory review={{ ...REVIEW, reviews: null }} />)

    expect(screen.getByText(/indisponível para o seu perfil/)).toBeInTheDocument()
  })

  it('lista rodada, decisao, revisor, motivo e itens a corrigir', () => {
    render(
      <ReviewHistory
        review={{
          ...REVIEW,
          reviews: [
            {
              id: 'r1',
              cycle: 1,
              decision: 'REJECTED',
              reviewerName: 'Supervisor Demo',
              reason: 'Leitura menor que a anterior.',
              comments: 'Refazer a leitura.',
              itemCodes: ['GER-002'],
              reviewedAt: '2026-11-22T13:00:00Z',
            },
          ],
        }}
      />,
    )

    expect(screen.getByText(/Rodada 1 · Reprovada por Supervisor Demo/)).toBeInTheDocument()
    expect(screen.getByText('Motivo: Leitura menor que a anterior.')).toBeInTheDocument()
    expect(screen.getByText('Itens a corrigir: GER-002')).toBeInTheDocument()
  })

  it('anuncia a primeira rodada quando nao ha decisoes', () => {
    render(<ReviewHistory review={REVIEW} />)

    expect(screen.getByText(/Primeira rodada de revisão/)).toBeInTheDocument()
  })
})

describe('StageHint', () => {
  it('diz ao administrador que so o supervisor revisa', () => {
    render(<StageHint role="ADMIN" />)

    expect(screen.getByText(/Somente o supervisor responsável/)).toBeInTheDocument()
  })

  it('diz ao supervisor que a inspecao nao aguarda revisao', () => {
    render(<StageHint role="SUPERVISOR" />)

    expect(screen.getByText('Esta inspeção não está aguardando revisão.')).toBeInTheDocument()
  })
})
