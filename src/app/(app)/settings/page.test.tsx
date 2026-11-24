import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import SettingsPage from '@/app/(app)/settings/page'

vi.mock('@/lib/dal', () => ({
  verifySession: vi.fn().mockResolvedValue({
    id: 'u1',
    name: 'Admin Local',
    email: 'admin@fieldops.local',
    role: 'ADMIN',
  }),
}))

describe('SettingsPage', () => {
  it('mostra a conta e o alternador de aparencia', async () => {
    render(await SettingsPage())

    expect(screen.getByRole('heading', { name: 'Conta' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Aparência' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Aparência' })).toBeInTheDocument()
  })
})
