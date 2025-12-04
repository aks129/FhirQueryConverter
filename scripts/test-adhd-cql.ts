/**
 * Test script to debug CQL to SQL conversion with ADHD measure
 */

import { CqlTokenizer } from '../client/src/lib/cql-parser/tokenizer';
import { CqlParser } from '../client/src/lib/cql-parser/parser';
import { AstToSqlTranspiler } from '../client/src/lib/cql-parser/ast-to-sql';

const adhdCql = `library ADHDMedicationMonitoring version '1.0.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1' called FHIRHelpers
include SupplementalDataElements version '2.0.0' called SDE

codesystem "LOINC": 'http://loinc.org'
codesystem "SNOMEDCT": 'http://snomed.info/sct'
codesystem "RxNorm": 'http://www.nlm.nih.gov/research/umls/rxnorm'

valueset "ADHD Medications": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.196.12.1171'
valueset "ADHD Diagnosis": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.105.12.1034'

parameter "Measurement Period" Interval<DateTime> default Interval[@2024-01-01T00:00:00.0, @2024-12-31T23:59:59.999]

context Patient

define "Initial Population":
  "Pediatric Patients Aged 6 to 17"
    and exists "ADHD Diagnosis During or Before Measurement Period"
    and exists "ADHD Medication Prescribed During Measurement Period"

define "Denominator":
  "Initial Population"

define "Numerator":
  exists "Follow Up Visit with Vital Signs Monitoring"

define "Pediatric Patients Aged 6 to 17":
  AgeInYearsAt(start of "Measurement Period") >= 6
    and AgeInYearsAt(start of "Measurement Period") <= 17
`;

console.log('=== Testing ADHD CQL Parsing ===\n');

try {
  // Step 1: Tokenize
  console.log('Step 1: Tokenizing...');
  const tokenizer = new CqlTokenizer(adhdCql);
  const tokens = tokenizer.tokenize();
  console.log(`  - Found ${tokens.length} tokens`);

  // Show first few tokens for debugging
  console.log('  - First 20 tokens:');
  tokens.slice(0, 20).forEach((t, i) => {
    console.log(`    ${i}: ${t.type} = "${t.value}" (line ${t.line})`);
  });

  // Step 2: Parse
  console.log('\nStep 2: Parsing...');
  const parser = new CqlParser();
  const ast = parser.parse(adhdCql);
  console.log(`  - Library: ${ast.identifier}`);
  console.log(`  - Version: ${ast.version}`);
  console.log(`  - Using: ${ast.using?.map(u => u.model).join(', ')}`);
  console.log(`  - Includes: ${ast.includes?.map(i => i.library).join(', ')}`);
  console.log(`  - Parameters: ${ast.parameters?.length}`);
  console.log(`  - Defines: ${ast.defines.length}`);

  ast.defines.forEach((d, i) => {
    console.log(`    ${i + 1}. "${d.name}" (${d.expression.type})`);
  });

  // Step 3: Transpile to SQL
  console.log('\nStep 3: Transpiling to SQL...');
  const transpiler = new AstToSqlTranspiler();
  const sql = transpiler.transpile(ast);

  console.log('\n=== Generated SQL ===');
  console.log(sql);

  console.log('\n=== Transpiler Logs ===');
  transpiler.getLogs().forEach(log => console.log(`  ${log}`));

  console.log('\n=== SUCCESS ===');
} catch (error) {
  console.error('\n=== ERROR ===');
  console.error(error);
}
