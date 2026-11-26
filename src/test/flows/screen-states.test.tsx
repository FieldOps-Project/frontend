import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import AppError from '@/app/(app)/error'
import AuditLoading from '@/app/(app)/audit/loading'
import InspectionDetailLoading from '@/app/(app)/inspections/[inspectionId]/(detail)/loading'
import NonConformitiesLoading from '@/app/(app)/non-conformities/(list)/loading'
import { EmptyState } from '@/components/ui/empty-state'
import { EvidenceGallery } from '@/features/evidence/evidence-gallery'

/**
 * Fluxo 8 do documento 14.16: apresentacao dos estados de tela (14.15).
 * Carregando anuncia que esta carregando, vazio orienta em vez de parecer
 * erro, e erro e indisponibilidade falam a lingua do negocio.
 */
describe('8. estados de tela', () => {
  it('carregando: o esqueleto e anunciado ao leitor de tela', () => {
    for (const Loading of [InspectionDetailLoading, NonConformitiesLoading, AuditLoading]) {
      const { unmount } = render(<Loading />)
      expect(screen.getByRole('status')).toHaveTextContent(/Carregando/)
      unmount()
    }
  })

  it('vazio: explica o resultado e o proximo passo, sem aparencia de erro', () => {
    render(<EmptyState title="Nenhuma inspeção encontrada" description="Ajuste ou limpe os filtros para ver mais resultados." />)

    expect(screen.getByText('Nenhuma inspeção encontrada')).toBeInTheDocument()
    expect(screen.getByText(/Ajuste ou limpe os filtros/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('erro: mensagem de negocio e botao de tentar de novo, sem detalhe tecnico', () => {
    const reset = vi.fn()
    render(<AppError error={new Error('ECONNREFUSED 127.0.0.1:8080')} reset={reset} />)

    expect(screen.getByRole('heading', { name: 'Não foi possível carregar esta tela' })).toBeInTheDocument()
    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(reset).toHaveBeenCalledOnce()
  })

  it('bloco indisponivel: so a parte sem API avisa, o resto da tela continua', () => {
    render(<EvidenceGallery evidences={null} />)

    expect(screen.getByText(/Evidências indisponíveis/)).toBeInTheDocument()
  })
})
