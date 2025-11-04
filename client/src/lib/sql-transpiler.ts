import { FhirBundle, MeasureReport, SqlExecutionResult, LogEntry } from "@/types/fhir";
import { flattenBundleToViews } from "./fhir-utils";
import initSqlJs, { Database } from "sql.js";
import { CqlParser } from "./cql-parser/parser";
import { AstToSqlTranspiler } from "./cql-parser/ast-to-sql";

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
      this.addLog('INFO', 'Starting CQL to SQL conversion with AST parser');

      // Parse CQL into AST
      const parser = new CqlParser();
      const ast = parser.parse(cqlCode);
      this.addLog('SUCCESS', `Parsed CQL into AST: ${ast.defines.length} define statements found`);

      // Convert AST to SQL
      const astToSql = new AstToSqlTranspiler();
      const sql = astToSql.transpile(ast);

      // Add AST transpiler logs
      astToSql.getLogs().forEach(log => this.addLog('INFO', log));

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

  // Legacy methods removed - now using AST-based parsing
  // See CqlParser and AstToSqlTranspiler for new implementation

  private async executeSql(sql: string, fhirBundle: FhirBundle): Promise<{ [key: string]: number }> {
    // Flatten FHIR bundle to SQL views
    const views = flattenBundleToViews(fhirBundle);
    this.addLog('INFO', `Flattened FHIR bundle: ${views.patients.length} patients, ${views.observations.length} observations, ${views.conditions.length} conditions, ${views.procedures.length} procedures, ${views.medicationRequests.length} medications, ${views.encounters.length} encounters, ${views.diagnosticReports.length} reports`);

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

      // Create Procedure table
      db.run(`
        CREATE TABLE Procedure (
          id TEXT PRIMARY KEY,
          subject_id TEXT,
          code_text TEXT,
          performed_datetime TEXT,
          status TEXT
        )
      `);
      this.addLog('INFO', 'Created Procedure table');

      // Insert procedures
      views.procedures.forEach((p: any) => {
        db.run(
          'INSERT INTO Procedure (id, subject_id, code_text, performed_datetime, status) VALUES (?, ?, ?, ?, ?)',
          [p.id, p.subject_id, p.code_text || null, p.performed_datetime || null, p.status || null]
        );
      });
      this.addLog('SUCCESS', `Inserted ${views.procedures.length} procedures into database`);

      // Create MedicationRequest table
      db.run(`
        CREATE TABLE MedicationRequest (
          id TEXT PRIMARY KEY,
          subject_id TEXT,
          medication_text TEXT,
          authored_on TEXT,
          status TEXT,
          intent TEXT
        )
      `);
      this.addLog('INFO', 'Created MedicationRequest table');

      // Insert medication requests
      views.medicationRequests.forEach((m: any) => {
        db.run(
          'INSERT INTO MedicationRequest (id, subject_id, medication_text, authored_on, status, intent) VALUES (?, ?, ?, ?, ?, ?)',
          [m.id, m.subject_id, m.medication_text || null, m.authored_on || null, m.status || null, m.intent || null]
        );
      });
      this.addLog('SUCCESS', `Inserted ${views.medicationRequests.length} medication requests into database`);

      // Create Encounter table
      db.run(`
        CREATE TABLE Encounter (
          id TEXT PRIMARY KEY,
          subject_id TEXT,
          class_code TEXT,
          type_text TEXT,
          period_start TEXT,
          period_end TEXT,
          status TEXT
        )
      `);
      this.addLog('INFO', 'Created Encounter table');

      // Insert encounters
      views.encounters.forEach((e: any) => {
        db.run(
          'INSERT INTO Encounter (id, subject_id, class_code, type_text, period_start, period_end, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [e.id, e.subject_id, e.class_code || null, e.type_text || null, e.period_start || null, e.period_end || null, e.status || null]
        );
      });
      this.addLog('SUCCESS', `Inserted ${views.encounters.length} encounters into database`);

      // Create DiagnosticReport table
      db.run(`
        CREATE TABLE DiagnosticReport (
          id TEXT PRIMARY KEY,
          subject_id TEXT,
          code_text TEXT,
          effective_datetime TEXT,
          issued TEXT,
          status TEXT
        )
      `);
      this.addLog('INFO', 'Created DiagnosticReport table');

      // Insert diagnostic reports
      views.diagnosticReports.forEach((d: any) => {
        db.run(
          'INSERT INTO DiagnosticReport (id, subject_id, code_text, effective_datetime, issued, status) VALUES (?, ?, ?, ?, ?, ?)',
          [d.id, d.subject_id, d.code_text || null, d.effective_datetime || null, d.issued || null, d.status || null]
        );
      });
      this.addLog('SUCCESS', `Inserted ${views.diagnosticReports.length} diagnostic reports into database`);

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
