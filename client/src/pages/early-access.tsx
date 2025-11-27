import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowLeft,
  CheckCircle2,
  Send
} from "lucide-react";
import { Link } from "wouter";

const ORG_TYPES = [
  "Health System",
  "Payer",
  "ACO / Risk-bearing Group",
  "Quality / Performance Improvement Org",
  "Data Platform / Infrastructure",
  "Startup",
  "Vendor / Consultancy",
  "Other"
];

const INTERESTS = [
  "Explaining why a measure passed or failed",
  "Understanding missing data or incorrect mappings",
  "Transparent, evidence-based logic",
  "Root cause insights",
  "SQL-on-FHIR alignment",
  "Preparing for dQMs",
  "Reducing manual chart review",
  "Improving population outcomes"
];

const PILOT_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "possibly", label: "Possibly" },
  { value: "updates", label: "No, just want updates" }
];

export default function EarlyAccess() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    organization: "",
    email: "",
    role: "",
    orgType: "",
    problems: "",
    interests: [] as string[],
    pilotInterest: "",
    additionalInfo: "",
    consent: false
  });

  const handleInterestChange = (interest: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      interests: checked
        ? [...prev.interests, interest]
        : prev.interests.filter(i => i !== interest)
    }));
  };

  const handleSelectAllInterests = () => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.length === INTERESTS.length ? [] : [...INTERESTS]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission (replace with actual Google Forms integration)
    // For real integration, you would POST to a Google Forms URL or use Google Apps Script
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSubmitted(true);
    setIsSubmitting(false);
  };

  const isFormValid = () => {
    return (
      formData.fullName.trim() !== "" &&
      formData.organization.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.role.trim() !== "" &&
      formData.orgType !== "" &&
      formData.problems.trim() !== "" &&
      formData.consent
    );
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-light text-gray-900 dark:text-gray-100 mb-4">
            Thank you — you're on the list.
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-light mb-8">
            We'll reach out shortly with next steps.
          </p>
          <Link href="/whats-next">
            <Button variant="outline" className="rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to What's Next
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <div className="max-w-2xl mx-auto px-6 pt-8">
        <Link href="/whats-next">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* Header */}
      <section className="max-w-2xl mx-auto px-6 pt-12 pb-8 text-center">
        <h1 className="text-4xl font-light tracking-tight text-gray-900 dark:text-gray-100 mb-4">
          Early Access Program
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 font-light leading-relaxed">
          We're building an AI that explains healthcare quality, surfaces missing or incorrect data,
          and helps teams fix what matters.
        </p>
        <p className="text-gray-500 dark:text-gray-400 font-light mt-4">
          If you're interested in joining early access or being considered for a pilot,
          share a few details below. We'll reach out personally.
        </p>
      </section>

      {/* Form */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-gray-700 dark:text-gray-300">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              className="rounded-xl border-gray-200 dark:border-gray-700"
              required
            />
          </div>

          {/* Organization */}
          <div className="space-y-2">
            <Label htmlFor="organization" className="text-gray-700 dark:text-gray-300">
              Organization <span className="text-red-500">*</span>
            </Label>
            <Input
              id="organization"
              value={formData.organization}
              onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
              className="rounded-xl border-gray-200 dark:border-gray-700"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="rounded-xl border-gray-200 dark:border-gray-700"
              required
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-700 dark:text-gray-300">
              Role / Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="rounded-xl border-gray-200 dark:border-gray-700"
              required
            />
          </div>

          {/* Organization Type */}
          <div className="space-y-3">
            <Label className="text-gray-700 dark:text-gray-300">
              What type of organization best describes you? <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={formData.orgType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, orgType: value }))}
              className="space-y-2"
            >
              {ORG_TYPES.map((type) => (
                <div key={type} className="flex items-center space-x-3">
                  <RadioGroupItem value={type} id={`org-${type}`} />
                  <Label htmlFor={`org-${type}`} className="font-normal text-gray-600 dark:text-gray-400 cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Problems */}
          <div className="space-y-2">
            <Label htmlFor="problems" className="text-gray-700 dark:text-gray-300">
              What problems are you currently facing with quality measurement or improvement? <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-light">
              Examples: unclear logic, inconsistent data, missing feeds, lack of explainability,
              difficulty diagnosing root cause, time spent reviewing charts, failing measures without clarity.
            </p>
            <Textarea
              id="problems"
              value={formData.problems}
              onChange={(e) => setFormData(prev => ({ ...prev, problems: e.target.value }))}
              className="rounded-xl border-gray-200 dark:border-gray-700 min-h-[120px]"
              required
            />
          </div>

          {/* Interests */}
          <div className="space-y-3">
            <Label className="text-gray-700 dark:text-gray-300">
              What interests you about Open Quality?
            </Label>
            <div className="space-y-2">
              {INTERESTS.map((interest) => (
                <div key={interest} className="flex items-center space-x-3">
                  <Checkbox
                    id={`interest-${interest}`}
                    checked={formData.interests.includes(interest)}
                    onCheckedChange={(checked) => handleInterestChange(interest, checked as boolean)}
                  />
                  <Label htmlFor={`interest-${interest}`} className="font-normal text-gray-600 dark:text-gray-400 cursor-pointer">
                    {interest}
                  </Label>
                </div>
              ))}
              <div className="flex items-center space-x-3 pt-2">
                <Checkbox
                  id="interest-all"
                  checked={formData.interests.length === INTERESTS.length}
                  onCheckedChange={handleSelectAllInterests}
                />
                <Label htmlFor="interest-all" className="font-normal text-gray-600 dark:text-gray-400 cursor-pointer">
                  All of the above
                </Label>
              </div>
            </div>
          </div>

          {/* Pilot Interest */}
          <div className="space-y-3">
            <Label className="text-gray-700 dark:text-gray-300">
              Are you interested in pilot participation or early product testing?
            </Label>
            <RadioGroup
              value={formData.pilotInterest}
              onValueChange={(value) => setFormData(prev => ({ ...prev, pilotInterest: value }))}
              className="space-y-2"
            >
              {PILOT_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.value} id={`pilot-${option.value}`} />
                  <Label htmlFor={`pilot-${option.value}`} className="font-normal text-gray-600 dark:text-gray-400 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Info */}
          <div className="space-y-2">
            <Label htmlFor="additionalInfo" className="text-gray-700 dark:text-gray-300">
              Anything else we should know?
            </Label>
            <Textarea
              id="additionalInfo"
              value={formData.additionalInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
              className="rounded-xl border-gray-200 dark:border-gray-700 min-h-[100px]"
            />
          </div>

          {/* Consent */}
          <div className="flex items-start space-x-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
            <Checkbox
              id="consent"
              checked={formData.consent}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, consent: checked as boolean }))}
              className="mt-0.5"
            />
            <Label htmlFor="consent" className="font-normal text-gray-600 dark:text-gray-400 cursor-pointer leading-relaxed">
              I consent to be contacted about early access, pilots, and product updates. <span className="text-red-500">*</span>
            </Label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            disabled={!isFormValid() || isSubmitting}
            className="w-full bg-[#4C83FF] hover:bg-[#3A6FFF] text-white rounded-xl h-12 font-medium"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Join Early Access
              </>
            )}
          </Button>
        </form>
      </section>
    </div>
  );
}
