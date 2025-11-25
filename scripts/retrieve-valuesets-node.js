#!/usr/bin/env node

/**
 * Retrieve ValueSets from NLM VSAC
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VSAC_API_KEY = process.env.VSAC_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '..', 'test-data', 'valuesets');

// ValueSets for CMS125
const VALUESETS = [
  {
    oid: '2.16.840.1.113883.3.464.1003.198.12.1011',
    name: 'Mammography'
  },
  {
    oid: '2.16.840.1.113883.3.526.3.1285',
    name: 'BilateralMastectomy'
  },
  {
    oid: '2.16.840.1.113883.3.464.1003.101.12.1061',
    name: 'PatientCharacteristicPayer'
  }
];

async function main() {
  console.log('==========================================');
  console.log('  Retrieve ValueSets from NLM VSAC');
  console.log('==========================================\n');

  if (!VSAC_API_KEY) {
    console.error('❌ ERROR: Missing VSAC_API_KEY environment variable');
    console.error('Get your API key from: https://uts.nlm.nih.gov/uts/');
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('📋 ValueSets to retrieve:');
  VALUESETS.forEach(vs => {
    console.log(`  - ${vs.name}: ${vs.oid}`);
  });
  console.log();

  for (const valueset of VALUESETS) {
    console.log(`📥 Retrieving ${valueset.name} (${valueset.oid})...`);

    try {
      const url = `https://cts.nlm.nih.gov/fhir/ValueSet/\${valueset.oid}/\$expand`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${VSAC_API_KEY}`,
          'Accept': 'application/fhir+json',
        },
      });

      if (!response.ok) {
        console.log(`  ⚠️  HTTP ${response.status}: ${response.statusText}`);

        // Try alternate endpoint
        const altUrl = `https://vsac.nlm.nih.gov/vsac/svs/RetrieveValueSet?id=${valueset.oid}`;
        console.log(`  Trying alternate endpoint...`);

        const altResponse = await fetch(altUrl, {
          headers: {
            'Authorization': `Bearer ${VSAC_API_KEY}`,
            'Accept': 'application/xml',
          },
        });

        if (altResponse.ok) {
          const xmlData = await altResponse.text();
          const outputPath = path.join(OUTPUT_DIR, `${valueset.name}.xml`);
          fs.writeFileSync(outputPath, xmlData);

          // Count concepts (rough estimate from XML)
          const conceptMatches = xmlData.match(/<concept/g);
          const conceptCount = conceptMatches ? conceptMatches.length : 0;

          console.log(`  ✓ Retrieved ${conceptCount} codes`);
          console.log(`    Saved to: ${outputPath}\n`);
        } else {
          console.log(`  ❌ Failed: ${altResponse.status} ${altResponse.statusText}\n`);
        }
      } else {
        const data = await response.json();
        const outputPath = path.join(OUTPUT_DIR, `${valueset.name}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

        const conceptCount = data.expansion?.contains?.length || 0;
        console.log(`  ✓ Retrieved ${conceptCount} codes`);
        console.log(`    Saved to: ${outputPath}\n`);
      }

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }

  console.log('==========================================');
  console.log('✅ ValueSet retrieval complete!');
  console.log('==========================================\n');
}

main().catch(console.error);
