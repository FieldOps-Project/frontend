import 'server-only'

import QRCode from 'qrcode'

/**
 * QR renderizado no servidor como SVG: nitido em qualquer tamanho de impressao
 * e sem biblioteca de desenho no navegador. Correcao de erro `M` tolera
 * etiqueta um pouco riscada ou suja em campo.
 */
export async function QrCodeView({ value, size = 192, label }: { value: string; size?: number; label: string }) {
  const svg = await QRCode.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })

  return (
    <div
      role="img"
      aria-label={label}
      style={{ width: size, height: size }}
      className="[&>svg]:size-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
