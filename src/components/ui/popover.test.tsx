import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Popover } from '@/components/ui/popover'

function renderPopover() {
  render(
    <div>
      <Popover label="Notificações" trigger="sino" triggerClassName="">
        <p>Conteúdo</p>
      </Popover>
      <p>Fora</p>
    </div>,
  )
  return screen.getByRole('button', { name: 'Notificações' })
}

describe('Popover', () => {
  it('abre e fecha pelo botao', () => {
    const button = renderPopover()
    expect(button).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(button)
    expect(screen.getByRole('dialog', { name: 'Notificações' })).toHaveTextContent('Conteúdo')
    expect(button).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(button)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('fecha com Esc e devolve o foco ao botao', () => {
    const button = renderPopover()
    fireEvent.click(button)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(button).toHaveFocus()
  })

  it('fecha com clique fora', () => {
    const button = renderPopover()
    fireEvent.click(button)

    fireEvent.pointerDown(screen.getByText('Fora'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
