/**
 * Terminology Server Client
 *
 * Handles communication with FHIR terminology servers (TX.FHIR.ORG, VSAC, etc.)
 * for value set expansion, code system lookup, and code validation operations
 */

import { ValueSetExpansion } from '@/store/app-store';

export interface ValueSetExpandOptions {
  url: string;
  version?: string;
  filter?: string;
  count?: number;
  offset?: number;
  includeDesignations?: boolean;
}

export interface CodeSystemLookupOptions {
  system: string;
  code: string;
  version?: string;
  displayLanguage?: string;
}

export interface ValidateCodeOptions {
  url: string;
  code: string;
  system: string;
  display?: string;
  version?: string;
}

export interface TerminologyServerConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class TerminologyClient {
  private baseUrl: string;
  private timeout: number;
  private headers: Record<string, string>;

  constructor(config: TerminologyServerConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 30000;
    this.headers = config.headers || {
      'Content-Type': 'application/fhir+json',
      'Accept': 'application/fhir+json',
    };
  }

  /**
   * Test connection to terminology server
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/metadata`, {
        method: 'GET',
        headers: this.headers,
        signal: AbortSignal.timeout(this.timeout),
      });

      return response.ok;
    } catch (error) {
      console.error('Terminology server connection test failed:', error);
      return false;
    }
  }

  /**
   * Expand a value set to get all its codes
   * Uses the $expand operation
   */
  async expandValueSet(options: ValueSetExpandOptions): Promise<ValueSetExpansion> {
    const params = new URLSearchParams();
    params.append('url', options.url);

    if (options.version) params.append('version', options.version);
    if (options.filter) params.append('filter', options.filter);
    if (options.count) params.append('count', options.count.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.includeDesignations) params.append('includeDesignations', 'true');

    try {
      const response = await fetch(
        `${this.baseUrl}/ValueSet/$expand?${params.toString()}`,
        {
          method: 'GET',
          headers: this.headers,
          signal: AbortSignal.timeout(this.timeout),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to expand value set: ${response.statusText}`);
      }

      const valueSet = await response.json();

      // Extract expansion from FHIR ValueSet resource
      if (!valueSet.expansion || !valueSet.expansion.contains) {
        throw new Error('Value set expansion contains no codes');
      }

      const expansion: ValueSetExpansion = {
        url: options.url,
        version: options.version,
        contains: valueSet.expansion.contains.map((item: any) => ({
          system: item.system,
          code: item.code,
          display: item.display,
        })),
        count: valueSet.expansion.total || valueSet.expansion.contains.length,
      };

      return expansion;
    } catch (error) {
      console.error('Value set expansion failed:', error);
      throw error;
    }
  }

  /**
   * Look up details about a specific code
   * Uses the $lookup operation
   */
  async lookupCode(options: CodeSystemLookupOptions): Promise<{
    name: string;
    display?: string;
    designation?: Array<{ language: string; value: string }>;
    property?: Array<{ code: string; value: any }>;
  }> {
    const params = new URLSearchParams();
    params.append('system', options.system);
    params.append('code', options.code);

    if (options.version) params.append('version', options.version);
    if (options.displayLanguage) params.append('displayLanguage', options.displayLanguage);

    try {
      const response = await fetch(
        `${this.baseUrl}/CodeSystem/$lookup?${params.toString()}`,
        {
          method: 'GET',
          headers: this.headers,
          signal: AbortSignal.timeout(this.timeout),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to lookup code: ${response.statusText}`);
      }

      const parameters = await response.json();

      // Parse Parameters resource
      const result: any = {
        name: '',
        display: undefined,
        designation: [],
        property: [],
      };

      if (parameters.parameter) {
        for (const param of parameters.parameter) {
          if (param.name === 'name') {
            result.name = param.valueString;
          } else if (param.name === 'display') {
            result.display = param.valueString;
          } else if (param.name === 'designation') {
            const designation: any = {};
            if (param.part) {
              for (const part of param.part) {
                if (part.name === 'language') designation.language = part.valueCode;
                if (part.name === 'value') designation.value = part.valueString;
              }
            }
            result.designation.push(designation);
          } else if (param.name === 'property') {
            const property: any = {};
            if (param.part) {
              for (const part of param.part) {
                if (part.name === 'code') property.code = part.valueCode;
                if (part.name === 'value') {
                  // Extract value from any value[x] field
                  const valueKey = Object.keys(part).find(k => k.startsWith('value'));
                  if (valueKey) property.value = part[valueKey];
                }
              }
            }
            result.property.push(property);
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Code lookup failed:', error);
      throw error;
    }
  }

  /**
   * Validate if a code is in a value set
   * Uses the $validate-code operation
   */
  async validateCode(options: ValidateCodeOptions): Promise<{
    result: boolean;
    message?: string;
    display?: string;
  }> {
    const body: any = {
      resourceType: 'Parameters',
      parameter: [
        { name: 'url', valueUri: options.url },
        { name: 'code', valueCode: options.code },
        { name: 'system', valueUri: options.system },
      ],
    };

    if (options.display) {
      body.parameter.push({ name: 'display', valueString: options.display });
    }
    if (options.version) {
      body.parameter.push({ name: 'version', valueString: options.version });
    }

    try {
      const response = await fetch(`${this.baseUrl}/ValueSet/$validate-code`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Failed to validate code: ${response.statusText}`);
      }

      const parameters = await response.json();

      // Parse result from Parameters
      let result = false;
      let message: string | undefined;
      let display: string | undefined;

      if (parameters.parameter) {
        for (const param of parameters.parameter) {
          if (param.name === 'result') result = param.valueBoolean;
          if (param.name === 'message') message = param.valueString;
          if (param.name === 'display') display = param.valueString;
        }
      }

      return { result, message, display };
    } catch (error) {
      console.error('Code validation failed:', error);
      throw error;
    }
  }

  /**
   * Search for value sets on the terminology server
   */
  async searchValueSets(params?: {
    name?: string;
    url?: string;
    status?: string;
    _count?: number;
  }): Promise<Array<{ url: string; name: string; title?: string; version?: string }>> {
    const searchParams = new URLSearchParams();

    if (params?.name) searchParams.append('name', params.name);
    if (params?.url) searchParams.append('url', params.url);
    if (params?.status) searchParams.append('status', params.status);
    if (params?._count) searchParams.append('_count', params._count.toString());

    try {
      const response = await fetch(
        `${this.baseUrl}/ValueSet?${searchParams.toString()}`,
        {
          method: 'GET',
          headers: this.headers,
          signal: AbortSignal.timeout(this.timeout),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to search value sets: ${response.statusText}`);
      }

      const bundle = await response.json();

      if (!bundle.entry) {
        return [];
      }

      return bundle.entry.map((entry: any) => ({
        url: entry.resource.url,
        name: entry.resource.name,
        title: entry.resource.title,
        version: entry.resource.version,
      }));
    } catch (error) {
      console.error('Value set search failed:', error);
      throw error;
    }
  }
}
