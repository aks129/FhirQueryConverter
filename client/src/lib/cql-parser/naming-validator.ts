/**
 * CQL Naming Convention Validator
 *
 * Enforces HL7 CQL naming conventions per implementation guide:
 * - http://hl7.org/fhir/us/cql/STU2/using-cql.html#naming-conventions
 *
 * Key Rules:
 * 1. Libraries: PascalCase (e.g., "MyLibrary")
 * 2. Definitions: PascalCase (e.g., "InInitialPopulation")
 * 3. Functions: PascalCase (e.g., "CalculateAge")
 * 4. Parameters: PascalCase (e.g., "MeasurementPeriod")
 * 5. Code Systems: PascalCase (e.g., "LOINC")
 * 6. Value Sets: PascalCase (e.g., "DiabetesCodes")
 * 7. Local variables: camelCase (e.g., "patientAge")
 */

export interface NamingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface NamingViolation {
  identifier: string;
  type: 'library' | 'definition' | 'function' | 'parameter' | 'codeSystem' | 'valueSet' | 'variable';
  violation: string;
  suggestion: string;
}

export class CqlNamingValidator {
  private violations: NamingViolation[] = [];

  /**
   * Check if a string follows PascalCase convention
   */
  private isPascalCase(str: string): boolean {
    // PascalCase: starts with uppercase, may contain uppercase letters mid-word
    // Examples: Patient, InInitialPopulation, AgeInYears
    return /^[A-Z][a-zA-Z0-9]*$/.test(str) && /[A-Z]/.test(str[0]);
  }

  /**
   * Check if a string follows camelCase convention
   */
  private isCamelCase(str: string): boolean {
    // camelCase: starts with lowercase, may contain uppercase letters mid-word
    // Examples: patient, patientAge, myVariable
    return /^[a-z][a-zA-Z0-9]*$/.test(str) && /[a-z]/.test(str[0]);
  }

  /**
   * Convert string to PascalCase suggestion
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[a-z]/, chr => chr.toUpperCase());
  }

  /**
   * Convert string to camelCase suggestion
   */
  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  /**
   * Validate library name
   */
  validateLibrary(name: string): void {
    if (!this.isPascalCase(name)) {
      this.violations.push({
        identifier: name,
        type: 'library',
        violation: 'Library names must use PascalCase',
        suggestion: this.toPascalCase(name)
      });
    }
  }

  /**
   * Validate definition name (define statement)
   */
  validateDefinition(name: string): void {
    if (!this.isPascalCase(name)) {
      this.violations.push({
        identifier: name,
        type: 'definition',
        violation: 'Definition names must use PascalCase',
        suggestion: this.toPascalCase(name)
      });
    }

    // Additional check: avoid generic names
    const genericNames = ['result', 'query', 'data', 'list'];
    if (genericNames.includes(name.toLowerCase())) {
      this.violations.push({
        identifier: name,
        type: 'definition',
        violation: 'Avoid generic definition names',
        suggestion: 'Use descriptive names like "PatientsWithDiabetes" instead of "Result"'
      });
    }
  }

  /**
   * Validate function name
   */
  validateFunction(name: string): void {
    if (!this.isPascalCase(name)) {
      this.violations.push({
        identifier: name,
        type: 'function',
        violation: 'Function names must use PascalCase',
        suggestion: this.toPascalCase(name)
      });
    }
  }

  /**
   * Validate parameter name
   */
  validateParameter(name: string): void {
    if (!this.isPascalCase(name)) {
      this.violations.push({
        identifier: name,
        type: 'parameter',
        violation: 'Parameter names must use PascalCase',
        suggestion: this.toPascalCase(name)
      });
    }
  }

  /**
   * Validate code system name
   */
  validateCodeSystem(name: string): void {
    if (!this.isPascalCase(name)) {
      this.violations.push({
        identifier: name,
        type: 'codeSystem',
        violation: 'Code system names must use PascalCase',
        suggestion: this.toPascalCase(name)
      });
    }
  }

