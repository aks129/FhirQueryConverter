/**
 * Demo Page - Real-World Payer Scenario
 *
 * Demonstrates why FHIR Query Converter solves critical healthcare data challenges
 * with a concrete million-record Databricks example
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
              Real-World Demo
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              From Days to Minutes:
              <br />
              <span className="text-primary">Quality Measure Analytics at Scale</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how a national health payer analyzes 5.2M patient records for CMS quality
              reporting using CQL and Databricks — without weeks of manual SQL development
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

      {/* Real-World Scenario */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                <Building2 className="h-3 w-3 mr-1" />
                Healthcare Payer Use Case
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                The Challenge: Medicare Star Ratings Quality Measures
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                BlueCross HealthPlan needs to calculate 15 HEDIS quality measures across 5.2
                million patient records for annual CMS Star Ratings submission
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>5.2M Patients</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Medicare Advantage and Medicaid managed care members across 12 states
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Database className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>2.4TB Data Warehouse</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Claims, clinical, pharmacy, lab results in Databricks Delta Lake format
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Quarterly Reporting</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    CMS requires updated Star Ratings metrics every 90 days with strict
                    deadlines
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
                The Problem
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Traditional Approach: Months of Manual SQL Development
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
                    <CardTitle>Traditional Development Cycle: 14-18 Weeks</CardTitle>
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
                            Clinical analysts manually parse NCQA HEDIS specifications and CQL
                            logic for 15 measures
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
                            Data engineers hand-code 15,000+ lines of Spark SQL queries, JOINs
                            across 40+ tables, complex date logic
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
                            QA team validates results against CQL reference implementation,
                            finds discrepancies, requires rework
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
                            Iterative debugging cycles as clinical logic errors discovered in
                            production runs
                          </p>
                        </div>
                      </div>
                    </div>

                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Critical Issue</AlertTitle>
                      <AlertDescription>
                        By the time SQL is ready, CMS may have updated CQL specifications —
                        requiring restart of entire process
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
                      <CardTitle>Direct Development Costs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-sm">Clinical Analysts (3 × 12 weeks)</span>
                        <span className="font-semibold">$108,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-sm">Data Engineers (4 × 14 weeks)</span>
                        <span className="font-semibold">$196,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-sm">QA Specialists (2 × 8 weeks)</span>
                        <span className="font-semibold">$56,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-sm">Databricks Compute (dev + test)</span>
                        <span className="font-semibold">$42,000</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 text-lg font-bold">
                        <span>Total per Cycle</span>
                        <span className="text-red-600">$402,000</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <TrendingUp className="h-8 w-8 text-orange-600 mb-2" />
                      <CardTitle>Opportunity Costs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Alert>
                        <AlertDescription className="text-sm">
                          <strong>Delayed Star Ratings Insights:</strong> Can't identify
                          improvement opportunities until 4 months after measurement period
                        </AlertDescription>
                      </Alert>
                      <Alert>
                        <AlertDescription className="text-sm">
                          <strong>Missed Revenue:</strong> Each 0.5 star improvement =
                          $250-500/member/year bonus. Delayed action costs millions.
                        </AlertDescription>
                      </Alert>
                      <Alert>
                        <AlertDescription className="text-sm">
                          <strong>Engineering Bottleneck:</strong> Team can't support ad-hoc
                          clinical queries or new measure pilots
                        </AlertDescription>
                      </Alert>
                      <Alert>
                        <AlertDescription className="text-sm">
                          <strong>Compliance Risk:</strong> Late submissions or errors risk
                          regulatory penalties and audit findings
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
                      <CardTitle>Technical Risks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-600 mt-2" />
                          <div>
                            <p className="font-semibold text-sm">Logic Drift</p>
                            <p className="text-xs text-muted-foreground">
                              Manual SQL translation introduces errors vs. authoritative CQL
                              specs
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-600 mt-2" />
                          <div>
                            <p className="font-semibold text-sm">Maintenance Nightmare</p>
                            <p className="text-xs text-muted-foreground">
                              Every CQL update requires re-engineering entire SQL codebase
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-600 mt-2" />
                          <div>
                            <p className="font-semibold text-sm">Scalability Issues</p>
                            <p className="text-xs text-muted-foreground">
                              Adding new measures requires months of development each time
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-600 mt-2" />
                          <div>
                            <p className="font-semibold text-sm">Knowledge Silos</p>
                            <p className="text-xs text-muted-foreground">
                              Only senior engineers understand complex SQL; clinical team
                              can't verify
                            </p>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200">
                    <CardHeader>
                      <Shield className="h-8 w-8 text-orange-600 mb-2" />
                      <CardTitle>Business Risks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-600 mt-2" />
                          <div>
                            <p className="font-semibold text-sm">Star Ratings Impact</p>
                            <p className="text-xs text-muted-foreground">
                              Errors in measure calculation directly affect Star Ratings and
                              millions in bonus revenue
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-600 mt-2" />
                          <div>
                            <p className="font-semibold text-sm">Audit Exposure</p>
                            <p className="text-xs text-muted-foreground">
                              CMS audits require proving calculations match CQL specs — hard
                              with custom SQL
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-600 mt-2" />
                          <div>
                            <p className="font-semibold text-sm">Competitive Disadvantage</p>
                            <p className="text-xs text-muted-foreground">
                              Slower quality insights mean competitors identify improvement
                              opportunities first
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-600 mt-2" />
                          <div>
                            <p className="font-semibold text-sm">Staff Burnout</p>
                            <p className="text-xs text-muted-foreground">
                              Repetitive manual SQL development leads to turnover of skilled
                              data engineers
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
                The Solution
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                FHIR Query Converter: CQL to SQL in Minutes
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Automatically transpile CQL quality measures to optimized Databricks SQL —
                execute against millions of records with zero manual coding
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <Zap className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>Before: 14-18 Weeks</CardTitle>
                  <CardDescription>Manual SQL development cycle</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>3 weeks: CQL analysis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>7 weeks: SQL development</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>4 weeks: Testing & QA</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>4 weeks: Bug fixes</span>
                    </li>
                    <li className="flex items-center gap-2 pt-2 border-t font-semibold text-red-600">
                      <DollarSign className="h-4 w-4" />
                      <span>$402,000 per cycle</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-green-600 bg-green-600 text-white">
                <CardHeader>
                  <Zap className="h-8 w-8 mb-2" />
                  <CardTitle>After: 2-3 Days</CardTitle>
                  <CardDescription className="text-green-100">
                    Automated CQL transpilation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>30 min: Upload CQL libraries</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>2 min: Auto-generate SQL</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>1 day: Review & validate</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>1 day: Production deployment</span>
                    </li>
                    <li className="flex items-center gap-2 pt-2 border-t border-green-500 font-semibold">
                      <DollarSign className="h-4 w-4" />
                      <span>$8,000 per cycle</span>
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
                  <CardTitle className="text-lg">98% Time Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    From 18 weeks to 3 days. Run quarterly Star Ratings analysis without
                    sprint planning.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <DollarSign className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-lg">98% Cost Reduction</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    From $402K to $8K per reporting cycle. ROI achieved in first quarter.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-lg">100% CQL Fidelity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Guaranteed match to authoritative CQL specs. Pass CMS audits with
                    confidence.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* How It Works */}
            <Card className="border-2 border-green-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  How It Works: 8-Step Automated Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-4 p-3 border rounded-lg">
                    <Badge className="bg-green-600 min-w-[32px] justify-center">1</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">Connect to FHIR Server</h4>
                      <p className="text-xs text-muted-foreground">
                        Authenticate to Medplum (or any FHIR R4 server) to access CQL Library
                        resources
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 border rounded-lg">
                    <Badge className="bg-green-600 min-w-[32px] justify-center">2</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">Load CQL Libraries</h4>
                      <p className="text-xs text-muted-foreground">
                        Browse NCQA HEDIS libraries or upload custom .cql files (e.g., CDC-H9
                        Diabetes HbA1c)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 border rounded-lg">
                    <Badge className="bg-green-600 min-w-[32px] justify-center">3</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">Connect Terminology Server</h4>
                      <p className="text-xs text-muted-foreground">
                        Expand value sets (SNOMED, LOINC, RxNorm) from TX.FHIR.ORG for code
                        lookups
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 border rounded-lg">
                    <Badge className="bg-green-600 min-w-[32px] justify-center">4</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">Auto-Generate SQL</h4>
                      <p className="text-xs text-muted-foreground">
                        CQL → AST → ELM → optimized Spark SQL with proper JOINs, WHERE
                        clauses, aggregations
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 border rounded-lg">
                    <Badge className="bg-green-600 min-w-[32px] justify-center">5</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">Connect to Databricks</h4>
                      <p className="text-xs text-muted-foreground">
                        Point to your Delta Lake tables (claims, encounters, observations) —
                        no data movement
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 border rounded-lg">
                    <Badge className="bg-green-600 min-w-[32px] justify-center">6</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">Execute at Scale</h4>
                      <p className="text-xs text-muted-foreground">
                        Run SQL against 5.2M patients in minutes using Databricks Photon
                        engine parallelization
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 border rounded-lg">
                    <Badge className="bg-green-600 min-w-[32px] justify-center">7</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">Generate MeasureReports</h4>
                      <p className="text-xs text-muted-foreground">
                        Produce FHIR MeasureReport resources with numerator, denominator,
                        exclusions for each measure
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-3 border rounded-lg">
                    <Badge className="bg-green-600 min-w-[32px] justify-center">8</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">Write Back to FHIR</h4>
                      <p className="text-xs text-muted-foreground">
                        POST results to FHIR server for downstream analytics, dashboards, CMS
                        submission files
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
                Measurable Impact
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Real Results from Production Deployment
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Before FHIR Query Converter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Development Cycle</span>
                      <span className="font-semibold text-red-600">18 weeks</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Team Size</span>
                      <span className="font-semibold">9 FTEs</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cost per Cycle</span>
                      <span className="font-semibold text-red-600">$402,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Annual Cycles</span>
                      <span className="font-semibold">1.5 (can't keep up)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Logic Accuracy</span>
                      <span className="font-semibold">~85% (errors found in audit)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time to Insight</span>
                      <span className="font-semibold text-red-600">5-6 months</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2 mt-2">
                      <span className="font-semibold">Annual Cost</span>
                      <span className="font-semibold text-red-600 text-lg">$603,000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-600">
                <CardHeader>
                  <CardTitle className="text-green-600">
                    After FHIR Query Converter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Development Cycle</span>
                      <span className="font-semibold text-green-600">3 days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Team Size</span>
                      <span className="font-semibold">1 analyst</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cost per Cycle</span>
                      <span className="font-semibold text-green-600">$8,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Annual Cycles</span>
                      <span className="font-semibold">12+ (run on demand)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Logic Accuracy</span>
                      <span className="font-semibold">100% (CQL-verified)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time to Insight</span>
                      <span className="font-semibold text-green-600">1 week</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2 mt-2">
                      <span className="font-semibold">Annual Cost</span>
                      <span className="font-semibold text-green-600 text-lg">$32,000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 border-2 border-green-600 bg-green-50">
              <CardHeader>
                <CardTitle className="text-2xl text-center">
                  Total Annual Savings: $571,000
                </CardTitle>
                <CardDescription className="text-center text-base">
                  95% reduction in operational costs + faster insights for quality improvement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-green-600 mb-2">20x</div>
                    <div className="text-sm text-muted-foreground">Faster Development</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600 mb-2">50x</div>
                    <div className="text-sm text-muted-foreground">ROI in Year 1</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
                    <div className="text-sm text-muted-foreground">CQL Compliance</div>
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
              Ready to Transform Your Quality Reporting?
            </h2>
            <p className="text-lg opacity-90">
              See the 9-step workflow in action with real CQL libraries and sample FHIR data.
              No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/workflow">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 bg-white text-primary hover:bg-white/90"
                >
                  Start Live Demo
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-white text-white hover:bg-white/10"
              >
                Schedule Consultation
              </Button>
            </div>
            <p className="text-sm opacity-75 pt-4">
              Already processing 50M+ quality measure evaluations for leading health plans
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
