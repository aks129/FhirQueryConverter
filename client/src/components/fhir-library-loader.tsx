import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Database, Loader2, Library, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FhirLibrary {
  id: string;
  name: string;
  title?: string;
  version?: string;
  description?: string;
}

interface FhirLibraryLoaderProps {
  onCqlLoaded: (cql: string, libraryName: string) => void;
}

// Default Medplum demo credentials
const DEFAULT_FHIR_URL = "https://api.medplum.com/fhir/R4";
const DEFAULT_CLIENT_ID = "0a0fe17a-6013-4c65-a2ab-e8eecf328bbb";
const DEFAULT_CLIENT_SECRET = "0f9286290fd9d27c07eeb2bb4e84c624ebf08b5be8a0dbdfda6c42f775e167cd";

export function FhirLibraryLoader({ onCqlLoaded }: FhirLibraryLoaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [fhirUrl, setFhirUrl] = useState(DEFAULT_FHIR_URL);
  const [clientId, setClientId] = useState(DEFAULT_CLIENT_ID);
  const [clientSecret, setClientSecret] = useState(DEFAULT_CLIENT_SECRET);

  const [libraries, setLibraries] = useState<FhirLibrary[]>([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>("");

  const { toast } = useToast();

  const getTokenUrl = (fhirBaseUrl: string) => {
    // Extract base URL and construct OAuth token endpoint
    const url = new URL(fhirBaseUrl);
    return `${url.origin}/oauth2/token`;
  };

  const connectToServer = async () => {
    setIsConnecting(true);
    try {
      // Get OAuth token
      const tokenUrl = getTokenUrl(fhirUrl);
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Authentication failed: ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();
      const token = tokenData.access_token;
      setAccessToken(token);

      // Fetch Library resources
      const libraryResponse = await fetch(`${fhirUrl}/Library?_count=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/fhir+json',
        },
      });

      if (!libraryResponse.ok) {
        throw new Error(`Failed to fetch libraries: ${libraryResponse.statusText}`);
      }

      const libraryBundle = await libraryResponse.json();
      const libraryList: FhirLibrary[] = (libraryBundle.entry || [])
        .map((entry: any) => entry.resource)
        .filter((resource: any) => resource.resourceType === 'Library')
        .map((lib: any) => ({
          id: lib.id,
          name: lib.name || lib.id,
          title: lib.title,
          version: lib.version,
          description: lib.description,
        }));

      setLibraries(libraryList);
      setIsConnected(true);

      toast({
        title: "Connected to FHIR Server",
        description: `Found ${libraryList.length} Library resources`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const loadSelectedLibrary = async () => {
    if (!selectedLibraryId || !accessToken) return;

    setIsLoadingLibrary(true);
    try {
      const response = await fetch(`${fhirUrl}/Library/${selectedLibraryId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/fhir+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch library: ${response.statusText}`);
      }

      const library = await response.json();

      // Find CQL content (text/cql content type)
      const cqlContent = library.content?.find(
        (c: any) => c.contentType === 'text/cql' || c.contentType === 'text/cql-library'
      );

      if (!cqlContent?.data) {
        throw new Error("No CQL content found in Library resource");
      }

      // Decode base64 CQL
      const cql = atob(cqlContent.data);
      const libraryName = library.title || library.name || library.id;

      onCqlLoaded(cql, libraryName);
      setIsOpen(false);

      toast({
        title: "CQL Loaded",
        description: `Loaded "${libraryName}" from FHIR server`,
      });
    } catch (error) {
      toast({
        title: "Failed to Load Library",
        description: error instanceof Error ? error.message : "Failed to load",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const resetConnection = () => {
    setIsConnected(false);
    setAccessToken(null);
    setLibraries([]);
    setSelectedLibraryId("");
  };

  const selectedLibrary = libraries.find(l => l.id === selectedLibraryId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-sm"
        >
          <Database className="w-4 h-4 mr-1" />
          Load from FHIR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Load CQL from FHIR Server
          </DialogTitle>
          <DialogDescription>
            Connect to a FHIR server and select a Library resource containing CQL
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!isConnected ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="fhir-url">FHIR Server URL</Label>
                <Input
                  id="fhir-url"
                  value={fhirUrl}
                  onChange={(e) => setFhirUrl(e.target.value)}
                  placeholder="https://api.medplum.com/fhir/R4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-id">Client ID</Label>
                <Input
                  id="client-id"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="OAuth Client ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-secret">Client Secret</Label>
                <Input
                  id="client-secret"
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="OAuth Client Secret"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                <p className="font-medium">Demo Mode</p>
                <p className="text-xs mt-1">Pre-configured with Medplum demo credentials</p>
              </div>

              <Button
                onClick={connectToServer}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Connect to Server
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="bg-green-50 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium">Connected</span>
                  <span className="text-xs text-green-600">({libraries.length} libraries)</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetConnection}
                  className="text-xs"
                >
                  Disconnect
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Select Library</Label>
                <Select value={selectedLibraryId} onValueChange={setSelectedLibraryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a CQL Library..." />
                  </SelectTrigger>
                  <SelectContent>
                    {libraries.map((lib) => (
                      <SelectItem key={lib.id} value={lib.id}>
                        <div className="flex items-center gap-2">
                          <Library className="w-4 h-4" />
                          <span>{lib.title || lib.name}</span>
                          {lib.version && (
                            <span className="text-xs text-gray-500">v{lib.version}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedLibrary && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p className="font-medium">{selectedLibrary.title || selectedLibrary.name}</p>
                  {selectedLibrary.version && (
                    <p className="text-xs text-gray-600">Version: {selectedLibrary.version}</p>
                  )}
                  {selectedLibrary.description && (
                    <p className="text-xs text-gray-600 mt-1">{selectedLibrary.description}</p>
                  )}
                </div>
              )}

              <Button
                onClick={loadSelectedLibrary}
                disabled={!selectedLibraryId || isLoadingLibrary}
                className="w-full"
              >
                {isLoadingLibrary ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading CQL...
                  </>
                ) : (
                  <>
                    <Library className="w-4 h-4 mr-2" />
                    Load CQL
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
