#!/bin/bash
# Phase 1 Signal System Testing Script
# Usage: ./scripts/test-phase1-signals.sh

set -e

API_URL="${API_URL:-http://localhost:3000}"
AUTH_TOKEN="${AUTH_TOKEN}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_test() {
  echo -e "${YELLOW}Test $1:${NC} $2"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

check_dependency() {
  if ! command -v $1 &> /dev/null; then
    print_error "$1 is not installed. Please install it first."
    exit 1
  fi
}

# Check dependencies
check_dependency "curl"
check_dependency "jq"

# Check auth token
if [ -z "$AUTH_TOKEN" ]; then
  print_error "AUTH_TOKEN environment variable not set"
  echo "Please set it with: export AUTH_TOKEN='your-jwt-token'"
  exit 1
fi

echo ""
echo "🧪 Testing Phase 1: Signal System"
echo "=================================="
echo "API URL: $API_URL"
echo ""

# Test 1: List all signals
print_test "1" "List all signals"
SIGNAL_RESPONSE=$(curl -s -X GET "${API_URL}/api/signals" \
  -H "Authorization: Bearer ${AUTH_TOKEN}")

if echo "$SIGNAL_RESPONSE" | jq -e '.signals' > /dev/null 2>&1; then
  SIGNAL_COUNT=$(echo "$SIGNAL_RESPONSE" | jq '.signals | length')
  print_success "Found ${SIGNAL_COUNT} signals"
else
  print_error "Failed to get signals"
  echo "$SIGNAL_RESPONSE" | jq
  exit 1
fi

# Test 2: Get signal categories
print_test "2" "Get signal categories"
CATEGORIES_RESPONSE=$(curl -s -X GET "${API_URL}/api/signals/categories/list" \
  -H "Authorization: Bearer ${AUTH_TOKEN}")

if echo "$CATEGORIES_RESPONSE" | jq -e '.categories' > /dev/null 2>&1; then
  CATEGORIES=$(echo "$CATEGORIES_RESPONSE" | jq -r '.categories | join(", ")')
  CATEGORY_COUNT=$(echo "$CATEGORIES_RESPONSE" | jq '.categories | length')
  print_success "Found ${CATEGORY_COUNT} categories: ${CATEGORIES}"
else
  print_error "Failed to get categories"
  echo "$CATEGORIES_RESPONSE" | jq
  exit 1
fi

# Test 3: Get extraction methods
print_test "3" "Get extraction methods"
METHODS_RESPONSE=$(curl -s -X GET "${API_URL}/api/signals/extraction-methods/list" \
  -H "Authorization: Bearer ${AUTH_TOKEN}")

if echo "$METHODS_RESPONSE" | jq -e '.extractionMethods' > /dev/null 2>&1; then
  METHODS=$(echo "$METHODS_RESPONSE" | jq -r '.extractionMethods | join(", ")')
  METHOD_COUNT=$(echo "$METHODS_RESPONSE" | jq '.extractionMethods | length')
  print_success "Found ${METHOD_COUNT} extraction methods: ${METHODS}"
else
  print_error "Failed to get extraction methods"
  echo "$METHODS_RESPONSE" | jq
  exit 1
fi

# Test 4: Filter signals by category
print_test "4" "Filter signals by category (DEMOGRAPHIC)"
DEMOGRAPHIC_RESPONSE=$(curl -s -X GET "${API_URL}/api/signals?category=DEMOGRAPHIC" \
  -H "Authorization: Bearer ${AUTH_TOKEN}")

if echo "$DEMOGRAPHIC_RESPONSE" | jq -e '.signals' > /dev/null 2>&1; then
  DEMOGRAPHIC_COUNT=$(echo "$DEMOGRAPHIC_RESPONSE" | jq '.signals | length')
  print_success "Found ${DEMOGRAPHIC_COUNT} demographic signals"
else
  print_error "Failed to filter signals by category"
  echo "$DEMOGRAPHIC_RESPONSE" | jq
  exit 1
fi

