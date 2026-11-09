import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EnvironmentLabel } from '@/components/shell/environment-label'

describe('EnvironmentLabel', () => {
  it('mostra producao como informacao neutra', () => {
    render(<EnvironmentLabel environment="production" />)
    expect(screen.getByText('Ambiente: Produção')).toHaveClass('text-neutral-900')
  })

  it('destaca ambiente que nao e producao', () => {
    const { container } = render(<EnvironmentLabel environment="development" />)
    expect(container).toHaveTextContent('Ambiente: Desenvolvimento')
    expect(container.firstChild).toHaveClass('bg-warning-soft')
  })
})
