#!/bin/bash

# Quick test script for roundtable conversation
# Usage: ./test-roundtable.sh SESSION_ID ARGUMENT_ID AUTH_TOKEN

SESSION_ID=${1:-"297e3cba-cc91-4a7c-a40f-43e53d07117f"}
ARGUMENT_ID=$2
AUTH_TOKEN=$3

if [ -z "$ARGUMENT_ID" ]; then
  echo "Usage: ./test-roundtable.sh SESSION_ID ARGUMENT_ID AUTH_TOKEN"
  echo ""
  echo "SESSION_ID from your screenshot: 297e3cba-cc91-4a7c-a40f-43e53d07117f"
  echo ""
  echo "To find ARGUMENT_ID and AUTH_TOKEN:"
  echo "1. Open browser dev tools (F12)"
  echo "2. Go to Network tab"
  echo "3. Look at any API request"
  echo "4. Copy the Authorization header value (the token)"
  echo "5. Find argument IDs in the case data"
  exit 1
fi

if [ -z "$AUTH_TOKEN" ]; then
  echo "Error: AUTH_TOKEN required"
  exit 1
fi

echo "🎭 Starting roundtable conversation..."
echo "Session: $SESSION_ID"
echo "Argument: $ARGUMENT_ID"
echo ""

RESPONSE=$(curl -s -X POST "http://localhost:3001/api/focus-groups/sessions/$SESSION_ID/roundtable" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"argumentId\": \"$ARGUMENT_ID\"}")

echo "$RESPONSE" | jq '.'

CONVERSATION_ID=$(echo "$RESPONSE" | jq -r '.conversationId')

if [ "$CONVERSATION_ID" != "null" ] && [ -n "$CONVERSATION_ID" ]; then
  echo ""
  echo "✅ Conversation created: $CONVERSATION_ID"
  echo ""
  echo "View full results:"
  echo "curl http://localhost:3001/api/focus-groups/conversations/$CONVERSATION_ID \\"
  echo "  -H \"Authorization: Bearer $AUTH_TOKEN\" | jq '.'"
else
  echo ""
  echo "❌ Conversation failed to create"
fi