# Test 5: Get signal by ID
print_test "5" "Get signal by ID"
FIRST_SIGNAL_ID=$(echo "$SIGNAL_RESPONSE" | jq -r '.signals[0].id')
SIGNAL_DETAIL_RESPONSE=$(curl -s -X GET "${API_URL}/api/signals/${FIRST_SIGNAL_ID}" \
  -H "Authorization: Bearer ${AUTH_TOKEN}")

if echo "$SIGNAL_DETAIL_RESPONSE" | jq -e '.signal' > /dev/null 2>&1; then
  SIGNAL_NAME=$(echo "$SIGNAL_DETAIL_RESPONSE" | jq -r '.signal.name')
  print_success "Retrieved signal: ${SIGNAL_NAME}"
else
  print_error "Failed to get signal by ID"
  echo "$SIGNAL_DETAIL_RESPONSE" | jq
  exit 1
fi

# Test 6: Extract signals from questionnaire (if JUROR_ID provided)
if [ ! -z "$JUROR_ID" ]; then
  print_test "6" "Extract signals from questionnaire"
  
  EXTRACT_RESPONSE=$(curl -s -X POST "${API_URL}/api/signals/jurors/${JUROR_ID}/extract/questionnaire" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "questionnaireData": {
        "occupation": "nurse",
        "education": "bachelor degree",
        "age": 35,
        "maritalStatus": "married",
        "children": true,
        "priorJuryService": false
      }
    }')
  
  if echo "$EXTRACT_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    EXTRACTED_COUNT=$(echo "$EXTRACT_RESPONSE" | jq '.count')
    print_success "Extracted ${EXTRACTED_COUNT} signals from questionnaire"
    
    # Test 7: Get juror signals
    print_test "7" "Get juror signals"
    JUROR_SIGNALS_RESPONSE=$(curl -s -X GET "${API_URL}/api/signals/jurors/${JUROR_ID}" \
      -H "Authorization: Bearer ${AUTH_TOKEN}")
    
    if echo "$JUROR_SIGNALS_RESPONSE" | jq -e '.signals' > /dev/null 2>&1; then
      JUROR_SIGNAL_COUNT=$(echo "$JUROR_SIGNALS_RESPONSE" | jq '.signals | length')
      print_success "Juror has ${JUROR_SIGNAL_COUNT} signals"
    else
      print_error "Failed to get juror signals"
      echo "$JUROR_SIGNALS_RESPONSE" | jq
      exit 1
    fi
    
    # Test 8: Filter juror signals by category
    print_test "8" "Filter juror signals by category (DEMOGRAPHIC)"
    DEMOGRAPHIC_JUROR_RESPONSE=$(curl -s -X GET "${API_URL}/api/signals/jurors/${JUROR_ID}?category=DEMOGRAPHIC" \
      -H "Authorization: Bearer ${AUTH_TOKEN}")
    
    if echo "$DEMOGRAPHIC_JUROR_RESPONSE" | jq -e '.signals' > /dev/null 2>&1; then
      DEMOGRAPHIC_JUROR_COUNT=$(echo "$DEMOGRAPHIC_JUROR_RESPONSE" | jq '.signals | length')
      print_success "Juror has ${DEMOGRAPHIC_JUROR_COUNT} demographic signals"
    else
      print_error "Failed to filter juror signals by category"
      echo "$DEMOGRAPHIC_JUROR_RESPONSE" | jq
      exit 1
    fi
  else
    print_error "Failed to extract signals from questionnaire"
    echo "$EXTRACT_RESPONSE" | jq
    exit 1
  fi
else
  echo ""
  echo -e "${YELLOW}⚠️  Skipping juror extraction tests (JUROR_ID not set)${NC}"
  echo "   Set JUROR_ID to test signal extraction: export JUROR_ID='your-juror-id'"
fi

echo ""
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Test signal extraction from research artifacts"
echo "  2. Test signal extraction from voir dire responses"
echo "  3. Verify signals in database"
echo "  4. Proceed to Phase 2: Matching Algorithms"
