import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, Database, Workflow, Zap, GitBranch, Server, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function FAQ() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
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
        <h1 className="text-3xl font-bold mb-4">Architecture & Methodology FAQ</h1>
        <p className="text-lg text-muted-foreground">
          Understanding the backend architecture and conversion methodology for CQL-to-SQL on FHIR
        </p>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        <AccordionItem value="overview" data-testid="accordion-overview">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Workflow className="w-5 h-5" />
              What is the overall system architecture?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Badge variant="outline" className="mb-2">Frontend Layer</Badge>
                    <p>React + TypeScript application with shadcn/ui components for the user interface. Handles CQL input, FHIR bundle uploads, and results display.</p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Processing Layer</Badge>
                    <p>Two parallel evaluation engines: Direct CQL execution using cql-execution library, and CQL-to-SQL transpilation with SQL on FHIR evaluation.</p>
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2">Data Layer</Badge>
                    <p>FHIR bundle processing, SQL view generation, and in-memory database simulation for proof-of-concept demonstration.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="cql-engine" data-testid="accordion-cql-engine">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              How does the direct CQL evaluation engine work?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">CQL Parsing & Execution</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li><strong>Input Processing:</strong> CQL code is parsed to extract define statements and expressions</li>
                    <li><strong>Context Creation:</strong> FHIR bundle is loaded into a patient context for evaluation</li>
                    <li><strong>Expression Evaluation:</strong> Each CQL define statement is evaluated against the FHIR resources</li>
                    <li><strong>Result Generation:</strong> Produces a FHIR MeasureReport with population counts and metrics</li>
                  </ol>
                  <div className="bg-muted p-4 rounded-lg">
                    <code className="text-sm">
                      define "Initial Population": Patient P where P.gender = 'female'<br/>
                      define "Numerator": [Observation: "Heart Rate"] O where O.value &gt; 100
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sql-transpiler" data-testid="accordion-sql-transpiler">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              How does the CQL-to-SQL transpilation work?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Transpilation Process</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">1. CQL Analysis</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Parse define statements</li>
                        <li>• Extract filter conditions</li>
                        <li>• Identify FHIR resource references</li>
                        <li>• Map clinical concepts to SQL patterns</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">2. SQL Generation</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Create base FHIR views (Patient_view, Observation_view)</li>
                        <li>• Generate CTEs for each population</li>
                        <li>• Apply filters and joins</li>
                        <li>• Calculate aggregated results</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
{`-- Generated SQL from CQL
WITH Patient_view AS (
  SELECT id, gender, age FROM patients
),
InitialPopulation AS (
  SELECT p.id FROM Patient_view p 
  WHERE p.gender = 'female'
),
Numerator AS (
  SELECT DISTINCT ip.patient_id 
  FROM InitialPopulation ip
  JOIN Observation_view o ON o.subject_id = ip.patient_id
  WHERE o.code_text = 'Heart Rate' AND o.value_quantity > 100
)`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="va-concepts" data-testid="accordion-va-concepts">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              What concepts were integrated from the VA CQL transpiler?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Enhanced Pattern Matching</h4>
                  <div className="space-y-3">
                    <div>
                      <Badge variant="secondary" className="mb-1">Regex-based CQL Parsing</Badge>
                      <p className="text-sm">Advanced regular expressions to identify clinical patterns like gender filters, age calculations, and value comparisons.</p>
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-1">FHIR Code Mapping</Badge>
                      <p className="text-sm">Automatic translation of LOINC codes to human-readable names (e.g., '8867-4' → 'Heart Rate').</p>
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-1">SQL on FHIR Views</Badge>
                      <p className="text-sm">Structured view definitions following SQL on FHIR specification for consistent data access patterns.</p>
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-1">Modular CTE Generation</Badge>
                      <p className="text-sm">Common Table Expressions (CTEs) for each population definition, enabling complex hierarchical queries.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="fhir-processing" data-testid="accordion-fhir-processing">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              How are FHIR bundles processed and converted?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">FHIR Bundle Processing Pipeline</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                      <div>
                        <h5 className="font-medium">Bundle Validation</h5>
                        <p className="text-sm text-muted-foreground">Verify FHIR bundle structure and resource types</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                      <div>
                        <h5 className="font-medium">Resource Extraction</h5>
                        <p className="text-sm text-muted-foreground">Separate Patient, Observation, and other resources into typed collections</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                      <div>
                        <h5 className="font-medium">View Flattening</h5>
                        <p className="text-sm text-muted-foreground">Convert hierarchical FHIR structures to relational table views</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</div>
                      <div>
                        <h5 className="font-medium">SQL Simulation</h5>
                        <p className="text-sm text-muted-foreground">Execute generated SQL queries against the flattened views</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="performance" data-testid="accordion-performance">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              How are performance metrics calculated and compared?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Performance Monitoring</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Execution Metrics</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Evaluation time (milliseconds)</li>
                        <li>• Memory usage tracking</li>
                        <li>• Resource count processed</li>
                        <li>• Query complexity analysis</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Quality Measures</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Initial Population count</li>
                        <li>• Denominator population</li>
                        <li>• Numerator count</li>
                        <li>• Percentage score calculation</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <h6 className="font-medium mb-2">Comparative Analysis</h6>
                    <p className="text-sm">Both evaluation methods generate identical FHIR MeasureReport structures, enabling direct comparison of results, performance characteristics, and implementation approaches for the same clinical quality measure.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="technology-stack" data-testid="accordion-technology-stack">
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
                      <h5 className="font-medium mb-2">Core Libraries</h5>
                      <ul className="text-sm space-y-1">
                        <li>• cql-execution</li>
                        <li>• cql-testing</li>
                        <li>• cql-exec-fhir</li>
                        <li>• drizzle-orm</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Frontend</h5>
                      <ul className="text-sm space-y-1">
                        <li>• React + TypeScript</li>
                        <li>• Vite build system</li>
                        <li>• shadcn/ui components</li>
                        <li>• TanStack Query</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Backend</h5>
                      <ul className="text-sm space-y-1">
                        <li>• Express.js</li>
                        <li>• PostgreSQL</li>
                        <li>• Neon Database</li>
                        <li>• TypeScript</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="limitations" data-testid="accordion-limitations">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              What are the current limitations and future enhancements?
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium mb-2 text-orange-600">Current Limitations</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Proof-of-concept with simplified CQL parsing</li>
                      <li>• In-memory SQL simulation instead of real database</li>
                      <li>• Limited FHIR resource type support</li>
                      <li>• Basic temporal logic handling</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2 text-green-600">Future Enhancements</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Full CQL-to-ELM translation integration</li>
                      <li>• Real SQL database with SQL on FHIR</li>
                      <li>• Complete FHIR R4 resource support</li>
                      <li>• Advanced temporal and interval logic</li>
                      <li>• Performance optimization and caching</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}