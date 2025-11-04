import { FhirBundle, MeasureReport, SqlExecutionResult, LogEntry } from "@/types/fhir";
import { flattenBundleToViews } from "./fhir-utils";
import initSqlJs, { Database } from "sql.js";

interface SqlDatabase {
  exec(sql: string): Array<{ columns: string[]; values: any[][] }>;
  close(): void;
}

/**
 * Enhanced CQL to SQL transpiler for SQL on FHIR evaluation
 * Incorporates concepts from the VA CQL transpiler project
 * Supports more sophisticated CQL parsing and SQL generation
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
    
    // Add base views as CTEs following SQL on FHIR patterns
    ctes.push(this.generateBaseFhirViews());
    
    for (const define of defineStatements) {
      this.addLog('INFO', `Converting "${define.name}" to SQL CTE`);
      
      if (define.name === 'Initial Population') {
        ctes.push(this.convertInitialPopulation(define.expression));
      } else if (define.name === 'Denominator') {
        ctes.push(this.convertDenominator(define.expression));
      } else if (define.name === 'Numerator') {
        ctes.push(this.convertNumerator(define.expression));
      } else {
        // Handle other define statements
        ctes.push(this.convertGenericDefine(define.name, define.expression));
      }
    }

    const finalQuery = `
SELECT 
  (SELECT COUNT(*) FROM InitialPopulation) AS initial_population_count,
  (SELECT COUNT(*) FROM Denominator) AS denominator_count,
  (SELECT COUNT(*) FROM Numerator) AS numerator_count,
  -- Additional metrics
  CASE 
    WHEN (SELECT COUNT(*) FROM Denominator) > 0 
    THEN ROUND((SELECT COUNT(*) FROM Numerator) * 100.0 / (SELECT COUNT(*) FROM Denominator), 2)
    ELSE 0 
  END AS percentage_score`;

    return `-- Generated SQL on FHIR Query from CQL\n-- Using Common Table Expressions (CTEs) for modularity\nWITH ${ctes.join(',\n')}\n${finalQuery}`;
  }

  private generateBaseFhirViews(): string {
    return `-- Base FHIR views following SQL on FHIR specification
Patient_view AS (
  SELECT
    id,
    gender,
    birthDate,
    age
  FROM Patient
),
Observation_view AS (
  SELECT
    id,
    subject_id,
    code_text,
    effective_datetime,
    value_quantity,
    value_unit
  FROM Observation
),
Condition_view AS (
  SELECT
    id,
    subject_id,
    code_text,
    onset_datetime,
    clinical_status
  FROM Condition
)`;
  }

  private convertGenericDefine(name: string, expression: string): string {
    return `${name.replace(/\s+/g, '')} AS (
  -- Generic define conversion for: ${name}
  -- Expression: ${expression}
  SELECT 'placeholder' AS result
)`;
  }

  private convertInitialPopulation(expression: string): string {
    let sql = `-- Initial Population: Patients meeting basic criteria
InitialPopulation AS (
  SELECT p.id AS patient_id,
         p.gender,
         p.age,
         p.birthDate
  FROM Patient_view p
  WHERE 1=1`;

    // Enhanced pattern matching for gender filters
    const genderMatch = expression.match(/P\.gender\s*=\s*'(\w+)'/);
    if (genderMatch) {
      sql += `\n    AND p.gender = '${genderMatch[1]}'`;
      this.addLog('INFO', `Applied gender filter: ${genderMatch[1]}`);
    }

    // Enhanced pattern matching for age filters
    const ageMatch = expression.match(/AgeInYearsAt.*?>=?\s*(\d+)/);
    if (ageMatch) {
      sql += `\n    AND p.age >= ${ageMatch[1]}`;
      this.addLog('INFO', `Applied age filter: >= ${ageMatch[1]} years`);
    }

    // Additional filters can be added here following the same pattern
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
    let sql = `-- Numerator: Patients meeting the outcome criteria
Numerator AS (
  SELECT DISTINCT d.patient_id,
         COUNT(o.id) as observation_count,
         MAX(o.value_quantity) as max_value,
         AVG(o.value_quantity) as avg_value
  FROM Denominator d
  LEFT JOIN Observation_view o ON o.subject_id = d.patient_id
  WHERE 1=1`;

    // Enhanced pattern matching for observation types
    if (expression.includes('[Observation') && expression.includes('Heart Rate')) {
      sql += `\n    AND o.code_text LIKE '%Heart Rate%'`;
      this.addLog('INFO', 'Applied Heart Rate observation filter');
    }

    // Enhanced pattern matching for time periods
    if (expression.includes('during "Measurement Period"')) {
      sql += `\n    AND o.effective_datetime BETWEEN '2024-01-01T00:00:00Z' AND '2024-12-31T23:59:59Z'`;
      this.addLog('INFO', 'Applied measurement period filter: 2024');
    }

    // Enhanced pattern matching for value comparisons
    const valueMatch = expression.match(/value\.?\s*([><=]+)\s*(\d+)/);
    if (valueMatch) {
      const operator = valueMatch[1];
      const threshold = valueMatch[2];
      sql += `\n    AND o.value_quantity ${operator} ${threshold}`;
      this.addLog('INFO', `Applied value filter: ${operator} ${threshold}`);
    }

    // Enhanced pattern matching for FHIR code matching
    const codeMatch = expression.match(/code\s+in\s+\{['"]([^'"]+)['"]\}/);
    if (codeMatch) {
      const codeValue = codeMatch[1];
      // Map LOINC codes to readable names
      const codeMapping: { [key: string]: string } = {
        '8867-4': 'Heart Rate',
        '8480-6': 'Systolic Blood Pressure',
        '8462-4': 'Diastolic Blood Pressure'
      };
      const codeName = codeMapping[codeValue] || codeValue;
      sql += `\n    AND o.code_text = '${codeName}'`;
      this.addLog('INFO', `Applied code filter: ${codeValue} (${codeName})`);
    }

    // Group by patient to handle aggregations properly
    sql += '\n  GROUP BY d.patient_id\n  HAVING COUNT(o.id) > 0';
    sql += '\n)';
    return sql;
  }

  private async executeSql(sql: string, fhirBundle: FhirBundle): Promise<{ [key: string]: number }> {
    // Flatten FHIR bundle to SQL views
    const views = flattenBundleToViews(fhirBundle);
    this.addLog('INFO', `Flattened FHIR bundle: ${views.patients.length} patients, ${views.observations.length} observations, ${views.conditions.length} conditions`);

    // Create in-memory database with real SQL.js
    const db = await this.createInMemoryDatabase(views);

    try {
      // Execute the generated SQL query
      this.addLog('INFO', 'Executing generated SQL query');
      const result = db.exec(sql);

      if (result.length === 0 || result[0].values.length === 0) {
        this.addLog('ERROR', 'SQL query returned no results');
        throw new Error('SQL query returned no results - check query syntax and data');
      }

      const [row] = result[0].values;
      const results = {
        initial_population_count: Number(row[0]) || 0,
        denominator_count: Number(row[1]) || 0,
        numerator_count: Number(row[2]) || 0,
        percentage_score: Number(row[3]) || 0
      };

      this.addLog('SUCCESS', `Query results: IP=${results.initial_population_count}, DENOM=${results.denominator_count}, NUMER=${results.numerator_count}, Score=${results.percentage_score}%`);

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addLog('ERROR', `SQL execution error: ${errorMessage}`);

      // Try to provide helpful error context
      if (errorMessage.includes('syntax error')) {
        this.addLog('ERROR', 'SQL syntax error detected - check generated SQL for issues');
      } else if (errorMessage.includes('no such table')) {
        this.addLog('ERROR', 'Table not found - ensure FHIR resources are properly loaded');
      } else if (errorMessage.includes('no such column')) {
        this.addLog('ERROR', 'Column not found - check field names in generated SQL');
      }

      throw new Error(`SQL execution failed: ${errorMessage}`);
    } finally {
      // Always close the database connection
      try {
        db.close();
      } catch (e) {
        // Ignore close errors
      }
    }
  }

  private async createInMemoryDatabase(views: any): Promise<SqlDatabase> {
    this.addLog('INFO', 'Initializing SQL.js in-memory database');

    // Initialize SQL.js with different configurations for browser vs Node.js
    const isBrowser = typeof window !== 'undefined';
    const SQL = await initSqlJs(
      isBrowser
        ? {
            // Browser: Load WASM from CDN
            locateFile: (file: string) => `https://sql.js.org/dist/${file}`
          }
        : {
            // Node.js: Use local wasm file from node_modules
            // In production browser, this won't be used
          }
    );

    const db = new SQL.Database();
    this.addLog('SUCCESS', 'SQL.js database initialized');

    try {
      // Create Patient table
      db.run(`
        CREATE TABLE Patient (
          id TEXT PRIMARY KEY,
          gender TEXT,
          birthDate TEXT,
          age INTEGER
        )
      `);
      this.addLog('INFO', 'Created Patient table');

      // Insert patients
      views.patients.forEach((p: any) => {
        db.run(
          'INSERT INTO Patient (id, gender, birthDate, age) VALUES (?, ?, ?, ?)',
          [p.id, p.gender || null, p.birthDate || null, p.age || null]
        );
      });
      this.addLog('SUCCESS', `Inserted ${views.patients.length} patients into database`);

      // Create Observation table
      db.run(`
        CREATE TABLE Observation (
          id TEXT PRIMARY KEY,
          subject_id TEXT,
          code_text TEXT,
          effective_datetime TEXT,
          value_quantity REAL,
          value_unit TEXT
        )
      `);
      this.addLog('INFO', 'Created Observation table');

      // Insert observations
      views.observations.forEach((o: any) => {
        db.run(
          'INSERT INTO Observation (id, subject_id, code_text, effective_datetime, value_quantity, value_unit) VALUES (?, ?, ?, ?, ?, ?)',
          [o.id, o.subject_id, o.code_text || null, o.effective_datetime || null,
           o.value_quantity || null, o.value_unit || null]
        );
      });
      this.addLog('SUCCESS', `Inserted ${views.observations.length} observations into database`);

      // Create Condition table
      db.run(`
        CREATE TABLE Condition (
          id TEXT PRIMARY KEY,
          subject_id TEXT,
          code_text TEXT,
          onset_datetime TEXT,
          clinical_status TEXT
        )
      `);
      this.addLog('INFO', 'Created Condition table');

      // Insert conditions
      views.conditions.forEach((c: any) => {
        db.run(
          'INSERT INTO Condition (id, subject_id, code_text, onset_datetime, clinical_status) VALUES (?, ?, ?, ?, ?)',
          [c.id, c.subject_id, c.code_text || null, c.onset_datetime || null, c.clinical_status || null]
        );
      });
      this.addLog('SUCCESS', `Inserted ${views.conditions.length} conditions into database`);

      return {
        exec: (sql: string) => {
          this.addLog('INFO', 'Executing SQL query against database');
          return db.exec(sql);
        },
        close: () => {
          db.close();
          this.addLog('INFO', 'Closed database connection');
        }
      };

    } catch (error) {
      db.close();
      throw error;
    }
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
