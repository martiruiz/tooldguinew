#!/bin/bash
# guinew-setup.sh — Configura l'entorn d'agents Guinew per a un membre de l'equip
#
# Ús:
#   bash guinew-setup.sh --nom "Bernat Serra" --email bernat@example.com --rol content
#
# Rols disponibles: content | cm | pm | filmmaker | finances | admin

set -e

# ── Colors ─────────────────────────────────────────────────────────────────
G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; N='\033[0m'
ok()   { echo -e "${G}✓${N} $1"; }
info() { echo -e "${Y}→${N} $1"; }
err()  { echo -e "${R}✗${N} $1"; exit 1; }

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     GUINEW AI AGENTS — SETUP v1.0    ║"
echo "║     tools.agenciaguinew.com           ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Arguments ──────────────────────────────────────────────────────────────
NOM=""; EMAIL=""; ROL=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --nom)   NOM="$2";   shift 2 ;;
    --email) EMAIL="$2"; shift 2 ;;
    --rol)   ROL="$2";   shift 2 ;;
    *) shift ;;
  esac
done

[[ -z "$NOM"   ]] && read -p "El teu nom complet: " NOM
[[ -z "$EMAIL" ]] && read -p "El teu email: " EMAIL
[[ -z "$ROL"   ]] && {
  echo "Rols disponibles: content | cm | pm | filmmaker | finances | admin"
  read -p "El teu rol: " ROL
}

info "Configurant per a: $NOM ($EMAIL) — rol: $ROL"

# ── 1. Comprova Claude Code ─────────────────────────────────────────────────
info "Comprovant Claude Code..."
if ! command -v claude &>/dev/null; then
  info "Instal·lant Claude Code..."
  npm install -g @anthropic-ai/claude-code || err "No s'ha pogut instal·lar Claude Code. Instal·la Node.js primer: https://nodejs.org"
fi
ok "Claude Code disponible: $(claude --version 2>/dev/null || echo 'instal·lat')"

# ── 2. Carpeta de treball ───────────────────────────────────────────────────
WORKSPACE="$HOME/guinew-agents"
info "Creant carpeta de treball: $WORKSPACE"
mkdir -p "$WORKSPACE"
cd "$WORKSPACE"

# ── 3. Descarregar agents (si no hi ha git, copia manual) ───────────────────
EQUIP_DIR="/Users/martiruiz/Desktop/Equip d'agents"
if [[ -d "$EQUIP_DIR" ]]; then
  info "Sincronitzant agents des de l'equip local..."
  rsync -a --exclude='node_modules' --exclude='memory' --exclude='*.pt' \
    "$EQUIP_DIR/eines/agents/" "$WORKSPACE/agents/" 2>/dev/null || true
  rsync -a "$EQUIP_DIR/eines/workflows/" "$WORKSPACE/workflows/" 2>/dev/null || true
  ok "Agents sincronitzats: $(ls $WORKSPACE/agents/*.yaml 2>/dev/null | wc -l | tr -d ' ') YAMLs"
else
  info "Carpeta de l'equip no trobada — creant estructura buida"
  mkdir -p "$WORKSPACE/agents" "$WORKSPACE/workflows"
fi

# ── Copiar wrapper 'agent' ──────────────────────────────────────────────────
mkdir -p "$WORKSPACE/bin"
if [[ -d "$EQUIP_DIR" ]]; then
  cp "$EQUIP_DIR/eines/bin/agent" "$WORKSPACE/bin/agent" 2>/dev/null && chmod +x "$WORKSPACE/bin/agent" || true
  # Ajustar ruta AGENTS_DIR dins el wrapper per a la nova carpeta
  sed -i.bak "s|AGENTS_DIR=.*|AGENTS_DIR=\"$WORKSPACE/agents\"|" "$WORKSPACE/bin/agent" 2>/dev/null && rm -f "$WORKSPACE/bin/agent.bak" || true
fi

# Afegir bin/ al PATH si no hi és
if ! echo "$PATH" | grep -q "$WORKSPACE/bin"; then
  SHELL_RC="$HOME/.zshrc"
  [[ "$SHELL" == */bash ]] && SHELL_RC="$HOME/.bashrc"
  echo "export PATH=\"$WORKSPACE/bin:\$PATH\"" >> "$SHELL_RC"
  export PATH="$WORKSPACE/bin:$PATH"
  ok "Afegit $WORKSPACE/bin al PATH ($SHELL_RC)"
fi

# ── 4. Generar CLAUDE.md per rol ────────────────────────────────────────────
info "Generant CLAUDE.md per al rol: $ROL"

