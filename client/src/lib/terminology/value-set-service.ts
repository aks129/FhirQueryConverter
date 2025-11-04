/**
 * Value Set Service
 * Manages value set expansions and terminology operations
 */

import { ValueSetReference, ValueSetExpansion, Coding } from './value-set-types';

export class ValueSetService {
  private expansions: Map<string, ValueSetExpansion> = new Map();

  /**
   * Register a value set expansion
   */
  registerExpansion(expansion: ValueSetExpansion): void {
    const key = this.getExpansionKey(expansion.valueSetUrl, expansion.version);
    this.expansions.set(key, expansion);
  }

  /**
   * Get expansion for a value set
   */
  getExpansion(url: string, version?: string): ValueSetExpansion | null {
    const key = this.getExpansionKey(url, version);
    return this.expansions.get(key) || null;
  }

  /**
   * Check if a code is in a value set
   */
  isMemberOf(coding: Coding, valueSetUrl: string, version?: string): boolean {
    const expansion = this.getExpansion(valueSetUrl, version);
    if (!expansion) {
      return false;
    }

    return expansion.contains.some(
      c => c.system === coding.system && c.code === coding.code
    );
  }

  /**
   * Get all codes in a value set
   */
  getCodes(url: string, version?: string): Coding[] {
    const expansion = this.getExpansion(url, version);
    return expansion?.contains || [];
  }

  /**
   * Load value set expansions from sample data
   */
  loadSampleExpansions(): void {
    // Register common value sets for testing
    this.registerExpansion({
      valueSetUrl: 'http://example.org/fhir/ValueSet/heart-rate-codes',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      total: 3,
      contains: [
        {
          system: 'http://loinc.org',
          code: '8867-4',
          display: 'Heart rate',
        },
        {
          system: 'http://snomed.info/sct',
          code: '364075005',
          display: 'Heart rate (observable entity)',
        },
        {
          system: 'http://loinc.org',
          code: '8893-0',
          display: 'Heart rate by Pulse oximetry',
        },
      ],
    });

    this.registerExpansion({
      valueSetUrl: 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.103.12.1001',
      version: '20210220',
      timestamp: new Date().toISOString(),
      total: 2,
      contains: [
        {
          system: 'http://snomed.info/sct',
          code: '44054006',
          display: 'Diabetes mellitus type 2 (disorder)',
        },
        {
          system: 'http://snomed.info/sct',
          code: '46635009',
          display: 'Diabetes mellitus type 1 (disorder)',
        },
      ],
    });

    this.registerExpansion({
      valueSetUrl: 'http://example.org/fhir/ValueSet/bmi-codes',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      total: 1,
      contains: [
        {
          system: 'http://loinc.org',
          code: '39156-5',
          display: 'Body mass index (BMI) [Ratio]',
        },
      ],
    });
  }

  private getExpansionKey(url: string, version?: string): string {
    return version ? `${url}|${version}` : url;
  }
}

// Singleton instance
export const valueSetService = new ValueSetService();

// Load sample data on module initialization
valueSetService.loadSampleExpansions();
