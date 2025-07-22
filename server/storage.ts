import { 
  type EvaluationLog, 
  type InsertEvaluationLog,
  type MeasureReport as MeasureReportType,
  type InsertMeasureReport
} from "@shared/schema";

export interface IStorage {
  createEvaluationLog(log: InsertEvaluationLog): Promise<EvaluationLog>;
  getEvaluationLogs(): Promise<EvaluationLog[]>;
  createMeasureReport(report: InsertMeasureReport): Promise<MeasureReportType>;
  getMeasureReports(): Promise<MeasureReportType[]>;
}

export class MemStorage implements IStorage {
  private evaluationLogs: Map<number, EvaluationLog>;
  private measureReports: Map<number, MeasureReportType>;
  private currentLogId: number;
  private currentReportId: number;

  constructor() {
    this.evaluationLogs = new Map();
    this.measureReports = new Map();
    this.currentLogId = 1;
    this.currentReportId = 1;
  }

  async createEvaluationLog(insertLog: InsertEvaluationLog): Promise<EvaluationLog> {
    const id = this.currentLogId++;
    const log: EvaluationLog = { 
      ...insertLog,
      result: insertLog.result || null,
      executionTimeMs: insertLog.executionTimeMs || null,
      memoryUsageMb: insertLog.memoryUsageMb || null,
      errors: insertLog.errors || null,
      id, 
      createdAt: new Date() 
    };
    this.evaluationLogs.set(id, log);
    return log;
  }

  async getEvaluationLogs(): Promise<EvaluationLog[]> {
    return Array.from(this.evaluationLogs.values());
  }

  async createMeasureReport(insertReport: InsertMeasureReport): Promise<MeasureReportType> {
    const id = this.currentReportId++;
    const report: MeasureReportType = { 
      ...insertReport,
      generatedSql: insertReport.generatedSql || null,
      id, 
      createdAt: new Date() 
    };
    this.measureReports.set(id, report);
    return report;
  }

  async getMeasureReports(): Promise<MeasureReportType[]> {
    return Array.from(this.measureReports.values());
  }
}

export const storage = new MemStorage();
