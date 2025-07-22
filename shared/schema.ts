import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const evaluationLogs = pgTable("evaluation_logs", {
  id: serial("id").primaryKey(),
  evaluationType: text("evaluation_type").notNull(), // 'cql' or 'sql'
  cqlCode: text("cql_code").notNull(),
  fhirBundle: jsonb("fhir_bundle").notNull(),
  result: jsonb("result"),
  executionTimeMs: text("execution_time_ms"),
  memoryUsageMb: text("memory_usage_mb"),
  errors: text("errors"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const measureReports = pgTable("measure_reports", {
  id: serial("id").primaryKey(),
  reportId: text("report_id").notNull().unique(),
  measureReport: jsonb("measure_report").notNull(),
  evaluationType: text("evaluation_type").notNull(),
  generatedSql: text("generated_sql"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEvaluationLogSchema = createInsertSchema(evaluationLogs).omit({
  id: true,
  createdAt: true,
});

export const insertMeasureReportSchema = createInsertSchema(measureReports).omit({
  id: true,
  createdAt: true,
});

export type InsertEvaluationLog = z.infer<typeof insertEvaluationLogSchema>;
export type EvaluationLog = typeof evaluationLogs.$inferSelect;

export type InsertMeasureReport = z.infer<typeof insertMeasureReportSchema>;
export type MeasureReport = typeof measureReports.$inferSelect;
