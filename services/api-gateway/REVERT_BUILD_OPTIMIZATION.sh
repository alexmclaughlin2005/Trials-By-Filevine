#!/bin/bash
# Quick revert script for nixpacks.toml optimization
# Run this if the build optimization causes issues

cd "$(dirname "$0")"

if [ -f "nixpacks.toml.backup" ]; then
    cp nixpacks.toml.backup nixpacks.toml
    echo "✅ Reverted nixpacks.toml to original version"
    echo "To redeploy with original config, commit and push this change"
else
    echo "❌ Error: nixpacks.toml.backup not found"
    exit 1
fi
