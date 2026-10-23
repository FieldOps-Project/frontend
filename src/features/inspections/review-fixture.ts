import 'server-only'

import type { InspectionReview, ReviewItem, ReviewSection } from '@/lib/domain/inspection-review'

/**
 * Inspecao de demonstracao da tela de revisao.
 *
 * A API ainda nao publica os endpoints de inspecao (backend #17, #21, #22, #23
 * e #28). Ate la, este exemplo -- o mesmo do prototipo da tela -- permite ver e
 * revisar a interface em desenvolvimento. So e servido quando
 * `NEXT_PUBLIC_APP_ENV=development`; em qualquer outro ambiente a rota responde
 * 404.
 */
export const DEMO_REVIEW_ID = '7c1e2f3a-0892-4d6b-9a10-2023d0000892'

/** UUID fixo por item, para a demonstracao passar pelas mesmas validacoes da API. */
function itemId(section: number, item: number): string {
  return `7c1e2f3a-0000-4000-8000-${String(section).padStart(4, '0')}${String(item).padStart(8, '0')}`
}

type ItemSeed = readonly [title: string, overrides?: Partial<ReviewItem>]

function section(order: number, title: string, seeds: readonly ItemSeed[]): ReviewSection {
  return {
    id: `section-${order}`,
    order,
    title,
    items: seeds.map(([itemTitle, overrides], index) => ({
      id: itemId(order, index + 1),
      code: `${order}.${index + 1}`,
      title: itemTitle,
      required: true,
      responseType: 'CONFORMITY',
      conformity: 'CONFORMING',
      displayValue: null,
      observation: null,
      photos: [],
      ...overrides,
    })),
  }
}

const NON_CONFORMING = { conformity: 'NON_CONFORMING' } as const

export const DEMO_REVIEW: InspectionReview = {
  id: DEMO_REVIEW_ID,
  code: 'INSP-2023-0892',
  title: 'Inspeção preventiva HVAC',
  status: 'UNDER_REVIEW',
  technicianName: 'Carlos Mendes',
  equipmentName: 'HVAC Unit B',
  siteName: 'Roof Level',
  startedAtDevice: '2023-10-24T11:15:00Z',
  completedAtDevice: '2023-10-24T14:00:00Z',
  submittedAtServer: '2023-10-24T14:30:00Z',
  startLocation: { latitude: -23.55052, longitude: -46.633308, accuracy: 8 },
  sections: [
    section(1, 'Visual Inspection & Enclosure', [
      ['Exterior panels secure and free from damage'],
      [
        'Filter housing integrity check',
        {
          ...NON_CONFORMING,
          observation: 'Trinca na lateral do alojamento do filtro; ar passa sem filtragem.',
          photos: [
            { id: 'photo-1', description: 'Trinca lateral do alojamento', capturedAtDevice: '2023-10-24T11:42:00Z' },
            { id: 'photo-2', description: 'Vista geral do filtro', capturedAtDevice: '2023-10-24T11:43:00Z' },
          ],
        },
      ],
      ['Access doors close and latch properly'],
      ['Gaskets and seals intact'],
      ['No signs of corrosion on the cabinet'],
      ['Mounting brackets and fasteners tight'],
      ['Identification plate legible', { required: false }],
      ['No obstruction around air intake'],
      ['Insulation free from moisture'],
      ['Warning labels present and readable'],
    ]),
    section(2, 'Electrical & Controls', [
      ['Main disconnect switch operational'],
      ['Wiring free from heat damage'],
      ['Terminal connections tight'],
      ['Control panel indicators working'],
      ['Thermostat responds to setpoint changes'],
      ['Supply voltage within range', { responseType: 'NUMBER', conformity: null, displayValue: '221 V' }],
      ['Grounding connection verified'],
      ['Contactors without pitting'],
      ['Safety interlocks functional'],
      ['Emergency stop tested', { responseType: 'BOOLEAN', conformity: null, displayValue: 'Sim' }],
    ]),
    section(3, 'Motor & Fan Assembly', [
      ['Fan blades clean and undamaged'],
      ['Belt tension within specification'],
      ['Bearings without abnormal noise'],
      [
        'Motor vibration levels within tolerance',
        { ...NON_CONFORMING, observation: 'Vibração acima do normal em carga máxima.' },
      ],
      ['Motor current draw', { responseType: 'NUMBER', conformity: null, displayValue: '12,4 A' }],
      ['Shaft alignment verified'],
      ['Pulleys secured'],
      ['Fan guard in place'],
      ['Lubrication performed', { required: false }],
      ['Motor temperature normal after 15 minutes'],
      ['Rotation direction correct'],
      ['Anti-vibration mounts intact'],
    ]),
    section(4, 'Drainage & Condensate', [
      [
        'Condensate drain clear of blockages',
        { ...NON_CONFORMING, observation: 'Escoamento lento; acúmulo de resíduos na saída.' },
      ],
      ['Drain pan free from standing water'],
      ['Drain line slope adequate'],
      ['P-trap primed'],
      ['No leaks at drain connections'],
      ['Condensate pump operational', { required: false }],
      ['Drain line insulation intact'],
      ['Overflow switch functional'],
      ['No biological growth in drain pan'],
      ['Discharge point unobstructed'],
    ]),
  ],
  nonConformities: [
    {
      id: 'nc-1',
      itemId: itemId(1, 2),
      itemCode: '1.2',
      title: 'Filter housing integrity check',
      description: 'Trinca na lateral do alojamento do filtro; ar passa sem filtragem.',
      severity: 'CRITICAL',
    },
    {
      id: 'nc-2',
      itemId: itemId(3, 4),
      itemCode: '3.4',
      title: 'Motor vibration levels within tolerance',
      description: 'Vibração acima do normal em carga máxima.',
      severity: 'HIGH',
    },
    {
      id: 'nc-3',
      itemId: itemId(4, 1),
      itemCode: '4.1',
      title: 'Condensate drain clear of blockages',
      description: 'Escoamento lento; acúmulo de resíduos na saída.',
      severity: 'MEDIUM',
    },
  ],
  reviews: [],
}
