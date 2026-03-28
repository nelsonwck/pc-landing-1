#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# GCP Provisioning Script (one-time setup)
# Sets up Cloud Run and required APIs for prime-collective-landing
# ─────────────────────────────────────────────────────────────
set -euo pipefail

# ── Configuration ────────────────────────────────────────────
PROJECT_ID="${GCP_PROJECT_ID:-prime-collective-website}"
REGION="${GCP_REGION:-asia-southeast1}"
SERVICE_NAME="${GCP_SERVICE_NAME:-prime-collective-landing}"

echo "╔══════════════════════════════════════════════════╗"
echo "║  GCP Provisioning — Prime Collective             ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Project:  $PROJECT_ID"
echo "║  Region:   $REGION"
echo "║  Service:  $SERVICE_NAME"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Pre-flight checks ───────────────────────────────────────
if ! command -v gcloud &> /dev/null; then
  echo "ERROR: gcloud CLI is not installed."
  echo "Install it from: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# Verify authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1 | grep -q .; then
  echo "ERROR: Not authenticated. Run: gcloud auth login"
  exit 1
fi

echo "→ Setting project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# ── Enable required APIs ────────────────────────────────────
echo ""
echo "→ Enabling required GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --quiet

echo "  ✓ Cloud Run API"
echo "  ✓ Cloud Build API"
echo "  ✓ Artifact Registry API"

# ── Create Artifact Registry repo (for Docker images) ───────
echo ""
echo "→ Creating Artifact Registry repository..."
if gcloud artifacts repositories describe docker-repo \
  --location="$REGION" --format="value(name)" 2>/dev/null; then
  echo "  ✓ Repository 'docker-repo' already exists"
else
  gcloud artifacts repositories create docker-repo \
    --repository-format=docker \
    --location="$REGION" \
    --description="Docker images for Prime Collective" \
    --quiet
  echo "  ✓ Repository 'docker-repo' created"
fi

# ── Configure Docker authentication ─────────────────────────
echo ""
echo "→ Configuring Docker authentication for Artifact Registry..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
echo "  ✓ Docker auth configured"

# ── Set environment variables on Cloud Run ──────────────────
echo ""
echo "════════════════════════════════════════════════════"
echo "  PROVISIONING COMPLETE"
echo "════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo ""
echo "  1. Set secrets on Cloud Run (after first deploy):"
echo "     gcloud run services update $SERVICE_NAME \\"
echo "       --region=$REGION \\"
echo "       --set-env-vars=RESEND_API_KEY=your_key,EMAIL_RECIPIENT=your@email.com"
echo ""
echo "  2. Deploy:"
echo "     ./scripts/deploy.sh --target gcp"
echo ""
echo "  3. (Optional) Map custom domain:"
echo "     gcloud run domain-mappings create \\"
echo "       --service=$SERVICE_NAME \\"
echo "       --domain=yourdomain.com \\"
echo "       --region=$REGION"
echo ""
