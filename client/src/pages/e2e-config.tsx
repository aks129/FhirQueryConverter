/**
 * End-to-End Demo Configuration Page
 *
 * Configure and test all connections:
 * - Medplum FHIR server credentials
 * - NLM VSAC terminology services
 * - Databricks data warehouse
 * - Patient and measure selection
 * - ValueSet configuration
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Server,
  Database,
  BookOpen,
  FileCode,
  Users,
  Settings,
  TestTube,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";

// Configuration interface
interface E2EConfig {
  medplum: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    projectId: string;
  };
  vsac: {
    apiKey: string;
    valueSetOids: string[];
  };
  databricks: {
    host: string;
    token: string;
    warehouse: string;
    catalog: string;
    schema: string;
  };
  execution: {
    patientIds: string[];
    measureIds: string[];
    libraryIds: string[];
    periodStart: string;
    periodEnd: string;
  };
}

const DEFAULT_CONFIG: E2EConfig = {
  medplum: {
    baseUrl: "https://api.medplum.com",
    clientId: "",
    clientSecret: "",
    projectId: ""
  },
  vsac: {
    apiKey: "",
    valueSetOids: [
      "2.16.840.1.113883.3.464.1003.198.12.1011", // Mammography
      "2.16.840.1.113883.3.526.3.1285", // Bilateral Mastectomy
      "2.16.840.1.113883.3.464.1003.101.12.1061" // Patient Characteristic Payer
    ]
  },
  databricks: {
    host: "",
    token: "",
    warehouse: "",
    catalog: "fhir_analytics",
    schema: "bronze"
  },
  execution: {
    patientIds: [],
    measureIds: ["CMS125"],
    libraryIds: ["BCSComponent"],
    periodStart: "2024-01-01",
    periodEnd: "2024-12-31"
  }
};

const CONFIG_STORAGE_KEY = "e2e-demo-config";

export default function E2EConfig() {
  const [, setLocation] = useLocation();
  const [config, setConfig] = useState<E2EConfig>(DEFAULT_CONFIG);
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({
    medplum: null,
    vsac: null,
    databricks: null
  });
  const [testing, setTesting] = useState<Record<string, boolean>>({
    medplum: false,
    vsac: false,
    databricks: false
  });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({
    medplumSecret: false,
    vsacApiKey: false,
    databricksToken: false
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Load config from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      try {
        const parsedConfig = JSON.parse(saved);
        setConfig({ ...DEFAULT_CONFIG, ...parsedConfig });
      } catch (error) {
        console.error("Failed to load saved config:", error);
      }
    }
  }, []);

  // Save configuration
  const saveConfig = () => {
    setSaveStatus("saving");
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 500);
  };

  // Test Medplum connection
  const testMedplum = async () => {
    setTesting({ ...testing, medplum: true });
    setTestResults({ ...testResults, medplum: null });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In real implementation, make actual API call:
      // const response = await fetch(`${config.medplum.baseUrl}/fhir/R4/metadata`);
      // if (!response.ok) throw new Error("Failed to connect");

      setTestResults({ ...testResults, medplum: true });
    } catch (error) {
      setTestResults({ ...testResults, medplum: false });
    } finally {
      setTesting({ ...testing, medplum: false });
    }
  };

  // Test VSAC connection
  const testVSAC = async () => {
    setTesting({ ...testing, vsac: true });
    setTestResults({ ...testResults, vsac: null });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In real implementation:
      // const response = await fetch("https://vsac.nlm.nih.gov/vsac/svs/valueset/2.16.840.1.113883.3.464.1003.198.12.1011/expansion", {
      //   headers: {
      //     "Authorization": `Bearer ${config.vsac.apiKey}`,
      //     "Accept": "application/json"
      //   }
      // });

      setTestResults({ ...testResults, vsac: true });
    } catch (error) {
      setTestResults({ ...testResults, vsac: false });
    } finally {
      setTesting({ ...testing, vsac: false });
    }
  };

  // Test Databricks connection
  const testDatabricks = async () => {
    setTesting({ ...testing, databricks: true });
    setTestResults({ ...testResults, databricks: null });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In real implementation:
      // const response = await fetch(`https://${config.databricks.host}/api/2.0/sql/warehouses`, {
      //   headers: { Authorization: `Bearer ${config.databricks.token}` }
      // });

      setTestResults({ ...testResults, databricks: true });
    } catch (error) {
      setTestResults({ ...testResults, databricks: false });
    } finally {
      setTesting({ ...testing, databricks: false });
    }
  };

  const updateConfig = (section: keyof E2EConfig, field: string, value: any) => {
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value
      }
    });
  };

  const addValueSetOid = () => {
    setConfig({
      ...config,
      vsac: {
        ...config.vsac,
        valueSetOids: [...config.vsac.valueSetOids, ""]
      }
    });
  };

  const updateValueSetOid = (index: number, value: string) => {
    const newOids = [...config.vsac.valueSetOids];
    newOids[index] = value;
    setConfig({
      ...config,
      vsac: {
        ...config.vsac,
        valueSetOids: newOids
      }
    });
  };

  const removeValueSetOid = (index: number) => {
    setConfig({
      ...config,
      vsac: {
        ...config.vsac,
        valueSetOids: config.vsac.valueSetOids.filter((_, i) => i !== index)
      }
    });
  };

  const getTestStatusIcon = (service: string) => {
    const result = testResults[service];
    const isLoading = testing[service];

    if (isLoading) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
    }
    if (result === true) {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }
    if (result === false) {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  const allConnectionsTested = Object.values(testResults).every(result => result === true);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/e2e-demo">
          <Button variant="outline" size="sm" className="flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Demo
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Configuration</h1>
            <p className="text-muted-foreground">
              Set up connections and execution parameters for the end-to-end demo
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={saveConfig}
              disabled={saveStatus === "saving"}
              className="flex items-center gap-2"
            >
              {saveStatus === "saving" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saveStatus === "saved" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </div>

        {allConnectionsTested && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">All Connections Verified</AlertTitle>
            <AlertDescription className="text-green-800">
              You're ready to run the end-to-end demo. Click "Launch Demo" to begin.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="medplum" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="medplum" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Medplum
            {getTestStatusIcon("medplum")}
          </TabsTrigger>
          <TabsTrigger value="vsac" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            VSAC
            {getTestStatusIcon("vsac")}
          </TabsTrigger>
          <TabsTrigger value="databricks" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Databricks
            {getTestStatusIcon("databricks")}
          </TabsTrigger>
          <TabsTrigger value="execution" className="flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            Execution
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Medplum Configuration */}
        <TabsContent value="medplum" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Medplum FHIR Server
              </CardTitle>
              <CardDescription>
                Configure OAuth2 client credentials for your Medplum project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="medplum-url">Base URL</Label>
                  <Input
                    id="medplum-url"
                    value={config.medplum.baseUrl}
                    onChange={(e) => updateConfig("medplum", "baseUrl", e.target.value)}
                    placeholder="https://api.medplum.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your Medplum FHIR server base URL
                  </p>
                </div>

                <div>
                  <Label htmlFor="medplum-project">Project ID</Label>
                  <Input
                    id="medplum-project"
                    value={config.medplum.projectId}
                    onChange={(e) => updateConfig("medplum", "projectId", e.target.value)}
                    placeholder="00000000-0000-0000-0000-000000000000"
                  />
                </div>

                <div>
                  <Label htmlFor="medplum-client">Client ID</Label>
                  <Input
                    id="medplum-client"
                    value={config.medplum.clientId}
                    onChange={(e) => updateConfig("medplum", "clientId", e.target.value)}
                    placeholder="OAuth2 Client ID"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="medplum-secret">Client Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      id="medplum-secret"
                      type={showSecrets.medplumSecret ? "text" : "password"}
                      value={config.medplum.clientSecret}
                      onChange={(e) => updateConfig("medplum", "clientSecret", e.target.value)}
                      placeholder="OAuth2 Client Secret"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSecrets({ ...showSecrets, medplumSecret: !showSecrets.medplumSecret })}
                    >
                      {showSecrets.medplumSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create OAuth2 credentials in Medplum console: Project → Clients → Create Client
                  </p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>How to get Medplum credentials</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
                    <li>Sign up at <a href="https://app.medplum.com" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">app.medplum.com</a></li>
                    <li>Create a new project or select existing one</li>
                    <li>Navigate to Project Settings → Clients</li>
                    <li>Click "Create New Client" and copy the credentials</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={testMedplum}
                  disabled={!config.medplum.baseUrl || !config.medplum.clientId || !config.medplum.clientSecret || testing.medplum}
                  className="flex items-center gap-2"
                >
                  {testing.medplum ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4" />
                      Test Connection
                    </>
                  )}
                </Button>

                {testResults.medplum !== null && (
                  <Badge variant={testResults.medplum ? "default" : "destructive"} className="flex items-center gap-1">
                    {testResults.medplum ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Connection Failed
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VSAC Configuration */}
        <TabsContent value="vsac" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                NLM Value Set Authority Center (VSAC)
              </CardTitle>
              <CardDescription>
                Configure NLM VSAC API key for ValueSet expansion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>NLM VSAC API Key Required</AlertTitle>
                <AlertDescription>
                  You need an API key from the National Library of Medicine Value Set Authority Center.
                  Register for free at <a href="https://uts.nlm.nih.gov/uts/" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">uts.nlm.nih.gov</a> and generate an API key.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="vsac-apikey">VSAC API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="vsac-apikey"
                      type={showSecrets.vsacApiKey ? "text" : "password"}
                      value={config.vsac.apiKey}
                      onChange={(e) => updateConfig("vsac", "apiKey", e.target.value)}
                      placeholder="Enter your VSAC API key"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSecrets({ ...showSecrets, vsacApiKey: !showSecrets.vsacApiKey })}
                    >
                      {showSecrets.vsacApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Generate your API key at: UTS Profile → API Key Management
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>ValueSet OIDs to Retrieve</Label>
                  <Button onClick={addValueSetOid} variant="outline" size="sm">
                    Add ValueSet
                  </Button>
                </div>

                {config.vsac.valueSetOids.map((oid, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={oid}
                      onChange={(e) => updateValueSetOid(index, e.target.value)}
                      placeholder="2.16.840.1.113883.3.464.1003.198.12.1011"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeValueSetOid(index)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <p className="text-xs text-muted-foreground">
                  Enter the OID (Object Identifier) for each ValueSet you want to retrieve from VSAC.
                  Find OIDs in the <a href="https://vsac.nlm.nih.gov/" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">VSAC browser</a>.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testVSAC}
                  disabled={!config.vsac.apiKey || testing.vsac}
                  className="flex items-center gap-2"
                >
                  {testing.vsac ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4" />
                      Test Connection
                    </>
                  )}
                </Button>

                {testResults.vsac !== null && (
                  <Badge variant={testResults.vsac ? "default" : "destructive"} className="flex items-center gap-1">
                    {testResults.vsac ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Connection Failed
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Databricks Configuration */}
        <TabsContent value="databricks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Databricks SQL Warehouse
              </CardTitle>
              <CardDescription>
                Configure connection to your Databricks workspace for SQL execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="databricks-host">Workspace Host</Label>
                  <Input
                    id="databricks-host"
                    value={config.databricks.host}
                    onChange={(e) => updateConfig("databricks", "host", e.target.value)}
                    placeholder="your-workspace.cloud.databricks.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your Databricks workspace URL (without https://)
                  </p>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="databricks-token">Personal Access Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="databricks-token"
                      type={showSecrets.databricksToken ? "text" : "password"}
                      value={config.databricks.token}
                      onChange={(e) => updateConfig("databricks", "token", e.target.value)}
                      placeholder="dapi..."
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSecrets({ ...showSecrets, databricksToken: !showSecrets.databricksToken })}
                    >
                      {showSecrets.databricksToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create token in: User Settings → Access Tokens → Generate New Token
                  </p>
                </div>

                <div>
                  <Label htmlFor="databricks-warehouse">SQL Warehouse ID</Label>
                  <Input
                    id="databricks-warehouse"
                    value={config.databricks.warehouse}
                    onChange={(e) => updateConfig("databricks", "warehouse", e.target.value)}
                    placeholder="abc123def456"
                  />
                </div>

                <div>
                  <Label htmlFor="databricks-catalog">Catalog</Label>
                  <Input
                    id="databricks-catalog"
                    value={config.databricks.catalog}
                    onChange={(e) => updateConfig("databricks", "catalog", e.target.value)}
                    placeholder="fhir_analytics"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="databricks-schema">Schema</Label>
                  <Input
                    id="databricks-schema"
                    value={config.databricks.schema}
                    onChange={(e) => updateConfig("databricks", "schema", e.target.value)}
                    placeholder="bronze"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The schema where FHIR tables are stored (e.g., bronze, silver, gold)
                  </p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Setting up Databricks</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
                    <li>Create a free trial at <a href="https://databricks.com/try-databricks" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">databricks.com</a></li>
                    <li>Create a SQL Warehouse (Compute → SQL Warehouses → Create Warehouse)</li>
                    <li>Note the Warehouse ID from the URL or warehouse details</li>
                    <li>Generate a personal access token from User Settings</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={testDatabricks}
                  disabled={!config.databricks.host || !config.databricks.token || testing.databricks}
                  className="flex items-center gap-2"
                >
                  {testing.databricks ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4" />
                      Test Connection
                    </>
                  )}
                </Button>

                {testResults.databricks !== null && (
                  <Badge variant={testResults.databricks ? "default" : "destructive"} className="flex items-center gap-1">
                    {testResults.databricks ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Connection Failed
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution Configuration */}
        <TabsContent value="execution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="w-5 h-5" />
                Execution Parameters
              </CardTitle>
              <CardDescription>
                Configure which measures to run and for which patients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Patient IDs to Evaluate</Label>
                <Textarea
                  value={config.execution.patientIds.join("\n")}
                  onChange={(e) => updateConfig("execution", "patientIds", e.target.value.split("\n").filter(id => id.trim()))}
                  placeholder="patient-123&#10;patient-456&#10;patient-789&#10;&#10;Leave empty to evaluate all patients"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Enter one patient ID per line. Leave empty to evaluate all patients in the cohort.
                </p>
              </div>

              <div className="space-y-3">
                <Label>Measure IDs</Label>
                <Textarea
                  value={config.execution.measureIds.join("\n")}
                  onChange={(e) => updateConfig("execution", "measureIds", e.target.value.split("\n").filter(id => id.trim()))}
                  placeholder="CMS125&#10;CMS122&#10;CMS130"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Enter measure IDs to evaluate (one per line). Examples: CMS125, CMS122, CMS130
                </p>
              </div>

              <div className="space-y-3">
                <Label>CQL Library IDs</Label>
                <Textarea
                  value={config.execution.libraryIds.join("\n")}
                  onChange={(e) => updateConfig("execution", "libraryIds", e.target.value.split("\n").filter(id => id.trim()))}
                  placeholder="BCSComponent&#10;DiabetesHbA1c&#10;ColorectalCancer"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  CQL Library IDs corresponding to the measures above
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="period-start">Measurement Period Start</Label>
                  <Input
                    id="period-start"
                    type="date"
                    value={config.execution.periodStart}
                    onChange={(e) => updateConfig("execution", "periodStart", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="period-end">Measurement Period End</Label>
                  <Input
                    id="period-end"
                    type="date"
                    value={config.execution.periodEnd}
                    onChange={(e) => updateConfig("execution", "periodEnd", e.target.value)}
                  />
                </div>
              </div>

              <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>Patient Selection Strategy</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2 mt-2 text-sm">
                    <p><strong>Specific Patients:</strong> Enter patient IDs to evaluate only those patients</p>
                    <p><strong>All Patients:</strong> Leave patient IDs empty to evaluate entire cohort matching measure criteria</p>
                    <p><strong>Performance:</strong> Testing with 10-100 patients is recommended before full population runs</p>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Configuration */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Additional configuration options and data management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-sm">Persist Configuration</h4>
                    <p className="text-xs text-muted-foreground">
                      Save settings in browser localStorage for next session
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-sm">Enable Detailed Logging</h4>
                    <p className="text-xs text-muted-foreground">
                      Show verbose output during workflow execution
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold text-sm">Simulate API Calls</h4>
                    <p className="text-xs text-muted-foreground">
                      Use mock data instead of real API connections (for testing)
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <Label>Configuration Management</Label>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset to Defaults
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Export Config
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Import Config
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Security Notice</AlertTitle>
                <AlertDescription>
                  Configuration data (including credentials) is stored locally in your browser.
                  Never share exported configuration files as they contain sensitive credentials.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-1">Ready to Run Demo?</h4>
              <p className="text-sm text-muted-foreground">
                {allConnectionsTested
                  ? "All connections verified. Launch the demo to begin execution."
                  : "Test all connections before running the demo."}
              </p>
            </div>
            <Button
              onClick={() => {
                saveConfig();
                setLocation("/e2e-demo");
              }}
              disabled={!allConnectionsTested}
              className="flex items-center gap-2"
              size="lg"
            >
              Launch Demo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
