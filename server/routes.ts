import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEvaluationLogSchema, insertMeasureReportSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================================
  // EVALUATION LOGS API
  // ============================================================

  // POST /api/evaluation-logs - Create a new evaluation log
  app.post("/api/evaluation-logs", async (req, res) => {
    try {
      const validatedData = insertEvaluationLogSchema.parse(req.body);
      const log = await storage.createEvaluationLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Invalid request data",
          errors: error.errors
        });
      } else {
        res.status(500).json({
          message: "Failed to create evaluation log",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  // GET /api/evaluation-logs - Get all evaluation logs
  app.get("/api/evaluation-logs", async (req, res) => {
    try {
      const logs = await storage.getEvaluationLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch evaluation logs",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/evaluation-logs/latest - Get latest CQL and SQL logs for comparison
  app.get("/api/evaluation-logs/latest", async (req, res) => {
    try {
      const logs = await storage.getEvaluationLogs();

      // Sort by creation date (most recent first)
      const sortedLogs = logs.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Find latest CQL and SQL logs
      const latestCql = sortedLogs.find(log => log.evaluationType === 'cql');
      const latestSql = sortedLogs.find(log => log.evaluationType === 'sql');

      res.json({
        cql: latestCql || null,
        sql: latestSql || null
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch latest logs",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/evaluation-logs/stats - Get evaluation statistics
  app.get("/api/evaluation-logs/stats", async (req, res) => {
    try {
      const logs = await storage.getEvaluationLogs();

      const cqlLogs = logs.filter(log => log.evaluationType === 'cql');
      const sqlLogs = logs.filter(log => log.evaluationType === 'sql');

      const avgCqlTime = cqlLogs.length > 0
        ? cqlLogs.reduce((sum, log) => sum + (parseFloat(log.executionTimeMs || '0')), 0) / cqlLogs.length
        : 0;

      const avgSqlTime = sqlLogs.length > 0
        ? sqlLogs.reduce((sum, log) => sum + (parseFloat(log.executionTimeMs || '0')), 0) / sqlLogs.length
        : 0;

      res.json({
        totalEvaluations: logs.length,
        cqlEvaluations: cqlLogs.length,
        sqlEvaluations: sqlLogs.length,
        averageCqlExecutionMs: avgCqlTime,
        averageSqlExecutionMs: avgSqlTime,
        performanceRatio: avgCqlTime > 0 ? avgSqlTime / avgCqlTime : null
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to calculate statistics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ============================================================
  // MEASURE REPORTS API
  // ============================================================

  // POST /api/measure-reports - Create a new measure report
  app.post("/api/measure-reports", async (req, res) => {
    try {
      const validatedData = insertMeasureReportSchema.parse(req.body);
      const report = await storage.createMeasureReport(validatedData);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Invalid request data",
          errors: error.errors
        });
      } else {
        res.status(500).json({
          message: "Failed to create measure report",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  // GET /api/measure-reports - Get all measure reports
  app.get("/api/measure-reports", async (req, res) => {
    try {
      const reports = await storage.getMeasureReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch measure reports",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/measure-reports/:reportId - Get a specific measure report by reportId
  app.get("/api/measure-reports/:reportId", async (req, res) => {
    try {
      const { reportId } = req.params;
      const reports = await storage.getMeasureReports();
      const report = reports.find(r => r.reportId === reportId);

      if (!report) {
        res.status(404).json({ message: "Measure report not found" });
        return;
      }

      res.json(report);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch measure report",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GET /api/measure-reports/latest/comparison - Get latest CQL vs SQL reports for comparison
  app.get("/api/measure-reports/latest/comparison", async (req, res) => {
    try {
      const reports = await storage.getMeasureReports();

      // Sort by creation date (most recent first)
      const sortedReports = reports.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Find latest CQL and SQL reports
      const latestCql = sortedReports.find(r => r.evaluationType === 'cql');
      const latestSql = sortedReports.find(r => r.evaluationType === 'sql');

      res.json({
        cql: latestCql || null,
        sql: latestSql || null
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch comparison data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ============================================================
  // HEALTH CHECK
  // ============================================================

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
