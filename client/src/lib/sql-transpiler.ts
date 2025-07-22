import { FhirBundle, MeasureReport, SqlExecutionResult, LogEntry } from "@/types/fhir";
import { flattenBundleToViews } from "./fhir-utils";

interface SqlDatabase {
  exec(sql: string): Array<{ columns: string[]; values: any[][] }>;
}

/**
 * CQL to SQL transpiler for SQL on FHIR evaluation
 */
export class SqlTranspiler {
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

  async convertAndEvaluate(cqlCode: string, fhirBundle: FhirBundle): Promise<SqlExecutionResult> {
    this.logs = [];
    this.startTime = performance.now();

    try {
      this.addLog('INFO', 'Starting CQL to SQL conversion');

      // Parse CQL define statements
      const defineStatements = this.parseCqlDefines(cqlCode);
      this.addLog('INFO', 'Parsing CQL define statements');

      // Convert to SQL
      const sql = this.convertToSql(defineStatements);
      this.addLog('SUCCESS', `SQL conversion completed (${Math.round(performance.now() - this.startTime)}ms)`);

      // Execute SQL
      this.addLog('INFO', 'Executing SQL query against flattened views');
      const sqlStartTime = performance.now();
      
      const results = await this.executeSql(sql, fhirBundle);
      const sqlExecutionTime = Math.round(performance.now() - sqlStartTime);
      
      this.addLog('SUCCESS', `SQL execution completed (${sqlExecutionTime}ms)`);

      // Generate MeasureReport
      const measureReport = this.generateMeasureReportFromSql(results);
      this.addLog('SUCCESS', 'Generated MeasureReport from SQL results');

      const totalTime = Math.round(performance.now() - this.startTime);

      return {
        measureReport,
        generatedSql: sql,
        executionTime: totalTime,
        logs: this.logs
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addLog('ERROR', `SQL conversion/execution failed: ${errorMessage}`);
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
        if (currentDefine) {
          defines.push(currentDefine);
        }
        
        const match = trimmed.match(/define\s+"([^"]+)"\s*:\s*(.*)/);
        if (match) {
          currentDefine = {
            name: match[1],
            expression: match[2] || ''
          };
        }
      } else if (currentDefine && trimmed && !trimmed.startsWith('//')) {
        currentDefine.expression += ' ' + trimmed;
      }
    }
    
    if (currentDefine) {
      defines.push(currentDefine);
    }
    
