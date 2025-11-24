#!/bin/bash

# Retrieve ValueSets from NLM VSAC
# Usage: ./scripts/retrieve-valuesets.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "  Retrieve ValueSets from NLM VSAC"
echo "=========================================="
echo

# Configuration
VSAC_API_KEY="${VSAC_API_KEY}"
VSAC_BASE_URL="https://vsac.nlm.nih.gov/vsac/svs"

# Check required variables
if [ -z "$VSAC_API_KEY" ]; then
  echo -e "${RED}ERROR: Missing VSAC_API_KEY${NC}"
  echo "Please set:"
  echo "  export VSAC_API_KEY='your-api-key'"
  echo
  echo "Get API key from:"
  echo "  1. Visit https://uts.nlm.nih.gov/uts/"
  echo "  2. Log in or create account"
  echo "  3. Profile → API Key Management"
  echo "  4. Generate New API Key"
  exit 1
fi

# ValueSets for CMS125 (Breast Cancer Screening)
declare -A VALUESETS
VALUESETS[Mammography]="2.16.840.1.113883.3.464.1003.198.12.1011"
VALUESETS[BilateralMastectomy]="2.16.840.1.113883.3.526.3.1285"
VALUESETS[PatientCharacteristicPayer]="2.16.840.1.113883.3.464.1003.101.12.1061"

echo "📋 ValueSets to retrieve:"
for NAME in "${!VALUESETS[@]}"; do
  echo "  - $NAME: ${VALUESETS[$NAME]}"
done
echo

# Create output directory
mkdir -p test-data/valuesets

# Retrieve each ValueSet
for NAME in "${!VALUESETS[@]}"; do
  OID="${VALUESETS[$NAME]}"
  echo "📥 Retrieving $NAME (${OID})..."

  # Call VSAC API
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${VSAC_BASE_URL}/RetrieveValueSet?id=${OID}" \
    -H "Authorization: Bearer ${VSAC_API_KEY}" \
    -H "Accept: application/xml")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    # Save XML response
    OUTPUT_FILE="test-data/valuesets/${NAME}.xml"
    echo "$BODY" > "$OUTPUT_FILE"

    # Count concepts
    CONCEPT_COUNT=$(echo "$BODY" | grep -o "<Concept " | wc -l)
    echo -e "${GREEN}  ✓ Retrieved $CONCEPT_COUNT codes${NC}"
    echo "    Saved to: $OUTPUT_FILE"
  else
    echo -e "${RED}  ✗ Failed with HTTP $HTTP_CODE${NC}"
    if [ "$HTTP_CODE" = "401" ]; then
      echo "    Check your API key is valid"
    elif [ "$HTTP_CODE" = "404" ]; then
      echo "    ValueSet OID not found"
    fi
  fi
  echo
done

echo "=========================================="
echo -e "${GREEN}✅ ValueSet retrieval complete!${NC}"
echo "=========================================="
echo
echo "ValueSets saved to: test-data/valuesets/"
echo
echo "Next steps:"
echo "  1. Review retrieved ValueSets"
echo "  2. Load ValueSet expansions to Databricks"
echo "  3. Use codes in measure calculation queries"
