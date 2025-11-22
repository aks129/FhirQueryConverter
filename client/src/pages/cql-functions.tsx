/**
 * CQL Functions Wiki Page
 *
 * Comprehensive guide to CQL functions and their translation to ANSI SQL
 */

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Calendar,
  Type,
  Calculator,
  List,
  Activity,
  Database,
  AlertCircle,
  CheckCircle2,
  Code,
  GitCompare,
  Lightbulb,
  Layers
} from "lucide-react";

export default function CQLFunctions() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Converter
          </Button>
        </Link>
      </div>

      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <h1 className="text-3xl font-bold">CQL Functions Reference</h1>
          <Badge variant="secondary">Complete Guide</Badge>
        </div>
        <p className="text-lg text-muted-foreground mb-4">
          Understanding CQL Functions and Their Translation to ANSI SQL
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <Badge variant="outline" className="flex items-center gap-1">
            <Code className="w-3 h-3" />
            CQL Standard Library
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            SQL on FHIR
          </Badge>
          <Badge variant="outline">ISO/ANSI SQL Compliant</Badge>
        </div>
      </div>

      {/* Introduction */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            What Are CQL Functions?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            CQL (Clinical Quality Language) provides a rich standard library of functions for manipulating
            clinical data, performing calculations, and expressing clinical logic. These functions must be
            transpiled to equivalent SQL functions to execute queries against relational databases.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" />
                CQL Layer
              </h4>
              <p className="text-xs text-muted-foreground">
                High-level, clinical-focused functions designed for quality measure authors
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                ELM Layer
              </h4>
              <p className="text-xs text-muted-foreground">
                Intermediate representation maintaining semantic meaning and type information
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Database className="w-4 h-4 text-green-600" />
                SQL Layer
              </h4>
              <p className="text-xs text-muted-foreground">
                Database-executable queries using ANSI SQL standard functions
              </p>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Translation Philosophy</AlertTitle>
            <AlertDescription className="text-sm">
              The transpiler aims to generate readable, efficient ANSI SQL that preserves the semantic
              meaning of CQL functions while leveraging database-native optimizations. Where direct SQL
              equivalents exist, they are preferred. Complex CQL operations may expand to multiple SQL
              expressions or subqueries.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Function Categories */}
      <Accordion type="single" collapsible className="space-y-4">

        {/* Date/Time Functions */}
        <AccordionItem value="datetime">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">Date and Time Functions</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">

                {/* AgeInYears */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>AgeInYears</Badge>
                    <Badge variant="outline">AgeInYearsAt</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Calculate patient age from birth date to current date or a specific date.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-semibold mb-2 flex items-center gap-2">
                        <Code className="w-3 h-3" />
                        CQL
                      </div>
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`// Current age
AgeInYears()

// Age at specific date
AgeInYearsAt(@2024-01-01)

// Example in context
define "Adults":
  [Patient] P
    where AgeInYearsAt(
      start of "Measurement Period"
    ) >= 18`}
                      </pre>
                    </div>
                    <div>
                      <div className="text-xs font-semibold mb-2 flex items-center gap-2">
                        <Database className="w-3 h-3" />
                        SQL Translation
                      </div>
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`-- Current age
CAST((JULIANDAY(CURRENT_DATE)
  - JULIANDAY(birthDate))
  / 365.25 AS INTEGER)

-- Age at specific date
CAST((JULIANDAY('2024-01-01')
  - JULIANDAY(birthDate))
  / 365.25 AS INTEGER)

-- Example in context
WHERE CAST(
  (JULIANDAY('2024-01-01')
    - JULIANDAY(p.birthDate))
  / 365.25 AS INTEGER
) >= 18`}
                      </pre>
                    </div>
                  </div>

                  <Alert className="mt-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-xs">
                      <strong>Implementation Note:</strong> Uses JULIANDAY for precision across leap years.
                      For other databases: PostgreSQL uses AGE(), SQL Server uses DATEDIFF(YEAR, ...).
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>Today</Badge>
                    <Badge variant="outline">Now</Badge>
                    <Badge variant="outline">DateTime</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get current date, current date/time, or construct specific date/time values.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`// Current date
Today()

// Current date and time
Now()

// Construct date/time
DateTime(2024, 1, 15, 14, 30, 0)`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`-- Current date
CURRENT_DATE

-- Current date and time
CURRENT_TIMESTAMP

-- Construct date/time
'2024-01-15 14:30:00'`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>year from</Badge>
                    <Badge variant="outline">month from</Badge>
                    <Badge variant="outline">day from</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Extract date components from DateTime values.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`year from birthDate
month from encounterDate
day from procedureDate`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`CAST(STRFTIME('%Y', birthDate) AS INTEGER)
CAST(STRFTIME('%m', encounterDate) AS INTEGER)
CAST(STRFTIME('%d', procedureDate) AS INTEGER)`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>difference in days</Badge>
                    <Badge variant="outline">difference in months</Badge>
                    <Badge variant="outline">difference in years</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Calculate time differences between two dates.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`difference in days between
  start and end

difference in years between
  birthDate and Today()`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`CAST(JULIANDAY(end)
  - JULIANDAY(start) AS INTEGER)

CAST((JULIANDAY(CURRENT_DATE)
  - JULIANDAY(birthDate))
  / 365.25 AS INTEGER)`}
                      </pre>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* String Functions */}
        <AccordionItem value="string">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-purple-600" />
              <span className="font-semibold">String Functions</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>Combine</Badge>
                    <Badge variant="outline">Concatenate</Badge>
                    <Badge variant="outline">&amp; operator</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Join multiple strings together.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`Combine({'Dr.', firstName, lastName}, ' ')

firstName & ' ' & lastName

'Patient: ' + fullName`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`'Dr.' || ' ' || firstName || ' ' || lastName

firstName || ' ' || lastName

'Patient: ' || fullName`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>Length</Badge>
                    <Badge variant="outline">Upper</Badge>
                    <Badge variant="outline">Lower</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    String manipulation and measurement.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`Length(patientName)
Upper(code)
Lower(displayText)`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`LENGTH(patientName)
UPPER(code)
LOWER(displayText)`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>Substring</Badge>
                    <Badge variant="outline">IndexOf</Badge>
                    <Badge variant="outline">LastIndexOf</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Extract and search within strings.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`// Extract substring (1-indexed)
Substring(text, 1, 5)

// Find position
IndexOf('Hello World', 'World')

// Find last occurrence
LastIndexOf(path, '/')`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`-- Extract substring (1-indexed)
SUBSTR(text, 1, 5)

-- Find position (returns 0-indexed)
INSTR('Hello World', 'World') - 1

-- Find last occurrence
LENGTH(path) - INSTR(REVERSE(path), '/')`}
                      </pre>
                    </div>
                  </div>

                  <Alert className="mt-3">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-xs">
                      <strong>Indexing Difference:</strong> CQL uses 1-based indexing (first character is 1),
                      while SQL databases vary. SQLite uses 1-based, but INSTR returns positions differently.
                      Always test edge cases.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>StartsWith</Badge>
                    <Badge variant="outline">EndsWith</Badge>
                    <Badge variant="outline">Matches</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pattern matching and string comparison.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`StartsWith(code, 'ICD10')
EndsWith(url, '.gov')
Matches(ssn, '^\\d{3}-\\d{2}-\\d{4}$')`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`code LIKE 'ICD10%'
url LIKE '%.gov'
ssn REGEXP '^[0-9]{3}-[0-9]{2}-[0-9]{4}$'`}
                      </pre>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Math Functions */}
        <AccordionItem value="math">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-600" />
              <span className="font-semibold">Mathematical Functions</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>Abs</Badge>
                    <Badge variant="outline">Ceiling</Badge>
                    <Badge variant="outline">Floor</Badge>
                    <Badge variant="outline">Round</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Basic mathematical rounding and absolute value operations.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`Abs(-42.5)        // 42.5
Ceiling(3.2)      // 4
Floor(3.8)        // 3
Round(3.5)        // 4
Round(3.14159, 2) // 3.14`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`ABS(-42.5)
CEIL(3.2)
FLOOR(3.8)
ROUND(3.5)
ROUND(3.14159, 2)`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>Ln</Badge>
                    <Badge variant="outline">Log</Badge>
                    <Badge variant="outline">Exp</Badge>
                    <Badge variant="outline">Power</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Logarithmic and exponential functions.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`Ln(value)          // Natural log
Log(value, 10)     // Log base 10
Exp(2.0)           // e^2
Power(2, 10)       // 2^10 = 1024`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`LN(value)
LOG10(value)
EXP(2.0)
POWER(2, 10)`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>Truncate</Badge>
                    <Badge variant="outline">Modulo</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Truncation and modulo operations.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`Truncate(3.7)      // 3
Truncate(-3.7)     // -3
value mod 10       // Remainder`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`TRUNC(3.7)
TRUNC(-3.7)
value % 10`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>MinValue</Badge>
                    <Badge variant="outline">MaxValue</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Find minimum or maximum of scalar values (not aggregates).
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`MinValue(a, b, c)
MaxValue(x, y)`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`LEAST(a, b, c)
GREATEST(x, y)`}
                      </pre>
                    </div>
                  </div>

                  <Alert className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Note:</strong> MinValue/MaxValue are for scalar comparisons. For aggregate
                      operations over lists, see the List Functions section (Min/Max).
                    </AlertDescription>
                  </Alert>
                </div>

              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* List Functions */}
        <AccordionItem value="list">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <List className="w-5 h-5 text-orange-600" />
              <span className="font-semibold">List and Aggregate Functions</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>Count</Badge>
                    <Badge variant="outline">Sum</Badge>
                    <Badge variant="outline">Avg</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Aggregate functions for computing statistics over lists.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`Count([Observation])

Sum(observations.value)

Avg(measurements.result)`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`COUNT(*)

SUM(o.value_quantity)

AVG(m.result_value)`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>Min</Badge>
                    <Badge variant="outline">Max</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Find minimum or maximum values in a list (aggregate operations).
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`Min(observations.value)

Max(encounters.date)`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`MIN(o.value_quantity)

MAX(e.period_start)`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>exists</Badge>
                    <Badge variant="outline">First</Badge>
                    <Badge variant="outline">Last</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Check list existence and retrieve specific elements.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`exists ([Condition: "Diabetes"])

First(observations
  sort by date desc)

Last(encounters)`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`EXISTS (SELECT 1 FROM Condition c ...)

SELECT * FROM Observation o
ORDER BY o.effective_datetime DESC
LIMIT 1

SELECT * FROM Encounter e
ORDER BY e.period_start ASC
LIMIT 1`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>Distinct</Badge>
                    <Badge variant="outline">Flatten</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Remove duplicates and flatten nested lists.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`distinct patientIds

flatten lists`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`SELECT DISTINCT patient_id

-- Requires UNNEST or JSON functions
-- depending on structure`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>Union</Badge>
                    <Badge variant="outline">Intersect</Badge>
                    <Badge variant="outline">Except</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set operations on lists.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`listA union listB

listA intersect listB

listA except listB`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`SELECT * FROM listA
UNION
SELECT * FROM listB

SELECT * FROM listA
INTERSECT
SELECT * FROM listB

SELECT * FROM listA
EXCEPT
SELECT * FROM listB`}
                      </pre>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Clinical Functions */}
        <AccordionItem value="clinical">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-600" />
              <span className="font-semibold">Clinical Domain Functions</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">

                <Alert className="mb-4">
                  <Activity className="h-4 w-4" />
                  <AlertTitle>FHIR-Specific Functions</AlertTitle>
                  <AlertDescription className="text-sm">
                    These functions are designed specifically for FHIR resources and clinical workflows.
                    They often require complex SQL joins and business logic to implement correctly.
                  </AlertDescription>
                </Alert>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>CalculateAge</Badge>
                    <Badge variant="outline">CalculateAgeAt</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Clinical age calculations (similar to AgeInYears but more FHIR-aware).
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`CalculateAge(Patient.birthDate)

CalculateAgeAt(
  Patient.birthDate,
  @2024-01-01
)`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`-- Same as AgeInYears
CAST((JULIANDAY(CURRENT_DATE)
  - JULIANDAY(p.birthDate))
  / 365.25 AS INTEGER)

CAST((JULIANDAY('2024-01-01')
  - JULIANDAY(p.birthDate))
  / 365.25 AS INTEGER)`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>ToString</Badge>
                    <Badge variant="outline">ToQuantity</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Convert FHIR data types to strings or quantities.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`ToString(code)
ToString(identifier)

ToQuantity(value, 'mg/dL')`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`CAST(c.code AS TEXT)
CAST(i.value AS TEXT)

-- Quantity conversion with unit
CAST(value AS DECIMAL)
-- Unit stored separately`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>InValueSet</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Check if a code is in a value set (using terminology service).
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`code in "Diabetes Codes"

Observation.code
  in "Heart Rate Value Set"`}
                      </pre>
                    </div>
                    <div>
                      <pre className="text-xs bg-muted p-3 rounded-lg">
{`EXISTS (
  SELECT 1
  FROM ValueSetExpansion vse
  WHERE vse.value_set_url =
    'http://cts.nlm.nih.gov/...'
    AND vse.code = c.code
    AND vse.system = c.code_system
)

EXISTS (
  SELECT 1
  FROM ValueSetExpansion vse
  WHERE vse.value_set_url = '...'
    AND vse.code = o.code
    AND vse.system = o.code_system
)`}
                      </pre>
                    </div>
                  </div>

                  <Alert className="mt-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-xs">
                      <strong>Best Practice:</strong> This transpiler automatically generates proper value
                      set queries with code system matching, avoiding brittle text-based searches.
                    </AlertDescription>
                  </Alert>
                </div>

              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Comparison & Best Practices */}
        <AccordionItem value="comparison">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold">Translation Patterns & Best Practices</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6 space-y-6">

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Key Translation Principles
                  </h4>

                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <h5 className="text-sm font-semibold mb-1">1. Preserve Semantics</h5>
                      <p className="text-xs text-muted-foreground mb-2">
                        SQL must produce identical results to CQL evaluation, including null handling,
                        precision, and edge cases.
                      </p>
                      <pre className="text-xs bg-muted p-2 rounded">
{`CQL:  5 / 2 = 2.5    SQL: 5.0 / 2.0 = 2.5 (not 5 / 2 = 2)`}
                      </pre>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <h5 className="text-sm font-semibold mb-1">2. Null Handling</h5>
                      <p className="text-xs text-muted-foreground mb-2">
                        CQL has strict null propagation rules. SQL must replicate this behavior.
                      </p>
                      <div className="grid md:grid-cols-2 gap-2">
                        <pre className="text-xs bg-muted p-2 rounded">
{`// CQL
value + null = null
null and true = null`}
                        </pre>
                        <pre className="text-xs bg-muted p-2 rounded">
{`-- SQL
value + NULL = NULL
NULL AND TRUE = NULL`}
                        </pre>
                      </div>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <h5 className="text-sm font-semibold mb-1">3. Type Coercion</h5>
                      <p className="text-xs text-muted-foreground mb-2">
                        CQL has implicit type conversions. SQL needs explicit CAST operations.
                      </p>
                      <div className="grid md:grid-cols-2 gap-2">
                        <pre className="text-xs bg-muted p-2 rounded">
{`// CQL auto-converts
Integer value: 5
Decimal result: value / 2.0`}
                        </pre>
                        <pre className="text-xs bg-muted p-2 rounded">
{`-- SQL needs CAST
CAST(value AS DECIMAL) / 2.0`}
                        </pre>
                      </div>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <h5 className="text-sm font-semibold mb-1">4. Precision Requirements</h5>
                      <p className="text-xs text-muted-foreground mb-2">
                        Clinical calculations require precise decimal arithmetic, not floating point.
                      </p>
                      <pre className="text-xs bg-muted p-2 rounded">
{`-- Use DECIMAL/NUMERIC types, not FLOAT/REAL
CAST(value AS DECIMAL(10,2))`}
                      </pre>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <h5 className="text-sm font-semibold mb-1">5. Date Precision</h5>
                      <p className="text-xs text-muted-foreground mb-2">
                        FHIR dates can have varying precision (year, year-month, full date). SQL must handle this.
                      </p>
                      <pre className="text-xs bg-muted p-2 rounded">
{`-- Check precision before comparison
WHERE LENGTH(date_string) >= 10 -- Full date available
  AND date_value >= '2024-01-01'`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    Common Pitfalls
                  </h4>

                  <div className="space-y-2">
                    <Alert>
                      <AlertDescription className="text-xs">
                        <strong>String concatenation with nulls:</strong> CQL: <code>null & "text" = null</code>.
                        SQL: Use <code>CONCAT()</code> or careful <code>COALESCE()</code> handling.
                      </AlertDescription>
                    </Alert>

                    <Alert>
                      <AlertDescription className="text-xs">
                        <strong>Integer division:</strong> CQL always uses decimal division. SQL: Cast to decimal first.
                      </AlertDescription>
                    </Alert>

                    <Alert>
                      <AlertDescription className="text-xs">
                        <strong>Empty lists vs null:</strong> CQL distinguishes {} (empty list) from null.
                        SQL: Empty result sets need careful handling with <code>COALESCE()</code>.
                      </AlertDescription>
                    </Alert>

                    <Alert>
                      <AlertDescription className="text-xs">
                        <strong>Index offsets:</strong> CQL uses 1-based indexing. SQL databases vary
                        (PostgreSQL arrays are 1-based, SQLite substr is 1-based, but array indexes are 0-based in JSON).
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-3">Database-Specific Considerations</h4>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">SQLite</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1">
                        <p>• JULIANDAY for date math</p>
                        <p>• STRFTIME for date parts</p>
                        <p>• Limited regex (requires extension)</p>
                        <p>• || for string concatenation</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">PostgreSQL</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1">
                        <p>• AGE() for date differences</p>
                        <p>• EXTRACT() for date parts</p>
                        <p>• Native regex with ~</p>
                        <p>• || or CONCAT()</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">SQL Server</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1">
                        <p>• DATEDIFF() for date math</p>
                        <p>• DATEPART() for date parts</p>
                        <p>• Limited regex (needs CLR or LIKE)</p>
                        <p>• + or CONCAT()</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">DuckDB / Databricks</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1">
                        <p>• DATE_DIFF() for date math</p>
                        <p>• DATE_PART() for date parts</p>
                        <p>• REGEXP_MATCHES() for regex</p>
                        <p>• || or CONCAT()</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Implementation Status */}
        <AccordionItem value="status">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-semibold">Implementation Status in This Tool</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">

                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-900">Currently Supported (Alpha v0.3)</AlertTitle>
                    <AlertDescription className="text-sm text-green-800">
                      <ul className="mt-2 space-y-1">
                        <li>✓ AgeInYears, AgeInYearsAt</li>
                        <li>✓ Today(), Now()</li>
                        <li>✓ Basic date arithmetic (before, after, during)</li>
                        <li>✓ exists, Count</li>
                        <li>✓ Basic math operators (+, -, *, /, mod)</li>
                        <li>✓ String concatenation (&amp;, +)</li>
                        <li>✓ InValueSet (via canonical URLs)</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <Alert className="bg-orange-50 border-orange-200">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertTitle className="text-orange-900">Planned for Phase 9+</AlertTitle>
                    <AlertDescription className="text-sm text-orange-800">
                      <ul className="mt-2 space-y-1">
                        <li>⚙ Date extraction (year from, month from, day from)</li>
                        <li>⚙ String functions (Length, Upper, Lower, Substring)</li>
                        <li>⚙ Math functions (Abs, Ceiling, Floor, Round, Ln, Log, Exp, Power)</li>
                        <li>⚙ Aggregate functions (Sum, Avg, Min, Max)</li>
                        <li>⚙ List operations (Distinct, Flatten, Union, Intersect, Except)</li>
                        <li>⚙ Advanced temporal functions (difference in, duration)</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="p-4 border rounded-lg bg-muted">
                    <h5 className="font-semibold mb-2 text-sm">Workaround for Unsupported Functions</h5>
                    <p className="text-xs text-muted-foreground mb-3">
                      While not all CQL functions are transpiled automatically, you can use raw SQL
                      expressions in generated queries or pre-compute values in SQL views.
                    </p>
                    <pre className="text-xs bg-background p-3 rounded">
{`-- Example: Pre-compute ages in a view
CREATE VIEW Patient_with_age AS
SELECT
  p.*,
  CAST((JULIANDAY(CURRENT_DATE) - JULIANDAY(p.birthDate))
    / 365.25 AS INTEGER) AS age
FROM Patient p;

-- Then reference in CQL
define "Adults": [Patient] P where P.age >= 18`}
                    </pre>
                  </div>

                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

      </Accordion>

      {/* Footer */}
      <div className="mt-8 space-y-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Code className="w-4 h-4" />
              Want to Contribute?
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              This is an open-source project demonstrating CQL to SQL transpilation. Function coverage
              is actively expanding. Check the FAQ page for the roadmap or contribute on GitHub.
            </p>
            <div className="flex gap-2">
              <Link href="/faq">
                <Button size="sm" variant="outline">
                  View Roadmap
                </Button>
              </Link>
              <Button size="sm" variant="outline">
                GitHub Repository
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/">
            <Button size="lg" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Try the Converter
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
