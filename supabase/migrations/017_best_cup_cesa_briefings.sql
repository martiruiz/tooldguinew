-- Migration 017: Best Cup i CESA client briefings
-- IMPORTANT: Executa primer el GRANT si dóna error de permisos:
-- GRANT INSERT, UPDATE ON public.briefings TO service_role;
-- GRANT INSERT, UPDATE ON public.clients TO service_role;
-- Best Cup: torneig futbol juvenil U18 organitzat per NextEra Sport + BEST BCN
-- CESA: Campeonato de España Sub de Balonmano, cobertura per Federació Catalana

-- ─── BEST CUP ───────────────────────────────────────────────────────────────

INSERT INTO clients (slug, name, type)
VALUES ('best-cup', 'Best Cup Football', 'torneig')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type;

INSERT INTO briefings (
  client_id,
  objectives,
  positioning,
  tone,
  instagram,
  content
)
SELECT
  c.id,
  'Posicionar Best Cup com el torneig de fútbol base U18 de màxim nivell internacional. Generar expectació i notorietat per a l''edició 2026 a Madrid. Atreure sponsors i maximitzar l''audiència digital durant els 4 dies del torneig (13-16 agost 2026).',
  'Torneig premium i exclusiu de fútbol juvenil (Sub-18) que reuneix els millors clubs del món. 3a edició. Edició 2026: Madrid, Complejo Ernesto Cotorruelo RFFM. 12 equips confirmats: FC Barcelona, Real Madrid, Atlético Madrid, FC Porto, Como 1907, RCD Espanyol, Real Betis i més. Retransmissió fase final a DAZN.',
  'Exclusiu, aspiracional, premium. Combina emoció esportiva amb projecció internacional. Tuteo directe: "Únete", "Forma parte del juego". Eslògans: "La élite del fútbol juvenil en un torneo único". Emoticonos moderats. Castellà com a idioma principal.',
  '{
    "handle": "@bestcupfutbol",
    "seguidors": null,
    "frequencia": "Diariament durant el torneig (4 dies intensius)"
  }',
  '{
    "organitzadors": ["NextEra Sport", "BEST BCN"],
    "edicio_2026": {
      "localitzacio": "Madrid",
      "seu": "Complejo Ernesto Cotorruelo de la RFFM",
      "categoria": "U18",
      "dates": "13-16 agost 2026",
      "num_equips": 12
    },
    "equips_2026": ["FC Barcelona", "Real Madrid", "Atlético de Madrid", "FC Porto", "Como 1907", "RCD Espanyol", "Real Betis", "GAFE CF SAD", "Madrid City"],
    "sponsors_2026": ["Radisson", "Iberia", "11Teamsports", "Sofascore", "Marca", "Bounce", "DAZN"],
    "brand_colors": ["#000000", "#FF6B00"],
    "brand_claims": ["La élite del fútbol juvenil en un torneo único", "Únete a la Best Cup, forma parte del juego"],
    "retransmissio": "Fase final a DAZN. Edició 2025 a La Xarxa (21.204 visualitzacions).",
    "stats_2025": {
      "instagram_visualitzacions": 1071211,
      "instagram_alcance": 131100,
      "instagram_interaccions": 6438,
      "streaming_visualitzacions": 21204,
      "assistencia_presencial": 4500
    },
    "contingut_funciona": ["Jugades espectaculars i gols (Reels)", "Anuncis de clubs participants", "Resultats en directe", "Behind the scenes", "Contingut DAZN/streaming"],
    "contingut_evitar": ["Contingut amateur o poc produït", "Excés de text en imatge", "Memes que trenquin to premium"]
  }'::jsonb
FROM clients c
WHERE c.slug = 'best-cup'
ON CONFLICT (client_id) DO UPDATE SET
  objectives = EXCLUDED.objectives,
  positioning = EXCLUDED.positioning,
  tone = EXCLUDED.tone,
  instagram = EXCLUDED.instagram,
  content = EXCLUDED.content;


