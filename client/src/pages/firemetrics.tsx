/**
 * Firemetrics Interactive Explorer
 *
 * Explore and query FHIR data using Firemetrics SQL on FHIR capabilities
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Database,
  Search,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Code,
  Table,
  FileCode,
  Zap,
  Eye,
  EyeOff
} from "lucide-react";
import { FiremetricsClient, FhirPathProperty } from "@/lib/firemetrics-client";

const DEFAULT_MCP_URL = "https://mcp.firemetrics.ai/mcp";

// Common FHIR resources for dropdown
const COMMON_RESOURCES = [
  "Patient",
  "Encounter",
  "Observation",
  "Procedure",
  "Condition",
  "MedicationRequest",
  "Claim",
  "ExplanationOfBenefit",
  "Immunization",
  "CarePlan"
];

// Common FHIR paths by resource
const COMMON_PATHS: Record<string, string[][]> = {
  Patient: [["id"], ["gender"], ["birthDate"], ["name", "given"], ["name", "family"]],
  Encounter: [["id"], ["status"], ["class", "code"], ["subject", "reference"], ["period", "start"]],
  Observation: [["id"], ["status"], ["code", "coding", "code"], ["code", "coding", "display"], ["subject", "reference"], ["effectiveDateTime"]],
  Procedure: [["id"], ["status"], ["code", "coding", "code"], ["code", "coding", "display"], ["subject", "reference"], ["performedDateTime"]],
  Condition: [["id"], ["clinicalStatus", "coding", "code"], ["code", "coding", "code"], ["code", "coding", "display"], ["subject", "reference"]],
  MedicationRequest: [["id"], ["status"], ["intent"], ["medicationCodeableConcept", "coding", "code"], ["subject", "reference"]],
  Claim: [["id"], ["status"], ["type", "coding", "code"], ["patient", "reference"], ["created"]],
  ExplanationOfBenefit: [["id"], ["status"], ["type", "coding", "code"], ["patient", "reference"], ["created"]],
  Immunization: [["id"], ["status"], ["vaccineCode", "coding", "code"], ["patient", "reference"], ["occurrenceDateTime"]],
  CarePlan: [["id"], ["status"], ["intent"], ["subject", "reference"], ["period", "start"]]
};

export default function FiremetricsExplorer() {
  // Connection state
  const [apiKey, setApiKey] = useState("");
  const [mcpUrl, setMcpUrl] = useState(DEFAULT_MCP_URL);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [serverInfo, setServerInfo] = useState<unknown>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Client instance
  const [client, setClient] = useState<FiremetricsClient | null>(null);

  // Explorer state
  const [resourceCounts, setResourceCounts] = useState<unknown>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);

  // SQL Generator state
  const [selectedResource, setSelectedResource] = useState("Patient");
  const [selectedPaths, setSelectedPaths] = useState<string[][]>(COMMON_PATHS.Patient);
  const [customPathInput, setCustomPathInput] = useState("");
  const [generatedSql, setGeneratedSql] = useState("");
  const [generatingSql, setGeneratingSql] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"loinc" | "valueset" | "element">("loinc");
  const [searchResults, setSearchResults] = useState<string | object | null>(null);
  const [searching, setSearching] = useState(false);

  // Load saved config
  useEffect(() => {
    const saved = localStorage.getItem("e2e-demo-config");
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.firemetrics?.apiKey) {
          setApiKey(config.firemetrics.apiKey);
        }
        if (config.firemetrics?.mcpUrl) {
          setMcpUrl(config.firemetrics.mcpUrl);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Connect to Firemetrics
  const connect = async () => {
    if (!apiKey) {
      setConnectionError("API key is required");
      return;
    }

    setConnecting(true);
    setConnectionError(null);

    try {
      const newClient = new FiremetricsClient({ mcpUrl, apiKey });
      const result = await newClient.testConnection();

      if (result.success) {
        setClient(newClient);
        setServerInfo(result.serverInfo);
        setIsConnected(true);

        // Save to localStorage
        const saved = localStorage.getItem("e2e-demo-config");
        const config = saved ? JSON.parse(saved) : {};
        config.firemetrics = { apiKey, mcpUrl };
        localStorage.setItem("e2e-demo-config", JSON.stringify(config));

        // Load resource counts
        await loadResourceCounts(newClient);
      } else {
        setConnectionError(result.error || "Connection failed");
      }
    } catch (error) {
      setConnectionError((error as Error).message);
    } finally {
      setConnecting(false);
    }
  };

  // Load resource counts
  const loadResourceCounts = async (c?: FiremetricsClient) => {
    const clientToUse = c || client;
    if (!clientToUse) return;

    setLoadingCounts(true);
    try {
      const counts = await clientToUse.getResourceCounts(1);
      setResourceCounts(counts);
    } catch (error) {
      console.error("Failed to load resource counts:", error);
    } finally {
      setLoadingCounts(false);
    }
  };

  // Generate SQL
  const generateSql = async () => {
    if (!client) return;

    setGeneratingSql(true);
    try {
      const properties: FhirPathProperty[] = selectedPaths.map(path => ({ path }));
      const sql = await client.generateSqlFromFhirPaths(selectedResource, properties);
      setGeneratedSql(sql);
    } catch (error) {
      setGeneratedSql(`Error: ${(error as Error).message}`);
    } finally {
      setGeneratingSql(false);
    }
  };

  // Add custom path
  const addCustomPath = () => {
    if (customPathInput.trim()) {
      const path = customPathInput.split(".").map(p => p.trim());
      setSelectedPaths([...selectedPaths, path]);
      setCustomPathInput("");
    }
  };

  // Remove path
  const removePath = (index: number) => {
    setSelectedPaths(selectedPaths.filter((_, i) => i !== index));
  };

  // Search
  const performSearch = async () => {
    if (!client || !searchQuery.trim()) return;

    setSearching(true);
    setSearchResults(null);

    try {
      let results;
      switch (searchType) {
        case "loinc":
          results = await client.searchLoinc(searchQuery);
          break;
        case "valueset":
          results = await client.searchValueSets(searchQuery);
          break;
        case "element":
          results = await client.searchFhirElements(searchQuery);
          break;
      }
      setSearchResults(results as string | object);
    } catch (error) {
      setSearchResults({ error: (error as Error).message });
    } finally {
      setSearching(false);
    }
  };

  // Handle resource change
  const handleResourceChange = (resource: string) => {
    setSelectedResource(resource);
    setSelectedPaths(COMMON_PATHS[resource] || [["id"]]);
    setGeneratedSql("");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Firemetrics Explorer</h1>
          {isConnected && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Interactive exploration of FHIR data using Firemetrics SQL on FHIR capabilities
        </p>
      </div>

      {/* Connection Panel */}
      {!isConnected && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connect to Firemetrics</CardTitle>
            <CardDescription>Enter your API key to connect to the Firemetrics MCP server</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="mcp-url">MCP Endpoint URL</Label>
                <Input
                  id="mcp-url"
                  value={mcpUrl}
                  onChange={(e) => setMcpUrl(e.target.value)}
                  placeholder="https://mcp.firemetrics.ai/mcp"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk_prod_..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {connectionError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Connection Failed</AlertTitle>
                <AlertDescription>{connectionError}</AlertDescription>
              </Alert>
            )}

            <Button onClick={connect} disabled={connecting || !apiKey}>
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Connected Content */}
      {isConnected && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sql-generator" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              SQL Generator
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Server Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Server Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-48">
                    {JSON.stringify(serverInfo, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {/* Resource Counts */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Resource Counts</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadResourceCounts()}
                    disabled={loadingCounts}
                  >
                    {loadingCounts ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-48 whitespace-pre-wrap">
                    {typeof resourceCounts === 'string'
                      ? resourceCounts
                      : JSON.stringify(resourceCounts, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SQL Generator Tab */}
          <TabsContent value="sql-generator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="w-5 h-5" />
                  FHIR Path to SQL Generator
                </CardTitle>
                <CardDescription>
                  Select a FHIR resource and paths to generate optimized SQL with automatic JOINs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Resource Selection */}
                  <div>
                    <Label>FHIR Resource</Label>
                    <Select value={selectedResource} onValueChange={handleResourceChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_RESOURCES.map(resource => (
                          <SelectItem key={resource} value={resource}>
                            {resource}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Add Custom Path */}
                  <div>
                    <Label>Add Custom Path</Label>
                    <div className="flex gap-2">
                      <Input
                        value={customPathInput}
                        onChange={(e) => setCustomPathInput(e.target.value)}
                        placeholder="e.g., address.city"
                        onKeyDown={(e) => e.key === "Enter" && addCustomPath()}
                      />
                      <Button onClick={addCustomPath} variant="outline">
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Selected Paths */}
                <div>
                  <Label>Selected Paths</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedPaths.map((path, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() => removePath(index)}
                      >
                        {path.join(".")}
                        <XCircle className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button onClick={generateSql} disabled={generatingSql || selectedPaths.length === 0}>
                  {generatingSql ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Generate SQL
                    </>
                  )}
                </Button>

                {/* Generated SQL */}
                {generatedSql && (
                  <div>
                    <Label>Generated SQL</Label>
                    <Textarea
                      value={generatedSql}
                      readOnly
                      className="font-mono text-sm h-64 mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Terminology & Element Search
                </CardTitle>
                <CardDescription>
                  Search LOINC codes, ValueSets, and FHIR elements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Search Type</Label>
                    <Select
                      value={searchType}
                      onValueChange={(v) => setSearchType(v as typeof searchType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loinc">LOINC Codes</SelectItem>
                        <SelectItem value="valueset">ValueSets</SelectItem>
                        <SelectItem value="element">FHIR Elements</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label>Search Query</Label>
                    <div className="flex gap-2">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                          searchType === "loinc"
                            ? "e.g., mammography, glucose, hemoglobin"
                            : searchType === "valueset"
                            ? "e.g., breast cancer, diabetes"
                            : "e.g., Patient.birthDate, Observation.code"
                        }
                        onKeyDown={(e) => e.key === "Enter" && performSearch()}
                      />
                      <Button onClick={performSearch} disabled={searching || !searchQuery.trim()}>
                        {searching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Search Results */}
                {searchResults && (
                  <div>
                    <Label>Search Results</Label>
                    <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96 mt-2 whitespace-pre-wrap">
                      {typeof searchResults === 'string'
                        ? searchResults
                        : JSON.stringify(searchResults as object, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">About Firemetrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">SQL on FHIR</h4>
              <p className="text-muted-foreground">
                Native FHIR R4 database with automatic SQL query generation from FHIR paths
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Terminology Services</h4>
              <p className="text-muted-foreground">
                Built-in LOINC, SNOMED, and ValueSet search capabilities
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">MCP Integration</h4>
              <p className="text-muted-foreground">
                Model Context Protocol for AI-powered healthcare analytics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
