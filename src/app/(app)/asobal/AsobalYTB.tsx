'use client'

import { useState, useMemo } from 'react'
import { Search, X, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'

export interface YTBEntry {
  titulo: string
  descripcion: string
  keywords: string
}

export const DATA: YTBEntry[] = [
  {
    titulo: `TOP 5 GOLES`,
    descripcion: `¡Los 5 mejores goles de la jornada en la Liga ASOBAL! Disfruta de los lanzamientos, acciones y definiciones más espectaculares del balonmano español. ¿Cuál ha sido para ti el mejor gol de la jornada? ¡Déjanos tu opinión!`,
    keywords: `Liga ASOBAL, ASOBAL, balonmano, handball, mejores goles ASOBAL, top 5 goles, goles balonmano, mejores goles balonmano, goles Liga ASOBAL, jornada ASOBAL, highlights ASOBAL, balonmano español, goles espectaculares`,
  },
  {
    titulo: `TOP 5 PARADAS`,
    descripcion: `¡Las 5 mejores paradas de la jornada en la Liga ASOBAL! Los porteros protagonistas de las intervenciones más espectaculares del balonmano español. Reflejos, potencia y grandes atajadas para salvar a sus equipos. ¿Cuál ha sido la mejor parada?`,
    keywords: `Liga ASOBAL, ASOBAL, balonmano, handball, mejores paradas ASOBAL, top 5 paradas, paradas balonmano, mejores paradas balonmano, porteros ASOBAL, paradas espectaculares, jornada ASOBAL, highlights ASOBAL, balonmano español`,
  },
  {
    titulo: `DIBUJANDO CON [JUGADOR]`,
    descripcion: `¿Qué pasaría si [JUGADOR] se convirtiera en artista por un día? En este nuevo reto de ASOBAL, [JUGADOR] se pone a dibujar y demuestra que su talento no solo está en la pista. Descubre cuánto sabe de balonmano y qué tal se le da dibujar.`,
    keywords: `Liga ASOBAL, ASOBAL, balonmano, handball, jugadores ASOBAL, balonmano español, retos ASOBAL, entrevistas ASOBAL, contenido ASOBAL, jugadores de balonmano, Nexus Energía ASOBAL`,
  },
  {
    titulo: `Barça vs BM. Caserío Ciudad Real | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Barça vs BM. Caserío Ciudad Real, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Un nuevo capítulo de la Jornada 3 de la competición.`,
    keywords: `Barça, BM. Caserío Ciudad Real, Barça vs BM. Caserío Ciudad Real, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 3, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Dicorpebal Logroño La Rioja vs Fertiberia Puerto Sagunto | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Dicorpebal Logroño La Rioja vs Fertiberia Puerto Sagunto, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. El balonmano de la Jornada 4, resumido en sus mejores momentos.`,
    keywords: `Dicorpebal Logroño La Rioja, Fertiberia Puerto Sagunto, Dicorpebal Logroño La Rioja vs Fertiberia Puerto Sagunto, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 4, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fraikin BM. Granollers vs REBI Balonmano Cuenca | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Fraikin BM. Granollers vs REBI Balonmano Cuenca: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Consulta también todos los contenidos de la Jornada 4 de ASOBAL.`,
    keywords: `Fraikin BM. Granollers, REBI Balonmano Cuenca, Fraikin BM. Granollers vs REBI Balonmano Cuenca, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 4, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `IRUDEK Bidasoa Irun vs Cajasol Ángel Ximénez P. Genil | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de IRUDEK Bidasoa Irun vs Cajasol Ángel Ximénez P. Genil está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Un nuevo capítulo de la Jornada 4 de la competición.`,
    keywords: `IRUDEK Bidasoa Irun, Cajasol Ángel Ximénez P. Genil, IRUDEK Bidasoa Irun vs Cajasol Ángel Ximénez P. Genil, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 4, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `BM. Caserío Ciudad Real vs ABANCA Ademar León | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue BM. Caserío Ciudad Real vs ABANCA Ademar León en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Toda la emoción de la Jornada 4, en clave de balonmano.`,
    keywords: `BM. Caserío Ciudad Real, ABANCA Ademar León, BM. Caserío Ciudad Real vs ABANCA Ademar León, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 4, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Barça vs HORNEO BM. Alicante | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de Barça vs HORNEO BM. Alicante: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Revive así uno de los duelos de la Jornada 4 de ASOBAL.`,
    keywords: `Barça, HORNEO BM. Alicante, Barça vs HORNEO BM. Alicante, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 4, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Bathco BM. Torrelavega vs Tubos Aranda Villa de Aranda | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Bathco BM. Torrelavega vs Tubos Aranda Villa de Aranda en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. El balonmano de la Jornada 4, resumido en sus mejores momentos.`,
    keywords: `Bathco BM. Torrelavega, Tubos Aranda Villa de Aranda, Bathco BM. Torrelavega vs Tubos Aranda Villa de Aranda, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 4, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Frigoríficos del Morrazo vs Recoletas Salud At. Valladolid | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Frigoríficos del Morrazo vs Recoletas Salud At. Valladolid con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Consulta también todos los contenidos de la Jornada 4 de ASOBAL.`,
    keywords: `Frigoríficos del Morrazo, Recoletas Salud At. Valladolid, Frigoríficos del Morrazo vs Recoletas Salud At. Valladolid, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 4, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Viveros Herol BM. Nava vs Cajasol Sevilla BM. Proin | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Viveros Herol BM. Nava vs Cajasol Sevilla BM. Proin llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Un nuevo capítulo de la Jornada 4 de la competición.`,
    keywords: `Viveros Herol BM. Nava, Cajasol Sevilla BM. Proin, Viveros Herol BM. Nava vs Cajasol Sevilla BM. Proin, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 4, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Tubos Aranda Villa de Aranda vs Barça | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Tubos Aranda Villa de Aranda vs Barça, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Toda la emoción de la Jornada 5, en clave de balonmano.`,
    keywords: `Tubos Aranda Villa de Aranda, Barça, Tubos Aranda Villa de Aranda vs Barça, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 5, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Bathco BM. Torrelavega vs Frigoríficos del Morrazo | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Bathco BM. Torrelavega vs Frigoríficos del Morrazo: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Revive así uno de los duelos de la Jornada 5 de ASOBAL.`,
    keywords: `Bathco BM. Torrelavega, Frigoríficos del Morrazo, Bathco BM. Torrelavega vs Frigoríficos del Morrazo, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 5, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Recoletas Salud At. Valladolid vs Cajasol Ángel Ximénez P. Genil | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de Recoletas Salud At. Valladolid vs Cajasol Ángel Ximénez P. Genil está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. El balonmano de la Jornada 5, resumido en sus mejores momentos.`,
    keywords: `Recoletas Salud At. Valladolid, Cajasol Ángel Ximénez P. Genil, Recoletas Salud At. Valladolid vs Cajasol Ángel Ximénez P. Genil, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 5, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `ABANCA Ademar León vs Viveros Herol BM. Nava | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue ABANCA Ademar León vs Viveros Herol BM. Nava en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Consulta también todos los contenidos de la Jornada 5 de ASOBAL.`,
    keywords: `ABANCA Ademar León, Viveros Herol BM. Nava, ABANCA Ademar León vs Viveros Herol BM. Nava, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 5, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `BM. Caserío Ciudad Real vs Fraikin BM. Granollers | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de BM. Caserío Ciudad Real vs Fraikin BM. Granollers: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Un nuevo capítulo de la Jornada 5 de la competición.`,
    keywords: `BM. Caserío Ciudad Real, Fraikin BM. Granollers, BM. Caserío Ciudad Real vs Fraikin BM. Granollers, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 5, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `REBI Balonmano Cuenca vs Dicorpebal Logroño La Rioja | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de REBI Balonmano Cuenca vs Dicorpebal Logroño La Rioja en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Toda la emoción de la Jornada 5, en clave de balonmano.`,
    keywords: `REBI Balonmano Cuenca, Dicorpebal Logroño La Rioja, REBI Balonmano Cuenca vs Dicorpebal Logroño La Rioja, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 5, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `IRUDEK Bidasoa Irun vs Cajasol Sevilla BM. Proin | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir IRUDEK Bidasoa Irun vs Cajasol Sevilla BM. Proin con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Revive así uno de los duelos de la Jornada 5 de ASOBAL.`,
    keywords: `IRUDEK Bidasoa Irun, Cajasol Sevilla BM. Proin, IRUDEK Bidasoa Irun vs Cajasol Sevilla BM. Proin, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 5, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fertiberia Puerto Sagunto vs HORNEO BM. Alicante | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Fertiberia Puerto Sagunto vs HORNEO BM. Alicante llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. El balonmano de la Jornada 5, resumido en sus mejores momentos.`,
    keywords: `Fertiberia Puerto Sagunto, HORNEO BM. Alicante, Fertiberia Puerto Sagunto vs HORNEO BM. Alicante, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 5, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `HORNEO BM. Alicante vs IRUDEK Bidasoa Irun | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de HORNEO BM. Alicante vs IRUDEK Bidasoa Irun, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Consulta también todos los contenidos de la Jornada 6 de ASOBAL.`,
    keywords: `HORNEO BM. Alicante, IRUDEK Bidasoa Irun, HORNEO BM. Alicante vs IRUDEK Bidasoa Irun, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 6, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Recoletas Salud At. Valladolid vs BM. Caserío Ciudad Real | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Recoletas Salud At. Valladolid vs BM. Caserío Ciudad Real: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Un nuevo capítulo de la Jornada 6 de la competición.`,
    keywords: `Recoletas Salud At. Valladolid, BM. Caserío Ciudad Real, Recoletas Salud At. Valladolid vs BM. Caserío Ciudad Real, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 6, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `ABANCA Ademar León vs Tubos Aranda Villa de Aranda | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de ABANCA Ademar León vs Tubos Aranda Villa de Aranda está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Toda la emoción de la Jornada 6, en clave de balonmano.`,
    keywords: `ABANCA Ademar León, Tubos Aranda Villa de Aranda, ABANCA Ademar León vs Tubos Aranda Villa de Aranda, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 6, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `REBI Balonmano Cuenca vs Bathco BM. Torrelavega | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue REBI Balonmano Cuenca vs Bathco BM. Torrelavega en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Revive así uno de los duelos de la Jornada 6 de ASOBAL.`,
    keywords: `REBI Balonmano Cuenca, Bathco BM. Torrelavega, REBI Balonmano Cuenca vs Bathco BM. Torrelavega, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 6, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Frigoríficos del Morrazo vs Barça | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de Frigoríficos del Morrazo vs Barça: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. El balonmano de la Jornada 6, resumido en sus mejores momentos.`,
    keywords: `Frigoríficos del Morrazo, Barça, Frigoríficos del Morrazo vs Barça, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 6, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Ángel Ximénez P. Genil vs Dicorpebal Logroño La Rioja | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Cajasol Ángel Ximénez P. Genil vs Dicorpebal Logroño La Rioja en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Consulta también todos los contenidos de la Jornada 6 de ASOBAL.`,
    keywords: `Cajasol Ángel Ximénez P. Genil, Dicorpebal Logroño La Rioja, Cajasol Ángel Ximénez P. Genil vs Dicorpebal Logroño La Rioja, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 6, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Sevilla BM. Proin vs Fraikin BM. Granollers | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Cajasol Sevilla BM. Proin vs Fraikin BM. Granollers con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Un nuevo capítulo de la Jornada 6 de la competición.`,
    keywords: `Cajasol Sevilla BM. Proin, Fraikin BM. Granollers, Cajasol Sevilla BM. Proin vs Fraikin BM. Granollers, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 6, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fertiberia Puerto Sagunto vs Viveros Herol BM. Nava | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Fertiberia Puerto Sagunto vs Viveros Herol BM. Nava llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Toda la emoción de la Jornada 6, en clave de balonmano.`,
    keywords: `Fertiberia Puerto Sagunto, Viveros Herol BM. Nava, Fertiberia Puerto Sagunto vs Viveros Herol BM. Nava, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 6, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Barça vs REBI Balonmano Cuenca | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Barça vs REBI Balonmano Cuenca, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Revive así uno de los duelos de la Jornada 7 de ASOBAL.`,
    keywords: `Barça, REBI Balonmano Cuenca, Barça vs REBI Balonmano Cuenca, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 7, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Dicorpebal Logroño La Rioja vs Frigoríficos del Morrazo | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Dicorpebal Logroño La Rioja vs Frigoríficos del Morrazo: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. El balonmano de la Jornada 7, resumido en sus mejores momentos.`,
    keywords: `Dicorpebal Logroño La Rioja, Frigoríficos del Morrazo, Dicorpebal Logroño La Rioja vs Frigoríficos del Morrazo, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 7, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fraikin BM. Granollers vs Cajasol Ángel Ximénez P. Genil | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de Fraikin BM. Granollers vs Cajasol Ángel Ximénez P. Genil está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Consulta también todos los contenidos de la Jornada 7 de ASOBAL.`,
    keywords: `Fraikin BM. Granollers, Cajasol Ángel Ximénez P. Genil, Fraikin BM. Granollers vs Cajasol Ángel Ximénez P. Genil, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 7, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `IRUDEK Bidasoa Irun vs BM. Caserío Ciudad Real | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue IRUDEK Bidasoa Irun vs BM. Caserío Ciudad Real en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Un nuevo capítulo de la Jornada 7 de la competición.`,
    keywords: `IRUDEK Bidasoa Irun, BM. Caserío Ciudad Real, IRUDEK Bidasoa Irun vs BM. Caserío Ciudad Real, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 7, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Bathco BM. Torrelavega vs Cajasol Sevilla BM. Proin | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de Bathco BM. Torrelavega vs Cajasol Sevilla BM. Proin: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Toda la emoción de la Jornada 7, en clave de balonmano.`,
    keywords: `Bathco BM. Torrelavega, Cajasol Sevilla BM. Proin, Bathco BM. Torrelavega vs Cajasol Sevilla BM. Proin, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 7, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `HORNEO BM. Alicante vs ABANCA Ademar León | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de HORNEO BM. Alicante vs ABANCA Ademar León en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Revive así uno de los duelos de la Jornada 7 de ASOBAL.`,
    keywords: `HORNEO BM. Alicante, ABANCA Ademar León, HORNEO BM. Alicante vs ABANCA Ademar León, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 7, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Tubos Aranda Villa de Aranda vs Fertiberia Puerto Sagunto | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Tubos Aranda Villa de Aranda vs Fertiberia Puerto Sagunto con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. El balonmano de la Jornada 7, resumido en sus mejores momentos.`,
    keywords: `Tubos Aranda Villa de Aranda, Fertiberia Puerto Sagunto, Tubos Aranda Villa de Aranda vs Fertiberia Puerto Sagunto, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 7, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Viveros Herol BM. Nava vs Recoletas Salud At. Valladolid | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Viveros Herol BM. Nava vs Recoletas Salud At. Valladolid llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Consulta también todos los contenidos de la Jornada 7 de ASOBAL.`,
    keywords: `Viveros Herol BM. Nava, Recoletas Salud At. Valladolid, Viveros Herol BM. Nava vs Recoletas Salud At. Valladolid, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 7, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fraikin BM. Granollers vs Barça | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Fraikin BM. Granollers vs Barça, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Un nuevo capítulo de la Jornada 8 de la competición.`,
    keywords: `Fraikin BM. Granollers, Barça, Fraikin BM. Granollers vs Barça, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 8, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Recoletas Salud At. Valladolid vs Bathco BM. Torrelavega | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Recoletas Salud At. Valladolid vs Bathco BM. Torrelavega: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Toda la emoción de la Jornada 8, en clave de balonmano.`,
    keywords: `Recoletas Salud At. Valladolid, Bathco BM. Torrelavega, Recoletas Salud At. Valladolid vs Bathco BM. Torrelavega, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 8, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `ABANCA Ademar León vs IRUDEK Bidasoa Irun | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de ABANCA Ademar León vs IRUDEK Bidasoa Irun está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Revive así uno de los duelos de la Jornada 8 de ASOBAL.`,
    keywords: `ABANCA Ademar León, IRUDEK Bidasoa Irun, ABANCA Ademar León vs IRUDEK Bidasoa Irun, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 8, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `BM. Caserío Ciudad Real vs Dicorpebal Logroño La Rioja | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue BM. Caserío Ciudad Real vs Dicorpebal Logroño La Rioja en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. El balonmano de la Jornada 8, resumido en sus mejores momentos.`,
    keywords: `BM. Caserío Ciudad Real, Dicorpebal Logroño La Rioja, BM. Caserío Ciudad Real vs Dicorpebal Logroño La Rioja, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 8, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Frigoríficos del Morrazo vs HORNEO BM. Alicante | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de Frigoríficos del Morrazo vs HORNEO BM. Alicante: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Consulta también todos los contenidos de la Jornada 8 de ASOBAL.`,
    keywords: `Frigoríficos del Morrazo, HORNEO BM. Alicante, Frigoríficos del Morrazo vs HORNEO BM. Alicante, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 8, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Ángel Ximénez P. Genil vs Tubos Aranda Villa de Aranda | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Cajasol Ángel Ximénez P. Genil vs Tubos Aranda Villa de Aranda en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Un nuevo capítulo de la Jornada 8 de la competición.`,
    keywords: `Cajasol Ángel Ximénez P. Genil, Tubos Aranda Villa de Aranda, Cajasol Ángel Ximénez P. Genil vs Tubos Aranda Villa de Aranda, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 8, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Viveros Herol BM. Nava vs REBI Balonmano Cuenca | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Viveros Herol BM. Nava vs REBI Balonmano Cuenca con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Toda la emoción de la Jornada 8, en clave de balonmano.`,
    keywords: `Viveros Herol BM. Nava, REBI Balonmano Cuenca, Viveros Herol BM. Nava vs REBI Balonmano Cuenca, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 8, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Sevilla BM. Proin vs Fertiberia Puerto Sagunto | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Cajasol Sevilla BM. Proin vs Fertiberia Puerto Sagunto llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Revive así uno de los duelos de la Jornada 8 de ASOBAL.`,
    keywords: `Cajasol Sevilla BM. Proin, Fertiberia Puerto Sagunto, Cajasol Sevilla BM. Proin vs Fertiberia Puerto Sagunto, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 8, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Barça vs Cajasol Sevilla BM. Proin | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Barça vs Cajasol Sevilla BM. Proin, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. El balonmano de la Jornada 9, resumido en sus mejores momentos.`,
    keywords: `Barça, Cajasol Sevilla BM. Proin, Barça vs Cajasol Sevilla BM. Proin, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 9, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Dicorpebal Logroño La Rioja vs Fraikin BM. Granollers | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Dicorpebal Logroño La Rioja vs Fraikin BM. Granollers: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Consulta también todos los contenidos de la Jornada 9 de ASOBAL.`,
    keywords: `Dicorpebal Logroño La Rioja, Fraikin BM. Granollers, Dicorpebal Logroño La Rioja vs Fraikin BM. Granollers, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 9, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Bathco BM. Torrelavega vs ABANCA Ademar León | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de Bathco BM. Torrelavega vs ABANCA Ademar León está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Un nuevo capítulo de la Jornada 9 de la competición.`,
    keywords: `Bathco BM. Torrelavega, ABANCA Ademar León, Bathco BM. Torrelavega vs ABANCA Ademar León, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 9, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Recoletas Salud At. Valladolid vs HORNEO BM. Alicante | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue Recoletas Salud At. Valladolid vs HORNEO BM. Alicante en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Toda la emoción de la Jornada 9, en clave de balonmano.`,
    keywords: `Recoletas Salud At. Valladolid, HORNEO BM. Alicante, Recoletas Salud At. Valladolid vs HORNEO BM. Alicante, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 9, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Tubos Aranda Villa de Aranda vs Viveros Herol BM. Nava | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de Tubos Aranda Villa de Aranda vs Viveros Herol BM. Nava: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Revive así uno de los duelos de la Jornada 9 de ASOBAL.`,
    keywords: `Tubos Aranda Villa de Aranda, Viveros Herol BM. Nava, Tubos Aranda Villa de Aranda vs Viveros Herol BM. Nava, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 9, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `REBI Balonmano Cuenca vs BM. Caserío Ciudad Real | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de REBI Balonmano Cuenca vs BM. Caserío Ciudad Real en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. El balonmano de la Jornada 9, resumido en sus mejores momentos.`,
    keywords: `REBI Balonmano Cuenca, BM. Caserío Ciudad Real, REBI Balonmano Cuenca vs BM. Caserío Ciudad Real, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 9, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Ángel Ximénez P. Genil vs Frigoríficos del Morrazo | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Cajasol Ángel Ximénez P. Genil vs Frigoríficos del Morrazo con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Consulta también todos los contenidos de la Jornada 9 de ASOBAL.`,
    keywords: `Cajasol Ángel Ximénez P. Genil, Frigoríficos del Morrazo, Cajasol Ángel Ximénez P. Genil vs Frigoríficos del Morrazo, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 9, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fertiberia Puerto Sagunto vs IRUDEK Bidasoa Irun | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Fertiberia Puerto Sagunto vs IRUDEK Bidasoa Irun llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Un nuevo capítulo de la Jornada 9 de la competición.`,
    keywords: `Fertiberia Puerto Sagunto, IRUDEK Bidasoa Irun, Fertiberia Puerto Sagunto vs IRUDEK Bidasoa Irun, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 9, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Dicorpebal Logroño La Rioja vs ABANCA Ademar León | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Dicorpebal Logroño La Rioja vs ABANCA Ademar León, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Toda la emoción de la Jornada 10, en clave de balonmano.`,
    keywords: `Dicorpebal Logroño La Rioja, ABANCA Ademar León, Dicorpebal Logroño La Rioja vs ABANCA Ademar León, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 10, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fraikin BM. Granollers vs Recoletas Salud At. Valladolid | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Fraikin BM. Granollers vs Recoletas Salud At. Valladolid: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Revive así uno de los duelos de la Jornada 10 de ASOBAL.`,
    keywords: `Fraikin BM. Granollers, Recoletas Salud At. Valladolid, Fraikin BM. Granollers vs Recoletas Salud At. Valladolid, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 10, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `IRUDEK Bidasoa Irun vs Barça | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de IRUDEK Bidasoa Irun vs Barça está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. El balonmano de la Jornada 10, resumido en sus mejores momentos.`,
    keywords: `IRUDEK Bidasoa Irun, Barça, IRUDEK Bidasoa Irun vs Barça, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 10, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `BM. Caserío Ciudad Real vs Bathco BM. Torrelavega | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue BM. Caserío Ciudad Real vs Bathco BM. Torrelavega en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Consulta también todos los contenidos de la Jornada 10 de ASOBAL.`,
    keywords: `BM. Caserío Ciudad Real, Bathco BM. Torrelavega, BM. Caserío Ciudad Real vs Bathco BM. Torrelavega, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 10, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `HORNEO BM. Alicante vs Tubos Aranda Villa de Aranda | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de HORNEO BM. Alicante vs Tubos Aranda Villa de Aranda: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Un nuevo capítulo de la Jornada 10 de la competición.`,
    keywords: `HORNEO BM. Alicante, Tubos Aranda Villa de Aranda, HORNEO BM. Alicante vs Tubos Aranda Villa de Aranda, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 10, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fertiberia Puerto Sagunto vs REBI Balonmano Cuenca | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Fertiberia Puerto Sagunto vs REBI Balonmano Cuenca en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Toda la emoción de la Jornada 10, en clave de balonmano.`,
    keywords: `Fertiberia Puerto Sagunto, REBI Balonmano Cuenca, Fertiberia Puerto Sagunto vs REBI Balonmano Cuenca, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 10, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Viveros Herol BM. Nava vs Cajasol Ángel Ximénez P. Genil | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Viveros Herol BM. Nava vs Cajasol Ángel Ximénez P. Genil con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Revive así uno de los duelos de la Jornada 10 de ASOBAL.`,
    keywords: `Viveros Herol BM. Nava, Cajasol Ángel Ximénez P. Genil, Viveros Herol BM. Nava vs Cajasol Ángel Ximénez P. Genil, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 10, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Frigoríficos del Morrazo vs Cajasol Sevilla BM. Proin | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Frigoríficos del Morrazo vs Cajasol Sevilla BM. Proin llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. El balonmano de la Jornada 10, resumido en sus mejores momentos.`,
    keywords: `Frigoríficos del Morrazo, Cajasol Sevilla BM. Proin, Frigoríficos del Morrazo vs Cajasol Sevilla BM. Proin, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 10, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Barça vs Viveros Herol BM. Nava | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Barça vs Viveros Herol BM. Nava, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Consulta también todos los contenidos de la Jornada 11 de ASOBAL.`,
    keywords: `Barça, Viveros Herol BM. Nava, Barça vs Viveros Herol BM. Nava, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 11, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Bathco BM. Torrelavega vs IRUDEK Bidasoa Irun | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Bathco BM. Torrelavega vs IRUDEK Bidasoa Irun: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Un nuevo capítulo de la Jornada 11 de la competición.`,
    keywords: `Bathco BM. Torrelavega, IRUDEK Bidasoa Irun, Bathco BM. Torrelavega vs IRUDEK Bidasoa Irun, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 11, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Recoletas Salud At. Valladolid vs Dicorpebal Logroño La Rioja | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de Recoletas Salud At. Valladolid vs Dicorpebal Logroño La Rioja está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Toda la emoción de la Jornada 11, en clave de balonmano.`,
    keywords: `Recoletas Salud At. Valladolid, Dicorpebal Logroño La Rioja, Recoletas Salud At. Valladolid vs Dicorpebal Logroño La Rioja, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 11, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `ABANCA Ademar León vs Fraikin BM. Granollers | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue ABANCA Ademar León vs Fraikin BM. Granollers en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Revive así uno de los duelos de la Jornada 11 de ASOBAL.`,
    keywords: `ABANCA Ademar León, Fraikin BM. Granollers, ABANCA Ademar León vs Fraikin BM. Granollers, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 11, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `REBI Balonmano Cuenca vs Tubos Aranda Villa de Aranda | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de REBI Balonmano Cuenca vs Tubos Aranda Villa de Aranda: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. El balonmano de la Jornada 11, resumido en sus mejores momentos.`,
    keywords: `REBI Balonmano Cuenca, Tubos Aranda Villa de Aranda, REBI Balonmano Cuenca vs Tubos Aranda Villa de Aranda, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 11, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Frigoríficos del Morrazo vs BM. Caserío Ciudad Real | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Frigoríficos del Morrazo vs BM. Caserío Ciudad Real en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Consulta también todos los contenidos de la Jornada 11 de ASOBAL.`,
    keywords: `Frigoríficos del Morrazo, BM. Caserío Ciudad Real, Frigoríficos del Morrazo vs BM. Caserío Ciudad Real, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 11, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Ángel Ximénez P. Genil vs Fertiberia Puerto Sagunto | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Cajasol Ángel Ximénez P. Genil vs Fertiberia Puerto Sagunto con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Un nuevo capítulo de la Jornada 11 de la competición.`,
    keywords: `Cajasol Ángel Ximénez P. Genil, Fertiberia Puerto Sagunto, Cajasol Ángel Ximénez P. Genil vs Fertiberia Puerto Sagunto, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 11, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Sevilla BM. Proin vs HORNEO BM. Alicante | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Cajasol Sevilla BM. Proin vs HORNEO BM. Alicante llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Toda la emoción de la Jornada 11, en clave de balonmano.`,
    keywords: `Cajasol Sevilla BM. Proin, HORNEO BM. Alicante, Cajasol Sevilla BM. Proin vs HORNEO BM. Alicante, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 11, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Barça vs Recoletas Salud At. Valladolid | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Barça vs Recoletas Salud At. Valladolid, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Revive así uno de los duelos de la Jornada 12 de ASOBAL.`,
    keywords: `Barça, Recoletas Salud At. Valladolid, Barça vs Recoletas Salud At. Valladolid, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 12, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Dicorpebal Logroño La Rioja vs IRUDEK Bidasoa Irun | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Dicorpebal Logroño La Rioja vs IRUDEK Bidasoa Irun: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. El balonmano de la Jornada 12, resumido en sus mejores momentos.`,
    keywords: `Dicorpebal Logroño La Rioja, IRUDEK Bidasoa Irun, Dicorpebal Logroño La Rioja vs IRUDEK Bidasoa Irun, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 12, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fraikin BM. Granollers vs Viveros Herol BM. Nava | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de Fraikin BM. Granollers vs Viveros Herol BM. Nava está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Consulta también todos los contenidos de la Jornada 12 de ASOBAL.`,
    keywords: `Fraikin BM. Granollers, Viveros Herol BM. Nava, Fraikin BM. Granollers vs Viveros Herol BM. Nava, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 12, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Bathco BM. Torrelavega vs Fertiberia Puerto Sagunto | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue Bathco BM. Torrelavega vs Fertiberia Puerto Sagunto en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Un nuevo capítulo de la Jornada 12 de la competición.`,
    keywords: `Bathco BM. Torrelavega, Fertiberia Puerto Sagunto, Bathco BM. Torrelavega vs Fertiberia Puerto Sagunto, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 12, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `ABANCA Ademar León vs Cajasol Ángel Ximénez P. Genil | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de ABANCA Ademar León vs Cajasol Ángel Ximénez P. Genil: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Toda la emoción de la Jornada 12, en clave de balonmano.`,
    keywords: `ABANCA Ademar León, Cajasol Ángel Ximénez P. Genil, ABANCA Ademar León vs Cajasol Ángel Ximénez P. Genil, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 12, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `BM. Caserío Ciudad Real vs Cajasol Sevilla BM. Proin | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de BM. Caserío Ciudad Real vs Cajasol Sevilla BM. Proin en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Revive así uno de los duelos de la Jornada 12 de ASOBAL.`,
    keywords: `BM. Caserío Ciudad Real, Cajasol Sevilla BM. Proin, BM. Caserío Ciudad Real vs Cajasol Sevilla BM. Proin, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 12, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `HORNEO BM. Alicante vs REBI Balonmano Cuenca | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir HORNEO BM. Alicante vs REBI Balonmano Cuenca con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. El balonmano de la Jornada 12, resumido en sus mejores momentos.`,
    keywords: `HORNEO BM. Alicante, REBI Balonmano Cuenca, HORNEO BM. Alicante vs REBI Balonmano Cuenca, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 12, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Tubos Aranda Villa de Aranda vs Frigoríficos del Morrazo | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Tubos Aranda Villa de Aranda vs Frigoríficos del Morrazo llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Consulta también todos los contenidos de la Jornada 12 de ASOBAL.`,
    keywords: `Tubos Aranda Villa de Aranda, Frigoríficos del Morrazo, Tubos Aranda Villa de Aranda vs Frigoríficos del Morrazo, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 12, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Dicorpebal Logroño La Rioja vs Bathco BM. Torrelavega | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Dicorpebal Logroño La Rioja vs Bathco BM. Torrelavega, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Un nuevo capítulo de la Jornada 13 de la competición.`,
    keywords: `Dicorpebal Logroño La Rioja, Bathco BM. Torrelavega, Dicorpebal Logroño La Rioja vs Bathco BM. Torrelavega, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 13, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `IRUDEK Bidasoa Irun vs Fraikin BM. Granollers | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de IRUDEK Bidasoa Irun vs Fraikin BM. Granollers: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Toda la emoción de la Jornada 13, en clave de balonmano.`,
    keywords: `IRUDEK Bidasoa Irun, Fraikin BM. Granollers, IRUDEK Bidasoa Irun vs Fraikin BM. Granollers, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 13, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Recoletas Salud At. Valladolid vs ABANCA Ademar León | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de Recoletas Salud At. Valladolid vs ABANCA Ademar León está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Revive así uno de los duelos de la Jornada 13 de ASOBAL.`,
    keywords: `Recoletas Salud At. Valladolid, ABANCA Ademar León, Recoletas Salud At. Valladolid vs ABANCA Ademar León, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 13, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Frigoríficos del Morrazo vs REBI Balonmano Cuenca | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue Frigoríficos del Morrazo vs REBI Balonmano Cuenca en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. El balonmano de la Jornada 13, resumido en sus mejores momentos.`,
    keywords: `Frigoríficos del Morrazo, REBI Balonmano Cuenca, Frigoríficos del Morrazo vs REBI Balonmano Cuenca, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 13, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Ángel Ximénez P. Genil vs HORNEO BM. Alicante | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de Cajasol Ángel Ximénez P. Genil vs HORNEO BM. Alicante: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Consulta también todos los contenidos de la Jornada 13 de ASOBAL.`,
    keywords: `Cajasol Ángel Ximénez P. Genil, HORNEO BM. Alicante, Cajasol Ángel Ximénez P. Genil vs HORNEO BM. Alicante, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 13, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Viveros Herol BM. Nava vs BM. Caserío Ciudad Real | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Viveros Herol BM. Nava vs BM. Caserío Ciudad Real en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Un nuevo capítulo de la Jornada 13 de la competición.`,
    keywords: `Viveros Herol BM. Nava, BM. Caserío Ciudad Real, Viveros Herol BM. Nava vs BM. Caserío Ciudad Real, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 13, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Sevilla BM. Proin vs Tubos Aranda Villa de Aranda | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Cajasol Sevilla BM. Proin vs Tubos Aranda Villa de Aranda con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Toda la emoción de la Jornada 13, en clave de balonmano.`,
    keywords: `Cajasol Sevilla BM. Proin, Tubos Aranda Villa de Aranda, Cajasol Sevilla BM. Proin vs Tubos Aranda Villa de Aranda, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 13, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fertiberia Puerto Sagunto vs Barça | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Fertiberia Puerto Sagunto vs Barça llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Revive así uno de los duelos de la Jornada 13 de ASOBAL.`,
    keywords: `Fertiberia Puerto Sagunto, Barça, Fertiberia Puerto Sagunto vs Barça, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 13, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Barça vs ABANCA Ademar León | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Barça vs ABANCA Ademar León, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. El balonmano de la Jornada 14, resumido en sus mejores momentos.`,
    keywords: `Barça, ABANCA Ademar León, Barça vs ABANCA Ademar León, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 14, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fraikin BM. Granollers vs Bathco BM. Torrelavega | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Fraikin BM. Granollers vs Bathco BM. Torrelavega: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Consulta también todos los contenidos de la Jornada 14 de ASOBAL.`,
    keywords: `Fraikin BM. Granollers, Bathco BM. Torrelavega, Fraikin BM. Granollers vs Bathco BM. Torrelavega, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 14, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Tubos Aranda Villa de Aranda vs Dicorpebal Logroño La Rioja | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de Tubos Aranda Villa de Aranda vs Dicorpebal Logroño La Rioja está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Un nuevo capítulo de la Jornada 14 de la competición.`,
    keywords: `Tubos Aranda Villa de Aranda, Dicorpebal Logroño La Rioja, Tubos Aranda Villa de Aranda vs Dicorpebal Logroño La Rioja, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 14, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `REBI Balonmano Cuenca vs IRUDEK Bidasoa Irun | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue REBI Balonmano Cuenca vs IRUDEK Bidasoa Irun en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Toda la emoción de la Jornada 14, en clave de balonmano.`,
    keywords: `REBI Balonmano Cuenca, IRUDEK Bidasoa Irun, REBI Balonmano Cuenca vs IRUDEK Bidasoa Irun, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 14, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Ángel Ximénez P. Genil vs BM. Caserío Ciudad Real | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de Cajasol Ángel Ximénez P. Genil vs BM. Caserío Ciudad Real: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Revive así uno de los duelos de la Jornada 14 de ASOBAL.`,
    keywords: `Cajasol Ángel Ximénez P. Genil, BM. Caserío Ciudad Real, Cajasol Ángel Ximénez P. Genil vs BM. Caserío Ciudad Real, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 14, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Viveros Herol BM. Nava vs HORNEO BM. Alicante | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Viveros Herol BM. Nava vs HORNEO BM. Alicante en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. El balonmano de la Jornada 14, resumido en sus mejores momentos.`,
    keywords: `Viveros Herol BM. Nava, HORNEO BM. Alicante, Viveros Herol BM. Nava vs HORNEO BM. Alicante, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 14, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Sevilla BM. Proin vs Recoletas Salud At. Valladolid | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Cajasol Sevilla BM. Proin vs Recoletas Salud At. Valladolid con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Consulta también todos los contenidos de la Jornada 14 de ASOBAL.`,
    keywords: `Cajasol Sevilla BM. Proin, Recoletas Salud At. Valladolid, Cajasol Sevilla BM. Proin vs Recoletas Salud At. Valladolid, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 14, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fertiberia Puerto Sagunto vs Frigoríficos del Morrazo | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Fertiberia Puerto Sagunto vs Frigoríficos del Morrazo llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Un nuevo capítulo de la Jornada 14 de la competición.`,
    keywords: `Fertiberia Puerto Sagunto, Frigoríficos del Morrazo, Fertiberia Puerto Sagunto vs Frigoríficos del Morrazo, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 14, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `IRUDEK Bidasoa Irun vs Recoletas Salud At. Valladolid | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de IRUDEK Bidasoa Irun vs Recoletas Salud At. Valladolid, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Toda la emoción de la Jornada 15, en clave de balonmano.`,
    keywords: `IRUDEK Bidasoa Irun, Recoletas Salud At. Valladolid, IRUDEK Bidasoa Irun vs Recoletas Salud At. Valladolid, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 15, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Bathco BM. Torrelavega vs Barça | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Bathco BM. Torrelavega vs Barça: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Revive así uno de los duelos de la Jornada 15 de ASOBAL.`,
    keywords: `Bathco BM. Torrelavega, Barça, Bathco BM. Torrelavega vs Barça, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 15, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `ABANCA Ademar León vs Cajasol Sevilla BM. Proin | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de ABANCA Ademar León vs Cajasol Sevilla BM. Proin está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. El balonmano de la Jornada 15, resumido en sus mejores momentos.`,
    keywords: `ABANCA Ademar León, Cajasol Sevilla BM. Proin, ABANCA Ademar León vs Cajasol Sevilla BM. Proin, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 15, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `BM. Caserío Ciudad Real vs Fertiberia Puerto Sagunto | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue BM. Caserío Ciudad Real vs Fertiberia Puerto Sagunto en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Consulta también todos los contenidos de la Jornada 15 de ASOBAL.`,
    keywords: `BM. Caserío Ciudad Real, Fertiberia Puerto Sagunto, BM. Caserío Ciudad Real vs Fertiberia Puerto Sagunto, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 15, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `HORNEO BM. Alicante vs Dicorpebal Logroño La Rioja | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de HORNEO BM. Alicante vs Dicorpebal Logroño La Rioja: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Un nuevo capítulo de la Jornada 15 de la competición.`,
    keywords: `HORNEO BM. Alicante, Dicorpebal Logroño La Rioja, HORNEO BM. Alicante vs Dicorpebal Logroño La Rioja, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 15, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Tubos Aranda Villa de Aranda vs Fraikin BM. Granollers | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Tubos Aranda Villa de Aranda vs Fraikin BM. Granollers en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Toda la emoción de la Jornada 15, en clave de balonmano.`,
    keywords: `Tubos Aranda Villa de Aranda, Fraikin BM. Granollers, Tubos Aranda Villa de Aranda vs Fraikin BM. Granollers, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 15, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `REBI Balonmano Cuenca vs Cajasol Ángel Ximénez P. Genil | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir REBI Balonmano Cuenca vs Cajasol Ángel Ximénez P. Genil con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Revive así uno de los duelos de la Jornada 15 de ASOBAL.`,
    keywords: `REBI Balonmano Cuenca, Cajasol Ángel Ximénez P. Genil, REBI Balonmano Cuenca vs Cajasol Ángel Ximénez P. Genil, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 15, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Frigoríficos del Morrazo vs Viveros Herol BM. Nava | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Frigoríficos del Morrazo vs Viveros Herol BM. Nava llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. El balonmano de la Jornada 15, resumido en sus mejores momentos.`,
    keywords: `Frigoríficos del Morrazo, Viveros Herol BM. Nava, Frigoríficos del Morrazo vs Viveros Herol BM. Nava, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 15, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Barça vs Dicorpebal Logroño La Rioja | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Barça vs Dicorpebal Logroño La Rioja, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Consulta también todos los contenidos de la Jornada 16 de ASOBAL.`,
    keywords: `Barça, Dicorpebal Logroño La Rioja, Barça vs Dicorpebal Logroño La Rioja, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 16, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Bathco BM. Torrelavega vs HORNEO BM. Alicante | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Bathco BM. Torrelavega vs HORNEO BM. Alicante: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Un nuevo capítulo de la Jornada 16 de la competición.`,
    keywords: `Bathco BM. Torrelavega, HORNEO BM. Alicante, Bathco BM. Torrelavega vs HORNEO BM. Alicante, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 16, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Recoletas Salud At. Valladolid vs REBI Balonmano Cuenca | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de Recoletas Salud At. Valladolid vs REBI Balonmano Cuenca está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Toda la emoción de la Jornada 16, en clave de balonmano.`,
    keywords: `Recoletas Salud At. Valladolid, REBI Balonmano Cuenca, Recoletas Salud At. Valladolid vs REBI Balonmano Cuenca, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 16, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `ABANCA Ademar León vs Fertiberia Puerto Sagunto | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue ABANCA Ademar León vs Fertiberia Puerto Sagunto en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Revive así uno de los duelos de la Jornada 16 de ASOBAL.`,
    keywords: `ABANCA Ademar León, Fertiberia Puerto Sagunto, ABANCA Ademar León vs Fertiberia Puerto Sagunto, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 16, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `BM. Caserío Ciudad Real vs Tubos Aranda Villa de Aranda | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de BM. Caserío Ciudad Real vs Tubos Aranda Villa de Aranda: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. El balonmano de la Jornada 16, resumido en sus mejores momentos.`,
    keywords: `BM. Caserío Ciudad Real, Tubos Aranda Villa de Aranda, BM. Caserío Ciudad Real vs Tubos Aranda Villa de Aranda, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 16, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Frigoríficos del Morrazo vs Fraikin BM. Granollers | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Frigoríficos del Morrazo vs Fraikin BM. Granollers en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Consulta también todos los contenidos de la Jornada 16 de ASOBAL.`,
    keywords: `Frigoríficos del Morrazo, Fraikin BM. Granollers, Frigoríficos del Morrazo vs Fraikin BM. Granollers, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 16, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Ángel Ximénez P. Genil vs Cajasol Sevilla BM. Proin | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Cajasol Ángel Ximénez P. Genil vs Cajasol Sevilla BM. Proin con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Un nuevo capítulo de la Jornada 16 de la competición.`,
    keywords: `Cajasol Ángel Ximénez P. Genil, Cajasol Sevilla BM. Proin, Cajasol Ángel Ximénez P. Genil vs Cajasol Sevilla BM. Proin, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 16, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Viveros Herol BM. Nava vs IRUDEK Bidasoa Irun | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Viveros Herol BM. Nava vs IRUDEK Bidasoa Irun llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Toda la emoción de la Jornada 16, en clave de balonmano.`,
    keywords: `Viveros Herol BM. Nava, IRUDEK Bidasoa Irun, Viveros Herol BM. Nava vs IRUDEK Bidasoa Irun, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 16, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Barça vs Cajasol Ángel Ximénez P. Genil | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Barça vs Cajasol Ángel Ximénez P. Genil, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Revive así uno de los duelos de la Jornada 17 de ASOBAL.`,
    keywords: `Barça, Cajasol Ángel Ximénez P. Genil, Barça vs Cajasol Ángel Ximénez P. Genil, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 17, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Dicorpebal Logroño La Rioja vs Cajasol Sevilla BM. Proin | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Dicorpebal Logroño La Rioja vs Cajasol Sevilla BM. Proin: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. El balonmano de la Jornada 17, resumido en sus mejores momentos.`,
    keywords: `Dicorpebal Logroño La Rioja, Cajasol Sevilla BM. Proin, Dicorpebal Logroño La Rioja vs Cajasol Sevilla BM. Proin, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 17, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fraikin BM. Granollers vs Fertiberia Puerto Sagunto | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de Fraikin BM. Granollers vs Fertiberia Puerto Sagunto está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Consulta también todos los contenidos de la Jornada 17 de ASOBAL.`,
    keywords: `Fraikin BM. Granollers, Fertiberia Puerto Sagunto, Fraikin BM. Granollers vs Fertiberia Puerto Sagunto, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 17, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `IRUDEK Bidasoa Irun vs Frigoríficos del Morrazo | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue IRUDEK Bidasoa Irun vs Frigoríficos del Morrazo en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Un nuevo capítulo de la Jornada 17 de la competición.`,
    keywords: `IRUDEK Bidasoa Irun, Frigoríficos del Morrazo, IRUDEK Bidasoa Irun vs Frigoríficos del Morrazo, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 17, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `HORNEO BM. Alicante vs BM. Caserío Ciudad Real | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de HORNEO BM. Alicante vs BM. Caserío Ciudad Real: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Toda la emoción de la Jornada 17, en clave de balonmano.`,
    keywords: `HORNEO BM. Alicante, BM. Caserío Ciudad Real, HORNEO BM. Alicante vs BM. Caserío Ciudad Real, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 17, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Tubos Aranda Villa de Aranda vs Recoletas Salud At. Valladolid | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Tubos Aranda Villa de Aranda vs Recoletas Salud At. Valladolid en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Revive así uno de los duelos de la Jornada 17 de ASOBAL.`,
    keywords: `Tubos Aranda Villa de Aranda, Recoletas Salud At. Valladolid, Tubos Aranda Villa de Aranda vs Recoletas Salud At. Valladolid, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 17, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `REBI Balonmano Cuenca vs ABANCA Ademar León | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir REBI Balonmano Cuenca vs ABANCA Ademar León con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. El balonmano de la Jornada 17, resumido en sus mejores momentos.`,
    keywords: `REBI Balonmano Cuenca, ABANCA Ademar León, REBI Balonmano Cuenca vs ABANCA Ademar León, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 17, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Viveros Herol BM. Nava vs Bathco BM. Torrelavega | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Viveros Herol BM. Nava vs Bathco BM. Torrelavega llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Consulta también todos los contenidos de la Jornada 17 de ASOBAL.`,
    keywords: `Viveros Herol BM. Nava, Bathco BM. Torrelavega, Viveros Herol BM. Nava vs Bathco BM. Torrelavega, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 17, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Dicorpebal Logroño La Rioja vs Viveros Herol BM. Nava | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Dicorpebal Logroño La Rioja vs Viveros Herol BM. Nava, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Un nuevo capítulo de la Jornada 18 de la competición.`,
    keywords: `Dicorpebal Logroño La Rioja, Viveros Herol BM. Nava, Dicorpebal Logroño La Rioja vs Viveros Herol BM. Nava, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 18, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fraikin BM. Granollers vs HORNEO BM. Alicante | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Fraikin BM. Granollers vs HORNEO BM. Alicante: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Toda la emoción de la Jornada 18, en clave de balonmano.`,
    keywords: `Fraikin BM. Granollers, HORNEO BM. Alicante, Fraikin BM. Granollers vs HORNEO BM. Alicante, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 18, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `IRUDEK Bidasoa Irun vs Tubos Aranda Villa de Aranda | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de IRUDEK Bidasoa Irun vs Tubos Aranda Villa de Aranda está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Revive así uno de los duelos de la Jornada 18 de ASOBAL.`,
    keywords: `IRUDEK Bidasoa Irun, Tubos Aranda Villa de Aranda, IRUDEK Bidasoa Irun vs Tubos Aranda Villa de Aranda, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 18, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Bathco BM. Torrelavega vs Cajasol Ángel Ximénez P. Genil | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue Bathco BM. Torrelavega vs Cajasol Ángel Ximénez P. Genil en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. El balonmano de la Jornada 18, resumido en sus mejores momentos.`,
    keywords: `Bathco BM. Torrelavega, Cajasol Ángel Ximénez P. Genil, Bathco BM. Torrelavega vs Cajasol Ángel Ximénez P. Genil, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 18, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `BM. Caserío Ciudad Real vs Barça | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de BM. Caserío Ciudad Real vs Barça: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Consulta también todos los contenidos de la Jornada 18 de ASOBAL.`,
    keywords: `BM. Caserío Ciudad Real, Barça, BM. Caserío Ciudad Real vs Barça, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 18, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Frigoríficos del Morrazo vs ABANCA Ademar León | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Frigoríficos del Morrazo vs ABANCA Ademar León en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Un nuevo capítulo de la Jornada 18 de la competición.`,
    keywords: `Frigoríficos del Morrazo, ABANCA Ademar León, Frigoríficos del Morrazo vs ABANCA Ademar León, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 18, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Sevilla BM. Proin vs REBI Balonmano Cuenca | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Cajasol Sevilla BM. Proin vs REBI Balonmano Cuenca con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Toda la emoción de la Jornada 18, en clave de balonmano.`,
    keywords: `Cajasol Sevilla BM. Proin, REBI Balonmano Cuenca, Cajasol Sevilla BM. Proin vs REBI Balonmano Cuenca, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 18, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fertiberia Puerto Sagunto vs Recoletas Salud At. Valladolid | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Fertiberia Puerto Sagunto vs Recoletas Salud At. Valladolid llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Revive así uno de los duelos de la Jornada 18 de ASOBAL.`,
    keywords: `Fertiberia Puerto Sagunto, Recoletas Salud At. Valladolid, Fertiberia Puerto Sagunto vs Recoletas Salud At. Valladolid, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 18, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `HORNEO BM. Alicante vs Barça | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de HORNEO BM. Alicante vs Barça, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. El balonmano de la Jornada 19, resumido en sus mejores momentos.`,
    keywords: `HORNEO BM. Alicante, Barça, HORNEO BM. Alicante vs Barça, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 19, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Tubos Aranda Villa de Aranda vs Bathco BM. Torrelavega | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Tubos Aranda Villa de Aranda vs Bathco BM. Torrelavega: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Consulta también todos los contenidos de la Jornada 19 de ASOBAL.`,
    keywords: `Tubos Aranda Villa de Aranda, Bathco BM. Torrelavega, Tubos Aranda Villa de Aranda vs Bathco BM. Torrelavega, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 19, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Recoletas Salud At. Valladolid vs Frigoríficos del Morrazo | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de Recoletas Salud At. Valladolid vs Frigoríficos del Morrazo está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Un nuevo capítulo de la Jornada 19 de la competición.`,
    keywords: `Recoletas Salud At. Valladolid, Frigoríficos del Morrazo, Recoletas Salud At. Valladolid vs Frigoríficos del Morrazo, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 19, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `ABANCA Ademar León vs BM. Caserío Ciudad Real | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue ABANCA Ademar León vs BM. Caserío Ciudad Real en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Toda la emoción de la Jornada 19, en clave de balonmano.`,
    keywords: `ABANCA Ademar León, BM. Caserío Ciudad Real, ABANCA Ademar León vs BM. Caserío Ciudad Real, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 19, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `REBI Balonmano Cuenca vs Fraikin BM. Granollers | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de REBI Balonmano Cuenca vs Fraikin BM. Granollers: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Revive así uno de los duelos de la Jornada 19 de ASOBAL.`,
    keywords: `REBI Balonmano Cuenca, Fraikin BM. Granollers, REBI Balonmano Cuenca vs Fraikin BM. Granollers, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 19, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Ángel Ximénez P. Genil vs IRUDEK Bidasoa Irun | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Cajasol Ángel Ximénez P. Genil vs IRUDEK Bidasoa Irun en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. El balonmano de la Jornada 19, resumido en sus mejores momentos.`,
    keywords: `Cajasol Ángel Ximénez P. Genil, IRUDEK Bidasoa Irun, Cajasol Ángel Ximénez P. Genil vs IRUDEK Bidasoa Irun, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 19, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Sevilla BM. Proin vs Viveros Herol BM. Nava | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Cajasol Sevilla BM. Proin vs Viveros Herol BM. Nava con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Consulta también todos los contenidos de la Jornada 19 de ASOBAL.`,
    keywords: `Cajasol Sevilla BM. Proin, Viveros Herol BM. Nava, Cajasol Sevilla BM. Proin vs Viveros Herol BM. Nava, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 19, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fertiberia Puerto Sagunto vs Dicorpebal Logroño La Rioja | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Fertiberia Puerto Sagunto vs Dicorpebal Logroño La Rioja llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Un nuevo capítulo de la Jornada 19 de la competición.`,
    keywords: `Fertiberia Puerto Sagunto, Dicorpebal Logroño La Rioja, Fertiberia Puerto Sagunto vs Dicorpebal Logroño La Rioja, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 19, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Dicorpebal Logroño La Rioja vs REBI Balonmano Cuenca | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Dicorpebal Logroño La Rioja vs REBI Balonmano Cuenca, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Toda la emoción de la Jornada 20, en clave de balonmano.`,
    keywords: `Dicorpebal Logroño La Rioja, REBI Balonmano Cuenca, Dicorpebal Logroño La Rioja vs REBI Balonmano Cuenca, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 20, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fraikin BM. Granollers vs BM. Caserío Ciudad Real | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Fraikin BM. Granollers vs BM. Caserío Ciudad Real: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Revive así uno de los duelos de la Jornada 20 de ASOBAL.`,
    keywords: `Fraikin BM. Granollers, BM. Caserío Ciudad Real, Fraikin BM. Granollers vs BM. Caserío Ciudad Real, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 20, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Sevilla BM. Proin vs IRUDEK Bidasoa Irun | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de Cajasol Sevilla BM. Proin vs IRUDEK Bidasoa Irun está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. El balonmano de la Jornada 20, resumido en sus mejores momentos.`,
    keywords: `Cajasol Sevilla BM. Proin, IRUDEK Bidasoa Irun, Cajasol Sevilla BM. Proin vs IRUDEK Bidasoa Irun, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 20, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `HORNEO BM. Alicante vs Fertiberia Puerto Sagunto | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue HORNEO BM. Alicante vs Fertiberia Puerto Sagunto en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Consulta también todos los contenidos de la Jornada 20 de ASOBAL.`,
    keywords: `HORNEO BM. Alicante, Fertiberia Puerto Sagunto, HORNEO BM. Alicante vs Fertiberia Puerto Sagunto, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 20, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Barça vs Tubos Aranda Villa de Aranda | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de Barça vs Tubos Aranda Villa de Aranda: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Un nuevo capítulo de la Jornada 20 de la competición.`,
    keywords: `Barça, Tubos Aranda Villa de Aranda, Barça vs Tubos Aranda Villa de Aranda, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 20, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Frigoríficos del Morrazo vs Bathco BM. Torrelavega | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Frigoríficos del Morrazo vs Bathco BM. Torrelavega en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Toda la emoción de la Jornada 20, en clave de balonmano.`,
    keywords: `Frigoríficos del Morrazo, Bathco BM. Torrelavega, Frigoríficos del Morrazo vs Bathco BM. Torrelavega, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 20, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Ángel Ximénez P. Genil vs Recoletas Salud At. Valladolid | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Cajasol Ángel Ximénez P. Genil vs Recoletas Salud At. Valladolid con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Revive así uno de los duelos de la Jornada 20 de ASOBAL.`,
    keywords: `Cajasol Ángel Ximénez P. Genil, Recoletas Salud At. Valladolid, Cajasol Ángel Ximénez P. Genil vs Recoletas Salud At. Valladolid, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 20, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Viveros Herol BM. Nava vs ABANCA Ademar León | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Viveros Herol BM. Nava vs ABANCA Ademar León llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. El balonmano de la Jornada 20, resumido en sus mejores momentos.`,
    keywords: `Viveros Herol BM. Nava, ABANCA Ademar León, Viveros Herol BM. Nava vs ABANCA Ademar León, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 20, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Barça vs Frigoríficos del Morrazo | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Barça vs Frigoríficos del Morrazo, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Consulta también todos los contenidos de la Jornada 21 de ASOBAL.`,
    keywords: `Barça, Frigoríficos del Morrazo, Barça vs Frigoríficos del Morrazo, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 21, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Dicorpebal Logroño La Rioja vs Cajasol Ángel Ximénez P. Genil | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Dicorpebal Logroño La Rioja vs Cajasol Ángel Ximénez P. Genil: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Un nuevo capítulo de la Jornada 21 de la competición.`,
    keywords: `Dicorpebal Logroño La Rioja, Cajasol Ángel Ximénez P. Genil, Dicorpebal Logroño La Rioja vs Cajasol Ángel Ximénez P. Genil, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 21, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fraikin BM. Granollers vs Cajasol Sevilla BM. Proin | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de Fraikin BM. Granollers vs Cajasol Sevilla BM. Proin está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Toda la emoción de la Jornada 21, en clave de balonmano.`,
    keywords: `Fraikin BM. Granollers, Cajasol Sevilla BM. Proin, Fraikin BM. Granollers vs Cajasol Sevilla BM. Proin, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 21, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Bathco BM. Torrelavega vs REBI Balonmano Cuenca | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue Bathco BM. Torrelavega vs REBI Balonmano Cuenca en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Revive así uno de los duelos de la Jornada 21 de ASOBAL.`,
    keywords: `Bathco BM. Torrelavega, REBI Balonmano Cuenca, Bathco BM. Torrelavega vs REBI Balonmano Cuenca, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 21, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `BM. Caserío Ciudad Real vs Recoletas Salud At. Valladolid | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de BM. Caserío Ciudad Real vs Recoletas Salud At. Valladolid: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. El balonmano de la Jornada 21, resumido en sus mejores momentos.`,
    keywords: `BM. Caserío Ciudad Real, Recoletas Salud At. Valladolid, BM. Caserío Ciudad Real vs Recoletas Salud At. Valladolid, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 21, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `IRUDEK Bidasoa Irun vs HORNEO BM. Alicante | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de IRUDEK Bidasoa Irun vs HORNEO BM. Alicante en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Consulta también todos los contenidos de la Jornada 21 de ASOBAL.`,
    keywords: `IRUDEK Bidasoa Irun, HORNEO BM. Alicante, IRUDEK Bidasoa Irun vs HORNEO BM. Alicante, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 21, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Tubos Aranda Villa de Aranda vs ABANCA Ademar León | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Tubos Aranda Villa de Aranda vs ABANCA Ademar León con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Un nuevo capítulo de la Jornada 21 de la competición.`,
    keywords: `Tubos Aranda Villa de Aranda, ABANCA Ademar León, Tubos Aranda Villa de Aranda vs ABANCA Ademar León, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 21, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Viveros Herol BM. Nava vs Fertiberia Puerto Sagunto | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Viveros Herol BM. Nava vs Fertiberia Puerto Sagunto llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Toda la emoción de la Jornada 21, en clave de balonmano.`,
    keywords: `Viveros Herol BM. Nava, Fertiberia Puerto Sagunto, Viveros Herol BM. Nava vs Fertiberia Puerto Sagunto, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 21, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Recoletas Salud At. Valladolid vs Viveros Herol BM. Nava | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Recoletas Salud At. Valladolid vs Viveros Herol BM. Nava, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Revive así uno de los duelos de la Jornada 22 de ASOBAL.`,
    keywords: `Recoletas Salud At. Valladolid, Viveros Herol BM. Nava, Recoletas Salud At. Valladolid vs Viveros Herol BM. Nava, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 22, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `ABANCA Ademar León vs HORNEO BM. Alicante | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de ABANCA Ademar León vs HORNEO BM. Alicante: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. El balonmano de la Jornada 22, resumido en sus mejores momentos.`,
    keywords: `ABANCA Ademar León, HORNEO BM. Alicante, ABANCA Ademar León vs HORNEO BM. Alicante, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 22, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `BM. Caserío Ciudad Real vs IRUDEK Bidasoa Irun | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de BM. Caserío Ciudad Real vs IRUDEK Bidasoa Irun está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Consulta también todos los contenidos de la Jornada 22 de ASOBAL.`,
    keywords: `BM. Caserío Ciudad Real, IRUDEK Bidasoa Irun, BM. Caserío Ciudad Real vs IRUDEK Bidasoa Irun, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 22, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `REBI Balonmano Cuenca vs Barça | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue REBI Balonmano Cuenca vs Barça en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Un nuevo capítulo de la Jornada 22 de la competición.`,
    keywords: `REBI Balonmano Cuenca, Barça, REBI Balonmano Cuenca vs Barça, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 22, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Frigoríficos del Morrazo vs Dicorpebal Logroño La Rioja | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de Frigoríficos del Morrazo vs Dicorpebal Logroño La Rioja: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Toda la emoción de la Jornada 22, en clave de balonmano.`,
    keywords: `Frigoríficos del Morrazo, Dicorpebal Logroño La Rioja, Frigoríficos del Morrazo vs Dicorpebal Logroño La Rioja, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 22, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Ángel Ximénez P. Genil vs Fraikin BM. Granollers | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Cajasol Ángel Ximénez P. Genil vs Fraikin BM. Granollers en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Revive así uno de los duelos de la Jornada 22 de ASOBAL.`,
    keywords: `Cajasol Ángel Ximénez P. Genil, Fraikin BM. Granollers, Cajasol Ángel Ximénez P. Genil vs Fraikin BM. Granollers, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 22, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Sevilla BM. Proin vs Bathco BM. Torrelavega | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Cajasol Sevilla BM. Proin vs Bathco BM. Torrelavega con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. El balonmano de la Jornada 22, resumido en sus mejores momentos.`,
    keywords: `Cajasol Sevilla BM. Proin, Bathco BM. Torrelavega, Cajasol Sevilla BM. Proin vs Bathco BM. Torrelavega, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 22, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fertiberia Puerto Sagunto vs Tubos Aranda Villa de Aranda | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Fertiberia Puerto Sagunto vs Tubos Aranda Villa de Aranda llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Consulta también todos los contenidos de la Jornada 22 de ASOBAL.`,
    keywords: `Fertiberia Puerto Sagunto, Tubos Aranda Villa de Aranda, Fertiberia Puerto Sagunto vs Tubos Aranda Villa de Aranda, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 22, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Barça vs Fraikin BM. Granollers | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Barça vs Fraikin BM. Granollers, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Un nuevo capítulo de la Jornada 23 de la competición.`,
    keywords: `Barça, Fraikin BM. Granollers, Barça vs Fraikin BM. Granollers, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 23, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Dicorpebal Logroño La Rioja vs BM. Caserío Ciudad Real | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Dicorpebal Logroño La Rioja vs BM. Caserío Ciudad Real: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Toda la emoción de la Jornada 23, en clave de balonmano.`,
    keywords: `Dicorpebal Logroño La Rioja, BM. Caserío Ciudad Real, Dicorpebal Logroño La Rioja vs BM. Caserío Ciudad Real, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 23, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `IRUDEK Bidasoa Irun vs ABANCA Ademar León | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de IRUDEK Bidasoa Irun vs ABANCA Ademar León está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Revive así uno de los duelos de la Jornada 23 de ASOBAL.`,
    keywords: `IRUDEK Bidasoa Irun, ABANCA Ademar León, IRUDEK Bidasoa Irun vs ABANCA Ademar León, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 23, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Bathco BM. Torrelavega vs Recoletas Salud At. Valladolid | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue Bathco BM. Torrelavega vs Recoletas Salud At. Valladolid en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. El balonmano de la Jornada 23, resumido en sus mejores momentos.`,
    keywords: `Bathco BM. Torrelavega, Recoletas Salud At. Valladolid, Bathco BM. Torrelavega vs Recoletas Salud At. Valladolid, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 23, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `HORNEO BM. Alicante vs Frigoríficos del Morrazo | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de HORNEO BM. Alicante vs Frigoríficos del Morrazo: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Consulta también todos los contenidos de la Jornada 23 de ASOBAL.`,
    keywords: `HORNEO BM. Alicante, Frigoríficos del Morrazo, HORNEO BM. Alicante vs Frigoríficos del Morrazo, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 23, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Tubos Aranda Villa de Aranda vs Cajasol Ángel Ximénez P. Genil | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Tubos Aranda Villa de Aranda vs Cajasol Ángel Ximénez P. Genil en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Un nuevo capítulo de la Jornada 23 de la competición.`,
    keywords: `Tubos Aranda Villa de Aranda, Cajasol Ángel Ximénez P. Genil, Tubos Aranda Villa de Aranda vs Cajasol Ángel Ximénez P. Genil, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 23, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `REBI Balonmano Cuenca vs Viveros Herol BM. Nava | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir REBI Balonmano Cuenca vs Viveros Herol BM. Nava con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Toda la emoción de la Jornada 23, en clave de balonmano.`,
    keywords: `REBI Balonmano Cuenca, Viveros Herol BM. Nava, REBI Balonmano Cuenca vs Viveros Herol BM. Nava, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 23, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fertiberia Puerto Sagunto vs Cajasol Sevilla BM. Proin | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Fertiberia Puerto Sagunto vs Cajasol Sevilla BM. Proin llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Revive así uno de los duelos de la Jornada 23 de ASOBAL.`,
    keywords: `Fertiberia Puerto Sagunto, Cajasol Sevilla BM. Proin, Fertiberia Puerto Sagunto vs Cajasol Sevilla BM. Proin, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 23, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fraikin BM. Granollers vs Dicorpebal Logroño La Rioja | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Fraikin BM. Granollers vs Dicorpebal Logroño La Rioja, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. El balonmano de la Jornada 24, resumido en sus mejores momentos.`,
    keywords: `Fraikin BM. Granollers, Dicorpebal Logroño La Rioja, Fraikin BM. Granollers vs Dicorpebal Logroño La Rioja, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 24, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `IRUDEK Bidasoa Irun vs Fertiberia Puerto Sagunto | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de IRUDEK Bidasoa Irun vs Fertiberia Puerto Sagunto: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Consulta también todos los contenidos de la Jornada 24 de ASOBAL.`,
    keywords: `IRUDEK Bidasoa Irun, Fertiberia Puerto Sagunto, IRUDEK Bidasoa Irun vs Fertiberia Puerto Sagunto, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 24, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `ABANCA Ademar León vs Bathco BM. Torrelavega | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de ABANCA Ademar León vs Bathco BM. Torrelavega está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Un nuevo capítulo de la Jornada 24 de la competición.`,
    keywords: `ABANCA Ademar León, Bathco BM. Torrelavega, ABANCA Ademar León vs Bathco BM. Torrelavega, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 24, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `BM. Caserío Ciudad Real vs REBI Balonmano Cuenca | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue BM. Caserío Ciudad Real vs REBI Balonmano Cuenca en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Toda la emoción de la Jornada 24, en clave de balonmano.`,
    keywords: `BM. Caserío Ciudad Real, REBI Balonmano Cuenca, BM. Caserío Ciudad Real vs REBI Balonmano Cuenca, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 24, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `HORNEO BM. Alicante vs Recoletas Salud At. Valladolid | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de HORNEO BM. Alicante vs Recoletas Salud At. Valladolid: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Revive así uno de los duelos de la Jornada 24 de ASOBAL.`,
    keywords: `HORNEO BM. Alicante, Recoletas Salud At. Valladolid, HORNEO BM. Alicante vs Recoletas Salud At. Valladolid, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 24, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Frigoríficos del Morrazo vs Cajasol Ángel Ximénez P. Genil | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Frigoríficos del Morrazo vs Cajasol Ángel Ximénez P. Genil en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. El balonmano de la Jornada 24, resumido en sus mejores momentos.`,
    keywords: `Frigoríficos del Morrazo, Cajasol Ángel Ximénez P. Genil, Frigoríficos del Morrazo vs Cajasol Ángel Ximénez P. Genil, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 24, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Viveros Herol BM. Nava vs Tubos Aranda Villa de Aranda | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Viveros Herol BM. Nava vs Tubos Aranda Villa de Aranda con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Consulta también todos los contenidos de la Jornada 24 de ASOBAL.`,
    keywords: `Viveros Herol BM. Nava, Tubos Aranda Villa de Aranda, Viveros Herol BM. Nava vs Tubos Aranda Villa de Aranda, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 24, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Sevilla BM. Proin vs Barça | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Cajasol Sevilla BM. Proin vs Barça llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Un nuevo capítulo de la Jornada 24 de la competición.`,
    keywords: `Cajasol Sevilla BM. Proin, Barça, Cajasol Sevilla BM. Proin vs Barça, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 24, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Barça vs IRUDEK Bidasoa Irun | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Barça vs IRUDEK Bidasoa Irun, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Toda la emoción de la Jornada 25, en clave de balonmano.`,
    keywords: `Barça, IRUDEK Bidasoa Irun, Barça vs IRUDEK Bidasoa Irun, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 25, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Bathco BM. Torrelavega vs BM. Caserío Ciudad Real | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Bathco BM. Torrelavega vs BM. Caserío Ciudad Real: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Revive así uno de los duelos de la Jornada 25 de ASOBAL.`,
    keywords: `Bathco BM. Torrelavega, BM. Caserío Ciudad Real, Bathco BM. Torrelavega vs BM. Caserío Ciudad Real, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 25, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Recoletas Salud At. Valladolid vs Fraikin BM. Granollers | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de Recoletas Salud At. Valladolid vs Fraikin BM. Granollers está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. El balonmano de la Jornada 25, resumido en sus mejores momentos.`,
    keywords: `Recoletas Salud At. Valladolid, Fraikin BM. Granollers, Recoletas Salud At. Valladolid vs Fraikin BM. Granollers, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 25, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `ABANCA Ademar León vs Dicorpebal Logroño La Rioja | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue ABANCA Ademar León vs Dicorpebal Logroño La Rioja en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Consulta también todos los contenidos de la Jornada 25 de ASOBAL.`,
    keywords: `ABANCA Ademar León, Dicorpebal Logroño La Rioja, ABANCA Ademar León vs Dicorpebal Logroño La Rioja, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 25, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Tubos Aranda Villa de Aranda vs HORNEO BM. Alicante | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de Tubos Aranda Villa de Aranda vs HORNEO BM. Alicante: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Un nuevo capítulo de la Jornada 25 de la competición.`,
    keywords: `Tubos Aranda Villa de Aranda, HORNEO BM. Alicante, Tubos Aranda Villa de Aranda vs HORNEO BM. Alicante, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 25, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `REBI Balonmano Cuenca vs Fertiberia Puerto Sagunto | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de REBI Balonmano Cuenca vs Fertiberia Puerto Sagunto en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Toda la emoción de la Jornada 25, en clave de balonmano.`,
    keywords: `REBI Balonmano Cuenca, Fertiberia Puerto Sagunto, REBI Balonmano Cuenca vs Fertiberia Puerto Sagunto, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 25, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Ángel Ximénez P. Genil vs Viveros Herol BM. Nava | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Cajasol Ángel Ximénez P. Genil vs Viveros Herol BM. Nava con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Revive así uno de los duelos de la Jornada 25 de ASOBAL.`,
    keywords: `Cajasol Ángel Ximénez P. Genil, Viveros Herol BM. Nava, Cajasol Ángel Ximénez P. Genil vs Viveros Herol BM. Nava, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 25, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Sevilla BM. Proin vs Frigoríficos del Morrazo | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Cajasol Sevilla BM. Proin vs Frigoríficos del Morrazo llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. El balonmano de la Jornada 25, resumido en sus mejores momentos.`,
    keywords: `Cajasol Sevilla BM. Proin, Frigoríficos del Morrazo, Cajasol Sevilla BM. Proin vs Frigoríficos del Morrazo, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 25, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Dicorpebal Logroño La Rioja vs Recoletas Salud At. Valladolid | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Dicorpebal Logroño La Rioja vs Recoletas Salud At. Valladolid, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Consulta también todos los contenidos de la Jornada 26 de ASOBAL.`,
    keywords: `Dicorpebal Logroño La Rioja, Recoletas Salud At. Valladolid, Dicorpebal Logroño La Rioja vs Recoletas Salud At. Valladolid, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 26, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fraikin BM. Granollers vs ABANCA Ademar León | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Fraikin BM. Granollers vs ABANCA Ademar León: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Un nuevo capítulo de la Jornada 26 de la competición.`,
    keywords: `Fraikin BM. Granollers, ABANCA Ademar León, Fraikin BM. Granollers vs ABANCA Ademar León, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 26, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `IRUDEK Bidasoa Irun vs Bathco BM. Torrelavega | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de IRUDEK Bidasoa Irun vs Bathco BM. Torrelavega está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Toda la emoción de la Jornada 26, en clave de balonmano.`,
    keywords: `IRUDEK Bidasoa Irun, Bathco BM. Torrelavega, IRUDEK Bidasoa Irun vs Bathco BM. Torrelavega, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 26, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `BM. Caserío Ciudad Real vs Frigoríficos del Morrazo | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue BM. Caserío Ciudad Real vs Frigoríficos del Morrazo en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Revive así uno de los duelos de la Jornada 26 de ASOBAL.`,
    keywords: `BM. Caserío Ciudad Real, Frigoríficos del Morrazo, BM. Caserío Ciudad Real vs Frigoríficos del Morrazo, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 26, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `HORNEO BM. Alicante vs Cajasol Sevilla BM. Proin | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de HORNEO BM. Alicante vs Cajasol Sevilla BM. Proin: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. El balonmano de la Jornada 26, resumido en sus mejores momentos.`,
    keywords: `HORNEO BM. Alicante, Cajasol Sevilla BM. Proin, HORNEO BM. Alicante vs Cajasol Sevilla BM. Proin, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 26, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Tubos Aranda Villa de Aranda vs REBI Balonmano Cuenca | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Tubos Aranda Villa de Aranda vs REBI Balonmano Cuenca en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Consulta también todos los contenidos de la Jornada 26 de ASOBAL.`,
    keywords: `Tubos Aranda Villa de Aranda, REBI Balonmano Cuenca, Tubos Aranda Villa de Aranda vs REBI Balonmano Cuenca, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 26, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Viveros Herol BM. Nava vs Barça | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Viveros Herol BM. Nava vs Barça con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Un nuevo capítulo de la Jornada 26 de la competición.`,
    keywords: `Viveros Herol BM. Nava, Barça, Viveros Herol BM. Nava vs Barça, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 26, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fertiberia Puerto Sagunto vs Cajasol Ángel Ximénez P. Genil | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Fertiberia Puerto Sagunto vs Cajasol Ángel Ximénez P. Genil llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Toda la emoción de la Jornada 26, en clave de balonmano.`,
    keywords: `Fertiberia Puerto Sagunto, Cajasol Ángel Ximénez P. Genil, Fertiberia Puerto Sagunto vs Cajasol Ángel Ximénez P. Genil, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 26, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `IRUDEK Bidasoa Irun vs Dicorpebal Logroño La Rioja | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de IRUDEK Bidasoa Irun vs Dicorpebal Logroño La Rioja, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Revive así uno de los duelos de la Jornada 27 de ASOBAL.`,
    keywords: `IRUDEK Bidasoa Irun, Dicorpebal Logroño La Rioja, IRUDEK Bidasoa Irun vs Dicorpebal Logroño La Rioja, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 27, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Recoletas Salud At. Valladolid vs Barça | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Recoletas Salud At. Valladolid vs Barça: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. El balonmano de la Jornada 27, resumido en sus mejores momentos.`,
    keywords: `Recoletas Salud At. Valladolid, Barça, Recoletas Salud At. Valladolid vs Barça, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 27, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `REBI Balonmano Cuenca vs HORNEO BM. Alicante | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de REBI Balonmano Cuenca vs HORNEO BM. Alicante está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Consulta también todos los contenidos de la Jornada 27 de ASOBAL.`,
    keywords: `REBI Balonmano Cuenca, HORNEO BM. Alicante, REBI Balonmano Cuenca vs HORNEO BM. Alicante, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 27, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Frigoríficos del Morrazo vs Tubos Aranda Villa de Aranda | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue Frigoríficos del Morrazo vs Tubos Aranda Villa de Aranda en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Un nuevo capítulo de la Jornada 27 de la competición.`,
    keywords: `Frigoríficos del Morrazo, Tubos Aranda Villa de Aranda, Frigoríficos del Morrazo vs Tubos Aranda Villa de Aranda, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 27, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Ángel Ximénez P. Genil vs ABANCA Ademar León | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de Cajasol Ángel Ximénez P. Genil vs ABANCA Ademar León: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Toda la emoción de la Jornada 27, en clave de balonmano.`,
    keywords: `Cajasol Ángel Ximénez P. Genil, ABANCA Ademar León, Cajasol Ángel Ximénez P. Genil vs ABANCA Ademar León, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 27, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Viveros Herol BM. Nava vs Fraikin BM. Granollers | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Viveros Herol BM. Nava vs Fraikin BM. Granollers en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Revive así uno de los duelos de la Jornada 27 de ASOBAL.`,
    keywords: `Viveros Herol BM. Nava, Fraikin BM. Granollers, Viveros Herol BM. Nava vs Fraikin BM. Granollers, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 27, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Sevilla BM. Proin vs BM. Caserío Ciudad Real | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Cajasol Sevilla BM. Proin vs BM. Caserío Ciudad Real con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. El balonmano de la Jornada 27, resumido en sus mejores momentos.`,
    keywords: `Cajasol Sevilla BM. Proin, BM. Caserío Ciudad Real, Cajasol Sevilla BM. Proin vs BM. Caserío Ciudad Real, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 27, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fertiberia Puerto Sagunto vs Bathco BM. Torrelavega | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Fertiberia Puerto Sagunto vs Bathco BM. Torrelavega llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Consulta también todos los contenidos de la Jornada 27 de ASOBAL.`,
    keywords: `Fertiberia Puerto Sagunto, Bathco BM. Torrelavega, Fertiberia Puerto Sagunto vs Bathco BM. Torrelavega, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 27, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Barça vs Fertiberia Puerto Sagunto | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Barça vs Fertiberia Puerto Sagunto, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Un nuevo capítulo de la Jornada 28 de la competición.`,
    keywords: `Barça, Fertiberia Puerto Sagunto, Barça vs Fertiberia Puerto Sagunto, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 28, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fraikin BM. Granollers vs IRUDEK Bidasoa Irun | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Fraikin BM. Granollers vs IRUDEK Bidasoa Irun: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Toda la emoción de la Jornada 28, en clave de balonmano.`,
    keywords: `Fraikin BM. Granollers, IRUDEK Bidasoa Irun, Fraikin BM. Granollers vs IRUDEK Bidasoa Irun, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 28, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Bathco BM. Torrelavega vs Dicorpebal Logroño La Rioja | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de Bathco BM. Torrelavega vs Dicorpebal Logroño La Rioja está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Revive así uno de los duelos de la Jornada 28 de ASOBAL.`,
    keywords: `Bathco BM. Torrelavega, Dicorpebal Logroño La Rioja, Bathco BM. Torrelavega vs Dicorpebal Logroño La Rioja, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 28, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `ABANCA Ademar León vs Recoletas Salud At. Valladolid | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue ABANCA Ademar León vs Recoletas Salud At. Valladolid en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. El balonmano de la Jornada 28, resumido en sus mejores momentos.`,
    keywords: `ABANCA Ademar León, Recoletas Salud At. Valladolid, ABANCA Ademar León vs Recoletas Salud At. Valladolid, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 28, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `BM. Caserío Ciudad Real vs Viveros Herol BM. Nava | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de BM. Caserío Ciudad Real vs Viveros Herol BM. Nava: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Consulta también todos los contenidos de la Jornada 28 de ASOBAL.`,
    keywords: `BM. Caserío Ciudad Real, Viveros Herol BM. Nava, BM. Caserío Ciudad Real vs Viveros Herol BM. Nava, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 28, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `HORNEO BM. Alicante vs Cajasol Ángel Ximénez P. Genil | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de HORNEO BM. Alicante vs Cajasol Ángel Ximénez P. Genil en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Un nuevo capítulo de la Jornada 28 de la competición.`,
    keywords: `HORNEO BM. Alicante, Cajasol Ángel Ximénez P. Genil, HORNEO BM. Alicante vs Cajasol Ángel Ximénez P. Genil, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 28, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Tubos Aranda Villa de Aranda vs Cajasol Sevilla BM. Proin | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Tubos Aranda Villa de Aranda vs Cajasol Sevilla BM. Proin con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Toda la emoción de la Jornada 28, en clave de balonmano.`,
    keywords: `Tubos Aranda Villa de Aranda, Cajasol Sevilla BM. Proin, Tubos Aranda Villa de Aranda vs Cajasol Sevilla BM. Proin, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 28, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `REBI Balonmano Cuenca vs Frigoríficos del Morrazo | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de REBI Balonmano Cuenca vs Frigoríficos del Morrazo llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Revive así uno de los duelos de la Jornada 28 de ASOBAL.`,
    keywords: `REBI Balonmano Cuenca, Frigoríficos del Morrazo, REBI Balonmano Cuenca vs Frigoríficos del Morrazo, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 28, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Dicorpebal Logroño La Rioja vs Tubos Aranda Villa de Aranda | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Dicorpebal Logroño La Rioja vs Tubos Aranda Villa de Aranda, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. El balonmano de la Jornada 29, resumido en sus mejores momentos.`,
    keywords: `Dicorpebal Logroño La Rioja, Tubos Aranda Villa de Aranda, Dicorpebal Logroño La Rioja vs Tubos Aranda Villa de Aranda, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 29, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `IRUDEK Bidasoa Irun vs REBI Balonmano Cuenca | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de IRUDEK Bidasoa Irun vs REBI Balonmano Cuenca: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Consulta también todos los contenidos de la Jornada 29 de ASOBAL.`,
    keywords: `IRUDEK Bidasoa Irun, REBI Balonmano Cuenca, IRUDEK Bidasoa Irun vs REBI Balonmano Cuenca, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 29, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Bathco BM. Torrelavega vs Fraikin BM. Granollers | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de Bathco BM. Torrelavega vs Fraikin BM. Granollers está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. Un nuevo capítulo de la Jornada 29 de la competición.`,
    keywords: `Bathco BM. Torrelavega, Fraikin BM. Granollers, Bathco BM. Torrelavega vs Fraikin BM. Granollers, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 29, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Recoletas Salud At. Valladolid vs Cajasol Sevilla BM. Proin | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue Recoletas Salud At. Valladolid vs Cajasol Sevilla BM. Proin en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Toda la emoción de la Jornada 29, en clave de balonmano.`,
    keywords: `Recoletas Salud At. Valladolid, Cajasol Sevilla BM. Proin, Recoletas Salud At. Valladolid vs Cajasol Sevilla BM. Proin, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 29, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `ABANCA Ademar León vs Barça | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de ABANCA Ademar León vs Barça: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Revive así uno de los duelos de la Jornada 29 de ASOBAL.`,
    keywords: `ABANCA Ademar León, Barça, ABANCA Ademar León vs Barça, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 29, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `BM. Caserío Ciudad Real vs Cajasol Ángel Ximénez P. Genil | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de BM. Caserío Ciudad Real vs Cajasol Ángel Ximénez P. Genil en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. El balonmano de la Jornada 29, resumido en sus mejores momentos.`,
    keywords: `BM. Caserío Ciudad Real, Cajasol Ángel Ximénez P. Genil, BM. Caserío Ciudad Real vs Cajasol Ángel Ximénez P. Genil, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 29, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `HORNEO BM. Alicante vs Viveros Herol BM. Nava | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir HORNEO BM. Alicante vs Viveros Herol BM. Nava con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Consulta también todos los contenidos de la Jornada 29 de ASOBAL.`,
    keywords: `HORNEO BM. Alicante, Viveros Herol BM. Nava, HORNEO BM. Alicante vs Viveros Herol BM. Nava, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 29, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Frigoríficos del Morrazo vs Fertiberia Puerto Sagunto | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Frigoríficos del Morrazo vs Fertiberia Puerto Sagunto llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. Un nuevo capítulo de la Jornada 29 de la competición.`,
    keywords: `Frigoríficos del Morrazo, Fertiberia Puerto Sagunto, Frigoríficos del Morrazo vs Fertiberia Puerto Sagunto, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 29, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Barça vs Bathco BM. Torrelavega | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Revive el resumen de Barça vs Bathco BM. Torrelavega, con los goles, las mejores jugadas y las paradas más destacadas de la Liga NEXUS ENERGÍA ASOBAL. Disfruta de todos los highlights del duelo y de los momentos clave de la jornada. Toda la emoción de la Jornada 30, en clave de balonmano.`,
    keywords: `Barça, Bathco BM. Torrelavega, Barça vs Bathco BM. Torrelavega, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 30, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Dicorpebal Logroño La Rioja vs HORNEO BM. Alicante | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Todos los highlights de Dicorpebal Logroño La Rioja vs HORNEO BM. Alicante: goles, acciones decisivas, paradas y mejores momentos de un nuevo partido de la Liga NEXUS ENERGÍA ASOBAL. Descubre en este vídeo lo más destacado del encuentro. Revive así uno de los duelos de la Jornada 30 de ASOBAL.`,
    keywords: `Dicorpebal Logroño La Rioja, HORNEO BM. Alicante, Dicorpebal Logroño La Rioja vs HORNEO BM. Alicante, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 30, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fraikin BM. Granollers vs Tubos Aranda Villa de Aranda | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `El mejor resumen de Fraikin BM. Granollers vs Tubos Aranda Villa de Aranda está aquí. Repasa los goles, las grandes intervenciones de los porteros y las jugadas que marcaron el partido en la Liga NEXUS ENERGÍA ASOBAL. El balonmano de la Jornada 30, resumido en sus mejores momentos.`,
    keywords: `Fraikin BM. Granollers, Tubos Aranda Villa de Aranda, Fraikin BM. Granollers vs Tubos Aranda Villa de Aranda, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 30, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Recoletas Salud At. Valladolid vs IRUDEK Bidasoa Irun | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Así fue Recoletas Salud At. Valladolid vs IRUDEK Bidasoa Irun en la Liga NEXUS ENERGÍA ASOBAL. Mira el resumen completo con goles, mejores jugadas, paradas y las acciones más importantes del partido de balonmano español. Consulta también todos los contenidos de la Jornada 30 de ASOBAL.`,
    keywords: `Recoletas Salud At. Valladolid, IRUDEK Bidasoa Irun, Recoletas Salud At. Valladolid vs IRUDEK Bidasoa Irun, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 30, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Ángel Ximénez P. Genil vs REBI Balonmano Cuenca | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Disfruta de los momentos más destacados de Cajasol Ángel Ximénez P. Genil vs REBI Balonmano Cuenca: goles, paradas, ataques y acciones decisivas en la Liga NEXUS ENERGÍA ASOBAL. Un resumen imprescindible para revivir el partido. Un nuevo capítulo de la Jornada 30 de la competición.`,
    keywords: `Cajasol Ángel Ximénez P. Genil, REBI Balonmano Cuenca, Cajasol Ángel Ximénez P. Genil vs REBI Balonmano Cuenca, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 30, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Viveros Herol BM. Nava vs Frigoríficos del Morrazo | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Resumen y highlights de Viveros Herol BM. Nava vs Frigoríficos del Morrazo en la Liga NEXUS ENERGÍA ASOBAL. Repasa los goles, las mejores jugadas y las paradas que protagonizaron este duelo de la máxima categoría del balonmano español. Toda la emoción de la Jornada 30, en clave de balonmano.`,
    keywords: `Viveros Herol BM. Nava, Frigoríficos del Morrazo, Viveros Herol BM. Nava vs Frigoríficos del Morrazo, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 30, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Cajasol Sevilla BM. Proin vs ABANCA Ademar León | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Vuelve a vivir Cajasol Sevilla BM. Proin vs ABANCA Ademar León con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Goles, paradas, grandes jugadas y todos los momentos clave del encuentro reunidos en un solo vídeo. Revive así uno de los duelos de la Jornada 30 de ASOBAL.`,
    keywords: `Cajasol Sevilla BM. Proin, ABANCA Ademar León, Cajasol Sevilla BM. Proin vs ABANCA Ademar León, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 30, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
  {
    titulo: `Fertiberia Puerto Sagunto vs BM. Caserío Ciudad Real | Resumen y goles | Highlights Liga NEXUS ASOBAL`,
    descripcion: `Las mejores imágenes de Fertiberia Puerto Sagunto vs BM. Caserío Ciudad Real llegan con este resumen de la Liga NEXUS ENERGÍA ASOBAL. Descubre los goles, las jugadas más espectaculares y las acciones que decidieron el partido. El balonmano de la Jornada 30, resumido en sus mejores momentos.`,
    keywords: `Fertiberia Puerto Sagunto, BM. Caserío Ciudad Real, Fertiberia Puerto Sagunto vs BM. Caserío Ciudad Real, Liga NEXUS ENERGÍA ASOBAL, Liga NEXUS ASOBAL, ASOBAL, ASOBAL 2026 2027, Liga ASOBAL, balonmano, balonmano español, handball, Jornada 30, resumen partido, resumen balonmano, resumen ASOBAL, goles balonmano, goles ASOBAL, highlights ASOBAL, mejores jugadas, partido ASOBAL, resultado ASOBAL`,
  },
]

const NAVY = '#1629BA'
const YTB_RED = '#CC0000'

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      onClick={e => { e.stopPropagation(); copy() }}
      title={copied ? 'Copiat!' : 'Copiar ' + label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 8px', borderRadius: 6, border: '1px solid',
        borderColor: copied ? '#16a34a' : 'rgba(0,0,0,0.12)',
        background: copied ? '#f0fdf4' : '#fff',
        color: copied ? '#16a34a' : '#6B7280',
        fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all .15s', flexShrink: 0,
      }}
    >
      {copied
        ? <><Check size={9} />Copiat!</>
        : <><Copy size={9} />{label}</>
      }
    </button>
  )
}

function getJornada(entry: YTBEntry): string {
  const m = entry.keywords.match(/Jornada (\d+)/)
  if (m) return `Jornada ${m[1]}`
  return 'Plantilles'
}

export function AsobalYTB() {
  const [q, setQ] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggle = (label: string) =>
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })

  const filtered = useMemo(() => {
    if (!q.trim()) return DATA
    const query = q.toLowerCase()
    return DATA.filter(e =>
      e.titulo.toLowerCase().includes(query) ||
      e.descripcion.toLowerCase().includes(query) ||
      e.keywords.toLowerCase().includes(query)
    )
  }, [q])

  // Group by jornada preserving order
  const groups = useMemo(() => {
    const map: { label: string; entries: { entry: YTBEntry; globalIdx: number }[] }[] = []
    const seen = new Map<string, number>()
    filtered.forEach((entry, i) => {
      const label = getJornada(entry)
      if (!seen.has(label)) {
        seen.set(label, map.length)
        map.push({ label, entries: [] })
      }
      map[seen.get(label)!].entries.push({ entry, globalIdx: i })
    })
    return map
  }, [filtered])

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden', background: '#F8F9FB' }}>

      {/* Header */}
      <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Cerca per equip, jornada o contingut…"
            style={{ width: '100%', padding: '7px 9px 7px 28px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
          />
          {q && (
            <button onClick={() => setQ('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
              <X size={12} />
            </button>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{filtered.length} entrades</div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
            Cap resultat per &ldquo;{q}&rdquo;
          </div>
        )}
        {groups.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {groups.map(group => {
              const isCollapsed = collapsed.has(group.label)
              return (
              <div key={group.label} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                {/* Jornada header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: NAVY }}>
                  <div
                    onClick={() => toggle(group.label)}
                    style={{ gridColumn: '1 / -1', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: isCollapsed ? 'none' : '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none', borderLeft: `4px solid ${YTB_RED}` }}
                  >
                    {isCollapsed ? <ChevronRight size={14} color="rgba(255,255,255,0.75)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.75)" />}
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '.1em' }}>{group.label}</span>
                    <span style={{ fontSize: 10, color: YTB_RED, fontWeight: 700, background: 'rgba(204,0,0,0.15)', borderRadius: 4, padding: '1px 6px' }}>{group.entries.length} {group.entries.length === 1 ? 'entrada' : 'entrades'}</span>
                  </div>
                  {!isCollapsed && (['Títol', 'Descripció SEO', 'Paraules clau'] as const).map(label => (
                    <div key={label} style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '.1em', padding: '5px 14px' }}>{label}</div>
                  ))}
                </div>
                {/* Rows */}
                {!isCollapsed && group.entries.map(({ entry, globalIdx }) => {
                  const kwCount = entry.keywords.length
                  const isTemplate = !entry.titulo.includes('|')
                  return (
                    <div key={globalIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid rgba(0,0,0,0.06)', background: isTemplate ? 'rgba(11,31,74,0.025)' : globalIdx % 2 === 0 ? '#fff' : '#F8F9FB' }}>
                      {/* Col 1 – Títol */}
                      <div style={{ padding: '10px 12px', borderRight: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#111827', lineHeight: 1.4 }}>{entry.titulo}</div>
                        <CopyBtn text={entry.titulo} label="Títol" />
                      </div>
                      {/* Col 2 – Descripció */}
                      <div style={{ padding: '10px 12px', borderRight: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.55 }}>{entry.descripcion}</div>
                        <CopyBtn text={entry.descripcion} label="Descripció" />
                      </div>
                      {/* Col 3 – Keywords */}
                      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 10.5, color: '#374151', lineHeight: 1.6 }}>
                          {entry.keywords.split(', ').map((kw, ki) => (
                            <span key={ki} style={{ display: 'inline-block', background: 'rgba(11,31,74,0.05)', color: NAVY, borderRadius: 4, padding: '1px 5px', margin: '2px 2px 2px 0', fontSize: 10, fontWeight: 600 }}>{kw}</span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CopyBtn text={entry.keywords} label="Keywords" />
                          <span style={{ fontSize: 10, color: kwCount > 480 ? '#DC2626' : kwCount > 420 ? '#D97706' : '#16a34a', fontWeight: 700 }}>{kwCount}/500</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  )
}
