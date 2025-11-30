/**
 * Firemetrics MCP Client for Frontend
 *
 * Provides a clean API to interact with Firemetrics via MCP protocol
 */

export interface FiremetricsConfig {
  mcpUrl: string;
  apiKey: string;
}

export interface FiremetricsToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  metadata?: Record<string, unknown>;
}

export interface FhirPathProperty {
  path: string[];
  alias?: string;
}

export class FiremetricsClient {
  private config: FiremetricsConfig;

  constructor(config: FiremetricsConfig) {
    this.config = config;
  }

  private async callMcpTool(toolName: string, args: Record<string, unknown> = {}): Promise<FiremetricsToolResult> {
    const response = await fetch(this.config.mcpUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`Firemetrics Error: ${data.error.message}`);
    }

    return data.result;
  }

  private parseResult(result: FiremetricsToolResult): unknown {
    if (result?.content?.[0]) {
      const text = result.content[0].text;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
    return null;
  }

  /**
   * Test connection to Firemetrics
   */
  async testConnection(): Promise<{ success: boolean; serverInfo?: unknown; error?: string }> {
    try {
      const response = await fetch(this.config.mcpUrl, {
        method: 'POST',
        headers: {
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'fhir-query-converter-ui', version: '1.0.0' }
          }
        }),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      if (data.result?.serverInfo) {
        return { success: true, serverInfo: data.result.serverInfo };
      }
      return { success: false, error: 'No server info returned' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get system info
   */
  async getSystemInfo(): Promise<unknown> {
    const result = await this.callMcpTool('fmx_info');
    return this.parseResult(result);
  }

  /**
   * Get FHIR version
   */
  async getFhirVersion(): Promise<string> {
    const result = await this.callMcpTool('fmx_fhir_version');
    return String(this.parseResult(result));
  }

  /**
   * Get resource counts
   */
  async getResourceCounts(minCount = 0): Promise<unknown> {
    const result = await this.callMcpTool('fmx_resource_counts', { min_count: minCount });
    return this.parseResult(result);
  }

  /**
   * List available FHIR resources
   */
  async listFhirResources(): Promise<unknown> {
    const result = await this.callMcpTool('fmx_fhir_resources');
    return this.parseResult(result);
  }

  /**
   * Get table structure
   */
  async getTableStructure(tableName: string): Promise<unknown> {
    const result = await this.callMcpTool('fmx_table_structure', { table_name: tableName });
    return this.parseResult(result);
  }

  /**
   * Generate SQL query from FHIR paths
   */
  async generateSqlFromFhirPaths(
    resourceName: string,
    properties: FhirPathProperty[]
  ): Promise<string> {
    const result = await this.callMcpTool('fhir_path_joiner', {
      resource_name: resourceName,
      properties: properties
    });
    return String(this.parseResult(result));
  }

  /**
   * Search LOINC codes
   */
  async searchLoinc(query: string): Promise<unknown> {
    const result = await this.callMcpTool('loinc_search', { query });
    return this.parseResult(result);
  }

  /**
   * Search FHIR ValueSets
   */
  async searchValueSets(searchTerm: string): Promise<unknown> {
    const result = await this.callMcpTool('fhir_valueset_search', { search_term: searchTerm });
    return this.parseResult(result);
  }

  /**
   * Search FHIR elements
   */
  async searchFhirElements(query: string, resourceType?: string): Promise<unknown> {
    const result = await this.callMcpTool('fhir_element_search', {
      query,
      resource_type: resourceType
    });
    return this.parseResult(result);
  }

  /**
   * List all tables
   */
  async listTables(): Promise<unknown> {
    const result = await this.callMcpTool('fmx_tables');
    return this.parseResult(result);
  }
}

// Singleton instance for easy use
let clientInstance: FiremetricsClient | null = null;

export function getFiremetricsClient(): FiremetricsClient | null {
  return clientInstance;
}

export function initFiremetricsClient(config: FiremetricsConfig): FiremetricsClient {
  clientInstance = new FiremetricsClient(config);
  return clientInstance;
}
