#!/bin/bash
# Revert script for Phase 1 build optimizations
# Run this if the Phase 1 optimizations cause issues

cd "$(dirname "$0")"

echo "🔄 Reverting Phase 1 Build Optimizations..."
echo ""

# Check if backups exist
if [ ! -f "package.json.backup" ] || [ ! -f "nixpacks.toml.backup2" ]; then
    echo "❌ Error: Backup files not found"
    echo "   Missing: package.json.backup or nixpacks.toml.backup2"
    exit 1
fi

# Revert package.json (removes prebuild script removal)
cp package.json.backup package.json
echo "✅ Reverted package.json (prebuild script restored)"

# Revert nixpacks.toml (removes parallel builds)
cp nixpacks.toml.backup2 nixpacks.toml
echo "✅ Reverted nixpacks.toml (parallel builds removed)"

# Remove production tsconfig (it won't be used anyway)
rm -f ../../tsconfig.production.json
echo "✅ Removed tsconfig.production.json"

echo ""
echo "📝 Changes reverted. To redeploy with original config:"
echo "   git add services/api-gateway/package.json services/api-gateway/nixpacks.toml"
echo "   git commit -m 'revert: Restore original build configuration'"
echo "   git push"