    return defines;
  }

  private convertToSql(defineStatements: Array<{ name: string; expression: string }>): string {
    const ctes: string[] = [];
    
    for (const define of defineStatements) {
      this.addLog('INFO', `Converting "${define.name}" to SQL CTE`);
      
      if (define.name === 'Initial Population') {
        ctes.push(this.convertInitialPopulation(define.expression));
      } else if (define.name === 'Denominator') {
        ctes.push(this.convertDenominator(define.expression));
      } else if (define.name === 'Numerator') {
        ctes.push(this.convertNumerator(define.expression));
      }
    }

    const finalQuery = `
SELECT 
  (SELECT COUNT(*) FROM InitialPopulation) AS initial_population_count,
  (SELECT COUNT(*) FROM Denominator) AS denominator_count,
  (SELECT COUNT(*) FROM Numerator) AS numerator_count`;

    return `WITH ${ctes.join(',\n')}\n${finalQuery}`;
  }

  private convertInitialPopulation(expression: string): string {
    let sql = `InitialPopulation AS (\n  SELECT p.id AS patient_id\n  FROM Patient_view p\n  WHERE 1=1`;

    if (expression.includes("gender = 'female'")) {
      sql += `\n    AND p.gender = 'female'`;
    } else if (expression.includes("gender = 'male'")) {
      sql += `\n    AND p.gender = 'male'`;
    }

    if (expression.includes('AgeInYearsAt') && expression.includes('>= 18')) {
      sql += `\n    AND p.age >= 18`;
    }

    sql += '\n)';
    return sql;
  }

  private convertDenominator(expression: string): string {
    if (expression.trim().replace(/"/g, '') === 'Initial Population') {
      return `Denominator AS (\n  SELECT patient_id FROM InitialPopulation\n)`;
    }
    return `Denominator AS (\n  SELECT patient_id FROM InitialPopulation\n)`;
  }

  private convertNumerator(expression: string): string {
    let sql = `Numerator AS (\n  SELECT DISTINCT d.patient_id\n  FROM Denominator d`;

    if (expression.includes('[Observation') && expression.includes('Heart Rate')) {
      sql += `\n  JOIN Observation_view o ON o.subject_id = d.patient_id`;
      sql += `\n  WHERE o.code_text LIKE '%Heart Rate%'`;
      
      if (expression.includes('during "Measurement Period"')) {
        sql += `\n    AND o.effective_datetime BETWEEN '2024-01-01' AND '2024-12-31'`;
      }
      
      if (expression.includes('> 100')) {
        sql += `\n    AND o.value_quantity > 100`;
      }
    }

    sql += '\n)';
    return sql;
  }

  private async executeSql(sql: string, fhirBundle: FhirBundle): Promise<{ [key: string]: number }> {
    // Flatten FHIR bundle to SQL views
    const views = flattenBundleToViews(fhirBundle);

    // Create in-memory database (simulation for POC)
    const db = await this.createInMemoryDatabase(views);

    try {
      const result = db.exec(sql);
      
      if (result.length === 0 || result[0].values.length === 0) {
        throw new Error('SQL query returned no results');
      }

      const [row] = result[0].values;
      return {
        initial_population_count: row[0] || 0,
        denominator_count: row[1] || 0,
        numerator_count: row[2] || 0
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`SQL execution failed: ${errorMessage}`);
    }
  }

  private async createInMemoryDatabase(views: any): Promise<SqlDatabase> {
    // For POC purposes, simulate SQL execution with in-memory JavaScript operations
    // In a real implementation, this would use sql.js or similar
    
    return {
      exec: (sql: string) => {
        // Parse the SQL and execute against the views
        const results = this.simulateSqlExecution(sql, views);
        
        return [{
          columns: ['initial_population_count', 'denominator_count', 'numerator_count'],
          values: [results]
        }];
      }
    };
  }

  private simulateSqlExecution(sql: string, views: any): number[] {
    // Simulate SQL execution for POC
    let initialPop = views.patients.length;
    let denominator = initialPop;
    let numerator = 0;

    // Apply gender filter if present
    if (sql.includes("gender = 'female'")) {
      initialPop = views.patients.filter((p: any) => p.gender === 'female').length;
      denominator = initialPop;
    }

    // Apply age filter if present
    if (sql.includes('age >= 18')) {
      const filtered = views.patients.filter((p: any) => (p.age || 0) >= 18);
      if (sql.includes("gender = 'female'")) {
        initialPop = filtered.filter((p: any) => p.gender === 'female').length;
      } else {
        initialPop = filtered.length;
      }
      denominator = initialPop;
    }

    // Apply observation criteria for numerator
    if (sql.includes('Heart Rate') && sql.includes('value_quantity > 100')) {
      const heartRateObs = views.observations.filter((o: any) => 
        o.code_text?.includes('Heart Rate') && (o.value_quantity || 0) > 100
      );
      const qualifyingPatients = new Set(heartRateObs.map((o: any) => o.subject_id));
      
      // Count patients in denominator who have qualifying observations
      let eligiblePatients = views.patients;
      if (sql.includes("gender = 'female'")) {
        eligiblePatients = eligiblePatients.filter((p: any) => p.gender === 'female');
      }
      if (sql.includes('age >= 18')) {
        eligiblePatients = eligiblePatients.filter((p: any) => (p.age || 0) >= 18);
      }
      
      numerator = eligiblePatients.filter((p: any) => qualifyingPatients.has(p.id)).length;
    }

    return [initialPop, denominator, numerator];
  }

  private generateMeasureReportFromSql(results: { [key: string]: number }): MeasureReport {
    const reportId = `sql-measure-report-${Date.now()}`;
    
    return {
      resourceType: "MeasureReport",
      id: reportId,
      status: "complete",
      type: "summary",
      measure: "http://example.org/measures/sql-on-fhir-evaluation",
      date: new Date().toISOString(),
      reporter: {
        reference: "Organization/sql-transpiler"
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
              count: results.initial_population_count
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
              count: results.denominator_count
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
              count: results.numerator_count
            }
          ]
        }
      ]
    };
  }
}
