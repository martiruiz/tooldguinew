'use client'

import { useState, useMemo } from 'react'
import { Copy, Check, Sparkles, Calendar, Send, ChevronDown, ChevronUp } from 'lucide-react'

interface Template {
  id: string
  category: string
  name: string
  platform: 'instagram' | 'twitter' | 'ambdues'
  template: string
  variables: string[]
}

const TEMPLATES: Template[] = [
  // RESULTADO FINAL
  { id: 'rf1', category: 'Resultat final', name: 'Final del partido', platform: 'instagram', variables: ['LOCAL','GOL_LOCAL','GOL_VISITANT','VISITANT'],
    template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\n@{LOCAL} {GOL_LOCAL} – {GOL_VISITANT} @{VISITANT}' },
  { id: 'rf2', category: 'Resultat final', name: 'Se termina el encuentro', platform: 'instagram', variables: ['LOCAL','GOL_LOCAL','GOL_VISITANT','VISITANT'],
    template: '🔚 ¡𝑺𝑬 𝑻𝑬𝑹𝑴𝑰𝑵𝑨 𝑬𝑳 𝑬𝑵𝑪𝑼𝑬𝑵𝑻𝑹𝑶!\n@{LOCAL} {GOL_LOCAL} – {GOL_VISITANT} @{VISITANT}' },
  { id: 'rf3', category: 'Resultat final', name: 'Llegamos al final', platform: 'instagram', variables: ['LOCAL','GOL_LOCAL','GOL_VISITANT','VISITANT'],
    template: '🔥 ¡𝑳𝑳𝑬𝑮𝑨𝑴𝑶𝑺 𝑨𝑳 𝑭𝑰𝑵𝑨𝑳!\n@{LOCAL} {GOL_LOCAL} – {GOL_VISITANT} @{VISITANT}' },
  { id: 'rf4', category: 'Resultat final', name: 'Final de infarto', platform: 'instagram', variables: ['LOCAL','GOL_LOCAL','GOL_VISITANT','VISITANT'],
    template: '⚡ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬 𝑰𝑵𝑭𝑨𝑹𝑻𝑶!\n@{LOCAL} {GOL_LOCAL} – {GOL_VISITANT} @{VISITANT}' },

  // RESULTAT FINAL – PARTITS ESPECÍFICS J4–J30
  { id: 'j4m1', category: 'Resultat final', name: 'J4 · Dicorpebal – Fertiberia', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nDicorpebal Logroño La Rioja {GOL_LOCAL} – {GOL_VISITANT} Fertiberia Puerto Sagunto' },
  { id: 'j4m2', category: 'Resultat final', name: 'J4 · Fraikin – REBI', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFraikin BM. Granollers {GOL_LOCAL} – {GOL_VISITANT} REBI Balonmano Cuenca' },
  { id: 'j4m3', category: 'Resultat final', name: 'J4 · IRUDEK – Ángel Ximénez', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nIRUDEK Bidasoa Irun {GOL_LOCAL} – {GOL_VISITANT} Cajasol Ángel Ximénez P. Genil' },
  { id: 'j4m4', category: 'Resultat final', name: 'J4 · BM. Caserío – Ademar', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBM. Caserío Ciudad Real {GOL_LOCAL} – {GOL_VISITANT} ABANCA Ademar León' },
  { id: 'j4m5', category: 'Resultat final', name: 'J4 · Barça – HORNEO', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBarça {GOL_LOCAL} – {GOL_VISITANT} HORNEO BM. Alicante' },
  { id: 'j4m6', category: 'Resultat final', name: 'J4 · Bathco – Tubos Aranda', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBathco BM. Torrelavega {GOL_LOCAL} – {GOL_VISITANT} Tubos Aranda Villa de Aranda' },
  { id: 'j4m7', category: 'Resultat final', name: 'J4 · Morrazo – Recoletas', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFrigoríficos del Morrazo {GOL_LOCAL} – {GOL_VISITANT} Recoletas Salud At. Valladolid' },
  { id: 'j4m8', category: 'Resultat final', name: 'J4 · BM. Nava – Cajasol Sevilla', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nViveros Herol BM. Nava {GOL_LOCAL} – {GOL_VISITANT} Cajasol Sevilla BM. Proin' },
  { id: 'j5m1', category: 'Resultat final', name: 'J5 · Tubos Aranda – Barça', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nTubos Aranda Villa de Aranda {GOL_LOCAL} – {GOL_VISITANT} Barça' },
  { id: 'j5m2', category: 'Resultat final', name: 'J5 · Bathco – Morrazo', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBathco BM. Torrelavega {GOL_LOCAL} – {GOL_VISITANT} Frigoríficos del Morrazo' },
  { id: 'j5m3', category: 'Resultat final', name: 'J5 · Recoletas – Ángel Ximénez', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nRecoletas Salud At. Valladolid {GOL_LOCAL} – {GOL_VISITANT} Cajasol Ángel Ximénez P. Genil' },
  { id: 'j5m4', category: 'Resultat final', name: 'J5 · Ademar – BM. Nava', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nABANCA Ademar León {GOL_LOCAL} – {GOL_VISITANT} Viveros Herol BM. Nava' },
  { id: 'j5m5', category: 'Resultat final', name: 'J5 · BM. Caserío – Fraikin', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBM. Caserío Ciudad Real {GOL_LOCAL} – {GOL_VISITANT} Fraikin BM. Granollers' },
  { id: 'j5m6', category: 'Resultat final', name: 'J5 · REBI – Dicorpebal', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nREBI Balonmano Cuenca {GOL_LOCAL} – {GOL_VISITANT} Dicorpebal Logroño La Rioja' },
  { id: 'j5m7', category: 'Resultat final', name: 'J5 · IRUDEK – Cajasol Sevilla', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nIRUDEK Bidasoa Irun {GOL_LOCAL} – {GOL_VISITANT} Cajasol Sevilla BM. Proin' },
  { id: 'j5m8', category: 'Resultat final', name: 'J5 · Fertiberia – HORNEO', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFertiberia Puerto Sagunto {GOL_LOCAL} – {GOL_VISITANT} HORNEO BM. Alicante' },
  { id: 'j6m1', category: 'Resultat final', name: 'J6 · HORNEO – IRUDEK', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nHORNEO BM. Alicante {GOL_LOCAL} – {GOL_VISITANT} IRUDEK Bidasoa Irun' },
  { id: 'j6m2', category: 'Resultat final', name: 'J6 · Recoletas – BM. Caserío', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nRecoletas Salud At. Valladolid {GOL_LOCAL} – {GOL_VISITANT} BM. Caserío Ciudad Real' },
  { id: 'j6m3', category: 'Resultat final', name: 'J6 · Ademar – Tubos Aranda', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nABANCA Ademar León {GOL_LOCAL} – {GOL_VISITANT} Tubos Aranda Villa de Aranda' },
  { id: 'j6m4', category: 'Resultat final', name: 'J6 · REBI – Bathco', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nREBI Balonmano Cuenca {GOL_LOCAL} – {GOL_VISITANT} Bathco BM. Torrelavega' },
  { id: 'j6m5', category: 'Resultat final', name: 'J6 · Morrazo – Barça', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFrigoríficos del Morrazo {GOL_LOCAL} – {GOL_VISITANT} Barça' },
  { id: 'j6m6', category: 'Resultat final', name: 'J6 · Ángel Ximénez – Dicorpebal', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Ángel Ximénez P. Genil {GOL_LOCAL} – {GOL_VISITANT} Dicorpebal Logroño La Rioja' },
  { id: 'j6m7', category: 'Resultat final', name: 'J6 · Cajasol Sevilla – Fraikin', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Sevilla BM. Proin {GOL_LOCAL} – {GOL_VISITANT} Fraikin BM. Granollers' },
  { id: 'j6m8', category: 'Resultat final', name: 'J6 · Fertiberia – BM. Nava', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFertiberia Puerto Sagunto {GOL_LOCAL} – {GOL_VISITANT} Viveros Herol BM. Nava' },
  { id: 'j7m1', category: 'Resultat final', name: 'J7 · Barça – REBI', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBarça {GOL_LOCAL} – {GOL_VISITANT} REBI Balonmano Cuenca' },
  { id: 'j7m2', category: 'Resultat final', name: 'J7 · Dicorpebal – Morrazo', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nDicorpebal Logroño La Rioja {GOL_LOCAL} – {GOL_VISITANT} Frigoríficos del Morrazo' },
  { id: 'j7m3', category: 'Resultat final', name: 'J7 · Fraikin – Ángel Ximénez', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFraikin BM. Granollers {GOL_LOCAL} – {GOL_VISITANT} Cajasol Ángel Ximénez P. Genil' },
  { id: 'j7m4', category: 'Resultat final', name: 'J7 · IRUDEK – BM. Caserío', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nIRUDEK Bidasoa Irun {GOL_LOCAL} – {GOL_VISITANT} BM. Caserío Ciudad Real' },
  { id: 'j7m5', category: 'Resultat final', name: 'J7 · Bathco – Cajasol Sevilla', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBathco BM. Torrelavega {GOL_LOCAL} – {GOL_VISITANT} Cajasol Sevilla BM. Proin' },
  { id: 'j7m6', category: 'Resultat final', name: 'J7 · HORNEO – Ademar', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nHORNEO BM. Alicante {GOL_LOCAL} – {GOL_VISITANT} ABANCA Ademar León' },
  { id: 'j7m7', category: 'Resultat final', name: 'J7 · Tubos Aranda – Fertiberia', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nTubos Aranda Villa de Aranda {GOL_LOCAL} – {GOL_VISITANT} Fertiberia Puerto Sagunto' },
  { id: 'j7m8', category: 'Resultat final', name: 'J7 · BM. Nava – Recoletas', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nViveros Herol BM. Nava {GOL_LOCAL} – {GOL_VISITANT} Recoletas Salud At. Valladolid' },
  { id: 'j8m1', category: 'Resultat final', name: 'J8 · Fraikin – Barça', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFraikin BM. Granollers {GOL_LOCAL} – {GOL_VISITANT} Barça' },
  { id: 'j8m2', category: 'Resultat final', name: 'J8 · Recoletas – Bathco', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nRecoletas Salud At. Valladolid {GOL_LOCAL} – {GOL_VISITANT} Bathco BM. Torrelavega' },
  { id: 'j8m3', category: 'Resultat final', name: 'J8 · Ademar – IRUDEK', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nABANCA Ademar León {GOL_LOCAL} – {GOL_VISITANT} IRUDEK Bidasoa Irun' },
  { id: 'j8m4', category: 'Resultat final', name: 'J8 · BM. Caserío – Dicorpebal', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBM. Caserío Ciudad Real {GOL_LOCAL} – {GOL_VISITANT} Dicorpebal Logroño La Rioja' },
  { id: 'j8m5', category: 'Resultat final', name: 'J8 · Morrazo – HORNEO', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFrigoríficos del Morrazo {GOL_LOCAL} – {GOL_VISITANT} HORNEO BM. Alicante' },
  { id: 'j8m6', category: 'Resultat final', name: 'J8 · Ángel Ximénez – Tubos Aranda', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Ángel Ximénez P. Genil {GOL_LOCAL} – {GOL_VISITANT} Tubos Aranda Villa de Aranda' },
  { id: 'j8m7', category: 'Resultat final', name: 'J8 · BM. Nava – REBI', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nViveros Herol BM. Nava {GOL_LOCAL} – {GOL_VISITANT} REBI Balonmano Cuenca' },
  { id: 'j8m8', category: 'Resultat final', name: 'J8 · Cajasol Sevilla – Fertiberia', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Sevilla BM. Proin {GOL_LOCAL} – {GOL_VISITANT} Fertiberia Puerto Sagunto' },
  { id: 'j9m1', category: 'Resultat final', name: 'J9 · Barça – Cajasol Sevilla', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBarça {GOL_LOCAL} – {GOL_VISITANT} Cajasol Sevilla BM. Proin' },
  { id: 'j9m2', category: 'Resultat final', name: 'J9 · Dicorpebal – Fraikin', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nDicorpebal Logroño La Rioja {GOL_LOCAL} – {GOL_VISITANT} Fraikin BM. Granollers' },
  { id: 'j9m3', category: 'Resultat final', name: 'J9 · Bathco – Ademar', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBathco BM. Torrelavega {GOL_LOCAL} – {GOL_VISITANT} ABANCA Ademar León' },
  { id: 'j9m4', category: 'Resultat final', name: 'J9 · Recoletas – HORNEO', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nRecoletas Salud At. Valladolid {GOL_LOCAL} – {GOL_VISITANT} HORNEO BM. Alicante' },
  { id: 'j9m5', category: 'Resultat final', name: 'J9 · Tubos Aranda – BM. Nava', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nTubos Aranda Villa de Aranda {GOL_LOCAL} – {GOL_VISITANT} Viveros Herol BM. Nava' },
  { id: 'j9m6', category: 'Resultat final', name: 'J9 · REBI – BM. Caserío', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nREBI Balonmano Cuenca {GOL_LOCAL} – {GOL_VISITANT} BM. Caserío Ciudad Real' },
  { id: 'j9m7', category: 'Resultat final', name: 'J9 · Ángel Ximénez – Morrazo', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Ángel Ximénez P. Genil {GOL_LOCAL} – {GOL_VISITANT} Frigoríficos del Morrazo' },
  { id: 'j9m8', category: 'Resultat final', name: 'J9 · Fertiberia – IRUDEK', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFertiberia Puerto Sagunto {GOL_LOCAL} – {GOL_VISITANT} IRUDEK Bidasoa Irun' },
  { id: 'j10m1', category: 'Resultat final', name: 'J10 · Dicorpebal – Ademar', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nDicorpebal Logroño La Rioja {GOL_LOCAL} – {GOL_VISITANT} ABANCA Ademar León' },
  { id: 'j10m2', category: 'Resultat final', name: 'J10 · Fraikin – Recoletas', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFraikin BM. Granollers {GOL_LOCAL} – {GOL_VISITANT} Recoletas Salud At. Valladolid' },
  { id: 'j10m3', category: 'Resultat final', name: 'J10 · IRUDEK – Barça', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nIRUDEK Bidasoa Irun {GOL_LOCAL} – {GOL_VISITANT} Barça' },
  { id: 'j10m4', category: 'Resultat final', name: 'J10 · BM. Caserío – Bathco', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBM. Caserío Ciudad Real {GOL_LOCAL} – {GOL_VISITANT} Bathco BM. Torrelavega' },
  { id: 'j10m5', category: 'Resultat final', name: 'J10 · HORNEO – Tubos Aranda', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nHORNEO BM. Alicante {GOL_LOCAL} – {GOL_VISITANT} Tubos Aranda Villa de Aranda' },
  { id: 'j10m6', category: 'Resultat final', name: 'J10 · Fertiberia – REBI', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFertiberia Puerto Sagunto {GOL_LOCAL} – {GOL_VISITANT} REBI Balonmano Cuenca' },
  { id: 'j10m7', category: 'Resultat final', name: 'J10 · BM. Nava – Ángel Ximénez', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nViveros Herol BM. Nava {GOL_LOCAL} – {GOL_VISITANT} Cajasol Ángel Ximénez P. Genil' },
  { id: 'j10m8', category: 'Resultat final', name: 'J10 · Morrazo – Cajasol Sevilla', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFrigoríficos del Morrazo {GOL_LOCAL} – {GOL_VISITANT} Cajasol Sevilla BM. Proin' },
  { id: 'j11m1', category: 'Resultat final', name: 'J11 · Barça – BM. Nava', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBarça {GOL_LOCAL} – {GOL_VISITANT} Viveros Herol BM. Nava' },
  { id: 'j11m2', category: 'Resultat final', name: 'J11 · Bathco – IRUDEK', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBathco BM. Torrelavega {GOL_LOCAL} – {GOL_VISITANT} IRUDEK Bidasoa Irun' },
  { id: 'j11m3', category: 'Resultat final', name: 'J11 · Recoletas – Dicorpebal', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nRecoletas Salud At. Valladolid {GOL_LOCAL} – {GOL_VISITANT} Dicorpebal Logroño La Rioja' },
  { id: 'j11m4', category: 'Resultat final', name: 'J11 · Ademar – Fraikin', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nABANCA Ademar León {GOL_LOCAL} – {GOL_VISITANT} Fraikin BM. Granollers' },
  { id: 'j11m5', category: 'Resultat final', name: 'J11 · REBI – Tubos Aranda', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nREBI Balonmano Cuenca {GOL_LOCAL} – {GOL_VISITANT} Tubos Aranda Villa de Aranda' },
  { id: 'j11m6', category: 'Resultat final', name: 'J11 · Morrazo – BM. Caserío', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFrigoríficos del Morrazo {GOL_LOCAL} – {GOL_VISITANT} BM. Caserío Ciudad Real' },
  { id: 'j11m7', category: 'Resultat final', name: 'J11 · Ángel Ximénez – Fertiberia', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Ángel Ximénez P. Genil {GOL_LOCAL} – {GOL_VISITANT} Fertiberia Puerto Sagunto' },
  { id: 'j11m8', category: 'Resultat final', name: 'J11 · Cajasol Sevilla – HORNEO', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Sevilla BM. Proin {GOL_LOCAL} – {GOL_VISITANT} HORNEO BM. Alicante' },
  { id: 'j12m1', category: 'Resultat final', name: 'J12 · Barça – Recoletas', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBarça {GOL_LOCAL} – {GOL_VISITANT} Recoletas Salud At. Valladolid' },
  { id: 'j12m2', category: 'Resultat final', name: 'J12 · Dicorpebal – IRUDEK', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nDicorpebal Logroño La Rioja {GOL_LOCAL} – {GOL_VISITANT} IRUDEK Bidasoa Irun' },
  { id: 'j12m3', category: 'Resultat final', name: 'J12 · Fraikin – BM. Nava', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFraikin BM. Granollers {GOL_LOCAL} – {GOL_VISITANT} Viveros Herol BM. Nava' },
  { id: 'j12m4', category: 'Resultat final', name: 'J12 · Bathco – Fertiberia', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBathco BM. Torrelavega {GOL_LOCAL} – {GOL_VISITANT} Fertiberia Puerto Sagunto' },
  { id: 'j12m5', category: 'Resultat final', name: 'J12 · Ademar – Ángel Ximénez', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nABANCA Ademar León {GOL_LOCAL} – {GOL_VISITANT} Cajasol Ángel Ximénez P. Genil' },
  { id: 'j12m6', category: 'Resultat final', name: 'J12 · BM. Caserío – Cajasol Sevilla', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBM. Caserío Ciudad Real {GOL_LOCAL} – {GOL_VISITANT} Cajasol Sevilla BM. Proin' },
  { id: 'j12m7', category: 'Resultat final', name: 'J12 · HORNEO – REBI', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nHORNEO BM. Alicante {GOL_LOCAL} – {GOL_VISITANT} REBI Balonmano Cuenca' },
  { id: 'j12m8', category: 'Resultat final', name: 'J12 · Tubos Aranda – Morrazo', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nTubos Aranda Villa de Aranda {GOL_LOCAL} – {GOL_VISITANT} Frigoríficos del Morrazo' },
  { id: 'j13m1', category: 'Resultat final', name: 'J13 · Dicorpebal – Bathco', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nDicorpebal Logroño La Rioja {GOL_LOCAL} – {GOL_VISITANT} Bathco BM. Torrelavega' },
  { id: 'j13m2', category: 'Resultat final', name: 'J13 · IRUDEK – Fraikin', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nIRUDEK Bidasoa Irun {GOL_LOCAL} – {GOL_VISITANT} Fraikin BM. Granollers' },
  { id: 'j13m3', category: 'Resultat final', name: 'J13 · Recoletas – Ademar', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nRecoletas Salud At. Valladolid {GOL_LOCAL} – {GOL_VISITANT} ABANCA Ademar León' },
  { id: 'j13m4', category: 'Resultat final', name: 'J13 · Morrazo – REBI', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFrigoríficos del Morrazo {GOL_LOCAL} – {GOL_VISITANT} REBI Balonmano Cuenca' },
  { id: 'j13m5', category: 'Resultat final', name: 'J13 · Ángel Ximénez – HORNEO', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Ángel Ximénez P. Genil {GOL_LOCAL} – {GOL_VISITANT} HORNEO BM. Alicante' },
  { id: 'j13m6', category: 'Resultat final', name: 'J13 · BM. Nava – BM. Caserío', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nViveros Herol BM. Nava {GOL_LOCAL} – {GOL_VISITANT} BM. Caserío Ciudad Real' },
  { id: 'j13m7', category: 'Resultat final', name: 'J13 · Cajasol Sevilla – Tubos Aranda', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Sevilla BM. Proin {GOL_LOCAL} – {GOL_VISITANT} Tubos Aranda Villa de Aranda' },
  { id: 'j13m8', category: 'Resultat final', name: 'J13 · Fertiberia – Barça', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFertiberia Puerto Sagunto {GOL_LOCAL} – {GOL_VISITANT} Barça' },
  { id: 'j14m1', category: 'Resultat final', name: 'J14 · Barça – Ademar', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBarça {GOL_LOCAL} – {GOL_VISITANT} ABANCA Ademar León' },
  { id: 'j14m2', category: 'Resultat final', name: 'J14 · Fraikin – Bathco', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFraikin BM. Granollers {GOL_LOCAL} – {GOL_VISITANT} Bathco BM. Torrelavega' },
  { id: 'j14m3', category: 'Resultat final', name: 'J14 · Tubos Aranda – Dicorpebal', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nTubos Aranda Villa de Aranda {GOL_LOCAL} – {GOL_VISITANT} Dicorpebal Logroño La Rioja' },
  { id: 'j14m4', category: 'Resultat final', name: 'J14 · REBI – IRUDEK', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nREBI Balonmano Cuenca {GOL_LOCAL} – {GOL_VISITANT} IRUDEK Bidasoa Irun' },
  { id: 'j14m5', category: 'Resultat final', name: 'J14 · Ángel Ximénez – BM. Caserío', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Ángel Ximénez P. Genil {GOL_LOCAL} – {GOL_VISITANT} BM. Caserío Ciudad Real' },
  { id: 'j14m6', category: 'Resultat final', name: 'J14 · BM. Nava – HORNEO', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nViveros Herol BM. Nava {GOL_LOCAL} – {GOL_VISITANT} HORNEO BM. Alicante' },
  { id: 'j14m7', category: 'Resultat final', name: 'J14 · Cajasol Sevilla – Recoletas', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Sevilla BM. Proin {GOL_LOCAL} – {GOL_VISITANT} Recoletas Salud At. Valladolid' },
  { id: 'j14m8', category: 'Resultat final', name: 'J14 · Fertiberia – Morrazo', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFertiberia Puerto Sagunto {GOL_LOCAL} – {GOL_VISITANT} Frigoríficos del Morrazo' },
  { id: 'j15m1', category: 'Resultat final', name: 'J15 · IRUDEK – Recoletas', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nIRUDEK Bidasoa Irun {GOL_LOCAL} – {GOL_VISITANT} Recoletas Salud At. Valladolid' },
  { id: 'j15m2', category: 'Resultat final', name: 'J15 · Bathco – Barça', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBathco BM. Torrelavega {GOL_LOCAL} – {GOL_VISITANT} Barça' },
  { id: 'j15m3', category: 'Resultat final', name: 'J15 · Ademar – Cajasol Sevilla', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nABANCA Ademar León {GOL_LOCAL} – {GOL_VISITANT} Cajasol Sevilla BM. Proin' },
  { id: 'j15m4', category: 'Resultat final', name: 'J15 · BM. Caserío – Fertiberia', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBM. Caserío Ciudad Real {GOL_LOCAL} – {GOL_VISITANT} Fertiberia Puerto Sagunto' },
  { id: 'j15m5', category: 'Resultat final', name: 'J15 · HORNEO – Dicorpebal', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nHORNEO BM. Alicante {GOL_LOCAL} – {GOL_VISITANT} Dicorpebal Logroño La Rioja' },
  { id: 'j15m6', category: 'Resultat final', name: 'J15 · Tubos Aranda – Fraikin', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nTubos Aranda Villa de Aranda {GOL_LOCAL} – {GOL_VISITANT} Fraikin BM. Granollers' },
  { id: 'j15m7', category: 'Resultat final', name: 'J15 · REBI – Ángel Ximénez', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nREBI Balonmano Cuenca {GOL_LOCAL} – {GOL_VISITANT} Cajasol Ángel Ximénez P. Genil' },
  { id: 'j15m8', category: 'Resultat final', name: 'J15 · Morrazo – BM. Nava', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFrigoríficos del Morrazo {GOL_LOCAL} – {GOL_VISITANT} Viveros Herol BM. Nava' },
  { id: 'j16m1', category: 'Resultat final', name: 'J16 · Barça – Dicorpebal', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBarça {GOL_LOCAL} – {GOL_VISITANT} Dicorpebal Logroño La Rioja' },
  { id: 'j16m2', category: 'Resultat final', name: 'J16 · Bathco – HORNEO', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBathco BM. Torrelavega {GOL_LOCAL} – {GOL_VISITANT} HORNEO BM. Alicante' },
  { id: 'j16m3', category: 'Resultat final', name: 'J16 · Recoletas – REBI', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nRecoletas Salud At. Valladolid {GOL_LOCAL} – {GOL_VISITANT} REBI Balonmano Cuenca' },
  { id: 'j16m4', category: 'Resultat final', name: 'J16 · Ademar – Fertiberia', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nABANCA Ademar León {GOL_LOCAL} – {GOL_VISITANT} Fertiberia Puerto Sagunto' },
  { id: 'j16m5', category: 'Resultat final', name: 'J16 · BM. Caserío – Tubos Aranda', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBM. Caserío Ciudad Real {GOL_LOCAL} – {GOL_VISITANT} Tubos Aranda Villa de Aranda' },
  { id: 'j16m6', category: 'Resultat final', name: 'J16 · Morrazo – Fraikin', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFrigoríficos del Morrazo {GOL_LOCAL} – {GOL_VISITANT} Fraikin BM. Granollers' },
  { id: 'j16m7', category: 'Resultat final', name: 'J16 · Ángel Ximénez – Cajasol Sevilla', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Ángel Ximénez P. Genil {GOL_LOCAL} – {GOL_VISITANT} Cajasol Sevilla BM. Proin' },
  { id: 'j16m8', category: 'Resultat final', name: 'J16 · BM. Nava – IRUDEK', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nViveros Herol BM. Nava {GOL_LOCAL} – {GOL_VISITANT} IRUDEK Bidasoa Irun' },
  { id: 'j17m1', category: 'Resultat final', name: 'J17 · Barça – Ángel Ximénez', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBarça {GOL_LOCAL} – {GOL_VISITANT} Cajasol Ángel Ximénez P. Genil' },
  { id: 'j17m2', category: 'Resultat final', name: 'J17 · Dicorpebal – Cajasol Sevilla', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nDicorpebal Logroño La Rioja {GOL_LOCAL} – {GOL_VISITANT} Cajasol Sevilla BM. Proin' },
  { id: 'j17m3', category: 'Resultat final', name: 'J17 · Fraikin – Fertiberia', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFraikin BM. Granollers {GOL_LOCAL} – {GOL_VISITANT} Fertiberia Puerto Sagunto' },
  { id: 'j17m4', category: 'Resultat final', name: 'J17 · IRUDEK – Morrazo', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nIRUDEK Bidasoa Irun {GOL_LOCAL} – {GOL_VISITANT} Frigoríficos del Morrazo' },
  { id: 'j17m5', category: 'Resultat final', name: 'J17 · HORNEO – BM. Caserío', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nHORNEO BM. Alicante {GOL_LOCAL} – {GOL_VISITANT} BM. Caserío Ciudad Real' },
  { id: 'j17m6', category: 'Resultat final', name: 'J17 · Tubos Aranda – Recoletas', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nTubos Aranda Villa de Aranda {GOL_LOCAL} – {GOL_VISITANT} Recoletas Salud At. Valladolid' },
  { id: 'j17m7', category: 'Resultat final', name: 'J17 · REBI – Ademar', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nREBI Balonmano Cuenca {GOL_LOCAL} – {GOL_VISITANT} ABANCA Ademar León' },
  { id: 'j17m8', category: 'Resultat final', name: 'J17 · BM. Nava – Bathco', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nViveros Herol BM. Nava {GOL_LOCAL} – {GOL_VISITANT} Bathco BM. Torrelavega' },
  { id: 'j18m1', category: 'Resultat final', name: 'J18 · Dicorpebal – BM. Nava', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nDicorpebal Logroño La Rioja {GOL_LOCAL} – {GOL_VISITANT} Viveros Herol BM. Nava' },
  { id: 'j18m2', category: 'Resultat final', name: 'J18 · Fraikin – HORNEO', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFraikin BM. Granollers {GOL_LOCAL} – {GOL_VISITANT} HORNEO BM. Alicante' },
  { id: 'j18m3', category: 'Resultat final', name: 'J18 · IRUDEK – Tubos Aranda', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nIRUDEK Bidasoa Irun {GOL_LOCAL} – {GOL_VISITANT} Tubos Aranda Villa de Aranda' },
  { id: 'j18m4', category: 'Resultat final', name: 'J18 · Bathco – Ángel Ximénez', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBathco BM. Torrelavega {GOL_LOCAL} – {GOL_VISITANT} Cajasol Ángel Ximénez P. Genil' },
  { id: 'j18m5', category: 'Resultat final', name: 'J18 · BM. Caserío – Barça', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBM. Caserío Ciudad Real {GOL_LOCAL} – {GOL_VISITANT} Barça' },
  { id: 'j18m6', category: 'Resultat final', name: 'J18 · Morrazo – Ademar', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFrigoríficos del Morrazo {GOL_LOCAL} – {GOL_VISITANT} ABANCA Ademar León' },
  { id: 'j18m7', category: 'Resultat final', name: 'J18 · Cajasol Sevilla – REBI', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Sevilla BM. Proin {GOL_LOCAL} – {GOL_VISITANT} REBI Balonmano Cuenca' },
  { id: 'j18m8', category: 'Resultat final', name: 'J18 · Fertiberia – Recoletas', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFertiberia Puerto Sagunto {GOL_LOCAL} – {GOL_VISITANT} Recoletas Salud At. Valladolid' },
  { id: 'j19m1', category: 'Resultat final', name: 'J19 · HORNEO – Barça', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nHORNEO BM. Alicante {GOL_LOCAL} – {GOL_VISITANT} Barça' },
  { id: 'j19m2', category: 'Resultat final', name: 'J19 · Tubos Aranda – Bathco', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nTubos Aranda Villa de Aranda {GOL_LOCAL} – {GOL_VISITANT} Bathco BM. Torrelavega' },
  { id: 'j19m3', category: 'Resultat final', name: 'J19 · Recoletas – Morrazo', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nRecoletas Salud At. Valladolid {GOL_LOCAL} – {GOL_VISITANT} Frigoríficos del Morrazo' },
  { id: 'j19m4', category: 'Resultat final', name: 'J19 · Ademar – BM. Caserío', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nABANCA Ademar León {GOL_LOCAL} – {GOL_VISITANT} BM. Caserío Ciudad Real' },
  { id: 'j19m5', category: 'Resultat final', name: 'J19 · REBI – Fraikin', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nREBI Balonmano Cuenca {GOL_LOCAL} – {GOL_VISITANT} Fraikin BM. Granollers' },
  { id: 'j19m6', category: 'Resultat final', name: 'J19 · Ángel Ximénez – IRUDEK', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Ángel Ximénez P. Genil {GOL_LOCAL} – {GOL_VISITANT} IRUDEK Bidasoa Irun' },
  { id: 'j19m7', category: 'Resultat final', name: 'J19 · Cajasol Sevilla – BM. Nava', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Sevilla BM. Proin {GOL_LOCAL} – {GOL_VISITANT} Viveros Herol BM. Nava' },
  { id: 'j19m8', category: 'Resultat final', name: 'J19 · Fertiberia – Dicorpebal', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFertiberia Puerto Sagunto {GOL_LOCAL} – {GOL_VISITANT} Dicorpebal Logroño La Rioja' },
  { id: 'j20m1', category: 'Resultat final', name: 'J20 · Dicorpebal – REBI', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nDicorpebal Logroño La Rioja {GOL_LOCAL} – {GOL_VISITANT} REBI Balonmano Cuenca' },
  { id: 'j20m2', category: 'Resultat final', name: 'J20 · Fraikin – BM. Caserío', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFraikin BM. Granollers {GOL_LOCAL} – {GOL_VISITANT} BM. Caserío Ciudad Real' },
  { id: 'j20m3', category: 'Resultat final', name: 'J20 · Cajasol Sevilla – IRUDEK', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Sevilla BM. Proin {GOL_LOCAL} – {GOL_VISITANT} IRUDEK Bidasoa Irun' },
  { id: 'j20m4', category: 'Resultat final', name: 'J20 · HORNEO – Fertiberia', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nHORNEO BM. Alicante {GOL_LOCAL} – {GOL_VISITANT} Fertiberia Puerto Sagunto' },
  { id: 'j20m5', category: 'Resultat final', name: 'J20 · Barça – Tubos Aranda', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBarça {GOL_LOCAL} – {GOL_VISITANT} Tubos Aranda Villa de Aranda' },
  { id: 'j20m6', category: 'Resultat final', name: 'J20 · Morrazo – Bathco', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFrigoríficos del Morrazo {GOL_LOCAL} – {GOL_VISITANT} Bathco BM. Torrelavega' },
  { id: 'j20m7', category: 'Resultat final', name: 'J20 · Ángel Ximénez – Recoletas', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Ángel Ximénez P. Genil {GOL_LOCAL} – {GOL_VISITANT} Recoletas Salud At. Valladolid' },
  { id: 'j20m8', category: 'Resultat final', name: 'J20 · BM. Nava – Ademar', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nViveros Herol BM. Nava {GOL_LOCAL} – {GOL_VISITANT} ABANCA Ademar León' },
  { id: 'j21m1', category: 'Resultat final', name: 'J21 · Barça – Morrazo', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBarça {GOL_LOCAL} – {GOL_VISITANT} Frigoríficos del Morrazo' },
  { id: 'j21m2', category: 'Resultat final', name: 'J21 · Dicorpebal – Ángel Ximénez', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nDicorpebal Logroño La Rioja {GOL_LOCAL} – {GOL_VISITANT} Cajasol Ángel Ximénez P. Genil' },
  { id: 'j21m3', category: 'Resultat final', name: 'J21 · Fraikin – Cajasol Sevilla', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFraikin BM. Granollers {GOL_LOCAL} – {GOL_VISITANT} Cajasol Sevilla BM. Proin' },
  { id: 'j21m4', category: 'Resultat final', name: 'J21 · Bathco – REBI', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBathco BM. Torrelavega {GOL_LOCAL} – {GOL_VISITANT} REBI Balonmano Cuenca' },
  { id: 'j21m5', category: 'Resultat final', name: 'J21 · BM. Caserío – Recoletas', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBM. Caserío Ciudad Real {GOL_LOCAL} – {GOL_VISITANT} Recoletas Salud At. Valladolid' },
  { id: 'j21m6', category: 'Resultat final', name: 'J21 · IRUDEK – HORNEO', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nIRUDEK Bidasoa Irun {GOL_LOCAL} – {GOL_VISITANT} HORNEO BM. Alicante' },
  { id: 'j21m7', category: 'Resultat final', name: 'J21 · Tubos Aranda – Ademar', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nTubos Aranda Villa de Aranda {GOL_LOCAL} – {GOL_VISITANT} ABANCA Ademar León' },
  { id: 'j21m8', category: 'Resultat final', name: 'J21 · BM. Nava – Fertiberia', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nViveros Herol BM. Nava {GOL_LOCAL} – {GOL_VISITANT} Fertiberia Puerto Sagunto' },
  { id: 'j22m1', category: 'Resultat final', name: 'J22 · Recoletas – BM. Nava', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nRecoletas Salud At. Valladolid {GOL_LOCAL} – {GOL_VISITANT} Viveros Herol BM. Nava' },
  { id: 'j22m2', category: 'Resultat final', name: 'J22 · Ademar – HORNEO', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nABANCA Ademar León {GOL_LOCAL} – {GOL_VISITANT} HORNEO BM. Alicante' },
  { id: 'j22m3', category: 'Resultat final', name: 'J22 · BM. Caserío – IRUDEK', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBM. Caserío Ciudad Real {GOL_LOCAL} – {GOL_VISITANT} IRUDEK Bidasoa Irun' },
  { id: 'j22m4', category: 'Resultat final', name: 'J22 · REBI – Barça', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nREBI Balonmano Cuenca {GOL_LOCAL} – {GOL_VISITANT} Barça' },
  { id: 'j22m5', category: 'Resultat final', name: 'J22 · Morrazo – Dicorpebal', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFrigoríficos del Morrazo {GOL_LOCAL} – {GOL_VISITANT} Dicorpebal Logroño La Rioja' },
  { id: 'j22m6', category: 'Resultat final', name: 'J22 · Ángel Ximénez – Fraikin', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Ángel Ximénez P. Genil {GOL_LOCAL} – {GOL_VISITANT} Fraikin BM. Granollers' },
  { id: 'j22m7', category: 'Resultat final', name: 'J22 · Cajasol Sevilla – Bathco', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Sevilla BM. Proin {GOL_LOCAL} – {GOL_VISITANT} Bathco BM. Torrelavega' },
  { id: 'j22m8', category: 'Resultat final', name: 'J22 · Fertiberia – Tubos Aranda', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFertiberia Puerto Sagunto {GOL_LOCAL} – {GOL_VISITANT} Tubos Aranda Villa de Aranda' },
  { id: 'j23m1', category: 'Resultat final', name: 'J23 · Barça – Fraikin', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBarça {GOL_LOCAL} – {GOL_VISITANT} Fraikin BM. Granollers' },
  { id: 'j23m2', category: 'Resultat final', name: 'J23 · Dicorpebal – BM. Caserío', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nDicorpebal Logroño La Rioja {GOL_LOCAL} – {GOL_VISITANT} BM. Caserío Ciudad Real' },
  { id: 'j23m3', category: 'Resultat final', name: 'J23 · IRUDEK – Ademar', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nIRUDEK Bidasoa Irun {GOL_LOCAL} – {GOL_VISITANT} ABANCA Ademar León' },
  { id: 'j23m4', category: 'Resultat final', name: 'J23 · Bathco – Recoletas', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBathco BM. Torrelavega {GOL_LOCAL} – {GOL_VISITANT} Recoletas Salud At. Valladolid' },
  { id: 'j23m5', category: 'Resultat final', name: 'J23 · HORNEO – Morrazo', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nHORNEO BM. Alicante {GOL_LOCAL} – {GOL_VISITANT} Frigoríficos del Morrazo' },
  { id: 'j23m6', category: 'Resultat final', name: 'J23 · Tubos Aranda – Ángel Ximénez', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nTubos Aranda Villa de Aranda {GOL_LOCAL} – {GOL_VISITANT} Cajasol Ángel Ximénez P. Genil' },
  { id: 'j23m7', category: 'Resultat final', name: 'J23 · REBI – BM. Nava', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nREBI Balonmano Cuenca {GOL_LOCAL} – {GOL_VISITANT} Viveros Herol BM. Nava' },
  { id: 'j23m8', category: 'Resultat final', name: 'J23 · Fertiberia – Cajasol Sevilla', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFertiberia Puerto Sagunto {GOL_LOCAL} – {GOL_VISITANT} Cajasol Sevilla BM. Proin' },
  { id: 'j24m1', category: 'Resultat final', name: 'J24 · Fraikin – Dicorpebal', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFraikin BM. Granollers {GOL_LOCAL} – {GOL_VISITANT} Dicorpebal Logroño La Rioja' },
  { id: 'j24m2', category: 'Resultat final', name: 'J24 · IRUDEK – Fertiberia', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nIRUDEK Bidasoa Irun {GOL_LOCAL} – {GOL_VISITANT} Fertiberia Puerto Sagunto' },
  { id: 'j24m3', category: 'Resultat final', name: 'J24 · Ademar – Bathco', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nABANCA Ademar León {GOL_LOCAL} – {GOL_VISITANT} Bathco BM. Torrelavega' },
  { id: 'j24m4', category: 'Resultat final', name: 'J24 · BM. Caserío – REBI', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBM. Caserío Ciudad Real {GOL_LOCAL} – {GOL_VISITANT} REBI Balonmano Cuenca' },
  { id: 'j24m5', category: 'Resultat final', name: 'J24 · HORNEO – Recoletas', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nHORNEO BM. Alicante {GOL_LOCAL} – {GOL_VISITANT} Recoletas Salud At. Valladolid' },
  { id: 'j24m6', category: 'Resultat final', name: 'J24 · Morrazo – Ángel Ximénez', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFrigoríficos del Morrazo {GOL_LOCAL} – {GOL_VISITANT} Cajasol Ángel Ximénez P. Genil' },
  { id: 'j24m7', category: 'Resultat final', name: 'J24 · BM. Nava – Tubos Aranda', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nViveros Herol BM. Nava {GOL_LOCAL} – {GOL_VISITANT} Tubos Aranda Villa de Aranda' },
  { id: 'j24m8', category: 'Resultat final', name: 'J24 · Cajasol Sevilla – Barça', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Sevilla BM. Proin {GOL_LOCAL} – {GOL_VISITANT} Barça' },
  { id: 'j25m1', category: 'Resultat final', name: 'J25 · Barça – IRUDEK', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBarça {GOL_LOCAL} – {GOL_VISITANT} IRUDEK Bidasoa Irun' },
  { id: 'j25m2', category: 'Resultat final', name: 'J25 · Bathco – BM. Caserío', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBathco BM. Torrelavega {GOL_LOCAL} – {GOL_VISITANT} BM. Caserío Ciudad Real' },
  { id: 'j25m3', category: 'Resultat final', name: 'J25 · Recoletas – Fraikin', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nRecoletas Salud At. Valladolid {GOL_LOCAL} – {GOL_VISITANT} Fraikin BM. Granollers' },
  { id: 'j25m4', category: 'Resultat final', name: 'J25 · Ademar – Dicorpebal', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nABANCA Ademar León {GOL_LOCAL} – {GOL_VISITANT} Dicorpebal Logroño La Rioja' },
  { id: 'j25m5', category: 'Resultat final', name: 'J25 · Tubos Aranda – HORNEO', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nTubos Aranda Villa de Aranda {GOL_LOCAL} – {GOL_VISITANT} HORNEO BM. Alicante' },
  { id: 'j25m6', category: 'Resultat final', name: 'J25 · REBI – Fertiberia', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nREBI Balonmano Cuenca {GOL_LOCAL} – {GOL_VISITANT} Fertiberia Puerto Sagunto' },
  { id: 'j25m7', category: 'Resultat final', name: 'J25 · Ángel Ximénez – BM. Nava', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Ángel Ximénez P. Genil {GOL_LOCAL} – {GOL_VISITANT} Viveros Herol BM. Nava' },
  { id: 'j25m8', category: 'Resultat final', name: 'J25 · Cajasol Sevilla – Morrazo', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Sevilla BM. Proin {GOL_LOCAL} – {GOL_VISITANT} Frigoríficos del Morrazo' },
  { id: 'j26m1', category: 'Resultat final', name: 'J26 · Dicorpebal – Recoletas', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nDicorpebal Logroño La Rioja {GOL_LOCAL} – {GOL_VISITANT} Recoletas Salud At. Valladolid' },
  { id: 'j26m2', category: 'Resultat final', name: 'J26 · Fraikin – Ademar', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFraikin BM. Granollers {GOL_LOCAL} – {GOL_VISITANT} ABANCA Ademar León' },
  { id: 'j26m3', category: 'Resultat final', name: 'J26 · IRUDEK – Bathco', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nIRUDEK Bidasoa Irun {GOL_LOCAL} – {GOL_VISITANT} Bathco BM. Torrelavega' },
  { id: 'j26m4', category: 'Resultat final', name: 'J26 · BM. Caserío – Morrazo', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBM. Caserío Ciudad Real {GOL_LOCAL} – {GOL_VISITANT} Frigoríficos del Morrazo' },
  { id: 'j26m5', category: 'Resultat final', name: 'J26 · HORNEO – Cajasol Sevilla', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nHORNEO BM. Alicante {GOL_LOCAL} – {GOL_VISITANT} Cajasol Sevilla BM. Proin' },
  { id: 'j26m6', category: 'Resultat final', name: 'J26 · Tubos Aranda – REBI', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nTubos Aranda Villa de Aranda {GOL_LOCAL} – {GOL_VISITANT} REBI Balonmano Cuenca' },
  { id: 'j26m7', category: 'Resultat final', name: 'J26 · BM. Nava – Barça', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nViveros Herol BM. Nava {GOL_LOCAL} – {GOL_VISITANT} Barça' },
  { id: 'j26m8', category: 'Resultat final', name: 'J26 · Fertiberia – Ángel Ximénez', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFertiberia Puerto Sagunto {GOL_LOCAL} – {GOL_VISITANT} Cajasol Ángel Ximénez P. Genil' },
  { id: 'j27m1', category: 'Resultat final', name: 'J27 · IRUDEK – Dicorpebal', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nIRUDEK Bidasoa Irun {GOL_LOCAL} – {GOL_VISITANT} Dicorpebal Logroño La Rioja' },
  { id: 'j27m2', category: 'Resultat final', name: 'J27 · Recoletas – Barça', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nRecoletas Salud At. Valladolid {GOL_LOCAL} – {GOL_VISITANT} Barça' },
  { id: 'j27m3', category: 'Resultat final', name: 'J27 · REBI – HORNEO', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nREBI Balonmano Cuenca {GOL_LOCAL} – {GOL_VISITANT} HORNEO BM. Alicante' },
  { id: 'j27m4', category: 'Resultat final', name: 'J27 · Morrazo – Tubos Aranda', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFrigoríficos del Morrazo {GOL_LOCAL} – {GOL_VISITANT} Tubos Aranda Villa de Aranda' },
  { id: 'j27m5', category: 'Resultat final', name: 'J27 · Ángel Ximénez – Ademar', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Ángel Ximénez P. Genil {GOL_LOCAL} – {GOL_VISITANT} ABANCA Ademar León' },
  { id: 'j27m6', category: 'Resultat final', name: 'J27 · BM. Nava – Fraikin', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nViveros Herol BM. Nava {GOL_LOCAL} – {GOL_VISITANT} Fraikin BM. Granollers' },
  { id: 'j27m7', category: 'Resultat final', name: 'J27 · Cajasol Sevilla – BM. Caserío', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Sevilla BM. Proin {GOL_LOCAL} – {GOL_VISITANT} BM. Caserío Ciudad Real' },
  { id: 'j27m8', category: 'Resultat final', name: 'J27 · Fertiberia – Bathco', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFertiberia Puerto Sagunto {GOL_LOCAL} – {GOL_VISITANT} Bathco BM. Torrelavega' },
  { id: 'j28m1', category: 'Resultat final', name: 'J28 · Barça – Fertiberia', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBarça {GOL_LOCAL} – {GOL_VISITANT} Fertiberia Puerto Sagunto' },
  { id: 'j28m2', category: 'Resultat final', name: 'J28 · Fraikin – IRUDEK', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFraikin BM. Granollers {GOL_LOCAL} – {GOL_VISITANT} IRUDEK Bidasoa Irun' },
  { id: 'j28m3', category: 'Resultat final', name: 'J28 · Bathco – Dicorpebal', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBathco BM. Torrelavega {GOL_LOCAL} – {GOL_VISITANT} Dicorpebal Logroño La Rioja' },
  { id: 'j28m4', category: 'Resultat final', name: 'J28 · Ademar – Recoletas', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nABANCA Ademar León {GOL_LOCAL} – {GOL_VISITANT} Recoletas Salud At. Valladolid' },
  { id: 'j28m5', category: 'Resultat final', name: 'J28 · BM. Caserío – BM. Nava', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBM. Caserío Ciudad Real {GOL_LOCAL} – {GOL_VISITANT} Viveros Herol BM. Nava' },
  { id: 'j28m6', category: 'Resultat final', name: 'J28 · HORNEO – Ángel Ximénez', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nHORNEO BM. Alicante {GOL_LOCAL} – {GOL_VISITANT} Cajasol Ángel Ximénez P. Genil' },
  { id: 'j28m7', category: 'Resultat final', name: 'J28 · Tubos Aranda – Cajasol Sevilla', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nTubos Aranda Villa de Aranda {GOL_LOCAL} – {GOL_VISITANT} Cajasol Sevilla BM. Proin' },
  { id: 'j28m8', category: 'Resultat final', name: 'J28 · REBI – Morrazo', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nREBI Balonmano Cuenca {GOL_LOCAL} – {GOL_VISITANT} Frigoríficos del Morrazo' },
  { id: 'j29m1', category: 'Resultat final', name: 'J29 · Dicorpebal – Tubos Aranda', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nDicorpebal Logroño La Rioja {GOL_LOCAL} – {GOL_VISITANT} Tubos Aranda Villa de Aranda' },
  { id: 'j29m2', category: 'Resultat final', name: 'J29 · IRUDEK – REBI', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nIRUDEK Bidasoa Irun {GOL_LOCAL} – {GOL_VISITANT} REBI Balonmano Cuenca' },
  { id: 'j29m3', category: 'Resultat final', name: 'J29 · Bathco – Fraikin', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBathco BM. Torrelavega {GOL_LOCAL} – {GOL_VISITANT} Fraikin BM. Granollers' },
  { id: 'j29m4', category: 'Resultat final', name: 'J29 · Recoletas – Cajasol Sevilla', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nRecoletas Salud At. Valladolid {GOL_LOCAL} – {GOL_VISITANT} Cajasol Sevilla BM. Proin' },
  { id: 'j29m5', category: 'Resultat final', name: 'J29 · Ademar – Barça', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nABANCA Ademar León {GOL_LOCAL} – {GOL_VISITANT} Barça' },
  { id: 'j29m6', category: 'Resultat final', name: 'J29 · BM. Caserío – Ángel Ximénez', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBM. Caserío Ciudad Real {GOL_LOCAL} – {GOL_VISITANT} Cajasol Ángel Ximénez P. Genil' },
  { id: 'j29m7', category: 'Resultat final', name: 'J29 · HORNEO – BM. Nava', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nHORNEO BM. Alicante {GOL_LOCAL} – {GOL_VISITANT} Viveros Herol BM. Nava' },
  { id: 'j29m8', category: 'Resultat final', name: 'J29 · Morrazo – Fertiberia', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFrigoríficos del Morrazo {GOL_LOCAL} – {GOL_VISITANT} Fertiberia Puerto Sagunto' },
  { id: 'j30m1', category: 'Resultat final', name: 'J30 · Barça – Bathco', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nBarça {GOL_LOCAL} – {GOL_VISITANT} Bathco BM. Torrelavega' },
  { id: 'j30m2', category: 'Resultat final', name: 'J30 · Dicorpebal – HORNEO', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nDicorpebal Logroño La Rioja {GOL_LOCAL} – {GOL_VISITANT} HORNEO BM. Alicante' },
  { id: 'j30m3', category: 'Resultat final', name: 'J30 · Fraikin – Tubos Aranda', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFraikin BM. Granollers {GOL_LOCAL} – {GOL_VISITANT} Tubos Aranda Villa de Aranda' },
  { id: 'j30m4', category: 'Resultat final', name: 'J30 · Recoletas – IRUDEK', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nRecoletas Salud At. Valladolid {GOL_LOCAL} – {GOL_VISITANT} IRUDEK Bidasoa Irun' },
  { id: 'j30m5', category: 'Resultat final', name: 'J30 · Ángel Ximénez – REBI', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Ángel Ximénez P. Genil {GOL_LOCAL} – {GOL_VISITANT} REBI Balonmano Cuenca' },
  { id: 'j30m6', category: 'Resultat final', name: 'J30 · BM. Nava – Morrazo', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nViveros Herol BM. Nava {GOL_LOCAL} – {GOL_VISITANT} Frigoríficos del Morrazo' },
  { id: 'j30m7', category: 'Resultat final', name: 'J30 · Cajasol Sevilla – Ademar', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nCajasol Sevilla BM. Proin {GOL_LOCAL} – {GOL_VISITANT} ABANCA Ademar León' },
  { id: 'j30m8', category: 'Resultat final', name: 'J30 · Fertiberia – BM. Caserío', platform: 'instagram', variables: ['GOL_LOCAL','GOL_VISITANT'], template: '⏱️ ¡𝑭𝑰𝑵𝑨𝑳 𝑫𝑬𝑳 𝑷𝑨𝑹𝑻𝑰𝑫𝑶!\n\nFertiberia Puerto Sagunto {GOL_LOCAL} – {GOL_VISITANT} BM. Caserío Ciudad Real' },

  // FANTASY
  { id: 'fan1', category: 'Fantasy ASOBAL', name: 'Ya tiene su 7 ideal (IG)', platform: 'instagram', variables: ['JUGADOR'],
    template: '¡@{JUGADOR} ya tiene su 7️⃣ ideal en ASOBAL Fantasy!\n\n👉🏼 Ahora te toca a ti. Haz tu equipo en la web de ASOBAL.' },
  { id: 'fan2', category: 'Fantasy ASOBAL', name: 'Ya tiene su 7 ideal (TW)', platform: 'twitter', variables: ['JUGADOR'],
    template: '¡@{JUGADOR} ya tiene su 7️⃣ ideal en ASOBAL Fantasy!\n\n👉🏼 Ahora te toca a ti. Haz tu equipo en:  https://fantasy.asobal.es' },

  // ASOBAL TV
  { id: 'tv1', category: 'ASOBAL TV', name: 'Saben lo que hacen', platform: 'instagram', variables: ['EQUIP'],
    template: 'En @{EQUIP} saben lo que hacen🫣\n\n👉 Todos los partidos en https://asobal.tv' },

  // HORARIOS
  { id: 'hor1', category: 'Horaris', name: 'Horarios confirmados v1', platform: 'instagram', variables: ['JORNADA'],
    template: '𝑯𝑶𝑹𝑨𝑹𝑰𝑶𝑺 | JORNADA {JORNADA}\n\n📲 ¡Ya tienes todos los horarios! Vive todos los partidos en ASOBAL.TV y en la app de StreamWay+, disponible en iOS y Android.' },
  { id: 'hor2', category: 'Horaris', name: 'Horarios confirmados v2', platform: 'instagram', variables: ['JORNADA'],
    template: '𝑯𝑶𝑹𝑨𝑹𝑰𝑶𝑺 𝑪𝑶𝑵𝑭𝑰𝑹𝑴𝑨𝑫𝑶𝑺 | JORNADA {JORNADA}\n\n📲 ¡Disfruta de todos los partidos en ASOBAL.TV y en StreamWay+, disponible en iOS y Android!' },
  { id: 'hor3', category: 'Horaris', name: 'No te pierdas ni uno', platform: 'instagram', variables: ['JORNADA'],
    template: '𝑵𝑶 𝑻𝑬 𝑷𝑰𝑬𝑹𝑫𝑨𝑺 𝑵𝑰 𝑼𝑵 𝑺𝑶𝑳𝑶 𝑷𝑨𝑹𝑻𝑰𝑫𝑶 | JORNADA {JORNADA}\n\n📲 ¡Ya tienes todos los horarios! Vive todos los partidos en ASOBAL.TV y en la app de StreamWay+, disponible en iOS y Android.' },
  { id: 'hor4', category: 'Horaris', name: 'Horarios v4', platform: 'instagram', variables: ['JORNADA'],
    template: '𝑯𝑶𝑹𝑨𝑹𝑰𝑶𝑺 | JORNADA {JORNADA}\n\n📲 ¡Disfruta de todos los partidos en ASOBAL.TV y en la app de StreamWay+, disponible en iOS y Android!' },

  // MVP
  { id: 'mvp1', category: 'MVP', name: 'Del 1 al 10', platform: 'instagram', variables: ['JORNADA','MVP'],
    template: '🌟 𝑴𝑽𝑷 @nexusenergia | JORNADA {JORNADA}\n\n¡{MVP} se lleva el MVP! 🔥\n\n👇🏻 Del 1 al 10, ¿qué nota le das?' },
  { id: 'mvp2', category: 'MVP', name: '60 minutos', platform: 'instagram', variables: ['JORNADA','MVP'],
    template: '🌟 𝑴𝑽𝑷 @nexusenergia | JORNADA {JORNADA}\n\n60 minutos. Una actuación. Un MVP.\n\n¡{MVP}! 🔥\n\n¿Qué te pareció su partido?' },
  { id: 'mvp3', category: 'MVP', name: 'MVP de la jornada', platform: 'instagram', variables: ['JORNADA','MVP'],
    template: '🌟 𝑴𝑽𝑷 @nexusenergia | JORNADA {JORNADA}\n¡{MVP}, MVP de la jornada! 🔥' },

  // RESULTADOS JORNADA
  { id: 'rj1', category: 'Resultats jornada', name: 'Así vivimos v1', platform: 'instagram', variables: [],
    template: '¡Así vivimos una nueva jornada de la Liga NEXUS ENERGÍA ASOBAL! 🤾‍♂️⚡' },
  { id: 'rj2', category: 'Resultats jornada', name: 'Goles y emoción', platform: 'instagram', variables: [],
    template: '¡La jornada nos deja goles, emoción y mucho balonmano!' },
  { id: 'rj3', category: 'Resultats jornada', name: 'Sigue avanzando', platform: 'instagram', variables: ['JORNADA'],
    template: 'La Liga NEXUS ENERGÍA ASOBAL sigue avanzando. ¡Así queda la 𝑱𝑶𝑹𝑵𝑨𝑫𝑨 {JORNADA}!' },

  // CLASIFICACIÓN
  { id: 'cla1', category: 'Classificació', name: 'Te leemos v1', platform: 'instagram', variables: ['JORNADA'],
    template: '⭐️  ¡La CLASIFICACIÓN de la Liga NEXUS ENERGÍA ASOBAL tras la jornada {JORNADA}!\n\n👀 ¡Te leemos en comentarios! 👇🏻' },
  { id: 'cla2', category: 'Classificació', name: 'Sorpresa v2', platform: 'instagram', variables: ['JORNADA'],
    template: '👀 ¡La CLASIFICACIÓN de la Liga NEXUS ENERGÍA ASOBAL tras la jornada {JORNADA}!\n\n🔥 ¿Qué posición te sorprende más?' },
  { id: 'cla3', category: 'Classificació', name: 'Sorpresa v3', platform: 'instagram', variables: ['JORNADA'],
    template: '⚡️ ¡La CLASIFICACIÓN de la Liga NEXUS ENERGÍA ASOBAL tras la jornada {JORNADA}!\n\n👀 ¿Hay alguna sorpresa en la clasificación?' },

  // 7 IDEAL
  { id: '7i1', category: '7 Ideal', name: 'Qué te parece', platform: 'instagram', variables: ['JORNADA'],
    template: '⭐️ 𝑺𝑰𝑬𝑻𝑬 𝑰𝑫𝑬𝑨𝑳 | JORNADA {JORNADA}\n👀 ¿Qué te parece? Te leemos en comentarios' },
  { id: '7i2', category: '7 Ideal', name: 'Quién debería estar', platform: 'instagram', variables: ['JORNADA'],
    template: '⭐️ 𝑺𝑰𝑬𝑻𝑬 𝑰𝑫𝑬𝑨𝑳 | JORNADA {JORNADA}\n🔥 ¿Quién debería estar sí o sí?' },
  { id: '7i3', category: '7 Ideal', name: 'Qué cambio harías', platform: 'instagram', variables: ['JORNADA'],
    template: '⭐️ 𝑺𝑰𝑬𝑻𝑬 𝑰𝑫𝑬𝑨𝑳 | JORNADA {JORNADA}\n💬 ¿Qué cambio harías?' },

  // TOP 5 GOLES
  { id: 'tg1', category: 'Top 5 Gols', name: 'Con cuál te quedas (IG)', platform: 'instagram', variables: ['JORNADA'],
    template: '𝑻𝑶𝑷 𝟓 𝑮𝑶𝑳𝑬𝑺 @decathlon_espana | JORNADA {JORNADA}\n\n👀 ¿Con cuál te quedas?' },
  { id: 'tg2', category: 'Top 5 Gols', name: 'Con cuál te quedas (TW)', platform: 'twitter', variables: ['JORNADA'],
    template: '𝑻𝑶𝑷 𝟓 𝑮𝑶𝑳𝑬𝑺 @decathlonespana | JORNADA {JORNADA}\n\n👀 ¿Con cuál te quedas?' },
  { id: 'tg3', category: 'Top 5 Gols', name: 'Favorito (IG)', platform: 'instagram', variables: ['JORNADA'],
    template: '𝑻𝑶𝑷 𝟓 𝑮𝑶𝑳𝑬𝑺 @decathlon_espana | JORNADA {JORNADA}\n\n👀 ¿Cuál es tu favorito?' },
  { id: 'tg4', category: 'Top 5 Gols', name: 'Favorito (TW)', platform: 'twitter', variables: ['JORNADA'],
    template: '𝑻𝑶𝑷 𝟓 𝑮𝑶𝑳𝑬𝑺 @decathlonespana | JORNADA {JORNADA}\n\n👀 ¿Cuál es tu favorito?' },
  { id: 'tg5', category: 'Top 5 Gols', name: 'Elige 1 2 3 (IG)', platform: 'instagram', variables: ['JORNADA'],
    template: '𝑻𝑶𝑷 𝟓 𝑮𝑶𝑳𝑬𝑺 @decathlon_espana | JORNADA {JORNADA}\n\n🗳️¿Cuál eliges: 1, 2, 3, 4 o 5?' },
  { id: 'tg6', category: 'Top 5 Gols', name: 'Elige 1 2 3 (TW)', platform: 'twitter', variables: ['JORNADA'],
    template: '𝑻𝑶𝑷 𝟓 𝑮𝑶𝑳𝑬𝑺 @decathlonespana | JORNADA {JORNADA}\n\n🗳️¿Cuál eliges: 1, 2, 3, 4 o 5?' },

  // TOP 5 PARADES
  { id: 'tp1', category: 'Top 5 Parades', name: 'Con cuál te quedas', platform: 'instagram', variables: ['JORNADA'],
    template: '🧤 𝑻𝑶𝑷 𝟓 𝑷𝑨𝑹𝑨𝑫𝑨𝑺 | JORNADA {JORNADA}\n\n👀 ¿Con cuál te quedas?' },
  { id: 'tp2', category: 'Top 5 Parades', name: 'Elige tu parada', platform: 'instagram', variables: ['JORNADA'],
    template: '🧤 𝑻𝑶𝑷 𝟓 𝑷𝑨𝑹𝑨𝑫𝑨𝑺 | JORNADA {JORNADA}\n\n🧱 ¿1, 2, 3, 4 o 5?\n\n👇🏻 ¡Elige tu parada favorita!' },
  { id: 'tp3', category: 'Top 5 Parades', name: 'Defiende a tu portero', platform: 'instagram', variables: ['JORNADA'],
    template: '🧤 𝑻𝑶𝑷 𝟓 𝑷𝑨𝑹𝑨𝑫𝑨𝑺 | JORNADA {JORNADA}\n\n🧱 ¿Qué afición se lleva la mejor parada de la jornada?\n\n👇🏻 ¡Defiende a tu portero!' },
  { id: 'tp4', category: 'Top 5 Parades', name: 'TOP 1', platform: 'instagram', variables: ['JORNADA'],
    template: '🧤 𝑻𝑶𝑷 𝟓 𝑷𝑨𝑹𝑨𝑫𝑨𝑺 | JORNADA {JORNADA}\n\n🔝 ¿Cuál es tu TOP 1?' },

  // IMAGEN JORNADA
  { id: 'ij1', category: 'Imatge jornada', name: 'La foto de la jornada v1', platform: 'instagram', variables: ['JORNADA','FOTOGRAF'],
    template: '📸 ¡𝑳𝑨 𝑭𝑶𝑻𝑶 𝑫𝑬 𝑳𝑨 𝑱𝑶𝑹𝑵𝑨𝑫𝑨!\nUna imagen. Toda una historia.\nJornada {JORNADA} by @artipubli' },
  { id: 'ij2', category: 'Imatge jornada', name: 'Un momento que lo dice todo', platform: 'instagram', variables: ['JORNADA','FOTOGRAF'],
    template: '👀 ¡𝑼𝑵 𝑴𝑶𝑴𝑬𝑵𝑻𝑶 𝑸𝑼𝑬 𝑳𝑶 𝑫𝑰𝑪𝑬 𝑻𝑶𝑫𝑶!\nLa foto de la Jornada {JORNADA} by @artipubli\n📸 {FOTOGRAF}' },
  { id: 'ij3', category: 'Imatge jornada', name: 'Un instante v3', platform: 'instagram', variables: ['JORNADA','FOTOGRAF'],
    template: '𝑼𝑵 𝑰𝑵𝑺𝑻𝑨𝑵𝑻𝑬. 𝑼𝑵𝑨 𝑯𝑰𝑺𝑻𝑶𝑹𝑰𝑨.\nLa foto de la jornada by @artipubli\n📸 {FOTOGRAF}' },
  { id: 'ij4', category: 'Imatge jornada', name: 'La foto v4', platform: 'instagram', variables: ['JORNADA','FOTOGRAF'],
    template: '¡𝑳𝑨 𝑭𝑶𝑻𝑶 𝑫𝑬 𝑳𝑨 𝑱𝑶𝑹𝑵𝑨𝑫𝑨 by @artipubli!\n\n📸 Foto de {FOTOGRAF}' },

  // MVP DEL MES
  { id: 'mm1', category: 'MVP del mes', name: 'Quién merece v1', platform: 'instagram', variables: ['MES'],
    template: '🏆 𝑴𝑽𝑷 @nexusenergia 𝑫𝑬𝑳 𝑴𝑬𝑺 | {MES}\n\n👀 ¿Quién merece llevarse el MVP?\n\n📲 Vota por tu favorito a través de nuestro canal de WhatsApp.' },
  { id: 'mm2', category: 'MVP del mes', name: 'Quién merece v2', platform: 'instagram', variables: ['MES'],
    template: '🏆 𝑴𝑽𝑷 @nexusenergia 𝑫𝑬𝑳 𝑴𝑬𝑺 | {MES}\n\n👀 ¿Quién merece ser el MVP de {MES}?\n📲 Entra en nuestro canal de WhatsApp y vota por tu favorito.' },
  { id: 'mm3', category: 'MVP del mes', name: 'Quién merece v3', platform: 'instagram', variables: ['MES'],
    template: '🏆 𝑴𝑽𝑷 @nexusenergia 𝑫𝑬𝑳 𝑴𝑬𝑺 | {MES}\n\n👀 ¿Quién merece llevarse el MVP?\n\n📲 Vota por tu favorito a través de nuestro canal de WhatsApp.' },
]

const CATEGORIES = Array.from(new Set(TEMPLATES.map(t => t.category)))

const VARIABLE_LABELS: Record<string, string> = {
  LOCAL: 'Equip local (sense @)',
  VISITANT: 'Equip visitant (sense @)',
  GOL_LOCAL: 'Gols local',
  GOL_VISITANT: 'Gols visitant',
  JORNADA: 'Número de jornada',
  MVP: 'Nom del MVP',
  MES: 'Mes (p.ex. OCTUBRE)',
  EQUIP: 'Handle equip (sense @)',
  JUGADOR: 'Handle jugador (sense @)',
  FOTOGRAF: 'Nom fotògraf',
}

const PLATFORM_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  instagram: { bg: 'rgba(214,58,145,0.10)', color: '#D63A91', label: 'Instagram' },
  twitter:   { bg: 'rgba(29,161,242,0.10)', color: '#1DA1F2', label: 'Twitter/X' },
  ambdues:   { bg: 'rgba(107,114,128,0.10)', color: '#6B7280', label: 'Ambdues' },
}

function generateCopy(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, val] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, val || `{${key}}`)
  }
  return result
}

interface AIVariant { text: string; note: string }

// Tomorrow 10am as default schedule time
function defaultScheduleDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  return d.toISOString().slice(0, 16) // "YYYY-MM-DDTHH:MM"
}

export function AsobalCopys() {
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'instagram' | 'twitter'>('all')
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)
  const [vars, setVars] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

  // AI generation
  const [aiLoading, setAiLoading] = useState(false)
  const [aiVariants, setAiVariants] = useState<AIVariant[]>([])
  const [aiContext, setAiContext] = useState('')
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Metricool scheduling
  const [scheduleDate, setScheduleDate] = useState(defaultScheduleDate())
  const [scheduleNetworks, setScheduleNetworks] = useState<string[]>(['instagram'])
  const [scheduling, setScheduling] = useState(false)
  const [scheduleResult, setScheduleResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)

  const filtered = useMemo(() => TEMPLATES.filter(t => {
    if (selectedCat && t.category !== selectedCat) return false
    if (selectedPlatform !== 'all' && t.platform !== selectedPlatform && t.platform !== 'ambdues') return false
    return true
  }), [selectedCat, selectedPlatform])

  const preview = activeTemplate ? generateCopy(activeTemplate.template, vars) : ''
  // The text that will be copied/scheduled (prefer selected AI variant over template preview)
  const activeText = selectedVariant ?? preview

  const handleSelectTemplate = (t: Template) => {
    setActiveTemplate(t)
    setVars({})
    setCopied(false)
    setAiVariants([])
    setSelectedVariant(null)
    setScheduleResult(null)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerateAI = async () => {
    if (!activeTemplate) return
    setAiLoading(true)
    setAiVariants([])
    setSelectedVariant(null)
    try {
      const jornada = vars['JORNADA'] ?? ''
      const context = [
        aiContext,
        vars['LOCAL'] ? `Local: ${vars['LOCAL']}` : '',
        vars['VISITANT'] ? `Visitant: ${vars['VISITANT']}` : '',
        vars['MVP'] ? `MVP: ${vars['MVP']}` : '',
      ].filter(Boolean).join('. ')

      const res = await fetch('/api/asobal/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeTemplate.category,
          context,
          platform: activeTemplate.platform,
          jornada,
        }),
      })
      const data = await res.json()
      if (data.variants) setAiVariants(data.variants)
    } catch {
      setAiVariants([{ text: 'Error generant el copy. Intenta-ho de nou.', note: 'Error' }])
    }
    setAiLoading(false)
  }

  const handleSchedule = async () => {
    if (!activeText.trim()) return
    setScheduling(true)
    setScheduleResult(null)
    try {
      const res = await fetch('/api/asobal/schedule-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: activeText,
          scheduledAt: new Date(scheduleDate).toISOString(),
          networks: scheduleNetworks,
        }),
      })
      const data = await res.json()
      if (data.dev_mode) {
        setScheduleResult({ ok: true, message: 'Mode dev: afegeix METRICOOL_USER_TOKEN a .env.local per publicar de veritat.' })
      } else if (data.ok) {
        setScheduleResult({ ok: true, message: `Publicat a Metricool! Xarxes: ${scheduleNetworks.join(', ')}` })
      } else {
        setScheduleResult({ ok: false, message: 'Error al Metricool. Comprova el token.' })
      }
    } catch {
      setScheduleResult({ ok: false, message: 'Error de connexió.' })
    }
    setScheduling(false)
  }

  const toggleNetwork = (net: string) => {
    setScheduleNetworks(prev => prev.includes(net) ? prev.filter(n => n !== net) : [...prev, net])
  }

  const pl = activeTemplate ? PLATFORM_COLORS[activeTemplate.platform] : null

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>
      <style>{`
        .asb-copys-sidebar { width:260px; flex-shrink:0; border-right:1px solid rgba(0,0,0,0.08); overflow-y:auto; background:#FAFAFA; }
        .asb-copys-toggle { display:none; }
        @media(max-width:700px) {
          .asb-copys-sidebar { position:absolute; top:0; left:0; bottom:0; z-index:20; width:82vw; max-width:290px; box-shadow:4px 0 18px rgba(0,0,0,0.18); transform:translateX(-100%); transition:transform .22s ease; }
          .asb-copys-sidebar.open { transform:translateX(0); }
          .asb-copys-toggle { display:flex; align-items:center; gap:6px; padding:9px 14px; border:none; border-bottom:1px solid rgba(0,0,0,0.08); background:#fff; font-size:13px; font-weight:600; color:#374151; cursor:pointer; font-family:inherit; width:100%; justify-content:flex-start; flex-shrink:0; }
          .asb-copys-overlay { display:none; position:absolute; inset:0; background:rgba(0,0,0,0.28); z-index:19; }
          .asb-copys-overlay.open { display:block; }
          .asb-copys-main { padding:0 !important; }
          .asb-copys-inner { padding:12px !important; }
        }
      `}</style>

      {/* Overlay (mobile only) */}
      <div className={`asb-copys-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Left: template list */}
      <div className={`asb-copys-sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* Filters */}
        <div style={{ padding: '10px 10px 6px', borderBottom: '1px solid rgba(0,0,0,0.07)', position: 'sticky', top: 0, background: '#FAFAFA', zIndex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9AA5B4', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>Plataforma</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(['all', 'instagram', 'twitter'] as const).map(p => (
              <button key={p} onClick={() => setSelectedPlatform(p)}
                style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: selectedPlatform === p ? '#1b3bda' : 'rgba(0,0,0,0.06)',
                  color: selectedPlatform === p ? '#fff' : '#555' }}>
                {p === 'all' ? 'Totes' : p === 'instagram' ? 'IG' : 'TW'}
              </button>
            ))}
          </div>
        </div>

        {/* Category list */}
        <div style={{ padding: '8px 0' }}>
          <button onClick={() => { setSelectedCat(null); setSidebarOpen(false) }}
            style={{ width: '100%', textAlign: 'left', padding: '7px 14px', background: selectedCat === null ? 'rgba(27,59,218,0.08)' : 'none',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: selectedCat === null ? 700 : 500,
              color: selectedCat === null ? '#1b3bda' : '#374151', borderLeft: selectedCat === null ? '2px solid #1b3bda' : '2px solid transparent' }}>
            Totes les categories
            <span style={{ float: 'right', fontSize: 11, color: '#9AA5B4', fontWeight: 400 }}>{filtered.length}</span>
          </button>
          {CATEGORIES.map(cat => {
            const count = TEMPLATES.filter(t => t.category === cat && (selectedPlatform === 'all' || t.platform === selectedPlatform || t.platform === 'ambdues')).length
            return (
              <button key={cat} onClick={() => { setSelectedCat(cat === selectedCat ? null : cat); setSidebarOpen(false) }}
                style={{ width: '100%', textAlign: 'left', padding: '7px 14px', background: selectedCat === cat ? 'rgba(27,59,218,0.08)' : 'none',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: selectedCat === cat ? 700 : 500,
                  color: selectedCat === cat ? '#1b3bda' : '#374151', borderLeft: selectedCat === cat ? '2px solid #1b3bda' : '2px solid transparent',
                  transition: 'background .12s' }}>
                {cat}
                <span style={{ float: 'right', fontSize: 11, color: '#9AA5B4', fontWeight: 400 }}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Templates within selected category */}
        {selectedCat && (
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', padding: '6px 0' }}>
            {filtered.map(t => {
              const plStyle = PLATFORM_COLORS[t.platform]
              return (
                <button key={t.id} onClick={() => { handleSelectTemplate(t); setSidebarOpen(false) }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 14px', background: activeTemplate?.id === t.id ? 'rgba(27,59,218,0.06)' : 'none',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .1s',
                    borderLeft: activeTemplate?.id === t.id ? '2px solid #1b3bda' : '2px solid transparent' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{t.name}</div>
                  <span style={{ fontSize: 10.5, fontWeight: 600, background: plStyle.bg, color: plStyle.color, borderRadius: 4, padding: '1px 6px' }}>
                    {plStyle.label}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Right: toggle + content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }} className="asb-copys-main">
        {/* Mobile toggle — only visible on small screens via CSS */}
        <button className="asb-copys-toggle" onClick={() => setSidebarOpen(o => !o)}>
          ☰ {selectedCat ?? 'Categories'}
        </button>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }} className="asb-copys-inner">
        {!selectedCat && !activeTemplate ? (
          /* Grid of all categories */
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Copy Library · {TEMPLATES.length} templates</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {CATEGORIES.map(cat => {
                const catTemplates = TEMPLATES.filter(t => t.category === cat)
                const igCount = catTemplates.filter(t => t.platform === 'instagram').length
                const twCount = catTemplates.filter(t => t.platform === 'twitter').length
                return (
                  <button key={cat} onClick={() => setSelectedCat(cat)}
                    style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10, padding: '14px 16px',
                      textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{cat}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {igCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, background: PLATFORM_COLORS.instagram.bg, color: PLATFORM_COLORS.instagram.color, borderRadius: 4, padding: '2px 6px' }}>IG ×{igCount}</span>}
                      {twCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, background: PLATFORM_COLORS.twitter.bg, color: PLATFORM_COLORS.twitter.color, borderRadius: 4, padding: '2px 6px' }}>TW ×{twCount}</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : activeTemplate ? (
          /* Generator */
          <div style={{ maxWidth: 560 }}>
            <button onClick={() => setActiveTemplate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9CA3AF', fontFamily: 'inherit', marginBottom: 12, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              ← Tornar
            </button>
            <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {/* Header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{activeTemplate.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{activeTemplate.category}</div>
                </div>
                {pl && <span style={{ fontSize: 11, fontWeight: 600, background: pl.bg, color: pl.color, borderRadius: 5, padding: '3px 8px', flexShrink: 0 }}>{pl.label}</span>}
              </div>

              {/* Variables */}
              {activeTemplate.variables.length > 0 && (
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F0' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Variables</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activeTemplate.variables.map(v => (
                      <div key={v}>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                          {VARIABLE_LABELS[v] ?? v}
                        </label>
                        <input
                          value={vars[v] ?? ''}
                          onChange={e => setVars(prev => ({ ...prev, [v]: e.target.value }))}
                          placeholder={`{${v}}`}
                          style={{ width: '100%', padding: '7px 10px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 7,
                            fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                            background: '#FAFAFA', color: '#111827' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Previsualització</div>
                <div style={{ background: '#F8F9FA', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#111827', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontFamily: 'inherit', minHeight: 60 }}>
                  {preview}
                </div>
              </div>

              {/* AI generation panel */}
              <div style={{ borderBottom: '1px solid #F0F0F0' }}>
                <button onClick={() => setShowAiPanel(v => !v)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', background: showAiPanel ? 'rgba(139,92,246,0.06)' : 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#7C3AED' }}>
                  <Sparkles size={14} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, flex: 1, textAlign: 'left' }}>Genera variant amb IA</span>
                  {showAiPanel ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {showAiPanel && (
                  <div style={{ padding: '0 16px 14px' }}>
                    <input value={aiContext} onChange={e => setAiContext(e.target.value)}
                      placeholder="Context extra (p.ex. 'empat dramàtic', 'remontada increïble'…)"
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 7, fontSize: 12.5, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
                    <button onClick={handleGenerateAI} disabled={aiLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, border: 'none', cursor: aiLoading ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', opacity: aiLoading ? 0.7 : 1 }}>
                      <Sparkles size={13} />
                      {aiLoading ? 'Generant…' : '3 variants IA'}
                    </button>
                    {/* AI variants */}
                    {aiVariants.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {aiVariants.map((v, i) => (
                          <button key={i} onClick={() => setSelectedVariant(selectedVariant === v.text ? null : v.text)}
                            style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: `2px solid ${selectedVariant === v.text ? '#7C3AED' : 'rgba(0,0,0,0.1)'}`, cursor: 'pointer', background: selectedVariant === v.text ? 'rgba(139,92,246,0.06)' : '#FAFAFA', fontFamily: 'inherit', transition: 'all .12s' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Variant {i + 1} · {v.note}</div>
                            <div style={{ fontSize: 12.5, color: '#111827', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{v.text}</div>
                            {selectedVariant === v.text && <div style={{ marginTop: 6, fontSize: 10.5, color: '#7C3AED', fontWeight: 700 }}>✓ Seleccionada</div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Schedule to Metricool */}
              <div style={{ borderBottom: '1px solid #F0F0F0' }}>
                <button onClick={() => setShowSchedule(v => !v)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', background: showSchedule ? 'rgba(5,150,105,0.06)' : 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#059669' }}>
                  <Calendar size={14} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, flex: 1, textAlign: 'left' }}>Programar a Metricool</span>
                  {showSchedule ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {showSchedule && (
                  <div style={{ padding: '0 16px 14px' }}>
                    <div style={{ fontSize: 10.5, color: '#6B7280', marginBottom: 6 }}>Data i hora</div>
                    <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                      style={{ padding: '7px 10px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 7, fontSize: 12.5, fontFamily: 'inherit', outline: 'none', marginBottom: 10, width: '100%', boxSizing: 'border-box' }} />
                    <div style={{ fontSize: 10.5, color: '#6B7280', marginBottom: 6 }}>Xarxes</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                      {['instagram', 'twitter', 'facebook', 'tiktok'].map(net => (
                        <button key={net} onClick={() => toggleNetwork(net)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: `2px solid ${scheduleNetworks.includes(net) ? '#059669' : 'rgba(0,0,0,0.12)'}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600, background: scheduleNetworks.includes(net) ? '#F0FDF4' : '#fff', color: scheduleNetworks.includes(net) ? '#059669' : '#6B7280' }}>
                          {net === 'twitter' ? 'X/Twitter' : net.charAt(0).toUpperCase() + net.slice(1)}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleSchedule} disabled={scheduling || !activeText.trim() || scheduleNetworks.length === 0}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: scheduling ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', opacity: (!activeText.trim() || scheduleNetworks.length === 0) ? 0.5 : 1 }}>
                      <Send size={13} />
                      {scheduling ? 'Programant…' : 'Programar ara'}
                    </button>
                    {scheduleResult && (
                      <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 7, background: scheduleResult.ok ? '#F0FDF4' : '#FEF2F2', color: scheduleResult.ok ? '#059669' : '#EF4444', fontSize: 12, fontWeight: 600 }}>
                        {scheduleResult.message}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Copy button */}
              <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                <button onClick={handleCopy}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    height: 40, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 13, fontWeight: 700,
                    background: copied ? '#059669' : 'linear-gradient(135deg,#1b3bda 0%,#131ea6 100%)',
                    color: '#fff', transition: 'background .2s' }}>
                  {copied ? <><Check size={15} /> Copy copiat!</> : <><Copy size={15} /> Copiar copy</>}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Template list for selected category (no template selected) */
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>{selectedCat}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(t => {
                const plStyle = PLATFORM_COLORS[t.platform]
                return (
                  <button key={t.id} onClick={() => handleSelectTemplate(t)}
                    style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10, padding: '12px 16px',
                      textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 6 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'pre-wrap', lineHeight: 1.5, overflow: 'hidden',
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any }}>
                        {t.template}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 600, background: plStyle.bg, color: plStyle.color, borderRadius: 4, padding: '2px 7px' }}>
                        {plStyle.label}
                      </span>
                      <span style={{ fontSize: 10, color: '#9CA3AF' }}>{t.variables.length} vars</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
