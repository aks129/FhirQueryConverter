/**
 * AI Agent Page - Conversational Healthcare Analytics
 *
 * Explores the potential for AI agents to work with CQL, FHIR, and SQL
 * for natural language-driven quality measure analytics
 */

import { useState, useEffect } from "react";
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
import { AgentCommandCenter } from "@/components/showcase/AgentCommandCenter";
import { AgentChat } from "@/components/ai/AgentChat";

export default function AI() {
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);

  // Simulate agent activity for the demo
  useEffect(() => {
    const demoLogs = [
      { id: "1", timestamp: Date.now(), type: "thought", message: "Initializing healthcare analytics agent..." },
      { id: "2", timestamp: Date.now() + 1000, type: "thought", message: "Listening for user queries..." },
      { id: "3", timestamp: Date.now() + 3000, type: "thought", message: "User query received: 'Find diabetic patients with A1C > 9'" },
      { id: "4", timestamp: Date.now() + 4000, type: "tool", message: "Connecting to Medplum FHIR Server..." },
      { id: "5", timestamp: Date.now() + 5000, type: "result", message: "Connected. Schema loaded." },
      { id: "6", timestamp: Date.now() + 6000, type: "thought", message: "Generating CQL for diabetes definition..." },
      { id: "7", timestamp: Date.now() + 7000, type: "tool", message: "Invoking CQL Engine..." },
      { id: "8", timestamp: Date.now() + 8000, type: "thought", message: "Translating CQL to SQL for scale..." },
      { id: "9", timestamp: Date.now() + 9000, type: "tool", message: "Executing on Databricks..." },
      { id: "10", timestamp: Date.now() + 10000, type: "result", message: "Found 142 patients matching criteria." },
      { id: "11", timestamp: Date.now() + 11000, type: "tool", message: "Visualizing with FireMetrics..." },
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < demoLogs.length) {
        setAgentLogs(prev => [...prev, demoLogs[currentIndex]]);
        setIsAgentActive(true);
        currentIndex++;
      } else {
        setIsAgentActive(false);
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-purple-50 to-background relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-200/20 blur-3xl" />
          <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-200/20 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left Column: Text Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="outline" className="border-purple-600 text-purple-600 bg-purple-50">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered Analytics
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
                  Talk to your <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                    Healthcare Data
                  </span>
                </h1>
                <p className="text-lg text-slate-600 max-w-xl">
                  Experience the future of analytics. Use natural language to generate CQL logic,
                  write SQL queries, and uncover insights from your FHIR data instantly.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/workflow">
                  <Button size="lg" className="gap-2 bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200">
                    Start Full Workflow
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/firemetrics">
                  <Button size="lg" variant="outline" className="gap-2 border-slate-300 hover:bg-white/50">
                    <Database className="h-5 w-5" />
                    Explore Data
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>CQL Generation</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>SQL on FHIR</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Real-time Analysis</span>
                </div>
              </div>
            </div>

            {/* Right Column: Agent Command Center */}
            <div className="relative h-[500px] w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20"></div>
              <AgentCommandCenter isActive={isAgentActive} logs={agentLogs} />
            </div>
          </div>
        </div>
      </section>

      {/* The Vision */}
      <section className="border-b bg-white">
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
              <Card className="border-purple-100 hover:border-purple-300 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                    <FileCode className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Computable Logic</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    CQL provides standardized, machine-readable definitions of clinical quality measures
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-100 hover:border-purple-300 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                    <Database className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Structured Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    FHIR resources provide semantic understanding of healthcare data structures and relationships
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-100 hover:border-purple-300 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-emerald-600" />
                  </div>
                  <CardTitle className="text-lg">SQL Execution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Automated CQL-to-SQL transpilation enables agents to query large-scale healthcare datasets
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Use Case Examples */}
      <section className="border-b bg-slate-50">
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
              <Card className="border-l-4 border-l-purple-600 shadow-sm hover:shadow-md transition-shadow">
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

              <Card className="border-l-4 border-l-purple-600 shadow-sm hover:shadow-md transition-shadow">
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

              <Card className="border-l-4 border-l-purple-600 shadow-sm hover:shadow-md transition-shadow">
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

              <Card className="border-l-4 border-l-purple-600 shadow-sm hover:shadow-md transition-shadow">
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
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-b from-white to-purple-50">
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
              <Link href="/firemetrics">
                <Button size="lg" variant="outline" className="gap-2">
                  <Database className="h-5 w-5" />
                  Explore FireMetrics
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
