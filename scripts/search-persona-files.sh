#!/bin/bash
# Search for potential persona data files in the project

echo "🔍 Searching for potential persona data files..."
echo "================================================"

echo -e "\n📁 JSON files in project:"
find . -name "*.json" -type f ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" | grep -v "package-lock\|tsconfig\|.nft.json"

echo -e "\n📝 Markdown files mentioning personas:"
find . -name "*.md" -type f ! -path "*/node_modules/*" -exec grep -l "persona.*archetype\|BOOT_\|CRUS_\|archetype.*bootstrapper" {} \;

echo -e "\n🗜️  Compressed files that might contain personas:"
find . -type f \( -name "*.zip" -o -name "*.tar.gz" -o -name "*.tgz" \) ! -path "*/node_modules/*"

echo -e "\n📊 Current database state:"
echo "Run: npm run list-personas"

echo -e "\n================================================"
echo "✨ Search complete!"
