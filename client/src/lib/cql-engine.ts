import { FhirBundle, MeasureReport, ExecutionResult, LogEntry } from "@/types/fhir";

/**
 * Simplified CQL evaluation engine for POC purposes
 * In a production system, this would use the actual cql-execution library
 */
export class CqlEngine {
  private logs: LogEntry[] = [];
  private startTime: number = 0;

  private addLog(level: LogEntry['level'], message: string) {
    this.logs.push({
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        fractionalSecondDigits: 3 
      }),
      level,
      message
    });
  }

  async evaluateCql(cqlCode: string, fhirBundle: FhirBundle): Promise<ExecutionResult> {
    this.logs = [];
    this.startTime = performance.now();

    try {
      this.addLog('INFO', 'Starting CQL evaluation');
      
      // Validate inputs
      if (!cqlCode.trim()) {
        throw new Error('CQL code is required');
      }

      if (!fhirBundle.entry || fhirBundle.entry.length === 0) {
        throw new Error('FHIR bundle is empty');
      }

      this.addLog('INFO', `Loaded FHIR bundle with ${fhirBundle.entry.length} resources`);

      // Parse CQL for basic define statements
      const defineStatements = this.parseCqlDefines(cqlCode);
      this.addLog('INFO', `Found ${defineStatements.length} define statements`);

      // Execute each define statement
      const results: { [key: string]: any[] } = {};
      
      for (const define of defineStatements) {
        this.addLog('INFO', `Executing define statement: "${define.name}"`);
        const result = await this.executeDefine(define, fhirBundle, results);
        results[define.name] = result;
        this.addLog('SUCCESS', `${define.name}: ${result.length} patients identified`);
      }

      // Generate MeasureReport
      const measureReport = this.generateMeasureReport(results);
      
      const executionTime = performance.now() - this.startTime;
      this.addLog('SUCCESS', `CQL evaluation completed successfully`);

      return {
        measureReport,
        executionTime: Math.round(executionTime),
        memoryUsage: this.estimateMemoryUsage(fhirBundle),
        logs: this.logs
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addLog('ERROR', `CQL evaluation failed: ${errorMessage}`);
      throw error;
    }
  }

  private parseCqlDefines(cqlCode: string): Array<{ name: string; expression: string }> {
    const defines: Array<{ name: string; expression: string }> = [];
    const lines = cqlCode.split('\n');
    
    let currentDefine: { name: string; expression: string } | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('define ')) {
        // Save previous define if exists
        if (currentDefine) {
          defines.push(currentDefine);
        }
        
        // Start new define
        const match = trimmed.match(/define\s+"([^"]+)"\s*:\s*(.*)/);
        if (match) {
          currentDefine = {
            name: match[1],
            expression: match[2] || ''
          };
        }
      } else if (currentDefine && trimmed && !trimmed.startsWith('//')) {
        // Continue expression
        currentDefine.expression += ' ' + trimmed;
      }
    }
    
    // Add last define
    if (currentDefine) {
      defines.push(currentDefine);
    }
    
    return defines;
  }

  private async executeDefine(
    define: { name: string; expression: string }, 
    fhirBundle: FhirBundle, 
    previousResults: { [key: string]: any[] }
  ): Promise<any[]> {
    
    // Handle reference to previous define
    if (previousResults[define.expression.trim().replace(/"/g, '')]) {
      return previousResults[define.expression.trim().replace(/"/g, '')];
    }

    // Simple pattern matching for common CQL patterns
    if (define.expression.includes('[Patient]')) {
      return this.executePatientQuery(define.expression, fhirBundle);
    }
    
    if (define.expression.includes('with [Observation')) {
      const denominator = previousResults['Denominator'] || previousResults['Initial Population'] || [];
      return this.executeObservationQuery(define.expression, fhirBundle, denominator);
    }

    // Default: return empty array
    return [];
  }

  private executePatientQuery(expression: string, fhirBundle: FhirBundle): any[] {
    const patients = fhirBundle.entry?.filter(e => e.resource.resourceType === 'Patient') || [];
    
    let filteredPatients = patients.map(e => e.resource);

    // Check for gender filter
    if (expression.includes("gender = 'female'")) {
      filteredPatients = filteredPatients.filter(p => p.gender === 'female');
    } else if (expression.includes("gender = 'male'")) {
      filteredPatients = filteredPatients.filter(p => p.gender === 'male');
    }

    // Check for age filter
    if (expression.includes('AgeInYearsAt') && expression.includes('>= 18')) {
      const currentYear = new Date().getFullYear();
      filteredPatients = filteredPatients.filter(p => {
        if (p.birthDate) {
          const age = currentYear - new Date(p.birthDate).getFullYear();
          return age >= 18;
        }
        return false;
      });
    }

    return filteredPatients;
  }

  private executeObservationQuery(expression: string, fhirBundle: FhirBundle, denominatorPatients: any[]): any[] {
    const observations = fhirBundle.entry?.filter(e => e.resource.resourceType === 'Observation') || [];
    const patientIds = denominatorPatients.map(p => p.id);

    let qualifyingPatients: string[] = [];

    // Filter observations for patients in denominator
    const relevantObs = observations.filter(e => {
      const obs = e.resource;
      const patientId = obs.subject?.reference?.replace('Patient/', '');
      return patientIds.includes(patientId);
    });

    // Check for Heart Rate observations
    if (expression.includes('Heart Rate') || expression.includes('8867-4')) {
      const heartRateObs = relevantObs.filter(e => {
        const obs = e.resource;
        return obs.code?.text?.includes('Heart Rate') || 
               obs.code?.coding?.some((c: any) => c.code === '8867-4');
      });

      // Check for value condition
      if (expression.includes('> 100')) {
        qualifyingPatients = heartRateObs
          .filter(e => e.resource.valueQuantity?.value > 100)
          .map(e => e.resource.subject.reference.replace('Patient/', ''));
      } else {
        qualifyingPatients = heartRateObs
          .map(e => e.resource.subject.reference.replace('Patient/', ''));
      }
    }

    // Return patients that meet criteria
    return denominatorPatients.filter(p => qualifyingPatients.includes(p.id));
  }

  private generateMeasureReport(results: { [key: string]: any[] }): MeasureReport {
    const reportId = `cql-measure-report-${Date.now()}`;
    
    return {
      resourceType: "MeasureReport",
      id: reportId,
      status: "complete",
      type: "summary",
      measure: "http://example.org/measures/cql-evaluation",
      date: new Date().toISOString(),
      reporter: {
        reference: "Organization/cql-evaluator"
      },
      period: {
        start: "2024-01-01",
        end: "2024-12-31"
      },
      group: [
        {
          id: "main-population",
          population: [
            {
              code: {
                coding: [
                  {
                    system: "http://terminology.hl7.org/CodeSystem/measure-population",
                    code: "initial-population"
                  }
                ]
              },
              count: results["Initial Population"]?.length || 0
            },
            {
              code: {
                coding: [
                  {
                    system: "http://terminology.hl7.org/CodeSystem/measure-population",
                    code: "denominator"
                  }
                ]
              },
              count: results["Denominator"]?.length || 0
            },
            {
              code: {
                coding: [
                  {
                    system: "http://terminology.hl7.org/CodeSystem/measure-population",
                    code: "numerator"
                  }
                ]
              },
              count: results["Numerator"]?.length || 0
            }
          ]
        }
      ]
    };
  }

  private estimateMemoryUsage(fhirBundle: FhirBundle): number {
    // Rough estimate in MB
    const bundleSize = JSON.stringify(fhirBundle).length;
    return Math.round((bundleSize / 1024 / 1024) * 100) / 100;
  }
}
