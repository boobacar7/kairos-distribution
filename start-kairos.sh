#!/bin/bash

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

NODE_VERSION="22"
PNPM_VERSION="10.33.3"

echo ""
echo "=========================================="
echo "       KAIROS DISTRIBUTIONS"
echo "=========================================="
echo ""

# ------------------------------------------
# 0. Environment
# ------------------------------------------

if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo "❌ Fichier .env absent."

    if [ ! -f "$PROJECT_ROOT/.env.example" ]; then
        echo "❌ .env.example introuvable."
        exit 1
    fi

    echo "→ Création de .env depuis .env.example..."
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
fi

echo "→ Chargement de .env..."

set -a
source "$PROJECT_ROOT/.env"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
    echo "❌ DATABASE_URL est absente de .env."
    exit 1
fi

echo "✓ Configuration .env chargée"

# ------------------------------------------
# 1. NVM / Node.js
# ------------------------------------------

export NVM_DIR="$HOME/.nvm"

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    echo "❌ nvm n'est pas installé."
    exit 1
fi

source "$NVM_DIR/nvm.sh"

echo "→ Activation de Node.js ${NODE_VERSION}..."

nvm use "$NODE_VERSION" >/dev/null 2>&1 || nvm install "$NODE_VERSION"

NODE_CURRENT="$(node -v)"
echo "✓ Node.js ${NODE_CURRENT}"

if ! node -e '
const [major, minor] = process.versions.node.split(".").map(Number);
if (major !== 22 || minor < 14) process.exit(1);
'; then
    echo "❌ Kairos nécessite Node >=22.14.0 <23."
    echo "Version actuelle : $(node -v)"
    exit 1
fi

# ------------------------------------------
# 2. Corepack / pnpm
# ------------------------------------------

echo "→ Activation de Corepack..."

corepack enable >/dev/null 2>&1 || true

echo "→ Activation de pnpm ${PNPM_VERSION}..."

corepack prepare "pnpm@${PNPM_VERSION}" --activate >/dev/null 2>&1 || true

if ! command -v pnpm >/dev/null 2>&1; then
    echo "❌ pnpm n'est pas disponible."
    exit 1
fi

PNPM_CURRENT="$(pnpm -v)"

if [ "$PNPM_CURRENT" != "$PNPM_VERSION" ]; then
    echo "⚠️ Version pnpm détectée : ${PNPM_CURRENT}"
    echo "Version attendue : ${PNPM_VERSION}"
    exit 1
fi

echo "✓ pnpm ${PNPM_CURRENT}"

# ------------------------------------------
# 3. Docker
# ------------------------------------------

echo "→ Vérification de Docker..."

if ! docker info >/dev/null 2>&1; then
    echo "→ Docker Desktop n'est pas démarré."
    echo "→ Tentative de démarrage..."

    open -a Docker >/dev/null 2>&1 || true

    echo "→ Attente du moteur Docker..."

    for i in {1..60}; do
        if docker info >/dev/null 2>&1; then
            break
        fi

        sleep 2
    done

    if ! docker info >/dev/null 2>&1; then
        echo "❌ Docker n'a pas démarré."
        exit 1
    fi
fi

echo "✓ Docker disponible"

# ------------------------------------------
# 4. PostgreSQL
# ------------------------------------------

echo "→ Démarrage de PostgreSQL..."

docker compose up -d postgres

echo "→ Vérification PostgreSQL..."

for i in {1..30}; do
    STATUS="$(docker inspect --format='{{.State.Health.Status}}' kairos-postgres 2>/dev/null || true)"

    if [ "$STATUS" = "healthy" ]; then
        break
    fi

    sleep 2
done

STATUS="$(docker inspect --format='{{.State.Health.Status}}' kairos-postgres 2>/dev/null || true)"

if [ "$STATUS" != "healthy" ]; then
    echo "❌ PostgreSQL n'est pas healthy."
    docker compose ps
    exit 1
fi

echo "✓ PostgreSQL healthy"

# ------------------------------------------
# 5. Dépendances
# ------------------------------------------

if [ ! -d "node_modules" ]; then
    echo "→ Installation des dépendances..."
    pnpm install
else
    echo "✓ Dépendances déjà installées"
fi

# ------------------------------------------
# 6. Build des workspaces
# ------------------------------------------

echo "→ Build des workspaces Kairos..."

pnpm build

echo "✓ Build des workspaces terminé"

# ------------------------------------------
# 7. Affichage environnement
# ------------------------------------------

echo ""
echo "=========================================="
echo "        ENVIRONNEMENT PRÊT"
echo "=========================================="
echo ""
echo "Node       : $(node -v)"
echo "pnpm       : $(pnpm -v)"
echo "PostgreSQL : localhost:5432"
echo "Storefront : http://localhost:3000"
echo ""
echo "⚠️ Aucune migration Prisma automatique."
echo ""
echo "=========================================="
echo "        DÉMARRAGE DES SERVICES"
echo "=========================================="
echo ""

# ------------------------------------------
# 8. Nettoyage à l'arrêt
# ------------------------------------------

API_PID=""
STOREFRONT_PID=""

cleanup() {
    echo ""
    echo "→ Arrêt des services..."

    if [ -n "$API_PID" ]; then
        kill "$API_PID" 2>/dev/null || true
    fi

    if [ -n "$STOREFRONT_PID" ]; then
        kill "$STOREFRONT_PID" 2>/dev/null || true
    fi

    wait "$API_PID" 2>/dev/null || true
    wait "$STOREFRONT_PID" 2>/dev/null || true

    echo "✓ Kairos arrêté."
}

trap cleanup INT TERM EXIT

# ------------------------------------------
# 9. API
# ------------------------------------------

echo "→ API : démarrage..."

(
    cd "$PROJECT_ROOT"
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
    pnpm --filter @kairos/api dev
) &

API_PID=$!

# ------------------------------------------
# 10. Storefront
# ------------------------------------------

echo "→ Storefront : démarrage..."

(
    cd "$PROJECT_ROOT"
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
    pnpm --filter @kairos/storefront dev
) &

STOREFRONT_PID=$!

echo ""
echo "=========================================="
echo "       KAIROS EST EN COURS DE LANCEMENT"
echo "=========================================="
echo ""
echo "Storefront : http://localhost:3000"
echo "API        : @kairos/api"
echo "PostgreSQL : localhost:5432"
echo ""
echo "Appuie sur Ctrl+C pour arrêter API +"
echo "Storefront. PostgreSQL reste disponible."
echo ""

wait
