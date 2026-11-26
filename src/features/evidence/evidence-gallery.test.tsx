import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EvidenceGallery } from '@/features/evidence/evidence-gallery'
import type { Evidence } from '@/lib/domain/evidence'

function evidence(
  id: string,
  nonConformityId: string | null,
  title: string | null,
  uploadedAt: string | null = '2026-11-18T12:00:00Z',
): Evidence {
  return {
    id,
    description: `Foto ${id}`,
    capturedAtDevice: '2026-11-18T10:00:00Z',
    latitude: null,
    longitude: null,
    uploadedAt,
    inspectionId: 'i1',
    responseId: null,
    nonConformityId,
    nonConformityTitle: title,
    serverReceivedAt: '2026-11-18T12:00:00Z',
  }
}

describe('EvidenceGallery', () => {
  it('agrupa as fotos pela nao conformidade, com link para ela, e deixa as soltas no fim', () => {
    render(
      <EvidenceGallery
        evidences={[evidence('a', 'nc-1', 'Etiqueta danificada'), evidence('b', null, null)]}
      />,
    )

    const headings = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    expect(headings).toEqual(['Etiqueta danificada', 'Sem não conformidade'])
    expect(screen.getByRole('link', { name: 'Etiqueta danificada' })).toHaveAttribute('href', '/non-conformities/nc-1')
    expect(
      within(screen.getByRole('list', { name: 'Fotos de Etiqueta danificada' })).getByRole('button', { name: 'Ampliar Foto a' }),
    ).toBeInTheDocument()
  })

  it('pede a imagem ao Route Handler, sem variante', () => {
    render(<EvidenceGallery evidences={[evidence('a', null, null)]} />)
    expect(document.querySelector('img')?.getAttribute('src')).toBe('/api/evidence/a')
  })

  it('conta as fotos aguardando upload', () => {
    render(<EvidenceGallery evidences={[evidence('a', null, null), evidence('b', null, null, null)]} />)
    expect(screen.getByText('1 aguardando upload')).toBeInTheDocument()
  })

  it('trata vazio e perfil sem acesso', () => {
    const { rerender } = render(<EvidenceGallery evidences={[]} />)
    expect(screen.getByText('Nenhuma fotografia registrada nesta inspeção.')).toBeInTheDocument()

    rerender(<EvidenceGallery evidences={null} />)
    expect(screen.getByText(/Evidências indisponíveis para o seu perfil/)).toBeInTheDocument()
  })
})
