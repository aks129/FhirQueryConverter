/**
 * Phase 8: Backend API Hooks
 *
 * Custom hooks for interacting with the backend API endpoints
 */

import { useToast } from "@/hooks/use-toast";
import type { InsertEvaluationLog, InsertMeasureReport } from "@shared/schema";

export function useApi() {
  const { toast } = useToast();

  // Save evaluation log to backend
  const saveEvaluationLog = async (log: InsertEvaluationLog) => {
    try {
      const response = await fetch('/api/evaluation-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save evaluation log');
      }

      const savedLog = await response.json();
      return savedLog;
    } catch (error) {
      console.error('Error saving evaluation log:', error);
      toast({
        title: "Failed to save evaluation log",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Save measure report to backend
  const saveMeasureReport = async (report: InsertMeasureReport) => {
    try {
      const response = await fetch('/api/measure-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save measure report');
      }

      const savedReport = await response.json();
      return savedReport;
    } catch (error) {
      console.error('Error saving measure report:', error);
      toast({
        title: "Failed to save measure report",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Get all evaluation logs
  const getEvaluationLogs = async () => {
    try {
      const response = await fetch('/api/evaluation-logs');
      if (!response.ok) {
        throw new Error('Failed to fetch evaluation logs');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching evaluation logs:', error);
      toast({
        title: "Failed to fetch evaluation logs",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Get latest CQL and SQL logs
  const getLatestLogs = async () => {
    try {
      const response = await fetch('/api/evaluation-logs/latest');
      if (!response.ok) {
        throw new Error('Failed to fetch latest logs');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching latest logs:', error);
      throw error;
    }
  };

  // Get evaluation statistics
  const getEvaluationStats = async () => {
    try {
      const response = await fetch('/api/evaluation-logs/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  };

  // Get all measure reports
  const getMeasureReports = async () => {
    try {
      const response = await fetch('/api/measure-reports');
      if (!response.ok) {
        throw new Error('Failed to fetch measure reports');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching measure reports:', error);
      toast({
        title: "Failed to fetch measure reports",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Get measure report comparison data
  const getComparisonData = async () => {
    try {
      const response = await fetch('/api/measure-reports/latest/comparison');
      if (!response.ok) {
        throw new Error('Failed to fetch comparison data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      throw error;
    }
  };

  // Health check
  const healthCheck = async () => {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error('Health check failed');
      }
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  };

  return {
    saveEvaluationLog,
    saveMeasureReport,
    getEvaluationLogs,
    getLatestLogs,
    getEvaluationStats,
    getMeasureReports,
    getComparisonData,
    healthCheck,
  };
}
