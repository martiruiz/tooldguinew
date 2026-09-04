import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import fs from 'fs'
import path from 'path'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FIELDS_SCHEMA = `
Extreu les dades del prompt de l'usuari i retorna un JSON amb exactament aquests camps (en castellà, tal com apareixeran al contracte):
{
  "EMPRESA_CONTRARIO": "Nom de l'empresa client",
  "DOMICILIO_CONTRARIO": "Adreça completa de l'empresa client",
  "CIF_CONTRARIO": "CIF o NIF de l'empresa",
  "PRESIDENTE_ADMINISTRADOR": "Nom complet del representant",
  "DNI_REPR_EMPRE": "DNI del representant",
  "CARGO_CONTRARIO": "Càrrec del representant (p.ex. Administrador Único, Director General...)",
  "ACTIVIDAD_EMPRESA": "descripció de l'activitat que presta Guinew (p.ex. marketing digital, gestión de redes sociales, diseño gráfico...)",
  "OBJETO_CONTRATO": "descripció breu del servei contractat",
  "DIAS": "dies d'antelació per comunicar canvis (p.ex. '7 días', '15 días')",
  "SERVICIOS": "llista detallada dels serveis, separada per punts o guions",
  "EUROS_TOTAL": "import total en lletres i números (p.ex. 'MIL DOSCIENTOS EUROS (1.200 €)')",
  "EUROS": "import mensual en lletres (p.ex. 'CUATROCIENTOS EUROS')",
  "EUROS_NUM": "import mensual en números (p.ex. '400 €')",
  "INDEMNIZACION_EMPRESA": "import d'indemnització per incompliment de confidencialitat (p.ex. '3.000 €')",
  "PLAZO": "durada del contracte (p.ex. '12 meses', '6 meses')",
  "RESOLUCION": "condicions resolució anticipada (p.ex. 'el Cliente deberá abonar el importe correspondiente al mes en curso')"
}
Si algun camp no s'especifica, usa un valor raonable per defecte o deixa'l buit. Retorna NOMÉS el JSON, sense cap explicació.
`

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt buit' }, { status: 400 })
    }

    // 1. Claude extreu els camps del prompt
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${FIELDS_SCHEMA}\n\nPrompt de l'usuari:\n${prompt}`,
        },
      ],
    })

    const raw = (msg.content[0] as { type: string; text: string }).text.trim()
    let fields: Record<string, string>
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      fields = JSON.parse(jsonMatch?.[0] ?? raw)
    } catch {
      return NextResponse.json({ error: 'No s\'han pogut extreure els camps del prompt.', raw }, { status: 422 })
    }

    // 2. Carrega la plantilla DOCX
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'contrato-base.docx')
    const templateBuf = fs.readFileSync(templatePath)
    const zip = new PizZip(templateBuf)
    const doc = new Docxtemplater(zip, {
      delimiters: { start: '%%', end: '%%' },
      paragraphLoop: true,
      linebreaks: true,
    })

    // 3. Omple els camps
    doc.render(fields)

    // 4. Retorna el DOCX generat
    const outBuf: Buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer
    const clientName = fields['EMPRESA_CONTRARIO']?.replace(/\s+/g, '_').slice(0, 30) || 'client'
    const filename = `Contracte_${clientName}.docx`

    return new NextResponse(new Uint8Array(outBuf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    console.error('generate-contract error:', err)
    return NextResponse.json({ error: err.message || 'Error desconegut' }, { status: 500 })
  }
}
