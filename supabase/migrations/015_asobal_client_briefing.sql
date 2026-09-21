-- Migration 015: Client ASOBAL + Briefing complet
-- Afegeix el client Lliga ASOBAL i el seu briefing
-- Inclou columna 'content' a briefings (seleccionada per get_client_context)

-- Afegir columna content a briefings si no existeix
ALTER TABLE briefings ADD COLUMN IF NOT EXISTS content TEXT;

-- Inserir client ASOBAL
INSERT INTO clients (name, slug, type, status, health, website, description)
VALUES (
  'Liga NEXUS ENERGÍA ASOBAL',
  'asobal',
  'federacio',
  'active',
  'healthy',
  'https://asobal.es',
  'Liga NEXUS ENERGÍA ASOBAL — 37ª edición. Primera división del balonmano español. Temporada 2026/27.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  health = EXCLUDED.health,
  website = EXCLUDED.website,
  description = EXCLUDED.description;

-- Inserir briefing complet d'ASOBAL
WITH asobal_client AS (
  SELECT id FROM clients WHERE slug = 'asobal'
)
INSERT INTO briefings (
  client_id,
  client_name,
  sector,
  sport,
  website,
  -- Business
  objectives,
  target_audience,
  -- Sport
  sport_type,
  competitions,
  season,
  sport_calendar,
  -- Communication
  positioning,
  values,
  tone,
  key_messages,
  -- Digital
  instagram,
  tiktok,
  youtube,
  facebook,
  x_twitter,
  -- Content strategy
  content
)
SELECT
  asobal_client.id,
  'Liga NEXUS ENERGÍA ASOBAL',
  'Esport / Handbol professional',
  'Balonmano',
  'https://asobal.es',

  -- objectives
  'Creixement orgànic de seguidors a Instagram i TikTok. Convertir 4M de visualitzacions en creixement real de comunitat. Posicionar la Lliga ASOBAL com el millor producte esportiu de handbol del món.',

  -- target_audience
  'Aficionats al balonmano espanyol i europeu. Seguidors dels 16 clubs participants. Joves 18-35 anys amb interès esportiu. Fanàtics de l'esport de nivell europeu.',

  -- sport
  'Balonmano sala — primera divisió masculina',

  -- competitions
  'Liga NEXUS ENERGÍA ASOBAL (37ª edición). 16 equips: Barça, Dicorpebal Logroño La Rioja, Fraikin BM. Granollers, IRUDEK Bidasoa Irun, Bathco BM. Torrelavega, Recoletas Salud At. Valladolid, ABANCA Ademar León, BM. Caserío Ciudad Real, HORNEO BM. Alicante, Tubos Aranda Villa de Aranda, REBI Balonmano Cuenca, Cajasol Ángel Ximénez P. Genil, Viveros Herol BM. Nava, Cajasol Sevilla BM. Proin, Fertiberia Puerto Sagunto, Frigoríficos del Morrazo.',

  -- season
  '2026/27',

  -- sport_calendar
  'J1: 12/09/2026 (jugada). J2: 19/09/2026 (jugada). J3: 26/09/2026 (pròxima). J4: 03/10/2026. J5: 10/10/2026. J6: 17/10/2026. J7: 24/10/2026. J8: 31/10/2026.',

  -- positioning
  'La mejor liga del mundo de balonmano. Institució esportiva de primer nivell europeu. Orgull de la competició espanyola. Patrocinador títol: NEXUS ENERGÍA.',

  -- values
  'Excel·lència esportiva. Espectacle. Passió pel balonmano. Respecte als clubs i jugadors. Transparència institucional.',

  -- tone
  'Castellà sempre. To institucional i apassionat. Tercera persona per a la lliga ("la Liga"), primera persona plural com a institució ("nuestra competición"). Seriós però amb emoció esportiva. Potencia l''espectacle, el talent dels jugadors i la rivalitat. Expressions habituals: "La mejor liga del mundo", "Balonmano de élite", "¡Jornada X de la Liga NEXUS ENERGÍA ASOBAL!". A evitar: informalitats excessives, comparacions negatives, opinions sobre arbitratge, hashtags genèrics sense validar.',

  -- key_messages
  'Liga NEXUS ENERGÍA ASOBAL. La mejor liga del mundo. Balonmano de élite. Temporada 2026/27. Sponsors actius: NEXUS ENERGÍA (patrocinador títol), Loterías y Apuestas del Estado, Decathlon. Tipografia oficial: Bai Jamjuree (Bold, SemiBold, Regular).',

  -- instagram
  '82.200 seguidors. Canal principal. Reels mediana 27.000 vis. (rang 16.400–177.000). Formats: Reels verticals 9:16, carrusels, Stories. Formats recurrents: Horario J[X], Resultados J[X], MVP J[X], Top 5 Goles J[X], Top 5 Paradas J[X], Clasificación J[X], 7 Ideal J[X].',

  -- tiktok
  '2.522 seguidors. Poc treballat, gran oportunitat. Vídeo vertical natiu per defecte.',

  -- youtube
  '12.100 seguidors. 4.000 vídeos. Resums jornada 170–1.800 vis. Shorts rendeixen molt millor. Font de material: ASOBAL TV.',

  -- facebook
  '28.000 seguidors. Contingut replicat d''Instagram, millorable amb contingut adaptat.',

  -- x_twitter
  '53.500 seguidors. Alcance efectiu ~2%. Problema de propòsit, no d''audiència. Evitar links externs, potenciar contingut natiu.',

  -- content
  'ARQUITECTURA DE CONTINGUTS: Dos pilars — (1) Creixement orgànic per visualitzacions: vídeo vertical per defecte, cadència alta, formats reconeixibles. (2) Xarxa de col·laboracions: clubs, jugadors, entrenadors, patrocinadors, institucions, mitjans.

CICLE SETMANAL:
• 2-3 dies abans: Preview jornada (horaris), Duel destacat (prèvia del partit top)
• Dia de partits: Recordatori matinal, Resultat destacat en temps real (si aplica)
• Post-jornada: Resultats complets, MVP/Jugador jornada, Top 5 gols, Top 5 parades, Classificació actualitzada

FORMATS RECURRENTS AMB NOM:
• Horario J[X] — preview visual amb tots els partits
• Resultados J[X] — post resum de resultats
• MVP J[X] — jugador destacat
• Top 5 Goles J[X]
• Top 5 Paradas J[X]
• Clasificación J[X]
• 7 Ideal J[X] — equip ideal de la jornada

CONTINGUT QUE FUNCIONA: Reels moments espectaculars, estadístiques i curiositats, perfils jugadors, prèvies rivalitat (Barça vs top), rànquings i classificació.

DECISIONS OPERATIVES: Vídeo vertical per defecte (16:9 reservat per ASOBAL TV). Cap peça òrfena (tot té un format amb nom). La jornada és el nucli de la setmana. Cada plataforma rep el seu muntatge.'

FROM asobal_client
ON CONFLICT (client_id) DO UPDATE SET
  client_name = EXCLUDED.client_name,
  sector = EXCLUDED.sector,
  sport = EXCLUDED.sport,
  website = EXCLUDED.website,
  objectives = EXCLUDED.objectives,
  target_audience = EXCLUDED.target_audience,
  sport_type = EXCLUDED.sport_type,
  competitions = EXCLUDED.competitions,
  season = EXCLUDED.season,
  sport_calendar = EXCLUDED.sport_calendar,
  positioning = EXCLUDED.positioning,
  values = EXCLUDED.values,
  tone = EXCLUDED.tone,
  key_messages = EXCLUDED.key_messages,
  instagram = EXCLUDED.instagram,
  tiktok = EXCLUDED.tiktok,
  youtube = EXCLUDED.youtube,
  facebook = EXCLUDED.facebook,
  x_twitter = EXCLUDED.x_twitter,
  content = EXCLUDED.content,
  updated_at = NOW();
