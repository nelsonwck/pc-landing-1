#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Deploy Script — Prime Collective
# Deploys to Vercel, GCP Cloud Run, or both
#
# Usage:
#   ./scripts/deploy.sh --target vercel
#   ./scripts/deploy.sh --target gcp
#   ./scripts/deploy.sh --target all
#   ./scripts/deploy.sh --target gcp --env RESEND_API_KEY=xxx,EMAIL_RECIPIENT=a@b.com
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# ── Defaults ─────────────────────────────────────────────────
TARGET=""
PROD=false
GCP_ENV_VARS=""

# GCP config (override via env vars or flags)
GCP_PROJECT_ID="${GCP_PROJECT_ID:-prime-collective-website}"
GCP_REGION="${GCP_REGION:-asia-southeast1}"
GCP_SERVICE_NAME="${GCP_SERVICE_NAME:-prime-collective-landing}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# ── Parse arguments ──────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --target)  TARGET="$2";       shift 2 ;;
    --prod)    PROD=true;         shift   ;;
    --env)     GCP_ENV_VARS="$2"; shift 2 ;;
    --project) GCP_PROJECT_ID="$2"; shift 2 ;;
    --region)  GCP_REGION="$2";   shift 2 ;;
    --service) GCP_SERVICE_NAME="$2"; shift 2 ;;
    --tag)     IMAGE_TAG="$2";    shift 2 ;;
    -h|--help)
      echo "Usage: deploy.sh --target <vercel|gcp|all> [options]"
      echo ""
      echo "Options:"
      echo "  --target <vercel|gcp|all>   Deployment target (required)"
      echo "  --prod                      Deploy to production (Vercel)"
      echo "  --env KEY=val,KEY2=val2     Set env vars on Cloud Run"
      echo "  --project <id>              GCP project ID (default: $GCP_PROJECT_ID)"
      echo "  --region <region>           GCP region (default: $GCP_REGION)"
      echo "  --service <name>            Cloud Run service name (default: $GCP_SERVICE_NAME)"
      echo "  --tag <tag>                 Docker image tag (default: latest)"
      echo "  -h, --help                  Show this help"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  echo "ERROR: --target is required (vercel, gcp, or all)"
  exit 1
fi

# ── Helpers ──────────────────────────────────────────────────
step() { echo ""; echo "→ $1"; }
success() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; exit 1; }

check_command() {
  if ! command -v "$1" &> /dev/null; then
    fail "$1 is not installed. $2"
  fi
}

# ── Build ────────────────────────────────────────────────────
build_vite() {
  step "Building Vite project..."
  cd "$PROJECT_DIR"
  npm run build
  success "Vite build completed (dist/)"
}

# ── Vercel Deploy ────────────────────────────────────────────
deploy_vercel() {
  step "Deploying to Vercel..."
  check_command "vercel" "Install: npm i -g vercel"
  cd "$PROJECT_DIR"

  if $PROD; then
    vercel --prod
    success "Deployed to Vercel (production)"
  else
    vercel
    success "Deployed to Vercel (preview)"
  fi
}

# ── GCP Cloud Run Deploy ────────────────────────────────────
deploy_gcp() {
  local IMAGE_URI="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/docker-repo/${GCP_SERVICE_NAME}:${IMAGE_TAG}"

  step "Deploying to GCP Cloud Run..."
  check_command "gcloud" "Install: https://cloud.google.com/sdk/docs/install"

  # Verify project
  gcloud config set project "$GCP_PROJECT_ID" --quiet

  # Build and push Docker image via Cloud Build
  step "Building Docker image via Cloud Build..."
  cd "$PROJECT_DIR"
  gcloud builds submit \
    --tag "$IMAGE_URI" \
    --quiet
  success "Image built and pushed: $IMAGE_URI"

  # Deploy to Cloud Run
  step "Deploying image to Cloud Run..."
  local DEPLOY_ARGS=(
    --image "$IMAGE_URI"
    --region "$GCP_REGION"
    --platform managed
    --allow-unauthenticated
    --port 8080
    --memory 256Mi
    --cpu 1
    --min-instances 0
    --max-instances 10
    --quiet
  )

  if [[ -n "$GCP_ENV_VARS" ]]; then
    DEPLOY_ARGS+=(--set-env-vars "$GCP_ENV_VARS")
  fi

  gcloud run deploy "$GCP_SERVICE_NAME" "${DEPLOY_ARGS[@]}"

  # Get the service URL
  local SERVICE_URL
  SERVICE_URL=$(gcloud run services describe "$GCP_SERVICE_NAME" \
    --region="$GCP_REGION" \
    --format="value(status.url)")

  success "Deployed to Cloud Run"
  echo ""
  echo "  URL: $SERVICE_URL"
}

# ── Main ─────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════╗"
echo "║  Deploy — Prime Collective                       ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Target: $TARGET"
[[ "$TARGET" == "gcp" || "$TARGET" == "all" ]] && \
echo "║  GCP:    $GCP_PROJECT_ID / $GCP_REGION"
echo "╚══════════════════════════════════════════════════╝"

case "$TARGET" in
  vercel)
    build_vite
    deploy_vercel
    ;;
  gcp)
    deploy_gcp
    ;;
  all)
    build_vite
    deploy_vercel
    deploy_gcp
    ;;
  *)
    echo "ERROR: Invalid target '$TARGET'. Use: vercel, gcp, or all"
    exit 1
    ;;
esac

echo ""
echo "════════════════════════════════════════════════════"
echo "  DEPLOYMENT COMPLETE ($TARGET)"
echo "════════════════════════════════════════════════════"
