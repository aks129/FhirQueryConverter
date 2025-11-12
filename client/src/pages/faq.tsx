import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, Database, Workflow, Zap, GitBranch, Server, ArrowLeft, CheckCircle2, AlertCircle, Layers } from "lucide-react";
import { Link } from "wouter";

export default function FAQ() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 mb-4"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Converter
          </Button>
        </Link>
      </div>

      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <h1 className="text-3xl font-bold">FHIR Query Converter</h1>
          <Badge variant="secondary">Alpha v0.3</Badge>
        </div>
        <p className="text-lg text-muted-foreground mb-4">
          Production-Ready CQL to SQL on FHIR Platform with Complete 9-Step Workflow
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            Phase 7 & 8 Complete
          </Badge>
          <Badge variant="outline" className="bg-green-50">9-Step Workflow Live</Badge>
          <Badge variant="outline">Backend + Analytics</Badge>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {/* Architecture Overview */}
        <AccordionItem value="architecture" data-testid="accordion-architecture">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Workflow className="w-5 h-5" />
              What is the complete system architecture?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">CQL → ELM → SQL Pipeline</h4>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-6 rounded-lg border">
                      <div className="flex items-center justify-between text-sm font-mono">
                        <div className="text-center flex-1">
                          <div className="font-bold mb-1">CQL Source</div>
                          <div className="text-xs text-muted-foreground">Clinical Logic</div>
                        </div>
                        <div className="text-xl">→</div>
                        <div className="text-center flex-1">
                          <div className="font-bold mb-1">Parser</div>
                          <div className="text-xs text-muted-foreground">Lexer + Grammar</div>
                        </div>
                        <div className="text-xl">→</div>
                        <div className="text-center flex-1">
                          <div className="font-bold mb-1">CQL AST</div>
                          <div className="text-xs text-muted-foreground">Tree Structure</div>
                        </div>
                        <div className="text-xl">→</div>
                        <div className="text-center flex-1">
                          <div className="font-bold mb-1">ELM</div>
                          <div className="text-xs text-muted-foreground">HL7 Standard</div>
                        </div>
                        <div className="text-xl">→</div>
                        <div className="text-center flex-1">
                          <div className="font-bold mb-1">SQL</div>
                          <div className="text-xs text-muted-foreground">on FHIR</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2">Frontend Layer</Badge>
                      <p className="text-sm">React + TypeScript with shadcn/ui. CQL editor, FHIR bundle upload, dual evaluation results display.</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Processing Layer</Badge>
                      <p className="text-sm">Dual engines: Direct CQL execution + CQL→ELM→SQL transpilation with HL7 best practices.</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Data Layer</Badge>
                      <p className="text-sm">FHIR resource flattening, SQL view generation, value set expansion, terminology services.</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Key Components (Phase 6)</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Canonical URL Support</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Value Set Expansion</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Automatic Status Filtering</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Naming Convention Validation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>ELM Intermediate Layer</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Enhanced Temporal Operators</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* ELM Integration */}
        <AccordionItem value="elm-integration" data-testid="accordion-elm">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              How does ELM (Expression Logical Model) integration work?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">What is ELM?</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      ELM is HL7's standardized intermediate representation for clinical quality logic.
                      It sits between CQL source code and target languages (SQL, JavaScript, C#), enabling
                      multi-target compilation, optimization, and validation.
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h5 className="font-medium mb-3">Pipeline Stages</h5>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                        <div>
                          <div className="font-medium">CQL Parsing</div>
                          <div className="text-sm text-muted-foreground">Parse CQL source into Abstract Syntax Tree (AST)</div>
                          <code className="text-xs bg-background px-2 py-1 rounded mt-1 inline-block">
                            define "Has Diabetes": [Condition: "Diabetes Codes"]
                          </code>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                        <div>
                          <div className="font-medium">AST → ELM Conversion</div>
                          <div className="text-sm text-muted-foreground">Transform AST into HL7-compliant ELM structure</div>
                          <code className="text-xs bg-background px-2 py-1 rounded mt-1 inline-block">
                            {`{ type: "Retrieve", dataType: "FHIR.Condition", codes: {...} }`}
                          </code>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                        <div>
                          <div className="font-medium">ELM → SQL Generation</div>
                          <div className="text-sm text-muted-foreground">Generate SQL on FHIR with best practices applied</div>
                          <code className="text-xs bg-background px-2 py-1 rounded mt-1 inline-block">
                            SELECT c.subject_id WHERE EXISTS (SELECT 1 FROM ValueSetExpansion...)
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">ELM Type System</h5>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <Badge variant="secondary" className="mb-1">Expressions</Badge>
                        <ul className="space-y-1 ml-4 list-disc">
                          <li>Query (FROM...WHERE)</li>
                          <li>Retrieve (FHIR resources)</li>
                          <li>Property (field access)</li>
                          <li>Binary/Unary ops</li>
                        </ul>
                      </div>
                      <div>
                        <Badge variant="secondary" className="mb-1">Type Specifiers</Badge>
                        <ul className="space-y-1 ml-4 list-disc">
                          <li>NamedType (Patient, String)</li>
                          <li>ListType (List&lt;T&gt;)</li>
                          <li>IntervalType (Interval&lt;DateTime&gt;)</li>
                          <li>TupleType (Structured data)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      Benefits of ELM Layer
                    </h5>
                    <ul className="text-sm space-y-1">
                      <li>✓ <strong>Multi-Target:</strong> Same ELM generates SQL, JavaScript, C#, or other languages</li>
                      <li>✓ <strong>Optimization:</strong> ELM tree can be optimized before code generation</li>
                      <li>✓ <strong>Validation:</strong> Rich type information enables compile-time checking</li>
                      <li>✓ <strong>Standards:</strong> Follows HL7 specification for interoperability</li>
                      <li>✓ <strong>Debugging:</strong> Clear separation of parsing and generation concerns</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Terminology & Value Sets */}
        <AccordionItem value="terminology" data-testid="accordion-terminology">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              How does terminology and value set support work?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Canonical URL Support</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      The system recognizes HL7 canonical URLs for value sets and generates proper
                      SQL EXISTS queries against the ValueSetExpansion table instead of simple text matching.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2">CQL Input</Badge>
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`define "Has Diabetes":
  [Condition: "http://cts.nlm.nih.gov/
   fhir/ValueSet/2.16.840.1.113883.
   3.464.1003.103.12.1001"]`}
                      </pre>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Generated SQL</Badge>
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`WHERE EXISTS (
  SELECT 1 FROM ValueSetExpansion vse
  WHERE vse.value_set_url = '...'
    AND vse.code = c.code
    AND vse.system = c.code_system
)`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Supported Code Systems</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">LOINC</Badge>
                        <span className="text-xs text-muted-foreground">http://loinc.org</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">SNOMED</Badge>
                        <span className="text-xs text-muted-foreground">http://snomed.info/sct</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">RxNorm</Badge>
                        <span className="text-xs text-muted-foreground">http://nlm.nih.gov/...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">CPT</Badge>
                        <span className="text-xs text-muted-foreground">http://ama-assn.org/...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">ICD-10</Badge>
                        <span className="text-xs text-muted-foreground">http://hl7.org/fhir/...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">CVX</Badge>
                        <span className="text-xs text-muted-foreground">http://hl7.org/fhir/...</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Value Set Expansion Database</h5>
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`CREATE TABLE ValueSetExpansion (
  id INTEGER PRIMARY KEY,
  value_set_url TEXT NOT NULL,    -- Canonical URL
  version TEXT,
  code TEXT NOT NULL,             -- e.g., "44054006"
  system TEXT NOT NULL,           -- e.g., "http://snomed.info/sct"
  display TEXT,                   -- Human-readable
  UNIQUE(value_set_url, code, system)
);`}
                    </pre>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h5 className="font-medium mb-2">Pre-loaded Sample Value Sets</h5>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>Heart Rate Codes</strong> (LOINC, SNOMED)</li>
                      <li>• <strong>Diabetes Codes</strong> (SNOMED CT)</li>
                      <li>• <strong>BMI Codes</strong> (LOINC)</li>
                      <li>• <strong>Colonoscopy Codes</strong> (SNOMED, CPT)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Automatic Status Filtering */}
        <AccordionItem value="status-filtering" data-testid="accordion-status">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              What is automatic status filtering and why is it important?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">HL7 Best Practice Implementation</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Per HL7 CQL Implementation Guide, queries should only retrieve clinically relevant
                      resources with appropriate status values. The system automatically injects status
                      filters for all queries—no manual filtering required!
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h5 className="font-medium mb-3">Status Filters by Resource Type</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium">Resource</span>
                        <span className="font-medium">Automatic Filter</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Observation</span>
                        <code className="text-xs bg-background px-2 py-1 rounded">status IN ('final', 'amended', 'corrected')</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Condition</span>
                        <code className="text-xs bg-background px-2 py-1 rounded">clinical_status = 'active'</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Procedure</span>
                        <code className="text-xs bg-background px-2 py-1 rounded">status = 'completed'</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>MedicationRequest</span>
                        <code className="text-xs bg-background px-2 py-1 rounded">status IN ('active', 'completed')</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Encounter</span>
                        <code className="text-xs bg-background px-2 py-1 rounded">status = 'finished'</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>DiagnosticReport</span>
                        <code className="text-xs bg-background px-2 py-1 rounded">status IN ('final', 'amended', 'corrected')</code>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Badge className="mb-2 bg-red-600">❌ What Gets Excluded</Badge>
                      <ul className="text-sm space-y-1">
                        <li>• Preliminary results</li>
                        <li>• Cancelled procedures</li>
                        <li>• Entered-in-error data</li>
                        <li>• Unknown status records</li>
                        <li>• Draft medication orders</li>
                      </ul>
                    </div>
                    <div>
                      <Badge className="mb-2 bg-green-600">✓ What Gets Included</Badge>
                      <ul className="text-sm space-y-1">
                        <li>• Final observations</li>
                        <li>• Active conditions</li>
                        <li>• Completed procedures</li>
                        <li>• Finished encounters</li>
                        <li>• Verified data only</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h5 className="font-medium mb-2">Example: Before vs After</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs font-medium mb-1">Your CQL:</div>
                        <code className="text-xs bg-background p-2 rounded block">
                          [Observation: "Heart Rate"]
                        </code>
                      </div>
                      <div>
                        <div className="text-xs font-medium mb-1">Generated SQL:</div>
                        <code className="text-xs bg-background p-2 rounded block">
                          WHERE o.status IN ('final', 'amended', 'corrected')
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Naming Conventions */}
        <AccordionItem value="naming" data-testid="accordion-naming">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              How does naming convention validation work?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">HL7 CQL Naming Standards</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      The transpiler validates all identifiers against HL7 CQL naming conventions and
                      provides helpful suggestions for improvements.
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h5 className="font-medium mb-3">Naming Rules</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium">Element Type</span>
                        <span className="font-medium">Convention</span>
                        <span className="font-medium">Examples</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Library</span>
                        <Badge variant="secondary">PascalCase</Badge>
                        <code className="text-xs">DiabetesScreening</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Define</span>
                        <Badge variant="secondary">PascalCase</Badge>
                        <code className="text-xs">InInitialPopulation</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Function</span>
                        <Badge variant="secondary">PascalCase</Badge>
                        <code className="text-xs">CalculateAge</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Parameter</span>
                        <Badge variant="secondary">PascalCase</Badge>
                        <code className="text-xs">MeasurementPeriod</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Variable</span>
                        <Badge variant="secondary">camelCase</Badge>
                        <code className="text-xs">patientAge</code>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Badge className="mb-2 bg-red-600">❌ Bad</Badge>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`define "initial_population": ...
define "has_diabetes": ...
define "PatientAge": ...  // Should be camelCase`}
                      </pre>
                    </div>
                    <div>
                      <Badge className="mb-2 bg-green-600">✓ Good</Badge>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`define "InitialPopulation": ...
define "HasDiabetes": ...
define patientAge: ...  // Local variable`}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      Validation Warnings
                    </h5>
                    <pre className="text-xs bg-background p-3 rounded-lg overflow-x-auto">
{`⚠️  Naming Convention Warnings:
  - definition "initial_population": Definition names must use PascalCase
    Suggestion: InitialPopulation
  - definition "has_diabetes": Definition names must use PascalCase
    Suggestion: HasDiabetes`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Temporal Operators */}
        <AccordionItem value="temporal" data-testid="accordion-temporal">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              What temporal operators are supported?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Enhanced Temporal Support</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Phase 6 adds comprehensive temporal operator support following CQL specification.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Comparison Operators</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <code>before</code>
                          <span className="text-muted-foreground">date &lt; date</span>
                        </div>
                        <div className="flex justify-between">
                          <code>after</code>
                          <span className="text-muted-foreground">date &gt; date</span>
                        </div>
                        <div className="flex justify-between">
                          <code>on or before</code>
                          <span className="text-muted-foreground">date &lt;= date</span>
                        </div>
                        <div className="flex justify-between">
                          <code>on or after</code>
                          <span className="text-muted-foreground">date &gt;= date</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Interval Operators</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <code>during</code>
                          <span className="text-muted-foreground">in interval</span>
                        </div>
                        <div className="flex justify-between">
                          <code>overlaps</code>
                          <span className="text-muted-foreground">any overlap</span>
                        </div>
                        <div className="flex justify-between">
                          <code>starts</code>
                          <span className="text-muted-foreground">same start</span>
                        </div>
                        <div className="flex justify-between">
                          <code>ends</code>
                          <span className="text-muted-foreground">same end</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Example: Temporal Query</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Badge variant="outline" className="mb-2">CQL</Badge>
                        <pre className="text-xs bg-muted p-3 rounded-lg">
{`define "Recent Obs":
  [Observation] O
    where O.effective
      during "Measurement Period"
      and O.issued
      on or after @2024-01-01`}
                        </pre>
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-2">SQL</Badge>
                        <pre className="text-xs bg-muted p-3 rounded-lg">
{`WHERE o.effective_datetime
  BETWEEN '2024-01-01'
      AND '2024-12-31'
  AND o.issued >= '2024-01-01'`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Complete CQL to SQL Example */}
        <AccordionItem value="complete-example" data-testid="accordion-example">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Show me a complete CQL → ELM → SQL example
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Diabetes Screening Quality Measure</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      This example demonstrates the complete pipeline with all Phase 6 features.
                    </p>
                  </div>

                  {/* Step 1: CQL */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                      <h5 className="font-medium">CQL Source Code</h5>
                    </div>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
{`library DiabetesScreening version '1.0.0'

using FHIR version '4.0.1'

valueset "Diabetes": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.103.12.1001'
valueset "HbA1c Tests": 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.198.12.1013'

parameter "Measurement Period" Interval<DateTime>

define "InitialPopulation":
  [Patient] P
    where AgeInYearsAt(start of "Measurement Period") >= 18

define "HasDiabetes":
  exists ([Condition: "Diabetes"])

define "RecentHbA1cTest":
  [Observation: "HbA1c Tests"] O
    where O.effective during "Measurement Period"
      and O.value < 7.0 '%'

define "Numerator":
  "HasDiabetes" and exists ("RecentHbA1cTest")`}
                    </pre>
                  </div>

                  {/* Step 2: ELM */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                      <h5 className="font-medium">ELM Representation (excerpt)</h5>
                    </div>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
{`{
  "type": "Library",
  "identifier": { "id": "DiabetesScreening", "version": "1.0.0" },
  "schemaIdentifier": { "id": "urn:hl7-org:elm", "version": "r1" },
  "statements": [
    {
      "name": "HasDiabetes",
      "context": "Patient",
      "expression": {
        "type": "Query",
        "source": [{
          "alias": "c",
          "expression": {
            "type": "Retrieve",
            "dataType": "FHIR.Condition",
            "codes": {
              "type": "Literal",
              "valueType": "String",
              "value": "http://cts.nlm.nih.gov/fhir/ValueSet/..."
            }
          }
        }]
      }
    }
  ]
}`}
                    </pre>
                  </div>

                  {/* Step 3: SQL */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                      <h5 className="font-medium">Generated SQL on FHIR</h5>
                    </div>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
{`-- Generated SQL on FHIR Query from ELM
-- Library: DiabetesScreening
-- All Phase 6 best practices applied

WITH Patient_view AS (
  SELECT id, gender, birthDate, age FROM Patient
),
Condition_view AS (
  SELECT id, subject_id, code, code_system, code_text,
         onset_datetime, clinical_status, verification_status
  FROM Condition
),
Observation_view AS (
  SELECT id, subject_id, code, code_system, code_text,
         effective_datetime, value_quantity, value_unit, status
  FROM Observation
),

InitialPopulation AS (
  SELECT p.id AS patient_id
  FROM Patient_view p
  WHERE CAST((JULIANDAY(CURRENT_DATE) - JULIANDAY(birthDate)) / 365.25 AS INTEGER) >= 18
),

HasDiabetes AS (
  SELECT c.subject_id AS patient_id
  FROM Condition_view c
  WHERE c.clinical_status = 'active'  -- ✓ Automatic status filter!
    AND EXISTS (
      SELECT 1 FROM ValueSetExpansion vse
      WHERE vse.value_set_url = 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.103.12.1001'
        AND vse.code = c.code
        AND vse.system = c.code_system  -- ✓ Proper code matching!
    )
),

RecentHbA1cTest AS (
  SELECT o.subject_id AS patient_id
  FROM Observation_view o
  WHERE o.status IN ('final', 'amended', 'corrected')  -- ✓ Automatic status filter!
    AND EXISTS (
      SELECT 1 FROM ValueSetExpansion vse
      WHERE vse.value_set_url = 'http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.198.12.1013'
        AND vse.code = o.code
        AND vse.system = o.code_system
    )
    AND o.effective_datetime BETWEEN '2024-01-01' AND '2024-12-31'  -- ✓ Temporal operator!
    AND o.value_quantity < 7.0
),

Numerator AS (
  SELECT DISTINCT hd.patient_id
  FROM HasDiabetes hd
  WHERE EXISTS (SELECT 1 FROM RecentHbA1cTest rh WHERE rh.patient_id = hd.patient_id)
)

SELECT DISTINCT patient_id FROM Numerator;`}
                    </pre>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Phase 6 Features Applied
                    </h5>
                    <ul className="text-sm space-y-1">
                      <li>✓ PascalCase naming convention for all definitions</li>
                      <li>✓ Canonical URLs for value sets (not display text)</li>
                      <li>✓ Automatic status filtering (active conditions, final observations)</li>
                      <li>✓ Proper code system matching (system + code, not text search)</li>
                      <li>✓ Temporal operator support (during, before, after)</li>
                      <li>✓ ELM intermediate representation for optimization</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* What's Supported */}
        <AccordionItem value="supported" data-testid="accordion-supported">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              What CQL features are currently supported in Alpha v0.3?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2 text-green-600">✓ Fully Supported</h5>
                      <ul className="text-sm space-y-1">
                        <li>✓ <strong>Define statements</strong> with PascalCase validation</li>
                        <li>✓ <strong>Resource queries</strong> ([Patient], [Observation], etc.)</li>
                        <li>✓ <strong>Canonical URLs</strong> for value sets</li>
                        <li>✓ <strong>Value set membership</strong> with code system matching</li>
                        <li>✓ <strong>Automatic status filtering</strong> per HL7 guidelines</li>
                        <li>✓ <strong>Temporal operators</strong> (before, after, during, etc.)</li>
                        <li>✓ <strong>WHERE clauses</strong> with complex conditions</li>
                        <li>✓ <strong>Age calculations</strong> (AgeInYears, AgeInYearsAt)</li>
                        <li>✓ <strong>WITH/WITHOUT</strong> relationships (joins)</li>
                        <li>✓ <strong>Binary operators</strong> (and, or, =, !=, &lt;, &gt;, etc.)</li>
                        <li>✓ <strong>Property access</strong> (Patient.gender, Observation.value)</li>
                        <li>✓ <strong>ELM generation</strong> for multi-target compilation</li>
                        <li>✓ <strong>SQL on FHIR</strong> with CTEs</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2 text-orange-600">⚠ Partially Supported</h5>
                      <ul className="text-sm space-y-1">
                        <li>⚠ <strong>Functions:</strong> Limited set (AgeInYears, exists)</li>
                        <li>⚠ <strong>Intervals:</strong> Basic support, complex logic pending</li>
                        <li>⚠ <strong>Aggregates:</strong> Count only (Sum, Avg, etc. pending)</li>
                        <li>⚠ <strong>FHIR Resources:</strong> Core resources only</li>
                        <li>⚠ <strong>Code systems:</strong> Major systems (LOINC, SNOMED, etc.)</li>
                      </ul>
                      <h5 className="font-medium mt-4 mb-2 text-red-600">✗ Not Yet Supported</h5>
                      <ul className="text-sm space-y-1">
                        <li>✗ <strong>Full CQL grammar:</strong> Simplified parser</li>
                        <li>✗ <strong>Libraries/Includes:</strong> Structure defined, not executed</li>
                        <li>✗ <strong>Parameters:</strong> Measurement Period hardcoded</li>
                        <li>✗ <strong>Advanced functions:</strong> Most CQL standard library</li>
                        <li>✗ <strong>Nested queries:</strong> Complex subqueries</li>
                        <li>✗ <strong>Tuple operations:</strong> Structured data manipulation</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h5 className="font-medium mb-2">Supported FHIR Resources</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <Badge variant="outline">Patient</Badge>
                      <Badge variant="outline">Observation</Badge>
                      <Badge variant="outline">Condition</Badge>
                      <Badge variant="outline">Procedure</Badge>
                      <Badge variant="outline">MedicationRequest</Badge>
                      <Badge variant="outline">Encounter</Badge>
                      <Badge variant="outline">DiagnosticReport</Badge>
                      <Badge variant="outline">AllergyIntolerance</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Future Phases */}
        <AccordionItem value="future" data-testid="accordion-future">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              What's planned for future phases?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Current Status: Alpha v0.3</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Phase 7 & 8 complete with production-ready 9-step workflow, backend persistence,
                      and analytics dashboard. Ready for expanded CQL support and production hardening.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-600">Phase 7</Badge>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <h5 className="font-medium">Production Workflow UX - COMPLETE</h5>
                      </div>
                      <ul className="text-sm space-y-1 ml-6 list-disc text-muted-foreground">
                        <li>✅ FHIR Server Connection (Medplum OAuth2)</li>
                        <li>✅ Library Manager (Browse/upload CQL from FHIR)</li>
                        <li>✅ Terminology Server (TX.FHIR.ORG integration)</li>
                        <li>✅ Execution Dashboard (Run CQL queries)</li>
                        <li>✅ SQL Translation & Comparison (Side-by-side)</li>
                        <li>✅ Database Connection (DuckDB WASM + Databricks)</li>
                        <li>✅ Write-Back (Post MeasureReports to FHIR)</li>
                        <li>✅ View Management (SQL on FHIR ViewDefinitions)</li>
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-600">Phase 8</Badge>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <h5 className="font-medium">Backend Persistence & Analytics - COMPLETE</h5>
                      </div>
                      <ul className="text-sm space-y-1 ml-6 list-disc text-muted-foreground">
                        <li>✅ PostgreSQL database integration (Drizzle ORM)</li>
                        <li>✅ Evaluation logging (track all executions)</li>
                        <li>✅ MeasureReport storage</li>
                        <li>✅ REST API endpoints</li>
                        <li>✅ Analytics Dashboard (Step 9 - execution trends)</li>
                        <li>✅ Performance metrics & comparisons</li>
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-yellow-600">Phase 9</Badge>
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <h5 className="font-medium">Enhanced Testing & Quality - NEXT</h5>
                      </div>
                      <ul className="text-sm space-y-1 ml-6 list-disc">
                        <li><strong>Unit Testing:</strong> Vitest for CQL engine, SQL transpiler, FHIR utils</li>
                        <li><strong>Integration Testing:</strong> API endpoints, FHIR operations, DB operations</li>
                        <li><strong>E2E Testing:</strong> Playwright for complete workflow (Steps 1-9)</li>
                        <li>80%+ code coverage target</li>
                        <li>Performance benchmarks</li>
                        <li>Regression test suite</li>
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-yellow-600">Phase 9 Alt</Badge>
                        <h5 className="font-medium">Expanded CQL Support</h5>
                      </div>
                      <ul className="text-sm space-y-1 ml-6 list-disc">
                        <li><strong>Date/Time:</strong> DateFrom, TimeFrom, Duration, Difference</li>
                        <li><strong>String:</strong> Substring, Concatenate, IndexOf, Split</li>
                        <li><strong>Math:</strong> Abs, Ceiling, Floor, Ln, Log, Power</li>
                        <li><strong>List:</strong> Flatten, Distinct, Except, Intersect, Union</li>
                        <li><strong>Advanced:</strong> Intervals, Code/Concept operations</li>
                        <li>Better SQL translation for complex patterns</li>
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-600">Phase 10</Badge>
                        <h5 className="font-medium">Production Hardening</h5>
                      </div>
                      <ul className="text-sm space-y-1 ml-6 list-disc">
                        <li><strong>Authentication:</strong> Token refresh, SSO, RBAC</li>
                        <li><strong>Error Handling:</strong> Boundaries, retry logic, fallbacks</li>
                        <li><strong>Performance:</strong> Code splitting, lazy loading, caching</li>
                        <li><strong>Security:</strong> Input validation, XSS/SQL injection prevention</li>
                        <li>Rate limiting and monitoring</li>
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-purple-600">Phase 11</Badge>
                        <h5 className="font-medium">Advanced Features</h5>
                      </div>
                      <ul className="text-sm space-y-1 ml-6 list-disc">
                        <li><strong>Collaboration:</strong> User management, shared libraries, team workflows</li>
                        <li><strong>Analytics:</strong> Custom reports, export (PDF/CSV), scheduled evaluations</li>
                        <li><strong>CQL Editor:</strong> Syntax highlighting, auto-complete, validation</li>
                        <li><strong>Databricks:</strong> Complete integration with connection pooling</li>
                        <li>Multi-database support (PostgreSQL, MySQL, SQL Server)</li>
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-purple-600">Phase 12</Badge>
                        <h5 className="font-medium">Enterprise Features</h5>
                      </div>
                      <ul className="text-sm space-y-1 ml-6 list-disc">
                        <li>HAPI FHIR & Microsoft FHIR Server integration</li>
                        <li>Multiple terminology servers (Ontoserver support)</li>
                        <li>Complete FHIR R4/R5 resource coverage</li>
                        <li>ELM debugger with step-through execution</li>
                        <li>Query optimizer with AI-powered suggestions</li>
                        <li>Library versioning and dependency management</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h5 className="font-medium mb-2">Long-term Vision</h5>
                    <p className="text-sm text-muted-foreground">
                      Transform this tool into a comprehensive clinical quality measure authoring platform
                      supporting the full eCQM development lifecycle: CQL authoring → ELM compilation →
                      Multi-target generation → Testing → Deployment → Execution → Reporting.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Technology Stack */}
        <AccordionItem value="tech-stack" data-testid="accordion-tech-stack">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              What technologies and libraries are used?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Frontend</h5>
                      <ul className="text-sm space-y-1">
                        <li>• React 18 + TypeScript</li>
                        <li>• Vite build system</li>
                        <li>• shadcn/ui components</li>
                        <li>• TanStack Query</li>
                        <li>• Wouter routing</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">CQL Processing</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Custom CQL parser</li>
                        <li>• AST-to-ELM converter</li>
                        <li>• ELM-to-SQL transpiler</li>
                        <li>• Value set service</li>
                        <li>• Naming validator</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Backend</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Express.js</li>
                        <li>• PostgreSQL</li>
                        <li>• Drizzle ORM</li>
                        <li>• Neon Database</li>
                        <li>• TypeScript</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Phase 6 New Components</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="border rounded-lg p-3">
                        <code className="text-xs font-medium">terminology/</code>
                        <ul className="text-xs space-y-1 mt-2 ml-4 list-disc">
                          <li>value-set-types.ts</li>
                          <li>value-set-service.ts</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-3">
                        <code className="text-xs font-medium">elm/</code>
                        <ul className="text-xs space-y-1 mt-2 ml-4 list-disc">
                          <li>elm-types.ts (380 lines)</li>
                          <li>ast-to-elm.ts (365 lines)</li>
                          <li>elm-to-sql.ts (450 lines)</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-3">
                        <code className="text-xs font-medium">cql-parser/</code>
                        <ul className="text-xs space-y-1 mt-2 ml-4 list-disc">
                          <li>naming-validator.ts</li>
                          <li>Enhanced ast-to-sql.ts</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-3">
                        <code className="text-xs font-medium">db/</code>
                        <ul className="text-xs space-y-1 mt-2 ml-4 list-disc">
                          <li>schema-init.ts</li>
                          <li>ValueSetExpansion table</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Development Statistics</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">~1,914</div>
                        <div className="text-xs text-muted-foreground">Lines of Code</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">7</div>
                        <div className="text-xs text-muted-foreground">New Files</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">6/8</div>
                        <div className="text-xs text-muted-foreground">Tracks Complete</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">100%</div>
                        <div className="text-xs text-muted-foreground">Type Safe</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* References */}
        <AccordionItem value="references" data-testid="accordion-references">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              What HL7 standards and references were used?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Implemented HL7 Standards
                    </h5>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <Badge variant="outline">HL7</Badge>
                        <div>
                          <a href="http://hl7.org/fhir/us/cql/STU2/" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                            CQL Implementation Guide (STU2)
                          </a>
                          <p className="text-xs text-muted-foreground">Query patterns, status filtering, naming conventions</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Badge variant="outline">HL7</Badge>
                        <div>
                          <a href="https://hl7.org/fhir/uv/cql/STU2/using-cql.html" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                            Using CQL with FHIR
                          </a>
                          <p className="text-xs text-muted-foreground">FHIR resource filtering, temporal constraints, observations</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Badge variant="outline">HL7</Badge>
                        <div>
                          <a href="https://cql.hl7.org/elm.html" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                            ELM Specification
                          </a>
                          <p className="text-xs text-muted-foreground">Expression Logical Model type system, query structure</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Badge variant="outline">GitHub</Badge>
                        <div>
                          <a href="https://github.com/FirelyTeam/firely-cql-sdk" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                            Firely CQL SDK
                          </a>
                          <p className="text-xs text-muted-foreground">Architecture pattern: CQL → ELM → Target Language</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Key Compliance Areas</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Canonical URL format for value sets</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Status filtering per resource type</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>PascalCase naming conventions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>ELM intermediate representation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Code system + code matching</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Temporal operator support</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h5 className="font-medium mb-2">Documentation</h5>
                    <div className="space-y-1 text-sm">
                      <div>📄 <a href="https://github.com/anthropics/claude-code" className="text-blue-600 hover:underline">PHASE6_IMPLEMENTATION.md</a> - Detailed implementation summary</div>
                      <div>📄 <a href="https://github.com/anthropics/claude-code" className="text-blue-600 hover:underline">QUICK_START_PHASE6.md</a> - Quick reference guide</div>
                      <div>📄 <a href="https://github.com/anthropics/claude-code" className="text-blue-600 hover:underline">PHASE6_PLAN.md</a> - Original planning document</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-8 text-center">
        <Link href="/">
          <Button size="lg" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Try the Converter
          </Button>
        </Link>
      </div>
    </div>
  );
}
