import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FolderOpen, X, Download, FileJson, CheckCircle2 } from "lucide-react";
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 min-h-0">
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-lg">
            <FileJson className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">FHIR Data</h2>
            <p className="text-xs text-slate-500">Upload or load sample resources</p>
          </div>
        </div>
      </div>
      <div className="p-4 flex-1 overflow-auto">
        {!bundle ? (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
              isDragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 mb-1">Drop FHIR Bundle Here</p>
            <p className="text-xs text-slate-500 mb-3">or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              className="hidden"
              accept=".json"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
          </div>
        ) : (
          <Card className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  {bundle.id || 'fhir-bundle.json'}
                </span>
                <span className="text-xs text-slate-500">({stats?.sizeKB} KB)</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeBundle}
                className="text-slate-400 hover:text-slate-600 h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {stats && (
              <p className="text-xs text-slate-600 mt-2">
                {stats.patients} patients, {stats.observations} observations, {stats.conditions} conditions
              </p>
            )}
          </Card>
        )}

        {/* Sample Data Options */}
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Sample Data</h3>
          <div className="space-y-2">
            {sampleDatasets.map((dataset) => (
              <Button
                key={dataset.id}
                variant="outline"
                className="w-full text-left p-2.5 h-auto justify-start border-slate-200 hover:bg-slate-50"
                onClick={() => loadSampleData(dataset.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{dataset.name}</p>
                    <p className="text-xs text-slate-500">{dataset.description}</p>
                  </div>
                  <Download className="w-4 h-4 text-slate-400" />
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
