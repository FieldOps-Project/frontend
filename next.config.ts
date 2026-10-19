import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // O repositorio nao versiona instrucoes geradas para agentes; o conteudo
  // equivalente vive no README e nos documentos de docs/notion.
  agentRules: false,
  // Gera `.next/standalone` com servidor e apenas as dependencias usadas: e o
  // que a imagem Docker copia, sem precisar do node_modules inteiro.
  output: 'standalone',
}

export default nextConfig
