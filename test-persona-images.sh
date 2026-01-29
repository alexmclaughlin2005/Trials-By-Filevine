#!/bin/bash

# Test script for persona image display functionality

echo "🧪 Testing Persona Image Display Implementation"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:3001/api}"

echo "1. Checking API Gateway..."
if curl -s -f "${API_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API Gateway is running"
else
    echo -e "${RED}✗${NC} API Gateway is not responding at ${API_URL}"
    echo "   Please start the API Gateway: cd services/api-gateway && npm run dev"
    exit 1
fi

echo ""
echo "2. Testing personas endpoint (checking for imageUrl field)..."
PERSONAS_RESPONSE=$(curl -s -H "Authorization: Bearer test" "${API_URL}/personas" 2>&1)

if echo "$PERSONAS_RESPONSE" | grep -q "imageUrl"; then
    echo -e "${GREEN}✓${NC} Personas endpoint includes imageUrl field"
    
    # Count personas with images
    IMAGE_COUNT=$(echo "$PERSONAS_RESPONSE" | grep -o '"imageUrl"' | wc -l | tr -d ' ')
    echo "   Found ${IMAGE_COUNT} personas with imageUrl"
else
    echo -e "${YELLOW}⚠${NC}  imageUrl field not found in response (might need authentication)"
    echo "   Response preview:"
    echo "$PERSONAS_RESPONSE" | head -5
fi

echo ""
echo "3. Testing image endpoint..."
# Get first persona ID (this is a mock test - in real scenario you'd need auth)
echo "   Note: Image endpoint requires authentication"
echo "   Endpoint: GET ${API_URL}/personas/images/{personaId}"

echo ""
echo "4. Checking if image files exist..."
IMAGES_DIR="Juror Personas/images"
if [ -d "$IMAGES_DIR" ]; then
    IMAGE_COUNT=$(find "$IMAGES_DIR" -name "*.png" 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${GREEN}✓${NC} Images directory exists"
    echo "   Found ${IMAGE_COUNT} PNG files"
    
    if [ "$IMAGE_COUNT" -gt 0 ]; then
        echo "   Sample files:"
        find "$IMAGES_DIR" -name "*.png" 2>/dev/null | head -3 | while read file; do
            echo "     - $(basename "$file")"
        done
    fi
else
    echo -e "${YELLOW}⚠${NC}  Images directory not found at: $IMAGES_DIR"
fi

echo ""
echo "5. Checking JSON files for image_url..."
JSON_COUNT=0
if [ -d "Juror Personas/generated" ]; then
    for file in Juror Personas/generated/*.json; do
        if [ -f "$file" ]; then
            if grep -q "image_url" "$file" 2>/dev/null; then
                JSON_COUNT=$((JSON_COUNT + 1))
            fi
        fi
    done
    echo "   Found image_url in ${JSON_COUNT} JSON files"
else
    echo -e "${YELLOW}⚠${NC}  Generated personas directory not found"
fi

echo ""
echo "================================================"
echo "✅ Test complete!"
echo ""
echo "Next steps:"
echo "1. Start the API Gateway: cd services/api-gateway && npm run dev"
echo "2. Start the web app: cd apps/web && npm run dev"
echo "3. Navigate to http://localhost:3000/personas"
echo "4. Check if persona cards display images"
