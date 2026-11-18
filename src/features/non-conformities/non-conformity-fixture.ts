import 'server-only'

import { demoInspectionDetail } from '@/features/inspections/detail-fixture'
import { DEMO_REVIEW, DEMO_REVIEW_ID } from '@/features/inspections/review-fixture'
import { CONFORMITY_LABELS, reviewItems, type ReviewPhoto, type Severity } from '@/lib/domain/inspection-review'
import type { NonConformityDetail, NonConformityOrigin } from '@/lib/domain/non-conformity'

/**
 * Nao conformidades de demonstracao, servidas so em `NEXT_PUBLIC_APP_ENV=development`
 * enquanto a API nao publica `/non-conformities` (backend #23).
 *
 * Pertencem as inspecoes de demonstracao que ja foram executadas, com as datas
 * e as pessoas delas, para que a listagem, o detalhe e o bloco do detalhe da
 * inspecao contem a mesma historia. As da inspecao em revisao sao as mesmas
 * da tela de revisao, com o item, a resposta e as fotos de la.
 */
/** Identificador da nao conformidade de demonstracao numero `n`; as tres primeiras sao as da revisao. */
export function demoNonConformityId(n: number): string {
  return `9c000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

/** Foto `index` da nao conformidade `n`, com UUID fixo para passar pelo Route Handler. */
export function demoNonConformityPhotoId(n: number, index: number): string {
  return `9e000000-0000-4000-8000-${String(n).padStart(6, '0')}${String(index).padStart(6, '0')}`
}

function inspectionId(n: number): string {
  return `c0000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

function originItemId(n: number): string {
  return `9c000000-0000-4000-8000-1000${String(n).padStart(8, '0')}`
}

function minutesAfter(value: string, minutes: number): string {
  return new Date(new Date(value).getTime() + minutes * 60_000).toISOString()
}

type Seed = {
  readonly n: number
  readonly inspectionId: string
  readonly title: string
  readonly description: string
  readonly severity: Severity
  /** Minutos depois do inicio da execucao, no relogio do dispositivo. */
  readonly minute: number
  readonly origin: NonConformityOrigin | null
  /** Descricao de cada foto; o horario e o do registro da nao conformidade. */
  readonly photos: readonly string[]
}

/** As da inspecao em revisao, com a origem lida do proprio checklist. */
function reviewSeeds(): { seed: Seed; evidences: readonly ReviewPhoto[] }[] {
  const items = reviewItems(DEMO_REVIEW)
  return DEMO_REVIEW.nonConformities.map((nonConformity, index) => {
    const item = items.find((candidate) => candidate.id === nonConformity.itemId)
    return {
      seed: {
        n: index + 1,
        inspectionId: DEMO_REVIEW_ID,
        title: nonConformity.title,
        description: nonConformity.description,
        severity: nonConformity.severity,
        minute: 25 + index * 40,
        origin: item
          ? {
              itemId: item.id,
              itemCode: item.code,
              question: item.title,
              responseType: item.responseType,
              answer: item.conformity ? CONFORMITY_LABELS[item.conformity] : item.displayValue,
              observation: item.observation,
            }
          : null,
        photos: [],
      },
      evidences: item?.photos ?? [],
    }
  })
}

function conformityOrigin(n: number, itemCode: string, question: string, observation: string | null): NonConformityOrigin {
  return { itemId: originItemId(n), itemCode, question, responseType: 'CONFORMITY', answer: 'Não Conforme', observation }
}

const OTHER_SEEDS: readonly Seed[] = [
  {
    n: 4,
    inspectionId: inspectionId(94),
    title: 'Pressão da caldeira acima do limite',
    description: 'Manômetro marcou 11,2 bar com limite de operação de 10 bar.',
    severity: 'CRITICAL',
    minute: 35,
    origin: {
      itemId: originItemId(4),
      itemCode: '2.3',
      question: 'Pressão de trabalho (bar)',
      responseType: 'NUMBER',
      answer: '11,2 bar',
      observation: 'Válvula de segurança não atuou durante o teste.',
    },
    photos: ['Manômetro em 11,2 bar', 'Placa da válvula de segurança'],
  },
  {
    n: 5,
    inspectionId: inspectionId(94),
    title: 'Isolamento térmico danificado',
    description: 'Trecho de 40 cm sem isolamento na linha de vapor.',
    severity: 'MEDIUM',
    minute: 70,
    origin: conformityOrigin(5, '3.1', 'Isolamento térmico íntegro', 'Risco de queimadura no acesso lateral.'),
    photos: ['Linha de vapor sem isolamento'],
  },
  {
    n: 6,
    inspectionId: inspectionId(90),
    title: 'Garfo da empilhadeira com trinca',
    description: 'Trinca visível na base do garfo esquerdo.',
    severity: 'HIGH',
    minute: 15,
    origin: conformityOrigin(6, '1.4', 'Garfos sem trincas ou deformações', 'Equipamento retirado de operação até a troca.'),
    photos: ['Trinca na base do garfo'],
  },
  {
    n: 7,
    inspectionId: inspectionId(92),
    title: 'Extintor com lacre rompido',
    description: 'Lacre ausente e ponteiro do manômetro no limite inferior.',
    severity: 'HIGH',
    minute: 20,
    origin: conformityOrigin(7, '1.2', 'Lacre e pino de segurança íntegros', null),
    photos: ['Extintor sem lacre'],
  },
  {
    n: 8,
    inspectionId: inspectionId(95),
    title: 'Sinalização de área desgastada',
    description: 'Faixa de isolamento da betoneira apagada em dois pontos.',
    severity: 'LOW',
    minute: 50,
    origin: conformityOrigin(8, '4.2', 'Sinalização de segurança visível', 'Repintura agendada pelo cliente.'),
    photos: [],
  },
  {
    n: 9,
    inspectionId: inspectionId(95),
    title: 'Proteção da correia solta',
    description: 'Parafuso faltando na proteção da correia do motor.',
    severity: 'MEDIUM',
    minute: 80,
    origin: null,
    photos: ['Proteção da correia'],
  },
]

export function demoNonConformities(now: Date = new Date()): readonly NonConformityDetail[] {
  const entries = [...reviewSeeds(), ...OTHER_SEEDS.map((seed) => ({ seed, evidences: null }))]

  return entries.flatMap(({ seed, evidences }) => {
    const inspection = demoInspectionDetail(seed.inspectionId, now)
    if (!inspection?.startedAtDevice) return []
    const createdAtDevice = minutesAfter(inspection.startedAtDevice, seed.minute)

    return [
      {
        id: demoNonConformityId(seed.n),
        title: seed.title,
        description: seed.description,
        severity: seed.severity,
        status: 'OPEN' as const,
        inspectionId: inspection.id,
        inspectionCode: inspection.code,
        clientId: inspection.clientId,
        clientName: inspection.clientName,
        siteName: inspection.siteName,
        equipmentName: inspection.equipmentName,
        itemCode: seed.origin?.itemCode ?? null,
        itemTitle: seed.origin?.question ?? null,
        createdByName: inspection.technicianName ?? 'Técnico',
        createdAtDevice,
        serverReceivedAt: inspection.submittedAtServer ?? inspection.startedAtServer,
        origin: seed.origin,
        evidences:
          evidences ??
          seed.photos.map((description, index) => ({
            id: demoNonConformityPhotoId(seed.n, index + 1),
            description,
            capturedAtDevice: minutesAfter(createdAtDevice, index),
            latitude: inspection.startLocation?.latitude ?? null,
            longitude: inspection.startLocation?.longitude ?? null,
            uploadedAt: inspection.submittedAtServer ?? inspection.startedAtServer,
          })),
      },
    ]
  })
}
