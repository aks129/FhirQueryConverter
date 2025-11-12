/**
 * Demo Page - Potential Healthcare Applications
 *
 * Explores possibilities for FHIR Query Converter in healthcare data analytics
 * and quality measure evaluation at scale
 */

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  Building2,
  Database,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Zap,
  BarChart3,
  FileCode,
  Play,
  Shield,
} from "lucide-react";

export default function Demo() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="mb-4">
              Possibilities & Use Cases
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Exploring the Future:
              <br />
              <span className="text-primary">Quality Measure Analytics at Scale</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Imagine analyzing millions of patient records for quality reporting using CQL and modern data platforms like Databricks — all without weeks of manual SQL development
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/workflow">
                <Button size="lg" className="gap-2">
                  Try Live Demo
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2">
                <Play className="h-5 w-5" />
                Watch Video
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Potential Scenario */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                <Building2 className="h-3 w-3 mr-1" />
                Example Healthcare Scenario
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Envisioning the Challenge: Medicare Star Ratings Quality Measures
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Consider a scenario where a health plan could calculate 15 HEDIS quality measures across millions of patient records for CMS Star Ratings reporting
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Millions of Patients</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Potential to analyze large-scale member populations across multiple states and health plans
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Database className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Terabyte-Scale Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Could process claims, clinical records, pharmacy, lab results in modern data lake platforms
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Regular Reporting</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Enable frequent quality metrics updates to support ongoing quality improvement initiatives
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Required Quality Measures (CQL-Defined)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Badge variant="outline">Diabetes Care</Badge>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      <li>HbA1c Testing (CDC-H9)</li>
                      <li>Eye Exams (CDC-E)</li>
                      <li>Kidney Disease Monitoring (CDC-K)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline">Cardiovascular</Badge>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      <li>Hypertension Control (CBP)</li>
                      <li>Statin Therapy (SPC)</li>
                      <li>ACE/ARB for Diabetes (MED-D)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline">Preventive Care</Badge>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      <li>Breast Cancer Screening (BCS)</li>
                      <li>Colorectal Cancer Screening (COL)</li>
                      <li>Immunization Status (IMA)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline">Medication Management</Badge>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      <li>Med Adherence - Diabetes (MAD)</li>
                      <li>Med Adherence - Hypertension (MAH)</li>
                      <li>Potentially Harmful Drugs (DAE)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Current State Doesn't Work */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="destructive" className="mb-4">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Potential Challenges
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Traditional Approach: What Organizations Might Face
              </h2>
            </div>

            <Tabs defaultValue="timeline" className="mb-8">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="costs">Hidden Costs</TabsTrigger>
                <TabsTrigger value="risks">Business Risks</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Typical Development Cycle: Potentially 14-18 Weeks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="min-w-[120px]">
                          <Badge variant="outline">Week 1-3</Badge>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">CQL Specification Analysis</h4>
                          <p className="text-sm text-muted-foreground">
                            Clinical analysts could spend weeks parsing HEDIS specifications and CQL logic for multiple measures
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="min-w-[120px]">
                          <Badge variant="outline">Week 4-10</Badge>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">SQL Development</h4>
                          <p className="text-sm text-muted-foreground">
                            Data engineers might hand-code thousands of lines of SQL queries, JOINs across many tables, complex date logic
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="min-w-[120px]">
                          <Badge variant="outline">Week 11-14</Badge>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Testing & Validation</h4>
                          <p className="text-sm text-muted-foreground">
                            QA teams would need to validate results against CQL reference implementations, potentially finding discrepancies requiring rework
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="min-w-[120px]">
                          <Badge variant="outline">Week 15-18</Badge>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Bug Fixes & Reconciliation</h4>
                          <p className="text-sm text-muted-foreground">
                            Iterative debugging cycles could be needed as clinical logic errors are discovered during testing
                          </p>
                        </div>
                      </div>
                    </div>

                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Potential Risk</AlertTitle>
                      <AlertDescription>
                        Specifications may be updated during development, potentially requiring significant rework
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="costs" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <DollarSign className="h-8 w-8 text-red-600 mb-2" />
                      <CardTitle>Potential Development Costs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-sm">Clinical Analysts (multiple weeks)</span>
                        <span className="font-semibold">$$$</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-sm">Data Engineers (extended effort)</span>
                        <span className="font-semibold">$$$</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-sm">QA Specialists (testing cycles)</span>
                        <span className="font-semibold">$$</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-sm">Cloud Compute (dev + test)</span>
                        <span className="font-semibold">$$</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 text-lg font-bold">
                        <span>Estimated Total</span>
                        <span className="text-red-600">Significant</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <TrendingUp className="h-8 w-8 text-orange-600 mb-2" />
                      <CardTitle>Potential Opportunity Costs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Alert>
                        <AlertDescription className="text-sm">
                          <strong>Delayed Insights:</strong> Extended timelines could delay identification of improvement opportunities
                        </AlertDescription>
                      </Alert>
                      <Alert>
                        <AlertDescription className="text-sm">
                          <strong>Resource Allocation:</strong> Large teams dedicated to manual development may limit capacity for other initiatives
                        </AlertDescription>
                      </Alert>
                      <Alert>
                        <AlertDescription className="text-sm">
                          <strong>Engineering Bottleneck:</strong> Teams focused on one project may struggle to support ad-hoc queries or new measure pilots
                        </AlertDescription>
                      </Alert>
                      <Alert>
                        <AlertDescription className="text-sm">
                          <strong>Compliance Risk:</strong> Extended development could impact reporting timelines and quality assurance processes
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="risks" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border-red-200">
                    <CardHeader>
                      <AlertTriangle className="h-8 w-8 text-red-600 mb-2" />
                      <CardTitle>Potential Technical Challenges</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-600 mt-2" />
                          <div>
                            <p className="font-semibold text-sm">Logic Drift</p>
                            <p className="text-xs text-muted-foreground">
                              Manual SQL translation could introduce discrepancies vs. authoritative CQL specifications
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-600 mt-2" />
                          <div>
                            <p className="font-semibold text-sm">Maintenance Burden</p>
                            <p className="text-xs text-muted-foreground">
                              CQL updates might require re-engineering significant portions of custom SQL code
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-600 mt-2" />
                          <div>
                            <p className="font-semibold text-sm">Scalability Constraints</p>
                            <p className="text-xs text-muted-foreground">
                              Adding new measures could require extended development time for each addition
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-600 mt-2" />
                          <div>
                            <p className="font-semibold text-sm">Knowledge Silos</p>
                            <p className="text-xs text-muted-foreground">
                              Complex SQL implementations may be difficult for clinical teams to verify and validate
                            </p>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200">
                    <CardHeader>
                      <Shield className="h-8 w-8 text-orange-600 mb-2" />
                      <CardTitle>Potential Business Impacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-600 mt-2" />
                          <div>
                            <p className="font-semibold text-sm">Quality Metrics Impact</p>
                            <p className="text-xs text-muted-foreground">
                              Calculation errors could affect quality reporting accuracy and organizational outcomes
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-600 mt-2" />
                          <div>
                            <p className="font-semibold text-sm">Audit Challenges</p>
                            <p className="text-xs text-muted-foreground">
                              Demonstrating compliance with CQL specifications may be more difficult with custom SQL implementations
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-600 mt-2" />
                          <div>
                            <p className="font-semibold text-sm">Competitive Positioning</p>
                            <p className="text-xs text-muted-foreground">
                              Slower insights could mean delayed identification of quality improvement opportunities
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-600 mt-2" />
                          <div>
                            <p className="font-semibold text-sm">Team Satisfaction</p>
                            <p className="text-xs text-muted-foreground">
                              Repetitive manual development work could impact engineer engagement and retention
                            </p>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="border-b bg-gradient-to-b from-green-50 to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="default" className="mb-4 bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Potential Solution
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                FHIR Query Converter: Envisioning CQL to SQL Automation
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Explore the possibility of automatically transpiling CQL quality measures to optimized SQL queries for execution against large-scale healthcare datasets
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <Zap className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>Traditional Approach: Weeks to Months</CardTitle>
                  <CardDescription>Manual SQL development cycle</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Multiple weeks: CQL analysis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Multiple weeks: SQL development</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Multiple weeks: Testing & QA</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Additional time: Bug fixes</span>
                    </li>
                    <li className="flex items-center gap-2 pt-2 border-t font-semibold text-red-600">
                      <DollarSign className="h-4 w-4" />
                      <span>Significant resource investment</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-green-600 bg-green-600 text-white">
                <CardHeader>
                  <Zap className="h-8 w-8 mb-2" />
                  <CardTitle>Automated Approach: Days</CardTitle>
                  <CardDescription className="text-green-100">
                    Potential automated CQL transpilation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Minutes: Upload CQL libraries</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Minutes: Auto-generate SQL</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Short period: Review & validate</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Short period: Deployment</span>
                    </li>
                    <li className="flex items-center gap-2 pt-2 border-t border-green-500 font-semibold">
                      <DollarSign className="h-4 w-4" />
                      <span>Dramatically reduced costs</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Key Benefits */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-lg">Potential Time Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Could dramatically reduce development time from weeks to days, enabling more frequent quality measure analysis.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <DollarSign className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-lg">Potential Cost Reduction</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    May significantly reduce resource requirements per reporting cycle, improving operational efficiency.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-lg">CQL Specification Fidelity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Aims to maintain alignment with authoritative CQL specifications, supporting audit and compliance processes.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* How It Could Work */}
            <Card className="border-2 border-green-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Envisioned Workflow: 8-Step Potential Process
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-4 p-3 border rounded-lg">
                    <Badge className="bg-green-600 min-w-[32px] justify-center">1</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">Connect to FHIR Server</h4>
                      <p className="text-xs text-muted-foreground">
                        Could authenticate to FHIR R4 servers (e.g., Medplum) to access CQL Library resources
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 border rounded-lg">
                    <Badge className="bg-green-600 min-w-[32px] justify-center">2</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">Load CQL Libraries</h4>
                      <p className="text-xs text-muted-foreground">
                        Browse or upload CQL files representing quality measures (e.g., HEDIS specifications)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 border rounded-lg">
                    <Badge className="bg-green-600 min-w-[32px] justify-center">3</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">Connect Terminology Server</h4>
                      <p className="text-xs text-muted-foreground">
                        Expand value sets (SNOMED, LOINC, RxNorm) from terminology services for code lookups
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 border rounded-lg">
                    <Badge className="bg-green-600 min-w-[32px] justify-center">4</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">Auto-Generate SQL</h4>
                      <p className="text-xs text-muted-foreground">
                        Transform CQL through AST and ELM to optimized SQL with appropriate JOINs, WHERE clauses, and aggregations
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 border rounded-lg">
                    <Badge className="bg-green-600 min-w-[32px] justify-center">5</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">Connect to Data Platform</h4>
                      <p className="text-xs text-muted-foreground">
                        Point to data lake tables (claims, encounters, observations) in platforms like Databricks
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 border rounded-lg">
                    <Badge className="bg-green-600 min-w-[32px] justify-center">6</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">Execute at Scale</h4>
                      <p className="text-xs text-muted-foreground">
                        Run SQL against millions of records using modern query engines and parallelization
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 border rounded-lg">
                    <Badge className="bg-green-600 min-w-[32px] justify-center">7</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">Generate MeasureReports</h4>
                      <p className="text-xs text-muted-foreground">
                        Produce FHIR MeasureReport resources with measure-specific results (numerator, denominator, exclusions)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 border rounded-lg">
                    <Badge className="bg-green-600 min-w-[32px] justify-center">8</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">Write Back to FHIR</h4>
                      <p className="text-xs text-muted-foreground">
                        POST results to FHIR server for downstream analytics, dashboards, and reporting workflows
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Results & Impact */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                <BarChart3 className="h-3 w-3 mr-1" />
                Potential Impact
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Envisioned Comparison: Traditional vs. Automated
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Traditional Manual Approach</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Development Cycle</span>
                      <span className="font-semibold text-red-600">Weeks to months</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Team Size</span>
                      <span className="font-semibold">Multiple specialists</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cost per Cycle</span>
                      <span className="font-semibold text-red-600">High</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Update Frequency</span>
                      <span className="font-semibold">Limited by resources</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Logic Accuracy</span>
                      <span className="font-semibold">Risk of manual errors</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time to Insight</span>
                      <span className="font-semibold text-red-600">Extended timeline</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2 mt-2">
                      <span className="font-semibold">Annual Impact</span>
                      <span className="font-semibold text-red-600 text-lg">Significant</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-600">
                <CardHeader>
                  <CardTitle className="text-green-600">
                    Potential Automated Approach
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Development Cycle</span>
                      <span className="font-semibold text-green-600">Days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Team Size</span>
                      <span className="font-semibold">Minimal</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cost per Cycle</span>
                      <span className="font-semibold text-green-600">Reduced</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Update Frequency</span>
                      <span className="font-semibold">On-demand capability</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Logic Accuracy</span>
                      <span className="font-semibold">CQL-specification aligned</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time to Insight</span>
                      <span className="font-semibold text-green-600">Rapid</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2 mt-2">
                      <span className="font-semibold">Annual Impact</span>
                      <span className="font-semibold text-green-600 text-lg">Optimized</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 border-2 border-green-600 bg-green-50">
              <CardHeader>
                <CardTitle className="text-2xl text-center">
                  Potential Value Proposition
                </CardTitle>
                <CardDescription className="text-center text-base">
                  Dramatic reduction in development time and costs while improving accuracy and agility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-green-600 mb-2">10-20x</div>
                    <div className="text-sm text-muted-foreground">Potential Speed Improvement</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600 mb-2">High</div>
                    <div className="text-sm text-muted-foreground">Potential ROI</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600 mb-2">Strong</div>
                    <div className="text-sm text-muted-foreground">CQL Alignment</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Explore the Possibilities
            </h2>
            <p className="text-lg opacity-90">
              Try the interactive workflow demonstration with CQL libraries and sample FHIR data to see how automated transpilation could work.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/workflow">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 bg-white text-primary hover:bg-white/90"
                >
                  Explore Interactive Demo
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-white text-white hover:bg-white/10"
              >
                Learn More
              </Button>
            </div>
            <p className="text-sm opacity-75 pt-4">
              Demonstrating the potential of CQL to SQL automation for healthcare quality measures
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
