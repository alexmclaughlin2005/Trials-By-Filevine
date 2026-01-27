#!/bin/bash
# Reseed takeaways prompt in production

# Get Railway prompt service URL from environment or use default
PROMPT_SERVICE_URL="${RAILWAY_PROMPT_SERVICE_URL:-https://prompt-service-production.up.railway.app}"

echo "Reseeding takeaways prompt in production..."
echo "Target: $PROMPT_SERVICE_URL"

# Call the seed endpoint
curl -X POST "$PROMPT_SERVICE_URL/api/v1/admin/seed" \
  -H "Content-Type: application/json" \
  -d '{}'

echo ""
echo "Done!"
