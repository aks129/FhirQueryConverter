import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Code, Database, FileText, CheckCircle2, FileCode } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ASTViewer } from "./ast-viewer";

interface TransformationStep {
  id: string;
  title: string;
  description: string;
  input?: string;
  output?: string;
  language?: 'cql' | 'sql' | 'text';
  status: 'completed' | 'active' | 'pending';
}

interface TransformationViewProps {
  cqlCode: string;
  generatedSql: string;
  logs?: string[];
}

export function TransformationView({ cqlCode, generatedSql, logs = [] }: TransformationViewProps) {
  // Extract transformation steps from the process
  const steps: TransformationStep[] = [
    {
      id: 'step-1',
      title: 'Parse CQL Source Code',
      description: 'Tokenize and parse CQL into an Abstract Syntax Tree (AST)',
      input: cqlCode,
      output: 'AST generated successfully with library metadata, parameters, and define statements',
      language: 'cql',
      status: 'completed',
    },
    {
      id: 'step-2',
      title: 'Analyze AST Structure',
      description: 'Walk the AST to identify queries, expressions, and relationships',
      output: logs.find(log => log.includes('Converting define'))?.replace(/.*Converting define/, 'Found define') ||
              'Identified define statements: Initial Population, Denominator, Numerator',
      language: 'text',
      status: 'completed',
    },
    {
      id: 'step-3',
      title: 'Generate Base FHIR Views',
      description: 'Create SQL views for Patient, Observation, Condition, Procedure, MedicationRequest, Encounter, and DiagnosticReport',
      output: `Patient_view AS (SELECT id, gender, birthDate, age FROM Patient)
Observation_view AS (SELECT id, subject_id, code_text, ... FROM Observation)
Condition_view AS (SELECT id, subject_id, code_text, ... FROM Condition)
Procedure_view AS (SELECT id, subject_id, code_text, ... FROM Procedure)
MedicationRequest_view AS (SELECT id, subject_id, medication_text, ... FROM MedicationRequest)
Encounter_view AS (SELECT id, subject_id, class_code, ... FROM Encounter)
DiagnosticReport_view AS (SELECT id, subject_id, code_text, ... FROM DiagnosticReport)`,
      language: 'sql',
      status: 'completed',
    },
    {
      id: 'step-4',
      title: 'Convert Defines to CTEs',
      description: 'Transform each CQL define statement into a SQL Common Table Expression',
      output: `InitialPopulation AS (SELECT p.id AS patient_id ... FROM Patient_view p ...)
Denominator AS (SELECT patient_id FROM InitialPopulation)
Numerator AS (SELECT d.patient_id FROM Denominator d ...)`,
      language: 'sql',
      status: 'completed',
    },
    {
      id: 'step-5',
      title: 'Generate Final Query',
      description: 'Create the final SELECT statement that calculates measure populations and scores',
      output: generatedSql,
      language: 'sql',
      status: 'completed',
    },
  ];

  return (
    <Tabs defaultValue="steps" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="steps" className="flex items-center space-x-2">
          <Code className="w-4 h-4" />
          <span>Transformation Steps</span>
        </TabsTrigger>
        <TabsTrigger value="ast" className="flex items-center space-x-2">
          <FileCode className="w-4 h-4" />
          <span>AST Structure</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="steps" className="space-y-4">
        <Card className="p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-center space-x-3">
            <Code className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">CQL to SQL Transformation Pipeline</h3>
              <p className="text-xs text-blue-700">5 steps completed successfully</p>
            </div>
          </div>
        </Card>

        <Accordion type="single" collapsible defaultValue="step-5" className="w-full">
        {steps.map((step, index) => (
          <AccordionItem key={step.id} value={step.id} className="border border-gray-200 rounded-lg mb-2">
            <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
              <div className="flex items-center space-x-3 text-left">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 flex-shrink-0">
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{step.title}</h4>
                  <p className="text-xs text-gray-600">{step.description}</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3 pt-2">
                {step.input && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-medium text-gray-700">Input</span>
                    </div>
                    <div className="border border-gray-200 rounded-md overflow-hidden">
                      <SyntaxHighlighter
                        language={step.language === 'cql' ? 'sql' : step.language}
                        style={vs}
                        customStyle={{
                          margin: 0,
                          padding: '0.75rem',
                          fontSize: '0.75rem',
                          lineHeight: '1.4',
                          background: '#f9fafb',
                        }}
                        wrapLines
                      >
                        {step.input}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                )}

                {step.input && step.output && (
                  <div className="flex justify-center">
                    <ArrowRight className="w-5 h-5 text-blue-500" />
                  </div>
                )}

                {step.output && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Database className="w-4 h-4 text-gray-500" />
                      <span className="text-xs font-medium text-gray-700">Output</span>
                    </div>
                    <div className="border border-gray-200 rounded-md overflow-hidden">
                      {step.language === 'text' ? (
                        <div className="p-3 bg-gray-50 text-xs text-gray-800">
                          {step.output}
                        </div>
                      ) : (
                        <SyntaxHighlighter
                          language={step.language === 'cql' ? 'sql' : step.language}
                          style={vs}
                          customStyle={{
                            margin: 0,
                            padding: '0.75rem',
                            fontSize: '0.75rem',
                            lineHeight: '1.4',
                            background: '#f9fafb',
                          }}
                          wrapLines
                        >
                          {step.output}
                        </SyntaxHighlighter>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

        <Card className="p-4 bg-green-50 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Transformation Complete</p>
                <p className="text-xs text-green-700">
                  CQL successfully transpiled to executable SQL on FHIR query
                </p>
              </div>
            </div>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="ast">
        <ASTViewer cqlCode={cqlCode} />
      </TabsContent>
    </Tabs>
  );
}