cat > "$WORKSPACE/CLAUDE.md" << CLAUDEMD
# Guinew AI Agents — Entorn de $NOM

**Rol**: $ROL | **Usuari**: $NOM ($EMAIL)
**Dashboard**: https://tools.agenciaguinew.com
**Suport**: Martí Ruiz (CEO)

## Qui ets i com treballes

Ets un agent de l'Agència Guinew. El teu rol és **$ROL**.
Treballes amb el sistema d'agents de Guinew connectat al dashboard de l'equip.

## Regles fonamentals

1. **Mai publiques directament** — tots els posts passen per aprovació a tools.agenciaguinew.com
2. **Registres totes les accions** importants al dashboard (Supabase)
3. **Si hi ha dubte, para i notifica** — escalda a Martí
4. **Respecta els permisos del teu rol** (definits a agents/permissions.yaml)

## Clients actius de Guinew

ASOBAL | Elite Fut | BIWPA | Best Cup | El Collell | Esports Parra | Kanbe |
Nautivela | Proodos | TPE (Esport / Campus / Cups) | Esport Adaptat | OFF |
Lloret Cup | IN Sports | Villarreal CF | Iniesta Academy | CESA | Ágreda

## Com executar un agent

\`\`\`bash
# Llistar tots els agents disponibles:
agent llista

# Executar un agent:
agent cm
agent contingut
agent pm
agent analytics

# Amb context addicional:
agent cm --client ASOBAL
\`\`\`

## Dashboard

Accedeix a https://tools.agenciaguinew.com per veure:
- Runs actius dels agents
- Aprovacions pendents
- Logs i historial

CLAUDEMD

# ── Afegir context de rol específic ────────────────────────────────────────
case "$ROL" in
  content|filmmaker)
    cat >> "$WORKSPACE/CLAUDE.md" << ROL_CTX

## Agents principals per al teu rol

- **02_contingut.yaml** — Generació de contingut escrit per a RRSS
- **15_disseny.yaml** — Briefs de disseny i visual
- **17_clip.yaml** — Edició i producció de vídeo
- **20_brand.yaml** — Brand overlay (mosca + final card)
- **21_draft.yaml** — Esborranys per a aprovació

## Eines de vídeo

- \`python3 eines/scripts/vertical_reframe.py <clip.mp4>\` — Reframe 9:16
- \`python3 eines/scripts/jornada_runner.py --config <jornada.json>\` — Pipeline ASOBAL
ROL_CTX
    ;;
  cm)
    cat >> "$WORKSPACE/CLAUDE.md" << ROL_CTX

## Agents principals per al teu rol

- **04_cm.yaml** — Community Manager (respostes, DMs, comentaris)
- **05_qa.yaml** — QA de contingut i respostes
- **03_calendari.yaml** — Calendari de publicacions

## Metricool — Programar posts

Usa el MCP de Metricool integrat al dashboard per programar contingut un cop aprovat.
ROL_CTX
    ;;
  pm)
    cat >> "$WORKSPACE/CLAUDE.md" << ROL_CTX

## Agents principals per al teu rol

- **01_project_manager.yaml** — Gestió de tasques i projectes
- **06_reporting.yaml** — Informes setmanals per a Martí
- **12_analytics.yaml** — Anàlisi de resultats

## Accés al dashboard

Com a PM tens accés complet al dashboard: https://tools.agenciaguinew.com/agents
ROL_CTX
    ;;
  finances)
    cat >> "$WORKSPACE/CLAUDE.md" << ROL_CTX

## Agents principals per al teu rol

- **07_finances.yaml** — Finances internes (ACCÉS RESTRINGIT)

## Seguretat

L'agent de finances té permisos restringits. Respostes ÚNICAMENT a Martí o direcció.
ROL_CTX
    ;;
esac

ok "CLAUDE.md creat a $WORKSPACE/CLAUDE.md"

# ── 5. Resum final ──────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  SETUP COMPLETAT                                  ║"
echo "╠══════════════════════════════════════════════════╣"
printf "║  Usuari:    %-37s║\n" "$NOM"
printf "║  Rol:       %-37s║\n" "$ROL"
printf "║  Carpeta:   %-37s║\n" "$WORKSPACE"
echo "║                                                   ║"
echo "║  Proper pas:                                      ║"
echo "║  1. Obre tools.agenciaguinew.com                  ║"
echo "║  2. Inicia sessió amb el teu email                ║"
echo "║  3. cd ~/guinew-agents && claude                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
info "Per executar agents: cd ~/guinew-agents && claude"
info "Dashboard: https://tools.agenciaguinew.com"
