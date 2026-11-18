import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EvidenceGallery } from '@/features/evidence/evidence-gallery'
import type { Evidence } from '@/lib/domain/evidence'

function evidence(id: string, itemCode: string | null, uploadedAt: string | null = '2026-11-18T12:00:00Z'): Evidence {
  return {
    id,
    description: `Foto ${id}`,
    capturedAtDevice: '2026-11-18T10:00:00Z',
    latitude: null,
    longitude: null,
    uploadedAt,
    inspectionId: 'i1',
    responseId: null,
    nonConformityId: null,
    itemId: itemCode ? `item-${itemCode}` : null,
    itemCode,
    itemTitle: itemCode ? `Pergunta ${itemCode}` : null,
    serverReceivedAt: null,
  }
}

describe('EvidenceGallery', () => {
  it('agrupa as fotos junto da pergunta do item (RN-045)', () => {
    render(<EvidenceGallery evidences={[evidence('a', '2.1'), evidence('b', '1.2'), evidence('c', null)]} />)

    const groups = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    expect(groups).toEqual(['1.2 Pergunta 1.2', '2.1 Pergunta 2.1', 'Sem item específico'])
    expect(within(screen.getByRole('list', { name: 'Fotos do item 1.2' })).getByRole('button', { name: 'Ampliar Foto b' })).toBeInTheDocument()
  })

  it('conta as fotos aguardando upload', () => {
    render(<EvidenceGallery evidences={[evidence('a', '1.1'), evidence('b', '1.1', null)]} />)
    expect(screen.getByText('1 aguardando upload')).toBeInTheDocument()
  })

  it('trata vazio e API indisponivel', () => {
    const { rerender } = render(<EvidenceGallery evidences={[]} />)
    expect(screen.getByText('Nenhuma fotografia registrada nesta inspeção.')).toBeInTheDocument()

    rerender(<EvidenceGallery evidences={null} />)
    expect(screen.getByText(/indisponíveis no momento/)).toBeInTheDocument()
  })
})
