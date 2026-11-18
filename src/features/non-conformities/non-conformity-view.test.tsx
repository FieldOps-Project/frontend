import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  InspectionNonConformities,
  NonConformityEvidences,
  NonConformityHeader,
  NonConformityOrigin,
} from '@/features/non-conformities/non-conformity-view'
import type { NonConformityDetail } from '@/lib/domain/non-conformity'

const DETAIL: NonConformityDetail = {
  id: '9c000000-0000-4000-8000-000000000004',
  title: 'Pressão da caldeira acima do limite',
  description: 'Manômetro marcou 11,2 bar com limite de operação de 10 bar.',
  severity: 'CRITICAL',
  status: 'OPEN',
  inspectionId: 'c0000000-0000-4000-8000-000000000094',
  inspectionCode: 'INS-2023-094',
  clientId: 'b0000000-0000-4000-8000-000000000001',
  clientName: 'Indústria Alpha',
  siteName: 'Galpão 1',
  equipmentName: 'Caldeira CB-2',
  itemCode: '2.3',
  itemTitle: 'Pressão de trabalho (bar)',
  createdByName: 'Carlos Silva',
  createdAtDevice: '2026-11-14T16:45:00Z',
  serverReceivedAt: '2026-11-14T19:30:00Z',
  origin: {
    itemId: '9c000000-0000-4000-8000-100000000004',
    itemCode: '2.3',
    question: 'Pressão de trabalho (bar)',
    responseType: 'NUMBER',
    answer: '11,2 bar',
    observation: 'Válvula de segurança não atuou durante o teste.',
  },
  evidences: [{ id: 'p1', description: 'Manômetro em 11,2 bar', capturedAtDevice: '2026-11-14T16:46:00Z' }],
}

describe('detalhe da nao conformidade', () => {
  it('escreve a criticidade e o estado, sem acao de mudanca de estado', () => {
    render(<NonConformityHeader item={DETAIL} />)

    expect(screen.getByText('Crítica')).toBeInTheDocument()
    expect(screen.getByText('Aberta')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('mostra a pergunta, a resposta e a observacao de origem (RN-053)', () => {
    render(<NonConformityOrigin item={DETAIL} />)

    expect(screen.getByText('Pressão de trabalho (bar)')).toBeInTheDocument()
    expect(screen.getByText('11,2 bar')).toBeInTheDocument()
    expect(screen.getByText('Válvula de segurança não atuou durante o teste.')).toBeInTheDocument()
  })

  it('explica quando o achado nao tem item especifico', () => {
    render(<NonConformityOrigin item={{ ...DETAIL, origin: null }} />)
    expect(screen.getByText(/sem item específico/)).toBeInTheDocument()
  })

  it('lista as evidencias e trata a ausencia delas', () => {
    const { rerender } = render(<NonConformityEvidences item={DETAIL} />)
    expect(screen.getByText('Manômetro em 11,2 bar')).toBeInTheDocument()

    rerender(<NonConformityEvidences item={{ ...DETAIL, evidences: [] }} />)
    expect(screen.getByText('Nenhuma evidência anexada a esta não conformidade.')).toBeInTheDocument()
  })
})

describe('bloco do detalhe da inspecao', () => {
  it('leva cada nao conformidade ao seu detalhe', () => {
    render(<InspectionNonConformities items={[DETAIL]} />)

    expect(screen.getByRole('link', { name: /Pressão da caldeira/ })).toHaveAttribute('href', `/non-conformities/${DETAIL.id}`)
    expect(screen.getByText('1 registrada')).toBeInTheDocument()
  })

  it('trata vazio e API indisponivel', () => {
    const { rerender } = render(<InspectionNonConformities items={[]} />)
    expect(screen.getByText('Nenhuma não conformidade registrada nesta inspeção.')).toBeInTheDocument()

    rerender(<InspectionNonConformities items={null} />)
    expect(screen.getByText(/indisponíveis no momento/)).toBeInTheDocument()
  })
})
