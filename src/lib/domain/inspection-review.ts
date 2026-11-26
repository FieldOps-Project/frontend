import type { Evidence } from '@/lib/domain/evidence'
import type { InspectionStatus } from '@/lib/domain/inspection'
import type { InspectionDetail } from '@/lib/domain/inspection-detail'
import type { InspectionFinding } from '@/lib/domain/non-conformity'
import type { ResponseType } from '@/lib/domain/template-builder'
import type { UserRole } from '@/lib/domain/user'

export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type Severity = (typeof SEVERITIES)[number]

export const SEVERITY_LABELS: Record<Severity, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export const REVIEW_TEXT_MAX_LENGTH = 2000

export type ReviewOutcome = 'APPROVED' | 'REJECTED'

export type ItemSnapshotRecord = {
  readonly id: string
  readonly sectionTitle: string
  readonly sectionOrder: number
  readonly itemCode: string
  readonly itemTitle: string
  readonly itemDescription: string | null
  readonly responseType: ResponseType
  readonly required: boolean
  readonly itemOrder: number
}

export type ReviewApiRecord = {
  readonly id: string
  readonly reviewCycle: number
  readonly reviewerId: string
  readonly decision: ReviewOutcome
  readonly reason: string | null
  readonly comments: string | null
  readonly itemsToCorrect: readonly string[]
  readonly reviewedAt: string
}

export type ReviewItem = {
  readonly id: string
  readonly code: string
  readonly title: string
  readonly description: string | null
  readonly required: boolean
  readonly responseType: ResponseType
}

export type ReviewSection = {
  readonly order: number
  readonly title: string
  readonly items: readonly ReviewItem[]
}

export type ReviewRecord = {
  readonly id: string
  readonly cycle: number
  readonly decision: ReviewOutcome
  readonly reviewerName: string | null
  readonly reason: string | null
  readonly comments: string | null
  readonly itemCodes: readonly string[]
  readonly reviewedAt: string
}

export type InspectionReview = {
  readonly inspection: InspectionDetail
  readonly sections: readonly ReviewSection[]
  readonly nonConformities: readonly InspectionFinding[] | null
  readonly evidences: readonly Evidence[] | null
  readonly reviews: readonly ReviewRecord[] | null
}

export type ReviewStage = 'begin' | 'decide'

export function reviewItems<T>(review: { readonly sections: readonly { readonly items: readonly T[] }[] }): readonly T[] {
  return review.sections.flatMap((section) => section.items)
}

function toReviewItem(snapshot: ItemSnapshotRecord): ReviewItem {
  return {
    id: snapshot.id,
    code: snapshot.itemCode,
    title: snapshot.itemTitle,
    description: snapshot.itemDescription,
    required: snapshot.required,
    responseType: snapshot.responseType,
  }
}

export function buildSections(snapshots: readonly ItemSnapshotRecord[]): readonly ReviewSection[] {
  const bySection = Map.groupBy(snapshots, (snapshot) => snapshot.sectionOrder)

  return [...bySection.entries()]
    .toSorted(([a], [b]) => a - b)
    .map(([order, items]) => ({
      order,
      title: items[0]?.sectionTitle ?? '',
      items: items.toSorted((a, b) => a.itemOrder - b.itemOrder).map(toReviewItem),
    }))
}

export function describeReview(
  record: ReviewApiRecord,
  reviewerName: string | null,
  items: readonly ReviewItem[],
): ReviewRecord {
  const codes = new Map(items.map((item) => [item.id, item.code]))

  return {
    id: record.id,
    cycle: record.reviewCycle,
    decision: record.decision,
    reviewerName,
    reason: record.reason,
    comments: record.comments,
    itemCodes: record.itemsToCorrect.flatMap((id) => codes.get(id) ?? []),
    reviewedAt: record.reviewedAt,
  }
}

export function suggestedItemIds(
  items: readonly ReviewItem[],
  findings: readonly InspectionFinding[] | null,
): readonly string[] {
  const flagged = new Set(findings?.flatMap((finding) => finding.itemCode ?? []))
  return items.filter((item) => flagged.has(item.code)).map((item) => item.id)
}

export function reviewStage(role: UserRole, status: InspectionStatus): ReviewStage | null {
  if (role !== 'SUPERVISOR') return null
  if (status === 'SUBMITTED') return 'begin'
  if (status === 'UNDER_REVIEW') return 'decide'
  return null
}
