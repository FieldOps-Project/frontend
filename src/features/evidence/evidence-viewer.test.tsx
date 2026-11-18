import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'

import { EvidenceThumbnails } from '@/features/evidence/evidence-viewer'
import type { EvidencePhoto } from '@/lib/domain/evidence'

const UPLOADED: EvidencePhoto = {
  id: 'e1',
  description: 'Trinca lateral do alojamento',
  capturedAtDevice: '2026-11-18T11:42:00Z',
  latitude: -23.55052,
  longitude: -46.633308,
  uploadedAt: '2026-11-18T14:30:00Z',
}

const PENDING: EvidencePhoto = { ...UPLOADED, id: 'e2', description: 'Medição do vibrômetro', uploadedAt: null }

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false
  }
})

describe('EvidenceThumbnails', () => {
  it('lista miniaturas e so pede o original na ampliacao', () => {
    const { container } = render(<EvidenceThumbnails photos={[UPLOADED]} label="Fotos" />)

    const thumbnail = container.querySelector('img')
    expect(thumbnail?.getAttribute('src')).toBe('/api/evidence/e1?variant=thumbnail')
    expect(thumbnail?.getAttribute('loading')).toBe('lazy')

    fireEvent.click(screen.getByRole('button', { name: 'Ampliar Trinca lateral do alojamento' }))
    expect(screen.getByRole('img', { name: 'Trinca lateral do alojamento' })).toHaveAttribute(
      'src',
      '/api/evidence/e1?variant=original',
    )
  })

  it('mostra descricao, horario e coordenadas na ampliacao', () => {
    render(<EvidenceThumbnails photos={[UPLOADED]} label="Fotos" />)
    fireEvent.click(screen.getByRole('button', { name: /Ampliar/ }))

    expect(screen.getByText('-23.550520, -46.633308')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver no mapa/ })).toBeInTheDocument()
  })

  it('indica o arquivo pendente de upload, sem imagem quebrada', () => {
    const { container } = render(<EvidenceThumbnails photos={[PENDING]} label="Fotos" />)

    expect(screen.getByRole('img', { name: 'Medição do vibrômetro: aguardando upload' })).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByRole('button', { name: /Ampliar/ })).not.toBeInTheDocument()
  })

  it('nao oferece exclusao (RN-049)', () => {
    render(<EvidenceThumbnails photos={[UPLOADED, PENDING]} label="Fotos" />)
    fireEvent.click(screen.getByRole('button', { name: /Ampliar/ }))

    expect(screen.queryByRole('button', { name: /excluir|remover|apagar/i })).not.toBeInTheDocument()
  })
})
