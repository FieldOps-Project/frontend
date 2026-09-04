import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // O repositorio nao versiona instrucoes geradas para agentes; o conteudo
  // equivalente vive no README e nos documentos de docs/notion.
  agentRules: false,
}

export default nextConfig
