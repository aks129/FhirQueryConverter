import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Users,
  FileText,
  AlertCircle,
  Search,
  Database,
  Handshake,
  BookOpen,
  ArrowRight,
  Mail
} from "lucide-react";
import { Link } from "wouter";

export default function WhatsNext() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* Title Section */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <h1 className="text-5xl font-light tracking-tight text-gray-900 dark:text-gray-100 mb-6">
          What's Next
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 font-light max-w-2xl mx-auto">
          Where Open Quality is headed — and how you can be part of it.
        </p>
      </section>

      {/* Roadmap Section */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid gap-6">
          {/* Card 1 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 transition-all hover:shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Pilot Partnerships
                </h3>
                <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                  Early access for teams who want clearer, more actionable quality insight.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 transition-all hover:shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  More Measures & Guidelines
                </h3>
                <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                  Expanding supported rulesets across screening, chronic care, and meds.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 transition-all hover:shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Data Quality Signals
                </h3>
                <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                  Automatically highlight missing feeds, incorrect mappings, and poorly documented encounters.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 transition-all hover:shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center shrink-0">
                <Search className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Root Cause Insights
                </h3>
                <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                  AI that explains the "why" behind performance drops, not just what failed.
                </p>
              </div>
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 transition-all hover:shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  SQL-on-FHIR Integration
                </h3>
                <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                  A transparent, reproducible path from clinical logic → SQL → insight.
                </p>
              </div>
            </div>
          </div>

          {/* Card 6 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 transition-all hover:shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950 flex items-center justify-center shrink-0">
                <Handshake className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Partner & Investor Discussions
                </h3>
                <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                  We're opening conversations with early collaborators and aligned investors.
                </p>
              </div>
            </div>
          </div>

          {/* Card 7 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 transition-all hover:shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Knowledge Sharing
                </h3>
                <p className="text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                  Examples, lessons learned, datasets, tutorials, and transparency-first content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 dark:text-gray-100 mb-4">
              Get Involved
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-light">
              We're building in the open. Here's how to connect.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-[#4C83FF] hover:bg-[#3A6FFF] text-white rounded-xl px-8 h-12 font-medium"
            >
              <Mail className="w-4 h-4 mr-2" />
              Join Early Access
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl px-8 h-12 font-medium border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Investor One-Pager
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl px-8 h-12 font-medium border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              See Differentiation Matrix
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-gray-400 dark:text-gray-500 text-sm font-light">
              Open Quality · Better Health AI
            </div>
            <div className="flex items-center gap-6">
              <Link href="/">
                <span className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-light cursor-pointer">
                  Try Demo
                </span>
              </Link>
              <Link href="/faq">
                <span className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-light cursor-pointer">
                  Documentation
                </span>
              </Link>
              <Link href="/e2e-demo">
                <span className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-light cursor-pointer">
                  E2E Demo
                </span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
