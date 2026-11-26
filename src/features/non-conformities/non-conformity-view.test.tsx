import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  InspectionNonConformities,
  NonConformityContext,
  NonConformityEvidences,
  NonConformityHeader,
  NonConformityOrigin,
} from '@/features/non-conformities/non-conformity-view'
import type { InspectionFinding, NonConformityDetail } from '@/lib/domain/non-conformity'

const DETAIL: NonConformityDetail = {
  id: '9c000000-0000-4000-8000-000000000004',
  title: 'Pressão da caldeira acima do limite',
  description: 'Manômetro marcou 11,2 bar com limite de operação de 10 bar.',
  severity: 'CRITICAL',
  status: 'OPEN',
  inspectionId: 'c0000000-0000-4000-8000-000000000094',
  inspectionCode: 'INS-C0000000',
  inspectionTitle: 'Inspeção da caldeira',
  clientName: 'Indústria Alpha',
  siteName: 'Galpão 1',
  equipmentName: 'Caldeira CB-2',
  itemCode: '2.3',
  itemTitle: 'Pressão de trabalho (bar)',
  itemQuestion: 'Qual a pressão de trabalho medida?',
  createdByName: 'Carlos Silva',
  createdAtDevice: '2026-11-14T16:45:00Z',
  serverReceivedAt: '2026-11-14T19:30:00Z',
  evidences: [
    {
      id: '9e000000-0000-4000-8000-000004000001',
      description: 'Manômetro em 11,2 bar',
      capturedAtDevice: '2026-11-14T16:46:00Z',
      latitude: -23.5,
      longitude: -46.6,
      uploadedAt: '2026-11-14T19:30:00Z',
    },
  ],
}

describe('detalhe da nao conformidade', () => {
  it('escreve a criticidade e o estado, sem acao de mudanca de estado', () => {
    render(<NonConformityHeader item={DETAIL} />)

    expect(screen.getByText('Crítica')).toBeInTheDocument()
    expect(screen.getByText('Aberta')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('mostra a inspecao, o local e o autor, com traco quando nao ha nome', () => {
    const { rerender } = render(<NonConformityContext item={DETAIL} />)
    expect(screen.getByRole('link', { name: 'INS-C0000000' })).toHaveAttribute('href', `/inspections/${DETAIL.inspectionId}`)
    expect(screen.getByText('Carlos Silva')).toBeInTheDocument()

    rerender(<NonConformityContext item={{ ...DETAIL, createdByName: null, clientName: null }} />)
    expect(screen.getAllByText('—')).toHaveLength(2)
  })

  it('mostra o item e a pergunta de origem (RN-053), sem resposta que o supervisor nao le', () => {
    render(<NonConformityOrigin item={DETAIL} />)

    expect(screen.getByText('Pressão de trabalho (bar)', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Qual a pressão de trabalho medida?')).toBeInTheDocument()
    expect(screen.queryByText('Resposta do técnico')).not.toBeInTheDocument()
  })

  it('explica quando o achado nao tem item especifico', () => {
    render(<NonConformityOrigin item={{ ...DETAIL, itemCode: null, itemTitle: null, itemQuestion: null }} />)
    expect(screen.getByText(/sem item específico/)).toBeInTheDocument()
  })

  it('lista as evidencias e trata a ausencia delas', () => {
    const { rerender } = render(<NonConformityEvidences item={DETAIL} />)
    expect(screen.getByRole('button', { name: 'Ampliar Manômetro em 11,2 bar' })).toBeInTheDocument()

    rerender(<NonConformityEvidences item={{ ...DETAIL, evidences: [] }} />)
    expect(screen.getByText('Nenhuma evidência anexada a esta não conformidade.')).toBeInTheDocument()
  })
})

describe('bloco do detalhe da inspecao', () => {
  const finding: InspectionFinding = {
    id: DETAIL.id,
    title: DETAIL.title,
    description: DETAIL.description,
    severity: DETAIL.severity,
    itemCode: DETAIL.itemCode,
  }

  it('leva cada nao conformidade ao seu detalhe', () => {
    render(<InspectionNonConformities items={[finding]} />)

    expect(screen.getByRole('link', { name: /Pressão da caldeira/ })).toHaveAttribute('href', `/non-conformities/${DETAIL.id}`)
    expect(screen.getByText('1 registrada')).toBeInTheDocument()
  })

  it('trata vazio e perfil sem acesso', () => {
    const { rerender } = render(<InspectionNonConformities items={[]} />)
    expect(screen.getByText('Nenhuma não conformidade registrada nesta inspeção.')).toBeInTheDocument()

    rerender(<InspectionNonConformities items={null} />)
    expect(screen.getByText(/indisponíveis para o seu perfil/)).toBeInTheDocument()
  })
})