  /**
   * Validate value set name
   */
  validateValueSet(name: string): void {
    if (!this.isPascalCase(name)) {
      this.violations.push({
        identifier: name,
        type: 'valueSet',
        violation: 'Value set names must use PascalCase',
        suggestion: this.toPascalCase(name)
      });
    }
  }

  /**
   * Validate local variable name (should be camelCase)
   */
  validateVariable(name: string): void {
    if (!this.isCamelCase(name)) {
      this.violations.push({
        identifier: name,
        type: 'variable',
        violation: 'Local variable names should use camelCase',
        suggestion: this.toCamelCase(name)
      });
    }
  }

  /**
   * Get all violations
   */
  getViolations(): NamingViolation[] {
    return this.violations;
  }

  /**
   * Check if there are any violations
   */
  hasViolations(): boolean {
    return this.violations.length > 0;
  }

  /**
   * Get validation result
   */
  getResult(): NamingValidationResult {
    const errors = this.violations
      .filter(v => v.type !== 'variable') // Variables are warnings
      .map(v => `${v.type} "${v.identifier}": ${v.violation} (suggest: ${v.suggestion})`);

    const warnings = this.violations
      .filter(v => v.type === 'variable')
      .map(v => `${v.type} "${v.identifier}": ${v.violation} (suggest: ${v.suggestion})`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Clear all violations
   */
  clear(): void {
    this.violations = [];
  }

  /**
   * Format violations as readable text
   */
  formatViolations(): string {
    if (this.violations.length === 0) {
      return 'No naming convention violations found.';
    }

    const lines: string[] = ['CQL Naming Convention Violations:', ''];

    const errorViolations = this.violations.filter(v => v.type !== 'variable');
    const warningViolations = this.violations.filter(v => v.type === 'variable');

    if (errorViolations.length > 0) {
      lines.push('ERRORS:');
      errorViolations.forEach(v => {
        lines.push(`  - ${v.type} "${v.identifier}"`);
        lines.push(`    ${v.violation}`);
        lines.push(`    Suggestion: ${v.suggestion}`);
      });
      lines.push('');
    }

    if (warningViolations.length > 0) {
      lines.push('WARNINGS:');
      warningViolations.forEach(v => {
        lines.push(`  - ${v.type} "${v.identifier}"`);
        lines.push(`    ${v.violation}`);
        lines.push(`    Suggestion: ${v.suggestion}`);
      });
    }

    return lines.join('\n');
  }
}

/**
 * Utility function to validate a complete CQL statement
 */
export function validateCqlNaming(cqlText: string): NamingValidationResult {
  const validator = new CqlNamingValidator();

  // Extract library name
  const libraryMatch = cqlText.match(/library\s+(\w+)/i);
  if (libraryMatch) {
    validator.validateLibrary(libraryMatch[1]);
  }

  // Extract definitions
  const defineMatches = Array.from(cqlText.matchAll(/define\s+"?(\w+)"?:/gi));
  for (const match of defineMatches) {
    validator.validateDefinition(match[1]);
  }

  // Extract parameters
  const paramMatches = Array.from(cqlText.matchAll(/parameter\s+"?(\w+)"?\s+/gi));
  for (const match of paramMatches) {
    validator.validateParameter(match[1]);
  }

  // Extract code systems
  const codeSystemMatches = Array.from(cqlText.matchAll(/codesystem\s+"?(\w+)"?:/gi));
  for (const match of codeSystemMatches) {
    validator.validateCodeSystem(match[1]);
  }

  // Extract value sets
  const valueSetMatches = Array.from(cqlText.matchAll(/valueset\s+"?(\w+)"?:/gi));
  for (const match of valueSetMatches) {
    validator.validateValueSet(match[1]);
  }

  return validator.getResult();
}
