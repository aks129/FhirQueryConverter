#!/bin/bash

# Load Test Data to Medplum FHIR Server
# Usage: ./scripts/load-test-data.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  Load Test Data to Medplum"
echo "=========================================="
echo

# Configuration from environment variables or E2E config
MEDPLUM_BASE_URL="${MEDPLUM_BASE_URL:-https://api.medplum.com}"
MEDPLUM_CLIENT_ID="${MEDPLUM_CLIENT_ID}"
MEDPLUM_CLIENT_SECRET="${MEDPLUM_CLIENT_SECRET}"

# Check required variables
if [ -z "$MEDPLUM_CLIENT_ID" ] || [ -z "$MEDPLUM_CLIENT_SECRET" ]; then
  echo -e "${RED}ERROR: Missing required environment variables${NC}"
  echo "Please set:"
  echo "  export MEDPLUM_CLIENT_ID='your-client-id'"
  echo "  export MEDPLUM_CLIENT_SECRET='your-client-secret'"
  echo
  echo "Get credentials from:"
  echo "  1. Log in to https://app.medplum.com"
  echo "  2. Go to Project Settings → Clients"
  echo "  3. Create New Client (grant type: client_credentials)"
  exit 1
fi

# Step 1: Get access token
echo "📡 Getting access token..."
TOKEN_RESPONSE=$(curl -s -X POST "${MEDPLUM_BASE_URL}/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=${MEDPLUM_CLIENT_ID}" \
  -d "client_secret=${MEDPLUM_CLIENT_SECRET}")

ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}✗ Failed to get access token${NC}"
  echo "Response:"
  echo "$TOKEN_RESPONSE" | jq '.'
  exit 1
fi

echo -e "${GREEN}✓ Access token obtained${NC}"
echo

# Step 2: Load test data bundle
echo "📦 Loading test patient bundle..."
BUNDLE_FILE="test-data/patient-001-bundle.json"

if [ ! -f "$BUNDLE_FILE" ]; then
  echo -e "${RED}✗ Bundle file not found: $BUNDLE_FILE${NC}"
  exit 1
fi

RESPONSE=$(curl -s -X POST "${MEDPLUM_BASE_URL}/fhir/R4" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/fhir+json" \
  -d @"$BUNDLE_FILE")

# Check for errors
if echo "$RESPONSE" | jq -e '.resourceType == "OperationOutcome"' > /dev/null 2>&1; then
  SEVERITY=$(echo "$RESPONSE" | jq -r '.issue[0].severity')
  if [ "$SEVERITY" = "error" ] || [ "$SEVERITY" = "fatal" ]; then
    echo -e "${RED}✗ Failed to load bundle${NC}"
    echo "$RESPONSE" | jq '.'
    exit 1
  fi
fi

echo -e "${GREEN}✓ Test data bundle loaded successfully${NC}"
echo

# Step 3: Verify resources
echo "🔍 Verifying loaded resources..."
echo

# Verify Patient
echo "  Checking Patient/test-patient-001..."
PATIENT=$(curl -s "${MEDPLUM_BASE_URL}/fhir/R4/Patient/test-patient-001" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$PATIENT" | jq -e '.resourceType == "Patient"' > /dev/null 2>&1; then
  PATIENT_NAME=$(echo "$PATIENT" | jq -r '.name[0].given[0] + " " + .name[0].family')
  PATIENT_GENDER=$(echo "$PATIENT" | jq -r '.gender')
  PATIENT_BIRTHDATE=$(echo "$PATIENT" | jq -r '.birthDate')
  echo -e "${GREEN}  ✓ Patient found: $PATIENT_NAME ($PATIENT_GENDER, born $PATIENT_BIRTHDATE)${NC}"
else
  echo -e "${RED}  ✗ Patient not found${NC}"
fi

# Verify Encounter
echo "  Checking Encounter/encounter-001..."
ENCOUNTER=$(curl -s "${MEDPLUM_BASE_URL}/fhir/R4/Encounter/encounter-001" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$ENCOUNTER" | jq -e '.resourceType == "Encounter"' > /dev/null 2>&1; then
  ENCOUNTER_TYPE=$(echo "$ENCOUNTER" | jq -r '.type[0].coding[0].display')
  ENCOUNTER_DATE=$(echo "$ENCOUNTER" | jq -r '.period.start')
  echo -e "${GREEN}  ✓ Encounter found: $ENCOUNTER_TYPE on $ENCOUNTER_DATE${NC}"
else
  echo -e "${RED}  ✗ Encounter not found${NC}"
fi

# Verify Observation
echo "  Checking Observation/mammography-001..."
OBSERVATION=$(curl -s "${MEDPLUM_BASE_URL}/fhir/R4/Observation/mammography-001" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$OBSERVATION" | jq -e '.resourceType == "Observation"' > /dev/null 2>&1; then
  OBS_CODE=$(echo "$OBSERVATION" | jq -r '.code.coding[0].display')
  OBS_DATE=$(echo "$OBSERVATION" | jq -r '.effectiveDateTime')
  echo -e "${GREEN}  ✓ Observation found: $OBS_CODE on $OBS_DATE${NC}"
else
  echo -e "${RED}  ✗ Observation not found${NC}"
fi

# Verify Coverage
echo "  Checking Coverage/coverage-001..."
COVERAGE=$(curl -s "${MEDPLUM_BASE_URL}/fhir/R4/Coverage/coverage-001" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

if echo "$COVERAGE" | jq -e '.resourceType == "Coverage"' > /dev/null 2>&1; then
  PAYOR=$(echo "$COVERAGE" | jq -r '.payor[0].display')
  echo -e "${GREEN}  ✓ Coverage found: $PAYOR${NC}"
else
  echo -e "${RED}  ✗ Coverage not found${NC}"
fi

echo
echo "=========================================="
echo -e "${GREEN}✅ Test data loaded successfully!${NC}"
echo "=========================================="
echo
echo "Resources created:"
echo "  - Patient/test-patient-001"
echo "  - Encounter/encounter-001"
echo "  - Observation/mammography-001"
echo "  - Coverage/coverage-001"
echo
echo "Next steps:"
echo "  1. Retrieve ValueSets: ./scripts/retrieve-valuesets.sh"
echo "  2. Set up Databricks tables"
echo "  3. Run ETL pipeline: ./scripts/etl-simple.sh"
