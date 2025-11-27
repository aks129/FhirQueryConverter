import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileJson,
  Lightbulb,
  Target,
  Sparkles,
  Code2,
  Workflow,
  AlertTriangle,
  ArrowRight,
  Zap,
  Shield,
  Database,
  MessageSquare,
  ClipboardList,
  Activity,
  Layers,
  GitBranch
} from "lucide-react";
import { Link } from "wouter";

export default function WhatsNext() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Navigation */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Converter
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Brain className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-bold">Open Quality</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-4">
          Quality AI for Providers
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Badge variant="outline" className="text-sm px-3 py-1">Lightweight MVP</Badge>
          <Badge variant="secondary" className="text-sm px-3 py-1">AI-Powered Reasoning</Badge>
          <Badge className="bg-green-600 text-sm px-3 py-1">Not Another Dashboard</Badge>
        </div>
      </div>

      {/* The Problem */}
      <Card className="mb-8 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            The Problem with Quality Gap Dashboards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-orange-700 dark:text-orange-400">What Exists Today</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <span>Pop health dashboards showing red/yellow/green lists</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <span>No explanation of WHY a patient failed</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <span>No guidance on WHAT to do next</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <span>Black-box CQL execution with no transparency</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-green-700 dark:text-green-400">What's Missing</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  <span>Explainable reasoning for each decision</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  <span>Actionable remediation steps</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  <span>Identification of missing data fields</span>
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  <span>AI-powered interpretation of quality logic</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The Solution - Core Action */}
      <Card className="mb-8 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            The MVP Core Action
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Inputs */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-2 mb-3">
                  <Code2 className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold">Input 1: Measure Logic</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  CQL code or simple "measure rule text" describing quality criteria
                </p>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`// CQL Example
define "Numerator":
  exists [Observation: "Mammography"]
    where effective during
    Interval[@2022-01-01, @2024-01-01]

// OR plain text
"Patient needs mammogram
 within 27 months"`}
                </pre>
              </div>
              <div className="border rounded-lg p-4 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-2 mb-3">
                  <FileJson className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold">Input 2: Patient Record</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  JSON sample patient record (FHIR or pseudo-FHIR format)
                </p>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "resourceType": "Patient",
  "gender": "female",
  "birthDate": "1968-05-15",
  "observations": [
    { "code": "77067",
      "date": "2023-09-20" }
  ]
}`}
                </pre>
              </div>
            </div>

            {/* Core Processing */}
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-white/50 dark:bg-gray-900/50">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-6 h-6 text-blue-600" />
                <h4 className="font-semibold text-lg">AI Backend Processing</h4>
              </div>
              <div className="grid md:grid-cols-4 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-2">
                    <Code2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Parse Logic</span>
                  <span className="text-xs text-muted-foreground">CQL/Rules</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-2">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium">Interpret</span>
                  <span className="text-xs text-muted-foreground">Criteria</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-2">
                    <HelpCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium">Identify</span>
                  <span className="text-xs text-muted-foreground">Gaps</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-2">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium">Explain</span>
                  <span className="text-xs text-muted-foreground">Results</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The 3-Panel Output */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Layers className="w-6 h-6" />
          The 3-Panel Output (UI)
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Panel 1 - Result */}
          <Card className="border-2 border-green-200">
            <CardHeader className="bg-green-50 dark:bg-green-950/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-green-600" />
                Panel 1: Result
              </CardTitle>
              <p className="text-sm text-muted-foreground">Did the Patient Meet the Measure?</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <div className="flex justify-center gap-4 mb-3">
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-10 h-10 text-green-600 mb-1" />
                    <span className="text-xs font-medium">PASS</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <XCircle className="w-10 h-10 text-red-400 mb-1" />
                    <span className="text-xs text-muted-foreground">FAIL</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <HelpCircle className="w-10 h-10 text-yellow-400 mb-1" />
                    <span className="text-xs text-muted-foreground">UNKNOWN</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Short Summary:</p>
                <div className="bg-muted p-3 rounded text-sm italic">
                  "Patient has valid mammography screening from Sept 2023,
                  meeting the 27-month requirement."
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Visual Reasoning Path:</p>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline">Female</Badge>
                  <ArrowRight className="w-3 h-3" />
                  <Badge variant="outline">Age 56</Badge>
                  <ArrowRight className="w-3 h-3" />
                  <Badge variant="outline">Mammogram ✓</Badge>
                  <ArrowRight className="w-3 h-3" />
                  <Badge className="bg-green-600">PASS</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Panel 2 - Why */}
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50 dark:bg-blue-950/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                Panel 2: Why?
              </CardTitle>
              <p className="text-sm text-muted-foreground">Explainable Logic (OpenEvidence style)</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium">Initial Population:</span>
                    <span className="text-muted-foreground"> Female patient aged 51-74 years</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium">Denominator:</span>
                    <span className="text-muted-foreground"> Has qualifying encounter within 2 years</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium">Numerator:</span>
                    <span className="text-muted-foreground"> Mammography (CPT 77067) performed 2023-09-20</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium">Exclusion:</span>
                    <span className="text-muted-foreground"> No bilateral mastectomy found</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded text-sm">
                <p className="font-medium mb-1">Guideline Reference:</p>
                <p className="text-xs text-muted-foreground italic">
                  "Per CMS125v12, women 51-74 should have one or more mammograms
                  during the 27 months prior to the measurement period end date."
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Panel 3 - What's Next */}
          <Card className="border-2 border-purple-200">
            <CardHeader className="bg-purple-50 dark:bg-purple-950/30">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="w-5 h-5 text-purple-600" />
                Panel 3: What's Next?
              </CardTitle>
              <p className="text-sm text-muted-foreground">Action & Remediation</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <div className="border rounded-lg p-3 bg-green-50 dark:bg-green-950/30">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">No Action Needed</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Patient meets all measure criteria
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Example Actions (if gap existed):</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowRight className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                    <span>"Collect missing mammography result"</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowRight className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                    <span>"Map CPT code 77067 from incoming claim"</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowRight className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                    <span>"Check for encounter type mismatch"</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowRight className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                    <span>"Patient overdue — schedule outreach"</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tech Stack */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Tech Stack (Simple)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-black flex items-center justify-center">
                <span className="text-white font-bold text-xs">Next.js</span>
              </div>
              <h4 className="font-semibold">Frontend</h4>
              <p className="text-xs text-muted-foreground">Next.js on Vercel</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">API</span>
              </div>
              <h4 className="font-semibold">Backend</h4>
              <p className="text-xs text-muted-foreground">Simple API route</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-yellow-100 flex items-center justify-center">
                <FileJson className="w-6 h-6 text-yellow-600" />
              </div>
              <h4 className="font-semibold">Data</h4>
              <p className="text-xs text-muted-foreground">JSON on client side</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-orange-100 flex items-center justify-center">
                <Brain className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-semibold">Model</h4>
              <p className="text-xs text-muted-foreground">Claude 3.5 Sonnet</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What This MVP Proves */}
      <Card className="mb-8 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            What This MVP Proves
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">You understand CQL</p>
                  <p className="text-sm text-muted-foreground">Parse and interpret clinical quality logic</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">You understand FHIR</p>
                  <p className="text-sm text-muted-foreground">Work with healthcare interoperability standards</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">You produce explainable quality reasoning</p>
                  <p className="text-sm text-muted-foreground">Transparent, auditable decision paths</p>
                </div>
              </div>
            </div>
            <div className="border-l pl-6 space-y-4">
              <div>
                <h4 className="font-semibold text-red-600 mb-2">This is NOT</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    Pop health dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    Gap closure tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    Another red/yellow/green list
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-green-600 mb-2">This IS</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    AI-based interpretation of quality logic
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    The MOAT — explainable reasoning
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    Actionable clinical guidance
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Architecture Diagram */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            MVP Architecture Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 rounded-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
              <div className="flex flex-col items-center text-center flex-1">
                <div className="w-16 h-16 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-2">
                  <Code2 className="w-8 h-8 text-blue-600" />
                </div>
                <div className="font-bold">User Input</div>
                <div className="text-xs text-muted-foreground">CQL + Patient JSON</div>
              </div>

              <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
              <div className="md:hidden">↓</div>

              <div className="flex flex-col items-center text-center flex-1">
                <div className="w-16 h-16 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-2">
                  <Workflow className="w-8 h-8 text-purple-600" />
                </div>
                <div className="font-bold">Next.js API</div>
                <div className="text-xs text-muted-foreground">Edge Function</div>
              </div>

              <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
              <div className="md:hidden">↓</div>

              <div className="flex flex-col items-center text-center flex-1">
                <div className="w-16 h-16 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-2">
                  <Brain className="w-8 h-8 text-orange-600" />
                </div>
                <div className="font-bold">Claude 3.5</div>
                <div className="text-xs text-muted-foreground">Reasoning Engine</div>
              </div>

              <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
              <div className="md:hidden">↓</div>

              <div className="flex flex-col items-center text-center flex-1">
                <div className="w-16 h-16 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mb-2">
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
                <div className="font-bold">3-Panel UI</div>
                <div className="text-xs text-muted-foreground">Result + Why + Action</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Ready to Build?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This MVP demonstrates that explainable AI reasoning for quality measures
          is the differentiated value proposition — not another dashboard.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/">
            <Button size="lg" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Try Current Converter
            </Button>
          </Link>
          <Link href="/e2e-demo">
            <Button size="lg" variant="outline" className="gap-2">
              <Workflow className="w-4 h-4" />
              See E2E Demo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
