import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ScheduleForm, type ScheduleCatalog } from '@/features/inspections/schedule-form'

const createInspection = vi.fn()

vi.mock('@/features/inspections/schedule-actions', () => ({
  createInspection: (...args: unknown[]) => createInspection(...args),
}))

afterEach(() => {
  createInspection.mockReset()
})

const CATALOG: ScheduleCatalog = {
  templates: [
    { versionId: 'tpl-equipment', templateTitle: 'HVAC', category: 'Climatização', versionNumber: 3, requiresEquipment: true },
    { versionId: 'tpl-site', templateTitle: 'Geral', category: 'Predial', versionNumber: 1, requiresEquipment: false },
  ],
  clients: [
    { id: 'c1', name: 'Indústria Alfa' },
    { id: 'c2', name: 'Beta Logística' },
  ],
  sites: [
    { id: 's1', clientId: 'c1', name: 'Unidade Sorocaba', city: 'Sorocaba' },
    { id: 's2', clientId: 'c2', name: 'Galpão Norte', city: null },
  ],
  equipment: [{ id: 'e1', siteId: 's1', name: 'HVAC Unit B', assetNumber: 'AST-01' }],
  technicians: [{ id: 't1', name: 'Carlos Mendes' }],
  supervisors: [{ id: 'u1', name: 'Supervisor Local' }],
}

const select = (label: RegExp) => screen.getByLabelText(label) as HTMLSelectElement
const optionLabels = (element: HTMLSelectElement) => [...element.options].map((option) => option.textContent)

function renderForm() {
  render(<ScheduleForm catalog={CATALOG} today="2026-10-23" />)
}

describe('ScheduleForm', () => {
  it('lista so os locais do cliente e so os equipamentos do local', () => {
    renderForm()

    fireEvent.change(select(/^Cliente/), { target: { value: 'c1' } })
    expect(optionLabels(select(/^Local/))).toEqual(['Selecione o local (filtrado pelo cliente)', 'Unidade Sorocaba — Sorocaba'])

    fireEvent.change(select(/^Local/), { target: { value: 's1' } })
    expect(optionLabels(select(/^Equipamento/))).toContain('HVAC Unit B · AST-01')
  })

  it('limpa local e equipamento ao trocar o cliente', () => {
    renderForm()

    fireEvent.change(select(/^Cliente/), { target: { value: 'c1' } })
    fireEvent.change(select(/^Local/), { target: { value: 's1' } })
    fireEvent.change(select(/^Equipamento/), { target: { value: 'e1' } })
    fireEvent.change(select(/^Cliente/), { target: { value: 'c2' } })

    expect(select(/^Local/).value).toBe('')
    expect(select(/^Equipamento/).value).toBe('')
  })

  it('mostra os obrigatorios sem enviar e foca o primeiro invalido', () => {
    renderForm()

    fireEvent.click(screen.getByRole('button', { name: 'Criar e atribuir' }))

    expect(createInspection).not.toHaveBeenCalled()
    expect(screen.getByText('A seleção do cliente é obrigatória.')).toBeInTheDocument()
    expect(screen.getByText('A seleção do local é obrigatória.')).toBeInTheDocument()
    expect(screen.getByText('A atribuição do técnico é obrigatória.')).toBeInTheDocument()
    expect(screen.getByText('A data prevista é obrigatória.')).toBeInTheDocument()
    expect(select(/^Modelo de inspeção/)).toHaveFocus()
  })

  it('torna o equipamento obrigatorio quando o modelo inspeciona um (RN-026)', () => {
    renderForm()

    expect(screen.getByText('(Opcional para inspeções gerais do local)')).toBeInTheDocument()

    fireEvent.change(select(/^Modelo de inspeção/), { target: { value: 'tpl-equipment' } })

    expect(screen.queryByText('(Opcional para inspeções gerais do local)')).not.toBeInTheDocument()
    expect(select(/^Equipamento/)).toBeRequired()
  })

  it('avisa sobre data passada sem bloquear', () => {
    renderForm()

    fireEvent.change(screen.getByLabelText(/^Data prevista/), { target: { value: '2026-10-01' } })

    expect(screen.getByRole('status')).toHaveTextContent('A data escolhida já passou.')
  })

  it('sugere a prioridade media', () => {
    renderForm()

    expect(select(/^Prioridade/).value).toBe('MEDIUM')
  })
})

describe('ScheduleForm: ordem do encadeamento', () => {
  it('libera o local so depois do cliente e o equipamento so depois do local', () => {
    renderForm()

    expect(select(/^Local/)).toBeDisabled()
    expect(select(/^Equipamento/)).toBeDisabled()

    fireEvent.change(select(/^Cliente/), { target: { value: 'c1' } })
    expect(select(/^Local/)).toBeEnabled()
    expect(select(/^Equipamento/)).toBeDisabled()

    fireEvent.change(select(/^Local/), { target: { value: 's1' } })
    expect(select(/^Equipamento/)).toBeEnabled()
  })

  it('avisa quando o local escolhido nao tem equipamento ativo', () => {
    renderForm()

    fireEvent.change(select(/^Cliente/), { target: { value: 'c2' } })
    fireEvent.change(select(/^Local/), { target: { value: 's2' } })

    expect(screen.getByText('Nenhum equipamento ativo neste local.')).toBeInTheDocument()
  })
})
