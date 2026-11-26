import { describe, expect, it } from 'vitest'

import { parseAuditValues } from '@/lib/domain/audit-values'

describe('parseAuditValues', () => {
  it('le o formato chave=valor separado por ponto e virgula', () => {
    expect(parseAuditValues('status=ASSIGNED;technicianId=t-1;canceledBy=u-9')).toEqual({
      status: 'ASSIGNED',
      technicianId: 't-1',
      canceledBy: 'u-9',
    })
  })

  it('descarta os valores nulos que o backend escreve como texto', () => {
    expect(parseAuditValues('status=IN_PROGRESS;startedAtDevice=2026-08-01T13:02:00Z;completedAtDevice=null;reason=')).toEqual({
      status: 'IN_PROGRESS',
      startedAtDevice: '2026-08-01T13:02:00Z',
    })
  })

  it('mantem o texto livre que contem ponto e virgula e igual', () => {
    expect(parseAuditValues('status=CANCELED;canceledReason=Area interditada; sem acesso; ver a=b depois')).toEqual({
      status: 'CANCELED',
      canceledReason: 'Area interditada; sem acesso; ver a=b depois',
    })
  })

  it('separa a chave seguinte mesmo depois de texto livre', () => {
    expect(parseAuditValues('reason=Foto borrada; refazer;comments=Sem observacoes;itemsToCorrect=2')).toEqual({
      reason: 'Foto borrada; refazer',
      comments: 'Sem observacoes',
      itemsToCorrect: '2',
    })
  })

  it('tolera espacos ao redor das entradas', () => {
    expect(parseAuditValues(' status=APPROVED ; reviewCycle=2 ')).toEqual({ status: 'APPROVED', reviewCycle: '2' })
  })

  it('le objeto JSON, como o do relatorio exportado', () => {
    expect(parseAuditValues('{"format":"PDF"}')).toEqual({ format: 'PDF' })
    expect(parseAuditValues('{"pages":3,"signed":true,"extra":null,"nested":{"a":1}}')).toEqual({
      pages: '3',
      signed: 'true',
      nested: '{"a":1}',
    })
  })

  it('cai para chave=valor quando o JSON esta quebrado ou nao e objeto', () => {
    expect(parseAuditValues('{"format":')).toEqual({})
    expect(parseAuditValues('[1,2]')).toEqual({})
  })

  it('devolve vazio para nulo, indefinido e texto sem entradas', () => {
    expect(parseAuditValues(null)).toEqual({})
    expect(parseAuditValues(undefined)).toEqual({})
    expect(parseAuditValues('   ')).toEqual({})
    expect(parseAuditValues('texto solto')).toEqual({})
  })
})