-- ─── CESA ───────────────────────────────────────────────────────────────────

INSERT INTO clients (slug, name, type)
VALUES ('cesa', 'CESA — Campeonato de España Sub de Balonmano', 'federacio')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type;

INSERT INTO briefings (
  client_id,
  objectives,
  positioning,
  tone,
  instagram,
  content
)
SELECT
  c.id,
  'Maximitzar l''abast i l''engagement durant el campionat (1 setmana intensa de gener). Posicionar el CESA com la gran festa del balonmano base espanyol. Créixer en seguidors i impressions respecte a l''edició anterior.',
  'Campionat d''Espanya Sub de Balonmano celebrat a Catalunya. Edició 2025: @cesabm2025cat. Organitzat per la Federació Catalana de Balonmano (@fedcathandbol). 16+ CCAA participants. Cobertura en directe de tots els partits. Xifres edició 2025: 14.330 seguidors IG (+48.2%), 8.97M impressions, 466K interaccions en 8 dies.',
  'Dinàmic, emocional, proper. Posa en valor el talent juvenil. Barreja drama esportiu amb humor i proximitat. Emoticonos sempre a l''esquerra. Stories en MAJÚSCULES i COLOR BLANC. Etiquetar sempre federacions autonòmiques. Hashtag: #CESAbm2025CAT. Idioma: castellà (principal) + català.',
  '{
    "handle": "@cesabm2025cat",
    "seguidors": 14330,
    "frequencia": "100+ posts durant el campionat (1 setmana de gener)"
  }',
  '{
    "twitter_handle": "CESA Catalunya 2025",
    "twitter_seguidors": 1750,
    "web": "cesabm2025.com",
    "hashtag": "#CESAbm2025CAT",
    "organitzador": "Federació Catalana de Balonmano (@fedcathandbol)",
    "rfebalonmano": "@RFEBalonmano",
    "categories": ["Juvenil", "Cadet", "Infantil"],
    "format_post_partit": {
      "pre_partit": "¿Quién se llevará la victoria entre @CCAA1 y @CCAA2? + foto calentament",
      "durant_stories": "Gols, aturades, accions destacades (vídeos 15s)",
      "post_partit": "¡@CCAA1 se lleva el partido por X a X ante @CCAA2! + marcador"
    },
    "guia_estil": {
      "emoticonos": "Sempre a l'esquerra",
      "stories_text": "MAJÚSCULES + BLANC + CURSIVA NEGRITA",
      "tipografia_plans": "Montserrat Bold",
      "hashtagging": "#CESA2025CAT sempre"
    },
    "comptes_clave": {
      "rfebalonmano": "@rfebalonmano / rfebalonmano",
      "fedcathandbol": "@FedCatHandbol / fedcathandbol",
      "cesa_csd": "@CESA_CSD / cesa_csd"
    },
    "stats_2025_8_dies": {
      "total_seguidors": 16080,
      "ig_seguidors": 14330,
      "twitter_seguidors": 1750,
      "ig_impressions": 8970000,
      "ig_interaccions": 466350,
      "total_publicacions": 856
    },
    "contingut_funciona": ["Jugades espectaculars i gols polèmics", "¿Gol o no gol? format curt", "Resultats en directe amb context emocional", "Protagonisme de jugadores joves", "Tags a federacions autonòmiques", "Noms de CCAA com a protagonistes (rivalitats)"],
    "contingut_evitar": ["Contingut institucional sense emoció", "Posts sense cara visible de jugadors", "Text llarg sense element visual"]
  }'::jsonb
FROM clients c
WHERE c.slug = 'cesa'
ON CONFLICT (client_id) DO UPDATE SET
  objectives = EXCLUDED.objectives,
  positioning = EXCLUDED.positioning,
  tone = EXCLUDED.tone,
  instagram = EXCLUDED.instagram,
  content = EXCLUDED.content;
