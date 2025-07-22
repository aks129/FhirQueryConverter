import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FolderOpen, X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FhirBundle } from "@/types/fhir";
import { validateFhirBundle, getBundleStats } from "@/lib/fhir-utils";
import { sampleDatasets } from "@/lib/sample-data";

interface FhirUploadProps {
  bundle: FhirBundle | null;
  onBundleChange: (bundle: FhirBundle | null) => void;
}

export function FhirUpload({ bundle, onBundleChange }: FhirUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    try {
      if (!file.name.endsWith('.json')) {
        throw new Error('Only JSON files are supported');
      }

      const text = await file.text();
      const data = JSON.parse(text);
      
      const validation = validateFhirBundle(data);
      if (!validation.isValid) {
        throw new Error(`Invalid FHIR Bundle: ${validation.errors.join(', ')}`);
      }

      onBundleChange(validation.bundle!);
      
      const stats = getBundleStats(validation.bundle!);
      toast({
        title: "FHIR Bundle Loaded",
        description: `Successfully loaded ${stats.totalResources} resources (${stats.sizeKB} KB)`,
      });
    } catch (error) {
      toast({
        title: "File Upload Failed",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const loadSampleData = (datasetId: string) => {
    const dataset = sampleDatasets.find(d => d.id === datasetId);
    if (dataset) {
      onBundleChange(dataset.bundle);
      toast({
        title: "Sample Data Loaded",
        description: `Loaded ${dataset.name}`,
      });
    }
  };

  const removeBundle = () => {
    onBundleChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "FHIR Bundle Removed",
      description: "Bundle has been removed",
    });
  };

  const stats = bundle ? getBundleStats(bundle) : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-1/2">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <Upload className="w-5 h-5 text-blue-600 mr-2" />
          FHIR Data Bundle
        </h2>
        <p className="text-sm text-gray-600 mt-1">Upload or load sample FHIR resources</p>
      </div>
      <div className="p-6">
        {!bundle ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-600 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-600'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Drop FHIR Bundle Here</p>
            <p className="text-sm text-gray-600 mb-4">or click to browse files</p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              className="hidden"
              accept=".json"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
          </div>
        ) : (
          <Card className="p-3 bg-green-50 border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <i className="fas fa-file-alt text-green-600"></i>
                <span className="text-sm font-medium text-green-600">
                  {bundle.id || 'fhir-bundle.json'}
                </span>
                <span className="text-xs text-gray-600">({stats?.sizeKB} KB)</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeBundle}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {stats && (
              <p className="text-xs text-gray-600 mt-1">
                ✓ Valid FHIR Bundle - {stats.patients} patients, {stats.observations} observations, {stats.conditions} conditions
              </p>
            )}
          </Card>
        )}

        {/* Sample Data Options */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Sample Data Sets</h3>
          <div className="space-y-2">
            {sampleDatasets.map((dataset) => (
              <Button
                key={dataset.id}
                variant="outline"
                className="w-full text-left p-3 h-auto justify-start"
                onClick={() => loadSampleData(dataset.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{dataset.name}</p>
                    <p className="text-xs text-gray-600">{dataset.description}</p>
                  </div>
                  <Download className="w-4 h-4 text-gray-400" />
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
