/**
 * AI Agent Page - Conversational Healthcare Analytics
 *
 * Explores the potential for AI agents to work with CQL, FHIR, and SQL
 * for natural language-driven quality measure analytics
 */

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowRight,
  Bot,
  MessageSquare,
  Sparkles,
  Database,
  FileCode,
  BarChart3,
  Zap,
  Brain,
  Users,
  LineChart,
  Layout,
  Globe,
  CheckCircle2,
  Lightbulb,
  Target,
  GitBranch,
} from "lucide-react";

export default function AI() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-purple-50 to-background">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="mb-4 border-purple-600 text-purple-600">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Analytics
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Conversational AI Agents:
              <br />
              <span className="text-primary">The Future of Healthcare Analytics</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Imagine AI agents that understand healthcare quality measures, speak FHIR and CQL,
              and can create analytics on demand through natural language conversations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/workflow">
                <Button size="lg" className="gap-2">
                  Try Demo
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="gap-2">
                  <Bot className="h-5 w-5" />
                  See Use Cases
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Vision */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                <Brain className="h-3 w-3 mr-1" />
                The Vision
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Natural Language to Healthcare Insights
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                By combining computable CQL logic, structured FHIR data models, and SQL execution capabilities,
                AI agents could revolutionize how healthcare organizations interact with quality measure data
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="border-purple-200">
                <CardHeader>
                  <FileCode className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle className="text-lg">Computable Logic</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    CQL provides standardized, machine-readable definitions of clinical quality measures
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader>
                  <Database className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle className="text-lg">Structured Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    FHIR resources provide semantic understanding of healthcare data structures and relationships
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader>
                  <Zap className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle className="text-lg">SQL Execution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Automated CQL-to-SQL transpilation enables agents to query large-scale healthcare datasets
                  </p>
                </CardContent>
              </Card>
            </div>

            <Alert className="border-purple-200 bg-purple-50">
              <Lightbulb className="h-4 w-4 text-purple-600" />
              <AlertDescription>
                <strong>The Key Insight:</strong> With computable CQL logic and FHIR context, AI agents
                could understand not just the syntax of queries, but the semantic meaning of healthcare
                quality measures — enabling them to reason about clinical logic and generate accurate analytics.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="default" className="mb-4 bg-purple-600">
                <Bot className="h-3 w-3 mr-1" />
                Potential Capabilities
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What AI Agents Could Do
              </h2>
            </div>

            <div className="space-y-6">
              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Natural Language to CQL/SQL</CardTitle>
                      <CardDescription>
                        Translate conversational queries into executable analytics
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-background">
                      <p className="text-sm font-medium mb-2">User asks:</p>
                      <p className="text-sm text-muted-foreground italic mb-4">
                        "Show me all diabetic patients who haven't had an HbA1c test in the last year"
                      </p>
                      <p className="text-sm font-medium mb-2">Agent generates:</p>
                      <div className="text-xs font-mono bg-slate-900 text-slate-100 p-3 rounded">
                        <div>SELECT p.patient_id, p.name</div>
                        <div>FROM patients p</div>
                        <div>WHERE p.condition_codes LIKE '%E11%'</div>
                        <div>AND NOT EXISTS (</div>
                        <div className="ml-4">SELECT 1 FROM observations o</div>
                        <div className="ml-4">WHERE o.patient_id = p.id</div>
                        <div className="ml-4">AND o.code = '4548-4'</div>
                        <div className="ml-4">AND o.date &gt; DATE_SUB(NOW(), INTERVAL 1 YEAR)</div>
                        <div>)</div>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5" />
                        <span>Understands clinical terminology (diabetes, HbA1c)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5" />
                        <span>Maps to standard codes (LOINC, ICD-10)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5" />
                        <span>Generates optimized SQL for your data platform</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Target className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Create New Quality Measures</CardTitle>
                      <CardDescription>
                        Define custom measures through conversation
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-background">
                      <p className="text-sm font-medium mb-2">User requests:</p>
                      <p className="text-sm text-muted-foreground italic mb-4">
                        "Create a measure for patients with heart failure who were prescribed beta blockers
                        within 30 days of discharge"
                      </p>
                      <p className="text-sm font-medium mb-2">Agent could:</p>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-2" />
                          <span>Draft CQL logic with proper value sets and temporal relationships</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-2" />
                          <span>Define numerator, denominator, and exclusion criteria</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-2" />
                          <span>Generate FHIR Measure resource metadata</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-2" />
                          <span>Test against sample data and refine logic</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Execute and Aggregate Measures</CardTitle>
                      <CardDescription>
                        Run analytics across patient populations
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Population-level Analysis:</p>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span>Calculate rates by demographics</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span>Compare across time periods</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span>Stratify by risk factors</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span>Identify outliers and trends</span>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Multi-measure Analytics:</p>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span>Run multiple measures in parallel</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span>Cross-measure correlation analysis</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span>Composite scoring calculations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span>Gap-in-care identification</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Layout className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Build Dashboards On-The-Fly</CardTitle>
                      <CardDescription>
                        Generate visualizations through conversation
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-background">
                      <p className="text-sm font-medium mb-2">User says:</p>
                      <p className="text-sm text-muted-foreground italic mb-4">
                        "Create a dashboard showing our diabetes quality measures with trend lines
                        over the past 3 years, broken down by clinic location"
                      </p>
                      <p className="text-sm font-medium mb-2">Agent could generate:</p>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="border rounded p-3 bg-slate-50">
                          <LineChart className="h-6 w-6 text-purple-600 mb-2" />
                          <p className="text-xs font-medium">HbA1c Testing Rate</p>
                          <p className="text-xs text-muted-foreground">Time series by location</p>
                        </div>
                        <div className="border rounded p-3 bg-slate-50">
                          <BarChart3 className="h-6 w-6 text-purple-600 mb-2" />
                          <p className="text-xs font-medium">Blood Pressure Control</p>
                          <p className="text-xs text-muted-foreground">Comparative bar chart</p>
                        </div>
                        <div className="border rounded p-3 bg-slate-50">
                          <Target className="h-6 w-6 text-purple-600 mb-2" />
                          <p className="text-xs font-medium">Eye Exam Completion</p>
                          <p className="text-xs text-muted-foreground">Goal vs. actual gauge</p>
                        </div>
                        <div className="border rounded p-3 bg-slate-50">
                          <Users className="h-6 w-6 text-purple-600 mb-2" />
                          <p className="text-xs font-medium">Patient Distribution</p>
                          <p className="text-xs text-muted-foreground">Demographic breakdown</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Example Conversation */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-purple-600 text-purple-600">
                <MessageSquare className="h-3 w-3 mr-1" />
                Example Interaction
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                A Conversation with an AI Analytics Agent
              </h2>
              <p className="text-lg text-muted-foreground">
                See how natural language could transform healthcare quality analytics
              </p>
            </div>

            <div className="space-y-4">
              {/* User message */}
              <div className="flex gap-3 justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                  <p className="text-sm">
                    I need to identify patients in our diabetic population who are overdue for preventive screenings.
                    Can you help?
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4" />
                </div>
              </div>

              {/* Agent message */}
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                  <p className="text-sm">
                    I can help with that. I'll look at your diabetic patient cohort and check for overdue
                    preventive screenings including HbA1c tests, eye exams, and kidney disease monitoring.
                    What time period would you like me to use for "overdue"?
                  </p>
                </div>
              </div>

              {/* User message */}
              <div className="flex gap-3 justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                  <p className="text-sm">
                    Let's use the HEDIS specifications - overdue if not completed in the past 12 months.
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4" />
                </div>
              </div>

              {/* Agent message */}
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                  <p className="text-sm mb-3">
                    Perfect. I've analyzed your diabetic population using HEDIS CDC specifications.
                    Here's what I found:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-background rounded">
                      <span>HbA1c overdue:</span>
                      <span className="font-semibold text-orange-600">847 patients (23.2%)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-background rounded">
                      <span>Eye exam overdue:</span>
                      <span className="font-semibold text-orange-600">1,203 patients (32.9%)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-background rounded">
                      <span>Kidney screening overdue:</span>
                      <span className="font-semibold text-orange-600">654 patients (17.9%)</span>
                    </div>
                  </div>
                  <p className="text-sm mt-3">
                    Would you like me to create outreach lists or generate a detailed dashboard?
                  </p>
                </div>
              </div>

              {/* User message */}
              <div className="flex gap-3 justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                  <p className="text-sm">
                    Create a dashboard showing trends over the past 6 months and break it down by provider.
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4" />
                </div>
              </div>

              {/* Agent message */}
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                  <p className="text-sm">
                    ✓ Dashboard created! I've generated visualizations showing:
                  </p>
                  <ul className="text-sm space-y-1 mt-2 ml-4">
                    <li>• Trend lines for each screening type over 6 months</li>
                    <li>• Provider-level performance comparisons</li>
                    <li>• Patients with multiple overdue screenings (care gaps)</li>
                    <li>• Predicted outreach success rates based on historical data</li>
                  </ul>
                  <p className="text-sm mt-3">
                    The dashboard is ready to view. Would you like me to schedule automated monthly updates?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Foundation */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                <GitBranch className="h-3 w-3 mr-1" />
                Technical Foundation
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How It Could Work
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="h-5 w-5" />
                    CQL Understanding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Agents trained on CQL libraries could understand:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>Standard value set definitions (LOINC, SNOMED, RxNorm)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>Temporal relationships and date logic</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>Clinical concepts and measure definitions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>Population criteria and stratifications</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    FHIR Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    FHIR provides semantic understanding of:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>Resource relationships (Patient, Observation, Condition)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>Data types and validation rules</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>Terminology binding and code systems</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>References and data model structure</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    SQL Generation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Automated transpilation enables:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>Translation of CQL to platform-specific SQL</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>Query optimization for large datasets</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>Execution against data lakes (Databricks, Snowflake)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>Real-time results at scale</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Reasoning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Large language models could:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>Parse natural language clinical questions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>Map concepts to standard terminologies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>Generate appropriate CQL expressions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>Explain results in clinical terms</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Use Case Examples */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-purple-600 text-purple-600">
                <Sparkles className="h-3 w-3 mr-1" />
                Potential Use Cases
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Transforming Healthcare Workflows
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-l-4 border-l-purple-600">
                <CardHeader>
                  <CardTitle className="text-lg">Quality Improvement Teams</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-muted-foreground">
                  <p>• Rapidly prototype new quality measures</p>
                  <p>• Test measure definitions against historical data</p>
                  <p>• Compare performance across different criteria</p>
                  <p>• Generate reports for stakeholder meetings</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-600">
                <CardHeader>
                  <CardTitle className="text-lg">Clinical Researchers</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-muted-foreground">
                  <p>• Define cohorts using natural language</p>
                  <p>• Extract relevant data for studies</p>
                  <p>• Perform exploratory data analysis</p>
                  <p>• Generate visualizations for publications</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-600">
                <CardHeader>
                  <CardTitle className="text-lg">Value-Based Care Programs</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-muted-foreground">
                  <p>• Monitor performance on quality contracts</p>
                  <p>• Identify patients for care gap closure</p>
                  <p>• Calculate shared savings projections</p>
                  <p>• Track quality measure trajectories</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-600">
                <CardHeader>
                  <CardTitle className="text-lg">Population Health Management</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-muted-foreground">
                  <p>• Stratify populations by risk level</p>
                  <p>• Design targeted intervention programs</p>
                  <p>• Measure intervention effectiveness</p>
                  <p>• Predict future health outcomes</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-600">
                <CardHeader>
                  <CardTitle className="text-lg">Regulatory Reporting</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-muted-foreground">
                  <p>• Automate CMS Star Ratings calculations</p>
                  <p>• Generate HEDIS measure reports</p>
                  <p>• Prepare for NCQA audits</p>
                  <p>• Track compliance with quality programs</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-600">
                <CardHeader>
                  <CardTitle className="text-lg">Executive Dashboards</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-muted-foreground">
                  <p>• Real-time organizational quality metrics</p>
                  <p>• Benchmarking against peer organizations</p>
                  <p>• Financial impact of quality performance</p>
                  <p>• Strategic planning insights</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-b from-purple-50 to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="border-purple-600 text-purple-600">
              <Globe className="h-3 w-3 mr-1" />
              The Future is Conversational
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Explore the Foundations Today
            </h2>
            <p className="text-lg text-muted-foreground">
              While fully conversational AI agents are still emerging, the building blocks exist now:
              CQL for computable logic, FHIR for semantic context, and automated SQL generation for execution at scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/workflow">
                <Button size="lg" className="gap-2 bg-purple-600 hover:bg-purple-700">
                  <Sparkles className="h-5 w-5" />
                  Try the Workflow Demo
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="gap-2">
                  See Use Cases
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground pt-4">
              Join us in exploring how AI could transform healthcare quality measurement
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
