/**
 * Ambiente logico da build (`NEXT_PUBLIC_APP_ENV`), com o rotulo que o
 * cabecalho mostra. Documento 14.4: o cabecalho identifica usuario e ambiente.
 */
const LABELS: Record<string, string> = {
  development: 'Desenvolvimento',
  staging: 'Homologação',
  production: 'Produção',
}

/** Sem a variavel, a build e de producao; valor desconhecido aparece como veio. */
export function environmentLabel(environment: string | undefined): string {
  const key = environment || 'production'
  return LABELS[key] ?? key
}

/** Fora de producao o rotulo ganha destaque: ninguem aprova inspecao de teste achando que e real. */
export function isProductionEnvironment(environment: string | undefined): boolean {
  return environment === undefined || environment === '' || environment === 'production'
}
