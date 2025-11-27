import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  AlertCircle,
  Lightbulb,
  Zap,
  Shield,
  DollarSign,
  Rocket,
  Users,
  Mail,
  ArrowRight,
  Check,
  Brain,
  Database,
  FileText,
  Search,
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";

export default function Investor() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <Link href="/whats-next">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* Header */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center border-b border-gray-100 dark:border-gray-800">
        <p className="text-sm text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
          Investor One-Pager
        </p>
        <h1 className="text-4xl font-light tracking-tight text-gray-900 dark:text-gray-100 mb-4">
          Open Quality
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 font-light">
          Explainable AI for Healthcare Quality & Improvement
        </p>
      </section>

      {/* The Problem */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">The Problem</h2>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 font-light mb-8 leading-relaxed">
          Healthcare organizations know what failed in quality — but almost never why.
        </p>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <p className="text-gray-600 dark:text-gray-400 font-light">Quality measures are opaque.</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <p className="text-gray-600 dark:text-gray-400 font-light">Data is inconsistent.</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <p className="text-gray-600 dark:text-gray-400 font-light">Guidelines are complex.</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <p className="text-gray-600 dark:text-gray-400 font-light">Pop health tools generate gap lists, not clarity.</p>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-6">
          <p className="text-gray-700 dark:text-gray-300 font-light leading-relaxed">
            The result: <span className="font-medium">tens of millions in penalties</span>, poor patient outcomes,
            slow improvement, and endless manual review. The entire system lacks explainability.
          </p>
        </div>
      </section>

      {/* The Solution */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">The Solution</h2>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-300 font-light mb-6 leading-relaxed">
          Open Quality is the first AI that explains healthcare quality. It interprets clinical logic,
          identifies missing or incorrect data, and shows teams how to fix issues with transparent,
          evidence-based reasoning.
        </p>
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-6">
          <p className="text-lg text-gray-700 dark:text-gray-300 font-light italic">
            Think of it as: "OpenEvidence for quality improvement."
          </p>
        </div>
      </section>

      {/* What Our AI Does */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">What Our AI Does</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: FileText, text: "Understands clinical rules & guidelines" },
            { icon: Database, text: "Interprets CQL, FHIR, value sets" },
            { icon: Check, text: "Explains pass/fail reasons" },
            { icon: AlertCircle, text: "Identifies missing data & mapping issues" },
            { icon: Search, text: "Detects upstream data quality signals" },
            { icon: ArrowRight, text: "Provides \"what to do next\" recommendations" },
            { icon: Lightbulb, text: "Generates root cause insights" },
            { icon: Database, text: "Integrates with SQL-on-FHIR workflows" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <item.icon className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
              <p className="text-gray-600 dark:text-gray-400 font-light">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Now */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950 flex items-center justify-center">
            <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">Why Now</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {[
            "Digital Quality Measures (dQMs) are accelerating",
            "SQL-on-FHIR is creating new standardization",
            "Health systems need cost reduction",
            "Payers face STARS pressure",
            "Clinicians expect transparent AI",
            "Data quality problems are growing"
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
              <p className="text-gray-600 dark:text-gray-400 font-light">{item}</p>
            </div>
          ))}
        </div>
        <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-6">
          <p className="text-gray-700 dark:text-gray-300 font-light italic">
            This is a category-defining moment — just as OpenEvidence was for clinical reasoning.
          </p>
        </div>
      </section>

      {/* Moat */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">Moat</h2>
        </div>
        <div className="space-y-3">
          {[
            "CQL & FHIR-native logic understanding (rare skill)",
            "Explainable AI — transparent, audit-friendly, trusted",
            "Data quality detection",
            "AI-driven root cause analysis",
            "Partnerships with data platforms (Firemetrics, Particle, Fasten, etc.)",
            "Founder expertise across NCQA, dQMs, SQL-on-FHIR, FHIR data quality"
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <p className="text-gray-600 dark:text-gray-400 font-light">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Business Model */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">Business Model</h2>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 space-y-4">
          <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">SaaS Subscription</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pilot Pricing</p>
              <p className="text-xl text-gray-900 dark:text-gray-100 font-light">$8–12k/month</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Enterprise Pricing</p>
              <p className="text-xl text-gray-900 dark:text-gray-100 font-light">$150k–500k/year</p>
            </div>
          </div>
        </div>
      </section>

      {/* Go-to-Market */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">Go-to-Market</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            "SQL-on-FHIR keynote demo",
            "Early partners (Providence, Humana, Outcomes network, etc.)",
            "Data platform distribution",
            "FHIR community & LinkedIn thought leadership",
            "Podcast exposure",
            "Direct pilots with quality & analytics teams"
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <ArrowRight className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-0.5 shrink-0" />
              <p className="text-gray-600 dark:text-gray-400 font-light">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">Team</h2>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
          <p className="text-lg text-gray-900 dark:text-gray-100 font-medium mb-2">Founder: Gene Vestel</p>
          <p className="text-gray-600 dark:text-gray-400 font-light leading-relaxed">
            FHIR data expert, NCQA collaborator, creator of CQL→SQL converter, host of "Out of the FHIR Podcast,"
            and leader in modern interoperability + quality models.
          </p>
        </div>
      </section>

      {/* Ask */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          </div>
          <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100">Ask</h2>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-8 text-center">
          <p className="text-xl text-gray-700 dark:text-gray-300 font-light mb-2">
            Exploring pre-seed conversations
          </p>
          <p className="text-3xl text-gray-900 dark:text-gray-100 font-light mb-4">
            $1.5M – $2M
          </p>
          <p className="text-gray-600 dark:text-gray-400 font-light mb-8">
            to accelerate product, expand measure coverage, and onboard pilot partners.
          </p>
          <Link href="/early-access">
            <Button
              size="lg"
              className="bg-[#4C83FF] hover:bg-[#3A6FFF] text-white rounded-xl px-8 h-12 font-medium"
            >
              <Mail className="w-4 h-4 mr-2" />
              Get in Touch
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-gray-400 dark:text-gray-500 text-sm font-light">
              Open Quality · Investor One-Pager
            </div>
            <div className="flex items-center gap-6">
              <Link href="/whats-next">
                <span className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-light cursor-pointer">
                  What's Next
                </span>
              </Link>
              <Link href="/differentiation">
                <span className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-light cursor-pointer">
                  Differentiation
                </span>
              </Link>
              <Link href="/early-access">
                <span className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-light cursor-pointer">
                  Early Access
                </span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
