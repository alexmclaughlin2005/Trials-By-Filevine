#!/bin/bash
# Quick revert script for Railpack migration
# Run this if Railpack migration fails

cd "$(dirname "$0")"

if [ ! -f "railway.json.nixpacks-backup" ]; then
    echo "❌ Error: railway.json.nixpacks-backup not found"
    exit 1
fi

cp railway.json.nixpacks-backup railway.json
echo "✅ Reverted to Nixpacks configuration"
echo ""
echo "To redeploy with Nixpacks:"
echo "  git add services/api-gateway/railway.json"
echo "  git commit -m 'revert: Restore Nixpacks builder'"
echo "  git push"
